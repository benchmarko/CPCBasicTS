// These empty methods intentionally provide a no-op VM canvas device.
/* eslint-disable @typescript-eslint/no-empty-function */
export class NullCanvas {
    reset() { }
    resetCustomChars() { }
    setScreenOffset(_offset) { }
    updateColorsAndCanvasImmediately(_inkList) { }
    updateSpeedInk() { }
    setCustomChar(_char, _charData) { }
    getCharData(_char) { return []; }
    setDefaultInks() { }
    getXpos() { return 0; }
    getYpos() { return 0; }
    fillTextBox(_left, _top, _width, _height, _paper) { }
    getByte(_addr) { return 0; }
    setByte(_addr, _byte) { }
    draw(_x, _y) { }
    move(_x, _y) { }
    plot(_x, _y) { }
    test(_x, _y) { return 0; }
    setInk(_pen, _ink1, _ink2) { return false; }
    setBorder(_ink1, _ink2) { }
    setGPen(_gPen) { }
    setGPaper(_gPaper) { }
    setGTransparentMode(_transparent) { }
    printGChar(_char) { }
    printChar(_char, _x, _y, _pen, _paper, _transparent) { }
    drawCursor(_x, _y, _pen, _paper) { }
    readChar(_x, _y, _pen, _paper) { return 0; }
    fill(_fillPen) { }
    setOrigin(_xOrig, _yOrig) { }
    getXOrigin() { return 0; }
    getYOrigin() { return 0; }
    setGWindow(_xLeft, _xRight, _yTop, _yBottom) { }
    setGColMode(_gColMode) { }
    clearTextWindow(_left, _right, _top, _bottom, _paper) { }
    clearGraphicsWindow() { }
    clearFullWindow() { }
    windowScrollUp(_left, _right, _top, _bottom, _paper) { }
    windowScrollDown(_left, _right, _top, _bottom, _paper) { }
    setSpeedInk(_time1, _time2) { }
    setMask(_mask) { }
    setMaskFirst(_maskFirst) { }
    getMode() { return 0; }
    changeMode(_mode) { }
    setMode(_mode) { }
}
/* eslint-enable @typescript-eslint/no-empty-function */ 
//# sourceMappingURL=NullCanvas.js.map