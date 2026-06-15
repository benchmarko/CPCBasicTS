export interface CustomError extends Error {
    value: string;
    pos: number;
    len?: number;
    line?: number | string;
    hidden?: boolean;
    shortMessage?: string;
    errCode?: number;
}
export type LoadScriptFn = (url: string, fnSuccess: (url2: string, key: string) => void, fnError: (url2: string, key: string) => void, key: string) => void;
export interface IOutput {
    text: string;
    error?: CustomError;
}
export type ConfigEntryType = string | number | boolean;
export type ConfigType = Record<string, ConfigEntryType>;
export interface DatabaseEntry {
    text: string;
    title: string;
    src: string;
    script?: string;
    loaded?: boolean;
}
export type DatabasesType = Record<string, DatabaseEntry>;
export interface VmBaseParas {
    command: string;
    stream: number;
    line: string | number;
}
export interface VmLineParas extends VmBaseParas {
    first?: number;
    last?: number;
}
export interface VmLineRenumParas extends VmBaseParas {
    newLine?: number;
    oldLine?: number;
    step?: number;
    keep?: number;
}
export interface VmFileParas extends VmBaseParas {
    fileMask?: string;
    newName?: string;
    oldName?: string;
}
export interface VmInputParas extends VmBaseParas {
    input: string;
    message: string;
    noCRLF?: string;
    types?: string[];
    fnInputCallback: () => boolean;
}
export type VmStopParas = VmFileParas | VmInputParas | VmLineParas | VmLineRenumParas;
export type VariableValue = string | number | Function | [] | VariableValue[];
export interface ICpcVm {
    line: string | number;
    vmComposeError(error: Error, err: number, errInfo: string): CustomError;
    vmStop(reason: string, priority: number, force?: boolean, paras?: VmStopParas): void;
    vmInRangeRound(n: number | undefined, min: number, max: number, err: string): number;
    vmAdaptFilename(name: string, err: string): string;
    vmGetVariableByIndex(index: number): VariableValue;
    vmChangeMode(mode: number): void;
    renum(newLine: number, oldLine: number, step: number, keep: number): void;
    vmNotImplemented(name: string): void;
}
export type RsxCommandType = (this: ICpcVm, ...args: (string | number)[]) => void;
export interface ICpcVmRsx {
    getRsxCommands: () => Record<string, RsxCommandType>;
}
export interface ExampleEntry {
    key: string;
    title: string;
    meta: string;
    script?: string;
    rsx?: ICpcVmRsx;
    loaded?: boolean;
}
export type ExamplesType = Record<string, Record<string, ExampleEntry>>;
export interface IModel {
    getProperty<T extends ConfigEntryType>(property: string): T;
    setProperty<T extends ConfigEntryType>(property: string, value: T): void;
    getAllProperties(): ConfigType;
    getAllInitialProperties(): ConfigType;
    getChangedProperties(): ConfigType;
    addDatabases(db: DatabasesType): void;
    getAllDatabases(): DatabasesType;
    getDatabase(): DatabaseEntry;
    getAllExamples(): {
        [x: string]: ExampleEntry;
    };
    getExample(key: string): ExampleEntry;
    setExample(example: ExampleEntry): void;
    removeExample(key: string): void;
}
export interface ICore {
    setDebug(debug: number): void;
    getModel(): IModel;
    init(): void;
    addIndex(_dir: string, input: Record<string, unknown> | (() => void)): void;
    addItem(key: string, input: string | (() => void)): void;
    addRsx(key: string, RsxConstructor: new () => ICpcVmRsx): string;
    parseArgs(args: string[], config: Record<string, ConfigEntryType>): void;
}
export interface INodeUtils {
    nodeMain(core: ICore): void;
}
export interface IUI {
    getCurrentDataKey(): string;
    onWindowLoadContinue(core: ICore): void;
}
//# sourceMappingURL=Interfaces.d.ts.map