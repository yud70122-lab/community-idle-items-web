<template>
    <view class="exchange-confirm-page">
        <view class="page-header">
            <view class="back-btn" @click="goBack">
                <text class="back-icon">‹</text>
            </view>
            <text class="header-title">交换确认</text>
            <view class="header-placeholder"></view>
        </view>

        <view class="content-wrapper" v-if="itemDetail">
            <view class="target-item-section">
                <text class="section-title">对方物品</text>
                <view class="item-card">
                    <image
                        class="item-image"
                        :src="itemDetail.coverImage || itemDetail.images?.[0] || '/static/placeholder.png'"
                        mode="aspectFill"
                        lazy-load
                    />
                    <view class="item-info">
                        <text class="item-title">{{ itemDetail.title }}</text>
                        <view class="item-price">
                            <text class="price-symbol">¥</text>
                            <text class="price-value">{{ itemDetail.price?.toFixed(2) || '0.00' }}</text>
                        </view>
                        <view class="seller-info">
                            <image
                                class="seller-avatar"
                                :src="itemDetail.seller?.avatar || '/static/default_avatar.png'"
                            />
                            <text class="seller-name">{{ itemDetail.seller?.nickname || '匿名用户' }}</text>
                        </view>
                    </view>
                </view>
            </view>

            <view class="my-items-section">
                <view class="section-header">
                    <text class="section-title">我要交换的物品</text>
                    <view class="add-btn" @click="selectMyItem">
                        <text class="add-icon">+</text>
                        <text class="add-text">选择物品</text>
                    </view>
                </view>
                <view class="empty-state" v-if="!selectedItem">
                    <text class="empty-icon">📦</text>
                    <text class="empty-text">请选择您要交换的物品</text>
                </view>
                <view class="selected-item-card" v-else>
                    <image
                        class="item-image"
                        :src="selectedItem.coverImage || selectedItem.images?.[0] || '/static/placeholder.png'"
                        mode="aspectFill"
                        lazy-load
                    />
                    <view class="item-info">
                        <text class="item-title">{{ selectedItem.title }}</text>
                        <view class="item-price">
                            <text class="price-symbol">¥</text>
                            <text class="price-value">{{ selectedItem.price?.toFixed(2) || '0.00' }}</text>
                        </view>
                        <view class="remove-btn" @click="removeSelectedItem">
                            <text class="remove-text">更换</text>
                        </view>
                    </view>
                </view>
            </view>

            <view class="exchange-message-section">
                <text class="section-title">交换留言（选填）</text>
                <textarea
                    class="message-input"
                    v-model="exchangeMessage"
                    placeholder="可以写下您想对卖家说的话..."
                    :maxlength="200"
                />
                <text class="char-count">{{ exchangeMessage.length }}/200</text>
            </view>

            <view class="agreement-section">
                <view class="checkbox-wrapper" @click="toggleAgreement">
                    <view class="checkbox" :class="{ checked: agreedToTerms }">
                        <text class="check-icon" v-if="agreedToTerms">✓</text>
                    </view>
                    <text class="agreement-text">
                        我已阅读并同意
                        <text class="link-text" @click.stop="viewTerms">《交换协议》</text>
                        ，了解交换风险
                    </text>
                </view>
            </view>
        </view>

        <view class="loading-state" v-if="loading">
            <view class="spinner"></view>
            <text class="loading-text">加载中...</text>
        </view>

        <view class="bottom-bar" v-if="itemDetail">
            <view class="price-info">
                <text class="price-label">预估价值差</text>
                <view class="price-diff">
                    <text class="diff-symbol" v-if="priceDiff > 0">+</text>
                    <text class="diff-value">¥{{ Math.abs(priceDiff).toFixed(2) }}</text>
                    <text class="diff-note" v-if="priceDiff !== 0">{{ priceDiff > 0 ? '需补差价' : '对方补差价' }}</text>
                </view>
            </view>
            <button class="submit-btn" :disabled="!canSubmit" @click="submitExchange">
                <text class="btn-text">确认交换</text>
            </button>
        </view>
    </view>
</template>

<script>
import http from '@/common/interceptor.js'
import { useUserStore } from '@/store/user.js'

