const AI_LEARNING_INFLUENCE = 0.10;

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
    whiffIntercept = null,
    antiAirIntercept = null,
    opponentCornered = false,
    postHitPause = false,
    canAirPunch = false,
    canAirKick = false,
    airAttackUsed = false,
    timedRound = false,
    lateRound = false,
    cpuBehind = false,
    previousDecision = '',
    difficulty,
    rand,
    aiLearningState,
    aiLearningTable,
    decisionMeta
}) {
    const protectedAction = (action) => {
        if (decisionMeta) {
            decisionMeta.source = 'protected';
            decisionMeta.candidates = null;
        }
        return action;
    };
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

    // Hesitation never disables a live grounded defensive response.
    if (postHitPause) return protectedAction(opponentAttacking && onGround && dist < 170 ? 'block' : 'idle');

    if (!onGround) {
        if (!canAttack || airAttackUsed || rand >= (difficulty.airAttackChance ?? 0)) return protectedAction('idle');
        if (canAirKick && dist > ATTACKS.airPunch.range) return protectedAction('airKick');
        if (canAirPunch) return protectedAction('airPunch');
        if (canAirKick) return protectedAction('airKick');
        return protectedAction('idle');
    }

    if (opponentWhiffed && opponentRecovery > 0 && rand < (difficulty.whiffPunishChance ?? 0)) {
        if (opponentRecovery > (difficulty.punishSafetyFrames ?? 0)) {
            if (kickReady && dist > ATTACKS.punch.range) return protectedAction('kick');
            if (punchReady) return protectedAction('punch');
            if (kickReady) return protectedAction('kick');
            if (whiffIntercept) return protectedAction('punish');
        }
    }

    const antiAirChance = Math.min(difficulty.maxBlockReaction ?? 0.9,
        (difficulty.antiAirChance ?? 0) + opponentAirBias * (difficulty.airPatternBonus ?? 0));
    if (antiAirIntercept && rand < antiAirChance) return protectedAction('antiAir');

    if (!opponentAttacking && opponentPunchBias > 0.45 && opponentPunchBias > opponentKickBias && opponentPunchBias > opponentSpecialBias && rand < (difficulty.crouchDefenseChance ?? 0)) {
        return protectedAction('crouch');
    }

    if (!latePressure && !opponentAttacking && inMidRange && !retreatBlocked && (opponentAttackBias > 0.5 || repeatedAttackBias > 0.5) && rand < (difficulty.baitChance ?? 0)) {
        return protectedAction('retreat');
    }

    if (opponentAttacking && dist < 170 && onGround && rand < blockReaction) {
        return protectedAction('block');
    }

    if (specialReady && (
        opponentHealth <= ATTACKS.special.damage ||
        opponentHealth - health >= (difficulty.comebackSpecialGap ?? 22) && rand < (difficulty.comebackSpecialChance ?? 0.28) ||
        rand < (difficulty.specialChance ?? 0.18)
    )) return protectedAction('special');

    if (counterTimer > 0 && rand < (difficulty.counterChance ?? 0.45)) {
        if (kickReady && dist > ATTACKS.punch.range) return protectedAction('kick');
        if (punchReady) return protectedAction('punch');
        if (kickReady) return protectedAction('kick');
    }

    if (health <= 30 && dist < 190) {
        if (!latePressure) {
            if (!retreatBlocked && rand < (difficulty.lowHealthRetreat ?? 0.7)) return protectedAction('retreat');
            return protectedAction('block');
        }
    }

    if (retreatBlocked && !opponentAttacking && opponentAttackBias <= 0.5 && repeatedAttackBias <= 0.5 &&
        canAttack && dist < AI_TACTICS.cornerPressureRange &&
        rand < (difficulty.cornerEscapeChance ?? 0)) return protectedAction('escape');

    if (latePressure && !opponentAttacking) {
        return protectedAction(chooseAIPressureAction(dist, punchReady, kickReady));
    }

    if (!opponentAttacking && opponentBlockBias >= (difficulty.antiTurtleBlockThreshold ?? 1) && rand < (difficulty.antiTurtleChance ?? 0)) {
        return protectedAction(chooseAIPressureAction(dist, punchReady, kickReady));
    }

    if (opponentCornered && !opponentAttacking && dist < AI_TACTICS.cornerPressureRange &&
        rand < (difficulty.cornerPressureChance ?? 0)) {
        return protectedAction(chooseAIPressureAction(dist, punchReady, kickReady));
    }

    if (opponentAttackBias > 0.5 && dist < 170 && onGround && rand < blockReaction) return protectedAction('block');

    if (opponentAirBias > 0.45 && zoneAttackBias > 0.35 && dist < 180 && onGround && kickReady && rand < (difficulty.airPatternKick ?? 0)) {
        return protectedAction('kick');
    }

    if (repeatedAttackBias > 0.5 && dist < 180 && onGround && rand < blockReaction) return protectedAction('block');

    // Keep close-wall defense first-match; variation only chooses neutral options.
    if (dist > 110 || !retreatBlocked) return chooseAINeutralAction({
        dist, punchReady, kickReady, retreatBlocked, opponentBlockBias, difficulty, rand, previousDecision,
        aiLearningState, aiLearningTable, decisionMeta
    });

    if (kickReady && dist > ATTACKS.punch.range && rand < difficulty.kickClose) return protectedAction('kick');
    if (punchReady && rand < difficulty.punchClose) return protectedAction('punch');
    if (kickReady && rand < difficulty.kickClose) return protectedAction('kick');
    if (opponentBlockBias > 0.5 && !retreatBlocked && rand > difficulty.blockClose) return protectedAction('retreat');
    if (rand < difficulty.blockClose) return protectedAction('block');
    if (retreatBlocked) return protectedAction(onGround && rand < (difficulty.cornerJump ?? 0.45) ? 'jump' : 'block');
    return protectedAction(punchReady || kickReady ? 'retreat' : 'approach');
}

