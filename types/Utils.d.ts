export interface CustomError extends Error {
    value: string;
    pos: number;
    len?: number;
    line?: number | string;
    hidden?: boolean;
    shortMessage?: string;
    errCode?: number;
}
export declare class Utils {
    static debug: number;
    static console: Console;
    private static fnLoadScriptOrStyle;
    static loadScript(url: string, fnSuccess: (url2: string, key: string) => void, fnError: (url2: string, key: string) => void, key: string): void;
    static hexEscape(str: string): string;
    static hexUnescape(str: string): string;
    static dateFormat(d: Date): string;
    static stringCapitalize(str: string): string;
    static numberWithCommas(x: number | string): string;
    static toRadians(deg: number): number;
    static toDegrees(rad: number): number;
    static toPrecision9(num: number): string;
    private static testIsSupported;
    static supportsBinaryLiterals: boolean;
    static supportReservedNames: boolean;
    static stringTrimEnd(str: string): string;
    static localStorage: Storage;
    static atob: (data: string) => string;
    static btoa: (data: string) => string;
    static isCustomError(e: unknown): e is CustomError;
    static split2(str: string, char: string): string[];
    static composeError(name: string, errorObject: Error, message: string, value: string, pos?: number, len?: number, line?: string | number, hidden?: boolean): CustomError;
    static composeVmError(name: string, errorObject: Error, errCode: number, value: string): CustomError;
}
//# sourceMappingURL=Utils.d.ts.map