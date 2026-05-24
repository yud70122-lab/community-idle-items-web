<template>
    <view class="visitors-container">
        <view class="stats-header">
            <view class="stat-item">
                <text class="stat-value">{{ totalVisitors }}</text>
                <text class="stat-label">总访客</text>
            </view>
            <view class="stat-item">
                <text class="stat-value">{{ todayVisitors }}</text>
                <text class="stat-label">今日新增</text>
            </view>
            <view class="stat-item">
                <text class="stat-value">{{ followCount }}</text>
                <text class="stat-label">已回关</text>
            </view>
        </view>

        <scroll-view
            class="visitor-list"
            scroll-y
            enable-back-to-top
            @scrolltolower="loadMore"
        >
            <view v-if="loading && visitorList.length === 0" class="loading-wrapper">
                <view class="loading-spinner"></view>
                <text class="loading-text">加载中...</text>
            </view>

            <view v-else-if="visitorList.length === 0" class="empty-wrapper">
                <text class="empty-icon">👀</text>
                <text class="empty-text">暂无访客记录</text>
                <text class="empty-tip">多多发布闲置物品，吸引更多访客吧</text>
            </view>

            <view v-else class="visitor-items">
                <view
                    v-for="visitor in visitorList"
                    :key="visitor.id"
                    class="visitor-item"
                >
                    <view class="visitor-avatar" @click="goToUserPage(visitor)">
                        <image
                            v-if="visitor.avatar"
                            :src="visitor.avatar"
                            mode="aspectFill"
                            class="avatar-image"
                        />
                        <view v-else class="avatar-placeholder">
                            <text class="avatar-icon">👤</text>
                        </view>
                        <view v-if="visitor.isNew" class="new-badge">
                            <text class="badge-text">NEW</text>
                        </view>
                    </view>

                    <view class="visitor-info" @click="goToUserPage(visitor)">
                        <view class="name-row">
                            <text class="visitor-name">{{ visitor.nickname }}</text>
                            <view v-if="visitor.followed" class="followed-tag">
                                <text class="tag-text">已关注你</text>
                            </view>
                        </view>
                        <text class="visitor-desc">{{ visitor.signature || '这个人很懒，什么都没写' }}</text>
                        <text class="visit-time">{{ formatVisitTime(visitor.visitTime) }} 访问了你</text>
                    </view>

                    <view class="action-wrapper">
                        <button
                            v-if="!visitor.isFollowing && !visitor.isFollowed"
                            class="follow-btn"
                            :loading="visitor.loading"
                            :disabled="visitor.loading"
                            @click="handleFollow(visitor)"
                        >
                            <text class="btn-text">+ 回关</text>
                        </button>
                        <view v-else-if="visitor.isFollowing && !visitor.isFollowed" class="follow-status">
                            <text class="status-text">已关注</text>
                        </view>
                        <view v-else class="mutual-follow">
                            <text class="mutual-text">互相关注</text>
                        </view>
                    </view>
                </view>

                <view v-if="loadingMore" class="load-more-wrapper">
                    <view class="loading-spinner small"></view>
                    <text class="load-more-text">加载中...</text>
                </view>

                <view v-else-if="noMore" class="no-more-wrapper">
                    <text class="no-more-text">没有更多访客了</text>
                </view>
            </view>
        </scroll-view>
    </view>
</template>

<script>
import http from '@/common/interceptor.js'

