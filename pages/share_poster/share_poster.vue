<template>
    <view class="share-poster-page">
        <view class="page-header">
            <text class="page-title">分享海报</text>
            <text class="page-subtitle">生成专属海报，邀请好友查看</text>
        </view>

        <view class="content-wrapper">
            <view class="poster-container">
                <canvas
                    canvas-id="posterCanvas"
                    class="poster-canvas"
                    :style="{ width: canvasWidth + 'px', height: canvasHeight + 'px' }"
                ></canvas>
                <view class="poster-loading" v-if="loading">
                    <view class="spinner"></view>
                    <text class="loading-text">海报生成中...</text>
                </view>
            </view>

            <view class="poster-preview" v-if="posterImage">
                <image
                    class="preview-image"
                    :src="posterImage"
                    mode="widthFix"
                    show-menu-by-longpress
                />
            </view>

            <view class="action-section">
                <view class="share-tip">
                    <text class="tip-icon">💡</text>
                    <text class="tip-text">长按图片可直接分享给好友</text>
                </view>

                <view class="action-buttons">
                    <button class="action-btn save-btn" @click="saveImage" :disabled="saving">
                        <text class="btn-icon">💾</text>
                        <text class="btn-text">{{ saving ? '保存中...' : '保存图片' }}</text>
                    </button>
                    <button class="action-btn share-btn" open-type="share">
                        <text class="btn-icon">📤</text>
                        <text class="btn-text">分享好友</text>
                    </button>
                    <button class="action-btn back-btn" @click="goBack">
                        <text class="btn-icon">🏠</text>
                        <text class="btn-text">返回首页</text>
                    </button>
                </view>
            </view>
        </view>
    </view>
</template>

<script>
import http from '@/common/interceptor.js'

