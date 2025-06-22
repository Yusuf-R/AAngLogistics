// Complete Notification System for React Native
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Image
} from 'react-native';

import {
    Bell,
    BellRing,
    BadgeCheck
} from 'lucide-react-native';
import { router } from 'expo-router';


function Header ({ userData, notifications = [],  style = {} }) {
    const firstName = userData?.fullName?.split(' ')[0] || 'User';

    // Calculate notification stats
    const unreadCount = notifications.filter(n => !n.read?.status).length;
    // Determine greeting
    const currentHour = new Date().getHours();
    const greeting =
        currentHour < 12
            ? 'Good Morning ☁️'
            : currentHour < 17
                ? 'Good Afternoon ☀️'
                : 'Good Evening 🌙';

    return (
        <>
            <View style={[styles.header, style]}>
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
                        <View style={styles.greetingSection}>
                            <View style={styles.nameRow}>
                                <Text style={styles.name}>{firstName}</Text>
                                {userData?.isFullyVerified ? (
                                    <>
                                        <View className="bg-blue-700 rounded-full ">
                                            <BadgeCheck size={18} color="#FFF"/>
                                        </View>
                                    </>
                                ) : (
                                    <>
                                        <View className="bg-gray-300 rounded-full">
                                            <BadgeCheck size={18} color="#FFF"/>
                                        </View>
                                    </>
                                )}
                            </View>
                            <Text style={styles.greeting}>{greeting}</Text>
                        </View>
                    </View>
                </View>
            </View>
        </>
    );
};

const styles = StyleSheet.create({
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
        width: 55,
        height: 55,
        borderRadius: 80,
        marginRight: 10,
    },
    profilePlaceholder: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        backgroundColor: '#10B981',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    profileInitial: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    greetingSection: {
        flex: 1,
    },
    greeting: {
        fontSize: 14,
        color: '#6B7280',
        fontFamily: 'PoppinsRegular',
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    name: {
        fontSize: 18,
        fontFamily: 'PoppinsRegular',
        color: '#111827',
        marginRight: 5
    },
    verifiedIcon: {
        marginLeft: 4,
    },
    rightSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    // Bell Component Styles
    bellContainer: {
        position: 'relative',
    },
    bellWrapper: {
        padding: 8,
    },
    badge: {
        position: 'absolute',
        top: 2,
        right: 2,
        backgroundColor: '#ef4444',
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        borderWidth: 2,
        borderColor: '#ffffff',
    },
    urgentBadge: {
        backgroundColor: '#dc2626',
    },
    badgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
});


export default Header;

