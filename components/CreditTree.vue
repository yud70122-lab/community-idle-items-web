<template>
    <view class="credit-tree-container">
        <canvas
            class="tree-canvas"
            canvas-id="creditTreeCanvas"
            id="creditTreeCanvas"
            @touchstart="onCanvasTouch"
        ></canvas>

        <view class="modal-mask" v-if="showModal" @click="closeModal">
            <view class="modal-content" @click.stop>
                <view class="modal-header">
                    <text class="modal-title">{{ selectedNode?.name || '权益详情' }}</text>
                    <text class="modal-close" @click="closeModal">×</text>
                </view>
                <view class="modal-body">
                    <view class="node-status" :class="{ unlocked: selectedNode?.unlocked }">
                        <text class="status-icon">{{ selectedNode?.unlocked ? '✓' : '🔒' }}</text>
                        <text class="status-text">{{ selectedNode?.unlocked ? '已解锁' : '未解锁' }}</text>
                    </view>
                    <view class="node-level">
                        <text class="level-label">等级：</text>
                        <text class="level-value">Lv.{{ selectedNode?.level }}</text>
                    </view>
                    <view class="node-points">
                        <text class="points-label">所需积分：</text>
                        <text class="points-value">{{ selectedNode?.requiredPoints }}</text>
                    </view>
                    <view class="node-privileges">
                        <text class="privileges-label">专属权益：</text>
                        <view class="privileges-list">
                            <text
                                v-for="(item, index) in selectedNode?.privileges"
                                :key="index"
                                class="privilege-item"
                            >
                                • {{ item }}
                            </text>
                        </view>
                    </view>
                </view>
                <view class="modal-footer">
                    <button
                        class="modal-btn"
                        :class="{ disabled: !selectedNode?.unlocked }"
                        :disabled="!selectedNode?.unlocked"
                        @click="claimBenefit"
                    >
                        {{ selectedNode?.unlocked ? '领取权益' : '继续加油' }}
                    </button>
                </view>
            </view>
        </view>
    </view>
</template>

<script>
import http from '@/common/interceptor.js'

