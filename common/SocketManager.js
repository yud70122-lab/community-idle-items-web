import { BASE_URL } from '@/common/interceptor.js'

const WS_BASE_URL = BASE_URL.replace('https://', 'wss://').replace('http://', 'ws://')
const WS_PATH = '/ws/chat'
const RECONNECT_INTERVAL = 3000
const MAX_RECONNECT_ATTEMPTS = 5
const HEARTBEAT_INTERVAL = 30000

class SocketManager {
    constructor() {
        this.socketTask = null
        this.isConnected = false
        this.isConnecting = false
        this.reconnectAttempts = 0
        this.heartbeatTimer = null
        this.messageListeners = new Map()
        this.globalListeners = []
        this.pendingMessages = []
        this.connectPromise = null
    }

    connect() {
        if (this.isConnected || this.isConnecting) {
            return this.connectPromise
        }

        const token = uni.getStorageSync('access_token')
        if (!token) {
            console.error('[SocketManager] No token found, cannot connect')
            return Promise.reject(new Error('未登录，无法连接'))
        }

        this.isConnecting = true
        const wsUrl = `${WS_BASE_URL}${WS_PATH}?token=${encodeURIComponent(token)}`

        console.log('[SocketManager] Connecting to:', wsUrl)

        this.connectPromise = new Promise((resolve, reject) => {
            this.socketTask = uni.connectSocket({
                url: wsUrl,
                complete: () => {}
            })

            this.socketTask.onOpen((res) => {
                console.log('[SocketManager] WebSocket connected', res)
                this.isConnected = true
                this.isConnecting = false
                this.reconnectAttempts = 0
                this.startHeartbeat()
                this.flushPendingMessages()
                this.notifyListeners({ type: 'system', event: 'connected', data: res })
                resolve(res)
            })

            this.socketTask.onMessage((res) => {
                this.handleMessage(res)
            })

            this.socketTask.onError((err) => {
                console.error('[SocketManager] WebSocket error:', err)
                this.isConnected = false
                this.isConnecting = false
                this.stopHeartbeat()
                this.notifyListeners({ type: 'system', event: 'error', data: err })
                reject(err)
                this.attemptReconnect()
            })

            this.socketTask.onClose((res) => {
                console.log('[SocketManager] WebSocket closed:', res)
                this.isConnected = false
                this.isConnecting = false
                this.stopHeartbeat()
                this.notifyListeners({ type: 'system', event: 'closed', data: res })
                this.attemptReconnect()
            })
        })

        return this.connectPromise
    }

    handleMessage(res) {
        let message = null
        try {
            message = typeof res.data === 'string' ? JSON.parse(res.data) : res.data
        } catch (e) {
            console.error('[SocketManager] Parse message failed:', e, res.data)
            return
        }

        if (message.type === 'pong') {
            console.log('[SocketManager] Received pong')
            return
        }

        if (message.type === 'error' && message.code === 401) {
            console.error('[SocketManager] Unauthorized, closing connection')
            uni.removeStorageSync('access_token')
            uni.showToast({ title: '登录已过期', icon: 'none' })
            this.close()
            uni.navigateTo({ url: '/pages/login/login' })
            return
        }

        console.log('[SocketManager] Received message:', message)

        this.notifyListeners(message)

        if (message.conversationId) {
            const listeners = this.messageListeners.get(message.conversationId)
            if (listeners) {
                listeners.forEach(listener => {
                    try {
                        listener(message)
                    } catch (e) {
                        console.error('[SocketManager] Listener error:', e)
                    }
                })
            }
        }
    }

    send(message) {
        const messageStr = typeof message === 'string' ? message : JSON.stringify(message)

        if (!this.isConnected) {
            console.warn('[SocketManager] Not connected, queueing message:', message)
            this.pendingMessages.push(message)
            this.connect().catch(err => {
                console.error('[SocketManager] Failed to connect for sending:', err)
            })
            return false
        }

        try {
            this.socketTask.send({
                data: messageStr,
                success: () => {
                    console.log('[SocketManager] Message sent:', message)
                },
                fail: (err) => {
                    console.error('[SocketManager] Send failed:', err)
                    this.pendingMessages.push(message)
                }
            })
            return true
        } catch (e) {
            console.error('[SocketManager] Send error:', e)
            this.pendingMessages.push(message)
            return false
        }
    }

