export declare class BasicTokenizer {
    iPos: number;
    iLine: number;
    iLineEnd: number;
    sInput: string;
    constructor();
    private fnNum8Dec;
    private fnNum16Dec;
    private fnNum32Dec;
    private fnNum8DecAsStr;
    private fnNum16DecAsStr;
    private fnNum16Bin;
    private fnNum16Hex;
    private fnNumFp;
    private fnGetBit7TerminatedString;
    private fnVar;
    private fnIntVar;
    private fnStringVar;
    private fnFpVar;
    private fnRsx;
    private fnStringUntilEol;
    private fnApostrophe;
    private fnRem;
    private fnQuotedString;
    private mTokens;
    private mTokensFF;
    private fnParseNextLine;
    private fnParseProgram;
    decode(sProgram: string): string;
}
