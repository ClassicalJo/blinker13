import { Sprite, unbindKeys, bindKeys, init, randInt } from './kontra'
import { WORLD_WIDTH, WORLD_HEIGHT, WORLD_CENTER_HEIGHT, WORLD_CENTER_WIDTH } from './init'
import { drawBeziers, drawCircle, drawDashedLine, drawDashedText, drawRect, screen, } from './images'
import { isSameCoord } from './helpers'
import { WHITE, BLACK, BLUE, TRANSPARENT, } from "./helpers";

const { context } = init()
const MAP_TILE_WIDTH = 50
const MAP_TILE_HEIGHT = 50
const MAP_TILE_GAP = 25
const MAP_TILE_HALF_GAP = MAP_TILE_GAP / 2



export let initUI = u => ({
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
        u.isPaused = true
        bindKeys('enter', () => {
            unbindKeys('enter')
            u.restart()
            this.toggle('lose', false)
            this.start()
        })
    },
    win: function () {
        unbindKeys('esc')
        this.disableAll()
        this.toggle('victory', true)
        u.isPaused = true
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
        let elements = ['map', 'mapGrid', 'darken', 'blackout', 'holopad']
        elements.forEach(key => this.toggle(key))
        u.isPaused = false
        bindKeys('esc', () => {
            u.isPaused = !u.isPaused
        })
    },
    elements: {
        blackout: {
            show: true,
            sprite: function () {
                let blackout = screen(BLACK)
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
            sprite: screen(BLACK, 0.5)
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
            sprite: new Flicker({
                x: WORLD_CENTER_WIDTH - u.size.x * 75 / 2,
                y: 200,
                opacity: 0.5,
                color: WHITE,
                render: function () {
                    let [w, h, hg, g] = [MAP_TILE_WIDTH, MAP_TILE_HEIGHT, MAP_TILE_HALF_GAP, MAP_TILE_GAP]
                    let width = u.size.x * w + (u.size.x - 1) * g + g
                    let height = u.size.y * h + (u.size.y - 1) * g + g
                    for (let y = 0; y <= u.size.y; y++) {
                        let origin = { x: -hg, y: (w + g) * y - hg }
                        let dest = { x: width - hg, y: (w + g) * y - hg }
                        drawDashedLine(this.context, this.color, origin.x, origin.y, dest.x, dest.y)
                    }
                    for (let x = 0; x <= u.size.x; x++) {
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
                x: WORLD_CENTER_WIDTH - u.size.x * (MAP_TILE_WIDTH + MAP_TILE_GAP) / 2,
                y: 200,
                render: function () {
                    let [w, h, g] = [MAP_TILE_WIDTH, MAP_TILE_HEIGHT, MAP_TILE_GAP]
                    let { up, down } = u.stairMap[u.coords.z]
                    for (let coord of u.exploredMaps) {
                        if (coord.z === u.coords.z) {
                            let hasDownStairs = down && isSameCoord(down.coords, coord)
                            let hasUpStairs = up && isSameCoord(up.coords, coord)
                            let isCurrentCoord = isSameCoord(coord, u.coords)
                            let color = hasDownStairs ? 'yellow' : hasUpStairs ? "orange" : BLUE
                            let offsetX = coord.x * (g + w)
                            let offsetY = coord.y * (g + h)
                            drawRect(this.context, color, w, h, offsetX, offsetY)
                            isCurrentCoord && drawCircle(this.context, WHITE, 5, offsetX + w / 2, offsetY + h / 2)
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
        bar: 0,
        opacity: 0.15,
        transparent: true,
        lifetime: 0,
        baseColor: color,
        shapes,
        update: function () {
            this.lifetime++
            this.transparent = !this.transparent
            if (this.lifetime < 200) return this.color = this.transparent ? TRANSPARENT : this.baseColor
            this.movement += 0.01
            if (this.bar >= 0.9) {
                this.lifetime = 0
                this.bar = 0
            }
            if (this.transparent) this.color = TRANSPARENT
            else {
                this.color = context.createLinearGradient(0, 0, WORLD_WIDTH, WORLD_HEIGHT)
                this.color.addColorStop(0 + this.bar, this.baseColor)
                this.color.addColorStop(.05 + this.bar, TRANSPARENT)
                this.color.addColorStop(.1 + this.bar, this.baseColor)
            }
        },
        render: function () {
            drawBeziers(this.context, this.color, shapes)
        }
    })
}

let frame = () => {
    let [w, h, l, m, n] = [WORLD_WIDTH, WORLD_HEIGHT, 100, 200, 400]
    let color = BLACK
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

let text = (text, offsetX, offsetY, fontSize) => new Flicker({
    color: WHITE,
    opacity: 0.6,
    render: function () {
        drawDashedText(this.context, this.color, text, fontSize, offsetX, offsetY, true)
    }
})

class Flicker extends Sprite.class {
    constructor(props) {
        super(props);
        this.baseColor = this.color;
        this.flicker = randInt(50, 250);
        this.lifetime = 0;
    }
    toggle() {
        this.color = this.color == this.baseColor ? TRANSPARENT : this.baseColor
    }
    update() {
        this.lifetime++
        if (this.lifetime > 500) this.toggle()
        if (this.lifetime >= 500 + this.flicker) {
            this.lifetime = 0
            this.flicker = randInt(50, 250)
            this.color = this.baseColor
        }
    }
}
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
        holopad(BLUE),
        text('WELCOME HOME', WORLD_CENTER_WIDTH, WORLD_CENTER_HEIGHT, 50),
        text('THANKS FOR KEEPING ME ALIVE', WORLD_CENTER_WIDTH, WORLD_CENTER_HEIGHT + 200, 30),
        frame(),
    ]
})
