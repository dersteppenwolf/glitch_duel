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
        if (!reducedMotionEnabled) this.y += this.vy;
        this.life--;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.life / 60;
        ctx.font = `bold 24px ${GAME_FONT_FAMILY}`;
        ctx.textAlign = 'center';
        const textWidth = typeof ctx.measureText === 'function' ? ctx.measureText(this.text).width : this.text.length * 14;
        const margin = 16;
        const drawX = Math.max(margin + textWidth / 2, Math.min(WIDTH - margin - textWidth / 2, this.x));
        const safeTop = typeof HUD_SAFE_BOTTOM === 'number' ? HUD_SAFE_BOTTOM + 22 : 134;
        const drawY = Math.max(safeTop, Math.min(HEIGHT - 24, this.y));
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 4;
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
    impactParticles.push(cue);
}
