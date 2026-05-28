<template>
    <view class="index-page">
        <ListSkeleton
            v-if="loading && itemList.length === 0"
            :visible="loading && itemList.length === 0"
            :show-header="true"
        />

        <template v-else>
        <view class="page-header">
            <view class="header-top">
                <view class="header-title">
                    <text class="title-text">社区闲置</text>
                    <text class="subtitle-text">让闲置物品流动起来</text>
                </view>
                <view class="header-actions">
                    <view class="search-btn" @click="goToSearch">
                        <text class="search-icon">🔍</text>
                    </view>
                </view>
            </view>

            <view class="category-nav">
                <scroll-view
                    class="category-scroll"
                    scroll-x
                    :scroll-with-animation="true"
                    :scroll-into-view="scrollIntoView"
                    show-scrollbar="false"
                >
                    <view class="category-list">
                        <view
                            v-for="(category, index) in categories"
                            :key="category.id || index"
                            :id="'cat_' + (category.id || index)"
                            class="category-item"
                            :class="{ active: selectedCategory === (category.id || 'all') }"
                            @click="selectCategory(category, index)"
                        >
                            <text class="category-icon">{{ category.icon || '📦' }}</text>
                            <text class="category-name">{{ category.name }}</text>
                            <view class="active-indicator" v-if="selectedCategory === (category.id || 'all')"></view>
                        </view>
                    </view>
                </scroll-view>
            </view>
        </view>

        <view class="content-wrapper">
            <view class="section-header">
                <text class="section-title">{{ currentCategoryName }}</text>
                <text class="section-count">{{ itemList.length }}件物品</text>
            </view>

            <view class="item-grid" v-if="itemList.length > 0">
                <ItemCard
                    v-for="item in itemList"
                    :key="item.id"
                    :item="item"
                    @click="onItemClick"
                />
            </view>

            <view class="loading-more" v-if="isLoadingMore">
                <view class="spinner small"></view>
                <text class="loading-text">加载更多...</text>
            </view>

            <view class="no-more" v-if="!hasMore && itemList.length > 0 && !loading">
                <text class="no-more-text">— 没有更多了 —</text>
            </view>

            <view class="empty-state" v-else-if="!loading">
                <text class="empty-icon">📭</text>
                <text class="empty-text">该分类暂无物品</text>
                <button class="refresh-btn" @click="loadItems">
                    <text class="btn-text">刷新看看</text>
                </button>
            </view>

            <view class="loading-state" v-if="loading">
                <view class="spinner"></view>
                <text class="loading-text">加载中...</text>
            </view>
        </view>

        <view class="publish-fab" @click="goToPublish">
            <text class="fab-icon">+</text>
            <text class="fab-text">发布</text>
        </view>
        </template>
    </view>
</template>

<script>
import http from '@/common/interceptor.js'
import ItemCard from '@/components/ItemCard/ItemCard.vue'
import ListSkeleton from '@/components/ListSkeleton/ListSkeleton.vue'

