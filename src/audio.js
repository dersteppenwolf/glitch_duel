let audioCtx;
const AUDIO_STORAGE_KEY = 'glitchDuelAudioVolumes';
const audioVolumes = loadAudioVolumes();

// Music system state
let musicState = null;
let musicIntensity = 0;
let musicStyle = 'default';
let nextMusicStyle = null;
let musicPaused = false;
let musicNextBar = 0;
let musicBarIndex = 0;
let musicEffects = { lowpass: null, bitcrush: null, stutterTimer: null };
let musicMasterGain = null;
let musicMasterFilter = null;
let musicDelay = null;
let musicDelayGain = null;
let musicChorusLFO = null;
let musicChorusGain = null;
let musicPadOscillators = [];

// Melody phrase memory — built once per intensity, repeated with variation
let melodyPhrases = { 1: null, 2: null, 3: null };

const audioDiagnostics = {
    createdGraphs: 0,
    endedGraphs: 0,
    activeGraphs: 0,
    oscillatorsCreated: 0,
    oscillatorsDisconnected: 0,
    gainsCreated: 0,
    gainsDisconnected: 0,
    droppedVoices: 0
};

const ATTACK_SOUND_PROFILES = {
    punch: { wave: 'square', start: 420, end: 150, gain: 0.12, duration: 80 },
    kick: { wave: 'triangle', start: 220, end: 85, gain: 0.16, duration: 110 },
    airPunch: { wave: 'square', start: 500, end: 190, gain: 0.12, duration: 90 },
    airKick: { wave: 'triangle', start: 280, end: 90, gain: 0.16, duration: 120 },
    comboPunch: { wave: 'sawtooth', start: 560, end: 170, gain: 0.16, duration: 115 },
    comboKick: { wave: 'sawtooth', start: 360, end: 95, gain: 0.18, duration: 135 },
    backKick: { wave: 'triangle', start: 180, end: 70, gain: 0.19, duration: 150 },
    special: { wave: 'sawtooth', start: 680, end: 90, gain: 0.22, duration: 180 }
};

const IMPACT_SOUND_PROFILES = {
    punch: { wave: 'sawtooth', start: 190, end: 70, gain: 0.2, duration: 80 },
    kick: { wave: 'sawtooth', start: 140, end: 55, gain: 0.23, duration: 110 },
    airPunch: { wave: 'sawtooth', start: 220, end: 75, gain: 0.21, duration: 90 },
    airKick: { wave: 'triangle', start: 170, end: 55, gain: 0.24, duration: 120 },
    comboPunch: { wave: 'sawtooth', start: 240, end: 80, gain: 0.24, duration: 105 },
    comboKick: { wave: 'triangle', start: 165, end: 50, gain: 0.27, duration: 130 },
    backKick: { wave: 'triangle', start: 120, end: 42, gain: 0.28, duration: 145 },
    special: { wave: 'sawtooth', start: 95, end: 30, gain: 0.32, duration: 190 },
    block: { wave: 'square', start: 620, end: 420, gain: 0.12, duration: 70 }
};

const UI_SOUND_PROFILES = {
    select: { wave: 'square', start: 520, end: 660, gain: 0.08, duration: 55 },
    start: { wave: 'triangle', start: 360, end: 720, gain: 0.12, duration: 120 },
    pause: { wave: 'square', start: 260, end: 180, gain: 0.1, duration: 90 },
    resume: { wave: 'triangle', start: 300, end: 540, gain: 0.1, duration: 95 },
    menu: { wave: 'sine', start: 420, end: 260, gain: 0.09, duration: 85 }
};

function initAudio() {
    if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;
        try {
            audioCtx = new AudioContextClass();
        } catch (_) {
            audioCtx = null;
        }
    }
    if (audioCtx && audioCtx.state === 'suspended' && typeof audioCtx.resume === 'function') {
        const resumed = audioCtx.resume();
        if (resumed && typeof resumed.catch === 'function') resumed.catch(() => {});
    }
}

function initMusicBus() {
    if (!audioCtx) return;
    if (musicMasterGain) return;
    musicMasterGain = audioCtx.createGain();
    if (!musicChorusLFO) {
    musicMasterGain.gain.value = 0.85;
    musicMasterFilter = audioCtx.createBiquadFilter();
    musicMasterFilter.type = 'lowshelf';
    musicMasterFilter.frequency.value = 300;
    musicMasterFilter.gain.value = 2.5;
    const highCut = audioCtx.createBiquadFilter();
    highCut.type = 'lowpass';
    highCut.frequency.value = 10000;
    highCut.Q.value = 0.5;
    musicMasterGain.connect(musicMasterFilter).connect(highCut).connect(audioCtx.destination);
    const lfo = audioCtx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.04;
    const lfoGain = audioCtx.createGain();
    lfoGain.gain.value = 500;
    lfo.connect(lfoGain);
    lfoGain.connect(highCut.frequency);
    lfo.start();
    musicDelay = audioCtx.createDelay(0.5);
    musicDelay.delayTime.value = 0.12;
    musicDelayGain = audioCtx.createGain();
    musicDelayGain.gain.value = 0.18;
    musicDelay.connect(musicDelayGain);
    musicDelayGain.connect(musicMasterGain);
    musicChorusLFO = audioCtx.createOscillator();
    musicChorusLFO.type = 'sine';
    musicChorusLFO.frequency.value = 1.2;
    musicChorusGain = audioCtx.createGain();
    musicChorusGain.gain.value = 0.008;
        musicChorusLFO.connect(musicChorusGain);
        musicChorusLFO.start();
    }
}

function loadAudioVolumes() {
    const values = { combat: AUDIO_CONFIG.combat, ui: AUDIO_CONFIG.ui };
    try {
        const saved = JSON.parse(window.localStorage.getItem(AUDIO_STORAGE_KEY));
        if (saved && saved.version === 1) {
            for (const channel of ['combat', 'ui']) {
                if (typeof saved[channel] === 'number' && Number.isFinite(saved[channel]) && saved[channel] >= 0 && saved[channel] <= 1) values[channel] = saved[channel];
            }
        }
    } catch (_) { /* Unavailable or invalid storage keeps safe defaults. */ }
    return values;
}

function getAudioVolumes() {
    return { ...audioVolumes };
}

function setAudioVolume(channel, value) {
    if (!['combat', 'ui'].includes(channel) || !Number.isFinite(value)) return false;
    audioVolumes[channel] = Math.max(0, Math.min(1, value));
    try {
        window.localStorage.setItem(AUDIO_STORAGE_KEY, JSON.stringify({ version: 1, ...audioVolumes }));
    } catch (_) { /* The session preference still works without storage. */ }
    return true;
}

function getAudioDiagnostics() {
    return {
        ...audioDiagnostics,
        activeGraphs: audioDiagnostics.activeGraphs,
        contextState: audioCtx ? audioCtx.state || 'unknown' : 'uninitialized'
    };
}

function midiToFreq(midi) { return 440 * Math.pow(2, (midi - 69) / 12); }

const HUMANIZE = { jitter: 0.006, swing: 0.005, ghost: 0.2 };

const MELODY_ACCENT = { downbeat: 1.2, upbeat: 0.85 };

function accentGain(beat, baseGain) {
    if (beat % 4 === 0) return baseGain * MELODY_ACCENT.downbeat;
    if (beat % 2 === 1) return baseGain * MELODY_ACCENT.upbeat;
    return baseGain;
}

// NES-style pulse wave with adjustable duty cycle
function createPulseWave(duty) {
    if (!audioCtx) return null;
    const real = new Float32Array(2);
    const imag = new Float32Array(2);
    real[0] = 0;
    imag[0] = 0;
    real[1] = 0;
    imag[1] = 2 * Math.sin(Math.PI * duty) / Math.PI;
    return audioCtx.createPeriodicWave(real, imag, { disableNormalization: true });
}

const NES_PULSE_WIDE = createPulseWave(0.25);
const NES_PULSE_NARROW = createPulseWave(0.125);

// Harmonic progressions: each value is [rootIdxOffset, chordQuality]
// 0 = minor, 1 = major, 2 = sus4
const DRUM_PATTERNS = [
    // A: rock clasico
    { kicks: [0, 8], snares: [4, 12], hatEach: 2, hatOpen: [] },
    // B: four-on-the-floor variado
    { kicks: [0, 4, 8, 12], snares: [2, 6, 10, 14], hatEach: 2, hatOpen: [] },
    // C: half-time feel
    { kicks: [0, 3, 8, 11], snares: [4, 12], hatEach: 2, hatOpen: [7, 15] },
    // D: contratiempos
    { kicks: [0, 6, 8, 14], snares: [2, 10], hatEach: 2, hatOpen: [] },
    // E: double-time hihat
    { kicks: [0, 8], snares: [4, 12], hatEach: 1, hatOpen: [3, 7, 11, 15] },
    // F: balada (poco kick, mucho hat)
    { kicks: [0, 8], snares: [4, 12], hatEach: 1, hatOpen: [] }
];

