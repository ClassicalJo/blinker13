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
class Coords {
    constructor(x, y, z) {
        this.x = x
        this.y = y
        this.z = z
    }
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
    constructor(x, y, width, height, coords = new Coords(0, 0, 0)) {
        super({ x, y, width, height });
        this.anchor = { x: 0.5, y: 0.5 };
        this.canCollide = true;
        this.timeouts = [];
        this.vertices = this.getVertices()
        this.coords = coords
        this.invulnerable = false
        this.label = 'RectBody'
    }
    updateVertices() {
        this.vertices = this.getVertices()
    }

    getVertices() {
        let w = this.width / 2
        let h = this.height / 2
        let { x, y } = this
        let leftUp = { x: x - w, y: y - h }
        let rightUp = { x: x + w, y: y - h }
        let leftDown = { x: x - w, y: y + h }
        let rightDown = { x: x + w, y: y + h }
        let vertices = [leftUp, leftDown, rightDown, rightUp]
        return vertices.map(key => {
            let theta = this.rotation
            let newX = (key.x - x) * Math.cos(theta) - (key.y - y) * Math.sin(theta) + x
            let newY = (key.x - x) * Math.sin(theta) + (key.y - y) * Math.cos(theta) + y
            return { x: newX, y: newY }
        })
    }

    setPosition(x, y) {
        this.x = x
        this.y = y
        return this
    }
    setCollision(bool, time) {
        if (time) this.timeouts.push(setTimeout(() => this.canCollide = bool, time))
        else this.canCollide = bool
    }
    collide() {
        return
    }
    add() {
        world.add(this.coords, this)

    }
    setInvulnerable(bool, time) {
        if (time) this.timeouts.push(setTimeout(() => this.invulnerable = bool, time))
        else this.invulnerable = bool
    }
    tempInvulnerable() {
        this.invulnerable = true
        this.timeouts.push(setTimeout(() => this.invulnerable = false, 1000))
        return this
    }
    remove() {
        this.ttl = 0
        this.timeouts.forEach(key => clearTimeout(key))
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
            sword.add()
        }
        else {
            body.dx = leftRightSwitch(-move, move, 0)
            body.dy = upDownSwitch(-move, move, 0)
            let sword = new Sword(swordOffset, body)
            sword.add(body.coords)
        }
    }
}


