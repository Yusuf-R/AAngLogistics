// components/Orders/Step2TabsBar.jsx
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

export default function Step2TabsBar({
                                         active = 'pickup',                  // 'pickup' | 'dropoff' | 'summary'
                                         onChange = () => {},
                                     }) {
    const tabs = [
        { key: 'pickup', label: 'Pick-Up', color: '#ef4444' },
        { key: 'dropoff', label: 'Drop-Off', color: '#10b981' },
        { key: 'summary', label: 'Summary', color: '#111827' },
    ];

    return (
        <View style={styles.container}>
            {tabs.map(tab => {
                const isActive = active === tab.key;
                return (
                    <Pressable
                        key={tab.key}
                        onPress={() => onChange(tab.key)}
                        style={[
                            styles.tab,
                            isActive && { backgroundColor: '#f3f4f6' }
                        ]}
                    >
                        <Text style={[styles.label, isActive && { color: tab.color }]}>
                            {tab.label}
                        </Text>
                        {isActive && <View style={[styles.underline, { backgroundColor: tab.color }]} />}
                    </Pressable>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
    tab: { flex: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
    label: { fontSize: 14, fontFamily: 'PoppinsBold', color: '#111827' },
    tick: { fontSize: 12, color: '#10b981' },
    lock: { fontSize: 12, color: '#6b7280' },
    underline: { height: 3, width: '90%', borderRadius: 3, marginTop: 6 },
    underlineGhost: { height: 3, width: '90%', borderRadius: 3, marginTop: 6, backgroundColor: 'transparent' },
    row: { flexDirection: 'row', alignItems: 'center' },
});
