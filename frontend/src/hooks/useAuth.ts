/**
 * Authentication Hook
 * 
 * Manages authentication state, login/logout, and user data.
 */

import { useState, useEffect, useCallback } from 'react';
import { clearAuthData, getAccessToken, getRefreshToken, authenticatedFetch, API_BASE, startPeriodicTokenRefresh, setUserIdCache } from '../utils/token';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = getAccessToken();
      const refreshToken = getRefreshToken();
      
      // If no tokens exist, user is not authenticated
      if (!token && !refreshToken) {
        setIsAuthenticated(false);
        setUser(null);
        setIsLoading(false);
        clearAuthData();
        return;
      }
      
      // Verify token is valid by making an API call
      try {
        const response = await authenticatedFetch(`${API_BASE}/api/profile/`);
        
        if (response.ok) {
          const profile = await response.json();
          const userData = { 
            username: profile.username, 
            email: profile.email 
          };
          localStorage.setItem('userData', JSON.stringify(userData));
          
          // Cache user ID to avoid redundant API calls
          if (profile.id) {
            setUserIdCache(profile.id);
          }
          
          setIsAuthenticated(true);
          setUser(userData);
        } else {
          // Token is invalid or expired (401 or 500 from expired token)
          setIsAuthenticated(false);
          setUser(null);
          clearAuthData();
        }
      } catch (error) {
        // Token validation failed (network error or expired token)
        setIsAuthenticated(false);
        setUser(null);
        clearAuthData();
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  // Handle login success
  const handleLoginSuccess = useCallback((userData: any) => {
    setIsAuthenticated(true);
    setUser(userData);
  }, []);

  // Handle logout
  const handleLogout = useCallback(async () => {
    try {
      const token = getAccessToken();
      if (token) {
        // Try to logout (add token to blocklist)
        // This may fail if account is already deleted, but that's okay
        await authenticatedFetch(`${API_BASE}/api/auth/logout`, {
          method: 'POST'
        }).catch(() => {
          // Silently ignore errors (account may already be deleted)
        });
      }
    } finally {
      // Always clear auth state and data, regardless of API call success
      setIsAuthenticated(false);
      setUser(null);
      clearAuthData();
      window.history.pushState({}, '', '/login');
    }
  }, []);

  // Start token refresh when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    const stopRefresh = startPeriodicTokenRefresh();
    return stopRefresh;
  }, [isAuthenticated]);

  return {
    isAuthenticated,
    user,
    isLoading,
    handleLoginSuccess,
    handleLogout
  };
};
