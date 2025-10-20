/**
 * Authentication utilities for token management and API calls
 */

export const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:5000';

/**
 * Store authentication tokens
 */
export const storeTokens = (accessToken: string, refreshToken?: string) => {
  localStorage.setItem('authToken', accessToken);
  if (refreshToken) {
    localStorage.setItem('refreshToken', refreshToken);
  }
};

/**
 * Clear all authentication data
 */
export const clearAuthData = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('userData');
};

/**
 * Get stored access token
 */
export const getAccessToken = (): string | null => {
  return localStorage.getItem('authToken');
};

/**
 * Get stored refresh token
 */
export const getRefreshToken = (): string | null => {
  return localStorage.getItem('refreshToken');
};

/**
 * Refresh access token using refresh token
 */
export const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return null;

    const response = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken })
    });

    if (response.ok) {
      const { access_token, refresh_token: newRefreshToken } = await response.json();
      storeTokens(access_token, newRefreshToken);
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
  let token = getAccessToken();
  
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
      clearAuthData();
      window.location.href = '/login';
    }
  }

  return response;
};

/**
 * Check if user is authenticated with valid token
 */
export const isAuthenticated = async (): Promise<boolean> => {
  const token = getAccessToken();
  if (!token) return false;

  try {
    // Use authenticatedFetch to handle token refresh automatically
    const response = await authenticatedFetch(`${API_BASE}/api/profile`);
    return response.ok;
  } catch {
    return false;
  }
};
