export interface CpcKeyExpansionsOptions {
    cpcKey: number;
    repeat: number;
    normal?: number;
    shift?: number;
    ctrl?: number;
}
export declare type PressReleaseCpcKey = (event: KeyboardEvent | PointerEvent, cpcKey: number, pressedKey: string, key: string) => void;
interface KeyboardOptions {
    fnOnEscapeHandler?: (key: string, pressedKey: string) => void;
    fnOnKeyDown?: () => void;
}
export declare class Keyboard {
    private readonly fnCpcAreaKeydownHandler;
    private readonly fnCpcAreaKeyupHandler;
    private readonly options;
    private readonly keyBuffer;
    private readonly expansionTokens;
    private readonly cpcKeyExpansions;
    private active;
    private key2CpcKey;
    private codeStringsRemoved;
    private pressedKeys;
    constructor(options: KeyboardOptions);
    private static readonly key2CpcKey;
    private static readonly specialKeys;
    private static readonly joyKeyCodes;
    reset(): void;
    clearInput(): void;
    resetExpansionTokens(): void;
    resetCpcKeysExpansions(): void;
    getKeyDownHandler(): (() => void) | undefined;
    setKeyDownHandler(fnOnKeyDown?: () => void): void;
    setActive(active: boolean): void;
    private removeCodeStringsFromKeymap;
    fnPressCpcKey(event: KeyboardEvent | PointerEvent, cpcKeyCode: number, pressedKey: string, key: string): void;
    fnReleaseCpcKey(event: KeyboardEvent | PointerEvent, cpcKeyCode: number, pressedKey: string, key: string): void;
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
//# sourceMappingURL=Keyboard.d.ts.map