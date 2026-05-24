<template>
    <view class="story-edit-container">
        <view class="cover-section">
            <text class="section-label">封面图 <text class="required">*</text></text>
            <view class="cover-uploader">
                <view
                    v-if="!coverImage"
                    class="upload-btn"
                    @click="chooseCover"
                >
                    <text class="upload-icon">📷</text>
                    <text class="upload-text">上传封面</text>
                    <text class="upload-tip">建议尺寸 750×422px</text>
                </view>

                <view v-else class="cover-preview">
                    <image
                        class="cover-image"
                        :src="coverImage"
                        mode="aspectFill"
                    />
                    <view class="cover-actions">
                        <view class="action-btn" @click="chooseCover">
                            <text class="action-icon">🔄</text>
                            <text class="action-text">更换</text>
                        </view>
                        <view class="action-btn delete" @click="removeCover">
                            <text class="action-icon">🗑️</text>
                            <text class="action-text">删除</text>
                        </view>
                    </view>
                    <view v-if="coverUploading" class="uploading-mask">
                        <view class="loading-spinner"></view>
                        <text class="uploading-text">{{ uploadProgress }}%</text>
                    </view>
                </view>
            </view>
        </view>

        <view class="content-section">
            <view class="content-header">
                <text class="section-label">动态内容 <text class="required">*</text></text>
                <text class="char-count">{{ content.length }}/300</text>
            </view>

            <view class="editor-toolbar">
                <view
                    v-for="tool in tools"
                    :key="tool.name"
                    class="tool-item"
                    :class="{ active: tool.active }"
                    @click="handleTool(tool)"
                >
                    <text class="tool-icon">{{ tool.icon }}</text>
                    <text class="tool-name">{{ tool.name }}</text>
                </view>
                <view class="tool-item" @click="insertImage">
                    <text class="tool-icon">🖼️</text>
                    <text class="tool-name">图片</text>
                </view>
            </view>

            <view class="editor-wrapper">
                <textarea
                    class="content-editor"
                    v-model="content"
                    placeholder="分享你的闲置故事..."
                    maxlength="300"
                    :auto-height="true"
                    :show-confirm-bar="false"
                    :adjust-position="true"
                    @input="onContentInput"
                    @focus="onFocus"
                    @blur="onBlur"
                />

                <view v-if="contentImages.length > 0" class="content-images">
                    <view
                        v-for="(img, index) in contentImages"
                        :key="index"
                        class="content-image-item"
                    >
                        <image
                            class="content-image"
                            :src="img.url"
                            mode="aspectFill"
                        />
                        <view
                            class="remove-image-btn"
                            @click="removeContentImage(index)"
                        >
                            <text class="remove-icon">×</text>
                        </view>
                    </view>
                </view>
            </view>

            <view class="rich-preview" v-if="showPreview && htmlContent">
                <text class="preview-label">预览效果</text>
                <view class="preview-content">
                    <rich-text :nodes="htmlContent"></rich-text>
                </view>
            </view>
        </view>

        <view class="footer-section">
            <view class="footer-info">
                <text class="info-text" :class="{ error: !canSubmit }">
                    {{ getTipText() }}
                </text>
            </view>
            <button
                class="submit-btn"
                :class="{ disabled: !canSubmit }"
                :disabled="!canSubmit || submitting"
                :loading="submitting"
                @click="handleSubmit"
            >
                {{ submitting ? '发布中...' : '发布动态' }}
            </button>
        </view>

        <view class="image-preview-modal" v-if="previewImage" @click="closePreview">
            <image
                class="preview-full-image"
                :src="previewImage"
                mode="aspectFit"
                @click.stop
            />
        </view>
    </view>
</template>

<script>
import { compressImage } from '@/common/compress.js'
import { uploadToOSS } from '@/common/oss.js'
import http from '@/common/interceptor.js'

