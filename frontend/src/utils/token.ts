/**
 * Authentication & Token Management
 */

// API Configuration
const getApiBase = (): string => {
  if (process.env.REACT_APP_API_BASE) {
    return process.env.REACT_APP_API_BASE;
  }
  
  const hostname = window.location.hostname;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  
  return isLocalhost 
    ? 'http://localhost:5000' 
    : 'http://192.168.0.104:5000'; // Replace with your computer's IP for mobile access
};

export const API_BASE = getApiBase();

// Token Storage & Retrieval
export const getAccessToken = (): string | null => {
  return localStorage.getItem('authToken');
};

export const getRefreshToken = (): string | null => {
  return localStorage.getItem('refreshToken');
};

export const storeTokens = (accessToken: string, refreshToken?: string): void => {
  localStorage.setItem('authToken', accessToken);
  if (refreshToken) {
    localStorage.setItem('refreshToken', refreshToken);
  }
  // Reschedule refresh when new tokens arrive (if refresh system is active)
  if (refreshTimeoutId !== undefined) {
    scheduleTokenRefresh();
  }
};

export const clearAuthData = (): void => {
  ['authToken', 'refreshToken', 'userData'].forEach(key => {
    localStorage.removeItem(key);
  });
  clearRefreshTimeout();
  clearUserIdCache();
};

// Token Refresh System
let refreshTimeoutId: NodeJS.Timeout | null | undefined = undefined;
let isRefreshing = false;

// Schedules automatic token refresh: 10% before expiry (minimum 5 minutes)
const scheduleTokenRefresh = (): void => {
  if (refreshTimeoutId) {
    clearTimeout(refreshTimeoutId);
    refreshTimeoutId = null;
  }

  try {
    const token = getAccessToken();
    if (!token) return;

    const payload = JSON.parse(atob(token.split('.')[1]));
    const timeUntilExpiry = (payload.exp * 1000) - Date.now();
    const refreshBuffer = Math.max(timeUntilExpiry * 0.1, 5 * 60 * 1000);
    const refreshTime = timeUntilExpiry - refreshBuffer;
    
    if (timeUntilExpiry <= 5 * 60 * 1000) {
      refreshAccessToken().then(() => scheduleTokenRefresh());
    } else if (refreshTime > 0 && refreshTime < 24 * 60 * 60 * 1000) {
      refreshTimeoutId = setTimeout(async () => {
        const newToken = await refreshAccessToken();
        if (newToken) {
          scheduleTokenRefresh();
        }
      }, refreshTime);
    }
  } catch {
    // Token is invalid
  }
};

export const refreshAccessToken = async (): Promise<string | null> => {
  // Prevent concurrent refresh attempts
  if (isRefreshing) {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (!isRefreshing) {
          clearInterval(checkInterval);
          resolve(getAccessToken());
        }
      }, 100);
      
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve(null);
      }, 5000);
    });
  }

  try {
    isRefreshing = true;
    const refreshToken = getRefreshToken();
    if (!refreshToken) return null;

    // Extract JTI from current access token to blacklist it
    let accessTokenJti: string | null = null;
    try {
      const currentAccessToken = getAccessToken();
      if (currentAccessToken) {
        const payload = JSON.parse(atob(currentAccessToken.split('.')[1]));
        accessTokenJti = payload.jti || null;
      }
    } catch {
      // If token is invalid, continue without JTI
    }

    const requestBody: { access_token_jti?: string } = {};
    if (accessTokenJti) {
      requestBody.access_token_jti = accessTokenJti;
    }

    const response = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${refreshToken}`
      },
      body: JSON.stringify(requestBody)
    });

    if (response.ok) {
      const data = await response.json();
      // Handle both snake_case and camelCase token names
      const accessToken = data.access_token || data.accessToken;
      const newRefreshToken = data.refresh_token || data.refreshToken;
      
      if (!accessToken) {
        return null;
      }
      
      storeTokens(accessToken, newRefreshToken);
      return accessToken;
    }
    
    return null;
  } catch {
    return null;
  } finally {
    isRefreshing = false;
  }
};

export const startPeriodicTokenRefresh = (): (() => void) => {
  refreshTimeoutId = null;
  scheduleTokenRefresh();

  return () => {
    if (refreshTimeoutId) {
      clearTimeout(refreshTimeoutId);
    }
    refreshTimeoutId = undefined;
  };
};

export const clearRefreshTimeout = (): void => {
  if (refreshTimeoutId) {
    clearTimeout(refreshTimeoutId);
    refreshTimeoutId = null;
  }
};

// Authenticated API Calls
export const authenticatedFetch = async (
  url: string, 
  options: RequestInit = {}
): Promise<Response> => {
  let token = getAccessToken();
  
  const headers: Record<string, string> = { 
    ...(options.headers as Record<string, string> || {}) 
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    let response = await fetch(url, {
      ...options,
      headers
    });

    // If 401, refresh token and retry
    if (response.status === 401 && token) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        headers['Authorization'] = `Bearer ${newToken}`;
        response = await fetch(url, {
          ...options,
          headers
        });
      }
    }

    return response;
  } catch (error: any) {
    throw new Error(error?.message || 'Failed to fetch. Please check your connection.');
  }
};

export const isAuthenticated = async (): Promise<boolean> => {
  return !!(getAccessToken() || getRefreshToken());
};

// Authentication Flow Helpers
export const handleAuthSuccess = async (
  accessToken: string,
  refreshToken: string,
  onSuccess: (userData: any) => void
): Promise<void> => {
  try {
    storeTokens(accessToken, refreshToken);

    const profileRes = await authenticatedFetch(`${API_BASE}/api/profile/`);
    if (!profileRes.ok) {
      throw new Error('Failed to fetch profile');
    }

    const profile = await profileRes.json();
    const userData = { 
      username: profile.username, 
      email: profile.email 
    };
    localStorage.setItem('userData', JSON.stringify(userData));
    
    // Cache user ID immediately after login
    if (profile.id) {
      setUserIdCache(profile.id);
    }

    onSuccess(userData);
  } catch (error: any) {
    console.error(error?.message || 'Authentication failed');
    throw error;
  }
};

export const extractApiError = async (
  response: Response, 
  defaultMessage: string
): Promise<string> => {
  try {
    const err = await response.json().catch(() => ({}));
    return err?.message || defaultMessage;
  } catch {
    return defaultMessage;
  }
};

// Cache for user ID to avoid redundant API calls
let userIdCache: { id: string | null; timestamp: number } | null = null;
const USER_ID_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getCurrentUserId = async (): Promise<string | null> => {
  // Check cache first
  if (userIdCache && (Date.now() - userIdCache.timestamp) < USER_ID_CACHE_DURATION) {
    return userIdCache.id;
  }

  try {
    const response = await authenticatedFetch(`${API_BASE}/api/profile/`);
    if (response.ok) {
      const userData = await response.json();
      const userId = userData.id || null;
      // Update cache
      userIdCache = { id: userId, timestamp: Date.now() };
      return userId;
    }
  } catch (error) {
    // Silently fail - user ID is optional
  }
  
  // Return cached value even if expired, or null
  return userIdCache?.id || null;
};

export const setUserIdCache = (userId: string | null): void => {
  userIdCache = { id: userId, timestamp: Date.now() };
};

export const clearUserIdCache = (): void => {
  userIdCache = null;
};

