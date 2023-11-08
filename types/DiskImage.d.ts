export interface DiskImageOptions {
    diskName: string;
    data: string;
    quiet?: boolean;
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
    private readonly options;
    private diskInfo;
    private format;
    setOptions(options: DiskImageOptions): void;
    getOptions(): DiskImageOptions;
    constructor(options: DiskImageOptions);
    private static readonly formatDescriptors;
    private static getInitialDiskInfo;
    private static getInitialFormatDescriptor;
    reset(): void;
    private composeError;
    private static readonly diskInfoIdentMap;
    static testDiskIdent(ident: string): number;
    private readUtf;
    private readUInt8;
    private readUInt16;
    private static uInt8ToString;
    private static uInt16ToString;
    private static uInt24ToString;
    private static readonly diskInfoSize;
    private readDiskInfo;
    private static createDiskInfoAsString;
    private static readonly trackInfoSize;
    private readTrackInfo;
    private static createTrackInfoAsString;
    private seekTrack;
    private sectorNum2Index;
    private seekSector;
    private readSector;
    private writeSector;
    private getFormatDescriptor;
    private determineFormat;
    private createImage;
    formatImage(format: string): string;
    private static fnRemoveHighBit7;
    private static fnAddHighBit7;
    private readDirectoryExtents;
    private static createDirectoryExtentAsString;
    private static createSeveralDirectoryExtentsAsString;
    private static fnSortByExtentNumber;
    private static sortFileExtents;
    private static prepareDirectoryList;
    private convertBlock2Sector;
    private readAllDirectoryExtents;
    private writeAllDirectoryExtents;
    readDirectory(): DirectoryListType;
    private nextSector;
    private readBlock;
    private writeBlock;
    private readExtents;
    readFile(fileExtents: ExtentEntry[]): string;
    private static getFreeExtents;
    private static getBlockMask;
    private static getFreeBlocks;
    private static getFilenameAndExtension;
    writeFile(filename: string, data: string): boolean;
    private static protectTable;
    static unOrProtectData(data: string): string;
    private static computeChecksum;
    static parseAmsdosHeader(data: string): AmsdosHeader | undefined;
    static combineAmsdosHeader(header: AmsdosHeader): string;
}
export {};
//# sourceMappingURL=DiskImage.d.ts.map