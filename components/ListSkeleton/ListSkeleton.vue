<template>
    <view class="list-skeleton" v-if="visible">
        <view class="skeleton-header" v-if="showHeader">
            <view class="skeleton-category-list">
                <view class="skeleton-category-item" v-for="i in categoryCount" :key="i">
                    <view class="skeleton-category-icon" :class="{ animated: animated }"></view>
                    <view class="skeleton-category-name" :class="{ animated: animated }"></view>
                </view>
            </view>
        </view>

        <view class="skeleton-section-header">
            <view class="skeleton-section-title" :class="{ animated: animated }"></view>
            <view class="skeleton-section-count" :class="{ animated: animated }"></view>
        </view>

        <view class="skeleton-item-grid">
            <view class="skeleton-item-card" v-for="i in itemCount" :key="i">
                <view class="skeleton-item-image" :class="{ animated: animated }"></view>
                <view class="skeleton-item-content">
                    <view class="skeleton-item-title" :class="{ animated: animated }"></view>
                    <view class="skeleton-item-meta">
                        <view class="skeleton-item-tag" :class="{ animated: animated }"></view>
                        <view class="skeleton-item-distance" :class="{ animated: animated }"></view>
                    </view>
                    <view class="skeleton-item-footer">
                        <view class="skeleton-item-price" :class="{ animated: animated }"></view>
                        <view class="skeleton-item-count" :class="{ animated: animated }"></view>
                    </view>
                </view>
            </view>
        </view>
    </view>
</template>

<script>
export default {
    name: 'ListSkeleton',
    props: {
        visible: {
            type: Boolean,
            default: false
        },
        animated: {
            type: Boolean,
            default: true
        },
        showHeader: {
            type: Boolean,
            default: true
        },
        categoryCount: {
            type: Number,
            default: 6
        },
        itemCount: {
            type: Number,
            default: 6
        }
    }
}
</script>

<style lang="scss" scoped>
.list-skeleton {
    min-height: 100vh;
    background: #f5f5f5;
}

.skeleton-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 60rpx 30rpx 20rpx;
}

.skeleton-category-list {
    display: inline-flex;
    gap: 8rpx;
}

.skeleton-category-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6rpx;
    padding: 16rpx 24rpx;
}

.skeleton-category-icon {
    width: 48rpx;
    height: 48rpx;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 50%;
}

.skeleton-category-name {
    width: 60rpx;
    height: 24rpx;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 4rpx;
}

.skeleton-section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20rpx;
    background: #ffffff;
}

.skeleton-section-title {
    width: 120rpx;
    height: 32rpx;
    background: #e8e8e8;
    border-radius: 8rpx;
}

.skeleton-section-count {
    width: 80rpx;
    height: 24rpx;
    background: #e8e8e8;
    border-radius: 6rpx;
}

.skeleton-item-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 20rpx;
    padding: 0 20rpx;
    background: #ffffff;
}

.skeleton-item-card {
    width: calc((100% - 20rpx) / 2);
    background: #ffffff;
    border-radius: 16rpx;
    overflow: hidden;
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
}

.skeleton-item-image {
    width: 100%;
    height: 240rpx;
    background: #e8e8e8;
}

.skeleton-item-content {
    padding: 16rpx;
}

.skeleton-item-title {
    width: 90%;
    height: 28rpx;
    background: #e8e8e8;
    border-radius: 6rpx;
    margin-bottom: 12rpx;
}

.skeleton-item-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12rpx;
}

.skeleton-item-tag {
    width: 80rpx;
    height: 32rpx;
    background: #e8e8e8;
    border-radius: 8rpx;
}

.skeleton-item-distance {
    width: 60rpx;
    height: 24rpx;
    background: #e8e8e8;
    border-radius: 6rpx;
}

.skeleton-item-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.skeleton-item-price {
    width: 100rpx;
    height: 36rpx;
    background: #e8e8e8;
    border-radius: 8rpx;
}

.skeleton-item-count {
    width: 40rpx;
    height: 24rpx;
    background: #e8e8e8;
    border-radius: 6rpx;
}

.animated {
    position: relative;
    overflow: hidden;

    &::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.4) 50%,
            transparent 100%
        );
        animation: shimmer 1.5s infinite;
    }
}

@keyframes shimmer {
    0% {
        transform: translateX(-100%);
    }
    100% {
        transform: translateX(100%);
    }
}
</style>
