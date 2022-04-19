// CpcVmRst.ts - CPC Virtual Machine: RSX
// (c) Marco Vieth, 2020
// https://benchmarko.github.io/CPCBasicTS/
//

import { Utils } from "./Utils";
import { ICpcVmRsx } from "./Interfaces";
import { CpcVm, VmFileParas } from "./CpcVm";

export class CpcVmRsx implements ICpcVmRsx {
	private vm: CpcVm;

	constructor(vm: CpcVm) {
		this.vm = vm;
	}

	rsxIsAvailable(name: string): boolean {
		return name in this;
	}

	rsxExec(name: string, ...args: (string | number)[]): void {
		if (this.rsxIsAvailable(name)) {
			(this as any)[name].apply(this, args);
		} else {
			throw this.vm.vmComposeError(Error(), 28, "|" + name); // Unknown command
		}
	}

	a(): void {
		this.vm.vmNotImplemented("|A");
	}

	b(): void {
		this.vm.vmNotImplemented("|B");
	}

	basic(): void { // not an AMSDOS command
		Utils.console.log("basic: |BASIC");
		this.vm.vmStop("reset", 90);
	}

	cpm(): void {
		this.vm.vmNotImplemented("|CPM");
	}

	private fnGetVariableByAddress(index: number) {
		return this.vm.variables.getVariableByIndex(index) || "";
	}

	private fnGetParameterAsString(stringOrAddress?: string | number) {
		let string = ""; // for undefined

		if (typeof stringOrAddress === "number") { // assuming addressOf
			string = String(this.fnGetVariableByAddress(stringOrAddress));
		} else if (typeof stringOrAddress === "string") {
			string = stringOrAddress;
		}
		return string;
	}

	dir(fileMask?: string | number): void { // optional; string or addressOf number
		const stream = 0;
		let	fileMaskString = this.fnGetParameterAsString(fileMask);

		if (fileMaskString) {
			fileMaskString = this.vm.vmAdaptFilename(fileMaskString, "|DIR");
		}

		const fileParas: VmFileParas = {
			stream: stream,
			command: "|dir",
			fileMask: fileMaskString,
			line: this.vm.line
		};

		this.vm.vmStop("fileDir", 45, false, fileParas);
	}

	disc(): void {
		this.vm.vmNotImplemented("|DISC");
	}

	disc_in(): void { // eslint-disable-line camelcase
		this.vm.vmNotImplemented("|DISC.IN");
	}

	disc_out(): void { // eslint-disable-line camelcase
		this.vm.vmNotImplemented("|DISC.OUT");
	}

	drive(): void {
		this.vm.vmNotImplemented("|DRIVE");
	}

	era(fileMask?: string | number): void {
		const stream = 0;
		let	fileMaskString = this.fnGetParameterAsString(fileMask);

		fileMaskString = this.vm.vmAdaptFilename(fileMaskString, "|ERA");

		const fileParas: VmFileParas = {
			stream: stream,
			command: "|era",
			fileMask: fileMaskString,
			line: this.vm.line
		};

		this.vm.vmStop("fileEra", 45, false, fileParas);
	}

	ren(newName: string | number, oldName: string | number): void {
		const stream = 0;
		let newName2 = this.fnGetParameterAsString(newName),
			oldName2 = this.fnGetParameterAsString(oldName);

		newName2 = this.vm.vmAdaptFilename(newName2, "|REN");
		oldName2 = this.vm.vmAdaptFilename(oldName2, "|REN");

		const fileParas: VmFileParas = {
			stream: stream,
			command: "|ren",
			fileMask: "", // unused
			newName: newName2,
			oldName: oldName2,
			line: this.vm.line
		};

		this.vm.vmStop("fileRen", 45, false, fileParas);
	}

	tape(): void {
		this.vm.vmNotImplemented("|TAPE");
	}

	tape_in(): void { // eslint-disable-line camelcase
		this.vm.vmNotImplemented("|TAPE.IN");
	}

	tape_out(): void { // eslint-disable-line camelcase
		this.vm.vmNotImplemented("|TAPE.OUT");
	}

	user(): void {
		this.vm.vmNotImplemented("|USER");
	}

	mode(mode: number): void {
		mode = this.vm.vmInRangeRound(mode, 0, 3, "|MODE");
		this.vm.modeValue = mode;

		const winData = CpcVm.winData[this.vm.modeValue];

		Utils.console.log("rsxMode: (test)", mode);

		for (let i = 0; i < CpcVm.streamCount - 2; i += 1) { // for window streams
			const win = this.vm.windowDataList[i];

			Object.assign(win, winData);
		}
		this.vm.canvas.changeMode(mode); // or setMode?
	}

	renum(...args: number[]): void { // optional args: new number, old number, step, keep line (only for |renum)
		this.vm.renum.apply(args);
	}
}
