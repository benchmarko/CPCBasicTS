import { PressReleaseCpcKey } from "./Keyboard";
interface VirtualKeyboardOptions {
    fnPressCpcKey: PressReleaseCpcKey;
    fnReleaseCpcKey: PressReleaseCpcKey;
}
export declare class VirtualKeyboard {
    private readonly options;
    private readonly pointerOutEvent?;
    private readonly fnVirtualKeyout?;
    private shiftLock;
    private numLock;
    constructor(options: VirtualKeyboardOptions);
    private static readonly cpcKey2Key;
    private static readonly virtualKeyboardAlpha;
    private static readonly virtualKeyboardNum;
    private readonly dragInfo;
    private static readonly pointerEventNames;
    private static readonly touchEventNames;
    private static readonly mouseEventNames;
    private fnAttachPointerEvents;
    reset(): void;
    private mapNumLockCpcKey;
    private fnVirtualGetAscii;
    private createButtonRow;
    private virtualKeyboardCreatePart;
    private virtualKeyboardCreate;
    private virtualKeyboardAdaptKeys;
    private fnVirtualGetPressedKey;
    private onVirtualKeyboardKeydown;
    private fnVirtualKeyboardKeyupOrKeyout;
    private onVirtualKeyboardKeyup;
    private onVirtualKeyboardKeyout;
    private dragInit;
    private dragStart;
    private dragEnd;
    private setTranslate;
    private drag;
}
export {};
//# sourceMappingURL=VirtualKeyboard.d.ts.map