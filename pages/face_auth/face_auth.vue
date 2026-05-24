<template>
    <view class="face-auth-container">
        <view class="progress-steps">
            <view
                v-for="(step, index) in steps"
                :key="step.key"
                class="step-item"
                :class="{
                    active: currentStep === step.key,
                    completed: completedSteps.includes(step.key)
                }"
            >
                <view class="step-circle">
                    <text v-if="completedSteps.includes(step.key)" class="step-check">✓</text>
                    <text v-else>{{ index + 1 }}</text>
                </view>
                <text class="step-label">{{ step.label }}</text>
                <view v-if="index < steps.length - 1" class="step-line"></view>
            </view>
        </view>

        <view v-if="currentStep === 'id_card'" class="step-content">
            <view class="step-header">
                <text class="step-title">上传身份证</text>
                <text class="step-desc">请上传身份证正反面照片</text>
            </view>

            <view class="id-card-upload">
                <view
                    class="upload-card"
                    :class="{ 'has-image': idCardFront.tempPath }"
                    @click="chooseIdCard('front')"
                >
                    <image
                        v-if="idCardFront.tempPath"
                        :src="idCardFront.tempPath"
                        mode="aspectFill"
                        class="card-image"
                    />
                    <view v-else class="upload-placeholder">
                        <text class="upload-icon">📷</text>
                        <text class="upload-text">身份证人像面</text>
                        <text class="upload-tip">点击上传</text>
                    </view>
                    <view
                        v-if="idCardFront.status === 'uploading'"
                        class="uploading-mask"
                    >
                        <view class="spinner"></view>
                        <text class="uploading-text">{{ idCardFront.progress }}%</text>
                    </view>
                </view>

                <view
                    class="upload-card"
                    :class="{ 'has-image': idCardBack.tempPath }"
                    @click="chooseIdCard('back')"
                >
                    <image
                        v-if="idCardBack.tempPath"
                        :src="idCardBack.tempPath"
                        mode="aspectFill"
                        class="card-image"
                    />
                    <view v-else class="upload-placeholder">
                        <text class="upload-icon">📷</text>
                        <text class="upload-text">身份证国徽面</text>
                        <text class="upload-tip">点击上传</text>
                    </view>
                    <view
                        v-if="idCardBack.status === 'uploading'"
                        class="uploading-mask"
                    >
                        <view class="spinner"></view>
                        <text class="uploading-text">{{ idCardBack.progress }}%</text>
                    </view>
                </view>
            </view>

            <view class="id-card-info">
                <view class="info-item">
                    <text class="info-label">真实姓名</text>
                    <input
                        v-model="formData.realName"
                        placeholder="请输入真实姓名"
                        class="info-input"
                    />
                </view>
                <view class="info-item">
                    <text class="info-label">身份证号</text>
                    <input
                        v-model="formData.idCard"
                        placeholder="请输入18位身份证号码"
                        maxlength="18"
                        class="info-input"
                    />
                </view>
            </view>

            <button
                class="next-btn"
                :disabled="!canGoNext('id_card')"
                @click="goToNextStep"
            >
                下一步
            </button>
        </view>

        <view v-if="currentStep === 'face_verify'" class="step-content">
            <view class="step-header">
                <text class="step-title">人脸识别</text>
                <text class="step-desc">请完成人脸识别以验证身份</text>
            </view>

            <view class="face-guide">
                <view class="guide-icon">
                    <text class="face-emoji">😊</text>
                </view>
                <text class="guide-title">请将面部对准框内</text>
                <view class="guide-tips">
                    <text class="tip-item">•  请确保光线充足，面部清晰可见</text>
                    <text class="tip-item">•  请不要佩戴帽子、口罩、墨镜</text>
                    <text class="tip-item">•  请保持面部正对摄像头</text>
                </view>
            </view>

            <view v-if="faceStatus === 'pending'" class="face-action">
                <button class="face-btn" :loading="faceLoading" @click="startFaceVerify">
                    <text class="btn-icon">📹</text>
                    开始人脸识别
                </button>
                <text class="face-note">腾讯云提供人脸识别技术支持</text>
            </view>

            <view v-if="faceStatus === 'success'" class="face-result success">
                <view class="result-icon">✓</view>
                <text class="result-text">人脸识别成功</text>
                <text class="result-desc">您的身份信息已核验通过</text>
            </view>

            <view v-if="faceStatus === 'fail'" class="face-result fail">
                <view class="result-icon">✗</view>
                <text class="result-text">人脸识别失败</text>
                <text class="result-desc">{{ faceErrorMsg }}</text>
                <button class="retry-btn" @click="resetFaceVerify">重新识别</button>
            </view>

            <view class="step-buttons" v-if="faceStatus !== 'pending'">
                <button class="prev-btn" @click="goToPrevStep">上一步</button>
                <button
                    class="next-btn"
                    :disabled="faceStatus !== 'success'"
                    @click="goToNextStep"
                >
                    下一步
                </button>
            </view>
        </view>

        <view v-if="currentStep === 'complete'" class="step-content">
            <view class="step-header">
                <text class="step-title">认证完成</text>
                <text class="step-desc">您的实名认证已提交</text>
            </view>

            <view class="complete-section">
                <view class="success-animation">
                    <view class="check-circle">
                        <text class="check-icon">✓</text>
                    </view>
                </view>
                <text class="complete-title">认证申请已提交</text>
                <text class="complete-desc">我们将在1-3个工作日内完成审核</text>

                <view class="auth-info">
                    <view class="info-row">
                        <text class="row-label">真实姓名</text>
                        <text class="row-value">{{ formData.realName }}</text>
                    </view>
                    <view class="info-row">
                        <text class="row-label">身份证号</text>
                        <text class="row-value">{{ maskIdCard(formData.idCard) }}</text>
                    </view>
                    <view class="info-row">
                        <text class="row-label">认证状态</text>
                        <text class="row-value status-pending">审核中</text>
                    </view>
                </view>

                <button class="back-btn" @click="goBack">返回首页</button>
            </view>
        </view>
    </view>
