import type { CpcVm, FileMeta } from "./CpcVm";
import type { CustomError, IOutput, VmInputParas, VmLineParas, VmLineRenumParas } from "./Interfaces";
import type { FileMetaAndData } from "./FileHandler";
import { BasicFormatter } from "./BasicFormatter";
import { Utils } from "./Utils";

export type CompiledScript = (vm: CpcVm) => void;

interface ProgramRunnerOptions {
	composeError: (error: Error, code: number, value: string) => CustomError
	outputError: (error: Error, noSelection?: boolean) => unknown
	onJsError?: (error: Error) => void
	logger?: Pick<typeof Utils.console, "error" | "warn" | "log">
}

interface ProgramLoadRequest {
	command: string
	input: string
	line: number
	inMemory: boolean
	isSnapshot: boolean
}

export interface ProgramLoadActions {
	vm: Pick<CpcVm, "vmStop" | "clear">
	getSource: () => string
	setSource: (source: string) => void
	clearResult: () => void
	merge: (source: string, input: string) => string
	invalidate: () => void
	removeVariables: () => void
	reset: () => void
	loadFileInMemory: () => void
	parseRun: () => void
	parseChain: () => void
	onUnknownCommand: (command: string) => void
}

export interface ProgramLoadFile {
	name: string
	command: string
	line: number
	fnFileCallback?: (input: string | null | undefined, meta?: FileMeta) => boolean | void
}

export interface ProgramFileLoad {
	open: boolean
	name: string
	command: string
	first: number
	last: number
}

export interface ProgramFileLoadActions {
	vm: Pick<CpcVm, "line" | "vmStop" | "vmGetTimeUntilFrame">
	deleteLines: (paras: VmLineParas) => void
	logFile: (file: ProgramFileLoad) => void
	loadFromStorage: (name: string) => string | null
	onStorageLoad: (input: string) => void
	loadExample: () => void
	onNotOpen: (name: string) => void
	setNextDelay: (delay: number) => void
}

export type ProgramLoadContinuationActions = Omit<ProgramLoadActions, "loadFileInMemory"> & {
	decode: (input: string) => FileMetaAndData
	decodeTokenizedBasic: (input: string) => string
	loadFileInMemory: (input: string, meta?: FileMeta) => void
	setStartLine: (line: number) => void
	startMainLoop: () => void
	onWarning: (error: unknown) => void
	onError: (message: string) => void
}

export class ProgramRunner {
	private script?: CompiledScript;

	constructor(private readonly options: ProgramRunnerOptions) {}

	static compile(script: string): CompiledScript {
		// eslint-disable-next-line @typescript-eslint/no-implied-eval
		return new Function("o", script) as CompiledScript; // eslint-disable-line no-new-func
	}

	static listProgram(vm: Pick<CpcVm, "print" | "vmGoto" | "vmStop">, lines: readonly string[], stream: number): void {
		for (const line of BasicFormatter.formatListing(lines, stream)) {
			vm.print(stream, line, "\r\n");
		}
		vm.vmGoto(0);
		vm.vmStop("end", 0, true);
	}

	static editLine(
		vm: Pick<CpcVm, "print" | "cursor" | "vmStop">,
		paras: VmLineParas,
		line: string,
		onInput: () => boolean
	): void {
		vm.print(paras.stream, line);
		vm.cursor(paras.stream, 1);
		const input: VmInputParas = {
			command: paras.command,
			line: paras.line,
			stream: paras.stream,
			message: "",
			fnInputCallback: onInput,
			input: line
		};
		vm.vmStop("waitInput", 45, true, input);
	}

	static renumberProgram(
		vm: Pick<CpcVm, "vmGoto" | "vmStop">,
		source: string,
		paras: VmLineRenumParas,
		renumber: (source: string, newLine: number, oldLine: number, step: number, keep: number) => IOutput,
		setSource: (source: string) => void,
		onError: (error: Error) => void
	): IOutput {
		const output = renumber(source, paras.newLine || 10, paras.oldLine || 1, paras.step || 10, paras.keep || 65535);
		if (output.error) {
			onError(output.error);
		} else {
			setSource(output.text);
		}
		vm.vmGoto(0);
		vm.vmStop("end", 0, true);
		return output;
	}

