// CommonEventHandler.ts - Common event handler for browser events
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/

import { Utils } from "./Utils";
import { IController } from "./Interfaces";
import { Model, ConfigType } from "./Model";
import { View } from "./View";

export class CommonEventHandler implements EventListenerObject {
	private model: Model;
	private view: View;
	private controller: IController;

	private fnUserAction: ((event: Event, sId: string) => void) | undefined = undefined;

	constructor(oModel: Model, oView: View, oController: IController) {
		this.model = oModel;
		this.view = oView;
		this.controller = oController;
	}

	private toogleHidden(sId: string, sProp: string, sDisplay?: string) {
		const bVisible = !this.model.getProperty<boolean>(sProp);

		this.model.setProperty(sProp, bVisible);
		this.view.setHidden(sId, !bVisible, sDisplay);
		return bVisible;
	}

	fnSetUserAction(fnAction: ((event: Event, sId: string) => void) | undefined): void {
		this.fnUserAction = fnAction;
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
			this.controller.startUpdateCanvas();
		} else {
			this.controller.stopUpdateCanvas();
		}
	}

	private onKbdButtonClick() {
		if (this.toogleHidden("kbdArea", "showKbd", "flex")) {
			if (this.view.getHidden("kbdArea")) { // on old browsers, display "flex" is not available, so set "block" if still hidden
				this.view.setHidden("kbdArea", false);
			}
			this.controller.virtualKeyboardCreate(); // maybe draw it
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

	/*
	private onTokenizeButtonClick() {
		this.controller.fnTokenize();
	}
	*/

	private fnUpdateAreaText(sInput: string) {
		this.controller.setInputText(sInput, true);
		this.view.setAreaValue("outputText", "");
	}

	private onUndoButtonClick() {
		const sInput = this.controller.undoStackElement();

		this.fnUpdateAreaText(sInput);
	}

	private onRedoButtonClick() {
		const sInput = this.controller.redoStackElement();

		this.fnUpdateAreaText(sInput);
	}

	private onDownloadButtonClick() {
		this.controller.fnDownload();
	}

	private onRunButtonClick() {
		this.controller.startRun();
	}

	private onStopButtonClick() {
		this.controller.startBreak();
	}

	private onContinueButtonClick(event: Event) {
		this.controller.startContinue();
		this.onCpcCanvasClick(event as MouseEvent);
	}

	private onResetButtonClick() {
		this.controller.startReset();
	}

	private onParseRunButtonClick(event: Event) {
		this.controller.startParseRun();
		this.onCpcCanvasClick(event as MouseEvent);
	}

	private static onHelpButtonClick() {
		window.open("https://github.com/benchmarko/CPCBasicTS/#readme");
	}

	private static onNothing() {
		// nothing
	}

	private onOutputTextChange() {
		this.controller.invalidateScript();
	}

	private static encodeUriParam(params: ConfigType) {
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
		const oChanged = this.model.getChangedProperties();
		let sParas = CommonEventHandler.encodeUriParam(oChanged);

		sParas = sParas.replace(/%2[Ff]/g, "/"); // unescape %2F -> /
		window.location.search = "?" + sParas;
	}

	onDatabaseSelectChange(): void {
		this.controller.onDatabaseSelectChange();
	}

	onExampleSelectChange(): void {
		this.controller.onExampleSelectChange();
	}

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
		this.controller.onCpcCanvasClick(event as MouseEvent);
	}

	onWindowClick(event: Event): void {
		this.controller.onWindowClick(event);
	}

	/* eslint-disable no-invalid-this */
	private mHandlers: { [k: string]: (e: Event | MouseEvent) => void } = {
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
		//onTokenizeButtonClick: this.onTokenizeButtonClick,
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
	/* eslint-enable no-invalid-this */


	handleEvent(event: Event): void {
		const oTarget = event.target as HTMLButtonElement,
			sId = (oTarget) ? oTarget.getAttribute("id") as string : String(oTarget),
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

				if (sHandler in this.mHandlers) {
					this.mHandlers[sHandler].call(this, event);
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
}
