export declare class InputStack {
    aInput: string[];
    iStackPosition: number;
    constructor();
    init(): this;
    getInput(): string;
    clearRedo(): this;
    save(sInput: any): this;
    canUndo(): boolean;
    canUndoKeepOne(): boolean;
    undo(): string;
    canRedo(): boolean;
    redo(): string;
}
