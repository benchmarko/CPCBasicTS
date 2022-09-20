import { CustomError } from "./Utils";
import { Keyboard } from "./Keyboard";
import { Sound, SoundData } from "./Sound";
import { Canvas } from "./Canvas";
import { TextCanvas } from "./TextCanvas";
import { Variables, VariableMap, VariableTypeMap } from "./Variables";
import { ICpcVmRsx } from "./Interfaces";
export interface CpcVmOptions {
    canvas: Canvas;
    textCanvas: TextCanvas;
    keyboard: Keyboard;
    sound: Sound;
    variables: Variables;
    quiet?: boolean;
}
export interface FileMeta {
    typeString: string;
    start?: number;
    length?: number;
    entry?: number;
    encoding?: string;
}
interface FileBase {
    open: boolean;
    command: string;
    name: string;
    line: number;
    start: (number | undefined);
    fileData: string[];
    fnFileCallback: ((...args: any[]) => void | boolean) | undefined;
}
interface InFile extends FileBase {
    first: number;
    last: number;
    memorizedExample: string;
}
interface OutFile extends FileBase {
    stream: number;
    typeString: string;
    length: number;
    entry: number;
}
interface WindowDimensions {
    left: number;
    right: number;
    top: number;
    bottom: number;
}
interface WindowData extends WindowDimensions {
    pos: number;
    vpos: number;
    textEnabled: boolean;
    tag: boolean;
    transparent: boolean;
    cursorOn: boolean;
    cursorEnabled: boolean;
    pen: number;
    paper: number;
}
interface TimerEntry {
    active: boolean;
    line: number;
    repeat: boolean;
    intervalMs: number;
    nextTimeMs: number;
    handlerRunning: boolean;
    stackIndexReturn: number;
    savedPriority: number;
}
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
export declare type VmStopParas = VmFileParas | VmInputParas | VmLineParas | VmLineRenumParas;
export interface VmStopEntry {
    reason: string;
    priority: number;
    paras: VmStopParas;
}
declare type PrintObjectType = {
    type: string;
    args: (string | number)[];
};
declare type DataEntryType = (string | undefined);
export declare class CpcVm {
    private quiet;
    private readonly fnOpeninHandler;
    private readonly fnCloseinHandler;
    private readonly fnCloseoutHandler;
    fnLoadHandler: (input: string, meta: FileMeta) => boolean;
    private readonly fnRunHandler;
    private readonly canvas;
    private readonly textCanvas;
    private readonly keyboard;
    private readonly soundClass;
    readonly variables: Variables;
    private readonly random;
    private readonly stopEntry;
    private inputValues;
    private readonly inFile;
    private readonly outFile;
    private inkeyTimeMs;
    private readonly gosubStack;
    private readonly maxGosubStackLength;
    private readonly mem;
    private readonly dataList;
    private dataIndex;
    private dataLineIndex;
    private readonly labelList;
    private sourceMap;
    private readonly windowDataList;
    private readonly timerList;
    private readonly sqTimer;
    private readonly soundData;
    private readonly crtcData;
    private crtcReg;
    private printControlBuf;
    private startTime;
    private lastRnd;
    private nextFrameTime;
    private stopCount;
    line: string | number;
    private startLine;
    private errorGotoLine;
    private errorResumeLine;
    private breakGosubLine;
    private breakResumeLine;
    outBuffer: string;
    private errorCode;
    private errorLine;
    private degFlag;
    private tronFlag1;
    private traceLabel;
    private ramSelect;
    private screenPage;
    private minCharHimem;
    private maxCharHimem;
    private himemValue;
    private minCustomChar;
    private timerPriority;
    private zoneValue;
    private modeValue;
    rsx?: ICpcVmRsx;
    private static readonly frameTimeMs;
    private static readonly timerCount;
    private static readonly sqTimerCount;
    private static readonly streamCount;
    private static readonly minHimem;
    private static readonly maxHimem;
    private static readonly emptyParas;
    private static readonly winData;
    private static readonly utf8ToCpc;
    private static readonly controlCodeParameterCount;
    private static readonly errors;
    private static readonly stopPriority;
    constructor(options: CpcVmOptions);
    vmSetRsxClass(rsx: ICpcVmRsx): void;
    vmReset(): void;
    vmResetTimers(): void;
    vmResetWindowData(resetPenPaper: boolean): void;
    vmResetControlBuffer(): void;
    static vmResetFileHandling(file: FileBase): void;
    vmResetData(): void;
    private vmResetInks;
    vmReset4Run(): void;
    vmGetAllVariables(): VariableMap;
    vmGetAllVarTypes(): VariableTypeMap;
    vmSetStartLine(line: number): void;
    vmSetLabels(labels: string[]): void;
    vmOnBreakContSet(): boolean;
    vmOnBreakHandlerActive(): boolean;
    vmEscape(): boolean;
    private vmAssertNumber;
    private vmAssertString;
    private vmAssertInRange;
    vmRound(n: number | undefined, err?: string): number;
    vmInRangeRound(n: number | undefined, min: number, max: number, err: string): number;
    private vmLineInRange;
    private vmRound2Complement;
    private vmGetLetterCode;
    vmDetermineVarType(varType: string): string;
    vmAssertNumberType(varType: string): void;
    vmAssign(varType: string, value: string | number): (string | number);
    vmGotoLine(line: string | number, msg?: string): void;
    private fnCheckSqTimer;
    private vmCheckTimer;
    private vmCheckTimerHandlers;
    private vmCheckSqTimerHandlers;
    private vmCheckNextFrame;
    vmGetTimeUntilFrame(time?: number): number;
    vmLoopCondition(): boolean;
    private vmDefineVarTypes;
    vmStop(reason: string, priority: number, force?: boolean, paras?: VmStopParas): void;
    vmNotImplemented(name: string): void;
    private vmUsingStringFormat;
    private vmUsingNumberFormat;
    private vmUsingFormat;
    vmGetStopObject(): VmStopEntry;
    vmGetInFileObject(): InFile;
    vmGetOutFileObject(): OutFile;
    vmAdaptFilename(name: string, err: string): string;
    vmGetSoundData(): SoundData[];
    vmSetSourceMap(sourceMap: Record<string, number[]>): void;
    vmTrace(line: number | string): void;
    private vmDrawMovePlot;
    private vmAfterEveryGosub;
    private vmCopyFromScreen;
    private vmCopyToScreen;
    private vmSetScreenBase;
    private vmSetScreenOffset;
    private vmSetTransparentMode;
    abs(n: number): number;
    addressOf(variable: string): number;
    afterGosub(interval: number, timer: number, line: number): void;
    private static vmGetCpcCharCode;
    asc(s: string): number;
    atn(n: number): number;
    auto(line?: number, increment?: number): void;
    bin$(n: number, pad?: number): string;
    border(ink1: number, ink2?: number): void;
    private vmMcSetMode;
    private vmTxtInverse;
    private vmPutKeyInBuffer;
    call(addr: number, ...args: (string | number)[]): void;
    cat(): void;
    chain(name: string, line?: number, first?: number, last?: number): void;
    chainMerge(name: string, line?: number, first?: number, last?: number): void;
    chr$(n: number): string;
    cint(n: number): number;
    clear(): void;
    clearInput(): void;
    clg(gPaper?: number): void;
    private vmCloseinCallback;
    closein(): void;
    private vmCloseoutCallback;
    closeout(): void;
    cls(stream: number): void;
    private commaTab;
    cont(): void;
    copychr$(stream: number): string;
    cos(n: number): number;
    creal(n: number): number;
    vmPlaceRemoveCursor(stream: number): void;
    vmDrawUndrawCursor(stream: number): void;
    cursor(stream: number, cursorOn?: number, cursorEnabled?: number): void;
    data(line: number, ...args: DataEntryType[]): void;
    dec$(n: number, frmt: string): string;
    defint(first: string, last?: string): void;
    defreal(first: string, last?: string): void;
    defstr(first: string, last?: string): void;
    deg(): void;
    "delete"(first?: number, last?: number): void;
    derr(): number;
    di(): void;
    dim(varName: string, ...args: number[]): void;
    draw(x: number, y: number, gPen?: number, gColMode?: number): void;
    drawr(x: number, y: number, gPen?: number, gColMode?: number): void;
    edit(line: number): void;
    ei(): void;
    end(label: string): void;
    ent(toneEnv: number, ...args: number[]): void;
    env(volEnv: number, ...args: number[]): void;
    eof(): number;
    private vmFindArrayVariable;
    erase(...args: string[]): void;
    erl(): number;
    err(): number;
    vmComposeError(error: Error, err: number, errInfo: string): CustomError;
    error(err: number, errInfo: string): void;
    everyGosub(interval: number, timer: number, line: number): void;
    exp(n: number): number;
    fill(gPen: number): void;
    fix(n: number): number;
    frame(): void;
    fre(arg: number | string): number;
    private vmGosub;
    gosub(retLabel: string | number, n: number): void;
    "goto"(n: string): void;
    graphicsPaper(gPaper: number): void;
    graphicsPen(gPen?: number, transparentMode?: number): void;
    hex$(n: number, pad?: number): string;
    himem(): number;
    ink(pen: number, ink1: number, ink2?: number): void;
    inkey(key: number): number;
    inkey$(): string;
    inp(port: number): number;
    private vmSetInputValues;
    vmGetNextInput(): string | number | undefined;
    vmInputCallback(): boolean;
    private fnFileInputGetString;
    private fnFileInputGetNumber;
    private vmInputNextFileItem;
    vmInputFromFile(types: string[]): void;
    input(stream: number, noCRLF: string, msg: string, ...args: string[]): void;
    instr(p1: string | number, p2: string, p3?: string): number;
    "int"(n: number): number;
    joy(joy: number): number;
    key(token: number, s: string): void;
    keyDef(cpcKey: number, repeat: number, normal?: number | undefined, shift?: number | undefined, ctrl?: number): void;
    left$(s: string, len: number): string;
    len(s: string): number;
    vmLineInputCallback(): boolean;
    lineInput(stream: number, noCRLF: string, msg: string, varType: string): void;
    list(stream: number, first?: number, last?: number): void;
    private vmLoadCallback;
    load(name: string, start?: number): void;
    private vmLocate;
    locate(stream: number, pos: number, vpos: number): void;
    log(n: number): number;
    log10(n: number): number;
    private static fnLowerCase;
    lower$(s: string): string;
    mask(mask: number | undefined, first?: number): void;
    max(...args: number[]): number | string;
    memory(n: number): void;
    merge(name: string): void;
    mid$(s: string, start: number, len?: number): string;
    mid$Assign(s: string, start: number, len: number | undefined, newString: string): string;
    min(...args: number[]): number | string;
    vmChangeMode(mode: number): void;
    mode(mode: number): void;
    move(x: number, y: number, gPen?: number, gColMode?: number): void;
    mover(x: number, y: number, gPen?: number, gColMode?: number): void;
    "new"(): void;
    onBreakCont(): void;
    onBreakGosub(line: number): void;
    onBreakStop(): void;
    onErrorGoto(line: number): void;
    onGosub(retLabel: string, n: number, ...args: number[]): void;
    onGoto(retLabel: string, n: number, ...args: number[]): void;
    private static fnChannel2ChannelIndex;
    onSqGosub(channel: number, line: number): void;
    private vmOpeninCallback;
    openin(name: string): void;
    openout(name: string): void;
    origin(xOff: number, yOff: number, xLeft?: number, xRight?: number, yTop?: number, yBottom?: number): void;
    vmSetRamSelect(bank: number): void;
    vmSetCrtcData(byte: number): void;
    out(port: number, byte: number): void;
    paper(stream: number, paper: number): void;
    vmGetCharDataByte(addr: number): number;
    vmSetCharDataByte(addr: number, byte: number): void;
    peek(addr: number): number;
    pen(stream: number, pen: number | undefined, transparent?: number): void;
    pi(): number;
    plot(x: number, y: number, gPen?: number, gColMode?: number): void;
    plotr(x: number, y: number, gPen?: number, gColMode?: number): void;
    poke(addr: number, byte: number): void;
    pos(stream: number): number;
    private vmGetAllowedPosOrVpos;
    private vmMoveCursor2AllowedPos;
    private vmPrintChars;
    private vmControlSymbol;
    private vmControlWindow;
    private vmHandleControlCode;
    private vmPrintCharsOrControls;
    private vmPrintGraphChars;
    print(stream: number, ...args: (string | number | PrintObjectType)[]): void;
    rad(): void;
    private static vmHashCode;
    private vmRandomizeCallback;
    randomize(n?: number): void;
    read(varType: string): string | number;
    release(channelMask: number): void;
    remain(timerNumber: number): number;
    renum(newLine?: number, oldLine?: number, step?: number, keep?: number): void;
    restore(line?: number): void;
    resume(line?: number): void;
    resumeNext(): void;
    "return"(): void;
    right$(s: string, len: number): string;
    rnd(n?: number): number;
    round(n: number, decimals?: number): number;
    private vmRunCallback;
    run(numOrString?: number | string): void;
    save(name: string, type?: string, start?: number, length?: number, entry?: number): void;
    sgn(n: number): number;
    sin(n: number): number;
    sound(state: number, period: number, duration?: number, volume?: number, volEnv?: number, toneEnv?: number, noise?: number): void;
    space$(n: number): string;
    private spc;
    speedInk(time1: number, time2: number): void;
    speedKey(delay: number, repeat: number): void;
    speedWrite(n: number): void;
    sq(channel: number): number;
    sqr(n: number): number;
    stop(label: string): void;
    str$(n: number): string;
    string$(len: number, chr: number | string): string;
    symbol(char: number, ...args: number[]): void;
    symbolAfter(char: number): void;
    private tab;
    tag(stream: number): void;
    tagoff(stream: number): void;
    tan(n: number): number;
    test(x: number, y: number): number;
    testr(x: number, y: number): number;
    time(): number;
    troff(): void;
    tron(): void;
    unt(n: number): number;
    private static fnUpperCase;
    upper$(s: string): string;
    using(format: string, ...args: (string | number)[]): string;
    private static vmVal;
    val(s: string): number;
    vpos(stream: number): number;
    wait(port: number, mask: number, inv?: number): void;
    width(width: number): void;
    window(stream: number, left: number, right: number, top: number, bottom: number): void;
    windowSwap(stream1: number, stream2?: number): void;
    write(stream: number, ...args: (string | number)[]): void;
    xpos(): number;
    ypos(): number;
    zone(n: number): void;
    private vmTestGetTimerList;
    private vmTestGetWindowDataList;
    readonly vmInternal: {
        getTimerList: () => TimerEntry[];
        getWindowDataList: () => WindowData[];
        commaTab: (stream: number) => string;
        spc: (stream: number, n: number) => string;
        tab: (stream: number, n: number) => string;
    };
}
export {};
//# sourceMappingURL=CpcVm.d.ts.map