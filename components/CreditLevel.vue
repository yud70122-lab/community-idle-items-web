<template>
    <view class="credit-level-container">
        <view class="level-section">
            <view class="current-level-card" :class="currentLevelKey">
                <view class="level-icon-wrapper">
                    <text class="level-icon">{{ currentLevel.icon }}</text>
                    <view class="level-glow"></view>
                </view>
                <view class="level-info">
                    <text class="level-name">{{ currentLevel.name }}</text>
                    <text class="level-points">当前积分：{{ currentPoints }}</text>
                    <view class="progress-bar">
                        <view
                            class="progress-fill"
                            :style="{ width: progressPercent + '%' }"
                        ></view>
                    </view>
                    <text class="next-level-tip" v-if="nextLevel">
                        距离{{ nextLevel.name }}还需 {{ nextLevel.minPoints - currentPoints }} 积分
                    </text>
                    <text class="next-level-tip" v-else>
                        恭喜您已达到最高等级！
                    </text>
                </view>
            </view>
        </view>

        <view class="level-list">
            <text class="section-title">等级权益一览</text>
            <view class="level-items">
                <view
                    v-for="(level, key) in levelConfig"
                    :key="key"
                    class="level-item"
                    :class="{
                        active: key === currentLevelKey,
                        unlocked: currentPoints >= level.minPoints
                    }"
                    @click="showLevelDetail(level, key)"
                >
                    <view class="item-icon-wrapper">
                        <text class="item-icon">{{ level.icon }}</text>
                    </view>
                    <view class="item-info">
                        <text class="item-name">{{ level.name }}</text>
                        <text class="item-range">{{ level.minPoints }} - {{ level.maxPoints || '∞' }} 积分</text>
                    </view>
                    <text class="item-arrow">›</text>
                </view>
            </view>
        </view>

        <view class="modal-mask" v-if="showModal" @click="closeModal">
            <view class="modal-content" @click.stop>
                <view class="modal-header" :class="selectedLevelKey">
                    <text class="modal-icon">{{ selectedLevel?.icon }}</text>
                    <text class="modal-title">{{ selectedLevel?.name }}</text>
                    <text class="modal-close" @click="closeModal">×</text>
                </view>
                <view class="modal-body">
                    <view class="level-range-info">
                        <text class="range-label">积分区间：</text>
                        <text class="range-value">
                            {{ selectedLevel?.minPoints }} - {{ selectedLevel?.maxPoints || '∞' }} 积分
                        </text>
                    </view>
                    <view class="level-benefits">
                        <text class="benefits-title">专属权益</text>
                        <view class="benefits-grid">
                            <view
                                v-for="(benefit, index) in selectedLevel?.benefits"
                                :key="index"
                                class="benefit-card"
                            >
                                <text class="benefit-icon">{{ benefit.icon }}</text>
                                <text class="benefit-name">{{ benefit.name }}</text>
                                <text class="benefit-desc">{{ benefit.desc }}</text>
                            </view>
                        </view>
                    </view>
                    <view class="unlock-status" :class="{ unlocked: isLevelUnlocked }">
                        <text class="status-text">
                            {{ isLevelUnlocked ? '✓ 已解锁该等级权益' : '🔒 继续努力升级解锁' }}
                        </text>
                    </view>
                </view>
            </view>
        </view>
    </view>
</template>

