let player1;
let player2;
let floatingTexts = [];
let impactParticles = [];
let keys = {};
let gameState = 'menu';
let mobileControlsEnabled = false;
let screenShake = 0;
let hitStopFrames = 0;
let selectedDifficulty = 'normal';
let statusMessage = '';
let statusTimer = 0;
let currentRound = 1;
let playerRounds = 0;
let cpuRounds = 0;
let roundTimerFrames = ROUND_TIMER_FRAMES;
let roundTimeMs = ROUND_TIME_MS;
let selectedArena = 'notebook';
let stats = loadStats();
let reducedMotionEnabled = loadReducedMotionPreference();
let lastFrameTimestamp = null;

function getDifficultyConfig() {
    return DIFFICULTIES[selectedDifficulty] || DIFFICULTIES.normal;
}

function setDifficulty(value) {
    selectedDifficulty = DIFFICULTIES[value] ? value : 'normal';
}

function showStatusMessage(text, frames = 80) {
    statusMessage = text;
    statusTimer = frames;
}

function setRoundTimerFrames(value) {
    roundTimerFrames = Math.max(0, value);
    roundTimeMs = roundTimerFrames * (1000 / 60);
}

function setRoundTimeMs(value) {
    roundTimeMs = Math.max(0, value);
    roundTimerFrames = Math.ceil(roundTimeMs / (1000 / 60));
}

function setArena(value) {
    selectedArena = ARENAS[value] ? value : 'notebook';
}

function loadReducedMotionPreference() {
    try {
        return window.localStorage && window.localStorage.getItem('xkcdKombatReducedMotion') === 'true';
    } catch (_) {
        return false;
    }
}

function saveReducedMotionPreference() {
    try {
        if (window.localStorage) window.localStorage.setItem('xkcdKombatReducedMotion', String(reducedMotionEnabled));
    } catch (_) {
        // localStorage can be unavailable in private browsing or tests.
    }
}

function setReducedMotion(value) {
    reducedMotionEnabled = !!value;
    renderMotionPreference();
    saveReducedMotionPreference();
}

function renderMotionPreference() {
    const toggle = document.getElementById('reduce-motion-toggle');
    if (toggle) toggle.checked = reducedMotionEnabled;
}

function getArenaConfig() {
    return ARENAS[selectedArena] || ARENAS.notebook;
}

function loadStats() {
    const defaults = { wins: 0, losses: 0, currentStreak: 0, bestStreak: 0 };

    try {
        const raw = window.localStorage && window.localStorage.getItem('xkcdKombatStats');
        return raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
    } catch (_) {
        return defaults;
    }
}

function saveStats() {
    try {
        if (window.localStorage) window.localStorage.setItem('xkcdKombatStats', JSON.stringify(stats));
    } catch (_) {
        // localStorage can be unavailable in private browsing or tests.
    }
}

function recordMatchResult(playerWon) {
    if (playerWon) {
        stats.wins++;
        stats.currentStreak++;
        stats.bestStreak = Math.max(stats.bestStreak, stats.currentStreak);
    } else {
        stats.losses++;
        stats.currentStreak = 0;
    }

    saveStats();
    renderStats();
}

function renderStats() {
    const statsSummary = document.getElementById('stats-summary');
    if (!statsSummary) return;

    statsSummary.textContent = `Victorias: ${stats.wins} | Derrotas: ${stats.losses} | Racha: ${stats.currentStreak} | Mejor: ${stats.bestStreak}`;
}

function renderPauseSummary() {
    const summary = document.getElementById('pause-summary');
    if (!summary || !player1 || !player2) return;

    const difficulty = DIFFICULTIES[selectedDifficulty] ? selectedDifficulty.toUpperCase() : 'NORMAL';
    const arena = getArenaConfig().label;
    const seconds = Math.ceil(roundTimeMs / 1000);

    summary.textContent = `Round ${currentRound} | Marcador ${playerRounds}-${cpuRounds} | Tiempo ${seconds}s | Dificultad ${difficulty} | Arena ${arena} | Controles: A/D/W/C/S/J/K/L, P o Esc para reanudar`;
}

