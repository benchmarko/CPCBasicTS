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
export type CanvasCharType = number[];
export interface ICanvasVm {
    reset(): void;
    resetCustomChars(): void;
    setScreenOffset(offset: number): void;
    updateColorsAndCanvasImmediately(inkList: number[]): void;
    updateSpeedInk(): void;
    setCustomChar(char: number, charData: CanvasCharType): void;
    getCharData(char: number): CanvasCharType;
    setDefaultInks(): void;
    getXpos(): number;
    getYpos(): number;
    fillTextBox(left: number, top: number, width: number, height: number, paper: number): void;
    getByte(addr: number): number | null;
    setByte(addr: number, byte: number): void;
    draw(x: number, y: number): void;
    move(x: number, y: number): void;
    plot(x: number, y: number): void;
    test(x: number, y: number): number;
    setInk(pen: number, ink1: number, ink2: number): boolean;
    setBorder(ink1: number, ink2: number): void;
    setGPen(gPen: number): void;
    setGPaper(gPaper: number): void;
    setGTransparentMode(transparent: boolean): void;
    printGChar(char: number): void;
    printChar(char: number, x: number, y: number, pen: number, paper: number, transparent: boolean): void;
    drawCursor(x: number, y: number, pen: number, paper: number): void;
    readChar(x: number, y: number, pen: number, paper: number): number;
    fill(fillPen: number): void;
    setOrigin(xOrig: number, yOrig: number): void;
    getXOrigin(): number;
    getYOrigin(): number;
    setGWindow(xLeft: number, xRight: number, yTop: number, yBottom: number): void;
    setGColMode(gColMode: number): void;
    clearTextWindow(left: number, right: number, top: number, bottom: number, paper: number): void;
    clearGraphicsWindow(): void;
    clearFullWindow(): void;
    windowScrollUp(left: number, right: number, top: number, bottom: number, paper: number): void;
    windowScrollDown(left: number, right: number, top: number, bottom: number, paper: number): void;
    setSpeedInk(time1: number, time2: number): void;
    setMask(mask: number): void;
    setMaskFirst(maskFirst: number): void;
    getMode(): number;
    changeMode(mode: number): void;
    setMode(mode: number): void;
}
export interface CpcKeyExpansionsOptions {
    cpcKey: number;
    repeat: number;
    normal?: number;
    shift?: number;
    ctrl?: number;
}
export interface IKeyboard {
    reset(): void;
    resetExpansionTokens(): void;
    resetCpcKeysExpansions(): void;
    clearInput(): void;
    getKeyFromBuffer(): string;
    putKeyInBuffer(key: string, triggerOnKeyDown?: boolean): void;
    getKeyState(cpcKeyCode: number): number;
    getJoyState(joy: number): number;
    setExpansionToken(token: number, string: string): void;
    setCpcKeyExpansion(options: CpcKeyExpansionsOptions): void;
}
export interface SoundData {
    state: number;
    period: number;
    duration: number;
    volume: number;
    volEnv: number;
    toneEnv: number;
    noise: number;
}
export interface ToneEnvData1 {
    steps: number;
    diff: number;
    time: number;
    repeat: boolean;
}
export interface ToneEnvData2 {
    period: number;
    time: number;
}
export type ToneEnvData = ToneEnvData1 | ToneEnvData2;
export interface VolEnvData1 {
    steps: number;
    diff: number;
    time: number;
}
export interface VolEnvData2 {
    register: number;
    period: number;
}
export type VolEnvData = VolEnvData1 | VolEnvData2;
export interface ISound {
    reset(): void;
    resetQueue(): void;
    testCanQueue(state: number): boolean;
    sound(soundData: SoundData): void;
    setVolEnv(volEnv: number, volEnvData: VolEnvData[]): void;
    setToneEnv(toneEnv: number, toneEnvData: ToneEnvData[]): void;
    scheduler(): void;
    release(releaseMask: number): void;
    sq(n: number): number;
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