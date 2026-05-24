<template>
    <view class="poster-generator">
        <view class="poster-preview">
            <canvas
                class="poster-canvas"
                canvas-id="posterCanvas"
                id="posterCanvas"
                :style="{ width: canvasWidth + 'px', height: canvasHeight + 'px' }"
            ></canvas>

            <view class="loading-mask" v-if="generating">
                <view class="loading-spinner"></view>
                <text class="loading-text">正在生成海报...</text>
            </view>
        </view>

        <view class="action-buttons">
            <button class="action-btn secondary" @click="saveToAlbum">
                <text class="btn-icon">💾</text>
                <text class="btn-text">保存相册</text>
            </button>
            <button class="action-btn primary" @click="sharePoster">
                <text class="btn-icon">📤</text>
                <text class="btn-text">立即分享</text>
            </button>
        </view>

        <view class="poster-tips">
            <text class="tips-title">📌 温馨提示</text>
            <text class="tips-text">• 分享海报给好友扫码注册，双方均可获得积分奖励</text>
            <text class="tips-text">• 海报长期有效，可保存至相册随时分享</text>
        </view>

        <view class="preview-modal" v-if="showPreview" @click="closePreview">
            <image
                class="preview-image"
                :src="posterImage"
                mode="aspectFit"
                @click.stop
            />
            <view class="preview-actions">
                <button class="preview-btn" @click="saveToAlbumFromPreview">保存到相册</button>
            </view>
        </view>
    </view>
</template>

<script>
import http from '@/common/interceptor.js'

