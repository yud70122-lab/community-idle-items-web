<template>
    <view class="publish-page">
        <view class="page-header">
            <text class="page-title">{{ editMode ? '编辑闲置' : '发布闲置' }}</text>
            <text class="page-subtitle">{{ editMode ? '修改物品信息' : '让闲置物品流动起来' }}</text>
        </view>

        <scroll-view class="content-wrapper" scroll-y>
            <view class="trade-type-section">
                <text class="section-label">交易方式</text>
                <view class="trade-tabs">
                    <view
                        v-for="tab in tradeTabs"
                        :key="tab.value"
                        class="trade-tab"
                        :class="{ active: selectedTradeType === tab.value }"
                        @click="selectTradeType(tab.value)"
                    >
                        <text class="tab-icon">{{ tab.icon }}</text>
                        <text class="tab-label">{{ tab.label }}</text>
                        <view class="tab-check" v-if="selectedTradeType === tab.value">
                            <text class="check-icon">✓</text>
                        </view>
                    </view>
                </view>
            </view>

            <view class="form-section">
                <text class="section-label">物品标题</text>
                <view class="form-item">
                    <input
                        class="title-input"
                        v-model="formData.title"
                        placeholder="请输入物品标题，简洁明了（如：iPhone 12 128G）"
                        maxlength="30"
                        @input="onTitleInput"
                    />
                    <text class="char-count">{{ formData.title.length }}/30</text>
                </view>
                <view class="sensitive-warning" v-if="titleSensitiveResult && !titleSensitiveResult.valid">
                    <text class="warning-icon">⚠️</text>
                    <text class="warning-text">{{ titleSensitiveResult.message }}</text>
                </view>
            </view>

            <view class="form-section">
                <RichTextEditor
                    v-model="formData.description"
                    ref="richTextEditor"
                    :maxLength="500"
                    :showPreview="false"
                    placeholder="详细描述物品的使用情况、购买时间、是否有瑕疵、购买渠道等信息..."
                    @input="onDescriptionInput"
                />
            </view>

            <view class="form-section">
                <CategorySelector
                    v-model="formData.categories"
                    ref="categorySelector"
                    title="选择品类"
                    :maxSelect="5"
                />
            </view>

            <view class="form-section">
                <TagInput
                    v-model="formData.tags"
                    ref="tagInput"
                    title="物品标签"
                    :maxTags="5"
                    :maxTagLength="10"
                    placeholder="输入标签，按回车添加"
                    :presetTags="presetTags"
                />
            </view>

            <view class="form-section" v-if="showPriceInput">
                <PriceInput
                    v-model="formData.price"
                    ref="priceInput"
                    title="出售价格"
                    :max="99999"
                    :showNegotiable="true"
                    :negotiable.sync="formData.negotiable"
                    suffix=""
                    :quickPrices="[9.9, 19.9, 29.9, 49.9, 99, 199, 299]"
                />
            </view>

            <view class="form-section">
                <ConditionPicker
                    v-model="formData.condition"
                    ref="conditionPicker"
                    title="成色选择"
                    :description="formData.description"
                    :showRecommend="true"
                    :useApiRecommend="false"
                />
            </view>

            <view class="form-section">
                <ImageUploader
                    v-model="formData.images"
                    ref="imageUploader"
                    title="物品图片"
                    :maxCount="9"
                    :compress="true"
                    :enableDragSort="true"
                    uploadDir="goods/images/"
                />
            </view>

            <view class="form-section">
                <VideoUploader
                    v-model="formData.video"
                    ref="videoUploader"
                    title="视频介绍（选填）"
                    :maxDuration="15"
                    :maxSize="50 * 1024 * 1024"
                    uploadDir="goods/videos/"
                />
            </view>

            <view class="form-section">
                <view class="location-item" @click="goToMapSelect">
                    <view class="location-header">
                        <text class="section-label required">所在位置</text>
                        <text class="location-hint" v-if="!locationData.address">点击选择位置</text>
                    </view>
                    <view class="location-content" v-if="locationData.address">
                        <view class="location-icon">
                            <text class="icon-text">📍</text>
                        </view>
                        <view class="location-info">
                            <text class="location-address">{{ locationData.address }}</text>
                            <text class="location-detail" v-if="locationData.detail">{{ locationData.detail }}</text>
                        </view>
                        <view class="location-arrow">
                            <text class="arrow-text">›</text>
                        </view>
                    </view>
                    <view class="location-placeholder" v-else>
                        <view class="location-icon loading" v-if="locationData.loading">
                            <text class="icon-text">🔄</text>
                        </view>
                        <view class="location-icon" v-else>
                            <text class="icon-text">📍</text>
                        </view>
                        <view class="location-info">
                            <text class="location-placeholder-text">
                                {{ locationData.loading ? '定位中...' : '获取位置信息' }}
                            </text>
                        </view>
                        <view class="location-arrow">
                            <text class="arrow-text">›</text>
                        </view>
                    </view>
                    <view class="location-error" v-if="locationData.error">
                        <text class="error-text">{{ locationData.error }}</text>
                    </view>
                </view>
            </view>

            <view class="form-section">
                <view class="contact-item">
                    <text class="section-label">联系方式（选填）</text>
                    <input
                        class="contact-input"
                        v-model="formData.contact"
                        placeholder="手机号或微信号，方便买家联系"
                        maxlength="30"
                    />
                </view>
            </view>

            <view class="form-section">
                <view class="agreement-check" @click="formData.agreed = !formData.agreed">
                    <view class="checkbox" :class="{ checked: formData.agreed }">
                        <text class="check-icon" v-if="formData.agreed">✓</text>
                    </view>
                    <text class="agreement-text">
                        我已阅读并同意《<text class="link-text">用户协议</text>》和《<text class="link-text">发布规范</text>》，保证所填信息真实有效
                    </text>
                </view>
            </view>

            <view class="bottom-placeholder"></view>
        </scroll-view>

        <view class="bottom-bar">
            <view class="price-preview" v-if="showPriceInput && formData.price > 0">
                <text class="preview-label">预计售价</text>
                <text class="preview-price">¥{{ Number(formData.price).toFixed(2) }}</text>
                <text class="negotiable-tag" v-if="formData.negotiable">可议价</text>
            </view>
            <button
                class="submit-btn"
                :class="{ disabled: !canSubmit }"
                :disabled="!canSubmit"
                :loading="submitting"
                @click="handleSubmit"
            >
                <text class="btn-text">{{ submitting ? (editMode ? '保存中...' : '发布中...') : (editMode ? '保存修改' : '立即发布') }}</text>
            </button>
        </view>
    </view>
