initKeys()
const WORLD_X = 3
const WORLD_Y = 3
const WORLD_Z = 3
const WORLD_WIDTH = document.querySelector('canvas').width
const WORLD_HEIGHT = document.querySelector('canvas').height
let worldLifetime = 0
let isPaused = true
let bgmInitialized = false

keyMap['ControlLeft'] = 'ctrl'
keyMap['ShiftLeft'] = 'shift'
keyMap['Escape'] = 'esc'

function getPointInCircle(vector, r, theta) {
    return {
        x: vector.x + r.x * Math.cos(theta),
        y: vector.y + r.y * Math.sin(theta),
    }

}

bindKeys('ctrl', function () {
    if (switcherooOnCooldown) return
    switcherooOnCooldown = true
    switcheroo()
    setTimeout(() => switcherooOnCooldown = false, 500)
})

bindKeys('esc', () => {
    if (!bgmInitialized) {
        bgmInitialized = true
        // playBGM('song')
    }
    isPaused = !isPaused
})

//REFACTOREAR UUUUUU console.log
let directions = {
    'left': kontra.Vector(-1, 0),
    'right': kontra.Vector(1, 0),
    'up': kontra.Vector(0, -1),
    'down': kontra.Vector(0, 1),
    'rightup': kontra.Vector(1, -1).normalize(),
    'rightdown': kontra.Vector(1, 1).normalize(),
    'leftdown': kontra.Vector(-1, 1).normalize(),
    'leftup': kontra.Vector(-1, -1).normalize(),
}

function getDirectionVector(body) {
    let vector = kontra.Vector(body.dx, body.dy)
    if (vector.x === 0 && vector.y === 0) return kontra.Vector(0, -1).normalize()
    return vector.normalize()
}

function getDirection(body) {
    let { x, y } = getDirectionVector(body)
    let absX = Math.abs(x)
    let absY = Math.abs(y)

    if (x === NaN && y === NaN) return directions.leftup
    let thresholdUnit = 0.35
    let isMono = (Math.max(absX, absY) - Math.min(absX, absY)) > thresholdUnit

    if (isMono) {
        if (absX > absY) return x < 0 ? directions.left : directions.right
        else return y < 0 ? directions.up : directions.down
    }
    else {
        let a = x < 0 ? 'left' : 'right'
        let b = y < 0 ? 'up' : 'down'
        return directions[a + b]
    }
}

class World extends kontra.Sprite.class {
    constructor(x, y, z) {
        super();
        this.size = { x: WORLD_X, y: WORLD_Y, z: WORLD_Z }
        this.depths = this.createDepths(x, y, z)
        this.currentCoords = new Coords(0, 0, 0)
        this.currentQuadrant = this.getQuadrant(this.currentCoords)
        this.stairMap = {}
        this.width = WORLD_WIDTH
        this.height = WORLD_HEIGHT
        this.exploredMaps = new Set()
        this.makeEnemies()
        this.makeStairs()
        this.makeGoal()
        UI.start()
    }
    makeGoal() {
        let randX = randInt(0, WORLD_X - 1)
        let randY = randInt(0, WORLD_Y - 1)
        let goal = new Goal(new Coords(randX, randY, WORLD_Z - 1))
        this.getQuadrant(new Coords(randX, randY, WORLD_Z - 1)).add(goal)
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
                let stairs = new Stairs(randInt(offset, this.width - offset), randInt(offset, this.height - offset), quadrant1.coords, "silver")
                this.stairMap[i].up = stairs
                quadrant1.add(stairs)
            }
            if (i !== this.depths.length - 1) {
                let stairs = new Stairs(randInt(offset, this.width - offset), randInt(offset, this.height - offset), quadrant2.coords, "brown")
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
                        key.coords
                    ))
                }
            })

    }
    createDepths(x, y, z) {
        let arr = []
        for (let i = 0; i < z; i++) arr.push(new Depth(x, y, i))
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
        worldLifetime++
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
}


let world = new World(3, 3, 3)
const loop = kontra.GameLoop({
    update: () => {
        background.update()
        !isPaused && pool.update()
        !isPaused && scene.update()
        isPaused && UI.update()




    },
    render: () => {
        background.render()
        !isPaused && pool.render()
        !isPaused && scene.render()
        isPaused && UI.render()

    },
})


const player = new Player(400, 200, 'goldenrod', 'player', world.currentCoords)
world.travel(world.currentCoords)
const shadow = new Player(375, 500, 'purple', 'shadow', world.currentCoords)

let enemy1 = new Enemy(500, 500, 40, world.currentCoords)
let enemy2 = new Enemy(701, 500, 40, world.currentCoords)

let playerMap = { shadow, player }
let activeSprite = 'player'


let blackScreen = kontra.Sprite({
    width: world.width,
    height: world.height,
    color: 'black',
})
let spaceGas = (x, y, speed, color) => kontra.Sprite({
    x,
    y,
    width: world.width * 4,
    height: world.height,
    color: color,
    opacity: 0.2,
    dx: speed,
    render: function () {
        this.context.beginPath();
        // this.context.globalCompositeOperation = 'lighten'
        this.context.fillStyle = this.color
        this.context.moveTo(0, 0)
        let heightWave = this.height / 2
        let widthWave = this.width / 8
        this.context.bezierCurveTo(widthWave, -heightWave, widthWave, -heightWave, widthWave * 2, 0);
        this.context.bezierCurveTo(widthWave * 3, heightWave, widthWave * 3, heightWave, widthWave * 4, 0);
        this.context.bezierCurveTo(widthWave * 5, -heightWave, widthWave * 5, -heightWave, widthWave * 6, 0);
        this.context.lineTo(widthWave * 6, this.height)
        this.context.bezierCurveTo(widthWave * 5, this.height + heightWave, widthWave * 5, this.height + heightWave, widthWave * 4, this.height);
        this.context.bezierCurveTo(widthWave * 3, this.height - heightWave, widthWave * 3, this.height - heightWave, widthWave * 2, this.height);
        this.context.bezierCurveTo(widthWave, this.height + heightWave, widthWave, this.height + heightWave, 0, this.height);
        this.context.fill()
    },
    update: function () {
        this.advance()
        if (this.x < - this.width / 2) this.x = 0

    }

})

const background = kontra.Scene({
    id: 'background',
    children: [
        blackScreen,
        spaceGas(-1300, -500, -1, 'darkred'),
        spaceGas(-200, 500, -2.5, 'darkblue'),
        spaceGas(-1000, 800, -2, 'gray'),
        spaceGas(0, 0, -.5, 'purple'),
    ]
})
const scene = kontra.Scene({
    id: 'world',
    // children: [background, spaceGas(0, -400, -10, 'red'), world],
    children: [world],
})

let dia = new DiaBody(300, 300, 100, 300)
dia.add()
player.add()
shadow.add()


loop.start()



