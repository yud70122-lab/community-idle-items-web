<template>
    <view class="setting-page">
        <view class="page-header">
            <text class="page-title">设置</text>
        </view>

        <view class="setting-list">
            <view class="setting-group">
                <view class="group-title">
                    <text class="group-title-text">账号设置</text>
                </view>

                <view class="setting-item" @click="goToEditProfile">
                    <view class="item-left">
                        <text class="item-icon">👤</text>
                        <text class="item-label">个人资料</text>
                    </view>
                    <view class="item-right">
                        <text class="item-arrow">›</text>
                    </view>
                </view>

                <view class="setting-item" @click="goToPrivacy">
                    <view class="item-left">
                        <text class="item-icon">🔒</text>
                        <text class="item-label">隐私设置</text>
                    </view>
                    <view class="item-right">
                        <text class="item-arrow">›</text>
                    </view>
                </view>

                <view class="setting-item" @click="goToSecurity">
                    <view class="item-left">
                        <text class="item-icon">🛡️</text>
                        <text class="item-label">账号安全</text>
                    </view>
                    <view class="item-right">
                        <text class="item-arrow">›</text>
                    </view>
                </view>
            </view>

            <view class="setting-group">
                <view class="group-title">
                    <text class="group-title-text">通用设置</text>
                </view>

                <view class="setting-item" @click="goToNotification">
                    <view class="item-left">
                        <text class="item-icon">🔔</text>
                        <text class="item-label">消息通知</text>
                    </view>
                    <view class="item-right">
                        <text class="item-arrow">›</text>
                    </view>
                </view>

                <view class="setting-item" @click="goToTheme">
                    <view class="item-left">
                        <text class="item-icon">🎨</text>
                        <text class="item-label">主题设置</text>
                    </view>
                    <view class="item-right">
                        <text class="item-arrow">›</text>
                    </view>
                </view>

                <view class="setting-item">
                    <view class="item-left">
                        <text class="item-icon">🌐</text>
                        <text class="item-label">语言</text>
                    </view>
                    <view class="item-right">
                        <text class="item-value">简体中文</text>
                        <text class="item-arrow">›</text>
                    </view>
                </view>
            </view>

            <view class="setting-group">
                <view class="group-title">
                    <text class="group-title-text">存储管理</text>
                </view>

                <view class="setting-item" @click="calculateCache">
                    <view class="item-left">
                        <text class="item-icon">📦</text>
                        <text class="item-label">当前缓存</text>
                    </view>
                    <view class="item-right">
                        <text class="item-value" :class="{ 'calculating': calculatingCache }">
                            {{ cacheDisplayText }}
                        </text>
                    </view>
                </view>

                <view class="setting-item danger" @click="handleClearCache">
                    <view class="item-left">
                        <text class="item-icon">🗑️</text>
                        <text class="item-label">清除缓存</text>
                    </view>
                    <view class="item-right">
                        <text class="item-arrow">›</text>
                    </view>
                </view>
            </view>

            <view class="setting-group">
                <view class="group-title">
                    <text class="group-title-text">关于</text>
                </view>

                <view class="setting-item" @click="goToAbout">
                    <view class="item-left">
                        <text class="item-icon">ℹ️</text>
                        <text class="item-label">关于我们</text>
                    </view>
                    <view class="item-right">
                        <text class="item-arrow">›</text>
                    </view>
                </view>

                <view class="setting-item">
                    <view class="item-left">
                        <text class="item-icon">📋</text>
                        <text class="item-label">版本号</text>
                    </view>
                    <view class="item-right">
                        <text class="item-value">v1.0.0</text>
                    </view>
                </view>
            </view>
        </view>

        <view class="bottom-action">
            <button class="logout-btn" @click="handleLogout">
                <text class="btn-text">退出登录</text>
            </button>
        </view>

        <view class="modal-overlay" v-if="showClearModal" @click.self="showClearModal = false">
            <view class="clear-modal">
                <view class="modal-header">
                    <text class="modal-title">清除缓存</text>
                    <view class="close-btn" @click="showClearModal = false">
                        <text class="close-icon">×</text>
                    </view>
                </view>

                <view class="modal-body">
                    <view class="cache-info">
                        <text class="cache-label">当前缓存大小</text>
                        <text class="cache-size">{{ cacheDisplayText }}</text>
                    </view>

                    <view class="cache-breakdown" v-if="cacheBreakdown.length > 0">
                        <text class="breakdown-title">缓存明细</text>
                        <view v-for="(item, index) in cacheBreakdown" :key="index" class="breakdown-item">
                            <text class="breakdown-name">{{ item.name }}</text>
                            <text class="breakdown-size">{{ item.sizeText }}</text>
                        </view>
                    </view>

                    <view class="warning-tip">
                        <text class="warning-icon">⚠️</text>
                        <text class="warning-text">清除缓存将删除本地临时文件、图片缓存等，不会影响您的账号数据</text>
                    </view>
                </view>

                <view class="modal-footer">
                    <button class="cancel-btn" @click="showClearModal = false">
                        <text class="btn-text">取消</text>
                    </button>
                    <button class="confirm-btn danger" :loading="clearingCache" @click="confirmClearCache">
                        <text class="btn-text">确认清除</text>
                    </button>
                </view>
            </view>
        </view>
    </view>
