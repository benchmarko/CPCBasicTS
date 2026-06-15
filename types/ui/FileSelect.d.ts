export interface FileSelectOptions {
    fnEndOfImport: (imported: string[]) => void;
    fnLoad2: (data: string | Uint8Array, name: string, type: string, imported: string[]) => void;
}
export declare class FileSelect {
    private readonly options;
    private readonly fnOnErrorHandler;
    private readonly fnOnLoadHandler;
    private readonly fnOnFileSelectHandler;
    private files?;
    private fileIndex;
    private imported;
    private file?;
    constructor(options: FileSelectOptions);
    getOptions(): FileSelectOptions;
    setOptions(options: Partial<FileSelectOptions>): void;
    private fnReadNextFile;
    private fnOnLoad;
    private fnOnError;
    private fnOnFileSelect;
    addFileSelectHandler(element: HTMLElement, type: string): void;
}
//# sourceMappingURL=FileSelect.d.ts.map