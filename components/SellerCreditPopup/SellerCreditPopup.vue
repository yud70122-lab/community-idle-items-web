<template>
    <view class="seller-credit-popup" v-if="visible" @click="closePopup">
        <view class="popup-mask"></view>
        <view class="popup-content" @click.stop>
            <view class="popup-header">
                <view class="seller-info">
                    <image 
                        class="seller-avatar" 
                        :src="seller.avatar || '/static/default_avatar.png'"
                    />
                    <view class="seller-basic">
                        <text class="seller-name">{{ seller.nickname || '匿名用户' }}</text>
                        <view class="credit-row">
                            <view class="credit-badge" :class="getCreditClass(seller.creditLevel)">
                                <text class="badge-text">{{ getCreditText(seller.creditLevel) }}</text>
                            </view>
                            <text class="member-since" v-if="seller.memberSince">
                                {{ formatMemberSince(seller.memberSince) }}
                            </text>
                        </view>
                    </view>
                </view>
                <view class="close-btn" @click="closePopup">
                    <text class="close-icon">×</text>
                </view>
            </view>

            <view class="credit-stats">
                <view class="stat-item">
                    <text class="stat-value">{{ seller.positiveRate || '98%' }}</text>
                    <text class="stat-label">好评率</text>
                </view>
                <view class="stat-divider"></view>
                <view class="stat-item">
                    <text class="stat-value">{{ seller.exchangeCount || 0 }}</text>
                    <text class="stat-label">历史交换</text>
                </view>
                <view class="stat-divider"></view>
                <view class="stat-item">
                    <text class="stat-value">{{ seller.publishCount || 0 }}</text>
                    <text class="stat-label">发布物品</text>
                </view>
            </view>

            <view class="credit-detail">
                <view class="detail-section">
                    <view class="section-header">
                        <text class="section-icon">⭐</text>
                        <text class="section-title">信用等级</text>
                    </view>
                    <view class="level-progress">
                        <view class="progress-bar">
                            <view 
                                class="progress-fill" 
                                :class="getCreditClass(seller.creditLevel)"
                                :style="{ width: getCreditProgress(seller.creditLevel) + '%' }"
                            ></view>
                        </view>
                        <view class="level-labels">
                            <text class="level-label">低</text>
                            <text class="level-label">一般</text>
                            <text class="level-label">良好</text>
                            <text class="level-label">极好</text>
                        </view>
                    </view>
                </view>

                <view class="detail-section" v-if="seller.creditPoints != null">
                    <view class="section-header">
                        <text class="section-icon">💯</text>
                        <text class="section-title">信用积分</text>
                    </view>
                    <view class="points-display">
                        <text class="points-value">{{ seller.creditPoints }}</text>
                        <text class="points-tip">积分越高，信用越好</text>
                    </view>
                </view>
            </view>

            <view class="action-buttons">
                <button 
                    class="action-btn follow-btn" 
                    :class="{ followed: isFollowed }"
                    @click="toggleFollow"
                >
                    <text class="btn-icon">{{ isFollowed ? '✓' : '+' }}</text>
                    <text class="btn-text">{{ isFollowed ? '已关注' : '关注' }}</text>
                </button>
                <button class="action-btn message-btn" @click="sendMessage">
                    <text class="btn-icon">💬</text>
                    <text class="btn-text">私信</text>
                </button>
            </view>
        </view>
    </view>
</template>

<script>
import http from '@/common/interceptor.js'

export default {
    name: 'SellerCreditPopup',
    props: {
        visible: {
            type: Boolean,
            default: false
        },
        seller: {
            type: Object,
            default: () => ({})
        }
    },
    data() {
        return {
            isFollowed: false,
            loading: false
        }
    },
    watch: {
        visible(val) {
            if (val && this.seller.id) {
                this.checkFollowStatus()
            }
        }
    },
    methods: {
        getCreditClass(level) {
            const levelMap = {
                excellent: 'excellent',
                good: 'good',
                medium: 'medium',
                low: 'low'
            }
            return levelMap[level] || 'medium'
        },
        getCreditText(level) {
            const levelMap = {
                excellent: '信用极好',
                good: '信用良好',
                medium: '信用一般',
                low: '信用较低'
            }
            return levelMap[level] || '信用一般'
        },
        getCreditProgress(level) {
            const progressMap = {
                excellent: 100,
                good: 75,
                medium: 50,
                low: 25
            }
            return progressMap[level] || 50
        },
        formatMemberSince(timestamp) {
            if (!timestamp) return ''
            const date = new Date(timestamp)
            return `${date.getFullYear()}年${date.getMonth() + 1}月加入`
        },
        async checkFollowStatus() {
            try {
                const res = await http.get(`/api/user/follow/status`, {
                    userId: this.seller.id
                })
                if (res) {
                    this.isFollowed = res.isFollowed || false
                }
            } catch (error) {
                console.error('Check follow status failed:', error)
            }
        },
        async toggleFollow() {
            if (this.loading) return
            this.loading = true

            try {
                if (this.isFollowed) {
                    await http.post('/api/user/follow/cancel', {
                        userId: this.seller.id
                    })
                    this.isFollowed = false
                    uni.showToast({
                        title: '已取消关注',
                        icon: 'success'
                    })
                } else {
                    await http.post('/api/user/follow/add', {
                        userId: this.seller.id
                    })
                    this.isFollowed = true
                    uni.showToast({
                        title: '关注成功',
                        icon: 'success'
                    })
                }
                this.$emit('follow-change', {
                    userId: this.seller.id,
                    isFollowed: this.isFollowed
                })
            } catch (error) {
                console.error('Toggle follow failed:', error)
            } finally {
                this.loading = false
            }
        },
        sendMessage() {
            this.$emit('send-message', this.seller)
            uni.navigateTo({
                url: `/pages/chat/chat?userId=${this.seller.id}&nickname=${encodeURIComponent(this.seller.nickname || '')}`
            })
        },
        closePopup() {
            this.$emit('close')
        }
    }
}
</script>

