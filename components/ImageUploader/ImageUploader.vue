<template>
    <view class="image-uploader">
        <view class="uploader-header">
            <text class="uploader-title">{{ title }}</text>
            <text class="uploader-count">
                {{ images.length }} / {{ maxCount }}
            </text>
        </view>

        <view class="images-grid">
            <view
                v-for="(image, index) in images"
                :key="image.id || index"
                class="image-item"
                :class="{ 'is-dragging': dragIndex === index }"
                :data-index="index"
                @longpress="onLongPress(index)"
                @touchstart="onTouchStart($event, index)"
                @touchmove="onTouchMove"
                @touchend="onTouchEnd"
            >
                <image
                    class="item-image"
                    :src="image.url || image.tempFilePath || image"
                    mode="aspectFill"
                />

                <view class="item-cover" v-if="image.uploading">
                    <view class="progress-ring">
                        <text class="progress-text">{{ image.progress || 0 }}%</text>
                    </view>
                </view>

                <view class="item-cover error" v-if="image.error">
                    <text class="error-icon">!</text>
                    <text class="error-detail" v-if="image.errorMessage">{{ image.errorMessage }}</text>
                    <text class="retry-text" @click.stop="retryUpload(index)">重新上传</text>
                </view>

                <view class="item-actions">
                    <view class="action-btn set-cover" v-if="index === 0">
                        <text class="btn-text">封面</text>
                    </view>
                    <view class="action-btn sort-btn" v-if="images.length > 1">
                        <text class="btn-icon">⋮⋮</text>
                    </view>
                    <view class="action-btn delete-btn" @click.stop="removeImage(index)">
                        <text class="btn-icon">×</text>
                    </view>
                </view>

                <view class="drag-indicator" v-if="dragIndex === index">
                    <text class="drag-text">拖动排序</text>
                </view>
            </view>

            <view
                class="add-item"
                v-if="images.length < maxCount"
                @click="chooseImages"
            >
                <text class="add-icon">+</text>
                <text class="add-text">添加图片</text>
                <text class="add-hint">{{ maxCount - images.length }}张可加</text>
            </view>
        </view>

        <view class="uploader-status" v-if="hasFailedImages">
            <text class="status-icon">⚠️</text>
            <text class="status-text">{{ failedImageCount }}张图片上传失败</text>
            <view class="retry-all-btn" @click="retryAllFailed">
                <text class="btn-text">全部重试</text>
            </view>
        </view>

        <view class="uploader-tips">
            <text class="tip-text">
                长按图片可拖拽排序 · 第一张自动设为封面 · 单张不超过10MB · 最多{{ maxConcurrentUploads }}张同时上传
            </text>
        </view>

        <view class="error-tip" v-if="errorMessage">
            <text class="error-text">{{ errorMessage }}</text>
        </view>
    </view>
</template>

<script>
import { compressImage, getImageInfo } from '@/common/compress.js'
import { uploadToOSS } from '@/common/oss.js'

