export interface DiskImageOptions {
    diskName?: string;
    data: string;
    creator?: string;
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
    private formatDescriptor?;
    constructor(options: DiskImageOptions);
    getOptions(): DiskImageOptions;
    setOptions(options: Partial<DiskImageOptions>): void;
    private static readonly twoHeads;
    private static readonly formatDescriptors;
    private static getInitialDiskInfo;
    private getFormatDescriptor;
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
    private static sectorNum2Index;
    private static seekSector;
    private readSector;
    private writeSector;
    private composeFormatDescriptor;
    private determineFormat;
    private createImage;
    formatImage(format: string): string;
    private static fnRemoveHighBit7;
    private readDirectoryExtents;
    private static createDirectoryExtentAsString;
    private static createSeveralDirectoryExtentsAsString;
    private static fnSortByExtentNumber;
    private static sortFileExtents;
    private static prepareDirectoryList;
    private static convertBlock2Sector;
    private readAllDirectoryExtents;
    private writeAllDirectoryExtents;
    readDirectory(): DirectoryListType;
    private static nextSector;
    private readBlock;
    private writeBlock;
    private readExtents;
    readFile(fileExtents: ExtentEntry[]): string;
    private static getFreeExtents;
    private static getBlockMask;
    private static getFreeBlocks;
    static getFilenameAndExtension(filename: string): string[];
    writeFile(filename: string, data: string): boolean;
    private static isSectorEmpty;
    stripEmptyTracks(): string;
    private static readonly protectTable;
    static unOrProtectData(data: string): string;
    private static computeChecksum;
    private static hasAmsdosHeader;
    static parseAmsdosHeader(data: string): AmsdosHeader | undefined;
    static combineAmsdosHeader(header: AmsdosHeader): string;
    static createAmsdosHeader(parameter: Partial<AmsdosHeader>): AmsdosHeader;
}
export {};
//# sourceMappingURL=DiskImage.d.ts.map