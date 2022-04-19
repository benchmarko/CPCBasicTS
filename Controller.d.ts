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
    private static metaIdent;
    private fnScript?;
    private timeoutHandlerActive;
    private nextLoopTimeOut;
    private inputSet;
    private variables;
    private basicFormatter?;
    private basicTokenizer?;
    private codeGeneratorToken?;
    private codeGeneratorBasic?;
    private model;
    private view;
    private commonEventHandler;
    private codeGeneratorJs;
    private canvas;
    private inputStack;
    private keyboard;
    private virtualKeyboard?;
    private sound;
    private vm;
    private rsx;
    private noStop;
    private savedStop;
    constructor(model: Model, view: View);
    private initDatabases;
    private onUserAction;
    addIndex(dir: string, input: string): void;
    addItem(key: string, input: string): string;
    private setDatabaseSelectOptions;
    setExampleSelectOptions(): void;
    private setVarSelectOptions;
    private updateStorageDatabase;
    setInputText(input: string, keepStack?: boolean): void;
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
    private prettyPrintBasic;
    private loadFileContinue;
    private loadExample;
    private static fnLocalStorageName;
    private static defaultExtensions;
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
    private static fnDownloadBlob;
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
    getVariable(par: string): VariableValue;
    undoStackElement(): string;
    redoStackElement(): string;
    onDatabaseSelectChange(): void;
    onExampleSelectChange(): void;
    static exportAsBase64(storageName: string): string;
    onCpcCanvasClick(event: MouseEvent): void;
    onWindowClick(event: Event): void;
    private handlers;
}