// CommonEventHandler.ts - Common event handler for browser events
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/

import { ModelPropID, ViewID } from "./Constants";
import { Utils } from "./Utils";
import { IController } from "./Interfaces";
import { Model, ConfigType } from "./Model";
import { View } from "./View";

interface CommonEventHandlerOptions {
	model: Model,
	view: View,
	controller: IController
}

type EventDefType = {
	id: ViewID,
	toggleId?: ViewID;
	func?: Function // eslint-disable-line @typescript-eslint/ban-types
	controllerFunc?: Function // eslint-disable-line @typescript-eslint/ban-types
}

type EventDefMapType = Record<string, EventDefType[]>;


export class CommonEventHandler implements EventListenerObject {
	private readonly options: CommonEventHandlerOptions;

	private readonly model: Model;
	private readonly view: View;
	private readonly controller: IController;

	private readonly eventDefInternalMap: Record<string, Record<ViewID, EventDefType>> = {};

	private fnUserAction: ((event: Event, id: string) => void) | undefined = undefined;

	constructor(options: CommonEventHandlerOptions) {
		this.options = {} as CommonEventHandlerOptions;
		this.setOptions(options);

		// copy for easy access:
		this.model = this.options.model;
		this.view = this.options.view;
		this.controller = this.options.controller;

		this.createEventDefMap();
	}

	getOptions(): CommonEventHandlerOptions {
		return this.options;
	}

	private setOptions(options: Partial<CommonEventHandlerOptions>): void {
		Object.assign(this.options, options);
	}

	fnSetUserAction(fnAction: ((event: Event, id: string) => void) | undefined): void {
		this.fnUserAction = fnAction;
	}

