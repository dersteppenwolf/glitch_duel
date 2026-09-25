class FloatingText {
    constructor(x, y, text, color = '#c00', kind = 'hit') {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.life = 60;
        this.vy = -2.0;
        this.kind = kind;
        this.scale = 1;
    }

    update() {
        if (!reducedMotionEnabled) this.y += this.vy;
        this.life--;
        if (!reducedMotionEnabled && this.life > 50) this.scale = 1 + (this.life - 50) * 0.04;
        else this.scale = Math.max(0.85, this.scale - 0.01);
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = Math.min(1, this.life / 18);
        const emphasis = this.kind === 'special' ? 30 : (this.kind === 'combo' ? 27 : 22);
        const pop = reducedMotionEnabled ? 0 : Math.max(0, 6 - (60 - this.life));
        const baseFontSize = Math.min(emphasis + pop, (WIDTH - 64) / Math.max(1, this.text.length) * 1.5);
        const fontSize = baseFontSize * this.scale;
        ctx.font = `bold ${fontSize}px ${GAME_FONT_FAMILY}`;
        ctx.textAlign = 'center';
        const textWidth = typeof ctx.measureText === 'function' ? ctx.measureText(this.text).width : this.text.length * 14;
        const margin = 24;
        const drawX = Math.max(margin + textWidth / 2, Math.min(WIDTH - margin - textWidth / 2, this.x));
        const safeTop = typeof HUD_SAFE_BOTTOM === 'number' ? HUD_SAFE_BOTTOM + 22 : 134;
        const drawY = Math.max(safeTop, Math.min(HEIGHT - 24, this.y));
        ctx.fillStyle = VISUAL_PALETTE.text.primary;
        ctx.strokeStyle = VISUAL_PALETTE.text.shadow;
        ctx.lineWidth = this.kind === 'special' ? 3 : 2;
        ctx.fillRect(drawX - textWidth / 2 - 8, drawY - fontSize, textWidth + 16, fontSize + 7);
        ctx.strokeRect(drawX - textWidth / 2 - 8, drawY - fontSize, textWidth + 16, fontSize + 7);
        ctx.strokeStyle = VISUAL_PALETTE.text.outline;
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
        if (!reducedMotionEnabled && !['burst', 'shield', 'whiff', 'glitch'].includes(this.type)) {
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
            ctx.fillStyle = VISUAL_PALETTE.text.primary;
            ctx.lineWidth = 3;
            ctx.beginPath();
            for (let i = 0; i <= points; i++) {
                const angle = i * Math.PI * 2 / points;
                const r = this.type === 'burst' && i % 2 ? radius * 0.4 : radius;
                const px = this.x + Math.cos(angle) * r;
                const py = this.y + Math.sin(angle) * r;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
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
            ctx.arc(this.x, this.y, 16, -0.7, 0.2);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(this.x, this.y, 16, 0.6, 1.3);
            ctx.stroke();
        } else if (this.type === 'glitch') {
            ctx.lineWidth = 2;
            for (let i = 0; i < 4; i++) {
                const gx = this.x + (i - 1.5) * 6;
                const gy = this.y + (i % 2) * 4;
                ctx.strokeRect(gx - 3, gy - 1, 6 + i * 2, 3);
            }
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(this.x - 8, this.y + 6);
            ctx.lineTo(this.x + 8, this.y + 6);
            ctx.stroke();
        } else if (this.type === 'pixel') {
            ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size * 1.8, this.size * 0.65);
        } else if (this.type === 'line') {
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x - this.lineX, this.y - this.lineY);
            ctx.stroke();
        } else if (this.type === 'smoke') {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * (1 - this.life / this.maxLife * 0.5) * alpha, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * alpha, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

class TrailParticle {
    constructor(x, y, color, size = 4) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = size;
        this.life = 10;
        this.maxLife = 10;
    }

    update() {
        this.life--;
    }

    draw() {
        const alpha = Math.max(0, this.life / this.maxLife);
        ctx.save();
        ctx.globalAlpha = alpha * 0.5;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * alpha, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class GlitchSparks {
    constructor(x, y, color, count = 8) {
        this.particles = [];
        for (let i = 0; i < count; i++) {
            const angle = randomCosmetic() * Math.PI * 2;
            const speed = 1 + randomCosmetic() * 4;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 1,
                life: 8 + Math.floor(randomCosmetic() * 8),
                maxLife: 16,
                size: 1 + randomCosmetic() * 3
            });
        }
        this.color = color;
    }

    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            if (!reducedMotionEnabled) {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.1;
            }
            p.life--;
            if (p.life <= 0) this.particles.splice(i, 1);
        }
    }

    draw() {
        ctx.save();
        for (const p of this.particles) {
            const alpha = Math.max(0, p.life / p.maxLife);
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = this.color;
            ctx.lineWidth = p.size;
            ctx.beginPath();
            const offset = reducedMotionEnabled ? 0 : (p.life % 2 === 0 ? 3 : -3);
            ctx.moveTo(p.x, p.y - 4);
            ctx.lineTo(p.x + offset, p.y + 4);
            ctx.stroke();
        }
        ctx.restore();
    }

    isAlive() {
        return this.particles.length > 0;
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

function addTrailPart(part) {
    if (!trailParticles) return;
    if (trailParticles.length >= COMBAT_FEEDBACK.maxTrails) trailParticles.shift();
    trailParticles.push(part);
}

function addGlitchSparks(sparks) {
    if (!glitchSparksList) return;
    if (glitchSparksList.length >= COMBAT_FEEDBACK.maxGlitchSparks) glitchSparksList.shift();
    glitchSparksList.push(sparks);
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

function getVisualColorForKind(kind, role = 'player') {
    const palette = role === 'player' ? VISUAL_PALETTE.player : VISUAL_PALETTE.cpu;
    if (kind === 'special') return palette.special;
    if (kind === 'combo') return palette.combo;
    return palette.hit;
}

function getVisualPaletteForKind(kind) {
    if (kind === 'special') return VISUAL_PALETTE.special;
    if (kind === 'combo') return VISUAL_PALETTE.combo;
    if (kind === 'block') return VISUAL_PALETTE.block;
    if (kind === 'whiff') return VISUAL_PALETTE.whiff;
    return VISUAL_PALETTE.hit;
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
