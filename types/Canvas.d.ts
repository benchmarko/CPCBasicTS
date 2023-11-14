import { CanvasOptions, ICanvas, CanvasCharType } from "./Interfaces";
export declare class Canvas implements ICanvas {
    private readonly options;
    private readonly fnUpdateCanvasHandler;
    private readonly fnUpdateCanvas2Handler;
    private fps;
    private isRunning;
    private animationTimeoutId?;
    private animationFrame?;
    private readonly cpcAreaBox;
    private customCharset;
    private gColMode;
    private mask;
    private maskBit;
    private maskFirst;
    private offset;
    private readonly canvas;
    private width;
    private height;
    private borderWidth;
    private readonly dataset8;
    private needUpdate;
    private readonly colorValues;
    private readonly currentInks;
    private readonly speedInk;
    private inkSet;
    private readonly pen2ColorMap;
    private readonly ctx;
    private readonly imageData;
    private fnCopy2Canvas;
    private littleEndian;
    private pen2Color32?;
    private data32?;
    private use32BitCopy;
    private gPen;
    private gPaper;
    private speedInkCount;
    private hasFocus;
    private mode;
    private modeData;
    private xPos;
    private yPos;
    private xOrig;
    private yOrig;
    private xLeft;
    private xRight;
    private yTop;
    private yBottom;
    private gTransparent;
    constructor(options: CanvasOptions);
    getOptions(): CanvasOptions;
    setOptions(options: Partial<CanvasOptions>): void;
    private static readonly palettes;
    private static readonly defaultInks;
    private static readonly modeData;
    private applyBorderColor;
    reset(): void;
    resetCustomChars(): void;
    private static computePalette;
    private applyPalette;
    private static isLittleEndian;
    private static extractColorValues;
    private static extractAllColorValues;
    private setColorValues;
    private setAlpha;
    private setNeedUpdate;
    private updateCanvas2;
    private updateCanvas;
    startUpdateCanvas(): void;
    stopUpdateCanvas(): void;
    private copy2Canvas8bit;
    private copy2Canvas32bit;
    private copy2Canvas32bitWithOffset;
    private getCopy2CanvasFunction;
    setScreenOffset(offset: number): void;
    private updateColorMap;
    updateColorsAndCanvasImmediately(inkList: number[]): void;
    updateSpeedInk(): void;
    setCustomChar(char: number, charData: CanvasCharType): void;
    getCharData(char: number): CanvasCharType;
    setDefaultInks(): void;
    private setFocusOnCanvas;
    private getMousePos;
    private canvasClickAction;
    onCanvasClick(event: MouseEvent): void;
    onWindowClick(_event: Event): void;
    getXpos(): number;
    getYpos(): number;
    private fillMyRect;
    fillTextBox(left: number, top: number, width: number, height: number, paper: number): void;
    private moveMyRectUp;
    private moveMyRectDown;
    private invertChar;
    private setChar;
    private readCharData;
    private setSubPixelsNormal;
    private setSubPixels;
    private static roundCoordinate;
    private setPixel;
    private setPixelOriginIncluded;
    private testSubPixel;
    private testPixel;
    getByte(addr: number): number | null;
    setByte(addr: number, byte: number): void;
    private drawBresenhamLine;
    draw(x: number, y: number): void;
    move(x: number, y: number): void;
    plot(x: number, y: number): void;
    test(x: number, y: number): number;
    setInk(pen: number, ink1: number, ink2: number): boolean;
    setBorder(ink1: number, ink2: number): void;
    setGPen(gPen: number): void;
    setGPaper(gPaper: number): void;
    setGTransparentMode(transparent: boolean): void;
    printGChar(char: number): void;
    printChar(char: number, x: number, y: number, pen: number, paper: number, transparent: boolean): void;
    drawCursor(x: number, y: number, pen: number, paper: number): void;
    private findMatchingChar;
    readChar(x: number, y: number, pen: number, paper: number): number;
    private fnIsNotInWindow;
    fill(fillPen: number): void;
    private static fnPutInRange;
    setOrigin(xOrig: number, yOrig: number): void;
    getXOrigin(): number;
    getYOrigin(): number;
    setGWindow(xLeft: number, xRight: number, yTop: number, yBottom: number): void;
    setGColMode(gColMode: number): void;
    clearTextWindow(left: number, right: number, top: number, bottom: number, paper: number): void;
    clearGraphicsWindow(): void;
    clearFullWindow(): void;
    windowScrollUp(left: number, right: number, top: number, bottom: number, paper: number): void;
    windowScrollDown(left: number, right: number, top: number, bottom: number, paper: number): void;
    setSpeedInk(time1: number, time2: number): void;
    setMask(mask: number): void;
    setMaskFirst(maskFirst: number): void;
    getMode(): number;
    changeMode(mode: number): void;
    setMode(mode: number): void;
    takeScreenShot(): string;
}
//# sourceMappingURL=Canvas.d.ts.map