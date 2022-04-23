import { BasicLexer } from "./BasicLexer";
import { BasicParser } from "./BasicParser";
import { IOutput } from "./Interfaces";
interface BasicFormatterOptions {
    lexer: BasicLexer;
    parser: BasicParser;
}
export declare class BasicFormatter {
    private readonly lexer;
    private readonly parser;
    private line;
    constructor(options: BasicFormatterOptions);
    private composeError;
    private fnCreateLineNumbersMap;
    private fnAddSingleReference;
    private fnAddReferences;
    private fnRenumberLines;
    private static fnSortNumbers;
    private static fnApplyChanges;
    private fnRenumber;
    renumber(input: string, newLine: number, oldLine: number, step: number, keep: number): IOutput;
}
export {};
