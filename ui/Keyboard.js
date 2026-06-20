// Keyboard.ts - Keyboard handling
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//
import { UiUtils } from "./UiUtils";
export class Keyboard {
    constructor(options) {
        this.keyBuffer = []; // buffered pressed keys
        this.expansionTokens = []; // strings for expansion tokens 0..31 (in reality: 128..159)
        this.active = false; // flag if keyboard is active/focused, set from outside
        this.codeStringsRemoved = false;
        this.pressedKeys = {}; // currently pressed browser keys
        this.fnKeydownOrKeyupHandler = this.onKeydownOrKeyup.bind(this);
        this.options = {};
        this.setOptions(options);
        this.key2CpcKey = Keyboard.key2CpcKey;
        this.cpcKeyExpansions = {
            normal: {},
            shift: {},
            ctrl: {},
            repeat: {}
        }; // cpc keys to expansion tokens for normal, shift, ctrl; also repeat
        const view = this.options.view;
        view.addEventListenerById("keydown", this.fnKeydownOrKeyupHandler, "cpcArea" /* ViewID.cpcArea */);
        view.addEventListenerById("keyup", this.fnKeydownOrKeyupHandler, "cpcArea" /* ViewID.cpcArea */);
    }
    getOptions() {
        return this.options;
    }
    setOptions(options) {
        Object.assign(this.options, options);
    }
    /* eslint-enable array-element-newline */
    reset() {
        this.options.fnOnKeyDown = undefined;
        this.clearInput();
        this.pressedKeys = {}; // currently pressed browser keys
        this.resetExpansionTokens();
        this.resetCpcKeysExpansions();
    }
    clearInput() {
        this.keyBuffer.length = 0;
    }
    resetExpansionTokens() {
        const expansionTokens = this.expansionTokens;
        for (let i = 0; i <= 9; i += 1) {
            expansionTokens[i] = String(i);
        }
        expansionTokens[10] = ".";
        expansionTokens[11] = "\r";
        expansionTokens[12] = 'RUN"\r';
        for (let i = 13; i <= 31; i += 1) {
            expansionTokens[i] = "0";
        }
    }
    resetCpcKeysExpansions() {
        const cpcKeyExpansions = this.cpcKeyExpansions;
        cpcKeyExpansions.normal = {
            15: 0 + 128, // F0
            13: 1 + 128, // F1
            14: 2 + 128, // F2
            5: 3 + 128, // F3
            20: 4 + 128, // F4
            12: 5 + 128, // F5
            4: 6 + 128, // F6
            10: 7 + 128, // F7
            11: 8 + 128, // F8
            3: 9 + 128, // F9
            7: 10 + 128, // F.
            6: 11 + 128 // Enter
        };
        cpcKeyExpansions.shift = {};
        cpcKeyExpansions.ctrl = {
            6: 12 + 128 // ctrl+Enter
        };
        cpcKeyExpansions.repeat = {};
    }
    setActive(active) {
        this.active = active;
    }
    removeCodeStringsFromKeymap() {
        const key2CpcKey = this.key2CpcKey, newMap = {};
        if (UiUtils.debug > 1) {
            UiUtils.console.log("removeCodeStringsFromKeymap: Unfortunately not all keys can be used.");
        }
        for (const key in key2CpcKey) {
            if (key2CpcKey.hasOwnProperty(key)) {
                const keyCode = parseInt(key, 10); // get just the number
                newMap[keyCode] = key2CpcKey[key];
            }
        }
        this.key2CpcKey = newMap;
    }
    fnPressCpcKey(event, cpcKeyCode, pressedKey, key) {
        const shiftKey = event.shiftKey, ctrlKey = event.ctrlKey, pressedKeys = this.pressedKeys, cpcKeyExpansions = this.cpcKeyExpansions, specialKeys = Keyboard.specialKeys, cpcKey = String(cpcKeyCode);
        let cpcKeyEntry = pressedKeys[cpcKey];
        if (!cpcKeyEntry) {
            pressedKeys[cpcKey] = {
                keys: {},
                shift: false,
                ctrl: false
            };
            cpcKeyEntry = pressedKeys[cpcKey];
        }
        const keyAlreadyPressed = cpcKeyEntry.keys[pressedKey];
        cpcKeyEntry.keys[pressedKey] = true;
        cpcKeyEntry.shift = shiftKey;
        cpcKeyEntry.ctrl = ctrlKey;
        if (UiUtils.debug > 1) {
            UiUtils.console.log("fnPressCpcKey: pressedKey=" + pressedKey + ", key=" + key + ", affected cpc key=" + cpcKey);
        }
        const repeat = cpcKeyExpansions.repeat;
        if (keyAlreadyPressed && ((cpcKey in repeat) && !repeat[cpcKey])) {
            key = ""; // repeat off => ignore key
        }
        else {
            let expansions;
            if (ctrlKey) {
                expansions = cpcKeyExpansions.ctrl;
            }
            else if (shiftKey) {
                expansions = cpcKeyExpansions.shift;
            }
            else {
                expansions = cpcKeyExpansions.normal;
            }
            if (cpcKey in expansions) {
                const expKey = expansions[cpcKey];
                if (expKey >= 128 && expKey <= 159) {
                    key = this.expansionTokens[expKey - 128];
                    for (let i = 0; i < key.length; i += 1) {
                        this.putKeyInBuffer(key.charAt(i));
                    }
                }
                else { // ascii code
                    key = String.fromCharCode(expKey);
                    this.putKeyInBuffer(key.charAt(0));
                }
                key = ""; // already done, ignore key form keyboard
            }
        }
        const shiftCtrlKey = key + (shiftKey ? "Shift" : "") + (ctrlKey ? "Ctrl" : "");
        if (shiftCtrlKey in specialKeys) {
            key = specialKeys[shiftCtrlKey];
        }
        else if (key in specialKeys) {
            key = specialKeys[key];
        }
        else if (ctrlKey) {
            if (key >= "a" && key <= "z") { // map keys with ctrl to control codes (problem: some control codes are browser functions, e.g. w: close window)
                key = String.fromCharCode(key.charCodeAt(0) - 96); // ctrl+a => \x01
            }
        }
        if (key.length === 1) { // put normal keys in buffer, ignore special keys with more than 1 character
            this.putKeyInBuffer(key);
        }
        if (cpcKeyCode === 66 && this.options.fnOnEscapeHandler) { // or: key === "Escape" or "Esc" (on IE)
            this.options.fnOnEscapeHandler(key, pressedKey);
        }
        if (this.options.fnOnKeyDown) { // special handler?
            this.options.fnOnKeyDown();
        }
    }
    fnReleaseCpcKey(event, cpcKeyCode, pressedKey, key) {
        const shiftKey = event.shiftKey, ctrlKey = event.ctrlKey, pressedKeys = this.pressedKeys, cpcKey = pressedKeys[cpcKeyCode];
        if (UiUtils.debug > 1) {
            UiUtils.console.log("fnReleaseCpcKey: pressedKey=" + pressedKey + ", key=" + key + ", affected cpc key=" + cpcKeyCode + ", keys:", (cpcKey ? cpcKey.keys : "undef."));
        }
        if (!cpcKey) {
            UiUtils.console.warn("fnReleaseCpcKey: cpcKey was not pressed:", cpcKeyCode);
        }
        else {
            delete cpcKey.keys[pressedKey];
            if (!Object.keys(cpcKey.keys).length) {
                delete pressedKeys[cpcKeyCode];
            }
            else {
                cpcKey.shift = shiftKey;
                cpcKey.ctrl = ctrlKey;
            }
        }
    }
    static keyIdentifier2Char(event) {
        // SliTaz web browser has not key but keyIdentifier
        const identifier = event.keyIdentifier, // eslint-disable-line @typescript-eslint/no-explicit-any
        shiftKey = event.shiftKey;
        let char = "";
        if ((/^U\+/i).test(identifier || "")) { // unicode string?
            char = String.fromCharCode(parseInt(identifier.substr(2), 16));
            if (char === "\0") { // ignore
                char = "";
            }
            char = shiftKey ? char.toUpperCase() : char.toLowerCase(); // do we get keys in unicode always in uppercase?
        }
        else {
            char = identifier; // take it, could be "Enter"
        }
        return char;
    }
    fnKeyboardKeydown(event) {
        const keyCode = event.which || event.keyCode;
        let pressedKey = String(keyCode) + (event.code ? event.code : ""), // event.code available for e.g. Chrome, Firefox
        key = event.key || Keyboard.keyIdentifier2Char(event) || ""; // SliTaz web browser has not key but keyIdentifier
        if (!event.code && !this.codeStringsRemoved) { // event.code not available on e.g. IE, Edge
            this.removeCodeStringsFromKeymap(); // remove code information from the mapping. Not all keys can be detected any more
            this.codeStringsRemoved = true;
        }
        if (UiUtils.debug > 1) {
            UiUtils.console.log("fnKeyboardKeydown: keyCode=" + keyCode + " pressedKey=" + pressedKey + " key='" + key + "' " + key.charCodeAt(0) + " loc=" + event.location + " ", event);
        }
        if (pressedKey in this.key2CpcKey) {
            const numTabOffKey = this.simulatedNumLock === false ? Keyboard.numPadOffKeyMap[pressedKey] : undefined;
            if (numTabOffKey) {
                pressedKey = numTabOffKey;
            }
            let cpcKey = this.key2CpcKey[pressedKey];
            if (cpcKey === 85) { // map virtual cpc key 85 to 22 (english keyboard)
                cpcKey = 22;
            }
            // map numpad cursor to joystick
            if (cpcKey === 72) {
                key = "JoyUp";
            }
            else if (cpcKey === 73) {
                key = "JoyDown";
            }
            else if (cpcKey === 74) {
                key = "JoyLeft";
            }
            else if (cpcKey === 75) {
                key = "JoyRight";
            }
            else if (key === "Dead") { // Chrome, FF
                key += event.code + (event.shiftKey ? "Shift" : ""); // special handling => "DeadBackquote" or "DeadEqual"; and "Shift"
            }
            else if (key === "Unidentified") { // IE, Edge
                if (keyCode === 220) {
                    key = event.shiftKey ? "°" : "DeadBackquote";
                }
                else if (keyCode === 221) {
                    key = "DeadEqual" + (event.shiftKey ? "Shift" : "");
                }
                else if (keyCode === 226) { // "|"
                    key = "|";
                }
            }
            else if (key.length === 2) {
                if (key.charAt(0) === "^" || key.charAt(0) === "´" || key.charAt(0) === "`") { // IE, Edge? prefix key
                    key = key.substring(1); // remove prefix
                }
            }
            this.fnPressCpcKey(event, cpcKey, pressedKey, key);
        }
        else if (key.length === 1) { // put normal keys in buffer, ignore special keys with more than 1 character
            this.putKeyInBuffer(key);
            UiUtils.console.log("fnKeyboardKeydown: Partly unhandled key", pressedKey + ":", key);
        }
        else if (pressedKey === "12NumLock") { // key = "Clear"; MacOS
            this.simulatedNumLock = this.simulatedNumLock !== undefined ? !this.simulatedNumLock : false;
            if (UiUtils.debug > 1) {
                UiUtils.console.log("fnKeyboardKeydown: simulatedNumLock=" + this.simulatedNumLock);
            }
        }
        else {
            UiUtils.console.log("fnKeyboardKeydown: Unhandled key", pressedKey + ":", key);
        }
    }
    fnKeyboardKeyup(event) {
        const keyCode = event.which || event.keyCode, key = event.key || Keyboard.keyIdentifier2Char(event) || ""; // SliTaz web browser has not key but keyIdentifier
        let pressedKey = String(keyCode) + (event.code ? event.code : ""); // event.code available for e.g. Chrome, Firefox
        if (UiUtils.debug > 1) {
            UiUtils.console.log("fnKeyboardKeyup: keyCode=" + keyCode + " pressedKey=" + pressedKey + " key='" + key + "' " + key.charCodeAt(0) + " loc=" + event.location + " ", event);
        }
        if (pressedKey in this.key2CpcKey) {
            const numTabOffKey = this.simulatedNumLock === false ? Keyboard.numPadOffKeyMap[pressedKey] : undefined;
            if (numTabOffKey) {
                pressedKey = numTabOffKey;
            }
            let cpcKey = this.key2CpcKey[pressedKey];
            if (cpcKey === 85) { // map virtual cpc key 85 to 22 (english keyboard)
                cpcKey = 22;
            }
            this.fnReleaseCpcKey(event, cpcKey, pressedKey, key);
        }
        else if (pressedKey === "12NumLock") { // key = "Clear"; MacOS
            if (UiUtils.debug > 1) {
                UiUtils.console.log("fnKeyboardKeyup: simulatedNumLock=" + this.simulatedNumLock);
            }
        }
        else {
            UiUtils.console.log("fnKeyboardKeyup: Unhandled key", pressedKey + ":", key);
        }
    }
    getKeyFromBuffer() {
        const keyBuffer = this.keyBuffer, key = keyBuffer.length ? keyBuffer.shift() : "";
        return key;
    }
    putKeyInBuffer(key, triggerOnKeyDown) {
        this.keyBuffer.push(key);
        if (triggerOnKeyDown) {
            const keyDownHandler = this.options.fnOnKeyDown;
            if (keyDownHandler) {
                keyDownHandler();
            }
        }
    }
    putKeysInBuffer(input) {
        for (let i = 0; i < input.length; i += 1) {
            const key = input.charAt(i);
            this.keyBuffer.push(key);
        }
    }
    getKeyState(cpcKeyCode) {
        const pressedKeys = this.pressedKeys;
        let state = -1;
        if (cpcKeyCode in pressedKeys) {
            const cpcKeyEntry = pressedKeys[cpcKeyCode];
            state = 0 + (cpcKeyEntry.shift ? 32 : 0) + (cpcKeyEntry.ctrl ? 128 : 0);
        }
        return state;
    }
    getJoyState(joy) {
        const joyKeyList = Keyboard.joyKeyCodes[joy];
        let value = 0;
        /* eslint-disable no-bitwise */
        for (let i = 0; i < joyKeyList.length; i += 1) {
            if (this.getKeyState(joyKeyList[i]) !== -1) {
                value |= (1 << i);
            }
        }
        // check additional special codes for joy 0 (not available on CPC)
        if (joy === 0) {
            if (this.getKeyState(80) !== -1) { // up left
                value |= 1 + 4;
            }
            if (this.getKeyState(81) !== -1) { // up right
                value |= 1 + 8;
            }
            if (this.getKeyState(82) !== -1) { // down left
                value |= 2 + 4;
            }
            if (this.getKeyState(83) !== -1) { // down right
                value |= 2 + 8;
            }
        }
        /* eslint-enable no-bitwise */
        return value;
    }
    setExpansionToken(token, string) {
        this.expansionTokens[token] = string;
    }
    setCpcKeyExpansion(options) {
        const cpcKeyExpansions = this.cpcKeyExpansions, cpcKey = options.cpcKey;
        cpcKeyExpansions.repeat[cpcKey] = options.repeat;
        if (options.normal !== undefined) {
            cpcKeyExpansions.normal[cpcKey] = options.normal;
        }
        if (options.shift !== undefined) {
            cpcKeyExpansions.shift[cpcKey] = options.shift;
        }
        if (options.ctrl !== undefined) {
            cpcKeyExpansions.ctrl[cpcKey] = options.ctrl;
        }
    }
    onKeydownOrKeyup(event) {
        if (this.active) {
            if (event.type === "keydown") {
                this.fnKeyboardKeydown(event);
            }
            else if (event.type === "keyup") {
                this.fnKeyboardKeyup(event);
            }
            else {
                UiUtils.console.error("onKeydownOrKeyup: Unknown type:", event.type);
            }
            event.preventDefault();
            return false;
        }
        return undefined;
    }
}
// use this:
Keyboard.key2CpcKey = {
    "38ArrowUp": 0,
    "39ArrowRight": 1,
    "40ArrowDown": 2,
    "105Numpad9": 3,
    "120F9": 3,
    "102Numpad6": 4,
    "117F6": 4,
    "99Numpad3": 5,
    "114F3": 5,
    "13NumpadEnter": 6,
    "110NumpadDecimal": 7,
    "37ArrowLeft": 8,
    "18AltLeft": 9,
    "103Numpad7": 10,
    "118F7": 10,
    "104Numpad8": 11,
    "119F8": 11,
    "101Numpad5": 12,
    "116F5": 12,
    "97Numpad1": 13,
    "112F1": 13,
    "98Numpad2": 14,
    "113F2": 14,
    "96Numpad0": 15,
    "121F10": 15,
    "46Delete": 16,
    "187BracketRight": 17,
    "171BracketRight": 17,
    "221BracketRight": 17,
    "13Enter": 18,
    "191Backslash": 19,
    "163Backslash": 19,
    "220Backslash": 19,
    "100Numpad4": 20,
    "115F4": 20,
    "16ShiftLeft": 21,
    "16ShiftRight": 21,
    "220Backquote": 22,
    "160Backquote": 22,
    "192Backquote": 22,
    "17ControlLeft": 23,
    "17ControlRight": 23,
    "221Equal": 24,
    "192Equal": 24,
    "187Equal": 24,
    "219Minus": 25,
    "63Minus": 25,
    "189Minus": 25,
    "186BracketLeft": 26,
    "59BracketLeft": 26,
    "219BracketLeft": 26,
    "80KeyP": 27,
    "222Quote": 28,
    "192Quote": 28,
    "192Semicolon": 29,
    "186Semicolon": 29,
    "189Slash": 30,
    "173Slash": 30,
    "191Slash": 30,
    "190Period": 31,
    "48Digit0": 32,
    "57Digit9": 33,
    "79KeyO": 34,
    "73KeyI": 35,
    "76KeyL": 36,
    "75KeyK": 37,
    "77KeyM": 38,
    "188Comma": 39,
    "56Digit8": 40,
    "55Digit7": 41,
    "85KeyU": 42,
    "90KeyY": 43,
    "89KeyY": 43,
    "72KeyH": 44,
    "74KeyJ": 45,
    "78KeyN": 46,
    "32Space": 47,
    "54Digit6": 48,
    "53Digit5": 49,
    "82KeyR": 50,
    "84KeyT": 51,
    "71KeyG": 52,
    "70KeyF": 53,
    "66KeyB": 54,
    "86KeyV": 55,
    "52Digit4": 56,
    "51Digit3": 57,
    "69KeyE": 58,
    "87KeyW": 59,
    "83KeyS": 60,
    "68KeyD": 61,
    "67KeyC": 62,
    "88KeyX": 63,
    "49Digit1": 64,
    "50Digit2": 65,
    "27Escape": 66,
    "81KeyQ": 67,
    "9Tab": 68,
    "65KeyA": 69,
    "20CapsLock": 70,
    "89KeyZ": 71,
    "90KeyZ": 71,
    "38Numpad8": 72,
    "40Numpad2": 73,
    "37Numpad4": 74,
    "39Numpad6": 75,
    "12Numpad5": 76,
    "45Numpad0": 76,
    "46NumpadDecimal": 77,
    "8Backspace": 79,
    "36Numpad7": 80,
    "33Numpad9": 81,
    "35Numpad1": 82,
    "34Numpad3": 83,
    "226IntlBackslash": 85,
    "60IntlBackslash": 85,
    "220IntlBackslash": 85,
    "111NumpadDivide": 86,
    "106NumpadMultiply": 87,
    "109NumpadSubtract": 88,
    "107NumpadAdd": 89
};
Keyboard.specialKeys = {
    Alt: String.fromCharCode(224), // Copy
    ArrowUp: String.fromCharCode(240),
    ArrowDown: String.fromCharCode(241),
    ArrowLeft: String.fromCharCode(242),
    ArrowRight: String.fromCharCode(243),
    ArrowUpShift: String.fromCharCode(244),
    ArrowDownShift: String.fromCharCode(245),
    ArrowLeftShift: String.fromCharCode(246),
    ArrowRightShift: String.fromCharCode(247),
    ArrowUpCtrl: String.fromCharCode(248),
    ArrowDownCtrl: String.fromCharCode(249),
    ArrowLeftCtrl: String.fromCharCode(250),
    ArrowRightCtrl: String.fromCharCode(251),
    Backspace: String.fromCharCode(127),
    Delete: String.fromCharCode(16),
    Enter: "\r",
    JoyUp: String.fromCharCode(11),
    JoyDown: String.fromCharCode(10),
    JoyLeft: String.fromCharCode(8),
    JoyRight: String.fromCharCode(9),
    Clear: "X", // joy fire 2
    Spacebar: " ", // for IE
    Tab: String.fromCharCode(9),
    ä: ";",
    Ä: "+",
    ö: ":",
    Ö: "*",
    ü: "@",
    Ü: "|",
    ß: "-",
    DeadBackquote: "^",
    "°": "£",
    DeadEqual: String.fromCharCode(161), // tick
    "´": String.fromCharCode(161), // IE: tick
    DeadEqualShift: "`" // backtick
};
/* eslint-disable array-element-newline */
Keyboard.joyKeyCodes = [
    [72, 73, 74, 75, 76, 77],
    [48, 49, 50, 51, 52, 53]
];
Keyboard.numPadOffKeyMap = {
    "96Numpad0": "45Numpad0",
    "97Numpad1": "35Numpad1",
    "98Numpad2": "40Numpad2",
    "99Numpad3": "34Numpad3",
    "100Numpad4": "37Numpad4",
    "101Numpad5": "12Numpad5",
    "102Numpad6": "39Numpad6",
    "103Numpad7": "36Numpad7",
    "104Numpad8": "38Numpad8",
    "105Numpad9": "33Numpad9",
    "110NumpadDecimal": "46NumpadDecimal"
};
//# sourceMappingURL=Keyboard.js.map