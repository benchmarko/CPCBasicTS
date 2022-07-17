// CommonEventHandler.ts - Common event handler for browser events
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
define(["require", "exports", "./Utils", "./View"], function (require, exports, Utils_1, View_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CommonEventHandler = void 0;
    var CommonEventHandler = /** @class */ (function () {
        function CommonEventHandler(model, view, controller) {
            this.fnUserAction = undefined;
            /* eslint-disable no-invalid-this */
            this.handlers = {
                onSpecialButtonClick: this.onSpecialButtonClick,
                onInputButtonClick: this.onInputButtonClick,
                onInp2ButtonClick: this.onInp2ButtonClick,
                onOutputButtonClick: this.onOutputButtonClick,
                onResultButtonClick: this.onResultButtonClick,
                onTextButtonClick: this.onTextButtonClick,
                onVariableButtonClick: this.onVariableButtonClick,
                onCpcButtonClick: this.onCpcButtonClick,
                onConvertButtonClick: this.onConvertButtonClick,
                onKbdButtonClick: this.onKbdButtonClick,
                onKbdLayoutButtonClick: this.onKbdLayoutButtonClick,
                onConsoleButtonClick: this.onConsoleButtonClick,
                onParseButtonClick: this.onParseButtonClick,
                onRenumButtonClick: this.onRenumButtonClick,
                onPrettyButtonClick: this.onPrettyButtonClick,
                onUndoButtonClick: this.onUndoButtonClick,
                onRedoButtonClick: this.onRedoButtonClick,
                onDownloadButtonClick: this.onDownloadButtonClick,
                onRunButtonClick: this.onRunButtonClick,
                onStopButtonClick: this.onStopButtonClick,
                onContinueButtonClick: this.onContinueButtonClick,
                onResetButtonClick: this.onResetButtonClick,
                onParseRunButtonClick: this.onParseRunButtonClick,
                onHelpButtonClick: CommonEventHandler.onHelpButtonClick,
                onInputTextClick: CommonEventHandler.onNothing,
                onOutputTextClick: CommonEventHandler.onNothing,
                onResultTextClick: CommonEventHandler.onNothing,
                onVarTextClick: CommonEventHandler.onNothing,
                onOutputTextChange: this.onOutputTextChange,
                onReloadButtonClick: this.onReloadButtonClick,
                onDatabaseSelectChange: this.onDatabaseSelectChange,
                onExampleSelectChange: this.onExampleSelectChange,
                onVarSelectChange: this.onVarSelectChange,
                onKbdLayoutSelectChange: this.onKbdLayoutSelectChange,
                onVarTextChange: this.onVarTextChange,
                onScreenshotButtonClick: this.onScreenshotButtonClick,
                onEnterButtonClick: this.onEnterButtonClick,
                onSoundButtonClick: this.onSoundButtonClick,
                onCpcCanvasClick: this.onCpcCanvasClick,
                onWindowClick: this.onWindowClick
            };
            this.model = model;
            this.view = view;
            this.controller = controller;
        }
        CommonEventHandler.prototype.toogleHidden = function (id, prop, display) {
            var visible = !this.model.getProperty(prop);
            this.model.setProperty(prop, visible);
            this.view.setHidden(id, !visible, display);
            return visible;
        };
        CommonEventHandler.prototype.fnSetUserAction = function (fnAction) {
            this.fnUserAction = fnAction;
        };
        CommonEventHandler.prototype.onSpecialButtonClick = function () {
            this.toogleHidden("specialArea", "showSpecial");
        };
        CommonEventHandler.prototype.onInputButtonClick = function () {
            this.toogleHidden("inputArea", "showInput");
        };
        CommonEventHandler.prototype.onInp2ButtonClick = function () {
            this.toogleHidden("inp2Area", "showInp2");
        };
        CommonEventHandler.prototype.onOutputButtonClick = function () {
            this.toogleHidden("outputArea", "showOutput");
        };
        CommonEventHandler.prototype.onResultButtonClick = function () {
            this.toogleHidden("resultArea", "showResult");
        };
        CommonEventHandler.prototype.onTextButtonClick = function () {
            this.toogleHidden("textArea", "showText");
        };
        CommonEventHandler.prototype.onVariableButtonClick = function () {
            this.toogleHidden("variableArea", "showVariable");
        };
        CommonEventHandler.prototype.onCpcButtonClick = function () {
            if (this.toogleHidden("cpcArea", "showCpc")) {
                this.controller.startUpdateCanvas();
            }
            else {
                this.controller.stopUpdateCanvas();
            }
        };
        CommonEventHandler.prototype.onConvertButtonClick = function () {
            this.toogleHidden("convertArea", "showConvert", "flex");
        };
        CommonEventHandler.prototype.onKbdButtonClick = function () {
            if (this.toogleHidden("kbdArea", "showKbd", "flex")) {
                if (this.view.getHidden("kbdArea")) { // on old browsers, display "flex" is not available, so set "block" if still hidden
                    this.view.setHidden("kbdArea", false);
                }
                this.controller.virtualKeyboardCreate(); // maybe draw it
            }
        };
        CommonEventHandler.prototype.onKbdLayoutButtonClick = function () {
            this.toogleHidden("kbdLayoutArea", "showKbdLayout");
        };
        CommonEventHandler.prototype.onConsoleButtonClick = function () {
            this.toogleHidden("consoleArea", "showConsole");
        };
        CommonEventHandler.prototype.onParseButtonClick = function () {
            this.controller.startParse();
        };
        CommonEventHandler.prototype.onRenumButtonClick = function () {
            this.controller.startRenum();
        };
        CommonEventHandler.prototype.onPrettyButtonClick = function () {
            this.controller.fnPretty();
        };
        CommonEventHandler.prototype.fnUpdateAreaText = function (input) {
            this.controller.setInputText(input, true);
            this.view.setAreaValue("outputText", "");
        };
        CommonEventHandler.prototype.onUndoButtonClick = function () {
            var input = this.controller.undoStackElement();
            this.fnUpdateAreaText(input);
        };
        CommonEventHandler.prototype.onRedoButtonClick = function () {
            var input = this.controller.redoStackElement();
            this.fnUpdateAreaText(input);
        };
        CommonEventHandler.prototype.onDownloadButtonClick = function () {
            this.controller.fnDownload();
        };
        CommonEventHandler.prototype.onRunButtonClick = function () {
            this.controller.startRun();
        };
        CommonEventHandler.prototype.onStopButtonClick = function () {
            this.controller.startBreak();
        };
        CommonEventHandler.prototype.onContinueButtonClick = function (event) {
            this.controller.startContinue();
            this.onCpcCanvasClick(event);
        };
        CommonEventHandler.prototype.onResetButtonClick = function () {
            this.controller.startReset();
        };
        CommonEventHandler.prototype.onParseRunButtonClick = function (event) {
            this.controller.startParseRun();
            this.onCpcCanvasClick(event);
        };
        CommonEventHandler.onHelpButtonClick = function () {
            window.open("https://github.com/benchmarko/CPCBasicTS/#readme");
        };
        CommonEventHandler.onNothing = function () {
            // nothing
        };
        CommonEventHandler.prototype.onOutputTextChange = function () {
            this.controller.invalidateScript();
        };
        CommonEventHandler.encodeUriParam = function (params) {
            var parts = [];
            for (var key in params) {
                if (params.hasOwnProperty(key)) {
                    var value = params[key];
                    parts[parts.length] = encodeURIComponent(key) + "=" + encodeURIComponent((value === null) ? "" : value);
                }
            }
            return parts.join("&");
        };
        CommonEventHandler.prototype.onReloadButtonClick = function () {
            var changed = this.model.getChangedProperties();
            var paras = CommonEventHandler.encodeUriParam(changed);
            paras = paras.replace(/%2[Ff]/g, "/"); // unescape %2F -> /
            window.location.search = "?" + paras;
        };
        CommonEventHandler.prototype.onDatabaseSelectChange = function () {
            this.controller.onDatabaseSelectChange();
        };
        CommonEventHandler.prototype.onExampleSelectChange = function () {
            this.controller.onExampleSelectChange();
        };
        CommonEventHandler.prototype.onVarSelectChange = function () {
            var par = this.view.getSelectValue("varSelect"), value = this.controller.getVariable(par), valueString = (value !== undefined) ? String(value) : "";
            this.view.setAreaValue("varText", valueString);
        };
        CommonEventHandler.prototype.onKbdLayoutSelectChange = function () {
            var value = this.view.getSelectValue("kbdLayoutSelect");
            this.model.setProperty("kbdLayout", value);
            this.view.setSelectTitleFromSelectedOption("kbdLayoutSelect");
            this.view.setHidden("kbdAlpha", value === "num");
            this.view.setHidden("kbdNum", value === "alpha");
        };
        CommonEventHandler.prototype.onVarTextChange = function () {
            this.controller.changeVariable();
        };
        CommonEventHandler.prototype.onScreenshotButtonClick = function () {
            var example = this.view.getSelectValue("exampleSelect"), image = this.controller.startScreenshot(), link = View_1.View.getElementById1("screenshotLink"), name = example + ".png";
            link.setAttribute("download", name);
            link.setAttribute("href", image);
            link.click();
        };
        CommonEventHandler.prototype.onEnterButtonClick = function () {
            this.controller.startEnter();
        };
        CommonEventHandler.prototype.onSoundButtonClick = function () {
            this.model.setProperty("sound", !this.model.getProperty("sound"));
            this.controller.setSoundActive();
        };
        CommonEventHandler.prototype.onCpcCanvasClick = function (event) {
            this.controller.onCpcCanvasClick(event);
        };
        CommonEventHandler.prototype.onWindowClick = function (event) {
            this.controller.onWindowClick(event);
        };
        /* eslint-enable no-invalid-this */
        CommonEventHandler.prototype.handleEvent = function (event) {
            var target = event.target, id = (target) ? target.getAttribute("id") : String(target), type = event.type; // click or change
            if (this.fnUserAction) {
                this.fnUserAction(event, id);
            }
            if (id) {
                if (!target.disabled) { // check needed for IE which also fires for disabled buttons
                    var handler = "on" + Utils_1.Utils.stringCapitalize(id) + Utils_1.Utils.stringCapitalize(type);
                    if (Utils_1.Utils.debug) {
                        Utils_1.Utils.console.debug("fnCommonEventHandler: handler=" + handler);
                    }
                    if (handler in this.handlers) {
                        this.handlers[handler].call(this, event);
                    }
                    else if (!handler.endsWith("SelectClick") && !handler.endsWith("InputClick")) { // do not print all messages
                        Utils_1.Utils.console.log("Event handler not found:", handler);
                    }
                }
            }
            else if (target.getAttribute("data-key") === null) { // not for keyboard buttons
                if (Utils_1.Utils.debug) {
                    Utils_1.Utils.console.debug("Event handler for", type, "unknown target:", target.tagName, target.id);
                }
            }
            if (type === "click") { // special
                if (id !== "cpcCanvas") {
                    this.onWindowClick(event);
                }
            }
        };
        return CommonEventHandler;
    }());
    exports.CommonEventHandler = CommonEventHandler;
});
//# sourceMappingURL=CommonEventHandler.js.map