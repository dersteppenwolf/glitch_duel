class Fighter {
    constructor(x, isPlayer1) {
        this.x = x;
        this.y = GROUND_Y;
        this.width = 60;
        this.height = 110;
        this.isPlayer1 = isPlayer1;
        this.label = isPlayer1 ? 'HUMANO' : 'CPU';
        this.accentColor = isPlayer1 ? '#1f6feb' : '#d22';
        this.visualRole = isPlayer1 ? 'human' : 'cpu';
        this.health = 100;
        this.displayHealth = 100;
        this.energy = 0;
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
        this.comboBuffer = [];
        this.comboTimer = 0;
        this.comboHintText = '';
        this.comboHintTimer = 0;
        this.comboFlashTimer = 0;
        this.lastAttackType = '';
        this.prevPunchPressed = false;
        this.prevKickPressed = false;
        this.prevSpecialPressed = false;
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

        if (this.comboTimer > 0) {
            this.comboTimer--;
            if (this.comboTimer === 0) this.comboBuffer = [];
        }

        if (this.comboHintTimer > 0) {
            this.comboHintTimer--;
            if (this.comboHintTimer === 0) this.comboHintText = '';
        }

        if (this.comboFlashTimer > 0) {
            this.comboFlashTimer--;
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
        const blockPressed = !!(keys.s || keys.i || keys.block);
        const crouchPressed = !!(keys.c || keys.arrowdown || keys.crouch);

        if (blockPressed) {
            this.state = 'block';
            this.velX = 0;
        } else if (crouchPressed && this.onGround && this.attackCooldown === 0) {
            this.state = 'crouch';
            this.velX = 0;
        } else {
            if (keys.a || keys.arrowleft || keys.left) {
                this.velX = -5;
                if (this.onGround && this.attackCooldown === 0) this.state = 'walk';
            }

            if (keys.d || keys.arrowright || keys.right) {
                this.velX = 5;
                if (this.onGround && this.attackCooldown === 0) this.state = 'walk';
            }

            if ((keys.w || keys.arrowup || keys.jump) && this.onGround) {
                this.velY = -18;
                this.onGround = false;
                this.state = 'jump';
            }
        }

        const punchPressed = !!(keys.j || keys.punch);
        const kickPressed = !!(keys.k || keys.kick);
        const specialPressed = !!(keys.l || keys.special);

        if (specialPressed && !this.prevSpecialPressed) this.attack('special', opponent);
        if (punchPressed && !this.prevPunchPressed) this.handleAttackCommand('punch', opponent);
        if (kickPressed && !this.prevKickPressed) this.handleAttackCommand('kick', opponent);

        this.prevPunchPressed = punchPressed;
        this.prevKickPressed = kickPressed;
        this.prevSpecialPressed = specialPressed;
    }

    handleAttackCommand(input, opponent) {
        if (this.attackCooldown > 0 || this.state === 'block' || this.state === 'crouch') return;

        if (this.comboTimer <= 0) this.comboBuffer = [];

        this.comboBuffer.push(input);
        this.comboBuffer = this.comboBuffer.slice(-2);
        this.comboTimer = COMBO_WINDOW_FRAMES;

        const combo = this.comboBuffer.join(',');

        if (combo === 'punch,punch') {
            this.comboBuffer = [];
            this.clearComboHint();
            this.attack('comboPunch', opponent);
            this.showComboFeedback('comboPunch');
        } else if (combo === 'punch,kick') {
            this.comboBuffer = [];
            this.clearComboHint();
            this.attack('comboKick', opponent);
            this.showComboFeedback('comboKick');
        } else if (combo === 'kick,kick') {
            this.comboBuffer = [];
            this.clearComboHint();
            this.attack('backKick', opponent);
            this.showComboFeedback('backKick');
        } else {
            this.showComboHint(input);
            this.attack(input, opponent);
        }
    }

    showComboHint(input) {
        this.comboHintText = input === 'punch' ? 'J...' : 'K...';
        this.comboHintTimer = Math.min(COMBO_WINDOW_FRAMES, 24);
    }

    clearComboHint() {
        this.comboHintText = '';
        this.comboHintTimer = 0;
    }

    showComboFeedback(type) {
        const labels = {
            comboPunch: 'COMBO x2',
            comboKick: 'PUNCH+KICK',
            backKick: 'BACK KICK'
        };
        const colors = {
            comboPunch: '#d22',
            comboKick: '#c70',
            backKick: '#06f'
        };

        this.comboFlashTimer = 18;
        floatingTexts.push(new FloatingText(this.x, this.y - 122, labels[type], colors[type]));
    }

    updateAI(opponent) {
        const dist = Math.abs(this.x - opponent.x);
        const difficulty = getDifficultyConfig();
        const opponentAttacking = opponent.state === 'punch' || opponent.state === 'kick';
        const canPunch = this.canHitOpponent('punch', opponent);
        const canKick = this.canHitOpponent('kick', opponent);
        this.aiDecisionTimer--;

        if (this.aiDecisionTimer <= 0) {
            this.aiDecisionTimer = difficulty.decisionMin + Math.floor(Math.random() * difficulty.decisionSpread);
            const rand = Math.random();
            this.aiAction = chooseAIAction({
                dist,
                health: this.health,
                energy: this.energy,
                onGround: this.onGround,
                opponentAttacking,
                canPunch,
                canKick,
                difficulty,
                rand
            });
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
        } else if (this.aiAction === 'special') {
            this.attack('special', opponent);
        }
    }

    gainEnergy(amount) {
        this.energy = Math.min(MAX_ENERGY, this.energy + amount);
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

    getBodyBox() {
        if (this.state === 'crouch') {
            return {
                x: this.x - 28,
                y: this.y - 28,
                width: 56,
                height: 63
            };
        }

        return {
            x: this.x - 25,
            y: this.y - 100,
            width: 50,
            height: 135
        };
    }

    getAttackBox(type) {
        const attack = ATTACKS[type];
        if (!attack) return null;

        if (type === 'punch' || type === 'comboPunch' || type === 'special') {
            return {
                x: this.facingRight ? this.x + attack.xOffset : this.x - attack.xOffset - attack.range,
                y: this.y + attack.yOffset,
                width: attack.range,
                height: attack.height
            };
        }

        if (type === 'kick' || type === 'comboKick' || type === 'backKick') {
            return {
                x: this.facingRight ? this.x + attack.xOffset : this.x - attack.xOffset - attack.range,
                y: this.y + attack.yOffset,
                width: attack.range,
                height: attack.height
            };
        }

        return null;
    }

    intersects(a, b) {
        return a.x < b.x + b.width &&
            a.x + a.width > b.x &&
            a.y < b.y + b.height &&
            a.y + a.height > b.y;
    }

    canHitOpponent(type, opponent) {
        const attackBox = this.getAttackBox(type);
        return !!attackBox && this.intersects(attackBox, opponent.getBodyBox());
    }

    attack(type, opponent) {
        if (this.attackCooldown > 0 || this.state === 'block' || this.state === 'crouch') return;

        const attack = ATTACKS[type];
        if (!attack) return;

        if (type === 'special') {
            if (this.energy < SPECIAL_ENERGY_COST) return;
            this.energy -= SPECIAL_ENERGY_COST;
        }

        this.lastAttackType = type;
        this.state = attack.animation || type;
        this.attackCooldown = attack.cooldown;
        playPunchSound();

        const attackBox = this.getAttackBox(type);
        const opponentBox = opponent.getBodyBox();

        if (attackBox && this.intersects(attackBox, opponentBox)) {
            opponent.takeHit(attack.damage, this);
            if (type !== 'special') this.gainEnergy(ENERGY_GAIN_ON_HIT);
        }
    }

    takeHit(damage, attacker) {
        const impactDirection = attacker.facingRight ? 1 : -1;

        if (this.state === 'block') {
            damage = Math.floor(damage * BLOCK_DAMAGE_MULTIPLIER);
            this.health = Math.max(0, this.health - damage);
            this.gainEnergy(ENERGY_GAIN_ON_BLOCK);
            const bTexts = ['¡BLOCK!', '*ping*', 'CHIP'];
            floatingTexts.push(new FloatingText(this.x, this.y - 80, bTexts[Math.floor(Math.random() * bTexts.length)], '#33f'));
            showStatusMessage('BLOCK', 28);
            triggerImpactFeedback(this.x, this.y - 50, impactDirection, true);
            playHitSound();
            return;
        }

        this.health = Math.max(0, this.health - damage);
        this.gainEnergy(ENERGY_GAIN_ON_DAMAGE);
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
        drawFighter(this);
    }
}
