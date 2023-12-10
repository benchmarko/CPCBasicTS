// VirtualKeyboard.ts - VirtualKeyboard
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//
define(["require", "exports", "./Utils", "./View"], function (require, exports, Utils_1, View_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.VirtualKeyboard = void 0;
    var VirtualKeyboard = /** @class */ (function () {
        function VirtualKeyboard(options) {
            this.shiftLock = false;
            this.numLock = false;
            this.fnVirtualKeyboardKeydownHandler = this.onVirtualKeyboardKeydown.bind(this);
            this.fnVirtualKeyboardKeyupOrKeyoutHandler = this.onVirtualKeyboardKeyupOrKeyout.bind(this);
            this.fnKeydownOrKeyupHandler = this.onKeydownOrKeyup.bind(this); // for real Enter and Space
            this.options = {};
            this.setOptions(options);
            var view = this.options.view;
            this.eventNames = this.options.view.fnAttachPointerEvents("kbdAreaInner" /* ViewID.kbdAreaInner */, this.fnVirtualKeyboardKeydownHandler, undefined, this.fnVirtualKeyboardKeyupOrKeyoutHandler);
            view.addEventListenerById("keydown", this.fnKeydownOrKeyupHandler, "kbdAreaInner" /* ViewID.kbdAreaInner */);
            view.addEventListenerById("keyup", this.fnKeydownOrKeyupHandler, "kbdAreaInner" /* ViewID.kbdAreaInner */);
            this.virtualKeyboardCreate();
        }
        VirtualKeyboard.prototype.getOptions = function () {
            return this.options;
        };
        VirtualKeyboard.prototype.setOptions = function (options) {
            Object.assign(this.options, options);
        };
        /* eslint-enable array-element-newline */
        VirtualKeyboard.prototype.reset = function () {
            this.virtualKeyboardAdaptKeys(false, false);
        };
        VirtualKeyboard.prototype.mapNumLockCpcKey = function (cpcKey) {
            var key = VirtualKeyboard.cpcKey2Key[cpcKey];
            if (key.numLockCpcKey) {
                cpcKey = key.numLockCpcKey;
            }
            return cpcKey;
        };
        VirtualKeyboard.prototype.fnVirtualGetAscii = function (cpcKey, shiftKey, numLock) {
            var keyEntry = VirtualKeyboard.cpcKey2Key[cpcKey];
            var key, text, title;
            if (numLock && keyEntry.keyNumLock) {
                key = keyEntry.keyNumLock;
                text = keyEntry.textNumLock || key;
                title = keyEntry.titleNumLock || text;
            }
            else if (shiftKey && keyEntry.keyShift) {
                key = keyEntry.keyShift;
                text = keyEntry.textShift || key;
                title = keyEntry.titleShift || text;
            }
            else {
                key = keyEntry.key;
                text = keyEntry.text || key;
                title = keyEntry.title || text;
            }
            return {
                key: key,
                text: text,
                title: title
            };
        };
        VirtualKeyboard.prototype.createButtonRow = function (id, options) {
            var place = View_1.View.getElementById1(id);
            if (place.insertAdjacentElement) {
                var buttonList = document.createElement("div");
                buttonList.className = "displayFlex";
                for (var i = 0; i < options.length; i += 1) {
                    var item = options[i], button = document.createElement("button");
                    button.innerText = item.text;
                    button.setAttribute("title", item.title);
                    button.className = item.className;
                    button.setAttribute("data-key", String(item.key));
                    buttonList.insertAdjacentElement("beforeend", button);
                }
                place.insertAdjacentElement("beforeend", buttonList);
            }
            else { // Polyfill for old browsers
                var html = "<div class=displayFlex>\n";
                for (var i = 0; i < options.length; i += 1) {
                    var item = options[i];
                    html += '<button title="' + item.title + '" class="' + item.className + '" data-key="' + item.key + '">' + item.text + "</button>\n";
                }
                html += "</div>";
                place.innerHTML += html;
            }
            return this;
        };
        VirtualKeyboard.prototype.virtualKeyboardCreatePart = function (id, virtualKeyboard) {
            var keyArea = View_1.View.getElementById1(id), shiftLock = this.shiftLock, numLock = this.numLock, cpcKey2Key = VirtualKeyboard.cpcKey2Key, buttons = keyArea.getElementsByTagName("button");
            if (!buttons.length) { // not yet created?
                for (var row = 0; row < virtualKeyboard.length; row += 1) {
                    var rowList = virtualKeyboard[row], optionsList = [];
                    for (var col = 0; col < rowList.length; col += 1) {
                        var cpcKeyEntry = void 0;
                        if (typeof rowList[col] === "number") {
                            cpcKeyEntry = {
                                key: rowList[col]
                            };
                        }
                        else { // object
                            cpcKeyEntry = rowList[col];
                        }
                        var cpcKey = numLock ? this.mapNumLockCpcKey(cpcKeyEntry.key) : cpcKeyEntry.key, keyEntry = cpcKey2Key[cpcKeyEntry.key], ascii = this.fnVirtualGetAscii(cpcKey, shiftLock, numLock), className = "kbdButton" + (cpcKeyEntry.style || keyEntry.style || "") + ((col === rowList.length - 1) ? " kbdNoRightMargin" : ""), options = {
                            key: cpcKey,
                            text: ascii.text,
                            title: ascii.title,
                            className: className
                        };
                        optionsList.push(options);
                    }
                    this.createButtonRow(id, optionsList);
                }
            }
        };
        VirtualKeyboard.prototype.virtualKeyboardCreate = function () {
            this.virtualKeyboardCreatePart("kbdAlpha" /* ViewID.kbdAlpha */, VirtualKeyboard.virtualKeyboardAlpha);
            this.virtualKeyboardCreatePart("kbdNum" /* ViewID.kbdNum */, VirtualKeyboard.virtualKeyboardNum);
        };
        VirtualKeyboard.prototype.virtualKeyboardAdaptKeys = function (shiftLock, numLock) {
            var keyArea = View_1.View.getElementById1("kbdAreaInner" /* ViewID.kbdAreaInner */), buttons = keyArea.getElementsByTagName("button"); // or: keyArea.childNodes and filter
            for (var i = 0; i < buttons.length; i += 1) {
                var button = buttons[i];
                var cpcKey = Number(button.getAttribute("data-key"));
                if (numLock) {
                    cpcKey = this.mapNumLockCpcKey(cpcKey);
                }
                var ascii = this.fnVirtualGetAscii(cpcKey, shiftLock, numLock);
                if (ascii.key !== button.innerText) {
                    button.innerText = ascii.text;
                    button.title = ascii.title;
                }
            }
        };
        VirtualKeyboard.prototype.fnVirtualGetPressedKey = function (cpcKey) {
            var key = VirtualKeyboard.cpcKey2Key[cpcKey];
            var pressedKey = "";
            if (key) {
                pressedKey = key.keys;
                if (pressedKey.indexOf(",") >= 0) { // maybe more
                    pressedKey = pressedKey.substring(0, pressedKey.indexOf(",")); // take the first
                }
            }
            return pressedKey;
        };
        VirtualKeyboard.prototype.onVirtualKeyboardKeydown = function (event) {
            var node = View_1.View.getEventTarget(event), cpcKey = node.getAttribute("data-key");
            if (Utils_1.Utils.debug > 1) {
                Utils_1.Utils.console.debug("onVirtualKeyboardKeydown: event", String(event), "type:", event.type, "title:", node.title, "cpcKey:", cpcKey);
            }
            if (cpcKey !== null) {
                var cpcKeyCode = Number(cpcKey);
                if (this.numLock) {
                    cpcKeyCode = this.mapNumLockCpcKey(cpcKeyCode);
                }
                var pressedKey = this.fnVirtualGetPressedKey(cpcKeyCode), ascii = this.fnVirtualGetAscii(cpcKeyCode, this.shiftLock || event.shiftKey, this.numLock);
                this.options.fnPressCpcKey(event, cpcKeyCode, pressedKey, ascii.key);
            }
            // A pointerdown event can also ended by pointerout when leaving the area
            if (this.eventNames.out) {
                this.options.view.addEventListener(this.eventNames.out, this.fnVirtualKeyboardKeyupOrKeyoutHandler, node);
            }
            event.preventDefault();
            return false;
        };
        VirtualKeyboard.prototype.fnVirtualKeyboardKeyupOrKeyout = function (event) {
            var node = View_1.View.getEventTarget(event), cpcKey = node.getAttribute("data-key");
            if (cpcKey !== null) {
                var cpcKeyCode = Number(cpcKey);
                if (this.numLock) {
                    cpcKeyCode = this.mapNumLockCpcKey(cpcKeyCode);
                }
                var pressedKey = this.fnVirtualGetPressedKey(cpcKeyCode), ascii = this.fnVirtualGetAscii(cpcKeyCode, this.shiftLock || event.shiftKey, this.numLock);
                this.options.fnReleaseCpcKey(event, cpcKeyCode, pressedKey, ascii.key);
                if (cpcKeyCode === 70) { // Caps Lock?
                    this.shiftLock = !this.shiftLock;
                    this.virtualKeyboardAdaptKeys(this.shiftLock, this.numLock);
                }
                else if (cpcKeyCode === 90) { // Num lock
                    this.numLock = !this.numLock;
                    this.virtualKeyboardAdaptKeys(this.shiftLock, this.numLock);
                }
            }
        };
        VirtualKeyboard.prototype.onVirtualKeyboardKeyupOrKeyout = function (event) {
            var node = View_1.View.getEventTarget(event);
            if (Utils_1.Utils.debug > 1) {
                Utils_1.Utils.console.debug("onVirtualKeyboardKeyupOrKeyout: event", String(event), "type:", event.type, "title:", node.title, "cpcKey:", node.getAttribute("data-key"));
            }
            this.fnVirtualKeyboardKeyupOrKeyout(event);
            if (this.eventNames.out) {
                this.options.view.removeEventListener(this.eventNames.out, this.fnVirtualKeyboardKeyupOrKeyoutHandler, node); // do not need out event any more for this key
            }
            event.preventDefault();
            return false;
        };
        VirtualKeyboard.keyIdentifier2Char = function (event) {
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
        VirtualKeyboard.prototype.onKeydownOrKeyup = function (event) {
            var key = event.key || VirtualKeyboard.keyIdentifier2Char(event) || "", // SliTaz web browser has not key but keyIdentifier (also in Keyboard)
            activeElement = window.document.activeElement;
            if (key === "Enter" || key === " ") { // enter or space
                var simPointerEvent = {
                    type: event.type,
                    target: activeElement,
                    preventDefault: function () {
                        // empty
                    }
                };
                if (event.type === "keydown") {
                    this.onVirtualKeyboardKeydown(simPointerEvent);
                }
                else if (event.type === "keyup") {
                    this.onVirtualKeyboardKeyupOrKeyout(simPointerEvent);
                }
                else {
                    Utils_1.Utils.console.error("onKeydownOrKeyup: Unknown type:", event.type);
                }
                event.preventDefault();
                return false;
            }
            return undefined;
        };
        VirtualKeyboard.cpcKey2Key = [
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
                // numLockCpcKey: 90 // Num lock
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
        /* eslint-disable array-element-newline */
        VirtualKeyboard.virtualKeyboardAlpha = [
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
        VirtualKeyboard.virtualKeyboardNum = [
            [10, 11, 3],
            [20, 12, 4],
            [13, 14, 5],
            [15, 0, 7],
            [8, 2, 1]
        ];
        return VirtualKeyboard;
    }());
    exports.VirtualKeyboard = VirtualKeyboard;
});
//# sourceMappingURL=VirtualKeyboard.js.map