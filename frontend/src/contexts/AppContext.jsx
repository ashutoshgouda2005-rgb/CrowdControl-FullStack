import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authAPI, tokenManager, createWebSocketConnection } from '../services/api';
import toast from 'react-hot-toast';

// Initial state
const initialState = {
  // Authentication
  user: null,
  isAuthenticated: false,
  isLoading: true,

  // Theme
  theme: localStorage.getItem('theme') || 'light',

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
};

// Reducer
const appReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.SET_USER:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        isLoading: false,
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
      localStorage.setItem('theme', newTheme);
      return {
        ...state,
        theme: newTheme,
      };

    case actionTypes.SET_THEME:
      localStorage.setItem('theme', action.payload);
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
        liveDetections: action.payload,
      };

    case actionTypes.ADD_LIVE_DETECTION:
      return {
        ...state,
        liveDetections: [action.payload, ...state.liveDetections.slice(0, 49)], // Keep last 50
      };

    case actionTypes.UPDATE_ALERTS:
      return {
        ...state,
        alerts: action.payload,
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
      const newCache = new Map(state.apiCache);
      newCache.set(action.payload.key, {
        data: action.payload.data,
        timestamp: Date.now(),
      });
      return {
        ...state,
        apiCache: newCache,
      };

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

    default:
      return state;
  }
};

// Context
const AppContext = createContext();

// Provider component
export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Initialize authentication and theme
  useEffect(() => {
    const initAuth = async () => {
      if (tokenManager.isAuthenticated()) {
        try {
          const user = await authAPI.getProfile();
          dispatch({ type: actionTypes.SET_USER, payload: user });
          
          // Initialize WebSocket connection
          const token = tokenManager.getAccessToken();
          if (token) {
            initWebSocket(token);
          }
        } catch (error) {
          console.error('Auth initialization failed:', error);
          tokenManager.clearTokens();
          dispatch({ type: actionTypes.SET_LOADING, payload: false });
        }
      } else {
        dispatch({ type: actionTypes.SET_LOADING, payload: false });
      }
    };

    initAuth();
  }, []);

  // Apply theme to DOM
  useEffect(() => {
    document.documentElement.classList.toggle('dark', state.theme === 'dark');
  }, [state.theme]);

  // WebSocket initialization
  const initWebSocket = (token) => {
    try {
      const ws = createWebSocketConnection(token);
      
      ws.onopen = () => {
        dispatch({ type: actionTypes.SET_WS_CONNECTED, payload: true });
        console.log('WebSocket connected');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('WebSocket message parsing error:', error);
        }
      };

      ws.onclose = () => {
        dispatch({ type: actionTypes.SET_WS_CONNECTED, payload: false });
        console.log('WebSocket disconnected');
        
        // Attempt reconnection after 5 seconds
        setTimeout(() => {
          if (tokenManager.isAuthenticated()) {
            initWebSocket(tokenManager.getAccessToken());
          }
        }, 5000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        dispatch({ type: actionTypes.SET_WS_CONNECTED, payload: false });
      };

      dispatch({ type: actionTypes.SET_WS_CONNECTION, payload: ws });
    } catch (error) {
      console.error('WebSocket initialization error:', error);
    }
  };

  // Handle WebSocket messages
  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'live_detection':
        dispatch({ type: actionTypes.ADD_LIVE_DETECTION, payload: data.payload });
        break;
      
      case 'alert':
        dispatch({ type: actionTypes.ADD_ALERT, payload: data.payload });
        showNotification({
          type: 'warning',
          title: 'New Alert',
          message: data.payload.message,
        });
        break;
      
      case 'analytics_update':
        dispatch({ type: actionTypes.UPDATE_ANALYTICS, payload: data.payload });
        break;
      
      default:
        console.log('Unknown WebSocket message type:', data.type);
    }
  };

  // Actions
  const login = async (credentials) => {
    try {
      dispatch({ type: actionTypes.SET_LOADING, payload: true });
      const { user, access } = await authAPI.login(credentials);
      dispatch({ type: actionTypes.SET_USER, payload: user });
      
      // Initialize WebSocket
      initWebSocket(access);
      
      toast.success('Login successful!');
      return user;
    } catch (error) {
      dispatch({ type: actionTypes.SET_LOADING, payload: false });
      throw error;
    }
  };

  const logout = () => {
    authAPI.logout();
    
    // Close WebSocket connection
    if (state.wsConnection) {
      state.wsConnection.close();
    }
    
    dispatch({ type: actionTypes.LOGOUT });
    dispatch({ type: actionTypes.CLEAR_CACHE });
    toast.success('Logged out successfully');
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

  const getCachedData = (key, maxAge = 5 * 60 * 1000) => { // 5 minutes default
    const cached = state.apiCache.get(key);
    if (cached && Date.now() - cached.timestamp < maxAge) {
      return cached.data;
    }
    return null;
  };

  const setCachedData = (key, data) => {
    dispatch({ type: actionTypes.SET_CACHE, payload: { key, data } });
  };

  const clearCache = () => {
    dispatch({ type: actionTypes.CLEAR_CACHE });
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
