import React from 'react';

// Minimal test component to verify React and Vite are working
function MinimalApp() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      backgroundColor: '#f3f4f6',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        padding: '2rem',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        textAlign: 'center',
        maxWidth: '500px'
      }}>
        <h1 style={{ color: '#1f2937', marginBottom: '1rem' }}>
          🎉 Vite + React Working!
        </h1>
        <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
          This minimal test page confirms that:
        </p>
        <ul style={{ 
          textAlign: 'left', 
          color: '#374151',
          listStyle: 'none',
          padding: 0
        }}>
          <li style={{ marginBottom: '0.5rem' }}>✅ Vite development server is running</li>
          <li style={{ marginBottom: '0.5rem' }}>✅ React is loading correctly</li>
          <li style={{ marginBottom: '0.5rem' }}>✅ JavaScript modules are working</li>
          <li style={{ marginBottom: '0.5rem' }}>✅ No critical import errors</li>
        </ul>
        <div style={{
          marginTop: '1.5rem',
          padding: '1rem',
          backgroundColor: '#f9fafb',
          borderRadius: '4px',
          fontSize: '0.875rem',
          color: '#6b7280'
        }}>
          <strong>Next Steps:</strong> If you see this page, the framework is working. 
          The issue is likely in your main App components or their dependencies.
        </div>
      </div>
    </div>
  );
}

export default MinimalApp;
