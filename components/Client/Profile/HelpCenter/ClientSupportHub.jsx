// components/Client/Account/Support/ClientSupportHub.jsx
import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Headphones, Truck } from 'lucide-react-native';
import { router } from 'expo-router';
import ChatScreen from './ChatScreen';
import {MaterialCommunityIcons} from "@expo/vector-icons";

const ClientSupportHub = ({ userData, chatData, onRefresh }) => {
    const [selectedConversation, setSelectedConversation] = useState(null);

    const { supportConversation, driverConversations, summary } = chatData;

    const handleRefresh = () => {
        onRefresh();
    };

    // If conversation selected, show chat screen
    if (selectedConversation) {
        return (
            <ChatScreen
                userData={userData}
                conversationData={selectedConversation}
                onBack={() => setSelectedConversation(null)}
                onRefresh={handleRefresh}
            />
        );
    }

    // If only support chat exists (no driver chats), go straight to it
    if (driverConversations.length === 0 && !selectedConversation) {
        return (
            <ChatScreen
                userData={userData}
                conversationData={supportConversation}
                onBack={() => router.back()}
                onRefresh={handleRefresh}
            />
        );
    }

    const onBackPress = () => {
        router.back();
    };

    // Show conversation selector (multiple chats available)
    return (
        <>
            {/* Header */}

            <View style={styles.headerTitleContainer}>
                <View style={styles.headerIconBox}>
                    <Pressable onPress={onBackPress}>
                        <MaterialCommunityIcons name="arrow-left-bold-circle" size={28} color="#fff"/>
                    </Pressable>
                </View>
                <View style={styles.headerTextContainer}>
                    <Text style={styles.headerTitle}>Messages</Text>
                    <Text style={styles.headerSubtitle}>{summary.totalConversations} active conversation{summary.totalConversations > 1 ? 's' : ''}</Text>
                </View>
            </View>
            <ScrollView style={styles.scrollView}>
                {/* Support Chat Card */}
                <TouchableOpacity
                    style={styles.conversationCard}
                    onPress={() => setSelectedConversation(supportConversation)}
                    activeOpacity={0.7}
                >
                    <View style={styles.cardIconContainer}>
                        <Headphones color="#3B82F6" size={24} />
                    </View>
                    <View style={styles.cardContent}>
                        <Text style={styles.cardTitle}>Support Admin</Text>
                        <Text style={styles.cardSubtitle}>
                            {supportConversation?.adminInfo?.fullName || 'Support Team'}
                        </Text>
                        {supportConversation?.messages?.length > 0 && (
                            <Text style={styles.lastMessage} numberOfLines={1}>
                                {supportConversation.messages[supportConversation.messages.length - 1].body}
                            </Text>
                        )}
                    </View>
                    {supportConversation?.isNew && (
                        <View style={styles.newBadge}>
                            <Text style={styles.newBadgeText}>New</Text>
                        </View>
                    )}
                </TouchableOpacity>

                {/* Driver Conversations (Active Orders) */}
                {driverConversations.length > 0 && (
                    <>
                        <Text style={styles.sectionTitle}>Active Deliveries</Text>
                        {driverConversations.map((driverChat) => (
                            <TouchableOpacity
                                key={driverChat.conversation._id}
                                style={styles.conversationCard}
                                onPress={() => setSelectedConversation(driverChat)}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.cardIconContainer, styles.driverIcon]}>
                                    <Truck color="#F59E0B" size={24} />
                                </View>
                                <View style={styles.cardContent}>
                                    <Text style={styles.cardTitle}>
                                        {driverChat.driverInfo?.fullName || 'Your Driver'}
                                    </Text>
                                    <Text style={styles.cardSubtitle}>
                                        Order: {driverChat.orderInfo?.orderRef || 'N/A'}
                                    </Text>
                                    {driverChat.messages.length > 0 && (
                                        <Text style={styles.lastMessage} numberOfLines={1}>
                                            {driverChat.messages[driverChat.messages.length - 1].body}
                                        </Text>
                                    )}
                                </View>
                                {driverChat.unreadCount > 0 && (
                                    <View style={styles.unreadBadge}>
                                        <Text style={styles.unreadText}>
                                            {driverChat.unreadCount > 9 ? '9+' : driverChat.unreadCount}
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </>
                )}

                {/* Info Section */}
                <View style={styles.infoSection}>
                    <Text style={styles.infoTitle}>💬 Need Help?</Text>
                    <Text style={styles.infoText}>
                        Chat with customer support or your delivery driver for real-time assistance.
                    </Text>
                </View>
            </ScrollView>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        gap: 12,
    },
    backButton: {
        padding: 4,
    },
    scrollView: {
        flex: 1,
        padding: 16,
    },
    sectionTitle: {
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
        color: '#64748B',
        marginTop: 16,
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    conversationCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#EFF6FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    driverIcon: {
        backgroundColor: '#FEF3C7',
    },
    cardContent: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 16,
        fontFamily: 'PoppinsSemiBold',
        color: '#0F172A',
        marginBottom: 2,
    },
    cardSubtitle: {
        fontSize: 13,
        color: '#64748B',
        fontFamily: 'PoppinsRegular',
        marginBottom: 4,
    },
    lastMessage: {
        fontSize: 14,
        color: '#94A3B8',
        fontFamily: 'PoppinsRegular',
        marginTop: 4,
    },
    newBadge: {
        backgroundColor: '#3B82F6',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    newBadgeText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    unreadBadge: {
        backgroundColor: '#EF4444',
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    unreadText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    infoSection: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginTop: 8,
    },
    infoTitle: {
        fontSize: 16,
        fontFamily: 'PoppinsSemiBold',
        color: '#0F172A',
        marginBottom: 8,
    },
    infoText: {
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        color: '#64748B',
        lineHeight: 20,
    },

    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#FFF',
    },
    headerIconBox: {
        width: 35,
        height: 35,
        borderRadius: 10,
        backgroundColor: '#3B82F6',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    headerTitle: {
        fontSize: 22,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827',
    },
    headerSubtitle: {
        fontSize: 13,
        fontFamily: 'PoppinsRegular',
        color: '#6B7280',
    },
    headerTextContainer: {
        flex: 1,
    },
});

export default ClientSupportHub;