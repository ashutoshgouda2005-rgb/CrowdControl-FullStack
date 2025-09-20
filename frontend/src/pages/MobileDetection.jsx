import React, { useState, useEffect, useRef } from 'react'
import { streamsApi, analysisApi } from '../utils/api'

export default function MobileDetection() {
  const [isDetecting, setIsDetecting] = useState(false)
  const [currentAlert, setCurrentAlert] = useState(null)
  const [batteryOptimized, setBatteryOptimized] = useState(true)
  const [emergencyContacts, setEmergencyContacts] = useState([])
  const [locationEnabled, setLocationEnabled] = useState(false)
  const [currentLocation, setCurrentLocation] = useState(null)
  
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const intervalRef = useRef(null)
  const alertAudioRef = useRef(null)

  useEffect(() => {
    // Load emergency contacts from localStorage
    const savedContacts = localStorage.getItem('emergencyContacts')
    if (savedContacts) {
      setEmergencyContacts(JSON.parse(savedContacts))
    }

    // Check if geolocation is available
    if (navigator.geolocation) {
      setLocationEnabled(true)
      getCurrentLocation()
    }

    return () => {
      stopDetection()
    }
  }, [])

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          })
        },
        (error) => {
          console.error('Location access denied:', error)
        }
      )
    }
  }

  const startDetection = async () => {
    try {
      // Request camera access with mobile-optimized settings
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 },
          facingMode: 'environment', // Use back camera for crowd detection
          frameRate: { ideal: 15, max: 30 } // Optimize for battery
        },
        audio: false
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        
        await new Promise((resolve) => {
          videoRef.current.onloadedmetadata = resolve
        })
        
        setIsDetecting(true)
        
        // Start detection with battery optimization
        const interval = batteryOptimized ? 3000 : 1000 // 3s or 1s intervals
        intervalRef.current = setInterval(analyzeFrame, interval)
      }
    } catch (error) {
      console.error('Camera access failed:', error)
      alert('Camera access is required for crowd detection. Please allow camera access and try again.')
    }
  }

  const stopDetection = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    
    setIsDetecting(false)
    setCurrentAlert(null)
  }

  const analyzeFrame = async () => {
    if (!videoRef.current || !canvasRef.current) return

    try {
      const video = videoRef.current
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')

      // Set canvas size to match video
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      // Draw current frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Convert to base64 for analysis
      const frameData = canvas.toDataURL('image/jpeg', 0.7).split(',')[1]

      // Send for analysis using mobile-optimized endpoint
      const response = await analysisApi.analyzeFrame({
        frame_data: frameData,
        mobile_mode: true,
        battery_optimized: batteryOptimized,
        location: currentLocation
      })

      if (response.analysis) {
        processAnalysisResult(response.analysis)
      }
    } catch (error) {
      console.error('Frame analysis failed:', error)
    }
  }

  const processAnalysisResult = (analysis) => {
    // Check for stampede risk
    if (analysis.is_stampede_risk) {
      triggerStampedeAlert(analysis)
    } else if (analysis.crowd_detected) {
      setCurrentAlert({
        level: 'warning',
        message: `Crowd detected - ${analysis.people_count} people`,
        timestamp: new Date().toLocaleTimeString()
      })
    } else {
      setCurrentAlert(null)
    }
  }

  const triggerStampedeAlert = (analysis) => {
    const alert = {
      level: 'critical',
      message: 'STAMPEDE RISK DETECTED - Take immediate action!',
      peopleCount: analysis.people_count,
      confidence: analysis.confidence_score,
      timestamp: new Date().toLocaleTimeString(),
      location: currentLocation
    }

    setCurrentAlert(alert)

    // Play alert sound
    if (alertAudioRef.current) {
      alertAudioRef.current.play().catch(e => console.log('Audio play failed:', e))
    }

    // Vibrate if supported
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200, 100, 200])
    }

    // Show browser notification
    if (Notification.permission === 'granted') {
      new Notification('Stampede Risk Detected!', {
        body: `${analysis.people_count} people detected. Take immediate action!`,
        icon: '/favicon.ico',
        tag: 'stampede-alert'
      })
    }
  }

  const callEmergencyService = (serviceType) => {
    const phoneNumbers = {
      ambulance: '108', // India emergency number
      police: '100',
      fire: '101',
      disaster: '108'
    }

    const number = phoneNumbers[serviceType]
    if (number) {
      window.location.href = `tel:${number}`
    }
  }

  const callEmergencyContact = (contact) => {
    window.location.href = `tel:${contact.phone}`
  }

  const shareLocation = async () => {
    if (currentLocation && navigator.share) {
      try {
        await navigator.share({
          title: 'Emergency Location Share',
          text: `I need help! Stampede risk detected at my location.`,
          url: `https://maps.google.com/?q=${currentLocation.latitude},${currentLocation.longitude}`
        })
      } catch (error) {
        // Fallback to copying location
        const locationText = `Emergency! Stampede risk at: https://maps.google.com/?q=${currentLocation.latitude},${currentLocation.longitude}`
        navigator.clipboard.writeText(locationText)
        alert('Location copied to clipboard')
      }
    }
  }

  const requestNotificationPermission = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }

  useEffect(() => {
    requestNotificationPermission()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 py-3">
          <h1 className="text-xl font-bold text-gray-900">Mobile Crowd Detection</h1>
          <p className="text-sm text-gray-600">Personal safety monitoring</p>
        </div>
      </div>

      {/* Camera View */}
      <div className="relative">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-64 bg-black object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Detection Status Overlay */}
        {isDetecting && (
          <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white px-3 py-1 rounded-full text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span>Detecting</span>
            </div>
          </div>
        )}

        {/* Alert Overlay */}
        {currentAlert && (
          <div className={`absolute top-4 right-4 px-4 py-2 rounded-lg text-white font-bold ${
            currentAlert.level === 'critical' 
              ? 'bg-red-600 animate-pulse' 
              : 'bg-yellow-500'
          }`}>
            {currentAlert.message}
          </div>
        )}
      </div>

      {/* Control Panel */}
      <div className="p-4 space-y-4">
        {/* Detection Controls */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h3 className="font-medium mb-3">Detection Controls</h3>
          
          {!isDetecting ? (
            <button
              onClick={startDetection}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Start Crowd Detection
            </button>
          ) : (
            <button
              onClick={stopDetection}
              className="w-full bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              Stop Detection
            </button>
          )}

          {/* Battery Optimization Toggle */}
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm text-gray-600">Battery Optimization</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={batteryOptimized}
                onChange={(e) => setBatteryOptimized(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        {/* Emergency Actions */}
        {currentAlert && currentAlert.level === 'critical' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-bold text-red-800 mb-3">Emergency Actions</h3>
            
            {/* Emergency Services */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                onClick={() => callEmergencyService('ambulance')}
                className="bg-red-600 text-white py-2 px-3 rounded text-sm font-medium hover:bg-red-700"
              >
                Call Ambulance (108)
              </button>
              <button
                onClick={() => callEmergencyService('police')}
                className="bg-blue-600 text-white py-2 px-3 rounded text-sm font-medium hover:bg-blue-700"
              >
                Call Police (100)
              </button>
            </div>

            {/* Location Sharing */}
            {currentLocation && (
              <button
                onClick={shareLocation}
                className="w-full bg-orange-600 text-white py-2 rounded text-sm font-medium hover:bg-orange-700 mb-3"
              >
                Share My Location
              </button>
            )}

            {/* Emergency Contacts */}
            {emergencyContacts.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Emergency Contacts:</p>
                <div className="space-y-1">
                  {emergencyContacts.slice(0, 3).map((contact, index) => (
                    <button
                      key={index}
                      onClick={() => callEmergencyContact(contact)}
                      className="w-full bg-gray-600 text-white py-1 px-2 rounded text-sm hover:bg-gray-700"
                    >
                      Call {contact.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Current Status */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h3 className="font-medium mb-2">Current Status</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Detection:</span>
              <span className={isDetecting ? 'text-green-600' : 'text-gray-400'}>
                {isDetecting ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Location:</span>
              <span className={currentLocation ? 'text-green-600' : 'text-gray-400'}>
                {currentLocation ? 'Available' : 'Not available'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Battery Mode:</span>
              <span className="text-gray-900">
                {batteryOptimized ? 'Optimized' : 'Performance'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Settings */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h3 className="font-medium mb-3">Quick Settings</h3>
          <div className="space-y-3">
            <button
              onClick={() => window.location.href = '/settings/emergency-contacts'}
              className="w-full text-left py-2 px-3 bg-gray-50 rounded text-sm hover:bg-gray-100"
            >
              Manage Emergency Contacts
            </button>
            <button
              onClick={getCurrentLocation}
              className="w-full text-left py-2 px-3 bg-gray-50 rounded text-sm hover:bg-gray-100"
            >
              Update Location
            </button>
            <button
              onClick={requestNotificationPermission}
              className="w-full text-left py-2 px-3 bg-gray-50 rounded text-sm hover:bg-gray-100"
            >
              Enable Notifications
            </button>
          </div>
        </div>
      </div>

      {/* Alert Audio */}
      <audio ref={alertAudioRef} preload="auto">
        <source src="/alert-sound.mp3" type="audio/mpeg" />
        <source src="/alert-sound.wav" type="audio/wav" />
      </audio>
    </div>
  )
}
