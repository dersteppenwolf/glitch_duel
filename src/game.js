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
}

function startRound() {
    player1 = new Fighter(250, true);
    player2 = new Fighter(750, false);
    floatingTexts = [];
    impactParticles = [];
    keys = {};
    screenShake = 0;
    hitStopFrames = 0;
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
    gameState = 'menu';
    document.getElementById('game-over').style.display = 'none';
    document.getElementById('main-menu').style.display = 'flex';
    document.getElementById('help-screen').style.display = 'none';
    document.getElementById('pause-screen').style.display = 'none';
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

function update() {
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
    }
}

function finishRound(playerWon) {
    if (gameState !== 'playing') return;

    if (playerWon) playerRounds++;
    else cpuRounds++;

    document.getElementById('pause-screen').style.display = 'none';

    if (playerRounds >= ROUNDS_TO_WIN || cpuRounds >= ROUNDS_TO_WIN) {
        gameState = 'gameOver';
        showStatusMessage('K.O.', 180);
        const winText = document.getElementById('winner-text');
        winText.innerHTML = playerRounds >= ROUNDS_TO_WIN ? '¡SISTEMA DOMINADO!<br>😎' : '¡LA MÁQUINA GANA!<br>🤖';
        document.getElementById('game-over').style.display = 'block';
        updateControlsVisibility();
        return;
    }

    gameState = 'roundOver';
    showStatusMessage(playerWon ? 'ROUND HUMANO' : 'ROUND CPU', 90);
    updateControlsVisibility();
    setTimeout(() => {
        currentRound++;
        startRound();
    }, 1400);
}

function updateStatusMessage() {
    if (statusTimer > 0) {
        statusTimer--;
        if (statusTimer === 0) statusMessage = '';
    }
}

function updateEffects() {
    updateStatusMessage();

    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        floatingTexts[i].update();
        if (floatingTexts[i].life <= 0) floatingTexts.splice(i, 1);
    }

    for (let i = impactParticles.length - 1; i >= 0; i--) {
        impactParticles[i].update();
        if (impactParticles[i].life <= 0) impactParticles.splice(i, 1);
    }
}

function triggerImpactFeedback(x, y, direction, blocked = false) {
    screenShake = Math.max(screenShake, blocked ? 4 : 10);
    hitStopFrames = Math.max(hitStopFrames, blocked ? 2 : 5);

    const count = blocked ? 7 : 14;
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
    ctx.fillStyle = '#f8f6f0';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y + 35);

    for (let x = 0; x <= WIDTH; x += 30) {
        ctx.lineTo(x, GROUND_Y + 35 + Math.sin(x / 20) * 3);
    }

    ctx.stroke();
}

function drawHealthBars() {
    if (!player1 || !player2) return;

    ctx.fillStyle = '#000';
    ctx.fillRect(50, 30, 304, 26);
    ctx.fillStyle = player1.health > 30 ? '#222' : '#c00';
    if (player1.health > 0) ctx.fillRect(52, 32, player1.health * 3, 22);

    ctx.fillStyle = '#000';
    ctx.fillRect(WIDTH - 354, 30, 304, 26);
    ctx.fillStyle = player2.health > 30 ? '#222' : '#c00';
    if (player2.health > 0) ctx.fillRect(WIDTH - 52 - (player2.health * 3), 32, player2.health * 3, 22);

    ctx.font = 'bold 20px "Comic Sans MS"';
    ctx.fillStyle = '#000';
    ctx.textAlign = 'left';
    ctx.fillText(`HUMANO: ${player1.health}%`, 50, 23);
    ctx.textAlign = 'right';
    ctx.fillText(`CPU (IA): ${player2.health}%`, WIDTH - 50, 23);

    ctx.textAlign = 'center';
    ctx.fillText(`ROUND ${currentRound}  ${playerRounds}-${cpuRounds}`, WIDTH / 2, 23);
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
}

function gameLoop() {
    update();
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
        block: document.getElementById('btn-block'),
        punch: document.getElementById('btn-punch'),
        kick: document.getElementById('btn-kick')
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
}

window.addEventListener('load', () => {
    resizeCanvas();
    showMainMenu();
    setupMobileControls();
    setupKeyboardControls();
    setupMainMenu();
    setupRestartButton();
    gameLoop();
});

window.addEventListener('resize', resizeCanvas);
