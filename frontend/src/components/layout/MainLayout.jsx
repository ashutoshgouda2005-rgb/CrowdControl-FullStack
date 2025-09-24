import React from 'react';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import ResponsiveSidebar from './ResponsiveSidebar';
import NotificationSystem from './NotificationSystem';
import NotificationButton from './NotificationButton';
import ThemeToggle from './ThemeToggle';
import { useApp } from '../../contexts/AppContext';
import { Wifi, WifiOff } from 'lucide-react';
import { cn } from '../../utils';

const MainLayout = () => {
  const { wsConnected, notifications, clearNotifications } = useApp();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Sidebar */}
      <ResponsiveSidebar />
      
      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Bar */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Connection Status */}
              <div className="flex items-center space-x-2">
                {wsConnected ? (
                  <div className="flex items-center text-green-600 dark:text-green-400">
                    <Wifi className="w-4 h-4 mr-1" />
                    <span className="text-sm font-medium">Connected</span>
                  </div>
                ) : (
                  <div className="flex items-center text-red-600 dark:text-red-400">
                    <WifiOff className="w-4 h-4 mr-1" />
                    <span className="text-sm font-medium">Disconnected</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Notifications Button */}
              <NotificationButton />
              
              {/* Theme Toggle */}
              <ThemeToggle />
            </div>
          </div>
        </header>
        
        {/* Page Content */}
        <main className="p-4 lg:p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
      
      {/* Notification System */}
      <NotificationSystem />
    </div>
  );
};

export default MainLayout;
