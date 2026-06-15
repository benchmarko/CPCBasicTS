import type { ConfigEntryType, ConfigType, ICore, ICpcVmRsx, IModel } from "./Interfaces";
type RedirectExamplesType = Record<string, Record<"database" | "example", string>>;
export declare class Core implements ICore {
    private model;
    constructor(defaultConfig: ConfigType);
    init(): void;
    getModel(): IModel;
    setDebug(debug: number): void;
    private static getUniqueDbKey;
    private initDatabases;
    private static fnHereDoc;
    addIndex: (dir: string, input: Record<string, unknown> | (() => void)) => void;
    addItem: (key: string, input: string | (() => void)) => void;
    addRsx: (key: string, RsxConstructor: new () => ICpcVmRsx) => string;
    parseArgs(args: string[], config: Record<string, ConfigEntryType>): Record<string, ConfigEntryType>;
    fnRedirectExamples(redirectExamples: RedirectExamplesType): void;
}
export {};
//# sourceMappingURL=Core.d.ts.map