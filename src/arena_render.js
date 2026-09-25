function drawBackground() {
    const arena = getArenaConfig();
    const arenaKey = selectedArena;
    const arenaPalette = VISUAL_PALETTE.arena[arenaKey] || VISUAL_PALETTE.arena.notebook;

    ctx.fillStyle = arenaPalette.wall;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    drawArenaAmbient(arenaKey, arenaPalette);

    ctx.strokeStyle = arena.accent;
    ctx.lineWidth = 1;
    for (let x = 0; x < WIDTH; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, HEIGHT);
        ctx.stroke();
    }

    drawArenaDetails(arenaKey, arena);
    drawArenaReaction(arena);

    ctx.strokeStyle = arenaPalette.ground;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y + 35);

    for (let x = 0; x <= WIDTH; x += 30) {
        ctx.lineTo(x, GROUND_Y + 35 + Math.sin(x / 20) * 3);
    }

    ctx.stroke();
}

function drawArenaAmbient(arenaKey, palette) {
    if (reducedMotionEnabled) return;
    const motionFrame = getArenaMotionFrame();

    if (arenaKey === 'serverDown') {
        ctx.save();
        ctx.globalAlpha = 0.04;
        for (let i = 0; i < 6; i++) {
            const x = 100 + i * 160;
            const flicker = Math.sin(motionFrame / 5 + i) * 0.5 + 0.5;
            ctx.fillStyle = `rgba(239, 68, 68, ${flicker * 0.15})`;
            ctx.fillRect(x, 120 + Math.sin(motionFrame / 8 + i) * 10, 40, 60);
        }
        ctx.restore();
    } else if (arenaKey === 'terminal') {
        ctx.save();
        ctx.globalAlpha = 0.06;
        ctx.fillStyle = palette.ground;
        for (let i = 0; i < 4; i++) {
            const x = 80 + i * 260;
            const blink = Math.sin(motionFrame / 12 + i * 2) > 0.3;
            if (blink) ctx.fillRect(x, 100 + Math.sin(motionFrame / 10 + i) * 5, 60, 5);
        }
        ctx.restore();
    } else if (arenaKey === 'cafeteria' || arenaKey === 'lab') {
        ctx.save();
        ctx.globalAlpha = 0.03;
        ctx.fillStyle = palette.ground;
        for (let i = 0; i < 3; i++) {
            const x = 300 + i * 200;
            const drift = Math.sin(motionFrame / 15 + i * 2) * 8;
            ctx.fillRect(x + drift, 160 + i * 20, 30, 15);
        }
        ctx.restore();
    } else if (arenaKey === 'rooftop') {
        ctx.save();
        ctx.globalAlpha = 0.05;
        ctx.fillStyle = palette.ground;
        for (let i = 0; i < 5; i++) {
            const flicker = Math.sin(motionFrame / 6 + i * 1.5) * 0.3 + 0.5;
            ctx.fillStyle = `rgba(88, 66, 115, ${flicker * 0.08})`;
            ctx.fillRect(200 + i * 150, 100 + Math.sin(motionFrame / 10 + i) * 6, 40, 8);
        }
        ctx.restore();
    } else if (arenaKey === 'remoteMeeting') {
        ctx.save();
        ctx.globalAlpha = 0.04;
        ctx.fillStyle = palette.ground;
        for (let i = 0; i < 4; i++) {
            const barX = 400 + i * 40;
            const barH = 15 + Math.sin(motionFrame / 8 + i) * 10;
            ctx.fillRect(barX, 180 - barH, 16, barH);
        }
        ctx.restore();
    }
}

function getArenaMotionFrame() {
    return reducedMotionEnabled ? 0 : visualFrame;
}