function resizeCanvas() {
    const aspectRatio = WIDTH / HEIGHT;
    const maxDisplayWidth = Math.max(160, window.innerWidth - 24);
    const maxDisplayHeight = Math.max(120, window.innerHeight * 0.72);
    const displayWidth = Math.min(maxDisplayWidth, maxDisplayHeight * aspectRatio);
    const displayHeight = displayWidth / aspectRatio;
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DEVICE_PIXEL_RATIO);
    const backingWidth = Math.round(displayWidth * dpr);
    const backingHeight = Math.round(displayHeight * dpr);

    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;

    if (canvas.width !== backingWidth || canvas.height !== backingHeight) {
        canvas.width = backingWidth;
        canvas.height = backingHeight;
    }

    ctx.setTransform(backingWidth / WIDTH, 0, 0, backingHeight / HEIGHT, 0, 0);
    updateOrientationWarning();
}

function updateOrientationWarning() {
    const warning = document.getElementById('orientation-warning');
    const isTouch = mobileControlsEnabled || 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isPortraitPhone = isTouch && window.innerHeight > window.innerWidth && window.innerWidth <= 760;

    warning.style.display = isPortraitPhone && gameState === 'playing' ? 'block' : 'none';
}

function startRound() {
    player1 = new Fighter(250, true);
    player2 = new Fighter(750, false);
    floatingTexts = [];
    impactParticles = [];
    keys = {};
    screenShake = 0;
    hitStopFrames = 0;
    roundTimerFrames = ROUND_TIMER_FRAMES;
    roundTimeMs = ROUND_TIME_MS;
    gameState = 'playing';
    showStatusMessage(`ROUND ${currentRound}`, 75);
    document.getElementById('game-over').style.display = 'none';
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('help-screen').style.display = 'none';
    document.getElementById('pause-screen').style.display = 'none';
    updateControlsVisibility();
}

function initGame() {
    currentRound = 1;
    playerRounds = 0;
    cpuRounds = 0;
    startRound();
}

function showMainMenu() {
    player1 = new Fighter(250, true);
    player2 = new Fighter(750, false);
    floatingTexts = [];
    impactParticles = [];
    keys = {};
    screenShake = 0;
    hitStopFrames = 0;
    statusMessage = '';
    statusTimer = 0;
    currentRound = 1;
    playerRounds = 0;
    cpuRounds = 0;
    roundTimerFrames = ROUND_TIMER_FRAMES;
    roundTimeMs = ROUND_TIME_MS;
    gameState = 'menu';
    document.getElementById('game-over').style.display = 'none';
    document.getElementById('main-menu').style.display = 'flex';
    document.getElementById('help-screen').style.display = 'none';
    document.getElementById('pause-screen').style.display = 'none';
    renderStats();
    updateControlsVisibility();
}

function showHelpScreen() {
    gameState = 'menu';
    document.getElementById('game-over').style.display = 'none';
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('help-screen').style.display = 'flex';
    document.getElementById('pause-screen').style.display = 'none';
    updateControlsVisibility();
}

function hideHelpScreen() {
    document.getElementById('help-screen').style.display = 'none';
    document.getElementById('main-menu').style.display = 'flex';
    document.getElementById('pause-screen').style.display = 'none';
    gameState = 'menu';
    updateControlsVisibility();
}

function pauseGame() {
    if (gameState !== 'playing') return;

    keys = {};
    gameState = 'paused';
    renderPauseSummary();
    document.getElementById('pause-screen').style.display = 'flex';
    updateControlsVisibility();
}

function resumeGame() {
    if (gameState !== 'paused') return;

    keys = {};
    gameState = 'playing';
    document.getElementById('pause-screen').style.display = 'none';
    updateControlsVisibility();
}

function togglePause() {
    if (gameState === 'playing') pauseGame();
    else if (gameState === 'paused') resumeGame();
}

function checkCollision() {
    const dist = Math.abs(player1.x - player2.x);

    if (dist < 65 && Math.abs(player1.y - player2.y) < 80) {
        const push = (65 - dist) / 2;

        if (player1.x < player2.x) {
            player1.x -= push;
            player2.x += push;
        } else {
            player1.x += push;
            player2.x -= push;
        }
    }
}

