<template>
    <view class="item-detail-page">
        <view class="swiper-section" v-if="detail">
            <swiper
                class="image-swiper"
                :indicator-dots="mediaList.length > 1"
                :indicator-color="'rgba(255,255,255,0.4)'"
                :indicator-active-color="'#ffffff'"
                :autoplay="mediaList.length > 1"
                :interval="4000"
                :duration="500"
                :circular="true"
                :current="currentMediaIndex"
                @change="onSwiperChange"
            >
                <swiper-item v-for="(item, index) in mediaList" :key="index">
                    <image
                        v-if="item.type === 'image'"
                        class="swiper-media"
                        :src="item.url"
                        mode="aspectFill"
                        @click="previewImage(index)"
                    />
                    <video
                        v-else-if="item.type === 'video'"
                        class="swiper-media"
                        :src="item.url"
                        :controls="true"
                        :autoplay="false"
                        :loop="false"
                        :show-center-play-btn="true"
                        object-fit="cover"
                    />
                </swiper-item>
            </swiper>
            <view class="swiper-counter" v-if="mediaList.length > 1">
                <text class="counter-text">{{ currentMediaIndex + 1 }}/{{ mediaList.length }}</text>
            </view>
            <view class="back-btn" @click="goBack">
                <text class="back-icon">‹</text>
            </view>
            
            <view class="panorama-btn" v-if="hasPanorama" @click="openPanoramaViewer">
                <text class="panorama-icon">🔄</text>
                <text class="panorama-text">360°查看</text>
            </view>
        </view>

        <view class="content-wrapper" v-if="detail">
            <view class="price-section">
                <view class="price-wrapper" v-if="detail.price && detail.price > 0">
                    <text class="price-symbol">¥</text>
                    <text class="price-value">{{ detail.price.toFixed(2) }}</text>
                    <text class="original-price" v-if="detail.originalPrice && detail.originalPrice > detail.price">
                        ¥{{ detail.originalPrice.toFixed(2) }}
                    </text>
                </view>
                <view class="price-wrapper free" v-else-if="detail.price === 0 || detail.price === '0'">
                    <text class="price-value">免费</text>
                </view>
                <view class="trade-tag" :class="detail.tradeType">
                    <text class="tag-text">{{ getTradeTag(detail.tradeType) }}</text>
                </view>
            </view>

            <view class="title-section">
                <text class="item-title">{{ detail.title }}</text>
                <view class="item-meta">
                    <view class="meta-item">
                        <text class="meta-icon">📅</text>
                        <text class="meta-text">{{ formatTime(detail.createTime) }}</text>
                    </view>
                    <view class="meta-item">
                        <text class="meta-icon">👁</text>
                        <text class="meta-text">{{ detail.viewCount || 0 }} 浏览</text>
                    </view>
                </view>
            </view>

            <view class="tag-section" v-if="detail.tags && detail.tags.length > 0">
                <view class="item-tag" v-for="(tag, index) in detail.tags" :key="index">
                    <text class="tag-text">{{ tag }}</text>
                </view>
            </view>

            <view class="info-section">
                <view class="info-row">
                    <text class="info-label">成色</text>
                    <text class="info-value">{{ getConditionText(detail.condition) }}</text>
                </view>
                <view class="info-row location-row" v-if="detail.location">
                    <text class="info-label">位置</text>
                    <text class="info-value">{{ detail.location }}</text>
                    <view class="location-btn" @click="viewLocation">
                        <text class="location-btn-icon">📍</text>
                        <text class="location-btn-text">查看位置</text>
                    </view>
                </view>
                <view class="info-row" v-if="detail.category">
                    <text class="info-label">分类</text>
                    <text class="info-value">{{ detail.category }}</text>
                </view>
            </view>

            <view class="desc-section">
                <text class="section-title">物品描述</text>
                <text class="desc-text">{{ detail.description || '暂无描述' }}</text>
            </view>

            <view class="seller-section" @click.stop="openSellerCreditPopup">
                <view class="seller-info">
                    <image
                        class="seller-avatar"
                        :src="detail.seller?.avatar || '/static/default_avatar.png'"
                    />
                    <view class="seller-detail">
                        <text class="seller-name">{{ detail.seller?.nickname || '匿名用户' }}</text>
                        <view class="seller-meta">
                            <view class="credit-badge" :class="getCreditClass(detail.seller?.creditLevel)">
                                <text class="badge-text">{{ getCreditText(detail.seller?.creditLevel) }}</text>
                            </view>
                            <text class="publish-count">
                                发布 {{ detail.seller?.publishCount || 0 }} 件
                            </text>
                        </view>
                    </view>
                </view>
                <text class="arrow-icon">›</text>
            </view>

            <RecommendList
                v-if="detail.id"
                :item-id="detail.id"
                :category-id="detail.categoryId"
                :price="detail.price"
                :tags="detail.tags"
                @item-click="onRecommendItemClick"
            />
        </view>

        <view class="loading-state" v-if="loading">
            <view class="spinner"></view>
            <text class="loading-text">加载中...</text>
        </view>

        <view class="error-state" v-if="!loading && !detail">
            <text class="error-icon">😕</text>
            <text class="error-text">物品不存在或已下架</text>
            <button class="retry-btn" @click="loadDetail">重新加载</button>
        </view>

        <view class="bottom-bar" v-if="detail && detail.status === 'online'">
            <view class="bar-actions">
                <view class="action-item" @click="toggleFavorite">
                    <text class="action-icon">{{ isFavorited ? '❤️' : '🤍' }}</text>
                    <text class="action-text">收藏</text>
                </view>
                <view class="action-item" @click="shareItem">
                    <text class="action-icon">📤</text>
                    <text class="action-text">分享</text>
                </view>
            </view>
            <view class="bar-buttons">
                <button class="btn btn-secondary" @click="contactSeller">
                    <text class="btn-text">联系卖家</text>
                </button>
                <button class="btn btn-primary" @click="buyNow">
                    <text class="btn-text">立即购买</text>
                </button>
            </view>
        </view>

        <PanoramaViewer
            :visible="showPanoramaViewer"
            :image-url="panoramaImageUrl"
            :images="panoramaImages"
            @close="closePanoramaViewer"
        />

        <SellerCreditPopup
            :visible="showSellerPopup"
            :seller="detail?.seller || {}"
            @close="closeSellerPopup"
            @follow-change="onFollowChange"
            @send-message="onSendMessage"
        />
    </view>