function drawArenaFarLayer(arenaKey, arena) {
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.strokeStyle = arena.ground;
    ctx.lineWidth = 1;
    ctx.fillStyle = arena.ground;

    if (arenaKey === 'cafeteria') {
        for (let x = 60; x < WIDTH; x += 170) {
            ctx.fillRect(x, 52, 120, 150);
            ctx.strokeRect(x, 52, 120, 150);
        }
    } else if (arenaKey === 'lab') {
        for (let x = 40; x < WIDTH; x += 160) {
            ctx.strokeRect(x, 40, 100, 200);
            ctx.beginPath();
            ctx.arc(x + 50, 140, 20, 0, Math.PI * 2);
            ctx.stroke();
        }
    } else if (arenaKey === 'meeting') {
        for (let x = 80; x < WIDTH; x += 200) {
            ctx.moveTo(x, 40);
            ctx.lineTo(x, 180);
        }
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(WIDTH / 2, 60, 32, 0, Math.PI * 2);
        ctx.stroke();
    } else if (arenaKey === 'remoteMeeting') {
        for (let i = 0; i < 8; i++) {
            const x = 20 + i * 130;
            ctx.strokeRect(x, 40, 100, 60);
        }
    } else if (arenaKey === 'mathClass') {
        ctx.globalAlpha = 0.10;
        ctx.font = `24px ${GAME_FONT_FAMILY}`;
        ctx.fillStyle = arena.ground;
        ctx.fillText('∫ f(x) dx = ???', 420, 60);
    } else if (arenaKey === 'serverDown') {
        ctx.globalAlpha = 0.10;
        for (let x = 40; x < WIDTH; x += 70) {
            ctx.fillRect(x, 30, 20, 40);
        }
    } else if (arenaKey === 'geekConvention') {
        ctx.globalAlpha = 0.10;
        for (let i = 0; i < 6; i++) {
            const x = 50 + i * 170;
            ctx.beginPath();
            ctx.arc(x, 160, 60, 0, Math.PI, true);
            ctx.fill();
        }
    } else if (arenaKey === 'terminal') {
        ctx.globalAlpha = 0.08;
        ctx.font = `14px ${GAME_FONT_FAMILY}`;
        for (let i = 0; i < 5; i++) ctx.fillText('> _', 40 + i * 210, 60 + i * 26);
    } else if (arenaKey === 'rooftop') {
        ctx.globalAlpha = 0.08;
        for (let i = 0; i < 4; i++) {
            ctx.fillRect(100 + i * 250, 80, 140, 80);
            ctx.fillRect(120 + i * 250, 60, 80, 100);
        }
    } else {
        ctx.globalAlpha = 0.08;
        for (let i = 0; i < 6; i++) {
            const x = 40 + i * 170;
            ctx.fillRect(x, 50, 80, 60);
            ctx.fillRect(x + 10, 40, 50, 70);
        }
    }

    ctx.restore();
}

function drawArenaDetails(arenaKey, arena) {
    ctx.save();
    ctx.globalAlpha = 0.82;

    drawArenaFarLayer(arenaKey, arena);

    if (arenaKey === 'cafeteria') drawCafeteriaDetails(arena);
    else if (arenaKey === 'lab') drawLabDetails(arena);
    else if (arenaKey === 'meeting') drawMeetingDetails(arena);
    else if (arenaKey === 'remoteMeeting') drawRemoteMeetingDetails(arena);
    else if (arenaKey === 'mathClass') drawMathClassDetails(arena);
    else if (arenaKey === 'serverDown') drawServerDownDetails(arena);
    else if (arenaKey === 'geekConvention') drawGeekConventionDetails(arena);
    else if (arenaKey === 'terminal') drawTerminalDetails(arena);
    else if (arenaKey === 'rooftop') drawRooftopDetails(arena);
    else drawNotebookDetails(arena);

    ctx.restore();
}

