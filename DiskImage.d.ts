export interface DiskImageOptions {
    diskName: string;
    data: string;
}
interface ExtentEntry {
    user: number;
    name: string;
    ext: string;
    extent: number;
    lastRecBytes: number;
    extentHi: number;
    records: number;
    blocks: number[];
    readOnly: boolean;
    system: boolean;
    backup: boolean;
}
export interface AmsdosHeader {
    user: number;
    name: string;
    ext: string;
    typeNumber: number;
    start: number;
    pseudoLen: number;
    entry: number;
    length: number;
    typeString: string;
}
declare type DirectoryListType = Record<string, ExtentEntry[]>;
export declare class DiskImage {
    private diskName;
    private data;
    private diskInfo;
    private format;
    constructor(config: DiskImageOptions);
    private static readonly formatDescriptors;
    private static getInitialDiskInfo;
    private static getInitialFormat;
    reset(): void;
    private composeError;
    static testDiskIdent(ident: string): number;
    private readUtf;
    private readUInt8;
    private readUInt16;
    private readDiskInfo;
    private readTrackInfo;
    private seekTrack;
    private sectorNum2Index;
    private seekSector;
    private readSector;
    private getFormatDescriptor;
    private determineFormat;
    private static fnRemoveHighBit7;
    private readDirectoryExtents;
    private static fnSortByExtentNumber;
    private static sortFileExtents;
    private static prepareDirectoryList;
    private convertBlock2Sector;
    readDirectory(): DirectoryListType;
    private nextSector;
    private readBlock;
    readFile(fileExtents: ExtentEntry[]): string;
    private static protectTable;
    static unOrProtectData(data: string): string;
    private static computeChecksum;
    static parseAmsdosHeader(data: string): AmsdosHeader | undefined;
    private static uInt8ToString;
    private static uInt16ToString;
    private static uInt24ToString;
    static combineAmsdosHeader(header: AmsdosHeader): string;
}
export {};