	static commitEditedLine(
		vm: Pick<CpcVm, "vmSetStartLine" | "vmGoto" | "cursor" | "vmStop">,
		paras: VmInputParas,
		source: string,
		merge: (source: string, edited: string) => string,
		setSource: (source: string) => void,
		onProgramEdited?: () => void
	): boolean {
		setSource(merge(source, paras.input));
		vm.vmSetStartLine(0);
		vm.vmGoto(0);
		onProgramEdited?.();
		vm.cursor(paras.stream, 0);
		vm.vmStop("end", 90);
		return true;
	}

	static newProgram(
		vm: Pick<CpcVm, "vmGoto" | "vmStop">,
		clearSource: () => void,
		clearVariables: () => void,
		invalidate: () => void
	): void {
		clearSource();
		clearVariables();
		vm.vmGoto(0);
		vm.vmStop("end", 0, true);
		invalidate();
	}

	static resetProgram(
		vm: Pick<CpcVm, "vmReset" | "vmStop">,
		clearVariables: () => void,
		resetDevices: () => void,
		clearOutput: () => void,
		invalidate: () => void
	): void {
		clearVariables();
		vm.vmReset();
		resetDevices();
		vm.vmStop("end", 0, true);
		clearOutput();
		invalidate();
	}

	static prepareChainMergeLoad(
		vm: Pick<CpcVm, "line" | "vmStop">,
		file: { command: string, first: number, last: number },
		deleteLines: (paras: VmLineParas) => void
	): void {
		if (file.command === "chainMerge" && file.first && file.last) {
			deleteLines({
				first: file.first,
				last: file.last,
				command: "CHAIN MERGE",
				stream: 0,
				line: vm.line
			});
			vm.vmStop("fileLoad", 90);
		}
	}

	static closeSavedFile(
		vm: Pick<CpcVm, "vmResetOutFileHandling">,
		file: { fnFileCallback?: (data: string) => unknown },
		data: string,
		onWarning: (error: unknown) => void
	): void {
		if (file.fnFileCallback) {
			try {
				file.fnFileCallback(data);
			} catch (error) {
				onWarning(error);
			}
		}
		vm.vmResetOutFileHandling();
	}

	static dispatchFileSave<T extends { open: boolean, name: string, fnFileCallback?: (data: string) => unknown }>(
		vm: Pick<CpcVm, "vmResetOutFileHandling" | "vmStop">,
		file: T,
		save: (file: T) => string,
		onSaved: (name: string) => void,
		onNotOpen: () => void,
		onWarning: (error: unknown) => void
	): void {
		if (file.open) {
			const data = save(file);
			onSaved(file.name);
			ProgramRunner.closeSavedFile(vm, file, data, onWarning);
		} else {
			onNotOpen();
		}
		vm.vmStop("", 0, true);
	}

	static dispatchFileLoad(file: ProgramFileLoad, actions: ProgramFileLoadActions): void {
		if (file.open) {
			ProgramRunner.prepareChainMergeLoad(actions.vm, file, actions.deleteLines);
			actions.logFile(file);
			const input = actions.loadFromStorage(file.name);
			if (input !== null) {
				actions.onStorageLoad(input);
			} else {
				actions.loadExample();
			}
		} else {
			actions.onNotOpen(file.name);
		}
		actions.setNextDelay(actions.vm.vmGetTimeUntilFrame());
	}

	static applyLoad(request: ProgramLoadRequest, actions: ProgramLoadActions): number {
		let startLine = 0;
		switch (request.command) {
		case "openin":
			break;
		case "chainMerge":
			actions.setSource(actions.merge(actions.getSource(), request.input));
			actions.clearResult();
			startLine = request.line;
			actions.invalidate();
			actions.parseChain();
			break;
		case "load":
			if (!request.inMemory) {
				actions.setSource(request.input);
				actions.clearResult();
				actions.invalidate();
				actions.vm.vmStop("end", 90);
			}
			break;
		case "merge":
			actions.setSource(actions.merge(actions.getSource(), request.input));
			actions.clearResult();
			actions.invalidate();
			actions.removeVariables();
			actions.vm.vmStop("end", 90);
			break;
		case "chain":
			actions.setSource(request.input);
			actions.clearResult();
			startLine = request.line;
			actions.invalidate();
			actions.parseChain();
			break;
		case "run":
			if (!request.inMemory) {
				actions.setSource(request.input);
				actions.clearResult();
				startLine = request.line;
				if (!request.isSnapshot) {
					actions.reset();
				}
				actions.parseRun();
			} else {
				actions.reset();
				actions.vm.clear();
				actions.loadFileInMemory();
			}
			break;
		default:
			actions.onUnknownCommand(request.command);
			break;
		}
		return startLine;
	}

