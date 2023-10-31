// CpcVmRsx.ts - CPC Virtual Machine: RSX (Resident System Extension)
// (c) Marco Vieth, 2020
// https://benchmarko.github.io/CPCBasicTS/
//

import { RsxCommandType, ICpcVm, ICpcVmRsx } from "./Interfaces";

export class CpcVmRsx {
	private readonly rsxPermanent: Record<string, RsxCommandType> = {};
	private rsxTemporary: Record<string, RsxCommandType> = {};

	/*
	private readonly addrPermanent: Record<string, RsxCommandType> = {};
	private addrTemporary: Record<string, RsxCommandType> = {};
	*/

	/*
	rxAvailable(name: string): boolean {
		return Boolean(this.rsxTemporary[name] || this.rsxPermanent[name]);
	}
	*/

	callRsx(vm: ICpcVm, name: string, ...args: (string|number)[]): boolean {
		const fn = this.rsxTemporary[name] || this.rsxPermanent[name];

		if (fn) {
			fn.apply(vm, args);
		}
		return Boolean(fn);
	}

	/*
	// we also allow to define adresses for call
	callAddr(vm: ICpcVm, addr: number, ...args: (string|number)[]): void {
		const fn = this.addrTemporary[addr] || this.addrPermanent[addr];

		if (fn) {
			fn.apply(vm, args);
		} else if (Utils.debug > 0) {
			Utils.console.debug("Ignored: CALL", addr, args);
		}
	}
	*/

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
