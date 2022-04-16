/// <reference types="qunit" />
export declare type TestsType = {
    [k in string]: string;
};
export declare type AllTestsType = {
    [k in string]: TestsType;
};
export declare type runTestsForType = (assert: Assert | undefined, sCategory: string, oTests: TestsType, aResults?: string[]) => void;
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
    static oConfig: ConfigType;
    static init(): void;
    private static fnParseArgs;
    private static fnParseUri;
    private static generateTests;
    private static generateAllResults;
    static generateAndRunAllTests(oAllTests: AllTestsType, runTestsFor: runTestsForType): void;
}
export {};
