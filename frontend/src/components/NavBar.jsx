import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { authApi } from '../lib/api'

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

  const linkClass = (path) => `px-3 py-2 rounded-md ${location.pathname === path ? 'bg-sky-100 text-sky-700' : 'text-gray-700 hover:text-sky-700'}`

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="text-xl font-semibold text-sky-600">CrowdControl</Link>
            {loggedIn && (
              <div className="flex gap-2">
                <Link className={linkClass('/uploads')} to="/uploads">Uploads</Link>
                <Link className={linkClass('/live')} to="/live">Live Stream</Link>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            {loggedIn ? (
              <>
                <span className="text-sm text-gray-600">{user?.username}</span>
                <button className="btn btn-danger h-9" onClick={logout}>Logout</button>
              </>
            ) : (
              <Link className="btn btn-primary h-9" to="/login">Login</Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
