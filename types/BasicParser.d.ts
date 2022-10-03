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
    private label;
    private quiet;
    private keepTokens;
    private keepBrackets;
    private keepColons;
    private keepDataComma;
    private readonly symbols;
    private tokens;
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
    private fnLastStatementIsOnErrorGotoX;
    private fnMaskedError;
    private getToken;
    private advance;
    private expression;
    private fnCheckExpressionType;
    private assignment;
    private statement;
    private statements;
    private basicLine;
    private static fnCreateDummyArg;
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
    private apostrophe;
    private rsx;
    private afterEveryGosub;
    private chain;
    private clear;
    private data;
    private def;
    private "else";
    private entOrEnv;
    private "for";
    private graphics;
    private fnCheckForUnreachableCode;
    private "if";
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
export {};
//# sourceMappingURL=BasicParser.d.ts.map