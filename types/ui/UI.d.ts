import type { ICanvasVm, ICore, IUI } from "../Interfaces";
export declare class UI implements IUI {
    private view;
    private controller;
    private static fnDecodeUri;
    private static parseUri;
    getCanvasVm(): ICanvasVm;
    getCurrentDataKey(): string;
    onWindowLoadContinue(core: ICore): void;
}
//# sourceMappingURL=UI.d.ts.map