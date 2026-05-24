<template>
    <view class="video-uploader">
        <view class="uploader-header">
            <text class="uploader-title">{{ title }}</text>
            <view class="header-right">
                <text class="limit-text" v-if="!video">最长{{ maxDuration }}秒</text>
            </view>
        </view>

        <view class="uploader-content">
            <view class="video-preview" v-if="video && !video.uploading && !video.error">
                <video
                    class="preview-video"
                    :src="video.url || video.tempFilePath"
                    :poster="video.coverImage"
                    :controls="true"
                    :show-center-play-btn="true"
                    :object-fit="cover"
                />

                <view class="video-info">
                    <view class="info-item">
                        <text class="info-icon">⏱️</text>
                        <text class="info-text">{{ formatDuration(video.duration) }}</text>
                    </view>
                    <view class="info-item">
                        <text class="info-icon">📦</text>
                        <text class="info-text">{{ formatFileSize(video.size) }}</text>
                    </view>
                    <view class="info-item resolution" v-if="video.width && video.height">
                        <text class="info-icon">📐</text>
                        <text class="info-text">{{ video.width }}×{{ video.height }}</text>
                    </view>
                </view>

                <view class="video-actions">
                    <button class="action-btn replace-btn" @click="chooseVideo">
                        <text class="btn-icon">🔄</text>
                        <text class="btn-text">重新选择</text>
                    </button>
                    <button class="action-btn delete-btn" @click="removeVideo">
                        <text class="btn-icon">🗑️</text>
                        <text class="btn-text">删除</text>
                    </button>
                </view>
            </view>

            <view class="uploading-state" v-if="video && video.uploading">
                <view class="uploading-cover">
                    <view class="spinner"></view>
                    <text class="uploading-text">视频上传中...</text>
                    <view class="progress-bar">
                        <view class="progress-fill" :style="{ width: video.progress + '%' }"></view>
                    </view>
                    <text class="progress-text">{{ video.progress || 0 }}%</text>
                </view>
            </view>

            <view class="error-state" v-if="video && video.error">
                <text class="error-icon">⚠️</text>
                <text class="error-title">上传失败</text>
                <text class="error-desc">{{ video.errorMessage || '网络异常，请重试' }}</text>
                <view class="error-actions">
                    <button class="retry-btn" @click="retryUpload">
                        <text class="btn-text">重新上传</text>
                    </button>
                    <button class="cancel-btn" @click="removeVideo">
                        <text class="btn-text">取消</text>
                    </button>
                </view>
            </view>

            <view class="upload-placeholder" v-if="!video" @click="chooseVideo">
                <view class="placeholder-icon">
                    <text class="icon-text">🎬</text>
                </view>
                <text class="placeholder-title">上传视频</text>
                <text class="placeholder-desc">
                    支持mp4、mov格式 · 最长{{ maxDuration }}秒 · 不超过{{ formatFileSize(maxSize) }}
                </text>
                <view class="placeholder-tips">
                    <text class="tip-item">· 视频需清晰展示物品</text>
                    <text class="tip-item">· 建议竖屏拍摄</text>
                    <text class="tip-item">· 可添加背景音乐</text>
                </view>
            </view>
        </view>

        <view class="error-tip" v-if="errorMessage">
            <text class="error-text">{{ errorMessage }}</text>
        </view>
    </view>
</template>

<script>
import { uploadToOSS } from '@/common/oss.js'

