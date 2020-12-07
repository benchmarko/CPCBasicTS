declare type ConfigEntryType = string | number | boolean;
declare type ConfigType = {
    [k in string]: ConfigEntryType;
};
interface DatabaseEntry {
    text: string;
    title: string;
    src: string;
}
interface ExampleEntry {
    key: string;
    title: string;
    type: string;
    meta: string;
    script?: string;
    loaded?: boolean;
}
declare type DatabasesType = {
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
    init(config: ConfigType, initialConfig: ConfigType): void;
    getProperty(sProperty: string): ConfigEntryType;
    getStringProperty(sProperty: string): string;
    getBooleanProperty(sProperty: string): boolean;
    setProperty(sProperty: string, value: ConfigEntryType): this;
    getAllProperties(): ConfigType;
    getAllInitialProperties(): ConfigType;
    addDatabases(oDb: DatabasesType): this;
    getAllDatabases(): DatabasesType;
    getDatabase(): DatabaseEntry;
    getAllExamples(): {
        [x: string]: ExampleEntry;
    };
    getExample(sKey: string): ExampleEntry;
    setExample(oExample: ExampleEntry): this;
    removeExample(sKey: string): this;
}
export {};