</template>

<script>
import http from '@/common/interceptor.js'
import RecommendList from '@/components/RecommendList/RecommendList.vue'
import PanoramaViewer from '@/components/PanoramaViewer/PanoramaViewer.vue'
import SellerCreditPopup from '@/components/SellerCreditPopup/SellerCreditPopup.vue'

export default {
    name: 'ItemDetail',
    components: {
        RecommendList,
        PanoramaViewer,
        SellerCreditPopup
    },
    data() {
        return {
            itemId: '',
            detail: null,
            loading: false,
            mediaList: [],
            currentMediaIndex: 0,
            isFavorited: false,
            showPanoramaViewer: false,
            showSellerPopup: false,
            viewCounted: false
        }
    },
    computed: {
        isOnline() {
            return this.detail && this.detail.status === 'online'
        },
        hasPanorama() {
            return !!(this.detail?.panoramaImage || (this.detail?.panoramaImages && this.detail.panoramaImages.length > 0))
        },
        panoramaImageUrl() {
            return this.detail?.panoramaImage || this.detail?.panoramaImages?.[0] || ''
        },
        panoramaImages() {
            return this.detail?.panoramaImages || []
        }
    },
    onLoad(options) {
        if (options && options.id) {
            this.itemId = options.id
            this.loadDetail()
        }
    },
    onShareAppMessage() {
        return {
            title: this.detail?.title || '快来看看这个闲置物品',
            path: `/pages/item_detail/item_detail?id=${this.itemId}`,
            imageUrl: this.mediaList?.[0]?.url || this.detail?.coverImage
        }
    },
    onShareTimeline() {
        return {
            title: this.detail?.title || '快来看看这个闲置物品',
            imageUrl: this.mediaList?.[0]?.url || this.detail?.coverImage
        }
    },
    methods: {
        async loadDetail() {
            if (!this.itemId) return

            this.loading = true
            try {
                const res = await http.get(`/api/item/${this.itemId}/detail`)
                if (res) {
                    this.detail = res
                    this.buildMediaList(res)
                    this.checkFavoriteStatus()
                    this.recordView()
                }
            } catch (error) {
                console.error('Load item detail failed:', error)
                this.loadMockDetail()
            } finally {
                this.loading = false
            }
        },

        async recordView() {
            if (this.viewCounted || !this.itemId) return
            this.viewCounted = true
            
            try {
                await http.post(`/api/item/${this.itemId}/view`)
                if (this.detail) {
                    this.detail.viewCount = (this.detail.viewCount || 0) + 1
                }
            } catch (error) {
                console.error('Record view failed:', error)
            }
        },

        async checkFavoriteStatus() {
            if (!this.itemId) return
            
            try {
                const res = await http.get('/api/favorite/status', {
                    itemId: this.itemId
                })
                if (res) {
                    this.isFavorited = res.isFavorited || false
                }
            } catch (error) {
                console.error('Check favorite status failed:', error)
            }
        },

        async toggleFavorite() {
            if (!this.itemId) return

            try {
                if (this.isFavorited) {
                    await http.post('/api/favorite/remove', {
                        itemId: this.itemId
                    })
                    this.isFavorited = false
                    uni.showToast({
                        title: '已取消收藏',
                        icon: 'success'
                    })
                } else {
                    await http.post('/api/favorite/add', {
                        itemId: this.itemId
                    })
                    this.isFavorited = true
                    uni.showToast({
                        title: '收藏成功',
                        icon: 'success'
                    })
                }
            } catch (error) {
                console.error('Toggle favorite failed:', error)
                uni.showToast({
                    title: '操作失败，请重试',
                    icon: 'none'
                })
            }
        },

        loadMockDetail() {
            this.detail = {
                id: this.itemId,
                title: 'iPhone 12 Pro 256G 远峰蓝',
                price: 4299,
                originalPrice: 8499,
                tradeType: 'sell',
                condition: 'excellent',
                description: '自用iPhone 12 Pro，使用一年多，保养非常好。无磕碰、无维修、电池健康87%。配件齐全，包装盒都在。因为换新机所以出掉，价格可小刀，大刀勿扰。',
                coverImage: '',
                images: ['', '', ''],
                videos: [],
                panoramaImage: '',
                panoramaImages: [],
                tags: ['苹果', 'iPhone', '手机', '九成新'],
                category: '数码电子',
                categoryId: '1',
                location: '北京市朝阳区',
                latitude: 39.908823,
                longitude: 116.397470,
                viewCount: 328,
                createTime: Date.now() - 2 * 24 * 60 * 60 * 1000,
                status: 'online',
                seller: {
                    id: 'seller001',
                    nickname: '数码爱好者',
                    avatar: '',
                    creditLevel: 'excellent',
                    creditPoints: 1850,
                    positiveRate: '98%',
                    exchangeCount: 45,
                    publishCount: 12,
                    memberSince: Date.now() - 365 * 24 * 60 * 60 * 1000
                }
            }
            this.buildMediaList(this.detail)
            this.isFavorited = false
            this.recordView()
        },

        buildMediaList(detail) {
            const list = []

            if (detail.videos && detail.videos.length > 0) {
                detail.videos.forEach(video => {
                    list.push({
                        type: 'video',
                        url: typeof video === 'string' ? video : video.url
                    })
                })
            }

            if (detail.images && detail.images.length > 0) {
                detail.images.forEach(img => {
                    list.push({
                        type: 'image',
                        url: typeof img === 'string' ? img : img.url
                    })
                })
            }

            if (list.length === 0 && detail.coverImage) {
                list.push({
                    type: 'image',
                    url: detail.coverImage
                })
            }

            this.mediaList = list
        },

        onSwiperChange(e) {
            this.currentMediaIndex = e.detail.current
        },

        previewImage(index) {
            const imageUrls = this.mediaList
                .filter(m => m.type === 'image')
                .map(m => m.url)

            const currentImage = this.mediaList[index]?.url

            uni.previewImage({
                urls: imageUrls,
                current: currentImage
            })
        },

        openPanoramaViewer() {
            this.showPanoramaViewer = true
        },

        closePanoramaViewer() {
            this.showPanoramaViewer = false
        },

        openSellerCreditPopup() {
            if (!this.detail?.seller?.id) return
            this.showSellerPopup = true
        },

        closeSellerPopup() {
            this.showSellerPopup = false
        },

        onFollowChange(data) {
            console.log('Follow status changed:', data)
        },

        onSendMessage(seller) {
            console.log('Send message to:', seller)
        },

        viewLocation() {
            if (!this.detail) return
            
            const { latitude, longitude, location, id, title } = this.detail
            if (!latitude || !longitude) {
                uni.showToast({
                    title: '位置信息不完整',
                    icon: 'none'
                })
                return
            }

            uni.navigateTo({
                url: `/pages/item_location/item_location?id=${id}&latitude=${latitude}&longitude=${longitude}&address=${encodeURIComponent(location)}&title=${encodeURIComponent(title)}`
            })
        },

        getTradeTag(type) {
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
        },

        formatTime(timestamp) {
            if (!timestamp) return '刚刚'

            const now = Date.now()
            const diff = now - timestamp

            const minute = 60 * 1000
            const hour = 60 * minute
            const day = 24 * hour

            if (diff < minute) {
                return '刚刚'
            } else if (diff < hour) {
                return `${Math.floor(diff / minute)}分钟前`
            } else if (diff < day) {
                return `${Math.floor(diff / hour)}小时前`
            } else if (diff < 30 * day) {
                return `${Math.floor(diff / day)}天前`
            } else {
                const date = new Date(timestamp)
                return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
            }
        },

        shareItem() {
            uni.showShareMenu({
                withShareTicket: true,
                menus: ['shareAppMessage', 'shareTimeline']
            })
            uni.showToast({
                title: '请点击右上角分享',
                icon: 'none'
            })
        },

        contactSeller() {
            uni.showToast({
                title: '联系卖家功能开发中',
                icon: 'none'
            })
        },

        buyNow() {
            uni.showToast({
                title: '购买功能开发中',
                icon: 'none'
            })
        },

        goToSellerHome() {
            if (this.detail?.seller?.id) {
                uni.navigateTo({
                    url: `/pages/user_home/user_home?id=${this.detail.seller.id}`
                })
            }
        },

        onRecommendItemClick(item) {
            uni.navigateTo({
                url: `/pages/item_detail/item_detail?id=${item.id}`
            })
        },

        goBack() {
            uni.navigateBack()
        }
    }
}
</script>

