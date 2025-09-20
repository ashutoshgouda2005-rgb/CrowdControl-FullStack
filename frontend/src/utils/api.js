// API configuration and functions for CrowdControl
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'
const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://127.0.0.1:8000'

// Helper function to get WebSocket base URL
export const getWsBase = () => WS_BASE_URL

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('access')
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  }
}

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }))
    throw { response: { data: error, status: response.status } }
  }
  return response.json()
}

// Authentication API
export const authApi = {
  // User registration
  register: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/register/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData)
    })
    return handleResponse(response)
  },

  // User login
  login: async (username, password) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/login/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ username, password })
    })
    const data = await handleResponse(response)
    
    // Store tokens in localStorage
    if (data.access) {
      localStorage.setItem('access', data.access)
      localStorage.setItem('refresh', data.refresh)
      localStorage.setItem('user', JSON.stringify(data.user))
    }
    
    return data
  },

  // Get user profile
  profile: async () => {
    const response = await fetch(`${API_BASE_URL}/api/auth/profile/`, {
      method: 'GET',
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  // Logout
  logout: () => {
    localStorage.removeItem('access')
    localStorage.removeItem('refresh')
    localStorage.removeItem('user')
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('access')
  },

  // Get current user from localStorage
  getCurrentUser: () => {
    const user = localStorage.getItem('user')
    return user ? JSON.parse(user) : null
  }
}

// Media API
export const mediaApi = {
  // Upload media file
  upload: async (file, onProgress) => {
    const formData = new FormData()
    formData.append('file', file)
    
    const token = localStorage.getItem('access')
    const response = await fetch(`${API_BASE_URL}/api/media/upload/`, {
      method: 'POST',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: formData
    })
    return handleResponse(response)
  },

  // Get media uploads list
  list: async () => {
    const response = await fetch(`${API_BASE_URL}/api/media/list/`, {
      method: 'GET',
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  // Get specific media upload
  get: async (uploadId) => {
    const response = await fetch(`${API_BASE_URL}/api/media/${uploadId}/`, {
      method: 'GET',
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  }
}

// Analysis API
export const analysisApi = {
  // Analyze frame
  analyzeFrame: async (frameData) => {
    const response = await fetch(`${API_BASE_URL}/api/analysis/frame/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ frame_data: frameData })
    })
    return handleResponse(response)
  },

  // Get analysis results
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
