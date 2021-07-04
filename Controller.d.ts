import { IController } from "./Interfaces";
import { Model } from "./Model";
import { VariableValue } from "./Variables";
import { View } from "./View";
export declare class Controller implements IController {
    private fnRunLoopHandler;
    private fnWaitKeyHandler;
    private fnWaitInputHandler;
    private fnOnEscapeHandler;
    private fnDirectInputHandler;
    private fnPutKeyInBufferHandler;
    private static sMetaIdent;
    private fnScript?;
    private bTimeoutHandlerActive;
    private iNextLoopTimeOut;
    private bInputSet;
    private oVariables;
    private oBasicFormatter?;
    private oBasicTokenizer?;
    private oCodeGeneratorToken?;
    private model;
    private view;
    private commonEventHandler;
    private oCodeGeneratorJs;
    private oCanvas;
    private inputStack;
    private oKeyboard;
    private oVirtualKeyboard?;
    private oSound;
    private oVm;
    private oRsx;
    private oNoStop;
    private oSavedStop;
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
    private parseLineNumber;
    private mergeScripts;
    private static fnGetLinesInRange;
    private static fnPrepareMaskRegExp;
    private fnGetExampleDirectoryEntries;
    private static fnGetStorageDirectoryEntries;
    private fnPrintDirectoryEntries;
    private fnFileCat;
    private fnFileDir;
    private fnFileEra;
    private fnFileRen;
    private static asmGena3Convert;
    private decodeTokenizedBasic;
    private encodeTokenizedBasic;
    private loadFileContinue;
    private loadExample;
    private static fnLocalStorageName;
    private static aDefaultExtensions;
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
    private fnDownloadNewFile;
    fnDownload(): void;
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
    private fnEndOfImport;
    private static reRegExpIsText;
    private fnLoad2;
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
    onCpcCanvasClick(event: MouseEvent): void;
    onWindowClick(event: Event): void;
    private mHandlers;
}
