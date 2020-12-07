// CommonEventHandler.js - Common event handler for browser events
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasic/

import { Utils } from "./Utils";
import { Model } from "./Model";
import { View } from "./View";

export class CommonEventHandler {
	static fnEventHandler: undefined;

	model: Model;
	view: View;
	controller: any; //Controller; //TTT

	fnUserAction = undefined;


	constructor(oModel, oView, oController) {
		this.init(oModel, oView, oController);
	}

	//CommonEventHandler.fnEventHandler = null;

	init(oModel, oView, oController) {
		this.model = oModel;
		this.view = oView;
		this.controller = oController;

		this.fnUserAction = undefined;
		this.attachEventHandler();
	}

	fnCommonEventHandler(event) {
		var oTarget = event.target,
			sId = (oTarget) ? oTarget.getAttribute("id") : oTarget,
			sType = event.type, // click or change
			sHandler;

		if (this.fnUserAction) {
			this.fnUserAction(event, sId);
		}

		if (sId) {
			if (!oTarget.disabled) { // check needed for IE which also fires for disabled buttons
				sHandler = "on" + Utils.stringCapitalize(sId) + Utils.stringCapitalize(sType);
				if (Utils.debug) {
					Utils.console.debug("fnCommonEventHandler: sHandler=" + sHandler);
				}
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

	toogleHidden(sId: string, sProp: string, sDisplay?: string) {
		var bVisible = !this.model.getProperty(sProp);

		this.model.setProperty(sProp, bVisible);
		this.view.setHidden(sId, !bVisible, sDisplay);
		return bVisible;
	}

	fnActivateUserAction(fnAction) {
		this.fnUserAction = fnAction;
	}

	fnDeactivateUserAction() {
		this.fnUserAction = undefined;
	}

	onSpecialButtonClick() {
		this.toogleHidden("specialArea", "showSpecial");
	}

	onInputButtonClick() {
		this.toogleHidden("inputArea", "showInput");
	}

	onInp2ButtonClick() {
		this.toogleHidden("inp2Area", "showInp2");
	}

	onOutputButtonClick() {
		this.toogleHidden("outputArea", "showOutput");
	}

	onResultButtonClick() {
		this.toogleHidden("resultArea", "showResult");
	}

	onTextButtonClick() {
		this.toogleHidden("textArea", "showText");
	}

	onVariableButtonClick() {
		this.toogleHidden("variableArea", "showVariable");
	}

	onCpcButtonClick() {
		if (this.toogleHidden("cpcArea", "showCpc")) {
			this.controller.oCanvas.startUpdateCanvas();
		} else {
			this.controller.oCanvas.stopUpdateCanvas();
		}
	}

	onKbdButtonClick() {
		if (this.toogleHidden("kbdArea", "showKbd", "flex")) {
			if (this.view.getHidden("kbdArea")) { // on old browsers, display "flex" is not available, so set "block" if still hidden
				this.view.setHidden("kbdArea", false);
			}
			this.controller.oKeyboard.virtualKeyboardCreate(); // maybe draw it
		}
	}

	onKbdLayoutButtonClick() {
		this.toogleHidden("kbdLayoutArea", "showKbdLayout");
	}

	onConsoleButtonClick() {
		this.toogleHidden("consoleArea", "showConsole");
	}

	onParseButtonClick() {
		this.controller.startParse();
	}

	onRenumButtonClick() {
		this.controller.startRenum();
	}

	onPrettyButtonClick() {
		this.controller.fnPretty();
	}

	fnUpdateAreaText(sInput) {
		this.controller.setInputText(sInput, true);
		this.view.setAreaValue("outputText", "");
	}

	onUndoButtonClick() {
		var sInput = this.controller.inputStack.undo();

		this.fnUpdateAreaText(sInput);
	}

	onRedoButtonClick() {
		var sInput = this.controller.inputStack.redo();

		this.fnUpdateAreaText(sInput);
	}

	onRunButtonClick() {
		var sInput = this.view.getAreaValue("outputText");

		this.controller.startRun(sInput);
	}

	onStopButtonClick() {
		this.controller.startBreak();
	}

	onContinueButtonClick(event) {
		this.controller.startContinue();
		this.onCpcCanvasClick(event);
	}

	onResetButtonClick() {
		this.controller.startReset();
	}

	onParseRunButtonClick(event) {
		this.controller.startParseRun();
		this.onCpcCanvasClick(event);
	}

	onHelpButtonClick() {
		window.open("https://github.com/benchmarko/CPCBasic/#readme");
	}

	onInputTextClick() {
		// nothing
	}

	onOutputTextClick() {
		// nothing
	}

	onResultTextClick() {
		// nothing
	}

	onVarTextClick() {
		// nothing
	}

	onOutputTextChange() {
		this.controller.invalidateScript();
	}

	private encodeUriParam(params) {
		var aParts = [],
			sKey,
			sValue;

		for (sKey in params) {
			if (params.hasOwnProperty(sKey)) {
				sValue = params[sKey];
				aParts[aParts.length] = encodeURIComponent(sKey) + "=" + encodeURIComponent((sValue === null) ? "" : sValue);
			}
		}
		return aParts.join("&");
	}

	onReloadButtonClick() {
		var oChanged = Utils.getChangedParameters(this.model.getAllProperties(), this.model.getAllInitialProperties()),
			sParas = this.encodeUriParam(oChanged);

		sParas = sParas.replace(/%2[Ff]/g, "/"); // unescape %2F -> /
		window.location.search = "?" + sParas;
	}

	onDatabaseSelectChange() {
		var that = this,
			sDatabase = this.view.getSelectValue("databaseSelect"),
			sUrl, oDatabase,

			fnDatabaseLoaded = function (/* sFullUrl */) {
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
			fnDatabaseError = function (/* sFullUrl */) {
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
			sUrl = oDatabase.src + "/" + this.model.getProperty("exampleIndex");
			Utils.loadScript(sUrl, fnDatabaseLoaded, fnDatabaseError);
		}
	}

	onExampleSelectChange() {
		var oController = this.controller,
			oVm = oController.oVm,
			oInFile = oVm.vmGetInFileObject(),
			sDataBase = this.model.getProperty("database"),
			sType;

		oVm.closein();

		oInFile.bOpen = true;

		let sExample = this.view.getSelectValue("exampleSelect");

		const oExample = this.model.getExample(sExample);

		oInFile.sCommand = "run";
		if (oExample && oExample.meta) { // TTT TODO: this is just a workaround, meta is in input now; should change command after loading!
			sType = oExample.meta.charAt(0);
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

	onVarSelectChange() {
		var sPar = this.view.getSelectValue("varSelect"),
			oVariables = this.controller.oVariables,
			sValue;

		sValue = oVariables.getVariable(sPar);
		if (sValue === undefined) {
			sValue = "";
		}
		this.view.setAreaValue("varText", sValue);
	}

	onKbdLayoutSelectChange() {
		var sValue = this.view.getSelectValue("kbdLayoutSelect");

		this.model.setProperty("kbdLayout", sValue);
		this.view.setSelectTitleFromSelectedOption("kbdLayoutSelect");

		this.view.setHidden("kbdAlpha", sValue === "num");
		this.view.setHidden("kbdNum", sValue === "alpha");
	}

	onVarTextChange() {
		this.controller.changeVariable();
	}

	onScreenshotButtonClick() {
		var sExample = this.view.getSelectValue("exampleSelect"),
			image = this.controller.startScreenshot(),
			link = document.getElementById("screenshotLink"),
			sName = sExample + ".png";

		link.setAttribute("download", sName);
		link.setAttribute("href", image);
		link.click();
	}

	onEnterButtonClick() {
		this.controller.startEnter();
	}

	onSoundButtonClick() {
		this.model.setProperty("sound", !this.model.getProperty("sound"));
		this.controller.setSoundActive();
	}

	onCpcCanvasClick(event) {
		this.controller.oCanvas.onCpcCanvasClick(event);
		this.controller.oKeyboard.setActive(true);
	}

	onWindowClick(event) {
		this.controller.oCanvas.onWindowClick(event);
		this.controller.oKeyboard.setActive(false);
	}
}