function pickDrumPattern(barIndex, isBreakdown) {
    const section = Math.floor(barIndex / 8) % 3;
    if (isBreakdown || section === 2) return 4;
    if (section === 0) return 0;
    return 2;
}

function scheduleDrumCrash(time) {
    if (!audioCtx || musicVolume() <= 0) return;
    time = Math.max(0, time);
    const vol = musicVolume() * AUDIO_CONFIG.mixGain * 0.15;
    const noise = audioCtx.createBufferSource();
    const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.3, audioCtx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (audioCtx.sampleRate * 0.02));
    noise.buffer = buf;
    const ng = audioCtx.createGain();
    ng.gain.setValueAtTime(Math.min(0.2, vol), time);
    ng.gain.exponentialRampToValueAtTime(0.0001, time + 0.25);
    const nf = audioCtx.createBiquadFilter();
    nf.type = 'highpass';
    nf.frequency.value = 3000;
    noise.connect(ng).connect(nf).connect(musicMasterGain);
    noise.start(time); noise.stop(time + 0.3);
}

function scheduleDrumFill(time, beatSec) {
    if (!audioCtx || musicVolume() <= 0) return;
    time = Math.max(0, time);
    const vol = musicVolume() * AUDIO_CONFIG.mixGain * 0.2;
    const count = 4;
    for (let i = 0; i < count; i++) {
        const ft = time + (i * beatSec) / count;
        const noise = audioCtx.createBufferSource();
        const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.06, audioCtx.sampleRate);
        const d = buf.getChannelData(0);
        for (let j = 0; j < d.length; j++) d[j] = (Math.random() * 2 - 1) * Math.exp(-j / (audioCtx.sampleRate * 0.008));
        noise.buffer = buf;
        const ng = audioCtx.createGain();
        ng.gain.setValueAtTime(Math.min(0.15, vol * (1 - i / count)), ft);
        ng.gain.exponentialRampToValueAtTime(0.0001, ft + 0.04);
        const nf = audioCtx.createBiquadFilter();
        nf.type = 'bandpass';
        nf.frequency.value = 2000 + i * 800;
        noise.connect(ng).connect(nf).connect(musicMasterGain);
        noise.start(ft); noise.stop(ft + 0.05);
    }
}

function scheduleCrashOnNewSection(barIndex, beatSec) {
    const section = Math.floor(barIndex / 8) % 3;
    if (barIndex > 0 && barIndex % 8 === 0) {
        scheduleDrumCrash(beatSec * 16 * (barIndex - 1) + beatSec * 16);
    }
}

const MUSIC_STYLES = {
    bitDuel: { label: 'Bit Duel', bpm: 145, noteOffset: 0, rootIdx: 2, char: 'default' },
    baroqueBash: { label: 'Baroque Bash', bpm: 165, noteOffset: 0, rootIdx: 2, char: 'baroque' },
    neonFury: { label: 'Neon Fury', bpm: 155, noteOffset: 3, rootIdx: 2, char: 'synth' },
    glitchAssault: { label: 'Glitch Assault', bpm: 200, noteOffset: 0, rootIdx: 2, char: 'metal' },
    retroGroove: { label: 'Retro Groove', bpm: 125, noteOffset: 0, rootIdx: 2, char: 'funk' },
    voidReach: { label: 'Void Reach', bpm: 90, noteOffset: 0, rootIdx: 2, char: 'ambient' }
};

function setMusicStyle(style) {
    if (MUSIC_STYLES[style]) { musicStyle = style; }
}

function getMusicStyleName() { return musicStyle; }

function getMusicStyleList() { return Object.keys(MUSIC_STYLES); }

const HARMONY = {
    1: { // A minor (Am) — rootIdx 2
        chords: [{ rootOff: 0, qual: 0 }, { rootOff: 0, qual: 0 }, { rootOff: 5, qual: 0 }, { rootOff: 7, qual: 1 }]
    },
    2: {
        chords: [{ rootOff: 0, qual: 0 }, { rootOff: 3, qual: 1 }, { rootOff: 5, qual: 0 }, { rootOff: 7, qual: 1 }]
    },
    3: { // B minor — rootIdx 4
        chords: [{ rootOff: 0, qual: 0 }, { rootOff: 2, qual: 1 }, { rootOff: 5, qual: 0 }, { rootOff: 7, qual: 0 }]
    }
};

function getChordRoot(intensity, barIndex) {
    const prog = HARMONY[intensity] || HARMONY[1];
    return prog.chords[barIndex % prog.chords.length];
}

// Walking bass: 4 notes per bar that walk toward the next chord root.
// Rhythm varies by intensity.
function buildWalkingBass(intensity, barIndex) {
    const pool = MUSIC_CONFIG.notePool;
    const rootIdx = intensity >= 3 ? 4 : 2;
    const chord = getChordRoot(intensity, barIndex);
    const rootNote = pool[rootIdx + chord.rootOff];
    const nextChord = getChordRoot(intensity, barIndex + 1);
    const nextRoot = pool[rootIdx + nextChord.rootOff];
    const third = chord.qual === 1 ? 4 : 3;
    const walking = [rootNote, pool[rootIdx + chord.rootOff + 2], pool[rootIdx + chord.rootOff + third], nextRoot];
    const rhythm = { 'noteIndices': [0, 1, 2, 3], 'durations': [1, 1, 1, 1] };
    if (intensity === 1) {
        rhythm.noteIndices = [0, 2, 1, 3];
        // 2 blancas: [nota * 2 beats, nota * 2 beats]
        if (barIndex % 4 < 2) {
            rhythm.noteIndices = [0, 3];
            rhythm.durations = [2, 2];
        }
    } else if (intensity === 2) {
        if (Math.floor(barIndex / 8) % 3 === 2) {
            rhythm.noteIndices = [0, 1, 2];
            rhythm.durations = [1, 0.5, 0.5];
        }
    } else if (intensity === 3) {
        // 8 corcheas: triplete de aproximación
        rhythm.noteIndices = [0, 0, 1, 1, 2, 2, 3, 3];
        rhythm.durations = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5];
    }
    return { notes: rhythm.noteIndices.map(i => walking[i]), durations: rhythm.durations };
}

function scheduleDrumKick(time, gain = 0.5, humanMs = 0) {
    if (!audioCtx || musicVolume() <= 0) return;
    if (!Number.isFinite(gain) || gain <= 0) return;
    time = Math.max(0, time + humanMs / 1000);
    const vol = musicVolume() * AUDIO_CONFIG.mixGain * gain;
    const sine = audioCtx.createOscillator();
    const sg = audioCtx.createGain();
    sine.type = 'sine';
    sine.frequency.setValueAtTime(150, time);
    sine.frequency.exponentialRampToValueAtTime(50, time + 0.08);
    sg.gain.setValueAtTime(0, time);
    sg.gain.linearRampToValueAtTime(Math.min(0.5, vol), time + 0.005);
    sg.gain.exponentialRampToValueAtTime(0.0001, time + 0.25);
    const noise = audioCtx.createBufferSource();
    const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.05, audioCtx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (audioCtx.sampleRate * 0.008));
    noise.buffer = buf;
    const ng = audioCtx.createGain();
    ng.gain.setValueAtTime(Math.min(0.3, vol * 0.6), time);
    ng.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);
    const nf = audioCtx.createBiquadFilter();
    nf.type = 'highpass';
    nf.frequency.value = 1500;
    sine.connect(sg).connect(musicMasterGain);
    noise.connect(ng).connect(nf).connect(musicMasterGain);
    sine.start(time); sine.stop(time + 0.3);
    noise.start(time); noise.stop(time + 0.06);
}

function scheduleDrumSnare(time, gain = 0.4, humanMs = 0) {
    if (!audioCtx || musicVolume() <= 0) return;
    if (!Number.isFinite(gain) || gain <= 0) return;
    time = Math.max(0, time + humanMs / 1000);
    const vol = musicVolume() * AUDIO_CONFIG.mixGain * gain;
    const sine = audioCtx.createOscillator();
    const sg = audioCtx.createGain();
    sine.type = 'triangle';
    sine.frequency.setValueAtTime(220, time);
    sine.frequency.exponentialRampToValueAtTime(80, time + 0.1);
    sg.gain.setValueAtTime(0, time);
    sg.gain.linearRampToValueAtTime(Math.min(0.3, vol * 0.7), time + 0.003);
    sg.gain.exponentialRampToValueAtTime(0.0001, time + 0.15);
    const noise = audioCtx.createBufferSource();
    const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.12, audioCtx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (audioCtx.sampleRate * 0.015));
    noise.buffer = buf;
    const ng = audioCtx.createGain();
    ng.gain.setValueAtTime(Math.min(0.35, vol * 0.8), time);
    ng.gain.exponentialRampToValueAtTime(0.0001, time + 0.12);
    const nf = audioCtx.createBiquadFilter();
    nf.type = 'bandpass';
    nf.frequency.value = 4000;
    nf.Q.value = 0.6;
    if (Math.random() < 0.3) {
        const noise2 = audioCtx.createBufferSource();
        const buf2 = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.08, audioCtx.sampleRate);
        const d2 = buf2.getChannelData(0);
        for (let i = 0; i < d2.length; i++) d2[i] = (Math.random() * 2 - 1) * Math.exp(-i / (audioCtx.sampleRate * 0.005));
        noise2.buffer = buf2;
        const ng2 = audioCtx.createGain();
        ng2.gain.setValueAtTime(Math.min(0.15, vol * 0.3), time);
        ng2.gain.exponentialRampToValueAtTime(0.0001, time + 0.06);
        const nf2 = audioCtx.createBiquadFilter();
        nf2.type = 'highpass';
        nf2.frequency.value = 8000;
        noise2.connect(ng2).connect(nf2).connect(musicMasterGain);
        noise2.start(time); noise2.stop(time + 0.07);
    }
    sine.connect(sg).connect(musicMasterGain);
    noise.connect(ng).connect(nf).connect(musicMasterGain);
    sine.start(time); sine.stop(time + 0.2);
    noise.start(time); noise.stop(time + 0.15);
}

