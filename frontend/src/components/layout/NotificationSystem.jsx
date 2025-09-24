import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
  X,
  Bell,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { cn, dateUtils } from '../../utils';

const NotificationSystem = () => {
  const { notifications, removeNotification, clearNotifications } = useApp();

  // Get notification icon
  const getNotificationIcon = (type) => {
    const iconProps = { className: "w-5 h-5" };
    
    switch (type) {
      case 'success':
        return <CheckCircle {...iconProps} className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle {...iconProps} className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <XCircle {...iconProps} className="w-5 h-5 text-red-500" />;
      case 'info':
      default:
        return <Info {...iconProps} className="w-5 h-5 text-blue-500" />;
    }
  };

  // Get notification colors
  const getNotificationColors = (type) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900 dark:border-green-700 dark:text-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900 dark:border-yellow-700 dark:text-yellow-200';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900 dark:border-red-700 dark:text-red-200';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-200';
    }
  };

  return (
    <>
      {/* React Hot Toast for simple notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--toast-bg)',
            color: 'var(--toast-color)',
            border: '1px solid var(--toast-border)',
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#FFFFFF',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#FFFFFF',
            },
          },
        }}
      />

      {/* Advanced notification panel */}
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50 w-96 max-w-sm space-y-2">
          <AnimatePresence>
            {notifications.map((notification) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, x: 300, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 300, scale: 0.9 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={cn(
                  'relative p-4 rounded-lg border shadow-lg backdrop-blur-sm',
                  getNotificationColors(notification.type)
                )}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    {notification.title && (
                      <h4 className="text-sm font-semibold mb-1">
                        {notification.title}
                      </h4>
                    )}
                    
                    <p className="text-sm opacity-90">
                      {notification.message}
                    </p>
                    
                    {notification.timestamp && (
                      <p className="text-xs opacity-70 mt-1">
                        {dateUtils.getTimeAgo(notification.timestamp)}
                      </p>
                    )}
                    
                    {notification.actions && (
                      <div className="flex space-x-2 mt-3">
                        {notification.actions.map((action, index) => (
                          <button
                            key={index}
                            onClick={action.onClick}
                            className={cn(
                              'px-3 py-1 text-xs font-medium rounded transition-colors',
                              action.primary
                                ? 'bg-white bg-opacity-20 hover:bg-opacity-30'
                                : 'bg-black bg-opacity-10 hover:bg-opacity-20'
                            )}
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={() => removeNotification(notification.id)}
                    className="flex-shrink-0 p-1 rounded-full hover:bg-black hover:bg-opacity-10 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Progress bar for auto-dismiss */}
                {notification.autoDismiss !== false && (
                  <motion.div
                    initial={{ width: '100%' }}
                    animate={{ width: '0%' }}
                    transition={{ duration: notification.duration || 5, ease: "linear" }}
                    className="absolute bottom-0 left-0 h-1 bg-current opacity-30 rounded-b-lg"
                  />
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          
          {/* Clear all button */}
          {notifications.length > 1 && (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              onClick={clearNotifications}
              className="w-full p-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-all"
            >
              Clear All Notifications
            </motion.button>
          )}
        </div>
      )}
    </>
  );
};

export default NotificationSystem;
