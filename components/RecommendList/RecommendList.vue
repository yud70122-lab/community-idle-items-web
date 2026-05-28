<template>
    <view class="recommend-section">
        <view class="section-header">
            <text class="section-title">相似推荐</text>
            <text class="section-subtitle">你可能也喜欢</text>
        </view>

        <view class="recommend-grid" v-if="recommendList.length > 0">
            <view
                v-for="item in recommendList"
                :key="item.id"
                class="recommend-item"
                @click="handleItemClick(item)"
            >
                <image
                    class="item-image"
                    :src="item.coverImage || item.images?.[0] || placeholderImage"
                    mode="aspectFill"
                    lazy-load
                />
                <view class="item-info">
                    <text class="item-title">{{ item.title }}</text>
                    <view class="item-bottom">
                        <view class="item-price" v-if="item.price && item.price > 0">
                            <text class="price-symbol">¥</text>
                            <text class="price-value">{{ item.price.toFixed(0) }}</text>
                        </view>
                        <view class="item-price free" v-else-if="item.price === 0">
                            <text class="price-value">免费</text>
                        </view>
                        <view class="item-price exchange" v-else>
                            <text class="price-value">可交换</text>
                        </view>
                        <text class="item-distance">{{ item.distance || '附近' }}</text>
                    </view>
                </view>
            </view>
        </view>

        <view class="loading-state" v-if="loading">
            <view class="spinner small"></view>
            <text class="loading-text">加载推荐中...</text>
        </view>
    </view>
</template>

<script>
import http from '@/common/interceptor.js'

export default {
    name: 'RecommendList',
    props: {
        itemId: {
            type: [String, Number],
            required: true
        },
        categoryId: {
            type: [String, Number],
            default: ''
        },
        price: {
            type: Number,
            default: 0
        },
        tags: {
            type: Array,
            default: () => []
        },
        limit: {
            type: Number,
            default: 4
        }
    },
    data() {
        return {
            recommendList: [],
            loading: false,
            placeholderImage: '/static/placeholder.png'
        }
    },
    watch: {
        itemId: {
            immediate: true,
            handler(newVal) {
                if (newVal) {
                    this.loadRecommendations()
                }
            }
        }
    },
    methods: {
        async loadRecommendations() {
            if (!this.itemId) return

            this.loading = true
            try {
                const params = {
                    limit: this.limit,
                    categoryId: this.categoryId,
                    price: this.price,
                    tags: this.tags && this.tags.length > 0 ? this.tags.join(',') : ''
                }

                const res = await http.get(`/api/item/recommend/${this.itemId}`, params)
                let items = []

                if (res && Array.isArray(res)) {
                    items = res
                } else if (res && res.list && Array.isArray(res.list)) {
                    items = res.list
                } else {
                    items = this.getMockRecommendations()
                }

                this.recommendList = this.enrichItems(items.slice(0, this.limit))
            } catch (error) {
                console.error('Load recommendations failed:', error)
                this.recommendList = this.enrichItems(this.getMockRecommendations())
            } finally {
                this.loading = false
            }
        },

        getMockRecommendations() {
            const mockData = [
                { id: 'rec1', title: 'iPhone 12 128G 黑色', price: 2899, coverImage: '', distance: '1.2km', condition: 'good', tradeType: 'sell' },
                { id: 'rec2', title: 'iPhone 13 mini 256G', price: 3599, coverImage: '', distance: '2.1km', condition: 'excellent', tradeType: 'sell' },
                { id: 'rec3', title: 'iPhone 11 Pro Max', price: 2399, coverImage: '', distance: '0.8km', condition: 'fair', tradeType: 'sell' },
                { id: 'rec4', title: 'iPhone SE 第三代', price: 1999, coverImage: '', distance: '1.5km', condition: 'like_new', tradeType: 'exchange' }
            ]
            return mockData
        },

        enrichItems(items) {
            const creditLevels = ['excellent', 'good', 'medium', 'good', 'excellent', 'good']

            return items.map((item, idx) => ({
                ...item,
                creditLevel: item.creditLevel || creditLevels[idx % creditLevels.length],
                viewCount: item.viewCount || Math.floor(Math.random() * 500) + 10
            }))
        },

        handleItemClick(item) {
            this.$emit('item-click', item)
        }
    }
}
</script>

<style lang="scss" scoped>
.recommend-section {
    padding: 30rpx;
    background: #f5f5f5;
}

.section-header {
    display: flex;
    align-items: baseline;
    gap: 12rpx;
    margin-bottom: 24rpx;
}

.section-title {
    font-size: 32rpx;
    font-weight: 700;
    color: #333;
}

.section-subtitle {
    font-size: 24rpx;
    color: #999;
}

.recommend-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 16rpx;
}

.recommend-item {
    width: calc((100% - 16rpx) / 2);
    background: #ffffff;
    border-radius: 12rpx;
    overflow: hidden;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
    transition: transform 0.2s ease;

    &:active {
        transform: scale(0.98);
    }
}

.item-image {
    width: 100%;
    height: 200rpx;
    background: #f0f0f0;
}

.item-info {
    padding: 12rpx;
}

.item-title {
    display: block;
    font-size: 24rpx;
    font-weight: 600;
    color: #333;
    margin-bottom: 10rpx;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.item-bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.item-price {
    display: flex;
    align-items: baseline;
    gap: 2rpx;

    &.free .price-value {
        color: #07c160;
        font-size: 24rpx;
    }

    &.exchange .price-value {
        color: #667eea;
        font-size: 22rpx;
    }
}

.price-symbol {
    font-size: 18rpx;
    font-weight: 600;
    color: #ff4757;
}

.price-value {
    font-size: 28rpx;
    font-weight: 700;
    color: #ff4757;
}

.item-distance {
    font-size: 20rpx;
    color: #999;
}

.loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60rpx;
}

.spinner.small {
    width: 36rpx;
    height: 36rpx;
    border: 3rpx solid rgba(102, 126, 234, 0.2);
    border-top-color: #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 12rpx;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

.loading-text {
    font-size: 24rpx;
    color: #999;
}
</style>
