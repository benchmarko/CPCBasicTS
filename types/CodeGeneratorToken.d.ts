import { BasicLexer } from "./BasicLexer";
import { BasicParser } from "./BasicParser";
import { IOutput } from "./Interfaces";
interface CodeGeneratorTokenOptions {
    lexer: BasicLexer;
    parser: BasicParser;
    quiet?: boolean;
    implicitLines?: boolean;
}
export declare class CodeGeneratorToken {
    private readonly lexer;
    private readonly parser;
    private implicitLines;
    private quiet;
    private label;
    private statementSeparator;
    setOptions(options: Omit<CodeGeneratorTokenOptions, "lexer" | "parser">): void;
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
    private fnLabel;
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
    private write;
    private readonly parseFunctions;
    private fnParseOther;
    private parseNode;
    private evaluate;
    generate(input: string): IOutput;
}
export {};
//# sourceMappingURL=CodeGeneratorToken.d.ts.map