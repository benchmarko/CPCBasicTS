export interface SelectOptionElement {
    value: string;
    text: string;
    title: string;
    selected: boolean;
}
export declare class View {
    static getElementById1(id: string): HTMLElement;
    private static getElementByIdAs;
    getHidden(id: string): boolean;
    setHidden(id: string, hidden: boolean, display?: string): this;
    setDisabled(id: string, disabled: boolean): this;
    toggleClass(id: string, className: string): void;
    getAreaValue(id: string): string;
    setAreaValue(id: string, value: string): this;
    getInputValue(id: string): string;
    setInputValue(id: string, value: string): this;
    getInputChecked(id: string): boolean;
    setSelectOptions(id: string, options: SelectOptionElement[]): this;
    getSelectValue(id: string): string;
    setSelectValue(id: string, value: string): this;
    setSelectTitleFromSelectedOption(id: string): this;
    setAreaScrollTop(id: string, scrollTop?: number): this;
    private setSelectionRange;
    setAreaSelection(id: string, pos: number, endPos: number): this;
    attachEventHandler(type: string, eventHandler: EventListenerOrEventListenerObject): this;
}
//# sourceMappingURL=View.d.ts.map