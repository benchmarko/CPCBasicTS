interface BasicLexerOptions {
    bQuiet?: boolean;
}
export interface BasicLexerToken {
    type: string;
    value: string | number;
    pos: number;
    orig?: string;
}
export declare class BasicLexer {
    bQuiet: boolean;
    iLine: number;
    bTakeNumberAsLine: boolean;
    constructor(options?: any);
    init(options: BasicLexerOptions): void;
    reset(): void;
    composeError(...aArgs: any[]): any;
    lex(input: string): BasicLexerToken[];
}
export {};
