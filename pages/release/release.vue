<template>
    <view class="release-page">
        <view class="page-header">
            <text class="page-title">发布闲置</text>
            <text class="page-subtitle">让闲置物品流动起来</text>
        </view>

        <view class="content-wrapper">
            <view class="trade-type-section">
                <text class="section-label">交易方式</text>
                <view class="trade-tabs">
                    <view
                        v-for="tab in tradeTabs"
                        :key="tab.value"
                        class="trade-tab"
                        :class="{ active: selectedTradeType === tab.value }"
                        @click="selectTradeType(tab.value)"
                    >
                        <text class="tab-icon">{{ tab.icon }}</text>
                        <text class="tab-label">{{ tab.label }}</text>
                        <view class="tab-check" v-if="selectedTradeType === tab.value">
                            <text class="check-icon">✓</text>
                        </view>
                    </view>
                </view>
            </view>

            <view class="basic-info-section">
                <text class="section-label">物品信息</text>

                <view class="form-item">
                    <text class="item-label">物品名称</text>
                    <input
                        class="item-input"
                        v-model="itemName"
                        placeholder="请输入物品名称（如：iPhone 12）"
                        maxlength="30"
                    />
                </view>

                <view class="form-item">
                    <text class="item-label">物品分类</text>
                    <view class="category-select" @click="showCategoryPicker">
                        <text class="category-text" :class="{ placeholder: !selectedCategory }">
                            {{ selectedCategory || '请选择物品分类' }}
                        </text>
                        <text class="select-arrow">›</text>
                    </view>
                </view>

                <view class="form-item">
                    <text class="item-label">成色</text>
                    <view class="condition-tabs">
                        <view
                            v-for="condition in conditionOptions"
                            :key="condition.value"
                            class="condition-tab"
                            :class="{ active: selectedCondition === condition.value }"
                            @click="selectedCondition = condition.value"
                        >
                            <text class="condition-text">{{ condition.label }}</text>
                        </view>
                    </view>
                </view>

                <view class="form-item price-input-wrapper" v-if="showPriceInput">
                    <text class="item-label required">出售价格</text>
                    <view class="price-input-box">
                        <text class="price-symbol">¥</text>
                        <input
                            class="price-input"
                            v-model.number="price"
                            type="digit"
                            placeholder="0.00"
                            maxlength="10"
                        />
                        <text class="price-unit">元</text>
                    </view>
                    <text class="price-tip" v-if="price <= 0">请输入合理的出售价格</text>
                </view>

                <view class="form-item exchange-item" v-if="showExchangeInfo">
                    <text class="item-label">期望交换</text>
                    <input
                        class="item-input"
                        v-model="exchangeWish"
                        placeholder="描述你期望交换的物品..."
                        maxlength="50"
                    />
                </view>

                <view class="form-item">
                    <text class="item-label">物品描述</text>
                    <textarea
                        class="item-textarea"
                        v-model="description"
                        placeholder="详细描述物品的使用情况、购买时间、是否有瑕疵等..."
                        maxlength="200"
                        :auto-height="true"
                    />
                    <text class="char-count">{{ description.length }}/200</text>
                </view>

                <view class="form-item">
                    <text class="item-label">物品图片</text>
                    <view class="image-upload-grid">
                        <view
                            v-for="(img, index) in images"
                            :key="index"
                            class="image-item"
                        >
                            <image class="uploaded-image" :src="img" mode="aspectFill" />
                            <view class="remove-btn" @click="removeImage(index)">
                                <text class="remove-icon">×</text>
                            </view>
                        </view>
                        <view
                            class="add-image-btn"
                            v-if="images.length < maxImages"
                            @click="chooseImage"
                        >
                            <text class="add-icon">+</text>
                            <text class="add-text">添加图片</text>
                        </view>
                    </view>
                    <text class="image-tip">最多上传{{ maxImages }}张图片，第一张为封面</text>
                </view>

                <view class="form-item">
                    <text class="item-label">联系方式</text>
                    <input
                        class="item-input"
                        v-model="contactInfo"
                        placeholder="手机号或微信号（选填）"
                        maxlength="30"
                    />
                </view>
            </view>

            <view class="agreement-section">
                <view class="agreement-check" @click="agreed = !agreed">
                    <view class="checkbox" :class="{ checked: agreed }">
                        <text class="check-icon" v-if="agreed">✓</text>
                    </view>
                    <text class="agreement-text">
                        我已阅读并同意《<text class="link-text">用户协议</text>》和《<text class="link-text">发布规范</text>》
                    </text>
                </view>
            </view>
        </view>

        <view class="bottom-bar">
            <view class="price-preview" v-if="showPriceInput && price > 0">
                <text class="preview-label">预计售价</text>
                <text class="preview-price">¥{{ price.toFixed(2) }}</text>
            </view>
            <button
                class="submit-btn"
                :class="{ disabled: !canSubmit }"
                :disabled="!canSubmit"
                @click="handleSubmit"
            >
                <text class="btn-text">立即发布</text>
            </button>
        </view>

        <view class="category-picker-modal" v-if="showCategory" @click.self="showCategory = false">
            <view class="picker-content">
                <view class="picker-header">
                    <text class="picker-cancel" @click="showCategory = false">取消</text>
                    <text class="picker-title">选择分类</text>
                    <text class="picker-confirm" @click="confirmCategory">确定</text>
                </view>
                <scroll-view class="category-list" scroll-y>
                    <view
                        v-for="cat in categories"
                        :key="cat.value"
                        class="category-item"
                        :class="{ active: tempCategory === cat.value }"
                        @click="tempCategory = cat.value"
                    >
                        <text class="cat-icon">{{ cat.icon }}</text>
                        <text class="cat-name">{{ cat.label }}</text>
                        <text class="cat-check" v-if="tempCategory === cat.value">✓</text>
                    </view>
                </scroll-view>
            </view>
        </view>
    </view>
