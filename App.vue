<script>
import { useUserStore } from '@/store/user.js'
import socketManager from '@/common/SocketManager.js'
import http from '@/common/interceptor.js'

const SHARE_SOURCE_KEY = 'share_source'

export default {
    onLaunch: function(options) {
        console.log('App Launch', options)
        this.initApp()
        this.handleShareSource(options)
    },
    onShow: function(options) {
        console.log('App Show', options)
        this.handleShareSource(options)
    },
    onHide: function() {
        console.log('App Hide')
    },
    methods: {
        initApp() {
            const userStore = useUserStore()
            if (userStore.isLoggedIn) {
                this.initSocket()
            }
        },

        async initSocket() {
            try {
                await socketManager.connect()
                console.log('[App] WebSocket connected')
            } catch (e) {
                console.error('[App] WebSocket connect failed:', e)
            }
        },

        handleShareSource(options) {
            if (!options) return

            const shareData = {}

            if (options.query) {
                if (options.query.shareId) {
                    shareData.shareId = options.query.shareId
                }
                if (options.query.shareType) {
                    shareData.shareType = options.query.shareType
                }
                if (options.query.itemId) {
                    shareData.itemId = options.query.itemId
                }
                if (options.query.fromUserId) {
                    shareData.fromUserId = options.query.fromUserId
                }
            }

            if (options.scene) {
                shareData.scene = options.scene
            }

            if (options.shareTicket) {
                shareData.shareTicket = options.shareTicket
            }

            if (Object.keys(shareData).length > 0) {
                console.log('[App] Share source detected:', shareData)
                this.recordShareSource(shareData)
            }
        },

        async recordShareSource(shareData) {
            try {
                uni.setStorageSync(SHARE_SOURCE_KEY, {
                    ...shareData,
                    timestamp: Date.now()
                })

                await http.post('/api/share/callback', shareData)
            } catch (e) {
                console.error('[App] Record share source failed:', e)
            }
        }
    }
}
</script>

<style>
@import '@/uni_modules/uni-scss/index.scss';

page {
    background-color: #f5f5f5;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
    font-size: 28rpx;
    color: #333;
}

.container {
    padding: 20rpx;
}
</style>
