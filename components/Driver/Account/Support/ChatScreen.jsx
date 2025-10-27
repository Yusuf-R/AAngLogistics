import React, {useState, useEffect, useRef} from 'react';
import {
    View,
    Text,
    TextInput,
    FlatList,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    ActivityIndicator,
    Alert,
    RefreshControl
} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {Send, ArrowLeft, AlertCircle, CheckCheck, Clock} from 'lucide-react-native';
import DriverUtils from '../../../../utils/DriverUtilities';
import socketClient from '../../../../lib/driver/SocketClient';
import {Ionicons} from "@expo/vector-icons";

const ChatScreen = ({userData, conversationData, onBack, onRefresh}) => {
    // Validate userData
    if (!userData?.id) {
        console.error('❌ userData is missing or invalid:', userData);
        Alert.alert('Error', 'User data not available');
        onBack?.();
        return null;
    }

    // Safe data extraction
    const conversation = conversationData?.conversation;
    const initialMessages = conversationData?.messages || [];
    const otherUserInfo = conversationData?.adminInfo || conversationData?.clientInfo;
    const orderInfo = conversationData?.orderInfo || null;

    if (!conversation?._id) {
        console.error('❌ Conversation data is invalid:', conversationData);
        Alert.alert('Error', 'Conversation not found');
        onBack?.();
        return null;
    }

    const insets = useSafeAreaInsets();

    // State
    const [messages, setMessages] = useState(initialMessages);
    const [conversationId] = useState(conversation._id);
    const [inputText, setInputText] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [isNearBottom, setIsNearBottom] = useState(true);

    const flatListRef = useRef(null);

    // Helpers: near-bottom detection + controlled autoscroll
    const isCloseToBottom = ({layoutMeasurement, contentOffset, contentSize}) => {
        const paddingToBottom = 60;
        return layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
    };

    const onListScroll = (e) => {
        try {
            setIsNearBottom(isCloseToBottom(e.nativeEvent));
        } catch {
        }
    };

    const scrollToBottom = () => {
        requestAnimationFrame(() => {
            flatListRef.current?.scrollToEnd({animated: true});
        });
    };

    const maybeScrollToBottom = () => {
        if (isNearBottom) scrollToBottom();
    };

    // Send message with optimistic UI
    const sendMessage = async () => {
        if (!inputText.trim() || isSending || !conversationId) return;

        const messageText = inputText.trim();
        setInputText('');
        setIsSending(true);

        const optimisticMessage = {
            _id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            conversationId,
            senderId: userData.id,
            senderRole: userData.role,
            kind: 'text',
            body: messageText,
            createdAt: new Date().toISOString(),
            isOptimistic: true,
            seq: messages.length + 1
        };

        setMessages((prev) => [...prev, optimisticMessage]);
        maybeScrollToBottom();

        try {
            const response = await DriverUtils.sendMessage(conversationId, {
                body: messageText,
                kind: 'text'
            });

            if (response.success) {
                setMessages((prev) =>
                    prev.map((msg) =>
                        msg._id === optimisticMessage._id
                            ? {...response.data, _id: response.data._id || optimisticMessage._id}
                            : msg
                    )
                );
                maybeScrollToBottom();
            } else {
                throw new Error(response.error || 'Failed to send message');
            }
        } catch (error) {
            console.error('❌ Failed to send message:', error);
            setMessages((prev) => prev.filter((msg) => msg._id !== optimisticMessage._id));
            Alert.alert('Error', 'Failed to send message. Please try again.');
        } finally {
            setIsSending(false);
        }
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Render message
    const renderMessage = ({item}) => {
        const currentUserIdStr = userData.id?.toString();
        const messageSenderIdStr = item.senderId?.toString();

        const isCurrentUser = currentUserIdStr === messageSenderIdStr;
        const isOptimistic = item.isOptimistic;

        if (item.kind === 'system') {
            return (
                <View style={styles.systemMessage}>
                    <Text style={styles.systemMessageText}>{item.body}</Text>
                </View>
            );
        }

        return (
            <View
                style={[
                    styles.messageBubble,
                    isCurrentUser ? styles.messageBubbleRight : styles.messageBubbleLeft
                ]}
            >
                {!isCurrentUser && otherUserInfo && (
                    <Text style={styles.senderName}>{otherUserInfo.fullName || 'User'}</Text>
                )}

                <View
                    style={[
                        styles.messageContent,
                        isCurrentUser ? styles.messageContentRight : styles.messageContentLeft,
                        isOptimistic && styles.messageOptimistic
                    ]}
                >
                    <Text style={[styles.messageText, isCurrentUser && styles.messageTextRight]}>
                        {item.body}
                    </Text>
                </View>

                <View style={[styles.messageFooter, isCurrentUser && styles.messageFooterRight]}>
                    <Text style={styles.messageTime}>{formatTime(item.createdAt)}</Text>
                    {isCurrentUser && (isOptimistic ? <Clock color="#94A3B8" size={14}/> :
                        <CheckCheck color="#3B82F6" size={14}/>)}
                </View>
            </View>
        );
    };

    // Socket connection
    useEffect(() => {
        const initializeSocket = async () => {
            try {
                await socketClient.connect();
                setIsConnected(true);
            } catch (error) {
                console.error('❌ Failed to connect to socket:', error);
                setIsConnected(false);
            }
        };

        initializeSocket();

        const handleConnection = () => setIsConnected(true);
        const handleDisconnection = () => setIsConnected(false);

        socketClient.on('reconnected', handleConnection);
        socketClient.on('disconnected', handleDisconnection);

        return () => {
            socketClient.off('reconnected', handleConnection);
            socketClient.off('disconnected', handleDisconnection);
        };
    }, []);

    // Join/leave conversation
    useEffect(() => {
        if (conversationId && isConnected) {
            const joined = socketClient.joinConversation(conversationId);
            if (joined) {
                // joined
            }
        }

        return () => {
            if (conversationId) socketClient.leaveConversation(conversationId);
        };
    }, [conversationId, isConnected]);

    // Incoming messages
    useEffect(() => {
        if (!conversationId) return;

        const handleNewMessage = (message) => {
            if (message.conversationId?.toString() === conversationId?.toString()) {
                setMessages((prev) => {
                    const isDuplicate = prev.some(
                        (m) =>
                            m._id === message._id ||
                            (m.body === message.body &&
                                m.senderId === message.senderId &&
                                Math.abs(new Date(m.createdAt) - new Date(message.createdAt)) < 1000)
                    );
                    if (isDuplicate) return prev;
                    return [...prev, message];
                });
                requestAnimationFrame(maybeScrollToBottom);
            }
        };

        socketClient.on('chat-message-received', handleNewMessage);
        socketClient.on('chat:message:new', handleNewMessage);

        return () => {
            socketClient.off('chat-message-received', handleNewMessage);
            socketClient.off('chat:message:new', handleNewMessage);
        };
    }, [conversationId, isNearBottom]);

    // Debug user
    useEffect(() => {
        // console.log('User data:', userData, 'Conversation:', conversationId);
    }, []);

    // Key extractor
    // const keyExtractor = (item) => `${item._id}-${item.createdAt}-${item.isOptimistic ? 'opt' : 'real'}`;
    const keyExtractor = (item) => item._id;

    const handleRefresh = () => {
        setRefreshing(true);
        Promise.resolve(onRefresh?.()).finally(() => setRefreshing(false));
    };

    return (
        <>

            <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={onBack} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={22} color="#007AFF"/>
                    </TouchableOpacity>

                    <View style={styles.headerInfo}>
                        <Text style={styles.headerTitle}>{otherUserInfo?.fullName || 'Support'}</Text>
                        {orderInfo && <Text style={styles.orderRef}>Order: {orderInfo.orderRef}</Text>}
                        <View style={styles.statusRow}>
                            <View style={[styles.statusDot, isConnected && styles.statusDotOnline]}/>
                            <Text style={styles.statusText}>{isConnected ? 'Online' : 'Connecting...'}</Text>
                        </View>
                    </View>
                </View>

                {/* Messages list (independent scroll). Using inverted list to anchor to input. */}
                <FlatList
                    ref={flatListRef}
                    data={[...messages].reverse()}                 // newest first for inverted lists
                    inverted                                      // bottom is the start
                    keyExtractor={keyExtractor}
                    renderItem={({item, index}) => renderMessage({item, index})}
                    contentContainerStyle={styles.messagesList}
                    showsVerticalScrollIndicator={false}
                    keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
                    keyboardShouldPersistTaps="handled"
                    onScroll={onListScroll}
                    scrollEventThrottle={16}
                    ListEmptyComponent={() => (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyStateText}>👋 Start a conversation</Text>
                        </View>
                    )}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh}/>}
                />

                {/* Input (always visible). Only the input is wrapped in KAV. */}
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? (insets.bottom || 0) + 8 : 0}
                >
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Type your message..."
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                            maxLength={1000}
                            editable={!isSending}
                        />
                        <TouchableOpacity
                            style={[styles.sendButton, (!inputText.trim() || isSending) && styles.sendButtonDisabled]}
                            onPress={sendMessage}
                            disabled={!inputText.trim() || isSending}
                        >
                            {isSending ? <ActivityIndicator size="small" color="#FFFFFF"/> :
                                <Send color="#FFFFFF" size={20}/>}
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC'
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0'
    },
    backButton: {
        marginRight: 12,
        backgroundColor: 'green',
        padding: 4,
        borderRadius: 6
    },
    headerInfo: {
        flex: 1
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#0F172A',
        marginBottom: 4
    },
    orderRef: {
        fontSize: 13,
        color: '#64748B',
        marginBottom: 4
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#94A3B8',
        marginRight: 6
    },
    statusDotOnline: {
        backgroundColor: '#10B981'
    },
    statusText: {
        fontSize: 13,
        color: '#64748B'
    },
    messagesList: {
        padding: 16,
        flexGrow: 1
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60
    },
    emptyStateText: {
        fontSize: 16,
        color: '#64748B',
        textAlign: 'center'
    },
    systemMessage: {
        alignSelf: 'center',
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 16,
        marginVertical: 8
    },
    systemMessageText: {
        fontSize: 12,
        color: '#64748B',
        textAlign: 'center'
    },
    messageBubble: {
        marginBottom: 16,
        maxWidth: '80%'
    },
    messageBubbleLeft: {
        alignSelf: 'flex-start'
    },
    messageBubbleRight: {
        alignSelf: 'flex-end'
    },
    senderName: {
        fontSize: 12,
        color: '#64748B',
        marginBottom: 4
    },
    messageContent: {
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 12
    },
    messageContentLeft: {
        backgroundColor: '#F1F5F9',
        borderTopLeftRadius: 4
    },
    messageContentRight: {
        backgroundColor: '#3B82F6',
        borderTopRightRadius: 4
    },
    messageOptimistic: {
        opacity: 0.6
    },
    messageText: {
        fontSize: 15,
        lineHeight: 20,
        color: '#0F172A'
    },
    messageTextRight: {
        color: '#FFFFFF'
    },
    messageFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        gap: 4
    },
    messageFooterRight: {
        justifyContent: 'flex-end'
    },
    messageTime: {
        fontSize: 11,
        color: '#94A3B8'
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        gap: 12
    },
    input: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 15,
        maxHeight: 100,
        color: '#0F172A'
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#3B82F6',
        justifyContent: 'center',
        alignItems: 'center'
    },
    sendButtonDisabled: {
        backgroundColor: '#CBD5E1'
    }
});

export default ChatScreen;
