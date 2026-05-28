<template>
    <view class="item-card" @click="handleClick">
        <view class="card-image-wrapper">
            <image
                class="card-image"
                :src="item.coverImage || item.images?.[0] || placeholderImage"
                mode="aspectFill"
                lazy-load
                :loading-flag="true"
            />
            <view class="image-tags">
                <view class="tag trade-tag" :class="item.tradeType">
                    <text class="tag-text">{{ getTradeTagText(item.tradeType) }}</text>
                </view>
                <view class="tag condition-tag">
                    <text class="tag-text">{{ getConditionText(item.condition) }}</text>
                </view>
            </view>
        </view>

        <view class="card-content">
            <text class="card-title">{{ item.title }}</text>

            <view class="card-meta">
                <view class="credit-level" :class="getCreditClass(item.creditLevel)">
                    <text class="credit-icon">⭐</text>
                    <text class="credit-text">{{ getCreditText(item.creditLevel) }}</text>
                </view>
                <view class="item-distance">
                    <text class="distance-icon">📍</text>
                    <text class="distance-text">{{ item.distance || '附近' }}</text>
                </view>
            </view>

            <view class="card-footer">
                <view class="item-price" v-if="item.price && item.price > 0">
                    <text class="price-symbol">¥</text>
                    <text class="price-value">{{ item.price.toFixed(0) }}</text>
                </view>
                <view class="item-price free" v-else-if="item.price === 0 || item.price === '0'">
                    <text class="price-value">免费</text>
                </view>
                <view class="item-price exchange" v-else>
                    <text class="exchange-icon">🔄</text>
                    <text class="price-value">可交换</text>
                </view>
                <view class="view-count">
                    <text class="view-icon">👁</text>
                    <text class="view-text">{{ item.viewCount || 0 }}</text>
                </view>
            </view>
        </view>
    </view>
</template>

<script>
export default {
    name: 'ItemCard',
    props: {
        item: {
            type: Object,
            required: true,
            default: () => ({})
        }
    },
    data() {
        return {
            placeholderImage: '/static/placeholder.png'
        }
    },
    methods: {
        handleClick() {
            this.$emit('click', this.item)
            if (this.item.id) {
                uni.navigateTo({
                    url: `/pages/item_detail/item_detail?id=${this.item.id}`
                })
            }
        },

        getTradeTagText(type) {
            const typeMap = {
                sell: '出售',
                exchange: '交换',
                both: '可交换',
                free: '免费'
            }
            return typeMap[type] || '出售'
        },

        getConditionText(condition) {
            const conditionMap = {
                new: '全新',
                like_new: '几乎全新',
                excellent: '九成新',
                good: '八成新',
                fair: '七成新',
                used: '六成新以下'
            }
            return conditionMap[condition] || '九成新'
        },

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
        }
    }
}
</script>

<style lang="scss" scoped>
.item-card {
    background: #ffffff;
    border-radius: 16rpx;
    overflow: hidden;
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
    transition: transform 0.2s ease, box-shadow 0.2s ease;

    &:active {
        transform: scale(0.98);
        box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.1);
    }
}

.card-image-wrapper {
    position: relative;
    width: 100%;
    height: 240rpx;
    overflow: hidden;
}

.card-image {
    width: 100%;
    height: 100%;
    background: #f0f0f0;
}

.image-tags {
    position: absolute;
    top: 12rpx;
    left: 12rpx;
    right: 12rpx;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
}

.tag {
    padding: 6rpx 14rpx;
    border-radius: 8rpx;
    backdrop-filter: blur(10px);

    &.trade-tag {
        &.sell {
            background: rgba(255, 71, 87, 0.9);
        }
        &.exchange {
            background: rgba(7, 193, 96, 0.9);
        }
        &.both {
            background: rgba(102, 126, 234, 0.9);
        }
        &.free {
            background: rgba(255, 149, 0, 0.9);
        }
    }

    &.condition-tag {
        background: rgba(0, 0, 0, 0.6);
    }
}

.tag-text {
    font-size: 20rpx;
    color: #ffffff;
    font-weight: 500;
}

.card-content {
    padding: 16rpx;
}

.card-title {
    display: block;
    font-size: 28rpx;
    font-weight: 600;
    color: #333;
    margin-bottom: 12rpx;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.card-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12rpx;
}

.credit-level {
    display: flex;
    align-items: center;
    gap: 4rpx;
    padding: 4rpx 10rpx;
    border-radius: 8rpx;

    &.excellent {
        background: rgba(7, 193, 96, 0.1);
        .credit-icon, .credit-text { color: #07c160; }
    }
    &.good {
        background: rgba(255, 149, 0, 0.1);
        .credit-icon, .credit-text { color: #ff9500; }
    }
    &.medium {
        background: rgba(153, 153, 153, 0.1);
        .credit-icon, .credit-text { color: #999; }
    }
    &.low {
        background: rgba(255, 71, 87, 0.1);
        .credit-icon, .credit-text { color: #ff4757; }
    }
}

.credit-icon {
    font-size: 18rpx;
}

.credit-text {
    font-size: 20rpx;
    font-weight: 500;
}

.item-distance {
    display: flex;
    align-items: center;
    gap: 4rpx;
}

.distance-icon {
    font-size: 18rpx;
}

.distance-text {
    font-size: 20rpx;
    color: #999;
}

.card-footer {
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
        font-size: 28rpx;
    }

    &.exchange {
        gap: 4rpx;
        .exchange-icon {
            font-size: 24rpx;
        }
        .price-value {
            color: #667eea;
            font-size: 26rpx;
        }
    }
}

.price-symbol {
    font-size: 22rpx;
    font-weight: 600;
    color: #ff4757;
}

.price-value {
    font-size: 32rpx;
    font-weight: 700;
    color: #ff4757;
}

.view-count {
    display: flex;
    align-items: center;
    gap: 4rpx;
}

.view-icon {
    font-size: 18rpx;
    color: #ccc;
}

.view-text {
    font-size: 20rpx;
    color: #ccc;
}
</style>
