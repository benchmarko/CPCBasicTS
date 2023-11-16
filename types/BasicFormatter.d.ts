import { BasicLexer } from "./BasicLexer";
import { BasicParser } from "./BasicParser";
import { IOutput } from "./Interfaces";
interface BasicFormatterOptions {
    lexer: BasicLexer;
    parser: BasicParser;
    implicitLines?: boolean;
}
export declare class BasicFormatter {
    private readonly options;
    private label;
    constructor(options: BasicFormatterOptions);
    getOptions(): BasicFormatterOptions;
    setOptions(options: Partial<BasicFormatterOptions>): void;
    private composeError;
    private static fnHasLabel;
    private fnCreateLabelEntry;
    private fnCreateLabelMap;
    private fnAddSingleReference;
    private fnAddReferencesForNode;
    private fnAddReferences;
    private fnRenumberLines;
    private static fnSortNumbers;
    private static fnApplyChanges;
    private fnRenumber;
    renumber(input: string, newLine: number, oldLine: number, step: number, keep: number): IOutput;
    private fnRemoveUnusedLines;
    removeUnusedLines(input: string): IOutput;
}
export {};
//# sourceMappingURL=BasicFormatter.d.ts.map