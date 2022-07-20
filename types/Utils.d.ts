export interface CustomError extends Error {
    value: string;
    pos: number;
    len?: number;
    line?: number | string;
    hidden?: boolean;
    shortMessage?: string;
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
    private static testIsSupported;
    static supportsBinaryLiterals: boolean;
    static supportReservedNames: boolean;
    static stringTrimEnd(str: string): string;
    static localStorage: Storage;
    static atob: (arg0: string) => string;
    static btoa: (arg0: string) => string;
    static isCustomError(e: unknown): e is CustomError;
    static split2(str: string, char: string): string[];
    static composeError(name: string, errorObject: Error, message: string, value: string, pos?: number, len?: number, line?: string | number, hidden?: boolean): CustomError;
}
//# sourceMappingURL=Utils.d.ts.map