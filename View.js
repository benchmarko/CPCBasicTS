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
        /*
        getInputDisabled(id: string): boolean { // eslint-disable-line class-methods-use-this
            const element = View.getElementByIdAs<HTMLInputElement>(id);
    
            return element.disabled;
        }
        setInputDisabled(id: string, disabled: boolean): this {
            const element = View.getElementByIdAs<HTMLInputElement>(id);
    
            element.disabled = disabled;
            return this;
        }
        */
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
            var element = View.getElementByIdAs(id);
            for (var i = 0; i < options.length; i += 1) {
                var item = options[i];
                var option = void 0;
                if (i >= element.length) {
                    option = window.document.createElement("option");
                    option.value = item.value;
                    option.text = item.text;
                    option.title = item.title;
                    option.selected = item.selected; // multi-select
                    element.add(option, null); // null needed for old FF 3.x
                }
                else {
                    option = element.options[i];
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
        View.prototype.attachEventHandler = function (type, eventHandler) {
            if (Utils_1.Utils.debug) {
                Utils_1.Utils.console.debug("attachEventHandler: type=" + type + ", eventHandler=" + ((eventHandler !== undefined) ? "[?]" : null));
            }
            window.document.addEventListener(type, eventHandler, false);
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
            //parameter = anyEl.webkitRequestFullscreen ? (Element as any).ALLOW_KEYBOARD_INPUT : undefined; // does this work?
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
        return View;
    }());
    exports.View = View;
});
//# sourceMappingURL=View.js.map