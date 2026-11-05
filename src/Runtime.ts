// Runtime.ts - shared DOM-free runtime composition
//

import { BasicLexer } from "./BasicLexer";
import { BasicParser } from "./BasicParser";
import { CodeGeneratorJs } from "./CodeGeneratorJs";
import { CpcVm } from "./CpcVm";
import { InputLine } from "./InputLine";
import type { ExecutionState } from "./ExecutionState";
import { ExecutionStateReporter } from "./ExecutionState";
import type { ICanvasVm, IKeyboard, IOutput, ISound, RenumOptions, VmBaseParas, VmFileParas, VmInputParas, VmLineParas, VmLineRenumParas } from "./Interfaces";
import { ProgramCompiler } from "./ProgramCompiler";
import { ProgramRunner, type CompiledScript, type ProgramFileLoad, type ProgramFileLoadActions, type ProgramLoadContinuationActions, type ProgramLoadFile } from "./ProgramRunner";
import { Random } from "./Random";
import { RsxAmsdos } from "./RsxAmsdos";
import { RsxCpcBasic } from "./RsxCpcBasic";
import { RuntimeSettings } from "./RuntimeSettings";
import { RunLoop } from "./RunLoop";
import { SoundQueue } from "./SoundQueue";
import { SuspendedState } from "./SuspendedState";
import { Utils } from "./Utils";
import { Variables } from "./Variables";
import { BasicFormatter } from "./BasicFormatter";
import { FileHandler, type EraseFilesResult, type RenameFileResult } from "./FileHandler";
import type { CodeGeneratorBasic } from "./CodeGeneratorBasic";
import type { CodeGeneratorToken } from "./CodeGeneratorToken";

export interface RuntimeOptions {
	canvas: ICanvasVm
	keyboard: IKeyboard
	sound: ISound
	random: Random
	arrayBounds: boolean
	basicVersion: string
	trace: boolean
	implicitLines: boolean
	integerOverflow: boolean
	onClickKey: (key: string) => void
	encodeTokens: (input: string) => string
	outputError: (error: Error, noSelection?: boolean) => unknown
	getCodeGeneratorBasic: () => CodeGeneratorBasic
	getCodeGeneratorToken: () => CodeGeneratorToken | undefined
	logger: Pick<typeof Utils.console, "error" | "warn" | "log">
	handlers: Partial<Record<string, (paras: VmBaseParas) => void>>
	getInitialDelay: () => number
	setTimeout: (callback: () => void, delay: number) => unknown
	onExit: () => void
	onExecutionState?: (state: ExecutionState) => void
	onUnknownReason: (reason: string) => void
	onJsError?: (error: Error) => void
	onVariablesCleared?: () => void
	onTokenized?: (sourceLength: number, tokenLength: number) => void
	onMemoryError: (error: unknown) => void
	programHost: RuntimeProgramHost
}

export interface RuntimeProgramHost {
	getSource: () => string
	beforeCompileProgram?: (source: string) => void
	prepareCompileOutput: (output: IOutput) => string
	beforeProgramStart?: () => void
	afterProgramStart?: () => void
}

export interface RuntimeCompileAndStartOptions {
	clearVariables: boolean
	clearBeforeRun: boolean
}

export interface RuntimeWaitInputActions {
	onInvalid: (error: Error) => void
	onInputReturn?: (input: string) => void
	onInputSubmitted?: () => void
	startMainLoop: () => void
	continueExecution: () => void
}

export interface RuntimeDirectCommandActions {
	outputError: (error: Error) => string
	setOutputText: (text: string) => void
	onPrepareError: (error: unknown) => void
}

export interface RuntimeDirectInput {
	input: string
	stream: number
	message: string
	isProgramLine: boolean
}

export type RuntimeControlReason = "parse" | "run" | "parseRun" | "break" | "reset";

export type RuntimeWaitInputResult =
	| { status: "invalid" }
	| { status: "pending", reason: string }
	| { status: "submitted" };

export type RuntimeLoadContinuationActions = Omit<ProgramLoadContinuationActions, "vm" | "loadFileInMemory" | "setStartLine">;
export type RuntimeFileLoadActions = Omit<ProgramFileLoadActions, "vm">;

