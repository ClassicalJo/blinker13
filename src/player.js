const { degToRad, keyPressed, init, initKeys, keyMap, bindKeys, Vector, angleToTarget } = kontra
const { canvas, context } = init()

function distanceToTarget(origin, dest) {
    return Math.sqrt(Math.pow((dest.x - origin.x), 2) + Math.pow((dest.y - origin.y), 2))
}

function noDirection() {
    return !keyPressed('up') && !keyPressed('down') && !keyPressed('left') && !keyPressed('right')
}
function leftRightSwitch(a, b, c) {
    if (keyPressed('left')) return a
    else if (keyPressed('right')) return b
    else return c
}
function upDownSwitch(a, b, c) {
    if (keyPressed('up')) return a
    else if (keyPressed('down')) return b
    else return c
}
class Combo {
    constructor(steps, cooldown, timer) {
        this.steps = steps
        this.cooldown = cooldown
        this.timer = timer
        this.currentStep = 0
        this.timeout = null
        this.onCooldown = false
        this.canceled = false
        this.start()
    }
    shouldReset() {
        return this.currentStep === 0
    }
    next() {
        this.currentStep++
        clearTimeout(this.timeout)
        this.start()
        if (this.currentStep === this.steps.length) this.currentStep = 0
    }
    start() {
        this.timeout = setTimeout(() => this.cancel(), this.timer)
    }
    cancel() {
        this.canceled = true
    }

}

class Step {
    constructor(stepDistance, stepTimeout) {
        this.distance = stepDistance,
            this.timeout = stepTimeout
    }
}
class Combo1 extends Combo {
    constructor() {
        let step1 = new Step(20, 500)
        let step2 = new Step(5, 1000)
        let step3 = new Step(25, 1000)
        super([step1, step2, step3], 500, 4000);
        this.attackDistance = 50
    }
    attack(body) {
        let move = this.steps[this.currentStep].distance
        if (noDirection()) {
            let direction = getDirection(body)
            if (body.dx !== 0 && body.dy !== 0) {
                body.dx = direction.x * move
                body.dy = direction.y * move
            }

            let sword = this.craftSword(body)
            body.addChild(sword)
        }
        else {
            body.dx = leftRightSwitch(-move, move, 0)
            body.dy = upDownSwitch(-move, move, 0)
            let sword = this.craftSword(body)
            body.addChild(sword)

        }
    }
    craftSword(body) {
        let direction = getDirection(body)
        let theta = Math.atan2(direction.y, direction.x)
        let swingOffset = degToRad(135)
        let offset = { x: -body.width * 4, y: -body.height * 4 }
        return kontra.Sprite({
            x: offset.x * Math.cos(theta + swingOffset),
            y: offset.y * Math.sin(theta + swingOffset),
            rotation: theta + swingOffset,
            width: 100,
            anchor: { x: 0.5, y: 0.5 },
            height: 5,
            color: 'red',
            swing: {
                should: true,
                total: degToRad(90),
                accumulated: 0,
                duration: 100,
            },
            update: function () {
                if (this.swing.should && this.swing.accumulated < this.swing.total) {
                    let speed = this.swing.total / this.swing.duration
                    this.rotation += speed
                    this.swing.accumulated += speed
                    this.x = offset.x * Math.cos(this.rotation)
                    this.y = offset.y * Math.sin(this.rotation)
                }
                else body.removeChild(this)
            },
        })
    }


}


class Player extends kontra.Sprite.class {
    constructor(x, y, color, name) {
        super();
        this.x = x
        this.y = y
        this.moveSpeed = 0.25
        this.speedLimit = 5
        this.baseSpeed = 2
        this.width = 25
        this.height = 25
        this.anchor = { x: 0.5, y: 0.5 }
        this.attackCooldown = false
        this.combo = null
        this.released = true
        this.baseColor = color
        this.color = color
        this.name = name
    }
    attack() {
        this.color = 'red'
        this.released = false
        this.attackCooldown = true
        this.combo.attack(this)
        this.combo.next()
    }
    canAttack = () => keyPressed('shift') && !this.attackCooldown && this.released
    isActive = () => this.name === activeSprite
    reset() {
        this.combo = null
        setTimeout(() => {
            this.attackCooldown = false
            this.color = this.baseColor
        }, 2000)
    }
    shouldCancel = () => this.combo !== null && this.combo.canceled
    cancel() {
        this.combo = null
        this.color = "goldenrod"
    }


    setReady(cooldown) {
        setTimeout(() => {
            this.attackCooldown = false
            this.color = 'green'
        }, cooldown)
    }
    move() {
        let y = upDownSwitch(-1, 1, 0)
        let x = leftRightSwitch(-1, 1, 0)
        
        if (y !== 0 || x !== 0) {
            
            this.rotation = Math.atan2(y, x)
            console.log(this.rotation)
        }

        let shouldTurbo = (scalar, minSpeed) => Math.abs(scalar) < minSpeed
        let shouldSlow = (scalar, maxSpeed) => Math.abs(scalar) > maxSpeed

        if (shouldTurbo(this.dx, this.baseSpeed)) this.dx = this.baseSpeed * x
        if (shouldTurbo(this.dy, this.baseSpeed)) this.dy = this.baseSpeed * y

        this.ddx = this.moveSpeed * x
        this.ddy = this.moveSpeed * y

        if (shouldSlow(this.dx, this.speedLimit)) this.dx *= 0.9
        if (shouldSlow(this.dy, this.speedLimit)) this.dy *= 0.9
        if (!keyPressed('up') && !keyPressed('down')) this.dy *= 0.95
        if (!keyPressed('left') && !keyPressed('right')) this.dx *= 0.95
        this.advance()
    }
    update() {
        this.children.forEach(key => key.update())
        if (!this.isActive()) return
        if (this.shouldCancel()) this.cancel()
        if (this.canAttack()) {
            if (this.combo === null) this.combo = new Combo1()
            this.attack()
            if (this.combo.shouldReset()) this.reset()
            else this.setReady(this.combo.cooldown)
        }
        else if (!keyPressed('shift')) this.released = true
        this.move()
    }
}

const player = new Player(400, 200, 'goldenrod', 'player')
const shadow = new Player(200, 200, 'purple', 'shadow')


function makeLink(origin, dest) {
    return kontra.Sprite({
        x: origin.x,
        y: origin.y,
        rotation: kontra.angleToTarget(origin, dest),
        width: 5,
        height: distanceToTarget(origin, dest),
        anchor: { x: 0.5, y: 1 },
        color: 'black',
        name: 'link',
    })
}

let playerMap = { shadow, player }
let activeSprite = 'player'

let toggleShadow = str => str === 'player' ? 'shadow' : 'player'
let switcheroo = () => {
    let link = makeLink({ x: player.x, y: player.y }, { x: shadow.x, y: shadow.y })
    bodies.push(link)
    activeSprite = toggleShadow(activeSprite)
    setTimeout(() => {
        for (let i = bodies.length - 1; i >= 0; i--) {
            if (bodies[i].name === link.name) bodies.splice(i, 1)
        }
    }, 1000)
}


let switcherooOnCooldown = false