function drawArenaForeground() {
    const arena = getArenaConfig();

    ctx.save();
    ctx.globalAlpha = 0.64;
    ctx.fillStyle = arena.ground;
    ctx.strokeStyle = arena.ground;
    ctx.lineWidth = 3;

    if (selectedArena === 'cafeteria') {
        ctx.fillRect(0, 430, 210, 70);
        ctx.fillRect(810, 430, 190, 70);
        ctx.strokeRect(34, 360, 52, 86);
        ctx.strokeRect(914, 360, 52, 86);
        ctx.globalAlpha = 0.20;
        ctx.strokeRect(20, 370, 80, 70);
        ctx.strokeRect(900, 370, 80, 70);
    } else if (selectedArena === 'lab') {
        ctx.fillRect(0, 432, 190, 68);
        ctx.fillRect(830, 432, 170, 68);
        ctx.beginPath();
        ctx.moveTo(80, 420);
        ctx.lineTo(122, 372);
        ctx.lineTo(160, 420);
        ctx.stroke();
        ctx.strokeRect(878, 382, 54, 48);
        ctx.globalAlpha = 0.18;
        ctx.strokeRect(20, 390, 80, 48);
        ctx.strokeRect(900, 390, 80, 48);
    } else if (selectedArena === 'meeting') {
        ctx.fillRect(0, 438, 225, 62);
        ctx.fillRect(775, 438, 225, 62);
        ctx.strokeRect(46, 366, 58, 72);
        ctx.strokeRect(896, 366, 58, 72);
        ctx.globalAlpha = 0.18;
        ctx.strokeRect(30, 378, 80, 52);
        ctx.strokeRect(890, 378, 80, 52);
    } else if (selectedArena === 'remoteMeeting') {
        ctx.fillRect(0, 442, 230, 58);
        ctx.fillRect(770, 442, 230, 58);
        ctx.strokeRect(30, 370, 120, 58);
        ctx.strokeRect(850, 370, 120, 58);
        ctx.globalAlpha = 0.18;
        ctx.strokeRect(14, 382, 96, 40);
        ctx.strokeRect(890, 382, 96, 40);
    } else if (selectedArena === 'mathClass') {
        ctx.fillRect(0, 438, 205, 62);
        ctx.fillRect(795, 438, 205, 62);
        ctx.strokeRect(42, 388, 105, 42);
        ctx.strokeRect(853, 388, 105, 42);
        ctx.globalAlpha = 0.18;
        ctx.strokeRect(24, 400, 90, 30);
        ctx.strokeRect(886, 400, 90, 30);
    } else if (selectedArena === 'serverDown') {
        ctx.fillStyle = 'rgba(17, 24, 39, 0.88)';
        ctx.fillRect(0, 352, 94, 148);
        ctx.fillRect(906, 352, 94, 148);
        ctx.strokeStyle = '#ef4444';
        ctx.strokeRect(18, 374, 58, 98);
        ctx.strokeRect(924, 374, 58, 98);
        ctx.globalAlpha = 0.12;
        ctx.fillStyle = 'rgba(239, 68, 68, 0.08)';
        ctx.fillRect(28, 384, 38, 20);
        ctx.fillRect(934, 384, 38, 20);
    } else if (selectedArena === 'geekConvention') {
        ctx.fillRect(0, 438, 220, 62);
        ctx.fillRect(780, 438, 220, 62);
        ctx.beginPath();
        ctx.arc(72, 392, 24, 0, Math.PI * 2);
        ctx.arc(928, 392, 24, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.18;
        ctx.beginPath();
        ctx.arc(32, 400, 28, 0, Math.PI * 2);
        ctx.arc(968, 400, 28, 0, Math.PI * 2);
        ctx.fill();
    } else if (selectedArena === 'terminal' || selectedArena === 'rooftop') {
        ctx.fillRect(0, 440, 150, 60);
        ctx.fillRect(850, 440, 150, 60);
        ctx.strokeRect(22, 420, 94, 16);
        ctx.strokeRect(884, 420, 94, 16);
        ctx.globalAlpha = 0.18;
        ctx.strokeRect(10, 430, 80, 12);
        ctx.strokeRect(910, 430, 80, 12);
    } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.78)';
        ctx.fillRect(0, 430, 174, 70);
        ctx.fillRect(826, 430, 174, 70);
        ctx.strokeStyle = 'rgba(200, 40, 40, 0.55)';
        ctx.strokeRect(30, 380, 104, 42);
        ctx.strokeRect(866, 380, 104, 42);
        ctx.globalAlpha = 0.22;
        ctx.fillStyle = 'rgba(200, 40, 40, 0.14)';
        ctx.fillRect(20, 396, 60, 20);
        ctx.fillRect(920, 396, 60, 20);
    }

    ctx.restore();
}

