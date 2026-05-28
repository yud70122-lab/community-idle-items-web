import http from '@/common/interceptor.js'

const SHARE_SOURCE_KEY = 'share_source'
const SHARE_HISTORY_KEY = 'share_history'
const MAX_HISTORY_LENGTH = 50

const generateShareId = () => {
    return `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

const getShareSource = () => {
    const pages = getCurrentPages()
    if (pages.length > 0) {
        const currentPage = pages[pages.length - 1]
        return currentPage.route || currentPage.$page?.fullPath || 'unknown'
    }
    return 'unknown'
}

const recordShareToLocal = (shareData) => {
    try {
        let history = uni.getStorageSync(SHARE_HISTORY_KEY) || []
        history.unshift(shareData)
        if (history.length > MAX_HISTORY_LENGTH) {
            history = history.slice(0, MAX_HISTORY_LENGTH)
        }
        uni.setStorageSync(SHARE_HISTORY_KEY, history)
    } catch (error) {
        console.error('Save share history failed:', error)
    }
}

export const reportShare = async (shareData) => {
    const shareRecord = {
        ...shareData,
        shareId: generateShareId(),
        source: getShareSource(),
        timestamp: Date.now(),
        userAgent: uni.getSystemInfoSync?.() || {}
    }

    recordShareToLocal(shareRecord)

    try {
        await http.post('/api/share/report', shareRecord)
        return shareRecord.shareId
    } catch (error) {
        console.error('Report share failed:', error)
        return shareRecord.shareId
    }
}

export const getShareHistory = () => {
    try {
        return uni.getStorageSync(SHARE_HISTORY_KEY) || []
    } catch (error) {
        console.error('Get share history failed:', error)
        return []
    }
}

export const clearShareHistory = () => {
    try {
        uni.removeStorageSync(SHARE_HISTORY_KEY)
        return true
    } catch (error) {
        console.error('Clear share history failed:', error)
        return false
    }
}

export const handleShareCallback = (options = {}) => {
    const {
        title,
        path,
        imageUrl,
        itemId,
        shareType = 'item',
        extra = {}
    } = options

    const currentUserId = uni.getStorageSync('userInfo')?.id || ''
    const shareId = generateShareId()

    const shareData = {
        itemId,
        shareType,
        title,
        path,
        imageUrl,
        shareId,
        fromUserId: currentUserId,
        ...extra
    }

    reportShare(shareData)

    const separator = path?.includes('?') ? '&' : '?'
    const sharePath = path
        ? `${path}${separator}shareId=${shareId}&shareType=${shareType}&fromUserId=${currentUserId}`
        : `/pages/index/index?shareId=${shareId}&shareType=${shareType}&fromUserId=${currentUserId}`

    return {
        title: title || '快来看看这个闲置物品',
        path: sharePath,
        imageUrl: imageUrl || ''
    }
}

export default {
    reportShare,
    getShareHistory,
    clearShareHistory,
    handleShareCallback
}
