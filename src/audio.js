let audioCtx;
const AUDIO_STORAGE_KEY = 'glitchDuelAudioVolumes';
const audioVolumes = loadAudioVolumes();
let musicState = null;
let musicIntensity = 0;
let musicPaused = false;
let musicNextBar = 0;
let musicBarIndex = 0;
let musicEffects = { lowpass: null, bitcrush: null, stutterTimer: null };
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

function noteAt(root, offset) {
    return MUSIC_CONFIG.notePool[(root + offset + MUSIC_CONFIG.notePool.length) % MUSIC_CONFIG.notePool.length];
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

function scheduleMusicNote(note, startTime, duration, gain = 1, effect = '') {
    const vol = musicVolume() * AUDIO_CONFIG.mixGain * gain;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    const w = effect === 'glitch' ? 'sawtooth' : (effect === 'bass' ? 'sawtooth' : (effect === 'melody' ? 'triangle' : 'square'));
    o.type = w;
    o.frequency.setValueAtTime(midiToFreq(note), startTime);
    if (effect === 'glitch') {
        o.type = 'square';
        g.gain.setValueAtTime(Math.min(0.3, vol * 0.8), startTime);
        g.gain.linearRampToValueAtTime(0.0001, startTime + duration * 0.5);
    } else if (effect === 'bass') {
        g.gain.setValueAtTime(0, startTime);
        g.gain.linearRampToValueAtTime(Math.min(0.4, vol * 0.6), startTime + 0.02);
        g.gain.setValueAtTime(Math.min(0.4, vol * 0.6), startTime + duration - 0.03);
        g.gain.linearRampToValueAtTime(0.0001, startTime + duration);
    } else {
        g.gain.setValueAtTime(0, startTime);
        g.gain.linearRampToValueAtTime(Math.min(0.4, vol), startTime + 0.005);
        g.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    }
    o.connect(g).connect(audioCtx.destination);
    o.start(startTime);
    o.stop(startTime + duration + 0.05);
    return { o, g };
}

function buildMusicPattern(intensity) {
    const beatMs = 60000 / MUSIC_CONFIG.bpm;
    const beatSec = beatMs / 1000;
    const pool = MUSIC_CONFIG.notePool;
    const rootIdx = 2;
    const patterns = {
        1: { // low intensity — clean, minimal
            drums: ({ beat }) => (beat % 4 === 0 ? { hit: true, gain: 0.5 } : (beat % 2 === 0 ? { hit: true, gain: 0.3 } : null)),
            bass: ({ beat }) => (beat % 8 === 0 ? { note: pool[rootIdx], gain: 0.6, dur: beatSec * 4 } : null),
            melody: ({ beat }) => (beat % 8 === 0 ? { note: pool[rootIdx + 4], gain: 0.4, dur: beatSec * 2 } : null),
            glitch: () => null
        },
        2: { // medium intensity — add movement
            drums: ({ beat }) => (beat % 2 === 0 ? { hit: true, gain: 0.55 } :
                (beat % 3 === 0 ? { hit: true, gain: 0.35 } : null)),
            bass: ({ beat }) => {
                const patterns = [
                    { note: pool[rootIdx], dur: beatSec * 4 },
                    { note: pool[rootIdx - 2], dur: beatSec * 4 }
                ];
                return patterns[Math.floor(beat / 8) % patterns.length];
            },
            melody: ({ beat }) => (beat % 4 === 0 ? { note: pool[rootIdx + 3 + (Math.floor(beat / 8) % 3)], gain: 0.5, dur: beatSec * 1.5 } : null),
            glitch: ({ beat }) => (beat % 12 === 0 ? { note: pool[Math.floor(Math.random() * pool.length)], gain: 0.25, dur: beatSec * 0.5 } : null)
        },
        3: { // high intensity — aggressive, dense
            drums: ({ beat }) => ({ hit: true, gain: 0.5 + (beat % 4 === 0 ? 0.15 : 0) }),
            bass: ({ beat }) => {
                const notes = [pool[rootIdx], pool[rootIdx - 1], pool[rootIdx - 2], pool[rootIdx - 3]];
                return { note: notes[beat % 4], dur: beatSec * 1.5, gain: 0.7 };
            },
            melody: ({ beat }) => {
                if (beat % 2 !== 0) return null;
                const notes = [pool[rootIdx + 4], pool[rootIdx + 5], pool[rootIdx + 3], pool[rootIdx + 7]];
                return { note: notes[(Math.floor(beat / 2)) % 4], gain: 0.55, dur: beatSec * 0.8 };
            },
            glitch: ({ beat }) => {
                if (beat % 6 !== 0) return null;
                return { note: pool[Math.floor(Math.random() * pool.length)], gain: 0.35, dur: beatSec * 0.25 + Math.random() * 0.1 };
            }
        }
    };
    return patterns[intensity] || patterns[1];
}

function scheduleMusicBar(pattern, barStart, beatSec) {
    if (!audioCtx || musicPaused) return;
    const beats = 16;
    const prevEff = musicEffects;
    for (let b = 0; b < beats; b++) {
        const beat = { beat: b, total: beats };
        const layers = ['drums', 'bass', 'melody', 'glitch'];
        for (const layer of layers) {
            const note = pattern[layer](beat);
            if (!note) continue;
            const t = barStart + b * beatSec;
            const gainAdj = MUSIC_CONFIG.layers[layer] || 0.25;
            if (layer === 'drums') {
                const freq = b % 4 === 0 ? 150 : 200;
                const d = b % 4 === 0 ? 0.12 : 0.06;
                const g = note.gain * gainAdj * musicVolume() * AUDIO_CONFIG.mixGain;
                const o = audioCtx.createOscillator();
                const gn = audioCtx.createGain();
                o.type = 'square';
                o.frequency.setValueAtTime(freq, t);
                o.frequency.exponentialRampToValueAtTime(80, t + d);
                gn.gain.setValueAtTime(Math.min(0.3, g), t);
                gn.gain.linearRampToValueAtTime(0.0001, t + d);
                o.connect(gn).connect(audioCtx.destination);
                o.start(t); o.stop(t + d + 0.01);
            } else {
                scheduleMusicNote(note.note || 60, t, note.dur || beatSec, note.gain || 1, layer);
            }
        }
    }
}

function startMusic() {
    stopMusic();
    if (!audioCtx) return;
    if (musicVolume() <= 0) return;
    musicPaused = false;
    musicNextBar = audioCtx.currentTime;
    musicBarIndex = 0;
}

function tickMusic() {
    if (musicPaused || !audioCtx || musicVolume() <= 0) return;
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
    } catch (_) { /* filter failed */ }
}

