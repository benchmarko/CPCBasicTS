// Canvas.ts - Graphics output to HTML canvas
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//
/* globals ArrayBuffer, Uint8Array, Uint32Array */

import { ViewID } from "./Constants";
import { Utils } from "./Utils";
import { View } from "./View";
import { CanvasOptions, ICanvas, CanvasCharType } from "./Interfaces";

interface ModeData {
	pens: number // number of pens
	pixelWidth: number // pixel width
	pixelHeight: number // pixel height
}

export class Canvas implements ICanvas {
	private readonly options: CanvasOptions;

	private readonly fnUpdateCanvasHandler: () => void;
	private readonly fnUpdateCanvas2Handler: () => void;

	private fps = 15; // FPS for canvas update
	private isRunning = false;
	private animationTimeoutId?: number;
	private animationFrame?: number;

	private readonly cpcAreaBox: HTMLElement;

	private customCharset: Record<number, CanvasCharType> = {};

	private gColMode = 0; // 0=normal, 1=xor, 2=and, 3=or

	private mask = 255;
	private maskBit = 128;
	private maskFirst = 1;

	private offset = 0; // screen offset

	private readonly canvas: HTMLCanvasElement;

	private width: number;
	private height: number;
	private borderWidth = 4;

	private readonly dataset8: Uint8Array;

	private needUpdate = false;

	private readonly colorValues: number[][] = [];

	private readonly currentInks: number[][] = [];
	private readonly speedInk: number[] = [];
	private inkSet = 0;

	private readonly pen2ColorMap: number[][] = [];

	private readonly ctx: CanvasRenderingContext2D;
	private readonly imageData: ImageData;

	private fnCopy2Canvas: () => void;
	private littleEndian = true;
	private pen2Color32?: Uint32Array;
	private data32?: Uint32Array;
	private use32BitCopy = true; // determined later

	private gPen = 0;
	private gPaper = 0;

	private speedInkCount = 0; // usually 10

	private hasFocus = false; // canvas has focus

	private mode = 0;
	private modeData = Canvas.modeData[0];

	private xPos = 0;
	private yPos = 0;

	private xOrig = 0;
	private yOrig = 0;
	private xLeft = 0;
	private xRight = 639;
	private yTop = 399;
	private yBottom = 0;

	private gTransparent = false;

	constructor(options: CanvasOptions) {
		this.fnUpdateCanvasHandler = this.updateCanvas.bind(this);
		this.fnUpdateCanvas2Handler = this.updateCanvas2.bind(this);

		this.options = {} as CanvasOptions;
		this.setOptions(options, true);

		const canvas = View.getElementByIdAs<HTMLCanvasElement>(this.options.canvasID);

		this.canvas = canvas;

		this.cpcAreaBox = View.getElementById1(ViewID.cpcArea);

		// make sure canvas is not hidden (allows to get width, height, set style)
		if (canvas.offsetParent === null) {
			Utils.console.error("Error: canvas is not visible!");
		}

		const width = canvas.width,
			height = canvas.height;

		this.width = width;
		this.height = height;

		this.dataset8 = new Uint8Array(new ArrayBuffer(width * height)); // array with pen values

		this.animationTimeoutId = undefined;
		this.animationFrame = undefined;

		if (this.canvas.getContext) { // not available on e.g. IE8
			this.ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;

			this.imageData = this.ctx.getImageData(0, 0, width, height);

			if (typeof Uint32Array !== "undefined" && this.imageData.data.buffer) {	// imageData.data.buffer not available on IE10
				this.littleEndian = Canvas.isLittleEndian();
				this.pen2Color32 = new Uint32Array(new ArrayBuffer(Canvas.modeData[3].pens * 4));
				this.data32 = new Uint32Array(this.imageData.data.buffer);
				this.use32BitCopy = true;
				Utils.console.log("Canvas: using optimized copy2Canvas32bit, littleEndian:", this.littleEndian);
			} else {
				this.setAlpha(255);
				this.use32BitCopy = false;
				Utils.console.log("Canvas: using copy2Canvas8bit");
			}

			this.fnCopy2Canvas = this.getCopy2CanvasFunction(this.offset);
		} else {
			Utils.console.warn("Error: canvas.getContext is not supported.");
			// not available on e.g. IE8, nodeJS
			this.fnCopy2Canvas = () => {
				// nothing
			};
			this.ctx = {} as CanvasRenderingContext2D; // not available
			this.imageData = {} as ImageData; // not available
		}
		this.reset();
	}

	getOptions(): CanvasOptions {
		return this.options;
	}

	setOptions(options: Partial<CanvasOptions>, force?: boolean): void {
		const currentPalette = this.options.palette;

		Object.assign(this.options, options);

		if (force || (this.options.palette !== currentPalette)) { // changed?
			this.applyPalette();
		}
	}

	// http://www.cpcwiki.eu/index.php/CPC_Palette
	// (green and gray palette will be computed if needed)
	private static readonly palettes: Record<string, string[]> = {
		color: [
			"#000000", //  0 Black
			"#000080", //  1 Blue
			"#0000FF", //  2 Bright Blue
			"#800000", //  3 Red
			"#800080", //  4 Magenta
			"#8000FF", //  5 Mauve
			"#FF0000", //  6 Bright Red
			"#FF0080", //  7 Purple
			"#FF00FF", //  8 Bright Magenta
			"#008000", //  9 Green
			"#008080", // 10 Cyan
			"#0080FF", // 11 Sky Blue
			"#808000", // 12 Yellow
			"#808080", // 13 White
			"#8080FF", // 14 Pastel Blue
			"#FF8000", // 15 Orange
			"#FF8080", // 16 Pink
			"#FF80FF", // 17 Pastel Magenta
			"#00FF00", // 18 Bright Green
			"#00FF80", // 19 Sea Green
			"#00FFFF", // 20 Bright Cyan
			"#80FF00", // 21 Lime
			"#80FF80", // 22 Pastel Green
			"#80FFFF", // 23 Pastel Cyan
			"#FFFF00", // 24 Bright Yellow
			"#FFFF80", // 25 Pastel Yellow
			"#FFFFFF", // 26 Bright White
			"#808080", // 27 White (same as 13)
			"#FF00FF", // 28 Bright Magenta (same as 8)
			"#FFFF80", // 29 Pastel Yellow (same as 25)
			"#000080", // 30 Blue (same as 1)
			"#00FF80" //  31 Sea Green (same as 19)
		]
	};

