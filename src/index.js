initKeys()
keyMap['ControlLeft'] = 'ctrl'
keyMap['ShiftLeft'] = 'shift'

bindKeys('ctrl', function () {
    if (switcherooOnCooldown) return
    switcherooOnCooldown = true
    switcheroo()
    setTimeout(() => switcherooOnCooldown = false, 500)
})
const bodies = []
const playerBodies = [player, shadow]

const sprite = kontra.Sprite({
    x: 200,
    y: 200,
    color: 'blue',
    width: 50,
    height: 50,
})
bodies.push(sprite)

const loop = kontra.GameLoop({
    update: () => {
        playerBodies.forEach(key => key.update())
        bodies.forEach(key => key.update());
    },
    render: () => {
        playerBodies.forEach(key => key.render())
        bodies.forEach(key => key.render());
    },
})

loop.start()

