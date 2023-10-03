// TextCanvas.ts - Text "Canvas"
// (c) Marco Vieth, 2022
// https://benchmarko.github.io/CPCBasicTS/
//
define(["require", "exports", "./View"], function (require, exports, View_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextCanvas = void 0;
    var TextCanvas = /** @class */ (function () {
        function TextCanvas(options) {
            this.fps = 15; // FPS for canvas update
            this.borderWidth = 1;
            this.needTextUpdate = false;
            this.textBuffer = []; // textbuffer characters at row,column
            this.hasFocus = false; // canvas has focus
            this.options = {
                onCanvasClick: options.onCanvasClick
            };
            this.fnUpdateTextCanvasHandler = this.updateTextCanvas.bind(this);
            this.fnUpdateTextCanvas2Handler = this.updateTextCanvas2.bind(this);
            this.textText = View_1.View.getElementById1("textText"); // View.setAreaValue()
            this.cols = parseFloat(this.textText.getAttribute("cols") || "0");
            this.rows = parseFloat(this.textText.getAttribute("rows") || "0");
            this.animationTimeoutId = undefined;
            this.animationFrame = undefined;
            this.reset();
        }
        /*
        private static readonly cpc2Unicode =
        "................................ !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]\u2195_`abcdefghijklmnopqrstuvwxyz{|}~\u2591"
        + "\u00A0\u2598\u259D\u2580\u2596\u258C\u259E\u259B\u2597\u259A\u2590\u259C\u2584\u2599\u259F\u2588\u00B7\u2575\u2576\u2514\u2577\u2502\u250C"
        + "\u251C\u2574\u2518\u2500\u2534\u2510\u2524\u252C\u253C\u005E\u00B4\u00A8\u00A3\u00A9\u00B6\u00A7\u2018\u00BC\u00BD\u00BE\u00B1\u00F7\u00AC"
        + "\u00BF\u00A1\u03B1\u03B2\u03B3\u03B4\u03B5\u03B8\u03BB\u03BC\u03C0\u03C3\u03C6\u03C8\u03C7\u03C9\u03A3\u03A9\u1FBA0\u1FBA1\u1FBA3\u1FBA2\u1FBA7"
        + "\u1FBA5\u1FBA6\u1FBA4\u1FBA8\u1FBA9\u1FBAE\u2573\u2571\u2572\u1FB95\u2592\u23BA\u23B9\u23BD\u23B8\u25E4\u25E5\u25E2\u25E3\u1FB8E\u1FB8D\u1FB8F"
        + "\u1FB8C\u1FB9C\u1FB9D\u1FB9E\u1FB9F\u263A\u2639\u2663\u2666\u2665\u2660\u25CB\u25CF\u25A1\u25A0\u2642\u2640\u2669\u266A\u263C\uFFBDB\u2B61\u2B63"
        + "\u2B60\u2B62\u25B2\u25BC\u25B6\u25C0\u1FBC6\u1FBC5\u1FBC7\u1FBC8\uFFBDC\uFFBDD\u2B65\u2B64";
        */
        TextCanvas.prototype.setOnCanvasClick = function (onCanvasClickHandler) {
            this.options.onCanvasClick = onCanvasClickHandler;
        };
        TextCanvas.prototype.reset = function () {
            this.resetTextBuffer();
            this.setNeedTextUpdate();
        };
        TextCanvas.prototype.resetTextBuffer = function () {
            this.textBuffer.length = 0;
        };
        TextCanvas.prototype.setNeedTextUpdate = function () {
            this.needTextUpdate = true;
        };
        TextCanvas.prototype.updateTextCanvas2 = function () {
            this.animationFrame = requestAnimationFrame(this.fnUpdateTextCanvasHandler);
            if (this.textText.offsetParent) { // text area visible?
                if (this.needTextUpdate) {
                    this.needTextUpdate = false;
                    this.updateTextWindow();
                }
            }
        };
        TextCanvas.prototype.updateTextCanvas = function () {
            this.animationTimeoutId = window.setTimeout(this.fnUpdateTextCanvas2Handler, 1000 / this.fps); // ts (node)
        };
        TextCanvas.prototype.startUpdateCanvas = function () {
            if (this.animationFrame === undefined && this.textText.offsetParent !== null) { // animation off and canvas visible in DOM?
                this.updateTextCanvas();
            }
        };
        TextCanvas.prototype.stopUpdateCanvas = function () {
            if (this.animationFrame !== undefined) {
                cancelAnimationFrame(this.animationFrame);
                clearTimeout(this.animationTimeoutId);
                this.animationFrame = undefined;
                this.animationTimeoutId = undefined;
            }
        };
        /*
        // eslint-disable-next-line class-methods-use-this
        private test1(tooWide: number[]) {
            const tooWide = [132,134,135,136,137,139,141,142,224,225,226,227,245],
                cpc2Unicode = TextCanvas.cpc2Unicode;
            let out = "";
    
            for (let i = 0; i <= 255; i += 1) {
                if (tooWide.indexOf(i) >= 0) {
                    out += ".";
                } else {
                    const ch1 = cpc2Unicode[i],
                        code1 = cpc2Unicode.charCodeAt(i);
    
                    if (code1 > 127) {
                        out += "\\u" + code1.toString(16).toUpperCase().padStart(4, "0");
                    } else {
                        out += ch1;
                    }
                }
            }
            console.log(out); //TTT
        }
        */
        TextCanvas.prototype.updateTextWindow = function () {
            var textBuffer = this.textBuffer, cpc2Unicode = TextCanvas.cpc2Unicode;
            var out = "";
            for (var y = 0; y < textBuffer.length; y += 1) {
                var textBufferRow = textBuffer[y];
                if (textBufferRow) {
                    for (var x = 0; x < textBufferRow.length; x += 1) {
                        out += cpc2Unicode[textBufferRow[x] || 32];
                    }
                }
                out += "\n";
            }
            this.textText.value = out;
        };
        TextCanvas.prototype.setFocusOnCanvas = function () {
            var parentNode = this.textText.parentNode;
            if (parentNode) {
                parentNode.style.background = "#463c3c";
            }
            if (this.textText) {
                this.textText.focus();
            }
            this.hasFocus = true;
        };
        // eslint-disable-next-line class-methods-use-this
        TextCanvas.prototype.getMousePos = function (event, canvasWidth, canvasHeight) {
            var //padding = 0, //2, // TODO
            rect = this.textText.getBoundingClientRect(), pos = {
                x: (event.clientX - this.borderWidth - rect.left) / (rect.right - rect.left - this.borderWidth * 2) * canvasWidth,
                y: (event.clientY - this.borderWidth - rect.top) / (rect.bottom - rect.top - this.borderWidth * 2) * canvasHeight
            };
            return pos;
        };
        TextCanvas.prototype.canvasClickAction = function (event) {
            var canvasWidth = 640, canvasHeight = 400, pos = this.getMousePos(event, canvasWidth, canvasHeight), 
            /* eslint-disable no-bitwise */
            x = pos.x | 0, // force integer
            y = pos.y | 0;
            /* eslint-enable no-bitwise */
            if (this.options.onCanvasClick) {
                /*
                const target = View.getEventTarget<HTMLElement>(event),
                    style = window.getComputedStyle(target, null).getPropertyValue("font-size"),
                    fontSize = parseFloat(style),
                    charWidth = (fontSize * 1.1075) / 2, //(fontSize + 1.4) / 2,
                    charHeight = fontSize * 1.125, //+ 2.25, // TODO
                */
                var charWidth = canvasWidth / this.cols, charHeight = canvasHeight / this.rows, 
                /* eslint-disable no-bitwise */
                xTxt = (x / charWidth) | 0, yTxt = (y / charHeight) | 0;
                /* eslint-enable no-bitwise */
                this.options.onCanvasClick(event, x, y, xTxt, yTxt);
            }
        };
        /*
        private getMousePos_old1(event: MouseEvent) {
            const padding = 0, //2, // TODO
                rect = this.textText.getBoundingClientRect(),
                pos = {
                    x: event.clientX - this.borderWidth - padding - rect.left,
                    y: event.clientY - this.borderWidth - padding - rect.top
                };
    
            return pos;
        }
    
        private canvasClickAction_old1(event: MouseEvent) {
            const pos = this.getMousePos(event),
                canvasWidth = 640,
                canvasHeight = 400,
                x = pos.x,
                y = pos.y;
    
            if (this.options.onCanvasClick) {
                const target = View.getEventTarget<HTMLElement>(event),
                    style = window.getComputedStyle(target, null).getPropertyValue("font-size"),
                    fontSize = parseFloat(style),
                    charWidth = (fontSize * 1.1075) / 2, //(fontSize + 1.4) / 2,
                    charHeight = fontSize * 1.125, //+ 2.25, // TODO
                    / * eslint-disable no-bitwise * /
                    xTxt = (x / charWidth) | 0,
                    yTxt = (y / charHeight) | 0,
                    //TODO
                    rect = this.textText.getBoundingClientRect(),
                    x2 = ((event.clientX - this.borderWidth - rect.left) / (rect.right - rect.left - this.borderWidth * 2) * canvasWidth) | 0,
                    y2 = ((event.clientY - this.borderWidth - rect.top) / (rect.bottom - rect.top - this.borderWidth * 2) * canvasHeight) | 0;
                    / * eslint-enable no-bitwise * /
                    / *
                    scaleX = canvasWidth / rect.width,
                    scaleY = canvasHeight / rect.height,
                    x2 = (x * scaleX) | 0, // force integer
                    y2 = (y * scaleY) | 0;
                    * /
    
                this.options.onCanvasClick(event, x2, y2, xTxt, yTxt);
            }
    
            / *
            // for graphics coordinates, adapt origin
            x -= this.xOrig;
            y = this.height - 1 - (y + this.yOrig);
    
            if (this.xPos === 1000 && this.yPos === 1000) { // only activate move if pos is 1000, 1000
                this.move(x, y);
            }
            if (Utils.debug > 0) {
                Utils.console.debug("canvasClickAction: x", pos.x, "y", pos.y, "x - xOrig", x, "y - yOrig", y, "detail", event.detail);
            }
            * /
        }
        */
        TextCanvas.prototype.onTextCanvasClick = function (event) {
            if (!this.hasFocus) {
                this.setFocusOnCanvas();
            }
            else {
                this.canvasClickAction(event);
            }
            event.stopPropagation();
        };
        TextCanvas.prototype.onWindowClick = function (_event) {
            if (this.hasFocus) {
                this.hasFocus = false;
                var parentNode = this.textText.parentNode;
                if (parentNode) {
                    parentNode.style.background = "";
                }
            }
        };
        TextCanvas.prototype.fillTextBox = function (left, top, width, height, _pen) {
            this.clearTextBufferBox(left, top, width, height);
        };
        TextCanvas.prototype.clearTextBufferBox = function (left, top, width, height) {
            var textBuffer = this.textBuffer;
            for (var y = top; y < top + height; y += 1) {
                var textBufferRow = textBuffer[y];
                if (textBufferRow) {
                    for (var x = left; x < left + width; x += 1) {
                        delete textBufferRow[x];
                    }
                }
            }
            this.setNeedTextUpdate();
        };
        TextCanvas.prototype.copyTextBufferBoxUp = function (left, top, width, height, left2, top2) {
            var textBuffer = this.textBuffer;
            for (var y = 0; y < height; y += 1) {
                var sourceRow = textBuffer[top + y];
                var destinationRow = textBuffer[top2 + y];
                if (sourceRow) {
                    // could be optimized, if complete rows
                    if (!destinationRow) {
                        destinationRow = [];
                        textBuffer[top2 + y] = destinationRow;
                    }
                    for (var x = 0; x < width; x += 1) {
                        destinationRow[left2 + x] = sourceRow[left + x];
                    }
                }
                else if (destinationRow) {
                    delete textBuffer[top2 + y]; // no sourceRow => clear destinationRow
                }
            }
            this.setNeedTextUpdate();
        };
        TextCanvas.prototype.copyTextBufferBoxDown = function (left, top, width, height, left2, top2) {
            var textBuffer = this.textBuffer;
            for (var y = height - 1; y >= 0; y -= 1) {
                var sourceRow = textBuffer[top + y];
                var destinationRow = textBuffer[top2 + y];
                if (sourceRow) {
                    if (!destinationRow) {
                        destinationRow = [];
                        textBuffer[top2 + y] = destinationRow;
                    }
                    for (var x = 0; x < width; x += 1) {
                        destinationRow[left2 + x] = sourceRow[left + x];
                    }
                }
                else if (destinationRow) {
                    delete textBuffer[top2 + y]; // no sourceRow => clear destinationRow
                }
            }
            this.setNeedTextUpdate();
        };
        TextCanvas.prototype.putCharInTextBuffer = function (char, x, y) {
            var textBuffer = this.textBuffer;
            if (!textBuffer[y]) {
                textBuffer[y] = [];
            }
            this.textBuffer[y][x] = char;
            this.setNeedTextUpdate();
        };
        TextCanvas.prototype.getCharFromTextBuffer = function (x, y) {
            var textBuffer = this.textBuffer;
            var char;
            if (textBuffer[y]) {
                char = this.textBuffer[y][x]; // can be undefined, if not set
            }
            return char;
        };
        TextCanvas.prototype.printChar = function (char, x, y, _pen, _paper, _transparent) {
            this.putCharInTextBuffer(char, x, y);
        };
        TextCanvas.prototype.readChar = function (x, y, _pen, _paper) {
            var char = this.getCharFromTextBuffer(x, y); // TODO
            if (char === undefined) {
                char = -1; // not detected
            }
            return char;
        };
        TextCanvas.prototype.clearTextWindow = function (left, right, top, bottom, _paper) {
            var width = right + 1 - left, height = bottom + 1 - top;
            this.fillTextBox(left, top, width, height);
        };
        TextCanvas.prototype.setMode = function (_mode, right, bottom) {
            var cols = right + 1, rows = bottom + 1;
            if (this.cols !== cols) {
                this.cols = cols;
                this.textText.setAttribute("cols", String(cols));
            }
            if (this.rows !== rows) {
                this.rows = rows;
                this.textText.setAttribute("rows", String(rows));
            }
        };
        TextCanvas.prototype.clearFullWindow = function () {
            this.resetTextBuffer();
            this.setNeedTextUpdate();
        };
        TextCanvas.prototype.windowScrollUp = function (left, right, top, bottom, _pen) {
            var width = right + 1 - left, height = bottom + 1 - top;
            if (height > 1) { // scroll part
                // adapt also text buffer
                this.copyTextBufferBoxUp(left, top + 1, width, height - 1, left, top);
            }
            this.fillTextBox(left, bottom, width, 1);
        };
        TextCanvas.prototype.windowScrollDown = function (left, right, top, bottom, _pen) {
            var width = right + 1 - left, height = bottom + 1 - top;
            if (height > 1) { // scroll part
                // adapt also text buffer
                this.copyTextBufferBoxDown(left, top, width, height - 1, left, top + 1);
            }
            this.fillTextBox(left, top, width, 1);
        };
        // CPC Unicode map for text mode (https://www.unicode.org/L2/L2019/19025-terminals-prop.pdf AMSCPC.TXT) incomplete; wider chars replaed by "."
        // tooWide = [132,134,135,136,137,139,141,142,224,225,226,227,245];
        // For equal height we set line-height: 15px;
        TextCanvas.cpc2Unicode = "................................ !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]\u2195_`abcdefghijklmnopqrstuvwxyz{|}~\u2591\u00A0\u2598\u259D\u2580.\u258C....\u2590.\u2584..\u2588\u00B7\u2575\u2576\u2514\u2577\u2502\u250C\u251C\u2574\u2518\u2500\u2534\u2510\u2524\u252C\u253C^\u00B4\u00A8\u00A3\u00A9\u00B6\u00A7\u2018\u00BC\u00BD\u00BE\u00B1\u00F7\u00AC\u00BF\u00A1\u03B1\u03B2\u03B3\u03B4\u03B5\u03B8\u03BB\u03BC\u03C0\u03C3\u03C6\u03C8\u03C7\u03C9\u03A3\u03A9\u1FBA0\u1FBA1\u1FBA3\u1FBA2\u1FBA7\u1FBA5\u1FBA6\u1FBA4\u1FBA8\u1FBA9\u1FBAE\u2573\u2571\u2572\u1FB95\u2592\u23BA\u23B9\u23BD\u23B8....\u1FB8E\u1FB8D\u1FB8F\u1FB8C\u1FB9C\u1FB9D\u1FB9E\u1FB9F\u263A.\u2663\u2666\u2665\u2660\u25CB\u25CF\u25A1\u25A0\u2642\u2640";
        return TextCanvas;
    }());
    exports.TextCanvas = TextCanvas;
});
//# sourceMappingURL=TextCanvas.js.map