const INPUT_BINDINGS_STORAGE_KEY = 'glitchDuelKeyboardBindings';
const INPUT_BINDINGS_VERSION = 1;
const INPUT_ACTIONS = ['left', 'right', 'jump', 'crouch', 'block', 'punch', 'kick', 'special', 'pause'];
const INPUT_REMAPPABLE_ACTIONS = [...INPUT_ACTIONS];
const INPUT_MAX_BINDINGS_PER_ACTION = 2;
const INPUT_AXIS_PRESS_THRESHOLD = 0.55;
const INPUT_AXIS_RELEASE_THRESHOLD = 0.35;
const INPUT_DEFAULT_BINDINGS = {
    left: ['KeyA', 'ArrowLeft'],
    right: ['KeyD', 'ArrowRight'],
    jump: ['KeyW', 'ArrowUp'],
    crouch: ['KeyC', 'ArrowDown'],
    block: ['KeyS', 'KeyI'],
    punch: ['KeyJ'],
    kick: ['KeyK'],
    special: ['KeyL'],
    pause: ['KeyP']
};
const INPUT_RESERVED_CODES = new Set([
    'Escape', 'Tab', 'Backquote', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12',
    'BrowserBack', 'BrowserForward', 'BrowserRefresh', 'BrowserHome', 'AudioVolumeMute', 'AudioVolumeDown', 'AudioVolumeUp',
    'ShiftLeft', 'ShiftRight', 'ControlLeft', 'ControlRight', 'AltLeft', 'AltRight', 'MetaLeft', 'MetaRight'
]);

const inputActionSources = new Map(INPUT_ACTIONS.map((action) => [action, new Set()]));
const inputSourceActions = new Map();
const inputKeyboardBindings = loadInputBindings();
const inputPreviousGamepads = new Map();
let inputGamepadNeutralRequired = false;
let inputBindingCapture = null;

function cloneInputBindings(bindings) {
    return Object.fromEntries(INPUT_ACTIONS.map((action) => [action, [...(bindings[action] || [])]]));
}

function isInputCode(value) {
    return typeof value === 'string' && value.length > 0 && value.length <= 32;
}

function isInputReservedCode(code) {
    return INPUT_RESERVED_CODES.has(code);
}

function validateInputBindings(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value) || value.version !== INPUT_BINDINGS_VERSION) return null;

    const result = {};
    const usedCodes = new Set();
    for (const action of INPUT_ACTIONS) {
        const values = Array.isArray(value.bindings && value.bindings[action]) ? value.bindings[action] : [];
        const codes = [];
        for (const code of values.slice(0, INPUT_MAX_BINDINGS_PER_ACTION)) {
            if (!isInputCode(code) || isInputReservedCode(code) || usedCodes.has(code)) continue;
            codes.push(code);
            usedCodes.add(code);
        }
        if (!codes.length) return null;
        result[action] = codes;
    }
    return result;
}

function loadInputBindings() {
    try {
        const saved = window.localStorage && window.localStorage.getItem(INPUT_BINDINGS_STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            const validated = validateInputBindings(parsed);
            if (validated) return validated;
        }
    } catch (_) {
        // localStorage or JSON can be unavailable/corrupt; defaults are safe.
    }
    return cloneInputBindings(INPUT_DEFAULT_BINDINGS);
}

function saveInputBindings() {
    try {
        if (window.localStorage) {
            window.localStorage.setItem(INPUT_BINDINGS_STORAGE_KEY, JSON.stringify({
                version: INPUT_BINDINGS_VERSION,
                bindings: inputKeyboardBindings
            }));
        }
    } catch (_) {
        // localStorage can be unavailable in private browsing or tests.
    }
}

function getInputBindings() {
    return cloneInputBindings(inputKeyboardBindings);
}

function resetInputBindings() {
    const defaults = cloneInputBindings(INPUT_DEFAULT_BINDINGS);
    INPUT_ACTIONS.forEach((action) => {
        inputKeyboardBindings[action] = defaults[action];
    });
    saveInputBindings();
    return getInputBindings();
}

function setInputBinding(action, slot, code) {
    if (!INPUT_REMAPPABLE_ACTIONS.includes(action) || !Number.isInteger(slot) || slot < 0 || slot >= INPUT_MAX_BINDINGS_PER_ACTION) {
        return { ok: false, reason: 'invalid' };
    }
    if (!isInputCode(code)) return { ok: false, reason: 'invalid' };
    if (isInputReservedCode(code)) return { ok: false, reason: 'reserved' };

    const conflict = INPUT_ACTIONS.find((candidate) => candidate !== action && inputKeyboardBindings[candidate].includes(code));
    if (conflict) return { ok: false, reason: 'conflict', conflict };

    const bindings = inputKeyboardBindings[action].filter((value, index) => value !== code && index !== slot);
    bindings.splice(Math.min(slot, bindings.length), 0, code);
    inputKeyboardBindings[action] = bindings.slice(0, INPUT_MAX_BINDINGS_PER_ACTION);
    saveInputBindings();
    return { ok: true, bindings: getInputBindings() };
}