export class Runtime {
	readonly variables: Variables;
	readonly vm: CpcVm;
	readonly suspendedState: SuspendedState;
	readonly inputLine: InputLine;
	readonly soundQueue: SoundQueue;
	readonly programRunner: ProgramRunner;
	readonly programCompiler: ProgramCompiler;
	private readonly keyboard: Pick<IKeyboard, "getKeyFromBuffer">;
	private readonly runtimeSettings: RuntimeSettings;
	readonly runLoop: RunLoop;
	readonly basicParser: BasicParser;
	readonly basicLexer: BasicLexer;
	private readonly codeGeneratorJs: CodeGeneratorJs;
	private readonly onVariablesCleared?: () => void;
	private readonly executionStateReporter: ExecutionStateReporter;
	private readonly programHost: RuntimeProgramHost;

	constructor(options: RuntimeOptions) {
		this.onVariablesCleared = options.onVariablesCleared;
		this.executionStateReporter = new ExecutionStateReporter(options.onExecutionState);
		this.programHost = options.programHost;
		this.keyboard = options.keyboard;
		this.variables = new Variables({ arrayBounds: options.arrayBounds });
		this.vm = new CpcVm({
			canvas: options.canvas,
			keyboard: options.keyboard,
			random: options.random,
			sound: options.sound,
			variables: this.variables,
			onClickKey: options.onClickKey
		});
		this.vm.vmRegisterRsx(new RsxAmsdos(), true);
		this.vm.vmRegisterRsx(new RsxCpcBasic(), true);
		this.suspendedState = new SuspendedState(this.vm.vmGetStopObject());
		this.inputLine = new InputLine(options.keyboard, this.vm);
		this.soundQueue = new SoundQueue(this.vm, options.sound);

		this.programRunner = new ProgramRunner({
			composeError: this.vm.vmComposeError.bind(this.vm),
			outputError: options.outputError,
			onJsError: options.onJsError,
			logger: options.logger
		});
		this.basicParser = new BasicParser({ basicVersion: options.basicVersion });
		this.basicLexer = new BasicLexer({ keywords: this.basicParser.getKeywords() });
		this.codeGeneratorJs = new CodeGeneratorJs({
			lexer: this.basicLexer,
			parser: this.basicParser,
			trace: options.trace,
			implicitLines: options.implicitLines,
			integerOverflow: options.integerOverflow
		});
		this.programCompiler = new ProgramCompiler({
			generator: this.codeGeneratorJs,
			vm: this.vm,
			encodeTokens: options.encodeTokens,
			onTokenized: options.onTokenized,
			onMemoryError: options.onMemoryError
		});
		this.runtimeSettings = new RuntimeSettings({
			codeGeneratorJs: this.codeGeneratorJs,
			variables: this.variables,
			vm: this.vm,
			getCodeGeneratorBasic: options.getCodeGeneratorBasic,
			getCodeGeneratorToken: options.getCodeGeneratorToken,
			onVariablesCleared: options.onVariablesCleared
		});
		const handlers: Record<string, (paras: VmBaseParas) => void> = {
			timer: () => this.vm.vmStop("", 0, true),
			waitFrame: () => this.handleWaitFrame(),
			onError: () => this.vm.vmStop("", 0, true),
			error: Runtime.noop,
			stop: Runtime.noop,
			break: Runtime.noop,
			escape: Runtime.noop,
			end: Runtime.noop,
			...options.handlers
		};
		this.runLoop = new RunLoop({
			vm: this.vm,
			execute: () => this.programRunner.execute(this.vm),
			handlers,
			getInitialDelay: options.getInitialDelay,
			setTimeout: options.setTimeout,
			onExit: options.onExit,
			onStateChange: () => this.executionStateReporter.report(this.getExecutionState()),
			onUnknownReason: options.onUnknownReason
		});
	}

	getExecutionState(): ExecutionState {
		return {
			reason: this.vm.vmGetStopObject().reason,
			line: this.vm.line,
			isRunning: this.runLoop.isRunning
		};
	}

	startMainLoop(): void {
		this.runLoop.start();
	}

	setNextDelay(delay: number): void {
		this.runLoop.nextDelay = delay;
	}

	private static noop(): void {
		// No extra host action is needed for terminal VM stop reasons.
	}

	reset(): void {
		this.vm.vmReset();
	}