</template>

<script>
export default {
    data() {
        return {
            cacheSize: 0,
            cacheDisplayText: '计算中...',
            calculatingCache: false,
            clearingCache: false,
            showClearModal: false,
            cacheBreakdown: []
        }
    },

    onLoad() {
        this.calculateCache()
    },

    onShow() {
        this.calculateCache()
    },

    methods: {
        calculateCache() {
            if (this.calculatingCache) return

            this.calculatingCache = true
            this.cacheDisplayText = '计算中...'

            try {
                const storageInfo = uni.getStorageInfoSync()

                let totalSize = storageInfo.currentSize || 0

                // keys
                const keys = storageInfo.keys || []
                const breakdown = []

                keys.forEach((key) => {
                    try {
                        const value = uni.getStorageSync(key)
                        if (value !== undefined && value !== null) {
                            const itemSize = this.estimateSize(value)
                            breakdown.push({
                                key,
                                name: this.formatKeyName(key),
                                size: itemSize,
                                sizeText: this.formatFileSize(itemSize)
                            })
                        }
                    } catch (e) {
                        console.warn('Get storage item failed:', key, e)
                    }
                })

                // #ifdef H5
                if (window && window.performance && window.performance.memory) {
                    totalSize = Math.max(totalSize, window.performance.memory.usedJSHeapSize / 1024)
                }
                // #endif

                // #ifdef APP-PLUS
                try {
                    plus.cache.calculate((size) => {
                        totalSize = Math.max(totalSize, size / 1024)
                        this.cacheSize = totalSize
                        this.cacheDisplayText = this.formatFileSize(totalSize)
                        this.calculatingCache = false
                    })
                } catch (e) {
                    this.cacheSize = totalSize
                    this.cacheDisplayText = this.formatFileSize(totalSize)
                    this.calculatingCache = false
                }
                // #endif

                // #ifndef APP-PLUS
                this.cacheSize = totalSize
                this.cacheDisplayText = this.formatFileSize(totalSize)
                this.calculatingCache = false
                // #endif

                breakdown.sort((a, b) => b.size - a.size)
                this.cacheBreakdown = breakdown.slice(0, 5)

            } catch (error) {
                console.error('Calculate cache failed:', error)
                this.cacheDisplayText = '计算失败'
                this.calculatingCache = false
            }
        },

        estimateSize(value) {
            if (typeof value === 'string') {
                return value.length * 2 / 1024
            } else if (typeof value === 'object' && value !== null) {
                try {
                    return JSON.stringify(value).length * 2 / 1024
                } catch (e) {
                    return 0
                }
            } else if (Array.isArray(value)) {
                return value.reduce((sum, item) => sum + this.estimateSize(item), 0)
            }
            return 0.5
        },

        formatKeyName(key) {
            const nameMap = {
                'user_info': '用户信息',
                'token': '登录凭证',
                'search_history': '搜索历史',
                'browse_history': '浏览记录',
                'collect_list': '收藏列表',
                'theme_setting': '主题设置',
                'language': '语言设置',
                'notification_setting': '通知设置',
                'cache_config': '缓存配置'
            }
            return nameMap[key] || key
        },

        formatFileSize(kilobytes) {
            if (kilobytes < 0) return '0 KB'
            if (kilobytes < 1024) {
                return kilobytes.toFixed(2) + ' KB'
            } else if (kilobytes < 1024 * 1024) {
                return (kilobytes / 1024).toFixed(2) + ' MB'
            } else {
                return (kilobytes / (1024 * 1024)).toFixed(2) + ' GB'
            }
        },

        handleClearCache() {
            if (this.calculatingCache) {
                uni.showToast({ title: '正在计算缓存大小...', icon: 'none' })
                return
            }
            this.calculateCache()
            this.showClearModal = true
        },

        confirmClearCache() {
            if (this.clearingCache) return

            this.clearingCache = true

            setTimeout(() => {
                try {
                    uni.clearStorageSync()

                    // #ifdef APP-PLUS
                    try {
                        plus.cache.clear(() => {
                            this.onClearSuccess()
                        }, () => {
                            this.onClearSuccess()
                        })
                    } catch (e) {
                        this.onClearSuccess()
                    }
                    // #endif

                    // #ifndef APP-PLUS
                    this.onClearSuccess()
                    // #endif

                } catch (error) {
                    console.error('Clear cache failed:', error)
                    uni.showToast({
                        title: '清除失败，请重试',
                        icon: 'none'
                    })
                    this.clearingCache = false
                }
            }, 800)
        },

        onClearSuccess() {
            this.cacheSize = 0
            this.cacheDisplayText = '0 KB'
            this.cacheBreakdown = []
            this.clearingCache = false
            this.showClearModal = false

            uni.showToast({
                title: '缓存已清除',
                icon: 'success',
                duration: 1500
            })
        },

        goToEditProfile() {
            uni.navigateTo({ url: '/pages/profile_edit/profile_edit' })
        },

        goToPrivacy() {
            uni.showToast({ title: '隐私设置', icon: 'none' })
        },

        goToSecurity() {
            uni.showToast({ title: '账号安全', icon: 'none' })
        },

        goToNotification() {
            uni.showToast({ title: '消息通知', icon: 'none' })
        },

        goToTheme() {
            uni.showToast({ title: '主题设置', icon: 'none' })
        },

        goToAbout() {
            uni.showToast({ title: '关于我们', icon: 'none' })
        },

        handleLogout() {
            uni.showModal({
                title: '退出登录',
                content: '确定要退出当前账号吗？',
                success: (res) => {
                    if (res.confirm) {
                        try {
                            uni.clearStorageSync()
                            uni.reLaunch({ url: '/pages/login/login' })
                        } catch (e) {
                            uni.reLaunch({ url: '/pages/login/login' })
                        }
                    }
                }
            })
        }
    }
}
</script>

