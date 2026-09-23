let audioCtx;
const AUDIO_STORAGE_KEY = 'glitchDuelAudioVolumes';
const audioVolumes = loadAudioVolumes();

// Music system state
let musicState = null;
let musicIntensity = 0;
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
    if (!audioCtx || musicMasterGain) return;
    musicMasterGain = audioCtx.createGain();
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

function scheduleDrumKick(time, gain = 0.5) {
    if (!audioCtx || musicVolume() <= 0) return;
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

function scheduleDrumSnare(time, gain = 0.4) {
    if (!audioCtx || musicVolume() <= 0) return;
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
    sine.connect(sg).connect(musicMasterGain);
    noise.connect(ng).connect(nf).connect(musicMasterGain);
    sine.start(time); sine.stop(time + 0.2);
    noise.start(time); noise.stop(time + 0.15);
}

function scheduleDrumHat(time, gain = 0.25, closed = true) {
    if (!audioCtx || musicVolume() <= 0) return;
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
    const rootIdx = 2;
    if (!melodyPhrases[intensity]) {
        const phrases = {
            1: [
                [pool[rootIdx + 4], pool[rootIdx + 4], pool[rootIdx + 5], pool[rootIdx + 4]],
                [pool[rootIdx + 7], pool[rootIdx + 5], pool[rootIdx + 4], pool[rootIdx + 2]]
            ],
            2: [
                [pool[rootIdx + 4], pool[rootIdx + 6], pool[rootIdx + 5], pool[rootIdx + 4], pool[rootIdx + 3], pool[rootIdx + 5], pool[rootIdx + 4], pool[rootIdx + 2]],
                [pool[rootIdx + 7], pool[rootIdx + 6], pool[rootIdx + 5], pool[rootIdx + 7], pool[rootIdx + 4], pool[rootIdx + 5], pool[rootIdx + 4], pool[rootIdx + 2]]
            ],
            3: [
                [pool[rootIdx + 4], pool[rootIdx + 5], pool[rootIdx + 7], pool[rootIdx + 5], pool[rootIdx + 4], pool[rootIdx + 3], pool[rootIdx + 4], pool[rootIdx + 6],
                 pool[rootIdx + 7], pool[rootIdx + 8], pool[rootIdx + 7], pool[rootIdx + 5], pool[rootIdx + 4], pool[rootIdx + 2], pool[rootIdx + 1], pool[rootIdx + 2]]
            ]
        };
        melodyPhrases[intensity] = phrases[intensity] || phrases[1];
    }
    const phraseArr = melodyPhrases[intensity];
    return phraseArr[barIndex % phraseArr.length];
}

function scheduleBassNote(note, time, duration, gain = 0.5) {
    if (!audioCtx || musicVolume() <= 0) return;
    const vol = musicVolume() * AUDIO_CONFIG.mixGain * gain;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(midiToFreq(note), time);
    g.gain.setValueAtTime(0, time);
    g.gain.linearRampToValueAtTime(Math.min(0.35, vol * 0.6), time + 0.025);
    g.gain.setValueAtTime(Math.min(0.35, vol * 0.6), time + duration - 0.04);
    g.gain.linearRampToValueAtTime(0.0001, time + duration);
    const dist = createWaveShaper(0.6);
    o.connect(g).connect(dist).connect(musicMasterGain);
    o.start(time); o.stop(time + duration + 0.05);
}

function scheduleMelodyNote(note, time, duration, gain = 0.4) {
    if (!audioCtx || musicVolume() <= 0) return;
    const vol = musicVolume() * AUDIO_CONFIG.mixGain * gain;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(midiToFreq(note), time);
    g.gain.setValueAtTime(0, time);
    g.gain.linearRampToValueAtTime(Math.min(0.3, vol), time + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    const chorusDelay = audioCtx.createDelay(0.05);
    const chorusMod = audioCtx.createGain();
    chorusDelay.delayTime.value = 0.012;
    chorusMod.gain.value = 0;
    const mod = audioCtx.createOscillator();
    mod.type = 'sine';
    mod.frequency.value = 2.4;
    const modGain = audioCtx.createGain();
    modGain.gain.value = 0.006;
    mod.connect(modGain);
    modGain.connect(chorusDelay.delayTime);
    mod.start();
    o.connect(g).connect(musicMasterGain);
    g.connect(chorusDelay);
    chorusDelay.connect(chorusMod).connect(musicMasterGain);
    o.start(time); o.stop(time + duration + 0.05);
    chorusMod.gain.setValueAtTime(0.12, time);
    chorusMod.gain.linearRampToValueAtTime(0.0001, time + duration);
}

function scheduleGlitchNote(note, time, duration, gain = 0.2) {
    if (!audioCtx || musicVolume() <= 0) return;
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

function schedulePadNote(time, gain = 0.08) {
    if (!audioCtx || musicVolume() <= 0) return;
    const vol = musicVolume() * AUDIO_CONFIG.mixGain * gain;
    const base = MUSIC_CONFIG.notePool[2];
    const fifth = base + 7;
    const rates = [base, fifth];
    const oscs = [];
    for (const r of rates) {
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.type = 'sine';
        o.frequency.value = midiToFreq(r);
        g.gain.setValueAtTime(0, time);
        g.gain.linearRampToValueAtTime(Math.min(0.12, vol * 0.4), time + 0.4);
        const chorusDelay = audioCtx.createDelay(0.05);
        chorusDelay.delayTime.value = 0.018;
        const mod = audioCtx.createOscillator();
        mod.type = 'sine';
        mod.frequency.value = 1.8;
        const modGain = audioCtx.createGain();
        modGain.gain.value = 0.005;
        mod.connect(modGain);
        modGain.connect(chorusDelay.delayTime);
        mod.start();
        o.connect(g).connect(musicMasterGain);
        g.connect(chorusDelay);
        chorusDelay.connect(audioCtx.createGain()).connect(musicMasterGain);
        o.start(time);
        musicPadOscillators.push({ o, g, mod, modGain, chorusDelay });
        oscs.push(o);
    }
}

function stopPadNotes() {
    for (const entry of musicPadOscillators) {
        try { entry.o.stop(); } catch (_) {}
        try { entry.g.disconnect(); } catch (_) {}
        try { entry.mod.stop(); } catch (_) {}
        try { entry.modGain.disconnect(); } catch (_) {}
        try { entry.chorusDelay.disconnect(); } catch (_) {}
    }
    musicPadOscillators = [];
}

function musicVolume() {
    return audioVolumes.music !== undefined ? audioVolumes.music : AUDIO_CONFIG.music;
}

function scheduleMusicNode(type, note, startTime, duration, gain) {
    if (!audioCtx || musicVolume() <= 0 || musicPaused) return null;
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

function buildMusicPattern(intensity) {
    const beatMs = 60000 / MUSIC_CONFIG.bpm;
    const beatSec = beatMs / 1000;
    const pool = MUSIC_CONFIG.notePool;
    const rootIdx = 2;
    const patterns = {
        1: {
            drums: ({ beat }) => {
                if (beat % 4 === 0) return { type: 'kick', gain: 0.45 };
                if (beat % 8 === 6) return { type: 'snare', gain: 0.3 };
                if (beat % 4 === 2) return { type: 'hat', gain: 0.15 };
                return null;
            },
            bass: ({ beat }) => (beat % 8 === 0 ? { note: pool[rootIdx], gain: 0.45, dur: beatSec * 4 } : null),
            melody: ({ beat }) => {
                if (beat % 8 !== 0) return null;
                return { note: pool[rootIdx + 4], gain: 0.35, dur: beatSec * 2 };
            },
            glitch: () => null,
            pad: () => null
        },
        2: {
            drums: ({ beat }) => {
                if (beat % 4 === 0) return { type: 'kick', gain: 0.5 };
                if (beat % 4 === 2) return { type: 'snare', gain: 0.4 };
                if (beat === 1 || beat === 3 || beat === 9 || beat === 11) return { type: 'hat', gain: 0.18 };
                return null;
            },
            bass: ({ beat }) => {
                const pats = [
                    { note: pool[rootIdx], gain: 0.5, dur: beatSec * 4 },
                    { note: pool[rootIdx - 2], gain: 0.5, dur: beatSec * 4 }
                ];
                return pats[Math.floor(beat / 8) % pats.length];
            },
            melody: ({ beat }) => {
                if (beat % 4 !== 0) return null;
                return { note: pool[rootIdx + 3 + (Math.floor(beat / 8) % 3)], gain: 0.4, dur: beatSec * 1.5 };
            },
            glitch: ({ beat }) => {
                if (beat % 12 !== 0) return null;
                return { note: pool[(beat + Math.floor(beat / 12)) % pool.length], gain: 0.2, dur: beatSec * 0.5 };
            },
            pad: () => ({ gain: 0.07 })
        },
        3: {
            drums: ({ beat }) => {
                if (beat % 4 === 0 || beat % 8 === 6) return { type: 'kick', gain: 0.55 };
                if (beat % 4 === 2) return { type: 'kick', gain: 0.35 };
                if (beat % 4 === 3 || beat % 8 === 5) return { type: 'snare', gain: 0.45 };
                if (beat % 2 === 1) return { type: 'hat', gain: 0.2 };
                return { type: 'hat', gain: 0.12 };
            },
            bass: ({ beat }) => {
                const notes = [pool[rootIdx], pool[rootIdx - 1], pool[rootIdx - 2], pool[rootIdx - 3]];
                return { note: notes[beat % 4], gain: 0.55, dur: beatSec * 1.5 };
            },
            melody: ({ beat }) => {
                if (beat % 2 !== 0) return null;
                return { note: pool[rootIdx + 4 + (Math.floor(beat / 2) % 4)], gain: 0.45, dur: beatSec * 0.8 };
            },
            glitch: ({ beat }) => {
                if (beat % 6 !== 0) return null;
                return { note: pool[(beat + Math.floor(beat / 6) * 3) % pool.length], gain: 0.25, dur: beatSec * 0.3 };
            },
            pad: () => ({ gain: 0.1 })
        }
    };
    return patterns[intensity] || patterns[1];
}

function scheduleMusicBar(pattern, barStart, beatSec) {
    if (!audioCtx || musicPaused) return;
    const beats = 16;
    const melodyPhrase = buildMelodyPhrase(musicIntensity || 1, musicBarIndex);
    let padScheduled = false;
    for (let b = 0; b < beats; b++) {
        const beat = { beat: b, total: beats };
        const t = barStart + b * beatSec;
        const drum = pattern.drums(beat);
        if (drum && drum.type === 'kick') scheduleDrumKick(t, drum.gain);
        else if (drum && drum.type === 'snare') scheduleDrumSnare(t, drum.gain);
        else if (drum && drum.type === 'hat') scheduleDrumHat(t, drum.gain);
        const bass = pattern.bass(beat);
        if (bass) scheduleBassNote(bass.note, t, bass.dur, bass.gain);
        const mel = pattern.melody(beat);
        if (mel) scheduleMelodyNote(melodyPhrase[Math.floor(b * melodyPhrase.length / beats) % melodyPhrase.length], t, mel.dur, mel.gain);
        const gl = pattern.glitch(beat);
        if (gl) scheduleGlitchNote(gl.note, t, gl.dur, gl.gain);
        if (!padScheduled && pattern.pad && pattern.pad(beat)) {
            schedulePadNote(t, pattern.pad(beat).gain);
            padScheduled = true;
        }
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
    const beatSec = 60000 / MUSIC_CONFIG.bpm / 1000;
    const pattern = buildMusicPattern(musicIntensity || 1);
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