</template>

<script>
import { createSensitiveChecker } from '@/utils/sensitive.js'
import { beforeInitiateExchange } from '@/utils/subscribe.js'
import RichTextEditor from '@/components/RichTextEditor/RichTextEditor.vue'
import CategorySelector from '@/components/CategorySelector/CategorySelector.vue'
import TagInput from '@/components/TagInput/TagInput.vue'
import PriceInput from '@/components/PriceInput/PriceInput.vue'
import ConditionPicker from '@/components/ConditionPicker/ConditionPicker.vue'
import ImageUploader from '@/components/ImageUploader/ImageUploader.vue'
import VideoUploader from '@/components/VideoUploader/VideoUploader.vue'
import http from '@/common/interceptor.js'

export default {
    name: 'PublishPage',
    components: {
        RichTextEditor,
        CategorySelector,
        TagInput,
        PriceInput,
        ConditionPicker,
        ImageUploader,
        VideoUploader
    },

    data() {
        return {
            selectedTradeType: 'both',
            tradeTabs: [
                { value: 'exchange', label: '仅交换', icon: '🔄' },
                { value: 'sell', label: '仅出售', icon: '💰' },
                { value: 'both', label: '既换也出', icon: '✨' }
            ],

            formData: {
                title: '',
                description: '',
                categories: [],
                tags: [],
                price: null,
                negotiable: false,
                condition: '',
                images: [],
                video: null,
                contact: '',
                agreed: false
            },

            locationData: {
                address: '',
                detail: '',
                latitude: null,
                longitude: null,
                loading: false,
                error: ''
            },

            titleSensitiveResult: null,
            titleSensitiveChecker: null,
            submitting: false,

            editMode: false,
            itemId: null,

            draftChecked: false,

            presetTags: [
                '正品',
                '几乎全新',
                '包邮',
                '可议价',
                '自提',
                '限量版',
                '配件齐全',
                '无划痕'
            ]
        }
    },

    computed: {
        showPriceInput() {
            return this.selectedTradeType === 'sell' || this.selectedTradeType === 'both'
        },

        showExchangeInfo() {
            return this.selectedTradeType === 'exchange' || this.selectedTradeType === 'both'
        },

        canSubmit() {
            if (!this.formData.title.trim()) return false
            if (this.titleSensitiveResult && !this.titleSensitiveResult.valid) return false
            if (!this.formData.description || this.formData.description.length < 10) return false
            if (this.formData.categories.length === 0) return false
            if (this.formData.condition === '') return false
            if (this.showPriceInput && (!this.formData.price || this.formData.price <= 0)) return false
            if (this.formData.images.length === 0) return false
            if (!this.locationData.address || !this.locationData.latitude || !this.locationData.longitude) return false
            if (!this.formData.agreed) return false
            return true
        }
    },

    created() {
        this.titleSensitiveChecker = createSensitiveChecker({
            debounceWait: 500,
            onValid: (result) => {
                this.titleSensitiveResult = result
            },
            onInvalid: (result) => {
                this.titleSensitiveResult = result
                uni.vibrateShort && uni.vibrateShort({ type: 'light' })
            }
        })
    },

    onLoad(options) {
        if (options && options.id) {
            this.editMode = true
            this.itemId = options.id
            this.loadItemDetail(options.id)
        } else {
            if (options && options.latitude && options.longitude) {
                this.locationData.latitude = parseFloat(options.latitude)
                this.locationData.longitude = parseFloat(options.longitude)
                this.locationData.address = options.address || ''
                this.locationData.detail = options.detail || ''
            } else {
                this.getLocation()
            }
        }
    },

    onShow() {
        uni.$on('locationSelected', this.handleLocationSelected)
        if (!this.editMode && !this.draftChecked) {
            this.checkAndRestoreDraft()
        }
    },

    onHide() {
        uni.$off('locationSelected', this.handleLocationSelected)
        if (!this.editMode && this.hasFormContent()) {
            this.saveDraft()
        }
    },

    onShareAppMessage() {
        const imageUrl = this.formData.images?.[0]?.url || this.formData.images?.[0] || this.formData.coverImage || ''
        const itemId = this.itemId || ''
        return {
            title: this.formData.title || '快来看看我发布的闲置物品',
            path: `/pages/index/index?itemId=${itemId}`,
            imageUrl: imageUrl
        }
    },

    onShareTimeline() {
        const imageUrl = this.formData.images?.[0]?.url || this.formData.images?.[0] || this.formData.coverImage || ''
        return {
            title: this.formData.title || '快来看看我发布的闲置物品',
            imageUrl: imageUrl
        }
    },

    methods: {
        hasFormContent() {
            return !!(
                this.formData.title.trim() ||
                this.formData.description ||
                this.formData.categories.length > 0 ||
                this.formData.tags.length > 0 ||
                this.formData.price ||
                this.formData.condition ||
                this.formData.images.length > 0 ||
                this.formData.video ||
                this.formData.contact.trim()
            )
        },

        saveDraft() {
            const draftData = {
                timestamp: Date.now(),
                selectedTradeType: this.selectedTradeType,
                formData: JSON.parse(JSON.stringify(this.formData)),
                locationData: JSON.parse(JSON.stringify(this.locationData))
            }
            uni.setStorageSync('draft_release', draftData)
        },

        checkAndRestoreDraft() {
            this.draftChecked = true
            const draft = uni.getStorageSync('draft_release')
            if (!draft) return

            const now = Date.now()
            const twentyFourHours = 24 * 60 * 60 * 1000
            if (now - draft.timestamp > twentyFourHours) {
                uni.removeStorageSync('draft_release')
                return
            }

            uni.showModal({
                title: '草稿恢复',
                content: '检测到未发布的草稿，是否恢复？',
                confirmText: '恢复',
                cancelText: '放弃',
                success: (res) => {
                    if (res.confirm) {
                        this.restoreDraft(draft)
                    } else {
                        uni.removeStorageSync('draft_release')
                    }
                }
            })
        },

        restoreDraft(draft) {
            if (draft.selectedTradeType) {
                this.selectedTradeType = draft.selectedTradeType
            }
            if (draft.formData) {
                this.formData = { ...this.formData, ...draft.formData }
                this.$nextTick(() => {
                    if (this.$refs.richTextEditor && draft.formData.description) {
                        this.$refs.richTextEditor.setContent(draft.formData.description)
                    }
                    if (this.$refs.categorySelector && draft.formData.categories) {
                        this.$refs.categorySelector.setSelected(draft.formData.categories)
                    }
                    if (this.$refs.tagInput && draft.formData.tags) {
                        this.$refs.tagInput.setTags(draft.formData.tags)
                    }
                    if (this.$refs.priceInput && draft.formData.price) {
                        this.$refs.priceInput.setValue(draft.formData.price)
                    }
                    if (this.$refs.conditionPicker && draft.formData.condition) {
                        this.$refs.conditionPicker.setValue(draft.formData.condition)
                    }
                    if (this.$refs.imageUploader && draft.formData.images) {
                        this.$refs.imageUploader.setImages(draft.formData.images)
                    }
                    if (this.$refs.videoUploader && draft.formData.video) {
                        this.$refs.videoUploader.setVideo(draft.formData.video)
                    }
                })
            }
            if (draft.locationData) {
                this.locationData = { ...this.locationData, ...draft.locationData }
            }
            uni.removeStorageSync('draft_release')
            uni.showToast({ title: '草稿已恢复', icon: 'success' })
        },

        async loadItemDetail(id) {
            try {
                uni.showLoading({ title: '加载中...', mask: true })
                const res = await http.get(`/api/item/${id}/detail`)
                if (res) {
                    this.fillFormWithDetail(res)
                }
                uni.hideLoading()
            } catch (error) {
                uni.hideLoading()
                console.error('Load item detail failed:', error)
                uni.showToast({
                    title: '加载失败，请重试',
                    icon: 'none'
                })
            }
        },

        fillFormWithDetail(detail) {
            this.selectedTradeType = detail.tradeType || 'both'
            this.formData = {
                title: detail.title || '',
                description: detail.description || '',
                categories: detail.categoryIds || [],
                tags: detail.tags || [],
                price: detail.price || null,
                negotiable: detail.negotiable || false,
                condition: detail.condition || '',
                images: detail.images || [],
                video: detail.video ? { url: detail.video, coverUrl: detail.videoCover, duration: detail.videoDuration, uploaded: true } : null,
                contact: detail.contact || '',
                agreed: true
            }
            if (detail.location) {
                this.locationData = {
                    address: detail.location.address || '',
                    detail: detail.location.detail || '',
                    latitude: detail.location.latitude,
                    longitude: detail.location.longitude,
                    loading: false,
                    error: ''
                }
            }
            this.$nextTick(() => {
                if (this.$refs.richTextEditor && detail.description) {
                    this.$refs.richTextEditor.setContent(detail.description)
                }
                if (this.$refs.categorySelector && detail.categoryIds) {
                    this.$refs.categorySelector.setSelected(detail.categoryIds)
                }
                if (this.$refs.tagInput && detail.tags) {
                    this.$refs.tagInput.setTags(detail.tags)
                }
                if (this.$refs.priceInput && detail.price) {
                    this.$refs.priceInput.setValue(detail.price)
                }
                if (this.$refs.conditionPicker && detail.condition) {
                    this.$refs.conditionPicker.setValue(detail.condition)
                }
                if (this.$refs.imageUploader && detail.images) {
                    this.$refs.imageUploader.setImages(detail.images.map(url => ({ url, uploaded: true, tempFilePath: url })))
                }
                if (this.$refs.videoUploader && detail.video) {
                    this.$refs.videoUploader.setVideo({ url: detail.video, coverUrl: detail.videoCover, duration: detail.videoDuration, uploaded: true })
                }
            })
        },

        async getLocation() {
            this.locationData.loading = true
            this.locationData.error = ''

            try {
                // #ifdef MP-WEIXIN
                const locationRes = await new Promise((resolve, reject) => {
                    wx.getLocation({
                        type: 'gcj02',
                        isHighAccuracy: true,
                        success: resolve,
                        fail: reject
                    })
                })
                // #endif

                // #ifndef MP-WEIXIN
                const locationRes = await new Promise((resolve, reject) => {
                    uni.getLocation({
                        type: 'gcj02',
                        isHighAccuracy: true,
                        success: resolve,
                        fail: reject
                    })
                })
                // #endif

                const { latitude, longitude } = locationRes
                this.locationData.latitude = latitude
                this.locationData.longitude = longitude

                await this.reverseGeocode(latitude, longitude)

            } catch (error) {
                console.error('Get location failed:', error)
                this.locationData.error = this.getLocationErrorMessage(error)
                uni.showModal({
                    title: '获取位置失败',
                    content: '无法获取当前位置，是否前往设置开启定位权限？',
                    confirmText: '去设置',
                    success: (res) => {
                        if (res.confirm) {
                            // #ifdef MP-WEIXIN
                            wx.openSetting()
                            // #endif
                            // #ifdef APP-PLUS
                            plus.runtime.openSystemSetting()
                            // #endif
                        }
                    }
                })
            } finally {
                this.locationData.loading = false
            }
        },

        async reverseGeocode(latitude, longitude) {
            try {
                const res = await http.post('/api/common/reverse-geocode', {
                    latitude,
                    longitude
                })

                if (res && res.code === 0 && res.data) {
                    this.locationData.address = res.data.address || ''
                    this.locationData.detail = res.data.detail || ''
                    this.locationData.error = ''
                } else {
                    this.locationData.error = '地址解析失败，请手动选择'
                }
            } catch (error) {
                console.error('Reverse geocode failed:', error)
                this.locationData.error = '地址解析失败，请手动选择'
            }
        },

        getLocationErrorMessage(error) {
            const errMsg = error?.errMsg || error?.message || ''
            if (errMsg.includes('auth') || errMsg.includes('permission') || errMsg.includes('denied')) {
                return '定位权限被拒绝，请开启定位权限'
            }
            if (errMsg.includes('timeout')) {
                return '定位超时，请检查网络或GPS'
            }
            if (errMsg.includes('cancel')) {
                return '已取消定位'
            }
            return '定位失败，请重试或手动选择'
        },

        goToMapSelect() {
            uni.navigateTo({
                url: `/pages/map_select/map_select?latitude=${this.locationData.latitude || ''}&longitude=${this.locationData.longitude || ''}&address=${encodeURIComponent(this.locationData.address || '')}`
            })
        },

        setLocation(location) {
            if (!location) return
            this.locationData = {
                address: location.address || '',
                detail: location.detail || location.name || '',
                latitude: location.latitude,
                longitude: location.longitude,
                loading: false,
                error: ''
            }
        },

        handleLocationSelected(location) {
            if (location) {
                this.setLocation(location)
            }
        },

        validateForm() {
            if (!this.formData.title.trim()) {
                uni.showToast({ title: '请输入物品标题', icon: 'none' })
                this.$nextTick(() => {
                    const titleInput = document.querySelector('.title-input')
                    if (titleInput) titleInput.focus()
                })
                return { valid: false, field: 'title', message: '请输入物品标题' }
            }

            if (this.titleSensitiveResult && !this.titleSensitiveResult.valid) {
                uni.showToast({ title: '标题包含敏感词，请修改', icon: 'none' })
                this.$nextTick(() => {
                    const titleInput = document.querySelector('.title-input')
                    if (titleInput) titleInput.focus()
                })
                return { valid: false, field: 'title', message: '标题包含敏感词' }
            }

            if (!this.formData.description || this.formData.description.length < 10) {
                uni.showToast({ title: '请输入物品描述（至少10字）', icon: 'none' })
                this.$nextTick(() => {
                    const descriptionInput = document.querySelector('.mp-editor, .textarea-editor')
                    if (descriptionInput) descriptionInput.focus()
                })
                return { valid: false, field: 'description', message: '请输入物品描述（至少10字）' }
            }

            if (this.formData.categories.length === 0) {
                uni.showToast({ title: '请选择物品品类', icon: 'none' })
                this.$nextTick(() => {
                    const categorySection = document.querySelector('.category-selector')
                    if (categorySection) {
                        categorySection.scrollIntoView({ behavior: 'smooth' })
                    }
                })
                return { valid: false, field: 'categories', message: '请选择物品品类' }
            }

            if (!this.formData.condition) {
                uni.showToast({ title: '请选择物品成色', icon: 'none' })
                this.$nextTick(() => {
                    const conditionPicker = document.querySelector('.condition-picker')
                    if (conditionPicker) {
                        conditionPicker.scrollIntoView({ behavior: 'smooth' })
                    }
                })
                return { valid: false, field: 'condition', message: '请选择物品成色' }
            }

            if (this.showPriceInput && (!this.formData.price || this.formData.price <= 0)) {
                uni.showToast({ title: '请输入物品价格', icon: 'none' })
                this.$nextTick(() => {
                    const priceInput = document.querySelector('.price-input')
                    if (priceInput) priceInput.focus()
                })
                return { valid: false, field: 'price', message: '请输入物品价格' }
            }

            if (this.formData.images.length === 0) {
                uni.showToast({ title: '请上传物品图片', icon: 'none' })
                this.$nextTick(() => {
                    const imageUploader = document.querySelector('.image-uploader')
                    if (imageUploader) {
                        imageUploader.scrollIntoView({ behavior: 'smooth' })
                    }
                })
                return { valid: false, field: 'images', message: '请上传物品图片' }
            }

            if (!this.locationData.address || !this.locationData.latitude || !this.locationData.longitude) {
                uni.showToast({ title: '请选择所在位置', icon: 'none' })
                this.$nextTick(() => {
                    const locationItem = document.querySelector('.location-item')
                    if (locationItem) {
                        locationItem.scrollIntoView({ behavior: 'smooth' })
                    }
                })
                return { valid: false, field: 'location', message: '请选择所在位置' }
            }

            if (!this.formData.agreed) {
                uni.showToast({ title: '请阅读并同意用户协议', icon: 'none' })
                this.$nextTick(() => {
                    const agreementCheck = document.querySelector('.agreement-check')
                    if (agreementCheck) {
                        agreementCheck.scrollIntoView({ behavior: 'smooth' })
                    }
                })
                return { valid: false, field: 'agreement', message: '请阅读并同意用户协议' }
            }

            return { valid: true }
        },
        selectTradeType(type) {
            this.selectedTradeType = type
            if (type === 'exchange') {
                this.formData.price = null
                this.formData.negotiable = false
            } else if (type === 'sell') {
                this.formData.exchangeWish = ''
            }
        },

        onTitleInput(e) {
            const value = e.detail.value
            this.formData.title = value

            if (value && value.trim()) {
                this.titleSensitiveChecker.check(value)
            } else {
                this.titleSensitiveResult = null
                this.titleSensitiveChecker.reset()
            }
        },

        onDescriptionInput(value) {
            this.formData.description = value || ''
        },

        async handleSubmit() {
            if (this.submitting) return

            const validation = this.validateForm()
            if (!validation.valid) {
                return
            }

            try {
                if (!this.editMode && (this.selectedTradeType === 'exchange' || this.selectedTradeType === 'both')) {
                    await beforeInitiateExchange({
                        targetUserName: '对方用户'
                    })
                }

                const titleCheck = await this.checkTitleSensitive()
                if (!titleCheck.valid) {
                    uni.showToast({
                        title: '标题包含敏感词，请修改',
                        icon: 'none'
                    })
                    return
                }

                const allImagesUploaded = await this.uploadAllImages()
                if (!allImagesUploaded) {
                    uni.showToast({
                        title: '图片上传中，请稍候',
                        icon: 'none'
                    })
                    return
                }

                if (this.formData.video && !this.formData.video.uploaded) {
                    uni.showToast({
                        title: '视频上传中，请稍候',
                        icon: 'none'
                    })
                    return
                }

                this.submitting = true
                uni.showLoading({ title: this.editMode ? '保存中...' : '发布中...', mask: true })

                const submitData = await this.buildSubmitData()
                console.log('Submit data:', submitData)

                let res
                if (this.editMode) {
                    res = await http.put(`/api/item/${this.itemId}`, submitData)
                } else {
                    res = await http.post('/api/goods/publish', submitData)
                }

                if (res && res.code === 0) {
                    uni.hideLoading()
                    if (!this.editMode) {
                        uni.removeStorageSync('draft_release')
                    }
                    uni.showToast({
                        title: this.editMode ? '保存成功' : '发布成功',
                        icon: 'success',
                        duration: 1500
                    })

                    const itemId = res.id || (res.data && res.data.id) || this.itemId
                    setTimeout(() => {
                        if (!this.editMode && itemId) {
                            uni.redirectTo({
                                url: `/pages/share_poster/share_poster?id=${itemId}`
                            })
                        } else {
                            uni.navigateBack()
                        }
                    }, 1500)
                } else {
                    throw new Error(res?.message || (this.editMode ? '保存失败' : '发布失败'))
                }

            } catch (error) {
                this.submitting = false
                uni.hideLoading()
                console.error('Submit failed:', error)

                if (error.message && error.message.includes('授权')) {
                    return
                }

                uni.showToast({
                    title: error.message || (this.editMode ? '保存失败，请重试' : '发布失败，请重试'),
                    icon: 'none',
                    duration: 2000
                })
            }
        },

        async checkTitleSensitive() {
            if (!this.formData.title.trim()) {
                return { valid: true }
            }

            const { checkSensitiveWords } = await import('@/utils/sensitive.js')
            return await checkSensitiveWords(this.formData.title)
        },

        async uploadAllImages() {
            const imageUploader = this.$refs.imageUploader
            if (!imageUploader) return true

            const result = await imageUploader.uploadAll()
            return result.success
        },

        async buildSubmitData() {
            const imageUploader = this.$refs.imageUploader
            const videoUploader = this.$refs.videoUploader

            const imageUrls = imageUploader ? imageUploader.getUrls() : []
            const videoData = videoUploader ? videoUploader.getExportData() : null

            const data = {
                title: this.formData.title.trim(),
                description: this.formData.description,
                categoryIds: this.formData.categories,
                tags: this.formData.tags,
                condition: this.formData.condition,
                tradeType: this.selectedTradeType,
                images: imageUrls,
                coverImage: imageUrls[0] || '',
                contact: this.formData.contact.trim(),
                location: {
                    address: this.locationData.address,
                    detail: this.locationData.detail,
                    latitude: this.locationData.latitude,
                    longitude: this.locationData.longitude
                }
            }

            if (this.showPriceInput) {
                data.price = Number(this.formData.price)
                data.negotiable = this.formData.negotiable
            }

            if (videoData && videoData.url) {
                data.video = videoData.url
                data.videoCover = videoData.coverUrl || ''
                data.videoDuration = videoData.duration || 0
            }

            return data
        },

        resetForm() {
            this.formData = {
                title: '',
                description: '',
                categories: [],
                tags: [],
                price: null,
                negotiable: false,
                condition: '',
                images: [],
                video: null,
                contact: '',
                agreed: false
            }
            this.locationData = {
                address: '',
                detail: '',
                latitude: null,
                longitude: null,
                loading: false,
                error: ''
            }
            this.titleSensitiveResult = null

            this.$refs.richTextEditor?.clear()
            this.$refs.categorySelector?.reset()
            this.$refs.tagInput?.reset()
            this.$refs.priceInput?.reset()
            this.$refs.conditionPicker?.reset()
            this.$refs.imageUploader?.reset()
            this.$refs.videoUploader?.reset()
        }
    },

    beforeUnmount() {
        if (this.titleSensitiveChecker) {
            this.titleSensitiveChecker.cancel()
        }
        uni.$off('locationSelected', this.handleLocationSelected)
    }
}
</script>