class Player extends RectBody {
    constructor(x, y, color, name, coords) {
        super(x, y, 25, 25, coords);
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
    travel(coords) {
        world.getQuadrant(coords).remove(this)
        this.coords = coords
        world.getQuadrant(coords).add(this)
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
        smoke(this)
        this.isActive() && this.advance()
    }
    collide(body) {
        if (!this.canCollide || this.invulnerable) return
        if (body instanceof Enemy) {
            this.setInvulnerable(true)
            let inverse = kontra.Vector(this.dx * -1, this.dy * -1).normalize()
            this.dx = inverse.x * this.width || 0
            this.dy = inverse.y * this.height || -this.height
            this.setInvulnerable(false, 1000)
        }
    }
    update() {
        if (!this.isActive()) return
        if (this.shouldCancel()) this.cancel()
        if (this.canAttack()) {
            if (!this.combo) this.combo = new Combo1()
            this.attack()
            if (this.combo.shouldReset()) this.reset()
            else this.setReady(this.combo.cooldown)
        }
        else if (!keyPressed('shift')) this.released = true
        this.move()
        this.vertices = this.getVertices()
    }
}


class Link extends RectBody {
    constructor(origin, dest) {
        super(origin.x, origin.y, 5, 5, origin.coords)
        this.radius = 10;
        this.color = 'white';
        this.ttl = 10

        let distance = distanceToTarget(origin, dest) / 10
        let theta = Math.atan2(dest.y - origin.y, dest.x - origin. x)
        this.dx = 2*distance * Math.cos(theta)
        this.dy = 2*distance * Math.sin(theta)
    }
    render() {
        this.context.fillStyle = this.color;
        this.context.beginPath();
        this.context.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        this.context.fill();
    }
    update() {
        this.ttl -= 1
        this.advance()
    }

}


let toggleShadow = str => str === 'player' ? 'shadow' : 'player'
let switcheroo = () => {
    let link = new Link(playerMap[activeSprite], playerMap[toggleShadow(activeSprite)])
    link.add()
    activeSprite = toggleShadow(activeSprite)
}


let switcherooOnCooldown = false


class Sword extends RectBody {
    constructor(offset, body) {
        let swingOffset = degToRad(135)
        super(
            getPointInCircle.x(body, offset.x, body.rotation + swingOffset),
            getPointInCircle.y(body, offset.y, body.rotation + swingOffset),
            100, 5, body.coords);
        this.ttl = 10
        this.label = 'sword'
        this.offset = offset
        this.center = body
        this.rotation = body.rotation + swingOffset
        this.color = 'red'
        this.swing = {
            should: true,
            total: degToRad(90),
            accumulated: 0,
            duration: 10,
        }
    }
    damage() {
        let min = 15
        let max = 20
        return kontra.randInt(min, max)
    }
    update() {
        if (this.isAlive()) {
            this.ttl -= 1
            let speed = this.swing.total / this.swing.duration
            this.rotation += speed
            this.swing.accumulated += speed
            this.x = this.center.x + this.offset.x * Math.cos(this.rotation)
            this.y = this.center.y + this.offset.y * Math.sin(this.rotation)
            this.updateVertices()
        }
    }

}

class Enemy extends RectBody {
    constructor(x, y, maxHp, coords) {
        super(x, y, 50, 50, coords);
        this.maxHp = maxHp
        this.hp = maxHp
        this.color = 'lavender'
        this.label = 'enemy'
    }
    die() {
        explosion(this.x, this.y)
        this.remove()
    }
    collide(body) {
        if (body instanceof Player) {
            //another thing
        }
        if (body instanceof Sword) {
            this.setCollision(false)
            let damage = body.damage()
            new Damage(this, damage)
            this.hp -= damage
            this.setCollision(true, 1000)
            this.hp <= 0 && this.die()
        }
    }
}




class Damage extends kontra.Sprite.class {
    constructor(body, damage) {
        super();
        this.center = body
        this.x = body.x
        this.y = body.y
        this.ttl = 100
        this.value = damage
        this.color = 'white'
        this.dx = kontra.randInt(-2, 2)
        this.dy = kontra.randInt(-5, -3) - 2
        this.ddy = 0.2
        this.add()
    }
    add() {
        world.add(this.center.coords, this)
    }
    draw() {
        this.context.fillStyle = this.color
        this.context.beginPath();
        this.context.font = "32px Roboto";
        this.context.fillText(this.value, 10, 50);
    }
    update() {
        this.opacity -= .01
        this.ttl -= 1
        this.advance()
    }
}

class Quadrant {
    constructor(x, y, z) {
        this.coords = new Coords(x, y, z)
        this.bodies = []
        this.width = WORLD_WIDTH
        this.height = WORLD_HEIGHT
        this.thickness = 5
        this.frame = this.setFrame()
        this.frame.forEach(key => this.add(key))
    }
    close() {
        this.frame.forEach(key => key.enableTravel = false)
    }
    open() {
        this.frame.forEach(key => key.enableTravel = true)
    }
    add(body) {
        this.bodies.push(body)
    }
    remove(body) {
        for (let i = 0; i < this.bodies.length; i++) {
            if (this.bodies[i] === body) {
                this.bodies.splice(i, 1)
            }
        }
    }
    clear() {
        for (let i = 0; i < this.bodies.length; i++) {
            if (this.bodies[i] instanceof Sword) {
                this.bodies.splice(i, 1)
            }
        }
    }
    setFrame() {
        let [w, h, t] = [this.width, this.height, this.thickness]
        let validDestiny = () => {
            let { x, y, z } = this.coords
            let up = y - 1 >= 0 ? new Coords(x, y - 1, z) : null
            let left = x - 1 >= 0 ? new Coords(x - 1, y, z) : null
            let down = y + 1 < WORLD_Y ? new Coords(x, y + 1, z) : null
            let right = x + 1 < WORLD_X ? new Coords(x + 1, y, z) : null
            return [up, left, down, right]
        }
        let [up, left, down, right] = validDestiny(this.coords)
        return [
            new Wall(w / 2, t / 2, w, t, t, up),
            new Wall(t / 2, t + h / 2, t, h, t, left),
            new Wall(w - t / 2, h / 2 + t, t, h, t, right),
            new Wall(w / 2, h - t / 2, w, t, t, down),
        ]
    }
}


class Wall extends RectBody {
    constructor(x, y, width, height, thickness, destiny) {
        super(x, y, width, height);
        this.thickness = thickness
        this.destiny = destiny
        this.enableTravel = true
        this.color = this.destiny ? 'transparent' : 'red'
        this.opacity = 0.7
        this.label = 'wall'
    }

