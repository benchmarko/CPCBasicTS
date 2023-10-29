declare type SnapshotInfo = {
    ident: string;
    unused1: string;
    version: number;
    z80: {
        AF: number;
        BC: number;
        DE: number;
        HL: number;
        IR: number;
        IFF: number;
        IX: number;
        IY: number;
        SP: number;
        PC: number;
        M: number;
        AF2: number;
        BC2: number;
        DE2: number;
        HL2: number;
    };
    ga: {
        inknum: number;
        inkval: number[];
        multi: number;
    };
    ramconf: number;
    crtc: {
        index: number;
        reg: number[];
    };
    romnum: number;
    ppi: {
        portA: number;
        portB: number;
        portC: number;
        portCtl: number;
    };
    psg: {
        index: number;
        reg: number[];
    };
    memsize: number;
};
export interface SnapshotOptions {
    name: string;
    data: string;
    quiet?: boolean;
}
export declare class Snapshot {
    private readonly options;
    private pos;
    setOptions(options: SnapshotOptions): void;
    constructor(options: SnapshotOptions);
    private composeError;
    static testSnapIdent(ident: string): boolean;
    private readUInt8;
    private readUInt16;
    private readUInt8Array;
    private readUtf;
    getSnapshotInfo(): SnapshotInfo;
    getMemory(): string;
}
export {};
//# sourceMappingURL=Snapshot.d.ts.map