export interface CpcKeyExpansionsOptions {
    cpcKey: number;
    repeat: number;
    normal?: number;
    shift?: number;
    ctrl?: number;
}
export declare type PressReleaseCpcKey = (cpcKey: number, pressedKey: string, key: string, shiftKey: boolean, ctrlKey: boolean) => void;
interface KeyboardOptions {
    fnOnEscapeHandler?: (key: string, pressedKey: string) => void;
    fnOnKeyDown?: () => void;
}
export declare class Keyboard {
    private options;
    private fnOnKeyDown?;
    private keyBuffer;
    private expansionTokens;
    private cpcKeyExpansions;
    private active;
    private key2CpcKey;
    private codeStringsRemoved;
    private pressedKeys;
    constructor(options: KeyboardOptions);
    private static key2CpcKey;
    private static specialKeys;
    private static joyKeyCodes;
    reset(): void;
    clearInput(): void;
    resetExpansionTokens(): void;
    resetCpcKeysExpansions(): void;
    getKeyDownHandler(): (() => void) | undefined;
    setKeyDownHandler(fnOnKeyDown?: () => void): void;
    setActive(active: boolean): void;
    private removeCodeStringsFromKeymap;
    fnPressCpcKey(cpcKeyCode: number, pressedKey: string, key: string, shiftKey: boolean, ctrlKey: boolean): void;
    fnReleaseCpcKey(cpcKeyCode: number, pressedKey: string, key: string, shiftKey: boolean, ctrlKey: boolean): void;
    private static keyIdentifier2Char;
    private fnKeyboardKeydown;
    private fnKeyboardKeyup;
    getKeyFromBuffer(): string;
    putKeyInBuffer(key: string): void;
    putKeysInBuffer(input: string): void;
    getKeyState(cpcKeyCode: number): number;
    getJoyState(joy: number): number;
    setExpansionToken(token: number, string: string): void;
    setCpcKeyExpansion(options: CpcKeyExpansionsOptions): void;
    private onCpcAreaKeydown;
    private oncpcAreaKeyup;
}
export {};