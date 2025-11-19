/**
 * Shared Auth React Components & Hooks
 */

import React, { useState, useCallback } from 'react';
import { FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';

export const AuthHeader = ({ appName = 'DevShare' }: { appName?: string }) => (
  <div className="auth-header">
    <div className="logo">
      <span className="logo-icon">&lt; /&gt;</span>
      <span className="logo-text">{appName}</span>
    </div>
    <p className="tagline">Connect. Share. Build.</p>
  </div>
);

export const PasswordInput = ({ 
  value, 
  onChange, 
  placeholder = "Your password", 
  label = "Password", 
  showPassword, 
  onTogglePassword
}: {
  value: string; 
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string; 
  label?: string; 
  showPassword: boolean; 
  onTogglePassword: () => void;
}) => (
  <div className="input-group">
    <div className="input-label">
      <FaLock className="input-icon" />
      <label>{label}</label>
    </div>
    <input 
      type={showPassword ? "text" : "password"} 
      placeholder={placeholder} 
      value={value} 
      onChange={onChange} 
      required 
    />
    <button 
      type="button" 
      className="password-toggle" 
      onClick={onTogglePassword} 
      aria-label={showPassword ? "Hide password" : "Show password"}
    >
      {showPassword ? <FaEyeSlash /> : <FaEye />}
    </button>
  </div>
);

export const AuthInput = ({ 
  icon: Icon, 
  label, 
  type = "text", 
  placeholder, 
  value, 
  onChange, 
  required = true 
}: {
  icon: React.ComponentType<{ className?: string }>; 
  label: string; 
  type?: string; 
  placeholder: string; 
  value: string; 
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; 
  required?: boolean;
}) => (
  <div className="input-group">
    <div className="input-label">
      <Icon className="input-icon" />
      <label>{label}</label>
    </div>
    <input 
      type={type} 
      placeholder={placeholder} 
      value={value} 
      onChange={onChange} 
      required={required} 
    />
  </div>
);

export const usePasswordToggle = () => {
  const [showPassword, setShowPassword] = useState(false);
  const togglePassword = useCallback(() => setShowPassword(prev => !prev), []);
  return { showPassword, togglePassword };
};

