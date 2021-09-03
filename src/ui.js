import { bindKeys, Sprite, unbindKeys } from './kontra'
import { WORLD_WIDTH, WORLD_HEIGHT } from './init'
import { screen } from './images'

function isSameCoord(coord1, coord2) {
    return coord1.x == coord2.x && coord1.y == coord2.y && coord1.z == coord2.z
}
export let initUI = container => ({
    win: function () {
        // unbindKeys('esc',)
        bindKeys('esc', () => { })
        Object.keys(this.elements).forEach(key => this.elements[key].show = false)
        this.elements.victory.show = true
        container.isPaused = true
    },
    start: function () {
        this.elements = {
            blackScreen: {
                show: true,
                sprite: screen('black', 0.5)
            },
            currentCoords: {
                show: true,
                sprite: coord(10, 20, container)
            },
            victory: {
                show: false,
                sprite: screen('blue', 0.5)
            },
            map: {
                show: true,
                sprite: Sprite({
                    width: 50,
                    height: 50,
                    color: 'blue',
                    x: 100,
                    y: 100,
                    render: function () {
                        let { up, down } = container.stairMap[container.currentCoords.z]
                        for (let coord of container.exploredMaps) {
                            if (coord.z === container.currentCoords.z) {
                                this.context.beginPath()
                                this.context.fillStyle = this.color
                                let hasDownStairs = down && isSameCoord(down.coords, coord)
                                let hasUpStairs = up && isSameCoord(up.coords, coord)
                                let isCurrentCoord = isSameCoord(coord, container.currentCoords)
                                this.context.fillStyle = hasDownStairs ? hasUpStairs ? "orange" : 'red' : hasUpStairs ? 'yellow' : 'blue'
                                this.context.rect(this.x + coord.x * 50, this.y + coord.y * 50, 50, 50)
                                this.context.fill()
                                if (isCurrentCoord) {
                                    this.context.beginPath()
                                    this.context.fillStyle = 'white'
                                    this.context.arc(this.x + 25 + coord.x * 50, this.y + 25 + coord.y * 50, 5, 0, Math.PI * 2)
                                    this.context.fill()
                                }
                            }
                        }
                    }
                })
            }
        }
    },
    render: function () {
        this.elements && Object.keys(this.elements).forEach(key => {
            if (this.elements[key].show) this.elements[key].sprite.render()
        })
    },
    update: function () {
        this.elements && Object.keys(this.elements).forEach(key => this.elements[key].sprite.update())
    }
})


let coord = (x, y, container) => Sprite({
    render: function () {
        this.context.fillStyle = 'white'
        this.context.font = "30px Arial";
        this.context.beginPath();
        this.context.fillText(`x: ${container.currentCoords.x}`, x, y);
        this.context.fillText(`y: ${container.currentCoords.y}`, x, y + 25);
        this.context.fillText(`z: ${container.currentCoords.z}`, x, y + 50);
    }
})