	static continueLoad(input: string | null | undefined, file: ProgramLoadFile, actions: ProgramLoadContinuationActions): void {
		const { decode, decodeTokenizedBasic, loadFileInMemory, setStartLine, startMainLoop, onWarning, onError, ...loadActions } = actions;
		let data: FileMetaAndData | undefined,
			putInMemory = false;

		if (input !== null && input !== undefined) {
			data = decode(input);
			input = data.data;
		}
		const command = file.command,
			line = file.line || 0,
			name = file.name;
		if (file.fnFileCallback) {
			try {
				putInMemory = Boolean(file.fnFileCallback(input, data?.meta));
			} catch (error) {
				onWarning(error);
			}
		}

		if (input === undefined) {
			onError("loadFileContinue: File " + name + ": input undefined!");
			actions.vm.vmStop("stop", 60, true);
			startMainLoop();
			return;
		}
		if (input === null) {
			startMainLoop();
			return;
		}

		if (data?.meta.typeString === "S" && putInMemory) {
			input = decodeTokenizedBasic(input.substring(0x170));
			putInMemory = false;
		}

		const startLine = ProgramRunner.applyLoad({ command, input, line, inMemory: putInMemory, isSnapshot: data?.meta.typeString === "S" }, {
			...loadActions,
			loadFileInMemory: () => {
				loadFileInMemory(input, data?.meta);
			}
		});
		setStartLine(startLine);
		startMainLoop();
	}

	static enterDirectMode(vm: Pick<CpcVm, "line" | "tagoff" | "vmResetControlBuffer" | "pos" | "print" | "cursor" | "vmStop">, onInput: () => boolean): void {
		const stream = 0,
			message = "Ready\r\n";
		vm.tagoff(stream);
		vm.vmResetControlBuffer();
		if (vm.pos(stream) > 1) {
			vm.print(stream, "\r\n");
		}
		vm.print(stream, message);
		vm.cursor(stream, 1, 1);
		vm.vmStop("direct", 0, true, {
			command: "direct",
			stream,
			message,
			fnInputCallback: onInput,
			input: "",
			line: vm.line
		});
	}

	static finishInput(vm: Pick<CpcVm, "vmStop">, reason: string, startMainLoop: () => void, continueExecution: () => void): void {
		if (reason === "waitInput") {
			vm.vmStop("", 0, true);
		} else if (reason === "direct") {
			vm.vmStop("", 0, true);
			startMainLoop();
		} else {
			continueExecution();
		}
	}

	invalidate(): void {
		this.script = undefined;
	}

	setScript(script: CompiledScript): void {
		this.script = script;
	}

	start(source: string, vm: Pick<CpcVm, "vmResetData" | "vmReset4Run" | "vmStop" | "vmGoto" | "vmSetStartLine">, line = 0, beforeCompile?: () => void): boolean {
		if (line === 0) {
			vm.vmResetData();
		}
		beforeCompile?.();
		if (!this.script) {
			try {
				this.script = ProgramRunner.compile(source);
			} catch (error) {
				(this.options.logger || Utils.console).error(error);
				if (error instanceof Error) {
					this.options.onJsError?.(error);
					(error as CustomError).shortMessage = "JS " + String(error);
					this.options.outputError(error, true);
				}
				this.script = undefined;
			}
		}
		vm.vmReset4Run();
		if (!this.script) {
			return false;
		}
		vm.vmStop("", 0, true);
		vm.vmGoto(0);
		vm.vmSetStartLine(line);
		return true;
	}

	execute(vm: CpcVm): void {
		const script = this.script;
		if (script) {
			this.run(() => {
				script(vm);
			});
		}
	}

	run(execute: () => void): void {
		const options = this.options,
			logger = options.logger || Utils.console;
		try {
			execute();
		} catch (error) {
			if (!(error instanceof Error)) {
				logger.error(error);
				return;
			}
			if (error.name === "CpcVm" || error.name === "Variables") {
				let customError = error as CustomError;
				if (customError.errCode !== undefined) {
					customError = options.composeError(customError, customError.errCode, customError.value);
				}
				if (!customError.hidden) {
					logger.warn(customError);
					options.outputError(customError, !customError.pos);
				} else {
					logger.log(customError.message);
				}
			} else {
				logger.error(error);
				options.onJsError?.(error);
				options.composeError(error, 2, "JS " + String(error));
				options.outputError(error, true);
			}
		}
	}
}