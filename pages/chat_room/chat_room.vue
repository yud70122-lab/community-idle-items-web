<template>
    <view class="chat-room-page">
        <view class="page-header">
            <view class="back-btn" @click="goBack">
                <text class="back-icon">‹</text>
            </view>
            <view class="header-content">
                <text class="peer-name">{{ peerName }}</text>
                <text class="peer-status" v-if="isPeerOnline">在线</text>
            </view>
            <view class="header-actions">
                <view class="action-btn" @click="showMoreOptions">
                    <text class="action-icon">⋯</text>
                </view>
            </view>
        </view>

        <view class="status-bar" v-if="!isConnected">
            <text class="status-icon">🔌</text>
            <text class="status-text">连接断开，正在重连...</text>
        </view>

        <scroll-view
            class="message-list"
            scroll-y
            :scroll-into-view="scrollToId"
            :scroll-with-animation="true"
            @scrolltolower="loadMoreMessages"
        >
            <view class="message-list-inner">
                <view class="load-more-tip" v-if="loadingMore">
                    <view class="spinner-small"></view>
                    <text class="tip-text">加载更多...</text>
                </view>

                <view class="date-divider" v-for="divider in dateDividers" :key="divider.id">
                    <text class="divider-text">{{ divider.text }}</text>
                </view>

                <view
                    class="message-item"
                    v-for="message in messageList"
                    :key="message.id"
                    :id="'msg-' + message.id"
                    :class="{
                        'is-self': message.isSelf,
                        'is-received': !message.isSelf
                    }"
                >
                    <image
                        class="message-avatar"
                        :src="message.isSelf ? myAvatar : peerAvatar"
                        mode="aspectFill"
                    />

                    <view class="message-content-wrapper">
                        <view
                            class="message-bubble-wrapper"
                            @longpress="handleMessageLongPress(message)"
                        >
                            <MessageBubble
                                :message="message"
                                @preview-image="previewImage"
                                @play-voice="playVoice"
                            />
                        </view>

                        <view class="message-meta">
                            <text class="message-time">{{ formatMessageTime(message.timestamp) }}</text>
                            <view class="message-status" v-if="message.isSelf && !message.recalled">
                                <text class="status-icon" v-if="message.status === 'sending'">⏳</text>
                                <text class="status-icon" v-else-if="message.status === 'failed'">❗</text>
                                <text class="status-icon read" v-else-if="message.status === 'read'">✓✓</text>
                                <text class="status-icon" v-else>✓</text>
                            </view>
                        </view>
                    </view>
                </view>

                <view class="typing-indicator" v-if="isPeerTyping">
                    <text class="typing-text">{{ peerName }} 正在输入...</text>
                </view>
            </view>
        </scroll-view>

        <view class="input-bar">
            <view class="voice-btn" @click="toggleVoiceMode">
                <text class="voice-icon">{{ isVoiceMode ? '⌨️' : '🎤' }}</text>
            </view>

            <view class="voice-input" v-if="isVoiceMode" @touchstart="startRecording" @touchend="stopRecording">
                <text class="voice-text">{{ isRecording ? '松开结束' : '按住说话' }}</text>
            </view>

            <input
                v-else
                class="message-input"
                v-model="inputMessage"
                type="text"
                :placeholder="inputPlaceholder"
                :confirm-type="'send'"
                :adjust-position="true"
                @focus="onInputFocus"
                @blur="onInputBlur"
                @confirm="sendTextMessage"
                @input="onInputChange"
            />

            <view class="emoji-btn" @click="toggleEmojiPanel">
                <text class="emoji-icon">😊</text>
            </view>

            <view class="add-btn" @click="showAddMenu" v-if="!isVoiceMode">
                <text class="add-icon">+</text>
            </view>

            <button class="send-btn" v-if="inputMessage.trim()" @click="sendTextMessage">
                <text class="send-text">发送</text>
            </button>
        </view>

        <view class="emoji-panel" v-if="showEmoji">
            <view class="emoji-grid">
                <view class="emoji-item" v-for="emoji in emojiList" :key="emoji" @click="insertEmoji(emoji)">
                    <text class="emoji-text">{{ emoji }}</text>
                </view>
            </view>
            <view class="emoji-actions">
                <view class="emoji-delete" @click="deleteEmoji">
                    <text class="delete-text">⌫</text>
                </view>
            </view>
        </view>

        <view class="add-menu" v-if="showAdd">
            <view class="menu-grid">
                <view class="menu-item" @click="chooseImage">
                    <view class="menu-icon image">🖼️</view>
                    <text class="menu-label">图片</text>
                </view>
                <view class="menu-item" @click="chooseLocation">
                    <view class="menu-icon location">📍</view>
                    <text class="menu-label">位置</text>
                </view>
                <view class="menu-item" @click="chooseItem">
                    <view class="menu-icon item">📦</view>
                    <text class="menu-label">物品卡片</text>
                </view>
            </view>
        </view>
    </view>
