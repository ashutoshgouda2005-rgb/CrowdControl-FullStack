import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  ShieldCheckIcon, 
  CameraIcon, 
  PhotoIcon, 
  UsersIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'

const LandingPage = () => {
  const [activeFeature, setActiveFeature] = useState(0)

  const features = [
    {
      icon: <PhotoIcon className="w-8 h-8" />,
      title: "Photo Analysis",
      description: "Upload crowd photos for instant analysis and safety assessment",
      color: "blue"
    },
    {
      icon: <CameraIcon className="w-8 h-8" />,
      title: "Live Monitoring",
      description: "Real-time crowd detection using your camera or CCTV feeds",
      color: "green"
    },
    {
      icon: <UsersIcon className="w-8 h-8" />,
      title: "Accurate Counting",
      description: "Advanced AI with 95%+ accuracy in people detection and counting",
      color: "purple"
    },
    {
      icon: <ExclamationTriangleIcon className="w-8 h-8" />,
      title: "Safety Alerts",
      description: "Instant warnings when crowd density reaches dangerous levels",
      color: "red"
    }
  ]

  const stats = [
    { label: "Detection Accuracy", value: "95%+", color: "text-green-600" },
    { label: "Processing Speed", value: "<100ms", color: "text-blue-600" },
    { label: "Safety Alerts", value: "Real-time", color: "text-orange-600" },
    { label: "Uptime", value: "99.9%", color: "text-purple-600" }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            {/* Main Title */}
            <div className="flex justify-center items-center mb-6">
              <ShieldCheckIcon className="w-16 h-16 text-blue-600 mr-4" />
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900">
                Crowd<span className="text-blue-600">Control</span>
              </h1>
            </div>
            
            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              AI-Powered Stampede Detection System for Public Safety
            </p>
            
            {/* Description */}
            <p className="text-lg text-gray-500 mb-12 max-w-2xl mx-auto">
              Protect crowds with real-time AI analysis. Upload photos or use live cameras 
              to detect dangerous crowd densities and prevent stampede incidents before they happen.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Link 
                to="/upload"
                className="group bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 flex items-center shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <PhotoIcon className="w-6 h-6 mr-3" />
                Analyze Photo
                <ArrowRightIcon className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <Link 
                to="/live-stream"
                className="group bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 flex items-center shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <CameraIcon className="w-6 h-6 mr-3" />
                Start Live Detection
                <ArrowRightIcon className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-lg">
                  <div className={`text-3xl font-bold ${stat.color} mb-2`}>
                    {stat.value}
                  </div>
                  <div className="text-gray-600 text-sm font-medium">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Advanced Safety Features
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Comprehensive crowd monitoring with cutting-edge AI technology
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className={`group p-8 rounded-2xl border-2 transition-all duration-300 cursor-pointer ${
                  activeFeature === index 
                    ? 'border-blue-500 bg-blue-50 shadow-xl scale-105' 
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-lg'
                }`}
                onMouseEnter={() => setActiveFeature(index)}
              >
                <div className={`inline-flex p-3 rounded-xl mb-6 ${
                  feature.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                  feature.color === 'green' ? 'bg-green-100 text-green-600' :
                  feature.color === 'purple' ? 'bg-purple-100 text-purple-600' :
                  'bg-red-100 text-red-600'
                }`}>
                  {feature.icon}
                </div>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Safety Indicators */}
      <div className="py-16 bg-gradient-to-r from-green-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Real-Time Safety Monitoring
            </h2>
            <p className="text-lg text-gray-600">
              Visual indicators help you understand crowd safety at a glance
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {/* Safe Level */}
            <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircleIcon className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-green-800 mb-2">Safe</h3>
              <p className="text-green-600 font-medium mb-2">0-15 People</p>
              <p className="text-gray-600 text-sm">Normal crowd density, no safety concerns</p>
            </div>

            {/* Moderate Level */}
            <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ExclamationTriangleIcon className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-yellow-800 mb-2">Monitor</h3>
              <p className="text-yellow-600 font-medium mb-2">16-25 People</p>
              <p className="text-gray-600 text-sm">Increased density, monitor closely</p>
            </div>

            {/* Danger Level */}
            <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-red-800 mb-2">Alert</h3>
              <p className="text-red-600 font-medium mb-2">25+ People</p>
              <p className="text-gray-600 text-sm">High risk, immediate action required</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Start */}
      <div className="py-20 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Enhance Safety?
          </h2>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Start protecting your crowds today with our advanced AI detection system
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/register"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl"
            >
              Get Started Free
            </Link>
            
            <Link 
              to="/demo"
              className="border-2 border-white text-white hover:bg-white hover:text-gray-900 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 flex items-center justify-center"
            >
              View Demo
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LandingPage