function scheduleDrumHat(time, gain = 0.25, humanMs = 0, closed = true) {
    if (!audioCtx || musicVolume() <= 0) return;
    if (!Number.isFinite(gain) || gain <= 0) return;
    time = Math.max(0, time + humanMs / 1000);
    const vol = musicVolume() * AUDIO_CONFIG.mixGain * gain;
    const noise = audioCtx.createBufferSource();
    const dur = closed ? 0.04 : 0.12;
    const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * dur, audioCtx.sampleRate);
    const data = buf.getChannelData(0);
    const decay = closed ? audioCtx.sampleRate * 0.01 : audioCtx.sampleRate * 0.025;
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / decay);
    noise.buffer = buf;
    const ng = audioCtx.createGain();
    ng.gain.setValueAtTime(Math.min(0.25, vol * 0.7), time);
    ng.gain.linearRampToValueAtTime(0.0001, time + dur);
    const nf = audioCtx.createBiquadFilter();
    nf.type = 'highpass';
    nf.frequency.value = 7000;
    nf.Q.value = 0.5;
    noise.connect(ng).connect(nf).connect(musicMasterGain);
    noise.start(time); noise.stop(time + dur + 0.01);
}

function noteAt(root, offset) {
    return MUSIC_CONFIG.notePool[(root + offset + MUSIC_CONFIG.notePool.length) % MUSIC_CONFIG.notePool.length];
}

function createWaveShaper(amount) {
    const curveLen = 256;
    const curve = new Float32Array(curveLen);
    for (let i = 0; i < curveLen; i++) {
        const x = (i / curveLen) * 2 - 1;
        curve[i] = ((1 + amount) * x) / (1 + amount * Math.abs(x));
    }
    const ws = audioCtx.createWaveShaper();
    ws.curve = curve;
    return ws;
}