function update(deltaMs = 1000 / 60) {
    if (gameState !== 'playing') return;

    if (hitStopFrames > 0) {
        hitStopFrames--;
        updateEffects();
        return;
    }

    player1.update(keys, player2);
    if (hitStopFrames === 0) player2.update(keys, player1);
    if (hitStopFrames === 0) checkCollision();
    updateEffects();

    if (player1.health <= 0 || player2.health <= 0) {
        finishRound(player2.health <= 0);
        return;
    }

    updateRoundTimer(deltaMs);
}

function finishRound(playerWon) {
    if (gameState !== 'playing') return;

    if (playerWon === true) playerRounds++;
    else if (playerWon === false) cpuRounds++;

    document.getElementById('pause-screen').style.display = 'none';

    if (playerRounds >= ROUNDS_TO_WIN || cpuRounds >= ROUNDS_TO_WIN) {
        gameState = 'gameOver';
        showStatusMessage('K.O.', 180);
        recordMatchResult(playerRounds >= ROUNDS_TO_WIN);
        const winText = document.getElementById('winner-text');
        winText.innerHTML = playerRounds >= ROUNDS_TO_WIN ? '¡SISTEMA DOMINADO!<br>😎' : '¡LA MÁQUINA GANA!<br>🤖';
        document.getElementById('game-over').style.display = 'block';
        updateControlsVisibility();
        return;
    }

    gameState = 'roundOver';
    const roundMessage = playerWon === null ? 'EMPATE' : (playerWon ? 'ROUND HUMANO' : 'ROUND CPU');
    showStatusMessage(roundMessage, 90);
    updateControlsVisibility();
    setTimeout(() => {
        currentRound++;
        startRound();
    }, 1400);
}

function updateRoundTimer(deltaMs = 1000 / 60) {
    if (roundTimeMs <= 0) return;

    roundTimeMs = Math.max(0, roundTimeMs - deltaMs);
    roundTimerFrames = Math.ceil(roundTimeMs / (1000 / 60));

    if (roundTimeMs > 0) return;

    showStatusMessage('TIME!', 90);

    if (player1.health === player2.health) {
        finishRound(null);
    } else {
        finishRound(player1.health > player2.health);
    }
}

function updateStatusMessage() {
    if (statusTimer > 0) {
        statusTimer--;
        if (statusTimer === 0) statusMessage = '';
    }
}

function updateEffects() {
    updateStatusMessage();
    updateHealthAnimations();

    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        floatingTexts[i].update();
        if (floatingTexts[i].life <= 0) floatingTexts.splice(i, 1);
    }

    for (let i = impactParticles.length - 1; i >= 0; i--) {
        impactParticles[i].update();
        if (impactParticles[i].life <= 0) impactParticles.splice(i, 1);
    }
}

function updateHealthAnimations() {
    [player1, player2].forEach((player) => {
        if (!player) return;

        const diff = player.health - player.displayHealth;
        if (Math.abs(diff) < 0.2) {
            player.displayHealth = player.health;
        } else {
            player.displayHealth += diff * 0.16;
        }
    });
}

function triggerImpactFeedback(x, y, direction, blocked = false) {
    screenShake = reducedMotionEnabled ? 0 : Math.max(screenShake, blocked ? 4 : 10);
    hitStopFrames = reducedMotionEnabled ? 0 : Math.max(hitStopFrames, blocked ? 2 : 5);

    const count = reducedMotionEnabled ? (blocked ? 3 : 5) : (blocked ? 7 : 14);
    const colors = blocked ? ['#33f', '#8af', '#fff'] : ['#c00', '#f90', '#fff'];

    for (let i = 0; i < count; i++) {
        const spread = -1.2 + Math.random() * 2.4;
        const speed = blocked ? 3 + Math.random() * 3 : 5 + Math.random() * 6;
        const vx = direction * speed;
        const vy = spread * speed;
        const color = colors[Math.floor(Math.random() * colors.length)];
        const type = i % 3 === 0 ? 'dot' : 'line';

        impactParticles.push(new ImpactParticle(x, y, vx, vy, color, type));
    }
}

function drawBackground() {
    const arena = getArenaConfig();

    ctx.fillStyle = arena.background;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.strokeStyle = arena.accent;
    ctx.lineWidth = 1;

    for (let x = 0; x < WIDTH; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, HEIGHT);
        ctx.stroke();
    }

    drawArenaDetails(selectedArena, arena);

    ctx.strokeStyle = arena.ground;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y + 35);

    for (let x = 0; x <= WIDTH; x += 30) {
        ctx.lineTo(x, GROUND_Y + 35 + Math.sin(x / 20) * 3);
    }

    ctx.stroke();
}