function chooseWeightedAIAction(candidates, rand, previousDecision, repeatWeight, stateIndex, table, influence = 0) {
    const repeatedCandidates = candidates.map(([action, weight]) => [
        action,
        weight * (action === previousDecision ? repeatWeight : 1)
    ]);
    const weightedCandidates = table && stateIndex !== undefined
        ? applyAIQWeights(repeatedCandidates, stateIndex, table, { influence })
        : repeatedCandidates;
    const weights = weightedCandidates.map(([, weight]) => weight);
    let cursor = rand * weights.reduce((sum, weight) => sum + weight, 0);
    for (let i = 0; i < candidates.length; i++) {
        cursor -= weights[i];
        if (cursor < 0) return candidates[i][0];
    }
    return candidates[candidates.length - 1][0];
}

function chooseAINeutralAction({ dist, punchReady, kickReady, retreatBlocked, opponentBlockBias, difficulty: d, rand, previousDecision, aiLearningState, aiLearningTable, decisionMeta }) {
    const candidates = [];
    const add = (action, weight, legal = true) => { if (legal && weight > 0) candidates.push([action, weight]); };
    if (dist > 250) {
        add('approach', d.approachLong);
        add('idle', 1 - d.approachLong);
    } else if (dist > 110) {
        add('kick', d.kickMid, kickReady);
        add('approach', d.approachMid - d.kickMid);
        add('retreat', d.retreatMid - d.approachMid, !retreatBlocked);
        add('jump', d.jumpMid - d.retreatMid);
        add('block', 1 - d.jumpMid);
    } else {
        const outer = dist > ATTACKS.punch.range;
        add('punch', d.punchClose, punchReady && !(outer && kickReady));
        add('kick', outer ? d.kickClose : d.kickClose - d.punchClose, kickReady);
        add('block', d.blockClose - (outer && !kickReady ? d.punchClose : d.kickClose));
        add(punchReady || kickReady || opponentBlockBias > 0.5 ? 'retreat' : 'approach', 1 - d.blockClose);
    }
    if (decisionMeta) {
        decisionMeta.source = 'neutral';
        decisionMeta.candidates = candidates;
    }
    return chooseWeightedAIAction(candidates, rand, previousDecision, d.neutralRepeatWeight,
        aiLearningState, aiLearningTable, AI_LEARNING_INFLUENCE);
}