</template>

<script>
import { beforeInitiateExchange } from '@/utils/subscribe.js'

export default {
    data() {
        return {
            selectedTradeType: 'exchange',
            tradeTabs: [
                { value: 'exchange', label: '仅交换', icon: '🔄' },
                { value: 'sell', label: '仅出售', icon: '💰' },
                { value: 'both', label: '既换也出', icon: '✨' }
            ],

            itemName: '',
            selectedCategory: '',
            tempCategory: '',
            selectedCondition: 'good',
            conditionOptions: [
                { value: 'new', label: '全新' },
                { value: 'excellent', label: '几乎全新' },
                { value: 'good', label: '九成新' },
                { value: 'fair', label: '八成新' },
                { value: 'used', label: '轻微使用' }
            ],

            categories: [
                { value: 'electronics', label: '数码电子', icon: '📱' },
                { value: 'clothing', label: '服饰鞋包', icon: '👕' },
                { value: 'home', label: '家居生活', icon: '🏠' },
                { value: 'book', label: '图书文具', icon: '📚' },
                { value: 'sports', label: '运动户外', icon: '⚽' },
                { value: 'baby', label: '母婴用品', icon: '🍼' },
                { value: 'beauty', label: '美妆护肤', icon: '💄' },
                { value: 'game', label: '游戏玩具', icon: '🎮' },
                { value: 'other', label: '其他物品', icon: '📦' }
            ],

            price: null,
            exchangeWish: '',
            description: '',
            images: [],
            maxImages: 9,
            contactInfo: '',
            agreed: false,

            showCategory: false
        }
    },

    computed: {
        showPriceInput() {
            return this.selectedTradeType === 'sell' || this.selectedTradeType === 'both'
        },

        showExchangeInfo() {
            return this.selectedTradeType === 'exchange' || this.selectedTradeType === 'both'
        },

        canSubmit() {
            if (!this.itemName.trim()) return false
            if (!this.selectedCategory) return false
            if (this.showPriceInput && (!this.price || this.price <= 0)) return false
            if (this.showExchangeInfo && !this.exchangeWish.trim()) return false
            if (!this.description.trim()) return false
            if (this.images.length === 0) return false
            if (!this.agreed) return false
            return true
        }
    },

    methods: {
        selectTradeType(type) {
            this.selectedTradeType = type
            if (type === 'exchange') {
                this.price = null
            } else if (type === 'sell') {
                this.exchangeWish = ''
            }
        },

        showCategoryPicker() {
            this.tempCategory = this.selectedCategory
            this.showCategory = true
        },

        confirmCategory() {
            if (this.tempCategory) {
                this.selectedCategory = this.tempCategory
            }
            this.showCategory = false
        },

        async chooseImage() {
            try {
                const res = await uni.chooseMedia({
                    count: this.maxImages - this.images.length,
                    mediaType: ['image'],
                    sourceType: ['album', 'camera'],
                    sizeType: ['compressed']
                })

                const tempFiles = res.tempFiles || []
                tempFiles.forEach((file) => {
                    if (this.images.length < this.maxImages) {
                        this.images.push(file.tempFilePath)
                    }
                })
            } catch (e) {
                console.error('Choose image failed:', e)
            }
        },

        removeImage(index) {
            this.images.splice(index, 1)
        },

        async handleSubmit() {
            if (!this.canSubmit) return

            try {
                if (this.selectedTradeType === 'exchange' || this.selectedTradeType === 'both') {
                    await beforeInitiateExchange({
                        targetUserName: '对方用户'
                    })
                }

                uni.showLoading({ title: '发布中...', mask: true })

                setTimeout(() => {
                    uni.hideLoading()
                    uni.showToast({
                        title: '发布成功',
                        icon: 'success',
                        duration: 2000
                    })

                    setTimeout(() => {
                        uni.navigateBack()
                    }, 2000)
                }, 1500)

            } catch (error) {
                uni.hideLoading()
                console.error('Submit failed:', error)
                uni.showToast({
                    title: '发布失败，请重试',
                    icon: 'none'
                })
            }
        }
    }
}
</script>

