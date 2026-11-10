// Controller.ts - Controller
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//

import { ModelPropID } from "../Constants";
import { ViewID } from "./UiConstants";
import { UiUtils } from "./UiUtils";
import { Canvas } from "./Canvas";
import { cpcCharset } from "./cpcCharset";
import type { CpcVm, FileMeta } from "../CpcVm";
import type { FileHandler as FileHandlerType } from "../FileHandler";
import { FileSelect } from "./FileSelect";
import type { Runtime as RuntimeType } from "../Runtime";
import type { ExampleLoadOptions, ICore, IEngine, IModel, IOutput, RenumOptions, RuntimeCallbacks, RuntimeHost, VmFileParas, VmInputParas, VmLineParas, VmLineRenumParas, VmBaseParas, VariableValue } from "../Interfaces";
import type { ICanvas, IController } from "./UiInterfaces";
import { Keyboard } from "./Keyboard";
import { NoCanvas } from "./NoCanvas";
import { TextCanvas } from "./TextCanvas";
import { VirtualKeyboard } from "./VirtualKeyboard";
import { Sound } from "./Sound";
import { InputStack } from "./InputStack";
import type { Variables } from "../Variables";
import { View, SelectOptionElement, AreaInputElement } from "./View";
import { DragElement, DragElementOptions } from "./DragElement";
import { UiController } from "./UiController";
import { Z80Disass } from "./Z80Disass";
import type { ExecutionState } from "../ExecutionState";
import { createBrowserHost } from "./BrowserHost";

interface UserKeyType {
	code: number
	text: string
}

export interface ControllerOptions extends Partial<RuntimeHost>, RuntimeCallbacks {
	isHeadlessDirectInput?: boolean
}

export class Controller implements IController {
	private readonly fnWaitKeyHandler: () => void;
	private readonly fnWaitInputHandler: () => void;
	private readonly fnOnEscapeHandler: () => void;
	private readonly fnDirectInputHandler: () => boolean;
	private readonly fnPutKeyInBufferHandler: (key: string) => void;
	private readonly fnOnDragoverHandler: (evt: DragEvent) => void;
	private readonly fnOnUserActionHandler: () => void;
	private readonly fnWaitForContinueHandler: () => void;
	private readonly fnEditLineCallbackHandler: () => boolean;
	private readonly fnOnUserKeyClickHandler: (event: Event) => void;

	private outScript = "";

	private initialLoopTimeout = 0;

	private inputSet = false;

	private variables: Variables;

	private readonly core: ICore;
	private readonly engine: IEngine;
	private readonly model: IModel;
	private readonly view: View;
	private readonly uiController: UiController;

	private readonly runtime: RuntimeType;

	private readonly canvases: Record<string, ICanvas> = {};
	private canvas: ICanvas;

	private readonly inputStack = new InputStack();

	private readonly keyboard: Keyboard;
	private virtualKeyboard?: VirtualKeyboard;

	private dragElement?: DragElement;

	private readonly sound = new Sound({
		AudioContextConstructor: window.AudioContext
	});

	private readonly vm: CpcVm;
	private readonly vmOnCanvasClickHandler: (event: MouseEvent, x: number, y: number, xTxt: number, yTxt: number) => void;


	private fileHandler?: FileHandlerType;
	private fileSelect?: FileSelect;

	private hasStorageDatabase: boolean;
	private readonly options: ControllerOptions;
	private readonly host: RuntimeHost;

	private z80Disass?: Z80Disass;


	constructor(engine: IEngine, view: View, options: ControllerOptions = {}) {
		this.fnWaitKeyHandler = this.fnWaitKey.bind(this);
		this.fnWaitInputHandler = this.fnWaitInput.bind(this);
		this.fnOnEscapeHandler = this.fnOnEscape.bind(this);
		this.fnDirectInputHandler = this.fnDirectInput.bind(this);
		this.fnPutKeyInBufferHandler = this.fnPutKeysInBuffer.bind(this);
		this.fnOnDragoverHandler = Controller.fnOnDragover;
		this.fnOnUserActionHandler = this.onUserAction.bind(this);
		this.fnWaitForContinueHandler = this.fnWaitForContinue.bind(this);
		this.fnEditLineCallbackHandler = this.fnEditLineCallback.bind(this);
		this.fnOnUserKeyClickHandler = this.onUserKeyClick.bind(this);

		this.engine = engine;
		this.core = engine.core;
		const model = this.core.getModel();
		this.model = model;
		this.view = view;
		this.outScript = view.getAreaValue(ViewID.outputText);
		this.options = options;
		this.host = createBrowserHost(options);
		this.view.addEventListenerById("click", this.fnOnUserKeyClickHandler, ViewID.userKeys);

		this.uiController = new UiController(this.core, view, this, this.fnOnUserActionHandler);

		this.canvas = this.setCanvasType(model.getProperty<string>(ModelPropID.canvasType));

		this.fnSpeed();

		this.keyboard = new Keyboard({
			view: this.view,
			fnOnEscapeHandler: this.fnOnEscapeHandler
		});

		if (this.model.getProperty<boolean>(ModelPropID.showKbd)) { // maybe we need to draw virtual keyboard
			this.getVirtualKeyboard();
		}

		// check first user action, also if sound is not yet on

		this.runtime = this.engine.createRuntime({
			canvas: this.canvas,
			keyboard: this.keyboard,
			sound: this.sound,
			randomMode: model.getProperty<"cpc" | "minstd">(ModelPropID.random),
			arrayBounds: model.getProperty<boolean>(ModelPropID.arrayBounds),
			basicVersion: model.getProperty<string>(ModelPropID.basicVersion),
			trace: model.getProperty<boolean>(ModelPropID.trace),
			implicitLines: model.getProperty<boolean>(ModelPropID.implicitLines),
			integerOverflow: model.getProperty<boolean>(ModelPropID.integerOverflow),
			prettyLowercaseVars: model.getProperty<boolean>(ModelPropID.prettyLowercaseVars),
			onClickKey: this.fnPutKeyInBufferHandler,
			outputError: this.outputError.bind(this),
			onJsError: (error) => this.selectJsError(this.getOutputText(), error),
			logger: UiUtils.console,
			onVariablesCleared: () => this.uiController.refreshVariables(),
			onTokenized: (sourceLength, tokenLength) => {
				if (UiUtils.debug) {
					UiUtils.console.debug("parse: input length:", sourceLength, ", tokenized length:", tokenLength);
				}
			},
			onMemoryError: (error) => UiUtils.console.error("vmPutProgramInMem", error),
			programHost: {
				getSource: () => this.getInputText(),
				beforeCompileProgram: (source) => this.updateUserKeys(source),
				prepareCompileOutput: (output) => this.presentCompileOutput(output),
				beforeProgramStart: () => this.beforeProgramStart(),
				afterProgramStart: () => this.afterProgramStart()
			},
			handlers: Object.fromEntries(Object.entries(this.handlers).map(([reason, handler]) => [reason, handler.bind(this)])),
			getInitialDelay: () => this.initialLoopTimeout,
			setTimeout: (callback, delay) => this.host.setTimeout(callback, delay),
			onExit: () => this.exitLoop(),
			onExecutionState: (state) => {
				this.uiController.onExecutionState(state);
				options.onExecutionState?.(state);
			},
			onUnknownReason: (reason) => UiUtils.console.warn("runLoop: Unknown run mode:", reason)
		});
		this.variables = this.runtime.variables;
		this.vm = this.runtime.vm;
		
		const onCanvasClick = (event: MouseEvent, x: number, y: number, xTxt: number, yTxt: number) => {
			const handler = this.vm.getOnCanvasClickHandler();
			handler(x, y, xTxt, yTxt, event.detail === 2);
		};
		this.vmOnCanvasClickHandler = onCanvasClick;

		this.vm.getOnCanvasClickHandler();
		this.canvas.setOptions({
			onCanvasClick
		});
		this.vm.setCanvas(this.canvas);
		this.runtime.reset();

		if (model.getProperty<boolean>(ModelPropID.sound)) { // activate sound needs user action
			this.setSoundActive(); // activate in waiting state
		}
		this.initDropZone();

		const example = model.getProperty<string>(ModelPropID.example);

		view.setSelectValue(ViewID.exampleSelect, example);

		this.setDatabaseSelectOptions();
		this.hasStorageDatabase = this.getHasStorageDatabase();

		if (model.getProperty<boolean>(ModelPropID.showCpc)) {
			this.canvas.startUpdateCanvas();
		}
		if (model.getProperty<boolean>(ModelPropID.dragElements)) {
			this.fnDragElementsActive(true);
		}
	}

