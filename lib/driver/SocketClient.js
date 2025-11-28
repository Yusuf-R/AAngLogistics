// lib/Driver/SocketClient.js (Driver - Standalone)
import { io } from 'socket.io-client';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import SecureStorage from '../SecureStorage';

const localIP = Constants.expoConfig?.hostUri?.split(':')[0] ?? 'localhost';

const SOCKET_SERVER_URL = Platform.select({
    ios: `http://${localIP}:5000`,
    android: `http://${localIP}:5000`,
    default: `http://${localIP}:5000`
});

class SocketClient {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.eventListeners = new Map();
        this._connectingPromise = null;
        this.connectionStats = {
            lastPing: null,
            reconnectCount: 0,
            lastDisconnect: null,
            quality: 'good' // 'good', 'poor', 'disconnected'
        };
    }

    async connect(options = {}) {
        if (this.isConnected && this.socket && this.socket.connected) {
            console.log('✅ Socket already connected');
            return this;
        }

        if (this.connectionStats.lastDisconnect &&
            Date.now() - this.connectionStats.lastDisconnect < 2000) {
            console.log('⏸️ Delaying reconnection...');
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        if (this._connectingPromise) {
            console.log('⏳ Connection in progress...');
            return this._connectingPromise;
        }

        this.disconnect();

        const authToken = await SecureStorage.getAccessToken();
        if (!authToken) {
            throw new Error('No authentication token found');
        }

        console.log('🔌 Connecting to socket:', SOCKET_SERVER_URL);

        this.socket = io(SOCKET_SERVER_URL, {
            transports: ['websocket', 'polling'],
            auth: {
                token: authToken,
                clientType: 'mobile',
                ...(options.auth || {}),
            },
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 5,
            timeout: 10000,
            ...options,
        });

        this._connectingPromise = new Promise((resolve, reject) => {
            let timeoutId;

            const cleanup = () => {
                if (timeoutId) clearTimeout(timeoutId);
                if (this.socket) {
                    this.socket.off('connect', onConnect);
                    this.socket.off('connect_error', onError);
                }
                this._connectingPromise = null;
            };

            const onConnect = () => {
                console.log('✅ Socket connected:', this.socket.id);
                this.isConnected = true;
                cleanup();
                this.setupEventHandlers();
                resolve(this);
            };

            const onError = (err) => {
                console.error('❌ Socket connection error:', err.message);
                this.isConnected = false;
                cleanup();
                reject(new Error(`Connection failed: ${err.message}`));
            };

            this.socket.once('connect', onConnect);
            this.socket.once('connect_error', onError);

            timeoutId = setTimeout(() => {
                if (!this.isConnected) {
                    cleanup();
                    this.cleanup();
                    reject(new Error('Socket connection timeout'));
                }
            }, 15000);
        });

        return this._connectingPromise;
    }

    setupEventHandlers() {
        // Connection events
        this.socket.on('disconnect', (reason) => {
            console.log('❌ Socket disconnected:', reason);
            this.isConnected = false;
            this.connectionStats.lastDisconnect = Date.now();
            this.connectionStats.quality = 'disconnected';

            this.emitEvent('disconnected', {
                reason,
                timestamp: new Date(),
                willReconnect: this.socket.reconnecting
            });
        });

        this.socket.on('pong', (latency) => {
            this.connectionStats.lastPing = Date.now();
            this.connectionStats.latency = latency;

            // Update connection quality
            if (latency > 1000) {
                this.connectionStats.quality = 'poor';
            } else {
                this.connectionStats.quality = 'good';
            }

            this.emitEvent('connection-quality', this.connectionStats);
        });

        this.socket.on('reconnect_attempt', (attemptNumber) => {
            console.log(`🔄 Reconnect attempt ${attemptNumber}`);
            this.connectionStats.reconnectCount = attemptNumber;
            this.emitEvent('reconnect-attempt', { attemptNumber });
        });

        this.socket.on('connect', () => {
            console.log('✅ Socket connected:', this.socket.id);
            this.isConnected = true;
            this.emitEvent('connected', {
                socketId: this.socket.id,
                timestamp: new Date()
            });
        });

        this.socket.on('reconnect', (attemptNumber) => {
            console.log('🔄 Socket reconnected');
            this.isConnected = true;
            this.emitEvent('reconnected', { attemptNumber });
        });

        // Notifications
        this.socket.on('notification:new', (data) => {
            console.log('📬 New notification:', data);
            this.emitEvent('notification', data);
        });

        this.socket.on('notification:badge:increment', (data) => {
            console.log('➕ Badge increment:', data);
            this.emitEvent('badge-increment', data);
        });

        this.socket.on('notification:badge:decrement', (data) => {
            console.log('➖ Badge decrement:', data);
            this.emitEvent('badge-decrement', data);
        });

        this.socket.on('notification:badge:sync', (data) => {
            console.log('🔄 Badge sync:', data);
            this.emitEvent('badge-sync', data);
        });

        // Orders
        this.socket.on('order:assignment', (data) => {
            console.log('📦 New order assignment:', data);
            this.emitEvent('order-assignment', data);
        });

        this.socket.on('order:status:updated', (data) => {
            console.log('📦 Order status updated:', data.status);
            this.emitEvent('order-status-updated', data);
        });

        // Chat
        this.socket.on('chat:message:new', (data) => {
            console.log('💬 New chat message:', data);
            this.emitEvent('chat-message-received', data);
        });

        this.socket.on('chat:message:sent', (data) => {
            this.emitEvent('chat-message-sent', data);
        });

        // PayStack Transfer
        this.socket.on('payout:status:updated', (data) => {
            console.log('💰 Payout status updated:', data);
            this.emitEvent('payout-status-updated', data);
        });

        this.socket.on('payout:transfer:completed', (data) => {
            console.log('✅ Payout completed:', data);
            this.emitEvent('payout-completed', data);
        });

        this.socket.on('payout:transfer:failed', (data) => {
            console.log('❌ Payout failed:', data);
            this.emitEvent('payout-failed', data);
        });

        console.log('✅ Socket event handlers registered');
    }

    // Event emitter
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, new Set());
        }
        this.eventListeners.get(event).add(callback);
    }

    off(event, callback) {
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event).delete(callback);
        }
    }

    emitEvent(event, data) {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            listeners.forEach((cb) => {
                try {
                    cb(data);
                } catch (error) {
                    console.error(`Error in ${event} listener:`, error);
                }
            });
        }
    }

    // Chat methods
    joinConversation(conversationId) {
        if (!this.isConnected) return false;
        this.socket.emit('chat:join-conversation', conversationId);
        console.log(`📨 Joined conversation: ${conversationId}`);
        return true;
    }

    leaveConversation(conversationId) {
        if (!this.isConnected) return false;
        this.socket.emit('chat:leave-conversation', conversationId);
        console.log(`🚪 Left conversation: ${conversationId}`);
        return true;
    }

    sendChatMessage(conversationId, messageData) {
        if (!this.isConnected) {
            console.error('❌ Socket not connected');
            return false;
        }

        this.socket.emit('chat:send-message', {
            conversationId,
            ...messageData,
            source: 'mobile',
            clientTimestamp: new Date().toISOString(),
        });

        console.log(`📤 Message sent to: ${conversationId}`);
        return true;
    }

    // Lifecycle
    disconnect() {
        this.cleanup();
    }

    cleanup() {
        if (this.socket) {
            console.log('🧹 Cleaning up socket');
            this.socket.removeAllListeners();
            this.socket.disconnect();
            this.socket = null;
        }
        this.isConnected = false;
        this.eventListeners.clear();
    }

    getConnectionStatus() {
        return this.isConnected && this.socket && this.socket.connected;
    }

    getConnectionQuality() {
        return this.connectionStats.quality;
    }

    // 🔥 NEW: Manual ping for testing
    ping() {
        if (this.isConnected && this.socket) {
            const start = Date.now();
            this.socket.emit('ping', () => {
                const latency = Date.now() - start;
                console.log(`🏓 Ping: ${latency}ms`);
            });
        }
    }

    requestBadgeSync() {
        if (!this.isConnected) return false;

        this.socket.emit('notification:badge:request-sync');
        console.log('🔄 Requested badge sync');
        return true;
    }

    markNotificationsRead(notificationIds) {
        if (!this.isConnected) return false;

        this.socket.emit('notification:mark-read', {
            notificationIds: Array.isArray(notificationIds) ? notificationIds : [notificationIds],
            timestamp: new Date().toISOString()
        });

        console.log(`📋 Marked ${notificationIds.length} notifications as read`);
        return true;
    }

    // 🔥 NEW: Subscribe to specific notification categories
    subscribeToCategories(categories = ['ORDER', 'DELIVERY', 'SECURITY']) {
        if (!this.isConnected) return false;

        this.socket.emit('notification:subscribe', { categories });
        console.log(`📧 Subscribed to categories:`, categories);
        return true;
    }

    unsubscribeFromCategories(categories = []) {
        if (!this.isConnected) return false;

        this.socket.emit('notification:unsubscribe', { categories });
        console.log(`📭 Unsubscribed from categories:`, categories);
        return true;
    }
}

// Export singleton
export const socketClient = new SocketClient();
export default socketClient;