    collide(body) {
        if (body instanceof Wall) return
        if (body instanceof Player && body.isActive()) {
            let target = { x: body.x, y: body.y }
            let inverseSpeed = kontra.Vector(body.dx * -1, body.dy * -1)
            let min = 50
            let max = { x: world.width - min, y: world.height - min }
            if (this.height > this.width) {
                target.x = body.x > max.x ? min : max.x
                body.x += inverseSpeed.x
            }
            else {
                target.y = body.y > max.y ? min : max.y
                body.y += inverseSpeed.y
            }
            if (this.destiny && this.enableTravel) {
                world.travel(this.destiny)
                player
                    .setPosition(target.x, target.y)
                    .travel(this.destiny)
                shadow
                    .setPosition(target.x, target.y)
                    .travel(this.destiny)
            }

        }
    }
}

class Depth {
    constructor(x, y, z) {
        this.quadrants = []
        for (let i = 0; i < x; i++) {
            let column = []
            for (let j = 0; j < y; j++) {
                column.push(new Quadrant(i, j, z))
            }
            this.quadrants.push(column)
        }
    }
}

class Stairs extends RectBody {
    constructor(x, y, coords, color) {
        super(x, y, 25, 25, coords);
        this.color = color
        this.label = 'stairs'

    }
    addDestiny(coords) {
        this.destiny = coords
    }
    collide(body) {
        if (body instanceof Player && this.destiny !== undefined && keyPressed('space')) {
            world.travel(this.destiny.coords)
            player
                .setPosition(this.destiny.x, this.destiny.y + 50)
                .tempInvulnerable()
                .travel(this.destiny.coords)
            shadow
                .setPosition(this.destiny.x, this.destiny.y + 50)
                .tempInvulnerable()
                .travel(this.destiny.coords)

        }

    }
}


// class DiaBody extends RectBody {
//     constructor(x, y, width, height) {
//         super(x, y, width, height)
//         this.color = 'yellow'
//         this.vertices = this.getVertices()
//     }
//     getVertices() {
//         let w = this.width / 2
//         let h = this.height / 2
//         let { x, y } = this
//         let up = { x, y: y - h }
//         let left = { x: x - w, y }
//         let down = { x, y: y + h }
//         let right = { x: x + w, y }
//         let vertices = [left, down, right, up]
//         // return vertices
//         return vertices.map(key => {
//             let theta = this.rotation
//             let newX = (key.x - x) * Math.cos(theta) - (key.y - y) * Math.sin(theta) + x
//             let newY = (key.x - x) * Math.sin(theta) + (key.y - y) * Math.cos(theta) + y
//             return { x: newX, y: newY}
//         })

//     }
//     update() {
//         // this.rotation += degToRad(1)
//     }
//     draw() {
//         this.context.beginPath()
//         this.context.fillStyle = this.color
//         this.context.moveTo(this.vertices[0].x - this.width, this.vertices[0].y - this.height)
//         for (let i = 1; i < this.vertices.length; i++) {
//             this.context.lineTo(this.vertices[i].x - this.width, this.vertices[i].y - this.height)
//         }
//         this.context.lineTo(this.vertices[0].x - this.width, this.vertices[0].y - this.height)
//         this.context.fill()
//     }
//     collide(body) {
//         console.log('colliding')
//     }
// }

