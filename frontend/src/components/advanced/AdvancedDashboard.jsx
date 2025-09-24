import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Users,
  Camera,
  AlertTriangle,
  Activity,
  TrendingUp,
  TrendingDown,
  Eye,
  Clock,
  MapPin,
  Zap,
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { analysisAPI, alertsAPI } from '../../services/api';
import { dateUtils, numberUtils, colorUtils, cn } from '../../utils';
import LoadingSpinner from '../ui/LoadingSpinner';
import ErrorBoundary from '../ui/ErrorBoundary';

const AdvancedDashboard = () => {
  const { analytics, liveDetections, alerts, getCachedData, setCachedData } = useApp();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('24h');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [alertStats, setAlertStats] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds

  // Fetch analytics data
  const fetchAnalytics = useCallback(async () => {
    try {
      const cacheKey = `analytics_${timeRange}`;
      const cached = getCachedData(cacheKey, 60000); // 1 minute cache
      
      if (cached) {
        setAnalyticsData(cached);
        return;
      }

      const [analyticsResponse, alertStatsResponse] = await Promise.all([
        analysisAPI.getAnalytics(timeRange),
        alertsAPI.getAlertStats(),
      ]);

      setAnalyticsData(analyticsResponse);
      setAlertStats(alertStatsResponse);
      
      setCachedData(cacheKey, analyticsResponse);
      setCachedData('alert_stats', alertStatsResponse);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [timeRange, getCachedData, setCachedData]);

  // Auto-refresh effect
  useEffect(() => {
    fetchAnalytics();
    
    const interval = setInterval(fetchAnalytics, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchAnalytics, refreshInterval]);

  // Time range options
  const timeRangeOptions = [
    { value: '1h', label: 'Last Hour' },
    { value: '6h', label: 'Last 6 Hours' },
    { value: '24h', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
  ];

  // Stat cards data
  const statCards = [
    {
      title: 'Total Detections',
      value: analytics.totalDetections,
      change: analyticsData?.detectionChange || 0,
      icon: Eye,
      color: 'blue',
    },
    {
      title: 'Active Streams',
      value: analytics.activeStreams,
      change: analyticsData?.streamChange || 0,
      icon: Camera,
      color: 'green',
    },
    {
      title: 'Current Crowd',
      value: analytics.crowdCount,
      change: analyticsData?.crowdChange || 0,
      icon: Users,
      color: 'purple',
    },
    {
      title: 'Active Alerts',
      value: alerts.filter(alert => !alert.acknowledged).length,
      change: alertStats?.alertChange || 0,
      icon: AlertTriangle,
      color: 'red',
    },
  ];

  // Chart colors
  const chartColors = {
    primary: '#3B82F6',
    secondary: '#10B981',
    tertiary: '#F59E0B',
    quaternary: '#EF4444',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Real-time crowd monitoring and analytics
            </p>
          </div>
          
          <div className="flex items-center space-x-4 mt-4 sm:mt-0">
            {/* Time Range Selector */}
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {timeRangeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            
            {/* Refresh Interval */}
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={10000}>10s</option>
              <option value={30000}>30s</option>
              <option value={60000}>1m</option>
              <option value={300000}>5m</option>
            </select>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {numberUtils.formatNumber(stat.value)}
                  </p>
                </div>
                <div className={cn(
                  'p-3 rounded-full',
                  stat.color === 'blue' && 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400',
                  stat.color === 'green' && 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400',
                  stat.color === 'purple' && 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400',
                  stat.color === 'red' && 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400'
                )}>
                  <stat.icon size={24} />
                </div>
              </div>
              
              {stat.change !== 0 && (
                <div className="mt-4 flex items-center">
                  {stat.change > 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                  )}
                  <span className={cn(
                    'text-sm font-medium',
                    stat.change > 0 ? 'text-green-600' : 'text-red-600'
                  )}>
                    {Math.abs(stat.change)}%
                  </span>
                  <span className="text-sm text-gray-500 ml-1">
                    vs previous period
                  </span>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Detection Timeline */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Detection Timeline
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analyticsData?.detectionTimeline || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={(value) => dateUtils.formatTime(value)}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => dateUtils.formatDateTime(value)}
                  formatter={(value) => [value, 'Detections']}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke={chartColors.primary}
                  fill={chartColors.primary}
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Crowd Density Heatmap */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Crowd Density by Hour
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData?.hourlyDensity || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="density" fill={chartColors.secondary} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Additional Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Risk Level Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Risk Level Distribution
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={analyticsData?.riskDistribution || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {(analyticsData?.riskDistribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Recent Activity
            </h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {liveDetections.slice(0, 10).map((detection, index) => (
                <div key={detection.id || index} className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <Activity className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white truncate">
                      {detection.people_count} people detected
                    </p>
                    <p className="text-xs text-gray-500">
                      {dateUtils.getTimeAgo(detection.timestamp)}
                    </p>
                  </div>
                  <div className={cn(
                    'px-2 py-1 text-xs rounded-full',
                    colorUtils.getRiskColor(detection.risk_level)
                  )}>
                    {detection.risk_level}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* System Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              System Status
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  AI Model Status
                </span>
                <span className="flex items-center text-sm text-green-600">
                  <Zap className="w-4 h-4 mr-1" />
                  Active
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  WebSocket Connection
                </span>
                <span className="flex items-center text-sm text-green-600">
                  <Activity className="w-4 h-4 mr-1" />
                  Connected
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Last Update
                </span>
                <span className="text-sm text-gray-500">
                  <Clock className="w-4 h-4 inline mr-1" />
                  {dateUtils.getTimeAgo(new Date())}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Processing Speed
                </span>
                <span className="text-sm text-gray-900 dark:text-white">
                  ~85ms avg
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Live Detection Feed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Live Detection Feed
            </h3>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-500">Live</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {liveDetections.slice(0, 6).map((detection, index) => (
                <motion.div
                  key={detection.id || index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="border border-gray-200 dark:border-gray-600 rounded-lg p-4"
                >
                  {detection.image_url && (
                    <img
                      src={detection.image_url}
                      alt="Detection"
                      className="w-full h-32 object-cover rounded-lg mb-3"
                    />
                  )}
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {detection.people_count} People
                      </span>
                      <span className={cn(
                        'px-2 py-1 text-xs rounded-full',
                        colorUtils.getRiskColor(detection.risk_level)
                      )}>
                        {detection.risk_level}
                      </span>
                    </div>
                    
                    <div className="flex items-center text-xs text-gray-500">
                      <MapPin className="w-3 h-3 mr-1" />
                      {detection.location || 'Unknown Location'}
                    </div>
                    
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock className="w-3 h-3 mr-1" />
                      {dateUtils.formatRelative(detection.timestamp)}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </ErrorBoundary>
  );
};

export default AdvancedDashboard;
