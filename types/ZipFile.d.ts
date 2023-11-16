interface ZipFileOptions {
    data: Uint8Array;
    zipName: string;
}
interface CentralDirFileHeader {
    signature: number;
    version: number;
    flag: number;
    compressionMethod: number;
    modificationTime: number;
    crc: number;
    compressedSize: number;
    size: number;
    fileNameLength: number;
    extraFieldLength: number;
    fileCommentLength: number;
    localOffset: number;
    name: string;
    isDirectory: boolean;
    extra: Uint8Array;
    comment: string;
    timestamp: number;
    dataStart: number;
}
declare type ZipDirectoryType = {
    [k in string]: CentralDirFileHeader;
};
export declare class ZipFile {
    private readonly options;
    private data;
    private entryTable;
    constructor(options: ZipFileOptions);
    getOptions(): ZipFileOptions;
    setOptions(options: Partial<ZipFileOptions>, force: boolean): void;
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
    readData(name: string): string;
}
export {};
//# sourceMappingURL=ZipFile.d.ts.map