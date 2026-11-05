// Controller0.ts - Controller
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//


import { Utils } from "./Utils";
import { BasicFormatter } from "./BasicFormatter";
import { BasicLexer } from "./BasicLexer";
import { BasicParser } from "./BasicParser";
import { BasicTokenizer } from "./BasicTokenizer";
import { CodeGeneratorBasic } from "./CodeGeneratorBasic";
import { CodeGeneratorToken } from "./CodeGeneratorToken";
import { CpcVm, type FileMeta } from "./CpcVm";
import { DiskImage } from "./DiskImage";
import { FileHandler } from "./FileHandler";
import type { ExampleLoadOptions, ICanvasVm, ICore, IKeyboard, IStorage, IOutput, IRuntimeController, ISound, RenumOptions, RuntimeCallbacks, RuntimeHost, VariableValue, VmBaseParas, VmFileParas, VmInputParas, VmLineParas, VmLineRenumParas } from "./Interfaces";
import { ModelPropID } from "./Constants";
import { Random } from "./Random";
import { RsxAmsdos } from "./RsxAmsdos";
import { RsxCpcBasic } from "./RsxCpcBasic";
import { Snapshot } from "./Snapshot";
import { Variables } from "./Variables";
import { Diff } from "./Diff";
import type { ExecutionState } from "./ExecutionState";
import { Runtime } from "./Runtime";

/*
import { ModelPropID, ViewID } from "./Constants";
import { UiUtils } from "./UiUtils";
import { BasicFormatter } from "../BasicFormatter";
import { BasicLexer } from "../BasicLexer";
import { BasicParser } from "../BasicParser";
import { BasicTokenizer } from "../BasicTokenizer";
import { Canvas } from "./Canvas";
import { CodeGeneratorBasic } from "../CodeGeneratorBasic";
import { CodeGeneratorJs } from "../CodeGeneratorJs";
import { CodeGeneratorToken } from "../CodeGeneratorToken";
import { cpcCharset } from "../cpcCharset";
import { CpcVm, FileMeta, VmStopEntry } from "../CpcVm";
import { Diff } from "../Diff";
import { DiskImage } from "../DiskImage";
import { FileHandler } from "./FileHandler";
import { FileSelect } from "./FileSelect";
import { InputStack } from "../InputStack";
import type { CustomError, ICore, IModel, IOutput, LoadScriptFn, SoundData, VmFileParas, VmInputParas, VmLineParas, VmLineRenumParas, VmBaseParas, VariableValue } from "../Interfaces";
import type { ICanvas, IController } from "./UiInterfaces";
import { Keyboard } from "./Keyboard";
import { NoCanvas } from "./NoCanvas";
import { TextCanvas } from "./TextCanvas";
import { VirtualKeyboard } from "./VirtualKeyboard";
import { Snapshot } from "../Snapshot";
import { Sound } from "./Sound";
import { Variables } from "../Variables";
import { View, SelectOptionElement, AreaInputElement } from "./View";
import { DragElement, DragElementOptions } from "./DragElement";
import { Random } from "../Random";
import { RsxAmsdos } from "../RsxAmsdos";
import { RsxCpcBasic } from "../RsxCpcBasic";
import { UiController } from "./UiController";
import { Z80Disass } from "../Z80Disass"; // test
*/

export interface ControllerOptions0 extends RuntimeHost, RuntimeCallbacks {
	canvas: ICanvasVm
	keyboard: IKeyboard
	sound: ISound
	isHeadlessDirectInput?: boolean
	console: any, //TTT
}

/*
export interface ControllerOptions {
	isHeadlessDirectInput?: boolean
	onResultText?: (value: string) => void
	onOutputText?: (value: string) => void
	onProgramEnd?: () => void
	loadScript?: LoadScriptFn
}
*/

export class Controller0 implements IRuntimeController {
	//private readonly fnWaitKeyHandler: () => void;
	//private readonly fnWaitInputHandler: () => void;
	//private readonly fnOnEscapeHandler: () => void;
	private readonly fnDirectInputHandler: () => boolean;
	private readonly fnPutKeyInBufferHandler: (key: string) => void;
	//private readonly fnOnDragoverHandler: (evt: DragEvent) => void;
	//private readonly fnOnUserActionHandler: () => void;
	//private readonly fnWaitForContinueHandler: () => void;
	private readonly fnEditLineCallbackHandler: () => boolean;

	private inScript = "";
	private outScript = "";

	private initialLoopTimeout = 0;

	//private inputSet = false;

	private variables: Variables;
	private storage: IStorage;

	private basicFormatter?: BasicFormatter; // for renum
	private basicTokenizer?: BasicTokenizer; // to decode tokenized BASIC
	private codeGeneratorToken?: CodeGeneratorToken; // to encode tokenized BASIC
	private codeGeneratorBasic?: CodeGeneratorBasic; // for pretty print
	private readonly core: ICore;
	//private readonly model: IModel;
	//private readonly view: View;
	//private readonly uiController: UiController;

	private readonly basicLexer: BasicLexer;
	private readonly basicParser: BasicParser;

	private readonly runtime: Runtime;

	//private readonly canvases: Record<string, ICanvasVm> = {};
	//private canvas: ICanvasVm;

	//private readonly inputStack = new InputStack();

	//private readonly keyboard: Keyboard;
	//private virtualKeyboard?: VirtualKeyboard;

	//private dragElement?: DragElement;

	//private readonly sound = new Sound({
	//	AudioContextConstructor: window.AudioContext
	//});

	private readonly vm: CpcVm;


	private fileHandler?: FileHandler;
	//private fileSelect?: FileSelect;

	private hasStorageDatabase: boolean;
	private readonly options: ControllerOptions0;

	//private z80Disass?: Z80Disass;


	constructor(core: ICore, options: ControllerOptions0) {
		// this.fnWaitKeyHandler = this.fnWaitKey.bind(this);
		// this.fnWaitInputHandler = this.fnWaitInput.bind(this);
		// this.fnOnEscapeHandler = this.fnOnEscape.bind(this);
		this.fnDirectInputHandler = this.fnDirectInput.bind(this);
		this.fnPutKeyInBufferHandler = this.fnPutKeysInBuffer.bind(this);
		//this.fnOnDragoverHandler = Controller0.fnOnDragover;
		// this.fnOnUserActionHandler = this.onUserAction.bind(this);
		// this.fnWaitForContinueHandler = this.fnWaitForContinue.bind(this);
		this.fnEditLineCallbackHandler = this.fnEditLineCallback.bind(this);

		this.core = core;
		const model = this.core.getModel();
		//this.model = model;
		//this.view = view;
		this.options = options;

		//this.uiController = new UiController(core, view, this, this.fnOnUserActionHandler);

		//this.canvas = this.setCanvasType(model.getProperty<string>(ModelPropID.canvasType));

		this.fnSpeed();

		// this.keyboard = new Keyboard({
		// 	view: this.view,
		// 	fnOnEscapeHandler: this.fnOnEscapeHandler
		// });

		// if (model.getProperty<boolean>(ModelPropID.showKbd)) { // maybe we need to draw virtual keyboard
		// 	this.getVirtualKeyboard();
		// }

		// check first user action, also if sound is not yet on

		const random = new Random(model.getProperty<string>(ModelPropID.random) === "cpc");
		this.runtime = new Runtime({
			canvas: this.options.canvas,
			keyboard: this.options.keyboard,
			sound: this.options.sound,
			random,
			arrayBounds: model.getProperty<boolean>(ModelPropID.arrayBounds),
			basicVersion: model.getProperty<string>(ModelPropID.basicVersion),
			trace: model.getProperty<boolean>(ModelPropID.trace),
			implicitLines: model.getProperty<boolean>(ModelPropID.implicitLines),
			integerOverflow: model.getProperty<boolean>(ModelPropID.integerOverflow),
			onClickKey: this.fnPutKeyInBufferHandler,
			encodeTokens: (input) => this.encodeTokenizedBasic(input),
			outputError: this.outputError.bind(this),
			logger: Utils.console,
			getCodeGeneratorBasic: () => this.getCodeGeneratorBasic(),
			getCodeGeneratorToken: () => this.codeGeneratorToken,
			onTokenized: (sourceLength, tokenLength) => {
				if (Utils.debug) {
					Utils.console.debug("parse: input length:", sourceLength, ", tokenized length:", tokenLength);
				}
			},
			onMemoryError: (error) => Utils.console.error("vmPutProgramInMem", error),
			programHost: {
				getSource: () => this.getInputText(),
				prepareCompileOutput: (output) => this.presentCompileOutput(output),
				beforeProgramStart: () => this.beforeProgramStart(),
				afterProgramStart: () => this.afterProgramStart()
			},
			handlers: Object.fromEntries(Object.entries(this.handlers).map(([reason, handler]) => [reason, handler.bind(this)])),
			getInitialDelay: () => this.initialLoopTimeout,
			setTimeout: (callback, delay) => this.options.setTimeout(callback, delay),
			onExit: () => this.exitLoop(),
			onExecutionState: options.onExecutionState,
			onUnknownReason: (reason) => Utils.console.warn("runLoop: Unknown run mode:", reason)
		});
		this.variables = this.runtime.variables;
		this.vm = this.runtime.vm;
		this.basicParser = this.runtime.basicParser;
		this.basicLexer = this.runtime.basicLexer;
		this.vm.setCanvas(this.options.canvas);
		this.runtime.reset();

		this.vm.vmRegisterRsx(new RsxAmsdos(), true);
		this.vm.vmRegisterRsx(new RsxCpcBasic(), true);

		/*
		if (this.core.getModel().getProperty<boolean>(ModelPropID.sound)) { // activate sound needs user action
			this.setSoundActive(); // activate in waiting state
		}
		*/
		// this.initDropZone();

		//const example = model.getProperty<string>(ModelPropID.example);

		// view.setSelectValue(ViewID.exampleSelect, example);

		//this.hasStorageDatabase = this.initDatabases();
		// this.setDatabaseSelectOptions();
		this.hasStorageDatabase = this.getHasStorageDatabase();

		// if (model.getProperty<boolean>(ModelPropID.showCpc)) {
		// 	this.canvas.startUpdateCanvas();
		// }
		// if (model.getProperty<boolean>(ModelPropID.dragElements)) {
		// 	this.fnDragElementsActive(true);
		// }
		this.storage = this.options.storage;
	}

