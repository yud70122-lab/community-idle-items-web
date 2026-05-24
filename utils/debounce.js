const debounce = (func, wait = 300, options = {}) => {
    let timeoutId = null
    let lastCallTime = 0
    let lastResult = null

    const { leading = false, trailing = true, maxWait = null } = options

    const invokeFunc = (args) => {
        const result = func.apply(this, args)
        lastResult = result
        return result
    }

    const debounced = function(...args) {
        const now = Date.now()
        const isLeadingCall = leading && timeoutId === null
        const timeSinceLastCall = now - lastCallTime

        if (maxWait !== null && timeoutId !== null && timeSinceLastCall >= maxWait) {
            clearTimeout(timeoutId)
            timeoutId = null
        }

        if (timeoutId === null) {
            lastCallTime = now
            if (leading) {
                invokeFunc(args)
            }
        }

        if (trailing) {
            if (timeoutId !== null) {
                clearTimeout(timeoutId)
            }

            timeoutId = setTimeout(() => {
                timeoutId = null
                if (!leading || Date.now() - lastCallTime > wait) {
                    invokeFunc(args)
                }
            }, wait)
        }

        return lastResult
    }

    debounced.cancel = () => {
        if (timeoutId !== null) {
            clearTimeout(timeoutId)
            timeoutId = null
        }
    }

    debounced.flush = (...args) => {
        if (timeoutId !== null) {
            clearTimeout(timeoutId)
            timeoutId = null
        }
        return invokeFunc(args)
    }

    debounced.pending = () => {
        return timeoutId !== null
    }

    return debounced
}

const throttle = (func, wait = 300, options = {}) => {
    let timeoutId = null
    let lastCallTime = 0
    let lastResult = null
    const { leading = true, trailing = true } = options

    const invokeFunc = (args) => {
        const result = func.apply(this, args)
        lastResult = result
        return result
    }

    const throttled = function(...args) {
        const now = Date.now()
        const timeSinceLastCall = now - lastCallTime

        if (timeoutId === null) {
            if (leading || lastCallTime === 0) {
                lastCallTime = now
                invokeFunc(args)
            } else {
                lastCallTime = now
            }
        }

        if (trailing && timeoutId === null) {
            timeoutId = setTimeout(() => {
                timeoutId = null
                lastCallTime = Date.now()
                if (!leading) {
                    invokeFunc(args)
                }
            }, wait)
        }

        return lastResult
    }

    throttled.cancel = () => {
        if (timeoutId !== null) {
            clearTimeout(timeoutId)
            timeoutId = null
        }
    }

    throttled.flush = (...args) => {
        if (timeoutId !== null) {
            clearTimeout(timeoutId)
            timeoutId = null
        }
        lastCallTime = Date.now()
        return invokeFunc(args)
    }

    return throttled
}

export { debounce, throttle }
export default debounce
