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
    setOptions(options: Omit<CodeGeneratorTokenOptions, "lexer" | "parser">): void;
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
    private static fnNull;
    private assign;
    private static floatToByteString;
    private static number;
    private static binnumber;
    private static hexnumber;
    private static varTypeMap;
    private identifier;
    private static linenumber;
    private fnLabel;
    private vertical;
    private fnElse;
    private fnIf;
    private onBreakContOrGosubOrStop;
    private onErrorGoto;
    private onSqGosub;
    private apostrophe;
    private readonly parseFunctions;
    private fnParseOther;
    private parseNode;
    private evaluate;
    generate(input: string): IOutput;
}
export {};
//# sourceMappingURL=CodeGeneratorToken.d.ts.map