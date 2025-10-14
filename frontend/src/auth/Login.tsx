import React, { useState } from 'react';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import './Auth.css';

/**
 * Login Component
 * 
 * Handles user authentication with username/email and password.
 * Features password visibility toggle and form validation.
 * Supports both username and email login as per backend API.
 * 
 * @param {Object} props - Component props
 * @param {Function} props.onSwitchToSignup - Callback to switch to signup form
 * @param {Function} props.onLoginSuccess - Callback when login succeeds
 */
const Login = ({ onSwitchToSignup, onLoginSuccess }: { onSwitchToSignup: () => void, onLoginSuccess: (userData: any) => void }) => {
  const [formData, setFormData] = useState({ usernameOrEmail: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  /**
   * Handle form submission for user login
   * @param {Event} e - Form submit event
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Basic validation
      if (!formData.usernameOrEmail || !formData.password) {
        alert('Please fill in all fields');
        return;
      }

      // For demo purposes, accept any non-empty credentials
      // In a real app, you would make an API call here
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create user data from login form
      const userData = {
        username: formData.usernameOrEmail,
        email: formData.usernameOrEmail.includes('@') ? formData.usernameOrEmail : `${formData.usernameOrEmail}@example.com`
      };
      
      onLoginSuccess(userData);
    } catch (error) {
      alert('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="logo">
            <span className="logo-icon">&lt; /&gt;</span>
            <span className="logo-text">DevSharee</span>
          </div>
          <p className="tagline">Connect. Share. Build.</p>
        </div>

        <div className="auth-form">
          <h1>Sign In</h1>
          <p className="auth-subtitle">Welcome back! Please enter your details to continue.</p>

          <form onSubmit={handleSubmit}>
            {/* Username/Email Input Field */}
            <div className="input-group">
              <div className="input-label">
                <FaEnvelope className="input-icon" />
                <label>Username or Email</label>
              </div>
              <input
                type="text"
                placeholder="username or youremail@example.com"
                value={formData.usernameOrEmail}
                onChange={(e) => setFormData({...formData, usernameOrEmail: e.target.value})}
                required
              />
            </div>

            {/* Password Input Field with Visibility Toggle */}
            <div className="input-group">
              <div className="input-label">
                <FaLock className="input-icon" />
                <label>Password</label>
              </div>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Your password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
              />
              <button 
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            {/* Submit Button */}
            <button type="submit" className="primary-btn" disabled={loading}>
              {loading ? 'Signing In...' : 'Sign In'} →
            </button>
          </form>

          {/* Switch to Signup */}
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