import { BasicLexer } from "./BasicLexer";
import { BasicParser } from "./BasicParser";
interface BasicFormatterOptions {
    lexer: BasicLexer;
    parser: BasicParser;
}
export declare class BasicFormatter {
    lexer: BasicLexer;
    parser: BasicParser;
    iLine: number;
    constructor(options: BasicFormatterOptions);
    reset(): void;
    private composeError;
    private fnRenumber;
    renumber(sInput: string, iNew: number, iOld: number, iStep: number, iKeep: number): {
        text: string;
        error: any;
    };
}
export {};
