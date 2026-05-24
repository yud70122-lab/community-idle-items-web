<template>
    <view class="real-name-container">
        <view class="header">
            <text class="title">实名认证</text>
            <text class="subtitle">请填写真实身份信息，完成实名认证</text>
        </view>

        <view class="form-section">
            <view class="form-item">
                <text class="label">真实姓名</text>
                <input
                    v-model="formData.realName"
                    placeholder="请输入真实姓名"
                    maxlength="20"
                    class="input"
                />
            </view>

            <view class="form-item">
                <text class="label">身份证号</text>
                <input
                    v-model="formData.idCard"
                    placeholder="请输入18位身份证号码"
                    maxlength="18"
                    class="input"
                />
            </view>
        </view>

        <view class="upload-section">
            <text class="section-title">上传身份证照片</text>
            <text class="section-tip">请确保身份证信息清晰、完整，无遮挡</text>

            <view class="id-card-list">
                <view class="id-card-item">
                    <text class="card-label">身份证人像面</text>
                    <view
                        class="upload-box"
                        :class="{ 'has-image': idCardFront.tempPath }"
                        @click="chooseImage('front')"
                    >
                        <image
                            v-if="idCardFront.tempPath"
                            :src="idCardFront.tempPath"
                            mode="aspectFill"
                            class="preview-image"
                            @click.stop="previewImage('front')"
                        />
                        <view v-else class="upload-placeholder">
                            <text class="upload-icon">📷</text>
                            <text class="upload-text">点击上传</text>
                        </view>

                        <view v-if="idCardFront.status === 'uploading'" class="uploading-mask">
                            <view class="progress-circle">
                                <text class="progress-text">{{ idCardFront.progress }}%</text>
                            </view>
                        </view>

                        <view v-if="idCardFront.status === 'success'" class="success-badge">
                            <text class="success-icon">✓</text>
                        </view>

                        <view v-if="idCardFront.tempPath && idCardFront.status !== 'uploading'" class="remove-btn" @click.stop="removeImage('front')">
                            <text class="remove-icon">×</text>
                        </view>
                    </view>
                    <view v-if="idCardFront.status === 'uploading'" class="progress-bar-wrap">
                        <view class="progress-bar">
                            <view class="progress-inner" :style="{ width: idCardFront.progress + '%' }"></view>
                        </view>
                        <text class="progress-label">上传中 {{ idCardFront.progress }}%</text>
                    </view>
                    <text v-if="idCardFront.status === 'error'" class="error-text">上传失败，点击重试</text>
                </view>

                <view class="id-card-item">
                    <text class="card-label">身份证国徽面</text>
                    <view
                        class="upload-box"
                        :class="{ 'has-image': idCardBack.tempPath }"
                        @click="chooseImage('back')"
                    >
                        <image
                            v-if="idCardBack.tempPath"
                            :src="idCardBack.tempPath"
                            mode="aspectFill"
                            class="preview-image"
                            @click.stop="previewImage('back')"
                        />
                        <view v-else class="upload-placeholder">
                            <text class="upload-icon">📷</text>
                            <text class="upload-text">点击上传</text>
                        </view>

                        <view v-if="idCardBack.status === 'uploading'" class="uploading-mask">
                            <view class="progress-circle">
                                <text class="progress-text">{{ idCardBack.progress }}%</text>
                            </view>
                        </view>

                        <view v-if="idCardBack.status === 'success'" class="success-badge">
                            <text class="success-icon">✓</text>
                        </view>

                        <view v-if="idCardBack.tempPath && idCardBack.status !== 'uploading'" class="remove-btn" @click.stop="removeImage('back')">
                            <text class="remove-icon">×</text>
                        </view>
                    </view>
                    <view v-if="idCardBack.status === 'uploading'" class="progress-bar-wrap">
                        <view class="progress-bar">
                            <view class="progress-inner" :style="{ width: idCardBack.progress + '%' }"></view>
                        </view>
                        <text class="progress-label">上传中 {{ idCardBack.progress }}%</text>
                    </view>
                    <text v-if="idCardBack.status === 'error'" class="error-text">上传失败，点击重试</text>
                </view>
            </view>
        </view>

        <view class="tips-section">
            <text class="tips-title">温馨提示</text>
            <view class="tips-content">
                <text class="tip-item">•  实名认证后不可修改，请确保信息准确</text>
                <text class="tip-item">•  身份证照片仅用于实名认证，严格保密</text>
                <text class="tip-item">•  支持 JPG、PNG 格式，单张不超过 5MB</text>
            </view>
        </view>

        <button
            class="submit-btn"
            :loading="submitting"
            :disabled="!canSubmit || submitting"
            @click="handleSubmit"
        >
            {{ submitting ? '提交中...' : '提交认证' }}
        </button>
    </view>
