export declare type TestsType = Record<string, string>;
export declare type AllTestsType = Record<string, TestsType>;
export declare type runTestsForType = (assert: Assert | undefined, category: string, tests: TestsType, results?: string[]) => void;
declare global {
    interface Window {
        QUnit: unknown;
    }
}
declare type ConfigEntryType = string | number | boolean;
declare type ConfigType = Record<string, ConfigEntryType>;
export declare class TestHelper {
    static config: ConfigType;
    static init(): void;
    private static fnParseArgs;
    private static fnParseUri;
    private static generateTests;
    private static generateAllResults;
    static generateAndRunAllTests(allTests: AllTestsType, runTestsFor: runTestsForType): void;
}
export {};
//# sourceMappingURL=TestHelper.d.ts.map