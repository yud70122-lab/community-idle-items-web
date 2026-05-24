<template>
    <view class="my-publish-page">
        <view class="page-header">
            <text class="page-title">我的发布</text>
            <text class="page-subtitle">管理您发布的闲置物品</text>
        </view>

        <view class="content-wrapper">
            <view class="status-tabs">
                <view
                    v-for="tab in statusTabs"
                    :key="tab.value"
                    class="status-tab"
                    :class="{ active: currentStatus === tab.value }"
                    @click="currentStatus = tab.value"
                >
                    <text class="tab-text">{{ tab.label }}</text>
                    <view class="tab-count" v-if="getCountByStatus(tab.value) > 0">
                        <text class="count-text">{{ getCountByStatus(tab.value) }}</text>
                    </view>
                </view>
            </view>

            <view class="list-container" v-if="filteredItems.length > 0">
                <view
                    v-for="item in filteredItems"
                    :key="item.id"
                    class="item-card"
                >
                    <view class="item-content">
                        <image
                            class="item-image"
                            :src="item.coverImage || item.images?.[0] || '/static/placeholder.png'"
                            mode="aspectFill"
                        />
                        <view class="item-info">
                            <view class="item-header">
                                <text class="item-title">{{ item.title }}</text>
                                <view class="status-tag" :class="item.status">
                                    <text class="status-text">{{ getStatusText(item.status) }}</text>
                                </view>
                            </view>
                            <text class="item-desc">{{ item.description }}</text>
                            <view class="item-footer">
                                <view class="price-info" v-if="item.price > 0">
                                    <text class="price-symbol">¥</text>
                                    <text class="price-value">{{ item.price.toFixed(2) }}</text>
                                </view>
                                <text class="publish-time">{{ formatTime(item.createTime) }}</text>
                            </view>
                        </view>
                    </view>
                    <view class="action-buttons">
                        <button
                            class="action-btn edit-btn"
                            @click="handleEdit(item)"
                            v-if="item.status === 'online'"
                        >
                            <text class="btn-text">编辑</text>
                        </button>
                        <button
                            class="action-btn offline-btn"
                            @click="handleOffline(item)"
                            v-if="item.status === 'online'"
                            :loading="item.offlining"
                        >
                            <text class="btn-text">{{ item.offlining ? '下架中...' : '下架' }}</text>
                        </button>
                        <button
                            class="action-btn republish-btn"
                            @click="handleEdit(item)"
                            v-if="item.status === 'offline'"
                        >
                            <text class="btn-text">重新编辑</text>
                        </button>
                        <button
                            class="action-btn delete-btn"
                            @click="handleDelete(item)"
                            v-if="item.status === 'offline'"
                        >
                            <text class="btn-text">删除</text>
                        </button>
                    </view>
                </view>
            </view>

            <view class="empty-state" v-else-if="!loading">
                <text class="empty-icon">📦</text>
                <text class="empty-text">暂无{{ getStatusText(currentStatus) }}的物品</text>
                <button class="go-publish-btn" @click="goToPublish">
                    <text class="btn-text">去发布</text>
                </button>
            </view>

            <view class="loading-state" v-if="loading">
                <view class="spinner"></view>
                <text class="loading-text">加载中...</text>
            </view>
        </view>
    </view>
</template>

<script>
import http from '@/common/interceptor.js'

