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

export type EventDefType = {
	id: ViewID
	viewType?: string // "checked", "select", "input", "numberInput"
	toggleId?: ViewID
	property?: ModelPropID
	display?: string
	isPopover?: boolean
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

	private initOneToggle(_type: string, id: ViewID, eventDef: EventDefType) {
		if (eventDef.property) {
			if (eventDef.toggleId) {
				const isEnabled = this.model.getProperty<boolean>(eventDef.property);

				this.view.setHidden(eventDef.toggleId, !isEnabled, eventDef.display);
				if (Utils.debug > 3) {
					Utils.console.debug("initToggles: setHidden: togglId:", eventDef.toggleId, ", property:", eventDef.property, ", hidden:", !isEnabled, ", display:", eventDef.display);
				}
			}

			if (eventDef.viewType === "checked") {
				const isEnabled2 = this.model.getProperty<boolean>(eventDef.property);

				this.view.setInputChecked(id, isEnabled2);
				if (Utils.debug > 3) {
					Utils.console.debug("initToggles: checked: id:", id, ", property:", eventDef.property, ", checked:", isEnabled2);
				}
			} else if (eventDef.viewType === "select") {
				const value = this.model.getProperty<string>(eventDef.property);

				this.view.setSelectValue(id, value);
				if (Utils.debug > 3) {
					Utils.console.debug("initToggles: select: id:", id, ", property:", eventDef.property, ", value:", value);
				}
			} else if (eventDef.viewType === "numberInput") {
				const value = this.model.getProperty<number>(eventDef.property);

				this.view.setInputValue(id, String(value));
				if (Utils.debug > 3) {
					Utils.console.debug("initToggles: numberInput: id:", id, ", property:", eventDef.property, ", value:", value);
				}
			}
		}
	}

	initToggles(): void {
		const eventDefInternalMap = this.eventDefInternalMap;

		for (const type in eventDefInternalMap) {
			if (eventDefInternalMap.hasOwnProperty(type)) {
				const eventDefMap4Type = eventDefInternalMap[type];

				for (const id in eventDefMap4Type) {
					if (eventDefMap4Type.hasOwnProperty(id)) {
						const eventDef = eventDefMap4Type[id as ViewID];

						this.initOneToggle(type, id as ViewID, eventDef);
					}
				}
			}
		}
	}

	private static getToggleId(eventDef: EventDefType) {
		if (!eventDef.toggleId) {
			Utils.console.error("getToggleId: id=" + eventDef.id + ": toggleId missing!");
			return "" as ViewID; //TTT
		}
		return eventDef.toggleId;
	}

	private static getproperty(eventDef: EventDefType) {
		if (!eventDef.property) {
			Utils.console.error("setPopoversHiddenExcept: id=" + eventDef.id + ": property missing!");
			return "" as ModelPropID; //TTT
		}
		return eventDef.property;
	}

	setPopoversHiddenExcept(exceptId?: ViewID): void {
		const eventDefInternalMap = this.eventDefInternalMap,
			eventDefMapClick = eventDefInternalMap.click;

		for (const id in eventDefMapClick) {
			if (eventDefMapClick.hasOwnProperty(id)) {
				const eventDef = eventDefMapClick[id as ViewID];

				if (eventDef.isPopover && (eventDef.toggleId !== exceptId)) {
					const toggleId = CommonEventHandler.getToggleId(eventDef),
						property = CommonEventHandler.getproperty(eventDef);

					if (!this.view.getHidden(toggleId)) {
						// we cannot use toggleAreaHidden because it would be recursive
						this.model.setProperty(property, false);
						this.view.setHidden(toggleId, true, eventDef.display);
					}
				}
			}
		}
	}

	private toggleAreaHidden(eventDef: EventDefType): boolean {
		const toggleId = CommonEventHandler.getToggleId(eventDef),
			property = CommonEventHandler.getproperty(eventDef),
			visible = !this.model.getProperty<boolean>(property);

		this.model.setProperty(property, visible);
		this.view.setHidden(toggleId, !visible, eventDef.display);

		// on old browsers display "flex" is not available, so set default "" (="block"), if still hidden
		if (visible && eventDef.display === "flex" && this.view.getHidden(toggleId)) {
			this.view.setHidden(toggleId, !visible);
		}

		if (visible && eventDef.isPopover) {
			this.setPopoversHiddenExcept(toggleId);
		}

		return visible;
	}

	// maybe we can avoid this...
	getEventDefById(type: string, id: ViewID): EventDefType {
		const eventDefForType = this.eventDefInternalMap[type],
			eventDef = eventDefForType[id];

		if (!eventDef) {
			Utils.console.error("getEventDefById: type=" + type + ", id=" + id + ": No eventDef!");
		}
		return eventDef;
	}

	toggleAreaHiddenById(type: string, id: ViewID): boolean {
		const eventDef = this.getEventDefById(type, id);

		return this.toggleAreaHidden(eventDef);
	}

	private onCheckedChange(eventDef: EventDefType) {
		const id = eventDef.id,
			property = CommonEventHandler.getproperty(eventDef),
			checked = this.view.getInputChecked(id);

		this.model.setProperty(property, checked);
		return checked;
	}

	private onNumberInputChange(eventDef: EventDefType) {
		const id = eventDef.id,
			property = CommonEventHandler.getproperty(eventDef),
			valueAsString = this.view.getInputValue(id),
			value = Number(valueAsString);

		this.model.setProperty(property, value);
		return value;
	}

	private onSelectChange(eventDef: EventDefType) {
		const id = eventDef.id,
			property = CommonEventHandler.getproperty(eventDef),
			value = this.view.getSelectValue(id);

		this.model.setProperty(property, value);
		this.view.setSelectTitleFromSelectedOption(id);
		return value;
	}


	private onExportButtonClick(eventDef: EventDefType) {
		if (this.toggleAreaHidden(eventDef)) {
			this.controller.setExportSelectOptions(ViewID.exportFileSelect);
		}
	}

	private onGalleryButtonClick(eventDef: EventDefType) {
		if (this.toggleAreaHidden(eventDef)) {
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

	private onContinueButtonClick(eventDef: EventDefType, event: Event) {
		this.controller.startContinue();
		this.onCpcCanvasClick(eventDef, event as MouseEvent);
	}

	private onParseRunButtonClick(eventDef: EventDefType, event: Event) {
		this.controller.startParseRun();
		this.onCpcCanvasClick(eventDef, event as MouseEvent);
	}

	private static onHelpButtonClick() {
		window.open("https://github.com/benchmarko/CPCBasicTS/#readme");
	}

	private onGalleryItemClick(_eventDef: EventDefType, event: Event) {
		const target = View.getEventTarget<HTMLInputElement>(event),
			value = target.value;

		this.view.setSelectValue(ViewID.exampleSelect, value);
		this.setPopoversHiddenExcept(); // close

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
		this.setPopoversHiddenExcept(); // hide all popovers,

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

	onKbdLayoutSelectChange(eventDef: EventDefType): void {
		const value = this.onSelectChange(eventDef);

		this.view.setHidden(ViewID.kbdAlpha, value === "num");
		this.view.setHidden(ViewID.kbdNum, value === "alpha");
	}

	private onBasicVersionSelectChange(eventDef: EventDefType) {
		const value = this.onSelectChange(eventDef);

		this.controller.setBasicVersion(value);
	}

	private onPaletteSelectChange(eventDef: EventDefType) {
		const value = this.onSelectChange(eventDef);

		this.controller.setPalette(value);
	}

	private onCanvasTypeSelectChange(eventDef: EventDefType) {
		const value = this.onSelectChange(eventDef);

		this.controller.setCanvasType(value);
	}

	private onDebugInputChange(eventDef: EventDefType) {
		const value = this.onNumberInputChange(eventDef);

		Utils.debug = value;
	}

	private onDragElementsInputChange(eventDef: EventDefType) {
		const checked = this.onCheckedChange(eventDef);

		this.controller.fnDragElementsActive(checked);
	}

	private onShowCpcInputChange(eventDef: EventDefType) {
		if (this.toggleAreaHidden(eventDef)) {
			this.controller.startUpdateCanvas();
		} else {
			this.controller.stopUpdateCanvas();
		}
	}

	private onShowKbdInputChange(eventDef: EventDefType) {
		if (this.toggleAreaHidden(eventDef)) {
			this.controller.getVirtualKeyboard(); // maybe draw it
		}
	}

	private onDisassInputChange() {
		const addressStr = this.view.getInputValue(ViewID.disassInput),
			addrList = addressStr.split("-"), // maybe range
			addr = parseInt(addrList[0], 16), // parse as hex
			endAddr = addrList[1] ? parseInt(addrList[1], 16) : undefined; // parse as hex

		this.controller.setDisassAddr(addr, endAddr);
	}

	private onSoundInputChange(eventDef: EventDefType) {
		this.onCheckedChange(eventDef);
		this.controller.setSoundActive();
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

	private onFullscreenButtonClick() {
		let id: ViewID | undefined;

		if (!this.view.getHidden(ViewID.cpcCanvas)) {
			id = ViewID.cpcCanvas;
		} else if (!this.view.getHidden(ViewID.textText)) {
			// for ViewID.textText (textArea), we use the surrounding div...
			id = ViewID.textCanvasDiv;
		} else {
			Utils.console.warn("Fullscreen only possible for graphics or text canvas");
			return;
		}

		const switched = this.view.requestFullscreenForId(id); // make sure to use an element with tabindex set to get keyboard events

		if (!switched) {
			Utils.console.warn("Switch to fullscreen not available");
		}
	}

	private onCpcCanvasClick(_eventDef: EventDefType, event: MouseEvent) {
		this.setPopoversHiddenExcept(); // hide all popovers
		this.controller.onCpcCanvasClick(event);
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
						toggleId: ViewID.convertArea,
						property: ModelPropID.showConvert,
						display: "flex",
						isPopover: true,
						func: this.toggleAreaHidden
					},
					{
						id: ViewID.cpcCanvas,
						func: this.onCpcCanvasClick
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
						toggleId: ViewID.exportArea,
						property: ModelPropID.showExport,
						display: "flex",
						isPopover: true,
						func: this.onExportButtonClick
					},
					{
						id: ViewID.fullscreenButton,
						func: this.onFullscreenButtonClick
					},
					{
						id: ViewID.galleryButton,
						toggleId: ViewID.galleryArea,
						property: ModelPropID.showGallery,
						display: "flex",
						isPopover: true,
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
						toggleId: ViewID.moreArea,
						property: ModelPropID.showMore,
						display: "flex",
						isPopover: true,
						func: this.toggleAreaHidden
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
						id: ViewID.reload2Button,
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
						toggleId: ViewID.settingsArea,
						property: ModelPropID.showSettings,
						display: "flex",
						isPopover: true,
						func: this.toggleAreaHidden
					},
					{
						id: ViewID.stopButton,
						controllerFunc: this.controller.startBreak
					},
					{
						id: ViewID.textText,
						func: this.onCpcCanvasClick // same as for cpcCanvas
					},
					{
						id: ViewID.undoButton,
						func: this.onUndoButtonClick
					},
					{
						id: ViewID.viewButton,
						toggleId: ViewID.viewArea,
						property: ModelPropID.showView,
						display: "flex",
						isPopover: true,
						func: this.toggleAreaHidden
					},
					{
						id: ViewID.window, //TTT do we need this?
						controllerFunc: this.controller.onWindowClick
					}
				],
				change: [
					{
						id: ViewID.arrayBoundsInput,
						viewType: "checked",
						property: ModelPropID.arrayBounds,
						func: this.onCheckedChange,
						controllerFunc: this.controller.fnArrayBounds
					},
					{
						id: ViewID.autorunInput,
						viewType: "checked",
						property: ModelPropID.autorun,
						func: this.onCheckedChange
					},
					{
						id: ViewID.basicVersionSelect,
						viewType: "select",
						property: ModelPropID.basicVersion,
						func: this.onBasicVersionSelectChange
					},
					{
						id: ViewID.canvasTypeSelect,
						viewType: "select",
						property: ModelPropID.canvasType,
						func: this.onCanvasTypeSelectChange
					},
					{
						id: ViewID.databaseSelect,
						controllerFunc: this.controller.onDatabaseSelectChange
					},
					{
						id: ViewID.debugInput,
						viewType: "numberInput",
						property: ModelPropID.debug,
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
						viewType: "checked",
						property: ModelPropID.implicitLines,
						func: this.onCheckedChange,
						controllerFunc: this.controller.fnImplicitLines
					},
					{
						id: ViewID.integerOverflowInput,
						viewType: "checked",
						property: ModelPropID.integerOverflow,
						func: this.onCheckedChange,
						controllerFunc: this.controller.fnIntegerOverflow
					},
					{
						id: ViewID.kbdLayoutSelect,
						viewType: "select",
						property: ModelPropID.kbdLayout,
						func: this.onKbdLayoutSelectChange
					},
					{
						id: ViewID.dragElementsInput,
						viewType: "checked",
						property: ModelPropID.dragElements,
						func: this.onDragElementsInputChange
					},
					{
						id: ViewID.outputText,
						controllerFunc: this.controller.invalidateScript
					},
					{
						id: ViewID.paletteSelect,
						viewType: "select",
						property: ModelPropID.palette,
						func: this.onPaletteSelectChange
					},
					{
						id: ViewID.showConsoleLogInput,
						viewType: "checked",
						toggleId: ViewID.consoleLogArea,
						property: ModelPropID.showConsoleLog,
						func: this.toggleAreaHidden
					},
					{
						id: ViewID.showCpcInput,
						viewType: "checked",
						toggleId: ViewID.cpcArea,
						property: ModelPropID.showCpc,
						func: this.onShowCpcInputChange
					},
					{
						id: ViewID.showDisassInput,
						viewType: "checked",
						toggleId: ViewID.disassArea,
						property: ModelPropID.showDisass,
						func: this.toggleAreaHidden
					},
					{
						id: ViewID.showInp2Input,
						viewType: "checked",
						toggleId: ViewID.inp2Area,
						property: ModelPropID.showInp2,
						func: this.toggleAreaHidden
					},
					{
						id: ViewID.showInputInput,
						viewType: "checked",
						toggleId: ViewID.inputArea,
						property: ModelPropID.showInput,
						func: this.toggleAreaHidden
					},
					{
						id: ViewID.showKbdInput,
						viewType: "checked",
						toggleId: ViewID.kbdArea,
						property: ModelPropID.showKbd,
						func: this.onShowKbdInputChange
					},
					{
						id: ViewID.showOutputInput,
						viewType: "checked",
						toggleId: ViewID.outputArea,
						property: ModelPropID.showOutput,
						func: this.toggleAreaHidden
					},
					{
						id: ViewID.showResultInput,
						viewType: "checked",
						toggleId: ViewID.resultArea,
						property: ModelPropID.showResult,
						func: this.toggleAreaHidden
					},
					{
						id: ViewID.showVariableInput,
						viewType: "checked",
						toggleId: ViewID.variableArea,
						property: ModelPropID.showVariable,
						func: this.toggleAreaHidden
					},
					{
						id: ViewID.soundInput,
						viewType: "checked",
						property: ModelPropID.sound,
						func: this.onSoundInputChange
					},
					{
						id: ViewID.speedInput,
						viewType: "numberInput",
						property: ModelPropID.speed,
						func: this.onNumberInputChange,
						controllerFunc: this.controller.fnSpeed
					},
					{
						id: ViewID.traceInput,
						viewType: "checked",
						property: ModelPropID.trace,
						func: this.onCheckedChange,
						controllerFunc: this.controller.fnTrace
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
					eventDef.func.call(this, eventDef, event);
				}
				if (eventDef.controllerFunc) {
					eventDef.controllerFunc.call(this.controller, eventDef, event);
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
