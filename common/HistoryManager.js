const STORAGE_KEY = 'search_history'
const MAX_HISTORY_COUNT = 10

const HistoryManager = {
    getHistory() {
        try {
            const history = uni.getStorageSync(STORAGE_KEY)
            if (history && Array.isArray(history)) {
                return history
            }
            return []
        } catch (e) {
            console.error('Get search history failed:', e)
            return []
        }
    },

    addHistory(keyword) {
        if (!keyword || typeof keyword !== 'string' || keyword.trim() === '') {
            return false
        }

        try {
            const trimmedKeyword = keyword.trim()
            let history = this.getHistory()

            history = history.filter(item => item !== trimmedKeyword)

            history.unshift(trimmedKeyword)

            if (history.length > MAX_HISTORY_COUNT) {
                history = history.slice(0, MAX_HISTORY_COUNT)
            }

            uni.setStorageSync(STORAGE_KEY, history)

            return true
        } catch (e) {
            console.error('Add search history failed:', e)
            return false
        }
    },

    removeHistory(keyword) {
        if (!keyword) return false

        try {
            let history = this.getHistory()
            const originalLength = history.length

            history = history.filter(item => item !== keyword)

            if (history.length !== originalLength) {
                uni.setStorageSync(STORAGE_KEY, history)
                return true
            }

            return false
        } catch (e) {
            console.error('Remove search history failed:', e)
            return false
        }
    },

    clearHistory() {
        return new Promise((resolve, reject) => {
            uni.showModal({
                title: '提示',
                content: '确定要清空所有搜索历史吗？',
                confirmText: '清空',
                cancelText: '取消',
                confirmColor: '#ff4757',
                success: (res) => {
                    if (res.confirm) {
                    try {
                        uni.removeStorageSync(STORAGE_KEY)
                        resolve(true)
                    } catch (e) {
                        console.error('Clear search history failed:', e)
                        reject(e)
                    }
                } else {
                    resolve(false)
                }
            })
        })
    },

    clearHistoryImmediately() {
        try {
            uni.removeStorageSync(STORAGE_KEY)
            return true
        } catch (e) {
            console.error('Clear search history immediately failed:', e)
            return false
        }
    },

    getHistoryCount() {
        return this.getHistory().length
    },

    hasHistory(keyword) {
        if (!keyword) return false
        const history = this.getHistory()
        return history.includes(keyword)
    }
}

export default HistoryManager
