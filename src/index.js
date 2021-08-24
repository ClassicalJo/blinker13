initKeys()
keyMap['ControlLeft'] = 'ctrl'
keyMap['ShiftLeft'] = 'shift'

let getPointInCircle = {
    x: (vector, r, theta) => vector.x + r * Math.cos(theta),
    y: (vector, r, theta) => vector.y + r * Math.sin(theta),
}

bindKeys('ctrl', function () {
    if (switcherooOnCooldown) return
    switcherooOnCooldown = true
    switcheroo()
    setTimeout(() => switcherooOnCooldown = false, 500)
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

const loop = kontra.GameLoop({
    update: () => {
        world.update()
        pool.update()
    },
    render: () => {
        world.render()
        pool.render()
    },
})

class World {
    constructor(x, y, z) {
        
        this.size = { x, y, z }
        this.depths = this.createDepths(x, y, z)
        this.currentCoords = new Coords(0, 0, 0)
        this.currentQuadrant = this.getQuadrant(this.currentCoords)
        this.stairMap = {}
        UI.start()
        this.makeEnemies()
        this.makeStairs()

    }
    makeStairs() {
        function getTwoRandInts(min, max) {
            return [kontra.randInt(min, max), kontra.randInt(min, max)]
        }
        for (let i = 0; i < this.depths.length; i++) {
            this.stairMap[i] = {}
            let [x1, x2] = getTwoRandInts(0, this.size.x - 1)
            let [y1, y2] = getTwoRandInts(0, this.size.y - 1)
            let quadrant1 = this.getQuadrant(new Coords(x1, y1, i))
            let quadrant2 = this.getQuadrant(new Coords(x2, y2, i))
            if (i !== 0) {
                let stairs = new Stairs(200 + 200 * i, 200 + 100 * i, quadrant1.coords, "brown")
                this.stairMap[i].up = stairs
                quadrant1.add(stairs)
            }
            if (i !== this.depths.length - 1) {
                let stairs = new Stairs(300 + 200 * i, 300 + 100 * i, quadrant2.coords, "black")
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
        this.currentQuadrant.clear()
        this.currentCoords = coords
        this.currentQuadrant = this.getQuadrant(coords)
    }
    render() {
        UI.render()
        this.currentQuadrant.bodies.forEach(key => {
            key.render()
        })
    }
    update() {
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

const player = new Player(400, 200, 'goldenrod', 'player', world.currentCoords)
const shadow = new Player(375, 500, 'purple', 'shadow', world.currentCoords)

let enemy1 = new Enemy(500, 500, 40, world.currentCoords)
let enemy2 = new Enemy(701, 500, 40, world.currentCoords)

let playerMap = { shadow, player }
let activeSprite = 'player'

player.add()
shadow.add()
console.log(world.currentQuadrant)

function SAT(body1, body2) {
    function getNormals(vertices) {
        let axes = []
        for (let i = 0; i < vertices.length; i++) {
            let p1 = kontra.Vector(vertices[i].x, vertices[i].y)
            let next = (i + 1 === vertices.length) ? 0 : i + 1
            let p2 = kontra.Vector(vertices[next].x, vertices[next].y)
            let edge = p1.subtract(p2)
            let normal = { x: edge.y, y: -edge.x }
            axes.push(normal)
        }
        return axes
    }

    function getProjection(axis, vertices) {
        let vector = kontra.Vector(axis.x, axis.y)
        let min = vector.dot(vertices[0])
        let max = min
        for (let i = 1; i < vertices.length; i++) {
            let p = vector.dot(vertices[i])
            if (p < min) {
                min = p
            } else if (p > max) {
                max = p
            }
        }
        return {
            min,
            max,
            overlap: function (projection) {
                return !(min > projection.max || projection.min > max)
            }
        }
    }

    let axes1 = getNormals(body1.vertices)
    let axes2 = getNormals(body2.vertices)


    for (let i = 0; i < axes1.length; i++) {
        let axis = axes1[i]
        let p1 = getProjection(axis, body1.vertices)
        let p2 = getProjection(axis, body2.vertices)
        if (!p1.overlap(p2)) return false
    }
    for (let i = 0; i < axes2.length; i++) {
        let axis = axes2[i]
        let p1 = getProjection(axis, body1.vertices)
        let p2 = getProjection(axis, body2.vertices)
        if (!p1.overlap(p2)) return false
    }
    return true
}

loop.start()


