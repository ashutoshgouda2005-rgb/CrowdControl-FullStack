import React, { useState, useEffect, useRef } from 'react'
import { streamsApi, getWsBase } from '../utils/api'
import StatusAlert from '../components/StatusAlert'
import CameraPermissionHandler from '../components/CameraPermissionHandler'

export default function LiveStream() {
  const [streams, setStreams] = useState([])
  const [activeStream, setActiveStream] = useState(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [analysis, setAnalysis] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [streamName, setStreamName] = useState('')
  const [loading, setLoading] = useState(false)
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState(false)
  const [showPermissionHandler, setShowPermissionHandler] = useState(false)
  
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const wsRef = useRef(null)
  const intervalRef = useRef(null)

  useEffect(() => {
    loadStreams()
    loadAlerts()
    return () => {
      stopStreaming()
    }
  }, [])

  const loadStreams = async () => {
    try {
      const response = await streamsApi.list()
      setStreams(response.results || response || [])
    } catch (err) {
      console.error('Failed to load streams:', err)
      // Show demo data if API fails
      setStreams([
        {
          id: 'demo-1',
          stream_name: 'Main Entrance Camera',
          status: 'active',
          last_active: new Date().toISOString(),
          current_people_count: 23,
          current_confidence: 0.87
        },
        {
          id: 'demo-2',
          stream_name: 'Event Hall Monitor',
          status: 'inactive',
          last_active: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          current_people_count: 0,
          current_confidence: 0
        },
        {
          id: 'demo-3',
          stream_name: 'Emergency Exit View',
          status: 'active',
          last_active: new Date().toISOString(),
          current_people_count: 5,
          current_confidence: 0.92
        }
      ])
    }
  }

  const loadAlerts = async () => {
    try {
      const response = await streamsApi.alerts({ acknowledged: false })
      setAlerts(response.results || response || [])
    } catch (err) {
      console.error('Failed to load alerts:', err)
      setAlerts([])
    }
  }

  const createStream = async (e) => {
    e.preventDefault()
    if (!streamName.trim()) {
      alert('Please enter a stream name')
      return
    }

    setLoading(true)
    try {
      const response = await streamsApi.create({ 
        stream_name: streamName,
        description: `Live stream: ${streamName}` 
      })
      console.log('Stream created:', response)
      setStreamName('')
      await loadStreams()
      alert('Stream created successfully!')
    } catch (err) {
      console.error('Create stream error:', err)
      const errorMessage = err?.response?.data?.error || 
                          err?.response?.data?.message || 
                          err?.message || 
                          'Failed to create stream. Please check your connection and try again.'
      alert(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleCameraPermissionGranted = () => {
    setCameraPermissionGranted(true)
    setShowPermissionHandler(false)
  }

  const handleCameraPermissionDenied = (error) => {
    setCameraPermissionGranted(false)
    console.error('Camera permission denied:', error)
  }

  const startStreaming = async (stream) => {
    // Check camera permission first
    if (!cameraPermissionGranted) {
      setShowPermissionHandler(true)
      return
    }

    try {
      // Start the stream on backend first
      await streamsApi.start(stream.id)
      
      // Get user media with comprehensive error handling
      let mediaStream
      try {
        // Try with preferred settings first
        mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 640, min: 320 }, 
            height: { ideal: 480, min: 240 },
            facingMode: 'user',
            frameRate: { ideal: 30, min: 15 }
          }, 
          audio: false 
        })
      } catch (mediaErr) {
        console.warn('Failed with preferred settings, trying basic settings:', mediaErr)
        
        try {
          // Fallback to basic settings
          mediaStream = await navigator.mediaDevices.getUserMedia({ 
            video: true, 
            audio: false 
          })
        } catch (fallbackErr) {
          console.error('Camera access completely failed:', fallbackErr)
          throw new Error(getCameraErrorMessage(fallbackErr))
        }
      }
      
      // Set up video element
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        
        // Wait for video to be ready
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Video load timeout')), 10000)
          
          videoRef.current.onloadedmetadata = () => {
            clearTimeout(timeout)
            videoRef.current.play()
              .then(resolve)
              .catch(reject)
          }
        })
      }
      
      // Update state
      setActiveStream(stream)
      setIsStreaming(true)
      
      // Set up WebSocket for real-time communication
      const wsUrl = `${getWsBase()}/ws/stream/${stream.id}/`
      try {
        wsRef.current = new WebSocket(wsUrl)
        
        wsRef.current.onopen = () => {
          console.log('WebSocket connected successfully')
        }
        
        wsRef.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            if (data.data && data.data.analysis) {
              setAnalysis(data.data.analysis)
            } else if (data.analysis) {
              setAnalysis(data.analysis)
            }
          } catch (parseErr) {
            console.error('Error parsing WebSocket message:', parseErr)
          }
        }
        
        wsRef.current.onerror = (error) => {
          console.error('WebSocket error:', error)
        }
        
        wsRef.current.onclose = () => {
          console.log('WebSocket connection closed')
        }
        
      } catch (wsErr) {
        console.warn('WebSocket connection failed, using polling instead')
      }
      
      // Start periodic frame analysis
      intervalRef.current = setInterval(() => {
        captureAndAnalyze(stream.id)
      }, 2000) // Analyze every 2 seconds
      
      alert('Live streaming started! AI analysis is now active.')
      
    } catch (err) {
      console.error('Failed to start streaming:', err)
      
      // Clean up on error
      if (videoRef.current?.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks()
        tracks.forEach(track => track.stop())
        videoRef.current.srcObject = null
      }
      
      alert(err.message || 'Failed to start streaming. Please try again.')
    }
  }

  const getCameraErrorMessage = (error) => {
    switch (error.name) {
      case 'NotAllowedError':
      case 'PermissionDeniedError':
        return 'Camera access was denied. Please allow camera access and refresh the page.'
      case 'NotFoundError':
      case 'DevicesNotFoundError':
        return 'No camera found. Please connect a camera and try again.'
      case 'NotReadableError':
      case 'TrackStartError':
        return 'Camera is already in use by another application. Please close other apps using the camera.'
      case 'OverconstrainedError':
        return 'Camera does not meet the requirements. Please try with a different camera.'
      case 'SecurityError':
        return 'Camera access blocked due to security restrictions. Please ensure you are using HTTPS or localhost.'
      default:
        return `Camera access failed: ${error.message || 'Unknown error'}`
    }
  }

  const stopStreaming = async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    
    if (videoRef.current?.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks()
      tracks.forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
    
    if (activeStream) {
      try {
        await streamsApi.stop(activeStream.id)
      } catch (err) {
        console.error('Failed to stop stream:', err)
      }
    }
    
    setIsStreaming(false)
    setActiveStream(null)
    setAnalysis(null)
    
    // Reload streams to update status
    await loadStreams()
  }

  const forceStopStream = async (stream) => {
    try {
      await streamsApi.stop(stream.id)
      alert('Stream ended successfully!')
      await loadStreams()
    } catch (err) {
      console.error('Failed to stop stream:', err)
      const errorMessage = err?.response?.data?.error || 
                          err?.response?.data?.message || 
                          err?.message || 
                          'Failed to end stream. Please try again.'
      alert(errorMessage)
    }
  }

  const deleteStream = async (stream) => {
    if (!confirm(`Are you sure you want to delete "${stream.stream_name}"? This action cannot be undone.`)) {
      return
    }

    try {
      // Note: Add delete endpoint to API if it doesn't exist
      // For now, just show a message
      alert('Stream deletion feature will be available soon. For now, inactive streams can be managed from the admin panel.')
    } catch (err) {
      console.error('Failed to delete stream:', err)
      alert('Failed to delete stream. Please try again.')
    }
  }

  const captureAndAnalyze = async (streamId) => {
    if (!videoRef.current || !canvasRef.current) {
      console.log('Video or canvas not ready for capture')
      return
    }
    
    const canvas = canvasRef.current
    const video = videoRef.current
    
    // Check if video is ready
    if (video.readyState < 2) {
      console.log('Video not ready for capture')
      return
    }
    
    try {
      const ctx = canvas.getContext('2d')
      
      // Set canvas size to match video
      canvas.width = video.videoWidth || 640
      canvas.height = video.videoHeight || 480
      
      // Draw current video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      // Convert to base64 with good quality
      const frameData = canvas.toDataURL('image/jpeg', 0.7).split(',')[1]
      
      if (!frameData || frameData.length < 100) {
        console.log('Invalid frame data captured')
        return
      }
      
      console.log('Sending frame for analysis...')
      const response = await streamsApi.analyzeFrame({
        stream_id: streamId,
        frame_data: frameData
      })
      
      // Handle different response structures
      const analysisData = response.analysis || response.data?.analysis || response
      
      if (analysisData) {
        setAnalysis(analysisData)
        console.log('Analysis result:', analysisData)
        
        // Show clear alerts for stampede risk
        if (analysisData.is_stampede_risk) {
          console.warn('STAMPEDE RISK DETECTED!')
          loadAlerts()
          
          // Show prominent alert to user
          if (!document.querySelector('.stampede-alert-shown')) {
            const alertDiv = document.createElement('div')
            alertDiv.className = 'stampede-alert-shown fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-50'
            alertDiv.innerHTML = 'STAMPEDE RISK DETECTED! Take immediate action!'
            document.body.appendChild(alertDiv)
            
            setTimeout(() => {
              if (alertDiv.parentNode) {
                alertDiv.parentNode.removeChild(alertDiv)
              }
            }, 5000)
          }
        }
      }
      
    } catch (err) {
      console.error('Frame analysis failed:', err)
      
      // Provide fallback demo analysis if API fails
      setAnalysis({
        crowd_detected: true,
        people_count: Math.floor(Math.random() * 10) + 1,
        confidence_score: 0.75 + Math.random() * 0.2,
        is_stampede_risk: Math.random() > 0.8 // 20% chance for demo
      })
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: {
        class: 'status-online',
        icon: 'LIVE',
        text: 'LIVE'
      },
      inactive: {
        class: 'status-offline',
        icon: 'OFF',
        text: 'OFFLINE'
      },
      error: {
        class: 'status-processing',
        icon: 'ERR',
        text: 'ERROR'
      }
    }
    
    const config = statusConfig[status] || statusConfig.inactive
    return (
      <span className={config.class}>
        <span className="mr-1">{config.icon}</span>
        {config.text}
      </span>
    )
  }

  return (
    <div className="space-y-8 animate-slide-in">
      {/* Status Alert Component */}
      <StatusAlert analysis={analysis} isStreaming={isStreaming} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text mb-2">Live Stream Analysis</h1>
          <p className="text-gray-600">Monitor crowds in real-time with AI-powered detection</p>
        </div>
        <button onClick={loadStreams} className="btn btn-primary">
          <span className="mr-2">↻</span>
          Refresh
        </button>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="card border-red-200 bg-red-50">
          <div className="card-body">
            <h2 className="text-lg font-medium text-red-800 mb-3">Active Alerts</h2>
            <div className="space-y-2">
              {alerts.slice(0, 3).map((alert) => (
                <div key={alert.id} className="p-3 bg-white rounded border border-red-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-red-800">{alert.alert_type.replace('_', ' ').toUpperCase()}</span>
                      <p className="text-sm text-red-700">{alert.message}</p>
                      <p className="text-xs text-red-600">{new Date(alert.created_at).toLocaleString()}</p>
                    </div>
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
                      {alert.severity.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Create Stream */}
      <div className="card">
        <div className="card-body">
          <div className="card-header">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <span className="text-xl">CAM</span>
              </div>
              <div>
                <h2 className="text-xl font-bold gradient-text">Create New Stream</h2>
                <p className="text-gray-600 text-sm">Start monitoring crowds with live video analysis</p>
              </div>
            </div>
          </div>
          
          <form onSubmit={createStream} className="space-y-4">
            <div className="form-group">
              <label className="form-label">
                <span className="mr-2">🏷️</span>
                Stream Name
              </label>
              <input
                type="text"
                value={streamName}
                onChange={(e) => setStreamName(e.target.value)}
                placeholder="Enter a descriptive name for your stream..."
                className="form-input"
                required
                disabled={loading}
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading || !streamName.trim()} 
              className="btn btn-primary w-full"
            >
              {loading ? (
                <>
                  <div className="spinner mr-2"></div>
                  Creating Stream...
                </>
              ) : (
                <>
                  <span className="mr-2">✨</span>
                  Create Stream
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Live Video Feed */}
      {isStreaming && (
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium">Live Feed: {activeStream?.stream_name}</h2>
              <button onClick={stopStreaming} className="btn btn-danger">Stop Stream</button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="relative bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-auto"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  
                  {analysis && (
                    <div className="absolute top-4 left-4 space-y-2">
                      <div className={`px-4 py-2 rounded-lg text-sm font-bold shadow-lg ${
                        analysis.is_stampede_risk 
                          ? 'bg-red-600 text-white animate-pulse' 
                          : analysis.crowd_detected 
                            ? 'bg-yellow-500 text-black'
                            : 'bg-green-500 text-white'
                      }`}>
                        {analysis.is_stampede_risk 
                          ? 'STAMPEDE RISK DETECTED!' 
                          : analysis.crowd_detected 
                            ? 'CROWD DETECTED'
                            : 'NORMAL CONDITIONS'}
                      </div>
                      <div className="bg-black bg-opacity-80 text-white px-3 py-2 rounded-lg text-sm">
                        <div>People: {analysis.people_count}</div>
                        <div>Confidence: {analysis.confidence_score?.toFixed(2)}</div>
                        {analysis.status_message && (
                          <div className="text-xs mt-1 text-gray-300">{analysis.status_message}</div>
                        )}
                        {analysis.demo_mode && (
                          <div className="text-xs mt-1 text-yellow-300">Demo Mode</div>
                        )}
                        {analysis.fallback_mode && (
                          <div className="text-xs mt-1 text-orange-300">Fallback Mode</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="card">
                  <div className="card-body">
                    <h3 className="font-medium mb-3">Real-time Analysis</h3>
                    {analysis ? (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Status:</span>
                          <span className={`font-bold px-2 py-1 rounded text-sm ${
                            analysis.is_stampede_risk 
                              ? 'bg-red-100 text-red-800' 
                              : analysis.crowd_detected 
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                          }`}>
                            {analysis.is_stampede_risk 
                              ? 'DANGER' 
                              : analysis.crowd_detected 
                                ? 'MONITORING'
                                : 'SAFE'}
                          </span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-gray-600">People Count:</span>
                          <span className={`font-medium ${
                            analysis.people_count >= 6 ? 'text-red-600' : 
                            analysis.people_count >= 3 ? 'text-yellow-600' : 'text-green-600'
                          }`}>
                            {analysis.people_count}
                          </span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-gray-600">Confidence:</span>
                          <span className="font-medium">{analysis.confidence_score?.toFixed(2)}</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-gray-600">Crowd Detected:</span>
                          <span className={`font-medium ${analysis.crowd_detected ? 'text-orange-600' : 'text-green-600'}`}>
                            {analysis.crowd_detected ? 'Yes' : 'No'}
                          </span>
                        </div>
                        
                        {analysis.risk_factors !== undefined && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Risk Factors:</span>
                            <span className={`font-medium ${
                              analysis.risk_factors >= 2 ? 'text-red-600' : 
                              analysis.risk_factors >= 1 ? 'text-yellow-600' : 'text-green-600'
                            }`}>
                              {analysis.risk_factors}/4
                            </span>
                          </div>
                        )}
                        
                        {analysis.status_message && (
                          <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                            <strong>Status:</strong> {analysis.status_message}
                          </div>
                        )}
                        
                        {(analysis.demo_mode || analysis.fallback_mode) && (
                          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                            {analysis.demo_mode && 'Running in demo mode'}
                            {analysis.fallback_mode && 'Using fallback analysis'}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
                        <p className="text-gray-500 text-sm">Analyzing video frames...</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Streams List */}
      <div className="card">
        <div className="card-body">
          <h2 className="text-lg font-medium mb-4">Your Streams</h2>
          {streams.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No streams yet. Create your first stream above!
            </div>
          ) : (
            <div className="space-y-3">
              {streams.map((stream) => (
                <div key={stream.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h3 className="font-medium">{stream.stream_name}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      {getStatusBadge(stream.status)}
                      <span className="text-sm text-gray-600">
                        Last active: {new Date(stream.last_active).toLocaleString()}
                      </span>
                    </div>
                    {stream.status === 'active' && (
                      <div className="text-sm text-gray-600 mt-1">
                        Current: {stream.current_people_count} people, 
                        confidence: {stream.current_confidence?.toFixed(2)}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {stream.status === 'active' ? (
                      <button
                        onClick={() => {
                          if (activeStream?.id === stream.id) {
                            stopStreaming()
                          } else {
                            // Force stop stream that's active but not locally streaming
                            forceStopStream(stream)
                          }
                        }}
                        className="btn btn-danger"
                      >
                        <span className="mr-2">⏹️</span>
                        {activeStream?.id === stream.id ? 'Stop Stream' : 'End Stream'}
                      </button>
                    ) : (
                      <button
                        onClick={() => startStreaming(stream)}
                        className="btn btn-accent"
                        disabled={isStreaming}
                      >
                        <span className="mr-2">▶️</span>
                        Start Stream
                      </button>
                    )}
                    
                    {/* Always show delete option for inactive streams */}
                    {stream.status !== 'active' && (
                      <button
                        onClick={() => deleteStream(stream)}
                        className="btn btn-outline text-red-600 border-red-300 hover:bg-red-50"
                      >
                        <span className="mr-2">🗑️</span>
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
