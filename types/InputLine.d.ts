import type { CpcVm } from "./CpcVm";
import type { IKeyboard, VmInputParas } from "./Interfaces";
export interface InputLineResult {
    input: string;
    submitted: boolean;
}
export declare class InputLine {
    private readonly keyboard;
    private readonly vm;
    constructor(keyboard: Pick<IKeyboard, "getKeyFromBuffer">, vm: Pick<CpcVm, "print" | "copychr$">);
    submit(paras: VmInputParas): boolean;
    readAndSubmit(paras: VmInputParas, onReturn?: (input: string) => void): boolean;
    read(input: string, stream: number): InputLineResult;
}
//# sourceMappingURL=InputLine.d.ts.map