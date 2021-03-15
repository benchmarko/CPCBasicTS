export interface CpcKeyExpansionsOptions {
    iCpcKey: number;
    iRepeat: number;
    iNormal?: number;
    iShift?: number;
    iCtrl?: number;
}
export declare type PressReleaseCpcKey = (iCpcKey: number, sPressedKey: string, sKey: string, bShiftKey: boolean, bCtrlKey: boolean) => void;
interface KeyboardOptions {
    fnOnEscapeHandler?: (sKey: string, sPressedKey: string) => void;
    fnOnKeyDown?: () => void;
}
export declare class Keyboard {
    private options;
    private fnOnKeyDown?;
    private aKeyBuffer;
    private aExpansionTokens;
    private oCpcKeyExpansions;
    private bActive;
    private oKey2CpcKey;
    private bCodeStringsRemoved;
    private oPressedKeys;
    constructor(options: KeyboardOptions);
    private static mKey2CpcKey;
    private static mSpecialKeys;
    private static aJoyKeyCodes;
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