function getInputKeyboardCode(event) {
    if (event && isInputCode(event.code)) return event.code;

    const key = String(event && event.key || '');
    const aliases = {
        ' ': 'Space',
        Spacebar: 'Space',
        Esc: 'Escape',
        Left: 'ArrowLeft',
        Right: 'ArrowRight',
        Up: 'ArrowUp',
        Down: 'ArrowDown',
        '`': 'Backquote'
    };
    if (aliases[key]) return aliases[key];
    if (key.length === 1 && /[a-z]/i.test(key)) return `Key${key.toUpperCase()}`;
    if (key.length === 1 && /[0-9]/.test(key)) return `Digit${key}`;
    return key;
}

function getInputActionForCode(code) {
    return INPUT_ACTIONS.find((action) => inputKeyboardBindings[action].includes(code)) || null;
}

function setInputSource(sourceId, action, active) {
    if (!sourceId) return;
    const currentAction = inputSourceActions.get(sourceId);
    if (active) {
        if (!INPUT_ACTIONS.includes(action)) return;
        if (currentAction && currentAction !== action) {
            inputActionSources.get(currentAction).delete(sourceId);
        }
        inputSourceActions.set(sourceId, action);
        inputActionSources.get(action).add(sourceId);
        return;
    }

    if (!currentAction) return;
    inputActionSources.get(currentAction).delete(sourceId);
    inputSourceActions.delete(sourceId);
}

function clearInputSource(sourceId) {
    setInputSource(sourceId, null, false);
}

function clearInputSources(prefix = null) {
    [...inputSourceActions.keys()].forEach((sourceId) => {
        if (prefix === null || sourceId.startsWith(prefix)) clearInputSource(sourceId);
    });
}

function clearAllInputSources() {
    clearInputSources();
    inputGamepadNeutralRequired = true;
}

function getInputSnapshot() {
    return Object.fromEntries(INPUT_ACTIONS.map((action) => [action, inputActionSources.get(action).size > 0]));
}

function getInputActionHeld(action) {
    return !!(inputActionSources.get(action) && inputActionSources.get(action).size);
}

function beginInputBindingCapture(action, slot) {
    if (!INPUT_REMAPPABLE_ACTIONS.includes(action)) return false;
    inputBindingCapture = { action, slot };
    return true;
}

function getInputBindingCapture() {
    return inputBindingCapture ? { ...inputBindingCapture } : null;
}

function cancelInputBindingCapture() {
    inputBindingCapture = null;
}

function captureInputBinding(event) {
    if (!inputBindingCapture) return null;
    const capture = inputBindingCapture;
    const code = getInputKeyboardCode(event);
    if (event && (event.ctrlKey || event.altKey || event.metaKey)) return { ok: false, reason: 'reserved' };
    if (event && event.shiftKey && code !== 'Tab') return { ok: false, reason: 'reserved' };
    if (code === 'Escape') {
        inputBindingCapture = null;
        return { cancelled: true };
    }
    if (code === 'Tab' && !(event && (event.ctrlKey || event.altKey || event.metaKey))) {
        inputBindingCapture = null;
        return {
            cancelled: true,
            navigation: event && event.shiftKey ? 'previous' : 'next',
            action: capture.action,
            slot: capture.slot
        };
    }
    if (event && event.shiftKey) return { ok: false, reason: 'reserved' };

    const result = setInputBinding(capture.action, capture.slot, code);
    if (result.ok) inputBindingCapture = null;
    return result;
}

function inputBindingLabel(code) {
    const labels = {
        ArrowLeft: 'LEFT',
        ArrowRight: 'RIGHT',
        ArrowUp: 'UP',
        ArrowDown: 'DOWN',
        Space: 'SPACE',
        Enter: 'ENTER',
        ShiftLeft: 'SHIFT',
        ShiftRight: 'SHIFT',
        ControlLeft: 'CTRL',
        ControlRight: 'CTRL',
        AltLeft: 'ALT',
        AltRight: 'ALT'
    };
    if (labels[code]) return labels[code];
    if (code.startsWith('Key')) return code.slice(3).toUpperCase();
    if (code.startsWith('Digit')) return code.slice(5);
    return code.toUpperCase();
}

