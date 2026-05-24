<template>
    <view class="condition-picker">
        <view class="picker-header">
            <text class="picker-title">{{ title }}</text>
            <view class="recommend-badge" v-if="recommendedValue && showRecommend">
                <text class="badge-text">推荐</text>
            </view>
        </view>

        <view class="picker-display" @click="showPicker = true">
            <view class="display-content">
                <view class="condition-icon" :class="selectedConditionClass">
                    <text class="icon-text">{{ selectedConditionIcon }}</text>
                </view>
                <view class="condition-info">
                    <text class="condition-name">{{ selectedConditionLabel }}</text>
                    <text class="condition-desc" v-if="selectedConditionDesc">{{ selectedConditionDesc }}</text>
                </view>
            </view>
            <view class="display-arrow">
                <text class="arrow-text">›</text>
            </view>
        </view>

        <view class="recommend-tip" v-if="recommendedValue && showRecommend && value !== recommendedValue">
            <text class="tip-icon">💡</text>
            <text class="tip-text">根据描述推荐「{{ getConditionLabel(recommendedValue) }}」</text>
            <text class="tip-action" @click="applyRecommendation">使用推荐</text>
        </view>

        <view class="picker-modal" v-if="showPicker" @click.self="showPicker = false">
            <view class="picker-content">
                <view class="modal-header">
                    <text class="modal-cancel" @click="showPicker = false">取消</text>
                    <text class="modal-title">选择成色</text>
                    <text class="modal-confirm" @click="confirmSelection">确定</text>
                </view>

                <scroll-view class="condition-list" scroll-y>
                    <view
                        v-for="condition in conditions"
                        :key="condition.value"
                        class="condition-item"
                        :class="{
                            selected: tempValue === condition.value,
                            recommended: recommendedValue === condition.value && showRecommend
                        }"
                        @click="selectCondition(condition.value)"
                    >
                        <view class="item-left">
                            <view class="condition-icon" :class="condition.class">
                                <text class="icon-text">{{ condition.icon }}</text>
                            </view>
                            <view class="condition-detail">
                                <view class="name-row">
                                    <text class="condition-name">{{ condition.label }}</text>
                                    <view class="recommend-tag" v-if="recommendedValue === condition.value && showRecommend">
                                        <text class="tag-text">推荐</text>
                                    </view>
                                </view>
                                <text class="condition-desc">{{ condition.desc }}</text>
                            </view>
                        </view>

                        <view class="item-right">
                            <view class="radio-circle" :class="{ checked: tempValue === condition.value }">
                                <text class="radio-check" v-if="tempValue === condition.value">✓</text>
                            </view>
                        </view>
                    </view>
                </scroll-view>
            </view>
        </view>
    </view>
</template>

