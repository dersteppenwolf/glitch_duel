const REDUCED_MOTION_STORAGE_KEY = 'glitchDuelReducedMotion';
const LEGACY_REDUCED_MOTION_STORAGE_KEY = 'xkcdKombatReducedMotion';
const STATS_STORAGE_KEY = 'glitchDuelStats';
const LEGACY_STATS_STORAGE_KEY = 'xkcdKombatStats';
const MATCH_HISTORY_STORAGE_KEY = 'glitchDuelMatchHistory';
const MATCH_HISTORY_VERSION = 1;
const MATCH_HISTORY_LIMIT = 25;
const ONBOARDING_STORAGE_KEY = 'glitchDuelOnboardingSeen';
const MAX_STAT_VALUE = 1000000;

let player1;
let player2;
let floatingTexts = [];
let impactParticles = [];
let keys = {};
let activePointers = new Map();
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
let selectedRival = 'nullPointer';
let stats = loadStats();
let matchHistory = loadMatchHistory();
let reducedMotionEnabled = loadReducedMotionPreference();
let lastFrameTimestamp = null;
let simulationAccumulator = 0;
let visualFrame = 0;
let impactFlash = null;
let matchStats = createMatchStats();
let vsIntroTimer = 0;
let specialFlash = null;
let gameMode = 'versus';
let arcadeRun = null;
let trainingConfig = { position: 'mid', cpu: 'idle', timer: false };
let activeTrialId = 'free';
let trialState = null;
let trialTick = 0;
let trainingTrialCompletions = Object.fromEntries(TRAINING_TRIAL_IDS.map((id) => [id, false]));
let trialAnnouncementCacheKey = null;
let trainingTrialUiCacheKey = null;
let matchSeed = 0;
let matchElapsedFrames = 0;
let debugOverlayEnabled = getDebugQueryEnabled();
let debugFrameCount = 0;
let debugStepCount = 0;
let debugTimestamp = null;
let debugFps = 0;
let debugTicksPerSecond = 0;
const DEBUG_SAMPLE_LIMIT = 1200;
let debugMetrics = createDebugMetrics();
let onboardingStep = 0;
let activeDialog = null;
let dialogReturnFocus = null;
let specialReadyAnnounced = false;
let playerHealthDangerAnnounced = false;
let timerTenAnnounced = false;
let timerFiveAnnounced = false;
let lastCombatEvent = '';
let combatStatusCacheKey = null;
let announcementFrame = null;
let announcementPriority = 0;
const ANNOUNCEMENT_PRIORITIES = {
    query: 1,
    special: 2,
    threshold: 3,
    round: 4,
    final: 5
};
let canvasDisplayWidth = WIDTH;
let hudCompactMode = false;
let modeContextCacheKey = null;
let touchSpecialStateCacheKey = null;
let pauseSummaryCacheKey = null;
const VS_INTRO_FRAMES = 90;
const MODAL_SURFACE_IDS = ['arena-shell', 'orientation-warning', 'main-menu', 'help-screen', 'controls-screen', 'onboarding-screen', 'pause-screen', 'controls', 'training-panel', 'game-over'];
const STYLE_DESCRIPTION_KEYS = {
    balanced: 'styleBalancedDescription',
    fast: 'styleFastDescription',
    heavy: 'styleHeavyDescription',
    technical: 'styleTechnicalDescription'
};

function createDebugMetrics() {
    return {
        active: false,
        rafDeltaMs: [],
        updateStepMs: [],
        simulationFrameMs: [],
        sceneDrawMs: [],
        frameWorkMs: [],
        frameClampDiscardMs: 0,
        accumulatorCapDiscardMs: 0,
        stepCapDiscardMs: 0,
        stepsPerFrame: 0,
        multiStepFrames: 0,
        maxStepsPerFrame: 0,
        sampleCount: 0,
        effectiveDpr: 1,
        deviceDpr: 1,
        backingMegapixels: 0
    };
}

function getDebugNow() {
    return typeof performance !== 'undefined' && typeof performance.now === 'function' ? performance.now() : null;
}

function resetDebugMetrics() {
    debugMetrics = createDebugMetrics();
}

function pushDebugSample(list, value) {
    if (!debugMetrics.active || !Number.isFinite(value)) return;
    list.push(value);
    if (list.length > DEBUG_SAMPLE_LIMIT) list.splice(0, list.length - DEBUG_SAMPLE_LIMIT);
}

function getNearestRankPercentile(values, percentile = 0.95) {
    if (!values.length) return null;
    const sorted = [...values].sort((a, b) => a - b);
    return sorted[Math.max(0, Math.ceil(percentile * sorted.length) - 1)];
}

function getDebugMetricSummary() {
    return {
        active: debugMetrics.active,
        samples: debugMetrics.sampleCount,
        rafSamples: debugMetrics.rafDeltaMs.length,
        p95RafMs: getNearestRankPercentile(debugMetrics.rafDeltaMs),
        p95UpdateMs: getNearestRankPercentile(debugMetrics.updateStepMs),
        p95SimulationFrameMs: getNearestRankPercentile(debugMetrics.simulationFrameMs),
        p95SceneDrawMs: getNearestRankPercentile(debugMetrics.sceneDrawMs),
        p95FrameWorkMs: getNearestRankPercentile(debugMetrics.frameWorkMs),
        frameClampDiscardMs: debugMetrics.frameClampDiscardMs,
        accumulatorCapDiscardMs: debugMetrics.accumulatorCapDiscardMs,
        stepCapDiscardMs: debugMetrics.stepCapDiscardMs,
        stepsPerFrame: debugMetrics.stepsPerFrame,
        multiStepFrames: debugMetrics.multiStepFrames,
        maxStepsPerFrame: debugMetrics.maxStepsPerFrame,
        deviceDpr: debugMetrics.deviceDpr,
        effectiveDpr: debugMetrics.effectiveDpr,
        backingMegapixels: debugMetrics.backingMegapixels
    };
}

function getDifficultyConfig() {
    return DIFFICULTIES[selectedDifficulty] || DIFFICULTIES.normal;
}

function setDifficulty(value) {
    selectedDifficulty = DIFFICULTIES[value] ? value : 'normal';
}

function showStatusMessage(text, frames = 80) {
    statusMessage = text;
    statusTimer = frames;
    combatStatusCacheKey = null;
}

function setRoundTimerFrames(value) {
    roundTimerFrames = Math.max(0, value);
    roundTimeMs = roundTimerFrames * FIXED_STEP_MS;
}

function setRoundTimeMs(value) {
    roundTimeMs = Math.max(0, value);
    roundTimerFrames = Math.ceil(roundTimeMs / FIXED_STEP_MS);
}

function resetSimulationClock() {
    lastFrameTimestamp = null;
    simulationAccumulator = 0;
}

function getDebugQueryEnabled() {
    const search = window.location && typeof window.location.search === 'string' ? window.location.search : '';
    return /(?:^|[?&])debug(?:=1|=true|&|$)/.test(search);
}

function getSeedFromLocation() {
    const search = window.location && typeof window.location.search === 'string' ? window.location.search : '';
    const match = /(?:^|[?&])seed=([^&]+)/.exec(search);
    if (!match || !/^\d+$/.test(match[1])) return null;
    const value = Number(match[1]);
    return Number.isSafeInteger(value) && value >= 0 && value <= 4294967295 ? value : null;
}

function initializeMatchSeed(seed = getSeedFromLocation()) {
    matchSeed = setMatchRandomSeed(seed === null ? Math.floor(Math.random() * 4294967296) : seed);
}

function toggleDebugOverlay() {
    debugOverlayEnabled = !debugOverlayEnabled;
    if (debugOverlayEnabled) resetDebugMetrics();
}

function getDebugData() {
    const describe = (fighter) => fighter && ({
        hurtBox: fighter.getHurtBox(),
        pushBox: fighter.getPushBox(),
        hitBox: fighter.getAttackBox(fighter.lastAttackType),
        state: fighter.state,
        cooldown: fighter.attackCooldown,
        hitStun: fighter.hitStun,
        comboTimer: fighter.comboTimer,
        aiDecisionTimer: fighter.aiDecisionTimer,
        aiAction: fighter.aiAction,
        energy: fighter.energy,
        x: fighter.x,
        y: fighter.y
    });

    return { enabled: debugOverlayEnabled, seed: matchSeed, gameState, fps: debugFps, ticks: debugTicksPerSecond, metrics: getDebugMetricSummary(), player1: describe(player1), player2: describe(player2) };
}

function loadOnboardingSeen() {
    try {
        return window.localStorage && window.localStorage.getItem(ONBOARDING_STORAGE_KEY) === '1';
    } catch (_) {
        return false;
    }
}

function renderOnboarding() {
    const step = onboardingStep + 1;
    setElementText('onboarding-kicker', 'onboardingKicker');
    setElementText('onboarding-title', `onboardingTitle${step}`);
    const onboardingText = document.getElementById('onboarding-text');
    if (onboardingText) onboardingText.textContent = t(`onboardingText${step}`, getInputTextParams());
    setElementText('onboarding-next-button', step === 3 ? 'onboardingStart' : 'onboardingNext');
    setElementText('onboarding-skip-button', 'onboardingSkip');
}

function completeOnboarding(startGame = false) {
    try {
        if (window.localStorage) window.localStorage.setItem(ONBOARDING_STORAGE_KEY, '1');
    } catch (_) {
        // localStorage can be unavailable in private browsing or tests.
    }
    closeModalDialog('onboarding-screen', false);
    if (startGame) {
        initGame();
        return;
    }

    const menu = document.getElementById('main-menu');
    if (menu) menu.style.display = 'flex';
    openModalDialog('main-menu', 'start-button');
}

function showOnboardingIfNeeded() {
    const screen = document.getElementById('onboarding-screen');
    if (!screen || loadOnboardingSeen()) return;
    onboardingStep = 0;
    renderOnboarding();
    screen.style.display = 'flex';
    openModalDialog('onboarding-screen', 'onboarding-next-button', document.getElementById('start-button'));
}

function clearActiveInput() {
    activePointers.forEach(({ button, pointerId }) => {
        if (button.releasePointerCapture && button.hasPointerCapture && button.hasPointerCapture(pointerId)) {
            button.releasePointerCapture(pointerId);
        }
    });
    activePointers.clear();
    clearAllInputSources();
    keys = {};
}

function getElementTagName(element) {
    return String(element && (element.tagName || element.nodeName) || '').toLowerCase();
}

function getElementParent(element) {
    return element && (element.parentElement || element.parentNode) || null;
}

function getKeyboardTargetPolicy(target) {
    let current = target;
    while (current) {
        const tagName = getElementTagName(current);
        if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') return 'editing';

        const contentEditable = current.getAttribute && current.getAttribute('contenteditable');
        if (current.isContentEditable === true || current.contentEditable === 'true' || (contentEditable !== null && contentEditable !== undefined && contentEditable !== 'false')) {
            return 'editing';
        }

        if (tagName === 'button' || tagName === 'summary' || (tagName === 'a' && current.getAttribute && current.getAttribute('href') !== null)) {
            return 'activation';
        }
        current = getElementParent(current);
    }
    return null;
}

function isElementWithin(target, ancestor) {
    let current = target;
    while (current) {
        if (current === ancestor) return true;
        current = getElementParent(current);
    }
    return false;
}

function focusGameplayCanvas() {
    if (canvas && typeof canvas.focus === 'function') canvas.focus({ preventScroll: true });
}

