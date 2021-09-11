import { keyPressed, Vector } from "./kontra"


export function getPointInCircle(vector, r, theta) {
    return {
        x: vector.x + r.x * Math.cos(theta),
        y: vector.y + r.y * Math.sin(theta),
    }
}

export function distanceToTarget(origin, dest) {
    return Math.sqrt(Math.pow((dest.x - origin.x), 2) + Math.pow((dest.y - origin.y), 2))
}

export function noDirection() {
    return !keyPressed('up') && !keyPressed('down') && !keyPressed('left') && !keyPressed('right')
}
export function leftRightSwitch(a, b, c) {
    if (keyPressed('left')) return a
    else if (keyPressed('right')) return b
    else return c
}
export function upDownSwitch(a, b, c) {
    if (keyPressed('up')) return a
    else if (keyPressed('down')) return b
    else return c
}

export function getTheta(origin, dest) {
    return Math.atan2(dest.y - origin.y, dest.x - origin.x)
}
export function rotateVertex(theta, vertex, origin) {
    return {
        x: (vertex.x - origin.x) * Math.cos(theta) - (vertex.y - origin.y) * Math.sin(theta) + origin.x,
        y: (vertex.x - origin.x) * Math.sin(theta) + (vertex.y - origin.y) * Math.cos(theta) + origin.y
    }

}

export function getDirectionVector(body) {
    let vector = Vector(body.dx, body.dy)
    if (vector.x === 0 && vector.y === 0) return Vector(0, -1).normalize()
    return vector.normalize()
}

export function isSameCoord(coord1, coord2) {
    return coord1.x == coord2.x && coord1.y == coord2.y && coord1.z == coord2.z
}

export const TRANSPARENT = 'transparent'
export const BLUE = 'blue'
export const WHITE = 'white'
export const BLACK = 'black'
