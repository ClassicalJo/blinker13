import { init, initKeys, keyMap, bindKeys, unbindKeys, randInt, Vector, Sprite, GameLoop } from './kontra'
import { Quadrant, Depth, Coords } from './quadrants.js'
import { Enemy, Stairs, DiaBody, Goal, Player, Link, GiantEnemy, Asteroid, FinalBoss } from './sprites.js'
import { screen, spaceGas } from './images.js'
import { pool } from './particles.js'
import { initUI } from './ui.js'
import { SAT } from './sat.js'
import { audioReady, changeBGM, playBGM } from './audioLoader.js'
import { WORLD_WIDTH, WORLD_HEIGHT, WORLD_X, WORLD_Y, WORLD_Z, WORLD_INITIAL_COORDS } from './init'
import { isSameCoord } from './helpers'

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
        this.currentCoords = new Coords(...WORLD_INITIAL_COORDS)
        this.currentQuadrant = this.getQuadrant(this.currentCoords)
        this.stairMap = {}
        this.width = WORLD_WIDTH
        this.height = WORLD_HEIGHT
        this.exploredMaps = new Set()
        this.activeSprite = 'player'
        this.makeStairs()
        this.makeEnemies()
        this.makeBosses()
        this.makeGoal()
        this.travel(this.currentCoords)
        this.player = new Player(400, 200, 'goldenrod', 'player', this.currentCoords, this)
        this.shadow = new Player(375, 500, 'purple', 'shadow', this.currentCoords, this)
        this.switcherooOnCooldown = false
        this.playerMap = { shadow: this.shadow, player: this.player }
        this.lifetime = 0
        this.isPaused = true
    }
    getRegen() {
        return (this.playerMap['player'].regen || this.playerMap['shadow'].regen)
    }
    victory() {
        unbindAll()
        this.getPlayers().forEach(key => key.canMove = false)
        this.currentQuadrant.goal.animate()

    }
    showVictory() {
        UI.win()
    }
    lose() {
        UI.lose()
    }
    restart() {
        let stairs = this.stairMap[this.currentCoords.z].up
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
                        this
                    ))
            }
            for (let i = 0; i < randInt(0, 10); i++) {
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
        return this.getQuadrant(this.currentCoords)
    }
    getPlayers() {
        return Object.values(this.playerMap)
    }
    travel(coords) {
        pool.clear()
        this.currentQuadrant.clear()
        this.currentCoords = coords
        this.exploredMaps.add(coords)
        this.currentQuadrant = this.getQuadrant(coords)
        this.checkBoss() && this.bossFight()
    }
    checkBoss() {
        return isSameCoord(this.currentCoords, this.stairMap[this.currentCoords.z].down.coords) && !this.currentQuadrant.cleared
    }
    bossFight() {
        changeBGM('battle')
    }
    bossWin() {
        changeBGM('travel')
        this.currentQuadrant.open()
        this.stairMap[this.currentCoords.z].down.opacity = 1
        this.stairMap[this.currentCoords.z].down.enableTravel = true
        this.currentQuadrant.cleared = true
    }
    showGoal() {
        changeBGM('travel')
        this.currentQuadrant.add(this.currentQuadrant.goal)
    }
    render() {
        this.currentQuadrant.bodies.forEach(key => {
            key.render()
        })
    }
    update() {
        this.lifetime++
        let bodies = this.currentQuadrant.bodies
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
        return str === 'player' ? 'shadow' : 'player'
    }
    switcheroo() {
        if (this.getRegen()) return
        let link = new Link(this.playerMap[this.activeSprite], this.playerMap[this.toggleShadow(this.activeSprite)], this)
        link.add()
        this.activeSprite = this.toggleShadow(this.activeSprite)
        this.playerMap[this.activeSprite].tempInvulnerable(300)
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
        screen('black', 0.5)
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
    switch (world.currentCoords.z) {
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