function buildMelodyPhrase(intensity, barIndex) {
    const pool = MUSIC_CONFIG.notePool;
    const style = MUSIC_STYLES[musicStyle] || MUSIC_STYLES.default;
    const rootIdx = (intensity >= 3 ? 4 : 2) + style.noteOffset;
    const section = Math.floor(barIndex / 8) % 3;
    if (!melodyPhrases[musicStyle]) melodyPhrases[musicStyle] = {};
    const sk = `${musicStyle}_${intensity}`;
    if (!melodyPhrases[musicStyle][sk]) melodyPhrases[musicStyle][sk] = {};
    const key = `${intensity}_${section}`;
    if (!melodyPhrases[musicStyle][sk][key]) {
        const p = pool;
        const r = rootIdx;
        const melodies = {
            default: {
                1: [
                    [p[r+4], p[r+4], p[r+7], p[r+5],  p[r+4], p[r+8], p[r+7], p[r+5],
                     p[r+4], p[r+4], p[r+7], p[r+9],  p[r+7], p[r+8], p[r+7], p[r+5]],
                    [p[r+7], p[r+8], p[r+9], p[r+7],  p[r+8], p[r+9], p[r+11], p[r+7],
                     p[r+6], p[r+5], p[r+4], p[r+2],  p[r+4], p[r+5], p[r+4], p[r+2]],
                    [p[r+4], p[r+4], p[r+2], p[r+2],  p[r+5], p[r+5], p[r+4], p[r+4],
                     p[r+2], p[r+2], p[r+0], p[r+0],  p[r+4], p[r+5], p[r+7], p[r+5]],
                ],
                2: [
                    [p[r+4], p[r+6], p[r+7], p[r+6],  p[r+4], p[r+6], p[r+7], p[r+9],
                     p[r+7], p[r+6], p[r+4], p[r+2],  p[r+4], p[r+6], p[r+7], p[r+6]],
                    [p[r+7], p[r+9], p[r+11], p[r+9],  p[r+7], p[r+6], p[r+7], p[r+9],
                     p[r+6], p[r+7], p[r+9], p[r+6],  p[r+4], p[r+2], p[r+4], p[r+2]],
                    [p[r+4], p[r+5], p[r+7], p[r+5],  p[r+4], p[r+2], p[r+0], p[r+2],
                     p[r+4], p[r+5], p[r+7], p[r+9],  p[r+7], p[r+5], p[r+4], p[r+2]],
                ],
                3: [
                    [p[r+4], p[r+7], p[r+4], p[r+7],  p[r+5], p[r+4], p[r+5], p[r+7],
                     p[r+4], p[r+7], p[r+4], p[r+7],  p[r+9], p[r+7], p[r+5], p[r+4]],
                    [p[r+7], p[r+9], p[r+7], p[r+9],  p[r+11], p[r+9], p[r+7], p[r+6],
                     p[r+5], p[r+4], p[r+5], p[r+7],  p[r+4], p[r+5], p[r+7], p[r+9]],
                    [p[r+4], p[r+4], p[r+5], p[r+5],  p[r+7], p[r+7], p[r+8], p[r+8],
                     p[r+7], p[r+5], p[r+4], p[r+2],  p[r+4], p[r+5], p[r+7], p[r+5]],
                ]
            },
            baroquePunk: {
                1: [
                    [p[r+4], p[r+7], p[r+5], p[r+7],  p[r+4], p[r+5], p[r+4], p[r+2],
                     p[r+4], p[r+0], p[r+2], p[r+4],  p[r+5], p[r+7], p[r+5], p[r+4]],
                    [p[r+7], p[r+6], p[r+7], p[r+9],  p[r+7], p[r+5], p[r+4], p[r+5],
                     p[r+7], p[r+6], p[r+7], p[r+9],  p[r+11], p[r+9], p[r+7], p[r+5]],
                    [p[r+2], p[r+2], p[r+4], p[r+4],  p[r+2], p[r+0], p[r+2], p[r+4],
                     p[r+5], p[r+5], p[r+4], p[r+2],  p[r+0], p[r+0], p[r+2], p[r+4]],
                ],
                2: [
                    [p[r+4], p[r+7], p[r+8], p[r+7],  p[r+5], p[r+8], p[r+7], p[r+5],
                     p[r+4], p[r+7], p[r+8], p[r+7],  p[r+9], p[r+7], p[r+5], p[r+4]],
                    [p[r+7], p[r+11], p[r+9], p[r+7],  p[r+6], p[r+7], p[r+9], p[r+11],
                     p[r+7], p[r+6], p[r+5], p[r+4],  p[r+5], p[r+7], p[r+6], p[r+4]],
                    [p[r+4], p[r+5], p[r+4], p[r+2],  p[r+4], p[r+5], p[r+4], p[r+2],
                     p[r+0], p[r+2], p[r+4], p[r+5],  p[r+7], p[r+5], p[r+4], p[r+2]],
                ],
                3: [
                    [p[r+4], p[r+7], p[r+4], p[r+7],  p[r+9], p[r+7], p[r+5], p[r+4],
                     p[r+5], p[r+7], p[r+5], p[r+4],  p[r+2], p[r+4], p[r+2], p[r+0]],
                    [p[r+7], p[r+9], p[r+11], p[r+9],  p[r+7], p[r+6], p[r+7], p[r+9],
                     p[r+4], p[r+5], p[r+7], p[r+9],  p[r+7], p[r+5], p[r+4], p[r+2]],
                    [p[r+4], p[r+2], p[r+4], p[r+5],  p[r+7], p[r+5], p[r+4], p[r+2],
                     p[r+4], p[r+5], p[r+7], p[r+9],  p[r+7], p[r+5], p[r+4], p[r+2]],
                ]
            },
            glitchAssault: {
                1: [
                    [p[r+4], p[r+4], p[r+7], p[r+7],  p[r+5], p[r+5], p[r+4], p[r+4],
                     p[r+7], p[r+7], p[r+5], p[r+5],  p[r+4], p[r+4], p[r+2], p[r+2]],
                    [p[r+7], p[r+9], p[r+7], p[r+5],  p[r+7], p[r+9], p[r+11], p[r+9],
                     p[r+7], p[r+5], p[r+4], p[r+2],  p[r+4], p[r+5], p[r+7], p[r+5]],
                    [p[r+4], p[r+4], p[r+2], p[r+2],  p[r+0], p[r+0], p[r+2], p[r+2],
                     p[r+4], p[r+5], p[r+7], p[r+9],  p[r+7], p[r+5], p[r+4], p[r+2]],
                ],
                2: [
                    [p[r+4], p[r+7], p[r+8], p[r+7],  p[r+5], p[r+7], p[r+8], p[r+7],
                     p[r+4], p[r+7], p[r+8], p[r+7],  p[r+9], p[r+7], p[r+5], p[r+4]],
                    [p[r+7], p[r+9], p[r+11], p[r+9],  p[r+7], p[r+6], p[r+5], p[r+4],
                     p[r+5], p[r+7], p[r+9], p[r+7],  p[r+5], p[r+4], p[r+2], p[r+0]],
                    [p[r+4], p[r+5], p[r+4], p[r+2],  p[r+4], p[r+5], p[r+4], p[r+2],
                     p[r+0], p[r+2], p[r+4], p[r+5],  p[r+7], p[r+5], p[r+4], p[r+2]],
                ],
                3: [
                    [p[r+4], p[r+7], p[r+4], p[r+7],  p[r+9], p[r+7], p[r+5], p[r+4],
                     p[r+5], p[r+7], p[r+5], p[r+4],  p[r+2], p[r+4], p[r+2], p[r+0]],
                    [p[r+7], p[r+9], p[r+11], p[r+9],  p[r+7], p[r+6], p[r+7], p[r+9],
                     p[r+4], p[r+5], p[r+7], p[r+9],  p[r+7], p[r+5], p[r+4], p[r+2]],
                    [p[r+4], p[r+2], p[r+4], p[r+5],  p[r+7], p[r+5], p[r+4], p[r+2],
                     p[r+4], p[r+5], p[r+7], p[r+9],  p[r+7], p[r+5], p[r+4], p[r+2]],
                ]
            },
            retroGroove: {
                1: [
                    [p[r+4], p[r+4], p[r+2], p[r+2],  p[r+4], p[r+4], p[r+7], p[r+7],
                     p[r+5], p[r+5], p[r+4], p[r+4],  p[r+2], p[r+2], p[r+0], p[r+0]],
                    [p[r+7], p[r+7], p[r+9], p[r+9],  p[r+7], p[r+7], p[r+5], p[r+5],
                     p[r+4], p[r+4], p[r+5], p[r+5],  p[r+7], p[r+7], p[r+5], p[r+5]],
                    [p[r+4], p[r+4], p[r+2], p[r+2],  p[r+0], p[r+0], p[r+2], p[r+2],
                     p[r+4], p[r+4], p[r+5], p[r+5],  p[r+7], p[r+7], p[r+5], p[r+5]],
                ],
                2: [
                    [p[r+4], p[r+6], p[r+4], p[r+6],  p[r+7], p[r+6], p[r+4], p[r+2],
                     p[r+4], p[r+6], p[r+4], p[r+6],  p[r+7], p[r+9], p[r+7], p[r+6]],
                    [p[r+7], p[r+9], p[r+7], p[r+9],  p[r+11], p[r+9], p[r+7], p[r+6],
                     p[r+7], p[r+6], p[r+4], p[r+2],  p[r+4], p[r+6], p[r+7], p[r+6]],
                    [p[r+4], p[r+4], p[r+2], p[r+2],  p[r+4], p[r+4], p[r+5], p[r+5],
                     p[r+7], p[r+7], p[r+5], p[r+5],  p[r+4], p[r+4], p[r+2], p[r+2]],
                ],
                3: [
                    [p[r+4], p[r+7], p[r+4], p[r+7],  p[r+5], p[r+4], p[r+5], p[r+7],
                     p[r+4], p[r+7], p[r+4], p[r+7],  p[r+9], p[r+7], p[r+5], p[r+4]],
                    [p[r+7], p[r+9], p[r+7], p[r+9],  p[r+11], p[r+9], p[r+7], p[r+6],
                     p[r+5], p[r+4], p[r+5], p[r+7],  p[r+4], p[r+5], p[r+7], p[r+9]],
                    [p[r+4], p[r+5], p[r+4], p[r+2],  p[r+4], p[r+5], p[r+7], p[r+9],
                     p[r+7], p[r+5], p[r+4], p[r+2],  p[r+4], p[r+2], p[r+0], p[r+2]],
                ]
            },
            voidReach: {
                1: [
                    [p[r+4], p[r+4], p[r+4], p[r+4],  p[r+4], p[r+4], p[r+4], p[r+4],
                     p[r+2], p[r+2], p[r+2], p[r+2],  p[r+4], p[r+4], p[r+4], p[r+4]],
                    [p[r+7], p[r+7], p[r+7], p[r+7],  p[r+5], p[r+5], p[r+5], p[r+5],
                     p[r+4], p[r+4], p[r+4], p[r+4],  p[r+2], p[r+2], p[r+2], p[r+2]],
                    [p[r+0], p[r+0], p[r+0], p[r+0],  p[r+2], p[r+2], p[r+2], p[r+2],
                     p[r+4], p[r+4], p[r+4], p[r+4],  p[r+5], p[r+5], p[r+5], p[r+5]],
                ],
                2: [
                    [p[r+4], p[r+4], p[r+6], p[r+6],  p[r+7], p[r+7], p[r+6], p[r+6],
                     p[r+4], p[r+4], p[r+6], p[r+6],  p[r+7], p[r+7], p[r+9], p[r+9]],
                    [p[r+7], p[r+7], p[r+9], p[r+9],  p[r+7], p[r+7], p[r+6], p[r+6],
                     p[r+5], p[r+5], p[r+4], p[r+4],  p[r+2], p[r+2], p[r+0], p[r+0]],
                    [p[r+4], p[r+4], p[r+2], p[r+2],  p[r+0], p[r+0], p[r+2], p[r+2],
                     p[r+4], p[r+4], p[r+5], p[r+5],  p[r+7], p[r+7], p[r+5], p[r+5]],
                ],
                3: [
                    [p[r+4], p[r+4], p[r+6], p[r+6],  p[r+7], p[r+7], p[r+9], p[r+9],
                     p[r+7], p[r+7], p[r+6], p[r+6],  p[r+4], p[r+4], p[r+2], p[r+2]],
                    [p[r+7], p[r+7], p[r+9], p[r+9],  p[r+11], p[r+11], p[r+9], p[r+9],
                     p[r+7], p[r+7], p[r+6], p[r+6],  p[r+4], p[r+4], p[r+2], p[r+2]],
                    [p[r+4], p[r+4], p[r+5], p[r+5],  p[r+7], p[r+7], p[r+9], p[r+9],
                     p[r+7], p[r+7], p[r+5], p[r+5],  p[r+4], p[r+4], p[r+2], p[r+2]],
                ]
            },
            neonFury: {
                1: [
                    [p[r+4], p[r+4], p[r+7], p[r+7],  p[r+5], p[r+5], p[r+4], p[r+4],
                     p[r+2], p[r+2], p[r+4], p[r+4],  p[r+7], p[r+7], p[r+5], p[r+4]],
                    [p[r+7], p[r+9], p[r+7], p[r+5],  p[r+7], p[r+9], p[r+11], p[r+9],
                     p[r+7], p[r+5], p[r+4], p[r+2],  p[r+4], p[r+5], p[r+7], p[r+5]],
                    [p[r+4], p[r+2], p[r+0], p[r+2],  p[r+4], p[r+2], p[r+4], p[r+5],
                     p[r+7], p[r+5], p[r+4], p[r+2],  p[r+0], p[r+2], p[r+4], p[r+2]],
                ],
                2: [
                    [p[r+4], p[r+7], p[r+8], p[r+7],  p[r+4], p[r+7], p[r+8], p[r+7],
                     p[r+5], p[r+8], p[r+7], p[r+5],  p[r+4], p[r+2], p[r+4], p[r+2]],
                    [p[r+7], p[r+9], p[r+11], p[r+9],  p[r+7], p[r+9], p[r+7], p[r+5],
                     p[r+7], p[r+9], p[r+7], p[r+5],  p[r+4], p[r+5], p[r+7], p[r+5]],
                    [p[r+4], p[r+5], p[r+7], p[r+5],  p[r+4], p[r+2], p[r+4], p[r+5],
                     p[r+4], p[r+2], p[r+0], p[r+2],  p[r+4], p[r+5], p[r+7], p[r+5]],
                ],
                3: [
                    [p[r+4], p[r+7], p[r+9], p[r+7],  p[r+5], p[r+4], p[r+5], p[r+7],
                     p[r+4], p[r+7], p[r+9], p[r+7],  p[r+8], p[r+7], p[r+5], p[r+4]],
                    [p[r+7], p[r+9], p[r+11], p[r+9],  p[r+7], p[r+6], p[r+5], p[r+7],
                     p[r+4], p[r+5], p[r+7], p[r+9],  p[r+7], p[r+5], p[r+4], p[r+2]],
                    [p[r+4], p[r+5], p[r+4], p[r+2],  p[r+4], p[r+5], p[r+7], p[r+9],
                     p[r+7], p[r+5], p[r+4], p[r+2],  p[r+4], p[r+2], p[r+0], p[r+2]],
                ]
            }
        };
        const styleMelodies = melodies[musicStyle] || melodies.default;
        const styleInt = styleMelodies[intensity] || styleMelodies[1] || styleMelodies[Object.keys(styleMelodies)[0]];
        melodyPhrases[musicStyle][sk][key] = styleInt[section % 3];
    }
    return melodyPhrases[musicStyle][sk][key];
}

