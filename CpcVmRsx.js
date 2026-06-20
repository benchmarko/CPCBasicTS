// CpcVmRsx.ts - CPC Virtual Machine: RSX (Resident System Extension)
// (c) Marco Vieth, 2020
// https://benchmarko.github.io/CPCBasicTS/
//
export class CpcVmRsx {
    constructor() {
        this.rsxPermanent = {};
        this.rsxTemporary = {};
    }
    callRsx(vm, name, ...args) {
        const fn = this.rsxTemporary[name] || this.rsxPermanent[name];
        if (fn) {
            fn.apply(vm, args);
        }
        return Boolean(fn);
    }
    registerRsx(rsxModule, permanent) {
        const rsxRegister = permanent ? this.rsxPermanent : this.rsxTemporary, rsxCommands = rsxModule.getRsxCommands();
        for (const command in rsxCommands) {
            if (rsxCommands.hasOwnProperty(command)) {
                rsxRegister[command] = rsxCommands[command];
            }
        }
    }
    resetRsx() {
        this.rsxTemporary = {};
    }
}
//# sourceMappingURL=CpcVmRsx.js.map