export default {
    data() {
        return {
            treeData: [],
            nodes: [],
            showModal: false,
            selectedNode: null,
            canvasWidth: 375,
            canvasHeight: 600,
            nodeRadius: 25
        }
    },
    onReady() {
        this.initCanvasSize()
        this.loadTreeData()
    },
    methods: {
        initCanvasSize() {
            const sysInfo = uni.getSystemInfoSync()
            this.canvasWidth = sysInfo.windowWidth
            this.canvasHeight = sysInfo.windowHeight - 200
        },

        async loadTreeData() {
            try {
                uni.showLoading({ title: '加载中...' })
                const res = await http.get('/api/credit/tree')
                this.treeData = res.nodes || res || []
                this.calculateNodePositions()
                this.drawTree()
            } catch (error) {
                console.error('Load tree data failed:', error)
                this.loadMockData()
            } finally {
                uni.hideLoading()
            }
        },

        loadMockData() {
            this.treeData = [
                { id: 1, level: 1, name: '新手入门', requiredPoints: 0, unlocked: true, privileges: ['新人礼包', '首次发布免手续费'] },
                { id: 2, level: 2, name: '初级会员', requiredPoints: 100, unlocked: true, privileges: ['每日签到双倍积分', '发布商品上限+5'] },
                { id: 3, level: 3, name: '活跃达人', requiredPoints: 500, unlocked: true, privileges: ['商品置顶优惠', '专属客服通道'] },
                { id: 4, level: 4, name: '社区精英', requiredPoints: 1000, unlocked: false, privileges: ['交易免手续费', '专属身份标识'] },
                { id: 5, level: 5, name: '贡献领袖', requiredPoints: 3000, unlocked: false, privileges: ['参与社区管理', '年度专属礼品'] },
                { id: 6, level: 6, name: '传奇用户', requiredPoints: 8000, unlocked: false, privileges: ['定制专属服务', '终身荣誉会员'] }
            ]
            this.calculateNodePositions()
            this.drawTree()
        },

        calculateNodePositions() {
            const centerX = this.canvasWidth / 2
            const startY = 80
            const levelGap = (this.canvasHeight - 160) / (this.treeData.length - 1)

            this.nodes = this.treeData.map((node, index) => {
                const offsetX = (index % 2 === 0 ? 1 : -1) * 40
                return {
                    ...node,
                    x: centerX + offsetX,
                    y: startY + index * levelGap
                }
            })
        },

        drawTree() {
            const ctx = uni.createCanvasContext('creditTreeCanvas', this)

            this.drawTrunk(ctx)
            this.drawBranches(ctx)
            this.drawLeaves(ctx)
            this.drawNodes(ctx)

            ctx.draw()
        },

        drawTrunk(ctx) {
            const centerX = this.canvasWidth / 2
            const gradient = ctx.createLinearGradient(centerX - 15, 0, centerX + 15, 0)
            gradient.addColorStop(0, '#8B4513')
            gradient.addColorStop(0.5, '#A0522D')
            gradient.addColorStop(1, '#8B4513')

            ctx.setFillStyle(gradient)
            ctx.beginPath()
            ctx.moveTo(centerX - 12, this.canvasHeight - 50)
            ctx.lineTo(centerX + 12, this.canvasHeight - 50)
            ctx.lineTo(centerX + 8, 50)
            ctx.lineTo(centerX - 8, 50)
            ctx.closePath()
            ctx.fill()

            ctx.setStrokeStyle('#654321')
            ctx.setLineWidth(1)
            for (let i = 0; i < 8; i++) {
                const y = 80 + i * 60
                ctx.beginPath()
                ctx.moveTo(centerX - 10, y)
                ctx.quadraticCurveTo(centerX, y + 10, centerX + 10, y)
                ctx.stroke()
            }
        },

        drawBranches(ctx) {
            ctx.setStrokeStyle('#8B4513')
            ctx.setLineWidth(4)
            ctx.setLineCap('round')

            this.nodes.forEach((node, index) => {
                const centerX = this.canvasWidth / 2
                const startY = 100 + index * ((this.canvasHeight - 200) / (this.nodes.length - 1))
                const direction = index % 2 === 0 ? 1 : -1

                ctx.beginPath()
                ctx.moveTo(centerX, startY)
                ctx.quadraticCurveTo(
                    centerX + direction * 30,
                    startY + 20,
                    node.x,
                    node.y
                )
                ctx.stroke()
            })
        },

        drawLeaves(ctx) {
            const leafColors = ['#228B22', '#32CD32', '#2E8B57', '#3CB371']

            for (let i = 0; i < 30; i++) {
                const x = Math.random() * this.canvasWidth
                const y = 50 + Math.random() * (this.canvasHeight - 150)
                const size = 8 + Math.random() * 12
                const color = leafColors[Math.floor(Math.random() * leafColors.length)]

                ctx.setFillStyle(color)
                ctx.beginPath()
                ctx.ellipse(x, y, size, size * 0.6, Math.random() * Math.PI, 0, 2 * Math.PI)
                ctx.fill()
            }
        },

        drawNodes(ctx) {
            this.nodes.forEach((node) => {
                const { x, y, unlocked } = node

                ctx.beginPath()
                ctx.arc(x, y, this.nodeRadius + 8, 0, 2 * Math.PI)
                ctx.setFillStyle(unlocked ? 'rgba(255, 215, 0, 0.3)' : 'rgba(128, 128, 128, 0.2)')
                ctx.fill()

                const gradient = ctx.createRadialGradient(x - 5, y - 5, 0, x, y, this.nodeRadius)
                if (unlocked) {
                    gradient.addColorStop(0, '#FFD700')
                    gradient.addColorStop(0.5, '#FFA500')
                    gradient.addColorStop(1, '#FF8C00')
                } else {
                    gradient.addColorStop(0, '#A0A0A0')
                    gradient.addColorStop(0.5, '#808080')
                    gradient.addColorStop(1, '#606060')
                }

                ctx.beginPath()
                ctx.arc(x, y, this.nodeRadius, 0, 2 * Math.PI)
                ctx.setFillStyle(gradient)
                ctx.fill()

                ctx.setStrokeStyle(unlocked ? '#FFD700' : '#505050')
                ctx.setLineWidth(3)
                ctx.stroke()

                ctx.setFillStyle('#FFFFFF')
                ctx.setFontSize(16)
                ctx.setTextAlign('center')
                ctx.setTextBaseline('middle')
                ctx.fillText(`Lv.${node.level}`, x, y)

                ctx.setFillStyle(unlocked ? '#333333' : '#999999')
                ctx.setFontSize(12)
                ctx.fillText(node.name, x, y + this.nodeRadius + 20)
            })
        },

        onCanvasTouch(e) {
            const touch = e.touches[0]
            const query = uni.createSelectorQuery().in(this)
            query.select('#creditTreeCanvas').boundingClientRect((rect) => {
                const x = touch.clientX - rect.left
                const y = touch.clientY - rect.top

                for (const node of this.nodes) {
                    const distance = Math.sqrt(Math.pow(x - node.x, 2) + Math.pow(y - node.y, 2))
                    if (distance <= this.nodeRadius + 10) {
                        this.showNodeModal(node)
                        break
                    }
                }
            }).exec()
        },

        showNodeModal(node) {
            this.selectedNode = node
            this.showModal = true
        },

        closeModal() {
            this.showModal = false
            this.selectedNode = null
        },

        async claimBenefit() {
            if (!this.selectedNode?.unlocked) return

            try {
                uni.showLoading({ title: '领取中...' })
                await http.post('/api/credit/claim-benefit', { nodeId: this.selectedNode.id })
                uni.showToast({ title: '领取成功', icon: 'success' })
                this.closeModal()
            } catch (error) {
                console.error('Claim benefit failed:', error)
            } finally {
                uni.hideLoading()
            }
        }
    }
}
</script>

