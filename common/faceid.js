import http from './interceptor.js'

const FACEID_CONFIG = {
    region: 'ap-guangzhou',
    appId: 'your-appid',
    h5Url: 'https://faceid.qq.com/api/v1/faceid/h5'
}

const getFaceIdToken = async (params = {}) => {
    try {
        const res = await http.post('/api/faceid/get-token', {
            ...params,
            scene: 'REAL_NAME_AUTH'
        })
        return res
    } catch (error) {
        console.error('Get FaceID token failed:', error)
        throw error
    }
}

const queryFaceIdResult = async (faceIdToken) => {
    try {
        const res = await http.post('/api/faceid/query-result', {
            faceIdToken: faceIdToken
        })
        return res
    } catch (error) {
        console.error('Query FaceID result failed:', error)
        throw error
    }
}

const startWechatFaceVerify = ({ name, idCard, onSuccess, onFail, onComplete }) => {
    // #ifdef MP-WEIXIN
    getFaceIdToken({ name, idCard })
        .then((tokenData) => {
            const { faceIdToken, orderNo } = tokenData

            wx.startFacialRecognitionVerify({
                name: name,
                idCard: idCard,
                verifyProgress: (res) => {
                    console.log('Face verify progress:', res)
                },
                success: (res) => {
                    if (res.verifyResult === 'ok') {
                        queryFaceIdResult(faceIdToken)
                            .then((result) => {
                                onSuccess && onSuccess({
                                    ...result,
                                    faceIdToken: faceIdToken,
                                    orderNo: orderNo,
                                    verifyResult: res
                                })
                            })
                            .catch((err) => {
                                onFail && onFail(err)
                            })
                    } else {
                        onFail && onFail(new Error('人脸识别失败：' + res.errMsg))
                    }
                },
                fail: (err) => {
                    console.error('Wechat face verify failed:', err)

                    let errorMsg = '人脸识别失败'
                    if (err.errMsg) {
                        if (err.errMsg.includes('cancel')) {
                            errorMsg = '已取消人脸识别'
                        } else if (err.errMsg.includes('not support')) {
                            errorMsg = '当前微信版本不支持人脸核身'
                        } else if (err.errMsg.includes('fail auth')) {
                            errorMsg = '实名认证信息不匹配'
                        } else if (err.errMsg.includes('fail system')) {
                            errorMsg = '系统错误，请稍后重试'
                        }
                    }

                    onFail && onFail(new Error(errorMsg))
                },
                complete: () => {
                    onComplete && onComplete()
                }
            })
        })
        .catch((err) => {
            onFail && onFail(err)
        })
    // #endif

    // #ifndef MP-WEIXIN
    startH5FaceVerify({ name, idCard, onSuccess, onFail, onComplete })
    // #endif
}

const startH5FaceVerify = ({ name, idCard, onSuccess, onFail, onComplete }) => {
    getFaceIdToken({ name, idCard, h5: true })
        .then((tokenData) => {
            const { faceIdToken, orderNo, h5Url, nonce, sign, userId } = tokenData

            const verifyUrl = buildH5VerifyUrl({
                faceIdToken,
                h5Url: h5Url || FACEID_CONFIG.h5Url,
                nonce,
                sign,
                userId,
                orderNo,
                name,
                idCard,
                redirectUrl: encodeURIComponent(window.location.href)
            })

            const authWindow = window.open(verifyUrl, '_blank', 'width=400,height=600')

            const checkInterval = setInterval(() => {
                try {
                    if (authWindow.closed) {
                        clearInterval(checkInterval)

                        queryFaceIdResult(faceIdToken)
                            .then((result) => {
                                if (result.status === 'success') {
                                    onSuccess && onSuccess({
                                        ...result,
                                        faceIdToken: faceIdToken,
                                        orderNo: orderNo
                                    })
                                } else {
                                    onFail && onFail(new Error(result.msg || '人脸识别未完成'))
                                }
                            })
                            .catch((err) => {
                                onFail && onFail(err)
                            })
                            .finally(() => {
                                onComplete && onComplete()
                            })
                    }
                } catch (e) {
                    if (e.name === 'SecurityError') {
                    } else {
                        console.error('Check window error:', e)
                    }
                }
            }, 1000)

            setTimeout(() => {
                clearInterval(checkInterval)
                if (!authWindow.closed) {
                    authWindow.close()
                }
            }, 5 * 60 * 1000)
        })
        .catch((err) => {
            onFail && onFail(err)
            onComplete && onComplete()
        })
}

const buildH5VerifyUrl = (params) => {
    const { faceIdToken, h5Url, nonce, sign, userId, orderNo, name, idCard, redirectUrl } = params

    const url = new URL(h5Url)
    url.searchParams.set('faceIdToken', faceIdToken)
    url.searchParams.set('nonce', nonce)
    url.searchParams.set('sign', sign)
    url.searchParams.set('userId', userId)
    url.searchParams.set('orderNo', orderNo)
    url.searchParams.set('name', name)
    url.searchParams.set('idCard', idCard)
    url.searchParams.set('redirectUrl', redirectUrl)
    url.searchParams.set('version', '1.0.0')

    return url.toString()
}

const checkFaceAuthStatus = async () => {
    try {
        const res = await http.get('/api/faceid/auth-status')
        return res
    } catch (error) {
        console.error('Check face auth status failed:', error)
        throw error
    }
}

const uploadFaceImage = async (imagePath) => {
    try {
        uni.showLoading({ title: '上传中...' })

        const res = await http.upload('/api/faceid/upload-image', imagePath)
        uni.hideLoading()
        return res
    } catch (error) {
        uni.hideLoading()
        console.error('Upload face image failed:', error)
        throw error
    }
}

const compareFace = async (imagePath1, imagePath2) => {
    try {
        const res = await http.post('/api/faceid/compare', {
            image1: imagePath1,
            image2: imagePath2
        })
        return res
    } catch (error) {
        console.error('Compare face failed:', error)
        throw error
    }
}

export {
    FACEID_CONFIG,
    getFaceIdToken,
    queryFaceIdResult,
    startWechatFaceVerify,
    startH5FaceVerify,
    checkFaceAuthStatus,
    uploadFaceImage,
    compareFace
}

export default {
    FACEID_CONFIG,
    getFaceIdToken,
    queryFaceIdResult,
    startWechatFaceVerify,
    startH5FaceVerify,
    checkFaceAuthStatus,
    uploadFaceImage,
    compareFace
}
