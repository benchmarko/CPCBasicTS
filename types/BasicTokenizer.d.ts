export declare class BasicTokenizer {
    private pos;
    private line;
    private lineEnd;
    private input;
    private needSpace;
    private readonly debug;
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
    private readonly tokens;
    private readonly tokensFF;
    private debugPrintInfo;
    private debugCollectInfo;
    private fnParseNextToken;
    private fnParseLineFragment;
    private fnParseNextLine;
    private fnParseProgram;
    decodeLineFragment(program: string, offset: number, length: number): string;
    decode(program: string): string;
}
//# sourceMappingURL=BasicTokenizer.d.ts.map