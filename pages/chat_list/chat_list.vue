<template>
    <view class="chat-list-page">
        <view class="page-header">
            <text class="header-title">消息</text>
            <view class="header-actions">
                <view class="action-btn" @click="handleScan">
                    <text class="action-icon">📱</text>
                </view>
            </view>
        </view>

        <view class="status-bar" v-if="!isConnected">
            <text class="status-icon">🔌</text>
            <text class="status-text">连接断开，正在重连...</text>
        </view>

        <view class="conversation-list" v-if="conversationList.length > 0">
            <view
                class="conversation-item"
                v-for="conversation in sortedConversationList"
                :key="conversation.id"
                @click="openChatRoom(conversation)"
                @longpress="handleLongPress(conversation)"
            >
                <view class="avatar-wrapper">
                    <image
                        class="avatar"
                        :src="conversation.peerAvatar || '/static/default_avatar.png'"
                        mode="aspectFill"
                    />
                    <view class="unread-badge" v-if="conversation.unreadCount > 0">
                        <text class="badge-text">{{ conversation.unreadCount > 99 ? '99+' : conversation.unreadCount }}</text>
                    </view>
                    <view class="online-indicator" v-if="conversation.isOnline"></view>
                </view>

                <view class="conversation-content">
                    <view class="content-header">
                        <text class="peer-name">{{ conversation.peerName }}</text>
                        <text class="last-time">{{ formatTime(conversation.lastMessageTime) }}</text>
                    </view>
                    <view class="content-body">
                        <text class="last-message" :class="{ 'has-unread': conversation.unreadCount > 0 }">
                            {{ getMessagePreview(conversation.lastMessage) }}
                        </text>
                        <view class="extra-icons" v-if="conversation.lastMessage?.status === 'sending'">
                            <text class="sending-icon">⏳</text>
                        </view>
                        <view class="extra-icons" v-else-if="conversation.lastMessage?.status === 'failed'">
                            <text class="failed-icon">❗</text>
                        </view>
                        <view class="mute-icon" v-if="conversation.isMuted">
                            <text class="mute-text">🔇</text>
                        </view>
                    </view>
                </view>
            </view>
        </view>

        <view class="empty-state" v-else-if="!loading">
            <text class="empty-icon">💬</text>
            <text class="empty-title">暂无消息</text>
            <text class="empty-desc">去逛逛发现有趣的物品吧</text>
            <button class="explore-btn" @click="goExplore">
                <text class="btn-text">去逛逛</text>
            </button>
        </view>

        <view class="loading-state" v-if="loading">
            <view class="spinner"></view>
            <text class="loading-text">加载中...</text>
        </view>

        <view class="action-sheet" v-if="showActionSheet" @click="closeActionSheet">
            <view class="action-sheet-content" @click.stop>
                <view class="action-item" @click="handleMarkAsRead">
                    <text class="action-text">{{ selectedConversation?.unreadCount > 0 ? '标记为已读' : '标记为未读' }}</text>
                </view>
                <view class="action-item" @click="handleToggleMute">
                    <text class="action-text">{{ selectedConversation?.isMuted ? '取消免打扰' : '开启免打扰' }}</text>
                </view>
                <view class="action-item danger" @click="handleDeleteConversation">
                    <text class="action-text">删除会话</text>
                </view>
                <view class="action-item cancel" @click="closeActionSheet">
                    <text class="action-text">取消</text>
                </view>
            </view>
        </view>
    </view>
</template>

<script>
import http from '@/common/interceptor.js'
import socketManager from '@/common/SocketManager.js'
import { useUserStore } from '@/store/user.js'