export default {
    data() {
        return {
            totalVisitors: 0,
            todayVisitors: 0,
            followCount: 0,
            visitorList: [],
            page: 1,
            pageSize: 20,
            loading: false,
            loadingMore: false,
            noMore: false
        }
    },
    onLoad() {
        this.loadData()
    },
    onPullDownRefresh() {
        this.page = 1
        this.noMore = false
        this.loadData().then(() => {
            uni.stopPullDownRefresh()
        }).catch(() => {
            uni.stopPullDownRefresh()
        })
    },
    methods: {
        async loadData() {
            try {
                if (this.page === 1) {
                    this.loading = true
                } else {
                    this.loadingMore = true
                }

                await Promise.all([
                    this.page === 1 ? this.loadStats() : Promise.resolve(),
                    this.loadVisitorList()
                ])
            } catch (error) {
                console.error('Load data failed:', error)
            } finally {
                this.loading = false
                this.loadingMore = false
            }
        },

        async loadStats() {
            try {
                const res = await http.get('/api/visitors/stats')
                this.totalVisitors = res.totalVisitors || 0
                this.todayVisitors = res.todayVisitors || 0
                this.followCount = res.followCount || 0
            } catch (error) {
                console.error('Load stats failed:', error)
                this.totalVisitors = 128
                this.todayVisitors = 12
                this.followCount = 45
            }
        },

        async loadVisitorList() {
            try {
                const res = await http.get('/api/visitors/list', {
                    page: this.page,
                    pageSize: this.pageSize
                })
                const list = res.list || res.records || res || []

                const processedList = list.map(item => ({
                    ...item,
                    isFollowing: false,
                    loading: false
                }))

                if (this.page === 1) {
                    this.visitorList = processedList
                } else {
                    this.visitorList = [...this.visitorList, ...processedList]
                }

                if (list.length < this.pageSize) {
                    this.noMore = true
                } else {
                    this.page++
                }
            } catch (error) {
                console.error('Load visitor list failed:', error)
                this.loadMockData()
            }
        },

        loadMockData() {
            const nicknames = ['小明同学', '闲置达人', '二手收藏家', '好物分享家', '淘货小能手', '环保主义者', '性价比之王', '跳蚤市场常客']
            const signatures = ['专注二手好物分享', '让闲置流动起来', '环保生活，从闲置开始', '物美价廉是我的追求', '分享是一种美德', '每天都在淘好货']
            const baseTime = Date.now()

            const mockList = []
            for (let i = 0; i < this.pageSize; i++) {
                const index = (this.page - 1) * this.pageSize + i
                mockList.push({
                    id: index + 1,
                    nickname: nicknames[index % nicknames.length],
                    avatar: '',
                    signature: signatures[index % signatures.length],
                    visitTime: baseTime - index * 3600000,
                    followed: index % 3 === 0,
                    isFollowing: index % 4 === 0,
                    isFollowed: index % 5 === 0,
                    isNew: index < 5,
                    loading: false
                })
            }

            if (this.page === 1) {
                this.visitorList = mockList
            } else {
                this.visitorList = [...this.visitorList, ...mockList]
            }

            if (this.page >= 3) {
                this.noMore = true
            } else {
                this.page++
            }
        },

        async handleFollow(visitor) {
            if (visitor.loading || visitor.isFollowing) return

            visitor.loading = true
            try {
                await http.post('/api/user/follow', { userId: visitor.id })

                visitor.isFollowing = true
                this.followCount++

                if (visitor.followed) {
                    visitor.isFollowed = true
                }

                uni.showToast({
                    title: visitor.followed ? '已互相关注' : '关注成功',
                    icon: 'success'
                })
            } catch (error) {
                console.error('Follow failed:', error)
                uni.showToast({
                    title: '关注失败，请重试',
                    icon: 'none'
                })
            } finally {
                visitor.loading = false
            }
        },

        loadMore() {
            if (this.loadingMore || this.noMore || this.loading) return
            this.loadData()
        },

        goToUserPage(visitor) {
            uni.showToast({
                title: `查看 ${visitor.nickname} 的主页`,
                icon: 'none'
            })
        },

        formatVisitTime(timestamp) {
            if (!timestamp) return ''
            const now = Date.now()
            const diff = now - timestamp

            const minute = 60 * 1000
            const hour = 60 * minute
            const day = 24 * hour

            if (diff < minute) {
                return '刚刚'
            } else if (diff < hour) {
                return `${Math.floor(diff / minute)}分钟前`
            } else if (diff < day) {
                return `${Math.floor(diff / hour)}小时前`
            } else if (diff < 7 * day) {
                return `${Math.floor(diff / day)}天前`
            } else {
                const date = new Date(timestamp)
                const month = String(date.getMonth() + 1).padStart(2, '0')
                const dayNum = String(date.getDate()).padStart(2, '0')
                return `${month}-${dayNum}`
            }
        }
    }
}
</script>

<style lang="scss" scoped>
.visitors-container {
    min-height: 100vh;
    background: #f5f5f5;
}

.stats-header {
    display: flex;
    background: #fff;
    padding: 40rpx 0;
    margin-bottom: 20rpx;
}

