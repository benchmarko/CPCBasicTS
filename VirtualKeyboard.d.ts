import { PressReleaseCpcKey } from "./Keyboard";
interface VirtualKeyboardOptions {
    fnPressCpcKey: PressReleaseCpcKey;
    fnReleaseCpcKey: PressReleaseCpcKey;
}
export declare class VirtualKeyboard {
    private fnPressCpcKey;
    private fnReleaseCpcKey;
    private pointerOutEvent?;
    private fnVirtualKeyout?;
    private shiftLock;
    private numLock;
    constructor(options: VirtualKeyboardOptions);
    private static cpcKey2Key;
    private static virtualVirtualKeyboardAlpha;
    private static virtualVirtualKeyboardNum;
    private dragInfo;
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
