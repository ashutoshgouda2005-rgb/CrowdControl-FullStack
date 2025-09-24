import axios from 'axios';
import toast from 'react-hot-toast';

// API Configuration with fallback detection
const getApiBaseUrl = () => {
  // Check environment variable first
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Development fallback - try to detect backend
  if (import.meta.env.DEV) {
    return 'http://127.0.0.1:8000/api';
  }
  
  // Production fallback - use same host with port 8000
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  return `${protocol}//${hostname}:8000/api`;
};

const API_BASE_URL = getApiBaseUrl();

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management utilities
export const tokenManager = {
  getAccessToken: () => localStorage.getItem('access_token') || localStorage.getItem('access'),
  getRefreshToken: () => localStorage.getItem('refresh_token') || localStorage.getItem('refresh'),
  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem('access_token', accessToken);
    if (refreshToken) localStorage.setItem('refresh_token', refreshToken);
    // Backward compatibility with utils/api.js consumers
    localStorage.setItem('access', accessToken);
    if (refreshToken) localStorage.setItem('refresh', refreshToken);
  },
  clearTokens: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
  },
  isAuthenticated: () => !!localStorage.getItem('access_token'),
};

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = tokenManager.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for comprehensive error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Log all errors for debugging
    console.group('🔴 API Error Details');
    console.log('URL:', originalRequest?.url);
    console.log('Method:', originalRequest?.method?.toUpperCase());
    console.log('Status:', error.response?.status);
    console.log('Error Code:', error.code);
    console.log('Response Data:', error.response?.data);
    console.log('Full Error:', error);
    console.groupEnd();

    // Handle network/connection errors
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        toast.error('Request timeout. Please check your connection and try again.');
      } else if (error.code === 'ERR_NETWORK') {
        toast.error('Cannot connect to server. Please check if the backend is running on port 8000.');
      } else {
        toast.error('Network error. Please check your internet connection.');
      }
      return Promise.reject(error);
    }

    // Handle 401 errors (token expired) - attempt token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = tokenManager.getRefreshToken();
      if (refreshToken) {
        try {
          // Attempt to refresh token
          const response = await api.post('/auth/token/refresh/', {
            refresh: refreshToken
          });
          
          const { access } = response.data;
          tokenManager.setTokens(access, refreshToken);
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed, logout user
          tokenManager.clearTokens();
          toast.error('Session expired. Please log in again.');
          window.location.href = '/login';
        }
      } else {
        // No refresh token, logout user
        tokenManager.clearTokens();
        toast.error('Session expired. Please log in again.');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    // Handle specific HTTP status codes
    switch (error.response?.status) {
      case 400:
        // Don't show generic toast for 400 errors, let components handle them
        console.log('Bad request - component should handle this:', error.response?.data);
        break;
      case 403:
        toast.error('Access denied. You don\'t have permission for this action.');
        break;
      case 404:
        toast.error('Resource not found. Please check the URL or try again.');
        break;
      case 413:
        toast.error('File too large. Please select a smaller file.');
        break;
      case 415:
        toast.error('Unsupported file type. Please select a valid image or video file.');
        break;
      case 429:
        toast.error('Too many requests. Please wait a moment and try again.');
        break;
      case 500:
        toast.error('Server error. Please try again later or contact support.');
        break;
      case 502:
        toast.error('Bad gateway. The server is temporarily unavailable.');
        break;
      case 503:
        toast.error('Service unavailable. Please try again later.');
        break;
      default:
        if (error.response?.status >= 500) {
          toast.error(`Server error (${error.response.status}). Please try again later.`);
        }
    }

    return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {
  login: async (credentials) => {
    const response = await api.post('/auth/login/', credentials);
    const { access, refresh, user } = response.data;
    tokenManager.setTokens(access, refresh);
    return { user, access, refresh };
  },

  register: async (userData) => {
    const response = await api.post('/auth/register/', userData);
    return response.data;
  },

  logout: () => {
    tokenManager.clearTokens();
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile/');
    return response.data;
  },

  updateProfile: async (profileData) => {
    const response = await api.patch('/auth/profile/', profileData);
    return response.data;
  },
};

// Media Upload API with Enhanced Error Handling
export const mediaAPI = {
  uploadFile: async (file, onProgress, options = {}) => {
    try {
      console.log('🔄 Starting file upload:', {
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(2)}MB`,
        type: file.type
      });

      const formData = new FormData();
      formData.append('file', file);
      
      // Determine media type from file type
      const mediaType = file.type.startsWith('video/') ? 'video' : 'image';
      formData.append('media_type', mediaType);
      
      // Optional fields with defaults
      formData.append('description', options.description || `Uploaded ${mediaType} for crowd analysis`);
      formData.append('location', options.location || 'Web Upload');

      const response = await api.post('/media/upload/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percentCompleted);
          }
        },
        timeout: 120000, // 2 minute timeout for large files
      });

      console.log('✅ Upload successful:', response.data);
      return response.data;

    } catch (error) {
      console.error('❌ Upload failed:', error);
      
      // Enhanced error handling with specific messages
      if (error.response?.data) {
        const errorData = error.response.data;
        throw new Error(errorData.detail || errorData.error || 'Upload failed');
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('Upload timeout - file may be too large or connection is slow');
      } else if (error.code === 'ERR_NETWORK') {
        throw new Error('Network error - please check your connection and try again');
      } else {
        throw new Error(error.message || 'Upload failed');
      }
    }
  },

  // Enhanced method to get upload details with analysis results
  getUploadWithAnalysis: async (uploadId) => {
    try {
      const response = await api.get(`/media/${uploadId}/`);
      const uploadData = response.data;
      
      console.log('📊 Upload details retrieved:', uploadData);
      
      // Check for analysis errors and provide user-friendly messages
      if (uploadData.analysis_error) {
        console.warn('⚠️ Analysis error detected:', uploadData.analysis_error);
        return {
          ...uploadData,
          hasAnalysisError: true,
          analysisErrorMessage: uploadData.analysis_error.detail,
          analysisRecommendations: uploadData.analysis_error.recommendations
        };
      }
      
      // Check for successful analysis
      if (uploadData.analysis_success) {
        console.log('✅ Analysis successful:', uploadData.analysis_success);
        return {
          ...uploadData,
          hasAnalysisSuccess: true,
          analysisResults: uploadData.analysis_success
        };
      }
      
      return uploadData;
      
    } catch (error) {
      console.error('❌ Failed to get upload details:', error);
      throw error;
    }
  },

  // Poll for analysis completion with timeout
  waitForAnalysis: async (uploadId, maxWaitTime = 30000, pollInterval = 2000) => {
    const startTime = Date.now();
    
    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const uploadData = await mediaAPI.getUploadWithAnalysis(uploadId);
          
          // Check if analysis is complete (either success or error)
          if (uploadData.analysis_status === 'completed' || uploadData.analysis_status === 'failed') {
            resolve(uploadData);
            return;
          }
          
          // Check timeout
          if (Date.now() - startTime > maxWaitTime) {
            resolve({
              ...uploadData,
              analysisTimeout: true,
              analysisErrorMessage: 'Analysis is taking longer than expected. Please check back later.'
            });
            return;
          }
          
          // Continue polling
          setTimeout(poll, pollInterval);
          
        } catch (error) {
          reject(error);
        }
      };
      
      poll();
    });
  },

  // Complete upload and analysis workflow
  uploadAndAnalyze: async (file, onProgress, onAnalysisUpdate) => {
    try {
      // Step 1: Upload file
      if (onAnalysisUpdate) onAnalysisUpdate('Uploading file...');
      const uploadResult = await mediaAPI.uploadFile(file, onProgress);
      
      // Step 2: Wait for analysis
      if (onAnalysisUpdate) onAnalysisUpdate('Analyzing image...');
      const analysisResult = await mediaAPI.waitForAnalysis(uploadResult.id);
      
      // Step 3: Return complete results
      if (analysisResult.hasAnalysisError) {
        if (onAnalysisUpdate) onAnalysisUpdate('Analysis failed');
        throw new Error(analysisResult.analysisErrorMessage);
      } else if (analysisResult.hasAnalysisSuccess) {
        if (onAnalysisUpdate) onAnalysisUpdate('Analysis complete!');
        return analysisResult;
      } else {
        if (onAnalysisUpdate) onAnalysisUpdate('Analysis timeout');
        return analysisResult;
      }
      
    } catch (error) {
      console.error('❌ Upload and analysis failed:', error);
      throw error;
    }
  },

  // Legacy method for backward compatibility
  uploadImage: async (file, onProgress) => {
    return mediaAPI.uploadFile(file, onProgress);
  },

  getUploads: async (page = 1, limit = 20) => {
    const response = await api.get('/media/list/', {
      params: { page, page_size: limit }
    });
    return response.data;
  },

  getUpload: async (uploadId) => {
    const response = await api.get(`/media/${uploadId}/`);
    return response.data;
  },

  deleteUpload: async (uploadId) => {
    const response = await api.delete(`/media/${uploadId}/`);
    return response.data;
  },
};

// Live Stream API
export const streamAPI = {
  createStream: async (streamData) => {
    const response = await api.post('/streams/create/', streamData);
    return response.data;
  },

  getStreams: async () => {
    const response = await api.get('/streams/list/');
    return response.data;
  },

  getStream: async (streamId) => {
    const response = await api.get(`/streams/${streamId}/`);
    return response.data;
  },

  startStream: async (streamId) => {
    const response = await api.post(`/streams/${streamId}/start/`);
    return response.data;
  },

  stopStream: async (streamId) => {
    const response = await api.post(`/streams/${streamId}/stop/`);
    return response.data;
  },

  updateStream: async (streamId, updateData) => {
    // Backend expects PUT for updates on manage_live_stream
    const response = await api.put(`/streams/${streamId}/`, updateData);
    return response.data;
  },
};

// Analysis API
export const analysisAPI = {
  analyzeFrame: async (frameData) => {
    // Support both JSON (preferred) and FormData (legacy callers)
    const isFormData = typeof FormData !== 'undefined' && frameData instanceof FormData;
    const response = await api.post('/analysis/frame/', frameData, {
      headers: isFormData
        ? { 'Content-Type': 'multipart/form-data' }
        : { 'Content-Type': 'application/json' },
    });
    return response.data;
  },

  getResults: async (page = 1, limit = 20, filters = {}) => {
    const response = await api.get('/analysis/results/', {
      params: { page, page_size: limit, ...filters },
    });
    return response.data;
  },

  getAnalytics: async (timeRange = '24h') => {
    const response = await api.get('/analysis/analytics/', {
      params: { time_range: timeRange },
    });
    return response.data;
  },
};

// Alerts API
export const alertsAPI = {
  getAlerts: async (page = 1, limit = 20, status = 'all') => {
    // Map friendly status to backend 'acknowledged' boolean
    let acknowledgedParam = undefined;
    if (status === 'acknowledged') acknowledgedParam = 'true';
    if (status === 'unacknowledged') acknowledgedParam = 'false';

    const response = await api.get('/alerts/', {
      params: { page, page_size: limit, ...(acknowledgedParam ? { acknowledged: acknowledgedParam } : {}) },
    });
    return response.data;
  },

  acknowledgeAlert: async (alertId) => {
    const response = await api.post(`/alerts/${alertId}/acknowledge/`);
    return response.data;
  },

  getAlertStats: async () => {
    const response = await api.get('/alerts/stats/');
    return response.data;
  },
};

// Utility functions for file validation (updated for 100MB)
export const validateImageFile = (file) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxSize = 100 * 1024 * 1024; // 100MB

  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type. Please upload a JPEG, PNG, or WebP image.');
  }

  if (file.size > maxSize) {
    throw new Error('File size too large. Please upload an image smaller than 100MB.');
  }

  return true;
};

// Utility functions
export const handleAPIError = (error) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  } else if (error.response?.data?.error) {
    return error.response.data.error;
  } else if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};


// Health Check and Connection Testing API
export const healthAPI = {
  // Test backend connectivity
  checkBackend: async () => {
    try {
      const response = await api.get('/health/', { timeout: 5000 });
      return {
        status: 'connected',
        data: response.data,
        url: API_BASE_URL
      };
    } catch (error) {
      return {
        status: 'disconnected',
        error: error.message,
        code: error.code,
        url: API_BASE_URL
      };
    }
  },

  // Test authentication endpoint
  checkAuth: async () => {
    try {
      const response = await api.get('/auth/profile/', { timeout: 5000 });
      return {
        status: 'authenticated',
        user: response.data
      };
    } catch (error) {
      return {
        status: error.response?.status === 401 ? 'unauthenticated' : 'error',
        error: error.message
      };
    }
  },

  // Get system info for debugging
  getSystemInfo: () => {
    return {
      apiUrl: API_BASE_URL,
      environment: import.meta.env.MODE,
      hasToken: !!tokenManager.getAccessToken(),
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };
  }
};

// WebSocket connection helper
export const createWebSocketConnection = (token) => {
  const wsUrl = import.meta.env.VITE_WS_URL || 
                (API_BASE_URL.replace('/api', '').replace('http', 'ws') + '/ws/');
  
  const ws = new WebSocket(`${wsUrl}?token=${token}`);
  
  ws.onopen = () => {
    console.log('🟢 WebSocket connected to:', wsUrl);
  };
  
  ws.onerror = (error) => {
    console.error('🔴 WebSocket error:', error);
  };
  
  ws.onclose = (event) => {
    console.log('🟡 WebSocket closed:', event.code, event.reason);
  };
  
  return ws;
};

// Export API instance and utilities
export default api;
export { API_BASE_URL };
