import { View } from "./View";
interface KeyboardOptions {
    view: View;
    fnOnEscapeHandler?: (key: string, pressedKey: string) => void;
    fnOnKeyDown?: () => void;
}
export interface CpcKeyExpansionsOptions {
    cpcKey: number;
    repeat: number;
    normal?: number;
    shift?: number;
    ctrl?: number;
}
export declare type PressReleaseCpcKey = (event: KeyboardEvent | PointerEvent, cpcKey: number, pressedKey: string, key: string) => void;
export declare class Keyboard {
    private readonly fnKeydownOrKeyupHandler;
    private readonly options;
    private readonly keyBuffer;
    private readonly expansionTokens;
    private readonly cpcKeyExpansions;
    private active;
    private key2CpcKey;
    private codeStringsRemoved;
    private pressedKeys;
    constructor(options: KeyboardOptions);
    getOptions(): KeyboardOptions;
    setOptions(options: Partial<KeyboardOptions>): void;
    private static readonly key2CpcKey;
    private static readonly specialKeys;
    private static readonly joyKeyCodes;
    reset(): void;
    clearInput(): void;
    resetExpansionTokens(): void;
    resetCpcKeysExpansions(): void;
    setActive(active: boolean): void;
    private removeCodeStringsFromKeymap;
    fnPressCpcKey(event: KeyboardEvent | PointerEvent, cpcKeyCode: number, pressedKey: string, key: string): void;
    fnReleaseCpcKey(event: KeyboardEvent | PointerEvent, cpcKeyCode: number, pressedKey: string, key: string): void;
    private static keyIdentifier2Char;
    private fnKeyboardKeydown;
    private fnKeyboardKeyup;
    getKeyFromBuffer(): string;
    putKeyInBuffer(key: string, triggerOnkeydown?: boolean): void;
    putKeysInBuffer(input: string): void;
    getKeyState(cpcKeyCode: number): number;
    getJoyState(joy: number): number;
    setExpansionToken(token: number, string: string): void;
    setCpcKeyExpansion(options: CpcKeyExpansionsOptions): void;
    private onKeydownOrKeyup;
}
export {};
//# sourceMappingURL=Keyboard.d.ts.map