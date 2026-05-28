<template>
    <view class="order-confirm-page">
        <view class="page-header">
            <view class="back-btn" @click="goBack">
                <text class="back-icon">‹</text>
            </view>
            <text class="header-title">订单确认</text>
            <view class="header-placeholder"></view>
        </view>

        <view class="content-wrapper" v-if="itemDetail">
            <view class="address-section" @click="selectAddress">
                <view class="address-content" v-if="selectedAddress">
                    <view class="address-header">
                        <text class="receiver-name">{{ selectedAddress.name }}</text>
                        <text class="receiver-phone">{{ selectedAddress.phone }}</text>
                    </view>
                    <text class="address-detail">{{ selectedAddress.province }}{{ selectedAddress.city }}{{ selectedAddress.district }}{{ selectedAddress.detail }}</text>
                </view>
                <view class="address-empty" v-else>
                    <text class="empty-icon">📍</text>
                    <text class="empty-text">请选择收货地址</text>
                </view>
                <text class="arrow-icon">›</text>
            </view>

            <view class="item-section">
                <text class="section-title">商品信息</text>
                <view class="item-card">
                    <image
                        class="item-image"
                        :src="itemDetail.coverImage || itemDetail.images?.[0] || '/static/placeholder.png'"
                        mode="aspectFill"
                        lazy-load
                    />
                    <view class="item-info">
                        <text class="item-title">{{ itemDetail.title }}</text>
                        <view class="item-meta">
                            <text class="condition-tag">{{ getConditionText(itemDetail.condition) }}</text>
                        </view>
                        <view class="item-price">
                            <text class="price-symbol">¥</text>
                            <text class="price-value">{{ itemDetail.price?.toFixed(2) || '0.00' }}</text>
                        </view>
                    </view>
                </view>
            </view>

            <view class="quantity-section">
                <text class="section-label">购买数量</text>
                <view class="quantity-control">
                    <view class="qty-btn" :class="{ disabled: quantity <= 1 }" @click="decreaseQuantity">
                        <text class="qty-icon">-</text>
                    </view>
                    <text class="qty-value">{{ quantity }}</text>
                    <view class="qty-btn" :class="{ disabled: quantity >= maxQuantity }" @click="increaseQuantity">
                        <text class="qty-icon">+</text>
                    </view>
                </view>
            </view>

            <view class="seller-section">
                <text class="section-label">卖家信息</text>
                <view class="seller-info">
                    <image
                        class="seller-avatar"
                        :src="itemDetail.seller?.avatar || '/static/default_avatar.png'"
                    />
                    <view class="seller-detail">
                        <text class="seller-name">{{ itemDetail.seller?.nickname || '匿名用户' }}</text>
                        <view class="seller-credit" :class="getCreditClass(itemDetail.seller?.creditLevel)">
                            <text class="credit-text">{{ getCreditText(itemDetail.seller?.creditLevel) }}</text>
                        </view>
                    </view>
                </view>
            </view>

            <view class="remark-section">
                <text class="section-label">备注（选填）</text>
                <textarea
                    class="remark-input"
                    v-model="remark"
                    placeholder="有什么想对卖家说的..."
                    :maxlength="200"
                />
            </view>

            <view class="fee-section">
                <view class="fee-row">
                    <text class="fee-label">商品金额</text>
                    <text class="fee-value">¥{{ itemTotal.toFixed(2) }}</text>
                </view>
                <view class="fee-row">
                    <text class="fee-label">运费</text>
                    <text class="fee-value">{{ shippingFee > 0 ? '¥' + shippingFee.toFixed(2) : '包邮' }}</text>
                </view>
                <view class="fee-row total">
                    <text class="fee-label">实付金额</text>
                    <view class="total-price">
                        <text class="price-symbol">¥</text>
                        <text class="price-value">{{ totalAmount.toFixed(2) }}</text>
                    </view>
                </view>
            </view>
        </view>

        <view class="loading-state" v-if="loading">
            <view class="spinner"></view>
            <text class="loading-text">加载中...</text>
        </view>

        <view class="bottom-bar" v-if="itemDetail">
            <view class="total-info">
                <text class="total-label">实付：</text>
                <view class="total-price">
                    <text class="price-symbol">¥</text>
                    <text class="price-value">{{ totalAmount.toFixed(2) }}</text>
                </view>
            </view>
            <button class="submit-btn" :disabled="!canSubmit" @click="submitOrder">
                <text class="btn-text">提交订单</text>
            </button>
        </view>
    </view>
</template>

