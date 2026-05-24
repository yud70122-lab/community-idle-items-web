<template>
    <view class="address-edit-container">
        <view class="form-section">
            <view class="form-item">
                <text class="form-label required">收货人</text>
                <input
                    v-model="formData.name"
                    placeholder="请输入收货人姓名"
                    maxlength="20"
                    class="form-input"
                />
            </view>

            <view class="form-item">
                <text class="form-label required">手机号</text>
                <input
                    v-model="formData.phone"
                    placeholder="请输入手机号"
                    type="number"
                    maxlength="11"
                    class="form-input"
                    @blur="validatePhone"
                />
                <text v-if="phoneError" class="error-text">{{ phoneError }}</text>
            </view>

            <view class="form-item">
                <text class="form-label required">所在地区</text>
                <picker
                    mode="region"
                    :value="regionValue"
                    :custom-item="customItem"
                    @change="onRegionChange"
                    class="region-picker"
                >
                    <view class="picker-content">
                        <text v-if="formData.province" class="picker-value">
                            {{ formData.province }} {{ formData.city }} {{ formData.district }}
                        </text>
                        <text v-else class="picker-placeholder">请选择省市区</text>
                        <text class="picker-arrow">›</text>
                    </view>
                </picker>
            </view>

            <view class="form-item">
                <text class="form-label required">详细地址</text>
                <view class="detail-address-wrap">
                    <textarea
                        v-model="formData.detail"
                        placeholder="请输入详细地址，如街道、门牌号等"
                        maxlength="100"
                        class="form-textarea"
                        :class="{ 'with-location': isLocating }"
                    />
                    <button
                        class="location-btn"
                        :loading="isLocating"
                        :disabled="isLocating"
                        @click="getLocationAndReverseGeo"
                    >
                        <text class="location-icon">📍</text>
                        <text class="location-text">{{ isLocating ? '定位中...' : '获取当前位置' }}</text>
                    </button>
                </view>
                <view v-if="locationInfo" class="location-info">
                    <text class="location-address">📍 {{ locationInfo }}</text>
                </view>
            </view>

            <view class="form-item switch-item">
                <text class="form-label">设为默认地址</text>
                <switch
                    :checked="formData.isDefault"
                    @change="formData.isDefault = $event.detail.value"
                    color="#667eea"
                />
            </view>
        </view>

        <view class="tip-section" v-if="locationError">
            <text class="tip-text">{{ locationError }}</text>
        </view>

        <view class="button-section">
            <button
                class="save-btn"
                :loading="saving"
                :disabled="saving"
                @click="handleSubmit"
            >
                {{ saving ? '保存中...' : '保存地址' }}
            </button>
        </view>
    </view>
</template>

<script>
import { getLocationAndReverseGeo as mapGetLocationAndReverseGeo } from '@/common/map.js'
import http from '@/common/interceptor.js'

export default {
    data() {
        return {
            formData: {
                id: '',
                name: '',
                phone: '',
                province: '',
                city: '',
                district: '',
                detail: '',
                isDefault: false,
                latitude: null,
                longitude: null
            },
            regionValue: [],
            customItem: '全部',
            phoneError: '',
            isLocating: false,
            locationInfo: '',
            locationError: '',
            saving: false,
            isEdit: false
        }
    },
    onLoad(options) {
        if (options.id) {
            this.isEdit = true
            this.loadAddressDetail(options.id)
        }
    },
    methods: {
        loadAddressDetail(id) {
            uni.showLoading({ title: '加载中...' })
            http.get(`/api/address/${id}`)
                .then((res) => {
                    this.formData = {
                        id: res.id,
                        name: res.name,
                        phone: res.phone,
                        province: res.province,
                        city: res.city,
                        district: res.district,
                        detail: res.detail,
                        isDefault: res.isDefault || false,
                        latitude: res.latitude,
                        longitude: res.longitude
                    }
                    this.regionValue = [res.province, res.city, res.district]
                })
                .catch((err) => {
                    console.error('Load address failed:', err)
                    uni.showToast({
                        title: '加载失败',
                        icon: 'none'
                    })
                })
                .finally(() => {
                    uni.hideLoading()
                })
        },

        onRegionChange(e) {
            const [province, city, district] = e.detail.value
            this.formData.province = province
            this.formData.city = city
            this.formData.district = district
            this.regionValue = [province, city, district]
        },

        validatePhone() {
            const phone = this.formData.phone.trim()
            if (!phone) {
                this.phoneError = ''
                return false
            }
            const phoneReg = /^1[3-9]\d{9}$/
            if (!phoneReg.test(phone)) {
                this.phoneError = '请输入正确的手机号'
                return false
            }
            this.phoneError = ''
            return true
        },

        validateForm() {
            if (!this.formData.name.trim()) {
                uni.showToast({
                    title: '请输入收货人姓名',
                    icon: 'none'
                })
                return false
            }

            if (!this.formData.phone.trim()) {
                uni.showToast({
                    title: '请输入手机号',
                    icon: 'none'
                })
                return false
            }

            if (!this.validatePhone()) {
                uni.showToast({
                    title: '请输入正确的手机号',
                    icon: 'none'
                })
                return false
            }

            if (!this.formData.province || !this.formData.city || !this.formData.district) {
                uni.showToast({
                    title: '请选择所在地区',
                    icon: 'none'
                })
                return false
            }

            if (!this.formData.detail.trim()) {
                uni.showToast({
                    title: '请输入详细地址',
                    icon: 'none'
                })
                return false
            }

            if (this.formData.detail.trim().length < 5) {
                uni.showToast({
                    title: '详细地址不能少于5个字符',
                    icon: 'none'
                })
                return false
            }

            return true
        },

        async getLocationAndReverseGeo() {
            this.isLocating = true
            this.locationError = ''
            this.locationInfo = ''

            try {
                const result = await mapGetLocationAndReverseGeo()

                this.formData.province = result.province
                this.formData.city = result.city
                this.formData.district = result.district
                this.formData.latitude = result.location.latitude
                this.formData.longitude = result.location.longitude
                this.regionValue = [result.province, result.city, result.district]

                let detailText = result.detailedAddress
                if (result.poiName) {
                    detailText = `${result.poiName}（${detailText}）`
                }
                this.formData.detail = detailText

                this.locationInfo = result.fullAddress

                uni.showToast({
                    title: '定位成功',
                    icon: 'success'
                })
            } catch (error) {
                console.error('Get location failed:', error)

                let errorMsg = '定位失败，请稍后重试'
                if (error.errMsg) {
                    if (error.errMsg.includes('auth deny') || error.errMsg.includes('authorize')) {
                        errorMsg = '请在设置中开启位置权限'
                    } else if (error.errMsg.includes('cancel')) {
                        errorMsg = '已取消定位'
                    } else if (error.errMsg.includes('timeout')) {
                        errorMsg = '定位超时，请检查网络'
                    }
                } else if (error.message) {
                    errorMsg = error.message
                }

                this.locationError = errorMsg

                uni.showToast({
                    title: errorMsg,
                    icon: 'none',
                    duration: 3000
                })
            } finally {
                this.isLocating = false
            }
        },

        async handleSubmit() {
            if (!this.validateForm()) return

            this.saving = true
            try {
                const submitData = {
                    name: this.formData.name.trim(),
                    phone: this.formData.phone.trim(),
                    province: this.formData.province,
                    city: this.formData.city,
                    district: this.formData.district,
                    detail: this.formData.detail.trim(),
                    isDefault: this.formData.isDefault,
                    latitude: this.formData.latitude,
                    longitude: this.formData.longitude
                }

                if (this.isEdit && this.formData.id) {
                    await http.put(`/api/address/${this.formData.id}`, submitData)
                } else {
                    await http.post('/api/address', submitData)
                }

                uni.showToast({
                    title: '保存成功',
                    icon: 'success'
                })

                setTimeout(() => {
                    uni.navigateBack()
                }, 1000)
            } catch (error) {
                console.error('Save address failed:', error)
            } finally {
                this.saving = false
            }
        }
    }
}
</script>

