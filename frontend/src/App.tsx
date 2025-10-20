import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import Navbar from './components/navbar/Navbar';
import Feed from './pages/Feed/Feed';
import CreatePost from './pages/CreatePost/CreatePost';
import Notifications from './pages/Notifications/Notifications';
import Profile from './pages/Profile/Profile';
import { API_BASE, clearAuthData, getAccessToken, startPeriodicTokenRefresh } from './utils/auth';
import { ToastProvider, useToast } from './components/common/Toast';

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
function AppContent() {
  // Authentication state
  const [isLogin, setIsLogin] = useState(true);
  const [isAuthenticatedState, setIsAuthenticatedState] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { showSuccess } = useToast();

  // Handle user logout
  const handleLogout = useCallback(async () => {
    try {
      const token = getAccessToken();
      if (token) {
        await fetch(`${API_BASE}/api/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => {});
      }
    } finally {
      setIsAuthenticatedState(false);
      setUser(null);
      clearAuthData();
      showSuccess('Logged out successfully!');
      window.history.pushState({}, '', '/login');
    }
  }, [showSuccess]);

  // Check for existing authentication on app load and handle token refresh
  useEffect(() => {
    const checkAuth = async () => {
      const userData = localStorage.getItem('userData');
      const token = localStorage.getItem('authToken');
      const refreshToken = localStorage.getItem('refreshToken');
      
      // If no tokens or userData, user is not authenticated
      if ((!token && !refreshToken) || !userData) {
        setIsAuthenticatedState(false);
        setUser(null);
        return;
      }
      
      // If we have tokens and userData, user is authenticated
      setIsAuthenticatedState(true);
      setUser(JSON.parse(userData));
    };
    
    checkAuth();
  }, []);

  // Start periodic token refresh when user is authenticated
  useEffect(() => {
    if (!isAuthenticatedState) return;
    
    const stopRefresh = startPeriodicTokenRefresh();
    return stopRefresh;
  }, [isAuthenticatedState]);

  // Handle successful login/signup
  const handleLoginSuccess = (userData: any) => {
    setIsAuthenticatedState(true);
    setUser(userData);
    // Tokens and userData are now written by Login/Signup after real API calls
  };

  // Render authentication forms if not logged in
  if (!isAuthenticatedState) {
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
      <div className="app main-app">
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

function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

export default App;