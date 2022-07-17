declare type MyDefineFunctionType = (...args: any) => void;
declare function amd4Node(): void;
declare function amd4browser(): void;
declare module "Utils" {
    export interface CustomError extends Error {
        value: string;
        pos: number;
        len?: number;
        line?: number | string;
        hidden?: boolean;
        shortMessage?: string;
    }
    export class Utils {
        static debug: number;
        static console: Console;
        private static fnLoadScriptOrStyle;
        static loadScript(url: string, fnSuccess: (url2: string, key: string) => void, fnError: (url2: string, key: string) => void, key: string): void;
        static hexEscape(str: string): string;
        static hexUnescape(str: string): string;
        static dateFormat(d: Date): string;
        static stringCapitalize(str: string): string;
        static numberWithCommas(x: number | string): string;
        static toRadians(deg: number): number;
        static toDegrees(rad: number): number;
        private static testIsSupported;
        static supportsBinaryLiterals: boolean;
        static supportReservedNames: boolean;
        static stringTrimEnd(str: string): string;
        static localStorage: Storage;
        static atob: (arg0: string) => string;
        static btoa: (arg0: string) => string;
        static isCustomError(e: unknown): e is CustomError;
        static composeError(name: string, errorObject: Error, message: string, value: string, pos?: number, len?: number, line?: string | number, hidden?: boolean): CustomError;
    }
}
declare module "Polyfills" {
    export var Polyfills: {
        count: number;
        log: (part: string) => void;
    };
}
declare module "Interfaces" {
    import { CustomError } from "Utils";
    export interface IOutput {
        text: string;
        error?: CustomError;
    }
    export type VariableValue = string | number | Function | [] | VariableValue[];
    export interface IController {
        startParse: () => void;
        startRenum: () => void;
        startRun: () => void;
        startParseRun: () => void;
        startBreak: () => void;
        startContinue: () => void;
        startReset: () => void;
        startScreenshot: () => string;
        startEnter: () => void;
        fnPretty: () => void;
        fnDownload: () => void;
        setInputText: (input: string, keepStack?: boolean) => void;
        setExampleSelectOptions: () => void;
        invalidateScript: () => void;
        setSoundActive: () => void;
        changeVariable: () => void;
        onExampleSelectChange: () => void;
        onDatabaseSelectChange: () => void;
        onCpcCanvasClick: (event: MouseEvent) => void;
        onWindowClick: (event: Event) => void;
        startUpdateCanvas: () => void;
        stopUpdateCanvas: () => void;
        virtualKeyboardCreate: () => void;
        getVariable: (par: string) => VariableValue;
        undoStackElement: () => string;
        redoStackElement: () => string;
    }
    export interface ICpcVmRsx {
        rsxIsAvailable: (name: string) => boolean;
    }
}
declare module "cpcCharset" {
    export const cpcCharset: number[][];
}
declare module "BasicLexer" {
    interface BasicLexerOptions {
        quiet?: boolean;
        keepWhiteSpace?: boolean;
    }
    export interface LexerToken {
        type: string;
        value: string;
        pos: number;
        orig?: string;
        ws?: string;
    }
    export class BasicLexer {
        private quiet;
        private keepWhiteSpace;
        private line;
        private takeNumberAsLine;
        private input;
        private index;
        private readonly tokens;
        private whiteSpace;
        setOptions(options: BasicLexerOptions): void;
        constructor(options?: BasicLexerOptions);
        private composeError;
        private static isComment;
        private static isOperator;
        private static isComparison;
        private static isComparison2;
        private static isDigit;
        private static isDot;
        private static isSign;
        private static isHexOrBin;
        private static isBin2;
        private static isHex2;
        private static isWhiteSpace;
        private static isNewLine;
        private static isQuotes;
        private static isNotQuotes;
        private static isIdentifierStart;
        private static isIdentifierMiddle;
        private static isIdentifierEnd;
        private static isStream;
        private static isAddress;
        private static isRsx;
        private static isNotNewLine;
        private static isUnquotedData;
        private testChar;
        private getChar;
        private advance;
        private advanceWhile;
        private debugCheckValue;
        private addToken;
        private fnParseNumber;
        private fnParseCompleteLineForRemOrApostrophe;
        private fnParseCompleteLineForData;
        private fnParseIdentifier;
        private fnTryContinueString;
        lex(input: string): LexerToken[];
    }
}
declare module "BasicParser" {
    import { LexerToken } from "BasicLexer";
    interface BasicParserOptions {
        quiet?: boolean;
        keepTokens?: boolean;
        keepBrackets?: boolean;
        keepColons?: boolean;
        keepDataComma?: boolean;
    }
    export interface ParserNode extends LexerToken {
        left?: ParserNode;
        right?: ParserNode;
        args?: ParserNode[];
        args2?: ParserNode[];
        len?: number;
        space?: boolean;
        parenthesis?: boolean;
    }
    export class BasicParser {
        private line;
        private quiet;
        private keepTokens;
        private keepBrackets;
        private keepColons;
        private keepDataComma;
        private readonly symbols;
        private tokens;
        private allowDirect;
        private index;
        private previousToken;
        private token;
        private readonly parseTree;
        private statementList;
        setOptions(options: BasicParserOptions): void;
        constructor(options?: BasicParserOptions);
        private static readonly parameterTypes;
        static readonly keywords: Record<string, string>;
        private readonly specialStatements;
        private static readonly closeTokensForLine;
        private static readonly closeTokensForLineAndElse;
        private static readonly closeTokensForArgs;
        private composeError;
        private getToken;
        private symbol;
        private advance;
        private expression;
        private fnCheckExpressionType;
        private assignment;
        private statement;
        private statements;
        private basicLine;
        private generateLed;
        private generateNud;
        private infix;
        private infixr;
        private prefix;
        private stmt;
        private static fnCreateDummyArg;
        private fnCombineTwoTokensNoArgs;
        private fnCombineTwoTokens;
        private fnGetOptionalStream;
        private fnChangeNumber2LineNumber;
        private fnGetLineRange;
        private static fnIsSingleLetterIdentifier;
        private fnGetLetterRange;
        private fnCheckRemainingTypes;
        private fnLastStatemetIsOnErrorGotoX;
        private fnGetExpressionForType;
        private fnGetArgs;
        private fnGetArgsSepByCommaSemi;
        private fnGetArgsInParenthesis;
        private static brackets;
        private fnGetArgsInParenthesesOrBrackets;
        private fnCreateCmdCall;
        private fnCreateCmdCallForType;
        private fnCreateFuncCall;
        private fnGenerateKeywordSymbols;
        private fnIdentifier;
        private fnParenthesis;
        private fnFn;
        private fnApostrophe;
        private fnRsx;
        private fnAfterOrEvery;
        private fnChain;
        private fnClear;
        private fnData;
        private fnDef;
        private fnElse;
        private fnEntOrEnv;
        private fnFor;
        private fnGraphics;
        private fnCheckForUnreachableCode;
        private fnIf;
        private fnInput;
        private fnKey;
        private fnLet;
        private fnLine;
        private fnMid$;
        private fnOn;
        private fnPrint;
        private fnQuestion;
        private fnResume;
        private fnRun;
        private fnSpeed;
        private fnSymbol;
        private fnWindow;
        private static fnNode;
        private fnGenerateSymbols;
        parse(tokens: LexerToken[], allowDirect?: boolean): ParserNode[];
    }
}
declare module "BasicFormatter" {
    import { BasicLexer } from "BasicLexer";
    import { BasicParser } from "BasicParser";
    import { IOutput } from "Interfaces";
    interface BasicFormatterOptions {
        lexer: BasicLexer;
        parser: BasicParser;
    }
    export class BasicFormatter {
        private readonly lexer;
        private readonly parser;
        private line;
        constructor(options: BasicFormatterOptions);
        private composeError;
        private fnCreateLineNumbersMap;
        private fnAddSingleReference;
        private fnAddReferences;
        private fnRenumberLines;
        private static fnSortNumbers;
        private static fnApplyChanges;
        private fnRenumber;
        renumber(input: string, newLine: number, oldLine: number, step: number, keep: number): IOutput;
    }
}
declare module "BasicTokenizer" {
    export class BasicTokenizer {
        private pos;
        private line;
        private lineEnd;
        private input;
        private readonly debug;
        private fnNum8Dec;
        private fnNum16Dec;
        private fnNum32Dec;
        private fnNum8DecAsStr;
        private fnNum16DecAsStr;
        private fnNum16Bin;
        private fnNum16Hex;
        private fnNumFp;
        private fnGetBit7TerminatedString;
        private fnVar;
        private fnIntVar;
        private fnStringVar;
        private fnFpVar;
        private fnRsx;
        private fnStringUntilEol;
        private fnApostrophe;
        private fnRem;
        private fnQuotedString;
        private readonly tokens;
        private readonly tokensFF;
        private debugPrintInfo;
        private debugCollectInfo;
        private fnParseLineFragment;
        private fnParseNextLine;
        private fnParseProgram;
        decodeLineFragment(program: string, offset: number, length: number): string;
        decode(program: string): string;
    }
}
declare module "CodeGeneratorBasic" {
    import { BasicLexer } from "BasicLexer";
    import { BasicParser } from "BasicParser";
    import { IOutput } from "Interfaces";
    interface CodeGeneratorBasicOptions {
        quiet?: boolean;
        lexer: BasicLexer;
        parser: BasicParser;
    }
    export class CodeGeneratorBasic {
        private quiet;
        private readonly lexer;
        private readonly parser;
        private line;
        constructor(options: CodeGeneratorBasicOptions);
        getLexer(): BasicLexer;
        getParser(): BasicParser;
        private static readonly combinedKeywords;
        private static readonly operators;
        private static readonly operatorPrecedence;
        private composeError;
        private static fnWs;
        private static fnSpace1;
        private static getUcKeyword;
        private fnParseOneArg;
        private fnParseArgs;
        private static fnColonsAvailable;
        private static combineArgsWithColon;
        private fnParenthesisOpen;
        private static string;
        private static unquoted;
        private static fnNull;
        private assign;
        private static decBinHexNumber;
        private identifier;
        private static linenumber;
        private label;
        private vertical;
        private afterEveryGosub;
        private chainMerge;
        private data;
        private def;
        private "else";
        private entOrEnv;
        private fn;
        private "for";
        private fnThenOrElsePart;
        private "if";
        private static fnHasStream;
        private inputLineInput;
        private list;
        private mid$Assign;
        private onGotoGosub;
        private onSqGosub;
        private print;
        private rem;
        private using;
        private readonly parseFunctions;
        private fnParseOther;
        private parseNode;
        private evaluate;
        generate(input: string, allowDirect?: boolean): IOutput;
    }
}
declare module "Variables" {
    export type VariableValue = string | number | Function | [] | VariableValue[];
    export type VariableMap = Record<string, VariableValue>;
    export class Variables {
        private variables;
        private varTypes;
        constructor();
        removeAllVariables(): void;
        getAllVariables(): VariableMap;
        private createNDimArray;
        determineStaticVarType(name: string): string;
        private getVarDefault;
        initVariable(name: string): void;
        dimVariable(name: string, dimensions: number[]): void;
        getAllVariableNames(): string[];
        getVariableIndex(name: string): number;
        initAllVariables(): void;
        getVariable(name: string): VariableValue;
        setVariable(name: string, value: VariableValue): void;
        getVariableByIndex(index: number): VariableValue;
        variableExist(name: string): boolean;
        getVarType(varChar: string): string;
        setVarType(varChar: string, type: string): void;
    }
}
declare module "CodeGeneratorJs" {
    import { IOutput, ICpcVmRsx } from "Interfaces";
    import { BasicLexer } from "BasicLexer";
    import { BasicParser } from "BasicParser";
    import { Variables } from "Variables";
    interface CodeGeneratorJsOptions {
        lexer: BasicLexer;
        parser: BasicParser;
        rsx: ICpcVmRsx;
        tron: boolean;
        quiet?: boolean;
        noCodeFrame?: boolean;
    }
    export class CodeGeneratorJs {
        private readonly lexer;
        private readonly parser;
        private tron;
        private readonly rsx;
        private quiet;
        private readonly noCodeFrame;
        private line;
        private readonly reJsKeywords;
        private readonly stack;
        private gosubCount;
        private ifCount;
        private stopCount;
        private forCount;
        private whileCount;
        private referencedLabelsCount;
        private readonly dataList;
        private mergeFound;
        private variables;
        private defScopeArgs?;
        constructor(options: CodeGeneratorJsOptions);
        private static readonly jsKeywords;
        private reset;
        private resetCountsPerLine;
        private composeError;
        private static createJsKeywordRegex;
        private fnDeclareVariable;
        private fnAdaptVariableName;
        private fnParseOneArg;
        private fnParseArgRange;
        private fnParseArgs;
        private fnDetermineStaticVarType;
        private static fnIsIntConst;
        private static fnGetRoundString;
        private static fnIsInString;
        private fnPropagateStaticTypes;
        private plus;
        private minus;
        private mult;
        private div;
        private intDiv;
        private exponent;
        private and;
        private or;
        private xor;
        private static not;
        private mod;
        private greater;
        private less;
        private greaterEqual;
        private lessEqual;
        private equal;
        private notEqual;
        private addressOf;
        private static stream;
        private allOperators;
        private unaryOperators;
        private fnParseDefIntRealStr;
        private fnAddReferenceLabel;
        private fnGetForLabel;
        private fnGetGosubLabel;
        private fnGetIfLabel;
        private fnGetStopLabel;
        private fnGetWhileLabel;
        private fnCommandWithGoto;
        private static commaOrSemicolon;
        private vertical;
        private static number;
        private static binnumber;
        private static hexnumber;
        private identifier;
        private static letterOrLinenumber;
        private range;
        private linerange;
        private static string;
        private static unquoted;
        private static fnNull;
        private assign;
        private label;
        private afterEveryGosub;
        private chainMergeOrMerge;
        private static cont;
        private data;
        private def;
        private dim;
        private "delete";
        private edit;
        private "else";
        private erase;
        private error;
        private fn;
        private "for";
        private gosub;
        private gotoOrResume;
        private fnThenOrElsePart;
        private static fnIsSimplePart;
        private "if";
        private inputOrlineInput;
        private let;
        private list;
        private mid$Assign;
        private static "new";
        private next;
        private onBreakGosubOrRestore;
        private onErrorGoto;
        private onGosubOnGoto;
        private onSqGosub;
        private print;
        private randomize;
        private read;
        private rem;
        private static "return";
        private run;
        private save;
        private spc;
        private stopOrEnd;
        private tab;
        private wend;
        private "while";
        private readonly parseFunctions;
        private fnParseOther;
        private parseNode;
        private static fnCommentUnusedCases;
        private fnCreateLabelsMap;
        private evaluate;
        private static combineData;
        debugGetLabelsCount(): number;
        generate(input: string, variables: Variables, allowDirect?: boolean): IOutput;
    }
}
declare module "CodeGeneratorToken" {
    import { BasicLexer } from "BasicLexer";
    import { BasicParser } from "BasicParser";
    import { IOutput } from "Interfaces";
    interface CodeGeneratorTokenOptions {
        quiet?: boolean;
        lexer: BasicLexer;
        parser: BasicParser;
    }
    export class CodeGeneratorToken {
        private quiet;
        private readonly lexer;
        private readonly parser;
        private line;
        private statementSeparator;
        constructor(options: CodeGeneratorTokenOptions);
        private static readonly operators;
        private static readonly operatorPrecedence;
        private static readonly tokens;
        private static readonly tokensFF;
        private composeError;
        private static convUInt8ToString;
        private static convUInt16ToString;
        private static convInt32ToString;
        private static token2String;
        private static getBit7TerminatedString;
        private combineArgsWithSeparator;
        private fnParseOneArg;
        private fnParseArgs;
        private fnArgs;
        private static semicolon;
        private colon;
        private static letter;
        private range;
        private linerange;
        private fnParenthesisOpen;
        private static string;
        private static unquoted;
        private static fnNull;
        private assign;
        private static floatToByteString;
        private static number;
        private static binnumber;
        private static hexnumber;
        private identifier;
        private static linenumber;
        private label;
        private vertical;
        private afterGosub;
        private chainMerge;
        private data;
        private def;
        private "else";
        private entEnv;
        private everyGosub;
        private fn;
        private "for";
        private fnThenOrElsePart;
        private "if";
        private static fnHasStream;
        private inputLineInput;
        private list;
        private mid$Assign;
        private onErrorGoto;
        private onGotoGosub;
        private onSqGosub;
        private print;
        private rem;
        private using;
        private readonly parseFunctions;
        private fnParseOther;
        private parseNode;
        private evaluate;
        generate(input: string, allowDirect?: boolean): IOutput;
    }
}
declare module "Diff" {
    export class Diff {
        private static composeError;
        private static inRange;
        private static fnEquals;
        private static customIndexOf;
        private static fnLCS;
        private static diff;
        static testDiff(text1: string, text2: string): string;
    }
}
declare module "DiskImage" {
    export interface DiskImageOptions {
        quiet?: boolean;
        diskName: string;
        data: string;
    }
    interface ExtentEntry {
        user: number;
        name: string;
        ext: string;
        extent: number;
        lastRecBytes: number;
        extentHi: number;
        records: number;
        blocks: number[];
        readOnly: boolean;
        system: boolean;
        backup: boolean;
    }
    export interface AmsdosHeader {
        user: number;
        name: string;
        ext: string;
        typeNumber: number;
        start: number;
        pseudoLen: number;
        entry: number;
        length: number;
        typeString: string;
    }
    type DirectoryListType = Record<string, ExtentEntry[]>;
    export class DiskImage {
        private quiet;
        private diskName;
        private data;
        private diskInfo;
        private format;
        constructor(options: DiskImageOptions);
        private static readonly formatDescriptors;
        private static getInitialDiskInfo;
        private static getInitialFormat;
        reset(): void;
        private composeError;
        static testDiskIdent(ident: string): number;
        private readUtf;
        private readUInt8;
        private readUInt16;
        private readDiskInfo;
        private readTrackInfo;
        private seekTrack;
        private sectorNum2Index;
        private seekSector;
        private readSector;
        private getFormatDescriptor;
        private determineFormat;
        private static fnRemoveHighBit7;
        private readDirectoryExtents;
        private static fnSortByExtentNumber;
        private static sortFileExtents;
        private static prepareDirectoryList;
        private convertBlock2Sector;
        readDirectory(): DirectoryListType;
        private nextSector;
        private readBlock;
        readFile(fileExtents: ExtentEntry[]): string;
        private static protectTable;
        static unOrProtectData(data: string): string;
        private static computeChecksum;
        static parseAmsdosHeader(data: string): AmsdosHeader | undefined;
        private static uInt8ToString;
        private static uInt16ToString;
        private static uInt24ToString;
        static combineAmsdosHeader(header: AmsdosHeader): string;
    }
}
declare module "InputStack" {
    export class InputStack {
        private input;
        private stackPosition;
        reset(): void;
        getInput(): string;
        clearRedo(): void;
        save(input: string): void;
        canUndoKeepOne(): boolean;
        undo(): string;
        canRedo(): boolean;
        redo(): string;
    }
}
declare module "View" {
    export interface SelectOptionElement {
        value: string;
        text: string;
        title: string;
        selected: boolean;
    }
    export class View {
        static getElementById1(id: string): HTMLElement;
        private static getElementByIdAs;
        getHidden(id: string): boolean;
        setHidden(id: string, hidden: boolean, display?: string): this;
        setDisabled(id: string, disabled: boolean): this;
        toggleClass(id: string, className: string): void;
        getAreaValue(id: string): string;
        setAreaValue(id: string, value: string): this;
        getInputValue(id: string): string;
        setInputValue(id: string, value: string): this;
        getInputChecked(id: string): boolean;
        setSelectOptions(id: string, options: SelectOptionElement[]): this;
        getSelectValue(id: string): string;
        setSelectValue(id: string, value: string): this;
        setSelectTitleFromSelectedOption(id: string): this;
        setAreaScrollTop(id: string, scrollTop?: number): this;
        private setSelectionRange;
        setAreaSelection(id: string, pos: number, endPos: number): this;
        attachEventHandler(type: string, eventHandler: EventListenerOrEventListenerObject): this;
    }
}
declare module "Keyboard" {
    export interface CpcKeyExpansionsOptions {
        cpcKey: number;
        repeat: number;
        normal?: number;
        shift?: number;
        ctrl?: number;
    }
    export type PressReleaseCpcKey = (cpcKey: number, pressedKey: string, key: string, shiftKey: boolean, ctrlKey: boolean) => void;
    interface KeyboardOptions {
        fnOnEscapeHandler?: (key: string, pressedKey: string) => void;
        fnOnKeyDown?: () => void;
    }
    export class Keyboard {
        private readonly options;
        private fnOnKeyDown?;
        private readonly keyBuffer;
        private readonly expansionTokens;
        private readonly cpcKeyExpansions;
        private active;
        private key2CpcKey;
        private codeStringsRemoved;
        private pressedKeys;
        constructor(options: KeyboardOptions);
        private static readonly key2CpcKey;
        private static readonly specialKeys;
        private static readonly joyKeyCodes;
        reset(): void;
        clearInput(): void;
        resetExpansionTokens(): void;
        resetCpcKeysExpansions(): void;
        getKeyDownHandler(): (() => void) | undefined;
        setKeyDownHandler(fnOnKeyDown?: () => void): void;
        setActive(active: boolean): void;
        private removeCodeStringsFromKeymap;
        fnPressCpcKey(cpcKeyCode: number, pressedKey: string, key: string, shiftKey: boolean, ctrlKey: boolean): void;
        fnReleaseCpcKey(cpcKeyCode: number, pressedKey: string, key: string, shiftKey: boolean, ctrlKey: boolean): void;
        private static keyIdentifier2Char;
        private fnKeyboardKeydown;
        private fnKeyboardKeyup;
        getKeyFromBuffer(): string;
        putKeyInBuffer(key: string): void;
        putKeysInBuffer(input: string): void;
        getKeyState(cpcKeyCode: number): number;
        getJoyState(joy: number): number;
        setExpansionToken(token: number, string: string): void;
        setCpcKeyExpansion(options: CpcKeyExpansionsOptions): void;
        private onCpcAreaKeydown;
        private oncpcAreaKeyup;
    }
}
declare module "VirtualKeyboard" {
    import { PressReleaseCpcKey } from "Keyboard";
    interface VirtualKeyboardOptions {
        fnPressCpcKey: PressReleaseCpcKey;
        fnReleaseCpcKey: PressReleaseCpcKey;
    }
    export class VirtualKeyboard {
        private readonly fnPressCpcKey;
        private readonly fnReleaseCpcKey;
        private readonly pointerOutEvent?;
        private readonly fnVirtualKeyout?;
        private shiftLock;
        private numLock;
        constructor(options: VirtualKeyboardOptions);
        private static readonly cpcKey2Key;
        private static readonly virtualVirtualKeyboardAlpha;
        private static readonly virtualVirtualKeyboardNum;
        private readonly dragInfo;
        private static readonly pointerEventNames;
        private static readonly touchEventNames;
        private static readonly mouseEventNames;
        private fnAttachPointerEvents;
        reset(): void;
        private mapNumLockCpcKey;
        private fnVirtualGetAscii;
        private createButtonRow;
        private virtualKeyboardCreatePart;
        private virtualKeyboardCreate;
        private virtualKeyboardAdaptKeys;
        private fnVirtualGetPressedKey;
        private fnGetEventTarget;
        private fnGetEventTargetAs;
        private onVirtualVirtualKeyboardKeydown;
        private fnVirtualVirtualKeyboardKeyupOrKeyout;
        private onVirtualVirtualKeyboardKeyup;
        private onVirtualVirtualKeyboardKeyout;
        private dragInit;
        private dragStart;
        private dragEnd;
        private setTranslate;
        private drag;
    }
}
declare module "Canvas" {
    type CharType = number[];
    type CharsetType = CharType[];
    export interface CanvasOptions {
        charset: CharsetType;
        onClickKey?: (arg0: string) => void;
    }
    export class Canvas {
        private readonly fnUpdateCanvasHandler;
        private readonly fnUpdateCanvas2Handler;
        private fps;
        private readonly cpcAreaBox;
        private readonly textText;
        private readonly charset;
        private customCharset;
        private readonly onClickKey?;
        private gColMode;
        private mask;
        private maskBit;
        private maskFirst;
        private offset;
        private readonly canvas;
        private width;
        private height;
        private borderWidth;
        private readonly dataset8;
        private needUpdate;
        private needTextUpdate;
        private readonly colorValues;
        private readonly currentInks;
        private readonly speedInk;
        private inkSet;
        private readonly pen2ColorMap;
        private animationTimeoutId?;
        private animationFrame?;
        private readonly ctx;
        private readonly imageData;
        private fnCopy2Canvas?;
        private littleEndian;
        private pen2Color32?;
        private data32?;
        private use32BitCopy;
        private gPen;
        private gPaper;
        private speedInkCount;
        private readonly textBuffer;
        private hasFocus;
        private mode;
        private modeData;
        private xPos;
        private yPos;
        private xOrig;
        private yOrig;
        private xLeft;
        private xRight;
        private yTop;
        private yBottom;
        private gTransparent;
        constructor(options: CanvasOptions);
        private static readonly colors;
        private static readonly defaultInks;
        private static readonly modeData;
        private static readonly cpc2Unicode;
        reset(): void;
        resetCustomChars(): void;
        private resetTextBuffer;
        private static isLittleEndian;
        private static extractColorValues;
        private static extractAllColorValues;
        private setAlpha;
        private setNeedUpdate;
        private setNeedTextUpdate;
        private updateCanvas2;
        private updateCanvas;
        startUpdateCanvas(): void;
        stopUpdateCanvas(): void;
        private copy2Canvas8bit;
        private copy2Canvas32bit;
        private copy2Canvas32bitWithOffset;
        private applyCopy2CanvasFunction;
        setScreenOffset(offset: number): void;
        private updateTextWindow;
        private updateColorMap;
        updateSpeedInk(): void;
        setCustomChar(char: number, charData: CharType): void;
        getCharData(char: number): CharType;
        setDefaultInks(): void;
        private setFocusOnCanvas;
        private getMousePos;
        private canvasClickAction2;
        onCpcCanvasClick(event: MouseEvent): void;
        onWindowClick(_event: Event): void;
        getXpos(): number;
        getYpos(): number;
        private fillMyRect;
        fillTextBox(left: number, top: number, width: number, height: number, pen: number): void;
        private moveMyRectUp;
        private moveMyRectDown;
        private invertChar;
        private setChar;
        private readCharData;
        private setSubPixels;
        private setPixel;
        private setPixelOriginIncluded;
        private testSubPixel;
        private testPixel;
        getByte(addr: number): number | null;
        setByte(addr: number, byte: number): void;
        private drawBresenhamLine;
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
        private clearTextBufferBox;
        private copyTextBufferBoxUp;
        private copyTextBufferBoxDown;
        private putCharInTextBuffer;
        private getCharFromTextBuffer;
        printChar(char: number, x: number, y: number, pen: number, paper: number, transparent: boolean): void;
        drawCursor(x: number, y: number, pen: number, paper: number): void;
        private findMatchingChar;
        readChar(x: number, y: number, pen: number, paper: number): number;
        private fnIsNotInWindow;
        fill(fillPen: number): void;
        private static fnPutInRange;
        setOrigin(xOrig: number, yOrig: number): void;
        setGWindow(xLeft: number, xRight: number, yTop: number, yBottom: number): void;
        setGColMode(gColMode: number): void;
        clearTextWindow(left: number, right: number, top: number, bottom: number, paper: number): void;
        clearGraphicsWindow(): void;
        clearFullWindow(): void;
        windowScrollUp(left: number, right: number, top: number, bottom: number, pen: number): void;
        windowScrollDown(left: number, right: number, top: number, bottom: number, pen: number): void;
        setSpeedInk(time1: number, time2: number): void;
        setMask(mask: number): void;
        setMaskFirst(maskFirst: number): void;
        getMode(): number;
        changeMode(mode: number): void;
        setMode(mode: number): void;
        startScreenshot(): string;
        getCanvas(): HTMLCanvasElement;
    }
}
declare module "Model" {
    export type ConfigEntryType = string | number | boolean;
    export type ConfigType = Record<string, ConfigEntryType>;
    export interface DatabaseEntry {
        text: string;
        title: string;
        src: string;
        script?: string;
        loaded?: boolean;
    }
    export interface ExampleEntry {
        key: string;
        title: string;
        meta: string;
        script?: string;
        loaded?: boolean;
    }
    export type DatabasesType = Record<string, DatabaseEntry>;
    export class Model {
        private config;
        private initialConfig;
        private databases;
        private examples;
        constructor(config: ConfigType);
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
}
declare module "CommonEventHandler" {
    import { IController } from "Interfaces";
    import { Model } from "Model";
    import { View } from "View";
    export class CommonEventHandler implements EventListenerObject {
        private readonly model;
        private readonly view;
        private readonly controller;
        private fnUserAction;
        constructor(model: Model, view: View, controller: IController);
        private toogleHidden;
        fnSetUserAction(fnAction: ((event: Event, id: string) => void) | undefined): void;
        private onSpecialButtonClick;
        private onInputButtonClick;
        private onInp2ButtonClick;
        private onOutputButtonClick;
        private onResultButtonClick;
        private onTextButtonClick;
        private onVariableButtonClick;
        private onCpcButtonClick;
        private onConvertButtonClick;
        private onKbdButtonClick;
        private onKbdLayoutButtonClick;
        private onConsoleButtonClick;
        private onParseButtonClick;
        private onRenumButtonClick;
        private onPrettyButtonClick;
        private fnUpdateAreaText;
        private onUndoButtonClick;
        private onRedoButtonClick;
        private onDownloadButtonClick;
        private onRunButtonClick;
        private onStopButtonClick;
        private onContinueButtonClick;
        private onResetButtonClick;
        private onParseRunButtonClick;
        private static onHelpButtonClick;
        private static onNothing;
        private onOutputTextChange;
        private static encodeUriParam;
        private onReloadButtonClick;
        onDatabaseSelectChange(): void;
        onExampleSelectChange(): void;
        onVarSelectChange(): void;
        onKbdLayoutSelectChange(): void;
        private onVarTextChange;
        private onScreenshotButtonClick;
        private onEnterButtonClick;
        private onSoundButtonClick;
        onCpcCanvasClick(event: Event): void;
        onWindowClick(event: Event): void;
        private readonly handlers;
        handleEvent(event: Event): void;
    }
}
declare module "Random" {
    export class Random {
        private x;
        constructor(seed?: number);
        init(seed?: number): void;
        random(): number;
    }
}
declare module "Sound" {
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
    export class Sound {
        private isSoundOn;
        private isActivatedByUserFlag;
        private context?;
        private mergerNode?;
        private readonly gainNodes;
        private readonly oscillators;
        private readonly queues;
        private fScheduleAheadTime;
        private readonly volEnv;
        private readonly toneEnv;
        private readonly debugLogList?;
        constructor();
        reset(): void;
        private stopOscillator;
        private debugLog;
        resetQueue(): void;
        private createSoundContext;
        private playNoise;
        private applyVolEnv;
        private applyToneEnv;
        private scheduleNote;
        testCanQueue(state: number): boolean;
        sound(soundData: SoundData): void;
        setVolEnv(volEnv: number, volEnvData: VolEnvData[]): void;
        setToneEnv(toneEnv: number, toneEnvData: ToneEnvData[]): void;
        private updateQueueStatus;
        scheduler(): void;
        release(releaseMask: number): void;
        sq(n: number): number;
        setActivatedByUser(): void;
        isActivatedByUser(): boolean;
        soundOn(): void;
        soundOff(): void;
    }
}
declare module "ZipFile" {
    interface CentralDirFileHeader {
        signature: number;
        version: number;
        flag: number;
        compressionMethod: number;
        modificationTime: number;
        crc: number;
        compressedSize: number;
        size: number;
        fileNameLength: number;
        extraFieldLength: number;
        fileCommentLength: number;
        localOffset: number;
        name: string;
        isDirectory: boolean;
        extra: Uint8Array;
        comment: string;
        timestamp: number;
        dataStart: number;
    }
    type ZipDirectoryType = {
        [k in string]: CentralDirFileHeader;
    };
    export class ZipFile {
        private data;
        private zipName;
        private entryTable;
        constructor(data: Uint8Array, zipName: string);
        getZipDirectory(): ZipDirectoryType;
        private composeError;
        private subArr;
        private readUTF;
        private readUInt;
        private readUShort;
        private readEocd;
        private readCdfh;
        private readZipDirectory;
        private static fnInflateConstruct;
        private static fnConstructFixedHuffman;
        private inflate;
        readData(name: string): string;
    }
}
declare module "CpcVm" {
    import { CustomError } from "Utils";
    import { Keyboard } from "Keyboard";
    import { Sound, SoundData } from "Sound";
    import { Canvas } from "Canvas";
    import { Variables, VariableMap } from "Variables";
    import { ICpcVmRsx } from "Interfaces";
    export interface CpcVmOptions {
        canvas: Canvas;
        keyboard: Keyboard;
        sound: Sound;
        variables: Variables;
        tron?: boolean;
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
        first: number;
        last: number;
    }
    export interface VmLineRenumParas extends VmBaseParas {
        newLine: number;
        oldLine: number;
        step: number;
        keep: number;
    }
    export interface VmFileParas extends VmBaseParas {
        fileMask: string;
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
    export interface VmStopEntry {
        reason: string;
        priority: number;
        paras: VmStopParas;
    }
    type PrintObjectType = {
        type: string;
        args: (string | number)[];
    };
    type DataEntryType = (string | undefined);
    export class CpcVm {
        private quiet;
        private readonly fnOpeninHandler;
        private readonly fnCloseinHandler;
        private readonly fnCloseoutHandler;
        fnLoadHandler: (input: string, meta: FileMeta) => boolean;
        private readonly fnRunHandler;
        private readonly canvas;
        private readonly keyboard;
        private readonly soundClass;
        readonly variables: Variables;
        private tronFlag;
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
        private tronLine;
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
        vmSetStartLine(line: number): void;
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
        private vmInitUntypedVariables;
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
        vmTrace(line: number): void;
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
        chain(name: string, line?: number): void;
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
        defint(nameOrRange: string): void;
        defreal(nameOrRange: string): void;
        defstr(nameOrRange: string): void;
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
}
declare module "CpcVmRsx" {
    import { ICpcVmRsx } from "Interfaces";
    import { CpcVm } from "CpcVm";
    export class CpcVmRsx implements ICpcVmRsx {
        private readonly vm;
        constructor(vm: CpcVm);
        rsxIsAvailable(name: string): boolean;
        rsxExec(name: string, ...args: (string | number)[]): void;
        a(): void;
        b(): void;
        basic(): void;
        cpm(): void;
        private fnGetVariableByAddress;
        private fnGetParameterAsString;
        dir(fileMask?: string | number): void;
        disc(): void;
        disc_in(): void;
        disc_out(): void;
        drive(): void;
        era(fileMask?: string | number): void;
        ren(newName: string | number, oldName: string | number): void;
        tape(): void;
        tape_in(): void;
        tape_out(): void;
        user(): void;
        mode(mode: number): void;
        renum(...args: number[]): void;
    }
}
declare module "Controller" {
    import { IController } from "Interfaces";
    import { Model } from "Model";
    import { VariableValue } from "Variables";
    import { View } from "View";
    export class Controller implements IController {
        private readonly fnRunLoopHandler;
        private readonly fnWaitKeyHandler;
        private readonly fnWaitInputHandler;
        private readonly fnOnEscapeHandler;
        private readonly fnDirectInputHandler;
        private readonly fnPutKeyInBufferHandler;
        private static readonly metaIdent;
        private fnScript?;
        private timeoutHandlerActive;
        private nextLoopTimeOut;
        private inputSet;
        private variables;
        private basicFormatter?;
        private basicTokenizer?;
        private codeGeneratorToken?;
        private codeGeneratorBasic?;
        private readonly model;
        private readonly view;
        private readonly commonEventHandler;
        private readonly codeGeneratorJs;
        private readonly canvas;
        private readonly inputStack;
        private readonly keyboard;
        private virtualKeyboard?;
        private readonly sound;
        private readonly vm;
        private readonly rsx;
        private readonly noStop;
        private readonly savedStop;
        constructor(model: Model, view: View);
        private initDatabases;
        private onUserAction;
        addIndex(dir: string, input: string): void;
        addItem(key: string, input: string): string;
        private setDatabaseSelectOptions;
        setExampleSelectOptions(): void;
        private setVarSelectOptions;
        private updateStorageDatabase;
        private removeKeyBoardHandler;
        setInputText(input: string, keepStack?: boolean): void;
        invalidateScript(): void;
        private fnWaitForContinue;
        private fnOnEscape;
        private fnWaitSound;
        private fnWaitKey;
        private fnWaitInput;
        private static parseLineNumber;
        private static mergeScripts;
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
        private readonly handlers;
    }
}
declare module "cpcconfig" {
    export const cpcconfig: {
        databaseDirs: string;
    };
}
declare module "cpcbasic" {
    class cpcBasic {
        private static readonly config;
        private static model;
        private static view;
        private static controller;
        private static fnHereDoc;
        static addIndex(dir: string, input: string | (() => void)): void;
        static addItem(key: string, input: string | (() => void)): string;
        private static fnParseArgs;
        private static fnParseUri;
        private static fnMapObjectProperties;
        private static createDebugUtilsConsole;
        private static fnDoStart;
        static fnOnLoad(): void;
    }
    global {
        interface Window {
            cpcBasic: cpcBasic;
        }
    }
}
//# sourceMappingURL=cpcbasicts.d.ts.map