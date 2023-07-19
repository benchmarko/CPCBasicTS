export interface FileSelectOptions {
    fnEndOfImport: (imported: string[]) => void;
    outputError: (error: Error, noSelection?: boolean) => void;
    fnLoad2: (data: string, name: string, type: string, imported: string[]) => void;
}
export declare class FileSelect {
    private fnEndOfImport;
    private outputError;
    private fnLoad2;
    private files;
    private fileIndex;
    private imported;
    private file;
    constructor(options: FileSelectOptions);
    private fnReadNextFile;
    private fnOnLoad;
    private fnErrorHandler;
    private fnHandleFileSelect;
    addFileSelectHandler(element: HTMLElement, type: string): void;
}
//# sourceMappingURL=FileSelect.d.ts.map