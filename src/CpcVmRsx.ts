// CpcVmRsx.ts - CPC Virtual Machine: RSX (Resident System Extension)
// (c) Marco Vieth, 2020
// https://benchmarko.github.io/CPCBasicTS/
//

import { RsxCommandType, ICpcVm, ICpcVmRsx } from "./Interfaces";

export class CpcVmRsx {
	private readonly rsxPermanent: Record<string, RsxCommandType> = {};
	private rsxTemporary: Record<string, RsxCommandType> = {};

	callRsx(vm: ICpcVm, name: string, ...args: (string|number)[]): boolean {
		const fn = this.rsxTemporary[name] || this.rsxPermanent[name];

		if (fn) {
			fn.apply(vm, args);
		}
		return Boolean(fn);
	}

	registerRsx(rsxModule: ICpcVmRsx, permanent: boolean): void {
		const rsxRegister = permanent ? this.rsxPermanent : this.rsxTemporary,
			rsxCommands = rsxModule.getRsxCommands();

		for (const command in rsxCommands) {
			if (rsxCommands.hasOwnProperty(command)) {
				rsxRegister[command] = rsxCommands[command];
			}
		}
	}

	resetRsx(): void {
		this.rsxTemporary = {};
	}
}
