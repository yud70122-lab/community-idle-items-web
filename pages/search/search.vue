<template>
    <view class="search-page">
        <view class="search-header">
            <SearchBar
                ref="searchBar"
                v-model="keyword"
                :auto-focus="true"
                :show-cancel-button="true"
                :show-hot-search="true"
                @search="onSearch"
                @select="onSuggestSelect"
                @hot-select="onHotSelect"
                @cancel="onCancel"
            />
        </view>

        <view class="search-content" v-if="hasSearched">
            <view class="search-result-header">
                <text class="result-text">
                    找到 <text class="highlight">{{ searchResult.length }}</text> 件相关物品
                </text>
                <view class="sort-options">
                    <text
                        class="sort-item"
                        :class="{ active: sortType === 'default' }"
                        @click="changeSort('default')"
                    >综合</text>
                    <text
                        class="sort-item"
                        :class="{ active: sortType === 'price_asc' }"
                        @click="changeSort('price_asc')"
                    >价格↑</text>
                    <text
                        class="sort-item"
                        :class="{ active: sortType === 'price_desc' }"
                        @click="changeSort('price_desc')"
                    >价格↓</text>
                </view>
            </view>

            <view class="item-grid" v-if="searchResult.length > 0">
                <ItemCard
                    v-for="item in searchResult"
                    :key="item.id"
                    :item="item"
                />
            </view>

            <view class="empty-search" v-else>
                <text class="empty-icon">🔍</text>
                <text class="empty-text">没有找到相关物品</text>
                <text class="empty-hint">试试其他关键词吧</text>
            </view>

            <view class="loading-more" v-if="isLoadingMore">
                <view class="spinner small"></view>
                <text class="loading-text">加载更多...</text>
            </view>

            <view class="no-more" v-if="!hasMore && searchResult.length > 0">
                <text class="no-more-text">— 没有更多了 —</text>
            </view>
        </view>

        <view class="search-history" v-if="!hasSearched && searchHistory.length > 0">
            <view class="history-header">
                <text class="history-title">搜索历史</text>
                <view class="history-clear" @click="clearHistory">
                    <text class="clear-icon">🗑️</text>
                    <text class="clear-text">清空</text>
                </view>
            </view>
            <view class="history-tags">
                <view
                    v-for="(word, index) in searchHistory"
                    :key="index"
                    class="history-tag"
                    @click="searchHistoryWord(word)"
                >
                    <text class="tag-text">{{ word }}</text>
                </view>
            </view>
        </view>
    </view>
</template>

<script>
import http from '@/common/interceptor.js'
import SearchBar from '@/components/search-bar/search-bar.vue'
import ItemCard from '@/components/ItemCard/ItemCard.vue'

