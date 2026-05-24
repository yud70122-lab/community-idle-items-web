const TEMPLATE_IDS = {
    EXCHANGE_SUCCESS: 'EXCHANGE_SUCCESS_TEMPLATE_ID',
    EXCHANGE_REMIND: 'EXCHANGE_REMIND_TEMPLATE_ID',
    DEAL_SUCCESS: 'DEAL_SUCCESS_TEMPLATE_ID',
    SYSTEM_NOTICE: 'SYSTEM_NOTICE_TEMPLATE_ID'
}

const checkSubscribeMessage = async (templateIds = [TEMPLATE_IDS.EXCHANGE_SUCCESS]) => {
    return new Promise((resolve, reject) => {
        // #ifdef MP-WEIXIN
        uni.getSetting({
            withSubscriptions: true,
            success: (res) => {
                const subscriptionsSetting = res.subscriptionsSetting || {}
                const itemSettings = subscriptionsSetting.itemSettings || {}

                let allAccepted = true
                let needRequest = false

                templateIds.forEach((id) => {
                    const status = itemSettings[id]
                    if (status === 'reject') {
                        allAccepted = false
                    } else if (status !== 'accept') {
                        needRequest = true
                    }
                })

                if (allAccepted) {
                    resolve({ authorized: true, status: 'accepted' })
                } else {
                    const hasRejected = templateIds.some((id) => itemSettings[id] === 'reject')
                    if (hasRejected) {
                        resolve({
                            authorized: false,
                            status: 'rejected',
                            needOpenSetting: true
                        })
                    } else if (needRequest) {
                        resolve({
                            authorized: false,
                            status: 'not_requested',
                            needRequest: true
                        })
                    } else {
                        resolve({ authorized: false, status: 'unknown' })
                    }
                }
            },
            fail: (err) => {
                console.error('Get setting failed:', err)
                reject(err)
            }
        })
        // #endif

        // #ifndef MP-WEIXIN
        resolve({ authorized: true, status: 'unsupported_platform' })
        // #endif
    })
}

const requestSubscribeMessage = async (templateIds = [TEMPLATE_IDS.EXCHANGE_SUCCESS]) => {
    return new Promise((resolve, reject) => {
        // #ifdef MP-WEIXIN
        uni.requestSubscribeMessage({
            tmplIds: templateIds,
            success: (res) => {
                let allAccepted = true
                templateIds.forEach((id) => {
                    if (res[id] !== 'accept') {
                        allAccepted = false
                    }
                })
                resolve({
                    success: allAccepted,
                    results: res
                })
            },
            fail: (err) => {
                console.error('Request subscribe failed:', err)
                reject(err)
            }
        })
        // #endif

        // #ifndef MP-WEIXIN
        resolve({ success: true, status: 'unsupported_platform' })
        // #endif
    })
}

const showAuthGuideModal = (options = {}) => {
    return new Promise((resolve) => {
        uni.showModal({
            title: options.title || '开启消息通知',
            content: options.content || '为了及时通知您交易进度，请先授权接收消息通知',
            confirmText: options.confirmText || '去授权',
            cancelText: options.cancelText || '稍后再说',
            success: async (res) => {
                if (res.confirm) {
                    try {
                        const result = await requestSubscribeMessage(options.templateIds)
                        resolve(result)
                    } catch (e) {
                        resolve({ success: false, error: e })
                    }
                } else {
                    resolve({ success: false, canceled: true })
                }
            },
            fail: () => {
                resolve({ success: false, canceled: true })
            }
        })
    })
}

const openSettingToAuthorize = () => {
    return new Promise((resolve) => {
        uni.showModal({
            title: '授权设置',
            content: '您已拒绝接收消息通知，是否前往设置开启？',
            confirmText: '去设置',
            cancelText: '取消',
            success: (res) => {
                if (res.confirm) {
                    uni.openSetting({
                        success: (settingRes) => {
                            resolve({ success: true, setting: settingRes })
                        },
                        fail: (err) => {
                            resolve({ success: false, error: err })
                        }
                    })
                } else {
                    resolve({ success: false, canceled: true })
                }
            }
        })
    })
}

const ensureSubscribeAuthorization = async (templateIds, options = {}) => {
    try {
        const checkResult = await checkSubscribeMessage(templateIds)

        if (checkResult.authorized) {
            return { authorized: true, status: 'already_authorized' }
        }

        if (checkResult.needOpenSetting) {
            const settingResult = await openSettingToAuthorize()
            return { authorized: settingResult.success, status: 'from_setting' }
        }

        if (checkResult.needRequest) {
            const authResult = await showAuthGuideModal({
                templateIds,
                ...options
            })
            return { authorized: authResult.success, status: 'from_request' }
        }

        return { authorized: true, status: 'skipped' }
    } catch (error) {
        console.error('Ensure subscribe authorization failed:', error)
        return { authorized: true, status: 'error_fallback', error }
    }
}

const beforeInitiateExchange = async (exchangeInfo) => {
    const result = await ensureSubscribeAuthorization([
        TEMPLATE_IDS.EXCHANGE_SUCCESS,
        TEMPLATE_IDS.EXCHANGE_REMIND
    ], {
        title: '交易消息通知',
        content: `您即将发起与"${exchangeInfo?.targetUserName || '对方'}"的物品交换，开启通知可及时了解交易动态`
    })

    if (!result.authorized && !result.canceled) {
        uni.showToast({
            title: '未开启通知，可能错过交易动态',
            icon: 'none',
            duration: 2000
        })
    }

    return result
}

export {
    TEMPLATE_IDS,
    checkSubscribeMessage,
    requestSubscribeMessage,
    showAuthGuideModal,
    openSettingToAuthorize,
    ensureSubscribeAuthorization,
    beforeInitiateExchange
}

export default {
    TEMPLATE_IDS,
    checkSubscribeMessage,
    requestSubscribeMessage,
    showAuthGuideModal,
    openSettingToAuthorize,
    ensureSubscribeAuthorization,
    beforeInitiateExchange
}
