<template>
    <view class="panorama-viewer" v-if="visible" @touchmove.stop.prevent>
        <view class="viewer-container">
            <view class="viewer-header">
                <text class="viewer-title">360°全景查看</text>
                <view class="close-btn" @click="closeViewer">
                    <text class="close-icon">×</text>
                </view>
            </view>
            
            <view 
                class="panorama-stage"
                @touchstart="onTouchStart"
                @touchmove="onTouchMove"
                @touchend="onTouchEnd"
            >
                <image 
                    class="panorama-image"
                    :src="imageUrl"
                    mode="aspectFill"
                    :style="imageStyle"
                />
                <view class="direction-indicator">
                    <text class="direction-text">{{ directionText }}</text>
                </view>
            </view>
            
            <view class="viewer-footer">
                <view class="hint-text">
                    <text class="hint-icon">👆</text>
                    <text class="hint-label">左右滑动旋转视角</text>
                </view>
                <view class="rotation-control">
                    <view class="control-btn" @click="rotateLeft">
                        <text class="control-icon">◀</text>
                    </view>
                    <view class="auto-rotate-btn" :class="{ active: autoRotate }" @click="toggleAutoRotate">
                        <text class="control-text">{{ autoRotate ? '暂停' : '自动' }}</text>
                    </view>
                    <view class="control-btn" @click="rotateRight">
                        <text class="control-icon">▶</text>
                    </view>
                </view>
            </view>
        </view>
    </view>
</template>

<script>
export default {
    name: 'PanoramaViewer',
    props: {
        visible: {
            type: Boolean,
            default: false
        },
        imageUrl: {
            type: String,
            default: ''
        },
        images: {
            type: Array,
            default: () => []
        }
    },
    data() {
        return {
            currentAngle: 0,
            touchStartX: 0,
            touchStartAngle: 0,
            isDragging: false,
            autoRotate: false,
            autoRotateTimer: null
        }
    },
    computed: {
        imageStyle() {
            return {
                transform: `translateX(${this.currentAngle % 360}%)`
            }
        },
        directionText() {
            const normalizedAngle = ((this.currentAngle % 360) + 360) % 360
            if (normalizedAngle >= 315 || normalizedAngle < 45) return '北'
            if (normalizedAngle >= 45 && normalizedAngle < 135) return '东'
            if (normalizedAngle >= 135 && normalizedAngle < 225) return '南'
            if (normalizedAngle >= 225 && normalizedAngle < 315) return '西'
            return ''
        }
    },
    watch: {
        visible(val) {
            if (val) {
                this.currentAngle = 0
                this.startAutoRotate()
            } else {
                this.stopAutoRotate()
            }
        },
        autoRotate(val) {
            if (val) {
                this.startAutoRotate()
            } else {
                this.stopAutoRotate()
            }
        }
    },
    methods: {
        onTouchStart(e) {
            this.isDragging = true
            this.touchStartX = e.touches[0].clientX
            this.touchStartAngle = this.currentAngle
            this.stopAutoRotate()
        },
        onTouchMove(e) {
            if (!this.isDragging) return
            const deltaX = e.touches[0].clientX - this.touchStartX
            const sensitivity = 0.8
            this.currentAngle = this.touchStartAngle + deltaX * sensitivity
        },
        onTouchEnd() {
            this.isDragging = false
            if (this.autoRotate) {
                this.startAutoRotate()
            }
        },
        rotateLeft() {
            this.stopAutoRotate()
            this.currentAngle -= 90
            if (this.autoRotate) {
                this.startAutoRotate()
            }
        },
        rotateRight() {
            this.stopAutoRotate()
            this.currentAngle += 90
            if (this.autoRotate) {
                this.startAutoRotate()
            }
        },
        toggleAutoRotate() {
            this.autoRotate = !this.autoRotate
        },
        startAutoRotate() {
            this.stopAutoRotate()
            this.autoRotateTimer = setInterval(() => {
                if (!this.isDragging) {
                    this.currentAngle += 0.5
                }
            }, 50)
        },
        stopAutoRotate() {
            if (this.autoRotateTimer) {
                clearInterval(this.autoRotateTimer)
                this.autoRotateTimer = null
            }
        },
        closeViewer() {
            this.$emit('close')
        }
    },
    beforeUnmount() {
        this.stopAutoRotate()
    }
}
</script>

<style lang="scss" scoped>
.panorama-viewer {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: #000;
    z-index: 9999;
    display: flex;
    flex-direction: column;
}

.viewer-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    height: 100%;
}

.viewer-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 60rpx 30rpx 20rpx;
    background: rgba(0, 0, 0, 0.5);
}

.viewer-title {
    font-size: 32rpx;
    font-weight: 600;
    color: #fff;
}

.close-btn {
    width: 60rpx;
    height: 60rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
}

.close-icon {
    font-size: 40rpx;
    color: #fff;
    line-height: 1;
}

.panorama-stage {
    flex: 1;
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
}

.panorama-image {
    position: absolute;
    top: 0;
    left: -100%;
    width: 300%;
    height: 100%;
    transition: transform 0.05s linear;
    will-change: transform;
}

.direction-indicator {
    position: absolute;
    top: 30rpx;
    right: 30rpx;
    padding: 12rpx 24rpx;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 8rpx;
}

.direction-text {
    font-size: 24rpx;
    color: #fff;
    font-weight: 600;
}

.viewer-footer {
    padding: 30rpx;
    padding-bottom: calc(30rpx + env(safe-area-inset-bottom));
    background: rgba(0, 0, 0, 0.5);
}

.hint-text {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8rpx;
    margin-bottom: 24rpx;
}

.hint-icon {
    font-size: 28rpx;
}

.hint-label {
    font-size: 24rpx;
    color: rgba(255, 255, 255, 0.7);
}

.rotation-control {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 40rpx;
}

.control-btn {
    width: 80rpx;
    height: 80rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
}

.control-icon {
    font-size: 28rpx;
    color: #fff;
}

.auto-rotate-btn {
    padding: 16rpx 40rpx;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 40rpx;
    transition: all 0.3s;

    &.active {
        background: #667eea;
    }
}

.control-text {
    font-size: 26rpx;
    color: #fff;
    font-weight: 500;
}
</style>
