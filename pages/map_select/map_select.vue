<template>
    <view class="map-select-page">
        <view class="search-header">
            <view class="search-bar">
                <text class="search-icon">🔍</text>
                <input
                    class="search-input"
                    v-model="searchKeyword"
                    placeholder="搜索地点、街道、小区"
                    maxlength="50"
                    @confirm="searchLocation"
                    @input="onSearchInput"
                />
                <view class="clear-btn" v-if="searchKeyword" @click="clearSearch">
                    <text class="clear-icon">×</text>
                </view>
            </view>
            <view class="cancel-btn" @click="goBack">
                <text class="cancel-text">取消</text>
            </view>
        </view>

        <view class="search-results" v-if="showSearchResults && searchResults.length > 0">
            <scroll-view class="results-list" scroll-y>
                <view
                    v-for="(item, index) in searchResults"
                    :key="index"
                    class="result-item"
                    :class="{ selected: selectedResultIndex === index }"
                    @click="selectSearchResult(item, index)"
                >
                    <view class="result-icon">
                        <text class="icon-text">📍</text>
                    </view>
                    <view class="result-info">
                        <text class="result-title">{{ item.name || item.title }}</text>
                        <text class="result-address">{{ item.address }}</text>
                    </view>
                    <view class="result-check" v-if="selectedResultIndex === index">
                        <text class="check-icon">✓</text>
                    </view>
                </view>
            </scroll-view>
        </view>

        <view class="map-container" v-else>
            <map
                id="mapContext"
                ref="mapRef"
                class="map-view"
                :latitude="currentLatitude"
                :longitude="currentLongitude"
                :scale="16"
                :markers="markers"
                :show-location="true"
                :enable-3D="false"
                :enable-overlooking="false"
                :enable-zoom="true"
                :enable-scroll="true"
                :enable-rotate="false"
                :show-compass="false"
                :include-padding="[100, 100, 100, 100]"
                @regionchange="onRegionChange"
                @tap="onMapTap"
                @poitap="onPoiTap"
            />

            <view class="center-marker">
                <view class="marker-pin">
                    <text class="pin-icon">📍</text>
                </view>
                <view class="marker-shadow"></view>
            </view>

            <view class="map-locate-btn" @click="moveToCurrentLocation">
                <text class="locate-icon">🎯</text>
            </view>
        </view>

        <view class="location-panel" v-if="!showSearchResults">
            <view class="panel-header">
                <text class="panel-title">{{ selectedLocation.name || '选择位置' }}</text>
                <text class="panel-subtitle" v-if="selectedLocation.address">
                    {{ selectedLocation.address }}
                </text>
                <view class="loading-indicator" v-if="geocoding">
                    <text class="loading-text">地址解析中...</text>
                </view>
            </view>

            <view class="nearby-section" v-if="nearbyPois.length > 0">
                <text class="section-title">附近位置</text>
                <scroll-view class="nearby-list" scroll-y>
                    <view
                        v-for="(poi, index) in nearbyPois"
                        :key="index"
                        class="nearby-item"
                        :class="{ selected: selectedPoiIndex === index }"
                        @click="selectNearbyPoi(poi, index)"
                    >
                        <view class="nearby-icon">
                            <text class="icon-text">🏢</text>
                        </view>
                        <view class="nearby-info">
                            <text class="nearby-name">{{ poi.name || poi.title }}</text>
                            <text class="nearby-address">{{ poi.address }}</text>
                        </view>
                        <view class="nearby-distance" v-if="poi.distance">
                            <text class="distance-text">{{ formatDistance(poi.distance) }}</text>
                        </view>
                        <view class="nearby-check" v-if="selectedPoiIndex === index">
                            <text class="check-icon">✓</text>
                        </view>
                    </view>
                </scroll-view>
            </view>

            <view class="confirm-section">
                <button
                    class="confirm-btn"
                    :class="{ disabled: !canConfirm }"
                    :disabled="!canConfirm"
                    @click="confirmSelection"
                >
                    <text class="btn-text">确定选择</text>
                </button>
            </view>
        </view>
    </view>
</template>

