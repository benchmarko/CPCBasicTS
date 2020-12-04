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
    init(options: BasicFormatterOptions): void;
    reset(): void;
    composeError(...aArgs: any[]): any;
    fnRenumber(sInput: string, aParseTree: any, iNew: number, iOld: number, iStep: number, iKeep: number): string;
    renumber(sInput: string, iNew: number, iOld: number, iStep: number, iKeep: number): {
        text: string;
        error: any;
    };
}
export {};
