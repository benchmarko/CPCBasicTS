type LegacyElement = Element & {
    attachEvent?: (type: string, listener: (event: Event) => void | boolean) => void;
    detachEvent?: (type: string, listener: (event: Event) => void | boolean) => void;
    currentStyle?: Record<string, string | undefined>;
};
interface LegacyTextRange {
    duplicate(): LegacyTextRange;
    moveToElementTxt?: (element: HTMLTextAreaElement) => void;
    setEndPoint(type: string, range: LegacyTextRange): void;
    text: string;
}
type LegacyDocument = Document & {
    attachEvent?: (type: string, listener: (event: Event) => void | boolean) => void;
    detachEvent?: (type: string, listener: (event: Event) => void | boolean) => void;
    selection?: {
        createRange(): LegacyTextRange;
    };
    __proto__?: Partial<Document>;
};
type LegacyWindow = Window & {
    webkitAudioContext?: typeof AudioContext;
    mozAudioContext?: typeof AudioContext;
    mozRequestAnimationFrame?: typeof window.requestAnimationFrame;
    webkitRequestAnimationFrame?: typeof window.requestAnimationFrame;
    msRequestAnimationFrame?: typeof window.requestAnimationFrame;
    mozCancelAnimationFrame?: typeof window.cancelAnimationFrame;
    webkitCancelAnimationFrame?: typeof window.cancelAnimationFrame;
    msCancelAnimationFrame?: typeof window.cancelAnimationFrame;
};
type LegacyJson = {
    parse(text: string): unknown;
    stringify(value: object): string;
};
type LegacyUint8ArrayConstructor = {
    new (arrayBuffer: ArrayBuffer): ArrayBuffer;
    BYTES_PER_ELEMENT: number;
    prototype: {
        copyWithin?: typeof Array.prototype.copyWithin;
    };
};
type PolyfillConsole = Pick<Console, "log" | "info" | "warn" | "error" | "debug"> & {
    cpcBasicLog: string;
};
type LegacyComputedStyleHost = Window & {
    getPropertyValue?: (property: string) => string | null;
};
type LegacyComputedStyleWindow = {
    getComputedStyle?: (this: LegacyComputedStyleHost, element: Element, pseudo?: string) => LegacyComputedStyleHost;
};
type LegacyCurrentStyleElement = Element & {
    currentStyle?: Record<string, string | undefined>;
};
declare var Polyfills: {
    list: string[];
    getList: () => string[];
    log: (part: string) => void;
    console: Console | PolyfillConsole;
    localStorage: Storage;
    isDefinePropertyOk: boolean;
    atob: (((data: string) => string) & typeof atob) | undefined;
    btoa: (((data: string) => string) & typeof btoa) | undefined;
};
//# sourceMappingURL=Polyfills.d.ts.map