	private onGalleryButtonClick() {
		if (this.controller.toggleAreaHidden(ViewID.galleryArea)) {
			this.controller.setGalleryAreaInputs();
		}
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

	private onContinueButtonClick(event: Event) {
		this.controller.startContinue();
		this.controller.onCpcCanvasClick(event as MouseEvent);
	}

	private onParseRunButtonClick(event: Event) {
		this.controller.startParseRun();
		this.controller.onCpcCanvasClick(event as MouseEvent);
	}

	private static onHelpButtonClick() {
		window.open("https://github.com/benchmarko/CPCBasicTS/#readme");
	}

	private onGalleryItemClick(event: Event) {
		const target = View.getEventTarget<HTMLInputElement>(event),
			value = target.value;

		this.view.setSelectValue(ViewID.exampleSelect, value);
		this.controller.toggleAreaHidden(ViewID.galleryArea); // close

		this.controller.onExampleSelectChange();
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
		this.controller.setPopoversHiddenExcept(); // hide all popovers,

		const changed = this.model.getChangedProperties();
		let paras = CommonEventHandler.encodeUriParam(changed);

		paras = paras.replace(/%2[Ff]/g, "/"); // unescape %2F -> /
		window.location.search = "?" + paras;
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

	private static onFullscreenButtonClick() {
		const switched = View.requestFullscreenForId(ViewID.cpcCanvas); // make sure to use an element with tabindex set to get keyboard events

		if (!switched) {
			Utils.console.warn("Switch to fullscreen not available");
		}
	}

	private createEventDefMap() {
		const eventDefInternalMap = this.eventDefInternalMap,
			eventDefs: EventDefMapType = {
				click: [
					{
						id: ViewID.clearInputButton,
						func: this.onClearInputButtonClick
					},
					{
						id: ViewID.continueButton,
						func: this.onContinueButtonClick
					},
					{
						id: ViewID.convertButton,
						toggleId: ViewID.convertArea
					},
					{
						id: ViewID.cpcCanvas,
						controllerFunc: this.controller.onCpcCanvasClick
					},
					{
						id: ViewID.copyTextButton,
						func: this.onCopyTextButtonClick
					},
					{
						id: ViewID.downloadButton,
						controllerFunc: this.controller.fnDownload
					},
					{
						id: ViewID.enterButton,
						controllerFunc: this.controller.startEnter
					},
					{
						id: ViewID.exportButton,
						toggleId: ViewID.exportArea
					},
					{
						id: ViewID.fullscreenButton,
						func: CommonEventHandler.onFullscreenButtonClick
					},
					{
						id: ViewID.galleryButton,
						func: this.onGalleryButtonClick
					},
					{
						id: ViewID.galleryItem,
						func: this.onGalleryItemClick
					},
					{
						id: ViewID.helpButton,
						func: CommonEventHandler.onHelpButtonClick
					},
					{
						id: ViewID.lineNumberAddButton,
						controllerFunc: this.controller.fnAddLines
					},
					{
						id: ViewID.lineNumberRemoveButton,
						controllerFunc: this.controller.fnRemoveLines
					},
					{
						id: ViewID.moreButton,
						toggleId: ViewID.moreArea
					},
					{
						id: ViewID.parseButton,
						controllerFunc: this.controller.startParse
					},
					{
						id: ViewID.parseRunButton,
						func: this.onParseRunButtonClick
					},
					{
						id: ViewID.prettyButton,
						controllerFunc: this.controller.fnPretty
					},
					{
						id: ViewID.redoButton,
						func: this.onRedoButtonClick
					},
					{
						id: ViewID.reloadButton,
						func: this.onReloadButtonClick
					},
					{
						id: ViewID.reloadButton2,
						func: this.onReloadButtonClick // same as relaodButton
					},
					{
						id: ViewID.renumButton,
						controllerFunc: this.controller.startRenum
					},
					{
						id: ViewID.resetButton,
						controllerFunc: this.controller.startReset
					},
					{
						id: ViewID.runButton,
						controllerFunc: this.controller.startRun
					},
					{
						id: ViewID.screenshotButton,
						func: this.onScreenshotButtonClick
					},
					{
						id: ViewID.screenshotLink // nothing
					},
					{
						id: ViewID.settingsButton,
						toggleId: ViewID.settingsArea
					},
					{
						id: ViewID.stopButton,
						controllerFunc: this.controller.startBreak
					},
					{
						id: ViewID.textText,
						controllerFunc: this.controller.onCpcCanvasClick // same as for cpcCanvas
					},
					{
						id: ViewID.undoButton,
						func: this.onUndoButtonClick
					},
					{
						id: ViewID.viewButton,
						toggleId: ViewID.viewArea
					},
					{
						id: ViewID.window,
						controllerFunc: this.controller.onWindowClick
					}
				],
				change: [
					{
						id: ViewID.arrayBoundsInput,
						func: this.onArrayBoundsInputChange
					},
					{
						id: ViewID.autorunInput,
						func: this.onAutorunInputChange
					},
					{
						id: ViewID.basicVersionSelect,
						func: this.onBasicVersionSelectChange
					},
					{
						id: ViewID.canvasTypeSelect,
						func: this.onCanvasTypeSelectChange
					},
					{
						id: ViewID.databaseSelect,
						controllerFunc: this.controller.onDatabaseSelectChange
					},
					{
						id: ViewID.debugInput,
						func: this.onDebugInputChange
					},
					{
						id: ViewID.directorySelect,
						controllerFunc: this.controller.onDirectorySelectChange
					},
					{
						id: ViewID.disassInput,
						func: this.onDisassInputChange
					},
					{
						id: ViewID.exampleSelect,
						controllerFunc: this.controller.onExampleSelectChange
					},
					{
						id: ViewID.implicitLinesInput,
						func: this.onImplicitLinesInputChange
					},
					{
						id: ViewID.kbdLayoutSelect,
						func: this.onKbdLayoutSelectChange
					},
					{
						id: ViewID.outputText,
						controllerFunc: this.controller.invalidateScript
					},
					{
						id: ViewID.paletteSelect,
						func: this.onPaletteSelectChange
					},
					{
						id: ViewID.showConsoleLogInput,
						toggleId: ViewID.consoleLogArea
					},
					{
						id: ViewID.showCpcInput,
						func: this.onShowCpcInputChange
					},
					{
						id: ViewID.showDisassInput,
						toggleId: ViewID.disassArea
					},
					{
						id: ViewID.showInp2Input,
						toggleId: ViewID.inp2Area
					},
					{
						id: ViewID.showInputInput,
						toggleId: ViewID.inputArea
					},
					{
						id: ViewID.showKbdInput,
						func: this.onShowKbdInputChange
					},
					{
						id: ViewID.showOutputInput,
						toggleId: ViewID.outputArea
					},
					{
						id: ViewID.showResultInput,
						toggleId: ViewID.resultArea
					},
					{
						id: ViewID.showVariableInput,
						toggleId: ViewID.variableArea
					},
					{
						id: ViewID.soundInput,
						func: this.onSoundInputChange
					},
					{
						id: ViewID.speedInput,
						func: this.onSpeedInputChange
					},
					{
						id: ViewID.traceInput,
						func: this.onTraceInputChange
					},
					{
						id: ViewID.varSelect,
						func: this.onVarSelectChange
					},
					{
						id: ViewID.varText,
						controllerFunc: this.controller.changeVariable
					}
				]
			};

		for (const type in eventDefs) {
			if (eventDefs.hasOwnProperty(type)) {
				eventDefInternalMap[type] = {} as Record<ViewID, EventDefType>;
				const eventDefList = eventDefs[type],
					itemForType = eventDefInternalMap[type];

				for (let i = 0; i < eventDefList.length; i += 1) {
					itemForType[eventDefList[i].id] = eventDefList[i];
				}
			}
		}
	}

	handleEvent(event: Event): void { // eslint-disable-line complexity
		const target = View.getEventTarget<HTMLButtonElement>(event),
			type = event.type; // click or change
		let	id = (target) ? target.getAttribute("id") as string : String(target);

		if (this.fnUserAction) {
			this.fnUserAction(event, id);
		}

		if (id) {
			if (target.disabled) { // check needed for IE which also fires for disabled buttons
				return; // ignore
			}

			if (id.startsWith("galleryItem")) {
				id = "galleryItem"; // replace galleryitem<num> by galleryitem
			}

			if (this.eventDefInternalMap[type] && this.eventDefInternalMap[type][id as ViewID]) {
				const eventDef = this.eventDefInternalMap[type][id as ViewID];

				if (Utils.debug) {
					Utils.console.debug("handleEvent: " + type + ", " + id + ":", eventDef);
				}
				if (eventDef.func) {
					eventDef.func.call(this, event, eventDef);
				} else if (eventDef.controllerFunc) {
					eventDef.controllerFunc.call(this.controller, event, eventDef);
				} else if (eventDef.toggleId) {
					this.controller.toggleAreaHidden(eventDef.toggleId);
				}
			} else if (!id.endsWith("Select") && !id.endsWith("Input")) { // do not print all messages; these are usually handled by change
				Utils.console.log("handleEvent: " + type + ", " + id + ": No handler");
			}
		} else if (Utils.debug) {
			Utils.console.log("handleEvent: " + type + ": unknown target:", target.tagName, target.id);
		}

		if (type === "click") { // special
			if (id !== ViewID.cpcCanvas && id !== ViewID.textText) {
				this.controller.onWindowClick(event);
			}
		}
	}
}
