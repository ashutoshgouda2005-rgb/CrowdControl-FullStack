import React from 'react'
import { Link } from 'react-router-dom'
import { authApi } from '../utils/api'

export default function Home() {
  const isLoggedIn = authApi.isAuthenticated()

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="hero-gradient relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative container-custom py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-white animate-slide-in">
              <h1 className="text-5xl lg:text-7xl font-bold mb-6 leading-tight">
                AI-Powered
                <span className="block bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                  Crowd Control
                </span>
              </h1>
              <p className="text-xl lg:text-2xl mb-8 text-blue-100 leading-relaxed">
                Advanced stampede detection and crowd analysis using cutting-edge machine learning technology. 
                Keep your events safe with real-time monitoring and intelligent alerts.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                {isLoggedIn ? (
                  <>
                    <Link to="/uploads" className="btn btn-accent text-lg px-8 py-4">
                      <span className="mr-3">📤</span>
                      Start Analysis
                    </Link>
                    <Link to="/live" className="btn btn-outline text-lg px-8 py-4 border-white text-white hover:bg-white hover:text-blue-600">
                      <span className="mr-3">📹</span>
                      Live Stream
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to="/register" className="btn btn-accent text-lg px-8 py-4">
                      <span className="mr-3">✨</span>
                      Get Started Free
                    </Link>
                    <Link to="/login" className="btn btn-outline text-lg px-8 py-4 border-white text-white hover:bg-white hover:text-blue-600">
                      <span className="mr-3">🔐</span>
                      Sign In
                    </Link>
                  </>
                )}
              </div>
            </div>
            <div className="relative animate-float">
              <div className="glass rounded-3xl p-8 animate-pulse-glow">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Live Analysis</h3>
                    <div className="status-online bg-emerald-500 text-white">
                      <div className="w-2 h-2 bg-white rounded-full mr-1"></div>
                      Active
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>People Detected:</span>
                      <span className="font-bold">127</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Risk Level:</span>
                      <span className="font-bold text-emerald-300">Low</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Confidence:</span>
                      <span className="font-bold">94.2%</span>
                    </div>
                  </div>
                  <div className="mt-4 h-2 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full w-3/4 animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-white/10 rounded-full animate-float" style={{animationDelay: '0.5s'}}></div>
        <div className="absolute top-40 right-20 w-16 h-16 bg-yellow-400/20 rounded-full animate-float" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-emerald-400/20 rounded-full animate-float" style={{animationDelay: '1.5s'}}></div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white/50">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold gradient-text mb-6">
              Powerful Features
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to monitor crowds and prevent dangerous situations with AI-powered intelligence.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="card group cursor-pointer">
              <div className="card-body text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl">🤖</span>
                </div>
                <h3 className="text-xl font-bold mb-3 gradient-text">AI Detection</h3>
                <p className="text-gray-600">
                  Advanced machine learning algorithms analyze crowd patterns and detect potential stampede risks in real-time.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="card group cursor-pointer">
              <div className="card-body text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl">📹</span>
                </div>
                <h3 className="text-xl font-bold mb-3 gradient-text">Live Streaming</h3>
                <p className="text-gray-600">
                  Monitor events in real-time with live video analysis and instant alerts for crowd safety management.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="card group cursor-pointer">
              <div className="card-body text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl">⚡</span>
                </div>
                <h3 className="text-xl font-bold mb-3 gradient-text">Instant Alerts</h3>
                <p className="text-gray-600">
                  Get immediate notifications when dangerous crowd conditions are detected, enabling quick response.
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="card group cursor-pointer">
              <div className="card-body text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl">📊</span>
                </div>
                <h3 className="text-xl font-bold mb-3 gradient-text">Analytics Dashboard</h3>
                <p className="text-gray-600">
                  Comprehensive analytics and reporting tools to track crowd patterns and safety metrics over time.
                </p>
              </div>
            </div>

            {/* Feature 5 */}
            <div className="card group cursor-pointer">
              <div className="card-body text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl">🔒</span>
                </div>
                <h3 className="text-xl font-bold mb-3 gradient-text">Secure & Private</h3>
                <p className="text-gray-600">
                  Enterprise-grade security with encrypted data transmission and privacy-focused design principles.
                </p>
              </div>
            </div>

            {/* Feature 6 */}
            <div className="card group cursor-pointer">
              <div className="card-body text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl">⚙️</span>
                </div>
                <h3 className="text-xl font-bold mb-3 gradient-text">Easy Integration</h3>
                <p className="text-gray-600">
                  Simple API integration with existing security systems and event management platforms.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 hero-gradient">
        <div className="container-custom">
          <div className="grid md:grid-cols-4 gap-8 text-center text-white">
            <div className="animate-slide-in">
              <div className="text-4xl lg:text-5xl font-bold mb-2">99.7%</div>
              <div className="text-blue-200">Accuracy Rate</div>
            </div>
            <div className="animate-slide-in" style={{animationDelay: '0.2s'}}>
              <div className="text-4xl lg:text-5xl font-bold mb-2">24/7</div>
              <div className="text-blue-200">Monitoring</div>
            </div>
            <div className="animate-slide-in" style={{animationDelay: '0.4s'}}>
              <div className="text-4xl lg:text-5xl font-bold mb-2">&lt;2s</div>
              <div className="text-blue-200">Response Time</div>
            </div>
            <div className="animate-slide-in" style={{animationDelay: '0.6s'}}>
              <div className="text-4xl lg:text-5xl font-bold mb-2">1000+</div>
              <div className="text-blue-200">Events Protected</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white/80">
        <div className="container-custom text-center">
          <h2 className="text-4xl lg:text-5xl font-bold gradient-text mb-6">
            Ready to Secure Your Events?
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of event organizers who trust CrowdControl to keep their audiences safe.
          </p>
          {!isLoggedIn && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register" className="btn btn-primary text-lg px-8 py-4">
                <span className="mr-3">🚀</span>
                Start Free Trial
              </Link>
              <Link to="/login" className="btn btn-outline text-lg px-8 py-4">
                <span className="mr-3">📞</span>
                Contact Sales
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
