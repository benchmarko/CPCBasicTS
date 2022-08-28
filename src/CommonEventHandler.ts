// CommonEventHandler.ts - Common event handler for browser events
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/

import { Utils } from "./Utils";
import { IController } from "./Interfaces";
import { Model, ConfigType } from "./Model";
import { View } from "./View";

export class CommonEventHandler implements EventListenerObject {
	private readonly model: Model;
	private readonly view: View;
	private readonly controller: IController;

	private fnUserAction: ((event: Event, id: string) => void) | undefined = undefined;

	constructor(model: Model, view: View, controller: IController) {
		this.model = model;
		this.view = view;
		this.controller = controller;
	}

	private toogleHidden(id: string, prop: string, display?: string) {
		const visible = !this.model.getProperty<boolean>(prop);

		this.model.setProperty(prop, visible);
		this.view.setHidden(id, !visible, display);
		return visible;
	}

	fnSetUserAction(fnAction: ((event: Event, id: string) => void) | undefined): void {
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
		if (this.toogleHidden("textArea", "showText")) {
			this.controller.startUpdateTextCanvas();
		} else {
			this.controller.stopUpdateTextCanvas();
		}
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

	private onConvertButtonClick() {
		this.toogleHidden("convertArea", "showConvert", "flex");
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

	private fnUpdateAreaText(input: string) {
		this.controller.setInputText(input, true);
		this.view.setAreaValue("outputText", "");
	}

	private onUndoButtonClick() {
		const input = this.controller.undoStackElement();

		this.fnUpdateAreaText(input);
	}

	private onRedoButtonClick() {
		const input = this.controller.redoStackElement();

		this.fnUpdateAreaText(input);
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

	// eslint-disable-next-line class-methods-use-this
	private onCopyTextButtonClick() {
		const textText = document.getElementById("textText") as HTMLTextAreaElement;

		// const copyText = View.getElementByIdAs<HTMLTextAreaElement>("textText");
		// TODO: use View.setAreaSelection...

		textText.select();
		textText.setSelectionRange(0, 99999); // for mobile devices

		window.navigator.clipboard.writeText(textText.value);
	}

	private onOutputTextChange() {
		this.controller.invalidateScript();
	}

	private static encodeUriParam(params: ConfigType) {
		const parts = [];

		for (const key in params) {
			if (params.hasOwnProperty(key)) {
				const value = params[key];

				parts[parts.length] = encodeURIComponent(key) + "=" + encodeURIComponent((value === null) ? "" : value);
			}
		}
		return parts.join("&");
	}

	private onReloadButtonClick() {
		const changed = this.model.getChangedProperties();
		let paras = CommonEventHandler.encodeUriParam(changed);

		paras = paras.replace(/%2[Ff]/g, "/"); // unescape %2F -> /
		window.location.search = "?" + paras;
	}

	onDatabaseSelectChange(): void {
		this.controller.onDatabaseSelectChange();
	}

	onExampleSelectChange(): void {
		this.controller.onExampleSelectChange();
	}

	onVarSelectChange(): void {
		const par = this.view.getSelectValue("varSelect"),
			value = this.controller.getVariable(par),
			valueString = (value !== undefined) ? String(value) : "";

		this.view.setAreaValue("varText", valueString);
	}

	onKbdLayoutSelectChange(): void {
		const value = this.view.getSelectValue("kbdLayoutSelect");

		this.model.setProperty("kbdLayout", value);
		this.view.setSelectTitleFromSelectedOption("kbdLayoutSelect");

		this.view.setHidden("kbdAlpha", value === "num");
		this.view.setHidden("kbdNum", value === "alpha");
	}

	private onVarTextChange() {
		this.controller.changeVariable();
	}

	private onScreenshotButtonClick() {
		var example = this.view.getSelectValue("exampleSelect"),
			image = this.controller.startScreenshot(),
			link = View.getElementById1("screenshotLink"),
			name = example + ".png";

		link.setAttribute("download", name);
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

	onTextTextClick(event: Event): void {
		this.controller.onTextTextClick(event as MouseEvent);
	}

	/* eslint-disable no-invalid-this */
	private readonly handlers: Record<string, (e: Event | MouseEvent) => void> = {
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
		onWindowClick: this.onWindowClick,
		onTextTextClick: this.onTextTextClick,
		onCopyTextButtonClick: this.onCopyTextButtonClick
	};
	/* eslint-enable no-invalid-this */


	handleEvent(event: Event): void {
		const target = event.target as HTMLButtonElement,
			id = (target) ? target.getAttribute("id") as string : String(target),
			type = event.type; // click or change

		if (this.fnUserAction) {
			this.fnUserAction(event, id);
		}

		if (id) {
			if (!target.disabled) { // check needed for IE which also fires for disabled buttons
				const handler = "on" + Utils.stringCapitalize(id) + Utils.stringCapitalize(type);

				if (Utils.debug) {
					Utils.console.debug("fnCommonEventHandler: handler=" + handler);
				}

				if (handler in this.handlers) {
					this.handlers[handler].call(this, event);
				} else if (!handler.endsWith("SelectClick") && !handler.endsWith("InputClick")) { // do not print all messages
					Utils.console.log("Event handler not found:", handler);
				}
			}
		} else if (target.getAttribute("data-key") === null) { // not for keyboard buttons
			if (Utils.debug) {
				Utils.console.debug("Event handler for", type, "unknown target:", target.tagName, target.id);
			}
		}

		if (type === "click") { // special
			if (id !== "cpcCanvas" && id !== "textText") {
				this.onWindowClick(event);
			}
		}
	}
}
