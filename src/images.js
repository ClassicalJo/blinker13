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

function drawRamiel(ctx, color) {
    let shapes = [
        [
            [0, 0],
            [
                [25, 0, 25, -50, 25, -50],
                [25, 0, 50, 0, 50, 0],
                [50, 25, 100, 25, 100, 25],
                [50, 25, 50, 50, 50, 50],
                [25, 50, 25, 100, 25, 100],
                [25, 50, 0, 50, 0, 50],
                [0, 25, -50, 25, -50, 25],
                [0, 25, 0, 0, 0, 0],
            ],
            [0, 0]
        ]
    ]

    drawBeziers(ctx, color, shapes)
}
