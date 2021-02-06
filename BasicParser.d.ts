import { LexerToken } from "./BasicLexer";
interface BasicParserOptions {
    bQuiet?: boolean;
}
export interface ParserNode extends LexerToken {
    left?: ParserNode;
    right?: ParserNode;
    args?: ParserNode[];
    args2?: ParserNode[];
    len?: number;
    bSpace?: boolean;
}
declare type ParseExpressionFunction = (arg0: ParserNode) => ParserNode;
declare type ParseStatmentFunction = () => ParserNode;
interface SymbolType {
    id: string;
    nud?: ParseExpressionFunction;
    lbp?: number;
    led?: ParseExpressionFunction;
    std?: ParseStatmentFunction;
}
export declare class BasicParser {
    sLine: string;
    bQuiet: boolean;
    oSymbols: {
        [k in string]: SymbolType;
    };
    aTokens: LexerToken[];
    bAllowDirect: boolean;
    iIndex: number;
    oPreviousToken: ParserNode;
    oToken: ParserNode;
    aParseTree: ParserNode[];
    constructor(options?: BasicParserOptions);
    private static mParameterTypes;
    static mKeywords: {
        [k in string]: string;
    };
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
    private infix;
    private infixr;
    private prefix;
    private stmt;
    private static fnCreateDummyArg;
    private fnGetOptionalStream;
    private fnChangeNumber2LineNumber;
    private fnGetLineRange;
    private static fnIsSingleLetterIdentifier;
    private fnGetLetterRange;
    private fnCheckRemainingTypes;
    private fnGetArgs;
    private fnGetArgsSepByCommaSemi;
    private fnGetArgsInParenthesis;
    private static mBrackets;
    private fnGetArgsInParenthesesOrBrackets;
    private fnCreateCmdCall;
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
