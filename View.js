"use strict";
// View.ts - View Module to access HTML DOM
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//
Object.defineProperty(exports, "__esModule", { value: true });
exports.View = void 0;
var Utils_1 = require("./Utils");
var View = /** @class */ (function () {
    function View() {
    }
    /*
    constructor() {
    }
    */
    View.getElementById1 = function (sId) {
        var element = document.getElementById(sId);
        if (!element) {
            throw new Error("Unknown " + sId);
        }
        return element;
    };
    View.prototype.getHidden = function (sId) {
        var element = View.getElementById1(sId);
        return element.className.indexOf("displayNone") >= 0;
    };
    View.prototype.setHidden = function (sId, bHidden, sDisplay) {
        // optional sDisplay: block or flex
        var element = View.getElementById1(sId), sDisplayVisible = "display" + Utils_1.Utils.stringCapitalize(sDisplay || "block");
        if (bHidden) {
            if (element.className.indexOf("displayNone") < 0) {
                this.toggleClass(sId, "displayNone");
            }
            if (element.className.indexOf(sDisplayVisible) >= 0) {
                this.toggleClass(sId, sDisplayVisible);
            }
        }
        else {
            if (element.className.indexOf("displayNone") >= 0) {
                this.toggleClass(sId, "displayNone");
            }
            if (element.className.indexOf(sDisplayVisible) < 0) {
                this.toggleClass(sId, sDisplayVisible);
            }
        }
        return this;
    };
    View.prototype.setDisabled = function (sId, bDisabled) {
        var element = View.getElementById1(sId);
        element.disabled = bDisabled;
        return this;
    };
    View.prototype.toggleClass = function (sId, sClassName) {
        var element = View.getElementById1(sId);
        var sClasses = element.className;
        var iNameIndex = sClasses.indexOf(sClassName);
        if (iNameIndex === -1) {
            sClasses += " " + sClassName;
        }
        else {
            sClasses = sClasses.substr(0, iNameIndex) + sClasses.substr(iNameIndex + sClassName.length + 1);
        }
        element.className = sClasses;
    };
    View.prototype.getAreaValue = function (sId) {
        var element = View.getElementById1(sId);
        return element.value;
    };
    View.prototype.setAreaValue = function (sId, sValue) {
        var element = View.getElementById1(sId);
        element.value = sValue;
        return this;
    };
    View.prototype.setSelectOptions = function (sId, aOptions) {
        var element = View.getElementById1(sId);
        for (var i = 0; i < aOptions.length; i += 1) {
            var oItem = aOptions[i];
            var option = void 0;
            if (i >= element.length) {
                option = document.createElement("option");
                option.value = oItem.value;
                option.text = oItem.text;
                option.title = oItem.title;
                option.selected = oItem.selected; // multi-select
                element.add(option, null); // null needed for old FF 3.x
            }
            else {
                option = element.options[i];
                if (option.value !== oItem.value) {
                    option.value = oItem.value;
                }
                if (option.text !== oItem.text) {
                    if (Utils_1.Utils.debug > 3) {
                        Utils_1.Utils.console.debug("setSelectOptions: " + sId + ": text changed for index " + i + ": " + oItem.text);
                    }
                    option.text = oItem.text;
                    option.title = oItem.title;
                }
                option.selected = oItem.selected; // multi-select
            }
        }
        // remove additional select options
        element.options.length = aOptions.length;
        return this;
    };
    View.prototype.getSelectValue = function (sId) {
        var element = View.getElementById1(sId);
        return element.value;
    };
    View.prototype.setSelectValue = function (sId, sValue) {
        var element = View.getElementById1(sId);
        if (sValue) {
            element.value = sValue;
        }
        return this;
    };
    View.prototype.setSelectTitleFromSelectedOption = function (sId) {
        var element = View.getElementById1(sId), iSelectedIndex = element.selectedIndex, sTitle = (iSelectedIndex >= 0) ? element.options[iSelectedIndex].title : "";
        element.title = sTitle;
        return this;
    };
    View.prototype.setAreaScrollTop = function (sId, iScrollTop) {
        var element = View.getElementById1(sId);
        if (iScrollTop === undefined) {
            iScrollTop = element.scrollHeight;
        }
        element.scrollTop = iScrollTop;
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
    View.prototype.setAreaSelection = function (sId, iPos, iEndPos) {
        var element = View.getElementById1(sId);
        if (element.selectionStart !== undefined) {
            if (element.setSelectionRange !== undefined) {
                element.focus(); // not needed for scrolling but we want to see the selected text
                this.setSelectionRange(element, iPos, iEndPos);
            }
            else {
                element.focus();
                element.selectionStart = iPos;
                element.selectionEnd = iEndPos;
            }
        }
        return this;
    };
    View.prototype.attachEventHandler = function (sType, eventHandler) {
        if (Utils_1.Utils.debug) {
            Utils_1.Utils.console.debug("attachEventHandler: type=" + sType + ", eventHandler=" + ((eventHandler !== undefined) ? "[?]" : null));
        }
        document.addEventListener(sType, eventHandler, false);
        return this;
    };
    return View;
}());
exports.View = View;
//# sourceMappingURL=View.js.map