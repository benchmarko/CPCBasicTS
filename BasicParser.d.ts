import { LexerToken } from "./BasicLexer";
interface BasicParserOptions {
    bQuiet?: boolean;
    bKeepTokens?: boolean;
    bKeepBrackets?: boolean;
    bKeepColons?: boolean;
    bKeepDataComma?: boolean;
}
export interface ParserNode extends LexerToken {
    left?: ParserNode;
    right?: ParserNode;
    args?: ParserNode[];
    args2?: ParserNode[];
    len?: number;
    bSpace?: boolean;
    bParenthesis?: boolean;
}
export declare class BasicParser {
    private sLine;
    private bQuiet;
    private bKeepTokens;
    private bKeepBrackets;
    private bKeepColons;
    private bKeepDataComma;
    private oSymbols;
    private aTokens;
    private bAllowDirect;
    private iIndex;
    private oPreviousToken;
    private oToken;
    private aParseTree;
    private aStatements;
    setOptions(options: BasicParserOptions): void;
    constructor(options?: BasicParserOptions);
    private static mParameterTypes;
    static mKeywords: {
        [k in string]: string;
    };
    private mSpecialStatements;
    private static mCloseTokens;
    private composeError;
    private getToken;
    private symbol;
    private advance;
    private expression;
    private assignment;
    private statement;
    private statements;
    private line;
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
    private fnGetArgs;
    private fnGetArgsSepByCommaSemi;
    private fnGetArgsInParenthesis;
    private static mBrackets;
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
    private fnSpeed;
    private fnSymbol;
    private fnWindow;
    private fnGenerateSymbols;
    parse(aTokens: LexerToken[], bAllowDirect?: boolean): ParserNode[];
}
export {};
