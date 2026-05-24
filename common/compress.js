const compressImage = ({ filePath, quality = 0.8, maxWidth = 1280, maxHeight = 1280 }) => {
    return new Promise((resolve, reject) => {
        // #ifdef MP-WEIXIN
        uni.compressImage({
            src: filePath,
            quality: Math.floor(quality * 100),
            success: (res) => {
                resolve(res.tempFilePath)
            },
            fail: (err) => {
                console.warn('Wechat compress failed, use original:', err)
                resolve(filePath)
            }
        })
        // #endif

        // #ifndef MP-WEIXIN
        getImageInfo(filePath)
            .then((info) => {
                const { width, height } = info
                let targetWidth = width
                let targetHeight = height

                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height)
                    targetWidth = Math.floor(width * ratio)
                    targetHeight = Math.floor(height * ratio)
                }

                return drawAndCompress(filePath, targetWidth, targetHeight, quality)
            })
            .then((compressedPath) => {
                resolve(compressedPath)
            })
            .catch((err) => {
                console.warn('Canvas compress failed, use original:', err)
                resolve(filePath)
            })
        // #endif
    })
}

const getImageInfo = (filePath) => {
    return new Promise((resolve, reject) => {
        uni.getImageInfo({
            src: filePath,
            success: resolve,
            fail: reject
        })
    })
}

const drawAndCompress = (filePath, width, height, quality) => {
    return new Promise((resolve, reject) => {
        const canvasId = 'compress-canvas-' + Date.now()
        const ctx = uni.createCanvasContext(canvasId)

        ctx.drawImage(filePath, 0, 0, width, height)
        ctx.draw(false, () => {
            setTimeout(() => {
                uni.canvasToTempFilePath({
                    canvasId: canvasId,
                    width: width,
                    height: height,
                    destWidth: width,
                    destHeight: height,
                    fileType: 'jpg',
                    quality: quality,
                    success: (res) => {
                        resolve(res.tempFilePath)
                    },
                    fail: reject
                })
            }, 100)
        })
    })
}

const compressImages = (filePaths, options = {}) => {
    const { quality = 0.8, maxWidth = 1280, maxHeight = 1280, onProgress } = options
    const results = []
    const total = filePaths.length

    return filePaths.reduce((promise, filePath, index) => {
        return promise.then(() => {
            return compressImage({ filePath, quality, maxWidth, maxHeight })
                .then((compressedPath) => {
                    results.push(compressedPath)
                    if (onProgress) {
                        onProgress(Math.floor(((index + 1) / total) * 100))
                    }
                    return compressedPath
                })
        })
    }, Promise.resolve()).then(() => results)
}

export {
    compressImage,
    compressImages,
    getImageInfo
}

export default {
    compressImage,
    compressImages,
    getImageInfo
}