function drawTerminalDetails(arena) {
    ctx.strokeStyle = arena.ground;
    ctx.lineWidth = 3;
    for (const x of [42, 778]) {
        ctx.fillStyle = '#dcebdd';
        ctx.fillRect(x, 135, 180, 150);
        ctx.strokeRect(x, 135, 180, 150);
        ctx.strokeRect(x + 10, 146, 160, 112);
        ctx.fillStyle = arena.ground;
        ctx.font = `bold 13px ${GAME_FONT_FAMILY}`;
        ctx.fillText('> GLITCH_DUEL', x + 20, 172);
        ctx.fillText('STATUS: 200 OK', x + 20, 198);
        ctx.fillText('$ duel --local', x + 20, 224);
        ctx.fillRect(x + 20, 237, 20, 4);
        ctx.beginPath();
        ctx.moveTo(x + 90, 285);
        ctx.lineTo(x + 90, 338);
        ctx.lineTo(x + 42, 338);
        ctx.stroke();
    }
    ctx.globalAlpha = 0.25;
    ctx.font = `bold 48px ${GAME_FONT_FAMILY}`;
    ctx.fillText('{  }', 420, 220);

    ctx.fillStyle = 'rgba(36, 87, 70, 0.08)';
    ctx.font = `12px ${GAME_FONT_FAMILY}`;
    ctx.fillText('pipeline.py --run', 130, 106);
    ctx.fillText('deploy.sh --prod', 760, 120);
    ctx.fillText('$ git push --force', 300, 80);
    ctx.fillText('ERR_CONNECT', 600, 110);
    ctx.fillText('npm test', 200, 94);

    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 355);
    ctx.lineTo(250, 355);
    ctx.lineTo(275, 375);
    ctx.moveTo(1000, 355);
    ctx.lineTo(750, 355);
    ctx.lineTo(725, 375);
    ctx.stroke();
}

