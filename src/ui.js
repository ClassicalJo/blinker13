import { Sprite, unbindKeys, bindKeys, init, randInt } from './kontra'
import { WORLD_WIDTH, WORLD_HEIGHT, WORLD_CENTER_HEIGHT, WORLD_CENTER_WIDTH } from './init'
import { drawBeziers, drawCircle, drawDashedLine, drawDashedText, drawRect, screen, } from './images'
import { isSameCoord } from './helpers'

const { context } = init()
const MAP_TILE_WIDTH = 50
const MAP_TILE_HEIGHT = 50
const MAP_TILE_GAP = 25
const MAP_TILE_HALF_GAP = MAP_TILE_GAP / 2

export let initUI = container => ({
    disableAll() {
        Object.keys(this.elements).forEach(key => this.toggle(key, false))
    },
    toggle(str, bool = undefined) {
        if (bool !== undefined) return this.elements[str].show = bool
        this.elements[str].show = !this.elements[str].show
    },
    lose: function () {
        unbindKeys('esc')
        this.disableAll()
        this.toggle('lose', true)
        container.isPaused = true
        bindKeys('enter', () => {
            unbindKeys('enter')
            container.restart()
            this.toggle('lose', false)
            this.start()
        })
    },
    win: function () {
        unbindKeys('esc')
        this.disableAll()
        this.toggle('victory', true)
        container.isPaused = true
    },
    countdown: function () {
        unbindKeys('enter')
        this.toggle('title')
        this.toggle('subtitle')
        setTimeout(() => this.elements.blackout.sprite.isStarting = true, 500)
        setTimeout(() => this.elements.holopad.show = false, 2500)
        setTimeout(() => this.start(), 3500)
    },
    start: function () {
        let elements = ['map', 'mapGrid', 'currentCoords', 'darken', 'blackout', 'holopad']
        elements.forEach(key => this.toggle(key))
        this.elements.lose.sprite = loseScreen()
        container.isPaused = false
        bindKeys('esc', () => {
            container.isPaused = !container.isPaused
        })
    },
    elements: {
        blackout: {
            show: true,
            sprite: function () {
                let blackout = screen('black')
                blackout.isStarting = false
                blackout.update = function () {
                    if (blackout.isStarting && blackout.opacity > 0.1) blackout.opacity -= 0.0125
                }
                return blackout
            }()
        },
        title: {
            show: true,
            sprite: text('BLINKER', WORLD_CENTER_WIDTH, WORLD_CENTER_HEIGHT, 50)
        },
        subtitle: {
            show: true,
            sprite: text("PRESS ENTER TO BEGIN", WORLD_CENTER_WIDTH, WORLD_CENTER_HEIGHT + 250, 35)
        },
        darken: {
            show: false,
            sprite: screen('black', 0.5)
        },
        currentCoords: {
            show: false,
            sprite: Sprite({
                color: 'white',
                x: 400,
                y: WORLD_CENTER_HEIGHT - 150,
                opacity: 0.6,
                children: [
                    text(`X: ${container.currentCoords.x}`, 0, 0, 35),
                    text(`Y: ${container.currentCoords.y}`, 0, 75, 35),
                    text(`Z: ${container.currentCoords.z}`, 0, 150, 35)
                ],
            })
        },
        victory: {
            show: false,
            sprite: winScreen()
        },
        lose: {
            show: false,
            sprite: loseScreen()
        },
        holopad: {
            show: true,
            sprite: holopad('green'),
        },
        frame: {
            show: true,
            sprite: frame(),
        },
        mapGrid: {
            show: false,
            sprite: Sprite({
                x: WORLD_CENTER_WIDTH - container.size.x * 75 / 2,
                y: 200,
                opacity: 0.5,
                lifetime: 0,
                color: 'white',
                rand: randInt(200, 450),
                flicker: randInt(100, 200),
                update: function () {
                    this.lifetime++
                    if (this.lifetime > this.rand) this.color = this.color == 'transparent' ? 'white' : 'transparent'
                    if (this.lifetime > this.rand + this.flicker) {
                        this.lifetime = 0
                        this.rand = randInt(200, 450)
                        this.flicker = randInt(100, 200)
                        this.color = 'white'
                    }
                },
                render: function () {
                    let [w, h, hg, g] = [MAP_TILE_WIDTH, MAP_TILE_HEIGHT, MAP_TILE_HALF_GAP, MAP_TILE_GAP]
                    let width = container.size.x * w + (container.size.x - 1) * g + g
                    let height = container.size.y * h + (container.size.y - 1) * g + g
                    this.context.setLineDash([5, 5])
                    this.context.lineWidth = 5
                    this.context.strokeStyle = this.color
                    drawRect(this.context, this.color, width, height, -hg, -hg, true, false)
                    for (let y = 1; y < container.size.y; y++) {
                        let origin = { x: -hg, y: (w + g) * y - hg }
                        let dest = { x: width - hg, y: (w + g) * y - hg }
                        drawDashedLine(this.context, this.color, origin.x, origin.y, dest.x, dest.y)
                    }
                    for (let x = 1; x < container.size.x; x++) {
                        let origin = { x: (w + g) * x - hg, y: -hg }
                        let dest = { x: (w + g) * x - hg, y: height - hg }
                        drawDashedLine(this.context, this.color, origin.x, origin.y, dest.x, dest.y)
                    }
                }
            })
        },
        map: {
            show: false,
            sprite: Sprite({
                x: WORLD_CENTER_WIDTH - container.size.x * (MAP_TILE_WIDTH + MAP_TILE_GAP) / 2,
                y: 200,
                render: function () {
                    let [w, h, g] = [MAP_TILE_WIDTH, MAP_TILE_HEIGHT, MAP_TILE_GAP]
                    let { up, down } = container.stairMap[container.currentCoords.z]
                    for (let coord of container.exploredMaps) {
                        if (coord.z === container.currentCoords.z) {
                            let hasDownStairs = down && isSameCoord(down.coords, coord)
                            let hasUpStairs = up && isSameCoord(up.coords, coord)
                            let isCurrentCoord = isSameCoord(coord, container.currentCoords)
                            let color = hasDownStairs ? hasUpStairs ? "orange" : 'red' : hasUpStairs ? 'yellow' : 'blue'
                            let offsetX = coord.x * (g + w)
                            let offsetY = coord.y * (g + h)
                            drawRect(this.context, color, w, h, offsetX, offsetY)
                            isCurrentCoord && drawCircle(this.context, 'white', 5, offsetX + w / 2, offsetY + h / 2)
                        }
                    }
                }
            })
        },
    },
    render: function () {
        Object.keys(this.elements).forEach(key => {
            if (this.elements[key].show) this.elements[key].sprite.render()
        })
    },
    update: function () {
        Object.keys(this.elements).forEach(key => this.elements[key].sprite.update())
    }
})

