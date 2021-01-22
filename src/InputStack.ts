// InputStack.ts - InputStack...
// see: https://github.com/jzaefferer/undo
//

export class InputStack {
	aInput: string[];
	iStackPosition : number;

	constructor() {
		this.init();
	}

	init(): void {
		this.aInput = [];
		this.iStackPosition = -1;
	}
	getInput(): string {
		return this.aInput[this.iStackPosition];
	}
	clearRedo(): void {
		this.aInput = this.aInput.slice(0, this.iStackPosition + 1);
	}
	save(sInput: string): void {
		this.clearRedo();
		this.aInput.push(sInput);
		this.iStackPosition += 1;
	}

	canUndoKeepOne(): boolean {
		return this.iStackPosition > 0;
	}
	undo(): string {
		this.iStackPosition -= 1;
		return this.getInput();
	}
	canRedo(): boolean {
		return this.iStackPosition < this.aInput.length - 1;
	}
	redo(): string {
		this.iStackPosition += 1;
		return this.getInput();
	}
}