export default {
    name: 'ImageUploader',

    props: {
        value: {
            type: Array,
            default: () => []
        },
        title: {
            type: String,
            default: '物品图片'
        },
        maxCount: {
            type: Number,
            default: 9
        },
        compress: {
            type: Boolean,
            default: true
        },
        compressOptions: {
            type: Object,
            default: () => ({
                quality: 0.8,
                maxWidth: 1080,
                maxHeight: 1080
            })
        },
        uploadDir: {
            type: String,
            default: 'goods/images/'
        },
        autoUpload: {
            type: Boolean,
            default: true
        },
        enableDragSort: {
            type: Boolean,
            default: true
        }
    },

    data() {
        return {
            images: [],
            errorMessage: '',
            dragIndex: -1,
            dragStartY: 0,
            dragStartX: 0,
            isDragging: false,
            imageIdCounter: 0,
            uploadQueue: [],
            activeUploads: 0,
            maxConcurrentUploads: 3,
            uploadRetryCount: {}
        }
    },

    computed: {
        hasFailedImages() {
            return this.images.some(img => img.error && !img.uploaded)
        },
        failedImageCount() {
            return this.images.filter(img => img.error && !img.uploaded).length
        }
    },

    watch: {
        value: {
            immediate: true,
            deep: true,
            handler(val) {
                if (Array.isArray(val) && val.length > 0 && this.images.length === 0) {
                    this.images = val.map((img, idx) => ({
                        id: this.generateId(),
                        url: typeof img === 'string' ? img : img.url,
                        tempFilePath: typeof img === 'string' ? img : img.tempFilePath,
                        uploaded: true,
                        uploading: false,
                        error: false,
                        progress: 100
                    }))
                }
            }
        }
    },

    methods: {
        generateId() {
            return `img_${Date.now()}_${this.imageIdCounter++}`
        },

        async chooseImages() {
            const remaining = this.maxCount - this.images.length
            if (remaining <= 0) {
                this.showError(`最多只能上传${this.maxCount}张图片`)
                return
            }

            try {
                const res = await uni.chooseMedia({
                    count: remaining,
                    mediaType: ['image'],
                    sourceType: ['album', 'camera'],
                    sizeType: ['original', 'compressed']
                })

                const tempFiles = res.tempFiles || []

                for (const file of tempFiles) {
                    if (this.images.length >= this.maxCount) break

                    const imageItem = {
                        id: this.generateId(),
                        tempFilePath: file.tempFilePath,
                        url: '',
                        size: file.size,
                        uploaded: false,
                        uploading: this.autoUpload,
                        error: false,
                        progress: 0
                    }

                    this.images.push(imageItem)
                    this.$emit('change', this.getExportData())

                    if (this.autoUpload) {
                        this.queueUpload(this.images.length - 1)
                    }
                }

            } catch (e) {
                if (e.errMsg && !e.errMsg.includes('cancel')) {
                    console.error('Choose images failed:', e)
                    this.showError('选择图片失败，请重试')
                }
            }
        },

        queueUpload(index) {
            const image = this.images[index]
            if (!image || image.uploaded) return

            if (this.uploadQueue.includes(index)) return
            this.uploadQueue.push(index)
            this.processQueue()
        },

        processQueue() {
            if (this.activeUploads >= this.maxConcurrentUploads || this.uploadQueue.length === 0) {
                return
            }

            const index = this.uploadQueue.shift()
            if (index !== undefined && this.images[index]) {
                this.activeUploads++
                this.uploadSingleImage(index).finally(() => {
                    this.activeUploads--
                    this.$nextTick(() => {
                        this.processQueue()
                    })
                })
            }
        },

        async uploadSingleImage(index) {
            const image = this.images[index]
            if (!image || image.uploaded) return

            const imageId = image.id || `img_${index}`
            const maxRetries = 3

            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    image.uploading = true
                    image.error = false
                    image.progress = 0
                    image.errorMessage = ''

                    let filePath = image.tempFilePath

                    if (this.compress) {
                        try {
                            const compressedPath = await compressImage({
                                filePath: filePath,
                                ...this.compressOptions
                            })
                            filePath = compressedPath
                        } catch (compressErr) {
                            console.warn('Compress failed, use original:', compressErr)
                        }
                    }

                    const uploadResult = await this.uploadWithRetry(filePath, image, attempt)

                    image.url = uploadResult.url
                    image.uploaded = true
                    image.uploading = false
                    image.progress = 100
                    image.retryCount = 0

                    this.$emit('uploadSuccess', {
                        index,
                        image: image,
                        result: uploadResult
                    })
                    this.$emit('change', this.getExportData())

                    return

                } catch (error) {
                    console.error(`Upload attempt ${attempt} failed:`, error)

                    if (attempt === maxRetries) {
                        image.uploading = false
                        image.error = true
                        image.progress = 0
                        image.errorMessage = this.getErrorMessage(error)

                        this.$emit('uploadError', {
                            index,
                            image: image,
                            error: error,
                            attempt: attempt,
                            maxRetries: maxRetries
                        })
                    } else {
                        image.progress = 0
                        await this.delay(1000 * attempt)
                    }
                }
            }
        },

        async uploadWithRetry(filePath, image, attempt) {
            return new Promise((resolve, reject) => {
                const timeoutId = setTimeout(() => {
                    reject(new Error('UPLOAD_TIMEOUT'))
                }, 30000)

                uploadToOSS({
                    filePath: filePath,
                    dir: this.uploadDir,
                    onProgress: (progress) => {
                        image.progress = Math.floor(progress)
                    }
                }).then((result) => {
                    clearTimeout(timeoutId)
                    resolve(result)
                }).catch((error) => {
                    clearTimeout(timeoutId)
                    reject(error)
                })
            })
        },

        getErrorMessage(error) {
            const errMsg = error?.message || error?.errMsg || ''
            if (errMsg.includes('timeout') || errMsg.includes('TIMEOUT')) {
                return '网络超时，请重试'
            }
            if (errMsg.includes('auth') || errMsg.includes('permission')) {
                return '上传权限不足'
            }
            if (errMsg.includes('network') || errMsg.includes('offline')) {
                return '网络连接失败，请检查网络'
            }
            if (errMsg.includes('size') || errMsg.includes('large')) {
                return '图片过大，请压缩后重试'
            }
            return '上传失败，请重试'
        },

        delay(ms) {
            return new Promise(resolve => setTimeout(resolve, ms))
        },

        async retryUpload(index) {
            const image = this.images[index]
            if (!image) return

            this.uploadRetryCount[image.id] = (this.uploadRetryCount[image.id] || 0) + 1
            image.error = false
            image.errorMessage = ''
            this.queueUpload(index)
        },

        retryAllFailed() {
            const failedIndices = []
            this.images.forEach((img, idx) => {
                if (img.error && !img.uploaded) {
                    failedIndices.push(idx)
                }
            })

            if (failedIndices.length === 0) {
                this.showError('没有需要重试的图片')
                return
            }

            failedIndices.forEach(idx => this.retryUpload(idx))
            uni.showToast({
                title: `正在重试${failedIndices.length}张图片`,
                icon: 'none'
            })
        },

        removeImage(index) {
            const removed = this.images.splice(index, 1)[0]
            this.$emit('remove', { index, image: removed })
            this.$emit('change', this.getExportData())
            this.clearError()
        },

        onTouchStart(e, index) {
            if (!this.enableDragSort || this.images.length <= 1) return

            const touch = e.touches[0]
            this.dragStartY = touch.clientY
            this.dragStartX = touch.clientX
        },

        onTouchMove(e) {
            if (!this.enableDragSort || this.images.length <= 1) return
            if (this.dragIndex === -1 && !this.isDragging) return

            const touch = e.touches[0]
            const deltaY = touch.clientY - this.dragStartY
            const deltaX = touch.clientX - this.dragStartX

            if (Math.abs(deltaY) > 30 && Math.abs(deltaY) > Math.abs(deltaX)) {
                if (this.dragIndex === -1) {
                    this.isDragging = true
                    uni.vibrateShort && uni.vibrateShort({ type: 'medium' })
                }

                const items = Array.from(document.querySelectorAll('.image-item'))
                const currentItem = items[this.dragIndex]
                if (!currentItem) return

                const itemRect = currentItem.getBoundingClientRect()
                const itemHeight = itemRect.height

                let targetIndex = this.dragIndex
                if (deltaY > itemHeight / 2 && this.dragIndex < this.images.length - 1) {
                    targetIndex = this.dragIndex + 1
                } else if (deltaY < -itemHeight / 2 && this.dragIndex > 0) {
                    targetIndex = this.dragIndex - 1
                }

                if (targetIndex !== this.dragIndex) {
                    const temp = this.images[this.dragIndex]
                    this.images.splice(this.dragIndex, 1)
                    this.images.splice(targetIndex, 0, temp)
                    this.dragIndex = targetIndex
                    this.dragStartY = touch.clientY

                    uni.vibrateShort && uni.vibrateShort({ type: 'light' })
                    this.$emit('change', this.getExportData())
                    this.$emit('sort', {
                        images: this.getExportData(),
                        fromIndex: targetIndex > this.dragIndex ? this.dragIndex : this.dragIndex,
                        toIndex: targetIndex
                    })
                }
            }
        },

        onTouchEnd() {
            this.isDragging = false
            this.dragIndex = -1
        },

        onLongPress(index) {
            if (!this.enableDragSort || this.images.length <= 1) return
            this.dragIndex = index
            this.isDragging = true
            uni.vibrateShort && uni.vibrateShort({ type: 'medium' })
        },

        async uploadAll() {
            const pendingIndices = []
            for (let i = 0; i < this.images.length; i++) {
                if (!this.images[i].uploaded && !this.images[i].uploading) {
                    pendingIndices.push(i)
                }
            }

            if (pendingIndices.length === 0) {
                return {
                    success: true,
                    images: this.getExportData()
                }
            }

            pendingIndices.forEach(idx => this.queueUpload(idx))

            const checkUploadComplete = () => {
                return new Promise((resolve) => {
                    const checkInterval = setInterval(() => {
                    const allDone = this.images.every(img => img.uploaded || img.error)
                    const allQueueEmpty = this.uploadQueue.length === 0
                    const noActiveUploads = this.activeUploads === 0

                    if (allDone && allQueueEmpty && noActiveUploads) {
                        clearInterval(checkInterval)
                        resolve()
                    }
                }, 200)
            })

            await checkUploadComplete()

            const allUploaded = this.images.every(img => img.uploaded)
            return {
                success: allUploaded,
                images: this.getExportData(),
                failedCount: this.images.filter(img => img.error).length
            }
        },

        getExportData() {
            return this.images.map(img => ({
                url: img.url,
                tempFilePath: img.tempFilePath,
                uploaded: img.uploaded,
                isCover: this.images.indexOf(img) === 0
            }))
        },

        getUrls() {
            return this.images.filter(img => img.uploaded).map(img => img.url)
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
            this.images = []
            this.errorMessage = ''
            this.dragIndex = -1
            this.isDragging = false
            this.$emit('change', [])
        },

        setCover(index) {
            if (index < 0 || index >= this.images.length) return
            const item = this.images.splice(index, 1)[0]
            this.images.unshift(item)
            this.$emit('change', this.getExportData())
        }
    }
}
</script>

