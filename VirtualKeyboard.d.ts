import { PressReleaseCpcKey } from "./Keyboard";
interface VirtualKeyboardOptions {
    fnPressCpcKey: PressReleaseCpcKey;
    fnReleaseCpcKey: PressReleaseCpcKey;
}
export declare class VirtualKeyboard {
    private fnPressCpcKey;
    private fnReleaseCpcKey;
    private sPointerOutEvent?;
    private fnVirtualKeyout?;
    private bShiftLock;
    private bNumLock;
    private static aCpcKey2Key;
    private static aVirtualVirtualKeyboardAlpha;
    private static aVirtualVirtualKeyboardNum;
    private oDrag;
    constructor(options: VirtualKeyboardOptions);
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
