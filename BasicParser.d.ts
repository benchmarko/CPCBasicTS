import { LexerToken } from "./BasicLexer";
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
export declare class BasicParser {
    private line;
    private quiet;
    private keepTokens;
    private keepBrackets;
    private keepColons;
    private keepDataComma;
    private symbols;
    private tokens;
    private allowDirect;
    private index;
    private previousToken;
    private token;
    private parseTree;
    private statementList;
    setOptions(options: BasicParserOptions): void;
    constructor(options?: BasicParserOptions);
    private static parameterTypes;
    static keywords: {
        [k in string]: string;
    };
    private specialStatements;
    private static closeTokens;
    private composeError;
    private getToken;
    private symbol;
    private advance;
    private expression;
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
    private fnSpeed;
    private fnSymbol;
    private fnWindow;
    private fnGenerateSymbols;
    parse(tokens: LexerToken[], allowDirect?: boolean): ParserNode[];
}
export {};