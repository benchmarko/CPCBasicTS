import type { IOutput } from "./Interfaces";
import { BasicLexer } from "./BasicLexer";
import { BasicParser } from "./BasicParser";
interface BasicFormatterOptions {
    lexer: BasicLexer;
    parser: BasicParser;
    implicitLines?: boolean;
}
export declare class BasicFormatter {
    static parseLineNumber(line: string): number;
    static addLineNumbers(input: string): string;
    static splitLines(input: string, implicitLines?: boolean): string[] | undefined;
    static mergeLines(lines1: readonly string[], lines2: readonly string[]): string;
    static getLinesInRange(sourceLines: readonly string[], firstLine: number, lastLine: number): string[];
    static getLinesInRangeFromScript(script: string, firstLine: number, lastLine: number, implicitLines?: boolean, onInvalid?: () => void): string[];
    static mergeScripts(script1: string, script2: string, implicitLines?: boolean, onInvalid?: () => void): string;
    static formatListing(lines: readonly string[], stream: number): string[];
    static createDeleteScript(lines: readonly string[]): string | undefined;
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
    private prepareParser;
    renumber(input: string, newLine: number, oldLine: number, step: number, keep: number): IOutput;
    private fnRemoveUnusedLines;
    removeUnusedLines(input: string): IOutput;
}
export {};
//# sourceMappingURL=BasicFormatter.d.ts.map