import React, { useState, useRef, useEffect } from 'react'
import { 
  CameraIcon, 
  StopIcon, 
  PlayIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  UsersIcon,
  ClockIcon,
  SignalIcon,
  Cog6ToothIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline'
import CameraPermissionHandler from './CameraPermissionHandler'
import { streamsApi } from '../utils/api'

const LiveDetection = () => {
  const [isStreaming, setIsStreaming] = useState(false)
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState(false)
  const [showPermissionHandler, setShowPermissionHandler] = useState(false)
  const [currentAnalysis, setCurrentAnalysis] = useState(null)
  const [streamStats, setStreamStats] = useState({
    totalFrames: 0,
    avgProcessingTime: 0,
    uptime: 0
  })
  const [showSettings, setShowSettings] = useState(false)
  const [settings, setSettings] = useState({
    analysisInterval: 2000,
    confidenceThreshold: 0.5,
    showBoundingBoxes: true,
    autoAlert: true
  })
  const [currentStream, setCurrentStream] = useState(null)
  const [error, setError] = useState(null)

  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const intervalRef = useRef(null)
  const startTimeRef = useRef(null)

  useEffect(() => {
    return () => {
      stopStreaming()
    }
  }, [])

  const handleCameraPermissionGranted = () => {
    setCameraPermissionGranted(true)
    setShowPermissionHandler(false)
  }

  const handleCameraPermissionDenied = (error) => {
    setCameraPermissionGranted(false)
    console.error('Camera permission denied:', error)
  }

  const startStreaming = async () => {
    if (!cameraPermissionGranted) {
      setShowPermissionHandler(true)
      return
    }

    try {
      setError(null)
      
      // Create a stream record in the backend
      const streamData = {
        name: `Live Stream ${new Date().toLocaleString()}`,
        description: 'Real-time crowd monitoring',
        stream_type: 'webcam'
      }
      
      console.log('Creating stream in backend...')
      const backendStream = await streamsApi.create(streamData)
      console.log('Backend stream created:', backendStream)
      setCurrentStream(backendStream)

      // Start the stream in backend
      await streamsApi.start(backendStream.id)
      console.log('Stream started in backend')

      // Get camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640, min: 320 },
          height: { ideal: 480, min: 240 },
          facingMode: 'user',
          frameRate: { ideal: 30, min: 15 }
        },
        audio: false
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setIsStreaming(true)
        startTimeRef.current = Date.now()

        // Start analysis interval
        intervalRef.current = setInterval(() => {
          analyzeFrame()
        }, settings.analysisInterval)
      }
    } catch (error) {
      console.error('Failed to start streaming:', error)
      setError(`Failed to start streaming: ${error.message}`)
      
      // Clean up on error
      if (currentStream) {
        try {
          await streamsApi.stop(currentStream.id)
        } catch (stopError) {
          console.error('Failed to stop stream:', stopError)
        }
        setCurrentStream(null)
      }
    }
  }

  const stopStreaming = async () => {
    // Stop analysis interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    // Stop camera stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }

    // Clear video element
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    // Stop backend stream
    if (currentStream) {
      try {
        await streamsApi.stop(currentStream.id)
        console.log('Backend stream stopped')
      } catch (error) {
        console.error('Failed to stop backend stream:', error)
      }
      setCurrentStream(null)
    }

    setIsStreaming(false)
    setCurrentAnalysis(null)
    setStreamStats({ totalFrames: 0, avgProcessingTime: 0, uptime: 0 })
    setError(null)
  }

  const analyzeFrame = async () => {
    if (!videoRef.current || !canvasRef.current || !currentStream) return

    const video = videoRef.current
    const canvas = canvasRef.current

    if (video.readyState < 2) return

    const ctx = canvas.getContext('2d')
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    try {
      const startTime = Date.now()
      
      // Convert canvas to base64 image data
      const frameData = canvas.toDataURL('image/jpeg', 0.8).split(',')[1] // Remove data:image/jpeg;base64, prefix
      
      // Send frame to backend for analysis
      const analysisResult = await streamsApi.analyzeFrame({
        stream_id: currentStream.id,
        frame_data: frameData
      })
      
      const processingTime = Date.now() - startTime
      
      // Use real analysis results from backend
      const analysis = {
        ...analysisResult.analysis,
        processing_time_ms: processingTime,
        timestamp: Date.now()
      }

      setCurrentAnalysis(analysis)
      
      // Update stats
      setStreamStats(prev => ({
        totalFrames: prev.totalFrames + 1,
        avgProcessingTime: (prev.avgProcessingTime * prev.totalFrames + processingTime) / (prev.totalFrames + 1),
        uptime: Math.floor((Date.now() - startTimeRef.current) / 1000)
      }))

      // Draw bounding boxes if enabled
      if (settings.showBoundingBoxes && analysis.bounding_boxes) {
        drawBoundingBoxes(ctx, analysis.bounding_boxes)
      }

      // Auto alert if enabled
      if (settings.autoAlert && analysis.is_stampede_risk) {
        showAlert(analysis)
      }

      // Clear any previous errors
      setError(null)

    } catch (error) {
      console.error('Frame analysis failed:', error)
      setError(`Analysis failed: ${error.message}`)
      
      // Fall back to mock data if API fails
      const mockAnalysis = {
        people_count: Math.floor(Math.random() * 25) + 1,
        confidence_score: 0.8 + Math.random() * 0.15,
        is_stampede_risk: Math.random() > 0.85,
        crowd_density: Math.random(),
        processing_time_ms: Date.now() - startTime,
        risk_level: Math.random() > 0.85 ? 'high_risk' : Math.random() > 0.6 ? 'crowded' : 'normal',
        bounding_boxes: generateMockBoundingBoxes(),
        timestamp: Date.now()
      }
      setCurrentAnalysis(mockAnalysis)
    }
  }

  const generateMockBoundingBoxes = () => {
    const boxes = []
    const numBoxes = Math.floor(Math.random() * 5) + 1
    
    for (let i = 0; i < numBoxes; i++) {
      boxes.push({
        x: Math.random() * 500,
        y: Math.random() * 300,
        width: 40 + Math.random() * 60,
        height: 80 + Math.random() * 100,
        confidence: 0.7 + Math.random() * 0.3
      })
    }
    
    return boxes
  }

  const drawBoundingBoxes = (ctx, boxes) => {
    ctx.strokeStyle = '#10B981'
    ctx.lineWidth = 2
    ctx.font = '12px Arial'
    ctx.fillStyle = '#10B981'

    boxes.forEach((box, index) => {
      ctx.strokeRect(box.x, box.y, box.width, box.height)
      ctx.fillText(
        `Person ${index + 1} (${(box.confidence * 100).toFixed(0)}%)`,
        box.x,
        box.y - 5
      )
    })
  }

  const showAlert = (analysis) => {
    // Create alert notification
    const alertDiv = document.createElement('div')
    alertDiv.className = 'fixed top-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg z-50'
    alertDiv.innerHTML = `
      <div class="flex items-center space-x-2">
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
        </svg>
        <span>High Risk Alert: ${analysis.people_count} people detected!</span>
      </div>
    `
    document.body.appendChild(alertDiv)
    
    setTimeout(() => {
      if (alertDiv.parentNode) {
        alertDiv.parentNode.removeChild(alertDiv)
      }
    }, 5000)
  }

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'high_risk': return 'text-red-600 bg-red-50 border-red-200'
      case 'crowded': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      default: return 'text-green-600 bg-green-50 border-green-200'
    }
  }

  const getRiskIcon = (riskLevel) => {
    switch (riskLevel) {
      case 'high_risk': return <ExclamationTriangleIcon className="w-6 h-6" />
      case 'crowded': return <ExclamationTriangleIcon className="w-6 h-6" />
      default: return <CheckCircleIcon className="w-6 h-6" />
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Live Detection</h1>
        <p className="text-lg text-gray-600">
          Real-time crowd monitoring and stampede risk assessment
        </p>
      </div>

      {/* Permission Handler */}
      {showPermissionHandler && (
        <div className="mb-8">
          <CameraPermissionHandler
            onPermissionGranted={handleCameraPermissionGranted}
            onPermissionDenied={handleCameraPermissionDenied}
          />
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-8 p-4 bg-red-50 border-2 border-red-200 rounded-lg flex items-center space-x-3">
          <ExclamationTriangleIcon className="w-6 h-6 text-red-600 flex-shrink-0" />
          <div>
            <h3 className="text-red-800 font-semibold">Connection Error</h3>
            <p className="text-red-700">{error}</p>
            <p className="text-red-600 text-sm mt-1">
              The system is using fallback mode. Check your connection and try again.
            </p>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Video Stream */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Camera Feed</h2>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <Cog6ToothIcon className="w-5 h-5" />
                </button>
                
                {isStreaming ? (
                  <button
                    onClick={stopStreaming}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                  >
                    <StopIcon className="w-5 h-5" />
                    <span>Stop</span>
                  </button>
                ) : (
                  <button
                    onClick={startStreaming}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                  >
                    <PlayIcon className="w-5 h-5" />
                    <span>Start</span>
                  </button>
                )}
              </div>
            </div>

            {/* Video Container */}
            <div className="relative bg-gray-900 rounded-xl overflow-hidden aspect-video">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
                style={{ display: settings.showBoundingBoxes ? 'block' : 'none' }}
              />
              
              {!isStreaming && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white">
                    <CameraIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Camera feed will appear here</p>
                    <p className="text-sm opacity-75">Click Start to begin monitoring</p>
                  </div>
                </div>
              )}

              {/* Stream Status */}
              {isStreaming && (
                <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-2 rounded-lg flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">LIVE</span>
                </div>
              )}
            </div>

            {/* Settings Panel */}
            {showSettings && (
              <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Detection Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Analysis Interval (ms)
                    </label>
                    <input
                      type="range"
                      min="1000"
                      max="5000"
                      step="500"
                      value={settings.analysisInterval}
                      onChange={(e) => setSettings(prev => ({ ...prev, analysisInterval: parseInt(e.target.value) }))}
                      className="w-full"
                    />
                    <span className="text-sm text-gray-500">{settings.analysisInterval}ms</span>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confidence Threshold
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="0.9"
                      step="0.1"
                      value={settings.confidenceThreshold}
                      onChange={(e) => setSettings(prev => ({ ...prev, confidenceThreshold: parseFloat(e.target.value) }))}
                      className="w-full"
                    />
                    <span className="text-sm text-gray-500">{(settings.confidenceThreshold * 100).toFixed(0)}%</span>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="showBoundingBoxes"
                      checked={settings.showBoundingBoxes}
                      onChange={(e) => setSettings(prev => ({ ...prev, showBoundingBoxes: e.target.checked }))}
                      className="rounded"
                    />
                    <label htmlFor="showBoundingBoxes" className="text-sm font-medium text-gray-700">
                      Show Bounding Boxes
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="autoAlert"
                      checked={settings.autoAlert}
                      onChange={(e) => setSettings(prev => ({ ...prev, autoAlert: e.target.checked }))}
                      className="rounded"
                    />
                    <label htmlFor="autoAlert" className="text-sm font-medium text-gray-700">
                      Auto Alerts
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Analysis Panel */}
        <div className="space-y-6">
          {/* Current Analysis */}
          {currentAnalysis && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Analysis</h3>
              
              {/* Risk Status */}
              <div className={`rounded-xl p-4 mb-4 border-2 ${getRiskColor(currentAnalysis.risk_level)}`}>
                <div className="flex items-center space-x-3">
                  {getRiskIcon(currentAnalysis.risk_level)}
                  <div>
                    <div className="font-semibold">
                      {currentAnalysis.risk_level === 'high_risk' ? 'High Risk' :
                       currentAnalysis.risk_level === 'crowded' ? 'Moderate Risk' : 'Safe'}
                    </div>
                    <div className="text-sm opacity-75">
                      {currentAnalysis.people_count} people detected
                    </div>
                  </div>
                </div>
              </div>

              {/* Metrics */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">People Count</span>
                  <span className="font-semibold text-lg">{currentAnalysis.people_count}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Confidence</span>
                  <span className="font-semibold text-lg">{(currentAnalysis.confidence_score * 100).toFixed(1)}%</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Crowd Density</span>
                  <span className="font-semibold text-lg">{(currentAnalysis.crowd_density * 100).toFixed(0)}%</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Processing Time</span>
                  <span className="font-semibold text-lg">{currentAnalysis.processing_time_ms}ms</span>
                </div>
              </div>
            </div>
          )}

          {/* Stream Statistics */}
          {isStreaming && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Stream Statistics</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Frames Analyzed</span>
                  <span className="font-semibold">{streamStats.totalFrames}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Avg Processing</span>
                  <span className="font-semibold">{streamStats.avgProcessingTime.toFixed(1)}ms</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Uptime</span>
                  <span className="font-semibold">{Math.floor(streamStats.uptime / 60)}m {streamStats.uptime % 60}s</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Status</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="font-semibold text-green-600">Active</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            
            <div className="space-y-3">
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors">
                Save Current Frame
              </button>
              
              <button className="w-full border-2 border-gray-300 hover:border-gray-400 text-gray-700 py-3 rounded-lg font-medium transition-colors">
                Export Analysis Report
              </button>
              
              <button className="w-full border-2 border-green-300 hover:border-green-400 text-green-700 py-3 rounded-lg font-medium transition-colors">
                Share Live Feed
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LiveDetection
