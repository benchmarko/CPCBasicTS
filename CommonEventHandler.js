"use strict";
// CommonEventHandler.ts - Common event handler for browser events
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommonEventHandler = void 0;
var Utils_1 = require("./Utils");
var View_1 = require("./View");
var CommonEventHandler = /** @class */ (function () {
    function CommonEventHandler(oModel, oView, oController) {
        this.fnUserAction = undefined;
        /* eslint-disable no-invalid-this */
        this.mHandlers = {
            onSpecialButtonClick: this.onSpecialButtonClick,
            onInputButtonClick: this.onInputButtonClick,
            onInp2ButtonClick: this.onInp2ButtonClick,
            onOutputButtonClick: this.onOutputButtonClick,
            onResultButtonClick: this.onResultButtonClick,
            onTextButtonClick: this.onTextButtonClick,
            onVariableButtonClick: this.onVariableButtonClick,
            onCpcButtonClick: this.onCpcButtonClick,
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
        this.model = oModel;
        this.view = oView;
        this.controller = oController;
    }
    CommonEventHandler.prototype.toogleHidden = function (sId, sProp, sDisplay) {
        var bVisible = !this.model.getProperty(sProp);
        this.model.setProperty(sProp, bVisible);
        this.view.setHidden(sId, !bVisible, sDisplay);
        return bVisible;
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
    CommonEventHandler.prototype.fnUpdateAreaText = function (sInput) {
        this.controller.setInputText(sInput, true);
        this.view.setAreaValue("outputText", "");
    };
    CommonEventHandler.prototype.onUndoButtonClick = function () {
        var sInput = this.controller.undoStackElement();
        this.fnUpdateAreaText(sInput);
    };
    CommonEventHandler.prototype.onRedoButtonClick = function () {
        var sInput = this.controller.redoStackElement();
        this.fnUpdateAreaText(sInput);
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
        var aParts = [];
        for (var sKey in params) {
            if (params.hasOwnProperty(sKey)) {
                var sValue = params[sKey];
                aParts[aParts.length] = encodeURIComponent(sKey) + "=" + encodeURIComponent((sValue === null) ? "" : sValue);
            }
        }
        return aParts.join("&");
    };
    CommonEventHandler.prototype.onReloadButtonClick = function () {
        var oChanged = this.model.getChangedProperties();
        var sParas = CommonEventHandler.encodeUriParam(oChanged);
        sParas = sParas.replace(/%2[Ff]/g, "/"); // unescape %2F -> /
        window.location.search = "?" + sParas;
    };
    CommonEventHandler.prototype.onDatabaseSelectChange = function () {
        this.controller.onDatabaseSelectChange();
    };
    CommonEventHandler.prototype.onExampleSelectChange = function () {
        this.controller.onExampleSelectChange();
    };
    CommonEventHandler.prototype.onVarSelectChange = function () {
        var sPar = this.view.getSelectValue("varSelect"), value = this.controller.getVariable(sPar), sValue = (value !== undefined) ? String(value) : "";
        this.view.setAreaValue("varText", sValue);
    };
    CommonEventHandler.prototype.onKbdLayoutSelectChange = function () {
        var sValue = this.view.getSelectValue("kbdLayoutSelect");
        this.model.setProperty("kbdLayout", sValue);
        this.view.setSelectTitleFromSelectedOption("kbdLayoutSelect");
        this.view.setHidden("kbdAlpha", sValue === "num");
        this.view.setHidden("kbdNum", sValue === "alpha");
    };
    CommonEventHandler.prototype.onVarTextChange = function () {
        this.controller.changeVariable();
    };
    CommonEventHandler.prototype.onScreenshotButtonClick = function () {
        var sExample = this.view.getSelectValue("exampleSelect"), image = this.controller.startScreenshot(), link = View_1.View.getElementById1("screenshotLink"), sName = sExample + ".png";
        link.setAttribute("download", sName);
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
        var oTarget = event.target, sId = (oTarget) ? oTarget.getAttribute("id") : String(oTarget), sType = event.type; // click or change
        if (this.fnUserAction) {
            this.fnUserAction(event, sId);
        }
        if (sId) {
            if (!oTarget.disabled) { // check needed for IE which also fires for disabled buttons
                var sHandler = "on" + Utils_1.Utils.stringCapitalize(sId) + Utils_1.Utils.stringCapitalize(sType);
                if (Utils_1.Utils.debug) {
                    Utils_1.Utils.console.debug("fnCommonEventHandler: sHandler=" + sHandler);
                }
                if (sHandler in this.mHandlers) {
                    this.mHandlers[sHandler].call(this, event);
                }
                else if (!sHandler.endsWith("SelectClick") && !sHandler.endsWith("InputClick")) { // do not print all messages
                    Utils_1.Utils.console.log("Event handler not found:", sHandler);
                }
            }
        }
        else if (oTarget.getAttribute("data-key") === null) { // not for keyboard buttons
            if (Utils_1.Utils.debug) {
                Utils_1.Utils.console.debug("Event handler for", sType, "unknown target:", oTarget.tagName, oTarget.id);
            }
        }
        if (sType === "click") { // special
            if (sId !== "cpcCanvas") {
                this.onWindowClick(event);
            }
        }
    };
    return CommonEventHandler;
}());
exports.CommonEventHandler = CommonEventHandler;
//# sourceMappingURL=CommonEventHandler.js.map