export default {
    name: 'IndexPage',
    components: {
        ItemCard,
        ListSkeleton
    },
    data() {
        return {
            categories: [],
            selectedCategory: 'all',
            scrollIntoView: '',
            itemList: [],
            loading: false,
            page: 1,
            pageSize: 10,
            hasMore: true,
            isRefreshing: false,
            isLoadingMore: false
        }
    },
    computed: {
        currentCategoryName() {
            const cat = this.categories.find(c => (c.id || 'all') === this.selectedCategory)
            return cat ? cat.name : '全部'
        }
    },
    onLoad(options) {
        this.loadCategories()
        if (options && options.itemId) {
            setTimeout(() => {
                this.goToDetail(options.itemId)
            }, 500)
        }
    },
    onShow() {
        this.loadItems()
    },
    onPullDownRefresh() {
        if (this.isRefreshing || this.loading) {
            uni.stopPullDownRefresh()
            return
        }
        this.isRefreshing = true
        this.page = 1
        this.hasMore = true
        this.loadItems()
            .then(() => {
                uni.stopPullDownRefresh()
                uni.showToast({ title: '刷新成功', icon: 'success', duration: 1000 })
            })
            .catch(() => {
                uni.stopPullDownRefresh()
                uni.showToast({ title: '刷新失败，请重试', icon: 'none' })
            })
            .finally(() => {
                this.isRefreshing = false
            })
    },
    onReachBottom() {
        if (this.isLoadingMore || this.loading || this.isRefreshing || !this.hasMore) {
            return
        }
        this.isLoadingMore = true
        this.page++
        this.loadItems().finally(() => {
            this.isLoadingMore = false
        })
    },
    methods: {
        async loadCategories() {
            try {
                const res = await http.get('/api/category/list')
                if (res && Array.isArray(res)) {
                    this.categories = [
                        { id: 'all', name: '全部', icon: '🏠' },
                        ...res.map(cat => ({
                            id: cat.id,
                            name: cat.name,
                            icon: cat.icon || '📦'
                        }))
                    ]
                } else if (res && res.list && Array.isArray(res.list)) {
                    this.categories = [
                        { id: 'all', name: '全部', icon: '🏠' },
                        ...res.list.map(cat => ({
                            id: cat.id,
                            name: cat.name,
                            icon: cat.icon || '📦'
                        }))
                    ]
                } else {
                    this.loadMockCategories()
                }
            } catch (error) {
                console.error('Load categories failed:', error)
                this.loadMockCategories()
            }
        },

        loadMockCategories() {
            this.categories = [
                { id: 'all', name: '全部', icon: '🏠' },
                { id: '1', name: '数码电子', icon: '📱' },
                { id: '2', name: '家用电器', icon: '🔌' },
                { id: '3', name: '服饰鞋包', icon: '👕' },
                { id: '4', name: '图书文具', icon: '📚' },
                { id: '5', name: '母婴用品', icon: '🍼' },
                { id: '6', name: '运动户外', icon: '⚽' },
                { id: '7', name: '家居生活', icon: '🛋️' },
                { id: '8', name: '美妆个护', icon: '💄' },
                { id: '9', name: '其他', icon: '📦' }
            ]
        },

        selectCategory(category, index) {
            const categoryId = category.id || 'all'
            if (this.selectedCategory === categoryId) return

            this.selectedCategory = categoryId
            this.scrollIntoView = 'cat_' + (category.id || index)
            this.resetPagination()
            this.loadItems()

            uni.vibrateShort && uni.vibrateShort({ type: 'light' })
        },

        resetPagination() {
            this.page = 1
            this.hasMore = true
            this.itemList = []
            this.isLoadingMore = false
        },

        async loadItems() {
            if (this.page === 1 && !this.isRefreshing) {
                this.loading = true
            }

            try {
                const params = {
                    page: this.page,
                    pageSize: this.pageSize
                }
                if (this.selectedCategory !== 'all') {
                    params.categoryId = this.selectedCategory
                }

                const res = await http.get('/api/item/list', params)
                let items = []
                let hasMoreData = true

                if (res && Array.isArray(res)) {
                    items = res
                    hasMoreData = res.length >= this.pageSize
                } else if (res && res.list && Array.isArray(res.list)) {
                    items = res.list
                    hasMoreData = res.hasMore !== false && res.list.length >= this.pageSize
                } else {
                    items = this.getMockItems()
                    hasMoreData = items.length >= this.pageSize
                }

                items = this.enrichItems(items)

                if (this.page === 1) {
                    this.itemList = items
                } else {
                    this.itemList = [...this.itemList, ...items]
                }

                this.hasMore = hasMoreData

                if (!this.hasMore && this.page > 1) {
                    uni.showToast({
                        title: '已加载全部',
                        icon: 'none',
                        duration: 1000
                    })
                }

                return items
            } catch (error) {
                console.error('Load items failed:', error)
                if (this.page === 1) {
                    this.itemList = this.enrichItems(this.getMockItems())
                    this.hasMore = false
                } else {
                    this.page--
                    uni.showToast({
                        title: '加载失败，下拉重试',
                        icon: 'none'
                    })
                }
                throw error
            } finally {
                this.loading = false
            }
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

        onItemClick(item) {
            this.$emit('itemClick', item)
        },

        getMockItems() {
            const mockItems = [
                {
                    id: '1',
                    title: 'iPhone 12 128G 黑色',
                    description: '自用iPhone 12，九成新，无磕碰',
                    price: 2999,
                    coverImage: '',
                    distance: '2.3km'
                },
                {
                    id: '2',
                    title: 'MacBook Pro 13寸',
                    description: '2020款 M1芯片 8G+256G',
                    price: 6999,
                    coverImage: '',
                    distance: '1.5km'
                },
                {
                    id: '3',
                    title: 'Sony WH-1000XM4',
                    description: '降噪耳机，几乎全新',
                    price: 1299,
                    coverImage: '',
                    distance: '3.1km'
                },
                {
                    id: '4',
                    title: '小米空气净化器Pro',
                    description: '使用半年，滤芯刚换过',
                    price: 800,
                    coverImage: '',
                    distance: '0.8km'
                },
                {
                    id: '5',
                    title: '《JavaScript高级程序设计》',
                    description: '第四版，几乎全新',
                    price: 50,
                    coverImage: '',
                    distance: '1.2km'
                },
                {
                    id: '6',
                    title: 'Nike Air Max 270',
                    description: '42码，穿过两次',
                    price: 450,
                    coverImage: '',
                    distance: '2.7km'
                }
            ]
            return mockItems
        },

        goToSearch() {
            uni.navigateTo({ url: '/pages/search/search' })
        },

        goToDetail(id) {
            uni.navigateTo({ url: `/pages/item_detail/item_detail?id=${id}` })
        },

        goToPublish() {
            uni.navigateTo({ url: '/pages/publish/publish' })
        }
    }
}
</script>

<style lang="scss" scoped>
.index-page {
    min-height: 100vh;
    background: #f5f5f5;
    padding-bottom: 120rpx;
}

.page-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding-top: 60rpx;
    position: sticky;
    top: 0;
    z-index: 100;
}

