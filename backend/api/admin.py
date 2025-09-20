from django.contrib import admin
from .models import MediaUpload, LiveStream, AnalysisResult, Alert

@admin.register(MediaUpload)
class MediaUploadAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'media_type', 'filename', 'uploaded_at', 'analysis_status', 'is_stampede_risk')
    list_filter = ('media_type', 'analysis_status', 'is_stampede_risk', 'uploaded_at')
    search_fields = ('filename', 'user__username')

@admin.register(LiveStream)
class LiveStreamAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'stream_name', 'status', 'last_active', 'current_people_count', 'current_confidence')
    list_filter = ('status', 'created_at')
    search_fields = ('stream_name', 'user__username')

@admin.register(AnalysisResult)
class AnalysisResultAdmin(admin.ModelAdmin):
    list_display = ('id', 'media_upload', 'live_stream', 'timestamp', 'crowd_detected', 'people_count', 'confidence_score', 'is_stampede_risk')
    list_filter = ('crowd_detected', 'is_stampede_risk', 'timestamp')

@admin.register(Alert)
class AlertAdmin(admin.ModelAdmin):
    list_display = ('id', 'alert_type', 'severity', 'created_at', 'acknowledged')
    list_filter = ('alert_type', 'severity', 'acknowledged', 'created_at')
    search_fields = ('message',)
