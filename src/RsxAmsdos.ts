// RsxAmsdos.ts - RSX Amsdos Commands
// (c) Marco Vieth, 2023
// https://benchmarko.github.io/CPCBasicTS/
//

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
			this.vmNotImplemented("|B");
		},
		cpm: function (this: ICpcVm) {
			this.vmNotImplemented("|CPM");
		},
		dir: RsxAmsdos.dir,
		disc: function (this: ICpcVm) {
			this.vmNotImplemented("|DISC");
		},
		"disc.in": function (this: ICpcVm) {
			this.vmNotImplemented("|DISC.IN");
		},
		"disc.out": function (this: ICpcVm) {
			this.vmNotImplemented("|DISC.OUT");
		},
		drive: function (this: ICpcVm) {
			this.vmNotImplemented("|DRIVE");
		},
		era: RsxAmsdos.era,
		ren: RsxAmsdos.ren,
		tape: function (this: ICpcVm) {
			this.vmNotImplemented("|TAPE");
		},
		"tape.in": function (this: ICpcVm) {
			this.vmNotImplemented("|TAPE.IN");
		},
		"tape.out": function (this: ICpcVm) {
			this.vmNotImplemented("|TAPE.OUT");
		},
		user: function (this: ICpcVm) {
			this.vmNotImplemented("|USER");
		}
	}

	getRsxCommands(): Record<string, RsxCommandType> { // eslint-disable-line class-methods-use-this
		return RsxAmsdos.rsxCommands;
	}
}
