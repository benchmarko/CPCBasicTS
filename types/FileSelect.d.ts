export interface FileSelectOptions {
    fnEndOfImport: (imported: string[]) => void;
    fnLoad2: (data: string | Uint8Array, name: string, type: string, imported: string[]) => void;
}
export declare class FileSelect {
    private readonly fnOnErrorHandler;
    private readonly fnOnLoadHandler;
    private readonly fnOnFileSelectHandler;
    private readonly fnEndOfImport;
    private readonly fnLoad2;
    private files?;
    private fileIndex;
    private imported;
    private file?;
    constructor(options: FileSelectOptions);
    private fnReadNextFile;
    private fnOnLoad;
    private fnOnError;
    private fnOnFileSelect;
    addFileSelectHandler(element: HTMLElement, type: string): void;
}
//# sourceMappingURL=FileSelect.d.ts.map