<template>
    <view class="tag-input-wrapper">
        <view class="tag-input-header" v-if="title">
            <text class="header-title">{{ title }}</text>
            <text class="header-hint">
                {{ tags.length }} / {{ maxTags }}
            </text>
        </view>

        <view class="tags-container">
            <view
                v-for="(tag, index) in tags"
                :key="index"
                class="tag-item"
                :class="tagClass"
            >
                <text class="tag-text">{{ tag }}</text>
                <view class="tag-close" @click="removeTag(index)">
                    <text class="close-icon">×</text>
                </view>
            </view>

            <view class="input-wrapper" v-if="tags.length < maxTags">
                <input
                    ref="tagInput"
                    class="tag-input"
                    v-model="inputValue"
                    :placeholder="placeholder"
                    :maxlength="maxTagLength"
                    @input="onInput"
                    @confirm="onConfirm"
                    @blur="onBlur"
                    @keyup="onKeyup"
                />
            </view>
        </view>

        <view class="input-hint" v-if="showHint">
            <text class="hint-text">输入后按回车或逗号可生成标签，点击标签可删除</text>
        </view>

        <view class="error-tip" v-if="errorMessage">
            <text class="error-text">{{ errorMessage }}</text>
        </view>

        <view class="preset-tags" v-if="presetTags && presetTags.length > 0">
            <text class="preset-title">推荐标签</text>
            <view class="preset-list">
                <view
                    v-for="tag in availablePresetTags"
                    :key="tag"
                    class="preset-item"
                    :class="{ disabled: tags.length >= maxTags }"
                    @click="addPresetTag(tag)"
                >
                    <text class="preset-text">+ {{ tag }}</text>
                </view>
            </view>
        </view>
    </view>
</template>

<script>
export default {
    name: 'TagInput',

    props: {
        value: {
            type: Array,
            default: () => []
        },
        title: {
            type: String,
            default: '标签'
        },
        placeholder: {
            type: String,
            default: '输入标签，按回车添加'
        },
        maxTags: {
            type: Number,
            default: 5
        },
        maxTagLength: {
            type: Number,
            default: 10
        },
        showHint: {
            type: Boolean,
            default: true
        },
        tagClass: {
            type: String,
            default: ''
        },
        presetTags: {
            type: Array,
            default: () => []
        },
        allowDuplicates: {
            type: Boolean,
            default: false
        }
    },

    data() {
        return {
            inputValue: '',
            errorMessage: '',
            errorTimer: null
        }
    },

    computed: {
        tags() {
            return this.value || []
        },

        availablePresetTags() {
            if (!this.presetTags || this.presetTags.length === 0) return []
            if (this.allowDuplicates) return this.presetTags
            return this.presetTags.filter(tag => !this.tags.includes(tag))
        }
    },

    watch: {
        value: {
            immediate: true,
            deep: true,
            handler(val) {
                if (!Array.isArray(val)) {
                    this.$emit('input', [])
                }
            }
        }
    },

    methods: {
        onInput(e) {
            const value = e.detail.value

            if (value.includes(',')) {
                const parts = value.split(',')
                const tagToAdd = parts[0].trim()
                if (tagToAdd) {
                    this.addTag(tagToAdd)
                }
                this.inputValue = parts.slice(1).join(',').trim()
                return
            }

            if (value.includes('，')) {
                const parts = value.split('，')
                const tagToAdd = parts[0].trim()
                if (tagToAdd) {
                    this.addTag(tagToAdd)
                }
                this.inputValue = parts.slice(1).join('，').trim()
                return
            }

            this.inputValue = value
            this.clearError()
        },

        onKeyup(e) {
            const keyCode = e.keyCode || e.which

            if (keyCode === 13) {
                this.onConfirm()
            } else if (keyCode === 8 && !this.inputValue && this.tags.length > 0) {
                this.removeTag(this.tags.length - 1)
            }
        },

        onConfirm() {
            const value = this.inputValue.trim()
            if (value) {
                this.addTag(value)
                this.inputValue = ''
            }
        },

        onBlur() {
            const value = this.inputValue.trim()
            if (value && this.autoAddOnBlur) {
                this.addTag(value)
                this.inputValue = ''
            }
        },

        addTag(tag) {
            const trimmedTag = tag.trim()

            if (!trimmedTag) {
                this.showError('标签内容不能为空')
                return false
            }

            if (trimmedTag.length > this.maxTagLength) {
                this.showError(`标签长度不能超过${this.maxTagLength}个字符`)
                return false
            }

            if (this.tags.length >= this.maxTags) {
                this.showError(`最多只能添加${this.maxTags}个标签`)
                return false
            }

            if (!this.allowDuplicates && this.tags.includes(trimmedTag)) {
                this.showError('该标签已存在')
                return false
            }

            const newTags = [...this.tags, trimmedTag]
            this.$emit('input', newTags)
            this.$emit('add', { tag: trimmedTag, tags: newTags })
            this.clearError()

            return true
        },

        removeTag(index) {
            const removedTag = this.tags[index]
            const newTags = this.tags.filter((_, i) => i !== index)
            this.$emit('input', newTags)
            this.$emit('remove', { tag: removedTag, index, tags: newTags })
            this.clearError()
        },

        addPresetTag(tag) {
            if (this.tags.length >= this.maxTags) {
                this.showError(`最多只能添加${this.maxTags}个标签`)
                return
            }
            this.addTag(tag)
        },

        showError(message) {
            if (this.errorTimer) {
                clearTimeout(this.errorTimer)
            }

            this.errorMessage = message
            uni.vibrateShort && uni.vibrateShort({ type: 'light' })

            this.errorTimer = setTimeout(() => {
                this.errorMessage = ''
            }, 2000)
        },

        clearError() {
            if (this.errorMessage) {
                this.errorMessage = ''
            }
            if (this.errorTimer) {
                clearTimeout(this.errorTimer)
                this.errorTimer = null
            }
        },

        clearAll() {
            this.$emit('input', [])
            this.$emit('clear')
            this.inputValue = ''
            this.clearError()
        },

        focus() {
            if (this.$refs.tagInput) {
                this.$refs.tagInput.focus()
            }
        },

        reset() {
            this.$emit('input', [])
            this.inputValue = ''
            this.clearError()
        }
    }
}
</script>

