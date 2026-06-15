const DEFAULT_LANGUAGE = 'es';
const LANGUAGE_STORAGE_KEY = 'xkcdKombatLanguage';
const SUPPORTED_LANGUAGES = ['es', 'en'];

const I18N = {
    es: {
        htmlLang: 'es',
        languageName: 'Espanol',
        instructions: 'xkcd KOMBAT - Modo Solo (Humano vs Maquina)',
        orientationWarning: 'GIRA EL DISPOSITIVO PARA JUGAR MEJOR',
        canvasLabel: 'Arena de combate xkcd KOMBAT',
        pauseButton: 'PAUSA',
        pauseButtonLabel: 'Pausar partida',
        menuKicker: 'Arcade VS AI',
        menuIntro: 'Derrota a la maquina en un duelo stickman de punetazos, patadas y bugs.',
        start: 'INICIAR JUEGO',
        help: 'AYUDA',
        language: 'Idioma',
        difficulty: 'Dificultad',
        arena: 'Arena',
        reduceMotion: 'Reducir movimiento',
        stats: 'Victorias: {wins} | Derrotas: {losses} | Racha: {currentStreak} | Mejor: {bestStreak}',
        controls: 'Controles',
        move: 'Mover',
        jump: 'Saltar',
        crouch: 'Agacharse',
        block: 'Bloquear',
        punch: 'Punetazo',
        punchFast: 'Punetazo rapido',
        kick: 'Patada',
        kickLong: 'Patada larga',
        specialShort: 'Especial (energia llena)',
        specialLong: 'Especial: requiere barra llena y consume energia',
        pause: 'Pausa',
        pauseResume: 'Pausar o reanudar',
        helpKicker: 'Manual de combate',
        objective: 'Objetivo',
        objectiveText: 'Reduce la vida de la CPU a 0% antes de que la maquina haga lo mismo contigo.',
        combos: 'Combos',
        comboNote: 'Pulsa la segunda tecla rapido; si esperas demasiado, sale un ataque normal.',
        comboJJ: 'Rapido, buena recuperacion',
        comboJK: 'Mas alcance y dano',
        comboKK: 'Back kick pesado',
        tips: 'Consejos',
        tipBlock: 'El bloqueo reduce el impacto pero te deja quieto.',
        tipPunch: 'El punetazo es mas rapido; la patada llega mas lejos.',
        tipCpu: 'Si la CPU se acerca demasiado, retrocede y castiga con patada.',
        back: 'VOLVER',
        pauseKicker: 'Combate detenido',
        pauseTitle: 'PAUSA',
        pauseText: 'Respira, revisa tu estrategia y vuelve al duelo cuando estes listo.',
        resume: 'RESUMIR',
        menu: 'MENU',
        restart: 'REINICIAR',
        leftLabel: 'Mover izquierda',
        rightLabel: 'Mover derecha',
        specialButtonLabel: 'Ataque especial con energia llena',
        human: 'HUMANO',
        cpu: 'CPU',
        cpuAI: 'CPU (IA)',
        round: 'ROUND',
        fight: 'FIGHT!',
        blockStatus: 'BLOCK',
        ko: 'K.O.',
        time: 'TIME!',
        tie: 'EMPATE',
        roundHuman: 'ROUND HUMANO',
        roundCpu: 'ROUND CPU',
        playerWins: '¡SISTEMA DOMINADO!<br>😎',
        cpuWins: '¡LA MAQUINA GANA!<br>🤖',
        pauseSummary: 'Round {round} | Marcador {score} | Tiempo {seconds}s | Dificultad {difficulty} | Arena {arena} | Controles: A/D/W/C, S/I bloqueo, J/K, L especial con energia llena, P o Esc para reanudar',
        difficultyEasy: 'FACIL',
        difficultyNormal: 'NORMAL',
        difficultyHard: 'DIFICIL',
        arenaNotebook: 'CUADERNO',
        arenaCafeteria: 'CAFETERIA',
        arenaLab: 'LABORATORIO',
        arenaMeeting: 'REUNION PRESENCIAL',
        arenaRemoteMeeting: 'REUNION REMOTA'
    },
    en: {
        htmlLang: 'en',
        languageName: 'English',
        instructions: 'xkcd KOMBAT - Solo Mode (Human vs Machine)',
        orientationWarning: 'ROTATE YOUR DEVICE FOR A BETTER FIGHT',
        canvasLabel: 'xkcd KOMBAT combat arena',
        pauseButton: 'PAUSE',
        pauseButtonLabel: 'Pause match',
        menuKicker: 'Arcade VS AI',
        menuIntro: 'Defeat the machine in a stickman duel of punches, kicks, and bugs.',
        start: 'START GAME',
        help: 'HELP',
        language: 'Language',
        difficulty: 'Difficulty',
        arena: 'Arena',
        reduceMotion: 'Reduce motion',
        stats: 'Wins: {wins} | Losses: {losses} | Streak: {currentStreak} | Best: {bestStreak}',
        controls: 'Controls',
        move: 'Move',
        jump: 'Jump',
        crouch: 'Crouch',
        block: 'Block',
        punch: 'Punch',
        punchFast: 'Quick punch',
        kick: 'Kick',
        kickLong: 'Long kick',
        specialShort: 'Special (full energy)',
        specialLong: 'Special: requires full bar and consumes energy',
        pause: 'Pause',
        pauseResume: 'Pause or resume',
        helpKicker: 'Combat manual',
        objective: 'Goal',
        objectiveText: 'Reduce CPU health to 0% before the machine does the same to you.',
        combos: 'Combos',
        comboNote: 'Press the second key quickly; if you wait too long, a normal attack comes out.',
        comboJJ: 'Fast, good recovery',
        comboJK: 'More range and damage',
        comboKK: 'Heavy back kick',
        tips: 'Tips',
        tipBlock: 'Blocking reduces impact but keeps you still.',
        tipPunch: 'Punch is faster; kick reaches farther.',
        tipCpu: 'If the CPU gets too close, back up and punish with a kick.',
        back: 'BACK',
        pauseKicker: 'Fight paused',
        pauseTitle: 'PAUSE',
        pauseText: 'Breathe, review your strategy, and return to the duel when ready.',
        resume: 'RESUME',
        menu: 'MENU',
        restart: 'RESTART',
        leftLabel: 'Move left',
        rightLabel: 'Move right',
        specialButtonLabel: 'Special attack with full energy',
        human: 'HUMAN',
        cpu: 'CPU',
        cpuAI: 'CPU (AI)',
        round: 'ROUND',
        fight: 'FIGHT!',
        blockStatus: 'BLOCK',
        ko: 'K.O.',
        time: 'TIME!',
        tie: 'TIE',
        roundHuman: 'HUMAN ROUND',
        roundCpu: 'CPU ROUND',
        playerWins: 'SYSTEM OVERRIDDEN!<br>😎',
        cpuWins: 'THE MACHINE WINS!<br>🤖',
        pauseSummary: 'Round {round} | Score {score} | Time {seconds}s | Difficulty {difficulty} | Arena {arena} | Controls: A/D/W/C, S/I block, J/K, L special with full energy, P or Esc to resume',
        difficultyEasy: 'EASY',
        difficultyNormal: 'NORMAL',
        difficultyHard: 'HARD',
        arenaNotebook: 'NOTEBOOK',
        arenaCafeteria: 'CAFETERIA',
        arenaLab: 'LAB',
        arenaMeeting: 'IN-PERSON MEETING',
        arenaRemoteMeeting: 'REMOTE MEETING'
    }
};