<style lang="scss" scoped>
.seller-credit-popup {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
}

.popup-mask {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
}

.popup-content {
    position: relative;
    background: #ffffff;
    border-radius: 32rpx 32rpx 0 0;
    padding: 40rpx 30rpx;
    padding-bottom: calc(40rpx + env(safe-area-inset-bottom));
    animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
    from {
        transform: translateY(100%);
    }
    to {
        transform: translateY(0);
    }
}

.popup-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 30rpx;
}

.seller-info {
    display: flex;
    align-items: center;
    gap: 20rpx;
    flex: 1;
}

.seller-avatar {
    width: 120rpx;
    height: 120rpx;
    border-radius: 50%;
    background: #f0f0f0;
    flex-shrink: 0;
}

.seller-basic {
    flex: 1;
    min-width: 0;
}

.seller-name {
    display: block;
    font-size: 34rpx;
    font-weight: 600;
    color: #333;
    margin-bottom: 12rpx;
}

.credit-row {
    display: flex;
    align-items: center;
    gap: 16rpx;
    flex-wrap: wrap;
}

.credit-badge {
    padding: 6rpx 16rpx;
    border-radius: 6rpx;

    &.excellent {
        background: rgba(7, 193, 96, 0.1);
        .badge-text { color: #07c160; }
    }
    &.good {
        background: rgba(255, 149, 0, 0.1);
        .badge-text { color: #ff9500; }
    }
    &.medium {
        background: rgba(153, 153, 153, 0.1);
        .badge-text { color: #999; }
    }
    &.low {
        background: rgba(255, 71, 87, 0.1);
        .badge-text { color: #ff4757; }
    }
}

.badge-text {
    font-size: 22rpx;
    font-weight: 500;
}

.member-since {
    font-size: 22rpx;
    color: #999;
}

.close-btn {
    width: 60rpx;
    height: 60rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f5f5f5;
    border-radius: 50%;
    flex-shrink: 0;
}

.close-icon {
    font-size: 36rpx;
    color: #999;
    line-height: 1;
}

.credit-stats {
    display: flex;
    align-items: center;
    justify-content: space-around;
    padding: 30rpx 0;
    background: #f8f9fa;
    border-radius: 16rpx;
    margin-bottom: 30rpx;
}

.stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8rpx;
}

.stat-value {
    font-size: 36rpx;
    font-weight: 700;
    color: #333;
}

.stat-label {
    font-size: 22rpx;
    color: #999;
}

.stat-divider {
    width: 1rpx;
    height: 60rpx;
    background: #e0e0e0;
}

.credit-detail {
    margin-bottom: 40rpx;
}

.detail-section {
    margin-bottom: 30rpx;

    &:last-child {
        margin-bottom: 0;
    }
}

.section-header {
    display: flex;
    align-items: center;
    gap: 8rpx;
    margin-bottom: 16rpx;
}

.section-icon {
    font-size: 28rpx;
}

.section-title {
    font-size: 28rpx;
    font-weight: 600;
    color: #333;
}

.level-progress {
    padding: 0 10rpx;
}

.progress-bar {
    height: 16rpx;
    background: #f0f0f0;
    border-radius: 8rpx;
    overflow: hidden;
    margin-bottom: 12rpx;
}

.progress-fill {
    height: 100%;
    border-radius: 8rpx;
    transition: width 0.5s ease;

    &.excellent {
        background: linear-gradient(90deg, #07c160, #06ad56);
    }
    &.good {
        background: linear-gradient(90deg, #ff9500, #ff7b00);
    }
    &.medium {
        background: linear-gradient(90deg, #999, #888);
    }
    &.low {
        background: linear-gradient(90deg, #ff4757, #ff3838);
    }
}

.level-labels {
    display: flex;
    justify-content: space-between;
}

.level-label {
    font-size: 20rpx;
    color: #999;
}

.points-display {
    display: flex;
    align-items: baseline;
    gap: 16rpx;
    padding: 20rpx;
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
    border-radius: 12rpx;
}

.points-value {
    font-size: 48rpx;
    font-weight: 700;
    color: #667eea;
}

.points-tip {
    font-size: 22rpx;
    color: #999;
}

.action-buttons {
    display: flex;
    gap: 20rpx;
}

.action-btn {
    flex: 1;
    height: 88rpx;
    border-radius: 44rpx;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8rpx;

    &::after {
        border: none;
    }
}

.follow-btn {
    background: #f0f0f0;

    &.followed {
        background: rgba(102, 126, 234, 0.1);
    }
}

.follow-btn .btn-icon,
.follow-btn .btn-text {
    color: #666;

    .followed & {
        color: #667eea;
    }
}

.message-btn {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.message-btn .btn-icon,
.message-btn .btn-text {
    color: #fff;
}

.btn-icon {
    font-size: 28rpx;
}

.btn-text {
    font-size: 28rpx;
    font-weight: 600;
}
</style>
