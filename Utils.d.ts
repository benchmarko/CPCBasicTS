export declare var Utils: {
    debug: number;
    console: Console;
    fnLoadScriptOrStyle: (script: any, sFullUrl: any, fnSuccess: any, fnError: any) => any;
    loadScript: (sUrl: any, fnSuccess: any, fnError: any) => void;
    loadStyle: (sUrl: any, fnSuccess: any, fnError: any) => void;
    dateFormat: (d: any) => string;
    stringCapitalize: (str: any) => any;
    numberWithCommas: (x: any) => string;
    toRadians: (deg: any) => number;
    toDegrees: (rad: any) => number;
    getChangedParameters: (current: any, initial: any) => {};
    bSupportsBinaryLiterals: boolean;
    bSupportReservedNames: boolean;
    localStorage: any;
    atob: any;
    btoa: any;
    composeError: (name: any, oError: any, message: any, value: any, pos: any, line: any, hidden: any) => any;
};
