let audioCtx;
let audioOutputGain = null;
let audioOutputLimiter = null;
const AUDIO_STORAGE_KEY = 'glitchDuelAudioVolumes';
const audioVolumes = loadAudioVolumes();

// Music system state
let musicState = null;
let musicIntensity = 0;
let musicStyle = 'bitDuel';
let nextMusicStyle = null;
let musicPaused = false;
let musicNextBar = 0;
let musicBarIndex = 0;
let musicEffects = { lowpass: null, bitcrush: null, stutterTimer: null };
let musicMasterGain = null;
let musicMasterFilter = null;
let musicMasterCompressor = null;
let musicDelay = null;
let musicDelayGain = null;
let musicChorusLFO = null;
let musicChorusGain = null;
let musicPadOscillators = [];
let musicDrumsGain = null;
let musicBassGain = null;
let musicMelodyGain = null;
let musicGlitchGain = null;
let scheduledMusicVoices = new Set();
let musicRandom = createSeededRandom(Date.now() & 0xFFFF);
let musicDuckingTimer = 0;
let musicTransitionIntensity = 0;
let musicTransitionFadeFrames = 0;
let musicNoiseFloor = null;
let musicDroneVoices = [];
let musicLayerBuses = {};
let musicUserGain = null;
let musicEffectsGain = null;
let musicBusReady = false;
let musicTransport = {
    running: false, scene: 'combat', style: 'bitDuel', barIndex: 0,
    barStart: 0, events: [], cursor: 0, pausedBeat: 0,
    intensity: 1, previewUntil: 0, returnScene: null
};
let musicSessionSeed = (Date.now() ^ 0x4D555349) >>> 0;
let musicMatchSequence = 0;
let musicTransitionGain = null;
let musicThemeFilter = null;
let musicLastAccent = -Infinity;
let musicPulseWaves = null;
let musicResumeRequested = false;
let musicNoiseBuffers = new WeakMap();
let musicDroppedVoices = 0;

const WAVE_POOL = ['sine', 'triangle', 'sawtooth', 'square'];

const INTENSITY_LAYER_MIX = {
    1: { drums: 0.50, bass: 0.60, melody: 0.50, glitch: 0.15, pad: 0.40 },
    2: { drums: 0.70, bass: 0.80, melody: 0.70, glitch: 0.40, pad: 0.60 },
    3: { drums: 1.00, bass: 1.00, melody: 1.00, glitch: 0.80, pad: 0.80 }
};

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
        try {
            const resumed = audioCtx.resume();
            if (resumed && typeof resumed.catch === 'function') resumed.catch(() => {});
        } catch (_) { /* Audio remains silent until the browser allows resume. */ }
    }
    if (audioCtx) initAudioOutput();
}

function initAudioOutput() {
    if (!audioCtx || audioOutputGain) return;
    audioOutputGain = audioCtx.createGain();
    audioOutputGain.gain.value = 1;
    audioOutputLimiter = audioCtx.createDynamicsCompressor();
    audioOutputLimiter.threshold.value = -3;
    audioOutputLimiter.knee.value = 0;
    audioOutputLimiter.ratio.value = 20;
    audioOutputLimiter.attack.value = 0.003;
    audioOutputLimiter.release.value = 0.12;
    audioOutputGain.connect(audioOutputLimiter).connect(audioCtx.destination);
}