function drawRooftopDetails(arena) {
    ctx.strokeStyle = arena.ground;
    ctx.fillStyle = '#ddd4e9';
    ctx.lineWidth = 2;
    for (let i = 0; i < 10; i++) {
        const x = i * 105;
        const top = 215 + (i % 3) * 28;
        ctx.fillRect(x, top, 86, 150);
        ctx.strokeRect(x, top, 86, 150);
        ctx.fillStyle = '#f9f2d5';
        for (let row = 0; row < 3; row++) {
            for (let column = 0; column < 3; column++) ctx.fillRect(x + 12 + column * 22, top + 15 + row * 24, 10, 12);
        }
        ctx.fillStyle = '#ddd4e9';
    }
    ctx.fillStyle = '#fff7e2';
    ctx.beginPath(); ctx.arc(815, 160, 29, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.strokeRect(64, 143, 210, 49);
    ctx.font = `bold 20px ${GAME_FONT_FAMILY}`;
    ctx.fillStyle = arena.ground;
    ctx.fillText('NO CLOUD, NO LAG', 76, 174);

    ctx.fillStyle = 'rgba(88, 66, 115, 0.06)';
    for (let i = 0; i < 8; i++) {
        const bx = 50 + i * 120;
        ctx.fillRect(bx, 40, 90, 80 + (i % 3) * 20);
        ctx.fillStyle = 'rgba(249, 242, 213, 0.10)';
        ctx.fillRect(bx + 10, 50, 20, 18);
        ctx.fillStyle = 'rgba(88, 66, 115, 0.06)';
    }

    ctx.beginPath();
    ctx.moveTo(0, 190); ctx.quadraticCurveTo(490, 104, 1000, 197); ctx.stroke();
}

function drawArenaReaction(arena) {
    if (!arenaReaction) return;
    const reaction = arenaReaction;
    const progress = reaction.timer / reaction.maxTimer;
    const displacement = reducedMotionEnabled ? 0 : (1 - progress) * 22;
    const strength = reaction.kind === 'special' ? 1 : (reaction.kind === 'combo' ? 0.8 : (reaction.kind === 'block' ? 0.3 : 0.5));
    const edgeX = reaction.x < WIDTH / 2 ? 125 : 875;
    const arenaKey = selectedArena;
    const arenaPalette = VISUAL_PALETTE.arena[arenaKey] || VISUAL_PALETTE.arena.notebook;
    ctx.save();
    ctx.globalAlpha = progress * strength * 0.7;
    ctx.strokeStyle = arenaPalette.ground;
    ctx.fillStyle = arenaPalette.ground;
    ctx.lineWidth = 2;

    if (!reducedMotionEnabled) {
        ctx.save();
        ctx.globalAlpha = (1 - progress) * strength * 0.15;
        ctx.fillStyle = arenaPalette.ground;
        const flashRadius = 60 + (1 - progress) * 40;
        ctx.beginPath();
        ctx.arc(reaction.x, reaction.y, flashRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    if (arenaKey === 'serverDown') {
        for (let i = 0; i < 6; i++) {
            const flicker = i % 2 === 0 ? 1 : 0.5;
            ctx.globalAlpha = progress * strength * flicker * 0.5;
            ctx.fillRect(edgeX - 58 + i * 3, 148 + i * 16, 100 - i * 12, 4);
        }
    } else if (arenaKey === 'terminal') {
        ctx.font = `bold 13px ${GAME_FONT_FAMILY}`;
        ctx.globalAlpha = progress * strength * 0.5;
        ctx.fillText('> ERROR', edgeX - 40, 154);
        ctx.fillText('STATUS: 500', edgeX - 40, 176);
        for (let i = 0; i < 5; i++) ctx.fillRect(edgeX - 58 + i * 3, 190 + i * 16, 100 - i * 12, 3);
    } else if (arenaKey === 'remoteMeeting') {
        ctx.font = `bold 12px ${GAME_FONT_FAMILY}`;
        ctx.globalAlpha = progress * strength * 0.6;
        ctx.fillText('RECONNECTING', edgeX - 60, 154);
        for (let i = 0; i < 5; i++) ctx.fillRect(edgeX - 58 + i * 3, 164 + i * 16, 100 - i * 12, 4);
    } else if (arenaKey === 'cafeteria' || arenaKey === 'lab') {
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(edgeX - 20 + i * 20, 220);
            ctx.quadraticCurveTo(edgeX - 35 + i * 20, 196 - displacement, edgeX - 20 + i * 20, 166 - displacement);
            ctx.stroke();
        }
    } else if (arenaKey === 'rooftop' || arenaKey === 'geekConvention') {
        ctx.strokeRect(edgeX - 60 - displacement, 142, 120 + displacement * 2, 54);
        for (let i = 0; i < 4; i++) ctx.fillRect(edgeX - 52 + i * 28, 216, 12, 10);
    } else if (arenaKey === 'mathClass') {
        ctx.font = `bold 14px ${GAME_FONT_FAMILY}`;
        ctx.globalAlpha = progress * strength * 0.4;
        ctx.fillText('f(x) = ??', edgeX - 38, 168);
    } else {
        for (let i = 0; i < 4; i++) {
            const x = edgeX - 30 + i * 20;
            ctx.strokeRect(x, 178 - (i % 2) * 20 - displacement, 10, 15);
        }
    }
    ctx.globalAlpha = progress * strength * 0.7;
    ctx.beginPath();
    ctx.moveTo(Math.max(0, reaction.x - 45 - displacement), GROUND_Y + 47);
    ctx.lineTo(Math.min(WIDTH, reaction.x + 45 + displacement), GROUND_Y + 47);
    ctx.stroke();
    ctx.restore();
}

function drawNotebookDetails(arena) {
    ctx.strokeStyle = 'rgba(200, 40, 40, 0.35)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(95, 0);
    ctx.lineTo(95, GROUND_Y + 20);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(200, 40, 40, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(100, 0);
    ctx.lineTo(100, GROUND_Y + 20);
    ctx.stroke();

    ctx.strokeStyle = arena.accent;
    ctx.lineWidth = 1;
    for (let y = 80; y < GROUND_Y; y += 34) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(WIDTH, y);
        ctx.stroke();
    }

    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.font = `20px ${GAME_FONT_FAMILY}`;
    ctx.fillText('TODO: esquivar', 130, 120);
    ctx.fillText('combo = J + K', 710, 170);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.22)';
    ctx.beginPath();
    ctx.arc(785, 230, 34, 0.2, Math.PI * 1.7);
    ctx.stroke();

    ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
    ctx.font = `14px ${GAME_FONT_FAMILY}`;
    ctx.fillText('notas de combate', 710, 120);
    ctx.fillText('no olvidar:', 710, 140);
}

function drawCafeteriaDetails(arena) {
    const motionFrame = getArenaMotionFrame();
    ctx.fillStyle = 'rgba(124, 79, 44, 0.22)';
    ctx.fillRect(80, 250, 840, 70);

    ctx.fillStyle = 'rgba(124, 79, 44, 0.10)';
    for (let x = 180; x < 880; x += 140) {
        ctx.fillRect(x, 280, 100, 40);
    }

    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.fillRect(110, 90, 230, 115);
    ctx.strokeStyle = arena.ground;
    ctx.lineWidth = 3;
    ctx.strokeRect(110, 90, 230, 115);

    ctx.fillStyle = arena.ground;
    ctx.font = `bold 20px ${GAME_FONT_FAMILY}`;
    ctx.fillText('COFFEE', 135, 125);
    ctx.font = `16px ${GAME_FONT_FAMILY}`;
    ctx.fillText('404 CAFFEINE', 135, 155);
    ctx.fillText('MEETING FUEL', 135, 180);

    for (let x = 620; x <= 760; x += 70) {
        ctx.strokeStyle = arena.ground;
        ctx.lineWidth = 4;
        ctx.strokeRect(x, 215, 38, 28);
        ctx.beginPath();
        ctx.arc(x + 39, 228, 8, -Math.PI / 2, Math.PI / 2);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(124, 79, 44, 0.32)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + 12, 205 - Math.sin((motionFrame + x) / 18) * 3);
        ctx.quadraticCurveTo(x + 4, 190, x + 18, 178 - Math.sin((motionFrame + x) / 15) * 4);
        ctx.moveTo(x + 25, 205 - Math.cos((motionFrame + x) / 20) * 3);
        ctx.quadraticCurveTo(x + 35, 190, x + 24, 178 - Math.cos((motionFrame + x) / 16) * 4);
        ctx.stroke();
    }

    ctx.fillStyle = 'rgba(124, 79, 44, 0.12)';
    ctx.font = `12px ${GAME_FONT_FAMILY}`;
    ctx.fillText('COUNTER', 118, 220);
    ctx.fillText('TRAY LINE', 660, 210);
}