export default {
    name: 'MyPublishPage',
    data() {
        return {
            items: [],
            loading: false,
            currentStatus: 'all',
            statusTabs: [
                { value: 'all', label: '全部' },
                { value: 'online', label: '已上架' },
                { value: 'offline', label: '已下架' }
            ]
        }
    },
    computed: {
        filteredItems() {
            if (this.currentStatus === 'all') {
                return this.items
            }
            return this.items.filter(item => item.status === this.currentStatus)
        }
    },
    onLoad() {
        this.loadMyItems()
    },
    onShow() {
        this.loadMyItems()
    },
    onPullDownRefresh() {
        this.loadMyItems().finally(() => {
            uni.stopPullDownRefresh()
        })
    },
    methods: {
        getCountByStatus(status) {
            if (status === 'all') {
                return this.items.length
            }
            return this.items.filter(item => item.status === status).length
        },

        getStatusText(status) {
            const statusMap = {
                online: '已上架',
                offline: '已下架',
                sold: '已售出',
                pending: '审核中'
            }
            return statusMap[status] || status
        },

        formatTime(timestamp) {
            if (!timestamp) return ''
            const date = new Date(timestamp)
            const now = new Date()
            const diff = now - date

            if (diff < 60 * 1000) {
                return '刚刚'
            }
            if (diff < 60 * 60 * 1000) {
                return Math.floor(diff / (60 * 1000)) + '分钟前'
            }
            if (diff < 24 * 60 * 60 * 1000) {
                return Math.floor(diff / (60 * 60 * 1000)) + '小时前'
            }
            if (diff < 30 * 24 * 60 * 60 * 1000) {
                return Math.floor(diff / (24 * 60 * 60 * 1000)) + '天前'
            }

            const year = date.getFullYear()
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const day = String(date.getDate()).padStart(2, '0')
            return `${year}-${month}-${day}`
        },

        async loadMyItems() {
            this.loading = true
            try {
                const res = await http.get('/api/user/items')
                if (res && Array.isArray(res)) {
                    this.items = res.map(item => ({
                        ...item,
                        offlining: false
                    }))
                } else if (res && res.list && Array.isArray(res.list)) {
                    this.items = res.list.map(item => ({
                        ...item,
                        offlining: false
                    }))
                }
            } catch (error) {
                console.error('Load my items failed:', error)
                this.items = this.getMockItems()
            } finally {
                this.loading = false
            }
        },

        getMockItems() {
            return [
                {
                    id: '1',
                    title: 'iPhone 12 128G 黑色',
                    description: '自用iPhone 12，九成新，无磕碰，配件齐全',
                    price: 2999,
                    coverImage: '',
                    status: 'online',
                    createTime: Date.now() - 2 * 24 * 60 * 60 * 1000
                },
                {
                    id: '2',
                    title: 'MacBook Pro 13寸 2020款',
                    description: 'MacBook Pro 13寸，M1芯片，8G+256G',
                    price: 6999,
                    coverImage: '',
                    status: 'online',
                    createTime: Date.now() - 5 * 24 * 60 * 60 * 1000
                },
                {
                    id: '3',
                    title: 'Sony WH-1000XM4 耳机',
                    description: '索尼降噪耳机，几乎全新，购买不到一个月',
                    price: 1299,
                    coverImage: '',
                    status: 'offline',
                    createTime: Date.now() - 15 * 24 * 60 * 60 * 1000
                }
            ]
        },

        handleEdit(item) {
            uni.navigateTo({
                url: `/pages/publish/publish?id=${item.id}`
            })
        },

        handleOffline(item) {
            uni.showModal({
                title: '确认下架',
                content: `确定要下架「${item.title}」吗？`,
                confirmText: '下架',
                cancelText: '取消',
                success: async (res) => {
                    if (res.confirm) {
                        await this.doOffline(item)
                    }
                }
            })
        },

        async doOffline(item) {
            item.offlining = true
            try {
                const res = await http.put(`/api/item/${item.id}/offline`)
                if (res && (res.code === 0 || res.code === 200)) {
                    item.status = 'offline'
                    uni.showToast({
                        title: '已下架',
                        icon: 'success'
                    })
                } else {
                    throw new Error(res?.message || '下架失败')
                }
            } catch (error) {
                console.error('Offline failed:', error)
                uni.showToast({
                    title: error.message || '下架失败，请重试',
                    icon: 'none'
                })
            } finally {
                item.offlining = false
            }
        },

        handleDelete(item) {
            uni.showModal({
                title: '确认删除',
                content: `确定要删除「${item.title}」吗？删除后无法恢复。`,
                confirmText: '删除',
                cancelText: '取消',
                confirmColor: '#ff4757',
                success: async (res) => {
                    if (res.confirm) {
                        await this.doDelete(item)
                    }
                }
            })
        },

        async doDelete(item) {
            try {
                const res = await http.delete(`/api/item/${item.id}`)
                if (res && (res.code === 0 || res.code === 200)) {
                    const index = this.items.findIndex(i => i.id === item.id)
                    if (index > -1) {
                        this.items.splice(index, 1)
                    }
                    uni.showToast({
                        title: '已删除',
                        icon: 'success'
                    })
                } else {
                    throw new Error(res?.message || '删除失败')
                }
            } catch (error) {
                console.error('Delete failed:', error)
                uni.showToast({
                    title: error.message || '删除失败，请重试',
                    icon: 'none'
                })
            }
        },

        goToPublish() {
            uni.navigateTo({
                url: '/pages/publish/publish'
            })
        }
    }
}
</script>

<style lang="scss" scoped>
.my-publish-page {
    min-height: 100vh;
    background: #f5f5f5;
}

.page-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 60rpx 30rpx 80rpx;
}

.page-title {
    display: block;
    font-size: 48rpx;
    font-weight: 700;
    color: #ffffff;
    margin-bottom: 8rpx;
}

