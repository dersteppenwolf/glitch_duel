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
                start() { audioEvents.push({ event: 'start', type: this.type, frequency: this.frequency.value }); },
                stop() { audioEvents.push({ event: 'stop', type: this.type, frequency: this.frequency.value }); }
            };
        }

        createGain() {
            return {
                gain: { value: 0 },
                connect() { return this; }
            };
        }
    };
}

function loadGame(options = {}) {
    const ctx = createMockContext();
    const audioEvents = [];
    const elements = new Map();
    const canvas = {
        width: 1000,
        height: 500,
        style: {},
        getContext(type) {
            assert.equal(type, '2d');
            return ctx;
        }
    };

    function getElement(id) {
        if (id === 'game') return canvas;

        if (!elements.has(id)) {
            elements.set(id, {
                id,
                style: {},
                innerHTML: '',
                textContent: '',
                value: '',
                checked: false,
                listeners: {},
                attributes: {},
                addEventListener(type, handler) {
                    this.listeners[type] = handler;
                },
                setAttribute(name, value) {
                    this.attributes[name] = value;
                },
                getAttribute(name) {
                    return this.attributes[name];
                }
            });
        }

        return elements.get(id);
    }

    const windowListeners = {};
    const storage = new Map();
    Object.entries(options.storage || {}).forEach(([key, value]) => storage.set(key, value));
    const MockAudioContext = createMockAudioContext(audioEvents);
    const navigatorMock = {
        maxTouchPoints: 0,
        language: options.language,
        languages: options.languages
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
        document: { documentElement: {}, getElementById: getElement },
        window: {
            innerWidth: 800,
            innerHeight: 600,
            devicePixelRatio: 2,
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
            }
        }
    };

    context.globalThis = context;

    const sourceFiles = ['i18n.js', 'config.js', 'audio.js', 'effects.js', 'ai.js', 'fighter_render.js', 'fighter.js', 'game.js'];
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
            t,
            setLanguage,
            getLanguage,
            chooseAIAction,
            drawFighter,
            draw,
            resizeCanvas,
            initGame,
            startRound,
            showMainMenu,
            showHelpScreen,
            hideHelpScreen,
            pauseGame,
            resumeGame,
            togglePause,
            setDifficulty,
            setRoundTimerFrames,
            setRoundTimeMs,
            skipVsIntro,
            setArena,
            getArenaConfig,
            getArenaLabel,
            renderArenaPreview,
            drawBackground,
            setReducedMotion,
            renderLanguage,
            recordMatchResult,
            recordPlayerCombo,
            recordPlayerBlock,
            recordPlayerSpecial,
            getPostMatchMedal,
            update,
            triggerImpactFeedback,
            triggerSpecialFeedback,
            getState: () => ({
                player1,
                player2,
                floatingTexts,
                impactParticles,
                gameState,
                selectedDifficulty,
                statusMessage,
                statusTimer,
                currentRound,
                playerRounds,
                cpuRounds,
                roundTimerFrames,
                roundTimeMs,
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
                pauseScreenDisplay: document.getElementById('pause-screen').style.display,
                winnerTextHtml: document.getElementById('winner-text').innerHTML,
                pauseSummaryText: document.getElementById('pause-summary').textContent,
                startButtonText: document.getElementById('start-button').textContent,
                helpButtonText: document.getElementById('help-button').textContent,
                statsSummaryText: document.getElementById('stats-summary').textContent,
                arenaPreviewClass: document.getElementById('arena-preview').className,
                arenaPreviewTitle: document.getElementById('arena-preview-title').textContent,
                arenaPreviewText: document.getElementById('arena-preview-text').textContent,
                languageSelectValue: document.getElementById('language-select').value,
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
        windowListeners,
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

    player.updatePlayerControls({ j: true }, opponent);

    assert.equal(player.state, 'punch');
    assert.equal(player.attackCooldown, 12);
    assert.equal(opponent.health, 92);
    assert.equal(opponent.hitStun, 20);
});

