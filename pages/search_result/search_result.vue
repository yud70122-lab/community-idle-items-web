<template>
    <view class="search-result-page">
        <ListSkeleton
            v-if="loading"
            :visible="loading"
            :show-header="false"
            :category-count="0"
            :item-count="6"
        />

        <template v-else>
        <view class="search-header">
            <view class="back-btn" @click="goBack">
                <text class="back-icon">‹</text>
            </view>
            <view class="search-bar">
                <text class="search-icon">🔍</text>
                <text class="search-keyword">{{ keyword }}</text>
            </view>
        </view>

        <view class="sort-tabs" v-if="hasSearched && searchResult.length > 0">
            <view class="tab-item" :class="{ active: sortType === 'default' }" @click="changeSort('default')">
                <text class="tab-text">综合</text>
                <view class="active-line" v-if="sortType === 'default'"></view>
            </view>
            <view class="tab-item" :class="{ active: sortType === 'latest' }" @click="changeSort('latest')">
                <text class="tab-text">最新</text>
                <view class="active-line" v-if="sortType === 'latest'"></view>
            </view>
        </view>

        <view class="result-content" v-if="hasSearched">
            <view class="result-header" v-if="searchResult.length > 0">
                <text class="result-count">
                    找到 <text class="highlight">{{ searchResult.length }}</text> 件相关物品
                </text>
            </view>

            <view class="item-grid" v-if="searchResult.length > 0">
                <ItemCard
                    v-for="item in searchResult"
                    :key="item.id"
                    :item="item"
                />
            </view>

            <view class="empty-result" v-else>
                <text class="empty-icon">🔍</text>
                <text class="empty-title">没有找到相关物品</text>
                <text class="empty-subtitle">为你推荐以下好物</text>
                
                <view class="recommend-section">
                    <view class="section-header">
                    <text class="section-title">猜你喜欢</text>
                    <text class="section-more" @click="goToHome">查看更多 ›</text>
                    </view>
                    <view class="item-grid">
                        <ItemCard
                            v-for="item in recommendItems"
                            :key="item.id"
                            :item="item"
                        />
                    </view>
                </view>
            </view>

            <view class="loading-more" v-if="isLoadingMore">
                <view class="spinner small"></view>
                <text class="loading-text">加载更多...</text>
            </view>

            <view class="no-more" v-if="!hasMore && searchResult.length > 0">
                <text class="no-more-text">— 没有更多了 —</text>
            </view>
        </view>
        </template>
    </view>
</template>

<script>
import http from '@/common/interceptor.js'
import HistoryManager from '@/common/HistoryManager.js'
import ItemCard from '@/components/ItemCard/ItemCard.vue'
import ListSkeleton from '@/components/ListSkeleton/ListSkeleton.vue'