<style lang="scss" scoped>
.release-page {
    min-height: 100vh;
    background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
    padding-bottom: 200rpx;
}

.page-header {
    padding: 100rpx 40rpx 60rpx;
}

.page-title {
    font-size: 56rpx;
    font-weight: 700;
    color: #ffffff;
    display: block;
    margin-bottom: 12rpx;
}

.page-subtitle {
    font-size: 28rpx;
    color: rgba(255, 255, 255, 0.8);
}

.content-wrapper {
    padding: 0 30rpx;
}

.trade-type-section {
    background: rgba(255, 255, 255, 0.95);
    border-radius: 24rpx;
    padding: 40rpx;
    margin-bottom: 30rpx;
    backdrop-filter: blur(20px);
}

.section-label {
    font-size: 32rpx;
    font-weight: 600;
    color: #333;
    display: block;
    margin-bottom: 24rpx;
}

.trade-tabs {
    display: flex;
    gap: 20rpx;
}

.trade-tab {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 32rpx 16rpx;
    background: #f8f9fa;
    border-radius: 20rpx;
    border: 3rpx solid transparent;
    position: relative;
    transition: all 0.3s ease;

    &.active {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-color: #667eea;
        transform: translateY(-4rpx);
        box-shadow: 0 8rpx 24rpx rgba(102, 126, 234, 0.4);

        .tab-icon, .tab-label {
            color: #ffffff;
        }
    }
}

.tab-icon {
    font-size: 48rpx;
    margin-bottom: 12rpx;
}

.tab-label {
    font-size: 26rpx;
    font-weight: 500;
    color: #666;
}

.tab-check {
    position: absolute;
    top: 12rpx;
    right: 12rpx;
    width: 36rpx;
    height: 36rpx;
    background: #ffffff;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.check-icon {
    font-size: 22rpx;
    color: #667eea;
    font-weight: 700;
}

.basic-info-section {
    background: rgba(255, 255, 255, 0.95);
    border-radius: 24rpx;
    padding: 40rpx;
    margin-bottom: 30rpx;
    backdrop-filter: blur(20px);
}

.form-item {
    margin-bottom: 40rpx;
    position: relative;

    &:last-child {
        margin-bottom: 0;
    }
}

.item-label {
    font-size: 28rpx;
    font-weight: 500;
    color: #333;
    display: block;
    margin-bottom: 16rpx;

    &.required::before {
        content: '*';
        color: #ff4757;
        margin-right: 6rpx;
    }
}

.item-input {
    width: 100%;
    height: 88rpx;
    padding: 0 24rpx;
    background: #f8f9fa;
    border-radius: 16rpx;
    font-size: 28rpx;
    color: #333;
}

.item-textarea {
    width: 100%;
    min-height: 200rpx;
    padding: 24rpx;
    background: #f8f9fa;
    border-radius: 16rpx;
    font-size: 28rpx;
    color: #333;
    line-height: 1.6;
}

.char-count {
    position: absolute;
    right: 16rpx;
    bottom: 16rpx;
    font-size: 22rpx;
    color: #999;
}

.category-select {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 88rpx;
    padding: 0 24rpx;
    background: #f8f9fa;
    border-radius: 16rpx;
}

.category-text {
    font-size: 28rpx;
    color: #333;

    &.placeholder {
        color: #aaa;
    }
}

.select-arrow {
    font-size: 32rpx;
    color: #ccc;
}

.condition-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 16rpx;
}

.condition-tab {
    padding: 16rpx 32rpx;
    background: #f8f9fa;
    border-radius: 40rpx;
    border: 2rpx solid transparent;

    &.active {
        background: rgba(102, 126, 234, 0.1);
        border-color: #667eea;
    }
}