export default {
    data() {
        return {
            coverImage: '',
            coverUploading: false,
            uploadProgress: 0,
            content: '',
            contentImages: [],
            submitting: false,
            isFocus: false,
            showPreview: false,
            previewImage: '',
            tools: [
                { name: '加粗', icon: '𝐁', active: false, tag: 'strong' },
                { name: '斜体', icon: '𝐼', active: false, tag: 'em' },
                { name: '下划线', icon: 'U̲', active: false, tag: 'u' },
                { name: '换行', icon: '↵', active: false, tag: 'br' }
            ]
        }
    },
    computed: {
        canSubmit() {
            return this.coverImage && this.content.trim().length >= 10 && !this.submitting
        },
        htmlContent() {
            if (!this.content) return ''
            let html = this.content.replace(/\n/g, '<br/>')
            if (this.contentImages.length > 0) {
                const imagesHtml = this.contentImages
                    .map(img => `<img src="${img.url}" style="max-width:100%;border-radius:8rpx;margin:10rpx 0;"/>`)
                    .join('')
                html = html + '<br/>' + imagesHtml
            }
            return html
        }
    },
    onLoad() {
    },
    methods: {
        async chooseCover() {
            try {
                const res = await uni.chooseMedia({
                    count: 1,
                    mediaType: ['image'],
                    sourceType: ['album', 'camera'],
                    sizeType: ['compressed'],
                    camera: 'back'
                })
                const tempFilePath = res.tempFiles[0].tempFilePath
                await this.uploadCover(tempFilePath)
            } catch (error) {
                if (error.errMsg && !error.errMsg.includes('cancel')) {
                    console.error('Choose cover failed:', error)
                    uni.showToast({ title: '选择图片失败', icon: 'none' })
                }
            }
        },

        async uploadCover(filePath) {
            this.coverUploading = true
            this.uploadProgress = 0

            try {
                uni.showLoading({ title: '上传中...' })

                const compressedPath = await compressImage({
                    filePath: filePath,
                    quality: 0.8,
                    maxWidth: 750,
                    maxHeight: 422
                })

                uni.hideLoading()

                const uploadResult = await uploadToOSS({
                    filePath: compressedPath,
                    dir: 'story/cover/',
                    onProgress: (progress) => {
                        this.uploadProgress = progress
                    }
                })

                this.coverImage = uploadResult.url

                uni.showToast({ title: '上传成功', icon: 'success' })
            } catch (error) {
                uni.hideLoading()
                console.error('Upload cover failed:', error)
                uni.showToast({ title: '上传失败，请重试', icon: 'none' })
            } finally {
                this.coverUploading = false
                this.uploadProgress = 0
            }
        },

        removeCover() {
            uni.showModal({
                title: '提示',
                content: '确定要删除封面图吗？',
                success: (res) => {
                    if (res.confirm) {
                        this.coverImage = ''
                    }
                }
            })
        },

        onContentInput(e) {
            const value = e.detail.value
            if (value.length > 300) {
                this.content = value.substring(0, 300)
            }
            this.showPreview = this.content.length > 0
        },

        onFocus() {
            this.isFocus = true
        },

        onBlur() {
            this.isFocus = false
        },

        handleTool(tool) {
            if (tool.tag === 'br') {
                this.content += '\n'
                return
            }

            tool.active = !tool.active
        },

        async insertImage() {
            if (this.contentImages.length >= 9) {
                uni.showToast({ title: '最多可上传9张图片', icon: 'none' })
                return
            }

            try {
                const res = await uni.chooseMedia({
                    count: 9 - this.contentImages.length,
                    mediaType: ['image'],
                    sourceType: ['album', 'camera'],
                    sizeType: ['compressed']
                })

                for (const file of res.tempFiles) {
                    await this.uploadContentImage(file.tempFilePath)
                }
            } catch (error) {
                if (error.errMsg && !error.errMsg.includes('cancel')) {
                    console.error('Choose image failed:', error)
                    uni.showToast({ title: '选择图片失败', icon: 'none' })
                }
            }
        },

        async uploadContentImage(filePath) {
            try {
                uni.showLoading({ title: '上传中...' })

                const compressedPath = await compressImage({
                    filePath: filePath,
                    quality: 0.8,
                    maxWidth: 1080,
                    maxHeight: 1080
                })

                const uploadResult = await uploadToOSS({
                    filePath: compressedPath,
                    dir: 'story/content/'
                })

                this.contentImages.push({
                    url: uploadResult.url,
                    localPath: compressedPath
                })

                this.showPreview = true
            } catch (error) {
                console.error('Upload content image failed:', error)
                uni.showToast({ title: '图片上传失败', icon: 'none' })
            } finally {
                uni.hideLoading()
            }
        },

        removeContentImage(index) {
            uni.showModal({
                title: '提示',
                content: '确定要删除这张图片吗？',
                success: (res) => {
                    if (res.confirm) {
                        this.contentImages.splice(index, 1)
                    }
                }
            })
        },

        previewContentImage(url) {
            this.previewImage = url
        },

        closePreview() {
            this.previewImage = ''
        },

        getTipText() {
            if (!this.coverImage) {
                return '请上传封面图'
            }
            if (this.content.trim().length < 10) {
                return `内容至少10个字，还需输入 ${10 - this.content.trim().length} 字`
            }
            return '内容已填写完整，可以发布啦'
        },

        async handleSubmit() {
            if (!this.canSubmit) return

            this.submitting = true
            try {
                const submitData = {
                    cover: this.coverImage,
                    content: this.content.trim(),
                    htmlContent: this.htmlContent,
                    images: this.contentImages.map(img => img.url)
                }

                const res = await http.post('/api/story/publish', submitData)

                uni.showToast({ title: '发布成功', icon: 'success' })

                setTimeout(() => {
                    uni.navigateBack()
                }, 1500)
            } catch (error) {
                console.error('Publish story failed:', error)
                uni.showToast({ title: '发布失败，请重试', icon: 'none' })
            } finally {
                this.submitting = false
            }
        }
    }
}
</script>

