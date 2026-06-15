function drawFighter(fighter) {
    ctx.save();
    const baseX = fighter.x;
    const baseY = fighter.y;
    const accentColor = fighter.accentColor || (fighter.isPlayer1 ? '#1f6feb' : '#d22');
    const label = fighter.labelKey ? t(fighter.labelKey) : (fighter.label || (fighter.isPlayer1 ? t('human') : t('cpu')));

    drawFighterIdentityMarker(baseX, baseY, label, accentColor);

    if (!fighter.facingRight) {
        ctx.scale(-1, 1);
        ctx.translate(-baseX * 2, 0);
    }

    const legAngle = fighter.state === 'walk' && fighter.onGround ? Math.sin(fighter.frame / 3) * 20 : 0;
    const headBob = fighter.state === 'hit' ? Math.sin(fighter.frame / 2) * 5 : 0;
    const isCrouching = fighter.state === 'crouch';
    const hipY = isCrouching ? baseY + 4 : baseY - 20;
    const torsoTopY = isCrouching ? baseY - 34 : baseY - 55;
    const shoulderY = isCrouching ? baseY - 28 : baseY - 48;
    const headY = isCrouching ? baseY - 54 : baseY - 75 + headBob;

    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(baseX, baseY + 38, 30, 7, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#111';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(baseX, hipY);
    ctx.lineTo(baseX - 15 + Math.sin(legAngle * Math.PI / 180) * 12, baseY + 35);
    ctx.stroke();

    if (fighter.state !== 'kick') {
        ctx.beginPath();
        ctx.moveTo(baseX, hipY);
        ctx.lineTo(baseX + 15 - Math.sin(legAngle * Math.PI / 180) * 12, baseY + 35);
        ctx.stroke();
    }

    ctx.beginPath();
    ctx.moveTo(baseX, torsoTopY);
    ctx.lineTo(baseX, hipY);
    ctx.stroke();

    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(baseX, shoulderY);
    ctx.quadraticCurveTo(baseX - 18, shoulderY + 13, baseX - 12, hipY + 5);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(baseX, shoulderY);

    if (fighter.state === 'punch' || fighter.state === 'special') {
        ctx.lineTo(baseX + 52, baseY - 48);
    } else if (fighter.state === 'kick') {
        ctx.quadraticCurveTo(baseX + 15, baseY - 35, baseX + 22, baseY - 20);
    } else if (fighter.state === 'block') {
        ctx.lineTo(baseX + 15, baseY - 65);
        ctx.lineTo(baseX + 15, baseY - 35);
    } else if (isCrouching) {
        ctx.quadraticCurveTo(baseX + 18, shoulderY + 12, baseX + 28, hipY + 2);
    } else {
        ctx.quadraticCurveTo(baseX + 18, baseY - 35, baseX + 12, baseY - 15);
    }

    ctx.stroke();

    if (fighter.state === 'punch' || fighter.state === 'special') {
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

        ctx.fillStyle = accentColor;
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

        if (fighter.state === 'special') {
            ctx.strokeStyle = accentColor;
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.arc(fistX + 8, fistY, 24, 0, Math.PI * 2);
            ctx.stroke();
        } else if (fighter.comboFlashTimer > 0 && fighter.lastAttackType === 'comboPunch') {
            ctx.strokeStyle = 'rgba(220, 40, 40, 0.65)';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.arc(fistX + 6, fistY, 22, -0.5, Math.PI * 1.5);
            ctx.stroke();
        }
    }

    if (fighter.state === 'kick') {
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

        ctx.fillStyle = accentColor;
        ctx.strokeStyle = '#111';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.ellipse(footX + 5, footY + 1, 13, 7, 0.18, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        if (fighter.comboFlashTimer > 0 && (fighter.lastAttackType === 'comboKick' || fighter.lastAttackType === 'backKick')) {
            ctx.strokeStyle = fighter.lastAttackType === 'backKick' ? 'rgba(0, 90, 255, 0.7)' : 'rgba(230, 130, 0, 0.7)';
            ctx.lineWidth = fighter.lastAttackType === 'backKick' ? 7 : 5;
            ctx.beginPath();
            ctx.arc(baseX + 35, baseY - 8, fighter.lastAttackType === 'backKick' ? 34 : 27, -0.65, 0.55);
            ctx.stroke();
        }
    }

    if (fighter.comboHintText) {
        ctx.font = 'bold 18px "Comic Sans MS"';
        ctx.textAlign = 'center';
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#000';
        ctx.strokeText(fighter.comboHintText, baseX, headY - 30);
        ctx.fillStyle = '#fff';
        ctx.fillText(fighter.comboHintText, baseX, headY - 30);
    }

    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(baseX, headY, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    drawFighterFaceAndDetail(fighter, baseX, baseY, headY, accentColor);

    if (fighter.state === 'block') {
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

function drawFighterIdentityMarker(baseX, baseY, label, accentColor) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.82)';
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(baseX, baseY - 136, 38, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 13px "Comic Sans MS"';
    ctx.textAlign = 'center';
    ctx.fillStyle = accentColor;
    ctx.fillText(label, baseX, baseY - 132);
}

function drawFighterFaceAndDetail(fighter, baseX, baseY, headY, accentColor) {
    if (fighter.visualRole === 'cpu') {
        ctx.fillStyle = accentColor;
        ctx.fillRect(baseX - 12, headY - 8, 24, 9);
        ctx.strokeStyle = '#111';
        ctx.lineWidth = 2;
        ctx.strokeRect(baseX - 12, headY - 8, 24, 9);

        ctx.strokeStyle = '#111';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(baseX, headY - 20);
        ctx.lineTo(baseX + 10, headY - 34);
        ctx.stroke();

        ctx.fillStyle = accentColor;
        ctx.beginPath();
        ctx.arc(baseX + 11, headY - 35, 4, 0, Math.PI * 2);
        ctx.fill();
        return;
    }

    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(baseX, headY - 2, 20, Math.PI * 1.08, Math.PI * 1.9);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(baseX + 15, headY - 16);
    ctx.lineTo(baseX + 29, headY - 24);
    ctx.stroke();

    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(baseX + 6, headY - 3, 3, 0, Math.PI * 2);
    ctx.fill();
}