function drawLabDetails(arena) {
    const motionFrame = getArenaMotionFrame();
    ctx.strokeStyle = arena.accent;
    ctx.lineWidth = 1;
    for (let y = 60; y < GROUND_Y; y += 45) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(WIDTH, y);
        ctx.stroke();
    }

    ctx.fillStyle = 'rgba(36, 83, 122, 0.06)';
    ctx.strokeStyle = arena.accent;
    ctx.lineWidth = 1;
    for (let x = 150; x < 850; x += 140) {
        ctx.fillRect(x, 60, 80, 140);
        ctx.strokeRect(x, 60, 80, 140);
    }

    ctx.strokeStyle = arena.ground;
    ctx.lineWidth = 3;
    ctx.strokeRect(92, 105, 190, 95);
    ctx.strokeRect(720, 85, 170, 130);
    ctx.fillStyle = 'rgba(36, 83, 122, 0.55)';
    ctx.font = `18px ${GAME_FONT_FAMILY}`;
    ctx.fillText('E = mc^2?', 120, 145);
    ctx.fillText('NaN sample', 745, 125);
    ctx.fillText('DO NOT LICK', 742, 165);

    ctx.fillStyle = 'rgba(36, 83, 122, 0.15)';
    ctx.font = `13px ${GAME_FONT_FAMILY}`;
    ctx.fillText('H2O + bug', 230, 150);
    ctx.fillText('centrifuge', 710, 230);

    ctx.strokeStyle = 'rgba(42, 157, 143, 0.55)';
    ctx.beginPath();
    ctx.moveTo(430, 105);
    ctx.lineTo(470, 220);
    ctx.lineTo(390, 220);
    ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = motionFrame % 40 < 20 ? 'rgba(42, 157, 143, 0.45)' : 'rgba(42, 157, 143, 0.18)';
    ctx.fillRect(420, 185, 20, 20);
}