.page-subtitle {
    font-size: 26rpx;
    color: rgba(255, 255, 255, 0.8);
}

.content-wrapper {
    padding: 0 20rpx;
    margin-top: -40rpx;
    position: relative;
    z-index: 10;
}

.status-tabs {
    display: flex;
    background: #ffffff;
    border-radius: 20rpx;
    padding: 8rpx;
    margin-bottom: 20rpx;
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
}

.status-tab {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8rpx;
    height: 72rpx;
    border-radius: 16rpx;
    transition: all 0.3s ease;

    &.active {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

        .tab-text {
            color: #ffffff;
            font-weight: 600;
        }

        .tab-count {
            background: rgba(255, 255, 255, 0.3);

            .count-text {
                color: #ffffff;
            }
        }
    }
}

.tab-text {
    font-size: 28rpx;
    color: #666;
}

.tab-count {
    min-width: 36rpx;
    height: 36rpx;
    background: #f0f0f0;
    border-radius: 18rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 10rpx;
}

.count-text {
    font-size: 20rpx;
    color: #999;
    font-weight: 600;
}

.list-container {
    display: flex;
    flex-direction: column;
    gap: 20rpx;
}

.item-card {
    background: #ffffff;
    border-radius: 20rpx;
    overflow: hidden;
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
}

.item-content {
    display: flex;
    gap: 20rpx;
    padding: 24rpx;
}

.item-image {
    width: 180rpx;
    height: 180rpx;
    border-radius: 12rpx;
    background: #f0f0f0;
    flex-shrink: 0;
}

.item-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
}

.item-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16rpx;
    margin-bottom: 8rpx;
}

.item-title {
    flex: 1;
    font-size: 30rpx;
    font-weight: 600;
    color: #333;
    line-height: 1.4;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
}

.status-tag {
    flex-shrink: 0;
    padding: 6rpx 16rpx;
    border-radius: 8rpx;

    &.online {
        background: rgba(7, 193, 96, 0.1);
        .status-text {
            color: #07c160;
        }
    }

    &.offline {
        background: rgba(153, 153, 153, 0.1);
        .status-text {
            color: #999;
        }
    }

    &.sold {
        background: rgba(255, 107, 107, 0.1);
        .status-text {
            color: #ff6b6b;
        }
    }

    &.pending {
        background: rgba(255, 149, 0, 0.1);
        .status-text {
            color: #ff9500;
        }
    }
}

.status-text {
    font-size: 22rpx;
    font-weight: 500;
}

.item-desc {
    flex: 1;
    font-size: 24rpx;
    color: #999;
    line-height: 1.5;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    margin-bottom: 12rpx;
}

.item-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.price-info {
    display: flex;
    align-items: baseline;
    gap: 2rpx;
}

.price-symbol {
    font-size: 24rpx;
    font-weight: 600;
    color: #ff4757;
}

.price-value {
    font-size: 32rpx;
    font-weight: 700;
    color: #ff4757;
}

.publish-time {
    font-size: 22rpx;
    color: #ccc;
}

.action-buttons {
    display: flex;
    gap: 16rpx;
    padding: 0 24rpx 24rpx;
}

.action-btn {
    flex: 1;
    height: 72rpx;
    border-radius: 36rpx;
    font-size: 28rpx;
    font-weight: 500;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;

    &.edit-btn {
        background: rgba(102, 126, 234, 0.1);
        .btn-text {
            color: #667eea;
        }
    }

    &.offline-btn {
        background: rgba(255, 107, 107, 0.1);
        .btn-text {
            color: #ff6b6b;
        }
    }

    &.republish-btn {
        background: rgba(7, 193, 96, 0.1);
        .btn-text {
            color: #07c160;
        }
    }

    &.delete-btn {
        background: rgba(255, 71, 87, 0.1);
        .btn-text {
            color: #ff4757;
        }
    }
}

.btn-text {
    font-size: 28rpx;
}

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 100rpx 40rpx;
    background: #ffffff;
    border-radius: 20rpx;
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
}

.empty-icon {
    font-size: 120rpx;
    margin-bottom: 20rpx;
}

.empty-text {
    font-size: 28rpx;
    color: #999;
    margin-bottom: 40rpx;
}

.go-publish-btn {
    min-width: 240rpx;
    height: 80rpx;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 40rpx;
    border: none;

    .btn-text {
        color: #ffffff;
        font-size: 28rpx;
        font-weight: 500;
    }
}

.loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80rpx;
    background: #ffffff;
    border-radius: 20rpx;
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
</style>
