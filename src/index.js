import { init, initKeys, keyMap, bindKeys, unbindKeys, randInt, Vector, Sprite, GameLoop } from './kontra'
import { Quadrant, Depth, Coords } from './quadrants.js'
import { Enemy, Stairs, Goal, Player, Link, GiantEnemy, Asteroid, FinalBoss } from './sprites.js'
import { screen, spaceGas } from './images.js'
import { pool } from './particles.js'
import { initUI } from './ui.js'
import { SAT } from './sat.js'
import { audioReady, changeBGM, playBGM } from './audioLoader.js'
import { WORLD_WIDTH, WORLD_HEIGHT, WORLD_X, WORLD_Y, WORLD_Z, WORLD_INITIAL_COORDS } from './init'
import { isSameCoord } from './helpers'
import { BLACK } from './helpers'

const PLAYER = 'player'
const SHADOW = 'shadow'

audioReady.then(() => {
    loadingLoop.stop()
    loop.start()
    bindAllKeys()
})

initKeys()

function bindAllKeys() {
    keyMap['ControlLeft'] = 'ctrl'
    keyMap['ShiftLeft'] = 'shift'
    keyMap['Escape'] = 'esc'
    keyMap['Enter'] = 'enter'

    bindKeys('enter', function () {
        UI.countdown()
        playBGM('travel')
    })

    bindKeys('ctrl', function () {
        if (world.switcherooOnCooldown) return
        world.switcherooOnCooldown = true
        world.switcheroo()
        setTimeout(() => world.switcherooOnCooldown = false, 500)
    })
}

function unbindAll() {
    let keys = ['ctrl', 'shift', 'esc', 'enter', 'left', 'up', 'down', 'right']
    unbindKeys(keys)
}

function isWorldPaused() {
    return world.isPaused
}

class World extends Sprite.class {
    constructor(x, y, z) {
        super();
        this.size = { x, y, z }
        this.depths = this.createDepths(x, y, z)
        this.coords = new Coords(...WORLD_INITIAL_COORDS)
        this.q = this.getQuadrant(this.coords)
        this.stairMap = {}
        this.width = WORLD_WIDTH
        this.height = WORLD_HEIGHT
        this.exploredMaps = new Set()
        this.active = PLAYER
        this.makeStairs()
        this.makeEnemies()
        this.makeBosses()
        this.makeGoal()
        this.travel(this.coords)
        this.player = new Player(400, 200, 'goldenrod', PLAYER, this.coords, this)
        this.shadow = new Player(375, 500, 'purple', SHADOW, this.coords, this)
        this.switcherooOnCooldown = false
        this.playerMap = { shadow: this.shadow, player: this.player }
        this.lifetime = 0
        this.isPaused = true
    }
    getRegen() {
        return (this.getActive().regen || this.getInactive().regen)
    }
    victory() {
        unbindAll()
        this.getPlayers().forEach(key => key.canMove = false)
        this.q.goal.shouldAnimate = true
    }
    showVictory() {
        UI.win()
    }
    lose() {
        UI.lose()
    }
    restart() {
        let stairs = this.stairMap[this.coords.z].up
        this.getPlayers().forEach(key => {
            key.travel(stairs.coords)
            key.setPosition(stairs.x, stairs.y)
            key.canMove = true
            key.regen = false
            key.opacity = 1
        })
        this.travel(stairs.coords)
    }

    makeGoal() {
        let { coords } = this.stairMap[this.size.z - 1].down
        let goal = new Goal(coords, this)
        this.getQuadrant(coords).goal = goal
        let finalBoss = new FinalBoss(coords, this)
        this.getQuadrant(coords).add(finalBoss)
    }
    makeStairs() {
        let offset = 100
        for (let i = 0; i < this.depths.length; i++) {
            let mapCoordinates = Array(this.size.x)
                .fill('')
                .map((key, index) => index)
                .map((x, index) => Array(this.size.y).fill('').map((key, y) => [x, y]))
                .flat()

            let [x1, y1] = mapCoordinates.splice(randInt(0, mapCoordinates.length - 1), 1).flat()
            let [x2, y2] = mapCoordinates.splice(randInt(0, mapCoordinates.length - 1), 1).flat()
            if (i == 0) [x1, y1] = [0, 0]

            let upQuadrant = this.getQuadrant(new Coords(x1, y1, i))
            let downQuadrant = this.getQuadrant(new Coords(x2, y2, i))
            let upStairs = new Stairs(randInt(offset, this.width - offset), randInt(offset, this.height - offset), upQuadrant.coords, "silver", this)
            let downStairs = new Stairs(randInt(offset, this.width - offset), randInt(offset, this.height - offset), downQuadrant.coords, "brown", this)

            upStairs.enableTravel = true
            downStairs.opacity = 0
            downQuadrant.close()

            i !== 0 && upQuadrant.add(upStairs)
            i < this.size.z - 1 && downQuadrant.add(downStairs)

            this.stairMap[i] = { up: upStairs, down: downStairs }
        }
        for (let depth = 0; depth < Object.keys(this.stairMap).length; depth++) {
            depth !== 0 && this.stairMap[depth].up.addDestiny(this.stairMap[depth - 1].down)
            depth !== this.size.z - 1 && this.stairMap[depth].down.addDestiny(this.stairMap[depth + 1].up)
        }
    }
    makeEnemies() {
        let offset = 100
        let quadrants = this.depths.map(key => key.quadrants).flat().flat()
        quadrants.forEach(key => {
            let { up, down } = this.stairMap[key.coords.z]
            if (isSameCoord(key.coords, new Coords(0, 0, 0)) ||
                isSameCoord(key.coords, up.coords) ||
                isSameCoord(key.coords, down.coords)) return
            for (let i = 0; i < randInt(0, 4); i++) {
                key.add(
                    new Enemy(
                        randInt(offset, WORLD_WIDTH - offset),
                        randInt(offset, WORLD_HEIGHT - offset),
                        randInt(25, 50),
                        key.coords,
                        this,
                        2 + key.coords.z
                    ))
            }
            for (let i = 0; i < randInt(5, 10 + 5 * key.coords.z); i++) {
                key.add(
                    new Asteroid(
                        randInt(offset, WORLD_WIDTH - offset),
                        randInt(offset, WORLD_HEIGHT - offset),
                        randInt(25, 50),
                        key.coords,
                        this
                    ))
            }
        })
    }