export default {
    name: 'ExchangeConfirm',
    data() {
        return {
            itemId: '',
            itemDetail: null,
            selectedItem: null,
            exchangeMessage: '',
            agreedToTerms: false,
            loading: false,
            submitting: false
        }
    },
    computed: {
        userStore() {
            return useUserStore()
        },
        priceDiff() {
            const myPrice = this.selectedItem?.price || 0
            const targetPrice = this.itemDetail?.price || 0
            return targetPrice - myPrice
        },
        canSubmit() {
            return this.selectedItem && this.agreedToTerms && !this.submitting
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
                coverImage: '',
                images: [''],
                seller: {
                    id: 'seller001',
                    nickname: '数码爱好者',
                    avatar: ''
                }
            }
        },

        selectMyItem() {
            uni.showToast({
                title: '选择物品功能开发中',
                icon: 'none'
            })
        },

        removeSelectedItem() {
            this.selectedItem = null
        },

        toggleAgreement() {
            this.agreedToTerms = !this.agreedToTerms
        },

        viewTerms() {
            uni.showModal({
                title: '交换协议',
                content: '1. 交换双方需确保物品信息真实有效\n2. 建议当面验货，确认物品完好\n3. 价值差较大时建议补差价\n4. 交换完成后请及时确认\n5. 如有争议请联系平台客服',
                showCancel: false,
                confirmText: '我知道了'
            })
        },

        async submitExchange() {
            if (!this.canSubmit) return

            this.submitting = true
            try {
                const params = {
                    targetItemId: this.itemId,
                    myItemId: this.selectedItem.id,
                    message: this.exchangeMessage,
                    priceDiff: this.priceDiff
                }

                const res = await http.post('/api/exchange/create', params)
                if (res) {
                    uni.showToast({
                        title: '交换申请已提交',
                        icon: 'success'
                    })
                    setTimeout(() => {
                        uni.navigateBack()
                    }, 1500)
                }
            } catch (error) {
                console.error('Submit exchange failed:', error)
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
.exchange-confirm-page {
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

.section-title {
    display: block;
    font-size: 30rpx;
    font-weight: 600;
    color: #333;
    margin-bottom: 20rpx;
}

.target-item-section {
    background: #ffffff;
    border-radius: 16rpx;
    padding: 30rpx;
    margin-bottom: 20rpx;
}

.item-card,
.selected-item-card {
    display: flex;
    gap: 20rpx;
    background: #f9f9f9;
    border-radius: 12rpx;
    padding: 20rpx;
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

.seller-info {
    display: flex;
    align-items: center;
    gap: 12rpx;
    margin-top: 12rpx;
}

.seller-avatar {
    width: 40rpx;
    height: 40rpx;
    border-radius: 50%;
    background: #f0f0f0;
}

.seller-name {
    font-size: 24rpx;
    color: #666;
}

.my-items-section {
    background: #ffffff;
    border-radius: 16rpx;
    padding: 30rpx;
    margin-bottom: 20rpx;
}

.section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20rpx;
}

.add-btn {
    display: flex;
    align-items: center;
    gap: 6rpx;
    padding: 8rpx 20rpx;
    background: rgba(102, 126, 234, 0.1);
    border-radius: 20rpx;
}

.add-icon {
    font-size: 28rpx;
    color: #667eea;
}

.add-text {
    font-size: 24rpx;
    color: #667eea;
    font-weight: 500;
}

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60rpx 40rpx;
    background: #f9f9f9;
    border-radius: 12rpx;
}

.empty-icon {
    font-size: 80rpx;
    margin-bottom: 16rpx;
    opacity: 0.5;
}

.empty-text {
    font-size: 26rpx;
    color: #999;
}

.remove-btn {
    align-self: flex-start;
    padding: 6rpx 16rpx;
    background: rgba(255, 71, 87, 0.1);
    border-radius: 8rpx;
}

.remove-text {
    font-size: 22rpx;
    color: #ff4757;
}

.exchange-message-section {
    background: #ffffff;
    border-radius: 16rpx;
    padding: 30rpx;
    margin-bottom: 20rpx;
}

.message-input {
    width: 100%;
    min-height: 160rpx;
    padding: 20rpx;
    background: #f9f9f9;
    border-radius: 12rpx;
    font-size: 28rpx;
    color: #333;
    box-sizing: border-box;
}

.char-count {
    display: block;
    text-align: right;
    font-size: 22rpx;
    color: #999;
    margin-top: 8rpx;
}

.agreement-section {
    background: #ffffff;
    border-radius: 16rpx;
    padding: 30rpx;
    margin-bottom: 20rpx;
}

.checkbox-wrapper {
    display: flex;
    align-items: flex-start;
    gap: 16rpx;
}

.checkbox {
    width: 36rpx;
    height: 36rpx;
    border: 2rpx solid #ddd;
    border-radius: 6rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-top: 4rpx;
    transition: all 0.2s;

    &.checked {
        background: #667eea;
        border-color: #667eea;
    }
}

.check-icon {
    font-size: 24rpx;
    color: #ffffff;
    font-weight: bold;
}

.agreement-text {
    flex: 1;
    font-size: 26rpx;
    color: #666;
    line-height: 1.6;
}

.link-text {
    color: #667eea;
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

.price-info {
    display: flex;
    flex-direction: column;
    gap: 4rpx;
}

.price-label {
    font-size: 22rpx;
    color: #999;
}

.price-diff {
    display: flex;
    align-items: baseline;
    gap: 8rpx;
}

.diff-symbol {
    font-size: 24rpx;
    font-weight: 600;
    color: #ff4757;
}

.diff-value {
    font-size: 32rpx;
    font-weight: 700;
    color: #ff4757;
}

.diff-note {
    font-size: 22rpx;
    color: #999;
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
