let audioCtx;

function initAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

function playHitSound() {
    initAudio();
    if (!audioCtx) return;

    const o = audioCtx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = 180;

    const g = audioCtx.createGain();
    g.gain.value = 0.2;

    o.connect(g).connect(audioCtx.destination);
    o.start();
    setTimeout(() => o.stop(), 80);
}

function playPunchSound() {
    initAudio();
    if (!audioCtx) return;

    const o = audioCtx.createOscillator();
    o.type = 'square';
    o.frequency.value = 420;

    const g = audioCtx.createGain();
    g.gain.value = 0.15;

    o.connect(g).connect(audioCtx.destination);
    o.start();
    setTimeout(() => { o.frequency.value = 120; }, 40);
    setTimeout(() => o.stop(), 120);
}
