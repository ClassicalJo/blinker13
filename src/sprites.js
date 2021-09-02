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

function getTheta(origin, dest) {
    return Math.atan2(dest.y - origin.y, dest.x - origin.x)
}
function rotateVertex(theta, vertex, origin) {
    return {
        x: (vertex.x - origin.x) * Math.cos(theta) - (vertex.y - origin.y) * Math.sin(theta) + origin.x,
        y: (vertex.x - origin.x) * Math.sin(theta) + (vertex.y - origin.y) * Math.cos(theta) + origin.y
    }

}
class Coords {
    constructor(x, y, z) {
        this.x = x
        this.y = y
        this.z = z
    }
}

class Combo {
    constructor(body) {
        this.timer = 0
        this.countdown = 4000
        this.timeouts = []
        this.intervals = []
        this.body = body
        this.cooldown = false
        this.finished = false

    }
    tempCooldown(time) {
        this.cooldown = true
        this.timeouts.push(setTimeout(() => this.cooldown = false, time))
    }

    attack(body) {
        if (this.cooldown || this.finished) return
        if (this.timer === 0) {
            this.start()
            this.first(body)
        }
        else if (this.timer > 150) {
            this.lance(body)
            this.tempCooldown(1000)
            this.timeouts.push(setTimeout(() => {
                this.end()
            }, 1000))

        }

    }
    first(body) {
        body.tempInvulnerable(500)
        this.tempCooldown(150)
        let move = 20;
        let swordOffset = { x: -this.body.width * 4, y: -this.body.height * 4 }
        if (noDirection()) {
            let direction = getDirectionVector(this.body).scale(move)
            if (this.body.dx !== 0 && this.body.dy !== 0) this.body.setVelocity(direction.x, direction.y)
        }
        else {
            this.body.setVelocity(leftRightSwitch(-move, move, 0), upDownSwitch(-move, move, 0))
        }
        let sword = new Sword(swordOffset, this.body)
        sword.add()
        playSFX('lightsaber')
    }
    lance(body) {
        let totalDistance = 300
        let frames = 10
        let move = totalDistance / frames
        if (noDirection()) {
            let direction = getDirectionVector(body)
            if (body.dx !== 0 && body.dy !== 0) body.setVelocity(direction.x * move, direction.y * move)
        }
        else {
            body.setVelocity(leftRightSwitch(-move, move, 0), upDownSwitch(-move, move, 0))
        }
        let shield = new Shield(body, body.width * 10, body.height * 1.5, frames)
        shield.add()
    }
    start() {
        this.intervals.push(setInterval(() => this.timer += 100, 100))
        this.timeouts.push(setTimeout(() => this.finished = true, this.countdown))
    }
    end() {
        this.intervals.forEach(key => clearInterval(key))
        this.timeouts.forEach(key => clearTimeout(key))
        this.finished = true
    }
}

class RectBody extends kontra.Sprite.class {
    constructor(x, y, width, height, coords = new Coords(0, 0, 0)) {
        super({ x, y, width, height });
        this.anchor = { x: 0.5, y: 0.5 };
        this.canCollide = true;
        this.timeouts = [];
        this.intervals = []
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
        return vertices.map(key => rotateVertex(this.rotation, key, this))
    }

    setPosition(x, y) {
        this.x = x
        this.y = y
        return this
    }

    setVelocity(x, y) {
        this.dx = x
        this.dy = y
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
    tempInvulnerable(time) {
        this.invulnerable = true
        this.timeouts.push(setTimeout(() => this.invulnerable = false, time))
        return this
    }
    remove() {
        this.timeouts.forEach(key => clearTimeout(key))
        this.intervals.forEach(key => clearInterval(key))
        this.ttl = 0
    }
}

class Player extends RectBody {
    constructor(x, y, color, name, coords) {
        super(x, y, 25, 25, coords);
        this.moveSpeed = 0.25
        this.speedLimit = 5
        this.baseSpeed = 2
        this.combo = null
        this.released = true
        this.baseColor = color
        this.color = color
        this.name = name
        this.label = 'player'
        this.add(world.currentCoords)
    }
    attack() {
        if (!this.combo || this.combo.finished) return
        else {

            this.combo.attack(this)
        }
    }

    canAttack = () => keyPressed('shift') && !this.attackCooldown && this.released
    isActive = () => this.name === activeSprite

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
        if (this.x < 0) this.x = this.width
        if (this.x > WORLD_WIDTH) this.x = WORLD_WIDTH - this.width
        if (this.y < 0) this.y = this.height
        if (this.y > WORLD_HEIGHT) this.y = WORLD_HEIGHT - this.height
        let y = upDownSwitch(-1, 1, 0)
        let x = leftRightSwitch(-1, 1, 0)
        if (y !== 0 || x !== 0) this.rotation = Math.atan2(y, x)