<style lang="scss" scoped>
.setting-page {
    min-height: 100vh;
    background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
    padding-bottom: 200rpx;
}

.page-header {
    padding: 120rpx 40rpx 60rpx;
}

.page-title {
    font-size: 56rpx;
    font-weight: 700;
    color: #ffffff;
}

.setting-list {
    padding: 0 30rpx;
}

.setting-group {
    background: rgba(255, 255, 255, 0.95);
    border-radius: 24rpx;
    margin-bottom: 30rpx;
    overflow: hidden;
    backdrop-filter: blur(20px);
}

.group-title {
    padding: 30rpx 40rpx 20rpx;
}

.group-title-text {
    font-size: 26rpx;
    color: #888;
    font-weight: 500;
}

.setting-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 32rpx 40rpx;
    border-bottom: 1rpx solid #f0f0f0;
    transition: background 0.2s;

    &:last-child {
        border-bottom: none;
    }

    &:active {
        background: #f8f8f8;
    }

    &.danger {
        .item-label, .item-icon {
            color: #ff4757;
        }
    }
}

.item-left {
    display: flex;
    align-items: center;
    gap: 24rpx;
}

.item-icon {
    font-size: 40rpx;
}

.item-label {
    font-size: 30rpx;
    color: #333;
    font-weight: 500;
}

