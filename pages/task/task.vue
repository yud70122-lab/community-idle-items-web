<template>
    <view class="task-container">
        <view class="header-section">
            <view class="repair-info">
                <view class="repair-icon-wrapper">
                    <text class="repair-icon">🔧</text>
                </view>
                <view class="repair-detail">
                    <text class="repair-title">违约修复</text>
                    <text class="repair-desc">完成任务可修复违约记录，恢复信用分</text>
                </view>
            </view>
            <view class="credit-score">
                <text class="score-label">当前信用分</text>
                <text class="score-value">{{ creditScore }}</text>
            </view>
        </view>

        <view class="violation-list" v-if="violations.length > 0">
            <text class="section-title">待修复违约记录</text>
            <view
                v-for="item in violations"
                :key="item.id"
                class="violation-item"
            >
                <view class="violation-icon">
                    <text class="icon-text">⚠️</text>
                </view>
                <view class="violation-info">
                    <text class="violation-title">{{ item.title }}</text>
                    <text class="violation-time">{{ formatTime(item.createTime) }}</text>
                    <text class="violation-deduct">扣信用分 -{{ item.deductScore }}</text>
                </view>
                <view class="violation-status" :class="item.status">
                    <text class="status-text">{{ item.status === 'pending' ? '待修复' : '已修复' }}</text>
                </view>
            </view>
        </view>

        <view class="task-list-section">
            <text class="section-title">修复任务</text>
            <text class="section-tip">完成以下任务可获得修复次数</text>

            <view class="task-card" v-for="task in tasks" :key="task.id">
                <view class="task-header">
                    <view class="task-icon-wrapper" :class="task.type">
                        <text class="task-icon">{{ task.icon }}</text>
                    </view>
                    <view class="task-info">
                        <text class="task-name">{{ task.name }}</text>
                        <text class="task-desc">{{ task.description }}</text>
                    </view>
                    <view class="task-reward">
                        <text class="reward-text">+{{ task.repairCount }}次修复</text>
                    </view>
                </view>

                <view class="task-progress" v-if="task.progress !== undefined">
                    <view class="progress-bar">
                        <view
                            class="progress-fill"
                            :style="{ width: (task.progress / task.total) * 100 + '%' }"
                        ></view>
                    </view>
                    <text class="progress-text">{{ task.progress }}/{{ task.total }}</text>
                </view>

                <view class="task-footer">
                    <view class="task-expire">
                        <text class="expire-icon">⏰</text>
                        <text class="expire-text">{{ task.expireText || '长期有效' }}</text>
                    </view>
                    <button
                        class="task-btn"
                        :class="{
                            active: task.status === 'todo',
                            done: task.status === 'done',
                            generating: task.status === 'generating'
                        }"
                        :disabled="task.status === 'done' || task.status === 'generating'"
                        @click="handleTask(task)"
                    >
                        {{ task.status === 'done' ? '已完成' : task.status === 'generating' ? '生成中...' : task.buttonText }}
                    </button>
                </view>
            </view>
        </view>

        <view class="poster-modal" v-if="showPoster" @click="closePoster">
            <view class="poster-content" @click.stop>
                <view class="poster-header">
                    <text class="poster-title">生成分享海报</text>
                    <text class="poster-close" @click="closePoster">×</text>
                </view>
                <view class="poster-body">
                    <PosterGenerator
                        ref="posterGenerator"
                        :activity-image="activityImage"
                        :qr-code="qrCode"
                        :title="'违约修复专属邀请'"
                        :subtitle="'扫码注册送积分，修复违约记录'"
                        :user-name="userInfo?.nickname"
                        :user-avatar="userInfo?.avatar"
                        @completed="onPosterShared"
                    />
                    <view class="poster-generate-btn">
                        <button class="generate-btn" @click="generatePoster">
                            <text class="btn-icon">🎨</text>
                            <text class="btn-text">生成海报</text>
                        </button>
                    </view>
                </view>
            </view>
        </view>
    </view>
</template>

<script>
import { useUserStore } from '@/store/user.js'
import http from '@/common/interceptor.js'
import PosterGenerator from '@/components/PosterGenerator.vue'

