const { keyPressed, init, initKeys, keyMap, bindKeys, Vector } = kontra
const { canvas, context } = init()
initKeys()
keyMap['ControlLeft'] = 'ctrl'
bindKeys('ctrl', function () {
    if (switcherooOnCooldown) return
    console.log('lol')
    switcherooOnCooldown = true
    switcheroo()
    setTimeout(() => switcherooOnCooldown = false, 500)
})
const bodies = []
const sprite = kontra.Sprite({
    x: 200,
    y: 200,
    color: 'blue',
    width: 50,
    height: 50,
})

const playerSprite = {
    x: 50,
    y: 50,
    dx: 2,
    radius: 25,
    leftRight: 'left',
    upDown: 'up',
    update: function () {
        this.dx = keyPressed('left') ? -2 : keyPressed('right') ? 2 : 0
        this.dy = keyPressed('up') ? -2 : keyPressed('down') ? 2 : 0
        this.advance()
    },
    render: function () {
        this.context.fillStyle = this.color;
        this.context.beginPath();
        this.context.arc(0, 0, this.radius, 0, 2 * Math.PI);
        this.context.fill();
    }
}
const player = kontra.Sprite({
    color: "goldenrod",
    name: "player",
    ...playerSprite
})

const shadow = kontra.Sprite({
    color: "purple",
    name: 'shadow',
    ...playerSprite,
})


let playerBodies = [shadow, player]

bodies.push(sprite)

let playerMap = { shadow, player }
let activeSprite = 'player'

let toggleShadow = str => str === 'player' ? 'shadow' : 'player'
let switcheroo = () => activeSprite = toggleShadow(activeSprite)
let switcherooOnCooldown = false
const loop = kontra.GameLoop({
    update: () => {
        playerMap[activeSprite].update()
        bodies.forEach(key => key.update());
    },
    render: () => {
        playerBodies.forEach(key => key.render())
        bodies.forEach(key => key.render());
    },
})

loop.start()
