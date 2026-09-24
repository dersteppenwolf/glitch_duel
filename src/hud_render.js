const HUD_SAFE_BOTTOM = 112;

function drawHealthBars() {
    if (!player1 || !player2) return;

    drawHudPlate(34, 8, 340, 84, player1.accentColor);
    drawHudPlate(WIDTH - 374, 8, 340, 84, player2.accentColor);
    drawHudPlate(WIDTH / 2 - 92, 8, 184, 84, '#111');

    drawHealthBar(50, 34, player1.health, player1.displayHealth, false, player1.accentColor);
    drawHealthBar(WIDTH - 354, 34, player2.health, player2.displayHealth, true, player2.accentColor);

    ctx.font = `bold ${hudCompactMode ? 28 : 18}px ${GAME_FONT_FAMILY}`;
    ctx.fillStyle = '#000';
    ctx.textAlign = 'left';
    ctx.fillText(`${hudCompactMode ? 'P1' : t('human')}: ${player1.health}%`, 50, 26);

    if (!hudCompactMode && player1.accentColor !== '#1f6feb') {
        ctx.strokeStyle = player1.accentColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(50, 30);
        ctx.lineTo(50 + ctx.measureText(`${t('human')}: ${player1.health}%`).width, 30);
        ctx.stroke();
    }

    drawEnergyBar(52, 67, player1.energy, false, player1.accentColor, getSpecialActionState(player1));
    ctx.fillStyle = '#000';
    ctx.textAlign = 'right';
    ctx.fillText(`${hudCompactMode ? 'CPU' : (player2.labelKey ? t(player2.labelKey) : t('cpuAI'))}: ${player2.health}%`, WIDTH - 50, 26);

    if (!hudCompactMode && player2.labelKey) {
        ctx.strokeStyle = player2.accentColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        const labelWidth = ctx.measureText(`${t(player2.labelKey)}: ${player2.health}%`).width;
        ctx.moveTo(WIDTH - 50 - labelWidth, 30);
        ctx.lineTo(WIDTH - 50, 30);
        ctx.stroke();
    }

    if (hudCompactMode && player2.rivalDetail) {
        ctx.strokeStyle = player2.accentColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        const detail = player2.rivalDetail;
        const markerX = WIDTH - 360;
        if (detail === 'pointer') {
            ctx.moveTo(markerX, 24);
            ctx.lineTo(markerX + 8, 14);
            ctx.lineTo(markerX + 5, 24);
            ctx.lineTo(markerX + 10, 26);
        } else if (detail === 'lag') {
            ctx.strokeRect(markerX, 14, 2, 12);
            ctx.strokeRect(markerX + 5, 16, 2, 10);
            ctx.strokeRect(markerX + 10, 18, 2, 8);
        } else if (detail === 'merge') {
            ctx.moveTo(markerX, 14);
            ctx.lineTo(markerX + 14, 26);
            ctx.moveTo(markerX + 14, 14);
            ctx.lineTo(markerX, 26);
        } else if (detail === 'boss') {
            ctx.arc(markerX + 7, 20, 9, 0, Math.PI * 2);
        }
        ctx.stroke();
    }

    ctx.textAlign = 'center';
    ctx.font = `bold ${hudCompactMode ? 20 : 13}px ${GAME_FONT_FAMILY}`;
    ctx.fillStyle = '#000';
    ctx.fillText(`${t('round')} ${currentRound}`, WIDTH / 2, 26);
    ctx.font = `bold ${hudCompactMode ? 22 : 14}px ${GAME_FONT_FAMILY}`;
    ctx.fillStyle = '#000';
    ctx.fillText(`${playerRounds}-${cpuRounds}`, WIDTH / 2, 47);
    ctx.font = `bold ${hudCompactMode ? 32 : 28}px ${GAME_FONT_FAMILY}`;
    ctx.fillStyle = '#000';
    ctx.fillText(`${Math.ceil(roundTimeMs / 1000)}`, WIDTH / 2, 77);
}

