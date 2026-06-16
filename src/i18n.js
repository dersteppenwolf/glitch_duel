const DEFAULT_LANGUAGE = 'es';
const LANGUAGE_STORAGE_KEY = 'glitchDuelLanguage';
const LEGACY_LANGUAGE_STORAGE_KEY = 'xkcdKombatLanguage';
const SUPPORTED_LANGUAGES = ['es', 'en'];

const I18N = {
    es: {
        htmlLang: 'es',
        languageName: 'Espanol',
        instructions: 'GLITCH DUEL - Modo Solo (Humano vs Maquina)',
        orientationWarning: 'GIRA EL DISPOSITIVO PARA JUGAR MEJOR',
        canvasLabel: 'Arena de combate GLITCH DUEL',
        pauseButton: 'PAUSA',
        pauseButtonLabel: 'Pausar partida',
        menuKicker: 'Arcade VS AI',
        menuIntro: 'Duelo arcade de trazos contra la maquina: punetazos, patadas y bugs.',
        start: 'INICIAR JUEGO',
        help: 'AYUDA',
        language: 'Idioma',
        difficulty: 'Dificultad',
        arena: 'Arena',
        fighterStyle: 'Estilo',
        styleBalanced: 'BALANCEADO',
        styleFast: 'RAPIDO',
        styleHeavy: 'PESADO',
        styleTechnical: 'TECNICO',
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
        airAttacks: 'Ataques aereos',
        specialShort: 'Especial (energia llena)',
        specialLong: 'Especial: requiere barra llena y consume energia',
        specialReady: 'ESPECIAL LISTO',
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
        medalBug: 'Bug Exterminator',
        medalBugDetail: 'La maquina encontro su final de ciclo.',
        medalFirewall: 'Firewall Humano',
        medalFirewallDetail: 'Bloqueaste suficiente como para pasar auditoria.',
        medalCombo: 'Combo Goblin',
        medalComboDetail: 'Ganaste encadenando inputs como criatura de arcade.',
        medalSurvivor: '404 Survivor',
        medalSurvivorDetail: 'Sobreviviste con margen de error no encontrado.',
        medalMachine: 'Machine Approved',
        medalMachineDetail: 'La CPU certifica tu bug report.',
        finalScore: 'Marcador',
        finalDifficulty: 'Dificultad',
        finalArena: 'Arena',
        finalStreak: 'Racha',
        finalBest: 'Mejor',
        finalPhraseSpecial: 'Energia bien gastada. La CPU todavia esta renderizando excusas.',
        finalPhraseFirewall: 'Firewall activo: la maquina reboto contra tu guardia.',
        finalPhraseAir: 'Ganaste desde el aire. La gravedad abrio un ticket y lo cerraste con estilo.',
        finalPhraseFast: 'Velocidad de deploy: entraste, golpeaste y saliste antes del log.',
        finalPhraseHeavy: 'Modo pesado confirmado: cada golpe sono como migracion en viernes.',
        finalPhraseTechnical: 'Optimizacion pura: menos ruido, mas energia, cero desperdicio.',
        finalPhraseWin: 'Bug eliminado antes de que llegara a produccion.',
        finalPhraseLoss: 'La maquina gano esta vez. Claramente estaba usando hardcoded confidence.',
        pauseSummary: 'Round {round} | Marcador {score} | Tiempo {seconds}s | Dificultad {difficulty} | Arena {arena} | Controles: A/D/W/C, S/I bloqueo, J/K, L especial con energia llena, P o Esc para reanudar',
        difficultyEasy: 'FACIL',
        difficultyNormal: 'NORMAL',
        difficultyHard: 'DIFICIL',
        arenaNotebook: 'CUADERNO',
        arenaCafeteria: 'CAFETERIA',
        arenaLab: 'LABORATORIO',
        arenaMeeting: 'REUNION PRESENCIAL',
        arenaRemoteMeeting: 'REUNION REMOTA',
        arenaMathClass: 'CLASE DE MATEMATICAS',
        arenaServerDown: 'SERVIDOR CAIDO',
        arenaGeekConvention: 'CONVENCION GEEK',
        arenaPreviewNotebook: 'Bocetos, notas y garabatos antes del primer golpe.',
        arenaPreviewCafeteria: 'Cafe, mesa larga y vapor para pelear con energia.',
        arenaPreviewLab: 'Paneles, formulas y una muestra marcada como NaN.',
        arenaPreviewMeeting: 'Oficina, post-its y una reunion que pudo ser email.',
        arenaPreviewRemoteMeeting: 'Ventanas, mute, lag y reconexion emocional.',
        arenaPreviewMathClass: 'Pizarra, limites absurdos y bugs demostrables.',
        arenaPreviewServerDown: 'Rack roto, error 500 y luces rojas de panico.',
        arenaPreviewGeekConvention: 'Stands, stickers y una fila que nunca termina.'
    },
    en: {
        htmlLang: 'en',
        languageName: 'English',
        instructions: 'GLITCH DUEL - Solo Mode (Human vs Machine)',
        orientationWarning: 'ROTATE YOUR DEVICE FOR A BETTER FIGHT',
        canvasLabel: 'GLITCH DUEL combat arena',
        pauseButton: 'PAUSE',
        pauseButtonLabel: 'Pause match',
        menuKicker: 'Arcade VS AI',
        menuIntro: 'Line-art arcade fighter vs the machine: punches, kicks, and bugs.',
        start: 'START GAME',
        help: 'HELP',
        language: 'Language',
        difficulty: 'Difficulty',
        arena: 'Arena',
        fighterStyle: 'Style',
        styleBalanced: 'BALANCED',
        styleFast: 'FAST',
        styleHeavy: 'HEAVY',
        styleTechnical: 'TECHNICAL',
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
        airAttacks: 'Air attacks',
        specialShort: 'Special (full energy)',
        specialLong: 'Special: requires full bar and consumes energy',
        specialReady: 'SPECIAL READY',
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
        medalBug: 'Bug Exterminator',
        medalBugDetail: 'The machine reached its end of loop.',
        medalFirewall: 'Human Firewall',
        medalFirewallDetail: 'You blocked enough to pass an audit.',
        medalCombo: 'Combo Goblin',
        medalComboDetail: 'You chained inputs like an arcade creature.',
        medalSurvivor: '404 Survivor',
        medalSurvivorDetail: 'You survived with margin of error not found.',
        medalMachine: 'Machine Approved',
        medalMachineDetail: 'CPU certified your bug report.',
        finalScore: 'Score',
        finalDifficulty: 'Difficulty',
        finalArena: 'Arena',
        finalStreak: 'Streak',
        finalBest: 'Best',
        finalPhraseSpecial: 'Energy well spent. CPU is still rendering excuses.',
        finalPhraseFirewall: 'Firewall active: the machine bounced off your guard.',
        finalPhraseAir: 'You won from the air. Gravity opened a ticket and you closed it in style.',
        finalPhraseFast: 'Deploy-speed victory: in, out, and gone before the log flushed.',
        finalPhraseHeavy: 'Heavy mode confirmed: every hit sounded like a Friday migration.',
        finalPhraseTechnical: 'Pure optimization: less noise, more energy, zero waste.',
        finalPhraseWin: 'Bug removed before it reached production.',
        finalPhraseLoss: 'The machine won this time. It was clearly using hardcoded confidence.',
        pauseSummary: 'Round {round} | Score {score} | Time {seconds}s | Difficulty {difficulty} | Arena {arena} | Controls: A/D/W/C, S/I block, J/K, L special with full energy, P or Esc to resume',
        difficultyEasy: 'EASY',
        difficultyNormal: 'NORMAL',
        difficultyHard: 'HARD',
        arenaNotebook: 'NOTEBOOK',
        arenaCafeteria: 'CAFETERIA',
        arenaLab: 'LAB',
        arenaMeeting: 'IN-PERSON MEETING',
        arenaRemoteMeeting: 'REMOTE MEETING',
        arenaMathClass: 'MATH CLASS',
        arenaServerDown: 'SERVER DOWN',
        arenaGeekConvention: 'GEEK CONVENTION',
        arenaPreviewNotebook: 'Sketches, notes, and doodles before the first hit.',
        arenaPreviewCafeteria: 'Coffee, a long table, and steam-powered fighting.',
        arenaPreviewLab: 'Panels, formulas, and one sample labeled NaN.',
        arenaPreviewMeeting: 'Office, sticky notes, and a meeting that could be email.',
        arenaPreviewRemoteMeeting: 'Windows, mute, lag, and emotional reconnecting.',
        arenaPreviewMathClass: 'Blackboard, absurd limits, and provable bugs.',
        arenaPreviewServerDown: 'Broken rack, error 500, and panic red lights.',
        arenaPreviewGeekConvention: 'Booths, stickers, and a queue that never ends.'
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
        const saved = window.localStorage && (window.localStorage.getItem(LANGUAGE_STORAGE_KEY) || window.localStorage.getItem(LEGACY_LANGUAGE_STORAGE_KEY));
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
