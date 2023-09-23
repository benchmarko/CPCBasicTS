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

	fnSetUserAction(fnAction: ((event: Event, id: string) => void) | undefined): void {
		this.fnUserAction = fnAction;
	}

	private onInputButtonClick() {
		this.controller.toggleAreaHidden("inputArea");
	}

	private onInp2ButtonClick() {
		this.controller.toggleAreaHidden("inp2Area");
	}

	private onOutputButtonClick() {
		this.controller.toggleAreaHidden("outputArea");
	}

	private onResultButtonClick() {
		this.controller.toggleAreaHidden("resultArea");
	}

	private onTextButtonClick() {
		if (this.controller.toggleAreaHidden("textArea")) {
			this.controller.startUpdateTextCanvas();
		} else {
			this.controller.stopUpdateTextCanvas();
		}
	}

	private onVariableButtonClick() {
		this.controller.toggleAreaHidden("variableArea");
	}

	private onCpcButtonClick() {
		if (this.controller.toggleAreaHidden("cpcArea")) {
			this.controller.startUpdateCanvas();
		} else {
			this.controller.stopUpdateCanvas();
		}
	}

	private onConvertButtonClick() {
		this.controller.toggleAreaHidden("convertArea");
	}

	private onSettingsButtonClick() {
		this.controller.toggleAreaHidden("settingsArea");
	}

	private onGalleryButtonClick() {
		if (this.controller.toggleAreaHidden("galleryArea")) {
			this.controller.setGalleryAreaInputs();
		}
	}

	private onMoreButtonClick() {
		this.controller.toggleAreaHidden("moreArea");
	}

	private onKbdButtonClick() {
		if (this.controller.toggleAreaHidden("kbdArea")) {
			this.controller.virtualKeyboardCreate(); // maybe draw it
			this.view.setHidden("kbdLayoutArea", true, "inherit"); // kbd visible => kbdlayout invisible
		} else {
			this.view.setHidden("kbdLayoutArea", false, "inherit");
		}
	}

	private onConsoleButtonClick() {
		this.controller.toggleAreaHidden("consoleArea");
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

	private onLineNumberAddButtonClick() {
		this.controller.fnAddLines();
	}

	private onLineNumberRemoveButtonClick() {
		this.controller.fnRemoveLines();
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

	private onGalleryItemClick(event: Event) {
		const target = View.getEventTarget<HTMLInputElement>(event),
			value = target.value;

		this.view.setSelectValue("exampleSelect", value);
		this.controller.toggleAreaHidden("galleryArea"); // close

		this.onExampleSelectChange();
	}

	private static onNothing() {
		// nothing
	}

	// eslint-disable-next-line class-methods-use-this
	private onCopyTextButtonClick() {
		const textText = View.getElementByIdAs<HTMLTextAreaElement>("textText");

		textText.select();

		this.view.setAreaSelection("textText", 0, 99999); // for mobile devices
		if (window.navigator && window.navigator.clipboard) {
			window.navigator.clipboard.writeText(textText.value);
		} else {
			Utils.console.warn("Copy to clipboard not available");
		}
	}

	private onOutputTextChange() {
		this.controller.invalidateScript();
	}

	private static encodeUriParam(params: ConfigType) {
		const parts = [];

		for (const key in params) {
			if (params.hasOwnProperty(key)) {
				const value = params[key];

				parts[parts.length] = encodeURIComponent(key) + "=" + encodeURIComponent(value === null ? "" : value);
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

	private onDatabaseSelectChange(): void {
		this.controller.onDatabaseSelectChange();
	}

	private onDirectorySelectChange(): void {
		this.controller.onDirectorySelectChange();
	}

	private onExampleSelectChange(): void {
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

	private onPaletteSelectChange() {
		const value = this.view.getSelectValue("paletteSelect");

		this.model.setProperty("palette", value);
		this.view.setSelectTitleFromSelectedOption("paletteSelect");
		this.controller.setPalette(value);
	}

	private onVarTextChange() {
		this.controller.changeVariable();
	}

	private onDebugInputChange() {
		const debug = this.view.getInputValue("debugInput");

		this.model.setProperty<number>("debug", Number(debug));
	}

	private onImplicitLinesInputChange() {
		const checked = this.view.getInputChecked("implicitLinesInput");

		this.model.setProperty("implicitLines", checked);
		this.controller.fnImplicitLines();
	}

	private onArrayBoundsInputChange() {
		const checked = this.view.getInputChecked("arrayBoundsInput");

		this.model.setProperty("arrayBounds", checked);
		this.controller.fnArrayBounds();
	}

	private onConsoleLogInputChange() {
		const checked = this.view.getInputChecked("consoleLogInput");

		this.model.setProperty("showConsole", checked);
		if (checked && this.view.getHidden("consoleBox")) {
			this.view.setHidden("consoleBox", !checked); // make sure the box around is visible
		}
	}

	private onTraceInputChange() {
		const checked = this.view.getInputChecked("traceInput");

		this.model.setProperty("trace", checked);
		this.controller.fnTrace();
	}

	private onSoundInputChange() {
		const checked = this.view.getInputChecked("soundInput");

		this.model.setProperty("sound", checked);
		this.controller.setSoundActive();
	}

	private onSpeedInputChange() {
		const speed = this.view.getInputValue("speedInput");

		this.model.setProperty<number>("speed", Number(speed));
		this.controller.fnSpeed();
	}

	private onScreenshotButtonClick() {
		var example = this.view.getSelectValue("exampleSelect"),
			image = this.controller.startScreenshot(),
			link = View.getElementById1("screenshotLink"),
			name = example + ".png";

		if (image) {
			link.setAttribute("download", name);
			link.setAttribute("href", image);
			link.click();
		}
	}

	private onEnterButtonClick() {
		this.controller.startEnter();
	}

	private static onFullscreenButtonClick() {
		const switched = View.requestFullscreenForId("cpcCanvas");

		if (!switched) {
			Utils.console.warn("Switch to fullscreen not available");
		}
	}

	private onCpcCanvasClick(event: Event) {
		this.controller.onCpcCanvasClick(event as MouseEvent);
	}

	private onWindowClick(event: Event) {
		this.controller.onWindowClick(event);
	}

	private onTextTextClick(event: Event) {
		this.controller.onTextTextClick(event as MouseEvent);
	}

	/* eslint-disable no-invalid-this */
	private readonly handlers: Record<string, (e: Event | MouseEvent) => void> = {
		onInputButtonClick: this.onInputButtonClick,
		onInp2ButtonClick: this.onInp2ButtonClick,
		onOutputButtonClick: this.onOutputButtonClick,
		onResultButtonClick: this.onResultButtonClick,
		onTextButtonClick: this.onTextButtonClick,
		onVariableButtonClick: this.onVariableButtonClick,
		onCpcButtonClick: this.onCpcButtonClick,
		onConvertButtonClick: this.onConvertButtonClick,
		onSettingsButtonClick: this.onSettingsButtonClick,
		onGalleryButtonClick: this.onGalleryButtonClick,
		onMoreButtonClick: this.onMoreButtonClick,
		onKbdButtonClick: this.onKbdButtonClick,
		onConsoleButtonClick: this.onConsoleButtonClick,
		onParseButtonClick: this.onParseButtonClick,
		onRenumButtonClick: this.onRenumButtonClick,
		onPrettyButtonClick: this.onPrettyButtonClick,
		onLineNumberAddButtonClick: this.onLineNumberAddButtonClick,
		onLineNumberRemoveButtonClick: this.onLineNumberRemoveButtonClick,
		onUndoButtonClick: this.onUndoButtonClick,
		onRedoButtonClick: this.onRedoButtonClick,
		onDownloadButtonClick: this.onDownloadButtonClick,
		onRunButtonClick: this.onRunButtonClick,
		onStopButtonClick: this.onStopButtonClick,
		onContinueButtonClick: this.onContinueButtonClick,
		onResetButtonClick: this.onResetButtonClick,
		onParseRunButtonClick: this.onParseRunButtonClick,
		onHelpButtonClick: CommonEventHandler.onHelpButtonClick,
		onGalleryItemClick: this.onGalleryItemClick,
		onInputTextClick: CommonEventHandler.onNothing,
		onOutputTextClick: CommonEventHandler.onNothing,
		onResultTextClick: CommonEventHandler.onNothing,
		onVarTextClick: CommonEventHandler.onNothing,
		onOutputTextChange: this.onOutputTextChange,
		onReloadButtonClick: this.onReloadButtonClick,
		onDatabaseSelectChange: this.onDatabaseSelectChange,
		onDirectorySelectChange: this.onDirectorySelectChange,
		onExampleSelectChange: this.onExampleSelectChange,
		onVarSelectChange: this.onVarSelectChange,
		onKbdLayoutSelectChange: this.onKbdLayoutSelectChange,
		onVarTextChange: this.onVarTextChange,
		onDebugInputChange: this.onDebugInputChange,
		onImplicitLinesInputChange: this.onImplicitLinesInputChange,
		onArrayBoundsInputChange: this.onArrayBoundsInputChange,
		onConsoleLogInputChange: this.onConsoleLogInputChange,
		onTraceInputChange: this.onTraceInputChange,
		onSoundInputChange: this.onSoundInputChange,
		onSpeedInputChange: this.onSpeedInputChange,
		onPaletteSelectChange: this.onPaletteSelectChange,
		onScreenshotButtonClick: this.onScreenshotButtonClick,
		onEnterButtonClick: this.onEnterButtonClick,
		onFullscreenButtonClick: CommonEventHandler.onFullscreenButtonClick,
		onCpcCanvasClick: this.onCpcCanvasClick,
		onWindowClick: this.onWindowClick,
		onTextTextClick: this.onTextTextClick,
		onCopyTextButtonClick: this.onCopyTextButtonClick
	};
	/* eslint-enable no-invalid-this */


	handleEvent(event: Event): void {
		const target = View.getEventTarget<HTMLButtonElement>(event),
			id = (target) ? target.getAttribute("id") as string : String(target),
			type = event.type; // click or change

		if (this.fnUserAction) {
			this.fnUserAction(event, id);
		}

		if (id) {
			if (!target.disabled) { // check needed for IE which also fires for disabled buttons
				const idNoNum = id.replace(/\d+$/, ""), // remove a trailing number
					handler = "on" + Utils.stringCapitalize(idNoNum) + Utils.stringCapitalize(type);

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