<style lang="scss" scoped>
.address-edit-container {
    min-height: 100vh;
    background-color: #f5f5f5;
    padding-bottom: 120rpx;
}

.form-section {
    background: #fff;
    margin: 20rpx;
    border-radius: 16rpx;
    padding: 10rpx 0;
}

.form-item {
    padding: 30rpx;
    border-bottom: 1rpx solid #f0f0f0;
    position: relative;
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

.form-label.required::before {
    content: '*';
    color: #ff4d4f;
    margin-right: 6rpx;
}

.form-input {
    width: 100%;
    height: 80rpx;
    font-size: 30rpx;
    color: #333;
    background: #f9f9f9;
    border-radius: 12rpx;
    padding: 0 20rpx;
    box-sizing: border-box;
}

.error-text {
    display: block;
    font-size: 24rpx;
    color: #ff4d4f;
    margin-top: 12rpx;
}

.region-picker {
    width: 100%;
}

.picker-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 80rpx;
    background: #f9f9f9;
    border-radius: 12rpx;
    padding: 0 20rpx;
}

.picker-value {
    font-size: 30rpx;
    color: #333;
    flex: 1;
}

.picker-placeholder {
    font-size: 30rpx;
    color: #999;
    flex: 1;
}

.picker-arrow {
    font-size: 36rpx;
    color: #ccc;
    transform: rotate(90deg);
}

.detail-address-wrap {
    position: relative;
}

.form-textarea {
    width: 100%;
    height: 180rpx;
    font-size: 30rpx;
    color: #333;
    background: #f9f9f9;
    border-radius: 12rpx;
    padding: 20rpx;
    box-sizing: border-box;
    line-height: 1.6;
}

.form-textarea.with-location {
    padding-bottom: 80rpx;
}

.location-btn {
    position: absolute;
    right: 16rpx;
    bottom: 16rpx;
    height: 56rpx;
    padding: 0 20rpx;
    background: #fff;
    border: 1rpx solid #667eea;
    border-radius: 28rpx;
    display: flex;
    align-items: center;
    gap: 8rpx;
    font-size: 24rpx;
    color: #667eea;
    line-height: 1;
    margin: 0;
}

.location-btn::after {
    border: none;
}

.location-btn[disabled] {
    opacity: 0.6;
}

.location-icon {
    font-size: 28rpx;
}

.location-text {
    font-size: 24rpx;
}

.location-info {
    margin-top: 16rpx;
    padding: 16rpx 20rpx;
    background: #f0f9ff;
    border-radius: 8rpx;
}

.location-address {
    font-size: 24rpx;
    color: #1890ff;
    line-height: 1.5;
}

.switch-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.switch-item .form-label {
    margin-bottom: 0;
}

.tip-section {
    margin: 20rpx;
    padding: 20rpx;
    background: #fff2f0;
    border-radius: 12rpx;
    border-left: 6rpx solid #ff4d4f;
}

.tip-text {
    font-size: 24rpx;
    color: #ff4d4f;
    line-height: 1.5;
}

.button-section {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    padding: 20rpx 30rpx;
    padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
    background: #fff;
    box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);
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
