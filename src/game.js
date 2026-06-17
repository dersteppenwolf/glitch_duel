const REDUCED_MOTION_STORAGE_KEY = 'glitchDuelReducedMotion';
const LEGACY_REDUCED_MOTION_STORAGE_KEY = 'xkcdKombatReducedMotion';
const STATS_STORAGE_KEY = 'glitchDuelStats';
const LEGACY_STATS_STORAGE_KEY = 'xkcdKombatStats';

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
let selectedFighterStyle = 'balanced';
let stats = loadStats();
let reducedMotionEnabled = loadReducedMotionPreference();
let lastFrameTimestamp = null;
let visualFrame = 0;
let impactFlash = null;
let matchStats = createMatchStats();
let vsIntroTimer = 0;
let specialFlash = null;
const VS_INTRO_FRAMES = 90;

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

function skipVsIntro() {
    vsIntroTimer = 0;
}

function setArena(value) {
    selectedArena = ARENAS[value] ? value : 'notebook';
    renderArenaPreview();
}

function setFighterStyle(value) {
    selectedFighterStyle = FIGHTER_STYLES[value] ? value : 'balanced';
    if (matchStats) matchStats.fighterStyle = selectedFighterStyle;
    renderStylePreference();
}

function getArenaLabel() {
    const arena = getArenaConfig();
    return t(arena.labelKey || arena.label);
}

function getArenaPreviewTextKey() {
    const previewKeys = {
        notebook: 'arenaPreviewNotebook',
        cafeteria: 'arenaPreviewCafeteria',
        lab: 'arenaPreviewLab',
        meeting: 'arenaPreviewMeeting',
        remoteMeeting: 'arenaPreviewRemoteMeeting',
        mathClass: 'arenaPreviewMathClass',
        serverDown: 'arenaPreviewServerDown',
        geekConvention: 'arenaPreviewGeekConvention'
    };

    return previewKeys[selectedArena] || previewKeys.notebook;
}

function getDifficultyLabel() {
    return t(`difficulty${selectedDifficulty.charAt(0).toUpperCase()}${selectedDifficulty.slice(1)}`);
}

function createMatchStats() {
    return { playerCombos: 0, playerBlocks: 0, playerSpecials: 0, playerAirAttacks: 0, fighterStyle: selectedFighterStyle };
}

function recordPlayerCombo() {
    matchStats.playerCombos++;
}

function recordPlayerBlock() {
    matchStats.playerBlocks++;
}

function recordPlayerSpecial() {
    matchStats.playerSpecials++;
}

function recordPlayerAirAttack() {
    matchStats.playerAirAttacks++;
}

function getPostMatchMedal(playerWon) {
    if (!playerWon) return { title: t('medalMachine'), detail: t('medalMachineDetail') };
    if (matchStats.playerCombos > 0) return { title: t('medalCombo'), detail: t('medalComboDetail') };
    if (matchStats.playerBlocks >= 2) return { title: t('medalFirewall'), detail: t('medalFirewallDetail') };
    if (player1 && player1.health <= 25) return { title: t('medalSurvivor'), detail: t('medalSurvivorDetail') };
    return { title: t('medalBug'), detail: t('medalBugDetail') };
}

function getPostMatchPhrase(playerWon) {
    if (playerWon && matchStats.playerSpecials > 0) return t('finalPhraseSpecial');
    if (playerWon && matchStats.playerBlocks >= 2) return t('finalPhraseFirewall');
    if (playerWon && matchStats.playerAirAttacks > 0) return t('finalPhraseAir');
    if (playerWon && matchStats.fighterStyle === 'fast') return t('finalPhraseFast');
    if (playerWon && matchStats.fighterStyle === 'heavy') return t('finalPhraseHeavy');
    if (playerWon && matchStats.fighterStyle === 'technical') return t('finalPhraseTechnical');
    if (playerWon) return t('finalPhraseWin');
    return t('finalPhraseLoss');
}

function loadReducedMotionPreference() {
    try {
        return window.localStorage && (window.localStorage.getItem(REDUCED_MOTION_STORAGE_KEY) || window.localStorage.getItem(LEGACY_REDUCED_MOTION_STORAGE_KEY)) === 'true';
    } catch (_) {
        return false;
    }
}

function saveReducedMotionPreference() {
    try {
        if (window.localStorage) window.localStorage.setItem(REDUCED_MOTION_STORAGE_KEY, String(reducedMotionEnabled));
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
        const raw = window.localStorage && (window.localStorage.getItem(STATS_STORAGE_KEY) || window.localStorage.getItem(LEGACY_STATS_STORAGE_KEY));
        return raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
    } catch (_) {
        return defaults;
    }
}

