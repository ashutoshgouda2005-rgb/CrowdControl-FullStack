from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class MediaUpload(models.Model):
    MEDIA_TYPES = [
        ('image', 'Image'),
        ('video', 'Video'),
    ]
    
    ANALYSIS_STATUS = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    media_type = models.CharField(max_length=10, choices=MEDIA_TYPES)
    file = models.FileField(upload_to='uploads/%Y/%m/%d/')
    filename = models.CharField(max_length=255)
    file_size = models.BigIntegerField()
    uploaded_at = models.DateTimeField(default=timezone.now)
    
    # Analysis results
    analysis_status = models.CharField(max_length=20, choices=ANALYSIS_STATUS, default='pending')
    crowd_detected = models.BooleanField(null=True, blank=True)
    confidence_score = models.FloatField(null=True, blank=True)
    people_count = models.IntegerField(null=True, blank=True)
    is_stampede_risk = models.BooleanField(null=True, blank=True)
    analysis_completed_at = models.DateTimeField(null=True, blank=True)
    analysis_result = models.JSONField(null=True, blank=True)
    
    # Metadata
    description = models.TextField(blank=True)
    location = models.CharField(max_length=255, blank=True)
    
    class Meta:
        ordering = ['-uploaded_at']
    
    def __str__(self):
        return f"{self.filename} - {self.user.username}"


class LiveStream(models.Model):
    STREAM_STATUS = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('error', 'Error'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    stream_name = models.CharField(max_length=100)
    stream_url = models.URLField(blank=True)
    status = models.CharField(max_length=20, choices=STREAM_STATUS, default='inactive')
    created_at = models.DateTimeField(default=timezone.now)
    last_active = models.DateTimeField(default=timezone.now)
    
    # Current analysis
    current_crowd_status = models.BooleanField(default=False)
    current_people_count = models.IntegerField(default=0)
    current_confidence = models.FloatField(default=0.0)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.stream_name} - {self.user.username}"


class AnalysisResult(models.Model):
    # Can be linked to either MediaUpload or LiveStream
    media_upload = models.ForeignKey(MediaUpload, on_delete=models.CASCADE, null=True, blank=True)
    live_stream = models.ForeignKey(LiveStream, on_delete=models.CASCADE, null=True, blank=True)
    
    # Analysis data
    timestamp = models.DateTimeField(default=timezone.now)
    crowd_detected = models.BooleanField()
    confidence_score = models.FloatField()
    people_count = models.IntegerField()
    is_stampede_risk = models.BooleanField()
    
    # Additional metadata
    processing_time = models.FloatField()  # in seconds
    model_version = models.CharField(max_length=50, default='v1.0')
    
    class Meta:
        ordering = ['-timestamp']
    
    def __str__(self):
        source = self.media_upload or self.live_stream
        return f"Analysis for {source} at {self.timestamp}"


class Alert(models.Model):
    ALERT_TYPES = [
        ('stampede_risk', 'Stampede Risk'),
        ('high_crowd_density', 'High Crowd Density'),
        ('system_error', 'System Error'),
    ]
    
    ALERT_SEVERITY = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]
    
    alert_type = models.CharField(max_length=30, choices=ALERT_TYPES)
    severity = models.CharField(max_length=20, choices=ALERT_SEVERITY)
    message = models.TextField()
    
    # Source of alert
    analysis_result = models.ForeignKey(AnalysisResult, on_delete=models.CASCADE, null=True, blank=True)
    live_stream = models.ForeignKey(LiveStream, on_delete=models.CASCADE, null=True, blank=True)
    
    created_at = models.DateTimeField(default=timezone.now)
    acknowledged = models.BooleanField(default=False)
    acknowledged_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    acknowledged_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.alert_type} - {self.severity} at {self.created_at}"
