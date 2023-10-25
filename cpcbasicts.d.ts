declare var Polyfills: {
    list: string[];
    getList: () => string[];
    log: (part: string) => void;
    console: Console;
    localStorage: Storage;
    isNodeAvailable: boolean;
    isDefinePropertyOk: boolean;
};
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
        errCode?: number;
    }
    export class Utils {
        static debug: number;
        static console: Console;
        private static fnLoadScriptOrStyle;
        static loadScript(url: string, fnSuccess: (url2: string, key: string) => void, fnError: (url2: string, key: string) => void, key: string): void;
        static hexEscape(str: string): string;
        static dateFormat(d: Date): string;
        static stringCapitalize(str: string): string;
        static numberWithCommas(x: number | string): string;
        static toRadians(deg: number): number;
        static toDegrees(rad: number): number;
        static toPrecision9(num: number): string;
        private static testIsSupported;
        static supportsBinaryLiterals: boolean;
        static supportReservedNames: boolean;
        static stringTrimEnd(str: string): string;
        static localStorage: Storage;
        static atob: (data: string) => string;
        static btoa: (data: string) => string;
        static isCustomError(e: unknown): e is CustomError;
        static split2(str: string, char: string): string[];
        static string2Uint8Array(data: string): Uint8Array;
        static composeError(name: string, errorObject: Error, message: string, value: string, pos?: number, len?: number, line?: string | number, hidden?: boolean): CustomError;
        static composeVmError(name: string, errorObject: Error, errCode: number, value: string): CustomError;
    }
}
declare module "Interfaces" {
    import { CustomError } from "Utils";
    export interface IOutput {
        text: string;
        error?: CustomError;
    }
    export type CanvasClickType = (event: MouseEvent, x: number, y: number, xTxt: number, yTxt: number) => void;
    export type CanvasCharType = number[];
    export type CanvasCharsetType = CanvasCharType[];
    export interface CanvasOptions {
        charset: CanvasCharsetType;
        palette: "color" | "green" | "grey";
        onCanvasClick?: CanvasClickType;
    }
    export interface ICanvas {
        setOnCanvasClick(onCanvasClickHandler: CanvasClickType): void;
        reset(): void;
        resetCustomChars(): void;
        setPalette(palette: "color" | "green" | "grey"): void;
        startUpdateCanvas(): void;
        stopUpdateCanvas(): void;
        setScreenOffset(offset: number): void;
        updateColorsAndCanvasImmediately(inkList: number[]): void;
        updateSpeedInk(): void;
        setCustomChar(char: number, charData: CanvasCharType): void;
        getCharData(char: number): CanvasCharType;
        setDefaultInks(): void;
        onCanvasClick(event: MouseEvent): void;
        onWindowClick(_event: Event): void;
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
        takeScreenShot(): string;
        getCanvasElement(): HTMLElement | undefined;
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
    export interface IController {
        toggleAreaHidden: (id: string) => boolean;
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
        fnAddLines: () => void;
        fnRemoveLines: () => void;
        fnDownload: () => void;
        setInputText: (input: string, keepStack?: boolean) => void;
        setExampleSelectOptions: () => void;
        setGalleryAreaInputs: () => void;
        invalidateScript: () => void;
        setSoundActive: () => void;
        setPalette: (palette: string) => void;
        setCanvasType: (canvasType: string) => ICanvas;
        changeVariable: () => void;
        onExampleSelectChange: () => void;
        onDirectorySelectChange: () => void;
        onDatabaseSelectChange: () => void;
        onCpcCanvasClick: (event: MouseEvent) => void;
        onWindowClick: (event: Event) => void;
        startUpdateCanvas: () => void;
        stopUpdateCanvas: () => void;
        virtualKeyboardCreate: () => void;
        getVariable: (par: string) => VariableValue;
        undoStackElement: () => string;
        redoStackElement: () => string;
        fnImplicitLines: () => void;
        fnArrayBounds: () => void;
        fnTrace: () => void;
        fnSpeed: () => void;
    }
}
declare module "cpcCharset" {
    export const cpcCharset: number[][];
}
declare module "Model" {
    import { ICpcVmRsx } from "Interfaces";
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
        rsx?: ICpcVmRsx;
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
declare module "BasicLexer" {
    interface BasicLexerOptions {
        keywords: Record<string, string>;
        keepWhiteSpace?: boolean;
        quiet?: boolean;
    }
    export interface LexerToken {
        type: string;
        value: string;
        pos: number;
        orig?: string;
        ws?: string;
    }
    export class BasicLexer {
        private readonly options;
        private label;
        private takeNumberAsLabel;
        private input;
        private index;
        private readonly tokens;
        private whiteSpace;
        setOptions(options: Omit<BasicLexerOptions, "keywords">): void;
        getOptions(): BasicLexerOptions;
        constructor(options: BasicLexerOptions);
        private composeError;
        private static isOperatorOrStreamOrAddress;
        private static isComparison;
        private static isComparison2;
        private static isDigit;
        private static isSign;
        private static isBin;
        private static isHex;
        private static isWhiteSpace;
        private static isNotQuotes;
        private static isIdentifierStart;
        private static isIdentifierMiddle;
        private static isIdentifierEnd;
        private static isNotNewLine;
        private static isUnquotedData;
        private testChar;
        private getChar;
        private advance;
        private advanceWhile;
        private debugCheckValue;
        private addToken;
        private fnParseExponentialNumber;
        private fnParseNumber;
        private fnParseCompleteLineForRemOrApostrophe;
        private fnParseWhiteSpace;
        private fnParseUnquoted;
        private fnParseCompleteLineForData;
        private fnParseIdentifier;
        private fnParseHexOrBin;
        private fnTryContinueString;
        private fnParseString;
        private fnParseRsx;
        private processNextCharacter;
        lex(input: string): LexerToken[];
    }
}
declare module "BasicParser" {
    import { LexerToken } from "BasicLexer";
    interface BasicParserOptions {
        quiet?: boolean;
        keepBrackets?: boolean;
        keepColons?: boolean;
        keepDataComma?: boolean;
        keepTokens?: boolean;
    }
    export interface ParserNode extends LexerToken {
        left?: ParserNode;
        right?: ParserNode;
        args?: ParserNode[];
        len?: number;
    }
    export class BasicParser {
        private readonly options;
        private label;
        private readonly symbols;
        private tokens;
        private index;
        private previousToken;
        private token;
        private readonly parseTree;
        private statementList;
        setOptions(options: BasicParserOptions): void;
        getOptions(): BasicParserOptions;
        constructor(options?: BasicParserOptions);
        private static readonly parameterTypes;
        static readonly keywords: Record<string, string>;
        private readonly specialStatements;
        private static readonly closeTokensForLine;
        private static readonly closeTokensForLineAndElse;
        private static readonly closeTokensForArgs;
        private composeError;
        private fnLastStatementIsOnErrorGotoX;
        private fnMaskedError;
        private advance;
        private expression;
        private fnCheckExpressionType;
        private assignment;
        private statement;
        private statements;
        private static fnCreateDummyArg;
        private basicLine;
        private fnCombineTwoTokensNoArgs;
        private fnCombineTwoTokens;
        private fnGetOptionalStream;
        private fnChangeNumber2LineNumber;
        private fnGetLineRange;
        private static fnIsSingleLetterIdentifier;
        private fnGetLetterRange;
        private fnCheckRemainingTypes;
        private fnCheckStaticTypeNotNumber;
        private fnCheckStaticTypeNotString;
        private fnGetExpressionForType;
        private fnGetArgs;
        private fnGetArgsSepByCommaSemi;
        private fnGetArgsInParenthesis;
        private static brackets;
        private fnGetArgsInParenthesesOrBrackets;
        private fnCreateCmdCall;
        private fnCreateCmdCallForType;
        private fnCreateFuncCall;
        private fnIdentifier;
        private fnParenthesis;
        private fnFn;
        private rsx;
        private afterEveryGosub;
        private chain;
        private clear;
        private data;
        private def;
        private fnElse;
        private entOrEnv;
        private fnFor;
        private graphics;
        private fnCheckForUnreachableCode;
        private fnIf;
        private input;
        private key;
        private let;
        private line;
        private mid$Assign;
        private on;
        private print;
        private question;
        private resume;
        private run;
        private speed;
        private symbol;
        private window;
        private write;
        private static fnNode;
        private createSymbol;
        private createNudSymbol;
        private fnInfixLed;
        private createInfix;
        private createInfixr;
        private fnPrefixNud;
        private createPrefix;
        private createStatement;
        private fnGenerateKeywordSymbols;
        private fnGenerateSymbols;
        parse(tokens: LexerToken[]): ParserNode[];
    }
}
declare module "BasicFormatter" {
    import { BasicLexer } from "BasicLexer";
    import { BasicParser } from "BasicParser";
    import { IOutput } from "Interfaces";
    interface BasicFormatterOptions {
        lexer: BasicLexer;
        parser: BasicParser;
        implicitLines?: boolean;
    }
    export class BasicFormatter {
        private readonly options;
        private label;
        setOptions(options: BasicFormatterOptions): void;
        getOptions(): BasicFormatterOptions;
        constructor(options: BasicFormatterOptions);
        private composeError;
        private static fnHasLabel;
        private fnCreateLabelEntry;
        private fnCreateLabelMap;
        private fnAddSingleReference;
        private fnAddReferencesForNode;
        private fnAddReferences;
        private fnRenumberLines;
        private static fnSortNumbers;
        private static fnApplyChanges;
        private fnRenumber;
        renumber(input: string, newLine: number, oldLine: number, step: number, keep: number): IOutput;
        private fnRemoveUnusedLines;
        removeUnusedLines(input: string): IOutput;
    }
}
declare module "BasicTokenizer" {
    export class BasicTokenizer {
        private pos;
        private line;
        private lineEnd;
        private input;
        private needSpace;
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
        private fnParseNextToken;
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
        lexer: BasicLexer;
        parser: BasicParser;
        quiet?: boolean;
    }
    export class CodeGeneratorBasic {
        private readonly options;
        private hasColons;
        private keepWhiteSpace;
        private line;
        setOptions(options: Omit<CodeGeneratorBasicOptions, "lexer" | "parser">): void;
        getOptions(): CodeGeneratorBasicOptions;
        constructor(options: CodeGeneratorBasicOptions);
        private static readonly combinedKeywords;
        private static readonly operators;
        private static readonly operatorPrecedence;
        private composeError;
        private static fnWs;
        private static fnSpace1;
        private static getUcKeyword;
        private fnParseArgs;
        private combineArgsWithColon;
        private fnParenthesisOpen;
        private static string;
        private static ustring;
        private assign;
        private static expnumber;
        private static binHexNumber;
        private label;
        private vertical;
        private afterEveryGosub;
        private chainOrChainMerge;
        private data;
        private def;
        private elseComment;
        private fn;
        private fnFor;
        private fnElse;
        private fnIf;
        private inputLineInput;
        private list;
        private mid$Assign;
        private onBreakOrError;
        private onGotoGosub;
        private onSqGosub;
        private print;
        private rem;
        private using;
        private write;
        private readonly parseFunctions;
        private fnParseOther;
        private static getLeftOrRightOperatorPrecedence;
        private parseOperator;
        private parseNode;
        private evaluate;
        generate(input: string): IOutput;
    }
}
declare module "Variables" {
    import { VariableValue } from "Interfaces";
    interface VariablesOptions {
        arrayBounds?: boolean;
    }
    export type VariableMap = Record<string, VariableValue>;
    export type VarTypes = "I" | "R" | "$";
    export type VariableTypeMap = Record<string, VarTypes>;
    export class Variables {
        private arrayBounds;
        private variables;
        private varTypes;
        setOptions(options: VariablesOptions): void;
        constructor(options?: VariablesOptions);
        removeAllVariables(): void;
        getAllVariables(): VariableMap;
        getAllVarTypes(): VariableTypeMap;
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
        getVarType(varChar: string): VarTypes;
        setVarType(varChar: string, type: VarTypes): void;
    }
}
declare module "CodeGeneratorJs" {
    import { IOutput } from "Interfaces";
    import { BasicLexer } from "BasicLexer";
    import { BasicParser } from "BasicParser";
    import { Variables } from "Variables";
    interface CodeGeneratorJsOptions {
        lexer: BasicLexer;
        parser: BasicParser;
        implicitLines?: boolean;
        noCodeFrame?: boolean;
        quiet?: boolean;
        trace?: boolean;
    }
    export class CodeGeneratorJs {
        private readonly options;
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
        private readonly labelList;
        private sourceMap;
        private countMap;
        private variables;
        private defScopeArgs?;
        private defintDefstrTypes;
        setOptions(options: Omit<CodeGeneratorJsOptions, "lexer" | "parser" | "rsx">): void;
        getOptions(): CodeGeneratorJsOptions;
        constructor(options: CodeGeneratorJsOptions);
        private static readonly jsKeywords;
        private reset;
        private resetCountsPerLine;
        private composeError;
        private static createJsKeywordRegex;
        private fnDeclareVariable;
        private static varTypeMap;
        private fnAdaptVariableName;
        private fnParseOneArg;
        private fnParseArgRange;
        private fnParseArgs;
        private fnParseArgsIgnoringCommaSemi;
        private fnDetermineStaticVarType;
        private static fnExtractVarName;
        private static fnGetNameTypeExpression;
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
        private static expnumber;
        private static binnumber;
        private static hexnumber;
        private identifier;
        private static letter;
        private static linenumber;
        private range;
        private linerange;
        private static string;
        private static unquoted;
        private static fnNull;
        private assign;
        private generateTraceLabel;
        private label;
        private afterEveryGosub;
        private static cont;
        private data;
        private def;
        private dim;
        private fnDelete;
        private edit;
        private elseComment;
        private erase;
        private error;
        private fn;
        private static parseIntNumber;
        private fnFor;
        private gosub;
        private gotoOrResume;
        private fnThenOrElsePart;
        private static fnIsSimplePart;
        private fnIf;
        private inputOrlineInput;
        private let;
        private list;
        private mid$Assign;
        private static fnNew;
        private next;
        private onBreakGosubOrRestore;
        private onErrorGoto;
        private onGosubOnGoto;
        private onSqGosub;
        private print;
        private randomize;
        private read;
        private rem;
        private apostrophe;
        private static fnReturn;
        private run;
        private save;
        private spc;
        private stopOrEnd;
        private tab;
        private usingOrWrite;
        private wend;
        private fnWhile;
        private readonly parseFunctions;
        private fnParseOther;
        private parseOperator;
        private parseNode;
        private static fnCommentUnusedCases;
        private fnCheckLabel;
        private fnCreateLabelMap;
        private removeAllDefVarTypes;
        private fnSetDefVarTypeRange;
        private fnPrecheckDefintDefstr;
        private fnPrecheckTree;
        private evaluate;
        private static combineData;
        private static combineLabels;
        getSourceMap(): Record<string, number[]>;
        debugGetLabelsCount(): number;
        generate(input: string, variables: Variables, allowDirect?: boolean): IOutput;
    }
}
declare module "CodeGeneratorToken" {
    import { BasicLexer } from "BasicLexer";
    import { BasicParser } from "BasicParser";
    import { IOutput } from "Interfaces";
    interface CodeGeneratorTokenOptions {
        lexer: BasicLexer;
        parser: BasicParser;
        quiet?: boolean;
        implicitLines?: boolean;
    }
    export class CodeGeneratorToken {
        private readonly options;
        private label;
        setOptions(options: Omit<CodeGeneratorTokenOptions, "lexer" | "parser">): void;
        getOptions(): CodeGeneratorTokenOptions;
        constructor(options: CodeGeneratorTokenOptions);
        private static readonly tokens;
        private static readonly tokensFF;
        private composeError;
        private static convUInt8ToString;
        private static convUInt16ToString;
        private static convInt32ToString;
        private static token2String;
        private static getBit7TerminatedString;
        private static fnGetWs;
        private fnParseArgs;
        private fnArgs;
        private range;
        private linerange;
        private static string;
        private static ustring;
        private static fnEol;
        private static floatToByteString;
        private static number;
        private static binnumber;
        private static hexnumber;
        private static varTypeMap;
        private identifier;
        private static linenumber;
        private fnLabel;
        private vertical;
        private fnElseOrApostrophe;
        private elseComment;
        private onBreakContOrGosubOrStop;
        private onErrorGoto;
        private onSqGosub;
        private readonly parseFunctions;
        private fnParseOther;
        private parseNode;
        private evaluate;
        generate(input: string): IOutput;
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
        diskName: string;
        data: string;
        quiet?: boolean;
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
        private readonly options;
        private diskInfo;
        private format;
        setOptions(options: DiskImageOptions): void;
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
        private readExtents;
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
    export interface AreaInputElement {
        value: string;
        title: string;
        checked: boolean;
        imgUrl: string;
    }
    export class View {
        static getElementById1(id: string): HTMLElement;
        static getElementByIdAs<T extends HTMLButtonElement | HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | HTMLElement>(id: string): T;
        getHidden(id: string): boolean;
        setHidden(id: string, hidden: boolean, display?: string): this;
        setDisabled(id: string, disabled: boolean): this;
        toggleClass(id: string, className: string): void;
        getAreaValue(id: string): string;
        setAreaValue(id: string, value: string): this;
        getInputValue(id: string): string;
        setInputValue(id: string, value: string): this;
        getInputChecked(id: string): boolean;
        setInputChecked(id: string, checked: boolean): this;
        setAreaInputList(id: string, inputs: AreaInputElement[]): this;
        setSelectOptions(id: string, options: SelectOptionElement[]): this;
        getSelectOptions(id: string): SelectOptionElement[];
        getSelectValue(id: string): string;
        setSelectValue(id: string, value: string): this;
        setSelectTitleFromSelectedOption(id: string): this;
        setAreaScrollTop(id: string, scrollTop?: number): this;
        private setSelectionRange;
        setAreaSelection(id: string, pos: number, endPos: number): this;
        attachEventHandler(type: string, eventHandler: EventListenerOrEventListenerObject): this;
        static getEventTarget<T extends HTMLElement>(event: Event): T;
        static requestFullscreenForId(id: string): boolean;
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
    export type PressReleaseCpcKey = (event: KeyboardEvent | PointerEvent, cpcKey: number, pressedKey: string, key: string) => void;
    interface KeyboardOptions {
        fnOnEscapeHandler?: (key: string, pressedKey: string) => void;
        fnOnKeyDown?: () => void;
    }
    export class Keyboard {
        private readonly fnCpcAreaKeydownHandler;
        private readonly fnCpcAreaKeyupHandler;
        private readonly options;
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
        fnPressCpcKey(event: KeyboardEvent | PointerEvent, cpcKeyCode: number, pressedKey: string, key: string): void;
        fnReleaseCpcKey(event: KeyboardEvent | PointerEvent, cpcKeyCode: number, pressedKey: string, key: string): void;
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
        private readonly options;
        private readonly pointerOutEvent?;
        private readonly fnVirtualKeyout?;
        private shiftLock;
        private numLock;
        constructor(options: VirtualKeyboardOptions);
        private static readonly cpcKey2Key;
        private static readonly virtualKeyboardAlpha;
        private static readonly virtualKeyboardNum;
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
        private onVirtualKeyboardKeydown;
        private fnVirtualKeyboardKeyupOrKeyout;
        private onVirtualKeyboardKeyup;
        private onVirtualKeyboardKeyout;
        private dragInit;
        private dragStart;
        private dragEnd;
        private setTranslate;
        private drag;
    }
}
declare module "Canvas" {
    import { CanvasOptions, ICanvas, CanvasClickType, CanvasCharType } from "Interfaces";
    export class Canvas implements ICanvas {
        private readonly options;
        private readonly fnUpdateCanvasHandler;
        private readonly fnUpdateCanvas2Handler;
        private fps;
        private isRunning;
        private animationTimeoutId?;
        private animationFrame?;
        private readonly cpcAreaBox;
        private customCharset;
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
        private readonly colorValues;
        private readonly currentInks;
        private readonly speedInk;
        private inkSet;
        private readonly pen2ColorMap;
        private readonly ctx;
        private readonly imageData;
        private fnCopy2Canvas;
        private littleEndian;
        private pen2Color32?;
        private data32?;
        private use32BitCopy;
        private gPen;
        private gPaper;
        private speedInkCount;
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
        private static readonly palettes;
        private static readonly defaultInks;
        private static readonly modeData;
        private applyBorderColor;
        setOnCanvasClick(onCanvasClickHandler: CanvasClickType): void;
        reset(): void;
        resetCustomChars(): void;
        private static computePalette;
        setPalette(palette: "color" | "green" | "grey"): void;
        private static isLittleEndian;
        private static extractColorValues;
        private static extractAllColorValues;
        private setColorValues;
        private setAlpha;
        private setNeedUpdate;
        private updateCanvas2;
        private updateCanvas;
        startUpdateCanvas(): void;
        stopUpdateCanvas(): void;
        private copy2Canvas8bit;
        private copy2Canvas32bit;
        private copy2Canvas32bitWithOffset;
        private getCopy2CanvasFunction;
        setScreenOffset(offset: number): void;
        private updateColorMap;
        updateColorsAndCanvasImmediately(inkList: number[]): void;
        updateSpeedInk(): void;
        setCustomChar(char: number, charData: CanvasCharType): void;
        getCharData(char: number): CanvasCharType;
        setDefaultInks(): void;
        private setFocusOnCanvas;
        private getMousePos;
        private canvasClickAction;
        onCanvasClick(event: MouseEvent): void;
        onWindowClick(_event: Event): void;
        getXpos(): number;
        getYpos(): number;
        private fillMyRect;
        fillTextBox(left: number, top: number, width: number, height: number, paper: number): void;
        private moveMyRectUp;
        private moveMyRectDown;
        private invertChar;
        private setChar;
        private readCharData;
        private setSubPixelsNormal;
        private setSubPixels;
        private static roundCoordinate;
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
        printChar(char: number, x: number, y: number, pen: number, paper: number, transparent: boolean): void;
        drawCursor(x: number, y: number, pen: number, paper: number): void;
        private findMatchingChar;
        readChar(x: number, y: number, pen: number, paper: number): number;
        private fnIsNotInWindow;
        fill(fillPen: number): void;
        private static fnPutInRange;
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
        takeScreenShot(): string;
        getCanvasElement(): HTMLElement | undefined;
    }
}
declare module "TextCanvas" {
    import { CanvasOptions, ICanvas, CanvasClickType, CanvasCharType } from "Interfaces";
    export class TextCanvas implements ICanvas {
        private readonly options;
        private readonly fnUpdateCanvasHandler;
        private readonly fnUpdateCanvas2Handler;
        private fps;
        private isRunning;
        private animationTimeoutId?;
        private animationFrame?;
        private readonly cpcAreaBox;
        private readonly textText;
        private borderWidth;
        private cols;
        private rows;
        private needUpdate;
        private readonly textBuffer;
        private hasFocus;
        private customCharset;
        constructor(options: CanvasOptions);
        private static readonly cpc2Unicode;
        private static readonly winData;
        setOnCanvasClick(onCanvasClickHandler: CanvasClickType): void;
        reset(): void;
        resetCustomChars(): void;
        setPalette(_palette: "color" | "green" | "grey"): void;
        setScreenOffset(_offset: number): void;
        updateColorsAndCanvasImmediately(_inkList: number[]): void;
        updateSpeedInk(): void;
        setCustomChar(char: number, charData: CanvasCharType): void;
        getCharData(char: number): CanvasCharType;
        setDefaultInks(): void;
        getXpos(): number;
        getYpos(): number;
        getByte(_addr: number): number | null;
        setByte(_addr: number, _byte: number): void;
        draw(_x: number, _y: number): void;
        move(_x: number, _y: number): void;
        plot(_x: number, _y: number): void;
        test(_x: number, _y: number): number;
        setInk(_pen: number, _ink1: number, _ink2: number): boolean;
        setBorder(_ink1: number, _ink2: number): void;
        setGPen(_gPen: number): void;
        setGPaper(_gPaper: number): void;
        setGTransparentMode(_transparent: boolean): void;
        printGChar(_char: number): void;
        drawCursor(_x: number, _y: number, _pen: number, _paper: number): void;
        fill(_fillPen: number): void;
        setOrigin(_xOrig: number, _yOrig: number): void;
        getXOrigin(): number;
        getYOrigin(): number;
        setGWindow(_xLeft: number, _xRight: number, _yTop: number, _yBottom: number): void;
        setGColMode(_gColMode: number): void;
        clearGraphicsWindow(): void;
        setSpeedInk(_time1: number, _time2: number): void;
        setMask(_mask: number): void;
        setMaskFirst(_maskFirst: number): void;
        getMode(): number;
        changeMode(_mode: number): void;
        getCanvasElement(): HTMLElement;
        takeScreenShot(): string;
        private resetTextBuffer;
        private setNeedUpdate;
        private updateCanvas2;
        private updateCanvas;
        startUpdateCanvas(): void;
        stopUpdateCanvas(): void;
        private updateTextWindow;
        private setFocusOnCanvas;
        private getMousePos;
        private canvasClickAction;
        onCanvasClick(event: MouseEvent): void;
        onWindowClick(_event: Event): void;
        fillTextBox(left: number, top: number, width: number, height: number, _paper?: number): void;
        private clearTextBufferBox;
        private copyTextBufferBoxUp;
        private copyTextBufferBoxDown;
        private putCharInTextBuffer;
        private getCharFromTextBuffer;
        printChar(char: number, x: number, y: number, _pen: number, _paper: number, _transparent: boolean): void;
        readChar(x: number, y: number, _pen: number, _paper: number): number;
        clearTextWindow(left: number, right: number, top: number, bottom: number, _paper: number): void;
        setMode(mode: number): void;
        clearFullWindow(): void;
        windowScrollUp(left: number, right: number, top: number, bottom: number, _paper: number): void;
        windowScrollDown(left: number, right: number, top: number, bottom: number, _paper: number): void;
    }
}
declare module "NodeAdapt" {
    export class NodeAdapt {
        static doAdapt(): void;
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
        fnSetUserAction(fnAction: ((event: Event, id: string) => void) | undefined): void;
        private onInputButtonClick;
        private onInp2ButtonClick;
        private onOutputButtonClick;
        private onResultButtonClick;
        private onVariableButtonClick;
        private onCpcButtonClick;
        private onConvertButtonClick;
        private onSettingsButtonClick;
        private onGalleryButtonClick;
        private onMoreButtonClick;
        private onKbdButtonClick;
        private onConsoleButtonClick;
        private onParseButtonClick;
        private onRenumButtonClick;
        private onPrettyButtonClick;
        private onLineNumberAddButtonClick;
        private onLineNumberRemoveButtonClick;
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
        private onGalleryItemClick;
        private static onNothing;
        private onCopyTextButtonClick;
        private onOutputTextChange;
        private static encodeUriParam;
        private onReloadButtonClick;
        private onDatabaseSelectChange;
        private onDirectorySelectChange;
        private onExampleSelectChange;
        onVarSelectChange(): void;
        onKbdLayoutSelectChange(): void;
        private onPaletteSelectChange;
        private onCanvasTypeSelectChange;
        private onVarTextChange;
        private onDebugInputChange;
        private onImplicitLinesInputChange;
        private onArrayBoundsInputChange;
        private onConsoleLogInputChange;
        private onTraceInputChange;
        private onAutorunInputChange;
        private onSoundInputChange;
        private onSpeedInputChange;
        private onScreenshotButtonClick;
        private onEnterButtonClick;
        private static onFullscreenButtonClick;
        private onCpcCanvasClick;
        private onWindowClick;
        private onTextTextClick;
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
    type AudioContextConstructorType = typeof window.AudioContext;
    interface SoundOptions {
        AudioContextConstructor: AudioContextConstructorType;
    }
    export class Sound {
        private readonly options;
        private isSoundOn;
        private isActivatedByUserFlag;
        private contextNotAvailable;
        private contextStartTime;
        private context?;
        private mergerNode?;
        private readonly gainNodes;
        private readonly oscillators;
        private readonly queues;
        private fScheduleAheadTime;
        private readonly volEnv;
        private readonly toneEnv;
        private readonly debugLogList?;
        constructor(options: SoundOptions);
        reset(): void;
        private stopOscillator;
        private debugLog;
        resetQueue(): void;
        private createSoundContext;
        private playNoise;
        private simulateApplyVolEnv;
        private applyVolEnv;
        private applyToneEnv;
        private simulateScheduleNote;
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
        soundOn(): boolean;
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
declare module "CpcVmRsx" {
    import { ICpcVm, ICpcVmRsx } from "Interfaces";
    export class CpcVmRsx {
        private readonly rsxPermanent;
        private rsxTemporary;
        callRsx(vm: ICpcVm, name: string, ...args: (string | number)[]): void;
        registerRsx(rsxModule: ICpcVmRsx, permanent: boolean): void;
        resetRsx(): void;
    }
}
declare module "CpcVm" {
    import { CustomError } from "Utils";
    import { ICpcVm, ICanvas, VariableValue, VmStopParas, ICpcVmRsx } from "Interfaces";
    import { Keyboard } from "Keyboard";
    import { Sound, SoundData } from "Sound";
    import { Variables, VariableMap, VariableTypeMap } from "Variables";
    export interface CpcVmOptions {
        canvas: ICanvas;
        keyboard: Keyboard;
        sound: Sound;
        variables: Variables;
        quiet?: boolean;
        onClickKey?: (arg0: string) => void;
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
    type LoadHandlerType = (input: string, meta: FileMeta) => boolean;
    export class CpcVm implements ICpcVm {
        private quiet;
        private readonly onClickKey?;
        private readonly fnOpeninHandler;
        private readonly fnCloseinHandler;
        private readonly fnCloseoutHandler;
        private readonly fnLoadHandler;
        private readonly fnRunHandler;
        private readonly fnOnCanvasClickHandler;
        private readonly fnInputCallbackHandler;
        private readonly fnLineInputCallbackHandler;
        private readonly fnRandomizeCallbackHandler;
        private canvas;
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
        private initialStop;
        private stopCount;
        line: string | number;
        private startLine;
        private errorGotoLine;
        private errorResumeLine;
        private breakGosubLine;
        private breakResumeLine;
        private outBuffer;
        private errorCode;
        private errorLine;
        private degFlag;
        private tronFlag1;
        private ramSelect;
        private screenPage;
        private minCharHimem;
        private maxCharHimem;
        private himemValue;
        private minCustomChar;
        private timerPriority;
        private zoneValue;
        private modeValue;
        private readonly rsx;
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
        getOptions(): CpcVmOptions;
        constructor(options: CpcVmOptions);
        vmReset(): void;
        vmResetMemory(): void;
        vmResetRandom(): void;
        vmResetTimers(): void;
        vmResetWindowData(resetPenPaper: boolean): void;
        vmResetControlBuffer(): void;
        private static vmResetFileHandling;
        vmResetInFileHandling(): void;
        vmResetOutFileHandling(): void;
        vmResetData(): void;
        private vmResetInks;
        vmReset4Run(): void;
        setCanvas(canvas: ICanvas): ICanvas;
        vmGetLoadHandler(): LoadHandlerType;
        private onCanvasClickCallback;
        vmRegisterRsx(rsxModule: ICpcVmRsx, permanent: boolean): void;
        vmGetAllVariables(): VariableMap;
        vmGetAllVarTypes(): VariableTypeMap;
        vmGetVariableByIndex(index: number): VariableValue;
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
        vmGoto(line: string | number, _msg?: string): void;
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
        vmTrace(): void;
        vmGetOutBuffer(): string;
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
        private updateColorsImmediately;
        call(addr: number, ...args: (string | number)[]): void;
        callRsx(name: string, ...args: (string | number)[]): void;
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
        "goto"(line: number): void;
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
        private static forceInRange;
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
declare module "FileHandler" {
    import { AmsdosHeader } from "DiskImage";
    export interface FileHandlerOptions {
        adaptFilename: (name: string, err: string) => string;
        updateStorageDatabase: (action: string, key: string) => void;
        outputError: (error: Error, noSelection?: boolean) => void;
    }
    export class FileHandler {
        private static readonly metaIdent;
        private adaptFilename;
        private updateStorageDatabase;
        private outputError;
        constructor(options: FileHandlerOptions);
        private static fnLocalStorageName;
        static createMinimalAmsdosHeader(type: string, start: number, length: number): AmsdosHeader;
        private static joinMeta;
        private static reRegExpIsText;
        private processZipFile;
        private processDskFile;
        fnLoad2(data: string | Uint8Array, name: string, type: string, imported: string[]): void;
    }
}
declare module "FileSelect" {
    export interface FileSelectOptions {
        fnEndOfImport: (imported: string[]) => void;
        fnLoad2: (data: string | Uint8Array, name: string, type: string, imported: string[]) => void;
    }
    export class FileSelect {
        private readonly fnOnErrorHandler;
        private readonly fnOnLoadHandler;
        private readonly fnOnFileSelectHandler;
        private fnEndOfImport;
        private fnLoad2;
        private files;
        private fileIndex;
        private imported;
        private file;
        constructor(options: FileSelectOptions);
        private fnReadNextFile;
        private fnOnLoad;
        private fnOnError;
        private fnOnFileSelect;
        addFileSelectHandler(element: HTMLElement, type: string): void;
    }
}
declare module "RsxAmsdos" {
    import { ICpcVmRsx, RsxCommandType } from "Interfaces";
    export class RsxAmsdos implements ICpcVmRsx {
        private static fnGetParameterAsString;
        private static dir;
        private static era;
        private static ren;
        private static readonly rsxCommands;
        getRsxCommands(): Record<string, RsxCommandType>;
    }
}
declare module "RsxCpcBasic" {
    import { ICpcVmRsx, RsxCommandType } from "Interfaces";
    export class RsxCpcBasic implements ICpcVmRsx {
        private static readonly rsxCommands;
        getRsxCommands(): Record<string, RsxCommandType>;
    }
}
declare module "NoCanvas" {
    import { CanvasOptions, ICanvas, CanvasClickType, CanvasCharType } from "Interfaces";
    export class NoCanvas implements ICanvas {
        constructor(_options: CanvasOptions);
        setOnCanvasClick(_onCanvasClickHandler: CanvasClickType): void;
        reset(): void;
        resetCustomChars(): void;
        setPalette(_palette: "color" | "green" | "grey"): void;
        setScreenOffset(_offset: number): void;
        updateColorsAndCanvasImmediately(_inkList: number[]): void;
        updateSpeedInk(): void;
        setCustomChar(_char: number, _charData: CanvasCharType): void;
        getCharData(_char: number): CanvasCharType;
        setDefaultInks(): void;
        onCanvasClick(_event: MouseEvent): void;
        getXpos(): number;
        getYpos(): number;
        getByte(_addr: number): number | null;
        setByte(_addr: number, _byte: number): void;
        draw(_x: number, _y: number): void;
        move(_x: number, _y: number): void;
        plot(_x: number, _y: number): void;
        test(_x: number, _y: number): number;
        setInk(_pen: number, _ink1: number, _ink2: number): boolean;
        setBorder(_ink1: number, _ink2: number): void;
        setGPen(_gPen: number): void;
        setGPaper(_gPaper: number): void;
        setGTransparentMode(_transparent: boolean): void;
        printGChar(_char: number): void;
        drawCursor(_x: number, _y: number, _pen: number, _paper: number): void;
        fill(_fillPen: number): void;
        setOrigin(_xOrig: number, _yOrig: number): void;
        getXOrigin(): number;
        getYOrigin(): number;
        setGWindow(_xLeft: number, _xRight: number, _yTop: number, _yBottom: number): void;
        setGColMode(_gColMode: number): void;
        clearGraphicsWindow(): void;
        setSpeedInk(_time1: number, _time2: number): void;
        setMask(_mask: number): void;
        setMaskFirst(_maskFirst: number): void;
        getMode(): number;
        changeMode(_mode: number): void;
        getCanvasElement(): HTMLElement | undefined;
        takeScreenShot(): string;
        startUpdateCanvas(): void;
        stopUpdateCanvas(): void;
        onWindowClick(_event: Event): void;
        fillTextBox(_left: number, _top: number, _width: number, _height: number, _paper: number): void;
        printChar(_char: number, _x: number, _y: number, _pen: number, _paper: number, _transparent: boolean): void;
        readChar(_x: number, _y: number, _pen: number, _paper: number): number;
        clearTextWindow(_left: number, _right: number, _top: number, _bottom: number, _paper: number): void;
        setMode(_mode: number): void;
        clearFullWindow(): void;
        windowScrollUp(_left: number, _right: number, _top: number, _bottom: number, _paper: number): void;
        windowScrollDown(_left: number, _right: number, _top: number, _bottom: number, _paper: number): void;
    }
}
declare module "Controller" {
    import { IController, ICanvas, VariableValue, ICpcVmRsx } from "Interfaces";
    import { Model } from "Model";
    import { View } from "View";
    export class Controller implements IController {
        private readonly fnRunLoopHandler;
        private readonly fnWaitKeyHandler;
        private readonly fnWaitInputHandler;
        private readonly fnOnEscapeHandler;
        private readonly fnDirectInputHandler;
        private readonly fnPutKeyInBufferHandler;
        private readonly fnOnDragoverHandler;
        private readonly fnOnUserActionHandler;
        private readonly fnWaitForContinueHandler;
        private readonly fnEditLineCallbackHandler;
        private static readonly metaIdent;
        private fnScript?;
        private timeoutHandlerActive;
        private nextLoopTimeOut;
        private initialLoopTimeout;
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
        private readonly canvases;
        private canvas;
        private readonly inputStack;
        private readonly keyboard;
        private virtualKeyboard?;
        private readonly sound;
        private readonly vm;
        private readonly noStop;
        private readonly savedStop;
        private fileHandler?;
        private fileSelect?;
        private hasStorageDatabase;
        private static areaDefinitions;
        constructor(model: Model, view: View);
        private initAreas;
        private initDatabases;
        private onUserAction;
        addIndex(dir: string, input: string): void;
        addItem(key: string, input: string): string;
        addRsx(key: string, RsxConstructor: new () => ICpcVmRsx): string;
        private setDatabaseSelectOptions;
        private static getPathFromExample;
        private static getNameFromExample;
        private setDirectorySelectOptions;
        setExampleSelectOptions(): void;
        setGalleryAreaInputs(): void;
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
        private static addLineNumbers;
        private splitLines;
        private mergeScripts;
        private fnGetLinesInRange;
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
        private createFnExampleLoaded;
        private createFnExampleError;
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
        private static createBasicFormatter;
        private fnRenumLines;
        private fnEditLineCallback;
        private fnEditLine;
        private fnParseBench;
        private fnParse;
        fnPretty(): void;
        fnAddLines(): void;
        fnRemoveLines(): void;
        private static fnDownloadBlob;
        private fnDownloadNewFile;
        fnDownload(): void;
        private selectJsError;
        private fnChain;
        private fnRun;
        private fnParseRun;
        private fnParseChain;
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
        private fnPutKeysInBuffer;
        startEnter(): void;
        private static generateFunction;
        private setPopoversHiddenExcept;
        toggleAreaHidden(id: string): boolean;
        changeVariable(): void;
        setPalette(palette: string): void;
        setCanvasType(canvasType: string): ICanvas;
        setSoundActive(): void;
        private fnEndOfImport;
        private static fnOnDragover;
        private adaptFilename;
        private createFileHandler;
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
        private createFnDatabaseLoaded;
        private createFnDatabaseError;
        onDatabaseSelectChange(): void;
        onDirectorySelectChange(): void;
        onExampleSelectChange(): void;
        exportAsBase64(storageName: string): string;
        onCpcCanvasClick(event: MouseEvent): void;
        onWindowClick(event: Event): void;
        fnArrayBounds(): void;
        fnImplicitLines(): void;
        fnTrace(): void;
        fnSpeed(): void;
        private readonly handlers;
    }
}
declare module "cpcconfig" {
    export const cpcconfig: {
        databaseDirs: string;
        redirectExamples: {
            "examples/art": {
                database: string;
                example: string;
            };
            "examples/blkedit": {
                database: string;
                example: string;
            };
        };
    };
}
declare module "cpcbasic" {
    import { ConfigType } from "Model";
    import { ICpcVmRsx } from "Interfaces";
    class cpcBasic {
        private static readonly config;
        private static model;
        private static view;
        private static controller;
        private static fnHereDoc;
        static addIndex(dir: string, input: string | (() => void)): void;
        static addItem(key: string, input: string | (() => void)): string;
        static addRsx(key: string, RsxConstructor: new () => ICpcVmRsx): string;
        private static fnParseArgs;
        private static fnDecodeUri;
        private static fnParseUri;
        private static fnMapObjectProperties;
        private static createDebugUtilsConsole;
        private static fnRedirectExamples;
        private static fnDoStart;
        static fnOnLoad(): void;
    }
    global {
        interface Window {
            cpcBasic: cpcBasic;
            cpcConfig: ConfigType;
        }
    }
}
//# sourceMappingURL=cpcbasicts.d.ts.map