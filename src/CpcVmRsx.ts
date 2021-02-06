// CpcVmRst.ts - CPC Virtual Machine: RSX
// (c) Marco Vieth, 2020
// https://benchmarko.github.io/CPCBasicTS/
//

import { Utils } from "./Utils";
import { ICpcVmRsx } from "./Interfaces";
import { CpcVm, VmFileParas } from "./CpcVm";

export class CpcVmRsx implements ICpcVmRsx {
	oVm: CpcVm;

	constructor(oVm: CpcVm) {
		this.rsxInit(oVm);
	}

	rsxInit(oVm: CpcVm): void {
		this.oVm = oVm;
	}

	rsxIsAvailable(sName: string): boolean {
		return sName in this;
	}

	rsxExec(sName: string, ...aArgs: (string | number)[]): void {
		if (this.rsxIsAvailable(sName)) {
			this[sName].apply(this, aArgs);
		} else {
			throw this.oVm.vmComposeError(Error(), 28, "|" + sName); // Unknown command
		}
	}

	a(): void {
		this.oVm.vmNotImplemented("|A");
	}

	b(): void {
		this.oVm.vmNotImplemented("|B");
	}

	basic(): void { // not an AMSDOS command
		Utils.console.log("basic: |BASIC");
		this.oVm.vmStop("reset", 90);
	}

	cpm(): void {
		this.oVm.vmNotImplemented("|CPM");
	}

	private fnGetVariableByAddress(iIndex: number) {
		return this.oVm.oVariables.getVariableByIndex(iIndex) || "";
	}

	private fnGetParameterAsString(stringOrAddress?: string | number) {
		let sString = ""; // for undefined

		if (typeof stringOrAddress === "number") { // assuming addressOf
			sString = String(this.fnGetVariableByAddress(stringOrAddress));
		} else if (typeof stringOrAddress === "string") {
			sString = stringOrAddress;
		}
		return sString;
	}

	dir(fileMask?: string | number): void { // optional; string or addressOf number
		const iStream = 0;
		let	sFileMask = this.fnGetParameterAsString(fileMask);

		if (sFileMask) {
			sFileMask = this.oVm.vmAdaptFilename(sFileMask, "|DIR");
		}

		const oFileParas: VmFileParas = {
			iStream: iStream,
			sCommand: "|dir",
			sFileMask: sFileMask,
			iLine: this.oVm.iLine //TTT
		};

		this.oVm.vmStop("fileDir", 45, false, oFileParas);
	}

	disc(): void {
		this.oVm.vmNotImplemented("|DISC");
	}

	disc_in(): void { // eslint-disable-line camelcase
		this.oVm.vmNotImplemented("|DISC.IN");
	}

	disc_out(): void { // eslint-disable-line camelcase
		this.oVm.vmNotImplemented("|DISC.OUT");
	}

	drive(): void {
		this.oVm.vmNotImplemented("|DRIVE");
	}

	era(fileMask?: string | number): void {
		const iStream = 0;
		let	sFileMask = this.fnGetParameterAsString(fileMask);

		sFileMask = this.oVm.vmAdaptFilename(sFileMask, "|ERA");

		const oFileParas: VmFileParas = {
			iStream: iStream,
			sCommand: "|era",
			sFileMask: sFileMask,
			iLine: this.oVm.iLine //TTT
		};

		this.oVm.vmStop("fileEra", 45, false, oFileParas);
	}

	ren(newName: string | number, oldName: string | number): void {
		const iStream = 0;
		let sNew = this.fnGetParameterAsString(newName),
			sOld = this.fnGetParameterAsString(oldName);

		sNew = this.oVm.vmAdaptFilename(sNew, "|REN");
		sOld = this.oVm.vmAdaptFilename(sOld, "|REN");

		const oFileParas: VmFileParas = {
			iStream: iStream,
			sCommand: "|ren",
			sFileMask: "", // unused
			sNew: sNew,
			sOld: sOld,
			iLine: this.oVm.iLine //TTT
		};

		this.oVm.vmStop("fileRen", 45, false, oFileParas);
	}

	tape(): void {
		this.oVm.vmNotImplemented("|TAPE");
	}

	tape_in(): void { // eslint-disable-line camelcase
		this.oVm.vmNotImplemented("|TAPE.IN");
	}

	tape_out(): void { // eslint-disable-line camelcase
		this.oVm.vmNotImplemented("|TAPE.OUT");
	}

	user(): void {
		this.oVm.vmNotImplemented("|USER");
	}

	mode(iMode: number): void {
		iMode = this.oVm.vmInRangeRound(iMode, 0, 3, "|MODE");
		this.oVm.iMode = iMode;

		const oWinData = CpcVm.mWinData[this.oVm.iMode];

		Utils.console.log("rsxMode: (test)", iMode);

		for (let i = 0; i < CpcVm.iStreamCount - 2; i += 1) { // for window streams
			const oWin = this.oVm.aWindow[i];

			Object.assign(oWin, oWinData);
		}
		this.oVm.oCanvas.changeMode(iMode); // or setMode?
	}

	renum(): void { // optional args: new number, old number, step, keep line (only for |renum)
		this.oVm.renum.apply(this.oVm, arguments);
	}
}
