const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

function createMockContext() {
    const ctx = {
        calls: [],
        textCalls: [],
        lastTransform: null,
        save() { this.calls.push('save'); },
        restore() { this.calls.push('restore'); },
        beginPath() { this.calls.push('beginPath'); },
        moveTo() { this.calls.push('moveTo'); },
        lineTo() { this.calls.push('lineTo'); },
        quadraticCurveTo() { this.calls.push('quadraticCurveTo'); },
        arc() { this.calls.push('arc'); },
        ellipse() { this.calls.push('ellipse'); },
        fill() { this.calls.push('fill'); },
        stroke() { this.calls.push('stroke'); },
        fillRect() { this.calls.push('fillRect'); },
        strokeRect() { this.calls.push('strokeRect'); },
        closePath() { this.calls.push('closePath'); },
        clearRect() { this.calls.push('clearRect'); },
        translate() { this.calls.push('translate'); },
        scale() { this.calls.push('scale'); },
        strokeText(text) { this.calls.push('strokeText'); this.textCalls.push(text); },
        fillText(text) { this.calls.push('fillText'); this.textCalls.push(text); },
        measureText(text) { return { width: String(text).length * 7 }; },
        setTransform(a, b, c, d, e, f) {
            this.calls.push('setTransform');
            this.lastTransform = [a, b, c, d, e, f];
        }
    };

    return ctx;
}

function createMockAudioContext(audioEvents = []) {
    return class MockAudioContext {
        constructor() {
            this.destination = {};
        }

        createOscillator() {
            return {
                type: '',
                frequency: { value: 0 },
                connect() { return this; },
                disconnect() { audioEvents.push({ event: 'disconnect', type: 'oscillator' }); },
                start() { audioEvents.push({ event: 'start', type: this.type, frequency: this.frequency.value }); },
                stop() { audioEvents.push({ event: 'stop', type: this.type, frequency: this.frequency.value }); }
            };
        }

        createGain() {
            return {
                gain: { value: 0 },
                connect() { return this; },
                disconnect() { audioEvents.push({ event: 'disconnect', type: 'gain' }); }
            };
        }
    };
}

function loadGame(options = {}) {
    const ctx = createMockContext();
    const audioEvents = [];
    const elements = new Map();
    let activeElement = null;
    const staticTags = {
        'pause-button': 'button',
        'start-button': 'button',
        'training-button': 'button',
        'arcade-run-button': 'button',
        'help-button': 'button',
        'controls-button': 'button',
        'language-select': 'select',
        'difficulty-select': 'select',
        'arena-select': 'select',
        'style-select': 'select',
        'rival-select': 'select',
        'reduce-motion-toggle': 'input',
        'back-button': 'button',
        'controls-back-button': 'button',
        'reset-controls-button': 'button',
        'resume-button': 'button',
        'pause-menu-button': 'button',
        'restart-button': 'button',
        'menu-button': 'button',
        'onboarding-next-button': 'button',
        'onboarding-skip-button': 'button',
        'duel-settings': 'details',
        'controls-screen': 'div',
        'help-screen': 'div',
        'main-menu': 'div',
        'pause-screen': 'div',
        'game-over': 'div',
        'bindings-list': 'div',
        'binding-status': 'div',
        'game-toolbar': 'div',
        'arena-shell': 'div',
        'combat-status': 'details',
        'combat-status-summary': 'summary',
        'combat-status-compact': 'span',
        'combat-status-details': 'dl'
    };
    const staticParents = {
        'pause-button': 'game-toolbar',
        game: 'arena-shell',
        'bindings-list': 'controls-screen',
        'binding-status': 'controls-screen',
        'reset-controls-button': 'controls-screen',
        'controls-back-button': 'controls-screen',
        'combat-status': 'game-toolbar',
        'combat-status-summary': 'combat-status',
        'combat-status-compact': 'combat-status-summary',
        'combat-status-details': 'combat-status'
    };
    const canvas = {
        id: 'game',
        tagName: 'CANVAS',
        nodeName: 'CANVAS',
        width: 1000,
        height: 500,
        style: {},
        focused: false,
        attributes: { tabindex: '0' },
        focus(options) {
            elements.forEach((element) => { element.focused = false; });
            this.focused = true;
            this.focusOptions = options;
            activeElement = this;
        },
        setAttribute(name, value) {
            this.attributes[name] = value;
        },
        getAttribute(name) {
            return this.attributes[name];
        },
        getContext(type) {
            assert.equal(type, '2d');
            return ctx;
        }
    };

    function matchesSelector(element, selector) {
        const value = selector.trim();
        if (value === 'summary') return element.tagName === 'SUMMARY';
        if (value === '[href]') return element.getAttribute('href') !== undefined && element.getAttribute('href') !== null;
        if (value.startsWith('button')) return element.tagName === 'BUTTON' && !element.disabled;
        if (value.startsWith('select')) return element.tagName === 'SELECT' && !element.disabled;
        if (value.startsWith('input')) return element.tagName === 'INPUT' && !element.disabled;
        if (value.startsWith('textarea')) return element.tagName === 'TEXTAREA' && !element.disabled;
        if (value.startsWith('[tabindex]')) return element.getAttribute('tabindex') !== undefined && element.getAttribute('tabindex') !== null && element.getAttribute('tabindex') !== '-1';
        if (value.startsWith('[contenteditable]')) return element.getAttribute('contenteditable') !== undefined && element.getAttribute('contenteditable') !== null && element.getAttribute('contenteditable') !== 'false';
        return false;
    }

    function createElement(id = '', tagName = 'div') {
        const capturedPointers = new Set();
        return {
            id,
            tagName: String(tagName).toUpperCase(),
            nodeName: String(tagName).toUpperCase(),
            style: {},
            innerHTML: '',
            textContent: '',
            value: '',
            checked: false,
            className: '',
            children: [],
            parentElement: null,
            parentNode: null,
            listeners: {},
            attributes: {},
            hidden: false,
            inert: false,
            focused: false,
            addEventListener(type, handler) {
                this.listeners[type] = handler;
            },
            focus(options) {
                elements.forEach((element) => { element.focused = false; });
                canvas.focused = false;
                this.focused = true;
                this.focusOptions = options;
                activeElement = this;
            },
            setPointerCapture(pointerId) {
                capturedPointers.add(pointerId);
            },
            hasPointerCapture(pointerId) {
                return capturedPointers.has(pointerId);
            },
            releasePointerCapture(pointerId) {
                capturedPointers.delete(pointerId);
            },
            setAttribute(name, value) {
                this.attributes[name] = value;
            },
            getAttribute(name) {
                return this.attributes[name];
            },
            getBoundingClientRect() {
                return { height: 0 };
            },
            querySelectorAll(selector) {
                const selectors = String(selector).split(',');
                const descendants = [];
                const visit = (element) => {
                    element.children.forEach((child) => {
                        descendants.push(child);
                        visit(child);
                    });
                };
                visit(this);
                return descendants.filter((element) => selectors.some((item) => matchesSelector(element, item)));
            },
            append(...children) {
                children.forEach((child) => {
                    child.parentElement = this;
                    child.parentNode = this;
                    this.children.push(child);
                });
            },
            replaceChildren(...children) {
                this.children.forEach((child) => {
                    child.parentElement = null;
                    child.parentNode = null;
                });
                this.children = [];
                this.append(...children);
            }
        };
    }

    function getElement(id) {
        if (id === 'game') return canvas;
        if (!elements.has(id)) {
            const element = createElement(id, staticTags[id] || 'div');
            elements.set(id, element);
            const parentId = staticParents[id];
            if (parentId) getElement(parentId).append(element);
            if (id === 'combat-status-details') {
                for (let index = 0; index < 12; index++) {
                    element.append(createElement('', 'dt'), createElement('', 'dd'));
                }
            }
        }
        return elements.get(id);
    }

    const windowListeners = {};
    const documentListeners = {};
    const storage = new Map();
    Object.entries(options.storage || {}).forEach(([key, value]) => storage.set(key, value));
    const MockAudioContext = createMockAudioContext(audioEvents);
    const navigatorMock = {
        maxTouchPoints: options.touchPoints || 0,
        language: options.language,
        languages: options.languages,
        getGamepads: options.getGamepads || (() => options.gamepads || [])
    };
    const context = {
        console,
        Math,
        setTimeout(fn) {
            fn();
            return 0;
        },
        requestAnimationFrame() {},
        navigator: navigatorMock,
            document: {
                documentElement: {},
                get activeElement() { return activeElement; },
                hidden: false,
            createElement(tagName) {
                return createElement('', tagName);
            },
            getElementById: getElement,
            addEventListener(type, handler) {
                documentListeners[type] = handler;
            }
        },
        window: {
            innerWidth: 800,
            innerHeight: 600,
            devicePixelRatio: 2,
            location: { search: options.search || '' },
            AudioContext: MockAudioContext,
            webkitAudioContext: MockAudioContext,
            localStorage: {
                getItem(key) { return storage.has(key) ? storage.get(key) : null; },
                setItem(key, value) { storage.set(key, value); },
                clear() { storage.clear(); }
            },
            navigator: navigatorMock,
            addEventListener(type, handler) {
                windowListeners[type] = handler;
            },
            matchMedia() {
                return { matches: options.reducedMotionSystem === true };
            }
        }
    };

    context.globalThis = context;

    const sourceFiles = ['i18n.js', 'config.js', 'input.js', 'audio.js', 'effects.js', 'ai.js', 'fighter_render.js', 'fighter.js', 'arena_render.js', 'hud_render.js', 'game.js'];
    const source = sourceFiles
        .map((file) => fs.readFileSync(path.join(__dirname, '..', 'src', file), 'utf8'))
        .join('\n');
    const exposeTestApi = `
        globalThis.__gameTest = {
            Fighter,
            FloatingText,
            ImpactParticle,
            playAttackSound,
            playImpactSound,
            playUISound,
            getAudioDiagnostics,
            announceCombatStatus,
            renderCombatStatus,
            t,
            I18N,
            ARENAS,
            CPU_RIVALS,
            DIFFICULTIES,
            ARCADE_RUN_FIGHTS,
            setLanguage,
            getLanguage,
            chooseAIAction,
            drawFighter,
            draw,
            resizeCanvas,
            initGame,
            startArcadeRun,
            continueArcadeRun,
            retryArcadeRun,
            startRound,
            showMainMenu,
            showHelpScreen,
            hideHelpScreen,
            pauseGame,
            resumeGame,
            togglePause,
            startTraining,
            resetTraining,
            setTrainingPosition,
            setTrainingCpu,
            setTrainingTimer,
            refillTraining,
            toggleDebugOverlay,
            getDebugData,
            setMatchRandomSeed,
            createSeededRandom,
            showOnboardingIfNeeded,
            completeOnboarding,
            clearActiveInput,
            getInputBindings,
            resetInputBindings,
            setInputBinding,
            setInputSource,
            clearInputSource,
            clearAllInputSources,
            getInputSnapshot,
            getInputActionForCode,
            pollInputGamepads,
             beginInputBindingCapture,
             getInputBindingCapture,
             captureInputBinding,
            renderInputBindingsDialog,
            renderModeContext,
            renderTouchSpecialState,
            getFighterMarkerLayout,
             getFocusableElements,
             trapDialogFocus,
             handleGamepadEvents,
            showControlsScreen,
            hideControlsScreen,
            setupMobileControls,
            setupKeyboardControls,
            setDifficulty,
            setFighterStyle,
            setRival,
            getRivalConfig,
            getRivalLabel,
            setRoundTimerFrames,
            setRoundTimeMs,
            skipVsIntro,
            setArena,
            getArenaConfig,
            getArenaLabel,
            renderArenaPreview,
            drawBackground,
            drawArenaForeground,
            setReducedMotion,
            renderMotionPreference,
            renderLanguage,
            recordMatchResult,
            getMatchHistory,
            appendMatchHistory,
            getVsIntroTitle,
            recordPlayerCombo,
            recordPlayerBlock,
            recordPlayerSpecial,
            recordPlayerAirAttack,
            getPostMatchMedal,
            getPostMatchPhrase,
            renderGameOverText,
            update,
            advanceSimulation,
            gameLoop,
            checkCollision,
            triggerImpactFeedback,
            triggerSpecialFeedback,
            getState: () => ({
                player1,
                player2,
                keys: { ...keys },
                 inputSnapshot: getInputSnapshot(),
                activePointerCount: activePointers.size,
                floatingTexts,
                impactParticles,
                gameState,
                gameMode,
                arcadeRun: arcadeRun ? {
                    ...arcadeRun,
                    results: arcadeRun.results.map((record) => ({ ...record, events: { ...record.events } })),
                    menuSelection: { ...arcadeRun.menuSelection }
                } : null,
                matchHistory: getMatchHistory(),
                matchElapsedFrames,
                trainingConfig: { ...trainingConfig },
                matchSeed,
                debugOverlayEnabled,
                selectedDifficulty,
                selectedFighterStyle,
                selectedRival,
                statusMessage,
                statusTimer,
                currentRound,
                playerRounds,
                cpuRounds,
                roundTimerFrames,
                roundTimeMs,
                simulationAccumulator,
                selectedArena,
                selectedLanguage,
                reducedMotionEnabled,
                stats,
                screenShake,
                hitStopFrames,
                visualFrame,
                impactFlash,
                specialFlash,
                vsIntroTimer,
                matchStats,
                canvasWidth: canvas.width,
                canvasHeight: canvas.height,
                canvasStyle: { ...canvas.style },
                mainMenuDisplay: document.getElementById('main-menu').style.display,
                helpScreenDisplay: document.getElementById('help-screen').style.display,
                onboardingScreenDisplay: document.getElementById('onboarding-screen').style.display,
                pauseScreenDisplay: document.getElementById('pause-screen').style.display,
                winnerTextHtml: document.getElementById('winner-text').innerHTML,
                winnerTextText: (() => {
                    const getText = (element) => element.textContent + element.children.map(getText).join('');
                    return getText(document.getElementById('winner-text'));
                })(),
                pauseSummaryText: document.getElementById('pause-summary').textContent,
                startButtonText: document.getElementById('start-button').textContent,
                helpButtonText: document.getElementById('help-button').textContent,
                 statsSummaryText: document.getElementById('stats-summary').textContent,
                 stylePreviewTitle: document.getElementById('style-preview-title').textContent,
                 stylePreviewText: document.getElementById('style-preview-text').textContent,
                 rivalPreviewTitle: document.getElementById('rival-preview-title').textContent,
                 rivalPreviewText: document.getElementById('rival-preview-text').textContent,
                 announcerText: document.getElementById('game-announcer').textContent,
                 modalId: activeDialog ? activeDialog.id : null,
                 arenaShellInert: document.getElementById('arena-shell').inert,
                 mainMenuInert: document.getElementById('main-menu').inert,
                 helpScreenInert: document.getElementById('help-screen').inert,
                 arenaPreviewClass: document.getElementById('arena-preview').className,
                arenaPreviewTitle: document.getElementById('arena-preview-title').textContent,
                arenaPreviewText: document.getElementById('arena-preview-text').textContent,
                languageSelectValue: document.getElementById('language-select').value,
                styleSelectValue: document.getElementById('style-select').value,
                pauseButtonDisplay: document.getElementById('pause-button').style.display,
                reducedMotionToggleChecked: document.getElementById('reduce-motion-toggle').checked,
                orientationWarningDisplay: document.getElementById('orientation-warning').style.display,
                ctxCalls: [...ctx.calls],
                textCalls: [...ctx.textCalls],
                transform: ctx.lastTransform
            })
        };
    `;

    vm.runInNewContext(`${source}\n${exposeTestApi}`, context);

    return {
        api: context.__gameTest,
        context,
        elements,
        canvas,
        windowListeners,
        documentListeners,
        audioEvents
    };
}

