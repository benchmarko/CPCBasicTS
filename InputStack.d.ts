export declare class InputStack {
    private input;
    private stackPosition;
    reset(): void;
    getInput(): string;
    clearRedo(): void;
    save(input: string): void;
    canUndoKeepOne(): boolean;
    undo(): string;
    canRedo(): boolean;
    redo(): string;
}
