import { BasicLexer } from "./BasicLexer";
import { BasicParser } from "./BasicParser";
import { IOutput } from "./Interfaces";
interface BasicFormatterOptions {
    lexer: BasicLexer;
    parser: BasicParser;
}
export declare class BasicFormatter {
    lexer: BasicLexer;
    parser: BasicParser;
    iLine: number;
    constructor(options: BasicFormatterOptions);
    private composeError;
    private fnCreateLineNumbersMap;
    private fnAddSingleReference;
    private fnAddReferences;
    private fnRenumberLines;
    private static fnSortNumbers;
    private static fnApplyChanges;
    private fnRenumber;
    renumber(sInput: string, iNew: number, iOld: number, iStep: number, iKeep: number): IOutput;
}
export {};