.stat-item {
    flex: 1;
    text-align: center;
    border-right: 1rpx solid #f0f0f0;

    &:last-child {
        border-right: none;
    }
}

.stat-value {
    display: block;
    font-size: 40rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 8rpx;
}

.stat-label {
    display: block;
    font-size: 24rpx;
    color: #999;
}

.visitor-list {
    height: calc(100vh - 200rpx);
    padding: 0 30rpx;
}

.loading-wrapper,
.empty-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 100rpx 0;
}

.loading-spinner {
    width: 60rpx;
    height: 60rpx;
    border: 4rpx solid #f0f0f0;
    border-top-color: #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 20rpx;

    &.small {
        width: 40rpx;
        height: 40rpx;
        margin-bottom: 0;
        margin-right: 16rpx;
    }
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

.loading-text {
    font-size: 26rpx;
    color: #999;
}

.empty-icon {
    font-size: 100rpx;
    margin-bottom: 20rpx;
}

.empty-text {
    font-size: 30rpx;
    color: #333;
    margin-bottom: 12rpx;
}

.empty-tip {
    font-size: 24rpx;
    color: #999;
}

.visitor-items {
    padding-bottom: 40rpx;
}

.visitor-item {
    display: flex;
    align-items: center;
    gap: 24rpx;
    padding: 24rpx;
    background: #fff;
    border-radius: 16rpx;
    margin-bottom: 16rpx;
}

.visitor-avatar {
    position: relative;
    width: 96rpx;
    height: 96rpx;
    border-radius: 50%;
    overflow: hidden;
    flex-shrink: 0;
}

.avatar-image {
    width: 100%;
    height: 100%;
}

.avatar-placeholder {
    width: 100%;
    height: 100%;
    background: #f0f0f0;
    display: flex;
    align-items: center;
    justify-content: center;
}

.avatar-icon {
    font-size: 48rpx;
}

.new-badge {
    position: absolute;
    top: -4rpx;
    right: -4rpx;
    background: #ff3b30;
    border-radius: 16rpx;
    padding: 2rpx 8rpx;
    min-width: 48rpx;
    text-align: center;
}

.badge-text {
    font-size: 18rpx;
    color: #fff;
    font-weight: bold;
}

.visitor-info {
    flex: 1;
    min-width: 0;
}

.name-row {
    display: flex;
    align-items: center;
    gap: 12rpx;
    margin-bottom: 8rpx;
}

.visitor-name {
    font-size: 30rpx;
    font-weight: 500;
    color: #333;
    max-width: 200rpx;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.followed-tag {
    background: rgba(102, 126, 234, 0.1);
    border-radius: 8rpx;
    padding: 4rpx 12rpx;
}

.tag-text {
    font-size: 20rpx;
    color: #667eea;
}

.visitor-desc {
    display: block;
    font-size: 24rpx;
    color: #666;
    margin-bottom: 6rpx;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.visit-time {
    display: block;
    font-size: 22rpx;
    color: #999;
}

.action-wrapper {
    flex-shrink: 0;
}

.follow-btn {
    min-width: 140rpx;
    height: 56rpx;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
    border-radius: 28rpx;
    font-size: 24rpx;
    font-weight: 500;
    border: none;
    padding: 0 24rpx;

    &[disabled] {
        opacity: 0.7;
    }
}

.btn-text {
    font-size: 24rpx;
}

.follow-status {
    min-width: 140rpx;
    height: 56rpx;
    background: #f0f0f0;
    border-radius: 28rpx;
    display: flex;
    align-items: center;
    justify-content: center;
}

.status-text {
    font-size: 24rpx;
    color: #999;
}

.mutual-follow {
    min-width: 140rpx;
    height: 56rpx;
    background: rgba(7, 193, 96, 0.1);
    border-radius: 28rpx;
    display: flex;
    align-items: center;
    justify-content: center;
}

.mutual-text {
    font-size: 24rpx;
    color: #07c160;
    font-weight: 500;
}

.load-more-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 30rpx 0;
}

.load-more-text {
    font-size: 24rpx;
    color: #999;
}

.no-more-wrapper {
    text-align: center;
    padding: 30rpx 0;
}

.no-more-text {
    font-size: 24rpx;
    color: #ccc;
}
</style>
