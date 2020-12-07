import { CpcVm } from "./CpcVm";
export declare class CpcVmRsx {
    oVm: CpcVm;
    constructor(oVm: CpcVm);
    rsxInit(oVm: CpcVm): void;
    rsxIsAvailable(sName: string): boolean;
    rsxExec(sName: string, ...aArgs: (string | number)[]): void;
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
    mode(iMode: number, s: any): void;
    renum(): void;
}
