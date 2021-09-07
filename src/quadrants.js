import { WORLD_WIDTH, WORLD_HEIGHT, WORLD_X, WORLD_Y } from './init'
import { Wall, Sword, Shield } from './sprites'

export class Coords {
    constructor(x, y, z) {
        this.x = x
        this.y = y
        this.z = z
    }
}

export class Quadrant {
    constructor(x, y, z, container) {
        this.coords = new Coords(x, y, z)
        this.bodies = []
        this.width = WORLD_WIDTH
        this.height = WORLD_HEIGHT
        this.thickness = 5
        this.container = container
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
            new Wall(w / 2, t / 2, w, t, t, up, this.container),
            new Wall(t / 2, t + h / 2, t, h, t, left, this.container),
            new Wall(w - t / 2, h / 2 + t, t, h, t, right, this.container),
            new Wall(w / 2, h - t / 2, w, t, t, down, this.container),
        ]
    }
}

export class Depth {
    constructor(x, y, z, container) {
        this.quadrants = []
        for (let i = 0; i < x; i++) {
            let column = []
            for (let j = 0; j < y; j++) {
                column.push(new Quadrant(i, j, z, container))
            }
            this.quadrants.push(column)
        }
    }
}


