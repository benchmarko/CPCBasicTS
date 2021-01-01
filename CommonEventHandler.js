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
        /*
        this.mHandlers = { //TTT currently not used, just to avoid warnings
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
            onRunButtonClick: this.onRunButtonClick,
            onStopButtonClick: this.onStopButtonClick,
            onContinueButtonClick: this.onContinueButtonClick,
            onResetButtonClick: this.onResetButtonClick,
            onParseRunButtonClick: this.onParseRunButtonClick,
            onHelpButtonClick: this.onHelpButtonClick,
            onInputTextClick: this.onInputTextClick,
            onOutputTextClick: this.onOutputTextClick,
            onResultTextClick: this.onResultTextClick,
            onVarTextClick: this.onVarTextClick,
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
        */
        this.init(oModel, oView, oController);
    }
    CommonEventHandler.prototype.init = function (oModel, oView, oController) {
        this.model = oModel;
        this.view = oView;
        this.controller = oController;
        //this.model = oController.model;
        //this.view = oController.view;
        this.fnUserAction = undefined;
    };
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
                //if (this.mHandlers[sHandler]) { // old: if (sHandler in this) { this[sHandler](event);
                //	this.mHandlers[sHandler](event); // different this context!
                if (sHandler in this) {
                    this[sHandler](event);
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
    /*
    private attachEventHandler() {
        if (!this.fnEventHandler) {
            this.fnEventHandler = this.fnCommonEventHandler.bind(this);
        }
        this.view.attachEventHandler("click", this.fnEventHandler);
        this.view.attachEventHandler("change", this.fnEventHandler);
        return this;
    }
    */
    CommonEventHandler.prototype.toogleHidden = function (sId, sProp, sDisplay) {
        var bVisible = !this.model.getProperty(sProp);
        this.model.setProperty(sProp, bVisible);
        this.view.setHidden(sId, !bVisible, sDisplay);
        return bVisible;
    };
    CommonEventHandler.prototype.fnActivateUserAction = function (fnAction) {
        this.fnUserAction = fnAction;
    };
    CommonEventHandler.prototype.fnDeactivateUserAction = function () {
        this.fnUserAction = undefined;
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
    CommonEventHandler.prototype.onRunButtonClick = function () {
        //const sInput = this.view.getAreaValue("outputText");
        //this.controller.startRun(sInput); //TTT
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
    CommonEventHandler.prototype.onHelpButtonClick = function () {
        window.open("https://github.com/benchmarko/CPCBasicTS/#readme");
    };
    CommonEventHandler.prototype.onInputTextClick = function () {
        // nothing
    };
    CommonEventHandler.prototype.onOutputTextClick = function () {
        // nothing
    };
    CommonEventHandler.prototype.onResultTextClick = function () {
        // nothing
    };
    CommonEventHandler.prototype.onVarTextClick = function () {
        // nothing
    };
    CommonEventHandler.prototype.onOutputTextChange = function () {
        this.controller.invalidateScript();
    };
    CommonEventHandler.prototype.encodeUriParam = function (params) {
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
        //const oChanged = Utils.getChangedParameters(this.model.getAllProperties(), this.model.getAllInitialProperties());
        var oChanged = this.model.getChangedProperties();
        var sParas = this.encodeUriParam(oChanged);
        sParas = sParas.replace(/%2[Ff]/g, "/"); // unescape %2F -> /
        window.location.search = "?" + sParas;
    };
    CommonEventHandler.prototype.onDatabaseSelectChange = function () {
        this.controller.onDatabaseSelectChange();
    };
    CommonEventHandler.prototype.onExampleSelectChange = function () {
        this.controller.onExampleSelectChange();
    };
    /*
    onDatabaseSelectChange(): void {
        let sUrl: string,
            oDatabase;
        const that = this,
            sDatabase = this.view.getSelectValue("databaseSelect"),

            fnDatabaseLoaded = function (_sFullUrl) {
                oDatabase.loaded = true;
                Utils.console.log("fnDatabaseLoaded: database loaded: " + sDatabase + ": " + sUrl);
                that.controller.setExampleSelectOptions();
                if (oDatabase.error) {
                    Utils.console.error("fnDatabaseLoaded: database contains errors: " + sDatabase + ": " + sUrl);
                    that.controller.setInputText(oDatabase.script);
                    that.view.setAreaValue("resultText", oDatabase.error);
                } else {
                    that.controller.onExampleSelectChange();
                }
            },
            fnDatabaseError = function (_sFullUrl) {
                oDatabase.loaded = false;
                Utils.console.error("fnDatabaseError: database error: " + sDatabase + ": " + sUrl);
                that.controller.setExampleSelectOptions();
                that.controller.onExampleSelectChange();
                that.controller.setInputText("");
                that.view.setAreaValue("resultText", "Cannot load database: " + sDatabase);
            };

        this.model.setProperty("database", sDatabase);
        this.view.setSelectTitleFromSelectedOption("databaseSelect");
        oDatabase = this.model.getDatabase();
        if (!oDatabase) {
            Utils.console.error("onDatabaseSelectChange: database not available:", sDatabase);
            return;
        }

        if (oDatabase.text === "storage") { // sepcial handling: browser localStorage
            this.controller.updateStorageDatabase("set", null); // set all
            oDatabase.loaded = true;
        }

        if (oDatabase.loaded) {
            this.controller.setExampleSelectOptions();
            this.controller.onExampleSelectChange();
        } else {
            that.controller.setInputText("#loading database " + sDatabase + "...");
            sUrl = oDatabase.src + "/" + this.model.getProperty<string>("exampleIndex");
            Utils.loadScript(sUrl, fnDatabaseLoaded, fnDatabaseError);
        }
    }
    */
    /*
    private onExampleSelectChange() {
        const oController = this.controller,
            oVm = oController.oVm,
            oInFile = oVm.vmGetInFileObject(),
            sDataBase = this.model.getProperty<string>("database");

        oVm.closein();

        oInFile.bOpen = true;

        let sExample = this.view.getSelectValue("exampleSelect");
        const oExample = this.model.getExample(sExample);

        oInFile.sCommand = "run";
        if (oExample && oExample.meta) { // TTT TODO: this is just a workaround, meta is in input now; should change command after loading!
            const sType = oExample.meta.charAt(0);

            if (sType === "B" || sType === "D" || sType === "G") { // binary, data only, Gena Assembler?
                oInFile.sCommand = "load";
            }
        }

        if (sDataBase !== "storage") {
            sExample = "/" + sExample; // load absolute
        } else {
            this.model.setProperty("example", sExample);
        }

        oInFile.sName = sExample;
        oInFile.iStart = undefined;
        oInFile.fnFileCallback = oVm.fnLoadHandler;
        oVm.vmStop("fileLoad", 90);
        oController.startMainLoop();
    }
    */
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
    /*
    onCpcCanvasClick(event: Event): void {
        this.controller.oCanvas.onCpcCanvasClick(event);
        this.controller.oKeyboard.setActive(true);
    }

    onWindowClick(event: Event): void {
        this.controller.oCanvas.onWindowClick(event);
        this.controller.oKeyboard.setActive(false);
    }
    */
    CommonEventHandler.prototype.onCpcCanvasClick = function (event) {
        this.controller.onCpcCanvasClick(event);
    };
    CommonEventHandler.prototype.onWindowClick = function (event) {
        this.controller.onWindowClick(event);
    };
    return CommonEventHandler;
}());
exports.CommonEventHandler = CommonEventHandler;
/*

export class CommonEventHandler {
    static fnEventHandler: undefined;

    model: Model;
    view: View;
    controller: any; // TODO

    fnUserAction: (event: Event, sId: string) => void;

    mHandlers: {[k: string]: (e: Event) => void};


    constructor(oModel: Model, oView: View, oController) {
        this.mHandlers = { //TTT currently not used, just to avoid warnings
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
            onRunButtonClick: this.onRunButtonClick,
            onStopButtonClick: this.onStopButtonClick,
            onContinueButtonClick: this.onContinueButtonClick,
            onResetButtonClick: this.onResetButtonClick,
            onParseRunButtonClick: this.onParseRunButtonClick,
            onHelpButtonClick: this.onHelpButtonClick,
            onInputTextClick: this.onInputTextClick,
            onOutputTextClick: this.onOutputTextClick,
            onResultTextClick: this.onResultTextClick,
            onVarTextClick: this.onVarTextClick,
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

        this.init(oModel, oView, oController);
    }

    init(oModel: Model, oView: View, oController): void {
        this.model = oModel;
        this.view = oView;
        this.controller = oController;

        this.fnUserAction = undefined;
        this.attachEventHandler();
    }

    private fnCommonEventHandler(event: Event) {
        const oTarget = event.target as HTMLButtonElement,
            sId = (oTarget) ? oTarget.getAttribute("id") : String(oTarget),
            sType = event.type; // click or change

        if (this.fnUserAction) {
            this.fnUserAction(event, sId);
        }

        if (sId) {
            if (!oTarget.disabled) { // check needed for IE which also fires for disabled buttons
                const sHandler = "on" + Utils.stringCapitalize(sId) + Utils.stringCapitalize(sType);

                if (Utils.debug) {
                    Utils.console.debug("fnCommonEventHandler: sHandler=" + sHandler);
                }
                //if (this.mHandlers[sHandler]) { // old: if (sHandler in this) { this[sHandler](event);
                //	this.mHandlers[sHandler](event); // different this context!
                if (sHandler in this) {
                    this[sHandler](event);
                } else if (!sHandler.endsWith("SelectClick") && !sHandler.endsWith("InputClick")) { // do not print all messages
                    Utils.console.log("Event handler not found:", sHandler);
                }
            }
        } else if (oTarget.getAttribute("data-key") === null) { // not for keyboard buttons
            if (Utils.debug) {
                Utils.console.debug("Event handler for", sType, "unknown target:", oTarget.tagName, oTarget.id);
            }
        }

        if (sType === "click") { // special
            if (sId !== "cpcCanvas") {
                this.onWindowClick(event);
            }
        }
    }

    private attachEventHandler() {
        if (!CommonEventHandler.fnEventHandler) {
            CommonEventHandler.fnEventHandler = this.fnCommonEventHandler.bind(this);
        }
        this.view.attachEventHandler("click", CommonEventHandler.fnEventHandler);
        this.view.attachEventHandler("change", CommonEventHandler.fnEventHandler);
        return this;
    }

    private toogleHidden(sId: string, sProp: string, sDisplay?: string) {
        const bVisible = !this.model.getProperty<boolean>(sProp);

        this.model.setProperty(sProp, bVisible);
        this.view.setHidden(sId, !bVisible, sDisplay);
        return bVisible;
    }

    fnActivateUserAction(fnAction: (event: Event, sId: string) => void): void {
        this.fnUserAction = fnAction;
    }

    fnDeactivateUserAction(): void {
        this.fnUserAction = undefined;
    }

    private onSpecialButtonClick() {
        this.toogleHidden("specialArea", "showSpecial");
    }

    private onInputButtonClick() {
        this.toogleHidden("inputArea", "showInput");
    }

    private onInp2ButtonClick() {
        this.toogleHidden("inp2Area", "showInp2");
    }

    private onOutputButtonClick() {
        this.toogleHidden("outputArea", "showOutput");
    }

    private onResultButtonClick() {
        this.toogleHidden("resultArea", "showResult");
    }

    private onTextButtonClick() {
        this.toogleHidden("textArea", "showText");
    }

    private onVariableButtonClick() {
        this.toogleHidden("variableArea", "showVariable");
    }

    private onCpcButtonClick() {
        if (this.toogleHidden("cpcArea", "showCpc")) {
            this.controller.oCanvas.startUpdateCanvas();
        } else {
            this.controller.oCanvas.stopUpdateCanvas();
        }
    }

    private onKbdButtonClick() {
        if (this.toogleHidden("kbdArea", "showKbd", "flex")) {
            if (this.view.getHidden("kbdArea")) { // on old browsers, display "flex" is not available, so set "block" if still hidden
                this.view.setHidden("kbdArea", false);
            }
            this.controller.oKeyboard.virtualKeyboardCreate(); // maybe draw it
        }
    }

    private onKbdLayoutButtonClick() {
        this.toogleHidden("kbdLayoutArea", "showKbdLayout");
    }

    private onConsoleButtonClick() {
        this.toogleHidden("consoleArea", "showConsole");
    }

    private onParseButtonClick() {
        this.controller.startParse();
    }

    private onRenumButtonClick() {
        this.controller.startRenum();
    }

    private onPrettyButtonClick() {
        this.controller.fnPretty();
    }

    private fnUpdateAreaText(sInput: string) {
        this.controller.setInputText(sInput, true);
        this.view.setAreaValue("outputText", "");
    }

    private onUndoButtonClick() {
        const sInput = this.controller.inputStack.undo();

        this.fnUpdateAreaText(sInput);
    }

    private onRedoButtonClick() {
        const sInput = this.controller.inputStack.redo();

        this.fnUpdateAreaText(sInput);
    }

    private onRunButtonClick() {
        const sInput = this.view.getAreaValue("outputText");

        this.controller.startRun(sInput);
    }

    private onStopButtonClick() {
        this.controller.startBreak();
    }

    private onContinueButtonClick(event: Event) {
        this.controller.startContinue();
        this.onCpcCanvasClick(event);
    }

    private onResetButtonClick() {
        this.controller.startReset();
    }

    private onParseRunButtonClick(event: Event) {
        this.controller.startParseRun();
        this.onCpcCanvasClick(event);
    }

    private onHelpButtonClick() { // eslint-disable-line class-methods-use-this
        window.open("https://github.com/benchmarko/CPCBasic/#readme");
    }

    private onInputTextClick() { // eslint-disable-line class-methods-use-this
        // nothing
    }

    private onOutputTextClick() { // eslint-disable-line class-methods-use-this
        // nothing
    }

    private onResultTextClick() { // eslint-disable-line class-methods-use-this
        // nothing
    }

    private onVarTextClick() { // eslint-disable-line class-methods-use-this
        // nothing
    }

    private onOutputTextChange() {
        this.controller.invalidateScript();
    }

    private encodeUriParam(params) { // eslint-disable-line class-methods-use-this
        const aParts = [];

        for (const sKey in params) {
            if (params.hasOwnProperty(sKey)) {
                const sValue = params[sKey];

                aParts[aParts.length] = encodeURIComponent(sKey) + "=" + encodeURIComponent((sValue === null) ? "" : sValue);
            }
        }
        return aParts.join("&");
    }

    private onReloadButtonClick() {
        //const oChanged = Utils.getChangedParameters(this.model.getAllProperties(), this.model.getAllInitialProperties());
        const oChanged = this.controller.model.getChangedProperties();
        let	sParas = this.encodeUriParam(oChanged);

        sParas = sParas.replace(/%2[Ff]/g, "/"); // unescape %2F -> /
        window.location.search = "?" + sParas;
    }

    onDatabaseSelectChange(): void {
        let	sUrl: string,
            oDatabase;
        const that = this,
            sDatabase = this.view.getSelectValue("databaseSelect"),

            fnDatabaseLoaded = function (sFullUrl) {
                oDatabase.loaded = true;
                Utils.console.log("fnDatabaseLoaded: database loaded: " + sDatabase + ": " + sUrl);
                that.controller.setExampleSelectOptions();
                if (oDatabase.error) {
                    Utils.console.error("fnDatabaseLoaded: database contains errors: " + sDatabase + ": " + sUrl);
                    that.controller.setInputText(oDatabase.script);
                    that.view.setAreaValue("resultText", oDatabase.error);
                } else {
                    that.onExampleSelectChange();
                }
            },
            fnDatabaseError = function (sFullUrl) {
                oDatabase.loaded = false;
                Utils.console.error("fnDatabaseError: database error: " + sDatabase + ": " + sUrl);
                that.controller.setExampleSelectOptions();
                that.onExampleSelectChange();
                that.controller.setInputText("");
                that.view.setAreaValue("resultText", "Cannot load database: " + sDatabase);
            };

        this.model.setProperty("database", sDatabase);
        this.view.setSelectTitleFromSelectedOption("databaseSelect");
        oDatabase = this.model.getDatabase();
        if (!oDatabase) {
            Utils.console.error("onDatabaseSelectChange: database not available:", sDatabase);
            return;
        }

        if (oDatabase.text === "storage") { // sepcial handling: browser localStorage
            this.controller.updateStorageDatabase("set", null); // set all
            oDatabase.loaded = true;
        }

        if (oDatabase.loaded) {
            this.controller.setExampleSelectOptions();
            this.onExampleSelectChange();
        } else {
            that.controller.setInputText("#loading database " + sDatabase + "...");
            sUrl = oDatabase.src + "/" + this.model.getProperty<string>("exampleIndex");
            Utils.loadScript(sUrl, fnDatabaseLoaded, fnDatabaseError);
        }
    }

    private onExampleSelectChange() {
        const oController = this.controller,
            oVm = oController.oVm,
            oInFile = oVm.vmGetInFileObject(),
            sDataBase = this.model.getProperty<string>("database");

        oVm.closein();

        oInFile.bOpen = true;

        let sExample = this.view.getSelectValue("exampleSelect");
        const oExample = this.model.getExample(sExample);

        oInFile.sCommand = "run";
        if (oExample && oExample.meta) { // TTT TODO: this is just a workaround, meta is in input now; should change command after loading!
            const sType = oExample.meta.charAt(0);

            if (sType === "B" || sType === "D" || sType === "G") { // binary, data only, Gena Assembler?
                oInFile.sCommand = "load";
            }
        }

        if (sDataBase !== "storage") {
            sExample = "/" + sExample; // load absolute
        } else {
            this.model.setProperty("example", sExample);
        }

        oInFile.sName = sExample;
        oInFile.iStart = undefined;
        oInFile.fnFileCallback = oVm.fnLoadHandler;
        oVm.vmStop("fileLoad", 90);
        oController.startMainLoop();
    }

    onVarSelectChange(): void {
        const sPar = this.view.getSelectValue("varSelect"),
            oVariables = this.controller.oVariables;
        let sValue = oVariables.getVariable(sPar);

        if (sValue === undefined) {
            sValue = "";
        }
        this.view.setAreaValue("varText", sValue);
    }

    onKbdLayoutSelectChange(): void {
        const sValue = this.view.getSelectValue("kbdLayoutSelect");

        this.model.setProperty("kbdLayout", sValue);
        this.view.setSelectTitleFromSelectedOption("kbdLayoutSelect");

        this.view.setHidden("kbdAlpha", sValue === "num");
        this.view.setHidden("kbdNum", sValue === "alpha");
    }

    private onVarTextChange() {
        this.controller.changeVariable();
    }

    private onScreenshotButtonClick() {
        var sExample = this.view.getSelectValue("exampleSelect"),
            image = this.controller.startScreenshot(),
            link = View.getElementById1("screenshotLink"),
            sName = sExample + ".png";

        link.setAttribute("download", sName);
        link.setAttribute("href", image);
        link.click();
    }

    private onEnterButtonClick() {
        this.controller.startEnter();
    }

    private onSoundButtonClick() {
        this.model.setProperty("sound", !this.model.getProperty<boolean>("sound"));
        this.controller.setSoundActive();
    }

    onCpcCanvasClick(event: Event): void {
        this.controller.oCanvas.onCpcCanvasClick(event);
        this.controller.oKeyboard.setActive(true);
    }

    onWindowClick(event: Event): void {
        this.controller.oCanvas.onWindowClick(event);
        this.controller.oKeyboard.setActive(false);
    }
}
*/
//# sourceMappingURL=CommonEventHandler.js.map