	continueLoad(input: string | null | undefined, file: ProgramLoadFile, actions: RuntimeLoadContinuationActions): void {
		ProgramRunner.continueLoad(input, file, {
			...actions,
			vm: this.vm,
			setStartLine: (line) => this.vm.vmSetStartLine(line),
			loadFileInMemory: (fileInput, meta) => this.vm.vmPutFileInMemory(fileInput, meta, false)
		});
	}

	dispatchFileLoad(file: ProgramFileLoad, actions: RuntimeFileLoadActions): void {
		ProgramRunner.dispatchFileLoad(file, {
			...actions,
			vm: this.vm,
			onStorageLoad: (input) => this.completeStorageLoad(input, actions.onStorageLoad)
		});
	}

	completeStorageLoad(input: string, continueLoad: (input: string) => void): void {
		this.vm.vmStop("", 0, true);
		continueLoad(input);
	}

	completeExampleLoad(
		input: string | null | undefined,
		rsx: Parameters<CpcVm["vmRegisterRsx"]>[0] | undefined,
		continueLoad: (input: string | null | undefined) => void
	): void {
		this.vm.vmStop("", 0, true);
		if (rsx) {
			this.vm.vmRegisterRsx(rsx, false);
		}
		continueLoad(input);
	}

	failExampleLoad(
		example: string,
		outputError: (error: Error, noSelection?: boolean) => unknown,
		continueLoad: (input: string | null | undefined) => void
	): void {
		this.vm.vmStop("", 0, true);
		const error = this.vm.vmComposeError(Error(), 32, example + " not found");
		if (error.hidden) {
			this.vm.vmStop("", 0, true);
		}
		outputError(error, true);
		continueLoad(null);
	}

	dispatchFileSave<T extends { open: boolean, name: string, fnFileCallback?: (data: string) => unknown }>(
		file: T,
		save: (file: T) => string,
		onSaved: (name: string) => void,
		onNotOpen: () => void,
		onWarning: (error: unknown) => void
	): void {
		ProgramRunner.dispatchFileSave(this.vm, file, save, onSaved, onNotOpen, onWarning);
	}

	finishInput(reason: string, startMainLoop: () => void, continueExecution: () => void): void {
		ProgramRunner.finishInput(this.vm, reason, startMainLoop, continueExecution);
	}

	handleWaitSound(activated = true): void {
		this.runLoop.nextDelay = this.soundQueue.poll(activated);
	}

	handleWaitFrame(): void {
		this.vm.vmStop("", 0, true);
		this.runLoop.nextDelay = this.vm.vmGetTimeUntilFrame();
	}

	handleWaitKey(isSoundActivated: () => boolean = () => true, onKey?: (key: string) => void): string {
		const key = this.keyboard.getKeyFromBuffer();
		if (key !== "") {
			onKey?.(key);
			this.vm.vmStop("", 0, true);
		} else {
			this.handleWaitSound(isSoundActivated());
		}
		return key;
	}

	handleWaitInput(actions: RuntimeWaitInputActions): RuntimeWaitInputResult {
		const stop = this.vm.vmGetStopObject(),
			inputParas = stop.paras as VmInputParas | undefined;
		if (!inputParas || inputParas.input === undefined || inputParas.stream === undefined) {
			actions.onInvalid(this.vm.vmComposeError(Error(), 32, "Programming Error: fnWaitInput"));
			return { status: "invalid" };
		}
		if (!this.inputLine.readAndSubmit(inputParas, actions.onInputReturn)) {
			return { status: "pending", reason: stop.reason };
		}
		actions.onInputSubmitted?.();
		this.finishInput(stop.reason, actions.startMainLoop, actions.continueExecution);
		return { status: "submitted" };
	}

	enterDirectMode(onInput: () => boolean): void {
		ProgramRunner.enterDirectMode(this.vm, onInput);
	}

	resetSuspendedState(): void {
		this.suspendedState.reset();
	}

	beginControl(reason: RuntimeControlReason, beforeStop?: () => void): void {
		const priority = reason === "break" ? 80 : reason === "reset" ? 99 : 95;
		if (reason === "break") {
			this.saveSuspendedState();
		} else if (reason !== "parse") {
			this.resetSuspendedState();
		}
		beforeStop?.();
		this.vm.vmStop(reason, priority);
	}

	beginRenumber(options: RenumOptions = {}): void {
		this.vm.vmStop("renumLines", 85, false, {
			command: "renum",
			stream: 0,
			newLine: options.newLine,
			oldLine: options.oldLine,
			step: options.step,
			keep: options.keep,
			line: this.vm.line
		});
	}

