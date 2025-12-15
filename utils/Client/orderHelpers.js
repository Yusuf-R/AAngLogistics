export const getShipmentProgress = (status) => {
    const progressMap = {
        'submitted': 10,
        'admin_review': 20,
        'admin_approved': 30,
        'pending': 40,
        'broadcast': 45,
        'assigned': 50,
        'en_route_pickup': 60,
        'arrived_pickup': 70,
        'picked_up': 75,
        'en_route_dropoff': 85,
        'arrived_dropoff': 95,
    };
    return progressMap[status] || 0;
};

export const getStatusDisplay = (status) => {
    const statusMap = {
        'submitted': 'Order Submitted',
        'admin_review': 'Under Review',
        'admin_approved': 'Approved',
        'pending': 'Finding Driver',
        'broadcast': 'Broadcasting',
        'assigned': 'Driver Assigned',
        'en_route_pickup': 'En Route to Pickup',
        'arrived_pickup': 'At Pickup Location',
        'picked_up': 'Package Picked Up',
        'en_route_dropoff': 'En Route to Delivery',
        'arrived_dropoff': 'At Delivery Location',
    };
    return statusMap[status] || status;
};

export const formatOrderDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
};

export const getStatusIcon = (status) => {
    const iconMap = {
        'delivered': '✅',
        'failed': '❌',
        'cancelled': '🚫',
        'returned': '↩️',
        'document': '📄',
        'parcel': '📦',
        'default': '📦'
    };
    return iconMap[status] || iconMap.default;
};

export const getStatusColor = (status) => {
    const colorMap = {
        'delivered': '#10B981',
        'failed': '#EF4444',
        'cancelled': '#F59E0B',
        'returned': '#8B5CF6',
        'default': '#6B7280'
    };
    return colorMap[status] || colorMap.default;
};