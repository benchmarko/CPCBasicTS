"use strict";
// Canvas.ts - Graphics output to HTML canvas
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//
/* globals ArrayBuffer, Uint8Array, Uint32Array */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Canvas = void 0;
var Utils_1 = require("./Utils");
var View_1 = require("./View");
var Canvas = /** @class */ (function () {
    function Canvas(options) {
        this.iFps = 15; // FPS for canvas update
        this.oCustomCharset = {};
        this.iGColMode = 0; // 0=normal, 1=xor, 2=and, 3=or
        this.iMask = 255;
        this.iMaskBit = 128;
        this.iMaskFirst = 1;
        this.iOffset = 0; // screen offset
        this.iBorderWidth = 4;
        this.bNeedUpdate = false;
        this.bNeedTextUpdate = false;
        this.aCurrentInks = [];
        this.aSpeedInk = [];
        this.iInkSet = 0;
        this.aPen2ColorMap = [];
        this.bLittleEndian = true;
        this.bUse32BitCopy = true; // determined later
        this.iGPen = 0;
        this.iGPaper = 0;
        this.iSpeedInkCount = 0; // usually 10
        this.aTextBuffer = []; // textbuffer characters at row,column
        this.bHasFocus = false; // canvas has focus
        this.iMode = 0;
        this.oModeData = Canvas.aModeData[0];
        this.xPos = 0;
        this.yPos = 0;
        this.xOrig = 0;
        this.yOrig = 0;
        this.xLeft = 0;
        this.xRight = 639;
        this.yTop = 399;
        this.yBottom = 0;
        this.bGTransparent = false;
        this.fnUpdateCanvasHandler = this.updateCanvas.bind(this);
        this.fnUpdateCanvas2Handler = this.updateCanvas2.bind(this);
        this.aCharset = options.aCharset;
        this.onClickKey = options.onClickKey;
        this.cpcAreaBox = View_1.View.getElementById1("cpcAreaBox");
        this.textText = View_1.View.getElementById1("textText"); // View.setAreaValue()
        var canvas = View_1.View.getElementById1("cpcCanvas");
        this.canvas = canvas;
        // make sure canvas is not hidden (allows to get width, height, set style)
        if (canvas.offsetParent === null) {
            Utils_1.Utils.console.error("Error: canvas is not visible!");
        }
        var iWidth = canvas.width, iHeight = canvas.height;
        this.iWidth = iWidth;
        this.iHeight = iHeight;
        canvas.style.borderWidth = this.iBorderWidth + "px";
        canvas.style.borderStyle = "solid";
        this.dataset8 = new Uint8Array(new ArrayBuffer(iWidth * iHeight)); // array with pen values
        this.aColorValues = Canvas.extractAllColorValues(Canvas.aColors);
        this.iAnimationTimeoutId = undefined;
        this.iAnimationFrame = undefined;
        if (this.canvas.getContext) { // not available on e.g. IE8
            this.ctx = this.canvas.getContext("2d");
            this.imageData = this.ctx.getImageData(0, 0, iWidth, iHeight);
            if (typeof Uint32Array !== "undefined" && this.imageData.data.buffer) { // imageData.data.buffer not available on IE10
                this.bLittleEndian = Canvas.isLittleEndian();
                this.aPen2Color32 = new Uint32Array(new ArrayBuffer(Canvas.aModeData[3].iPens * 4));
                this.aData32 = new Uint32Array(this.imageData.data.buffer);
                this.bUse32BitCopy = true;
                Utils_1.Utils.console.log("Canvas: using optimized copy2Canvas32bit, littleEndian:", this.bLittleEndian);
            }
            else {
                this.setAlpha(255);
                this.bUse32BitCopy = false;
                Utils_1.Utils.console.log("Canvas: using copy2Canvas8bit");
            }
            this.applyCopy2CanvasFunction(this.iOffset);
        }
        else {
            Utils_1.Utils.console.warn("Error: canvas.getContext is not supported.");
            this.ctx = {}; // not available
            this.imageData = {}; // not available
        }
        this.reset();
    }
    Canvas.prototype.reset = function () {
        this.resetTextBuffer();
        this.setNeedTextUpdate();
        this.changeMode(1);
        //this.iGPen = undefined; //TTT undefined to force update
        //this.iGPaper = undefined; //TTT
        this.iInkSet = 0;
        this.setDefaultInks();
        this.aSpeedInk[0] = 10;
        this.aSpeedInk[1] = 10;
        this.iSpeedInkCount = this.aSpeedInk[this.iInkSet];
        this.canvas.style.borderColor = Canvas.aColors[this.aCurrentInks[this.iInkSet][16]];
        this.setGPen(1);
        this.setGPaper(0);
        this.resetCustomChars();
        this.setMode(1);
        this.clearGraphicsWindow();
    };
    Canvas.prototype.resetCustomChars = function () {
        this.oCustomCharset = {}; // symbol
    };
    Canvas.prototype.resetTextBuffer = function () {
        this.aTextBuffer.length = 0;
    };
    Canvas.isLittleEndian = function () {
        // https://gist.github.com/TooTallNate/4750953
        var b = new ArrayBuffer(4), a = new Uint32Array(b), c = new Uint8Array(b);
        a[0] = 0xdeadbeef;
        return (c[0] === 0xef);
    };
    Canvas.extractColorValues = function (sColor) {
        return [
            parseInt(sColor.substring(1, 3), 16),
            parseInt(sColor.substring(3, 5), 16),
            parseInt(sColor.substring(5, 7), 16)
        ];
    };
    Canvas.extractAllColorValues = function (aColors) {
        var aColorValues = [];
        for (var i = 0; i < aColors.length; i += 1) {
            aColorValues[i] = Canvas.extractColorValues(aColors[i]);
        }
        return aColorValues;
    };
    Canvas.prototype.setAlpha = function (iAlpha) {
        var buf8 = this.imageData.data, iLength = this.dataset8.length; // or: this.iWidth * this.iHeight
        for (var i = 0; i < iLength; i += 1) {
            buf8[i * 4 + 3] = iAlpha; // alpha
        }
    };
    Canvas.prototype.setNeedUpdate = function () {
        this.bNeedUpdate = true;
    };
    Canvas.prototype.setNeedTextUpdate = function () {
        this.bNeedTextUpdate = true;
    };
    Canvas.prototype.updateCanvas2 = function () {
        this.iAnimationFrame = requestAnimationFrame(this.fnUpdateCanvasHandler);
        if (this.bNeedUpdate) { // could be improved: update only updateRect
            this.bNeedUpdate = false;
            // we always do a full updateCanvas...
            if (this.fnCopy2Canvas) { // not available on e.g. IE8
                this.fnCopy2Canvas();
            }
        }
        if (this.textText.offsetParent) { // text area visible?
            if (this.bNeedTextUpdate) {
                this.bNeedTextUpdate = false;
                this.updateTextWindow();
            }
        }
    };
    // http://creativejs.com/resources/requestanimationframe/ (set frame rate)
    // https://stackoverflow.com/questions/19764018/controlling-fps-with-requestanimationframe
    Canvas.prototype.updateCanvas = function () {
        this.iAnimationTimeoutId = setTimeout(this.fnUpdateCanvas2Handler, 1000 / this.iFps);
    };
    Canvas.prototype.startUpdateCanvas = function () {
        if (this.iAnimationFrame === undefined && this.canvas.offsetParent !== null) { // animation off and canvas visible in DOM?
            this.updateCanvas();
        }
    };
    Canvas.prototype.stopUpdateCanvas = function () {
        if (this.iAnimationFrame !== undefined) {
            cancelAnimationFrame(this.iAnimationFrame);
            clearTimeout(this.iAnimationTimeoutId);
            this.iAnimationFrame = undefined;
            this.iAnimationTimeoutId = undefined;
        }
    };
    Canvas.prototype.copy2Canvas8bit = function () {
        var buf8 = this.imageData.data, // use Uint8ClampedArray from canvas
        dataset8 = this.dataset8, iLength = dataset8.length, // or: this.iWidth * this.iHeight
        aPen2ColorMap = this.aPen2ColorMap;
        for (var i = 0; i < iLength; i += 1) {
            var aColor = aPen2ColorMap[dataset8[i]], j = i * 4;
            buf8[j] = aColor[0]; // r
            buf8[j + 1] = aColor[1]; // g
            buf8[j + 2] = aColor[2]; // b
            // alpha already set to 255
        }
        this.ctx.putImageData(this.imageData, 0, 0);
    };
    Canvas.prototype.copy2Canvas32bit = function () {
        var dataset8 = this.dataset8, aData32 = this.aData32, aPen2Color32 = this.aPen2Color32;
        for (var i = 0; i < aData32.length; i += 1) {
            aData32[i] = aPen2Color32[dataset8[i]];
        }
        this.ctx.putImageData(this.imageData, 0, 0);
    };
    Canvas.prototype.copy2Canvas32bitWithOffset = function () {
        var dataset8 = this.dataset8, aData32 = this.aData32, aPen2Color32 = this.aPen2Color32, iOffset = this.iOffset;
        for (var i = 0; i < aData32.length - iOffset; i += 1) {
            aData32[i + iOffset] = aPen2Color32[dataset8[i]];
        }
        for (var i = aData32.length - iOffset; i < aData32.length; i += 1) {
            aData32[i + iOffset - aData32.length] = aPen2Color32[dataset8[i]];
        }
        this.ctx.putImageData(this.imageData, 0, 0);
    };
    Canvas.prototype.applyCopy2CanvasFunction = function (iOffset) {
        if (this.bUse32BitCopy) {
            this.fnCopy2Canvas = iOffset ? this.copy2Canvas32bitWithOffset : this.copy2Canvas32bit;
        }
        else {
            this.fnCopy2Canvas = iOffset ? this.copy2Canvas8bit : this.copy2Canvas8bit; // TODO: for older browsers
        }
    };
    Canvas.prototype.setScreenOffset = function (iOffset) {
        if (iOffset) {
            // TODO
            iOffset = (iOffset % 80) * 8 + ((iOffset / 80) | 0) * 80 * 16 * 8; // eslint-disable-line no-bitwise
            iOffset = 640 * 400 - iOffset;
        }
        if (iOffset !== this.iOffset) {
            this.iOffset = iOffset;
            this.applyCopy2CanvasFunction(iOffset);
            this.setNeedUpdate();
        }
    };
    Canvas.prototype.updateTextWindow = function () {
        var aTextBuffer = this.aTextBuffer, sCpc2Unicode = Canvas.sCpc2Unicode;
        var sOut = "";
        for (var y = 0; y < aTextBuffer.length; y += 1) {
            var aTextBufferRow = aTextBuffer[y];
            if (aTextBufferRow) {
                for (var x = 0; x < aTextBufferRow.length; x += 1) {
                    sOut += sCpc2Unicode[aTextBufferRow[x] || 32];
                }
            }
            sOut += "\n";
        }
        this.textText.value = sOut;
    };
    Canvas.prototype.updateColorMap = function () {
        var aColorValues = this.aColorValues, aCurrentInksInSet = this.aCurrentInks[this.iInkSet], aPen2ColorMap = this.aPen2ColorMap, aPen2Color32 = this.aPen2Color32;
        for (var i = 0; i < 16; i += 1) {
            aPen2ColorMap[i] = aColorValues[aCurrentInksInSet[i]];
        }
        if (aPen2Color32) {
            for (var i = 0; i < 16; i += 1) {
                var aColor = aPen2ColorMap[i];
                if (this.bLittleEndian) {
                    aPen2Color32[i] = aColor[0] + aColor[1] * 256 + aColor[2] * 65536 + 255 * 65536 * 256;
                }
                else {
                    aPen2Color32[i] = aColor[2] + aColor[1] * 256 + aColor[0] * 65536 + 255 * 65536 * 256; // for big endian (untested)
                }
            }
        }
    };
    Canvas.prototype.updateSpeedInk = function () {
        var iPens = this.oModeData.iPens;
        this.iSpeedInkCount -= 1;
        if (this.iSpeedInkCount <= 0) {
            var iCurrentInkSet = this.iInkSet, iNewInkSet = iCurrentInkSet ^ 1; // eslint-disable-line no-bitwise
            this.iInkSet = iNewInkSet;
            this.iSpeedInkCount = this.aSpeedInk[iNewInkSet];
            // check for blinking inks which pens are visible in the current mode
            for (var i = 0; i < iPens; i += 1) {
                if (this.aCurrentInks[iNewInkSet][i] !== this.aCurrentInks[iCurrentInkSet][i]) {
                    this.updateColorMap(); // need ink update
                    this.bNeedUpdate = true; // we also need update
                    break;
                }
            }
            // check border ink
            if (this.aCurrentInks[iNewInkSet][16] !== this.aCurrentInks[iCurrentInkSet][16]) {
                this.canvas.style.borderColor = Canvas.aColors[this.aCurrentInks[iNewInkSet][16]];
            }
        }
    };
    Canvas.prototype.setCustomChar = function (iChar, aCharData) {
        this.oCustomCharset[iChar] = aCharData;
    };
    Canvas.prototype.getCharData = function (iChar) {
        var aCharData = this.oCustomCharset[iChar] || this.aCharset[iChar];
        return aCharData;
    };
    Canvas.prototype.setDefaultInks = function () {
        this.aCurrentInks[0] = Canvas.aDefaultInks[0].slice(); // copy ink set 0 array
        this.aCurrentInks[1] = Canvas.aDefaultInks[1].slice(); // copy ink set 1 array
        this.updateColorMap();
        this.setGPen(this.iGPen);
    };
    Canvas.prototype.setFocusOnCanvas = function () {
        this.cpcAreaBox.style.background = "#463c3c";
        if (this.canvas) {
            this.canvas.focus();
        }
        this.bHasFocus = true;
    };
    Canvas.prototype.getMousePos = function (event) {
        var oRect = this.canvas.getBoundingClientRect(), oPos = {
            x: event.clientX - this.iBorderWidth - oRect.left,
            y: event.clientY - this.iBorderWidth - oRect.top
        };
        return oPos;
    };
    Canvas.prototype.canvasClickAction2 = function (event) {
        var oPos = this.getMousePos(event), iCharWidth = this.oModeData.iPixelWidth * 8, iCharHeight = this.oModeData.iPixelHeight * 8;
        var x = oPos.x, y = oPos.y;
        /* eslint-disable no-bitwise */
        x |= 0; // force integer
        y |= 0;
        var xTxt = (x / iCharWidth) | 0, yTxt = (y / iCharHeight) | 0;
        /* eslint-enable no-bitwise */
        var iChar = this.getCharFromTextBuffer(xTxt, yTxt); // is there a character an the click position?
        if (iChar === undefined && event.detail === 2) { // no char but mouse double click?
            iChar = 13; // use CR
        }
        if (iChar !== undefined && this.onClickKey) { // call click handler (put char in keyboard input buffer)
            this.onClickKey(String.fromCharCode(iChar));
        }
        // for graphics coordinates, adapt origin
        x -= this.xOrig;
        y = this.iHeight - 1 - (y + this.yOrig);
        if (this.xPos === 1000 && this.yPos === 1000) { // only activate move if pos is 1000, 1000
            this.move(x, y);
        }
        if (Utils_1.Utils.debug > 0) {
            Utils_1.Utils.console.debug("onCpcCanvasClick: x-xOrig", x, "y-yOrig", y, "iChar", iChar, "char", (iChar !== undefined ? String.fromCharCode(iChar) : "?"), "detail", event.detail);
        }
    };
    Canvas.prototype.onCpcCanvasClick = function (event) {
        if (!this.bHasFocus) {
            this.setFocusOnCanvas();
        }
        else {
            this.canvasClickAction2(event);
        }
        event.stopPropagation();
    };
    Canvas.prototype.onWindowClick = function (_event) {
        if (this.bHasFocus) {
            this.bHasFocus = false;
            this.cpcAreaBox.style.background = "";
        }
    };
    Canvas.prototype.getXpos = function () {
        return this.xPos;
    };
    Canvas.prototype.getYpos = function () {
        return this.yPos;
    };
    Canvas.prototype.fillMyRect = function (x, y, iWidth, iHeight, iPen) {
        var iCanvasWidth = this.iWidth, dataset8 = this.dataset8;
        for (var row = 0; row < iHeight; row += 1) {
            for (var col = 0; col < iWidth; col += 1) {
                var idx = (x + col) + (y + row) * iCanvasWidth;
                dataset8[idx] = iPen;
            }
        }
    };
    Canvas.prototype.fillTextBox = function (iLeft, iTop, iWidth, iHeight, iPen) {
        var iCharWidth = this.oModeData.iPixelWidth * 8, iCharHeight = this.oModeData.iPixelHeight * 8;
        this.fillMyRect(iLeft * iCharWidth, iTop * iCharHeight, iWidth * iCharWidth, iHeight * iCharHeight, iPen);
        this.clearTextBufferBox(iLeft, iTop, iWidth, iHeight);
        this.setNeedUpdate();
    };
    Canvas.prototype.moveMyRectUp = function (x, y, iWidth, iHeight, x2, y2) {
        var iCanvasWidth = this.iWidth, dataset8 = this.dataset8;
        for (var row = 0; row < iHeight; row += 1) {
            var idx1 = x + (y + row) * iCanvasWidth, idx2 = x2 + (y2 + row) * iCanvasWidth;
            for (var col = 0; col < iWidth; col += 1) {
                dataset8[idx2 + col] = dataset8[idx1 + col];
            }
        }
    };
    Canvas.prototype.moveMyRectDown = function (x, y, iWidth, iHeight, x2, y2) {
        var iCanvasWidth = this.iWidth, dataset8 = this.dataset8;
        for (var row = iHeight - 1; row >= 0; row -= 1) {
            var idx1 = x + (y + row) * iCanvasWidth, idx2 = x2 + (y2 + row) * iCanvasWidth;
            for (var col = 0; col < iWidth; col += 1) {
                dataset8[idx2 + col] = dataset8[idx1 + col];
            }
        }
    };
    Canvas.prototype.invertChar = function (x, y, iPen, iPaper) {
        var iPixelWidth = this.oModeData.iPixelWidth, iPixelHeight = this.oModeData.iPixelHeight, iPenXorPaper = iPen ^ iPaper, // eslint-disable-line no-bitwise
        iGColMode = 0;
        for (var row = 0; row < 8; row += 1) {
            for (var col = 0; col < 8; col += 1) {
                var iTestPen = this.testSubPixel(x + col * iPixelWidth, y + row * iPixelHeight);
                iTestPen ^= iPenXorPaper; // eslint-disable-line no-bitwise
                this.setSubPixels(x + col * iPixelWidth, y + row * iPixelHeight, iTestPen, iGColMode);
            }
        }
    };
    Canvas.prototype.setChar = function (iChar, x, y, iPen, iPaper, bTransparent, iGColMode, bTextAtGraphics) {
        var aCharData = this.oCustomCharset[iChar] || this.aCharset[iChar], iPixelWidth = this.oModeData.iPixelWidth, iPixelHeight = this.oModeData.iPixelHeight;
        for (var row = 0; row < 8; row += 1) {
            for (var col = 0; col < 8; col += 1) {
                var iCharData = aCharData[row], iBit = iCharData & (0x80 >> col); // eslint-disable-line no-bitwise
                if (!(bTransparent && !iBit)) { // do not set background pixel in transparent mode
                    var iPenOrPaper = (iBit) ? iPen : iPaper;
                    if (bTextAtGraphics) {
                        this.setPixel(x + col * iPixelWidth, y - row * iPixelHeight, iPenOrPaper, iGColMode);
                    }
                    else { // text mode
                        this.setSubPixels(x + col * iPixelWidth, y + row * iPixelHeight, iPenOrPaper, iGColMode); // iColMode always 0 in text mode
                    }
                }
            }
        }
    };
    Canvas.prototype.readCharData = function (x, y, iExpectedPen) {
        var aCharData = [], iPixelWidth = this.oModeData.iPixelWidth, iPixelHeight = this.oModeData.iPixelHeight;
        for (var row = 0; row < 8; row += 1) {
            var iCharData = 0;
            for (var col = 0; col < 8; col += 1) {
                var iPen = this.testSubPixel(x + col * iPixelWidth, y + row * iPixelHeight);
                if (iPen === iExpectedPen) {
                    iCharData |= (0x80 >> col); // eslint-disable-line no-bitwise
                }
            }
            aCharData[row] = iCharData;
        }
        return aCharData;
    };
    Canvas.prototype.setSubPixels = function (x, y, iGPen, iGColMode) {
        var iPixelWidth = this.oModeData.iPixelWidth, iPixelHeight = this.oModeData.iPixelHeight, iWidth = this.iWidth;
        /* eslint-disable no-bitwise */
        x &= ~(iPixelWidth - 1); // match CPC pixel
        y &= ~(iPixelHeight - 1);
        for (var row = 0; row < iPixelHeight; row += 1) {
            var i = x + iWidth * (y + row);
            for (var col = 0; col < iPixelWidth; col += 1) {
                switch (iGColMode) {
                    case 0: // normal
                        this.dataset8[i] = iGPen;
                        break;
                    case 1: // xor
                        this.dataset8[i] ^= iGPen;
                        break;
                    case 2: // and
                        this.dataset8[i] &= iGPen;
                        break;
                    case 3: // or
                        this.dataset8[i] |= iGPen;
                        break;
                    default:
                        Utils_1.Utils.console.warn("setSubPixels: Unknown colMode:", iGColMode);
                        break;
                }
                i += 1;
            }
        }
        /* eslint-enable no-bitwise */
    };
    Canvas.prototype.setPixel = function (x, y, iGPen, iGColMode) {
        x += this.xOrig;
        y = this.iHeight - 1 - (y + this.yOrig);
        if (x < this.xLeft || x > this.xRight || y < (this.iHeight - 1 - this.yTop) || y > (this.iHeight - 1 - this.yBottom)) {
            return; // not in graphics window
        }
        this.setSubPixels(x, y, iGPen, iGColMode);
    };
    Canvas.prototype.setPixelOriginIncluded = function (x, y, iGPen, iGColMode) {
        if (x < this.xLeft || x > this.xRight || y < (this.iHeight - 1 - this.yTop) || y > (this.iHeight - 1 - this.yBottom)) {
            return; // not in graphics window
        }
        this.setSubPixels(x, y, iGPen, iGColMode);
    };
    Canvas.prototype.testSubPixel = function (x, y) {
        var i = x + this.iWidth * y, iPen = this.dataset8[i];
        return iPen;
    };
    Canvas.prototype.testPixel = function (x, y) {
        x += this.xOrig;
        y = this.iHeight - 1 - (y + this.yOrig);
        if (x < this.xLeft || x > this.xRight || y < (this.iHeight - 1 - this.yTop) || y > (this.iHeight - 1 - this.yBottom)) {
            return this.iGPaper; // not in graphics window => return graphics paper
        }
        var i = x + this.iWidth * y, iPen = this.dataset8[i];
        return iPen;
    };
    Canvas.prototype.getByte = function (iAddr) {
        /* eslint-disable no-bitwise */
        var iMode = this.iMode, iPixelWidth = this.oModeData.iPixelWidth, iPixelHeight = this.oModeData.iPixelHeight, x = ((iAddr & 0x7ff) % 80) * 8, y = (((iAddr & 0x3800) / 0x800) + (((iAddr & 0x7ff) / 80) | 0) * 8) * iPixelHeight;
        var iByte = null, // null=cannot read
        iGPen;
        if (y < this.iHeight) { // only if in visible range
            if (iMode === 0) {
                iGPen = this.dataset8[x + this.iWidth * y];
                iByte = ((iGPen >> 2) & 0x02) | ((iGPen << 3) & 0x20) | ((iGPen << 2) & 0x08) | ((iGPen << 7) & 0x80); // b1,b5,b3,b7 (left pixel)
                iGPen = this.dataset8[x + iPixelWidth + this.iWidth * y];
                iByte |= ((iGPen >> 3) & 0x01) | ((iGPen << 2) & 0x10) | ((iGPen << 1) & 0x04) | ((iGPen << 6) & 0x40); // b0,b4,b2,b6 (right pixel)
            }
            else if (iMode === 1) {
                iByte = 0;
                iGPen = this.dataset8[x + this.iWidth * y];
                iByte |= ((iGPen & 0x02) << 2) | ((iGPen & 0x01) << 7); // b3,b7 (left pixel 1)
                iGPen = this.dataset8[x + iPixelWidth + this.iWidth * y];
                iByte |= ((iGPen & 0x02) << 1) | ((iGPen & 0x01) << 6); // b2,b6 (pixel 2)
                iGPen = this.dataset8[x + iPixelWidth * 2 + this.iWidth * y];
                iByte |= ((iGPen & 0x02) << 0) | ((iGPen & 0x01) << 5); // b1,b5 (pixel 3)
                iGPen = this.dataset8[x + iPixelWidth * 3 + this.iWidth * y];
                iByte |= ((iGPen & 0x02) >> 1) | ((iGPen & 0x01) << 4); // b0,b4 (right pixel 4)
            }
            else if (iMode === 2) {
                iByte = 0;
                for (var i = 0; i <= 7; i += 1) {
                    iGPen = this.dataset8[x + i + this.iWidth * y];
                    iByte |= (iGPen & 0x01) << (7 - i);
                }
            }
            else { // iMode === 3
            }
        }
        /* eslint-enable no-bitwise */
        return iByte;
    };
    Canvas.prototype.setByte = function (iAddr, iByte) {
        /* eslint-disable no-bitwise */
        var iMode = this.iMode, iPixelWidth = this.oModeData.iPixelWidth, iPixelHeight = this.oModeData.iPixelHeight, x = ((iAddr & 0x7ff) % 80) * 8, y = (((iAddr & 0x3800) / 0x800) + (((iAddr & 0x7ff) / 80) | 0) * 8) * iPixelHeight, iGColMode = 0; // always 0
        var iGPen;
        if (y < this.iHeight) { // only if in visible range
            if (iMode === 0) {
                iGPen = ((iByte << 2) & 0x08) | ((iByte >> 3) & 0x04) | ((iByte >> 2) & 0x02) | ((iByte >> 7) & 0x01); // b1,b5,b3,b7 (left pixel)
                this.setSubPixels(x, y, iGPen, iGColMode);
                iGPen = ((iByte << 3) & 0x08) | ((iByte >> 2) & 0x04) | ((iByte >> 1) & 0x02) | ((iByte >> 6) & 0x01); // b0,b4,b2,b6 (right pixel)
                this.setSubPixels(x + iPixelWidth, y, iGPen, iGColMode);
                this.setNeedUpdate();
            }
            else if (iMode === 1) {
                iGPen = ((iByte >> 2) & 0x02) | ((iByte >> 7) & 0x01); // b3,b7 (left pixel 1)
                this.setSubPixels(x, y, iGPen, iGColMode);
                iGPen = ((iByte >> 1) & 0x02) | ((iByte >> 6) & 0x01); // b2,b6 (pixel 2)
                this.setSubPixels(x + iPixelWidth, y, iGPen, iGColMode);
                iGPen = ((iByte >> 0) & 0x02) | ((iByte >> 5) & 0x01); // b1,b5 (pixel 3)
                this.setSubPixels(x + iPixelWidth * 2, y, iGPen, iGColMode);
                iGPen = ((iByte << 1) & 0x02) | ((iByte >> 4) & 0x01); // b0,b4 (right pixel 4)
                this.setSubPixels(x + iPixelWidth * 3, y, iGPen, iGColMode);
                this.setNeedUpdate();
            }
            else if (iMode === 2) {
                for (var i = 0; i <= 7; i += 1) {
                    iGPen = (iByte >> (7 - i)) & 0x01;
                    this.setSubPixels(x + i * iPixelWidth, y, iGPen, iGColMode);
                }
                this.setNeedUpdate();
            }
            else { // iMode === 3 (not supported)
            }
        }
        /* eslint-enable no-bitwise */
    };
    // https://de.wikipedia.org/wiki/Bresenham-Algorithmus
    Canvas.prototype.drawBresenhamLine = function (xstart, ystart, xend, yend) {
        var iPixelWidth = this.oModeData.iPixelWidth, iPixelHeight = this.oModeData.iPixelHeight, iGPen = this.iGPen, iGPaper = this.iGPaper, iMask = this.iMask, iMaskFirst = this.iMaskFirst, iGColMode = this.iGColMode, bTransparent = this.bGTransparent;
        var iMaskBit = this.iMaskBit;
        // we have to add origin before modifying coordinates to match CPC pixel
        xstart += this.xOrig;
        ystart = this.iHeight - 1 - (ystart + this.yOrig);
        xend += this.xOrig;
        yend = this.iHeight - 1 - (yend + this.yOrig);
        /* eslint-disable no-bitwise */
        if (xend >= xstart) { // line from left to right
            xend |= (iPixelWidth - 1); // match CPC pixel
        }
        else { // line from right to left
            xstart |= (iPixelWidth - 1);
        }
        if (yend >= ystart) { // line from bottom to top
            yend |= (iPixelHeight - 1);
        }
        else { // line from top to bottom
            ystart |= (iPixelHeight - 1);
        }
        var dx = ((xend - xstart) / iPixelWidth) | 0, dy = ((yend - ystart) / iPixelHeight) | 0;
        /* eslint-enable no-bitwise */
        var incx = Math.sign(dx) * iPixelWidth, incy = Math.sign(dy) * iPixelHeight;
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
        if (iMaskFirst) { // draw first pixel?
            var iBit = iMask & iMaskBit; // eslint-disable-line no-bitwise
            if (!(bTransparent && !iBit)) { // do not set background pixel in transparent mode
                this.setPixelOriginIncluded(x, y, iBit ? iGPen : iGPaper, iGColMode); // we expect integers
            }
            // rotate bitpos right
            iMaskBit = (iMaskBit >> 1) | ((iMaskBit << 7) & 0xff); // eslint-disable-line no-bitwise
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
            var iBit = iMask & iMaskBit; // eslint-disable-line no-bitwise
            if (!(bTransparent && !iBit)) { // do not set background pixel in transparent mode
                this.setPixelOriginIncluded(x, y, iBit ? iGPen : iGPaper, iGColMode); // we expect integers
            }
            // rotate bitpos right
            iMaskBit = (iMaskBit >> 1) | ((iMaskBit << 7) & 0xff); // eslint-disable-line no-bitwise
        }
        this.iMaskBit = iMaskBit;
    };
    Canvas.prototype.draw = function (x, y) {
        var xStart = this.xPos, yStart = this.yPos;
        this.move(x, y); // destination, round values
        this.drawBresenhamLine(xStart, yStart, this.xPos, this.yPos);
        this.setNeedUpdate();
    };
    Canvas.prototype.drawr = function (x, y) {
        x += this.xPos;
        y += this.yPos;
        this.draw(x, y);
    };
    Canvas.prototype.move = function (x, y) {
        this.xPos = x; // must be integer
        this.yPos = y;
    };
    Canvas.prototype.mover = function (x, y) {
        x += this.xPos;
        y += this.yPos;
        this.move(x, y);
    };
    Canvas.prototype.plot = function (x, y) {
        this.move(x, y);
        this.setPixel(x, y, this.iGPen, this.iGColMode); // must be integer
        this.setNeedUpdate();
    };
    Canvas.prototype.plotr = function (x, y) {
        x += this.xPos;
        y += this.yPos;
        this.plot(x, y);
    };
    Canvas.prototype.test = function (x, y) {
        this.move(x, y);
        return this.testPixel(this.xPos, this.yPos); // use rounded values
    };
    Canvas.prototype.testr = function (x, y) {
        x += this.xPos;
        y += this.yPos;
        return this.test(x, y);
    };
    Canvas.prototype.setInk = function (iPen, iInk1, iInk2) {
        var bNeedInkUpdate = false;
        if (this.aCurrentInks[0][iPen] !== iInk1) {
            this.aCurrentInks[0][iPen] = iInk1;
            bNeedInkUpdate = true;
        }
        if (this.aCurrentInks[1][iPen] !== iInk2) {
            this.aCurrentInks[1][iPen] = iInk2;
            bNeedInkUpdate = true;
        }
        if (bNeedInkUpdate) {
            this.updateColorMap();
            this.setNeedUpdate(); // we need to notify that an update is needed
        }
        return bNeedInkUpdate;
    };
    Canvas.prototype.setBorder = function (iInk1, iInk2) {
        var bNeedInkUpdate = this.setInk(16, iInk1, iInk2);
        if (bNeedInkUpdate) {
            this.canvas.style.borderColor = Canvas.aColors[this.aCurrentInks[this.iInkSet][16]];
        }
    };
    Canvas.prototype.setGPen = function (iGPen) {
        iGPen %= this.oModeData.iPens; // limit pens
        this.iGPen = iGPen;
    };
    Canvas.prototype.setGPaper = function (iGPaper) {
        iGPaper %= this.oModeData.iPens; // limit pens
        this.iGPaper = iGPaper;
    };
    Canvas.prototype.setGTransparentMode = function (bTransparent) {
        this.bGTransparent = bTransparent;
    };
    Canvas.prototype.printGChar = function (iChar) {
        var iCharWidth = this.oModeData.iPixelWidth * 8;
        if (iChar >= this.aCharset.length) {
            Utils_1.Utils.console.warn("printGChar: Ignoring char with code", iChar);
            return;
        }
        this.setChar(iChar, this.xPos, this.yPos, this.iGPen, this.iGPaper, this.bGTransparent, this.iGColMode, true);
        this.xPos += iCharWidth;
        this.setNeedUpdate();
    };
    Canvas.prototype.clearTextBufferBox = function (iLeft, iTop, iWidth, iHeight) {
        var aTextBuffer = this.aTextBuffer;
        for (var y = iTop; y < iTop + iHeight; y += 1) {
            var aTextBufferRow = aTextBuffer[y];
            if (aTextBufferRow) {
                for (var x = iLeft; x < iLeft + iWidth; x += 1) {
                    delete aTextBufferRow[x];
                }
            }
        }
        this.setNeedTextUpdate();
    };
    Canvas.prototype.copyTextBufferBoxUp = function (iLeft, iTop, iWidth, iHeight, iLeft2, iTop2) {
        var aTextBuffer = this.aTextBuffer;
        for (var y = 0; y < iHeight; y += 1) {
            var aTextBufferRow1 = aTextBuffer[iTop + y];
            if (aTextBufferRow1) {
                var aTextBufferRow2 = aTextBuffer[iTop2 + y];
                if (!aTextBufferRow2) {
                    aTextBufferRow2 = [];
                    aTextBuffer[iTop2 + y] = aTextBufferRow2;
                }
                for (var x = 0; x < iWidth; x += 1) {
                    aTextBufferRow2[iLeft2 + x] = aTextBufferRow1[iLeft + x];
                }
            }
        }
        this.setNeedTextUpdate();
    };
    Canvas.prototype.copyTextBufferBoxDown = function (iLeft, iTop, iWidth, iHeight, iLeft2, iTop2) {
        var aTextBuffer = this.aTextBuffer;
        for (var y = iHeight - 1; y >= 0; y -= 1) {
            var aTextBufferRow1 = aTextBuffer[iTop + y];
            if (aTextBufferRow1) {
                var aTextBufferRow2 = aTextBuffer[iTop2 + y];
                if (!aTextBufferRow2) {
                    aTextBufferRow2 = [];
                    aTextBuffer[iTop2 + y] = aTextBufferRow2;
                }
                for (var x = 0; x < iWidth; x += 1) {
                    aTextBufferRow2[iLeft2 + x] = aTextBufferRow1[iLeft + x];
                }
            }
        }
        this.setNeedTextUpdate();
    };
    Canvas.prototype.putCharInTextBuffer = function (iChar, x, y) {
        var aTextBuffer = this.aTextBuffer;
        if (!aTextBuffer[y]) {
            aTextBuffer[y] = [];
        }
        this.aTextBuffer[y][x] = iChar;
        this.setNeedTextUpdate();
    };
    Canvas.prototype.getCharFromTextBuffer = function (x, y) {
        var aTextBuffer = this.aTextBuffer;
        var iChar;
        if (aTextBuffer[y]) {
            iChar = this.aTextBuffer[y][x]; // can be undefined, if not set
        }
        return iChar;
    };
    Canvas.prototype.printChar = function (iChar, x, y, iPen, iPaper, bTransparent) {
        var iCharWidth = this.oModeData.iPixelWidth * 8, iCharHeight = this.oModeData.iPixelHeight * 8, iPens = this.oModeData.iPens;
        this.putCharInTextBuffer(iChar, x, y);
        if (iChar >= this.aCharset.length) {
            Utils_1.Utils.console.warn("printChar: Ignoring char with code", iChar);
            return;
        }
        iPen %= iPens;
        iPaper %= iPens; // also pens
        this.setChar(iChar, x * iCharWidth, y * iCharHeight, iPen, iPaper, bTransparent, 0, false);
        this.setNeedUpdate();
    };
    Canvas.prototype.drawCursor = function (x, y, iPen, iPaper) {
        var iCharWidth = this.oModeData.iPixelWidth * 8, iCharHeight = this.oModeData.iPixelHeight * 8, iPens = this.oModeData.iPens;
        iPen %= iPens;
        iPaper %= iPens; // also pens
        this.invertChar(x * iCharWidth, y * iCharHeight, iPen, iPaper);
        this.setNeedUpdate();
    };
    Canvas.prototype.findMatchingChar = function (aCharData) {
        var aCharset = this.aCharset;
        var iChar = -1; // not detected
        for (var i = 0; i < aCharset.length; i += 1) {
            var aCharData2 = this.oCustomCharset[i] || aCharset[i];
            var bMatch = true;
            for (var j = 0; j < 8; j += 1) {
                if (aCharData[j] !== aCharData2[j]) {
                    bMatch = false;
                    break;
                }
            }
            if (bMatch) {
                iChar = i;
                break;
            }
        }
        return iChar;
    };
    Canvas.prototype.readChar = function (x, y, iPen, iPaper) {
        var iCharWidth = this.oModeData.iPixelWidth * 8, iCharHeight = this.oModeData.iPixelHeight * 8, iPens = this.oModeData.iPens;
        iPen %= iPens;
        iPaper %= iPens; // also pens
        x *= iCharWidth;
        y *= iCharHeight;
        var aCharData = this.readCharData(x, y, iPen), iChar = this.findMatchingChar(aCharData);
        if (iChar < 0 || iChar === 32) { // no match? => check inverse with paper, char=32?
            aCharData = this.readCharData(x, y, iPaper);
            for (var i = 0; i < aCharData.length; i += 1) {
                aCharData[i] ^= 0xff; // eslint-disable-line no-bitwise
            }
            var iChar2 = this.findMatchingChar(aCharData);
            if (iChar2 >= 0) {
                if (iChar2 === 143) { // invers of space?
                    iChar2 = 32; // use space
                }
                iChar = iChar2;
            }
        }
        return iChar;
    };
    // fill: idea from: https://simpledevcode.wordpress.com/2015/12/29/flood-fill-algorithm-using-c-net/
    Canvas.prototype.fnIsNotInWindow = function (x, y) {
        return (x < this.xLeft || x > this.xRight || y < (this.iHeight - 1 - this.yTop) || y > (this.iHeight - 1 - this.yBottom));
    };
    Canvas.prototype.fill = function (iFillPen) {
        var iGPen = this.iGPen, iPixelWidth = this.oModeData.iPixelWidth, iPixelHeight = this.oModeData.iPixelHeight, aPixels = [], fnIsStopPen = function (p) {
            return p === iFillPen || p === iGPen;
        };
        var xPos = this.xPos, yPos = this.yPos;
        iFillPen %= this.oModeData.iPens; // limit pens
        // apply origin
        xPos += this.xOrig;
        yPos = this.iHeight - 1 - (yPos + this.yOrig);
        if (this.fnIsNotInWindow(xPos, yPos)) {
            return;
        }
        aPixels.push({
            x: xPos,
            y: yPos
        });
        while (aPixels.length) {
            var oPixel = aPixels.pop();
            var y1 = oPixel.y, p1 = this.testSubPixel(oPixel.x, y1);
            while (y1 >= (this.iHeight - 1 - this.yTop) && !fnIsStopPen(p1)) {
                y1 -= iPixelHeight;
                p1 = this.testSubPixel(oPixel.x, y1);
            }
            y1 += iPixelHeight;
            var bSpanLeft = false, bSpanRight = false;
            p1 = this.testSubPixel(oPixel.x, y1);
            while (y1 <= (this.iHeight - 1 - this.yBottom) && !fnIsStopPen(p1)) {
                this.setSubPixels(oPixel.x, y1, iFillPen, 0);
                var x1 = oPixel.x - iPixelWidth;
                var p2 = this.testSubPixel(x1, y1);
                if (!bSpanLeft && x1 >= this.xLeft && !fnIsStopPen(p2)) {
                    aPixels.push({
                        x: x1,
                        y: y1
                    });
                    bSpanLeft = true;
                }
                else if (bSpanLeft && ((x1 < this.xLeft) || fnIsStopPen(p2))) {
                    bSpanLeft = false;
                }
                x1 = oPixel.x + iPixelWidth;
                var p3 = this.testSubPixel(x1, y1);
                if (!bSpanRight && x1 <= this.xRight && !fnIsStopPen(p3)) {
                    aPixels.push({
                        x: x1,
                        y: y1
                    });
                    bSpanRight = true;
                }
                else if (bSpanRight && ((x1 > this.xRight) || fnIsStopPen(p3))) {
                    bSpanRight = false;
                }
                y1 += iPixelHeight;
                p1 = this.testSubPixel(oPixel.x, y1);
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
        var iPixelWidth = this.oModeData.iPixelWidth;
        xOrig &= ~(iPixelWidth - 1); // eslint-disable-line no-bitwise
        this.xOrig = xOrig; // must be integer
        this.yOrig = yOrig;
        this.move(0, 0);
    };
    Canvas.prototype.setGWindow = function (xLeft, xRight, yTop, yBottom) {
        var iPixelWidth = 8, // force byte boundaries: always 8 x/byte
        iPixelHeight = this.oModeData.iPixelHeight; // usually 2, anly for mode 3 we have 1
        xLeft = Canvas.fnPutInRange(xLeft, 0, this.iWidth - 1);
        xRight = Canvas.fnPutInRange(xRight, 0, this.iWidth - 1);
        yTop = Canvas.fnPutInRange(yTop, 0, this.iHeight - 1);
        yBottom = Canvas.fnPutInRange(yBottom, 0, this.iHeight - 1);
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
        xLeft &= ~(iPixelWidth - 1);
        xRight |= (iPixelWidth - 1);
        yTop |= (iPixelHeight - 1); // we know: top is larger than bottom
        yBottom &= ~(iPixelHeight - 1);
        /* eslint-enable no-bitwise */
        this.xLeft = xLeft;
        this.xRight = xRight;
        this.yTop = yTop;
        this.yBottom = yBottom;
    };
    Canvas.prototype.setGColMode = function (iGColMode) {
        if (iGColMode !== this.iGColMode) {
            this.iGColMode = iGColMode;
        }
    };
    Canvas.prototype.clearTextWindow = function (iLeft, iRight, iTop, iBottom, iPaper) {
        var iWidth = iRight + 1 - iLeft, iHeight = iBottom + 1 - iTop, iPens = this.oModeData.iPens;
        iPaper %= iPens; // limit papers
        this.fillTextBox(iLeft, iTop, iWidth, iHeight, iPaper);
    };
    Canvas.prototype.clearGraphicsWindow = function () {
        this.fillMyRect(this.xLeft, this.iHeight - 1 - this.yTop, this.xRight + 1 - this.xLeft, this.yTop + 1 - this.yBottom, this.iGPaper); // +1 or not?
        this.move(0, 0);
        this.setNeedUpdate();
    };
    Canvas.prototype.clearFullWindow = function () {
        var iPaper = 0;
        this.fillMyRect(0, 0, this.iWidth, this.iHeight, iPaper);
        this.resetTextBuffer();
        this.setNeedTextUpdate();
        this.setNeedUpdate();
    };
    Canvas.prototype.windowScrollUp = function (iLeft, iRight, iTop, iBottom, iPen) {
        var iCharWidth = this.oModeData.iPixelWidth * 8, iCharHeight = this.oModeData.iPixelHeight * 8, iWidth = iRight + 1 - iLeft, iHeight = iBottom + 1 - iTop;
        if (iHeight > 1) { // scroll part
            this.moveMyRectUp(iLeft * iCharWidth, (iTop + 1) * iCharHeight, iWidth * iCharWidth, (iHeight - 1) * iCharHeight, iLeft * iCharWidth, iTop * iCharHeight);
            // adapt also text buffer
            this.copyTextBufferBoxUp(iLeft, iTop + 1, iWidth, iHeight - 1, iLeft, iTop);
        }
        this.fillTextBox(iLeft, iBottom, iWidth, 1, iPen);
        this.setNeedUpdate();
    };
    Canvas.prototype.windowScrollDown = function (iLeft, iRight, iTop, iBottom, iPen) {
        var iCharWidth = this.oModeData.iPixelWidth * 8, iCharHeight = this.oModeData.iPixelHeight * 8, iWidth = iRight + 1 - iLeft, iHeight = iBottom + 1 - iTop;
        if (iHeight > 1) { // scroll part
            this.moveMyRectDown(iLeft * iCharWidth, iTop * iCharHeight, iWidth * iCharWidth, (iHeight - 1) * iCharHeight, iLeft * iCharWidth, (iTop + 1) * iCharHeight);
            // adapt also text buffer
            this.copyTextBufferBoxDown(iLeft, iTop, iWidth, iHeight - 1, iLeft, iTop + 1);
        }
        this.fillTextBox(iLeft, iTop, iWidth, 1, iPen);
        this.setNeedUpdate();
    };
    Canvas.prototype.setSpeedInk = function (iTime1, iTime2) {
        this.aSpeedInk[0] = iTime1;
        this.aSpeedInk[1] = iTime2;
    };
    Canvas.prototype.setMask = function (iMask) {
        this.iMask = iMask;
        this.iMaskBit = 128;
    };
    Canvas.prototype.setMaskFirst = function (iMaskFirst) {
        this.iMaskFirst = iMaskFirst;
    };
    Canvas.prototype.getMode = function () {
        return this.iMode;
    };
    Canvas.prototype.changeMode = function (iMode) {
        var oModeData = Canvas.aModeData[iMode];
        this.iMode = iMode;
        this.oModeData = oModeData;
    };
    Canvas.prototype.setMode = function (iMode) {
        this.setScreenOffset(0);
        this.changeMode(iMode);
        this.setOrigin(0, 0);
        this.setGWindow(0, this.iWidth - 1, this.iHeight - 1, 0);
        this.setGColMode(0);
        this.setMask(255);
        this.setMaskFirst(1);
        this.setGPen(this.iGPen); // keep, but maybe different for other mode
        this.setGPaper(this.iGPaper); // keep, maybe different for other mode
        this.setGTransparentMode(false);
    };
    Canvas.prototype.startScreenshot = function () {
        return this.canvas.toDataURL("image/png").replace("image/png", "image/octet-stream"); // here is the most important part because if you do not replace you will get a DOM 18 exception.
    };
    Canvas.prototype.getCanvas = function () {
        return this.canvas;
    };
    // http://www.cpcwiki.eu/index.php/CPC_Palette
    Canvas.aColors = [
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
    ];
    // mode 0: pen 0-15,16=border; inks for pen 14,15 are alternating: "1,24", "16,11"
    Canvas.aDefaultInks = [
        [1, 24, 20, 6, 26, 0, 2, 8, 10, 12, 14, 16, 18, 22, 1, 16, 1],
        [1, 24, 20, 6, 26, 0, 2, 8, 10, 12, 14, 16, 18, 22, 24, 11, 1] // eslint-disable-line array-element-newline
    ];
    Canvas.aModeData = [
        {
            iPens: 16,
            iPixelWidth: 4,
            iPixelHeight: 2 // pixel height
        },
        {
            iPens: 4,
            iPixelWidth: 2,
            iPixelHeight: 2
        },
        {
            iPens: 2,
            iPixelWidth: 1,
            iPixelHeight: 2
        },
        {
            iPens: 16,
            iPixelWidth: 1,
            iPixelHeight: 1
        }
    ];
    // CPC Unicode map for text mode (https://www.unicode.org/L2/L2019/19025-terminals-prop.pdf AMSCPC.TXT) incomplete
    Canvas.sCpc2Unicode = "................................ !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]\u2195_`abcdefghijklmnopqrstuvwxyz{|}~\u2591"
        + "\u00A0\u2598\u259D\u2580\u2596\u258C\u259E\u259B\u2597\u259A\u2590\u259C\u2584\u2599\u259F\u2588\u00B7\u2575\u2576\u2514\u2577\u2502\u250C"
        + "\u251C\u2574\u2518\u2500\u2534\u2510\u2524\u252C\u253C\u005E\u00B4\u00A8\u00A3\u00A9\u00B6\u00A7\u2018\u00BC\u00BD\u00BE\u00B1\u00F7\u00AC"
        + "\u00BF\u00A1\u03B1\u03B2\u03B3\u03B4\u03B5\u03B8\u03BB\u03BC\u03C0\u03C3\u03C6\u03C8\u03C7\u03C9\u03A3\u03A9\u1FBA0\u1FBA1\u1FBA3\u1FBA2\u1FBA7"
        + "\u1FBA5\u1FBA6\u1FBA4\u1FBA8\u1FBA9\u1FBAE\u2573\u2571\u2572\u1FB95\u2592\u23BA\u23B9\u23BD\u23B8\u25E4\u25E5\u25E2\u25E3\u1FB8E\u1FB8D\u1FB8F"
        + "\u1FB8C\u1FB9C\u1FB9D\u1FB9E\u1FB9F\u263A\u2639\u2663\u2666\u2665\u2660\u25CB\u25CF\u25A1\u25A0\u2642\u2640\u2669\u266A\u263C\uFFBDB\u2B61\u2B63"
        + "\u2B60\u2B62\u25B2\u25BC\u25B6\u25C0\u1FBC6\u1FBC5\u1FBC7\u1FBC8\uFFBDC\uFFBDD\u2B65\u2B64";
    return Canvas;
}());
exports.Canvas = Canvas;
//# sourceMappingURL=Canvas.js.map