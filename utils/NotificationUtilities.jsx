// Notification utility functions
import { Alert } from 'react-native';

// Function to create a new notification object
export const createNotification = ({
                                       title,
                                       message,
                                       category = 'SYSTEM',
                                       priority = 'NORMAL',
                                       actionData = null
                                   }) => {
    return {
        _id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        title,
        message,
        category,
        priority,
        read: { status: false },
        createdAt: new Date(),
        actionData // Additional data for specific actions
    };
};

// Function to add a new notification to existing notifications
export const addNotification = (currentNotifications, newNotification, maxNotifications = 50) => {
    const updatedNotifications = [newNotification, ...currentNotifications];

    // Keep only the most recent notifications to prevent memory issues
    return updatedNotifications.slice(0, maxNotifications);
};

// Pre-built notification templates for common actions
export const NotificationTemplates = {
    ORDER_CREATED: (orderId) => createNotification({
        title: 'Order Created',
        message: `Your shipping order #${orderId} has been created successfully.`,
        category: 'ORDER',
        priority: 'NORMAL',
        actionData: { orderId, type: 'ORDER_CREATED' }
    }),

    PAYMENT_SUCCESS: (amount) => createNotification({
        title: 'Payment Successful',
        message: `Your payment of $${amount} has been processed successfully.`,
        category: 'PAYMENT',
        priority: 'HIGH',
        actionData: { amount, type: 'PAYMENT_SUCCESS' }
    }),

    DELIVERY_UPDATE: (status, orderId) => createNotification({
        title: 'Delivery Update',
        message: `Your order #${orderId} is ${status}.`,
        category: 'DELIVERY',
        priority: status === 'out for delivery' ? 'URGENT' : 'NORMAL',
        actionData: { status, orderId, type: 'DELIVERY_UPDATE' }
    }),

    WALLET_TOPUP: (amount) => createNotification({
        title: 'Wallet Top-up Successful',
        message: `$${amount} has been added to your wallet successfully.`,
        category: 'PAYMENT',
        priority: 'NORMAL',
        actionData: { amount, type: 'WALLET_TOPUP' }
    }),

    SECURITY_ALERT: (device, location) => createNotification({
        title: 'Security Alert',
        message: `New login detected from ${device} in ${location}.`,
        category: 'SECURITY',
        priority: 'CRITICAL',
        actionData: { device, location, type: 'SECURITY_ALERT' }
    }),

    PROFILE_UPDATE: () => createNotification({
        title: 'Profile Updated',
        message: 'Your profile information has been updated successfully.',
        category: 'IDENTITY',
        priority: 'LOW',
        actionData: { type: 'PROFILE_UPDATE' }
    })
};

// Function to simulate real-time notifications (for testing)
export const simulateRealTimeNotification = (addNotificationCallback) => {
    const notifications = [
        NotificationTemplates.ORDER_CREATED('ORD123456'),
        NotificationTemplates.PAYMENT_SUCCESS('45.00'),
        NotificationTemplates.DELIVERY_UPDATE('out for delivery', 'ORD123456'),
        NotificationTemplates.WALLET_TOPUP('100.00'),
        NotificationTemplates.SECURITY_ALERT('iPhone 12', 'Lagos, Nigeria'),
        NotificationTemplates.PROFILE_UPDATE()
    ];

    // Randomly select a notification
    const randomNotification = notifications[Math.floor(Math.random() * notifications.length)];
    addNotificationCallback(randomNotification);
};

// Function to mark notifications as read based on category or all
export const markNotificationsAsRead = (notifications, category = null) => {
    return notifications.map(notification => {
        if (category && notification.category !== category) {
            return notification;
        }
        return {
            ...notification,
            read: {
                status: true,
                readAt: new Date()
            }
        };
    });
};

// Function to delete notifications
export const deleteNotifications = (notifications, notificationIds) => {
    return notifications.filter(notification =>
        !notificationIds.includes(notification._id)
    );
};

// Function to get notification statistics
export const getNotificationStats = (notifications) => {
    const unreadCount = notifications.filter(n => !n.read?.status).length;
    const urgentCount = notifications.filter(n =>
        ['HIGH', 'URGENT', 'CRITICAL'].includes(n.priority) && !n.read?.status
    ).length;

    const categoryStats = notifications.reduce((acc, notification) => {
        const category = notification.category;
        if (!acc[category]) {
            acc[category] = { total: 0, unread: 0 };
        }
        acc[category].total += 1;
        if (!notification.read?.status) {
            acc[category].unread += 1;
        }
        return acc;
    }, {});

    return {
        total: notifications.length,
        unread: unreadCount,
        urgent: urgentCount,
        categories: categoryStats
    };
};

// Function to filter notifications
export const filterNotifications = (notifications, filters) => {
    return notifications.filter(notification => {
        // Filter by category
        if (filters.category && filters.category !== 'ALL' && notification.category !== filters.category) {
            return false;
        }

        // Filter by read status
        if (filters.readStatus === 'READ' && !notification.read?.status) {
            return false;
        }
        if (filters.readStatus === 'UNREAD' && notification.read?.status) {
            return false;
        }

        // Filter by priority
        if (filters.priority && notification.priority !== filters.priority) {
            return false;
        }

        // Filter by date range
        if (filters.dateRange) {
            const notificationDate = new Date(notification.createdAt);
            const now = new Date();
            const daysDiff = Math.floor((now - notificationDate) / (1000 * 60 * 60 * 24));

            switch (filters.dateRange) {
                case 'TODAY':
                    if (daysDiff > 0) return false;
                    break;
                case 'WEEK':
                    if (daysDiff > 7) return false;
                    break;
                case 'MONTH':
                    if (daysDiff > 30) return false;
                    break;
            }
        }
        return true;
    });
};

// Example usage in your Dashboard component:
export const exampleUsage = `
// In your Dashboard component:

const [notifications, setNotifications] = useState([]);

// Add a new notification when user performs an action
const handleTopUp = (amount) => {
    // Your top-up logic here...
    
    // Add notification
    const newNotification = NotificationTemplates.WALLET_TOPUP(amount);
    setNotifications(prev => addNotification(prev, newNotification));
};

// Add notification when order is created
const handleCreateOrder = (orderId) => {
    // Your order creation logic here...
    
    // Add notification
    const newNotification = NotificationTemplates.ORDER_CREATED(orderId);
    setNotifications(prev => addNotification(prev, newNotification));
};

// Get notification statistics
const stats = getNotificationStats(notifications);
console.log('Unread notifications:', stats.unread);
console.log('Urgent notifications:', stats.urgent);
`;

export default {
    createNotification,
    addNotification,
    NotificationTemplates,
    simulateRealTimeNotification,
    markNotificationsAsRead,
    deleteNotifications,
    getNotificationStats,
    filterNotifications
};