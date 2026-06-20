import type { ICanvasVm, VariableValue } from "../Interfaces";
import type { ViewID } from "./UiConstants";
type CanvasClickType = (event: MouseEvent, x: number, y: number, xTxt: number, yTxt: number) => void;
export type CanvasCharType = number[];
export type CanvasCharsetType = CanvasCharType[];
export interface CanvasOptions {
    canvasID: ViewID;
    charset: CanvasCharsetType;
    palette: "color" | "green" | "grey";
    onCanvasClick?: CanvasClickType;
}
export interface ICanvas extends ICanvasVm {
    getOptions(): CanvasOptions;
    setOptions(options: Partial<CanvasOptions>): void;
    startUpdateCanvas(): void;
    stopUpdateCanvas(): void;
    onCanvasClick(event: MouseEvent): void;
    onWindowClick(_event: Event): void;
    takeScreenShot(): string;
}
export interface IController {
    startParse: () => void;
    startRenum: () => void;
    startRun: () => void;
    startParseRun: () => void;
    startBreak: () => void;
    startContinue: () => void;
    startReset: () => void;
    startScreenshot: () => string;
    startEnter: () => void;
    fnPretty: () => void;
    fnAddLines: () => void;
    fnRemoveLines: () => void;
    fnDownload: () => void;
    setInputText: (input: string, keepStack?: boolean) => void;
    setExampleSelectOptions: () => void;
    setExportSelectOptions: (id: ViewID) => void;
    setGalleryAreaInputs: () => void;
    invalidateScript: () => void;
    setSoundActive: () => void;
    setBasicVersion: (basicVersion: string) => void;
    setPalette: (palette: string) => void;
    setCanvasType: (canvasType: string) => ICanvas;
    setDisassAddr: (addr: number, endAddr?: number) => void;
    changeVariable: () => void;
    onExampleSelectChange: () => void;
    onDirectorySelectChange: () => void;
    onDatabaseSelectChange: () => void;
    onCpcCanvasClick: (event: MouseEvent) => void;
    onWindowClick: (event: Event) => void;
    startUpdateCanvas: () => void;
    stopUpdateCanvas: () => void;
    getVirtualKeyboard: () => void;
    getVariable: (par: string) => VariableValue;
    undoStackElement: () => string;
    redoStackElement: () => string;
    fnImplicitLines: () => void;
    fnIntegerOverflow: () => void;
    fnPrettyLowercaseVars: () => void;
    fnArrayBounds: () => void;
    fnTrace: () => void;
    fnSpeed: () => void;
    fnDragElementsActive: (enabled: boolean) => void;
}
export {};
//# sourceMappingURL=UiInterfaces.d.ts.map