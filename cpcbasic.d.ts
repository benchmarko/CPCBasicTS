import { Controller } from "./Controller";
import { Model } from "./Model";
import { View } from "./View";
declare class cpcBasic {
    static config: {
        bench: number;
        debug: number;
        databaseDirs: string;
        database: string;
        example: string;
        exampleIndex: string;
        input: string;
        kbdLayout: string;
        showInput: boolean;
        showInp2: boolean;
        showCpc: boolean;
        showKbd: boolean;
        showKbdLayout: boolean;
        showOutput: boolean;
        showResult: boolean;
        showText: boolean;
        showVariable: boolean;
        showConsole: boolean;
        sound: boolean;
        tron: boolean;
    };
    static model: Model;
    static view: View;
    static controller: Controller;
    static fnHereDoc(fn: () => void): string;
    static addIndex(sDir: string, input: string | (() => void)): void;
    static addItem(sKey: string, input: string | (() => void)): string;
    private static fnParseUri;
    private static setDebugUtilsConsole;
    private static fnDoStart;
    static fnOnLoad(): void;
}
declare global {
    interface Window {
        cpcBasic: cpcBasic;
    }
}
export {};