<script>
import { debounce } from '@/utils/debounce.js'
import http from '@/common/interceptor.js'

export default {
    name: 'MapSelectPage',

    data() {
        return {
            currentLatitude: 39.908823,
            currentLongitude: 116.397470,
            mapContext: null,

            searchKeyword: '',
            showSearchResults: false,
            searchResults: [],
            selectedResultIndex: -1,
            searchDebounced: null,

            selectedLocation: {
                latitude: null,
                longitude: null,
                address: '',
                name: '',
                detail: ''
            },
            selectedPoiIndex: -1,
            geocoding: false,

            nearbyPois: [],
            markers: [],

            isMoving: false
        }
    },

    computed: {
        canConfirm() {
            return this.selectedLocation.latitude != null &&
                   this.selectedLocation.longitude != null &&
                   this.selectedLocation.address
        }
    },

    onLoad(options) {
        if (options) {
            if (options.latitude && options.longitude) {
                this.currentLatitude = parseFloat(options.latitude)
                this.currentLongitude = parseFloat(options.longitude)
                this.selectedLocation.latitude = this.currentLatitude
                this.selectedLocation.longitude = this.currentLongitude
            }
            if (options.address) {
                this.selectedLocation.address = decodeURIComponent(options.address)
            }
        }

        this.searchDebounced = debounce(this.searchLocation.bind(this), 500)

        this.initMap()

        if (!this.selectedLocation.latitude || !this.selectedLocation.longitude) {
            this.getCurrentLocation()
        } else {
            this.updateMarker()
            this.reverseGeocode(this.currentLatitude, this.currentLongitude)
            this.loadNearbyPois(this.currentLatitude, this.currentLongitude)
        }
    },

    onReady() {
        // #ifdef MP-WEIXIN
        this.mapContext = wx.createMapContext('mapContext', this)
        // #endif
        // #ifdef APP-PLUS || H5
        this.mapContext = uni.createMapContext('mapContext', this)
        // #endif
    },

    methods: {
        async initMap() {
            this.updateMarker()
        },

        async getCurrentLocation() {
            try {
                // #ifdef MP-WEIXIN
                const res = await new Promise((resolve, reject) => {
                    wx.getLocation({
                        type: 'gcj02',
                        isHighAccuracy: true,
                        success: resolve,
                        fail: reject
                    })
                })
                // #endif

                // #ifndef MP-WEIXIN
                const res = await new Promise((resolve, reject) => {
                    uni.getLocation({
                        type: 'gcj02',
                        isHighAccuracy: true,
                        success: resolve,
                        fail: reject
                    })
                })
                // #endif

                this.currentLatitude = res.latitude
                this.currentLongitude = res.longitude
                this.selectedLocation.latitude = res.latitude
                this.selectedLocation.longitude = res.longitude

                this.updateMarker()
                this.moveMapTo(res.latitude, res.longitude)
                this.reverseGeocode(res.latitude, res.longitude)
                this.loadNearbyPois(res.latitude, res.longitude)

            } catch (error) {
                console.error('Get location failed:', error)
                uni.showToast({
                    title: '获取位置失败，请检查定位权限',
                    icon: 'none'
                })
            }
        },

        updateMarker() {
            this.markers = [{
                id: 0,
                latitude: this.currentLatitude,
                longitude: this.currentLongitude,
                iconPath: '/static/marker.png',
                width: 40,
                height: 40,
                callout: {
                    content: this.selectedLocation.name || this.selectedLocation.address || '当前位置',
                    color: '#333333',
                    fontSize: 12,
                    borderRadius: 8,
                    bgColor: '#ffffff',
                    padding: 8,
                    display: this.selectedLocation.address ? 'ALWAYS' : 'BYCLICK'
                }
            }]
        },

        moveMapTo(latitude, longitude) {
            if (this.mapContext) {
                this.mapContext.moveToLocation({
                    latitude,
                    longitude,
                    success: () => {
                        console.log('Map moved to:', latitude, longitude)
                    },
                    fail: (err) => {
                        console.error('Move map failed:', err)
                    }
                })
            }
        },

        moveToCurrentLocation() {
            this.getCurrentLocation()
        },

        onRegionChange(e) {
            if (e.type === 'end' && !this.showSearchResults) {
                const { latitude, longitude } = e.detail || {}
                if (latitude && longitude) {
                    this.currentLatitude = latitude
                    this.currentLongitude = longitude
                    this.selectedLocation.latitude = latitude
                    this.selectedLocation.longitude = longitude

                    this.updateMarker()
                    this.reverseGeocode(latitude, longitude)
                    this.loadNearbyPois(latitude, longitude)
                }
            }
        },

        onMapTap(e) {
            const { latitude, longitude } = e.detail || {}
            if (latitude && longitude) {
                this.currentLatitude = latitude
                this.currentLongitude = longitude
                this.selectedLocation.latitude = latitude
                this.selectedLocation.longitude = longitude

                this.updateMarker()
                this.moveMapTo(latitude, longitude)
                this.reverseGeocode(latitude, longitude)
                this.loadNearbyPois(latitude, longitude)
            }
        },

        onPoiTap(e) {
            const { name, latitude, longitude, address } = e.detail || {}
            if (latitude && longitude) {
                this.selectedLocation = {
                    latitude,
                    longitude,
                    address: address || name || '',
                    name: name || '',
                    detail: address || ''
                }
                this.currentLatitude = latitude
                this.currentLongitude = longitude
                this.selectedPoiIndex = -1

                this.updateMarker()
                this.moveMapTo(latitude, longitude)
            }
        },

        async reverseGeocode(latitude, longitude) {
            this.geocoding = true

            try {
                const res = await http.post('/api/common/reverse-geocode', {
                    latitude,
                    longitude
                })

                if (res && res.code === 0 && res.data) {
                    this.selectedLocation.address = res.data.address || ''
                    this.selectedLocation.detail = res.data.detail || res.data.formattedAddress || ''
                    if (!this.selectedLocation.name) {
                        this.selectedLocation.name = res.data.poiName || res.data.street || ''
                    }
                }
            } catch (error) {
                console.error('Reverse geocode failed:', error)
            } finally {
                this.geocoding = false
                this.updateMarker()
            }
        },

        async loadNearbyPois(latitude, longitude) {
            try {
                const res = await http.post('/api/common/nearby-pois', {
                    latitude,
                    longitude,
                    radius: 500,
                    pageSize: 10
                })

                if (res && res.code === 0 && res.data && res.data.list) {
                    this.nearbyPois = res.data.list
                } else {
                    this.nearbyPois = this.getMockNearbyPois()
                }
            } catch (error) {
                console.error('Load nearby pois failed:', error)
                this.nearbyPois = this.getMockNearbyPois()
            }
        },

        getMockNearbyPois() {
            return [
                { name: '万达广场', address: '建国路88号', distance: 150 },
                { name: 'SOHO现代城', address: '建国路88号', distance: 280 },
                { name: '大望路地铁站', address: '地铁1号线', distance: 350 },
                { name: '合生汇购物中心', address: '西大望路21号', distance: 500 },
                { name: '珠江帝景', address: '西大望路23号', distance: 650 }
            ]
        },

        onSearchInput(e) {
            const value = e.detail.value
            this.searchKeyword = value

            if (value && value.trim().length > 0) {
                this.showSearchResults = true
                this.searchDebounced(value)
            } else {
                this.showSearchResults = false
                this.searchResults = []
                this.selectedResultIndex = -1
            }
        },

        async searchLocation() {
            const keyword = this.searchKeyword.trim()
            if (!keyword) return

            try {
                const res = await http.post('/api/common/search-poi', {
                    keyword,
                    latitude: this.currentLatitude,
                    longitude: this.currentLongitude,
                    city: ''
                })

                if (res && res.code === 0 && res.data && res.data.list) {
                    this.searchResults = res.data.list
                } else {
                    this.searchResults = this.getMockSearchResults(keyword)
                }
            } catch (error) {
                console.error('Search location failed:', error)
                this.searchResults = this.getMockSearchResults(keyword)
            }
        },

        getMockSearchResults(keyword) {
            return [
                { name: `${keyword} - 万达广场`, address: '建国路88号', latitude: 39.9088, longitude: 116.3975 },
                { name: `${keyword} - 国贸中心`, address: '建国门外大街1号', latitude: 39.9095, longitude: 116.4055 },
                { name: `${keyword} - 华贸中心`, address: '建国路87号', latitude: 39.9082, longitude: 116.4025 }
            ]
        },

        selectSearchResult(item, index) {
            this.selectedResultIndex = index
            this.selectedLocation = {
                latitude: item.latitude,
                longitude: item.longitude,
                address: item.address || '',
                name: item.name || item.title || '',
                detail: item.address || ''
            }

            this.currentLatitude = item.latitude
            this.currentLongitude = item.longitude
            this.showSearchResults = false
            this.searchKeyword = item.name || item.title || ''

            this.updateMarker()
            this.moveMapTo(item.latitude, item.longitude)
            this.loadNearbyPois(item.latitude, item.longitude)
        },

        selectNearbyPoi(poi, index) {
            this.selectedPoiIndex = index
            this.selectedLocation = {
                latitude: poi.latitude || this.currentLatitude,
                longitude: poi.longitude || this.currentLongitude,
                address: poi.address || '',
                name: poi.name || poi.title || '',
                detail: poi.address || ''
            }

            if (poi.latitude && poi.longitude) {
                this.currentLatitude = poi.latitude
                this.currentLongitude = poi.longitude
                this.updateMarker()
                this.moveMapTo(poi.latitude, poi.longitude)
            }
        },

        clearSearch() {
            this.searchKeyword = ''
            this.showSearchResults = false
            this.searchResults = []
            this.selectedResultIndex = -1
        },

        formatDistance(meters) {
            if (meters < 1000) {
                return `${Math.round(meters)}m`
            }
            return `${(meters / 1000).toFixed(1)}km`
        },

        confirmSelection() {
            if (!this.canConfirm) return

            const location = {
                latitude: this.selectedLocation.latitude,
                longitude: this.selectedLocation.longitude,
                address: this.selectedLocation.address,
                name: this.selectedLocation.name,
                detail: this.selectedLocation.detail
            }

            uni.$emit('locationSelected', location)

            uni.showToast({
                title: '已选择位置',
                icon: 'success',
                duration: 1500
            })

            setTimeout(() => {
                uni.navigateBack()
            }, 1500)
        },

        goBack() {
            uni.navigateBack()
        }
    }
}
</script>

