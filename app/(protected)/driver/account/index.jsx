import React, {useEffect, useState} from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    Switch,
    ScrollView,
    SafeAreaView,
    StatusBar,
    Modal,
    Pressable, ActivityIndicator
} from 'react-native';
import { Ionicons, Feather, FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import {router} from "expo-router";
import SecureStorage from "../../../../lib/SecureStorage";
import SessionManager from "../../../../lib/SessionManager";
import { toast } from 'sonner-native';

function DriverProfileScreen () {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [logoutModalVisible, setLogoutModalVisible] = useState(false);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const toggleSwitch = () => {
        setIsDarkMode(previousState => !previousState);
    };

    const handleLogout = async () => {
        try {
            setIsLoggingOut(true);
            setLogoutModalVisible(false);
            await new Promise(resolve => setTimeout(resolve, 500));
            await SessionManager.logout();
        } catch (error) {
            console.log('[Logout Error]:', error);
            setIsLoggingOut(false);
            toast.error('Logout failed. Please try again.');
            setLogoutModalVisible(true);
        }
    };

    const renderMenuItem = ({ icon, iconType, title, value, hasChevron, color, isSwitch, onPress }) => {
        const renderIcon = () => {
            switch (iconType) {
                case 'Ionicons':
                    return <Ionicons name={icon} size={24} color={color || '#555'} />;
                case 'Feather':
                    return <Feather name={icon} size={24} color={color || '#555'} />;
                case 'FontAwesome':
                    return <FontAwesome name={icon} size={24} color={color || '#555'} />;
                case 'MaterialIcons':
                    return <MaterialIcons name={icon} size={24} color={color || '#555'} />;
                default:
                    return <Ionicons name={icon} size={24} color={color || '#555'} />;
            }
        };

        return (
            <TouchableOpacity style={styles.menuItem} onPress={onPress}>
                <View style={styles.menuIconContainer}>
                    {renderIcon()}
                </View>
                <View style={styles.menuTextContainer}>
                    <Text style={styles.menuItemText}>{title}</Text>
                </View>
                <View style={styles.menuRightContainer}>
                    {value && <Text style={styles.menuValueText}>{value}</Text>}
                    {isSwitch && (
                        <Switch
                            trackColor={{ false: "#e0e0e0", true: "#00c6a7" }}
                            thumbColor={isDarkMode ? "#ffffff" : "#ffffff"}
                            ios_backgroundColor="#e0e0e0"
                            onValueChange={toggleSwitch}
                            value={isDarkMode}
                        />
                    )}
                    {hasChevron && <Ionicons name="chevron-forward" size={20} color="#999" />}
                </View>
            </TouchableOpacity>
        );
    };


    // Fetch user data on component mount
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const storedUser = await SecureStorage.getUserData();
                setUserData(storedUser);
            } catch (error) {
                console.error('Failed to fetch user data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, []);

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <ActivityIndicator size="large" color="#60a5fa" />
            </SafeAreaView>
        );
    }

    if (!userData) {
        return (
            <SafeAreaView style={styles.container}>
                <Text>Failed to load profile data</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerContent}>
                    <Image
                        source={require('../../../../assets/images/AAngLogo.png')}
                        style={styles.logoText}
                    />
                    <Text style={styles.headerTitle}>Account</Text>
                </View>
                <TouchableOpacity style={styles.moreButton}>
                    <Feather name="more-horizontal" size={24} color="#333" />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView}>
                {/* Profile Info */}
                <View style={styles.profileSection}>
                    <View style={styles.profileImageContainer}>
                        {userData?.avatar ? (
                            <Image
                                source={{ uri: userData.avatar }}
                                style={styles.profileImage}
                            />
                        ) : (
                            <Image
                                source={require('../../../../assets/images/avatar-1.jpg')}
                                style={styles.profileImage}
                            />
                        )}
                        <TouchableOpacity style={styles.editImageButton}>
                            <Feather name="edit-2" size={18} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    {userData?.fullName ? (
                        <Text style={styles.profileName}>
                            Hi, {userData.fullName.split(' ')[0]} {/* Shows first name only */}
                        </Text>
                    ) : (
                        <Text style={styles.profileName}>Welcome to AAngLogistics</Text>
                    )}

                    {userData?.email && (
                        <Text style={styles.profileEmail}>{userData.email}</Text>
                    )}
                </View>

                <View style={styles.divider} />

                {/* Menu Items */}
                <View style={styles.menuSection}>
                    {renderMenuItem({
                        icon: 'person-outline',
                        iconType: 'Ionicons',
                        title: 'Edit Profile',
                        hasChevron: true,
                    })}

                    {renderMenuItem({
                        icon: 'notifications-outline',
                        iconType: 'Ionicons',
                        title: 'Notification',
                        hasChevron: true
                    })}

                    {renderMenuItem({
                        icon: 'wallet-outline',
                        iconType: 'Ionicons',
                        title: 'Payment',
                        hasChevron: true
                    })}

                    {renderMenuItem({
                        icon: 'shield-outline',
                        iconType: 'Ionicons',
                        title: 'Security',
                        hasChevron: true
                    })}


                    {renderMenuItem({
                        icon: 'lock-closed-outline',
                        iconType: 'Ionicons',
                        title: 'Privacy Policy',
                        hasChevron: true
                    })}

                    {renderMenuItem({
                        icon: 'people-outline',
                        iconType: 'Ionicons',
                        title: 'Invite Friends',
                        hasChevron: true
                    })}

                    {renderMenuItem({
                        icon: 'log-out-outline',
                        iconType: 'Ionicons',
                        title: 'Logout',
                        color: '#FF0F00',
                        onPress: () => setLogoutModalVisible(true)
                    })}
                </View>
            </ScrollView>

            {isLoggingOut && (
                <View style={styles.logoutOverlay}>
                    <View style={styles.logoutCard}>
                        <ActivityIndicator size="large" color="#60a5fa" />
                        <Text style={styles.logoutText}>Logging you out...</Text>
                    </View>
                </View>
            )}

            {/* Logout Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={logoutModalVisible}
                onRequestClose={() => setLogoutModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalView}>
                        <View style={styles.modalIndicator} />

                        <Text style={styles.logoutTitle}>Logout</Text>

                        <Text style={styles.logoutQuestion}>
                            Are you sure you want to log out?
                        </Text>

                        <View style={styles.buttonContainer}>
                            <Pressable
                                style={[styles.button, styles.cancelButton]}
                                onPress={() => setLogoutModalVisible(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </Pressable>

                            <Pressable
                                style={[styles.button, styles.logoutButton]}
                                onPress={handleLogout}
                            >
                                <Text style={styles.logoutButtonText}>Yes, Logout</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        overflow: 'hidden',
        marginBottom: 25,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logo: {
        width: 30,
        height: 30,
        borderRadius: 20,
        backgroundColor: '#60a5fa',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    logoText: {
        width: 55,
        height: 55,
        borderRadius: 50,
        marginRight: 10,
    },
    headerTitle: {
        fontSize: 20,
        color: '#333',
        fontFamily: 'PoppinsBold'
    },
    moreButton: {
        width: 35,
        height: 35,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#eee',
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollView: {
        flex: 1,
    },
    profileSection: {
        alignItems: 'center',
        paddingVertical: 5,
    },
    profileImageContainer: {
        position: 'relative',
        marginBottom: 5,
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 80,
    },
    editImageButton: {
        position: 'absolute',
        bottom: -3,
        right: -3,
        backgroundColor: '#60a5fa',
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: '#fff',
    },
    profileName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    profileEmail: {
        fontSize: 14,
        color: '#777',
    },
    divider: {
        height: 1,
        backgroundColor: '#eee',
        marginVertical: 5,
        marginHorizontal: 20,
    },
    menuSection: {
        paddingHorizontal: 20,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
    },
    menuIconContainer: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
        marginRight: 15,
    },
    menuTextContainer: {
        flex: 1,
    },
    menuItemText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        fontFamily: 'PoppinsBlack',
    },
    menuRightContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuValueText: {
        marginRight: 10,
        fontSize: 14,
        color: '#777',
    },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalView: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        paddingBottom: 30,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: -2
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalIndicator: {
        width: 40,
        height: 5,
        backgroundColor: '#e0e0e0',
        borderRadius: 3,
        marginBottom: 20,
    },
    logoutTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ff0f00',
        marginBottom: 15,
    },
    logoutQuestion: {
        fontSize: 16,
        color: '#555',
        textAlign: 'center',
        marginBottom: 30,
    },
    buttonContainer: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
    },
    button: {
        borderRadius: 100,
        padding: 15,
        width: '48%',
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#f0f9f7',
    },
    logoutButton: {
        backgroundColor: '#ff0f00',
    },
    cancelButtonText: {
        color: '#60a5fa',
        fontWeight: 'bold',
        fontSize: 16,
    },
    logoutButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    logoutOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
    },
    logoutCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 30,
        alignItems: 'center',
        minWidth: 200,
    },
    logoutText: {
        marginTop: 15,
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
});

export default DriverProfileScreen;