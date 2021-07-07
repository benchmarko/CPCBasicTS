interface BasicLexerOptions {
    bQuiet?: boolean;
    bKeepWhiteSpace?: boolean;
}
export interface LexerToken {
    type: string;
    value: string;
    pos: number;
    orig?: string;
    ws?: string;
}
export declare class BasicLexer {
    private bQuiet;
    private bKeepWhiteSpace;
    private sLine;
    private bTakeNumberAsLine;
    private sInput;
    private iIndex;
    private aTokens;
    private sWhiteSpace;
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
    private addToken;
    private static hexEscape;
    private fnParseNumber;
    private fnParseCompleteLineForRem;
    private fnParseCompleteLineForData;
    private fnTryContinueString;
    lex(sInput: string): LexerToken[];
}
export {};
