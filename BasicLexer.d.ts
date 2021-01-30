interface BasicLexerOptions {
    bQuiet?: boolean;
}
export interface LexerToken {
    type: string;
    value: string;
    pos: number;
    orig?: string;
}
export declare class BasicLexer {
    bQuiet: boolean;
    sLine: string;
    bTakeNumberAsLine: boolean;
    constructor(options?: BasicLexerOptions);
    reset(): void;
    private composeError;
    lex(input: string): LexerToken[];
}
export {};
