import { ViewID } from "./Constants";
import { View } from "./View";
declare type DragElementOptionEntryType = {
    itemId: ViewID;
    xOffset: number;
    yOffset: number;
    enabled: boolean;
};
export declare type DragElementOptions = {
    view: View;
    entries: Record<string, DragElementOptionEntryType>;
};
export declare class DragElement {
    private readonly fnDragStartHandler;
    private readonly fnDragMoveHandler;
    private readonly fnDragEndHandler;
    private readonly options;
    private containerId;
    private initialX;
    private initialY;
    private currentX;
    private currentY;
    private dragInfo?;
    private dragItem?;
    constructor(options: DragElementOptions);
    getOptions(): DragElementOptions;
    setOptions(options: Partial<DragElementOptions>): void;
    private dragStart;
    private static setDragTranslate;
    private dragMove;
    private dragEnd;
}
export {};
//# sourceMappingURL=DragElement.d.ts.map