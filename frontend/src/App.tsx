import React, { useState } from 'react';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';

/**
 * Main App Component
 * 
 * Root component that manages authentication state and renders
 * either Login or Signup components based on user interaction.
 * 
 * Features:
 * - State management for auth form switching
 * - Clean component composition
 * - Responsive authentication flow
 */
function App() {
  // State to toggle between login and signup forms
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="app">
      {isLogin ? (
        <Login onSwitchToSignup={() => setIsLogin(false)} />
      ) : (
        <Signup onSwitchToLogin={() => setIsLogin(true)} />
      )}
    </div>
  );
}

export default App;
