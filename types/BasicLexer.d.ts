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
export declare class BasicLexer {
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
export {};
//# sourceMappingURL=BasicLexer.d.ts.map