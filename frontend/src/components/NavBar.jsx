import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { authApi } from '../utils/api'

export default function NavBar() {
  const location = useLocation()
  const navigate = useNavigate()
  const user = (() => { 
    try { 
      const userData = localStorage.getItem('user')
      return userData ? JSON.parse(userData) : null
    } catch (error) { 
      console.warn('Failed to parse user data from localStorage:', error)
      return null 
    } 
  })()
  const loggedIn = !!localStorage.getItem('access')

  const logout = () => {
    authApi.logout()
    navigate('/login')
  }

  const linkClass = (path) => `nav-link ${location.pathname === path ? 'nav-link-active' : 'text-gray-700 hover:text-blue-600'}`

  return (
    <nav className="nav-glass sticky top-0 z-50">
      <div className="container-custom">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                <span className="text-white font-bold text-lg">CC</span>
              </div>
              <span className="text-2xl font-bold gradient-text">CrowdControl</span>
            </Link>
            {loggedIn && (
              <div className="flex gap-1">
                <Link className={linkClass('/uploads')} to="/uploads">
                  Uploads
                </Link>
                <Link className={linkClass('/live')} to="/live">
                  Live Stream
                </Link>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            {loggedIn ? (
              <>
                <div className="flex items-center gap-3 px-4 py-2 bg-white/60 rounded-xl backdrop-blur-sm">
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">
                      {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-700">{user?.username}</span>
                  <div className="status-online">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full mr-1"></div>
                    Online
                  </div>
                </div>
                <button className="btn btn-danger" onClick={logout}>
                  Logout
                </button>
              </>
            ) : (
              <div className="flex gap-3">
                <Link className="btn btn-outline" to="/register">
                  Sign Up
                </Link>
                <Link className="btn btn-primary" to="/login">
                  Login
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
