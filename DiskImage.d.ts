export interface DiskImageOptions {
    sDiskName: string;
    sData: string;
}
interface ExtentEntry {
    iUser: number;
    sName: string;
    sExt: string;
    iExtent: number;
    iLastRecBytes: number;
    iExtentHi: number;
    iRecords: number;
    aBlocks: number[];
    bReadOnly: boolean;
    bSystem: boolean;
    bBackup: boolean;
}
export interface AmsdosHeader {
    iUser: number;
    sName: string;
    sExt: string;
    iType: number;
    iStart: number;
    iPseudoLen: number;
    iEntry: number;
    iLength: number;
    sType: string;
}
declare type DirectoryListType = {
    [k in string]: ExtentEntry[];
};
export declare class DiskImage {
    private static mFormatDescriptors;
    private sDiskName;
    private sData;
    private oDiskInfo;
    private oFormat;
    constructor(oConfig: DiskImageOptions);
    private static getInitialDiskInfo;
    private static getInitialFormat;
    reset(): void;
    private composeError;
    static testDiskIdent(sIdent: string): number;
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
    readFile(aFileExtents: ExtentEntry[]): string;
    private static mProtectTable;
    static unOrProtectData(sData: string): string;
    private static computeChecksum;
    static parseAmsdosHeader(sData: string): AmsdosHeader | undefined;
}
export {};
