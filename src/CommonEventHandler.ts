// CommonEventHandler.ts - Common event handler for browser events
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/

import { ModelPropID, ViewID } from "./Constants";
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

	private onConvertButtonClick() {
		this.controller.toggleAreaHidden(ViewID.convertArea);
	}

	private onSettingsButtonClick() {
		this.controller.toggleAreaHidden(ViewID.settingsArea);
	}

	private onViewButtonClick() {
		this.controller.toggleAreaHidden(ViewID.viewArea);
	}

	private onExportButtonClick() {
		this.controller.toggleAreaHidden(ViewID.exportArea);
	}

	private onGalleryButtonClick() {
		if (this.controller.toggleAreaHidden(ViewID.galleryArea)) {
			this.controller.setGalleryAreaInputs();
		}
	}

	private onMoreButtonClick() {
		this.controller.toggleAreaHidden(ViewID.moreArea);
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
		this.view.setAreaValue(ViewID.outputText, "");
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

		this.view.setSelectValue(ViewID.exampleSelect, value);
		this.controller.toggleAreaHidden(ViewID.galleryArea); // close

		this.onExampleSelectChange();
	}

	private static onNothing() {
		// nothing
	}

	// eslint-disable-next-line class-methods-use-this
	private onCopyTextButtonClick() {
		const textText = View.getElementByIdAs<HTMLTextAreaElement>(ViewID.textText);

		textText.select();

		this.view.setAreaSelection(ViewID.textText, 0, 99999); // for mobile devices
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
		this.controller.setPopoversHiddenExcept(); // hide all popovers,

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
		const par = this.view.getSelectValue(ViewID.varSelect),
			value = this.controller.getVariable(par),
			valueString = (value !== undefined) ? String(value) : "";

		this.view.setAreaValue(ViewID.varText, valueString);
	}

	onKbdLayoutSelectChange(): void {
		const value = this.view.getSelectValue(ViewID.kbdLayoutSelect);

		this.model.setProperty(ModelPropID.kbdLayout, value);
		this.view.setSelectTitleFromSelectedOption(ViewID.kbdLayoutSelect);

		this.view.setHidden(ViewID.kbdAlpha, value === "num");
		this.view.setHidden(ViewID.kbdNum, value === "alpha");
	}

	private onBasicVersionSelectChange() {
		const value = this.view.getSelectValue(ViewID.basicVersionSelect);

		this.model.setProperty(ModelPropID.basicVersion, value);
		this.view.setSelectTitleFromSelectedOption(ViewID.basicVersionSelect);
		this.controller.setBasicVersion(value);
	}

	private onPaletteSelectChange() {
		const value = this.view.getSelectValue(ViewID.paletteSelect);

		this.model.setProperty(ModelPropID.palette, value);
		this.view.setSelectTitleFromSelectedOption(ViewID.paletteSelect);
		this.controller.setPalette(value);
	}

	private onCanvasTypeSelectChange() {
		const value = this.view.getSelectValue(ViewID.canvasTypeSelect);

		this.model.setProperty(ModelPropID.canvasType, value);
		this.view.setSelectTitleFromSelectedOption(ViewID.canvasTypeSelect);
		this.controller.setCanvasType(value);
	}

	private onVarTextChange() {
		this.controller.changeVariable();
	}

	private onDebugInputChange() {
		const debug = this.view.getInputValue(ViewID.debugInput);

		this.model.setProperty<number>(ModelPropID.debug, Number(debug));
		Utils.debug = Number(debug);
	}

	private onImplicitLinesInputChange() {
		const checked = this.view.getInputChecked(ViewID.implicitLinesInput);

		this.model.setProperty(ModelPropID.implicitLines, checked);
		this.controller.fnImplicitLines();
	}

	private onArrayBoundsInputChange() {
		const checked = this.view.getInputChecked(ViewID.arrayBoundsInput);

		this.model.setProperty(ModelPropID.arrayBounds, checked);
		this.controller.fnArrayBounds();
	}

	private onShowCpcInputChange() {
		if (this.controller.toggleAreaHidden(ViewID.cpcArea)) {
			this.controller.startUpdateCanvas();
		} else {
			this.controller.stopUpdateCanvas();
		}
	}

	private onShowKbdInputChange() {
		if (this.controller.toggleAreaHidden(ViewID.kbdArea)) {
			this.controller.getVirtualKeyboard(); // maybe draw it
		}
	}

	private onShowInp2InputChange() {
		this.controller.toggleAreaHidden(ViewID.inp2Area);
	}

	private onShowResultInputChange() {
		this.controller.toggleAreaHidden(ViewID.resultArea);
	}


	private onShowInputInputChange() {
		this.controller.toggleAreaHidden(ViewID.inputArea);
	}

	private onShowVariableInputChange() {
		this.controller.toggleAreaHidden(ViewID.variableArea);
	}

	private onShowOutputInputChange() {
		this.controller.toggleAreaHidden(ViewID.outputArea);
	}

	private onShowDisassInputChange() {
		this.controller.toggleAreaHidden(ViewID.disassArea);
	}

	private onShowConsoleLogInputChange() {
		this.controller.toggleAreaHidden(ViewID.consoleLogArea);
	}

	private onDisassInputChange() {
		const addressStr = this.view.getInputValue(ViewID.disassInput),
			addr = parseInt(addressStr, 16); // parse as hex

		this.controller.setDisassAddr(addr);
	}

	private onTraceInputChange() {
		const checked = this.view.getInputChecked(ViewID.traceInput);

		this.model.setProperty(ModelPropID.trace, checked);
		this.controller.fnTrace();
	}

	private onAutorunInputChange() {
		const checked = this.view.getInputChecked(ViewID.autorunInput);

		this.model.setProperty(ModelPropID.autorun, checked);
	}

	private onSoundInputChange() {
		const checked = this.view.getInputChecked(ViewID.soundInput);

		this.model.setProperty(ModelPropID.sound, checked);
		this.controller.setSoundActive();
	}

	private onSpeedInputChange() {
		const speed = this.view.getInputValue(ViewID.speedInput);

		this.model.setProperty<number>(ModelPropID.speed, Number(speed));
		this.controller.fnSpeed();
	}

	private onScreenshotButtonClick() {
		var example = this.view.getSelectValue(ViewID.exampleSelect),
			image = this.controller.startScreenshot(),
			link = View.getElementById1(ViewID.screenshotLink),
			name = example + ".png";

		if (image) {
			link.setAttribute("download", name);
			link.setAttribute("href", image);
			link.click();
		}
	}

	private onClearInputButtonClick() {
		this.view.setAreaValue(ViewID.inp2Text, ""); // delete input
	}

	private onEnterButtonClick() {
		this.controller.startEnter();
	}

	private static onFullscreenButtonClick() {
		const switched = View.requestFullscreenForId(ViewID.cpcCanvas); // make sure to use an element with tabindex set to get keyboard events

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
		onConvertButtonClick: this.onConvertButtonClick,
		onSettingsButtonClick: this.onSettingsButtonClick,
		onViewButtonClick: this.onViewButtonClick,
		onExportButtonClick: this.onExportButtonClick,
		onGalleryButtonClick: this.onGalleryButtonClick,
		onMoreButtonClick: this.onMoreButtonClick,
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
		} else if ((target.getAttribute("data-key") !== null) && (event && event.currentTarget && (event.currentTarget as HTMLElement).id !== ViewID.kbdAreaInner)) { // only for virtual buttons activated by keyboard (enter, space)
			this.controller.onVirtualKeyBoardClick(event); // e.g with enter
		} else if (Utils.debug) {
			Utils.console.debug("Event handler for", type, "unknown target:", target.tagName, target.id);
		}

		if (type === "click") { // special
			if (id !== ViewID.cpcCanvas && id !== ViewID.textText) {
				this.onWindowClick(event);
			}
		}
	}
}
