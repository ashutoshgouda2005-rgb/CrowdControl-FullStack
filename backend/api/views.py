from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.utils import timezone
from django.core.paginator import Paginator
from django.db.models import Q, Avg
from django.db import models
import json
import base64
import time
import traceback
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from .models import MediaUpload, LiveStream, AnalysisResult, Alert
from .serializers import (
    UserSerializer, UserRegistrationSerializer, MediaUploadSerializer,
    LiveStreamSerializer, AnalysisResultSerializer, AlertSerializer
)
from .ai_predictor_fixed import get_predictor


@api_view(['GET'])
@permission_classes([AllowAny])
def api_root(request):
    """Shows all available API endpoints - like a directory"""
    return Response({
        'message': 'CrowdControl API v1.0',
        'description': 'AI-powered crowd control and stampede detection system',
        'endpoints': {
            'health': '/api/health/',
            'authentication': {
                'register': '/api/auth/register/',
                'login': '/api/auth/login/',
                'profile': '/api/auth/profile/',
            },
            'media': {
                'upload': '/api/media/upload/',
                'list': '/api/media/list/',
                'detail': '/api/media/{id}/',
            },
            'streams': {
                'create': '/api/streams/create/',
                'list': '/api/streams/list/',
                'detail': '/api/streams/{id}/',
                'start': '/api/streams/{id}/start/',
                'stop': '/api/streams/{id}/stop/',
            },
            'analysis': {
                'frame': '/api/analysis/frame/',
                'results': '/api/analysis/results/',
            },
            'alerts': {
                'list': '/api/alerts/',
                'acknowledge': '/api/alerts/{id}/acknowledge/',
            }
        },
        'status': 'healthy',
        'timestamp': timezone.now().isoformat()
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """Creates a new user account"""
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """Logs in a user and returns auth tokens"""
    username = request.data.get('username')
    password = request.data.get('password')
    
    if not username or not password:
        return Response({
            'error': 'Username and password are required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    user = authenticate(username=username, password=password)
    if user:
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        })
    
    return Response({
        'error': 'Invalid credentials'
    }, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile(request):
    """Get user profile"""
    return Response(UserSerializer(request.user).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_media(request):
    """Upload photo or video for analysis"""
    try:
        # Log the incoming request for debugging
        print(f"Upload request from user: {request.user.username}")
        print(f"Files: {list(request.FILES.keys())}")
        print(f"Data: {dict(request.data)}")
        
        # Validate file presence
        if 'file' not in request.FILES:
            return Response({
                'error': 'No file provided',
                'detail': 'Please select a file to upload'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        file_obj = request.FILES['file']
        
        # Validate file size (100MB limit)
        max_size = 100 * 1024 * 1024  # 100MB
        if file_obj.size > max_size:
            return Response({
                'error': 'File too large',
                'detail': f'File size ({file_obj.size / (1024*1024):.1f}MB) exceeds the 100MB limit'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate file type
        allowed_types = [
            'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
            'video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm'
        ]
        if file_obj.content_type not in allowed_types:
            return Response({
                'error': 'Invalid file type',
                'detail': f'File type {file_obj.content_type} is not supported. Allowed types: images (JPEG, PNG, WebP, GIF) and videos (MP4, AVI, MOV, WMV, WebM)'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = MediaUploadSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            media_upload = serializer.save()
            
            # Run AI analysis in the background so user doesn't have to wait
            import threading
            analysis_thread = threading.Thread(target=analyze_media_async, args=(media_upload.id,))
            analysis_thread.daemon = True
            analysis_thread.start()
            
            return Response(MediaUploadSerializer(media_upload).data, status=status.HTTP_201_CREATED)
        else:
            # Return detailed validation errors
            error_details = []
            for field, errors in serializer.errors.items():
                for error in errors:
                    error_details.append(f"{field}: {error}")
            
            return Response({
                'error': 'Validation failed',
                'detail': '; '.join(error_details),
                'field_errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        print(f"Upload error: {str(e)}")
        return Response({
            'error': 'Upload failed',
            'detail': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_media_upload_detail(request, upload_id):
    """Get detailed information about a specific media upload including analysis results"""
    try:
        media_upload = MediaUpload.objects.get(id=upload_id, user=request.user)
        
        # Get the serialized data
        upload_data = MediaUploadSerializer(media_upload).data
        
        # Add detailed analysis information
        if media_upload.analysis_result:
            analysis_result = media_upload.analysis_result
            
            # Check if analysis failed and provide specific error messages
            if not analysis_result.get('success', True):
                upload_data['analysis_error'] = {
                    'error': analysis_result.get('error', 'Analysis failed'),
                    'detail': analysis_result.get('detail', 'No additional details available'),
                    'recommendations': [
                        'Try uploading a different image',
                        'Ensure the image is clear and well-lit',
                        'Check that the file is a valid image format (JPEG, PNG, WebP)',
                        'Contact support if the issue persists'
                    ]
                }
            else:
                # Analysis was successful, provide detailed results
                upload_data['analysis_success'] = {
                    'people_count': analysis_result.get('people_count', 0),
                    'confidence_score': analysis_result.get('confidence_score', 0.0),
                    'crowd_detected': analysis_result.get('crowd_detected', False),
                    'is_stampede_risk': analysis_result.get('is_stampede_risk', False),
                    'status_message': analysis_result.get('status_message', 'Analysis completed'),
                    'recommendations': analysis_result.get('recommendations', []),
                    'processing_time': analysis_result.get('processing_time', 0.0),
                    'fallback_mode': analysis_result.get('fallback_mode', False)
                }
        
        return Response(upload_data)
        
    except MediaUpload.DoesNotExist:
        return Response({
            'error': 'Upload not found',
            'detail': 'The requested upload could not be found or you do not have permission to access it.'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': 'Failed to retrieve upload details',
            'detail': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_media_uploads(request):
    """List user's media uploads with pagination"""
    uploads = MediaUpload.objects.filter(user=request.user)
    
    # Let users filter by photo/video if they want
    media_type = request.GET.get('media_type')
    if media_type:
        uploads = uploads.filter(media_type=media_type)
    
    # Also filter by whether analysis is done or not
    analysis_status = request.GET.get('analysis_status')
    if analysis_status:
        uploads = uploads.filter(analysis_status=analysis_status)
    
    # Pagination
    page = int(request.GET.get('page', 1))
    page_size = int(request.GET.get('page_size', 10))
    paginator = Paginator(uploads, page_size)
    page_obj = paginator.get_page(page)
    
    return Response({
        'results': MediaUploadSerializer(page_obj.object_list, many=True).data,
        'count': paginator.count,
        'num_pages': paginator.num_pages,
        'current_page': page,
        'has_next': page_obj.has_next(),
        'has_previous': page_obj.has_previous()
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_media_upload(request, upload_id):
    """Get specific media upload details"""
    try:
        upload = MediaUpload.objects.get(id=upload_id, user=request.user)
        return Response(MediaUploadSerializer(upload).data)
    except MediaUpload.DoesNotExist:
        return Response({'error': 'Media upload not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_live_stream(request):
    """Create a new live stream"""
    serializer = LiveStreamSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        live_stream = serializer.save()
        return Response(LiveStreamSerializer(live_stream).data, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_live_streams(request):
    """List user's live streams"""
    streams = LiveStream.objects.filter(user=request.user)
    return Response(LiveStreamSerializer(streams, many=True).data)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def manage_live_stream(request, stream_id):
    """Get, update, or delete a live stream"""
    try:
        stream = LiveStream.objects.get(id=stream_id, user=request.user)
    except LiveStream.DoesNotExist:
        return Response({'error': 'Live stream not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        return Response(LiveStreamSerializer(stream).data)
    
    elif request.method == 'PUT':
        serializer = LiveStreamSerializer(stream, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            stream = serializer.save()
            return Response(LiveStreamSerializer(stream).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        stream.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def start_stream(request, stream_id):
    """Start a live stream"""
    try:
        stream = LiveStream.objects.get(id=stream_id, user=request.user)
        stream.status = 'active'
        stream.last_active = timezone.now()
        stream.save()
        
        return Response({
            'message': 'Stream started successfully',
            'stream': LiveStreamSerializer(stream).data
        })
    except LiveStream.DoesNotExist:
        return Response({'error': 'Live stream not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def stop_stream(request, stream_id):
    """Stop a live stream"""
    try:
        stream = LiveStream.objects.get(id=stream_id, user=request.user)
        stream.status = 'inactive'
        stream.save()
        
        return Response({
            'message': 'Stream stopped successfully',
            'stream': LiveStreamSerializer(stream).data
        })
    except LiveStream.DoesNotExist:
        return Response({'error': 'Live stream not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def analyze_frame(request):
    """Analyze a single frame from live stream"""
    try:
        stream_id = request.data.get('stream_id')
        frame_data = request.data.get('frame_data')  # Base64 encoded image
        
        if not stream_id or not frame_data:
            return Response({
                'error': 'stream_id and frame_data are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Make sure this stream belongs to the current user
        try:
            stream = LiveStream.objects.get(id=stream_id, user=request.user)
        except LiveStream.DoesNotExist:
            return Response({'error': 'Live stream not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Analyze frame with enhanced error handling
        start_time = time.time()
        try:
            predictor = get_predictor()
            print(f"Analyzing frame for stream {stream_id}...")
            analysis = predictor.predict_crowd(frame_data)
            processing_time = time.time() - start_time
            print(f"Analysis completed in {processing_time:.3f}s: {analysis}")
            
            # Handle analysis errors
            if 'error' in analysis:
                print(f"Analysis error: {analysis['error']}")
                return Response({
                    'error': analysis['error'],
                    'fallback_mode': True
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        except Exception as e:
            processing_time = time.time() - start_time
            print(f"Frame analysis exception: {str(e)}")
            import traceback
            traceback.print_exc()
            
            # Return fallback analysis instead of error
            analysis = {
                'crowd_detected': False,
                'confidence_score': 0.5,
                'people_count': 1,
                'is_stampede_risk': False,
                'fallback_mode': True,
                'error': str(e)
            }
        
        # Update stream status
        stream.current_crowd_status = analysis['crowd_detected']
        stream.current_people_count = analysis['people_count']
        stream.current_confidence = analysis['confidence_score']
        stream.last_active = timezone.now()
        stream.save()
        
        # Save analysis result
        analysis_result = AnalysisResult.objects.create(
            live_stream=stream,
            crowd_detected=analysis['crowd_detected'],
            confidence_score=analysis['confidence_score'],
            people_count=analysis['people_count'],
            is_stampede_risk=analysis['is_stampede_risk'],
            processing_time=processing_time
        )

        # Temporal smoothing over recent frames to reduce jitter and false positives
        try:
            recent_results = AnalysisResult.objects.filter(
                live_stream=stream
            ).order_by('-timestamp')[:5]
            counts = [r.people_count for r in recent_results if r.people_count is not None]
            risks = [1 if r.is_stampede_risk else 0 for r in recent_results]
            smoothed_people = int(round(sum(counts) / len(counts))) if counts else analysis['people_count']
            smoothed_risk_flag = (sum(risks) >= max(2, len(risks) // 2)) if risks else analysis['is_stampede_risk']
        except Exception:
            smoothed_people = analysis['people_count']
            smoothed_risk_flag = analysis['is_stampede_risk']

        # Compute a normalized risk score to share with clients (0..1)
        try:
            raw_score = min(1.0, analysis['people_count'] / 12.0)
            conf_boost = max(0.0, min(1.0, analysis['confidence_score']))
            risk_score = round(0.5 * raw_score + 0.5 * conf_boost * raw_score, 3)
        except Exception:
            risk_score = 0.0

        # Send real-time updates to anyone watching this stream
        try:
            channel_layer = get_channel_layer()
            if channel_layer:
                async_to_sync(channel_layer.group_send)(
                    f'stream_{stream.id}',
                    {
                        'type': 'stream_update',
                        'data': {
                            'stream_id': stream.id,
                            'timestamp': timezone.now().isoformat(),
                            'analysis': {
                                **analysis,
                                'risk_score': risk_score,
                                'smoothed_people_count': smoothed_people,
                                'smoothed_risk': smoothed_risk_flag,
                            },
                        }
                    }
                )
        except Exception as e:
            print(f"WebSocket broadcast error: {str(e)}")

        # If AI thinks there's danger, create an alert
        if analysis['is_stampede_risk'] or smoothed_risk_flag:
            Alert.objects.create(
                alert_type='stampede_risk',
                severity='critical' if analysis['is_stampede_risk'] else 'high',
                message=(
                    f'Stampede risk detected in stream {stream.stream_name}. '
                    f'People (raw/smoothed): {analysis["people_count"]}/{smoothed_people}, '
                    f'Confidence: {analysis["confidence_score"]:.2f}, '
                    f'Risk score: {risk_score:.2f}'
                ),
                analysis_result=analysis_result,
                live_stream=stream
            )
            # Send alert to all connected users immediately
            try:
                if channel_layer:
                    async_to_sync(channel_layer.group_send)(
                        'alerts',
                        {
                            'type': 'alert_message',
                            'data': {
                                'alert_type': 'stampede_risk',
                                'severity': 'critical' if analysis['is_stampede_risk'] else 'high',
                                'message': (
                                    f'Stampede risk detected in stream {stream.stream_name} '
                                    f'(smoothed people={smoothed_people}, score={risk_score:.2f}).'
                                ),
                                'stream_id': stream.id,
                                'timestamp': timezone.now().isoformat(),
                            }
                        }
                    )
            except Exception as e:
                print(f"Alert broadcast error: {str(e)}")
        
        return Response({
            'analysis': analysis,
            'processing_time': processing_time,
            'stream_status': LiveStreamSerializer(stream).data
        })
        
    except Exception as e:
        return Response({
            'error': f'Analysis failed: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_analysis_results(request):
    """Get analysis results with filtering"""
    results = AnalysisResult.objects.all()
    
    # Filter by user's content
    user_media_uploads = MediaUpload.objects.filter(user=request.user)
    user_streams = LiveStream.objects.filter(user=request.user)
    results = results.filter(
        Q(media_upload__in=user_media_uploads) | Q(live_stream__in=user_streams)
    )
    
    # Filter by type
    result_type = request.GET.get('type')  # 'media' or 'stream'
    if result_type == 'media':
        results = results.filter(media_upload__isnull=False)
    elif result_type == 'stream':
        results = results.filter(live_stream__isnull=False)
    
    # Filter by stampede risk
    stampede_only = request.GET.get('stampede_only')
    if stampede_only == 'true':
        results = results.filter(is_stampede_risk=True)
    
    # Pagination
    page = int(request.GET.get('page', 1))
    page_size = int(request.GET.get('page_size', 20))
    paginator = Paginator(results, page_size)
    page_obj = paginator.get_page(page)
    
    return Response({
        'results': AnalysisResultSerializer(page_obj.object_list, many=True).data,
        'count': paginator.count,
        'num_pages': paginator.num_pages,
        'current_page': page,
        'has_next': page_obj.has_next(),
        'has_previous': page_obj.has_previous()
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_alerts(request):
    """Get alerts for user's content"""
    # Get alerts for user's analysis results and streams
    user_media_uploads = MediaUpload.objects.filter(user=request.user)
    user_streams = LiveStream.objects.filter(user=request.user)
    user_analysis_results = AnalysisResult.objects.filter(
        Q(media_upload__in=user_media_uploads) | Q(live_stream__in=user_streams)
    )
    
    alerts = Alert.objects.filter(
        Q(analysis_result__in=user_analysis_results) | Q(live_stream__in=user_streams)
    )
    
    # Filter by acknowledged status
    acknowledged = request.GET.get('acknowledged')
    if acknowledged == 'true':
        alerts = alerts.filter(acknowledged=True)
    elif acknowledged == 'false':
        alerts = alerts.filter(acknowledged=False)
    
    # Filter by severity
    severity = request.GET.get('severity')
    if severity:
        alerts = alerts.filter(severity=severity)
    
    # Pagination
    page = int(request.GET.get('page', 1))
    page_size = int(request.GET.get('page_size', 20))
    paginator = Paginator(alerts, page_size)
    page_obj = paginator.get_page(page)
    
    return Response({
        'results': AlertSerializer(page_obj.object_list, many=True).data,
        'count': paginator.count,
        'num_pages': paginator.num_pages,
        'current_page': page,
        'has_next': page_obj.has_next(),
        'has_previous': page_obj.has_previous()
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def acknowledge_alert(request, alert_id):
    """Acknowledge an alert"""
    try:
        alert = Alert.objects.get(id=alert_id)
        
        # Check if user has permission to acknowledge this alert
        user_media_uploads = MediaUpload.objects.filter(user=request.user)
        user_streams = LiveStream.objects.filter(user=request.user)
        user_analysis_results = AnalysisResult.objects.filter(
            Q(media_upload__in=user_media_uploads) | Q(live_stream__in=user_streams)
        )
        
        if not (alert.analysis_result in user_analysis_results or alert.live_stream in user_streams):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        alert.acknowledged = True
        alert.acknowledged_by = request.user
        alert.acknowledged_at = timezone.now()
        alert.save()
        
        return Response({
            'message': 'Alert acknowledged successfully',
            'alert': AlertSerializer(alert).data
        })
        
    except Alert.DoesNotExist:
        return Response({'error': 'Alert not found'}, status=status.HTTP_404_NOT_FOUND)


def analyze_media_async(media_upload_id):
    """Analyze uploaded media asynchronously with comprehensive error handling"""
    try:
        media_upload = MediaUpload.objects.get(id=media_upload_id)
        media_upload.analysis_status = 'processing'
        media_upload.save()
        
        print(f"🔍 Starting analysis for media upload {media_upload_id}: {media_upload.filename}")
        
        # Use the fixed AI predictor with comprehensive error handling
        start_time = time.time()
        try:
            # Import the fixed predictor
            from .ai_predictor_fixed import get_predictor
            predictor = get_predictor()
            analysis = predictor.predict_from_file(media_upload.file.path)
            
            print(f"✅ Analysis completed successfully: {analysis}")
            
            # Check if analysis was successful
            if not analysis.get('success', True):
                # Analysis failed but we have specific error information
                media_upload.analysis_status = 'failed'
                media_upload.analysis_result = analysis
                media_upload.save()
                
                print(f"❌ Analysis failed with specific error: {analysis.get('error', 'Unknown error')}")
                return  # Exit early, don't create analysis result
                
        except Exception as e:
            print(f"🚨 Critical ML prediction error: {str(e)}")
            print(f"📋 Traceback: {traceback.format_exc()}")
            
            # Create a detailed error analysis result
            analysis = {
                'success': False,
                'error': 'AI system unavailable',
                'detail': f'The AI analysis system encountered an error: {str(e)}. Using basic fallback analysis.',
                'crowd_detected': False,
                'confidence_score': 0.0,
                'people_count': 0,
                'is_stampede_risk': False,
                'status_message': f"Analysis system error: {str(e)}",
                'fallback_mode': True,
                'error_type': type(e).__name__,
                'processing_time': time.time() - start_time
            }
        
        processing_time = time.time() - start_time
        
        # Always complete the analysis, even with errors
        media_upload.analysis_status = 'completed'
        media_upload.crowd_detected = analysis.get('crowd_detected', False)
        media_upload.confidence_score = analysis.get('confidence_score', 0.0)
        media_upload.people_count = analysis.get('people_count', 0)
        media_upload.is_stampede_risk = analysis.get('is_stampede_risk', False)
        media_upload.analysis_completed_at = timezone.now()
        
        # Store the full analysis result as JSON
        media_upload.analysis_result = analysis
        media_upload.save()
        
        print(f"Media upload {media_upload_id} analysis completed successfully")
        
        # Save detailed analysis result
        analysis_result = AnalysisResult.objects.create(
            media_upload=media_upload,
            crowd_detected=analysis.get('crowd_detected', False),
            confidence_score=analysis.get('confidence_score', 0.0),
            people_count=analysis.get('people_count', 0),
            is_stampede_risk=analysis.get('is_stampede_risk', False),
            processing_time=processing_time
        )
        
        # Create alert if stampede risk detected
        if analysis.get('is_stampede_risk', False):
            alert_message = analysis.get('status_message', 
                f'Stampede risk detected in uploaded {media_upload.media_type} '
                f'"{media_upload.filename}". '
                f'People count: {analysis.get("people_count", 0)}, '
                f'Confidence: {analysis.get("confidence_score", 0):.2f}')
            
            Alert.objects.create(
                alert_type='stampede_risk',
                severity='high',
                message=alert_message,
                analysis_result=analysis_result
            )
            print(f"Stampede risk alert created for media upload {media_upload_id}")
        
    except Exception as e:
        print(f"Critical error analyzing media {media_upload_id}: {str(e)}")
        try:
            media_upload = MediaUpload.objects.get(id=media_upload_id)
            media_upload.analysis_status = 'failed'
            media_upload.save()
            print(f"Marked media upload {media_upload_id} as failed")
        except Exception as save_error:
            print(f"Failed to update media upload status: {str(save_error)}")
            pass


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """Enhanced health check endpoint for deployment monitoring and debugging"""
    try:
        import os
        from django.conf import settings
        
        # Check database connection
        from django.db import connection
        db_status = "connected"
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
        except Exception as db_error:
            db_status = f"error: {str(db_error)}"
        
        # Check if ML predictor can be loaded (with fallback)
        predictor_status = "available"
        predictor_info = {}
        try:
            predictor = get_predictor()
            if predictor is None:
                predictor_status = "demo_mode"
                predictor_info = {"mode": "demo", "reason": "ML model not available"}
            else:
                predictor_info = {"mode": "production", "model_loaded": True}
        except Exception as pred_error:
            predictor_status = "demo_mode"
            predictor_info = {"mode": "demo", "error": str(pred_error)}
        
        # Check file upload configuration
        upload_config = {
            "max_file_size": getattr(settings, 'FILE_UPLOAD_MAX_MEMORY_SIZE', 'not_set'),
            "max_data_size": getattr(settings, 'DATA_UPLOAD_MAX_MEMORY_SIZE', 'not_set'),
            "media_root": getattr(settings, 'MEDIA_ROOT', 'not_set'),
        }
        
        # Check CORS configuration
        cors_config = {
            "allow_all_origins": getattr(settings, 'CORS_ALLOW_ALL_ORIGINS', False),
            "allowed_origins": getattr(settings, 'CORS_ALLOWED_ORIGINS', []),
            "allow_credentials": getattr(settings, 'CORS_ALLOW_CREDENTIALS', False),
        }
        
        # System information
        system_info = {
            "debug_mode": settings.DEBUG,
            "environment": os.environ.get('ENVIRONMENT', 'development'),
            "python_version": f"{os.sys.version_info.major}.{os.sys.version_info.minor}.{os.sys.version_info.micro}",
        }
        
        return Response({
            'status': 'healthy',
            'timestamp': timezone.now().isoformat(),
            'database': db_status,
            'ml_predictor': predictor_status,
            'predictor_info': predictor_info,
            'upload_config': upload_config,
            'cors_config': cors_config,
            'system_info': system_info,
            'version': '1.0.0',
            'endpoints': {
                'auth': '/api/auth/',
                'media': '/api/media/',
                'analysis': '/api/analysis/',
                'health': '/api/health/'
            }
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        return Response({
            'status': 'unhealthy',
            'timestamp': timezone.now().isoformat(),
            'error': str(e),
            'version': '1.0.0'
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)


# Missing JWT Token Refresh Endpoint
@api_view(['POST'])
@permission_classes([AllowAny])
def token_refresh(request):
    """Refresh JWT access token using refresh token"""
    try:
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response({
                'error': 'Refresh token is required',
                'detail': 'Please provide a valid refresh token'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            refresh = RefreshToken(refresh_token)
            access_token = str(refresh.access_token)
            
            return Response({
                'access': access_token,
                'message': 'Token refreshed successfully'
            }, status=status.HTTP_200_OK)
            
        except Exception as token_error:
            return Response({
                'error': 'Invalid refresh token',
                'detail': 'The provided refresh token is invalid or expired'
            }, status=status.HTTP_401_UNAUTHORIZED)
            
    except Exception as e:
        return Response({
            'error': 'Token refresh failed',
            'detail': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Missing Analytics Endpoint
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_analytics(request):
    """Get analysis analytics and statistics"""
    try:
        time_range = request.GET.get('time_range', '24h')
        
        # Calculate time filter based on range
        from datetime import datetime, timedelta
        now = timezone.now()
        
        if time_range == '1h':
            start_time = now - timedelta(hours=1)
        elif time_range == '24h':
            start_time = now - timedelta(hours=24)
        elif time_range == '7d':
            start_time = now - timedelta(days=7)
        elif time_range == '30d':
            start_time = now - timedelta(days=30)
        else:
            start_time = now - timedelta(hours=24)  # Default to 24h
        
        # Get analysis results in time range
        results = AnalysisResult.objects.filter(
            timestamp__gte=start_time
        ).order_by('-timestamp')
        
        # Calculate statistics
        total_analyses = results.count()
        high_risk_count = results.filter(is_stampede_risk=True).count()
        avg_people_count = results.aggregate(
            avg_count=Avg('people_count')
        )['avg_count'] or 0
        
        # Get hourly breakdown for charts
        hourly_data = []
        for i in range(24):
            hour_start = now - timedelta(hours=i+1)
            hour_end = now - timedelta(hours=i)
            
            hour_results = results.filter(
                timestamp__gte=hour_start,
                timestamp__lt=hour_end
            )
            
            hourly_data.append({
                'hour': hour_start.strftime('%H:00'),
                'analyses': hour_results.count(),
                'high_risk': hour_results.filter(is_stampede_risk=True).count(),
                'avg_people': hour_results.aggregate(
                    avg=Avg('people_count')
                )['avg'] or 0
            })
        
        return Response({
            'time_range': time_range,
            'summary': {
                'total_analyses': total_analyses,
                'high_risk_detections': high_risk_count,
                'average_people_count': round(avg_people_count, 1),
                'risk_percentage': round((high_risk_count / total_analyses * 100) if total_analyses > 0 else 0, 1)
            },
            'hourly_data': list(reversed(hourly_data)),  # Most recent first
            'recent_analyses': AnalysisResultSerializer(
                results[:10], many=True
            ).data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'error': 'Failed to get analytics',
            'detail': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Missing Alert Stats Endpoint
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_alert_stats(request):
    """Get alert statistics and summary"""
    try:
        # Get all alerts
        all_alerts = Alert.objects.all()
        
        # Calculate statistics
        total_alerts = all_alerts.count()
        active_alerts = all_alerts.filter(acknowledged=False).count()
        acknowledged_alerts = all_alerts.filter(acknowledged=True).count()
        
        # Get alerts by severity
        high_severity = all_alerts.filter(severity='high').count()
        medium_severity = all_alerts.filter(severity='medium').count()
        low_severity = all_alerts.filter(severity='low').count()
        
        # Get recent alerts (last 24 hours)
        from datetime import timedelta
        recent_time = timezone.now() - timedelta(hours=24)
        recent_alerts = all_alerts.filter(created_at__gte=recent_time).count()
        
        return Response({
            'summary': {
                'total_alerts': total_alerts,
                'active_alerts': active_alerts,
                'acknowledged_alerts': acknowledged_alerts,
                'recent_alerts_24h': recent_alerts
            },
            'by_severity': {
                'high': high_severity,
                'medium': medium_severity,
                'low': low_severity
            },
            'acknowledgment_rate': round(
                (acknowledged_alerts / total_alerts * 100) if total_alerts > 0 else 0, 1
            )
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'error': 'Failed to get alert statistics',
            'detail': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
