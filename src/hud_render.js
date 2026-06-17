function drawHealthBars() {
    if (!player1 || !player2) return;

    drawHealthBar(50, 30, player1.health, player1.displayHealth, false, player1.accentColor);
    drawHealthBar(WIDTH - 354, 30, player2.health, player2.displayHealth, true, player2.accentColor);

    ctx.font = `bold 20px ${GAME_FONT_FAMILY}`;
    ctx.fillStyle = '#000';
    ctx.textAlign = 'left';
    ctx.fillText(`${t('human')}: ${player1.health}%`, 50, 23);
    drawEnergyBar(52, 62, player1.energy, false, player1.accentColor);
    ctx.fillStyle = '#000';
    ctx.textAlign = 'right';
    ctx.fillText(`${t('cpuAI')}: ${player2.health}%`, WIDTH - 50, 23);
    drawEnergyBar(WIDTH - 252, 62, player2.energy, true, player2.accentColor);
    ctx.fillStyle = '#000';

    ctx.textAlign = 'center';
    ctx.fillText(`${t('round')} ${currentRound}  ${playerRounds}-${cpuRounds}  ${Math.ceil(roundTimeMs / 1000)}`, WIDTH / 2, 23);
}

function drawHealthBar(x, y, health, displayHealth, alignRight, accentColor = '#000') {
    const width = 304;
    const height = 26;
    const inset = 3;
    const innerWidth = width - inset * 2;
    const innerHeight = height - inset * 2;
    const healthWidth = Math.max(0, Math.min(innerWidth, (health / 100) * innerWidth));
    const displayWidth = Math.max(0, Math.min(innerWidth, (displayHealth / 100) * innerWidth));

    ctx.fillStyle = '#fffdf2';
    ctx.fillRect(x, y, width, height);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 4;
    ctx.strokeRect(x, y, width, height);
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 3, y + 3, width - 6, height - 6);

    if (displayWidth > 0) {
        ctx.fillStyle = '#9ca3af';
        ctx.fillRect(alignRight ? x + width - inset - displayWidth : x + inset, y + inset, displayWidth, innerHeight);
    }

    if (healthWidth > 0) {
        ctx.fillStyle = getHealthBarColor(health);
        ctx.fillRect(alignRight ? x + width - inset - healthWidth : x + inset, y + inset, healthWidth, innerHeight);
    }

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
        const markerX = x + (width / 4) * i;
        ctx.beginPath();
        ctx.moveTo(markerX, y + 3);
        ctx.lineTo(markerX, y + height - 3);
        ctx.stroke();
    }
}

function getHealthBarColor(health) {
    if (health <= 30) return '#e11d48';
    if (health <= 60) return '#facc15';
    return '#22c55e';
}

function drawEnergyBar(x, y, energy, alignRight, accentColor = '#000') {
    const width = 200;
    const height = 12;
    const fillWidth = Math.max(0, Math.min(width, energy * 2));
    const full = energy >= MAX_ENERGY;

    ctx.fillStyle = '#fffdf2';
    ctx.fillRect(x, y, width, height);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, width, height);
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 2, y + 2, width - 4, height - 4);

    if (fillWidth > 0) {
        ctx.fillStyle = full ? '#ffd400' : '#00d5ff';
        ctx.fillRect(alignRight ? x + width - fillWidth : x, y, fillWidth, height);
    }

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
        const markerX = x + (width / 4) * i;
        ctx.beginPath();
        ctx.moveTo(markerX, y + 1);
        ctx.lineTo(markerX, y + height - 1);
        ctx.stroke();
    }

    if (full) {
        ctx.font = `bold 10px ${GAME_FONT_FAMILY}`;
        ctx.fillStyle = '#000';
        ctx.textAlign = 'center';
        ctx.fillText('SPECIAL', x + width / 2, y + 10);
    }
}

