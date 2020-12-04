import { Random } from "./Random";
import { Canvas } from "./Canvas";
import { Keyboard } from "./Keyboard";
import { Sound } from "./Sound";
import { Variables } from "./Variables";
interface CpcVmOptions {
    canvas: Canvas;
    keyboard: Keyboard;
    sound: Sound;
    variables: Variables;
    tron: boolean;
}
interface FileBase {
    bOpen: boolean;
    sCommand: string;
    sName: string;
    iLine: number;
    iStart: number;
    aFileData: string[];
    fnFileCallback: () => void;
}
interface InFile extends FileBase {
    iFirst: number;
    iLast: number;
    sMemorizedExample: string;
}
interface OutFile extends FileBase {
    iStream: number;
    sType: string;
    iLength: number;
    iEntry: number;
}
export declare class CpcVm {
    fnOpeninHandler: any;
    fnCloseinHandler: any;
    fnCloseoutHandler: any;
    fnLoadHandler: any;
    fnRunHandler: any;
    options: CpcVmOptions;
    oCanvas: Canvas;
    oKeyboard: Keyboard;
    oSound: Sound;
    oVariables: Variables;
    tronFlag: boolean;
    oRandom: Random;
    oStop: {
        sReason: string;
        iPriority: number;
        oParas: any;
    };
    aInputValues: any[];
    oInFile: InFile;
    oOutFile: OutFile;
    iInkeyTime: number;
    aGosubStack: any[];
    aMem: any[];
    aData: any[];
    iData: number;
    oDataLineIndex: {
        0: number;
    };
    aWindow: any[];
    aTimer: any[];
    aSoundData: any[];
    aSqTimer: any[];
    aCrtcData: any[];
    sPrintControlBuf: string;
    iStartTime: number;
    lastRnd: number;
    iNextFrameTime: number;
    iTimeUntilFrame: number;
    iStopCount: number;
    iLine: string | number;
    iStartLine: number;
    iErrorGotoLine: number;
    iErrorResumeLine: number;
    iBreakGosubLine: number;
    iBreakResumeLine: number;
    sOut: string;
    iErr: number;
    iErl: string | number;
    bDeg: boolean;
    bTron: boolean;
    iTronLine: number;
    iRamSelect: number;
    iScreenPage: number;
    iCrtcReg: number;
    iMinCharHimem: number;
    iMaxCharHimem: number;
    iHimem: number;
    iMinCustomChar: number;
    iTimerPriority: number;
    iZone: number;
    iMode: number;
    iInkeyTimeMs: number;
    rsx: object;
    constructor(options: CpcVmOptions);
    static iFrameTimeMs: number;
    static iTimerCount: number;
    static iSqTimerCount: number;
    static iStreamCount: number;
    static iMinHimem: number;
    static iMaxHimem: number;
    static mWinData: {
        iLeft: number;
        iRight: number;
        iTop: number;
        iBottom: number;
    }[];
    static mUtf8ToCpc: {
        8364: number;
        8218: number;
        402: number;
        8222: number;
        8230: number;
        8224: number;
        8225: number;
        710: number;
        8240: number;
        352: number;
        8249: number;
        338: number;
        381: number;
        8216: number;
        8217: number;
        8220: number;
        8221: number;
        8226: number;
        8211: number;
        8212: number;
        732: number;
        8482: number;
        353: number;
        8250: number;
        339: number;
        382: number;
        376: number;
    };
    static mControlCodeParameterCount: number[];
    vmInit(options: CpcVmOptions): void;
    vmSetRsxClass(oRsx: object): void;
    vmReset(): void;
    vmResetTimers(): void;
    vmResetWindowData(bResetPenPaper: boolean): void;
    vmResetControlBuffer(): void;
    vmResetFileHandling(oFile: FileBase): void;
    vmResetData(): void;
    vmResetInks(): void;
    vmReset4Run(): void;
    vmGetAllVariables(): {
        [x: string]: string | number | object;
    };
    vmSetStartLine(iLine: any): void;
    vmOnBreakContSet(): boolean;
    vmOnBreakHandlerActive(): number;
    vmEscape(): boolean;
    vmAssertNumber(n: number, sErr: string): void;
    vmAssertString(s: string, sErr: string): void;
    vmRound(n: number, sErr?: string): number;
    vmInRangeRound(n: number, iMin: number, iMax: number, sErr?: string): number;
    vmDetermineVarType(sVarType: any): any;
    vmAssertNumberType(sVarType: any): void;
    vmAssign(sVarType: any, value: any): any;
    vmGetError(iErr: any): string;
    vmGotoLine(line: any, sMsg: any): void;
    fnCheckSqTimer(): boolean;
    vmCheckTimer(iTime: any): boolean;
    vmCheckTimerHandlers(): void;
    vmCheckSqTimerHandlers(): boolean;
    vmCheckNextFrame(iTime: any): void;
    vmGetTimeUntilFrame(iTime: any): any;
    vmLoopCondition(): boolean;
    vmInitUntypedVariables(sVarChar: any): void;
    vmDefineVarTypes(sType: any, sNameOrRange: any, sErr: any): void;
    vmStop(sReason: string, iPriority: number, bForce?: boolean, oParas?: any): void;
    vmNotImplemented(sName: string): void;
    vmUsingFormat1(sFormat: string, arg: any): any;
    vmGetStopObject(): {
        sReason: string;
        iPriority: number;
        oParas: any;
    };
    vmGetInFileObject(): InFile;
    vmGetOutFileObject(): OutFile;
    vmAdaptFilename(sName: any, sErr: any): any;
    vmGetSoundData(): any[];
    vmTrace(iLine: any): void;
    vmDrawMovePlot(sType: any, x: any, y: any, iGPen: any, iGColMode: any): void;
    vmAfterEveryGosub(sType: any, iInterval: any, iTimer: any, iLine: any): void;
    vmCopyFromScreen(iSource: any, iDest: any): void;
    vmCopyToScreen(iSource: any, iDest: any): void;
    vmSetScreenBase(iByte: any): void;
    vmSetScreenOffset(iOffset: any): void;
    vmSetTransparentMode(iStream: any, iTransparent: any): void;
    abs(n: any): number;
    addressOf(sVar: any): any;
    afterGosub(iInterval: any, iTimer: any, iLine: any): void;
    vmGetCpcCharCode(iCode: any): any;
    asc(s: any): any;
    atn(n: any): number;
    auto(): void;
    bin$(n: any, iPad: any): any;
    border(iInk1: any, iInk2: any): void;
    vmMcSetMode(iMode: any): void;
    vmTxtInverse(iStream: any): void;
    vmPutKeyInBuffer(sKey: any): void;
    call(iAddr: any): void;
    cat(): void;
    chain(sName: string, iLine: any): void;
    chainMerge(sName: string, iLine: any, iFirst: number, iLast: number): void;
    chr$(n: number): string;
    cint(n: number): number;
    clear(): void;
    clearInput(): void;
    clg(iGPaper?: number): void;
    vmCloseinCallback(): void;
    closein(): void;
    vmCloseoutCallback(): void;
    closeout(): void;
    cls(iStream: any): void;
    commaTab(iStream: any): string;
    cont(): void;
    copychr$(iStream: any): any;
    cos(n: any): number;
    creal(n: any): any;
    vmPlaceRemoveCursor(iStream: any): void;
    vmDrawUndrawCursor(iStream: any): void;
    cursor(iStream: number, iCursorOn: number, iCursorEnabled?: number): void;
    data(): void;
    dec$(n: any, sFrmt: any): any;
    defint(sNameOrRange: any): void;
    defreal(sNameOrRange: any): void;
    defstr(sNameOrRange: any): void;
    deg(): void;
    "delete"(iFirst: any, iLast: any): void;
    derr(): number;
    di(): void;
    dim(sVarName: any): void;
    draw(x: any, y: any, iGPen: any, iGColMode: any): void;
    drawr(x: any, y: any, iGPen: any, iGColMode: any): void;
    edit(iLine: any): void;
    ei(): void;
    end(sLabel: any): void;
    ent(iToneEnv: number): void;
    env(iVolEnv: number): void;
    eof(): number;
    vmFindArrayVariable(sName: any): any;
    erase(): void;
    erl(): number;
    err(): number;
    vmComposeError(oError: any, iErr: any, sErrInfo: any): any;
    error(iErr: any, sErrInfo: any): void;
    everyGosub(iInterval: any, iTimer: any, iLine: any): void;
    exp(n: any): number;
    fill(iGPen: any): void;
    fix(n: any): number;
    frame(): void;
    fre(): number;
    gosub(retLabel: any, n: any): void;
    "goto"(n: any): void;
    graphicsPaper(iGPaper: any): void;
    graphicsPen(iGPen: number | null, iTransparentMode?: number): void;
    hex$(n: any, iPad: any): any;
    himem(): number;
    ink(iPen: any, iInk1: any, iInk2: any): void;
    inkey(iKey: any): number;
    inkey$(): string;
    inp(iPort: any): number;
    vmSetInputValues(aInputValues: any): void;
    vmGetNextInput(): any;
    vmInputCallback(): boolean;
    vmInputNextFileItem(sType: string): any;
    vmInputFromFile(aTypes: any): void;
    input(iStream: number, sNoCRLF: string, sMsg: string): void;
    instr(p1: string | number, p2: string, p3?: string): number;
    "int"(n: number): number;
    joy(iJoy: number): number;
    key(iToken: number, s: string): void;
    keyDef(iCpcKey: number, iRepeat: number, iNormal?: number, iShift?: number, iCtrl?: number): void;
    left$(s: string, iLen: number): string;
    len(s: string): number;
    vmLineInputCallback(): boolean;
    lineInput(iStream: any, sNoCRLF: any, sMsg: any, sVarType: any): void;
    list(iStream: any, iFirst: any, iLast: any): void;
    vmLoadCallback(sInput: any, oMeta: any): boolean;
    load(sName: any, iStart: any): void;
    vmLocate(iStream: any, iPos: any, iVpos: any): void;
    locate(iStream: any, iPos: any, iVpos: any): void;
    log(n: any): number;
    log10(n: any): number;
    lower$(s: any): any;
    mask(iMask: any, iFirst: any): void;
    max(): any;
    memory(n: any): void;
    merge(sName: any): void;
    mid$(s: any, iStart: any, iLen: any): any;
    mid$Assign(s: any, iStart: any, iLen: any, sNew: any): any;
    min(): any;
    mode(iMode: any): void;
    move(x: any, y: any, iGPen: any, iGColMode: any): void;
    mover(x: any, y: any, iGPen: any, iGColMode: any): void;
    "new"(): void;
    onBreakCont(): void;
    onBreakGosub(iLine: any): void;
    onBreakStop(): void;
    onErrorGoto(iLine: any): void;
    onGosub(retLabel: any, n: any): void;
    onGoto(retLabel: any, n: any): void;
    fnChannel2ChannelIndex(iChannel: any): any;
    onSqGosub(iChannel: any, iLine: any): void;
    vmOpeninCallback(sInput: any): void;
    openin(sName: any): void;
    openout(sName: any): void;
    origin(xOff: any, yOff: any, xLeft: any, xRight: any, yTop: any, yBottom: any): void;
    vmSetRamSelect(iBank: any): void;
    vmSetCrtcData(iByte: any): void;
    out(iPort: any, iByte: any): void;
    paper(iStream: any, iPaper: any): void;
    vmGetCharDataByte(iAddr: any): any;
    vmSetCharDataByte(iAddr: any, iByte: any): void;
    peek(iAddr: any): any;
    pen(iStream: number, iPen: number | null, iTransparent?: number): void;
    pi(): number;
    plot(x: any, y: any, iGPen: any, iGColMode: any): void;
    plotr(x: any, y: any, iGPen: any, iGColMode: any): void;
    poke(iAddr: any, iByte: any): void;
    pos(iStream: any): any;
    vmGetAllowedPosOrVpos(iStream: any, bVpos: any): any;
    vmMoveCursor2AllowedPos(iStream: any): void;
    vmPrintChars(iStream: any, sStr: any): void;
    vmControlSymbol(sPara: any): void;
    vmControlWindow(sPara: any, iStream: any): void;
    vmHandleControlCode(iCode: any, sPara: any, iStream: any): string;
    vmPrintCharsOrControls(iStream: number, sStr: string, sBuf?: string): string;
    vmPrintGraphChars(sStr: string): void;
    print(iStream: any, ...aArgs: any[]): void;
    rad(): void;
    vmHashCode(s: any): number;
    vmRandomizeCallback(): boolean;
    randomize(n: any): void;
    read(sVarType: any): string | number;
    release(iChannelMask: any): void;
    remain(iTimer: any): number;
    renum(iNew: any, iOld: any, iStep: any, iKeep: any): void;
    restore(iLine?: number): void;
    resume(iLine: any): void;
    resumeNext(): void;
    "return"(): void;
    right$(s: string, iLen: number): string;
    rnd(n: number): any;
    round(n: any, iDecimals: any): number;
    vmRunCallback(sInput: any, oMeta: any): any;
    run(numOrString: any): void;
    save(sName: any, sType: any, iStart: any, iLength: any, iEntry: any): void;
    sgn(n: any): number;
    sin(n: any): number;
    sound(iState: any, iPeriod: any, iDuration: any, iVolume: any, iVolEnv: any, iToneEnv: any, iNoise: any): void;
    space$(n: any): string;
    spc(iStream: any, n: any): string;
    speedInk(iTime1: any, iTime2: any): void;
    speedKey(iDelay: any, iRepeat: any): void;
    speedWrite(n: any): void;
    sq(iChannel: any): any;
    sqr(n: any): number;
    stop(sLabel: any): void;
    str$(n: any): any;
    string$(iLen: any, chr: any): any;
    symbol(iChar: any): void;
    symbolAfter(iChar: any): void;
    tab(iStream: any, n: any): string;
    tag(iStream: any): void;
    tagoff(iStream: any): void;
    tan(n: any): number;
    test(x: any, y: any): any;
    testr(x: any, y: any): any;
    time(): number;
    troff(): void;
    tron(): void;
    unt(n: any): any;
    upper$(s: any): any;
    using(sFormat: any): string;
    vmVal(s: any): number;
    val(s: any): any;
    vpos(iStream: any): any;
    wait(iPort: any, iMask: any, iInv: any): void;
    width(iWidth: any): void;
    window(iStream: any, iLeft: any, iRight: any, iTop: any, iBottom: any): void;
    windowSwap(iStream1: any, iStream2: any): void;
    write(iStream: any): void;
    xpos(): number;
    ypos(): number;
    zone(n: any): void;
}
export {};