export default {
    name: 'SearchPage',
    components: {
        SearchBar,
        ItemCard
    },
    data() {
        return {
            keyword: '',
            hasSearched: false,
            searchResult: [],
            searchHistory: [],
            page: 1,
            pageSize: 10,
            hasMore: true,
            isLoadingMore: false,
            sortType: 'default'
        }
    },
    onLoad(options) {
        this.loadHistory()
        if (options && options.keyword) {
            this.keyword = options.keyword
            this.$nextTick(() => {
                this.onSearch(this.keyword)
            })
        }
    },
    onReachBottom() {
        if (this.hasMore && !this.isLoadingMore && this.hasSearched) {
            this.loadMore()
        }
    },
    methods: {
        loadHistory() {
            try {
                const history = uni.getStorageSync('search_history')
                if (history && Array.isArray(history)) {
                    this.searchHistory = history.slice(0, 10)
                }
            } catch (e) {
                console.error('Load search history failed:', e)
            }
        },

        saveHistory(word) {
            if (!word || word.trim() === '') return

            try {
                let history = uni.getStorageSync('search_history') || []
                if (!Array.isArray(history)) {
                    history = []
                }

                history = history.filter(item => item !== word)
                history.unshift(word)
                history = history.slice(0, 10)

                uni.setStorageSync('search_history', history)
                this.searchHistory = history
            } catch (e) {
                console.error('Save search history failed:', e)
            }
        },

        clearHistory() {
            uni.showModal({
                title: '提示',
                content: '确定清空搜索历史吗？',
                success: (res) => {
                    if (res.confirm) {
                        uni.removeStorageSync('search_history')
                        this.searchHistory = []
                        uni.showToast({ title: '已清空', icon: 'success' })
                    }
                }
            })
        },

        async onSearch(keyword) {
            if (!keyword || keyword.trim() === '') {
                uni.showToast({ title: '请输入搜索内容', icon: 'none' })
                return
            }

            this.keyword = keyword.trim()
            this.saveHistory(this.keyword)
            this.hasSearched = true
            this.page = 1
            this.hasMore = true
            this.searchResult = []

            await this.doSearch()
        },

        onSuggestSelect(item) {
            const keyword = item.keyword || item.name || item
            this.onSearch(keyword)
        },

        onHotSelect(word) {
            this.onSearch(word)
        },

        searchHistoryWord(word) {
            this.keyword = word
            this.$refs.searchBar && this.$refs.searchBar.clearSuggestions()
            this.onSearch(word)
        },

        onCancel() {
            uni.navigateBack()
        },

        changeSort(type) {
            if (this.sortType === type) return
            this.sortType = type
            this.page = 1
            this.hasMore = true
            this.searchResult = []
            this.doSearch()
        },

        async doSearch() {
            try {
                const params = {
                    keyword: this.keyword,
                    page: this.page,
                    pageSize: this.pageSize,
                    sort: this.sortType
                }

                const res = await http.get('/api/search', params)
                let items = []
                let hasMoreData = true

                if (res && Array.isArray(res)) {
                    items = res
                    hasMoreData = res.length >= this.pageSize
                } else if (res && res.list && Array.isArray(res.list)) {
                    items = res.list
                    hasMoreData = res.hasMore !== false && res.list.length >= this.pageSize
                } else {
                    items = this.getMockSearchResult()
                    hasMoreData = false
                }

                items = items.map((item, idx) => ({
                    ...item,
                    condition: ['excellent', 'good', 'fair'][idx % 3],
                    tradeType: ['sell', 'both', 'sell'][idx % 3],
                    creditLevel: ['excellent', 'good', 'medium'][idx % 3],
                    viewCount: Math.floor(Math.random() * 500) + 10
                }))

                if (this.page === 1) {
                    this.searchResult = items
                } else {
                    this.searchResult = [...this.searchResult, ...items]
                }

                this.hasMore = hasMoreData
            } catch (error) {
                console.error('Search failed:', error)
                if (this.page === 1) {
                    this.searchResult = this.getMockSearchResult()
                    this.hasMore = false
                } else {
                    this.page--
                }
            }
        },

        async loadMore() {
            this.isLoadingMore = true
            this.page++
            await this.doSearch()
            this.isLoadingMore = false
        },

        getMockSearchResult() {
            const keyword = this.keyword
            return [
                {
                    id: '1',
                    title: `${keyword} 九成新`,
                    description: '自用物品，保养良好',
                    price: 999,
                    coverImage: '',
                    distance: '1.2km'
                },
                {
                    id: '2',
                    title: `${keyword} 全新未拆封`,
                    description: '全新未使用，配件齐全',
                    price: 1999,
                    coverImage: '',
                    distance: '2.5km'
                },
                {
                    id: '3',
                    title: `${keyword} 低价转让`,
                    description: '搬家急出，价格可谈',
                    price: 500,
                    coverImage: '',
                    distance: '0.8km'
                }
            ]
        }
    }
}
</script>

<style lang="scss" scoped>
.search-page {
    min-height: 100vh;
    background: #f5f5f5;
}

.search-header {
    position: sticky;
    top: 0;
    z-index: 100;
    background: #f5f5f5;
    padding: 20rpx;
    padding-bottom: 10rpx;
}

.search-content {
    padding: 20rpx;
}

.search-result-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20rpx;
    padding: 0 10rpx;
}

.result-text {
    font-size: 26rpx;
    color: #999;

    .highlight {
        color: #667eea;
        font-weight: 600;
    }
}

.sort-options {
    display: flex;
    align-items: center;
    gap: 24rpx;
}

.sort-item {
    font-size: 26rpx;
    color: #999;
    transition: color 0.2s;

    &.active {
        color: #667eea;
        font-weight: 600;
    }
}

.item-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 20rpx;
}

.empty-search {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 120rpx 40rpx;
}

.empty-icon {
    font-size: 120rpx;
    margin-bottom: 20rpx;
    opacity: 0.5;
}

.empty-text {
    font-size: 28rpx;
    color: #999;
    margin-bottom: 12rpx;
}

.empty-hint {
    font-size: 24rpx;
    color: #ccc;
}

.search-history {
    padding: 20rpx 30rpx;
}

.history-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20rpx;
}

.history-title {
    font-size: 28rpx;
    font-weight: 600;
    color: #333;
}

.history-clear {
    display: flex;
    align-items: center;
    gap: 6rpx;
}

.clear-icon {
    font-size: 24rpx;
    opacity: 0.6;
}

.clear-text {
    font-size: 24rpx;
    color: #999;
}

.history-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 16rpx;
}

.history-tag {
    padding: 12rpx 24rpx;
    background: #ffffff;
    border-radius: 32rpx;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
    transition: all 0.15s ease;

    &:active {
        background: rgba(102, 126, 234, 0.05);
        .tag-text {
            color: #667eea;
        }
    }
}

.tag-text {
    font-size: 24rpx;
    color: #666;
}

.loading-more {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12rpx;
    padding: 40rpx 0;
}

.spinner.small {
    width: 36rpx;
    height: 36rpx;
    border: 3rpx solid rgba(102, 126, 234, 0.2);
    border-top-color: #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 0;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

.loading-text {
    font-size: 24rpx;
    color: #999;
}

.no-more {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40rpx 0;
}

.no-more-text {
    font-size: 24rpx;
    color: #ccc;
}
</style>
