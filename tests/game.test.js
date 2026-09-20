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
        drawImage() { this.calls.push('drawImage'); },
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

function createMockAudioContext(audioEvents = [], options = {}) {
    function parameter(name) {
        return {
            value: 0,
            setValueAtTime(value, time) { this.value = value; audioEvents.push({ event: 'automation', name, curve: 'set', value, time }); },
            linearRampToValueAtTime(value, time) { audioEvents.push({ event: 'automation', name, curve: 'linear', value, time }); },
            exponentialRampToValueAtTime(value, time) { audioEvents.push({ event: 'automation', name, curve: 'exponential', value, time }); }
        };
    }
    return class MockAudioContext {
        constructor() {
            this.destination = {};
            this.currentTime = 10;
            this.state = 'running';
        }

        createOscillator() {
            return {
                type: '',
                frequency: parameter('frequency'),
                connect() { return this; },
                disconnect() { audioEvents.push({ event: 'disconnect', type: 'oscillator' }); },
                start(time) { audioEvents.push({ event: 'start', type: this.type, frequency: this.frequency.value, time }); },
                stop(time) {
                    audioEvents.push({ event: 'stop', type: this.type, frequency: this.frequency.value, time });
                    const onended = this.onended;
                    if (options.audioDeferredEnd) { audioEvents.push({ event: 'pendingEnd', end: onended }); return; }
                    for (let index = 0; index < (options.audioOnendedCalls || 1); index++) {
                        if (typeof onended === 'function') onended();
                    }
                }
            };
        }

        createGain() {
            return {
                gain: parameter('gain'),
                connect() { return this; },
                disconnect() { audioEvents.push({ event: 'disconnect', type: 'gain' }); }
            };
        }
    };
}