export default {
    props: {
        activityImage: {
            type: String,
            default: ''
        },
        qrCode: {
            type: String,
            default: ''
        },
        title: {
            type: String,
            default: '邀请好友注册'
        },
        subtitle: {
            type: String,
            default: '扫码加入社区，共享闲置好物'
        },
        userName: {
            type: String,
            default: ''
        },
        userAvatar: {
            type: String,
            default: ''
        }
    },
    data() {
        return {
            canvasWidth: 375,
            canvasHeight: 600,
            generating: false,
            posterImage: '',
            showPreview: false,
            activityBg: '/static/poster-bg.jpg',
            defaultQrCode: ''
        }
    },
    onReady() {
        this.initCanvasSize()
    },
    methods: {
        initCanvasSize() {
            const sysInfo = uni.getSystemInfoSync()
            const dpr = sysInfo.pixelRatio || 2
            this.canvasWidth = Math.min(375, sysInfo.windowWidth - 60)
            this.canvasHeight = this.canvasWidth * 1.6
        },

        async generatePoster() {
            if (this.generating) return
            this.generating = true

            try {
                const ctx = uni.createCanvasContext('posterCanvas', this)
                const { canvasWidth, canvasHeight } = this

                ctx.clearRect(0, 0, canvasWidth, canvasHeight)

                this.drawBackground(ctx, canvasWidth, canvasHeight)

                await this.drawActivityImage(ctx, canvasWidth, canvasHeight)

                this.drawTitle(ctx, canvasWidth)
                this.drawSubtitle(ctx, canvasWidth)

                await this.drawUserInfo(ctx, canvasWidth, canvasHeight)

                await this.drawQRCode(ctx, canvasWidth, canvasHeight)

                this.drawBottomText(ctx, canvasWidth, canvasHeight)

                ctx.draw(false, () => {
                    setTimeout(() => {
                        this.exportPoster()
                    }, 300)
                })
            } catch (error) {
                console.error('Generate poster failed:', error)
                uni.showToast({ title: '生成失败，请重试', icon: 'none' })
            } finally {
                this.generating = false
            }
        },

        drawBackground(ctx, width, height) {
            const gradient = ctx.createLinearGradient(0, 0, 0, height)
            gradient.addColorStop(0, '#667eea')
            gradient.addColorStop(0.5, '#764ba2')
            gradient.addColorStop(1, '#f093fb')
            ctx.setFillStyle(gradient)
            ctx.fillRect(0, 0, width, height)

            ctx.setFillStyle('rgba(255, 255, 255, 0.1)')
            for (let i = 0; i < 20; i++) {
                const x = Math.random() * width
                const y = Math.random() * height
                const r = Math.random() * 30 + 5
                ctx.beginPath()
                ctx.arc(x, y, r, 0, 2 * Math.PI)
                ctx.fill()
            }
        },

        async drawActivityImage(ctx, width, height) {
            const imgWidth = width - 40
            const imgHeight = height * 0.35
            const x = 20
            const y = 40

            ctx.setFillStyle('rgba(255, 255, 255, 0.2)')
            this.drawRoundedRect(ctx, x - 6, y - 6, imgWidth + 12, imgHeight + 12, 16)
            ctx.fill()

            try {
                const imgPath = this.activityImage || this.activityBg
                const localPath = await this.getImageInfo(imgPath)
                ctx.drawImage(localPath, x, y, imgWidth, imgHeight)
            } catch (e) {
                ctx.setFillStyle('rgba(255, 255, 255, 0.3)')
                this.drawRoundedRect(ctx, x, y, imgWidth, imgHeight, 12)
                ctx.fill()

                ctx.setFillStyle('#fff')
                ctx.setFontSize(24)
                ctx.setTextAlign('center')
                ctx.setTextBaseline('middle')
                ctx.fillText('🎁 活动图片', width / 2, y + imgHeight / 2)
            }
        },

        drawTitle(ctx, width) {
            ctx.setFillStyle('#fff')
            ctx.setFontSize(22)
            ctx.setTextAlign('center')
            ctx.setTextBaseline('top')
            ctx.fillText(this.title, width / 2, this.canvasHeight * 0.42)
        },

        drawSubtitle(ctx, width) {
            ctx.setFillStyle('rgba(255, 255, 255, 0.85)')
            ctx.setFontSize(14)
            ctx.setTextAlign('center')
            ctx.setTextBaseline('top')
            ctx.fillText(this.subtitle, width / 2, this.canvasHeight * 0.42 + 36)
        },

        async drawUserInfo(ctx, width, height) {
            const avatarSize = 50
            const avatarX = width / 2 - avatarSize / 2
            const avatarY = height * 0.52

            ctx.setFillStyle('#fff')
            ctx.beginPath()
            ctx.arc(width / 2, avatarY + avatarSize / 2, avatarSize / 2 + 3, 0, 2 * Math.PI)
            ctx.fill()

            try {
                if (this.userAvatar) {
                    const localPath = await this.getImageInfo(this.userAvatar)
                    ctx.save()
                    ctx.beginPath()
                    ctx.arc(width / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, 2 * Math.PI)
                    ctx.clip()
                    ctx.drawImage(localPath, avatarX, avatarY, avatarSize, avatarSize)
                    ctx.restore()
                } else {
                    ctx.setFillStyle('#667eea')
                    ctx.beginPath()
                    ctx.arc(width / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, 2 * Math.PI)
                    ctx.fill()

                    ctx.setFillStyle('#fff')
                    ctx.setFontSize(20)
                    ctx.setTextAlign('center')
                    ctx.setTextBaseline('middle')
                    ctx.fillText('👤', width / 2, avatarY + avatarSize / 2)
                }
            } catch (e) {
                ctx.setFillStyle('#667eea')
                ctx.beginPath()
                ctx.arc(width / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, 2 * Math.PI)
                ctx.fill()
            }

            ctx.setFillStyle('#fff')
            ctx.setFontSize(16)
            ctx.setTextAlign('center')
            ctx.setTextBaseline('top')
            const name = this.userName || '社区用户'
            ctx.fillText(name, width / 2, avatarY + avatarSize + 12)
        },

        async drawQRCode(ctx, width, height) {
            const qrSize = 120
            const qrX = width / 2 - qrSize / 2
            const qrY = height * 0.68

            ctx.setFillStyle('#fff')
            this.drawRoundedRect(ctx, qrX - 8, qrY - 8, qrSize + 16, qrSize + 16, 12)
            ctx.fill()

            try {
                const qrPath = this.qrCode || this.defaultQrCode
                if (qrPath) {
                    const localPath = await this.getImageInfo(qrPath)
                    ctx.drawImage(localPath, qrX, qrY, qrSize, qrSize)
                } else {
                    this.drawMockQRCode(ctx, qrX, qrY, qrSize)
                }
            } catch (e) {
                this.drawMockQRCode(ctx, qrX, qrY, qrSize)
            }

            ctx.setFillStyle('#666')
            ctx.setFontSize(12)
            ctx.setTextAlign('center')
            ctx.setTextBaseline('top')
            ctx.fillText('长按扫码 立即加入', width / 2, qrY + qrSize + 12)
        },

        drawMockQRCode(ctx, x, y, size) {
            const cellSize = size / 25
            ctx.setFillStyle('#000')

            for (let i = 0; i < 25; i++) {
                for (let j = 0; j < 25; j++) {
                    if (Math.random() > 0.5) {
                        ctx.fillRect(x + i * cellSize, y + j * cellSize, cellSize, cellSize)
                    }
                }
            }

            this.drawQRPosition(ctx, x, y, cellSize)
            this.drawQRPosition(ctx, x + size - 7 * cellSize, y, cellSize)
            this.drawQRPosition(ctx, x, y + size - 7 * cellSize, cellSize)
        },

        drawQRPosition(ctx, x, y, cellSize) {
            ctx.setFillStyle('#000')
            ctx.fillRect(x, y, 7 * cellSize, 7 * cellSize)
            ctx.setFillStyle('#fff')
            ctx.fillRect(x + cellSize, y + cellSize, 5 * cellSize, 5 * cellSize)
            ctx.setFillStyle('#000')
            ctx.fillRect(x + 2 * cellSize, y + 2 * cellSize, 3 * cellSize, 3 * cellSize)
        },

        drawBottomText(ctx, width, height) {
            ctx.setFillStyle('rgba(255, 255, 255, 0.6)')
            ctx.setFontSize(11)
            ctx.setTextAlign('center')
            ctx.setTextBaseline('bottom')
            ctx.fillText('社区闲置物品交易平台 · 让闲置更有价值', width / 2, height - 20)
        },

        drawRoundedRect(ctx, x, y, width, height, radius) {
            ctx.beginPath()
            ctx.moveTo(x + radius, y)
            ctx.lineTo(x + width - radius, y)
            ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
            ctx.lineTo(x + width, y + height - radius)
            ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
            ctx.lineTo(x + radius, y + height)
            ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
            ctx.lineTo(x, y + radius)
            ctx.quadraticCurveTo(x, y, x + radius, y)
            ctx.closePath()
        },

        getImageInfo(url) {
            return new Promise((resolve, reject) => {
                if (url.startsWith('/static')) {
                    resolve(url)
                    return
                }
                uni.getImageInfo({
                    src: url,
                    success: (res) => resolve(res.path),
                    fail: reject
                })
            })
        },

        exportPoster() {
            uni.canvasToTempFilePath({
                canvasId: 'posterCanvas',
                width: this.canvasWidth,
                height: this.canvasHeight,
                destWidth: this.canvasWidth * 2,
                destHeight: this.canvasHeight * 2,
                success: (res) => {
                    this.posterImage = res.tempFilePath
                    this.showPreview = true
                },
                fail: (err) => {
                    console.error('Export poster failed:', err)
                    uni.showToast({ title: '生成失败，请重试', icon: 'none' })
                }
            }, this)
        },

        async saveToAlbum() {
            if (!this.posterImage) {
                uni.showToast({ title: '请先生成海报', icon: 'none' })
                return
            }
            this.saveImageToAlbum(this.posterImage)
        },

        async saveToAlbumFromPreview() {
            if (!this.posterImage) return
            this.saveImageToAlbum(this.posterImage)
        },

        saveImageToAlbum(filePath) {
            uni.saveImageToPhotosAlbum({
                filePath: filePath,
                success: () => {
                    uni.showToast({ title: '保存成功', icon: 'success' })
                    this.completeTask()
                },
                fail: (err) => {
                    if (err.errMsg.includes('auth deny')) {
                        uni.showModal({
                            title: '提示',
                            content: '需要您授权保存相册权限',
                            success: (res) => {
                                if (res.confirm) {
                                    uni.openSetting()
                                }
                            }
                        })
                    } else {
                        uni.showToast({ title: '保存失败', icon: 'none' })
                    }
                }
            })
        },

        sharePoster() {
            if (!this.posterImage) {
                uni.showToast({ title: '请先生成海报', icon: 'none' })
                return
            }

            // #ifdef MP-WEIXIN
            uni.showShareImageMenu({
                path: this.posterImage,
                success: () => {
                    this.completeTask()
                }
            })
            // #endif

            // #ifdef H5
            uni.showToast({ title: '请保存图片后分享', icon: 'none' })
            // #endif

            // #ifdef APP-PLUS
            uni.share({
                provider: 'weixin',
                scene: 'WXSceneSession',
                type: 2,
                imageUrl: this.posterImage,
                success: () => {
                    this.completeTask()
                }
            })
            // #endif
        },

        async completeTask() {
            try {
                await http.post('/api/task/complete', { taskId: this.$attrs.taskId || 'share_poster' })
                this.$emit('completed')
            } catch (error) {
                console.error('Complete task failed:', error)
            }
        },

        closePreview() {
            this.showPreview = false
        }
    }
}
</script>

