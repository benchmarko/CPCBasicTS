// NoCanvas.ts - No Canvas
// (c) Marco Vieth, 2023
// https://benchmarko.github.io/CPCBasicTS/
//
export class NoCanvas {
    constructor(options) {
        this.options = {};
        this.setOptions(options);
        this.reset();
    }
    getOptions() {
        return this.options;
    }
    setOptions(options) {
        Object.assign(this.options, options);
    }
    reset() {
    }
    resetCustomChars() {
    }
    setScreenOffset(_offset) {
    }
    updateColorsAndCanvasImmediately(_inkList) {
    }
    updateSpeedInk() {
    }
    setCustomChar(_char, _charData) {
    }
    getCharData(_char) {
        return [];
    }
    setDefaultInks() {
    }
    onCanvasClick(_event) {
    }
    getXpos() {
        return 0;
    }
    getYpos() {
        return 0;
    }
    getByte(_addr) {
        return 0;
    }
    setByte(_addr, _byte) {
    }
    draw(_x, _y) {
    }
    move(_x, _y) {
    }
    plot(_x, _y) {
    }
    test(_x, _y) {
        return 0;
    }
    setInk(_pen, _ink1, _ink2) {
        return false;
    }
    setBorder(_ink1, _ink2) {
    }
    setGPen(_gPen) {
    }
    setGPaper(_gPaper) {
    }
    setGTransparentMode(_transparent) {
    }
    printGChar(_char) {
    }
    drawCursor(_x, _y, _pen, _paper) {
    }
    fill(_fillPen) {
    }
    setOrigin(_xOrig, _yOrig) {
    }
    getXOrigin() {
        return 0;
    }
    getYOrigin() {
        return 0;
    }
    setGWindow(_xLeft, _xRight, _yTop, _yBottom) {
    }
    setGColMode(_gColMode) {
    }
    clearGraphicsWindow() {
    }
    setSpeedInk(_time1, _time2) {
    }
    setMask(_mask) {
    }
    setMaskFirst(_maskFirst) {
    }
    getMode() {
        return 0;
    }
    changeMode(_mode) {
    }
    takeScreenShot() {
        return "";
    }
    startUpdateCanvas() {
    }
    stopUpdateCanvas() {
    }
    onWindowClick(_event) {
    }
    fillTextBox(_left, _top, _width, _height, _paper) {
    }
    printChar(_char, _x, _y, _pen, _paper, _transparent) {
    }
    readChar(_x, _y, _pen, _paper) {
        return 0;
    }
    clearTextWindow(_left, _right, _top, _bottom, _paper) {
    }
    setMode(_mode) {
    }
    clearFullWindow() {
    }
    windowScrollUp(_left, _right, _top, _bottom, _paper) {
    }
    windowScrollDown(_left, _right, _top, _bottom, _paper) {
    }
}
//# sourceMappingURL=NoCanvas.js.map