<template>
    <view class="item-location-map">
        <view class="map-header">
            <view class="header-left" @click="goBack">
                <text class="back-icon">‹</text>
                <text class="header-title">物品位置</text>
            </view>
            <view class="header-right"></view>
        </view>

        <view class="map-container">
            <map
                id="itemMapContext"
                ref="mapRef"
                class="map-view"
                :latitude="fuzzyLatitude"
                :longitude="fuzzyLongitude"
                :scale="14"
                :markers="markers"
                :show-location="false"
                :enable-3D="false"
                :enable-overlooking="false"
                :enable-zoom="true"
                :enable-scroll="true"
                :enable-rotate="false"
                :show-compass="false"
            />
        </view>

        <view class="location-info">
            <view class="info-card">
                <view class="info-header">
                    <text class="location-icon">📍</text>
                    <text class="location-label">大致位置</text>
                </view>
                <text class="location-address">{{ fuzzyAddress }}</text>
                <view class="distance-info" v-if="distance != null">
                    <text class="distance-icon">📏</text>
                    <text class="distance-text">距离您约 {{ formatDistance(distance) }}</text>
                </view>
            </view>
            <view class="privacy-tip">
                <text class="tip-icon">🔒</text>
                <text class="tip-text">为保护隐私，仅显示大致位置</text>
            </view>
        </view>
    </view>
</template>

<script>
import { calculateDistance, formatDistance } from '@/common/map.js'

export default {
    name: 'ItemLocationMap',
    props: {
        latitude: {
            type: Number,
            default: 0
        },
        longitude: {
            type: Number,
            default: 0
        },
        address: {
            type: String,
            default: ''
        },
        itemTitle: {
            type: String,
            default: '物品位置'
        }
    },
    data() {
        return {
            mapContext: null,
            fuzzyLatitude: 0,
            fuzzyLongitude: 0,
            fuzzyAddress: '',
            distance: null,
            markers: []
        }
    },
    onLoad() {
        this.initFuzzyLocation()
    },
    onReady() {
        // #ifdef MP-WEIXIN
        this.mapContext = wx.createMapContext('itemMapContext', this)
        // #endif
        // #ifdef APP-PLUS || H5
        this.mapContext = uni.createMapContext('itemMapContext', this)
        // #endif
    },
    methods: {
        initFuzzyLocation() {
            const fuzzy = this.fuzzyCoordinates(this.latitude, this.longitude)
            this.fuzzyLatitude = fuzzy.latitude
            this.fuzzyLongitude = fuzzy.longitude
            this.fuzzyAddress = this.getFuzzyAddress(this.address)
            this.markers = [{
                id: 0,
                latitude: this.fuzzyLatitude,
                longitude: this.fuzzyLongitude,
                width: 40,
                height: 40,
                callout: {
                    content: this.fuzzyAddress,
                    color: '#333333',
                    fontSize: 12,
                    borderRadius: 8,
                    bgColor: '#ffffff',
                    padding: 8,
                    display: 'ALWAYS'
                }
            }]
            this.calculateUserDistance()
        },
        fuzzyCoordinates(lat, lng) {
            const offset = 0.005 + Math.random() * 0.01
            const direction = Math.random() > 0.5 ? 1 : -1
            return {
                latitude: Number((lat + offset * direction).toFixed(6)),
                longitude: Number((lng + offset * direction).toFixed(6))
            }
        },
        getFuzzyAddress(address) {
            if (!address) return '位置信息'
            const parts = address.split(/[市区街道]/)
            if (parts.length >= 2) {
                return `${parts[0]}${parts[1] || ''}附近`
            }
            const match = address.match(/^(.+?[市区])/)
            if (match) {
                return `${match[1]}附近`
            }
            return address + '附近'
        },
        async calculateUserDistance() {
            try {
                // #ifdef MP-WEIXIN
                const res = await new Promise((resolve, reject) => {
                    wx.getLocation({
                        type: 'gcj02',
                        success: resolve,
                        fail: reject
                    })
                })
                // #endif
                // #ifndef MP-WEIXIN
                const res = await new Promise((resolve, reject) => {
                    uni.getLocation({
                        type: 'gcj02',
                        success: resolve,
                        fail: reject
                    })
                })
                // #endif

                this.distance = calculateDistance(
                    { latitude: res.latitude, longitude: res.longitude },
                    { latitude: this.fuzzyLatitude, longitude: this.fuzzyLongitude }
                )
            } catch (error) {
                console.error('Get user location failed:', error)
            }
        },
        formatDistance,
        goBack() {
            uni.navigateBack()
        }
    }
}
</script>

<style lang="scss" scoped>
.item-location-map {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: #f5f5f5;
}

.map-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 60rpx 30rpx 20rpx;
    background: #ffffff;
    border-bottom: 1rpx solid #f0f0f0;
}

.header-left {
    display: flex;
    align-items: center;
    gap: 8rpx;
}

.back-icon {
    font-size: 48rpx;
    color: #333;
    font-weight: 300;
    line-height: 1;
}

.header-title {
    font-size: 32rpx;
    font-weight: 600;
    color: #333;
}

.map-container {
    flex: 1;
    position: relative;
}

.map-view {
    width: 100%;
    height: 100%;
}

.location-info {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    padding: 30rpx;
    padding-bottom: calc(30rpx + env(safe-area-inset-bottom));
    background: linear-gradient(to top, rgba(0, 0, 0, 0.1), transparent);
}

.info-card {
    background: #ffffff;
    border-radius: 20rpx;
    padding: 30rpx;
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.1);
    margin-bottom: 20rpx;
}

.info-header {
    display: flex;
    align-items: center;
    gap: 8rpx;
    margin-bottom: 12rpx;
}

.location-icon {
    font-size: 28rpx;
}

.location-label {
    font-size: 26rpx;
    font-weight: 600;
    color: #333;
}

.location-address {
    display: block;
    font-size: 30rpx;
    color: #333;
    font-weight: 500;
    margin-bottom: 16rpx;
}

.distance-info {
    display: flex;
    align-items: center;
    gap: 8rpx;
}

.distance-icon {
    font-size: 24rpx;
}

.distance-text {
    font-size: 24rpx;
    color: #667eea;
}

.privacy-tip {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8rpx;
    padding: 16rpx;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 12rpx;
}

.tip-icon {
    font-size: 24rpx;
}

.tip-text {
    font-size: 22rpx;
    color: #999;
}
</style>
