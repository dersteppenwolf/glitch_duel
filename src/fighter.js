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
        this.aiPreviousDecisionAction = '';
        this.comboBuffer = [];
        this.pendingComboInput = '';
        this.comboTimer = 0;
        this.comboHintText = '';
        this.comboHintTimer = 0;
        this.comboFlashTimer = 0;
        this.lastAttackType = '';
        this.lastAttackOutcome = '';
        this.attackSequence = 0;
        this.prevPunchPressed = false;
        this.prevKickPressed = false;
        this.prevSpecialPressed = false;
        this.glitchCancelEnabled = false;
        this.glitchCancelUsed = false;
        this.glitchCancelFeedbackFrames = 0;
        this.aiCounterTimer = 0;
        this.aiPostHitTimer = 0;
        this.aiEscapeDirection = 0;
        this.aiMemory = this.createAIMemory();
        this.aiLearning = this.createAILearning();
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
            observingAttack: false,
            lastObservedAttackSequence: 0
        };
    }

    createAILearning() {
        return {
            table: new Float32Array(315),
            pendingTransition: null,
            pendingActionIdx: -1,
            pendingStateIdx: -1,
            closedThisDecision: false,
            updates: 0,
            _koPending: false
        };
    }

    resetAILearning() {
        this.aiLearning = this.createAILearning();
    }

    encodeLearningState(dist, opponent, difficulty) {
        const distIdx = dist <= 110 ? 0 : (dist <= 250 ? 1 : 2);
        let oppIdx;
        if (!opponent.onGround) oppIdx = 0;
        else if (opponent.lastAttackOutcome === 'whiff' && opponent.attackCooldown > 0) oppIdx = 1;
        else if (opponent.state === 'punch' || opponent.state === 'kick' || opponent.state === 'special') oppIdx = 2;
        else if (opponent.state === 'block') oppIdx = 3;
        else oppIdx = 4;
        const delta = this.health - opponent.health;
        const gap = difficulty.lateRoundHealthGap || 18;
        const healthIdx = delta >= gap ? 0 : (delta <= -gap ? 2 : 1);
        return ((distIdx * 5) + oppIdx) * 3 + healthIdx;
    }

    closeAITransition(opponent, difficulty, dist, nextStateIdx, nextLegalMask) {
        if (!this.aiLearning || !this.aiLearning.pendingTransition || this.aiLearning.closedThisDecision) return;
        const pt = this.aiLearning.pendingTransition;
        const damageDealt = pt.opponentHealth - opponent.health;
        const damageTaken = pt.cpuHealth - this.health;
        const reward = Math.max(-1, Math.min(1, (damageDealt - damageTaken) / (ATTACKS.special ? ATTACKS.special.damage : 14)));
        const table = this.aiLearning.table;
        const config = { alpha: 0.15, gamma: 0.80 };
        updateAIQValue(table, pt.stateIdx, pt.actionIdx, reward, nextStateIdx !== undefined ? nextStateIdx : -1,
            nextLegalMask || null, config);
        this.aiLearning.updates++;
        this.aiLearning.closedThisDecision = true;
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

    update(keys, opponent, aiContext) {
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

        if (this.glitchCancelFeedbackFrames > 0) this.glitchCancelFeedbackFrames--;

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
            this.updateAI(opponent, aiContext);
        }

        this.applyPhysics();
        this.frame++;
        if (this.aiPostHitTimer > 0) {
            this.aiPostHitTimer--;
            if (this.aiPostHitTimer === 0) this.aiDecisionTimer = 0;
        }
    }

    updatePlayerControls(actions, opponent) {
        const blockPressed = !!actions.block;
        const crouchPressed = !!actions.crouch;
        const jumpPressed = !!actions.jump;
        let postureInterrupted = false;

        if (blockPressed) {
            this.clearComboSequence();
            this.state = 'block';
            this.velX = 0;
            postureInterrupted = true;
        } else if (crouchPressed && this.onGround) {
            this.clearComboSequence();
            if (this.attackCooldown === 0) {
                this.state = 'crouch';
                postureInterrupted = true;
            }
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
                postureInterrupted = true;
            }
        }

        const punchPressed = !!actions.punch;
        const kickPressed = !!actions.kick;
        const specialPressed = !!actions.special;
        const punchEdge = punchPressed && !this.prevPunchPressed;
        const kickEdge = kickPressed && !this.prevKickPressed;
        const specialEdge = specialPressed && !this.prevSpecialPressed;

        if (postureInterrupted) this.endGlitchCancelSequence();
        if (this.glitchCancelUsed && this.attackCooldown === 0 && !this.pendingComboInput && !punchEdge && !kickEdge) {
            this.endGlitchCancelSequence();
        }

        // Only edges visible in this fixed-step snapshot are processed. A complete
        // tap between simulation steps is intentionally not queued by the Fighter.
        let cancelled = false;
        if (specialEdge && this.attackCooldown > 0 && this.glitchCancelEnabled) {
            cancelled = this.tryGlitchCancel();
            if (!cancelled) recordGlitchCancelAttempt(this);
        }

        const pendingExecuted = cancelled ? false : this.consumePendingCombo(opponent);

        if (!cancelled && specialEdge && !pendingExecuted) {
            if (this.glitchCancelEnabled && this.attackCooldown === 0) recordGlitchCancelAttempt(this);
            this.attack('special', opponent);
        }
        if (!cancelled && punchEdge) this.handleAttackCommand(this.onGround ? 'punch' : 'airPunch', opponent);
        if (!cancelled && kickEdge) this.handleAttackCommand(this.onGround ? 'kick' : 'airKick', opponent);

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

    canGlitchCancel() {
        const attack = ATTACKS[this.lastAttackType];
        return this.isPlayer1 && this.glitchCancelEnabled && !this.glitchCancelUsed &&
            !!attack && attack.glitchCancelable === true && this.lastAttackOutcome === 'whiff' &&
            this.onGround && this.hitStun === 0 && this.attackCooldown > 0 &&
            this.state !== 'block' && this.state !== 'crouch' && this.state !== 'jump' &&
            this.energy >= GLITCH_CANCEL_ENERGY_COST;
    }

    tryGlitchCancel() {
        if (!this.canGlitchCancel()) return false;
        const energyBefore = this.energy;
        this.energy -= GLITCH_CANCEL_ENERGY_COST;
        this.attackCooldown = 0;
        this.state = 'idle';
        this.velX = 0;
        this.clearComboSequence();
        this.glitchCancelUsed = true;
        this.glitchCancelFeedbackFrames = 10;
        recordCombatEvent({
            type: 'glitchCancel',
            frame: matchElapsedFrames,
            actor: 'player',
            attackType: this.lastAttackType,
            outcome: this.lastAttackOutcome,
            energyBefore,
            energyAfter: this.energy,
            cost: GLITCH_CANCEL_ENERGY_COST,
            sequence: this.attackSequence
        });
        triggerGlitchCancelFeedback(this);
        playGlitchCancelSound();
        return true;
    }

    endGlitchCancelSequence() {
        this.glitchCancelUsed = false;
    }

    consumePendingCombo(opponent) {
        if (!this.pendingComboInput) return false;
        if (this.hitStun > 0 || !this.onGround || this.state === 'block' || this.state === 'crouch' || this.state === 'jump' || this.comboTimer <= 0) {
            this.clearComboSequence();
            return false;
        }
        if (this.attackCooldown > 0) return false;

        const combo = `${this.comboBuffer[0]},${this.pendingComboInput}`;
        const comboType = {
            'punch,punch': 'comboPunch',
            'punch,kick': 'comboKick',
            'kick,kick': 'backKick'
        }[combo];

        if (!comboType) {
            this.clearComboSequence();
            return false;
        }

        this.executeComboAttack(comboType, opponent);
        return true;
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
        addCombatText(this.x, this.y - 122, labels[type], colors[type], 'combo');
    }

    // Forecast observed motion only. Attacks have no startup: frame zero is a
    // legal instant hit. Use the real boxes; execution rechecks them every tick.
    findAIIntercept(opponent, horizon, moveSpeed = 0, airborneOnly = false) {
        if (!this.onGround || horizon < 0 || (airborneOnly && opponent.onGround)) return null;
        const direction = opponent.x >= this.x ? 1 : -1;
        const hurtBox = opponent.getHurtBox();
        for (let frames = this.attackCooldown; frames <= Math.min(horizon, AI_TACTICS.interceptHorizon); frames++) {
            const targetY = opponent.onGround ? opponent.y : Math.min(GROUND_Y,
                opponent.y + opponent.velY * frames + FIGHTER_GRAVITY * frames * (frames + 1) / 2);
            if (airborneOnly && targetY >= GROUND_Y) continue;
            const targetX = Math.max(50, Math.min(WIDTH - 50, opponent.x + opponent.velX * frames));
            const ownX = Math.max(50, Math.min(WIDTH - 50, this.x + direction * moveSpeed * frames));
            if ((targetX - ownX) * direction <= 0) continue;
            const projectedHurt = { ...hurtBox, x: hurtBox.x + targetX - opponent.x, y: hurtBox.y + targetY - opponent.y };
            const types = airborneOnly || Math.abs(targetX - ownX) <= ATTACKS.punch.range ? ['punch', 'kick'] : ['kick', 'punch'];
            for (const type of types) {
                const box = this.getHitBox(type);
                const projectedHit = { ...box, x: box.x + ownX - this.x };
                if (this.intersects(projectedHit, projectedHurt)) return { type, frames };
            }
        }
        return null;
    }

    updateAI(opponent, aiContext = null) {
        const context = aiContext || {};
        const timedRound = context.timedRound === true;
        const lateRound = context.lateRound === true;
        const cpuBehind = context.cpuBehind === true;
        const latePressure = timedRound && lateRound && cpuBehind;

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

        if (this.aiLearning) this.aiLearning.closedThisDecision = false;

        const dist = Math.abs(this.x - opponent.x);
        const difficulty = getDifficultyConfig();
        const opponentAttacking = opponent.state === 'punch' || opponent.state === 'kick' || opponent.state === 'special';
        const canPunch = this.canHitOpponent('punch', opponent);
        const canKick = this.canHitOpponent('kick', opponent);
        const canSpecial = this.canHitOpponent('special', opponent);
        const canAirPunch = this.canHitOpponent('airPunch', opponent);
        const canAirKick = this.canHitOpponent('airKick', opponent);
        const nearLeftWall = this.x <= AI_TACTICS.wallMargin;
        const nearRightWall = this.x >= WIDTH - AI_TACTICS.wallMargin;
        const opponentCornered = (opponent.x < this.x && opponent.x <= AI_TACTICS.wallMargin) ||
            (opponent.x > this.x && opponent.x >= WIDTH - AI_TACTICS.wallMargin);
        if (this.onGround) this.aiEscapeDirection = 0;
        this.updateAIMemory(opponent, difficulty);
        const opponentSequenceChanged = opponent.attackSequence !== this.aiMemory.lastObservedAttackSequence;
        const opponentWhiffed = opponentSequenceChanged && opponent.lastAttackOutcome === 'whiff' && opponent.attackCooldown > 0;
        if (opponentWhiffed) this.aiDecisionTimer = 0;
        this.aiDecisionTimer--;

if (this.aiDecisionTimer <= 0) {
            this.aiDecisionTimer = difficulty.decisionMin + Math.floor(randomSimulation() * difficulty.decisionSpread);
            const rand = randomSimulation();

            if (this.aiLearning && this.aiLearning.pendingTransition && !this.aiLearning.closedThisDecision) {
                this.closeAITransition(opponent, difficulty, dist, null, null);
            }

            const isNeutral = dist > 110 || !((this.x < opponent.x && this.x <= AI_TACTICS.wallMargin) || (this.x > opponent.x && this.x >= WIDTH - AI_TACTICS.wallMargin));
            let candidates = null;
            if (this.aiLearning && isNeutral) {
                candidates = getAIDecisionCandidates({ dist, punchReady: this.attackCooldown <= 0 && canPunch, kickReady: this.attackCooldown <= 0 && canKick, retreatBlocked: (this.x < opponent.x && nearLeftWall) || (this.x > opponent.x && nearRightWall), opponentBlockBias: this.aiMemory.block / 100, difficulty });
            }

            this.aiAction = chooseAIAction({
                dist,
                health: this.health,
                energy: this.energy,
                onGround: this.onGround,
                opponentAttacking,
                canPunch,
                canKick,
                canSpecial,
                canAirPunch,
                canAirKick,
                airAttackUsed: this.airAttackUsed,
                attackCooldown: this.attackCooldown,
                opponentWhiffed,
                opponentRecovery: opponent.attackCooldown,
                whiffIntercept: opponentWhiffed && opponent.onGround
                    ? this.findAIIntercept(opponent, opponent.attackCooldown - difficulty.punishSafetyFrames - 1, difficulty.moveSpeed)
                    : null,
                antiAirIntercept: this.findAIIntercept(opponent, difficulty.antiAirHorizon, 0, true),
                opponentCornered,
                postHitPause: this.aiPostHitTimer > 0,
                opponentHealth: opponent.health,
                x: this.x,
                opponentX: opponent.x,
                nearLeftWall,
                nearRightWall,
                counterTimer: this.aiCounterTimer,
                opponentAttackBias: this.aiMemory.attack / 100,
                opponentBlockBias: this.aiMemory.block / 100,
                ...this.getAIMemoryBiases(dist, opponent),
                timedRound,
                lateRound,
                cpuBehind,
                previousDecision: this.aiPreviousDecisionAction,
                difficulty,
                rand
            });
            this.aiPreviousDecisionAction = this.aiAction;

            if (this.aiLearning && candidates && candidates.length > 0) {
                const stateIdx = this.encodeLearningState(dist, opponent, difficulty);
                const actionMap = { approach: 0, retreat: 1, block: 2, jump: 3, idle: 4, punch: 5, kick: 6 };
                const actionIdx = actionMap[this.aiAction];
                const legalMask = new Array(7).fill(false);
                candidates.forEach(([a]) => { const idx = actionMap[a]; if (idx !== undefined) legalMask[idx] = true; });
                this.aiLearning.pendingTransition = { stateIdx, actionIdx, legalMask, cpuHealth: this.health, opponentHealth: opponent.health };
                this.aiLearning.pendingStateIdx = stateIdx;
                this.aiLearning.pendingActionIdx = actionIdx;
                this.aiLearning.closedThisDecision = false;
            } else if (this.aiLearning) {
                this.aiLearning.pendingTransition = null;
                this.aiLearning.pendingActionIdx = -1;
                this.aiLearning.pendingStateIdx = -1;
            }

            if (opponentSequenceChanged) this.aiMemory.lastObservedAttackSequence = opponent.attackSequence;
        } else if (opponentSequenceChanged && !opponentWhiffed) {
            this.aiMemory.lastObservedAttackSequence = opponent.attackSequence;
        }

if (latePressure && this.onGround && this.aiAction === 'retreat') {
            if (opponentAttacking) {
                this.aiAction = 'block';
            } else {
                this.aiAction = chooseAIPressureAction(
                    dist,
                    this.attackCooldown === 0 && canPunch,
                    this.attackCooldown === 0 && canKick
                );
            }
        }

        if (this.aiLearning && this.aiLearning.pendingTransition && !this.aiLearning.closedThisDecision &&
            this.aiAction !== this.aiPreviousDecisionAction && this.aiAction !== 'idle' &&
            this.aiPreviousDecisionAction !== '' &&
            ((this.aiAction === 'block' && this.aiPreviousDecisionAction === 'retreat' &&
              ((this.x < opponent.x && nearLeftWall) || (this.x > opponent.x && nearRightWall))) ||
             (latePressure && ['retreat'].includes(this.aiPreviousDecisionAction)))) {
            this.aiLearning.pendingTransition = null;
            this.aiLearning.pendingActionIdx = -1;
            this.aiLearning.pendingStateIdx = -1;
        }

        if (this.aiPostHitTimer > 0) {
            this.aiAction = opponentAttacking && this.onGround && dist < 170 ? 'block' : 'idle';
        }

        if (this.aiAction === 'punish' || this.aiAction === 'antiAir') {
            const punish = this.aiAction === 'punish';
            const validWhiff = opponent.onGround && opponent.lastAttackOutcome === 'whiff' &&
                opponent.attackSequence === this.aiMemory.lastObservedAttackSequence;
            const intercept = !punish || validWhiff
                ? this.findAIIntercept(opponent, punish ? opponent.attackCooldown - difficulty.punishSafetyFrames - 1 : difficulty.antiAirHorizon,
                    punish ? difficulty.moveSpeed : 0, !punish)
                : null;
            this.velX = 0;
            if (!intercept) {
                this.aiAction = 'idle';
            } else if (intercept.frames === 0 && this.canHitOpponent(intercept.type, opponent)) {
                // A previous block posture must not swallow the chosen response.
                this.state = 'idle';
                this.attack(intercept.type, opponent);
                this.aiAction = 'idle';
            } else if (punish) {
                this.velX = this.x < opponent.x ? difficulty.moveSpeed : -difficulty.moveSpeed;
                if (this.attackCooldown === 0) this.state = 'walk';
            }
        } else if (this.aiAction === 'approach') {
            // Hold reachable spacing until the next scheduled decision; no extra attack or RNG roll.
            const inRange = this.onGround && canKick && !opponentAttacking;
            this.velX = inRange ? 0 : (this.x < opponent.x ? difficulty.moveSpeed : -difficulty.moveSpeed);
            if (this.onGround && this.attackCooldown === 0) this.state = inRange ? 'idle' : 'walk';
        } else if (this.aiAction === 'retreat') {
            const retreatBlocked = (this.x < opponent.x && nearLeftWall) || (this.x > opponent.x && nearRightWall);
            if (retreatBlocked) {
                this.velX = 0;
                if (this.onGround && this.attackCooldown === 0) this.state = 'block';
                this.aiAction = 'block';
            } else {
                const baitComplete = dist >= AI_TACTICS.baitMaxDistance && this.health > 30 &&
                    (this.aiMemory.attack > 50 || this.aiMemory.repeatedCount > 3);
                this.velX = baitComplete ? 0 : (this.x < opponent.x ? -difficulty.moveSpeed : difficulty.moveSpeed);
                if (this.onGround && this.attackCooldown === 0) this.state = baitComplete ? 'idle' : 'walk';
            }
        } else if ((this.aiAction === 'jump' || this.aiAction === 'escape') && this.onGround) {
            if (this.aiAction === 'escape') this.aiEscapeDirection = this.x < WIDTH / 2 ? 1 : -1;
            this.velY = -18;
            this.onGround = false;
            this.state = 'jump';
            this.aiAction = 'idle';
        } else if (this.aiAction === 'block' && this.onGround) {
            this.state = 'block';
            this.velX = 0;
        } else if (this.aiAction === 'crouch' && this.onGround) {
            this.state = 'crouch';
            this.velX = 0;
        } else if (this.aiAction === 'airPunch' || this.aiAction === 'airKick') {
            if (!this.onGround && !this.airAttackUsed && this.attackCooldown === 0 && this.canHitOpponent(this.aiAction, opponent)) {
                this.airAttackUsed = true;
                this.clearComboSequence();
                this.attack(this.aiAction, opponent);
            }
        } else if (this.aiAction === 'punch' && this.onGround) {
            this.attack('punch', opponent);
        } else if (this.aiAction === 'kick' && this.onGround) {
            this.attack('kick', opponent);
        } else if (this.aiAction === 'special' && this.onGround) {
            this.attack('special', opponent);
        }
        if (!this.onGround && this.aiEscapeDirection) this.velX = this.aiEscapeDirection * difficulty.moveSpeed;
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

    gainEnergy(amount, source = '') {
        const energyBefore = Math.max(0, Math.min(MAX_ENERGY, Math.round(this.energy)));
        this.energy = Math.min(MAX_ENERGY, this.energy + Math.round(amount * this.energyModifier));
        const energyAfter = Math.max(0, Math.min(MAX_ENERGY, Math.round(this.energy)));
        if (energyBefore < MAX_ENERGY && energyAfter >= MAX_ENERGY && ['hit', 'block', 'damage'].includes(source)) {
            recordCombatEvent({
                type: 'energyReady',
                frame: matchElapsedFrames,
                actor: this.isPlayer1 ? 'player' : 'cpu',
                source,
                energyBefore,
                energyAfter
            });
        }
    }

    applyPhysics() {
        this.velY += FIGHTER_GRAVITY;
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

    getHurtBoxForPosture(posture = 'standing') {
        if (posture === 'crouch') {
            return {
                x: this.x - 28,
                y: this.y - 28,
                width: 56,
                height: 63
            };
        }

        if (posture === 'air') {
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

    getDefenderPosture() {
        if (this.state === 'block') return 'block';
        if (this.state === 'crouch') return 'crouch';
        if (!this.onGround || this.state === 'airPunch' || this.state === 'airKick' || this.state === 'jump') return 'air';
        return 'standing';
    }

    getHurtBox() {
        const posture = this.getDefenderPosture();
        return this.getHurtBoxForPosture(posture === 'block' ? 'standing' : posture);
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

        const energyBefore = Math.max(0, Math.min(MAX_ENERGY, Math.round(this.energy)));

        if (type === 'special') {
            if (this.energy < SPECIAL_ENERGY_COST) return;
            this.energy -= SPECIAL_ENERGY_COST;
            if (this.isPlayer1) recordPlayerSpecial();
            triggerSpecialFeedback(this);
        }

        this.lastAttackType = type;
        this.attackSequence++;
        this.state = attack.animation || type;
        this.attackCooldown = attack.cooldown;
        playAttackSound(type);

        const attackBox = this.getAttackBox(type);
        const defenderState = opponent.getDefenderPosture();
        const opponentBox = opponent.getHurtBox();
        const standingBox = opponent.getHurtBoxForPosture('standing');
        const intersectsOpponent = !!attackBox && this.intersects(attackBox, opponentBox);
        const evadedByCrouch = !intersectsOpponent && defenderState === 'crouch' && !!attackBox && this.intersects(attackBox, standingBox);
        let outcome = 'whiff';
        let damageApplied = 0;
        const contactHighlight = opponent.hitStun > 0 ? '' : this.onGround && !opponent.onGround ? 'comicAntiAir'
            : (opponent.lastAttackOutcome === 'whiff' && opponent.attackCooldown > 0 ? 'comicPunish' : '');

        if (intersectsOpponent) {
            const healthBefore = opponent.health;
            const result = opponent.takeHit(Math.round(attack.damage * this.damageModifier), this, contactHighlight);
            damageApplied = result && Number.isFinite(result.damageApplied)
                ? result.damageApplied
                : Math.max(0, healthBefore - opponent.health);
            outcome = result && result.blocked ? 'blocked' : 'hit';
            if (type !== 'special') this.gainEnergy(ENERGY_GAIN_ON_HIT, 'hit');
        }

        const energyAfter = Math.max(0, Math.min(MAX_ENERGY, Math.round(this.energy)));
        this.lastAttackOutcome = outcome;
        if (outcome === 'whiff') triggerWhiffFeedback(attackBox, this.accentColor);
        recordCombatEvent({
            type: 'attackResolved',
            frame: matchElapsedFrames,
            actor: this.isPlayer1 ? 'player' : 'cpu',
            target: opponent.isPlayer1 ? 'player' : 'cpu',
            attackType: type,
            outcome,
            damageApplied,
            defenderState,
            evadedByCrouch,
            energyBefore,
            energyAfter,
            sequence: this.attackSequence
        });
    }

    takeHit(damage, attacker, contactHighlight = '') {
        const impactDirection = attacker.facingRight ? 1 : -1;

        this.clearComboSequence();
        this.endGlitchCancelSequence();

        if (this.state === 'block') {
            const healthBefore = this.health;
            damage = Math.floor(damage * BLOCK_DAMAGE_MULTIPLIER);
            this.health = Math.max(0, this.health - damage);
            this.gainEnergy(ENERGY_GAIN_ON_BLOCK, 'block');
            if (this.isPlayer1) recordPlayerBlock();
            if (!this.isPlayer1) {
                const difficulty = getDifficultyConfig();
                this.aiCounterTimer = difficulty.counterWindow ?? 14;
                this.aiDecisionTimer = 0;
            }
            addCombatText(this.x, this.y - 80, getImpactPhrase(attacker.lastAttackType, true), '#33f', 'block');
            showStatusMessage(t('blockStatus'), 28);
            triggerImpactFeedback(this.x, this.y - 50, impactDirection, true, attacker.accentColor, attacker);
            playImpactSound(attacker.lastAttackType, true);
            return { blocked: true, damageApplied: healthBefore - this.health };
        }

const healthBefore = this.health;
        this.health = Math.max(0, this.health - damage);
        if (!this.isPlayer1 && this.aiLearning && this.aiLearning.pendingTransition && !this.aiLearning.closedThisDecision && this.health <= 0) {
            this.aiLearning._koPending = true;
        }
        this.gainEnergy(ENERGY_GAIN_ON_DAMAGE, 'damage');
        this.hitStun = 20;
        this.state = 'hit';
        this.velX = attacker.facingRight ? 7 : -7;
        this.velY = -5;
        this.onGround = false;
        triggerImpactFeedback(this.x, this.y - 55, impactDirection, false, attacker.accentColor, attacker);
        playImpactSound(attacker.lastAttackType);

        if (!this.isPlayer1) {
            this.aiDecisionTimer = 0;
            this.aiAction = 'idle';
            this.aiEscapeDirection = 0;
            this.aiPostHitTimer = getDifficultyConfig().postHitPauseFrames;
        }

        const contextual = contactHighlight && combatCaptionFrames === 0;
        if (contextual) combatCaptionFrames = COMIC_FEEDBACK.cooldownFrames;
        addCombatText(this.x, this.y - 85, contextual ? t(contactHighlight) : getImpactPhrase(attacker.lastAttackType),
            attacker.accentColor, getCombatFeedbackKind(attacker.lastAttackType));
        return { blocked: false, damageApplied: healthBefore - this.health };
    }

    draw() {
        drawFighter(this);
    }
}
