<template>
    <view class="message-bubble" :class="bubbleClass">
        <template v-if="message.recalled">
            <view class="recalled-bubble">
                <text class="recalled-icon">🔄</text>
                <text class="recalled-text">{{ message.isSelf ? '你撤回了一条消息' : '对方撤回了一条消息' }}</text>
            </view>
        </template>
        <template v-else-if="message.msgType === 'text'">
            <text class="message-text">{{ message.content }}</text>
        </template>
        <template v-else-if="message.msgType === 'image'">
            <image
                class="message-image"
                :src="message.content"
                mode="widthFix"
                @click="previewImage"
            />
        </template>
        <template v-else-if="message.msgType === 'voice'">
            <view class="voice-bubble" @click="playVoice">
                <text class="voice-icon">{{ message.playing ? '🔊' : '🔈' }}</text>
                <view class="voice-wave">
                    <view
                        class="wave-bar"
                        v-for="i in Math.min(5, Math.ceil((message.duration || 1) / 2))"
                        :key="i"
                    ></view>
                </view>
                <text class="voice-duration">{{ message.duration }}″</text>
            </view>
        </template>
        <template v-else-if="message.msgType === 'location'">
            <view class="location-bubble" @click="openLocation">
                <text class="location-icon">📍</text>
                <view class="location-info">
                    <text class="location-title">{{ message.content?.title }}</text>
                    <text class="location-address">{{ message.content?.address }}</text>
                </view>
            </view>
        </template>
        <template v-else-if="message.msgType === 'item_card'">
            <view class="item-card-bubble" @click="openItemDetail">
                <image
                    class="item-card-image"
                    :src="message.content?.coverImage || '/static/default_item.png'"
                    mode="aspectFill"
                />
                <view class="item-card-info">
                    <text class="item-card-title">{{ message.content?.title }}</text>
                    <view class="item-card-price-row">
                        <text class="item-card-price">¥{{ message.content?.price }}</text>
                        <text class="item-card-original-price" v-if="message.content?.originalPrice">
                            ¥{{ message.content?.originalPrice }}
                        </text>
                    </view>
                    <view class="item-card-tags" v-if="message.content?.tags && message.content.tags.length > 0">
                        <view class="item-card-tag" v-for="tag in message.content.tags.slice(0, 2)" :key="tag">
                            <text class="tag-text">{{ tag }}</text>
                        </view>
                    </view>
                </view>
                <view class="item-card-action">
                    <text class="action-icon">›</text>
                </view>
            </view>
        </template>
        <template v-else-if="message.msgType === 'system'">
            <text class="system-message">{{ message.content }}</text>
        </template>
        <template v-else>
            <text class="message-text">[不支持的消息类型]</text>
        </template>
    </view>
</template>

<script>
export default {
    name: 'MessageBubble',
    props: {
        message: {
            type: Object,
            required: true
        }
    },
    computed: {
        bubbleClass() {
            const classes = [`type-${this.message.msgType}`]
            if (this.message.status === 'failed') {
                classes.push('failed')
            }
            if (this.message.recalled) {
                classes.push('recalled')
            }
            return classes
        }
    },
    methods: {
        previewImage() {
            this.$emit('preview-image', this.message.content)
        },
        playVoice() {
            this.$emit('play-voice', this.message)
        },
        openLocation() {
            const location = this.message.content
            if (location?.latitude && location?.longitude) {
                uni.openLocation({
                    latitude: location.latitude,
                    longitude: location.longitude,
                    name: location.title,
                    address: location.address
                })
            }
        },
        openItemDetail() {
            const item = this.message.content
            if (item?.id) {
                uni.navigateTo({
                    url: `/pages/item_detail/item_detail?id=${item.id}`
                })
            }
        }
    }
}
</script>

<style lang="scss" scoped>
.message-bubble {
    padding: 20rpx 24rpx;
    border-radius: 24rpx;
    max-width: 100%;
    word-break: break-word;

    &.failed {
        opacity: 0.6;
    }

    &.recalled {
        background: transparent;
        padding: 8rpx 0;
    }

    &.type-system {
        background: transparent;
        padding: 0;
    }

    &.type-item_card {
        padding: 0;
        overflow: hidden;
    }
}

.message-text {
    font-size: 28rpx;
    line-height: 1.6;
}

.system-message {
    font-size: 24rpx;
    color: #999;
}

.recalled-bubble {
    display: flex;
    align-items: center;
    gap: 8rpx;
    padding: 12rpx 20rpx;
    background: rgba(0, 0, 0, 0.05);
    border-radius: 12rpx;
}

.recalled-icon {
    font-size: 24rpx;
}

.recalled-text {
    font-size: 24rpx;
    color: #999;
    font-style: italic;
}

.message-image {
    max-width: 400rpx;
    border-radius: 12rpx;
}

.voice-bubble {
    display: flex;
    align-items: center;
    gap: 12rpx;
    min-width: 160rpx;
    max-width: 300rpx;
}

.voice-icon {
    font-size: 32rpx;
}

.voice-wave {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 4rpx;
    height: 32rpx;
}

.wave-bar {
    flex: 1;
    height: 50%;
    background: rgba(255, 255, 255, 0.4);
    border-radius: 2rpx;
}

:deep(.is-received) .wave-bar {
    background: rgba(102, 126, 234, 0.2);
}

.voice-duration {
    font-size: 24rpx;
    color: rgba(255, 255, 255, 0.8);
}

:deep(.is-received) .voice-duration {
    color: #999;
}

.location-bubble {
    display: flex;
    align-items: center;
    gap: 16rpx;
    min-width: 240rpx;
    max-width: 400rpx;
}

.location-icon {
    font-size: 40rpx;
    flex-shrink: 0;
}

.location-info {
    display: flex;
    flex-direction: column;
    gap: 4rpx;
    flex: 1;
    min-width: 0;
}

.location-title {
    font-size: 28rpx;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.location-address {
    font-size: 22rpx;
    color: rgba(255, 255, 255, 0.7);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

:deep(.is-received) .location-address {
    color: #999;
}

.item-card-bubble {
    display: flex;
    align-items: stretch;
    min-width: 360rpx;
    max-width: 400rpx;
    background: #ffffff;
    border-radius: 16rpx;
    overflow: hidden;
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.1);
}

.item-card-image {
    width: 140rpx;
    height: 140rpx;
    flex-shrink: 0;
    background: #f0f0f0;
}

.item-card-info {
    flex: 1;
    padding: 16rpx;
    display: flex;
    flex-direction: column;
    gap: 8rpx;
    min-width: 0;
}

.item-card-title {
    font-size: 26rpx;
    color: #333;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    line-height: 1.4;
}

.item-card-price-row {
    display: flex;
    align-items: baseline;
    gap: 8rpx;
}

.item-card-price {
    font-size: 28rpx;
    color: #ff4757;
    font-weight: 600;
}

.item-card-original-price {
    font-size: 22rpx;
    color: #999;
    text-decoration: line-through;
}

.item-card-tags {
    display: flex;
    gap: 8rpx;
    flex-wrap: wrap;
}

.item-card-tag {
    padding: 2rpx 12rpx;
    background: rgba(102, 126, 234, 0.1);
    border-radius: 6rpx;
}

.item-card-tag .tag-text {
    font-size: 20rpx;
    color: #667eea;
}

.item-card-action {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 16rpx;
}

.action-icon {
    font-size: 36rpx;
    color: #ddd;
}
</style>
