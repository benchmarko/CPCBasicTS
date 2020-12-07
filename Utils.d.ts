export interface CustomError extends Error {
    value: any;
    pos?: number;
    line?: number | string;
    hidden?: boolean;
    shortMessage?: string;
}
export declare var Utils: {
    debug: number;
    console: Console;
    fnLoadScriptOrStyle: (script: HTMLScriptElement | HTMLLinkElement, sFullUrl: string, fnSuccess: any, fnError: any) => string;
    loadScript: (sUrl: string, fnSuccess: any, fnError: any) => void;
    loadStyle: (sUrl: string, fnSuccess: any, fnError: any) => void;
    dateFormat: (d: Date) => string;
    stringCapitalize: (str: string) => string;
    numberWithCommas: (x: number) => string;
    toRadians: (deg: number) => number;
    toDegrees: (rad: number) => number;
    getChangedParameters: (current: any, initial: any) => {};
    bSupportsBinaryLiterals: boolean;
    bSupportReservedNames: boolean;
    localStorage: any;
    atob: any;
    btoa: any;
    composeError: (name: string, oErrorObject: Error, message: string, value: any, pos?: number, line?: string | number, hidden?: boolean) => CustomError;
};