<style lang="scss" scoped>
.poster-generator {
    padding: 30rpx;
    background: #f5f5f5;
    min-height: 100vh;
}

.poster-preview {
    position: relative;
    display: flex;
    justify-content: center;
    margin-bottom: 40rpx;
}

.poster-canvas {
    border-radius: 24rpx;
    box-shadow: 0 10rpx 40rpx rgba(0, 0, 0, 0.2);
}

.loading-mask {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    border-radius: 24rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.loading-spinner {
    width: 60rpx;
    height: 60rpx;
    border: 4rpx solid rgba(255, 255, 255, 0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 20rpx;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

.loading-text {
    font-size: 26rpx;
    color: #fff;
}

.action-buttons {
    display: flex;
    gap: 24rpx;
    margin-bottom: 30rpx;
}

.action-btn {
    flex: 1;
    height: 88rpx;
    border-radius: 44rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12rpx;
    font-size: 30rpx;
    font-weight: 500;
    border: none;

    &.primary {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: #fff;
    }

    &.secondary {
        background: #fff;
        color: #667eea;
        border: 2rpx solid #667eea;
    }
}

.btn-icon {
    font-size: 32rpx;
}

.btn-text {
    font-size: 30rpx;
}

.poster-tips {
    background: #fff;
    border-radius: 16rpx;
    padding: 24rpx;
}

.tips-title {
    display: block;
    font-size: 26rpx;
    font-weight: 500;
    color: #333;
    margin-bottom: 16rpx;
}

.tips-text {
    display: block;
    font-size: 24rpx;
    color: #666;
    line-height: 1.8;
}

.preview-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.9);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    padding: 60rpx;
}

.preview-image {
    width: 100%;
    max-height: 70vh;
    border-radius: 16rpx;
    margin-bottom: 40rpx;
}

.preview-actions {
    width: 100%;
}

.preview-btn {
    width: 100%;
    height: 88rpx;
    background: #667eea;
    color: #fff;
    border-radius: 44rpx;
    font-size: 30rpx;
    border: none;
}
</style>
