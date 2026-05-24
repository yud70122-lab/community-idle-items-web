<template>
    <view class="points-log-container">
        <view class="points-header">
            <view class="points-card">
                <text class="points-label">当前可用积分</text>
                <text class="points-value">{{ totalPoints }}</text>
                <view class="points-stats">
                    <view class="stat-item">
                        <text class="stat-value">+{{ monthEarned }}</text>
                        <text class="stat-label">本月获得</text>
                    </view>
                    <view class="stat-divider"></view>
                    <view class="stat-item">
                        <text class="stat-value">-{{ monthSpent }}</text>
                        <text class="stat-label">本月消耗</text>
                    </view>
                </view>
            </view>
        </view>

        <view class="filter-tabs">
            <view
                v-for="tab in tabs"
                :key="tab.value"
                class="tab-item"
                :class="{ active: currentTab === tab.value }"
                @click="switchTab(tab.value)"
            >
                <text class="tab-text">{{ tab.label }}</text>
            </view>
        </view>

        <scroll-view
            class="log-list"
            scroll-y
            :enable-back-to-top="true"
            @scrolltolower="loadMore"
        >
            <view v-if="loading && logList.length === 0" class="loading-wrapper">
                <view class="loading-spinner"></view>
                <text class="loading-text">加载中...</text>
            </view>

            <view v-else-if="logList.length === 0" class="empty-wrapper">
                <text class="empty-icon">📋</text>
                <text class="empty-text">暂无积分记录</text>
            </view>

            <view v-else class="log-items">
                <view
                    v-for="log in logList"
                    :key="log.id"
                    class="log-item"
                    @click="showLogDetail(log)"
                >
                    <view class="log-icon-wrapper" :class="log.type">
                        <text class="log-icon">{{ getTypeIcon(log.type) }}</text>
                    </view>
                    <view class="log-info">
                        <text class="log-title">{{ log.title }}</text>
                        <text class="log-desc">{{ log.description }}</text>
                        <text class="log-time">{{ formatTime(log.createTime) }}</text>
                    </view>
                    <view class="log-points" :class="log.type">
                        <text class="points-text">
                            {{ log.type === 'earn' ? '+' : '-' }}{{ log.points }}
                        </text>
                    </view>
                </view>

                <view v-if="loadingMore" class="load-more-wrapper">
                    <view class="loading-spinner small"></view>
                    <text class="load-more-text">加载中...</text>
                </view>

                <view v-else-if="noMore" class="no-more-wrapper">
                    <text class="no-more-text">没有更多记录了</text>
                </view>
            </view>
        </scroll-view>

        <view class="modal-mask" v-if="showDetailModal" @click="closeDetailModal">
            <view class="modal-content" @click.stop>
                <view class="modal-header">
                    <text class="modal-title">积分详情</text>
                    <text class="modal-close" @click="closeDetailModal">×</text>
                </view>
                <view class="modal-body" v-if="currentLog">
                    <view class="detail-icon-wrapper" :class="currentLog.type">
                        <text class="detail-icon">{{ getTypeIcon(currentLog.type) }}</text>
                    </view>
                    <view class="detail-points" :class="currentLog.type">
                        <text class="detail-points-text">
                            {{ currentLog.type === 'earn' ? '+' : '-' }}{{ currentLog.points }}
                        </text>
                    </view>
                    <text class="detail-title">{{ currentLog.title }}</text>
                    <view class="detail-info-list">
                        <view class="detail-info-item">
                            <text class="info-label">类型</text>
                            <text class="info-value">{{ currentLog.type === 'earn' ? '获得积分' : '消耗积分' }}</text>
                        </view>
                        <view class="detail-info-item">
                            <text class="info-label">时间</text>
                            <text class="info-value">{{ formatTime(currentLog.createTime) }}</text>
                        </view>
                        <view class="detail-info-item" v-if="currentLog.orderNo">
                            <text class="info-label">订单号</text>
                            <text class="info-value">{{ currentLog.orderNo }}</text>
                        </view>
                        <view class="detail-info-item">
                            <text class="info-label">说明</text>
                            <text class="info-value">{{ currentLog.description }}</text>
                        </view>
                        <view class="detail-info-item">
                            <text class="info-label">当前余额</text>
                            <text class="info-value">{{ currentLog.balanceAfter }} 积分</text>
                        </view>
                    </view>
                </view>
            </view>
        </view>
    </view>
</template>

<script>
import http from '@/common/interceptor.js'