function drawStatusMessage() {
    if (!statusMessage) return;

    const alpha = Math.min(1, Math.max(0.65, statusTimer / 20));
    const accent = getStatusAccent(statusMessage);
    const panelWidth = Math.min(620, Math.max(260, statusMessage.length * 34));
    const panelHeight = 86;
    const x = WIDTH / 2 - panelWidth / 2;
    const y = 84;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.78)';
    ctx.fillRect(x + 10, y + 10, panelWidth, panelHeight);
    ctx.fillStyle = '#fffdf2';
    ctx.fillRect(x, y, panelWidth, panelHeight);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 6;
    ctx.strokeRect(x, y, panelWidth, panelHeight);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 4;
    ctx.strokeRect(x + 10, y + 10, panelWidth - 20, panelHeight - 20);

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + 20, y - 10);
    ctx.lineTo(x + 54, y + 6);
    ctx.moveTo(x + panelWidth - 20, y + panelHeight + 10);
    ctx.lineTo(x + panelWidth - 58, y + panelHeight - 6);
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.font = `bold 58px ${GAME_FONT_FAMILY}`;
    ctx.lineWidth = 12;
    ctx.strokeStyle = '#000';
    ctx.strokeText(statusMessage, WIDTH / 2, y + 61);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#fffdf2';
    ctx.strokeText(statusMessage, WIDTH / 2, y + 61);
    ctx.fillStyle = accent;
    ctx.fillText(statusMessage, WIDTH / 2, y + 61);
    ctx.restore();
}

function getStatusAccent(text) {
    if (text === t('ko')) return '#e11d48';
    if (text === t('time')) return '#f59e0b';
    if (text === t('fight')) return '#22c55e';
    if (text === t('blockStatus')) return '#2563eb';
    if (text === t('roundHuman')) return '#1d4ed8';
    if (text === t('roundCpu')) return '#b91c1c';
    if (text.startsWith(t('round'))) return '#7c2d12';
    return '#111';
}

function drawVsIntro() {
    if (vsIntroTimer <= 0) return;

    const alpha = Math.min(1, Math.max(0.25, vsIntroTimer / VS_INTRO_FRAMES));

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = '#fffdf2';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 7;
    ctx.fillRect(190, 112, 620, 220);
    ctx.strokeRect(190, 112, 620, 220);

    ctx.textAlign = 'center';
    ctx.font = `bold 34px ${GAME_FONT_FAMILY}`;
    ctx.fillStyle = '#111';
    ctx.fillText(`${t('round')} ${currentRound}`, WIDTH / 2, 155);
    ctx.font = `bold 58px ${GAME_FONT_FAMILY}`;
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#000';
    ctx.strokeText('P1  VS  AI', WIDTH / 2, 235);
    ctx.fillStyle = '#ffcc00';
    ctx.fillText('P1  VS  AI', WIDTH / 2, 235);
    ctx.font = `bold 20px ${GAME_FONT_FAMILY}`;
    ctx.fillStyle = '#111';
    ctx.fillText(`${getDifficultyLabel()} | ${getArenaLabel()}`, WIDTH / 2, 285);
    ctx.restore();
}

function drawImpactFlash() {
    if (!impactFlash) return;

    const progress = impactFlash.timer / impactFlash.maxTimer;
    const radius = 34 + (1 - progress) * 28;

    ctx.save();
    ctx.globalAlpha = Math.max(0, progress * 0.85);
    ctx.strokeStyle = impactFlash.color;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(impactFlash.x, impactFlash.y, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 / 8) * i;
        const inner = radius * 0.45;
        const outer = radius + 22;
        ctx.beginPath();
        ctx.moveTo(impactFlash.x + Math.cos(angle) * inner, impactFlash.y + Math.sin(angle) * inner);
        ctx.lineTo(impactFlash.x + Math.cos(angle) * outer, impactFlash.y + Math.sin(angle) * outer);
        ctx.stroke();
    }
    ctx.restore();
}

function drawSpecialFlash() {
    if (!specialFlash) return;

    const progress = specialFlash.timer / specialFlash.maxTimer;
    const beamLength = 170 + (1 - progress) * 90;
    const beamHeight = 28 + (1 - progress) * 18;
    const startX = specialFlash.x;
    const endX = startX + specialFlash.direction * beamLength;

    ctx.save();
    ctx.globalAlpha = Math.max(0, progress * 0.75);
    if (specialFlash.fullFlash) {
        ctx.fillStyle = specialFlash.color;
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
        ctx.globalAlpha = Math.max(0, progress * 0.9);
    }

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = beamHeight;
    ctx.beginPath();
    ctx.moveTo(startX, specialFlash.y);
    ctx.lineTo(endX, specialFlash.y - 8);
    ctx.stroke();

    ctx.strokeStyle = specialFlash.color;
    ctx.lineWidth = Math.max(8, beamHeight * 0.45);
    ctx.beginPath();
    ctx.moveTo(startX, specialFlash.y);
    ctx.lineTo(endX, specialFlash.y - 8);
    ctx.stroke();

    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(startX, specialFlash.y, 34 + (1 - progress) * 24, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
}