<style lang="scss" scoped>
.image-uploader {
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

.uploader-count {
    font-size: 24rpx;
    color: #999;
}

.images-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 16rpx;
}

.image-item {
    width: calc((100% - 32rpx) / 3);
    aspect-ratio: 1;
    border-radius: 16rpx;
    overflow: hidden;
    position: relative;
    transition: all 0.2s ease;

    &.is-dragging {
        transform: scale(1.05);
        box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.3);
        z-index: 10;
    }
}

.item-image {
    width: 100%;
    height: 100%;
}

.item-cover {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8rpx;

    &.error {
        background: rgba(255, 71, 87, 0.8);
    }
}

.progress-ring {
    width: 80rpx;
    height: 80rpx;
    border: 4rpx solid rgba(255, 255, 255, 0.3);
    border-top-color: #ffffff;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

.progress-text {
    font-size: 20rpx;
    color: #ffffff;
    font-weight: 600;
    animation: none;
}

.error-icon {
    font-size: 48rpx;
    color: #ffffff;
    font-weight: 700;
}

.retry-text {
    font-size: 22rpx;
    color: #ffffff;
    padding: 8rpx 24rpx;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 24rpx;
}

.error-detail {
    font-size: 18rpx;
    color: #ffffff;
    text-align: center;
    line-height: 1.4;
    max-width: 90%;
}

.item-actions {
    position: absolute;
    top: 8rpx;
    right: 8rpx;
    display: flex;
    align-items: center;
    gap: 8rpx;
}

.action-btn {
    width: 44rpx;
    height: 44rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 50%;
    transition: all 0.2s;

    &:active {
        transform: scale(0.9);
    }

    &.set-cover {
        width: auto;
        padding: 4rpx 16rpx;
        border-radius: 20rpx;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    &.sort-btn {
        background: rgba(0, 0, 0, 0.4);
    }

    &.delete-btn {
        background: rgba(255, 71, 87, 0.8);
    }
}

.btn-text {
    font-size: 18rpx;
    color: #ffffff;
}

.btn-icon {
    font-size: 28rpx;
    color: #ffffff;
    font-weight: 600;
    line-height: 1;
}

.drag-indicator {
    position: absolute;
    bottom: 8rpx;
    left: 50%;
    transform: translateX(-50%);
    padding: 6rpx 20rpx;
    background: rgba(102, 126, 234, 0.9);
    border-radius: 20rpx;
}

.drag-text {
    font-size: 20rpx;
    color: #ffffff;
}

.add-item {
    width: calc((100% - 32rpx) / 3);
    aspect-ratio: 1;
    border: 3rpx dashed #ddd;
    border-radius: 16rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8rpx;
    transition: all 0.2s;

    &:active {
        transform: scale(0.95);
        border-color: #667eea;
        background: rgba(102, 126, 234, 0.05);
    }
}

.add-icon {
    font-size: 56rpx;
    color: #ccc;
    font-weight: 300;
    line-height: 1;
}

.add-text {
    font-size: 24rpx;
    color: #999;
}

.add-hint {
    font-size: 20rpx;
    color: #ccc;
}

.uploader-status {
    display: flex;
    align-items: center;
    gap: 16rpx;
    margin-top: 16rpx;
    padding: 20rpx;
    background: #fff5f5;
    border-radius: 12rpx;
}

.status-icon {
    font-size: 32rpx;
    flex-shrink: 0;
}

.status-text {
    flex: 1;
    font-size: 26rpx;
    color: #ff4757;
}

.retry-all-btn {
    flex-shrink: 0;
    padding: 12rpx 28rpx;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 28rpx;

    .btn-text {
        font-size: 24rpx;
        color: #ffffff;
        font-weight: 500;
    }
}

.uploader-tips {
    margin-top: 16rpx;
    padding: 16rpx 20rpx;
    background: #f8f9fa;
    border-radius: 12rpx;
}

.tip-text {
    font-size: 22rpx;
    color: #999;
    line-height: 1.5;
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