function scheduleBassNote(note, time, duration, gain = 0.5) {
    if (!audioCtx || musicVolume() <= 0) return;
    if (!Number.isFinite(note) || !Number.isFinite(gain) || gain <= 0) return;
    time = Math.max(0, time);
    const vol = musicVolume() * AUDIO_CONFIG.mixGain * gain;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(midiToFreq(note), time);
    const o2 = audioCtx.createOscillator();
    const g2 = audioCtx.createGain();
    o2.type = 'triangle';
    o2.frequency.setValueAtTime(midiToFreq(note - 12), time);
    g2.gain.setValueAtTime(0, time);
    g2.gain.linearRampToValueAtTime(Math.min(0.15, vol * 0.35), time + 0.035);
    g2.gain.setValueAtTime(Math.min(0.15, vol * 0.35), time + duration - 0.03);
    g2.gain.linearRampToValueAtTime(0.0001, time + duration);
    g.gain.setValueAtTime(0, time);
    g.gain.linearRampToValueAtTime(Math.min(0.3, vol * 0.5), time + 0.035);
    g.gain.setValueAtTime(Math.min(0.3, vol * 0.5), time + duration - 0.03);
    g.gain.linearRampToValueAtTime(0.0001, time + duration);
    if (musicIntensity >= 3) {
        const o5 = audioCtx.createOscillator();
        const g5 = audioCtx.createGain();
        o5.type = 'sine';
        o5.frequency.setValueAtTime(midiToFreq(note + 7), time);
        g5.gain.setValueAtTime(0, time);
        g5.gain.linearRampToValueAtTime(Math.min(0.08, vol * 0.2), time + 0.035);
        g5.gain.linearRampToValueAtTime(0.0001, time + duration - 0.02);
        o5.connect(g5).connect(musicMasterGain);
        o5.start(time); o5.stop(time + duration + 0.05);
    }
    o.connect(g).connect(musicMasterGain);
    o2.connect(g2).connect(musicMasterGain);
    o.start(time); o.stop(time + duration + 0.05);
    o2.start(time); o2.stop(time + duration + 0.05);
}

function scheduleMelodyNote(note, time, duration, gain = 0.4, harmonyInterval = 0) {
    if (!audioCtx || musicVolume() <= 0) return;
    if (!Number.isFinite(note) || !Number.isFinite(gain) || gain <= 0) return;
    time = Math.max(0, time);
    const vol = musicVolume() * AUDIO_CONFIG.mixGain * gain;
    if (harmonyInterval !== 0) {
        const ho = audioCtx.createOscillator();
        const hg = audioCtx.createGain();
        ho.type = 'triangle';
        ho.frequency.setValueAtTime(midiToFreq(note + harmonyInterval), time);
        hg.gain.setValueAtTime(0, time);
        hg.gain.linearRampToValueAtTime(Math.min(0.12, vol * 0.4), time + 0.006);
        hg.gain.exponentialRampToValueAtTime(0.0001, time + duration);
        ho.connect(hg).connect(musicMasterGain);
        ho.start(time); ho.stop(time + duration + 0.05);
    }
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    const styleChar = (MUSIC_STYLES[musicStyle] || {}).char;
    if (styleChar === 'synth') {
        o.type = 'sawtooth';
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(3000, time);
        filter.frequency.linearRampToValueAtTime(800, time + duration * 0.5);
        filter.frequency.linearRampToValueAtTime(1500, time + duration);
        o.frequency.setValueAtTime(midiToFreq(note), time);
        g.gain.setValueAtTime(0, time);
        g.gain.linearRampToValueAtTime(Math.min(0.25, vol * 0.7), time + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, time + duration);
        o.connect(g).connect(filter).connect(musicMasterGain);
    } else if (styleChar === 'metal') {
        o.type = 'square';
        o.frequency.setValueAtTime(midiToFreq(note), time);
        g.gain.setValueAtTime(0, time);
        g.gain.linearRampToValueAtTime(Math.min(0.35, vol), time + 0.003);
        g.gain.exponentialRampToValueAtTime(0.0001, time + duration);
        const po = audioCtx.createOscillator();
        const pg = audioCtx.createGain();
        po.type = 'square';
        po.frequency.setValueAtTime(midiToFreq(note + 7), time);
        pg.gain.setValueAtTime(0, time);
        pg.gain.linearRampToValueAtTime(Math.min(0.2, vol * 0.55), time + 0.003);
        pg.gain.exponentialRampToValueAtTime(0.0001, time + duration);
        const clipper = audioCtx.createWaveShaper();
        const curve = new Float32Array(256);
        for (let i = 0; i < 256; i++) { const x = (i / 256) * 2 - 1; curve[i] = Math.max(-0.6, Math.min(0.6, x * 1.8)); }
        clipper.curve = curve;
        o.connect(g).connect(clipper).connect(musicMasterGain);
        po.connect(pg).connect(clipper);
    } else if (styleChar === 'funk') {
        o.type = 'triangle';
        o.frequency.setValueAtTime(midiToFreq(note), time);
        g.gain.setValueAtTime(0, time);
        g.gain.linearRampToValueAtTime(Math.min(0.28, vol), time + 0.015);
        g.gain.exponentialRampToValueAtTime(0.0001, time + duration);
        o.connect(g).connect(musicMasterGain);
    } else if (styleChar === 'ambient') {
        const o1 = audioCtx.createOscillator();
        const o2 = audioCtx.createOscillator();
        const g1 = audioCtx.createGain();
        const g2 = audioCtx.createGain();
        o1.type = 'sine'; o1.frequency.setValueAtTime(midiToFreq(note), time);
        o2.type = 'triangle'; o2.frequency.setValueAtTime(midiToFreq(note - 12), time);
        g1.gain.setValueAtTime(0, time); g1.gain.linearRampToValueAtTime(Math.min(0.15, vol * 0.5), time + 0.02); g1.gain.exponentialRampToValueAtTime(0.0001, time + duration);
        g2.gain.setValueAtTime(0, time); g2.gain.linearRampToValueAtTime(Math.min(0.1, vol * 0.3), time + 0.02); g2.gain.exponentialRampToValueAtTime(0.0001, time + duration);
        o1.connect(g1).connect(musicMasterGain); o2.connect(g2).connect(musicMasterGain);
        o1.start(time); o1.stop(time + duration + 0.05); o2.start(time); o2.stop(time + duration + 0.05);
    } else if (styleChar === 'baroque') {
        const pw = NES_PULSE_NARROW || null;
        if (pw) o.setPeriodicWave(pw);
        else o.type = 'square';
        o.frequency.setValueAtTime(midiToFreq(note), time);
        g.gain.setValueAtTime(0, time);
        g.gain.linearRampToValueAtTime(Math.min(0.3, vol), time + 0.004);
        g.gain.exponentialRampToValueAtTime(0.0001, time + duration);
        o.connect(g).connect(musicMasterGain);
    } else {
        const pw = (musicIntensity >= 3 && NES_PULSE_NARROW) ? NES_PULSE_NARROW : (NES_PULSE_WIDE || null);
        if (pw) o.setPeriodicWave(pw);
        else o.type = 'square';
        o.frequency.setValueAtTime(midiToFreq(note), time);
        g.gain.setValueAtTime(0, time);
        g.gain.linearRampToValueAtTime(Math.min(0.3, vol), time + 0.005);
        g.gain.exponentialRampToValueAtTime(0.0001, time + duration);
        const clipper = audioCtx.createWaveShaper();
        const curve = new Float32Array(256);
        for (let i = 0; i < 256; i++) { const x = (i / 256) * 2 - 1; curve[i] = Math.max(-0.8, Math.min(0.8, x * 1.4)); }
        clipper.curve = curve;
        o.connect(g).connect(clipper).connect(musicMasterGain);
    }
    o.start(time); o.stop(time + duration + 0.05);
}

