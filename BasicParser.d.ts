import { LexerToken } from "./BasicLexer";
interface BasicParserOptions {
    bQuiet?: boolean;
}
export interface ParserNode extends LexerToken {
    left?: ParserNode;
    right?: ParserNode;
    args?: ParserNode[];
    args2?: ParserNode[];
    len?: number;
    bSpace?: boolean;
}
export declare class BasicParser {
    sLine: string;
    bQuiet: boolean;
    static mParameterTypes: {
        c: string;
        f: string;
        o: string;
        n: string;
        s: string;
        l: string;
        q: string;
        v: string;
        r: string;
        a: string;
        "n0?": string;
        "#": string;
    };
    static mKeywords: {
        [k in string]: string;
    };
    static mCloseTokens: {
        ":": number;
        "(eol)": number;
        "(end)": number;
        else: number;
        rem: number;
        "'": number;
    };
    constructor(options?: BasicParserOptions);
    init(options: BasicParserOptions): void;
    reset(): void;
    private composeError;
    parse(aTokens: LexerToken[], bAllowDirect?: boolean): ParserNode[];
}
export {};
