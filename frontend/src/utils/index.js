import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';

// Tailwind CSS class merger utility
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Date formatting utilities
const dateUtils = {
  formatDate: (date, formatStr = 'MMM dd, yyyy') => {
    return format(new Date(date), formatStr);
  },

  formatTime: (date, formatStr = 'HH:mm:ss') => {
    return format(new Date(date), formatStr);
  },

  formatDateTime: (date, formatStr = 'MMM dd, yyyy HH:mm') => {
    return format(new Date(date), formatStr);
  },

  formatRelative: (date) => {
    const dateObj = new Date(date);
    
    if (isToday(dateObj)) {
      return `Today at ${format(dateObj, 'HH:mm')}`;
    }
    
    if (isYesterday(dateObj)) {
      return `Yesterday at ${format(dateObj, 'HH:mm')}`;
    }
    
    return formatDistanceToNow(dateObj, { addSuffix: true });
  },

  getTimeAgo: (date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  },
};

// File utilities
const fileUtils = {
  formatFileSize: (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  getFileExtension: (filename) => {
    return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
  },

  isImageFile: (file) => {
    const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    return imageTypes.includes(file.type);
  },

  createImagePreview: (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  validateImageFile: (file, maxSize = 10 * 1024 * 1024) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Please upload a JPEG, PNG, or WebP image.');
    }
    
    if (file.size > maxSize) {
      throw new Error(`File size too large. Please upload an image smaller than ${fileUtils.formatFileSize(maxSize)}.`);
    }
    
    return true;
  },
};

// Number utilities
const numberUtils = {
  formatNumber: (num, decimals = 0) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
  },

  formatPercentage: (num, decimals = 1) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num / 100);
  },

  clamp: (num, min, max) => {
    return Math.min(Math.max(num, min), max);
  },

  roundTo: (num, decimals = 2) => {
    return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
  },
};

// String utilities
const stringUtils = {
  capitalize: (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  },

  truncate: (str, length = 50, suffix = '...') => {
    if (str.length <= length) return str;
    return str.substring(0, length) + suffix;
  },

  slugify: (str) => {
    return str
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  },

  generateId: (prefix = '') => {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `${prefix}${prefix ? '_' : ''}${timestamp}_${randomStr}`;
  },
};

// Array utilities
const arrayUtils = {
  groupBy: (array, key) => {
    return array.reduce((groups, item) => {
      const group = item[key];
      groups[group] = groups[group] || [];
      groups[group].push(item);
      return groups;
    }, {});
  },

  sortBy: (array, key, direction = 'asc') => {
    return [...array].sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];
      
      if (direction === 'desc') {
        return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
      }
      return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
    });
  },

  unique: (array, key) => {
    if (key) {
      const seen = new Set();
      return array.filter(item => {
        const value = item[key];
        if (seen.has(value)) return false;
        seen.add(value);
        return true;
      });
    }
    return [...new Set(array)];
  },

  chunk: (array, size) => {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  },
};

// Object utilities
const objectUtils = {
  pick: (obj, keys) => {
    return keys.reduce((result, key) => {
      if (key in obj) {
        result[key] = obj[key];
      }
      return result;
    }, {});
  },

  omit: (obj, keys) => {
    const result = { ...obj };
    keys.forEach(key => delete result[key]);
    return result;
  },

  deepClone: (obj) => {
    return JSON.parse(JSON.stringify(obj));
  },

  isEmpty: (obj) => {
    return Object.keys(obj).length === 0;
  },
};

// Color utilities
const colorUtils = {
  getRiskColor: (level) => {
    const colors = {
      low: 'text-green-600 bg-green-100',
      medium: 'text-yellow-600 bg-yellow-100',
      high: 'text-orange-600 bg-orange-100',
      critical: 'text-red-600 bg-red-100',
    };
    return colors[level] || colors.low;
  },

  getStatusColor: (status) => {
    const colors = {
      active: 'text-green-600 bg-green-100',
      inactive: 'text-gray-600 bg-gray-100',
      pending: 'text-yellow-600 bg-yellow-100',
      error: 'text-red-600 bg-red-100',
    };
    return colors[status] || colors.inactive;
  },

  hexToRgb: (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  },
};

// Validation utilities
const validationUtils = {
  isEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  isPhone: (phone) => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  },

  isUrl: (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  isStrongPassword: (password) => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return strongPasswordRegex.test(password);
  },
};

// Local storage utilities
const storageUtils = {
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },

  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },

  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  },

  clear: () => {
    try {
      localStorage.clear();
      return true;
    } catch {
      return false;
    }
  },
};

// Performance utilities
const performanceUtils = {
  debounce: (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  },

  throttle: (func, delay) => {
    let lastCall = 0;
    return (...args) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        return func.apply(null, args);
      }
    };
  },

  measurePerformance: (name, func) => {
    const start = performance.now();
    const result = func();
    const end = performance.now();
    console.log(`${name} took ${end - start} milliseconds`);
    return result;
  },
};

// Device utilities
const deviceUtils = {
  isMobile: () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  },

  isTablet: () => {
    return /iPad|Android(?!.*Mobile)/i.test(navigator.userAgent);
  },

  isDesktop: () => {
    return !deviceUtils.isMobile() && !deviceUtils.isTablet();
  },

  getDeviceType: () => {
    if (deviceUtils.isMobile()) return 'mobile';
    if (deviceUtils.isTablet()) return 'tablet';
    return 'desktop';
  },

  supportsWebRTC: () => {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  },

  supportsWebSocket: () => {
    return 'WebSocket' in window;
  },
};

// Error handling utilities
const errorUtils = {
  getErrorMessage: (error) => {
    if (error.response?.data?.message) {
      return error.response.data.message;
    } else if (error.response?.data?.error) {
      return error.response.data.error;
    } else if (error.message) {
      return error.message;
    }
    return 'An unexpected error occurred';
  },

  logError: (error, context = '') => {
    console.error(`Error ${context}:`, error);
    
    // In production, you might want to send this to an error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error);
    }
  },

  createErrorBoundary: (fallback) => {
    return class ErrorBoundary extends React.Component {
      constructor(props) {
        super(props);
        this.state = { hasError: false };
      }

      static getDerivedStateFromError(error) {
        return { hasError: true };
      }

      componentDidCatch(error, errorInfo) {
        errorUtils.logError(error, 'ErrorBoundary');
      }

      render() {
        if (this.state.hasError) {
          return fallback;
        }

        return this.props.children;
      }
    };
  },
};

// Export all utilities
export {
  dateUtils,
  fileUtils,
  numberUtils,
  stringUtils,
  arrayUtils,
  objectUtils,
  colorUtils,
  validationUtils,
  storageUtils,
  performanceUtils,
  deviceUtils,
  errorUtils,
};
