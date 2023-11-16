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
    private readonly options;
    private label;
    constructor(options: CodeGeneratorTokenOptions);
    getOptions(): CodeGeneratorTokenOptions;
    setOptions(options: Partial<CodeGeneratorTokenOptions>): void;
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
    private static fnEol;
    private static floatToByteString;
    private static number;
    private static binnumber;
    private static hexnumber;
    private static varTypeMap;
    private identifier;
    private static linenumber;
    private fnLabel;
    private vertical;
    private fnElseOrApostrophe;
    private elseComment;
    private onBreakContOrGosubOrStop;
    private onErrorGoto;
    private onSqGosub;
    private readonly parseFunctions;
    private fnParseOther;
    private parseNode;
    private evaluate;
    generate(input: string): IOutput;
}
export {};
//# sourceMappingURL=CodeGeneratorToken.d.ts.map