	// mode 0: pen 0-15,16=border; inks for pen 14,15 are alternating: "1,24", "16,11"
	private static readonly defaultInks = [
		[1, 24, 20, 6, 26, 0, 2, 8, 10, 12, 14, 16, 18, 22, 1, 16, 1], // eslint-disable-line array-element-newline
		[1, 24, 20, 6, 26, 0, 2, 8, 10, 12, 14, 16, 18, 22, 24, 11, 1] // eslint-disable-line array-element-newline
	];

	private static readonly modeData: ModeData[] = [
		{ // mode 0
			pens: 16, // number of pens
			pixelWidth: 4, // pixel width
			pixelHeight: 2 // pixel height
		},
		{ // mode 1
			pens: 4,
			pixelWidth: 2,
			pixelHeight: 2
		},
		{ // mode 2
			pens: 2,
			pixelWidth: 1,
			pixelHeight: 2
		},
		{ // mode 3
			pens: 16, // mode 3 not available on a real CPC
			pixelWidth: 1,
			pixelHeight: 1
		}
	];

	private applyBorderColor() {
		this.canvas.style.borderColor = Canvas.palettes[this.options.palette][this.currentInks[this.inkSet][16]];
	}

	reset(): void {
		this.changeMode(1);
		this.inkSet = 0;
		this.setDefaultInks();

		this.speedInk[0] = 10;
		this.speedInk[1] = 10;
		this.speedInkCount = this.speedInk[this.inkSet];
		this.applyBorderColor();

		this.setGPen(1);
		this.setGPaper(0);
		this.resetCustomChars();
		this.setMode(1);
		this.clearGraphicsWindow();
	}

	resetCustomChars(): void {
		this.customCharset = {}; // symbol
	}

	private static computePalette(palette: "color" | "green" | "grey") {
		if (palette === "green" || palette === "grey") {
			const colorPalette = Canvas.palettes.color,
				colorValues: number[][] = [],
				monoPalette = [];

			Canvas.extractAllColorValues(colorPalette, colorValues);

			for (let i = 0; i < colorPalette.length; i += 1) {
				// https://en.wikipedia.org/wiki/Luma_(video)
				// (0.299 * R) + (0.587 * G) + (0.114 * B);
				const monoValue = (0.299 * colorValues[i][0] + 0.587 * colorValues[i][1] + 0.114 * colorValues[i][2]) | 0, // eslint-disable-line no-bitwise
					monoHex = monoValue.toString(16).toUpperCase().padStart(2, "0");


				monoPalette[i] = palette === "green" ? "#00" + monoHex + "00" : "#" + monoHex + monoHex + monoHex;
			}
			Canvas.palettes[palette] = monoPalette;
		}
	}

	private applyPalette(): void {
		const palette = this.options.palette;

		if (!Canvas.palettes[palette]) {
			Canvas.computePalette(palette);
		}

		this.setColorValues(Canvas.palettes[palette]);
		if (this.currentInks.length) { // only if initialized (not if called from constructor)
			this.updateColorMap();
			this.setNeedUpdate();
			this.applyBorderColor();
		}
	}

	private static isLittleEndian() {
		// https://gist.github.com/TooTallNate/4750953
		const b = new ArrayBuffer(4),
			a = new Uint32Array(b),
			c = new Uint8Array(b);

		a[0] = 0xdeadbeef;
		return (c[0] === 0xef);
	}

	private static extractColorValues(color: string) { // from "#rrggbb"
		return [
			parseInt(color.substring(1, 3), 16),
			parseInt(color.substring(3, 5), 16),
			parseInt(color.substring(5, 7), 16)
		];
	}

	private static extractAllColorValues(colors: string[], colorValues: number[][]) {
		for (let i = 0; i < colors.length; i += 1) {
			colorValues[i] = Canvas.extractColorValues(colors[i]);
		}
	}

	private setColorValues(palette: string[]) {
		Canvas.extractAllColorValues(palette, this.colorValues);
	}

	private setAlpha(alpha: number) {
		const buf8 = this.imageData.data,
			length = this.dataset8.length; // or: this.width * this.height

		for (let i = 0; i < length; i += 1) {
			buf8[i * 4 + 3] = alpha; // alpha
		}
	}

	private setNeedUpdate() {
		this.needUpdate = true;
	}

	private updateCanvas2() {
		if (!this.isRunning) {
			return; // ignore remaining timeouts, if stopped
		}
		this.animationFrame = requestAnimationFrame(this.fnUpdateCanvasHandler);
		if (this.needUpdate) { // could be improved: update only updateRect
			this.needUpdate = false;
			// we always do a full updateCanvas...
			this.fnCopy2Canvas();
		}
	}

	// http://creativejs.com/resources/requestanimationframe/ (set frame rate)
	// https://stackoverflow.com/questions/19764018/controlling-fps-with-requestanimationframe
	private updateCanvas() {
		this.animationTimeoutId = window.setTimeout(this.fnUpdateCanvas2Handler, 1000 / this.fps); // ts (node)
	}

