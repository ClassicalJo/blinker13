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
                    this.audio.volume = 0
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
        this.audio.volume = 1
        this.audio.play()
    }
    playBGM() {
        if (this.ready) {
            this.audio.loop = true
            let interval = setInterval(() => {
                this.audio.volume += 0.05
                if (this.audio.volume > 0.5) {
                    clearInterval(interval)
                }
            }, 100)
            this.audio.play()
        }
    }
    stopBGM() {
        let interval = setInterval(() => {
            this.audio.volume -= 0.05
            if (this.audio.volume < 0.1) {
                this.audio.pause()
                clearInterval(interval)
            }
        }, 100)
    }
}
let sfxMap = {}
let bgmMap = {}
let sfx = { lightsaber }
let bgm = { battle, travel }
let playing = null

Object.keys(sfx).forEach(key => sfxMap[key] = new Sound(sfx[key]))
Object.keys(bgm).forEach(key => bgmMap[key] = new Sound(bgm[key]))

let promises = [
    Object.keys(sfxMap).map(key => sfxMap[key].promise),
    Object.keys(bgmMap).map(key => bgmMap[key].promise)
].flat()

export function playSFX(sfx) {
    sfxMap[sfx].play()
}
export function playBGM(music) {
    bgmMap[music].playBGM()
    playing = music
}

export function changeBGM(music) {
    bgmMap[playing].stopBGM()
    playBGM(music)
}
export let audioReady = Promise.all(promises)