function saveStats() {
    try {
        if (window.localStorage) window.localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
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

    statsSummary.textContent = t('stats', stats);
}

function renderArenaPreview() {
    const preview = document.getElementById('arena-preview');
    const title = document.getElementById('arena-preview-title');
    const text = document.getElementById('arena-preview-text');
    if (!preview || !title || !text) return;

    preview.className = `arena-preview arena-preview--${selectedArena}`;
    title.textContent = getArenaLabel();
    text.textContent = t(getArenaPreviewTextKey());
}

function renderStylePreference() {
    const select = document.getElementById('style-select');
    if (select) select.value = selectedFighterStyle;
}

function renderLanguagePreference() {
    const select = document.getElementById('language-select');
    if (select) select.value = getLanguage();
}

function applyI18nAttributes() {
    if (!document.querySelectorAll) return;

    document.querySelectorAll('[data-i18n]').forEach((element) => {
        element.textContent = t(element.getAttribute('data-i18n'));
    });

    document.querySelectorAll('[data-i18n-aria]').forEach((element) => {
        element.setAttribute('aria-label', t(element.getAttribute('data-i18n-aria')));
    });
}

function setElementText(id, key) {
    const element = document.getElementById(id);
    if (element) element.textContent = t(key);
}

function setElementAria(id, key) {
    const element = document.getElementById(id);
    if (element && element.setAttribute) element.setAttribute('aria-label', t(key));
}

function renderLanguage() {
    if (document.documentElement) document.documentElement.lang = t('htmlLang');

    applyI18nAttributes();
    setElementText('instructions', 'instructions');
    setElementText('orientation-warning', 'orientationWarning');
    setElementText('pause-button', 'pauseButton');
    setElementText('start-button', 'start');
    setElementText('help-button', 'help');
    setElementText('help-title', 'help');
    setElementText('back-button', 'back');
    setElementText('pause-title', 'pauseTitle');
    setElementText('resume-button', 'resume');
    setElementText('pause-menu-button', 'menu');
    setElementText('restart-button', 'restart');
    setElementText('menu-button', 'menu');
    setElementAria('game', 'canvasLabel');
    setElementAria('pause-button', 'pauseButtonLabel');
    setElementAria('btn-left', 'leftLabel');
    setElementAria('btn-right', 'rightLabel');
    setElementAria('btn-jump', 'jump');
    setElementAria('btn-crouch', 'crouch');
    setElementAria('btn-block', 'block');
    setElementAria('btn-punch', 'punch');
    setElementAria('btn-kick', 'kick');
    setElementAria('btn-special', 'specialButtonLabel');
    renderLanguagePreference();
    renderStylePreference();
    renderStats();
    renderArenaPreview();
    renderPauseSummary();

    if (gameState === 'gameOver') renderGameOverText();
}

function renderGameOverText() {
    const winText = document.getElementById('winner-text');
    if (!winText) return;

    const playerWon = playerRounds >= ROUNDS_TO_WIN;
    const medal = getPostMatchMedal(playerWon);
    const phrase = getPostMatchPhrase(playerWon);
    winText.innerHTML = `${playerWon ? t('playerWins') : t('cpuWins')}<div class="post-match-medal"><span>${medal.title}</span><small>${medal.detail}</small></div><div class="post-match-summary"><div>${t('finalScore')}: ${playerRounds}-${cpuRounds}</div><div>${t('finalDifficulty')}: ${getDifficultyLabel()}</div><div>${t('finalArena')}: ${getArenaLabel()}</div><div>${t('finalStreak')}: ${stats.currentStreak} | ${t('finalBest')}: ${stats.bestStreak}</div><p>${phrase}</p></div>`;
}

function renderPauseSummary() {
    const summary = document.getElementById('pause-summary');
    if (!summary || !player1 || !player2) return;

    const difficulty = getDifficultyLabel();
    const arena = getArenaLabel();
    const seconds = Math.ceil(roundTimeMs / 1000);

    summary.textContent = t('pauseSummary', {
        round: currentRound,
        score: `${playerRounds}-${cpuRounds}`,
        seconds,
        difficulty,
        arena
    });
}

function hasTouchInput() {
    return mobileControlsEnabled || 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

function getViewportSize() {
    const viewport = window.visualViewport;

    return {
        width: Math.max(160, Math.floor(viewport && viewport.width ? viewport.width : window.innerWidth)),
        height: Math.max(120, Math.floor(viewport && viewport.height ? viewport.height : window.innerHeight))
    };
}

function resizeCanvas() {
    const aspectRatio = WIDTH / HEIGHT;
    const viewport = getViewportSize();
    const isTouch = hasTouchInput();
    const isPlayingTouch = isTouch && gameState === 'playing';
    const isPortraitPhone = isTouch && viewport.height > viewport.width && viewport.width <= 760;
    const isCompactTouch = isPlayingTouch && (viewport.width <= 900 || viewport.height <= 500);
    const horizontalPadding = isCompactTouch || viewport.width <= 760 ? 16 : 24;
    const heightRatio = isPlayingTouch ? (isPortraitPhone ? 0.46 : 0.82) : 0.72;
    const topReserve = isPortraitPhone && isPlayingTouch ? 38 : 0;
    const bottomReserve = isPlayingTouch ? (isPortraitPhone ? 180 : 68) : 0;
    const canvasBorderReserve = 8;
    const maxDisplayWidth = Math.max(160, viewport.width - horizontalPadding);
    const availableHeight = viewport.height - topReserve - bottomReserve - canvasBorderReserve;
    const maxDisplayHeight = Math.max(120, Math.min(viewport.height * heightRatio, availableHeight));
    const displayWidth = Math.floor(Math.min(maxDisplayWidth, maxDisplayHeight * aspectRatio));
    const displayHeight = Math.floor(displayWidth / aspectRatio);
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DEVICE_PIXEL_RATIO);
    const backingWidth = Math.round(displayWidth * dpr);
    const backingHeight = Math.round(displayHeight * dpr);

    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;
    canvas.style.marginTop = topReserve ? `${topReserve}px` : '';
    canvas.style.marginBottom = bottomReserve ? `${bottomReserve}px` : '';

    if (canvas.width !== backingWidth || canvas.height !== backingHeight) {
        canvas.width = backingWidth;
        canvas.height = backingHeight;
    }

    ctx.setTransform(backingWidth / WIDTH, 0, 0, backingHeight / HEIGHT, 0, 0);
    updateOrientationWarning();
}

function updateOrientationWarning() {
    const warning = document.getElementById('orientation-warning');
    const isTouch = hasTouchInput();
    const viewport = getViewportSize();
    const isPortraitPhone = isTouch && viewport.height > viewport.width && viewport.width <= 760;

    warning.style.display = isPortraitPhone && gameState === 'playing' ? 'block' : 'none';
}

function startRound() {
    player1 = new Fighter(250, true);
    player2 = new Fighter(750, false);
    player1.applyStyle(selectedFighterStyle);
    player2.applyStyle('balanced');
    floatingTexts = [];
    impactParticles = [];
    keys = {};
    screenShake = 0;
    hitStopFrames = 0;
    impactFlash = null;
    specialFlash = null;
    roundTimerFrames = ROUND_TIMER_FRAMES;
    roundTimeMs = ROUND_TIME_MS;
    vsIntroTimer = VS_INTRO_FRAMES;
    gameState = 'playing';
    showStatusMessage(`${t('round')} ${currentRound}`, 75);
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
    matchStats = createMatchStats();
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
    impactFlash = null;
    specialFlash = null;
    statusMessage = '';
    statusTimer = 0;
    currentRound = 1;
    playerRounds = 0;
    cpuRounds = 0;
    matchStats = createMatchStats();
    roundTimerFrames = ROUND_TIMER_FRAMES;
    roundTimeMs = ROUND_TIME_MS;
    vsIntroTimer = 0;
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

    playUISound('pause');
    keys = {};
    gameState = 'paused';
    renderPauseSummary();
    document.getElementById('pause-screen').style.display = 'flex';
    updateControlsVisibility();
}

function resumeGame() {
    if (gameState !== 'paused') return;

    playUISound('resume');
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

    if (vsIntroTimer > 0) {
        vsIntroTimer--;
        updateEffects();
        return;
    }

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
    setFinishPoses(playerWon);

    if (playerRounds >= ROUNDS_TO_WIN || cpuRounds >= ROUNDS_TO_WIN) {
        gameState = 'gameOver';
        showStatusMessage(t('ko'), 180);
        recordMatchResult(playerRounds >= ROUNDS_TO_WIN);
        renderGameOverText();
        document.getElementById('game-over').style.display = 'block';
        updateControlsVisibility();
        return;
    }

    gameState = 'roundOver';
    const roundMessage = playerWon === null ? t('tie') : (playerWon ? t('roundHuman') : t('roundCpu'));
    showStatusMessage(roundMessage, 90);
    updateControlsVisibility();
    setTimeout(() => {
        currentRound++;
        startRound();
    }, 1400);
}

function setFinishPoses(playerWon) {
    if (playerWon === null || !player1 || !player2) return;

    const winner = playerWon ? player1 : player2;
    const loser = playerWon ? player2 : player1;

    winner.state = 'victory';
    winner.velX = 0;
    winner.velY = 0;
    winner.onGround = true;
    loser.state = 'defeat';
    loser.velX = 0;
    loser.velY = 0;
    loser.onGround = true;
}

function updateRoundTimer(deltaMs = 1000 / 60) {
    if (roundTimeMs <= 0) return;

    roundTimeMs = Math.max(0, roundTimeMs - deltaMs);
    roundTimerFrames = Math.ceil(roundTimeMs / (1000 / 60));

    if (roundTimeMs > 0) return;

    showStatusMessage(t('time'), 90);

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

    if (impactFlash) {
        impactFlash.timer--;
        if (impactFlash.timer <= 0) impactFlash = null;
    }

    if (specialFlash) {
        specialFlash.timer--;
        if (specialFlash.timer <= 0) specialFlash = null;
    }
}

function triggerSpecialFeedback(fighter) {
    const duration = reducedMotionEnabled ? 12 : 24;
    const color = fighter.accentColor || '#ffcc00';
    specialFlash = {
        x: fighter.x,
        y: fighter.y - 52,
        direction: fighter.facingRight ? 1 : -1,
        color,
        timer: duration,
        maxTimer: duration,
        fullFlash: !reducedMotionEnabled
    };
    floatingTexts.push(new FloatingText(fighter.x, fighter.y - 140, 'SPECIAL!', color));
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

function triggerImpactFeedback(x, y, direction, blocked = false, accentColor = null) {
    screenShake = reducedMotionEnabled ? 0 : Math.max(screenShake, blocked ? 4 : 10);
    hitStopFrames = reducedMotionEnabled ? 0 : Math.max(hitStopFrames, blocked ? 2 : 5);

    const count = reducedMotionEnabled ? (blocked ? 3 : 5) : (blocked ? 7 : 14);
    const colors = blocked ? ['#33f', '#8af', '#fff'] : [accentColor || '#c00', '#f90', '#fff'];

    if (!reducedMotionEnabled && !blocked) {
        impactFlash = { x, y, direction, color: accentColor || '#c00', timer: 10, maxTimer: 10 };
    }

    for (let i = 0; i < count; i++) {
        const spread = -1.2 + Math.random() * 2.4;
        const speed = blocked ? 3 + Math.random() * 3 : 5 + Math.random() * 6;
        const vx = direction * speed;
        const vy = spread * speed;
        const color = !blocked && accentColor && i === 0 ? accentColor : colors[Math.floor(Math.random() * colors.length)];
        const type = i % 3 === 0 ? 'dot' : 'line';

        impactParticles.push(new ImpactParticle(x, y, vx, vy, color, type));
    }
}

function draw() {
    visualFrame++;
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
    drawSpecialFlash();
    drawImpactFlash();
    floatingTexts.forEach((t) => t.draw());
    drawHealthBars();
    drawVsIntro();
    drawStatusMessage();

    ctx.restore();
}

function updateControlsVisibility() {
    document.getElementById('controls').style.display = mobileControlsEnabled && gameState === 'playing' ? 'block' : 'none';
    document.getElementById('pause-button').style.display = gameState === 'playing' ? 'block' : 'none';
    resizeCanvas();
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
    document.getElementById('restart-button').addEventListener('click', () => {
        playUISound('start');
        initGame();
    });
    document.getElementById('menu-button').addEventListener('click', () => {
        playUISound('menu');
        showMainMenu();
    });
    document.getElementById('pause-button').addEventListener('click', pauseGame);
    document.getElementById('resume-button').addEventListener('click', resumeGame);
    document.getElementById('pause-menu-button').addEventListener('click', () => {
        playUISound('menu');
        showMainMenu();
    });
}

function setupMainMenu() {
    document.getElementById('start-button').addEventListener('click', () => {
        playUISound('start');
        initGame();
    });
    document.getElementById('help-button').addEventListener('click', () => {
        playUISound('select');
        showHelpScreen();
    });
    document.getElementById('back-button').addEventListener('click', () => {
        playUISound('menu');
        hideHelpScreen();
    });
    document.getElementById('language-select').addEventListener('change', (e) => {
        playUISound('select');
        setLanguage(e.target.value);
    });
    document.getElementById('difficulty-select').addEventListener('change', (e) => {
        playUISound('select');
        setDifficulty(e.target.value);
    });
    document.getElementById('arena-select').addEventListener('change', (e) => {
        playUISound('select');
        setArena(e.target.value);
    });
    document.getElementById('style-select').addEventListener('change', (e) => {
        playUISound('select');
        setFighterStyle(e.target.value);
    });
    document.getElementById('reduce-motion-toggle').addEventListener('change', (e) => {
        playUISound('select');
        setReducedMotion(e.target.checked);
    });
}

window.addEventListener('load', () => {
    resizeCanvas();
    renderLanguage();
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
