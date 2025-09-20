import React, { useState, useEffect } from 'react'

const CameraPermissionHandler = ({ onPermissionGranted, onPermissionDenied }) => {
  const [permissionState, setPermissionState] = useState('checking')
  const [errorMessage, setErrorMessage] = useState('')
  const [showInstructions, setShowInstructions] = useState(false)

  useEffect(() => {
    checkCameraPermission()
  }, [])

  const checkCameraPermission = async () => {
    try {
      // Check if navigator.mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setPermissionState('unsupported')
        setErrorMessage('Camera access is not supported in this browser. Please use Chrome, Firefox, or Safari.')
        return
      }

      // Check if we're on localhost or HTTPS
      const isSecureContext = window.isSecureContext || 
                             window.location.protocol === 'https:' || 
                             window.location.hostname === 'localhost' || 
                             window.location.hostname === '127.0.0.1'

      if (!isSecureContext) {
        setPermissionState('insecure')
        setErrorMessage('Camera access requires HTTPS or localhost. Please access the site via HTTPS or localhost.')
        return
      }

      // Check permission state if available
      if (navigator.permissions) {
        try {
          const permission = await navigator.permissions.query({ name: 'camera' })
          console.log('Camera permission state:', permission.state)
          
          if (permission.state === 'denied') {
            setPermissionState('denied')
            setErrorMessage('Camera access has been denied. Please reset permissions in your browser settings.')
            setShowInstructions(true)
            return
          }
        } catch (e) {
          console.log('Permission query not supported, proceeding with direct access')
        }
      }

      // Try to access camera
      await requestCameraAccess()

    } catch (error) {
      console.error('Camera permission check failed:', error)
      handleCameraError(error)
    }
  }

  const requestCameraAccess = async () => {
    try {
      setPermissionState('requesting')
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640, min: 320 },
          height: { ideal: 480, min: 240 },
          facingMode: 'user'
        },
        audio: false
      })

      // Success - stop the stream and notify parent
      stream.getTracks().forEach(track => track.stop())
      setPermissionState('granted')
      onPermissionGranted && onPermissionGranted()

    } catch (error) {
      handleCameraError(error)
    }
  }

  const handleCameraError = (error) => {
    console.error('Camera access error:', error)
    
    let message = ''
    let state = 'error'

    switch (error.name) {
      case 'NotAllowedError':
      case 'PermissionDeniedError':
        state = 'denied'
        message = 'Camera access was denied. Please allow camera access and try again.'
        setShowInstructions(true)
        break
      
      case 'NotFoundError':
      case 'DevicesNotFoundError':
        state = 'no-camera'
        message = 'No camera found. Please connect a camera and try again.'
        break
      
      case 'NotReadableError':
      case 'TrackStartError':
        state = 'busy'
        message = 'Camera is already in use by another application. Please close other apps using the camera.'
        break
      
      case 'OverconstrainedError':
      case 'ConstraintNotSatisfiedError':
        state = 'constraints'
        message = 'Camera does not meet requirements. Trying with relaxed settings...'
        // Try again with minimal constraints
        setTimeout(() => tryMinimalConstraints(), 1000)
        return
      
      case 'NotSupportedError':
        state = 'unsupported'
        message = 'Camera access is not supported in this browser.'
        break
      
      case 'SecurityError':
        state = 'security'
        message = 'Security error: Please ensure you are accessing the site via HTTPS or localhost.'
        break
      
      default:
        state = 'unknown'
        message = `Camera access failed: ${error.message || 'Unknown error'}`
    }

    setPermissionState(state)
    setErrorMessage(message)
    onPermissionDenied && onPermissionDenied(error)
  }

  const tryMinimalConstraints = async () => {
    try {
      setPermissionState('requesting')
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      })

      stream.getTracks().forEach(track => track.stop())
      setPermissionState('granted')
      onPermissionGranted && onPermissionGranted()

    } catch (error) {
      handleCameraError(error)
    }
  }

  const getBrowserInstructions = () => {
    const userAgent = navigator.userAgent.toLowerCase()
    
    if (userAgent.includes('chrome')) {
      return {
        browser: 'Chrome',
        steps: [
          'Click the camera icon in the address bar',
          'Select "Always allow" for camera access',
          'Refresh the page and try again'
        ]
      }
    } else if (userAgent.includes('firefox')) {
      return {
        browser: 'Firefox',
        steps: [
          'Click the shield icon in the address bar',
          'Click "Turn off Blocking for This Site"',
          'Refresh the page and try again'
        ]
      }
    } else if (userAgent.includes('safari')) {
      return {
        browser: 'Safari',
        steps: [
          'Go to Safari > Preferences > Websites',
          'Select Camera from the left sidebar',
          'Set this website to "Allow"'
        ]
      }
    } else {
      return {
        browser: 'Your Browser',
        steps: [
          'Look for a camera icon in the address bar',
          'Allow camera access for this site',
          'Refresh the page and try again'
        ]
      }
    }
  }

  const renderPermissionState = () => {
    const instructions = getBrowserInstructions()

    switch (permissionState) {
      case 'checking':
        return (
          <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
            <span className="text-blue-800">Checking camera permissions...</span>
          </div>
        )

      case 'requesting':
        return (
          <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="animate-pulse w-5 h-5 bg-yellow-500 rounded-full"></div>
            <span className="text-yellow-800">Requesting camera access... Please allow when prompted.</span>
          </div>
        )

      case 'granted':
        return (
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">✓</span>
            </div>
            <span className="text-green-800">Camera access granted! You can now start live streaming.</span>
          </div>
        )

      case 'denied':
      case 'error':
      case 'no-camera':
      case 'busy':
      case 'unsupported':
      case 'security':
      case 'insecure':
      default:
        return (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">!</span>
              </div>
              <span className="text-red-800 font-medium">Camera Access Issue</span>
            </div>
            
            <p className="text-red-700 mb-3">{errorMessage}</p>
            
            {showInstructions && (
              <div className="bg-white p-3 rounded border border-red-200">
                <h4 className="font-medium text-red-800 mb-2">
                  How to fix this in {instructions.browser}:
                </h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-red-700">
                  {instructions.steps.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
              </div>
            )}
            
            <div className="flex gap-2 mt-3">
              <button
                onClick={checkCameraPermission}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
              
              {permissionState === 'constraints' && (
                <button
                  onClick={tryMinimalConstraints}
                  className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
                >
                  Try Basic Settings
                </button>
              )}
            </div>
          </div>
        )
    }
  }

  return (
    <div className="camera-permission-handler">
      {renderPermissionState()}
    </div>
  )
}

export default CameraPermissionHandler