<style lang="scss" scoped>
.tag-input-wrapper {
    background: #ffffff;
    border-radius: 16rpx;
    padding: 24rpx;
}

.tag-input-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20rpx;
}

.header-title {
    font-size: 28rpx;
    font-weight: 600;
    color: #333;
}

.header-hint {
    font-size: 24rpx;
    color: #999;
}

.tags-container {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 16rpx;
    min-height: 80rpx;
}

.tag-item {
    display: flex;
    align-items: center;
    padding: 12rpx 20rpx;
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
    border: 1rpx solid rgba(102, 126, 234, 0.3);
    border-radius: 40rpx;
    animation: tagIn 0.2s ease;
}

@keyframes tagIn {
    from {
        opacity: 0;
        transform: scale(0.8);
    }
    to {
        opacity: 1;
        transform: scale(1);
    }
}

.tag-text {
    font-size: 24rpx;
    color: #667eea;
    font-weight: 500;
    margin-right: 8rpx;
}

.tag-close {
    width: 32rpx;
    height: 32rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(102, 126, 234, 0.2);
    border-radius: 50%;
    transition: all 0.2s;

    &:active {
        transform: scale(0.9);
        background: rgba(102, 126, 234, 0.4);
    }
}

.close-icon {
    font-size: 24rpx;
    color: #667eea;
    line-height: 1;
    font-weight: 600;
}

.input-wrapper {
    min-width: 200rpx;
    flex: 1;
}

.tag-input {
    width: 100%;
    height: 64rpx;
    padding: 0 16rpx;
    font-size: 26rpx;
    color: #333;
}

.input-hint {
    margin-top: 16rpx;
}

.hint-text {
    font-size: 22rpx;
    color: #aaa;
}

.error-tip {
    margin-top: 12rpx;
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

.preset-tags {
    margin-top: 24rpx;
    padding-top: 24rpx;
    border-top: 1rpx solid #f0f0f0;
}

.preset-title {
    font-size: 24rpx;
    color: #999;
    display: block;
    margin-bottom: 16rpx;
}

.preset-list {
    display: flex;
    flex-wrap: wrap;
    gap: 12rpx;
}

.preset-item {
    padding: 10rpx 20rpx;
    background: #f8f9fa;
    border: 1rpx solid #e9ecef;
    border-radius: 32rpx;
    transition: all 0.2s;

    &:active {
        transform: scale(0.95);
        background: #e9ecef;
    }

    &.disabled {
        opacity: 0.5;
        pointer-events: none;
    }
}

.preset-text {
    font-size: 22rpx;
    color: #667eea;
}
</style>