function focusDialogTarget(target) {
    if (!target) return;
    if (typeof target.focus === 'function') target.focus({ preventScroll: true });
    if (typeof target.scrollIntoView === 'function') {
        target.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
}

function isInsideClosedDetails(element) {
    const tagName = getElementTagName(element);
    let current = getElementParent(element);
    while (current) {
        if (getElementTagName(current) === 'details' && current.open === false) {
            return tagName !== 'summary' || getElementParent(element) !== current;
        }
        current = getElementParent(current);
    }
    return false;
}

function hasNegativeTabIndex(element) {
    if (!element || typeof element.getAttribute !== 'function') return false;
    const value = element.getAttribute('tabindex');
    return value !== null && value !== undefined && value !== '' && Number(value) < 0;
}

function refreshInputSnapshot() {
    keys = getInputSnapshot();
    return keys;
}

function getFocusableElements(dialog) {
    if (!dialog || typeof dialog.querySelectorAll !== 'function') return [];

    const selector = 'button:not([disabled]), [href], select:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), summary, [contenteditable]:not([contenteditable="false"])';
    return Array.from(dialog.querySelectorAll(selector)).filter((element) => {
        if (element.hidden || element.getAttribute('aria-hidden') === 'true') return false;
        if (element.disabled || hasNegativeTabIndex(element) || isInsideClosedDetails(element)) return false;
        if (typeof window.getComputedStyle !== 'function') return true;
        const style = window.getComputedStyle(element);
        return style.display !== 'none' && style.visibility !== 'hidden';
    });
}

function setModalInert(activeId = null) {
    MODAL_SURFACE_IDS.forEach((id) => {
        const element = document.getElementById(id);
        if (element) element.inert = activeId ? id !== activeId : false;
    });
}

function clearModalState() {
    setModalInert(null);
    activeDialog = null;
    dialogReturnFocus = null;
}

function focusDialog(dialog, preferredId) {
    const preferred = preferredId && document.getElementById(preferredId);
    const focusables = getFocusableElements(dialog);
    const target = preferred || focusables[0] || dialog;

    focusDialogTarget(target);
}

function openModalDialog(id, preferredId, returnFocus = null) {
    const dialog = document.getElementById(id);
    if (!dialog) return;

    const currentFocus = returnFocus || (document.activeElement && document.activeElement !== document.body ? document.activeElement : null);
    activeDialog = dialog;
    dialogReturnFocus = currentFocus;
    setModalInert(id);
    focusDialog(dialog, preferredId);
}

function closeModalDialog(id, restoreFocus = true) {
    const dialog = document.getElementById(id);
    if (dialog) dialog.style.display = 'none';
    if (!activeDialog || activeDialog.id !== id) return;

    const returnFocus = dialogReturnFocus;
    clearModalState();
    if (restoreFocus && returnFocus && typeof returnFocus.focus === 'function') returnFocus.focus({ preventScroll: true });
}

function closeAllModalDialogs() {
    ['main-menu', 'help-screen', 'controls-screen', 'onboarding-screen', 'pause-screen', 'game-over'].forEach((id) => {
        const element = document.getElementById(id);
        if (element) element.style.display = 'none';
    });
    cancelInputBindingCapture();
    clearModalState();
}

function trapDialogFocus(event) {
    if (!activeDialog || event.key !== 'Tab') return false;

    const focusables = getFocusableElements(activeDialog);
    if (!focusables.length) {
        event.preventDefault();
        focusDialog(activeDialog);
        return true;
    }

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const currentIndex = focusables.indexOf(document.activeElement);
    if (currentIndex === -1) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus({ preventScroll: true });
    } else if (event.shiftKey && currentIndex === 0) {
        event.preventDefault();
        last.focus({ preventScroll: true });
    } else if (!event.shiftKey && currentIndex === focusables.length - 1) {
        event.preventDefault();
        first.focus({ preventScroll: true });
    }

    return true;
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
    renderSelectionSummary();
}

function setRival(value) {
    selectedRival = CPU_RIVALS[value] ? value : 'nullPointer';
    renderRivalPreference();
    renderSelectionSummary();
}

function getRivalConfig() {
    return CPU_RIVALS[selectedRival] || CPU_RIVALS.nullPointer;
}

