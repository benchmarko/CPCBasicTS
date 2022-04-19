// InputStack.ts - InputStack...
// see: https://github.com/jzaefferer/undo
//

export class InputStack {
	private input: string[] = [];
	private stackPosition = -1;

	/*
	constructor() {
	}
	*/

	reset(): void {
		this.input.length = 0;
		this.stackPosition = -1;
	}

	getInput(): string {
		return this.input[this.stackPosition];
	}
	clearRedo(): void {
		this.input = this.input.slice(0, this.stackPosition + 1);
	}
	save(input: string): void {
		this.clearRedo();
		this.input.push(input);
		this.stackPosition += 1;
	}

	canUndoKeepOne(): boolean {
		return this.stackPosition > 0;
	}
	undo(): string {
		this.stackPosition -= 1;
		return this.getInput();
	}
	canRedo(): boolean {
		return this.stackPosition < this.input.length - 1;
	}
	redo(): string {
		this.stackPosition += 1;
		return this.getInput();
	}
}
