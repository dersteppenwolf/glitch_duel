class Fighter {
    constructor(x, isPlayer1) {
        this.x = x;
        this.y = GROUND_Y;
        this.width = 60;
        this.height = 110;
        this.isPlayer1 = isPlayer1;
        this.label = isPlayer1 ? 'HUMANO' : 'CPU';
        this.labelKey = isPlayer1 ? 'human' : 'cpu';
        this.accentColor = isPlayer1 ? '#1f6feb' : '#d22';
        this.visualRole = isPlayer1 ? 'human' : 'cpu';
        this.rivalKey = isPlayer1 ? '' : 'nullPointer';
        this.rivalDetail = isPlayer1 ? '' : 'pointer';
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
        this.pendingComboInput = '';
        this.comboTimer = 0;
        this.comboHintText = '';
        this.comboHintTimer = 0;
        this.comboFlashTimer = 0;
        this.lastAttackType = '';
        this.prevPunchPressed = false;
        this.prevKickPressed = false;
        this.prevSpecialPressed = false;
        this.aiCounterTimer = 0;
        this.aiMemory = this.createAIMemory();
        this.airAttackUsed = false;
        this.styleKey = 'balanced';
        this.moveSpeedModifier = 1;
        this.damageModifier = 1;
        this.energyModifier = 1;
    }

    createAIMemory() {
        return {
            attack: 0,
            block: 0,
            attacks: { punch: 0, kick: 0, special: 0, air: 0 },
            zones: {
                close: { ground: 0, air: 0 },
                mid: { ground: 0, air: 0 },
                far: { ground: 0, air: 0 }
            },
            repeatedType: '',
            repeatedCount: 0,
            observingAttack: false
        };
    }

    applyStyle(styleKey) {
        const style = FIGHTER_STYLES[styleKey] || FIGHTER_STYLES.balanced;
        this.styleKey = FIGHTER_STYLES[styleKey] ? styleKey : 'balanced';
        this.moveSpeedModifier = style.moveSpeed;
        this.damageModifier = style.damage;
        this.energyModifier = style.energy;
        this.health = Math.round(100 * style.health);
        this.displayHealth = this.health;
    }

    applyRival(rivalKey) {
        if (this.isPlayer1) return;

        const rival = CPU_RIVALS[rivalKey] || CPU_RIVALS.nullPointer;
        this.rivalKey = CPU_RIVALS[rivalKey] ? rivalKey : 'nullPointer';
        this.labelKey = rival.labelKey;
        this.label = rival.labelKey;
        this.accentColor = rival.accentColor;
        this.rivalDetail = rival.detail;
    }

    update(keys, opponent) {
        this.facingRight = opponent.x >= this.x;

        const wasInHitStun = this.hitStun > 0;

        if (this.hitStun > 0) this.hitStun--;

        if (this.attackCooldown > 0) {
            this.attackCooldown--;
        }

        if (this.comboTimer > 0) {
            this.comboTimer--;
            if (this.comboTimer === 0) this.clearComboSequence();
        }

        if (this.comboHintTimer > 0) {
            this.comboHintTimer--;
            if (this.comboHintTimer === 0) this.comboHintText = '';
        }

        if (this.comboFlashTimer > 0) {
            this.comboFlashTimer--;
        }

        if (this.aiCounterTimer > 0) {
            this.aiCounterTimer--;
        }

        if (wasInHitStun) {
            this.clearComboSequence();
            this.state = 'hit';
            this.applyPhysics();
            return;
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

    updatePlayerControls(actions, opponent) {
        const blockPressed = !!actions.block;
        const crouchPressed = !!actions.crouch;
        const jumpPressed = !!actions.jump;

        if (blockPressed) {
            this.clearComboSequence();
            this.state = 'block';
            this.velX = 0;
        } else if (crouchPressed && this.onGround) {
            this.clearComboSequence();
            if (this.attackCooldown === 0) this.state = 'crouch';
            this.velX = 0;
        } else {
            if (actions.left) {
                this.velX = -5 * this.moveSpeedModifier;
                if (this.onGround && this.attackCooldown === 0) this.state = 'walk';
            }

            if (actions.right) {
                this.velX = 5 * this.moveSpeedModifier;
                if (this.onGround && this.attackCooldown === 0) this.state = 'walk';
            }

            if (jumpPressed && this.onGround) {
                this.clearComboSequence();
                this.velY = -18;
                this.onGround = false;
                this.state = 'jump';
            }
        }

        const punchPressed = !!actions.punch;
        const kickPressed = !!actions.kick;
        const specialPressed = !!actions.special;

        // Only edges visible in this fixed-step snapshot are processed. A complete
        // tap between simulation steps is intentionally not queued by the Fighter.
        this.consumePendingCombo(opponent);

        if (specialPressed && !this.prevSpecialPressed) this.attack('special', opponent);
        if (punchPressed && !this.prevPunchPressed) this.handleAttackCommand(this.onGround ? 'punch' : 'airPunch', opponent);
        if (kickPressed && !this.prevKickPressed) this.handleAttackCommand(this.onGround ? 'kick' : 'airKick', opponent);

        this.prevPunchPressed = punchPressed;
        this.prevKickPressed = kickPressed;
        this.prevSpecialPressed = specialPressed;
    }

    clearComboSequence() {
        this.pendingComboInput = '';
        this.comboBuffer = [];
        this.comboTimer = 0;
        this.clearComboHint();
    }

    consumePendingCombo(opponent) {
        if (!this.pendingComboInput) return;
        if (this.hitStun > 0 || !this.onGround || this.state === 'block' || this.state === 'crouch' || this.state === 'jump' || this.comboTimer <= 0) {
            this.clearComboSequence();
            return;
        }
        if (this.attackCooldown > 0) return;

        const combo = `${this.comboBuffer[0]},${this.pendingComboInput}`;
        const comboType = {
            'punch,punch': 'comboPunch',
            'punch,kick': 'comboKick',
            'kick,kick': 'backKick'
        }[combo];

        if (!comboType) {
            this.clearComboSequence();
            return;
        }

        this.executeComboAttack(comboType, opponent);
    }

    handleAttackCommand(input, opponent) {
        if (input === 'airPunch' || input === 'airKick') {
            if (this.attackCooldown > 0 || this.state === 'block' || this.state === 'crouch') return;
            if (this.onGround || this.airAttackUsed) return;
            this.airAttackUsed = true;
            this.clearComboSequence();
            this.attack(input, opponent);
            if (this.isPlayer1) recordPlayerAirAttack();
            return;
        }

        if (input !== 'punch' && input !== 'kick') return;
        if (this.state === 'block' || this.state === 'crouch') {
            this.clearComboSequence();
            return;
        }

        if (this.attackCooldown > 0) {
            if (this.onGround && this.comboTimer > 0 && this.comboBuffer.length === 1 && (this.comboBuffer[0] === 'punch' || this.comboBuffer[0] === 'kick') && !this.pendingComboInput) {
                this.pendingComboInput = input;
            }
            return;
        }

        if (this.comboTimer <= 0) this.comboBuffer = [];

        this.comboBuffer.push(input);
        this.comboBuffer = this.comboBuffer.slice(-2);
        this.comboTimer = COMBO_WINDOW_FRAMES;

        const combo = this.comboBuffer.join(',');

        if (combo === 'punch,punch') {
            this.executeComboAttack('comboPunch', opponent);
        } else if (combo === 'punch,kick') {
            this.executeComboAttack('comboKick', opponent);
        } else if (combo === 'kick,kick') {
            this.executeComboAttack('backKick', opponent);
        } else {
            this.showComboHint(input);
            this.attack(input, opponent);
        }
    }

    executeComboAttack(type, opponent) {
        this.clearComboSequence();
        this.attack(type, opponent);
        if (this.isPlayer1) recordPlayerCombo();
        this.showComboFeedback(type);
    }

    showComboHint(input) {
        this.comboHintText = input === 'punch' ? `${t('punch')}...` : `${t('kick')}...`;
        this.comboHintTimer = Math.min(COMBO_WINDOW_FRAMES, 24);
    }

    clearComboHint() {
        this.comboHintText = '';
        this.comboHintTimer = 0;
    }

    showComboFeedback(type) {
        const labels = {
            comboPunch: t('comboX2'),
            comboKick: t('comboPunchKick'),
            backKick: t('comboBackKick')
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
        if (this.trainingBehavior === 'idle') {
            this.aiAction = 'idle';
            this.velX = 0;
            return;
        }

        if (this.trainingBehavior === 'block') {
            this.aiAction = 'block';
            this.state = 'block';
            this.velX = 0;
            return;
        }

        const dist = Math.abs(this.x - opponent.x);
        const difficulty = getDifficultyConfig();
        const opponentAttacking = opponent.state === 'punch' || opponent.state === 'kick' || opponent.state === 'special';
        const canPunch = this.canHitOpponent('punch', opponent);
        const canKick = this.canHitOpponent('kick', opponent);
        const canSpecial = this.canHitOpponent('special', opponent);
        const nearLeftWall = this.x <= 70;
        const nearRightWall = this.x >= WIDTH - 70;
        this.updateAIMemory(opponent, difficulty);
        this.aiDecisionTimer--;

        if (this.aiDecisionTimer <= 0) {
            this.aiDecisionTimer = difficulty.decisionMin + Math.floor(randomSimulation() * difficulty.decisionSpread);
            const rand = randomSimulation();
            this.aiAction = chooseAIAction({
                dist,
                health: this.health,
                energy: this.energy,
                onGround: this.onGround,
                opponentAttacking,
                canPunch,
                canKick,
                canSpecial,
                attackCooldown: this.attackCooldown,
                opponentHealth: opponent.health,
                x: this.x,
                opponentX: opponent.x,
                nearLeftWall,
                nearRightWall,
                counterTimer: this.aiCounterTimer,
                opponentAttackBias: this.aiMemory.attack / 100,
                opponentBlockBias: this.aiMemory.block / 100,
                ...this.getAIMemoryBiases(dist, opponent),
                difficulty,
                rand
            });
        }

        if (this.aiAction === 'approach') {
            this.velX = this.x < opponent.x ? difficulty.moveSpeed : -difficulty.moveSpeed;
            if (this.onGround && this.attackCooldown === 0) this.state = 'walk';
        } else if (this.aiAction === 'retreat') {
            const retreatBlocked = (this.x < opponent.x && nearLeftWall) || (this.x > opponent.x && nearRightWall);
            if (retreatBlocked) {
                this.velX = 0;
                if (this.onGround && this.attackCooldown === 0) this.state = 'block';
                this.aiAction = 'block';
            } else {
                this.velX = this.x < opponent.x ? -difficulty.moveSpeed : difficulty.moveSpeed;
                if (this.onGround && this.attackCooldown === 0) this.state = 'walk';
            }
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

    updateAIMemory(opponent, difficulty) {
        const decay = difficulty.patternMemoryDecay ?? 2;
        const gain = difficulty.patternMemoryGain ?? 12;
        this.aiMemory.attack = Math.max(0, this.aiMemory.attack - decay);
        this.aiMemory.block = Math.max(0, this.aiMemory.block - decay);
        Object.keys(this.aiMemory.attacks).forEach((type) => {
            this.aiMemory.attacks[type] = Math.max(0, this.aiMemory.attacks[type] - decay);
        });
        Object.keys(this.aiMemory.zones).forEach((zone) => {
            Object.keys(this.aiMemory.zones[zone]).forEach((state) => {
                this.aiMemory.zones[zone][state] = Math.max(0, this.aiMemory.zones[zone][state] - decay);
            });
        });

        const attackType = this.getObservedAttackType(opponent);
        if (attackType) {
            this.aiMemory.attack = Math.min(100, this.aiMemory.attack + gain);
            if (!this.aiMemory.observingAttack) {
                this.recordObservedAttack(opponent, attackType, gain);
                this.aiMemory.observingAttack = true;
            }
        } else {
            this.aiMemory.observingAttack = false;
        }
        if (opponent.state === 'block') {
            this.aiMemory.block = Math.min(100, this.aiMemory.block + gain);
        }
    }

    getObservedAttackType(opponent) {
        const attackingStates = ['punch', 'kick', 'special', 'airPunch', 'airKick'];
        if (!attackingStates.includes(opponent.state)) return null;

        const type = opponent.lastAttackType || opponent.state;
        if (type === 'special') return 'special';
        if (type === 'airPunch' || type === 'airKick') return 'air';
        if (type === 'punch' || type === 'comboPunch') return 'punch';
        if (type === 'kick' || type === 'comboKick' || type === 'backKick') return 'kick';
        return null;
    }

    getAIDistanceZone(dist) {
        if (dist <= 110) return 'close';
        if (dist <= 250) return 'mid';
        return 'far';
    }

    getAIOpponentState(opponent) {
        return opponent.onGround ? 'ground' : 'air';
    }

    recordObservedAttack(opponent, attackType, gain) {
        const dist = Math.abs(this.x - opponent.x);
        const zone = this.getAIDistanceZone(dist);
        const opponentState = this.getAIOpponentState(opponent);

        this.aiMemory.attacks[attackType] = Math.min(100, this.aiMemory.attacks[attackType] + gain * 2);
        this.aiMemory.zones[zone][opponentState] = Math.min(100, this.aiMemory.zones[zone][opponentState] + gain * 2);

        if (this.aiMemory.repeatedType === attackType) {
            this.aiMemory.repeatedCount = Math.min(6, this.aiMemory.repeatedCount + 1);
        } else {
            this.aiMemory.repeatedType = attackType;
            this.aiMemory.repeatedCount = 1;
        }
    }

    getAIMemoryBiases(dist, opponent) {
        const zone = this.getAIDistanceZone(dist);
        const opponentState = this.getAIOpponentState(opponent);
        return {
            opponentPunchBias: this.aiMemory.attacks.punch / 100,
            opponentKickBias: this.aiMemory.attacks.kick / 100,
            opponentSpecialBias: this.aiMemory.attacks.special / 100,
            opponentAirBias: this.aiMemory.attacks.air / 100,
            zoneAttackBias: this.aiMemory.zones[zone][opponentState] / 100,
            repeatedAttackBias: Math.max(0, this.aiMemory.repeatedCount - 2) / 4
        };
    }

    gainEnergy(amount) {
        this.energy = Math.min(MAX_ENERGY, this.energy + Math.round(amount * this.energyModifier));
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
            this.airAttackUsed = false;
        }
    }

    getHurtBox() {
        if (this.state === 'crouch') {
            return {
                x: this.x - 28,
                y: this.y - 28,
                width: 56,
                height: 63
            };
        }

        if (!this.onGround || this.state === 'airPunch' || this.state === 'airKick' || this.state === 'jump') {
            return {
                x: this.x - 24,
                y: this.y - 96,
                width: 48,
                height: 108
            };
        }

        return {
            x: this.x - 25,
            y: this.y - 100,
            width: 50,
            height: 135
        };
    }

    getBodyBox() {
        return this.getHurtBox();
    }

    getPushBox() {
        if (this.state === 'crouch') {
            return {
                x: this.x - 28,
                y: this.y - 48,
                width: 56,
                height: 48
            };
        }

        return {
            x: this.x - 28,
            y: this.y - 96,
            width: 56,
            height: 96
        };
    }

    getHitBox(type) {
        const attack = ATTACKS[type];
        if (!attack) return null;

        if (type === 'punch' || type === 'comboPunch' || type === 'special' || type === 'airPunch') {
            return {
                x: this.facingRight ? this.x + attack.xOffset : this.x - attack.xOffset - attack.range,
                y: this.y + attack.yOffset,
                width: attack.range,
                height: attack.height
            };
        }

        if (type === 'kick' || type === 'comboKick' || type === 'backKick' || type === 'airKick') {
            return {
                x: this.facingRight ? this.x + attack.xOffset : this.x - attack.xOffset - attack.range,
                y: this.y + attack.yOffset,
                width: attack.range,
                height: attack.height
            };
        }

        return null;
    }

    getAttackBox(type) {
        return this.getHitBox(type);
    }

    intersects(a, b) {
        return a.x < b.x + b.width &&
            a.x + a.width > b.x &&
            a.y < b.y + b.height &&
            a.y + a.height > b.y;
    }

    canHitOpponent(type, opponent) {
        const attackBox = this.getAttackBox(type);
        return !!attackBox && this.intersects(attackBox, opponent.getHurtBox());
    }

    attack(type, opponent) {
        if (this.attackCooldown > 0 || this.state === 'block' || this.state === 'crouch') return;

        const attack = ATTACKS[type];
        if (!attack) return;

        if (type === 'special') {
            if (this.energy < SPECIAL_ENERGY_COST) return;
            this.energy -= SPECIAL_ENERGY_COST;
            if (this.isPlayer1) recordPlayerSpecial();
            triggerSpecialFeedback(this);
        }

        this.lastAttackType = type;
        this.state = attack.animation || type;
        this.attackCooldown = attack.cooldown;
        playAttackSound(type);

        const attackBox = this.getAttackBox(type);
        const opponentBox = opponent.getHurtBox();

        if (attackBox && this.intersects(attackBox, opponentBox)) {
            opponent.takeHit(Math.round(attack.damage * this.damageModifier), this);
            if (type !== 'special') this.gainEnergy(ENERGY_GAIN_ON_HIT);
        }
    }

    takeHit(damage, attacker) {
        const impactDirection = attacker.facingRight ? 1 : -1;

        this.clearComboSequence();

        if (this.state === 'block') {
            damage = Math.floor(damage * BLOCK_DAMAGE_MULTIPLIER);
            this.health = Math.max(0, this.health - damage);
            this.gainEnergy(ENERGY_GAIN_ON_BLOCK);
            if (this.isPlayer1) recordPlayerBlock();
            if (!this.isPlayer1) {
                const difficulty = getDifficultyConfig();
                this.aiCounterTimer = difficulty.counterWindow ?? 14;
                this.aiDecisionTimer = 0;
            }
            const bTexts = ['¡BLOCK!', '*ping*', 'CHIP'];
            floatingTexts.push(new FloatingText(this.x, this.y - 80, bTexts[Math.floor(randomCosmetic() * bTexts.length)], '#33f'));
            showStatusMessage(t('blockStatus'), 28);
            triggerImpactFeedback(this.x, this.y - 50, impactDirection, true);
            playImpactSound(attacker.lastAttackType, true);
            return;
        }

        this.health = Math.max(0, this.health - damage);
        this.gainEnergy(ENERGY_GAIN_ON_DAMAGE);
        this.hitStun = 20;
        this.state = 'hit';
        this.velX = attacker.facingRight ? 7 : -7;
        this.velY = -5;
        this.onGround = false;
        triggerImpactFeedback(this.x, this.y - 55, impactDirection, false, attacker.accentColor);
        playImpactSound(attacker.lastAttackType);

        if (!this.isPlayer1) this.aiDecisionTimer = 0;

        const texts = ['¡ZAP!', '¡SPLAT!', '¡BOOM!', '404', 'NaN', '¡OW!', 'Segmentation Fault', 'Python 2.7', 'Compiling...', 'Buffer Overflow'];
        floatingTexts.push(new FloatingText(this.x, this.y - 70, texts[Math.floor(randomCosmetic() * texts.length)], '#c00'));
    }

    draw() {
        drawFighter(this);
    }
}
