<template>
    <view class="error-page">
        <view class="error-content">
            <view class="error-icon-wrapper">
                <text class="error-icon">{{ icon }}</text>
            </view>

            <view class="error-title">
                <text class="title-text">{{ title }}</text>
            </view>

            <view class="error-desc">
                <text class="desc-text">{{ description }}</text>
            </view>

            <view class="error-code" v-if="showCode">
                <text class="code-text">{{ errorCode }}</text>
            </view>

            <view class="error-actions">
                <button class="action-btn btn-primary" @click="handleBackHome">
                    <text class="btn-text">{{ backHomeText }}</text>
                </button>
                <button class="action-btn btn-secondary" @click="handleRetry" v-if="showRetry">
                    <text class="btn-text">{{ retryText }}</text>
                </button>
            </view>

            <view class="error-tips" v-if="tips && tips.length > 0">
                <text class="tips-label">可能的原因：</text>
                <view class="tips-list">
                    <view class="tip-item" v-for="(tip, index) in tips" :key="index">
                        <text class="tip-dot">•</text>
                        <text class="tip-text">{{ tip }}</text>
                    </view>
                </view>
            </view>
        </view>

        <view class="error-footer" v-if="showFooter">
            <text class="footer-text">如有疑问请联系客服</text>
        </view>
    </view>
</template>

<script>
export default {
    name: 'ErrorPage',
    props: {
        type: {
            type: String,
            default: 'not_found',
            validator: (value) => ['not_found', 'off_shelf', 'network', 'permission', 'custom'].includes(value)
        },
        title: {
            type: String,
            default: ''
        },
        description: {
            type: String,
            default: ''
        },
        icon: {
            type: String,
            default: ''
        },
        errorCode: {
            type: [String, Number],
            default: ''
        },
        showCode: {
            type: Boolean,
            default: false
        },
        backHomeText: {
            type: String,
            default: '返回首页'
        },
        showRetry: {
            type: Boolean,
            default: true
        },
        retryText: {
            type: String,
            default: '重新加载'
        },
        showFooter: {
            type: Boolean,
            default: true
        },
        customTips: {
            type: Array,
            default: () => []
        }
    },
    emits: ['retry', 'back-home'],
    computed: {
        defaultConfig() {
            const configs = {
                not_found: {
                    icon: '🔍',
                    title: '页面找不到了',
                    description: '您访问的页面可能已被删除或链接有误',
                    tips: ['链接输入错误', '页面已被删除', '链接已过期']
                },
                off_shelf: {
                    icon: '📦',
                    title: '物品已下架',
                    description: '该物品可能已被卖家删除或已完成交易',
                    tips: ['物品已被出售', '物品已被卖家删除', '物品已完成交易']
                },
                network: {
                    icon: '🌐',
                    title: '网络连接异常',
                    description: '无法连接到服务器，请检查网络设置',
                    tips: ['网络信号弱', '未连接到互联网', '服务器维护中']
                },
                permission: {
                    icon: '🔒',
                    title: '无访问权限',
                    description: '您没有权限访问该页面',
                    tips: ['需要登录才能访问', '账号权限不足', '页面仅供特定用户访问']
                },
                custom: {
                    icon: '😕',
                    title: '出错了',
                    description: '页面加载出现问题',
                    tips: []
                }
            }
            return configs[this.type] || configs.custom
        },
        displayIcon() {
            return this.icon || this.defaultConfig.icon
        },
        displayTitle() {
            return this.title || this.defaultConfig.title
        },
        displayDescription() {
            return this.description || this.defaultConfig.description
        },
        tips() {
            if (this.customTips && this.customTips.length > 0) {
                return this.customTips
            }
            return this.defaultConfig.tips
        }
    },
    methods: {
        handleBackHome() {
            this.$emit('back-home')
            uni.switchTab({
                url: '/pages/index/index',
                fail: () => {
                    uni.reLaunch({
                        url: '/pages/index/index'
                    })
                }
            })
        },
        handleRetry() {
            this.$emit('retry')
        }
    }
}
</script>

<style lang="scss" scoped>
.error-page {
    min-height: 100vh;
    background: #ffffff;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60rpx 40rpx;
    box-sizing: border-box;
}

.error-content {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.error-icon-wrapper {
    width: 200rpx;
    height: 200rpx;
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 40rpx;
}

.error-icon {
    font-size: 100rpx;
}

.error-title {
    margin-bottom: 16rpx;
}

.title-text {
    font-size: 36rpx;
    font-weight: 600;
    color: #333;
}

.error-desc {
    margin-bottom: 20rpx;
    padding: 0 40rpx;
    text-align: center;
}

.desc-text {
    font-size: 28rpx;
    color: #999;
    line-height: 1.6;
}

.error-code {
    margin-bottom: 40rpx;
    padding: 8rpx 24rpx;
    background: #f5f5f5;
    border-radius: 8rpx;
}

.code-text {
    font-size: 24rpx;
    color: #999;
    font-family: monospace;
}

.error-actions {
    display: flex;
    gap: 24rpx;
    margin-top: 40rpx;
    margin-bottom: 60rpx;
}

.action-btn {
    min-width: 240rpx;
    height: 80rpx;
    border-radius: 40rpx;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;

    &::after {
        border: none;
    }

    &.btn-primary {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        box-shadow: 0 4rpx 20rpx rgba(102, 126, 234, 0.3);

        .btn-text {
            color: #ffffff;
        }
    }

    &.btn-secondary {
        background: #f5f5f5;

        .btn-text {
            color: #666;
        }
    }
}

.btn-text {
    font-size: 28rpx;
    font-weight: 500;
}

.error-tips {
    width: 100%;
    background: #f9f9f9;
    border-radius: 16rpx;
    padding: 30rpx;
    box-sizing: border-box;
}

.tips-label {
    display: block;
    font-size: 26rpx;
    color: #999;
    margin-bottom: 20rpx;
}

.tips-list {
    display: flex;
    flex-direction: column;
    gap: 12rpx;
}

.tip-item {
    display: flex;
    align-items: center;
    gap: 12rpx;
}

.tip-dot {
    font-size: 24rpx;
    color: #ccc;
}

.tip-text {
    font-size: 26rpx;
    color: #666;
}

.error-footer {
    margin-top: 60rpx;
    padding-top: 30rpx;
    border-top: 1rpx solid #f0f0f0;
}

.footer-text {
    font-size: 24rpx;
    color: #ccc;
}
</style>
