// View.ts - View Module to access HTML DOM
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//
define(["require", "exports", "./Utils"], function (require, exports, Utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.View = void 0;
    var View = /** @class */ (function () {
        function View() {
            // drag...
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
        }
        View.getElementById1 = function (id) {
            var element = window.document.getElementById(id);
            if (!element) {
                throw new Error("Unknown " + id);
            }
            return element;
        };
        View.getElementByIdAs = function (id) {
            return View.getElementById1(id);
        };
        View.prototype.getHidden = function (id) {
            var element = View.getElementById1(id);
            return element.className.indexOf("displayNone") >= 0;
        };
        View.prototype.setHidden = function (id, hidden, display) {
            // optional display: block or flex or inherit
            var element = View.getElementById1(id), displayVisible = "display" + Utils_1.Utils.stringCapitalize(display || "block");
            if (hidden) {
                if (element.className.indexOf("displayNone") < 0) {
                    this.toggleClass(id, "displayNone");
                }
                if (element.className.indexOf(displayVisible) >= 0) {
                    this.toggleClass(id, displayVisible);
                }
            }
            else {
                if (element.className.indexOf("displayNone") >= 0) {
                    this.toggleClass(id, "displayNone");
                }
                if (element.className.indexOf(displayVisible) < 0) {
                    this.toggleClass(id, displayVisible);
                }
            }
            return this;
        };
        View.prototype.setDisabled = function (id, disabled) {
            var element = View.getElementByIdAs(id);
            element.disabled = disabled;
            return this;
        };
        View.prototype.toggleClass = function (id, className) {
            var element = View.getElementById1(id);
            var classes = element.className;
            var nameIndex = classes.indexOf(className);
            if (nameIndex === -1) {
                classes = classes.trim() + " " + className;
            }
            else {
                classes = classes.substring(0, nameIndex) + classes.substring(nameIndex + className.length + 1).trim();
            }
            element.className = classes;
        };
        View.prototype.getAreaValue = function (id) {
            var element = View.getElementByIdAs(id);
            return element.value;
        };
        View.prototype.setAreaValue = function (id, value) {
            var element = View.getElementByIdAs(id);
            element.value = value;
            return this;
        };
        View.prototype.getInputValue = function (id) {
            var element = View.getElementByIdAs(id);
            return element.value;
        };
        View.prototype.setInputValue = function (id, value) {
            var element = View.getElementByIdAs(id);
            element.value = value;
            return this;
        };
        View.prototype.getInputChecked = function (id) {
            var element = View.getElementByIdAs(id);
            return element.checked;
        };
        View.prototype.setInputChecked = function (id, checked) {
            var element = View.getElementByIdAs(id);
            element.checked = checked;
            return this;
        };
        View.prototype.setAreaInputList = function (id, inputs) {
            var element = View.getElementByIdAs(id), childNodes = element.childNodes;
            while (childNodes.length && childNodes[0].nodeType !== Node.ELEMENT_NODE) { // remove all non-element nodes
                element.removeChild(element.firstChild);
            }
            for (var i = 0; i < inputs.length; i += 1) {
                var item = inputs[i];
                var input = void 0, label = void 0;
                if (i * 2 >= childNodes.length) {
                    input = window.document.createElement("input");
                    input.type = "radio";
                    input.id = "galleryItem" + i;
                    input.name = "gallery";
                    input.value = item.value;
                    input.checked = item.checked;
                    label = window.document.createElement("label");
                    label.setAttribute("for", "galleryItem" + i);
                    label.setAttribute("style", 'background: url("' + item.imgUrl + '"); background-size: cover');
                    label.setAttribute("title", item.title);
                    element.appendChild(input);
                    element.appendChild(label);
                }
                else {
                    input = childNodes[i * 2];
                    if (input.value !== item.value) {
                        if (Utils_1.Utils.debug > 3) {
                            Utils_1.Utils.console.debug("setInputList: " + id + ": value changed for index " + i + ": " + item.value);
                        }
                        input.value = item.value;
                        label = childNodes[i * 2 + 1];
                        label.setAttribute("style", 'background: url("' + item.imgUrl + '");');
                        label.setAttribute("title", item.title);
                    }
                    if (input.checked !== item.checked) {
                        input.checked = item.checked;
                    }
                }
            }
            // remove additional items
            while (element.childElementCount > inputs.length * 2) {
                element.removeChild(element.lastChild);
            }
            return this;
        };
        View.prototype.setSelectOptions = function (id, options) {
            var element = View.getElementByIdAs(id), optionList = [], existingElements = element.length;
            // pre-create additional options
            for (var i = existingElements; i < options.length; i += 1) {
                var item = options[i], option = window.document.createElement("option");
                option.value = item.value;
                option.text = item.text;
                option.title = item.title;
                option.selected = item.selected; // multi-select
                optionList.push(option);
            }
            for (var i = 0; i < options.length; i += 1) {
                if (i >= existingElements) {
                    element.add(optionList[i - existingElements], null); // null needed for old FF 3.x
                }
                else {
                    var item = options[i], option = element.options[i];
                    if (option.value !== item.value) {
                        option.value = item.value;
                    }
                    if (option.text !== item.text) {
                        if (Utils_1.Utils.debug > 3) {
                            Utils_1.Utils.console.debug("setSelectOptions: " + id + ": text changed for index " + i + ": " + item.text);
                        }
                        option.text = item.text;
                        option.title = item.title;
                    }
                    option.selected = item.selected; // multi-select
                }
            }
            // remove additional select options
            element.options.length = options.length;
            return this;
        };
        View.prototype.getSelectOptions = function (id) {
            var element = View.getElementByIdAs(id), elementOptions = element.options, options = [];
            for (var i = 0; i < elementOptions.length; i += 1) {
                var elementOption = elementOptions[i];
                options.push({
                    value: elementOption.value,
                    text: elementOption.text,
                    title: elementOption.title,
                    selected: elementOption.selected
                });
            }
            return options;
        };
        View.prototype.getSelectValue = function (id) {
            var element = View.getElementByIdAs(id);
            return element.value;
        };
        View.prototype.setSelectValue = function (id, value) {
            var element = View.getElementByIdAs(id);
            if (value) {
                element.value = value;
            }
            return this;
        };
        View.prototype.setSelectTitleFromSelectedOption = function (id) {
            var element = View.getElementByIdAs(id), selectedIndex = element.selectedIndex, title = (selectedIndex >= 0) ? element.options[selectedIndex].title : "";
            element.title = title;
            return this;
        };
        View.prototype.setAreaScrollTop = function (id, scrollTop) {
            var element = View.getElementByIdAs(id);
            if (scrollTop === undefined) {
                scrollTop = element.scrollHeight;
            }
            element.scrollTop = scrollTop;
            return this;
        };
        View.prototype.setSelectionRange = function (textarea, selectionStart, selectionEnd) {
            // First scroll selection region to view
            var fullText = textarea.value;
            textarea.value = fullText.substring(0, selectionEnd);
            // For some unknown reason, you must store the scollHeight to a variable before setting the textarea value. Otherwise it won't work for long strings
            var scrollHeight = textarea.scrollHeight;
            textarea.value = fullText;
            var textareaHeight = textarea.clientHeight;
            var scrollTop = scrollHeight;
            if (scrollTop > textareaHeight) {
                // scroll selection to center of textarea
                scrollTop -= textareaHeight / 2;
            }
            else {
                scrollTop = 0;
            }
            textarea.scrollTop = scrollTop;
            // Continue to set selection range
            textarea.setSelectionRange(selectionStart, selectionEnd);
            return this;
        };
        View.prototype.setAreaSelection = function (id, pos, endPos) {
            var element = View.getElementByIdAs(id);
            if (element.selectionStart !== undefined) {
                if (element.setSelectionRange !== undefined) {
                    element.focus(); // not needed for scrolling but we want to see the selected text
                    this.setSelectionRange(element, pos, endPos);
                }
                else {
                    element.focus();
                    element.selectionStart = pos;
                    element.selectionEnd = endPos;
                }
            }
            return this;
        };
        View.prototype.addEventListener = function (type, eventListener, id) {
            if (Utils_1.Utils.debug) {
                Utils_1.Utils.console.debug("addEventListener: type=" + type + ", eventHandler=" + eventListener + ", id=" + id);
            }
            if (id) {
                var element = View.getElementById1(id);
                element.addEventListener(type, eventListener, false);
            }
            else {
                window.document.addEventListener(type, eventListener, false);
            }
            return this;
        };
        View.prototype.removeEventListener = function (type, eventListener, id) {
            if (Utils_1.Utils.debug) {
                Utils_1.Utils.console.debug("removeEventListener: type=" + type + ", eventHandler=" + eventListener + ", id=" + id);
            }
            if (id) {
                var element = View.getElementById1(id);
                element.removeEventListener(type, eventListener, false);
            }
            else {
                window.document.removeEventListener(type, eventListener, false);
            }
            return this;
        };
        View.getEventTarget = function (event) {
            var target = event.target || event.srcElement; // target, not currentTarget; srcElement for IE8
            if (!target) {
                Utils_1.Utils.console.error("getEventTarget: Undefined event target: " + target);
            }
            return target;
        };
        View.requestFullscreenForId = function (id) {
            var element = View.getElementById1(id), anyEl = element, requestMethod = element.requestFullscreen || anyEl.webkitRequestFullscreen || anyEl.mozRequestFullscreen || anyEl.msRequestFullscreen;
            if (requestMethod) {
                requestMethod.call(element); // can we ALLOW_KEYBOARD_INPUT?
            }
            else if (typeof window.ActiveXObject !== "undefined") { // older IE
                var wscript = new window.ActiveXObject("WScript.Shell");
                if (wscript !== null) {
                    wscript.SendKeys("{F11}"); // eslint-disable-line new-cap
                }
            }
            else {
                return false;
            }
            return true;
        };
        // https://blog.logrocket.com/programmatic-file-downloads-in-the-browser-9a5186298d5c/
        View.fnDownloadBlob = function (data, filename) {
            if (typeof Blob === "undefined") {
                Utils_1.Utils.console.warn("fnDownloadBlob: Blob undefined");
                return;
            }
            var data8 = Utils_1.Utils.string2Uint8Array(data), type = "octet/stream", blob = new Blob([data8.buffer], {
                type: type
            });
            if (window.navigator && window.navigator.msSaveOrOpenBlob) { // IE11 support
                window.navigator.msSaveOrOpenBlob(blob, filename);
                return;
            }
            var url = URL.createObjectURL(blob), a = document.createElement("a"), clickHandler = function () {
                setTimeout(function () {
                    URL.revokeObjectURL(url);
                    a.removeEventListener("click", clickHandler);
                }, 150);
            };
            a.href = url;
            a.download = filename || "download";
            a.addEventListener("click", clickHandler, false);
            a.click();
        };
        View.prototype.fnAttachPointerEvents = function (id, fnDown, fnMove, fnUp) {
            var area = View.getElementById1(id);
            var eventNames;
            if (window.PointerEvent) {
                eventNames = View.pointerEventNames;
            }
            else if ("ontouchstart" in window || navigator.maxTouchPoints) {
                eventNames = View.touchEventNames;
            }
            else {
                eventNames = View.mouseEventNames;
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
        // based on https://www.kirupa.com/html5/drag.htm
        View.prototype.dragInit = function (containerId, itemId) {
            var drag = this.dragInfo;
            drag.dragItem = View.getElementById1(itemId);
            drag.active = false;
            drag.xOffset = 0;
            drag.yOffset = 0;
            this.fnAttachPointerEvents(containerId, this.dragStart.bind(this), this.drag.bind(this), this.dragEnd.bind(this));
        };
        View.prototype.dragStart = function (event) {
            var node = View.getEventTarget(event), parent = node.parentElement ? node.parentElement.parentElement : null, drag = this.dragInfo;
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
        View.prototype.dragEnd = function ( /* event */) {
            var drag = this.dragInfo;
            drag.initialX = drag.currentX;
            drag.initialY = drag.currentY;
            drag.active = false;
        };
        View.prototype.setDragTranslate = function (xPos, yPos, el) {
            el.style.transform = "translate3d(" + xPos + "px, " + yPos + "px, 0)";
        };
        View.prototype.drag = function (event) {
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
                    this.setDragTranslate(drag.currentX, drag.currentY, drag.dragItem);
                }
            }
        };
        View.pointerEventNames = {
            down: "pointerdown",
            move: "pointermove",
            up: "pointerup",
            cancel: "pointercancel",
            out: "pointerout",
            type: "pointer"
        };
        View.touchEventNames = {
            down: "touchstart",
            move: "touchmove",
            up: "touchend",
            cancel: "touchcancel",
            out: "",
            type: "touch"
        };
        View.mouseEventNames = {
            down: "mousedown",
            move: "mousemove",
            up: "mouseup",
            cancel: "",
            out: "mouseout",
            type: "mouse"
        };
        return View;
    }());
    exports.View = View;
});
//# sourceMappingURL=View.js.map