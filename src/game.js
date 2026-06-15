const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const WIDTH = 1000;
const HEIGHT = 500;
const GROUND_Y = 380;
const MAX_DEVICE_PIXEL_RATIO = 2;
const DIFFICULTIES = {
    easy: {
        decisionMin: 22,
        decisionSpread: 14,
        moveSpeed: 3.5,
        approachLong: 0.65,
        approachMid: 0.45,
        retreatMid: 0.75,
        jumpMid: 0.88,
        punchClose: 0.25,
        kickClose: 0.52,
        blockClose: 0.78
    },
    normal: {
        decisionMin: 12,
        decisionSpread: 10,
        moveSpeed: 4.5,
        approachLong: 0.85,
        approachMid: 0.60,
        retreatMid: 0.80,
        jumpMid: 0.95,
        punchClose: 0.40,
        kickClose: 0.75,
        blockClose: 0.90
    },
    hard: {
        decisionMin: 7,
        decisionSpread: 6,
        moveSpeed: 5.2,
        approachLong: 0.95,
        approachMid: 0.72,
        retreatMid: 0.86,
        jumpMid: 0.93,
        punchClose: 0.52,
        kickClose: 0.88,
        blockClose: 0.96
    }
};

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

class FloatingText {
    constructor(x, y, text, color = '#c00') {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.life = 60;
        this.vy = -2.0;
    }

    update() {
        this.y += this.vy;
        this.life--;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.life / 60;
        ctx.font = 'bold 24px "Comic Sans MS"';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 4;
        ctx.strokeText(this.text, this.x, this.y);
        ctx.fillStyle = this.color;
        ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
    }
}

class ImpactParticle {
    constructor(x, y, vx, vy, color, type = 'dot') {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.type = type;
        this.life = 18;
        this.maxLife = 18;
        this.size = 4 + Math.random() * 5;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.9;
        this.vy *= 0.9;
        this.life--;
    }

