// RsxCpcBasic.ts - RSX CpcBasic
// (c) Marco Vieth, 2023
// https://benchmarko.github.io/CPCBasicTS/
//

import { Utils } from "./Utils";
import { ICpcVmRsx, ICpcVm, RsxCommandType } from "./Interfaces";

export class RsxCpcBasic implements ICpcVmRsx {
	private static readonly rsxCommands: Record<string, RsxCommandType> = {
		basic(): void {
			Utils.console.log("basic: |BASIC");
			this.vmStop("reset", 90);
		},
		mode: function (this: ICpcVm, mode: string | number) {
			mode = this.vmInRangeRound(Number(mode), 0, 3, "|MODE");
			this.vmChangeMode(mode);
		},
		renum: function (this: ICpcVm, ...args: (string | number)[]) {
			this.renum.apply(this, args);
		}
	}

	getRsxCommands(): Record<string, RsxCommandType> { // eslint-disable-line class-methods-use-this
		return RsxCpcBasic.rsxCommands;
	}
}
