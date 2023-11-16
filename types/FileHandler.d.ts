import { FileMeta } from "./CpcVm";
import { DiskImage } from "./DiskImage";
export interface FileHandlerOptions {
    adaptFilename: (name: string, err: string) => string;
    updateStorageDatabase: (action: string, key: string) => void;
    outputError: (error: Error, noSelection?: boolean) => void;
    processFileImports?: boolean;
}
export declare class FileHandler {
    private readonly options;
    private static readonly metaIdent;
    private processFileImports;
    private diskImage?;
    constructor(options: FileHandlerOptions);
    setOptions(options: Partial<FileHandlerOptions>): void;
    getDiskImage(): DiskImage;
    private static fnLocalStorageName;
    static getMetaIdent(): string;
    static joinMeta(meta: FileMeta): string;
    private static reRegExpIsText;
    private processDskFile;
    private processZipFile;
    fnLoad2(data: string | Uint8Array, name: string, type: string, imported: string[]): void;
}
//# sourceMappingURL=FileHandler.d.ts.map