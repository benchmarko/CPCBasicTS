export interface DiskImageOptions {
    sDiskName: string;
    sData: string;
}
interface SectorInfo {
    length: number;
}
declare type SectorNum2IndexMap = {
    [k in number]: number;
};
interface TrackInfo {
    sIdent: string;
    iTrack: number;
    iHead: number;
    iDataRate: number;
    iRecMode: number;
    iBps: number;
    iSpt: number;
    iGap3: number;
    iFill: number;
    aSectorInfo: SectorInfo;
    iDataPos: number;
    oSectorNum2Index: SectorNum2IndexMap;
}
interface DiskInfo {
    sIdent: string;
    sCreator: string;
    iTracks: number;
    iHeads: number;
    iTrackSize: number;
    oTrackInfo: TrackInfo;
    bExtended: boolean;
    aTrackSizes: number[];
    aTrackPos: number[];
}
interface FormatDescriptor {
    iTracks: number;
    iHeads: number;
    iBps: number;
    iSpt: number;
    iGap3: number;
    iFill: number;
    iFirstSector: number;
    iBls: number;
    iAl0: number;
    iAl1: number;
    iOff: number;
}
interface AmsdosHeader {
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
export declare class DiskImage {
    private static mFormatDescriptors;
    sDiskName: string;
    sData: string;
    iPos: number;
    oDiskInfo: DiskInfo;
    oFormat: FormatDescriptor;
    constructor(oConfig: DiskImageOptions);
    init(oConfig: DiskImageOptions): void;
    reset(): this;
    private composeError;
    static testDiskIdent(sIdent: string): boolean;
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
    private readDirectoryExtents;
    private sortFileExtents;
    private prepareDirectoryList;
    private convertBlock2Sector;
    readDirectory(): {};
    private nextSector;
    private readBlock;
    readFile(aFileExtents: any): string;
    static unOrProtectData(sData: string): string;
    private static computeChecksum;
    static parseAmsdosHeader(sData: string): AmsdosHeader;
}
export {};
