import React, { useState, useEffect } from 'react'

export default function StatusAlert({ analysis, isStreaming }) {
  const [alertHistory, setAlertHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    if (analysis && analysis.is_stampede_risk) {
      const newAlert = {
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        message: analysis.status_message || 'Stampede risk detected!',
        severity: 'critical',
        peopleCount: analysis.people_count,
        confidence: analysis.confidence_score
      }
      
      setAlertHistory(prev => [newAlert, ...prev.slice(0, 9)]) // Keep last 10 alerts
    }
  }, [analysis])

  if (!isStreaming) return null

  const getStatusColor = () => {
    if (!analysis) return 'bg-gray-100 text-gray-600'
    
    if (analysis.is_stampede_risk) return 'bg-red-100 text-red-800 border-red-300'
    if (analysis.crowd_detected) return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    return 'bg-green-100 text-green-800 border-green-300'
  }

  const getStatusIcon = () => {
    if (!analysis) return '⏳'
    
    if (analysis.is_stampede_risk) return '🚨'
    if (analysis.crowd_detected) return '👥'
    return '✅'
  }

  const getStatusText = () => {
    if (!analysis) return 'Initializing AI analysis...'
    
    if (analysis.is_stampede_risk) return 'STAMPEDE RISK - TAKE ACTION NOW!'
    if (analysis.crowd_detected) return 'Crowd detected - Monitoring situation'
    return 'Normal conditions - All clear'
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      {/* Main Status Card */}
      <div className={`border-2 rounded-lg p-4 shadow-lg ${getStatusColor()} ${
        analysis?.is_stampede_risk ? 'animate-pulse' : ''
      }`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">{getStatusIcon()}</span>
            <span className="font-bold text-sm">AI CROWD MONITOR</span>
          </div>
          {alertHistory.length > 0 && (
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="text-xs px-2 py-1 rounded bg-white bg-opacity-50 hover:bg-opacity-75"
            >
              History ({alertHistory.length})
            </button>
          )}
        </div>
        
        <div className="text-sm font-medium mb-2">
          {getStatusText()}
        </div>
        
        {analysis && (
          <div className="text-xs space-y-1">
            <div>👥 People: {analysis.people_count} | 📊 Confidence: {analysis.confidence_score?.toFixed(2)}</div>
            {analysis.demo_mode && <div className="text-yellow-700">🔧 Demo Mode Active</div>}
            {analysis.fallback_mode && <div className="text-orange-700">⚠️ Fallback Mode</div>}
          </div>
        )}
        
        {analysis?.is_stampede_risk && (
          <div className="mt-2 text-xs font-bold">
            ⚡ IMMEDIATE ACTIONS REQUIRED:
            <ul className="list-disc list-inside mt-1 text-xs">
              <li>Alert security personnel</li>
              <li>Activate crowd control measures</li>
              <li>Monitor exit routes</li>
            </ul>
          </div>
        )}
      </div>

      {/* Alert History */}
      {showHistory && alertHistory.length > 0 && (
        <div className="mt-2 bg-white border border-gray-300 rounded-lg shadow-lg p-3 max-h-64 overflow-y-auto">
          <h4 className="font-bold text-sm mb-2 text-gray-800">Recent Alerts</h4>
          <div className="space-y-2">
            {alertHistory.map((alert) => (
              <div key={alert.id} className="text-xs p-2 bg-red-50 border border-red-200 rounded">
                <div className="font-medium text-red-800">{alert.timestamp}</div>
                <div className="text-red-700">{alert.message}</div>
                <div className="text-red-600">
                  People: {alert.peopleCount} | Confidence: {alert.confidence?.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
