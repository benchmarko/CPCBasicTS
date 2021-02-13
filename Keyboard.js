"use strict";
// Keyboard.ts - Keyboard handling
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//
Object.defineProperty(exports, "__esModule", { value: true });
exports.Keyboard = void 0;
var Utils_1 = require("./Utils");
var View_1 = require("./View");
/*
type VirtualKeyboardLayoutType1 = { key: number, style?: number };

type VirtualKeyboardLayoutType2 = (number | VirtualKeyboardLayoutType1);

interface VirtualButtonRowOptions {
    key: number,
    text: string,
    title: string,
    className: string
}
*/
var Keyboard = /** @class */ (function () {
    /*
    private static aVirtualKeyboardAlpha: VirtualKeyboardLayoutType2[][] = [
        [66, 64, 65, 57, 56, 49, 48, 41, 40, 33, 32, 25, 24, 16, 79],
        [68, 67, 59, 58, 50, 51, 43, 42, 35, 34, 27, 26, 17, 18],
        [70, 69, 60, 61, 53, 52, 44, 45, 37, 36, 29, 28, 19, 90], // 90=virtual numpad button
        [
            21, 71, 63, 62, 55, 54, 46, 38, 39, 31, 30, 22,
            {
                key: 21, // right shift has same code and style
                style: 2
            }
        ],
        [23, 9, 47, 6]
    ];

    private static aVirtualKeyboardNum: VirtualKeyboardLayoutType2[][] = [ // numpad
        [10, 11, 3],
        [20, 12, 4],
        [13, 14, 5],
        [15, 0, 7],
        [8, 2, 1]
    ];
    */
    /* eslint-enable array-element-newline */
    function Keyboard(options) {
        this.options = Object.assign({}, options);
        this.fnOnKeyDown = this.options.fnOnKeyDown;
        //this.oKey2CpcKey = Keyboard.initKey2CpcKeyMap();
        this.oKey2CpcKey = Keyboard.oKey2CpcKey; //TTT use directly
        this.aKeyBuffer = []; // buffered pressed keys
        this.aExpansionTokens = []; // expansion tokens 0..31 (in reality: 128..159)
        this.oCpcKeyExpansions = {
            normal: {},
            shift: {},
            ctrl: {},
            repeat: {}
        }; // cpc keys to expansion tokens for normal, shift, ctrl; also repeat
        // reset: this.oPressedKeys = {}; // currently pressed browser keys
        this.bActive = false; // flag if keyboard is active/focused, set from outside
        this.bCodeStringsRemoved = false;
        var cpcArea = View_1.View.getElementById1("cpcArea");
        cpcArea.addEventListener("keydown", this.onCpcAreaKeydown.bind(this), false);
        cpcArea.addEventListener("keyup", this.oncpcAreaKeyup.bind(this), false);
        /*
        const oEventNames = this.fnAttachPointerEvents("kbdArea", this.onVirtualKeyboardKeydown.bind(this), undefined, this.onVirtualKeyboardKeyup.bind(this));

        if (oEventNames.out) {
            this.sPointerOutEvent = oEventNames.out;
            this.fnVirtualKeyout = this.onVirtualKeyboardKeyout.bind(this);
        }

        this.dragInit("pageBody", "kbdAreaBox");
        */
        // reset
        this.oPressedKeys = {}; // currently pressed browser keys
        this.bShiftLock = false; // for virtual keyboard
        this.bNumLock = false;
    }
    /*
    private fnAttachPointerEvents(sId: string, fnDown?: EventListener, fnMove?: EventListener, fnUp?: EventListener) { // eslint-disable-line class-methods-use-this
        const area = View.getElementById1(sId),
            oPointerEventNames = {
                down: "pointerdown",
                move: "pointermove",
                up: "pointerup",
                cancel: "pointercancel",
                out: "pointerout",
                type: "pointer"
            },
            oTouchEventNames = {
                down: "touchstart",
                move: "touchmove",
                up: "touchend",
                cancel: "touchcancel",
                out: "", // n.a.
                type: "touch"
            },
            oMouseEventNames = {
                down: "mousedown",
                move: "mousemove",
                up: "mouseup",
                cancel: "", // n.a.
                out: "mouseout",
                type: "mouse"
            };

        let oEventNames: typeof oPointerEventNames;

        if (window.PointerEvent) {
            oEventNames = oPointerEventNames;
        } else if ("ontouchstart" in window || navigator.maxTouchPoints) {
            oEventNames = oTouchEventNames;
        } else {
            oEventNames = oMouseEventNames;
        }

        if (Utils.debug > 0) {
            Utils.console.log("fnAttachPointerEvents: Using", oEventNames.type, "events");
        }

        if (fnDown) {
            area.addEventListener(oEventNames.down, fnDown, false); // +clicked for pointer, touch?
        }
        if (fnMove) {
            area.addEventListener(oEventNames.move, fnMove, false);
        }
        if (fnUp) {
            area.addEventListener(oEventNames.up, fnUp, false);
            if (oEventNames.cancel) {
                area.addEventListener(oEventNames.cancel, fnUp, false);
            }
        }
        return oEventNames;
    }
    */
    /*
    private static initKey2CpcKeyMap() {
        const aCpcKey2Key = Keyboard.aCpcKey2Key,
            oKey2CpcKey: Key2CpcKeyType = {};

        for (let iCpcKey = 0; iCpcKey < aCpcKey2Key.length; iCpcKey += 1) {
            const sMappedKeys = aCpcKey2Key[iCpcKey].keys;

            if (sMappedKeys) {
                const aMappedKeys = sMappedKeys.split(","); // maybe more

                for (let i = 0; i < aMappedKeys.length; i += 1) {
                    const sKey = aMappedKeys[i];

                    oKey2CpcKey[sKey] = iCpcKey;
                }
            }
        }
        return oKey2CpcKey;
    }
    */
    Keyboard.prototype.reset = function () {
        this.fnOnKeyDown = undefined;
        this.clearInput();
        this.oPressedKeys = {}; // currently pressed browser keys
        this.bShiftLock = false; // for virtual keyboard
        this.bNumLock = false;
        //this.virtualKeyboardAdaptKeys(false, false);
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
            aExpansionTokens[i] = "0"; //TTT was 0
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
    Keyboard.oKey2CpcKey = {
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
    /*
    private static aCpcKey2Key: CpcKey2Key[] = [
        {
            keys: "38ArrowUp", // 0: cursor up
            key: "ArrowUp",
            text: "\u2191",
            title: "Cursor up"
        },
        {
            keys: "39ArrowRight", // 1: cursor right
            key: "ArrowRight",
            text: "\u2192",
            title: "Cursor right",
            style: 1
        },
        {
            keys: "40ArrowDown", // 2: cursor down
            key: "ArrowDown",
            text: "\u2193",
            title: "Cursor down"
        },
        {
            keys: "105Numpad9,120F9", // 3: numpad f9
            key: "9",
            text: "f9",
            style: 1,
            numLockCpcKey: 81 // joy 0 up+right
        },
        {
            keys: "102Numpad6,117F6", // 4: numpad f6
            key: "6",
            text: "f6",
            style: 1,
            numLockCpcKey: 75 // joy 0 right
        },
        {
            keys: "99Numpad3,114F3", // 5: numpad f3
            key: "3",
            text: "f3",
            style: 1,
            numLockCpcKey: 83 // joy 0 down+right
        },
        {
            keys: "13NumpadEnter", // 6: numpad enter
            key: "Enter",
            style: 4
        },
        {
            keys: "110NumpadDecimal", // 7: numpad .
            key: ".",
            numLockCpcKey: 77 // joy 0 fire 1
        },
        {
            keys: "37ArrowLeft", // 8: cursor left
            key: "ArrowLeft",
            text: "\u2190",
            title: "Cursor left",
            style: 1
        },
        {
            keys: "18AltLeft", // 9: copy
            key: "Alt",
            text: "Copy",
            style: 2
        },
        {
            keys: "103Numpad7,118F7", // 10: numpad f7
            key: "7",
            text: "f7",
            style: 1,
            numLockCpcKey: 80 // joy 0 up+left
        },
        {
            keys: "104Numpad8,119F8", // 11: numpad f8
            key: "8",
            text: "f8",
            style: 1,
            numLockCpcKey: 72 // joy 0 up
        },
        {
            keys: "101Numpad5,116F5", // 12: numpad f5
            key: "5",
            text: "f5",
            style: 1,
            numLockCpcKey: 76 // joy 0 fire 2
        },
        {
            keys: "97Numpad1,112F1", // 13: numpad f1
            key: "1",
            text: "f1",
            style: 1,
            numLockCpcKey: 82 // joy 0 down+left
        },
        {
            keys: "98Numpad2,113F2", // 14: numpad f2
            key: "2",
            text: "f2",
            style: 1,
            numLockCpcKey: 73 // joy 0 down
        },
        {
            keys: "96Numpad0,121F10", // 15: numpad f0
            key: "0",
            text: "f0",
            style: 1
            //numLockCpcKey: 90 // Num lock
        },
        {
            keys: "46Delete", // 16: clr
            key: "Delete",
            text: "Clr",
            title: "Clear",
            style: 1
        },
        {
            keys: "187BracketRight,171BracketRight,221BracketRight", // 17: [ { (Chrome: 187; FF: 171); EN: 221BracketRight
            key: "[",
            keyShift: "{"
        },
        {
            keys: "13Enter", // 18: return
            key: "Enter",
            text: "Ret",
            title: "Return",
            style: 2
        },
        {
            keys: "191Backslash,163Backslash,220Backslash", // 19: ] } => # ' (Chrome: 191; FF: 163); EN: 220Backslash
            key: "]",
            keyShift: "}"
        },
        {
            keys: "100Numpad4,115F4", // 20: numpad f4
            key: "4",
            text: "f4",
            style: 1,
            numLockCpcKey: 74 // joy 0 left
        },
        {
            keys: "16ShiftLeft,16ShiftRight", // 21: shift left, shift right (2 keys!)
            key: "Shift",
            style: 4
        },
        {
            keys: "220Backquote,160Backquote,192Backquote", // 22: \ ` (different location, key!; Chrome: 220; FF: 160); EN: 192Backquote, 226IntlBackslash?
            key: "\\",
            keyShift: "`"
        },
        {
            keys: "17ControlLeft,17ControlRight", // 23: Note: alt-gr also triggers ctrl-left and alt-gr!
            key: "Control",
            text: "Ctrl",
            title: "Control",
            style: 4
        },
        {
            keys: "221Equal,192Equal,187Equal", // 24: ^ £ (pound: \u00A3) (Chrome: 221; FF: 192); EN: 187Equal
            key: "^",
            keyShift: "£"
        },
        {
            keys: "219Minus,63Minus,189Minus", // 25: - = (Chrome: 219; FF: 63); EN: 189Minus
            key: "-",
            keyShift: "="
        },
        {
            keys: "186BracketLeft,59BracketLeft,219BracketLeft", // 26: @ | (Chrome: 168; FF: 59); EN: 219BracketLeft
            key: "@",
            keyShift: "|",
            style: 1
        },
        {
            keys: "80KeyP", // 27: P
            key: "p",
            keyShift: "P"
        },
        {
            keys: "222Quote,192Quote", // 28: ; + (same on Chrome, FF); Android Bluetooth EN: 192Quote
            key: ";",
            keyShift: "+"
        },
        {
            keys: "192Semicolon,186Semicolon", // 29: : * (same on Chrome, FF); EN: 186Semicolon
            key: ":",
            keyShift: "*"
        },
        {
            keys: "189Slash,173Slash,191Slash", // 30: / ? (Chrome: 189; FF: 173); EN: 191Slash
            key: "/",
            keyShift: "?"
        },
        {
            keys: "190Period", // 31: . <
            key: ".",
            keyShift: "<"
        },
        {
            keys: "48Digit0", // 32: 0 _
            key: "0",
            keyShift: "_"
        },
        {
            keys: "57Digit9", // 33: 9 )
            key: "9",
            keyShift: ")"
        },
        {
            keys: "79KeyO", // 34:
            key: "o",
            keyShift: "O"
        },
        {
            keys: "73KeyI", // 35:
            key: "i",
            keyShift: "I"
        },
        {
            keys: "76KeyL", // 36:
            key: "l",
            keyShift: "L"
        },
        {
            keys: "75KeyK", // 37:
            key: "k",
            keyShift: "K"
        },
        {
            keys: "77KeyM", // 38:
            key: "m",
            keyShift: "M"
        },
        {
            keys: "188Comma", // 39: , >
            key: ",",
            keyShift: ">"
        },
        {
            keys: "56Digit8", // 40: 8 (
            key: "8",
            keyShift: "("
        },
        {
            keys: "55Digit7", // 41: 7 '
            key: "7",
            keyShift: "'"
        },
        {
            keys: "85KeyU", // 42:
            key: "u",
            keyShift: "U"
        },
        {
            keys: "90KeyY,89KeyY", // 43:
            key: "y",
            keyShift: "Y"
        },
        {
            keys: "72KeyH", // 44:
            key: "h",
            keyShift: "H"
        },
        {
            keys: "74KeyJ", // 45:
            key: "j",
            keyShift: "J"
        },
        {
            keys: "78KeyN", // 46:
            key: "n",
            keyShift: "N"
        },
        {
            keys: "32Space", // 47: space
            key: " ",
            text: "Space",
            style: 5
        },
        {
            keys: "54Digit6", // 48: 6 &
            key: "6",
            keyShift: "("
        },
        {
            keys: "53Digit5", // 49: 5 %
            key: "5",
            keyShift: "%"
        },
        {
            keys: "82KeyR", // 50:
            key: "r",
            keyShift: "R"
        },
        {
            keys: "84KeyT", // 51:
            key: "t",
            keyShift: "T"
        },
        {
            keys: "71KeyG", // 52:
            key: "g",
            keyShift: "G"
        },
        {
            keys: "70KeyF", // 53:
            key: "f",
            keyShift: "F"
        },
        {
            keys: "66KeyB", // 54:
            key: "b",
            keyShift: "B"
        },
        {
            keys: "86KeyV", // 55:
            key: "v",
            keyShift: "V"
        },
        {
            keys: "52Digit4", // 56: 4 $
            key: "4",
            keyShift: "$"
        },
        {
            keys: "51Digit3", // 57: 3 #
            key: "3",
            keyShift: "#"
        },
        {
            keys: "69KeyE", // 58:
            key: "e",
            keyShift: "E"
        },
        {
            keys: "87KeyW", // 59:
            key: "w",
            keyShift: "W"
        },
        {
            keys: "83KeyS", // 60:
            key: "s",
            keyShift: "S"
        },
        {
            keys: "68KeyD", // 61:
            key: "d",
            keyShift: "D"
        },
        {
            keys: "67KeyC", // 62:
            key: "c",
            keyShift: "C"
        },
        {
            keys: "88KeyX", // 63:
            key: "x",
            keyShift: "X"
        },
        {
            keys: "49Digit1", // 64: 1 !
            key: "1",
            keyShift: "!"
        },
        {
            keys: "50Digit2", // 65: 2 "
            key: "2",
            keyShift: "\""
        },
        {
            keys: "27Escape", // 66: esc
            key: "Escape",
            text: "Esc",
            title: "Escape",
            style: 1
        },
        {
            keys: "81KeyQ", // 67:
            key: "q",
            keyShift: "Q"
        },
        {
            keys: "9Tab", // 68:
            key: "Tab",
            style: 2
        },
        {
            keys: "65KeyA", // 69:
            key: "a",
            keyShift: "A"
        },
        {
            keys: "20CapsLock", // 70: caps lock
            key: "CapsLock",
            text: "Caps",
            title: "Caps Lock",
            style: 3
        },
        {
            keys: "89KeyZ,90KeyZ", // 71: DE,EN
            key: "z",
            keyShift: "Z"
        },
        {
            keys: "38Numpad8", // 72: joy 0 up (arrow up)
            key: "JoyUp",
            text: "\u21D1",
            title: "Joy up"
        },
        {
            keys: "40Numpad2", // 73: joy 0 down
            key: "JoyDown",
            text: "\u21D3",
            title: "Joy down"
        },
        {
            keys: "37Numpad4", // 74: joy 0 left
            key: "JoyLeft",
            text: "\u21D0",
            title: "Joy left"
        },
        {
            keys: "39Numpad6", // 75: joy 0 right
            key: "JoyRight",
            text: "\u21D2",
            title: "Joy right"
        },
        {
            keys: "12Numpad5,45Numpad0", // 76: joy 0 fire 2 (clear,...)
            key: "X",
            text: "\u29BF",
            title: "Joy fire"
        },
        {
            keys: "46NumpadDecimal", // 77: joy 0 fire 1
            key: "Z",
            text: "\u25E6",
            title: "Joy fire 1"
        },
        {
            keys: "", // 78: ""? not null? (joy 0 fire 3?) TTT
            key: ""
        },
        {
            keys: "8Backspace", // 79: del
            key: "Backspace", // 79: del
            text: "Del",
            title: "Delete",
            style: 1
        },
        // starting with 80, not on CPC
        // not on CPC:
        {
            keys: "36Numpad7", // 80: joy 0 up+left
            key: "",
            text: "\u21D6",
            title: "Joy up+left"
        },
        {
            keys: "33Numpad9", // 81: joy 0 up+right
            key: "",
            text: "\u21D7",
            title: "Joy up+right"
        },
        {
            keys: "35Numpad1", // 82: joy 0 down+left
            key: "",
            text: "\u21D9",
            title: "Joy down+leftt"
        },
        {
            keys: "34Numpad3", // 83: joy 0 down+right
            key: "",
            text: "\u21D8",
            title: "Joy down+right"
        },
        {
            keys: "", // 84: (not null?) TTT
            key: ""
        },
        {
            keys: "226IntlBackslash,60IntlBackslash,220IntlBackslash", // 85: < > | // key not on CPC! (Chrome: 226, FF: 60);  Android Bluetooth EN: 220IntlBackslash
            key: ""
        },
        {
            keys: "111NumpadDivide", // 86:
            key: ""
        },
        {
            keys: "106NumpadMultiply", // 87:
            key: ""
        },
        {
            keys: "109NumpadSubtract", // 88:
            key: ""
        },
        {
            keys: "107NumpadAdd", // 89:
            key: ""
        },
        {
            keys: "",
            key: "", // 90: special num lock key to switch between joystick and numpad
            text: "Num",
            title: "Num / Joy",
            style: 1
        }
        // only on PC:
        // "226IntlBackslash", "122F11", "123F12", "44PrintScreen", "145ScrollLock", "19Pause", "45Insert", "36Home", "33PageUp", "35End", "34PageDown", "111NumpadDivide", "106NumpadMultiply", "109NumpadSubtract", "107NumpadAdd"
    ];
    */
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
//# sourceMappingURL=Keyboard.js.map