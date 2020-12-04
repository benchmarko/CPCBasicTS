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
interface VirtualButtonRowOptions {
    key: number;
    text: string;
    title: string;
    className: string;
}
export declare class Keyboard {
    options: KeyboardOptions;
    fnOnKeyDown: () => void;
    aKeyBuffer: string[];
    aExpansionTokens: string[];
    oCpcKeyExpansions: CpcKeyExpansions;
    bActive: boolean;
    oKey2CpcKey: Key2CpcKeyType;
    bCodeStringsRemoved: boolean;
    sPointerOutEvent: string;
    fnVirtualKeyout: EventListener | null;
    oPressedKeys: PressedKeysType;
    bShiftLock: boolean;
    bNumLock: boolean;
    conctructor(options: KeyboardOptions): void;
    static aCpcKey2Key: CpcKey2Key[];
    static mSpecialKeys: {
        [k in string]: string;
    };
    static aJoyKeyCodes: number[][];
    static aVirtualKeyboardAlpha: VirtualKeyboardLayoutType2[][];
    static aVirtualKeyboardNum: VirtualKeyboardLayoutType2[][];
    constructor(options: KeyboardOptions);
    init(options: KeyboardOptions): void;
    fnAttachPointerEvents(sId: string, fnDown?: EventListener, fnMove?: EventListener, fnUp?: EventListener): any;
    initKey2CpcKeyMap(): Key2CpcKeyType;
    reset(): void;
    clearInput(): void;
    resetExpansionTokens(): void;
    resetCpcKeysExpansions(): void;
    getKeyDownHandler(): () => void;
    setKeyDownHandler(fnOnKeyDown: () => void): void;
    setActive(bActive: boolean): void;
    removeCodeStringsFromKeymap(): void;
    fnPressCpcKey(iCpcKey: number, sPressedKey: string, sKey: string, bShiftKey: boolean, bCtrlKey: boolean): void;
    fnReleaseCpcKey(iCpcKey: number, sPressedKey: string, sKey: string, bShiftKey: boolean, bCtrlKey: boolean): void;
    keyIdentifier2Char(sIdentifier: string, bShiftKey: boolean): string;
    private fnKeyboardKeydown;
    private fnKeyboardKeyup;
    getKeyFromBuffer(): string;
    putKeyInBuffer(sKey: string): void;
    putKeysInBuffer(sInput: string): void;
    getKeyState(iCpcKey: number): number;
    getJoyState(iJoy: number): number;
    setExpansionToken(iToken: number, sString: string): void;
    setCpcKeyExpansion(oOptions: CpcKeyExpansionsOptions): void;
    onCpcAreaKeydown(event: KeyboardEvent): boolean;
    oncpcAreaKeyup(event: KeyboardEvent): boolean;
    mapNumLockCpcKey(iCpcKey: number): number;
    fnVirtualGetAscii(iCpcKey: number, bShiftKey: boolean, bNumLock: boolean): {
        key: string;
        text: string;
        title: string;
    };
    createButtonRow(sId: string, aOptions: VirtualButtonRowOptions[]): this;
    virtualKeyboardCreatePart(sId: string, aVirtualKeyboard: VirtualKeyboardLayoutType2[][]): void;
    virtualKeyboardCreate(): void;
    virtualKeyboardAdaptKeys(bShiftLock: boolean, bNumLock: boolean): void;
    fnVirtualGetPressedKey(iCpcKey: number): string;
    fnGetEventTarget(event: Event): EventTarget;
    onVirtualKeyboardKeydown(event: Event): boolean;
    fnVirtualKeyboardKeyupOrKeyout(event: Event): void;
    onVirtualKeyboardKeyup(event: Event): boolean;
    onVirtualKeyboardKeyout(event: Event): boolean;
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
    dragInit(sContainerId: string, sItemId: string): void;
    dragStart(event: Event): void;
    dragEnd(): void;
    setTranslate(xPos: number, yPos: number, el: HTMLElement): void;
    drag(event: Event): void;
}
export {};
