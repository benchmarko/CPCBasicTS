export interface TextCanvasOptions {
    onCharClick?: (event: MouseEvent, x: number, y: number) => void;
}
export declare class TextCanvas {
    private readonly options;
    private readonly fnUpdateTextCanvasHandler;
    private readonly fnUpdateTextCanvas2Handler;
    private fps;
    private animationTimeoutId?;
    private animationFrame?;
    private readonly textText;
    private needTextUpdate;
    private readonly textBuffer;
    private hasFocus;
    constructor(options: TextCanvasOptions);
    private static readonly cpc2Unicode;
    setOnCharClick(onCharClickHandler: (event: MouseEvent, x: number, y: number) => void): void;
    reset(): void;
    private resetTextBuffer;
    private setNeedTextUpdate;
    private updateTextCanvas2;
    private updateTextCanvas;
    startUpdateCanvas(): void;
    stopUpdateCanvas(): void;
    private updateTextWindow;
    private setFocusOnCanvas;
    private getMousePos;
    private canvasClickAction;
    onTextCanvasClick(event: MouseEvent): void;
    onWindowClick(_event: Event): void;
    fillTextBox(left: number, top: number, width: number, height: number, _pen?: number): void;
    private clearTextBufferBox;
    private copyTextBufferBoxUp;
    private copyTextBufferBoxDown;
    private putCharInTextBuffer;
    private getCharFromTextBuffer;
    printChar(char: number, x: number, y: number, _pen: number, _paper: number, _transparent: boolean): void;
    readChar(x: number, y: number, _pen?: number, _paper?: number): number;
    clearTextWindow(left: number, right: number, top: number, bottom: number, _paper: number): void;
    clearFullWindow(): void;
    windowScrollUp(left: number, right: number, top: number, bottom: number, _pen: number): void;
    windowScrollDown(left: number, right: number, top: number, bottom: number, _pen: number): void;
}
//# sourceMappingURL=TextCanvas.d.ts.map