<script>
import http from '@/common/interceptor.js'
import { useUserStore } from '@/store/user.js'

export default {
    name: 'OrderConfirm',
    data() {
        return {
            itemId: '',
            itemDetail: null,
            selectedAddress: null,
            quantity: 1,
            maxQuantity: 1,
            shippingFee: 0,
            remark: '',
            loading: false,
            submitting: false
        }
    },
    computed: {
        userStore() {
            return useUserStore()
        },
        itemTotal() {
            const price = this.itemDetail?.price || 0
            return price * this.quantity
        },
        totalAmount() {
            return this.itemTotal + this.shippingFee
        },
        canSubmit() {
            return this.selectedAddress && this.quantity > 0 && !this.submitting
        }
    },
    onLoad(options) {
        if (options && options.itemId) {
            this.itemId = options.itemId
            this.loadItemDetail()
        }
    },
    methods: {
        async loadItemDetail() {
            if (!this.itemId) return

            this.loading = true
            try {
                const res = await http.get(`/api/item/${this.itemId}/detail`)
                if (res) {
                    this.itemDetail = res
                    this.maxQuantity = res.stock || 1
                    this.calculateShippingFee()
                } else {
                    uni.showToast({
                        title: '物品信息加载失败',
                        icon: 'none'
                    })
                }
            } catch (error) {
                console.error('Load item detail failed:', error)
                this.loadMockDetail()
            } finally {
                this.loading = false
            }
        },

        loadMockDetail() {
            this.itemDetail = {
                id: this.itemId,
                title: 'iPhone 12 Pro 256G 远峰蓝',
                price: 4299,
                condition: 'excellent',
                coverImage: '',
                images: [''],
                stock: 1,
                seller: {
                    id: 'seller001',
                    nickname: '数码爱好者',
                    avatar: '',
                    creditLevel: 'excellent'
                }
            }
            this.shippingFee = 0
        },

        calculateShippingFee() {
            this.shippingFee = 0
        },

        selectAddress() {
            uni.showToast({
                title: '选择地址功能开发中',
                icon: 'none'
            })
        },

        decreaseQuantity() {
            if (this.quantity > 1) {
                this.quantity--
            }
        },

        increaseQuantity() {
            if (this.quantity < this.maxQuantity) {
                this.quantity++
            } else {
                uni.showToast({
                    title: `最多购买${this.maxQuantity}件`,
                    icon: 'none'
                })
            }
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

        async submitOrder() {
            if (!this.canSubmit) return

            this.submitting = true
            try {
                const params = {
                    itemId: this.itemId,
                    quantity: this.quantity,
                    addressId: this.selectedAddress.id,
                    remark: this.remark
                }

                const res = await http.post('/api/order/create', params)
                if (res) {
                    uni.showToast({
                        title: '订单创建成功',
                        icon: 'success'
                    })
                    setTimeout(() => {
                        uni.navigateBack()
                    }, 1500)
                }
            } catch (error) {
                console.error('Submit order failed:', error)
                uni.showToast({
                    title: error.message || '提交失败，请重试',
                    icon: 'none'
                })
            } finally {
                this.submitting = false
            }
        },

        goBack() {
            uni.navigateBack()
        }
    }
}
</script>

<style lang="scss" scoped>
.order-confirm-page {
    min-height: 100vh;
    background: #f5f5f5;
    padding-bottom: 160rpx;
}

.page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20rpx 30rpx;
    padding-top: 60rpx;
    background: #ffffff;
    position: sticky;
    top: 0;
    z-index: 100;
}

.back-btn {
    width: 60rpx;
    height: 60rpx;
    display: flex;
    align-items: center;
    justify-content: center;
}

.back-icon {
    font-size: 48rpx;
    color: #333;
    font-weight: 300;
}

.header-title {
    font-size: 34rpx;
    font-weight: 600;
    color: #333;
}

.header-placeholder {
    width: 60rpx;
}

.content-wrapper {
    padding: 20rpx;
}

.address-section {
    display: flex;
    align-items: center;
    background: #ffffff;
    border-radius: 16rpx;
    padding: 30rpx;
    margin-bottom: 20rpx;
    gap: 20rpx;
}

.address-content {
    flex: 1;
}

.address-header {
    display: flex;
    align-items: center;
    gap: 20rpx;
    margin-bottom: 12rpx;
}

.receiver-name {
    font-size: 30rpx;
    font-weight: 600;
    color: #333;
}

.receiver-phone {
    font-size: 28rpx;
    color: #666;
}

.address-detail {
    font-size: 26rpx;
    color: #666;
    line-height: 1.5;
}