<style lang="scss" scoped>
.item-detail-page {
    min-height: 100vh;
    background: #f5f5f5;
    padding-bottom: 140rpx;
}

.swiper-section {
    position: relative;
    width: 100%;
    height: 600rpx;
    background: #000;
}

.image-swiper {
    width: 100%;
    height: 100%;
}

.swiper-media {
    width: 100%;
    height: 100%;
}

.swiper-counter {
    position: absolute;
    right: 24rpx;
    bottom: 24rpx;
    padding: 8rpx 16rpx;
    background: rgba(0, 0, 0, 0.6);
    border-radius: 20rpx;
}

.counter-text {
    font-size: 24rpx;
    color: #ffffff;
}

.back-btn {
    position: absolute;
    left: 24rpx;
    top: 60rpx;
    width: 64rpx;
    height: 64rpx;
    background: rgba(0, 0, 0, 0.4);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
}

.back-icon {
    font-size: 48rpx;
    color: #ffffff;
    font-weight: 300;
    margin-top: -4rpx;
}

.panorama-btn {
    position: absolute;
    right: 24rpx;
    top: 60rpx;
    display: flex;
    align-items: center;
    gap: 8rpx;
    padding: 12rpx 24rpx;
    background: rgba(0, 0, 0, 0.6);
    border-radius: 30rpx;
    z-index: 10;
}

