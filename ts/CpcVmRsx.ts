// CpcVmRsx.js - CPC Virtual Machine: RSX
// (c) Marco Vieth, 2020
// https://benchmarko.github.io/CPCBasic/
//

"use strict";

import { Utils } from "./Utils";
import { CpcVm } from "./CpcVm";

export class CpcVmRsx {
	oVm: CpcVm; //TTT

	constructor(oVm: CpcVm) {
		this.rsxInit(oVm);
	}

	rsxInit(oVm: CpcVm) {
		this.oVm = oVm;
	}

	rsxIsAvailable(sName: string) {
		return sName in this;
	}

	rsxExec(sName: string) { // varargs
		if (this.rsxIsAvailable(sName)) {
			const aArgs = Array.prototype.slice.call(arguments, 1);
			this[sName].apply(this, aArgs);
		} else {
			throw this.oVm.vmComposeError(Error(), 28, "|" + sName); // Unknown command
		}
	}

	a() {
		this.oVm.vmNotImplemented("|A");
	}

	b() {
		this.oVm.vmNotImplemented("|B");
	}

	basic() { // not an AMSDOS command
		Utils.console.log("basic: |BASIC");
		this.oVm.vmStop("reset", 90);
	}

	cpm() {
		this.oVm.vmNotImplemented("|CPM");
	}

	private fnGetVariableByAddress(iIndex: number) {
		return this.oVm.oVariables.getVariableByIndex(iIndex) || "";
	}

	private fnGetParameterAsString(stringOrAddress?: string | number) {
		let sString = ""; // for undefined
		if (typeof stringOrAddress === "number") { // assuming addressOf
			sString = String(this.fnGetVariableByAddress(stringOrAddress)); //TTT
		} else if (typeof stringOrAddress === "string") {
			sString = stringOrAddress;
		}
		return sString;
	}

	dir(fileMask?: string | number) { // optional; string or addressOf number
		const iStream = 0;
		
		let	sFileMask = this.fnGetParameterAsString(fileMask);

		/*
		let sFileMask = "";
		if (typeof fileMask === "number") { // assuming addressOf
			sFileMask = String(this.fnGetVariableByAddress(fileMask)); //TTT
		} else if (typeof fileMask === "string") {
			sFileMask = fileMask;
		}
		*/

		if (sFileMask) {
			sFileMask = this.oVm.vmAdaptFilename(sFileMask, "|DIR");
		}

		this.oVm.vmStop("fileDir", 45, false, {
			iStream: iStream,
			sCommand: "|dir",
			sFileMask: sFileMask
		});
	}

	disc() {
		this.oVm.vmNotImplemented("|DISC");
	}

	disc_in() { // eslint-disable-line camelcase
		this.oVm.vmNotImplemented("|DISC.IN");
	}

	disc_out() { // eslint-disable-line camelcase
		this.oVm.vmNotImplemented("|DISC.OUT");
	}

	drive() {
		this.oVm.vmNotImplemented("|DRIVE");
	}

	era(fileMask?: string | number) {
		const iStream = 0;

		let	sFileMask = this.fnGetParameterAsString(fileMask);
		/*
		let sFileMask = "";
		if (typeof fileMask === "number") { // assuming addressOf
			sFileMask = String(this.fnGetVariableByAddress(fileMask)); //TTT
		} else if (typeof fileMask === "string") {
			sFileMask = fileMask;
		}
		*/

		sFileMask = this.oVm.vmAdaptFilename(sFileMask, "|ERA");

		this.oVm.vmStop("fileEra", 45, false, {
			iStream: iStream,
			sCommand: "|era",
			sFileMask: sFileMask
		});
	}

	ren(newName: string | number, oldName: string | number) {
		var iStream = 0;

		let sNew = this.fnGetParameterAsString(newName),
			sOld = this.fnGetParameterAsString(oldName);

		/*
		let sNew = "",
			sOld = "";

		if (typeof newName === "number") { // assuming addressOf
			sNew = String(this.fnGetVariableByAddress(newName));
		} else if (typeof newName === "string") {
			sNew = newName;
		}

		if (typeof oldName === "number") { // assuming addressOf
			sOld = String(this.fnGetVariableByAddress(oldName));
		} else if (typeof oldName === "string") {
			sOld = oldName;
		}
		*/

		sNew = this.oVm.vmAdaptFilename(sNew, "|REN");
		sOld = this.oVm.vmAdaptFilename(sOld, "|REN");

		this.oVm.vmStop("fileRen", 45, false, {
			iStream: iStream,
			sCommand: "|ren",
			sNew: sNew,
			sOld: sOld
		});
	}

	tape() {
		this.oVm.vmNotImplemented("|TAPE");
	}

	tape_in() { // eslint-disable-line camelcase
		this.oVm.vmNotImplemented("|TAPE.IN");
	}

	tape_out() { // eslint-disable-line camelcase
		this.oVm.vmNotImplemented("|TAPE.OUT");
	}

	user() {
		this.oVm.vmNotImplemented("|USER");
	}

	mode(iMode: number, s) {
		iMode = this.oVm.vmInRangeRound(iMode, 0, 3, "|MODE");
		this.oVm.iMode = iMode;

		const oWinData = CpcVm.mWinData[this.oVm.iMode];
		Utils.console.log("rsxMode: (test)", iMode, s);

		for (let i = 0; i < CpcVm.iStreamCount - 2; i += 1) { // for window streams
			const oWin = this.oVm.aWindow[i];
			Object.assign(oWin, oWinData);
		}
		this.oVm.oCanvas.changeMode(iMode); // or setMode?
	}

	renum() { // optional args: new number, old number, step, keep line (only for |renum)
		this.oVm.renum.apply(this.oVm, arguments);
	}
};
