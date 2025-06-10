// NotificationCard.jsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Bell } from 'lucide-react-native';
import moment from 'moment';

function NotificationCard({ notification, onPress }) {const isUnread = !notification.read?.status;
    const createdAt = moment(notification.createdAt).fromNow(); // e.g., "2 hours ago"

    return (
        <TouchableOpacity
            onPress={onPress}
            style={[styles.card, isUnread && styles.unreadCard]}
        >
            <View style={styles.iconWrapper}>
                <Bell size={24} color={isUnread ? "#2563EB" : "#9CA3AF"} />
            </View>

            <View style={styles.textWrapper}>
                <Text style={styles.title}>{notification.content.title}</Text>
                <Text numberOfLines={2} style={styles.body}>
                    {notification.content.body}
                </Text>
                <Text style={styles.time}>{createdAt}</Text>
            </View>

            {isUnread && <View style={styles.dot} />}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderColor: '#F3F4F6',
    },
    unreadCard: {
        backgroundColor: '#EFF6FF',
    },
    iconWrapper: {
        marginRight: 12,
        paddingTop: 4,
    },
    textWrapper: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
        color: '#111827',
    },
    body: {
        fontSize: 14,
        color: '#6B7280',
    },
    time: {
        marginTop: 4,
        fontSize: 12,
        color: '#9CA3AF',
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#3B82F6',
        marginLeft: 8,
        marginTop: 6,
    },
});

export default NotificationCard;
