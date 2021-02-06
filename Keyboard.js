"use strict";
// Keyboard.ts - Keyboard handling
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//
Object.defineProperty(exports, "__esModule", { value: true });
exports.Keyboard = void 0;
var Utils_1 = require("./Utils");
var View_1 = require("./View");
var Keyboard = /** @class */ (function () {
    /* eslint-enable array-element-newline */
    function Keyboard(options) {
        this.oDrag = {
            dragItem: undefined,
            active: false,
            xOffset: 0,
            yOffset: 0,
            initialX: 0,
            initialY: 0,
            currentX: 0,
            currentY: 0
        };
        this.options = Object.assign({}, options);
        this.fnOnKeyDown = this.options.fnOnKeyDown;
        this.oKey2CpcKey = this.initKey2CpcKeyMap();
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
        var oEventNames = this.fnAttachPointerEvents("kbdArea", this.onVirtualKeyboardKeydown.bind(this), undefined, this.onVirtualKeyboardKeyup.bind(this));
        if (oEventNames.out) {
            this.sPointerOutEvent = oEventNames.out;
            this.fnVirtualKeyout = this.onVirtualKeyboardKeyout.bind(this);
        }
        this.dragInit("pageBody", "kbdAreaBox");
        // reset
        this.oPressedKeys = {}; // currently pressed browser keys
        this.bShiftLock = false; // for virtual keyboard
        this.bNumLock = false;
    }
    Keyboard.prototype.fnAttachPointerEvents = function (sId, fnDown, fnMove, fnUp) {
        var area = View_1.View.getElementById1(sId), oPointerEventNames = {
            down: "pointerdown",
            move: "pointermove",
            up: "pointerup",
            cancel: "pointercancel",
            out: "pointerout",
            type: "pointer"
        }, oTouchEventNames = {
            down: "touchstart",
            move: "touchmove",
            up: "touchend",
            cancel: "touchcancel",
            out: "",
            type: "touch"
        }, oMouseEventNames = {
            down: "mousedown",
            move: "mousemove",
            up: "mouseup",
            cancel: "",
            out: "mouseout",
            type: "mouse"
        };
        var oEventNames;
        if (window.PointerEvent) {
            oEventNames = oPointerEventNames;
        }
        else if ("ontouchstart" in window || navigator.maxTouchPoints) {
            oEventNames = oTouchEventNames;
        }
        else {
            oEventNames = oMouseEventNames;
        }
        if (Utils_1.Utils.debug > 0) {
            Utils_1.Utils.console.log("fnAttachPointerEvents: Using", oEventNames.type, "events");
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
    };
    Keyboard.prototype.initKey2CpcKeyMap = function () {
        var aCpcKey2Key = Keyboard.aCpcKey2Key, oKey2CpcKey = {};
        for (var iCpcKey = 0; iCpcKey < aCpcKey2Key.length; iCpcKey += 1) {
            var sMappedKeys = aCpcKey2Key[iCpcKey].keys;
            if (sMappedKeys) {
                var aMappedKeys = sMappedKeys.split(","); // maybe more
                for (var i = 0; i < aMappedKeys.length; i += 1) {
                    var sKey = aMappedKeys[i];
                    oKey2CpcKey[sKey] = iCpcKey;
                }
            }
        }
        return oKey2CpcKey;
    };
    Keyboard.prototype.reset = function () {
        this.fnOnKeyDown = undefined;
        this.clearInput();
        this.oPressedKeys = {}; // currently pressed browser keys
        this.bShiftLock = false; // for virtual keyboard
        this.bNumLock = false;
        this.virtualKeyboardAdaptKeys(false, false);
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
    Keyboard.prototype.mapNumLockCpcKey = function (iCpcKey) {
        var oKey = Keyboard.aCpcKey2Key[iCpcKey];
        if (oKey.numLockCpcKey) {
            iCpcKey = oKey.numLockCpcKey;
        }
        return iCpcKey;
    };
    Keyboard.prototype.fnVirtualGetAscii = function (iCpcKey, bShiftKey, bNumLock) {
        var oKey = Keyboard.aCpcKey2Key[iCpcKey];
        var sKey, sText, sTitle;
        if (bNumLock && oKey.keyNumLock) {
            sKey = oKey.keyNumLock;
            sText = oKey.textNumLock || sKey;
            sTitle = oKey.titleNumLock || sText;
        }
        else if (bShiftKey && oKey.keyShift) {
            sKey = oKey.keyShift;
            sText = oKey.textShift || sKey;
            sTitle = oKey.titleShift || sText;
        }
        else {
            sKey = oKey.key;
            sText = oKey.text || sKey;
            sTitle = oKey.title || sText;
        }
        var oAscii = {
            key: sKey,
            text: sText,
            title: sTitle
        };
        return oAscii;
    };
    Keyboard.prototype.createButtonRow = function (sId, aOptions) {
        var place = View_1.View.getElementById1(sId);
        if (place.insertAdjacentElement) {
            var buttonList = document.createElement("div");
            buttonList.className = "displayFlex";
            for (var i = 0; i < aOptions.length; i += 1) {
                var oItem = aOptions[i], button = document.createElement("button");
                button.innerText = oItem.text;
                button.setAttribute("title", oItem.title);
                button.className = oItem.className;
                button.setAttribute("data-key", String(oItem.key));
                buttonList.insertAdjacentElement("beforeend", button);
            }
            place.insertAdjacentElement("beforeend", buttonList);
        }
        else { // Polyfill for old browsers
            var sHtml = "<div class=displayFlex>\n";
            for (var i = 0; i < aOptions.length; i += 1) {
                var oItem = aOptions[i];
                sHtml += '<button title="' + oItem.title + '" class="' + oItem.className + '" data-key="' + oItem.key + '">' + oItem.text + "</button>\n";
            }
            sHtml += "</div>";
            place.innerHTML += sHtml;
        }
        return this;
    };
    Keyboard.prototype.virtualKeyboardCreatePart = function (sId, aVirtualKeyboard) {
        var oKeyArea = View_1.View.getElementById1(sId), bShiftLock = this.bShiftLock, bNumLock = this.bNumLock, aCpcKey2Key = Keyboard.aCpcKey2Key, aButtons = oKeyArea.getElementsByTagName("button");
        if (!aButtons.length) { // not yet created?
            for (var iRow = 0; iRow < aVirtualKeyboard.length; iRow += 1) {
                var aRow = aVirtualKeyboard[iRow], aOptions = [];
                for (var iCol = 0; iCol < aRow.length; iCol += 1) {
                    var oCpcKey = void 0;
                    if (typeof aRow[iCol] === "number") {
                        oCpcKey = {
                            key: aRow[iCol]
                        };
                    }
                    else { // object
                        oCpcKey = aRow[iCol];
                    }
                    var iCpcKey = bNumLock ? this.mapNumLockCpcKey(oCpcKey.key) : oCpcKey.key, oKey = aCpcKey2Key[oCpcKey.key], oAscii = this.fnVirtualGetAscii(iCpcKey, bShiftLock, bNumLock), sClassName = "kbdButton" + (oCpcKey.style || oKey.style || "") + ((iCol === aRow.length - 1) ? " kbdNoRightMargin" : ""), oOptions = {
                        key: iCpcKey,
                        text: oAscii.text,
                        title: oAscii.title,
                        className: sClassName
                    };
                    aOptions.push(oOptions);
                }
                this.createButtonRow(sId, aOptions);
            }
        }
    };
    Keyboard.prototype.virtualKeyboardCreate = function () {
        this.virtualKeyboardCreatePart("kbdAlpha", Keyboard.aVirtualKeyboardAlpha);
        this.virtualKeyboardCreatePart("kbdNum", Keyboard.aVirtualKeyboardNum);
    };
    Keyboard.prototype.virtualKeyboardAdaptKeys = function (bShiftLock, bNumLock) {
        var oKeyArea = View_1.View.getElementById1("kbdArea"), aButtons = oKeyArea.getElementsByTagName("button"); // or: oKeyArea.childNodes and filter
        for (var i = 0; i < aButtons.length; i += 1) {
            var oButton = aButtons[i];
            var iCpcKey = Number(oButton.getAttribute("data-key"));
            if (bNumLock) {
                iCpcKey = this.mapNumLockCpcKey(iCpcKey);
            }
            var oAscii = this.fnVirtualGetAscii(iCpcKey, bShiftLock, bNumLock);
            if (oAscii.key !== oButton.innerText) {
                oButton.innerText = oAscii.text;
                oButton.title = oAscii.title;
            }
        }
    };
    Keyboard.prototype.fnVirtualGetPressedKey = function (iCpcKey) {
        var oKey = Keyboard.aCpcKey2Key[iCpcKey];
        var sPressedKey = "";
        if (oKey) {
            sPressedKey = oKey.keys;
            if (sPressedKey.indexOf(",") >= 0) { // TTT maybe more
                sPressedKey = sPressedKey.substring(0, sPressedKey.indexOf(",")); // take the first
            }
        }
        return sPressedKey;
    };
    Keyboard.prototype.fnGetEventTarget = function (event) {
        var node = event.target || event.srcElement; // target, not currentTarget
        if (!node) {
            throw new Error("Keyboard: Undefined event target: " + node);
        }
        return node;
    };
    Keyboard.prototype.onVirtualKeyboardKeydown = function (event) {
        var node = this.fnGetEventTarget(event), oHtmlElement = node, sCpcKey = oHtmlElement.getAttribute("data-key");
        if (Utils_1.Utils.debug > 1) {
            Utils_1.Utils.console.debug("onVirtualKeyboardKeydown: event", String(event), "type:", event.type, "title:", oHtmlElement.title, "cpcKey:", sCpcKey);
        }
        if (sCpcKey !== null) {
            var iCpcKey = Number(sCpcKey);
            if (this.bNumLock) {
                iCpcKey = this.mapNumLockCpcKey(iCpcKey);
            }
            var sPressedKey = this.fnVirtualGetPressedKey(iCpcKey), oPointerEvent = event, oAscii = this.fnVirtualGetAscii(iCpcKey, this.bShiftLock || oPointerEvent.shiftKey, this.bNumLock);
            this.fnPressCpcKey(iCpcKey, sPressedKey, oAscii.key, oPointerEvent.shiftKey, oPointerEvent.ctrlKey);
        }
        if (this.sPointerOutEvent && this.fnVirtualKeyout) {
            node.addEventListener(this.sPointerOutEvent, this.fnVirtualKeyout, false);
        }
        event.preventDefault();
        return false;
    };
    Keyboard.prototype.fnVirtualKeyboardKeyupOrKeyout = function (event) {
        var node = this.fnGetEventTarget(event), sCpcKey = node.getAttribute("data-key");
        if (sCpcKey !== null) {
            var iCpcKey = Number(sCpcKey);
            if (this.bNumLock) {
                iCpcKey = this.mapNumLockCpcKey(iCpcKey);
            }
            var sPressedKey = this.fnVirtualGetPressedKey(iCpcKey), oPointerEvent = event, oAscii = this.fnVirtualGetAscii(iCpcKey, this.bShiftLock || oPointerEvent.shiftKey, this.bNumLock);
            this.fnReleaseCpcKey(iCpcKey, sPressedKey, oAscii.key, oPointerEvent.shiftKey, oPointerEvent.ctrlKey);
            if (iCpcKey === 70) { // Caps Lock?
                this.bShiftLock = !this.bShiftLock;
                this.virtualKeyboardAdaptKeys(this.bShiftLock, this.bNumLock);
            }
            else if (iCpcKey === 90) { // Num lock
                this.bNumLock = !this.bNumLock;
                this.virtualKeyboardAdaptKeys(this.bShiftLock, this.bNumLock);
            }
        }
    };
    Keyboard.prototype.onVirtualKeyboardKeyup = function (event) {
        var node = this.fnGetEventTarget(event), oHtmlElement = node;
        if (Utils_1.Utils.debug > 1) {
            Utils_1.Utils.console.debug("onVirtualKeyboardKeyup: event", String(event), "type:", event.type, "title:", oHtmlElement.title, "cpcKey:", oHtmlElement.getAttribute("data-key"));
        }
        this.fnVirtualKeyboardKeyupOrKeyout(event);
        if (this.sPointerOutEvent && this.fnVirtualKeyout) {
            node.removeEventListener(this.sPointerOutEvent, this.fnVirtualKeyout); // do not need out event any more
        }
        event.preventDefault();
        return false;
    };
    Keyboard.prototype.onVirtualKeyboardKeyout = function (event) {
        var node = this.fnGetEventTarget(event);
        if (Utils_1.Utils.debug > 1) {
            Utils_1.Utils.console.debug("onVirtualKeyboardKeyout: event=", event);
        }
        this.fnVirtualKeyboardKeyupOrKeyout(event);
        if (this.sPointerOutEvent && this.fnVirtualKeyout) {
            node.removeEventListener(this.sPointerOutEvent, this.fnVirtualKeyout);
        }
        event.preventDefault();
        return false;
    };
    // based on https://www.kirupa.com/html5/drag.htm
    Keyboard.prototype.dragInit = function (sContainerId, sItemId) {
        var oDrag = this.oDrag;
        oDrag.dragItem = View_1.View.getElementById1(sItemId);
        oDrag.active = false;
        oDrag.xOffset = 0;
        oDrag.yOffset = 0;
        this.fnAttachPointerEvents(sContainerId, this.dragStart.bind(this), this.drag.bind(this), this.dragEnd.bind(this));
    };
    Keyboard.prototype.dragStart = function (event) {
        var node = this.fnGetEventTarget(event), parent2 = node.parentElement ? node.parentElement.parentElement : null, oDrag = this.oDrag;
        if (node === oDrag.dragItem || parent2 === oDrag.dragItem) {
            if (event.type === "touchstart") {
                var oTouchEvent = event;
                oDrag.initialX = oTouchEvent.touches[0].clientX - oDrag.xOffset;
                oDrag.initialY = oTouchEvent.touches[0].clientY - oDrag.yOffset;
            }
            else {
                var oDragEvent = event;
                oDrag.initialX = oDragEvent.clientX - oDrag.xOffset;
                oDrag.initialY = oDragEvent.clientY - oDrag.yOffset;
            }
            oDrag.active = true;
        }
    };
    Keyboard.prototype.dragEnd = function ( /* event */) {
        var oDrag = this.oDrag;
        oDrag.initialX = oDrag.currentX;
        oDrag.initialY = oDrag.currentY;
        oDrag.active = false;
    };
    Keyboard.prototype.setTranslate = function (xPos, yPos, el) {
        el.style.transform = "translate3d(" + xPos + "px, " + yPos + "px, 0)";
    };
    Keyboard.prototype.drag = function (event) {
        var oDrag = this.oDrag;
        if (oDrag.active) {
            event.preventDefault();
            if (event.type === "touchmove") {
                var oTouchEvent = event;
                oDrag.currentX = oTouchEvent.touches[0].clientX - oDrag.initialX;
                oDrag.currentY = oTouchEvent.touches[0].clientY - oDrag.initialY;
            }
            else {
                var oDragEvent = event;
                oDrag.currentX = oDragEvent.clientX - oDrag.initialX;
                oDrag.currentY = oDragEvent.clientY - oDrag.initialY;
            }
            oDrag.xOffset = oDrag.currentX;
            oDrag.yOffset = oDrag.currentY;
            if (oDrag.dragItem) {
                this.setTranslate(oDrag.currentX, oDrag.currentY, oDrag.dragItem);
            }
        }
    };
    Keyboard.aCpcKey2Key = [
        {
            keys: "38ArrowUp",
            key: "ArrowUp",
            text: "\u2191",
            title: "Cursor up"
        },
        {
            keys: "39ArrowRight",
            key: "ArrowRight",
            text: "\u2192",
            title: "Cursor right",
            style: 1
        },
        {
            keys: "40ArrowDown",
            key: "ArrowDown",
            text: "\u2193",
            title: "Cursor down"
        },
        {
            keys: "105Numpad9,120F9",
            key: "9",
            text: "f9",
            style: 1,
            numLockCpcKey: 81 // joy 0 up+right
        },
        {
            keys: "102Numpad6,117F6",
            key: "6",
            text: "f6",
            style: 1,
            numLockCpcKey: 75 // joy 0 right
        },
        {
            keys: "99Numpad3,114F3",
            key: "3",
            text: "f3",
            style: 1,
            numLockCpcKey: 83 // joy 0 down+right
        },
        {
            keys: "13NumpadEnter",
            key: "Enter",
            style: 4
        },
        {
            keys: "110NumpadDecimal",
            key: ".",
            numLockCpcKey: 77 // joy 0 fire 1
        },
        {
            keys: "37ArrowLeft",
            key: "ArrowLeft",
            text: "\u2190",
            title: "Cursor left",
            style: 1
        },
        {
            keys: "18AltLeft",
            key: "Alt",
            text: "Copy",
            style: 2
        },
        {
            keys: "103Numpad7,118F7",
            key: "7",
            text: "f7",
            style: 1,
            numLockCpcKey: 80 // joy 0 up+left
        },
        {
            keys: "104Numpad8,119F8",
            key: "8",
            text: "f8",
            style: 1,
            numLockCpcKey: 72 // joy 0 up
        },
        {
            keys: "101Numpad5,116F5",
            key: "5",
            text: "f5",
            style: 1,
            numLockCpcKey: 76 // joy 0 fire 2
        },
        {
            keys: "97Numpad1,112F1",
            key: "1",
            text: "f1",
            style: 1,
            numLockCpcKey: 82 // joy 0 down+left
        },
        {
            keys: "98Numpad2,113F2",
            key: "2",
            text: "f2",
            style: 1,
            numLockCpcKey: 73 // joy 0 down
        },
        {
            keys: "96Numpad0,121F10",
            key: "0",
            text: "f0",
            style: 1
            //numLockCpcKey: 90 // Num lock
        },
        {
            keys: "46Delete",
            key: "Delete",
            text: "Clr",
            title: "Clear",
            style: 1
        },
        {
            keys: "187BracketRight,171BracketRight,221BracketRight",
            key: "[",
            keyShift: "{"
        },
        {
            keys: "13Enter",
            key: "Enter",
            text: "Ret",
            title: "Return",
            style: 2
        },
        {
            keys: "191Backslash,163Backslash,220Backslash",
            key: "]",
            keyShift: "}"
        },
        {
            keys: "100Numpad4,115F4",
            key: "4",
            text: "f4",
            style: 1,
            numLockCpcKey: 74 // joy 0 left
        },
        {
            keys: "16ShiftLeft,16ShiftRight",
            key: "Shift",
            style: 4
        },
        {
            keys: "220Backquote,160Backquote,192Backquote",
            key: "\\",
            keyShift: "`"
        },
        {
            keys: "17ControlLeft,17ControlRight",
            key: "Control",
            text: "Ctrl",
            title: "Control",
            style: 4
        },
        {
            keys: "221Equal,192Equal,187Equal",
            key: "^",
            keyShift: "£"
        },
        {
            keys: "219Minus,63Minus,189Minus",
            key: "-",
            keyShift: "="
        },
        {
            keys: "186BracketLeft,59BracketLeft,219BracketLeft",
            key: "@",
            keyShift: "|",
            style: 1
        },
        {
            keys: "80KeyP",
            key: "p",
            keyShift: "P"
        },
        {
            keys: "222Quote,192Quote",
            key: ";",
            keyShift: "+"
        },
        {
            keys: "192Semicolon,186Semicolon",
            key: ":",
            keyShift: "*"
        },
        {
            keys: "189Slash,173Slash,191Slash",
            key: "/",
            keyShift: "?"
        },
        {
            keys: "190Period",
            key: ".",
            keyShift: "<"
        },
        {
            keys: "48Digit0",
            key: "0",
            keyShift: "_"
        },
        {
            keys: "57Digit9",
            key: "9",
            keyShift: ")"
        },
        {
            keys: "79KeyO",
            key: "o",
            keyShift: "O"
        },
        {
            keys: "73KeyI",
            key: "i",
            keyShift: "I"
        },
        {
            keys: "76KeyL",
            key: "l",
            keyShift: "L"
        },
        {
            keys: "75KeyK",
            key: "k",
            keyShift: "K"
        },
        {
            keys: "77KeyM",
            key: "m",
            keyShift: "M"
        },
        {
            keys: "188Comma",
            key: ",",
            keyShift: ">"
        },
        {
            keys: "56Digit8",
            key: "8",
            keyShift: "("
        },
        {
            keys: "55Digit7",
            key: "7",
            keyShift: "'"
        },
        {
            keys: "85KeyU",
            key: "u",
            keyShift: "U"
        },
        {
            keys: "90KeyY,89KeyY",
            key: "y",
            keyShift: "Y"
        },
        {
            keys: "72KeyH",
            key: "h",
            keyShift: "H"
        },
        {
            keys: "74KeyJ",
            key: "j",
            keyShift: "J"
        },
        {
            keys: "78KeyN",
            key: "n",
            keyShift: "N"
        },
        {
            keys: "32Space",
            key: " ",
            text: "Space",
            style: 5
        },
        {
            keys: "54Digit6",
            key: "6",
            keyShift: "("
        },
        {
            keys: "53Digit5",
            key: "5",
            keyShift: "%"
        },
        {
            keys: "82KeyR",
            key: "r",
            keyShift: "R"
        },
        {
            keys: "84KeyT",
            key: "t",
            keyShift: "T"
        },
        {
            keys: "71KeyG",
            key: "g",
            keyShift: "G"
        },
        {
            keys: "70KeyF",
            key: "f",
            keyShift: "F"
        },
        {
            keys: "66KeyB",
            key: "b",
            keyShift: "B"
        },
        {
            keys: "86KeyV",
            key: "v",
            keyShift: "V"
        },
        {
            keys: "52Digit4",
            key: "4",
            keyShift: "$"
        },
        {
            keys: "51Digit3",
            key: "3",
            keyShift: "#"
        },
        {
            keys: "69KeyE",
            key: "e",
            keyShift: "E"
        },
        {
            keys: "87KeyW",
            key: "w",
            keyShift: "W"
        },
        {
            keys: "83KeyS",
            key: "s",
            keyShift: "S"
        },
        {
            keys: "68KeyD",
            key: "d",
            keyShift: "D"
        },
        {
            keys: "67KeyC",
            key: "c",
            keyShift: "C"
        },
        {
            keys: "88KeyX",
            key: "x",
            keyShift: "X"
        },
        {
            keys: "49Digit1",
            key: "1",
            keyShift: "!"
        },
        {
            keys: "50Digit2",
            key: "2",
            keyShift: "\""
        },
        {
            keys: "27Escape",
            key: "Escape",
            text: "Esc",
            title: "Escape",
            style: 1
        },
        {
            keys: "81KeyQ",
            key: "q",
            keyShift: "Q"
        },
        {
            keys: "9Tab",
            key: "Tab",
            style: 2
        },
        {
            keys: "65KeyA",
            key: "a",
            keyShift: "A"
        },
        {
            keys: "20CapsLock",
            key: "CapsLock",
            text: "Caps",
            title: "Caps Lock",
            style: 3
        },
        {
            keys: "89KeyZ,90KeyZ",
            key: "z",
            keyShift: "Z"
        },
        {
            keys: "38Numpad8",
            key: "JoyUp",
            text: "\u21D1",
            title: "Joy up"
        },
        {
            keys: "40Numpad2",
            key: "JoyDown",
            text: "\u21D3",
            title: "Joy down"
        },
        {
            keys: "37Numpad4",
            key: "JoyLeft",
            text: "\u21D0",
            title: "Joy left"
        },
        {
            keys: "39Numpad6",
            key: "JoyRight",
            text: "\u21D2",
            title: "Joy right"
        },
        {
            keys: "12Numpad5,45Numpad0",
            key: "X",
            text: "\u29BF",
            title: "Joy fire"
        },
        {
            keys: "46NumpadDecimal",
            key: "Z",
            text: "\u25E6",
            title: "Joy fire 1"
        },
        {
            keys: "",
            key: ""
        },
        {
            keys: "8Backspace",
            key: "Backspace",
            text: "Del",
            title: "Delete",
            style: 1
        },
        // starting with 80, not on CPC
        // not on CPC:
        {
            keys: "36Numpad7",
            key: "",
            text: "\u21D6",
            title: "Joy up+left"
        },
        {
            keys: "33Numpad9",
            key: "",
            text: "\u21D7",
            title: "Joy up+right"
        },
        {
            keys: "35Numpad1",
            key: "",
            text: "\u21D9",
            title: "Joy down+leftt"
        },
        {
            keys: "34Numpad3",
            key: "",
            text: "\u21D8",
            title: "Joy down+right"
        },
        {
            keys: "",
            key: ""
        },
        {
            keys: "226IntlBackslash,60IntlBackslash,220IntlBackslash",
            key: ""
        },
        {
            keys: "111NumpadDivide",
            key: ""
        },
        {
            keys: "106NumpadMultiply",
            key: ""
        },
        {
            keys: "109NumpadSubtract",
            key: ""
        },
        {
            keys: "107NumpadAdd",
            key: ""
        },
        {
            keys: "",
            key: "",
            text: "Num",
            title: "Num / Joy",
            style: 1
        }
        // only on PC:
        // "226IntlBackslash", "122F11", "123F12", "44PrintScreen", "145ScrollLock", "19Pause", "45Insert", "36Home", "33PageUp", "35End", "34PageDown", "111NumpadDivide", "106NumpadMultiply", "109NumpadSubtract", "107NumpadAdd"
    ];
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
    Keyboard.aVirtualKeyboardAlpha = [
        [66, 64, 65, 57, 56, 49, 48, 41, 40, 33, 32, 25, 24, 16, 79],
        [68, 67, 59, 58, 50, 51, 43, 42, 35, 34, 27, 26, 17, 18],
        [70, 69, 60, 61, 53, 52, 44, 45, 37, 36, 29, 28, 19, 90],
        [
            21, 71, 63, 62, 55, 54, 46, 38, 39, 31, 30, 22,
            {
                key: 21,
                style: 2
            }
        ],
        [23, 9, 47, 6]
    ];
    Keyboard.aVirtualKeyboardNum = [
        [10, 11, 3],
        [20, 12, 4],
        [13, 14, 5],
        [15, 0, 7],
        [8, 2, 1]
    ];
    return Keyboard;
}());
exports.Keyboard = Keyboard;
//# sourceMappingURL=Keyboard.js.map