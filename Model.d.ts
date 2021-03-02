declare type ConfigEntryType = string | number | boolean;
export declare type ConfigType = {
    [k in string]: ConfigEntryType;
};
export interface DatabaseEntry {
    text: string;
    title: string;
    src: string;
    script?: string;
    error?: string;
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
declare type ExamplesType = {
    [k in string]: {
        [l in string]: ExampleEntry;
    };
};
export declare class Model {
    config: ConfigType;
    initialConfig: ConfigType;
    databases: DatabasesType;
    examples: ExamplesType;
    constructor(config: ConfigType, initialConfig: ConfigType);
    getProperty<T extends ConfigEntryType>(sProperty: string): T;
    setProperty<T extends ConfigEntryType>(sProperty: string, value: T): void;
    getAllProperties(): ConfigType;
    getAllInitialProperties(): ConfigType;
    getChangedProperties(): ConfigType;
    addDatabases(oDb: DatabasesType): void;
    getAllDatabases(): DatabasesType;
    getDatabase(): DatabaseEntry;
    getAllExamples(): {
        [x: string]: ExampleEntry;
    };
    getExample(sKey: string): ExampleEntry;
    setExample(oExample: ExampleEntry): void;
    removeExample(sKey: string): void;
}
export {};