export default {
    name: 'SharePosterPage',
    data() {
        return {
            itemId: '',
            itemDetail: null,
            canvasWidth: 300,
            canvasHeight: 500,
            loading: true,
            saving: false,
            posterImage: '',
            qrCodeUrl: ''
        }
    },
    onLoad(options) {
        if (options && options.id) {
            this.itemId = options.id
            this.initCanvasSize()
            this.loadItemDetail()
        } else {
            uni.showToast({ title: '参数错误', icon: 'none' })
            setTimeout(() => uni.navigateBack(), 1500)
        }
    },
    onShareAppMessage() {
        const imageUrl = this.itemDetail?.coverImage || this.itemDetail?.images?.[0] || ''
        return {
            title: this.itemDetail?.title || '快来看看我发布的闲置物品',
            path: `/pages/index/index?itemId=${this.itemId}`,
            imageUrl: this.posterImage || imageUrl
        }
    },
    onShareTimeline() {
        const imageUrl = this.itemDetail?.coverImage || this.itemDetail?.images?.[0] || ''
        return {
            title: this.itemDetail?.title || '快来看看我发布的闲置物品',
            imageUrl: this.posterImage || imageUrl
        }
    },
    methods: {
        initCanvasSize() {
            const systemInfo = uni.getSystemInfoSync()
            const screenWidth = systemInfo.windowWidth
            this.canvasWidth = Math.min(screenWidth - 60, 400)
            this.canvasHeight = this.canvasWidth * 1.67
        },

        async loadItemDetail() {
            try {
                const res = await http.get(`/api/item/${this.itemId}/detail`)
                if (res) {
                    this.itemDetail = res
                    this.generateQrCode()
                }
            } catch (error) {
                console.error('Load item detail failed:', error)
                this.loadMockData()
            }
        },

        loadMockData() {
            this.itemDetail = {
                id: this.itemId,
                title: 'iPhone 12 128G 黑色',
                description: '自用iPhone 12，九成新，无磕碰，配件齐全',
                price: 2999,
                coverImage: '',
                images: ['']
            }
            this.generateQrCode()
        },

        generateQrCode() {
            const shareUrl = `${window.location.origin || 'https://example.com'}/pages/index/index?itemId=${this.itemId}`
            this.qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(shareUrl)}`
            this.drawPoster()
        },

        async drawPoster() {
            this.loading = true
            try {
                const ctx = uni.createCanvasContext('posterCanvas', this)
                const { canvasWidth, canvasHeight } = this

                ctx.fillStyle = '#ffffff'
                ctx.fillRect(0, 0, canvasWidth, canvasHeight)

                const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight * 0.3)
                gradient.addColorStop(0, '#667eea')
                gradient.addColorStop(1, '#764ba2')
                ctx.fillStyle = gradient
                ctx.fillRect(0, 0, canvasWidth, canvasHeight * 0.3)

                ctx.fillStyle = '#ffffff'
                ctx.font = `bold ${canvasWidth * 0.06}px sans-serif`
                ctx.textAlign = 'center'
                ctx.fillText('闲置好物分享', canvasWidth / 2, canvasHeight * 0.12)

                ctx.font = `${canvasWidth * 0.035}px sans-serif`
                ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
                ctx.fillText('让闲置物品流动起来', canvasWidth / 2, canvasHeight * 0.18)

                const imageSize = canvasWidth * 0.7
                const imageX = (canvasWidth - imageSize) / 2
                const imageY = canvasHeight * 0.25

                ctx.fillStyle = '#f5f5f5'
                this.drawRoundedRect(ctx, imageX, imageY, imageSize, imageSize, 12)
                ctx.fill()

                const coverImage = this.itemDetail?.coverImage || this.itemDetail?.images?.[0]
                if (coverImage) {
                    try {
                        await this.drawImage(ctx, coverImage, imageX + 5, imageY + 5, imageSize - 10, imageSize - 10)
                    } catch (e) {
                        this.drawPlaceholder(ctx, imageX, imageY, imageSize, imageSize)
                    }
                } else {
                    this.drawPlaceholder(ctx, imageX, imageY, imageSize, imageSize)
                }

                const titleY = imageY + imageSize + 30
                ctx.fillStyle = '#333333'
                ctx.font = `bold ${canvasWidth * 0.045}px sans-serif`
                ctx.textAlign = 'left'
                const title = this.itemDetail?.title || '闲置物品'
                this.wrapText(ctx, title, imageX, titleY, imageSize, canvasWidth * 0.06)

                if (this.itemDetail?.price && this.itemDetail.price > 0) {
                    const priceY = titleY + canvasWidth * 0.08
                    ctx.fillStyle = '#ff4757'
                    ctx.font = `bold ${canvasWidth * 0.05}px sans-serif`
                    ctx.fillText(`¥${this.itemDetail.price.toFixed(2)}`, imageX, priceY + canvasWidth * 0.05)
                }

                const descY = imageY + imageSize + (this.itemDetail?.price ? 100 : 70)
                ctx.fillStyle = '#999999'
                ctx.font = `${canvasWidth * 0.03}px sans-serif`
                const desc = this.itemDetail?.description || ''
                this.wrapText(ctx, desc, imageX, descY, imageSize, canvasWidth * 0.045, 2)

                const qrSize = canvasWidth * 0.25
                const qrX = (canvasWidth - qrSize) / 2
                const qrY = canvasHeight - qrSize - 60

                ctx.fillStyle = '#ffffff'
                this.drawRoundedRect(ctx, qrX - 5, qrY - 5, qrSize + 10, qrSize + 10, 8)
                ctx.fill()
                ctx.strokeStyle = '#f0f0f0'
                ctx.lineWidth = 2
                this.drawRoundedRect(ctx, qrX - 5, qrY - 5, qrSize + 10, qrSize + 10, 8)
                ctx.stroke()

                try {
                    await this.drawImage(ctx, this.qrCodeUrl, qrX, qrY, qrSize, qrSize)
                } catch (e) {
                    ctx.fillStyle = '#f0f0f0'
                    ctx.fillRect(qrX, qrY, qrSize, qrSize)
                    ctx.fillStyle = '#999'
                    ctx.font = `${canvasWidth * 0.025}px sans-serif`
                    ctx.textAlign = 'center'
                    ctx.fillText('二维码', canvasWidth / 2, qrY + qrSize / 2)
                }

                ctx.fillStyle = '#666666'
                ctx.font = `${canvasWidth * 0.028}px sans-serif`
                ctx.textAlign = 'center'
                ctx.fillText('扫码查看详情', canvasWidth / 2, qrY + qrSize + 25)

                ctx.fillStyle = '#cccccc'
                ctx.font = `${canvasWidth * 0.022}px sans-serif`
                ctx.fillText('社区闲置物品交易平台', canvasWidth / 2, canvasHeight - 20)

                ctx.draw(false, () => {
                    setTimeout(() => {
                        this.saveCanvasToImage()
                    }, 300)
                })
            } catch (error) {
                console.error('Draw poster failed:', error)
                uni.showToast({ title: '海报生成失败', icon: 'none' })
                this.loading = false
            }
        },

        drawPlaceholder(ctx, x, y, width, height) {
            ctx.fillStyle = '#f0f0f0'
            ctx.fillRect(x + 5, y + 5, width - 10, height - 10)
            ctx.fillStyle = '#cccccc'
            ctx.font = `${width * 0.08}px sans-serif`
            ctx.textAlign = 'center'
            ctx.fillText('📦', x + width / 2, y + height / 2)
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

        wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
            if (!text) return
            const chars = text.split('')
            let line = ''
            let lines = 0
            maxLines = maxLines || 3

            for (let i = 0; i < chars.length; i++) {
                const testLine = line + chars[i]
                const metrics = ctx.measureText(testLine)
                if (metrics.width > maxWidth && i > 0) {
                    lines++
                    if (lines >= maxLines) {
                        line = line.substring(0, line.length - 1) + '...'
                        break
                    }
                    ctx.fillText(line, x, y)
                    line = chars[i]
                    y += lineHeight
                } else {
                    line = testLine
                }
            }
            ctx.fillText(line, x, y)
        },

        drawImage(ctx, url, x, y, width, height) {
            return new Promise((resolve, reject) => {
                uni.getImageInfo({
                    src: url,
                    success: (res) => {
                        ctx.drawImage(res.path, x, y, width, height)
                        resolve()
                    },
                    fail: (err) => {
                        reject(err)
                    }
                })
            })
        },

        saveCanvasToImage() {
            uni.canvasToTempFilePath({
                canvasId: 'posterCanvas',
                x: 0,
                y: 0,
                width: this.canvasWidth,
                height: this.canvasHeight,
                destWidth: this.canvasWidth * 2,
                destHeight: this.canvasHeight * 2,
                success: (res) => {
                    this.posterImage = res.tempFilePath
                    this.loading = false
                },
                fail: (err) => {
                    console.error('Save canvas failed:', err)
                    this.loading = false
                }
            }, this)
        },

        async saveImage() {
            if (!this.posterImage) {
                uni.showToast({ title: '海报未生成', icon: 'none' })
                return
            }

            this.saving = true
            try {
                await this.requestAlbumPermission()

                uni.saveImageToPhotosAlbum({
                    filePath: this.posterImage,
                    success: () => {
                        uni.showToast({
                            title: '保存成功',
                            icon: 'success'
                        })
                    },
                    fail: (err) => {
                        console.error('Save image failed:', err)
                        if (err.errMsg && err.errMsg.includes('auth deny')) {
                            uni.showModal({
                                title: '提示',
                                content: '需要您授权保存图片到相册，是否去设置？',
                                success: (res) => {
                                    if (res.confirm) {
                                        uni.openSetting()
                                    }
                                }
                            })
                        } else {
                            uni.showToast({
                                title: '保存失败，请重试',
                                icon: 'none'
                            })
                        }
                    }
                })
            } catch (error) {
                console.error('Save image error:', error)
                uni.showToast({
                    title: '保存失败，请重试',
                    icon: 'none'
                })
            } finally {
                this.saving = false
            }
        },

        requestAlbumPermission() {
            return new Promise((resolve, reject) => {
                uni.getSetting({
                    success: (res) => {
                        if (res.authSetting['scope.writePhotosAlbum'] === false) {
                            uni.showModal({
                                title: '提示',
                                content: '需要您授权保存图片到相册',
                                success: (modalRes) => {
                                    if (modalRes.confirm) {
                                        uni.openSetting({
                                            success: (settingRes) => {
                                                if (settingRes.authSetting['scope.writePhotosAlbum']) {
                                                    resolve()
                                                } else {
                                                    reject(new Error('Permission denied'))
                                                }
                                            },
                                            fail: reject
                                        })
                                    } else {
                                        reject(new Error('User cancelled'))
                                    }
                                }
                            })
                        } else {
                            resolve()
                        }
                    },
                    fail: reject
                })
            })
        },

        goBack() {
            const pages = getCurrentPages()
            if (pages.length > 1) {
                uni.switchTab({
                    url: '/pages/index/index',
                    fail: () => {
                        uni.reLaunch({ url: '/pages/index/index' })
                    }
                })
            } else {
                uni.reLaunch({ url: '/pages/index/index' })
            }
        }
    }
}
</script>

<style lang="scss" scoped>
.share-poster-page {
    min-height: 100vh;
    background: #f5f5f5;
}

.page-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 60rpx 30rpx 80rpx;
}

.page-title {
    display: block;
    font-size: 48rpx;
    font-weight: 700;
    color: #ffffff;
    margin-bottom: 8rpx;
}

.page-subtitle {
    font-size: 26rpx;
    color: rgba(255, 255, 255, 0.8);
}

.content-wrapper {
    padding: 0 30rpx;
    margin-top: -40rpx;
    position: relative;
    z-index: 10;
}

.poster-container {
    position: relative;
    background: #ffffff;
    border-radius: 20rpx;
    padding: 30rpx;
    margin-bottom: 30rpx;
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
    display: flex;
    justify-content: center;
    overflow: hidden;
}

.poster-canvas {
    display: block;
}

.poster-loading {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.9);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
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

.poster-preview {
    background: #ffffff;
    border-radius: 20rpx;
    padding: 30rpx;
    margin-bottom: 30rpx;
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
}

.preview-image {
    width: 100%;
    border-radius: 12rpx;
    display: block;
}

.action-section {
    background: #ffffff;
    border-radius: 20rpx;
    padding: 30rpx;
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
}

.share-tip {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12rpx;
    padding: 20rpx;
    background: rgba(102, 126, 234, 0.05);
    border-radius: 12rpx;
    margin-bottom: 30rpx;
}

.tip-icon {
    font-size: 32rpx;
}

.tip-text {
    font-size: 26rpx;
    color: #667eea;
}

.action-buttons {
    display: flex;
    flex-direction: column;
    gap: 20rpx;
}

.action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12rpx;
    height: 88rpx;
    border-radius: 44rpx;
    border: none;
    font-size: 30rpx;
    font-weight: 500;

    &.save-btn {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        .btn-icon, .btn-text {
            color: #ffffff;
        }
    }

    &.share-btn {
        background: rgba(7, 193, 96, 0.1);
        .btn-icon, .btn-text {
            color: #07c160;
        }
    }

    &.back-btn {
        background: #f5f5f5;
        .btn-icon, .btn-text {
            color: #666;
        }
    }

    &[disabled] {
        opacity: 0.6;
    }
}

.btn-icon {
    font-size: 32rpx;
}

.btn-text {
    font-size: 30rpx;
}
</style>
