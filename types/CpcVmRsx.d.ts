import { ICpcVmRsx } from "./Interfaces";
import { CpcVm } from "./CpcVm";
export declare class CpcVmRsx implements ICpcVmRsx {
    private readonly vm;
    constructor(vm: CpcVm);
    rsxIsAvailable(name: string): boolean;
    rsxExec(name: string, ...args: (string | number)[]): void;
    a(): void;
    b(): void;
    basic(): void;
    cpm(): void;
    private fnGetVariableByAddress;
    private fnGetParameterAsString;
    dir(fileMask?: string | number): void;
    disc(): void;
    disc_in(): void;
    disc_out(): void;
    drive(): void;
    era(fileMask?: string | number): void;
    ren(newName: string | number, oldName: string | number): void;
    tape(): void;
    tape_in(): void;
    tape_out(): void;
    user(): void;
    mode(mode: number): void;
    renum(...args: number[]): void;
}
//# sourceMappingURL=CpcVmRsx.d.ts.map