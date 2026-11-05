import type { ICanvasVm, IRuntimeController } from "../Interfaces";
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
export interface IController extends IRuntimeController {
    startScreenshot: () => string;
    startEnter: () => void;
    fnDownload: () => void;
    setExampleSelectOptions: () => void;
    setExportSelectOptions: (id: ViewID) => void;
    setGalleryAreaInputs: () => void;
    setSoundActive: () => void;
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
    undoStackElement: () => string;
    redoStackElement: () => string;
    fnDragElementsActive: (enabled: boolean) => void;
}
export {};
//# sourceMappingURL=UiInterfaces.d.ts.map