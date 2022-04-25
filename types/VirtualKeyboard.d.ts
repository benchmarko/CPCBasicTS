import { PressReleaseCpcKey } from "./Keyboard";
interface VirtualKeyboardOptions {
    fnPressCpcKey: PressReleaseCpcKey;
    fnReleaseCpcKey: PressReleaseCpcKey;
}
export declare class VirtualKeyboard {
    private readonly fnPressCpcKey;
    private readonly fnReleaseCpcKey;
    private readonly pointerOutEvent?;
    private readonly fnVirtualKeyout?;
    private shiftLock;
    private numLock;
    constructor(options: VirtualKeyboardOptions);
    private static readonly cpcKey2Key;
    private static readonly virtualVirtualKeyboardAlpha;
    private static readonly virtualVirtualKeyboardNum;
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
    private fnGetEventTarget;
    private fnGetEventTargetAs;
    private onVirtualVirtualKeyboardKeydown;
    private fnVirtualVirtualKeyboardKeyupOrKeyout;
    private onVirtualVirtualKeyboardKeyup;
    private onVirtualVirtualKeyboardKeyout;
    private dragInit;
    private dragStart;
    private dragEnd;
    private setTranslate;
    private drag;
}
export {};
//# sourceMappingURL=VirtualKeyboard.d.ts.map