<script>
export default {
    props: {
        points: {
            type: Number,
            default: 0
        }
    },
    data() {
        return {
            showModal: false,
            selectedLevel: null,
            selectedLevelKey: '',
            levelConfig: {
                bronze: {
                    name: '青铜',
                    icon: '🥉',
                    minPoints: 0,
                    maxPoints: 99,
                    color: '#CD7F32',
                    benefits: [
                        { icon: '🎁', name: '新人礼包', desc: '注册即送100积分' },
                        { icon: '📝', name: '基础发布', desc: '每天可发布3件商品' },
                        { icon: '💬', name: '社区交流', desc: '参与社区讨论互动' }
                    ]
                },
                silver: {
                    name: '白银',
                    icon: '🥈',
                    minPoints: 100,
                    maxPoints: 499,
                    color: '#C0C0C0',
                    benefits: [
                        { icon: '🎁', name: '新人礼包', desc: '注册即送100积分' },
                        { icon: '📝', name: '基础发布', desc: '每天可发布3件商品' },
                        { icon: '💬', name: '社区交流', desc: '参与社区讨论互动' },
                        { icon: '⭐', name: '双倍签到', desc: '每日签到获得双倍积分' },
                        { icon: '📈', name: '发布+5', desc: '每日发布上限+5' }
                    ]
                },
                gold: {
                    name: '黄金',
                    icon: '🥇',
                    minPoints: 500,
                    maxPoints: 1999,
                    color: '#FFD700',
                    benefits: [
                        { icon: '🎁', name: '新人礼包', desc: '注册即送100积分' },
                        { icon: '📝', name: '基础发布', desc: '每天可发布3件商品' },
                        { icon: '💬', name: '社区交流', desc: '参与社区讨论互动' },
                        { icon: '⭐', name: '双倍签到', desc: '每日签到获得双倍积分' },
                        { icon: '📈', name: '发布+5', desc: '每日发布上限+5' },
                        { icon: '🎯', name: '置顶优惠', desc: '商品置顶8折优惠' },
                        { icon: '👨‍💼', name: '专属客服', desc: '优先客服通道' }
                    ]
                },
                diamond: {
                    name: '钻石',
                    icon: '💎',
                    minPoints: 2000,
                    maxPoints: null,
                    color: '#00CED1',
                    benefits: [
                        { icon: '🎁', name: '新人礼包', desc: '注册即送100积分' },
                        { icon: '📝', name: '基础发布', desc: '每天可发布3件商品' },
                        { icon: '💬', name: '社区交流', desc: '参与社区讨论互动' },
                        { icon: '⭐', name: '双倍签到', desc: '每日签到获得双倍积分' },
                        { icon: '📈', name: '发布+5', desc: '每日发布上限+5' },
                        { icon: '🎯', name: '置顶优惠', desc: '商品置顶8折优惠' },
                        { icon: '👨‍💼', name: '专属客服', desc: '优先客服通道' },
                        { icon: '💸', name: '免手续费', desc: '交易免手续费' },
                        { icon: '🏷️', name: '身份标识', desc: '专属钻石身份标识' },
                        { icon: '🎊', name: '年度礼品', desc: '专属定制年度礼品' }
                    ]
                }
            }
        }
    },
    computed: {
        currentPoints() {
            return this.points
        },
        currentLevelKey() {
            const points = this.currentPoints
            if (points >= 2000) return 'diamond'
            if (points >= 500) return 'gold'
            if (points >= 100) return 'silver'
            return 'bronze'
        },
        currentLevel() {
            return this.levelConfig[this.currentLevelKey]
        },
        nextLevel() {
            const order = ['bronze', 'silver', 'gold', 'diamond']
            const currentIndex = order.indexOf(this.currentLevelKey)
            if (currentIndex < order.length - 1) {
                return this.levelConfig[order[currentIndex + 1]]
            }
            return null
        },
        progressPercent() {
            if (!this.nextLevel) return 100
            const current = this.currentPoints - this.currentLevel.minPoints
            const total = this.nextLevel.minPoints - this.currentLevel.minPoints
            return Math.min(100, Math.max(0, (current / total) * 100))
        },
        isLevelUnlocked() {
            if (!this.selectedLevel) return false
            return this.currentPoints >= this.selectedLevel.minPoints
        }
    },
    methods: {
        showLevelDetail(level, key) {
            this.selectedLevel = level
            this.selectedLevelKey = key
            this.showModal = true
        },
        closeModal() {
            this.showModal = false
            this.selectedLevel = null
            this.selectedLevelKey = ''
        }
    }
}
</script>

<style lang="scss" scoped>
.credit-level-container {
    min-height: 100vh;
    background: #f5f5f5;
    padding: 30rpx;
}

.level-section {
    margin-bottom: 30rpx;
}

