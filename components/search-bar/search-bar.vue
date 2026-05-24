<template>
    <view class="search-bar-wrapper">
        <view class="search-bar" :class="{ focused: isFocused }">
            <view class="search-icon">
                <text class="icon-text">🔍</text>
            </view>
            <input
                ref="searchInput"
                class="search-input"
                type="text"
                v-model="inputValue"
                :placeholder="placeholder"
                :placeholder-class="'input-placeholder'"
                :confirm-type="'search'"
                :focus="autoFocus"
                @input="onInput"
                @focus="onFocus"
                @blur="onBlur"
                @confirm="onConfirm"
            />
            <view class="search-clear" v-if="inputValue" @click="clearInput">
                <text class="clear-icon">×</text>
            </view>
            <view class="search-btn" v-if="showCancelButton" @click="onCancel">
                <text class="btn-text">取消</text>
            </view>
        </view>

        <view class="suggest-dropdown" v-if="showSuggest && suggestions.length > 0">
            <view class="suggest-list">
                <view
                    v-for="(item, index) in suggestions"
                    :key="item.id || index"
                    class="suggest-item"
                    @click="selectSuggest(item)"
                >
                    <text class="suggest-icon">🔍</text>
                    <text class="suggest-text">
                        <text
                            v-for="(part, partIndex) in highlightText(item.keyword || item.name || item)"
                            :key="partIndex"
                            :class="{ highlight: part.highlight }"
                        >{{ part.text }}</text>
                    </text>
                    <text class="suggest-arrow">›</text>
                </view>
            </view>
        </view>

        <view class="hot-search" v-if="showHotSearch && hotWords.length > 0 && !inputValue">
            <view class="hot-header">
                <text class="hot-icon">🔥</text>
                <text class="hot-title">热门搜索</text>
            </view>
            <view class="hot-tags">
                <view
                    v-for="(word, index) in hotWords"
                    :key="index"
                    class="hot-tag"
                    @click="selectHotWord(word)"
                >
                    <text class="tag-text">{{ word }}</text>
                </view>
            </view>
        </view>
    </view>
</template>

<script>
import http from '@/common/interceptor.js'

export default {
    name: 'SearchBar',
    props: {
        placeholder: {
            type: String,
            default: '搜索闲置物品...'
        },
        value: {
            type: String,
            default: ''
        },
        autoFocus: {
            type: Boolean,
            default: false
        },
        showCancelButton: {
            type: Boolean,
            default: true
        },
        showHotSearch: {
            type: Boolean,
            default: true
        },
        debounceTime: {
            type: Number,
            default: 300
        },
        suggestUrl: {
            type: String,
            default: '/api/search/suggest'
        }
    },
    data() {
        return {
            inputValue: '',
            isFocused: false,
            showSuggest: false,
            suggestions: [],
            hotWords: ['iPhone', 'MacBook', 'iPad', 'AirPods', 'Switch', '相机', '显示器', '键盘', '椅子', '书架'],
            debounceTimer: null,
            isLoading: false,
            lastQuery: ''
        }
    },
    watch: {
        value: {
            immediate: true,
            handler(val) {
                if (val !== undefined && val !== this.inputValue) {
                    this.inputValue = val
                }
            }
        }
    },
    methods: {
        onInput(e) {
            const value = e.detail.value
            this.inputValue = value
            this.$emit('input', value)

            if (value.trim()) {
                this.debounceSearch(value.trim())
            } else {
                this.clearSuggestions()
            }
        },

        debounceSearch(keyword) {
            if (this.debounceTimer) {
                clearTimeout(this.debounceTimer)
            }

            this.debounceTimer = setTimeout(() => {
                this.fetchSuggestions(keyword)
            }, this.debounceTime)
        },

        async fetchSuggestions(keyword) {
            if (!keyword || keyword === this.lastQuery) return

            this.lastQuery = keyword
            this.isLoading = true

            try {
                const res = await http.get(this.suggestUrl, {
                    keyword: keyword,
                    limit: 10
                })

                let suggestions = []
                if (res && Array.isArray(res)) {
                    suggestions = res
                } else if (res && res.list && Array.isArray(res.list)) {
                    suggestions = res.list
                } else if (res && res.data && Array.isArray(res.data)) {
                    suggestions = res.data
                }

                this.suggestions = suggestions.map(item => {
                    if (typeof item === 'string') {
                        return { keyword: item }
                    }
                    return item
                })

                this.showSuggest = true
            } catch (error) {
                console.error('Fetch suggestions failed:', error)
                this.suggestions = this.getMockSuggestions(keyword)
                this.showSuggest = true
            } finally {
                this.isLoading = false
            }
        },

        getMockSuggestions(keyword) {
            const mockData = [
                `${keyword} 二手`,
                `${keyword} 全新`,
                `${keyword} 低价`,
                `${keyword} 包邮`,
                `${keyword} 附近`
            ]
            return mockData.slice(0, 5).map(text => ({ keyword: text }))
        },

        highlightText(text) {
            if (!this.inputValue || !text) {
                return [{ text: text || '', highlight: false }]
            }

            const keyword = this.inputValue.toLowerCase()
            const lowerText = text.toLowerCase()
            const parts = []
            let lastIndex = 0
            let index = lowerText.indexOf(keyword)

            while (index !== -1) {
                if (index > lastIndex) {
                    parts.push({
                        text: text.substring(lastIndex, index),
                        highlight: false
                    })
                }
                parts.push({
                    text: text.substring(index, index + keyword.length),
                    highlight: true
                })
                lastIndex = index + keyword.length
                index = lowerText.indexOf(keyword, lastIndex)
            }

            if (lastIndex < text.length) {
                parts.push({
                    text: text.substring(lastIndex),
                    highlight: false
                })
            }

            return parts.length > 0 ? parts : [{ text: text, highlight: false }]
        },

        selectSuggest(item) {
            const keyword = item.keyword || item.name || item
            this.inputValue = keyword
            this.$emit('input', keyword)
            this.$emit('select', item)
            this.clearSuggestions()
            this.doSearch(keyword)
        },

        selectHotWord(word) {
            this.inputValue = word
            this.$emit('input', word)
            this.$emit('hotSelect', word)
            this.doSearch(word)
        },

        onFocus() {
            this.isFocused = true
            this.showSuggest = true
            this.$emit('focus')
        },

        onBlur() {
            this.isFocused = false
            setTimeout(() => {
                this.showSuggest = false
            }, 200)
            this.$emit('blur')
        },

        onConfirm(e) {
            const keyword = e.detail.value || this.inputValue
            this.$emit('confirm', keyword)
            this.clearSuggestions()
            this.doSearch(keyword)
        },

        onCancel() {
            this.inputValue = ''
            this.$emit('input', '')
            this.$emit('cancel')
            this.clearSuggestions()
            uni.navigateBack()
        },

        clearInput() {
            this.inputValue = ''
            this.$emit('input', '')
            this.$emit('clear')
            this.clearSuggestions()
            this.$nextTick(() => {
                this.$refs.searchInput && this.$refs.searchInput.focus()
            })
        },

        clearSuggestions() {
            this.suggestions = []
            this.showSuggest = false
            this.lastQuery = ''
            if (this.debounceTimer) {
                clearTimeout(this.debounceTimer)
                this.debounceTimer = null
            }
        },

        doSearch(keyword) {
            this.$emit('search', keyword)
        },

        setFocus() {
            this.$nextTick(() => {
                this.$refs.searchInput && this.$refs.searchInput.focus()
            })
        }
    }
}
</script>

