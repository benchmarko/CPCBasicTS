import { BasicLexer } from "./BasicLexer";
import { BasicParser } from "./BasicParser";
import { IOutput } from "./Interfaces";
interface CodeGeneratorBasicOptions {
    lexer: BasicLexer;
    parser: BasicParser;
    quiet?: boolean;
}
export declare class CodeGeneratorBasic {
    private readonly options;
    private keywords;
    private hasColons;
    private keepWhiteSpace;
    private line;
    setOptions(options: Partial<CodeGeneratorBasicOptions>): void;
    getOptions(): CodeGeneratorBasicOptions;
    constructor(options: CodeGeneratorBasicOptions);
    private static readonly combinedKeywords;
    private static readonly operators;
    private static readonly operatorPrecedence;
    private composeError;
    private static fnWs;
    private static fnSpace1;
    private static getUcKeyword;
    private fnParseArgs;
    private combineArgsWithColon;
    private fnParenthesisOpen;
    private static string;
    private static ustring;
    private assign;
    private static expnumber;
    private static binHexNumber;
    private label;
    private vertical;
    private afterEveryGosub;
    private chainOrChainMerge;
    private data;
    private def;
    private elseComment;
    private fn;
    private fnFor;
    private fnElse;
    private fnIf;
    private inputLineInput;
    private list;
    private mid$Assign;
    private onBreakOrError;
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