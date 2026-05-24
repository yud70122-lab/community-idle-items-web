import http from '@/common/interceptor.js'
import { debounce } from './debounce.js'

const checkSensitiveWords = async (text) => {
    if (!text || !text.trim()) {
        return {
            valid: true,
            sensitiveWords: [],
            message: ''
        }
    }

    try {
        const res = await http.post('/api/common/check-sensitive', {
            content: text
        })

        if (res && res.code === 0) {
            const { hasSensitive, words = [], filteredText } = res.data || {}
            return {
                valid: !hasSensitive,
                sensitiveWords: words,
                filteredText,
                message: hasSensitive ? `包含敏感词：${words.join('、')}` : ''
            }
        }

        return {
            valid: true,
            sensitiveWords: [],
            message: ''
        }
    } catch (error) {
        console.error('Check sensitive words failed:', error)
        return {
            valid: true,
            sensitiveWords: [],
            message: '',
            error: error
        }
    }
}

const createSensitiveChecker = (options = {}) => {
    const {
        debounceWait = 500,
        onValid = null,
        onInvalid = null,
        onError = null
    } = options

    let lastCheckResult = { valid: true, sensitiveWords: [], message: '' }

    const check = debounce(async (text) => {
        try {
            const result = await checkSensitiveWords(text)
            lastCheckResult = result

            if (result.valid) {
                if (onValid) onValid(result)
            } else {
                if (onInvalid) onInvalid(result)
            }

            return result
        } catch (error) {
            if (onError) onError(error)
            throw error
        }
    }, debounceWait)

    const getLastResult = () => lastCheckResult

    const reset = () => {
        lastCheckResult = { valid: true, sensitiveWords: [], message: '' }
        check.cancel()
    }

    return {
        check,
        getLastResult,
        reset,
        cancel: check.cancel
    }
}

const containsSensitiveLocal = (text) => {
    if (!text) return { valid: true, words: [] }

    const localSensitiveWords = [
        '违禁词1',
        '违禁词2',
        '敏感词'
    ]

    const foundWords = localSensitiveWords.filter(word =>
        text.toLowerCase().includes(word.toLowerCase())
    )

    return {
        valid: foundWords.length === 0,
        words: foundWords
    }
}

export {
    checkSensitiveWords,
    createSensitiveChecker,
    containsSensitiveLocal
}

export default {
    checkSensitiveWords,
    createSensitiveChecker,
    containsSensitiveLocal
}
