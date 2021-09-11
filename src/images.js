import { WORLD_HEIGHT, WORLD_WIDTH } from "./init";
import { rotateVertex } from "./helpers";
import { Sprite, degToRad } from "./kontra";


export function drawDashedText(ctx, color, text, fontSize, offsetX = 0, offsetY = 0, fill = false) {
    ctx.font = `${fontSize}px Arial Black`
    ctx.setLineDash([15, 3])
    ctx.lineWidth = fontSize / 10
    ctx.strokeStyle = color
    ctx.fillStyle = color
    ctx.textAlign = 'center'
    ctx.strokeText(text, offsetX, offsetY)
    fill && ctx.fillText(text, offsetX, offsetY)
}
export function drawDashedLine(ctx, color, x1, y1, x2, y2) {
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.setLineDash([5, 5])
    ctx.lineWidth = 5
    ctx.strokeStyle = color
    ctx.lineTo(x2, y2)
    ctx.stroke()
}

export function drawBeziers(ctx, color, shape) {
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i in shape) {
        ctx.moveTo(...shape[i][0])
        shape[i][1].forEach(key => ctx.bezierCurveTo(...key))
        ctx.lineTo(...shape[i][2])
    }
    ctx.fill();
}

export function strokeBeziers(ctx, color, shape) {
    ctx.strokeStyle = color;
    ctx.beginPath();
    for (let i in shape) {
        ctx.moveTo(...shape[i][0])
        shape[i][1].forEach(key => ctx.bezierCurveTo(...key))
        ctx.lineTo(...shape[i][2])
    }
    ctx.stroke();
}

export function drawCircle(ctx, color, radius, offsetX = 0, offsetY = 0, stroke = false, fill = true) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(offsetX, offsetY, radius, 0, 2 * Math.PI);
    fill && ctx.fill()
    stroke && ctx.stroke()
}

export function drawRect(ctx, color, width, height, offsetX = 0, offsetY = 0, stroke = false, fill = true) {
    ctx.beginPath()
    ctx.rect(offsetX, offsetY, width, height)
    ctx.fillStyle = color
    fill && ctx.fill()
    stroke && ctx.stroke()
}

export function drawDia(ctx, color, width, height) {
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
export function drawPortal(ctx, color) {
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

export function drawGoal(body) {
    let { width, height, context, color } = body
    let basicShape = [
        [0, 0],
        [
            [width, 0, width, 0, width, -height],
            [width, 0, width, 0, width, 0],
        ],
        [0, 0],
    ]
    let back = [
        [0, -height / 2],
        [
            [width / 2, -height / 2, width, -height / 2, width, -height],
            [width, 0, width, 0, width, 0],
            [0, 0, 0, 0, 0]
        ],
        [0, -height / 2],
    ]
    let shapes = shapePetals(basicShape, degToRad(24))
    let backshapes = shapePetals(back, degToRad(24))
    drawBeziers(context, '#306BAC', backshapes)
    drawBeziers(context, color, shapes)

}
export function rotateShape(shape, theta) {
    let c1 = rotateVertex(theta, { x: shape[0], y: shape[1] }, { x: 0, y: 0 })
    let c2 = rotateVertex(theta, { x: shape[2], y: shape[3] }, { x: 0, y: 0 })
    let f = rotateVertex(theta, { x: shape[4], y: shape[5] }, { x: 0, y: 0 })
    return [c1.x, c1.y, c2.x, c2.y, f.x, f.y]
}

export function shapePetals(basicShape, theta) {
    let shapes = []
    for (let i = 0; i < Math.PI * 2; i += theta) {
        let compound = basicShape[1].map(key => rotateShape(key, i))
        shapes.push([basicShape[0], compound, basicShape[2]])
    }
    return shapes
}

export function drawRamiel(ctx, color, w, h) {
    let shapes = [
        [
            [0, 0],
            [
                [w / 2, 0, w / 2, -h, w / 2, -h],
                [w / 2, 0, w, 0, w, 0],
                [w, h / 2, w * 2, h / 2, w * 2, h / 2],
                [w, h / 2, w, h, w, h],
                [w / 2, h, w / 2, h * 2, w / 2, h * 2],
                [w / 2, h, 0, h, 0, h],
                [0, h / 2, -w, h / 2, -w, h / 2],
                [0, h / 2, 0, 0, 0, 0],
            ],
            [0, 0]
        ]
    ]

    drawBeziers(ctx, color, shapes)
}

export function drawBardiel(body) {
    let { width: w, height: h, color, context, invulnerable, container } = body
    let h2 = h + h / 2
    let shapes = [
        [[0, -h / 4], [[0, -h / 2, -w / 2, -h, -w, -h], [w * 2, -h, w * 2, -h, w * 2, -h], [w + w / 2, -h, w, -h / 2, w, -h / 4]], [0, -h / 4]],
        [[0, h + h / 4], [[0, h2, -w / 2, 2 * h, -w, 2 * h], [w * 2, 2 * h, w * 2, 2 * h, w * 2, 2 * h], [w + w / 2, 2*h, w, h2, w, h + h / 4]], [0, h + h / 4]],
    ]
    drawRect(context, invulnerable ? container.lifetime % 2 === 0 ? 'transparent' : color : color, w, h)
    drawBeziers(context, 'white', shapes)
}

export function screen(color, opacity = 1) {
    return Sprite({
        width: WORLD_WIDTH,
        height: WORLD_HEIGHT,
        color: color,
        opacity,
    })
}

export function spaceGas(x, y, speed, color) {
    return Sprite({
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
}