function scheduleGlitchNote(note, time, duration, gain = 0.2) {
    if (!audioCtx || musicVolume() <= 0) return;
    if (!Number.isFinite(note) || !Number.isFinite(gain) || gain <= 0) return;
    time = Math.max(0, time);
    const vol = musicVolume() * AUDIO_CONFIG.mixGain * gain;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(midiToFreq(note), time);
    const sweepRate = 4 + Math.random() * 6;
    o.frequency.linearRampToValueAtTime(midiToFreq(note) * 0.3, time + duration);
    g.gain.setValueAtTime(0, time);
    g.gain.linearRampToValueAtTime(Math.min(0.2, vol * 0.6), time + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, time + duration * 0.6);
    const bp = audioCtx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 2000 + Math.random() * 3000;
    bp.Q.value = 3 + Math.random() * 4;
    const sweep = audioCtx.createOscillator();
    sweep.type = 'sine';
    sweep.frequency.value = 0.2 + Math.random() * 0.3;
    const sweepGain = audioCtx.createGain();
    sweepGain.gain.value = 1500 + Math.random() * 2000;
    sweep.connect(sweepGain);
    sweepGain.connect(bp.frequency);
    sweep.start();
    o.connect(g).connect(bp).connect(musicMasterGain);
    o.start(time); o.stop(time + duration + 0.05);
}

function schedulePluckedString(note, time, duration, gain = 0.15) {
    if (!audioCtx || musicVolume() <= 0) return;
    if (!Number.isFinite(note) || !Number.isFinite(gain) || gain <= 0) return;
    time = Math.max(0, time);
    const vol = musicVolume() * AUDIO_CONFIG.mixGain * gain;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(midiToFreq(note), time);
    const o2 = audioCtx.createOscillator();
    const g2 = audioCtx.createGain();
    o2.type = 'sine';
    o2.frequency.setValueAtTime(midiToFreq(note) * 2, time);
    g2.gain.setValueAtTime(0, time);
    g2.gain.linearRampToValueAtTime(Math.min(0.1, vol * 0.3), time + 0.003);
    g2.gain.exponentialRampToValueAtTime(0.0001, time + Math.min(duration, 0.12));
    g.gain.setValueAtTime(0, time);
    g.gain.linearRampToValueAtTime(Math.min(0.2, vol), time + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, time + Math.min(duration, 0.15));
    o.connect(g).connect(musicMasterGain);
    o2.connect(g2).connect(musicMasterGain);
    o.start(time); o.stop(time + 0.2);
    o2.start(time); o2.stop(time + 0.15);
}

function scheduleMelodicPerc(time, gain = 0.12) {
    if (!audioCtx || musicVolume() <= 0) return;
    time = Math.max(0, time);
    const vol = musicVolume() * AUDIO_CONFIG.mixGain * gain;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(400, time);
    o.frequency.exponentialRampToValueAtTime(80, time + 0.06);
    g.gain.setValueAtTime(0, time);
    g.gain.linearRampToValueAtTime(Math.min(0.15, vol), time + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, time + 0.12);
    o.connect(g).connect(musicMasterGain);
    o.start(time); o.stop(time + 0.15);
}

function schedulePadDouble(time, gain = 0.12) {
    if (!audioCtx || musicVolume() <= 0) return;
    time = Math.max(0, time);
    const vol = musicVolume() * AUDIO_CONFIG.mixGain * gain;
    const base = MUSIC_CONFIG.notePool[2];
    const fifth = base + 7;
    const oct = base + 12;
    for (const r of [base, fifth, oct]) {
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.type = 'sine';
        o.frequency.value = midiToFreq(r);
        g.gain.setValueAtTime(0, time);
        g.gain.linearRampToValueAtTime(Math.min(0.12, vol * 0.4), time + 0.4);
        o.connect(g).connect(musicMasterGain);
        g.connect(musicDelay);
        o.start(time);
        musicPadOscillators.push({ o, g });
    }
}

function getEffectiveBpm() {
    const s = MUSIC_STYLES[musicStyle];
    return (s && s.bpm) ? s.bpm : MUSIC_CONFIG.bpm;
}

function stopPadNotes() {
    for (const entry of musicPadOscillators) {
        try { entry.o.stop(); } catch (_) {}
        try { entry.g.disconnect(); } catch (_) {}
    }
    musicPadOscillators = [];
}

function stopChorusLFO() {
    if (musicChorusLFO) {
        try { musicChorusLFO.stop(); } catch (_) {}
        try { musicChorusGain.disconnect(); } catch (_) {}
        musicChorusLFO = null;
        musicChorusGain = null;
    }
}

function musicVolume() {
    return audioVolumes.music !== undefined ? audioVolumes.music : AUDIO_CONFIG.music;
}

