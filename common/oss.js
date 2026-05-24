import http from './interceptor.js'

const OSS_CONFIG = {
    region: 'oss-cn-hangzhou',
    bucket: 'your-bucket-name',
    domain: 'https://your-bucket.oss-cn-hangzhou.aliyuncs.com'
}

const getStsToken = async () => {
    try {
        const res = await http.get('/api/oss/sts')
        return res
    } catch (error) {
        console.error('Get STS token failed:', error)
        throw error
    }
}

const getUploadPolicy = async (dir = 'id-card/') => {
    try {
        const res = await http.post('/api/oss/policy', { dir })
        return res
    } catch (error) {
        console.error('Get upload policy failed:', error)
        throw error
    }
}

const uploadToOSS = ({ filePath, dir = 'id-card/', onProgress }) => {
    return new Promise((resolve, reject) => {
        uni.showLoading({ title: '上传准备中...' })

        getUploadPolicy(dir)
            .then((policyData) => {
                uni.hideLoading()

                const { host, policy, signature, ossAccessKeyId, dir: policyDir, callback } = policyData
                const fileName = generateFileName(filePath)
                const ossFilePath = `${policyDir}${fileName}`

                const uploadTask = uni.uploadFile({
                    url: host,
                    filePath: filePath,
                    name: 'file',
                    formData: {
                        name: fileName,
                        key: ossFilePath,
                        policy: policy,
                        OSSAccessKeyId: ossAccessKeyId,
                        success_action_status: '200',
                        signature: signature,
                        callback: callback
                    },
                    success: (uploadRes) => {
                        if (uploadRes.statusCode === 200) {
                            const data = JSON.parse(uploadRes.data)
                            resolve({
                                url: `${OSS_CONFIG.domain}/${ossFilePath}`,
                                fileName: fileName,
                                ...data
                            })
                        } else {
                            reject(new Error(`Upload failed: ${uploadRes.statusCode}`))
                        }
                    },
                    fail: (err) => {
                        console.error('OSS upload failed:', err)
                        reject(err)
                    }
                })

                if (onProgress) {
                    uploadTask.onProgressUpdate((res) => {
                        onProgress(res.progress)
                    })
                }
            })
            .catch((err) => {
                uni.hideLoading()
                reject(err)
            })
    })
}

const generateFileName = (filePath) => {
    const timestamp = Date.now()
    const random = Math.floor(Math.random() * 10000)
    const ext = filePath.substring(filePath.lastIndexOf('.'))
    return `${timestamp}_${random}${ext}`
}

export {
    OSS_CONFIG,
    getStsToken,
    getUploadPolicy,
    uploadToOSS,
    generateFileName
}

export default {
    OSS_CONFIG,
    getStsToken,
    getUploadPolicy,
    uploadToOSS,
    generateFileName
}
