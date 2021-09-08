import { init, initKeys, keyMap, bindKeys, randInt, Vector, Sprite, GameLoop } from './kontra'
import { Quadrant, Depth, Coords } from './quadrants.js'
import { Enemy, Stairs, DiaBody, Goal, Player, Link, GiantEnemy } from './sprites.js'
import { screen, spaceGas } from './images.js'
import { pool } from './particles.js'
import { initUI } from './ui.js'
import { SAT } from './sat.js'
import { playBGM } from './audioLoader.js'
import { WORLD_WIDTH, WORLD_HEIGHT, WORLD_X, WORLD_Y, WORLD_Z, WORLD_INITIAL_COORDS } from './init'


initKeys()

keyMap['ControlLeft'] = 'ctrl'
keyMap['ShiftLeft'] = 'shift'
keyMap['Escape'] = 'esc'
keyMap['Enter'] = 'enter'

export function isWorldPaused() {
    return world.isPaused
}
bindKeys('enter', function () {
    UI.countdown()
    playBGM('battle')
})

bindKeys('ctrl', function () {
    if (world.switcherooOnCooldown) return
    world.switcherooOnCooldown = true
    world.switcheroo()
    setTimeout(() => world.switcherooOnCooldown = false, 500)
})



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
        UI.win()
    }
    lose() {
        UI.lose()
    }
    restart() {
        let stairs = this.stairMap[this.currentCoords.z].up
        let coords = stairs == undefined ? new Coords(0, 0, 0) : stairs.coords
        let position = stairs == undefined ? { x: 400, y: 200 } : { x: stairs.x, y: stairs.y + 100 }
        for (let sprite in this.playerMap) {
            this.playerMap[sprite].travel(coords)
            this.playerMap[sprite].setPosition(position.x, position.y)
            this.playerMap[sprite].setVelocity(0, 0)
            this.playerMap[sprite].regen = false
        }
        this.travel(coords)

    }
    save() {
        this.savedWorld = { ...this, isPaused: true }
    }
    makeGoal() {
        let randX = randInt(0, this.size.x - 1)
        let randY = randInt(0, this.size.y - 1)
        let goal = new Goal(new Coords(randX, randY, this.size.z - 1,), this)
        this.getQuadrant(new Coords(randX, randY, this.size.z - 1)).add(goal)
    }
    makeStairs() {
        function getTwoRandInts(min, max) {
            return [randInt(min, max), randInt(min, max)]
        }
        let offset = 100
        for (let i = 0; i < this.depths.length; i++) {
            this.stairMap[i] = {}
            let [x1, x2] = getTwoRandInts(0, this.size.x - 1)
            let [y1, y2] = getTwoRandInts(0, this.size.y - 1)
            let quadrant1 = this.getQuadrant(new Coords(x1, y1, i))
            let quadrant2 = this.getQuadrant(new Coords(x2, y2, i))
            if (i !== 0) {
                let stairs = new Stairs(randInt(offset, this.width - offset), randInt(offset, this.height - offset), quadrant1.coords, "silver", this)
                this.stairMap[i].up = stairs
                quadrant1.add(stairs)
            }
            if (i !== this.depths.length - 1) {
                let stairs = new Stairs(randInt(offset, this.width - offset), randInt(offset, this.height - offset), quadrant2.coords, "brown", this)
                this.stairMap[i].down = stairs
                quadrant2.add(stairs)
            }
        }
        for (let depth = 0; depth < Object.keys(this.stairMap).length; depth++) {
            if (depth !== 0) {
                this.stairMap[depth].up.addDestiny(this.stairMap[depth - 1].down)
            }
            if (depth !== this.depths.length - 1) {
                this.stairMap[depth].down.addDestiny(this.stairMap[depth + 1].up)
            }

        }
    }
    makeEnemies() {
        this.depths
            .map(key => key.quadrants)
            .flat()
            .flat()
            .forEach(key => {
                if (Math.random() > 0.4) {
                    key.add(new Enemy(
                        Math.random() * 900 + 50,
                        Math.random() * 450 + 50,
                        Math.random() * 40 + 10,
                        key.coords,
                        this
                    ))
                }
            })

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
    travel(coords) {
        pool.clear()
        this.currentQuadrant.clear()
        this.currentCoords = coords
        this.exploredMaps.add(coords)
        this.currentQuadrant = this.getQuadrant(coords)
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

loop.start()



