import { CPlayer } from "./cPlayer";
import { lightsaber, battle, travel } from "./sfx";

class Sound {
    constructor(song) {
        this.player = new CPlayer()
        this.player.init(song)
        this.ready = false
        this.promise = new Promise(res => {
            let done = false
            let interval = setInterval(() => {
                if (done) {
                    res(true)
                    clearInterval(interval)
                    return
                }
                done = this.player.generate() >= 1
                if (done) {
                    this.wave = this.player.createWave()
                    this.audio = document.createElement('audio')
                    this.audio.src = URL.createObjectURL(new Blob([this.wave], { type: 'audio/wav' }))
                }
            }, 0)
        }).then(() => this.ready = true)
    }
    stop() {
        this.audio.pause()
    }
    play() {
        this.audio.pause()
        this.audio.play()
    }
    playBGM() {
        if (this.ready) {
            this.audio.loop = true
            this.audio.volume = 0.5
            this.audio.play()
        }
    }
}
let sfxMap = {}
let bgmMap = {}
let sfx = { lightsaber }
let bgm = { battle, travel }

Object.keys(sfx).forEach(key => sfxMap[key] = new Sound(sfx[key]))
Object.keys(bgm).forEach(key => bgmMap[key] = new Sound(bgm[key]))

let promises = [
    Object.keys(sfxMap).map(key => sfxMap[key].ready),
    Object.keys(bgmMap).map(key => bgmMap[key].ready)
]
export function playSFX(sfx) {
    sfxMap[sfx].play()
}
export function playBGM(music) {
    bgmMap[music].playBGM()
}

export let audioReady = Promise.all([promises]).then(() => {
    return true
})
