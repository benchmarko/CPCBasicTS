import { IController } from "./Interfaces";
import { Model } from "./Model";
import { View } from "./View";
interface CommonEventHandlerOptions {
    model: Model;
    view: View;
    controller: IController;
}
export declare class CommonEventHandler implements EventListenerObject {
    private readonly options;
    private readonly model;
    private readonly view;
    private readonly controller;
    private readonly eventDefInternalMap;
    private fnUserAction;
    constructor(options: CommonEventHandlerOptions);
    getOptions(): CommonEventHandlerOptions;
    private setOptions;
    fnSetUserAction(fnAction: ((event: Event, id: string) => void) | undefined): void;
    private onGalleryButtonClick;
    private fnUpdateAreaText;
    private onUndoButtonClick;
    private onRedoButtonClick;
    private onContinueButtonClick;
    private onParseRunButtonClick;
    private static onHelpButtonClick;
    private onGalleryItemClick;
    private onCopyTextButtonClick;
    private static encodeUriParam;
    private onReloadButtonClick;
    onVarSelectChange(): void;
    onKbdLayoutSelectChange(): void;
    private onBasicVersionSelectChange;
    private onPaletteSelectChange;
    private onCanvasTypeSelectChange;
    private onDebugInputChange;
    private onImplicitLinesInputChange;
    private onArrayBoundsInputChange;
    private onShowCpcInputChange;
    private onShowKbdInputChange;
    private onDisassInputChange;
    private onTraceInputChange;
    private onAutorunInputChange;
    private onSoundInputChange;
    private onSpeedInputChange;
    private onScreenshotButtonClick;
    private onClearInputButtonClick;
    private static onFullscreenButtonClick;
    private createEventDefMap;
    handleEvent(event: Event): void;
}
export {};
//# sourceMappingURL=CommonEventHandler.d.ts.map