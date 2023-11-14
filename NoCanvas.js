// NoCanvas.ts - No Canvas
// (c) Marco Vieth, 2023
// https://benchmarko.github.io/CPCBasicTS/
//
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NoCanvas = void 0;
    var NoCanvas = /** @class */ (function () {
        function NoCanvas(options) {
            this.options = options;
            this.reset();
        }
        NoCanvas.prototype.getOptions = function () {
            return this.options;
        };
        NoCanvas.prototype.setOptions = function (options) {
            Object.assign(this.options, options);
        };
        NoCanvas.prototype.reset = function () {
        };
        NoCanvas.prototype.resetCustomChars = function () {
        };
        NoCanvas.prototype.setScreenOffset = function (_offset) {
        };
        NoCanvas.prototype.updateColorsAndCanvasImmediately = function (_inkList) {
        };
        NoCanvas.prototype.updateSpeedInk = function () {
        };
        NoCanvas.prototype.setCustomChar = function (_char, _charData) {
        };
        NoCanvas.prototype.getCharData = function (_char) {
            return [];
        };
        NoCanvas.prototype.setDefaultInks = function () {
        };
        NoCanvas.prototype.onCanvasClick = function (_event) {
        };
        NoCanvas.prototype.getXpos = function () {
            return 0;
        };
        NoCanvas.prototype.getYpos = function () {
            return 0;
        };
        NoCanvas.prototype.getByte = function (_addr) {
            return 0;
        };
        NoCanvas.prototype.setByte = function (_addr, _byte) {
        };
        NoCanvas.prototype.draw = function (_x, _y) {
        };
        NoCanvas.prototype.move = function (_x, _y) {
        };
        NoCanvas.prototype.plot = function (_x, _y) {
        };
        NoCanvas.prototype.test = function (_x, _y) {
            return 0;
        };
        NoCanvas.prototype.setInk = function (_pen, _ink1, _ink2) {
            return false;
        };
        NoCanvas.prototype.setBorder = function (_ink1, _ink2) {
        };
        NoCanvas.prototype.setGPen = function (_gPen) {
        };
        NoCanvas.prototype.setGPaper = function (_gPaper) {
        };
        NoCanvas.prototype.setGTransparentMode = function (_transparent) {
        };
        NoCanvas.prototype.printGChar = function (_char) {
        };
        NoCanvas.prototype.drawCursor = function (_x, _y, _pen, _paper) {
        };
        NoCanvas.prototype.fill = function (_fillPen) {
        };
        NoCanvas.prototype.setOrigin = function (_xOrig, _yOrig) {
        };
        NoCanvas.prototype.getXOrigin = function () {
            return 0;
        };
        NoCanvas.prototype.getYOrigin = function () {
            return 0;
        };
        NoCanvas.prototype.setGWindow = function (_xLeft, _xRight, _yTop, _yBottom) {
        };
        NoCanvas.prototype.setGColMode = function (_gColMode) {
        };
        NoCanvas.prototype.clearGraphicsWindow = function () {
        };
        NoCanvas.prototype.setSpeedInk = function (_time1, _time2) {
        };
        NoCanvas.prototype.setMask = function (_mask) {
        };
        NoCanvas.prototype.setMaskFirst = function (_maskFirst) {
        };
        NoCanvas.prototype.getMode = function () {
            return 0;
        };
        NoCanvas.prototype.changeMode = function (_mode) {
        };
        /*
        getCanvasID(): ViewID { // eslint-disable-line class-methods-use-this
            return ViewID.noCanvas;
        }
        */
        NoCanvas.prototype.takeScreenShot = function () {
            return "";
        };
        NoCanvas.prototype.startUpdateCanvas = function () {
        };
        NoCanvas.prototype.stopUpdateCanvas = function () {
        };
        NoCanvas.prototype.onWindowClick = function (_event) {
        };
        NoCanvas.prototype.fillTextBox = function (_left, _top, _width, _height, _paper) {
        };
        NoCanvas.prototype.printChar = function (_char, _x, _y, _pen, _paper, _transparent) {
        };
        NoCanvas.prototype.readChar = function (_x, _y, _pen, _paper) {
            return 0;
        };
        NoCanvas.prototype.clearTextWindow = function (_left, _right, _top, _bottom, _paper) {
        };
        NoCanvas.prototype.setMode = function (_mode) {
        };
        NoCanvas.prototype.clearFullWindow = function () {
        };
        NoCanvas.prototype.windowScrollUp = function (_left, _right, _top, _bottom, _paper) {
        };
        NoCanvas.prototype.windowScrollDown = function (_left, _right, _top, _bottom, _paper) {
        };
        return NoCanvas;
    }());
    exports.NoCanvas = NoCanvas;
});
//# sourceMappingURL=NoCanvas.js.map