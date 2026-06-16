const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const WIDTH = 1000;
const HEIGHT = 500;
const GROUND_Y = 380;
const MAX_DEVICE_PIXEL_RATIO = 2;
const GAME_FONT_FAMILY = '"JetBrains Mono", "Cascadia Mono", Consolas, monospace';
const ROUNDS_TO_WIN = 2;
const ROUND_TIME_SECONDS = 60;
const ROUND_TIME_MS = ROUND_TIME_SECONDS * 1000;
const ROUND_TIMER_FRAMES = ROUND_TIME_SECONDS * 60;
const MAX_ENERGY = 100;
const SPECIAL_ENERGY_COST = 100;
const COMBO_WINDOW_FRAMES = 36;
const ENERGY_GAIN_ON_HIT = 14;
const ENERGY_GAIN_ON_BLOCK = 6;
const ENERGY_GAIN_ON_DAMAGE = 8;
const ATTACKS = {
    punch: { damage: 8, range: 95, cooldown: 12, height: 36, yOffset: -66, xOffset: 20, animation: 'punch' },
    kick: { damage: 14, range: 135, cooldown: 24, height: 42, yOffset: -32, xOffset: 18, animation: 'kick' },
    airPunch: { damage: 9, range: 90, cooldown: 18, height: 42, yOffset: -78, xOffset: 18, animation: 'airPunch' },
    airKick: { damage: 13, range: 125, cooldown: 28, height: 46, yOffset: -48, xOffset: 18, animation: 'airKick' },
    comboPunch: { damage: 12, range: 108, cooldown: 18, height: 38, yOffset: -68, xOffset: 22, animation: 'punch' },
    comboKick: { damage: 18, range: 150, cooldown: 30, height: 46, yOffset: -34, xOffset: 18, animation: 'kick' },
    backKick: { damage: 22, range: 145, cooldown: 36, height: 48, yOffset: -30, xOffset: 16, animation: 'kick' },
    special: { damage: 26, range: 185, cooldown: 45, height: 64, yOffset: -76, xOffset: 20, animation: 'special' }
};
const BLOCK_DAMAGE_MULTIPLIER = 0.2;
const FIGHTER_STYLES = {
    balanced: { labelKey: 'styleBalanced', moveSpeed: 1, damage: 1, energy: 1, health: 1 },
    fast: { labelKey: 'styleFast', moveSpeed: 1.14, damage: 0.9, energy: 1, health: 1 },
    heavy: { labelKey: 'styleHeavy', moveSpeed: 0.88, damage: 1.14, energy: 1, health: 1 },
    technical: { labelKey: 'styleTechnical', moveSpeed: 1, damage: 0.94, energy: 1.25, health: 0.92 }
};
const DIFFICULTIES = {
    easy: {
        decisionMin: 22,
        decisionSpread: 14,
        moveSpeed: 3.5,
        blockReaction: 0.35,
        approachLong: 0.65,
        approachMid: 0.45,
        retreatMid: 0.75,
        jumpMid: 0.88,
        punchClose: 0.25,
        kickMid: 0.12,
        kickClose: 0.52,
        blockClose: 0.78,
        specialChance: 0.10,
        lowHealthRetreat: 0.60,
        cornerJump: 0.30,
        counterWindow: 10,
        counterChance: 0.25,
        comebackSpecialChance: 0.14,
        comebackSpecialGap: 28,
        patternMemoryGain: 10,
        patternMemoryDecay: 2,
        patternBlockBonus: 0.10
    },
    normal: {
        decisionMin: 12,
        decisionSpread: 10,
        moveSpeed: 4.5,
        blockReaction: 0.60,
        approachLong: 0.85,
        approachMid: 0.60,
        retreatMid: 0.80,
        jumpMid: 0.95,
        punchClose: 0.40,
        kickMid: 0.24,
        kickClose: 0.75,
        blockClose: 0.90,
        specialChance: 0.18,
        lowHealthRetreat: 0.70,
        cornerJump: 0.45,
        counterWindow: 14,
        counterChance: 0.45,
        comebackSpecialChance: 0.28,
        comebackSpecialGap: 22,
        patternMemoryGain: 12,
        patternMemoryDecay: 2,
        patternBlockBonus: 0.16
    },
    hard: {
        decisionMin: 7,
        decisionSpread: 6,
        moveSpeed: 5.2,
        blockReaction: 0.82,
        approachLong: 0.95,
        approachMid: 0.72,
        retreatMid: 0.86,
        jumpMid: 0.93,
        punchClose: 0.52,
        kickMid: 0.38,
        kickClose: 0.88,
        blockClose: 0.96,
        specialChance: 0.26,
        lowHealthRetreat: 0.78,
        cornerJump: 0.60,
        counterWindow: 18,
        counterChance: 0.65,
        comebackSpecialChance: 0.42,
        comebackSpecialGap: 16,
        patternMemoryGain: 14,
        patternMemoryDecay: 2,
        patternBlockBonus: 0.22
    }
};
const ARENAS = {
    notebook: {
        label: 'CUADERNO',
        labelKey: 'arenaNotebook',
        background: '#f8f6f0',
        ground: '#222',
        accent: 'rgba(0, 0, 0, 0.08)'
    },
    cafeteria: {
        label: 'CAFETERIA',
        labelKey: 'arenaCafeteria',
        background: '#f2dfc2',
        ground: '#7c4f2c',
        accent: 'rgba(124, 79, 44, 0.24)'
    },
    lab: {
        label: 'LABORATORIO',
        labelKey: 'arenaLab',
        background: '#e8f4ff',
        ground: '#24537a',
        accent: 'rgba(36, 83, 122, 0.12)'
    },
    meeting: {
        label: 'REUNION PRESENCIAL',
        labelKey: 'arenaMeeting',
        background: '#f4efe6',
        ground: '#5b4636',
        accent: 'rgba(91, 70, 54, 0.22)'
    },
    remoteMeeting: {
        label: 'REUNION REMOTA',
        labelKey: 'arenaRemoteMeeting',
        background: '#dbeafe',
        ground: '#1d4ed8',
        accent: 'rgba(29, 78, 216, 0.18)'
    },
    mathClass: {
        label: 'CLASE DE MATEMATICAS',
        labelKey: 'arenaMathClass',
        background: '#eef7e5',
        ground: '#365314',
        accent: 'rgba(54, 83, 20, 0.16)'
    },
    serverDown: {
        label: 'SERVIDOR CAIDO',
        labelKey: 'arenaServerDown',
        background: '#1f2937',
        ground: '#ef4444',
        accent: 'rgba(239, 68, 68, 0.22)'
    },
    geekConvention: {
        label: 'CONVENCION GEEK',
        labelKey: 'arenaGeekConvention',
        background: '#fff7ed',
        ground: '#9a3412',
        accent: 'rgba(154, 52, 18, 0.18)'
    }
};