	private getStorage() {
		//return Polyfills.localStorage || window.localStorage;
		return this.storage;
	}

	private getHasStorageDatabase() {
		const databases = this.core.getModel().getAllDatabases();

		let hasStorageDatabase = false;
		for (const value in databases) {
			if (databases.hasOwnProperty(value)) {
				if (value === "storage") {
					hasStorageDatabase = true;
				}
			}
		}
		return hasStorageDatabase;
	}

	/*
	private initDatabases() {
		return getHasStorageDatabase
	}
	*/

	// private onUserAction(/* event, id */) {
	// 	this.uiController.deactivateUserAction(); // deactivate user action
	// 	this.sound.setActivatedByUser();
	// 	this.setSoundActive();
	// }

	// private setDatabaseSelectOptions() {
	// 	const items: SelectOptionElement[] = [],
	// 		databases = this.core.getModel().getAllDatabases(),
	// 		database = this.core.getModel().getProperty<string>(ModelPropID.database);

	// 	for (const value in databases) {
	// 		if (databases.hasOwnProperty(value)) {
	// 			const db = databases[value],
	// 				item: SelectOptionElement = {
	// 					value: value,
	// 					text: db.text,
	// 					title: db.title,
	// 					selected: value === database
	// 				};

	// 			items.push(item);
	// 		}
	// 	}
	// 	this.view.setSelectOptions(ViewID.databaseSelect, items);
	// }

	// private static getPathFromExample(example: string) {
	// 	const index = example.lastIndexOf("/");
	// 	let path = "";

	// 	if (index >= 0) {
	// 		path = example.substring(0, index);
	// 	}
	// 	return path;
	// }

	// private static getNameFromExample(example: string) {
	// 	const index = example.lastIndexOf("/");
	// 	let name = example;

	// 	if (index >= 0) {
	// 		name = example.substring(index + 1);
	// 	}
	// 	return name;
	// }

	// private setDirectorySelectOptions() {
	// 	const items: SelectOptionElement[] = [],
	// 		allExamples = this.core.getModel().getAllExamples(),
	// 		examplePath = Controller0.getPathFromExample(this.core.getModel().getProperty<string>(ModelPropID.example)),
	// 		directorySeen: Record<string, boolean> = {};

	// 	for (const key in allExamples) {
	// 		if (allExamples.hasOwnProperty(key)) {
	// 			const exampleEntry = allExamples[key],
	// 				value = Controller0.getPathFromExample(exampleEntry.key);

	// 			if (!directorySeen[value]) {
	// 				const item: SelectOptionElement = {
	// 					value: value,
	// 					text: value,
	// 					title: value,
	// 					selected: value === examplePath
	// 				};

	// 				items.push(item);
	// 				directorySeen[value] = true;
	// 			}
	// 		}
	// 	}
	// 	this.view.setSelectOptions(ViewID.directorySelect, items);
	// }

	// setExampleSelectOptions(): void {
	// 	const maxTitleLength = 160,
	// 		maxTextLength = 60, // (32 visible?)
	// 		items: SelectOptionElement[] = [],
	// 		exampleName = Controller0.getNameFromExample(this.core.getModel().getProperty<string>(ModelPropID.example)),
	// 		allExamples = this.core.getModel().getAllExamples(),
	// 		directoryName = this.view.getSelectValue(ViewID.directorySelect),
	// 		selectDataFiles = this.core.getModel().getProperty<boolean>(ModelPropID.selectDataFiles);

	// 	let exampleSelected = false;

	// 	for (const key in allExamples) {
	// 		if (allExamples.hasOwnProperty(key) && (Controller0.getPathFromExample(key) === directoryName)) {
	// 			const exampleEntry = allExamples[key],
	// 				exampleName2 = Controller0.getNameFromExample(exampleEntry.key);

	// 			if (selectDataFiles || (exampleEntry.meta !== "D")) { // skip data files
	// 				const title = (exampleName2 + ": " + exampleEntry.title).substring(0, maxTitleLength),
	// 					item: SelectOptionElement = {
	// 						value: exampleName2,
	// 						title: title,
	// 						text: title.substring(0, maxTextLength),
	// 						selected: exampleName2 === exampleName
	// 					};

	// 				if (item.selected) {
	// 					exampleSelected = true;
	// 				}
	// 				items.push(item);
	// 			}
	// 		}
	// 	}
	// 	if (!exampleSelected && items.length) {
	// 		items[0].selected = true; // if example is not found, select first element
	// 	}
	// 	this.view.setSelectOptions(ViewID.exampleSelect, items);
	// }

	// setGalleryAreaInputs(): void {
	// 	const database = this.core.getModel().getDatabase(),
	// 		directory = this.view.getSelectValue(ViewID.directorySelect),
	// 		options = this.view.getSelectOptions(ViewID.exampleSelect),
	// 		inputs: AreaInputElement[] = [];

	// 	for (let i = 0; i < options.length; i += 1) {
	// 		const item = options[i],
	// 			input: AreaInputElement = {
	// 				value: item.value,
	// 				title: item.title,
	// 				checked: item.selected,
	// 				imgUrl: database.src + "/" + directory + "/img/" + item.value + ".png"
	// 			};

	// 		inputs.push(input);
	// 	}
	// 	this.view.setAreaInputList(ViewID.galleryAreaItems, inputs);
	// }

	// private static fnSortByStringProperties(a: SelectOptionElement, b: SelectOptionElement) {
	// 	const x = a.value,
	// 		y = b.value;

	// 	if (x < y) {
	// 		return -1;
	// 	} else if (x > y) {
	// 		return 1;
	// 	}
	// 	return 0;
	// }

	// private setVarSelectOptions(select: ViewID, variables: Variables) {
	// 	const maxVarLength = 35,
	// 		varNames = variables.getAllVariableNames(),
	// 		items: SelectOptionElement[] = [];

	// 	for (let i = 0; i < varNames.length; i += 1) {
	// 		const key = varNames[i],
	// 			value = variables.getVariable(key),
	// 			title = key + "=" + value;

	// 		let strippedTitle = title.substring(0, maxVarLength); // limit length

	// 		if (title !== strippedTitle) {
	// 			strippedTitle += " ...";
	// 		}

	// 		const item: SelectOptionElement = {
	// 			value: key,
	// 			text: strippedTitle,
	// 			title: strippedTitle,
	// 			selected: false
	// 		};

	// 		items.push(item);
	// 	}
	// 	items.sort(Controller0.fnSortByStringProperties);
	// 	this.view.setSelectOptions(select, items);
	// }

	// private static readonly exportEditorText = "<editor>";

	// setExportSelectOptions(select: ViewID): void {
	// 	const dirList = this.fnGetStorageDirectoryEntries(),
	// 		items: SelectOptionElement[] = [],
	// 		editorText = Controller0.exportEditorText;

	// 	dirList.sort(); // we sort keys without editorText
	// 	dirList.unshift(editorText);
	// 	for (let i = 0; i < dirList.length; i += 1) {
	// 		const key = dirList[i],
	// 			title = key,
	// 			item: SelectOptionElement = {
	// 				value: key,
	// 				text: title,
	// 				title: title,
	// 				selected: title === editorText
	// 			};

	// 		items.push(item);
	// 	}
	// 	// sort already done
	// 	this.view.setSelectOptions(select, items);
	// }

	private updateStorageDatabase(action: string, key: string) {
		if (!this.hasStorageDatabase) {
			return;
		}

		const database = this.core.getModel().getProperty<string>(ModelPropID.database),
			storage = this.getStorage();

		let selectedExample = "",
			exampleChanged = false;

		if (database !== "storage") {
			this.core.getModel().setProperty(ModelPropID.database, "storage"); // switch to storage database
		} else {
			selectedExample = this.core.getModel().getProperty<string>(ModelPropID.example);
			//selectedExample = this.view.getSelectValue(ViewID.exampleSelect);
		}

		let	dir: string[];

		if (!key) { // no key => get all
			dir = this.fnGetStorageDirectoryEntries();
			dir.sort();
		} else {
			dir = [key];
		}

		for (let i = 0; i < dir.length; i += 1) {
			key = dir[i];
			if (action === "remove") {
				this.core.getModel().removeExample(key);
			} else if (action === "set") {
				let example = this.core.getModel().getExample(key);

				if (selectedExample === "" || (selectedExample === key)) {
					exampleChanged = true;
				}

				if (!example) {
					const dataString = storage.getItem(key) || "",
						data = FileHandler.splitMeta(dataString);

					example = {
						key: key,
						title: "", // or set key?
						meta: data.meta.typeString // currently we take only the type
					};
					this.core.getModel().setExample(example);
				}
			} else {
				Utils.console.error("updateStorageDatabase: unknown action", action);
			}
		}

		if (database === "storage") {
			// this.setDirectorySelectOptions();
			if (exampleChanged) {
				this.onDirectorySelectChange();
			} else {
				// this.setExampleSelectOptions();
			}
		} else {
			this.core.getModel().setProperty(ModelPropID.database, database); // restore database
		}
	}

	// private removeKeyBoardHandler() {
	// 	this.keyboard.setOptions({
	// 		fnOnKeyDown: undefined
	// 	});
	// }

