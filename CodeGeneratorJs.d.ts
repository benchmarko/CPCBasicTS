import { BasicLexer } from "./BasicLexer";
import { BasicParser } from "./BasicParser";
import { CpcVmRsx } from "./CpcVmRsx";
interface CodeGeneratorJsOptions {
    lexer: BasicLexer;
    parser: BasicParser;
    rsx: undefined;
    tron: boolean;
    bQuiet?: boolean;
}
export declare class CodeGeneratorJs {
    lexer: BasicLexer;
    parser: BasicParser;
    tron: boolean;
    rsx: CpcVmRsx;
    bQuiet: boolean;
    iLine: number;
    reJsKeywords: RegExp;
    oStack: {
        forLabel: any[];
        forVarName: any[];
        whileLabel: any[];
    };
    aData: any[];
    oLabels: {};
    bMergeFound: boolean;
    iGosubCount: number;
    iIfCount: number;
    iStopCount: number;
    iForCount: number;
    iWhileCount: number;
    static aJsKeywords: string[];
    constructor(options: CodeGeneratorJsOptions);
    init(options: CodeGeneratorJsOptions): void;
    reset(): this;
    resetCountsPerLine(): void;
    composeError(...aArgs: any[]): any;
    createJsKeywordRegex(): RegExp;
    evaluate(parseTree: any, oVariables: any): string;
    generate(sInput: any, oVariables: any, bAllowDirect: any): {
        text: string;
        error: any;
    };
}
export {};
