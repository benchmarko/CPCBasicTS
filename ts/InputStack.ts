// InputStack.js - InputStack...
// see: https://github.com/jzaefferer/undo
//

export class InputStack {
	aInput: string[];
	iStackPosition : number;

	constructor() {
		this.init();
	}

	init() {
		this.aInput = [];
		this.iStackPosition = -1;
		return this;
	}
	getInput() {
		return this.aInput[this.iStackPosition];
	}
	clearRedo() {
		this.aInput = this.aInput.slice(0, this.iStackPosition + 1);
		return this;
	}
	save(sInput) {
		this.clearRedo();
		this.aInput.push(sInput);
		this.iStackPosition += 1;
		return this;
	}
	canUndo() {
		return this.iStackPosition >= 0;
	}
	canUndoKeepOne() {
		return this.iStackPosition > 0;
	}
	undo() {
		this.iStackPosition -= 1;
		return this.getInput();
	}
	canRedo() {
		return this.iStackPosition < this.aInput.length - 1;
	}
	redo() {
		this.iStackPosition += 1;
		return this.getInput();
	}
}
