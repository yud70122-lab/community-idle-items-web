<template>
    <view class="profile-container">
        <view class="header-section">
            <view class="user-info">
                <view class="avatar-wrapper" @click="goToEdit">
                    <image
                        v-if="userInfo?.avatar"
                        :src="userInfo.avatar"
                        mode="aspectFill"
                        class="avatar"
                    />
                    <view v-else class="avatar-placeholder">
                        <text class="avatar-icon">👤</text>
                    </view>
                </view>
                <view class="user-detail">
                    <text class="nickname">{{ userInfo?.nickname || '点击设置昵称' }}</text>
                    <text class="user-id">ID: {{ userInfo?.id || '---' }}</text>
                </view>
                <view class="edit-btn" @click="goToEdit">
                    <text class="edit-icon">⚙️</text>
                </view>
            </view>

            <view class="stats-row">
                <view class="stat-item" @click="goToPoints">
                    <text class="stat-value">{{ userInfo?.points || 0 }}</text>
                    <text class="stat-label">积分</text>
                </view>
                <view class="stat-item" @click="goToFollow">
                    <text class="stat-value">{{ userInfo?.followCount || 0 }}</text>
                    <text class="stat-label">关注</text>
                </view>
                <view class="stat-item" @click="goToFans">
                    <text class="stat-value">{{ userInfo?.fansCount || 0 }}</text>
                    <text class="stat-label">粉丝</text>
                </view>
                <view class="stat-item" @click="goToVisitors">
                    <text class="stat-value">{{ userInfo?.visitorCount || 0 }}</text>
                    <text class="stat-label">访客</text>
                </view>
            </view>
        </view>

        <view class="menu-section">
            <view class="menu-group">
                <view class="menu-item" @click="goToCreditTree">
                    <view class="menu-icon-wrapper green">
                        <text class="menu-icon">🌳</text>
                    </view>
                    <text class="menu-title">成长树</text>
                    <text class="menu-arrow">›</text>
                </view>

                <view class="menu-item" @click="goToCreditLevel">
                    <view class="menu-icon-wrapper gold">
                        <text class="menu-icon">🏆</text>
                    </view>
                    <text class="menu-title">会员等级</text>
                    <text class="menu-arrow">›</text>
                </view>

                <view class="menu-item" @click="goToPointsLog">
                    <view class="menu-icon-wrapper blue">
                        <text class="menu-icon">💰</text>
                    </view>
                    <text class="menu-title">积分明细</text>
                    <text class="menu-arrow">›</text>
                </view>
            </view>

            <view class="menu-group">
                <view class="menu-item" @click="goToMyPublish">
                    <view class="menu-icon-wrapper orange">
                        <text class="menu-icon">📦</text>
                    </view>
                    <text class="menu-title">我的发布</text>
                    <text class="menu-arrow">›</text>
                </view>

                <view class="menu-item" @click="goToMyFavorite">
                    <view class="menu-icon-wrapper red">
                        <text class="menu-icon">❤️</text>
                    </view>
                    <text class="menu-title">我的收藏</text>
                    <text class="menu-arrow">›</text>
                </view>

                <view class="menu-item" @click="goToStory">
                    <view class="menu-icon-wrapper purple">
                        <text class="menu-icon">📝</text>
                    </view>
                    <text class="menu-title">发布动态</text>
                    <text class="menu-arrow">›</text>
                </view>
            </view>

            <view class="menu-group">
                <view class="menu-item" @click="goToAddress">
                    <view class="menu-icon-wrapper cyan">
                        <text class="menu-icon">📍</text>
                    </view>
                    <text class="menu-title">收货地址</text>
                    <text class="menu-arrow">›</text>
                </view>

                <view class="menu-item" @click="goToRepair">
                    <view class="menu-icon-wrapper warning">
                        <text class="menu-icon">🔧</text>
                    </view>
                    <text class="menu-title">违约修复</text>
                    <view class="menu-badge" v-if="violationCount > 0">
                        <text class="badge-text">{{ violationCount }}</text>
                    </view>
                    <text class="menu-arrow">›</text>
                </view>

                <view class="menu-item" @click="goToSetting">
                    <view class="menu-icon-wrapper gray">
                        <text class="menu-icon">⚙️</text>
                    </view>
                    <text class="menu-title">设置</text>
                    <text class="menu-arrow">›</text>
                </view>
            </view>
        </view>

        <view class="logout-section">
            <button class="logout-btn" @click="handleLogout">退出登录</button>
        </view>
    </view>
</template>

<script>
import { useUserStore } from '@/store/user.js'
import http from '@/common/interceptor.js'

