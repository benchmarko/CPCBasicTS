import { BasicLexer } from "./BasicLexer";
import { BasicParser } from "./BasicParser";
import { IOutput } from "./Interfaces";
interface CodeGeneratorBasicOptions {
    lexer: BasicLexer;
    parser: BasicParser;
    quiet?: boolean;
}
export declare class CodeGeneratorBasic {
    private readonly lexer;
    private readonly parser;
    private quiet;
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
    private static number;
    private static expnumber;
    private static binHexNumber;
    private identifier;
    private static linenumber;
    private label;
    private vertical;
    private afterEveryGosub;
    private chainOrChainMerge;
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
    private write;
    private readonly parseFunctions;
    private fnParseOther;
    private static getLeftOrRightOperatorPrecedence;
    private parseOperator;
    private parseNode;
    private evaluate;
    generate(input: string): IOutput;
}
export {};
//# sourceMappingURL=CodeGeneratorBasic.d.ts.map