</template>

<script>
import { compressImage } from '@/common/compress.js'
import { uploadToOSS } from '@/common/oss.js'
import http from '@/common/interceptor.js'

export default {
    data() {
        return {
            formData: {
                realName: '',
                idCard: ''
            },
            idCardFront: {
                tempPath: '',
                url: '',
                status: 'idle',
                progress: 0
            },
            idCardBack: {
                tempPath: '',
                url: '',
                status: 'idle',
                progress: 0
            },
            submitting: false
        }
    },
    computed: {
        canSubmit() {
            return (
                this.formData.realName.trim() &&
                this.validateIdCard(this.formData.idCard) &&
                this.idCardFront.url &&
                this.idCardBack.url &&
                this.idCardFront.status === 'success' &&
                this.idCardBack.status === 'success'
            )
        }
    },
    methods: {
        chooseImage(side) {
            const cardData = side === 'front' ? this.idCardFront : this.idCardBack

            if (cardData.status === 'uploading') {
                return
            }

            uni.chooseMedia({
                count: 1,
                mediaType: ['image'],
                sourceType: ['album', 'camera'],
                sizeType: ['compressed'],
                camera: 'back',
                success: async (res) => {
                    const tempFilePath = res.tempFiles[0].tempFilePath
                    cardData.tempPath = tempFilePath
                    cardData.status = 'uploading'
                    cardData.progress = 0

                    try {
                        await this.processAndUpload(side, tempFilePath)
                    } catch (error) {
                        console.error('Upload failed:', error)
                        cardData.status = 'error'
                        cardData.progress = 0
                        uni.showToast({
                            title: '上传失败，请重试',
                            icon: 'none'
                        })
                    }
                },
                fail: (err) => {
                    if (err.errMsg !== 'chooseMedia:fail cancel') {
                        uni.showToast({
                            title: '选择图片失败',
                            icon: 'none'
                        })
                    }
                }
            })
        },

        async processAndUpload(side, filePath) {
            const cardData = side === 'front' ? this.idCardFront : this.idCardBack
            const uploadDir = side === 'front' ? 'id-card/front/' : 'id-card/back/'

            try {
                uni.showLoading({ title: '压缩中...' })
                const compressedPath = await compressImage({
                    filePath: filePath,
                    quality: 0.8,
                    maxWidth: 1920,
                    maxHeight: 1920
                })
                uni.hideLoading()

                cardData.tempPath = compressedPath

                const uploadResult = await uploadToOSS({
                    filePath: compressedPath,
                    dir: uploadDir,
                    onProgress: (progress) => {
                        cardData.progress = progress
                    }
                })

                cardData.url = uploadResult.url
                cardData.status = 'success'
                cardData.progress = 100

                return uploadResult
            } catch (error) {
                uni.hideLoading()
                throw error
            }
        },

        removeImage(side) {
            const cardData = side === 'front' ? this.idCardFront : this.idCardBack

            if (cardData.status === 'uploading') {
                return
            }

            uni.showModal({
                title: '提示',
                content: '确定要删除这张图片吗？',
                success: (res) => {
                    if (res.confirm) {
                        cardData.tempPath = ''
                        cardData.url = ''
                        cardData.status = 'idle'
                        cardData.progress = 0
                    }
                }
            })
        },

        previewImage(side) {
            const cardData = side === 'front' ? this.idCardFront : this.idCardBack
            if (cardData.tempPath) {
                uni.previewImage({
                    urls: [cardData.tempPath],
                    current: cardData.tempPath
                })
            }
        },

        validateIdCard(idCard) {
            const reg = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/
            return reg.test(idCard)
        },

        validateForm() {
            if (!this.formData.realName.trim()) {
                uni.showToast({
                    title: '请输入真实姓名',
                    icon: 'none'
                })
                return false
            }

            if (!this.validateIdCard(this.formData.idCard)) {
                uni.showToast({
                    title: '请输入正确的身份证号',
                    icon: 'none'
                })
                return false
            }

            if (!this.idCardFront.url) {
                uni.showToast({
                    title: '请上传身份证人像面',
                    icon: 'none'
                })
                return false
            }

            if (!this.idCardBack.url) {
                uni.showToast({
                    title: '请上传身份证国徽面',
                    icon: 'none'
                })
                return false
            }

            if (this.idCardFront.status !== 'success' || this.idCardBack.status !== 'success') {
                uni.showToast({
                    title: '图片正在上传，请稍候',
                    icon: 'none'
                })
                return false
            }

            return true
        },

        async handleSubmit() {
            if (!this.validateForm()) {
                return
            }

            this.submitting = true
            try {
                await http.post('/api/user/real-name-auth', {
                    realName: this.formData.realName,
                    idCard: this.formData.idCard,
                    idCardFrontUrl: this.idCardFront.url,
                    idCardBackUrl: this.idCardBack.url
                })

                uni.showToast({
                    title: '提交成功',
                    icon: 'success'
                })

                setTimeout(() => {
                    uni.navigateBack()
                }, 1500)
            } catch (error) {
                console.error('Submit failed:', error)
            } finally {
                this.submitting = false
            }
        }
    }
}
</script>

