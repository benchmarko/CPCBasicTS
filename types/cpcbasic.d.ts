import { ConfigType } from "./Model";
import { ICpcVmRsx } from "./Interfaces";
declare class cpcBasic {
    private static readonly config;
    private static model;
    private static view;
    private static controller;
    private static fnHereDoc;
    static addIndex(dir: string, input: Record<string, unknown> | (() => void)): void;
    static addItem(key: string, input: string | (() => void)): string;
    static addRsx(key: string, RsxConstructor: new () => ICpcVmRsx): string;
    private static fnParseArgs;
    private static fnDecodeUri;
    private static fnParseUri;
    private static fnMapObjectProperties;
    private static createDebugUtilsConsole;
    private static fnRedirectExamples;
    private static fnDoStart;
    static fnOnLoad(): void;
}
declare global {
    interface Window {
        cpcBasic: cpcBasic;
        cpcConfig: ConfigType;
    }
}
export {};
//# sourceMappingURL=cpcbasic.d.ts.map