	deleteProgramLines(
		paras: VmLineParas,
		lines: readonly string[],
		applyDeletion: (deletion: string) => void,
		onInvalid: (error: Error) => void
	): void {
		if (lines.length) {
			const deletion = BasicFormatter.createDeleteScript(lines);
			if (deletion === undefined) {
				onInvalid(this.vm.vmComposeError(Error(), 21, paras.command));
			} else {
				applyDeletion(deletion);
			}
		}
		this.vm.vmGoto(0);
		this.vm.vmStop("end", 0, true);
	}

	eraseFiles(
		fileHandler: Pick<FileHandler, "eraseFiles">,
		paras: VmFileParas,
		onRemoved: (name: string) => void,
		onMissing: (name: string) => void
	): EraseFilesResult {
		const result = fileHandler.eraseFiles(paras.fileMask || "");
		if (!result.matched) {
			this.vm.print(paras.stream, result.name + " not found\r\n");
		}
		for (const name of result.removed) {
			onRemoved(name);
		}
		for (const name of result.missing) {
			this.vm.print(paras.stream, name + " not found\r\n");
			onMissing(name);
		}
		this.vm.vmStop("", 0, true);
		return result;
	}

	renameFile(fileHandler: Pick<FileHandler, "renameFile">, paras: VmFileParas): RenameFileResult {
		const result = fileHandler.renameFile(paras.oldName as string, paras.newName as string);
		if (result.status === "newExists") {
			this.vm.print(paras.stream, result.oldName + " already exists\r\n");
		} else if (result.status === "oldNotFound") {
			this.vm.print(paras.stream, result.oldName + " not found\r\n");
		}
		this.vm.vmStop("", 0, true);
		return result;
	}

	saveSuspendedState(): void {
		this.suspendedState.save(this.vm.vmGetStopObject());
	}

	handleEscape(keyboard: IKeyboard): ReturnType<SuspendedState["escape"]> {
		return this.suspendedState.escape(this.vm, keyboard);
	}

	restoreForContinue(beforeRestore?: () => void): boolean {
		return this.suspendedState.restoreForContinue(this.vm, this.vm.vmGetStopObject(), beforeRestore);
	}

	continueProgram(startMainLoop: () => void, beforeRestore?: () => void, onContinueState?: (restored: boolean) => void): void {
		const restored = this.restoreForContinue(beforeRestore);
		onContinueState?.(restored);
		startMainLoop();
	}

	compileProgram(source: string): IOutput {
		return this.programCompiler.compile(source, this.variables);
	}

	parseProgram(): IOutput {
		return this.compileHostProgram(false).output;
	}

	setArrayBounds(value: boolean): void {
		this.runtimeSettings.setArrayBounds(value);
	}

	setImplicitLines(value: boolean): void {
		this.runtimeSettings.setImplicitLines(value);
	}

	setPrettyLowercaseVars(value: boolean): void {
		this.runtimeSettings.setPrettyLowercaseVars(value);
	}

	setIntegerOverflow(value: boolean): void {
		this.runtimeSettings.setIntegerOverflow(value);
	}

	setTrace(value: boolean): void {
		this.runtimeSettings.setTrace(value);
	}

	setBasicVersion(value: string): void {
		this.codeGeneratorJs.setBasicVersion(value);
	}

	static getLoopDelay(speed: number): number {
		return RuntimeSettings.getLoopDelay(speed);
	}

	listProgram(lines: readonly string[], stream: number): void {
		ProgramRunner.listProgram(this.vm, lines, stream);
	}

	printDirectoryEntries(entries: readonly string[], stream: number, sort: boolean): void {
		for (const text of FileHandler.formatDirectoryEntries(entries, sort)) {
			this.vm.print(stream, text);
		}
		this.vm.vmStop("", 0, true);
	}

	editLine(paras: VmLineParas, line: string | undefined, onInput: () => boolean, onMissing: (error: Error) => void): boolean {
		if (line === undefined) {
			onMissing(this.vm.vmComposeError(Error(), 8, String(paras.first || 0)));
			this.vm.vmStop("stop", 60, true);
			return false;
		}
		ProgramRunner.editLine(this.vm, paras, line, onInput);
		return true;
	}

