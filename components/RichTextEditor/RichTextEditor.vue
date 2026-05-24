<template>
    <view class="rich-text-editor">
        <view class="editor-toolbar">
            <view class="toolbar-group">
                <view
                    class="toolbar-btn"
                    :class="{ active: activeFormats.bold }"
                    @click="format('bold')"
                >
                    <text class="btn-icon">B</text>
                </view>
                <view
                    class="toolbar-btn italic"
                    :class="{ active: activeFormats.italic }"
                    @click="format('italic')"
                >
                    <text class="btn-icon">I</text>
                </view>
                <view
                    class="toolbar-btn underline"
                    :class="{ active: activeFormats.underline }"
                    @click="format('underline')"
                >
                    <text class="btn-icon">U</text>
                </view>
            </view>

            <view class="toolbar-divider"></view>

            <view class="toolbar-group">
                <view class="toolbar-btn" @click="format('lineBreak')">
                    <text class="btn-icon">↵</text>
                </view>
                <view class="toolbar-btn" @click="insertImage">
                    <text class="btn-icon">🖼️</text>
                </view>
            </view>

            <view class="word-count-wrapper">
                <text class="word-count" :class="{ warning: remainingChars < 50 }">
                    {{ remainingChars }} / {{ maxLength }}
                </text>
            </view>
        </view>

        <view class="editor-container" v-if="useMpHtml">
            <!-- #ifdef MP-WEIXIN || APP-PLUS -->
            <editor
                ref="mpEditor"
                class="mp-editor"
                :placeholder="placeholder"
                :maxlength="maxLength"
                show-img-resize
                show-img-toolbar
                @input="onEditorInput"
                @statuschange="onStatusChange"
                @ready="onEditorReady"
            />
            <!-- #endif -->
        </view>

        <view class="editor-container" v-else>
            <textarea
                ref="textareaEditor"
                class="textarea-editor"
                v-model="textContent"
                :placeholder="placeholder"
                :maxlength="maxLength"
                :auto-height="true"
                @input="onTextareaInput"
            />
        </view>

        <view class="content-preview" v-if="showPreview && htmlContent">
            <view class="preview-header">
                <text class="preview-title">预览效果</text>
            </view>
            <view class="preview-content">
                <rich-text :nodes="htmlContent"></rich-text>
            </view>
        </view>

        <view class="error-tip" v-if="errorMessage">
            <text class="error-text">{{ errorMessage }}</text>
        </view>
    </view>
</template>