<style lang="scss" scoped>
.publish-page {
    min-height: 100vh;
    background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
}

.page-header {
    padding: 100rpx 40rpx 60rpx;
}

.page-title {
    font-size: 56rpx;
    font-weight: 700;
    color: #ffffff;
    display: block;
    margin-bottom: 12rpx;
}

.page-subtitle {
    font-size: 28rpx;
    color: rgba(255, 255, 255, 0.8);
}

.content-wrapper {
    height: calc(100vh - 200rpx);
    padding: 0 30rpx;
}

.trade-type-section {
    background: rgba(255, 255, 255, 0.95);
    border-radius: 24rpx;
    padding: 40rpx;
    margin-bottom: 20rpx;
    backdrop-filter: blur(20px);
}

.section-label {
    font-size: 28rpx;
    font-weight: 600;
    color: #333;
    display: block;
    margin-bottom: 20rpx;
}

.trade-tabs {
    display: flex;
    gap: 20rpx;
}

.trade-tab {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 28rpx 16rpx;
    background: #f8f9fa;
    border-radius: 20rpx;
    border: 3rpx solid transparent;
    position: relative;
    transition: all 0.3s ease;

    &.active {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-color: #667eea;
        transform: translateY(-4rpx);
        box-shadow: 0 8rpx 24rpx rgba(102, 126, 234, 0.4);

        .tab-icon, .tab-label {
            color: #ffffff;
        }
    }
}