<style lang="scss" scoped>
.map-select-page {
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: #ffffff;
}

.search-header {
    display: flex;
    align-items: center;
    gap: 16rpx;
    padding: 24rpx 30rpx;
    background: #ffffff;
    border-bottom: 1rpx solid #f0f0f0;
    z-index: 100;
}

.search-bar {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 12rpx;
    height: 72rpx;
    padding: 0 24rpx;
    background: #f8f9fa;
    border-radius: 36rpx;
}

.search-icon {
    font-size: 28rpx;
    color: #999;
}

.search-input {
    flex: 1;
    height: 72rpx;
    font-size: 28rpx;
    color: #333;
}

.clear-btn {
    width: 40rpx;
    height: 40rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #ddd;
    border-radius: 50%;
}

.clear-icon {
    font-size: 24rpx;
    color: #ffffff;
    line-height: 1;
}

.cancel-btn {
    padding: 8rpx 16rpx;
}

.cancel-text {
    font-size: 28rpx;
    color: #667eea;
}

.search-results {
    flex: 1;
    background: #ffffff;
}

.results-list {
    height: calc(100vh - 120rpx);
}

.result-item {
    display: flex;
    align-items: center;
    gap: 16rpx;
    padding: 24rpx 30rpx;
    border-bottom: 1rpx solid #f5f5f5;
    transition: all 0.2s;

    &:active {
        background: #f8f9fa;
    }

    &.selected {
        background: rgba(102, 126, 234, 0.05);
    }
}

