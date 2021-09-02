var cPlayer = new CPlayer();
// cPlayer.init(lightsaber);
// cPlayer.generate()
// var wave = cPlayer.createWave();
// var audio = document.createElement("audio");


// cPlayer.init(song);
// while (cPlayer.generate() < 1) {
//     console.log('loadgin')
// }
// soundReady = true
// var wav2 = cPlayer.createWave();
// var bg = document.createElement("audio");
// bg.src = URL.createObjectURL(new Blob([wav2], { type: "audio/wav" }));
// bg.play().then(() => actionReady = true).catch();

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
    playBGM(){
        this.audio.src = this.src
        this.audio.loop = true
        this.audio.play()
    }
}
let sfxMap = {}
let bgmMap = {}
let sfx = { lightsaber }
let bgm = { song }

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

function playSFX(sfx) {
    sfxMap[sfx].play()
}
function playBGM(music) {
    bgmMap[music].playBGM()
}