.header-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 30rpx 20rpx;
}

.header-title {
    display: flex;
    flex-direction: column;
    gap: 4rpx;
}

.title-text {
    font-size: 40rpx;
    font-weight: 700;
    color: #ffffff;
}

.subtitle-text {
    font-size: 24rpx;
    color: rgba(255, 255, 255, 0.8);
}

.header-actions {
    display: flex;
    align-items: center;
    gap: 16rpx;
}

.search-btn {
    width: 72rpx;
    height: 72rpx;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.search-icon {
    font-size: 32rpx;
}

.category-nav {
    background: #ffffff;
    border-radius: 30rpx 30rpx 0 0;
    padding-top: 20rpx;
    box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.1);
}

.category-scroll {
    white-space: nowrap;
}

.category-list {
    display: inline-flex;
    padding: 0 20rpx 16rpx;
    gap: 8rpx;
}

.category-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6rpx;
    padding: 16rpx 24rpx;
    border-radius: 16rpx;
    position: relative;
    transition: all 0.2s ease;
    min-width: 100rpx;

    &.active {
        background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);

        .category-icon {
            transform: scale(1.1);
        }

        .category-name {
            color: #667eea;
            font-weight: 600;
        }
    }
}

.category-icon {
    font-size: 40rpx;
    transition: transform 0.2s ease;
}

.category-name {
    font-size: 24rpx;
    color: #666;
    white-space: nowrap;
}

.active-indicator {
    position: absolute;
    bottom: 4rpx;
    left: 50%;
    transform: translateX(-50%);
    width: 40rpx;
    height: 6rpx;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 3rpx;
}

.content-wrapper {
    padding: 20rpx;
    background: #ffffff;
    min-height: calc(100vh - 320rpx);
}

.section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20rpx;
}

.section-title {
    font-size: 32rpx;
    font-weight: 600;
    color: #333;
}

.section-count {
    font-size: 24rpx;
    color: #999;
}

.item-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 20rpx;
}

.item-card {
    width: calc((100% - 20rpx) / 2);
    background: #ffffff;
    border-radius: 16rpx;
    overflow: hidden;
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
    transition: transform 0.2s ease;

    &:active {
        transform: scale(0.98);
    }
}

.item-image {
    width: 100%;
    height: 240rpx;
    background: #f0f0f0;
}

.item-info {
    padding: 16rpx;
}

.item-title {
    display: block;
    font-size: 28rpx;
    font-weight: 600;
    color: #333;
    margin-bottom: 6rpx;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.item-desc {
    display: block;
    font-size: 22rpx;
    color: #999;
    margin-bottom: 12rpx;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.item-bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.item-price {
    display: flex;
    align-items: baseline;
    gap: 2rpx;

    &.free .price-value {
        color: #07c160;
        font-size: 28rpx;
    }
}

.price-symbol {
    font-size: 22rpx;
    font-weight: 600;
    color: #ff4757;
}

.price-value {
    font-size: 32rpx;
    font-weight: 700;
    color: #ff4757;
}

.item-location {
    display: flex;
    align-items: center;
    gap: 4rpx;
}

.location-icon {
    font-size: 20rpx;
}

.location-text {
    font-size: 20rpx;
    color: #999;
}

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 100rpx 40rpx;
}

.empty-icon {
    font-size: 120rpx;
    margin-bottom: 20rpx;
}

.empty-text {
    font-size: 28rpx;
    color: #999;
    margin-bottom: 40rpx;
}

.refresh-btn {
    min-width: 200rpx;
    height: 72rpx;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 36rpx;
    border: none;

    .btn-text {
        color: #ffffff;
        font-size: 26rpx;
        font-weight: 500;
    }
}

.loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80rpx;
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
    border-width: 3rpx;
    margin-bottom: 0;
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

.publish-fab {
    position: fixed;
    right: 40rpx;
    bottom: 60rpx;
    width: 120rpx;
    height: 120rpx;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 60rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8rpx 30rpx rgba(102, 126, 234, 0.4);
    z-index: 200;
    transition: transform 0.2s ease;

    &:active {
        transform: scale(0.95);
    }
}

.fab-icon {
    font-size: 48rpx;
    color: #ffffff;
    font-weight: 300;
    line-height: 1;
    margin-top: -6rpx;
}

.fab-text {
    font-size: 20rpx;
    color: #ffffff;
    font-weight: 500;
    margin-top: -4rpx;
}
</style>
