<template>
    <view class="login-container">
        <view class="logo-section">
            <view class="logo">
                <text class="logo-icon">🏠</text>
            </view>
            <text class="app-name">社区闲置物品</text>
            <text class="app-desc">让闲置物品流动起来</text>
        </view>

        <view class="form-section">
            <view class="input-group" v-if="loginType === 'account'">
                <view class="input-item">
                    <text class="input-icon">📱</text>
                    <input
                        v-model="formData.phone"
                        type="number"
                        placeholder="请输入手机号"
                        maxlength="11"
                        class="input-field"
                    />
                </view>
                <view class="input-item">
                    <text class="input-icon">🔒</text>
                    <input
                        v-model="formData.password"
                        :password="!showPassword"
                        placeholder="请输入密码"
                        maxlength="20"
                        class="input-field"
                    />
                    <text class="toggle-password" @click="showPassword = !showPassword">
                        {{ showPassword ? '👁️' : '👁️‍🗨️' }}
                    </text>
                </view>
            </view>

            <view class="input-group" v-if="loginType === 'register'">
                <view class="input-item">
                    <text class="input-icon">📱</text>
                    <input
                        v-model="formData.phone"
                        type="number"
                        placeholder="请输入手机号"
                        maxlength="11"
                        class="input-field"
                    />
                </view>
                <view class="input-item">
                    <text class="input-icon">🔐</text>
                    <input
                        v-model="formData.code"
                        type="number"
                        placeholder="请输入验证码"
                        maxlength="6"
                        class="input-field"
                    />
                    <button
                        class="code-btn"
                        :disabled="countdown > 0"
                        @click="sendCode"
                    >
                        {{ countdown > 0 ? countdown + 's' : '获取验证码' }}
                    </button>
                </view>
                <view class="input-item">
                    <text class="input-icon">🔒</text>
                    <input
                        v-model="formData.password"
                        :password="!showPassword"
                        placeholder="请设置密码"
                        maxlength="20"
                        class="input-field"
                    />
                    <text class="toggle-password" @click="showPassword = !showPassword">
                        {{ showPassword ? '👁️' : '👁️‍🗨️' }}
                    </text>
                </view>
            </view>

            <button
                class="login-btn primary"
                :loading="loading"
                :disabled="loading"
                @click="handleLogin"
                v-if="loginType === 'account'"
            >
                {{ loading ? '登录中...' : '登录' }}
            </button>

            <button
                class="login-btn primary"
                :loading="loading"
                :disabled="loading"
                @click="handleRegister"
                v-if="loginType === 'register'"
            >
                {{ loading ? '注册中...' : '注册并登录' }}
            </button>

            <!-- #ifdef MP-WEIXIN -->
            <button
                class="login-btn wechat"
                :loading="loading"
                :disabled="loading"
                open-type="getPhoneNumber"
                @getphonenumber="getPhoneNumber"
            >
                <text class="btn-icon">💬</text>
                微信一键登录
            </button>
            <!-- #endif -->

            <view class="login-type-switch">
                <text
                    class="switch-text"
                    @click="toggleLoginType"
                >
                    {{ loginType === 'account' ? '没有账号？立即注册' : '已有账号？去登录' }}
                </text>
            </view>
        </view>

        <view class="agreement">
            <checkbox
                :checked="agreed"
                @click="agreed = !agreed"
                class="agreement-checkbox"
            />
            <text class="agreement-text">
                我已阅读并同意
                <text class="link">《用户协议》</text>
                和
                <text class="link">《隐私政策》</text>
            </text>
        </view>
    </view>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useUserStore } from '@/store/user.js'
import http from '@/common/interceptor.js'

const userStore = useUserStore()

const loginType = ref('account')
const loading = ref(false)
const showPassword = ref(false)
const agreed = ref(true)
const countdown = ref(0)

const formData = reactive({
    phone: '',
    password: '',
    code: ''
})

const toggleLoginType = () => {
    loginType.value = loginType.value === 'account' ? 'register' : 'account'
    formData.phone = ''
    formData.password = ''
    formData.code = ''
}

const sendCode = () => {
    if (!formData.phone) {
        uni.showToast({
            title: '请输入手机号',
            icon: 'none'
        })
        return
    }
    if (!/^1[3-9]\d{9}$/.test(formData.phone)) {
        uni.showToast({
            title: '手机号格式不正确',
            icon: 'none'
        })
        return
    }

    http.post('/api/auth/send-code', { phone: formData.phone })
        .then(() => {
            uni.showToast({
                title: '验证码已发送',
                icon: 'success'
            })
            countdown.value = 60
            const timer = setInterval(() => {
                countdown.value--
                if (countdown.value <= 0) {
                    clearInterval(timer)
                }
            }, 1000)
        })
        .catch(() => {
            uni.showToast({
                title: '发送失败，请重试',
                icon: 'none'
            })
        })
}

