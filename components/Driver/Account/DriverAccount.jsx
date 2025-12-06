import React, { useState} from 'react';
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
    Pressable,
    ActivityIndicator,
    Dimensions,
    Platform,
} from 'react-native';
import { Ionicons, Feather, FontAwesome, MaterialIcons } from '@expo/vector-icons';
import SessionManager from "../../../lib/SessionManager";
import { toast } from 'sonner-native';
import { ROUTES } from "../../../utils/Driver/Constants";
import {router} from "expo-router";


function DriverAccount ({ userData }) {
    const [logoutModalVisible, setLogoutModalVisible] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [showOptions, setShowOptions] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);

    const goToProfile = () => {
        router.push(ROUTES.PROFILE);
    }

    const goToDataVerification = () => {
        router.push(ROUTES.VERIFICATION);
    }

    const goToSupport = () => {
        router.push(ROUTES.SUPPORT);
    }

    const goToPolicy = () => {
        router.push(ROUTES.POLICY);
    }

    const goToPayment = () => {
        router.push(ROUTES.PAYMENT);
    }

    const goToSecurity = () => {
        router.push(ROUTES.SECURITY);
    }

    const goToLocation = () => {
        router.push(ROUTES.LOCATION);
    }

    const goToAnalytics = () => {
        router.push(ROUTES.ANALYTICS);
    }

    const goToUtility = () => {
        router.push(ROUTES.UTILITY);
    }

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

    // DROPDOWN FUNCTIONS - ADDED
    const closeDropdown = () => setShowOptions(false);

    const toggleDarkMode = () => {
        setIsDarkMode(!isDarkMode);
        toast.info('Theme switching coming soon!');
        setShowOptions(false);
    };

    const openSupportChat = () => {
        router.push('/driver/account/support/chat');
        setShowOptions(false);
    };

    const viewTCS = () => {
        router.push('/driver/tcs');
        setShowOptions(false);
    };

    const shareApp = () => {
        toast.info('Share feature coming soon!');
        setShowOptions(false);
    };

    const quickOptions = [
        {
            icon: 'message-circle',
            iconType: 'Feather',
            label: 'Support Chat',
            onPress: openSupportChat,
            color: '#3B82F6'
        },
        {
            icon: isDarkMode ? 'sun' : 'moon',
            iconType: 'Feather',
            label: isDarkMode ? 'Light Mode' : 'Dark Mode',
            onPress: toggleDarkMode,
            color: '#F59E0B'
        },
        {
            icon: 'file-text',
            iconType: 'Feather',
            label: 'Terms & Conditions',
            onPress: viewTCS,
            color: '#10B981'
        },
        {
            icon: 'share-2',
            iconType: 'Feather',
            label: 'Share App',
            onPress: shareApp,
            color: '#8B5CF6'
        }
    ];

    // DROPDOWN ICON RENDERER - ADDED
    const renderDropdownIcon = (iconType, icon, color, size = 20) => {
        switch (iconType) {
            case 'Ionicons':
                return <Ionicons name={icon} size={size} color={color} />;
            case 'Feather':
                return <Feather name={icon} size={size} color={color} />;
            case 'FontAwesome':
                return <FontAwesome name={icon} size={size} color={color} />;
            case 'MaterialIcons':
                return <MaterialIcons name={icon} size={size} color={color} />;
            default:
                return <Feather name={icon} size={size} color={color} />;
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
                            onValueChange={toggleDarkMode}
                            value={isDarkMode}
                        />
                    )}
                    {hasChevron && <Ionicons name="chevron-forward" size={20} color="#999" />}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerContent}>
                    <Image
                        source={require('../../../assets/images/AAngLogo.png')}
                        style={styles.logoText}
                    />
                    <Text style={styles.headerTitle}>Account</Text>
                </View>

                {/* MORE BUTTON WITH DROPDOWN - MODIFIED */}
                <View style={styles.moreButtonContainer}>
                    <TouchableOpacity
                        style={styles.moreButton}
                        onPress={() => setShowOptions(!showOptions)}
                    >
                        <Feather name="more-horizontal" size={24} color="#333" />
                    </TouchableOpacity>

                    {/* DROPDOWN MENU - ADDED */}
                    {showOptions && (
                        <View style={styles.dropdownMenu}>
                            {quickOptions.map((option, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.dropdownItem}
                                    onPress={option.onPress}
                                >
                                    {renderDropdownIcon(option.iconType, option.icon, option.color)}
                                    <Text style={styles.dropdownText}>{option.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>

                {/* OVERLAY TO CLOSE DROPDOWN - ADDED */}
                {showOptions && (
                    <Pressable style={styles.overlay} onPress={closeDropdown} />
                )}
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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
                                source={require('../../../assets/images/avatar-1.jpg')}
                                style={styles.profileImage}
                            />
                        )}
                        <TouchableOpacity style={styles.editImageButton}>
                            <Feather name="edit-2" size={18} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    {userData?.fullName ? (
                        <Text style={styles.profileName}>
                            Hi, {userData.fullName.split(' ')[0]}
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
                        title: 'Profile',
                        hasChevron: true,
                        onPress: () => goToProfile(),
                    })}

                    {renderMenuItem({
                        icon: 'shield-checkmark-outline',
                        iconType: 'Ionicons',
                        title: 'Data Verification',
                        hasChevron: true,
                        onPress: () => goToDataVerification(),
                    })}

                    {/*{renderMenuItem({*/}
                    {/*    icon: 'home-outline',*/}
                    {/*    iconType: 'Ionicons',*/}
                    {/*    title: 'Utility Test',*/}
                    {/*    hasChevron: true,*/}
                    {/*    onPress: () => goToUtility(),*/}
                    {/*})}*/}

                    {renderMenuItem({
                        icon: 'wallet-outline',
                        iconType: 'Ionicons',
                        title: 'Payment',
                        hasChevron: true,
                        onPress: () => goToPayment(),
                    })}

                    {renderMenuItem({
                        icon: 'location-outline',
                        iconType: 'Ionicons',
                        title: 'Location',
                        hasChevron: true,
                        onPress: () => goToLocation(),
                    })}

                    {renderMenuItem({
                        icon: 'analytics-outline',
                        iconType: 'Ionicons',
                        title: 'Analytics',
                        hasChevron: true,
                        onPress: () => goToAnalytics(),
                    })}


                    {renderMenuItem({
                        icon: 'shield-outline',
                        iconType: 'Ionicons',
                        title: 'Security',
                        hasChevron: true,
                        onPress: () => goToSecurity(),
                    })}


                    {renderMenuItem({
                        icon: 'lock-closed-outline',
                        iconType: 'Ionicons',
                        title: 'Privacy Policy',
                        hasChevron: true,
                        onPress: () => goToPolicy(),
                    })}

                    {renderMenuItem({
                        icon: 'support-agent',
                        iconType: 'MaterialIcons',
                        title: 'Support',
                        hasChevron: true,
                        onPress: () => goToSupport(),
                    })}

                    {/*{renderMenuItem({*/}
                    {/*    icon: 'people-outline',*/}
                    {/*    iconType: 'Ionicons',*/}
                    {/*    title: 'Invite Friends',*/}
                    {/*    hasChevron: true*/}
                    {/*})}*/}

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
        marginBottom: 5,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 5,
        paddingVertical: 5,
        position: 'relative',
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
        width: 45,
        height: 45,
        borderRadius: 50,
        marginRight: 5,
    },
    headerTitle: {
        fontSize: 18,
        color: '#333',
        fontFamily: 'PoppinsBold'
    },
    moreButtonContainer: {
        position: 'relative',
        zIndex: 1000,
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
    dropdownMenu: {
        position: 'absolute',
        top: 40,
        right: 0,
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingVertical: 8,
        minWidth: 180,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
    },
    dropdownText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
        flex: 1,
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 999,
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
        fontSize: 20,
        color: '#333',
        fontFamily: 'PoppinsBold'
    },
    profileEmail: {
        fontSize: 14,
        color: '#777',
        fontFamily: 'PoppinsRegular'
    },
    divider: {
        height: 1,
        backgroundColor: '#eee',
        marginVertical: 5,
        marginHorizontal: 20,
    },
    menuSection: {
        paddingHorizontal: 5,
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
        color: '#333',
        fontFamily: 'PoppinsBold',
    },
    menuRightContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuValueText: {
        marginRight: 10,
        color: '#777',
    },


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
        fontFamily: 'PoppinsRegular',
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

export default DriverAccount;