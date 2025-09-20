from rest_framework import serializers
from django.contrib.auth.models import User
from .models import MediaUpload, LiveStream, AnalysisResult, Alert


class UserSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    first_name = serializers.CharField(max_length=30, required=False)
    last_name = serializers.CharField(max_length=30, required=False)
    date_joined = serializers.DateTimeField(read_only=True)


class UserRegistrationSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    first_name = serializers.CharField(max_length=30, required=False)
    last_name = serializers.CharField(max_length=30, required=False)
    
    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already exists")
        return value
    
    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already exists")
        return value
    
    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class MediaUploadSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    user = UserSerializer(read_only=True)
    media_type = serializers.ChoiceField(choices=MediaUpload.MEDIA_TYPES)
    file = serializers.FileField()
    filename = serializers.CharField(max_length=255, read_only=True)
    file_size = serializers.IntegerField(read_only=True)
    uploaded_at = serializers.DateTimeField(read_only=True)
    
    # Analysis results
    analysis_status = serializers.ChoiceField(choices=MediaUpload.ANALYSIS_STATUS, read_only=True)
    crowd_detected = serializers.BooleanField(read_only=True)
    confidence_score = serializers.FloatField(read_only=True)
    people_count = serializers.IntegerField(read_only=True)
    is_stampede_risk = serializers.BooleanField(read_only=True)
    analysis_completed_at = serializers.DateTimeField(read_only=True)
    analysis_result = serializers.JSONField(read_only=True)
    
    # Metadata
    description = serializers.CharField(required=False, allow_blank=True)
    location = serializers.CharField(max_length=255, required=False, allow_blank=True)
    
    def create(self, validated_data):
        file_obj = validated_data['file']
        validated_data['filename'] = file_obj.name
        validated_data['file_size'] = file_obj.size
        validated_data['user'] = self.context['request'].user
        return MediaUpload.objects.create(**validated_data)


class LiveStreamSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    user = UserSerializer(read_only=True)
    stream_name = serializers.CharField(max_length=100)
    stream_url = serializers.URLField(required=False, allow_blank=True)
    status = serializers.ChoiceField(choices=LiveStream.STREAM_STATUS, read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    last_active = serializers.DateTimeField(read_only=True)
    
    # Current analysis
    current_crowd_status = serializers.BooleanField(read_only=True)
    current_people_count = serializers.IntegerField(read_only=True)
    current_confidence = serializers.FloatField(read_only=True)
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return LiveStream.objects.create(**validated_data)


class AnalysisResultSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    media_upload_id = serializers.IntegerField(source='media_upload.id', read_only=True)
    live_stream_id = serializers.IntegerField(source='live_stream.id', read_only=True)
    
    timestamp = serializers.DateTimeField(read_only=True)
    crowd_detected = serializers.BooleanField()
    confidence_score = serializers.FloatField()
    people_count = serializers.IntegerField()
    is_stampede_risk = serializers.BooleanField()
    processing_time = serializers.FloatField()
    model_version = serializers.CharField(max_length=50)


class AlertSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    alert_type = serializers.ChoiceField(choices=Alert.ALERT_TYPES)
    severity = serializers.ChoiceField(choices=Alert.ALERT_SEVERITY)
    message = serializers.CharField()
    
    analysis_result_id = serializers.IntegerField(source='analysis_result.id', read_only=True)
    live_stream_id = serializers.IntegerField(source='live_stream.id', read_only=True)
    
    created_at = serializers.DateTimeField(read_only=True)
    acknowledged = serializers.BooleanField(read_only=True)
    acknowledged_by = UserSerializer(read_only=True)
    acknowledged_at = serializers.DateTimeField(read_only=True)


class StreamAnalysisSerializer(serializers.Serializer):
    """Serializer for real-time stream analysis data"""
    stream_id = serializers.IntegerField()
    timestamp = serializers.DateTimeField()
    crowd_detected = serializers.BooleanField()
    confidence_score = serializers.FloatField()
    people_count = serializers.IntegerField()
    is_stampede_risk = serializers.BooleanField()
    frame_data = serializers.CharField()  # Base64 encoded frame
