export declare class BasicTokenizer {
    sData: string;
    iPos: number;
    iLine: number;
    iLineEnd: number;
    sInput: string;
    constructor();
    init(): void;
    reset(): void;
    decode(sProgram: string): string;
}