export default {
    name: 'VideoUploader',

    props: {
        value: {
            type: [String, Object],
            default: null
        },
        title: {
            type: String,
            default: '视频介绍（选填）'
        },
        maxDuration: {
            type: Number,
            default: 15
        },
        maxSize: {
            type: Number,
            default: 50 * 1024 * 1024
        },
        sourceType: {
            type: Array,
            default: () => ['album', 'camera']
        },
        compressed: {
            type: Boolean,
            default: true
        },
        uploadDir: {
            type: String,
            default: 'goods/videos/'
        },
        autoUpload: {
            type: Boolean,
            default: true
        }
    },

    data() {
        return {
            video: null,
            errorMessage: ''
        }
    },

    watch: {
        value: {
            immediate: true,
            handler(val) {
                if (val && !this.video) {
                    if (typeof val === 'string') {
                        this.video = {
                            url: val,
                            tempFilePath: val,
                            uploaded: true,
                            uploading: false,
                            error: false
                        }
                    } else {
                        this.video = {
                            ...val,
                            uploaded: true,
                            uploading: false,
                            error: false
                        }
                    }
                }
            }
        }
    },

    methods: {
        async chooseVideo() {
            try {
                const res = await uni.chooseVideo({
                    sourceType: this.sourceType,
                    maxDuration: this.maxDuration,
                    compressed: this.compressed,
                    camera: 'back'
                })

                if (res.duration > this.maxDuration) {
                    this.showError(`视频时长不能超过${this.maxDuration}秒`)
                    return
                }

                if (res.size > this.maxSize) {
                    this.showError(`视频大小不能超过${this.formatFileSize(this.maxSize)}`)
                    return
                }

                this.video = {
                    id: `video_${Date.now()}`,
                    tempFilePath: res.tempFilePath,
                    coverImage: res.thumbTempFilePath,
                    duration: res.duration,
                    size: res.size,
                    width: res.width,
                    height: res.height,
                    url: '',
                    uploaded: false,
                    uploading: this.autoUpload,
                    error: false,
                    progress: 0
                }

                this.$emit('change', this.getExportData())
                this.$emit('select', { ...this.video })

                if (this.autoUpload) {
                    this.uploadVideo()
                }

            } catch (e) {
                if (e.errMsg && !e.errMsg.includes('cancel')) {
                    console.error('Choose video failed:', e)
                    this.showError('选择视频失败，请重试')
                }
            }
        },

        async uploadVideo() {
            if (!this.video || this.video.uploaded) return

            try {
                this.video.uploading = true
                this.video.error = false
                this.video.progress = 0

                const uploadResult = await uploadToOSS({
                    filePath: this.video.tempFilePath,
                    dir: this.uploadDir,
                    onProgress: (progress) => {
                        this.video.progress = Math.floor(progress)
                    }
                })

                // 上传封面图
                let coverUrl = ''
                if (this.video.coverImage) {
                    try {
                        const coverResult = await uploadToOSS({
                            filePath: this.video.coverImage,
                            dir: this.uploadDir + 'cover/'
                        })
                        coverUrl = coverResult.url
                    } catch (coverErr) {
                        console.warn('Upload cover failed:', coverErr)
                    }
                }

                this.video.url = uploadResult.url
                this.video.coverUrl = coverUrl || this.video.coverImage
                this.video.uploaded = true
                this.video.uploading = false
                this.video.progress = 100

                this.$emit('uploadSuccess', {
                    video: this.getExportData(),
                    result: uploadResult
                })
                this.$emit('change', this.getExportData())
                this.$emit('input', this.video.url)

            } catch (error) {
                console.error('Upload video failed:', error)
                this.video.uploading = false
                this.video.error = true
                this.video.errorMessage = error.message || '上传失败'
                this.video.progress = 0

                this.$emit('uploadError', {
                    error: error,
                    video: this.video
                })
            }
        },

        async retryUpload() {
            await this.uploadVideo()
        },

        removeVideo() {
            const removed = this.video
            this.video = null
            this.$emit('remove', { video: removed })
            this.$emit('change', null)
            this.$emit('input', '')
            this.clearError()
        },

        getExportData() {
            if (!this.video) return null
            return {
                url: this.video.url,
                tempFilePath: this.video.tempFilePath,
                coverUrl: this.video.coverUrl,
                coverImage: this.video.coverImage,
                duration: this.video.duration,
                size: this.video.size,
                width: this.video.width,
                height: this.video.height,
                uploaded: this.video.uploaded
            }
        },

        formatDuration(seconds) {
            if (!seconds) return '0秒'
            const mins = Math.floor(seconds / 60)
            const secs = Math.floor(seconds % 60)
            if (mins > 0) {
                return `${mins}分${secs}秒`
            }
            return `${secs}秒`
        },

        formatFileSize(bytes) {
            if (!bytes || bytes <= 0) return '0 B'
            const k = 1024
            const sizes = ['B', 'KB', 'MB', 'GB']
            const i = Math.floor(Math.log(bytes) / Math.log(k))
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
        },

        showError(message) {
            this.errorMessage = message
            uni.vibrateShort && uni.vibrateShort({ type: 'light' })
            setTimeout(() => {
                this.errorMessage = ''
            }, 3000)
        },

        clearError() {
            if (this.errorMessage) {
                this.errorMessage = ''
            }
        },

        reset() {
            this.video = null
            this.errorMessage = ''
            this.$emit('change', null)
            this.$emit('input', '')
        }
    }
}
</script>

