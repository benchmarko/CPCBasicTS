import type { CustomError, LoadScriptFn } from "../Interfaces";
export declare class UiUtils {
    static debug: number;
    static console: Console;
    static setDebug(debug: number): void;
    private static fnLoadScriptOrStyle;
    static readonly loadScript: LoadScriptFn;
    static stringCapitalize(str: string): string;
    static stringTrimEnd(str: string): string;
    static string2Uint8Array(data: string): Uint8Array;
    static isCustomError(e: unknown): e is CustomError;
    static uint8Array2string(data: Uint8Array): string;
    static composeError(name: string, errorObject: Error, message: string, value: string, pos?: number, len?: number, line?: string | number, hidden?: boolean): CustomError;
}
//# sourceMappingURL=UiUtils.d.ts.map