export default {
    data() {
        return {
            userStore: useUserStore(),
            violationCount: 0
        }
    },
    computed: {
        userInfo() {
            return this.userStore.userInfo
        }
    },
    onLoad() {
        this.loadUserInfo()
        this.loadViolationCount()
    },
    onShow() {
        this.loadUserInfo()
        this.loadViolationCount()
    },
    methods: {
        async loadUserInfo() {
            try {
                const res = await http.get('/api/user/info')
                this.userStore.setUserInfo(res)
            } catch (error) {
                console.error('Load user info failed:', error)
            }
        },

        async loadViolationCount() {
            try {
                const res = await http.get('/api/user/violation-count')
                this.violationCount = res.count || 0
            } catch (error) {
                console.error('Load violation count failed:', error)
                this.violationCount = 2
            }
        },

        goToEdit() {
            uni.navigateTo({ url: '/pages/profile_edit/profile_edit' })
        },

        goToPoints() {
            uni.navigateTo({ url: '/pages/points_log/points_log' })
        },

        goToPointsLog() {
            uni.navigateTo({ url: '/pages/points_log/points_log' })
        },

        goToCreditTree() {
            uni.showToast({ title: '成长树页面', icon: 'none' })
        },

        goToCreditLevel() {
            uni.showToast({ title: '会员等级页面', icon: 'none' })
        },

        goToFollow() {
            uni.showToast({ title: '关注列表', icon: 'none' })
        },

        goToFans() {
            uni.showToast({ title: '粉丝列表', icon: 'none' })
        },

        goToVisitors() {
            uni.navigateTo({ url: '/pages/visitors/visitors' })
        },

        goToMyPublish() {
            uni.navigateTo({ url: '/pages/my_publish/my_publish' })
        },

        goToMyFavorite() {
            uni.showToast({ title: '我的收藏', icon: 'none' })
        },

        goToStory() {
            uni.navigateTo({ url: '/pages/story_edit/story_edit' })
        },

        goToAddress() {
            uni.navigateTo({ url: '/pages/address_edit/address_edit' })
        },

        goToRepair() {
            uni.navigateTo({ url: '/pages/task/task' })
        },

        goToSetting() {
            uni.showToast({ title: '设置页面', icon: 'none' })
        },

        handleLogout() {
            uni.showModal({
                title: '提示',
                content: '确定要退出登录吗？',
                success: (res) => {
                    if (res.confirm) {
                        this.userStore.logout()
                        uni.reLaunch({ url: '/pages/login/login' })
                    }
                }
            })
        }
    }
}
</script>

<style lang="scss" scoped>
.profile-container {
    min-height: 100vh;
    background: #f5f5f5;
    padding-bottom: 40rpx;
}

.header-section {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 60rpx 30rpx 40rpx;
}

.user-info {
    display: flex;
    align-items: center;
    gap: 24rpx;
    margin-bottom: 40rpx;
}

.avatar-wrapper {
    width: 140rpx;
    height: 140rpx;
    border-radius: 50%;
    overflow: hidden;
    border: 4rpx solid rgba(255, 255, 255, 0.5);
    flex-shrink: 0;
}

.avatar {
    width: 100%;
    height: 100%;
}

.avatar-placeholder {
    width: 100%;
    height: 100%;
    background: rgba(255, 255, 255, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
}

.avatar-icon {
    font-size: 60rpx;
}

.user-detail {
    flex: 1;
}

.nickname {
    display: block;
    font-size: 36rpx;
    font-weight: bold;
    color: #fff;
    margin-bottom: 12rpx;
}

.user-id {
    display: block;
    font-size: 24rpx;
    color: rgba(255, 255, 255, 0.8);
}

.edit-btn {
    width: 60rpx;
    height: 60rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
}

.edit-icon {
    font-size: 30rpx;
}

.stats-row {
    display: flex;
    background: rgba(255, 255, 255, 0.15);
    border-radius: 20rpx;
    padding: 30rpx 0;
}

.stat-item {
    flex: 1;
    text-align: center;
    border-right: 1rpx solid rgba(255, 255, 255, 0.2);

    &:last-child {
        border-right: none;
    }
}

.stat-value {
    display: block;
    font-size: 36rpx;
    font-weight: bold;
    color: #fff;
    margin-bottom: 8rpx;
}

.stat-label {
    display: block;
    font-size: 24rpx;
    color: rgba(255, 255, 255, 0.8);
}

.menu-section {
    padding: 30rpx;
    display: flex;
    flex-direction: column;
    gap: 20rpx;
}

.menu-group {
    background: #fff;
    border-radius: 20rpx;
    overflow: hidden;
}

.menu-item {
    display: flex;
    align-items: center;
    gap: 20rpx;
    padding: 30rpx;
    border-bottom: 1rpx solid #f5f5f5;
    position: relative;

    &:last-child {
        border-bottom: none;
    }
}

.menu-icon-wrapper {
    width: 64rpx;
    height: 64rpx;
    border-radius: 16rpx;
    display: flex;
    align-items: center;
    justify-content: center;

    &.green { background: rgba(7, 193, 96, 0.1); }
    &.gold { background: rgba(255, 215, 0, 0.15); }
    &.blue { background: rgba(0, 122, 255, 0.1); }
    &.orange { background: rgba(255, 149, 0, 0.1); }
    &.red { background: rgba(255, 59, 48, 0.1); }
    &.purple { background: rgba(175, 82, 222, 0.1); }
    &.cyan { background: rgba(0, 199, 190, 0.1); }
    &.warning { background: rgba(255, 149, 0, 0.15); }
    &.gray { background: rgba(142, 142, 147, 0.1); }
}

.menu-icon {
    font-size: 36rpx;
}

.menu-title {
    flex: 1;
    font-size: 30rpx;
    color: #333;
}

.menu-badge {
    min-width: 36rpx;
    height: 36rpx;
    background: #ff3b30;
    border-radius: 18rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 10rpx;
    margin-right: 10rpx;
}

.badge-text {
    font-size: 20rpx;
    color: #fff;
    font-weight: bold;
}

.menu-arrow {
    font-size: 36rpx;
    color: #ccc;
}

.logout-section {
    padding: 30rpx;
    padding-top: 10rpx;
}

.logout-btn {
    width: 100%;
    height: 88rpx;
    background: #fff;
    color: #ff3b30;
    border-radius: 44rpx;
    font-size: 30rpx;
    font-weight: 500;
    border: none;
}
</style>