function createFighters(api, playerX = 100, cpuX = 220) {
    return {
        player: new api.Fighter(playerX, true),
        opponent: new api.Fighter(cpuX, false)
    };
}

function startPlayingGame(api) {
    api.initGame();
    api.skipVsIntro();
    return api.getState();
}

function dispatchKey(windowListeners, options = {}) {
    const event = {
        key: options.key || '',
        code: options.code || '',
        target: options.target,
        ctrlKey: !!options.ctrlKey,
        altKey: !!options.altKey,
        metaKey: !!options.metaKey,
        shiftKey: !!options.shiftKey,
        repeat: !!options.repeat,
        prevented: false,
        preventDefault() {
            this.prevented = true;
        }
    };
    windowListeners.keydown(event);
    return event;
}

function giveEnergy(fighter, amount = 100) {
    fighter.energy = amount;
}

function advanceFrames(api, frames, deltaMs = 1000 / 60) {
    for (let i = 0; i < frames; i++) api.update(deltaMs);
}

function tapControl(fighter, keys, opponent) {
    fighter.updatePlayerControls(keys, opponent);
    fighter.updatePlayerControls({}, opponent);
}

function queueBufferedCombo(fighter, first, second, opponent) {
    fighter.update({ [first]: true }, opponent);
    fighter.update({}, opponent);
    while (fighter.attackCooldown > 2) fighter.update({}, opponent);
    fighter.update({ [second]: true }, opponent);
}

function executeBufferedCombo(fighter, first, second, opponent) {
    queueBufferedCombo(fighter, first, second, opponent);
    fighter.update({}, opponent);
}

test('resizeCanvas preserves logical aspect ratio and scales backing store', () => {
    const { api } = loadGame();

    api.resizeCanvas();

    const state = api.getState();
    assert.equal(state.canvasStyle.width, '776px');
    assert.equal(state.canvasStyle.height, '388px');
    assert.equal(state.canvasWidth, 1552);
    assert.equal(state.canvasHeight, 776);
    assert.deepEqual(state.transform, [1.552, 0, 0, 1.552, 0, 0]);
});

test('resizeCanvas gives mobile landscape room for touch controls', () => {
    const { api, context } = loadGame();

    context.navigator.maxTouchPoints = 1;
    context.window.innerWidth = 844;
    context.window.innerHeight = 390;
    startPlayingGame(api);

    const state = api.getState();
    assert.equal(state.canvasStyle.width, '628px');
    assert.equal(state.canvasStyle.height, '314px');
    assert.equal(state.canvasStyle.marginTop, '');
    assert.equal(state.canvasStyle.marginBottom, '68px');
    assert.equal(state.canvasWidth, 1256);
    assert.equal(state.canvasHeight, 628);
    assert.deepEqual(state.transform, [1.256, 0, 0, 1.256, 0, 0]);
});

test('resizeCanvas keeps portrait touch layout above controls and warning', () => {
    const { api, context } = loadGame();

    context.navigator.maxTouchPoints = 1;
    context.window.innerWidth = 390;
    context.window.innerHeight = 844;
    startPlayingGame(api);

    const state = api.getState();
    assert.equal(state.canvasStyle.width, '374px');
    assert.equal(state.canvasStyle.height, '187px');
    assert.equal(state.canvasStyle.marginTop, '38px');
    assert.equal(state.canvasStyle.marginBottom, '180px');
    assert.equal(state.canvasWidth, 748);
    assert.equal(state.canvasHeight, 374);
    assert.equal(state.orientationWarningDisplay, 'block');
    assert.deepEqual(state.transform, [0.748, 0, 0, 0.748, 0, 0]);
});

test('J triggers punch damage when opponent is in range', () => {
    const { api } = loadGame();
    const { player, opponent } = createFighters(api, 100, 170);

    player.updatePlayerControls({ punch: true }, opponent);

    assert.equal(player.state, 'punch');
    assert.equal(player.attackCooldown, 12);
    assert.equal(opponent.health, 92);
    assert.equal(opponent.hitStun, 20);
});

test('K triggers kick damage when opponent is in range', () => {
    const { api } = loadGame();
    const { player, opponent } = createFighters(api, 100, 220);

    player.updatePlayerControls({ kick: true }, opponent);

    assert.equal(player.state, 'kick');
    assert.equal(player.attackCooldown, 24);
    assert.equal(opponent.health, 86);
});

test('air attacks use punch and kick inputs once per jump', () => {
    const { api } = loadGame();
    const player = new api.Fighter(100, true);
    const opponent = new api.Fighter(190, false);

    player.onGround = false;
    player.y = 320;
    player.updatePlayerControls({ punch: true }, opponent);

    assert.equal(player.state, 'airPunch');
    assert.equal(player.airAttackUsed, true);
    assert.equal(opponent.health, 91);

    player.attackCooldown = 0;
    player.prevKickPressed = false;
    player.updatePlayerControls({ kick: true }, opponent);

    assert.equal(player.state, 'airPunch');
    assert.equal(opponent.health, 91);

    player.y = 381;
    player.applyPhysics();

    assert.equal(player.onGround, true);
    assert.equal(player.airAttackUsed, false);
});

test('fighter styles apply local movement damage energy and health tuning', () => {
    const { api } = loadGame();
    const fast = new api.Fighter(100, true);
    const heavy = new api.Fighter(100, true);
    const technical = new api.Fighter(100, true);
    const opponent = new api.Fighter(190, false);

    fast.applyStyle('fast');
    fast.updatePlayerControls({ right: true }, opponent);
    assert(Math.abs(fast.velX - 5.7) < 0.0001);

    heavy.applyStyle('heavy');
    heavy.attack('punch', opponent);
    assert.equal(opponent.health, 91);

    technical.applyStyle('technical');
    assert.equal(technical.health, 92);
    technical.gainEnergy(14);
    assert.equal(technical.energy, 18);
});

test('combat sounds use distinct attack and impact profiles', () => {
    const { api, audioEvents } = loadGame();
    const { player, opponent } = createFighters(api, 100, 220);

    player.attack('punch', opponent);
    player.attackCooldown = 0;
    player.attack('kick', opponent);

    const starts = audioEvents.filter((event) => event.event === 'start');
    assert.deepEqual(
        starts.map((event) => [event.type, event.frequency]),
        [
            ['square', 420],
            ['sawtooth', 190],
            ['triangle', 220],
            ['sawtooth', 140]
        ]
    );
});

test('special and block sounds have stronger distinct profiles', () => {
    const { api, audioEvents } = loadGame();
    const { player, opponent } = createFighters(api, 100, 220);
    giveEnergy(player);

    player.attack('special', opponent);
    player.attackCooldown = 0;
    opponent.state = 'block';
    player.attack('backKick', opponent);

    const starts = audioEvents.filter((event) => event.event === 'start');
    assert.deepEqual(
        starts.map((event) => [event.type, event.frequency]),
        [
            ['sawtooth', 680],
            ['triangle', 120],
            ['sawtooth', 95],
            ['triangle', 180],
            ['square', 620]
        ]
    );
});

test('UI sounds use lightweight arcade profiles', () => {
    const { api, audioEvents } = loadGame();

    api.playUISound('select');
    api.playUISound('start');
    api.playUISound('menu');

    const starts = audioEvents.filter((event) => event.event === 'start');
    assert.deepEqual(
        starts.map((event) => [event.type, event.frequency]),
        [
            ['square', 520],
            ['triangle', 360],
            ['sine', 420]
        ]
    );
});

test('Web Audio diagnostics clean each tone graph exactly once', () => {
    const { api } = loadGame();
    const before = api.getAudioDiagnostics();

    api.playAttackSound('punch');

    const after = api.getAudioDiagnostics();
    assert.equal(after.createdGraphs, before.createdGraphs + 1);
    assert.equal(after.endedGraphs, before.endedGraphs + 1);
    assert.equal(after.activeGraphs, 0);
    assert.equal(after.oscillatorsCreated - after.oscillatorsDisconnected, 0);
    assert.equal(after.gainsCreated - after.gainsDisconnected, 0);
});

test('simple combos increase damage and cooldown', () => {
    const { api } = loadGame();
    const { player, opponent } = createFighters(api, 100, 170);

    executeBufferedCombo(player, 'punch', 'punch', opponent);

    assert.equal(player.state, 'punch');
    assert.equal(player.attackCooldown, 18);
    assert.equal(opponent.health, 80);
});

test('first combo input shows a brief combo hint without combo flash', () => {
    const { api } = loadGame();
    const player = new api.Fighter(100, true);
    const opponent = new api.Fighter(170, false);

    player.updatePlayerControls({ punch: true }, opponent);

    assert.equal(player.comboHintText, 'Punetazo...');
    assert.equal(player.comboHintTimer, 24);
    assert.equal(player.comboFlashTimer, 0);
    assert.equal(api.getState().floatingTexts.some((text) => text.text === 'COMBO x2'), false);
});

test('J,J combo creates combo-specific visual feedback', () => {
    const { api } = loadGame();
    const player = new api.Fighter(100, true);
    const opponent = new api.Fighter(170, false);

    executeBufferedCombo(player, 'punch', 'punch', opponent);

    assert.equal(player.lastAttackType, 'comboPunch');
    assert.equal(player.comboFlashTimer, 18);
    assert.equal(player.comboHintText, '');
    assert(api.getState().floatingTexts.some((text) => text.text === 'COMBO x2'));
});

test('J,K combo creates punch kick visual feedback', () => {
    const { api } = loadGame();
    const player = new api.Fighter(100, true);
    const opponent = new api.Fighter(220, false);

    executeBufferedCombo(player, 'punch', 'kick', opponent);

    assert.equal(player.lastAttackType, 'comboKick');
    assert.equal(player.comboFlashTimer, 18);
    assert(api.getState().floatingTexts.some((text) => text.text === api.t('comboPunchKick')));
});

test('K,K triggers back kick combo damage and cooldown', () => {
    const { api } = loadGame();
    const player = new api.Fighter(100, true);
    const opponent = new api.Fighter(220, false);

    executeBufferedCombo(player, 'kick', 'kick', opponent);

    assert.equal(player.state, 'kick');
    assert.equal(player.attackCooldown, 36);
    assert.equal(opponent.health, 64);
    assert.equal(player.lastAttackType, 'backKick');
    assert.equal(player.comboFlashTimer, 18);
    assert(api.getState().floatingTexts.some((text) => text.text === api.t('comboBackKick')));
});

test('buffered J-J, J-K, and K-K use real cooldown boundaries', () => {
    const cases = [
        { first: 'punch', second: 'punch', type: 'comboPunch', cooldown: 18, health: 80, state: 'punch' },
        { first: 'punch', second: 'kick', type: 'comboKick', cooldown: 30, health: 74, state: 'kick' },
        { first: 'kick', second: 'kick', type: 'backKick', cooldown: 36, health: 64, state: 'kick' }
    ];

    cases.forEach(({ first, second, type, cooldown, health, state }) => {
        const { api } = loadGame();
        const player = new api.Fighter(100, true);
        const opponent = new api.Fighter(first === 'kick' ? 220 : 170, false);

        player.update({ [first]: true }, opponent);
        player.update({}, opponent);
        while (player.attackCooldown > 2) player.update({}, opponent);

        assert.equal(player.attackCooldown, 2);
        const windowBeforeInput = player.comboTimer;
        player.update({ [second]: true }, opponent);

        assert.equal(player.attackCooldown, 1, `${first}-${second} must observe 2 -> 1`);
        assert.equal(player.pendingComboInput, second);
        assert.equal(player.comboTimer, windowBeforeInput - 1, 'buffering must not restart the combo window');
        assert.equal(player.lastAttackType, first);

        player.update({}, opponent);

        assert.equal(player.attackCooldown, cooldown);
        assert.equal(player.lastAttackType, type);
        assert.equal(player.state, state);
        assert.equal(player.health, 100);
        assert.equal(opponent.health, health);
        assert.equal(player.pendingComboInput, '');
        assert.equal(player.comboBuffer.length, 0);
        assert.equal(player.comboTimer, 0);
    });
});