.current-level-card {
    display: flex;
    align-items: center;
    gap: 30rpx;
    padding: 40rpx;
    border-radius: 24rpx;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    position: relative;
    overflow: hidden;

    &.bronze {
        background: linear-gradient(135deg, #CD7F32 0%, #8B4513 100%);
    }

    &.silver {
        background: linear-gradient(135deg, #C0C0C0 0%, #808080 100%);
    }

    &.gold {
        background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
    }

    &.diamond {
        background: linear-gradient(135deg, #00CED1 0%, #1E90FF 100%);
    }
}

.level-icon-wrapper {
    position: relative;
    width: 120rpx;
    height: 120rpx;
    display: flex;
    align-items: center;
    justify-content: center;
}

.level-icon {
    font-size: 80rpx;
    position: relative;
    z-index: 2;
}

.level-glow {
    position: absolute;
    width: 100%;
    height: 100%;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    animation: glow 2s ease-in-out infinite;
}

@keyframes glow {
    0%, 100% { transform: scale(1); opacity: 0.5; }
    50% { transform: scale(1.2); opacity: 0.8; }
}

.level-info {
    flex: 1;
}

.level-name {
    display: block;
    font-size: 36rpx;
    font-weight: bold;
    color: #fff;
    margin-bottom: 8rpx;
}

.level-points {
    display: block;
    font-size: 24rpx;
    color: rgba(255, 255, 255, 0.9);
    margin-bottom: 16rpx;
}

.progress-bar {
    width: 100%;
    height: 12rpx;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 6rpx;
    overflow: hidden;
    margin-bottom: 12rpx;
}

.progress-fill {
    height: 100%;
    background: #fff;
    border-radius: 6rpx;
    transition: width 0.5s ease;
}

.next-level-tip {
    display: block;
    font-size: 22rpx;
    color: rgba(255, 255, 255, 0.8);
}

.level-list {
    background: #fff;
    border-radius: 20rpx;
    padding: 30rpx;
}

.section-title {
    display: block;
    font-size: 30rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 24rpx;
}

.level-items {
    display: flex;
    flex-direction: column;
    gap: 20rpx;
}

.level-item {
    display: flex;
    align-items: center;
    gap: 20rpx;
    padding: 24rpx;
    background: #f9f9f9;
    border-radius: 16rpx;
    border: 2rpx solid transparent;
    transition: all 0.3s;

    &.unlocked {
        background: rgba(255, 215, 0, 0.05);
    }

    &.active {
        border-color: #667eea;
        background: rgba(102, 126, 234, 0.05);
    }
}

.item-icon-wrapper {
    width: 80rpx;
    height: 80rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fff;
    border-radius: 50%;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
}

.item-icon {
    font-size: 48rpx;
}

.item-info {
    flex: 1;
}

.item-name {
    display: block;
    font-size: 28rpx;
    font-weight: 500;
    color: #333;
    margin-bottom: 6rpx;
}

.item-range {
    display: block;
    font-size: 22rpx;
    color: #999;
}

.item-arrow {
    font-size: 36rpx;
    color: #ccc;
}

.modal-mask {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.modal-content {
    width: 650rpx;
    max-height: 80vh;
    background: #fff;
    border-radius: 24rpx;
    overflow: hidden;
    animation: modalIn 0.3s ease-out;
}

@keyframes modalIn {
    from {
        opacity: 0;
        transform: scale(0.8) translateY(50rpx);
    }
    to {
        opacity: 1;
        transform: scale(1) translateY(0);
    }
}

.modal-header {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40rpx 30rpx;
    position: relative;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

    &.bronze {
        background: linear-gradient(135deg, #CD7F32 0%, #8B4513 100%);
    }

    &.silver {
        background: linear-gradient(135deg, #C0C0C0 0%, #808080 100%);
    }

    &.gold {
        background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
    }

    &.diamond {
        background: linear-gradient(135deg, #00CED1 0%, #1E90FF 100%);
    }
}

.modal-icon {
    font-size: 80rpx;
    margin-right: 20rpx;
}

.modal-title {
    font-size: 36rpx;
    font-weight: bold;
    color: #fff;
}

.modal-close {
    position: absolute;
    top: 30rpx;
    right: 30rpx;
    font-size: 48rpx;
    color: rgba(255, 255, 255, 0.8);
    line-height: 1;
}

.modal-body {
    padding: 30rpx;
    max-height: 60vh;
    overflow-y: auto;
}

.level-range-info {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20rpx;
    background: #f5f5f5;
    border-radius: 12rpx;
    margin-bottom: 30rpx;
}

.range-label {
    font-size: 26rpx;
    color: #666;
}

.range-value {
    font-size: 26rpx;
    color: #333;
    font-weight: 500;
}

.level-benefits {
    margin-bottom: 30rpx;
}

.benefits-title {
    display: block;
    font-size: 28rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 20rpx;
}

.benefits-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20rpx;
}

.benefit-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20rpx;
    background: #f9f9f9;
    border-radius: 12rpx;
    text-align: center;
}

.benefit-icon {
    font-size: 40rpx;
    margin-bottom: 10rpx;
}

.benefit-name {
    font-size: 22rpx;
    font-weight: 500;
    color: #333;
    margin-bottom: 6rpx;
}

.benefit-desc {
    font-size: 20rpx;
    color: #999;
    line-height: 1.4;
}

.unlock-status {
    padding: 24rpx;
    background: #f5f5f5;
    border-radius: 12rpx;
    text-align: center;

    &.unlocked {
        background: rgba(7, 193, 96, 0.1);
    }
}

.status-text {
    font-size: 26rpx;
    color: #666;

    .unlocked & {
        color: #07c160;
        font-weight: 500;
    }
}
</style>