</template>

<script>
import http from '@/common/interceptor.js'
import socketManager from '@/common/SocketManager.js'
import { useUserStore } from '@/store/user.js'
import MessageBubble from '@/components/MessageBubble/MessageBubble.vue'

const RECORDING_MAX_DURATION = 60
const RECALL_TIME_LIMIT = 2 * 60 * 1000

export default {
    name: 'ChatRoom',
    components: {
        MessageBubble
    },
    data() {
        return {
            peerId: '',
            peerName: '',
            peerAvatar: '',
            myAvatar: '/static/default_avatar.png',
            conversationId: '',
            messageList: [],
            inputMessage: '',
            isConnected: false,
            isPeerOnline: false,
            isPeerTyping: false,
            isVoiceMode: false,
            isRecording: false,
            showEmoji: false,
            showAdd: false,
            loadingMore: false,
            hasMore: true,
            cursor: null,
            scrollToId: '',
            inputPlaceholder: '输入消息...',
            typingTimer: null,
            recordingTimer: null,
            recordingDuration: 0,
            messageUnsubscribe: null,
            globalUnsubscribe: null,
            emojiList: [
                '😀', '😂', '🤣', '😊', '😍', '🤔', '😎', '🥺',
                '😭', '😤', '👍', '👎', '❤️', '💔', '🎉', '🔥',
                '✨', '💯', '🙏', '👋', '🤝', '💪', '😊', '😘',
                '😜', '😏', '😴', '🤗', '😅', '😉', '😌', '😇'
            ],
            dateDividers: []
        }
    },
    computed: {
        userStore() {
            return useUserStore()
        }
    },
    onLoad(options) {
        if (options) {
            this.peerId = options.peerId || ''
            this.peerName = decodeURIComponent(options.peerName || '用户')
            this.peerAvatar = decodeURIComponent(options.peerAvatar || '')
        }

        this.conversationId = this.generateConversationId()
        this.myAvatar = this.userStore.userInfo?.avatar || '/static/default_avatar.png'

        this.initSocket()
        this.loadMessageHistory()
    },
    onUnload() {
        this.removeListeners()
        this.clearTimers()
    },
    onHide() {
        this.clearTimers()
    },
    methods: {
        generateConversationId() {
            const currentUserId = this.userStore.userInfo?.id || ''
            const ids = [currentUserId, this.peerId].sort()
            return `conv_${ids.join('_')}`
        },

        async initSocket() {
            try {
                await socketManager.connect()
                this.isConnected = true
            } catch (e) {
                console.error('Connect failed:', e)
                this.isConnected = false
            }

            this.globalUnsubscribe = socketManager.addGlobalListener((message) => {
                if (message.type === 'system') {
                    if (message.event === 'connected') {
                        this.isConnected = true
                    } else if (message.event === 'closed' || message.event === 'error') {
                        this.isConnected = false
                    }
                    return
                }

                if (message.type === 'typing') {
                    this.handleTypingStatus(message)
                }

                if (message.type === 'online_status') {
                    this.handleOnlineStatus(message)
                }

                if (message.type === 'recall_message') {
                    this.handleRecallMessage(message)
                }

                if (message.type === 'read_receipt') {
                    this.handleReadReceipt(message)
                }

                if (message.type === 'message_ack') {
                    this.handleMessageAck(message)
                }
            })

            this.messageUnsubscribe = socketManager.addMessageListener(this.conversationId, (message) => {
                this.handleIncomingMessage(message)
            })
        },

        removeListeners() {
            if (this.messageUnsubscribe) {
                this.messageUnsubscribe()
                this.messageUnsubscribe = null
            }
            if (this.globalUnsubscribe) {
                this.globalUnsubscribe()
                this.globalUnsubscribe = null
            }
        },

        clearTimers() {
            if (this.typingTimer) {
                clearTimeout(this.typingTimer)
                this.typingTimer = null
            }
            if (this.recordingTimer) {
                clearInterval(this.recordingTimer)
                this.recordingTimer = null
            }
        },

        async loadMessageHistory() {
            this.loadingMore = true
            try {
                const res = await http.get(`/api/chat/history/${this.conversationId}`, {
                    cursor: this.cursor,
                    limit: 20
                })

                if (res && res.list) {
                    const messages = res.list.map(msg => this.normalizeMessage(msg))

                    if (this.cursor) {
                        this.messageList = [...messages, ...this.messageList]
                    } else {
                        this.messageList = messages
                        this.markUnreadMessagesAsRead(messages)
                    }

                    this.hasMore = res.hasMore || false
                    this.cursor = res.cursor || null
                    this.updateDateDividers()

                    this.$nextTick(() => {
                        if (this.messageList.length > 0) {
                            const lastMsg = this.messageList[this.messageList.length - 1]
                            this.scrollToId = 'msg-' + lastMsg.id
                        }
                    })
                }
            } catch (error) {
                console.error('Load message history failed:', error)
                this.loadMockMessages()
            } finally {
                this.loadingMore = false
            }
        },

        loadMockMessages() {
            const now = Date.now()
            const mockMessages = [
                {
                    id: 'msg_001',
                    conversationId: this.conversationId,
                    senderId: this.peerId,
                    content: '你好，请问这个物品还在吗？',
                    msgType: 'text',
                    timestamp: now - 24 * 60 * 60 * 1000,
                    status: 'read',
                    isSelf: false
                },
                {
                    id: 'msg_002',
                    conversationId: this.conversationId,
                    senderId: this.userStore.userInfo?.id || 'me',
                    content: '在的，还在呢',
                    msgType: 'text',
                    timestamp: now - 24 * 60 * 60 * 1000 + 60000,
                    status: 'read',
                    isSelf: true
                },
                {
                    id: 'msg_003',
                    conversationId: this.conversationId,
                    senderId: this.peerId,
                    content: '想要请问一下这个手机的具体情况',
                    msgType: 'text',
                    timestamp: now - 2 * 60 * 60 * 1000,
                    status: 'read',
                    isSelf: false
                },
                {
                    id: 'msg_004',
                    conversationId: this.conversationId,
                    senderId: this.userStore.userInfo?.id || 'me',
                    content: '手机是iPhone 12 Pro 256G，远峰蓝色，九成新，电池健康87%，一直带壳使用，没有磕碰划痕',
                    msgType: 'text',
                    timestamp: now - 2 * 60 * 60 * 1000 + 120000,
                    status: 'read',
                    isSelf: true
                },
                {
                    id: 'msg_005',
                    conversationId: this.conversationId,
                    senderId: this.peerId,
                    content: '好的，了解了。那我们可以约个时间当面交换吗？',
                    msgType: 'text',
                    timestamp: now - 5 * 60 * 1000,
                    status: 'read',
                    isSelf: false
                }
            ]

            this.messageList = mockMessages
            this.updateDateDividers()
            this.hasMore = false

            this.$nextTick(() => {
                if (this.messageList.length > 0) {
                    const lastMsg = this.messageList[this.messageList.length - 1]
                    this.scrollToId = 'msg-' + lastMsg.id
                }
            })
        },

        normalizeMessage(msg) {
            return {
                ...msg,
                id: msg.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                isSelf: msg.senderId === this.userStore.userInfo?.id,
                status: msg.status || (msg.isSelf ? 'sent' : 'received'),
                recalled: msg.recalled || false
            }
        },

        async loadMoreMessages() {
            if (this.loadingMore || !this.hasMore) return
            await this.loadMessageHistory()
        },

        updateDateDividers() {
            const dividers = []
            let lastDate = null

            this.messageList.forEach(msg => {
                const msgDate = new Date(msg.timestamp)
                const dateKey = `${msgDate.getFullYear()}-${msgDate.getMonth()}-${msgDate.getDate()}`

                if (dateKey !== lastDate) {
                    lastDate = dateKey
                    dividers.push({
                        id: `divider_${dateKey}`,
                        text: this.formatDateDivider(msg.timestamp),
                        timestamp: msg.timestamp
                    })
                }
            })

            this.dateDividers = dividers
        },

        formatDateDivider(timestamp) {
            const date = new Date(timestamp)
            const now = new Date()
            const diff = now - date
            const oneDay = 24 * 60 * 60 * 1000

            if (diff < oneDay) {
                return '今天'
            } else if (diff < 2 * oneDay) {
                return '昨天'
            } else if (diff < 7 * oneDay) {
                const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
                return weekdays[date.getDay()]
            } else {
                return `${date.getMonth() + 1}月${date.getDate()}日`
            }
        },

        formatMessageTime(timestamp) {
            const date = new Date(timestamp)
            const hours = date.getHours().toString().padStart(2, '0')
            const minutes = date.getMinutes().toString().padStart(2, '0')
            return `${hours}:${minutes}`
        },

        getMessageBubbleClass(message) {
            const classes = [`type-${message.msgType}`]
            if (message.status === 'failed') {
                classes.push('failed')
            }
            return classes
        },

        handleIncomingMessage(message) {
            if (message.conversationId !== this.conversationId) return

            const normalizedMsg = this.normalizeMessage(message)
            normalizedMsg.status = 'received'

            const exists = this.messageList.find(m => m.id === normalizedMsg.id)
            if (exists) return

            this.messageList.push(normalizedMsg)
            this.updateDateDividers()
            this.scrollToBottom()
            this.markSingleMessageAsRead(normalizedMsg.id)

            if (message.senderId !== this.userStore.userInfo?.id) {
                this.isPeerTyping = false
            }
        },

        handleRecallMessage(message) {
            if (message.conversationId !== this.conversationId) return

            const idx = this.messageList.findIndex(m => m.id === message.messageId)
            if (idx > -1) {
                this.messageList[idx].recalled = true
                this.messageList[idx].status = 'recalled'
            }
        },

        handleReadReceipt(message) {
            if (message.conversationId !== this.conversationId) return

            if (message.messageIds) {
                message.messageIds.forEach(id => {
                    const idx = this.messageList.findIndex(m => m.id === id)
                    if (idx > -1 && this.messageList[idx].isSelf) {
                        this.messageList[idx].status = 'read'
                    }
                })
            } else if (message.messageId) {
                const idx = this.messageList.findIndex(m => m.id === message.messageId)
                if (idx > -1 && this.messageList[idx].isSelf) {
                    this.messageList[idx].status = 'read'
                }
            }
        },

        handleMessageAck(message) {
            if (message.conversationId !== this.conversationId) return

            const tempId = message.tempId
            const messageId = message.messageId

            if (tempId) {
                const idx = this.messageList.findIndex(m => m.id === tempId)
                if (idx > -1) {
                    if (messageId) {
                        this.messageList[idx].id = messageId
                    }
                    this.messageList[idx].status = message.status || 'sent'
                }
            }
        },

        async markUnreadMessagesAsRead(messages) {
            const unreadIds = messages
                .filter(msg => !msg.isSelf && msg.status !== 'read')
                .map(msg => msg.id)

            if (unreadIds.length === 0) return

            try {
                if (unreadIds.length === 1) {
                    socketManager.sendReadReceipt(this.conversationId, unreadIds[0])
                } else {
                    socketManager.sendBatchReadReceipt(this.conversationId, unreadIds)
                }

                await http.post('/api/chat/messages/batch-read', {
                    conversationId: this.conversationId,
                    messageIds: unreadIds
                })
            } catch (e) {
                console.error('Mark messages read failed:', e)
            }
        },

        async markSingleMessageAsRead(messageId) {
            try {
                socketManager.sendReadReceipt(this.conversationId, messageId)
                await http.post(`/api/chat/messages/${messageId}/read`)
            } catch (e) {
                console.error('Mark message read failed:', e)
            }
        },

        handleMessageLongPress(message) {
            if (!message.isSelf) return
            if (message.recalled) return

            const canRecall = Date.now() - new Date(message.timestamp).getTime() < RECALL_TIME_LIMIT
            if (!canRecall) {
                uni.showToast({
                    title: '超过2分钟无法撤回',
                    icon: 'none'
                })
                return
            }

            uni.showActionSheet({
                itemList: ['撤回'],
                success: (res) => {
                    if (res.tapIndex === 0) {
                        this.recallMessage(message)
                    }
                }
            })
        },

        async recallMessage(message) {
            try {
                await http.post('/api/chat/recall', {
                    conversationId: this.conversationId,
                    messageId: message.id
                })

                socketManager.recallMessage(this.conversationId, message.id)

                const idx = this.messageList.findIndex(m => m.id === message.id)
                if (idx > -1) {
                    this.messageList[idx].recalled = true
                    this.messageList[idx].status = 'recalled'
                }

                uni.showToast({
                    title: '已撤回',
                    icon: 'success'
                })
            } catch (e) {
                console.error('Recall message failed:', e)
                uni.showToast({
                    title: '撤回失败',
                    icon: 'none'
                })
            }
        },

        handleTypingStatus(message) {
            if (message.conversationId !== this.conversationId) return
            if (message.senderId === this.userStore.userInfo?.id) return

            this.isPeerTyping = message.isTyping
            if (message.isTyping) {
                this.scrollToBottom()
            }
        },

        handleOnlineStatus(message) {
            if (message.userId === this.peerId) {
                this.isPeerOnline = message.isOnline
            }
        },

        async sendTextMessage() {
            const content = this.inputMessage.trim()
            if (!content) return

            const tempMessage = this.createTempMessage(content, 'text')
            this.messageList.push(tempMessage)
            this.updateDateDividers()
            this.inputMessage = ''
            this.showEmoji = false
            this.showAdd = false

            this.$nextTick(() => {
                this.scrollToBottom()
            })

            const sent = socketManager.sendChatMessage(this.peerId, content, 'text', {
                conversationId: this.conversationId,
                tempId: tempMessage.id
            })

            if (!sent) {
                this.updateMessageStatus(tempMessage.id, 'failed')
                uni.showToast({
                    title: '发送失败，请检查网络',
                    icon: 'none'
                })
            }
        },

        createTempMessage(content, msgType, extra = {}) {
            return {
                id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                conversationId: this.conversationId,
                senderId: this.userStore.userInfo?.id,
                content,
                msgType,
                timestamp: Date.now(),
                status: 'sending',
                isSelf: true,
                ...extra
            }
        },

        updateMessageStatus(messageId, status) {
            const idx = this.messageList.findIndex(m => m.id === messageId)
            if (idx > -1) {
                this.messageList[idx].status = status
            }
        },

        onInputFocus() {
            this.showEmoji = false
            this.showAdd = false
            this.$nextTick(() => {
                this.scrollToBottom()
            })
        },

        onInputBlur() {
            this.sendTypingStatus(false)
        },

        onInputChange() {
            if (this.inputMessage.trim()) {
                this.sendTypingStatus(true)
            } else {
                this.sendTypingStatus(false)
            }
        },

        sendTypingStatus(isTyping) {
            if (this.typingTimer) {
                clearTimeout(this.typingTimer)
                this.typingTimer = null
            }

            socketManager.sendTypingStatus(this.conversationId, isTyping)

            if (isTyping) {
                this.typingTimer = setTimeout(() => {
                    socketManager.sendTypingStatus(this.conversationId, false)
                }, 3000)
            }
        },

        toggleVoiceMode() {
            this.isVoiceMode = !this.isVoiceMode
            this.showEmoji = false
            this.showAdd = false
        },

        startRecording() {
            if (!this.isVoiceMode) return

            this.isRecording = true
            this.recordingDuration = 0
            uni.vibrateShort({ type: 'light' })

            const recorderManager = uni.getRecorderManager()
            recorderManager.start({
                duration: RECORDING_MAX_DURATION,
                format: 'mp3'
            })

            this.recordingTimer = setInterval(() => {
                this.recordingDuration++
                if (this.recordingDuration >= RECORDING_MAX_DURATION) {
                    this.stopRecording()
                }
            }, 1000)
        },

        stopRecording() {
            if (!this.isRecording) return

            this.isRecording = false
            uni.vibrateShort({ type: 'light' })

            if (this.recordingTimer) {
                clearInterval(this.recordingTimer)
                this.recordingTimer = null
            }

            const recorderManager = uni.getRecorderManager()
            recorderManager.stop()

            if (this.recordingDuration < 1) {
                uni.showToast({
                    title: '说话时间太短',
                    icon: 'none'
                })
                return
            }

            recorderManager.onStop((res) => {
                this.sendVoiceMessage(res.tempFilePath, this.recordingDuration)
            })
        },

        async sendVoiceMessage(filePath, duration) {
            try {
                const uploadRes = await http.upload('/api/upload', filePath, 'file')
                if (uploadRes && uploadRes.url) {
                    const tempMessage = this.createTempMessage(uploadRes.url, 'voice', { duration })
                    this.messageList.push(tempMessage)
                    this.updateDateDividers()

                    this.$nextTick(() => {
                        this.scrollToBottom()
                    })

                    socketManager.sendChatMessage(this.peerId, uploadRes.url, 'voice', {
                        conversationId: this.conversationId,
                        duration,
                        tempId: tempMessage.id
                    })
                }
            } catch (e) {
                console.error('Send voice failed:', e)
                uni.showToast({
                    title: '发送失败',
                    icon: 'none'
                })
            }
        },

        playVoice(message) {
            message.playing = true
            const innerAudioContext = uni.createInnerAudioContext()
            innerAudioContext.src = message.content

            innerAudioContext.onEnded(() => {
                message.playing = false
            })

            innerAudioContext.onError(() => {
                message.playing = false
                uni.showToast({
                    title: '播放失败',
                    icon: 'none'
                })
            })

            innerAudioContext.play()
        },

        toggleEmojiPanel() {
            this.showEmoji = !this.showEmoji
            this.showAdd = false
            this.isVoiceMode = false
        },

        insertEmoji(emoji) {
            this.inputMessage += emoji
        },

        deleteEmoji() {
            if (this.inputMessage.length > 0) {
                this.inputMessage = this.inputMessage.slice(0, -1)
            }
        },

        showAddMenu() {
            this.showAdd = !this.showAdd
            this.showEmoji = false
        },

        chooseImage() {
            uni.chooseImage({
                count: 9,
                sizeType: ['compressed'],
                sourceType: ['album', 'camera'],
                success: async (res) => {
                    this.showAdd = false

                    for (const filePath of res.tempFilePaths) {
                        try {
                            const uploadRes = await http.upload('/api/upload', filePath, 'file')
                            if (uploadRes && uploadRes.url) {
                                const tempMessage = this.createTempMessage(uploadRes.url, 'image')
                                this.messageList.push(tempMessage)

                                socketManager.sendChatMessage(this.peerId, uploadRes.url, 'image', {
                                    conversationId: this.conversationId,
                                    tempId: tempMessage.id
                                })
                            }
                        } catch (e) {
                            console.error('Upload image failed:', e)
                        }
                    }

                    this.updateDateDividers()
                    this.$nextTick(() => {
                        this.scrollToBottom()
                    })
                }
            })
        },

        chooseLocation() {
            uni.chooseLocation({
                success: (res) => {
                    this.showAdd = false
                    const locationData = {
                        title: res.name,
                        address: res.address,
                        latitude: res.latitude,
                        longitude: res.longitude
                    }

                    const tempMessage = this.createTempMessage(locationData, 'location')
                    this.messageList.push(tempMessage)
                    this.updateDateDividers()

                    this.$nextTick(() => {
                        this.scrollToBottom()
                    })

                    socketManager.sendChatMessage(this.peerId, locationData, 'location', {
                        conversationId: this.conversationId,
                        tempId: tempMessage.id
                    })
                },
                fail: (err) => {
                    console.error('Choose location failed:', err)
                }
            })
        },

        chooseItem() {
            uni.showToast({
                title: '请从物品详情页分享',
                icon: 'none'
            })
        },

        async sendItemCard(itemData) {
            const itemCardData = {
                id: itemData.id,
                title: itemData.title,
                price: itemData.price,
                originalPrice: itemData.originalPrice,
                coverImage: itemData.coverImage,
                tags: itemData.tags || []
            }

            const tempMessage = this.createTempMessage(itemCardData, 'item_card')
            this.messageList.push(tempMessage)
            this.updateDateDividers()
            this.showAdd = false

            this.$nextTick(() => {
                this.scrollToBottom()
            })

            socketManager.sendChatMessage(this.peerId, itemCardData, 'item_card', {
                conversationId: this.conversationId,
                tempId: tempMessage.id
            })
        },

        previewImage(url) {
            uni.previewImage({
                urls: [url],
                current: url
            })
        },

        scrollToBottom() {
            this.$nextTick(() => {
                if (this.messageList.length > 0) {
                    const lastMsg = this.messageList[this.messageList.length - 1]
                    this.scrollToId = ''
                    setTimeout(() => {
                        this.scrollToId = 'msg-' + lastMsg.id
                    }, 50)
                }
            })
        },

        showMoreOptions() {
            uni.showActionSheet({
                itemList: ['查看资料', '搜索聊天记录', '清空聊天记录'],
                success: (res) => {
                    if (res.tapIndex === 0) {
                        uni.showToast({
                            title: '查看资料',
                            icon: 'none'
                        })
                    } else if (res.tapIndex === 1) {
                        uni.showToast({
                            title: '搜索聊天记录',
                            icon: 'none'
                        })
                    } else if (res.tapIndex === 2) {
                        this.clearChatHistory()
                    }
                }
            })
        },

        clearChatHistory() {
            uni.showModal({
                title: '清空聊天记录',
                content: '确定要清空所有聊天记录吗？',
                success: (res) => {
                    if (res.confirm) {
                        this.messageList = []
                        this.dateDividers = []
                        uni.showToast({
                            title: '已清空',
                            icon: 'success'
                        })
                    }
                }
            })
        },

        goBack() {
            uni.navigateBack()
        }
    }
}
</script>

