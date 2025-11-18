/**
 * Main Application Component
 * Handles authentication state management and displays login/signup pages.
 */

import React, { useState } from 'react';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import { useAuth } from './hooks/useAuth';

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const { isAuthenticated, handleLoginSuccess } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="app">
        {isLogin ? (
          <Login onSwitchToSignup={() => setIsLogin(false)} onLoginSuccess={handleLoginSuccess} />
        ) : (
          <Signup onSwitchToLogin={() => setIsLogin(true)} onSignupSuccess={handleLoginSuccess} />
        )}
      </div>
    );
  }

  // When authenticated, show a simple message (will be replaced with main app later)
  return (
    <div className="app">
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h1>Welcome! You are authenticated.</h1>
        <p>Main application will be implemented here.</p>
      </div>
    </div>
  );
}

export default App;