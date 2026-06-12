export type TestsType = Record<string, string>;
export type AllTestsType = Record<string, TestsType>;
export type ResultType = Record<string, string[]>;
export type runTestsForType = (category: string, tests: TestsType, assert?: Assert, results?: ResultType) => void;
declare global {
    interface Window {
        QUnit: unknown;
    }
}
type ConfigEntryType = string | number | boolean;
type ConfigType = Record<string, ConfigEntryType>;
export declare class TestHelper {
    static config: ConfigType;
    static init(): void;
    private static fnParseArgs;
    private static fnParseUri;
    private static generateTests;
    private static fnBinaryLiteralReplacer;
    static handleBinaryLiterals(str: string): string;
    static hexInQuotes(s: string): string;
    static stringInQuotes(s: string): string;
    private static readonly jsKeywords;
    private static createJsKeywordRegex;
    private static listKeys;
    private static printAllResults;
    static generateAllTests(allTests: AllTestsType, runTestsFor: runTestsForType, hooks: NestedHooks): void;
    private static compareKeys;
    static compareAllTests(allTests1: AllTestsType, allTests2: AllTestsType): boolean;
}
export {};
//# sourceMappingURL=TestHelper.d.ts.map