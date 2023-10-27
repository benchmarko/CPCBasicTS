// Interfaces.ts - Interfaces
// (c) Marco Vieth, 2020
// https://benchmarko.github.io/CPCBasicTS/
//
//

import { CustomError } from "./Utils";

export interface IOutput {
    text: string
    error?: CustomError
}

export type CanvasClickType = (event: MouseEvent, x: number, y: number, xTxt: number, yTxt: number) => void;
export type CanvasCharType = number[]; // 8 bytes char bitmap
export type CanvasCharsetType = CanvasCharType[];

export interface CanvasOptions {
	charset: CanvasCharsetType
	palette: "color" | "green" | "grey"
	onCanvasClick?: CanvasClickType
}

export interface ICanvas {
    setOnCanvasClick(onCanvasClickHandler: CanvasClickType): void
    reset(): void
    resetCustomChars(): void
    setPalette(palette: "color" | "green" | "grey"): void
    startUpdateCanvas(): void
    stopUpdateCanvas(): void
    setScreenOffset(offset: number): void
    updateColorsAndCanvasImmediately(inkList: number[]): void
    updateSpeedInk(): void
    setCustomChar(char: number, charData: CanvasCharType): void
    getCharData(char: number): CanvasCharType
    setDefaultInks(): void
    onCanvasClick(event: MouseEvent): void
    onWindowClick(_event: Event): void
    getXpos(): number
    getYpos(): number
    fillTextBox(left: number, top: number, width: number, height: number, paper: number): void
    getByte(addr: number): number | null
    setByte(addr: number, byte: number): void
    draw(x: number, y: number): void
    move(x: number, y: number): void
    plot(x: number, y: number): void
    test(x: number, y: number): number
    setInk(pen: number, ink1: number, ink2: number): boolean
    setBorder(ink1: number, ink2: number): void
    setGPen(gPen: number): void
    setGPaper(gPaper: number): void
    setGTransparentMode(transparent: boolean): void
    printGChar(char: number): void
    printChar(char: number, x: number, y: number, pen: number, paper: number, transparent: boolean): void
    drawCursor(x: number, y: number, pen: number, paper: number): void
    readChar(x: number, y: number, pen: number, paper: number): number
    fill(fillPen: number): void
    setOrigin(xOrig: number, yOrig: number): void
    getXOrigin(): number
    getYOrigin(): number
    setGWindow(xLeft: number, xRight: number, yTop: number, yBottom: number): void
    setGColMode(gColMode: number): void
    clearTextWindow(left: number, right: number, top: number, bottom: number, paper: number): void
    clearGraphicsWindow(): void
    clearFullWindow(): void
    windowScrollUp(left: number, right: number, top: number, bottom: number, paper: number): void
    windowScrollDown(left: number, right: number, top: number, bottom: number, paper: number): void
    setSpeedInk(time1: number, time2: number): void
    setMask(mask: number): void
    setMaskFirst(maskFirst: number): void
    getMode(): number
    changeMode(mode: number): void
    setMode(mode: number): void
    takeScreenShot(): string
    getCanvasElement(): HTMLElement | undefined
}

export interface VmBaseParas {
	command: string
	stream: number
	line: string | number
}

export interface VmLineParas extends VmBaseParas { // delete lines, list lines, edit line, run line
	first?: number // (req)
	last?: number // (req)
}

export interface VmLineRenumParas extends VmBaseParas { // renum lines
	newLine?: number // (req)
	oldLine?: number // (req)
	step?: number // (req)
	keep?: number // (req)
}

export interface VmFileParas extends VmBaseParas {
	fileMask?: string // (req) CAT, |DIR, |ERA
	newName?: string // |REN
	oldName?: string // |REN
}

export interface VmInputParas extends VmBaseParas {
	input: string // (req)
	message: string // (req)
	noCRLF?: string
	types?: string[]
	fnInputCallback: () => boolean
}

export type VmStopParas = VmFileParas | VmInputParas | VmLineParas | VmLineRenumParas

// Same as VariableValue in Variables.ts
export type VariableValue = string | number | Function | [] | VariableValue[]; // eslint-disable-line @typescript-eslint/ban-types

export interface ICpcVm {
    line: string | number
    vmComposeError(error: Error, err: number, errInfo: string): CustomError
    vmStop(reason: string, priority: number, force?: boolean, paras?: VmStopParas): void
    vmInRangeRound(n: number | undefined, min: number, max: number, err: string): number
    vmAdaptFilename(name: string, err: string): string
    vmGetVariableByIndex(index: number): VariableValue
    vmChangeMode(mode: number): void
    renum(newLine: number, oldLine: number, step: number, keep: number): void
    vmNotImplemented(name: string): void
}


export type RsxCommandType = (this: ICpcVm, ...args: (string|number)[]) => void

export interface ICpcVmRsx {
    getRsxCommands: () => Record<string, RsxCommandType>
}

export interface IController {
    toggleAreaHidden: (id: string) => boolean,
    startParse: () => void
    startRenum: () => void

    startRun: () => void
    startParseRun: () => void
    startBreak: () => void
    startContinue: () => void
    startReset: () => void
    startScreenshot: () => string
    startEnter: () => void

    fnPretty: () => void
    fnAddLines: () => void
    fnRemoveLines: () => void

    fnDownload: () => void
    setInputText: (input: string, keepStack?: boolean) => void
    setExampleSelectOptions: () => void
    setGalleryAreaInputs: () => void
    invalidateScript: () => void
    setSoundActive: () => void
    setBasicVersion: (basicVersion: string) => void
    setPalette: (palette: string) => void
    setCanvasType: (canvasType: string) => ICanvas

    changeVariable: () => void
    onExampleSelectChange: () => void
    onDirectorySelectChange: () => void
    onDatabaseSelectChange: () => void

    onCpcCanvasClick: (event: MouseEvent) => void
    onWindowClick: (event: Event) => void

    startUpdateCanvas: () => void
    stopUpdateCanvas: () => void
    virtualKeyboardCreate: () => void
    getVariable: (par: string) => VariableValue
    // see VariableValue in Variables.ts

    undoStackElement: () => string
    redoStackElement: () => string

    fnImplicitLines: () => void
    fnArrayBounds: () => void
    fnTrace: () => void
    fnSpeed: () => void
 }

//