<style lang="scss" scoped>
.story-edit-container {
    min-height: 100vh;
    background: #f5f5f5;
    padding-bottom: 160rpx;
}

.cover-section {
    background: #fff;
    padding: 30rpx;
    margin-bottom: 20rpx;
}

.section-label {
    display: block;
    font-size: 30rpx;
    font-weight: 500;
    color: #333;
    margin-bottom: 20rpx;
}

.required {
    color: #ff3b30;
}

.cover-uploader {
    width: 100%;
}

.upload-btn {
    width: 100%;
    height: 400rpx;
    border: 2rpx dashed #ddd;
    border-radius: 16rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #fafafa;
}

.upload-icon {
    font-size: 60rpx;
    margin-bottom: 16rpx;
}

.upload-text {
    font-size: 28rpx;
    color: #666;
    margin-bottom: 8rpx;
}

.upload-tip {
    font-size: 22rpx;
    color: #999;
}

.cover-preview {
    position: relative;
    width: 100%;
    height: 400rpx;
    border-radius: 16rpx;
    overflow: hidden;
}

.cover-image {
    width: 100%;
    height: 100%;
}

.cover-actions {
    position: absolute;
    bottom: 20rpx;
    right: 20rpx;
    display: flex;
    gap: 16rpx;
}

.action-btn {
    display: flex;
    align-items: center;
    gap: 8rpx;
    padding: 12rpx 20rpx;
    background: rgba(0, 0, 0, 0.6);
    border-radius: 24rpx;

    &.delete {
        background: rgba(255, 59, 48, 0.8);
    }
}

.action-icon {
    font-size: 24rpx;
}

.action-text {
    font-size: 24rpx;
    color: #fff;
}

.uploading-mask {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
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
    margin-bottom: 16rpx;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

.uploading-text {
    font-size: 28rpx;
    color: #fff;
}

.content-section {
    background: #fff;
    padding: 30rpx;
}

.content-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16rpx;
}

.char-count {
    font-size: 26rpx;
    color: #999;
}

.editor-toolbar {
    display: flex;
    gap: 12rpx;
    padding: 16rpx;
    background: #f9f9f9;
    border-radius: 12rpx;
    margin-bottom: 20rpx;
    overflow-x: auto;
}

.tool-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-width: 100rpx;
    padding: 12rpx 16rpx;
    background: #fff;
    border-radius: 8rpx;
    border: 2rpx solid transparent;
    transition: all 0.2s;

    &.active {
        border-color: #667eea;
        background: rgba(102, 126, 234, 0.1);
    }
}

.tool-icon {
    font-size: 32rpx;
    margin-bottom: 4rpx;
}

.tool-name {
    font-size: 20rpx;
    color: #666;

    .active & {
        color: #667eea;
    }
}

.editor-wrapper {
    position: relative;
}

.content-editor {
    width: 100%;
    min-height: 200rpx;
    font-size: 30rpx;
    color: #333;
    line-height: 1.6;
    padding: 0;
}

.content-images {
    display: flex;
    flex-wrap: wrap;
    gap: 16rpx;
    margin-top: 20rpx;
}

.content-image-item {
    position: relative;
    width: 200rpx;
    height: 200rpx;
    border-radius: 12rpx;
    overflow: hidden;
}

.content-image {
    width: 100%;
    height: 100%;
}

.remove-image-btn {
    position: absolute;
    top: 8rpx;
    right: 8rpx;
    width: 40rpx;
    height: 40rpx;
    background: rgba(0, 0, 0, 0.6);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.remove-icon {
    font-size: 28rpx;
    color: #fff;
    line-height: 1;
}

.rich-preview {
    margin-top: 30rpx;
    padding-top: 30rpx;
    border-top: 1rpx solid #f0f0f0;
}

.preview-label {
    display: block;
    font-size: 26rpx;
    color: #999;
    margin-bottom: 16rpx;
}

.preview-content {
    padding: 20rpx;
    background: #f9f9f9;
    border-radius: 12rpx;
    font-size: 28rpx;
    line-height: 1.6;
    color: #333;
}

.footer-section {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    background: #fff;
    padding: 20rpx 30rpx;
    padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
    display: flex;
    align-items: center;
    gap: 24rpx;
    box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.footer-info {
    flex: 1;
}

.info-text {
    font-size: 24rpx;
    color: #07c160;

    &.error {
        color: #ff9500;
    }
}

.submit-btn {
    min-width: 200rpx;
    height: 80rpx;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
    border-radius: 40rpx;
    font-size: 28rpx;
    font-weight: 500;
    border: none;
    padding: 0 40rpx;

    &.disabled {
        background: #ccc;
    }
}

.image-preview-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
}

.preview-full-image {
    width: 100%;
    max-height: 80vh;
}
</style>
