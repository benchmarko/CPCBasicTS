interface CentralDirFileHeader {
    iSignature: number;
    iVersion: number;
    iFlag: number;
    iCompressionMethod: number;
    iModificationTime: number;
    iCrc: number;
    iCompressedSize: number;
    iSize: number;
    iFileNameLength: number;
    iExtraFieldLength: number;
    iFileCommentLength: number;
    iLocalOffset: number;
    sName: string;
    bIsDirectory: boolean;
    aExtra: Uint8Array;
    sComment: string;
    iTimestamp: number;
    iDataStart: number;
}
declare type ZipDirectoryType = {
    [k in string]: CentralDirFileHeader;
};
export declare class ZipFile {
    aData: Uint8Array;
    sZipName: string;
    private oEntryTable;
    constructor(aData: Uint8Array, sZipName: string);
    init(aData: Uint8Array, sZipName: string): void;
    getZipDirectory(): ZipDirectoryType;
    private composeError;
    private subArr;
    private readUTF;
    private readUInt;
    private readUShort;
    private readEocd;
    private readCdfh;
    private readZipDirectory;
    private inflate;
    readData(sName: string): string;
}
export {};