	getInputText(): string {
		return this.inScript;
	}

	getVariableNames(): string[] {
		return this.variables.getAllVariableNames();
	}

	getVariable(name: string): VariableValue {
		return this.variables.getVariable(name);
	}

	setInputText(input: string, keepStack?: boolean): void {
		this.inScript = input;
		this.options.onInputText?.(input, keepStack);
	}

	// setInputText(input: string, keepStack?: boolean): void {
	// 	this.view.setAreaValue(ViewID.inputText, input);
	// 	if (!keepStack) {
	// 		this.fnInitUndoRedoButtons();
	// 	} else {
	// 		this.fnUpdateUndoRedoButtons();
	// 	}
	// }

	invalidateScript(): void {
		this.runtime.invalidateProgram();
	}

	// private fnWaitForContinue() {
	// 	const stream = 0,
	// 		key = this.keyboard.getKeyFromBuffer();

	// 	if (key !== "") {
	// 		this.vm.cursor(stream, 0);
	// 		this.removeKeyBoardHandler();
	// 		this.startContinue();
	// 	}
	// }

	// private fnOnEscape() {
	// 	const stop = this.vm.vmGetStopObject(),
	// 		stream = 0;

	// 	if (this.vm.vmOnBreakContSet()) {
	// 		// ignore break
	// 	} else if (stop.reason === "direct" || this.vm.vmOnBreakHandlerActive()) {
	// 		(stop.paras as VmInputParas).input = "";
	// 		const msg = "*Break*\r\n";

	// 		this.vm.print(stream, msg);
	// 	} else if (stop.reason !== "escape") { // first escape?
	// 		this.vm.cursor(stream, 1);
	// 		this.keyboard.clearInput();

	// 		this.keyboard.setOptions({
	// 			fnOnKeyDown: this.fnWaitForContinueHandler
	// 		});

	// 		this.setStopObject(stop);
	// 		this.vm.vmStop("escape", 85, false, {
	// 			command: "escape",
	// 			stream: stream,
	// 			first: 0, // unused
	// 			last: 0, // unused
	// 			line: this.vm.line
	// 		});
	// 	} else { // second escape
	// 		this.removeKeyBoardHandler();
	// 		this.vm.cursor(stream, 0);

	// 		const savedStop = this.getStopObject();

	// 		if (savedStop.reason === "waitInput") { // sepcial handling: set line to repeat input
	// 			this.vm.vmGoto((savedStop.paras as VmInputParas).line);
	// 		}

	// 		if (!this.vm.vmEscape()) {
	// 			this.vm.vmStop("", 0, true); // continue program, in break handler?
	// 			this.setStopObject(this.noStop);
	// 		} else {
	// 			this.vm.vmStop("stop", 0, true); // stop
	// 			const msg = "Break in " + this.vm.line + "\r\n";

	// 			this.vm.print(stream, msg);
	// 		}
	// 	}

	// 	this.startMainLoop();
	// }

	private fnWaitSound() {
		this.runtime.handleWaitSound();
	}

	// private fnWaitSound() { // rather fnEvent
	// 	const stop = this.vm.vmGetStopObject();

	// 	this.vm.vmLoopCondition(); // update nextFrameTime, timers, inks; schedule sound: free queue
	// 	if (this.sound.isActivatedByUser()) { // only if activated
	// 		const soundDataList = this.vm.vmGetSoundData();

	// 		while (soundDataList.length && this.sound.testCanQueue(soundDataList[0].state)) {
	// 			const soundData = soundDataList.shift() as SoundData;

	// 			this.sound.sound(soundData);
	// 		}
	// 		if (!soundDataList.length) {
	// 			if (stop.reason === "waitSound") { // only for this reason
	// 				this.vm.vmStop("", 0, true); // no more wait
	// 			}
	// 		}
	// 	}
	// 	this.nextLoopTimeOut = this.vm.vmGetTimeUntilFrame(); // wait until next frame
	// }

	private fnWaitKey(): string {
		return this.runtime.handleWaitKey();
	}

	// private fnWaitKey() {
	// 	const key = this.keyboard.getKeyFromBuffer();

	// 	if (key !== "") { // do we have a key from the buffer already?
	// 		Utils.console.log("Wait for key:", key);
	// 		this.vm.vmStop("", 0, true);
	// 		this.removeKeyBoardHandler();
	// 	} else {
	// 		this.fnWaitSound(); // sound and blinking events
	// 		// wait until keypress handler (for call &bb18)
	// 		this.keyboard.setOptions({
	// 			fnOnKeyDown: this.fnWaitKeyHandler
	// 		});
	// 	}
	// 	return key;
	// }

	private fnWaitInput() {
		const result = this.runtime.handleWaitInput({
			onInvalid: (error) => this.outputError(error, true),
			startMainLoop: () => this.startMainLoop(),
			continueExecution: () => this.startContinue()
		});
		if (result.status === "invalid") {
			return;
		}
		if (result.status === "pending" && result.reason === "waitInput") {
			this.fnWaitSound();
		}
		this.updateResultText();
	}



	// private fnWaitInput() { // eslint-disable-line complexity
	// 	const stop = this.vm.vmGetStopObject(),
	// 		inputParas = stop.paras as VmInputParas,
	// 		stream = inputParas.stream;
	// 	let input = inputParas.input,
	// 		key: string;

	// 	if (input === undefined || stream === undefined) {
	// 		this.outputError(this.vm.vmComposeError(Error(), 32, "Programming Error: fnWaitInput"), true);
	// 		return;
	// 	}

	// 	do {
	// 		key = this.keyboard.getKeyFromBuffer(); // (inkey$ could insert frame if checked too often)
	// 		// chr13 shows as empty string!
	// 		switch (key) {
	// 		case "": // no key?
	// 			break;
	// 		case "\r": // cr (\x0d)
	// 			break;
	// 		case "\x10": // DLE (clear character under cursor)
	// 			key = "\x07"; // currently ignore (BEL)
	// 			break;
	// 		case "\x7f": // del
	// 			if (input.length) {
	// 				input = input.slice(0, -1);
	// 				key = "\x08\x10"; // use BS and DLE
	// 			} else {
	// 				key = "\x07"; // ignore BS, use BEL
	// 			}
	// 			break;
	// 		case "\xe0": // copy
	// 			key = this.vm.copychr$(stream);
	// 			if (key.length) {
	// 				input += key;
	// 				key = "\x09"; // TAB
	// 			} else {
	// 				key = "\x07"; // ignore (BEL)
	// 			}
	// 			break;
	// 		case "\xf0": // cursor up
	// 			if (!input.length) {
	// 				key = "\x0b"; // VT
	// 			} else {
	// 				key = "\x07"; // ignore (BEL)
	// 			}
	// 			break;
	// 		case "\xf1": // cursor down
	// 			if (!input.length) {
	// 				key = "\x0a"; // LF
	// 			} else {
	// 				key = "\x07"; // ignore (BEL)
	// 			}
	// 			break;
	// 		case "\xf2": // cursor left
	// 			if (!input.length) {
	// 				key = "\x08"; // BS
	// 			} else {
	// 				key = "\x07"; // ignore (BEL) TODO
	// 			}
	// 			break;
	// 		case "\xf3": // cursor right
	// 			if (!input.length) {
	// 				key = "\x09"; // TAB
	// 			} else {
	// 				key = "\x07"; // ignore (BEL) TODO
	// 			}
	// 			break;
	// 		case "\xf4": // shift+cursor up
	// 			key = ""; // currently ignore
	// 			break;
	// 		case "\xf5": // shift+cursor down
	// 			key = ""; // currently ignore
	// 			break;
	// 		case "\xf6": // shift+cursor left
	// 			key = ""; // currently ignore
	// 			break;
	// 		case "\xf7": // shift+cursor right
	// 			key = ""; // currently ignore
	// 			break;
	// 		case "\xf8": // ctrl+cursor up
	// 			key = ""; // currently ignore
	// 			break;
	// 		case "\xf9": // ctrl+cursor down
	// 			key = ""; // currently ignore
	// 			break;
	// 		case "\xfa": // ctrl+cursor left
	// 			key = ""; // currently ignore
	// 			break;
	// 		case "\xfb": // ctrl+cursor right
	// 			key = ""; // currently ignore
	// 			break;
	// 		default:
	// 			input += key;
	// 			if (key < "\x20") { // control code
	// 				key = "\x01" + key; // print control code (do not execute)
	// 			}
	// 			break;
	// 		}
	// 		if (key && key !== "\r") {
	// 			this.vm.print(stream, key);
	// 		}
	// 	} while (key !== "" && key !== "\r"); // get all keys until CR or no more key

	// 	inputParas.input = input;
	// 	let inputOk = false;

	// 	if (key === "\r") {
	// 		Utils.console.log("fnWaitInput:", input, "reason", stop.reason);
	// 		if (!inputParas.noCRLF) {
	// 			this.vm.print(stream, "\r\n");
	// 		}
	// 		if (inputParas.fnInputCallback) {
	// 			inputOk = inputParas.fnInputCallback();
	// 		} else {
	// 			inputOk = true;
	// 		}
	// 		if (inputOk) {
	// 			this.removeKeyBoardHandler();
	// 			if (stop.reason === "waitInput") { // only for this reason
	// 				this.vm.vmStop("", 0, true); // no more wait
	// 			} else {
	// 				this.startContinue();
	// 			}
	// 		}
	// 	}

	// 	if (!inputOk) {
	// 		if (stop.reason === "waitInput") { // only for this reason
	// 			this.fnWaitSound(); // sound and blinking events
	// 		}
	// 		// make sure the handler is set
	// 		this.keyboard.setOptions({
	// 			fnOnKeyDown: this.fnWaitInputHandler
	// 		});
	// 	}
	// }

