/**
 * Authentication utilities for token management and API calls
 */

const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:5000';

/**
 * Refresh access token using refresh token
 */
export const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return null;

    const response = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken })
    });

    if (response.ok) {
      const { access_token, refresh_token: newRefreshToken } = await response.json();
      localStorage.setItem('authToken', access_token);
      if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);
      return access_token;
    }
    return null;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return null;
  }
};

/**
 * Make authenticated API call with automatic token refresh
 */
export const authenticatedFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  let token = localStorage.getItem('authToken');
  
  // First attempt with current token
  let response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`
    }
  });

  // If token expired (401), try to refresh
  if (response.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      // Retry with new token
      response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${newToken}`
        }
      });
    } else {
      // Refresh failed, redirect to login
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userData');
      window.location.href = '/login';
    }
  }

  return response;
};

/**
 * Check if user is authenticated with valid token
 */
export const isAuthenticated = async (): Promise<boolean> => {
  const token = localStorage.getItem('authToken');
  if (!token) return false;

  try {
    const response = await fetch(`${API_BASE}/api/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.ok;
  } catch {
    return false;
  }
};
