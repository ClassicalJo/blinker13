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

class RectBody extends kontra.Sprite.class {
    constructor(x, y, width, height) {
        super();
        this.anchor = { x: 0.5, y: 0.5 };
        this.canCollide = true;
        this.timeouts = [];
        this.width = width;
        this.height = height;
        this.x = x;
        this.y = y;
        this.vertices = this.getVertices()
        this.shouldRemove = false
    }
    updateVertices() {
        this.vertices = this.getVertices()
    }
    getVertices() {
        let halfWidth = this.width / 2
        let halfHeight = this.height / 2
        let x = this.x
        let y = this.y
        let leftUp = { x: x - halfWidth, y: y - halfHeight }
        let rightUp = { x: x + halfWidth, y: y - halfHeight }
        let leftDown = { x: x - halfWidth, y: y + halfHeight }
        let rightDown = { x: x + halfWidth, y: y + halfHeight }
        let vertices = [leftUp, leftDown, rightDown, rightUp]
        return vertices.map(key => {
            let theta = this.rotation
            let newX = (key.x - x) * Math.cos(theta) - (key.y - y) * Math.sin(theta) + x
            let newY = (key.x - x) * Math.sin(theta) + (key.y - y) * Math.cos(theta) + y
            return { x: newX, y: newY }
        })
    }

    setCollision(bool, time) {
        if (time) this.timeouts.push(setTimeout(() => this.canCollide = bool, time))
        else this.canCollide = bool
    }
    collide() {
        return
    }
    add() {
        world.addChild(this)
    }
    remove() {
        this.timeouts.forEach(key => clearTimeout(key))
        this.shouldRemove = true
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
        let swordOffset = { x: -body.width * 4, y: -body.height * 4 }
        if (noDirection()) {
            let direction = getDirection(body)
            if (body.dx !== 0 && body.dy !== 0) {
                body.dx = direction.x * move
                body.dy = direction.y * move
            }

            let sword = new Sword(swordOffset, body)
            world.addChild(sword)
        }
        else {
            body.dx = leftRightSwitch(-move, move, 0)
            body.dy = upDownSwitch(-move, move, 0)
            let sword = new Sword(swordOffset, body)
            sword.add()

        }
    }
}


class Player extends RectBody {
    constructor(x, y, color, name) {
        super(x, y, 25, 25);
        this.moveSpeed = 0.25
        this.speedLimit = 5
        this.baseSpeed = 2
        this.anchor = { x: 0.5, y: 0.5 }
        this.attackCooldown = false
        this.combo = null
        this.released = true
        this.baseColor = color
        this.color = color
        this.name = name
        this.canCollide = true
        this.label = 'player'
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
    collide(body) {
        if (!this.canCollide) return
        if (body instanceof Enemy) {
            this.setCollision(false)
            this.dy = -10
            console.log('got hit')
            this.setCollision(true, 1000)
        }
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
        this.vertices = this.getVertices()
    }
}

const player = new Player(400, 200, 'goldenrod', 'player')
const shadow = new Player(375, 500, 'purple', 'shadow')


class Link extends RectBody {
    constructor(origin, dest) {
        super();
        this.width = 5;
        this.height = distanceToTarget(origin, dest);
        this.x = origin.x;
        this.y = origin.y;
        this.anchor = { x: 0.5, y: 1 }
        this.rotation = angleToTarget(origin, dest);
        this.color = 'black';
        this.fadeout = 1000
        this.disappear()
    }
    disappear() {
        let timeout = setTimeout(() => this.remove(), this.fadeout)
        this.timeouts.push(timeout)
    }
}

let playerMap = { shadow, player }
let activeSprite = 'player'

let toggleShadow = str => str === 'player' ? 'shadow' : 'player'
let switcheroo = () => {
    let link = new Link(player, shadow)
    link.add()
    activeSprite = toggleShadow(activeSprite)
}


let switcherooOnCooldown = false


class Sword extends RectBody {
    constructor(offset, body) {
        let theta = body.rotation
        let swingOffset = degToRad(135)
        let x = body.x + offset.x * Math.cos(theta + swingOffset);
        let y = body.y + offset.y * Math.sin(theta + swingOffset);
        let width = 100
        let height = 5
        super(x, y, width, height);
        this.label = 'sword'
        this.offset = offset
        this.center = body
        this.rotation = theta + swingOffset
        this.color = 'red'
        this.swing = {
            should: true,
            total: degToRad(90),
            accumulated: 0,
            duration: 10,
        }
    }
    collide() {

    }
    damage() {
        let min = 15
        let max = 20
        return kontra.randInt(min, max)
    }
    update() {
        if (this.swing.should && this.swing.accumulated < this.swing.total) {
            let speed = this.swing.total / this.swing.duration
            this.rotation += speed
            this.swing.accumulated += speed
            this.x = this.center.x + this.offset.x * Math.cos(this.rotation)
            this.y = this.center.y + this.offset.y * Math.sin(this.rotation)
            this.updateVertices()
        }
        else this.remove()
    }

}

class Enemy extends RectBody {
    constructor(x, y, maxHp) {
        super(x, y, 50, 50);
        this.maxHp = maxHp
        this.hp = maxHp
        this.color = 'lavender'
        this.label = 'enemy'
    }

    collide(body) {
        if (body instanceof Player) {
            //another thing
        }
        if (body.label === 'sword') {
            this.setCollision(false)
            let damage = body.damage()
            let sprite = new Damage(this, damage)
            world.addChild(sprite)
            this.hp -= body.damage()
            this.setCollision(true, 1000)
            if (this.hp <= 0) this.remove()
        }
    }
}

let enemy1 = new Enemy(500, 500, 40)
let enemy2 = new Enemy(701, 500, 40)

class Damage extends kontra.Sprite.class {
    constructor(body, damage) {
        super();
        this.x = body.x
        this.y = body.y
        this.radius = 10
        this.fade = 1000
        this.value = damage
        this.color = 'red'
        this.dx = kontra.randInt(-2, 2)
        this.dy = kontra.randInt(-5, -3) - 2
        this.ddy = 0.2

    }
    draw() {
        this.context.fillStyle = "rgba(255,0,0, " + this.opacity+ ")"
        this.context.beginPath();
        this.context.font = "15px Arial";
        this.context.fillText(this.value, 10, 50);

    }
    update() {
        this.opacity -= 0.01
        this.advance()
        if(this.opacity < 0) world.removeChild(this)
    }
}

