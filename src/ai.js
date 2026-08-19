function chooseAIAction({
    dist,
    health,
    energy,
    onGround,
    opponentAttacking,
    canPunch,
    canKick,
    canSpecial = false,
    attackCooldown = 0,
    opponentHealth = 100,
    x = 0,
    opponentX = 0,
    nearLeftWall = false,
    nearRightWall = false,
    counterTimer = 0,
    opponentAttackBias = 0,
    opponentBlockBias = 0,
    opponentPunchBias = 0,
    opponentKickBias = 0,
    opponentSpecialBias = 0,
    opponentAirBias = 0,
    zoneAttackBias = 0,
    repeatedAttackBias = 0,
    opponentWhiffed = false,
    opponentRecovery = 0,
    canAirPunch = false,
    canAirKick = false,
    airAttackUsed = false,
    timedRound = false,
    lateRound = false,
    cpuBehind = false,
    difficulty,
    rand
}) {
    const canAttack = attackCooldown <= 0;
    const punchReady = canAttack && canPunch;
    const kickReady = canAttack && canKick;
    const specialReady = canAttack && canSpecial && energy >= SPECIAL_ENERGY_COST;
    const retreatBlocked = (x < opponentX && nearLeftWall) || (x > opponentX && nearRightWall);
    const inMidRange = dist > 110 && dist <= 250;
    const latePressure = timedRound && lateRound && cpuBehind;
    const typeAttackBias = Math.max(opponentPunchBias, opponentKickBias, opponentSpecialBias, opponentAirBias);
    const blockReaction = Math.min(
        difficulty.maxBlockReaction ?? 0.96,
        (difficulty.blockReaction ?? 1) +
            opponentAttackBias * (difficulty.patternBlockBonus ?? 0) +
            typeAttackBias * (difficulty.patternTypeBlockBonus ?? 0) +
            repeatedAttackBias * (difficulty.spamBlockBonus ?? 0) +
            zoneAttackBias * (difficulty.zoneBlockBonus ?? 0)
    );

    if (!onGround) {
        if (!canAttack || airAttackUsed || rand >= (difficulty.airAttackChance ?? 0)) return 'idle';
        if (canAirKick && dist > ATTACKS.airPunch.range) return 'airKick';
        if (canAirPunch) return 'airPunch';
        if (canAirKick) return 'airKick';
        return 'idle';
    }

    if (opponentWhiffed && opponentRecovery > 0 && rand < (difficulty.whiffPunishChance ?? 0)) {
        if (kickReady && dist > ATTACKS.punch.range) return 'kick';
        if (punchReady) return 'punch';
        if (kickReady) return 'kick';
        if (inMidRange) return 'approach';
    }

    if (!opponentAttacking && opponentPunchBias > 0.45 && opponentPunchBias > opponentKickBias && opponentPunchBias > opponentSpecialBias && rand < (difficulty.crouchDefenseChance ?? 0)) {
        return 'crouch';
    }

    if (!latePressure && !opponentAttacking && inMidRange && !retreatBlocked && (opponentAttackBias > 0.5 || repeatedAttackBias > 0.5) && rand < (difficulty.baitChance ?? 0)) {
        return 'retreat';
    }

    if (opponentAttacking && dist < 170 && onGround && rand < blockReaction) {
        return 'block';
    }

    if (specialReady && (
        opponentHealth <= ATTACKS.special.damage ||
        opponentHealth - health >= (difficulty.comebackSpecialGap ?? 22) && rand < (difficulty.comebackSpecialChance ?? 0.28) ||
        rand < (difficulty.specialChance ?? 0.18)
    )) return 'special';

    if (counterTimer > 0 && rand < (difficulty.counterChance ?? 0.45)) {
        if (kickReady && dist > ATTACKS.punch.range) return 'kick';
        if (punchReady) return 'punch';
        if (kickReady) return 'kick';
    }

    if (health <= 30 && dist < 190) {
        if (!latePressure) {
            if (!retreatBlocked && rand < (difficulty.lowHealthRetreat ?? 0.7)) return 'retreat';
            return 'block';
        }
    }

    if (latePressure && !opponentAttacking) {
        return chooseAIPressureAction(dist, punchReady, kickReady);
    }

    if (!opponentAttacking && opponentBlockBias >= (difficulty.antiTurtleBlockThreshold ?? 1) && rand < (difficulty.antiTurtleChance ?? 0)) {
        return chooseAIPressureAction(dist, punchReady, kickReady);
    }

    if (opponentAttackBias > 0.5 && dist < 170 && onGround && rand < blockReaction) return 'block';

    if (opponentAirBias > 0.45 && zoneAttackBias > 0.35 && dist < 180 && onGround && kickReady && rand < (difficulty.airPatternKick ?? 0)) {
        return 'kick';
    }

    if (repeatedAttackBias > 0.5 && dist < 180 && onGround && rand < blockReaction) return 'block';

    if (dist > 250) {
        return rand < difficulty.approachLong ? 'approach' : 'idle';
    }

    if (dist > 110) {
        if (kickReady && rand < (difficulty.kickMid ?? 0)) return 'kick';
        if (rand < difficulty.approachMid) return 'approach';
        if (!retreatBlocked && rand < difficulty.retreatMid) return 'retreat';
        if (rand < difficulty.jumpMid && onGround) return 'jump';
        return 'block';
    }

    if (kickReady && dist > ATTACKS.punch.range && rand < difficulty.kickClose) return 'kick';
    if (punchReady && rand < difficulty.punchClose) return 'punch';
    if (kickReady && rand < difficulty.kickClose) return 'kick';
    if (opponentBlockBias > 0.5 && !retreatBlocked && rand > difficulty.blockClose) return 'retreat';
    if (rand < difficulty.blockClose) return 'block';
    if (retreatBlocked) return onGround && rand < (difficulty.cornerJump ?? 0.45) ? 'jump' : 'block';
    return punchReady || kickReady ? 'retreat' : 'approach';
}

function chooseAIPressureAction(dist, punchReady, kickReady) {
    if (punchReady && dist <= ATTACKS.punch.range) return 'punch';
    if (kickReady && dist <= ATTACKS.kick.range) return 'kick';
    return 'approach';
}