function getRivalLabel() {
    return t(getRivalConfig().labelKey);
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
    if (!playerWon) return { id: 'machine', title: t('medalMachine'), detail: t('medalMachineDetail') };
    if (matchStats.playerCombos > 0) return { id: 'combo', title: t('medalCombo'), detail: t('medalComboDetail') };
    if (matchStats.playerBlocks >= 2) return { id: 'firewall', title: t('medalFirewall'), detail: t('medalFirewallDetail') };
    if (player1 && player1.health <= 25) return { id: 'survivor', title: t('medalSurvivor'), detail: t('medalSurvivorDetail') };
    return { id: 'bug', title: t('medalBug'), detail: t('medalBugDetail') };
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
    let savedValue = null;

    try {
        if (window.localStorage) {
            const saved = window.localStorage.getItem(REDUCED_MOTION_STORAGE_KEY) || window.localStorage.getItem(LEGACY_REDUCED_MOTION_STORAGE_KEY);
            if (saved !== null) savedValue = saved === 'true';
        }
    } catch (_) {
        savedValue = null;
    }

    if (savedValue !== null) return savedValue;

    try {
        return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
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

function recordCombatStatusEvent(text) {
    lastCombatEvent = text;
    combatStatusCacheKey = null;
}

function isTrainingTrial(id = activeTrialId) {
    return gameMode === 'training' && TRAINING_TRIAL_IDS.includes(id);
}

function createTrialState(id = activeTrialId) {
    if (!TRAINING_TRIAL_IDS.includes(id)) return null;
    const completed = !!trainingTrialCompletions[id];
    return {
        id,
        phase: completed ? 'complete' : (id === 'crouchPunish' || id === 'blockCounter' ? 'cue' : 'active'),
        cueTicks: 0,
        windowTicks: 0,
        retryTicksRemaining: 0,
        completedSteps: [],
        energyReady: false,
        completed,
        failureReason: ''
    };
}

function resetTrialProgressState() {
    trialTick = 0;
    trialState = createTrialState(activeTrialId);
    trialAnnouncementCacheKey = null;
    trainingTrialUiCacheKey = null;
}

function getTrialPreset() {
    return TRAINING_TRIAL_PRESETS[activeTrialId] || null;
}

function getEffectiveTrainingConfig() {
    const preset = getTrialPreset();
    if (!preset) return { ...trainingConfig };
    return {
        position: activeTrialId === 'crouchPunish' ? 'crouchPunish' : 'close',
        cpu: preset.cpu,
        timer: preset.timer,
        positions: [...preset.positions]
    };
}

function getTrialPosition() {
    const effective = getEffectiveTrainingConfig();
    if (effective.positions) return effective.positions;
    return TRAINING_POSITIONS[effective.position] || TRAINING_POSITIONS.mid;
}

function getTrialIndex(id = activeTrialId) {
    return TRAINING_TRIAL_IDS.indexOf(id) + 1;
}

function markTrialComplete() {
    if (!trialState || trialState.completed) return;
    trialState.completed = true;
    trialState.phase = 'complete';
    trialState.retryTicksRemaining = 0;
    trainingTrialCompletions[activeTrialId] = true;
}

function retryTrainingTrial(reason = '') {
    if (!isTrainingTrial() || !trialState || trialState.completed) return;
    trialState.phase = 'retry';
    trialState.cueTicks = 0;
    trialState.windowTicks = 0;
    trialState.retryTicksRemaining = TRAINING_TRIAL_RETRY_FRAMES;
    trialState.completedSteps = [];
    trialState.energyReady = false;
    trialState.failureReason = reason;
    trialTick = 0;
    resetTrainingFighters();
}

function reduceCombosTrialEvent(event) {
    if (!trialState || trialState.phase === 'retry' || trialState.completed) return;
    if (event.type !== 'attackResolved' || event.actor !== 'player' || event.target !== 'cpu') return;
    if (event.outcome !== 'hit' || !['comboPunch', 'comboKick', 'backKick'].includes(event.attackType)) return;
    if (!trialState.completedSteps.includes(event.attackType)) trialState.completedSteps.push(event.attackType);
    if (trialState.completedSteps.length === 3) markTrialComplete();
}

function reduceCrouchPunishTrialEvent(event) {
    if (!trialState || trialState.phase === 'retry' || trialState.completed || event.type !== 'attackResolved') return;
    if (trialState.phase === 'cue') {
        if (event.actor === 'player' && event.target === 'cpu') retryTrainingTrial('playerEarly');
        else if (event.actor === 'cpu' && event.target === 'player') {
            if (event.outcome === 'whiff' && event.evadedByCrouch) {
                trialState.phase = 'window';
                trialState.cueTicks = TRAINING_TRIAL_CUE_FRAMES;
                trialState.windowTicks = 0;
                trialState.failureReason = '';
            } else {
                retryTrainingTrial(event.outcome);
            }
        }
        return;
    }
    if (trialState.phase !== 'window') return;
    if (event.actor === 'player' && event.target === 'cpu') {
        if (event.outcome === 'hit') markTrialComplete();
        else retryTrainingTrial(event.outcome);
    } else if (event.actor === 'cpu' && event.target === 'player') {
        retryTrainingTrial(event.outcome);
    }
}

function reduceBlockCounterTrialEvent(event) {
    if (!trialState || trialState.phase === 'retry' || trialState.completed || event.type !== 'attackResolved') return;
    if (trialState.phase === 'cue') {
        if (event.actor === 'player' && event.target === 'cpu') retryTrainingTrial('playerEarly');
        else if (event.actor === 'cpu' && event.target === 'player') {
            if (event.outcome === 'blocked') {
                trialState.phase = 'window';
                trialState.cueTicks = TRAINING_TRIAL_CUE_FRAMES;
                trialState.windowTicks = 0;
                trialState.failureReason = '';
            } else {
                retryTrainingTrial(event.outcome);
            }
        }
        return;
    }
    if (trialState.phase !== 'window') return;
    if (event.actor === 'player' && event.target === 'cpu') {
        if (event.outcome === 'hit') markTrialComplete();
        else retryTrainingTrial(event.outcome);
    } else if (event.actor === 'cpu' && event.target === 'player') {
        retryTrainingTrial(event.outcome);
    }
}

function reduceSpecialSpendTrialEvent(event) {
    if (!trialState || trialState.phase === 'retry' || trialState.completed) return;
    if (event.type === 'energyReady' && event.actor === 'player' && ['hit', 'block', 'damage'].includes(event.source)) {
        trialState.energyReady = true;
        return;
    }
    if (event.type === 'attackResolved' && event.actor === 'player' && event.target === 'cpu' && event.attackType === 'special' && event.energyBefore === MAX_ENERGY && event.energyAfter === 0 && trialState.energyReady) {
        markTrialComplete();
    }
}

function reduceTrainingTrialEvent(event) {
    if (!isTrainingTrial() || !trialState || !event) return;
    if (activeTrialId === 'combos') reduceCombosTrialEvent(event);
    else if (activeTrialId === 'crouchPunish') reduceCrouchPunishTrialEvent(event);
    else if (activeTrialId === 'blockCounter') reduceBlockCounterTrialEvent(event);
    else if (activeTrialId === 'specialSpend') reduceSpecialSpendTrialEvent(event);
}

function recordCombatEvent(event) {
    if (!event || typeof event !== 'object') return;
    lastCombatEvent = { ...event };
    combatStatusCacheKey = null;
    reduceTrainingTrialEvent(event);
}

function resetTrainingFighters() {
    if (!player1 || !player2) return;
    const [playerPosition, cpuPosition] = getTrialPosition();
    [player1.x, player2.x] = [playerPosition, cpuPosition];
    [player1, player2].forEach((fighter) => {
        fighter.y = GROUND_Y;
        fighter.velX = 0;
        fighter.velY = 0;
        fighter.state = 'idle';
        fighter.attackCooldown = 0;
        fighter.hitStun = 0;
        fighter.onGround = true;
        fighter.clearComboSequence();
        fighter.prevPunchPressed = false;
        fighter.prevKickPressed = false;
        fighter.prevSpecialPressed = false;
        fighter.attackSequence = 0;
        fighter.lastAttackOutcome = '';
        fighter.lastAttackType = '';
        fighter.aiDecisionTimer = 0;
    });
    player1.health = Math.round(100 * (FIGHTER_STYLES[player1.styleKey] || FIGHTER_STYLES.balanced).health);
    player1.displayHealth = player1.health;
    player2.health = 100;
    player2.displayHealth = 100;
    const preset = getTrialPreset();
    player1.energy = preset && Number.isFinite(preset.playerEnergy) ? preset.playerEnergy : 0;
    player2.energy = 0;
    const effective = getEffectiveTrainingConfig();
    player2.trainingBehavior = effective.cpu;
    roundTimerFrames = effective.timer ? ROUND_TIMER_FRAMES : 0;
    roundTimeMs = effective.timer ? ROUND_TIME_MS : 0;
    clearActiveInput();
}

function startTrainingTrialAttempt() {
    if (!isTrainingTrial() || !trialState || trialState.completed) return;
    resetTrainingFighters();
    trialState.phase = activeTrialId === 'crouchPunish' || activeTrialId === 'blockCounter' ? 'cue' : 'active';
    trialState.cueTicks = 0;
    trialState.windowTicks = 0;
    trialState.retryTicksRemaining = 0;
    trialState.completedSteps = [];
    trialState.energyReady = false;
    trialState.failureReason = '';
    trialTick = 0;
}

function advanceTrainingTrialBeforeCpu(phaseBeforeTick = 'none') {
    if (!isTrainingTrial() || !trialState || trialState.completed) return 'none';
    trialTick++;
    if (phaseBeforeTick === 'retry' && trialState.phase === 'retry') {
        trialState.retryTicksRemaining--;
        if (trialState.retryTicksRemaining <= 0) startTrainingTrialAttempt();
        return 'retry';
    }
    if (phaseBeforeTick !== 'cue' || trialState.phase !== 'cue') return 'none';
    trialState.cueTicks++;
    if (trialState.cueTicks < TRAINING_TRIAL_CUE_FRAMES) return 'cue';

    const cpuCanCue = player2 && player2.onGround && player2.hitStun === 0 && player2.attackCooldown === 0 && player2.state !== 'block' && player2.state !== 'crouch';
    if (!cpuCanCue) {
        retryTrainingTrial('cpuUnavailable');
        return 'retry';
    }
    player2.attack(activeTrialId === 'blockCounter' ? 'kick' : 'punch', player1);
    return 'cue';
}

function finishTrainingTrialTick(phaseBeforeTick) {
    if (!isTrainingTrial() || !trialState || trialState.completed || phaseBeforeTick !== 'window' || trialState.phase !== 'window') return;
    trialState.windowTicks++;
    if (trialState.windowTicks >= TRAINING_TRIAL_WINDOW_FRAMES) retryTrainingTrial('timeout');
}

function getTrainingTrialProgressText() {
    if (!isTrainingTrial() || !trialState) return t('trainingTrialFreeProgress');
    const check = (complete) => complete ? '✓' : '·';
    if (activeTrialId === 'combos') {
        return t('trainingTrialCombosProgress', {
            punch: check(trialState.completedSteps.includes('comboPunch')),
            kick: check(trialState.completedSteps.includes('comboKick')),
            backKick: check(trialState.completedSteps.includes('backKick')),
            jj: t('comboJJ'),
            jk: t('comboJK'),
            kk: t('comboKK')
        });
    }
    if (activeTrialId === 'crouchPunish') {
        return t('trainingTrialCrouchProgress', {
            evade: check(trialState.phase === 'window' || trialState.completed),
            punish: check(trialState.completed)
        });
    }
    if (activeTrialId === 'blockCounter') {
        return t('trainingTrialBlockProgress', {
            block: check(trialState.phase === 'window' || trialState.completed),
            counter: check(trialState.completed)
        });
    }
    return t('trainingTrialSpecialProgress', {
        charge: check(trialState.energyReady || trialState.completed),
        spend: check(trialState.completed)
    });
}

function getTrainingTrialBrief() {
    if (!isTrainingTrial() || !trialState) return t('trainingTrialFreeBrief');
    if (trialState.completed) return t('trainingTrialSuccess');
    if (trialState.phase === 'retry') return t('trainingTrialRetry', { ticks: trialState.retryTicksRemaining });
    if (activeTrialId === 'combos') return t('trainingTrialCombosBrief', {
        jj: t('comboJJ'),
        jk: t('comboJK'),
        kk: t('comboKK')
    });
    if (activeTrialId === 'specialSpend') return trialState.energyReady ? t('trainingTrialSpecialSpendBrief') : t('trainingTrialSpecialChargeBrief');
    if (trialState.phase === 'window') return t(activeTrialId === 'crouchPunish' ? 'trainingTrialCrouchPunishBrief' : 'trainingTrialBlockCounterBrief');
    return t(activeTrialId === 'crouchPunish' ? 'trainingTrialCrouchCueBrief' : 'trainingTrialBlockCueBrief', { ticks: Math.max(0, TRAINING_TRIAL_CUE_FRAMES - trialState.cueTicks) });
}

function renderTrainingTrial() {
    const select = document.getElementById('training-trial-select');
    const brief = document.getElementById('training-trial-brief');
    const progress = document.getElementById('training-trial-progress');
    const next = document.getElementById('training-trial-next');
    const freeOptions = document.getElementById('training-free-options');
    const uiSignature = `${activeTrialId}|${trialState ? trialState.phase : 'free'}|${trialState ? trialState.completedSteps.join(',') : ''}|${trialState ? trialState.energyReady : false}|${trialState ? trialState.completed : false}|${trialState ? trialState.failureReason : ''}`;
    if (uiSignature === trainingTrialUiCacheKey) return;
    trainingTrialUiCacheKey = uiSignature;
    if (select) select.value = activeTrialId;
    if (brief) brief.textContent = getTrainingTrialBrief();
    if (progress) progress.textContent = getTrainingTrialProgressText();
    if (next) {
        next.hidden = !isTrainingTrial() || !trialState || !trialState.completed;
        next.disabled = next.hidden;
        next.textContent = t('trainingTrialNext');
    }
    if (freeOptions) freeOptions.disabled = isTrainingTrial();

    const panel = document.getElementById('training-panel');
    if (panel) {
        panel.className = isTrainingTrial() && trialState && trialState.completed ? 'training-panel training-panel--complete' : 'training-panel';
    }

    if (isTrainingTrial() && trialState && trialState.completed) {
        const signature = `${activeTrialId}|${getLanguage()}|complete`;
        if (trialAnnouncementCacheKey !== signature) {
            trialAnnouncementCacheKey = signature;
            announce(t('trainingTrialSuccessAnnounce'), 'special');
        }
    }
}

function announce(message, priority = 'query') {
    const announcer = document.getElementById('game-announcer');
    if (!announcer) return;

    const currentFrame = matchElapsedFrames;
    if (announcementFrame !== currentFrame) {
        announcementFrame = currentFrame;
        announcementPriority = 0;
    }

    const nextPriority = ANNOUNCEMENT_PRIORITIES[priority] || ANNOUNCEMENT_PRIORITIES.query;
    const currentText = announcer.textContent;
    if (nextPriority < announcementPriority) {
        if (priority !== 'query') return;
        message = currentText ? `${currentText} ${t('announcementSeparator')} ${message}` : message;
    } else if (nextPriority === announcementPriority && currentText && currentText !== message && priority !== 'query') {
        if (!currentText.includes(message)) message = `${currentText} ${t('announcementSeparator')} ${message}`;
    }

    announcer.textContent = '';
    announcer.textContent = message;
    announcementPriority = Math.max(announcementPriority, nextPriority);
}

function getCombatStatusHealth(fighter, fallback = 100) {
    return Math.max(0, Math.round(fighter ? fighter.health : fallback));
}

function getCombatStatusEnergy(fighter) {
    return Math.max(0, Math.min(MAX_ENERGY, Math.round(fighter ? fighter.energy : 0)));
}

function getCombatStatusTime() {
    if (gameMode === 'training' && !getEffectiveTrainingConfig().timer) return null;
    return Math.max(0, Math.ceil(roundTimeMs / 1000));
}

function getCombatStatusDistanceBucket() {
    const distance = player1 && player2 ? Math.abs(player1.x - player2.x) : 500;
    if (distance <= 110) return 'close';
    if (distance <= 250) return 'mid';
    return 'far';
}

function getCombatStatusDirection() {
    if (!player1 || !player2 || player1.x === player2.x) return 'same';
    return player2.x < player1.x ? 'left' : 'right';
}

function getCombatStatusDirectionText(direction = getCombatStatusDirection()) {
    return t(`combatStatusDirection${direction.charAt(0).toUpperCase()}${direction.slice(1)}`);
}

function getCombatStatusDistanceText(bucket = getCombatStatusDistanceBucket()) {
    return t(`combatStatusDistance${bucket.charAt(0).toUpperCase()}${bucket.slice(1)}`);
}

function getCombatStatusTimeText(seconds = getCombatStatusTime()) {
    return seconds === null ? t('combatStatusNoTimer') : `${seconds}s`;
}

function getCombatEventText(event = lastCombatEvent) {
    if (!event) return t('combatStatusNoEvent');
    if (typeof event === 'string') return event;
    if (event.type === 'energyReady') {
        return t('combatEventEnergyReady', {
            actor: event.actor === 'player' ? 'P1' : 'CPU',
            source: event.source,
            energy: event.energyAfter
        });
    }
    if (event.type === 'attackResolved') {
        return t('combatEventAttackResolved', {
            actor: event.actor === 'player' ? 'P1' : 'CPU',
            attack: event.attackType,
            outcome: event.outcome,
            damage: event.damageApplied,
            sequence: event.sequence
        });
    }
    return String(event.type || t('combatStatusNoEvent'));
}

function announceCombatStatus() {
    const p1Health = getCombatStatusHealth(player1);
    const cpuHealth = getCombatStatusHealth(player2);
    const p1Energy = getCombatStatusEnergy(player1);
    const cpuEnergy = getCombatStatusEnergy(player2);
    const direction = getCombatStatusDirectionText();
    const distance = getCombatStatusDistanceText();
    const time = getCombatStatusTimeText();
    announce(t('combatStatusAnnouncement', {
        p1Health,
        cpuHealth,
        p1Energy,
        cpuEnergy,
        direction,
        distance,
        round: currentRound,
        score: `${playerRounds}-${cpuRounds}`,
        time
    }), 'query');
}

function renderCombatStatus() {
    const compact = document.getElementById('combat-status-compact');
    const details = document.getElementById('combat-status-details');
    if (!compact || !details || !details.children) return;

    const p1Health = getCombatStatusHealth(player1);
    const cpuHealth = getCombatStatusHealth(player2);
    const p1Energy = getCombatStatusEnergy(player1);
    const cpuEnergy = getCombatStatusEnergy(player2);
    const seconds = getCombatStatusTime();
    const direction = getCombatStatusDirection();
    const distance = getCombatStatusDistanceBucket();
    const mode = getModeContextText();
    const event = getCombatEventText();
    const summary = document.getElementById('combat-status-summary');
    const signature = [
        getLanguage(),
        p1Health,
        cpuHealth,
        p1Energy,
        cpuEnergy,
        seconds === null ? 'off' : seconds,
        currentRound,
        playerRounds,
        cpuRounds,
        mode,
        direction,
        distance,
        event
    ].join('|');
    if (signature === combatStatusCacheKey) return;

    const time = getCombatStatusTimeText(seconds);
    const compactText = hudCompactMode
        ? `${t('combatStatusCompactLabel')} · ${time}`
        : `${t('combatStatusCompactLabel')} · P1 ${p1Health} · CPU ${cpuHealth} · ${time}`;
    const values = [
        mode,
        `${p1Health}%`,
        `${cpuHealth}%`,
        `${p1Energy}/${MAX_ENERGY}`,
        `${cpuEnergy}/${MAX_ENERGY}`,
        currentRound,
        `${playerRounds}-${cpuRounds}`,
        time,
        getRivalLabel(),
        getCombatStatusDirectionText(direction),
        getCombatStatusDistanceText(distance),
        event
    ];

    if (summary && summary.getAttribute('aria-label') !== t('combatStatusSummaryLabel')) {
        summary.setAttribute('aria-label', t('combatStatusSummaryLabel'));
    }
    compact.textContent = compactText;
    values.forEach((value, index) => {
        const element = details.children[index * 2 + 1];
        if (element) element.textContent = String(value);
    });
    combatStatusCacheKey = signature;
}

function getStyleDescription() {
    return t(STYLE_DESCRIPTION_KEYS[selectedFighterStyle] || STYLE_DESCRIPTION_KEYS.balanced);
}

function renderSelectionSummary() {
    const styleTitle = document.getElementById('style-preview-title');
    const styleText = document.getElementById('style-preview-text');
    const rivalTitle = document.getElementById('rival-preview-title');
    const rivalText = document.getElementById('rival-preview-text');

    if (styleTitle) styleTitle.textContent = t(FIGHTER_STYLES[selectedFighterStyle].labelKey);
    if (styleText) styleText.textContent = getStyleDescription();
    if (rivalTitle) rivalTitle.textContent = getRivalLabel();
    if (rivalText) rivalText.textContent = t(getRivalConfig().introKey);
}

function getArenaConfig() {
    return ARENAS[selectedArena] || ARENAS.notebook;
}

function normalizeStat(value) {
    return Number.isSafeInteger(value) && value >= 0 && value <= MAX_STAT_VALUE ? value : 0;
}

function loadStats() {
    const defaults = { wins: 0, losses: 0, currentStreak: 0, bestStreak: 0 };

    try {
        const raw = window.localStorage && (window.localStorage.getItem(STATS_STORAGE_KEY) || window.localStorage.getItem(LEGACY_STATS_STORAGE_KEY));
        if (!raw) return defaults;

        const saved = JSON.parse(raw);
        if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return defaults;

        return {
            wins: normalizeStat(saved.wins),
            losses: normalizeStat(saved.losses),
            currentStreak: normalizeStat(saved.currentStreak),
            bestStreak: normalizeStat(saved.bestStreak)
        };
    } catch (_) {
        return defaults;
    }
}

function normalizeHistoryCount(value) {
    return Number.isSafeInteger(value) && value >= 0 && value <= MAX_STAT_VALUE ? value : null;
}

function normalizeMatchHistoryRecord(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;

    const events = value.events;
    const playerRounds = normalizeHistoryCount(value.playerRounds);
    const cpuRounds = normalizeHistoryCount(value.cpuRounds);
    const durationFrames = normalizeHistoryCount(value.durationFrames);
    const fight = normalizeHistoryCount(value.fight);
    if (!['versus', 'arcade'].includes(value.mode) || !['win', 'loss'].includes(value.result)) return null;
    if (fight === null || fight < 0 || fight > ARCADE_RUN_FIGHTS.length) return null;
    if ((value.mode === 'versus' && fight !== 0) || (value.mode === 'arcade' && fight === 0)) return null;
    if (playerRounds === null || playerRounds > ROUNDS_TO_WIN || cpuRounds === null || cpuRounds > ROUNDS_TO_WIN) return null;
    if (!DIFFICULTIES[value.difficulty] || !ARENAS[value.arena] || !FIGHTER_STYLES[value.style] || !CPU_RIVALS[value.rival]) return null;
    if (durationFrames === null || !['bug', 'firewall', 'combo', 'survivor', 'machine'].includes(value.medal)) return null;
    if (!events || typeof events !== 'object' || Array.isArray(events)) return null;

    const normalizedEvents = {};
    for (const key of ['combos', 'blocks', 'specials', 'airAttacks']) {
        normalizedEvents[key] = normalizeHistoryCount(events[key]);
        if (normalizedEvents[key] === null) return null;
    }

    return {
        mode: value.mode,
        fight,
        result: value.result,
        playerRounds,
        cpuRounds,
        difficulty: value.difficulty,
        arena: value.arena,
        style: value.style,
        rival: value.rival,
        durationFrames,
        medal: value.medal,
        events: normalizedEvents
    };
}

function loadMatchHistory() {
    try {
        const raw = window.localStorage && window.localStorage.getItem(MATCH_HISTORY_STORAGE_KEY);
        if (!raw) return [];

        const saved = JSON.parse(raw);
        if (!saved || saved.version !== MATCH_HISTORY_VERSION || !Array.isArray(saved.matches)) return [];
        return saved.matches.map(normalizeMatchHistoryRecord).filter(Boolean).slice(-MATCH_HISTORY_LIMIT);
    } catch (_) {
        return [];
    }
}

function saveMatchHistory() {
    try {
        if (window.localStorage) {
            window.localStorage.setItem(MATCH_HISTORY_STORAGE_KEY, JSON.stringify({
                version: MATCH_HISTORY_VERSION,
                matches: matchHistory.slice(-MATCH_HISTORY_LIMIT)
            }));
        }
    } catch (_) {
        // localStorage can be unavailable in private browsing or tests.
    }
}

function appendMatchHistory(record) {
    const normalized = normalizeMatchHistoryRecord(record);
    if (!normalized) return false;

    matchHistory = [...matchHistory, normalized].slice(-MATCH_HISTORY_LIMIT);
    saveMatchHistory();
    return true;
}

function getMatchHistory() {
    return matchHistory.map((record) => ({
        ...record,
        events: { ...record.events }
    }));
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

function resetMatchProgress() {
    currentRound = 1;
    playerRounds = 0;
    cpuRounds = 0;
    matchStats = createMatchStats();
    matchElapsedFrames = 0;
}

function getArcadeFight() {
    return arcadeRun && ARCADE_RUN_FIGHTS[arcadeRun.fightIndex];
}

function getArcadeFightNumber() {
    return arcadeRun ? arcadeRun.fightIndex + 1 : 0;
}

function getArcadeProgressText() {
    return t('arcadeProgress', { completed: arcadeRun ? arcadeRun.results.length : 0 });
}

function getVsIntroTitle() {
    if (gameMode === 'arcade' && arcadeRun) {
        return `${t('arcadeFight', { fight: getArcadeFightNumber() })} · ${t('round')} ${currentRound}`;
    }
    return `${t('round')} ${currentRound}`;
}

function createMatchHistoryRecord(playerWon) {
    const medal = getPostMatchMedal(playerWon);
    return {
        mode: gameMode === 'arcade' ? 'arcade' : 'versus',
        fight: gameMode === 'arcade' ? getArcadeFightNumber() : 0,
        result: playerWon ? 'win' : 'loss',
        playerRounds,
        cpuRounds,
        difficulty: selectedDifficulty,
        arena: selectedArena,
        style: selectedFighterStyle,
        rival: selectedRival,
        durationFrames: matchElapsedFrames,
        medal: medal.id,
        events: {
            combos: matchStats.playerCombos,
            blocks: matchStats.playerBlocks,
            specials: matchStats.playerSpecials,
            airAttacks: matchStats.playerAirAttacks
        }
    };
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

function renderRivalPreference() {
    const select = document.getElementById('rival-select');
    if (select) select.value = selectedRival;
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

function getModeContextText() {
    if (gameMode === 'training') {
        if (!isTrainingTrial()) return `${t('modeTraining')} · ${t('trainingTrialFree')}`;
        const progress = trialState && trialState.completed ? t('trainingTrialCompleteShort') : getTrainingTrialProgressText();
        return t('trainingTrialToolbar', { trial: getTrialIndex(), total: TRAINING_TRIAL_COUNT, progress });
    }
    if (gameMode === 'arcade' && arcadeRun) {
        return t('modeArcade', {
            fight: getArcadeFightNumber(),
            total: ARCADE_RUN_FIGHTS.length
        });
    }
    return t('modeVersus');
}

function renderModeContext() {
    const instructions = document.getElementById('instructions');
    if (!instructions) return;

    const fight = gameMode === 'arcade' && arcadeRun ? getArcadeFightNumber() : 0;
    const signature = `${getLanguage()}|${gameMode}|${fight}|${ARCADE_RUN_FIGHTS.length}|${activeTrialId}|${trialState && trialState.completed ? 'complete' : getTrainingTrialProgressText()}`;
    if (signature === modeContextCacheKey) return;

    const text = getModeContextText();
    instructions.textContent = text;
    instructions.setAttribute('aria-label', text);
    modeContextCacheKey = signature;
    renderTrainingTrial();
}

function renderTouchSpecialState() {
    const button = document.getElementById('btn-special');
    const stateElement = document.getElementById('btn-special-state');
    if (!button || !stateElement) return;

    const energy = Math.max(0, Math.min(MAX_ENERGY, Math.round(player1 ? player1.energy : 0)));
    const ready = energy >= MAX_ENERGY;
    const visible = mobileControlsEnabled && gameState === 'playing';
    const signature = `${getLanguage()}|${energy}|${ready}|${visible}`;
    if (signature === touchSpecialStateCacheKey) return;

    const state = ready ? t('specialReadyShort') : t('specialCharging');
    stateElement.textContent = state;
    button.setAttribute('data-state', ready ? 'ready' : 'charging');
    button.setAttribute('aria-disabled', ready ? 'false' : 'true');
    button.setAttribute('aria-label', t('specialButtonStateLabel', {
        action: t('touchSpecialAction'),
        state,
        energy,
        max: MAX_ENERGY
    }));
    touchSpecialStateCacheKey = signature;
}

function updateCombatStatusThresholds() {
    if (gameState !== 'playing' || !player1) return;

    if (player1.health <= 30 && !playerHealthDangerAnnounced) {
        playerHealthDangerAnnounced = true;
        announce(t('combatStatusHealthWarning'), 'threshold');
    } else if (player1.health > 30) {
        playerHealthDangerAnnounced = false;
    }

    const seconds = getCombatStatusTime();
    if (seconds !== null && seconds <= 10 && !timerTenAnnounced) {
        timerTenAnnounced = true;
        announce(t('combatStatusTimerTen'), 'threshold');
    }
    if (seconds !== null && seconds <= 5 && !timerFiveAnnounced) {
        timerFiveAnnounced = true;
        announce(t('combatStatusTimerFive'), 'threshold');
    }
}

function getInputBindingText(action) {
    return getInputBindingLabels(action).join(' / ');
}

function getInputTextParams() {
    const left = getInputBindingText('left');
    const right = getInputBindingText('right');
    const punch = getInputBindingText('punch');
    const kick = getInputBindingText('kick');
    const special = getInputBindingText('special');
    return {
        left,
        right,
        move: `${left} / ${right}`,
        jump: getInputBindingText('jump'),
        crouch: getInputBindingText('crouch'),
        block: getInputBindingText('block'),
        punch,
        kick,
        air: `${punch} / ${kick}`,
        special,
        pause: `${getInputBindingText('pause')} / ESC`
    };
}

function renderInputBindings() {
    if (document.querySelectorAll) {
        document.querySelectorAll('[data-input-binding]').forEach((element) => {
            const actions = String(element.getAttribute('data-input-binding') || '').split(',').filter(Boolean);
            element.textContent = actions.map(getInputBindingText).join(' / ');
        });
    }

    const summary = document.getElementById('controls-summary');
    if (summary) summary.textContent = t('controlsSummary', getInputTextParams());

    if (typeof renderInputBindingsDialog === 'function') renderInputBindingsDialog();
}

function renderLanguage() {
    if (document.documentElement) document.documentElement.lang = t('htmlLang');

    applyI18nAttributes();
    setElementText('orientation-warning', 'orientationWarning');
    setElementText('pause-button', 'pauseButton');
    setElementText('start-button', 'start');
    setElementText('arcade-run-button', 'arcadeRun');
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
    renderLanguagePreference();
    renderStylePreference();
    renderRivalPreference();
    renderStats();
    renderArenaPreview();
    renderSelectionSummary();
    renderInputBindings();
    modeContextCacheKey = null;
    touchSpecialStateCacheKey = null;
    pauseSummaryCacheKey = null;
    renderModeContext();
    renderTouchSpecialState();
    renderPauseSummary();
    combatStatusCacheKey = null;
    renderCombatStatus();

    renderGameOverActions();
    if (gameState === 'gameOver') renderGameOverText();
}

function getDifficultyLabelFor(key) {
    const normalized = DIFFICULTIES[key] ? key : 'normal';
    return t(`difficulty${normalized.charAt(0).toUpperCase()}${normalized.slice(1)}`);
}

function getArenaLabelFor(key) {
    const arena = ARENAS[key] || ARENAS.notebook;
    return t(arena.labelKey || arena.label);
}

function getRivalLabelFor(key) {
    const rival = CPU_RIVALS[key] || CPU_RIVALS.nullPointer;
    return t(rival.labelKey);
}

function renderGameOverActions() {
    const restartButton = document.getElementById('restart-button');
    if (!restartButton) return;

    if (gameMode !== 'arcade' || !arcadeRun) {
        restartButton.textContent = t('restart');
    } else if (arcadeRun.awaitingNext) {
        restartButton.textContent = t('arcadeNextFight');
    } else {
        restartButton.textContent = t('arcadeRetry');
    }
}

function renderArcadeRunSummary(winText) {
    const result = document.createElement('div');
    const medalElement = document.createElement('div');
    const medalTitle = document.createElement('span');
    const medalDetail = document.createElement('small');
    const summary = document.createElement('div');
    const progress = document.createElement('div');
    const results = document.createElement('div');
    const phraseElement = document.createElement('p');
    const lastResult = arcadeRun.results[arcadeRun.results.length - 1];
    const runComplete = arcadeRun.results.length === ARCADE_RUN_FIGHTS.length && lastResult && lastResult.result === 'win';
    const playerWon = lastResult && lastResult.result === 'win';
    const medal = getPostMatchMedal(!!playerWon);

    result.textContent = runComplete ? t('arcadeComplete') : (arcadeRun.awaitingNext ? t('playerWins') : t('arcadeOver'));
    medalElement.className = 'post-match-medal';
    medalTitle.textContent = medal.title;
    medalDetail.textContent = medal.detail;
    medalElement.append(medalTitle, medalDetail);
    summary.className = 'post-match-summary arcade-run-summary';
    progress.textContent = getArcadeProgressText();
    results.className = 'arcade-run-results';

    arcadeRun.results.forEach((record) => {
        const row = document.createElement('div');
        row.textContent = t('arcadeResult', {
            fight: record.fight,
            rival: getRivalLabelFor(record.rival),
            difficulty: getDifficultyLabelFor(record.difficulty),
            arena: getArenaLabelFor(record.arena),
            score: `${record.playerRounds}-${record.cpuRounds}`,
            result: record.result === 'win' ? t('arcadeWin') : t('arcadeLoss')
        });
        results.append(row);
    });

    if (arcadeRun.awaitingNext) {
        const next = getArcadeFight();
        const nextText = document.createElement('div');
        nextText.className = 'arcade-next-fight';
        nextText.textContent = t('arcadeNext', {
            rival: getRivalLabelFor(next.rival),
            difficulty: getDifficultyLabelFor(next.difficulty),
            arena: getArenaLabelFor(next.arena)
        });
        summary.append(progress, results, nextText);
    } else {
        phraseElement.textContent = getPostMatchPhrase(!!playerWon);
        summary.append(progress, results, phraseElement);
    }

    winText.replaceChildren(result, medalElement, summary);
}

function renderGameOverText() {
    const winText = document.getElementById('winner-text');
    if (!winText) return;

    if (gameMode === 'arcade' && arcadeRun) {
        renderArcadeRunSummary(winText);
        return;
    }

    const playerWon = playerRounds >= ROUNDS_TO_WIN;
    const medal = getPostMatchMedal(playerWon);
    const phrase = getPostMatchPhrase(playerWon);
    const result = document.createElement('div');
    const medalElement = document.createElement('div');
    const medalTitle = document.createElement('span');
    const medalDetail = document.createElement('small');
    const summary = document.createElement('div');
    const score = document.createElement('div');
    const difficulty = document.createElement('div');
    const arena = document.createElement('div');
    const rival = document.createElement('div');
    const streak = document.createElement('div');
    const phraseElement = document.createElement('p');

    result.textContent = playerWon ? t('playerWins') : t('cpuWins');
    medalElement.className = 'post-match-medal';
    medalTitle.textContent = medal.title;
    medalDetail.textContent = medal.detail;
    medalElement.append(medalTitle, medalDetail);
    summary.className = 'post-match-summary';
    score.textContent = `${t('finalScore')}: ${playerRounds}-${cpuRounds}`;
    difficulty.textContent = `${t('finalDifficulty')}: ${getDifficultyLabel()}`;
    arena.textContent = `${t('finalArena')}: ${getArenaLabel()}`;
    rival.textContent = `${t('finalRival')}: ${getRivalLabel()}`;
    streak.textContent = `${t('finalStreak')}: ${stats.currentStreak} | ${t('finalBest')}: ${stats.bestStreak}`;
    phraseElement.textContent = phrase;
    summary.append(score, difficulty, arena, rival, streak, phraseElement);
    winText.replaceChildren(result, medalElement, summary);
}

function renderPauseSummary() {
    const summary = document.getElementById('pause-summary');
    if (!summary || !player1 || !player2) return;

    const difficulty = getDifficultyLabel();
    const arena = getArenaLabel();
    const seconds = Math.ceil(roundTimeMs / 1000);
    const mode = getModeContextText();
    const controls = t('controlsSummary', getInputTextParams());
    const signature = [
        gameState,
        getLanguage(),
        mode,
        currentRound,
        playerRounds,
        cpuRounds,
        seconds,
        difficulty,
        arena,
        getRivalLabel(),
        controls
    ].join('|');
    if (signature === pauseSummaryCacheKey) return;

    summary.textContent = t('pauseSummary', {
        mode,
        round: currentRound,
        score: `${playerRounds}-${cpuRounds}`,
        seconds,
        difficulty,
        arena,
        rival: getRivalLabel(),
        controls
    });
    pauseSummaryCacheKey = signature;
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
    const toolbar = document.getElementById('game-toolbar');
    const toolbarHeight = toolbar && typeof toolbar.getBoundingClientRect === 'function' && toolbar.style.display !== 'none'
        ? Math.ceil(toolbar.getBoundingClientRect().height)
        : 0;
    const maxDisplayWidth = Math.max(160, viewport.width - horizontalPadding);
    const availableHeight = viewport.height - topReserve - bottomReserve - canvasBorderReserve - toolbarHeight;
    const maxDisplayHeight = Math.max(120, Math.min(viewport.height * heightRatio, availableHeight));
    const displayWidth = Math.floor(Math.min(maxDisplayWidth, maxDisplayHeight * aspectRatio));
    const displayHeight = Math.floor(displayWidth / aspectRatio);
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DEVICE_PIXEL_RATIO);
    const backingWidth = Math.round(displayWidth * dpr);
    const backingHeight = Math.round(displayHeight * dpr);
    debugMetrics.deviceDpr = window.devicePixelRatio || 1;
    debugMetrics.effectiveDpr = dpr;
    debugMetrics.backingMegapixels = (backingWidth * backingHeight) / 1000000;

    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;
    canvasDisplayWidth = displayWidth;
    hudCompactMode = displayWidth / WIDTH < 0.65;
    canvas.style.marginTop = topReserve ? `${topReserve}px` : '';
    canvas.style.marginBottom = bottomReserve ? `${bottomReserve}px` : '';
    const arenaShell = document.getElementById('arena-shell');
    if (arenaShell) arenaShell.style.width = `${displayWidth + canvasBorderReserve}px`;

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
    closeAllModalDialogs();
    player1 = new Fighter(250, true);
    player2 = new Fighter(750, false);
    player1.applyStyle(selectedFighterStyle);
    player2.applyStyle('balanced');
    player2.applyRival(selectedRival);
    floatingTexts = [];
    impactParticles = [];
    clearActiveInput();
    screenShake = 0;
    hitStopFrames = 0;
    impactFlash = null;
    specialFlash = null;
    specialReadyAnnounced = false;
    playerHealthDangerAnnounced = false;
    timerTenAnnounced = false;
    timerFiveAnnounced = false;
    lastCombatEvent = '';
    combatStatusCacheKey = null;
    announcementFrame = null;
    announcementPriority = 0;
    roundTimerFrames = ROUND_TIMER_FRAMES;
    roundTimeMs = ROUND_TIME_MS;
    if (gameMode === 'training') resetTraining();
    vsIntroTimer = VS_INTRO_FRAMES;
    resetSimulationClock();
    gameState = 'playing';
    showStatusMessage(`${t('round')} ${currentRound}`, 75);
    announce(t('roundAnnounce', { round: currentRound, rival: getRivalLabel() }), 'round');
    updateControlsVisibility();
    focusGameplayCanvas();
}

function startArcadeFight() {
    const fight = getArcadeFight();
    if (!fight) return;

    selectedDifficulty = fight.difficulty;
    selectedArena = fight.arena;
    selectedRival = fight.rival;
    activeTrialId = 'free';
    trialState = null;
    trialTick = 0;
    trialAnnouncementCacheKey = null;
    trainingTrialUiCacheKey = null;
    resetMatchProgress();
    startRound();
}

function startArcadeRun() {
    gameMode = 'arcade';
    arcadeRun = {
        fightIndex: 0,
        results: [],
        awaitingNext: false,
        menuSelection: {
            difficulty: selectedDifficulty,
            arena: selectedArena,
            rival: selectedRival
        }
    };
    initializeMatchSeed();
    startArcadeFight();
}

function continueArcadeRun() {
    if (gameMode !== 'arcade' || !arcadeRun || !arcadeRun.awaitingNext) return;

    arcadeRun.fightIndex++;
    arcadeRun.awaitingNext = false;
    startArcadeFight();
}

function restoreArcadeMenuSelection() {
    if (!arcadeRun) return;

    selectedDifficulty = arcadeRun.menuSelection.difficulty;
    selectedArena = arcadeRun.menuSelection.arena;
    selectedRival = arcadeRun.menuSelection.rival;
    arcadeRun = null;
    gameMode = 'versus';
    renderLanguagePreference();
    renderStylePreference();
    renderRivalPreference();
    renderArenaPreview();
    renderSelectionSummary();
}

function retryArcadeRun() {
    if (arcadeRun) {
        selectedDifficulty = arcadeRun.menuSelection.difficulty;
        selectedArena = arcadeRun.menuSelection.arena;
        selectedRival = arcadeRun.menuSelection.rival;
    }
    arcadeRun = null;
    startArcadeRun();
}

function initGame() {
    gameMode = 'versus';
    activeTrialId = 'free';
    trialState = null;
    trialTick = 0;
    trialAnnouncementCacheKey = null;
    trainingTrialUiCacheKey = null;
    initializeMatchSeed();
    resetMatchProgress();
    startRound();
}

function startTraining() {
    gameMode = 'training';
    activeTrialId = 'free';
    trialState = null;
    trialTick = 0;
    trialAnnouncementCacheKey = null;
    trainingTrialUiCacheKey = null;
    initializeMatchSeed();
    resetMatchProgress();
    startRound();
}

function resetTraining() {
    if (!player1 || !player2) return;
    resetTrainingFighters();
    resetTrialProgressState();
    lastCombatEvent = '';
    combatStatusCacheKey = null;
    renderTrainingTrial();
}

function setTrainingPosition(value) {
    if (isTrainingTrial()) return;
    trainingConfig.position = TRAINING_POSITIONS[value] ? value : 'mid';
    if (gameMode === 'training') resetTraining();
}

function setTrainingCpu(value) {
    if (isTrainingTrial()) return;
    trainingConfig.cpu = ['idle', 'block', 'normal'].includes(value) ? value : 'idle';
    if (player2) player2.trainingBehavior = trainingConfig.cpu;
}

function setTrainingTimer(value) {
    if (isTrainingTrial()) return;
    trainingConfig.timer = value === 'on';
    if (gameMode === 'training') resetTraining();
}

function setTrainingTrial(value) {
    const next = value === 'free' ? 'free' : (TRAINING_TRIAL_IDS.includes(value) ? value : 'free');
    if (gameMode !== 'training') {
        activeTrialId = next;
        trialState = null;
        trialTick = 0;
        return;
    }
    if (activeTrialId === next && trialState) return;
    activeTrialId = next;
    trialState = createTrialState(activeTrialId);
    trialTick = 0;
    trialAnnouncementCacheKey = null;
    trainingTrialUiCacheKey = null;
    resetTraining();
    modeContextCacheKey = null;
    updateControlsVisibility();
}

function refillTraining(type) {
    if (gameMode !== 'training' || !player1) return;
    if (type === 'health') {
        player1.health = Math.round(100 * (FIGHTER_STYLES[player1.styleKey] || FIGHTER_STYLES.balanced).health);
        player1.displayHealth = player1.health;
    } else if (type === 'energy') {
        player1.energy = MAX_ENERGY;
    }
}

function showMainMenu() {
    restoreArcadeMenuSelection();
    activeTrialId = 'free';
    trialState = null;
    trialTick = 0;
    trialAnnouncementCacheKey = null;
    trainingTrialUiCacheKey = null;
    closeAllModalDialogs();
    player1 = new Fighter(250, true);
    player2 = new Fighter(750, false);
    floatingTexts = [];
    impactParticles = [];
    clearActiveInput();
    screenShake = 0;
    hitStopFrames = 0;
    impactFlash = null;
    specialFlash = null;
    statusMessage = '';
    statusTimer = 0;
    resetMatchProgress();
    roundTimerFrames = ROUND_TIMER_FRAMES;
    roundTimeMs = ROUND_TIME_MS;
    vsIntroTimer = 0;
    resetSimulationClock();
    gameState = 'menu';
    document.getElementById('main-menu').style.display = 'flex';
    openModalDialog('main-menu', 'start-button');
    renderStats();
    updateControlsVisibility();
    showOnboardingIfNeeded();
}

function showHelpScreen() {
    closeAllModalDialogs();
    gameState = 'menu';
    document.getElementById('help-screen').style.display = 'flex';
    openModalDialog('help-screen', 'help-title', document.getElementById('help-button'));
    updateControlsVisibility();
}

function hideHelpScreen() {
    closeAllModalDialogs();
    document.getElementById('main-menu').style.display = 'flex';
    gameState = 'menu';
    openModalDialog('main-menu', 'help-button');
    updateControlsVisibility();
}

function showControlsScreen() {
    closeAllModalDialogs();
    gameState = 'menu';
    document.getElementById('controls-screen').style.display = 'flex';
    renderInputBindingsDialog();
    openModalDialog('controls-screen', 'controls-title', document.getElementById('controls-button'));
    updateControlsVisibility();
}

function hideControlsScreen() {
    cancelInputBindingCapture();
    closeAllModalDialogs();
    document.getElementById('main-menu').style.display = 'flex';
    gameState = 'menu';
    openModalDialog('main-menu', 'controls-button');
    updateControlsVisibility();
}

function pauseGame(silent = false) {
    if (gameState !== 'playing') return;

    if (!silent) playUISound('pause');
    clearActiveInput();
    if (player1) player1.clearComboSequence();
    if (player2) player2.clearComboSequence();
    resetSimulationClock();
    gameState = 'paused';
    renderPauseSummary();
    document.getElementById('pause-screen').style.display = 'flex';
    updateControlsVisibility();
    openModalDialog('pause-screen', 'pause-title');
}

function resumeGame() {
    if (gameState !== 'paused') return;

    playUISound('resume');
    clearActiveInput();
    resetSimulationClock();
    gameState = 'playing';
    document.getElementById('pause-screen').style.display = 'none';
    updateControlsVisibility();
    closeModalDialog('pause-screen', false);
    focusGameplayCanvas();
}

function togglePause() {
    if (gameState === 'playing') pauseGame();
    else if (gameState === 'paused') resumeGame();
}

function checkCollision() {
    const firstBox = player1.getPushBox();
    const secondBox = player2.getPushBox();

    if (!player1.intersects(firstBox, secondBox)) return;

    const overlap = Math.min(firstBox.x + firstBox.width, secondBox.x + secondBox.width) - Math.max(firstBox.x, secondBox.x);
    if (overlap <= 0) return;

    const firstCenter = firstBox.x + firstBox.width / 2;
    const secondCenter = secondBox.x + secondBox.width / 2;
    const left = firstCenter <= secondCenter ? player1 : player2;
    const right = left === player1 ? player2 : player1;
    const halfPush = overlap / 2;
    const leftCapacity = left.x - 50;
    const rightCapacity = WIDTH - 50 - right.x;
    const leftPush = Math.min(halfPush, leftCapacity);
    const rightPush = Math.min(halfPush, rightCapacity);
    const remaining = overlap - leftPush - rightPush;

    left.x -= leftPush + Math.min(remaining, Math.max(0, leftCapacity - leftPush));
    right.x += rightPush + Math.min(remaining, Math.max(0, rightCapacity - rightPush));
}

function update() {
    if (gameState !== 'playing') return;

    if (debugMetrics.active) debugStepCount++;

    if (vsIntroTimer > 0) {
        vsIntroTimer--;
        updateEffects();
        return;
    }

    matchElapsedFrames++;

    if (hitStopFrames > 0) {
        hitStopFrames--;
        updateEffects();
        return;
    }

    const actions = refreshInputSnapshot();
    const trialPhaseBeforeTick = isTrainingTrial() && trialState ? trialState.phase : 'none';
    player1.update(actions, player2);
    advanceTrainingTrialBeforeCpu(trialPhaseBeforeTick);
    if (hitStopFrames === 0) player2.update(actions, player1);
    finishTrainingTrialTick(trialPhaseBeforeTick);
    if (isTrainingTrial()) renderTrainingTrial();
    if (hitStopFrames === 0) checkCollision();
    updateEffects();

    if (player1.health <= 0 || player2.health <= 0) {
        if (gameMode === 'training') {
            resetTraining();
            showStatusMessage(t('trainingReset'), 60);
            return;
        }
        finishRound(player2.health <= 0);
        return;
    }

    updateRoundTimer();
    updateCombatStatusThresholds();
}

function finishRound(playerWon) {
    if (gameState !== 'playing') return;

    clearActiveInput();
    if (player1) player1.clearComboSequence();
    if (player2) player2.clearComboSequence();
    resetSimulationClock();

    if (playerWon === true) playerRounds++;
    else if (playerWon === false) cpuRounds++;

    document.getElementById('pause-screen').style.display = 'none';
    setFinishPoses(playerWon);

    if (playerRounds >= ROUNDS_TO_WIN || cpuRounds >= ROUNDS_TO_WIN) {
        finishMatch(playerRounds >= ROUNDS_TO_WIN);
        return;
    }

    gameState = 'roundOver';
    const roundMessage = playerWon === null ? t('tie') : (playerWon ? t('roundHuman') : t('roundCpu'));
    showStatusMessage(roundMessage, 90);
    announce(roundMessage, 'round');
    updateControlsVisibility();
    const roundMode = gameMode;
    setTimeout(() => {
        if (gameState !== 'roundOver' || gameMode !== roundMode) return;
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

function updateRoundTimer() {
    if (gameMode === 'training' && !getEffectiveTrainingConfig().timer) return;
    if (roundTimerFrames <= 0) return;

    roundTimerFrames = Math.max(0, roundTimerFrames - 1);
    roundTimeMs = roundTimerFrames * FIXED_STEP_MS;

    if (roundTimeMs > 0) return;

    if (gameMode === 'training') {
        resetTraining();
        showStatusMessage(t('trainingReset'), 60);
        return;
    }

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

    if (player1 && player1.energy >= MAX_ENERGY && !specialReadyAnnounced) {
        specialReadyAnnounced = true;
        announce(t('specialAnnounce'), 'special');
    } else if (player1 && player1.energy < MAX_ENERGY) {
        specialReadyAnnounced = false;
    }

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
    floatingTexts.push(new FloatingText(fighter.x, fighter.y - 140, t('specialImpact'), color));
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
        const spread = -1.2 + randomCosmetic() * 2.4;
        const speed = blocked ? 3 + randomCosmetic() * 3 : 5 + randomCosmetic() * 6;
        const vx = direction * speed;
        const vy = spread * speed;
        const color = !blocked && accentColor && i === 0 ? accentColor : colors[Math.floor(randomCosmetic() * colors.length)];
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
    drawArenaForeground();
    impactParticles.forEach((p) => p.draw());
    drawSpecialFlash();
    drawImpactFlash();
    floatingTexts.forEach((t) => t.draw());
    drawHealthBars();
    drawVsIntro();
    drawStatusMessage();
    if (debugOverlayEnabled) drawDebugOverlay();

    ctx.restore();
}

function drawDebugBox(box, color, label) {
    if (!box) return;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(box.x, box.y, box.width, box.height);
    ctx.fillStyle = color;
    ctx.fillText(label, box.x, box.y - 3);
}

function drawDebugOverlay() {
    const data = getDebugData();
    ctx.save();
    ctx.font = `bold 11px ${GAME_FONT_FAMILY}`;
    ctx.textAlign = 'left';
    [[data.player1, '#1f6feb', 'P1'], [data.player2, '#d22', 'CPU']].forEach(([fighter, color, label], index) => {
        if (!fighter) return;
        drawDebugBox(fighter.hurtBox, '#ff00aa', `${label} hurt`);
        drawDebugBox(fighter.pushBox, '#00aaff', `${label} push`);
        drawDebugBox(fighter.hitBox, '#ff8800', `${label} hit`);
        ctx.fillStyle = '#111';
        ctx.fillText(`${label} ${fighter.state} cd:${fighter.cooldown} stun:${fighter.hitStun} combo:${fighter.comboTimer} ai:${fighter.aiAction}/${fighter.aiDecisionTimer} e:${fighter.energy}`, 12, HEIGHT - 42 + index * 14);
    });
    ctx.fillStyle = '#111';
    ctx.fillText(`debug ${data.gameState} fps:${data.fps} ticks:${data.ticks} seed:${data.seed}`, 12, HEIGHT - 26);
    const metrics = data.metrics;
    ctx.fillText(`p95 frame:${metrics.p95FrameWorkMs === null ? 'n/a' : metrics.p95FrameWorkMs.toFixed(2)}ms raf:${metrics.p95RafMs === null ? 'n/a' : metrics.p95RafMs.toFixed(2)}ms dpr:${metrics.deviceDpr}/${metrics.effectiveDpr} drop:${Math.round(metrics.frameClampDiscardMs + metrics.accumulatorCapDiscardMs + metrics.stepCapDiscardMs)}ms`, 12, HEIGHT - 12);
    ctx.restore();
}

function updateControlsVisibility() {
    document.getElementById('controls').style.display = mobileControlsEnabled && gameState === 'playing' ? 'block' : 'none';
    const toolbar = document.getElementById('game-toolbar');
    if (toolbar) toolbar.style.display = gameState === 'playing' ? 'flex' : 'none';
    document.getElementById('pause-button').style.display = gameState === 'playing' ? 'block' : 'none';
    const trainingPanel = document.getElementById('training-panel');
    if (trainingPanel) trainingPanel.style.display = gameMode === 'training' && gameState === 'playing' ? 'block' : 'none';
    renderModeContext();
    renderTouchSpecialState();
    resizeCanvas();
    renderCombatStatus();
    updateOrientationWarning();
}

function finishMatch(playerWon) {
    if (gameState !== 'playing') return;

    if (player1) player1.clearComboSequence();
    if (player2) player2.clearComboSequence();
    const record = createMatchHistoryRecord(playerWon);
    gameState = 'gameOver';
    showStatusMessage(t('ko'), 180);
    recordMatchResult(playerWon);
    appendMatchHistory(record);

    if (gameMode === 'arcade' && arcadeRun) {
        arcadeRun.results.push(record);
        arcadeRun.awaitingNext = playerWon && arcadeRun.fightIndex < ARCADE_RUN_FIGHTS.length - 1;
    }

    renderGameOverActions();
    renderGameOverText();
    document.getElementById('game-over').style.display = 'block';
    updateControlsVisibility();
    announce(t('finalAnnounce', { result: playerWon ? t('playerWins') : t('cpuWins') }), 'final');
    openModalDialog('game-over', 'game-over-title');
}

function moveDialogFocus(direction) {
    if (!activeDialog) return;
    const focusables = getFocusableElements(activeDialog);
    if (!focusables.length) return;
    const currentIndex = focusables.indexOf(document.activeElement);
    const nextIndex = currentIndex === -1
        ? (direction < 0 ? focusables.length - 1 : 0)
        : (currentIndex + direction + focusables.length) % focusables.length;
    focusDialogTarget(focusables[nextIndex]);
}

function adjustFocusedSelect(direction) {
    const target = document.activeElement;
    if (!target || String(target.tagName || '').toLowerCase() !== 'select' || !target.options || !target.options.length) return false;
    const nextIndex = Math.min(target.options.length - 1, Math.max(0, (target.selectedIndex || 0) + direction));
    if (nextIndex === target.selectedIndex) return true;
    target.selectedIndex = nextIndex;
    if (typeof target.dispatchEvent === 'function' && typeof Event === 'function') target.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
}

function activateFocusedControl() {
    const target = document.activeElement;
    if (target && typeof target.click === 'function') target.click();
}

function isGameplayStatusFocus(target = null) {
    const statusSummary = document.getElementById('combat-status-summary');
    const focused = target || (document.activeElement && document.activeElement !== document.body ? document.activeElement : null);
    return !!focused && (focused === canvas || focused === statusSummary);
}

function handleGamepadEvents(events) {
    if (!events) return;
    if (events.status && (gameState === 'playing' || gameState === 'paused') && isGameplayStatusFocus()) {
        announceCombatStatus();
    }
    if (events.start && (gameState === 'playing' || gameState === 'paused')) {
        togglePause();
    }
    if (!activeDialog) return;

    if (events.up) moveDialogFocus(-1);
    if (events.down) moveDialogFocus(1);
    if (events.left) adjustFocusedSelect(-1);
    if (events.right) adjustFocusedSelect(1);
    if (events.confirm) activateFocusedControl();
    if (events.cancel) {
        if (activeDialog.id === 'help-screen') hideHelpScreen();
        else if (activeDialog.id === 'controls-screen') hideControlsScreen();
        else if (activeDialog.id === 'pause-screen') resumeGame();
    }
}

function advanceSimulation(deltaMs) {
    if (gameState !== 'playing') return;

    const rawDelta = Math.max(0, Number(deltaMs) || 0);
    const acceptedDelta = Math.min(MAX_FRAME_DELTA_MS, rawDelta);
    const accumulatorBefore = simulationAccumulator;
    if (debugMetrics.active) {
        debugMetrics.frameClampDiscardMs += Math.max(0, rawDelta - acceptedDelta);
        debugMetrics.accumulatorCapDiscardMs += Math.max(0, accumulatorBefore + acceptedDelta - MAX_FRAME_DELTA_MS);
    }
    simulationAccumulator = Math.min(MAX_FRAME_DELTA_MS, accumulatorBefore + acceptedDelta);
    let steps = 0;

    while (simulationAccumulator + 0.000001 >= FIXED_STEP_MS && steps < MAX_SIMULATION_STEPS) {
        const updateStart = debugMetrics.active ? getDebugNow() : null;
        update();
        const updateEnd = debugMetrics.active ? getDebugNow() : null;
        if (updateStart !== null && updateEnd !== null) pushDebugSample(debugMetrics.updateStepMs, Math.max(0, updateEnd - updateStart));
        simulationAccumulator -= FIXED_STEP_MS;
        steps++;
    }

    if (simulationAccumulator < 0.000001 || (steps === MAX_SIMULATION_STEPS && simulationAccumulator >= FIXED_STEP_MS)) {
        if (debugMetrics.active && steps === MAX_SIMULATION_STEPS && simulationAccumulator >= FIXED_STEP_MS) {
            debugMetrics.stepCapDiscardMs += simulationAccumulator;
        }
        simulationAccumulator = 0;
    }

    if (debugMetrics.active) {
        debugMetrics.stepsPerFrame += steps;
        if (steps > 1) debugMetrics.multiStepFrames++;
        debugMetrics.maxStepsPerFrame = Math.max(debugMetrics.maxStepsPerFrame, steps);
    }
}

function gameLoop(timestamp = 0) {
    const deltaMs = lastFrameTimestamp === null ? 0 : Math.max(0, timestamp - lastFrameTimestamp);
    lastFrameTimestamp = timestamp;
    const collecting = debugOverlayEnabled && gameState === 'playing';
    debugMetrics.active = collecting;
    const frameStart = collecting ? getDebugNow() : null;

    handleGamepadEvents(pollInputGamepads());
    refreshInputSnapshot();
    const simulationStart = collecting ? getDebugNow() : null;
    advanceSimulation(deltaMs);
    const simulationEnd = collecting ? getDebugNow() : null;
    if (simulationStart !== null && simulationEnd !== null) pushDebugSample(debugMetrics.simulationFrameMs, Math.max(0, simulationEnd - simulationStart));
    renderTouchSpecialState();
    renderCombatStatus();
    const drawStart = collecting ? getDebugNow() : null;
    draw();
    const frameEnd = collecting ? getDebugNow() : null;
    if (collecting) {
        debugFrameCount++;
        debugMetrics.sampleCount++;
        if (lastFrameTimestamp !== null && deltaMs > 0) pushDebugSample(debugMetrics.rafDeltaMs, deltaMs);
        if (drawStart !== null && frameEnd !== null) pushDebugSample(debugMetrics.sceneDrawMs, Math.max(0, frameEnd - drawStart));
        if (frameStart !== null && frameEnd !== null) pushDebugSample(debugMetrics.frameWorkMs, Math.max(0, frameEnd - frameStart));
        if (debugTimestamp === null) debugTimestamp = timestamp;
        if (timestamp - debugTimestamp >= 1000) {
            const elapsed = timestamp - debugTimestamp;
            debugFps = Math.round(debugFrameCount * 1000 / elapsed);
            debugTicksPerSecond = Math.round(debugStepCount * 1000 / elapsed);
            debugFrameCount = 0;
            debugStepCount = 0;
            debugTimestamp = timestamp;
        }
    } else {
        debugTimestamp = null;
        debugFrameCount = 0;
        debugStepCount = 0;
    }
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

        const releasePointer = (pointerId) => {
            const active = activePointers.get(pointerId);
            if (!active) return;

            activePointers.delete(pointerId);
            clearInputSource(active.sourceId);
            refreshInputSnapshot();
        };

        btn.addEventListener('pointerdown', (e) => {
            if (e.button !== undefined && e.button !== 0) return;
            if (key === 'special' && (!player1 || player1.energy < MAX_ENERGY)) return;
            if (e.preventDefault) e.preventDefault();
            initAudio();
            const sourceId = `pointer:${e.pointerId}`;
            activePointers.set(e.pointerId, { key, sourceId, button: btn, pointerId: e.pointerId });
            if (btn.setPointerCapture) btn.setPointerCapture(e.pointerId);
            setInputSource(sourceId, key, true);
            refreshInputSnapshot();
        });

        btn.addEventListener('pointerup', (e) => releasePointer(e.pointerId));
        btn.addEventListener('pointercancel', (e) => releasePointer(e.pointerId));
        btn.addEventListener('lostpointercapture', (e) => releasePointer(e.pointerId));
        btn.addEventListener('keydown', (e) => {
            if (e.repeat || (e.key !== ' ' && e.key !== 'Enter')) return;
            if (key === 'special' && (!player1 || player1.energy < MAX_ENERGY)) return;
            if (e.preventDefault) e.preventDefault();
            setInputSource(`button:${key}:${e.key}`, key, true);
            refreshInputSnapshot();
        });
        btn.addEventListener('keyup', (e) => {
            if (e.key !== ' ' && e.key !== 'Enter') return;
            if (e.preventDefault) e.preventDefault();
            clearInputSource(`button:${key}:${e.key}`);
            refreshInputSnapshot();
        });
        btn.addEventListener('click', (e) => {
            if (e.preventDefault) e.preventDefault();
        });
    });
}

function setupKeyboardControls() {
    window.addEventListener('keydown', (e) => {
        const code = getInputKeyboardCode(e);

        if (e.ctrlKey || e.altKey || e.metaKey) return;
        if (e.shiftKey && code !== 'Tab') return;

        if (getInputBindingCapture()) {
            const result = captureInputBinding(e);
            if (e.preventDefault) e.preventDefault();
            renderInputBindingsDialog(result);
            return;
        }

        if (activeDialog) {
            if (trapDialogFocus(e)) return;
            if (code === 'Escape') {
                if (e.preventDefault) e.preventDefault();
                if (activeDialog.id === 'help-screen') hideHelpScreen();
                else if (activeDialog.id === 'controls-screen') hideControlsScreen();
                else if (activeDialog.id === 'pause-screen') resumeGame();
                return;
            }
        }

        const activeElement = document.activeElement && document.activeElement !== document.body
            ? document.activeElement
            : e.target;
        const pauseButton = document.getElementById('pause-button');
        if (gameState === 'playing' && code === 'Tab') {
            if (!e.shiftKey && isElementWithin(activeElement, canvas)) {
                if (e.preventDefault) e.preventDefault();
                if (pauseButton && typeof pauseButton.focus === 'function') pauseButton.focus({ preventScroll: true });
                return;
            }
            if (e.shiftKey && isElementWithin(activeElement, pauseButton)) {
                if (e.preventDefault) e.preventDefault();
                focusGameplayCanvas();
                return;
            }
        }

        const targetPolicy = getKeyboardTargetPolicy(e.target || activeElement);
        if (targetPolicy === 'editing') return;
        if (targetPolicy === 'activation' && (code === 'Enter' || code === 'Space')) return;

        const action = getInputActionForCode(code);
        if (action === 'status' && (gameState === 'playing' || gameState === 'paused') && isGameplayStatusFocus(activeElement)) {
            if (e.preventDefault) e.preventDefault();
            if (!e.repeat) announceCombatStatus();
            return;
        }
        if (action === 'pause' && (gameState === 'playing' || gameState === 'paused')) {
            if (e.preventDefault) e.preventDefault();
            if (!e.repeat) togglePause();
            return;
        }

        if (code === 'Escape' && (gameState === 'playing' || gameState === 'paused')) {
            if (e.preventDefault) e.preventDefault();
            if (!e.repeat || code === 'Escape') togglePause();
            return;
        }

        if (code === 'Backquote' && (gameState === 'playing' || gameState === 'paused')) {
            if (e.preventDefault) e.preventDefault();
            toggleDebugOverlay();
            return;
        }

        if (action && gameState === 'playing') {
            if (e.preventDefault) e.preventDefault();
            setInputSource(`keyboard:${code}`, action, true);
            refreshInputSnapshot();
            return;
        }

        if (gameState === 'playing' && code.startsWith('Arrow') && e.preventDefault) {
            e.preventDefault();
        }
    });

    window.addEventListener('keyup', (e) => {
        clearInputSource(`keyboard:${getInputKeyboardCode(e)}`);
        refreshInputSnapshot();
    });
}

function renderInputBindingsDialog(result = null) {
    const list = document.getElementById('bindings-list');
    const status = document.getElementById('binding-status');
    const capture = getInputBindingCapture();
    if (status) {
        if (result && result.ok) status.textContent = t('bindingSaved');
        else if (result && result.cancelled) status.textContent = t('bindingCaptureCancelled');
        else if (result && result.reason === 'reserved') status.textContent = t('bindingReserved');
        else if (result && result.reason === 'conflict') status.textContent = t('bindingConflict', { action: t(`inputAction${result.conflict.charAt(0).toUpperCase()}${result.conflict.slice(1)}`) });
        else if (result && result.reason === 'invalid') status.textContent = t('bindingInvalid');
        else if (capture) status.textContent = t('bindingPressKey');
    }
    if (!list || typeof document.createElement !== 'function') return;

    list.replaceChildren();
    const bindings = getInputBindings();
    INPUT_REMAPPABLE_ACTIONS.forEach((action) => {
        const row = document.createElement('div');
        const label = document.createElement('strong');
        const values = document.createElement('div');
        const actionLabel = t(`inputAction${action.charAt(0).toUpperCase()}${action.slice(1)}`);
        row.className = 'binding-row';
        label.className = 'binding-action';
        values.className = 'binding-values';
        label.textContent = actionLabel;

        const addCaptureButton = (slot, text, className = 'binding-button') => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = className;
            button.setAttribute('data-binding-action', action);
            button.setAttribute('data-binding-slot', String(slot));
            button.textContent = capture && capture.action === action && capture.slot === slot
                ? t('bindingPressKey')
                : text;
            button.setAttribute('aria-label', t('bindingName', {
                action: actionLabel,
                slot: slot + 1,
                key: text === t('bindingUnassigned') ? t('bindingUnassigned') : inputBindingAccessibleLabel(text)
            }));
            button.addEventListener('click', () => {
                beginInputBindingCapture(action, slot);
                renderInputBindingsDialog();
            });
            values.append(button);
        };

        if (action === 'status' && !bindings[action].length) addCaptureButton(0, t('bindingUnassigned'), 'binding-button binding-button--unassigned');

        bindings[action].forEach((code, slot) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'binding-button';
            button.setAttribute('data-binding-action', action);
            button.setAttribute('data-binding-slot', String(slot));
            button.textContent = capture && capture.action === action && capture.slot === slot
                ? t('bindingPressKey')
                : inputBindingLabel(code);
            button.setAttribute('aria-label', t('bindingName', {
                action: t(`inputAction${action.charAt(0).toUpperCase()}${action.slice(1)}`),
                slot: slot + 1,
                key: inputBindingAccessibleLabel(code)
            }));
            button.addEventListener('click', () => {
                beginInputBindingCapture(action, slot);
                renderInputBindingsDialog();
            });
            values.append(button);
        });

        if (bindings[action].length < INPUT_MAX_BINDINGS_PER_ACTION && !(action === 'status' && !bindings[action].length)) {
            const addButton = document.createElement('button');
            addButton.type = 'button';
            addButton.className = 'binding-button binding-button--add';
            addButton.setAttribute('data-binding-action', action);
            addButton.setAttribute('data-binding-slot', String(bindings[action].length));
            addButton.textContent = '+';
            addButton.setAttribute('aria-label', t('bindingAddForAction', {
                action: t(`inputAction${action.charAt(0).toUpperCase()}${action.slice(1)}`)
            }));
            addButton.addEventListener('click', () => {
                beginInputBindingCapture(action, bindings[action].length);
                renderInputBindingsDialog();
            });
            values.append(addButton);
        }

        if (action === 'status') {
            const removeButton = document.createElement('button');
            removeButton.type = 'button';
            removeButton.className = 'binding-button binding-button--remove';
            removeButton.textContent = '−';
            removeButton.setAttribute('aria-label', t('bindingRemove'));
            removeButton.disabled = !bindings[action].length;
            removeButton.addEventListener('click', () => {
                clearInputBinding(action);
                renderInputBindingsDialog();
            });
            values.append(removeButton);
        }

        row.append(label, values);
        list.append(row);

        if (capture && capture.action === action && values.children[capture.slot] && typeof values.children[capture.slot].focus === 'function') {
            values.children[capture.slot].focus({ preventScroll: true });
        }
    });

    if (result && result.navigation) {
        const dialog = activeDialog || document.getElementById('controls-screen');
        const focusables = getFocusableElements(dialog);
        const currentIndex = focusables.findIndex((element) => element.getAttribute('data-binding-action') === result.action && Number(element.getAttribute('data-binding-slot')) === result.slot);
        if (focusables.length) {
            const direction = result.navigation === 'previous' ? -1 : 1;
            const nextIndex = currentIndex === -1
                ? (direction < 0 ? focusables.length - 1 : 0)
                : (currentIndex + direction + focusables.length) % focusables.length;
            focusables[nextIndex].focus({ preventScroll: true });
        }
    } else if (result && status && typeof status.focus === 'function') status.focus({ preventScroll: true });
}

function setupRestartButton() {
    document.getElementById('restart-button').addEventListener('click', () => {
        playUISound('start');
        if (gameMode === 'arcade') {
            if (arcadeRun && arcadeRun.awaitingNext) continueArcadeRun();
            else retryArcadeRun();
        } else {
            initGame();
        }
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
    document.getElementById('controls-button').addEventListener('click', () => {
        playUISound('select');
        showControlsScreen();
    });
    document.getElementById('training-button').addEventListener('click', () => {
        playUISound('start');
        startTraining();
    });
    document.getElementById('arcade-run-button').addEventListener('click', () => {
        playUISound('start');
        startArcadeRun();
    });
    document.getElementById('back-button').addEventListener('click', () => {
        playUISound('menu');
        hideHelpScreen();
    });
    document.getElementById('controls-back-button').addEventListener('click', () => {
        playUISound('menu');
        hideControlsScreen();
    });
    document.getElementById('reset-controls-button').addEventListener('click', () => {
        playUISound('select');
        resetInputBindings();
        renderInputBindings();
        renderInputBindingsDialog({ ok: true });
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
    document.getElementById('rival-select').addEventListener('change', (e) => {
        playUISound('select');
        setRival(e.target.value);
    });
    document.getElementById('reduce-motion-toggle').addEventListener('change', (e) => {
        playUISound('select');
        setReducedMotion(e.target.checked);
    });
}

function setupTrainingControls() {
    document.getElementById('training-reset-button').addEventListener('click', resetTraining);
    document.getElementById('training-health-button').addEventListener('click', () => refillTraining('health'));
    document.getElementById('training-energy-button').addEventListener('click', () => refillTraining('energy'));
    document.getElementById('training-trial-select').addEventListener('change', (e) => setTrainingTrial(e.target.value));
    document.getElementById('training-trial-next').addEventListener('click', () => {
        if (!isTrainingTrial() || !trialState || !trialState.completed) return;
        const currentIndex = getTrialIndex() - 1;
        setTrainingTrial(TRAINING_TRIAL_IDS[currentIndex + 1] || 'free');
    });
    document.getElementById('training-position-select').addEventListener('change', (e) => setTrainingPosition(e.target.value));
    document.getElementById('training-cpu-select').addEventListener('change', (e) => setTrainingCpu(e.target.value));
    document.getElementById('training-timer-select').addEventListener('change', (e) => setTrainingTimer(e.target.value));
}

function setupCombatStatus() {
    const details = document.getElementById('combat-status');
    if (!details) return;
    details.addEventListener('toggle', () => {
        resizeCanvas();
        renderCombatStatus();
    });
}

function setupOnboarding() {
    document.getElementById('onboarding-next-button').addEventListener('click', () => {
        if (onboardingStep < 2) {
            onboardingStep++;
            renderOnboarding();
        } else {
            completeOnboarding(true);
        }
    });
    document.getElementById('onboarding-skip-button').addEventListener('click', () => completeOnboarding(false));
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
    setupTrainingControls();
    setupCombatStatus();
    setupOnboarding();
    gameLoop();
});

window.addEventListener('resize', resizeCanvas);
window.addEventListener('blur', clearActiveInput);

document.addEventListener('visibilitychange', () => {
    clearActiveInput();
    if (document.hidden && gameState === 'playing') pauseGame(true);
});
