class FloatingText {
    constructor(x, y, text, color = '#c00', kind = 'hit') {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.life = 60;
        this.vy = -2.0;
        this.kind = kind;
    }

    update() {
        if (!reducedMotionEnabled) this.y += this.vy;
        this.life--;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = Math.min(1, this.life / 18);
        const emphasis = this.kind === 'special' ? 30 : (this.kind === 'combo' ? 27 : 22);
        const pop = reducedMotionEnabled ? 0 : Math.max(0, 6 - (60 - this.life));
        const fontSize = Math.min(emphasis + pop, (WIDTH - 64) / Math.max(1, this.text.length) * 1.5);
        ctx.font = `bold ${fontSize}px ${GAME_FONT_FAMILY}`;
        ctx.textAlign = 'center';
        const textWidth = typeof ctx.measureText === 'function' ? ctx.measureText(this.text).width : this.text.length * 14;
        const margin = 24;
        const drawX = Math.max(margin + textWidth / 2, Math.min(WIDTH - margin - textWidth / 2, this.x));
        const safeTop = typeof HUD_SAFE_BOTTOM === 'number' ? HUD_SAFE_BOTTOM + 22 : 134;
        const drawY = Math.max(safeTop, Math.min(HEIGHT - 24, this.y));
        ctx.fillStyle = '#fffdf2';
        ctx.strokeStyle = '#111';
        ctx.lineWidth = this.kind === 'special' ? 3 : 2;
        ctx.fillRect(drawX - textWidth / 2 - 8, drawY - fontSize, textWidth + 16, fontSize + 7);
        ctx.strokeRect(drawX - textWidth / 2 - 8, drawY - fontSize, textWidth + 16, fontSize + 7);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeText(this.text, drawX, drawY);
        ctx.fillStyle = this.color;
        ctx.fillText(this.text, drawX, drawY);
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
        this.lineX = vx * 3;
        this.lineY = vy * 3;
        this.life = 18;
        this.maxLife = 18;
        this.size = 4 + randomCosmetic() * 5;
    }