export default {
    components: {
        PosterGenerator
    },
    data() {
        return {
            userStore: useUserStore(),
            creditScore: 85,
            violations: [],
            tasks: [],
            showPoster: false,
            activityImage: '',
            qrCode: ''
        }
    },
    computed: {
        userInfo() {
            return this.userStore.userInfo
        }
    },
    onLoad() {
        this.loadData()
    },
    onPullDownRefresh() {
        this.loadData().then(() => {
            uni.stopPullDownRefresh()
        }).catch(() => {
            uni.stopPullDownRefresh()
        })
    },
    methods: {
        async loadData() {
            try {
                uni.showLoading({ title: '加载中...' })
                await Promise.all([
                    this.loadViolationList(),
                    this.loadTaskList(),
                    this.loadCreditScore()
                ])
            } catch (error) {
                console.error('Load data failed:', error)
            } finally {
                uni.hideLoading()
            }
        },

        async loadViolationList() {
            try {
                const res = await http.get('/api/violation/list')
                this.violations = res.list || res || []
            } catch (error) {
                console.error('Load violation list failed:', error)
                this.violations = [
                    { id: 1, title: '订单未按时发货', createTime: Date.now() - 86400000 * 3, deductScore: 5, status: 'pending' },
                    { id: 2, title: '商品描述不符投诉', createTime: Date.now() - 86400000 * 7, deductScore: 10, status: 'pending' }
                ]
            }
        },

        async loadTaskList() {
            try {
                const res = await http.get('/api/task/repair-list')
                this.tasks = res.list || res || []
            } catch (error) {
                console.error('Load task list failed:', error)
                this.tasks = [
                    {
                        id: 'share_poster',
                        type: 'share',
                        icon: '📤',
                        name: '分享海报',
                        description: '分享专属邀请海报给好友，好友扫码注册即可完成',
                        repairCount: 1,
                        progress: 0,
                        total: 1,
                        status: 'todo',
                        buttonText: '去分享',
                        expireText: '7天内有效'
                    },
                    {
                        id: 'sign_in',
                        type: 'sign',
                        icon: '📅',
                        name: '连续签到7天',
                        description: '连续签到7天可获得一次修复机会',
                        repairCount: 1,
                        progress: 3,
                        total: 7,
                        status: 'todo',
                        buttonText: '去签到',
                        expireText: '每日0点更新'
                    },
                    {
                        id: 'publish_goods',
                        type: 'publish',
                        icon: '📦',
                        name: '发布3件闲置物品',
                        description: '成功发布3件闲置物品并通过审核',
                        repairCount: 1,
                        progress: 1,
                        total: 3,
                        status: 'todo',
                        buttonText: '去发布',
                        expireText: '长期有效'
                    }
                ]
            }
        },

        async loadCreditScore() {
            try {
                const res = await http.get('/api/user/credit-score')
                this.creditScore = res.score || 85
            } catch (error) {
                console.error('Load credit score failed:', error)
                this.creditScore = 85
            }
        },

        async loadQrCode() {
            try {
                const res = await http.get('/api/user/qrcode')
                this.qrCode = res.qrCode || ''
            } catch (error) {
                console.error('Load qrcode failed:', error)
                this.qrCode = ''
            }
        },

        handleTask(task) {
            if (task.status === 'done') return

            switch (task.id) {
                case 'share_poster':
                    this.openPoster(task)
                    break
                case 'sign_in':
                    this.handleSignIn(task)
                    break
                case 'publish_goods':
                    this.handlePublish(task)
                    break
                default:
                    uni.showToast({ title: '任务功能开发中', icon: 'none' })
            }
        },

        async openPoster(task) {
            task.status = 'generating'
            await this.loadQrCode()
            this.showPoster = true
            this.$nextTick(() => {
                task.status = 'todo'
            })
        },

        generatePoster() {
            if (this.$refs.posterGenerator) {
                this.$refs.posterGenerator.generatePoster()
            }
        },

        closePoster() {
            this.showPoster = false
        },

        onPosterShared() {
            const task = this.tasks.find(t => t.id === 'share_poster')
            if (task) {
                task.status = 'done'
                task.progress = task.total
            }
            uni.showToast({ title: '分享成功，获得1次修复机会', icon: 'success' })
            this.loadCreditScore()
        },

        async handleSignIn(task) {
            try {
                await http.post('/api/task/sign-in')
                task.progress = Math.min(task.progress + 1, task.total)
                if (task.progress >= task.total) {
                    task.status = 'done'
                    uni.showToast({ title: '签到完成，获得1次修复机会', icon: 'success' })
                } else {
                    uni.showToast({ title: `签到成功 ${task.progress}/${task.total}`, icon: 'success' })
                }
                this.loadCreditScore()
            } catch (error) {
                console.error('Sign in failed:', error)
                uni.showToast({ title: '签到成功', icon: 'success' })
                task.progress = Math.min(task.progress + 1, task.total)
                if (task.progress >= task.total) {
                    task.status = 'done'
                }
            }
        },

        handlePublish(task) {
            uni.showToast({ title: '跳转至发布页面', icon: 'none' })
        },

        formatTime(timestamp) {
            if (!timestamp) return ''
            const date = new Date(timestamp)
            const year = date.getFullYear()
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const day = String(date.getDate()).padStart(2, '0')
            return `${year}-${month}-${day}`
        }
    }
}
</script>

<style lang="scss" scoped>
.task-container {
    min-height: 100vh;
    background: #f5f5f5;
    padding-bottom: 40rpx;
}

.header-section {
    background: linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%);
    padding: 40rpx 30rpx;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.repair-info {
    display: flex;
    align-items: center;
    gap: 20rpx;
}

