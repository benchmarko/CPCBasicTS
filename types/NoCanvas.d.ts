import { CanvasOptions, ICanvas, CanvasCharType } from "./Interfaces";
export declare class NoCanvas implements ICanvas {
    private readonly options;
    constructor(options: CanvasOptions);
    getOptions(): CanvasOptions;
    setOptions(options: Partial<CanvasOptions>): void;
    reset(): void;
    resetCustomChars(): void;
    setScreenOffset(_offset: number): void;
    updateColorsAndCanvasImmediately(_inkList: number[]): void;
    updateSpeedInk(): void;
    setCustomChar(_char: number, _charData: CanvasCharType): void;
    getCharData(_char: number): CanvasCharType;
    setDefaultInks(): void;
    onCanvasClick(_event: MouseEvent): void;
    getXpos(): number;
    getYpos(): number;
    getByte(_addr: number): number | null;
    setByte(_addr: number, _byte: number): void;
    draw(_x: number, _y: number): void;
    move(_x: number, _y: number): void;
    plot(_x: number, _y: number): void;
    test(_x: number, _y: number): number;
    setInk(_pen: number, _ink1: number, _ink2: number): boolean;
    setBorder(_ink1: number, _ink2: number): void;
    setGPen(_gPen: number): void;
    setGPaper(_gPaper: number): void;
    setGTransparentMode(_transparent: boolean): void;
    printGChar(_char: number): void;
    drawCursor(_x: number, _y: number, _pen: number, _paper: number): void;
    fill(_fillPen: number): void;
    setOrigin(_xOrig: number, _yOrig: number): void;
    getXOrigin(): number;
    getYOrigin(): number;
    setGWindow(_xLeft: number, _xRight: number, _yTop: number, _yBottom: number): void;
    setGColMode(_gColMode: number): void;
    clearGraphicsWindow(): void;
    setSpeedInk(_time1: number, _time2: number): void;
    setMask(_mask: number): void;
    setMaskFirst(_maskFirst: number): void;
    getMode(): number;
    changeMode(_mode: number): void;
    takeScreenShot(): string;
    startUpdateCanvas(): void;
    stopUpdateCanvas(): void;
    onWindowClick(_event: Event): void;
    fillTextBox(_left: number, _top: number, _width: number, _height: number, _paper: number): void;
    printChar(_char: number, _x: number, _y: number, _pen: number, _paper: number, _transparent: boolean): void;
    readChar(_x: number, _y: number, _pen: number, _paper: number): number;
    clearTextWindow(_left: number, _right: number, _top: number, _bottom: number, _paper: number): void;
    setMode(_mode: number): void;
    clearFullWindow(): void;
    windowScrollUp(_left: number, _right: number, _top: number, _bottom: number, _paper: number): void;
    windowScrollDown(_left: number, _right: number, _top: number, _bottom: number, _paper: number): void;
}
//# sourceMappingURL=NoCanvas.d.ts.map