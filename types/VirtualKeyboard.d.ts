import { PressReleaseCpcKey } from "./Keyboard";
import { View } from "./View";
interface VirtualKeyboardOptions {
    view: View;
    fnPressCpcKey: PressReleaseCpcKey;
    fnReleaseCpcKey: PressReleaseCpcKey;
}
export declare class VirtualKeyboard {
    private readonly fnVirtualKeyboardKeydownHandler;
    private readonly fnVirtualKeyboardKeyupHandler;
    private readonly fnVirtualKeyboardKeyoutHandler;
    private readonly fnKeydownOrKeyupHandler;
    private readonly options;
    private readonly eventNames;
    private shiftLock;
    private numLock;
    constructor(options: VirtualKeyboardOptions);
    getOptions(): VirtualKeyboardOptions;
    setOptions(options: Partial<VirtualKeyboardOptions>): void;
    getVirtualKeydownHandler(): typeof this.fnVirtualKeyboardKeydownHandler;
    getVirtualKeyupHandler(): typeof this.fnVirtualKeyboardKeyupHandler;
    getKeydownOrKeyupHandler(): (event: Event) => boolean;
    private static readonly cpcKey2Key;
    private static readonly virtualKeyboardAlpha;
    private static readonly virtualKeyboardNum;
    reset(): void;
    private mapNumLockCpcKey;
    private fnVirtualGetAscii;
    private createButtonRow;
    private virtualKeyboardCreatePart;
    private virtualKeyboardCreate;
    private virtualKeyboardAdaptKeys;
    private fnVirtualGetPressedKey;
    private onVirtualKeyboardKeydown;
    private fnVirtualKeyboardKeyupOrKeyout;
    private onVirtualKeyboardKeyup;
    private onVirtualKeyboardKeyout;
    private static keyIdentifier2Char;
    private onKeydownOrKeyup;
}
export {};
//# sourceMappingURL=VirtualKeyboard.d.ts.map