<style lang="scss" scoped>
.search-bar-wrapper {
    position: relative;
    z-index: 100;
}

.search-bar {
    display: flex;
    align-items: center;
    gap: 12rpx;
    padding: 16rpx 20rpx;
    background: #ffffff;
    border-radius: 40rpx;
    border: 2rpx solid transparent;
    transition: all 0.2s ease;

    &.focused {
        border-color: #667eea;
        box-shadow: 0 0 0 6rpx rgba(102, 126, 234, 0.1);
    }
}

.search-icon {
    flex-shrink: 0;
    width: 40rpx;
    height: 40rpx;
    display: flex;
    align-items: center;
    justify-content: center;
}

.icon-text {
    font-size: 32rpx;
    opacity: 0.6;
}

.search-input {
    flex: 1;
    height: 60rpx;
    font-size: 28rpx;
    color: #333;
    background: transparent;
}

.input-placeholder {
    color: #999;
    font-size: 28rpx;
}

.search-clear {
    flex-shrink: 0;
    width: 40rpx;
    height: 40rpx;
    background: #e0e0e0;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.clear-icon {
    font-size: 32rpx;
    color: #999;
    line-height: 1;
    margin-top: -4rpx;
}

.search-btn {
    flex-shrink: 0;
    padding-left: 16rpx;
}

.btn-text {
    font-size: 28rpx;
    color: #667eea;
    font-weight: 500;
}

.suggest-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    margin-top: 8rpx;
    background: #ffffff;
    border-radius: 16rpx;
    box-shadow: 0 8rpx 30rpx rgba(0, 0, 0, 0.12);
    overflow: hidden;
    max-height: 600rpx;
    overflow-y: auto;
}

.suggest-list {
    padding: 8rpx 0;
}

.suggest-item {
    display: flex;
    align-items: center;
    gap: 16rpx;
    padding: 24rpx 28rpx;
    transition: background 0.15s ease;

    &:active {
        background: #f5f5f5;
    }
}

.suggest-icon {
    flex-shrink: 0;
    font-size: 28rpx;
    opacity: 0.5;
}

.suggest-text {
    flex: 1;
    font-size: 28rpx;
    color: #333;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    .highlight {
        color: #667eea;
        font-weight: 600;
    }
}

.suggest-arrow {
    flex-shrink: 0;
    font-size: 32rpx;
    color: #ddd;
    font-weight: 600;
}

.hot-search {
    margin-top: 24rpx;
    padding: 24rpx;
    background: #ffffff;
    border-radius: 16rpx;
}

.hot-header {
    display: flex;
    align-items: center;
    gap: 8rpx;
    margin-bottom: 20rpx;
}

.hot-icon {
    font-size: 28rpx;
}

.hot-title {
    font-size: 28rpx;
    font-weight: 600;
    color: #333;
}

.hot-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 16rpx;
}

.hot-tag {
    padding: 12rpx 24rpx;
    background: #f5f5f5;
    border-radius: 32rpx;
    transition: all 0.15s ease;

    &:active {
        background: rgba(102, 126, 234, 0.1);
        .tag-text {
            color: #667eea;
        }
    }
}

.tag-text {
    font-size: 24rpx;
    color: #666;
}
</style>
