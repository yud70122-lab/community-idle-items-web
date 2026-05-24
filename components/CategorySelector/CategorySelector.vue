<template>
    <view class="category-selector">
        <view class="selector-header">
            <text class="selector-title">{{ title }}</text>
            <text class="selector-hint">
                已选 <text class="count-text" :class="{ warning: selectedCount >= maxSelect }">{{ selectedCount }}</text> / {{ maxSelect }}
            </text>
        </view>

        <view class="warning-tip" v-if="showWarning">
            <text class="warning-text">最多只能选择{{ maxSelect }}个品类</text>
        </view>

        <checkbox-group class="category-list" @change="onCheckboxChange">
            <view
                v-for="category in categories"
                :key="category.value"
                class="category-item"
                :class="{
                    disabled: !isSelected(category.value) && selectedCount >= maxSelect,
                    selected: isSelected(category.value)
                }"
                @click="handleItemClick(category)"
            >
                <view class="category-checkbox">
                    <checkbox
                        :value="category.value"
                        :checked="isSelected(category.value)"
                        :disabled="!isSelected(category.value) && selectedCount >= maxSelect"
                        :color="'#667eea'"
                    />
                </view>

                <view class="category-content">
                    <view class="category-icon">
                        <text class="icon-text">{{ category.icon }}</text>
                    </view>
                    <view class="category-info">
                        <text class="category-name">{{ category.label }}</text>
                        <text class="category-desc" v-if="category.desc">{{ category.desc }}</text>
                    </view>
                </view>

                <view class="category-check" v-if="isSelected(category.value)">
                    <text class="check-icon">✓</text>
                </view>
            </view>
        </checkbox-group>

        <view class="selector-footer" v-if="showFooter">
            <button class="clear-btn" @click="clearAll" v-if="selectedCount > 0">
                <text class="btn-text">清空选择</text>
            </button>
            <button class="confirm-btn" @click="confirmSelection">
                <text class="btn-text">确定</text>
            </button>
        </view>
    </view>
</template>

<script>
export default {
    name: 'CategorySelector',

    props: {
        value: {
            type: Array,
            default: () => []
        },
        title: {
            type: String,
            default: '选择品类'
        },
        maxSelect: {
            type: Number,
            default: 5
        },
        showFooter: {
            type: Boolean,
            default: false
        },
        categories: {
            type: Array,
            default: () => [
                { value: 'appliance', label: '家用电器', icon: '📺', desc: '电视、冰箱、洗衣机等' },
                { value: 'clothing', label: '服饰鞋包', icon: '👕', desc: '衣服、鞋子、包包等' },
                { value: 'electronics', label: '数码电子', icon: '📱', desc: '手机、电脑、相机等' },
                { value: 'furniture', label: '家居家具', icon: '🛋️', desc: '沙发、桌子、椅子等' },
                { value: 'book', label: '图书文具', icon: '📚', desc: '书籍、文具、办公用品' },
                { value: 'sports', label: '运动户外', icon: '⚽', desc: '运动器材、户外装备' },
                { value: 'baby', label: '母婴用品', icon: '🍼', desc: '婴儿车、玩具、童装' },
                { value: 'beauty', label: '美妆护肤', icon: '💄', desc: '化妆品、护肤品、香水' },
                { value: 'food', label: '食品饮料', icon: '🍎', desc: '零食、饮料、特产' },
                { value: 'game', label: '游戏玩具', icon: '🎮', desc: '游戏机、玩具、手办' },
                { value: 'music', label: '音乐乐器', icon: '🎸', desc: '乐器、音响、唱片' },
                { value: 'art', label: '艺术品', icon: '🎨', desc: '绘画、雕塑、工艺品' },
                { value: 'pet', label: '宠物用品', icon: '🐱', desc: '宠物食品、玩具、用具' },
                { value: 'car', label: '汽车用品', icon: '🚗', desc: '汽车配件、装饰、保养' },
                { value: 'other', label: '其他物品', icon: '📦', desc: '以上未分类的物品' }
            ]
        }
    },

    data() {
        return {
            selectedValues: [],
            showWarning: false,
            warningTimer: null
        }
    },

    computed: {
        selectedCount() {
            return this.selectedValues.length
        }
    },

    watch: {
        value: {
            immediate: true,
            deep: true,
            handler(val) {
                if (Array.isArray(val)) {
                    this.selectedValues = [...val].slice(0, this.maxSelect)
                }
            }
        }
    },

    methods: {
        isSelected(value) {
            return this.selectedValues.includes(value)
        },

        handleItemClick(category) {
            const value = category.value
            const isSelected = this.isSelected(value)

            if (!isSelected && this.selectedCount >= this.maxSelect) {
                this.showLimitWarning()
                return
            }

            if (isSelected) {
                this.selectedValues = this.selectedValues.filter(v => v !== value)
            } else {
                this.selectedValues.push(value)
            }

            this.$emit('input', [...this.selectedValues])
            this.$emit('change', {
                selected: [...this.selectedValues],
                category: category,
                action: isSelected ? 'remove' : 'add'
            })
        },

        onCheckboxChange(e) {
            const values = e.detail.value || []

            if (values.length > this.maxSelect) {
                this.showLimitWarning()
                const limitedValues = values.slice(0, this.maxSelect)
                this.selectedValues = limitedValues
                this.$emit('input', [...limitedValues])
                return
            }

            this.selectedValues = values
            this.$emit('input', [...values])
            this.$emit('change', {
                selected: [...values],
                action: 'change'
            })
        },

        showLimitWarning() {
            if (this.warningTimer) {
                clearTimeout(this.warningTimer)
            }

            this.showWarning = true
            uni.vibrateShort && uni.vibrateShort({ type: 'light' })

            this.warningTimer = setTimeout(() => {
                this.showWarning = false
            }, 2000)
        },

        clearAll() {
            this.selectedValues = []
            this.$emit('input', [])
            this.$emit('clear')
        },

        confirmSelection() {
            const selectedCategories = this.categories.filter(cat =>
                this.selectedValues.includes(cat.value)
            )

            this.$emit('confirm', {
                values: [...this.selectedValues],
                categories: selectedCategories
            })
        },

        getSelectedCategories() {
            return this.categories.filter(cat =>
                this.selectedValues.includes(cat.value)
            )
        },

        reset() {
            this.selectedValues = []
            this.showWarning = false
            if (this.warningTimer) {
                clearTimeout(this.warningTimer)
            }
        }
    }
}
</script>