.condition-text {
    font-size: 26rpx;
    color: #666;
}

.condition-tab.active .condition-text {
    color: #667eea;
    font-weight: 500;
}

.price-input-wrapper {
    animation: slideDown 0.3s ease;
}

@keyframes slideDown {
    from {
        opacity: 0;
        transform: translateY(-20rpx);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.price-input-box {
    display: flex;
    align-items: center;
    height: 88rpx;
    padding: 0 24rpx;
    background: #f8f9fa;
    border-radius: 16rpx;
}

.price-symbol {
    font-size: 36rpx;
    font-weight: 700;
    color: #ff6b6b;
    margin-right: 12rpx;
}

.price-input {
    flex: 1;
    height: 88rpx;
    font-size: 36rpx;
    font-weight: 600;
    color: #333;
}

.price-unit {
    font-size: 26rpx;
    color: #999;
    margin-left: 12rpx;
}

.price-tip {
    font-size: 22rpx;
    color: #ff4757;
    margin-top: 12rpx;
    display: block;
}

.exchange-item {
    animation: slideDown 0.3s ease;
}

.image-upload-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 16rpx;
}

.image-item {
    width: 200rpx;
    height: 200rpx;
    position: relative;
    border-radius: 16rpx;
    overflow: hidden;
}

.uploaded-image {
    width: 100%;
    height: 100%;
}

.remove-btn {
    position: absolute;
    top: 8rpx;
    right: 8rpx;
    width: 40rpx;
    height: 40rpx;
    background: rgba(0, 0, 0, 0.6);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.remove-icon {
    font-size: 28rpx;
    color: #ffffff;
    line-height: 1;
}

.add-image-btn {
    width: 200rpx;
    height: 200rpx;
    background: #f8f9fa;
    border-radius: 16rpx;
    border: 2rpx dashed #ddd;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8rpx;
}

.add-icon {
    font-size: 48rpx;
    color: #ccc;
    line-height: 1;
}

.add-text {
    font-size: 22rpx;
    color: #999;
}

.image-tip {
    font-size: 22rpx;
    color: #999;
    margin-top: 16rpx;
    display: block;
}

.agreement-section {
    background: rgba(255, 255, 255, 0.95);
    border-radius: 24rpx;
    padding: 30rpx 40rpx;
    margin-bottom: 30rpx;
    backdrop-filter: blur(20px);
}

.agreement-check {
    display: flex;
    align-items: flex-start;
    gap: 16rpx;
}

.checkbox {
    width: 36rpx;
    height: 36rpx;
    border: 2rpx solid #ddd;
    border-radius: 8rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-top: 4rpx;

    &.checked {
        background: #667eea;
        border-color: #667eea;
    }

    .check-icon {
        font-size: 24rpx;
        color: #ffffff;
        font-weight: 700;
    }
}

.agreement-text {
    font-size: 24rpx;
    color: #666;
    line-height: 1.5;
    flex: 1;
}

.link-text {
    color: #667eea;
}

.bottom-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 30rpx 40rpx;
    background: #ffffff;
    box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.08);
    display: flex;
    align-items: center;
    gap: 30rpx;
}

.price-preview {
    flex: 1;
}

.preview-label {
    font-size: 24rpx;
    color: #999;
    display: block;
    margin-bottom: 4rpx;
}

.preview-price {
    font-size: 40rpx;
    font-weight: 700;
    color: #ff6b6b;
}

.submit-btn {
    flex: 2;
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

.category-picker-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: flex-end;
    z-index: 1000;
}

.picker-content {
    width: 100%;
    background: #ffffff;
    border-radius: 32rpx 32rpx 0 0;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
}

.picker-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 32rpx 40rpx;
    border-bottom: 1rpx solid #f0f0f0;
}

.picker-cancel {
    font-size: 28rpx;
    color: #999;
}

.picker-title {
    font-size: 32rpx;
    font-weight: 600;
    color: #333;
}

.picker-confirm {
    font-size: 28rpx;
    color: #667eea;
    font-weight: 500;
}

.category-list {
    flex: 1;
    max-height: 600rpx;
}

.category-item {
    display: flex;
    align-items: center;
    padding: 32rpx 40rpx;
    border-bottom: 1rpx solid #f5f5f5;

    &.active {
        background: rgba(102, 126, 234, 0.05);
    }
}

.cat-icon {
    font-size: 40rpx;
    margin-right: 24rpx;
}

.cat-name {
    flex: 1;
    font-size: 28rpx;
    color: #333;
}

.cat-check {
    font-size: 28rpx;
    color: #667eea;
    font-weight: 600;
}
</style>
