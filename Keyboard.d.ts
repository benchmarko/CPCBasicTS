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
interface CpcKeyExpansions {
    normal: KeyExpansionsType;
    shift: KeyExpansionsType;
    ctrl: KeyExpansionsType;
    repeat: KeyExpansionsRepeatType;
}
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
    private static oKey2CpcKey;
    private static mSpecialKeys;
    private static aJoyKeyCodes;
    constructor(options: KeyboardOptions);
    reset(): void;
    clearInput(): void;
    resetExpansionTokens(): void;
    resetCpcKeysExpansions(): void;
    getKeyDownHandler(): (() => void) | undefined;
    setKeyDownHandler(fnOnKeyDown?: () => void): void;
    setActive(bActive: boolean): void;
    private removeCodeStringsFromKeymap;
    fnPressCpcKey(iCpcKey: number, sPressedKey: string, sKey: string, bShiftKey: boolean, bCtrlKey: boolean): void;
    fnReleaseCpcKey(iCpcKey: number, sPressedKey: string, sKey: string, bShiftKey: boolean, bCtrlKey: boolean): void;
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
}
export {};