export default {
    data() {
        return {
            totalPoints: 0,
            monthEarned: 0,
            monthSpent: 0,
            tabs: [
                { label: '全部', value: 'all' },
                { label: '获得', value: 'earn' },
                { label: '消耗', value: 'spend' }
            ],
            currentTab: 'all',
            logList: [],
            page: 1,
            pageSize: 10,
            loading: false,
            loadingMore: false,
            noMore: false,
            showDetailModal: false,
            currentLog: null
        }
    },
    onLoad() {
        this.loadSummary()
        this.loadLogList(true)
    },
    onPullDownRefresh() {
        this.page = 1
        this.noMore = false
        Promise.all([
            this.loadSummary(),
            this.loadLogList(true)
        ]).then(() => {
            uni.stopPullDownRefresh()
        }).catch(() => {
            uni.stopPullDownRefresh()
        })
    },
    onShow() {
    },
    methods: {
        async loadSummary() {
            try {
                const res = await http.get('/api/points/summary')
                this.totalPoints = res.totalPoints || 0
                this.monthEarned = res.monthEarned || 0
                this.monthSpent = res.monthSpent || 0
            } catch (error) {
                console.error('Load summary failed:', error)
                this.loadMockSummary()
            }
        },

        loadMockSummary() {
            this.totalPoints = 2580
            this.monthEarned = 1200
            this.monthSpent = 300
        },

        async loadLogList(isRefresh = false) {
            if (isRefresh) {
                this.loading = true
            } else {
                this.loadingMore = true
            }

            try {
                const params = {
                    page: this.page,
                    pageSize: this.pageSize,
                    type: this.currentTab === 'all' ? '' : this.currentTab
                }
                const res = await http.get('/api/points/logs', params)
                const list = res.list || res.records || res || []

                if (isRefresh) {
                    this.logList = list
                } else {
                    this.logList = [...this.logList, ...list]
                }

                if (list.length < this.pageSize) {
                    this.noMore = true
                } else {
                    this.page++
                }
            } catch (error) {
                console.error('Load log list failed:', error)
                this.loadMockLogList(isRefresh)
            } finally {
                this.loading = false
                this.loadingMore = false
            }
        },

        loadMockLogList(isRefresh) {
            const mockData = []
            const types = ['earn', 'spend']
            const earnTitles = ['每日签到', '发布商品', '邀请好友', '交易成功', '活动奖励', '评价晒单']
            const spendTitles = ['兑换商品', '置顶服务', '平台手续费', '购买优惠券', '抽奖消耗']
            const baseTime = Date.now()

            for (let i = 0; i < this.pageSize; i++) {
                const type = types[Math.floor(Math.random() * 2)]
                const titles = type === 'earn' ? earnTitles : spendTitles
                const index = (this.page - 1) * this.pageSize + i
                mockData.push({
                    id: index + 1,
                    type: type,
                    title: titles[Math.floor(Math.random() * titles.length)],
                    description: type === 'earn' ? '完成任务获得积分奖励' : '使用积分兑换服务',
                    points: Math.floor(Math.random() * 100) + 10,
                    createTime: baseTime - index * 3600000,
                    orderNo: 'ORD' + Date.now() + index,
                    balanceAfter: 2580 - index * 10
                })
            }

            if (isRefresh) {
                this.logList = mockData
            } else {
                this.logList = [...this.logList, ...mockData]
            }

            if (this.page >= 5) {
                this.noMore = true
            } else {
                this.page++
            }
        },

        switchTab(tab) {
            if (this.currentTab === tab) return
            this.currentTab = tab
            this.page = 1
            this.noMore = false
            this.logList = []
            this.loadLogList(true)
        },

        loadMore() {
            if (this.loadingMore || this.noMore || this.loading) return
            this.loadLogList(false)
        },

        getTypeIcon(type) {
            const icons = {
                earn: '📈',
                spend: '📉'
            }
            return icons[type] || '📋'
        },

        formatTime(timestamp) {
            if (!timestamp) return ''
            const date = new Date(timestamp)
            const year = date.getFullYear()
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const day = String(date.getDate()).padStart(2, '0')
            const hours = String(date.getHours()).padStart(2, '0')
            const minutes = String(date.getMinutes()).padStart(2, '0')
            return `${year}-${month}-${day} ${hours}:${minutes}`
        },

        showLogDetail(log) {
            this.currentLog = log
            this.showDetailModal = true
        },

        closeDetailModal() {
            this.showDetailModal = false
            this.currentLog = null
        }
    }
}
</script>

<style lang="scss" scoped>
.points-log-container {
    min-height: 100vh;
    background: #f5f5f5;
}

.points-header {
    padding: 30rpx;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.points-card {
    background: rgba(255, 255, 255, 0.15);
    border-radius: 20rpx;
    padding: 40rpx;
    backdrop-filter: blur(10px);
}

.points-label {
    display: block;
    font-size: 26rpx;
    color: rgba(255, 255, 255, 0.8);
    margin-bottom: 12rpx;
}

.points-value {
    display: block;
    font-size: 64rpx;
    font-weight: bold;
    color: #fff;
    margin-bottom: 30rpx;
}

.points-stats {
    display: flex;
    align-items: center;
    justify-content: space-around;
}

.stat-item {
    text-align: center;
}

.stat-value {
    display: block;
    font-size: 32rpx;
    font-weight: bold;
    color: #fff;
    margin-bottom: 8rpx;
}

.stat-label {
    display: block;
    font-size: 22rpx;
    color: rgba(255, 255, 255, 0.7);
}

.stat-divider {
    width: 1rpx;
    height: 60rpx;
    background: rgba(255, 255, 255, 0.3);
}

.filter-tabs {
    display: flex;
    background: #fff;
    padding: 0 30rpx;
    border-bottom: 1rpx solid #f0f0f0;
}

.tab-item {
    flex: 1;
    height: 88rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;

    &.active {
        .tab-text {
            color: #667eea;
            font-weight: 500;
        }

        &::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 60rpx;
            height: 6rpx;
            background: #667eea;
            border-radius: 3rpx;
        }
    }
}