.result-icon {
    width: 56rpx;
    height: 56rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(102, 126, 234, 0.1);
    border-radius: 12rpx;
    flex-shrink: 0;

    .icon-text {
        font-size: 28rpx;
    }
}

.result-info {
    flex: 1;
    min-width: 0;
}

.result-title {
    display: block;
    font-size: 28rpx;
    font-weight: 500;
    color: #333;
    margin-bottom: 6rpx;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.result-address {
    display: block;
    font-size: 22rpx;
    color: #999;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.result-check {
    width: 40rpx;
    height: 40rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #667eea;
    border-radius: 50%;

    .check-icon {
        font-size: 24rpx;
        color: #ffffff;
        font-weight: 700;
    }
}

.map-container {
    flex: 1;
    position: relative;
}

.map-view {
    width: 100%;
    height: 100%;
}

.center-marker {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -100%);
    pointer-events: none;
    z-index: 10;
}

.marker-pin {
    width: 60rpx;
    height: 60rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: bounce 0.6s ease;

    .pin-icon {
        font-size: 48rpx;
    }
}

@keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10rpx); }
}

.marker-shadow {
    width: 24rpx;
    height: 8rpx;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 50%;
    margin: -4rpx auto 0;
    filter: blur(2rpx);
}

.map-locate-btn {
    position: absolute;
    right: 30rpx;
    bottom: 320rpx;
    width: 88rpx;
    height: 88rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #ffffff;
    border-radius: 50%;
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.15);
    z-index: 20;

    &:active {
        transform: scale(0.95);
    }

    .locate-icon {
        font-size: 40rpx;
    }
}