	startUpdateCanvas(): void {
		if (!this.isRunning && this.canvas.offsetParent !== null) { // animation off and canvas visible in DOM?
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

	private copy2Canvas8bit() {
		const buf8 = this.imageData.data, // use Uint8ClampedArray from canvas
			dataset8 = this.dataset8,
			length = dataset8.length, // or: this.width * this.height
			pen2ColorMap = this.pen2ColorMap;

		for (let i = 0; i < length; i += 1) {
			const color = pen2ColorMap[dataset8[i]],
				j = i * 4;

			buf8[j] = color[0]; // r
			buf8[j + 1] = color[1]; // g
			buf8[j + 2] = color[2]; // b
			// alpha already set to 255
		}
		this.ctx.putImageData(this.imageData, 0, 0);
	}

	private copy2Canvas32bit() {
		const dataset8 = this.dataset8,
			data32 = this.data32 as Uint32Array,
			pen2Color32 = this.pen2Color32 as Uint32Array;

		for (let i = 0; i < data32.length; i += 1) {
			data32[i] = pen2Color32[dataset8[i]];
		}

		this.ctx.putImageData(this.imageData, 0, 0);
	}

	private copy2Canvas32bitWithOffset() {
		const dataset8 = this.dataset8,
			data32 = this.data32 as Uint32Array,
			pen2Color32 = this.pen2Color32 as Uint32Array,
			offset = this.offset;

		for (let i = 0; i < data32.length - offset; i += 1) {
			data32[i + offset] = pen2Color32[dataset8[i]];
		}

		for (let i = data32.length - offset; i < data32.length; i += 1) {
			data32[i + offset - data32.length] = pen2Color32[dataset8[i]];
		}

		this.ctx.putImageData(this.imageData, 0, 0);
	}

	private getCopy2CanvasFunction(offset: number): () => void {
		if (this.use32BitCopy) {
			return offset ? this.copy2Canvas32bitWithOffset : this.copy2Canvas32bit;
		}
		return offset ? this.copy2Canvas8bit : this.copy2Canvas8bit; // TODO: for older browsers
	}

	setScreenOffset(offset: number): void {
		if (offset) {
			// TODO
			offset = (offset % 80) * 8 + ((offset / 80) | 0) * 80 * 16 * 8; // eslint-disable-line no-bitwise
			offset = 640 * 400 - offset;
		}

		if (offset !== this.offset) {
			this.offset = offset;
			this.fnCopy2Canvas = this.getCopy2CanvasFunction(offset);

			this.setNeedUpdate();
		}
	}

	private updateColorMap() {
		const colorValues = this.colorValues,
			currentInksInSet = this.currentInks[this.inkSet],
			pen2ColorMap = this.pen2ColorMap,
			pen2Color32 = this.pen2Color32,
			maxPens = 16,
			alpha = 255;

		for (let i = 0; i < maxPens; i += 1) {
			pen2ColorMap[i] = colorValues[currentInksInSet[i]];
		}

		if (pen2Color32) {
			for (let i = 0; i < maxPens; i += 1) {
				const color = pen2ColorMap[i];

				if (this.littleEndian) {
					pen2Color32[i] = color[0] + color[1] * 256 + color[2] * 65536 + alpha * 65536 * 256;
				} else {
					pen2Color32[i] = color[2] + color[1] * 256 + color[0] * 65536 + alpha * 65536 * 256; // for big endian (untested)
				}
			}
		}
	}

	updateColorsAndCanvasImmediately(inkList: number[]): void {
		const currentInksInSet = this.currentInks[this.inkSet],
			memorizedInks = currentInksInSet.slice();

		this.currentInks[this.inkSet] = inkList; // temporary inks
		this.updateColorMap();

		this.fnCopy2Canvas(); // do it immediately
		this.currentInks[this.inkSet] = memorizedInks.slice();
		this.updateColorMap();
		this.needUpdate = true; // we want to restore it with the next update...
	}

	updateSpeedInk(): void {
		const pens = this.modeData.pens;

		this.speedInkCount -= 1;
		if (this.speedInkCount <= 0) {
			const currentInkSet = this.inkSet,
				newInkSet = currentInkSet ^ 1; // eslint-disable-line no-bitwise

			this.inkSet = newInkSet;
			this.speedInkCount = this.speedInk[newInkSet];

			// check for blinking inks which pens are visible in the current mode
			for (let i = 0; i < pens; i += 1) {
				if (this.currentInks[newInkSet][i] !== this.currentInks[currentInkSet][i]) {
					this.updateColorMap(); // need ink update
					this.needUpdate = true; // we also need update
					break;
				}
			}

			// check border ink
			if (this.currentInks[newInkSet][16] !== this.currentInks[currentInkSet][16]) {
				this.applyBorderColor();
			}
		}
	}

	setCustomChar(char: number, charData: CanvasCharType): void {
		this.customCharset[char] = charData;
	}

	getCharData(char: number): CanvasCharType {
		return this.customCharset[char] || this.options.charset[char];
	}

	setDefaultInks(): void {
		this.currentInks[0] = Canvas.defaultInks[0].slice(); // copy ink set 0 array
		this.currentInks[1] = Canvas.defaultInks[1].slice(); // copy ink set 1 array
		this.updateColorMap();
		this.setGPen(this.gPen);
	}

	private setFocusOnCanvas() {
		this.cpcAreaBox.style.background = "#463c3c";
		if (this.canvas) {
			this.canvas.focus();
		}
		this.hasFocus = true;
	}

	private getMousePos(event: MouseEvent) {
		const anyDoc = document as any,
			isFullScreen = Boolean(document.fullscreenElement || anyDoc.mozFullScreenElement || anyDoc.webkitFullscreenElement || anyDoc.msFullscreenElement),
			rect = this.canvas.getBoundingClientRect();

		if (isFullScreen) {
			const areaX = 0,
				areaY = 0,
				rectwidth = rect.right - rect.left - (this.borderWidth + areaX) * 2,
				rectHeight = rect.bottom - rect.top - (this.borderWidth + areaY) * 2,
				ratioX = rectwidth / this.canvas.width,
				ratioY = rectHeight / this.canvas.height,
				minRatio = ratioX <= ratioY ? ratioX : ratioY,
				diffX = rectwidth - (this.canvas.width * minRatio),
				diffY = rectHeight - (this.canvas.height * minRatio);

			return {
				x: (event.clientX - this.borderWidth - rect.left - diffX / 2) / ratioX * ratioX / minRatio,
				y: (event.clientY - this.borderWidth - rect.top - diffY / 2) / ratioY * ratioY / minRatio
			};
		}

		return {
			x: (event.clientX - this.borderWidth - rect.left) / (rect.right - rect.left - this.borderWidth * 2) * this.canvas.width,
			y: (event.clientY - this.borderWidth - rect.top) / (rect.bottom - rect.top - this.borderWidth * 2) * this.canvas.height
		};
	}

	private canvasClickAction(event: MouseEvent) {
		const pos = this.getMousePos(event),
			/* eslint-disable no-bitwise */
			x = pos.x | 0, // force integer
			y = pos.y | 0;
			/* eslint-enable no-bitwise */

		if (this.options.onCanvasClick) {
			if (x >= 0 && x <= this.width - 1 && y >= 0 && y <= this.height - 1) {
				const charWidth = this.modeData.pixelWidth * 8,
					charHeight = this.modeData.pixelHeight * 8,
					/* eslint-disable no-bitwise */
					xTxt = (x / charWidth) | 0,
					yTxt = (y / charHeight) | 0;
					/* eslint-enable no-bitwise */

				this.options.onCanvasClick(event, x, y, xTxt, yTxt);
			}
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

	getXpos(): number {
		return this.xPos;
	}

	getYpos(): number {
		return this.yPos;
	}

	private fillMyRect(x: number, y: number, width: number, height: number, paper: number) {
		const canvasWidth = this.width,
			dataset8 = this.dataset8;

		for (let row = 0; row < height; row += 1) {
			const idx = x + (y + row) * canvasWidth;

			dataset8.fill(paper, idx, idx + width);
		}
	}

	fillTextBox(left: number, top: number, width: number, height: number, paper: number): void {
		const charWidth = this.modeData.pixelWidth * 8,
			charHeight = this.modeData.pixelHeight * 8;

		paper %= this.modeData.pens; // limit papers
		this.fillMyRect(left * charWidth, top * charHeight, width * charWidth, height * charHeight, paper);
		this.setNeedUpdate();
	}

	private moveMyRectUp(x: number, y: number, width: number, height: number, x2: number, y2: number) { // for scrolling up (overlap)
		const canvasWidth = this.width,
			dataset8 = this.dataset8;

		for (let row = 0; row < height; row += 1) {
			const idx1 = x + (y + row) * canvasWidth,
				idx2 = x2 + (y2 + row) * canvasWidth;

			dataset8.copyWithin(idx2, idx1, idx1 + width);
		}
	}

	private moveMyRectDown(x: number, y: number, width: number, height: number, x2: number, y2: number) { // for scrolling down (overlap)
		const canvasWidth = this.width,
			dataset8 = this.dataset8;

		for (let row = height - 1; row >= 0; row -= 1) {
			const idx1 = x + (y + row) * canvasWidth,
				idx2 = x2 + (y2 + row) * canvasWidth;

			dataset8.copyWithin(idx2, idx1, idx1 + width);
		}
	}

	private invertChar(x: number, y: number, pen: number, paper: number) {
		const pixelWidth = this.modeData.pixelWidth,
			pixelHeight = this.modeData.pixelHeight,
			penXorPaper = pen ^ paper; // eslint-disable-line no-bitwise

		for (let row = 0; row < 8; row += 1) {
			for (let col = 0; col < 8; col += 1) {
				let testPen = this.testSubPixel(x + col * pixelWidth, y + row * pixelHeight);

				testPen ^= penXorPaper; // eslint-disable-line no-bitwise
				this.setSubPixelsNormal(x + col * pixelWidth, y + row * pixelHeight, testPen);
			}
		}
	}

	private setChar(char: number, x: number, y: number, pen: number, paper: number, transparent: boolean, gColMode: number, textAtGraphics: boolean) {
		const charData = this.customCharset[char] || this.options.charset[char],
			pixelWidth = this.modeData.pixelWidth,
			pixelHeight = this.modeData.pixelHeight;

		for (let row = 0; row < 8; row += 1) {
			for (let col = 0; col < 8; col += 1) {
				const charValue = charData[row],
					bit = charValue & (0x80 >> col); // eslint-disable-line no-bitwise

				if (!(transparent && !bit)) { // do not set background pixel in transparent mode
					const penOrPaper = (bit) ? pen : paper;

					if (textAtGraphics) {
						this.setPixel(x + col * pixelWidth, y - row * pixelHeight, penOrPaper, gColMode);
					} else { // text mode
						this.setSubPixels(x + col * pixelWidth, y + row * pixelHeight, penOrPaper, gColMode); // colMode always 0 in text mode
					}
				}
			}
		}
	}

	private readCharData(x: number, y: number, expectedPen: number) {
		const charData: CanvasCharType = [],
			pixelWidth = this.modeData.pixelWidth,
			pixelHeight = this.modeData.pixelHeight;

		for (let row = 0; row < 8; row += 1) {
			let charValue = 0;

			for (let col = 0; col < 8; col += 1) {
				const pen = this.testSubPixel(x + col * pixelWidth, y + row * pixelHeight);

				if (pen === expectedPen) {
					charValue |= (0x80 >> col); // eslint-disable-line no-bitwise
				}
			}
			charData[row] = charValue;
		}
		return charData;
	}

	// set subpixels with normal mode (gColmode=0)
	private setSubPixelsNormal(x: number, y: number, gPen: number) {
		const pixelWidth = this.modeData.pixelWidth,
			pixelHeight = this.modeData.pixelHeight,
			width = this.width;

		/* eslint-disable no-bitwise */
		x &= ~(pixelWidth - 1); // match CPC pixel
		y &= ~(pixelHeight - 1);

		for (let row = 0; row < pixelHeight; row += 1) {
			const i = x + width * (y + row);

			for (let col = 0; col < pixelWidth; col += 1) {
				this.dataset8[i + col] = gPen;
			}
		}
		/* eslint-enable no-bitwise */
	}

	private setSubPixels(x: number, y: number, gPen: number, gColMode: number) {
		const pixelWidth = this.modeData.pixelWidth,
			pixelHeight = this.modeData.pixelHeight,
			width = this.width;

		/* eslint-disable no-bitwise */
		x &= ~(pixelWidth - 1); // match CPC pixel
		y &= ~(pixelHeight - 1);

		for (let row = 0; row < pixelHeight; row += 1) {
			let i = x + width * (y + row);

			for (let col = 0; col < pixelWidth; col += 1) {
				switch (gColMode) {
				case 0: // normal
					this.dataset8[i] = gPen;
					break;
				case 1: // xor
					this.dataset8[i] ^= gPen;
					break;
				case 2: // and
					this.dataset8[i] &= gPen;
					break;
				case 3: // or
					this.dataset8[i] |= gPen;
					break;
				default:
					Utils.console.warn("setSubPixels: Unknown colMode:", gColMode);
					break;
				}
				i += 1;
			}
		}
		/* eslint-enable no-bitwise */
	}

	// some rounding needed before applying origin:
	private static roundCoordinate(cor: number, widthOrHeight: number) {
		/* eslint-disable no-bitwise */
		return cor >= 0 ? cor & ~(widthOrHeight - 1) : -(-cor & ~(widthOrHeight - 1));
		/* eslint-enable no-bitwise */
	}

	private setPixel(x: number, y: number, gPen: number, gColMode: number) {
		// some rounding needed before applying origin:
		x = Canvas.roundCoordinate(x, this.modeData.pixelWidth);
		y = Canvas.roundCoordinate(y, this.modeData.pixelHeight);

		x += this.xOrig;
		y = this.height - 1 - (y + this.yOrig);
		if (x < this.xLeft || x > this.xRight || y < (this.height - 1 - this.yTop) || y > (this.height - 1 - this.yBottom)) {
			return; // not in graphics window
		}
		this.setSubPixels(x, y, gPen, gColMode);
	}

	private setPixelOriginIncluded(x: number, y: number, gPen: number, gColMode: number) {
		if (x < this.xLeft || x > this.xRight || y < (this.height - 1 - this.yTop) || y > (this.height - 1 - this.yBottom)) {
			return; // not in graphics window
		}
		this.setSubPixels(x, y, gPen, gColMode);
	}

	private testSubPixel(x: number, y: number) {
		const i = x + this.width * y,
			pen = this.dataset8[i];

		return pen;
	}

	private testPixel(x: number, y: number) {
		// some rounding needed before applying origin:
		x = Canvas.roundCoordinate(x, this.modeData.pixelWidth);
		y = Canvas.roundCoordinate(y, this.modeData.pixelHeight);

		x += this.xOrig;
		y = this.height - 1 - (y + this.yOrig);
		if (x < this.xLeft || x > this.xRight || y < (this.height - 1 - this.yTop) || y > (this.height - 1 - this.yBottom)) {
			return this.gPaper; // not in graphics window => return graphics paper
		}

		const i = x + this.width * y,
			pen = this.dataset8[i];

		return pen;
	}

	getByte(addr: number): number | null {
		/* eslint-disable no-bitwise */
		const mode = this.mode,
			pixelWidth = this.modeData.pixelWidth,
			pixelHeight = this.modeData.pixelHeight,
			x = ((addr & 0x7ff) % 80) * 8,
			y = (((addr & 0x3800) / 0x800) + (((addr & 0x7ff) / 80) | 0) * 8) * pixelHeight;

		let	byte = null, // null=cannot read
			gPen: number;

		if (y < this.height) { // only if in visible range
			if (mode === 0) {
				gPen = this.dataset8[x + this.width * y];
				byte = ((gPen >> 2) & 0x02) | ((gPen << 3) & 0x20) | ((gPen << 2) & 0x08) | ((gPen << 7) & 0x80); // b1,b5,b3,b7 (left pixel)

				gPen = this.dataset8[x + pixelWidth + this.width * y];
				byte |= ((gPen >> 3) & 0x01) | ((gPen << 2) & 0x10) | ((gPen << 1) & 0x04) | ((gPen << 6) & 0x40); // b0,b4,b2,b6 (right pixel)
			} else if (mode === 1) {
				byte = 0;
				gPen = this.dataset8[x + this.width * y];
				byte |= ((gPen & 0x02) << 2) | ((gPen & 0x01) << 7); // b3,b7 (left pixel 1)
				gPen = this.dataset8[x + pixelWidth + this.width * y];
				byte |= ((gPen & 0x02) << 1) | ((gPen & 0x01) << 6); // b2,b6 (pixel 2)
				gPen = this.dataset8[x + pixelWidth * 2 + this.width * y];
				byte |= ((gPen & 0x02) << 0) | ((gPen & 0x01) << 5); // b1,b5 (pixel 3)
				gPen = this.dataset8[x + pixelWidth * 3 + this.width * y];
				byte |= ((gPen & 0x02) >> 1) | ((gPen & 0x01) << 4); // b0,b4 (right pixel 4)
			} else if (mode === 2) {
				byte = 0;
				for (let i = 0; i <= 7; i += 1) {
					gPen = this.dataset8[x + i + this.width * y];
					byte |= (gPen & 0x01) << (7 - i);
				}
			} else { // mode === 3
			}
		}
		/* eslint-enable no-bitwise */

		return byte;
	}

	setByte(addr: number, byte: number): void {
		/* eslint-disable no-bitwise */
		const mode = this.mode,
			pixelWidth = this.modeData.pixelWidth,
			pixelHeight = this.modeData.pixelHeight,
			x = ((addr & 0x7ff) % 80) * 8,
			y = (((addr & 0x3800) / 0x800) + (((addr & 0x7ff) / 80) | 0) * 8) * pixelHeight;
		let gPen: number;

		if (y < this.height) { // only if in visible range
			if (mode === 0) {
				gPen = ((byte << 2) & 0x08) | ((byte >> 3) & 0x04) | ((byte >> 2) & 0x02) | ((byte >> 7) & 0x01); // b1,b5,b3,b7 (left pixel)
				this.setSubPixelsNormal(x, y, gPen);
				gPen = ((byte << 3) & 0x08) | ((byte >> 2) & 0x04) | ((byte >> 1) & 0x02) | ((byte >> 6) & 0x01); // b0,b4,b2,b6 (right pixel)
				this.setSubPixelsNormal(x + pixelWidth, y, gPen);
				this.setNeedUpdate();
			} else if (mode === 1) {
				gPen = ((byte >> 2) & 0x02) | ((byte >> 7) & 0x01); // b3,b7 (left pixel 1)
				this.setSubPixelsNormal(x, y, gPen);
				gPen = ((byte >> 1) & 0x02) | ((byte >> 6) & 0x01); // b2,b6 (pixel 2)
				this.setSubPixelsNormal(x + pixelWidth, y, gPen);
				gPen = ((byte >> 0) & 0x02) | ((byte >> 5) & 0x01); // b1,b5 (pixel 3)
				this.setSubPixelsNormal(x + pixelWidth * 2, y, gPen);
				gPen = ((byte << 1) & 0x02) | ((byte >> 4) & 0x01); // b0,b4 (right pixel 4)
				this.setSubPixelsNormal(x + pixelWidth * 3, y, gPen);
				this.setNeedUpdate();
			} else if (mode === 2) {
				for (let i = 0; i <= 7; i += 1) {
					gPen = (byte >> (7 - i)) & 0x01;
					this.setSubPixelsNormal(x + i * pixelWidth, y, gPen);
				}
				this.setNeedUpdate();
			} else { // mode === 3 (not supported)
			}
		}
		/* eslint-enable no-bitwise */
	}

	// https://de.wikipedia.org/wiki/Bresenham-Algorithmus
	private drawBresenhamLine(xstart: number, ystart: number, xend: number, yend: number) {
		const pixelWidth = this.modeData.pixelWidth,
			pixelHeight = this.modeData.pixelHeight,
			gPen = this.gPen,
			gPaper = this.gPaper,
			mask = this.mask,
			maskFirst = this.maskFirst,
			gColMode = this.gColMode,
			transparent = this.gTransparent;
		let maskBit = this.maskBit;

		xstart = Canvas.roundCoordinate(xstart, pixelWidth);
		ystart = Canvas.roundCoordinate(ystart, pixelHeight);
		xend = Canvas.roundCoordinate(xend, pixelWidth);
		yend = Canvas.roundCoordinate(yend, pixelHeight);

		// we have to add origin before modifying coordinates to match CPC pixel
		xstart += this.xOrig;
		ystart = this.height - 1 - (ystart + this.yOrig);
		xend += this.xOrig;
		yend = this.height - 1 - (yend + this.yOrig);

		/* eslint-disable no-bitwise */
		let dx = ((xend - xstart) / pixelWidth) | 0,
			dy = ((yend - ystart) / pixelHeight) | 0;
		/* eslint-enable no-bitwise */

		const incx = Math.sign(dx) * pixelWidth,
			incy = Math.sign(dy) * pixelHeight;

		if (dx < 0) {
			dx = -dx;
		}
		if (dy < 0) {
			dy = -dy;
		}

		let pdx: number, pdy: number, ddx: number, ddy: number, deltaslowdirection: number, deltafastdirection: number;

		if (dx > dy) {
			pdx = incx;
			pdy = 0;
			ddx = incx;
			ddy = incy;
			deltaslowdirection = dy;
			deltafastdirection = dx;
		} else {
			pdx = 0;
			pdy = incy;
			ddx = incx;
			ddy = incy;
			deltaslowdirection = dx;
			deltafastdirection = dy;
		}

		let x = xstart,
			y = ystart,
			err = deltafastdirection >> 1; // eslint-disable-line no-bitwise

		if (maskFirst) { // draw first pixel?
			const bit = mask & maskBit; // eslint-disable-line no-bitwise

			if (!(transparent && !bit)) { // do not set background pixel in transparent mode
				this.setPixelOriginIncluded(x, y, bit ? gPen : gPaper, gColMode); // we expect integers
			}
			// rotate bitpos right
			maskBit = (maskBit >> 1) | ((maskBit << 7) & 0xff); // eslint-disable-line no-bitwise
		}

		for (let t = 0; t < deltafastdirection; t += 1) {
			err -= deltaslowdirection;
			if (err < 0) {
				err += deltafastdirection;
				x += ddx;
				y += ddy;
			} else {
				x += pdx;
				y += pdy;
			}

			const bit = mask & maskBit; // eslint-disable-line no-bitwise

			if (!(transparent && !bit)) { // do not set background pixel in transparent mode
				this.setPixelOriginIncluded(x, y, bit ? gPen : gPaper, gColMode); // we expect integers
			}
			// rotate bitpos right
			maskBit = (maskBit >> 1) | ((maskBit << 7) & 0xff); // eslint-disable-line no-bitwise
		}
		this.maskBit = maskBit;
	}

	draw(x: number, y: number): void {
		const xStart = this.xPos,
			yStart = this.yPos;

		this.move(x, y); // destination

		this.drawBresenhamLine(xStart, yStart, x, y);
		this.setNeedUpdate();
	}

	move(x: number, y: number): void {
		this.xPos = x; // must be integer
		this.yPos = y;
	}

	plot(x: number, y: number): void {
		this.move(x, y);

		this.setPixel(x, y, this.gPen, this.gColMode); // must be integer
		this.setNeedUpdate();
	}

	test(x: number, y: number): number {
		this.move(x, y);

		return this.testPixel(this.xPos, this.yPos); // use rounded values
	}

	setInk(pen: number, ink1: number, ink2: number): boolean {
		let needInkUpdate = false;

		if (this.currentInks[0][pen] !== ink1) {
			this.currentInks[0][pen] = ink1;
			needInkUpdate = true;
		}
		if (this.currentInks[1][pen] !== ink2) {
			this.currentInks[1][pen] = ink2;
			needInkUpdate = true;
		}
		if (needInkUpdate) {
			this.updateColorMap();
			this.setNeedUpdate(); // we need to notify that an update is needed
		}
		return needInkUpdate;
	}

	setBorder(ink1: number, ink2: number): void {
		const needInkUpdate = this.setInk(16, ink1, ink2);

		if (needInkUpdate) {
			this.applyBorderColor();
		}
	}

	setGPen(gPen: number): void {
		this.gPen = gPen % this.modeData.pens; // limit pens
	}

	setGPaper(gPaper: number): void {
		this.gPaper = gPaper % this.modeData.pens; // limit to pens
	}

	setGTransparentMode(transparent: boolean): void {
		this.gTransparent = transparent;
	}

	printGChar(char: number): void {
		const charWidth = this.modeData.pixelWidth * 8;

		if (char >= this.options.charset.length) {
			Utils.console.warn("printGChar: Ignoring char with code", char);
			return;
		}

		this.setChar(char, this.xPos, this.yPos, this.gPen, this.gPaper, this.gTransparent, this.gColMode, true);
		this.xPos += charWidth;
		this.setNeedUpdate();
	}

	printChar(char: number, x: number, y: number, pen: number, paper: number, transparent: boolean): void {
		const charWidth = this.modeData.pixelWidth * 8,
			charHeight = this.modeData.pixelHeight * 8,
			pens = this.modeData.pens;

		if (char >= this.options.charset.length) {
			Utils.console.warn("printChar: Ignoring char with code", char);
			return;
		}

		pen %= pens;
		paper %= pens; // also pens

		this.setChar(char, x * charWidth, y * charHeight, pen, paper, transparent, 0, false);
		this.setNeedUpdate();
	}

	drawCursor(x: number, y: number, pen: number, paper: number): void {
		const charWidth = this.modeData.pixelWidth * 8,
			charHeight = this.modeData.pixelHeight * 8,
			pens = this.modeData.pens;

		pen %= pens;
		paper %= pens; // also pens

		this.invertChar(x * charWidth, y * charHeight, pen, paper);
		this.setNeedUpdate();
	}

	private findMatchingChar(charData: CanvasCharType) {
		const charset = this.options.charset;
		let	char = -1; // not detected

		for (let i = 0; i < charset.length; i += 1) {
			const charData2 = this.customCharset[i] || charset[i];
			let match = true;

			for (let j = 0; j < 8; j += 1) {
				if (charData[j] !== charData2[j]) {
					match = false;
					break;
				}
			}
			if (match) {
				char = i;
				break;
			}
		}
		return char;
	}

	readChar(x: number, y: number, pen: number, paper: number): number {
		const charWidth = this.modeData.pixelWidth * 8,
			charHeight = this.modeData.pixelHeight * 8,
			pens = this.modeData.pens;

		pen %= pens;
		paper %= pens; // also pens

		x *= charWidth;
		y *= charHeight;

		let charData = this.readCharData(x, y, pen),
			char = this.findMatchingChar(charData);

		if (char < 0 || char === 32) { // no match? => check inverse with paper, char=32?
			charData = this.readCharData(x, y, paper);
			for (let i = 0; i < charData.length; i += 1) {
				charData[i] ^= 0xff; // eslint-disable-line no-bitwise
			}
			let char2 = this.findMatchingChar(charData);

			if (char2 >= 0) {
				if (char2 === 143) { // invers of space?
					char2 = 32; // use space
				}
				char = char2;
			}
		}
		return char;
	}

	// fill: idea from: https://simpledevcode.wordpress.com/2015/12/29/flood-fill-algorithm-using-c-net/
	private fnIsNotInWindow(x: number, y: number) {
		return (x < this.xLeft || x > this.xRight || y < (this.height - 1 - this.yTop) || y > (this.height - 1 - this.yBottom));
	}

	fill(fillPen: number): void {
		const gPen = this.gPen,
			pixelWidth = this.modeData.pixelWidth,
			pixelHeight = this.modeData.pixelHeight,
			pixels: ({x: number, y: number})[] = [],
			fnIsStopPen = function (p: number) {
				return p === fillPen || p === gPen;
			};
		let xPos = this.xPos,
			yPos = this.yPos;

		fillPen %= this.modeData.pens; // limit pens

		// apply origin
		xPos += this.xOrig;
		yPos = this.height - 1 - (yPos + this.yOrig);

		if (this.fnIsNotInWindow(xPos, yPos)) {
			return;
		}

		pixels.push({
			x: xPos,
			y: yPos
		});

		while (pixels.length) {
			const pixel = pixels.pop() as {x: number, y: number};

			let y1 = pixel.y,
				p1 = this.testSubPixel(pixel.x, y1);

			while (y1 >= (this.height - 1 - this.yTop) && !fnIsStopPen(p1)) {
				y1 -= pixelHeight;
				p1 = this.testSubPixel(pixel.x, y1);
			}
			y1 += pixelHeight;

			let spanLeft = false,
				spanRight = false;

			p1 = this.testSubPixel(pixel.x, y1);
			while (y1 <= (this.height - 1 - this.yBottom) && !fnIsStopPen(p1)) {
				this.setSubPixelsNormal(pixel.x, y1, fillPen);

				let x1 = pixel.x - pixelWidth;
				const p2 = this.testSubPixel(x1, y1);

				if (!spanLeft && x1 >= this.xLeft && !fnIsStopPen(p2)) {
					pixels.push({
						x: x1,
						y: y1
					});
					spanLeft = true;
				} else if (spanLeft && ((x1 < this.xLeft) || fnIsStopPen(p2))) {
					spanLeft = false;
				}

				x1 = pixel.x + pixelWidth;
				const p3 = this.testSubPixel(x1, y1);

				if (!spanRight && x1 <= this.xRight && !fnIsStopPen(p3)) {
					pixels.push({
						x: x1,
						y: y1
					});
					spanRight = true;
				} else if (spanRight && ((x1 > this.xRight) || fnIsStopPen(p3))) {
					spanRight = false;
				}
				y1 += pixelHeight;
				p1 = this.testSubPixel(pixel.x, y1);
			}
		}
		this.setNeedUpdate();
	}

	private static fnPutInRange(n: number, min: number, max: number) {
		if (n < min) {
			n = min;
		} else if (n > max) {
			n = max;
		}
		return n;
	}

	setOrigin(xOrig: number, yOrig: number): void {
		const pixelWidth = this.modeData.pixelWidth;

		xOrig &= ~(pixelWidth - 1); // eslint-disable-line no-bitwise

		this.xOrig = xOrig; // must be integer
		this.yOrig = yOrig;
		this.move(0, 0);
	}

	getXOrigin(): number {
		return this.xOrig;
	}

	getYOrigin(): number {
		return this.yOrig;
	}

	setGWindow(xLeft: number, xRight: number, yTop: number, yBottom: number): void {
		const pixelWidth = 8, // force byte boundaries: always 8 x/byte
			pixelHeight = this.modeData.pixelHeight; // usually 2, anly for mode 3 we have 1

		xLeft = Canvas.fnPutInRange(xLeft, 0, this.width - 1);
		xRight = Canvas.fnPutInRange(xRight, 0, this.width - 1);
		yTop = Canvas.fnPutInRange(yTop, 0, this.height - 1);
		yBottom = Canvas.fnPutInRange(yBottom, 0, this.height - 1);

		// exchange coordinates, if needed (left>right or top<bottom)
		if (xRight < xLeft) {
			const tmp = xRight;

			xRight = xLeft;
			xLeft = tmp;
		}
		if (yTop < yBottom) {
			const tmp = yTop;

			yTop = yBottom;
			yBottom = tmp;
		}

		// On the CPC this is set to byte positions (CPC Systembuch, p. 346)
		// ORIGIN 0,0,13,563,399,0 gets origin 0,0,8,567,399 mod2+1,mod2

		/* eslint-disable no-bitwise */
		xLeft &= ~(pixelWidth - 1);
		xRight |= (pixelWidth - 1);

		yTop |= (pixelHeight - 1); // we know: top is larger than bottom
		yBottom &= ~(pixelHeight - 1);
		/* eslint-enable no-bitwise */

		this.xLeft = xLeft;
		this.xRight = xRight;
		this.yTop = yTop;
		this.yBottom = yBottom;
	}

	setGColMode(gColMode: number): void {
		if (gColMode !== this.gColMode) {
			this.gColMode = gColMode;
		}
	}

	clearTextWindow(left: number, right: number, top: number, bottom: number, paper: number): void { // clear current text window
		const width = right + 1 - left,
			height = bottom + 1 - top;

		this.fillTextBox(left, top, width, height, paper);
	}

	clearGraphicsWindow(): void { // clear graphics window with graphics paper
		this.fillMyRect(this.xLeft, this.height - 1 - this.yTop, this.xRight + 1 - this.xLeft, this.yTop + 1 - this.yBottom, this.gPaper); // +1 or not?
		this.move(0, 0);
		this.setNeedUpdate();
	}

	clearFullWindow(): void { // clear full window with paper 0 (SCR MODE CLEAR)
		const paper = 0;

		this.fillMyRect(0, 0, this.width, this.height, paper);

		this.setNeedUpdate();
	}

	windowScrollUp(left: number, right: number, top: number, bottom: number, paper: number): void {
		const charWidth = this.modeData.pixelWidth * 8,
			charHeight = this.modeData.pixelHeight * 8,
			width = right + 1 - left,
			height = bottom + 1 - top;

		if (height > 1) { // scroll part
			this.moveMyRectUp(left * charWidth, (top + 1) * charHeight, width * charWidth, (height - 1) * charHeight, left * charWidth, top * charHeight);
		}
		this.fillTextBox(left, bottom, width, 1, paper);
		this.setNeedUpdate();
	}

	windowScrollDown(left: number, right: number, top: number, bottom: number, paper: number): void {
		const charWidth = this.modeData.pixelWidth * 8,
			charHeight = this.modeData.pixelHeight * 8,
			width = right + 1 - left,
			height = bottom + 1 - top;

		if (height > 1) { // scroll part
			this.moveMyRectDown(left * charWidth, top * charHeight, width * charWidth, (height - 1) * charHeight, left * charWidth, (top + 1) * charHeight);
		}
		this.fillTextBox(left, top, width, 1, paper);
		this.setNeedUpdate();
	}

	setSpeedInk(time1: number, time2: number): void { // default: 10,10
		this.speedInk[0] = time1;
		this.speedInk[1] = time2;
	}

	setMask(mask: number): void { // set line mask
		this.mask = mask;
		this.maskBit = 128;
	}

	setMaskFirst(maskFirst: number): void { // set first dot for line mask
		this.maskFirst = maskFirst;
	}

	getMode(): number {
		return this.mode;
	}

	changeMode(mode: number): void {
		const modeData = Canvas.modeData[mode];

		this.mode = mode;
		this.modeData = modeData;
	}

	setMode(mode: number): void { // set mode without clear screen
		this.setScreenOffset(0);
		this.changeMode(mode);
		this.setOrigin(0, 0);
		this.setGWindow(0, this.width - 1, this.height - 1, 0);
		this.setGColMode(0);
		this.setMask(255);
		this.setMaskFirst(1);
		this.setGPen(this.gPen); // keep, but maybe different for other mode
		this.setGPaper(this.gPaper); // keep, maybe different for other mode
		this.setGTransparentMode(false);
	}

	takeScreenShot(): string {
		if (this.canvas.toDataURL) {
			return this.canvas.toDataURL("image/png").replace("image/png", "image/octet-stream"); // here is the most important part because if you do not replace you will get a DOM 18 exception.
		}
		Utils.console.warn("Screenshot not available");
		return "";
	}
}
