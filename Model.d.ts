export declare type ConfigEntryType = string | number | boolean;
export declare type ConfigType = {
    [k in string]: ConfigEntryType;
};
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
    loaded?: boolean;
}
export declare type DatabasesType = {
    [k in string]: DatabaseEntry;
};
export declare class Model {
    private config;
    private initialConfig;
    private databases;
    private examples;
    constructor(config: ConfigType);
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