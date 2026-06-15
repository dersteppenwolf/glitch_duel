const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const WIDTH = 1000;
const HEIGHT = 500;
const GROUND_Y = 380;
const MAX_DEVICE_PIXEL_RATIO = 2;
const ROUNDS_TO_WIN = 2;
const ROUND_TIME_SECONDS = 60;
const ROUND_TIMER_FRAMES = ROUND_TIME_SECONDS * 60;
const ATTACKS = {
    punch: { damage: 8, range: 95, cooldown: 12 },
    kick: { damage: 14, range: 135, cooldown: 24 }
};
const BLOCK_DAMAGE_MULTIPLIER = 0.2;
const DIFFICULTIES = {
    easy: {
        decisionMin: 22,
        decisionSpread: 14,
        moveSpeed: 3.5,
        approachLong: 0.65,
        approachMid: 0.45,
        retreatMid: 0.75,
        jumpMid: 0.88,
        punchClose: 0.25,
        kickClose: 0.52,
        blockClose: 0.78
    },
    normal: {
        decisionMin: 12,
        decisionSpread: 10,
        moveSpeed: 4.5,
        approachLong: 0.85,
        approachMid: 0.60,
        retreatMid: 0.80,
        jumpMid: 0.95,
        punchClose: 0.40,
        kickClose: 0.75,
        blockClose: 0.90
    },
    hard: {
        decisionMin: 7,
        decisionSpread: 6,
        moveSpeed: 5.2,
        approachLong: 0.95,
        approachMid: 0.72,
        retreatMid: 0.86,
        jumpMid: 0.93,
        punchClose: 0.52,
        kickClose: 0.88,
        blockClose: 0.96
    }
};
