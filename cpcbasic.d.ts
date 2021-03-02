import { Controller } from "./Controller";
import { Model, ConfigType } from "./Model";
import { View } from "./View";
declare class cpcBasic {
    static config: ConfigType;
    static model: Model;
    static view: View;
    static controller: Controller;
    static fnHereDoc(fn: () => void): string;
    static addIndex(sDir: string, input: string | (() => void)): void;
    static addItem(sKey: string, input: string | (() => void)): string;
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
