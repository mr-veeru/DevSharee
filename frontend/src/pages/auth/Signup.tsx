/**
 * Signup Component
 * 
 * User registration form with username, email, password, and confirmation.
 * Features password visibility toggles and automatic login after successful signup.
 */

import React, { useState } from 'react';
import { FaEnvelope, FaUser, FaUserCircle } from 'react-icons/fa';
import { API_BASE, handleAuthSuccess, extractApiError } from '../../utils/token';
import { AuthHeader, PasswordInput, AuthInput, usePasswordToggle } from '../../utils/auth_utils';
import { ThemeToggle } from '../../components/theme/ThemeToggle';
import { useToast } from '../../components/toast/Toast';
import '../../components/common/common.css';
import './Auth.css';

const Signup = ({ onSwitchToLogin, onSignupSuccess }: { onSwitchToLogin: () => void, onSignupSuccess: (userData: any) => void }) => {
const [formData, setFormData] = useState({ 
  username: '', 
  fullname: '',
  email: '', 
  password: '', 
  confirmPassword: '' 
});
const [loading, setLoading] = useState(false);

// Password visibility toggles for both password fields
const { showPassword, togglePassword } = usePasswordToggle();
const { showPassword: showConfirmPassword, togglePassword: toggleConfirmPassword } = usePasswordToggle();
const { showSuccess, showError } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Step 1: Register new user account
      const registerRes = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          fullname: formData.fullname,
          email: formData.email,
          password: formData.password,
          confirm_password: formData.confirmPassword
        })
      });

      // Handle registration errors
      if (!registerRes.ok) {
        const errorMessage = await extractApiError(registerRes, 'Signup failed');
        throw new Error(errorMessage);
      }

      // Step 2: Auto-login user after successful registration
      const loginRes = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username_or_email: formData.email || formData.username,
          password: formData.password
        })
      });

      // Handle auto-login errors
      if (!loginRes.ok) {
        const errorMessage = await extractApiError(loginRes, 'Auto-login failed');
        throw new Error(errorMessage);
      }

      // Step 3: Extract tokens and handle post-authentication flow
      const { access_token, refresh_token } = await loginRes.json();
      await handleAuthSuccess(access_token, refresh_token, (userData) => {
        showSuccess(`Welcome to DevShare, ${userData.username}! Account created successfully.`);
        onSignupSuccess(userData);
      });
    } catch (err: any) {
      showError(err?.message || 'Signup failed. Please try again.');
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
          <h1>Sign Up</h1>
          <p className="auth-subtitle">Create your account to get started.</p>

          <form onSubmit={handleSubmit}>
            <AuthInput
              icon={FaUserCircle}
              label="Full Name"
              placeholder="Your Full Name"
              value={formData.fullname}
              onChange={(e) => setFormData({...formData, fullname: e.target.value})}
            />

            <AuthInput
              icon={FaUser}
              label="Username"
              placeholder="yourusername"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
            />

            <AuthInput
              icon={FaEnvelope}
              label="Email"
              type="email"
              placeholder="youremail@example.com"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />

            <PasswordInput
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              showPassword={showPassword}
              onTogglePassword={togglePassword}
            />

            <PasswordInput
              label="Confirm Password"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              showPassword={showConfirmPassword}
              onTogglePassword={toggleConfirmPassword}
            />

            {/* Submit button with loading state */}
            <button type="submit" className="btn-primary full-width" disabled={loading}>
              {loading ? 'Creating Account...' : 'Sign Up'} →
            </button>
          </form>

          {/* Navigation to login form */}
          <div className="auth-switch">
            <span>Already have an account? </span>
            <button onClick={onSwitchToLogin} className="switch-link">Sign In</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;