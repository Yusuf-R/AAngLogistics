import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    Switch,
    ScrollView,
    SafeAreaView,
    StatusBar
} from 'react-native';
import { Ionicons, Feather, FontAwesome, MaterialIcons } from '@expo/vector-icons';


const ProfileScreen = () => {
    const [isDarkMode, setIsDarkMode] = useState(false);

    const toggleSwitch = () => {
        setIsDarkMode(previousState => !previousState);
    };

    const renderMenuItem = ({ icon, iconType, title, value, hasChevron, color, isSwitch }) => {
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
            <TouchableOpacity style={styles.menuItem}>
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
                    <Text style={styles.headerTitle}>Profile</Text>
                </View>
                <TouchableOpacity style={styles.moreButton}>
                    <Feather name="more-horizontal" size={24} color="#333" />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView}>
                {/* Profile Info */}
                <View style={styles.profileSection}>
                    <View style={styles.profileImageContainer}>
                        <Image
                            source={require('../../../assets/images/avatar-1.jpg')}
                            style={styles.profileImage}
                        />
                        <TouchableOpacity style={styles.editImageButton}>
                            <Feather name="edit-2" size={18} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.profileName}>Andrew Ainsley</Text>
                    <Text style={styles.profileEmail}>andrew_ainsley@yourdomain.com</Text>
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
                        color: '#FF6B6B'
                    })}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingTop: StatusBar.currentHeight,
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
        width: 40,
        height: 40,
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
        fontSize: 24,
        fontWeight: 'bold',
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
        paddingVertical: 10,
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

});

export default ProfileScreen;