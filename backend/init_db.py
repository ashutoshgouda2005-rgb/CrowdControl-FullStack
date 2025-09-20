#!/usr/bin/env python
"""
Database initialization script for CrowdControl backend.
This script sets up the database with initial data and configurations.
"""

import os
import sys
import django
from django.core.management import execute_from_command_line
from django.contrib.auth.models import User
from django.db import transaction

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crowdcontrol.settings')
django.setup()

from api.models import MediaUpload, LiveStream, AnalysisResult, Alert


def create_superuser():
    """Create a superuser if it doesn't exist"""
    try:
        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser(
                username='admin',
                email='admin@crowdcontrol.com',
                password='admin123'  # Change this in production!
            )
            print("✅ Superuser 'admin' created successfully")
        else:
            print("ℹ️  Superuser 'admin' already exists")
    except Exception as e:
        print(f"❌ Error creating superuser: {e}")


def create_demo_user():
    """Create a demo user for testing"""
    try:
        if not User.objects.filter(username='demo').exists():
            User.objects.create_user(
                username='demo',
                email='demo@crowdcontrol.com',
                password='demo123',
                first_name='Demo',
                last_name='User'
            )
            print("✅ Demo user created successfully")
        else:
            print("ℹ️  Demo user already exists")
    except Exception as e:
        print(f"❌ Error creating demo user: {e}")


def setup_database():
    """Run database migrations and setup"""
    try:
        print("🔄 Running database migrations...")
        execute_from_command_line(['manage.py', 'migrate'])
        print("✅ Database migrations completed")
        
        print("🔄 Collecting static files...")
        execute_from_command_line(['manage.py', 'collectstatic', '--noinput'])
        print("✅ Static files collected")
        
    except Exception as e:
        print(f"❌ Error setting up database: {e}")


def create_sample_data():
    """Create sample data for demonstration"""
    try:
        demo_user = User.objects.get(username='demo')
        
        # Create sample live stream
        if not LiveStream.objects.filter(user=demo_user).exists():
            LiveStream.objects.create(
                user=demo_user,
                stream_name="Demo Live Stream",
                stream_url="rtmp://demo.stream.url",
                status="inactive"
            )
            print("✅ Sample live stream created")
        
        print("✅ Sample data created successfully")
        
    except Exception as e:
        print(f"❌ Error creating sample data: {e}")


def main():
    """Main initialization function"""
    print("🚀 Initializing CrowdControl Database...")
    print("=" * 50)
    
    # Setup database
    setup_database()
    
    # Create users
    create_superuser()
    create_demo_user()
    
    # Create sample data
    create_sample_data()
    
    print("=" * 50)
    print("✅ Database initialization completed!")
    print("\n📋 Login Credentials:")
    print("   Admin: username='admin', password='admin123'")
    print("   Demo:  username='demo', password='demo123'")
    print("\n🌐 API Endpoints:")
    print("   Health Check: /api/health/")
    print("   Admin Panel:  /admin/")
    print("   API Root:     /api/")
    print("\n⚠️  Remember to change default passwords in production!")


if __name__ == '__main__':
    main()
