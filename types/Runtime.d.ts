import { BasicLexer } from "./BasicLexer";
import { BasicParser } from "./BasicParser";
import { CpcVm } from "./CpcVm";
import { InputLine } from "./InputLine";
import type { ExecutionState } from "./ExecutionState";
import type { ICanvasVm, IKeyboard, IOutput, ISound, RenumOptions, VmBaseParas, VmFileParas, VmInputParas, VmLineParas, VmLineRenumParas } from "./Interfaces";
import { ProgramCompiler } from "./ProgramCompiler";
import { ProgramRunner, type CompiledScript, type ProgramFileLoad, type ProgramFileLoadActions, type ProgramLoadContinuationActions, type ProgramLoadFile } from "./ProgramRunner";
import { Random } from "./Random";
import { RunLoop } from "./RunLoop";
import { SoundQueue } from "./SoundQueue";
import { SuspendedState } from "./SuspendedState";
import { Utils } from "./Utils";
import { Variables } from "./Variables";
import { FileHandler, type EraseFilesResult, type RenameFileResult } from "./FileHandler";
import type { CodeGeneratorBasic } from "./CodeGeneratorBasic";
import type { CodeGeneratorToken } from "./CodeGeneratorToken";
export interface RuntimeOptions {
    canvas: ICanvasVm;
    keyboard: IKeyboard;
    sound: ISound;
    random: Random;
    arrayBounds: boolean;
    basicVersion: string;
    trace: boolean;
    implicitLines: boolean;
    integerOverflow: boolean;
    onClickKey: (key: string) => void;
    encodeTokens: (input: string) => string;
    outputError: (error: Error, noSelection?: boolean) => unknown;
    getCodeGeneratorBasic: () => CodeGeneratorBasic;
    getCodeGeneratorToken: () => CodeGeneratorToken | undefined;
    logger: Pick<typeof Utils.console, "error" | "warn" | "log">;
    handlers: Partial<Record<string, (paras: VmBaseParas) => void>>;
    getInitialDelay: () => number;
    setTimeout: (callback: () => void, delay: number) => unknown;
    onExit: () => void;
    onExecutionState?: (state: ExecutionState) => void;
    onUnknownReason: (reason: string) => void;
    onJsError?: (error: Error) => void;
    onVariablesCleared?: () => void;
    onTokenized?: (sourceLength: number, tokenLength: number) => void;
    onMemoryError: (error: unknown) => void;
    programHost: RuntimeProgramHost;
}
export interface RuntimeProgramHost {
    getSource: () => string;
    beforeCompileProgram?: (source: string) => void;
    prepareCompileOutput: (output: IOutput) => string;
    beforeProgramStart?: () => void;
    afterProgramStart?: () => void;
}
export interface RuntimeCompileAndStartOptions {
    clearVariables: boolean;
    clearBeforeRun: boolean;
}
export interface RuntimeWaitInputActions {
    onInvalid: (error: Error) => void;
    onInputReturn?: (input: string) => void;
    onInputSubmitted?: () => void;
    startMainLoop: () => void;
    continueExecution: () => void;
}
export interface RuntimeDirectCommandActions {
    outputError: (error: Error) => string;
    setOutputText: (text: string) => void;
    onPrepareError: (error: unknown) => void;
}
export interface RuntimeDirectInput {
    input: string;
    stream: number;
    message: string;
    isProgramLine: boolean;
}
export type RuntimeControlReason = "parse" | "run" | "parseRun" | "break" | "reset";
export type RuntimeWaitInputResult = {
    status: "invalid";
} | {
    status: "pending";
    reason: string;
} | {
    status: "submitted";
};
export type RuntimeLoadContinuationActions = Omit<ProgramLoadContinuationActions, "vm" | "loadFileInMemory" | "setStartLine">;
export type RuntimeFileLoadActions = Omit<ProgramFileLoadActions, "vm">;
export declare class Runtime {
    readonly variables: Variables;
    readonly vm: CpcVm;
    readonly suspendedState: SuspendedState;
    readonly inputLine: InputLine;
    readonly soundQueue: SoundQueue;
    readonly programRunner: ProgramRunner;
    readonly programCompiler: ProgramCompiler;
    private readonly keyboard;
    private readonly runtimeSettings;
    readonly runLoop: RunLoop;
    readonly basicParser: BasicParser;
    readonly basicLexer: BasicLexer;
    private readonly codeGeneratorJs;
    private readonly onVariablesCleared?;
    private readonly executionStateReporter;
    private readonly programHost;
    constructor(options: RuntimeOptions);
    getExecutionState(): ExecutionState;
    startMainLoop(): void;
    setNextDelay(delay: number): void;
    private static noop;
    reset(): void;
    continueLoad(input: string | null | undefined, file: ProgramLoadFile, actions: RuntimeLoadContinuationActions): void;
    dispatchFileLoad(file: ProgramFileLoad, actions: RuntimeFileLoadActions): void;
    completeStorageLoad(input: string, continueLoad: (input: string) => void): void;
    completeExampleLoad(input: string | null | undefined, rsx: Parameters<CpcVm["vmRegisterRsx"]>[0] | undefined, continueLoad: (input: string | null | undefined) => void): void;
    failExampleLoad(example: string, outputError: (error: Error, noSelection?: boolean) => unknown, continueLoad: (input: string | null | undefined) => void): void;
    dispatchFileSave<T extends {
        open: boolean;
        name: string;
        fnFileCallback?: (data: string) => unknown;
    }>(file: T, save: (file: T) => string, onSaved: (name: string) => void, onNotOpen: () => void, onWarning: (error: unknown) => void): void;
    finishInput(reason: string, startMainLoop: () => void, continueExecution: () => void): void;
    handleWaitSound(activated?: boolean): void;
    handleWaitFrame(): void;
    handleWaitKey(isSoundActivated?: () => boolean, onKey?: (key: string) => void): string;
    handleWaitInput(actions: RuntimeWaitInputActions): RuntimeWaitInputResult;
    enterDirectMode(onInput: () => boolean): void;
    resetSuspendedState(): void;
    beginControl(reason: RuntimeControlReason, beforeStop?: () => void): void;
    beginRenumber(options?: RenumOptions): void;
    deleteProgramLines(paras: VmLineParas, lines: readonly string[], applyDeletion: (deletion: string) => void, onInvalid: (error: Error) => void): void;
    eraseFiles(fileHandler: Pick<FileHandler, "eraseFiles">, paras: VmFileParas, onRemoved: (name: string) => void, onMissing: (name: string) => void): EraseFilesResult;
    renameFile(fileHandler: Pick<FileHandler, "renameFile">, paras: VmFileParas): RenameFileResult;
    saveSuspendedState(): void;
    handleEscape(keyboard: IKeyboard): ReturnType<SuspendedState["escape"]>;
    restoreForContinue(beforeRestore?: () => void): boolean;
    continueProgram(startMainLoop: () => void, beforeRestore?: () => void, onContinueState?: (restored: boolean) => void): void;
    compileProgram(source: string): IOutput;
    parseProgram(): IOutput;
    setArrayBounds(value: boolean): void;
    setImplicitLines(value: boolean): void;
    setPrettyLowercaseVars(value: boolean): void;
    setIntegerOverflow(value: boolean): void;
    setTrace(value: boolean): void;
    setBasicVersion(value: string): void;
    static getLoopDelay(speed: number): number;
    listProgram(lines: readonly string[], stream: number): void;
    printDirectoryEntries(entries: readonly string[], stream: number, sort: boolean): void;
    editLine(paras: VmLineParas, line: string | undefined, onInput: () => boolean, onMissing: (error: Error) => void): boolean;
    renumProgram(source: string, paras: VmLineRenumParas, renumber: (source: string, newLine: number, oldLine: number, step: number, keep: number) => IOutput, setSource: (source: string) => void, onError: (error: Error) => void): IOutput;
    commitEditedLine(paras: VmInputParas, source: string, merge: (source: string, edited: string) => string, setSource: (source: string) => void, onProgramEdited?: () => void): boolean;
    compileDirectProgram(input: string, source: string): IOutput;
    readDirectInput(): RuntimeDirectInput;
    executeDirectCommand(input: string, source: string, line: number, stream: number, inputMessage: string, actions: RuntimeDirectCommandActions): IOutput;
    insertDirectProgramLine(source: string, input: string, stream: number, merge: (source: string, input: string) => string, setSource: (source: string) => void, onProgramEdited?: () => void): void;
    prepareDirectProgram(source: string, line: number): void;
    compileAndStartProgram(options: RuntimeCompileAndStartOptions): IOutput;
    resetProgram(resetDevices: () => void, clearOutput: () => void, invalidate: () => void): void;
    newProgram(clearSource: () => void, invalidate: () => void): void;
    private removeAllVariables;
    startProgram(source: string, line: number, clearBeforeRun: boolean): boolean;
    private compileHostProgram;
    invalidateProgram(): void;
    setProgramScript(script: CompiledScript): void;
}
//# sourceMappingURL=Runtime.d.ts.map