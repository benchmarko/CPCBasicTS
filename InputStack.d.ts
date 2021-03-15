export declare class InputStack {
    private aInput;
    private iStackPosition;
    reset(): void;
    getInput(): string;
    clearRedo(): void;
    save(sInput: string): void;
    canUndoKeepOne(): boolean;
    undo(): string;
    canRedo(): boolean;
    redo(): string;
}
