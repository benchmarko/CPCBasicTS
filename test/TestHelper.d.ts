/// <reference types="qunit" />
export declare type TestsType = {
    [k in string]: string;
};
export declare type AllTestsType = {
    [k in string]: TestsType;
};
export declare type runTestsForType = (assert: Assert | undefined, category: string, tests: TestsType, results?: string[]) => void;
declare global {
    interface Window {
        QUnit: unknown;
    }
}
declare type ConfigEntryType = string | number | boolean;
declare type ConfigType = {
    [k in string]: ConfigEntryType;
};
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
