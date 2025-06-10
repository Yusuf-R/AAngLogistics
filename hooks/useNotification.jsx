// Notification Hooks and Integration Layer
import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState } from 'react-native';

// Main notification hook - this is what you'll use in your components
export const useNotifications = (userId) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [hasUrgent, setHasUrgent] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({});

    const wsRef = useRef(null);
    const appState = useRef(AppState.currentState);

    // Fetch notifications from your API
    const fetchNotifications = useCallback(async (options = {}) => {
        if (!userId) return;

        setIsLoading(true);
        setError(null);

        try {
            const queryParams = new URLSearchParams({
                userId,
                limit: options.limit || 50,
                offset: options.offset || 0,
                ...(options.category && { category: options.category }),
                ...(options.unreadOnly && { unreadOnly: 'true' }),
                ...(options.priority && { priority: options.priority })
            });

            const response = await fetch(`/api/notifications?${queryParams}`);
            const data = await response.json();

            if (response.ok) {
                if (options.offset > 0) {
                    // Load more - append to existing
                    setNotifications(prev => [...prev, ...data.notifications]);
                } else {
                    // Fresh load - replace all
                    setNotifications(data.notifications);
                }
                setStats(data.stats);
                setUnreadCount(data.stats.unread);
                setHasUrgent(data.stats.byPriority?.URGENT > 0 || data.stats.byPriority?.CRITICAL > 0);
            } else {
                throw new Error(data.message || 'Failed to fetch notifications');
            }
        } catch (err) {
            setError(err.message);
            console.error('Notification fetch error:', err);
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    // Mark notification as read
    const markAsRead = useCallback(async (notificationId) => {
        try {
            const response = await fetch(`/api/notifications/${notificationId}/read`, {
                method: 'PATCH',
            });

            if (response.ok) {
                setNotifications(prev =>
                    prev.map(notification =>
                        notification._id === notificationId
                            ? { ...notification, read: { status: true, readAt: new Date() } }
                            : notification
                    )
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (err) {
            console.error('Mark as read error:', err);
        }
    }, []);

    // Mark all as read
    const markAllAsRead = useCallback(async (category = null) => {
        try {
            const response = await fetch('/api/notifications/mark-all-read', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, category })
            });

            if (response.ok) {
                setNotifications(prev =>
                    prev.map(notification =>
                        (!category || notification.category === category)
                            ? { ...notification, read: { status: true, readAt: new Date() } }
                            : notification
                    )
                );

                if (!category) {
                    setUnreadCount(0);
                    setHasUrgent(false);
                } else {
                    // Recalculate counts for specific category
                    fetchNotifications({ limit: 1 }); // Just to update stats
                }
            }
        } catch (err) {
            console.error('Mark all as read error:', err);
        }
    }, [userId, fetchNotifications]);

    // Delete notification
    const deleteNotification = useCallback(async (notificationId) => {
        try {
            const response = await fetch(`/api/notifications/${notificationId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                const deletedNotification = notifications.find(n => n._id === notificationId);

                setNotifications(prev =>
                    prev.filter(notification => notification._id !== notificationId)
                );

                if (deletedNotification && !deletedNotification.read.status) {
                    setUnreadCount(prev => Math.max(0, prev - 1));
                }
            }
        } catch (err) {
            console.error('Delete notification error:', err);
        }
    }, [notifications]);

    // Setup WebSocket for real-time notifications
    const setupWebSocket = useCallback(() => {
        if (!userId || wsRef.current) return;

        try {
            wsRef.current = new WebSocket(`wss://your-api-domain/ws/notifications/${userId}`);

            wsRef.current.onopen = () => {
                console.log('Notification WebSocket connected');
            };

            wsRef.current.onmessage = (event) => {
                const newNotification = JSON.parse(event.data);

                // Add new notification to the top
                setNotifications(prev => [newNotification, ...prev]);

                // Update counts
                if (!newNotification.read.status) {
                    setUnreadCount(prev => prev + 1);
                }

                if (['URGENT', 'CRITICAL'].includes(newNotification.priority)) {
                    setHasUrgent(true);
                }

                // Trigger real-time toast notification
                if (typeof window !== 'undefined' && window.showNotificationToast) {
                    window.showNotificationToast(newNotification);
                }
            };

            wsRef.current.onerror = (error) => {
                console.error('WebSocket error:', error);
            };

            wsRef.current.onclose = () => {
                console.log('WebSocket closed, attempting to reconnect...');
                // Reconnect after 5 seconds
                setTimeout(setupWebSocket, 5000);
            };

        } catch (err) {
            console.error('WebSocket setup error:', err);
        }
    }, [userId]);

    // Handle app state changes
    const handleAppStateChange = useCallback((nextAppState) => {
        if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
            // App came to foreground, refresh notifications
            fetchNotifications();
        }
        appState.current = nextAppState;
    }, [fetchNotifications]);

    // Initial setup
    useEffect(() => {
        if (userId) {
            fetchNotifications();
            setupWebSocket();
        }

        const subscription = AppState.addEventListener('change', handleAppStateChange);

        return () => {
            subscription?.remove();
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
        };
    }, [userId, fetchNotifications, setupWebSocket, handleAppStateChange]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, []);

    return {
        notifications,
        unreadCount,
        hasUrgent,
        isLoading,
        error,
        stats,
        actions: {
            refresh: () => fetchNotifications(),
            loadMore: (offset) => fetchNotifications({ offset }),
            markAsRead,
            markAllAsRead,
            deleteNotification,
            fetchByCategory: (category) => fetchNotifications({ category }),
        }
    };
};


// Hook for notification preferences
export const useNotificationPreferences = (userId) => {
    const [preferences, setPreferences] = useState({
        push: true,
        email: true,
        sms: false,
        inApp: true,
        categories: {
            ORDER: { push: true, email: true, sms: false },
            DELIVERY: { push: true, email: false, sms: true },
            SECURITY: { push: true, email: true, sms: true },
            PAYMENT: { push: true, email: true, sms: false },
            PROMOTION: { push: false, email: false, sms: false },
        },
        quietHours: {
            enabled: true,
            start: '22:00',
            end: '08:00'
        }
    });

    const updatePreferences = useCallback(async (newPreferences) => {
        try {
            const response = await fetch(`/api/users/${userId}/notification-preferences`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newPreferences)
            });

            if (response.ok) {
                setPreferences(prev => ({ ...prev, ...newPreferences }));
            }
        } catch (err) {
            console.error('Update preferences error:', err);
        }
    }, [userId]);

    useEffect(() => {
        // Fetch current preferences
        const fetchPreferences = async () => {
            try {
                const response = await fetch(`/api/users/${userId}/notification-preferences`);
                if (response.ok) {
                    const data = await response.json();
                    setPreferences(data.preferences);
                }
            } catch (err) {
                console.error('Fetch preferences error:', err);
            }
        };

        if (userId) {
            fetchPreferences();
        }
    }, [userId]);

    return {
        preferences,
        updatePreferences
    };
};