function loadGame(options = {}) {
    const ctx = createMockContext();
    const audioEvents = [];
    const downloads = [];
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
        'combat-volume': 'input',
        'ui-volume': 'input',
        'test-combat-audio': 'button',
        'test-ui-audio': 'button',
        'back-button': 'button',
        'controls-back-button': 'button',
        'reset-controls-button': 'button',
        'resume-button': 'button',
        'pause-menu-button': 'button',
        'restart-button': 'button',
        'menu-button': 'button',
        'onboarding-next-button': 'button',
        'onboarding-skip-button': 'button',
        'onboarding-title': 'h1',
        'onboarding-guidance-select': 'select',
        'help-guidance-select': 'select',
        'onboarding-guidance-status': 'p',
        'help-guidance-status': 'p',
        'onboarding-guide-keyboard-marker': 'span',
        'onboarding-guide-touch-marker': 'span',
        'onboarding-guide-gamepad-marker': 'span',
        'help-guide-keyboard-marker': 'span',
        'help-guide-touch-marker': 'span',
        'help-guide-gamepad-marker': 'span',
        'onboarding-guide-keyboard-text': 'p',
        'onboarding-guide-touch-text': 'p',
        'onboarding-guide-gamepad-text': 'p',
        'help-guide-keyboard-text': 'p',
        'help-guide-touch-text': 'p',
        'help-guide-gamepad-text': 'p',
        'duel-settings': 'details',
        'menu-utilities': 'details',
        'controls-screen': 'div',
        'help-screen': 'div',
        'main-menu': 'div',
        'onboarding-screen': 'div',
        'pause-screen': 'div',
        'game-over': 'div',
        'result-card': 'canvas',
        'result-card-details': 'details',
        'share-result-button': 'button',
        'download-card-button': 'button',
        'copy-challenge-button': 'button',
        'challenge-link': 'textarea',
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
            ...(tagName === 'canvas' ? { getContext: () => ctx,
                toDataURL: () => 'data:image/png;base64,dGVzdA==',
                toBlob: (callback) => callback(new Blob(['test'], { type: 'image/png' })) } : {}),
            click() { if (this.download) downloads.push({ href: this.href, download: this.download }); },
            remove() { if (this.parentElement) this.parentElement.children = this.parentElement.children.filter((child) => child !== this); },
            select() { this.selected = true; },
            className: '',
            children: [],
            parentElement: null,
            parentNode: null,
            listeners: {},
            attributes: {},
            hidden: false,
            inert: false,
            open: String(tagName).toLowerCase() === 'details' ? false : undefined,
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
    const MockAudioContext = createMockAudioContext(audioEvents, options);
    const navigatorMock = {
        maxTouchPoints: options.touchPoints || 0,
        language: options.language,
        languages: options.languages,
        getGamepads: options.getGamepads || (() => options.gamepads || [])
    };
    const context = {
        console,
        URL, URLSearchParams, Blob, File,
        downloads,
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
            location: { search: options.search || '', href: options.href || `https://example.test/glitch_duel/${options.search || ''}` },
            AudioContext: MockAudioContext,
            webkitAudioContext: MockAudioContext,
            localStorage: {
                getItem(key) {
                    if (options.storageGetThrows) throw new Error('storage get unavailable');
                    return storage.has(key) ? storage.get(key) : null;
                },
                setItem(key, value) {
                    if (options.storageSetThrows) throw new Error('storage set unavailable');
                    storage.set(key, value);
                },
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
            playGlitchCancelSound,
            getAudioDiagnostics,
            getAudioVolumes,
            setAudioVolume,
            setupAudioSettings,
            renderAudioSettings,
            AUDIO_CONFIG,
            getCombatSignature,
            getCombatFeedbackKind,
            IMPACT_PHRASES,
            addCombatText,
            announceCombatStatus,
            renderCombatStatus,
            recordCombatEvent,
            setTrainingTrial,
            renderTrainingTrial,
            t,
            I18N,
            ARENAS,
            CPU_RIVALS,
            DIFFICULTIES,
            ARCADE_RUN_FIGHTS,
            setLanguage,
            getLanguage,
            chooseAIAction,
            chooseAINeutralAction,
            chooseWeightedAIAction,
            nextSimulationRandomForTest: () => randomSimulation(),
            getChallengeFromLocation,
            applyChallengeFromLocation,
            buildChallengeUrl,
            getSeedFromLocation,
            getResultCardData,
            renderResultCard,
            shareResult,
            copyChallengeLink,
            downloadResultCard,
            captureRoundHighlight,
            finishRound,
            setupRestartButton,
            DUEL_RULES_VERSION,
            COMIC_FEEDBACK,
            getCPUAIContext,
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
            pushDebugSampleForTest: (list, value) => {
                debugMetrics.active = true;
                pushDebugSample(debugMetrics[list], value);
            },
            getDebugMetricBufferForTest: (list) => [...debugMetrics[list]],
            setMatchRandomSeed,
            createSeededRandom,
            showOnboardingIfNeeded,
            completeOnboarding,
            requestStartMode,
            startRequestedMode,
            setGuidanceInputMethod,
            recordRecentInputMethod,
            renderInputGuidance,
            renderOnboarding,
            setupOnboarding,
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
            getSpecialActionState,
            getSpecialActionStateText,
            getGameplayFocusableElements,
            updateCombatStatusThresholds,
            GLITCH_CANCEL_ENERGY_COST,
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
            drawHealthBar,
            drawEnergyBar,
            COMBAT_FEEDBACK,
            getState: () => ({
                roundHighlight, combatCaptionFrames, resultCardFile, loadedChallenge,
                player1,
                player2,
                keys: { ...keys },
                 inputSnapshot: getInputSnapshot(),
                activePointerCount: activePointers.size,
                floatingTexts,
                impactParticles,
                gameState,
                gameMode,
                activeTrialId,
                trialState: trialState ? { ...trialState, completedSteps: [...trialState.completedSteps] } : null,
                arcadeRun: arcadeRun ? {
                    ...arcadeRun,
                    results: arcadeRun.results.map((record) => ({ ...record, events: { ...record.events } })),
                    menuSelection: { ...arcadeRun.menuSelection }
                } : null,
                matchHistory: getMatchHistory(),
                matchElapsedFrames,
                 trainingConfig: { ...trainingConfig },
                 recentInputMethod,
                 guidanceInputMethod,
                 pendingStartMode,
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
                arenaReaction,
                lastCombatEvent: lastCombatEvent && typeof lastCombatEvent === 'object' ? { ...lastCombatEvent } : lastCombatEvent,
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

function prepareGlitchCancelInputCase(api) {
    api.startTraining();
    api.setTrainingTrial('glitchCancel');
    api.skipVsIntro();
    const state = api.getState();
    state.player2.x = 800;
    state.player1.attack('punch', state.player2);
    assert.equal(api.getState().trialState.phase, 'cancel');
    return state;
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
            ['triangle', 950],
            ['sawtooth', 190],
            ['sine', 85],
            ['square', 1800],
            ['triangle', 220],
            ['triangle', 950],
            ['sawtooth', 140],
            ['sine', 85],
            ['square', 1800]
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
            ['triangle', 1500],
            ['triangle', 120],
            ['sawtooth', 95],
            ['sine', 85],
            ['square', 1800],
            ['square', 920],
            ['triangle', 180],
            ['triangle', 950],
            ['square', 620],
            ['sine', 1250]
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
    assert.equal(after.createdGraphs, before.createdGraphs + 2);
    assert.equal(after.endedGraphs, before.endedGraphs + 2);
    assert.equal(after.activeGraphs, 0);
    assert.equal(after.oscillatorsCreated - after.oscillatorsDisconnected, 0);
    assert.equal(after.gainsCreated - after.gainsDisconnected, 0);
});

test('Web Audio cleanup stays idempotent when onended is delivered repeatedly', () => {
    const { api, audioEvents } = loadGame({ audioOnendedCalls: 2 });

    api.playAttackSound('punch');

    const diagnostics = api.getAudioDiagnostics();
    assert.equal(diagnostics.createdGraphs, 2);
    assert.equal(diagnostics.endedGraphs, 2);
    assert.equal(diagnostics.activeGraphs, 0);
    assert.equal(audioEvents.filter((event) => event.event === 'disconnect').length, 4);
});

test('audio settings stay lazy, persist each channel, clamp setters and isolate mute', () => {
    const { api, context, audioEvents } = loadGame();
    assert.deepEqual({ ...api.getAudioVolumes() }, { combat: 0.65, ui: 0.55 });
    api.setupAudioSettings();
    assert.equal(api.getAudioDiagnostics().contextState, 'uninitialized');
    api.setAudioVolume('combat', 0);
    api.playAttackSound('special');
    api.playImpactSound('kick');
    api.playGlitchCancelSound();
    assert.equal(api.getAudioDiagnostics().contextState, 'uninitialized');
    api.playUISound('select');
    assert.equal(audioEvents.filter((event) => event.event === 'start').length, 1);
    api.setAudioVolume('ui', 0);
    api.setAudioVolume('combat', 0.3);
    const starts = audioEvents.filter((event) => event.event === 'start').length;
    api.playUISound('start');
    assert.equal(audioEvents.filter((event) => event.event === 'start').length, starts);
    api.playImpactSound('special');
    assert(audioEvents.filter((event) => event.event === 'start').length > starts);
    const saved = context.window.localStorage.getItem('glitchDuelAudioVolumes');
    const reload = loadGame({ storage: { glitchDuelAudioVolumes: saved } });
    assert.deepEqual({ ...reload.api.getAudioVolumes() }, { combat: 0.3, ui: 0 });
    assert.equal(reload.api.getAudioDiagnostics().contextState, 'uninitialized');
    assert.equal(api.setAudioVolume('music', 1), false);
    assert.equal(api.setAudioVolume('ui', NaN), false);
    api.setAudioVolume('ui', 2);
    assert.equal(api.getAudioVolumes().ui, 1);
    api.setAudioVolume('ui', -1);
    assert.equal(api.getAudioVolumes().ui, 0);
});

test('invalid or unavailable audio preferences preserve defaults and native slider feedback', () => {
    for (const stored of ['{broken', 'null', '[]', '{"version":2,"combat":0}', '{"version":1,"combat":"0","ui":5}']) {
        const { api } = loadGame({ storage: { glitchDuelAudioVolumes: stored } });
        assert.deepEqual({ ...api.getAudioVolumes() }, { combat: 0.65, ui: 0.55 });
    }
    const { api, elements } = loadGame({ storageGetThrows: true, storageSetThrows: true });
    api.setupAudioSettings();
    const slider = elements.get('combat-volume');
    slider.listeners.input({ target: { value: '25' } });
    assert.equal(api.getAudioVolumes().combat, 0.25);
    assert.equal(elements.get('combat-volume-value').textContent, '25%');
    assert.equal(slider.getAttribute('aria-valuetext'), '25%');
    assert.equal(api.getAudioDiagnostics().contextState, 'uninitialized');
});

test('layered tones schedule envelopes on the audio clock and respect channel gain', () => {
    const { api, audioEvents } = loadGame();
    api.setAudioVolume('combat', 0.5);
    api.playImpactSound('special');
    const peaks = audioEvents.filter((event) => event.name === 'gain' && event.curve === 'linear');
    assert.equal(peaks.length, 4);
    assert.equal(peaks[0].value, 0.32 * 0.5 * api.AUDIO_CONFIG.mixGain);
    assert(peaks.every((event) => event.time >= 10 && event.value > 0 && event.value < 0.2));
    const tails = audioEvents.filter((event) => event.name === 'gain' && event.curve === 'exponential');
    assert(tails.every((event) => event.value === api.AUDIO_CONFIG.floorGain));
    const starts = audioEvents.filter((event) => event.event === 'start');
    assert(starts.some((event) => event.time > 10), 'digital layers use sample-clock offsets');
    const stops = audioEvents.filter((event) => event.event === 'stop');
    assert(stops.every((event) => event.time > 10));
    assert.equal(api.getAudioDiagnostics().activeGraphs, 0);
});

test('audio voice budget bounds overlapping layers and every delayed graph is released once', () => {
    const { api, audioEvents } = loadGame({ audioDeferredEnd: true });
    for (let i = 0; i < 20; i++) api.playImpactSound('special');
    const active = api.getAudioDiagnostics();
    assert.equal(active.activeGraphs, api.AUDIO_CONFIG.maxVoices);
    assert(active.droppedVoices > 0);
    for (const event of audioEvents.filter((event) => event.event === 'pendingEnd')) { event.end(); event.end(); }
    const ended = api.getAudioDiagnostics();
    assert.equal(ended.activeGraphs, 0);
    assert.equal(ended.createdGraphs, ended.endedGraphs);
    assert.equal(ended.oscillatorsCreated, ended.oscillatorsDisconnected);
    assert.equal(ended.gainsCreated, ended.gainsDisconnected);
});

test('unsupported Web Audio stays silent without breaking combat or volume settings', () => {
    const { api, context } = loadGame();
    context.window.AudioContext = null;
    context.window.webkitAudioContext = null;
    api.playAttackSound('special');
    api.playUISound('select');
    assert.equal(api.getAudioDiagnostics().contextState, 'uninitialized');
    const { player, opponent } = createFighters(api, 100, 220);
    player.attack('kick', opponent);
    assert.equal(opponent.health, 86);
});

test('hitstop and particles scale with contact strength while damage and block rules stay intact', () => {
    for (const [type, health, stop, particles] of [['punch', 92, 5, 14], ['comboKick', 82, 7, 20], ['special', 74, 9, 26]]) {
        const { api } = loadGame();
        const { player, opponent } = createFighters(api, 100, 220);
        player.energy = 100;
        player.attack(type, opponent);
        const state = api.getState();
        assert.equal(opponent.health, health, type);
        assert.equal(state.hitStopFrames, stop, type);
        assert.equal(state.impactParticles.length, particles, type);
        assert.equal(state.arenaReaction.kind, api.getCombatFeedbackKind(type));
    }
    const { api } = loadGame();
    const { player, opponent } = createFighters(api, 100, 220);
    player.energy = 100; opponent.state = 'block';
    player.attack('special', opponent);
    assert.equal(opponent.health, 95);
    assert.equal(api.getState().hitStopFrames, 2);
    assert.equal(api.getState().arenaReaction.kind, 'block');
});

test('every style and rival has a distinct cosmetic signature without changing combat tuning', () => {
    const { api } = loadGame();
    const patterns = new Set();
    for (const key of ['balanced', 'fast', 'heavy', 'technical', 'nullPointer', 'lagSpike', 'mergeConflict', 'boss500']) {
        const isPlayer = ['balanced', 'fast', 'heavy', 'technical'].includes(key);
        const fighter = new api.Fighter(400, isPlayer);
        if (isPlayer) fighter.applyStyle(key); else fighter.applyRival(key);
        const before = [fighter.health, fighter.damageModifier, fighter.moveSpeedModifier];
        api.triggerSpecialFeedback(fighter);
        patterns.add(api.getState().specialFlash.signature.pattern);
        api.draw();
        assert.deepEqual([fighter.health, fighter.damageModifier, fighter.moveSpeedModifier], before);
    }
    assert.equal(patterns.size, 8);
});

test('combat text and particle budgets bound a barrage and keep thematic feedback', () => {
    const { api } = loadGame();
    const { player, opponent } = createFighters(api, 100, 220);
    for (let i = 0; i < 40; i++) { player.attackCooldown = 0; player.attack('comboKick', opponent); }
    const state = api.getState();
    assert.equal(state.impactParticles.length, api.COMBAT_FEEDBACK.maxParticles);
    assert.equal(state.floatingTexts.length, api.COMBAT_FEEDBACK.maxTexts);
    assert(state.floatingTexts.every((label) => api.IMPACT_PHRASES.combo.includes(label.text)));
    assert(state.impactParticles.some((particle) => particle.type === 'pixel'));
    api.draw();
});

test('reactive arenas and signature flashes tick only in simulation and reset cleanly', () => {
    const { api } = loadGame();
    startPlayingGame(api);
    const { player1, player2 } = api.getState();
    player1.x = 400; player2.x = 520; player1.energy = 100;
    player1.attack('special', player2);
    const before = api.getState().arenaReaction.timer;
    const cooldown = player1.attackCooldown;
    api.draw(); api.draw();
    assert.equal(api.getState().arenaReaction.timer, before);
    api.update();
    assert.equal(api.getState().arenaReaction.timer, before - 1);
    assert.equal(player1.attackCooldown, cooldown, 'extra hitstop does not advance fighter recovery');
    api.pauseGame(); api.advanceSimulation(100);
    assert.equal(api.getState().arenaReaction.timer, before - 1);
    api.startRound();
    assert.equal(api.getState().arenaReaction, null);
    api.startTraining();
    api.skipVsIntro();
    api.triggerImpactFeedback(300, 300, 1);
    for (let frame = 0; frame < 64; frame++) api.update();
    assert.equal(api.getState().arenaReaction, null);
    assert.equal(api.getState().impactFlash, null);
    assert.equal(api.getState().impactParticles.length, 0);
    api.triggerImpactFeedback(300, 300, 1);
    api.resetTraining();
    assert.equal(api.getState().arenaReaction, null);
    api.triggerImpactFeedback(300, 300, 1);
    api.showMainMenu();
    assert.equal(api.getState().arenaReaction, null);
});

test('reduced motion keeps signature and contact shapes with no shake or hitstop', () => {
    const { api } = loadGame({ reducedMotionSystem: true });
    const { player, opponent } = createFighters(api, 100, 220);
    player.applyStyle('technical'); player.energy = 100;
    player.attack('special', opponent);
    const state = api.getState();
    assert.equal(state.hitStopFrames, 0);
    assert.equal(state.screenShake, 0);
    assert.equal(state.impactFlash.signature.pattern, 'scan');
    const before = state.impactParticles.map((p) => [p.x, p.y]);
    state.impactParticles.forEach((p) => p.update());
    assert.deepEqual(state.impactParticles.map((p) => [p.x, p.y]), before);
    api.draw();
});

test('new arenas integrate localized selection and previews without changing seeded combat', () => {
    function trace(arena, muted) {
        const { api } = loadGame({ search: '?seed=49' });
        api.setArena(arena); api.setAudioVolume('combat', muted ? 0 : 1);
        startPlayingGame(api);
        const states = [];
        for (let i = 0; i < 120; i++) {
            api.advanceSimulation(1000 / 60); api.draw();
            const s = api.getState();
            states.push([s.player1.x, s.player1.health, s.player2.x, s.player2.y, s.player2.aiAction, s.roundTimerFrames]);
        }
        return states;
    }
    const base = trace('notebook', false);
    for (const key of ['terminal', 'rooftop']) {
        assert.deepEqual(trace(key, true), base, key);
        const { api } = loadGame();
        api.setArena(key);
        assert.equal(api.getState().arenaPreviewClass, `arena-preview arena-preview--${key}`);
        assert.notEqual(api.getState().arenaPreviewText, 'arenaPreviewTerminal');
        assert.equal(api.getArenaLabel(), key === 'terminal' ? 'TERMINAL' : 'AZOTEA');
        api.setLanguage('en');
        assert.equal(api.getArenaLabel(), key === 'terminal' ? 'TERMINAL' : 'ROOFTOP');
        api.triggerImpactFeedback(500, 300, 1);
        api.drawBackground(); api.drawArenaForeground();
    }
});

test('weighted neutral pools preserve baseline cutoffs, legal options and nonzero repeat probability', () => {
    const { api } = loadGame();
    const pool = [['approach', 2], ['retreat', 1], ['block', 1]];
    for (const [rand, expected] of [[0, 'approach'], [0.499999, 'approach'], [0.5, 'retreat'], [0.75, 'block']]) {
        assert.equal(api.chooseWeightedAIAction(pool, rand, '', 0.5), expected);
    }
    assert.equal(api.chooseWeightedAIAction(pool, 0.4, 'approach', 0.5), 'retreat');
    assert.equal(api.chooseWeightedAIAction(pool, 0.1, 'approach', 0.5), 'approach');
    for (const d of Object.values(api.DIFFICULTIES)) {
        assert.equal(d.neutralRepeatWeight, 0.5);
        for (const cutoffs of [[0, d.kickMid, d.approachMid, d.retreatMid, d.jumpMid, 1], [0, d.punchClose, d.kickClose, d.blockClose, 1]]) {
            assert(cutoffs.every(Number.isFinite));
            assert(cutoffs.every((v, i) => i === 0 || v >= cutoffs[i - 1]));
        }
        const base = { dist: 150, punchReady: true, kickReady: true, retreatBlocked: false, opponentBlockBias: 0, difficulty: d };
        const baseline = {}, repeated = {};
        for (let i = 0; i < 10000; i++) {
            const rand = (i + 0.5) / 10000;
            const action = api.chooseAINeutralAction({ ...base, rand });
            baseline[action] = (baseline[action] || 0) + 1;
            const previous = api.chooseAINeutralAction({ ...base, rand, previousDecision: 'approach' });
            repeated[previous] = (repeated[previous] || 0) + 1;
            const filtered = api.chooseAINeutralAction({ ...base, rand, kickReady: false, retreatBlocked: true });
            assert(!['kick', 'retreat'].includes(filtered));
        }
        assert.equal(baseline.kick, Math.round(d.kickMid * 10000));
        assert.equal(baseline.approach, Math.round((d.approachMid - d.kickMid) * 10000));
        assert(repeated.approach > 0 && repeated.approach < baseline.approach);
        assert.equal(Object.keys(repeated).length, 5);
        assert.equal(api.chooseAINeutralAction({ ...base, dist: 95, rand: 0 }), 'punch');
        assert.equal(api.chooseAINeutralAction({ ...base, dist: 95.001, rand: 0 }), 'kick');
        assert.equal(api.chooseAINeutralAction({ ...base, dist: 110, rand: 0 }), 'kick');
        assert.equal(api.chooseAINeutralAction({ ...base, dist: 250.001, rand: 0 }), 'approach');
    }
});

test('neutral repetition never suppresses protected tactical choices', () => {
    const { api } = loadGame();
    const base = { dist: 90, health: 100, energy: 0, onGround: true, canPunch: true, canKick: true,
        x: 400, opponentX: 490, difficulty: api.DIFFICULTIES.normal, rand: 0.05 };
    for (const [overrides, expected] of [
        [{ opponentWhiffed: true, opponentRecovery: 12 }, 'punch'],
        [{ antiAirIntercept: { type: 'kick', frames: 2 } }, 'antiAir'],
        [{ opponentAttacking: true }, 'block'],
        [{ energy: 100, canSpecial: true, opponentHealth: 10 }, 'special'],
        [{ counterTimer: 10 }, 'punch'],
        [{ opponentPunchBias: 0.8 }, 'crouch'],
        [{ dist: 200, opponentAttackBias: 0.8 }, 'retreat'],
        [{ timedRound: true, lateRound: true, cpuBehind: true }, 'punch'],
        [{ opponentBlockBias: 1 }, 'punch'],
        [{ health: 20 }, 'retreat'],
        [{ onGround: false, canAirPunch: true }, 'airPunch']
    ]) assert.equal(api.chooseAIAction({ ...base, ...overrides, previousDecision: expected }), expected);
});

test('CPU remembers one decision, consumes two RNG samples and keeps existing lifecycle', () => {
    const { api } = loadGame();
    api.setMatchRandomSeed(17);
    const oracle = Array.from({ length: 3 }, () => api.nextSimulationRandomForTest());
    api.setMatchRandomSeed(17);
    const cpu = new api.Fighter(750, false), opponent = new api.Fighter(150, true);
    assert.equal(cpu.aiPreviousDecisionAction, '');
    cpu.updateAI(opponent);
    const previous = cpu.aiPreviousDecisionAction;
    assert(previous);
    assert.equal(api.nextSimulationRandomForTest(), oracle[2]);
    api.setMatchRandomSeed(17);
    cpu.updateAI(opponent);
    assert.equal(cpu.aiPreviousDecisionAction, previous);
    assert.equal(api.nextSimulationRandomForTest(), oracle[0]);
    api.startTraining();
    const trainingCpu = api.getState().player2;
    trainingCpu.aiPreviousDecisionAction = 'jump';
    api.pauseGame(); api.resumeGame(); api.resetTraining();
    assert.equal(api.getState().player2.aiPreviousDecisionAction, 'jump');
    api.startRound();
    assert.equal(api.getState().player2.aiPreviousDecisionAction, '');
    api.showMainMenu();
    assert.equal(api.getState().player2.aiPreviousDecisionAction, '');
});

test('bounded bait and approach hold reachable spacing without extra decisions or attacks', () => {
    const { api } = loadGame();
    const cpu = new api.Fighter(500, false), opponent = new api.Fighter(380, true);
    cpu.aiAction = 'approach'; cpu.aiDecisionTimer = 20;
    cpu.updateAI(opponent);
    assert.equal(cpu.velX, 0); assert.equal(cpu.attackSequence, 0);
    assert.equal(cpu.aiDecisionTimer, 19);
    cpu.aiAction = 'retreat'; cpu.aiMemory.attack = 100; opponent.x = 270;
    cpu.updateAI(opponent);
    assert.equal(cpu.velX, 0);
    opponent.x = 340; cpu.updateAI(opponent);
    assert(cpu.velX > 0, 'bait still retreats before its spacing boundary');
    cpu.x = 950; opponent.x = 790; cpu.updateAI(opponent);
    assert.equal(cpu.velX, 0); assert.equal(cpu.aiAction, 'block');
});

test('neutral CPU trace and last decision remain identical at 30, 60 and 120 FPS', () => {
    function run(fps) {
        const { api } = loadGame({ search: '?seed=17' });
        startPlayingGame(api);
        api.getState().player1.health = 1000;
        const trace = [];
        for (let frame = 0; frame < fps * 3; frame++) {
            api.advanceSimulation(1000 / fps); api.draw();
            if ((frame + 1) % (fps / 10) === 0) {
                const s = api.getState(), cpu = s.player2;
                trace.push([s.matchElapsedFrames, cpu.x, cpu.state, cpu.aiAction, cpu.aiPreviousDecisionAction, cpu.aiDecisionTimer,
                    cpu.attackCooldown, cpu.attackSequence, s.player1.health, s.roundTimerFrames]);
            }
        }
        assert.equal(api.getState().matchElapsedFrames, 180);
        assert.equal(api.getState().currentRound, 1);
        return trace;
    }
    const trace = run(60);
    assert.deepEqual(run(30), trace); assert.deepEqual(run(120), trace); assert.deepEqual(run(60), trace);
    assert.equal(trace[0][4], 'approach');
    assert(trace.some((sample) => sample[4] !== 'approach'));
});

test('semantic captions require real unblocked contact and their cooldown freezes with simulation', () => {
    const { api } = loadGame();
    api.startTraining(); api.skipVsIntro();
    const { player1: player, player2: opponent } = api.getState();
    player.x = 400; opponent.x = 480;
    opponent.onGround = false; opponent.y -= 20;
    player.attack('punch', opponent);
    assert.equal(player.lastAttackOutcome, 'hit');
    assert.equal(api.getState().floatingTexts.at(-1).text, 'NO FLY ZONE');
    const cooldown = api.getState().combatCaptionFrames;
    api.draw(); api.pauseGame(); api.advanceSimulation(100);
    assert.equal(api.getState().combatCaptionFrames, cooldown);
    api.resumeGame(); api.update();
    assert.equal(api.getState().combatCaptionFrames, cooldown - 1);
    api.resetTraining();
    player.x = 400; opponent.x = 480; opponent.lastAttackOutcome = 'whiff'; opponent.attackCooldown = 10;
    player.attack('kick', opponent);
    assert.equal(api.getState().floatingTexts.at(-1).text, 'CACHE MISS');
    player.attackCooldown = 0; player.attack('kick', opponent);
    assert.notEqual(api.getState().floatingTexts.at(-1).text, 'CACHE MISS');
    api.resetTraining();
    player.x = 400; opponent.x = 480; opponent.state = 'block';
    opponent.lastAttackOutcome = 'whiff'; opponent.attackCooldown = 10;
    player.attack('kick', opponent);
    assert.equal(api.getState().combatCaptionFrames, 0);
    assert.notEqual(api.getState().floatingTexts.at(-1).text, 'CACHE MISS');
    api.resetTraining();
    player.x = 400; opponent.x = 480; opponent.onGround = false; opponent.y -= 20; opponent.hitStun = 10;
    player.attack('punch', opponent);
    assert.equal(api.getState().combatCaptionFrames, 0, 'a juggle is not a new anti-air interception');
    assert.notEqual(api.getState().floatingTexts.at(-1).text, 'NO FLY ZONE');
});

test('KO captures a frozen render snapshot, time results stay distinct and resets release it', () => {
    const { api } = loadGame();
    startPlayingGame(api);
    const { player1, player2 } = api.getState();
    player1.x = 400; player2.x = 480; player1.health = 1; player2.health = 1;
    player1.attack('kick', player2);
    api.captureRoundHighlight(true);
    const snapshot = api.getState().roundHighlight;
    assert.equal(snapshot.key, 'comicLastBit'); assert(snapshot.ko);
    assert.equal(snapshot.fighters[0].state, 'kick');
    assert(!('aiMemory' in snapshot.fighters[1]));
    const frozenX = snapshot.fighters[0].x;
    player1.x = 300; api.draw();
    assert.equal(snapshot.fighters[0].x, frozenX);
    api.startRound(); assert.equal(api.getState().roundHighlight, null);
    api.captureRoundHighlight(true);
    assert.equal(api.getState().roundHighlight.key, 'comicTime');
    assert.equal(api.getState().roundHighlight.ko, false);
    api.startTraining(); api.captureRoundHighlight(true);
    assert.equal(api.getState().roundHighlight, null);
});

test('challenge links round-trip validated configuration and never auto-start or change accessibility', () => {
    const { api } = loadGame({ search: '?seed=4294967295&debug=1' });
    api.setDifficulty('hard'); api.setArena('rooftop'); api.setFighterStyle('technical'); api.setRival('boss500'); api.initGame();
    const url = new URL(api.buildChallengeUrl());
    assert.equal(url.searchParams.get('duel'), api.DUEL_RULES_VERSION);
    assert.equal(url.searchParams.has('debug'), false);
    const loaded = loadGame({ search: url.search, reducedMotionSystem: true });
    loaded.api.applyChallengeFromLocation();
    const s = loaded.api.getState();
    assert.equal(s.gameState, 'menu'); assert.equal(s.selectedArena, 'rooftop'); assert.equal(s.selectedDifficulty, 'hard');
    assert.equal(s.selectedFighterStyle, 'technical'); assert.equal(s.selectedRival, 'boss500'); assert(s.reducedMotionEnabled);
    loaded.api.initGame(); assert.equal(loaded.api.getState().matchSeed, 4294967295);
    for (const [key, value] of [['duel', 'future'], ['seed', '4294967296'], ['seed', '-1'], ['seed', 'NaN'], ['arena', '__proto__'], ['rival', '<script>'], ['mode', 'training']]) {
        const invalid = new URL(url); invalid.searchParams.set(key, value);
        const game = loadGame({ search: invalid.search }); game.api.applyChallengeFromLocation();
        assert.equal(game.api.getChallengeFromLocation(), null, key);
        assert.equal(game.api.getSeedFromLocation(), null, key);
        assert.equal(game.api.getState().selectedArena, 'notebook');
        assert.equal(game.api.getState().gameState, 'menu');
    }
    api.startArcadeRun();
    assert.equal(new URL(api.buildChallengeUrl()).searchParams.get('mode'), 'arcade');
});

test('result card exports locally, shares on demand, preserves cancel and offers manual copy fallback', async () => {
    const { api, context, elements } = loadGame({ search: '?seed=50' });
    startPlayingGame(api); api.finishRound(true); api.finishRound(true);
    assert.equal(api.getState().gameState, 'gameOver');
    assert.equal(api.getState().resultCardFile.type, 'image/png');
    const before = [api.getState().matchElapsedFrames, api.getState().player1.health, api.getState().player2.health];
    api.renderResultCard(); api.downloadResultCard();
    assert.equal(context.downloads[0].download, 'glitch-duel-50.png');
    assert.equal(context.downloads[0].href.startsWith('data:image/png;'), true);
    await api.copyChallengeLink();
    assert.equal(elements.get('challenge-link').hidden, false);
    assert.equal(elements.get('challenge-link').selected, true);
    const calls = [];
    context.navigator.canShare = () => true;
    context.navigator.share = async (payload) => calls.push(payload);
    await api.shareResult();
    assert.equal(calls.length, 1); assert.equal(calls[0].files.length, 1);
    assert.equal(new URL(calls[0].url).searchParams.get('seed'), '50');
    context.navigator.share = async () => { throw Object.assign(new Error(), { name: 'AbortError' }); };
    await api.shareResult(); assert.equal(elements.get('share-status').textContent, api.t('shareCancelled'));
    context.navigator.canShare = () => { throw new Error('unsupported files'); };
    context.navigator.share = async (payload) => calls.push(payload);
    await api.shareResult(); assert.equal(calls.at(-1).files, undefined);
    assert.deepEqual([api.getState().matchElapsedFrames, api.getState().player1.health, api.getState().player2.health], before);
    api.showMainMenu(); assert.equal(api.getState().resultCardFile, null);
    await api.shareResult(); assert.equal(calls.length, 2);
});

test('late result callbacks cannot revive a cleared card or sharing status', async () => {
    const { api, context, elements } = loadGame();
    startPlayingGame(api); api.finishRound(true); api.finishRound(true);
    let completeBlob, completeShare;
    elements.get('result-card').toBlob = (callback) => { completeBlob = callback; };
    api.renderResultCard();
    context.navigator.share = () => new Promise((resolve) => { completeShare = resolve; });
    const pending = api.shareResult();
    api.showMainMenu();
    completeBlob(new Blob(['png'], { type: 'image/png' }));
    completeShare(); await pending;
    assert.equal(api.getState().resultCardFile, null);
    assert.equal(elements.get('share-status').textContent, '');
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

test('combat events expose the stable attackResolved and energyReady schemas', () => {
    const attackCases = [
        { name: 'hit', x: 170, defenderState: 'idle', outcome: 'hit', damageApplied: 8, evadedByCrouch: false },
        { name: 'blocked', x: 170, defenderState: 'block', outcome: 'blocked', damageApplied: 1, evadedByCrouch: false },
        { name: 'whiff', x: 500, defenderState: 'idle', outcome: 'whiff', damageApplied: 0, evadedByCrouch: false },
        { name: 'crouch evade', x: 220, defenderState: 'crouch', outcome: 'whiff', damageApplied: 0, evadedByCrouch: true }
    ];

    for (const expected of attackCases) {
        const { api } = loadGame();
        const attacker = new api.Fighter(100, true);
        const defender = new api.Fighter(expected.x, false);
        defender.state = expected.defenderState;

        attacker.attack('punch', defender);

        assert.deepEqual({ ...api.getState().lastCombatEvent }, {
            type: 'attackResolved',
            frame: 0,
            actor: 'player',
            target: 'cpu',
            attackType: 'punch',
            outcome: expected.outcome,
            damageApplied: expected.damageApplied,
            defenderState: expected.defenderState === 'idle' ? 'standing' : expected.defenderState,
            evadedByCrouch: expected.evadedByCrouch,
            energyBefore: 0,
            energyAfter: expected.outcome === 'whiff' ? 0 : 14,
            sequence: 1
        }, expected.name);
    }

    for (const source of ['hit', 'block', 'damage']) {
        const { api } = loadGame();
        const fighter = new api.Fighter(100, source !== 'damage');
        fighter.energy = 90;
        fighter.gainEnergy(20, source);
        assert.deepEqual({ ...api.getState().lastCombatEvent }, {
            type: 'energyReady', frame: 0, actor: source === 'damage' ? 'cpu' : 'player', source, energyBefore: 90, energyAfter: 100
        }, source);
    }
});

test('invalid attack and energy attempts do not publish combat events', () => {
    const cases = [
        (attacker, defender) => { attacker.attackCooldown = 1; attacker.attack('punch', defender); },
        (attacker, defender) => { attacker.state = 'block'; attacker.attack('punch', defender); },
        (attacker, defender) => { attacker.state = 'crouch'; attacker.attack('kick', defender); },
        (attacker, defender) => attacker.attack('missing', defender),
        (attacker, defender) => attacker.attack('special', defender),
        (attacker) => { attacker.energy = 90; attacker.gainEnergy(20, 'refill'); }
    ];

    cases.forEach((attempt, index) => {
        const { api } = loadGame();
        const attacker = new api.Fighter(100, true);
        const defender = new api.Fighter(170, false);
        api.recordCombatEvent({ type: 'sentinel', index });
        attempt(attacker, defender);
        assert.deepEqual({ ...api.getState().lastCombatEvent }, { type: 'sentinel', index });
    });
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

test('keyboard Tab advances through visible gameplay controls without wrapping', () => {
    const { api, canvas, elements, windowListeners } = loadGame({ storage: { glitchDuelOnboardingSeen: '1' } });
    api.setupKeyboardControls();
    startPlayingGame(api);
    assert.equal(canvas.focused, true);
    const status = elements.get('combat-status-summary');
    const pause = elements.get('pause-button');
    assert.deepEqual(Array.from(api.getGameplayFocusableElements(), (element) => element.id), ['game', 'combat-status-summary', 'pause-button']);

    const forward = dispatchKey(windowListeners, { key: 'Tab', code: 'Tab', target: canvas });
    assert.equal(forward.prevented, true);
    assert.equal(status.focused, true);

    const toPause = dispatchKey(windowListeners, { key: 'Tab', code: 'Tab', target: status });
    assert.equal(toPause.prevented, true);
    assert.equal(pause.focused, true);

    const afterLast = dispatchKey(windowListeners, { key: 'Tab', code: 'Tab', target: pause });
    assert.equal(afterLast.prevented, false);

    const backward = dispatchKey(windowListeners, { key: 'Tab', code: 'Tab', shiftKey: true, target: pause });
    assert.equal(backward.prevented, true);
    assert.equal(status.focused, true);

    canvas.focus();
    const beforeFirst = dispatchKey(windowListeners, { key: 'Tab', code: 'Tab', shiftKey: true, target: canvas });
    assert.equal(beforeFirst.prevented, false);
    const browserShortcut = dispatchKey(windowListeners, { key: 'Tab', code: 'Tab', ctrlKey: true, target: canvas });
    assert.equal(browserShortcut.prevented, false);

    const training = loadGame({ touchPoints: 1, storage: { glitchDuelOnboardingSeen: '1' } });
    training.api.startTraining();
    training.api.skipVsIntro();
    training.api.setupMobileControls();
    const ids = Array.from(training.api.getGameplayFocusableElements(), (element) => element.id);
    assert.deepEqual(ids.slice(0, 3), ['game', 'combat-status-summary', 'pause-button']);
    assert.deepEqual(ids.slice(3, 11), ['btn-left', 'btn-right', 'btn-jump', 'btn-crouch', 'btn-block', 'btn-punch', 'btn-kick', 'btn-special']);
    assert(ids.includes('training-trial-select'));
    assert(ids.includes('training-position-select'));
    assert(ids.includes('training-cpu-select'));
    assert(ids.includes('training-timer-select'));
    assert(ids.includes('training-reset-button'));
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
    const start = context.document.createElement('button');
    const duelDetails = context.document.createElement('details');
    const duelSummary = context.document.createElement('summary');
    const duelSelects = Array.from({ length: 4 }, () => context.document.createElement('select'));
    duelDetails.append(duelSummary, ...duelSelects);
    const arcade = context.document.createElement('button');
    const training = context.document.createElement('button');
    const utilitiesDetails = context.document.createElement('details');
    const utilitiesSummary = context.document.createElement('summary');
    const language = context.document.createElement('select');
    const motion = context.document.createElement('input');
    const help = context.document.createElement('button');
    const controls = context.document.createElement('button');
    const staticStats = context.document.createElement('div');
    const staticControls = context.document.createElement('div');
    const github = context.document.createElement('a');
    github.setAttribute('href', 'https://example.test');
    utilitiesDetails.append(utilitiesSummary, language, motion, help, controls, staticStats, staticControls, github);
    dialog.append(title, start, duelDetails, arcade, training, utilitiesDetails);

    assert.deepEqual([...api.getFocusableElements(dialog)], [start, duelSummary, arcade, training, utilitiesSummary]);

    duelDetails.open = true;
    assert.deepEqual([...api.getFocusableElements(dialog)], [start, duelSummary, ...duelSelects, arcade, training, utilitiesSummary]);

    utilitiesDetails.open = true;
    assert.deepEqual([...api.getFocusableElements(dialog)], [
        start,
        duelSummary,
        ...duelSelects,
        arcade,
        training,
        utilitiesSummary,
        language,
        motion,
        help,
        controls,
        github
    ]);

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
    const { api, context, elements } = loadGame({ storage: { glitchDuelOnboardingSeen: '1' } });
    const utilities = context.document.getElementById('menu-utilities');
    assert.equal(utilities.tagName, 'DETAILS');
    assert.equal(utilities.open, false);
    utilities.open = true;

    api.showControlsScreen();
    assert.equal(api.getState().modalId, 'controls-screen');
    api.handleGamepadEvents({ cancel: true });
    assert.equal(api.getState().modalId, 'main-menu');
    assert.equal(utilities.open, true);
    assert.equal(context.document.activeElement, elements.get('controls-button'));

    api.showHelpScreen();
    api.handleGamepadEvents({ cancel: true });
    assert.equal(api.getState().modalId, 'main-menu');
    assert.equal(utilities.open, true);
    assert.equal(context.document.activeElement, elements.get('help-button'));
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
    const requiredIds = ['game', 'main-menu', 'help-screen', 'controls-screen', 'pause-screen', 'onboarding-screen', 'training-panel', 'training-trial-select', 'training-trial-brief', 'training-trial-progress', 'training-trial-next', 'training-free-options', 'start-button', 'training-button', 'arcade-run-button', 'controls-button', 'arena-select', 'rival-select', 'match-configuration-summary', 'duel-settings', 'menu-utilities'];
    const scripts = ['i18n.js', 'config.js', 'input.js', 'audio.js', 'effects.js', 'ai.js', 'fighter_render.js', 'fighter.js', 'arena_render.js', 'hud_render.js', 'game.js'];
    const { api } = loadGame();
    const openingTagForId = (id) => html.match(new RegExp(`<[^>]+\\bid="${id}"[^>]*>`))[0];
    const detailsBlock = (id) => html.match(new RegExp(`<details id="${id}"[^>]*>([\\s\\S]*?)<\\/details>`))[0];
    const mainMenu = html.slice(html.indexOf('<div id="main-menu"'), html.indexOf('<div id="help-screen"'));
    const duelBlock = detailsBlock('duel-settings');
    const utilitiesBlock = detailsBlock('menu-utilities');

    requiredIds.forEach((id) => assert.match(html, new RegExp(`id="${id}"`)));
    assert.match(html, /<label class="training-trial-picker" for="training-trial-select">/);
    assert.match(html, /<select id="training-trial-select">/);
    assert.deepEqual([...html.matchAll(/<script src="([^"]+)"/g)].map((match) => match[1].split('?')[0]), scripts);
    assert.match(html, /<link rel="stylesheet" href="styles\.css\?v=20260912-duels3">/);
    assert.match(html, /<script src="i18n\.js\?v=20260912-duels3"><\/script>/);
    assert.match(html, /<script src="game\.js\?v=20260912-duels3"><\/script>/);
    assert.match(html, /<option value="glitchCancel" data-i18n="trainingGlitchCancelOption">/);
    assert.doesNotMatch(html, /user-scalable\s*=\s*no/i);
    assert.doesNotMatch(html, /maximum-scale\s*=\s*1(?:\.0)?/i);
    ['arena-shell', 'game-toolbar', 'game-announcer', 'selection-summary', 'menu-footer'].forEach((id) => {
        assert.match(html, new RegExp(`id="${id}"`));
    });
    assert.doesNotMatch(openingTagForId('duel-settings'), /\sopen(?:\s|=|>)/);
    assert.doesNotMatch(openingTagForId('menu-utilities'), /\sopen(?:\s|=|>)/);
    assert.match(duelBlock, /<summary data-i18n="duelSettings">PERSONALIZAR PARTIDA<\/summary>/);
    assert.match(utilitiesBlock, /<summary data-i18n="menuUtilities">AJUSTES, AYUDA Y CONTROLES · ES\/EN<\/summary>/);
    assert.doesNotMatch(duelBlock + utilitiesBlock, /aria-expanded=|role="menu(?:item)?"/);
    assert.match(openingTagForId('start-button'), /aria-describedby="match-configuration-summary"/);
    assert.match(openingTagForId('match-configuration-summary'), /class="match-configuration-summary"/);
    assert.doesNotMatch(openingTagForId('match-configuration-summary'), /role="status"|aria-live=/);
    assert.doesNotMatch(openingTagForId('stats-summary'), /role="status"|aria-live=/);
    ['difficulty-select', 'arena-select', 'style-select', 'rival-select', 'arena-preview', 'selection-summary'].forEach((id) => {
        assert.match(duelBlock, new RegExp(`id="${id}"`));
    });
    assert.doesNotMatch(duelBlock, /id="reduce-motion-toggle"/);
    const utilityOrder = ['language-select', 'reduce-motion-toggle', 'help-button', 'controls-button', 'stats-summary', 'controls-summary'];
    utilityOrder.forEach((id) => assert.match(utilitiesBlock, new RegExp(`id="${id}"`)));
    utilityOrder.slice(1).forEach((id, index) => {
        assert(utilitiesBlock.indexOf(`id="${utilityOrder[index]}"`) < utilitiesBlock.indexOf(`id="${id}"`));
    });
    assert.match(utilitiesBlock, /class="github-link"/);
    assert.doesNotMatch(utilitiesBlock, /id="arcade-run-button"|id="training-button"/);
    const collapsedOrder = ['start-button', 'duel-settings', 'arcade-run-button', 'training-button', 'menu-utilities'];
    collapsedOrder.slice(1).forEach((id, index) => {
        assert(mainMenu.indexOf(`id="${collapsedOrder[index]}"`) < mainMenu.indexOf(`id="${id}"`));
    });
    assert.doesNotMatch(mainMenu, /tabindex="[1-9]\d*"/);
    assert.match(html, /<option value="es" lang="es">Español<\/option>/);
    assert.match(html, /<option value="en" lang="en">English<\/option>/);
    assert.equal(api.I18N.es.duelSettings, 'PERSONALIZAR PARTIDA');
    assert.equal(api.I18N.en.duelSettings, 'CUSTOMIZE MATCH');
    assert.equal(api.I18N.es.menuUtilities, 'AJUSTES, AYUDA Y CONTROLES · ES/EN');
    assert.equal(api.I18N.en.menuUtilities, 'SETTINGS, HELP & CONTROLS · ES/EN');
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

test('Pages workflow validates pull requests and gates deployment on validation', () => {
    const workflow = fs.readFileSync(path.join(__dirname, '..', '.github', 'workflows', 'pages.yml'), 'utf8');

    assert.match(workflow, /^\s*pull_request:\s*$/m);
    assert.match(workflow, /^\s*push:\s*\n\s*branches:\s*\n\s*- main\s*$/m);
    assert.match(workflow, /^\s*deploy:\s*\n\s*needs: validate\s*\n\s*if: github\.event_name != 'pull_request'\s*$/m);
    assert.match(workflow, /run: node --test tests\/game\.test\.js/);
    assert.doesNotMatch(workflow, /uses:\s*[^\s#]+@(?![0-9a-f]{40}(?:\s|$))/);
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
    assert.match(elements.get('instructions').textContent, /ENTRENAMIENTO/);
    assert.match(elements.get('instructions').textContent, /LIBRE/);

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
    assert.equal(special.getAttribute('data-state'), 'special-ready');
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

test('binding storage v2 preserves an empty status binding and rejects invalid payloads', () => {
    const defaults = loadGame().api.getInputBindings();
    const valid = { version: 2, bindings: { ...defaults, left: ['KeyQ'], status: [] } };
    const first = loadGame({ storage: { glitchDuelKeyboardBindings: JSON.stringify(valid) } });
    assert.deepEqual(Array.from(first.api.getInputBindings().status), []);
    assert.equal(first.api.getInputActionForCode('KeyQ'), 'left');

    assert.equal(first.api.setInputBinding('left', 0, 'KeyZ').ok, true);
    const saved = first.context.window.localStorage.getItem('glitchDuelKeyboardBindings');
    const reloaded = loadGame({ storage: { glitchDuelKeyboardBindings: saved } });
    assert.deepEqual(Array.from(reloaded.api.getInputBindings().status), []);
    assert.equal(reloaded.api.getInputActionForCode('KeyZ'), 'left');

    const invalidPayloads = [
        { version: 2, bindings: { left: ['KeyQ'], status: [] } },
        { version: 99, bindings: defaults },
        '{malformed'
    ];
    for (const payload of invalidPayloads) {
        const value = typeof payload === 'string' ? payload : JSON.stringify(payload);
        const game = loadGame({ storage: { glitchDuelKeyboardBindings: value } });
        assert.equal(game.api.getInputActionForCode('KeyA'), 'left');
        assert.equal(game.api.getInputActionForCode('KeyQ'), null);
        assert.deepEqual(Array.from(game.api.getInputBindings().status), ['Digit0']);
    }
});

test('binding storage falls back when getItem or setItem throws', () => {
    const unreadable = loadGame({
        storageGetThrows: true,
        storage: { glitchDuelKeyboardBindings: JSON.stringify({ version: 2, bindings: {} }) }
    });
    assert.equal(unreadable.api.getInputActionForCode('KeyJ'), 'punch');

    const unwritable = loadGame({ storageSetThrows: true });
    assert.doesNotThrow(() => unwritable.api.setInputBinding('punch', 0, 'KeyQ'));
    assert.equal(unwritable.api.getInputActionForCode('KeyQ'), 'punch');
    assert.equal(unwritable.api.getInputActionForCode('KeyJ'), null);
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

test('match configuration summary derives localized values from every selection setter', () => {
    const { api, context } = loadGame();
    const summary = context.document.getElementById('match-configuration-summary');

    api.renderLanguage();
    assert.equal(summary.textContent, 'Dificultad: NORMAL · Arena: CUADERNO · Estilo: BALANCEADO · Rival: NULL POINTER');

    api.setDifficulty('hard');
    assert.equal(summary.textContent, 'Dificultad: DIFICIL · Arena: CUADERNO · Estilo: BALANCEADO · Rival: NULL POINTER');

    api.setArena('meeting');
    assert.equal(summary.textContent, 'Dificultad: DIFICIL · Arena: REUNION PRESENCIAL · Estilo: BALANCEADO · Rival: NULL POINTER');

    api.setFighterStyle('technical');
    assert.equal(summary.textContent, 'Dificultad: DIFICIL · Arena: REUNION PRESENCIAL · Estilo: TECNICO · Rival: NULL POINTER');

    api.setRival('mergeConflict');
    assert.equal(summary.textContent, 'Dificultad: DIFICIL · Arena: REUNION PRESENCIAL · Estilo: TECNICO · Rival: MERGE CONFLICT');

    api.setLanguage('en');
    assert.equal(summary.textContent, 'Difficulty: HARD · Arena: IN-PERSON MEETING · Style: TECHNICAL · Rival: MERGE CONFLICT');
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

test('health and timer warnings announce once per round and only round reset rearms them', () => {
    const { api, elements } = loadGame({ storage: { glitchDuelOnboardingSeen: '1' } });
    api.startTraining();
    api.skipVsIntro();
    api.update();
    const announcer = elements.get('game-announcer');
    const state = api.getState();

    state.player1.health = 30;
    api.updateCombatStatusThresholds();
    assert.match(announcer.textContent, /peligro/i);
    api.refillTraining('health');
    announcer.textContent = 'health-marker';
    state.player1.health = 30;
    api.updateCombatStatusThresholds();
    assert.equal(announcer.textContent, 'health-marker');

    api.setTrainingTimer('on');
    api.setRoundTimeMs(10000);
    api.updateCombatStatusThresholds();
    assert.match(announcer.textContent, /10/);
    announcer.textContent = 'ten-marker';
    api.updateCombatStatusThresholds();
    assert.equal(announcer.textContent, 'ten-marker');
    api.setRoundTimeMs(5000);
    api.updateCombatStatusThresholds();
    assert.match(announcer.textContent, /5/);
    announcer.textContent = 'five-marker';
    api.updateCombatStatusThresholds();
    assert.equal(announcer.textContent, 'five-marker');

    api.startRound();
    api.skipVsIntro();
    const nextRound = api.getState();
    nextRound.player1.health = 30;
    api.setRoundTimeMs(5000);
    announcer.textContent = 'round-marker';
    api.update();
    assert.match(announcer.textContent, /peligro/i);
    assert.match(announcer.textContent, /10/);
    assert.match(announcer.textContent, /5/);
});

test('training trials use explicit selectors, session progress, and four reducers', () => {
    const { api, context, elements } = loadGame({ storage: { glitchDuelOnboardingSeen: '1' } });
    api.startTraining();
    api.setTrainingTrial('combos');
    let state = api.getState();
    assert.equal(state.activeTrialId, 'combos');
    assert.equal(elements.get('training-free-options').disabled, true);

    api.recordCombatEvent({ type: 'attackResolved', actor: 'player', target: 'cpu', attackType: 'comboPunch', outcome: 'whiff', damageApplied: 0, sequence: 1 });
    assert.equal(api.getState().trialState.completed, false);
    ['comboPunch', 'comboKick', 'backKick'].forEach((attackType, index) => {
        api.recordCombatEvent({ type: 'attackResolved', actor: 'player', target: 'cpu', attackType, outcome: 'hit', damageApplied: 1, sequence: index + 2 });
    });
    assert.equal(api.getState().trialState.completed, true);
    assert.equal(api.getState().stats.wins, 0);
    assert.equal(api.getMatchHistory().length, 0);

    api.setTrainingTrial('crouchPunish');
    api.recordCombatEvent({ type: 'attackResolved', actor: 'cpu', target: 'player', attackType: 'punch', outcome: 'whiff', evadedByCrouch: true, damageApplied: 0, sequence: 1 });
    assert.equal(api.getState().trialState.phase, 'window');
    api.recordCombatEvent({ type: 'attackResolved', actor: 'player', target: 'cpu', attackType: 'punch', outcome: 'hit', damageApplied: 1, sequence: 1 });
    assert.equal(api.getState().trialState.completed, true);

    api.setTrainingTrial('blockCounter');
    api.recordCombatEvent({ type: 'attackResolved', actor: 'cpu', target: 'player', attackType: 'kick', outcome: 'blocked', damageApplied: 0, sequence: 1 });
    assert.equal(api.getState().trialState.phase, 'window');
    api.recordCombatEvent({ type: 'attackResolved', actor: 'player', target: 'cpu', attackType: 'punch', outcome: 'hit', damageApplied: 1, sequence: 1 });
    assert.equal(api.getState().trialState.completed, true);

    api.setTrainingTrial('specialSpend');
    api.recordCombatEvent({ type: 'energyReady', actor: 'player', source: 'hit', energyBefore: 90, energyAfter: 100 });
    assert.equal(api.getState().trialState.energyReady, true);
    api.recordCombatEvent({ type: 'attackResolved', actor: 'player', target: 'cpu', attackType: 'special', outcome: 'whiff', damageApplied: 0, energyBefore: 100, energyAfter: 0, sequence: 1 });
    assert.equal(api.getState().trialState.completed, true);

    api.setTrainingTrial('free');
    state = api.getState();
    assert.equal(state.activeTrialId, 'free');
    assert.equal(elements.get('training-free-options').disabled, false);
    assert.equal(context.window.localStorage.getItem('glitchDuelTrainingTrials'), null);
});

test('special-spend trial requires combat-earned energy and real special cost values', () => {
    const { api } = loadGame({ storage: { glitchDuelOnboardingSeen: '1' } });
    api.startTraining();
    api.setTrainingTrial('specialSpend');

    api.recordCombatEvent({ type: 'attackResolved', actor: 'player', target: 'cpu', attackType: 'special', outcome: 'whiff', energyBefore: 100, energyAfter: 0 });
    assert.equal(api.getState().trialState.completed, false);
    api.recordCombatEvent({ type: 'energyReady', actor: 'player', source: 'hit', energyBefore: 80, energyAfter: 100 });
    api.recordCombatEvent({ type: 'attackResolved', actor: 'player', target: 'cpu', attackType: 'special', outcome: 'whiff', energyBefore: 100, energyAfter: 0 });
    assert.equal(api.getState().trialState.completed, true);
});

test('training trial reducers consume real Fighter attack and energy events', () => {
    const crouchCase = loadGame({ storage: { glitchDuelOnboardingSeen: '1' } });
    crouchCase.api.startTraining();
    crouchCase.api.setTrainingTrial('crouchPunish');
    let state = crouchCase.api.getState();
    state.player1.state = 'crouch';
    state.player2.attack('punch', state.player1);
    assert.equal(state.player2.lastAttackOutcome, 'whiff');
    assert.equal(crouchCase.api.getState().trialState.phase, 'window');
    state.player1.state = 'idle';
    state.player1.attack('punch', state.player2);
    assert.equal(crouchCase.api.getState().trialState.completed, true);

    const blockCase = loadGame({ storage: { glitchDuelOnboardingSeen: '1' } });
    blockCase.api.startTraining();
    blockCase.api.setTrainingTrial('blockCounter');
    state = blockCase.api.getState();
    state.player1.state = 'block';
    state.player2.attack('kick', state.player1);
    assert.equal(state.player2.lastAttackOutcome, 'blocked');
    assert.equal(blockCase.api.getState().trialState.phase, 'window');
    state.player1.state = 'idle';
    state.player1.attack('punch', state.player2);
    assert.equal(blockCase.api.getState().trialState.completed, true);

    const specialCase = loadGame({ storage: { glitchDuelOnboardingSeen: '1' } });
    specialCase.api.startTraining();
    specialCase.api.setTrainingTrial('specialSpend');
    state = specialCase.api.getState();
    state.player1.gainEnergy(20, 'hit');
    state.player1.attack('special', state.player2);
    assert.equal(state.player1.lastAttackOutcome, 'hit');
    assert.equal(specialCase.api.getState().trialState.completed, true);
});

test('trial cue, response window, and retry clocks honor exact tick and pause boundaries', () => {
    for (const { trial, action } of [
        { trial: 'crouchPunish', action: 'crouch' },
        { trial: 'blockCounter', action: 'block' }
    ]) {
        const { api } = loadGame({ storage: { glitchDuelOnboardingSeen: '1' } });
        api.startTraining();
        api.setTrainingTrial(trial);
        api.skipVsIntro();
        api.setInputSource(`test:${action}`, action, true);
        advanceFrames(api, 59);
        assert.deepEqual(
            { phase: api.getState().trialState.phase, cueTicks: api.getState().trialState.cueTicks },
            { phase: 'cue', cueTicks: 59 },
            trial
        );

        api.pauseGame();
        api.advanceSimulation(1000);
        assert.equal(api.getState().trialState.cueTicks, 59, `${trial} paused cue`);
        api.resumeGame();
        api.setInputSource(`test:${action}`, action, true);
        api.update();
        assert.equal(api.getState().trialState.phase, 'window', `${trial} cue tick 60`);
    }

    const { api } = loadGame({ storage: { glitchDuelOnboardingSeen: '1' } });
    api.startTraining();
    api.setTrainingTrial('crouchPunish');
    api.skipVsIntro();
    api.recordCombatEvent({ type: 'attackResolved', actor: 'cpu', target: 'player', attackType: 'punch', outcome: 'whiff', evadedByCrouch: true });
    advanceFrames(api, 44);
    assert.deepEqual(
        { phase: api.getState().trialState.phase, windowTicks: api.getState().trialState.windowTicks },
        { phase: 'window', windowTicks: 44 }
    );

    api.pauseGame();
    api.advanceSimulation(1000);
    assert.equal(api.getState().trialState.windowTicks, 44);
    api.resumeGame();
    api.update();
    assert.deepEqual(
        { phase: api.getState().trialState.phase, retryTicksRemaining: api.getState().trialState.retryTicksRemaining, failureReason: api.getState().trialState.failureReason },
        { phase: 'retry', retryTicksRemaining: 120, failureReason: 'timeout' }
    );

    advanceFrames(api, 119);
    assert.equal(api.getState().trialState.retryTicksRemaining, 1);
    api.pauseGame();
    api.advanceSimulation(1000);
    assert.equal(api.getState().trialState.retryTicksRemaining, 1);
    api.resumeGame();
    api.update();
    assert.deepEqual(
        { phase: api.getState().trialState.phase, cueTicks: api.getState().trialState.cueTicks, retryTicksRemaining: api.getState().trialState.retryTicksRemaining },
        { phase: 'cue', cueTicks: 0, retryTicksRemaining: 0 }
    );
});

test('block-counter trial trace is equivalent at 30, 60, and 120 FPS', () => {
    function run(fps) {
        const { api } = loadGame({ storage: { glitchDuelOnboardingSeen: '1' } });
        api.startTraining();
        api.setTrainingTrial('blockCounter');
        api.skipVsIntro();
        api.setInputSource('test:block', 'block', true);
        for (let frame = 0; frame < fps; frame++) api.advanceSimulation(1000 / fps);
        assert.equal(api.getState().trialState.phase, 'window');

        api.clearInputSource('test:block');
        api.setInputSource('test:punch', 'punch', true);
        for (let frame = 0; frame < fps / 5; frame++) api.advanceSimulation(1000 / fps);
        const state = api.getState();
        return {
            phase: state.trialState.phase,
            completed: state.trialState.completed,
            playerHealth: state.player1.health,
            playerEnergy: state.player1.energy,
            cpuHealth: state.player2.health,
            playerAttack: state.player1.lastAttackType,
            playerSequence: state.player1.attackSequence,
            elapsed: state.matchElapsedFrames
        };
    }

    const traces = [30, 60, 120].map(run);
    assert.equal(traces[0].completed, true);
    assert.deepEqual(traces[0], traces[1]);
    assert.deepEqual(traces[1], traces[2]);
});

test('glitch cancel core enforces cost, whiff, attack, grounded, actor, and post-decrement boundaries', () => {
    function run({ type = 'punch', outcome = 'whiff', cooldown = 2, energy = 25, grounded = true, player = true } = {}) {
        const { api } = loadGame();
        const fighter = new api.Fighter(100, player);
        const opponent = new api.Fighter(500, !player);
        fighter.glitchCancelEnabled = true;
        fighter.lastAttackType = type;
        fighter.lastAttackOutcome = outcome;
        fighter.attackCooldown = cooldown;
        fighter.energy = energy;
        fighter.onGround = grounded;
        fighter.state = type;
        fighter.update({ special: true }, opponent);
        return { fighter, opponent };
    }

    assert.equal(apiCost(), 25);
    function apiCost() {
        return loadGame().api.GLITCH_CANCEL_ENERGY_COST;
    }

    for (const type of ['punch', 'kick']) {
        for (const energy of [25, 26, 99, 100]) {
            const { fighter, opponent } = run({ type, energy });
            assert.equal(fighter.energy, energy - 25, `${type}/${energy}`);
            assert.equal(fighter.attackCooldown, 0, `${type}/${energy}`);
            assert.equal(fighter.state, 'idle', `${type}/${energy}`);
            assert.equal(fighter.glitchCancelUsed, true, `${type}/${energy}`);
            assert.equal(fighter.glitchCancelFeedbackFrames, 10, `${type}/${energy}`);
            assert.equal(opponent.health, 100, `${type}/${energy}`);
        }
    }

    const insufficient = run({ energy: 24 }).fighter;
    assert.equal(insufficient.energy, 24);
    assert.equal(insufficient.attackCooldown, 1);
    assert.equal(insufficient.glitchCancelUsed, false);

    const finalTickLowEnergy = run({ cooldown: 1, energy: 25 }).fighter;
    assert.equal(finalTickLowEnergy.energy, 25);
    assert.equal(finalTickLowEnergy.attackCooldown, 0);
    assert.equal(finalTickLowEnergy.lastAttackType, 'punch');

    const finalTickFullEnergy = run({ cooldown: 1, energy: 100 }).fighter;
    assert.equal(finalTickFullEnergy.energy, 0);
    assert.equal(finalTickFullEnergy.lastAttackType, 'special');
    assert.equal(finalTickFullEnergy.attackCooldown, 45);

    for (const invalid of [
        { outcome: 'hit' },
        { outcome: 'blocked' },
        { type: 'comboPunch' },
        { type: 'comboKick' },
        { type: 'backKick' },
        { type: 'special' },
        { type: 'airPunch', grounded: false },
        { type: 'airKick', grounded: false },
        { player: false }
    ]) {
        const fighter = run({ ...invalid, energy: 25 }).fighter;
        assert.equal(fighter.energy, 25, JSON.stringify(invalid));
        assert.equal(fighter.glitchCancelUsed, false, JSON.stringify(invalid));
    }
});

test('glitch cancel costs 25 for every style without changing records or match awards', () => {
    for (const style of ['balanced', 'fast', 'heavy', 'technical']) {
        const { api } = loadGame({ storage: { glitchDuelOnboardingSeen: '1' } });
        api.setFighterStyle(style);
        api.startTraining();
        api.setTrainingTrial('glitchCancel');
        api.skipVsIntro();
        const state = api.getState();
        const beforeStats = { ...state.stats };
        const beforeMatchStats = { ...state.matchStats };
        const beforeMedal = api.getPostMatchMedal(true).id;
        state.player2.x = 800;
        state.player1.attack('punch', state.player2);

        assert.equal(state.player1.tryGlitchCancel(), true, style);
        assert.equal(state.player1.energy, 75, style);
        assert.deepEqual({ ...api.getState().stats }, beforeStats, style);
        assert.deepEqual({ ...api.getState().matchStats }, beforeMatchStats, style);
        assert.equal(api.getMatchHistory().length, 0, style);
        assert.equal(api.getPostMatchMedal(true).id, beforeMedal, style);
    }
});

test('special-spend trial cannot use a 25-energy cancel and long frames spend a cancel once', () => {
    const specialSpend = loadGame({ storage: { glitchDuelOnboardingSeen: '1' } });
    specialSpend.api.startTraining();
    specialSpend.api.setTrainingTrial('specialSpend');
    specialSpend.api.skipVsIntro();
    let state = specialSpend.api.getState();
    state.player1.energy = 100;
    state.player2.x = 800;
    state.player1.attack('punch', state.player2);
    specialSpend.api.setInputSource('test:special', 'special', true);
    specialSpend.api.update();
    assert.equal(state.player1.energy, 100);
    assert.equal(state.player1.glitchCancelUsed, false);
    assert.equal(state.trialState.completed, false);

    const capped = loadGame({ storage: { glitchDuelOnboardingSeen: '1' } });
    state = prepareGlitchCancelInputCase(capped.api);
    capped.api.setInputSource('test:special', 'special', true);
    capped.api.advanceSimulation(1000);
    assert.equal(state.player1.energy, 75);
    assert.equal(capped.api.getState().trialState.phase, 'followup');
    capped.api.advanceSimulation(1000);
    assert.equal(state.player1.energy, 75);
});

test('glitch cancel has exact pending, simultaneous-input, posture, and one-use sequence precedence', () => {
    const { api } = loadGame();
    const player = new api.Fighter(100, true);
    const opponent = new api.Fighter(500, false);
    Object.assign(player, {
        glitchCancelEnabled: true,
        lastAttackType: 'punch',
        lastAttackOutcome: 'whiff',
        attackCooldown: 2,
        energy: 50,
        state: 'punch',
        pendingComboInput: 'kick',
        comboBuffer: ['punch'],
        comboTimer: 10,
        comboHintText: 'hint',
        comboHintTimer: 10
    });

    player.update({ special: true, punch: true, kick: true, right: true }, opponent);
    assert.equal(player.energy, 25);
    assert.equal(player.attackCooldown, 0);
    assert.equal(player.pendingComboInput, '');
    assert.deepEqual(Array.from(player.comboBuffer), []);
    assert.equal(player.comboHintText, '');
    assert.equal(player.velX, 0);
    assert.equal(player.attackSequence, 0);

    player.attackCooldown = 2;
    player.lastAttackType = 'punch';
    player.lastAttackOutcome = 'whiff';
    assert.equal(player.tryGlitchCancel(), false);
    assert.equal(player.energy, 25);
    assert.equal(player.glitchCancelUsed, true);

    player.attackCooldown = 0;
    player.update({}, opponent);
    assert.equal(player.glitchCancelUsed, false);
    player.update({ punch: true }, opponent);
    assert.equal(player.lastAttackType, 'punch');
    assert.equal(player.attackSequence, 1);

    for (const action of ['block', 'jump']) {
        const sample = new api.Fighter(100, true);
        Object.assign(sample, { glitchCancelEnabled: true, lastAttackType: 'kick', lastAttackOutcome: 'whiff', attackCooldown: 2, energy: 25, state: 'kick' });
        sample.update({ [action]: true, special: true }, opponent);
        assert.equal(sample.energy, 25, action);
        assert.equal(sample.glitchCancelUsed, false, action);
    }

    const crouch = new api.Fighter(100, true);
    Object.assign(crouch, { glitchCancelEnabled: true, lastAttackType: 'kick', lastAttackOutcome: 'whiff', attackCooldown: 1, energy: 25, state: 'kick' });
    crouch.update({ crouch: true, special: true }, opponent);
    assert.equal(crouch.state, 'crouch');
    assert.equal(crouch.energy, 25);

    const pending = new api.Fighter(100, true);
    Object.assign(pending, { glitchCancelEnabled: true, lastAttackType: 'punch', lastAttackOutcome: 'whiff', attackCooldown: 1, energy: 100, state: 'punch', pendingComboInput: 'kick', comboBuffer: ['punch'], comboTimer: 10 });
    pending.update({ special: true }, opponent);
    assert.equal(pending.lastAttackType, 'comboKick');
    assert.equal(pending.energy, 100);
});

test('glitch cancel is enabled only by the experimental training trial and resets without entering n/4', () => {
    const { api } = loadGame({ storage: { glitchDuelOnboardingSeen: '1' } });
    api.startTraining();
    api.setTrainingTrial('glitchCancel');
    api.skipVsIntro();
    let state = api.getState();
    assert.equal(state.activeTrialId, 'glitchCancel');
    assert.equal(state.player1.x, 440);
    assert.equal(state.player2.x, 660);
    assert.equal(state.player1.energy, 100);
    assert.equal(state.player1.glitchCancelEnabled, true);
    assert.equal(state.player2.glitchCancelEnabled, false);

    state.player2.x = 800;
    state.player1.attack('punch', state.player2);
    assert.equal(api.getState().trialState.phase, 'cancel');
    assert.equal(state.player1.tryGlitchCancel(), true);
    assert.equal(api.getState().trialState.phase, 'followup');
    state.player2.x = 530;
    state.player1.energy = 100;
    state.player1.attack('special', state.player2);
    assert.equal(api.getState().trialState.completed, false);
    state.player1.attackCooldown = 0;
    state.player1.attack('punch', state.player2);
    assert.equal(api.getState().trialState.completed, true);
    assert.match(api.getState().trialState.id, /glitchCancel/);

    api.resetTraining();
    state = api.getState();
    assert.equal(state.trialState.completed, false);
    assert.equal(state.trialState.phase, 'active');
    assert.equal(state.player1.glitchCancelUsed, false);
    assert.equal(state.player1.glitchCancelFeedbackFrames, 0);
    assert.equal(state.player1.lastAttackOutcome, '');

    api.setTrainingTrial('specialSpend');
    assert.equal(api.getState().player1.glitchCancelEnabled, false);
    api.setTrainingTrial('free');
    assert.equal(api.getState().player1.glitchCancelEnabled, false);
    api.initGame();
    assert.equal(api.getState().player1.glitchCancelEnabled, false);
    api.startArcadeRun();
    assert.equal(api.getState().player1.glitchCancelEnabled, false);
});

test('glitch cancel touch, canvas, status, i18n, reduced-motion, and audio feedback remain accessible', () => {
    const normal = loadGame({ touchPoints: 1, storage: { glitchDuelOnboardingSeen: '1' } });
    normal.api.startTraining();
    normal.api.setTrainingTrial('glitchCancel');
    normal.api.skipVsIntro();
    normal.api.setupMobileControls();
    normal.api.update();
    const player = normal.api.getState().player1;
    Object.assign(player, { lastAttackType: 'punch', lastAttackOutcome: 'whiff', attackCooldown: 2, energy: 25, state: 'punch' });
    normal.api.renderTouchSpecialState();
    const button = normal.elements.get('btn-special');
    assert.equal(normal.api.getSpecialActionState(player), 'cancel-ready');
    assert.equal(button.getAttribute('data-state'), 'cancel-ready');
    assert.equal(button.getAttribute('aria-disabled'), 'false');
    assert.match(button.getAttribute('aria-label'), /CANCEL 25/);
    normal.api.renderCombatStatus();
    assert.match(normal.elements.get('combat-status-details').children[7].textContent, /GLITCH CANCEL/);

    normal.api.draw();
    assert(normal.api.getState().textCalls.includes('CANCEL 25'));
    button.listeners.click({ preventDefault() {} });
    normal.api.update();
    assert.equal(player.energy, 0);
    normal.api.renderTouchSpecialState();
    assert.equal(button.getAttribute('data-state'), 'charging');
    assert.match(normal.api.getState().announcerText, /GLITCH CANCEL/);
    normal.api.renderCombatStatus();
    assert.match(normal.elements.get('combat-status-details').children[7].textContent, /no disponible/);
    assert(normal.audioEvents.some((event) => event.event === 'start' && event.type === 'square' && event.frequency === 820));

    const reduced = loadGame({ reducedMotionSystem: true });
    const reducedPlayer = new reduced.api.Fighter(100, true);
    const reducedOpponent = new reduced.api.Fighter(500, false);
    Object.assign(reducedPlayer, { glitchCancelEnabled: true, lastAttackType: 'punch', lastAttackOutcome: 'whiff', attackCooldown: 2, energy: 25, state: 'punch' });
    reducedPlayer.update({ special: true }, reducedOpponent);
    assert.deepEqual(
        [reducedPlayer.energy, reducedPlayer.attackCooldown, reducedPlayer.glitchCancelUsed, reducedPlayer.lastAttackOutcome, reducedOpponent.health],
        [0, 0, true, 'whiff', 100]
    );
    normal.api.setLanguage('en');
    assert.equal(normal.api.t('glitchCancelReadyShort'), 'CANCEL 25');

    const pending = new normal.api.Fighter(100, true);
    Object.assign(pending, { energy: 100, attackCooldown: 1, pendingComboInput: 'kick', comboBuffer: ['punch'], comboTimer: 1 });
    assert.equal(normal.api.getSpecialActionState(pending), 'special-ready');
    pending.comboTimer = 2;
    assert.equal(normal.api.getSpecialActionState(pending), 'charging');
});

test('default and remapped keyboard Special events perform the training glitch cancel', () => {
    for (const { code, key, remap } of [
        { code: 'KeyL', key: 'l', remap: false },
        { code: 'KeyQ', key: 'q', remap: true }
    ]) {
        const { api, canvas, windowListeners } = loadGame({ storage: { glitchDuelOnboardingSeen: '1' } });
        if (remap) assert.equal(api.setInputBinding('special', 0, code).ok, true);
        api.setupKeyboardControls();
        const state = prepareGlitchCancelInputCase(api);

        const event = dispatchKey(windowListeners, { code, key, target: canvas });
        assert.equal(event.prevented, true, code);
        assert.equal(api.getInputSnapshot().special, true, code);
        api.update();

        assert.equal(state.player1.energy, 75, code);
        assert.equal(state.player1.glitchCancelUsed, true, code);
        assert.equal(api.getState().trialState.phase, 'followup', code);
        windowListeners.keyup({ code, key, target: canvas });
        assert.equal(api.getInputSnapshot().special, false, code);
    }
});

test('touch Special performs the training glitch cancel and releases on cancellation or capture loss', () => {
    for (const releaseType of ['pointercancel', 'lostpointercapture']) {
        const { api, elements } = loadGame({ touchPoints: 1, storage: { glitchDuelOnboardingSeen: '1' } });
        const state = prepareGlitchCancelInputCase(api);
        api.setupMobileControls();
        const special = elements.get('btn-special');
        const pointer = { pointerId: 7, pointerType: 'touch', button: 0, target: special, preventDefault() {} };

        special.listeners.pointerdown(pointer);
        assert.equal(api.getInputSnapshot().special, true, releaseType);
        assert.equal(api.getState().activePointerCount, 1, releaseType);
        api.update();
        assert.equal(state.player1.energy, 75, releaseType);
        assert.equal(api.getState().trialState.phase, 'followup', releaseType);

        special.listeners[releaseType](pointer);
        assert.equal(api.getInputSnapshot().special, false, releaseType);
        assert.equal(api.getState().activePointerCount, 0, releaseType);
        api.update();
        assert.equal(state.player1.energy, 75, releaseType);
    }
});

test('standard gamepad button 3 performs the training glitch cancel after a neutral sample', () => {
    const buttons = Array.from({ length: 16 }, () => ({ pressed: false, value: 0 }));
    const pad = { mapping: 'standard', buttons, axes: [0, 0] };
    const { api } = loadGame({ getGamepads: () => [pad], storage: { glitchDuelOnboardingSeen: '1' } });
    const state = prepareGlitchCancelInputCase(api);

    api.pollInputGamepads();
    assert.equal(api.getInputSnapshot().special, false);
    buttons[3].pressed = true;
    api.pollInputGamepads();
    assert.equal(api.getInputSnapshot().special, true);
    api.update();

    assert.equal(state.player1.energy, 75);
    assert.equal(state.player1.glitchCancelUsed, true);
    assert.equal(api.getState().trialState.phase, 'followup');
    api.pollInputGamepads();
    api.update();
    assert.equal(state.player1.energy, 75);
});

test('simultaneous keyboard and touch Special sources spend glitch cancel energy once', () => {
    const { api, canvas, elements, windowListeners } = loadGame({ touchPoints: 1, storage: { glitchDuelOnboardingSeen: '1' } });
    api.setupKeyboardControls();
    const state = prepareGlitchCancelInputCase(api);
    api.setupMobileControls();
    const special = elements.get('btn-special');
    const pointer = { pointerId: 9, pointerType: 'touch', button: 0, target: special, preventDefault() {} };

    dispatchKey(windowListeners, { code: 'KeyL', key: 'l', target: canvas });
    special.listeners.pointerdown(pointer);
    api.update();
    assert.equal(state.player1.energy, 75);
    assert.equal(api.getState().trialState.phase, 'followup');

    special.listeners.pointerup(pointer);
    assert.equal(api.getInputSnapshot().special, true);
    api.update();
    assert.equal(state.player1.energy, 75);
    windowListeners.keyup({ code: 'KeyL', key: 'l', target: canvas });
    api.update();
    assert.equal(state.player1.energy, 75);
});

test('click-only Special fallback following pointer activation does not double-spend', () => {
    const { api, elements } = loadGame({ touchPoints: 1, storage: { glitchDuelOnboardingSeen: '1' } });
    const state = prepareGlitchCancelInputCase(api);
    api.setupMobileControls();
    const special = elements.get('btn-special');
    const pointer = { pointerId: 11, pointerType: 'touch', button: 0, target: special, preventDefault() {} };

    special.listeners.pointerdown(pointer);
    api.update();
    assert.equal(state.player1.energy, 75);
    special.listeners.pointerup(pointer);
    special.listeners.click({ preventDefault() {} });
    assert.equal(api.getInputSnapshot().special, false);

    api.update();
    assert.equal(state.player1.energy, 75);
    api.update();
    assert.equal(api.getInputSnapshot().special, false);
    assert.equal(state.player1.energy, 75);
});

test('click-only Special fallback is discarded while the simulation is frozen', () => {
    const { api, elements } = loadGame({ touchPoints: 1, storage: { glitchDuelOnboardingSeen: '1' } });
    api.startTraining();
    api.setTrainingTrial('glitchCancel');
    api.setupMobileControls();
    const state = api.getState();
    const special = elements.get('btn-special');

    special.listeners.click({ preventDefault() {} });
    assert.equal(api.getInputSnapshot().special, true);
    api.update();
    assert.equal(api.getInputSnapshot().special, false);

    api.skipVsIntro();
    api.update();
    assert.equal(state.player1.energy, 100);
    assert.equal(state.player1.lastAttackType, '');
});

test('input-aware onboarding preserves the requested mode through complete and skip', () => {
    const training = loadGame();
    training.api.requestStartMode('training');
    assert.equal(training.api.getState().gameState, 'menu');
    assert.equal(training.api.getState().pendingStartMode, 'training');
    assert.equal(training.elements.get('onboarding-title').focused, true);
    training.api.completeOnboarding(true);
    assert.equal(training.api.getState().gameMode, 'training');
    assert.equal(training.api.getState().pendingStartMode, null);

    const arcade = loadGame();
    arcade.api.requestStartMode('arcade');
    arcade.api.completeOnboarding(false);
    assert.equal(arcade.api.getState().gameMode, 'arcade');
    assert.equal(arcade.api.getState().gameState, 'playing');

    const seen = loadGame({ storage: { glitchDuelOnboardingSeen: '1' } });
    seen.api.requestStartMode('training');
    assert.equal(seen.api.getState().gameMode, 'training');
    assert.equal(seen.api.getState().onboardingScreenDisplay, 'none');
});

test('input guidance keeps all methods visible and distinguishes recent from manual selection', () => {
    const { api, elements } = loadGame();
    api.renderInputGuidance('help');
    assert.equal(api.getState().recentInputMethod, null);
    assert.match(elements.get('help-guidance-status').textContent, /Sin método/);

    api.setGuidanceInputMethod('gamepad');
    assert.equal(api.getState().guidanceInputMethod, 'gamepad');
    assert.match(elements.get('help-guidance-status').textContent, /seleccionada/i);
    assert.equal(elements.get('help-guide-gamepad-marker').textContent, 'SELECCIONADO');

    api.recordRecentInputMethod('touch');
    assert.equal(api.getState().recentInputMethod, 'touch');
    assert.match(elements.get('help-guidance-status').textContent, /recientemente/i);
    assert.match(elements.get('help-guide-touch-marker').textContent, /USADO RECIENTEMENTE/);
    assert.match(elements.get('help-guide-gamepad-marker').textContent, /SELECCIONADO/);
});

test('onboarding guidance focuses the title after each step without persistence', () => {
    const { api, elements, context } = loadGame();
    api.requestStartMode('versus');
    api.setupOnboarding();
    const next = elements.get('onboarding-next-button');
    next.listeners.click();
    assert.equal(elements.get('onboarding-title').focused, true);
    api.setGuidanceInputMethod('touch');
    assert.match(elements.get('onboarding-text').textContent, /Mantén/);
    assert.equal(context.window.localStorage.getItem('glitchDuelInputMethod'), null);
});

test('recent input records real touch and gamepad edges but not neutral capability', () => {
    const touch = loadGame();
    touch.api.setupMobileControls();
    const trainingButton = touch.elements.get('training-button');
    trainingButton.listeners.pointerdown({ pointerType: 'mouse', target: trainingButton });
    assert.equal(touch.api.getState().recentInputMethod, null);
    trainingButton.listeners.pointerdown({ pointerType: 'touch', target: trainingButton });
    assert.equal(touch.api.getState().recentInputMethod, 'touch');

    const buttons = Array.from({ length: 16 }, () => ({ pressed: false, value: 0 }));
    let pad = { mapping: 'standard', buttons, axes: [0, 0] };
    const gamepad = loadGame({ getGamepads: () => [pad] });
    gamepad.api.pollInputGamepads();
    assert.equal(gamepad.api.getState().recentInputMethod, null);
    buttons[0].pressed = true;
    pad = { mapping: 'standard', buttons, axes: [0, 0] };
    gamepad.api.pollInputGamepads();
    assert.equal(gamepad.api.getState().recentInputMethod, 'gamepad');
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
    assert.equal(on.api.getDebugData().metrics.samples, 0);
    on.api.gameLoop(1000);
    let metrics = on.api.getDebugData().metrics;
    assert.equal(metrics.samples, 1);
    assert.equal(metrics.frameClampDiscardMs, 900);
    assert.equal(metrics.maxStepsPerFrame, 6);
    assert.equal(metrics.deviceDpr, 2);
    assert.equal(metrics.effectiveDpr, 2);

    on.api.pauseGame();
    on.api.resumeGame();
    on.api.gameLoop(2000);
    assert.equal(on.api.getDebugData().metrics.samples, 1);
    on.api.gameLoop(2016);
    assert.equal(on.api.getDebugData().metrics.samples, 2);

    const activated = loadGame({ storage: { glitchDuelOnboardingSeen: '1' } });
    activated.api.initGame();
    activated.api.toggleDebugOverlay();
    activated.api.gameLoop(0);
    assert.equal(activated.api.getDebugData().metrics.samples, 0);
    activated.api.gameLoop(16);
    metrics = activated.api.getDebugData().metrics;
    assert.equal(metrics.samples, 1);
});

test('debug metric sample rings retain exactly the newest 1200 finite values', () => {
    const { api } = loadGame({ search: '?debug=1' });
    for (let value = 1; value <= 1200; value++) api.pushDebugSampleForTest('rafDeltaMs', value);
    let samples = api.getDebugMetricBufferForTest('rafDeltaMs');
    assert.equal(samples.length, 1200);
    assert.equal(samples[0], 1);

    api.pushDebugSampleForTest('rafDeltaMs', 1201);
    api.pushDebugSampleForTest('rafDeltaMs', Number.NaN);
    samples = api.getDebugMetricBufferForTest('rafDeltaMs');
    assert.equal(samples.length, 1200);
    assert.equal(samples[0], 2);
    assert.equal(samples[1199], 1201);
    assert.equal(api.getDebugData().metrics.p95RafMs, 1141);
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
    assert.equal(state.screenShake, api.COMBAT_FEEDBACK.block.shake);
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
    assert.equal(api.getState().startButtonText, 'PLAY NOW');

    api.setLanguage('es');
    assert.equal(api.getLanguage(), 'es');
    assert.equal(api.getState().startButtonText, 'JUGAR AHORA');
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

test('contextual AI tunables are exact finite probabilities ordered by difficulty', () => {
    const { api } = loadGame();
    const expected = {
        baitChance: [0.06, 0.14, 0.24],
        crouchDefenseChance: [0.08, 0.18, 0.30],
        whiffPunishChance: [0.18, 0.42, 0.68],
        airAttackChance: [0.20, 0.40, 0.60],
        antiTurtleChance: [0.10, 0.18, 0.28]
    };

    Object.entries(expected).forEach(([field, values]) => {
        const actual = ['easy', 'normal', 'hard'].map((level) => api.DIFFICULTIES[level][field]);
        assert.deepEqual(actual, values, field);
        actual.forEach((value) => assert(Number.isFinite(value) && value >= 0 && value <= 1, `${field}: ${value}`));
        assert(actual[0] < actual[1] && actual[1] < actual[2], field);
    });

    const thresholds = ['lateRoundThresholdFrames', 'lateRoundHealthGap', 'antiTurtleBlockThreshold'];
    thresholds.forEach((field) => {
        ['easy', 'normal', 'hard'].forEach((level) => {
            const value = api.DIFFICULTIES[level][field];
            assert(Number.isFinite(value), `${field}: ${value}`);
            assert(value >= 0, `${field}: ${value}`);
        });
    });
    ['easy', 'normal', 'hard'].forEach((level) => {
        assert(api.DIFFICULTIES[level].lateRoundThresholdFrames <= 3600);
        assert(api.DIFFICULTIES[level].lateRoundHealthGap <= 100);
        assert(api.DIFFICULTIES[level].antiTurtleBlockThreshold <= 1);
    });
});

test('contextual AI decisions respect chance, range, pattern, and safety boundaries', () => {
    const { api } = loadGame();
    const base = {
        dist: 150,
        health: 100,
        energy: 0,
        onGround: true,
        opponentAttacking: false,
        canPunch: false,
        canKick: false,
        canSpecial: false,
        attackCooldown: 0,
        opponentHealth: 100,
        x: 400,
        opponentX: 600,
        difficulty: api.DIFFICULTIES.normal
    };
    const cases = [
        ['whiff below chance', { dist: 80, canPunch: true, opponentWhiffed: true, opponentRecovery: 10, rand: 0.4199 }, 'punch'],
        ['whiff at chance falls through to normalized neutral pool', { dist: 80, canPunch: true, opponentWhiffed: true, opponentRecovery: 10, rand: 0.42 }, 'punch'],
        ['whiff prefers punch at punch range', { dist: 95, canPunch: true, canKick: true, opponentWhiffed: true, opponentRecovery: 10, rand: 0.1 }, 'punch'],
        ['whiff prefers kick past punch range', { dist: 95.01, canPunch: true, canKick: true, opponentWhiffed: true, opponentRecovery: 10, rand: 0.1 }, 'kick'],
        ['whiff approaches from mid without a hitbox', { opponentWhiffed: true, opponentRecovery: 10, rand: 0.1 }, 'approach'],
        ['whiff ignores finished recovery', { dist: 125, canKick: true, opponentWhiffed: true, opponentRecovery: 0, rand: 0.41 }, 'approach'],
        ['non-whiff keeps normal rules', { dist: 125, canKick: true, opponentWhiffed: false, opponentRecovery: 10, rand: 0.41 }, 'approach'],
        ['crouch below chance for dominant punch', { opponentPunchBias: 0.46, opponentKickBias: 0.45, opponentSpecialBias: 0.2, rand: 0.1799 }, 'crouch'],
        ['crouch at chance', { opponentPunchBias: 0.46, opponentKickBias: 0.45, opponentSpecialBias: 0.2, rand: 0.18 }, 'approach'],
        ['crouch requires bias above threshold', { opponentPunchBias: 0.45, opponentKickBias: 0.2, opponentSpecialBias: 0.2, rand: 0.1 }, 'approach'],
        ['crouch rejects tied kick pattern', { opponentPunchBias: 0.46, opponentKickBias: 0.46, opponentSpecialBias: 0.2, rand: 0.1 }, 'approach'],
        ['crouch rejects dominant special pattern', { opponentPunchBias: 0.46, opponentKickBias: 0.2, opponentSpecialBias: 0.47, rand: 0.1 }, 'approach'],
        ['crouch does not replace live block reaction', { opponentAttacking: true, opponentPunchBias: 0.8, rand: 0.1 }, 'block'],
        ['bait below chance for attack bias', { opponentAttackBias: 0.51, rand: 0.1399 }, 'retreat'],
        ['bait at chance', { opponentAttackBias: 0.51, rand: 0.14 }, 'block'],
        ['bait requires bias above threshold', { opponentAttackBias: 0.5, rand: 0.1 }, 'approach'],
        ['bait accepts repeated bias', { repeatedAttackBias: 0.51, rand: 0.1 }, 'retreat'],
        ['bait rejects retreat into wall', { x: 60, opponentX: 180, nearLeftWall: true, opponentAttackBias: 0.51, rand: 0.1 }, 'block'],
        ['bait rejects active attack', { opponentAttacking: true, opponentAttackBias: 0.51, rand: 0.1 }, 'block'],
        ['bait excludes close boundary', { dist: 110, opponentAttackBias: 0.51, rand: 0.1 }, 'block'],
        ['bait includes far mid boundary', { dist: 250, opponentAttackBias: 0.51, rand: 0.1 }, 'retreat'],
        ['bait excludes beyond mid boundary', { dist: 250.01, opponentAttackBias: 0.51, rand: 0.1 }, 'approach'],
        ['air below chance prefers punch in its range', { dist: 90, onGround: false, canAirPunch: true, canAirKick: true, rand: 0.3999 }, 'airPunch'],
        ['air at chance idles', { dist: 90, onGround: false, canAirPunch: true, canAirKick: true, rand: 0.4 }, 'idle'],
        ['air uses legal kick hitbox', { dist: 120, onGround: false, canAirPunch: false, canAirKick: true, rand: 0.1 }, 'airKick'],
        ['air idles after its attack', { onGround: false, canAirPunch: true, canAirKick: true, airAttackUsed: true, rand: 0.1 }, 'idle'],
        ['air idles during cooldown', { onGround: false, canAirPunch: true, canAirKick: true, attackCooldown: 1, rand: 0.1 }, 'idle'],
        ['air never falls through to ground defense or special', { onGround: false, opponentAttacking: true, canPunch: true, canSpecial: true, energy: 100, rand: 0 }, 'idle']
    ];

    cases.forEach(([name, overrides, expected]) => {
        assert.equal(api.chooseAIAction({ ...base, ...overrides }), expected, name);
    });
});

test('CPU consumes each whiff opportunity once and ignores hit, block, and finished recovery', () => {
    const punish = loadGame();
    punish.api.setDifficulty('hard');
    punish.api.setMatchRandomSeed(0);
    const cpu = new punish.api.Fighter(180, false);
    const opponent = new punish.api.Fighter(100, true);
    opponent.attackSequence = 1;
    opponent.lastAttackOutcome = 'whiff';
    opponent.attackCooldown = 10;
    opponent.state = 'punch';
    cpu.aiDecisionTimer = 40;

    cpu.updateAI(opponent);

    assert.equal(cpu.aiAction, 'punch');
    assert.equal(opponent.health, 92);
    assert.equal(cpu.aiMemory.lastObservedAttackSequence, 1);

    cpu.attackCooldown = 0;
    cpu.aiAction = 'idle';
    cpu.aiDecisionTimer = 40;
    cpu.updateAI(opponent);

    assert.equal(cpu.aiDecisionTimer, 39);
    assert.equal(cpu.aiAction, 'idle');
    assert.equal(opponent.health, 92);

    const missedChance = loadGame();
    missedChance.api.setDifficulty('easy');
    missedChance.api.setMatchRandomSeed(2);
    const cautiousCpu = new missedChance.api.Fighter(180, false);
    const whiffingOpponent = new missedChance.api.Fighter(100, true);
    whiffingOpponent.attackSequence = 1;
    whiffingOpponent.lastAttackOutcome = 'whiff';
    whiffingOpponent.attackCooldown = 10;
    whiffingOpponent.state = 'punch';
    cautiousCpu.aiDecisionTimer = 40;

    cautiousCpu.updateAI(whiffingOpponent);

    assert.equal(cautiousCpu.aiAction, 'block');
    assert.equal(whiffingOpponent.health, 100);
    assert.equal(cautiousCpu.aiMemory.lastObservedAttackSequence, 1);
    cautiousCpu.aiAction = 'idle';
    cautiousCpu.aiDecisionTimer = 40;
    cautiousCpu.updateAI(whiffingOpponent);
    assert.equal(cautiousCpu.aiDecisionTimer, 39);

    for (const [outcome, cooldown] of [['hit', 10], ['blocked', 10], ['whiff', 0]]) {
        const sample = loadGame();
        const observer = new sample.api.Fighter(180, false);
        const attacker = new sample.api.Fighter(100, true);
        attacker.attackSequence = 1;
        attacker.lastAttackOutcome = outcome;
        attacker.attackCooldown = cooldown;
        attacker.state = 'punch';
        observer.aiDecisionTimer = 40;

        observer.updateAI(attacker);

        assert.equal(observer.aiDecisionTimer, 39, `${outcome}/${cooldown}`);
        assert.equal(observer.aiAction, 'idle', `${outcome}/${cooldown}`);
        assert.equal(observer.aiMemory.lastObservedAttackSequence, 1, `${outcome}/${cooldown}`);
    }

    const range = loadGame();
    range.api.setDifficulty('hard');
    range.api.setMatchRandomSeed(0);
    const distantCpu = new range.api.Fighter(180, false);
    const distantOpponent = new range.api.Fighter(400, true);
    distantCpu.facingRight = true;
    distantOpponent.attackSequence = 1;
    distantOpponent.lastAttackOutcome = 'whiff';
    distantOpponent.attackCooldown = 10;
    distantOpponent.state = 'punch';

    distantCpu.updateAI(distantOpponent);

    assert.equal(distantCpu.aiAction, 'approach');
    assert.equal(distantOpponent.health, 100);
    assert.equal(new range.api.Fighter(180, false).aiMemory.lastObservedAttackSequence, 0);
});

test('CPU crouch defense stops movement but remains vulnerable to kicks', () => {
    const { api } = loadGame();
    api.setDifficulty('normal');
    api.setMatchRandomSeed(0);
    const cpu = new api.Fighter(180, false);
    const opponent = new api.Fighter(100, true);
    cpu.aiMemory.attacks.punch = 80;

    cpu.updateAI(opponent);

    assert.equal(cpu.aiAction, 'crouch');
    assert.equal(cpu.state, 'crouch');
    assert.equal(cpu.velX, 0);

    opponent.attack('kick', cpu);

    assert.equal(cpu.health, 86);
    assert.equal(cpu.state, 'hit');
});

test('whiff intercept uses real boxes, cooldown, observed movement and a strict recovery margin', () => {
    const { api } = loadGame();
    const cpu = new api.Fighter(400, false);
    const opponent = new api.Fighter(600, true);
    cpu.facingRight = true;
    const speed = api.DIFFICULTIES.normal.moveSpeed;
    assert.equal(cpu.findAIIntercept(opponent, 4, speed), null);
    assert.deepEqual({ ...cpu.findAIIntercept(opponent, 5, speed) }, { type: 'kick', frames: 5 });
    cpu.attackCooldown = 6;
    assert.equal(cpu.findAIIntercept(opponent, 5, speed), null);
    cpu.attackCooldown = 0;
    opponent.velX = speed + 1;
    assert.equal(cpu.findAIIntercept(opponent, 12, speed), null);
    assert.equal(cpu.x, 400, 'forecast does not mutate fighters');
    assert.equal(opponent.x, 600);
});

test('committed whiff approach hits within recovery and cancels expired or changed sequences without rerolling', () => {
    for (const cancel of [false, 'expired', 'newAttack']) {
        const { api } = loadGame();
        api.setDifficulty('normal');
        api.setMatchRandomSeed(0);
        const cpu = new api.Fighter(400, false);
        const opponent = new api.Fighter(600, true);
        cpu.facingRight = true;
        Object.assign(opponent, { attackSequence: 1, lastAttackOutcome: 'whiff', attackCooldown: 10, state: 'kick' });
        cpu.updateAI(opponent);
        assert.equal(cpu.aiAction, 'punish');
        assert.equal(cpu.aiMemory.lastObservedAttackSequence, 1);
        if (cancel === 'expired') opponent.attackCooldown = 1;
        if (cancel === 'newAttack') {
            opponent.attackSequence++;
            opponent.lastAttackOutcome = 'blocked';
        }
        for (let frame = 0; frame < 6; frame++) {
            cpu.applyPhysics();
            opponent.attackCooldown = Math.max(0, opponent.attackCooldown - 1);
            cpu.updateAI(opponent);
        }
        if (cancel) {
            assert.equal(opponent.health, 100, cancel);
            assert.equal(cpu.aiAction, 'idle', cancel);
        } else {
            assert.equal(opponent.health, 86);
            assert(opponent.attackCooldown > 0);
            assert.equal(cpu.attackSequence, 1);
        }
    }
});

test('anti-air forecasts descending contact, rejects unreachable trajectories and respects decision cadence', () => {
    const { api } = loadGame();
    api.setDifficulty('hard');
    api.setMatchRandomSeed(0);
    const cpu = new api.Fighter(400, false);
    const opponent = new api.Fighter(480, true);
    cpu.facingRight = true;
    Object.assign(opponent, { y: 290, velY: 7, onGround: false, state: 'jump' });
    assert.equal(cpu.canHitOpponent('punch', opponent), false);
    assert.deepEqual({ ...cpu.findAIIntercept(opponent, 8, 0, true) }, { type: 'punch', frames: 2 });
    cpu.aiDecisionTimer = 10;
    cpu.updateAI(opponent);
    assert.equal(cpu.aiAction, 'idle');
    assert.equal(cpu.aiDecisionTimer, 9, 'jump does not force a new decision');
    cpu.aiDecisionTimer = 0;
    cpu.updateAI(opponent);
    assert.equal(cpu.aiAction, 'antiAir');
    assert.equal(opponent.health, 100, 'no early hit during projection');
    opponent.applyPhysics();
    cpu.updateAI(opponent);
    assert.equal(opponent.health, 100);
    opponent.applyPhysics();
    cpu.updateAI(opponent);
    assert.equal(opponent.health, 92);
    assert.equal(cpu.aiAction, 'idle', 'one strike consumes the response');

    Object.assign(opponent, { y: 290, velY: -12, onGround: false, x: 480 });
    assert.equal(cpu.findAIIntercept(opponent, 8, 0, true), null);
    cpu.attackCooldown = 20;
    opponent.velY = 7;
    assert.equal(cpu.findAIIntercept(opponent, 8, 0, true), null);
    cpu.attackCooldown = 0;
    opponent.x = 700;
    assert.equal(cpu.findAIIntercept(opponent, 8, 0, true), null);
});

test('anti-air cancels a changed trajectory and never spends an attack on an empty box', () => {
    const { api } = loadGame();
    const cpu = new api.Fighter(400, false);
    const opponent = new api.Fighter(480, true);
    cpu.facingRight = true;
    cpu.aiAction = 'antiAir';
    cpu.aiDecisionTimer = 10;
    Object.assign(opponent, { x: 750, y: 290, velY: 7, onGround: false });
    cpu.updateAI(opponent);
    assert.equal(cpu.aiAction, 'idle');
    assert.equal(cpu.attackSequence, 0);
});

test('ordinary committed CPU attacks can still whiff when the opponent escapes their range', () => {
    const { api } = loadGame();
    const cpu = new api.Fighter(400, false);
    const opponent = new api.Fighter(700, true);
    Object.assign(cpu, { facingRight: true, aiAction: 'kick', aiDecisionTimer: 8 });
    cpu.updateAI(opponent);
    assert.equal(cpu.lastAttackOutcome, 'whiff');
    assert.equal(cpu.attackCooldown, 24);
    assert.equal(opponent.health, 100);
});

test('corner escape moves toward center on both sides, while live attacks retain block priority', () => {
    for (const left of [true, false]) {
        const { api } = loadGame();
        api.setDifficulty('hard');
        api.setMatchRandomSeed(0);
        const cpu = new api.Fighter(left ? 60 : 940, false);
        const opponent = new api.Fighter(left ? 200 : 800, true);
        cpu.update({}, opponent);
        assert.equal(cpu.onGround, false);
        assert.equal(Math.sign(cpu.velX), left ? 1 : -1);
        cpu.update({}, opponent);
        assert.equal(Math.sign(cpu.velX), left ? 1 : -1, 'escape drift persists while airborne');
        const base = { dist: 140, health: 100, energy: 0, onGround: true, canPunch: false, canKick: false,
            x: left ? 60 : 940, opponentX: left ? 200 : 800, nearLeftWall: left, nearRightWall: !left,
            opponentAttacking: true, difficulty: api.DIFFICULTIES.hard, rand: 0.1 };
        assert.equal(api.chooseAIAction(base), 'block');
        assert.equal(api.chooseAIAction({ ...base, opponentAttacking: false, opponentCornered: true,
            nearLeftWall: false, nearRightWall: false, canKick: true, dist: 130 }), 'kick');
    }
});

test('post-hit hesitation starts after hit-stun, keeps defense, freezes on pause and resets each round', () => {
    const { api } = loadGame();
    startPlayingGame(api);
    const { player1, player2 } = api.getState();
    player1.x = 400;
    player2.x = 480;
    player2.takeHit(8, player1);
    const pause = api.DIFFICULTIES.normal.postHitPauseFrames;
    assert.equal(player2.aiPostHitTimer, pause);
    player2.update({}, player1);
    assert.equal(player2.aiPostHitTimer, pause, 'hit-stun does not consume hesitation');
    api.pauseGame();
    api.advanceSimulation(100);
    assert.equal(player2.aiPostHitTimer, pause);
    Object.assign(player2, { hitStun: 0, onGround: true, y: 380, state: 'idle' });
    player1.state = 'kick';
    player2.update({}, player1);
    assert.equal(player2.state, 'block');
    assert.equal(player2.aiPostHitTimer, pause - 1);
    player1.state = 'idle';
    for (let i = 1; i < pause; i++) player2.update({}, player1);
    assert.equal(player2.attackSequence, 0);
    assert.equal(player2.aiPostHitTimer, 0);
    assert.equal(player2.aiDecisionTimer, 0);
    api.startRound();
    assert.equal(api.getState().player2.aiPostHitTimer, 0);
    assert.equal(api.getState().player2.aiEscapeDirection, 0);
});

test('new AI probabilities and response windows are bounded and difficulty tuned', () => {
    const { api } = loadGame();
    for (const field of ['antiAirChance', 'airPatternBonus', 'cornerEscapeChance', 'cornerPressureChance']) {
        const values = ['easy', 'normal', 'hard'].map((key) => api.DIFFICULTIES[key][field]);
        assert(values.every((value) => value > 0 && value < 1), field);
        assert(values[0] < values[1] && values[1] < values[2], field);
    }
    assert(api.DIFFICULTIES.easy.postHitPauseFrames > api.DIFFICULTIES.hard.postHitPauseFrames);
    const base = { dist: 80, health: 100, energy: 0, onGround: true, opponentAttacking: false,
        canPunch: false, canKick: false, antiAirIntercept: { type: 'punch', frames: 2 }, difficulty: api.DIFFICULTIES.hard };
    assert.equal(api.chooseAIAction({ ...base, rand: 0.65 }), 'antiAir');
    assert.notEqual(api.chooseAIAction({ ...base, rand: 0.66 }), 'antiAir');
    assert.equal(api.chooseAIAction({ ...base, opponentAirBias: 1, rand: 0.7 }), 'antiAir');
    assert.notEqual(api.chooseAIAction({ ...base, opponentAirBias: 1, rand: 0.95 }), 'antiAir');
});

test('contact shapes and whiff cue remain distinct and stationary under reduced motion', () => {
    const { api } = loadGame({ reducedMotionSystem: true });
    api.triggerImpactFeedback(300, 300, 1, false, '#123');
    api.triggerImpactFeedback(300, 300, 1, true);
    const player = new api.Fighter(100, true);
    player.attack('kick', new api.Fighter(600, false));
    const particles = api.getState().impactParticles;
    assert(particles.some((p) => p.type === 'burst'));
    assert(particles.some((p) => p.type === 'shield'));
    assert.equal(particles.find((p) => p.type === 'shield').color, '#33f');
    assert(particles.some((p) => p.type === 'whiff'));
    for (const particle of particles) {
        const before = [particle.x, particle.y];
        particle.update();
        particle.draw();
        assert.deepEqual([particle.x, particle.y], before);
    }
    assert.equal(api.getState().hitStopFrames, 0);
    assert.equal(api.getState().screenShake, 0);
});

test('shake advances only in simulation and renders do not consume it', () => {
    const { api } = loadGame();
    startPlayingGame(api);
    api.triggerImpactFeedback(300, 300, 1);
    const before = api.getState().screenShake;
    api.draw();
    api.draw();
    assert.equal(api.getState().screenShake, before);
    api.update();
    assert.equal(api.getState().screenShake, before * api.COMBAT_FEEDBACK.shakeDecay);
    api.pauseGame();
    const paused = api.getState().screenShake;
    api.draw();
    api.advanceSimulation(100);
    assert.equal(api.getState().screenShake, paused);
});

test('HUD danger and special readiness use non-color cues and authoritative availability', () => {
    const danger = loadGame();
    danger.api.drawHealthBar(50, 34, 30, 30, false);
    assert(danger.api.getState().textCalls.includes('!'));
    const healthy = loadGame();
    healthy.api.drawHealthBar(50, 34, 31, 31, false);
    assert(!healthy.api.getState().textCalls.includes('!'));
    const ready = loadGame();
    ready.api.drawEnergyBar(50, 67, 100, false, '#123', 'special-ready');
    assert(ready.api.getState().textCalls.includes(ready.api.t('specialReadyShort')));
    const recovering = loadGame();
    recovering.api.drawEnergyBar(50, 67, 100, false, '#123', 'charging');
    assert(!recovering.api.getState().textCalls.includes(recovering.api.t('specialReadyShort')));
    const cpu = new recovering.api.Fighter(800, false);
    Object.assign(cpu, { energy: 100, attackCooldown: 10 });
    cpu.draw();
    assert(!recovering.api.getState().textCalls.includes(recovering.api.t('specialReady')));
});

test('CPU air decisions use real hitboxes once per jump and never execute stale ground attacks', () => {
    const { api } = loadGame();
    api.setDifficulty('hard');
    api.setMatchRandomSeed(0);
    const cpu = new api.Fighter(100, false);
    const opponent = new api.Fighter(190, true);
    cpu.onGround = false;
    cpu.y = 320;

    cpu.update({}, opponent);

    assert.equal(cpu.lastAttackType, 'airPunch');
    assert.equal(cpu.airAttackUsed, true);
    assert.equal(cpu.attackSequence, 1);
    assert.equal(opponent.health, 91);

    cpu.attackCooldown = 0;
    cpu.aiDecisionTimer = 0;
    cpu.update({}, opponent);

    assert.equal(cpu.attackSequence, 1);
    assert.equal(opponent.health, 91);

    cpu.y = 381;
    cpu.applyPhysics();
    assert.equal(cpu.onGround, true);
    assert.equal(cpu.airAttackUsed, false);

    api.setMatchRandomSeed(0);
    const kickCpu = new api.Fighter(100, false);
    const kickTarget = new api.Fighter(235, true);
    kickCpu.onGround = false;
    kickCpu.y = 320;
    kickCpu.update({}, kickTarget);

    assert.equal(kickCpu.lastAttackType, 'airKick');
    assert.equal(kickTarget.health, 87);

    const staleCpu = new api.Fighter(100, false);
    const staleTarget = new api.Fighter(190, true);
    staleCpu.onGround = false;
    staleCpu.y = 320;
    staleCpu.aiAction = 'punch';
    staleCpu.aiDecisionTimer = 40;
    staleCpu.updateAI(staleTarget);

    assert.equal(staleCpu.attackSequence, 0);
    assert.equal(staleTarget.health, 100);
});

test('CPU decision helper chooses deterministic defensive and offensive actions', () => {
    const { api } = loadGame();
    const difficulty = {
        ...api.DIFFICULTIES.normal,
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
        ...api.DIFFICULTIES.normal,
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
        ...api.DIFFICULTIES.normal,
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
        ...api.DIFFICULTIES.normal,
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
        ...api.DIFFICULTIES.normal,
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
        ...api.DIFFICULTIES.normal,
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

test('CPU AI context uses the exact late boundary, health gap, and effective timer', () => {
    const { api } = loadGame({ storage: { glitchDuelOnboardingSeen: '1' } });
    api.setDifficulty('normal');
    api.initGame();
    api.skipVsIntro();
    const state = api.getState();
    state.player1.health = 100;
    state.player2.health = 82;

    api.setRoundTimerFrames(api.DIFFICULTIES.normal.lateRoundThresholdFrames + 1);
    assert.deepEqual({ ...api.getCPUAIContext() }, { timedRound: true, lateRound: false, cpuBehind: true });

    api.setRoundTimerFrames(api.DIFFICULTIES.normal.lateRoundThresholdFrames);
    assert.deepEqual({ ...api.getCPUAIContext() }, { timedRound: true, lateRound: true, cpuBehind: true });

    state.player1.health = 82;
    state.player2.health = 100;
    assert.deepEqual({ ...api.getCPUAIContext() }, { timedRound: true, lateRound: true, cpuBehind: false });

    const training = loadGame({ storage: { glitchDuelOnboardingSeen: '1' } });
    training.api.startTraining();
    training.api.skipVsIntro();
    const trainingState = training.api.getState();
    trainingState.player1.health = 100;
    trainingState.player2.health = 82;
    training.api.setRoundTimerFrames(training.api.DIFFICULTIES.normal.lateRoundThresholdFrames);
    assert.deepEqual({ ...training.api.getCPUAIContext() }, { timedRound: false, lateRound: false, cpuBehind: true });
});

test('CPU AI cancels stored retreat only when late, timed, and behind', () => {
    function runCase({ cpuHealth, playerHealth, timerOn = true }) {
        const { api } = loadGame({ storage: { glitchDuelOnboardingSeen: '1' } });
        if (timerOn) api.initGame();
        else {
            api.startTraining();
            api.setTrainingCpu('normal');
        }
        api.skipVsIntro();
        api.setDifficulty('normal');
        api.setRoundTimerFrames(api.DIFFICULTIES.normal.lateRoundThresholdFrames);
        const state = api.getState();
        const cpu = state.player2;
        const player = state.player1;
        cpu.x = 500;
        player.x = 570;
        cpu.facingRight = true;
        cpu.health = cpuHealth;
        player.health = playerHealth;
        cpu.aiAction = 'retreat';
        cpu.aiDecisionTimer = 99;
        cpu.updateAI(player, api.getCPUAIContext());
        return { x: cpu.x, velX: cpu.velX, aiAction: cpu.aiAction, attack: cpu.lastAttackType, timer: state.roundTimerFrames };
    }

    const cpuLosingLate = runCase({ cpuHealth: 82, playerHealth: 100 });
    const cpuLeadingLate = runCase({ cpuHealth: 100, playerHealth: 82 });
    const cpuLosingTraining = runCase({ cpuHealth: 82, playerHealth: 100, timerOn: false });

    assert.equal(cpuLosingLate.aiAction, 'punch');
    assert.equal(cpuLosingLate.attack, 'punch');
    assert.equal(cpuLosingLate.velX, 0);
    assert.equal(cpuLeadingLate.aiAction, 'retreat');
    assert(cpuLeadingLate.velX < 0);
    assert.equal(cpuLosingTraining.aiAction, 'retreat');
    assert(cpuLosingTraining.velX < 0);
    assert.equal(cpuLosingLate.timer, 720);
});

test('anti-turtle pressure uses accumulated block memory threshold and the single decision rand', () => {
    const { api } = loadGame();
    const difficulty = {
        ...api.DIFFICULTIES.normal,
        ...api.DIFFICULTIES.normal,
        specialChance: 0,
        punchClose: 0,
        kickClose: 0,
        blockClose: 0,
        lowHealthRetreat: 0
    };
    const base = {
        dist: 80,
        health: 100,
        energy: 0,
        onGround: true,
        opponentAttacking: false,
        canPunch: true,
        canKick: false,
        opponentBlockBias: difficulty.antiTurtleBlockThreshold,
        difficulty
    };

    assert.equal(api.chooseAIAction({ ...base, opponentBlockBias: difficulty.antiTurtleBlockThreshold - 0.01, rand: 0.1 }), 'retreat');
    assert.equal(api.chooseAIAction({ ...base, rand: difficulty.antiTurtleChance - 0.0001 }), 'punch');
    assert.equal(api.chooseAIAction({ ...base, rand: difficulty.antiTurtleChance }), 'retreat');
});

test('late pressure and anti-turtle rules preserve whiff, live defense, and wall precedence', () => {
    const { api } = loadGame();
    const difficulty = api.DIFFICULTIES.normal;
    const base = {
        dist: 130,
        health: 80,
        energy: 0,
        onGround: true,
        canPunch: false,
        canKick: true,
        opponentBlockBias: 1,
        timedRound: true,
        lateRound: true,
        cpuBehind: true,
        difficulty,
        rand: 0.99
    };

    assert.equal(api.chooseAIAction({ ...base, opponentAttacking: true }), 'block');
    assert.equal(api.chooseAIAction({ ...base, opponentAttacking: false, opponentWhiffed: true, opponentRecovery: 10, rand: 0.1 }), 'kick');
    assert.equal(api.chooseAIAction({ ...base, opponentAttacking: false, canKick: false, x: 60, opponentX: 180, nearLeftWall: true }), 'approach');
});

test('late pressure preserves existing crouch defense, counter, and lethal Special precedence', () => {
    const { api } = loadGame();
    const difficulty = api.DIFFICULTIES.normal;

    assert.equal(api.chooseAIAction({
        dist: 80,
        health: 100,
        energy: 0,
        onGround: true,
        opponentAttacking: false,
        canPunch: true,
        canKick: true,
        opponentPunchBias: 0.8,
        opponentKickBias: 0.1,
        opponentSpecialBias: 0.1,
        timedRound: true,
        lateRound: true,
        cpuBehind: true,
        difficulty,
        rand: 0.1
    }), 'crouch');

    assert.equal(api.chooseAIAction({
        dist: 80,
        health: 80,
        energy: 0,
        onGround: true,
        opponentAttacking: false,
        canPunch: true,
        canKick: true,
        counterTimer: 8,
        timedRound: true,
        lateRound: true,
        cpuBehind: true,
        difficulty,
        rand: 0.1
    }), 'punch');

    assert.equal(api.chooseAIAction({
        dist: 80,
        health: 40,
        energy: 100,
        onGround: true,
        opponentAttacking: false,
        canPunch: true,
        canKick: true,
        canSpecial: true,
        opponentHealth: 20,
        timedRound: true,
        lateRound: true,
        cpuBehind: true,
        difficulty,
        rand: 0.99
    }), 'special');
});

test('AI roadmap characterization: Special decision has no hit-stun or corner context yet', () => {
    const { api } = loadGame();
    const difficulty = api.DIFFICULTIES.hard;
    const base = {
        dist: 80,
        health: 100,
        energy: 100,
        onGround: true,
        opponentAttacking: false,
        canPunch: true,
        canKick: true,
        canSpecial: true,
        opponentHealth: 100,
        rand: 0.1,
        difficulty
    };
    const conceptualContexts = [
        'neutral-center',
        'blocked-center',
        'hit-stun-center',
        'neutral-corner'
    ];
    const decisions = conceptualContexts.map(() => api.chooseAIAction(base));

    assert.deepEqual(decisions, ['special', 'special', 'special', 'special']);
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

    api.setArena('missing-arena');
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
    const arenaKeys = Object.keys(loadGame().api.ARENAS);

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
    const { api, context } = loadGame();
    const summary = context.document.getElementById('match-configuration-summary');

    api.setDifficulty('hard');
    api.setArena('lab');
    api.setFighterStyle('technical');
    api.setRival('boss500');
    api.startArcadeRun();
    api.renderLanguage();
    assert.equal(summary.textContent, 'Dificultad: FACIL · Arena: CUADERNO · Estilo: TECNICO · Rival: NULL POINTER');
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
    assert.equal(state.selectedFighterStyle, 'technical');
    assert.equal(state.selectedRival, 'boss500');
    assert.equal(summary.textContent, 'Dificultad: DIFICIL · Arena: LABORATORIO · Estilo: TECNICO · Rival: BOSS 500');
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

test('canonical buffered punch-kick trace is equivalent at 30, 60, and 120 FPS', () => {
    function run(fps) {
        const { api } = loadGame({ storage: { glitchDuelOnboardingSeen: '1' } });
        api.startTraining();
        api.skipVsIntro();
        const state = api.getState();
        state.player1.x = 100;
        state.player2.x = 170;
        const trace = [];
        const advanceTicks = (ticks) => {
            const frames = ticks * fps / 60;
            for (let frame = 0; frame < frames; frame++) api.advanceSimulation(1000 / fps);
            const current = api.getState();
            trace.push({
                elapsed: current.matchElapsedFrames,
                attack: current.player1.lastAttackType,
                outcome: current.player1.lastAttackOutcome,
                cooldown: current.player1.attackCooldown,
                comboTimer: current.player1.comboTimer,
                pending: current.player1.pendingComboInput,
                sequence: current.player1.attackSequence,
                opponentHealth: current.player2.health
            });
        };

        api.setInputSource('test:punch', 'punch', true);
        advanceTicks(2);
        api.clearInputSource('test:punch');
        advanceTicks(8);
        api.setInputSource('test:kick', 'kick', true);
        advanceTicks(2);
        api.clearInputSource('test:kick');
        advanceTicks(12);
        return trace;
    }

    const traces = [30, 60, 120].map(run);
    assert.equal(traces[0][2].pending, 'kick');
    assert.equal(traces[0][3].attack, 'comboKick');
    assert.equal(traces[0][3].opponentHealth, 74);
    assert.deepEqual(traces[0], traces[1]);
    assert.deepEqual(traces[1], traces[2]);
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

test('contextual AI trace is equivalent at 30, 60, and 120 FPS', () => {
    function runAtFrameRate(frameMs, framesPerSample) {
        const { api } = loadGame({ search: '?seed=0' });
        api.setDifficulty('hard');
        api.initGame();
        api.skipVsIntro();
        api.setMatchRandomSeed(0);
        const initial = api.getState();
        initial.player1.x = 650;
        initial.player2.x = 750;
        initial.player1.attackSequence = 1;
        initial.player1.lastAttackOutcome = 'whiff';
        initial.player1.attackCooldown = 12;
        initial.player1.state = 'punch';
        initial.player2.aiDecisionTimer = 40;
        const trace = [];

        for (let sample = 0; sample < 10; sample++) {
            for (let frame = 0; frame < framesPerSample; frame++) {
                api.advanceSimulation(frameMs);
                api.draw();
            }
            const state = api.getState();
            trace.push({
                player1: {
                    x: state.player1.x,
                    y: state.player1.y,
                    health: state.player1.health,
                    energy: state.player1.energy,
                    state: state.player1.state,
                    attackCooldown: state.player1.attackCooldown,
                    hitStun: state.player1.hitStun
                },
                player2: {
                    x: state.player2.x,
                    y: state.player2.y,
                    health: state.player2.health,
                    energy: state.player2.energy,
                    state: state.player2.state,
                    attackCooldown: state.player2.attackCooldown,
                    hitStun: state.player2.hitStun,
                    aiAction: state.player2.aiAction,
                    aiDecisionTimer: state.player2.aiDecisionTimer,
                    lastObservedAttackSequence: state.player2.aiMemory.lastObservedAttackSequence,
                    airAttackUsed: state.player2.airAttackUsed
                },
                matchElapsedFrames: state.matchElapsedFrames,
                roundTimerFrames: state.roundTimerFrames,
                gameState: state.gameState
            });
        }

        return trace;
    }

    const at30 = runAtFrameRate(1000 / 30, 3);
    const at60 = runAtFrameRate(1000 / 60, 6);
    const at120 = runAtFrameRate(1000 / 120, 12);

    assert.equal(at30[0].player2.lastObservedAttackSequence, 1);
    assert(at30.some((sample) => sample.player1.health < 100));
    assert.deepEqual(at30, at60);
    assert.deepEqual(at60, at120);
});

test('late pressure trace is equivalent at 30, 60, and 120 FPS', () => {
    function runAtFrameRate(frameMs, framesPerSample) {
        const { api } = loadGame({ search: '?seed=17' });
        api.setDifficulty('normal');
        api.initGame();
        api.skipVsIntro();
        api.setMatchRandomSeed(17);
        const initial = api.getState();
        initial.player1.x = 570;
        initial.player2.x = 500;
        initial.player1.health = 100;
        initial.player2.health = 82;
        initial.player2.aiAction = 'retreat';
        initial.player2.aiDecisionTimer = 40;
        api.setRoundTimerFrames(api.DIFFICULTIES.normal.lateRoundThresholdFrames);
        const trace = [];

        for (let sample = 0; sample < 5; sample++) {
            for (let frame = 0; frame < framesPerSample; frame++) api.advanceSimulation(frameMs);
            const state = api.getState();
            const context = api.getCPUAIContext();
            trace.push({
                cpuX: state.player2.x,
                cpuHealth: state.player2.health,
                cpuState: state.player2.state,
                cpuAction: state.player2.aiAction,
                lastAttackType: state.player2.lastAttackType,
                attackCooldown: state.player2.attackCooldown,
                timer: state.roundTimerFrames,
                timedRound: context.timedRound,
                lateRound: context.lateRound,
                cpuBehind: context.cpuBehind,
                elapsed: state.matchElapsedFrames
            });
        }

        return trace;
    }

    const at30 = runAtFrameRate(1000 / 30, 3);
    const at60 = runAtFrameRate(1000 / 60, 6);
    const at120 = runAtFrameRate(1000 / 120, 12);

    assert.equal(at30[0].lastAttackType, 'punch');
    assert.equal(at30[0].cpuHealth, 82);
    assert(at30.some((sample) => sample.timer <= 720));
    assert.deepEqual(at30, at60);
    assert.deepEqual(at60, at120);
});

test('glitch cancel training trace is equivalent at 30, 60, and 120 FPS', () => {
    function runAtFrameRate(frameMs, frames) {
        const { api } = loadGame({ storage: { glitchDuelOnboardingSeen: '1' } });
        api.startTraining();
        api.setTrainingTrial('glitchCancel');
        api.skipVsIntro();
        const state = api.getState();
        state.player1.attack('punch', state.player2);
        assert.equal(api.getState().trialState.phase, 'cancel');
        api.setInputSource('test:special', 'special', true);
        for (let frame = 0; frame < frames; frame++) api.advanceSimulation(frameMs);

        const result = api.getState();
        return {
            energy: result.player1.energy,
            health: result.player1.health,
            opponentHealth: result.player2.health,
            attackCooldown: result.player1.attackCooldown,
            lastAttackType: result.player1.lastAttackType,
            lastAttackOutcome: result.player1.lastAttackOutcome,
            attackSequence: result.player1.attackSequence,
            glitchCancelUsed: result.player1.glitchCancelUsed,
            feedbackFrames: result.player1.glitchCancelFeedbackFrames,
            trialPhase: result.trialState.phase,
            trialSequence: result.trialState.glitchSequence,
            matchElapsedFrames: result.matchElapsedFrames,
            gameState: result.gameState
        };
    }

    const at30 = runAtFrameRate(1000 / 30, 3);
    const at60 = runAtFrameRate(1000 / 60, 6);
    const at120 = runAtFrameRate(1000 / 120, 12);

    assert.equal(at30.energy, 75);
    assert.equal(at30.trialPhase, 'followup');
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

// PLAN 0051 HITO 0 - Caracterizacion de defecto neutral reproducible
// Escenario: CPU en rango mid (dist=150) sin kickReady, con retreat disponible.
// Con configuracion Normal: kickMid=0.24, approachMid=0.60, retreatMid=0.80, jumpMid=0.95.
// Sin kickReady, approach weight = 0.60 - 0.24 = 0.36, retreat = 0.20, jump = 0.15, block = 0.05.
// Esto da approach ~47% vs retreat ~26%, una proporcion ~1.8x que favorece
// acercarse cuando el rival esta en rango de castigo.
test('plan0051 neutral defect: CPU over-approaches in mid range, under-uses retreat', () => {
    const { api } = loadGame();
    const d = api.DIFFICULTIES.normal;
    const base = {
        dist: 150, punchReady: false, kickReady: false,
        retreatBlocked: false, opponentBlockBias: 0,
        difficulty: d, rand: 0, previousDecision: ''
    };
    const counts = { approach: 0, retreat: 0, block: 0, jump: 0, idle: 0 };
    const n = 10000;
    for (let i = 0; i < n; i++) {
        const rand = (i + 0.5) / n;
        counts[api.chooseAINeutralAction({ ...base, rand })]++;
    }
    const approachPct = counts.approach / n;
    const retreatPct = counts.retreat / n;
    assert(approachPct > retreatPct, `approach ${approachPct} should exceed retreat ${retreatPct}`);
    assert(approachPct > 0.45 && approachPct < 0.50, `approach ${approachPct} expected ~0.47`);
    assert(retreatPct > 0.24 && retreatPct < 0.28, `retreat ${retreatPct} expected ~0.26`);
    assert(approachPct > retreatPct * 1.5,
        `approach ${approachPct} should be >1.5x retreat ${retreatPct}`);
    assert(!Object.keys(counts).includes('kick'), 'kick should not appear when kickReady=false');

    api.setMatchRandomSeed(42);
    const seq1 = [];
    for (let i = 0; i < 20; i++) {
        seq1.push(api.chooseAINeutralAction({ ...base, rand: api.nextSimulationRandomForTest() }));
    }
    api.setMatchRandomSeed(42);
    const seq2 = [];
    for (let i = 0; i < 20; i++) {
        seq2.push(api.chooseAINeutralAction({ ...base, rand: api.nextSimulationRandomForTest() }));
    }
    assert.deepEqual(seq1, seq2, 'neutral sequence must be identical with same seed');

    // Verificar que un ajuste rule-based simple solucionaria el desbalance:
    // Mover 0.15 de approachMid a retreatMid da:
    //   approach = (0.45 - 0.24) / ((0.45 - 0.24) + 0.35 + 0.15 + 0.05) = 0.21 / 0.76 = 0.276
    //   retreat = 0.35 / 0.76 = 0.461
    // La proporcion se invierte: retreat ahora es ~1.7x approach.
    const adjustedApproach = d.approachMid - 0.15 - d.kickMid;
    const adjustedRetreat = d.retreatMid - (d.approachMid - 0.15);
    assert(adjustedApproach > 0 && adjustedRetreat > adjustedApproach,
        `adjusted approach weight ${adjustedApproach} vs retreat ${adjustedRetreat}`);
});