const validateForm = () => {
    if (!agreed.value) {
        uni.showToast({
            title: '请先同意用户协议',
            icon: 'none'
        })
        return false
    }
    if (!formData.phone) {
        uni.showToast({
            title: '请输入手机号',
            icon: 'none'
        })
        return false
    }
    if (!/^1[3-9]\d{9}$/.test(formData.phone)) {
        uni.showToast({
            title: '手机号格式不正确',
            icon: 'none'
        })
        return false
    }
    if (!formData.password) {
        uni.showToast({
            title: '请输入密码',
            icon: 'none'
        })
        return false
    }
    if (formData.password.length < 6) {
        uni.showToast({
            title: '密码长度不能少于6位',
            icon: 'none'
        })
        return false
    }
    if (loginType.value === 'register' && !formData.code) {
        uni.showToast({
            title: '请输入验证码',
            icon: 'none'
        })
        return false
    }
    return true
}

const handleLogin = async () => {
    if (!validateForm()) return

    loading.value = true
    try {
        await userStore.login({
            phone: formData.phone,
            password: formData.password
        })
        uni.showToast({
            title: '登录成功',
            icon: 'success'
        })
        setTimeout(() => {
            uni.switchTab({
                url: '/pages/index/index'
            })
        }, 500)
    } catch (error) {
        console.error('Login failed:', error)
    } finally {
        loading.value = false
    }
}

const handleRegister = async () => {
    if (!validateForm()) return

    loading.value = true
    try {
        const res = await http.post('/api/auth/register', {
            phone: formData.phone,
            password: formData.password,
            code: formData.code
        })
        const { token: accessToken, user } = res
        userStore.setToken(accessToken)
        userStore.setUserInfo(user)

        uni.showToast({
            title: '注册成功',
            icon: 'success'
        })
        setTimeout(() => {
            uni.switchTab({
                url: '/pages/index/index'
            })
        }, 500)
    } catch (error) {
        console.error('Register failed:', error)
    } finally {
        loading.value = false
    }
}

const getPhoneNumber = async (e) => {
    if (!agreed.value) {
        uni.showToast({
            title: '请先同意用户协议',
            icon: 'none'
        })
        return
    }

    if (e.detail.errMsg === 'getPhoneNumber:ok') {
        loading.value = true
        try {
            await userStore.loginByPhone(e.detail.code)
            uni.showToast({
                title: '登录成功',
                icon: 'success'
            })
            setTimeout(() => {
                uni.switchTab({
                    url: '/pages/index/index'
                })
            }, 500)
        } catch (error) {
            console.error('Wechat login failed:', error)
        } finally {
            loading.value = false
        }
    } else {
        uni.showToast({
            title: '已取消授权',
            icon: 'none'
        })
    }
}
</script>

<style lang="scss" scoped>
.login-container {
    min-height: 100vh;
    padding: 120rpx 60rpx 60rpx;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    flex-direction: column;
}

.logo-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 80rpx;
}

.logo {
    width: 160rpx;
    height: 160rpx;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 40rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 30rpx;
    backdrop-filter: blur(10px);
}

.logo-icon {
    font-size: 80rpx;
}

.app-name {
    font-size: 48rpx;
    font-weight: bold;
    color: #fff;
    margin-bottom: 16rpx;
}

.app-desc {
    font-size: 28rpx;
    color: rgba(255, 255, 255, 0.8);
}

.form-section {
    background: #fff;
    border-radius: 32rpx;
    padding: 60rpx 40rpx;
    box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.1);
}

.input-group {
    margin-bottom: 40rpx;
}

.input-item {
    display: flex;
    align-items: center;
    height: 100rpx;
    border-bottom: 1rpx solid #f0f0f0;
    position: relative;
}

.input-icon {
    font-size: 36rpx;
    margin-right: 20rpx;
}

.input-field {
    flex: 1;
    height: 100%;
    font-size: 30rpx;
    color: #333;
}

.toggle-password {
    font-size: 32rpx;
    padding: 10rpx;
}

.code-btn {
    font-size: 26rpx;
    color: #667eea;
    background: transparent;
    border: none;
    padding: 0;
    margin: 0;
    line-height: 1;
}

.code-btn[disabled] {
    color: #999;
}

.login-btn {
    width: 100%;
    height: 96rpx;
    border-radius: 48rpx;
    font-size: 32rpx;
    font-weight: 500;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    margin-bottom: 24rpx;
}

.login-btn.primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
}

.login-btn.wechat {
    background: #07c160;
    color: #fff;
}

.btn-icon {
    margin-right: 12rpx;
}

.login-btn[disabled] {
    opacity: 0.6;
}

.login-type-switch {
    text-align: center;
    margin-top: 20rpx;
}

.switch-text {
    font-size: 28rpx;
    color: #667eea;
}

.agreement {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 40rpx;
}

.agreement-checkbox {
    margin-right: 12rpx;
    transform: scale(0.9);
}

.agreement-text {
    font-size: 24rpx;
    color: rgba(255, 255, 255, 0.8);
}

.link {
    color: #fff;
    text-decoration: underline;
}
</style>
