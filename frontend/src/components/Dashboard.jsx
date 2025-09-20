import React, { useState, useEffect } from 'react'
import { 
  ChartBarIcon,
  UsersIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  CameraIcon,
  PhotoIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  EyeIcon
} from '@heroicons/react/24/outline'

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalAnalyses: 0,
    peopleDetected: 0,
    alertsGenerated: 0,
    avgProcessingTime: 0,
    accuracy: 0,
    uptime: 0
  })
  const [recentActivity, setRecentActivity] = useState([])
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      // Simulate API calls - replace with actual endpoints
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock data
      setStats({
        totalAnalyses: 1247,
        peopleDetected: 8932,
        alertsGenerated: 23,
        avgProcessingTime: 87,
        accuracy: 94.2,
        uptime: 99.8
      })

      setRecentActivity([
        {
          id: 1,
          type: 'photo_analysis',
          description: 'Photo analyzed: 15 people detected',
          timestamp: new Date(Date.now() - 300000),
          status: 'safe'
        },
        {
          id: 2,
          type: 'live_detection',
          description: 'Live stream started: Main Entrance',
          timestamp: new Date(Date.now() - 600000),
          status: 'active'
        },
        {
          id: 3,
          type: 'alert',
          description: 'High risk alert: 28 people detected',
          timestamp: new Date(Date.now() - 900000),
          status: 'warning'
        },
        {
          id: 4,
          type: 'photo_analysis',
          description: 'Photo analyzed: 3 people detected',
          timestamp: new Date(Date.now() - 1200000),
          status: 'safe'
        },
        {
          id: 5,
          type: 'live_detection',
          description: 'Live stream ended: Event Hall',
          timestamp: new Date(Date.now() - 1800000),
          status: 'inactive'
        }
      ])

      setAlerts([
        {
          id: 1,
          title: 'High Crowd Density',
          description: 'Event Hall camera detected 32 people in confined space',
          severity: 'high',
          timestamp: new Date(Date.now() - 1800000),
          acknowledged: false
        },
        {
          id: 2,
          title: 'Camera Offline',
          description: 'Main entrance camera has been offline for 5 minutes',
          severity: 'medium',
          timestamp: new Date(Date.now() - 3600000),
          acknowledged: false
        }
      ])

    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const acknowledgeAlert = (alertId) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ))
  }

  const getActivityIcon = (type) => {
    switch (type) {
      case 'photo_analysis': return <PhotoIcon className="w-5 h-5" />
      case 'live_detection': return <CameraIcon className="w-5 h-5" />
      case 'alert': return <ExclamationTriangleIcon className="w-5 h-5" />
      default: return <CheckCircleIcon className="w-5 h-5" />
    }
  }

  const getActivityColor = (status) => {
    switch (status) {
      case 'safe': return 'text-green-600 bg-green-50'
      case 'warning': return 'text-red-600 bg-red-50'
      case 'active': return 'text-blue-600 bg-blue-50'
      case 'inactive': return 'text-gray-600 bg-gray-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'border-red-500 bg-red-50 text-red-700'
      case 'medium': return 'border-yellow-500 bg-yellow-50 text-yellow-700'
      case 'low': return 'border-blue-500 bg-blue-50 text-blue-700'
      default: return 'border-gray-500 bg-gray-50 text-gray-700'
    }
  }

  const formatTimeAgo = (timestamp) => {
    const now = new Date()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return 'Just now'
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Safety Dashboard</h1>
        <p className="text-gray-600">Monitor your crowd detection system performance and alerts</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <ChartBarIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex items-center text-green-600">
              <ArrowTrendingUpIcon className="w-4 h-4 mr-1" />
              <span className="text-sm font-medium">+12%</span>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{stats.totalAnalyses.toLocaleString()}</div>
          <div className="text-gray-600">Total Analyses</div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-xl">
              <UsersIcon className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex items-center text-green-600">
              <ArrowTrendingUpIcon className="w-4 h-4 mr-1" />
              <span className="text-sm font-medium">+8%</span>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{stats.peopleDetected.toLocaleString()}</div>
          <div className="text-gray-600">People Detected</div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-red-100 rounded-xl">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
            </div>
            <div className="flex items-center text-red-600">
              <ArrowTrendingDownIcon className="w-4 h-4 mr-1" />
              <span className="text-sm font-medium">-15%</span>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{stats.alertsGenerated}</div>
          <div className="text-gray-600">Alerts Generated</div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-xl">
              <ClockIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex items-center text-green-600">
              <ArrowTrendingDownIcon className="w-4 h-4 mr-1" />
              <span className="text-sm font-medium">-5ms</span>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{stats.avgProcessingTime}ms</div>
          <div className="text-gray-600">Avg Processing Time</div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-indigo-100 rounded-xl">
              <CheckCircleIcon className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="flex items-center text-green-600">
              <ArrowTrendingUpIcon className="w-4 h-4 mr-1" />
              <span className="text-sm font-medium">+0.3%</span>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{stats.accuracy}%</div>
          <div className="text-gray-600">Detection Accuracy</div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-xl">
              <ArrowTrendingUpIcon className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex items-center text-green-600">
              <CheckCircleIcon className="w-4 h-4 mr-1" />
              <span className="text-sm font-medium">Stable</span>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{stats.uptime}%</div>
          <div className="text-gray-600">System Uptime</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
            <button className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors">
              View All
            </button>
          </div>
          
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-4 p-4 rounded-xl hover:bg-gray-50 transition-colors">
                <div className={`p-2 rounded-lg ${getActivityColor(activity.status)}`}>
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 font-medium">{activity.description}</p>
                  <p className="text-gray-500 text-sm">{formatTimeAgo(activity.timestamp)}</p>
                </div>
                <button className="text-gray-400 hover:text-gray-600 transition-colors">
                  <EyeIcon className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Active Alerts */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Active Alerts</h2>
            <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {alerts.filter(alert => !alert.acknowledged).length}
            </span>
          </div>
          
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div 
                key={alert.id} 
                className={`p-4 rounded-xl border-2 ${getSeverityColor(alert.severity)} ${
                  alert.acknowledged ? 'opacity-50' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold">{alert.title}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    alert.severity === 'high' ? 'bg-red-200 text-red-800' :
                    alert.severity === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                    'bg-blue-200 text-blue-800'
                  }`}>
                    {alert.severity.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm mb-3">{alert.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs opacity-75">{formatTimeAgo(alert.timestamp)}</span>
                  {!alert.acknowledged && (
                    <button
                      onClick={() => acknowledgeAlert(alert.id)}
                      className="text-xs bg-white/50 hover:bg-white/75 px-3 py-1 rounded-lg transition-colors"
                    >
                      Acknowledge
                    </button>
                  )}
                </div>
              </div>
            ))}
            
            {alerts.length === 0 && (
              <div className="text-center py-8">
                <CheckCircleIcon className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="text-gray-500">No active alerts</p>
                <p className="text-sm text-gray-400">All systems operating normally</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="p-4 border-2 border-blue-200 hover:border-blue-300 rounded-xl text-left transition-colors group">
            <PhotoIcon className="w-8 h-8 text-blue-600 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-gray-900 mb-1">Analyze Photo</h3>
            <p className="text-sm text-gray-600">Upload and analyze crowd photos</p>
          </button>
          
          <button className="p-4 border-2 border-green-200 hover:border-green-300 rounded-xl text-left transition-colors group">
            <CameraIcon className="w-8 h-8 text-green-600 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-gray-900 mb-1">Start Live Stream</h3>
            <p className="text-sm text-gray-600">Begin real-time monitoring</p>
          </button>
          
          <button className="p-4 border-2 border-purple-200 hover:border-purple-300 rounded-xl text-left transition-colors group">
            <ChartBarIcon className="w-8 h-8 text-purple-600 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-gray-900 mb-1">View Reports</h3>
            <p className="text-sm text-gray-600">Access detailed analytics</p>
          </button>
          
          <button className="p-4 border-2 border-orange-200 hover:border-orange-300 rounded-xl text-left transition-colors group">
            <ExclamationTriangleIcon className="w-8 h-8 text-orange-600 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-gray-900 mb-1">Alert Settings</h3>
            <p className="text-sm text-gray-600">Configure alert thresholds</p>
          </button>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
