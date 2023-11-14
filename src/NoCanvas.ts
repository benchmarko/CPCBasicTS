// NoCanvas.ts - No Canvas
// (c) Marco Vieth, 2023
// https://benchmarko.github.io/CPCBasicTS/
//

import { CanvasOptions, ICanvas, CanvasCharType } from "./Interfaces";


export class NoCanvas implements ICanvas {
	private readonly options: CanvasOptions;

	constructor(options: CanvasOptions) {
		this.options = options;
		this.reset();
	}

	getOptions(): CanvasOptions {
		return this.options;
	}

	setOptions(options: Partial<CanvasOptions>): void {
		Object.assign(this.options, options);
	}

	reset(): void { // eslint-disable-line class-methods-use-this
	}

	resetCustomChars(): void { // eslint-disable-line class-methods-use-this
	}

	setScreenOffset(_offset: number): void { // eslint-disable-line class-methods-use-this
	}

	updateColorsAndCanvasImmediately(_inkList: number[]): void { // eslint-disable-line class-methods-use-this
	}

	updateSpeedInk(): void { // eslint-disable-line class-methods-use-this
	}

	setCustomChar(_char: number, _charData: CanvasCharType): void { // eslint-disable-line class-methods-use-this
	}

	getCharData(_char: number): CanvasCharType { // eslint-disable-line class-methods-use-this
		return [];
	}

	setDefaultInks(): void { // eslint-disable-line class-methods-use-this
	}

	onCanvasClick(_event: MouseEvent): void { // eslint-disable-line class-methods-use-this
	}

	getXpos(): number { // eslint-disable-line class-methods-use-this
		return 0;
	}

	getYpos(): number { // eslint-disable-line class-methods-use-this
		return 0;
	}

	getByte(_addr: number): number | null { // eslint-disable-line class-methods-use-this
		return 0;
	}

	setByte(_addr: number, _byte: number): void { // eslint-disable-line class-methods-use-this
	}

	draw(_x: number, _y: number): void { // eslint-disable-line class-methods-use-this
	}

	move(_x: number, _y: number): void { // eslint-disable-line class-methods-use-this
	}

	plot(_x: number, _y: number): void { // eslint-disable-line class-methods-use-this
	}

	test(_x: number, _y: number): number { // eslint-disable-line class-methods-use-this
		return 0;
	}

	setInk(_pen: number, _ink1: number, _ink2: number): boolean { // eslint-disable-line class-methods-use-this
		return false;
	}

	setBorder(_ink1: number, _ink2: number): void { // eslint-disable-line class-methods-use-this
	}

	setGPen(_gPen: number): void { // eslint-disable-line class-methods-use-this
	}

	setGPaper(_gPaper: number): void { // eslint-disable-line class-methods-use-this
	}

	setGTransparentMode(_transparent: boolean): void { // eslint-disable-line class-methods-use-this
	}

	printGChar(_char: number): void { // eslint-disable-line class-methods-use-this
	}

	drawCursor(_x: number, _y: number, _pen: number, _paper: number): void { // eslint-disable-line class-methods-use-this
	}

	fill(_fillPen: number): void { // eslint-disable-line class-methods-use-this
	}

	setOrigin(_xOrig: number, _yOrig: number): void { // eslint-disable-line class-methods-use-this
	}

	getXOrigin(): number { // eslint-disable-line class-methods-use-this
		return 0;
	}

	getYOrigin(): number { // eslint-disable-line class-methods-use-this
		return 0;
	}

	setGWindow(_xLeft: number, _xRight: number, _yTop: number, _yBottom: number): void { // eslint-disable-line class-methods-use-this
	}

	setGColMode(_gColMode: number): void { // eslint-disable-line class-methods-use-this
	}

	clearGraphicsWindow(): void { // eslint-disable-line class-methods-use-this
	}

	setSpeedInk(_time1: number, _time2: number): void { // eslint-disable-line class-methods-use-this
	}

	setMask(_mask: number): void { // eslint-disable-line class-methods-use-this
	}

	setMaskFirst(_maskFirst: number): void { // eslint-disable-line class-methods-use-this
	}

	getMode(): number { // eslint-disable-line class-methods-use-this
		return 0;
	}

	changeMode(_mode: number): void { // eslint-disable-line class-methods-use-this
	}

	/*
	getCanvasID(): ViewID { // eslint-disable-line class-methods-use-this
		return ViewID.noCanvas;
	}
	*/

	takeScreenShot(): string { // eslint-disable-line class-methods-use-this
		return "";
	}

	startUpdateCanvas(): void { // eslint-disable-line class-methods-use-this
	}

	stopUpdateCanvas(): void { // eslint-disable-line class-methods-use-this
	}

	onWindowClick(_event: Event): void { // eslint-disable-line class-methods-use-this
	}

	fillTextBox(_left: number, _top: number, _width: number, _height: number, _paper: number): void { // eslint-disable-line class-methods-use-this
	}

	printChar(_char: number, _x: number, _y: number, _pen: number, _paper: number, _transparent: boolean): void { // eslint-disable-line class-methods-use-this
	}

	readChar(_x: number, _y: number, _pen: number, _paper: number): number { // eslint-disable-line class-methods-use-this
		return 0;
	}

	clearTextWindow(_left: number, _right: number, _top: number, _bottom: number, _paper: number): void { // eslint-disable-line class-methods-use-this
	}

	setMode(_mode: number): void { // eslint-disable-line class-methods-use-this
	}

	clearFullWindow(): void { // eslint-disable-line class-methods-use-this
	}

	windowScrollUp(_left: number, _right: number, _top: number, _bottom: number, _paper: number): void { // eslint-disable-line class-methods-use-this
	}

	windowScrollDown(_left: number, _right: number, _top: number, _bottom: number, _paper: number): void { // eslint-disable-line class-methods-use-this
	}
}
