/**
 * Navigation Bar Component
 * 
 * Professional responsive navigation bar with desktop and mobile layouts.
 * Features user profile dropdown, notifications badge, and smooth transitions.
 * 
 * @param {Object} props - Component props
 * @param {Object} [props.user] - Current user data
 * @param {Function} props.onLogout - Logout handler function
 * @returns {JSX.Element} Navigation bar component
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaHome, FaPlus, FaBell, FaUser, FaSignOutAlt } from 'react-icons/fa';
import LetterAvatar from '../common/LetterAvatar';
import './Navbar.css';

type AnyIcon = React.ComponentType<{ className?: string }>;
const UserIcon = FaUser as unknown as AnyIcon;
const SignOutIcon = FaSignOutAlt as unknown as AnyIcon;

interface User {
  username: string;
  email: string;
}

interface NavbarProps {
  user?: User | null;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ user = null, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Check if navigation item is active
  const isActive = (path: string) => location.pathname === path;

  // Handle profile dropdown toggle
  const toggleProfileDropdown = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  };

  // Handle mobile menu toggle
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Handle logout
  const handleLogout = () => {
    onLogout();
    setIsProfileDropdownOpen(false);
    setIsMobileMenuOpen(false);
  };

  // Navigation items configuration
  const navItems: { id: string; label: string; icon: AnyIcon; path: string }[] = [
    { id: 'feed', label: 'Home', icon: FaHome as unknown as AnyIcon, path: '/feed' },
    { id: 'create', label: 'Create', icon: FaPlus as unknown as AnyIcon, path: '/create' },
    { id: 'notifications', label: 'Notifications', icon: FaBell as unknown as AnyIcon, path: '/notifications' }
  ];

  return (
    <>
      {/* Desktop Navbar */}
      <nav className="navbar navbar-desktop">
        <div className="navbar-container">
          {/* Logo */}
          <div className="navbar-logo" onClick={() => navigate('/feed')}>
            <span className="logo-icon">&lt;/&gt;</span>
            <span className="logo-text">DevShare</span>
          </div>

          {/* Navigation Items */}
          <div className="navbar-items">
            {navItems.map((item) => {
              const IconComponent: AnyIcon = item.icon;
              return (
                <button
                  key={item.id}
                  className={`navbar-item ${isActive(item.path) ? 'active' : ''}`}
                  onClick={() => navigate(item.path)}
                >
                  <span className="navbar-icon">
                    <IconComponent />
                  </span>
                  <span className="navbar-label">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Profile Section */}
          <div className="profile-section" ref={dropdownRef}>
            <button 
              className="profile-avatar-btn"
              onClick={toggleProfileDropdown}
            >
              <LetterAvatar 
                name={user?.username || 'User'} 
                size="medium"
                className="profile-avatar"
              />
            </button>

            {/* Profile Dropdown Menu */}
            {isProfileDropdownOpen && (
              <div className="profile-dropdown">
                <div className="profile-info">
                  <div className="profile-name">{user?.username || 'User'}</div>
                  <div className="profile-email">{user?.email || 'user@example.com'}</div>
                </div>
                
                <div className="dropdown-divider"></div>
                
                <div className="dropdown-menu">
                  <button 
                    className="dropdown-item"
                    onClick={() => {
                      navigate('/profile');
                      setIsProfileDropdownOpen(false);
                    }}
                  >
                    <UserIcon className="dropdown-icon" />
                    Profile
                  </button>
                  <button 
                    className="dropdown-item logout-item"
                    onClick={handleLogout}
                  >
                    <SignOutIcon className="dropdown-icon" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <nav className="navbar navbar-mobile">
        <div className="navbar-mobile-container">
          {navItems.map((item) => {
            const IconComponent: AnyIcon = item.icon;
            return (
              <button
                key={item.id}
                className={`navbar-mobile-item ${isActive(item.path) ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                <div className="mobile-icon-container">
                  <span className="navbar-mobile-icon"><IconComponent /></span>
                </div>
                <span className="navbar-mobile-label">{item.label}</span>
              </button>
            );
          })}
          
          {/* Mobile Profile with Dropdown */}
          <div className="mobile-profile-section" ref={mobileMenuRef}>
            <button 
              className={`navbar-mobile-item ${isActive('/profile') ? 'active' : ''}`}
              onClick={toggleMobileMenu}
            >
              <div className="mobile-icon-container">
                <LetterAvatar 
                  name={user?.username || 'User'} 
                  size="small"
                  className="mobile-profile-avatar"
                />
              </div>
              <span className="navbar-mobile-label">Profile</span>
            </button>

            {/* Mobile Profile Dropdown */}
            {isMobileMenuOpen && (
              <div className="mobile-profile-dropdown">
                <div className="profile-info">
                  <div className="profile-name">{user?.username || 'User'}</div>
                  <div className="profile-email">{user?.email || 'user@example.com'}</div>
                </div>
                
                <div className="dropdown-divider"></div>
                
                <div className="dropdown-menu">
                  <button 
                    className="dropdown-item"
                    onClick={() => {
                      navigate('/profile');
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <UserIcon className="dropdown-icon" />
                    Profile
                  </button>
                  <button 
                    className="dropdown-item logout-item"
                    onClick={handleLogout}
                  >
                    <SignOutIcon className="dropdown-icon" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