function drawHudPlate(x, y, width, height, accentColor) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    ctx.fillRect(x + 6, y + 6, width, height);
    ctx.fillStyle = '#fffdf5';
    ctx.fillRect(x, y, width, height);
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 4;
    ctx.strokeRect(x, y, width, height);
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 7, y + 7, width - 14, height - 14);
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
    if (health > 0 && health <= COMBAT_FEEDBACK.dangerHealth) {
        const center = x + width / 2;
        ctx.fillStyle = '#fffdf2';
        ctx.strokeStyle = '#111';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(center, y + 3);
        ctx.lineTo(center - 11, y + height - 3);
        ctx.lineTo(center + 11, y + height - 3);
        ctx.lineTo(center, y + 3);
        ctx.fill();
        ctx.stroke();
        ctx.font = `bold 15px ${GAME_FONT_FAMILY}`;
        ctx.textAlign = 'center';
        ctx.fillStyle = '#111';
        ctx.fillText('!', center, y + 21);
    }
}

function getHealthBarColor(health) {
    if (health <= COMBAT_FEEDBACK.dangerHealth) return '#e11d48';
    if (health <= 60) return '#facc15';
    return '#22c55e';
}

function drawEnergyBar(x, y, energy, alignRight, accentColor = '#000', actionState = 'charging') {
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

    if (actionState === 'special-ready') {
        ctx.strokeStyle = '#111';
        ctx.lineWidth = 2;
        ctx.strokeRect(x - 4, y - 4, width + 8, height + 8);
        // A diamond remains visible at compact/mobile sizes and in grayscale.
        const symbolX = alignRight ? x - 16 : x + width + 16;
        ctx.beginPath();
        ctx.moveTo(symbolX, y - 2);
        ctx.lineTo(symbolX + 7, y + height / 2);
        ctx.lineTo(symbolX, y + height + 2);
        ctx.lineTo(symbolX - 7, y + height / 2);
        ctx.lineTo(symbolX, y - 2);
        ctx.stroke();
    }

    if (actionState === 'special-ready' && !hudCompactMode) {
        ctx.font = `bold 12px ${GAME_FONT_FAMILY}`;
        ctx.fillStyle = '#000';
        ctx.textAlign = 'center';
        ctx.fillText(t('specialReadyShort'), x + width / 2, y + 10);
    }

    if (actionState === 'cancel-ready') {
        const segmentX = alignRight ? x + width - 50 : x;
        ctx.strokeStyle = '#111';
        ctx.lineWidth = 2;
        for (let offset = -8; offset < 50; offset += 9) {
            ctx.beginPath();
            ctx.moveTo(segmentX + Math.max(0, offset), y + Math.max(0, -offset));
            ctx.lineTo(segmentX + Math.min(50, offset + 12), y + Math.min(height, 12));
            ctx.stroke();
        }
    }
}

function drawStatusMessage() {
    if (!statusMessage) return;

    const alpha = Math.min(1, Math.max(0.65, statusTimer / 20));
    const accent = getStatusAccent(statusMessage);
    const panelWidth = Math.min(620, Math.max(260, statusMessage.length * 34));
    const panelHeight = 86;
    const x = WIDTH / 2 - panelWidth / 2;
    const y = HUD_SAFE_BOTTOM + 10;

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
    ctx.fillText(getVsIntroTitle(), WIDTH / 2, 155);
    const rivalLabel = getRivalLabel();
    ctx.font = `bold ${rivalLabel.length > 13 ? 42 : 54}px ${GAME_FONT_FAMILY}`;
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#000';
    ctx.strokeText(`P1  VS  ${rivalLabel}`, WIDTH / 2, 235);
    ctx.fillStyle = player2.accentColor;
    ctx.fillText(`P1  VS  ${rivalLabel}`, WIDTH / 2, 235);
    ctx.font = `bold 20px ${GAME_FONT_FAMILY}`;
    ctx.fillStyle = '#111';
    ctx.fillText(`${getDifficultyLabel()} | ${getArenaLabel()}`, WIDTH / 2, 285);
    ctx.font = `bold 14px ${GAME_FONT_FAMILY}`;
    ctx.fillText(t(getRivalConfig().introKey), WIDTH / 2, 312);
    ctx.restore();
}

