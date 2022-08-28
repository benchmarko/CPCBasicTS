// InputStack.ts - InputStack...
// see: https://github.com/jzaefferer/undo
//
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InputStack = void 0;
    var InputStack = /** @class */ (function () {
        function InputStack() {
            this.input = [];
            this.stackPosition = -1;
        }
        InputStack.prototype.reset = function () {
            this.input.length = 0;
            this.stackPosition = -1;
        };
        InputStack.prototype.getInput = function () {
            return this.input[this.stackPosition];
        };
        InputStack.prototype.clearRedo = function () {
            this.input = this.input.slice(0, this.stackPosition + 1);
        };
        InputStack.prototype.save = function (input) {
            this.clearRedo();
            this.input.push(input);
            this.stackPosition += 1;
        };
        InputStack.prototype.canUndoKeepOne = function () {
            return this.stackPosition > 0;
        };
        InputStack.prototype.undo = function () {
            this.stackPosition -= 1;
            return this.getInput();
        };
        InputStack.prototype.canRedo = function () {
            return this.stackPosition < this.input.length - 1;
        };
        InputStack.prototype.redo = function () {
            this.stackPosition += 1;
            return this.getInput();
        };
        return InputStack;
    }());
    exports.InputStack = InputStack;
});
//# sourceMappingURL=InputStack.js.map