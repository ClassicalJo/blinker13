let UI = {
    start: function () {
        this.elements = {
            currentCoords: {
                show: true,
                sprite: coord(10, 20)
            }
        }
    },
    render: function () {
        this.elements && Object.keys(this.elements).forEach(key => {
            if (this.elements[key].show) this.elements[key].sprite.render()
        })
    }
}

let coord = (x, y) => kontra.Sprite({
    render: function () {
        this.context.fillStyle = 'black'
        this.context.font = "15px Arial";
        this.context.beginPath();
        this.context.fillText(`x: ${world.currentCoords.x}`, x, y);
        this.context.fillText(`y: ${world.currentCoords.y}`, x, y + 25);
        this.context.fillText(`z: ${world.currentCoords.z}`, x, y + 50);
    }
})

