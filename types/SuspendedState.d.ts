import type { CpcVm, VmStopEntry } from "./CpcVm";
import type { IKeyboard } from "./Interfaces";
export declare class SuspendedState {
    private readonly initial;
    private saved;
    constructor(initial: VmStopEntry);
    private static copy;
    save(stop: VmStopEntry): void;
    get(): VmStopEntry;
    reset(): void;
    restore(stop: VmStopEntry): void;
    restoreForContinue(vm: Pick<CpcVm, "cursor">, stop: VmStopEntry, beforeRestore?: () => void): boolean;
    escape(vm: Pick<CpcVm, "line" | "vmGetStopObject" | "vmOnBreakContSet" | "vmOnBreakHandlerActive" | "vmEscape" | "vmStop" | "vmGoto" | "cursor" | "print">, keyboard: Pick<IKeyboard, "clearInput">): "ignored" | "input" | "suspended" | "continued" | "stopped";
}
//# sourceMappingURL=SuspendedState.d.ts.map