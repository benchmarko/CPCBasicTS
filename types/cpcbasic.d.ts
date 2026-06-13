import { ConfigType } from "./Model";
import { ICpcVmRsx } from "./Interfaces";
export interface CpcBasicStartupAdapter {
    getConfigOverrides: () => Partial<ConfigType>;
    getUrlQuery: () => string;
    getArgs: () => string[];
    isNodeRuntime: () => boolean;
}
export declare class cpcBasic {
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
    static start(startupAdapter: CpcBasicStartupAdapter): void;
    static fnOnLoad(): void;
}
declare global {
    interface Window {
        cpcBasic: cpcBasic;
        cpcConfig: ConfigType;
    }
}
//# sourceMappingURL=cpcbasic.d.ts.map