.address-empty {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 12rpx;
}

.empty-icon {
    font-size: 32rpx;
    opacity: 0.5;
}

.empty-text {
    font-size: 28rpx;
    color: #999;
}

.arrow-icon {
    font-size: 36rpx;
    color: #ddd;
    font-weight: 600;
}

.item-section,
.quantity-section,
.seller-section,
.remark-section {
    background: #ffffff;
    border-radius: 16rpx;
    padding: 30rpx;
    margin-bottom: 20rpx;
}

.section-title,
.section-label {
    display: block;
    font-size: 30rpx;
    font-weight: 600;
    color: #333;
    margin-bottom: 20rpx;
}

.item-card {
    display: flex;
    gap: 20rpx;
}

.item-image {
    width: 160rpx;
    height: 160rpx;
    border-radius: 12rpx;
    background: #f0f0f0;
    flex-shrink: 0;
}

.item-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}

.item-title {
    font-size: 28rpx;
    font-weight: 500;
    color: #333;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
}

.item-meta {
    margin-top: 12rpx;
}

.condition-tag {
    display: inline-block;
    padding: 4rpx 12rpx;
    background: #f5f5f5;
    border-radius: 6rpx;
    font-size: 22rpx;
    color: #666;
}

.item-price {
    display: flex;
    align-items: baseline;
    gap: 2rpx;
    margin-top: 12rpx;
}

.price-symbol {
    font-size: 24rpx;
    font-weight: 600;
    color: #ff4757;
}

.price-value {
    font-size: 36rpx;
    font-weight: 700;
    color: #ff4757;
}

.quantity-section {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.quantity-control {
    display: flex;
    align-items: center;
    gap: 4rpx;
}

.qty-btn {
    width: 60rpx;
    height: 60rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f5f5f5;
    border-radius: 8rpx;

    &.disabled {
        opacity: 0.4;
    }
}

.qty-icon {
    font-size: 32rpx;
    color: #333;
    font-weight: 300;
}

.qty-value {
    min-width: 80rpx;
    text-align: center;
    font-size: 30rpx;
    font-weight: 600;
    color: #333;
}

.seller-info {
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
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8rpx;
}

.seller-name {
    font-size: 28rpx;
    font-weight: 600;
    color: #333;
}

.seller-credit {
    align-self: flex-start;
    padding: 4rpx 12rpx;
    border-radius: 6rpx;

    &.excellent {
        background: rgba(7, 193, 96, 0.1);
        .credit-text { color: #07c160; }
    }
    &.good {
        background: rgba(255, 149, 0, 0.1);
        .credit-text { color: #ff9500; }
    }
    &.medium {
        background: rgba(153, 153, 153, 0.1);
        .credit-text { color: #999; }
    }
    &.low {
        background: rgba(255, 71, 87, 0.1);
        .credit-text { color: #ff4757; }
    }
}

.credit-text {
    font-size: 22rpx;
    font-weight: 500;
}

.remark-input {
    width: 100%;
    min-height: 120rpx;
    padding: 20rpx;
    background: #f9f9f9;
    border-radius: 12rpx;
    font-size: 28rpx;
    color: #333;
    box-sizing: border-box;
}

.fee-section {
    background: #ffffff;
    border-radius: 16rpx;
    padding: 30rpx;
}

.fee-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12rpx 0;

    &.total {
        padding-top: 20rpx;
        margin-top: 12rpx;
        border-top: 1rpx solid #f0f0f0;
    }
}

.fee-label {
    font-size: 26rpx;
    color: #666;
}

.fee-value {
    font-size: 26rpx;
    color: #333;
}

.total-price {
    display: flex;
    align-items: baseline;
    gap: 2rpx;

    .price-symbol {
        font-size: 26rpx;
    }

    .price-value {
        font-size: 40rpx;
    }
}

.loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 120rpx;
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

.bottom-bar {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20rpx 30rpx;
    padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
    background: #ffffff;
    box-shadow: 0 -2rpx 20rpx rgba(0, 0, 0, 0.08);
    z-index: 100;
    gap: 20rpx;
}

.total-info {
    display: flex;
    align-items: baseline;
}

.total-label {
    font-size: 26rpx;
    color: #666;
}

.submit-btn {
    flex: 1;
    max-width: 300rpx;
    height: 80rpx;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 40rpx;
    border: none;

    &::after { border: none; }

    &:disabled {
        opacity: 0.5;
    }
}

.btn-text {
    font-size: 30rpx;
    font-weight: 600;
    color: #ffffff;
}
</style>