    sendChatMessage(receiverId, content, type = 'text', extra = {}) {
        const message = {
            type: 'chat_message',
            receiverId,
            content,
            msgType: type,
            timestamp: Date.now(),
            ...extra
        }
        return this.send(message)
    }

    sendReadReceipt(conversationId, messageId) {
        const message = {
            type: 'read_receipt',
            conversationId,
            messageId,
            timestamp: Date.now()
        }
        return this.send(message)
    }

    sendTypingStatus(conversationId, isTyping) {
        const message = {
            type: 'typing',
            conversationId,
            isTyping,
            timestamp: Date.now()
        }
        return this.send(message)
    }

    recallMessage(conversationId, messageId) {
        const message = {
            type: 'recall_message',
            conversationId,
            messageId,
            timestamp: Date.now()
        }
        return this.send(message)
    }

    sendBatchReadReceipt(conversationId, messageIds) {
        const message = {
            type: 'batch_read_receipt',
            conversationId,
            messageIds,
            timestamp: Date.now()
        }
        return this.send(message)
    }

    flushPendingMessages() {
        while (this.pendingMessages.length > 0 && this.isConnected) {
            const message = this.pendingMessages.shift()
            this.send(message)
        }
    }

    startHeartbeat() {
        this.stopHeartbeat()
        this.heartbeatTimer = setInterval(() => {
            if (this.isConnected) {
                this.send({ type: 'ping', timestamp: Date.now() })
            }
        }, HEARTBEAT_INTERVAL)
    }

    stopHeartbeat() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer)
            this.heartbeatTimer = null
        }
    }

    attemptReconnect() {
        if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
            console.error('[SocketManager] Max reconnect attempts reached')
            uni.showToast({
                title: '连接失败，请稍后重试',
                icon: 'none'
            })
            this.reconnectAttempts = 0
            return
        }

        this.reconnectAttempts++
        const delay = RECONNECT_INTERVAL * this.reconnectAttempts

        console.log(`[SocketManager] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`)

        setTimeout(() => {
            this.connect().catch(err => {
                console.error('[SocketManager] Reconnect failed:', err)
            })
        }, delay)
    }

    addMessageListener(conversationId, callback) {
        if (!this.messageListeners.has(conversationId)) {
            this.messageListeners.set(conversationId, [])
        }
        const listeners = this.messageListeners.get(conversationId)
        listeners.push(callback)

        return () => {
            const idx = listeners.indexOf(callback)
            if (idx > -1) {
                listeners.splice(idx, 1)
            }
        }
    }

    addGlobalListener(callback) {
        this.globalListeners.push(callback)
        return () => {
            const idx = this.globalListeners.indexOf(callback)
            if (idx > -1) {
                this.globalListeners.splice(idx, 1)
            }
        }
    }

    removeMessageListener(conversationId) {
        this.messageListeners.delete(conversationId)
    }

    notifyListeners(message) {
        this.globalListeners.forEach(listener => {
            try {
                listener(message)
            } catch (e) {
                console.error('[SocketManager] Global listener error:', e)
            }
        })
    }

    close(code = 1000, reason = 'normal closure') {
        this.stopHeartbeat()
        this.pendingMessages = []
        this.messageListeners.clear()

        if (this.socketTask) {
            this.socketTask.close({
                code,
                reason,
                success: () => {
                    console.log('[SocketManager] Socket closed successfully')
                },
                fail: (err) => {
                    console.error('[SocketManager] Close failed:', err)
                }
            })
            this.socketTask = null
        }

        this.isConnected = false
        this.isConnecting = false
        this.reconnectAttempts = 0
    }

    getConnectionState() {
        return {
            isConnected: this.isConnected,
            isConnecting: this.isConnecting,
            reconnectAttempts: this.reconnectAttempts,
            pendingMessages: this.pendingMessages.length
        }
    }
}

const socketManager = new SocketManager()

export default socketManager
export { SocketManager }
