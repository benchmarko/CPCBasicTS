"use strict";
// InputStack.js - InputStack...
// see: https://github.com/jzaefferer/undo
//
Object.defineProperty(exports, "__esModule", { value: true });
exports.InputStack = void 0;
var InputStack = /** @class */ (function () {
    function InputStack() {
        this.init();
    }
    InputStack.prototype.init = function () {
        this.aInput = [];
        this.iStackPosition = -1;
        return this;
    };
    InputStack.prototype.getInput = function () {
        return this.aInput[this.iStackPosition];
    };
    InputStack.prototype.clearRedo = function () {
        this.aInput = this.aInput.slice(0, this.iStackPosition + 1);
        return this;
    };
    InputStack.prototype.save = function (sInput) {
        this.clearRedo();
        this.aInput.push(sInput);
        this.iStackPosition += 1;
        return this;
    };
    InputStack.prototype.canUndo = function () {
        return this.iStackPosition >= 0;
    };
    InputStack.prototype.canUndoKeepOne = function () {
        return this.iStackPosition > 0;
    };
    InputStack.prototype.undo = function () {
        this.iStackPosition -= 1;
        return this.getInput();
    };
    InputStack.prototype.canRedo = function () {
        return this.iStackPosition < this.aInput.length - 1;
    };
    InputStack.prototype.redo = function () {
        this.iStackPosition += 1;
        return this.getInput();
    };
    return InputStack;
}());
exports.InputStack = InputStack;
//# sourceMappingURL=InputStack.js.map