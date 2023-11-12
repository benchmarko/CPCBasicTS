import { ICpcVmRsx } from "./Interfaces";
export declare type ConfigEntryType = string | number | boolean;
export declare type ConfigType = Record<string, ConfigEntryType>;
export interface DatabaseEntry {
    text: string;
    title: string;
    src: string;
    script?: string;
    loaded?: boolean;
}
export interface ExampleEntry {
    key: string;
    title: string;
    meta: string;
    script?: string;
    rsx?: ICpcVmRsx;
    loaded?: boolean;
}
export declare type DatabasesType = Record<string, DatabaseEntry>;
export declare class Model {
    private config;
    private initialConfig;
    private databases;
    private examples;
    constructor(config: ConfigType);
    static readonly props: {
        arrayBounds: string;
        autorun: string;
        basicVersion: string;
        bench: string;
        databaseDirs: string;
        database: string;
        debug: string;
        example: string;
        exampleIndex: string;
        implicitLines: string;
        input: string;
        kbdLayout: string;
        canvasType: string;
        palette: string;
        processFileImports: string;
        showConsoleLog: string;
        showConvert: string;
        showCpc: string;
        showDisass: string;
        showExport: string;
        showGallery: string;
        showInput: string;
        showInp2: string;
        showKbd: string;
        showKbdSettings: string;
        showMore: string;
        showOutput: string;
        showResult: string;
        showSettings: string;
        showVariable: string;
        showView: string;
        sound: string;
        speed: string;
        trace: string;
    };
    getProperty<T extends ConfigEntryType>(property: string): T;
    setProperty<T extends ConfigEntryType>(property: string, value: T): void;
    getAllProperties(): ConfigType;
    getAllInitialProperties(): ConfigType;
    getChangedProperties(): ConfigType;
    addDatabases(db: DatabasesType): void;
    getAllDatabases(): DatabasesType;
    getDatabase(): DatabaseEntry;
    getAllExamples(): {
        [x: string]: ExampleEntry;
    };
    getExample(key: string): ExampleEntry;
    setExample(example: ExampleEntry): void;
    removeExample(key: string): void;
}
//# sourceMappingURL=Model.d.ts.map