const BASE_URL = 'https://api.example.com'

const request = (options) => {
    return new Promise((resolve, reject) => {
        uni.request({
            url: BASE_URL + options.url,
            method: options.method || 'GET',
            data: options.data || {},
            header: {
                'Content-Type': 'application/json',
                ...options.header
            },
            timeout: 10000,
            success: (res) => {
                const { statusCode, data } = res
                if (statusCode >= 200 && statusCode < 300) {
                    if (data.code === 200 || data.code === 0) {
                        resolve(data.data || data)
                    } else if (data.code === 401) {
                        uni.removeStorageSync('access_token')
                        uni.showToast({
                            title: '登录已过期，请重新登录',
                            icon: 'none',
                            duration: 2000
                        })
                        setTimeout(() => {
                            uni.navigateTo({
                                url: '/pages/login/login'
                            })
                        }, 1500)
                        reject(new Error(data.message || '未授权'))
                    } else {
                        uni.showToast({
                            title: data.message || '请求失败',
                            icon: 'none',
                            duration: 2000
                        })
                        reject(new Error(data.message || '请求失败'))
                    }
                } else {
                    handleHttpError(statusCode)
                    reject(new Error(`HTTP Error: ${statusCode}`))
                }
            },
            fail: (err) => {
                console.error('Request failed:', err)
                if (err.errMsg.includes('timeout')) {
                    uni.showToast({
                        title: '请求超时，请检查网络',
                        icon: 'none',
                        duration: 2000
                    })
                } else if (err.errMsg.includes('fail')) {
                    uni.showToast({
                        title: '网络连接失败，请检查网络设置',
                        icon: 'none',
                        duration: 2000
                    })
                } else {
                    uni.showToast({
                        title: '请求失败，请稍后重试',
                        icon: 'none',
                        duration: 2000
                    })
                }
                reject(err)
            }
        })
    })
}

const handleHttpError = (statusCode) => {
    let message = ''
    switch (statusCode) {
        case 400:
            message = '请求参数错误'
            break
        case 401:
            message = '未授权，请重新登录'
            break
        case 403:
            message = '拒绝访问'
            break
        case 404:
            message = '请求资源不存在'
            break
        case 405:
            message = '请求方法不允许'
            break
        case 408:
            message = '请求超时'
            break
        case 500:
            message = '服务器内部错误'
            break
        case 501:
            message = '服务未实现'
            break
        case 502:
            message = '网关错误'
            break
        case 503:
            message = '服务不可用'
            break
        case 504:
            message = '网关超时'
            break
        case 505:
            message = 'HTTP版本不受支持'
            break
        default:
            message = `请求失败，错误码: ${statusCode}`
    }
    uni.showToast({
        title: message,
        icon: 'none',
        duration: 2000
    })
}

const addTokenInterceptor = () => {
    uni.addInterceptor('request', {
        invoke(args) {
            const token = uni.getStorageSync('access_token')
            if (token) {
                args.header = args.header || {}
                args.header['Authorization'] = `Bearer ${token}`
            }
            args.header = args.header || {}
            args.header['X-Requested-With'] = 'XMLHttpRequest'
            return args
        },
        success(args) {
            return args
        },
        fail(err) {
            return err
        }
    })

    uni.addInterceptor('uploadFile', {
        invoke(args) {
            const token = uni.getStorageSync('access_token')
            if (token) {
                args.header = args.header || {}
                args.header['Authorization'] = `Bearer ${token}`
            }
            return args
        },
        success(args) {
            const data = JSON.parse(args.data)
            if (data.code === 401) {
                uni.removeStorageSync('access_token')
                uni.showToast({
                    title: '登录已过期，请重新登录',
                    icon: 'none'
                })
                setTimeout(() => {
                    uni.navigateTo({
                        url: '/pages/login/login'
                    })
                }, 1500)
            }
            return args
        },
        fail(err) {
            return err
        }
    })
}

const http = {
    get(url, data = {}, options = {}) {
        return request({
            url,
            method: 'GET',
            data,
            ...options
        })
    },
    post(url, data = {}, options = {}) {
        return request({
            url,
            method: 'POST',
            data,
            ...options
        })
    },
    put(url, data = {}, options = {}) {
        return request({
            url,
            method: 'PUT',
            data,
            ...options
        })
    },
    delete(url, data = {}, options = {}) {
        return request({
            url,
            method: 'DELETE',
            data,
            ...options
        })
    },
    upload(url, filePath, name = 'file', formData = {}, options = {}) {
        return new Promise((resolve, reject) => {
            uni.uploadFile({
                url: BASE_URL + url,
                filePath,
                name,
                formData,
                header: {
                    ...options.header
                },
                success: (res) => {
                    const data = JSON.parse(res.data)
                    if (data.code === 200 || data.code === 0) {
                        resolve(data.data || data)
                    } else {
                        uni.showToast({
                            title: data.message || '上传失败',
                            icon: 'none'
                        })
                        reject(new Error(data.message || '上传失败'))
                    }
                },
                fail: (err) => {
                    uni.showToast({
                        title: '上传失败，请重试',
                        icon: 'none'
                    })
                    reject(err)
                }
            })
        })
    }
}

export {
    request,
    http,
    addTokenInterceptor,
    BASE_URL
}

export default http
