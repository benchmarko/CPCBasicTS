export declare class ZipFile {
    aData: Uint8Array;
    sZipName: string;
    oEntryTable: object;
    constructor(aData: Uint8Array, sZipName: string);
    init(aData: Uint8Array, sZipName: string): void;
    composeError(...aArgs: any[]): any;
    subArr(iBegin: number, iLength: number): Uint8Array;
    readUTF(iOffset: number, iLen: number): string;
    readUInt(i: number): number;
    readUShort(i: number): number;
    readEocd(iEocdPos: number): {
        iSignature: number;
        iEntries: number;
        iCdfhOffset: number;
        iCdSize: number;
    };
    readCdfh(iPos: number): {
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
        sName: any;
        bIsDirectory: any;
        aExtra: any;
        sComment: any;
        iTimestamp: any;
        iDataStart: any;
    };
    readZipDirectory(): {};
    inflate(iOffset: number, iCompressedSize: number, iFinalSize: number): Uint8Array;
    readData(sName: string): string;
}
