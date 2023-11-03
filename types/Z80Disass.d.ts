interface Z80DisassOptions {
    data: Uint8Array;
    addr: number;
    format?: number;
}
export declare class Z80Disass {
    private readonly options;
    private out;
    private static readonly hexMark;
    private dissOp;
    private prefix;
    private disassPC;
    setOptions(options: Partial<Z80DisassOptions>): void;
    getOptions(): Z80DisassOptions;
    constructor(options: Z80DisassOptions);
    private readByte;
    private readWord;
    private bget;
    private bout;
    private wout;
    private radrout;
    private bregout;
    private wregout;
    private pupoRegout;
    private bitout;
    private condout;
    private arithMOut;
    private onlyPrefix;
    private operUnknown;
    private operdis00;
    private operdis01;
    private operdis02;
    private operdis03;
    private operdis04;
    private operdis05;
    private operdis06;
    private operdis07;
    private operdis10;
    private operdis20;
    private operdis30;
    private operdis31;
    private operdis32;
    private operdisCB00;
    private operdisCB;
    private operdis33;
    private operdis34;
    private operdis35;
    private operdis36;
    private operdis37;
    private operdisED;
    private getNextLine;
    disassLine(): string;
}
export {};
//# sourceMappingURL=Z80Disass.d.ts.map