function drawArenaDetails(arenaKey, arena) {
    ctx.save();
    ctx.globalAlpha = 0.82;

    if (arenaKey === 'cafeteria') drawCafeteriaDetails(arena);
    else if (arenaKey === 'lab') drawLabDetails(arena);
    else if (arenaKey === 'meeting') drawMeetingDetails(arena);
    else if (arenaKey === 'remoteMeeting') drawRemoteMeetingDetails(arena);
    else drawNotebookDetails(arena);

    ctx.restore();
}

function drawNotebookDetails(arena) {
    ctx.strokeStyle = 'rgba(200, 40, 40, 0.35)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(95, 0);
    ctx.lineTo(95, GROUND_Y + 20);
    ctx.stroke();

    ctx.strokeStyle = arena.accent;
    ctx.lineWidth = 1;
    for (let y = 80; y < GROUND_Y; y += 34) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(WIDTH, y);
        ctx.stroke();
    }

    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.font = '20px "Comic Sans MS"';
    ctx.fillText('TODO: esquivar', 130, 120);
    ctx.fillText('combo = J + K', 710, 170);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.22)';
    ctx.beginPath();
    ctx.arc(785, 230, 34, 0.2, Math.PI * 1.7);
    ctx.stroke();
}

function drawCafeteriaDetails(arena) {
    ctx.fillStyle = 'rgba(124, 79, 44, 0.22)';
    ctx.fillRect(80, 250, 840, 70);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.fillRect(110, 90, 230, 115);
    ctx.strokeStyle = arena.ground;
    ctx.lineWidth = 3;
    ctx.strokeRect(110, 90, 230, 115);

    ctx.fillStyle = arena.ground;
    ctx.font = 'bold 20px "Comic Sans MS"';
    ctx.fillText('COFFEE', 135, 125);
    ctx.font = '16px "Comic Sans MS"';
    ctx.fillText('404 CAFFEINE', 135, 155);
    ctx.fillText('MEETING FUEL', 135, 180);

    for (let x = 620; x <= 760; x += 70) {
        ctx.strokeStyle = arena.ground;
        ctx.lineWidth = 4;
        ctx.strokeRect(x, 215, 38, 28);
        ctx.beginPath();
        ctx.arc(x + 39, 228, 8, -Math.PI / 2, Math.PI / 2);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(124, 79, 44, 0.32)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + 12, 205);
        ctx.quadraticCurveTo(x + 4, 190, x + 18, 178);
        ctx.moveTo(x + 25, 205);
        ctx.quadraticCurveTo(x + 35, 190, x + 24, 178);
        ctx.stroke();
    }
}

function drawLabDetails(arena) {
    ctx.strokeStyle = arena.accent;
    ctx.lineWidth = 1;
    for (let y = 60; y < GROUND_Y; y += 45) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(WIDTH, y);
        ctx.stroke();
    }

    ctx.strokeStyle = arena.ground;
    ctx.lineWidth = 3;
    ctx.strokeRect(92, 105, 190, 95);
    ctx.strokeRect(720, 85, 170, 130);
    ctx.fillStyle = 'rgba(36, 83, 122, 0.55)';
    ctx.font = '18px "Comic Sans MS"';
    ctx.fillText('E = mc^2?', 120, 145);
    ctx.fillText('NaN sample', 745, 125);
    ctx.fillText('DO NOT LICK', 742, 165);

    ctx.strokeStyle = 'rgba(42, 157, 143, 0.55)';
    ctx.beginPath();
    ctx.moveTo(430, 105);
    ctx.lineTo(470, 220);
    ctx.lineTo(390, 220);
    ctx.closePath();
    ctx.stroke();
}

