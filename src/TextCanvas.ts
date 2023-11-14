// TextCanvas.ts - Text "Canvas"
// (c) Marco Vieth, 2022
// https://benchmarko.github.io/CPCBasicTS/
//

import { ViewID } from "./Constants";
import { View } from "./View";
import { CanvasOptions, ICanvas, CanvasCharType } from "./Interfaces";

export class TextCanvas implements ICanvas {
	private readonly options: CanvasOptions;
	private readonly fnUpdateCanvasHandler: () => void;
	private readonly fnUpdateCanvas2Handler: () => void;

	private fps = 15; // FPS for canvas update
	private isRunning = false;
	private animationTimeoutId?: number;
	private animationFrame?: number;

	private readonly cpcAreaBox: HTMLElement;
	private readonly textText: HTMLTextAreaElement;

	private borderWidth = 1;
	private cols;
	private rows;

	private needUpdate = false;
	private readonly textBuffer: number[][] = []; // textbuffer characters at row,column

	private hasFocus = false; // canvas has focus

	private customCharset: Record<number, CanvasCharType> = {};

	constructor(options: CanvasOptions) {
		this.options = options;

		this.textText = View.getElementByIdAs<HTMLTextAreaElement>(this.options.canvasID);
		this.cpcAreaBox = View.getElementById1(ViewID.cpcArea);

		this.fnUpdateCanvasHandler = this.updateCanvas.bind(this);
		this.fnUpdateCanvas2Handler = this.updateCanvas2.bind(this);

		this.cols = parseFloat(this.textText.getAttribute("cols") || "0");
		this.rows = parseFloat(this.textText.getAttribute("rows") || "0");

		this.animationTimeoutId = undefined;
		this.animationFrame = undefined;

		this.reset();
	}

	getOptions(): CanvasOptions {
		return this.options;
	}

	setOptions(options: Partial<CanvasOptions>): void {
		Object.assign(this.options, options);
	}

	// CPC Unicode map for text mode (https://www.unicode.org/L2/L2019/19025-terminals-prop.pdf AMSCPC.TXT) incomplete; wider chars replaed by "."
	// tooWide = [132,134,135,136,137,139,141,142,224,225,226,227,245];
	// For equal height we set line-height: 15px;
	private static readonly cpc2Unicode = "................................ !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]\u2195_`abcdefghijklmnopqrstuvwxyz{|}~\u2591\u00A0\u2598\u259D\u2580.\u258C....\u2590.\u2584..\u2588\u00B7\u2575\u2576\u2514\u2577\u2502\u250C\u251C\u2574\u2518\u2500\u2534\u2510\u2524\u252C\u253C^\u00B4\u00A8\u00A3\u00A9\u00B6\u00A7\u2018\u00BC\u00BD\u00BE\u00B1\u00F7\u00AC\u00BF\u00A1\u03B1\u03B2\u03B3\u03B4\u03B5\u03B8\u03BB\u03BC\u03C0\u03C3\u03C6\u03C8\u03C7\u03C9\u03A3\u03A9\u1FBA0\u1FBA1\u1FBA3\u1FBA2\u1FBA7\u1FBA5\u1FBA6\u1FBA4\u1FBA8\u1FBA9\u1FBAE\u2573\u2571\u2572\u1FB95\u2592\u23BA\u23B9\u23BD\u23B8....\u1FB8E\u1FB8D\u1FB8F\u1FB8C\u1FB9C\u1FB9D\u1FB9E\u1FB9F\u263A.\u2663\u2666\u2665\u2660\u25CB\u25CF\u25A1\u25A0\u2642\u2640";

	// same as in CpcVm
	private static readonly winData = [ // window data for mode mode 0,1,2,3 (we are counting from 0 here)
		{
			left: 0,
			right: 19,
			top: 0,
			bottom: 24
		},
		{
			left: 0,
			right: 39,
			top: 0,
			bottom: 24
		},
		{
			left: 0,
			right: 79,
			top: 0,
			bottom: 24
		},
		{
			left: 0, // mode 3 not available on CPC
			right: 79,
			top: 0,
			bottom: 49
		}
	];

	reset(): void {
		this.resetTextBuffer();
		this.setNeedUpdate();
	}

	resetCustomChars(): void { // eslint-disable-line class-methods-use-this
	}

	setScreenOffset(_offset: number): void { // eslint-disable-line class-methods-use-this
	}

