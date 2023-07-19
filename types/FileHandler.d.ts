import { AmsdosHeader } from "./DiskImage";
export interface FileHandlerOptions {
    adaptFilename: (name: string, err: string) => string;
    updateStorageDatabase: (action: string, key: string) => void;
    outputError: (error: Error, noSelection?: boolean) => void;
}
export declare class FileHandler {
    private static readonly metaIdent;
    private adaptFilename;
    private updateStorageDatabase;
    private outputError;
    constructor(options: FileHandlerOptions);
    private static fnLocalStorageName;
    static createMinimalAmsdosHeader(type: string, start: number, length: number): AmsdosHeader;
    private static joinMeta;
    private static reRegExpIsText;
    fnLoad2(data: string, name: string, type: string, imported: string[]): void;
}
//# sourceMappingURL=FileHandler.d.ts.map