initKeys()
keyMap['ControlLeft'] = 'ctrl'
keyMap['ShiftLeft'] = 'shift'



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

function getMag(vector) {
    return Math.sqrt(Math.pow(vector.x, 2) + Math.pow(vector.y, 2))
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
const sprite = kontra.Sprite({
    x: 200,
    y: 200,
    anchor: { x: 0.5, y: 0.5 },
    color: 'pink',
    width: 50,
    height: 50,
})


const loop = kontra.GameLoop({
    update: () => {
        world.update()
    },
    render: () => {
        world.render()
    },
})

loop.start()

class World extends kontra.Sprite.class {
    constructor() {
        super();
    }
    render() {
        this.children.forEach(key => {
            key.render()
        })
    }
    update() {
        this.children.forEach(key => key.update())
        for (let i = 0; i < this.children.length; i++) {
            for (let j = i + 1; j < this.children.length; j++) {
                let collision = SAT(this.children[i], this.children[j])
                if (collision) {
                    console.log('collision found')
                }

            }
        }

    }
}
let world = new World()

// world.addChild(sprite)
// world.addChild(player)
world.addChild(shadow)
world.addChild(enemy1)
world.addChild(enemy2)


function SAT(body1, body2) {
    function getVertices(body) {
        let halfWidth = body.width / 2
        let halfHeight = body.height / 2
        let leftUp = { x: body.x - halfWidth, y: body.y - halfHeight }
        let rightUp = { x: body.x + halfWidth, y: body.y - halfHeight }
        let leftDown = { x: body.x - halfWidth, y: body.y + halfHeight }
        let rightDown = { x: body.x + halfWidth, y: body.y + halfHeight }
        let vertices = [leftUp, leftDown, rightDown, rightUp]
        if (body.rotation !== 0) {
            return vertices.map(key => {
                let theta = body.rotation
                let x = (key.x - body.x) * Math.cos(theta) - (key.y - body.y) * Math.sin(theta) + body.x
                let y = (key.x - body.x) * Math.sin(theta) + (key.y - body.y) * Math.cos(theta) + body.y
                return { x, y }
            })
        }
        return vertices
    }
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
    let vertices1 = getVertices(body1)
    let vertices2 = getVertices(body2)
    
    let axes1 = getNormals(vertices1)
    let axes2 = getNormals(vertices2)


    for (let i = 0; i < axes1.length; i++) {
        let axis = axes1[i]
        let p1 = getProjection(axis, vertices1)
        let p2 = getProjection(axis, vertices2)
        if (!p1.overlap(p2)) return false
    }
    for (let i = 0; i < axes2.length; i++) {
        let axis = axes2[i]
        let p1 = getProjection(axis, vertices1)
        let p2 = getProjection(axis, vertices2)
        if (!p1.overlap(p2)) return false
    }
    return true
}
let collision = SAT(shadow, sprite)