.tab-icon {
    font-size: 40rpx;
    margin-bottom: 8rpx;
}

.tab-label {
    font-size: 24rpx;
    font-weight: 500;
    color: #666;
}

.tab-check {
    position: absolute;
    top: 8rpx;
    right: 8rpx;
    width: 32rpx;
    height: 32rpx;
    background: #ffffff;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.check-icon {
    font-size: 20rpx;
    color: #667eea;
    font-weight: 700;
}

.form-section {
    background: rgba(255, 255, 255, 0.95);
    border-radius: 20rpx;
    padding: 24rpx;
    margin-bottom: 20rpx;
    backdrop-filter: blur(20px);
}

.form-item {
    position: relative;
}

.title-input {
    width: 100%;
    height: 88rpx;
    padding: 0 80rpx 0 24rpx;
    background: #f8f9fa;
    border-radius: 16rpx;
    font-size: 28rpx;
    color: #333;
}

.char-count {
    position: absolute;
    right: 24rpx;
    top: 50%;
    transform: translateY(-50%);
    font-size: 22rpx;
    color: #999;
}

.sensitive-warning {
    display: flex;
    align-items: flex-start;
    gap: 12rpx;
    margin-top: 16rpx;
    padding: 16rpx 20rpx;
    background: #fff5f5;
    border-radius: 12rpx;
    animation: shake 0.3s ease;
}

@keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-8rpx); }
    75% { transform: translateX(8rpx); }
}

.warning-icon {
    font-size: 28rpx;
    flex-shrink: 0;
}

.warning-text {
    flex: 1;
    font-size: 24rpx;
    color: #ff4757;
    line-height: 1.5;
}

.location-item {
    .location-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 16rpx;
    }

    .section-label.required::before {
        content: '*';
        color: #ff4757;
        margin-right: 6rpx;
    }

    .location-hint {
        font-size: 22rpx;
        color: #999;
    }

    .location-content, .location-placeholder {
        display: flex;
        align-items: center;
        gap: 16rpx;
        padding: 20rpx;
        background: #f8f9fa;
        border-radius: 16rpx;
    }

    .location-icon {
        width: 56rpx;
        height: 56rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 12rpx;
        flex-shrink: 0;

        &.loading {
            animation: spin 1s linear infinite;
        }

        .icon-text {
            font-size: 28rpx;
        }
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    .location-info {
        flex: 1;
        min-width: 0;
    }

    .location-address {
        display: block;
        font-size: 28rpx;
        font-weight: 500;
        color: #333;
        margin-bottom: 4rpx;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .location-detail {
        display: block;
        font-size: 22rpx;
        color: #999;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .location-placeholder-text {
        font-size: 28rpx;
        color: #aaa;
    }

    .location-arrow {
        flex-shrink: 0;
    }

    .arrow-text {
        font-size: 32rpx;
        color: #ccc;
    }

    .location-error {
        margin-top: 12rpx;
        padding: 12rpx 16rpx;
        background: #fff5f5;
        border-radius: 8rpx;
    }

    .error-text {
        font-size: 22rpx;
        color: #ff4757;
    }
}

.contact-item {
    .contact-input {
        width: 100%;
        height: 88rpx;
        padding: 0 24rpx;
        background: #f8f9fa;
        border-radius: 16rpx;
        font-size: 28rpx;
        color: #333;
    }
}

.agreement-check {
    display: flex;
    align-items: flex-start;
    gap: 16rpx;
}

.checkbox {
    width: 36rpx;
    height: 36rpx;
    border: 2rpx solid #ddd;
    border-radius: 8rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-top: 4rpx;

    &.checked {
        background: #667eea;
        border-color: #667eea;
    }

    .check-icon {
        font-size: 24rpx;
        color: #ffffff;
        font-weight: 700;
    }
}

.agreement-text {
    font-size: 24rpx;
    color: #666;
    line-height: 1.5;
    flex: 1;
}

.link-text {
    color: #667eea;
}

.bottom-placeholder {
    height: 200rpx;
}

.bottom-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 24rpx 30rpx;
    padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
    background: #ffffff;
    box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.08);
    display: flex;
    align-items: center;
    gap: 24rpx;
}

.price-preview {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8rpx;
    flex-wrap: wrap;
}

.preview-label {
    font-size: 24rpx;
    color: #999;
}

.preview-price {
    font-size: 36rpx;
    font-weight: 700;
    color: #ff6b6b;
}

.negotiable-tag {
    padding: 4rpx 12rpx;
    background: rgba(102, 126, 234, 0.1);
    border: 1rpx solid rgba(102, 126, 234, 0.3);
    border-radius: 12rpx;
    font-size: 20rpx;
    color: #667eea;
    font-weight: 500;
}

.submit-btn {
    flex: 2;
    height: 88rpx;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 44rpx;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;

    &.disabled {
        opacity: 0.5;
    }

    .btn-text {
        color: #ffffff;
        font-size: 30rpx;
        font-weight: 600;
    }
}
</style>