	updateColorsAndCanvasImmediately(_inkList: number[]): void { // eslint-disable-line class-methods-use-this
	}

	updateSpeedInk(): void { // eslint-disable-line class-methods-use-this
	}

	setCustomChar(char: number, charData: CanvasCharType): void { // eslint-disable-line class-methods-use-this
		this.customCharset[char] = charData;
	}

	getCharData(char: number): CanvasCharType { // eslint-disable-line class-methods-use-this
		return this.customCharset[char] || this.options.charset[char];
	}

	setDefaultInks(): void { // eslint-disable-line class-methods-use-this
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
		return ViewID.textText;
	}
	*/

	takeScreenShot(): string { // eslint-disable-line class-methods-use-this
		return "";
	}


	private resetTextBuffer() {
		this.textBuffer.length = 0;
	}

	private setNeedUpdate() {
		this.needUpdate = true;
	}

	private updateCanvas2() {
		if (!this.isRunning) {
			return; // ignore remaining timeouts, if stopped
		}
		this.animationFrame = requestAnimationFrame(this.fnUpdateCanvasHandler);
		if (this.textText.offsetParent) { // text area visible?
			if (this.needUpdate) {
				this.needUpdate = false;
				this.updateTextWindow();
			}
		}
	}

	private updateCanvas() {
		this.animationTimeoutId = window.setTimeout(this.fnUpdateCanvas2Handler, 1000 / this.fps); // ts (node)
	}

	startUpdateCanvas(): void {
		if (!this.isRunning && this.textText.offsetParent !== null) { // animation off and canvas visible in DOM? (with noteJS it is currently undefined)
			this.isRunning = true;
			this.updateCanvas();
		}
	}

	stopUpdateCanvas(): void {
		if (this.isRunning) {
			this.isRunning = false;
			if (this.animationFrame) {
				cancelAnimationFrame(this.animationFrame);
				this.animationFrame = undefined;
			}
			clearTimeout(this.animationTimeoutId);
			this.animationTimeoutId = undefined;
		}
	}

	private updateTextWindow() {
		const textBuffer = this.textBuffer,
			cpc2Unicode = TextCanvas.cpc2Unicode;
		let out = "";

		for (let y = 0; y < textBuffer.length; y += 1) {
			const textBufferRow = textBuffer[y];

			if (textBufferRow) {
				for (let x = 0; x < textBufferRow.length; x += 1) {
					out += cpc2Unicode[textBufferRow[x] || 32];
				}
			}
			out += "\n";
		}
		this.textText.value = out;
	}

	private setFocusOnCanvas() {
		this.cpcAreaBox.style.background = "#463c3c";
		if (this.textText) {
			this.textText.focus();
		}
		this.hasFocus = true;
	}

	private getMousePos(event: MouseEvent, canvasWidth: number, canvasHeight: number) { // eslint-disable-line class-methods-use-this
		const rect = this.textText.getBoundingClientRect(),
			pos = {
				x: (event.clientX - this.borderWidth - rect.left) / (rect.right - rect.left - this.borderWidth * 2) * canvasWidth,
				y: (event.clientY - this.borderWidth - rect.top) / (rect.bottom - rect.top - this.borderWidth * 2) * canvasHeight
			};

		return pos;
	}

	private canvasClickAction(event: MouseEvent) {
		const canvasWidth = 640,
			canvasHeight = 400,
			pos = this.getMousePos(event, canvasWidth, canvasHeight),
			/* eslint-disable no-bitwise */
			x = pos.x | 0, // force integer
			y = pos.y | 0;
			/* eslint-enable no-bitwise */

		if (this.options.onCanvasClick) {
			const charWidth = canvasWidth / this.cols,
				charHeight = canvasHeight / this.rows,
				/* eslint-disable no-bitwise */
				xTxt = (x / charWidth) | 0,
				yTxt = (y / charHeight) | 0;
				/* eslint-enable no-bitwise */

			this.options.onCanvasClick(event, x, y, xTxt, yTxt);
		}
	}

	onCanvasClick(event: MouseEvent): void {
		if (!this.hasFocus) {
			this.setFocusOnCanvas();
		} else {
			this.canvasClickAction(event);
		}
		event.stopPropagation();
	}

	onWindowClick(_event: Event): void {
		if (this.hasFocus) {
			this.hasFocus = false;
			this.cpcAreaBox.style.background = "";
		}
	}

	fillTextBox(left: number, top: number, width: number, height: number, _paper?: number): void {
		this.clearTextBufferBox(left, top, width, height);
	}

