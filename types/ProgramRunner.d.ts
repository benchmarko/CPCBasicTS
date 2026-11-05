import type { CpcVm, FileMeta } from "./CpcVm";
import type { CustomError, IOutput, VmInputParas, VmLineParas, VmLineRenumParas } from "./Interfaces";
import type { FileMetaAndData } from "./FileHandler";
import { Utils } from "./Utils";
export type CompiledScript = (vm: CpcVm) => void;
interface ProgramRunnerOptions {
    composeError: (error: Error, code: number, value: string) => CustomError;
    outputError: (error: Error, noSelection?: boolean) => unknown;
    onJsError?: (error: Error) => void;
    logger?: Pick<typeof Utils.console, "error" | "warn" | "log">;
}
interface ProgramLoadRequest {
    command: string;
    input: string;
    line: number;
    inMemory: boolean;
    isSnapshot: boolean;
}
export interface ProgramLoadActions {
    vm: Pick<CpcVm, "vmStop" | "clear">;
    getSource: () => string;
    setSource: (source: string) => void;
    clearResult: () => void;
    merge: (source: string, input: string) => string;
    invalidate: () => void;
    removeVariables: () => void;
    reset: () => void;
    loadFileInMemory: () => void;
    parseRun: () => void;
    parseChain: () => void;
    onUnknownCommand: (command: string) => void;
}
export interface ProgramLoadFile {
    name: string;
    command: string;
    line: number;
    fnFileCallback?: (input: string | null | undefined, meta?: FileMeta) => boolean | void;
}
export interface ProgramFileLoad {
    open: boolean;
    name: string;
    command: string;
    first: number;
    last: number;
}
export interface ProgramFileLoadActions {
    vm: Pick<CpcVm, "line" | "vmStop" | "vmGetTimeUntilFrame">;
    deleteLines: (paras: VmLineParas) => void;
    logFile: (file: ProgramFileLoad) => void;
    loadFromStorage: (name: string) => string | null;
    onStorageLoad: (input: string) => void;
    loadExample: () => void;
    onNotOpen: (name: string) => void;
    setNextDelay: (delay: number) => void;
}
export type ProgramLoadContinuationActions = Omit<ProgramLoadActions, "loadFileInMemory"> & {
    decode: (input: string) => FileMetaAndData;
    decodeTokenizedBasic: (input: string) => string;
    loadFileInMemory: (input: string, meta?: FileMeta) => void;
    setStartLine: (line: number) => void;
    startMainLoop: () => void;
    onWarning: (error: unknown) => void;
    onError: (message: string) => void;
};
export declare class ProgramRunner {
    private readonly options;
    private script?;
    constructor(options: ProgramRunnerOptions);
    static compile(script: string): CompiledScript;
    static listProgram(vm: Pick<CpcVm, "print" | "vmGoto" | "vmStop">, lines: readonly string[], stream: number): void;
    static editLine(vm: Pick<CpcVm, "print" | "cursor" | "vmStop">, paras: VmLineParas, line: string, onInput: () => boolean): void;
    static renumberProgram(vm: Pick<CpcVm, "vmGoto" | "vmStop">, source: string, paras: VmLineRenumParas, renumber: (source: string, newLine: number, oldLine: number, step: number, keep: number) => IOutput, setSource: (source: string) => void, onError: (error: Error) => void): IOutput;
    static commitEditedLine(vm: Pick<CpcVm, "vmSetStartLine" | "vmGoto" | "cursor" | "vmStop">, paras: VmInputParas, source: string, merge: (source: string, edited: string) => string, setSource: (source: string) => void, onProgramEdited?: () => void): boolean;
    static newProgram(vm: Pick<CpcVm, "vmGoto" | "vmStop">, clearSource: () => void, clearVariables: () => void, invalidate: () => void): void;
    static resetProgram(vm: Pick<CpcVm, "vmReset" | "vmStop">, clearVariables: () => void, resetDevices: () => void, clearOutput: () => void, invalidate: () => void): void;
    static prepareChainMergeLoad(vm: Pick<CpcVm, "line" | "vmStop">, file: {
        command: string;
        first: number;
        last: number;
    }, deleteLines: (paras: VmLineParas) => void): void;
    static closeSavedFile(vm: Pick<CpcVm, "vmResetOutFileHandling">, file: {
        fnFileCallback?: (data: string) => unknown;
    }, data: string, onWarning: (error: unknown) => void): void;
    static dispatchFileSave<T extends {
        open: boolean;
        name: string;
        fnFileCallback?: (data: string) => unknown;
    }>(vm: Pick<CpcVm, "vmResetOutFileHandling" | "vmStop">, file: T, save: (file: T) => string, onSaved: (name: string) => void, onNotOpen: () => void, onWarning: (error: unknown) => void): void;
    static dispatchFileLoad(file: ProgramFileLoad, actions: ProgramFileLoadActions): void;
    static applyLoad(request: ProgramLoadRequest, actions: ProgramLoadActions): number;
    static continueLoad(input: string | null | undefined, file: ProgramLoadFile, actions: ProgramLoadContinuationActions): void;
    static enterDirectMode(vm: Pick<CpcVm, "line" | "tagoff" | "vmResetControlBuffer" | "pos" | "print" | "cursor" | "vmStop">, onInput: () => boolean): void;
    static finishInput(vm: Pick<CpcVm, "vmStop">, reason: string, startMainLoop: () => void, continueExecution: () => void): void;
    invalidate(): void;
    setScript(script: CompiledScript): void;
    start(source: string, vm: Pick<CpcVm, "vmResetData" | "vmReset4Run" | "vmStop" | "vmGoto" | "vmSetStartLine">, line?: number, beforeCompile?: () => void): boolean;
    execute(vm: CpcVm): void;
    run(execute: () => void): void;
}
export {};
//# sourceMappingURL=ProgramRunner.d.ts.map