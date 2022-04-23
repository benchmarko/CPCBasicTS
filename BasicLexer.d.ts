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
export declare class BasicLexer {
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
export {};