.location-panel {
    background: #ffffff;
    border-radius: 32rpx 32rpx 0 0;
    padding: 30rpx 30rpx calc(30rpx + env(safe-area-inset-bottom));
    box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.08);
    max-height: 500rpx;
    display: flex;
    flex-direction: column;
    gap: 24rpx;
}

.panel-header {
    .panel-title {
        display: block;
        font-size: 32rpx;
        font-weight: 600;
        color: #333;
        margin-bottom: 8rpx;
    }

    .panel-subtitle {
        display: block;
        font-size: 24rpx;
        color: #999;
    }

    .loading-text {
        font-size: 24rpx;
        color: #667eea;
    }
}

.nearby-section {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
}

.section-title {
    font-size: 26rpx;
    font-weight: 600;
    color: #333;
    margin-bottom: 16rpx;
}

.nearby-list {
    flex: 1;
    max-height: 240rpx;
}

.nearby-item {
    display: flex;
    align-items: center;
    gap: 16rpx;
    padding: 20rpx 0;
    border-bottom: 1rpx solid #f5f5f5;
    transition: all 0.2s;

    &:last-child {
        border-bottom: none;
    }

    &:active {
        background: #f8f9fa;
    }

    &.selected {
        background: rgba(102, 126, 234, 0.05);
        border-radius: 12rpx;
        padding: 20rpx 16rpx;
        margin: 0 -16rpx;
    }
}

.nearby-icon {
    width: 48rpx;
    height: 48rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f8f9fa;
    border-radius: 10rpx;
    flex-shrink: 0;

    .icon-text {
        font-size: 24rpx;
    }
}

.nearby-info {
    flex: 1;
    min-width: 0;
}

.nearby-name {
    display: block;
    font-size: 26rpx;
    font-weight: 500;
    color: #333;
    margin-bottom: 4rpx;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.nearby-address {
    display: block;
    font-size: 22rpx;
    color: #999;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.nearby-distance {
    flex-shrink: 0;

    .distance-text {
        font-size: 22rpx;
        color: #667eea;
    }
}

.nearby-check {
    width: 36rpx;
    height: 36rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #667eea;
    border-radius: 50%;

    .check-icon {
        font-size: 20rpx;
        color: #ffffff;
        font-weight: 700;
    }
}

.confirm-section {
    padding-top: 16rpx;
    border-top: 1rpx solid #f0f0f0;
}

.confirm-btn {
    width: 100%;
    height: 88rpx;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 44rpx;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;

    &.disabled {
        opacity: 0.5;
    }

    .btn-text {
        color: #ffffff;
        font-size: 30rpx;
        font-weight: 600;
    }
}
</style>