.tab-text {
    font-size: 28rpx;
    color: #666;
    transition: all 0.3s;
}

.log-list {
    height: calc(100vh - 400rpx);
}

.loading-wrapper,
.empty-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 100rpx 0;
}

.loading-spinner {
    width: 60rpx;
    height: 60rpx;
    border: 4rpx solid #f0f0f0;
    border-top-color: #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 20rpx;

    &.small {
        width: 40rpx;
        height: 40rpx;
        margin-bottom: 0;
        margin-right: 16rpx;
    }
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

.loading-text {
    font-size: 26rpx;
    color: #999;
}

.empty-icon {
    font-size: 100rpx;
    margin-bottom: 20rpx;
}

.empty-text {
    font-size: 28rpx;
    color: #999;
}

.log-items {
    padding: 20rpx 30rpx;
}

.log-item {
    display: flex;
    align-items: center;
    gap: 24rpx;
    padding: 30rpx;
    background: #fff;
    border-radius: 16rpx;
    margin-bottom: 20rpx;
}

.log-icon-wrapper {
    width: 80rpx;
    height: 80rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    flex-shrink: 0;

    &.earn {
        background: rgba(7, 193, 96, 0.1);
    }

    &.spend {
        background: rgba(255, 87, 34, 0.1);
    }
}

.log-icon {
    font-size: 40rpx;
}

.log-info {
    flex: 1;
    min-width: 0;
}

.log-title {
    display: block;
    font-size: 30rpx;
    font-weight: 500;
    color: #333;
    margin-bottom: 8rpx;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.log-desc {
    display: block;
    font-size: 24rpx;
    color: #999;
    margin-bottom: 6rpx;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.log-time {
    display: block;
    font-size: 22rpx;
    color: #bbb;
}

.log-points {
    flex-shrink: 0;

    &.earn .points-text {
        color: #07c160;
    }

    &.spend .points-text {
        color: #ff5722;
    }
}

.points-text {
    font-size: 32rpx;
    font-weight: bold;
}

.load-more-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 30rpx 0;
}

.load-more-text {
    font-size: 24rpx;
    color: #999;
}

.no-more-wrapper {
    text-align: center;
    padding: 30rpx 0;
}

.no-more-text {
    font-size: 24rpx;
    color: #ccc;
}

.modal-mask {
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

.modal-content {
    width: 600rpx;
    background: #fff;
    border-radius: 24rpx;
    overflow: hidden;
    animation: modalIn 0.3s ease-out;
}

@keyframes modalIn {
    from {
        opacity: 0;
        transform: scale(0.8) translateY(50rpx);
    }
    to {
        opacity: 1;
        transform: scale(1) translateY(0);
    }
}

.modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 30rpx;
    border-bottom: 1rpx solid #f0f0f0;
}

.modal-title {
    font-size: 32rpx;
    font-weight: bold;
    color: #333;
}

.modal-close {
    font-size: 48rpx;
    color: #ccc;
    line-height: 1;
}

.modal-body {
    padding: 40rpx 30rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.detail-icon-wrapper {
    width: 120rpx;
    height: 120rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    margin-bottom: 20rpx;

    &.earn {
        background: rgba(7, 193, 96, 0.1);
    }

    &.spend {
        background: rgba(255, 87, 34, 0.1);
    }
}

.detail-icon {
    font-size: 60rpx;
}

.detail-points {
    margin-bottom: 16rpx;

    &.earn .detail-points-text {
        color: #07c160;
    }

    &.spend .detail-points-text {
        color: #ff5722;
    }
}

.detail-points-text {
    font-size: 48rpx;
    font-weight: bold;
}

.detail-title {
    font-size: 32rpx;
    font-weight: 500;
    color: #333;
    margin-bottom: 30rpx;
}

.detail-info-list {
    width: 100%;
    background: #f9f9f9;
    border-radius: 16rpx;
    padding: 10rpx 0;
}

.detail-info-item {
    display: flex;
    justify-content: space-between;
    padding: 20rpx 30rpx;
    border-bottom: 1rpx solid #f0f0f0;

    &:last-child {
        border-bottom: none;
    }
}

.info-label {
    font-size: 26rpx;
    color: #999;
}

.info-value {
    font-size: 26rpx;
    color: #333;
    max-width: 350rpx;
    text-align: right;
    word-break: break-all;
}
</style>
