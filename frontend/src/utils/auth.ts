/**
 * Authentication utilities for token management and API calls
 */

export const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:5000';

// Token management
export const storeTokens = (accessToken: string, refreshToken?: string) => {
  localStorage.setItem('authToken', accessToken);
  if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
};

export const clearAuthData = () => {
  ['authToken', 'refreshToken', 'userData'].forEach(key => localStorage.removeItem(key));
};

export const getAccessToken = (): string | null => localStorage.getItem('authToken');
export const getRefreshToken = (): string | null => localStorage.getItem('refreshToken');

// Token validation
export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp < (Math.floor(Date.now() / 1000) + 300); // Expires within 5 minutes
  } catch {
    return true; // If we can't parse, consider it expired
  }
};

// Token refresh
export const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return null;

    const response = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${refreshToken}`
      }
    });

    if (response.ok) {
      const { access_token, refresh_token: newRefreshToken } = await response.json();
      storeTokens(access_token, newRefreshToken);
      console.log('Token refreshed successfully');
      return access_token;
    }
    
    // Handle refresh failures gracefully
    if ([401, 403].includes(response.status)) {
      console.log('Refresh token expired or invalid');
    } else {
      console.log('Refresh failed with status:', response.status, 'but keeping user logged in');
    }
    return null;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return null;
  }
};

// Authenticated API calls
export const authenticatedFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  let token = getAccessToken();
  
  // Refresh token if expired
  if (token && isTokenExpired(token)) {
    token = await refreshAccessToken() || token;
  }
  
  // Make request with current token
  let response = await fetch(url, {
    ...options,
    headers: { ...options.headers, Authorization: `Bearer ${token}` }
  });

  // Retry with refreshed token if 401
  if (response.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      response = await fetch(url, {
        ...options,
        headers: { ...options.headers, Authorization: `Bearer ${newToken}` }
      });
    }
  }

  return response;
};

// Authentication status
export const isAuthenticated = async (): Promise<boolean> => {
  const token = getAccessToken();
  const refreshToken = getRefreshToken();
  return !!(token || refreshToken); // User is authenticated if they have any token
};

// Periodic token refresh
export const startPeriodicTokenRefresh = (): (() => void) => {
  const refreshInterval = setInterval(async () => {
    try {
      const token = getAccessToken();
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const timeUntilExpiry = payload.exp - Math.floor(Date.now() / 1000);
        
        // Refresh if expires within 10 minutes
        if (timeUntilExpiry < 600) {
          await refreshAccessToken();
        }
      }
    } catch (error) {
      console.error('Periodic token refresh failed:', error);
    }
  }, 5 * 60 * 1000); // Check every 5 minutes

  return () => clearInterval(refreshInterval);
};