function chooseAIPressureAction(dist, punchReady, kickReady) {
    if (punchReady && dist <= ATTACKS.punch.range) return 'punch';
    if (kickReady && dist <= ATTACKS.kick.range) return 'kick';
    return 'approach';
}

// Q-learning helpers for plan_0051 — bounded round-local learning
// 45 states = 3 distances × 5 opponent states × 3 health buckets
// 7 actions = approach, retreat, block, jump, idle, punch, kick
// 315 cells total in Float32Array

function encodeAILearningState(dist, opponentState, cpuHealth, opponentHealth, difficulty) {
    const distanceIdx = dist <= 110 ? 0 : (dist <= 250 ? 1 : 2);
    let oppIdx;
    if (!opponentState.onGround) oppIdx = 0; // air
    else if (opponentState.lastAttackOutcome === 'whiff' && opponentState.attackCooldown > 0) oppIdx = 1; // whiffRecovery
    else if (opponentState.state === 'punch' || opponentState.state === 'kick' || opponentState.state === 'special') oppIdx = 2; // attack
    else if (opponentState.state === 'block') oppIdx = 3; // block
    else oppIdx = 4; // neutral
    const delta = cpuHealth - opponentHealth;
    const gap = difficulty.lateRoundHealthGap || 18;
    const healthIdx = delta >= gap ? 0 : (delta <= -gap ? 2 : 1);
    return ((distanceIdx * 5) + oppIdx) * 3 + healthIdx;
}

function updateAIQValue(table, state, action, reward, nextState, nextLegalMask, config) {
    const alpha = config.alpha;
    const gamma = config.gamma;
    const currentQ = table[state * 7 + action];
    let maxNextQ = 0;
    if (nextState >= 0 && nextLegalMask) {
        let maxVal = -Infinity;
        for (let a = 0; a < 7; a++) {
            if (nextLegalMask[a] && table[nextState * 7 + a] > maxVal) maxVal = table[nextState * 7 + a];
        }
        maxNextQ = maxVal > -Infinity ? maxVal : 0;
    }
    const target = reward + gamma * maxNextQ;
    const newQ = currentQ + alpha * (target - currentQ);
    table[state * 7 + action] = Math.max(-1, Math.min(1, newQ));
    return table[state * 7 + action];
}

function applyAIQWeights(candidates, stateIndex, table, config) {
    if (!candidates || candidates.length === 0) return candidates;
    const influence = config.influence || 0;
    if (influence <= 0) return candidates;
    const actionMap = { approach: 0, retreat: 1, block: 2, jump: 3, idle: 4, punch: 5, kick: 6 };
    return candidates.map(([action, weight]) => {
        const actionIdx = actionMap[action];
        if (actionIdx === undefined) return [action, weight];
        const q = table[stateIndex * 7 + actionIdx];
        const multiplier = Math.max(0.5, Math.min(1.5, 1 + influence * q));
        return [action, weight * multiplier];
    });
}

function getAIDecisionCandidates({ dist, punchReady, kickReady, retreatBlocked, opponentBlockBias, difficulty: d }) {
    const candidates = [];
    const add = (action, weight, legal = true) => { if (legal && weight > 0) candidates.push([action, weight]); };
    if (dist > 250) {
        add('approach', d.approachLong);
        add('idle', 1 - d.approachLong);
    } else if (dist > 110) {
        add('kick', d.kickMid, kickReady);
        add('approach', d.approachMid - d.kickMid);
        add('retreat', d.retreatMid - d.approachMid, !retreatBlocked);
        add('jump', d.jumpMid - d.retreatMid);
        add('block', 1 - d.jumpMid);
    } else {
        const outer = dist > ATTACKS.punch.range;
        add('punch', d.punchClose, punchReady && !(outer && kickReady));
        add('kick', outer ? d.kickClose : d.kickClose - d.punchClose, kickReady);
        add('block', d.blockClose - (outer && !kickReady ? d.punchClose : d.kickClose));
        add(punchReady || kickReady || opponentBlockBias > 0.5 ? 'retreat' : 'approach', 1 - d.blockClose);
    }
    return candidates;
}
