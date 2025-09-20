import React, { useState, useEffect, useRef } from 'react'
import { streamsApi, analysisApi } from '../utils/api'

export default function PublicMonitoring() {
  const [streams, setStreams] = useState([])
  const [activeStreams, setActiveStreams] = useState(new Map())
  const [alerts, setAlerts] = useState([])
  const [selectedStream, setSelectedStream] = useState(null)
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [systemStats, setSystemStats] = useState({
    totalStreams: 0,
    activeStreams: 0,
    alertsToday: 0,
    systemLoad: 0
  })

  const wsRef = useRef(null)
  const videoRefs = useRef(new Map())
  const canvasRefs = useRef(new Map())

  useEffect(() => {
    loadStreams()
    connectWebSocket()
    
    return () => {
      disconnectWebSocket()
      stopAllStreams()
    }
  }, [])

  const loadStreams = async () => {
    try {
      const response = await streamsApi.list()
      setStreams(response.results || response.data || [])
      updateSystemStats()
    } catch (error) {
      console.error('Failed to load streams:', error)
    }
  }

  const connectWebSocket = () => {
    try {
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const wsHost = window.location.hostname
      const wsPort = window.location.hostname === 'localhost' ? '8000' : window.location.port || '8000'
      const wsUrl = `${wsProtocol}//${wsHost}:${wsPort}/ws/public-monitoring/`

      wsRef.current = new WebSocket(wsUrl)

      wsRef.current.onopen = () => {
        console.log('Public monitoring WebSocket connected')
      }

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          handleWebSocketMessage(data)
        } catch (error) {
          console.error('WebSocket message parsing failed:', error)
        }
      }

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error)
      }

      wsRef.current.onclose = () => {
        console.log('WebSocket connection closed')
        // Attempt to reconnect after 5 seconds
        setTimeout(connectWebSocket, 5000)
      }
    } catch (error) {
      console.error('WebSocket connection failed:', error)
    }
  }

  const disconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
  }

  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'stream_analysis':
        updateStreamAnalysis(data.stream_id, data.analysis)
        break
      case 'alert':
        addAlert(data.alert)
        break
      case 'system_stats':
        setSystemStats(data.stats)
        break
      default:
        console.log('Unknown WebSocket message type:', data.type)
    }
  }

  const updateStreamAnalysis = (streamId, analysis) => {
    setActiveStreams(prev => {
      const updated = new Map(prev)
      updated.set(streamId, {
        ...updated.get(streamId),
        lastAnalysis: analysis,
        lastUpdate: new Date()
      })
      return updated
    })

    // Check for alerts
    if (analysis.is_stampede_risk) {
      const stream = streams.find(s => s.id === streamId)
      addAlert({
        id: Date.now(),
        streamId,
        streamName: stream?.name || 'Unknown Stream',
        level: 'critical',
        message: `Stampede risk detected: ${analysis.people_count} people`,
        timestamp: new Date(),
        analysis
      })
    }
  }

  const addAlert = (alert) => {
    setAlerts(prev => [alert, ...prev.slice(0, 49)]) // Keep last 50 alerts
    
    // Play alert sound for critical alerts
    if (alert.level === 'critical') {
      playAlertSound()
      
      // Show browser notification
      if (Notification.permission === 'granted') {
        new Notification(`Alert: ${alert.streamName}`, {
          body: alert.message,
          icon: '/favicon.ico',
          tag: `alert-${alert.streamId}`
        })
      }
    }
  }

  const playAlertSound = () => {
    const audio = new Audio('/alert-sound.mp3')
    audio.play().catch(e => console.log('Audio play failed:', e))
  }

  const startStreamMonitoring = async (stream) => {
    try {
      // Start stream processing on backend
      await streamsApi.start(stream.id)
      
      // Add to active streams
      setActiveStreams(prev => {
        const updated = new Map(prev)
        updated.set(stream.id, {
          stream,
          status: 'active',
          startTime: new Date(),
          lastAnalysis: null,
          lastUpdate: null
        })
        return updated
      })

      // If this is a CCTV stream, start video processing
      if (stream.stream_url) {
        startVideoProcessing(stream)
      }

      updateSystemStats()
    } catch (error) {
      console.error('Failed to start stream monitoring:', error)
      alert(`Failed to start monitoring for ${stream.name}`)
    }
  }

  const stopStreamMonitoring = async (streamId) => {
    try {
      await streamsApi.stop(streamId)
      
      setActiveStreams(prev => {
        const updated = new Map(prev)
        updated.delete(streamId)
        return updated
      })

      // Stop video processing
      const videoRef = videoRefs.current.get(streamId)
      if (videoRef && videoRef.srcObject) {
        videoRef.srcObject.getTracks().forEach(track => track.stop())
        videoRef.srcObject = null
      }

      updateSystemStats()
    } catch (error) {
      console.error('Failed to stop stream monitoring:', error)
    }
  }

  const startVideoProcessing = (stream) => {
    const videoRef = videoRefs.current.get(stream.id)
    const canvasRef = canvasRefs.current.get(stream.id)
    
    if (!videoRef || !canvasRef) return

    // For CCTV streams, we would typically connect to an RTSP stream
    // For demo purposes, we'll use a placeholder
    videoRef.src = stream.stream_url || '/demo-crowd-video.mp4'
    videoRef.loop = true
    videoRef.muted = true
    
    videoRef.onloadeddata = () => {
      // Start frame analysis
      const interval = setInterval(() => {
        analyzeVideoFrame(stream.id, videoRef, canvasRef)
      }, 2000) // Analyze every 2 seconds for performance

      // Store interval for cleanup
      setActiveStreams(prev => {
        const updated = new Map(prev)
        const streamData = updated.get(stream.id)
        if (streamData) {
          streamData.analysisInterval = interval
          updated.set(stream.id, streamData)
        }
        return updated
      })
    }
  }

  const analyzeVideoFrame = async (streamId, videoRef, canvasRef) => {
    try {
      const canvas = canvasRef
      const ctx = canvas.getContext('2d')
      
      canvas.width = videoRef.videoWidth || 640
      canvas.height = videoRef.videoHeight || 480
      
      ctx.drawImage(videoRef, 0, 0, canvas.width, canvas.height)
      
      const frameData = canvas.toDataURL('image/jpeg', 0.8).split(',')[1]
      
      const response = await analysisApi.analyzeFrame({
        stream_id: streamId,
        frame_data: frameData,
        public_mode: true
      })

      if (response.analysis) {
        updateStreamAnalysis(streamId, response.analysis)
      }
    } catch (error) {
      console.error('Frame analysis failed for stream', streamId, error)
    }
  }

  const stopAllStreams = () => {
    activeStreams.forEach((streamData, streamId) => {
      if (streamData.analysisInterval) {
        clearInterval(streamData.analysisInterval)
      }
      stopStreamMonitoring(streamId)
    })
  }

  const updateSystemStats = () => {
    setSystemStats(prev => ({
      ...prev,
      totalStreams: streams.length,
      activeStreams: activeStreams.size,
      alertsToday: alerts.filter(alert => 
        new Date(alert.timestamp).toDateString() === new Date().toDateString()
      ).length
    }))
  }

  const acknowledgeAlert = (alertId) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ))
  }

  const getAlertColor = (level) => {
    switch (level) {
      case 'critical': return 'bg-red-100 border-red-500 text-red-800'
      case 'warning': return 'bg-yellow-100 border-yellow-500 text-yellow-800'
      case 'info': return 'bg-blue-100 border-blue-500 text-blue-800'
      default: return 'bg-gray-100 border-gray-500 text-gray-800'
    }
  }

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Public Monitoring Dashboard</h1>
              <p className="text-gray-600">Multi-stream crowd surveillance system</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-gray-500">System Status</div>
                <div className={`text-lg font-bold ${isMonitoring ? 'text-green-600' : 'text-gray-400'}`}>
                  {isMonitoring ? 'MONITORING' : 'STANDBY'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Stats */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-2xl font-bold text-blue-600">{systemStats.totalStreams}</div>
            <div className="text-sm text-gray-600">Total Streams</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-2xl font-bold text-green-600">{systemStats.activeStreams}</div>
            <div className="text-sm text-gray-600">Active Streams</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-2xl font-bold text-orange-600">{systemStats.alertsToday}</div>
            <div className="text-sm text-gray-600">Alerts Today</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-2xl font-bold text-purple-600">{systemStats.systemLoad}%</div>
            <div className="text-sm text-gray-600">System Load</div>
          </div>
        </div>
      </div>

      <div className="px-6 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stream Management */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b">
                <h2 className="text-lg font-semibold">Stream Management</h2>
              </div>
              <div className="p-6">
                {/* Stream Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {streams.map(stream => {
                    const isActive = activeStreams.has(stream.id)
                    const streamData = activeStreams.get(stream.id)
                    
                    return (
                      <div key={stream.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-medium">{stream.name}</h3>
                          <div className={`px-2 py-1 rounded-full text-xs ${
                            isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {isActive ? 'ACTIVE' : 'INACTIVE'}
                          </div>
                        </div>
                        
                        {/* Video Preview */}
                        <div className="relative mb-3">
                          <video
                            ref={el => videoRefs.current.set(stream.id, el)}
                            className="w-full h-32 bg-black rounded object-cover"
                            muted
                            autoPlay
                          />
                          <canvas
                            ref={el => canvasRefs.current.set(stream.id, el)}
                            className="hidden"
                          />
                          
                          {/* Analysis Overlay */}
                          {streamData?.lastAnalysis && (
                            <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs">
                              People: {streamData.lastAnalysis.people_count}
                            </div>
                          )}
                          
                          {streamData?.lastAnalysis?.is_stampede_risk && (
                            <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded text-xs animate-pulse">
                              RISK DETECTED
                            </div>
                          )}
                        </div>
                        
                        {/* Stream Info */}
                        <div className="text-sm text-gray-600 mb-3">
                          <div>Location: {stream.location || 'Not specified'}</div>
                          {streamData?.lastUpdate && (
                            <div>Last Update: {formatTimestamp(streamData.lastUpdate)}</div>
                          )}
                        </div>
                        
                        {/* Controls */}
                        <div className="flex space-x-2">
                          {!isActive ? (
                            <button
                              onClick={() => startStreamMonitoring(stream)}
                              className="flex-1 bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700"
                            >
                              Start Monitoring
                            </button>
                          ) : (
                            <button
                              onClick={() => stopStreamMonitoring(stream.id)}
                              className="flex-1 bg-red-600 text-white py-2 px-3 rounded text-sm hover:bg-red-700"
                            >
                              Stop Monitoring
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedStream(stream)}
                            className="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
                          >
                            Details
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
                
                {streams.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No streams configured. Add CCTV feeds to start monitoring.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Alerts Panel */}
          <div>
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b">
                <h2 className="text-lg font-semibold">Live Alerts</h2>
              </div>
              <div className="p-6">
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {alerts.slice(0, 10).map(alert => (
                    <div
                      key={alert.id}
                      className={`border-l-4 p-3 rounded ${getAlertColor(alert.level)} ${
                        alert.acknowledged ? 'opacity-50' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{alert.streamName}</div>
                          <div className="text-sm mt-1">{alert.message}</div>
                          <div className="text-xs mt-1 opacity-75">
                            {formatTimestamp(alert.timestamp)}
                          </div>
                        </div>
                        {!alert.acknowledged && (
                          <button
                            onClick={() => acknowledgeAlert(alert.id)}
                            className="ml-2 text-xs px-2 py-1 bg-white bg-opacity-50 rounded hover:bg-opacity-75"
                          >
                            ACK
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {alerts.length === 0 && (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      No alerts yet
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm mt-6">
              <div className="px-6 py-4 border-b">
                <h2 className="text-lg font-semibold">Quick Actions</h2>
              </div>
              <div className="p-6 space-y-3">
                <button
                  onClick={() => {
                    if (activeStreams.size > 0) {
                      stopAllStreams()
                      setIsMonitoring(false)
                    } else {
                      streams.forEach(stream => startStreamMonitoring(stream))
                      setIsMonitoring(true)
                    }
                  }}
                  className={`w-full py-2 px-4 rounded font-medium ${
                    activeStreams.size > 0
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {activeStreams.size > 0 ? 'Stop All Monitoring' : 'Start All Monitoring'}
                </button>
                
                <button
                  onClick={() => window.location.href = '/streams/add'}
                  className="w-full py-2 px-4 border border-gray-300 rounded font-medium hover:bg-gray-50"
                >
                  Add New Stream
                </button>
                
                <button
                  onClick={() => setAlerts([])}
                  className="w-full py-2 px-4 border border-gray-300 rounded font-medium hover:bg-gray-50"
                >
                  Clear All Alerts
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