function scheduleMusicNode(type, note, startTime, duration, gain) {
    if (!audioCtx || musicVolume() <= 0 || musicPaused) return null;
    startTime = Math.max(0, startTime);
    const vol = musicVolume() * AUDIO_CONFIG.mixGain * gain;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(midiToFreq(note), startTime);
    g.gain.setValueAtTime(0, startTime);
    g.gain.linearRampToValueAtTime(Math.min(0.5, vol), startTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    o.connect(g).connect(audioCtx.destination);
    o.start(startTime);
    o.stop(startTime + duration + 0.05);
    return o;
}

function buildMusicPattern(intensity, barIndex) {
    const beatMs = 60000 / MUSIC_CONFIG.bpm;
    const beatSec = beatMs / 1000;
    const pool = MUSIC_CONFIG.notePool;
    const rootIdx = intensity >= 3 ? 4 : 2;
    const section = Math.floor(barIndex / 8) % 3;
    const isBreakdown = section === 2;
    const isMelodySection = section === 0;
    const walkingBass = buildWalkingBass(intensity, barIndex);
    const drumIdx = pickDrumPattern(barIndex, isBreakdown);
    const dp = DRUM_PATTERNS[drumIdx] || DRUM_PATTERNS[0];

    function humanizeMs(beat) {
        return (Math.random() - 0.5) * HUMANIZE.jitter * 1000;
    }

    function swingMs(beat) {
        return (beat % 2 === 1) ? HUMANIZE.swing * 1000 : 0;
    }

    const h = (beat) => swingMs(beat) + humanizeMs(beat);

    const bassForBeat = (beat) => {
        let acc = 0;
        for (let di = 0; di < walkingBass.durations.length; di++) {
            const end = acc + walkingBass.durations[di];
            if (beat >= acc && beat < end) {
                const note = walkingBass.notes[di];
                if (!Number.isFinite(note)) return null;
                if (isBreakdown && beat > 8) return null;
                const dur = Math.min(beatSec * walkingBass.durations[di], beatSec * 0.95);
                return { note, gain: 0.45 + Math.random() * 0.08, dur, humanMs: humanizeMs(beat) };
            }
            acc = end;
        }
        return null;
    };

    function beatInPattern(beat) {
        for (const b of dp.kicks) { if (b === beat) return { type: 'kick', gain: 0.4 + Math.random() * 0.12, humanMs: h(beat) }; }
        for (const b of dp.snares) { if (b === beat) return { type: 'snare', gain: 0.3 + Math.random() * 0.1, humanMs: h(beat) }; }
        if (dp.hatEach > 0 && beat % dp.hatEach === 0) return { type: 'hat', gain: 0.1 + Math.random() * 0.06, humanMs: h(beat) };
        return null;
    }

    const contraChord = getChordRoot(intensity, barIndex);

    const patterns = {
        1: {
            drums: ({ beat }) => {
                if (beat === 15) return null;
                if (isBreakdown) {
                    if (beat % 4 === 0) return { type: 'kick', gain: 0.35, humanMs: h(beat) };
                    if (beat % 4 === 2) return { type: 'hat', gain: 0.1, humanMs: h(beat) };
                    return null;
                }
                if (dp.snares.length === 0 && beat % 8 === 4) return { type: 'snare', gain: 0.2, humanMs: h(beat) };
                return beatInPattern(beat);
            },
            bass: bassForBeat,
            melody: ({ beat }) => {
                if (isBreakdown) return null;
                if (beat % 8 !== 0) return null;
                return { note: pool[rootIdx + 4], gain: accentGain(beat, 0.3) + Math.random() * 0.05, dur: beatSec * 1.8, humanMs: humanizeMs(beat) };
            },
            glitch: () => null,
            pad: () => null,
            string: ({ beat }) => {
                if (section === 1 && beat % 3 === 2) return { note: pool[rootIdx + 4], gain: 0.12, dur: 0.15 };
                return null;
            },
            percussion: () => null,
            contra: ({ beat }) => {
                if (!isMelodySection) return null;
                if (beat % 4 !== 1) return null;
                const arp = [pool[rootIdx + contraChord.rootOff], pool[rootIdx + contraChord.rootOff + 2], pool[rootIdx + contraChord.rootOff + (contraChord.qual === 1 ? 4 : 3)], pool[rootIdx + contraChord.rootOff + 7]];
                return { note: arp[Math.floor(beat / 4) % 4], gain: 0.15, dur: beatSec * 0.35, harmony: 3 };
            },
            fill: ({ beat }) => (barIndex % 8 === 7 && (beat === 14 || beat === 15) && !isBreakdown) ? { fill: true } : null
        },
        2: {
            drums: ({ beat }) => {
                if (isBreakdown) {
                    if (beat % 2 === 0) return { type: 'kick', gain: 0.4, humanMs: h(beat) };
                    if (beat % 4 === 1) return { type: 'snare', gain: 0.2, humanMs: h(beat) };
                    return null;
                }
                return beatInPattern(beat);
            },
            bass: bassForBeat,
            melody: ({ beat }) => {
                if (isBreakdown) return null;
                if (beat % 4 !== 0) return null;
                return { note: pool[rootIdx + 3 + (Math.floor(barIndex / 8) % 3)], gain: accentGain(beat, 0.35) + Math.random() * 0.05, dur: beatSec * 1.5, humanMs: humanizeMs(beat) };
            },
            glitch: ({ beat }) => {
                if (isBreakdown) return null;
                if (beat % 12 !== 0) return null;
                return { note: pool[(beat + Math.floor(beat / 12)) % pool.length], gain: 0.18 + Math.random() * 0.06, dur: beatSec * 0.4, humanMs: humanizeMs(beat) };
            },
            pad: ({ beat }) => (beat === 0 && !isBreakdown) ? { gain: 0.12 } : null,
            string: ({ beat }) => {
                if (section === 1 && (beat === 1 || beat === 9)) return { note: pool[rootIdx + 4], gain: 0.14, dur: 0.15 };
                return null;
            },
            percussion: ({ beat }) => {
                if (section === 0 && (beat === 5 || beat === 13)) return { gain: 0.1 };
                return null;
            },
            contra: ({ beat }) => {
                if (section !== 1) return null;
                if (beat % 2 !== 1) return null;
                const arp = [pool[rootIdx + contraChord.rootOff], pool[rootIdx + contraChord.rootOff + 2], pool[rootIdx + contraChord.rootOff + (contraChord.qual === 1 ? 4 : 3)], pool[rootIdx + contraChord.rootOff + 7]];
                return { note: arp[Math.floor(beat / 2) % 4], gain: 0.18, dur: beatSec * 0.3, harmony: 4 };
            },
            fill: ({ beat }) => (barIndex % 8 === 7 && (beat === 14 || beat === 15) && !isBreakdown) ? { fill: true } : null
        },
        3: {
            drums: ({ beat }) => {
                if (isBreakdown) {
                    if (beat % 2 === 0) return { type: 'kick', gain: 0.45, humanMs: h(beat) };
                    if (beat % 4 === 3) return { type: 'snare', gain: 0.3, humanMs: h(beat) };
                    return null;
                }
                if (beat === 15) return null;
                const d = beatInPattern(beat);
                if (d && d.type === 'kick') d.gain *= 1.15;
                return d;
            },
            bass: bassForBeat,
            melody: ({ beat }) => {
                if (isBreakdown) return null;
                if (beat % 2 !== 0) return null;
                return { note: pool[rootIdx + 4 + (Math.floor(beat / 2) % 4)], gain: accentGain(beat, 0.4) + Math.random() * 0.06, dur: beatSec * 0.8, humanMs: humanizeMs(beat) };
            },
            glitch: ({ beat }) => {
                if (isBreakdown) return null;
                if (beat % 6 !== 0) return null;
                return { note: pool[(beat + Math.floor(beat / 6) * 3) % pool.length], gain: 0.22 + Math.random() * 0.08, dur: beatSec * 0.25, humanMs: humanizeMs(beat) };
            },
            pad: ({ beat }) => (beat === 0) ? { gain: 0.14 } : null,
            string: ({ beat }) => {
                if (beat % 3 === 2) return { note: pool[rootIdx + 4 + (Math.floor(beat / 3) % 3)], gain: 0.16, dur: 0.12 };
                return null;
            },
            percussion: ({ beat }) => {
                if (beat % 8 === 5 || beat % 8 === 13) return { gain: 0.12 };
                return null;
            },
            contra: ({ beat }) => {
                if (beat % 2 !== 1) return null;
                const arp = [pool[rootIdx + contraChord.rootOff], pool[rootIdx + contraChord.rootOff + 2], pool[rootIdx + contraChord.rootOff + (contraChord.qual === 1 ? 4 : 3)], pool[rootIdx + contraChord.rootOff + 7]];
                return { note: arp[Math.floor(beat / 2) % 4], gain: 0.2, dur: beatSec * 0.3, harmony: 3 };
            },
            fill: ({ beat }) => (barIndex % 8 === 7 && (beat === 14 || beat === 15) && section !== 2) ? { fill: true } : null
        }
    };
    return patterns[intensity] || patterns[1];
}

function scheduleMusicBar(pattern, barStart, beatSec) {
    if (!audioCtx || musicPaused) return;
    const beats = 16;
    const melodyPhrase = buildMelodyPhrase(musicIntensity || 1, musicBarIndex);
    if (!melodyPhrase || melodyPhrase.length === 0) return;
    const section = Math.floor(musicBarIndex / 8) % 3;
    let padScheduled = false;
    let fillScheduled = false;
    for (let b = 0; b < beats; b++) {
        const beat = { beat: b, total: beats };
        const t = Math.max(0.01, barStart + b * beatSec);
        const drum = pattern.drums(beat);
        if (drum && drum.type === 'kick') {
            scheduleDrumKick(t, drum.gain, drum.humanMs || 0);
            if (musicIntensity >= 3) {
                const sub = audioCtx.createOscillator();
                const sg = audioCtx.createGain();
                sub.type = 'sine';
                sub.frequency.value = 30;
                sg.gain.setValueAtTime(0.06, t);
                sg.gain.linearRampToValueAtTime(0.0001, t + 0.1);
                sub.connect(sg).connect(musicMasterGain);
                sub.start(t); sub.stop(t + 0.15);
            }
        }
        else if (drum && drum.type === 'snare') scheduleDrumSnare(t, drum.gain, drum.humanMs || 0);
        else if (drum && drum.type === 'hat') scheduleDrumHat(t, drum.gain, drum.humanMs || 0);
        const bass = pattern.bass(beat);
        if (bass && Number.isFinite(bass.note)) scheduleBassNote(bass.note, Math.max(0, t + (bass.humanMs || 0) / 1000), bass.dur, bass.gain);
        const mel = pattern.melody(beat);
        if (mel) { const melNote = melodyPhrase[Math.floor(b * melodyPhrase.length / beats) % melodyPhrase.length]; if (Number.isFinite(melNote)) scheduleMelodyNote(melNote, Math.max(0, t + (mel.humanMs || 0) / 1000), mel.dur, mel.gain); }
        const contra = pattern.contra ? pattern.contra(beat) : null;
        if (contra && Number.isFinite(contra.note)) scheduleMelodyNote(contra.note, Math.max(0, t + (contra.humanMs || 0) / 1000), contra.dur, contra.gain, contra.harmony || 0);
        const gl = pattern.glitch(beat);
        if (gl && Number.isFinite(gl.note)) scheduleGlitchNote(gl.note, Math.max(0, t + (gl.humanMs || 0) / 1000), gl.dur, gl.gain);
        const str = pattern.string ? pattern.string(beat) : null;
        if (str && Number.isFinite(str.note)) schedulePluckedString(str.note, Math.max(0, t + (str.humanMs || 0) / 1000), str.dur, str.gain);
        const perc = pattern.percussion ? pattern.percussion(beat) : null;
        if (perc) scheduleMelodicPerc(t, perc.gain);
        if (!padScheduled && pattern.pad && pattern.pad(beat)) {
            schedulePadDouble(t, pattern.pad(beat).gain);
            padScheduled = true;
        }
        const fill = pattern.fill ? pattern.fill(beat) : null;
        if (fill && fill.fill && !fillScheduled) {
            scheduleDrumFill(t, beatSec);
            fillScheduled = true;
        }
    }
    if (musicIntensity >= 3 && musicBarIndex > 0 && musicBarIndex % 8 === 0) {
        scheduleDrumCrash(Math.max(0.01, barStart));
    }
}

function startMusic() {
    if (!audioCtx || musicVolume() <= 0) return;
    initMusicBus();
    stopMusic();
    musicPaused = false;
    musicNextBar = audioCtx.currentTime;
    musicBarIndex = 0;
}

function tickMusic() {
    if (musicPaused || !audioCtx || musicVolume() <= 0 || !musicMasterGain) return;
    const now = audioCtx.currentTime;
    if (now < musicNextBar) return;
    const bpm = getEffectiveBpm();
    const beatSec = 60000 / bpm / 1000;
    const pattern = buildMusicPattern(musicIntensity || 1, musicBarIndex);
    scheduleMusicBar(pattern, musicNextBar, beatSec);
    musicNextBar += beatSec * 16;
    musicBarIndex++;
}

function stopMusic() {
    musicPaused = true;
    musicNextBar = 0;
    musicBarIndex = 0;
    musicEffects = { lowpass: null, bitcrush: null, stutterTimer: null };
    stopPadNotes();
}

function setMusicIntensity(level) {
    const clamped = Math.max(1, Math.min(3, level || 1));
    if (clamped === musicIntensity) return;
    musicIntensity = clamped;
}

function musicCriticalHitLP() {
    if (!audioCtx || musicVolume() <= 0) return;
    try {
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 2000;
        filter.frequency.linearRampToValueAtTime(200, audioCtx.currentTime + 0.05);
        filter.frequency.linearRampToValueAtTime(20000, audioCtx.currentTime + (MUSIC_CONFIG.criticalLpSeconds || 0.9));
        musicEffects.lowpass = filter;
        const noise = audioCtx.createBufferSource();
        const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.08, audioCtx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (audioCtx.sampleRate * 0.006));
        noise.buffer = buf;
        const ng = audioCtx.createGain();
        ng.gain.setValueAtTime(0.04, audioCtx.currentTime);
        ng.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.08);
        const nf = audioCtx.createBiquadFilter();
        nf.type = 'highpass';
        nf.frequency.value = 4000;
        noise.connect(ng).connect(nf).connect(musicMasterGain);
        noise.start(audioCtx.currentTime);
    } catch (_) {}
}

