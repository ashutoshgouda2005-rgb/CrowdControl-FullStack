"""
Backend Integration Updates for Advanced Frontend
Run this script to update your Django backend for seamless frontend integration
"""

import os
import sys
import django
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.append(str(backend_dir))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crowdcontrol.settings')
django.setup()

def update_settings_for_frontend():
    """Update Django settings for advanced frontend integration"""
    
    settings_file = backend_dir / 'crowdcontrol' / 'settings.py'
    
    # Read current settings
    with open(settings_file, 'r') as f:
        content = f.read()
    
    # Additional CORS settings for advanced frontend
    cors_updates = """
# Enhanced CORS Configuration for Advanced Frontend
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",  # Vite preview
    "http://127.0.0.1:4173",
]

# Additional CORS headers for advanced features
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
    'x-api-key',
    'cache-control',
]

# WebSocket CORS settings
CORS_ALLOW_WEBSOCKETS = True

# File upload settings for advanced upload component
FILE_UPLOAD_MAX_MEMORY_SIZE = 100 * 1024 * 1024  # 100MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 100 * 1024 * 1024  # 100MB
FILE_UPLOAD_PERMISSIONS = 0o644

# API Response settings
REST_FRAMEWORK.update({
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour'
    }
})
"""
    
    # Add CORS updates if not already present
    if 'CORS_ALLOW_WEBSOCKETS' not in content:
        content += cors_updates
    
    # Write updated settings
    with open(settings_file, 'w') as f:
        f.write(content)
    
    print("✅ Settings updated for advanced frontend integration")

def create_analytics_endpoints():
    """Create additional API endpoints for analytics"""
    
    # Create analytics views
    analytics_views = """
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
from django.db.models import Count, Avg
from .models import MediaUpload, LiveStream, AnalysisResult

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_analytics(request):
    \"\"\"Get analytics data for dashboard\"\"\"
    time_range = request.GET.get('time_range', '24h')
    
    # Calculate time delta
    if time_range == '1h':
        delta = timedelta(hours=1)
    elif time_range == '6h':
        delta = timedelta(hours=6)
    elif time_range == '24h':
        delta = timedelta(hours=24)
    elif time_range == '7d':
        delta = timedelta(days=7)
    elif time_range == '30d':
        delta = timedelta(days=30)
    else:
        delta = timedelta(hours=24)
    
    start_time = timezone.now() - delta
    
    # Get analytics data
    analytics = {
        'total_detections': AnalysisResult.objects.filter(
            created_at__gte=start_time
        ).count(),
        'active_streams': LiveStream.objects.filter(
            is_active=True
        ).count(),
        'avg_people_count': AnalysisResult.objects.filter(
            created_at__gte=start_time
        ).aggregate(Avg('people_count'))['people_count__avg'] or 0,
        'detection_timeline': get_detection_timeline(start_time),
        'hourly_density': get_hourly_density(start_time),
        'risk_distribution': get_risk_distribution(start_time),
    }
    
    return Response(analytics)

def get_detection_timeline(start_time):
    \"\"\"Get detection timeline data\"\"\"
    from django.db.models import Count
    from django.db.models.functions import TruncHour
    
    timeline = AnalysisResult.objects.filter(
        created_at__gte=start_time
    ).annotate(
        hour=TruncHour('created_at')
    ).values('hour').annotate(
        count=Count('id')
    ).order_by('hour')
    
    return [
        {
            'timestamp': item['hour'].isoformat(),
            'count': item['count']
        }
        for item in timeline
    ]

def get_hourly_density(start_time):
    \"\"\"Get hourly density data\"\"\"
    from django.db.models import Avg
    from django.db.models.functions import Extract
    
    density = AnalysisResult.objects.filter(
        created_at__gte=start_time
    ).annotate(
        hour=Extract('created_at', 'hour')
    ).values('hour').annotate(
        density=Avg('people_count')
    ).order_by('hour')
    
    return [
        {
            'hour': f"{item['hour']:02d}:00",
            'density': round(item['density'] or 0, 1)
        }
        for item in density
    ]

def get_risk_distribution(start_time):
    \"\"\"Get risk level distribution\"\"\"
    distribution = AnalysisResult.objects.filter(
        created_at__gte=start_time
    ).values('risk_level').annotate(
        count=Count('id')
    )
    
    colors = {
        'low': '#10B981',
        'medium': '#F59E0B', 
        'high': '#EF4444',
        'critical': '#DC2626'
    }
    
    return [
        {
            'name': item['risk_level'].title(),
            'value': item['count'],
            'color': colors.get(item['risk_level'], '#6B7280')
        }
        for item in distribution
    ]

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_alert_stats(request):
    \"\"\"Get alert statistics\"\"\"
    from .models import Alert
    
    stats = {
        'total_alerts': Alert.objects.count(),
        'active_alerts': Alert.objects.filter(acknowledged=False).count(),
        'alert_change': 0,  # Calculate based on previous period
    }
    
    return Response(stats)
"""
    
    # Write analytics views to file
    analytics_file = backend_dir / 'api' / 'analytics_views.py'
    with open(analytics_file, 'w') as f:
        f.write(analytics_views)
    
    print("✅ Analytics endpoints created")

