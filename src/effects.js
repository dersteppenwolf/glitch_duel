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
