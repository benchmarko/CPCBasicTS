export declare class InputStack {
    aInput: string[];
    iStackPosition: number;
    constructor();
    reset(): void;
    getInput(): string;
    clearRedo(): void;
    save(sInput: string): void;
    canUndoKeepOne(): boolean;
    undo(): string;
    canRedo(): boolean;
    redo(): string;
}