export default {
    name: 'SearchResult',
    components: {
        ItemCard,
        ListSkeleton
    },
    data() {
        return {
            keyword: '',
            hasSearched: false,
            searchResult: [],
            recommendItems: [],
            sortType: 'default',
            page: 1,
            pageSize: 10,
            hasMore: true,
            loading: false,
            isLoadingMore: false
        }
    },
    onLoad(options) {
        if (options && options.keyword) {
            this.keyword = decodeURIComponent(options.keyword)
            this.doSearch()
        }
    },
    onReachBottom() {
        if (this.hasMore && !this.isLoadingMore && !this.loading && this.searchResult.length > 0) {
            this.loadMore()
        }
    },
    methods: {
        async doSearch() {
            if (!this.keyword) return

            this.loading = true
            this.page = 1
            this.hasMore = true

            try {
                HistoryManager.addHistory(this.keyword)

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
                }

                this.searchResult = this.enrichItems(items)
                this.hasMore = hasMoreData
                this.hasSearched = true

                if (this.searchResult.length === 0) {
                    this.loadRecommendItems()
                }
            } catch (error) {
                console.error('Search failed:', error)
                this.searchResult = []
                this.hasSearched = true
                this.loadRecommendItems()
            } finally {
                this.loading = false
            }
        },

        async loadMore() {
            this.isLoadingMore = true
            this.page++

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
                }

                items = this.enrichItems(items)
                this.searchResult = [...this.searchResult, ...items]
                this.hasMore = hasMoreData

                if (!hasMoreData && items.length < this.pageSize) {
                    this.hasMore = false
                }
            } catch (error) {
                console.error('Load more failed:', error)
                this.page--
                uni.showToast({
                    title: '加载失败，请重试',
                    icon: 'none'
                })
            } finally {
                this.isLoadingMore = false
            }
        },

        changeSort(type) {
            if (this.sortType === type) return
            this.sortType = type
            this.page = 1
            this.hasMore = true
            this.searchResult = []
            this.doSearch()
        },

        async loadRecommendItems() {
            try {
                const res = await http.get('/api/item/recommend', {
                    limit: 4
                })

                let items = []
                if (res && Array.isArray(res)) {
                    items = res
                } else if (res && res.list && Array.isArray(res.list)) {
                    items = res.list
                } else {
                    items = this.getMockRecommendItems()
                }

                this.recommendItems = this.enrichItems(items.slice(0, 4))
            } catch (error) {
                console.error('Load recommend items failed:', error)
                this.recommendItems = this.enrichItems(this.getMockRecommendItems())
            }
        },

        getMockRecommendItems() {
            return [
                { id: 'r1', title: 'iPhone 13 Pro 256G', description: '成色极佳，使用一年', price: 5299, coverImage: '', distance: '1.2km' },
                { id: 'r2', title: 'MacBook Air M2', description: '几乎全新，电池99新', price: 7999, coverImage: '', distance: '2.1km' },
                { id: 'r3', title: 'AirPods Pro 2', description: '带降噪，使用半年', price: 1099, coverImage: '', distance: '0.8km' },
                { id: 'r4', title: 'iPad Air 5', description: '256G WiFi版', price: 3899, coverImage: '', distance: '1.5km' }
            ]
        },

        enrichItems(items) {
            const conditions = ['excellent', 'good', 'good', 'fair', 'excellent', 'good']
            const tradeTypes = ['sell', 'exchange', 'both', 'sell', 'sell', 'both']
            const creditLevels = ['excellent', 'good', 'medium', 'good', 'excellent', 'good']

            return items.map((item, idx) => ({
                ...item,
                condition: item.condition || conditions[idx % conditions.length],
                tradeType: item.tradeType || tradeTypes[idx % tradeTypes.length],
                creditLevel: item.creditLevel || creditLevels[idx % creditLevels.length],
                viewCount: item.viewCount || Math.floor(Math.random() * 500) + 10
            }))
        },

        goBack() {
            uni.navigateBack()
        },

        goToHome() {
            uni.switchTab({ url: '/pages/index/index' })
        }
    }
}
</script>

<style lang="scss" scoped>
.search-result-page {
    min-height: 100vh;
    background: #f5f5f5;
}

.search-header {
    display: flex;
    align-items: center;
    gap: 16rpx;
    padding: 20rpx;
    background: #ffffff;
    position: sticky;
    top: 0;
    z-index: 100;
    box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.back-btn {
    flex-shrink: 0;
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

.search-bar {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 12rpx;
    padding: 16rpx 24rpx;
    background: #f5f5f5;
    border-radius: 40rpx;
}

.search-icon {
    font-size: 28rpx;
    opacity: 0.6;
}

.search-keyword {
    flex: 1;
    font-size: 28rpx;
    color: #333;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.sort-tabs {
    display: flex;
    align-items: center;
    background: #ffffff;
    padding: 0 30rpx;
    gap: 40rpx;
    border-bottom: 1rpx solid #f0f0f0;
}

.tab-item {
    position: relative;
    padding: 24rpx 0;

    &.active .tab-text {
        color: #667eea;
        font-weight: 600;
    }
}

.tab-text {
    font-size: 28rpx;
    color: #666;
    transition: color 0.2s;
}

.active-line {
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 40rpx;
    height: 6rpx;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 3rpx;
}

.result-content {
    padding: 20rpx;
}

.result-header {
    margin-bottom: 20rpx;
    padding: 0 10rpx;
}

.result-count {
    font-size: 26rpx;
    color: #999;

    .highlight {
        color: #667eea;
        font-weight: 600;
    }
}

.item-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 20rpx;
}

.empty-result {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 80rpx 40rpx 40rpx;
}

.empty-icon {
    font-size: 120rpx;
    opacity: 0.5;
    margin-bottom: 20rpx;
}

.empty-title {
    font-size: 30rpx;
    color: #333;
    font-weight: 500;
    margin-bottom: 8rpx;
}

.empty-subtitle {
    font-size: 26rpx;
    color: #999;
    margin-bottom: 40rpx;
}

.recommend-section {
    width: 100%;
    margin-top: 20rpx;
}

.section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20rpx;
}

.section-title {
    font-size: 30rpx;
    font-weight: 600;
    color: #333;
}

.section-more {
    font-size: 24rpx;
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

.spinner.small {
    width: 36rpx;
    height: 36rpx;
    border-width: 3rpx;
    margin-bottom: 0;
}

.loading-text {
    font-size: 26rpx;
    color: #999;
}

.loading-more {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12rpx;
    padding: 40rpx 0;
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
