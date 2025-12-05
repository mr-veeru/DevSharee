/**
 * Main Application Component
 * Handles authentication state management and displays login/signup pages.
 */

import React, { useState } from 'react';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import { useAuth } from './hooks/useAuth';
import { ThemeToggleProvider } from './components/theme/ThemeToggle';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider, useToast } from './components/toast/Toast';
import Navbar from './components/navbar/Navbar';
import Feed from './pages/Feed/Feed';
import CreatePost from './pages/CreatePost/CreatePost';
import Profile from './pages/Profile/Profile';
import EditProfile from './pages/Profile/EditProfile';

function AppContent() {
  const [isLogin, setIsLogin] = useState(true);
  const { isAuthenticated, user, handleLoginSuccess, handleLogout } = useAuth();
  const { showSuccess } = useToast();

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

  return (
    <Router>
      <div className="app">
      <Navbar 
          user={user} 
          onLogout={async () => { await handleLogout(); showSuccess('Logged out successfully!'); }} 
          unreadCount={0} 
        />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/feed" replace />} />
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="/signup" element={<Navigate to="/" replace />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/create" element={<CreatePost />} />
            <Route path="/profile/edit" element={<EditProfile />} />
            <Route path="/profile/:userId" element={<Profile />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

function App() {
  return (
    <ThemeToggleProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </ThemeToggleProvider>
  );
}

export default App;