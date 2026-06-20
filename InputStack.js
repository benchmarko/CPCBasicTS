// InputStack.ts - InputStack...
// see: https://github.com/jzaefferer/undo
//
export class InputStack {
    constructor() {
        this.input = [];
        this.stackPosition = -1;
    }
    reset() {
        this.input.length = 0;
        this.stackPosition = -1;
    }
    getInput() {
        return this.input[this.stackPosition];
    }
    clearRedo() {
        this.input = this.input.slice(0, this.stackPosition + 1);
    }
    save(input) {
        this.clearRedo();
        this.input.push(input);
        this.stackPosition += 1;
    }
    canUndoKeepOne() {
        return this.stackPosition > 0;
    }
    undo() {
        this.stackPosition -= 1;
        return this.getInput();
    }
    canRedo() {
        return this.stackPosition < this.input.length - 1;
    }
    redo() {
        this.stackPosition += 1;
        return this.getInput();
    }
}
//# sourceMappingURL=InputStack.js.map