	public static addLineNumbers(input: string) {
		return BasicFormatter.addLineNumbers(input);
	}

	// merge two scripts with sorted line numbers, lines from script2 overwrite lines from script1
	private mergeScripts(script1: string, script2: string) {
		return BasicFormatter.mergeScripts(
			script1,
			script2,
			this.core.getModel().getProperty<boolean>(ModelPropID.implicitLines),
			() => this.reportSplitLinesError()
		);
	}

	// get line range from a script with sorted line numbers
	private fnGetLinesInRange(script: string, firstLine: number, lastLine: number) {
		return BasicFormatter.getLinesInRangeFromScript(
			script,
			firstLine,
			lastLine,
			this.core.getModel().getProperty<boolean>(ModelPropID.implicitLines),
			() => this.reportSplitLinesError()
		);
	}

	private reportSplitLinesError(): void {
		Utils.console.warn("splitLines: No line numbers?");
		this.outputError(this.vm.vmComposeError(Error(), 21, "split"), true);
	}

	private fnGetStorageDirectoryEntries(mask?: string) {
		return FileHandler.getStorageDirectoryEntries(this.getStorage(), mask);
	}

	private fnFileCat(paras: VmFileParas): void {
		const stream = paras.stream,
			dirList = this.fnGetStorageDirectoryEntries();

		this.runtime.printDirectoryEntries(dirList, stream, true);

		// currently only from localstorage

	}

	private fnFileDir(paras: VmFileParas): void {
		const stream = paras.stream,
			example = this.core.getModel().getProperty<string>(ModelPropID.example),
			dirList = FileHandler.getDirectoryEntries(this.getStorage(), this.core.getModel().getAllExamples(), example, paras.fileMask);
		this.runtime.printDirectoryEntries(dirList, stream, false);
	}

	private fnFileEra(paras: VmFileParas): void {
		this.runtime.eraseFiles(this.getFileHandler(), paras, (name) => {
			if (Utils.debug > 0) {
				Utils.console.debug("fnEraseFile: name=" + name + ": removed from localStorage");
			}
		}, (name) => {
			Utils.console.warn("fnEraseFile: file not found in localStorage:", name);
		});
	}

	private fnFileRen(paras: VmFileParas): void {
		this.runtime.renameFile(this.getFileHandler(), paras);
	}

	private getBasicFormatter() {
		if (!this.basicFormatter) {
			this.basicFormatter = new BasicFormatter({
				lexer: this.basicLexer,
				parser: this.basicParser
			});
		}
		return this.basicFormatter;
	}

	private getBasicTokenizer() {
		if (!this.basicTokenizer) {
			this.basicTokenizer = new BasicTokenizer();
		}
		return this.basicTokenizer;
	}

	private getCodeGeneratorBasic() {
		if (!this.codeGeneratorBasic) {
			this.codeGeneratorBasic = new CodeGeneratorBasic({
				lexer: this.basicLexer,
				parser: this.basicParser,
				lowercaseVars: this.core.getModel().getProperty<boolean>(ModelPropID.prettyLowercaseVars)
			});
		}
		return this.codeGeneratorBasic;
	}

	private getCodeGeneratorToken() {
		if (!this.codeGeneratorToken) {
			this.codeGeneratorToken = new CodeGeneratorToken({
				lexer: this.basicLexer,
				parser: this.basicParser,
				implicitLines: this.core.getModel().getProperty<boolean>(ModelPropID.implicitLines)
			});
		}
		return this.codeGeneratorToken;
	}

	private decodeTokenizedBasic(input: string) {
		const basicTokenizer = this.getBasicTokenizer();

		return basicTokenizer.decode(input);
	}