<style lang="scss" scoped>
.chat-room-page {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: #f5f5f5;
}

.page-header {
    display: flex;
    align-items: center;
    padding: 20rpx 30rpx;
    padding-top: 60rpx;
    background: #ffffff;
    gap: 20rpx;
}

.back-btn {
    width: 60rpx;
    height: 60rpx;
    display: flex;
    align-items: center;
    justify-content: center;
}

.back-icon {
    font-size: 48rpx;
    color: #333;
}

.header-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.peer-name {
    font-size: 34rpx;
    font-weight: 600;
    color: #333;
}

.peer-status {
    font-size: 22rpx;
    color: #07c160;
}

.header-actions {
    width: 60rpx;
    display: flex;
    justify-content: flex-end;
}

.action-btn {
    width: 60rpx;
    height: 60rpx;
    display: flex;
    align-items: center;
    justify-content: center;
}

.action-icon {
    font-size: 40rpx;
    color: #333;
}

.status-bar {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12rpx;
    padding: 12rpx;
    background: #fff8e1;
}

.status-icon {
    font-size: 28rpx;
}

.status-text {
    font-size: 24rpx;
    color: #f57c00;
}

.message-list {
    flex: 1;
    padding: 20rpx;
}

.message-list-inner {
    display: flex;
    flex-direction: column;
    gap: 20rpx;
}