test('pending combo executes on the 1 -> 0 cooldown tick while the window is alive', () => {
    const { api } = loadGame();
    const player = new api.Fighter(100, true);
    const opponent = new api.Fighter(170, false);

    queueBufferedCombo(player, 'punch', 'punch', opponent);

    assert.equal(player.attackCooldown, 1);
    assert.equal(player.pendingComboInput, 'punch');
    player.update({}, opponent);

    assert.equal(player.attackCooldown, 18);
    assert.equal(player.lastAttackType, 'comboPunch');
    assert.equal(opponent.health, 80);
    assert.equal(player.pendingComboInput, '');
});

test('combo timer expiration at 1 -> 0 discards pending input and permits a normal next edge', () => {
    const { api } = loadGame();
    const player = new api.Fighter(100, true);
    const opponent = new api.Fighter(170, false);

    player.update({ punch: true }, opponent);
    player.update({}, opponent);
    while (player.attackCooldown > 2) player.update({}, opponent);
    player.comboTimer = 2;
    player.update({ punch: true }, opponent);

    assert.equal(player.attackCooldown, 1);
    assert.equal(player.pendingComboInput, 'punch');
    player.update({}, opponent);

    assert.equal(player.attackCooldown, 0);
    assert.equal(player.comboTimer, 0);
    assert.equal(player.pendingComboInput, '');
    assert.equal(player.comboBuffer.length, 0);
    assert.equal(player.lastAttackType, 'punch');
    assert.equal(opponent.health, 92);

    player.update({}, opponent);
    player.update({ punch: true }, opponent);

    assert.equal(player.lastAttackType, 'punch');
    assert.equal(player.attackCooldown, 12);
    assert.equal(opponent.health, 84);
});

test('block, crouch, and jump cancel a pending combo before consumption', () => {
    const interruptions = [
        { action: { block: true }, state: 'block' },
        { action: { crouch: true }, state: 'crouch' },
        { action: { jump: true }, state: 'jump' }
    ];

    interruptions.forEach(({ action, state }) => {
        const { api } = loadGame();
        const player = new api.Fighter(100, true);
        const opponent = new api.Fighter(170, false);

        queueBufferedCombo(player, 'punch', 'punch', opponent);
        assert.equal(player.pendingComboInput, 'punch');
        player.update(action, opponent);

        assert.equal(player.state, state);
        assert.equal(player.lastAttackType, 'punch');
        assert.equal(player.attackCooldown, 0);
        assert.equal(player.pendingComboInput, '');
        assert.equal(player.comboBuffer.length, 0);
        assert.equal(player.comboTimer, 0);
        assert.equal(opponent.health, 92);
    });
});

test('blocked and unblocked hits cancel the defender combo sequence', () => {
    [false, true].forEach((blocked) => {
        const { api } = loadGame();
        const defender = new api.Fighter(100, true);
        const attacker = new api.Fighter(170, false);

        queueBufferedCombo(defender, 'punch', 'punch', attacker);
        assert.equal(defender.pendingComboInput, 'punch');
        if (blocked) defender.state = 'block';
        attacker.attack('punch', defender);

        assert.equal(defender.pendingComboInput, '');
        assert.equal(defender.comboBuffer.length, 0);
        assert.equal(defender.comboTimer, 0);
        assert.equal(defender.lastAttackType, 'punch');
        assert.equal(defender.hitStun, blocked ? 0 : 20);
    });
});

test('held follow-up input keeps one pending command and does not duplicate the combo', () => {
    const { api } = loadGame();
    const player = new api.Fighter(100, true);
    const opponent = new api.Fighter(170, false);

    queueBufferedCombo(player, 'punch', 'punch', opponent);
    assert.equal(player.pendingComboInput, 'punch');

    for (let i = 0; i < 20; i++) player.update({ punch: true }, opponent);

    assert.equal(player.lastAttackType, 'comboPunch');
    assert.equal(player.pendingComboInput, '');
    assert.equal(player.comboBuffer.length, 0);
    assert.equal(opponent.health, 80);
});

test('air and special edges are never buffered as grounded combo follow-ups', () => {
    const { api } = loadGame();
    const player = new api.Fighter(100, true);
    const opponent = new api.Fighter(170, false);

    player.update({ punch: true }, opponent);
    player.update({}, opponent);
    while (player.attackCooldown > 2) player.update({}, opponent);
    player.update({ jump: true }, opponent);
    player.update({ punch: true }, opponent);

    assert.equal(player.pendingComboInput, '');
    assert.equal(player.comboBuffer.length, 0);

    const specialPlayer = new api.Fighter(100, true);
    const specialOpponent = new api.Fighter(170, false);
    specialPlayer.energy = 100;
    specialPlayer.update({ punch: true }, specialOpponent);
    specialPlayer.update({}, specialOpponent);
    specialPlayer.update({ special: true }, specialOpponent);

    assert.equal(specialPlayer.pendingComboInput, '');
    assert.equal(specialPlayer.lastAttackType, 'punch');
});

test('arrow keys move and jump like WASD controls', () => {
    const { api } = loadGame();
    const player = new api.Fighter(100, true);
    const opponent = new api.Fighter(220, false);

    player.updatePlayerControls({ right: true }, opponent);
    assert.equal(player.velX, 5);
    assert.equal(player.state, 'walk');

    player.velX = 0;
    player.state = 'idle';
    player.updatePlayerControls({ left: true }, opponent);
    assert.equal(player.velX, -5);
    assert.equal(player.state, 'walk');

    player.updatePlayerControls({ jump: true }, opponent);
    assert.equal(player.velY, -18);
    assert.equal(player.onGround, false);
    assert.equal(player.state, 'jump');
});

test('crouch stops movement and prevents attacks', () => {
    const { api } = loadGame();
    const player = new api.Fighter(100, true);
    const opponent = new api.Fighter(170, false);

    player.updatePlayerControls({ crouch: true, right: true, punch: true }, opponent);

    assert.equal(player.state, 'crouch');
    assert.equal(player.velX, 0);
    assert.equal(player.attackCooldown, 0);
    assert.equal(opponent.health, 100);
});

test('block takes precedence over crouch', () => {
    const { api } = loadGame();
    const player = new api.Fighter(100, true);
    const opponent = new api.Fighter(170, false);

    player.updatePlayerControls({ block: true, crouch: true }, opponent);

    assert.equal(player.state, 'block');
});

test('I key blocks near attack controls', () => {
    const { api } = loadGame();
    const player = new api.Fighter(100, true);
    const opponent = new api.Fighter(170, false);

    player.updatePlayerControls({ block: true }, opponent);

    assert.equal(player.state, 'block');
    assert.equal(player.velX, 0);
});

test('crouch lowers body box under punches but remains vulnerable to kicks', () => {
    const { api } = loadGame();
    const attacker = new api.Fighter(100, true);
    const defender = new api.Fighter(220, false);

    defender.updatePlayerControls({ crouch: true }, attacker);
    const crouchBox = defender.getBodyBox();

    assert.equal(defender.state, 'crouch');
    assert.equal(crouchBox.y, 352);
    assert.equal(crouchBox.height, 63);

    attacker.attack('punch', defender);
    assert.equal(defender.health, 100);

    attacker.attackCooldown = 0;
    attacker.attack('kick', defender);
    assert.equal(defender.health, 86);
});

test('fighters expose distinct hurtboxes and pushboxes by posture', () => {
    const { api } = loadGame();
    const fighter = new api.Fighter(160, true);

    const standingHurtBox = fighter.getHurtBox();
    const standingPushBox = fighter.getPushBox();

    fighter.state = 'crouch';
    const crouchHurtBox = fighter.getHurtBox();
    const crouchPushBox = fighter.getPushBox();

    fighter.state = 'jump';
    fighter.onGround = false;
    fighter.y = 320;
    const airHurtBox = fighter.getHurtBox();

    assert.deepEqual(fighter.getBodyBox(), airHurtBox);
    assert(crouchHurtBox.height < standingHurtBox.height);
    assert(crouchHurtBox.y > standingHurtBox.y);
    assert(crouchPushBox.height < standingPushBox.height);
    assert(airHurtBox.height < standingHurtBox.height);
});

test('pushbox collision resolves overlap by posture and leaves airborne fighters alone', () => {
    const { api } = loadGame();

    api.initGame();
    api.skipVsIntro();
    let state = api.getState();
    state.player1.x = 480;
    state.player2.x = 500;
    api.checkCollision();

    assert.equal(state.player2.x - state.player1.x, 56);

    state.player1.x = 480;
    state.player2.x = 500;
    state.player1.state = 'crouch';
    api.checkCollision();
    assert.equal(state.player2.x - state.player1.x, 56);

    state.player1.x = 480;
    state.player2.x = 500;
    state.player1.onGround = false;
    state.player1.state = 'jump';
    state.player1.y = 200;
    api.checkCollision();
    assert.equal(state.player1.x, 480);
    assert.equal(state.player2.x, 500);
});

test('pushbox collision transfers separation away from arena corners', () => {
    const { api } = loadGame();

    api.initGame();
    api.skipVsIntro();
    const state = api.getState();
    state.player1.x = 50;
    state.player2.x = 55;
    state.player1.facingRight = false;
    state.player2.facingRight = true;
    api.checkCollision();

    assert.equal(state.player1.x, 50);
    assert.equal(state.player2.x, 106);
    assert.equal(state.player1.getPushBox().x + state.player1.getPushBox().width, state.player2.getPushBox().x);
});

test('blur and hidden pages clear input and pause an active match without resuming it', () => {
    const { api, context, windowListeners, documentListeners } = loadGame();

    api.setupKeyboardControls();
    startPlayingGame(api);
    windowListeners.keydown({ key: 'd', code: 'KeyD', preventDefault() {} });
    assert.equal(api.getState().keys.right, true);

    windowListeners.blur();
    assert.equal(Object.keys(api.getState().keys).length, 0);

    windowListeners.keydown({ key: 'a', code: 'KeyA', preventDefault() {} });
    context.document.hidden = true;
    documentListeners.visibilitychange();
    assert.equal(api.getState().gameState, 'paused');
    assert.equal(Object.keys(api.getState().keys).length, 0);

    context.document.hidden = false;
    documentListeners.visibilitychange();
    assert.equal(api.getState().gameState, 'paused');
});

test('pointer controls support simultaneous input and release cancellation safely', () => {
    const { api, elements } = loadGame();

    api.setupMobileControls();
    const left = elements.get('btn-left');
    const punch = elements.get('btn-punch');
    const event = (pointerId) => ({ pointerId, button: 0, preventDefault() {} });

    left.listeners.pointerdown(event(1));
    punch.listeners.pointerdown(event(2));
    assert.equal(api.getState().keys.left, true);
    assert.equal(api.getState().keys.punch, true);
    assert.equal(api.getState().activePointerCount, 2);

    left.listeners.pointercancel(event(1));
    assert.equal(api.getState().keys.left, false);
    assert.equal(api.getState().keys.punch, true);

    punch.listeners.lostpointercapture(event(2));
    assert.equal(api.getState().keys.left, false);
    assert.equal(api.getState().keys.punch, false);
    assert.equal(api.getState().activePointerCount, 0);
});

test('canonical actions preserve held input across independent sources', () => {
    const { api } = loadGame();

    api.setInputSource('keyboard:KeyA', 'left', true);
    api.setInputSource('pointer:1', 'left', true);
    api.clearInputSource('pointer:1');
    assert.equal(api.getInputSnapshot().left, true);

    api.clearInputSource('keyboard:KeyA');
    assert.equal(api.getInputSnapshot().left, false);
});

test('keyboard mappings use physical codes and persist safely', () => {
    const first = loadGame();
    assert.equal(first.api.getInputActionForCode('KeyJ'), 'punch');
    assert.equal(first.api.setInputBinding('punch', 0, 'KeyQ').ok, true);
    const saved = first.context.window.localStorage.getItem('glitchDuelKeyboardBindings');
    const second = loadGame({ storage: { glitchDuelKeyboardBindings: saved } });
    assert.equal(second.api.getInputActionForCode('KeyQ'), 'punch');
    assert.equal(second.api.getInputActionForCode('KeyJ'), null);

    const invalid = loadGame({ storage: { glitchDuelKeyboardBindings: '{broken' } });
    assert.equal(invalid.api.getInputActionForCode('KeyJ'), 'punch');
    assert.equal(invalid.api.setInputBinding('punch', 0, 'Escape').reason, 'reserved');
    invalid.api.beginInputBindingCapture('punch', 0);
    assert.equal(invalid.api.captureInputBinding({ code: 'KeyQ', ctrlKey: true }).reason, 'reserved');
});

test('keyboard events become canonical actions and release by source code', () => {
    const { api, windowListeners } = loadGame();
    api.setupKeyboardControls();
    startPlayingGame(api);

    windowListeners.keydown({ key: 'j', code: 'KeyJ', preventDefault() {} });
    assert.equal(api.getInputSnapshot().punch, true);
    windowListeners.keyup({ key: 'j', code: 'KeyJ' });
    assert.equal(api.getInputSnapshot().punch, false);
});