export default {
    name: 'ChatList',
    data() {
        return {
            conversationList: [],
            loading: false,
            isConnected: false,
            showActionSheet: false,
            selectedConversation: null,
            messageUnsubscribe: null,
            globalUnsubscribe: null
        }
    },
    computed: {
        userStore() {
            return useUserStore()
        },
        sortedConversationList() {
            return [...this.conversationList].sort((a, b) => {
                return new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
            })
        }
    },
    onLoad() {
        this.initConnection()
        this.loadConversationList()
    },
    onShow() {
        if (this.userStore.isLoggedIn) {
            this.loadConversationList()
        }
    },
    onUnload() {
        this.removeListeners()
    },
    methods: {
        async initConnection() {
            if (!this.userStore.isLoggedIn) return

            try {
                await socketManager.connect()
                this.isConnected = true
            } catch (e) {
                console.error('Connect failed:', e)
                this.isConnected = false
            }

            this.messageUnsubscribe = socketManager.addGlobalListener((message) => {
                this.handleSocketMessage(message)
            })
        },

        removeListeners() {
            if (this.messageUnsubscribe) {
                this.messageUnsubscribe()
                this.messageUnsubscribe = null
            }
        },

        handleSocketMessage(message) {
            if (message.type === 'system') {
                if (message.event === 'connected') {
                    this.isConnected = true
                } else if (message.event === 'closed' || message.event === 'error') {
                    this.isConnected = false
                }
                return
            }

            if (message.type === 'chat_message') {
                this.updateConversationWithMessage(message)
            }

            if (message.type === 'unread_count') {
                this.updateUnreadCount(message)
            }
        },

        async loadConversationList() {
            if (!this.userStore.isLoggedIn) {
                uni.showModal({
                    title: '需要登录',
                    content: '请先登录后查看消息',
                    confirmText: '去登录',
                    cancelText: '取消',
                    success: (res) => {
                        if (res.confirm) {
                            uni.navigateTo({ url: '/pages/login/login' })
                        }
                    }
                })
                return
            }

            this.loading = true
            try {
                const res = await http.get('/api/chat/conversations')
                if (res && res.list) {
                    this.conversationList = res.list
                }
            } catch (error) {
                console.error('Load conversation list failed:', error)
                this.loadMockData()
            } finally {
                this.loading = false
            }
        },

        loadMockData() {
            this.conversationList = [
                {
                    id: 'conv_001',
                    peerId: 'user_001',
                    peerName: '数码爱好者',
                    peerAvatar: '',
                    lastMessage: {
                        type: 'text',
                        content: '请问这个手机还在吗？',
                        status: 'read',
                        senderId: 'user_001'
                    },
                    lastMessageTime: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
                    unreadCount: 2,
                    isOnline: true,
                    isMuted: false
                },
                {
                    id: 'conv_002',
                    peerId: 'user_002',
                    peerName: '闲置达人',
                    peerAvatar: '',
                    lastMessage: {
                        type: 'image',
                        content: '[图片]',
                        status: 'read',
                        senderId: 'me'
                    },
                    lastMessageTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                    unreadCount: 0,
                    isOnline: false,
                    isMuted: true
                },
                {
                    id: 'conv_003',
                    peerId: 'user_003',
                    peerName: '小明同学',
                    peerAvatar: '',
                    lastMessage: {
                        type: 'text',
                        content: '好的，那我们约在周末见面交换吧',
                        status: 'sent',
                        senderId: 'me'
                    },
                    lastMessageTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                    unreadCount: 0,
                    isOnline: false,
                    isMuted: false
                }
            ]
        },

        updateConversationWithMessage(message) {
            const conversationId = message.conversationId || this.generateConversationId(message.senderId, message.receiverId)
            const idx = this.conversationList.findIndex(c => c.id === conversationId)

            const conversation = idx > -1 ? this.conversationList[idx] : {
                id: conversationId,
                peerId: message.senderId,
                peerName: message.senderName || '用户',
                peerAvatar: message.senderAvatar || '',
                unreadCount: 0,
                isOnline: false,
                isMuted: false
            }

            conversation.lastMessage = {
                type: message.msgType || 'text',
                content: message.content,
                status: message.status || 'received',
                senderId: message.senderId
            }
            conversation.lastMessageTime = new Date(message.timestamp || Date.now()).toISOString()

            if (message.senderId !== this.userStore.userInfo?.id) {
                conversation.unreadCount = (conversation.unreadCount || 0) + 1
            }

            if (idx > -1) {
                this.conversationList.splice(idx, 1, conversation)
            } else {
                this.conversationList.unshift(conversation)
            }
        },

        updateUnreadCount(message) {
            const idx = this.conversationList.findIndex(c => c.id === message.conversationId)
            if (idx > -1) {
                this.conversationList[idx].unreadCount = message.count || 0
            }
        },

        generateConversationId(userId1, userId2) {
            const currentUserId = this.userStore.userInfo?.id || ''
            const otherId = userId1 === currentUserId ? userId2 : userId1
            return `conv_${currentUserId}_${otherId}`
        },

        getMessagePreview(message) {
            if (!message) return ''

            if (message.senderId !== this.userStore.userInfo?.id) {
                if (message.status === 'sending') return '发送中...'
                if (message.status === 'failed') return '发送失败'
            }

            switch (message.type) {
                case 'text':
                    return message.content.length > 30 ? message.content.substring(0, 30) + '...' : message.content
                case 'image':
                    return '[图片]'
                case 'voice':
                    return '[语音]'
                case 'video':
                    return '[视频]'
                case 'location':
                    return '[位置]'
                case 'system':
                    return message.content
                default:
                    return '[消息]'
            }
        },

        formatTime(isoTime) {
            if (!isoTime) return ''

            const date = new Date(isoTime)
            const now = new Date()
            const diff = now - date

            const oneMinute = 60 * 1000
            const oneHour = 60 * oneMinute
            const oneDay = 24 * oneHour
            const oneWeek = 7 * oneDay

            if (diff < oneMinute) {
                return '刚刚'
            } else if (diff < oneHour) {
                return `${Math.floor(diff / oneMinute)}分钟前`
            } else if (diff < oneDay) {
                return `${Math.floor(diff / oneHour)}小时前`
            } else if (diff < oneWeek) {
                return `${Math.floor(diff / oneDay)}天前`
            } else {
                const month = date.getMonth() + 1
                const day = date.getDate()
                return `${month}/${day}`
            }
        },

        openChatRoom(conversation) {
            if (conversation.unreadCount > 0) {
                this.markAsRead(conversation.id)
            }

            uni.navigateTo({
                url: `/pages/chat_room/chat_room?peerId=${conversation.peerId}&peerName=${encodeURIComponent(conversation.peerName)}&peerAvatar=${encodeURIComponent(conversation.peerAvatar || '')}`
            })
        },

        async markAsRead(conversationId) {
            const idx = this.conversationList.findIndex(c => c.id === conversationId)
            if (idx > -1) {
                this.conversationList[idx].unreadCount = 0
            }

            try {
                await http.post('/api/chat/conversations/' + conversationId + '/read')
            } catch (e) {
                console.error('Mark as read failed:', e)
            }
        },

        handleLongPress(conversation) {
            this.selectedConversation = conversation
            this.showActionSheet = true
        },

        closeActionSheet() {
            this.showActionSheet = false
            this.selectedConversation = null
        },

        handleMarkAsRead() {
            if (!this.selectedConversation) return

            if (this.selectedConversation.unreadCount > 0) {
                this.markAsRead(this.selectedConversation.id)
            } else {
                const idx = this.conversationList.findIndex(c => c.id === this.selectedConversation.id)
                if (idx > -1) {
                    this.conversationList[idx].unreadCount = 1
                }
            }
            this.closeActionSheet()
        },

        handleToggleMute() {
            if (!this.selectedConversation) return

            const idx = this.conversationList.findIndex(c => c.id === this.selectedConversation.id)
            if (idx > -1) {
                this.conversationList[idx].isMuted = !this.conversationList[idx].isMuted
            }
            this.closeActionSheet()
        },

        handleDeleteConversation() {
            if (!this.selectedConversation) return

            uni.showModal({
                title: '删除会话',
                content: '确定要删除该会话吗？',
                success: (res) => {
                    if (res.confirm) {
                        const idx = this.conversationList.findIndex(c => c.id === this.selectedConversation.id)
                        if (idx > -1) {
                            this.conversationList.splice(idx, 1)
                        }
                    }
                    this.closeActionSheet()
                }
            })
        },

        handleScan() {
            uni.showToast({
                title: '扫一扫功能开发中',
                icon: 'none'
            })
        },

        goExplore() {
            uni.switchTab({ url: '/pages/index/index' })
        }
    }
}
</script>