<style lang="scss" scoped>
.real-name-container {
    min-height: 100vh;
    padding: 30rpx;
    background-color: #f5f5f5;
}

.header {
    padding: 40rpx 20rpx;
    text-align: center;
}

.title {
    display: block;
    font-size: 40rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 16rpx;
}

.subtitle {
    font-size: 26rpx;
    color: #999;
}

.form-section {
    background: #fff;
    border-radius: 20rpx;
    padding: 20rpx 30rpx;
    margin-bottom: 30rpx;
}

.form-item {
    display: flex;
    align-items: center;
    height: 110rpx;
    border-bottom: 1rpx solid #f0f0f0;
}

.form-item:last-child {
    border-bottom: none;
}

.label {
    width: 160rpx;
    font-size: 30rpx;
    color: #333;
    flex-shrink: 0;
}

.input {
    flex: 1;
    height: 100%;
    font-size: 30rpx;
    color: #333;
}

.upload-section {
    background: #fff;
    border-radius: 20rpx;
    padding: 30rpx;
    margin-bottom: 30rpx;
}

.section-title {
    display: block;
    font-size: 32rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 12rpx;
}

.section-tip {
    display: block;
    font-size: 24rpx;
    color: #999;
    margin-bottom: 30rpx;
}

.id-card-list {
    display: flex;
    justify-content: space-between;
    gap: 20rpx;
}

.id-card-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.card-label {
    font-size: 26rpx;
    color: #666;
    margin-bottom: 16rpx;
}

.upload-box {
    width: 100%;
    aspect-ratio: 1.6 / 1;
    border: 2rpx dashed #ddd;
    border-radius: 16rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fafafa;
    position: relative;
    overflow: hidden;
    transition: border-color 0.3s;
}

.upload-box.has-image {
    border-style: solid;
    border-color: #007aff;
}

.upload-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.upload-icon {
    font-size: 60rpx;
    margin-bottom: 12rpx;
}

.upload-text {
    font-size: 24rpx;
    color: #999;
}

.preview-image {
    width: 100%;
    height: 100%;
}

.uploading-mask {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
}

.progress-circle {
    width: 100rpx;
    height: 100rpx;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
}

.progress-text {
    font-size: 24rpx;
    color: #fff;
    font-weight: bold;
}

.success-badge {
    position: absolute;
    top: 12rpx;
    right: 12rpx;
    width: 40rpx;
    height: 40rpx;
    background: #07c160;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.success-icon {
    font-size: 24rpx;
    color: #fff;
    font-weight: bold;
}

.remove-btn {
    position: absolute;
    top: 12rpx;
    left: 12rpx;
    width: 40rpx;
    height: 40rpx;
    background: rgba(0, 0, 0, 0.5);
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

.progress-bar-wrap {
    width: 100%;
    margin-top: 12rpx;
}

.progress-bar {
    width: 100%;
    height: 8rpx;
    background: #f0f0f0;
    border-radius: 4rpx;
    overflow: hidden;
    margin-bottom: 8rpx;
}

.progress-inner {
    height: 100%;
    background: linear-gradient(90deg, #667eea, #764ba2);
    border-radius: 4rpx;
    transition: width 0.3s;
}

.progress-label {
    font-size: 22rpx;
    color: #667eea;
    display: block;
    text-align: center;
}

.error-text {
    font-size: 22rpx;
    color: #ff4d4f;
    margin-top: 12rpx;
}

.tips-section {
    background: #fffbe6;
    border-radius: 16rpx;
    padding: 24rpx;
    margin-bottom: 40rpx;
}

.tips-title {
    display: block;
    font-size: 28rpx;
    font-weight: bold;
    color: #d48806;
    margin-bottom: 16rpx;
}

.tips-content {
    display: flex;
    flex-direction: column;
    gap: 8rpx;
}

.tip-item {
    font-size: 24rpx;
    color: #d48806;
    line-height: 1.6;
}

.submit-btn {
    width: 100%;
    height: 96rpx;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
    border-radius: 48rpx;
    font-size: 32rpx;
    font-weight: 500;
    border: none;
    margin-bottom: 40rpx;
}

.submit-btn[disabled] {
    background: #ccc;
    opacity: 0.6;
}
</style>
