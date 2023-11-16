// Keyboard.ts - Keyboard handling
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//
define(["require", "exports", "./Utils"], function (require, exports, Utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Keyboard = void 0;
    var Keyboard = /** @class */ (function () {
        function Keyboard(options) {
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
        }
        Keyboard.prototype.getOptions = function () {
            return this.options;
        };
        Keyboard.prototype.setOptions = function (options) {
            Object.assign(this.options, options);
        };
        Keyboard.prototype.getKeydownOrKeyupHandler = function () {
            return this.fnKeydownOrKeyupHandler;
        };
        /* eslint-enable array-element-newline */
        Keyboard.prototype.reset = function () {
            this.options.fnOnKeyDown = undefined;
            this.clearInput();
            this.pressedKeys = {}; // currently pressed browser keys
            this.resetExpansionTokens();
            this.resetCpcKeysExpansions();
        };
        Keyboard.prototype.clearInput = function () {
            this.keyBuffer.length = 0;
        };
        Keyboard.prototype.resetExpansionTokens = function () {
            var expansionTokens = this.expansionTokens;
            for (var i = 0; i <= 9; i += 1) {
                expansionTokens[i] = String(i);
            }
            expansionTokens[10] = ".";
            expansionTokens[11] = "\r";
            expansionTokens[12] = 'RUN"\r';
            for (var i = 13; i <= 31; i += 1) {
                expansionTokens[i] = "0";
            }
        };
        Keyboard.prototype.resetCpcKeysExpansions = function () {
            var cpcKeyExpansions = this.cpcKeyExpansions;
            cpcKeyExpansions.normal = {
                15: 0 + 128,
                13: 1 + 128,
                14: 2 + 128,
                5: 3 + 128,
                20: 4 + 128,
                12: 5 + 128,
                4: 6 + 128,
                10: 7 + 128,
                11: 8 + 128,
                3: 9 + 128,
                7: 10 + 128,
                6: 11 + 128 // Enter
            };
            cpcKeyExpansions.shift = {};
            cpcKeyExpansions.ctrl = {
                6: 12 + 128 // ctrl+Enter
            };
            cpcKeyExpansions.repeat = {};
        };
        Keyboard.prototype.setActive = function (active) {
            this.active = active;
        };
        Keyboard.prototype.removeCodeStringsFromKeymap = function () {
            var key2CpcKey = this.key2CpcKey, newMap = {};
            if (Utils_1.Utils.debug > 1) {
                Utils_1.Utils.console.log("removeCodeStringsFromKeymap: Unfortunately not all keys can be used.");
            }
            for (var key in key2CpcKey) {
                if (key2CpcKey.hasOwnProperty(key)) {
                    var keyCode = parseInt(key, 10); // get just the number
                    newMap[keyCode] = key2CpcKey[key];
                }
            }
            this.key2CpcKey = newMap;
        };
        Keyboard.prototype.fnPressCpcKey = function (event, cpcKeyCode, pressedKey, key) {
            var shiftKey = event.shiftKey, ctrlKey = event.ctrlKey, pressedKeys = this.pressedKeys, cpcKeyExpansions = this.cpcKeyExpansions, specialKeys = Keyboard.specialKeys, cpcKey = String(cpcKeyCode);
            var cpcKeyEntry = pressedKeys[cpcKey];
            if (!cpcKeyEntry) {
                pressedKeys[cpcKey] = {
                    keys: {},
                    shift: false,
                    ctrl: false
                };
                cpcKeyEntry = pressedKeys[cpcKey];
            }
            var keyAlreadyPressed = cpcKeyEntry.keys[pressedKey];
            cpcKeyEntry.keys[pressedKey] = true;
            cpcKeyEntry.shift = shiftKey;
            cpcKeyEntry.ctrl = ctrlKey;
            if (Utils_1.Utils.debug > 1) {
                Utils_1.Utils.console.log("fnPressCpcKey: pressedKey=" + pressedKey + ", key=" + key + ", affected cpc key=" + cpcKey);
            }
            var repeat = cpcKeyExpansions.repeat;
            if (keyAlreadyPressed && ((cpcKey in repeat) && !repeat[cpcKey])) {
                key = ""; // repeat off => ignore key
            }
            else {
                var expansions = void 0;
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
                    var expKey = expansions[cpcKey];
                    if (expKey >= 128 && expKey <= 159) {
                        key = this.expansionTokens[expKey - 128];
                        for (var i = 0; i < key.length; i += 1) {
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
            var shiftCtrlKey = key + (shiftKey ? "Shift" : "") + (ctrlKey ? "Ctrl" : "");
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
        };
        Keyboard.prototype.fnReleaseCpcKey = function (event, cpcKeyCode, pressedKey, key) {
            var shiftKey = event.shiftKey, ctrlKey = event.ctrlKey, pressedKeys = this.pressedKeys, cpcKey = pressedKeys[cpcKeyCode];
            if (Utils_1.Utils.debug > 1) {
                Utils_1.Utils.console.log("fnReleaseCpcKey: pressedKey=" + pressedKey + ", key=" + key + ", affected cpc key=" + cpcKeyCode + ", keys:", (cpcKey ? cpcKey.keys : "undef."));
            }
            if (!cpcKey) {
                Utils_1.Utils.console.warn("fnReleaseCpcKey: cpcKey was not pressed:", cpcKeyCode);
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
        };
        Keyboard.keyIdentifier2Char = function (event) {
            // SliTaz web browser has not key but keyIdentifier
            var identifier = event.keyIdentifier, // eslint-disable-line @typescript-eslint/no-explicit-any
            shiftKey = event.shiftKey;
            var char = "";
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
        };
        Keyboard.prototype.fnKeyboardKeydown = function (event) {
            var keyCode = event.which || event.keyCode, pressedKey = String(keyCode) + (event.code ? event.code : ""); // event.code available for e.g. Chrome, Firefox
            var key = event.key || Keyboard.keyIdentifier2Char(event) || ""; // SliTaz web browser has not key but keyIdentifier
            if (!event.code && !this.codeStringsRemoved) { // event.code not available on e.g. IE, Edge
                this.removeCodeStringsFromKeymap(); // remove code information from the mapping. Not all keys can be detected any more
                this.codeStringsRemoved = true;
            }
            if (Utils_1.Utils.debug > 1) {
                Utils_1.Utils.console.log("fnKeyboardKeydown: keyCode=" + keyCode + " pressedKey=" + pressedKey + " key='" + key + "' " + key.charCodeAt(0) + " loc=" + event.location + " ", event);
            }
            if (pressedKey in this.key2CpcKey) {
                var cpcKey = this.key2CpcKey[pressedKey];
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
                Utils_1.Utils.console.log("fnKeyboardKeydown: Partly unhandled key", pressedKey + ":", key);
            }
            else {
                Utils_1.Utils.console.log("fnKeyboardKeydown: Unhandled key", pressedKey + ":", key);
            }
        };
        Keyboard.prototype.fnKeyboardKeyup = function (event) {
            var keyCode = event.which || event.keyCode, pressedKey = String(keyCode) + (event.code ? event.code : ""), // event.code available for e.g. Chrome, Firefox
            key = event.key || Keyboard.keyIdentifier2Char(event) || ""; // SliTaz web browser has not key but keyIdentifier
            if (Utils_1.Utils.debug > 1) {
                Utils_1.Utils.console.log("fnKeyboardKeyup: keyCode=" + keyCode + " pressedKey=" + pressedKey + " key='" + key + "' " + key.charCodeAt(0) + " loc=" + event.location + " ", event);
            }
            if (pressedKey in this.key2CpcKey) {
                var cpcKey = this.key2CpcKey[pressedKey];
                if (cpcKey === 85) { // map virtual cpc key 85 to 22 (english keyboard)
                    cpcKey = 22;
                }
                this.fnReleaseCpcKey(event, cpcKey, pressedKey, key);
            }
            else {
                Utils_1.Utils.console.log("fnKeyboardKeyup: Unhandled key", pressedKey + ":", key);
            }
        };
        Keyboard.prototype.getKeyFromBuffer = function () {
            var keyBuffer = this.keyBuffer, key = keyBuffer.length ? keyBuffer.shift() : "";
            return key;
        };
        Keyboard.prototype.putKeyInBuffer = function (key, triggerOnkeydown) {
            this.keyBuffer.push(key);
            if (triggerOnkeydown) {
                var keyDownHandler = this.options.fnOnKeyDown;
                if (keyDownHandler) {
                    keyDownHandler();
                }
            }
        };
        Keyboard.prototype.putKeysInBuffer = function (input) {
            for (var i = 0; i < input.length; i += 1) {
                var key = input.charAt(i);
                this.keyBuffer.push(key);
            }
        };
        Keyboard.prototype.getKeyState = function (cpcKeyCode) {
            var pressedKeys = this.pressedKeys;
            var state = -1;
            if (cpcKeyCode in pressedKeys) {
                var cpcKeyEntry = pressedKeys[cpcKeyCode];
                state = 0 + (cpcKeyEntry.shift ? 32 : 0) + (cpcKeyEntry.ctrl ? 128 : 0);
            }
            return state;
        };
        Keyboard.prototype.getJoyState = function (joy) {
            var joyKeyList = Keyboard.joyKeyCodes[joy];
            var value = 0;
            /* eslint-disable no-bitwise */
            for (var i = 0; i < joyKeyList.length; i += 1) {
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
        };
        Keyboard.prototype.setExpansionToken = function (token, string) {
            this.expansionTokens[token] = string;
        };
        Keyboard.prototype.setCpcKeyExpansion = function (options) {
            var cpcKeyExpansions = this.cpcKeyExpansions, cpcKey = options.cpcKey;
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
        };
        Keyboard.prototype.onKeydownOrKeyup = function (event) {
            if (this.active) {
                if (event.type === "keydown") {
                    this.fnKeyboardKeydown(event);
                }
                else if (event.type === "keyup") {
                    this.fnKeyboardKeyup(event);
                }
                else {
                    Utils_1.Utils.console.error("onKeydownOrKeyup: Unknown type:", event.type);
                }
                event.preventDefault();
                return false;
            }
            return undefined;
        };
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
            Alt: String.fromCharCode(224),
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
            Clear: "X",
            Spacebar: " ",
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
            DeadEqual: String.fromCharCode(161),
            "´": String.fromCharCode(161),
            DeadEqualShift: "`" // backtick
        };
        /* eslint-disable array-element-newline */
        Keyboard.joyKeyCodes = [
            [72, 73, 74, 75, 76, 77],
            [48, 49, 50, 51, 52, 53]
        ];
        return Keyboard;
    }());
    exports.Keyboard = Keyboard;
});
//# sourceMappingURL=Keyboard.js.map