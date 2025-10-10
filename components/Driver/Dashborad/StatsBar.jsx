import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';


export const StatsBar = ({ stats }) => {
    return (
        <View style={styles.statsBar}>
            {stats.map((stat, index) => (
                <React.Fragment key={index}>
                    <View style={styles.statItem}>
                        <View style={[styles.statIconSm, {backgroundColor: `${stat.color}15`}]}>
                            {stat.iconLib === 'Feather' ? (
                                <Feather name={stat.icon} size={16} color={stat.color}/>
                            ) : (
                                <Ionicons name={stat.icon} size={16} color={stat.color}/>
                            )}
                        </View>

                        <Text
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            style={styles.statValueSm}
                        >
                            {stat.value}
                        </Text>

                        <Text
                            numberOfLines={1}
                            style={styles.statLabelSm}
                        >
                            {stat.label}
                        </Text>
                    </View>

                    {index < stats.length - 1 && <View style={styles.vDivider}/>}
                </React.Fragment>
            ))}
        </View>
    );
};


const styles = StyleSheet.create({
    /* Stats */
    statsBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginTop: 6,
        marginBottom: 5,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: {width: 0, height: 2},
        shadowRadius: 8,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statIconSm: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
        marginTop: 2,
    },
    statValueSm: {
        fontSize: 16,
        fontFamily: 'PoppinsBold',
        color: '#111827',
        marginBottom: 2,
        maxWidth: '90%',
        textAlign: 'center',
    },
    statLabelSm: {
        fontSize: 10,
        fontFamily: 'PoppinsRegular',
        color: '#6B7280',
        textAlign: 'center',
    },
    vDivider: {
        width: 1,
        height: 36,
        backgroundColor: '#E5E7EB',
        marginHorizontal: 4,
    },
});
