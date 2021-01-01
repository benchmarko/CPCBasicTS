import { BasicLexer } from "./BasicLexer";
import { BasicParser } from "./BasicParser";
import { Variables } from "./Variables";
import { CpcVmRsx } from "./CpcVmRsx";
interface CodeGeneratorJsOptions {
    lexer: BasicLexer;
    parser: BasicParser;
    rsx: CpcVmRsx;
    tron: boolean;
    bQuiet?: boolean;
    bNoCodeFrame?: boolean;
}
export declare class CodeGeneratorJs {
    lexer: BasicLexer;
    parser: BasicParser;
    tron: boolean;
    rsx: CpcVmRsx;
    bQuiet: boolean;
    bNoCodeFrame: boolean;
    iLine: number;
    reJsKeywords: RegExp;
    oStack: {
        forLabel: any[];
        forVarName: any[];
        whileLabel: any[];
    };
    aData: string[];
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
    reset(): void;
    private resetCountsPerLine;
    private composeError;
    private static createJsKeywordRegex;
    private evaluate;
    generate(sInput: string, oVariables: Variables, bAllowDirect?: boolean): {
        text: string;
        error: any;
    };
}
export {};
