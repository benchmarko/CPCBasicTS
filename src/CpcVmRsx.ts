// CpcVmRsx.ts - CPC Virtual Machine: RSX
// (c) Marco Vieth, 2020
// https://benchmarko.github.io/CPCBasicTS/
//

//import { Utils } from "./Utils";
//import { ICpcVmRsx, , VmFileParas } from "./Interfaces";
import { RsxCommandType, ICpcVm, ICpcVmRsx } from "./Interfaces";

export class CpcVmRsx {
	private readonly rsxPermanent: Record<string, RsxCommandType> = {};
	private rsxTemporary: Record<string, RsxCommandType> = {};

	/*
	constructor(vm: ICpcVm) {
		this.vm = vm;
	}
	*/

	callRsx(vm: ICpcVm, name: string, ...args: (string|number)[]): void {
		const fn = this.rsxTemporary[name] || this.rsxPermanent[name];

		if (fn) {
			fn.apply(vm, args);
		} else {
			throw vm.vmComposeError(Error(), 28, "|" + name); // Unknown command
		}
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