function musicPitchDrop() {
    if (!audioCtx || musicVolume() <= 0) return;
    stopMusic();
    const dur = MUSIC_CONFIG.pitchDropSeconds || 0.6;
    const vol = musicVolume() * AUDIO_CONFIG.mixGain * 0.3;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(220, audioCtx.currentTime);
    o.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + dur);
    g.gain.setValueAtTime(Math.min(0.3, vol), audioCtx.currentTime);
    g.gain.linearRampToValueAtTime(0.0001, audioCtx.currentTime + dur + 0.2);
    o.connect(g).connect(audioCtx.destination);
    o.start(); o.stop(audioCtx.currentTime + dur + 0.3);
}

function musicStutter(durationMs = 60) {
    if (!audioCtx || musicVolume() <= 0) return;
    const beatMs = 60000 / MUSIC_CONFIG.bpm;
    const chopMs = Math.max(MUSIC_CONFIG.stutterMs.min, Math.min(MUSIC_CONFIG.stutterMs.max, durationMs));
    const chops = Math.max(2, Math.floor(30 / chopMs));
    const vol = musicVolume() * AUDIO_CONFIG.mixGain * 0.15;
    for (let i = 0; i < chops; i++) {
        const t = audioCtx.currentTime + (i * chopMs) / 1000;
        const dur = chopMs / 1000 * 0.8;
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.type = 'square';
        o.frequency.setValueAtTime(200 + Math.random() * 100, t);
        g.gain.setValueAtTime(Math.min(0.2, vol), t);
        g.gain.linearRampToValueAtTime(0.0001, t + dur);
        o.connect(g).connect(audioCtx.destination);
        o.start(t); o.stop(t + dur + 0.01);
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