    makeBosses() {
        for (let i = 0; i < this.size.z - 1; i++) {
            let { coords } = this.stairMap[i].down
            new GiantEnemy(coords, this).add()
        }
    }
    createDepths(x, y, z) {
        let arr = []
        for (let i = 0; i < z; i++) arr.push(new Depth(x, y, i, this))
        return arr
    }
    add(coords, body) {
        this.getQuadrant(coords).add(body)
    }
    getQuadrant(coords) {
        let { x, y, z } = coords
        return this.depths[z].quadrants[x][y]
    }
    getCurrentQuadrant() {
        return this.getQuadrant(this.coords)
    }
    getPlayers() {
        return Object.values(this.playerMap)
    }
    getActive() {
        return this.playerMap[this.active]
    }
    getInactive() {
        return this.playerMap[this.toggleShadow(this.active)]
    }
    travel(coords) {
        pool.clear()
        this.q.clear()
        this.coords = coords
        this.exploredMaps.add(coords)
        this.q = this.getQuadrant(coords)
        this.checkBoss() && changeBGM('battle')
    }
    checkBoss() {
        return isSameCoord(this.coords, this.stairMap[this.coords.z].down.coords) && !this.q.cleared
    }
    bossWin() {
        changeBGM('travel')
        this.q.open()
        this.stairMap[this.coords.z].down.opacity = 1
        this.stairMap[this.coords.z].down.enableTravel = true
        this.q.cleared = true
    }
    showGoal() {
        changeBGM('travel')
        this.q.add(this.q.goal)
    }
    render() {
        this.q.bodies.forEach(key => {
            key.render()
        })
    }
    update() {
        this.lifetime++
        let bodies = this.q.bodies
        for (let i = bodies.length - 1; i >= 0; i--) {
            for (let j = i - 1; j >= 0; j--) {
                if (bodies[i].canCollide && bodies[j].canCollide) {
                    let collision = SAT(bodies[i], bodies[j])
                    if (collision) {
                        bodies[j].collide(bodies[i])
                        bodies[i].collide(bodies[j])
                    }
                }
            }
        }
        for (let i = bodies.length - 1; i >= 0; i--) {
            if (!bodies[i].isAlive()) bodies.splice(i, 1)
            else bodies[i].update()
        }
    }
    toggleShadow(str) {
        return str === PLAYER ? SHADOW : PLAYER
    }
    switcheroo() {
        if (this.getRegen()) return
        let link = new Link(this.getActive(), this.getInactive(), this)
        link.add()
        this.active = this.toggleShadow(this.active)
        this.getActive().tInv(300)
    }
}
let world = new World(WORLD_X, WORLD_Y, WORLD_Z)
let UI = initUI(world)
world.player.add()
world.shadow.add()

const loop = GameLoop({
    update: () => {
        background.update()
        !isWorldPaused() && pool.update()
        !isWorldPaused() && world.update()
        isWorldPaused() && UI.update()
    },
    render: () => {
        background.render()
        !isWorldPaused() && pool.render()
        !isWorldPaused() && world.render()
        isWorldPaused() && UI.render()
    },
})

let loading = Sprite({
    children: [
        spaceGas(0, 0, 2, 'purple'),
        screen(BLACK, 0.5)
    ]
})

const loadingLoop = GameLoop({
    render: () => {
        loading.render()
    },
    update: () => {
        loading.update()
    }

})

let filter = screen('blue', 0.25)
filter.update = function () {
    switch (world.coords.z) {
        case 1: return this.color = 'blue'
        case 2: return this.color = 'purple'
        case 3: return this.color = 'red'
        default: return this.color = 'transparent'
    }
}

const background = Sprite({
    id: 'background',
    children: [
        screen('black'),
        spaceGas(-1300, -500, -1, 'darkred'),
        spaceGas(-200, 500, -2.5, 'darkblue'),
        spaceGas(-1000, 800, -2, 'gray'),
        spaceGas(0, 0, -.5, 'purple'),
        filter
    ]
})

loadingLoop.start()