def update_api_urls():
    """Update API URLs to include new endpoints"""
    
    urls_file = backend_dir / 'api' / 'urls.py'
    
    # Read current URLs
    with open(urls_file, 'r') as f:
        content = f.read()
    
    # Add analytics URLs if not present
    if 'analytics' not in content:
        # Add import for analytics views
        if 'from . import analytics_views' not in content:
            content = content.replace(
                'from . import views',
                'from . import views\nfrom . import analytics_views'
            )
        
        # Add analytics URL patterns
        analytics_urls = """
    # Analytics endpoints
    path('analytics/', analytics_views.get_analytics, name='get_analytics'),
    path('alerts/stats/', analytics_views.get_alert_stats, name='get_alert_stats'),
"""
        
        # Insert before the closing bracket
        content = content.replace(']', analytics_urls + ']')
        
        # Write updated URLs
        with open(urls_file, 'w') as f:
            f.write(content)
        
        print("✅ API URLs updated with analytics endpoints")

def create_websocket_consumer():
    """Create WebSocket consumer for real-time updates"""
    
    consumer_code = """
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser

class UpdatesConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_group_name = 'updates'
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message_type = text_data_json.get('type', 'ping')
        
        if message_type == 'ping':
            await self.send(text_data=json.dumps({
                'type': 'pong',
                'timestamp': timezone.now().isoformat()
            }))

    # Receive message from room group
    async def update_message(self, event):
        # Send message to WebSocket
        await self.send(text_data=json.dumps(event))

    async def live_detection(self, event):
        # Send live detection update
        await self.send(text_data=json.dumps({
            'type': 'live_detection',
            'payload': event['payload']
        }))

    async def alert_message(self, event):
        # Send alert message
        await self.send(text_data=json.dumps({
            'type': 'alert',
            'payload': event['payload']
        }))

    async def analytics_update(self, event):
        # Send analytics update
        await self.send(text_data=json.dumps({
            'type': 'analytics_update',
            'payload': event['payload']
        }))
"""
    
    # Create consumers file
    consumers_file = backend_dir / 'api' / 'consumers.py'
    with open(consumers_file, 'w') as f:
        f.write(consumer_code)
    
    print("✅ WebSocket consumer created")

def update_asgi_routing():
    """Update ASGI routing for WebSocket"""
    
    asgi_file = backend_dir / 'crowdcontrol' / 'asgi.py'
    
    asgi_code = """
import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from django.urls import path
from api.consumers import UpdatesConsumer

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crowdcontrol.settings')

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter([
            path("ws/updates/", UpdatesConsumer.as_asgi()),
        ])
    ),
})
"""
    
    with open(asgi_file, 'w') as f:
        f.write(asgi_code)
    
    print("✅ ASGI routing updated for WebSocket")

def create_management_command():
    """Create management command to test frontend integration"""
    
    # Create management commands directory
    management_dir = backend_dir / 'api' / 'management'
    commands_dir = management_dir / 'commands'
    
    management_dir.mkdir(exist_ok=True)
    commands_dir.mkdir(exist_ok=True)
    
    # Create __init__.py files
    (management_dir / '__init__.py').touch()
    (commands_dir / '__init__.py').touch()
    
    # Create test command
    test_command = """
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from api.models import MediaUpload, LiveStream, AnalysisResult
import random
from datetime import datetime, timedelta

class Command(BaseCommand):
    help = 'Create test data for frontend integration'

    def handle(self, *args, **options):
        self.stdout.write('Creating test data for frontend...')
        
        # Create test user if doesn't exist
        if not User.objects.filter(username='testuser').exists():
            user = User.objects.create_user(
                username='testuser',
                email='test@example.com',
                password='testpass123',
                first_name='Test',
                last_name='User'
            )
            self.stdout.write(f'Created test user: {user.username}')
        
        # Create sample analysis results
        user = User.objects.get(username='testuser')
        
        for i in range(50):
            AnalysisResult.objects.create(
                user=user,
                people_count=random.randint(0, 20),
                confidence=random.uniform(0.7, 0.99),
                risk_level=random.choice(['low', 'medium', 'high', 'critical']),
                processing_time=random.randint(50, 150),
                created_at=datetime.now() - timedelta(hours=random.randint(0, 48))
            )
        
        self.stdout.write(
            self.style.SUCCESS('Successfully created test data')
        )
"""
    
    with open(commands_dir / 'create_test_data.py', 'w') as f:
        f.write(test_command)
    
    print("✅ Management command created")

def main():
    """Run all backend integration updates"""
    print("🚀 Updating backend for advanced frontend integration...")
    print()
    
    try:
        update_settings_for_frontend()
        create_analytics_endpoints()
        update_api_urls()
        create_websocket_consumer()
        update_asgi_routing()
        create_management_command()
        
        print()
        print("✅ Backend integration updates completed successfully!")
        print()
        print("Next steps:")
        print("1. Run: python manage.py migrate")
        print("2. Run: python manage.py create_test_data")
        print("3. Start backend: python manage.py runserver")
        print("4. Start frontend: cd frontend && npm run dev")
        print()
        print("🎉 Your advanced frontend is ready to integrate!")
        
    except Exception as e:
        print(f"❌ Error during backend updates: {e}")
        return False
    
    return True

if __name__ == '__main__':
    main()