	renumProgram(
		source: string,
		paras: VmLineRenumParas,
		renumber: (source: string, newLine: number, oldLine: number, step: number, keep: number) => IOutput,
		setSource: (source: string) => void,
		onError: (error: Error) => void
	): IOutput {
		return ProgramRunner.renumberProgram(this.vm, source, paras, renumber, setSource, onError);
	}

	commitEditedLine(
		paras: VmInputParas,
		source: string,
		merge: (source: string, edited: string) => string,
		setSource: (source: string) => void,
		onProgramEdited?: () => void
	): boolean {
		return ProgramRunner.commitEditedLine(this.vm, paras, source, merge, setSource, onProgramEdited);
	}

	compileDirectProgram(input: string, source: string): IOutput {
		return this.codeGeneratorJs.generateDirect(input, source, this.variables);
	}

	readDirectInput(): RuntimeDirectInput {
		const inputParas = this.vm.vmGetStopObject().paras as VmInputParas,
			input = inputParas.input.trim();
		inputParas.input = "";
		if (input !== "") {
			this.vm.cursor(inputParas.stream, 0);
		}
		return {
			input,
			stream: inputParas.stream,
			message: inputParas.message,
			isProgramLine: input !== "" && !Number.isNaN(BasicFormatter.parseLineNumber(input))
		};
	}

	executeDirectCommand(
		input: string,
		source: string,
		line: number,
		stream: number,
		inputMessage: string,
		actions: RuntimeDirectCommandActions
	): IOutput {
		const output = this.compileDirectProgram(input, source);
		let outputText = output.error ? actions.outputError(output.error) : output.text;
		if (outputText && outputText.length > 0) {
			outputText += "\n";
		}
		actions.setOutputText(outputText);
		if (!output.error) {
			try {
				this.prepareDirectProgram(outputText, line);
			} catch (error) {
				actions.onPrepareError(error);
			}
		} else {
			this.vm.print(stream, inputMessage);
			this.vm.cursor(stream, 1);
		}
		return output;
	}

	insertDirectProgramLine(
		source: string,
		input: string,
		stream: number,
		merge: (source: string, input: string) => string,
		setSource: (source: string) => void,
		onProgramEdited?: () => void
	): void {
		setSource(merge(source, input));
		this.vm.vmSetStartLine(0);
		this.vm.vmGoto(0);
		onProgramEdited?.();
		this.vm.cursor(stream, 1);
	}

	prepareDirectProgram(source: string, line: number): void {
		this.vm.vmSetStartLine(line);
		this.vm.vmGoto("direct");
		this.programRunner.setScript(ProgramRunner.compile(source));
		this.vm.vmSetSourceMap(this.codeGeneratorJs.getSourceMap());
	}

	compileAndStartProgram(options: RuntimeCompileAndStartOptions): IOutput {
		const result = this.compileHostProgram(options.clearVariables);
		if (!result.output.error) {
			this.startProgram(result.source, 0, options.clearBeforeRun);
		}
		return result.output;
	}

	resetProgram(resetDevices: () => void, clearOutput: () => void, invalidate: () => void): void {
		ProgramRunner.resetProgram(this.vm, () => this.removeAllVariables(), resetDevices, clearOutput, invalidate);
	}

	newProgram(clearSource: () => void, invalidate: () => void): void {
		ProgramRunner.newProgram(this.vm, clearSource, () => this.removeAllVariables(), invalidate);
	}

	private removeAllVariables(): void {
		if (Object.keys(this.variables.getAllVariables()).length) {
			this.variables.removeAllVariables();
			this.onVariablesCleared?.();
		}
	}

	startProgram(source: string, line: number, clearBeforeRun: boolean): boolean {
		if (clearBeforeRun) {
			this.vm.clear();
		}
		const started = this.programRunner.start(source, this.vm, line, this.programHost.beforeProgramStart);
		this.programHost.afterProgramStart?.();
		return started;
	}

	private compileHostProgram(clearVariables: boolean): { output: IOutput, source: string } {
		if (clearVariables) {
			this.removeAllVariables();
		}
		const source = this.programHost.getSource();
		this.programHost.beforeCompileProgram?.(source);
		const output = this.compileProgram(source),
			compiledSource = this.programHost.prepareCompileOutput(output);
		return { output, source: compiledSource };
	}

	invalidateProgram(): void {
		this.programRunner.invalidate();
	}

	setProgramScript(script: CompiledScript): void {
		this.programRunner.setScript(script);
	}
}