import type { ConfigEntryType, ConfigType, DatabaseEntry, DatabasesType, ExampleEntry, IModel } from "./Interfaces";
export declare class Model implements IModel {
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
//# sourceMappingURL=Model.d.ts.map