.load-more-tip {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12rpx;
    padding: 20rpx;
}

.spinner-small {
    width: 32rpx;
    height: 32rpx;
    border: 3rpx solid rgba(102, 126, 234, 0.2);
    border-top-color: #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

.tip-text {
    font-size: 24rpx;
    color: #999;
}

.date-divider {
    display: flex;
    justify-content: center;
    padding: 16rpx 0;
}

.divider-text {
    font-size: 22rpx;
    color: #999;
    padding: 6rpx 20rpx;
    background: rgba(0, 0, 0, 0.08);
    border-radius: 20rpx;
}

.message-item {
    display: flex;
    gap: 16rpx;
    max-width: 85%;

    &.is-self {
        align-self: flex-end;
        flex-direction: row-reverse;

        .message-avatar {
            align-self: flex-start;
        }

        .message-content-wrapper {
            align-items: flex-end;
        }

        .message-bubble {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

            .message-text {
                color: #ffffff;
            }
        }
    }

    &.is-received {
        align-self: flex-start;

        .message-bubble {
            background: #ffffff;

            .message-text {
                color: #333;
            }
        }
    }
}

.message-avatar {
    width: 72rpx;
    height: 72rpx;
    border-radius: 50%;
    background: #f0f0f0;
    flex-shrink: 0;
}

.message-content-wrapper {
    display: flex;
    flex-direction: column;
    max-width: 100%;
}

.message-bubble-wrapper {
    max-width: 100%;
}

.message-bubble {
    padding: 20rpx 24rpx;
    border-radius: 24rpx;
    max-width: 100%;
    word-break: break-word;

    &.failed {
        opacity: 0.6;
    }

    &.type-system {
        background: transparent;
        padding: 0;
    }
}

.message-text {
    font-size: 28rpx;
    line-height: 1.6;
}

.system-message {
    font-size: 24rpx;
    color: #999;
}

.message-image {
    max-width: 400rpx;
    border-radius: 12rpx;
}

.voice-bubble {
    display: flex;
    align-items: center;
    gap: 12rpx;
    min-width: 160rpx;
    max-width: 300rpx;
}

.voice-icon {
    font-size: 32rpx;
}

.voice-wave {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 4rpx;
    height: 32rpx;
}

.wave-bar {
    flex: 1;
    height: 50%;
    background: rgba(255, 255, 255, 0.4);
    border-radius: 2rpx;

    .is-received & {
        background: rgba(102, 126, 234, 0.2);
    }
}

.voice-duration {
    font-size: 24rpx;
    color: rgba(255, 255, 255, 0.8);

    .is-received & {
        color: #999;
    }
}

.location-bubble {
    display: flex;
    align-items: center;
    gap: 16rpx;
    min-width: 240rpx;
}

.location-icon {
    font-size: 40rpx;
    flex-shrink: 0;
}

.location-info {
    display: flex;
    flex-direction: column;
    gap: 4rpx;
}

.location-title {
    font-size: 28rpx;
    font-weight: 500;
    color: inherit;
}

.location-address {
    font-size: 22rpx;
    color: rgba(255, 255, 255, 0.8);

    .is-received & {
        color: #999;
    }
}

.message-meta {
    display: flex;
    align-items: center;
    gap: 8rpx;
    margin-top: 8rpx;
    padding: 0 8rpx;
}

.message-time {
    font-size: 20rpx;
    color: #999;
}

.message-status {
    display: flex;
    align-items: center;

    .status-icon {
        font-size: 20rpx;
        color: #999;

        &.read {
            color: #667eea;
        }
    }
}

.typing-indicator {
    align-self: flex-start;
    padding: 12rpx 20rpx;
    margin-left: 88rpx;
}

.typing-text {
    font-size: 24rpx;
    color: #999;
}

.input-bar {
    display: flex;
    align-items: flex-end;
    padding: 16rpx 20rpx;
    padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
    background: #ffffff;
    border-top: 1rpx solid #f0f0f0;
    gap: 12rpx;
}

.voice-btn,
.emoji-btn,
.add-btn {
    width: 72rpx;
    height: 72rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.voice-icon,
.emoji-icon,
.add-icon {
    font-size: 40rpx;
}

.add-icon {
    font-size: 48rpx;
    color: #667eea;
}

.message-input {
    flex: 1;
    min-height: 72rpx;
    max-height: 200rpx;
    padding: 0 24rpx;
    background: #f5f5f5;
    border-radius: 36rpx;
    font-size: 28rpx;
    color: #333;
}

.voice-input {
    flex: 1;
    height: 72rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f5f5f5;
    border-radius: 36rpx;
    border: 2rpx solid #e0e0e0;
}

.voice-text {
    font-size: 28rpx;
    color: #666;
}

.send-btn {
    min-width: 120rpx;
    height: 72rpx;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 36rpx;
    border: none;

    &::after { border: none; }
}

.send-text {
    font-size: 28rpx;
    color: #ffffff;
    font-weight: 500;
}

.emoji-panel {
    background: #ffffff;
    border-top: 1rpx solid #f0f0f0;
    padding: 20rpx;
    padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
}

.emoji-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 16rpx;
    margin-bottom: 16rpx;
}

.emoji-item {
    width: calc((100% - 112rpx) / 8);
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8rpx;

    &:active {
        background: #f5f5f5;
    }
}

.emoji-text {
    font-size: 40rpx;
}

.emoji-actions {
    display: flex;
    justify-content: flex-end;
}

.emoji-delete {
    padding: 12rpx 24rpx;
    background: #f5f5f5;
    border-radius: 8rpx;
}

.delete-text {
    font-size: 32rpx;
}

.add-menu {
    background: #ffffff;
    border-top: 1rpx solid #f0f0f0;
    padding: 30rpx;
    padding-bottom: calc(30rpx + env(safe-area-inset-bottom));
}

.menu-grid {
    display: flex;
    gap: 40rpx;
}

.menu-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12rpx;
}

.menu-icon {
    width: 100rpx;
    height: 100rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f5f5f5;
    border-radius: 20rpx;
    font-size: 48rpx;
}

.menu-label {
    font-size: 24rpx;
    color: #666;
}
</style>
