// components/Driver/Account/Support/DriverSupportHub.jsx
import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MessageCircle, Package, ArrowLeft, Shield } from 'lucide-react-native';
import { router } from 'expo-router';
import ChatScreen from './ChatScreen';

const DriverSupportHub = ({ userData, chatData, onRefresh }) => {
    const [selectedConversation, setSelectedConversation] = useState(null);

    const { supportConversation, clientConversations, summary } = chatData;

    const handleRefresh = () => {
        onRefresh();
    };

    // If only support chat exists, go straight to it
    if (clientConversations.length === 0 && !selectedConversation) {
        return (
            <ChatScreen
                userData={userData}
                conversationData={supportConversation}
                onBack={() => router.back()}
                onRefresh={handleRefresh}
            />
        );
    }

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

    // Show conversation selector (multiple chats available)
    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backButton}
                >
                    <ArrowLeft color="#0F172A" size={24} />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>Messages</Text>
                    <Text style={styles.headerSubtitle}>
                        {summary.totalConversations} active conversation{summary.totalConversations > 1 ? 's' : ''}
                    </Text>
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
                        <Shield color="#3B82F6" size={24} />
                    </View>
                    <View style={styles.cardContent}>
                        <Text style={styles.cardTitle}>Support Team</Text>
                        <Text style={styles.cardSubtitle}>
                            {supportConversation.adminInfo?.fullName || 'Customer Support'}
                        </Text>
                        {supportConversation.messages.length > 0 && (
                            <Text style={styles.lastMessage} numberOfLines={1}>
                                {supportConversation.messages[supportConversation.messages.length - 1].body}
                            </Text>
                        )}
                    </View>
                    {supportConversation.isNew && (
                        <View style={styles.newBadge}>
                            <Text style={styles.newBadgeText}>New</Text>
                        </View>
                    )}
                </TouchableOpacity>

                {/* Client Conversations */}
                {clientConversations.length > 0 && (
                    <>
                        <Text style={styles.sectionTitle}>Active Orders</Text>
                        {clientConversations.map((clientChat) => (
                            <TouchableOpacity
                                key={clientChat.conversation._id}
                                style={styles.conversationCard}
                                onPress={() => setSelectedConversation(clientChat)}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.cardIconContainer, styles.clientIcon]}>
                                    <Package color="#10B981" size={24} />
                                </View>
                                <View style={styles.cardContent}>
                                    <Text style={styles.cardTitle}>
                                        {clientChat.clientInfo?.fullName || 'Client'}
                                    </Text>
                                    <Text style={styles.cardSubtitle}>
                                        Order: {clientChat.orderInfo?.orderRef || 'N/A'}
                                    </Text>
                                    {clientChat.messages.length > 0 && (
                                        <Text style={styles.lastMessage} numberOfLines={1}>
                                            {clientChat.messages[clientChat.messages.length - 1].body}
                                        </Text>
                                    )}
                                </View>
                                {clientChat.unreadCount > 0 && (
                                    <View style={styles.unreadBadge}>
                                        <Text style={styles.unreadText}>
                                            {clientChat.unreadCount > 9 ? '9+' : clientChat.unreadCount}
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
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
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#0F172A',
    },
    headerSubtitle: {
        fontSize: 13,
        color: '#64748B',
        marginTop: 2,
    },
    scrollView: {
        flex: 1,
        padding: 16,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
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
    clientIcon: {
        backgroundColor: '#D1FAE5',
    },
    cardContent: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0F172A',
        marginBottom: 2,
    },
    cardSubtitle: {
        fontSize: 13,
        color: '#64748B',
        marginBottom: 4,
    },
    lastMessage: {
        fontSize: 14,
        color: '#94A3B8',
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
});

export default DriverSupportHub;