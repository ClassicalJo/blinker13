import {Vector} from "./kontra"
export function SAT(body1, body2) {
    function getNormals(vertices) {
        let axes = []
        for (let i = 0; i < vertices.length; i++) {
            let p1 = Vector(vertices[i].x, vertices[i].y)
            let next = (i + 1 === vertices.length) ? 0 : i + 1
            let p2 = Vector(vertices[next].x, vertices[next].y)
            let edge = p1.subtract(p2)
            let normal = { x: edge.y, y: -edge.x }
            axes.push(normal)
        }
        return axes
    }

    function getProjection(axis, vertices) {
        let vector = Vector(axis.x, axis.y)
        let min = vector.dot(vertices[0])
        let max = min
        for (let i = 1; i < vertices.length; i++) {
            let p = vector.dot(vertices[i])
            if (p < min) {
                min = p
            } else if (p > max) {
                max = p
            }
        }
        return {
            min,
            max,
            overlap: function (projection) {
                return !(min > projection.max || projection.min > max)
            }
        }
    }

    let axes1 = getNormals(body1.vertices)
    let axes2 = getNormals(body2.vertices)

    for (let i = 0; i < axes1.length; i++) {
        let axis = axes1[i]
        let p1 = getProjection(axis, body1.vertices)
        let p2 = getProjection(axis, body2.vertices)
        if (!p1.overlap(p2)) return false
    }
    for (let i = 0; i < axes2.length; i++) {
        let axis = axes2[i]
        let p1 = getProjection(axis, body1.vertices)
        let p2 = getProjection(axis, body2.vertices)
        if (!p1.overlap(p2)) return false
    }
    return true
}
