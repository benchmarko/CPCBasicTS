import type { ExampleEntry, IStorage } from "./Interfaces";
import { FileMeta } from "./CpcVm";
import { DiskImage } from "./DiskImage";
export interface FileHandlerOptions {
    adaptFilename: (name: string, err: string) => string;
    updateStorageDatabase: (action: string, key: string) => void;
    outputError: (error: Error, noSelection?: boolean) => void;
    processFileImports?: boolean;
    storage: IStorage;
}
export interface FileMetaAndData {
    meta: FileMeta;
    data: string;
}
export interface EraseFilesResult {
    name: string;
    matched: boolean;
    removed: string[];
    missing: string[];
}
export interface RenameFileResult {
    status: "renamed" | "oldNotFound" | "newExists";
    oldName: string;
    newName: string;
}
export interface ExampleLoadPlan {
    name: string;
    memorizedExample: string;
    entry?: ExampleEntry;
    url: string;
    status: "loaded" | "fetch" | "missing";
}
interface StoredFileDecoderOptions {
    atobFn: (input: string) => string;
    decodeTokenizedBasic: (input: string) => string;
    applySnapshot: (input: string) => string;
    importArchive: (input: string, type: "X" | "Z") => string[];
}
export declare class FileHandler {
    private readonly options;
    private static readonly metaIdent;
    private static readonly defaultExtensions;
    private processFileImports;
    private diskImage?;
    constructor(options: FileHandlerOptions);
    setOptions(options: Partial<FileHandlerOptions>): void;
    getDiskImage(): DiskImage;
    static getStorageName(name: string, defaultExtension?: string): string;
    static createExampleLoadRequest(key: string, database: string, metadata: string | undefined, autorun: boolean): {
        name: string;
        command: "run" | "load";
    };
    static resolveExamplePath(name: string, currentKey: string): {
        name: string;
        memorizedExample: string;
    };
    static prepareExampleLoad(name: string, currentKey: string, examples: Record<string, ExampleEntry>, databaseDir: string): ExampleLoadPlan;
    static prepareSave(file: FileMeta & {
        name: string;
        command: string;
        fileData: string[];
    }, getSource: () => string, encodeTokens: (input: string, name: string) => string): {
        name: string;
        data: string;
        storedData: string;
    };
    saveFile(file: FileMeta & {
        name: string;
        command: string;
        fileData: string[];
    }, getSource: () => string, encodeTokens: (input: string, name: string) => string): {
        name: string;
        data: string;
        storedData: string;
    };
    static loadFromStorage(storage: IStorage, name: string): string | null;
    static splitMeta(input: string): FileMetaAndData;
    static getMetaIdent(): string;
    static formatDirectoryEntries(entries: readonly string[], sort?: boolean): string[];
    static decodeStoredFile(input: string, options: StoredFileDecoderOptions): FileMetaAndData;
    private static asmGena3Convert;
    static prepareMaskRegExp(mask: string): RegExp;
    static getStorageDirectoryEntries(storage: IStorage, mask?: string): string[];
    static getDirectoryEntries(storage: IStorage, examples: Record<string, ExampleEntry>, currentExample: string, mask?: string): string[];
    eraseFiles(mask: string): EraseFilesResult;
    renameFile(oldName: string, newName: string): RenameFileResult;
    static joinMeta(meta: FileMeta): string;
    private static reRegExpIsText;
    private processDskFile;
    private processZipFile;
    fnLoad2(data: string | Uint8Array, name: string, type: string, imported: string[]): void;
}
export {};
//# sourceMappingURL=FileHandler.d.ts.map