	private clearTextBufferBox(left: number, top: number, width: number, height: number) {
		const textBuffer = this.textBuffer;

		for (let y = top; y < top + height; y += 1) {
			const textBufferRow = textBuffer[y];

			if (textBufferRow) {
				for (let x = left; x < left + width; x += 1) {
					delete textBufferRow[x];
				}
			}
		}
		this.setNeedUpdate();
	}

	private copyTextBufferBoxUp(left: number, top: number, width: number, height: number, left2: number, top2: number) {
		const textBuffer = this.textBuffer;

		for (let y = 0; y < height; y += 1) {
			const sourceRow = textBuffer[top + y];
			let destinationRow = textBuffer[top2 + y];

			if (sourceRow) {
				// could be optimized, if complete rows
				if (!destinationRow) {
					destinationRow = [];
					textBuffer[top2 + y] = destinationRow;
				}
				for (let x = 0; x < width; x += 1) {
					destinationRow[left2 + x] = sourceRow[left + x];
				}
			} else if (destinationRow) {
				delete textBuffer[top2 + y]; // no sourceRow => clear destinationRow
			}
		}
		this.setNeedUpdate();
	}

	private copyTextBufferBoxDown(left: number, top: number, width: number, height: number, left2: number, top2: number) {
		const textBuffer = this.textBuffer;

		for (let y = height - 1; y >= 0; y -= 1) {
			const sourceRow = textBuffer[top + y];
			let destinationRow = textBuffer[top2 + y];

			if (sourceRow) {
				if (!destinationRow) {
					destinationRow = [];
					textBuffer[top2 + y] = destinationRow;
				}
				for (let x = 0; x < width; x += 1) {
					destinationRow[left2 + x] = sourceRow[left + x];
				}
			} else if (destinationRow) {
				delete textBuffer[top2 + y]; // no sourceRow => clear destinationRow
			}
		}
		this.setNeedUpdate();
	}

	private putCharInTextBuffer(char: number, x: number, y: number) {
		const textBuffer = this.textBuffer;

		if (!textBuffer[y]) {
			textBuffer[y] = [];
		}
		this.textBuffer[y][x] = char;
		this.setNeedUpdate();
	}

	private getCharFromTextBuffer(x: number, y: number) {
		const textBuffer = this.textBuffer;

		let char: number | undefined;

		if (textBuffer[y]) {
			char = this.textBuffer[y][x]; // can be undefined, if not set
		}
		return char;
	}

	printChar(char: number, x: number, y: number, _pen: number, _paper: number, _transparent: boolean): void {
		this.putCharInTextBuffer(char, x, y);
	}

	readChar(x: number, y: number, _pen: number, _paper: number): number {
		let char = this.getCharFromTextBuffer(x, y);

		if (char === undefined) {
			char = -1; // not detected
		}

		return char;
	}

	clearTextWindow(left: number, right: number, top: number, bottom: number, _paper: number): void { // clear current text window
		const width = right + 1 - left,
			height = bottom + 1 - top;

		this.fillTextBox(left, top, width, height);
	}

	setMode(mode: number): void {
		const winData = TextCanvas.winData[mode],
			cols = winData.right + 1,
			rows = winData.bottom + 1;

		if (this.cols !== cols) {
			this.cols = cols;
			this.textText.setAttribute("cols", String(cols));
		}
		if (this.rows !== rows) {
			this.rows = rows;
			this.textText.setAttribute("rows", String(rows));
		}
	}

	clearFullWindow(): void { // clear full window with paper 0 (SCR MODE CLEAR)
		this.resetTextBuffer();
		this.setNeedUpdate();
	}

	windowScrollUp(left: number, right: number, top: number, bottom: number, _paper: number): void {
		const width = right + 1 - left,
			height = bottom + 1 - top;

		if (height > 1) { // scroll part
			// adapt also text buffer
			this.copyTextBufferBoxUp(left, top + 1, width, height - 1, left, top);
		}
		this.fillTextBox(left, bottom, width, 1);
	}

	windowScrollDown(left: number, right: number, top: number, bottom: number, _paper: number): void {
		const width = right + 1 - left,
			height = bottom + 1 - top;

		if (height > 1) { // scroll part
			// adapt also text buffer
			this.copyTextBufferBoxDown(left, top, width, height - 1, left, top + 1);
		}
		this.fillTextBox(left, top, width, 1);
	}
}
