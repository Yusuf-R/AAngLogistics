// Complete Notification System for React Native
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Image
} from 'react-native';

import Ionicons from '@expo/vector-icons/Ionicons';
import {router} from 'expo-router';
import {CheckCircle2, Trash2} from 'lucide-react-native'


function Header({userData, stats, onMarkAllRead, onDeleteAll}) {
    const firstName = userData?.fullName?.split(' ')[0] || 'User';

    return (
        <>
            <View style={[styles.header]}>
                <View style={styles.leftSection}>
                    <View style={styles.profileSection}>
                        {userData?.avatar ? (
                            <Image
                                source={{uri: userData.avatar}}
                                style={styles.profileImage}
                            />
                        ) : (
                            <View style={styles.profilePlaceholder}>
                                <Text style={styles.profileInitial}>
                                    {firstName.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                        )}
                        <Text style={styles.name}>Notifications</Text>
                    </View>
                </View>
                <View style={styles.rightSection}>
                    <TouchableOpacity
                        style={styles.bellContainer}
                        onPress={() => router.push('/client/profile/notification-settings')}
                    >
                        <View style={styles.bellWrapper}>
                            <Ionicons name="settings" size={24} color="black"/>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
            <View style={styles.parentHeader}>
                <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{stats?.total}</Text>
                        <Text style={styles.statLabel}>Total</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={[styles.statNumber, {color: '#2563EB'}]}>
                            {stats?.unread}
                        </Text>
                        <Text style={styles.statLabel}>Unread</Text>
                    </View>
                    <TouchableOpacity onPress={onMarkAllRead} style={styles.markAllButton}>
                        <CheckCircle2 size={16} color="#2563EB"/>
                        <Text style={styles.markAllText}>Mark all read</Text>
                    </TouchableOpacity>
                    {stats?.total > 0 && (
                        <TouchableOpacity onPress={onDeleteAll} style={styles.deleteAllButton}>
                            <Trash2 size={16} color="#EF4444"/>
                            <Text style={styles.deleteAllText}>Delete all</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </>
    );
};

const styles = StyleSheet.create({
    parentHeader: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingVertical: 1,
        borderBottomColor: '#E5E7EB',
    },
    // Header Styles
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    leftSection: {
        flex: 1,
    },
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    profileImage: {
        width: 35,
        height: 35,
        borderRadius: 80,
        marginRight: 20,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    name: {
        fontSize: 18,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827',
        marginRight: 5
    },
    rightSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statItem: {
        marginRight: 20,
    },
    statNumber: {
        fontSize: 18,
        color: '#111827',
        fontFamily: 'PoppinsSemiBold',
    },
    statLabel: {
        fontSize: 12,
        color: '#6B7280',
        fontFamily: 'PoppinsRegular',
    },
    markAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 'auto',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: '#EFF6FF',
    },
    markAllText: {
        fontSize: 14,
        color: '#2563EB',
        marginLeft: 4,
        fontFamily: 'PoppinsRegular',
    },
    deleteAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 10,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: '#FEE2E2',
    },
    deleteAllText: {
        fontSize: 14,
        color: '#EF4444',
        marginLeft: 4,
        fontFamily: 'PoppinsRegular',
    },
    deleteAll: {
        fontSize: 14,
        color: '#EF4444',
        marginLeft: 4,
        fontFamily: 'PoppinsRegular',
    }
});


export default Header;