.item-right {
    display: flex;
    align-items: center;
    gap: 16rpx;
}

.item-value {
    font-size: 26rpx;
    color: #999;

    &.calculating {
        color: #667eea;
    }
}

.item-arrow {
    font-size: 32rpx;
    color: #ccc;
    font-weight: 300;
}

.bottom-action {
    padding: 60rpx 60rpx;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(to top, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0) 100%);
}

.logout-btn {
    width: 100%;
    height: 88rpx;
    background: #ffffff;
    border: 2rpx solid #ff4757;
    border-radius: 44rpx;
    color: #ff4757;
    font-size: 30rpx;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;

    .btn-text {
        color: #ff4757;
    }
}

.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.clear-modal {
    width: 600rpx;
    background: #ffffff;
    border-radius: 32rpx;
    overflow: hidden;
}

.modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 40rpx 40rpx 30rpx;
    border-bottom: 1rpx solid #f0f0f0;
}

.modal-title {
    font-size: 36rpx;
    font-weight: 600;
    color: #333;
}

.close-btn {
    width: 56rpx;
    height: 56rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f5f5f5;
    border-radius: 50%;
}

.close-icon {
    font-size: 36rpx;
    color: #999;
    line-height: 1;
}

.modal-body {
    padding: 40rpx;
}

.cache-info {
    text-align: center;
    padding: 40rpx 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 20rpx;
    margin-bottom: 30rpx;
}

.cache-label {
    font-size: 26rpx;
    color: rgba(255, 255, 255, 0.8);
    display: block;
    margin-bottom: 16rpx;
}

.cache-size {
    font-size: 56rpx;
    font-weight: 700;
    color: #ffffff;
}

.cache-breakdown {
    background: #f8f9fa;
    border-radius: 16rpx;
    padding: 24rpx;
    margin-bottom: 30rpx;
}

.breakdown-title {
    font-size: 26rpx;
    color: #666;
    font-weight: 500;
    display: block;
    margin-bottom: 16rpx;
}

.breakdown-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12rpx 0;
}

.breakdown-name {
    font-size: 26rpx;
    color: #333;
}

.breakdown-size {
    font-size: 24rpx;
    color: #999;
}

.warning-tip {
    display: flex;
    align-items: flex-start;
    gap: 12rpx;
    padding: 20rpx;
    background: #fff7e6;
    border-radius: 12rpx;
}

.warning-icon {
    font-size: 28rpx;
    flex-shrink: 0;
}

.warning-text {
    font-size: 24rpx;
    color: #d48806;
    line-height: 1.5;
    flex: 1;
}

.modal-footer {
    display: flex;
    gap: 20rpx;
    padding: 0 40rpx 40rpx;
}

.cancel-btn, .confirm-btn {
    flex: 1;
    height: 80rpx;
    border-radius: 40rpx;
    font-size: 28rpx;
    font-weight: 500;
    display: flex;
    align-items: center;
    justify-content: center;
}

.cancel-btn {
    background: #f5f5f5;
    border: none;

    .btn-text {
        color: #666;
    }
}

.confirm-btn {
    background: #667eea;
    border: none;

    &.danger {
        background: #ff4757;
    }

    .btn-text {
        color: #ffffff;
    }
}
</style>