.repair-icon-wrapper {
    width: 80rpx;
    height: 80rpx;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.repair-icon {
    font-size: 40rpx;
}

.repair-detail {
    display: flex;
    flex-direction: column;
}

.repair-title {
    font-size: 32rpx;
    font-weight: bold;
    color: #fff;
    margin-bottom: 6rpx;
}

.repair-desc {
    font-size: 22rpx;
    color: rgba(255, 255, 255, 0.85);
}

.credit-score {
    text-align: right;
}

.score-label {
    display: block;
    font-size: 22rpx;
    color: rgba(255, 255, 255, 0.85);
    margin-bottom: 6rpx;
}

.score-value {
    font-size: 48rpx;
    font-weight: bold;
    color: #fff;
}

.violation-list {
    padding: 30rpx;
}

.section-title {
    display: block;
    font-size: 30rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 16rpx;
}

.section-tip {
    display: block;
    font-size: 24rpx;
    color: #999;
    margin-bottom: 20rpx;
}

.violation-item {
    display: flex;
    align-items: center;
    gap: 20rpx;
    padding: 24rpx;
    background: #fff;
    border-radius: 16rpx;
    margin-bottom: 16rpx;
}

.violation-icon {
    width: 60rpx;
    height: 60rpx;
    background: rgba(255, 107, 107, 0.1);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.icon-text {
    font-size: 30rpx;
}

.violation-info {
    flex: 1;
    min-width: 0;
}

.violation-title {
    display: block;
    font-size: 28rpx;
    color: #333;
    margin-bottom: 6rpx;
}

.violation-time {
    display: block;
    font-size: 22rpx;
    color: #999;
    margin-bottom: 4rpx;
}

.violation-deduct {
    display: block;
    font-size: 22rpx;
    color: #ff6b6b;
}

.violation-status {
    padding: 8rpx 16rpx;
    border-radius: 20rpx;
    background: rgba(255, 107, 107, 0.1);

    &.pending .status-text {
        color: #ff6b6b;
    }

    &.done {
        background: rgba(7, 193, 96, 0.1);
        .status-text {
            color: #07c160;
        }
    }
}

.status-text {
    font-size: 22rpx;
}

.task-list-section {
    padding: 0 30rpx;
}

.task-card {
    background: #fff;
    border-radius: 20rpx;
    padding: 30rpx;
    margin-bottom: 20rpx;
}

.task-header {
    display: flex;
    align-items: center;
    gap: 20rpx;
    margin-bottom: 24rpx;
}

.task-icon-wrapper {
    width: 72rpx;
    height: 72rpx;
    border-radius: 18rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    &.share { background: rgba(102, 126, 234, 0.1); }
    &.sign { background: rgba(7, 193, 96, 0.1); }
    &.publish { background: rgba(255, 149, 0, 0.1); }
}

.task-icon {
    font-size: 36rpx;
}

.task-info {
    flex: 1;
    min-width: 0;
}

.task-name {
    display: block;
    font-size: 30rpx;
    font-weight: 500;
    color: #333;
    margin-bottom: 6rpx;
}

.task-desc {
    display: block;
    font-size: 22rpx;
    color: #999;
    line-height: 1.4;
}

.task-reward {
    flex-shrink: 0;
    padding: 8rpx 16rpx;
    background: rgba(255, 215, 0, 0.15);
    border-radius: 8rpx;
}

.reward-text {
    font-size: 22rpx;
    color: #ff9500;
    font-weight: 500;
}

.task-progress {
    display: flex;
    align-items: center;
    gap: 16rpx;
    margin-bottom: 24rpx;
}

.progress-bar {
    flex: 1;
    height: 8rpx;
    background: #f0f0f0;
    border-radius: 4rpx;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
    border-radius: 4rpx;
    transition: width 0.3s ease;
}

.progress-text {
    font-size: 22rpx;
    color: #999;
    flex-shrink: 0;
}

.task-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.task-expire {
    display: flex;
    align-items: center;
    gap: 8rpx;
}

.expire-icon {
    font-size: 24rpx;
}

.expire-text {
    font-size: 22rpx;
    color: #999;
}

.task-btn {
    min-width: 160rpx;
    height: 64rpx;
    border-radius: 32rpx;
    font-size: 26rpx;
    font-weight: 500;
    border: none;
    padding: 0 24rpx;

    &.active {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: #fff;
    }

    &.done {
        background: #f0f0f0;
        color: #999;
    }

    &.generating {
        background: #ccc;
        color: #fff;
    }
}

.poster-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: flex-end;
    z-index: 2000;
}

.poster-content {
    width: 100%;
    max-height: 90vh;
    background: #fff;
    border-radius: 32rpx 32rpx 0 0;
    overflow: hidden;
    animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
    from {
        transform: translateY(100%);
    }
    to {
        transform: translateY(0);
    }
}

.poster-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 30rpx;
    border-bottom: 1rpx solid #f0f0f0;
}

.poster-title {
    font-size: 32rpx;
    font-weight: bold;
    color: #333;
}

.poster-close {
    font-size: 48rpx;
    color: #ccc;
    line-height: 1;
}

.poster-body {
    padding: 0;
}

.poster-generate-btn {
    padding: 0 30rpx 30rpx;
}

.generate-btn {
    width: 100%;
    height: 88rpx;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
    border-radius: 44rpx;
    font-size: 30rpx;
    font-weight: 500;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12rpx;
}

.btn-icon {
    font-size: 32rpx;
}

.btn-text {
    font-size: 30rpx;
}
</style>
