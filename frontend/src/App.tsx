import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './auth/Login';
import Signup from './auth/Signup';
import Navbar from './components/navbar/Navbar';
import Feed from './pages/Feed/Feed';
import CreatePost from './pages/CreatePost/CreatePost';
import Notifications from './pages/Notifications/Notifications';
import Profile from './pages/Profile/Profile';

/**
 * Main App Component
 * 
 * Manages authentication state and routing for the DevShare application.
 * Renders either authentication forms or the main app with navigation.
 * 
 * Features:
 * - Authentication state management
 * - Protected routing
 * - Responsive navigation
 * - User session persistence
 */
function App() {
  // Authentication state
  const [isLogin, setIsLogin] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Check for existing authentication on app load
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    if (token && userData) {
      setIsAuthenticated(true);
      setUser(JSON.parse(userData));
    }
  }, []);

  // Handle successful login/signup
  const handleLoginSuccess = (userData: any) => {
    setIsAuthenticated(true);
    setUser(userData);
    localStorage.setItem('authToken', 'dummy-token');
    localStorage.setItem('userData', JSON.stringify(userData));
  };

  // Handle user logout
  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    // On logout, route back to login
    window.history.pushState({}, '', '/login');
  };

  // Render authentication forms if not logged in
  if (!isAuthenticated) {
    return (
      <div className="app">
        {isLogin ? (
          <Login 
            onSwitchToSignup={() => setIsLogin(false)} 
            onLoginSuccess={handleLoginSuccess}
          />
        ) : (
          <Signup 
            onSwitchToLogin={() => setIsLogin(true)} 
            onSignupSuccess={handleLoginSuccess}
          />
        )}
      </div>
    );
  }

  // Render main application with navigation and routing
  return (
    <Router>
      <div className="app">
        <Navbar user={user} onLogout={handleLogout} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/feed" replace />} />
            {/* unauthenticated fallback routes */}
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="/signup" element={<Navigate to="/" replace />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/create" element={<CreatePost />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/profile" element={<Profile user={user} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;