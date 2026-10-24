import { NoCanvas } from "../ui/NoCanvas";
import type { CustomError } from "../Interfaces";
export interface HeadlessCell {
    char: number;
    pen: number;
    paper: number;
}
export interface HeadlessRunOptions {
    maxSteps?: number;
}
export interface HeadlessRunResult {
    reason: "input" | "budget" | "frame" | "stopped" | "blocked" | "error";
    steps: number;
    line: number | string;
    vmReason: string;
    error?: Error;
}
export interface HeadlessMachineOptions {
    seed?: number;
    ticks?: number;
}
export declare class HeadlessScreen extends NoCanvas {
    private readonly cells;
    private modeValue;
    constructor();
    reset(): void;
    getCell(x: number, y: number): HeadlessCell | undefined;
    printChar(char: number, x: number, y: number, pen: number, paper: number, transparent: boolean): void;
    readChar(x: number, y: number): number;
    clearFullWindow(): void;
    fillTextBox(left: number, top: number, width: number, height: number, paper: number): void;
    clearTextWindow(left: number, right: number, top: number, bottom: number, paper: number): void;
    private scroll;
    windowScrollUp(left: number, right: number, top: number, bottom: number, paper: number): void;
    windowScrollDown(left: number, right: number, top: number, bottom: number, paper: number): void;
    setMode(mode: number): void;
    getMode(): number;
    changeMode(_mode: number): void;
    getByte(_address: number): number;
    setByte(_address: number, _byte: number): void;
    draw(_x: number, _y: number): void;
    move(_x: number, _y: number): void;
    plot(_x: number, _y: number): void;
    test(_x: number, _y: number): number;
    fill(_pen: number): void;
    printGChar(_char: number): void;
}
export declare class HeadlessCompileError extends Error {
    readonly diagnostic: CustomError;
    constructor(diagnostic: CustomError);
}
export declare class HeadlessProgram {
    private readonly code;
    private readonly variableNames;
    constructor(code: string, variableNames: string[]);
    createHeadlessMachine(options?: HeadlessMachineOptions): HeadlessMachine;
}
export declare class HeadlessMachine {
    readonly screen: HeadlessScreen;
    private readonly keyboard;
    private readonly variables;
    private readonly vm;
    private readonly execute;
    private fault?;
    constructor(code: string, names: string[], options: HeadlessMachineOptions);
    advanceTime(ticks: number): void;
    pressKey(key: string): void;
    run(options?: HeadlessRunOptions): HeadlessRunResult;
    runUntilInput(options?: HeadlessRunOptions): HeadlessRunResult;
    private executeUntil;
    getOutput(): string;
    getTime(): number;
    private variableKey;
    private scalar;
    private assigned;
    getVariable(name: string): string | number;
    setVariable(name: string, value: string | number): void;
    private arraySlot;
    getArrayElement(name: string, indices: number[]): string | number;
    setArrayElement(name: string, indices: number[], value: string | number): void;
}
export declare function compile(source: string, options?: {
    implicitLines?: boolean;
}): HeadlessProgram;
//# sourceMappingURL=Headless.d.ts.map