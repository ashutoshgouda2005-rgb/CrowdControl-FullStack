import React, { createContext, useContext, useReducer, useEffect } from 'react';
import toast from 'react-hot-toast';

// Safe version of AppContext that prevents crashes
// This version has comprehensive error handling and graceful degradation

// Initial state with safe defaults
const initialState = {
  // Authentication
  user: null,
  isAuthenticated: false,
  isLoading: true,

  // Theme
  theme: 'light',

  // UI State
  sidebarOpen: false,
  notifications: [],
  
  // Real-time data
  liveDetections: [],
  alerts: [],
  analytics: {
    totalDetections: 0,
    activeStreams: 0,
    crowdCount: 0,
    riskLevel: 'low',
  },

  // WebSocket
  wsConnected: false,
  wsConnection: null,

  // Performance
  apiCache: new Map(),
  lastUpdate: null,

  // Error state
  hasError: false,
  errorMessage: null,
};

// Action types
const actionTypes = {
  // Authentication
  SET_USER: 'SET_USER',
  SET_LOADING: 'SET_LOADING',
  LOGOUT: 'LOGOUT',

  // Theme
  TOGGLE_THEME: 'TOGGLE_THEME',
  SET_THEME: 'SET_THEME',

  // UI
  TOGGLE_SIDEBAR: 'TOGGLE_SIDEBAR',
  SET_SIDEBAR: 'SET_SIDEBAR',
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',
  CLEAR_NOTIFICATIONS: 'CLEAR_NOTIFICATIONS',

  // Real-time data
  UPDATE_LIVE_DETECTIONS: 'UPDATE_LIVE_DETECTIONS',
  ADD_LIVE_DETECTION: 'ADD_LIVE_DETECTION',
  UPDATE_ALERTS: 'UPDATE_ALERTS',
  ADD_ALERT: 'ADD_ALERT',
  UPDATE_ANALYTICS: 'UPDATE_ANALYTICS',

  // WebSocket
  SET_WS_CONNECTION: 'SET_WS_CONNECTION',
  SET_WS_CONNECTED: 'SET_WS_CONNECTED',

  // Performance
  SET_CACHE: 'SET_CACHE',
  CLEAR_CACHE: 'CLEAR_CACHE',
  SET_LAST_UPDATE: 'SET_LAST_UPDATE',

  // Error handling
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// Safe reducer with error handling
const appReducer = (state, action) => {
  try {
    switch (action.type) {
      case actionTypes.SET_USER:
        return {
          ...state,
          user: action.payload,
          isAuthenticated: !!action.payload,
          isLoading: false,
          hasError: false,
          errorMessage: null,
        };

      case actionTypes.SET_LOADING:
        return {
          ...state,
          isLoading: action.payload,
        };

      case actionTypes.LOGOUT:
        return {
          ...state,
          user: null,
          isAuthenticated: false,
          isLoading: false,
          wsConnection: null,
          wsConnected: false,
        };

      case actionTypes.TOGGLE_THEME:
        const newTheme = state.theme === 'light' ? 'dark' : 'light';
        try {
          localStorage.setItem('theme', newTheme);
        } catch (e) {
          console.warn('Failed to save theme to localStorage:', e);
        }
        return {
          ...state,
          theme: newTheme,
        };

      case actionTypes.SET_THEME:
        try {
          localStorage.setItem('theme', action.payload);
        } catch (e) {
          console.warn('Failed to save theme to localStorage:', e);
        }
        return {
          ...state,
          theme: action.payload,
        };

      case actionTypes.TOGGLE_SIDEBAR:
        return {
          ...state,
          sidebarOpen: !state.sidebarOpen,
        };

      case actionTypes.SET_SIDEBAR:
        return {
          ...state,
          sidebarOpen: action.payload,
        };

      case actionTypes.ADD_NOTIFICATION:
        return {
          ...state,
          notifications: [
            ...state.notifications,
            {
              id: Date.now(),
              ...action.payload,
            },
          ],
        };

      case actionTypes.REMOVE_NOTIFICATION:
        return {
          ...state,
          notifications: state.notifications.filter(
            (notification) => notification.id !== action.payload
          ),
        };

      case actionTypes.CLEAR_NOTIFICATIONS:
        return {
          ...state,
          notifications: [],
        };

      case actionTypes.UPDATE_LIVE_DETECTIONS:
        return {
          ...state,
          liveDetections: action.payload || [],
        };

      case actionTypes.ADD_LIVE_DETECTION:
        return {
          ...state,
          liveDetections: [action.payload, ...state.liveDetections.slice(0, 49)],
        };

      case actionTypes.UPDATE_ALERTS:
        return {
          ...state,
          alerts: action.payload || [],
        };

      case actionTypes.ADD_ALERT:
        return {
          ...state,
          alerts: [action.payload, ...state.alerts],
        };

      case actionTypes.UPDATE_ANALYTICS:
        return {
          ...state,
          analytics: {
            ...state.analytics,
            ...action.payload,
          },
        };

      case actionTypes.SET_WS_CONNECTION:
        return {
          ...state,
          wsConnection: action.payload,
        };

      case actionTypes.SET_WS_CONNECTED:
        return {
          ...state,
          wsConnected: action.payload,
        };

      case actionTypes.SET_CACHE:
        try {
          const newCache = new Map(state.apiCache);
          newCache.set(action.payload.key, {
            data: action.payload.data,
            timestamp: Date.now(),
          });
          return {
            ...state,
            apiCache: newCache,
          };
        } catch (e) {
          console.warn('Failed to update cache:', e);
          return state;
        }

      case actionTypes.CLEAR_CACHE:
        return {
          ...state,
          apiCache: new Map(),
        };

      case actionTypes.SET_LAST_UPDATE:
        return {
          ...state,
          lastUpdate: action.payload,
        };

      case actionTypes.SET_ERROR:
        return {
          ...state,
          hasError: true,
          errorMessage: action.payload,
          isLoading: false,
        };

      case actionTypes.CLEAR_ERROR:
        return {
          ...state,
          hasError: false,
          errorMessage: null,
        };

      default:
        return state;
    }
  } catch (error) {
    console.error('Reducer error:', error);
    return {
      ...state,
      hasError: true,
      errorMessage: 'State update failed',
      isLoading: false,
    };
  }
};

// Context
const AppContext = createContext();

// Safe token manager that doesn't crash if localStorage is unavailable
const safeTokenManager = {
  getAccessToken: () => {
    try {
      return localStorage.getItem('access_token');
    } catch (e) {
      console.warn('Cannot access localStorage:', e);
      return null;
    }
  },
  getRefreshToken: () => {
    try {
      return localStorage.getItem('refresh_token');
    } catch (e) {
      console.warn('Cannot access localStorage:', e);
      return null;
    }
  },
  setTokens: (accessToken, refreshToken) => {
    try {
      localStorage.setItem('access_token', accessToken);
      if (refreshToken) localStorage.setItem('refresh_token', refreshToken);
    } catch (e) {
      console.warn('Cannot save tokens to localStorage:', e);
    }
  },
  clearTokens: () => {
    try {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    } catch (e) {
      console.warn('Cannot clear tokens from localStorage:', e);
    }
  },
  isAuthenticated: () => {
    try {
      return !!localStorage.getItem('access_token');
    } catch (e) {
      console.warn('Cannot check authentication status:', e);
      return false;
    }
  },
};

// Safe API import with fallback
let authAPI = null;
let createWebSocketConnection = null;

try {
  const apiModule = require('../services/api');
  authAPI = apiModule.authAPI;
  createWebSocketConnection = apiModule.createWebSocketConnection;
} catch (error) {
  console.warn('API module not available, using fallback:', error);
  // Fallback API
  authAPI = {
    getProfile: async () => {
      throw new Error('API not available');
    },
    login: async () => {
      throw new Error('API not available');
    },
    logout: () => {
      safeTokenManager.clearTokens();
    },
  };
  createWebSocketConnection = () => {
    console.warn('WebSocket not available');
    return null;
  };
}

// Provider component with comprehensive error handling
export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, {
    ...initialState,
    theme: (() => {
      try {
        return localStorage.getItem('theme') || 'light';
      } catch (e) {
        console.warn('Cannot access localStorage for theme:', e);
        return 'light';
      }
    })(),
  });

  // Safe initialization
  useEffect(() => {
    const initAuth = async () => {
      try {
        console.log('🔄 Initializing authentication...');
        
        if (safeTokenManager.isAuthenticated()) {
          try {
            const user = await authAPI.getProfile();
            dispatch({ type: actionTypes.SET_USER, payload: user });
            console.log('✅ Authentication successful');
            
            // Only initialize WebSocket if everything else worked
            const token = safeTokenManager.getAccessToken();
            if (token && createWebSocketConnection) {
              try {
                initWebSocket(token);
              } catch (wsError) {
                console.warn('WebSocket initialization failed:', wsError);
                // Don't crash the app for WebSocket failures
              }
            }
          } catch (error) {
            console.warn('Auth profile fetch failed:', error);
            safeTokenManager.clearTokens();
            dispatch({ type: actionTypes.SET_LOADING, payload: false });
          }
        } else {
          console.log('ℹ️ No authentication token found');
          dispatch({ type: actionTypes.SET_LOADING, payload: false });
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        dispatch({ 
          type: actionTypes.SET_ERROR, 
          payload: 'Failed to initialize authentication' 
        });
      }
    };

    // Use setTimeout to prevent blocking the initial render
    setTimeout(initAuth, 100);
  }, []);

  // Safe theme application
  useEffect(() => {
    try {
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', state.theme === 'dark');
      }
    } catch (error) {
      console.warn('Failed to apply theme:', error);
    }
  }, [state.theme]);

  // Safe WebSocket initialization
  const initWebSocket = (token) => {
    try {
      if (!createWebSocketConnection) {
        console.warn('WebSocket connection not available');
        return;
      }

      const ws = createWebSocketConnection(token);
      if (!ws) {
        console.warn('Failed to create WebSocket connection');
        return;
      }
      
      ws.onopen = () => {
        dispatch({ type: actionTypes.SET_WS_CONNECTED, payload: true });
        console.log('🟢 WebSocket connected');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.warn('WebSocket message parsing error:', error);
        }
      };

      ws.onclose = () => {
        dispatch({ type: actionTypes.SET_WS_CONNECTED, payload: false });
        console.log('🟡 WebSocket disconnected');
        
        // Safe reconnection attempt
        setTimeout(() => {
          try {
            if (safeTokenManager.isAuthenticated()) {
              initWebSocket(safeTokenManager.getAccessToken());
            }
          } catch (error) {
            console.warn('WebSocket reconnection failed:', error);
          }
        }, 5000);
      };

      ws.onerror = (error) => {
        console.warn('WebSocket error:', error);
        dispatch({ type: actionTypes.SET_WS_CONNECTED, payload: false });
      };

      dispatch({ type: actionTypes.SET_WS_CONNECTION, payload: ws });
    } catch (error) {
      console.warn('WebSocket initialization error:', error);
    }
  };

  // Safe WebSocket message handler
  const handleWebSocketMessage = (data) => {
    try {
      switch (data.type) {
        case 'live_detection':
          dispatch({ type: actionTypes.ADD_LIVE_DETECTION, payload: data.payload });
          break;
        
        case 'alert':
          dispatch({ type: actionTypes.ADD_ALERT, payload: data.payload });
          if (typeof toast !== 'undefined') {
            toast.success(`New Alert: ${data.payload.message}`);
          }
          break;
        
        case 'analytics_update':
          dispatch({ type: actionTypes.UPDATE_ANALYTICS, payload: data.payload });
          break;
        
        default:
          console.log('Unknown WebSocket message type:', data.type);
      }
    } catch (error) {
      console.warn('WebSocket message handling error:', error);
    }
  };

  // Safe actions with error handling
  const login = async (credentials) => {
    try {
      dispatch({ type: actionTypes.SET_LOADING, payload: true });
      const { user, access } = await authAPI.login(credentials);
      dispatch({ type: actionTypes.SET_USER, payload: user });
      
      // Safe WebSocket initialization
      try {
        initWebSocket(access);
      } catch (wsError) {
        console.warn('WebSocket initialization failed during login:', wsError);
      }
      
      if (typeof toast !== 'undefined') {
        toast.success('Login successful!');
      }
      return user;
    } catch (error) {
      dispatch({ type: actionTypes.SET_LOADING, payload: false });
      throw error;
    }
  };

  const logout = () => {
    try {
      authAPI.logout();
      
      // Safe WebSocket cleanup
      if (state.wsConnection) {
        try {
          state.wsConnection.close();
        } catch (error) {
          console.warn('WebSocket close error:', error);
        }
      }
      
      dispatch({ type: actionTypes.LOGOUT });
      dispatch({ type: actionTypes.CLEAR_CACHE });
      
      if (typeof toast !== 'undefined') {
        toast.success('Logged out successfully');
      }
    } catch (error) {
      console.warn('Logout error:', error);
    }
  };

  const toggleTheme = () => {
    dispatch({ type: actionTypes.TOGGLE_THEME });
  };

  const toggleSidebar = () => {
    dispatch({ type: actionTypes.TOGGLE_SIDEBAR });
  };

  const setSidebar = (open) => {
    dispatch({ type: actionTypes.SET_SIDEBAR, payload: open });
  };

  const showNotification = (notification) => {
    dispatch({ type: actionTypes.ADD_NOTIFICATION, payload: notification });
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      removeNotification(notification.id || Date.now());
    }, 5000);
  };

  const removeNotification = (id) => {
    dispatch({ type: actionTypes.REMOVE_NOTIFICATION, payload: id });
  };

  const clearNotifications = () => {
    dispatch({ type: actionTypes.CLEAR_NOTIFICATIONS });
  };

  const updateAnalytics = (analytics) => {
    dispatch({ type: actionTypes.UPDATE_ANALYTICS, payload: analytics });
  };

  const getCachedData = (key, maxAge = 5 * 60 * 1000) => {
    try {
      const cached = state.apiCache.get(key);
      if (cached && Date.now() - cached.timestamp < maxAge) {
        return cached.data;
      }
      return null;
    } catch (error) {
      console.warn('Cache retrieval error:', error);
      return null;
    }
  };

  const setCachedData = (key, data) => {
    dispatch({ type: actionTypes.SET_CACHE, payload: { key, data } });
  };

  const clearCache = () => {
    dispatch({ type: actionTypes.CLEAR_CACHE });
  };

  const clearError = () => {
    dispatch({ type: actionTypes.CLEAR_ERROR });
  };

  // Context value
  const value = {
    // State
    ...state,
    
    // Actions
    login,
    logout,
    toggleTheme,
    toggleSidebar,
    setSidebar,
    showNotification,
    removeNotification,
    clearNotifications,
    updateAnalytics,
    getCachedData,
    setCachedData,
    clearCache,
    clearError,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the context
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export default AppContext;
