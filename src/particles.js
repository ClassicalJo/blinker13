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
                this.context.fillStyle = this.color;
                this.context.beginPath();
                this.context.arc(0, 0, this.radius, 0, 2 * Math.PI);
                this.context.fill();
            }
        })
    }

}

let smoke = body => {
    if (body.dx == 0 && body.dy == 0) return
    let speed = kontra.Vector(body.dx * -1, body.dy * -1).normalize()
    for (let i = 0; i < 2; i++) {
        pool.get({
            x: body.x,
            y: body.y,
            opacity: 0.5,
            // color: 'black',
            color: ['silver', 'aliceblue', 'beige'][randInt(0, 2)],
            radius: 10,
            ttl: 100,
            dx: speed.x + Math.random() * 2 - 1,
            dy: speed.y + Math.random() * 2 - 1,
            update: function () {
                if (this.opacity > 0.02) this.opacity -= 0.02
                this.advance()
            },
            render: function () {
                this.context.fillStyle = this.color;
                this.context.beginPath();
                this.context.arc(0, 0, this.radius, 0, 2 * Math.PI);
                this.context.fill();
            }
        })
    }
}