<script>
export default {
    name: 'RichTextEditor',

    props: {
        value: {
            type: String,
            default: ''
        },
        placeholder: {
            type: String,
            default: '请输入内容，支持加粗、换行等格式...'
        },
        maxLength: {
            type: Number,
            default: 500
        },
        showPreview: {
            type: Boolean,
            default: false
        },
        useMpHtml: {
            type: Boolean,
            default: true
        }
    },

    data() {
        return {
            textContent: '',
            editorCtx: null,
            editorReady: false,
            activeFormats: {
                bold: false,
                italic: false,
                underline: false
            },
            currentCharCount: 0,
            errorMessage: ''
        }
    },

    computed: {
        remainingChars() {
            return this.maxLength - this.currentCharCount
        },

        htmlContent() {
            if (!this.textContent) return ''

            let html = this.textContent
                .replace(/\n/g, '<br/>')
                .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.+?)\*/g, '<em>$1</em>')
                .replace(/__(.+?)__/g, '<u>$1</u>')

            return html
        }
    },

    watch: {
        value: {
            immediate: true,
            handler(val) {
                if (val !== this.textContent) {
                    this.textContent = val || ''
                    this.updateCharCount(this.textContent)
                }
            }
        }
    },

    methods: {
        onEditorReady() {
            // #ifdef MP-WEIXIN || APP-PLUS
            uni.createSelectorQuery()
                .in(this)
                .select('.mp-editor')
                .fields({ node: true, size: true })
                .exec((res) => {
                    if (res && res[0] && res[0].node) {
                        this.editorCtx = res[0].node.getEditorContext()
                        this.editorReady = true

                        if (this.value) {
                            this.editorCtx.setContents({
                                html: this.value,
                                success: () => {
                                    this.updateCharCountFromEditor()
                                }
                            })
                        }
                    }
                })
            // #endif
        },

        onEditorInput(e) {
            const { html, text } = e.detail
            this.textContent = text || ''
            this.updateCharCount(this.textContent)

            if (this.errorMessage && this.remainingChars >= 0) {
                this.errorMessage = ''
            }

            this.$emit('input', html)
            this.$emit('update:modelValue', html)
        },

        onTextareaInput(e) {
            const value = e.detail.value
            this.textContent = value
            this.updateCharCount(value)

            if (this.errorMessage && this.remainingChars >= 0) {
                this.errorMessage = ''
            }

            this.$emit('input', value)
            this.$emit('update:modelValue', value)
        },

        onStatusChange(e) {
            const { formats } = e.detail
            this.activeFormats = {
                bold: formats.bold || false,
                italic: formats.italic || false,
                underline: formats.underline || false
            }
        },

        format(name) {
            if (name === 'lineBreak') {
                this.insertLineBreak()
                return
            }

            if (this.editorCtx && this.editorReady) {
                this.editorCtx.format(name, !this.activeFormats[name])
            } else {
                this.insertMarkdownFormat(name)
            }
        },

        insertLineBreak() {
            if (this.editorCtx && this.editorReady) {
                this.editorCtx.insertDivider()
            } else {
                const textarea = this.$refs.textareaEditor
                if (textarea) {
                    const cursorPos = textarea.cursorPosition || this.textContent.length
                    const newText = this.textContent.slice(0, cursorPos) + '\n' + this.textContent.slice(cursorPos)
                    this.textContent = newText
                    this.$emit('input', newText)
                }
            }
        },

        insertMarkdownFormat(name) {
            const formatMap = {
                bold: '**',
                italic: '*',
                underline: '__'
            }

            const wrapper = formatMap[name]
            if (!wrapper) return

            const textarea = this.$refs.textareaEditor
            if (textarea) {
                const cursorPos = textarea.cursorPosition || this.textContent.length
                const selectedText = ''
                const newText = this.textContent.slice(0, cursorPos) + wrapper + selectedText + wrapper + this.textContent.slice(cursorPos)
                this.textContent = newText
                this.$emit('input', newText)
            }
        },

        insertImage() {
            uni.chooseMedia({
                count: 1,
                mediaType: ['image'],
                sourceType: ['album', 'camera'],
                success: async (res) => {
                    const tempFile = res.tempFiles[0]

                    if (this.editorCtx && this.editorReady) {
                        this.editorCtx.insertImage({
                            src: tempFile.tempFilePath,
                            width: '100%',
                            success: () => {
                                this.updateCharCountFromEditor()
                            }
                        })
                    } else {
                        const imgMarkdown = `\n![图片](${tempFile.tempFilePath})\n`
                        this.textContent += imgMarkdown
                        this.$emit('input', this.textContent)
                    }

                    this.$emit('imageSelected', tempFile)
                }
            })
        },

        updateCharCount(text) {
            this.currentCharCount = (text || '').length

            if (this.remainingChars < 0) {
                this.errorMessage = `已超出${Math.abs(this.remainingChars)}字，请删减内容`
            } else if (this.remainingChars < 50) {
                this.errorMessage = ''
            }
        },

        updateCharCountFromEditor() {
            if (this.editorCtx) {
                this.editorCtx.getContents({
                    success: (res) => {
                        this.updateCharCount(res.text || '')
                    }
                })
            }
        },

        getContents() {
            return new Promise((resolve) => {
                if (this.editorCtx && this.editorReady) {
                    this.editorCtx.getContents({
                        success: (res) => {
                            resolve({
                                html: res.html,
                                text: res.text,
                                charCount: (res.text || '').length
                            })
                        },
                        fail: () => {
                            resolve({
                                html: this.textContent,
                                text: this.textContent,
                                charCount: this.currentCharCount
                            })
                        }
                    })
                } else {
                    resolve({
                        html: this.htmlContent,
                        text: this.textContent,
                        charCount: this.currentCharCount
                    })
                }
            })
        },

        clear() {
            this.textContent = ''
            this.currentCharCount = 0
            this.errorMessage = ''

            if (this.editorCtx && this.editorReady) {
                this.editorCtx.clear()
            }

            this.$emit('input', '')
        }
    }
}
</script>

<style lang="scss" scoped>
.rich-text-editor {
    background: #ffffff;
    border-radius: 16rpx;
    overflow: hidden;
}

.editor-toolbar {
    display: flex;
    align-items: center;
    padding: 16rpx 24rpx;
    background: #f8f9fa;
    border-bottom: 1rpx solid #e9ecef;
    gap: 16rpx;
}

.toolbar-group {
    display: flex;
    align-items: center;
    gap: 8rpx;
}

.toolbar-btn {
    width: 64rpx;
    height: 64rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12rpx;
    background: #ffffff;
    border: 1rpx solid #dee2e6;
    transition: all 0.2s;

    &.active {
        background: #667eea;
        border-color: #667eea;

        .btn-icon {
            color: #ffffff;
        }
    }

    &:active {
        transform: scale(0.95);
    }

    .btn-icon {
        font-size: 28rpx;
        font-weight: 700;
        color: #495057;
    }

    &.italic .btn-icon {
        font-style: italic;
    }

    &.underline .btn-icon {
        text-decoration: underline;
    }
}

.toolbar-divider {
    width: 2rpx;
    height: 40rpx;
    background: #dee2e6;
}

.word-count-wrapper {
    margin-left: auto;
}

.word-count {
    font-size: 24rpx;
    color: #6c757d;

    &.warning {
        color: #ff6b6b;
        font-weight: 500;
    }
}

.editor-container {
    min-height: 300rpx;
    padding: 24rpx;
}

.mp-editor, .textarea-editor {
    width: 100%;
    min-height: 300rpx;
    font-size: 28rpx;
    line-height: 1.6;
    color: #212529;
}

.textarea-editor {
    box-sizing: border-box;
}

.content-preview {
    padding: 24rpx;
    border-top: 1rpx solid #e9ecef;
    background: #f8f9fa;
}

.preview-header {
    margin-bottom: 16rpx;
}

.preview-title {
    font-size: 24rpx;
    color: #6c757d;
    font-weight: 500;
}

.preview-content {
    font-size: 28rpx;
    line-height: 1.6;
    color: #212529;
}

.error-tip {
    padding: 16rpx 24rpx;
    background: #fff5f5;
    border-top: 1rpx solid #ffe3e3;
}

.error-text {
    font-size: 24rpx;
    color: #ff4757;
}
</style>
