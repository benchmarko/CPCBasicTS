// Keyboard.ts - Keyboard handling
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//
define(["require", "exports", "./Utils", "./View"], function (require, exports, Utils_1, View_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Keyboard = void 0;
    var Keyboard = /** @class */ (function () {
        function Keyboard(options) {
            this.aKeyBuffer = []; // buffered pressed keys
            this.aExpansionTokens = []; // strings for expansion tokens 0..31 (in reality: 128..159)
            this.bActive = false; // flag if keyboard is active/focused, set from outside
            this.bCodeStringsRemoved = false;
            this.oPressedKeys = {}; // currently pressed browser keys
            this.options = Object.assign({}, options);
            this.fnOnKeyDown = this.options.fnOnKeyDown;
            this.oKey2CpcKey = Keyboard.mKey2CpcKey;
            this.oCpcKeyExpansions = {
                normal: {},
                shift: {},
                ctrl: {},
                repeat: {}
            }; // cpc keys to expansion tokens for normal, shift, ctrl; also repeat
            var cpcArea = View_1.View.getElementById1("cpcArea");
            cpcArea.addEventListener("keydown", this.onCpcAreaKeydown.bind(this), false);
            cpcArea.addEventListener("keyup", this.oncpcAreaKeyup.bind(this), false);
        }
        /* eslint-enable array-element-newline */
        Keyboard.prototype.reset = function () {
            this.fnOnKeyDown = undefined;
            this.clearInput();
            this.oPressedKeys = {}; // currently pressed browser keys
            this.resetExpansionTokens();
            this.resetCpcKeysExpansions();
        };
        Keyboard.prototype.clearInput = function () {
            this.aKeyBuffer.length = 0;
        };
        Keyboard.prototype.resetExpansionTokens = function () {
            var aExpansionTokens = this.aExpansionTokens;
            for (var i = 0; i <= 9; i += 1) {
                aExpansionTokens[i] = String(i);
            }
            aExpansionTokens[10] = ".";
            aExpansionTokens[11] = "\r";
            aExpansionTokens[12] = 'RUN"\r';
            for (var i = 13; i <= 31; i += 1) {
                aExpansionTokens[i] = "0";
            }
        };
        Keyboard.prototype.resetCpcKeysExpansions = function () {
            var oCpcKeyExpansions = this.oCpcKeyExpansions;
            oCpcKeyExpansions.normal = {
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
            oCpcKeyExpansions.shift = {};
            oCpcKeyExpansions.ctrl = {
                6: 12 + 128 // ctrl+Enter
            };
            oCpcKeyExpansions.repeat = {};
        };
        Keyboard.prototype.getKeyDownHandler = function () {
            return this.fnOnKeyDown;
        };
        Keyboard.prototype.setKeyDownHandler = function (fnOnKeyDown) {
            this.fnOnKeyDown = fnOnKeyDown;
        };
        Keyboard.prototype.setActive = function (bActive) {
            this.bActive = bActive;
        };
        Keyboard.prototype.removeCodeStringsFromKeymap = function () {
            var oKey2CpcKey = this.oKey2CpcKey, oNewMap = {};
            if (Utils_1.Utils.debug > 1) {
                Utils_1.Utils.console.log("removeCodeStringsFromKeymap: Unfortunately not all keys can be used.");
            }
            for (var sKey in oKey2CpcKey) {
                if (oKey2CpcKey.hasOwnProperty(sKey)) {
                    var iKey = parseInt(sKey, 10); // get just the number
                    oNewMap[iKey] = oKey2CpcKey[sKey];
                }
            }
            this.oKey2CpcKey = oNewMap;
        };
        Keyboard.prototype.fnPressCpcKey = function (iCpcKey, sPressedKey, sKey, bShiftKey, bCtrlKey) {
            var oPressedKeys = this.oPressedKeys, oCpcKeyExpansions = this.oCpcKeyExpansions, mSpecialKeys = Keyboard.mSpecialKeys, sCpcKey = String(iCpcKey);
            var oCpcKey = oPressedKeys[sCpcKey];
            if (!oCpcKey) {
                oPressedKeys[sCpcKey] = {
                    oKeys: {},
                    shift: false,
                    ctrl: false
                };
                oCpcKey = oPressedKeys[sCpcKey];
            }
            var bKeyAlreadyPressed = oCpcKey.oKeys[sPressedKey];
            oCpcKey.oKeys[sPressedKey] = true;
            oCpcKey.shift = bShiftKey;
            oCpcKey.ctrl = bCtrlKey;
            if (Utils_1.Utils.debug > 1) {
                Utils_1.Utils.console.log("fnPressCpcKey: sPressedKey=" + sPressedKey + ", sKey=" + sKey + ", affected cpc key=" + sCpcKey);
            }
            var oRepeat = oCpcKeyExpansions.repeat;
            if (bKeyAlreadyPressed && ((sCpcKey in oRepeat) && !oRepeat[sCpcKey])) {
                sKey = ""; // repeat off => ignore key
            }
            else {
                var oExpansions = void 0;
                if (bCtrlKey) {
                    oExpansions = oCpcKeyExpansions.ctrl;
                }
                else if (bShiftKey) {
                    oExpansions = oCpcKeyExpansions.shift;
                }
                else {
                    oExpansions = oCpcKeyExpansions.normal;
                }
                if (sCpcKey in oExpansions) {
                    var iExpKey = oExpansions[sCpcKey];
                    if (iExpKey >= 128 && iExpKey <= 159) {
                        sKey = this.aExpansionTokens[iExpKey - 128];
                        for (var i = 0; i < sKey.length; i += 1) {
                            this.putKeyInBuffer(sKey.charAt(i));
                        }
                    }
                    else { // ascii code
                        sKey = String.fromCharCode(iExpKey);
                        this.putKeyInBuffer(sKey.charAt(0));
                    }
                    sKey = ""; // already done, ignore sKey form keyboard
                }
            }
            var sShiftCtrlKey = sKey + (bShiftKey ? "Shift" : "") + (bCtrlKey ? "Ctrl" : "");
            if (sShiftCtrlKey in mSpecialKeys) {
                sKey = mSpecialKeys[sShiftCtrlKey];
            }
            else if (sKey in mSpecialKeys) {
                sKey = mSpecialKeys[sKey];
            }
            else if (bCtrlKey) {
                if (sKey >= "a" && sKey <= "z") { // map keys with ctrl to control codes (problem: some control codes are browser functions, e.g. w: close window)
                    sKey = String.fromCharCode(sKey.charCodeAt(0) - 96); // ctrl+a => \x01
                }
            }
            if (sKey.length === 1) { // put normal keys in buffer, ignore special keys with more than 1 character
                this.putKeyInBuffer(sKey);
            }
            if (iCpcKey === 66 && this.options.fnOnEscapeHandler) { // or: sKey === "Escape" or "Esc" (on IE)
                this.options.fnOnEscapeHandler(sKey, sPressedKey);
            }
            if (this.fnOnKeyDown) { // special handler?
                this.fnOnKeyDown();
            }
        };
        Keyboard.prototype.fnReleaseCpcKey = function (iCpcKey, sPressedKey, sKey, bShiftKey, bCtrlKey) {
            var oPressedKeys = this.oPressedKeys, oCpcKey = oPressedKeys[iCpcKey];
            if (Utils_1.Utils.debug > 1) {
                Utils_1.Utils.console.log("fnReleaseCpcKey: sPressedKey=" + sPressedKey + ", sKey=" + sKey + ", affected cpc key=" + iCpcKey + ", oKeys:", (oCpcKey ? oCpcKey.oKeys : "undef."));
            }
            if (!oCpcKey) {
                Utils_1.Utils.console.warn("fnReleaseCpcKey: cpcKey was not pressed:", iCpcKey);
            }
            else {
                delete oCpcKey.oKeys[sPressedKey];
                if (!Object.keys(oCpcKey.oKeys).length) {
                    delete oPressedKeys[iCpcKey];
                }
                else {
                    oCpcKey.shift = bShiftKey;
                    oCpcKey.ctrl = bCtrlKey;
                }
            }
        };
        Keyboard.keyIdentifier2Char = function (event) {
            // SliTaz web browser has not key but keyIdentifier
            var sIdentifier = event.keyIdentifier, bShiftKey = event.shiftKey;
            var sChar = "";
            if ((/^U\+/i).test(sIdentifier || "")) { // unicode string?
                sChar = String.fromCharCode(parseInt(sIdentifier.substr(2), 16));
                if (sChar === "\0") { // ignore
                    sChar = "";
                }
                sChar = bShiftKey ? sChar.toUpperCase() : sChar.toLowerCase(); // do we get keys in sUnicode always in uppercase?
            }
            else {
                sChar = sIdentifier; // take it, could be "Enter"
            }
            return sChar;
        };
        Keyboard.prototype.fnKeyboardKeydown = function (event) {
            var iKeyCode = event.which || event.keyCode, sPressedKey = String(iKeyCode) + (event.code ? event.code : ""); // event.code available for e.g. Chrome, Firefox
            var sKey = event.key || Keyboard.keyIdentifier2Char(event) || ""; // SliTaz web browser has not key but keyIdentifier
            if (!event.code && !this.bCodeStringsRemoved) { // event.code not available on e.g. IE, Edge
                this.removeCodeStringsFromKeymap(); // remove code information from the mapping. Not all keys can be detected any more
                this.bCodeStringsRemoved = true;
            }
            if (Utils_1.Utils.debug > 1) {
                Utils_1.Utils.console.log("fnKeyboardKeydown: keyCode=" + iKeyCode + " pressedKey=" + sPressedKey + " key='" + sKey + "' " + sKey.charCodeAt(0) + " loc=" + event.location + " ", event);
            }
            if (sPressedKey in this.oKey2CpcKey) {
                var iCpcKey = this.oKey2CpcKey[sPressedKey];
                if (iCpcKey === 85) { // map virtual cpc key 85 to 22 (english keyboard)
                    iCpcKey = 22;
                }
                // map numpad cursor to joystick
                if (iCpcKey === 72) {
                    sKey = "JoyUp";
                }
                else if (iCpcKey === 73) {
                    sKey = "JoyDown";
                }
                else if (iCpcKey === 74) {
                    sKey = "JoyLeft";
                }
                else if (iCpcKey === 75) {
                    sKey = "JoyRight";
                }
                else if (sKey === "Dead") { // Chrome, FF
                    sKey += event.code + (event.shiftKey ? "Shift" : ""); // special handling => "DeadBackquote" or "DeadEqual"; and "Shift"
                }
                else if (sKey === "Unidentified") { // IE, Edge
                    if (iKeyCode === 220) {
                        sKey = event.shiftKey ? "°" : "DeadBackquote";
                    }
                    else if (iKeyCode === 221) {
                        sKey = "DeadEqual" + (event.shiftKey ? "Shift" : "");
                    }
                    else if (iKeyCode === 226) { // "|"
                        sKey = "|";
                    }
                }
                else if (sKey.length === 2) {
                    if (sKey.charAt(0) === "^" || sKey.charAt(0) === "´" || sKey.charAt(0) === "`") { // IE, Edge? prefix key
                        sKey = sKey.substr(1); // remove prefix
                    }
                }
                this.fnPressCpcKey(iCpcKey, sPressedKey, sKey, event.shiftKey, event.ctrlKey);
            }
            else if (sKey.length === 1) { // put normal keys in buffer, ignore special keys with more than 1 character
                this.putKeyInBuffer(sKey);
                Utils_1.Utils.console.log("fnKeyboardKeydown: Partly unhandled key", sPressedKey + ":", sKey);
            }
            else {
                Utils_1.Utils.console.log("fnKeyboardKeydown: Unhandled key", sPressedKey + ":", sKey);
            }
        };
        Keyboard.prototype.fnKeyboardKeyup = function (event) {
            var iKeyCode = event.which || event.keyCode, sPressedKey = String(iKeyCode) + (event.code ? event.code : ""), // event.code available for e.g. Chrome, Firefox
            sKey = event.key || Keyboard.keyIdentifier2Char(event) || ""; // SliTaz web browser has not key but keyIdentifier
            if (Utils_1.Utils.debug > 1) {
                Utils_1.Utils.console.log("fnKeyboardKeyup: keyCode=" + iKeyCode + " pressedKey=" + sPressedKey + " key='" + sKey + "' " + sKey.charCodeAt(0) + " loc=" + event.location + " ", event);
            }
            if (sPressedKey in this.oKey2CpcKey) {
                var iCpcKey = this.oKey2CpcKey[sPressedKey];
                if (iCpcKey === 85) { // map virtual cpc key 85 to 22 (english keyboard)
                    iCpcKey = 22;
                }
                this.fnReleaseCpcKey(iCpcKey, sPressedKey, sKey, event.shiftKey, event.ctrlKey);
            }
            else {
                Utils_1.Utils.console.log("fnKeyboardKeyup: Unhandled key", sPressedKey + ":", sKey);
            }
        };
        Keyboard.prototype.getKeyFromBuffer = function () {
            var aKeyBuffer = this.aKeyBuffer, sKey = aKeyBuffer.length ? aKeyBuffer.shift() : "";
            return sKey;
        };
        Keyboard.prototype.putKeyInBuffer = function (sKey) {
            this.aKeyBuffer.push(sKey);
        };
        Keyboard.prototype.putKeysInBuffer = function (sInput) {
            for (var i = 0; i < sInput.length; i += 1) {
                var sKey = sInput.charAt(i);
                this.aKeyBuffer.push(sKey);
            }
        };
        Keyboard.prototype.getKeyState = function (iCpcKey) {
            var oPressedKeys = this.oPressedKeys;
            var iState = -1;
            if (iCpcKey in oPressedKeys) {
                var oCpcKey = oPressedKeys[iCpcKey];
                iState = 0 + (oCpcKey.shift ? 32 : 0) + (oCpcKey.ctrl ? 128 : 0);
            }
            return iState;
        };
        Keyboard.prototype.getJoyState = function (iJoy) {
            var aJoy = Keyboard.aJoyKeyCodes[iJoy];
            var iValue = 0;
            /* eslint-disable no-bitwise */
            for (var i = 0; i < aJoy.length; i += 1) {
                if (this.getKeyState(aJoy[i]) !== -1) {
                    iValue |= (1 << i);
                }
            }
            // check additional special codes for joy 0 (not available on CPC)
            if (iJoy === 0) {
                if (this.getKeyState(80) !== -1) { // up left
                    iValue |= 1 + 4;
                }
                if (this.getKeyState(81) !== -1) { // up right
                    iValue |= 1 + 8;
                }
                if (this.getKeyState(82) !== -1) { // down left
                    iValue |= 2 + 4;
                }
                if (this.getKeyState(83) !== -1) { // down right
                    iValue |= 2 + 8;
                }
            }
            /* eslint-enable no-bitwise */
            return iValue;
        };
        Keyboard.prototype.setExpansionToken = function (iToken, sString) {
            this.aExpansionTokens[iToken] = sString;
        };
        Keyboard.prototype.setCpcKeyExpansion = function (oOptions) {
            var oCpcKeyExpansions = this.oCpcKeyExpansions, iCpcKey = oOptions.iCpcKey;
            oCpcKeyExpansions.repeat[iCpcKey] = oOptions.iRepeat;
            if (oOptions.iNormal !== undefined) {
                oCpcKeyExpansions.normal[iCpcKey] = oOptions.iNormal;
            }
            if (oOptions.iShift !== undefined) {
                oCpcKeyExpansions.shift[iCpcKey] = oOptions.iShift;
            }
            if (oOptions.iCtrl !== undefined) {
                oCpcKeyExpansions.ctrl[iCpcKey] = oOptions.iCtrl;
            }
        };
        Keyboard.prototype.onCpcAreaKeydown = function (event) {
            if (this.bActive) {
                this.fnKeyboardKeydown(event);
                event.preventDefault();
                return false;
            }
            return undefined;
        };
        Keyboard.prototype.oncpcAreaKeyup = function (event) {
            if (this.bActive) {
                this.fnKeyboardKeyup(event);
                event.preventDefault();
                return false;
            }
            return undefined;
        };
        // use this:
        Keyboard.mKey2CpcKey = {
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
        Keyboard.mSpecialKeys = {
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
        Keyboard.aJoyKeyCodes = [
            [72, 73, 74, 75, 76, 77],
            [48, 49, 50, 51, 52, 53]
        ];
        return Keyboard;
    }());
    exports.Keyboard = Keyboard;
});
//# sourceMappingURL=Keyboard.js.map