let holopad = color => {
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
        baseColor: color,
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
                this.color = this.baseColor
            }
            else {
                this.color = context.createLinearGradient(0, 0, WORLD_WIDTH, WORLD_HEIGHT)
                this.color.addColorStop(0 + this.flicker, this.baseColor)
                this.color.addColorStop(.05 + this.flicker, 'transparent')
                this.color.addColorStop(.1 + this.flicker, this.baseColor)
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

let text = (text, offsetX, offsetY, fontSize) => Sprite({
    color: "white",
    flicker: randInt(50, 250),
    lifetime: 0,
    opacity: 0.6,
    update: function () {
        this.lifetime++
        if (this.lifetime > 500) this.color = this.color == 'white' ? 'transparent' : "white"
        if (this.lifetime >= 500 + this.flicker) {
            this.lifetime = 0
            this.flicker = randInt(50, 250)
            this.color = 'white'
        }
    },
    render: function () {
        drawDashedText(this.context, this.color, text, fontSize, offsetX, offsetY, true)
    }
})

let loseScreen = () => Sprite({
    children: [
        holopad('red'),
        text('FATAL ERROR', WORLD_CENTER_WIDTH, WORLD_CENTER_HEIGHT, 50),
        text('PRESS ENTER TO TRY AGAIN', WORLD_CENTER_WIDTH, WORLD_CENTER_HEIGHT + 200, 35),
        frame()
    ],
})

let winScreen = () => Sprite({
    children: [
        screen('darkgrey'),
        holopad('blue'),
        text('WELCOME BACK', WORLD_CENTER_WIDTH, WORLD_CENTER_HEIGHT, 50),
        text('THANKS FOR KEEPING ME ALIVE', WORLD_CENTER_WIDTH, WORLD_CENTER_HEIGHT + 200, 30),
        frame(),
    ]
})
