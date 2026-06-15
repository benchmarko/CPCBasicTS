import type { CustomError } from "./Interfaces";
export declare class Utils {
    static debug: number;
    static console: Console;
    static setDebug(debug: number): void;
    static hexEscape(str: string): string;
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
    static isCustomError(e: unknown): e is CustomError;
    static split2(str: string, char: string): string[];
    static string2Uint8Array(data: string): Uint8Array;
    static uint8Array2string(data: Uint8Array): string;
    static composeError(name: string, errorObject: Error, message: string, value: string, pos?: number, len?: number, line?: string | number, hidden?: boolean): CustomError;
    static composeVmError(name: string, errorObject: Error, errCode: number, value: string): CustomError;
}
//# sourceMappingURL=Utils.d.ts.map