import { BasicLexer } from "./BasicLexer";
import { BasicParser } from "./BasicParser";
interface CodeGeneratorBasicOptions {
    lexer: BasicLexer;
    parser: BasicParser;
}
export declare class CodeGeneratorBasic {
    static mCombinedKeywords: {
        chainMerge: string;
        clearInput: string;
        graphicsPaper: string;
        graphicsPen: string;
        keyDef: string;
        lineInput: string;
        mid$Assign: string;
        onBreakCont: string;
        onBreakGosub: string;
        onBreakStop: string;
        onErrorGoto: string;
        resumeNext: string;
        speedInk: string;
        speedKey: string;
        speedWrite: string;
        symbolAfter: string;
        windowSwap: string;
    };
    lexer: BasicLexer;
    parser: BasicParser;
    constructor(options: CodeGeneratorBasicOptions);
    init(options: CodeGeneratorBasicOptions): void;
    reset(): this;
    private composeError;
    private evaluate;
    generate(sInput: string, bAllowDirect?: boolean): {
        text: string;
        error: any;
    };
}
export {};