function drawMeetingDetails(arena) {
    ctx.fillStyle = 'rgba(91, 70, 54, 0.20)';
    ctx.fillRect(120, 238, 760, 72);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
    ctx.fillRect(340, 72, 320, 150);
    ctx.strokeStyle = arena.ground;
    ctx.lineWidth = 3;
    ctx.strokeRect(340, 72, 320, 150);

    ctx.fillStyle = arena.ground;
    ctx.font = 'bold 18px "Comic Sans MS"';
    ctx.fillText('THIS COULD BE AN EMAIL', 372, 118);
    ctx.font = '16px "Comic Sans MS"';
    ctx.fillText('ACTION ITEMS?', 420, 165);

    const notes = [[185, 105], [715, 120], [760, 175]];
    notes.forEach(([x, y], i) => {
        ctx.fillStyle = i === 1 ? 'rgba(255, 210, 80, 0.7)' : 'rgba(255, 245, 130, 0.7)';
        ctx.fillRect(x, y, 60, 45);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.font = '13px "Comic Sans MS"';
        ctx.fillText(i === 2 ? '???' : 'TODO', x + 10, y + 27);
    });
}

function drawRemoteMeetingDetails(arena) {
    const windows = [[95, 86, 'HUMANO'], [315, 86, 'CPU'], [535, 86, 'LAG...'], [755, 86, 'MUTED']];

    windows.forEach(([x, y, label], i) => {
        ctx.fillStyle = i === 1 ? 'rgba(210, 34, 34, 0.24)' : 'rgba(125, 211, 252, 0.18)';
        ctx.fillRect(x, y, 150, 92);
        ctx.strokeStyle = arena.ground;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, 150, 92);
        ctx.fillStyle = '#dff7ff';
        ctx.font = '14px "Comic Sans MS"';
        ctx.fillText(label, x + 18, y + 72);
    });

    ctx.fillStyle = 'rgba(255, 255, 255, 0.10)';
    ctx.fillRect(705, 210, 210, 96);
    ctx.strokeStyle = arena.ground;
    ctx.strokeRect(705, 210, 210, 96);
    ctx.fillStyle = '#dff7ff';
    ctx.font = '15px "Comic Sans MS"';
    ctx.fillText("YOU'RE MUTED", 730, 238);
    ctx.fillText('CAN YOU SEE IT?', 730, 270);
    ctx.fillText('RECONNECTING', 730, 292);
}

function drawHealthBars() {
    if (!player1 || !player2) return;

    ctx.fillStyle = '#000';
    ctx.fillRect(50, 30, 304, 26);
    ctx.fillStyle = '#aaa';
    if (player1.displayHealth > 0) ctx.fillRect(52, 32, player1.displayHealth * 3, 22);
    ctx.fillStyle = player1.health > 30 ? '#222' : '#c00';
    if (player1.health > 0) ctx.fillRect(52, 32, player1.health * 3, 22);

    ctx.fillStyle = '#000';
    ctx.fillRect(WIDTH - 354, 30, 304, 26);
    ctx.fillStyle = '#aaa';
    if (player2.displayHealth > 0) ctx.fillRect(WIDTH - 52 - (player2.displayHealth * 3), 32, player2.displayHealth * 3, 22);
    ctx.fillStyle = player2.health > 30 ? '#222' : '#c00';
    if (player2.health > 0) ctx.fillRect(WIDTH - 52 - (player2.health * 3), 32, player2.health * 3, 22);

    ctx.font = 'bold 20px "Comic Sans MS"';
    ctx.fillStyle = '#000';
    ctx.textAlign = 'left';
    ctx.fillText(`HUMANO: ${player1.health}%`, 50, 23);
    ctx.fillStyle = '#06f';
    ctx.fillRect(52, 62, player1.energy * 2, 8);
    ctx.strokeStyle = '#000';
    ctx.strokeRect(52, 62, 200, 8);
    ctx.fillStyle = '#000';
    ctx.textAlign = 'right';
    ctx.fillText(`CPU (IA): ${player2.health}%`, WIDTH - 50, 23);
    ctx.fillStyle = '#06f';
    ctx.fillRect(WIDTH - 252, 62, player2.energy * 2, 8);
    ctx.strokeStyle = '#000';
    ctx.strokeRect(WIDTH - 252, 62, 200, 8);
    ctx.fillStyle = '#000';

    ctx.textAlign = 'center';
    ctx.fillText(`ROUND ${currentRound}  ${playerRounds}-${cpuRounds}  ${Math.ceil(roundTimeMs / 1000)}`, WIDTH / 2, 23);
}

