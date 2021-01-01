// CommonEventHandler.ts - Common event handler for browser events
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/

import { Utils } from "./Utils";
import { IController } from "./Interfaces";
import { Model } from "./Model";
import { View } from "./View";

export class CommonEventHandler implements EventListenerObject {
	//static
	//fnEventHandler: undefined;

	model: Model;
	view: View;
	controller: IController;

	fnUserAction: (event: Event, sId: string) => void;

	mHandlers: { [k: string]: (e: Event) => void };

	constructor(oModel: Model, oView: View, oController: IController) {
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

	init(oModel: Model, oView: View, oController: IController): void {
		this.model = oModel;
		this.view = oView;
		this.controller = oController;
		//this.model = oController.model;
		//this.view = oController.view;

		this.fnUserAction = undefined;
	}

	handleEvent(event: Event): void {
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

	protected onSpecialButtonClick(): void {
		this.toogleHidden("specialArea", "showSpecial");
	}

	protected onInputButtonClick(): void {
		this.toogleHidden("inputArea", "showInput");
	}

	protected onInp2ButtonClick(): void {
		this.toogleHidden("inp2Area", "showInp2");
	}

	protected onOutputButtonClick(): void {
		this.toogleHidden("outputArea", "showOutput");
	}

	protected onResultButtonClick(): void {
		this.toogleHidden("resultArea", "showResult");
	}

	protected onTextButtonClick(): void {
		this.toogleHidden("textArea", "showText");
	}

	protected onVariableButtonClick(): void {
		this.toogleHidden("variableArea", "showVariable");
	}

	protected onCpcButtonClick(): void {
		if (this.toogleHidden("cpcArea", "showCpc")) {
			this.controller.startUpdateCanvas();
		} else {
			this.controller.stopUpdateCanvas();
		}
	}

	protected onKbdButtonClick(): void {
		if (this.toogleHidden("kbdArea", "showKbd", "flex")) {
			if (this.view.getHidden("kbdArea")) { // on old browsers, display "flex" is not available, so set "block" if still hidden
				this.view.setHidden("kbdArea", false);
			}
			this.controller.virtualKeyboardCreate(); // maybe draw it
		}
	}

	protected onKbdLayoutButtonClick(): void {
		this.toogleHidden("kbdLayoutArea", "showKbdLayout");
	}

	protected onConsoleButtonClick(): void {
		this.toogleHidden("consoleArea", "showConsole");
	}

	protected onParseButtonClick(): void {
		this.controller.startParse();
	}

	protected onRenumButtonClick(): void {
		this.controller.startRenum();
	}

	protected onPrettyButtonClick(): void {
		this.controller.fnPretty();
	}

	private fnUpdateAreaText(sInput: string) {
		this.controller.setInputText(sInput, true);
		this.view.setAreaValue("outputText", "");
	}

	protected onUndoButtonClick(): void {
		const sInput = this.controller.undoStackElement();

		this.fnUpdateAreaText(sInput);
	}

	protected onRedoButtonClick(): void {
		const sInput = this.controller.redoStackElement();

		this.fnUpdateAreaText(sInput);
	}

	protected onRunButtonClick(): void {
		//const sInput = this.view.getAreaValue("outputText");
		//this.controller.startRun(sInput); //TTT
		this.controller.startRun();
	}

	protected onStopButtonClick(): void {
		this.controller.startBreak();
	}

	protected onContinueButtonClick(event: Event): void {
		this.controller.startContinue();
		this.onCpcCanvasClick(event);
	}

	protected onResetButtonClick(): void {
		this.controller.startReset();
	}

	protected onParseRunButtonClick(event: Event): void {
		this.controller.startParseRun();
		this.onCpcCanvasClick(event);
	}

	protected onHelpButtonClick(): void { // eslint-disable-line class-methods-use-this
		window.open("https://github.com/benchmarko/CPCBasicTS/#readme");
	}

	protected onInputTextClick(): void { // eslint-disable-line class-methods-use-this
		// nothing
	}

	protected onOutputTextClick(): void { // eslint-disable-line class-methods-use-this
		// nothing
	}

	protected onResultTextClick(): void { // eslint-disable-line class-methods-use-this
		// nothing
	}

	protected onVarTextClick(): void { // eslint-disable-line class-methods-use-this
		// nothing
	}

	protected onOutputTextChange(): void {
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

	protected onReloadButtonClick(): void {
		//const oChanged = Utils.getChangedParameters(this.model.getAllProperties(), this.model.getAllInitialProperties());
		const oChanged = this.model.getChangedProperties();
		let sParas = this.encodeUriParam(oChanged);

		sParas = sParas.replace(/%2[Ff]/g, "/"); // unescape %2F -> /
		window.location.search = "?" + sParas;
	}

	onDatabaseSelectChange(): void {
		this.controller.onDatabaseSelectChange();
	}

	onExampleSelectChange(): void {
		this.controller.onExampleSelectChange();
	}

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

	onVarSelectChange(): void {
		const sPar = this.view.getSelectValue("varSelect"),
			value = this.controller.getVariable(sPar),
			sValue = (value !== undefined) ? String(value) : "";

		this.view.setAreaValue("varText", sValue);
	}

	onKbdLayoutSelectChange(): void {
		const sValue = this.view.getSelectValue("kbdLayoutSelect");

		this.model.setProperty("kbdLayout", sValue);
		this.view.setSelectTitleFromSelectedOption("kbdLayoutSelect");

		this.view.setHidden("kbdAlpha", sValue === "num");
		this.view.setHidden("kbdNum", sValue === "alpha");
	}

	protected onVarTextChange(): void {
		this.controller.changeVariable();
	}

	protected onScreenshotButtonClick(): void {
		var sExample = this.view.getSelectValue("exampleSelect"),
			image = this.controller.startScreenshot(),
			link = View.getElementById1("screenshotLink"),
			sName = sExample + ".png";

		link.setAttribute("download", sName);
		link.setAttribute("href", image);
		link.click();
	}

	protected onEnterButtonClick(): void {
		this.controller.startEnter();
	}

	protected onSoundButtonClick(): void {
		this.model.setProperty("sound", !this.model.getProperty<boolean>("sound"));
		this.controller.setSoundActive();
	}

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

	onCpcCanvasClick(event: Event): void {
		this.controller.onCpcCanvasClick(event);
	}

	onWindowClick(event: Event): void {
		this.controller.onWindowClick(event);
	}
}


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
