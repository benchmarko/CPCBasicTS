// RsxAmsdos.ts - RSX Amsdos Commands
// (c) Marco Vieth, 2023
// https://benchmarko.github.io/CPCBasicTS/
//

//import { Utils } from "./Utils";
import { ICpcVmRsx, ICpcVm, VmFileParas, RsxCommandType } from "./Interfaces";

export class RsxAmsdos implements ICpcVmRsx {
	private static fnGetParameterAsString(vm: ICpcVm, stringOrAddress?: string | number) {
		let string = ""; // for undefined

		if (typeof stringOrAddress === "number") { // assuming addressOf
			string = String(vm.vmGetVariableByIndex(stringOrAddress) || "");
		} else if (typeof stringOrAddress === "string") {
			string = stringOrAddress;
		}
		return string;
	}

	private static dir(this: ICpcVm, fileMask?: string | number): void { // optional; string or addressOf number
		const stream = 0;
		let	fileMaskString = RsxAmsdos.fnGetParameterAsString(this, fileMask);

		if (fileMaskString) {
			fileMaskString = this.vmAdaptFilename(fileMaskString, "|DIR");
		}

		const fileParas: VmFileParas = {
			stream: stream,
			command: "|dir",
			fileMask: fileMaskString,
			line: this.line
		};

		this.vmStop("fileDir", 45, false, fileParas);
	}

	private static era(this: ICpcVm, fileMask?: string | number): void {
		const stream = 0;
		let	fileMaskString = RsxAmsdos.fnGetParameterAsString(this, fileMask);

		fileMaskString = this.vmAdaptFilename(fileMaskString, "|ERA");

		const fileParas: VmFileParas = {
			stream: stream,
			command: "|era",
			fileMask: fileMaskString,
			line: this.line
		};

		this.vmStop("fileEra", 45, false, fileParas);
	}

	private static ren(this: ICpcVm, newName: string | number, oldName: string | number): void {
		const stream = 0;
		let newName2 = RsxAmsdos.fnGetParameterAsString(this, newName),
			oldName2 = RsxAmsdos.fnGetParameterAsString(this, oldName);

		newName2 = this.vmAdaptFilename(newName2, "|REN");
		oldName2 = this.vmAdaptFilename(oldName2, "|REN");

		const fileParas: VmFileParas = {
			stream: stream,
			command: "|ren",
			fileMask: "", // unused
			newName: newName2,
			oldName: oldName2,
			line: this.line
		};

		this.vmStop("fileRen", 45, false, fileParas);
	}

	private static readonly rsxCommands: Record<string, RsxCommandType> = {
		a: function (this: ICpcVm) {
			this.vmNotImplemented("|A");
		},
		b: function (this: ICpcVm) {
			this.vmNotImplemented("|A");
		},
		cpm: function (this: ICpcVm) {
			this.vmNotImplemented("|A");
		},
		//basic: RsxAmsdos.basic,
		dir: RsxAmsdos.dir,
		disc: function (this: ICpcVm) {
			this.vmNotImplemented("|A");
		},
		"disc.in": function (this: ICpcVm) {
			this.vmNotImplemented("|A");
		},
		"disc.out": function (this: ICpcVm) {
			this.vmNotImplemented("|A");
		},
		drive: function (this: ICpcVm) {
			this.vmNotImplemented("|A");
		},
		era: RsxAmsdos.era,
		ren: RsxAmsdos.ren,
		tape: function (this: ICpcVm) {
			this.vmNotImplemented("|A");
		},
		"tape.in": function (this: ICpcVm) {
			this.vmNotImplemented("|A");
		},
		"tape.out": function (this: ICpcVm) {
			this.vmNotImplemented("|A");
		},
		user: function (this: ICpcVm) {
			this.vmNotImplemented("|A");
		}
	}

	getRsxCommands(): Record<string, RsxCommandType> { // eslint-disable-line class-methods-use-this
		return RsxAmsdos.rsxCommands;
	}

	/*
	basic(): void { // not an AMSDOS command
		Utils.console.log("basic: |BASIC");
		this.vm.vmStop("reset", 90);
	}
	*/

	/*
	mode(mode: number): void {
		mode = this.vm.vmInRangeRound(mode, 0, 3, "|MODE");
		this.vm.vmChangeMode(mode);
	}

	renum(...args: number[]): void { // optional args: new number, old number, step, keep line (only for |renum)
		this.vm.renum.apply(this.vm, args); // execute in vm context
	}
	*/
}
