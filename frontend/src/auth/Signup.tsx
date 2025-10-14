import React, { useState } from 'react';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaUser } from 'react-icons/fa';
import './Auth.css';

/**
 * Signup Component
 * 
 * Handles user registration with username, email, password, and confirm password.
 * Features password visibility toggles and password matching validation.
 * 
 * @param {Object} props - Component props
 * @param {Function} props.onSwitchToLogin - Callback to switch to login form
 * @param {Function} props.onSignupSuccess - Callback when signup succeeds
 */
const Signup = ({ onSwitchToLogin, onSignupSuccess }: { onSwitchToLogin: () => void, onSignupSuccess: (userData: any) => void }) => {
  const [formData, setFormData] = useState({ 
    username: '', 
    email: '', 
    password: '', 
    confirmPassword: '' 
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  /**
   * Handle form submission for user registration
   * @param {Event} e - Form submit event
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Basic validation
      if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
        alert('Please fill in all fields');
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        alert('Passwords do not match');
        return;
      }

      if (formData.password.length < 6) {
        alert('Password must be at least 6 characters long');
        return;
      }

      // Simulate API call - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create user data from signup form
      const userData = {
        username: formData.username,
        email: formData.email
      };
      
      onSignupSuccess(userData);
    } catch (err) {
      alert('Signup failed. Please try again.');
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
          <h1>Sign Up</h1>
          <p className="auth-subtitle">Create your account to get started.</p>

          <form onSubmit={handleSubmit}>
            {/* Username Input Field */}
            <div className="input-group">
              <div className="input-label">
                <FaUser className="input-icon" />
                <label>Username</label>
              </div>
              <input
                type="text"
                placeholder="yourusername"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                required
              />
            </div>

            {/* Email Input Field */}
            <div className="input-group">
              <div className="input-label">
                <FaEnvelope className="input-icon" />
                <label>Email</label>
              </div>
              <input
                type="email"
                placeholder="youremail@example.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
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

            {/* Confirm Password Input Field with Visibility Toggle */}
            <div className="input-group">
              <div className="input-label">
                <FaLock className="input-icon" />
                <label>Confirm Password</label>
              </div>
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                required
              />
              <button 
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            {/* Submit Button */}
            <button type="submit" className="primary-btn" disabled={loading}>
              {loading ? 'Creating Account...' : 'Sign Up'} →
            </button>
          </form>

          {/* Switch to Login */}
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