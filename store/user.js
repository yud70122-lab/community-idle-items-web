import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import http from '@/common/interceptor.js'

export const useUserStore = defineStore('user', () => {
    const token = ref(uni.getStorageSync('access_token') || '')
    const userInfo = ref(uni.getStorageSync('user_info') || null)

    const isLoggedIn = computed(() => !!token.value)

    const setToken = (newToken) => {
        token.value = newToken
        uni.setStorageSync('access_token', newToken)
    }

    const setUserInfo = (info) => {
        userInfo.value = info
        uni.setStorageSync('user_info', info)
    }

    const login = async (loginData) => {
        try {
            const res = await http.post('/api/auth/login', loginData)
            const { token: accessToken, user } = res
            setToken(accessToken)
            setUserInfo(user)
            return res
        } catch (error) {
            throw error
        }
    }

    const loginByPhone = async (phoneCode) => {
        try {
            const res = await http.post('/api/auth/login-by-phone', {
                code: phoneCode
            })
            const { token: accessToken, user } = res
            setToken(accessToken)
            setUserInfo(user)
            return res
        } catch (error) {
            throw error
        }
    }

    const logout = () => {
        token.value = ''
        userInfo.value = null
        uni.removeStorageSync('access_token')
        uni.removeStorageSync('user_info')
    }

    const updateUserInfo = async (data) => {
        try {
            const res = await http.put('/api/user/info', data)
            setUserInfo(res)
            return res
        } catch (error) {
            throw error
        }
    }

    return {
        token,
        userInfo,
        isLoggedIn,
        setToken,
        setUserInfo,
        login,
        loginByPhone,
        logout,
        updateUserInfo
    }
})
