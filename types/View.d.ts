import { ViewID } from "./Constants";
export interface SelectOptionElement {
    value: string;
    text: string;
    title: string;
    selected: boolean;
}
export interface AreaInputElement {
    value: string;
    title: string;
    checked: boolean;
    imgUrl: string;
}
export declare type PointerEventNamesType = Record<"down" | "move" | "up" | "cancel" | "out" | "type", string>;
export declare class View {
    static getElementById1(id: ViewID): HTMLElement;
    static getElementByIdAs<T extends HTMLButtonElement | HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | HTMLElement>(id: ViewID): T;
    getHidden(id: ViewID): boolean;
    setHidden(id: ViewID, hidden: boolean, display?: string): this;
    setDisabled(id: ViewID, disabled: boolean): this;
    toggleClass(id: ViewID, className: string): void;
    getAreaValue(id: ViewID): string;
    setAreaValue(id: ViewID, value: string): this;
    getInputValue(id: ViewID): string;
    setInputValue(id: ViewID, value: string): this;
    getInputChecked(id: ViewID): boolean;
    setInputChecked(id: ViewID, checked: boolean): this;
    setAreaInputList(id: ViewID, inputs: AreaInputElement[]): this;
    setSelectOptions(id: ViewID, options: SelectOptionElement[]): this;
    getSelectOptions(id: ViewID): SelectOptionElement[];
    getSelectValue(id: ViewID): string;
    setSelectValue(id: ViewID, value: string): this;
    setSelectTitleFromSelectedOption(id: ViewID): this;
    setAreaScrollTop(id: ViewID, scrollTop?: number): this;
    private setSelectionRange;
    setAreaSelection(id: ViewID, pos: number, endPos: number): this;
    addEventListener(type: string, eventListener: EventListenerOrEventListenerObject, id?: ViewID): this;
    removeEventListener(type: string, eventListener: EventListenerOrEventListenerObject, id?: ViewID): this;
    static getEventTarget<T extends HTMLElement>(event: Event): T;
    static requestFullscreenForId(id: ViewID): boolean;
    static fnDownloadBlob(data: string, filename: string): void;
    private static readonly pointerEventNames;
    private static readonly touchEventNames;
    private static readonly mouseEventNames;
    fnAttachPointerEvents(id: ViewID, fnDown?: EventListener, fnMove?: EventListener, fnUp?: EventListener): PointerEventNamesType;
    private readonly dragInfo;
    dragInit(containerId: ViewID, itemId: ViewID): void;
    private dragStart;
    private dragEnd;
    private setDragTranslate;
    private drag;
}
//# sourceMappingURL=View.d.ts.map