.panorama-icon {
    font-size: 28rpx;
}

.panorama-text {
    font-size: 24rpx;
    color: #ffffff;
    font-weight: 500;
}

.content-wrapper {
    background: #ffffff;
    margin-top: -20rpx;
    border-radius: 20rpx 20rpx 0 0;
    position: relative;
    z-index: 20;
}

.price-section {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 30rpx;
    border-bottom: 1rpx solid #f0f0f0;
}

.price-wrapper {
    display: flex;
    align-items: baseline;
    gap: 4rpx;

    &.free .price-value {
        color: #07c160;
        font-size: 40rpx;
    }
}

.price-symbol {
    font-size: 28rpx;
    font-weight: 600;
    color: #ff4757;
}

.price-value {
    font-size: 48rpx;
    font-weight: 700;
    color: #ff4757;
}

.original-price {
    font-size: 26rpx;
    color: #999;
    text-decoration: line-through;
    margin-left: 12rpx;
}

.trade-tag {
    padding: 8rpx 20rpx;
    border-radius: 8rpx;

    &.sell {
        background: rgba(255, 71, 87, 0.1);
        .tag-text { color: #ff4757; }
    }
    &.exchange {
        background: rgba(7, 193, 96, 0.1);
        .tag-text { color: #07c160; }
    }
    &.both {
        background: rgba(102, 126, 234, 0.1);
        .tag-text { color: #667eea; }
    }
    &.free {
        background: rgba(255, 149, 0, 0.1);
        .tag-text { color: #ff9500; }
    }
}

.tag-text {
    font-size: 24rpx;
    font-weight: 500;
}

.title-section {
    padding: 24rpx 30rpx;
    border-bottom: 1rpx solid #f0f0f0;
}

.item-title {
    display: block;
    font-size: 34rpx;
    font-weight: 600;
    color: #333;
    line-height: 1.4;
    margin-bottom: 16rpx;
}

.item-meta {
    display: flex;
    align-items: center;
    gap: 30rpx;
}

.meta-item {
    display: flex;
    align-items: center;
    gap: 6rpx;
}

.meta-icon {
    font-size: 22rpx;
    opacity: 0.6;
}

.meta-text {
    font-size: 24rpx;
    color: #999;
}

.tag-section {
    display: flex;
    flex-wrap: wrap;
    gap: 12rpx;
    padding: 20rpx 30rpx;
    border-bottom: 1rpx solid #f0f0f0;
}

.item-tag {
    padding: 6rpx 16rpx;
    background: #f5f5f5;
    border-radius: 6rpx;
}

.item-tag .tag-text {
    font-size: 22rpx;
    color: #666;
}

.info-section {
    padding: 20rpx 30rpx;
    border-bottom: 1rpx solid #f0f0f0;
}

.info-row {
    display: flex;
    align-items: center;
    padding: 12rpx 0;

    &.location-row {
        position: relative;
    }
}

.info-label {
    width: 120rpx;
    font-size: 26rpx;
    color: #999;
}

.info-value {
    flex: 1;
    font-size: 26rpx;
    color: #333;
}

.location-btn {
    display: flex;
    align-items: center;
    gap: 6rpx;
    padding: 8rpx 16rpx;
    background: rgba(102, 126, 234, 0.1);
    border-radius: 20rpx;
}

.location-btn-icon {
    font-size: 22rpx;
}

.location-btn-text {
    font-size: 22rpx;
    color: #667eea;
    font-weight: 500;
}

.desc-section {
    padding: 30rpx;
    border-bottom: 1rpx solid #f0f0f0;
}

.section-title {
    display: block;
    font-size: 28rpx;
    font-weight: 600;
    color: #333;
    margin-bottom: 16rpx;
}

.desc-text {
    display: block;
    font-size: 26rpx;
    color: #666;
    line-height: 1.6;
}

.seller-section {
    display: flex;
    align-items: center;
    padding: 24rpx 30rpx;
    border-bottom: 1rpx solid #f0f0f0;
}

.seller-info {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 20rpx;
}

.seller-avatar {
    width: 80rpx;
    height: 80rpx;
    border-radius: 50%;
    background: #f0f0f0;
}

.seller-detail {
    display: flex;
    flex-direction: column;
    gap: 8rpx;
}

.seller-name {
    font-size: 28rpx;
    font-weight: 600;
    color: #333;
}

.seller-meta {
    display: flex;
    align-items: center;
    gap: 16rpx;
}

.credit-badge {
    padding: 4rpx 10rpx;
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
    font-size: 20rpx;
    font-weight: 500;
}

.publish-count {
    font-size: 22rpx;
    color: #999;
}

.arrow-icon {
    font-size: 40rpx;
    color: #ddd;
    font-weight: 600;
}

.loading-state,
.error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 200rpx 40rpx;
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

.loading-text,
.error-text {
    font-size: 26rpx;
    color: #999;
}

.error-icon {
    font-size: 100rpx;
    margin-bottom: 20rpx;
}

.retry-btn {
    margin-top: 30rpx;
    min-width: 200rpx;
    height: 72rpx;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 36rpx;
    border: none;

    &::after { border: none; }
}

.retry-btn .btn-text {
    color: #ffffff;
    font-size: 26rpx;
    font-weight: 500;
}

.bottom-bar {
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

.bar-actions {
    display: flex;
    align-items: center;
    gap: 30rpx;
}

.action-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4rpx;
    min-width: 80rpx;
}

.action-icon {
    font-size: 36rpx;
}

.action-text {
    font-size: 20rpx;
    color: #666;
}

.bar-buttons {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 16rpx;
}

.btn {
    flex: 1;
    height: 72rpx;
    border-radius: 36rpx;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;

    &::after { border: none; }

    &.btn-secondary {
        background: #f0f0f0;
        .btn-text { color: #333; }
    }

    &.btn-primary {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        .btn-text { color: #ffffff; }
    }
}

.btn .btn-text {
    font-size: 28rpx;
    font-weight: 600;
}
</style>
