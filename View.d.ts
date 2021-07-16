export interface SelectOptionElement {
    value: string;
    text: string;
    title: string;
    selected: boolean;
}
export declare class View {
    static getElementById1(sId: string): HTMLElement;
    getHidden(sId: string): boolean;
    setHidden(sId: string, bHidden: boolean, sDisplay?: string): this;
    setDisabled(sId: string, bDisabled: boolean): this;
    toggleClass(sId: string, sClassName: string): void;
    getAreaValue(sId: string): string;
    setAreaValue(sId: string, sValue: string): this;
    getInputValue(sId: string): string;
    setInputValue(sId: string, sValue: string): this;
    getInputChecked(sId: string): boolean;
    setSelectOptions(sId: string, aOptions: SelectOptionElement[]): this;
    getSelectValue(sId: string): string;
    setSelectValue(sId: string, sValue: string): this;
    setSelectTitleFromSelectedOption(sId: string): this;
    setAreaScrollTop(sId: string, iScrollTop?: number): this;
    private setSelectionRange;
    setAreaSelection(sId: string, iPos: number, iEndPos: number): this;
    attachEventHandler(sType: string, eventHandler: EventListenerOrEventListenerObject): this;
}
