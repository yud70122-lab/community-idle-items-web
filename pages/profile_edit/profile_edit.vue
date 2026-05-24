<template>
    <view class="profile-edit-container">
        <view class="avatar-section">
            <view class="avatar-wrapper" @click="chooseAvatar">
                <image
                    v-if="formData.avatar"
                    :src="formData.avatar"
                    mode="aspectFill"
                    class="avatar-image"
                />
                <view v-else class="avatar-placeholder">
                    <text class="avatar-icon">👤</text>
                </view>

                <view v-if="avatarUploading" class="avatar-uploading-mask">
                    <view class="spinner"></view>
                    <text class="uploading-text">{{ avatarProgress }}%</text>
                </view>

                <view class="avatar-edit-badge">
                    <text class="edit-icon">📷</text>
                </view>
            </view>
            <text class="avatar-tip">点击更换头像</text>
        </view>

        <view class="form-section">
            <view class="form-item">
                <text class="form-label">昵称</text>
                <view class="form-input-wrap">
                    <input
                        v-model="formData.nickname"
                        placeholder="请输入昵称"
                        maxlength="20"
                        class="form-input"
                        @input="onNicknameInput"
                    />
                    <text class="char-count">{{ formData.nickname.length }}/20</text>
                </view>
            </view>

            <view class="form-item">
                <text class="form-label">性别</text>
                <view class="gender-group">
                    <view
                        v-for="item in genderOptions"
                        :key="item.value"
                        class="gender-option"
                        :class="{ active: formData.gender === item.value }"
                        @click="formData.gender = item.value"
                    >
                        <text class="gender-text">{{ item.label }}</text>
                    </view>
                </view>
            </view>

            <view class="form-item">
                <text class="form-label">手机号</text>
                <view class="form-input-wrap">
                    <input
                        v-model="formData.phone"
                        placeholder="请输入手机号"
                        type="number"
                        maxlength="11"
                        class="form-input"
                    />
                </view>
            </view>

            <view class="form-item">
                <text class="form-label">个人简介</text>
                <view class="form-textarea-wrap">
                    <textarea
                        v-model="formData.bio"
                        placeholder="介绍一下自己吧..."
                        maxlength="100"
                        class="form-textarea"
                        @input="onBioInput"
                    />
                    <text class="char-count">{{ formData.bio.length }}/100</text>
                </view>
            </view>
        </view>

        <view class="button-section">
            <button
                class="save-btn"
                :loading="saving"
                :disabled="!canSave || saving"
                @click="handleSave"
            >
                {{ saving ? '保存中...' : '保存' }}
            </button>
        </view>
    </view>
</template>

<script>
import { useUserStore } from '@/store/user.js'
import { compressImage } from '@/common/compress.js'
import { uploadToOSS } from '@/common/oss.js'