</template>

<script>
import { compressImage } from '@/common/compress.js'
import { uploadToOSS } from '@/common/oss.js'
import { startWechatFaceVerify, queryFaceIdResult } from '@/common/faceid.js'
import http from '@/common/interceptor.js'

export default {
    data() {
        return {
            steps: [
                { key: 'id_card', label: '上传身份证' },
                { key: 'face_verify', label: '人脸识别' },
                { key: 'complete', label: '完成' }
            ],
            currentStep: 'id_card',
            completedSteps: [],

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

            faceStatus: 'pending',
            faceLoading: false,
            faceErrorMsg: '',
            faceResult: null
        }
    },
    methods: {
        async chooseIdCard(side) {
            const cardData = side === 'front' ? this.idCardFront : this.idCardBack

            if (cardData.status === 'uploading') return

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
                        uni.showLoading({ title: '处理中...' })

                        const compressedPath = await compressImage({
                            filePath: tempFilePath,
                            quality: 0.8,
                            maxWidth: 1920,
                            maxHeight: 1920
                        })

                        uni.hideLoading()

                        const uploadDir = side === 'front'
                            ? 'id-card/front/'
                            : 'id-card/back/'

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

                        if (side === 'front') {
                            this.extractIdCardInfo(uploadResult.url)
                        }
                    } catch (error) {
                        uni.hideLoading()
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

        async extractIdCardInfo(imageUrl) {
            try {
                const res = await http.post('/api/faceid/ocr-id-card', {
                    imageUrl: imageUrl,
                    cardSide: 'FRONT'
                })

                if (res && res.name) {
                    this.formData.realName = res.name
                }
                if (res && res.idNum) {
                    this.formData.idCard = res.idNum
                }
            } catch (error) {
                console.error('OCR ID card failed:', error)
            }
        },

        startFaceVerify() {
            if (!this.validateForm()) return

            this.faceLoading = true

            startWechatFaceVerify({
                name: this.formData.realName,
                idCard: this.formData.idCard,
                onSuccess: (result) => {
                    this.faceResult = result
                    this.faceStatus = 'success'
                    this.faceErrorMsg = ''

                    uni.showToast({
                        title: '人脸识别成功',
                        icon: 'success'
                    })
                },
                onFail: (error) => {
                    this.faceStatus = 'fail'
                    this.faceErrorMsg = error.message || '人脸识别失败'

                    uni.showToast({
                        title: this.faceErrorMsg,
                        icon: 'none',
                        duration: 3000
                    })
                },
                onComplete: () => {
                    this.faceLoading = false
                }
            })
        },

        resetFaceVerify() {
            this.faceStatus = 'pending'
            this.faceErrorMsg = ''
            this.faceResult = null
        },

        validateForm() {
            if (!this.formData.realName.trim()) {
                uni.showToast({
                    title: '请输入真实姓名',
                    icon: 'none'
                })
                return false
            }

            const idCardReg = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/
            if (!idCardReg.test(this.formData.idCard)) {
                uni.showToast({
                    title: '请输入正确的身份证号',
                    icon: 'none'
                })
                return false
            }

            if (!this.idCardFront.url || !this.idCardBack.url) {
                uni.showToast({
                    title: '请上传完整的身份证照片',
                    icon: 'none'
                })
                return false
            }

            return true
        },

        canGoNext(step) {
            if (step === 'id_card') {
                return (
                    this.formData.realName.trim() &&
                    this.idCardFront.url &&
                    this.idCardBack.url &&
                    this.idCardFront.status === 'success' &&
                    this.idCardBack.status === 'success'
                )
            }
            if (step === 'face_verify') {
                return this.faceStatus === 'success'
            }
            return false
        },

        goToNextStep() {
            const currentIndex = this.steps.findIndex(s => s.key === this.currentStep)

            if (this.currentStep === 'face_verify' && this.faceStatus === 'success') {
                this.submitAuth()
                return
            }

            if (currentIndex < this.steps.length - 1) {
                this.completedSteps.push(this.currentStep)
                this.currentStep = this.steps[currentIndex + 1].key
            }
        },

        goToPrevStep() {
            const currentIndex = this.steps.findIndex(s => s.key === this.currentStep)
            if (currentIndex > 0) {
                const stepIndex = this.completedSteps.indexOf(this.currentStep)
                if (stepIndex > -1) {
                    this.completedSteps.splice(stepIndex, 1)
                }
                this.currentStep = this.steps[currentIndex - 1].key
            }
        },

        async submitAuth() {
            uni.showLoading({ title: '提交中...' })

            try {
                await http.post('/api/faceid/submit-auth', {
                    realName: this.formData.realName,
                    idCard: this.formData.idCard,
                    idCardFrontUrl: this.idCardFront.url,
                    idCardBackUrl: this.idCardBack.url,
                    faceIdToken: this.faceResult?.faceIdToken,
                    faceVerifyResult: this.faceResult
                })

                uni.hideLoading()
                this.completedSteps.push(this.currentStep)
                this.currentStep = 'complete'
            } catch (error) {
                uni.hideLoading()
                console.error('Submit auth failed:', error)
                uni.showToast({
                    title: '提交失败，请重试',
                    icon: 'none'
                })
            }
        },

        maskIdCard(idCard) {
            if (!idCard || idCard.length < 8) return idCard
            return idCard.substring(0, 4) + '**********' + idCard.substring(idCard.length - 4)
        },

        goBack() {
            uni.switchTab({
                url: '/pages/index/index'
            })
        }
    }
}
</script>

<style lang="scss" scoped>
.face-auth-container {
    min-height: 100vh;
    background: linear-gradient(180deg, #667eea 0%, #f5f5f5 300rpx);
    padding-bottom: 60rpx;
}

.progress-steps {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 60rpx 40rpx 40rpx;
    position: relative;
}

.step-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
}

.step-circle {
    width: 60rpx;
    height: 60rpx;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28rpx;
    color: rgba(255, 255, 255, 0.6);
    font-weight: bold;
    z-index: 2;
    transition: all 0.3s;
}

.step-item.active .step-circle {
    background: #fff;
    color: #667eea;
    transform: scale(1.1);
}

.step-item.completed .step-circle {
    background: #07c160;
    color: #fff;
}

.step-check {
    font-size: 28rpx;
}

.step-label {
    font-size: 24rpx;
    color: rgba(255, 255, 255, 0.7);
    margin-top: 12rpx;
}

.step-item.active .step-label {
    color: #fff;
    font-weight: bold;
}

.step-item.completed .step-label {
    color: #fff;
}

.step-line {
    position: absolute;
    top: 30rpx;
    left: 50%;
    width: 100%;
    height: 2rpx;
    background: rgba(255, 255, 255, 0.3);
    z-index: 1;
}

.step-item.completed .step-line {
    background: #07c160;
}

.step-content {
    padding: 30rpx;
}

.step-header {
    text-align: center;
    margin-bottom: 40rpx;
}

.step-title {
    display: block;
    font-size: 36rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 12rpx;
}

.step-desc {
    font-size: 26rpx;
    color: #999;
}

.id-card-upload {
    display: flex;
    gap: 20rpx;
    margin-bottom: 30rpx;
}

.upload-card {
    flex: 1;
    aspect-ratio: 1.6 / 1;
    border: 2rpx dashed #ddd;
    border-radius: 16rpx;
    background: #fff;
    position: relative;
    overflow: hidden;
    transition: all 0.3s;
}

.upload-card.has-image {
    border-style: solid;
    border-color: #667eea;
}

.card-image {
    width: 100%;
    height: 100%;
}

.upload-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
}

