interface VirtualKeyboardOptions {
    fnPressCpcKey: (iCpcKey: number, sPressedKey: string, sKey: string, bShiftKey: boolean, bCtrlKey: boolean) => void;
    fnReleaseCpcKey: (iCpcKey: number, sPressedKey: string, sKey: string, bShiftKey: boolean, bCtrlKey: boolean) => void;
}
interface CpcKey2Key {
    keys: string;
    key: string;
    keyShift?: string;
    text?: string;
    title?: string;
    style?: number;
    numLockCpcKey?: number;
    keyNumLock?: string;
    textNumLock?: string;
    titleNumLock?: string;
    textShift?: string;
    titleShift?: string;
}
declare type VirtualVirtualKeyboardLayoutType1 = {
    key: number;
    style?: number;
};
declare type VirtualVirtualKeyboardLayoutType2 = (number | VirtualVirtualKeyboardLayoutType1);
export declare class VirtualKeyboard {
    fnPressCpcKey: any;
    fnReleaseCpcKey: any;
    fnOnKeyDown?: () => void;
    bActive: boolean;
    sPointerOutEvent?: string;
    fnVirtualKeyout?: EventListener;
    bShiftLock: boolean;
    bNumLock: boolean;
    static aCpcKey2Key: CpcKey2Key[];
    static aVirtualVirtualKeyboardAlpha: VirtualVirtualKeyboardLayoutType2[][];
    static aVirtualVirtualKeyboardNum: VirtualVirtualKeyboardLayoutType2[][];
    constructor(options: VirtualKeyboardOptions);
    private fnAttachPointerEvents;
    reset(): void;
    private mapNumLockCpcKey;
    private fnVirtualGetAscii;
    private createButtonRow;
    private virtualKeyboardCreatePart;
    virtualKeyboardCreate(): void;
    private virtualKeyboardAdaptKeys;
    private fnVirtualGetPressedKey;
    private fnGetEventTarget;
    private onVirtualVirtualKeyboardKeydown;
    private fnVirtualVirtualKeyboardKeyupOrKeyout;
    private onVirtualVirtualKeyboardKeyup;
    private onVirtualVirtualKeyboardKeyout;
    oDrag: {
        dragItem: HTMLElement;
        active: boolean;
        xOffset: number;
        yOffset: number;
        initialX: number;
        initialY: number;
        currentX: number;
        currentY: number;
    };
    private dragInit;
    private dragStart;
    private dragEnd;
    private setTranslate;
    private drag;
}
export {};