        if (Math.abs(this.dx) < this.baseSpeed) this.dx = this.baseSpeed * x
        if (Math.abs(this.dy) < this.baseSpeed) this.dy = this.baseSpeed * y

        this.ddx = this.moveSpeed * x
        this.ddy = this.moveSpeed * y

        if (Math.abs(this.dx) > this.speedLimit) this.dx *= 0.9
        if (Math.abs(this.dy) > this.speedLimit) this.dy *= 0.9

        if (!keyPressed('up') && !keyPressed('down')) this.dy *= 0.95
        if (!keyPressed('left') && !keyPressed('right')) this.dx *= 0.95
        this.advance()
        if (!noDirection()) {
            fire(this)
            smoke(this)
        }
    }
    collide(body) {
        if (!this.canCollide || this.invulnerable || !this.isActive()) return
        if (body instanceof Enemy) {
            this.tempInvulnerable(1000)
            let inverse = kontra.Vector(this.dx * -1, this.dy * -1).normalize()
            this.dx = inverse.x * this.width || 0
            this.dy = inverse.y * this.height || -this.height
            switcheroo()
        }
    }

    travel(coords) {
        playerMap[toggleShadow(activeSprite)].setVelocity(0, 0)
        world.getQuadrant(coords).remove(this)
        this.coords = coords
        world.getQuadrant(coords).add(this)
    }
    update() {
        if (!this.isActive()) return
        if (this.shouldCancel()) this.cancel()
        if (this.canAttack()) {
            if (!this.combo) this.combo = new Combo(this)
            if (this.combo.finished) this.combo = null
            this.attack()
        }
        else if (!keyPressed('shift')) this.released = true
        this.move()
        this.vertices = this.getVertices()
    }
    draw() {
        let shapes = [
            [[0, -5], [[0, -10, -10, -15, -30, -25]], [25, -5]],
            [[0, 30], [[0, 35, -10, 40, -30, 50]], [25, 30]],
            [[30, 0], [[40, 0, 40, 25, 30, 25]], [30, 0]],
        ]
        drawRect(this.context, this.invulnerable ? worldLifetime % 2 === 0 ? 'transparent' : this.color : this.color, this.width, this.height)
        drawBeziers(this.context, `rgba(255,255,255,1)`, shapes)
    }
}


class Link extends RectBody {
    constructor(origin, dest) {
        super(origin.x, origin.y, 5, 5, origin.coords)
        this.radius = 10;
        this.origin = origin
        this.destiny = dest
        this.color = 'white';
        this.ttl = 10
    }
    draw() {
        drawCircle(this.context, this.color, this.radius)
    }
    update() {
        let speed = distanceToTarget(this, this.destiny) / this.ttl
        let theta = getTheta(this, this.destiny)
        this.setVelocity(speed * Math.cos(theta), speed * Math.sin(theta))
        this.ttl -= 1
        this.advance()
    }

}

let toggleShadow = str => str === 'player' ? 'shadow' : 'player'
let switcheroo = () => {

    let link = new Link(playerMap[activeSprite], playerMap[toggleShadow(activeSprite)])
    link.add()
    activeSprite = toggleShadow(activeSprite)
    playerMap[activeSprite].tempInvulnerable(300)
}
let switcherooOnCooldown = false

class Sword extends RectBody {
    constructor(offset, body) {
        let swingOffset = degToRad(135)
        let { x, y } = getPointInCircle(body, offset, body.rotation + swingOffset)
        super(x, y, 100, 5, body.coords);
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
        this.ttl -= 1
        let speed = this.swing.total / this.swing.duration
        this.rotation += speed
        this.swing.accumulated += speed
        let { x, y } = getPointInCircle(this.center, this.offset, this.rotation)
        this.setPosition(x, y)
        this.updateVertices()

    }

}

class Enemy extends RectBody {
    constructor(x, y, maxHp, coords, speed = 2) {
        super(x, y, 50, 50, coords);
        this.maxHp = maxHp
        this.hp = maxHp
        this.speed = 1
        this.color = 'lavender'
        this.label = 'enemy'
        this.speed = speed
    }
    draw() {
        drawRamiel(this.context, this.invulnerable ? worldLifetime % 2 == 0 ? this.color : 'transparent' : this.color, this.width, this.height)
    }
    die() {
        explosion(this)
        this.remove()
    }
    collide(body) {
        if (!this.invulnerable && (body instanceof Sword || body instanceof Shield)) {
            this.tempInvulnerable(1000)
            let damage = body.damage()
            new Damage(this, damage)
            this.hp -= damage
            this.hp <= 0 && this.die()
        }
    }

