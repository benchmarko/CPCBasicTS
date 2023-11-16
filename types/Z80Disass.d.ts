interface Z80DisassOptions {
    data: Uint8Array;
    addr: number;
    format?: number;
}
export declare class Z80Disass {
    private readonly options;
    private static readonly hexMark;
    private dissOp;
    private prefix;
    constructor(options: Z80DisassOptions);
    getOptions(): Z80DisassOptions;
    setOptions(options: Partial<Z80DisassOptions>): void;
    private readByte;
    private readWord;
    private bget;
    private bout;
    private wout;
    private radrout;
    static readonly bregtab: string[][];
    private bregout;
    static readonly wregtab: string[][];
    private wregout;
    private pupoRegout;
    private onlyPrefix;
    private static readonly unknownOp;
    private static readonly rlcTable;
    private static readonly bitResSetTable;
    private operdisCB;
    private static readonly ldIaTable;
    private operdisEDpart40To7F;
    private static readonly repeatTable;
    private operdisED;
    private static readonly conditionTable;
    private operdis00To3Fpart00;
    private operdis00To3Fpart01;
    private operdis00To3Fpart02;
    private static readonly rlcaTable;
    private operdis00To3F;
    private static readonly arithMTab;
    private operdisC0ToFFpart01;
    private operdisC0ToFFpart03;
    private operdisC0ToFFpart05;
    private operdisC0ToFF;
    private static readonly prefixMap;
    private getNextLine;
    disassLine(): string;
}
export {};
//# sourceMappingURL=Z80Disass.d.ts.map