function drawMeetingDetails(arena) {
    ctx.fillStyle = 'rgba(91, 70, 54, 0.20)';
    ctx.fillRect(120, 238, 760, 72);

    ctx.fillStyle = 'rgba(91, 70, 54, 0.08)';
    for (let x = 180; x < 820; x += 160) {
        ctx.fillRect(x, 260, 80, 50);
    }

    ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
    ctx.fillRect(340, 72, 320, 150);
    ctx.strokeStyle = arena.ground;
    ctx.lineWidth = 3;
    ctx.strokeRect(340, 72, 320, 150);

    ctx.strokeStyle = 'rgba(91, 70, 54, 0.10)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(WIDTH / 2, 92, 16, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(WIDTH / 2, 92);
    ctx.lineTo(WIDTH / 2, 82);
    ctx.moveTo(WIDTH / 2, 92);
    ctx.lineTo(WIDTH / 2 + 8, 92);
    ctx.stroke();

    ctx.fillStyle = arena.ground;
    ctx.font = `bold 18px ${GAME_FONT_FAMILY}`;
    ctx.fillText('THIS COULD BE AN EMAIL', 372, 118);
    ctx.font = `16px ${GAME_FONT_FAMILY}`;
    ctx.fillText('ACTION ITEMS?', 420, 165);

    const notes = [[185, 105], [715, 120], [760, 175]];
    notes.forEach(([x, y], i) => {
        ctx.fillStyle = i === 1 ? 'rgba(255, 210, 80, 0.7)' : 'rgba(255, 245, 130, 0.7)';
        ctx.fillRect(x, y, 60, 45);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.font = `13px ${GAME_FONT_FAMILY}`;
        ctx.fillText(i === 2 ? '???' : 'TODO', x + 10, y + 27);
    });
}

function drawRemoteMeetingDetails(arena) {
    const motionFrame = getArenaMotionFrame();
    const windows = [[95, 86, 'HUMANO'], [315, 86, 'CPU'], [535, 86, 'LAG...'], [755, 86, 'MUTED']];

    ctx.fillStyle = 'rgba(29, 78, 216, 0.06)';
    ctx.fillRect(40, 190, 920, 50);

    windows.forEach(([x, y, label], i) => {
        ctx.fillStyle = i === 1 ? 'rgba(255, 220, 220, 0.92)' : 'rgba(255, 255, 255, 0.88)';
        ctx.fillRect(x, y, 150, 92);
        ctx.strokeStyle = arena.ground;
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, 150, 92);
        ctx.fillStyle = i === 1 ? '#991b1b' : '#0f172a';
        ctx.font = `14px ${GAME_FONT_FAMILY}`;
        ctx.fillText(label, x + 18, y + 72);
    });

    ctx.fillStyle = 'rgba(255, 255, 255, 0.90)';
    ctx.fillRect(705, 210, 210, 96);
    ctx.strokeStyle = arena.ground;
    ctx.lineWidth = 3;
    ctx.strokeRect(705, 210, 210, 96);
    ctx.fillStyle = '#0f172a';
    ctx.font = `15px ${GAME_FONT_FAMILY}`;
    ctx.fillText("YOU'RE MUTED", 730, 238);
    ctx.fillText('CAN YOU SEE IT?', 730, 270);
    ctx.fillText('RECONNECTING', 730, 292);
    ctx.fillStyle = motionFrame % 48 < 24 ? '#dc2626' : 'rgba(220, 38, 38, 0.32)';
    ctx.fillText('REC', 860, 238);

    ctx.strokeStyle = 'rgba(29, 78, 216, 0.10)';
    ctx.lineWidth = 4;
    for (let i = 0; i < 5; i++) {
        const barX = 420 + i * 36;
        const barH = 10 + i * 6;
        ctx.fillStyle = motionFrame % 30 < 15 + i * 3 ? 'rgba(29, 78, 216, 0.25)' : 'rgba(29, 78, 216, 0.08)';
        ctx.fillRect(barX, 196 - barH, 20, barH);
    }
}

function drawMathClassDetails(arena) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.fillRect(105, 72, 790, 210);
    ctx.strokeStyle = arena.ground;
    ctx.lineWidth = 4;
    ctx.strokeRect(105, 72, 790, 210);

    ctx.strokeStyle = 'rgba(54, 83, 20, 0.10)';
    ctx.lineWidth = 1;
    ctx.strokeRect(110, 77, 780, 200);

    ctx.fillStyle = arena.ground;
    ctx.font = `bold 21px ${GAME_FONT_FAMILY}`;
    ctx.fillText('f(punch) = pain', 145, 126);
    ctx.fillText('CPU != friend', 560, 128);
    ctx.font = `18px ${GAME_FONT_FAMILY}`;
    ctx.fillText('lim combo -> K.O.', 190, 190);
    ctx.fillText('bug theorem: hit first', 520, 220);

    ctx.fillStyle = 'rgba(54, 83, 20, 0.12)';
    ctx.font = `14px ${GAME_FONT_FAMILY}`;
    ctx.fillText('x = (-b ± √(b² - 4ac)) / 2a', 140, 155);
    ctx.fillText('P(win) = 1 - P(lose)', 160, 250);
    ctx.fillText('docker ps -a', 700, 240);
}

