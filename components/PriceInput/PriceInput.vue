<template>
    <view class="price-input-wrapper">
        <view class="input-header">
            <text class="input-title">{{ title }}</text>
            <view class="negotiable-switch" v-if="showNegotiable">
                <text class="switch-label">可议价</text>
                <switch
                    :checked="negotiable"
                    :color="'#667eea'"
                    @change="onNegotiableChange"
                />
            </view>
        </view>

        <view class="price-input-container">
            <view class="currency-symbol">
                <text class="symbol-text">¥</text>
            </view>

            <input
                ref="priceInput"
                class="price-input"
                type="digit"
                v-model="inputValue"
                :placeholder="placeholder"
                :maxlength="maxLength"
                :disabled="disabled"
                @input="onInput"
                @blur="onBlur"
                @focus="onFocus"
            />

            <view class="price-suffix" v-if="suffix">
                <text class="suffix-text">{{ suffix }}</text>
            </view>
        </view>

        <view class="input-footer">
            <view class="quick-prices" v-if="quickPrices && quickPrices.length > 0">
                <view
                    v-for="price in quickPrices"
                    :key="price"
                    class="quick-price-item"
                    :class="{ active: Number(inputValue) === price }"
                    @click="selectQuickPrice(price)"
                >
                    <text class="quick-price-text">¥{{ price }}</text>
                </view>
            </view>

            <view class="price-range" v-if="showRange">
                <text class="range-text">建议价格：¥{{ minPrice }} - ¥{{ maxPrice }}</text>
            </view>
        </view>

        <view class="error-tip" v-if="errorMessage">
            <text class="error-text">{{ errorMessage }}</text>
        </view>
    </view>
</template>

<script>
export default {
    name: 'PriceInput',

    props: {
        value: {
            type: [Number, String],
            default: ''
        },
        title: {
            type: String,
            default: '价格'
        },
        placeholder: {
            type: String,
            default: '请输入价格'
        },
        min: {
            type: Number,
            default: 0.01
        },
        max: {
            type: Number,
            default: 99999
        },
        decimalPlaces: {
            type: Number,
            default: 2
        },
        disabled: {
            type: Boolean,
            default: false
        },
        showNegotiable: {
            type: Boolean,
            default: true
        },
        negotiable: {
            type: Boolean,
            default: false
        },
        suffix: {
            type: String,
            default: ''
        },
        quickPrices: {
            type: Array,
            default: () => [9.9, 19.9, 29.9, 49.9, 99]
        },
        showRange: {
            type: Boolean,
            default: false
        },
        minPrice: {
            type: Number,
            default: 1
        },
        maxPrice: {
            type: Number,
            default: 9999
        },
        validateOnBlur: {
            type: Boolean,
            default: true
        }
    },

    data() {
        return {
            inputValue: '',
            errorMessage: '',
            isFocused: false,
            maxLength: 8
        }
    },

    computed: {
        numericValue() {
            const num = parseFloat(this.inputValue)
            return isNaN(num) ? null : num
        }
    },

    watch: {
        value: {
            immediate: true,
            handler(val) {
                if (val !== null && val !== undefined && val !== '') {
                    const num = Number(val)
                    if (!isNaN(num)) {
                        this.inputValue = this.formatValue(num)
                    } else {
                        this.inputValue = String(val)
                    }
                } else {
                    this.inputValue = ''
                }
            }
        }
    },

    methods: {
        onInput(e) {
            let value = e.detail.value

            // 正则校验：只能输入数字和小数点
            const regex = /^\d*\.?\d{0,2}$/
            if (!regex.test(value)) {
                value = value.replace(/[^\d.]/g, '')
                const parts = value.split('.')
                if (parts.length > 2) {
                    value = parts[0] + '.' + parts.slice(1).join('')
                }
                if (parts[1] && parts[1].length > this.decimalPlaces) {
                    value = parts[0] + '.' + parts[1].slice(0, this.decimalPlaces)
                }
            }

            // 限制最大值
            if (value) {
                const num = parseFloat(value)
                if (!isNaN(num) && num > this.max) {
                    this.showError(`价格不能超过¥${this.max}`)
                    value = String(this.max)
                }
            }

            this.inputValue = value
            this.clearError()

            // 去除开头的0
            if (value.length > 1 && value.startsWith('0') && !value.startsWith('0.')) {
                this.inputValue = value.replace(/^0+/, '')
            }

            // 限制整数部分长度
            const intPart = this.inputValue.split('.')[0]
            if (intPart && intPart.length > 5) {
                this.inputValue = this.inputValue.slice(0, 5) + (this.inputValue.includes('.') ? '.' + this.inputValue.split('.')[1] : '')
            }

            this.$emit('input', this.numericValue)
            this.$emit('update:modelValue', this.numericValue)
        },

        onBlur() {
            this.isFocused = false

            if (this.validateOnBlur && this.inputValue) {
                this.validate()
            }

            // 格式化为正确的小数位数
            if (this.inputValue) {
                const num = parseFloat(this.inputValue)
                if (!isNaN(num)) {
                    this.inputValue = this.formatValue(num)
                    this.$emit('blur', { value: this.numericValue, formatted: this.inputValue })
                }
            }
        },

        onFocus() {
            this.isFocused = true
            this.$emit('focus')
        },

        onNegotiableChange(e) {
            const value = e.detail.value
            this.$emit('update:negotiable', value)
            this.$emit('negotiableChange', value)
        },

        validate() {
            const value = this.numericValue

            if (value === null || value === '') {
                if (this.required) {
                    this.showError('请输入价格')
                    return false
                }
                return true
            }

            if (isNaN(value)) {
                this.showError('请输入有效的价格')
                return false
            }

            if (value < this.min) {
                this.showError(`价格不能低于¥${this.min}`)
                return false
            }

            if (value > this.max) {
                this.showError(`价格不能超过¥${this.max}`)
                return false
            }

            this.clearError()
            return true
        },

        selectQuickPrice(price) {
            if (this.disabled) return

            this.inputValue = this.formatValue(price)
            this.clearError()
            this.$emit('input', price)
            this.$emit('update:modelValue', price)
            this.$emit('quickSelect', price)
        },

        formatValue(num) {
            if (num === null || num === undefined || isNaN(num)) return ''

            // 如果是整数，不显示小数
            if (Number.isInteger(num)) {
                return String(num)
            }

            // 否则保留指定小数位数
            return Number(num).toFixed(this.decimalPlaces)
        },

        showError(message) {
            this.errorMessage = message
            uni.vibrateShort && uni.vibrateShort({ type: 'light' })
        },

        clearError() {
            if (this.errorMessage) {
                this.errorMessage = ''
            }
        },

        getValue() {
            return this.numericValue
        },

        getFormattedValue() {
            return this.inputValue
        },

        reset() {
            this.inputValue = ''
            this.errorMessage = ''
            this.$emit('input', null)
            this.$emit('update:modelValue', null)
        },

        focus() {
            if (this.$refs.priceInput) {
                this.$refs.priceInput.focus()
            }
        }
    }
}
</script>

