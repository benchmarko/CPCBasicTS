// Canvas.ts - Graphics output to HTML canvas
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//
/* globals ArrayBuffer, Uint8Array, Uint32Array */
define(["require", "exports", "./Utils", "./View"], function (require, exports, Utils_1, View_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Canvas = void 0;
    var Canvas = /** @class */ (function () {
        function Canvas(options) {
            this.fps = 15; // FPS for canvas update
            this.customCharset = {};
            this.gColMode = 0; // 0=normal, 1=xor, 2=and, 3=or
            this.mask = 255;
            this.maskBit = 128;
            this.maskFirst = 1;
            this.offset = 0; // screen offset
            this.borderWidth = 4;
            this.needUpdate = false;
            this.colorValues = [];
            this.currentInks = [];
            this.speedInk = [];
            this.inkSet = 0;
            this.pen2ColorMap = [];
            this.littleEndian = true;
            this.use32BitCopy = true; // determined later
            this.gPen = 0;
            this.gPaper = 0;
            this.speedInkCount = 0; // usually 10
            this.hasFocus = false; // canvas has focus
            this.mode = 0;
            this.modeData = Canvas.modeData[0];
            this.xPos = 0;
            this.yPos = 0;
            this.xOrig = 0;
            this.yOrig = 0;
            this.xLeft = 0;
            this.xRight = 639;
            this.yTop = 399;
            this.yBottom = 0;
            this.gTransparent = false;
            this.options = options;
            this.fnUpdateCanvasHandler = this.updateCanvas.bind(this);
            this.fnUpdateCanvas2Handler = this.updateCanvas2.bind(this);
            this.cpcAreaBox = View_1.View.getElementById1("cpcAreaBox");
            var canvas = View_1.View.getElementById1("cpcCanvas");
            this.canvas = canvas;
            // make sure canvas is not hidden (allows to get width, height, set style)
            if (canvas.offsetParent === null) {
                Utils_1.Utils.console.error("Error: canvas is not visible!");
            }
            var width = canvas.width, height = canvas.height;
            this.width = width;
            this.height = height;
            this.dataset8 = new Uint8Array(new ArrayBuffer(width * height)); // array with pen values
            if (!Canvas.palettes[this.options.palette]) {
                Canvas.computePalette(this.options.palette);
            }
            this.setColorValues(Canvas.palettes[this.options.palette]);
            this.animationTimeoutId = undefined;
            this.animationFrame = undefined;
            if (this.canvas.getContext) { // not available on e.g. IE8
                this.ctx = this.canvas.getContext("2d");
                this.imageData = this.ctx.getImageData(0, 0, width, height);
                if (typeof Uint32Array !== "undefined" && this.imageData.data.buffer) { // imageData.data.buffer not available on IE10
                    this.littleEndian = Canvas.isLittleEndian();
                    this.pen2Color32 = new Uint32Array(new ArrayBuffer(Canvas.modeData[3].pens * 4));
                    this.data32 = new Uint32Array(this.imageData.data.buffer);
                    this.use32BitCopy = true;
                    Utils_1.Utils.console.log("Canvas: using optimized copy2Canvas32bit, littleEndian:", this.littleEndian);
                }
                else {
                    this.setAlpha(255);
                    this.use32BitCopy = false;
                    Utils_1.Utils.console.log("Canvas: using copy2Canvas8bit");
                }
                this.applyCopy2CanvasFunction(this.offset);
            }
            else {
                Utils_1.Utils.console.warn("Error: canvas.getContext is not supported.");
                this.ctx = {}; // not available
                this.imageData = {}; // not available
            }
            this.reset();
        }
        Canvas.prototype.applyBorderColor = function () {
            this.canvas.style.borderColor = Canvas.palettes[this.options.palette][this.currentInks[this.inkSet][16]];
        };
        Canvas.prototype.setOnCanvasClick = function (onCanvasClickHandler) {
            this.options.onCanvasClick = onCanvasClickHandler;
        };
        Canvas.prototype.reset = function () {
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
        };
        Canvas.prototype.resetCustomChars = function () {
            this.customCharset = {}; // symbol
        };
        Canvas.computePalette = function (palette) {
            if (palette === "green" || palette === "grey") {
                var colorPalette = Canvas.palettes.color, colorValues = [], monoPalette = [];
                Canvas.extractAllColorValues(colorPalette, colorValues);
                for (var i = 0; i < colorPalette.length; i += 1) {
                    // https://en.wikipedia.org/wiki/Luma_(video)
                    // (0.299 * R) + (0.587 * G) + (0.114 * B);
                    var monoValue = (0.299 * colorValues[i][0] + 0.587 * colorValues[i][1] + 0.114 * colorValues[i][2]) | 0, // eslint-disable-line no-bitwise
                    monoHex = monoValue.toString(16).toUpperCase().padStart(2, "0");
                    monoPalette[i] = palette === "green" ? "#00" + monoHex + "00" : "#" + monoHex + monoHex + monoHex;
                }
                Canvas.palettes[palette] = monoPalette;
            }
        };
        Canvas.prototype.setPalette = function (palette) {
            if (palette !== this.options.palette) {
                this.options.palette = palette;
                if (!Canvas.palettes[this.options.palette]) {
                    Canvas.computePalette(this.options.palette);
                }
                this.setColorValues(Canvas.palettes[this.options.palette]);
                this.updateColorMap();
                this.setNeedUpdate();
                this.applyBorderColor();
            }
        };
        Canvas.isLittleEndian = function () {
            // https://gist.github.com/TooTallNate/4750953
            var b = new ArrayBuffer(4), a = new Uint32Array(b), c = new Uint8Array(b);
            a[0] = 0xdeadbeef;
            return (c[0] === 0xef);
        };
        Canvas.extractColorValues = function (color) {
            return [
                parseInt(color.substring(1, 3), 16),
                parseInt(color.substring(3, 5), 16),
                parseInt(color.substring(5, 7), 16)
            ];
        };
        Canvas.extractAllColorValues = function (colors, colorValues) {
            for (var i = 0; i < colors.length; i += 1) {
                colorValues[i] = Canvas.extractColorValues(colors[i]);
            }
        };
        Canvas.prototype.setColorValues = function (palette) {
            Canvas.extractAllColorValues(palette, this.colorValues);
        };
        Canvas.prototype.setAlpha = function (alpha) {
            var buf8 = this.imageData.data, length = this.dataset8.length; // or: this.width * this.height
            for (var i = 0; i < length; i += 1) {
                buf8[i * 4 + 3] = alpha; // alpha
            }
        };
        Canvas.prototype.setNeedUpdate = function () {
            this.needUpdate = true;
        };
        Canvas.prototype.updateCanvas2 = function () {
            this.animationFrame = requestAnimationFrame(this.fnUpdateCanvasHandler);
            if (this.needUpdate) { // could be improved: update only updateRect
                this.needUpdate = false;
                // we always do a full updateCanvas...
                if (this.fnCopy2Canvas) { // not available on e.g. IE8
                    this.fnCopy2Canvas();
                }
            }
        };
        // http://creativejs.com/resources/requestanimationframe/ (set frame rate)
        // https://stackoverflow.com/questions/19764018/controlling-fps-with-requestanimationframe
        Canvas.prototype.updateCanvas = function () {
            this.animationTimeoutId = window.setTimeout(this.fnUpdateCanvas2Handler, 1000 / this.fps); // ts (node)
        };
        Canvas.prototype.startUpdateCanvas = function () {
            if (this.animationFrame === undefined && this.canvas.offsetParent !== null) { // animation off and canvas visible in DOM?
                this.updateCanvas();
            }
        };
        Canvas.prototype.stopUpdateCanvas = function () {
            if (this.animationFrame !== undefined) {
                cancelAnimationFrame(this.animationFrame);
                clearTimeout(this.animationTimeoutId);
                this.animationFrame = undefined;
                this.animationTimeoutId = undefined;
            }
        };
        Canvas.prototype.copy2Canvas8bit = function () {
            var buf8 = this.imageData.data, // use Uint8ClampedArray from canvas
            dataset8 = this.dataset8, length = dataset8.length, // or: this.width * this.height
            pen2ColorMap = this.pen2ColorMap;
            for (var i = 0; i < length; i += 1) {
                var color = pen2ColorMap[dataset8[i]], j = i * 4;
                buf8[j] = color[0]; // r
                buf8[j + 1] = color[1]; // g
                buf8[j + 2] = color[2]; // b
                // alpha already set to 255
            }
            this.ctx.putImageData(this.imageData, 0, 0);
        };
        Canvas.prototype.copy2Canvas32bit = function () {
            var dataset8 = this.dataset8, data32 = this.data32, pen2Color32 = this.pen2Color32;
            for (var i = 0; i < data32.length; i += 1) {
                data32[i] = pen2Color32[dataset8[i]];
            }
            this.ctx.putImageData(this.imageData, 0, 0);
        };
        Canvas.prototype.copy2Canvas32bitWithOffset = function () {
            var dataset8 = this.dataset8, data32 = this.data32, pen2Color32 = this.pen2Color32, offset = this.offset;
            for (var i = 0; i < data32.length - offset; i += 1) {
                data32[i + offset] = pen2Color32[dataset8[i]];
            }
            for (var i = data32.length - offset; i < data32.length; i += 1) {
                data32[i + offset - data32.length] = pen2Color32[dataset8[i]];
            }
            this.ctx.putImageData(this.imageData, 0, 0);
        };
        Canvas.prototype.applyCopy2CanvasFunction = function (offset) {
            if (this.use32BitCopy) {
                this.fnCopy2Canvas = offset ? this.copy2Canvas32bitWithOffset : this.copy2Canvas32bit;
            }
            else {
                this.fnCopy2Canvas = offset ? this.copy2Canvas8bit : this.copy2Canvas8bit; // TODO: for older browsers
            }
        };
        Canvas.prototype.setScreenOffset = function (offset) {
            if (offset) {
                // TODO
                offset = (offset % 80) * 8 + ((offset / 80) | 0) * 80 * 16 * 8; // eslint-disable-line no-bitwise
                offset = 640 * 400 - offset;
            }
            if (offset !== this.offset) {
                this.offset = offset;
                this.applyCopy2CanvasFunction(offset);
                this.setNeedUpdate();
            }
        };
        Canvas.prototype.updateColorMap = function () {
            var colorValues = this.colorValues, currentInksInSet = this.currentInks[this.inkSet], pen2ColorMap = this.pen2ColorMap, pen2Color32 = this.pen2Color32;
            for (var i = 0; i < 16; i += 1) {
                pen2ColorMap[i] = colorValues[currentInksInSet[i]];
            }
            if (pen2Color32) {
                for (var i = 0; i < 16; i += 1) {
                    var color = pen2ColorMap[i];
                    if (this.littleEndian) {
                        pen2Color32[i] = color[0] + color[1] * 256 + color[2] * 65536 + 255 * 65536 * 256;
                    }
                    else {
                        pen2Color32[i] = color[2] + color[1] * 256 + color[0] * 65536 + 255 * 65536 * 256; // for big endian (untested)
                    }
                }
            }
        };
        Canvas.prototype.updateColorsAndCanvasImmediately = function (inkList) {
            if (this.fnCopy2Canvas) { // not available on e.g. IE8
                var currentInksInSet = this.currentInks[this.inkSet], memorizedInks = currentInksInSet.slice();
                this.currentInks[this.inkSet] = inkList; // temporary inks
                this.updateColorMap();
                this.fnCopy2Canvas(); // do it immediately
                this.currentInks[this.inkSet] = memorizedInks.slice();
                this.updateColorMap();
                this.needUpdate = true; // we want to restore it with the next update...
            }
        };
        Canvas.prototype.updateSpeedInk = function () {
            var pens = this.modeData.pens;
            this.speedInkCount -= 1;
            if (this.speedInkCount <= 0) {
                var currentInkSet = this.inkSet, newInkSet = currentInkSet ^ 1; // eslint-disable-line no-bitwise
                this.inkSet = newInkSet;
                this.speedInkCount = this.speedInk[newInkSet];
                // check for blinking inks which pens are visible in the current mode
                for (var i = 0; i < pens; i += 1) {
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
        };
        Canvas.prototype.setCustomChar = function (char, charData) {
            this.customCharset[char] = charData;
        };
        Canvas.prototype.getCharData = function (char) {
            return this.customCharset[char] || this.options.charset[char];
        };
        Canvas.prototype.setDefaultInks = function () {
            this.currentInks[0] = Canvas.defaultInks[0].slice(); // copy ink set 0 array
            this.currentInks[1] = Canvas.defaultInks[1].slice(); // copy ink set 1 array
            this.updateColorMap();
            this.setGPen(this.gPen);
        };
        Canvas.prototype.setFocusOnCanvas = function () {
            this.cpcAreaBox.style.background = "#463c3c";
            if (this.canvas) {
                this.canvas.focus();
            }
            this.hasFocus = true;
        };
        Canvas.prototype.getMousePos = function (event) {
            var anyDoc = document, isFullScreen = Boolean(document.fullscreenElement || anyDoc.mozFullScreenElement || anyDoc.webkitFullscreenElement || anyDoc.msFullscreenElement), rect = this.canvas.getBoundingClientRect();
            if (isFullScreen) {
                var areaX = 0, //TTT
                areaY = 0, rectwidth = rect.right - rect.left - (this.borderWidth + areaX) * 2, rectHeight = rect.bottom - rect.top - (this.borderWidth + areaY) * 2, ratioX = rectwidth / this.canvas.width, ratioY = rectHeight / this.canvas.height, minRatio = ratioX <= ratioY ? ratioX : ratioY, diffX = rectwidth - (this.canvas.width * minRatio), diffY = rectHeight - (this.canvas.height * minRatio);
                return {
                    x: (event.clientX - this.borderWidth - rect.left - diffX / 2) / ratioX * ratioX / minRatio,
                    y: (event.clientY - this.borderWidth - rect.top - diffY / 2) / ratioY * ratioY / minRatio
                };
            }
            return {
                x: (event.clientX - this.borderWidth - rect.left) / (rect.right - rect.left - this.borderWidth * 2) * this.canvas.width,
                y: (event.clientY - this.borderWidth - rect.top) / (rect.bottom - rect.top - this.borderWidth * 2) * this.canvas.height
            };
        };
        Canvas.prototype.canvasClickAction = function (event) {
            var pos = this.getMousePos(event), 
            /* eslint-disable no-bitwise */
            x = pos.x | 0, // force integer
            y = pos.y | 0;
            /* eslint-enable no-bitwise */
            if (this.options.onCanvasClick) {
                if (x >= 0 && x <= this.width - 1 && y >= 0 && y <= this.height - 1) {
                    var charWidth = this.modeData.pixelWidth * 8, charHeight = this.modeData.pixelHeight * 8, 
                    /* eslint-disable no-bitwise */
                    xTxt = (x / charWidth) | 0, yTxt = (y / charHeight) | 0;
                    /* eslint-enable no-bitwise */
                    this.options.onCanvasClick(event, x, y, xTxt, yTxt);
                }
            }
        };
        Canvas.prototype.onCanvasClick = function (event) {
            if (!this.hasFocus) {
                this.setFocusOnCanvas();
            }
            else {
                this.canvasClickAction(event);
            }
            event.stopPropagation();
        };
        Canvas.prototype.onWindowClick = function (_event) {
            if (this.hasFocus) {
                this.hasFocus = false;
                this.cpcAreaBox.style.background = "";
            }
        };
        Canvas.prototype.getXpos = function () {
            return this.xPos;
        };
        Canvas.prototype.getYpos = function () {
            return this.yPos;
        };
        Canvas.prototype.fillMyRect = function (x, y, width, height, paper) {
            var canvasWidth = this.width, dataset8 = this.dataset8;
            for (var row = 0; row < height; row += 1) {
                var idx = x + (y + row) * canvasWidth;
                dataset8.fill(paper, idx, idx + width);
            }
        };
        Canvas.prototype.fillTextBox = function (left, top, width, height, paper) {
            var charWidth = this.modeData.pixelWidth * 8, charHeight = this.modeData.pixelHeight * 8;
            paper %= this.modeData.pens; // limit papers
            this.fillMyRect(left * charWidth, top * charHeight, width * charWidth, height * charHeight, paper);
            this.setNeedUpdate();
        };
        Canvas.prototype.moveMyRectUp = function (x, y, width, height, x2, y2) {
            var canvasWidth = this.width, dataset8 = this.dataset8;
            for (var row = 0; row < height; row += 1) {
                var idx1 = x + (y + row) * canvasWidth, idx2 = x2 + (y2 + row) * canvasWidth;
                dataset8.copyWithin(idx2, idx1, idx1 + width);
            }
        };
        Canvas.prototype.moveMyRectDown = function (x, y, width, height, x2, y2) {
            var canvasWidth = this.width, dataset8 = this.dataset8;
            for (var row = height - 1; row >= 0; row -= 1) {
                var idx1 = x + (y + row) * canvasWidth, idx2 = x2 + (y2 + row) * canvasWidth;
                dataset8.copyWithin(idx2, idx1, idx1 + width);
            }
        };
        Canvas.prototype.invertChar = function (x, y, pen, paper) {
            var pixelWidth = this.modeData.pixelWidth, pixelHeight = this.modeData.pixelHeight, penXorPaper = pen ^ paper, // eslint-disable-line no-bitwise
            gColMode = 0;
            for (var row = 0; row < 8; row += 1) {
                for (var col = 0; col < 8; col += 1) {
                    var testPen = this.testSubPixel(x + col * pixelWidth, y + row * pixelHeight);
                    testPen ^= penXorPaper; // eslint-disable-line no-bitwise
                    this.setSubPixels(x + col * pixelWidth, y + row * pixelHeight, testPen, gColMode);
                }
            }
        };
        Canvas.prototype.setChar = function (char, x, y, pen, paper, transparent, gColMode, textAtGraphics) {
            var charData = this.customCharset[char] || this.options.charset[char], pixelWidth = this.modeData.pixelWidth, pixelHeight = this.modeData.pixelHeight;
            for (var row = 0; row < 8; row += 1) {
                for (var col = 0; col < 8; col += 1) {
                    var charValue = charData[row], bit = charValue & (0x80 >> col); // eslint-disable-line no-bitwise
                    if (!(transparent && !bit)) { // do not set background pixel in transparent mode
                        var penOrPaper = (bit) ? pen : paper;
                        if (textAtGraphics) {
                            this.setPixel(x + col * pixelWidth, y - row * pixelHeight, penOrPaper, gColMode);
                        }
                        else { // text mode
                            this.setSubPixels(x + col * pixelWidth, y + row * pixelHeight, penOrPaper, gColMode); // colMode always 0 in text mode
                        }
                    }
                }
            }
        };
        Canvas.prototype.readCharData = function (x, y, expectedPen) {
            var charData = [], pixelWidth = this.modeData.pixelWidth, pixelHeight = this.modeData.pixelHeight;
            for (var row = 0; row < 8; row += 1) {
                var charValue = 0;
                for (var col = 0; col < 8; col += 1) {
                    var pen = this.testSubPixel(x + col * pixelWidth, y + row * pixelHeight);
                    if (pen === expectedPen) {
                        charValue |= (0x80 >> col); // eslint-disable-line no-bitwise
                    }
                }
                charData[row] = charValue;
            }
            return charData;
        };
        Canvas.prototype.setSubPixels = function (x, y, gPen, gColMode) {
            var pixelWidth = this.modeData.pixelWidth, pixelHeight = this.modeData.pixelHeight, width = this.width;
            /* eslint-disable no-bitwise */
            x &= ~(pixelWidth - 1); // match CPC pixel
            y &= ~(pixelHeight - 1);
            for (var row = 0; row < pixelHeight; row += 1) {
                var i = x + width * (y + row);
                for (var col = 0; col < pixelWidth; col += 1) {
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
                            Utils_1.Utils.console.warn("setSubPixels: Unknown colMode:", gColMode);
                            break;
                    }
                    i += 1;
                }
            }
            /* eslint-enable no-bitwise */
        };
        Canvas.prototype.setPixel = function (x, y, gPen, gColMode) {
            // some rounding needed before applying origin:
            /* eslint-disable no-bitwise */
            x = x >= 0 ? x & ~(this.modeData.pixelWidth - 1) : -(-x & ~(this.modeData.pixelWidth - 1));
            y = y >= 0 ? y & ~(this.modeData.pixelHeight - 1) : -(-y & ~(this.modeData.pixelHeight - 1));
            /* eslint-enable no-bitwise */
            x += this.xOrig;
            y = this.height - 1 - (y + this.yOrig);
            if (x < this.xLeft || x > this.xRight || y < (this.height - 1 - this.yTop) || y > (this.height - 1 - this.yBottom)) {
                return; // not in graphics window
            }
            this.setSubPixels(x, y, gPen, gColMode);
        };
        Canvas.prototype.setPixelOriginIncluded = function (x, y, gPen, gColMode) {
            if (x < this.xLeft || x > this.xRight || y < (this.height - 1 - this.yTop) || y > (this.height - 1 - this.yBottom)) {
                return; // not in graphics window
            }
            this.setSubPixels(x, y, gPen, gColMode);
        };
        Canvas.prototype.testSubPixel = function (x, y) {
            var i = x + this.width * y, pen = this.dataset8[i];
            return pen;
        };
        Canvas.prototype.testPixel = function (x, y) {
            // some rounding needed before applying origin:
            /* eslint-disable no-bitwise */
            x = x >= 0 ? x & ~(this.modeData.pixelWidth - 1) : -(-x & ~(this.modeData.pixelWidth - 1));
            y = y >= 0 ? y & ~(this.modeData.pixelHeight - 1) : -(-y & ~(this.modeData.pixelHeight - 1));
            /* eslint-enable no-bitwise */
            x += this.xOrig;
            y = this.height - 1 - (y + this.yOrig);
            if (x < this.xLeft || x > this.xRight || y < (this.height - 1 - this.yTop) || y > (this.height - 1 - this.yBottom)) {
                return this.gPaper; // not in graphics window => return graphics paper
            }
            var i = x + this.width * y, pen = this.dataset8[i];
            return pen;
        };
        Canvas.prototype.getByte = function (addr) {
            /* eslint-disable no-bitwise */
            var mode = this.mode, pixelWidth = this.modeData.pixelWidth, pixelHeight = this.modeData.pixelHeight, x = ((addr & 0x7ff) % 80) * 8, y = (((addr & 0x3800) / 0x800) + (((addr & 0x7ff) / 80) | 0) * 8) * pixelHeight;
            var byte = null, // null=cannot read
            gPen;
            if (y < this.height) { // only if in visible range
                if (mode === 0) {
                    gPen = this.dataset8[x + this.width * y];
                    byte = ((gPen >> 2) & 0x02) | ((gPen << 3) & 0x20) | ((gPen << 2) & 0x08) | ((gPen << 7) & 0x80); // b1,b5,b3,b7 (left pixel)
                    gPen = this.dataset8[x + pixelWidth + this.width * y];
                    byte |= ((gPen >> 3) & 0x01) | ((gPen << 2) & 0x10) | ((gPen << 1) & 0x04) | ((gPen << 6) & 0x40); // b0,b4,b2,b6 (right pixel)
                }
                else if (mode === 1) {
                    byte = 0;
                    gPen = this.dataset8[x + this.width * y];
                    byte |= ((gPen & 0x02) << 2) | ((gPen & 0x01) << 7); // b3,b7 (left pixel 1)
                    gPen = this.dataset8[x + pixelWidth + this.width * y];
                    byte |= ((gPen & 0x02) << 1) | ((gPen & 0x01) << 6); // b2,b6 (pixel 2)
                    gPen = this.dataset8[x + pixelWidth * 2 + this.width * y];
                    byte |= ((gPen & 0x02) << 0) | ((gPen & 0x01) << 5); // b1,b5 (pixel 3)
                    gPen = this.dataset8[x + pixelWidth * 3 + this.width * y];
                    byte |= ((gPen & 0x02) >> 1) | ((gPen & 0x01) << 4); // b0,b4 (right pixel 4)
                }
                else if (mode === 2) {
                    byte = 0;
                    for (var i = 0; i <= 7; i += 1) {
                        gPen = this.dataset8[x + i + this.width * y];
                        byte |= (gPen & 0x01) << (7 - i);
                    }
                }
                else { // mode === 3
                }
            }
            /* eslint-enable no-bitwise */
            return byte;
        };
        Canvas.prototype.setByte = function (addr, byte) {
            /* eslint-disable no-bitwise */
            var mode = this.mode, pixelWidth = this.modeData.pixelWidth, pixelHeight = this.modeData.pixelHeight, x = ((addr & 0x7ff) % 80) * 8, y = (((addr & 0x3800) / 0x800) + (((addr & 0x7ff) / 80) | 0) * 8) * pixelHeight, gColMode = 0; // always 0
            var gPen;
            if (y < this.height) { // only if in visible range
                if (mode === 0) {
                    gPen = ((byte << 2) & 0x08) | ((byte >> 3) & 0x04) | ((byte >> 2) & 0x02) | ((byte >> 7) & 0x01); // b1,b5,b3,b7 (left pixel)
                    this.setSubPixels(x, y, gPen, gColMode);
                    gPen = ((byte << 3) & 0x08) | ((byte >> 2) & 0x04) | ((byte >> 1) & 0x02) | ((byte >> 6) & 0x01); // b0,b4,b2,b6 (right pixel)
                    this.setSubPixels(x + pixelWidth, y, gPen, gColMode);
                    this.setNeedUpdate();
                }
                else if (mode === 1) {
                    gPen = ((byte >> 2) & 0x02) | ((byte >> 7) & 0x01); // b3,b7 (left pixel 1)
                    this.setSubPixels(x, y, gPen, gColMode);
                    gPen = ((byte >> 1) & 0x02) | ((byte >> 6) & 0x01); // b2,b6 (pixel 2)
                    this.setSubPixels(x + pixelWidth, y, gPen, gColMode);
                    gPen = ((byte >> 0) & 0x02) | ((byte >> 5) & 0x01); // b1,b5 (pixel 3)
                    this.setSubPixels(x + pixelWidth * 2, y, gPen, gColMode);
                    gPen = ((byte << 1) & 0x02) | ((byte >> 4) & 0x01); // b0,b4 (right pixel 4)
                    this.setSubPixels(x + pixelWidth * 3, y, gPen, gColMode);
                    this.setNeedUpdate();
                }
                else if (mode === 2) {
                    for (var i = 0; i <= 7; i += 1) {
                        gPen = (byte >> (7 - i)) & 0x01;
                        this.setSubPixels(x + i * pixelWidth, y, gPen, gColMode);
                    }
                    this.setNeedUpdate();
                }
                else { // mode === 3 (not supported)
                }
            }
            /* eslint-enable no-bitwise */
        };
        // https://de.wikipedia.org/wiki/Bresenham-Algorithmus
        Canvas.prototype.drawBresenhamLine = function (xstart, ystart, xend, yend) {
            var pixelWidth = this.modeData.pixelWidth, pixelHeight = this.modeData.pixelHeight, gPen = this.gPen, gPaper = this.gPaper, mask = this.mask, maskFirst = this.maskFirst, gColMode = this.gColMode, transparent = this.gTransparent;
            var maskBit = this.maskBit;
            // we have to add origin before modifying coordinates to match CPC pixel
            xstart += this.xOrig;
            ystart = this.height - 1 - (ystart + this.yOrig);
            xend += this.xOrig;
            yend = this.height - 1 - (yend + this.yOrig);
            /* eslint-disable no-bitwise */
            if (xend >= xstart) { // line from left to right
                xend |= (pixelWidth - 1); // match CPC pixel
            }
            else { // line from right to left
                xstart |= (pixelWidth - 1);
            }
            if (yend >= ystart) { // line from bottom to top
                yend |= (pixelHeight - 1);
            }
            else { // line from top to bottom
                ystart |= (pixelHeight - 1);
            }
            var dx = ((xend - xstart) / pixelWidth) | 0, dy = ((yend - ystart) / pixelHeight) | 0;
            /* eslint-enable no-bitwise */
            var incx = Math.sign(dx) * pixelWidth, incy = Math.sign(dy) * pixelHeight;
            if (dx < 0) {
                dx = -dx;
            }
            if (dy < 0) {
                dy = -dy;
            }
            var pdx, pdy, ddx, ddy, deltaslowdirection, deltafastdirection;
            if (dx > dy) {
                pdx = incx;
                pdy = 0;
                ddx = incx;
                ddy = incy;
                deltaslowdirection = dy;
                deltafastdirection = dx;
            }
            else {
                pdx = 0;
                pdy = incy;
                ddx = incx;
                ddy = incy;
                deltaslowdirection = dx;
                deltafastdirection = dy;
            }
            var x = xstart, y = ystart, err = deltafastdirection >> 1; // eslint-disable-line no-bitwise
            if (maskFirst) { // draw first pixel?
                var bit = mask & maskBit; // eslint-disable-line no-bitwise
                if (!(transparent && !bit)) { // do not set background pixel in transparent mode
                    this.setPixelOriginIncluded(x, y, bit ? gPen : gPaper, gColMode); // we expect integers
                }
                // rotate bitpos right
                maskBit = (maskBit >> 1) | ((maskBit << 7) & 0xff); // eslint-disable-line no-bitwise
            }
            for (var t = 0; t < deltafastdirection; t += 1) {
                err -= deltaslowdirection;
                if (err < 0) {
                    err += deltafastdirection;
                    x += ddx;
                    y += ddy;
                }
                else {
                    x += pdx;
                    y += pdy;
                }
                var bit = mask & maskBit; // eslint-disable-line no-bitwise
                if (!(transparent && !bit)) { // do not set background pixel in transparent mode
                    this.setPixelOriginIncluded(x, y, bit ? gPen : gPaper, gColMode); // we expect integers
                }
                // rotate bitpos right
                maskBit = (maskBit >> 1) | ((maskBit << 7) & 0xff); // eslint-disable-line no-bitwise
            }
            this.maskBit = maskBit;
        };
        Canvas.prototype.draw = function (x, y) {
            var xStart = this.xPos, yStart = this.yPos;
            this.move(x, y); // destination
            this.drawBresenhamLine(xStart, yStart, x, y);
            this.setNeedUpdate();
        };
        Canvas.prototype.move = function (x, y) {
            this.xPos = x; // must be integer
            this.yPos = y;
        };
        Canvas.prototype.plot = function (x, y) {
            this.move(x, y);
            this.setPixel(x, y, this.gPen, this.gColMode); // must be integer
            this.setNeedUpdate();
        };
        Canvas.prototype.test = function (x, y) {
            this.move(x, y);
            return this.testPixel(this.xPos, this.yPos); // use rounded values
        };
        Canvas.prototype.setInk = function (pen, ink1, ink2) {
            var needInkUpdate = false;
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
        };
        Canvas.prototype.setBorder = function (ink1, ink2) {
            var needInkUpdate = this.setInk(16, ink1, ink2);
            if (needInkUpdate) {
                this.applyBorderColor();
            }
        };
        Canvas.prototype.setGPen = function (gPen) {
            gPen %= this.modeData.pens; // limit pens
            this.gPen = gPen;
        };
        Canvas.prototype.setGPaper = function (gPaper) {
            gPaper %= this.modeData.pens; // limit pens
            this.gPaper = gPaper;
        };
        Canvas.prototype.setGTransparentMode = function (transparent) {
            this.gTransparent = transparent;
        };
        Canvas.prototype.printGChar = function (char) {
            var charWidth = this.modeData.pixelWidth * 8;
            if (char >= this.options.charset.length) {
                Utils_1.Utils.console.warn("printGChar: Ignoring char with code", char);
                return;
            }
            this.setChar(char, this.xPos, this.yPos, this.gPen, this.gPaper, this.gTransparent, this.gColMode, true);
            this.xPos += charWidth;
            this.setNeedUpdate();
        };
        Canvas.prototype.printChar = function (char, x, y, pen, paper, transparent) {
            var charWidth = this.modeData.pixelWidth * 8, charHeight = this.modeData.pixelHeight * 8, pens = this.modeData.pens;
            if (char >= this.options.charset.length) {
                Utils_1.Utils.console.warn("printChar: Ignoring char with code", char);
                return;
            }
            pen %= pens;
            paper %= pens; // also pens
            this.setChar(char, x * charWidth, y * charHeight, pen, paper, transparent, 0, false);
            this.setNeedUpdate();
        };
        Canvas.prototype.drawCursor = function (x, y, pen, paper) {
            var charWidth = this.modeData.pixelWidth * 8, charHeight = this.modeData.pixelHeight * 8, pens = this.modeData.pens;
            pen %= pens;
            paper %= pens; // also pens
            this.invertChar(x * charWidth, y * charHeight, pen, paper);
            this.setNeedUpdate();
        };
        Canvas.prototype.findMatchingChar = function (charData) {
            var charset = this.options.charset;
            var char = -1; // not detected
            for (var i = 0; i < charset.length; i += 1) {
                var charData2 = this.customCharset[i] || charset[i];
                var match = true;
                for (var j = 0; j < 8; j += 1) {
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
        };
        Canvas.prototype.readChar = function (x, y, pen, paper) {
            var charWidth = this.modeData.pixelWidth * 8, charHeight = this.modeData.pixelHeight * 8, pens = this.modeData.pens;
            pen %= pens;
            paper %= pens; // also pens
            x *= charWidth;
            y *= charHeight;
            var charData = this.readCharData(x, y, pen), char = this.findMatchingChar(charData);
            if (char < 0 || char === 32) { // no match? => check inverse with paper, char=32?
                charData = this.readCharData(x, y, paper);
                for (var i = 0; i < charData.length; i += 1) {
                    charData[i] ^= 0xff; // eslint-disable-line no-bitwise
                }
                var char2 = this.findMatchingChar(charData);
                if (char2 >= 0) {
                    if (char2 === 143) { // invers of space?
                        char2 = 32; // use space
                    }
                    char = char2;
                }
            }
            return char;
        };
        // fill: idea from: https://simpledevcode.wordpress.com/2015/12/29/flood-fill-algorithm-using-c-net/
        Canvas.prototype.fnIsNotInWindow = function (x, y) {
            return (x < this.xLeft || x > this.xRight || y < (this.height - 1 - this.yTop) || y > (this.height - 1 - this.yBottom));
        };
        Canvas.prototype.fill = function (fillPen) {
            var gPen = this.gPen, pixelWidth = this.modeData.pixelWidth, pixelHeight = this.modeData.pixelHeight, pixels = [], fnIsStopPen = function (p) {
                return p === fillPen || p === gPen;
            };
            var xPos = this.xPos, yPos = this.yPos;
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
                var pixel = pixels.pop();
                var y1 = pixel.y, p1 = this.testSubPixel(pixel.x, y1);
                while (y1 >= (this.height - 1 - this.yTop) && !fnIsStopPen(p1)) {
                    y1 -= pixelHeight;
                    p1 = this.testSubPixel(pixel.x, y1);
                }
                y1 += pixelHeight;
                var spanLeft = false, spanRight = false;
                p1 = this.testSubPixel(pixel.x, y1);
                while (y1 <= (this.height - 1 - this.yBottom) && !fnIsStopPen(p1)) {
                    this.setSubPixels(pixel.x, y1, fillPen, 0);
                    var x1 = pixel.x - pixelWidth;
                    var p2 = this.testSubPixel(x1, y1);
                    if (!spanLeft && x1 >= this.xLeft && !fnIsStopPen(p2)) {
                        pixels.push({
                            x: x1,
                            y: y1
                        });
                        spanLeft = true;
                    }
                    else if (spanLeft && ((x1 < this.xLeft) || fnIsStopPen(p2))) {
                        spanLeft = false;
                    }
                    x1 = pixel.x + pixelWidth;
                    var p3 = this.testSubPixel(x1, y1);
                    if (!spanRight && x1 <= this.xRight && !fnIsStopPen(p3)) {
                        pixels.push({
                            x: x1,
                            y: y1
                        });
                        spanRight = true;
                    }
                    else if (spanRight && ((x1 > this.xRight) || fnIsStopPen(p3))) {
                        spanRight = false;
                    }
                    y1 += pixelHeight;
                    p1 = this.testSubPixel(pixel.x, y1);
                }
            }
            this.setNeedUpdate();
        };
        Canvas.fnPutInRange = function (n, min, max) {
            if (n < min) {
                n = min;
            }
            else if (n > max) {
                n = max;
            }
            return n;
        };
        Canvas.prototype.setOrigin = function (xOrig, yOrig) {
            var pixelWidth = this.modeData.pixelWidth;
            xOrig &= ~(pixelWidth - 1); // eslint-disable-line no-bitwise
            this.xOrig = xOrig; // must be integer
            this.yOrig = yOrig;
            this.move(0, 0);
        };
        Canvas.prototype.getXOrigin = function () {
            return this.xOrig;
        };
        Canvas.prototype.getYOrigin = function () {
            return this.yOrig;
        };
        Canvas.prototype.setGWindow = function (xLeft, xRight, yTop, yBottom) {
            var pixelWidth = 8, // force byte boundaries: always 8 x/byte
            pixelHeight = this.modeData.pixelHeight; // usually 2, anly for mode 3 we have 1
            xLeft = Canvas.fnPutInRange(xLeft, 0, this.width - 1);
            xRight = Canvas.fnPutInRange(xRight, 0, this.width - 1);
            yTop = Canvas.fnPutInRange(yTop, 0, this.height - 1);
            yBottom = Canvas.fnPutInRange(yBottom, 0, this.height - 1);
            // exchange coordinates, if needed (left>right or top<bottom)
            if (xRight < xLeft) {
                var tmp = xRight;
                xRight = xLeft;
                xLeft = tmp;
            }
            if (yTop < yBottom) {
                var tmp = yTop;
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
        };
        Canvas.prototype.setGColMode = function (gColMode) {
            if (gColMode !== this.gColMode) {
                this.gColMode = gColMode;
            }
        };
        Canvas.prototype.clearTextWindow = function (left, right, top, bottom, paper) {
            var width = right + 1 - left, height = bottom + 1 - top;
            this.fillTextBox(left, top, width, height, paper);
        };
        Canvas.prototype.clearGraphicsWindow = function () {
            this.fillMyRect(this.xLeft, this.height - 1 - this.yTop, this.xRight + 1 - this.xLeft, this.yTop + 1 - this.yBottom, this.gPaper); // +1 or not?
            this.move(0, 0);
            this.setNeedUpdate();
        };
        Canvas.prototype.clearFullWindow = function () {
            var paper = 0;
            this.fillMyRect(0, 0, this.width, this.height, paper);
            this.setNeedUpdate();
        };
        Canvas.prototype.windowScrollUp = function (left, right, top, bottom, paper) {
            var charWidth = this.modeData.pixelWidth * 8, charHeight = this.modeData.pixelHeight * 8, width = right + 1 - left, height = bottom + 1 - top;
            if (height > 1) { // scroll part
                this.moveMyRectUp(left * charWidth, (top + 1) * charHeight, width * charWidth, (height - 1) * charHeight, left * charWidth, top * charHeight);
            }
            this.fillTextBox(left, bottom, width, 1, paper);
            this.setNeedUpdate();
        };
        Canvas.prototype.windowScrollDown = function (left, right, top, bottom, paper) {
            var charWidth = this.modeData.pixelWidth * 8, charHeight = this.modeData.pixelHeight * 8, width = right + 1 - left, height = bottom + 1 - top;
            if (height > 1) { // scroll part
                this.moveMyRectDown(left * charWidth, top * charHeight, width * charWidth, (height - 1) * charHeight, left * charWidth, (top + 1) * charHeight);
            }
            this.fillTextBox(left, top, width, 1, paper);
            this.setNeedUpdate();
        };
        Canvas.prototype.setSpeedInk = function (time1, time2) {
            this.speedInk[0] = time1;
            this.speedInk[1] = time2;
        };
        Canvas.prototype.setMask = function (mask) {
            this.mask = mask;
            this.maskBit = 128;
        };
        Canvas.prototype.setMaskFirst = function (maskFirst) {
            this.maskFirst = maskFirst;
        };
        Canvas.prototype.getMode = function () {
            return this.mode;
        };
        Canvas.prototype.changeMode = function (mode) {
            var modeData = Canvas.modeData[mode];
            this.mode = mode;
            this.modeData = modeData;
        };
        Canvas.prototype.setMode = function (mode) {
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
        };
        Canvas.prototype.takeScreenShot = function () {
            if (this.canvas.toDataURL) {
                return this.canvas.toDataURL("image/png").replace("image/png", "image/octet-stream"); // here is the most important part because if you do not replace you will get a DOM 18 exception.
            }
            Utils_1.Utils.console.warn("Screenshot not available");
            return "";
        };
        Canvas.prototype.getCanvasElement = function () {
            return this.canvas;
        };
        // http://www.cpcwiki.eu/index.php/CPC_Palette
        // (green and gray palette will be computed if needed)
        Canvas.palettes = {
            color: [
                "#000000",
                "#000080",
                "#0000FF",
                "#800000",
                "#800080",
                "#8000FF",
                "#FF0000",
                "#FF0080",
                "#FF00FF",
                "#008000",
                "#008080",
                "#0080FF",
                "#808000",
                "#808080",
                "#8080FF",
                "#FF8000",
                "#FF8080",
                "#FF80FF",
                "#00FF00",
                "#00FF80",
                "#00FFFF",
                "#80FF00",
                "#80FF80",
                "#80FFFF",
                "#FFFF00",
                "#FFFF80",
                "#FFFFFF",
                "#808080",
                "#FF00FF",
                "#FFFF80",
                "#000080",
                "#00FF80" //  31 Sea Green (same as 19)
            ]
        };
        // mode 0: pen 0-15,16=border; inks for pen 14,15 are alternating: "1,24", "16,11"
        Canvas.defaultInks = [
            [1, 24, 20, 6, 26, 0, 2, 8, 10, 12, 14, 16, 18, 22, 1, 16, 1],
            [1, 24, 20, 6, 26, 0, 2, 8, 10, 12, 14, 16, 18, 22, 24, 11, 1] // eslint-disable-line array-element-newline
        ];
        Canvas.modeData = [
            {
                pens: 16,
                pixelWidth: 4,
                pixelHeight: 2 // pixel height
            },
            {
                pens: 4,
                pixelWidth: 2,
                pixelHeight: 2
            },
            {
                pens: 2,
                pixelWidth: 1,
                pixelHeight: 2
            },
            {
                pens: 16,
                pixelWidth: 1,
                pixelHeight: 1
            }
        ];
        return Canvas;
    }());
    exports.Canvas = Canvas;
});
//# sourceMappingURL=Canvas.js.map