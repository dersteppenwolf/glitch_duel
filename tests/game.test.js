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
    const storage = new Map();
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
            localStorage: {
                getItem(key) { return storage.has(key) ? storage.get(key) : null; },
                setItem(key, value) { storage.set(key, value); },
                clear() { storage.clear(); }
            },
            addEventListener(type, handler) {
                windowListeners[type] = handler;
            }
        }
    };

    context.globalThis = context;

    const sourceFiles = ['config.js', 'audio.js', 'effects.js', 'ai.js', 'fighter_render.js', 'fighter.js', 'game.js'];
    const source = sourceFiles
        .map((file) => fs.readFileSync(path.join(__dirname, '..', 'src', file), 'utf8'))
        .join('\n');
    const exposeTestApi = `
        globalThis.__gameTest = {
            Fighter,
            FloatingText,
            ImpactParticle,
            chooseAIAction,
            drawFighter,
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
            setArena,
            getArenaConfig,
            drawBackground,
            setReducedMotion,
            recordMatchResult,
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
                currentRound,
                playerRounds,
                cpuRounds,
                roundTimerFrames,
                roundTimeMs,
                selectedArena,
                reducedMotionEnabled,
                stats,
                screenShake,
                hitStopFrames,
                canvasWidth: canvas.width,
                canvasHeight: canvas.height,
                canvasStyle: { ...canvas.style },
                mainMenuDisplay: document.getElementById('main-menu').style.display,
                helpScreenDisplay: document.getElementById('help-screen').style.display,
                pauseScreenDisplay: document.getElementById('pause-screen').style.display,
                pauseSummaryText: document.getElementById('pause-summary').textContent,
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
        windowListeners
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

test('reduced motion limits shake hit-stop and impact particles', () => {
    const { api, context } = loadGame();

    api.setReducedMotion(true);
    api.triggerImpactFeedback(120, 300, 1);

    const state = api.getState();
    assert.equal(state.reducedMotionEnabled, true);
    assert.equal(state.reducedMotionToggleChecked, true);
    assert.equal(context.window.localStorage.getItem('xkcdKombatReducedMotion'), 'true');
    assert.equal(state.screenShake, 0);
    assert.equal(state.hitStopFrames, 0);
    assert.equal(state.impactParticles.length, 5);
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
    assert(state.textCalls.includes('HUMANO'));
    assert(state.textCalls.includes('CPU'));
    assert(state.ctxCalls.includes('strokeRect'));
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
    assert.equal(api.getArenaConfig().label, 'CAFETERIA');

    api.setArena('meeting');
    assert.equal(api.getState().selectedArena, 'meeting');
    assert.equal(api.getArenaConfig().label, 'REUNION PRESENCIAL');

    api.setArena('remoteMeeting');
    assert.equal(api.getState().selectedArena, 'remoteMeeting');
    assert.equal(api.getArenaConfig().label, 'REUNION REMOTA');

    api.setArena('missing');
    assert.equal(api.getState().selectedArena, 'notebook');
    assert.equal(api.getArenaConfig().label, 'CUADERNO');
});

test('new arena backgrounds render themed canvas primitives', () => {
    const { api } = loadGame();

    api.setArena('cafeteria');
    api.drawBackground();
    api.setArena('meeting');
    api.drawBackground();
    api.setArena('remoteMeeting');
    api.drawBackground();

    const state = api.getState();
    assert(state.ctxCalls.includes('strokeRect'));
    assert(state.ctxCalls.includes('fillRect'));
    assert(state.textCalls.includes('COFFEE'));
    assert(state.textCalls.includes('THIS COULD BE AN EMAIL'));
    assert(state.textCalls.includes("YOU'RE MUTED"));
});

test('local stats track wins, losses, and best streak', () => {
    const { api } = loadGame();

    api.recordMatchResult(true);
    api.recordMatchResult(true);
    api.recordMatchResult(false);

    const stats = api.getState().stats;
    assert.equal(stats.wins, 2);
    assert.equal(stats.losses, 1);
    assert.equal(stats.currentStreak, 0);
    assert.equal(stats.bestStreak, 2);
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

test('round system advances rounds and ends match at two wins', () => {
    const { api } = loadGame();

    api.initGame();
    api.getState().player2.health = 0;
    api.update();

    let state = api.getState();
    assert.equal(state.playerRounds, 1);
    assert.equal(state.cpuRounds, 0);
    assert.equal(state.currentRound, 2);
    assert.equal(state.gameState, 'playing');

    state.player2.health = 0;
    api.update();

    state = api.getState();
    assert.equal(state.playerRounds, 2);
    assert.equal(state.gameState, 'gameOver');
});

test('round timer awards round to fighter with more health', () => {
    const { api } = loadGame();

    api.initGame();
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
    api.update(2500);
    assert.equal(api.getState().roundTimeMs, 57500);

    api.pauseGame();
    api.update(2500);
    assert.equal(api.getState().roundTimeMs, 57500);
});

test('round timer tie starts another round without scoring', () => {
    const { api } = loadGame();

    api.initGame();
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
