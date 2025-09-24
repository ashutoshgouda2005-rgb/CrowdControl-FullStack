import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Camera,
  Upload,
  Users,
  AlertTriangle,
  Settings,
  User,
  LogOut,
  Menu,
  X,
  Activity,
  BarChart3,
  Bell,
  Shield,
  Zap,
  Eye,
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { cn } from '../../utils';

const ResponsiveSidebar = () => {
  const { 
    sidebarOpen, 
    setSidebar, 
    user, 
    logout, 
    analytics, 
    alerts,
    wsConnected 
  } = useApp();
  const location = useLocation();

  // Navigation items
  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      name: 'Live Detection',
      href: '/live-detection',
      icon: Camera,
      badge: wsConnected ? 'Live' : null,
      badgeColor: wsConnected ? 'green' : 'gray',
    },
    {
      name: 'Image Upload',
      href: '/upload',
      icon: Upload,
      badge: null,
    },
    {
      name: 'Analytics',
      href: '/analytics',
      icon: BarChart3,
      badge: analytics.totalDetections > 0 ? analytics.totalDetections : null,
    },
    {
      name: 'Alerts',
      href: '/alerts',
      icon: AlertTriangle,
      badge: alerts.filter(alert => !alert.acknowledged).length || null,
      badgeColor: 'red',
    },
    {
      name: 'Activity',
      href: '/activity',
      icon: Activity,
      badge: null,
    },
  ];

  const bottomNavigationItems = [
    {
      name: 'Profile',
      href: '/profile',
      icon: User,
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
    },
  ];

  // Check if route is active
  const isActiveRoute = (href) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  // Get badge color classes
  const getBadgeColors = (color) => {
    switch (color) {
      case 'green':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'red':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'blue':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  // Navigation link component
  const NavigationLink = ({ item, onClick }) => {
    const isActive = isActiveRoute(item.href);
    
    return (
      <NavLink
        to={item.href}
        onClick={onClick}
        className={cn(
          'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 group',
          isActive
            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
        )}
      >
        <item.icon 
          className={cn(
            'w-5 h-5 mr-3 transition-colors',
            isActive 
              ? 'text-blue-600 dark:text-blue-400' 
              : 'text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-300'
          )} 
        />
        <span className="flex-1">{item.name}</span>
        
        {item.badge && (
          <span className={cn(
            'px-2 py-1 text-xs font-medium rounded-full',
            getBadgeColors(item.badgeColor)
          )}>
            {typeof item.badge === 'number' && item.badge > 99 ? '99+' : item.badge}
          </span>
        )}
      </NavLink>
    );
  };

  // Sidebar content
  const SidebarContent = ({ onLinkClick }) => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
              CrowdControl
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              AI Detection System
            </p>
          </div>
        </div>
        
        {/* Mobile close button */}
        <button
          onClick={() => setSidebar(false)}
          className="lg:hidden p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* User info */}
      {user && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user.first_name || user.username}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user.email}
              </p>
            </div>
            <div className="flex items-center space-x-1">
              {wsConnected ? (
                <div className="w-2 h-2 bg-green-500 rounded-full" title="Connected" />
              ) : (
                <div className="w-2 h-2 bg-red-500 rounded-full" title="Disconnected" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navigationItems.map((item) => (
          <NavigationLink key={item.name} item={item} onClick={onLinkClick} />
        ))}
      </nav>

      {/* System Status */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500 dark:text-gray-400">System Status</span>
            <span className="flex items-center text-green-600 dark:text-green-400">
              <Zap className="w-3 h-3 mr-1" />
              Active
            </span>
          </div>
          
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500 dark:text-gray-400">Active Streams</span>
            <span className="text-gray-900 dark:text-white font-medium">
              {analytics.activeStreams}
            </span>
          </div>
          
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500 dark:text-gray-400">Total Detections</span>
            <span className="text-gray-900 dark:text-white font-medium">
              {analytics.totalDetections}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom navigation */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
        {bottomNavigationItems.map((item) => (
          <NavigationLink key={item.name} item={item} onClick={onLinkClick} />
        ))}
        
        <button
          onClick={() => {
            logout();
            onLinkClick?.();
          }}
          className="flex items-center w-full px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebar(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:bg-white lg:dark:bg-gray-800 lg:border-r lg:border-gray-200 lg:dark:border-gray-700">
        <SidebarContent />
      </div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebar(false)}
              className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            />
            
            {/* Sidebar */}
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="lg:hidden fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-50"
            >
              <SidebarContent onLinkClick={() => setSidebar(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default ResponsiveSidebar;