test('keyboard preserves native targets and modifier shortcuts while allowing other button bindings', () => {
    const { api, context, canvas, elements, windowListeners } = loadGame();
    api.setInputBinding('punch', 0, 'KeyQ');
    api.setInputBinding('kick', 0, 'Space');
    api.setupKeyboardControls();
    startPlayingGame(api);

    const input = context.document.createElement('input');
    const inputChild = context.document.createElement('span');
    input.append(inputChild);
    const editor = context.document.createElement('div');
    editor.setAttribute('contenteditable', 'true');
    const editorChild = context.document.createElement('span');
    editor.append(editorChild);

    for (const target of [context.document.getElementById('arena-select'), input, inputChild, editorChild]) {
        const event = dispatchKey(windowListeners, { key: 'q', code: 'KeyQ', target });
        assert.equal(event.prevented, false, `native target ${target.tagName}`);
        assert.equal(api.getInputSnapshot().punch, false);
    }

    const buttonEnter = dispatchKey(windowListeners, { key: 'Enter', code: 'Enter', target: elements.get('start-button') });
    assert.equal(buttonEnter.prevented, false);
    assert.equal(api.getInputSnapshot().punch, false);

    const link = context.document.createElement('a');
    link.setAttribute('href', '#help');
    const linkChild = context.document.createElement('span');
    link.append(linkChild);
    const linkSpace = dispatchKey(windowListeners, { key: ' ', code: 'Space', target: linkChild });
    assert.equal(linkSpace.prevented, false);
    assert.equal(api.getInputSnapshot().kick, false);

    const buttonBinding = dispatchKey(windowListeners, { key: 'q', code: 'KeyQ', target: elements.get('start-button') });
    assert.equal(buttonBinding.prevented, true);
    assert.equal(api.getInputSnapshot().punch, true);
    windowListeners.keyup({ key: 'q', code: 'KeyQ', ctrlKey: true, target: input });
    assert.equal(api.getInputSnapshot().punch, false);

    for (const modifier of ['ctrlKey', 'altKey', 'metaKey']) {
        const event = dispatchKey(windowListeners, { key: 'q', code: 'KeyQ', target: canvas, [modifier]: true });
        assert.equal(event.prevented, false);
        assert.equal(api.getState().gameState, 'playing');
        assert.equal(api.getInputSnapshot().punch, false);
    }

    for (const options of [
        { key: 'q', code: 'KeyQ', shiftKey: true },
        { key: 'Tab', code: 'Tab', ctrlKey: true },
        { key: 'Tab', code: 'Tab', ctrlKey: true, shiftKey: true },
        { key: 'Escape', code: 'Escape', shiftKey: true }
    ]) {
        const event = dispatchKey(windowListeners, { ...options, target: canvas });
        assert.equal(event.prevented, false);
        assert.equal(api.getState().gameState, 'playing');
        assert.equal(api.getInputSnapshot().punch, false);
    }
});

test('pause binding is consumed only during playing or paused states', () => {
    const menu = loadGame();
    menu.api.setupKeyboardControls();
    const menuEvent = dispatchKey(menu.windowListeners, { key: 'p', code: 'KeyP', target: menu.elements.get('start-button') });
    assert.equal(menuEvent.prevented, false);
    assert.equal(menu.api.getState().gameState, 'menu');

    menu.api.showOnboardingIfNeeded();
    const onboardingEvent = dispatchKey(menu.windowListeners, { key: 'p', code: 'KeyP', target: menu.elements.get('onboarding-next-button') });
    assert.equal(onboardingEvent.prevented, false);
    assert.equal(menu.api.getState().gameState, 'menu');
    assert.equal(menu.api.getState().onboardingScreenDisplay, 'flex');

    const active = loadGame({ storage: { glitchDuelOnboardingSeen: '1' } });
    active.api.setupKeyboardControls();
    startPlayingGame(active.api);
    const pauseEvent = dispatchKey(active.windowListeners, { key: 'p', code: 'KeyP', target: active.canvas });
    assert.equal(pauseEvent.prevented, true);
    assert.equal(active.api.getState().gameState, 'paused');

    active.api.resumeGame();
    active.api.getState().player2.health = 0;
    active.api.update();
    active.api.skipVsIntro();
    active.api.getState().player2.health = 0;
    active.api.update();
    assert.equal(active.api.getState().gameState, 'gameOver');
    const gameOverEvent = dispatchKey(active.windowListeners, { key: 'p', code: 'KeyP', target: active.elements.get('restart-button') });
    assert.equal(gameOverEvent.prevented, false);
    assert.equal(active.api.getState().gameState, 'gameOver');
});

test('keyboard Tab routes between the gameplay canvas and pause button', () => {
    const { api, canvas, elements, windowListeners } = loadGame({ storage: { glitchDuelOnboardingSeen: '1' } });
    api.setupKeyboardControls();
    startPlayingGame(api);
    assert.equal(canvas.focused, true);

    const forward = dispatchKey(windowListeners, { key: 'Tab', code: 'Tab', target: canvas });
    assert.equal(forward.prevented, true);
    assert.equal(elements.get('pause-button').focused, true);

    const backward = dispatchKey(windowListeners, { key: 'Tab', code: 'Tab', shiftKey: true, target: elements.get('pause-button') });
    assert.equal(backward.prevented, true);
    assert.equal(canvas.focused, true);
});

test('binding capture cancels on Tab and keeps an equivalent focus target', () => {
    const { api, context, elements, windowListeners } = loadGame({ storage: { glitchDuelOnboardingSeen: '1' } });
    api.setupKeyboardControls();
    api.showControlsScreen();

    const getBindingButton = (action, slot) => {
        const list = elements.get('bindings-list');
        return list.children.find((row) => row.children[1].children.some((button) => button.getAttribute('data-binding-action') === action && Number(button.getAttribute('data-binding-slot')) === slot)).children[1].children.find((button) => button.getAttribute('data-binding-action') === action && Number(button.getAttribute('data-binding-slot')) === slot);
    };

    api.beginInputBindingCapture('left', 0);
    api.renderInputBindingsDialog();
    const current = getBindingButton('left', 0);
    assert.equal(current.getAttribute('data-binding-action'), 'left');
    assert.equal(current.getAttribute('data-binding-slot'), '0');
    assert.equal(api.getInputBindingCapture().action, 'left');

    const modifier = dispatchKey(windowListeners, { key: 'Tab', code: 'Tab', ctrlKey: true, target: current });
    assert.equal(modifier.prevented, false);
    assert.equal(api.getInputBindingCapture().action, 'left');
    assert.equal(api.getInputBindingCapture().slot, 0);

    const next = dispatchKey(windowListeners, { key: 'Tab', code: 'Tab', target: current });
    assert.equal(next.prevented, true);
    assert.equal(api.getInputBindingCapture(), null);
    assert.equal(context.document.activeElement.getAttribute('data-binding-action'), 'left');
    assert.equal(context.document.activeElement.getAttribute('data-binding-slot'), '1');

    api.beginInputBindingCapture('left', 0);
    api.renderInputBindingsDialog();
    const currentAgain = getBindingButton('left', 0);
    const previous = dispatchKey(windowListeners, { key: 'Tab', code: 'Tab', shiftKey: true, target: currentAgain });
    assert.equal(previous.prevented, true);
    const focusablesAfterPrevious = api.getFocusableElements(context.document.getElementById('controls-screen'));
    assert.equal(context.document.activeElement, focusablesAfterPrevious[focusablesAfterPrevious.length - 1]);

    api.beginInputBindingCapture('left', 0);
    api.renderInputBindingsDialog();
    const escape = dispatchKey(windowListeners, { key: 'Escape', code: 'Escape', target: getBindingButton('left', 0) });
    assert.equal(escape.prevented, true);
    assert.equal(api.getInputBindingCapture(), null);
});

test('focus trap includes summary, excludes closed details content, and recovers from non-sequential focus', () => {
    const { api, context, elements } = loadGame({ storage: { glitchDuelOnboardingSeen: '1' } });
    const dialog = context.document.createElement('div');
    const title = context.document.createElement('h1');
    title.setAttribute('tabindex', '-1');
    const first = context.document.createElement('button');
    const details = context.document.createElement('details');
    details.open = false;
    const summary = context.document.createElement('summary');
    const closedButton = context.document.createElement('button');
    details.append(summary, closedButton);
    dialog.append(title, first, details);

    const focusables = api.getFocusableElements(dialog);
    assert.equal(focusables.length, 2);
    assert.equal(focusables[0], first);
    assert.equal(focusables[1], summary);

    api.setupKeyboardControls();
    api.showControlsScreen();
    const staticFocus = elements.get('binding-status');
    staticFocus.setAttribute('tabindex', '-1');
    staticFocus.focus({ preventScroll: true });
    const event = { key: 'Tab', shiftKey: false, prevented: false, preventDefault() { this.prevented = true; } };
    assert.equal(api.trapDialogFocus(event), true);
    assert.equal(event.prevented, true);
    assert.equal(context.document.activeElement.getAttribute('data-binding-action'), 'left');
});

test('localized control summaries reflect the current keyboard bindings', () => {
    const { api, elements } = loadGame();
    api.setInputBinding('punch', 0, 'KeyQ');
    api.renderLanguage();
    assert.match(elements.get('controls-summary').textContent, /Q/);
    assert.doesNotMatch(elements.get('controls-summary').textContent, /J golpe/);
});

test('standard gamepad maps combat actions, UI edges, and neutralizes held input after clear', () => {
    const buttons = Array.from({ length: 16 }, () => ({ pressed: false, value: 0 }));
    const pad = { mapping: 'standard', buttons, axes: [0, 0] };
    const { api } = loadGame({ getGamepads: () => [pad] });

    api.pollInputGamepads();
    buttons[2].pressed = true;
    assert.equal(api.pollInputGamepads().confirm, false);
    assert.equal(api.getInputSnapshot().punch, true);

    api.clearAllInputSources();
    assert.equal(api.pollInputGamepads().confirm, false);
    assert.equal(api.getInputSnapshot().punch, false);
    buttons[2].pressed = false;
    api.pollInputGamepads();
    buttons[2].pressed = true;
    api.pollInputGamepads();
    assert.equal(api.getInputSnapshot().punch, true);

    buttons[2].pressed = false;
    buttons[9].pressed = true;
    assert.equal(api.pollInputGamepads().start, true);
    assert.equal(api.pollInputGamepads().start, false);
});

test('gamepad cancel follows controls and help modal policy', () => {
    const { api } = loadGame({ storage: { glitchDuelOnboardingSeen: '1' } });

    api.showControlsScreen();
    assert.equal(api.getState().modalId, 'controls-screen');
    api.handleGamepadEvents({ cancel: true });
    assert.equal(api.getState().modalId, 'main-menu');

    api.showHelpScreen();
    api.handleGamepadEvents({ cancel: true });
    assert.equal(api.getState().modalId, 'main-menu');
});

test('touch controls are native buttons with stable accessible IDs', () => {
    const html = fs.readFileSync(path.join(__dirname, '..', 'src', 'index.html'), 'utf8');
    const controlIds = ['left', 'right', 'jump', 'crouch', 'block', 'punch', 'kick', 'special'];

    controlIds.forEach((id) => {
        assert.match(html, new RegExp(`<button class="btn" id="btn-${id}" type="button"`));
    });
    assert.doesNotMatch(html, /class="btn"[^>]*role="button"/);
});

