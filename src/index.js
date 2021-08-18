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

function getDirectionVector(body) {
    let vector = kontra.Vector(body.dx, body.dy)
    if (vector.x === 0 && vector.y === 0) return kontra.Vector(0,-1).normalize()
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

const bodies = []
const playerBodies = [player, shadow]

const sprite = kontra.Sprite({
    x: 200,
    y: 200,
    color: 'blue',
    width: 50,
    height: 50,
})
bodies.push(sprite)

const loop = kontra.GameLoop({
    update: () => {
        for (let i = playerBodies.length - 1; i >= 0; i--) {
            if (playerBodies[i].destroy) playerBodies[i].splice(i, 1)
            else playerBodies[i].update()
        }
        bodies.forEach(key => key.update());
    },
    render: () => {
        playerBodies.forEach(key => key.render())
        bodies.forEach(key => key.render());
    },
})

loop.start()

