import { FileMeta } from "./CpcVm";
export interface FileHandlerOptions {
    adaptFilename: (name: string, err: string) => string;
    updateStorageDatabase: (action: string, key: string) => void;
    outputError: (error: Error, noSelection?: boolean) => void;
    processFileImports?: boolean;
}
export declare class FileHandler {
    private static readonly metaIdent;
    private adaptFilename;
    private updateStorageDatabase;
    private outputError;
    private processFileImports;
    setOptions(options: Partial<FileHandlerOptions>): void;
    constructor(options: FileHandlerOptions);
    private static fnLocalStorageName;
    static getMetaIdent(): string;
    static joinMeta(meta: FileMeta): string;
    private static reRegExpIsText;
    private processDskFile;
    private processZipFile;
    fnLoad2(data: string | Uint8Array, name: string, type: string, imported: string[]): void;
}
//# sourceMappingURL=FileHandler.d.ts.map