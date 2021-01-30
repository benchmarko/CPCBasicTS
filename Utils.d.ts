export interface CustomError extends Error {
    value: string;
    pos?: number;
    line?: number | string;
    hidden?: boolean;
    shortMessage?: string;
}
export declare class Utils {
    static debug: number;
    static console: Console;
    private static fnLoadScriptOrStyle;
    static loadScript(sUrl: string, fnSuccess: (sStr: string) => void, fnError: (sStr: string) => void): void;
    static loadStyle(sUrl: string, fnSuccess: (sStr: string) => void, fnError: (sStr: string) => void): void;
    static dateFormat(d: Date): string;
    static stringCapitalize(str: string): string;
    static numberWithCommas(x: number): string;
    static toRadians(deg: number): number;
    static toDegrees(rad: number): number;
    static bSupportsBinaryLiterals: boolean;
    static bSupportReservedNames: boolean;
    static stringTrimEnd(sStr: string): string;
    static localStorage: Storage;
    static atob: (arg0: string) => string;
    static btoa: (arg0: string) => string;
    static composeError(name: string, oErrorObject: Error, message: string, value: string, pos?: number, line?: string | number, hidden?: boolean): CustomError;
}
