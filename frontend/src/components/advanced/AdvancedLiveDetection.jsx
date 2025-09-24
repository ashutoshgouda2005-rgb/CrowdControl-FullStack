import React, { useState, useEffect, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  Square,
  Play,
  Pause,
  RotateCcw,
  Settings,
  Users,
  AlertTriangle,
  Activity,
  Maximize2,
  Minimize2,
  Download,
  RefreshCw,
  Zap,
  Eye,
  Clock,
} from 'lucide-react';
import { analysisAPI, streamAPI } from '../../services/api';
import { useApp } from '../../contexts/AppContext';
import { dateUtils, colorUtils, cn, performanceUtils } from '../../utils';
import toast from 'react-hot-toast';
import LoadingSpinner from '../ui/LoadingSpinner';
import ErrorBoundary from '../ui/ErrorBoundary';

const AdvancedLiveDetection = () => {
  const { showNotification, updateAnalytics } = useApp();
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);
  const streamRef = useRef(null);

  // State management
  const [isStreaming, setIsStreaming] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentDetection, setCurrentDetection] = useState(null);
  const [detectionHistory, setDetectionHistory] = useState([]);
  const [streamSettings, setStreamSettings] = useState({
    width: 640,
    height: 480,
    facingMode: 'user',
    analysisInterval: 2000, // 2 seconds
    confidenceThreshold: 0.5,
    enableAlerts: true,
    enableRecording: false,
  });
  const [cameraError, setCameraError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [performance, setPerformance] = useState({
    fps: 0,
    avgProcessingTime: 0,
    totalDetections: 0,
    lastUpdate: null,
  });
  const [deviceInfo, setDeviceInfo] = useState(null);

  // Camera constraints
  const videoConstraints = {
    width: streamSettings.width,
    height: streamSettings.height,
    facingMode: streamSettings.facingMode,
  };

  // Initialize camera and get device info
  useEffect(() => {
    const getDeviceInfo = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setDeviceInfo({
          totalDevices: videoDevices.length,
          devices: videoDevices,
          hasMultipleCameras: videoDevices.length > 1,
        });
      } catch (error) {
        console.error('Failed to get device info:', error);
      }
    };

    getDeviceInfo();
  }, []);

  // Handle camera errors
  const handleCameraError = useCallback((error) => {
    console.error('Camera error:', error);
    setCameraError(error.message || 'Camera access failed');
    setIsStreaming(false);
    toast.error('Camera access failed. Please check permissions.');
  }, []);

  // Start streaming
  const startStreaming = useCallback(async () => {
    try {
      setCameraError(null);
      setIsStreaming(true);
      
      // Create stream record
      const streamData = {
        name: `Live Detection - ${new Date().toISOString()}`,
        source: 'webcam',
        settings: streamSettings,
      };
      
      const stream = await streamAPI.createStream(streamData);
      streamRef.current = stream;
      
      // Start analysis interval
      intervalRef.current = setInterval(analyzeCurrentFrame, streamSettings.analysisInterval);
      
      toast.success('Live detection started');
    } catch (error) {
      console.error('Failed to start streaming:', error);
      setIsStreaming(false);
      toast.error('Failed to start live detection');
    }
  }, [streamSettings]);

  // Stop streaming
  const stopStreaming = useCallback(async () => {
    try {
      setIsStreaming(false);
      setIsAnalyzing(false);
      
      // Clear interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      // Stop stream record
      if (streamRef.current) {
        await streamAPI.stopStream(streamRef.current.id);
        streamRef.current = null;
      }
      
      toast.success('Live detection stopped');
    } catch (error) {
      console.error('Failed to stop streaming:', error);
      toast.error('Failed to stop live detection');
    }
  }, []);

  // Analyze current frame
  const analyzeCurrentFrame = useCallback(async () => {
    if (!webcamRef.current || !isStreaming || isAnalyzing) return;

    try {
      setIsAnalyzing(true);
      const startTime = performance.now();

      // Capture frame from webcam
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc || !streamRef.current?.id) return;

      // Extract base64 payload and call backend with JSON as expected
      const base64Data = imageSrc.split(',')[1];
      const apiResp = await analysisAPI.analyzeFrame({
        stream_id: streamRef.current.id,
        frame_data: base64Data,
      });
      const processingTime = performance.now() - startTime;

      // Normalize response shape
      const analysis = apiResp?.analysis || apiResp || {};

      // Derive risk level using advanced fields when available
      const riskScore = typeof analysis.calibrated_risk_score === 'number'
        ? analysis.calibrated_risk_score
        : (typeof analysis.risk_score === 'number' ? analysis.risk_score : null);
      let riskLevel = 'low';
      if (riskScore !== null) {
        if (riskScore >= 0.85) riskLevel = 'critical';
        else if (riskScore >= 0.75) riskLevel = 'high';
        else if (riskScore >= 0.5) riskLevel = 'medium';
        else riskLevel = 'low';
      } else {
        riskLevel = analysis.is_stampede_risk ? 'high' : (analysis.crowd_detected ? 'medium' : 'low');
      }

      const detection = {
        ...analysis,
        risk_level: riskLevel,
        confidence: analysis.confidence_score,
        people_count: analysis.people_count,
        timestamp: new Date().toISOString(),
        processingTime: Math.round(processingTime),
        frameUrl: imageSrc,
      };

      setCurrentDetection(detection);

      // Add to history (keep last 50)
      setDetectionHistory(prev => [detection, ...prev.slice(0, 49)]);

      // Update performance metrics
      setPerformance(prev => ({
        fps: Math.round(1000 / processingTime),
        avgProcessingTime: Math.round((prev.avgProcessingTime + processingTime) / 2),
        totalDetections: prev.totalDetections + 1,
        lastUpdate: new Date().toISOString(),
      }));

      // Update global analytics
      updateAnalytics({
        crowdCount: detection.people_count,
        lastDetection: detection,
      });

      // Draw detection overlay
      drawDetectionOverlay(detection);

      // Handle alerts
      if (streamSettings.enableAlerts && (detection.risk_level === 'high' || detection.risk_level === 'critical')) {
        showNotification({
          type: 'warning',
          title: 'High Risk Detection',
          message: `Detected ${detection.people_count} people with ${detection.risk_level} risk level`,
        });
      }

    } catch (error) {
      console.error('Frame analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [isStreaming, isAnalyzing, streamSettings, showNotification, updateAnalytics]);

  // Draw detection overlay on canvas
  const drawDetectionOverlay = useCallback((detection) => {
    const canvas = canvasRef.current;
    const webcam = webcamRef.current;
    
    if (!canvas || !webcam) return;

    const ctx = canvas.getContext('2d');
    const video = webcam.video;
    
    if (!video) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Prepare boxes from various possible fields
    const boxes = Array.isArray(detection?.bounding_boxes)
      ? detection.bounding_boxes.map(b => ({ x: b[0], y: b[1], width: b[2], height: b[3], confidence: detection.confidence ?? 0.9, pixel: true }))
      : Array.isArray(detection?.detections)
        ? detection.detections.map(d => ({ ...d, pixel: false }))
        : [];

    // Draw bounding boxes
    boxes.forEach((det, index) => {
      const { x, y, width, height, confidence, pixel } = det;
      let scaledX, scaledY, scaledWidth, scaledHeight;

      if (pixel) {
        // Treat as pixel coordinates relative to current canvas
        const xScale = canvas.width / (video.videoWidth || canvas.width);
        const yScale = canvas.height / (video.videoHeight || canvas.height);
        scaledX = x * xScale;
        scaledY = y * yScale;
        scaledWidth = width * xScale;
        scaledHeight = height * yScale;
      } else {
        // Treat as percentage [0..100]
        scaledX = (x / 100) * canvas.width;
        scaledY = (y / 100) * canvas.height;
        scaledWidth = (width / 100) * canvas.width;
        scaledHeight = (height / 100) * canvas.height;
      }

      // Set style based on confidence
      const alpha = Math.min(typeof confidence === 'number' ? confidence : 0.9, 0.9);
      ctx.strokeStyle = `rgba(59, 130, 246, ${alpha})`;
      ctx.lineWidth = 3;
      ctx.fillStyle = `rgba(59, 130, 246, ${alpha * 0.25})`;

      // Draw bounding box
      ctx.fillRect(scaledX, scaledY, scaledWidth, scaledHeight);
      ctx.strokeRect(scaledX, scaledY, scaledWidth, scaledHeight);

      // Draw confidence label
      ctx.fillStyle = `rgba(59, 130, 246, 0.9)`;
      ctx.font = '14px Arial';
      const pct = Math.round(Math.min(0.99, Math.max(0, confidence || 0.85)) * 100);
      ctx.fillText(
        `Person ${index + 1} (${pct}%)`,
        Math.max(0, Math.min(scaledX, canvas.width - 120)),
        Math.max(12, scaledY - 5)
      );
    });

    // Draw summary info
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 240, 100);
    
    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.fillText(`People: ${detection.people_count}`, 20, 35);
    ctx.fillText(`Risk: ${detection.risk_level}`, 20, 55);
    if (typeof detection.risk_score === 'number') {
      ctx.fillText(`Score: ${(detection.risk_score * 100).toFixed(0)}%`, 20, 75);
    }
    if (typeof detection.motion_score === 'number') {
      ctx.fillText(`Motion: ${(detection.motion_score * 100).toFixed(0)}%`, 120, 75);
    }
    ctx.fillText(`Conf: ${Math.round((detection.confidence || 0) * 100)}%`, 20, 95);
  }, []);

  // Toggle camera
  const toggleCamera = () => {
    setStreamSettings(prev => ({
      ...prev,
      facingMode: prev.facingMode === 'user' ? 'environment' : 'user',
    }));
  };

  // Capture screenshot
  const captureScreenshot = useCallback(() => {
    if (!webcamRef.current) return;

    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      // Create download link
      const link = document.createElement('a');
      link.download = `detection_${Date.now()}.jpg`;
      link.href = imageSrc;
      link.click();
      
      toast.success('Screenshot captured!');
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (streamRef.current) {
        streamAPI.stopStream(streamRef.current.id).catch(console.error);
      }
    };
  }, []);

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Live Detection
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Real-time crowd detection using your camera
            </p>
          </div>
          
          <div className="flex items-center space-x-2 mt-4 sm:mt-0">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Detection Settings
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Analysis Interval (ms)
                  </label>
                  <input
                    type="number"
                    min="1000"
                    max="10000"
                    step="500"
                    value={streamSettings.analysisInterval}
                    onChange={(e) => setStreamSettings(prev => ({
                      ...prev,
                      analysisInterval: Number(e.target.value)
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Confidence Threshold
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    max="1"
                    step="0.1"
                    value={streamSettings.confidenceThreshold}
                    onChange={(e) => setStreamSettings(prev => ({
                      ...prev,
                      confidenceThreshold: Number(e.target.value)
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Video Quality
                  </label>
                  <select
                    value={`${streamSettings.width}x${streamSettings.height}`}
                    onChange={(e) => {
                      const [width, height] = e.target.value.split('x').map(Number);
                      setStreamSettings(prev => ({ ...prev, width, height }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="640x480">640x480 (SD)</option>
                    <option value="1280x720">1280x720 (HD)</option>
                    <option value="1920x1080">1920x1080 (FHD)</option>
                  </select>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="enableAlerts"
                    checked={streamSettings.enableAlerts}
                    onChange={(e) => setStreamSettings(prev => ({
                      ...prev,
                      enableAlerts: e.target.checked
                    }))}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <label htmlFor="enableAlerts" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Enable Alerts
                  </label>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className={cn(
          'grid gap-6',
          isFullscreen ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-3'
        )}>
          {/* Camera Feed */}
          <div className={cn(
            'relative',
            isFullscreen ? 'col-span-1' : 'lg:col-span-2'
          )}>
            <div className="bg-black rounded-lg overflow-hidden relative">
              {cameraError ? (
                <div className="aspect-video flex items-center justify-center">
                  <div className="text-center text-white">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
                    <p className="text-lg font-semibold mb-2">Camera Error</p>
                    <p className="text-sm text-gray-300">{cameraError}</p>
                    <button
                      onClick={() => {
                        setCameraError(null);
                        if (isStreaming) {
                          stopStreaming();
                        }
                      }}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    videoConstraints={videoConstraints}
                    onUserMediaError={handleCameraError}
                    className="w-full h-auto"
                  />
                  
                  {/* Detection Overlay Canvas */}
                  <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full pointer-events-none"
                  />
                  
                  {/* Status Overlay */}
                  <div className="absolute top-4 left-4 flex items-center space-x-2">
                    <div className={cn(
                      'w-3 h-3 rounded-full',
                      isStreaming ? 'bg-green-500 animate-pulse' : 'bg-gray-500'
                    )} />
                    <span className="text-white text-sm font-medium">
                      {isStreaming ? 'Live' : 'Stopped'}
                    </span>
                    {isAnalyzing && (
                      <RefreshCw className="w-4 h-4 text-white animate-spin" />
                    )}
                  </div>
                  
                  {/* Current Detection Info */}
                  {currentDetection && (
                    <div className="absolute top-4 right-4 bg-black bg-opacity-70 text-white p-3 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Users className="w-4 h-4" />
                        <span className="font-medium">{currentDetection.people_count} People</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="w-4 h-4" />
                        <span className={cn(
                          'px-2 py-1 text-xs rounded-full',
                          colorUtils.getRiskColor(currentDetection.risk_level)
                        )}>
                          {currentDetection.risk_level} Risk
                        </span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
            
            {/* Controls */}
            <div className="flex items-center justify-center space-x-4 mt-4">
              {!isStreaming ? (
                <button
                  onClick={startStreaming}
                  disabled={!!cameraError}
                  className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Play className="w-5 h-5" />
                  <span>Start Detection</span>
                </button>
              ) : (
                <button
                  onClick={stopStreaming}
                  className="flex items-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Square className="w-5 h-5" />
                  <span>Stop Detection</span>
                </button>
              )}
              
              {deviceInfo?.hasMultipleCameras && (
                <button
                  onClick={toggleCamera}
                  disabled={isStreaming}
                  className="p-3 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Switch Camera"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              )}
              
              <button
                onClick={captureScreenshot}
                disabled={!isStreaming}
                className="p-3 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Capture Screenshot"
              >
                <Camera className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Sidebar */}
          {!isFullscreen && (
            <div className="space-y-6">
              {/* Performance Stats */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Performance
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">FPS:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {performance.fps}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Avg Processing:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {performance.avgProcessingTime}ms
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Detections:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {performance.totalDetections}
                    </span>
                  </div>
                  {performance.lastUpdate && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Last Update:</span>
                      <span className="font-medium text-gray-900 dark:text-white text-xs">
                        {dateUtils.formatTime(performance.lastUpdate)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Detection History */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Recent Detections
                </h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {detectionHistory.slice(0, 10).map((detection, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <Activity className="w-4 h-4 text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 dark:text-white">
                          {detection.people_count} people
                        </p>
                        <p className="text-xs text-gray-500">
                          {dateUtils.getTimeAgo(detection.timestamp)}
                        </p>
                      </div>
                      <div className={cn(
                        'px-2 py-1 text-xs rounded-full',
                        colorUtils.getRiskColor(detection.risk_level)
                      )}>
                        {detection.risk_level}
                      </div>
                    </div>
                  ))}
                  
                  {detectionHistory.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No detections yet. Start live detection to see results.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default AdvancedLiveDetection;
