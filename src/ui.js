import { bindKeys, Sprite, unbindKeys, init, randInt } from './kontra'
import { WORLD_WIDTH, WORLD_HEIGHT } from './init'
import { drawBeziers, screen, strokeBeziers } from './images'
import { leftRightSwitch } from './helpers'
const { canvas, context } = init()

function isSameCoord(coord1, coord2) {
    return coord1.x == coord2.x && coord1.y == coord2.y && coord1.z == coord2.z
}
export let initUI = container => ({
    win: function () {
        // unbindKeys('esc',)
        bindKeys('esc', () => { })
        Object.keys(this.elements).forEach(key => this.elements[key].show = false)
        this.elements.victory.show = true
        container.isPaused = true
    },
    start: function () {
        this.elements = {
            blackScreen: {
                show: true,
                sprite: screen('black', 0.5)
            },
            currentCoords: {
                show: true,
                sprite: coord(10, 20, container)
            },
            victory: {
                show: false,
                sprite: screen('blue', 0.5)
            },
            holopad: {
                show: true,
                sprite: holopad(),
            },
            frame: {
                show: true,
                sprite: frame(),
            },
            mapGrid: {
                show: true,
                sprite: Sprite({
                    x: WORLD_WIDTH / 2 - container.size.x * 75 / 2,
                    y: 200,
                    opacity: 0.5,
                    lifetime: 0,
                    transparent: false,
                    rand: randInt(200, 450),
                    flicker: randInt(100, 200),
                    update: function () {
                        this.lifetime++
                        if (this.lifetime > this.rand) this.transparent = !this.transparent
                        if (this.lifetime > this.rand + this.flicker) {
                            this.lifetime = 0
                            this.rand = randInt(200, 450)
                            this.flicker = randInt(100, 200)
                            this.transparent = false
                        }
                    },
                    render: function () {
                        function dashedLineTo(x, y, color, ctx) {
                            ctx.setLineDash([5, 5])
                            ctx.lineWidth = 5
                            ctx.strokeStyle = color
                            ctx.lineTo(x, y)
                            ctx.stroke()
                        }
                        let gap = 25
                        this.context.beginPath()
                        this.context.moveTo(-gap / 2, -gap / 2)
                        this.context.setLineDash([5, 5])
                        this.context.lineWidth = 5
                        this.context.strokeStyle = this.transparent ? 'transparent' : 'white'
                        this.context.rect(-gap / 2, -gap / 2, container.size.x * 50 + (container.size.x - 1) * gap + gap, container.size.y * 50 + (container.size.y - 1) * gap + gap)
                        this.context.stroke()
                        for (let y = 1; y < container.size.y; y++) {
                            this.context.beginPath()
                            this.context.moveTo(-gap / 2, 50 * y + gap * y - gap / 2)
                            dashedLineTo(container.size.x * 50 + (container.size.x - 1) * gap + gap / 2, 50 * y + gap * y - gap / 2, this.transparent ? 'transparent' : 'white', this.context)
                        }
                        for (let x = 1; x < container.size.x; x++) {
                            this.context.beginPath()
                            this.context.moveTo(50 * x + gap * x - gap / 2, -gap / 2)
                            dashedLineTo(50 * x + gap * x - gap / 2, container.size.y * 50 + (container.size.y - 1) * gap + gap / 2, this.transparent ? 'transparent' : 'white', this.context)
                        }
                    }
                })
            },
            depth: {
                show: true,
                sprite: Sprite({
                    x: WORLD_WIDTH / 2,
                    y: WORLD_HEIGHT/2+ container.size.y * 75 / 2,
                    opacity: 0.5,
                    render: function () {
                        this.context.font = '50px Arial Black'
                        this.context.setLineDash([5, 1])
                        this.context.lineWidth = 5
                        this.context.strokeStyle = 'white'
                        this.context.textAlign = 'center'
                        this.context.strokeText(`DEPTH ${container.currentCoords.z}`,0,0)
                    }
                })
            },
            map: {
                show: true,
                sprite: Sprite({
                    x: WORLD_WIDTH / 2 - container.size.x * 75 / 2,
                    y: 200,
                    render: function () {
                        let { up, down } = container.stairMap[container.currentCoords.z]
                        for (let coord of container.exploredMaps) {
                            if (coord.z === container.currentCoords.z) {
                                let gap = 25
                                this.context.beginPath()
                                this.context.fillStyle = this.color
                                let hasDownStairs = down && isSameCoord(down.coords, coord)
                                let hasUpStairs = up && isSameCoord(up.coords, coord)
                                let isCurrentCoord = isSameCoord(coord, container.currentCoords)
                                this.context.fillStyle = hasDownStairs ? hasUpStairs ? "orange" : 'red' : hasUpStairs ? 'yellow' : 'blue'
                                this.context.rect(coord.x * 50 + gap * coord.x, coord.y * 50 + gap * coord.y, 50, 50)
                                this.context.fill()
                                if (isCurrentCoord) {
                                    this.context.beginPath()
                                    this.context.fillStyle = 'white'
                                    this.context.arc(25 + coord.x * 50 + gap * coord.x, 25 + coord.y * 50 + gap * coord.y, 5, 0, Math.PI * 2)
                                    this.context.fill()
                                }
                            }
                        }
                    }
                })
            }
        }
    },
    render: function () {
        this.elements && Object.keys(this.elements).forEach(key => {
            if (this.elements[key].show) this.elements[key].sprite.render()
        })
    },
    update: function () {
        this.elements && Object.keys(this.elements).forEach(key => this.elements[key].sprite.update())
    }
})


