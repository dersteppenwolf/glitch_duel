function drawBackground() {
    const arena = getArenaConfig();

    ctx.fillStyle = arena.background;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.strokeStyle = arena.accent;
    ctx.lineWidth = 1;

    for (let x = 0; x < WIDTH; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, HEIGHT);
        ctx.stroke();
    }

    drawArenaDetails(selectedArena, arena);

    ctx.strokeStyle = arena.ground;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y + 35);

    for (let x = 0; x <= WIDTH; x += 30) {
        ctx.lineTo(x, GROUND_Y + 35 + Math.sin(x / 20) * 3);
    }

    ctx.stroke();
}

function getArenaMotionFrame() {
    return reducedMotionEnabled ? 0 : visualFrame;
}

function drawArenaDetails(arenaKey, arena) {
    ctx.save();
    ctx.globalAlpha = 0.82;

    if (arenaKey === 'cafeteria') drawCafeteriaDetails(arena);
    else if (arenaKey === 'lab') drawLabDetails(arena);
    else if (arenaKey === 'meeting') drawMeetingDetails(arena);
    else if (arenaKey === 'remoteMeeting') drawRemoteMeetingDetails(arena);
    else if (arenaKey === 'mathClass') drawMathClassDetails(arena);
    else if (arenaKey === 'serverDown') drawServerDownDetails(arena);
    else if (arenaKey === 'geekConvention') drawGeekConventionDetails(arena);
    else drawNotebookDetails(arena);

    ctx.restore();
}

function drawNotebookDetails(arena) {
    ctx.strokeStyle = 'rgba(200, 40, 40, 0.35)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(95, 0);
    ctx.lineTo(95, GROUND_Y + 20);
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
}

function drawCafeteriaDetails(arena) {
    const motionFrame = getArenaMotionFrame();
    ctx.fillStyle = 'rgba(124, 79, 44, 0.22)';
    ctx.fillRect(80, 250, 840, 70);
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

    ctx.strokeStyle = arena.ground;
    ctx.lineWidth = 3;
    ctx.strokeRect(92, 105, 190, 95);
    ctx.strokeRect(720, 85, 170, 130);
    ctx.fillStyle = 'rgba(36, 83, 122, 0.55)';
    ctx.font = `18px ${GAME_FONT_FAMILY}`;
    ctx.fillText('E = mc^2?', 120, 145);
    ctx.fillText('NaN sample', 745, 125);
    ctx.fillText('DO NOT LICK', 742, 165);

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
    ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
    ctx.fillRect(340, 72, 320, 150);
    ctx.strokeStyle = arena.ground;
    ctx.lineWidth = 3;
    ctx.strokeRect(340, 72, 320, 150);

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
}

function drawMathClassDetails(arena) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.fillRect(105, 72, 790, 210);
    ctx.strokeStyle = arena.ground;
    ctx.lineWidth = 4;
    ctx.strokeRect(105, 72, 790, 210);

    ctx.fillStyle = arena.ground;
    ctx.font = `bold 21px ${GAME_FONT_FAMILY}`;
    ctx.fillText('f(punch) = pain', 145, 126);
    ctx.fillText('CPU != friend', 560, 128);
    ctx.font = `18px ${GAME_FONT_FAMILY}`;
    ctx.fillText('lim combo -> K.O.', 190, 190);
    ctx.fillText('bug theorem: hit first', 520, 220);
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

    ctx.fillStyle = '#fecaca';
    ctx.font = `bold 18px ${GAME_FONT_FAMILY}`;
    ctx.fillText('SERVER DOWN', 126, 122);
    ctx.fillText('500', 760, 122);
    ctx.font = `15px ${GAME_FONT_FAMILY}`;
    ctx.fillText('retrying...', 130, 170);
    ctx.fillText('coffee required', 718, 172);
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
}
