function isSameCoord(coord1, coord2) {
    return coord1.x == coord2.x && coord1.y == coord2.y && coord1.z == coord2.z
}
let UI = {
    win: function () {
        bindKeys('esc', () => { })
        Object.keys(UI.elements).forEach(key => UI.elements[key].show = false)
        UI.elements.victory.show = true
        isPaused = true
    },
    start: function () {
        this.loading = {
            lightScreen: {
                show:true,
                sprite: kontra.Sprite({
                    width: WORLD_WIDTH,
                    height: WORLD_HEIGHT,
                })
            }
        }
        this.elements = {
            blackScreen: {
                show: true,
                sprite: kontra.Sprite({
                    width: WORLD_WIDTH,
                    height: WORLD_HEIGHT,
                    color: 'black',
                    opacity: 0.5
                })
            },
            currentCoords: {
                show: true,
                sprite: coord(10, 20)
            },
            victory: {
                show: false,
                sprite: kontra.Sprite({
                    width: WORLD_WIDTH,
                    height: WORLD_HEIGHT,
                    color: 'blue',
                    opacity: 0.5
                })
            },
            map: {
                show: true,
                sprite: kontra.Sprite({
                    width: 50,
                    height: 50,
                    color: 'blue',
                    x: 100,
                    y: 100,
                    render: function () {
                        let { up, down } = world.stairMap[world.currentCoords.z]
                        for (let coord of world.exploredMaps) {
                            if (coord.z === world.currentCoords.z) {
                                this.context.beginPath()
                                this.context.fillStyle = this.color
                                let hasDownStairs = down && isSameCoord(down.coords, coord)
                                let hasUpStairs = up && isSameCoord(up.coords, coord)
                                let isCurrentCoord = isSameCoord(coord, world.currentCoords)
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
}


let coord = (x, y) => kontra.Sprite({
    render: function () {
        this.context.fillStyle = 'white'
        this.context.font = "30px Arial";
        this.context.beginPath();
        this.context.fillText(`x: ${world.currentCoords.x}`, x, y);
        this.context.fillText(`y: ${world.currentCoords.y}`, x, y + 25);
        this.context.fillText(`z: ${world.currentCoords.z}`, x, y + 50);
    }
})