<script>
export default {
    name: 'ConditionPicker',

    props: {
        value: {
            type: String,
            default: ''
        },
        title: {
            type: String,
            default: '成色'
        },
        description: {
            type: String,
            default: ''
        },
        showRecommend: {
            type: Boolean,
            default: true
        },
        useApiRecommend: {
            type: Boolean,
            default: false
        },
        apiEndpoint: {
            type: String,
            default: '/api/goods/recommend-condition'
        },
        conditions: {
            type: Array,
            default: () => [
                {
                    value: 'new',
                    label: '全新',
                    icon: '✨',
                    class: 'new',
                    desc: '未拆封或拆封未使用，配件齐全',
                    keywords: ['全新', '未拆封', '未使用', '新品', '刚买', '全新未拆']
                },
                {
                    value: '99',
                    label: '99新',
                    icon: '🌟',
                    class: 'excellent',
                    desc: '几乎全新，使用痕迹极轻微，功能完好',
                    keywords: ['99新', '几乎全新', '几乎没', '基本全新', '用过一次', '仅拆封']
                },
                {
                    value: '95',
                    label: '95新',
                    icon: '⭐',
                    class: 'great',
                    desc: '有轻微使用痕迹，外观少量划痕，功能完好',
                    keywords: ['95新', '很新', '轻微', '很少用', '不明显', '几乎没']
                },
                {
                    value: '90',
                    label: '9成新',
                    icon: '👍',
                    class: 'good',
                    desc: '正常使用痕迹，有可见划痕，功能完好',
                    keywords: ['9成新', '九成新', '正常使用', '不错', '良好']
                },
                {
                    value: '80',
                    label: '8成新',
                    icon: '👌',
                    class: 'fair',
                    desc: '明显使用痕迹，有多处划痕，功能完好',
                    keywords: ['8成新', '八成新', '有划痕', '使用较多', '明显使用']
                },
                {
                    value: '70',
                    label: '7成新及以下',
                    icon: '💫',
                    class: 'used',
                    desc: '使用痕迹较重，外观磨损较多，功能正常',
                    keywords: ['7成新', '七成新', '旧', '磨损', '破旧', '使用很久', '多年']
                }
            ]
        }
    },

    data() {
        return {
            showPicker: false,
            tempValue: '',
            recommendedValue: '',
            recommendLoading: false
        }
    },

    computed: {
        selectedCondition() {
            return this.conditions.find(c => c.value === this.value) || this.conditions[3]
        },

        selectedConditionLabel() {
            return this.selectedCondition?.label || '请选择'
        },

        selectedConditionDesc() {
            return this.selectedCondition?.desc || ''
        },

        selectedConditionIcon() {
            return this.selectedCondition?.icon || '📦'
        },

        selectedConditionClass() {
            return this.selectedCondition?.class || ''
        }
    },

    watch: {
        value: {
            immediate: true,
            handler(val) {
                this.tempValue = val || ''
            }
        },

        description: {
            immediate: true,
            handler(desc) {
                if (this.showRecommend && desc) {
                    this.recommendCondition(desc)
                } else {
                    this.recommendedValue = ''
                }
            }
        }
    },

    methods: {
        async recommendCondition(description) {
            if (!description || description.length < 2) {
                this.recommendedValue = ''
                return
            }

            if (this.useApiRecommend) {
                this.recommendLoading = true
                try {
                    const http = (await import('@/common/interceptor.js')).default
                    const res = await http.post(this.apiEndpoint, {
                        description: description
                    })

                    if (res && res.code === 0 && res.data?.condition) {
                        const recommended = this.conditions.find(c => c.value === res.data.condition)
                        if (recommended) {
                            this.recommendedValue = recommended.value
                        }
                    }
                } catch (e) {
                    console.warn('API recommend failed, use local matching:', e)
                    this.localRecommend(description)
                } finally {
                    this.recommendLoading = false
                }
            } else {
                this.localRecommend(description)
            }
        },

        localRecommend(description) {
            const lowerDesc = description.toLowerCase()

            let bestMatch = null
            let maxMatches = 0

            for (const condition of this.conditions) {
                let matchCount = 0
                condition.keywords.forEach(keyword => {
                    if (lowerDesc.includes(keyword.toLowerCase())) {
                        matchCount++
                    }
                })

                if (matchCount > maxMatches) {
                    maxMatches = matchCount
                    bestMatch = condition
                }
            }

            if (maxMatches > 0) {
                this.recommendedValue = bestMatch.value
                this.$emit('recommend', {
                    value: bestMatch.value,
                    label: bestMatch.label,
                    matchCount: maxMatches,
                    source: 'local'
                })
            } else {
                this.recommendedValue = ''
            }
        },

        getConditionLabel(value) {
            const condition = this.conditions.find(c => c.value === value)
            return condition?.label || ''
        },

        selectCondition(value) {
            this.tempValue = value
        },

        applyRecommendation() {
            if (this.recommendedValue) {
                this.$emit('input', this.recommendedValue)
                this.$emit('update:modelValue', this.recommendedValue)
                this.$emit('change', {
                    value: this.recommendedValue,
                    label: this.getConditionLabel(this.recommendedValue),
                    fromRecommend: true
                })
                uni.showToast({
                    title: '已使用推荐成色',
                    icon: 'success',
                    duration: 1500
                })
            }
        },

        confirmSelection() {
            this.$emit('input', this.tempValue)
            this.$emit('update:modelValue', this.tempValue)
            this.$emit('change', {
                value: this.tempValue,
                label: this.getConditionLabel(this.tempValue),
                fromRecommend: this.tempValue === this.recommendedValue
            })
            this.showPicker = false
        },

        reset() {
            this.tempValue = ''
            this.recommendedValue = ''
            this.$emit('input', '')
            this.$emit('update:modelValue', '')
        }
    }
}
</script>

<style lang="scss" scoped>
.condition-picker {
    background: #ffffff;
    border-radius: 16rpx;
    padding: 24rpx;
}

.picker-header {
    display: flex;
    align-items: center;
    gap: 12rpx;
    margin-bottom: 20rpx;
}