let selectedLanguage = loadLanguagePreference();

function isSupportedLanguage(value) {
    return SUPPORTED_LANGUAGES.includes(value);
}

function detectBrowserLanguage() {
    const candidates = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language];

    for (const language of candidates) {
        const code = String(language || '').toLowerCase();
        if (code.startsWith('es')) return 'es';
        if (code.startsWith('en')) return 'en';
    }

    return DEFAULT_LANGUAGE;
}

function loadLanguagePreference() {
    try {
        const saved = window.localStorage && window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (isSupportedLanguage(saved)) return saved;
    } catch (_) {
        // localStorage can be unavailable in private browsing or tests.
    }

    return detectBrowserLanguage();
}

function saveLanguagePreference() {
    try {
        if (window.localStorage) window.localStorage.setItem(LANGUAGE_STORAGE_KEY, selectedLanguage);
    } catch (_) {
        // localStorage can be unavailable in private browsing or tests.
    }
}

function getLanguage() {
    return selectedLanguage;
}

function setLanguage(value) {
    selectedLanguage = isSupportedLanguage(value) ? value : DEFAULT_LANGUAGE;
    saveLanguagePreference();
    if (typeof renderLanguage === 'function') renderLanguage();
}

function formatMessage(template, params = {}) {
    return String(template).replace(/\{(\w+)\}/g, (_, key) => (params[key] === undefined ? `{${key}}` : params[key]));
}

function t(key, params) {
    const dictionary = I18N[selectedLanguage] || I18N[DEFAULT_LANGUAGE];
    const fallback = I18N[DEFAULT_LANGUAGE];
    const value = dictionary[key] || fallback[key] || key;
    return params ? formatMessage(value, params) : value;
}