test('K triggers kick damage when opponent is in range', () => {
    const { api } = loadGame();
    const { player, opponent } = createFighters(api, 100, 220);

    player.updatePlayerControls({ k: true }, opponent);

    assert.equal(player.state, 'kick');
    assert.equal(player.attackCooldown, 24);
    assert.equal(opponent.health, 86);
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

test('simple combos increase damage and cooldown', () => {
    const { api } = loadGame();
    const { player, opponent } = createFighters(api, 100, 170);

    player.updatePlayerControls({ j: true }, opponent);
    player.updatePlayerControls({}, opponent);
    player.attackCooldown = 0;
    player.updatePlayerControls({ j: true }, opponent);

    assert.equal(player.state, 'punch');
    assert.equal(player.attackCooldown, 18);
    assert.equal(opponent.health, 80);
});

test('first combo input shows a brief combo hint without combo flash', () => {
    const { api } = loadGame();
    const player = new api.Fighter(100, true);
    const opponent = new api.Fighter(170, false);

    player.updatePlayerControls({ j: true }, opponent);

    assert.equal(player.comboHintText, 'J...');
    assert.equal(player.comboHintTimer, 24);
    assert.equal(player.comboFlashTimer, 0);
    assert.equal(api.getState().floatingTexts.some((text) => text.text === 'COMBO x2'), false);
});

test('J,J combo creates combo-specific visual feedback', () => {
    const { api } = loadGame();
    const player = new api.Fighter(100, true);
    const opponent = new api.Fighter(170, false);

    player.updatePlayerControls({ j: true }, opponent);
    player.updatePlayerControls({}, opponent);
    player.attackCooldown = 0;
    player.updatePlayerControls({ j: true }, opponent);

    assert.equal(player.lastAttackType, 'comboPunch');
    assert.equal(player.comboFlashTimer, 18);
    assert.equal(player.comboHintText, '');
    assert(api.getState().floatingTexts.some((text) => text.text === 'COMBO x2'));
});

test('J,K combo creates punch kick visual feedback', () => {
    const { api } = loadGame();
    const player = new api.Fighter(100, true);
    const opponent = new api.Fighter(220, false);

    player.updatePlayerControls({ j: true }, opponent);
    player.updatePlayerControls({}, opponent);
    player.attackCooldown = 0;
    player.updatePlayerControls({ k: true }, opponent);

    assert.equal(player.lastAttackType, 'comboKick');
    assert.equal(player.comboFlashTimer, 18);
    assert(api.getState().floatingTexts.some((text) => text.text === 'PUNCH+KICK'));
});

test('K,K triggers back kick combo damage and cooldown', () => {
    const { api } = loadGame();
    const player = new api.Fighter(100, true);
    const opponent = new api.Fighter(220, false);

    player.updatePlayerControls({ k: true }, opponent);
    player.updatePlayerControls({}, opponent);
    player.attackCooldown = 0;
    player.updatePlayerControls({ k: true }, opponent);

    assert.equal(player.state, 'kick');
    assert.equal(player.attackCooldown, 36);
    assert.equal(opponent.health, 64);
    assert.equal(player.lastAttackType, 'backKick');
    assert.equal(player.comboFlashTimer, 18);
    assert(api.getState().floatingTexts.some((text) => text.text === 'BACK KICK'));
});

test('arrow keys move and jump like WASD controls', () => {
    const { api } = loadGame();
    const player = new api.Fighter(100, true);
    const opponent = new api.Fighter(220, false);

    player.updatePlayerControls({ arrowright: true }, opponent);
    assert.equal(player.velX, 5);
    assert.equal(player.state, 'walk');

    player.velX = 0;
    player.state = 'idle';
    player.updatePlayerControls({ arrowleft: true }, opponent);
    assert.equal(player.velX, -5);
    assert.equal(player.state, 'walk');

    player.updatePlayerControls({ arrowup: true }, opponent);
    assert.equal(player.velY, -18);
    assert.equal(player.onGround, false);
    assert.equal(player.state, 'jump');
});

test('crouch stops movement and prevents attacks', () => {
    const { api } = loadGame();
    const player = new api.Fighter(100, true);
    const opponent = new api.Fighter(170, false);

    player.updatePlayerControls({ c: true, arrowright: true, j: true }, opponent);

    assert.equal(player.state, 'crouch');
    assert.equal(player.velX, 0);
    assert.equal(player.attackCooldown, 0);
    assert.equal(opponent.health, 100);
});

test('block takes precedence over crouch', () => {
    const { api } = loadGame();
    const player = new api.Fighter(100, true);
    const opponent = new api.Fighter(170, false);

    player.updatePlayerControls({ s: true, c: true }, opponent);

    assert.equal(player.state, 'block');
});

test('I key blocks near attack controls', () => {
    const { api } = loadGame();
    const player = new api.Fighter(100, true);
    const opponent = new api.Fighter(170, false);

    player.updatePlayerControls({ i: true }, opponent);

    assert.equal(player.state, 'block');
    assert.equal(player.velX, 0);
});

test('crouch lowers body box under punches but remains vulnerable to kicks', () => {
    const { api } = loadGame();
    const attacker = new api.Fighter(100, true);
    const defender = new api.Fighter(220, false);

    defender.updatePlayerControls({ arrowdown: true }, attacker);
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

test('special attack consumes full energy and deals heavy damage', () => {
    const { api } = loadGame();
    const { player, opponent } = createFighters(api, 100, 220);
    giveEnergy(player);

    player.updatePlayerControls({ l: true }, opponent);

    assert.equal(player.state, 'special');
    assert.equal(player.energy, 0);
    assert.equal(opponent.health, 74);
    assert.equal(api.getState().specialFlash.color, player.accentColor);
    assert(api.getState().floatingTexts.some((text) => text.text === 'SPECIAL!'));
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

    player.updatePlayerControls({ j: true }, opponent);

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
    assert(state.textCalls.includes('P1  VS  AI'));
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

test('CPU decision helper chooses deterministic defensive and offensive actions', () => {
    const { api } = loadGame();
    const difficulty = {
        approachLong: 0.85,
        approachMid: 0.60,
        retreatMid: 0.80,
        jumpMid: 0.95,
        punchClose: 0.40,
        kickClose: 0.75,
        blockClose: 0.90
    };

    assert.equal(api.chooseAIAction({ dist: 130, health: 100, energy: 0, onGround: true, opponentAttacking: true, canPunch: false, canKick: false, difficulty, rand: 0.5 }), 'block');
    assert.equal(api.chooseAIAction({ dist: 120, health: 20, energy: 0, onGround: true, opponentAttacking: false, canPunch: false, canKick: false, difficulty, rand: 0.2 }), 'retreat');
    assert.equal(api.chooseAIAction({ dist: 300, health: 100, energy: 0, onGround: true, opponentAttacking: false, canPunch: false, canKick: false, difficulty, rand: 0.2 }), 'approach');
    assert.equal(api.chooseAIAction({ dist: 80, health: 100, energy: 100, onGround: true, opponentAttacking: false, canPunch: true, canKick: true, difficulty, rand: 0.1 }), 'special');
    assert.equal(api.chooseAIAction({ dist: 80, health: 100, energy: 0, onGround: true, opponentAttacking: false, canPunch: true, canKick: false, difficulty, rand: 0.2 }), 'punch');
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

test('improved CPU blocks incoming close attacks', () => {
    const { api } = loadGame();
    const cpu = new api.Fighter(180, false);
    const opponent = new api.Fighter(100, true);
    opponent.state = 'punch';

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
    assert.match(state.winnerTextHtml, /Bug Exterminator/);
    assert.match(state.winnerTextHtml, /Marcador: 2-0/);
    assert.match(state.winnerTextHtml, /Dificultad: NORMAL/);
    assert.match(state.winnerTextHtml, /Arena: CUADERNO/);
    assert.match(state.winnerTextHtml, /Racha: 1 \| Mejor: 1/);
    assert.match(state.winnerTextHtml, /Bug eliminado/);
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
    assert(state.textCalls.includes('WIN'));
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
    api.update(2500);
    assert.equal(api.getState().roundTimeMs, 57500);

    api.pauseGame();
    api.update(2500);
    assert.equal(api.getState().roundTimeMs, 57500);
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