.picker-title {
    font-size: 28rpx;
    font-weight: 600;
    color: #333;
}

.recommend-badge {
    padding: 4rpx 12rpx;
    background: linear-gradient(135deg, #ff6b6b 0%, #ffa502 100%);
    border-radius: 16rpx;
}

.badge-text {
    font-size: 20rpx;
    color: #ffffff;
    font-weight: 500;
}

.picker-display {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20rpx 24rpx;
    background: #f8f9fa;
    border-radius: 16rpx;
    transition: all 0.2s;

    &:active {
        background: #e9ecef;
    }
}

.display-content {
    display: flex;
    align-items: center;
    gap: 20rpx;
    flex: 1;
}

.condition-icon {
    width: 64rpx;
    height: 64rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 16rpx;

    &.new {
        background: linear-gradient(135deg, #ffd700 0%, #ff8c00 100%);
    }
    &.excellent {
        background: linear-gradient(135deg, #7bed9f 0%, #2ed573 100%);
    }
    &.great {
        background: linear-gradient(135deg, #70a1ff 0%, #1e90ff 100%);
    }
    &.good {
        background: linear-gradient(135deg, #5352ed 0%, #3742fa 100%);
    }
    &.fair {
        background: linear-gradient(135deg, #ffa502 0%, #ff6348 100%);
    }
    &.used {
        background: linear-gradient(135deg, #a4b0be 0%, #747d8c 100%);
    }
}

.icon-text {
    font-size: 32rpx;
}

.condition-info {
    flex: 1;
}

.condition-name {
    font-size: 30rpx;
    font-weight: 600;
    color: #333;
    display: block;
    margin-bottom: 4rpx;
}

.condition-desc {
    font-size: 22rpx;
    color: #999;
}

.display-arrow {
    margin-left: 16rpx;
}

.arrow-text {
    font-size: 32rpx;
    color: #ccc;
}

.recommend-tip {
    display: flex;
    align-items: center;
    gap: 12rpx;
    margin-top: 16rpx;
    padding: 16rpx 20rpx;
    background: #fffbe6;
    border-radius: 12rpx;
}

.tip-icon {
    font-size: 28rpx;
    flex-shrink: 0;
}

.tip-text {
    flex: 1;
    font-size: 24rpx;
    color: #d48806;
}

.tip-action {
    font-size: 24rpx;
    color: #667eea;
    font-weight: 500;
    flex-shrink: 0;
}

.picker-modal {
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
    max-height: 80vh;
    background: #ffffff;
    border-radius: 32rpx 32rpx 0 0;
    display: flex;
    flex-direction: column;
}

.modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 32rpx;
    border-bottom: 1rpx solid #f0f0f0;
}

.modal-cancel, .modal-confirm {
    font-size: 28rpx;
    min-width: 80rpx;
}

.modal-cancel {
    color: #999;
}

.modal-confirm {
    color: #667eea;
    font-weight: 500;
}

.modal-title {
    font-size: 32rpx;
    font-weight: 600;
    color: #333;
}

.condition-list {
    flex: 1;
    max-height: 600rpx;
}

.condition-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 24rpx 32rpx;
    border-bottom: 1rpx solid #f8f9fa;
    transition: all 0.2s;

    &:last-child {
        border-bottom: none;
    }

    &.selected {
        background: rgba(102, 126, 234, 0.05);
    }

    &.recommended {
        background: rgba(255, 165, 2, 0.05);
    }

    &:active {
        background: #f8f9fa;
    }
}

.item-left {
    display: flex;
    align-items: center;
    gap: 20rpx;
    flex: 1;
}

.condition-detail {
    flex: 1;
}

.name-row {
    display: flex;
    align-items: center;
    gap: 12rpx;
    margin-bottom: 4rpx;
}

.recommend-tag {
    padding: 2rpx 10rpx;
    background: linear-gradient(135deg, #ff6b6b 0%, #ffa502 100%);
    border-radius: 12rpx;
}

.tag-text {
    font-size: 18rpx;
    color: #ffffff;
    font-weight: 500;
}

.radio-circle {
    width: 40rpx;
    height: 40rpx;
    border: 3rpx solid #ddd;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;

    &.checked {
        border-color: #667eea;
        background: #667eea;
    }
}

.radio-check {
    font-size: 22rpx;
    color: #ffffff;
    font-weight: 700;
}
</style>
