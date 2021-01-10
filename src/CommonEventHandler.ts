// CommonEventHandler.ts - Common event handler for browser events
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/

import { Utils } from "./Utils";
import { IController } from "./Interfaces";
import { Model } from "./Model";
import { View } from "./View";

export class CommonEventHandler implements EventListenerObject {
	model: Model;
	view: View;
	controller: IController;

	fnUserAction: (event: Event, sId: string) => void;

	mHandlers: { [k: string]: (e: Event) => void };

	constructor(oModel: Model, oView: View, oController: IController) {
		this.init(oModel, oView, oController);
	}

	init(oModel: Model, oView: View, oController: IController): void {
		this.model = oModel;
		this.view = oView;
		this.controller = oController;

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

	onCpcCanvasClick(event: Event): void {
		this.controller.onCpcCanvasClick(event);
	}

	onWindowClick(event: Event): void {
		this.controller.onWindowClick(event);
	}
}
