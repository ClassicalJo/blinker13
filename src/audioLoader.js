import { CPlayer } from "./cPlayer";
import { lightsaber, battle } from "./sfx";

var cPlayer = new CPlayer();
class Sound {
    constructor(song) {
        cPlayer.init(song)
        this.ready = cPlayer.generate()
        this.wave = cPlayer.createWave()
        this.audio = document.createElement('audio')
        this.src = URL.createObjectURL(new Blob([this.wave], { type: 'audio/wav' }))
    }
    stop() {
        this.audio.pause()
    }
    play() {
        this.audio.pause()
        this.audio.src = this.src
        this.audio.play()
    }
    playBGM() {
        this.audio.src = this.src
        this.audio.loop = true
        this.audio.play()
    }
}
let sfxMap = {}
let bgmMap = {}
let sfx = { lightsaber }
let bgm = { battle }

Object.keys(sfx).forEach(key => sfxMap[key] = new Sound(sfx[key]))
Object.keys(bgm).forEach(key => bgmMap[key] = new Sound(bgm[key]))

function filterSounds(map) {
    let ready = Object.keys(map)
        .map(key => map[key].ready)
        .filter(key => key >= 1)
    return !(ready.length > 1)
}

function checkReady() {
    let sfxReady = filterSounds(sfxMap)
    let bgmReady = filterSounds(bgmMap)
    if (!sfxReady && !bgmReady) checkReady()
}

export function playSFX(sfx) {
    sfxMap[sfx].play()
}
export function playBGM(music) {
    bgmMap[music].playBGM()
}

checkReady()