test('static HTML contract preserves local assets, script order, controls, and arena inventory', () => {
    const html = fs.readFileSync(path.join(__dirname, '..', 'src', 'index.html'), 'utf8');
    const requiredIds = ['game', 'main-menu', 'help-screen', 'controls-screen', 'pause-screen', 'onboarding-screen', 'training-panel', 'start-button', 'training-button', 'controls-button', 'arena-select', 'rival-select'];
    const scripts = ['i18n.js', 'config.js', 'input.js', 'audio.js', 'effects.js', 'ai.js', 'fighter_render.js', 'fighter.js', 'arena_render.js', 'hud_render.js', 'game.js'];
    const { api } = loadGame();

    requiredIds.forEach((id) => assert.match(html, new RegExp(`id="${id}"`)));
    assert.deepEqual([...html.matchAll(/<script src="([^"]+)"/g)].map((match) => match[1].split('?')[0]), scripts);
    assert.match(html, /<link rel="stylesheet" href="styles\.css\?v=20260818-phase2">/);
    assert.doesNotMatch(html, /user-scalable\s*=\s*no/i);
    assert.doesNotMatch(html, /maximum-scale\s*=\s*1(?:\.0)?/i);
    ['arena-shell', 'game-toolbar', 'game-announcer', 'duel-settings', 'selection-summary', 'menu-footer', 'arcade-run-button'].forEach((id) => {
        assert.match(html, new RegExp(`id="${id}"`));
    });
    assert.match(html, /<details id="duel-settings" class="duel-settings" open>/);
    assert.match(html, /id="arena-select" aria-describedby="arena-preview-text"/);
    assert.match(html, /id="style-select" aria-describedby="style-preview-text"/);
    assert.match(html, /id="rival-select" aria-describedby="rival-preview-text"/);
    assert.doesNotMatch(html, /id="arena-preview"[^>]*aria-live=/);
    assert.doesNotMatch(html, /id="selection-summary"[^>]*aria-live=/);
    assert.equal((html.match(/class="menu-footer"/g) || []).length, 1);
    assert.equal((html.match(/id="controls-summary"/g) || []).length, 1);
    assert.equal((html.match(/class="github-link"/g) || []).length, 1);
    assert.doesNotMatch(html, /PUNCH<br>\(J\)|KICK<br>\(K\)|SPECIAL<br>\(L\)/);
    Object.keys(api.ARENAS).forEach((arena) => {
        assert.match(html, new RegExp(`<option value="${arena}"`));
        const key = `arena${arena.charAt(0).toUpperCase()}${arena.slice(1)}`;
        const previewKey = `arenaPreview${arena.charAt(0).toUpperCase()}${arena.slice(1)}`;
        assert.ok(api.I18N.es[key]);
        assert.ok(api.I18N.en[key]);
        assert.ok(api.I18N.es[previewKey]);
        assert.ok(api.I18N.en[previewKey]);
    });
    Object.entries(api.CPU_RIVALS).forEach(([rival, config]) => {
        assert.match(html, new RegExp(`<option value="${rival}"`));
        assert.ok(api.I18N.es[config.labelKey]);
        assert.ok(api.I18N.en[config.labelKey]);
        assert.ok(api.I18N.es[config.introKey]);
        assert.ok(api.I18N.en[config.introKey]);
    });
});

test('arcade route and difficulty caps are declarative and valid', () => {
    const { api } = loadGame();

    assert.equal(api.ARCADE_RUN_FIGHTS.length, 5);
    api.ARCADE_RUN_FIGHTS.forEach((fight) => {
        assert.ok(api.CPU_RIVALS[fight.rival]);
        assert.ok(api.ARENAS[fight.arena]);
        assert.ok(api.DIFFICULTIES[fight.difficulty]);
    });
    assert.equal(api.ARCADE_RUN_FIGHTS[4].rival, 'boss500');
    assert.equal(api.ARCADE_RUN_FIGHTS[4].difficulty, 'hard');
    assert.deepEqual(
        Object.fromEntries(Object.entries(api.DIFFICULTIES).map(([key, config]) => [key, config.maxBlockReaction])),
        { easy: 0.55, normal: 0.80, hard: 0.90 }
    );
    assert.equal(api.DIFFICULTIES.easy.retreatMid, 0.65);
});

test('match history uses a bounded versioned record and excludes training', () => {
    const { api, context } = loadGame({ storage: {
        glitchDuelMatchHistory: JSON.stringify({
            version: 1,
            matches: [{ mode: 'invalid' }]
        })
    } });

    assert.equal(api.getMatchHistory().length, 0);
    api.startTraining();
    api.skipVsIntro();
    api.getState().player2.health = 0;
    api.update();
    assert.equal(api.getMatchHistory().length, 0);

    api.initGame();
    api.skipVsIntro();
    api.getState().player2.health = 0;
    api.update();
    api.skipVsIntro();
    api.getState().player2.health = 0;
    api.update();

    const history = api.getMatchHistory();
    assert.equal(history.length, 1);
    assert.equal(history[0].mode, 'versus');
    assert.equal(history[0].fight, 0);
    assert.equal(history[0].result, 'win');
    assert.equal(history[0].medal, 'bug');
    assert.ok(history[0].durationFrames > 0);
    assert.equal(JSON.parse(context.window.localStorage.getItem('glitchDuelMatchHistory')).version, 1);

    const sample = { mode: 'versus', fight: 0, result: 'loss', playerRounds: 0, cpuRounds: 2, difficulty: 'easy', arena: 'notebook', style: 'balanced', rival: 'nullPointer', durationFrames: 1, medal: 'machine', events: { combos: 0, blocks: 0, specials: 0, airAttacks: 0 } };
    for (let i = 0; i < 30; i++) api.appendMatchHistory(sample);
    assert.equal(api.getMatchHistory().length, 25);
});

test('modal dialogs contain focus and return gameplay focus to the canvas', () => {
    const { api, elements, canvas } = loadGame({ storage: { glitchDuelOnboardingSeen: '1' } });

    api.showMainMenu();
    assert.equal(api.getState().modalId, 'main-menu');
    assert.equal(elements.get('start-button').focused, true);
    assert.equal(elements.get('start-button').focusOptions.preventScroll, true);
    assert.equal(api.getState().arenaShellInert, true);
    assert.equal(api.getState().mainMenuInert, false);

    api.showHelpScreen();
    assert.equal(api.getState().modalId, 'help-screen');
    assert.equal(elements.get('help-title').focused, true);
    assert.equal(api.getState().helpScreenInert, false);

    api.hideHelpScreen();
    assert.equal(api.getState().modalId, 'main-menu');
    assert.equal(elements.get('help-button').focused, true);

    api.initGame();
    api.skipVsIntro();
    api.pauseGame();
    assert.equal(api.getState().modalId, 'pause-screen');
    assert.equal(elements.get('pause-title').focused, true);

    api.resumeGame();
    assert.equal(api.getState().modalId, null);
    assert.equal(canvas.focused, true);
    assert.equal(canvas.focusOptions.preventScroll, true);
    assert.equal(api.getState().arenaShellInert, false);
});

test('phase-one UI localizes mode context, bindings, and touch special state', () => {
    const { api, context, elements } = loadGame({ storage: { glitchDuelOnboardingSeen: '1' } });

    api.initGame();
    api.renderLanguage();
    assert.equal(elements.get('instructions').textContent, 'DUELO');

    api.startTraining();
    api.renderLanguage();
    assert.equal(elements.get('instructions').textContent, 'ENTRENAMIENTO');

    const special = context.document.getElementById('btn-special');
    const specialState = context.document.getElementById('btn-special-state');
    const player = api.getState().player1;
    player.energy = 0;
    api.renderTouchSpecialState();
    assert.equal(special.getAttribute('data-state'), 'charging');
    assert.equal(special.getAttribute('aria-disabled'), 'true');
    assert.equal(specialState.textContent, api.t('specialCharging'));

    player.energy = 100;
    api.renderTouchSpecialState();
    assert.equal(special.getAttribute('data-state'), 'ready');
    assert.equal(special.getAttribute('aria-disabled'), 'false');
    assert.match(special.getAttribute('aria-label'), /100/);

    api.showControlsScreen();
    const bindings = elements.get('bindings-list');
    const leftRow = bindings.children.find((row) => row.children[0].textContent === api.t('inputActionLeft'));
    const leftButton = leftRow.children[1].children[0];
    assert.match(leftButton.getAttribute('aria-label'), /Mover izquierda/);
    assert.match(leftButton.getAttribute('aria-label'), /A/);

    const keys = Object.keys(api.I18N.es).sort();
    assert.deepEqual(keys, Object.keys(api.I18N.en).sort());
    keys.forEach((key) => {
        const placeholders = (value) => String(value).match(/\{[a-zA-Z]+\}/g) || [];
        assert.deepEqual(placeholders(api.I18N.es[key]).sort(), placeholders(api.I18N.en[key]).sort(), key);
    });
});

test('phase-one marker layout stays inside safe canvas bounds during jumps', () => {
    const { api } = loadGame();
    const fighter = new api.Fighter(50, false);
    const layout = api.getFighterMarkerLayout(fighter, 50, 80, 'MERGE CONFLICT');

    assert(layout.badgeX >= 16);
    assert(layout.badgeX + layout.badgeWidth <= 984);
    assert(layout.badgeY >= 112);
    assert(layout.specialTop >= layout.badgeY + 32);
    assert(layout.specialCircleY >= layout.specialTop + 50);
    assert(layout.specialCircleY + 34 <= 500);
});

test('special touch input remains inert while charging and activates when ready', () => {
    const { api, elements } = loadGame({ touchPoints: 1, storage: { glitchDuelOnboardingSeen: '1' } });
    api.setupMobileControls();
    api.initGame();
    const special = elements.get('btn-special');
    const pointer = (pointerId) => ({ pointerId, button: 0, preventDefault() {} });

    special.listeners.pointerdown(pointer(1));
    assert.equal(api.getState().activePointerCount, 0);

    api.getState().player1.energy = 100;
    api.renderTouchSpecialState();
    special.listeners.pointerdown(pointer(2));
    assert.equal(api.getState().activePointerCount, 1);
    special.listeners.pointerup(pointer(2));
    assert.equal(api.getState().activePointerCount, 0);
});

test('combat status is non-live, localized, queryable, and cached by values', () => {
    const { api, context, canvas, elements, windowListeners } = loadGame({ storage: { glitchDuelOnboardingSeen: '1' } });
    api.setupKeyboardControls();
    api.initGame();
    api.renderLanguage();
    const state = api.getState();
    state.player1.health = 42;
    state.player1.energy = 37;
    state.player2.health = 68;
    state.player2.energy = 21;
    state.player1.x = 600;
    state.player2.x = 450;
    api.renderCombatStatus();

    const details = context.document.getElementById('combat-status');
    const summary = context.document.getElementById('combat-status-summary');
    const compact = context.document.getElementById('combat-status-compact');
    const values = context.document.getElementById('combat-status-details').children;
    assert.equal(details.getAttribute('aria-live'), undefined);
    assert.equal(summary.getAttribute('aria-label'), api.t('combatStatusSummaryLabel'));
    assert.match(compact.textContent, /P1 42/);
    assert.equal(values[1].textContent, 'DUELO');
    assert.equal(values[3].textContent, '42%');
    assert.equal(values[5].textContent, '68%');
    assert.equal(values[19].textContent, api.t('combatStatusDirectionLeft'));
    assert.equal(values[21].textContent, api.t('combatStatusDistanceMid'));

    api.announceCombatStatus();
    const announcement = context.document.getElementById('game-announcer').textContent;
    assert.match(announcement, /42/);
    assert.match(announcement, /68/);

    const firstAnnouncement = announcement;
    const repeat = dispatchKey(windowListeners, { key: '0', code: 'Digit0', repeat: true, target: canvas });
    assert.equal(repeat.prevented, true);
    assert.equal(context.document.getElementById('game-announcer').textContent, firstAnnouncement);

    const query = dispatchKey(windowListeners, { key: '0', code: 'Digit0', target: canvas });
    assert.equal(query.prevented, true);
    assert.match(context.document.getElementById('game-announcer').textContent, /42/);
    assert.equal(elements.get('combat-status-summary').getAttribute('aria-live'), undefined);
});

test('binding version one migrates without losing remapped keys and leaves status unassigned on conflict', () => {
    const bindings = {
        left: ['KeyQ', 'ArrowLeft'], right: ['KeyD', 'ArrowRight'], jump: ['KeyW', 'ArrowUp'],
        crouch: ['KeyC', 'ArrowDown'], block: ['KeyS', 'KeyI'], punch: ['KeyJ'], kick: ['KeyK'],
        special: ['KeyL'], pause: ['KeyP']
    };
    const migrated = loadGame({ storage: {
        glitchDuelKeyboardBindings: JSON.stringify({ version: 1, bindings })
    } });
    assert.equal(migrated.api.getInputBindings().left[0], 'KeyQ');
    assert.equal(migrated.api.getInputBindings().status[0], 'Digit0');
    assert.equal(JSON.parse(migrated.context.window.localStorage.getItem('glitchDuelKeyboardBindings')).version, 2);

    const conflictBindings = { ...bindings, left: ['Digit0', 'ArrowLeft'], right: ['KeyO', 'ArrowRight'], jump: ['Semicolon', 'ArrowUp'] };
    const conflicted = loadGame({ storage: {
        glitchDuelKeyboardBindings: JSON.stringify({ version: 1, bindings: conflictBindings })
    } });
    assert.equal(conflicted.api.getInputBindings().status.length, 0);
    conflicted.api.showControlsScreen();
    const statusRow = conflicted.elements.get('bindings-list').children.find((row) => row.children[0].textContent === conflicted.api.t('inputActionStatus'));
    assert.equal(statusRow.children[1].children[0].textContent, conflicted.api.t('bindingUnassigned'));
});

test('standard gamepad button eight emits status edge without changing Start pause', () => {
    const buttons = Array.from({ length: 16 }, () => ({ pressed: false, value: 0 }));
    let pad = { mapping: 'standard', buttons, axes: [0, 0] };
    const { api } = loadGame({ getGamepads: () => [pad] });
    assert.equal(api.pollInputGamepads().status, false);
    buttons[8].pressed = true;
    pad = { mapping: 'standard', buttons, axes: [0, 0] };
    assert.equal(api.pollInputGamepads().status, true);
    buttons[8].pressed = false;
    buttons[9].pressed = true;
    pad = { mapping: 'standard', buttons, axes: [0, 0] };
    assert.equal(api.pollInputGamepads().start, true);
});

test('escape closes help but does not escape game over or onboarding dialogs', () => {
    const { api, windowListeners } = loadGame({ storage: { glitchDuelOnboardingSeen: '1' } });
    const event = { key: 'Escape', preventDefault() { this.prevented = true; } };

    api.setupKeyboardControls();
    api.showMainMenu();
    api.showHelpScreen();
    windowListeners.keydown(event);
    assert.equal(api.getState().helpScreenDisplay, 'none');
    assert.equal(api.getState().mainMenuDisplay, 'flex');
    assert.equal(event.prevented, true);

    const onboarding = loadGame();
    onboarding.api.setupKeyboardControls();
    onboarding.api.showOnboardingIfNeeded();
    onboarding.windowListeners.keydown({ key: 'Escape', preventDefault() {} });
    assert.equal(onboarding.api.getState().onboardingScreenDisplay, 'flex');
});

test('system reduced motion is the initial preference until the player chooses one', () => {
    const system = loadGame({ reducedMotionSystem: true });
    system.api.renderMotionPreference();
    assert.equal(system.api.getState().reducedMotionEnabled, true);
    assert.equal(system.api.getState().reducedMotionToggleChecked, true);

    const saved = loadGame({ reducedMotionSystem: true, storage: { glitchDuelReducedMotion: 'false' } });
    saved.api.renderMotionPreference();
    assert.equal(saved.api.getState().reducedMotionEnabled, false);
    assert.equal(saved.api.getState().reducedMotionToggleChecked, false);
});

test('selection summary localizes style and rival descriptors', () => {
    const { api } = loadGame();

    api.setFighterStyle('fast');
    api.setRival('mergeConflict');
    let state = api.getState();
    assert.equal(state.stylePreviewTitle, 'RAPIDO');
    assert.match(state.stylePreviewText, /Movilidad/);
    assert.equal(state.rivalPreviewTitle, 'MERGE CONFLICT');
    assert.match(state.rivalPreviewText, /ramas/);

    api.setLanguage('en');
    state = api.getState();
    assert.equal(state.stylePreviewTitle, 'FAST');
    assert.match(state.stylePreviewText, /mobility/i);
    assert.equal(state.rivalPreviewTitle, 'MERGE CONFLICT');
    assert.match(state.rivalPreviewText, /branches/i);
});

test('visual rival selection applies identity without changing CPU combat tuning', () => {
    const { api } = loadGame();

    api.setRival('lagSpike');
    startPlayingGame(api);
    const cpu = api.getState().player2;

    assert.equal(api.getState().selectedRival, 'lagSpike');
    assert.equal(cpu.rivalKey, 'lagSpike');
    assert.equal(cpu.rivalDetail, 'lag');
    assert.equal(cpu.accentColor, '#0891b2');
    assert.equal(cpu.health, 100);
    assert.equal(cpu.moveSpeedModifier, 1);
    assert.equal(cpu.damageModifier, 1);
    assert.equal(api.getRivalLabel(), 'LAG SPIKE');

    api.setRival('missing');
    assert.equal(api.getState().selectedRival, 'nullPointer');
});

test('CPU rival details render alongside difficulty visuals', () => {
    const { api } = loadGame();

    Object.keys(api.CPU_RIVALS).forEach((rival) => {
        api.setRival(rival);
        api.initGame();
        api.getState().player2.draw();
    });

    const state = api.getState();
    assert(state.ctxCalls.includes('arc'));
    assert(state.ctxCalls.includes('strokeRect'));
    assert(state.textCalls.includes('NULL POINTER') || state.textCalls.includes('BOSS 500'));
});

test('training mode reuses fighters with configurable CPU, reset, timer, health, and energy', () => {
    const { api } = loadGame();

    api.startTraining();
    api.skipVsIntro();
    let state = api.getState();
    assert.equal(state.gameMode, 'training');
    assert.equal(state.roundTimerFrames, 0);
    assert.equal(state.player2.trainingBehavior, 'idle');

    api.setTrainingPosition('close');
    api.setTrainingCpu('block');
    api.setTrainingTimer('on');
    api.refillTraining('energy');
    state = api.getState();
    assert.equal(state.player1.x, 440);
    assert.equal(state.player2.x, 560);
    assert.equal(state.player2.trainingBehavior, 'block');
    assert.equal(state.player1.energy, 100);
    assert.equal(state.roundTimerFrames, 3600);

    state.player1.health = 1;
    api.refillTraining('health');
    assert.equal(api.getState().player1.health, 100);
});

test('debug overlay is opt-in and seeded simulation is reproducible', () => {
    const first = loadGame({ search: '?debug=1&seed=42' });
    const second = loadGame({ search: '?seed=42' });

    first.api.initGame();
    second.api.initGame();
    first.api.skipVsIntro();
    second.api.skipVsIntro();
    for (let i = 0; i < 30; i++) {
        first.api.update();
        second.api.update();
    }

    assert.equal(first.api.getDebugData().enabled, true);
    assert.equal(first.api.getState().matchSeed, 42);
    assert.equal(first.api.getState().player2.x, second.api.getState().player2.x);
    assert.equal(first.api.getState().player2.aiAction, second.api.getState().player2.aiAction);
    first.api.draw();
    assert(first.api.getState().ctxCalls.includes('strokeRect'));
});

test('debug timing metrics are opt-in and account for raw frame discard', () => {
    const off = loadGame({ storage: { glitchDuelOnboardingSeen: '1' } });
    off.api.initGame();
    off.api.gameLoop(0);
    off.api.gameLoop(1000);
    assert.equal(off.api.getDebugData().metrics.samples, 0);

    const on = loadGame({ search: '?debug=1&seed=42', storage: { glitchDuelOnboardingSeen: '1' } });
    on.api.initGame();
    on.api.gameLoop(0);
    on.api.gameLoop(1000);
    const metrics = on.api.getDebugData().metrics;
    assert.equal(metrics.samples, 2);
    assert.equal(metrics.frameClampDiscardMs, 900);
    assert.equal(metrics.maxStepsPerFrame, 6);
    assert.equal(metrics.deviceDpr, 2);
    assert.equal(metrics.effectiveDpr, 2);
});

test('first-run onboarding persists its skip decision', () => {
    const { api, context } = loadGame();

    api.showOnboardingIfNeeded();
    assert.equal(api.getState().onboardingScreenDisplay, 'flex');
    api.completeOnboarding(false);
    assert.equal(context.window.localStorage.getItem('glitchDuelOnboardingSeen'), '1');
    assert.equal(api.getState().onboardingScreenDisplay, 'none');
});

test('special attack consumes full energy and deals heavy damage', () => {
    const { api } = loadGame();
    const { player, opponent } = createFighters(api, 100, 220);
    giveEnergy(player);

    player.updatePlayerControls({ special: true }, opponent);

    assert.equal(player.state, 'special');
    assert.equal(player.energy, 0);
    assert.equal(opponent.health, 74);
    assert.equal(api.getState().specialFlash.color, player.accentColor);
    assert(api.getState().floatingTexts.some((text) => text.text === api.t('specialImpact')));
});

test('special feedback respects reduced motion', () => {
    const { api } = loadGame();
    const player = new api.Fighter(100, true);

    api.setReducedMotion(true);
    api.triggerSpecialFeedback(player);

    const state = api.getState();
    assert.equal(state.specialFlash.maxTimer, 12);
    assert.equal(state.specialFlash.fullFlash, false);
});

test('hitboxes prevent damage when opponent body is outside attack box', () => {
    const { api } = loadGame();
    const player = new api.Fighter(100, true);
    const opponent = new api.Fighter(170, false);
    opponent.y = 160;

    player.updatePlayerControls({ punch: true }, opponent);

    assert.equal(player.state, 'punch');
    assert.equal(opponent.health, 100);
    assert.equal(opponent.hitStun, 0);
});

test('blocked hits keep health and create lighter impact feedback', () => {
    const { api } = loadGame();
    const attacker = new api.Fighter(100, true);
    const defender = new api.Fighter(170, false);
    defender.state = 'block';

    defender.takeHit(16, attacker);

    const state = api.getState();
    assert.equal(defender.health, 97);
    assert.equal(state.hitStopFrames, 2);
    assert.equal(state.screenShake, 4);
    assert.equal(state.impactParticles.length, 7);
    assert.equal(state.floatingTexts.length, 1);
});

test('normal impacts include attacker identity color', () => {
    const { api } = loadGame();
    const attacker = new api.Fighter(170, false);
    const defender = new api.Fighter(100, true);

    defender.takeHit(10, attacker);

    const state = api.getState();
    assert(state.impactParticles.some((particle) => particle.color === attacker.accentColor));
    assert.equal(state.impactFlash.color, attacker.accentColor);
});

test('reduced motion limits shake hit-stop and impact particles', () => {
    const { api, context } = loadGame();

    api.setReducedMotion(true);
    api.triggerImpactFeedback(120, 300, 1);

    const state = api.getState();
    assert.equal(state.reducedMotionEnabled, true);
    assert.equal(state.reducedMotionToggleChecked, true);
    assert.equal(context.window.localStorage.getItem('glitchDuelReducedMotion'), 'true');
    assert.equal(state.screenShake, 0);
    assert.equal(state.hitStopFrames, 0);
    assert.equal(state.impactParticles.length, 5);
    assert.equal(state.impactFlash, null);
});

test('impact flash draws stylized hit-freeze overlay', () => {
    const { api } = loadGame();

    api.triggerImpactFeedback(150, 260, 1, false, '#1f6feb');
    api.draw();

    const state = api.getState();
    assert.equal(state.impactFlash.color, '#1f6feb');
    assert(state.ctxCalls.includes('arc'));
    assert(state.ctxCalls.includes('lineTo'));
});

test('fighter draw delegates to extracted render helpers', () => {
    const { api } = loadGame();
    const player = new api.Fighter(120, true);

    player.draw();

    const calls = api.getState().ctxCalls;
    assert(calls.includes('arc'));
    assert(calls.includes('stroke'));
    assert(calls.includes('restore'));
});

test('fighters expose distinct visual identities and render labels', () => {
    const { api } = loadGame();
    const player = new api.Fighter(120, true);
    const cpu = new api.Fighter(240, false);

    assert.equal(player.label, 'HUMANO');
    assert.equal(player.visualRole, 'human');
    assert.equal(cpu.label, 'CPU');
    assert.equal(cpu.visualRole, 'cpu');
    assert.notEqual(player.accentColor, cpu.accentColor);

    player.draw();
    cpu.draw();

    const state = api.getState();
    assert(state.textCalls.includes('P1'));
    assert(state.textCalls.includes('AI'));
    assert(state.textCalls.includes('HUMANO'));
    assert(state.textCalls.includes('CPU'));
    assert(state.ctxCalls.includes('strokeRect'));
});

test('CPU visual personality changes by difficulty', () => {
    const { api } = loadGame();
    const cpu = new api.Fighter(240, false);

    api.setDifficulty('easy');
    cpu.draw();
    api.setDifficulty('hard');
    cpu.draw();

    const state = api.getState();
    assert(state.textCalls.includes('?'));
    assert(state.textCalls.includes('!!'));
});

test('full energy draws special ready indicator above fighter', () => {
    const { api } = loadGame();
    const player = new api.Fighter(120, true);

    player.energy = 100;
    player.draw();

    assert(api.getState().textCalls.includes('ESPECIAL LISTO'));
});

test('game state gates simulation until a match starts', () => {
    const { api } = loadGame();

    api.showMainMenu();
    const menuState = api.getState();
    api.update();

    assert.equal(api.getState().gameState, 'menu');
    assert.equal(api.getState().player1.x, menuState.player1.x);

    startPlayingGame(api);

    assert.equal(api.getState().gameState, 'playing');
});

test('arcade VS intro freezes simulation and renders match summary', () => {
    const { api } = loadGame();

    api.setDifficulty('hard');
    api.setArena('serverDown');
    api.initGame();

    const before = api.getState();
    api.update(1000);
    api.draw();

    const state = api.getState();
    assert.equal(before.vsIntroTimer, 90);
    assert.equal(state.vsIntroTimer, 89);
    assert.equal(state.roundTimeMs, 60000);
    assert.equal(state.player1.x, before.player1.x);
    assert(state.textCalls.includes('P1  VS  NULL POINTER'));
    assert(state.textCalls.includes('Referencia nula: no hay margen de error.'));
    assert(state.textCalls.includes('DIFICIL | SERVIDOR CAIDO'));
});

test('help screen opens from menu state and returns to main menu', () => {
    const { api } = loadGame();

    api.showMainMenu();
    api.showHelpScreen();

    const helpState = api.getState();
    assert.equal(helpState.gameState, 'menu');
    assert.equal(helpState.mainMenuDisplay, 'none');
    assert.equal(helpState.helpScreenDisplay, 'flex');

    api.hideHelpScreen();

    const menuState = api.getState();
    assert.equal(menuState.gameState, 'menu');
    assert.equal(menuState.mainMenuDisplay, 'flex');
    assert.equal(menuState.helpScreenDisplay, 'none');
});

test('language preference detects browser language and persists manual changes', () => {
    const { api, context } = loadGame({ languages: ['en-US'] });

    api.renderLanguage();
    assert.equal(api.getLanguage(), 'en');
    assert.equal(api.getState().startButtonText, 'START GAME');

    api.setLanguage('es');
    assert.equal(api.getLanguage(), 'es');
    assert.equal(api.getState().startButtonText, 'INICIAR JUEGO');
    assert.equal(context.window.localStorage.getItem('glitchDuelLanguage'), 'es');
});

test('saved language preference wins over browser detection', () => {
    const { api } = loadGame({ languages: ['en-US'], storage: { glitchDuelLanguage: 'es' } });

    api.renderLanguage();

    assert.equal(api.getLanguage(), 'es');
    assert.equal(api.getState().languageSelectValue, 'es');
});

test('legacy language preference is still read', () => {
    const { api } = loadGame({ languages: ['en-US'], storage: { xkcdKombatLanguage: 'es' } });

    api.renderLanguage();

    assert.equal(api.getLanguage(), 'es');
    assert.equal(api.getState().languageSelectValue, 'es');
});

test('pause stops simulation and resume returns to playing', () => {
    const { api } = loadGame();

    api.initGame();
    const playingState = api.getState();
    api.pauseGame();

    const pausedState = api.getState();
    assert.equal(pausedState.gameState, 'paused');
    assert.equal(pausedState.pauseScreenDisplay, 'flex');
    assert.equal(pausedState.pauseButtonDisplay, 'none');
    assert.match(pausedState.pauseSummaryText, /Round 1/);
    assert.match(pausedState.pauseSummaryText, /Marcador 0-0/);
    assert.match(pausedState.pauseSummaryText, /Dificultad NORMAL/);
    assert.match(pausedState.pauseSummaryText, /Arena CUADERNO/);

    api.update();

    assert.equal(api.getState().player1.x, playingState.player1.x);

    api.resumeGame();

    const resumedState = api.getState();
    assert.equal(resumedState.gameState, 'playing');
    assert.equal(resumedState.pauseScreenDisplay, 'none');
    assert.equal(resumedState.pauseButtonDisplay, 'block');
});

test('difficulty selection changes CPU movement tuning', () => {
    const { api } = loadGame();
    const cpu = new api.Fighter(200, false);
    const opponent = new api.Fighter(500, true);

    api.setDifficulty('hard');
    cpu.aiAction = 'approach';
    cpu.aiDecisionTimer = 99;
    cpu.updateAI(opponent);

    assert.equal(api.getState().selectedDifficulty, 'hard');
    assert.equal(cpu.velX, 5.2);

    api.setDifficulty('invalid');

    assert.equal(api.getState().selectedDifficulty, 'normal');
});

test('fighter style selection applies to new rounds and falls back safely', () => {
    const { api } = loadGame();

    api.setFighterStyle('fast');
    startPlayingGame(api);

    let state = api.getState();
    assert.equal(state.selectedFighterStyle, 'fast');
    assert.equal(state.styleSelectValue, 'fast');
    assert.equal(state.player1.styleKey, 'fast');
    assert.equal(state.player1.moveSpeedModifier, 1.14);

    api.setFighterStyle('missing');
    state = api.getState();

    assert.equal(state.selectedFighterStyle, 'balanced');
});

test('post-match phrases include air attacks and fighter style wins', () => {
    const { api } = loadGame();

    api.recordPlayerAirAttack();
    assert.equal(api.getPostMatchPhrase(true), 'Ganaste desde el aire. La gravedad abrio un ticket y lo cerraste con estilo.');

    api.setFighterStyle('heavy');
    api.initGame();
    assert.equal(api.getPostMatchPhrase(true), 'Modo pesado confirmado: cada golpe sono como migracion en viernes.');

    api.recordPlayerSpecial();
    assert.equal(api.getPostMatchPhrase(true), 'Energia bien gastada. La CPU todavia esta renderizando excusas.');
});

test('CPU decision helper chooses deterministic defensive and offensive actions', () => {
    const { api } = loadGame();
    const difficulty = {
        blockReaction: 0.60,
        approachLong: 0.85,
        approachMid: 0.60,
        retreatMid: 0.80,
        jumpMid: 0.95,
        punchClose: 0.40,
        kickMid: 0.24,
        kickClose: 0.75,
        blockClose: 0.90,
        specialChance: 0.18,
        lowHealthRetreat: 0.70,
        cornerJump: 0.45,
        counterChance: 0.45,
        comebackSpecialChance: 0.28,
        comebackSpecialGap: 22,
        patternBlockBonus: 0.16
    };

    assert.equal(api.chooseAIAction({ dist: 130, health: 100, energy: 0, onGround: true, opponentAttacking: true, canPunch: false, canKick: false, difficulty, rand: 0.5 }), 'block');
    assert.equal(api.chooseAIAction({ dist: 120, health: 20, energy: 0, onGround: true, opponentAttacking: false, canPunch: false, canKick: false, difficulty, rand: 0.2 }), 'retreat');
    assert.equal(api.chooseAIAction({ dist: 300, health: 100, energy: 0, onGround: true, opponentAttacking: false, canPunch: false, canKick: false, difficulty, rand: 0.2 }), 'approach');
    assert.equal(api.chooseAIAction({ dist: 80, health: 100, energy: 100, onGround: true, opponentAttacking: false, canPunch: true, canKick: true, canSpecial: true, difficulty, rand: 0.1 }), 'special');
    assert.equal(api.chooseAIAction({ dist: 80, health: 100, energy: 0, onGround: true, opponentAttacking: false, canPunch: true, canKick: false, difficulty, rand: 0.2 }), 'punch');
});

test('CPU decision helper uses reaction chance, range, cooldown, and wall context', () => {
    const { api } = loadGame();
    const difficulty = {
        blockReaction: 0.60,
        approachLong: 0.85,
        approachMid: 0.60,
        retreatMid: 0.80,
        jumpMid: 0.95,
        punchClose: 0.40,
        kickMid: 0.24,
        kickClose: 0.75,
        blockClose: 0.90,
        specialChance: 0.18,
        lowHealthRetreat: 0.70,
        cornerJump: 0.45,
        counterChance: 0.45,
        comebackSpecialChance: 0.28,
        comebackSpecialGap: 22,
        patternBlockBonus: 0.16
    };

    assert.equal(api.chooseAIAction({ dist: 130, health: 100, energy: 0, onGround: true, opponentAttacking: true, canPunch: false, canKick: false, difficulty, rand: 0.7 }), 'retreat');
    assert.equal(api.chooseAIAction({ dist: 125, health: 100, energy: 0, onGround: true, opponentAttacking: false, canPunch: false, canKick: true, difficulty, rand: 0.2 }), 'kick');
    assert.equal(api.chooseAIAction({ dist: 80, health: 100, energy: 0, onGround: true, opponentAttacking: false, canPunch: true, canKick: true, attackCooldown: 4, difficulty, rand: 0.2 }), 'block');
    assert.equal(api.chooseAIAction({ dist: 120, health: 20, energy: 0, onGround: true, opponentAttacking: false, canPunch: false, canKick: false, x: 60, opponentX: 180, nearLeftWall: true, difficulty, rand: 0.2 }), 'block');
    assert.equal(api.chooseAIAction({ dist: 155, health: 100, energy: 100, onGround: true, opponentAttacking: false, canPunch: false, canKick: false, canSpecial: true, opponentHealth: 20, difficulty, rand: 0.9 }), 'special');
});

test('CPU decision helper supports counter windows and tactical specials', () => {
    const { api } = loadGame();
    const difficulty = {
        blockReaction: 0.60,
        approachLong: 0.85,
        approachMid: 0.60,
        retreatMid: 0.80,
        jumpMid: 0.95,
        punchClose: 0.40,
        kickMid: 0.24,
        kickClose: 0.75,
        blockClose: 0.90,
        specialChance: 0.18,
        lowHealthRetreat: 0.70,
        cornerJump: 0.45,
        counterChance: 0.45,
        comebackSpecialChance: 0.28,
        comebackSpecialGap: 22,
        patternBlockBonus: 0.16
    };

    assert.equal(api.chooseAIAction({ dist: 80, health: 80, energy: 0, onGround: true, opponentAttacking: false, canPunch: true, canKick: true, counterTimer: 8, difficulty, rand: 0.3 }), 'punch');
    assert.equal(api.chooseAIAction({ dist: 125, health: 80, energy: 0, onGround: true, opponentAttacking: false, canPunch: false, canKick: true, counterTimer: 8, difficulty, rand: 0.3 }), 'kick');
    assert.equal(api.chooseAIAction({ dist: 150, health: 40, energy: 100, onGround: true, opponentAttacking: false, canPunch: false, canKick: false, canSpecial: true, opponentHealth: 70, difficulty, rand: 0.2 }), 'special');
});

test('CPU short memory biases defense against repeated attacks', () => {
    const { api } = loadGame();
    const difficulty = {
        blockReaction: 0.60,
        approachLong: 0.85,
        approachMid: 0.60,
        retreatMid: 0.80,
        jumpMid: 0.95,
        punchClose: 0.40,
        kickMid: 0.24,
        kickClose: 0.75,
        blockClose: 0.90,
        specialChance: 0.18,
        lowHealthRetreat: 0.70,
        cornerJump: 0.45,
        counterChance: 0.45,
        comebackSpecialChance: 0.28,
        comebackSpecialGap: 22,
        patternMemoryGain: 12,
        patternMemoryDecay: 2,
        patternBlockBonus: 0.16
    };
    const cpu = new api.Fighter(180, false);
    const opponent = new api.Fighter(100, true);

    opponent.state = 'punch';
    for (let i = 0; i < 5; i++) cpu.updateAIMemory(opponent, difficulty);

    assert(cpu.aiMemory.attack > 50);
    assert.equal(api.chooseAIAction({ dist: 130, health: 100, energy: 0, onGround: true, opponentAttacking: false, canPunch: false, canKick: false, opponentAttackBias: cpu.aiMemory.attack / 100, difficulty, rand: 0.65 }), 'block');

    opponent.state = 'idle';
    cpu.updateAIMemory(opponent, difficulty);

    assert(cpu.aiMemory.attack < 60);
});

test('CPU memory tracks attack type spam separately from aggregate attack bias', () => {
    const { api } = loadGame();
    const difficulty = {
        patternMemoryGain: 12,
        patternMemoryDecay: 2,
        patternBlockBonus: 0.16,
        patternTypeBlockBonus: 0.08,
        spamBlockBonus: 0.50,
        zoneBlockBonus: 0.08,
        blockReaction: 0.60,
        approachMid: 1,
        retreatMid: 0,
        jumpMid: 0
    };
    const cpu = new api.Fighter(180, false);
    const opponent = new api.Fighter(100, true);

    for (let i = 0; i < 3; i++) {
        opponent.state = 'punch';
        opponent.lastAttackType = 'punch';
        cpu.updateAIMemory(opponent, difficulty);
        opponent.state = 'idle';
        cpu.updateAIMemory(opponent, difficulty);
    }

    const biases = cpu.getAIMemoryBiases(Math.abs(cpu.x - opponent.x), opponent);

    assert(cpu.aiMemory.attacks.punch > cpu.aiMemory.attacks.kick);
    assert.equal(cpu.aiMemory.repeatedType, 'punch');
    assert.equal(cpu.aiMemory.repeatedCount, 3);
    assert(biases.repeatedAttackBias > 0);
    assert.equal(api.chooseAIAction({ dist: 130, health: 100, energy: 0, onGround: true, opponentAttacking: false, canPunch: false, canKick: false, repeatedAttackBias: 0.75, difficulty, rand: 0.9 }), 'block');
});

test('CPU memory tracks attack patterns by distance zone and air state', () => {
    const { api } = loadGame();
    const difficulty = {
        patternMemoryGain: 14,
        patternMemoryDecay: 2,
        blockReaction: 0.82,
        patternTypeBlockBonus: 0.12,
        zoneBlockBonus: 0.12,
        airPatternKick: 0.48
    };
    const cpu = new api.Fighter(420, false);
    const opponent = new api.Fighter(140, true);
    opponent.onGround = false;
    opponent.state = 'airKick';
    opponent.lastAttackType = 'airKick';

    cpu.updateAIMemory(opponent, difficulty);

    const biases = cpu.getAIMemoryBiases(Math.abs(cpu.x - opponent.x), opponent);

    assert(cpu.aiMemory.zones.far.air > 0);
    assert.equal(cpu.aiMemory.zones.close.ground, 0);
    assert(biases.opponentAirBias > 0);
    assert(biases.zoneAttackBias > 0);
    assert.equal(api.chooseAIAction({ dist: 150, health: 100, energy: 0, onGround: true, opponentAttacking: false, canPunch: false, canKick: true, opponentAirBias: 0.6, zoneAttackBias: 0.6, difficulty, rand: 0.3 }), 'kick');
});

test('CPU counter timer activates when blocking damage', () => {
    const { api } = loadGame();
    const cpu = new api.Fighter(180, false);
    const opponent = new api.Fighter(100, true);

    cpu.state = 'block';
    opponent.lastAttackType = 'punch';
    cpu.takeHit(8, opponent);

    assert(cpu.aiCounterTimer > 0);
    assert.equal(cpu.aiDecisionTimer, 0);
});

test('CPU stale retreat action stops at arena wall', () => {
    const { api } = loadGame();
    const cpu = new api.Fighter(60, false);
    const opponent = new api.Fighter(160, true);

    cpu.aiAction = 'retreat';
    cpu.aiDecisionTimer = 99;
    cpu.updateAI(opponent);

    assert.equal(cpu.velX, 0);
    assert.equal(cpu.state, 'block');
    assert.equal(cpu.aiAction, 'block');
});

test('arena selection supports themed arenas and falls back to notebook', () => {
    const { api } = loadGame();

    api.setArena('cafeteria');
    assert.equal(api.getState().selectedArena, 'cafeteria');
    assert.equal(api.getArenaLabel(), 'CAFETERIA');

    api.setArena('meeting');
    assert.equal(api.getState().selectedArena, 'meeting');
    assert.equal(api.getArenaLabel(), 'REUNION PRESENCIAL');

    api.setArena('remoteMeeting');
    assert.equal(api.getState().selectedArena, 'remoteMeeting');
    assert.equal(api.getArenaLabel(), 'REUNION REMOTA');

    api.setArena('terminal');
    assert.equal(api.getState().selectedArena, 'notebook');
    assert.equal(api.getArenaLabel(), 'CUADERNO');

    api.setArena('mathClass');
    assert.equal(api.getState().selectedArena, 'mathClass');
    assert.equal(api.getArenaLabel(), 'CLASE DE MATEMATICAS');

    api.setArena('serverDown');
    assert.equal(api.getState().selectedArena, 'serverDown');
    assert.equal(api.getArenaLabel(), 'SERVIDOR CAIDO');

    api.setArena('geekConvention');
    assert.equal(api.getState().selectedArena, 'geekConvention');
    assert.equal(api.getArenaLabel(), 'CONVENCION GEEK');

    api.setArena('missing');
    assert.equal(api.getState().selectedArena, 'notebook');
    assert.equal(api.getArenaLabel(), 'CUADERNO');
});

test('arena preview updates with selection and language', () => {
    const { api } = loadGame();

    api.renderArenaPreview();
    let state = api.getState();
    assert.equal(state.arenaPreviewClass, 'arena-preview arena-preview--notebook');
    assert.equal(state.arenaPreviewTitle, 'CUADERNO');
    assert.match(state.arenaPreviewText, /Bocetos/);

    api.setArena('mathClass');
    state = api.getState();
    assert.equal(state.arenaPreviewClass, 'arena-preview arena-preview--mathClass');
    assert.equal(state.arenaPreviewTitle, 'CLASE DE MATEMATICAS');
    assert.match(state.arenaPreviewText, /Pizarra/);

    api.setLanguage('en');
    state = api.getState();
    assert.equal(state.arenaPreviewTitle, 'MATH CLASS');
    assert.match(state.arenaPreviewText, /Blackboard/);
});

test('new arena backgrounds render themed canvas primitives', () => {
    const { api } = loadGame();

    api.setArena('cafeteria');
    api.drawBackground();
    api.setArena('meeting');
    api.drawBackground();
    api.setArena('remoteMeeting');
    api.drawBackground();
    api.setArena('mathClass');
    api.drawBackground();
    api.setArena('serverDown');
    api.drawBackground();
    api.setArena('geekConvention');
    api.drawBackground();

    const state = api.getState();
    assert(state.ctxCalls.includes('strokeRect'));
    assert(state.ctxCalls.includes('fillRect'));
    assert(state.textCalls.includes('COFFEE'));
    assert(state.textCalls.includes('THIS COULD BE AN EMAIL'));
    assert(state.textCalls.includes("YOU'RE MUTED"));
    assert(state.textCalls.includes('f(punch) = pain'));
    assert(state.textCalls.includes('SERVER DOWN'));
    assert(state.textCalls.includes('BOOTH 404'));
});

test('arena foreground layer renders peripheral props for every arena and fallback', () => {
    const arenaKeys = ['notebook', 'cafeteria', 'lab', 'meeting', 'remoteMeeting', 'mathClass', 'serverDown', 'geekConvention'];

    arenaKeys.forEach((arenaKey) => {
        const { api } = loadGame();
        api.setArena(arenaKey);
        api.drawArenaForeground();

        const state = api.getState();
        assert(state.ctxCalls.includes('fillRect'));
        assert(state.ctxCalls.includes('strokeRect') || state.ctxCalls.includes('arc'));
    });

    const { api } = loadGame();
    api.setArena('missing');
    api.drawArenaForeground();
    const state = api.getState();
    assert.equal(state.selectedArena, 'notebook');
    assert(state.ctxCalls.includes('fillRect'));
    assert(state.ctxCalls.includes('strokeRect'));
});

test('arena animations advance through draw and respect reduced motion', () => {
    const { api } = loadGame();

    api.setArena('serverDown');
    api.draw();
    api.draw();

    let state = api.getState();
    assert.equal(state.visualFrame, 2);
    assert(state.textCalls.includes('SERVER DOWN'));

    api.setReducedMotion(true);
    api.draw();

    state = api.getState();
    assert.equal(state.reducedMotionEnabled, true);
    assert(state.visualFrame >= 3);
});

test('local stats track wins, losses, and best streak', () => {
    const { api, context } = loadGame();

    api.recordMatchResult(true);
    api.recordMatchResult(true);
    api.recordMatchResult(false);

    const stats = api.getState().stats;
    assert.equal(stats.wins, 2);
    assert.equal(stats.losses, 1);
    assert.equal(stats.currentStreak, 0);
    assert.equal(stats.bestStreak, 2);
    assert.equal(JSON.parse(context.window.localStorage.getItem('glitchDuelStats')).bestStreak, 2);
});

test('legacy motion and stats preferences are still read', () => {
    const { api } = loadGame({
        storage: {
            xkcdKombatReducedMotion: 'true',
            xkcdKombatStats: JSON.stringify({ wins: 3, losses: 1, currentStreak: 2, bestStreak: 3 })
        }
    });

    const state = api.getState();
    assert.equal(state.reducedMotionEnabled, true);
    assert.equal(state.stats.wins, 3);
    assert.equal(state.stats.losses, 1);
    assert.equal(state.stats.currentStreak, 2);
    assert.equal(state.stats.bestStreak, 3);
});

test('local stats discard invalid fields and unknown properties', () => {
    const { api } = loadGame({
        storage: {
            glitchDuelStats: JSON.stringify({
                wins: 12,
                losses: -1,
                currentStreak: 1.5,
                bestStreak: 1000001,
                injected: 'ignored'
            })
        }
    });

    const stats = api.getState().stats;
    assert.deepEqual({ ...stats }, { wins: 12, losses: 0, currentStreak: 0, bestStreak: 0 });
    assert.deepEqual(Object.keys(stats), ['wins', 'losses', 'currentStreak', 'bestStreak']);
});

test('local stats reject non-object values and markup before game-over rendering', () => {
    const { api } = loadGame({
        storage: {
            glitchDuelStats: JSON.stringify({
                wins: 0,
                losses: 0,
                currentStreak: 0,
                bestStreak: '<img src=x onerror=alert(1)>'
            })
        }
    });

    assert.equal(api.getState().stats.bestStreak, 0);
    api.renderGameOverText();

    const state = api.getState();
    assert.equal(state.winnerTextHtml, '');
    assert.match(state.winnerTextText, /Mejor: 0/);
    assert.doesNotMatch(state.winnerTextText, /<img/);

    const nonObject = loadGame({ storage: { glitchDuelStats: '[]' } });
    assert.deepEqual({ ...nonObject.api.getState().stats }, { wins: 0, losses: 0, currentStreak: 0, bestStreak: 0 });

    const malformed = loadGame({ storage: { glitchDuelStats: '{invalid' } });
    assert.deepEqual({ ...malformed.api.getState().stats }, { wins: 0, losses: 0, currentStreak: 0, bestStreak: 0 });
});

test('improved CPU blocks incoming close attacks', () => {
    const { api } = loadGame();
    const cpu = new api.Fighter(180, false);
    const opponent = new api.Fighter(100, true);
    opponent.state = 'punch';

    api.setMatchRandomSeed(0);
    cpu.updateAI(opponent);

    assert.equal(cpu.state, 'block');
    assert.equal(cpu.aiAction, 'block');
});

test('health display animates toward real health', () => {
    const { api } = loadGame();

    startPlayingGame(api);
    api.getState().player1.health = 60;
    advanceFrames(api, 1);

    const displayHealth = api.getState().player1.displayHealth;
    assert(displayHealth < 100);
    assert(displayHealth > 60);
});

test('orientation warning appears only for portrait touch play', () => {
    const { api, context } = loadGame();

    context.navigator.maxTouchPoints = 1;
    context.window.innerWidth = 390;
    context.window.innerHeight = 780;

    api.initGame();
    api.resizeCanvas();

    assert.equal(api.getState().orientationWarningDisplay, 'block');

    context.window.innerWidth = 780;
    context.window.innerHeight = 390;
    api.resizeCanvas();

    assert.equal(api.getState().orientationWarningDisplay, 'none');
});

test('status indicator announces fight and block states', () => {
    const { api } = loadGame();
    const attacker = new api.Fighter(100, true);
    const defender = new api.Fighter(170, false);

    api.initGame();

    assert.equal(api.getState().statusMessage, 'ROUND 1');

    defender.state = 'block';
    defender.takeHit(14, attacker);

    const state = api.getState();
    assert.equal(state.statusMessage, 'BLOCK');
    assert.equal(state.statusTimer, 28);
});

test('status messages render as arcade panels', () => {
    const { api } = loadGame();

    api.initGame();
    api.draw();

    const state = api.getState();
    assert(state.ctxCalls.includes('strokeRect'));
    assert(state.ctxCalls.includes('fillRect'));
    assert(state.textCalls.includes('ROUND 1'));
});

test('round system advances rounds and ends match at two wins', () => {
    const { api } = loadGame();

    api.initGame();
    api.skipVsIntro();
    api.getState().player2.health = 0;
    api.update();

    let state = api.getState();
    assert.equal(state.playerRounds, 1);
    assert.equal(state.cpuRounds, 0);
    assert.equal(state.currentRound, 2);
    assert.equal(state.gameState, 'playing');

    api.skipVsIntro();
    state.player2.health = 0;
    api.update();

    state = api.getState();
    assert.equal(state.playerRounds, 2);
    assert.equal(state.gameState, 'gameOver');
    assert.equal(state.player1.state, 'victory');
    assert.equal(state.player2.state, 'defeat');
    assert.match(state.winnerTextText, /Bug Exterminator/);
    assert.match(state.winnerTextText, /Marcador: 2-0/);
    assert.match(state.winnerTextText, /Dificultad: NORMAL/);
    assert.match(state.winnerTextText, /Arena: CUADERNO/);
    assert.match(state.winnerTextText, /Racha: 1 \| Mejor: 1/);
    assert.match(state.winnerTextText, /Bug eliminado/);
});

test('arcade run advances one match at a time with deterministic stages', () => {
    const { api, elements } = loadGame();

    api.setDifficulty('hard');
    api.setArena('lab');
    api.setRival('boss500');
    api.startArcadeRun();

    let state = api.getState();
    assert.equal(state.gameMode, 'arcade');
    assert.equal(state.gameState, 'playing');
    assert.equal(state.arcadeRun.fightIndex, 0);
    assert.deepEqual({ selectedDifficulty: state.selectedDifficulty, selectedArena: state.selectedArena, selectedRival: state.selectedRival }, {
        selectedDifficulty: 'easy',
        selectedArena: 'notebook',
        selectedRival: 'nullPointer'
    });

    api.skipVsIntro();
    state.player2.health = 0;
    api.update();
    api.skipVsIntro();
    api.getState().player2.health = 0;
    api.update();

    state = api.getState();
    assert.equal(state.gameState, 'gameOver');
    assert.equal(state.arcadeRun.results.length, 1);
    assert.equal(state.arcadeRun.awaitingNext, true);
    const runSeed = state.matchSeed;
    assert.match(state.winnerTextText, /1\/5/);
    assert.equal(elements.get('restart-button').textContent, 'SIGUIENTE COMBATE');

    api.continueArcadeRun();
    state = api.getState();
    assert.equal(state.gameState, 'playing');
    assert.equal(state.arcadeRun.fightIndex, 1);
    assert.equal(state.selectedDifficulty, 'normal');
    assert.equal(state.selectedArena, 'cafeteria');
    assert.equal(state.selectedRival, 'lagSpike');
    assert.equal(state.matchSeed, runSeed);
    assert.equal(state.playerRounds, 0);
    assert.equal(state.cpuRounds, 0);
});

test('arcade loss ends the run and retry restores menu selection', () => {
    const { api } = loadGame();

    api.setDifficulty('hard');
    api.setArena('lab');
    api.setRival('boss500');
    api.startArcadeRun();
    api.skipVsIntro();
    api.getState().player1.health = 0;
    assert.equal(api.getState().player1.health, 0);
    api.update();
    api.skipVsIntro();
    api.getState().player1.health = 0;
    api.update();

    let state = api.getState();
    assert.equal(state.gameState, 'gameOver');
    assert.equal(state.arcadeRun.results.length, 1);
    assert.equal(state.arcadeRun.awaitingNext, false);
    assert.match(state.winnerTextText, /CARRERA TERMINADA/);

    api.retryArcadeRun();
    state = api.getState();
    assert.equal(state.gameMode, 'arcade');
    assert.equal(state.arcadeRun.fightIndex, 0);
    assert.equal(state.selectedDifficulty, 'easy');

    api.showMainMenu();
    state = api.getState();
    assert.equal(state.gameMode, 'versus');
    assert.equal(state.selectedDifficulty, 'hard');
    assert.equal(state.selectedArena, 'lab');
    assert.equal(state.selectedRival, 'boss500');
});

test('arcade can complete five matches without adding a separate run win', () => {
    const { api } = loadGame();

    api.startArcadeRun();
    for (let fight = 0; fight < 5; fight++) {
        api.skipVsIntro();
        api.getState().player2.health = 0;
        api.update();
        api.skipVsIntro();
        api.getState().player2.health = 0;
        api.update();

        if (fight < 4) api.continueArcadeRun();
    }

    const state = api.getState();
    assert.equal(state.gameState, 'gameOver');
    assert.equal(state.arcadeRun.results.length, 5);
    assert.equal(state.arcadeRun.awaitingNext, false);
    assert.match(state.winnerTextText, /5\/5/);
    assert.equal(state.stats.wins, 5);
    assert.equal(state.matchHistory.length, 5);

    api.setLanguage('en');
    assert.match(api.getState().winnerTextText, /RUN COMPLETE/);
});

test('post-match medals use simple match stats', () => {
    const { api } = loadGame();

    assert.equal(api.getPostMatchMedal(true).title, 'Bug Exterminator');
    api.recordPlayerCombo();
    assert.equal(api.getPostMatchMedal(true).title, 'Combo Goblin');

    api.initGame();
    api.recordPlayerBlock();
    api.recordPlayerBlock();
    assert.equal(api.getPostMatchMedal(true).title, 'Firewall Humano');

    api.initGame();
    api.getState().player1.health = 20;
    assert.equal(api.getPostMatchMedal(true).title, '404 Survivor');
    assert.equal(api.getPostMatchMedal(false).title, 'Machine Approved');
});

test('finish poses render victory and defeat labels', () => {
    const { api } = loadGame();
    const winner = new api.Fighter(120, true);
    const loser = new api.Fighter(260, false);

    winner.state = 'victory';
    loser.state = 'defeat';

    winner.draw();
    loser.draw();

    const state = api.getState();
    assert(state.textCalls.includes(api.t('win')));
    assert(state.textCalls.includes('404'));
});

test('round timer awards round to fighter with more health', () => {
    const { api } = loadGame();

    api.initGame();
    api.skipVsIntro();
    api.getState().player1.health = 80;
    api.getState().player2.health = 60;
    api.setRoundTimeMs(1);
    api.update(1);

    const state = api.getState();
    assert.equal(state.playerRounds, 1);
    assert.equal(state.cpuRounds, 0);
    assert.equal(state.roundTimerFrames, 3600);
    assert.equal(state.roundTimeMs, 60000);
    assert.equal(state.gameState, 'playing');
});

test('round timer uses delta time and pauses outside playing', () => {
    const { api } = loadGame();

    api.initGame();
    api.skipVsIntro();
    api.getState().player2.aiDecisionTimer = 999;
    for (let i = 0; i < 150; i++) api.update();
    assert(Math.abs(api.getState().roundTimeMs - 57500) < 0.001);

    api.pauseGame();
    api.advanceSimulation(100);
    assert(Math.abs(api.getState().roundTimeMs - 57500) < 0.001);
});

test('fixed-step simulation keeps combat state equivalent at 30, 60, and 120 FPS', () => {
    function runAtFrameRate(frameMs, frames) {
        const { api, context } = loadGame();
        const originalRandom = context.Math.random;

        try {
            context.Math.random = () => 0.5;
            api.initGame();
            api.skipVsIntro();
            for (let i = 0; i < frames; i++) api.advanceSimulation(frameMs);
        } finally {
            context.Math.random = originalRandom;
        }

        const state = api.getState();
        return {
            player1: {
                x: state.player1.x,
                y: state.player1.y,
                health: state.player1.health,
                energy: state.player1.energy,
                state: state.player1.state,
                attackCooldown: state.player1.attackCooldown,
                hitStun: state.player1.hitStun,
                comboTimer: state.player1.comboTimer
            },
            player2: {
                x: state.player2.x,
                y: state.player2.y,
                health: state.player2.health,
                energy: state.player2.energy,
                state: state.player2.state,
                attackCooldown: state.player2.attackCooldown,
                hitStun: state.player2.hitStun,
                aiDecisionTimer: state.player2.aiDecisionTimer
            },
            roundTimeMs: state.roundTimeMs,
            roundTimerFrames: state.roundTimerFrames,
            gameState: state.gameState
        };
    }

    const at30 = runAtFrameRate(1000 / 30, 30);
    const at60 = runAtFrameRate(1000 / 60, 60);
    const at120 = runAtFrameRate(1000 / 120, 120);

    assert.deepEqual(at30, at60);
    assert.deepEqual(at60, at120);
});

test('fixed-step simulation bounds long frames without retaining stale time', () => {
    const { api } = loadGame();

    api.initGame();
    api.skipVsIntro();
    api.advanceSimulation(1000);

    const state = api.getState();
    assert(Math.abs(state.roundTimeMs - 59900) < 0.001);
    assert(state.simulationAccumulator < 1000 / 60);
});

test('round timer tie starts another round without scoring', () => {
    const { api } = loadGame();

    api.initGame();
    api.skipVsIntro();
    api.getState().player1.health = 70;
    api.getState().player2.health = 70;
    api.setRoundTimeMs(1);
    api.update(1);

    const state = api.getState();
    assert.equal(state.playerRounds, 0);
    assert.equal(state.cpuRounds, 0);
    assert.equal(state.currentRound, 2);
    assert.equal(state.gameState, 'playing');
});
