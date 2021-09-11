import { degToRad, keyPressed, init, randInt, Sprite, Vector } from "./kontra"
import { WORLD_WIDTH, WORLD_HEIGHT, WORLD_INITIAL_COORDS, WORLD_CENTER_WIDTH, WORLD_CENTER_HEIGHT } from './init'
import { drawBeziers, drawRamiel, drawRect, drawPortal, drawCircle, drawGoal, drawBardiel } from "./images"
import { fire, explosion, absorb, exhale, smoke } from "./particles"
import { playBGM, playSFX } from "./audioLoader"
import { getDirectionVector, getPointInCircle, distanceToTarget, noDirection, leftRightSwitch, upDownSwitch, getTheta, rotateVertex, TRANSPARENT, } from "./helpers"
import { WHITE } from "./helpers"
const { canvas, context } = init()


export class Combo {
    constructor(body) {
        this.timer = 0
        this.countdown = 4000
        this.timeouts = []
        this.intervals = []
        this.body = body
        this.cooldown = false
        this.finished = false

    }
    cd(time) {
        this.cooldown = true
        this.timeouts.push(setTimeout(() => this.cooldown = false, time))
    }
    move(move) {
        if (noDirection()) {
            let direction = getDirectionVector(this.body).scale(move)
            if (this.body.dx !== 0 && this.body.dy !== 0) this.body.setVelocity(direction.x, direction.y)
            else {
                let theta = this.body.rotation
                this.body.setVelocity(move * Math.cos(theta), move * Math.sin(theta))
            }
        }
        else {
            this.body.setVelocity(leftRightSwitch(-move, move, 0), upDownSwitch(-move, move, 0))
        }
    }
    attack(body) {
        if (this.cooldown || this.finished) return
        if (this.timer === 0) {
            this.start()
            this.first(body)
        }
        else if (this.timer > 150) {
            this.lance(body)
            this.cd(1000)
            this.timeouts.push(setTimeout(() => {
                this.end()
            }, 1000))

        }

    }
    first(body) {
        body.tInv(500)
        this.cd(150)
        let swordOffset = { x: -this.body.width * 4, y: -this.body.height * 4 }
        this.move(20)
        new Sword(swordOffset, this.body, this.body.u).add()
        playSFX('lightsaber')
    }
    lance(body) {
        body.tInv(500)
        let totalDistance = 300
        let frames = 10
        let move = totalDistance / frames
        this.move(move)
        new Shield(body, body.width * 5, body.height * 2, frames).add()
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

export class RectBody extends Sprite.class {
    constructor(x, y, width, height, coords = { x: 0, y: 0, z: 0 }, u) {
        super({ x, y, width, height });
        this.u = u
        this.anchor = { x: 0.5, y: 0.5 };
        this.canCollide = true;
        this.timeouts = [];
        this.intervals = []
        this.vertices = this.getVertices()
        this.coords = coords
        this.inv = false
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
        this.u.add(this.coords, this)
    }
    tInv(time) {
        this.inv = true
        this.timeouts.push(setTimeout(() => this.inv = false, time))
        return this
    }
    remove() {
        this.timeouts.forEach(key => clearTimeout(key))
        this.intervals.forEach(key => clearInterval(key))
        this.ttl = 0
    }
}

export class Player extends RectBody {
    constructor(x, y, color, name, coords, u) {
        super(x, y, 25, 25, coords, u);
        this.moveSpeed = 0.25
        this.speedLimit = 5
        this.baseSpeed = 2
        this.combo = null
        this.released = true
        this.baseColor = color
        this.color = color
        this.name = name
        this.regen = false
        this.canMove = true
    }
    attack() {
        if (!this.combo || this.combo.finished) return
        this.combo.attack(this)
    }

    canAttack = () => keyPressed('shift') && !this.attackCooldown && this.released
    isActive = () => this.name === this.u.active

    shouldCancel = () => this.combo !== null && this.combo.canceled
    cancel() {
        this.combo = null
        this.color = this.baseColor
    }

    move() {
        if (!this.canMove) return
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
        if (!this.canCollide || this.inv || !this.isActive() || !this.canMove) return
        if (body instanceof Enemy) {
            playSFX('hit')
            let players = this.u.getPlayers()
            players.forEach(key => key.tInv(1000))
            let inverse = Vector(this.dx * -1, this.dy * -1).normalize()
            this.setVelocity(inverse.x * this.width || 0, inverse.y * this.height || -this.height)
            if (this.u.getRegen()) {
                players.forEach(key => key.die())
                setTimeout(() => this.u.lose(), 1500)
            }
            else {
                this.u.switcheroo()
                this.regenerate()
            }
        }
    }
    regenerate() {
        this.regen = true
        let regenTime = 100
        let timestamp = this.u.lifetime
        let interval = setInterval(() => {
            if (this.u.lifetime > timestamp + regenTime) {
                this.regen = false
                clearInterval(interval)
            }
        }, 100)
    }
    travel(coords) {
        this.u.getInactive().setVelocity(0, 0)
        this.u.getQuadrant(coords).remove(this)
        this.coords = coords
        this.u.getQuadrant(coords).add(this)
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
        drawRect(this.context, this.inv ? this.u.lifetime % 2 === 0 ? TRANSPARENT : this.color : this.color, this.width, this.height)
        !this.regen && drawBeziers(this.context, WHITE, shapes)
    }
    die() {
        this.opacity = 0
        this.setVelocity(0, 0)
        this.canMove = false
        explosion(this)
        playSFX('explosion')
    }
}


export class Link extends RectBody {
    constructor(origin, dest, u) {
        super(origin.x, origin.y, 5, 5, origin.coords, u)
        this.radius = 10;
        this.origin = origin
        this.destiny = dest
        this.color = WHITE;
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

export class Sword extends RectBody {
    constructor(offset, body, u) {
        let swingOffset = degToRad(135)
        let { x, y } = getPointInCircle(body, offset, body.rotation + swingOffset)
        super(x, y, 100, 5, body.coords, u);
        this.ttl = 10
        this.offset = offset
        this.center = body
        this.rotation = body.rotation + swingOffset
        this.color = 'green'
        this.opacity = 0.9
        this.swing = {
            should: true,
            total: degToRad(90),
            accumulated: 0,
            duration: 10,
        }
    }
    damage() {
        return randInt(15, 20)
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

export class Enemy extends RectBody {
    constructor(x, y, maxHp, coords, u, speed = 2) {
        super(x, y, 50, 50, coords, u);
        this.maxHp = maxHp
        this.hp = maxHp
        this.color = 'lavender'
        this.speed = speed
    }
    draw() {
        drawRamiel(this.context, this.inv ? this.u.lifetime % 2 == 0 ? this.color : TRANSPARENT : this.color, this.width, this.height)
    }
    die() {
        explosion(this)
        playSFX('explosion')
        this.remove()
    }
    collide(body) {
        if (!this.inv && (body instanceof Sword || body instanceof Shield)) {
            this.tInv(1000)
            let damage = body.damage()
            new Damage(this, damage, this.u)
            this.hp -= damage
            this.hp <= 0 && this.die()
        }
    }

    move() {
        this.rotation += degToRad(1)
        let theta = getTheta(this, this.u.getActive())
        this.setVelocity(Math.cos(theta) * this.speed, Math.sin(theta) * this.speed)
        this.advance()
    }
    update() {
        this.move()
        this.vertices = this.getVertices()
    }
}




export class Damage extends Sprite.class {
    constructor(body, damage, u) {
        super({
            center: body,
            x: body.x,
            y: body.y,
            ttl: 100,
            value: damage,
            color: WHITE,
            dx: randInt(-2, 2),
            dy: randInt(-5, -3) - 2,
            ddy: 0.2,
            u,
        });
        this.add()
    }
    add() {
        this.u.add(this.center.coords, this)
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

export class Wall extends RectBody {
    constructor(x, y, width, height, thickness, destiny, u) {
        super(x, y, width, height, { x: 0, y: 0, z: 0 }, u);
        this.thickness = thickness
        this.destiny = destiny
        this.enableTravel = true
        this.color = this.destiny ? TRANSPARENT : 'red'
        this.opacity = 0.7
    }

    update() {
        if (this.destiny && this.enableTravel) this.color = TRANSPARENT
        else this.color = 'red'
    }
    collide(body) {
        if (body instanceof Wall) return
        if (body instanceof Player && body.isActive()) {
            let target = { x: body.x, y: body.y }
            let inverseSpeed = Vector(body.dx * -1, body.dy * -1)
            let min = 100
            let max = { x: WORLD_WIDTH - min, y: WORLD_HEIGHT - min }
            if (this.height > this.width) {
                target.x = body.x > max.x ? min : max.x
                body.x += inverseSpeed.x
            }
            else {
                target.y = body.y > max.y ? min : max.y
                body.y += inverseSpeed.y
            }
            if (this.destiny && this.enableTravel) {
                this.u.getPlayers().forEach(key => {
                    key.setPosition(target.x, target.y)
                    key.travel(this.destiny)
                })
                this.u.travel(this.destiny)
            }
        }
    }
}


export class Stairs extends RectBody {
    constructor(x, y, coords, color, u) {
        super(x, y, 55, 55, coords, u);
        this.color = color
        this.abs = 0
        this.anchor = { x: 0, y: 0 }
        this.enableTravel = false
    }
    addDestiny(coords) {
        this.destiny = coords
    }
    collide(body) {
        if (body instanceof Player) {
            this.colliding = true
        }
        if (body instanceof Player && keyPressed('space') && this.enableTravel && !body.inv) {
            this.u.travel(this.destiny.coords)
            this.u.getPlayers().forEach(key => {
                key
                    .setPosition(this.destiny.x, this.destiny.y)
                    .tInv(1000)
                    .travel(this.destiny.coords)
            })
        }
    }
    update() {
        this.abs++
        if (this.colliding) {
            this.rotation += degToRad(-2)
            this.colliding = false
        }
        else this.rotation += degToRad(-1)
        if (this.abs > 10) {
            this.abs = 0
            this.color === 'silver' ? exhale(this) : absorb(this)
        }
    }

    draw() {
        drawPortal(this.context, this.color)
    }

}



export class Shield extends RectBody {
    constructor(body, width, height, ttl) {
        super(body.x, body.y, width, height, body.coords, body.u)
        this.color = 'green'
        this.body = body
        this.opacity = 0.3
        this.ttl = ttl
        playSFX('rush')
    }
    damage() {
        return randInt(15, 20)
    }
    update() {
        this.setPosition(this.body.x, this.body.y)
        this.rotation = this.body.rotation
        this.ttl -= 1
        this.vertices = this.getVertices()
    }
}

export class GiantEnemy extends Enemy {
    constructor(coords, u) {
        super(300, 300, 100, coords, u,2)
        this.width = 20
        this.height = 20
        this.color = 'red'
        this.minions = Array(16).fill('').map((key, index) => new Orbiter(this.x, this.y, 50, Math.PI / 8 * index, this))
        this.minions.forEach(key => key.add())
    }
    draw() {
        drawRect(this.context, this.color, this.width, this.height)
    }
    die() {
        explosion(this)
        playSFX('explosion')
        this.u.bossWin()
        this.remove()
    }
}

class Orbiter extends Enemy {
    constructor(x, y, hp, angle, enemy) {
        super(x, y, hp, enemy.coords, enemy.u);
        this.enemy = enemy
        this.angle = angle
        this.fixPosition()
    }
    fixPosition() {
        this.setPosition(
            this.enemy.x + 100 * Math.cos(this.angle + this.enemy.rotation),
            this.enemy.y + 100 * Math.sin(this.angle + this.enemy.rotation))
    }
    update() {
        if (this.enemy.hp <= 0) this.die()
        this.rotation += degToRad(-1)
        this.fixPosition()
        this.advance()
        this.vertices = this.getVertices()
    }
}

export class Goal extends RectBody {
    constructor(coord, u) {
        super(WORLD_CENTER_WIDTH - 25, WORLD_CENTER_HEIGHT - 25, 50, 50, coord, u)
        this.color = WHITE
        this.shouldAnimate = false
        this.rotation = degToRad(1)
        this.rotate = 1
        this.scaling = 1
        this.grow = true
        this.anchor = { x: 0, y: 0 }

    }
    draw() {
        drawGoal(this)
    }
    update() {
        this.rotation += degToRad(this.rotate)
        this.scaleX = this.scaling
        this.scaleY = this.scaling
        if (this.shouldAnimate) {
            this.rotate += degToRad(1)
            this.scaling += this.grow ? 0.1 : -0.2
        }
        if (this.scaleX > 50) {
            this.u.getPlayers().forEach(key => key.remove())
            this.grow = false
        }
        if (this.scaleX < 1) {
            this.remove()
            setTimeout(() => this.u.showVictory(), 2000)
        }

    }
    collide(body) {
        if (body instanceof Player) {
            this.u.victory()
        }
    }
}

export class Asteroid extends Enemy {
    constructor(x, y, size = randInt(10, 70), coords, u) {
        super(x, y, 1, coords, u, 0);
        this.width = size
        this.height = size
        this.color = 'grey'
    }
    draw() {
        drawRect(this.context, this.color, this.width, this.height)
    }
    update() {
        this.rotation += degToRad(0.5)
        this.getVertices()
    }
}

export class FinalBoss extends Enemy {
    constructor(coords, u) {
        super(WORLD_CENTER_WIDTH - 50, WORLD_CENTER_HEIGHT - 50,150, coords, u,4);
        this.width = 75
        this.height = 75
        this.color = 'pink'
        this.f = 0
    }
    draw() {
        drawBardiel(this)
    }
    die() {
        explosion(this)
        playSFX('explosion')
        this.u.showGoal()
        this.remove()
    }
    load(speed, size) {
        new Bullet(this, this.u.getActive(), speed, size).add()
        playSFX('hit')
    }
    fire() {
        if (this.u.lifetime % 25 == 0) {
            this.f++
            if (this.f < 5) this.load(5, 10)
            else if (this.f == 5) this.load(10, 10)
            else if (this.f == 10) {
                this.load(10, 75)
                setTimeout(() => this.load(10, 75), 150)
                setTimeout(() => this.load(10, 75), 300)

            }
            else if (this.f > 15) this.f = 0
        }
    }
    update() {
        this.fire()
        this.move()
        this.rotation = getTheta(this, this.u.getActive())
        this.vertices = this.getVertices()
    }
}


class Bullet extends Enemy {
    constructor(origin, destiny, speed, size) {
        super(origin.x, origin.y, size, origin.coords, origin.u);
        this.width = size
        this.destiny = { ...destiny }
        this.height = size
        this.color = 'orange'
        this.timestamp = this.u.lifetime
        this.theta = getTheta(origin, destiny)
        this.setVelocity(speed * Math.cos(this.theta), speed * Math.sin(this.theta))
    }
    draw() {
        drawRect(this.context, this.color, this.width, this.height)
    }
    die() {
        this.remove()
    }
    update() {
        this.vertices = this.getVertices()
        this.rotation += degToRad(15)
        this.advance()
        if (this.u.lifetime > this.timestamp + 300) this.die()
    }
}
