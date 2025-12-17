// lib/client/ClientSocketManager.js (NEW - Class-based like Driver)
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

class ClientSocketManager {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.eventListeners = new Map();
        this._connectingPromise = null;
        this.connectionStats = {
            lastPing: null,
            reconnectCount: 0,
            lastDisconnect: null,
            quality: 'good'
        };
    }

    async connect(options = {}) {
        if (this.isConnected && this.socket && this.socket.connected) {
            console.log('✅ Client Socket already connected');
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

        console.log('🔌 Client connecting to socket:', SOCKET_SERVER_URL);

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
                console.log('✅ Client Socket connected:', this.socket.id);
                this.isConnected = true;
                cleanup();
                this.setupEventHandlers();
                resolve(this);
            };

            const onError = (err) => {
                console.error('❌ Client Socket connection error:', err.message);
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
            console.log('❌ Client Socket disconnected:', reason);
            this.isConnected = false;
            this.connectionStats.lastDisconnect = Date.now();
            this.connectionStats.quality = 'disconnected';
            this.emitEvent('disconnected', { reason, timestamp: new Date() });
        });

        this.socket.on('connect', () => {
            console.log('✅ Client Socket connected:', this.socket.id);
            this.isConnected = true;
            this.emitEvent('connected', { socketId: this.socket.id, timestamp: new Date() });
        });

        this.socket.on('reconnect', (attemptNumber) => {
            console.log('🔄 Client Socket reconnected');
            this.isConnected = true;
            this.emitEvent('reconnected', { attemptNumber });
        });

        this.socket.on('pong', (latency) => {
            this.connectionStats.lastPing = Date.now();
            this.connectionStats.latency = latency;
            this.connectionStats.quality = latency > 1000 ? 'poor' : 'good';
            this.emitEvent('connection-quality', this.connectionStats);
        });

        // Notifications
        this.socket.on('notification:new', (data) => {
            console.log('📬 New notification:', data);
            this.emitEvent('notification', data);
        });

        // Orders
        this.socket.on('order:status:updated', (data) => {
            console.log('📦 Order status updated:', data.status);
            this.emitEvent('order-status-updated', data);
        });

        this.socket.on('order:location:updated', (data) => {
            console.log('📍 Driver location updated:', data);
            this.emitEvent('order-location-updated', data);
        });

        this.socket.on('order:driver:assigned', (data) => {
            console.log('🚗 Driver assigned:', data);
            this.emitEvent('order-driver-assigned', data);
        });

        // Chat events (NEW)
        this.socket.on('chat:message:new', (data) => {
            console.log('💬 New chat message received:', data);
            this.emitEvent('chat-message-received', data);
        });

        this.socket.on('chat:message:sent', (data) => {
            this.emitEvent('chat-message-sent', data);
        });

        console.log('✅ Client Socket event handlers registered');
    }

    // Event emitter methods
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

    // Chat methods (NEW)
    joinConversation(conversationId) {
        if (!this.isConnected) return false;
        this.socket.emit('chat:join-conversation', conversationId);
        console.log(`📨 Client joined conversation: ${conversationId}`);
        return true;
    }

    leaveConversation(conversationId) {
        if (!this.isConnected) return false;
        this.socket.emit('chat:leave-conversation', conversationId);
        console.log(`🚪 Client left conversation: ${conversationId}`);
        return true;
    }

    sendChatMessage(conversationId, messageData) {
        if (!this.isConnected) {
            console.error('❌ Client Socket not connected');
            return false;
        }

        this.socket.emit('chat:send-message', {
            conversationId,
            ...messageData,
            source: 'mobile',
            clientTimestamp: new Date().toISOString(),
        });

        console.log(`📤 Client message sent to: ${conversationId}`);
        return true;
    }

    // Lifecycle
    disconnect() {
        this.cleanup();
    }

    cleanup() {
        if (this.socket) {
            console.log('🧹 Cleaning up client socket');
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

    ping() {
        if (this.isConnected && this.socket) {
            const start = Date.now();
            this.socket.emit('ping', () => {
                const latency = Date.now() - start;
                console.log(`🏓 Client Ping: ${latency}ms`);
            });
        }
    }
}

// Export singleton
export const clientSocketManager = new ClientSocketManager();
export default clientSocketManager;