function musicPitchDrop() {
    if (!audioCtx || musicVolume() <= 0) return;
    stopPadNotes();
    const vol = musicVolume() * AUDIO_CONFIG.mixGain;
    if (musicMasterGain) {
        musicMasterGain.gain.setValueAtTime(0.85, audioCtx.currentTime);
        musicMasterGain.gain.linearRampToValueAtTime(0.0001, audioCtx.currentTime + 0.5);
    }
    const dur = MUSIC_CONFIG.pitchDropSeconds || 0.6;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(110, audioCtx.currentTime);
    o.frequency.exponentialRampToValueAtTime(25, audioCtx.currentTime + dur);
    g.gain.setValueAtTime(Math.min(0.15, vol * 0.25), audioCtx.currentTime);
    g.gain.linearRampToValueAtTime(0.0001, audioCtx.currentTime + dur + 0.3);
    const noise = audioCtx.createBufferSource();
    const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.5, audioCtx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (audioCtx.sampleRate * 0.04));
    noise.buffer = buf;
    const ng = audioCtx.createGain();
    ng.gain.setValueAtTime(0, audioCtx.currentTime);
    ng.gain.linearRampToValueAtTime(Math.min(0.08, vol * 0.15), audioCtx.currentTime + 0.2);
    ng.gain.linearRampToValueAtTime(0.0001, audioCtx.currentTime + 0.5);
    const nf = audioCtx.createBiquadFilter();
    nf.type = 'lowpass';
    nf.frequency.value = 800;
    nf.Q.value = 1;
    o.connect(g).connect(musicMasterGain);
    noise.connect(ng).connect(nf).connect(musicMasterGain);
    o.start(); o.stop(audioCtx.currentTime + dur + 0.4);
    noise.start(audioCtx.currentTime); noise.stop(audioCtx.currentTime + 0.55);
}

function musicStutter(durationMs = 60) {
    if (!audioCtx || musicVolume() <= 0) return;
    const chopMs = Math.max(MUSIC_CONFIG.stutterMs.min, Math.min(MUSIC_CONFIG.stutterMs.max, durationMs));
    const chops = Math.max(2, Math.floor(30 / chopMs));
    const vol = musicVolume() * AUDIO_CONFIG.mixGain;
    for (let i = 0; i < chops; i++) {
        const t = audioCtx.currentTime + (i * chopMs) / 1000;
        const dur = chopMs / 1000 * 0.7;
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.type = 'triangle';
        o.frequency.setValueAtTime(80 - i * 5, t);
        o.frequency.linearRampToValueAtTime(40, t + dur);
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(Math.min(0.12, vol * 0.2), t + 0.005);
        g.gain.linearRampToValueAtTime(0.0001, t + dur);
        o.connect(g).connect(musicMasterGain);
        o.start(t); o.stop(t + dur + 0.01);
    }
    if (musicMasterGain) {
        musicMasterGain.gain.setValueAtTime(0.85, audioCtx.currentTime);
        musicMasterGain.gain.linearRampToValueAtTime(0.55, audioCtx.currentTime + 0.015);
        musicMasterGain.gain.linearRampToValueAtTime(0.85, audioCtx.currentTime + 0.12);
    }
}

function playTone(profile, channel = 'combat', delaySeconds = 0) {
    const volume = audioVolumes[channel];
    if (!(volume > 0)) return;
    initAudio();
    if (!audioCtx) return;
    if (audioDiagnostics.activeGraphs >= AUDIO_CONFIG.maxVoices) {
        audioDiagnostics.droppedVoices++;
        return;
    }

    const o = audioCtx.createOscillator();
    o.type = profile.wave;
    o.frequency.value = profile.start;

    const g = audioCtx.createGain();
    const start = audioCtx.currentTime + delaySeconds;
    const end = start + profile.duration / 1000;
    const peak = profile.gain * volume * AUDIO_CONFIG.mixGain;
    g.gain.setValueAtTime(AUDIO_CONFIG.floorGain, start);
    g.gain.linearRampToValueAtTime(peak, start + AUDIO_CONFIG.attackSeconds);
    g.gain.exponentialRampToValueAtTime(AUDIO_CONFIG.floorGain, end);
    o.frequency.setValueAtTime(profile.start, start);
    o.frequency.exponentialRampToValueAtTime(Math.max(1, profile.end), end);

    o.connect(g).connect(audioCtx.destination);
    audioDiagnostics.createdGraphs++;
    audioDiagnostics.activeGraphs++;
    audioDiagnostics.oscillatorsCreated++;
    audioDiagnostics.gainsCreated++;

    let cleaned = false;
    const cleanup = () => {
        if (cleaned) return;
        cleaned = true;
        o.onended = null;
        if (typeof o.disconnect === 'function') {
            o.disconnect();
            audioDiagnostics.oscillatorsDisconnected++;
        }
        if (typeof g.disconnect === 'function') {
            g.disconnect();
            audioDiagnostics.gainsDisconnected++;
        }
        audioDiagnostics.endedGraphs++;
        audioDiagnostics.activeGraphs = Math.max(0, audioDiagnostics.activeGraphs - 1);
    };
    o.onended = cleanup;
    o.start(start);
    o.stop(end + 0.01);
}

function playAttackSound(type) {
    const profile = ATTACK_SOUND_PROFILES[type] || ATTACK_SOUND_PROFILES.punch;
    playTone(profile);
    // A soft sweep gives the attack air without raising the core tone's gain.
    playTone({ wave: 'triangle', start: type === 'special' ? 1500 : 950, end: 110, gain: 0.055, duration: profile.duration });
    if (type === 'special') playTone({ wave: 'triangle', start: 120, end: 55, gain: 0.14, duration: 220 }, 'combat', 0.035);
}

function playImpactSound(type, blocked = false) {
    const profile = blocked ? IMPACT_SOUND_PROFILES.block : (IMPACT_SOUND_PROFILES[type] || IMPACT_SOUND_PROFILES.punch);
    playTone(profile);
    if (blocked) {
        playTone({ wave: 'sine', start: 1250, end: 720, gain: 0.045, duration: 85 });
    } else {
        playTone({ wave: 'sine', start: 85, end: 32, gain: 0.13, duration: profile.duration + 30 });
        playTone({ wave: 'square', start: 1800, end: 420, gain: 0.035, duration: 28 }, 'combat', 0.012);
        if (['comboPunch', 'comboKick', 'backKick', 'special'].includes(type)) {
            playTone({ wave: 'square', start: 920, end: 210, gain: 0.045, duration: 45 }, 'combat', 0.045);
        }
    }
}

function playUISound(type) {
    const profile = UI_SOUND_PROFILES[type] || UI_SOUND_PROFILES.select;
    playTone(profile, 'ui');
}

function playGlitchCancelSound() {
    playTone({ wave: 'square', start: 820, end: 260, gain: 0.10, duration: 55 });
    playTone({ wave: 'triangle', start: 260, end: 620, gain: 0.10, duration: 70 }, 'combat', 0.025);
}

function playRoundStartSound() {
    playTone({ wave: 'triangle', start: 440, end: 880, gain: 0.08, duration: 180 }, 'ui');
    playTone({ wave: 'sine', start: 660, end: 1100, gain: 0.06, duration: 120 }, 'ui', 0.08);
}

function playRoundEndSound(playerWon = true) {
    const start = playerWon ? 660 : 330;
    const end = playerWon ? 1100 : 220;
    playTone({ wave: 'triangle', start, end, gain: 0.10, duration: 240 }, 'ui');
}

function playDashSound() {
    playTone({ wave: 'sine', start: 520, end: 180, gain: 0.06, duration: 70 });
}

function playParrySound() {
    playTone({ wave: 'triangle', start: 880, end: 1320, gain: 0.10, duration: 100 });
    playTone({ wave: 'square', start: 1320, end: 880, gain: 0.05, duration: 60 }, 'combat', 0.03);
}

function playCriticalSound() {
    playTone({ wave: 'sawtooth', start: 440, end: 80, gain: 0.18, duration: 160 });
    playTone({ wave: 'square', start: 1200, end: 320, gain: 0.06, duration: 100 }, 'combat', 0.04);
}

function playHitSound() {
    playImpactSound('punch');
}

function playPunchSound() {
    playAttackSound('punch');
}