<style lang="scss" scoped>
.chat-list-page {
    min-height: 100vh;
    background: #f5f5f5;
}

.page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20rpx 30rpx;
    padding-top: 60rpx;
    background: #ffffff;
    position: sticky;
    top: 0;
    z-index: 100;
}

.header-title {
    font-size: 36rpx;
    font-weight: 600;
    color: #333;
}

.header-actions {
    display: flex;
    gap: 30rpx;
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

.conversation-list {
    background: #ffffff;
}

.conversation-item {
    display: flex;
    align-items: center;
    padding: 24rpx 30rpx;
    gap: 24rpx;
    border-bottom: 1rpx solid #f0f0f0;

    &:active {
        background: #f9f9f9;
    }
}

.avatar-wrapper {
    position: relative;
    flex-shrink: 0;
}

.avatar {
    width: 96rpx;
    height: 96rpx;
    border-radius: 50%;
    background: #f0f0f0;
}

.unread-badge {
    position: absolute;
    top: -8rpx;
    right: -8rpx;
    min-width: 36rpx;
    height: 36rpx;
    padding: 0 8rpx;
    background: #ff4757;
    border-radius: 18rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2rpx solid #ffffff;
}

.badge-text {
    font-size: 20rpx;
    color: #ffffff;
    font-weight: 500;
}

.online-indicator {
    position: absolute;
    bottom: 4rpx;
    right: 4rpx;
    width: 20rpx;
    height: 20rpx;
    background: #07c160;
    border-radius: 50%;
    border: 2rpx solid #ffffff;
}

.conversation-content {
    flex: 1;
    min-width: 0;
}

.content-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12rpx;
}

