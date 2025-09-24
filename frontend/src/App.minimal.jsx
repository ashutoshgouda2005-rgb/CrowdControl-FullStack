import React from 'react';

// MINIMAL TEST APP - Use this to verify Vite/React is working
function MinimalApp() {
  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f0f0f0',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#333' }}>🎉 CrowdControl Frontend - WORKING!</h1>
      <p>If you can see this, Vite and React are working correctly.</p>
      
      <div style={{ 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '8px',
        marginTop: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2>✅ System Status</h2>
        <ul>
          <li>✅ Vite server running</li>
          <li>✅ React rendering</li>
          <li>✅ JavaScript executing</li>
          <li>✅ CSS styles applying</li>
        </ul>
      </div>

      <div style={{ 
        backgroundColor: '#e8f5e8', 
        padding: '20px', 
        borderRadius: '8px',
        marginTop: '20px',
        border: '1px solid #4caf50'
      }}>
        <h3>🔧 Next Steps</h3>
        <p>Now that the basic app works, you can gradually re-enable components:</p>
        <ol>
          <li>Add back CSS imports</li>
          <li>Add back Router</li>
          <li>Add back AppContext</li>
          <li>Add back individual components</li>
        </ol>
      </div>

      <button 
        onClick={() => alert('Button works! JavaScript is functional.')}
        style={{
          backgroundColor: '#007bff',
          color: 'white',
          padding: '10px 20px',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          marginTop: '20px'
        }}
      >
        Test JavaScript
      </button>
    </div>
  );
}

export default MinimalApp;
