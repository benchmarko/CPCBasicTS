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

	/*
	private onKbdButtonClick() {
		this.controller.toggleAreaHidden(View.ids.kbdSettingsArea);
	}
	*/

	private onConvertButtonClick() {
		this.controller.toggleAreaHidden(View.ids.convertArea);
	}

	private onSettingsButtonClick() {
		this.controller.toggleAreaHidden(View.ids.settingsArea);
	}

	private onViewButtonClick() {
		this.controller.toggleAreaHidden(View.ids.viewArea);
	}

	private onExportButtonClick() {
		this.controller.toggleAreaHidden(View.ids.exportArea);
	}

	private onGalleryButtonClick() {
		if (this.controller.toggleAreaHidden(View.ids.galleryArea)) {
			this.controller.setGalleryAreaInputs();
		}
	}

	private onMoreButtonClick() {
		this.controller.toggleAreaHidden(View.ids.moreArea);
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
		this.view.setAreaValue(View.ids.outputText, "");
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

		this.view.setSelectValue(View.ids.exampleSelect, value);
		this.controller.toggleAreaHidden(View.ids.galleryArea); // close

		this.onExampleSelectChange();
	}

	private static onNothing() {
		// nothing
	}

	// eslint-disable-next-line class-methods-use-this
	private onCopyTextButtonClick() {
		const textText = View.getElementByIdAs<HTMLTextAreaElement>(View.ids.textText);

		textText.select();

		this.view.setAreaSelection(View.ids.textText, 0, 99999); // for mobile devices
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
		//this.onSettingsButtonClick(); // close settings dialog
		this.controller.setPopoversHiddenExcept(""); // hide all popovers,

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
		const par = this.view.getSelectValue(View.ids.varSelect),
			value = this.controller.getVariable(par),
			valueString = (value !== undefined) ? String(value) : "";

		this.view.setAreaValue(View.ids.varText, valueString);
	}

	onKbdLayoutSelectChange(): void {
		const value = this.view.getSelectValue(View.ids.kbdLayoutSelect);

		this.model.setProperty(Model.props.kbdLayout, value);
		this.view.setSelectTitleFromSelectedOption(View.ids.kbdLayoutSelect);

		this.view.setHidden(View.ids.kbdAlpha, value === "num");
		this.view.setHidden(View.ids.kbdNum, value === "alpha");
	}

	private onBasicVersionSelectChange() {
		const value = this.view.getSelectValue(View.ids.basicVersionSelect);

		this.model.setProperty(Model.props.basicVersion, value);
		this.view.setSelectTitleFromSelectedOption(View.ids.basicVersionSelect);
		this.controller.setBasicVersion(value);
	}

	private onPaletteSelectChange() {
		const value = this.view.getSelectValue(View.ids.paletteSelect);

		this.model.setProperty(Model.props.palette, value);
		this.view.setSelectTitleFromSelectedOption(View.ids.paletteSelect);
		this.controller.setPalette(value);
	}

	private onCanvasTypeSelectChange() {
		const value = this.view.getSelectValue(View.ids.canvasTypeSelect);

		this.model.setProperty(Model.props.canvasType, value);
		this.view.setSelectTitleFromSelectedOption(View.ids.canvasTypeSelect);
		this.controller.setCanvasType(value);
	}

	private onVarTextChange() {
		this.controller.changeVariable();
	}

	private onDebugInputChange() {
		const debug = this.view.getInputValue(View.ids.debugInput);

		this.model.setProperty<number>("debug", Number(debug));
		Utils.debug = Number(debug);
	}

	private onImplicitLinesInputChange() {
		const checked = this.view.getInputChecked(View.ids.implicitLinesInput);

		this.model.setProperty(Model.props.implicitLines, checked);
		this.controller.fnImplicitLines();
	}

	private onArrayBoundsInputChange() {
		const checked = this.view.getInputChecked(View.ids.arrayBoundsInput);

		this.model.setProperty(Model.props.arrayBounds, checked);
		this.controller.fnArrayBounds();
	}

	private onShowCpcInputChange() {
		if (this.controller.toggleAreaHidden(View.ids.cpcArea)) {
			this.controller.startUpdateCanvas();
		} else {
			this.controller.stopUpdateCanvas();
		}
	}

	private onShowKbdInputChange() {
		if (this.controller.toggleAreaHidden(View.ids.kbdArea)) {
			this.controller.getVirtualKeyboard(); // maybe draw it
		}
	}

	private onShowInp2InputChange() {
		this.controller.toggleAreaHidden(View.ids.inp2Area);
	}

	private onShowResultInputChange() {
		this.controller.toggleAreaHidden(View.ids.resultArea);
	}


	private onShowInputInputChange() {
		this.controller.toggleAreaHidden(View.ids.inputArea);
	}

	private onShowVariableInputChange() {
		this.controller.toggleAreaHidden(View.ids.variableArea);
	}

	private onShowOutputInputChange() {
		this.controller.toggleAreaHidden(View.ids.outputArea);
	}

	private onShowDisassInputChange() {
		this.controller.toggleAreaHidden(View.ids.disassArea);
	}

	private onShowConsoleLogInputChange() {
		this.controller.toggleAreaHidden(View.ids.consoleLogArea);
	}

	private onDisassInputChange() {
		const addressStr = this.view.getInputValue(View.ids.disassInput),
			addr = parseInt(addressStr, 16); // parse as hex

		this.controller.setDisassAddr(addr);
	}

	private onTraceInputChange() {
		const checked = this.view.getInputChecked(View.ids.traceInput);

		this.model.setProperty(Model.props.trace, checked);
		this.controller.fnTrace();
	}

	private onAutorunInputChange() {
		const checked = this.view.getInputChecked(View.ids.autorunInput);

		this.model.setProperty(Model.props.autorun, checked);
	}

	private onSoundInputChange() {
		const checked = this.view.getInputChecked(View.ids.soundInput);

		this.model.setProperty(Model.props.sound, checked);
		this.controller.setSoundActive();
	}

	private onSpeedInputChange() {
		const speed = this.view.getInputValue(View.ids.speedInput);

		this.model.setProperty<number>(Model.props.speed, Number(speed));
		this.controller.fnSpeed();
	}

	private onScreenshotButtonClick() {
		var example = this.view.getSelectValue(View.ids.exampleSelect),
			image = this.controller.startScreenshot(),
			link = View.getElementById1(View.ids.screenshotLink),
			name = example + ".png";

		if (image) {
			link.setAttribute("download", name);
			link.setAttribute("href", image);
			link.click();
		}
	}

	private onClearInputButtonClick() {
		this.view.setAreaValue(View.ids.inp2Text, ""); // delete input
	}

	private onEnterButtonClick() {
		this.controller.startEnter();
	}

	private static onFullscreenButtonClick() {
		const switched = View.requestFullscreenForId(View.ids.cpcCanvas); // make sure to use an element with tabindex set to get keyboard events

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
		this.controller.onCpcCanvasClick(event as MouseEvent);
	}

	/* eslint-disable no-invalid-this */
	private readonly handlers: Record<string, (e: Event | MouseEvent) => void> = {
		//onInputButtonClick: this.onInputButtonClick,
		//onInp2ButtonClick: this.onInp2ButtonClick,
		//onOutputButtonClick: this.onOutputButtonClick,
		//onResultButtonClick: this.onResultButtonClick,
		//onVariableButtonClick: this.onVariableButtonClick,
		//onCpcButtonClick: this.onCpcButtonClick,
		onConvertButtonClick: this.onConvertButtonClick,
		onSettingsButtonClick: this.onSettingsButtonClick,
		onViewButtonClick: this.onViewButtonClick,
		onExportButtonClick: this.onExportButtonClick,
		onGalleryButtonClick: this.onGalleryButtonClick,
		onMoreButtonClick: this.onMoreButtonClick,
		//onKbdButtonClick: this.onKbdButtonClick,
		//onConsoleButtonClick: this.onConsoleButtonClick,
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
		onReload2ButtonClick: this.onReloadButtonClick, // same as reloadButton
		onDatabaseSelectChange: this.onDatabaseSelectChange,
		onDirectorySelectChange: this.onDirectorySelectChange,
		onExampleSelectChange: this.onExampleSelectChange,
		onVarSelectChange: this.onVarSelectChange,
		onKbdLayoutSelectChange: this.onKbdLayoutSelectChange,
		onVarTextChange: this.onVarTextChange,
		onDebugInputChange: this.onDebugInputChange,
		onImplicitLinesInputChange: this.onImplicitLinesInputChange,
		onArrayBoundsInputChange: this.onArrayBoundsInputChange,

		onShowCpcInputChange: this.onShowCpcInputChange,
		onShowKbdInputChange: this.onShowKbdInputChange,
		onShowInp2InputChange: this.onShowInp2InputChange,
		onShowResultInputChange: this.onShowResultInputChange,
		onShowInputInputChange: this.onShowInputInputChange,
		onShowVariableInputChange: this.onShowVariableInputChange,
		onShowOutputInputChange: this.onShowOutputInputChange,
		onShowDisassInputChange: this.onShowDisassInputChange,
		onShowConsoleLogInputChange: this.onShowConsoleLogInputChange,

		onDisassInputChange: this.onDisassInputChange,
		onTraceInputChange: this.onTraceInputChange,
		onAutorunInputChange: this.onAutorunInputChange,
		onSoundInputChange: this.onSoundInputChange,
		onSpeedInputChange: this.onSpeedInputChange,
		onBasicVersionSelectChange: this.onBasicVersionSelectChange,
		onCanvasTypeSelectChange: this.onCanvasTypeSelectChange,
		onPaletteSelectChange: this.onPaletteSelectChange,
		onScreenshotButtonClick: this.onScreenshotButtonClick,
		onClearInputButtonClick: this.onClearInputButtonClick,
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
			if (id !== View.ids.cpcCanvas && id !== View.ids.textText) {
				this.onWindowClick(event);
			}
		}
	}
}