function drawServerDownDetails(arena) {
    const motionFrame = getArenaMotionFrame();
    ctx.fillStyle = 'rgba(17, 24, 39, 0.82)';
    ctx.fillRect(90, 76, 240, 210);
    ctx.fillRect(670, 76, 240, 210);
    ctx.strokeStyle = arena.ground;
    ctx.lineWidth = 4;
    ctx.strokeRect(90, 76, 240, 210);
    ctx.strokeRect(670, 76, 240, 210);

    ctx.strokeStyle = 'rgba(239, 68, 68, 0.10)';
    ctx.lineWidth = 1;
    for (let y = 90; y < 270; y += 24) {
        ctx.beginPath();
        ctx.moveTo(102, y);
        ctx.lineTo(318, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(682, y);
        ctx.lineTo(898, y);
        ctx.stroke();
    }

    ctx.fillStyle = '#fecaca';
    ctx.font = `bold 18px ${GAME_FONT_FAMILY}`;
    ctx.fillText('SERVER DOWN', 126, 122);
    ctx.fillText('500', 760, 122);
    ctx.font = `15px ${GAME_FONT_FAMILY}`;
    ctx.fillText('retrying...', 130, 170);
    ctx.fillText('coffee required', 718, 172);

    ctx.fillStyle = 'rgba(239, 68, 68, 0.08)';
    ctx.font = `12px ${GAME_FONT_FAMILY}`;
    ctx.fillText('UPTIME: 0d', 700, 200);
    ctx.fillText('PING: ∞', 700, 218);
    ctx.fillText('DEADLOCK', 120, 198);

    ctx.fillStyle = 'rgba(239, 68, 68, 0.42)';
    ctx.fillRect(420, 98, 160, 120);
    ctx.fillStyle = motionFrame % 36 < 18 ? '#ef4444' : '#7f1d1d';
    ctx.fillRect(474, 132, 52, 52);
}

function drawGeekConventionDetails(arena) {
    const motionFrame = getArenaMotionFrame();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
    ctx.fillRect(135, 92, 250, 126);
    ctx.fillRect(620, 92, 245, 126);
    ctx.strokeStyle = arena.ground;
    ctx.lineWidth = 3;
    ctx.strokeRect(135, 92, 250, 126);
    ctx.strokeRect(620, 92, 245, 126);

    ctx.fillStyle = arena.ground;
    ctx.font = `bold 17px ${GAME_FONT_FAMILY}`;
    ctx.fillText('BOOTH 404', 172, 132);
    ctx.fillText('COSPLAY: BUG', 648, 132);
    ctx.font = `15px ${GAME_FONT_FAMILY}`;
    ctx.fillText('free stickers', 174, 172);
    ctx.fillText('queue overflow', 650, 172);
    ctx.fillStyle = motionFrame % 50 < 25 ? 'rgba(154, 52, 18, 0.88)' : 'rgba(154, 52, 18, 0.45)';
    ctx.fillText('DAY PASS', 438, 126);

    for (let x = 240; x <= 760; x += 130) {
        ctx.fillStyle = 'rgba(154, 52, 18, 0.26)';
        ctx.fillRect(x, 250, 46, 58);
        ctx.strokeStyle = arena.ground;
        ctx.strokeRect(x, 250, 46, 58);
    }

    ctx.fillStyle = 'rgba(154, 52, 18, 0.08)';
    ctx.font = `26px ${GAME_FONT_FAMILY}`;
    ctx.fillText('GEEKCON 404', 400, 220);

    ctx.fillStyle = 'rgba(154, 52, 18, 0.10)';
    for (let i = 0; i < 12; i++) {
        const cx = 80 + i * 78;
        ctx.beginPath();
        ctx.arc(cx, 265, 8, 0, Math.PI * 2);
        ctx.fill();
    }
}
