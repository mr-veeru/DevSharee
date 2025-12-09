/**
 * Notifications Hook
 * 
 * Manages notification count state and updates.
 */

import { useState, useEffect, useCallback } from 'react';
import { authenticatedFetch, API_BASE } from '../utils/token';

// Notification count management (callback system)
let notificationRefreshCallbacks: Array<() => void> = [];

// Register callbacks for notification count updates
export const registerNotificationCallbacks = (onRefresh: () => void) => {
  notificationRefreshCallbacks.push(onRefresh);
  
  return () => {
    notificationRefreshCallbacks = notificationRefreshCallbacks.filter(cb => cb !== onRefresh);
  };
};

// Refresh notification count from backend
// (Call after mark read/delete operations or when count might have changed)
export const refreshNotificationCount = () => {
  notificationRefreshCallbacks.forEach(cb => cb());
};

export const useNotifications = (isAuthenticated: boolean) => {
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Fetch notification count from backend
  const fetchNotificationCount = useCallback(async () => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }
    try {
      const res = await authenticatedFetch(`${API_BASE}/api/notifications/unread_count`);
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(Number(data.unread || 0));
      }
    } catch {}
  }, [isAuthenticated]);

  // Set up notification callbacks
  useEffect(() => {
    if (!isAuthenticated) return;
    
    fetchNotificationCount();

    const unregister = registerNotificationCallbacks(fetchNotificationCount);

    return unregister;
  }, [isAuthenticated, fetchNotificationCount]);

  return {
    unreadCount,
    refreshNotificationCount: fetchNotificationCount
  };
};