function initMusicBus() {
    if (!audioCtx) return;
    if (musicMasterGain) return;
    musicMasterGain = audioCtx.createGain();
    musicMasterGain.gain.value = 0.85;
    musicMasterCompressor = audioCtx.createDynamicsCompressor();
    musicMasterCompressor.threshold.value = -18;
    musicMasterCompressor.knee.value = 6;
    musicMasterCompressor.ratio.value = 4;
    musicMasterCompressor.attack.value = 0.003;
    musicMasterCompressor.release.value = 0.12;

    musicDrumsGain = audioCtx.createGain();
    musicDrumsGain.gain.value = 1;
    musicBassGain = audioCtx.createGain();
    musicBassGain.gain.value = 1;
    musicMelodyGain = audioCtx.createGain();
    musicMelodyGain.gain.value = 1;
    musicGlitchGain = audioCtx.createGain();
    musicGlitchGain.gain.value = 1;

    if (!musicChorusLFO) {
        musicDrumsGain.connect(musicMasterGain);
        musicBassGain.connect(musicMasterGain);
        musicMelodyGain.connect(musicMasterGain);
        musicGlitchGain.connect(musicMasterGain);
        musicMasterFilter = audioCtx.createBiquadFilter();
        musicMasterFilter.type = 'lowshelf';
        musicMasterFilter.frequency.value = 300;
        musicMasterFilter.gain.value = 2.5;
        const highCut = audioCtx.createBiquadFilter();
        highCut.type = 'lowpass';
        highCut.frequency.value = 10000;
        highCut.Q.value = 0.5;
        musicMasterGain.connect(musicMasterCompressor);
        musicMasterCompressor.connect(musicMasterFilter).connect(highCut).connect(audioCtx.destination);
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
    const values = { combat: AUDIO_CONFIG.combat, ui: AUDIO_CONFIG.ui, music: AUDIO_CONFIG.music };
    try {
        const saved = JSON.parse(window.localStorage.getItem(AUDIO_STORAGE_KEY));
        if (saved && saved.version === 1) {
            for (const channel of ['combat', 'ui', 'music']) {
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
    if (!['combat', 'ui', 'music'].includes(channel) || !Number.isFinite(value)) return false;
    audioVolumes[channel] = Math.max(0, Math.min(1, value));
    if (channel === 'music' && musicUserGain && audioCtx) {
        const now = audioCtx.currentTime;
        try {
            if (typeof musicUserGain.gain.cancelScheduledValues === 'function') musicUserGain.gain.cancelScheduledValues(now);
            musicUserGain.gain.setValueAtTime(musicUserGain.gain.value, now);
            musicUserGain.gain.linearRampToValueAtTime(audioVolumes.music, now + 0.02);
        } catch (_) { musicUserGain.gain.value = audioVolumes.music; }
        if (audioVolumes.music === 0) pauseMusic();
        else if (musicTransport.running && musicPaused && audioCtx.state === 'running') resumeMusic();
    }
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

function noteVelocity() { return 0.85 + musicRandom() * 0.30; }

const HUMANIZE = { jitter: 0.012, swing: 0.012, ghost: 0.35 };

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

let NES_PULSE_WIDE = null;
let NES_PULSE_NARROW = null;

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

function getLayerMultiplier(layer) {
    const mix = INTENSITY_LAYER_MIX[musicIntensity] || INTENSITY_LAYER_MIX[1];
    return mix[layer] || 1;
}

function scheduleDrumKick(time, gain = 0.5, humanMs = 0) {
    if (!audioCtx || musicVolume() <= 0) return;
    if (!Number.isFinite(gain) || gain <= 0) return;
    time = Math.max(0, time + humanMs / 1000);
    const vol = musicVolume() * AUDIO_CONFIG.mixGain * gain * getLayerMultiplier('drums');
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

function scheduleDrumSnareBody(time, vol) {
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
    if (musicRandom() < 0.3) {
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

function scheduleDrumSnare(time, gain = 0.4, humanMs = 0) {
    if (!audioCtx || musicVolume() <= 0) return;
    if (!Number.isFinite(gain) || gain <= 0) return;
    time = Math.max(0, time + humanMs / 1000);
    const vol = musicVolume() * AUDIO_CONFIG.mixGain * gain * getLayerMultiplier('drums');
    scheduleDrumSnareBody(time, vol);
    const toneFreq = 180 + musicRandom() * 40;
    const tone = audioCtx.createOscillator();
    const tg = audioCtx.createGain();
    tone.type = 'sine';
    tone.frequency.setValueAtTime(toneFreq, time);
    tone.frequency.exponentialRampToValueAtTime(toneFreq * 0.5, time + 0.06);
    tg.gain.setValueAtTime(0, time);
    tg.gain.linearRampToValueAtTime(Math.min(0.08, vol * 0.25), time + 0.003);
    tg.gain.exponentialRampToValueAtTime(0.0001, time + 0.08);
    tone.connect(tg).connect(musicMasterGain);
    tone.start(time); tone.stop(time + 0.1);
}

function scheduleDrumHat(time, gain = 0.25, humanMs = 0, closed = true) {
    if (!audioCtx || musicVolume() <= 0) return;
    if (!Number.isFinite(gain) || gain <= 0) return;
    time = Math.max(0, time + humanMs / 1000);
    const vol = musicVolume() * AUDIO_CONFIG.mixGain * gain * getLayerMultiplier('drums');
    const dur = closed ? 0.04 : 0.14;
    const noise = audioCtx.createBufferSource();
    const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * dur, audioCtx.sampleRate);
    const data = buf.getChannelData(0);
    const decay = closed ? audioCtx.sampleRate * 0.01 : audioCtx.sampleRate * 0.03;
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / decay);
    noise.buffer = buf;
    const ng = audioCtx.createGain();
    ng.gain.setValueAtTime(Math.min(0.25, vol * 0.7), time);
    ng.gain.linearRampToValueAtTime(0.0001, time + dur);
    const nf = audioCtx.createBiquadFilter();
    nf.type = 'highpass';
    nf.frequency.value = closed ? 7000 : 5000;
    nf.Q.value = 0.5;
    noise.connect(ng).connect(nf).connect(musicMasterGain);
    noise.start(time); noise.stop(time + dur + 0.01);
    if (!closed) {
        const body = audioCtx.createOscillator();
        const bg = audioCtx.createGain();
        body.type = 'sine';
        body.frequency.setValueAtTime(300, time);
        body.frequency.exponentialRampToValueAtTime(120, time + dur * 0.5);
        bg.gain.setValueAtTime(0, time);
        bg.gain.linearRampToValueAtTime(Math.min(0.06, vol * 0.2), time + 0.002);
        bg.gain.exponentialRampToValueAtTime(0.0001, time + dur * 0.6);
        body.connect(bg).connect(musicMasterGain);
        body.start(time); body.stop(time + dur + 0.02);
    }
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

function getStyleMelodyPhrase(pool, rootIdx, intensity, barIndex) {
    const cell = getStyleMelodyCell();
    const section = Math.floor(barIndex / 8) % 3;
    const isB = section === 1;
    const isBreakdown = section === 2;
    const phrase = [];
    if (isBreakdown) {
        for (let i = 0; i < 16; i++) {
            const cellIdx = Math.floor(i * cell.rhythm.length / 16) % cell.rhythm.length;
            phrase.push(pool[rootIdx + cell.cell[cellIdx]]);
        }
        return phrase;
    }
    const cellNotes = cell.cell.map((offset) => pool[rootIdx + offset]);
    if (isB) {
        const transposed = cell.cell.map((offset) => pool[rootIdx + offset + 3]);
        for (let i = 0; i < 16; i++) {
            const cellIdx = Math.floor(i / 2) % cellNotes.length;
            phrase.push(i % 4 < 2 ? cellNotes[cellIdx] : transposed[cellIdx]);
        }
    } else {
        for (let i = 0; i < 16; i++) {
            const cellIdx = Math.floor(i / 2) % cellNotes.length;
            phrase.push(cellNotes[cellIdx]);
        }
    }
    return phrase;
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
        if (styleInt && styleInt[section % 3]) {
            melodyPhrases[musicStyle][sk][key] = styleInt[section % 3];
        } else {
            melodyPhrases[musicStyle][sk][key] = getStyleMelodyPhrase(pool, rootIdx, intensity, barIndex);
        }
    }
    return melodyPhrases[musicStyle][sk][key];
}

function scheduleBassNote(note, time, duration, gain = 0.5) {
    if (!audioCtx || musicVolume() <= 0) return;
    if (!Number.isFinite(note) || !Number.isFinite(gain) || gain <= 0) return;
    time = Math.max(0, time);
    const vol = musicVolume() * AUDIO_CONFIG.mixGain * gain * getLayerMultiplier('bass');
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

function maybeAddApproachNote(note, time, duration, gain) {
    if (musicRandom() > 0.12) return;
    if (time < 0.05) return;
    const approachTime = time - 0.035 - musicRandom() * 0.02;
    const direction = musicRandom() > 0.5 ? 1 : -1;
    const approachNote = note + direction;
    if (!Number.isFinite(approachNote)) return;
    const approachGain = gain * 0.25;
    const approachDur = 0.03 + musicRandom() * 0.02;
    const vol = musicVolume() * AUDIO_CONFIG.mixGain * approachGain * getLayerMultiplier('melody');
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(midiToFreq(approachNote), approachTime);
    g.gain.setValueAtTime(0, approachTime);
    g.gain.linearRampToValueAtTime(Math.min(0.12, vol), approachTime + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, approachTime + approachDur);
    o.connect(g).connect(musicMasterGain);
    o.start(approachTime);
    o.stop(approachTime + approachDur + 0.02);
}

function scheduleMelodyNote(note, time, duration, gain = 0.4, harmonyInterval = 0) {
    if (!audioCtx || musicVolume() <= 0) return;
    if (!Number.isFinite(note) || !Number.isFinite(gain) || gain <= 0) return;
    time = Math.max(0, time);
    const vol = musicVolume() * AUDIO_CONFIG.mixGain * gain * getLayerMultiplier('melody');
    maybeAddApproachNote(note, time, duration, gain);
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
    const vol = musicVolume() * AUDIO_CONFIG.mixGain * gain * getLayerMultiplier('glitch');
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(midiToFreq(note), time);
    const sweepRate = 4 + musicRandom() * 6;
    o.frequency.linearRampToValueAtTime(midiToFreq(note) * 0.3, time + duration);
    g.gain.setValueAtTime(0, time);
    g.gain.linearRampToValueAtTime(Math.min(0.2, vol * 0.6), time + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, time + duration * 0.6);
    const bp = audioCtx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 2000 + musicRandom() * 3000;
    bp.Q.value = 3 + musicRandom() * 4;
    const sweep = audioCtx.createOscillator();
    sweep.type = 'sine';
    sweep.frequency.value = 0.2 + musicRandom() * 0.3;
    const sweepGain = audioCtx.createGain();
    sweepGain.gain.value = 1500 + musicRandom() * 2000;
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
    const vol = musicVolume() * AUDIO_CONFIG.mixGain * gain * getLayerMultiplier('melody');
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
    const vol = musicVolume() * AUDIO_CONFIG.mixGain * gain * getLayerMultiplier('drums');
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
    const vol = musicVolume() * AUDIO_CONFIG.mixGain * gain * getLayerMultiplier('pad');
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

function getEffectiveBpm(rubato = false) {
    const s = MUSIC_STYLES[musicStyle];
    let bpm = (s && s.bpm) ? s.bpm : MUSIC_CONFIG.bpm;
    if (rubato) {
        const section = Math.floor(musicBarIndex / 8) % 3;
        if (section === 1) bpm += 1 + Math.floor(musicRandom() * 2);
        else if (section === 2) bpm -= 1;
    }
    return bpm;
}

function getMusicTiming() {
    const bpm = getEffectiveBpm();
    const beatSec = 60 / bpm;
    return { bpm, beatSec, barSec: beatSec * 16 };
}

const STYLE_MELODY_CELLS = {
    bitDuel: { cell: [0, 2, 4, 7, 4, 2], rhythm: [0.25, 0.25, 0.25, 0.25, 0.25, 0.75], octave: 0 },
    baroqueBash: { cell: [0, 2, 3, 5, 7, 5, 3, 2], rhythm: [0.125, 0.125, 0.125, 0.125, 0.125, 0.125, 0.125, 0.125], octave: 0 },
    neonFury: { cell: [0, 0, 3, 5, 7, 5, 3], rhythm: [0.5, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25], octave: 0 },
    glitchAssault: { cell: [0, 0, 7, 7, 5, 5, 4], rhythm: [0.125, 0.125, 0.125, 0.125, 0.25, 0.125, 0.125], octave: 0 },
    retroGroove: { cell: [0, 2, 4, 5, 4, 2], rhythm: [0.375, 0.125, 0.25, 0.125, 0.125, 0.5], octave: 0 },
    voidReach: { cell: [0, 0, 0, 2, 4, 4, 2], rhythm: [1, 0.5, 0.5, 0.5, 0.5, 0.5, 1], octave: -12 }
};

function getStyleMelodyCell() {
    const cell = STYLE_MELODY_CELLS[musicStyle] || STYLE_MELODY_CELLS.bitDuel;
    return cell;
}

function schedulePreSpecialSilence() {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    stopPadNotes();
    try {
        for (const voice of scheduledMusicVoices) {
            try { voice.stop(now + 0.01); } catch (_) {}
        }
    } catch (_) {}
}

function musicDuck(durationMs = 200, reductionDb = 4) {
    if (!audioCtx || !musicMasterGain) return;
    const now = audioCtx.currentTime;
    const ratio = Math.pow(10, -reductionDb / 20);
    if (typeof musicMasterGain.gain.cancelScheduledValues === 'function') {
        musicMasterGain.gain.cancelScheduledValues(now);
    }
    musicMasterGain.gain.setValueAtTime(musicMasterGain.gain.value || 0.85, now);
    musicMasterGain.gain.linearRampToValueAtTime(0.85 * ratio, now + 0.015);
    musicMasterGain.gain.linearRampToValueAtTime(0.85, now + durationMs / 1000);
}

function pickWave() {
    return WAVE_POOL[Math.floor(musicRandom() * WAVE_POOL.length)];
}

function scheduleChord(notes, time, gain, wave = 'sine') {
    if (!audioCtx || musicVolume() <= 0) return;
    if (!notes || !notes.length) return;
    time = Math.max(0, time);
    const vol = musicVolume() * AUDIO_CONFIG.mixGain * gain * getLayerMultiplier('melody');
    const perNoteGain = vol / notes.length * 0.6;
    notes.forEach((note, i) => {
        if (!Number.isFinite(note)) return;
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.type = wave === 'pulseWide' ? 'square' : (wave === 'pulseNarrow' ? 'square' : wave);
        o.frequency.value = midiToFreq(note);
        const fadeIn = 0.04 + i * 0.005;
        g.gain.setValueAtTime(0, time);
        g.gain.linearRampToValueAtTime(perNoteGain, time + fadeIn);
        g.gain.setValueAtTime(perNoteGain, time + 0.3);
        g.gain.exponentialRampToValueAtTime(0.0001, time + 1.2);
        o.connect(g).connect(musicMasterGain);
        o.start(time);
        o.stop(time + 1.5);
    });
}

function startNoiseFloor() {
    if (!audioCtx || musicNoiseFloor) return;
    const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * 2, audioCtx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 1; i < data.length; i++) {
        data[i] = data[i - 1] * 0.997 + (Math.random() - 0.5) * 0.05;
    }
    const source = audioCtx.createBufferSource();
    source.buffer = buf;
    source.loop = true;
    const gain = audioCtx.createGain();
    gain.gain.value = 0.003;
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 2000;
    source.connect(gain).connect(filter).connect(musicMasterGain);
    source.start();
    musicNoiseFloor = { source, gain, filter };
}

function stopNoiseFloor() {
    if (!musicNoiseFloor) return;
    try { musicNoiseFloor.source.stop(); } catch (_) {}
    try { musicNoiseFloor.gain.disconnect(); } catch (_) {}
    try { musicNoiseFloor.filter.disconnect(); } catch (_) {}
    musicNoiseFloor = null;
}

function schedulePadDrone(notes, startTime, duration) {
    if (!audioCtx || musicVolume() <= 0) return;
    const vol = musicVolume() * AUDIO_CONFIG.mixGain * 0.08 * getLayerMultiplier('pad');
    notes.forEach((note) => {
        if (!Number.isFinite(note)) return;
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.type = 'sine';
        o.frequency.value = midiToFreq(note);
        g.gain.setValueAtTime(0, startTime);
        g.gain.linearRampToValueAtTime(vol, startTime + 0.5);
        g.gain.setValueAtTime(vol, startTime + duration - 0.5);
        g.gain.linearRampToValueAtTime(0.0001, startTime + duration);
        o.connect(g).connect(musicMasterGain);
        o.start(startTime);
        o.stop(startTime + duration + 0.1);
        musicDroneVoices.push({ o, g });
    });
}

function stopDroneVoices() {
    for (const v of musicDroneVoices) {
        try { v.o.stop(); } catch (_) {}
        try { v.g.disconnect(); } catch (_) {}
    }
    musicDroneVoices = [];
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
    const bpm = getEffectiveBpm();
    const beatSec = 60000 / bpm / 1000;
    const pool = MUSIC_CONFIG.notePool;
    const rootIdx = intensity >= 3 ? 4 : 2;
    const section = Math.floor(barIndex / 8) % 3;
    const isBreakdown = section === 2;
    const isMelodySection = section === 0;
    const walkingBass = buildWalkingBass(intensity, barIndex);
    const drumIdx = pickDrumPattern(barIndex, isBreakdown);
    const dp = DRUM_PATTERNS[drumIdx] || DRUM_PATTERNS[0];

    function humanizeMs(beat) {
        return (musicRandom() - 0.5) * HUMANIZE.jitter * 1000;
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
                return { note, gain: 0.45 + musicRandom() * 0.08, dur, humanMs: humanizeMs(beat) };
            }
            acc = end;
        }
        return null;
    };

    function beatInPattern(beat) {
        for (const b of dp.kicks) { if (b === beat) return { type: 'kick', gain: 0.4 + musicRandom() * 0.12, humanMs: h(beat) }; }
        for (const b of dp.snares) { if (b === beat) return { type: 'snare', gain: 0.3 + musicRandom() * 0.1, humanMs: h(beat) }; }
        if (dp.hatEach > 0 && beat % dp.hatEach === 0) return { type: 'hat', gain: 0.1 + musicRandom() * 0.06, humanMs: h(beat) };
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
                return { note: pool[rootIdx + 4], gain: accentGain(beat, 0.3) + musicRandom() * 0.05, dur: beatSec * 1.8, humanMs: humanizeMs(beat) };
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
                return { note: pool[rootIdx + 3 + (Math.floor(barIndex / 8) % 3)], gain: accentGain(beat, 0.35) + musicRandom() * 0.05, dur: beatSec * 1.5, humanMs: humanizeMs(beat) };
            },
            glitch: ({ beat }) => {
                if (isBreakdown) return null;
                if (beat % 12 !== 0) return null;
                return { note: pool[(beat + Math.floor(beat / 12)) % pool.length], gain: 0.18 + musicRandom() * 0.06, dur: beatSec * 0.4, humanMs: humanizeMs(beat) };
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
                return { note: pool[rootIdx + 4 + (Math.floor(beat / 2) % 4)], gain: accentGain(beat, 0.4) + musicRandom() * 0.06, dur: beatSec * 0.8, humanMs: humanizeMs(beat) };
            },
            glitch: ({ beat }) => {
                if (isBreakdown) return null;
                if (beat % 6 !== 0) return null;
                return { note: pool[(beat + Math.floor(beat / 6) * 3) % pool.length], gain: 0.22 + musicRandom() * 0.08, dur: beatSec * 0.25, humanMs: humanizeMs(beat) };
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

function addGhostBassNote(t, beatSec) {
    if (!audioCtx || musicVolume() <= 0) return;
    if (musicRandom() > 0.15) return;
    const pool = MUSIC_CONFIG.notePool;
    const rootIdx = (musicIntensity || 1) >= 3 ? 4 : 2;
    const ghostNote = pool[rootIdx + Math.floor(musicRandom() * 3)];
    if (!Number.isFinite(ghostNote)) return;
    const ghostGain = 0.10 + musicRandom() * 0.05;
    const ghostDur = beatSec * 0.12;
    const vol = musicVolume() * AUDIO_CONFIG.mixGain * ghostGain * getLayerMultiplier('bass');
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(midiToFreq(ghostNote), t);
    const o2 = audioCtx.createOscillator();
    const g2 = audioCtx.createGain();
    o2.type = 'triangle';
    o2.frequency.setValueAtTime(midiToFreq(ghostNote - 12), t);
    g2.gain.setValueAtTime(0, t);
    g2.gain.linearRampToValueAtTime(Math.min(0.04, vol * 0.3), t + 0.01);
    g2.gain.exponentialRampToValueAtTime(0.0001, t + ghostDur);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(Math.min(0.08, vol * 0.4), t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + ghostDur);
    o.connect(g).connect(musicMasterGain);
    o2.connect(g2).connect(musicMasterGain);
    o.start(t); o.stop(t + ghostDur + 0.03);
    o2.start(t); o2.stop(t + ghostDur + 0.03);
}

function scheduleMusicBar(pattern, barStart, beatSec) {
    if (!audioCtx || musicPaused) return;
    const beats = 16;
    const melodyPhrase = buildMelodyPhrase(musicIntensity || 1, musicBarIndex);
    if (!melodyPhrase || melodyPhrase.length === 0) return;
    const section = Math.floor(musicBarIndex / 8) % 3;
    const isLastBarOfSection = musicBarIndex > 0 && musicBarIndex % 8 === 7;
    const isFirstBarOfSection = musicBarIndex % 8 === 0;
    if (isFirstBarOfSection && section !== 2 && musicIntensity >= 2) {
        const pool = MUSIC_CONFIG.notePool;
        const rootIdx = musicIntensity >= 3 ? 4 : 2;
        const chordNotes = [pool[rootIdx], pool[rootIdx + 3], pool[rootIdx + 7]];
        scheduleChord(chordNotes, barStart, 0.10 + musicIntensity * 0.02, 'sine');
    }
    if (section === 0 && musicBarIndex % 8 === 0) {
        stopDroneVoices();
        const pool = MUSIC_CONFIG.notePool;
        const rootIdx = musicIntensity >= 3 ? 4 : 2;
        const droneNotes = [pool[rootIdx] - 12, pool[rootIdx] - 24];
        schedulePadDrone(droneNotes, barStart, beatSec * 16 * 2);
    }
    let padScheduled = false;
    let fillScheduled = false;
    let breathScheduled = false;
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
        const vel = noteVelocity();
        if (bass && Number.isFinite(bass.note)) scheduleBassNote(bass.note, Math.max(0, t + (bass.humanMs || 0) / 1000), bass.dur, bass.gain * vel);
        const mel = pattern.melody(beat);
        const velMel = noteVelocity();
        if (mel) { const melNote = melodyPhrase[Math.floor(b * melodyPhrase.length / beats) % melodyPhrase.length]; if (Number.isFinite(melNote)) scheduleMelodyNote(melNote, Math.max(0, t + (mel.humanMs || 0) / 1000), mel.dur, mel.gain * velMel); }
        const contra = pattern.contra ? pattern.contra(beat) : null;
        if (contra && Number.isFinite(contra.note)) scheduleMelodyNote(contra.note, Math.max(0, t + (contra.humanMs || 0) / 1000), contra.dur, contra.gain * noteVelocity(), contra.harmony || 0);
        const gl = pattern.glitch(beat);
        const velGl = noteVelocity();
        if (gl && Number.isFinite(gl.note)) scheduleGlitchNote(gl.note, Math.max(0, t + (gl.humanMs || 0) / 1000), gl.dur, gl.gain * velGl);
        const str = pattern.string ? pattern.string(beat) : null;
        if (str && Number.isFinite(str.note)) schedulePluckedString(str.note, Math.max(0, t + (str.humanMs || 0) / 1000), str.dur, str.gain * noteVelocity());
        const perc = pattern.percussion ? pattern.percussion(beat) : null;
        if (perc) scheduleMelodicPerc(t, perc.gain);
        if (!padScheduled && pattern.pad && pattern.pad(beat)) {
            schedulePadDouble(t, pattern.pad(beat).gain);
            padScheduled = true;
        }
        if (!breathScheduled && isLastBarOfSection && b >= 14) {
            breathScheduled = true;
            const hushNote = audioCtx.createOscillator();
            const hushGain = audioCtx.createGain();
            hushNote.type = 'sine';
            hushNote.frequency.value = 60;
            hushGain.gain.setValueAtTime(0.03, t);
            hushGain.gain.exponentialRampToValueAtTime(0.0001, t + beatSec * 0.3);
            hushNote.connect(hushGain).connect(musicMasterGain);
            hushNote.start(t);
            hushNote.stop(t + beatSec * 0.4);
        }
        if (!breathScheduled && b === 15 && isLastBarOfSection && musicRandom() > 0.4) {
            breathScheduled = true;
            if (musicRandom() > 0.5) scheduleDrumHat(t, 0.08, 0, true);
        }
        const fill = pattern.fill ? pattern.fill(beat) : null;
        if (fill && fill.fill && !fillScheduled) {
            scheduleDrumFill(t, beatSec);
            fillScheduled = true;
        }
        if (b > 0 && b < 15 && !bass && b % 3 === 1 && musicRandom() < 0.12) {
            addGhostBassNote(t, beatSec);
        }
    }
    if (musicIntensity >= 3 && musicBarIndex > 0 && musicBarIndex % 8 === 0) {
        scheduleDrumCrash(Math.max(0.01, barStart));
    }
}

function restoreMusicMasterGain() {
    if (!audioCtx || !musicMasterGain) return;
    const now = audioCtx.currentTime;
    if (typeof musicMasterGain.gain.cancelScheduledValues === 'function') {
        musicMasterGain.gain.cancelScheduledValues(now);
    }
    musicMasterGain.gain.setValueAtTime(0.0001, now);
    musicMasterGain.gain.linearRampToValueAtTime(0.85, now + 0.04);
}

function startMusic() {
    if (!audioCtx || musicVolume() <= 0) return;
    initMusicBus();
    restoreMusicMasterGain();
    stopMusic();
    musicPaused = false;
    musicNextBar = audioCtx.currentTime;
    musicBarIndex = 0;
    startNoiseFloor();
}

function scheduleMusicVoice(source) {
    scheduledMusicVoices.add(source);
    if (typeof source.stop === 'function') {
        const origStop = source.stop.bind(source);
        source.stop = (t) => {
            scheduledMusicVoices.delete(source);
            return origStop(t);
        };
    }
    if (typeof source.onended === 'function') {
        const origOnended = source.onended;
        source.onended = () => {
            scheduledMusicVoices.delete(source);
            origOnended();
        };
    }
    return source;
}

function stopScheduledMusicVoices() {
    for (const voice of scheduledMusicVoices) {
        try { if (typeof voice.stop === 'function') voice.stop(); } catch (_) {}
        try { if (typeof voice.disconnect === 'function') voice.disconnect(); } catch (_) {}
    }
    scheduledMusicVoices.clear();
}

function tickMusic() {
    if (musicPaused || !audioCtx || musicVolume() <= 0 || !musicMasterGain) return;
    if (musicTransitionFadeFrames > 0) {
        musicTransitionFadeFrames--;
        if (musicTransitionFadeFrames <= 0 && musicTransitionIntensity > 0) {
            musicIntensity = musicTransitionIntensity;
            musicTransitionIntensity = 0;
        }
        applyLayerGains();
    }
    const now = audioCtx.currentTime;
    if (now < musicNextBar) return;
    const bpm = getEffectiveBpm(true);
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
    stopScheduledMusicVoices();
    stopPadNotes();
    stopNoiseFloor();
    stopDroneVoices();
}

function setMusicIntensity(level) {
    const clamped = Math.max(1, Math.min(3, level || 1));
    if (clamped === musicIntensity && musicTransitionFadeFrames <= 0) return;
    if (clamped !== musicIntensity) {
        musicTransitionIntensity = clamped;
        musicTransitionFadeFrames = 32;
    }
    musicIntensity = clamped;
}

function applyLayerGains() {
    if (!musicDrumsGain || !musicBassGain || !musicMelodyGain || !musicGlitchGain) return;
    const mix = INTENSITY_LAYER_MIX[musicIntensity] || INTENSITY_LAYER_MIX[1];
    musicDrumsGain.gain.value = mix.drums;
    musicBassGain.gain.value = mix.bass;
    musicMelodyGain.gain.value = mix.melody;
    musicGlitchGain.gain.value = mix.glitch;
}

function musicCriticalHitLP() {
    if (!audioCtx || musicVolume() <= 0) return;
    musicDuck(160, 3);
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

// Compact, deterministic music engine. Music owns its clock and random stream;
// combat simulation and SFX never depend on this transport.
const MUSIC_ARRANGEMENTS = {
    bitDuel: { wave: 'pulseWide', kick: [0, 2], snare: [1, 3], hats: 0.5, bass: [0, 2], swing: 0, trim: 0.72 },
    baroqueBash: { wave: 'pulseNarrow', kick: [0], snare: [2], hats: 0.5, bass: [0, 2], swing: 0, trim: 0.68 },
    neonFury: { wave: 'sawtooth', kick: [0, 2], snare: [1, 3], hats: 0.5, bass: [0, 1.5, 2, 3.5], swing: 0, trim: 0.56 },
    glitchAssault: { wave: 'square', kick: [0, 1.5, 2.5], snare: [1, 3], hats: 0.25, bass: [0, 1.5, 2.5, 3.5], swing: 0, trim: 0.5 },
    retroGroove: { wave: 'triangle', kick: [0, 2.5], snare: [1, 3], hats: 0.5, bass: [0, 1.5, 2, 3.5], swing: 0.06, trim: 0.66 },
    voidReach: { wave: 'sine', kick: [0], snare: [2], hats: 1, bass: [0, 2], swing: 0, trim: 0.7 }
};
const MUSIC_SECTION_STARTS = [0, 2, 6, 10, 12];
const MUSIC_CHORD_DEGREES = [0, 3, 4, 0];
const MUSIC_CHORD_INTERVALS = [[0, 3, 7], [0, 3, 7], [0, 4, 7], [0, 3, 7]];
let musicVoiceRecords = new Map();
let musicPreviewSnapshot = null;

function musicHash(value) {
    let hash = 2166136261;
    for (let i = 0; i < String(value).length; i++) hash = Math.imul(hash ^ String(value).charCodeAt(i), 16777619);
    return hash >>> 0;
}

function musicRandomFor(seed, style, barIndex, eventIndex) {
    let state = (seed ^ musicHash(style) ^ Math.imul(barIndex + 1, 0x9E3779B1) ^ Math.imul(eventIndex + 1, 0x85EBCA6B)) >>> 0;
    state ^= state << 13; state ^= state >>> 17; state ^= state << 5;
    return (state >>> 0) / 4294967296;
}

function degreeToMidi(degree, octave = 0, baseMidi = MUSIC_CONFIG.tonicMidi) {
    if (!Number.isInteger(degree) || !Number.isInteger(octave) || !Number.isFinite(baseMidi)) return NaN;
    const scale = MUSIC_CONFIG.scale;
    const absoluteDegree = degree;
    const scaleIndex = ((absoluteDegree % scale.length) + scale.length) % scale.length;
    const scaleOctave = Math.floor(absoluteDegree / scale.length) + octave;
    const note = baseMidi + scale[scaleIndex] + scaleOctave * 12;
    return note >= 24 && note <= 96 ? note : NaN;
}

function getMusicStyleList() { return Object.keys(MUSIC_STYLES); }
function getMusicStyleName() { return musicStyle; }

function setMusicStyle(style) {
    if (!Object.hasOwn(MUSIC_STYLES, style)) return false;
    musicStyle = style;
    musicTransport.style = style;
    musicTransport.events = [];
    musicTransport.cursor = 0;
    melodyPhrases = { 1: null, 2: null, 3: null };
    if (typeof renderMusicNowPlaying === 'function') renderMusicNowPlaying();
    return true;
}

function setMusicSessionSeed(seed) {
    if (!Number.isInteger(seed) || seed < 0 || seed > 0xFFFFFFFF) return false;
    musicSessionSeed = seed >>> 0;
    musicMatchSequence = 0;
    return true;
}

function chooseRandomMusicStyle() {
    const styles = getMusicStyleList();
    const sample = musicRandomFor(musicSessionSeed, 'match-style', musicMatchSequence++, 0);
    return styles[Math.floor(sample * styles.length)] || 'bitDuel';
}

function initMusicBus() {
    if (!audioCtx || musicBusReady) return;
    initAudioOutput();
    musicLayerBuses = Object.fromEntries(['drums', 'bass', 'melody', 'glitch', 'pad'].map((layer) => [layer, audioCtx.createGain()]));
    musicDrumsGain = musicLayerBuses.drums;
    musicBassGain = musicLayerBuses.bass;
    musicMelodyGain = musicLayerBuses.melody;
    musicGlitchGain = musicLayerBuses.glitch;
    musicEffectsGain = audioCtx.createGain();
    musicEffectsGain.gain.value = 1;
    musicThemeFilter = audioCtx.createBiquadFilter();
    musicThemeFilter.type = 'lowpass';
    musicThemeFilter.frequency.value = 20000;
    musicTransitionGain = audioCtx.createGain();
    musicTransitionGain.gain.value = 1;
    musicUserGain = audioCtx.createGain();
    musicUserGain.gain.value = musicVolume();
    musicMasterGain = audioCtx.createGain();
    musicMasterGain.gain.value = 0.82;
    musicMasterCompressor = audioCtx.createDynamicsCompressor();
    musicMasterCompressor.threshold.value = -16;
    musicMasterCompressor.knee.value = 8;
    musicMasterCompressor.ratio.value = 3;
    musicMasterCompressor.attack.value = 0.004;
    musicMasterCompressor.release.value = 0.16;
    for (const bus of Object.values(musicLayerBuses)) bus.connect(musicEffectsGain);
    musicEffectsGain.connect(musicThemeFilter).connect(musicTransitionGain).connect(musicUserGain)
        .connect(musicMasterGain).connect(musicMasterCompressor).connect(audioOutputGain);
    musicBusReady = true;
    NES_PULSE_WIDE = getMusicPulseWave(0.25);
    NES_PULSE_NARROW = getMusicPulseWave(0.125);
    applyLayerGains(0);
}

function getLayerMultiplier(layer) {
    const mix = INTENSITY_LAYER_MIX[musicIntensity] || INTENSITY_LAYER_MIX[1];
    return mix[layer] === undefined ? 1 : mix[layer];
}

function applyLayerGains(rampSeconds = 0.2) {
    if (!musicBusReady || !audioCtx) return;
    const mix = INTENSITY_LAYER_MIX[musicIntensity] || INTENSITY_LAYER_MIX[1];
    const now = audioCtx.currentTime;
    for (const [layer, bus] of Object.entries(musicLayerBuses)) {
        const target = mix[layer] === undefined ? 0.25 : mix[layer];
        try {
            if (typeof bus.gain.cancelScheduledValues === 'function') bus.gain.cancelScheduledValues(now);
            bus.gain.setValueAtTime(bus.gain.value, now);
            bus.gain.linearRampToValueAtTime(target, now + rampSeconds);
        } catch (_) { bus.gain.value = target; }
    }
}

function setMusicIntensity(level) {
    const clamped = Math.max(1, Math.min(3, Math.round(Number(level) || 1)));
    if (clamped === musicIntensity) return;
    musicIntensity = clamped;
    musicTransport.intensity = clamped;
    applyLayerGains(0.2);
}

function musicVolume() { return Number.isFinite(audioVolumes.music) ? audioVolumes.music : AUDIO_CONFIG.music; }

function canScheduleMusicAudio() {
    return !!audioCtx && audioCtx.state === 'running';
}

function makeMusicEvent(beat, type, layer, note, durationBeats, velocity, extra = {}) {
    return { beat, type, layer, note, durationBeats, velocity, ...extra };
}

function getMusicSection(barIndex) {
    const position = ((barIndex % 16) + 16) % 16;
    for (let i = MUSIC_SECTION_STARTS.length - 1; i >= 0; i--) {
        if (position >= MUSIC_SECTION_STARTS[i]) return { name: ['intro', 'A', 'B', 'break', 'return'][i], start: MUSIC_SECTION_STARTS[i], index: position - MUSIC_SECTION_STARTS[i] };
    }
    return { name: 'intro', start: 0, index: 0 };
}

function generateMusicBarEvents(styleKey, barIndex, intensity = 1, seed = musicSessionSeed) {
    const style = MUSIC_STYLES[styleKey] ? styleKey : 'bitDuel';
    const arrangement = MUSIC_ARRANGEMENTS[style];
    const level = Math.max(1, Math.min(3, Math.round(Number(intensity) || 1)));
    const section = getMusicSection(barIndex);
    const localBar = ((barIndex % 16) + 16) % 16;
    const chordIndex = Math.floor(localBar / 4) % 4;
    const rootDegree = MUSIC_CHORD_DEGREES[chordIndex];
    const chordRoot = degreeToMidi(rootDegree, -1);
    const events = [];
    let serial = 0;
    const add = (beat, type, layer, note, durationBeats, velocity, extra = {}) => {
        const rand = musicRandomFor(seed, style, barIndex, serial++);
        const swing = arrangement.swing && beat % 1 === 0.5 ? arrangement.swing : 0;
        const jitterMax = style === 'glitchAssault' ? 0.002 : 0.006;
        const jitter = (rand * 2 - 1) * jitterMax;
        const humanizedBeat = Math.max(0, beat + swing);
        events.push(makeMusicEvent(humanizedBeat, type, layer, note, durationBeats, velocity * (0.9 + rand * 0.2), { jitter, ...extra }));
    };

    // Root motion and low-end pulse stay present through the quiet section.
    const walkingBass = buildWalkingBass(level, barIndex);
    const bassOnsets = arrangement.bass.filter((beat, index) => level > 1 || index % 2 === 0);
    bassOnsets.forEach((beat) => {
        const slot = Math.min(walkingBass.notes.length - 1, Math.floor(beat / 4 * walkingBass.notes.length));
        add(beat, 'tone', 'bass', walkingBass.notes[slot], beat % 1 ? 0.42 : 0.8, 0.42, { wave: 'triangle' });
    });

    if (section.name !== 'break') {
        arrangement.kick.forEach((beat) => add(beat, 'kick', 'drums', 42, 0.18, style === 'glitchAssault' ? 0.48 : 0.34));
        arrangement.snare.forEach((beat) => add(beat, 'snare', 'drums', style === 'baroqueBash' ? 74 : 58, 0.12, 0.23));
        for (let beat = 0; beat < 4; beat += arrangement.hats) {
            if (style === 'voidReach' && beat % 2 !== 0) continue;
            const quietHat = beat % 1 === 0.5 ? 0.045 : 0.075;
            add(beat, 'hat', 'drums', 76 + (beat % 1 ? 0 : 5), 0.06, quietHat);
        }
    } else {
        add(0, 'kick', 'drums', 42, 0.18, 0.18);
        if (level >= 3) add(2, 'hat', 'drums', 78, 0.05, 0.035);
    }

    const chord = MUSIC_CHORD_INTERVALS[chordIndex].map((interval) => chordRoot + interval).filter((note) => note >= 24 && note <= 96);
    if (section.name !== 'intro' && section.name !== 'break') {
        const voicing = style === 'voidReach' || style === 'neonFury' ? chord : chord.slice(0, 2);
        const chordWave = style === 'voidReach' ? 'sine' : style === 'neonFury' ? 'sawtooth' : arrangement.wave;
        add(0, 'chord', 'pad', voicing, 3.8, style === 'voidReach' ? 0.045 : 0.032, { wave: chordWave });
    }

    const motifSection = section.name === 'A' || section.name === 'return';
    if (motifSection) {
        let beat = 0;
        MUSIC_CONFIG.motifDegrees.forEach((degree, index) => {
            const motifBeat = beat;
            const length = MUSIC_CONFIG.motifDurations[index];
            const octave = style === 'voidReach' && index % 2 ? -1 : (style === 'neonFury' ? 1 : 0);
            add(motifBeat, 'lead', 'melody', degreeToMidi(degree, octave), Math.max(0.12, length * 0.82), section.name === 'return' ? 0.23 : 0.2, { wave: arrangement.wave, accent: index === 0 });
            beat += length;
        });
        if (style === 'baroqueBash' && section.name === 'A' && level >= 2) {
            [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5].forEach((beat, index) => {
                const degree = [0, 2, 4, 6][index % 4];
                add(beat, 'pluck', 'melody', degreeToMidi(degree, 1), 0.22, 0.09, { wave: 'triangle' });
            });
        } else if (style === 'glitchAssault' && level >= 2 && localBar % 4 === 3) {
            add(3.75, 'glitch', 'glitch', degreeToMidi(4, -1), 0.18, 0.14, { wave: 'sawtooth' });
        }
    } else if (section.name === 'B' || section.name === 'intro' && localBar === 1) {
        const cells = {
            bitDuel: [0, 4, 2, 4], baroqueBash: [4, 2, 1, 3], neonFury: [0, 2, 4, 2],
            glitchAssault: [0, 0, 4, 4], retroGroove: [0, 2, 4, 2], voidReach: [0, 4]
        }[style];
        const interval = style === 'baroqueBash' ? 0.5 : style === 'voidReach' ? 2 : 1;
        cells.forEach((degree, index) => {
            const beat = index * interval;
            if (beat < 4) add(beat, 'lead', 'melody', degreeToMidi(degree + rootDegree), style === 'voidReach' ? 1.6 : 0.52, section.name === 'intro' ? 0.12 : 0.18, { wave: arrangement.wave });
        });
    }

    const layerPriority = { bass: 0, drums: 1, melody: 2, pad: 3, glitch: 4 };
    return events.filter((event) => Number.isFinite(event.beat) && Number.isFinite(event.durationBeats) && event.durationBeats > 0 &&
        (Array.isArray(event.note) ? event.note.every((note) => Number.isFinite(note) && note >= 24 && note <= 96) : Number.isFinite(event.note) && event.note >= 24 && event.note <= 96))
        .sort((a, b) => a.beat - b.beat || (layerPriority[a.layer] ?? 5) - (layerPriority[b.layer] ?? 5));
}

function buildWalkingBass(intensity, barIndex) {
    const rootDegree = MUSIC_CHORD_DEGREES[Math.floor((((barIndex % 16) + 16) % 16) / 4) % 4];
    const notes = [degreeToMidi(rootDegree, -1), degreeToMidi((rootDegree + 4) % 7, -1)];
    return intensity >= 2 ? { notes: [notes[0], notes[1], notes[0], notes[1]], durations: [1, 1, 1, 1] }
        : { notes, durations: [2, 2] };
}

function buildMusicPattern(intensity, barIndex) {
    return { events: generateMusicBarEvents(musicStyle, barIndex, intensity) };
}

function musicBeatSeconds() {
    const style = MUSIC_STYLES[musicStyle] || MUSIC_STYLES.bitDuel;
    return 60 / style.bpm;
}

function getEffectiveBpm() { return (MUSIC_STYLES[musicStyle] || MUSIC_STYLES.bitDuel).bpm; }

function getMusicTiming() {
    const beatSec = musicBeatSeconds();
    return { bpm: getEffectiveBpm(), beatSec, barSec: beatSec * MUSIC_CONFIG.barBeats };
}

function cleanupMusicVoice(source) {
    const record = musicVoiceRecords.get(source);
    if (!record || record.cleaned) return;
    record.cleaned = true;
    scheduledMusicVoices.delete(source);
    musicVoiceRecords.delete(source);
    source.onended = null;
    for (const node of record.nodes) {
        try { if (node && typeof node.disconnect === 'function') node.disconnect(); } catch (_) {}
    }
}

function registerMusicVoice(source, nodes) {
    if (scheduledMusicVoices.size >= MUSIC_CONFIG.maxMusicVoices) {
        musicDroppedVoices++;
        for (const node of nodes) { try { if (node.disconnect) node.disconnect(); } catch (_) {} }
        return false;
    }
    const record = { nodes, cleaned: false };
    musicVoiceRecords.set(source, record);
    scheduledMusicVoices.add(source);
    source.onended = () => cleanupMusicVoice(source);
    return true;
}

function getMusicPulseWave(duty) {
    if (!audioCtx || typeof audioCtx.createPeriodicWave !== 'function') return null;
    if (!musicPulseWaves) musicPulseWaves = new Map();
    const key = String(duty);
    if (musicPulseWaves.has(key)) return musicPulseWaves.get(key);
    const real = new Float32Array(33);
    const imag = new Float32Array(33);
    for (let harmonic = 1; harmonic < real.length; harmonic++) {
        const angle = Math.PI * 2 * harmonic * duty;
        real[harmonic] = 2 * Math.sin(angle) / (Math.PI * harmonic);
        imag[harmonic] = 2 * (1 - Math.cos(angle)) / (Math.PI * harmonic);
    }
    try {
        const wave = audioCtx.createPeriodicWave(real, imag);
        musicPulseWaves.set(key, wave);
        return wave;
    } catch (_) { return null; }
}

function stopMusicVoices(fade = true) {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    for (const [source, record] of [...musicVoiceRecords]) {
        try {
            const envelope = record.nodes.find((node) => node && node.gain);
            if (fade && envelope && envelope.gain) {
                if (typeof envelope.gain.cancelScheduledValues === 'function') envelope.gain.cancelScheduledValues(now);
                envelope.gain.setValueAtTime(Math.max(0.0001, envelope.gain.value || 0.0001), now);
                envelope.gain.linearRampToValueAtTime(0.0001, now + 0.012);
            }
            source.stop(now + (fade ? 0.015 : 0.001));
        } catch (_) { cleanupMusicVoice(source); }
    }
}

function scheduleMusicTone(note, startTime, durationSeconds, layer, velocity, wave = 'triangle', accent = false, frequencySweep = null) {
    if (!canScheduleMusicAudio() || !musicBusReady || !(musicVolume() > 0) || !Number.isFinite(note) || note < 24 || note > 96) return false;
    if (scheduledMusicVoices.size >= MUSIC_CONFIG.maxMusicVoices) {
        musicDroppedVoices++;
        return false;
    }
    const now = audioCtx.currentTime;
    const start = Math.max(now + MUSIC_CONFIG.scheduleLeadSeconds, startTime);
    const duration = Math.max(0.025, durationSeconds);
    const source = audioCtx.createOscillator();
    const envelope = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();
    if (wave === 'pulseWide' || wave === 'pulseNarrow') {
        const pulse = getMusicPulseWave(wave === 'pulseWide' ? 0.25 : 0.125);
        if (pulse && typeof source.setPeriodicWave === 'function') source.setPeriodicWave(pulse);
        else source.type = 'square';
    } else source.type = wave;
    source.frequency.setValueAtTime(frequencySweep ? frequencySweep[0] : midiToFreq(note), start);
    if (frequencySweep) source.frequency.exponentialRampToValueAtTime(Math.max(20, frequencySweep[1]), start + Math.min(0.09, duration * 0.55));
    filter.type = wave === 'sawtooth' ? 'lowpass' : 'lowpass';
    filter.frequency.value = wave === 'sawtooth' ? 4200 : 12000;
    const layerBus = musicLayerBuses[layer] || musicLayerBuses.melody;
    const peak = Math.min(0.14, Math.max(0.002, velocity * (accent ? 0.85 : 0.68) * (MUSIC_ARRANGEMENTS[musicStyle] || MUSIC_ARRANGEMENTS.bitDuel).trim));
    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.linearRampToValueAtTime(peak, start + Math.min(0.018, duration * 0.18));
    envelope.gain.setValueAtTime(peak, Math.max(start + 0.02, start + duration * 0.72));
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.connect(envelope).connect(filter).connect(layerBus);
    if (!registerMusicVoice(source, [envelope, filter])) return false;
    try {
        source.start(start);
        source.stop(start + duration + 0.02);
    } catch (_) { cleanupMusicVoice(source); return false; }
    return true;
}

function getMusicNoiseBuffer() {
    if (!audioCtx || typeof audioCtx.createBuffer !== 'function') return null;
    if (musicNoiseBuffers.has(audioCtx)) return musicNoiseBuffers.get(audioCtx);
    const sampleRate = audioCtx.sampleRate || 44100;
    const buffer = audioCtx.createBuffer(1, Math.ceil(sampleRate * 0.16), sampleRate);
    const samples = buffer.getChannelData(0);
    let state = (musicSessionSeed ^ 0x4E4F4953) >>> 0;
    for (let index = 0; index < samples.length; index++) {
        state ^= state << 13; state ^= state >>> 17; state ^= state << 5;
        samples[index] = ((state >>> 0) / 2147483648) - 1;
    }
    musicNoiseBuffers.set(audioCtx, buffer);
    return buffer;
}

function scheduleMusicNoise(startTime, duration, velocity, type = 'hat') {
    if (!canScheduleMusicAudio() || !musicBusReady || musicVolume() <= 0) return false;
    if (scheduledMusicVoices.size >= MUSIC_CONFIG.maxMusicVoices) { musicDroppedVoices++; return false; }
    const now = audioCtx.currentTime;
    const start = Math.max(now + 0.02, startTime);
    const source = audioCtx.createBufferSource();
    const envelope = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();
    source.buffer = getMusicNoiseBuffer();
    filter.type = type === 'hat' ? 'highpass' : 'bandpass';
    filter.frequency.value = type === 'hat' ? 6800 : 2400;
    filter.Q.value = type === 'hat' ? 0.45 : 0.7;
    const peak = Math.min(0.09, Math.max(0.001, velocity * 0.09 * (MUSIC_ARRANGEMENTS[musicStyle] || MUSIC_ARRANGEMENTS.bitDuel).trim));
    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.linearRampToValueAtTime(peak, start + 0.002);
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.connect(envelope).connect(filter).connect(musicLayerBuses.drums);
    if (!registerMusicVoice(source, [envelope, filter])) return false;
    try { source.start(start); source.stop(start + duration + 0.005); }
    catch (_) { cleanupMusicVoice(source); return false; }
    return true;
}

function scheduleMusicEvent(event, barStart, beatSec) {
    const at = barStart + event.beat * beatSec + event.jitter;
    const duration = Math.max(0.025, event.durationBeats * beatSec);
    if (event.type === 'chord') {
        const notes = event.note;
        notes.forEach((note, index) => scheduleMusicTone(note, at + index * 0.004, duration, event.layer, event.velocity / Math.max(1, notes.length), event.wave, event.accent));
        return;
    }
    if (event.type === 'hat') { scheduleMusicNoise(at, 0.045, event.velocity, 'hat'); return; }
    if (event.type === 'snare') {
        scheduleMusicNoise(at, 0.11, event.velocity, 'snare');
        scheduleMusicTone(45, at, 0.12, 'drums', event.velocity * 0.18, 'triangle', false, [210, 85]);
        return;
    }
    if (event.type === 'kick') {
        scheduleMusicTone(33, at, 0.18, 'drums', event.velocity, 'sine', false, [150, 48]);
        return;
    }
    const wave = event.wave || (MUSIC_ARRANGEMENTS[musicStyle] || MUSIC_ARRANGEMENTS.bitDuel).wave;
    scheduleMusicTone(event.note, at, duration, event.layer, event.velocity, wave, event.accent);
}

function scheduleMusicBar(pattern, barStart, beatSec) {
    const events = pattern && pattern.events ? pattern.events : [];
    musicTransport.barStart = barStart;
    musicTransport.events = events;
    musicTransport.cursor = 0;
    musicTransport.barBeatSec = beatSec;
}

function generateTransportBarEvents(barIndex = musicTransport.barIndex) {
    let events = generateMusicBarEvents(musicStyle, barIndex, musicIntensity || 1, musicSessionSeed);
    if (musicTransport.scene === 'menu' || musicTransport.scene === 'onboarding') {
        const scale = musicTransport.scene === 'onboarding' ? 0.28 : 0.4;
        events = events
            .filter((event) => ['tone', 'lead', 'chord'].includes(event.type))
            .map((event) => ({ ...event, velocity: event.velocity * scale }));
    }
    return events;
}

function beginTransportBar(startTime) {
    musicTransport.barStart = startTime;
    musicTransport.events = generateTransportBarEvents();
    musicTransport.cursor = 0;
    musicTransport.barBeatSec = musicBeatSeconds();
}

function startMusic(scene = 'combat', resumePosition = null) {
    if (!audioCtx) initAudio();
    if (!audioCtx) return false;
    initMusicBus();
    musicTransport.scene = scene;
    if (musicTransport.running) {
        if (musicPaused && musicVolume() > 0) resumeMusic();
        return true;
    }
    musicTransport.running = true;
    musicTransport.style = musicStyle;
    musicTransport.barIndex = resumePosition && Number.isInteger(resumePosition.barIndex) ? Math.max(0, resumePosition.barIndex) : 0;
    musicBarIndex = musicTransport.barIndex;
    musicPaused = musicVolume() <= 0;
    const beatSec = musicBeatSeconds();
    const beat = resumePosition && Number.isFinite(resumePosition.beat) ? Math.max(0, Math.min(3.99, resumePosition.beat)) : 0;
    musicTransport.barStart = audioCtx.currentTime + MUSIC_CONFIG.scheduleLeadSeconds - beat * beatSec;
    musicTransport.pausedBeat = beat;
    beginTransportBar(musicTransport.barStart);
    if (beat > 0) {
        musicTransport.cursor = musicTransport.events.findIndex((event) => event.beat >= beat - 0.01);
        if (musicTransport.cursor < 0) musicTransport.cursor = musicTransport.events.length;
    }
    musicNextBar = musicTransport.barStart + musicTransport.barBeatSec * MUSIC_CONFIG.barBeats;
    applyLayerGains(0.08);
    tickMusic();
    if (typeof renderMusicNowPlaying === 'function') renderMusicNowPlaying();
    return true;
}

function pauseMusic() {
    musicResumeRequested = false;
    if (!musicTransport.running || musicPaused) return;
    const beatSec = musicTransport.barBeatSec || musicBeatSeconds();
    const now = audioCtx ? audioCtx.currentTime : musicTransport.barStart;
    musicTransport.pausedBeat = Math.max(0, Math.min(MUSIC_CONFIG.barBeats, (now - musicTransport.barStart) / beatSec));
    musicTransport.cursor = musicTransport.events.findIndex((event) => event.beat >= musicTransport.pausedBeat - 0.01);
    if (musicTransport.cursor < 0) musicTransport.cursor = musicTransport.events.length;
    musicPaused = true;
    stopMusicVoices(true);
}

function resumeMusic() {
    if (!musicTransport.running || !audioCtx || musicVolume() <= 0) return false;
    if (audioCtx.state !== 'running') { musicResumeRequested = true; return false; }
    const now = audioCtx.currentTime;
    const beatSec = musicBeatSeconds();
    if (musicTransport.pausedBeat >= MUSIC_CONFIG.barBeats - 0.02) {
        musicTransport.barIndex++;
        musicBarIndex = musicTransport.barIndex;
        musicTransport.pausedBeat = 0;
        beginTransportBar(now + MUSIC_CONFIG.scheduleLeadSeconds);
    } else {
        musicTransport.events = generateTransportBarEvents(musicTransport.barIndex);
        musicTransport.barBeatSec = beatSec;
        musicTransport.barStart = now + 0.04 - musicTransport.pausedBeat * beatSec;
        musicTransport.cursor = musicTransport.events.findIndex((event) => event.beat >= musicTransport.pausedBeat - 0.01);
        if (musicTransport.cursor < 0) musicTransport.cursor = musicTransport.events.length;
    }
    musicNextBar = musicTransport.barStart + beatSec * MUSIC_CONFIG.barBeats;
    musicPaused = false;
    musicResumeRequested = false;
    return true;
}

function stopMusic(reset = true) {
    const stoppedPreview = musicTransport.scene === 'preview';
    musicPaused = true;
    musicResumeRequested = false;
    stopMusicVoices(true);
    stopNoiseFloor();
    stopDroneVoices();
    stopPadNotes();
    musicEffects = { lowpass: null, bitcrush: null, stutterTimer: null };
    if (reset) {
        musicTransport.running = false;
        musicTransport.barIndex = 0;
        musicTransport.events = [];
        musicTransport.cursor = 0;
        musicTransport.pausedBeat = 0;
        musicTransport.previewUntil = 0;
        musicTransport.scene = 'stopped';
        if (stoppedPreview) musicPreviewSnapshot = null;
        musicNextBar = 0;
        musicBarIndex = 0;
    }
}

function tickMusic() {
    if (musicResumeRequested && audioCtx && audioCtx.state === 'running') resumeMusic();
    if (!musicTransport.running || musicPaused || !audioCtx || audioCtx.state !== 'running' || musicVolume() <= 0 || !musicBusReady) return;
    const now = audioCtx.currentTime;
    if (musicTransport.previewUntil && now >= musicTransport.previewUntil) {
        stopMusicPreview();
        return;
    }
    const horizon = now + MUSIC_CONFIG.lookaheadSeconds;
    let scheduled = 0;
    while (musicTransport.barStart < now - musicTransport.barBeatSec * MUSIC_CONFIG.barBeats) {
        musicTransport.barIndex++;
        musicBarIndex = musicTransport.barIndex;
        beginTransportBar(musicTransport.barStart + musicTransport.barBeatSec * MUSIC_CONFIG.barBeats);
        musicNextBar = musicTransport.barStart + musicTransport.barBeatSec * MUSIC_CONFIG.barBeats;
    }
    while (musicTransport.cursor < musicTransport.events.length && scheduled < MUSIC_CONFIG.maxMusicVoices) {
        const event = musicTransport.events[musicTransport.cursor];
        const eventTime = musicTransport.barStart + event.beat * musicTransport.barBeatSec + event.jitter;
        if (eventTime > horizon) break;
        musicTransport.cursor++;
        if (eventTime < now - 0.01) continue;
        scheduleMusicEvent(event, musicTransport.barStart, musicTransport.barBeatSec);
        scheduled++;
    }
    const barEnd = musicTransport.barStart + musicTransport.barBeatSec * MUSIC_CONFIG.barBeats;
    if (now >= barEnd - MUSIC_CONFIG.lookaheadSeconds && musicTransport.cursor >= musicTransport.events.length) {
        musicTransport.barIndex++;
        musicBarIndex = musicTransport.barIndex;
        beginTransportBar(barEnd);
        musicNextBar = barEnd + musicTransport.barBeatSec * MUSIC_CONFIG.barBeats;
    }
}

function getMusicTransportDiagnostics() {
    return {
        running: musicTransport.running, paused: musicPaused, scene: musicTransport.scene,
        style: musicTransport.style, barIndex: musicTransport.barIndex, cursor: musicTransport.cursor,
        eventCount: musicTransport.events.length, activeVoices: scheduledMusicVoices.size,
        droppedVoices: musicDroppedVoices, musicVoiceLimit: MUSIC_CONFIG.maxMusicVoices,
        contextState: audioCtx ? audioCtx.state : 'uninitialized'
    };
}

function getMusicRoutingDiagnostics() {
    return {
        layers: Object.fromEntries(Object.entries(musicLayerBuses).map(([name, bus]) => [name, bus.connections ? bus.connections.map((node) => node.id) : []])),
        effects: musicEffectsGain && musicEffectsGain.connections ? musicEffectsGain.connections.map((node) => node.id) : [],
        filter: musicThemeFilter && musicThemeFilter.connections ? musicThemeFilter.connections.map((node) => node.id) : [],
        transition: musicTransitionGain && musicTransitionGain.connections ? musicTransitionGain.connections.map((node) => node.id) : [],
        user: musicUserGain && musicUserGain.connections ? musicUserGain.connections.map((node) => node.id) : [],
        master: musicMasterGain && musicMasterGain.connections ? musicMasterGain.connections.map((node) => node.id) : []
    };
}

function musicDuck(durationMs = 200, reductionDb = 4) {
    if (!audioCtx || !musicTransitionGain || musicVolume() <= 0) return;
    const now = audioCtx.currentTime;
    const target = Math.pow(10, -reductionDb / 20);
    try {
        musicTransitionGain.gain.cancelScheduledValues(now);
        musicTransitionGain.gain.setValueAtTime(musicTransitionGain.gain.value, now);
        musicTransitionGain.gain.linearRampToValueAtTime(target, now + 0.015);
        musicTransitionGain.gain.linearRampToValueAtTime(1, now + Math.max(0.03, durationMs / 1000));
    } catch (_) { musicTransitionGain.gain.value = 1; }
}

function musicComboAccent() {
    if (!audioCtx || !musicBusReady || musicVolume() <= 0 || audioCtx.currentTime - musicLastAccent < 0.75) return;
    musicLastAccent = audioCtx.currentTime;
    musicCriticalHitLP();
    scheduleMusicTone(degreeToMidi(4), audioCtx.currentTime + MUSIC_CONFIG.scheduleLeadSeconds, 0.14, 'melody', 0.16, 'triangle', true);
}

function musicSpecialAccent() {
    if (!audioCtx || !musicBusReady || musicVolume() <= 0 || audioCtx.state !== 'running') return;
    const beatSec = musicBeatSeconds();
    const now = audioCtx.currentTime;
    const position = Math.max(0, (now - musicTransport.barStart) / beatSec);
    let delay = (Math.ceil(position * 4) / 4 - position) * beatSec;
    if (delay <= 0.001 || delay > 0.12) delay = MUSIC_CONFIG.scheduleLeadSeconds;
    scheduleMusicTone(degreeToMidi(4), now + delay, 0.22, 'melody', 0.2, (MUSIC_ARRANGEMENTS[musicStyle] || MUSIC_ARRANGEMENTS.bitDuel).wave, true);
}

function musicCriticalHitLP() {
    if (!audioCtx || !musicThemeFilter || musicVolume() <= 0) return;
    const now = audioCtx.currentTime;
    musicDuck(180, 3);
    try {
        musicThemeFilter.frequency.cancelScheduledValues(now);
        musicThemeFilter.frequency.setValueAtTime(musicThemeFilter.frequency.value, now);
        musicThemeFilter.frequency.linearRampToValueAtTime(1800, now + 0.05);
        musicThemeFilter.frequency.linearRampToValueAtTime(18000, now + (MUSIC_CONFIG.criticalLpSeconds || 0.9));
    } catch (_) { musicThemeFilter.frequency.value = 18000; }
}

function musicStutter(durationMs = 60) {
    if (!audioCtx || !musicTransitionGain || musicVolume() <= 0) return;
    const chopMs = Math.max(MUSIC_CONFIG.stutterMs.min, Math.min(MUSIC_CONFIG.stutterMs.max, durationMs));
    const now = audioCtx.currentTime;
    const total = Math.min(0.165, Math.max(0.12, (chopMs * 2) / 1000));
    const cut = total / 2;
    const gate = musicTransitionGain.gain;
    const duck = Math.pow(10, -6 / 20);
    try {
        gate.cancelScheduledValues(now);
        gate.setValueAtTime(gate.value, now);
        gate.linearRampToValueAtTime(duck, now + 0.015);
        for (let i = 0; i < 2; i++) {
            const start = now + 0.015 + i * cut;
            gate.linearRampToValueAtTime(duck * 0.12, start + cut * 0.18);
            gate.linearRampToValueAtTime(duck, start + cut * 0.62);
        }
        gate.linearRampToValueAtTime(1, now + 0.015 + total);
    } catch (_) { gate.value = 1; }
}

function playMusicCue(degrees, durations, direction = 0) {
    if (!audioCtx || !musicBusReady || musicVolume() <= 0 || audioCtx.state !== 'running') return;
    const now = audioCtx.currentTime + MUSIC_CONFIG.scheduleLeadSeconds;
    const beat = 60 / ((MUSIC_STYLES[musicStyle] || MUSIC_STYLES.bitDuel).bpm);
    const notes = degrees.map((degree) => degreeToMidi(degree));
    notes.forEach((note, index) => scheduleMusicTone(note, now + durations.slice(0, index).reduce((a, b) => a + b, 0) * beat,
        durations[index] * beat * 0.84, 'melody', 0.24, 'triangle', index === 0));
    if (direction < 0) musicDuck(320, 2);
}

function playMusicRoundCue(outcome = null) {
    stopMusic(true);
    const degrees = outcome === true ? [0, 2, 4] : outcome === false ? [4, 2, 0] : [0, 3, 0];
    playMusicCue(degrees, [0.35, 0.35, 0.6], outcome === false ? -1 : 0);
}

function musicPitchDrop(playerWon = true) {
    stopMusic(true);
    playMusicCue(playerWon ? [0, 2, 4, 0] : [4, 2, 1, 0], [0.45, 0.45, 0.45, 1], playerWon ? 0 : -1);
}

function startMusicPreview(style = 'bitDuel') {
    if (!MUSIC_STYLES[style]) style = 'bitDuel';
    if (!audioCtx) initAudio();
    if (!audioCtx) return false;
    initMusicBus();
    if (musicTransport.running && musicTransport.scene !== 'preview') {
        const beat = Math.max(0, Math.min(3.99, (audioCtx.currentTime - musicTransport.barStart) / (musicTransport.barBeatSec || musicBeatSeconds())));
        musicPreviewSnapshot = { style: musicStyle, scene: musicTransport.scene, wasRunning: true,
            barIndex: musicTransport.barIndex, beat, intensity: musicIntensity };
    } else if (!musicPreviewSnapshot) musicPreviewSnapshot = { style: musicStyle, wasRunning: false, barIndex: 0, pausedBeat: 0 };
    stopMusic(true);
    setMusicStyle(style);
    musicIntensity = 2;
    musicTransport.intensity = 2;
    startMusic('preview');
    musicTransport.previewUntil = audioCtx.currentTime + 8;
    return true;
}

function stopMusicPreview() {
    if (musicTransport.scene !== 'preview') return false;
    const snapshot = musicPreviewSnapshot;
    stopMusic(true);
    musicPreviewSnapshot = null;
    if (snapshot && snapshot.wasRunning) {
        setMusicStyle(snapshot.style);
        musicIntensity = snapshot.intensity || 1;
        musicTransport.intensity = musicIntensity;
        applyLayerGains(0.2);
        startMusic(snapshot.scene || 'menu', snapshot);
    } else if (snapshot) setMusicStyle(snapshot.style);
    if (typeof renderMusicPreviewButton === 'function') renderMusicPreviewButton();
    return true;
}

function startMenuMusic(scene = 'menu') {
    if (musicTransport.running && musicTransport.scene === scene && !musicPaused) return true;
    setMusicStyle(musicStyle || 'bitDuel');
    musicIntensity = 1;
    musicTransport.intensity = 1;
    applyLayerGains(0.2);
    return startMusic(scene);
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

    o.connect(g).connect(audioOutputGain || audioCtx.destination);
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
