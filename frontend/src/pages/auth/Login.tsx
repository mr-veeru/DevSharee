/**
 * Login Component
 * 
 * User authentication form supporting username/email login with password.
 * Features password visibility toggle and automatic token management.
 */

import React, { useState } from 'react';
import { FaEnvelope } from 'react-icons/fa';
import { API_BASE, handleAuthSuccess, extractApiError } from '../../utils/token';
import { AuthHeader, PasswordInput, AuthInput, usePasswordToggle } from '../../utils/auth_utils';
import { ThemeToggle } from '../../components/theme/ThemeToggle';
import { useToast } from '../../components/toast/Toast';
import './Auth.css';

const Login = ({ onSwitchToSignup, onLoginSuccess }: { onSwitchToSignup: () => void, onLoginSuccess: (userData: any) => void }) => {
const [formData, setFormData] = useState({ usernameOrEmail: '', password: '' });
const [loading, setLoading] = useState(false);
const { showPassword, togglePassword } = usePasswordToggle();
const { showSuccess, showError } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Authenticate user with backend
      const loginRes = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username_or_email: formData.usernameOrEmail,
          password: formData.password
        })
      });

      // Handle API errors
      if (!loginRes.ok) {
        const errorMessage = await extractApiError(loginRes, 'Login failed');
        throw new Error(errorMessage);
      }

      // Extract tokens and handle post-authentication flow
      const { access_token, refresh_token } = await loginRes.json();
      await handleAuthSuccess(access_token, refresh_token, (userData) => {
        showSuccess(`Welcome back, ${userData.username}!`);
        onLoginSuccess(userData);
      });
    } catch (error: any) {
      showError(error?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <AuthHeader appName="DevShare" />
        <ThemeToggle />
        <div className="auth-form">
          <h1>Sign In</h1>
          <p className="auth-subtitle">Welcome back! Please enter your details to continue.</p>

          <form onSubmit={handleSubmit}>
            {/* Username/Email input field */}
            <AuthInput
              icon={FaEnvelope}
              label="Username or Email"
              placeholder="username or youremail@example.com"
              value={formData.usernameOrEmail}
              onChange={(e) => setFormData({...formData, usernameOrEmail: e.target.value})}
            />

            {/* Password input with visibility toggle */}
            <PasswordInput
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              showPassword={showPassword}
              onTogglePassword={togglePassword}
            />

            {/* Submit button with loading state */}
            <button type="submit" className="primary-btn" disabled={loading}>
              {loading ? 'Signing In...' : 'Sign In'} →
            </button>
          </form>

          {/* Navigation to signup form */}
          <div className="auth-switch">
            <span>Don't have an account? </span>
            <button onClick={onSwitchToSignup} className="switch-link">Sign Up</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;