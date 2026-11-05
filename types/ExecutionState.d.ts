export interface ExecutionState {
    readonly reason: string;
    readonly line: string | number;
    readonly isRunning: boolean;
}
export declare class ExecutionStateReporter {
    private readonly onChange?;
    private previous?;
    constructor(onChange?: ((state: ExecutionState) => void) | undefined);
    report(state: ExecutionState): void;
}
//# sourceMappingURL=ExecutionState.d.ts.map