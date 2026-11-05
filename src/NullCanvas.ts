import type { CanvasCharType, ICanvasVm } from "./Interfaces";

// These empty methods intentionally provide a no-op VM canvas device.
/* eslint-disable @typescript-eslint/no-empty-function */
export class NullCanvas implements ICanvasVm {
	reset(): void {}
	resetCustomChars(): void {}
	setScreenOffset(_offset: number): void {}
	updateColorsAndCanvasImmediately(_inkList: number[]): void {}
	updateSpeedInk(): void {}
	setCustomChar(_char: number, _charData: CanvasCharType): void {}
	getCharData(_char: number): CanvasCharType { return []; }
	setDefaultInks(): void {}
	getXpos(): number { return 0; }
	getYpos(): number { return 0; }
	fillTextBox(_left: number, _top: number, _width: number, _height: number, _paper: number): void {}
	getByte(_addr: number): number | null { return 0; }
	setByte(_addr: number, _byte: number): void {}
	draw(_x: number, _y: number): void {}
	move(_x: number, _y: number): void {}
	plot(_x: number, _y: number): void {}
	test(_x: number, _y: number): number { return 0; }
	setInk(_pen: number, _ink1: number, _ink2: number): boolean { return false; }
	setBorder(_ink1: number, _ink2: number): void {}
	setGPen(_gPen: number): void {}
	setGPaper(_gPaper: number): void {}
	setGTransparentMode(_transparent: boolean): void {}
	printGChar(_char: number): void {}
	printChar(_char: number, _x: number, _y: number, _pen: number, _paper: number, _transparent: boolean): void {}
	drawCursor(_x: number, _y: number, _pen: number, _paper: number): void {}
	readChar(_x: number, _y: number, _pen: number, _paper: number): number { return 0; }
	fill(_fillPen: number): void {}
	setOrigin(_xOrig: number, _yOrig: number): void {}
	getXOrigin(): number { return 0; }
	getYOrigin(): number { return 0; }
	setGWindow(_xLeft: number, _xRight: number, _yTop: number, _yBottom: number): void {}
	setGColMode(_gColMode: number): void {}
	clearTextWindow(_left: number, _right: number, _top: number, _bottom: number, _paper: number): void {}
	clearGraphicsWindow(): void {}
	clearFullWindow(): void {}
	windowScrollUp(_left: number, _right: number, _top: number, _bottom: number, _paper: number): void {}
	windowScrollDown(_left: number, _right: number, _top: number, _bottom: number, _paper: number): void {}
	setSpeedInk(_time1: number, _time2: number): void {}
	setMask(_mask: number): void {}
	setMaskFirst(_maskFirst: number): void {}
	getMode(): number { return 0; }
	changeMode(_mode: number): void {}
	setMode(_mode: number): void {}
}
/* eslint-enable @typescript-eslint/no-empty-function */