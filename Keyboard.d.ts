export interface CpcKeyExpansionsOptions {
    iCpcKey: number;
    iRepeat: number;
    iNormal?: number;
    iShift?: number;
    iCtrl?: number;
}
interface KeyboardOptions {
    fnOnEscapeHandler?: (sKey: string, sPressedKey: string) => void;
    fnOnKeyDown?: () => void;
}
declare type KeyExpansionsType = {
    [k in string]: number;
};
declare type KeyExpansionsRepeatType = {
    [k in string]: number;
};
declare type Key2CpcKeyType = {
    [k in string]: number;
};
declare type PressedBrowseKeysType = {
    [k in string]: boolean;
};
declare type PressedKeysType = {
    [k in string]: {
        oKeys: PressedBrowseKeysType;
        shift: boolean;
        ctrl: boolean;
    };
};
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
interface CpcKeyExpansions {
    normal: KeyExpansionsType;
    shift: KeyExpansionsType;
    ctrl: KeyExpansionsType;
    repeat: KeyExpansionsRepeatType;
}
declare type VirtualKeyboardLayoutType1 = {
    key: number;
    style?: number;
};
declare type VirtualKeyboardLayoutType2 = (number | VirtualKeyboardLayoutType1);
export declare class Keyboard {
    options: KeyboardOptions;
    fnOnKeyDown?: () => void;
    aKeyBuffer: string[];
    aExpansionTokens: string[];
    oCpcKeyExpansions: CpcKeyExpansions;
    bActive: boolean;
    oKey2CpcKey: Key2CpcKeyType;
    bCodeStringsRemoved: boolean;
    sPointerOutEvent?: string;
    fnVirtualKeyout?: EventListener;
    oPressedKeys: PressedKeysType;
    bShiftLock: boolean;
    bNumLock: boolean;
    static aCpcKey2Key: CpcKey2Key[];
    static mSpecialKeys: {
        [k in string]: string;
    };
    static aJoyKeyCodes: number[][];
    static aVirtualKeyboardAlpha: VirtualKeyboardLayoutType2[][];
    static aVirtualKeyboardNum: VirtualKeyboardLayoutType2[][];
    constructor(options: KeyboardOptions);
    private fnAttachPointerEvents;
    private initKey2CpcKeyMap;
    reset(): void;
    clearInput(): void;
    resetExpansionTokens(): void;
    resetCpcKeysExpansions(): void;
    getKeyDownHandler(): (() => void) | undefined;
    setKeyDownHandler(fnOnKeyDown?: () => void): void;
    setActive(bActive: boolean): void;
    private removeCodeStringsFromKeymap;
    private fnPressCpcKey;
    private fnReleaseCpcKey;
    private static keyIdentifier2Char;
    private fnKeyboardKeydown;
    private fnKeyboardKeyup;
    getKeyFromBuffer(): string;
    putKeyInBuffer(sKey: string): void;
    putKeysInBuffer(sInput: string): void;
    getKeyState(iCpcKey: number): number;
    getJoyState(iJoy: number): number;
    setExpansionToken(iToken: number, sString: string): void;
    setCpcKeyExpansion(oOptions: CpcKeyExpansionsOptions): void;
    private onCpcAreaKeydown;
    private oncpcAreaKeyup;
    private mapNumLockCpcKey;
    private fnVirtualGetAscii;
    private createButtonRow;
    private virtualKeyboardCreatePart;
    virtualKeyboardCreate(): void;
    private virtualKeyboardAdaptKeys;
    private fnVirtualGetPressedKey;
    private fnGetEventTarget;
    private onVirtualKeyboardKeydown;
    private fnVirtualKeyboardKeyupOrKeyout;
    private onVirtualKeyboardKeyup;
    private onVirtualKeyboardKeyout;
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
