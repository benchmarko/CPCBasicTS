import type { CpcVm } from "./CpcVm";
import type { VmBaseParas } from "./Interfaces";
interface RunLoopOptions {
    vm: Pick<CpcVm, "vmGetStopObject" | "vmStop">;
    execute: () => void;
    handlers: Record<string, (paras: VmBaseParas) => void>;
    getInitialDelay: () => number;
    setTimeout: (callback: () => void, delay: number) => unknown;
    onExit: () => void;
    onStateChange: () => void;
    onUnknownReason: (reason: string) => void;
}
export declare class RunLoop {
    private readonly options;
    private active;
    private readonly runHandler;
    nextDelay: number;
    constructor(options: RunLoopOptions);
    get isRunning(): boolean;
    start(): void;
    private run;
}
export {};
//# sourceMappingURL=RunLoop.d.ts.map