    move() {
        this.rotation += degToRad(1)
        let theta = getTheta(this, playerMap[activeSprite])
        this.setVelocity(Math.cos(theta) * this.speed, Math.sin(theta) * this.speed)
        this.advance()
    }
    update() {
        this.move()
        this.vertices = this.getVertices()
    }
}




class Damage extends kontra.Sprite.class {
    constructor(body, damage) {
        super({
            center: body,
            x: body.x,
            y: body.y,
            ttl: 100,
            value: damage,
            color: 'white',
            dx: randInt(-2, 2),
            dy: randInt(-5, -3) - 2,
            ddy: 0.2
        });
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
            if (this.bodies[i] instanceof Sword ||
                this.bodies[i] instanceof Shield) {
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
            let min = 100
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
                Object.keys(playerMap).forEach(key => {
                    playerMap[key].setPosition(target.x, target.y)
                    playerMap[key].travel(this.destiny)
                })
                world.travel(this.destiny)
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
        super(x, y, 55, 55, coords);
        this.color = color
        this.label = 'stairs'
        this.shouldAbsorb = 0
        this.anchor = { x: 0, y: 0 }
        this.enlarge = true
        this.scale = Math.random() * 1.1
    }
    addDestiny(coords) {
        this.destiny = coords
    }
    collide(body) {
        if (body instanceof Player) this.colliding = true
        if (body instanceof Player && this.destiny !== undefined && keyPressed('space')) {
            world.travel(this.destiny.coords)
            Object.keys(playerMap).forEach(key => {
                playerMap[key]
                    .setPosition(this.destiny.x, this.destiny.y + 100)
                    .tempInvulnerable(1000)
                    .travel(this.destiny.coords)
            })
        }
    }
    update() {
        this.shouldAbsorb++
        this.scaleX += this.enlarge ? .001 : -.001
        this.scaleY += this.enlarge ? .001 : -.001
        if (this.scaleX > 1.2) this.enlarge = false
        if (this.scaleX < 1) this.enlarge = true

        if (this.colliding) {
            this.rotation += degToRad(-2)
            this.colliding = false
        }
        else this.rotation += degToRad(-1)
        if (this.shouldAbsorb > 10) {
            this.shouldAbsorb = 0
            this.color === 'silver' ? exhale(this) : absorb(this)
        }
    }

    draw() {
        drawPortal(this.context, this.color)
    }

}


class DiaBody extends RectBody {
    constructor(x, y, width, height, coords) {
        super(x, y, width, height, coords)
        this.color = 'yellow'
        this.vertices = this.getVertices()
    }
    getVertices() {
        let w = this.width / 2
        let h = this.height / 2
        let { x, y } = this
        let up = { x, y: y - h }
        let left = { x: x - w, y }
        let down = { x, y: y + h }
        let right = { x: x + w, y }
        let vertices = [up, left, down, right,]
        return vertices.map(key => {
            let theta = this.rotation
            let newX = (key.x - x) * Math.cos(theta) - (key.y - y) * Math.sin(theta) + x
            let newY = (key.x - x) * Math.sin(theta) + (key.y - y) * Math.cos(theta) + y
            return { x: newX, y: newY }
        })

    }
    update() {
        this.vertices = this.getVertices()
    }
    draw() {
        drawDia(this.context, this.color, this.width, this.height)
    }
}


class Shield extends DiaBody {
    constructor(body, width, height, ttl) {
        super(body.x, body.y, width, height, body.coords);
        this.color = 'green'
        this.body = body
        this.opacity = 0.3
        this.ttl = ttl
    }
    damage() {
        let min = 15
        let max = 20
        return kontra.randInt(min, max)
    }
    update() {
        this.setPosition(this.body.x, this.body.y)
        this.rotation = this.body.rotation
        this.ttl -= 1
        this.vertices = this.getVertices()
    }
}

class Goal extends RectBody {
    constructor(coord) {
        super(WORLD_WIDTH / 2 - 25, WORLD_HEIGHT / 2 - 25, 50, 50, coord)
        this.color = 'white'
    }
    update() {
        this.rotation += degToRad(1)
    }
    collide(body) {
        if (body instanceof Player) {
            UI.win()
        }
    }
}