function inputBindingAccessibleLabel(code) {
    const keys = {
        ArrowLeft: 'inputKeyArrowLeft',
        ArrowRight: 'inputKeyArrowRight',
        ArrowUp: 'inputKeyArrowUp',
        ArrowDown: 'inputKeyArrowDown',
        Space: 'inputKeySpace',
        Enter: 'inputKeyEnter',
        ShiftLeft: 'inputKeyShift',
        ShiftRight: 'inputKeyShift',
        ControlLeft: 'inputKeyControl',
        ControlRight: 'inputKeyControl',
        AltLeft: 'inputKeyAlt',
        AltRight: 'inputKeyAlt',
        MetaLeft: 'inputKeyMeta',
        MetaRight: 'inputKeyMeta'
    };
    return keys[code] ? t(keys[code]) : inputBindingLabel(code);
}

function getInputBindingLabels(action) {
    return (inputKeyboardBindings[action] || []).map(inputBindingLabel);
}

function getInputGamepadSnapshot() {
    return [...inputPreviousGamepads.keys()];
}

function inputButtonPressed(buttons, index) {
    return !!(buttons[index] && (buttons[index].pressed || buttons[index].value >= 0.5));
}

function inputAxisDirection(value, previous, negativeName, positiveName) {
    if (value <= -INPUT_AXIS_PRESS_THRESHOLD || (previous === negativeName && value <= -INPUT_AXIS_RELEASE_THRESHOLD)) return negativeName;
    if (value >= INPUT_AXIS_PRESS_THRESHOLD || (previous === positiveName && value >= INPUT_AXIS_RELEASE_THRESHOLD)) return positiveName;
    return null;
}

function pollInputGamepads() {
    const events = { confirm: false, cancel: false, start: false, up: false, down: false, left: false, right: false };
    if (!navigator.getGamepads) return events;

    const pads = navigator.getGamepads() || [];
    const seen = new Set();
    const suppressSources = inputGamepadNeutralRequired;
    pads.forEach((pad, index) => {
        if (!pad || (pad.mapping && pad.mapping !== 'standard')) return;
        seen.add(index);
        const previous = inputPreviousGamepads.get(index) || { buttons: new Map(), axis: null };
        const pressedButtons = new Map();
        for (let buttonIndex = 0; buttonIndex < (pad.buttons || []).length; buttonIndex++) {
            const pressed = inputButtonPressed(pad.buttons, buttonIndex);
            pressedButtons.set(buttonIndex, pressed);
            const sourceId = `gamepad:${index}:button:${buttonIndex}`;
            const action = { 0: 'jump', 1: 'kick', 2: 'punch', 3: 'special', 4: 'block', 5: 'block', 12: 'jump', 13: 'crouch', 14: 'left', 15: 'right' }[buttonIndex];
            if (action && !suppressSources) setInputSource(sourceId, action, pressed);
            if (pressed && !previous.buttons.get(buttonIndex)) {
                if (buttonIndex === 0) events.confirm = true;
                if (buttonIndex === 1) events.cancel = true;
                if (buttonIndex === 9) events.start = true;
                if (buttonIndex === 12) events.up = true;
                if (buttonIndex === 13) events.down = true;
                if (buttonIndex === 14) events.left = true;
                if (buttonIndex === 15) events.right = true;
            }
        }

        const axisValue = Number(pad.axes && pad.axes[0] || 0);
        const axisDirection = inputAxisDirection(axisValue, previous.axis, 'left', 'right');
        if (!suppressSources) {
            setInputSource(`gamepad:${index}:axis:left`, 'left', axisDirection === 'left');
            setInputSource(`gamepad:${index}:axis:right`, 'right', axisDirection === 'right');
        }
        if (axisDirection && axisDirection !== previous.axis) events[axisDirection] = true;

        const verticalValue = Number(pad.axes && pad.axes[1] || 0);
        const verticalDirection = inputAxisDirection(verticalValue, previous.vertical, 'up', 'down');
        if (verticalDirection && verticalDirection !== previous.vertical) events[verticalDirection] = true;
        if (!suppressSources) {
            setInputSource(`gamepad:${index}:axis:up`, 'jump', verticalDirection === 'up');
            setInputSource(`gamepad:${index}:axis:down`, 'crouch', verticalDirection === 'down');
        }

        inputPreviousGamepads.set(index, { buttons: pressedButtons, axis: axisDirection, vertical: verticalDirection });
    });

    [...inputPreviousGamepads.keys()].forEach((index) => {
        if (seen.has(index)) return;
        clearInputSources(`gamepad:${index}:`);
        inputPreviousGamepads.delete(index);
    });

    if (inputGamepadNeutralRequired) {
        const active = [...inputPreviousGamepads.values()].some((state) => state.axis || state.vertical || [...state.buttons.values()].some(Boolean));
        if (!active) inputGamepadNeutralRequired = false;
        return { confirm: false, cancel: false, start: false, up: false, down: false, left: false, right: false };
    }
    return events;
}