	private encodeTokenizedBasic(input: string, name = "test") {
		const output = this.getCodeGeneratorToken().generateProgram(input);

		if (output.error) {
			this.outputError(output.error);
		} else if (Utils.debug > 1) {
			const outputText = output.text,
				hex = outputText.split("").map(function (s) { return s.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0"); }).join(","),
				decoded = this.decodeTokenizedBasic(outputText),
				diff = Diff.testDiff(input.toUpperCase(), decoded.toUpperCase()); // for testing

			Utils.console.debug("TokenizerInput (" + name + ") [len=" + input.length + "]:\n" + input);
			Utils.console.debug("TokenizerOutputHex (" + name + ") [len=" + outputText.length + "]:\n" + hex);
			Utils.console.debug("TokenizerOutputDecoded (" + name + ") [len=" + decoded.length + "]:\n" + decoded);
			Utils.console.debug("TokenizerDiff (" + name + ") [len=" + diff.length + "]:\n" + diff);
		}

		return output.text;
	}

	private prettyPrintBasic(input: string, keepWhiteSpace: boolean, keepBrackets: boolean, keepColons: boolean) {
		const output = this.getCodeGeneratorBasic().generatePretty(input, keepWhiteSpace, keepBrackets, keepColons);

		if (output.error) {
			this.outputError(output.error);
		}
		return output.text;
	}

	private applySnapshot(input: string) {
		const snapshot = new Snapshot({
			name: "",
			data: input
		});
		return snapshot.applyToVm(this.vm);
	}

	private loadFileContinue(input: string | null | undefined) { // eslint-disable-line complexity
		const inFile = this.vm.vmGetInFileObject();
		this.runtime.continueLoad(input, inFile, {
			decode: (storedInput) => FileHandler.decodeStoredFile(storedInput, {
				atobFn: (value) => this.options.atobFn(value),
				decodeTokenizedBasic: (value) => this.decodeTokenizedBasic(value),
				applySnapshot: (value) => this.applySnapshot(value),
				importArchive: (value, type) => {
					const imported: string[] = [];
					this.getFileHandler().fnLoad2(value, inFile.name, type, imported);
					return imported;
				}
			}),
			getSource: () => this.getInputText(),
			setSource: (source) => this.setInputText(source),
			clearResult: () => this.setResultText(""),
			merge: (source, loaded) => this.mergeScripts(source, loaded),
			invalidate: () => this.invalidateScript(),
			removeVariables: () => this.fnRemoveAllVariables(),
			reset: () => this.fnReset(),
			parseRun: () => this.fnParseRun(),
			parseChain: () => this.fnParseChain(),
			onUnknownCommand: (value) => Utils.console.error("loadExample: Unknown command:", value),
			setStartLine: (line) => this.vm.vmSetStartLine(line),
			startMainLoop: () => this.startMainLoop(),
			onWarning: (error) => Utils.console.warn(error),
			onError: (message) => Utils.console.error(message),
			decodeTokenizedBasic: (value) => this.decodeTokenizedBasic(value)
		});
	}

	private createFnExampleLoaded(example: string, url: string, inFile: ReturnType<typeof this.vm.vmGetInFileObject>) {
		return (_sFullUrl: string, key: string, suppressLog?: boolean) => {
			if (key !== example) {
				Utils.console.warn("fnExampleLoaded: Unexpected", key, "<>", example);
			}
			const exampleEntry = this.core.getModel().getExample(example);

			if (!suppressLog) {
				Utils.console.log("Example loaded:", url, exampleEntry.meta);
			}
			this.core.getModel().setProperty(ModelPropID.example, inFile.memorizedExample);
			const input = exampleEntry.script;
			this.runtime.completeExampleLoad(input, exampleEntry.rsx, (loadedInput) => this.loadFileContinue(loadedInput));
		};
	}

	private createFnExampleError(example: string, url: string, inFile: ReturnType<typeof this.vm.vmGetInFileObject>) {
		return () => {
			Utils.console.log("Example", url, "error");
			this.core.getModel().setProperty(ModelPropID.example, inFile.memorizedExample);
			this.runtime.failExampleLoad(example, (error, noSelection) => this.outputError(error, noSelection), (input) => this.loadFileContinue(input));
		};
	}

	private getLoadScript() {
		return this.options.loadScript; // || Utils.loadScript;
	}

	getOutputText(): string {
		return this.outScript;
	}

	setOutputText(text: string): void {
		this.outScript = text;
		this.invalidateScript();
		this.options.onOutputText?.(text);
	}

	private setResultText(text: string, _scroll = false) {
		this.options.onResultText?.(text);
		//this.view.setAreaValue(ViewID.resultText, text);
		// if (this.options.onResultText) {
		// 	this.options.onResultText(text);
		// }
		// if (scroll) {
		// 	this.view.setAreaScrollTop(ViewID.resultText); // scroll to bottom
		// }
	}

	private loadExampleFile() {
		const inFile = this.vm.vmGetInFileObject(),
			key = this.core.getModel().getProperty<string>(ModelPropID.example),
			model = this.core.getModel(),
			plan = FileHandler.prepareExampleLoad(inFile.name, key, model.getAllExamples(), model.getDatabase().src),
			example = plan.name,
			exampleEntry = plan.entry,
			url = plan.url;
		inFile.memorizedExample = plan.memorizedExample;

		if (Utils.debug > 0) {
			Utils.console.debug("loadExample: name=" + example + " (current=" + key + ")");
		}

		if (plan.status === "loaded" && exampleEntry) {
			this.core.getModel().setProperty(ModelPropID.example, example);
			const fnExampleLoaded = this.createFnExampleLoaded(example, url, inFile);

			fnExampleLoaded("", example, true);
		} else if (plan.status === "fetch" && exampleEntry) { // need to load
			this.core.getModel().setProperty(ModelPropID.example, example);
			this.getLoadScript()(url, this.createFnExampleLoaded(example, url, inFile), this.createFnExampleError(example, url, inFile), example);
		} else { // keep original example in this error case
			if (example !== "") { // only if not empty
				Utils.console.warn("loadExample: Unknown file:", example);
				const fnExampleError = this.createFnExampleError(example, url, inFile);

				fnExampleError();
			} else {
				this.core.getModel().setProperty(ModelPropID.example, example);
				this.runtime.completeExampleLoad("", undefined, (input) => this.loadFileContinue(input)); // empty input?
			}
		}
	}

	private tryLoadingFromLocalStorage(name: string) {
		return FileHandler.loadFromStorage(this.getStorage(), name);
	}

	private fnFileLoad() {
		const inFile = this.vm.vmGetInFileObject();

		this.runtime.dispatchFileLoad(inFile, {
			deleteLines: (paras) => this.fnDeleteLines(paras),
			logFile: (file) => {
				if (Utils.debug > 1) {
					Utils.console.debug("fnFileLoad:", file.command, file.name, "details:", file);
				}
			},
			loadFromStorage: (name) => this.tryLoadingFromLocalStorage(name),
			onStorageLoad: (input) => {
				if (Utils.debug > 0) {
					Utils.console.debug("fnFileLoad:", inFile.command, inFile.name, "from localStorage");
				}
				this.loadFileContinue(input);
			},
			loadExample: () => this.loadExampleFile(),
			onNotOpen: (name) => Utils.console.error("fnFileLoad:", name, "File not open!"),
			setNextDelay: (delay) => this.runtime.setNextDelay(delay)
		});
	}

	private fnFileSave() {
		const outFile = this.vm.vmGetOutFileObject();

		this.runtime.dispatchFileSave(
			outFile,
			(file) => this.getFileHandler().saveFile(file, () => this.getInputText(), (input, storageName) => this.encodeTokenizedBasic(input, storageName)).data,
			(name) => {
				if (Utils.debug > 0) {
					Utils.console.debug("fnFileSave: name=" + name + ": put into localStorage");
				}
			},
			() => Utils.console.error("fnFileSave: file not open!"),
			(error) => Utils.console.warn(error)
		);
	}

	private fnDeleteLines(paras: VmLineParas) {
		const inputText = this.getInputText(),
			lines = this.fnGetLinesInRange(inputText, paras.first || 0, paras.last || 65535);
		this.runtime.deleteProgramLines(
			paras,
			lines,
			(deletion) => this.setInputText(this.mergeScripts(inputText, deletion)),
			(error) => this.outputError(error, true)
		);
	}

	private fnNew() {
		this.runtime.newProgram(
			() => this.setInputText(""),
			() => this.invalidateScript()
		);
	}

	private fnList(paras: VmLineParas) {
		const input = this.getInputText(),
			stream = paras.stream,
			lines = this.fnGetLinesInRange(input, paras.first || 0, paras.last || 65535);
		this.runtime.listProgram(lines, stream);
	}

	private fnReset() {
		this.runtime.resetProgram(
			() => undefined,
			() => this.setOutputText(""),
			() => this.invalidateScript()
		);
	}

	private outputError(error: Error, noSelection?: boolean) {
		const stream = 0,
			diagnostic = Utils.createDiagnostic(error, noSelection, error.name === "CpcVm" ? this.vm.err() : undefined),
			shortError = diagnostic.shortMessage;

		this.options.onDiagnostic?.(diagnostic);

		const escapedShortError = Utils.escapeControlCharacters(shortError);

		this.vm.print(stream, escapedShortError + "\r\n");
		return shortError;
	}

	private fnRenumLines(paras: VmLineRenumParas) {
		this.runtime.renumProgram(
			this.getInputText(),
			paras,
			(source, newLine, oldLine, step, keep) => this.getBasicFormatter().renumber(source, newLine, oldLine, step, keep),
			(source) => this.setInputText(source, true),
			(error) => {
				Utils.console.warn(error);
				this.outputError(error);
			}
		);
	}

	private fnEditLineCallback() {
		const inputParas = this.vm.vmGetStopObject().paras as VmInputParas,
			inputText = this.getInputText();
		return this.runtime.commitEditedLine(inputParas, inputText, (source, edited) => this.mergeScripts(source, edited), (source) => this.setInputText(source));
	}

	private fnEditLine(paras: VmLineParas) {
		const input = this.getInputText(),
			lineNumber = paras.first || 0,
			lines = this.fnGetLinesInRange(input, lineNumber, lineNumber);

		if (lines.length) {
			this.runtime.editLine(paras, lines[0], this.fnEditLineCallbackHandler);
			this.fnWaitInput();
		} else {
			const error = this.vm.vmComposeError(Error(), 8, String(lineNumber)); // "Line does not exist"

			this.outputError(error);
			this.vm.vmStop("stop", 60, true);
		}
	}

	private fnParse(): IOutput {
		return this.runtime.parseProgram();
	}

	private presentCompileOutput(output: IOutput): string {
		let outputString: string;

		if (output.error) {
			outputString = this.outputError(output.error);
		} else {
			outputString = output.text;
		}

		if (outputString && outputString.length > 0) {
			outputString += "\n";
		}
		this.setOutputText(outputString);

		this.invalidateScript();
		// this.setVarSelectOptions(ViewID.varSelect, this.variables);
		// this.uiController.onVarSelectChange();
		return this.getOutputText();
	}

	private fnParseAndStart(clearVariables: boolean, clearBeforeRun: boolean): void {
		this.runtime.compileAndStartProgram({
			clearVariables,
			clearBeforeRun
		});
	}

	fnPretty(): void {
		const model = this.core.getModel();
		const input = this.getInputText(),
			// keepWhiteSpace = this.view.getInputChecked(ViewID.prettySpaceInput),
			// keepBrackets = this.view.getInputChecked(ViewID.prettyBracketsInput),
			// keepColons = this.view.getInputChecked(ViewID.prettyColonsInput),
			keepWhiteSpace = model.getProperty<boolean>(ModelPropID.prettySpace),
			keepBrackets = model.getProperty<boolean>(ModelPropID.prettyBrackets),
			keepColons = model.getProperty<boolean>(ModelPropID.prettyColons),
			output = this.prettyPrintBasic(input, keepWhiteSpace, keepBrackets, keepColons);

		if (output) {
			// this.fnPutChangedInputOnStack();
			this.setInputText(output, true);
			// this.fnPutChangedInputOnStack();

			// for testing:
			const diff = Diff.testDiff(input.toUpperCase(), output.toUpperCase());

			this.setOutputText(diff);
		}
	}

	fnAddLines(): void {
		const input = this.getInputText(),
			output = Controller0.addLineNumbers(input);

		if (output) {
			// this.fnPutChangedInputOnStack();
			this.setInputText(output, true);
			// this.fnPutChangedInputOnStack();
		}
	}

	fnRemoveLines(): void {
		const basicFormatter = this.getBasicFormatter();

		const input = this.getInputText(),
			output = basicFormatter.removeUnusedLines(input);

		if (output.error) {
			this.outputError(output.error);
		} else {
			// this.fnPutChangedInputOnStack();
			this.setInputText(output.text, true);
			// this.fnPutChangedInputOnStack();
		}
	}

	// private fnGetFilename(input: string) {
	// 	let name = "file";
	// 	const reRemMatcher = /^\d* ?(?:REM|rem) ([\w.]+)+/,
	// 		matches = input.match(reRemMatcher);

	// 	if (matches !== null) {
	// 		name = matches[1];
	// 	} else {
	// 		const example = this.core.getModel().getProperty<string>(ModelPropID.example);

	// 		if (example !== "") {
	// 			if (example.indexOf("/") >= 0) {
	// 				name = example.substring(example.lastIndexOf("/") + 1);
	// 			}
	// 		}
	// 	}

	// 	if (name.indexOf(".") < 0) {
	// 		name += ".bas";
	// 	}
	// 	return name;
	// }

	// eslint-disable-next-line complexity
	fnDownload(): void {
		//const model = this.core.getModel();
		const options = ["test1"], //model.getProperty<boolean>(ModelPropID.exportFile),
			exportTokenized = false, //model.getProperty<boolean>(ModelPropID.exportTokenized),
			exportDSK = false, //model.getProperty<boolean>(ModelPropID.exportDSK),
			format = "data", //model.getProperty<boolean>(ModelPropID.exportDSKFormat),
			stripEmpty = false, // model.getProperty<boolean>(ModelPropID.exportDSKStripEmpty),
			exportBase64 = false, //model.getProperty<boolean>(ModelPropID.exportBase64),

			// const options = this.view.getSelectOptions(ViewID.exportFileSelect),
			// 	exportTokenized = this.view.getInputChecked(ViewID.exportTokenizedInput),
			// 	exportDSK = this.view.getInputChecked(ViewID.exportDSKInput),
			// 	format = this.view.getSelectValue(ViewID.exportDSKFormatSelect),
			// 	stripEmpty = this.view.getInputChecked(ViewID.exportDSKStripEmptyInput),
			// 	exportBase64 = this.view.getInputChecked(ViewID.exportBase64Input),
			//  editorText = Controller0.exportEditorText,
			meta: FileMeta = {
				typeString: "A", // ASCII
				start: 0x170,
				length: 0,
				entry: 0
			};

		let diskImage: DiskImage | undefined,
			name = "",
			data = "";

		const btoaFn = this.options.btoaFn;

		const fnExportBase64 = function () {
			meta.encoding = "base64";
			const metaString = FileHandler.joinMeta(meta);

			data = metaString + "," + btoaFn(data);
			name += ".b64.txt";
		};

		if (exportDSK) {
			diskImage = this.getFileHandler().getDiskImage();

			diskImage.setOptions({
				diskName: "test",
				data: diskImage.formatImage(format) // data or system
			});
		}

		for (let i = 0; i < options.length; i += 1) {
			const item = options[i];

			name = item
			data = this.tryLoadingFromLocalStorage(name) || "";
			const metaAndData = FileHandler.splitMeta(data);

			Object.assign(meta, metaAndData.meta); // copy meta info
			data = metaAndData.data;

			if (exportTokenized && meta.typeString === "A") { // do we need to tokenize it?
				const tokens = this.encodeTokenizedBasic(data);

				if (tokens) { // successful?
					data = tokens;
					meta.typeString = "T";
					meta.start = 0x170;
					meta.length = data.length;
					meta.entry = 0;
				} else {
					Utils.console.warn("Controller: Cannot tokenize, keeping ASCII: " + item); //item.value);
				}
			}

			if (meta.typeString !== "A" && meta.typeString !== "X" && meta.typeString !== "Z") {
				const [name1, ext1] = DiskImage.getFilenameAndExtension(name), // eslint-disable-line array-element-newline
					header = DiskImage.createAmsdosHeader({
						name: name1,
						ext: ext1,
						typeString: meta.typeString,
						start: meta.start,
						length: meta.length,
						entry: meta.entry
					}),
					headerString = DiskImage.combineAmsdosHeader(header);

				data = headerString + data;
			}

			if (diskImage) {
				diskImage.writeFile(name, data);

				const diskOptions = diskImage.getOptions();

				data = diskOptions.data; // we need the modified disk image with the file(s) inside
				name = name.substring(0, name.indexOf(".") + 1) + "dsk";
				meta.length = data.length;
				meta.typeString = "X"; // (extended) disk image
			} else {
				if (exportBase64) {
					fnExportBase64();
				}
				if (data) {
					// this.view.fnDownloadBlob(data, name);
				}
			}

			if (diskImage) {
				if (stripEmpty) {
					data = diskImage.stripEmptyTracks();
				}

				if (exportBase64) {
					fnExportBase64();
				}
				if (data) {
					// this.view.fnDownloadBlob(data, name);
				}
			}
		}
	}

	// private selectJsError(script: string, e: Error) {
	// 	const lineNumber = (e as any).lineNumber, // only on FireFox
	// 		columnNumber = (e as any).columnNumber;

	// 	if (lineNumber || columnNumber) { // only available on Firefox
	// 		const errLine = lineNumber - 3; // for some reason line 0 is 3
	// 		let pos = 0,
	// 			line = 0;

	// 		while (pos < script.length && line < errLine) {
	// 			pos = script.indexOf("\n", pos) + 1;
	// 			line += 1;
	// 		}
	// 		pos += columnNumber;

	// 		Utils.console.warn("Info: JS Error occurred at line", lineNumber, "column", columnNumber, "pos", pos);

	// 		this.view.setAreaSelection(ViewID.outputText, pos, pos + 1);
	// 	}
	// }

	private fnChain(paras?: VmLineParas, clearBeforeRun = false) {
		const line = paras && paras.first || 0;
		this.runtime.startProgram(this.getOutputText(), line, clearBeforeRun);
	}

	private beforeProgramStart(): void {
		if (this.vm.vmGetOutFileObject().open) {
			this.fnFileSave();
		}
	}

	private afterProgramStart(): void {
		if (Utils.debug > 1) {
			Utils.console.debug("End of fnRun");
		}
	}

	private fnRun(paras?: VmLineParas) {
		this.fnChain(paras, true);
	}

	private fnParseRun() {
		this.fnParseAndStart(true, true);
	}

	private fnParseChain() {
		this.fnParseAndStart(false, false);
	}

	private fnDirectInput() {
		const directInput = this.runtime.readDirectInput(),
			{ input, stream } = directInput;
		if (input !== "") { // direct input
			const inputText = this.getInputText();

			if (directInput.isProgramLine) {
				if (Utils.debug > 0) {
					Utils.console.debug("fnDirectInput: insert line=" + input);
				}
				this.runtime.insertDirectProgramLine(
					inputText,
					input,
					stream,
					(source, line) => this.mergeScripts(source, line),
					(source) => this.setInputText(source, true)
				);
				// this.view.setDisabled(ViewID.continueButton, true);

				this.updateResultText();
				return false; // continue direct input
			}

			Utils.console.log("fnDirectInput: execute:", input);

			const output = this.runtime.executeDirectCommand(input, inputText, this.vm.line as number, stream, directInput.message, {
				outputError: (error) => this.outputError(error, true),
				setOutputText: (text) => this.setOutputText(text),
				onPrepareError: (error) => {
					Utils.console.error(error);
					if (error instanceof Error) {
						this.outputError(error, true);
					}
				}
			});

			if (!output.error) {
				this.updateResultText();
				return true;
			}

		}
		this.updateResultText();
		return false;
	}

	private startWithDirectInput() {
		if (this.options.isHeadlessDirectInput) {
			//this.stopUpdateCanvas();
			Utils.console.log("We are ready.");
			if (this.options.onProgramEnd) {
				this.options.onProgramEnd();
			}
			return;
		}

		this.runtime.enterDirectMode(this.fnDirectInputHandler);
		this.fnWaitInput();
	}

	private updateResultText() {
		const outText = this.vm.vmGetOutBuffer();

		this.setResultText(outText, true);
	}

	private exitLoop() {
		const stop = this.vm.vmGetStopObject(),
			reason = stop.reason;

		this.updateResultText();

		// this.view.setDisabled(ViewID.runButton, reason === "reset");
		// this.view.setDisabled(ViewID.stopButton, reason !== "fileLoad" && reason !== "fileSave");
		// this.view.setDisabled(ViewID.continueButton, reason === "end" || reason === "fileLoad" || reason === "fileSave" || reason === "parse" || reason === "renumLines" || reason === "reset");

		// this.setVarSelectOptions(ViewID.varSelect, this.variables);
		// this.uiController.onVarSelectChange();

		if (reason === "stop" || reason === "end" || reason === "error" || reason === "parse" || reason === "parseRun") {
			this.startWithDirectInput();
		}
	}

	getExecutionState(): ExecutionState {
		return this.runtime.getExecutionState();
	}

	startMainLoop(): void {
		this.runtime.startMainLoop();
	}

	startParse(): void {
		this.runtime.beginControl("parse");
		this.startMainLoop();
	}

	startRenum(options: RenumOptions = {}): void {
		const stream = 0;

		this.runtime.beginRenumber(options);

		if (this.vm.pos(stream) > 1) {
			this.vm.print(stream, "\r\n");
		}
		this.vm.print(stream, "renum\r\n");
		this.startMainLoop();
	}

	startRun(): void {
		this.runtime.beginControl("run");
		this.startMainLoop();
	}

	startParseRun(): void {
		this.runtime.beginControl("parseRun");
		this.startMainLoop();
	}

	startBreak(): void {
		this.runtime.beginControl("break");
		this.startMainLoop();
	}

	startEscape(): void {
		const action = this.runtime.handleEscape(this.options.keyboard);
		if (action === "ignored" || action === "input") {
			this.updateResultText();
			return;
		}
		this.startMainLoop();
	}

	startContinue(): void {
		this.runtime.continueProgram(() => this.startMainLoop());
	}

	startReset(): void {
		this.runtime.beginControl("reset");
		this.startMainLoop();
	}

	/*
	startScreenshot(): string {
		return this.canvas.takeScreenShot();
	}
	*/

	putKeys(keys: string): void {
		this.fnPutKeysInBuffer(keys);
		const reason = this.vm.vmGetStopObject().reason;

		if (reason === "direct") {
			this.fnWaitInput();
		} else if (reason === "escape") {
			if (this.options.keyboard.getKeyFromBuffer() !== "") {
				this.vm.cursor(0, 0);
				this.startContinue();
			}
		} else if (reason === "waitInput" || reason === "waitKey") {
			this.startMainLoop();
		}
	}

	private fnPutKeysInBuffer(keys: string) {
		for (let i = 0; i < keys.length; i += 1) {
			this.options.keyboard.putKeyInBuffer(keys.charAt(i), i === keys.length - 1);
		}

		// const options = this.options.keyboard.getOptions(),
		// 	keyDownHandler = options.fnOnKeyDown;

		// if (keyDownHandler) {
		// 	keyDownHandler();
		// }
	}

	// startEnter(): void {
	// 	let input = this.view.getAreaValue(ViewID.inp2Text);

	// 	input = input.replace(/\n/g, "\r"); // LF => CR
	// 	this.fnPutKeysInBuffer(input);
	// }

	// private static generateFunction(par: string, functionString: string) {
	// 	if (functionString.startsWith("function anonymous(")) { // already a modified function (inside an anonymous function)?
	// 		const firstIndex = functionString.indexOf("{"),
	// 			lastIndex = functionString.lastIndexOf("}");

	// 		if (firstIndex >= 0 && lastIndex >= 0) {
	// 			functionString = functionString.substring(firstIndex + 1, lastIndex - 1); // remove anonymous function
	// 		}
	// 		functionString = functionString.trim();
	// 	} else {
	// 		functionString = "var o=cpcBasic.controller.vm, v=o.vmGetAllVariables(); v." + par + " = " + functionString;
	// 	}

	// 	const match = (/function \(([^)]*)/).exec(functionString),
	// 		args = match ? match[1].split(",") : [],
	// 		fnFunction = new Function(args[0], args[1], args[2], args[3], args[4], functionString); // eslint-disable-line no-new-func
	// 		// we support at most 5 arguments

	// 	return fnFunction;
	// }

	// changeVariable(): void {
	// 	const par = this.view.getSelectValue(ViewID.varSelect),
	// 		valueString = this.view.getSelectValue(ViewID.varText),
	// 		variables = this.variables;
	// 	let value = variables.getVariable(par);

	// 	if (typeof value === "function") {
	// 		value = Controller0.generateFunction(par, valueString);
	// 		variables.setVariable(par, value);
	// 	} else {
	// 		const varType = this.variables.determineStaticVarType(par),
	// 			type = this.vm.vmDetermineVarType(varType); // do we know dynamic type?

	// 		if (type !== "$") { // not string? => convert to number
	// 			value = parseFloat(valueString);
	// 		} else {
	// 			value = valueString;
	// 		}

	// 		try {
	// 			const value2 = this.vm.vmAssign(varType, value);

	// 			variables.setVariable(par, value2);
	// 			Utils.console.log("Variable", par, "changed:", variables.getVariable(par), "=>", value);
	// 		} catch (e) {
	// 			Utils.console.warn(e);
	// 		}
	// 	}
	// 	this.setVarSelectOptions(ViewID.varSelect, variables);
	// 	this.uiController.onVarSelectChange(); // title change?
	// }

	setBasicVersion(basicVersion: string): void {
		this.runtime.setBasicVersion(basicVersion);
		this.invalidateScript();
	}

	// setPalette(palette: string): void {
	// 	const validPalette = palette === "green" || palette === "grey" ? palette : "color";

	// 	this.canvas.setOptions({
	// 		palette: validPalette
	// 	});
	// }

	// setCanvasType(canvasType: string): ICanvas {
	// 	let canvas = this.canvas;

	// 	if (canvas) {
	// 		canvas.stopUpdateCanvas(); // stop updates on current canvas
	// 		const canvasID = canvas.getOptions().canvasID;

	// 		this.view.setHidden(canvasID, true);
	// 	} else if (canvasType !== "graphics") {
	// 		// initially graphics canvas is not hidden, but we must hide it, if other canvas should be shown
	// 		this.view.setHidden(ViewID.cpcCanvas, true);
	// 	}

	// 	const palette = this.core.getModel().getProperty<string>(ModelPropID.palette);

	// 	if (this.canvases[canvasType]) {
	// 		canvas = this.canvases[canvasType];
	// 		this.canvas = canvas;
	// 		this.setPalette(palette);
	// 	} else {
	// 		const validPalette = palette === "green" || palette === "grey" ? palette : "color";

	// 		if (canvasType === "text") {
	// 			canvas = new TextCanvas({
	// 				canvasID: ViewID.textText,
	// 				charset: cpcCharset,
	// 				palette: validPalette
	// 			});
	// 		} else if (canvasType === "none") {
	// 			canvas = new NoCanvas({
	// 				canvasID: ViewID.noCanvas,
	// 				charset: cpcCharset,
	// 				palette: validPalette
	// 			});
	// 		} else { // "graphics"
	// 			const isAreaHidden = this.view.getHidden(ViewID.cpcArea);

	// 			// make sure canvas area is not hidden when creating canvas object (allows to get width, height)
	// 			if (isAreaHidden) {
	// 				this.uiController.toggleAreaHiddenById("change", ViewID.showCpcInput); // show: ViewID.cpcArea
	// 			}
	// 			this.view.setHidden(ViewID.cpcCanvas, false);
	// 			canvas = new Canvas({
	// 				canvasID: ViewID.cpcCanvas,
	// 				charset: cpcCharset,
	// 				palette: validPalette
	// 			});
	// 			if (isAreaHidden) {
	// 				this.uiController.toggleAreaHiddenById("change", ViewID.showCpcInput); // hide again: ViewID.cpcArea
	// 			}
	// 		}
	// 		this.canvases[canvasType] = canvas;
	// 		this.canvas = canvas;
	// 	}

	// 	if (this.vm) {
	// 		const handler = this.vm.getOnCanvasClickHandler();
	// 		this.canvas.setOptions({
	// 			onCanvasClick: handler
	// 		});
	// 		this.vm.setCanvas(canvas);
	// 	}

	// 	const canvasId = canvas.getOptions().canvasID;

	// 	this.view.setHidden(canvasId, false);
	// 	if (this.core.getModel().getProperty<boolean>(ModelPropID.showCpc)) {
	// 		this.canvas.startUpdateCanvas();
	// 	}
	// 	return canvas;
	// }

	// setSoundActive(): void {
	// 	const sound = this.sound,
	// 		active = this.core.getModel().getProperty<boolean>(ModelPropID.sound);

	// 	if (active) {
	// 		sound.soundOn();
	// 	} else {
	// 		sound.soundOff();
	// 		const stop = this.vm && this.vm.vmGetStopObject();

	// 		if (stop && stop.reason === "waitSound") {
	// 			this.vm.vmStop("", 0, true); // do not wait
	// 		}
	// 	}
	// }

	// private getZ80Disass() {
	// 	if (!this.z80Disass) {
	// 		const dataArr = this.vm.vmGetMem(),
	// 			data = dataArr as unknown as Uint8Array; // fast hack: we take number array as Uint8Array

	// 		this.z80Disass = new Z80Disass({
	// 			data: data,
	// 			addr: 0
	// 		});
	// 	}
	// 	return this.z80Disass;
	// }

	// setDisassAddr(addr: number, endAddr?: number): void {
	// 	const z80Disass = this.getZ80Disass();

	// 	if (endAddr === undefined) {
	// 		endAddr = addr + 0x100;
	// 	}

	// 	z80Disass.setOptions({
	// 		addr: addr
	// 	});

	// 	const opts = z80Disass.getOptions(),
	// 		lines = [];

	// 	while (addr < endAddr) { // currently not limited to < 0x10000
	// 		lines.push(z80Disass.disassLine());
	// 		if (opts.addr > addr) {
	// 			addr = opts.addr;
	// 		} else {
	// 			Utils.console.error("setDisassAddr: Not increasing:", addr, opts.addr);
	// 			break;
	// 		}
	// 	}

	// 	const out = lines.join("\n") + "\n";

	// 	this.view.setAreaValue(ViewID.disassText, out);
	// }


	// private fnEndOfImport(imported: string[]) {
	// 	const stream = 0,
	// 		vm = this.vm;

	// 	for (let i = 0; i < imported.length; i += 1) {
	// 		vm.print(stream, imported[i], " ");
	// 	}
	// 	vm.print(stream, "\r\n", imported.length + " file" + (imported.length !== 1 ? "s" : "") + " imported.\r\n");
	// 	this.updateResultText();
	// }

	// private static fnOnDragover(evt: DragEvent) {
	// 	evt.stopPropagation();
	// 	evt.preventDefault();
	// 	if (evt.dataTransfer !== null) {
	// 		evt.dataTransfer.dropEffect = "copy"; // explicitly show this is a copy
	// 	}
	// }

	private adaptFilename(name: string, err: string) {
		return this.vm.vmAdaptFilename(name, err);
	}

	private getFileHandler() {
		if (!this.fileHandler) {
			this.fileHandler = new FileHandler({
				adaptFilename: this.adaptFilename.bind(this),
				updateStorageDatabase: this.updateStorageDatabase.bind(this),
				outputError: this.outputError.bind(this),
				processFileImports: this.core.getModel().getProperty<boolean>(ModelPropID.processFileImports),
				storage: this.storage
			});
		}
		return this.fileHandler;
	}

	// private getFileSelect(fileHandler: FileHandler) {
	// 	if (!this.fileSelect) {
	// 		this.fileSelect = new FileSelect({
	// 			fnEndOfImport: this.fnEndOfImport.bind(this),
	// 			fnLoad2: fileHandler.fnLoad2.bind(fileHandler)
	// 		});
	// 	}
	// 	return this.fileSelect;
	// }

	// private initDropZone() {
	// 	const fileHandler = this.getFileHandler(),
	// 		fileSelect = this.getFileSelect(fileHandler),
	// 		dropZone = View.getElementById1(ViewID.dropZone);

	// 	dropZone.addEventListener("dragover", this.fnOnDragoverHandler, false);
	// 	fileSelect.addFileSelectHandler(dropZone, "drop");

	// 	const canvasID = this.canvas.getOptions().canvasID,
	// 		canvasElement = View.getElementById1(canvasID);

	// 	canvasElement.addEventListener("dragover", this.fnOnDragoverHandler, false);
	// 	fileSelect.addFileSelectHandler(canvasElement, "drop");

	// 	const fileInput = View.getElementById1(ViewID.fileInput);

	// 	fileSelect.addFileSelectHandler(fileInput, "change");
	// }

	// private fnUpdateUndoRedoButtons() {
	// 	this.view.setDisabled(ViewID.undoButton, !this.inputStack.canUndoKeepOne());
	// 	this.view.setDisabled(ViewID.undoButton2, !this.inputStack.canUndoKeepOne());
	// 	this.view.setDisabled(ViewID.redoButton, !this.inputStack.canRedo());
	// 	this.view.setDisabled(ViewID.redoButton2, !this.inputStack.canRedo());
	// }

	// private fnInitUndoRedoButtons() {
	// 	this.inputStack.reset();
	// 	this.fnUpdateUndoRedoButtons();
	// }

	// private fnPutChangedInputOnStack() {
	// 	const input = this.getInputText(),
	// 		stackInput = this.inputStack.getInput();

	// 	if (stackInput !== input) {
	// 		this.inputStack.save(input);
	// 		this.fnUpdateUndoRedoButtons();
	// 	}
	// }

	// startUpdateCanvas(): void {
	// 	this.canvas.startUpdateCanvas();
	// }

	// stopUpdateCanvas(): void {
	// 	this.canvas.stopUpdateCanvas();
	// }

	// private getDragElement(): DragElement {
	// 	if (!this.dragElement) {
	// 		this.dragElement = new DragElement({
	// 			view: this.view,
	// 			entries: {}
	// 		});
	// 	}
	// 	return this.dragElement;
	// }

	// getVirtualKeyboard(): VirtualKeyboard {
	// 	if (!this.virtualKeyboard) {
	// 		this.virtualKeyboard = new VirtualKeyboard({
	// 			view: this.view,
	// 			fnPressCpcKey: this.keyboard.fnPressCpcKey.bind(this.keyboard),
	// 			fnReleaseCpcKey: this.keyboard.fnReleaseCpcKey.bind(this.keyboard)
	// 		});
	// 	}
	// 	return this.virtualKeyboard;
	// }

	// private dragElementsData: Partial<DragElementOptions> = {
	// 	entries: {
	// 		consoleLogArea: {
	// 			itemId: ViewID.consoleLogArea,
	// 			xOffset: 0,
	// 			yOffset: 0,
	// 			enabled: false
	// 		},
	// 		cpcArea: {
	// 			itemId: ViewID.cpcArea,
	// 			xOffset: 0,
	// 			yOffset: 0,
	// 			enabled: false
	// 		},
	// 		disassArea: {
	// 			itemId: ViewID.disassArea,
	// 			xOffset: 0,
	// 			yOffset: 0,
	// 			enabled: false
	// 		},
	// 		inp2Area: {
	// 			itemId: ViewID.inp2Area,
	// 			xOffset: 0,
	// 			yOffset: 0,
	// 			enabled: false
	// 		},
	// 		inputArea: {
	// 			itemId: ViewID.inputArea,
	// 			xOffset: 0,
	// 			yOffset: 0,
	// 			enabled: false
	// 		},
	// 		kbdArea: {
	// 			itemId: ViewID.kbdArea,
	// 			xOffset: 0,
	// 			yOffset: 0,
	// 			enabled: false
	// 		},
	// 		mainArea: {
	// 			itemId: ViewID.mainArea,
	// 			xOffset: 0,
	// 			yOffset: 0,
	// 			enabled: false
	// 		},
	// 		outputArea: {
	// 			itemId: ViewID.outputArea,
	// 			xOffset: 0,
	// 			yOffset: 0,
	// 			enabled: false
	// 		},
	// 		resultArea: {
	// 			itemId: ViewID.resultArea,
	// 			xOffset: 0,
	// 			yOffset: 0,
	// 			enabled: false
	// 		},
	// 		variableArea: {
	// 			itemId: ViewID.variableArea,
	// 			xOffset: 0,
	// 			yOffset: 0,
	// 			enabled: false
	// 		}
	// 	}
	// };

	// fnDragElementsActive(enabled: boolean): void {
	// 	const dragElement = this.getDragElement(),
	// 		dragElementsData = this.dragElementsData;

	// 	for (const entry in dragElementsData.entries) {
	// 		if (dragElementsData.entries.hasOwnProperty(entry)) {
	// 			dragElementsData.entries[entry].enabled = enabled;
	// 		}
	// 	}

	// 	dragElement.setOptions(this.dragElementsData);
	// }

	/*
	getVariable(par: string): VariableValue {
		return this.variables.getVariable(par);
	}
	*/

	// undoStackElement(): string {
	// 	return this.inputStack.undo();
	// }

	// redoStackElement(): string {
	// 	return this.inputStack.redo();
	// }

	private createFnDatabaseLoaded(url: string) {
		return (_sFullUrl: string, key: string) => {
			const selectedName = this.core.getModel().getProperty<string>(ModelPropID.database);

			if (selectedName === key) {
				this.core.getModel().getDatabase().loaded = true;
			} else { // should not occur
				Utils.console.warn("databaseLoaded: name changed: " + key + " => " + selectedName);
				this.core.getModel().setProperty(ModelPropID.database, key);
				const database = this.core.getModel().getDatabase();

				if (database) {
					database.loaded = true;
				}
				this.core.getModel().setProperty(ModelPropID.database, selectedName);
			}

			Utils.console.log("fnDatabaseLoaded: database loaded: " + key + ": " + url);
			//this.setDirectorySelectOptions();
			this.onDirectorySelectChange();
		};
	}

	private createFnDatabaseError(url: string) {
		return (_sFullUrl: string, key: string) => {
			Utils.console.error("fnDatabaseError: database error: " + key + ": " + url);
			// this.setDirectorySelectOptions();
			this.onDirectorySelectChange();
			this.setInputText("");
			this.setResultText("Cannot load database: " + key);
		};
	}

	onDatabaseSelectChange(): void {
		this.loadDatabase();
	}

	loadDatabase(name?: string): void {
		const model = this.core.getModel();
		if (name !== undefined) {
			model.setProperty(ModelPropID.database, name);
		}
		const databaseName = model.getProperty<string>(ModelPropID.database);
		const database = model.getDatabase();

		if (!database) {
			Utils.console.error("onDatabaseSelectChange: database not available:", databaseName);
			return;
		}

		if (database.text === "storage") { // special handling: browser localStorage
			this.updateStorageDatabase("set", ""); // set all
			database.loaded = true;
		}

		if (database.loaded) {
			this.loadExample(model.getProperty<string>(ModelPropID.example));
		} else {
			this.setInputText("#loading database " + databaseName + "...");
			const exampleIndex = this.core.getModel().getProperty<string>(ModelPropID.exampleIndex);
			const url = database.src + "/" + exampleIndex;
			const loadScriptFn = this.getLoadScript();

			loadScriptFn(url, this.createFnDatabaseLoaded(url), this.createFnDatabaseError(url), databaseName);
		}
	}

	onDirectorySelectChange(): void {
		//this.setExampleSelectOptions();
		this.onExampleSelectChange();
	}

	onExampleSelectChange(): void {
		this.loadExample(this.core.getModel().getProperty<string>(ModelPropID.example));
	}

	loadExample(key: string, options: ExampleLoadOptions = {}): void {
		const model = this.core.getModel();
		const vm = this.vm,
			inFile = vm.vmGetInFileObject(),
			dataBaseName = model.getProperty<string>(ModelPropID.database);
		model.setProperty(ModelPropID.example, key);

		vm.closein();

		inFile.open = true;

		const request = FileHandler.createExampleLoadRequest(key, dataBaseName, model.getExample(key)?.meta, options.autorun ?? model.getProperty<boolean>(ModelPropID.autorun));
		inFile.command = request.command;
		inFile.name = request.name;
		inFile.start = undefined;
		inFile.fnFileCallback = vm.vmGetLoadHandler();
		vm.vmStop("fileLoad", 90);
		this.startMainLoop();
	}

	// currently not used. Can be called manually: cpcBasic.controller.exportAsBase64(file);
	// exportAsBase64(storageName: string): string { // eslint-disable-line class-methods-use-this
	// 	const storage = this.getStorage();
	// 	let data = storage.getItem(storageName),
	// 		out = "";

	// 	if (data !== null) {
	// 		const index = data.indexOf(","); // metadata separator

	// 		if (index >= 0) {
	// 			const meta = data.substring(0, index);

	// 			data = data.substring(index + 1);
	// 			data = window.btoa(data);
	// 			out = meta + ";base64," + data;
	// 		} else { // hmm, no meta info
	// 			data = window.btoa(data);
	// 			out = "base64," + data;
	// 		}
	// 	}
	// 	Utils.console.log(out);
	// 	return out;
	// }

	// onCpcCanvasClick(event: MouseEvent): void {
	// 	this.uiController.setPopoversHiddenExcept(); // hide all popovers

	// 	this.canvas.onCanvasClick(event);
	// 	this.keyboard.setActive(true);
	// }

	// onWindowClick(event: Event): void {
	// 	this.canvas.onWindowClick(event);
	// 	this.keyboard.setActive(false);
	// }

	fnArrayBounds(): void {
		const arrayBounds = this.core.getModel().getProperty<boolean>(ModelPropID.arrayBounds);
		this.runtime.setArrayBounds(arrayBounds);
	}

	fnImplicitLines(): void {
		const implicitLines = this.core.getModel().getProperty<boolean>(ModelPropID.implicitLines);
		this.runtime.setImplicitLines(implicitLines);
	}

	fnRemoveAllVariables(): void {
		if (Object.keys(this.variables.getAllVariables()).length) {
			this.variables.removeAllVariables();
			//this.setVarSelectOptions(ViewID.varSelect, this.variables);
		}
	}

	fnPrettyLowercaseVars(): void {
		const lowercaseVars = this.core.getModel().getProperty<boolean>(ModelPropID.prettyLowercaseVars);
		this.runtime.setPrettyLowercaseVars(lowercaseVars);
	}

	fnIntegerOverflow(): void {
		const integerOverflow = this.core.getModel().getProperty<boolean>(ModelPropID.integerOverflow);
		this.runtime.setIntegerOverflow(integerOverflow);
	}

	fnTrace(): void {
		const trace = this.core.getModel().getProperty<boolean>(ModelPropID.trace);
		this.runtime.setTrace(trace);
	}

	fnSpeed(): void {
		const speed = this.core.getModel().getProperty<number>(ModelPropID.speed);

		this.initialLoopTimeout = Runtime.getLoopDelay(speed);
	}

	/* eslint-disable no-invalid-this */
	private readonly handlers: Record<string, (paras: VmBaseParas) => void> = {
		waitKey: this.fnWaitKey,
		waitSound: this.fnWaitSound,
		waitInput: this.fnWaitInput,
		fileCat: this.fnFileCat,
		fileDir: this.fnFileDir,
		fileEra: this.fnFileEra,
		fileRen: this.fnFileRen,
		renumLines: this.fnRenumLines,
		deleteLines: this.fnDeleteLines,
		editLine: this.fnEditLine,
		list: this.fnList,
		fileLoad: this.fnFileLoad,
		fileSave: this.fnFileSave,
		"new": this.fnNew,
		run: this.fnRun,
		parse: this.fnParse,
		parseRun: this.fnParseRun,
		reset: this.fnReset
	};
	/* eslint-enable no-invalid-this */
}
