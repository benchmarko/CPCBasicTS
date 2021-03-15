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
    private aData;
    private sZipName;
    private oEntryTable;
    constructor(aData: Uint8Array, sZipName: string);
    getZipDirectory(): ZipDirectoryType;
    private composeError;
    private subArr;
    private readUTF;
    private readUInt;
    private readUShort;
    private readEocd;
    private readCdfh;
    private readZipDirectory;
    private static fnInflateConstruct;
    private static fnConstructFixedHuffman;
    private inflate;
    readData(sName: string): string;
}
export {};
