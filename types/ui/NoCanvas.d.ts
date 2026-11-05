import { NullCanvas } from "../NullCanvas";
import type { CanvasOptions, ICanvas } from "./UiInterfaces";
export declare class NoCanvas extends NullCanvas implements ICanvas {
    private readonly options;
    constructor(options: CanvasOptions);
    getOptions(): CanvasOptions;
    setOptions(options: Partial<CanvasOptions>): void;
    onCanvasClick(_event: MouseEvent): void;
    takeScreenShot(): string;
    startUpdateCanvas(): void;
    stopUpdateCanvas(): void;
    onWindowClick(_event: Event): void;
}
//# sourceMappingURL=NoCanvas.d.ts.map