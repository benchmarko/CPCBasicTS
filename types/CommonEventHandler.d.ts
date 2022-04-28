import { IController } from "./Interfaces";
import { Model } from "./Model";
import { View } from "./View";
export declare class CommonEventHandler implements EventListenerObject {
    private readonly model;
    private readonly view;
    private readonly controller;
    private fnUserAction;
    constructor(model: Model, view: View, controller: IController);
    private toogleHidden;
    fnSetUserAction(fnAction: ((event: Event, id: string) => void) | undefined): void;
    private onSpecialButtonClick;
    private onInputButtonClick;
    private onInp2ButtonClick;
    private onOutputButtonClick;
    private onResultButtonClick;
    private onTextButtonClick;
    private onVariableButtonClick;
    private onCpcButtonClick;
    private onConvertButtonClick;
    private onKbdButtonClick;
    private onKbdLayoutButtonClick;
    private onConsoleButtonClick;
    private onParseButtonClick;
    private onRenumButtonClick;
    private onPrettyButtonClick;
    private fnUpdateAreaText;
    private onUndoButtonClick;
    private onRedoButtonClick;
    private onDownloadButtonClick;
    private onRunButtonClick;
    private onStopButtonClick;
    private onContinueButtonClick;
    private onResetButtonClick;
    private onParseRunButtonClick;
    private static onHelpButtonClick;
    private static onNothing;
    private onOutputTextChange;
    private static encodeUriParam;
    private onReloadButtonClick;
    onDatabaseSelectChange(): void;
    onExampleSelectChange(): void;
    onVarSelectChange(): void;
    onKbdLayoutSelectChange(): void;
    private onVarTextChange;
    private onScreenshotButtonClick;
    private onEnterButtonClick;
    private onSoundButtonClick;
    onCpcCanvasClick(event: Event): void;
    onWindowClick(event: Event): void;
    private readonly handlers;
    handleEvent(event: Event): void;
}
//# sourceMappingURL=CommonEventHandler.d.ts.map