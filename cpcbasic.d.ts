declare class cpcBasic {
    private static config;
    private static model;
    private static view;
    private static controller;
    private static fnHereDoc;
    static addIndex(dir: string, input: string | (() => void)): void;
    static addItem(key: string, input: string | (() => void)): string;
    private static fnParseUri;
    private static createDebugUtilsConsole;
    private static fnDoStart;
    static fnOnLoad(): void;
}
declare global {
    interface Window {
        cpcBasic: cpcBasic;
    }
}
export {};