    update() {
        if (!reducedMotionEnabled && !['burst', 'shield', 'whiff'].includes(this.type)) {
            this.x += this.vx;
            this.y += this.vy;
        }
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

        if (this.type === 'burst' || this.type === 'shield') {
            const points = this.type === 'shield' ? 6 : 12;
            const radius = this.type === 'shield' ? 25 : 32;
            ctx.fillStyle = '#fffdf2';
            ctx.lineWidth = 3;
            ctx.beginPath();
            for (let i = 0; i <= points; i++) {
                const angle = i * Math.PI * 2 / points;
                const r = this.type === 'burst' && i % 2 ? radius * 0.4 : radius;
                const x = this.x + Math.cos(angle) * r;
                const y = this.y + Math.sin(angle) * r;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.fill();
            ctx.stroke();
            if (this.type === 'shield') {
                ctx.beginPath();
                ctx.moveTo(this.x - 7, this.y - 10);
                ctx.lineTo(this.x - 7, this.y + 10);
                ctx.moveTo(this.x + 7, this.y - 10);
                ctx.lineTo(this.x + 7, this.y + 10);
                ctx.stroke();
            }
        } else if (this.type === 'whiff') {
            ctx.lineWidth = 2;
            ctx.beginPath();
            // An open, broken arc distinguishes empty space from contact.
            ctx.arc(this.x, this.y, 16, -0.7, 0.2);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(this.x, this.y, 16, 0.6, 1.3);
            ctx.stroke();
        } else if (this.type === 'pixel') {
            ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size * 1.8, this.size * 0.65);
        } else if (this.type === 'line') {
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x - this.lineX, this.y - this.lineY);
            ctx.stroke();
        } else {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * alpha, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

function triggerWhiffFeedback(box, color) {
    if (!box) return;
    const cue = new ImpactParticle(box.x + box.width / 2, box.y + box.height / 2, 0, 0, color, 'whiff');
    cue.life = cue.maxLife = COMBAT_FEEDBACK.whiffFrames;
    addImpactParticle(cue);
}

function addImpactParticle(particle) {
    if (impactParticles.length >= COMBAT_FEEDBACK.maxParticles) impactParticles.shift();
    impactParticles.push(particle);
}

function addCombatText(x, y, text, color, kind = 'hit') {
    const nearby = floatingTexts.filter((label) => Math.abs(label.x - x) < 100 && Math.abs(label.y - y) < 34).length;
    if (floatingTexts.length >= COMBAT_FEEDBACK.maxTexts) floatingTexts.shift();
    floatingTexts.push(new FloatingText(x, y - nearby * 28, text, color, kind));
}

function getCombatFeedbackKind(type) {
    if (type === 'special') return 'special';
    return ['comboPunch', 'comboKick', 'backKick'].includes(type) ? 'combo' : 'hit';
}

function getCombatSignature(fighter) {
    const key = fighter ? (fighter.isPlayer1 ? fighter.styleKey : fighter.rivalKey) : 'balanced';
    return COMBAT_SIGNATURES[key] || COMBAT_SIGNATURES.balanced;
}

function getImpactPhrase(type, blocked = false) {
    const phrases = IMPACT_PHRASES[blocked ? 'block' : getCombatFeedbackKind(type)];
    return phrases[Math.floor(randomCosmetic() * phrases.length)];
}

// Local geometric glitches, never a framebuffer readback or a full-screen filter.
function drawCombatSignature(effect) {
    const signature = effect.signature;
    if (!signature) return;
    const age = effect.maxTimer - effect.timer;
    const spread = reducedMotionEnabled ? 0 : Math.min(18, age * 2);
    const x = Math.max(95, Math.min(WIDTH - 95, effect.x));
    const y = Math.max(HUD_SAFE_BOTTOM + 60, Math.min(HEIGHT - 72, effect.y));
    ctx.save();
    ctx.globalAlpha = Math.min(0.75, effect.timer / effect.maxTimer);
    ctx.strokeStyle = effect.color;
    ctx.fillStyle = effect.color;
    ctx.lineWidth = 2;
    for (let i = 0; i < signature.bands; i++) {
        const side = i % 2 ? 1 : -1;
        const bandY = y - 40 + i * 12;
        ctx.beginPath();
        if (signature.pattern === 'scan' || signature.pattern === 'pixels') {
            const width = 24 + i * 7;
            ctx.fillRect(x + side * (18 + spread) - width / 2, bandY, width, signature.pattern === 'pixels' ? 5 : 2);
        } else if (signature.pattern === 'echo') {
            ctx.strokeRect(x - 32 - i * (7 + spread / 5), y - 30, 64, 60);
        } else if (signature.pattern === 'pointer') {
            const edge = x + side * (44 + spread);
            ctx.moveTo(edge - side * 12, bandY);
            ctx.lineTo(edge, bandY);
            ctx.lineTo(edge, bandY + 9);
        } else if (signature.pattern === 'split') {
            ctx.moveTo(x + side * (16 + spread), bandY);
            ctx.lineTo(x + side * (40 + spread), bandY + 7);
            ctx.lineTo(x + side * (68 + spread), bandY + 7);
        } else if (signature.pattern === 'streak') {
            ctx.moveTo(x - effect.direction * (24 + spread), bandY);
            ctx.lineTo(x - effect.direction * (64 + spread + i * 3), bandY + 4);
        } else {
            const angle = i * Math.PI * 2 / signature.bands;
            ctx.moveTo(x + Math.cos(angle) * 36, y + Math.sin(angle) * 36);
            ctx.lineTo(x + Math.cos(angle + 0.12) * (48 + spread), y + Math.sin(angle + 0.12) * (48 + spread));
            ctx.lineTo(x + Math.cos(angle) * (signature.pattern === 'fracture' ? 76 : 60), y + Math.sin(angle) * 60);
        }
        ctx.stroke();
    }
    ctx.restore();
}
