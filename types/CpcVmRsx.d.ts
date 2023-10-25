import { ICpcVm, ICpcVmRsx } from "./Interfaces";
export declare class CpcVmRsx {
    private readonly rsxPermanent;
    private rsxTemporary;
    callRsx(vm: ICpcVm, name: string, ...args: (string | number)[]): void;
    registerRsx(rsxModule: ICpcVmRsx, permanent: boolean): void;
    resetRsx(): void;
}
//# sourceMappingURL=CpcVmRsx.d.ts.map