function drawRoundHighlight() {
    const top = HUD_SAFE_BOTTOM + 12;
    ctx.save();
    ctx.strokeStyle = '#111'; ctx.lineWidth = 4;
    ctx.strokeRect(14, top, WIDTH - 28, HEIGHT - top - 14);
    const centerX = (roundHighlight.fighters[0].x + roundHighlight.fighters[1].x) / 2;
    const centerY = 310;
    for (let i = 0; i < 12; i++) {
        const x = 32 + i * (WIDTH - 64) / 11;
        ctx.beginPath();
        ctx.moveTo(x, HEIGHT - 26);
        ctx.lineTo(x + (centerX - x) * 0.12, HEIGHT - 26 + (centerY - HEIGHT + 26) * 0.12);
        ctx.stroke();
    }
    roundHighlight.fighters.forEach(drawFighter);
    const title = t(roundHighlight.key);
    ctx.font = `bold 32px ${GAME_FONT_FAMILY}`;
    ctx.textAlign = 'center';
    const width = Math.min(WIDTH - 70, ctx.measureText(title).width + 32);
    ctx.fillStyle = '#fff7c2'; ctx.fillRect((WIDTH - width) / 2, top + 12, width, 46);
    ctx.strokeRect((WIDTH - width) / 2, top + 12, width, 46);
    ctx.fillStyle = '#111'; ctx.fillText(title, WIDTH / 2, top + 45, width - 20);
    ctx.restore();
}

function drawResultCard(target, scene, data) {
    target.fillStyle = '#fffdf5'; target.fillRect(0, 0, 1200, 900);
    target.strokeStyle = '#111'; target.lineWidth = 10; target.strokeRect(16, 16, 1168, 868);

    target.textAlign = 'left';
    target.font = `bold 38px ${GAME_FONT_FAMILY}`; target.fillStyle = '#111';
    target.fillText('GLITCH DUEL', 42, 64);

    target.font = `bold 20px ${GAME_FONT_FAMILY}`; target.textAlign = 'right';
    target.fillStyle = '#62605a';
    target.fillText(data.mode, 1148, 64);

    target.drawImage(scene, 42, 90, 1116, 540);

    target.strokeStyle = '#111';
    target.lineWidth = 3;
    target.beginPath();
    target.moveTo(42, 648);
    target.lineTo(1158, 648);
    target.stroke();

    target.textAlign = 'left';
    target.font = `bold 40px ${GAME_FONT_FAMILY}`;
    const titleWidth = target.measureText ? target.measureText(data.title).width : data.title.length * 24;
    target.fillStyle = '#111';
    target.fillText(data.title, 42, 700, titleWidth > 600 ? 600 : undefined);
    target.fillStyle = '#62605a';
    target.font = `bold 16px ${GAME_FONT_FAMILY}`;
    target.fillText(data.stamp, 42, 730, 400);

    target.textAlign = 'right';
    target.font = `bold 56px ${GAME_FONT_FAMILY}`;
    target.fillStyle = '#111';
    const scoreWidth = target.measureText ? target.measureText(data.score).width : data.score.length * 34;
    target.fillText(data.score, 1158, 710, scoreWidth > 200 ? 200 : undefined);
    target.font = `bold 18px ${GAME_FONT_FAMILY}`;
    target.fillStyle = '#62605a';
    target.fillText(data.medal, 1158, 740, 400);

    target.strokeStyle = '#111';
    target.lineWidth = 2;
    target.beginPath();
    target.moveTo(42, 760);
    target.lineTo(1158, 760);
    target.stroke();

    target.textAlign = 'left';
    target.font = `bold 20px ${GAME_FONT_FAMILY}`;
    target.fillStyle = '#111';
    const footer = `${data.rival} · ${data.difficulty} · ${data.arena}`;
    target.fillText(footer, 42, 800, 1100);
    target.font = `17px ${GAME_FONT_FAMILY}`;
    target.fillStyle = '#62605a';
    target.fillText(`SEED ${data.seed}`, 42, 835, 1100);
    target.fillText(t('challengeCardFooter'), 42, 870, 1100);
}

function drawImpactFlash() {
    if (!impactFlash) return;

    drawCombatSignature(impactFlash);
    if (reducedMotionEnabled) return;

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

    drawCombatSignature(specialFlash);

    const progress = specialFlash.timer / specialFlash.maxTimer;
    const expansion = reducedMotionEnabled ? 0 : 1 - progress;
    const beamLength = 170 + expansion * 90;
    const beamHeight = 28 + expansion * 18;
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
    ctx.arc(startX, specialFlash.y, 34 + expansion * 24, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 2;
    for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(startX + specialFlash.direction * 25, specialFlash.y + side * 26);
        ctx.lineTo(endX - specialFlash.direction * 12, specialFlash.y + side * 35 - 8);
        ctx.stroke();
    }
    ctx.restore();
}
