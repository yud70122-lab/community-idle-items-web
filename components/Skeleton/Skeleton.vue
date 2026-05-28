<template>
    <view class="skeleton-wrapper" v-if="visible">
        <view class="skeleton-image" :class="{ animated: animated }">
            <view class="skeleton-image-inner"></view>
            <view class="skeleton-counter" v-if="showCounter"></view>
            <view class="skeleton-back-btn" v-if="showBack"></view>
        </view>

        <view class="skeleton-content">
            <view class="skeleton-price-section">
                <view class="skeleton-price-line" :class="{ animated: animated }"></view>
                <view class="skeleton-tag" :class="{ animated: animated }"></view>
            </view>

            <view class="skeleton-title-section">
                <view class="skeleton-title-line" :class="{ animated: animated }"></view>
                <view class="skeleton-meta-line" :class="{ animated: animated }"></view>
            </view>

            <view class="skeleton-tag-section" v-if="showTags">
                <view class="skeleton-tag-item" v-for="i in tagCount" :key="i" :class="{ animated: animated }"></view>
            </view>

            <view class="skeleton-info-section">
                <view class="skeleton-info-row" v-for="i in infoRows" :key="i">
                    <view class="skeleton-info-label" :class="{ animated: animated }"></view>
                    <view class="skeleton-info-value" :class="{ animated: animated }"></view>
                </view>
            </view>

            <view class="skeleton-desc-section">
                <view class="skeleton-desc-line short" :class="{ animated: animated }"></view>
                <view class="skeleton-desc-line" :class="{ animated: animated }"></view>
                <view class="skeleton-desc-line short" :class="{ animated: animated }"></view>
            </view>

            <view class="skeleton-seller-section">
                <view class="skeleton-avatar" :class="{ animated: animated }"></view>
                <view class="skeleton-seller-info">
                    <view class="skeleton-seller-name" :class="{ animated: animated }"></view>
                    <view class="skeleton-seller-meta" :class="{ animated: animated }"></view>
                </view>
            </view>
        </view>

        <view class="skeleton-bottom-bar" v-if="showBottomBar">
            <view class="skeleton-bar-actions">
                <view class="skeleton-action-item" v-for="i in 2" :key="i" :class="{ animated: animated }"></view>
            </view>
            <view class="skeleton-bar-buttons">
                <view class="skeleton-btn" v-for="i in btnCount" :key="i" :class="{ animated: animated }"></view>
            </view>
        </view>
    </view>
</template>

<script>
export default {
    name: 'Skeleton',
    props: {
        visible: {
            type: Boolean,
            default: false
        },
        animated: {
            type: Boolean,
            default: true
        },
        showCounter: {
            type: Boolean,
            default: true
        },
        showBack: {
            type: Boolean,
            default: true
        },
        showTags: {
            type: Boolean,
            default: true
        },
        tagCount: {
            type: Number,
            default: 3
        },
        infoRows: {
            type: Number,
            default: 3
        },
        showBottomBar: {
            type: Boolean,
            default: true
        },
        btnCount: {
            type: Number,
            default: 2
        }
    }
}
</script>

<style lang="scss" scoped>
.skeleton-wrapper {
    min-height: 100vh;
    background: #f5f5f5;
}

.skeleton-image {
    position: relative;
    width: 100%;
    height: 600rpx;
    background: #e8e8e8;
    overflow: hidden;

    .skeleton-image-inner {
        width: 100%;
        height: 100%;
    }
}

.skeleton-counter {
    position: absolute;
    right: 24rpx;
    bottom: 24rpx;
    width: 100rpx;
    height: 40rpx;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 20rpx;
}

.skeleton-back-btn {
    position: absolute;
    left: 24rpx;
    top: 60rpx;
    width: 64rpx;
    height: 64rpx;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 50%;
}

.skeleton-content {
    background: #ffffff;
    margin-top: -20rpx;
    border-radius: 20rpx 20rpx 0 0;
    padding: 30rpx;
}

.skeleton-price-section {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 30rpx;
}

.skeleton-price-line {
    width: 200rpx;
    height: 60rpx;
    background: #e8e8e8;
    border-radius: 8rpx;
}

.skeleton-tag {
    width: 80rpx;
    height: 40rpx;
    background: #e8e8e8;
    border-radius: 8rpx;
}

.skeleton-title-section {
    margin-bottom: 30rpx;
}

.skeleton-title-line {
    width: 80%;
    height: 40rpx;
    background: #e8e8e8;
    border-radius: 8rpx;
    margin-bottom: 16rpx;
}

.skeleton-meta-line {
    width: 40%;
    height: 28rpx;
    background: #e8e8e8;
    border-radius: 6rpx;
}

.skeleton-tag-section {
    display: flex;
    flex-wrap: wrap;
    gap: 12rpx;
    margin-bottom: 30rpx;
}

.skeleton-tag-item {
    width: 120rpx;
    height: 40rpx;
    background: #e8e8e8;
    border-radius: 8rpx;
}

.skeleton-info-section {
    margin-bottom: 30rpx;
}

.skeleton-info-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12rpx 0;
}

.skeleton-info-label {
    width: 120rpx;
    height: 28rpx;
    background: #e8e8e8;
    border-radius: 6rpx;
}

.skeleton-info-value {
    width: 200rpx;
    height: 28rpx;
    background: #e8e8e8;
    border-radius: 6rpx;
}

.skeleton-desc-section {
    margin-bottom: 30rpx;
}

.skeleton-desc-line {
    width: 100%;
    height: 28rpx;
    background: #e8e8e8;
    border-radius: 6rpx;
    margin-bottom: 12rpx;

    &.short {
        width: 70%;
    }
}

.skeleton-seller-section {
    display: flex;
    align-items: center;
    gap: 20rpx;
    margin-top: 30rpx;
}

.skeleton-avatar {
    width: 80rpx;
    height: 80rpx;
    background: #e8e8e8;
    border-radius: 50%;
}

.skeleton-seller-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 12rpx;
}

.skeleton-seller-name {
    width: 150rpx;
    height: 28rpx;
    background: #e8e8e8;
    border-radius: 6rpx;
}

.skeleton-seller-meta {
    width: 120rpx;
    height: 24rpx;
    background: #e8e8e8;
    border-radius: 6rpx;
}

.skeleton-bottom-bar {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    padding: 16rpx 24rpx;
    padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
    background: #ffffff;
    box-shadow: 0 -2rpx 20rpx rgba(0, 0, 0, 0.08);
    z-index: 100;
    gap: 20rpx;
}

.skeleton-bar-actions {
    display: flex;
    align-items: center;
    gap: 30rpx;
}

.skeleton-action-item {
    width: 60rpx;
    height: 60rpx;
    background: #e8e8e8;
    border-radius: 50%;
}

.skeleton-bar-buttons {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 16rpx;
}

.skeleton-btn {
    flex: 1;
    height: 72rpx;
    background: #e8e8e8;
    border-radius: 36rpx;
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
