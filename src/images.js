function drawBeziers(ctx, color, shape) {
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i in shape) {
        ctx.moveTo(...shape[i][0])
        shape[i][1].forEach(key => ctx.bezierCurveTo(...key))
        ctx.lineTo(...shape[i][2])
    }
    ctx.fill();
}

function drawCircle(ctx, color, radius) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, 2 * Math.PI);
    ctx.fill();
}

function drawRect(ctx, color, width, height) {
    ctx.beginPath()
    ctx.rect(0, 0, width, height)
    ctx.fillStyle = color
    ctx.fill()
}

function drawDia(ctx, color, width, height) {
    ctx.beginPath()
    ctx.fillStyle = color
    let lines = [
        [0, height / 2],
        [width / 2, 0],
        [width, height / 2],
        [width / 2, height]
    ]
    lines.forEach(key => ctx.lineTo(...key))
    ctx.fill()
}
function drawPortal(ctx, color) {
    let height = 50
    let width = 30
    let arc = width - 25
    let basicShape = [
        [0, 0],
        [
            [-width, 0, -width, -height, 0, -height],
            [-arc, -height, -arc, 0, 0, 0],
        ],
        [0, 0],
    ]
    let shapes = shapePetals(basicShape, degToRad(30))
    drawBeziers(ctx, color, shapes)
}

function rotateShape(shape, theta) {
    let c1 = rotateVertex(theta, { x: shape[0], y: shape[1] }, { x: 0, y: 0 })
    let c2 = rotateVertex(theta, { x: shape[2], y: shape[3] }, { x: 0, y: 0 })
    let f = rotateVertex(theta, { x: shape[4], y: shape[5] }, { x: 0, y: 0 })
    return [c1.x, c1.y, c2.x, c2.y, f.x, f.y]
}

function shapePetals(basicShape, theta) {
    let shapes = []
    for (let i = 0; i < Math.PI * 2; i += theta) {
        let compound = basicShape[1].map(key => rotateShape(key, i))
        shapes.push([basicShape[0], compound, basicShape[2]])
    }
    return shapes
}

function drawRamiel(ctx, color, w, h) {
    let shapes = [
        [
            [0, 0],
            [
                [w/2, 0, w/2, -h, w/2, -h],
                [w/2, 0, w, 0, w, 0],
                [w, h/2, w*2, h/2, w*2, h/2],
                [w, h/2, w, h, w, h],
                [w/2, h, w/2, h*2, w/2, h*2],
                [w/2, h, 0, h, 0, h],
                [0, h/2, -w, h/2, -w, h/2],
                [0, h/2, 0, 0, 0, 0],
            ],
            [0, 0]
        ]
    ]

    drawBeziers(ctx, color, shapes)
}

let screen = color => kontra.Sprite({
    width: world.width,
    height: world.height,
    color: color,
})

let spaceGas = (x, y, speed, color) => kontra.Sprite({
    x,
    y,
    width: WORLD_WIDTH * 4,
    height: WORLD_HEIGHT,
    color: color,
    opacity: 0.2,
    dx: speed,
    render: function () {
        let h = this.height / 2
        let w = this.width / 8
        let shape = [[[0, 0],
        [
            [w, -h, w, -h, w * 2, 0],
            [w * 3, h, w * 3, h, w * 4, 0],
            [w * 5, -h, w * 5, -h, w * 6, 0],
            [w * 6, this.height, w * 6, this.height, w * 6, this.height],
            [w * 5, this.height + h, w * 5, this.height + h, w * 4, this.height],
            [w * 3, this.height - h, w * 3, this.height - h, w * 2, this.height],
            [w, this.height + h, w, this.height + h, 0, this.height]
        ],
        [0, 0]]]
        drawBeziers(this.context, this.color, shape)
    },
    update: function () {
        this.advance()
        if (this.x < - this.width / 2) this.x = 0
    }
})
