const { degToRad, keyPressed, init, initKeys, keyMap, bindKeys, Vector } = kontra
const { canvas, context } = init()

function distanceToTarget(origin, dest) {
    return Math.sqrt(Math.pow((dest.x - origin.x), 2) + Math.pow((dest.y - origin.y), 2))
}

function noDirection() {
    return !keyPressed('up') && !keyPressed('down') && !keyPressed('left') && !keyPressed('right')
}
function leftRightSwitch(a, b, c) {
    if (keyPressed('left')) return a
    else if (keyPressed('right')) return b
    else return c
}
function upDownSwitch(a, b, c) {
    if (keyPressed('up')) return a
    else if (keyPressed('down')) return b
    else return c
}
class Combo {
    constructor(steps, cooldown, timer) {
        this.steps = steps
        this.cooldown = cooldown
        this.timer = timer
        this.currentStep = 0
        this.timeout = null
        this.onCooldown = false
        this.canceled = false
        this.start()
    }
    shouldReset() {
        return this.currentStep === 0
    }
    next() {
        this.currentStep++
        clearTimeout(this.timeout)
        this.start()
        if (this.currentStep === this.steps.length) this.currentStep = 0
    }
    start() {
        this.timeout = setTimeout(() => this.cancel(), this.timer)
    }
    cancel() {
        this.canceled = true
    }

}

class Combo1 extends Combo {
    constructor() {
        super([10, 15, 25], 500, 4000);
        this.attackDistance = 50
    }
    attack(body) {
        let move = this.steps[this.currentStep]
        let swordOffsetX = leftRightSwitch(-this.attackDistance, this.attackDistance, 0)
        let swordOffsetY = upDownSwitch(-this.attackDistance, this.attackDistance, 0)
        if(Math.abs(swordOffsetX) > 0 && Math.abs(swordOffsetY) > 0) {
            swordOffsetY /= 1.5
            swordOffsetX /= 1.5
        }
        function swordRotation() {
            //POSSIBLE SHIELD 
            // let a = leftRightSwitch(90, -90, null)
            // let b = upDownSwitch(0, 180, null)
            let a = leftRightSwitch(90, -90, null)
            let b = upDownSwitch(180, 0, null)
            if (a !== null && b !== null) return degToRad(a+b)/2
            return degToRad((a || b))
            // else if (absA > 0) return degToRad(a)
            // else if (absB > 0) return degToRad(b)
            // else return 0

        }
        if (noDirection()) {
            body.dy = -move
            let sword = this.craftSword(0, -this.attackDistance, Math.PI)
            body.addChild(sword)
        }
        else {
            let sword = this.craftSword(swordOffsetX, swordOffsetY, swordRotation())
            body.dx = leftRightSwitch(-move, move, 0)
            body.dy = upDownSwitch(-move, move, 0)
            body.addChild(sword)
        }


    }
    craftSword(x, y, rotation) {
        return kontra.Sprite({
            x,
            y,
            rotation,
            width: 5,
            anchor: { x: 0.5, y: 0.5 },
            height: 30,
            color: 'red'
        })
    }
    swing(sword) {

    }
}

const playerSprite = {
    x: 200,
    y: 200,
    baseAccel: 0.25,
    speedLimit: 5,
    radius: 25,
    attackCooldown: false,
    combo: null,
    released: true,
    attack: function () {
        this.color = 'red'
        this.released = false
        this.attackCooldown = true
        this.combo.attack(this)
        this.combo.next()
    },
    canAttack: function () {
        return keyPressed('shift') && !this.attackCooldown && this.released
    },
    isActive: function () {
        return status = this.name === activeSprite
    },
    reset: function () {
        this.combo = null
        setTimeout(() => {
            this.attackCooldown = false
            this.color = this.baseColor
        }, 2000)
    },
    cancel: function () {
        this.combo = null
        this.color = "goldenrod"
    },
    shouldCancel: function () {
        return this.combo !== null && this.combo.canceled
    },
    setReady: function (cooldown) {
        setTimeout(() => {
            this.attackCooldown = false
            this.color = 'green'
        }, cooldown)
    },
    move: function () {
        this.ddx = keyPressed('left') ? -this.baseAccel : keyPressed('right') ? this.baseAccel : 0
        this.ddy = keyPressed('up') ? -this.baseAccel : keyPressed('down') ? this.baseAccel : 0
        if (Math.abs(this.dx) > this.speedLimit) this.dx *= 0.9
        if (Math.abs(this.dy) > this.speedLimit) this.dy *= 0.9
        if (!keyPressed('up') && !keyPressed('down')) this.dy *= 0.99
        if (!keyPressed('left') && !keyPressed('right')) this.dx *= 0.98
        this.advance()
    },
    update: function () {
        if (!this.isActive()) return
        if (this.shouldCancel()) this.cancel()
        if (this.canAttack()) {
            if (this.combo === null) this.combo = new Combo1()
            this.attack()
            if (this.combo.shouldReset()) this.reset()
            else this.setReady(this.combo.cooldown)
        }
        else if (!keyPressed('shift')) this.released = true
        this.move()
    },
    render: function () {
        this.context.fillStyle = this.color;
        this.context.beginPath();
        this.context.arc(0, 0, this.radius, 0, 2 * Math.PI);
        this.context.fill();
    }
}

const player = kontra.Sprite({
    baseColor: 'goldenrod',
    color: "goldenrod",
    name: "player",
    ...playerSprite
})

const shadow = kontra.Sprite({
    baseColor: "purple",
    color: "purple",
    name: 'shadow',
    ...playerSprite,
})

function makeLink(origin, dest) {
    return kontra.Sprite({
        x: origin.x,
        y: origin.y,
        rotation: kontra.angleToTarget(origin, dest),
        width: 5,
        height: distanceToTarget(origin, dest),
        anchor: { x: 0.5, y: 1 },
        color: 'black',
        name: 'link',
    })
}

let playerMap = { shadow, player }
let activeSprite = 'player'

let toggleShadow = str => str === 'player' ? 'shadow' : 'player'
let switcheroo = () => {
    let link = makeLink({ x: player.x, y: player.y }, { x: shadow.x, y: shadow.y })
    bodies.push(link)
    activeSprite = toggleShadow(activeSprite)
    setTimeout(() => {
        for (let i = bodies.length - 1; i >= 0; i--) {
            if (bodies[i].name === link.name) bodies.splice(i, 1)
        }
    }, 1000)
}


let switcherooOnCooldown = false