<style lang="scss" scoped>
.credit-tree-container {
    width: 100%;
    min-height: 100vh;
    background: linear-gradient(180deg, #87CEEB 0%, #98FB98 100%);
    position: relative;
}

.tree-canvas {
    width: 100%;
    height: 600px;
    display: block;
}

.modal-mask {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.modal-content {
    width: 600rpx;
    background: #fff;
    border-radius: 24rpx;
    overflow: hidden;
    animation: modalIn 0.3s ease-out;
}

@keyframes modalIn {
    from {
        opacity: 0;
        transform: scale(0.8) translateY(50rpx);
    }
    to {
        opacity: 1;
        transform: scale(1) translateY(0);
    }
}

.modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 30rpx;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.modal-title {
    font-size: 32rpx;
    font-weight: bold;
    color: #fff;
}

.modal-close {
    font-size: 48rpx;
    color: rgba(255, 255, 255, 0.8);
    line-height: 1;
}

.modal-body {
    padding: 30rpx;
}

.node-status {
    display: flex;
    align-items: center;
    gap: 16rpx;
    padding: 20rpx;
    background: #f5f5f5;
    border-radius: 12rpx;
    margin-bottom: 24rpx;

    &.unlocked {
        background: rgba(255, 215, 0, 0.1);
    }
}

.status-icon {
    font-size: 36rpx;
}

.status-text {
    font-size: 28rpx;
    color: #666;

    .unlocked & {
        color: #FFA500;
        font-weight: 500;
    }
}

.node-level,
.node-points {
    display: flex;
    align-items: center;
    margin-bottom: 20rpx;
}

.level-label,
.points-label,
.privileges-label {
    font-size: 28rpx;
    color: #666;
    width: 140rpx;
}

.level-value,
.points-value {
    font-size: 28rpx;
    color: #333;
    font-weight: 500;
}

.node-privileges {
    margin-top: 24rpx;
}

.privileges-list {
    margin-top: 16rpx;
}

.privilege-item {
    display: block;
    font-size: 26rpx;
    color: #555;
    line-height: 1.8;
    padding-left: 10rpx;
}

.modal-footer {
    padding: 30rpx;
    padding-top: 0;
}

.modal-btn {
    width: 100%;
    height: 88rpx;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
    border-radius: 44rpx;
    font-size: 30rpx;
    font-weight: 500;
    border: none;

    &.disabled {
        background: #ccc;
    }
}
</style>
