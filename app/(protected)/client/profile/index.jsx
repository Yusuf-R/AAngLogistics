import React, {useEffect, useState} from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    Modal,
    Pressable, ActivityIndicator
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Ionicons, Feather, FontAwesome, MaterialIcons, Octicons, MaterialCommunityIcons} from '@expo/vector-icons';
import {router} from "expo-router";
import {useSessionStore} from "../../../../store/useSessionStore";
import SessionManager from "../../../../lib/SessionManager";
import {ROUTES} from "../../../../utils/Constant";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {
    registerForPushNotificationsAsync,
    checkNotificationPermission,
    hasAskedForPermission,
    markPermissionAsked
} from '../../../../utils/Notification';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {axiosPrivate} from "../../../../utils/AxiosInstance";
import PushNotificationModal from "/components/PushNotificatonModal";
import {toast} from "sonner-native";

function ClientProfileScreen() {
    const [logoutModalVisible, setLogoutModalVisible] = useState(false);
    const userData = useSessionStore((state) => state.user);
    const insets = useSafeAreaInsets();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [showNotificationModal, setShowNotificationModal] = useState(false);
    const [isFirstProfileVisit, setIsFirstProfileVisit] = useState(false);

    useEffect(() => {
        const handleNotificationFlow = async () => {
            if (!userData) return; // ✅ Guard inside effect

            try {
                const hasVisited = await AsyncStorage.getItem('@profile_visited');
                const hasAsked = await hasAskedForPermission();

                if (!hasVisited && !hasAsked) {
                    setIsFirstProfileVisit(true);
                    setShowNotificationModal(true);
                    await AsyncStorage.setItem('@profile_visited', 'true');
                    return;
                }

                const permissionStatus = await checkNotificationPermission();

                if (permissionStatus.granted) {
                    const token = await AsyncStorage.getItem('@expo_push_token');
                    if (!token) {
                        const expoPushToken = await registerForPushNotificationsAsync();
                        if (expoPushToken) {
                            await AsyncStorage.setItem('@expo_push_token', expoPushToken);
                            await axiosPrivate.patch('/auth/update-push-token', {
                                expoPushToken,
                                enabled: true
                            });
                        }
                    }
                    const setting = await AsyncStorage.getItem('@user_notification_setting');
                    setNotificationsEnabled(setting !== 'false');
                }
            } catch (error) {
                console.log('Notification flow error:', error);
            }
        };

        handleNotificationFlow();
    }, [userData]);

    if (!userData) {
        return (
            <SafeAreaView style={{flex: 1, backgroundColor: '#FFF', paddingTop: insets.top}}>
                <ActivityIndicator size="large" color="#60a5fa"/>
            </SafeAreaView>
        );
    }

    const handleLogout = async () => {
        try {
            setIsLoggingOut(true);
            setLogoutModalVisible(false);
            await new Promise(resolve => setTimeout(resolve, 300));
            await SessionManager.logout();
        } catch (error) {
            console.error('[Logout Error]:', error);
            toast.error('Logout Error')
            setIsLoggingOut(false);
        }
    };

    const goToSecurity = () => {
        router.push(ROUTES.SECURITY);
    };

    const goToTC = () => {
        router.push(ROUTES.TC);
    }

    const goToUtility = () => {
        router.push(ROUTES.UTILITY);
    }

    const geToEdit = () => {
        router.push(ROUTES['EDIT-PROFILE']);
    }

    const updateProfilePic = () => {
        router.push(ROUTES['UPDATE-AVATAR']);
    }

    const goToLocationSettings = () => {
        router.push(ROUTES['LOCATION']);
    }

    const goToAnalytics = () => {
        router.push(ROUTES.ANALYTICS);
    }

    const goToHelpCenter = () => { router.push(ROUTES['HELP-CENTER']) };

    const renderMenuItem = ({icon, iconType, title, value, hasChevron, color, isSwitch, onPress}) => {
        const renderIcon = () => {
            switch (iconType) {
                case 'Ionicons':
                    return <Ionicons name={icon} size={24} color={color || '#555'}/>;
                case 'Feather':
                    return <Feather name={icon} size={24} color={color || '#555'}/>;
                case 'FontAwesome':
                    return <FontAwesome name={icon} size={24} color={color || '#555'}/>;
                case 'MaterialIcons':
                    return <MaterialIcons name={icon} size={24} color={color || '#555'}/>;
                default:
                    return <Ionicons name={icon} size={24} color={color || '#555'}/>;
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
                    {hasChevron && <Ionicons name="chevron-forward" size={20} color="#999"/>}
                </View>
            </TouchableOpacity>
        );
    };


    // Add handler for "Enable Notifications" button
    const handleEnableNotifications = async () => {
        try {
            setShowNotificationModal(false);
            await markPermissionAsked();

            // Now show system dialog
            const expoPushToken = await registerForPushNotificationsAsync();

            if (expoPushToken) {
                await AsyncStorage.setItem('@expo_push_token', expoPushToken);
                await AsyncStorage.setItem('@user_notification_setting', 'true');
                await axiosPrivate.patch('/auth/update-push-token', {
                    expoPushToken,
                    enabled: true
                });
                setNotificationsEnabled(true);
            } else {
                // User denied system dialog
                await AsyncStorage.setItem('@user_notification_setting', 'false');
            }
        } catch (error) {
            console.log('Enable notifications error:', error);
        }
    };

    // Add handler for "Maybe Later"
    const handleMaybeLater = async () => {
        setShowNotificationModal(false);
        await markPermissionAsked();
        await AsyncStorage.setItem('@user_notification_setting', 'false');
    };

    return (
            <>
                <StatusBar barStyle="dark-content"/>

                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerContent}>
                        <Image
                            source={require('../../../../assets/images/AAngLogo.png')}
                            style={styles.logoText}
                        />
                        <Text style={styles.headerTitle}>Profile</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.moreButton}
                    >
                        <Feather name="more-horizontal" size={24} color="#333"/>
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.scrollView}>
                    {/* Profile Info */}
                    <View style={styles.profileSection}>
                        <View style={styles.profileImageContainer}>
                            {userData?.avatar ? (
                                <Image
                                    source={{uri: userData.avatar}}
                                    style={styles.profileImage}
                                />
                            ) : (
                                <Image
                                    source={require('../../../../assets/images/avatar-1.jpg')}
                                    style={styles.profileImage}
                                />
                            )}
                            <TouchableOpacity style={styles.editImageButton}
                                              onPress={() => updateProfilePic()}
                            >
                                <Feather name="edit-2" size={18} color="#fff"/>
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
                            <View style={styles.emailContainer}>
                                <Text style={styles.profileEmail}>{userData.email}</Text>
                                {userData.emailVerified ? (
                                    <MaterialIcons name="verified-user" size={22} color="green"/>
                                ) : (
                                    <>
                                        <Octicons name="unverified" size={22} color="black"/>
                                    </>
                                )}
                            </View>
                        )}

                    </View>

                    <View style={styles.divider}/>

                    {/* Menu Items */}
                    <View style={styles.menuSection}>
                        {renderMenuItem({
                            icon: 'person-outline',
                            iconType: 'Ionicons',
                            title: 'Edit Profile',
                            hasChevron: true,
                            onPress: () => geToEdit()
                        })}

                        {renderMenuItem({
                            icon: 'location-outline',
                            iconType: 'Ionicons',
                            title: 'Saved Locations',
                            hasChevron: true,
                            onPress: () => goToLocationSettings()
                        })}

                        {renderMenuItem({
                            icon: 'analytics-sharp',
                            iconType: 'Ionicons',
                            title: 'Analytics',
                            hasChevron: true,
                            onPress: () => goToAnalytics()
                        })}

                        {renderMenuItem({
                            icon: 'shield-outline',
                            iconType: 'Ionicons',
                            title: 'Security',
                            hasChevron: true,
                            onPress: () => goToSecurity()
                        })}


                        {renderMenuItem({
                            icon: 'handshake',
                            iconType: 'MaterialIcons',
                            title: 'Terms & Conditions',
                            hasChevron: true,
                            onPress: () => goToTC()
                        })}

                        {/*{renderMenuItem({*/}
                        {/*    icon: 'construct-outline',*/}
                        {/*    iconType: 'Ionicons',*/}
                        {/*    title: 'Utility',*/}
                        {/*    hasChevron: true,*/}
                        {/*    onPress: () => goToUtility()*/}
                        {/*})}*/}

                        {renderMenuItem({
                            icon: 'accessibility-outline',
                            iconType: 'Ionicons',
                            title: 'Help Center',
                            hasChevron: true,
                            onPress: () => goToHelpCenter()
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

                {/* Logout Modal */}
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={logoutModalVisible}
                    onRequestClose={() => setLogoutModalVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalView}>
                            <View style={styles.modalIndicator}/>

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
                {/* Logout Progress Overlay */}
                {isLoggingOut && (
                    <View style={styles.logoutOverlay}>
                        <View style={styles.logoutCard}>
                            <ActivityIndicator size="large" color="#60a5fa"/>
                            <Text style={styles.logoutText}>Logging you out...</Text>
                        </View>
                    </View>
                )}
                <PushNotificationModal
                    visible={showNotificationModal}
                    onEnable={handleEnableNotifications}
                    onMaybeLater={handleMaybeLater}
                />
            </>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
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
        fontSize: 22,
        fontFamily: 'PoppinsSemiBold',
        color: '#333',
    },
    moreButton: {
        width: 40,
        height: 40,
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
    },
    profileImageContainer: {
        position: 'relative',
        marginBottom: 10,
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 80,
    },
    editImageButton: {
        position: 'absolute',
        bottom: -5,
        right: -5,
        backgroundColor: '#43b0f1',
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
        fontFamily: 'PoppinsSemiBold',
        color: '#333',
    },
    profileEmail: {
        fontSize: 16,
        fontFamily: 'PoppinsSemiBold',
        color: '#777',
        marginRight: 3,
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
        fontFamily: 'PoppinsSemiBold',
        color: '#333',
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
    emailContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        marginBottom: 1,
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

export default ClientProfileScreen;