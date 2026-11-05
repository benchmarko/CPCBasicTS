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
import { Snapshot } from "./Snapshot";
import { Variables } from "./Variables";
import { Diff } from "./Diff";
import type { ExecutionState } from "./ExecutionState";
import { Runtime } from "./Runtime";

export interface ControllerOptions0 extends RuntimeHost, RuntimeCallbacks {
	canvas: ICanvasVm
	keyboard: IKeyboard
	sound: ISound
	isHeadlessDirectInput?: boolean
	console: any, //TTT
}

export class Controller0 implements IRuntimeController {
	private readonly fnDirectInputHandler: () => boolean;
	private readonly fnPutKeyInBufferHandler: (key: string) => void;
	private readonly fnEditLineCallbackHandler: () => boolean;

	private inScript = "";
	private outScript = "";

	private initialLoopTimeout = 0;

	private variables: Variables;
	private storage: IStorage;

	private basicFormatter?: BasicFormatter; // for renum
	private basicTokenizer?: BasicTokenizer; // to decode tokenized BASIC
	private codeGeneratorToken?: CodeGeneratorToken; // to encode tokenized BASIC
	private codeGeneratorBasic?: CodeGeneratorBasic; // for pretty print
	private readonly core: ICore;
	private readonly basicLexer: BasicLexer;
	private readonly basicParser: BasicParser;

	private readonly runtime: Runtime;

	private readonly vm: CpcVm;


	private fileHandler?: FileHandler;

	private hasStorageDatabase: boolean;
	private readonly options: ControllerOptions0;

	constructor(core: ICore, options: ControllerOptions0) {
		this.fnDirectInputHandler = this.fnDirectInput.bind(this);
		this.fnPutKeyInBufferHandler = this.fnPutKeysInBuffer.bind(this);
		this.fnEditLineCallbackHandler = this.fnEditLineCallback.bind(this);

		this.core = core;
		const model = this.core.getModel();
		this.options = options;

		this.fnSpeed();

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

		this.hasStorageDatabase = this.getHasStorageDatabase();

		this.storage = this.options.storage;
	}

	private getStorage() {
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
			if (exampleChanged) {
				this.onDirectorySelectChange();
			}
		} else {
			this.core.getModel().setProperty(ModelPropID.database, database); // restore database
		}
	}

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

	invalidateScript(): void {
		this.runtime.invalidateProgram();
	}

	private fnWaitSound() {
		this.runtime.handleWaitSound();
	}

	private fnWaitKey(): string {
		return this.runtime.handleWaitKey();
	}

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
			if (this.runtime.editLine(paras, lines[0], this.fnEditLineCallbackHandler, (error) => this.outputError(error))) {
				this.fnWaitInput();
			}
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
			keepWhiteSpace = model.getProperty<boolean>(ModelPropID.prettySpace),
			keepBrackets = model.getProperty<boolean>(ModelPropID.prettyBrackets),
			keepColons = model.getProperty<boolean>(ModelPropID.prettyColons),
			output = this.prettyPrintBasic(input, keepWhiteSpace, keepBrackets, keepColons);

		if (output) {
			this.setInputText(output, true);

			const diff = Diff.testDiff(input.toUpperCase(), output.toUpperCase());

			this.setOutputText(diff);
		}
	}

	fnAddLines(): void {
		const input = this.getInputText(),
			output = Controller0.addLineNumbers(input);

		if (output) {
			this.setInputText(output, true);
		}
	}

	fnRemoveLines(): void {
		const basicFormatter = this.getBasicFormatter();

		const input = this.getInputText(),
			output = basicFormatter.removeUnusedLines(input);

		if (output.error) {
			this.outputError(output.error);
		} else {
			this.setInputText(output.text, true);
		}
	}

	// eslint-disable-next-line complexity
	fnDownload(): void {
		const options = ["test1"],
			exportTokenized = false,
			exportDSK = false,
			format = "data",
			stripEmpty = false,
			exportBase64 = false,
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
					Utils.console.warn("Controller: Cannot tokenize, keeping ASCII: " + item);
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
			}

			if (diskImage) {
				if (stripEmpty) {
					data = diskImage.stripEmptyTracks();
				}

				if (exportBase64) {
					fnExportBase64();
				}
			}
		}
	}

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

	}

	setBasicVersion(basicVersion: string): void {
		this.runtime.setBasicVersion(basicVersion);
		this.invalidateScript();
	}

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
			this.onDirectorySelectChange();
		};
	}

	private createFnDatabaseError(url: string) {
		return (_sFullUrl: string, key: string) => {
			Utils.console.error("fnDatabaseError: database error: " + key + ": " + url);
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