function drawStatusMessage() {
    if (!statusMessage) return;

    const alpha = Math.min(1, Math.max(0.25, statusTimer / 20));

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.textAlign = 'center';
    ctx.font = 'bold 58px "Comic Sans MS"';
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#000';
    ctx.strokeText(statusMessage, WIDTH / 2, 135);
    ctx.fillStyle = '#fff';
    ctx.fillText(statusMessage, WIDTH / 2, 135);
    ctx.restore();
}

function draw() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    ctx.save();

    if (screenShake > 0) {
        const shakeX = (Math.random() - 0.5) * screenShake;
        const shakeY = (Math.random() - 0.5) * screenShake;
        ctx.translate(shakeX, shakeY);
        screenShake *= 0.78;
        if (screenShake < 0.4) screenShake = 0;
    }

    drawBackground();
    if (player1 && player2) {
        player1.draw();
        player2.draw();
    }
    impactParticles.forEach((p) => p.draw());
    floatingTexts.forEach((t) => t.draw());
    drawHealthBars();
    drawStatusMessage();

    ctx.restore();
}

function updateControlsVisibility() {
    document.getElementById('controls').style.display = mobileControlsEnabled && gameState === 'playing' ? 'block' : 'none';
    document.getElementById('pause-button').style.display = gameState === 'playing' ? 'block' : 'none';
    updateOrientationWarning();
}

function gameLoop(timestamp = 0) {
    const deltaMs = lastFrameTimestamp === null ? 1000 / 60 : Math.min(100, Math.max(0, timestamp - lastFrameTimestamp));
    lastFrameTimestamp = timestamp;

    update(deltaMs);
    draw();
    requestAnimationFrame(gameLoop);
}

function setupMobileControls() {
    mobileControlsEnabled = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    updateControlsVisibility();

    const btns = {
        left: document.getElementById('btn-left'),
        right: document.getElementById('btn-right'),
        jump: document.getElementById('btn-jump'),
        crouch: document.getElementById('btn-crouch'),
        block: document.getElementById('btn-block'),
        punch: document.getElementById('btn-punch'),
        kick: document.getElementById('btn-kick'),
        special: document.getElementById('btn-special')
    };

    Object.keys(btns).forEach((key) => {
        const btn = btns[key];
        if (!btn) return;

        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            initAudio();
            keys[key] = true;
        }, { passive: false });

        btn.addEventListener('touchend', (e) => {
            e.preventDefault();
            keys[key] = false;
        }, { passive: false });

        btn.addEventListener('mousedown', () => { keys[key] = true; });
        btn.addEventListener('mouseup', () => { keys[key] = false; });
        btn.addEventListener('mouseleave', () => { keys[key] = false; });
    });
}

function setupKeyboardControls() {
    window.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase();

        if (key === 'p' || key === 'escape') {
            if (e.preventDefault) e.preventDefault();
            togglePause();
            return;
        }

        if (gameState === 'playing' && key.startsWith('arrow') && e.preventDefault) {
            e.preventDefault();
        }

        keys[key] = true;
    });

    window.addEventListener('keyup', (e) => {
        keys[e.key.toLowerCase()] = false;
    });
}

function setupRestartButton() {
    document.getElementById('restart-button').addEventListener('click', initGame);
    document.getElementById('menu-button').addEventListener('click', showMainMenu);
    document.getElementById('pause-button').addEventListener('click', pauseGame);
    document.getElementById('resume-button').addEventListener('click', resumeGame);
    document.getElementById('pause-menu-button').addEventListener('click', showMainMenu);
}

function setupMainMenu() {
    document.getElementById('start-button').addEventListener('click', initGame);
    document.getElementById('help-button').addEventListener('click', showHelpScreen);
    document.getElementById('back-button').addEventListener('click', hideHelpScreen);
    document.getElementById('difficulty-select').addEventListener('change', (e) => {
        setDifficulty(e.target.value);
    });
    document.getElementById('arena-select').addEventListener('change', (e) => {
        setArena(e.target.value);
    });
    document.getElementById('reduce-motion-toggle').addEventListener('change', (e) => {
        setReducedMotion(e.target.checked);
    });
}

window.addEventListener('load', () => {
    resizeCanvas();
    renderStats();
    renderMotionPreference();
    showMainMenu();
    setupMobileControls();
    setupKeyboardControls();
    setupMainMenu();
    setupRestartButton();
    gameLoop();
});

window.addEventListener('resize', resizeCanvas);
