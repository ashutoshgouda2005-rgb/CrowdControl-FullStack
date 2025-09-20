import React, { useState, useEffect } from 'react'

// Minimal Authentication Hook
function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('access')
    if (token) {
      setUser({ token })
    }
    setLoading(false)
  }, [])

  const login = async (username, password) => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/auth/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      
      if (response.ok) {
        const data = await response.json()
        localStorage.setItem('access', data.access)
        setUser({ token: data.access })
        return { success: true }
      } else {
        return { success: false, error: 'Invalid credentials' }
      }
    } catch (error) {
      return { success: false, error: 'Connection failed' }
    }
  }

  const logout = () => {
    localStorage.removeItem('access')
    setUser(null)
  }

  return { user, login, logout, loading }
}

// Simple Login Component
function Login({ onLogin }) {
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('admin123')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    const result = await onLogin(username, password)
    if (!result.success) {
      setError(result.error)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6 text-center">CrowdControl Login</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  )
}

// Simple Photo Upload Component
function PhotoUpload() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file)
      setResult(null)
      setError('')
    } else {
      setError('Please select a valid image file')
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setUploading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('media_type', 'image')
      formData.append('description', 'Photo upload for analysis')

      const token = localStorage.getItem('access')
      const response = await fetch('http://127.0.0.1:8000/api/media/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (response.ok) {
        const uploadData = await response.json()
        
        // Poll for analysis results
        let attempts = 0
        const maxAttempts = 30
        
        while (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          const resultResponse = await fetch(`http://127.0.0.1:8000/api/media/${uploadData.id}/`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          
          if (resultResponse.ok) {
            const data = await resultResponse.json()
            if (data.analysis_status === 'completed') {
              setResult(data)
              break
            }
          }
          attempts++
        }
        
        if (attempts >= maxAttempts) {
          setError('Analysis timed out. Please try again.')
        }
      } else {
        setError('Upload failed. Please try again.')
      }
    } catch (error) {
      setError('Connection failed. Please check your connection.')
    }

    setUploading(false)
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Photo Analysis</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2">
          Select Photo
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
        />
      </div>

      {selectedFile && (
        <div className="mb-4">
          <img
            src={URL.createObjectURL(selectedFile)}
            alt="Selected"
            className="max-w-full h-64 object-contain rounded-lg"
          />
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!selectedFile || uploading}
        className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50"
      >
        {uploading ? 'Analyzing...' : 'Upload & Analyze'}
      </button>

      {result && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-bold mb-2">Analysis Results</h3>
          <div className="space-y-2">
            <p><strong>People Count:</strong> {result.people_count || 0}</p>
            <p><strong>Confidence:</strong> {Math.round((result.confidence_score || 0) * 100)}%</p>
            <p><strong>Status:</strong> 
              <span className={`ml-2 px-2 py-1 rounded text-sm ${
                result.is_stampede_risk 
                  ? 'bg-red-100 text-red-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {result.is_stampede_risk ? 'High Risk' : 'Safe'}
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// Simple Live Detection Component
function LiveDetection() {
  const [isActive, setIsActive] = useState(false)
  const [stream, setStream] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [error, setError] = useState('')
  const [streamId, setStreamId] = useState(null)

  const startDetection = async () => {
    try {
      setError('')
      
      // Get camera access
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      })
      
      setStream(mediaStream)
      
      // Create stream in backend
      const token = localStorage.getItem('access')
      const response = await fetch('http://127.0.0.1:8000/api/streams/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          stream_name: 'Live Detection',
          description: 'Real-time crowd detection'
        })
      })
      
      if (response.ok) {
        const streamData = await response.json()
        setStreamId(streamData.id)
        setIsActive(true)
        
        // Start analysis loop
        startAnalysisLoop(streamData.id, mediaStream)
      } else {
        setError('Failed to start stream')
      }
    } catch (error) {
      if (error.name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow camera access.')
      } else {
        setError('Failed to access camera. Please check your camera.')
      }
    }
  }

  const stopDetection = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    setIsActive(false)
    setAnalysis(null)
    setStreamId(null)
  }

  const startAnalysisLoop = (streamId, mediaStream) => {
    const video = document.createElement('video')
    video.srcObject = mediaStream
    video.play()
    
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    const analyzeFrame = async () => {
      if (!isActive) return
      
      canvas.width = video.videoWidth || 640
      canvas.height = video.videoHeight || 480
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      try {
        const frameData = canvas.toDataURL('image/jpeg', 0.8).split(',')[1]
        const token = localStorage.getItem('access')
        
        const response = await fetch('http://127.0.0.1:8000/api/streams/analyze-frame/', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            stream_id: streamId,
            frame_data: frameData
          })
        })
        
        if (response.ok) {
          const data = await response.json()
          setAnalysis(data.analysis)
        }
      } catch (error) {
        console.error('Analysis failed:', error)
      }
      
      setTimeout(analyzeFrame, 2000) // Analyze every 2 seconds
    }
    
    video.onloadedmetadata = () => {
      setTimeout(analyzeFrame, 1000)
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Live Detection</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="mb-4">
        {!isActive ? (
          <button
            onClick={startDetection}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg"
          >
            Start Live Detection
          </button>
        ) : (
          <button
            onClick={stopDetection}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg"
          >
            Stop Detection
          </button>
        )}
      </div>

      {isActive && stream && (
        <div className="mb-4">
          <video
            ref={(video) => {
              if (video && stream) {
                video.srcObject = stream
              }
            }}
            autoPlay
            playsInline
            muted
            className="w-full max-w-md rounded-lg"
          />
        </div>
      )}

      {analysis && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-bold mb-2">Live Analysis</h3>
          <div className="space-y-2">
            <p><strong>People Count:</strong> {analysis.people_count || 0}</p>
            <p><strong>Confidence:</strong> {Math.round((analysis.confidence_score || 0) * 100)}%</p>
            <p><strong>Status:</strong> 
              <span className={`ml-2 px-2 py-1 rounded text-sm ${
                analysis.is_stampede_risk 
                  ? 'bg-red-100 text-red-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {analysis.is_stampede_risk ? 'High Risk' : 'Safe'}
              </span>
            </p>
            {analysis.people_count > 1 && (
              <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-3 py-2 rounded">
                ⚠️ Multiple people detected!
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Main App Component
export default function App() {
  const { user, login, logout, loading } = useAuth()
  const [currentView, setCurrentView] = useState('upload')

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return <Login onLogin={login} />
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Simple Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">CrowdControl</h1>
          
          {/* Simple Navigation */}
          <nav className="flex space-x-4">
            <button
              onClick={() => setCurrentView('upload')}
              className={`px-4 py-2 rounded-lg ${
                currentView === 'upload' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Photo Upload
            </button>
            <button
              onClick={() => setCurrentView('live')}
              className={`px-4 py-2 rounded-lg ${
                currentView === 'live' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Live Detection
            </button>
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              Logout
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {currentView === 'upload' && <PhotoUpload />}
        {currentView === 'live' && <LiveDetection />}
      </main>
    </div>
  )
}
