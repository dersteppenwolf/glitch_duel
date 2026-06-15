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

    getBodyBox() {
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

        if (type === 'punch') {
            return {
                x: this.facingRight ? this.x + 20 : this.x - 20 - attack.range,
                y: this.y - 66,
                width: attack.range,
                height: 36
            };
        }

        if (type === 'kick') {
            return {
                x: this.facingRight ? this.x + 18 : this.x - 18 - attack.range,
                y: this.y - 32,
                width: attack.range,
                height: 42
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

    attack(type, opponent) {
        if (this.attackCooldown > 0 || this.state === 'block') return;

        const attack = ATTACKS[type];
        if (!attack) return;

        this.state = type;
        this.attackCooldown = attack.cooldown;
        playPunchSound();

        const attackBox = this.getAttackBox(type);
        const opponentBox = opponent.getBodyBox();

        if (attackBox && this.intersects(attackBox, opponentBox)) {
            opponent.takeHit(attack.damage, this);
        }
    }

    takeHit(damage, attacker) {
        const impactDirection = attacker.facingRight ? 1 : -1;

        if (this.state === 'block') {
            damage = Math.floor(damage * BLOCK_DAMAGE_MULTIPLIER);
            this.health = Math.max(0, this.health - damage);
            const bTexts = ['¡BLOCK!', '*ping*', 'CHIP'];
            floatingTexts.push(new FloatingText(this.x, this.y - 80, bTexts[Math.floor(Math.random() * bTexts.length)], '#33f'));
            showStatusMessage('BLOCK', 28);
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