export default {
    data() {
        return {
            userStore: useUserStore(),
            genderOptions: [
                { label: '男', value: 'male' },
                { label: '女', value: 'female' },
                { label: '保密', value: 'secret' }
            ],
            formData: {
                avatar: '',
                nickname: '',
                gender: 'secret',
                phone: '',
                bio: ''
            },
            originalData: {
                avatar: '',
                nickname: '',
                gender: 'secret',
                phone: '',
                bio: ''
            },
            avatarUploading: false,
            avatarProgress: 0,
            saving: false
        }
    },
    computed: {
        canSave() {
            if (!this.formData.nickname.trim()) {
                return false
            }
            const hasChanged =
                this.formData.avatar !== this.originalData.avatar ||
                this.formData.nickname !== this.originalData.nickname ||
                this.formData.gender !== this.originalData.gender ||
                this.formData.phone !== this.originalData.phone ||
                this.formData.bio !== this.originalData.bio
            return hasChanged
        }
    },
    onLoad() {
        this.loadUserInfo()
    },
    methods: {
        loadUserInfo() {
            const userInfo = this.userStore.userInfo
            if (userInfo) {
                this.formData = {
                    avatar: userInfo.avatar || '',
                    nickname: userInfo.nickname || '',
                    gender: userInfo.gender || 'secret',
                    phone: userInfo.phone || '',
                    bio: userInfo.bio || ''
                }
                this.originalData = { ...this.formData }
            }
        },

        chooseAvatar() {
            if (this.avatarUploading) return

            uni.chooseMedia({
                count: 1,
                mediaType: ['image'],
                sourceType: ['album', 'camera'],
                sizeType: ['compressed'],
                camera: 'front',
                success: async (res) => {
                    const tempFilePath = res.tempFiles[0].tempFilePath
                    await this.uploadAvatar(tempFilePath)
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

        async uploadAvatar(filePath) {
            this.avatarUploading = true
            this.avatarProgress = 0

            try {
                uni.showLoading({ title: '上传中...' })

                const compressedPath = await compressImage({
                    filePath: filePath,
                    quality: 0.8,
                    maxWidth: 512,
                    maxHeight: 512
                })

                uni.hideLoading()

                const uploadResult = await uploadToOSS({
                    filePath: compressedPath,
                    dir: 'avatar/',
                    onProgress: (progress) => {
                        this.avatarProgress = progress
                    }
                })

                this.formData.avatar = uploadResult.url

                uni.showToast({
                    title: '上传成功',
                    icon: 'success'
                })
            } catch (error) {
                uni.hideLoading()
                console.error('Avatar upload failed:', error)
                uni.showToast({
                    title: '上传失败，请重试',
                    icon: 'none'
                })
            } finally {
                this.avatarUploading = false
                this.avatarProgress = 0
            }
        },

        onNicknameInput(e) {
            const value = e.detail.value
            if (value.length > 20) {
                this.formData.nickname = value.substring(0, 20)
            }
        },

        onBioInput(e) {
            const value = e.detail.value
            if (value.length > 100) {
                this.formData.bio = value.substring(0, 100)
            }
        },

        validateForm() {
            if (!this.formData.nickname.trim()) {
                uni.showToast({
                    title: '请输入昵称',
                    icon: 'none'
                })
                return false
            }

            if (this.formData.phone && !/^1[3-9]\d{9}$/.test(this.formData.phone)) {
                uni.showToast({
                    title: '请输入正确的手机号',
                    icon: 'none'
                })
                return false
            }

            return true
        },

        async handleSave() {
            if (!this.validateForm()) return

            this.saving = true
            try {
                const updateData = {
                    avatar: this.formData.avatar,
                    nickname: this.formData.nickname.trim(),
                    gender: this.formData.gender,
                    phone: this.formData.phone,
                    bio: this.formData.bio.trim()
                }

                const updatedUser = await this.userStore.updateUserInfo(updateData)

                this.originalData = { ...this.formData }

                uni.showToast({
                    title: '保存成功',
                    icon: 'success'
                })

                setTimeout(() => {
                    uni.navigateBack()
                }, 1000)
            } catch (error) {
                console.error('Save profile failed:', error)
            } finally {
                this.saving = false
            }
        }
    }
}
</script>

<style lang="scss" scoped>
.profile-edit-container {
    min-height: 100vh;
    background-color: #f5f5f5;
    padding-bottom: 60rpx;
}

.avatar-section {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 60rpx 30rpx 80rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.avatar-wrapper {
    width: 180rpx;
    height: 180rpx;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    border: 4rpx solid rgba(255, 255, 255, 0.5);
    overflow: hidden;
}

.avatar-image {
    width: 100%;
    height: 100%;
}

.avatar-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
}

.avatar-icon {
    font-size: 80rpx;
}

.avatar-uploading-mask {
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
    margin-bottom: 8rpx;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

.uploading-text {
    font-size: 22rpx;
    color: #fff;
}

.avatar-edit-badge {
    position: absolute;
    right: 0;
    bottom: 0;
    width: 52rpx;
    height: 52rpx;
    background: #07c160;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 4rpx solid #fff;
}

.edit-icon {
    font-size: 24rpx;
}

.avatar-tip {
    font-size: 24rpx;
    color: rgba(255, 255, 255, 0.8);
    margin-top: 20rpx;
}

.form-section {
    background: #fff;
    margin: -30rpx 30rpx 0;
    border-radius: 20rpx;
    padding: 10rpx 0;
    position: relative;
    z-index: 10;
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
}

.form-item {
    padding: 30rpx;
    border-bottom: 1rpx solid #f0f0f0;
}

.form-item:last-child {
    border-bottom: none;
}

.form-label {
    display: block;
    font-size: 28rpx;
    color: #333;
    font-weight: 500;
    margin-bottom: 20rpx;
}

.form-input-wrap {
    position: relative;
    display: flex;
    align-items: center;
    background: #f9f9f9;
    border-radius: 12rpx;
    padding: 0 20rpx;
}

.form-input {
    flex: 1;
    height: 88rpx;
    font-size: 30rpx;
    color: #333;
}

.char-count {
    font-size: 24rpx;
    color: #999;
    margin-left: 12rpx;
    flex-shrink: 0;
}

.gender-group {
    display: flex;
    gap: 20rpx;
}

.gender-option {
    flex: 1;
    height: 88rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f9f9f9;
    border: 2rpx solid transparent;
    border-radius: 12rpx;
    transition: all 0.3s;
}

.gender-option.active {
    background: rgba(102, 126, 234, 0.1);
    border-color: #667eea;
}

.gender-text {
    font-size: 30rpx;
    color: #666;
}

.gender-option.active .gender-text {
    color: #667eea;
    font-weight: 500;
}

.form-textarea-wrap {
    position: relative;
    background: #f9f9f9;
    border-radius: 12rpx;
    padding: 20rpx;
}

.form-textarea {
    width: 100%;
    height: 180rpx;
    font-size: 30rpx;
    color: #333;
    line-height: 1.6;
}

.form-textarea-wrap .char-count {
    position: absolute;
    right: 20rpx;
    bottom: 12rpx;
    margin: 0;
}

.button-section {
    padding: 60rpx 30rpx 0;
}

.save-btn {
    width: 100%;
    height: 96rpx;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
    border-radius: 48rpx;
    font-size: 32rpx;
    font-weight: 500;
    border: none;
}

.save-btn[disabled] {
    background: #ccc;
    opacity: 0.6;
}
</style>
