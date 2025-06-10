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


function Header({userData }) {
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
        fontFamily: 'PoppinsRegular',
        color: '#111827',
        marginRight: 5
    },
    rightSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
});


export default Header;

