import { IController } from "./Interfaces";
import { BasicFormatter } from "./BasicFormatter";
import { BasicTokenizer } from "./BasicTokenizer";
import { Canvas } from "./Canvas";
import { CodeGeneratorJs } from "./CodeGeneratorJs";
import { CommonEventHandler } from "./CommonEventHandler";
import { CpcVm, VmStopEntry } from "./CpcVm";
import { CpcVmRsx } from "./CpcVmRsx";
import { InputStack } from "./InputStack";
import { Keyboard } from "./Keyboard";
import { Model } from "./Model";
import { Sound } from "./Sound";
import { Variables, VariableValue } from "./Variables";
import { View } from "./View";
export declare class Controller implements IController {
    fnRunLoopHandler: () => void;
    fnWaitKeyHandler: () => void;
    fnWaitInputHandler: () => void;
    fnOnEscapeHandler: () => void;
    fnDirectInputHandler: () => void;
    fnPutKeyInBufferHandler: (sKey: string) => void;
    static sMetaIdent: string;
    fnScript?: Function;
    bTimeoutHandlerActive: boolean;
    iNextLoopTimeOut: number;
    bInputSet: boolean;
    oVariables: Variables;
    oBasicFormatter?: BasicFormatter;
    oBasicTokenizer: BasicTokenizer;
    model: Model;
    view: View;
    commonEventHandler: CommonEventHandler;
    oCodeGeneratorJs: CodeGeneratorJs;
    oCanvas: Canvas;
    inputStack: InputStack;
    oKeyboard: Keyboard;
    oSound: Sound;
    oVm: CpcVm;
    oRsx: CpcVmRsx;
    oNoStop: VmStopEntry;
    oSavedStop: VmStopEntry;
    constructor(oModel: Model, oView: View);
    private initDatabases;
    private onUserAction;
    addIndex(sDir: string, sInput: string): void;
    addItem(sKey: string, sInput: string): string;
    private setDatabaseSelectOptions;
    setExampleSelectOptions(): void;
    private setVarSelectOptions;
    private updateStorageDatabase;
    setInputText(sInput: string, bKeepStack?: boolean): void;
    invalidateScript(): void;
    private fnWaitForContinue;
    private fnOnEscape;
    private fnWaitSound;
    private fnWaitKey;
    private fnWaitInput;
    private static mergeScripts;
    private static fnGetLinesInRange;
    private static fnPrepareMaskRegExp;
    private fnGetExampleDirectoryEntries;
    private static fnGetDirectoryEntries;
    private fnPrintDirectoryEntries;
    private fnFileCat;
    private fnFileDir;
    private fnFileEra;
    private fnFileRen;
    private static asmGena3Convert;
    private loadFileContinue;
    private loadExample;
    private static fnLocalStorageName;
    private static tryLoadingFromLocalStorage;
    private fnFileLoad;
    private static joinMeta;
    private static splitMeta;
    private fnFileSave;
    private fnDeleteLines;
    private fnNew;
    private fnList;
    private fnReset;
    private outputError;
    private fnRenumLines;
    private fnEditLineCallback;
    private fnEditLine;
    private fnParseBench;
    private fnParse;
    fnPretty(): void;
    private selectJsError;
    private fnRun;
    private fnParseRun;
    private fnRunPart1;
    private fnDirectInput;
    private startWithDirectInput;
    private updateResultText;
    private exitLoop;
    private fnWaitFrame;
    private fnOnError;
    private static fnDummy;
    private fnTimer;
    private fnRunLoop;
    startMainLoop(): void;
    private setStopObject;
    private getStopObject;
    startParse(): void;
    startRenum(): void;
    startRun(): void;
    startParseRun(): void;
    startBreak(): void;
    startContinue(): void;
    startReset(): void;
    startScreenshot(): string;
    private fnPutKeyInBuffer;
    startEnter(): void;
    private static generateFunction;
    changeVariable(): void;
    setSoundActive(): void;
    private static createMinimalAmsdosHeader;
    private fnHandleFileSelect;
    private static fnHandleDragOver;
    private initDropZone;
    private fnUpdateUndoRedoButtons;
    private fnInitUndoRedoButtons;
    private fnPutChangedInputOnStack;
    startUpdateCanvas(): void;
    stopUpdateCanvas(): void;
    virtualKeyboardCreate(): void;
    getVariable(sPar: string): VariableValue;
    undoStackElement(): string;
    redoStackElement(): string;
    onDatabaseSelectChange(): void;
    onExampleSelectChange(): void;
    static exportAsBase64(sStorageName: string): string;
    onCpcCanvasClick(event: Event): void;
    onWindowClick(event: Event): void;
    private mHandlers;
}