<style lang="scss" scoped>
.category-selector {
    background: #ffffff;
    border-radius: 16rpx;
    overflow: hidden;
}

.selector-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 32rpx 32rpx 24rpx;
    border-bottom: 1rpx solid #f0f0f0;
}

.selector-title {
    font-size: 32rpx;
    font-weight: 600;
    color: #333;
}

.selector-hint {
    font-size: 26rpx;
    color: #999;
}

.count-text {
    font-weight: 600;
    color: #667eea;

    &.warning {
        color: #ff6b6b;
    }
}

.warning-tip {
    padding: 16rpx 32rpx;
    background: #fff5f5;
    animation: shake 0.3s ease;
}

@keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-10rpx); }
    75% { transform: translateX(10rpx); }
}

.warning-text {
    font-size: 24rpx;
    color: #ff4757;
}

.category-list {
    padding: 16rpx 0;
}

.category-item {
    display: flex;
    align-items: center;
    padding: 24rpx 32rpx;
    transition: all 0.2s ease;
    border-bottom: 1rpx solid #f8f9fa;

    &:last-child {
        border-bottom: none;
    }

    &:active {
        background: #f8f9fa;
    }

    &.disabled {
        opacity: 0.5;
        pointer-events: none;
    }

    &.selected {
        background: rgba(102, 126, 234, 0.05);
    }
}

.category-checkbox {
    margin-right: 24rpx;

    checkbox {
        transform: scale(1.2);
    }
}

.category-content {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 20rpx;
}

.category-icon {
    width: 72rpx;
    height: 72rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 16rpx;
}

.icon-text {
    font-size: 36rpx;
}

.category-info {
    flex: 1;
}

.category-name {
    font-size: 28rpx;
    font-weight: 500;
    color: #333;
    display: block;
    margin-bottom: 4rpx;
}

.category-desc {
    font-size: 22rpx;
    color: #999;
}

.category-check {
    width: 40rpx;
    height: 40rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #667eea;
    border-radius: 50%;
    margin-left: 16rpx;
}

.check-icon {
    font-size: 24rpx;
    color: #ffffff;
    font-weight: 700;
}

.selector-footer {
    display: flex;
    gap: 20rpx;
    padding: 24rpx 32rpx;
    border-top: 1rpx solid #f0f0f0;
    background: #fafafa;
}

.clear-btn, .confirm-btn {
    flex: 1;
    height: 80rpx;
    border-radius: 40rpx;
    font-size: 28rpx;
    font-weight: 500;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
}

.clear-btn {
    background: #f0f0f0;

    .btn-text {
        color: #666;
    }
}

.confirm-btn {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

    .btn-text {
        color: #ffffff;
    }
}
</style>
