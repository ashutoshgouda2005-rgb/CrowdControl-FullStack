import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Uploads from './pages/Uploads'
import LiveStream from './pages/LiveStream'
import Test from './pages/Test'
import NavBar from './components/NavBar'
import DeviceInfo from './components/DeviceInfo'

function PrivateRoute({ children }) {
  // Only show page if user is logged in, otherwise redirect to login
  const token = localStorage.getItem('access')
  return token ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <div className="min-h-screen">
      <NavBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/test" element={<Test />} />
        <Route path="/login" element={
          <div className="container-custom py-8">
            <Login />
          </div>
        } />
        <Route path="/register" element={
          <div className="container-custom py-8">
            <Register />
          </div>
        } />
        <Route path="/uploads" element={
          <PrivateRoute>
            <div className="container-custom py-8">
              <Uploads />
            </div>
          </PrivateRoute>
        } />
        <Route path="/live" element={
          <PrivateRoute>
            <div className="container-custom py-8">
              <LiveStream />
            </div>
          </PrivateRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      
      {/* Shows connection status in bottom-right corner */}
      <DeviceInfo />
    </div>
  )
}
