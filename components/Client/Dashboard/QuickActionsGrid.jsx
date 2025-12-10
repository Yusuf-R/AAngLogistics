// components/Client/Dashboard/QuickActionsGrid.jsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const QuickActionButton = ({ icon: Icon, title, onPress, color }) => (
    <TouchableOpacity onPress={onPress} style={styles.actionButton}>
        <View style={[styles.actionIcon, { backgroundColor: color }]}>
            <Icon size={24} color="white" />
        </View>
        <Text style={styles.actionTitle}>{title}</Text>
    </TouchableOpacity>
);

function QuickActionsGrid({ actions }) {
    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
                {actions.map((action, index) => (
                    <QuickActionButton
                        key={index}
                        icon={action.icon}
                        title={action.title}
                        onPress={action.onPress}
                        color={action.color}
                    />
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827',
        marginBottom: 16,
    },
    actionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 12,
    },
    actionButton: {
        width: '48%',
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
    },
    actionIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    actionTitle: {
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
        color: '#374151',
        textAlign: 'center',
    },
});

export default QuickActionsGrid;