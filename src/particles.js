let { Pool, randInt } = kontra

let pool = Pool({
    create: kontra.Sprite
})



let explosion = (x, y) => {
    for (let i = 0; i < randInt(5, 20); i++) {
        pool.get({
            x,
            y,
            opacity: 1,
            color: 'pink',
            radius: 5,
            ttl: 100,
            dx: kontra.randInt(-5, 5),
            dy: kontra.randInt(-5, 5),
            update: function () {
                if (this.opacity > 0.02) this.opacity -= 0.02
                this.advance()
            },
            render: function () {
                drawCircle(this.context, this.color, this.radius)
            }
        })
    }

}

let fire = body => {
    let speed = kontra.Vector(body.dx * -1, body.dy * -1).normalize()
    pool.get({
        x: body.x + speed.x * 15,
        y: body.y + speed.y * 15,
        color: ['red', 'yellow', 'red'],
        radius: 5,
        ttl: 3,
        opacity: 0.25,
        render() {
            drawCircle(this.context, this.color[this.ttl], this.radius)
        }
    })

}
let smoke = body => {
    if (Math.abs(body.dx) < .2 && Math.abs(body.dy) < .2) return
    let speed = kontra.Vector(body.dx * -1, body.dy * -1).normalize()
    for (let i = 0; i < 3; i++) {
        pool.get({
            x: body.x + speed.x * 10 + randInt(-2, 2),
            y: body.y + speed.y * 10 + randInt(-2, 2),
            opacity: 0.1,
            color: 'silver',
            radius: 10,
            ttl: 50,
            dx: speed.x + randInt(-1.5, 1.5),
            dy: speed.y + randInt(-1.5, 1.5),
            update: function () {
                if (this.opacity > 0.02) this.opacity -= 0.02
                this.advance()
            },
            render: function () {
                drawCircle(this.context, this.color, this.radius)
            }
        })
    }
}

let absorb = body => {
    let radiusEffect = 100
    let dest = kontra.Vector(body.x, body.y)
    let rand = kontra.Vector(kontra.randInt(-300, 300), randInt(-300, 300)).normalize().scale(radiusEffect)
    let pos = dest.add(rand)
    let theta = Math.atan2(body.y - pos.y, body.x - pos.x)
    let direction = kontra.Vector(Math.cos(theta), Math.sin(theta)).normalize()
    let frames = 100
    let speed = pos.distance(dest) / frames
    pool.get({
        x: pos.x,
        y: pos.y,
        opacity: 0.1,
        color: 'silver',
        radius: 5,
        ttl: frames,
        dx: speed * direction.x,
        dy: speed * direction.y,
        update: function () {
            this.opacity += 0.01
            this.advance()
        },
        render: function () {
            drawCircle(this.context, this.color, this.radius)
        }
    })

}

let exhale = body => {
    let radiusEffect = 100
    let pos = kontra.Vector(body.x, body.y)
    let dest = kontra.Vector(kontra.randInt(-3, 3), randInt(-3, 3))
    let theta = Math.atan2(dest.y - pos.y, dest.x - pos.x)
    let target = kontra.Vector(pos.x + radiusEffect * Math.cos(theta), pos.y + radiusEffect * Math.sin(theta))
    let ttl = 100
    let { x: dx, y: dy } = dest.normalize().scale(target.distance(pos) / ttl)
    pool.get({
        x: pos.x,
        y: pos.y,
        opacity: 1,
        color: 'grey',
        radius: 5,
        ttl,
        dx,
        dy,
        update: function () {
            if (this.opacity > 0.1) this.opacity -= 0.01
            this.advance()
        },
        render: function () {
            drawCircle(this.context, this.color, this.radius)
        }
    })

}