<style lang="scss" scoped>
.video-uploader {
    background: #ffffff;
    border-radius: 16rpx;
    padding: 24rpx;
}

.uploader-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20rpx;
}

.uploader-title {
    font-size: 28rpx;
    font-weight: 600;
    color: #333;
}

.limit-text {
    font-size: 24rpx;
    color: #999;
}

.uploader-content {
    min-height: 300rpx;
}

.video-preview {
    border-radius: 16rpx;
    overflow: hidden;
    background: #000;
}

.preview-video {
    width: 100%;
    height: 420rpx;
    background: #000;
}

.video-info {
    display: flex;
    align-items: center;
    gap: 32rpx;
    padding: 24rpx;
    background: #f8f9fa;
}

.info-item {
    display: flex;
    align-items: center;
    gap: 8rpx;
}

.info-icon {
    font-size: 28rpx;
}

.info-text {
    font-size: 24rpx;
    color: #666;
}

.resolution {
    margin-left: auto;
}

.video-actions {
    display: flex;
    gap: 20rpx;
    padding: 24rpx;
    background: #ffffff;
    border-top: 1rpx solid #f0f0f0;
}

.action-btn {
    flex: 1;
    height: 72rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12rpx;
    border-radius: 36rpx;
    border: none;
    font-size: 26rpx;
    font-weight: 500;
}

.replace-btn {
    background: #f0f0f0;

    .btn-icon, .btn-text {
        color: #666;
    }
}

.delete-btn {
    background: #fff5f5;

    .btn-icon, .btn-text {
        color: #ff4757;
    }
}

.uploading-state, .error-state {
    padding: 60rpx 40rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #f8f9fa;
    border-radius: 16rpx;
    min-height: 300rpx;
}

.uploading-cover {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20rpx;
    width: 100%;
}

.spinner {
    width: 60rpx;
    height: 60rpx;
    border: 5rpx solid #e9ecef;
    border-top-color: #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

.uploading-text {
    font-size: 28rpx;
    color: #333;
    font-weight: 500;
}

.progress-bar {
    width: 80%;
    height: 8rpx;
    background: #e9ecef;
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
    font-size: 24rpx;
    color: #999;
}

.error-state {
    gap: 16rpx;
}

.error-icon {
    font-size: 72rpx;
}

.error-title {
    font-size: 30rpx;
    font-weight: 600;
    color: #333;
}

.error-desc {
    font-size: 24rpx;
    color: #999;
    text-align: center;
}

.error-actions {
    display: flex;
    gap: 20rpx;
    margin-top: 20rpx;
}

.retry-btn, .cancel-btn {
    min-width: 200rpx;
    height: 72rpx;
    border-radius: 36rpx;
    border: none;
    font-size: 26rpx;
    font-weight: 500;
}

.retry-btn {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

    .btn-text {
        color: #ffffff;
    }
}

.cancel-btn {
    background: #f0f0f0;

    .btn-text {
        color: #666;
    }
}

.upload-placeholder {
    padding: 60rpx 40rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16rpx;
    background: #f8f9fa;
    border: 3rpx dashed #ddd;
    border-radius: 16rpx;
    transition: all 0.2s;

    &:active {
        transform: scale(0.98);
        border-color: #667eea;
        background: rgba(102, 126, 234, 0.05);
    }
}

.placeholder-icon {
    width: 100rpx;
    height: 100rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 50%;
    margin-bottom: 8rpx;
}

.icon-text {
    font-size: 48rpx;
}

.placeholder-title {
    font-size: 30rpx;
    font-weight: 600;
    color: #333;
}

.placeholder-desc {
    font-size: 24rpx;
    color: #999;
    text-align: center;
}

.placeholder-tips {
    margin-top: 16rpx;
    display: flex;
    flex-direction: column;
    gap: 8rpx;
}

.tip-item {
    font-size: 22rpx;
    color: #aaa;
}

.error-tip {
    margin-top: 16rpx;
    padding: 16rpx 20rpx;
    background: #fff5f5;
    border-radius: 12rpx;
    animation: shake 0.3s ease;
}

@keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-8rpx); }
    75% { transform: translateX(8rpx); }
}

.error-text {
    font-size: 22rpx;
    color: #ff4757;
}
</style>