.upload-icon {
    font-size: 48rpx;
    margin-bottom: 8rpx;
}

.upload-text {
    font-size: 26rpx;
    color: #666;
    margin-bottom: 4rpx;
}

.upload-tip {
    font-size: 22rpx;
    color: #999;
}

.uploading-mask {
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
}

.spinner {
    width: 48rpx;
    height: 48rpx;
    border: 4rpx solid rgba(255, 255, 255, 0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 12rpx;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

.uploading-text {
    font-size: 24rpx;
    color: #fff;
}

.id-card-info {
    background: #fff;
    border-radius: 20rpx;
    padding: 10rpx 30rpx;
    margin-bottom: 40rpx;
}

.info-item {
    display: flex;
    align-items: center;
    height: 100rpx;
    border-bottom: 1rpx solid #f0f0f0;
}

.info-item:last-child {
    border-bottom: none;
}

.info-label {
    width: 160rpx;
    font-size: 30rpx;
    color: #333;
    flex-shrink: 0;
}

.info-input {
    flex: 1;
    height: 100%;
    font-size: 30rpx;
    color: #333;
}

.next-btn, .face-btn, .back-btn {
    width: 100%;
    height: 96rpx;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
    border-radius: 48rpx;
    font-size: 32rpx;
    font-weight: 500;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
}

.next-btn[disabled], .face-btn[disabled] {
    background: #ccc;
    opacity: 0.6;
}

.btn-icon {
    margin-right: 12rpx;
    font-size: 36rpx;
}

.face-guide {
    background: #fff;
    border-radius: 20rpx;
    padding: 50rpx 30rpx;
    text-align: center;
    margin-bottom: 40rpx;
}

.guide-icon {
    width: 160rpx;
    height: 160rpx;
    margin: 0 auto 30rpx;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.face-emoji {
    font-size: 80rpx;
}

.guide-title {
    display: block;
    font-size: 32rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 24rpx;
}

.guide-tips {
    text-align: left;
    padding: 0 40rpx;
}

.tip-item {
    display: block;
    font-size: 26rpx;
    color: #666;
    line-height: 2;
}

.face-action {
    text-align: center;
}

.face-note {
    display: block;
    font-size: 22rpx;
    color: #999;
    margin-top: 20rpx;
}

.face-result {
    background: #fff;
    border-radius: 20rpx;
    padding: 60rpx 30rpx;
    text-align: center;
    margin-bottom: 40rpx;
}

.face-result.success {
    border: 2rpx solid #07c160;
}

.face-result.fail {
    border: 2rpx solid #ff4d4f;
}

.result-icon {
    width: 100rpx;
    height: 100rpx;
    border-radius: 50%;
    margin: 0 auto 24rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 48rpx;
    color: #fff;
    font-weight: bold;
}

.face-result.success .result-icon {
    background: #07c160;
}

.face-result.fail .result-icon {
    background: #ff4d4f;
}

.result-text {
    display: block;
    font-size: 32rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 12rpx;
}

.result-desc {
    font-size: 26rpx;
    color: #999;
}

.retry-btn {
    margin-top: 30rpx;
    padding: 16rpx 48rpx;
    background: transparent;
    border: 2rpx solid #667eea;
    color: #667eea;
    border-radius: 32rpx;
    font-size: 28rpx;
}

.step-buttons {
    display: flex;
    gap: 20rpx;
    margin-top: 40rpx;
}

.prev-btn {
    flex: 1;
    height: 96rpx;
    background: #f0f0f0;
    color: #666;
    border-radius: 48rpx;
    font-size: 32rpx;
    border: none;
}

.complete-section {
    background: #fff;
    border-radius: 20rpx;
    padding: 60rpx 30rpx;
    text-align: center;
}

.success-animation {
    margin-bottom: 30rpx;
}

.check-circle {
    width: 120rpx;
    height: 120rpx;
    margin: 0 auto;
    background: #07c160;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: scaleIn 0.5s ease;
}

@keyframes scaleIn {
    0% { transform: scale(0); }
    50% { transform: scale(1.2); }
    100% { transform: scale(1); }
}

.check-icon {
    font-size: 60rpx;
    color: #fff;
    font-weight: bold;
}

.complete-title {
    display: block;
    font-size: 36rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 12rpx;
}

.complete-desc {
    font-size: 26rpx;
    color: #999;
    margin-bottom: 40rpx;
}

.auth-info {
    background: #f9f9f9;
    border-radius: 16rpx;
    padding: 30rpx;
    margin-bottom: 40rpx;
    text-align: left;
}

.info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16rpx 0;
    border-bottom: 1rpx solid #eee;
}

.info-row:last-child {
    border-bottom: none;
}

.row-label {
    font-size: 28rpx;
    color: #666;
}

.row-value {
    font-size: 28rpx;
    color: #333;
    font-weight: 500;
}

.status-pending {
    color: #fa8c16 !important;
}

.back-btn {
    margin-top: 20rpx;
}
</style>
