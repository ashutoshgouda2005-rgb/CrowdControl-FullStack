import React, { useState, useEffect } from 'react'
import { getApiBase } from '../utils/api'

export default function DeviceInfo() {
  const [deviceInfo, setDeviceInfo] = useState({
    hostname: '',
    apiUrl: '',
    userAgent: '',
    screenSize: '',
    connectionStatus: 'checking'
  })

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const apiUrl = getApiBase()
        const response = await fetch(`${apiUrl}/api/health/`)
        
        setDeviceInfo({
          hostname: window.location.hostname,
          apiUrl: apiUrl,
          userAgent: navigator.userAgent,
          screenSize: `${window.screen.width}x${window.screen.height}`,
          connectionStatus: response.ok ? 'connected' : 'error'
        })
      } catch (error) {
        setDeviceInfo(prev => ({
          ...prev,
          hostname: window.location.hostname,
          apiUrl: getApiBase(),
          userAgent: navigator.userAgent,
          screenSize: `${window.screen.width}x${window.screen.height}`,
          connectionStatus: 'error'
        }))
      }
    }

    checkConnection()
    
    // Check connection every 30 seconds
    const interval = setInterval(checkConnection, 30000)
    return () => clearInterval(interval)
  }, [])

  const getDeviceType = () => {
    const ua = navigator.userAgent
    if (/tablet|ipad|playbook|silk/i.test(ua)) return '📱 Tablet'
    if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(ua)) return '📱 Mobile'
    return '💻 Desktop'
  }

  const getConnectionIcon = () => {
    switch (deviceInfo.connectionStatus) {
      case 'connected': return '🟢'
      case 'error': return '🔴'
      default: return '🟡'
    }
  }

  const getConnectionText = () => {
    switch (deviceInfo.connectionStatus) {
      case 'connected': return 'Connected'
      case 'error': return 'Connection Error'
      default: return 'Checking...'
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="glass rounded-xl p-3 text-xs max-w-xs">
        <div className="flex items-center gap-2 mb-2">
          <span>{getDeviceType()}</span>
          <span className="flex items-center gap-1">
            {getConnectionIcon()}
            <span className={`font-medium ${
              deviceInfo.connectionStatus === 'connected' ? 'text-green-600' : 
              deviceInfo.connectionStatus === 'error' ? 'text-red-600' : 'text-yellow-600'
            }`}>
              {getConnectionText()}
            </span>
          </span>
        </div>
        
        <div className="space-y-1 text-gray-600">
          <div>
            <strong>Host:</strong> {deviceInfo.hostname || 'localhost'}
          </div>
          <div>
            <strong>API:</strong> {deviceInfo.apiUrl}
          </div>
          <div>
            <strong>Screen:</strong> {deviceInfo.screenSize}
          </div>
        </div>
        
        {deviceInfo.connectionStatus === 'error' && (
          <div className="mt-2 p-2 bg-red-50 rounded text-red-700 text-xs">
            ⚠️ Backend connection failed. Make sure the server is running.
          </div>
        )}
      </div>
    </div>
  )
}