    draw() {
        const alpha = Math.max(0, this.life / this.maxLife);

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = this.color;
        ctx.fillStyle = this.color;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';

        if (this.type === 'line') {
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x - this.vx * 3, this.y - this.vy * 3);
            ctx.stroke();
        } else {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * alpha, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

class Fighter {
    constructor(x, isPlayer1) {
        this.x = x;
        this.y = GROUND_Y;
        this.width = 60;
        this.height = 110;
        this.isPlayer1 = isPlayer1;
        this.health = 100;
        this.velX = 0;
        this.velY = 0;
        this.facingRight = isPlayer1;
        this.state = 'idle';
        this.frame = 0;
        this.attackCooldown = 0;
        this.hitStun = 0;
        this.onGround = true;
        this.aiDecisionTimer = 0;
        this.aiAction = 'idle';
    }

    update(keys, opponent) {
        this.facingRight = opponent.x >= this.x;

        if (this.hitStun > 0) {
            this.hitStun--;
            this.state = 'hit';
            this.applyPhysics();
            return;
        }

        if (this.attackCooldown > 0) {
            this.attackCooldown--;
        }

        this.velX = 0;
        if (this.onGround && this.attackCooldown === 0) this.state = 'idle';

        if (this.isPlayer1) {
            this.updatePlayerControls(keys, opponent);
        } else {
            this.updateAI(opponent);
        }

        this.applyPhysics();
        this.frame++;
    }

    updatePlayerControls(keys, opponent) {
        if (keys.a || keys.left) {
            this.velX = -5;
            if (this.onGround && this.attackCooldown === 0) this.state = 'walk';
        }

        if (keys.d || keys.right) {
            this.velX = 5;
            if (this.onGround && this.attackCooldown === 0) this.state = 'walk';
        }

        if ((keys.w || keys.jump) && this.onGround) {
            this.velY = -18;
            this.onGround = false;
            this.state = 'jump';
        }

        if (keys.s || keys.block) {
            this.state = 'block';
            this.velX = 0;
        }

        if (keys.j || keys.punch) this.attack('punch', opponent);
        if (keys.k || keys.kick) this.attack('kick', opponent);
    }

    updateAI(opponent) {
        const dist = Math.abs(this.x - opponent.x);
        const difficulty = getDifficultyConfig();
        this.aiDecisionTimer--;

        if (this.aiDecisionTimer <= 0) {
            this.aiDecisionTimer = difficulty.decisionMin + Math.floor(Math.random() * difficulty.decisionSpread);
            const rand = Math.random();

            if (dist > 250) {
                this.aiAction = rand < difficulty.approachLong ? 'approach' : 'idle';
            } else if (dist > 110) {
                if (rand < difficulty.approachMid) this.aiAction = 'approach';
                else if (rand < difficulty.retreatMid) this.aiAction = 'retreat';
                else if (rand < difficulty.jumpMid && this.onGround) this.aiAction = 'jump';
                else this.aiAction = 'block';
            } else {
                if (rand < difficulty.punchClose) this.aiAction = 'punch';
                else if (rand < difficulty.kickClose) this.aiAction = 'kick';
                else if (rand < difficulty.blockClose) this.aiAction = 'block';
                else this.aiAction = 'retreat';
            }
        }

        if (this.aiAction === 'approach') {
            this.velX = this.x < opponent.x ? difficulty.moveSpeed : -difficulty.moveSpeed;
            if (this.onGround && this.attackCooldown === 0) this.state = 'walk';
        } else if (this.aiAction === 'retreat') {
            this.velX = this.x < opponent.x ? -difficulty.moveSpeed : difficulty.moveSpeed;
            if (this.onGround && this.attackCooldown === 0) this.state = 'walk';
        } else if (this.aiAction === 'jump' && this.onGround) {
            this.velY = -18;
            this.onGround = false;
            this.state = 'jump';
            this.aiAction = 'idle';
        } else if (this.aiAction === 'block') {
            this.state = 'block';
            this.velX = 0;
        } else if (this.aiAction === 'punch') {
            this.attack('punch', opponent);
        } else if (this.aiAction === 'kick') {
            this.attack('kick', opponent);
        }
    }

    applyPhysics() {
        this.velY += 0.9;
        this.x += this.velX;
        this.y += this.velY;

        if (this.x < 50) this.x = 50;
        if (this.x > WIDTH - 50) this.x = WIDTH - 50;

        if (this.y > GROUND_Y) {
            this.y = GROUND_Y;
            this.velY = 0;
            this.onGround = true;
        }
    }

    attack(type, opponent) {
        if (this.attackCooldown > 0 || this.state === 'block') return;

        this.state = type;
        this.attackCooldown = type === 'punch' ? 15 : 22;
        playPunchSound();

        const dist = Math.abs(this.x - opponent.x);
        const range = type === 'punch' ? 100 : 140;
        const facingOpponent = (this.facingRight && opponent.x > this.x) || (!this.facingRight && opponent.x < this.x);

        if (dist < range && facingOpponent) {
            opponent.takeHit(type === 'punch' ? 10 : 16, this);
        }
    }

    takeHit(damage, attacker) {
        const impactDirection = attacker.facingRight ? 1 : -1;

        if (this.state === 'block') {
            damage = Math.floor(damage * 0.15);
            const bTexts = ['¡BLOCK!', '*ping*', '0% Damage'];
            floatingTexts.push(new FloatingText(this.x, this.y - 80, bTexts[Math.floor(Math.random() * bTexts.length)], '#33f'));
            triggerImpactFeedback(this.x, this.y - 50, impactDirection, true);
            playHitSound();
            return;
        }

        this.health = Math.max(0, this.health - damage);
        this.hitStun = 20;
        this.state = 'hit';
        this.velX = attacker.facingRight ? 7 : -7;
        this.velY = -5;
        this.onGround = false;
        triggerImpactFeedback(this.x, this.y - 55, impactDirection);
        playHitSound();

        if (!this.isPlayer1) this.aiDecisionTimer = 0;

        const texts = ['¡ZAP!', '¡SPLAT!', '¡BOOM!', '404', 'NaN', '¡OW!', 'Segmentation Fault', 'Python 2.7', 'Compiling...', 'Buffer Overflow'];
        floatingTexts.push(new FloatingText(this.x, this.y - 70, texts[Math.floor(Math.random() * texts.length)], '#c00'));
    }

    draw() {
        ctx.save();
        const baseX = this.x;
        const baseY = this.y;

        if (!this.facingRight) {
            ctx.scale(-1, 1);
            ctx.translate(-baseX * 2, 0);
        }

        const legAngle = this.state === 'walk' && this.onGround ? Math.sin(this.frame / 3) * 20 : 0;
        const headBob = this.state === 'hit' ? Math.sin(this.frame / 2) * 5 : 0;

        ctx.strokeStyle = '#111';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.moveTo(baseX, baseY - 20);
        ctx.lineTo(baseX - 15 + Math.sin(legAngle * Math.PI / 180) * 12, baseY + 35);
        ctx.stroke();

        if (this.state !== 'kick') {
            ctx.beginPath();
            ctx.moveTo(baseX, baseY - 20);
            ctx.lineTo(baseX + 15 - Math.sin(legAngle * Math.PI / 180) * 12, baseY + 35);
            ctx.stroke();
        }

        ctx.beginPath();
        ctx.moveTo(baseX, baseY - 55);
        ctx.lineTo(baseX, baseY - 20);
        ctx.stroke();

        ctx.lineWidth = 4.5;
        ctx.beginPath();
        ctx.moveTo(baseX, baseY - 48);
        ctx.quadraticCurveTo(baseX - 18, baseY - 35, baseX - 12, baseY - 15);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(baseX, baseY - 48);

        if (this.state === 'punch') {
            ctx.lineTo(baseX + 52, baseY - 48);
        } else if (this.state === 'kick') {
            ctx.quadraticCurveTo(baseX + 15, baseY - 35, baseX + 22, baseY - 20);
        } else if (this.state === 'block') {
            ctx.lineTo(baseX + 15, baseY - 65);
            ctx.lineTo(baseX + 15, baseY - 35);
        } else {
            ctx.quadraticCurveTo(baseX + 18, baseY - 35, baseX + 12, baseY - 15);
        }

        ctx.stroke();

        if (this.state === 'punch') {
            const fistX = baseX + 62;
            const fistY = baseY - 48;

            ctx.strokeStyle = 'rgba(0, 0, 0, 0.22)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(baseX + 22, fistY - 10);
            ctx.lineTo(baseX + 48, fistY - 10);
            ctx.moveTo(baseX + 16, fistY + 10);
            ctx.lineTo(baseX + 42, fistY + 10);
            ctx.stroke();

            ctx.fillStyle = '#fff';
            ctx.strokeStyle = '#111';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.ellipse(fistX, fistY, 11, 9, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.strokeStyle = '#111';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(fistX - 3, fistY - 8);
            ctx.lineTo(fistX - 3, fistY + 8);
            ctx.moveTo(fistX + 3, fistY - 8);
            ctx.lineTo(fistX + 3, fistY + 8);
            ctx.stroke();
        }

        if (this.state === 'kick') {
            const footX = baseX + 54;
            const footY = baseY - 3;

            ctx.strokeStyle = 'rgba(0, 0, 0, 0.22)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(baseX + 36, baseY - 6, 25, -0.45, 0.45);
            ctx.stroke();

            ctx.strokeStyle = '#111';
            ctx.lineWidth = 5.5;
            ctx.beginPath();
            ctx.moveTo(baseX, baseY - 20);
            ctx.lineTo(baseX + 32, baseY - 10);
            ctx.lineTo(footX, footY);
            ctx.stroke();

            ctx.fillStyle = '#fff';
            ctx.strokeStyle = '#111';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.ellipse(footX + 5, footY + 1, 13, 7, 0.18, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }

        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#111';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(baseX, baseY - 75 + headBob, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.arc(baseX + 6, baseY - 78 + headBob, 3, 0, Math.PI * 2);
        ctx.fill();

        if (this.state === 'block') {
            ctx.fillStyle = 'rgba(100, 150, 255, 0.25)';
            ctx.strokeStyle = 'rgba(50, 100, 255, 0.6)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(baseX + 10, baseY - 45, 55, -Math.PI / 2, Math.PI / 2);
            ctx.fill();
            ctx.stroke();
        }

        ctx.restore();
    }
}

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

function getDifficultyConfig() {
    return DIFFICULTIES[selectedDifficulty] || DIFFICULTIES.normal;
}

function setDifficulty(value) {
    selectedDifficulty = DIFFICULTIES[value] ? value : 'normal';
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

function initGame() {
    player1 = new Fighter(250, true);
    player2 = new Fighter(750, false);
    floatingTexts = [];
    impactParticles = [];
    keys = {};
    screenShake = 0;
    hitStopFrames = 0;
    gameState = 'playing';
    document.getElementById('game-over').style.display = 'none';
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('help-screen').style.display = 'none';
    document.getElementById('pause-screen').style.display = 'none';
    updateControlsVisibility();
}

function showMainMenu() {
    player1 = new Fighter(250, true);
    player2 = new Fighter(750, false);
    floatingTexts = [];
    impactParticles = [];
    keys = {};
    screenShake = 0;
    hitStopFrames = 0;
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
        gameState = 'gameOver';
        const winText = document.getElementById('winner-text');
        winText.innerHTML = player1.health <= 0 ? '¡LA MÁQUINA GANA!<br>🤖' : '¡SISTEMA DOMINADO!<br>😎';
        document.getElementById('game-over').style.display = 'block';
        document.getElementById('pause-screen').style.display = 'none';
        updateControlsVisibility();
    }
}

function updateEffects() {
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
