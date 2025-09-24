from django.urls import path
from . import views

urlpatterns = [
    # API root
    path('', views.api_root, name='api_root'),
    
    # Health check
    path('health/', views.health_check, name='health_check'),
    
    # Authentication
    path('auth/register/', views.register, name='register'),
    path('auth/login/', views.login, name='login'),
    path('auth/profile/', views.profile, name='profile'),
    path('auth/token/refresh/', views.token_refresh, name='token_refresh'),
    
    # Media uploads
    path('media/upload/', views.upload_media, name='upload_media'),
    path('media/list/', views.list_media_uploads, name='list_media_uploads'),
    path('media/<int:upload_id>/', views.get_media_upload_detail, name='get_media_upload_detail'),
    
    # Live streams
    path('streams/create/', views.create_live_stream, name='create_live_stream'),
    path('streams/list/', views.list_live_streams, name='list_live_streams'),
    path('streams/<int:stream_id>/', views.manage_live_stream, name='manage_live_stream'),
    path('streams/<int:stream_id>/start/', views.start_stream, name='start_stream'),
    path('streams/<int:stream_id>/stop/', views.stop_stream, name='stop_stream'),
    
    # Analysis
    path('analysis/frame/', views.analyze_frame, name='analyze_frame'),
    path('analysis/results/', views.get_analysis_results, name='get_analysis_results'),
    path('analysis/analytics/', views.get_analytics, name='get_analytics'),
    
    # Alerts
    path('alerts/', views.get_alerts, name='get_alerts'),
    path('alerts/<int:alert_id>/acknowledge/', views.acknowledge_alert, name='acknowledge_alert'),
    path('alerts/stats/', views.get_alert_stats, name='get_alert_stats'),
]