	private getStorage() {
		return this.host.storage;
	}

	public getCanvas(): ICanvas {
		return this.canvas;
	}

	private getHasStorageDatabase() {
		const databases = this.model.getAllDatabases();

		let hasStorageDatabase = false;
		for (const value in databases) {
			if (Object.prototype.hasOwnProperty.call(databases, value)) {
				if (value === "storage") {
					hasStorageDatabase = true;
				}
			}
		}
		return hasStorageDatabase;
	}

	private onUserAction(/* event, id */) {
		this.uiController.deactivateUserAction(); // deactivate user action
		this.sound.setActivatedByUser();
		this.setSoundActive();
	}

	private setDatabaseSelectOptions() {
		const items: SelectOptionElement[] = [],
			databases = this.model.getAllDatabases(),
			database = this.model.getProperty<string>(ModelPropID.database);

		for (const value in databases) {
			if (Object.prototype.hasOwnProperty.call(databases, value)) {
				const db = databases[value],
					item: SelectOptionElement = {
						value: value,
						text: db.text,
						title: db.title,
						selected: value === database
					};

				items.push(item);
			}
		}
		this.view.setSelectOptions(ViewID.databaseSelect, items);
	}

	private static getPathFromExample(example: string) {
		const index = example.lastIndexOf("/");
		let path = "";

		if (index >= 0) {
			path = example.substring(0, index);
		}
		return path;
	}

	private static getNameFromExample(example: string) {
		const index = example.lastIndexOf("/");
		let name = example;

		if (index >= 0) {
			name = example.substring(index + 1);
		}
		return name;
	}

	private setDirectorySelectOptions() {
		const items: SelectOptionElement[] = [],
			allExamples = this.model.getAllExamples(),
			examplePath = Controller.getPathFromExample(this.model.getProperty<string>(ModelPropID.example)),
			directorySeen: Record<string, boolean> = {};

		for (const key in allExamples) {
			if (Object.prototype.hasOwnProperty.call(allExamples, key)) {
				const exampleEntry = allExamples[key],
					value = Controller.getPathFromExample(exampleEntry.key);

				if (!directorySeen[value]) {
					const item: SelectOptionElement = {
						value: value,
						text: value,
						title: value,
						selected: value === examplePath
					};

					items.push(item);
					directorySeen[value] = true;
				}
			}
		}
		this.view.setSelectOptions(ViewID.directorySelect, items);
	}

	setExampleSelectOptions(): void {
		const maxTitleLength = 160,
			maxTextLength = 60, // (32 visible?)
			items: SelectOptionElement[] = [],
			exampleName = Controller.getNameFromExample(this.model.getProperty<string>(ModelPropID.example)),
			allExamples = this.model.getAllExamples(),
			directoryName = this.view.getSelectValue(ViewID.directorySelect),
			selectDataFiles = this.model.getProperty<boolean>(ModelPropID.selectDataFiles);

		let exampleSelected = false;

		for (const key in allExamples) {
			if (Object.prototype.hasOwnProperty.call(allExamples, key) && (Controller.getPathFromExample(key) === directoryName)) {
				const exampleEntry = allExamples[key],
					exampleName2 = Controller.getNameFromExample(exampleEntry.key);

				if (selectDataFiles || (exampleEntry.meta !== "D")) { // skip data files
					const title = (exampleName2 + ": " + exampleEntry.title).substring(0, maxTitleLength),
						item: SelectOptionElement = {
							value: exampleName2,
							title: title,
							text: title.substring(0, maxTextLength),
							selected: exampleName2 === exampleName
						};

					if (item.selected) {
						exampleSelected = true;
					}
					items.push(item);
				}
			}
		}
		if (!exampleSelected && items.length) {
			items[0].selected = true; // if example is not found, select first element
		}
		this.view.setSelectOptions(ViewID.exampleSelect, items);
	}

	setGalleryAreaInputs(): void {
		const database = this.model.getDatabase(),
			directory = this.view.getSelectValue(ViewID.directorySelect),
			options = this.view.getSelectOptions(ViewID.exampleSelect),
			inputs: AreaInputElement[] = [];

		for (let i = 0; i < options.length; i += 1) {
			const item = options[i],
				input: AreaInputElement = {
					value: item.value,
					title: item.title,
					checked: item.selected,
					imgUrl: database.src + "/" + directory + "/img/" + item.value + ".png"
				};

			inputs.push(input);
		}
		this.view.setAreaInputList(ViewID.galleryAreaItems, inputs);
	}

	private static readonly exportEditorText = "<editor>";

	setExportSelectOptions(select: ViewID): void {
		const dirList = this.fnGetStorageDirectoryEntries(),
			items: SelectOptionElement[] = [],
			editorText = Controller.exportEditorText;

		dirList.sort(); // we sort keys without editorText
		dirList.unshift(editorText);
		for (let i = 0; i < dirList.length; i += 1) {
			const key = dirList[i],
				title = key,
				item: SelectOptionElement = {
					value: key,
					text: title,
					title: title,
					selected: title === editorText
				};

			items.push(item);
		}
		// sort already done
		this.view.setSelectOptions(select, items);
	}

	private updateStorageDatabase(action: string, key: string) {
		if (!this.hasStorageDatabase) {
			return;
		}

		const database = this.model.getProperty<string>(ModelPropID.database),
			storage = this.getStorage();

		let selectedExample = "",
			exampleChanged = false;

		if (database !== "storage") {
			this.model.setProperty(ModelPropID.database, "storage"); // switch to storage database
		} else {
			selectedExample = this.view.getSelectValue(ViewID.exampleSelect);
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
				this.model.removeExample(key);
			} else if (action === "set") {
				let example = this.model.getExample(key);

				if (selectedExample === "" || (selectedExample === key)) {
					exampleChanged = true;
				}

				if (!example) {
					const dataString = storage.getItem(key) || "",
						data = this.engine.files.splitMeta(dataString);

					example = {
						key: key,
						title: "", // or set key?
						meta: data.meta.typeString // currently we take only the type
					};
					this.model.setExample(example);
				}
			} else {
				UiUtils.console.error("updateStorageDatabase: unknown action", action);
			}
		}

