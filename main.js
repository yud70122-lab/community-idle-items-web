import { createSSRApp } from 'vue'
import App from './App.vue'
import { addTokenInterceptor } from './common/interceptor.js'
import pinia from './store/index.js'

addTokenInterceptor()

export function createApp() {
    const app = createSSRApp(App)
    app.use(pinia)
    return {
        app
    }
}
