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
            /* eslint-enable array-element-newline */
            this.dragInfo = {
                dragItem: undefined,
                active: false,
                xOffset: 0,
                yOffset: 0,
                initialX: 0,
                initialY: 0,
                currentX: 0,
                currentY: 0
            };
            this.options = {
                fnPressCpcKey: options.fnPressCpcKey,
                fnReleaseCpcKey: options.fnReleaseCpcKey
            };
            var eventNames = this.fnAttachPointerEvents("kbdArea", this.onVirtualKeyboardKeydown.bind(this), undefined, this.onVirtualKeyboardKeyup.bind(this));
            if (eventNames.out) {
                this.pointerOutEvent = eventNames.out;
                this.fnVirtualKeyout = this.onVirtualKeyboardKeyout.bind(this);
            }
            this.dragInit("pageBody", "kbdAreaBox");
            this.virtualKeyboardCreate();
        }
        VirtualKeyboard.prototype.fnAttachPointerEvents = function (id, fnDown, fnMove, fnUp) {
            var area = View_1.View.getElementById1(id);
            var eventNames;
            if (window.PointerEvent) {
                eventNames = VirtualKeyboard.pointerEventNames;
            }
            else if ("ontouchstart" in window || navigator.maxTouchPoints) {
                eventNames = VirtualKeyboard.touchEventNames;
            }
            else {
                eventNames = VirtualKeyboard.mouseEventNames;
            }
            if (Utils_1.Utils.debug > 0) {
                Utils_1.Utils.console.log("fnAttachPointerEvents: Using", eventNames.type, "events");
            }
            if (fnDown) {
                area.addEventListener(eventNames.down, fnDown, false); // +clicked for pointer, touch?
            }
            if (fnMove) {
                area.addEventListener(eventNames.move, fnMove, false);
            }
            if (fnUp) {
                area.addEventListener(eventNames.up, fnUp, false);
                if (eventNames.cancel) {
                    area.addEventListener(eventNames.cancel, fnUp, false);
                }
            }
            return eventNames;
        };
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
            this.virtualKeyboardCreatePart("kbdAlpha", VirtualKeyboard.virtualKeyboardAlpha);
            this.virtualKeyboardCreatePart("kbdNum", VirtualKeyboard.virtualKeyboardNum);
        };
        VirtualKeyboard.prototype.virtualKeyboardAdaptKeys = function (shiftLock, numLock) {
            var keyArea = View_1.View.getElementById1("kbdArea"), buttons = keyArea.getElementsByTagName("button"); // or: keyArea.childNodes and filter
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
            if (this.pointerOutEvent && this.fnVirtualKeyout) {
                node.addEventListener(this.pointerOutEvent, this.fnVirtualKeyout, false);
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
        VirtualKeyboard.prototype.onVirtualKeyboardKeyup = function (event) {
            var node = View_1.View.getEventTarget(event);
            if (Utils_1.Utils.debug > 1) {
                Utils_1.Utils.console.debug("onVirtualKeyboardKeyup: event", String(event), "type:", event.type, "title:", node.title, "cpcKey:", node.getAttribute("data-key"));
            }
            this.fnVirtualKeyboardKeyupOrKeyout(event);
            if (this.pointerOutEvent && this.fnVirtualKeyout) {
                node.removeEventListener(this.pointerOutEvent, this.fnVirtualKeyout); // do not need out event any more
            }
            event.preventDefault();
            return false;
        };
        VirtualKeyboard.prototype.onVirtualKeyboardKeyout = function (event) {
            var node = View_1.View.getEventTarget(event);
            if (Utils_1.Utils.debug > 1) {
                Utils_1.Utils.console.debug("onVirtualKeyboardKeyout: event=", event);
            }
            this.fnVirtualKeyboardKeyupOrKeyout(event);
            if (this.pointerOutEvent && this.fnVirtualKeyout) {
                node.removeEventListener(this.pointerOutEvent, this.fnVirtualKeyout);
            }
            event.preventDefault();
            return false;
        };
        // based on https://www.kirupa.com/html5/drag.htm
        VirtualKeyboard.prototype.dragInit = function (containerId, itemId) {
            var drag = this.dragInfo;
            drag.dragItem = View_1.View.getElementById1(itemId);
            drag.active = false;
            drag.xOffset = 0;
            drag.yOffset = 0;
            this.fnAttachPointerEvents(containerId, this.dragStart.bind(this), this.drag.bind(this), this.dragEnd.bind(this));
        };
        VirtualKeyboard.prototype.dragStart = function (event) {
            var node = View_1.View.getEventTarget(event), parent = node.parentElement ? node.parentElement.parentElement : null, drag = this.dragInfo;
            if (node === drag.dragItem || parent === drag.dragItem) {
                if (event.type === "touchstart") {
                    var touchEvent = event;
                    drag.initialX = touchEvent.touches[0].clientX - drag.xOffset;
                    drag.initialY = touchEvent.touches[0].clientY - drag.yOffset;
                }
                else {
                    var dragEvent = event;
                    drag.initialX = dragEvent.clientX - drag.xOffset;
                    drag.initialY = dragEvent.clientY - drag.yOffset;
                }
                drag.active = true;
            }
        };
        VirtualKeyboard.prototype.dragEnd = function ( /* event */) {
            var drag = this.dragInfo;
            drag.initialX = drag.currentX;
            drag.initialY = drag.currentY;
            drag.active = false;
        };
        VirtualKeyboard.prototype.setTranslate = function (xPos, yPos, el) {
            el.style.transform = "translate3d(" + xPos + "px, " + yPos + "px, 0)";
        };
        VirtualKeyboard.prototype.drag = function (event) {
            var drag = this.dragInfo;
            if (drag.active) {
                event.preventDefault();
                if (event.type === "touchmove") {
                    var touchEvent = event;
                    drag.currentX = touchEvent.touches[0].clientX - drag.initialX;
                    drag.currentY = touchEvent.touches[0].clientY - drag.initialY;
                }
                else {
                    var dragEvent = event;
                    drag.currentX = dragEvent.clientX - drag.initialX;
                    drag.currentY = dragEvent.clientY - drag.initialY;
                }
                drag.xOffset = drag.currentX;
                drag.yOffset = drag.currentY;
                if (drag.dragItem) {
                    this.setTranslate(drag.currentX, drag.currentY, drag.dragItem);
                }
            }
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
        VirtualKeyboard.pointerEventNames = {
            down: "pointerdown",
            move: "pointermove",
            up: "pointerup",
            cancel: "pointercancel",
            out: "pointerout",
            type: "pointer"
        };
        VirtualKeyboard.touchEventNames = {
            down: "touchstart",
            move: "touchmove",
            up: "touchend",
            cancel: "touchcancel",
            out: "",
            type: "touch"
        };
        VirtualKeyboard.mouseEventNames = {
            down: "mousedown",
            move: "mousemove",
            up: "mouseup",
            cancel: "",
            out: "mouseout",
            type: "mouse"
        };
        return VirtualKeyboard;
    }());
    exports.VirtualKeyboard = VirtualKeyboard;
});
//# sourceMappingURL=VirtualKeyboard.js.map