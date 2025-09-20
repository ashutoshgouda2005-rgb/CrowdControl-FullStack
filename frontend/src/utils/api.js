// API setup for CrowdControl
// Automatically figures out the right server URL depending on where you're accessing from
const getApiBaseUrl = () => {
  // Use custom URL if set in environment
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }
  
  // Otherwise, figure it out from where we're running
  const protocol = window.location.protocol
  const hostname = window.location.hostname
  
  // If running locally, use localhost
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `${protocol}//127.0.0.1:8000`
  }
  
  // If accessing from phone/tablet, use the same IP
  return `${protocol}//${hostname}:8000`
}

const getWsBaseUrl = () => {
  // Use custom WebSocket URL if set
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL
  }
  
  // Build WebSocket URL automatically
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const hostname = window.location.hostname
  
  // Local development
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `${protocol}//127.0.0.1:8000`
  }
  
  // Mobile or remote access
  return `${protocol}//${hostname}:8000`
}

const API_BASE_URL = getApiBaseUrl()
const WS_BASE_URL = getWsBaseUrl()

// Get WebSocket URL for real-time features
export const getWsBase = () => WS_BASE_URL

// Get API URL (mainly for debugging)
export const getApiBase = () => API_BASE_URL

// Add auth token to requests if user is logged in
const getAuthHeaders = () => {
  const token = localStorage.getItem('access')
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  }
}

// Handle API responses and errors nicely
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }))
    throw { response: { data: error, status: response.status } }
  }
  return response.json()
}

// User authentication functions
export const authApi = {
  // Sign up new users
  register: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/register/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData)
    })
    return handleResponse(response)
  },

  // Log in existing users
  login: async (username, password) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/login/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ username, password })
    })
    const data = await handleResponse(response)
    
    // Save login tokens for future requests
    if (data.access) {
      localStorage.setItem('access', data.access)
      localStorage.setItem('refresh', data.refresh)
      localStorage.setItem('user', JSON.stringify(data.user))
    }
    
    return data
  },

  // Get current user info
  profile: async () => {
    const response = await fetch(`${API_BASE_URL}/api/auth/profile/`, {
      method: 'GET',
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  // Log out and clear saved data
  logout: () => {
    localStorage.removeItem('access')
    localStorage.removeItem('refresh')
    localStorage.removeItem('user')
  },

  // Check if someone is logged in
  isAuthenticated: () => {
    return !!localStorage.getItem('access')
  },

  // Get saved user info
  getCurrentUser: () => {
    const user = localStorage.getItem('user')
    return user ? JSON.parse(user) : null
  }
}

// File upload and management
export const mediaApi = {
  // Upload photos/videos for AI analysis
  upload: async (uploadData, onProgress) => {
    const formData = new FormData()
    
    // Handle both file object and upload data object
    if (uploadData instanceof File) {
      formData.append('file', uploadData)
    } else {
      formData.append('file', uploadData.file)
      if (uploadData.description) formData.append('description', uploadData.description)
      if (uploadData.location) formData.append('location', uploadData.location)
      if (uploadData.media_type) formData.append('media_type', uploadData.media_type)
    }
    
    const token = localStorage.getItem('access')
    const response = await fetch(`${API_BASE_URL}/api/media/upload/`, {
      method: 'POST',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` })
        // Don't set Content-Type for FormData - browser will set it with boundary
      },
      body: formData
    })
    return handleResponse(response)
  },

  // Get all uploaded files
  list: async () => {
    const response = await fetch(`${API_BASE_URL}/api/media/list/`, {
      method: 'GET',
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  // Get details for one specific upload
  get: async (uploadId) => {
    const response = await fetch(`${API_BASE_URL}/api/media/${uploadId}/`, {
      method: 'GET',
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  }
}

// AI crowd analysis functions
export const analysisApi = {
  // Send a video frame to AI for analysis
  analyzeFrame: async (frameData) => {
    const response = await fetch(`${API_BASE_URL}/api/analysis/frame/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ frame_data: frameData })
    })
    return handleResponse(response)
  },

  // Get past analysis results
  getResults: async () => {
    const response = await fetch(`${API_BASE_URL}/api/analysis/results/`, {
      method: 'GET',
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  }
}

// Streams API
export const streamsApi = {
  // Create live stream
  create: async (streamData) => {
    const response = await fetch(`${API_BASE_URL}/api/streams/create/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(streamData)
    })
    return handleResponse(response)
  },

  // List live streams
  list: async () => {
    const response = await fetch(`${API_BASE_URL}/api/streams/list/`, {
      method: 'GET',
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  // Start stream
  start: async (streamId) => {
    const response = await fetch(`${API_BASE_URL}/api/streams/${streamId}/start/`, {
      method: 'POST',
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  // Stop stream
  stop: async (streamId) => {
    const response = await fetch(`${API_BASE_URL}/api/streams/${streamId}/stop/`, {
      method: 'POST',
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  // Analyze frame
  analyzeFrame: async (frameData) => {
    const response = await fetch(`${API_BASE_URL}/api/analysis/frame/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(frameData)
    })
    return handleResponse(response)
  },

  // Get alerts (for streams)
  alerts: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    const url = `${API_BASE_URL}/api/alerts/${queryString ? '?' + queryString : ''}`
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  }
}

// Alerts API
export const alertsApi = {
  // Get alerts
  list: async () => {
    const response = await fetch(`${API_BASE_URL}/api/alerts/`, {
      method: 'GET',
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  // Acknowledge alert
  acknowledge: async (alertId) => {
    const response = await fetch(`${API_BASE_URL}/api/alerts/${alertId}/acknowledge/`, {
      method: 'POST',
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  }
}

// Health check
export const healthApi = {
  check: async () => {
    const response = await fetch(`${API_BASE_URL}/api/health/`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })
    return handleResponse(response)
  }
}