let coord = (x, y, container) => Sprite({
    render: function () {
        this.context.fillStyle = 'white'
        this.context.font = "30px Arial";
        this.context.beginPath();
        this.context.fillText(`x: ${container.currentCoords.x}`, x, y);
        this.context.fillText(`y: ${container.currentCoords.y}`, x, y + 25);
        this.context.fillText(`z: ${container.currentCoords.z}`, x, y + 50);
    }
})

let holopad = () => {
    let [w, h, l, m] = [WORLD_WIDTH, WORLD_HEIGHT, 100, 200]
    let shapes = [
        [
            [m, l],
            [
                [w - m, l, w - m, l, w - m, l],
                [w - l, l, w - l, l, w - l, m],
                [w - l, h - m, w - l, h - m, w - l, h - m],
                [w - l, h - l, w - l, h - l, w - m, h - l],
                [m, h - l, m, h - l, m, h - l],
                [l, h - l, l, h - l, l, h - m],
                [l, m, l, m, l, m],
                [l, l, l, l, m, l],
            ],
            [m, l],
        ],
    ]
    return Sprite({
        flicker: 0,
        opacity: 0.15,
        shouldWait: 0,
        transparent: true,
        lifetime: 0,
        shapes,
        update: function () {
            this.lifetime++
            this.transparent = !this.transparent
            this.shouldWait++
            if (this.shouldWait < 200) return
            this.flicker += 0.01
            if (this.flicker >= 0.9) {
                this.shouldWait = 0
                this.flicker = 0
            }
        },
        render: function () {
            if (this.transparent) this.color = 'transparent'
            else if (this.shouldWait < 200) {
                this.color = 'green'
            }
            else {
                this.color = context.createLinearGradient(0, 0, WORLD_WIDTH, WORLD_HEIGHT)
                this.color.addColorStop(0 + this.flicker, 'green')
                this.color.addColorStop(.05 + this.flicker, 'transparent')
                this.color.addColorStop(.1 + this.flicker, 'green')
            }
            drawBeziers(this.context, this.color, shapes)
        }
    })
}

let frame = () => {
    let [w, h, l, m, n] = [WORLD_WIDTH, WORLD_HEIGHT, 100, 200, 400]
    let color = 'black'
    let shapes = [
        [
            [0, 0],
            [
                [w, 0, w, 0, w, 0],
                [w, h, w, h, w, h],
                [w - m, h - l, w - m, h - l, w - m, h - l],
                [w - l, h - l, w - l, h - l, w - l, h - m],
                [w - m, l, w - m, l, w - n, l],
                [n, l, n, l, n, l],
                [m, l, m, l, l, h - m],
                [l, h - l, l, h - l, m, h - l],
                [w - m, h - l, w - m, h - l, w - m, h - l],
                [w, h, w, h, w, h],
                [0, h, 0, h, 0, h],
            ],
            [0, 0]
        ]
    ]
    return Sprite({
        render: function () {
            drawBeziers(this.context, color, shapes)
        }
    })
}