.peer-name {
    font-size: 30rpx;
    font-weight: 500;
    color: #333;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 400rpx;
}

.last-time {
    font-size: 22rpx;
    color: #999;
    flex-shrink: 0;
}

.content-body {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12rpx;
}

.last-message {
    flex: 1;
    font-size: 26rpx;
    color: #999;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    &.has-unread {
        color: #333;
        font-weight: 500;
    }
}

.extra-icons {
    flex-shrink: 0;
}

.sending-icon,
.failed-icon {
    font-size: 28rpx;
}

.mute-icon {
    flex-shrink: 0;
}

.mute-text {
    font-size: 28rpx;
}

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 120rpx 40rpx;
    background: #ffffff;
}

.empty-icon {
    font-size: 120rpx;
    margin-bottom: 30rpx;
    opacity: 0.5;
}

.empty-title {
    font-size: 32rpx;
    color: #333;
    margin-bottom: 12rpx;
}

.empty-desc {
    font-size: 26rpx;
    color: #999;
    margin-bottom: 40rpx;
}

.explore-btn {
    min-width: 200rpx;
    height: 72rpx;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 36rpx;
    border: none;

    &::after { border: none; }
}

.explore-btn .btn-text {
    font-size: 26rpx;
    color: #ffffff;
    font-weight: 500;
}

.loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 120rpx;
    background: #ffffff;
}

.spinner {
    width: 60rpx;
    height: 60rpx;
    border: 4rpx solid rgba(102, 126, 234, 0.2);
    border-top-color: #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 20rpx;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

.loading-text {
    font-size: 26rpx;
    color: #999;
}

.action-sheet {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: flex-end;
    z-index: 1000;
}

.action-sheet-content {
    width: 100%;
    background: #ffffff;
    border-radius: 20rpx 20rpx 0 0;
    padding-bottom: env(safe-area-inset-bottom);
}

.action-item {
    padding: 30rpx;
    text-align: center;
    border-bottom: 1rpx solid #f0f0f0;

    &.danger .action-text {
        color: #ff4757;
    }

    &.cancel {
        background: #f5f5f5;
        border-bottom: none;
    }
}

.action-text {
    font-size: 30rpx;
    color: #333;
}
</style>
