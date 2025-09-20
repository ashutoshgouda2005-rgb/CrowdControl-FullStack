import React, { useState, useEffect, useRef } from 'react'
import { streamsApi, getWsBase } from '../utils/api'

export default function LiveStream() {
  const [streams, setStreams] = useState([])
  const [activeStream, setActiveStream] = useState(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [analysis, setAnalysis] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [streamName, setStreamName] = useState('')
  const [loading, setLoading] = useState(false)
  
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
          stream_name: 'Demo Stream 1',
          status: 'inactive',
          last_active: new Date().toISOString(),
          current_people_count: 0,
          current_confidence: 0
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

  const startStreaming = async (stream) => {
    try {
      // Start the stream on backend
      await streamsApi.start(stream.id)
      
      // Get user media
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 }, 
        audio: false 
      })
      
      videoRef.current.srcObject = mediaStream
      setActiveStream(stream)
      setIsStreaming(true)
      
      // Connect WebSocket for real-time updates
      const wsUrl = `${getWsBase()}/ws/stream/${stream.id}/`
      wsRef.current = new WebSocket(wsUrl)
      
      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data)
        if (data.analysis) {
          setAnalysis(data.analysis)
        }
      }
      
      // Start frame analysis
      intervalRef.current = setInterval(() => {
        captureAndAnalyze(stream.id)
      }, 2000) // Analyze every 2 seconds
      
    } catch (err) {
      console.error('Failed to start streaming:', err)
      alert('Failed to start streaming: ' + err.message)
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
  }

  const captureAndAnalyze = async (streamId) => {
    if (!videoRef.current || !canvasRef.current) return
    
    const canvas = canvasRef.current
    const video = videoRef.current
    const ctx = canvas.getContext('2d')
    
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0)
    
    // Convert to base64
    const frameData = canvas.toDataURL('image/jpeg', 0.8).split(',')[1]
    
    try {
      const { data } = await streamsApi.analyzeFrame({
        stream_id: streamId,
        frame_data: frameData
      })
      setAnalysis(data.analysis)
      
      // Reload alerts if stampede risk detected
      if (data.analysis?.is_stampede_risk) {
        loadAlerts()
      }
    } catch (err) {
      console.error('Frame analysis failed:', err)
    }
  }

  const getStatusBadge = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      error: 'bg-red-100 text-red-800'
    }
    return `px-2 py-1 rounded-full text-xs font-medium ${colors[status] || colors.inactive}`
  }

  return (
    <div className="space-y-8 animate-slide-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text mb-2">Live Stream Analysis</h1>
          <p className="text-gray-600">Monitor crowds in real-time with AI-powered detection</p>
        </div>
        <button onClick={loadStreams} className="btn btn-primary">
          <span className="mr-2">🔄</span>
          Refresh
        </button>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="card border-red-200 bg-red-50">
          <div className="card-body">
            <h2 className="text-lg font-medium text-red-800 mb-3">🚨 Active Alerts</h2>
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
                <span className="text-xl">📹</span>
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
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                        analysis.is_stampede_risk ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
                      }`}>
                        {analysis.is_stampede_risk ? '⚠️ STAMPEDE RISK' : '✅ NORMAL'}
                      </div>
                      <div className="bg-black bg-opacity-75 text-white px-3 py-1 rounded text-sm">
                        People: {analysis.people_count} | Confidence: {analysis.confidence_score?.toFixed(2)}
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
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <span className={`font-medium ${
                            analysis.is_stampede_risk ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {analysis.is_stampede_risk ? 'Risk Detected' : 'Normal'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">People Count:</span>
                          <span className="font-medium">{analysis.people_count}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Confidence:</span>
                          <span className="font-medium">{analysis.confidence_score?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Crowd Detected:</span>
                          <span className="font-medium">{analysis.crowd_detected ? 'Yes' : 'No'}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">Analyzing frames...</p>
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
                      <span className={getStatusBadge(stream.status)}>{stream.status}</span>
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
                    {!isStreaming && stream.status !== 'active' && (
                      <button
                        onClick={() => startStreaming(stream)}
                        className="btn btn-accent"
                      >
                        Start Stream
                      </button>
                    )}
                    {isStreaming && activeStream?.id === stream.id && (
                      <button onClick={stopStreaming} className="btn btn-danger">
                        Stop Stream
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
