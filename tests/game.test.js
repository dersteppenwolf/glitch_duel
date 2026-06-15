const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

function createMockContext() {
    const ctx = {
        lastTransform: null,
        save() {},
        restore() {},
        beginPath() {},
        moveTo() {},
        lineTo() {},
        quadraticCurveTo() {},
        arc() {},
        ellipse() {},
        fill() {},
        stroke() {},
        fillRect() {},
        clearRect() {},
        translate() {},
        scale() {},
        strokeText() {},
        fillText() {},
        setTransform(a, b, c, d, e, f) {
            this.lastTransform = [a, b, c, d, e, f];
        }
    };

    return ctx;
}

function createMockAudioContext() {
    return class MockAudioContext {
        constructor() {
            this.destination = {};
        }

        createOscillator() {
            return {
                type: '',
                frequency: { value: 0 },
                connect() { return this; },
                start() {},
                stop() {}
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

function loadGame() {
    const ctx = createMockContext();
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
                listeners: {},
                addEventListener(type, handler) {
                    this.listeners[type] = handler;
                }
            });
        }

        return elements.get(id);
    }

    const windowListeners = {};
    const MockAudioContext = createMockAudioContext();
    const context = {
        console,
        Math,
        setTimeout(fn) {
            fn();
            return 0;
        },
        requestAnimationFrame() {},
        navigator: { maxTouchPoints: 0 },
        document: { getElementById: getElement },
        window: {
            innerWidth: 800,
            innerHeight: 600,
            devicePixelRatio: 2,
            AudioContext: MockAudioContext,
            webkitAudioContext: MockAudioContext,
            addEventListener(type, handler) {
                windowListeners[type] = handler;
            }
        }
    };

    context.globalThis = context;

    const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'game.js'), 'utf8');
    const exposeTestApi = `
        globalThis.__gameTest = {
            Fighter,
            FloatingText,
            ImpactParticle,
            resizeCanvas,
            initGame,
            showMainMenu,
            showHelpScreen,
            hideHelpScreen,
            pauseGame,
            resumeGame,
            togglePause,
            setDifficulty,
            update,
            triggerImpactFeedback,
            getState: () => ({
                player1,
                player2,
                floatingTexts,
                impactParticles,
                gameState,
                selectedDifficulty,
                statusMessage,
                statusTimer,
                screenShake,
                hitStopFrames,
                canvasWidth: canvas.width,
                canvasHeight: canvas.height,
                canvasStyle: { ...canvas.style },
                mainMenuDisplay: document.getElementById('main-menu').style.display,
                helpScreenDisplay: document.getElementById('help-screen').style.display,
                pauseScreenDisplay: document.getElementById('pause-screen').style.display,
                pauseButtonDisplay: document.getElementById('pause-button').style.display,
                transform: ctx.lastTransform
            })
        };
    `;

    vm.runInNewContext(`${source}\n${exposeTestApi}`, context);

    return {
        api: context.__gameTest,
        context,
        elements,
        windowListeners
    };
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

test('J triggers punch damage when opponent is in range', () => {
    const { api } = loadGame();
    const player = new api.Fighter(100, true);
    const opponent = new api.Fighter(170, false);

    player.updatePlayerControls({ j: true }, opponent);

    assert.equal(player.state, 'punch');
    assert.equal(player.attackCooldown, 12);
    assert.equal(opponent.health, 92);
    assert.equal(opponent.hitStun, 20);
});

test('K triggers kick damage when opponent is in range', () => {
    const { api } = loadGame();
    const player = new api.Fighter(100, true);
    const opponent = new api.Fighter(220, false);

    player.updatePlayerControls({ k: true }, opponent);

    assert.equal(player.state, 'kick');
    assert.equal(player.attackCooldown, 24);
    assert.equal(opponent.health, 86);
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

test('game state gates simulation until a match starts', () => {
    const { api } = loadGame();

    api.showMainMenu();
    const menuState = api.getState();
    api.update();

    assert.equal(api.getState().gameState, 'menu');
    assert.equal(api.getState().player1.x, menuState.player1.x);

    api.initGame();

    assert.equal(api.getState().gameState, 'playing');
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

test('pause stops simulation and resume returns to playing', () => {
    const { api } = loadGame();

    api.initGame();
    const playingState = api.getState();
    api.pauseGame();

    const pausedState = api.getState();
    assert.equal(pausedState.gameState, 'paused');
    assert.equal(pausedState.pauseScreenDisplay, 'flex');
    assert.equal(pausedState.pauseButtonDisplay, 'none');

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

test('status indicator announces fight and block states', () => {
    const { api } = loadGame();
    const attacker = new api.Fighter(100, true);
    const defender = new api.Fighter(170, false);

    api.initGame();

    assert.equal(api.getState().statusMessage, 'FIGHT!');

    defender.state = 'block';
    defender.takeHit(14, attacker);

    const state = api.getState();
    assert.equal(state.statusMessage, 'BLOCK');
    assert.equal(state.statusTimer, 28);
});