<style lang="scss" scoped>
.price-input-wrapper {
    background: #ffffff;
    border-radius: 16rpx;
    padding: 24rpx;
}

.input-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20rpx;
}

.input-title {
    font-size: 28rpx;
    font-weight: 600;
    color: #333;
}

.negotiable-switch {
    display: flex;
    align-items: center;
    gap: 12rpx;
}

.switch-label {
    font-size: 26rpx;
    color: #666;
}

.price-input-container {
    display: flex;
    align-items: center;
    background: #f8f9fa;
    border-radius: 16rpx;
    padding: 0 24rpx;
    border: 2rpx solid transparent;
    transition: all 0.2s;

    &.focused {
        border-color: #667eea;
        background: #ffffff;
    }
}

.currency-symbol {
    margin-right: 12rpx;
}

.symbol-text {
    font-size: 36rpx;
    font-weight: 700;
    color: #ff6b6b;
}

.price-input {
    flex: 1;
    height: 96rpx;
    font-size: 36rpx;
    font-weight: 600;
    color: #333;
}

.price-suffix {
    margin-left: 12rpx;
}

.suffix-text {
    font-size: 26rpx;
    color: #999;
}

.input-footer {
    margin-top: 20rpx;
}

.quick-prices {
    display: flex;
    flex-wrap: wrap;
    gap: 16rpx;
}

.quick-price-item {
    padding: 12rpx 24rpx;
    background: #f8f9fa;
    border: 2rpx solid transparent;
    border-radius: 32rpx;
    transition: all 0.2s;

    &.active {
        background: rgba(102, 126, 234, 0.1);
        border-color: #667eea;
    }

    &:active {
        transform: scale(0.95);
    }
}

.quick-price-text {
    font-size: 24rpx;
    color: #667eea;
    font-weight: 500;
}

.quick-price-item.active .quick-price-text {
    font-weight: 600;
}

.price-range {
    margin-top: 16rpx;
}

.range-text {
    font-size: 22rpx;
    color: #999;
}

.error-tip {
    margin-top: 16rpx;
    padding: 12rpx 16rpx;
    background: #fff5f5;
    border-radius: 8rpx;
    animation: shake 0.3s ease;
}

@keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-8rpx); }
    75% { transform: translateX(8rpx); }
}

.error-text {
    font-size: 22rpx;
    color: #ff4757;
}
</style>
