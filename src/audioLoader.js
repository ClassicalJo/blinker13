import { CPlayer } from "./cPlayer";
import { lightsaber, battle, travel, explosion, hit } from "./sfx";

class Sound {
    constructor(song) {
        this.player = new CPlayer()
        this.player.init(song)
        this.interval = null
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
        })
    }
    stop() {
        this.audio.pause()
    }
    play() {
        this.audio.pause()
        this.audio.currentTime = 0
        this.audio.volume = 0.5
        this.audio.play()
    }
    playBGM() {
        this.audio.loop = true
        clearInterval(this.interval)
        this.interval = setInterval(() => {
            this.audio.volume += 0.05
            if (this.audio.volume > 0.5) {
                clearInterval(this.interval)
            }
        }, 100)
        this.audio.play()
    }
    stopBGM() {
        clearInterval(this.interval)
        this.interval = setInterval(() => {
            this.audio.volume -= 0.025
            if (this.audio.volume < 0.1) {
                this.audio.pause()
                this.audio.currentTime = 0
                clearInterval(this.interval)
            }
        }, 100)
    }
}
let sfxMap = {}
let bgmMap = {}
let sfx = { lightsaber, explosion,hit }
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