		if (database === "storage") {
			this.setDirectorySelectOptions();
			if (exampleChanged) {
				this.onDirectorySelectChange();
			} else {
				this.setExampleSelectOptions();
			}
		} else {
			this.model.setProperty(ModelPropID.database, database); // restore database
		}
	}

	private removeKeyBoardHandler() {
		this.keyboard.setOptions({
			fnOnKeyDown: undefined
		});
	}

	getInputText(): string {
		return this.view.getAreaValue(ViewID.inputText);
	}

	setInputText(input: string, keepStack?: boolean): void {
		this.view.setAreaValue(ViewID.inputText, input);
		this.updateUserKeys(input);
		if (!keepStack) {
			this.fnInitUndoRedoButtons();
		} else {
			this.fnUpdateUndoRedoButtons();
		}
		this.options.onInputText?.(input, keepStack);
	}

	invalidateScript(): void {
		this.runtime.invalidateProgram();
	}

	private fnWaitForContinue() {
		const stream = 0,
			key = this.keyboard.getKeyFromBuffer();

		if (key !== "") {
			this.vm.cursor(stream, 0);
			this.removeKeyBoardHandler();
			this.startContinue();
		}
	}

	private fnOnEscape() {
		this.startEscape();
	}

	startEscape(): void {
		const action = this.runtime.handleEscape(this.keyboard);
		if (action === "ignored" || action === "input") {
			this.updateResultText();
			return;
		}
		if (action === "suspended") {
			this.keyboard.setOptions({
				fnOnKeyDown: this.fnWaitForContinueHandler
			});
		} else {
			this.removeKeyBoardHandler();
		}
		this.startMainLoop();
	}

	private fnWaitSound() {
		this.runtime.handleWaitSound(this.sound.isActivatedByUser());
	}
	private fnWaitKey() {
		const key = this.runtime.handleWaitKey(
			() => this.sound.isActivatedByUser(),
			(key) => UiUtils.console.log("Wait for key:", key)
		);

		if (key !== "") {
			this.removeKeyBoardHandler();
		} else {
			// wait until keypress handler (for call &bb18)
			this.keyboard.setOptions({
				fnOnKeyDown: this.fnWaitKeyHandler
			});
		}
		return key;
	}

	private fnWaitInput() {
		const result = this.runtime.handleWaitInput({
			onInvalid: (error) => this.outputError(error, true),
			onInputReturn: (editedInput) => {
				UiUtils.console.log("fnWaitInput:", editedInput, "reason", this.vm.vmGetStopObject().reason);
			},
			onInputSubmitted: () => this.removeKeyBoardHandler(),
			startMainLoop: () => this.startMainLoop(),
			continueExecution: () => this.startContinue()
		});
		if (result.status === "invalid") {
			return;
		}

		if (result.status === "pending") {
			if (result.reason === "waitInput") {
				this.fnWaitSound();
			}
			// make sure the handler is set
			this.keyboard.setOptions({
				fnOnKeyDown: this.fnWaitInputHandler
			});
		}
	}

	// merge two scripts with sorted line numbers, lines from script2 overwrite lines from script1
	private mergeScripts(script1: string, script2: string) {
		return this.runtime.mergeScripts(
			script1,
			script2,
			this.model.getProperty<boolean>(ModelPropID.implicitLines),
			() => this.reportSplitLinesError()
		);
	}

	// get line range from a script with sorted line numbers
	private fnGetLinesInRange(script: string, firstLine: number, lastLine: number) {
		return this.runtime.getLinesInRangeFromScript(
			script,
			firstLine,
			lastLine,
			this.model.getProperty<boolean>(ModelPropID.implicitLines),
			() => this.reportSplitLinesError()
		);
	}

	private reportSplitLinesError(): void {
		UiUtils.console.warn("splitLines: No line numbers?");
		this.outputError(this.vm.vmComposeError(Error(), 21, "split"), true);
	}

	private fnGetStorageDirectoryEntries(mask?: string) {
		return this.engine.files.getStorageDirectoryEntries(this.getStorage(), mask);
	}

	private fnFileCat(paras: VmFileParas): void {
		const stream = paras.stream,
			dirList = this.fnGetStorageDirectoryEntries();

		this.runtime.printDirectoryEntries(dirList, stream, true);

		// currently only from localstorage

	}

	private fnFileDir(paras: VmFileParas): void {
		const stream = paras.stream,
			example = this.model.getProperty<string>(ModelPropID.example),
			dirList = this.engine.files.getDirectoryEntries(this.getStorage(), this.model.getAllExamples(), example, paras.fileMask);
		this.runtime.printDirectoryEntries(dirList, stream, false);
	}

	private fnFileEra(paras: VmFileParas): void {
		this.runtime.eraseFiles(this.getFileHandler(), paras, (name) => {
			if (UiUtils.debug > 0) {
				UiUtils.console.debug("fnEraseFile: name=" + name + ": removed from localStorage");
			}
		}, (name) => {
			UiUtils.console.warn("fnEraseFile: file not found in localStorage:", name);
		});
	}

	private decodeTokenizedBasic(input: string) {
		return this.runtime.basicTokenizer.decode(input);
	}

	private prettyPrintBasic(input: string, keepWhiteSpace: boolean, keepBrackets: boolean, keepColons: boolean) {
		const output = this.runtime.codeGeneratorBasic.generatePretty(input, keepWhiteSpace, keepBrackets, keepColons);

		if (output.error) {
			this.outputError(output.error);
		}
		return output.text;
	}

	private loadFileContinue(input: string | null | undefined) { // eslint-disable-line complexity
		const inFile = this.vm.vmGetInFileObject();
		this.runtime.continueLoad(input, inFile, {
			decode: (storedInput) => this.engine.files.decodeStoredFile(storedInput, {
				atobFn: (value) => this.host.atobFn(value),
				decodeTokenizedBasic: (value) => this.decodeTokenizedBasic(value),
				applySnapshot: (value) => this.runtime.applySnapshot(value),
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
			onUnknownCommand: (value) => UiUtils.console.error("loadExample: Unknown command:", value),
			startMainLoop: () => this.startMainLoop(),
			onWarning: (error) => UiUtils.console.warn(error),
			onError: (message) => UiUtils.console.error(message),
			decodeTokenizedBasic: (value) => this.decodeTokenizedBasic(value)
		});
	}

	private createFnExampleLoaded(example: string, url: string, inFile: ReturnType<typeof this.vm.vmGetInFileObject>) {
		return (_sFullUrl: string, key: string, suppressLog?: boolean) => {
			if (key !== example) {
				UiUtils.console.warn("fnExampleLoaded: Unexpected", key, "<>", example);
			}
			const exampleEntry = this.model.getExample(example);

			if (!suppressLog) {
				UiUtils.console.log("Example", url, (exampleEntry.meta ? exampleEntry.meta + " " : "") + "loaded");
			}
			this.model.setProperty(ModelPropID.example, inFile.memorizedExample);
			const input = exampleEntry.script;
			this.runtime.completeExampleLoad(input, exampleEntry.rsx, (loadedInput) => this.loadFileContinue(loadedInput));
		};
	}

	private createFnExampleError(example: string, url: string, inFile: ReturnType<typeof this.vm.vmGetInFileObject>) {
		return () => {
			UiUtils.console.log("Example", url, "error");
			this.model.setProperty(ModelPropID.example, inFile.memorizedExample);
			this.runtime.failExampleLoad(example, (error, noSelection) => this.outputError(error, noSelection), (input) => this.loadFileContinue(input));
		};
	}

	private getLoadScript() {
		return this.host.loadScript;
	}

	getOutputText(): string {
		return this.outScript;
	}

	setOutputText(text: string): void {
		this.outScript = text;
		this.invalidateScript();
		this.view.setAreaValue(ViewID.outputText, text);
		if (this.options.onOutputText) {
			this.options.onOutputText(text);
		}
	}

	private setResultText(text: string, scroll = false) {
		this.view.setAreaValue(ViewID.resultText, text);
		if (this.options.onResultText) {
			this.options.onResultText(text);
		}
		if (scroll) {
			this.view.setAreaScrollTop(ViewID.resultText); // scroll to bottom
		}
	}

	private loadExampleFile() {
		const inFile = this.vm.vmGetInFileObject(),
			key = this.model.getProperty<string>(ModelPropID.example),
			plan = this.engine.files.prepareExampleLoad(inFile.name, key, this.model.getAllExamples(), this.model.getDatabase().src),
			example = plan.name,
			exampleEntry = plan.entry,
			url = plan.url;
		inFile.memorizedExample = plan.memorizedExample;

		if (UiUtils.debug > 0) {
			UiUtils.console.debug("loadExample: name=" + example + " (current=" + key + ")");
		}

		if (plan.status === "loaded" && exampleEntry) {
			this.model.setProperty(ModelPropID.example, example);
			const fnExampleLoaded = this.createFnExampleLoaded(example, url, inFile);

			fnExampleLoaded("", example, true);
		} else if (plan.status === "fetch" && exampleEntry) { // need to load
			this.model.setProperty(ModelPropID.example, example);
			this.getLoadScript()(url, this.createFnExampleLoaded(example, url, inFile), this.createFnExampleError(example, url, inFile), example);
		} else { // keep original example in this error case
			if (example !== "") { // only if not empty
				UiUtils.console.warn("loadExample: Unknown file:", example);
				const fnExampleError = this.createFnExampleError(example, url, inFile);

				fnExampleError();
			} else {
				this.model.setProperty(ModelPropID.example, example);
				this.runtime.completeExampleLoad("", undefined, (input) => this.loadFileContinue(input)); // empty input?
			}
		}
	}

	private tryLoadingFromLocalStorage(name: string) {
		return this.engine.files.loadFromStorage(this.getStorage(), name);
	}

	private fnFileLoad() {
		const inFile = this.vm.vmGetInFileObject();

		this.runtime.dispatchFileLoad(inFile, {
			deleteLines: (paras) => this.fnDeleteLines(paras),
			logFile: (file) => {
				if (UiUtils.debug > 1) {
					UiUtils.console.debug("fnFileLoad:", file.command, file.name, "details:", file);
				}
			},
			loadFromStorage: (name) => this.tryLoadingFromLocalStorage(name),
			onStorageLoad: (input) => {
				if (UiUtils.debug > 0) {
					UiUtils.console.debug("fnFileLoad:", inFile.command, inFile.name, "from localStorage");
				}
				this.loadFileContinue(input);
			},
			loadExample: () => this.loadExampleFile(),
			onNotOpen: (name) => UiUtils.console.error("fnFileLoad:", name, "File not open!"),
			setNextDelay: (delay) => this.runtime.setNextDelay(delay)
		});
	}

	private fnFileSave() {
		const outFile = this.vm.vmGetOutFileObject();

		this.runtime.dispatchFileSave(
			outFile,
			(file) => this.getFileHandler().saveFile(file, () => this.getInputText(), (input, storageName) => this.runtime.encodeTokenizedBasic(input, storageName)).data,
			(name) => {
				if (UiUtils.debug > 0) {
					UiUtils.console.debug("fnFileSave: name=" + name + ": put into localStorage");
				}
			},
			() => UiUtils.console.error("fnFileSave: file not open!"),
			(error) => UiUtils.console.warn(error)
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
			() => this.virtualKeyboard?.reset(),
			() => this.setOutputText(""),
			() => this.invalidateScript()
		);
	}

	private outputError(error: Error, noSelection?: boolean) {
		const stream = 0,
			diagnostic = this.engine.createDiagnostic(error, noSelection, error.name === "CpcVm" ? this.vm.err() : undefined),
			shortError = diagnostic.shortMessage;

		this.uiController.onDiagnostic(diagnostic);
		this.options.onDiagnostic?.(diagnostic);

		const escapedShortError = this.engine.escapeControlCharacters(shortError);

		this.vm.print(stream, escapedShortError + "\r\n");
		return shortError;
	}

	private fnRenumLines(paras: VmLineRenumParas) {
		this.runtime.renumProgram(
			this.getInputText(),
			paras,
			(source, newLine, oldLine, step, keep) => this.runtime.basicFormatter.renumber(source, newLine, oldLine, step, keep),
			(source) => {
				this.fnPutChangedInputOnStack();
				this.setInputText(source, true);
				this.fnPutChangedInputOnStack();
			},
			(error) => {
				UiUtils.console.warn(error);
				this.outputError(error);
			}
		);
	}

	private fnEditLineCallback() {
		const inputParas = this.vm.vmGetStopObject().paras as VmInputParas,
			inputText = this.getInputText();
		return this.runtime.commitEditedLine(
			inputParas,
			inputText,
			(source, edited) => this.mergeScripts(source, edited),
			(source) => this.setInputText(source),
			() => this.uiController.onProgramEdited()
		);
	}

	private fnEditLine(paras: VmLineParas) {
		const input = this.getInputText(),
			lineNumber = paras.first || 0,
			lines = this.fnGetLinesInRange(input, lineNumber, lineNumber);
		if (this.runtime.editLine(paras, lines[0], this.fnEditLineCallbackHandler, (error) => this.outputError(error))) {
			this.fnWaitInput();
		}
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
		this.uiController.refreshVariables();
		this.uiController.onVarSelectChange();
		return this.getOutputText();
	}

	private fnParseAndStart(clearVariables: boolean, clearBeforeRun: boolean): void {
		this.runtime.compileAndStartProgram({
			clearVariables,
			clearBeforeRun
		});
	}

	fnPretty(): void {
		const input = this.getInputText(),
			keepWhiteSpace = this.view.getInputChecked(ViewID.prettySpaceInput),
			keepBrackets = this.view.getInputChecked(ViewID.prettyBracketsInput),
			keepColons = this.view.getInputChecked(ViewID.prettyColonsInput),
			output = this.prettyPrintBasic(input, keepWhiteSpace, keepBrackets, keepColons);

		if (output) {
			this.fnPutChangedInputOnStack();
			this.setInputText(output, true);
			this.fnPutChangedInputOnStack();

			// for testing:
			const diff = this.runtime.formatDiff(input, output);

			this.setOutputText(diff);
		}
	}

	fnAddLines(): void {
		const input = this.getInputText(),
			output = this.runtime.addLineNumbers(input);

		if (output) {
			this.fnPutChangedInputOnStack();
			this.setInputText(output, true);
			this.fnPutChangedInputOnStack();
		}
	}

	fnRemoveLines(): void {
		const input = this.getInputText(),
			output = this.runtime.basicFormatter.removeUnusedLines(input);

		if (output.error) {
			this.outputError(output.error);
		} else {
			this.fnPutChangedInputOnStack();
			this.setInputText(output.text, true);
			this.fnPutChangedInputOnStack();
		}
	}

	private fnGetFilename(input: string) {
		let name = "file";
		const reRemMatcher = /^\d* ?(?:REM|rem) ([\w.]+)+/,
			matches = input.match(reRemMatcher);

		if (matches !== null) {
			name = matches[1];
		} else {
			const example = this.model.getProperty<string>(ModelPropID.example);

			if (example !== "") {
				if (example.indexOf("/") >= 0) {
					name = example.substring(example.lastIndexOf("/") + 1);
				}
			}
		}

		if (name.indexOf(".") < 0) {
			name += ".bas";
		}
		return name;
	}

	// eslint-disable-next-line complexity
	fnDownload(): void {
		const options = this.view.getSelectOptions(ViewID.exportFileSelect),
			exportTokenized = this.view.getInputChecked(ViewID.exportTokenizedInput),
			exportDSK = this.view.getInputChecked(ViewID.exportDSKInput),
			format = this.view.getSelectValue(ViewID.exportDSKFormatSelect),
			stripEmpty = this.view.getInputChecked(ViewID.exportDSKStripEmptyInput),
			exportBase64 = this.view.getInputChecked(ViewID.exportBase64Input),
			editorText = Controller.exportEditorText,
			meta: FileMeta = {
				typeString: "A", // ASCII
				start: 0x170,
				length: 0,
				entry: 0
			};

		let name = "",
			data = "";
		const fileHandler = this.getFileHandler();

		const fnExportBase64 = () => {
			meta.encoding = "base64";
			const metaString = this.engine.files.joinMeta(meta);

			data = metaString + "," + this.host.btoaFn(data);
			name += ".b64.txt";
		};

		if (exportDSK) {
			fileHandler.startDiskImage(format);
		}

		for (let i = 0; i < options.length; i += 1) {
			const item = options[i];

			if (item.selected) {
				if (item.value === editorText) {
					data = this.getInputText();
					name = this.fnGetFilename(data);

					const eolStr = data.indexOf("\r\n") > 0 ? "\r\n" : "\n"; // heuristic: if CRLF found, use it as split

					if (eolStr === "\n") {
						data = data.replace(/\n/g, "\r\n"); // replace LF by CRLF (not really needed if tokenized is used)
					}

					meta.typeString = "A"; // ASCII
					meta.start = 0x170;
					meta.length = data.length;
					meta.entry = 0;
				} else {
					name = item.value;
					data = this.tryLoadingFromLocalStorage(name) || "";
					const metaAndData = this.engine.files.splitMeta(data);

					Object.assign(meta, metaAndData.meta); // copy meta info
					data = metaAndData.data;
				}

				if (exportTokenized && meta.typeString === "A") { // do we need to tokenize it?
					const tokens = this.runtime.encodeTokenizedBasic(data);

					if (tokens) { // successful?
						data = tokens;
						meta.typeString = "T";
						meta.start = 0x170;
						meta.length = data.length;
						meta.entry = 0;
					} else {
						UiUtils.console.warn("Controller: Cannot tokenize, keeping ASCII: " + item.value);
					}
				}

				if (exportDSK) {
					data = fileHandler.addFileToDiskImage(name, data, meta);
					name = name.substring(0, name.indexOf(".") + 1) + "dsk";
					meta.length = data.length;
					meta.typeString = "X"; // (extended) disk image
				} else {
					data = fileHandler.prepareAmsdosFile(name, data, meta);
					if (exportBase64) {
						fnExportBase64();
					}
					if (data) {
						this.view.fnDownloadBlob(data, name);
					}
				}
			}
		}

		if (exportDSK) {
			data = fileHandler.getDiskImageData(stripEmpty);

			if (exportBase64) {
				fnExportBase64();
			}
			if (data) {
				this.view.fnDownloadBlob(data, name);
			}
		}
	}

	private selectJsError(script: string, e: Error) {
		const firefoxError = e as Error & { lineNumber?: number, columnNumber?: number },
			lineNumber = firefoxError.lineNumber, // only on FireFox
			columnNumber = firefoxError.columnNumber;

		if (lineNumber || columnNumber) { // only available on Firefox
			const errLine = Number(lineNumber) - 3; // for some reason line 0 is 3
			let pos = 0,
				line = 0;

			while (pos < script.length && line < errLine) {
				pos = script.indexOf("\n", pos) + 1;
				line += 1;
			}
			pos += Number(columnNumber);

			UiUtils.console.warn("Info: JS Error occurred at line", lineNumber, "column", columnNumber, "pos", pos);

			this.view.setAreaSelection(ViewID.outputText, pos, pos + 1);
		}
	}

	private fnChain(paras?: VmLineParas, clearBeforeRun = false) {
		const script = this.getOutputText(),
			line = paras && paras.first || 0;
		this.runtime.startProgram(script, line, clearBeforeRun);
	}

	private beforeProgramStart(): void {
		if (this.vm.vmGetOutFileObject().open) {
			this.fnFileSave();
		}
	}

	private afterProgramStart(): void {
		if (!this.inputSet) {
			this.inputSet = true;
			const input = this.model.getProperty<string>(ModelPropID.input);

			if (input !== "") {
				this.view.setAreaValue(ViewID.inp2Text, input);
				const timeout = 1;

				this.host.setTimeout(() => {
					this.startEnter();
					this.view.setAreaValue(ViewID.inp2Text, ""); // delete input
				}, timeout);
			}
		}

		if (UiUtils.debug > 1) {
			UiUtils.console.debug("End of fnRun");
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
				if (UiUtils.debug > 0) {
					UiUtils.console.debug("fnDirectInput: insert line=" + input);
				}
				this.runtime.insertDirectProgramLine(
					inputText,
					input,
					stream,
					(source, line) => this.mergeScripts(source, line),
					(source) => this.setInputText(source, true),
					() => this.uiController.onProgramEdited()
				);
				this.updateResultText();
				return false; // continue direct input
			}

			if (UiUtils.debug > 0) {
				UiUtils.console.log("fnDirectInput: execute:", input);
			}

			const output = this.runtime.executeDirectCommand(input, inputText, this.vm.line as number, stream, directInput.message, {
				outputError: (error) => this.outputError(error, true),
				setOutputText: (text) => this.setOutputText(text),
				onPrepareError: (error) => {
					UiUtils.console.error(error);
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
			this.stopUpdateCanvas();
			if (UiUtils.debug) {
				UiUtils.console.log("We are ready.");
			}
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

		this.uiController.refreshVariables();
		this.uiController.onVarSelectChange();

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
		this.runtime.beginControl("parse", () => this.removeKeyBoardHandler());
		this.startMainLoop();
	}

	startRenum(options: RenumOptions = this.uiController.getRenumOptions()): void {
		const stream = 0;

		this.runtime.beginRenumber(options);

		if (this.vm.pos(stream) > 1) {
			this.vm.print(stream, "\r\n");
		}
		this.vm.print(stream, "renum\r\n");
		this.startMainLoop();
	}

	startRun(): void {
		this.runtime.beginControl("run", () => this.removeKeyBoardHandler());
		this.startMainLoop();
	}

	startParseRun(): void {
		this.runtime.beginControl("parseRun", () => this.removeKeyBoardHandler());
		this.startMainLoop();
	}

	startBreak(): void {
		this.runtime.beginControl("break", () => this.removeKeyBoardHandler());
		this.startMainLoop();
	}

	private restoreSuspendedInputHandlers(stop: ReturnType<typeof this.vm.vmGetStopObject>): void {
		switch (stop.reason) {
		case "waitInput":
			this.vm.cursor(stop.paras.stream, 1);
			this.keyboard.setOptions({
				fnOnKeyDown: this.fnWaitInputHandler
			});
			break;
		case "waitKey":
			this.keyboard.setOptions({
				fnOnKeyDown: this.fnWaitKeyHandler
			});
			break;
		}
	}

	startContinue(): void {
		this.view.setDisabled(ViewID.runButton, true);
		this.view.setDisabled(ViewID.stopButton, false);
		this.view.setDisabled(ViewID.continueButton, true);
		this.runtime.continueProgram(
			() => this.startMainLoop(),
			() => this.removeKeyBoardHandler(),
			(restored) => {
				const stop = this.vm.vmGetStopObject();
				if (restored || stop.reason === "waitInput") {
					this.restoreSuspendedInputHandlers(stop);
				}
			}
		);
	}

	startReset(): void {
		this.runtime.beginControl("reset", () => this.removeKeyBoardHandler());
		this.startMainLoop();
	}

	startScreenshot(): string {
		return this.canvas.takeScreenShot();
	}

	putKeys(keys: string): void {
		this.fnPutKeysInBuffer(keys);
	}

	private fnPutKeysInBuffer(keys: string) {
		for (let i = 0; i < keys.length; i += 1) {
			this.keyboard.putKeyInBuffer(keys.charAt(i));
		}

		const options = this.keyboard.getOptions(),
			keyDownHandler = options.fnOnKeyDown;

		if (keyDownHandler) {
			keyDownHandler();
		}
	}

	private static parseUserKeys(source: string): UserKeyType[] {
		const keys: UserKeyType[] = [];

		for (const [index, line] of source.split(/\r?\n/).entries()) {
			const declaration = /^\s*(?:\d+\s*)?(?:REM\s+|'\s*)CPCBasic-keys:\s*(\[.*\])\s*$/i.exec(line);

			if (!declaration) {
				continue;
			}

			let items: unknown;

			try {
				items = JSON.parse(declaration[1]) as unknown;
			} catch (error) {
				UiUtils.console.warn("CPCBasic-keys at line " + (index + 1) + ": Invalid JSON", error);
				continue;
			}

			if (!Array.isArray(items) || items.length % 2 !== 0) {
				UiUtils.console.warn("CPCBasic-keys at line " + (index + 1) + ": Expected key/label pairs");
				continue;
			}

			for (let i = 0; i < items.length; i += 2) {
				const key = items[i] as unknown,
					label = items[i + 1] as unknown;
				let code: number,
					text: string;

				if (typeof key === "string" && key.length) {
					code = key.charCodeAt(0);
				} else if (typeof key === "number" && Number.isInteger(key) && key >= 0 && key <= 65535) {
					code = key;
				} else {
					UiUtils.console.warn("CPCBasic-keys at line " + (index + 1) + ": Invalid key", key);
					continue;
				}

				if (typeof label === "string") {
					text = label;
				} else if (typeof label === "number" && Number.isInteger(label) && label >= 0 && label <= 65535) {
					text = String.fromCharCode(label);
				} else {
					UiUtils.console.warn("CPCBasic-keys at line " + (index + 1) + ": Invalid label", label);
					continue;
				}

				keys.push({
					code: code,
					text: text || String.fromCharCode(code)
				});
			}
		}
		return keys;
	}

	private updateUserKeys(source: string): void {
		const container = View.getElementById1(ViewID.userKeys),
			keys = Controller.parseUserKeys(source);

		while (container.firstChild) {
			container.removeChild(container.firstChild);
		}
		for (const item of keys) {
			const button = document.createElement("button"),
				text = item.text || String.fromCharCode(item.code);

			button.type = "button";
			button.textContent = text;
			button.setAttribute("data-key", String(item.code));
			button.setAttribute("aria-label", text);
			button.title = text + " (" + item.code + ")";
			container.appendChild(button);
		}
		container.hidden = !keys.length;
	}

	private onUserKeyClick(event: Event): void {
		const target = View.getEventTarget<HTMLElement>(event);

		if (target.tagName === "BUTTON") {
			const code = Number(target.getAttribute("data-key"));

			if (Number.isInteger(code) && code >= 0 && code <= 65535) {
				this.fnPutKeysInBuffer(String.fromCharCode(code));
			}
		}
	}

	startEnter(): void {
		let input = this.view.getAreaValue(ViewID.inp2Text);

		input = input.replace(/\n/g, "\r"); // LF => CR
		this.fnPutKeysInBuffer(input);
	}

	private static generateFunction(par: string, functionString: string) {
		if (functionString.startsWith("function anonymous(")) { // already a modified function (inside an anonymous function)?
			const firstIndex = functionString.indexOf("{"),
				lastIndex = functionString.lastIndexOf("}");

			if (firstIndex >= 0 && lastIndex >= 0) {
				functionString = functionString.substring(firstIndex + 1, lastIndex - 1); // remove anonymous function
			}
			functionString = functionString.trim();
		} else {
			functionString = "var o=cpcBasic.controller.vm, v=o.vmGetAllVariables(); v." + par + " = " + functionString;
		}

		const match = (/function \(([^)]*)/).exec(functionString),
			args = match ? match[1].split(",") : [],
			fnFunction = new Function(args[0], args[1], args[2], args[3], args[4], functionString); // eslint-disable-line no-new-func
			// we support at most 5 arguments

		return fnFunction;
	}

	changeVariable(): void {
		const par = this.view.getSelectValue(ViewID.varSelect),
			valueString = this.view.getSelectValue(ViewID.varText),
			variables = this.variables;
		let value = variables.getVariable(par);

		if (typeof value === "function") {
			value = Controller.generateFunction(par, valueString);
			variables.setVariable(par, value);
		} else {
			const varType = this.variables.determineStaticVarType(par),
				type = this.vm.vmDetermineVarType(varType); // do we know dynamic type?

			if (type !== "$") { // not string? => convert to number
				value = parseFloat(valueString);
			} else {
				value = valueString;
			}

			try {
				const value2 = this.vm.vmAssign(varType, value);

				variables.setVariable(par, value2);
				UiUtils.console.log("Variable", par, "changed:", variables.getVariable(par), "=>", value);
			} catch (e) {
				UiUtils.console.warn(e);
			}
		}
		this.uiController.refreshVariables();
		this.uiController.onVarSelectChange(); // title change?
	}

	setBasicVersion(basicVersion: string): void {
		this.runtime.setBasicVersion(basicVersion);
		this.invalidateScript();
	}

	setPalette(palette: string): void {
		const validPalette = palette === "green" || palette === "grey" ? palette : "color";

		this.canvas.setOptions({
			palette: validPalette
		});
	}

	setCanvasType(canvasType: string): ICanvas {
		let canvas = this.canvas;

		if (canvas) {
			canvas.stopUpdateCanvas(); // stop updates on current canvas
			const canvasID = canvas.getOptions().canvasID;

			this.view.setHidden(canvasID, true);
		} else if (canvasType !== "graphics") {
			// initially graphics canvas is not hidden, but we must hide it, if other canvas should be shown
			this.view.setHidden(ViewID.cpcCanvas, true);
		}

		const palette = this.model.getProperty<string>(ModelPropID.palette);

		if (this.canvases[canvasType]) {
			canvas = this.canvases[canvasType];
			this.canvas = canvas;
			this.setPalette(palette);
		} else {
			const validPalette = palette === "green" || palette === "grey" ? palette : "color";

			if (canvasType === "text") {
				canvas = new TextCanvas({
					canvasID: ViewID.textText,
					charset: cpcCharset,
					palette: validPalette
				});
			} else if (canvasType === "none") {
				canvas = new NoCanvas({
					canvasID: ViewID.noCanvas,
					charset: cpcCharset,
					palette: validPalette
				});
			} else { // "graphics"
				const isAreaHidden = this.view.getHidden(ViewID.cpcArea);

				// make sure canvas area is not hidden when creating canvas object (allows to get width, height)
				if (isAreaHidden) {
					this.uiController.toggleAreaHiddenById("change", ViewID.showCpcInput); // show: ViewID.cpcArea
				}
				this.view.setHidden(ViewID.cpcCanvas, false);
				canvas = new Canvas({
					canvasID: ViewID.cpcCanvas,
					charset: cpcCharset,
					palette: validPalette
				});
				if (isAreaHidden) {
					this.uiController.toggleAreaHiddenById("change", ViewID.showCpcInput); // hide again: ViewID.cpcArea
				}
			}
			this.canvases[canvasType] = canvas;
			this.canvas = canvas;
		}

		if (this.vm) {
			//const handler = this.vm.getOnCanvasClickHandler();
			this.canvas.setOptions({
				onCanvasClick: this.vmOnCanvasClickHandler
			});
			this.vm.setCanvas(canvas);
		}

		const canvasId = canvas.getOptions().canvasID;

		this.view.setHidden(canvasId, false);
		if (this.model.getProperty<boolean>(ModelPropID.showCpc)) {
			this.canvas.startUpdateCanvas();
		}
		return canvas;
	}

	setSoundActive(): void {
		const sound = this.sound,
			active = this.model.getProperty<boolean>(ModelPropID.sound);

		if (active) {
			sound.soundOn();
		} else {
			sound.soundOff();
			const stop = this.vm && this.vm.vmGetStopObject();

			if (stop && stop.reason === "waitSound") {
				this.vm.vmStop("", 0, true); // do not wait
			}
		}
	}

	private getZ80Disass() {
		if (!this.z80Disass) {
			const dataArr = this.vm.vmGetMem(),
				data = dataArr as unknown as Uint8Array; // fast hack: we take number array as Uint8Array

			this.z80Disass = new Z80Disass({
				data: data,
				addr: 0
			});
		}
		return this.z80Disass;
	}

	setDisassAddr(addr: number, endAddr?: number): void {
		const z80Disass = this.getZ80Disass();

		if (endAddr === undefined) {
			endAddr = addr + 0x100;
		}

		z80Disass.setOptions({
			addr: addr
		});

		const opts = z80Disass.getOptions(),
			lines = [];

		while (addr < endAddr) { // currently not limited to < 0x10000
			lines.push(z80Disass.disassLine());
			if (opts.addr > addr) {
				addr = opts.addr;
			} else {
				UiUtils.console.error("setDisassAddr: Not increasing:", addr, opts.addr);
				break;
			}
		}

		const out = lines.join("\n") + "\n";

		this.view.setAreaValue(ViewID.disassText, out);
	}


	private fnEndOfImport(imported: string[]) {
		const stream = 0,
			vm = this.vm;

		for (let i = 0; i < imported.length; i += 1) {
			vm.print(stream, imported[i], " ");
		}
		vm.print(stream, "\r\n", imported.length + " file" + (imported.length !== 1 ? "s" : "") + " imported.\r\n");
		this.updateResultText();
	}

	private static fnOnDragover(evt: DragEvent) {
		evt.stopPropagation();
		evt.preventDefault();
		if (evt.dataTransfer !== null) {
			evt.dataTransfer.dropEffect = "copy"; // explicitly show this is a copy
		}
	}

	private adaptFilename(name: string, err: string) {
		return this.vm.vmAdaptFilename(name, err);
	}

	private getFileHandler() {
		if (!this.fileHandler) {
			this.fileHandler = this.engine.createFileHandler({
				adaptFilename: this.adaptFilename.bind(this),
				updateStorageDatabase: this.updateStorageDatabase.bind(this),
				outputError: this.outputError.bind(this),
				processFileImports: this.model.getProperty<boolean>(ModelPropID.processFileImports),
				storage: this.getStorage()
			});
		}
		return this.fileHandler;
	}

	private getFileSelect(fileHandler: FileHandlerType) {
		if (!this.fileSelect) {
			this.fileSelect = new FileSelect({
				fnEndOfImport: this.fnEndOfImport.bind(this),
				fnLoad2: fileHandler.fnLoad2.bind(fileHandler)
			});
		}
		return this.fileSelect;
	}

	private initDropZone() {
		const fileHandler = this.getFileHandler(),
			fileSelect = this.getFileSelect(fileHandler),
			dropZone = View.getElementById1(ViewID.dropZone);

		dropZone.addEventListener("dragover", this.fnOnDragoverHandler, false);
		fileSelect.addFileSelectHandler(dropZone, "drop");

		const canvasID = this.canvas.getOptions().canvasID,
			canvasElement = View.getElementById1(canvasID);

		canvasElement.addEventListener("dragover", this.fnOnDragoverHandler, false);
		fileSelect.addFileSelectHandler(canvasElement, "drop");

		const fileInput = View.getElementById1(ViewID.fileInput);

		fileSelect.addFileSelectHandler(fileInput, "change");
	}

	private fnUpdateUndoRedoButtons() {
		this.view.setDisabled(ViewID.undoButton, !this.inputStack.canUndoKeepOne());
		this.view.setDisabled(ViewID.undoButton2, !this.inputStack.canUndoKeepOne());
		this.view.setDisabled(ViewID.redoButton, !this.inputStack.canRedo());
		this.view.setDisabled(ViewID.redoButton2, !this.inputStack.canRedo());
	}

	private fnInitUndoRedoButtons() {
		this.inputStack.reset();
		this.fnUpdateUndoRedoButtons();
	}

	private fnPutChangedInputOnStack() {
		const input = this.getInputText(),
			stackInput = this.inputStack.getInput();

		if (stackInput !== input) {
			this.inputStack.save(input);
			this.fnUpdateUndoRedoButtons();
		}
	}

	startUpdateCanvas(): void {
		this.canvas.startUpdateCanvas();
	}

	stopUpdateCanvas(): void {
		this.canvas.stopUpdateCanvas();
	}

	private getDragElement(): DragElement {
		if (!this.dragElement) {
			this.dragElement = new DragElement({
				view: this.view,
				entries: {}
			});
		}
		return this.dragElement;
	}

	getVirtualKeyboard(): VirtualKeyboard {
		if (!this.virtualKeyboard) {
			this.virtualKeyboard = new VirtualKeyboard({
				view: this.view,
				fnPressCpcKey: this.keyboard.fnPressCpcKey.bind(this.keyboard),
				fnReleaseCpcKey: this.keyboard.fnReleaseCpcKey.bind(this.keyboard)
			});
		}
		return this.virtualKeyboard;
	}

	private dragElementsData: Partial<DragElementOptions> = {
		entries: {
			consoleLogArea: {
				itemId: ViewID.consoleLogArea,
				xOffset: 0,
				yOffset: 0,
				enabled: false
			},
			cpcArea: {
				itemId: ViewID.cpcArea,
				xOffset: 0,
				yOffset: 0,
				enabled: false
			},
			disassArea: {
				itemId: ViewID.disassArea,
				xOffset: 0,
				yOffset: 0,
				enabled: false
			},
			inp2Area: {
				itemId: ViewID.inp2Area,
				xOffset: 0,
				yOffset: 0,
				enabled: false
			},
			inputArea: {
				itemId: ViewID.inputArea,
				xOffset: 0,
				yOffset: 0,
				enabled: false
			},
			kbdArea: {
				itemId: ViewID.kbdArea,
				xOffset: 0,
				yOffset: 0,
				enabled: false
			},
			mainArea: {
				itemId: ViewID.mainArea,
				xOffset: 0,
				yOffset: 0,
				enabled: false
			},
			outputArea: {
				itemId: ViewID.outputArea,
				xOffset: 0,
				yOffset: 0,
				enabled: false
			},
			resultArea: {
				itemId: ViewID.resultArea,
				xOffset: 0,
				yOffset: 0,
				enabled: false
			},
			variableArea: {
				itemId: ViewID.variableArea,
				xOffset: 0,
				yOffset: 0,
				enabled: false
			}
		}
	};

	fnDragElementsActive(enabled: boolean): void {
		const dragElement = this.getDragElement(),
			dragElementsData = this.dragElementsData;

		for (const entry in dragElementsData.entries) {
			if (Object.prototype.hasOwnProperty.call(dragElementsData.entries, entry)) {
				dragElementsData.entries[entry].enabled = enabled;
			}
		}

		dragElement.setOptions(this.dragElementsData);
	}

	getVariableNames(): string[] {
		return this.variables.getAllVariableNames();
	}

	getVariable(par: string): VariableValue {
		return this.variables.getVariable(par);
	}

	undoStackElement(): string {
		return this.inputStack.undo();
	}

	redoStackElement(): string {
		return this.inputStack.redo();
	}

	private createFnDatabaseLoaded(url: string) {
		return (_sFullUrl: string, key: string) => {
			const selectedName = this.model.getProperty<string>(ModelPropID.database);

			if (selectedName === key) {
				this.model.getDatabase().loaded = true;
			} else { // should not occur
				UiUtils.console.warn("databaseLoaded: name changed: " + key + " => " + selectedName);
				this.model.setProperty(ModelPropID.database, key);
				const database = this.model.getDatabase();

				if (database) {
					database.loaded = true;
				}
				this.model.setProperty(ModelPropID.database, selectedName);
			}

			UiUtils.console.log("fnDatabaseLoaded: database loaded: " + key + ": " + url);
			this.setDirectorySelectOptions();
			this.onDirectorySelectChange();
		};
	}

	private createFnDatabaseError(url: string) {
		return (_sFullUrl: string, key: string) => {
			UiUtils.console.error("fnDatabaseError: database error: " + key + ": " + url);
			this.setDirectorySelectOptions();
			this.onDirectorySelectChange();
			this.setInputText("");
			this.setResultText("Cannot load database: " + key);
		};
	}

	onDatabaseSelectChange(): void {
		const databaseName = this.view.getSelectValue(ViewID.databaseSelect);

		this.view.setSelectTitleFromSelectedOption(ViewID.databaseSelect);
		this.loadDatabase(databaseName);
	}

	loadDatabase(name?: string): void {
		if (name !== undefined) {
			this.model.setProperty(ModelPropID.database, name);
		}
		const databaseName = this.model.getProperty<string>(ModelPropID.database);
		const database = this.model.getDatabase();

		if (!database) {
			UiUtils.console.error("onDatabaseSelectChange: database not available:", databaseName);
			return;
		}

		if (database.text === "storage") { // special handling: browser localStorage
			this.updateStorageDatabase("set", ""); // set all
			database.loaded = true;
		}

		if (database.loaded) {
			this.setDirectorySelectOptions();
			this.onDirectorySelectChange();
		} else {
			this.setInputText("#loading database " + databaseName + "...");
			const exampleIndex = this.model.getProperty<string>(ModelPropID.exampleIndex),
				url = database.src + "/" + exampleIndex;

			this.getLoadScript()(url, this.createFnDatabaseLoaded(url), this.createFnDatabaseError(url), databaseName);
		}
	}

	onDirectorySelectChange(): void {
		this.setExampleSelectOptions();
		this.onExampleSelectChange();
	}

	onExampleSelectChange(): void {
		const directoryName = this.view.getSelectValue(ViewID.directorySelect);
		let exampleName = this.view.getSelectValue(ViewID.exampleSelect);

		if (directoryName) {
			exampleName = directoryName + "/" + exampleName;
		}
		this.loadExample(exampleName);
	}

	loadExample(key: string, options: ExampleLoadOptions = {}): void {
		const vm = this.vm,
			inFile = vm.vmGetInFileObject(),
			dataBaseName = this.model.getProperty<string>(ModelPropID.database);
		this.model.setProperty(ModelPropID.example, key);
		vm.closein();
		this.uiController.setPopoversHiddenExcept();
		inFile.open = true;
			const request = this.engine.files.createExampleLoadRequest(key, dataBaseName, this.model.getExample(key)?.meta, options.autorun ?? this.model.getProperty<boolean>(ModelPropID.autorun));
		inFile.command = request.command;
		inFile.name = request.name;
		inFile.start = undefined;
		inFile.fnFileCallback = vm.vmGetLoadHandler();
		vm.vmStop("fileLoad", 90);
		this.startMainLoop();
	}

	// currently not used. Can be called manually: cpcBasic.controller.exportAsBase64(file);
	exportAsBase64(storageName: string): string { // eslint-disable-line class-methods-use-this
		const storage = this.getStorage();
		let data = storage.getItem(storageName),
			out = "";

		if (data !== null) {
			const index = data.indexOf(","); // metadata separator

			if (index >= 0) {
				const meta = data.substring(0, index);

				data = data.substring(index + 1);
				data = this.host.btoaFn(data);
				out = meta + ";base64," + data;
			} else { // hmm, no meta info
				data = this.host.btoaFn(data);
				out = "base64," + data;
			}
		}
		UiUtils.console.log(out);
		return out;
	}

	onCpcCanvasClick(event: MouseEvent): void {
		this.uiController.setPopoversHiddenExcept(); // hide all popovers

		this.canvas.onCanvasClick(event);
		this.keyboard.setActive(true);
	}

	onWindowClick(event: Event): void {
		this.canvas.onWindowClick(event);
		this.keyboard.setActive(false);
	}

	fnArrayBounds(): void {
		const arrayBounds = this.model.getProperty<boolean>(ModelPropID.arrayBounds);
		this.runtime.setArrayBounds(arrayBounds);
	}

	fnImplicitLines(): void {
		const implicitLines = this.model.getProperty<boolean>(ModelPropID.implicitLines);
		this.runtime.setImplicitLines(implicitLines);
	}

	fnRemoveAllVariables(): void {
		if (Object.keys(this.variables.getAllVariables()).length) {
			this.variables.removeAllVariables();
			this.uiController.refreshVariables();
		}
	}

	fnPrettyLowercaseVars(): void {
		const prettyLowercaseVars = this.model.getProperty<boolean>(ModelPropID.prettyLowercaseVars);
		this.runtime.setPrettyLowercaseVars(prettyLowercaseVars);
	}

	fnIntegerOverflow(): void {
		const integerOverflow = this.model.getProperty<boolean>(ModelPropID.integerOverflow);
		this.runtime.setIntegerOverflow(integerOverflow);
	}

	fnTrace(): void {
		const trace = this.model.getProperty<boolean>(ModelPropID.trace);
		this.runtime.setTrace(trace);
	}

	fnSpeed(): void {
		const speed = this.model.getProperty<number>(ModelPropID.speed);

		this.initialLoopTimeout = this.engine.getLoopDelay(speed);
	}

	/* eslint-disable no-invalid-this */
	private readonly handlers: Record<string, (paras: VmBaseParas) => void> = {
		waitKey: this.fnWaitKey,
		waitSound: this.fnWaitSound,
		waitInput: this.fnWaitInput,
		fileCat: this.fnFileCat,
		fileDir: this.fnFileDir,
		fileEra: this.fnFileEra,
		fileRen: (paras) => this.runtime.renameFile(this.getFileHandler(), paras),
		renumLines: this.fnRenumLines,
		deleteLines: this.fnDeleteLines,
		editLine: this.fnEditLine,
		list: this.fnList,
		fileLoad: this.fnFileLoad,
		fileSave: this.fnFileSave,
		"new": this.fnNew,
		run: this.fnRun,
		parse: () => this.runtime.parseProgram(),
		parseRun: this.fnParseRun,
		reset: this.fnReset
	};
	/* eslint-enable no-invalid-this */
}
