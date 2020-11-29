// InputStack.js - InputStack...
// see: https://github.com/jzaefferer/undo
//
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InputStack = void 0;
function InputStack() {
    this.init();
}
exports.InputStack = InputStack;
InputStack.prototype = {
    init: function () {
        this.aInput = [];
        this.iStackPosition = -1;
        return this;
    },
    getInput: function () {
        return this.aInput[this.iStackPosition];
    },
    clearRedo: function () {
        this.aInput = this.aInput.slice(0, this.iStackPosition + 1);
        return this;
    },
    save: function (sInput) {
        this.clearRedo();
        this.aInput.push(sInput);
        this.iStackPosition += 1;
        return this;
    },
    canUndo: function () {
        return this.iStackPosition >= 0;
    },
    canUndoKeepOne: function () {
        return this.iStackPosition > 0;
    },
    undo: function () {
        this.iStackPosition -= 1;
        return this.getInput();
    },
    canRedo: function () {
        return this.iStackPosition < this.aInput.length - 1;
    },
    redo: function () {
        this.iStackPosition += 1;
        return this.getInput();
    }
};
//# sourceMappingURL=InputStack.js.map