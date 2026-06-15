const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const WIDTH = 1000;
const HEIGHT = 500;
const GROUND_Y = 380;

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

        if (keys.f || keys.punch) this.attack('punch', opponent);
        if (keys.g || keys.kick) this.attack('kick', opponent);
    }

    updateAI(opponent) {
        const dist = Math.abs(this.x - opponent.x);
        this.aiDecisionTimer--;

        if (this.aiDecisionTimer <= 0) {
            this.aiDecisionTimer = 12 + Math.floor(Math.random() * 10);
            const rand = Math.random();

            if (dist > 250) {
                this.aiAction = rand < 0.85 ? 'approach' : 'idle';
            } else if (dist > 110) {
                if (rand < 0.60) this.aiAction = 'approach';
                else if (rand < 0.80) this.aiAction = 'retreat';
                else if (rand < 0.95 && this.onGround) this.aiAction = 'jump';
                else this.aiAction = 'block';
            } else {
                if (rand < 0.40) this.aiAction = 'punch';
                else if (rand < 0.75) this.aiAction = 'kick';
                else if (rand < 0.90) this.aiAction = 'block';
                else this.aiAction = 'retreat';
            }
        }

        if (this.aiAction === 'approach') {
            this.velX = this.x < opponent.x ? 4.5 : -4.5;
            if (this.onGround && this.attackCooldown === 0) this.state = 'walk';
        } else if (this.aiAction === 'retreat') {
            this.velX = this.x < opponent.x ? -4.5 : 4.5;
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
        if (this.state === 'block') {
            damage = Math.floor(damage * 0.15);
            const bTexts = ['¡BLOCK!', '*ping*', '0% Damage'];
            floatingTexts.push(new FloatingText(this.x, this.y - 80, bTexts[Math.floor(Math.random() * bTexts.length)], '#33f'));
            playHitSound();
            return;
        }

        this.health = Math.max(0, this.health - damage);
        this.hitStun = 20;
        this.state = 'hit';
        this.velX = attacker.facingRight ? 7 : -7;
        this.velY = -5;
        this.onGround = false;
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

        ctx.beginPath();
        ctx.moveTo(baseX, baseY - 20);
        ctx.lineTo(baseX + 15 - Math.sin(legAngle * Math.PI / 180) * 12, baseY + 35);
        ctx.stroke();

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
            ctx.lineTo(baseX + 45, baseY - 48);
        } else if (this.state === 'kick') {
            ctx.quadraticCurveTo(baseX + 15, baseY - 35, baseX + 22, baseY - 20);
            ctx.strokeStyle = '#111';
            ctx.moveTo(baseX, baseY - 20);
            ctx.lineTo(baseX + 45, baseY - 5);
        } else if (this.state === 'block') {
            ctx.lineTo(baseX + 15, baseY - 65);
            ctx.lineTo(baseX + 15, baseY - 35);
        } else {
            ctx.quadraticCurveTo(baseX + 18, baseY - 35, baseX + 12, baseY - 15);
        }

        ctx.stroke();

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
let keys = {};
let gameState = 'menu';
let mobileControlsEnabled = false;

function initGame() {
    player1 = new Fighter(250, true);
    player2 = new Fighter(750, false);
    floatingTexts = [];
    keys = {};
    gameState = 'playing';
    document.getElementById('game-over').style.display = 'none';
    document.getElementById('main-menu').style.display = 'none';
    updateControlsVisibility();
}

function showMainMenu() {
    player1 = new Fighter(250, true);
    player2 = new Fighter(750, false);
    floatingTexts = [];
    keys = {};
    gameState = 'menu';
    document.getElementById('game-over').style.display = 'none';
    document.getElementById('main-menu').style.display = 'flex';
    updateControlsVisibility();
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

    player1.update(keys, player2);
    player2.update(keys, player1);
    checkCollision();

    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        floatingTexts[i].update();
        if (floatingTexts[i].life <= 0) floatingTexts.splice(i, 1);
    }

    if (player1.health <= 0 || player2.health <= 0) {
        gameState = 'gameOver';
        const winText = document.getElementById('winner-text');
        winText.innerHTML = player1.health <= 0 ? '¡LA MÁQUINA GANA!<br>🤖' : '¡SISTEMA DOMINADO!<br>😎';
        document.getElementById('game-over').style.display = 'block';
        updateControlsVisibility();
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
    drawBackground();
    if (player1 && player2) {
        player1.draw();
        player2.draw();
    }
    floatingTexts.forEach((t) => t.draw());
    drawHealthBars();
}

function updateControlsVisibility() {
    document.getElementById('controls').style.display = mobileControlsEnabled && gameState === 'playing' ? 'block' : 'none';
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
        keys[e.key.toLowerCase()] = true;
    });

    window.addEventListener('keyup', (e) => {
        keys[e.key.toLowerCase()] = false;
    });
}

function setupRestartButton() {
    document.getElementById('restart-button').addEventListener('click', initGame);
    document.getElementById('menu-button').addEventListener('click', showMainMenu);
}

function setupMainMenu() {
    document.getElementById('start-button').addEventListener('click', initGame);
}

window.addEventListener('load', () => {
    showMainMenu();
    setupMobileControls();
    setupKeyboardControls();
    setupMainMenu();
    setupRestartButton();
    gameLoop();
});
