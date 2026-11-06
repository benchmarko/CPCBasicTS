// TestHelper.ts - Tests Helper
//
import { Utils } from "../Utils";
export class TestHelper {
    static init() {
        const config = TestHelper.config;
        if (typeof process !== "undefined") { // nodeJs
            TestHelper.fnParseArgs(process.argv.slice(2), config);
        }
        else { // browser
            TestHelper.fnParseUri(window.location.search.substring(1), config);
        }
        if (config.debug) {
            Utils.debug = config.debug;
            Utils.console.log("testParseExamples: Debug level:", config.debug);
        }
    }
    // https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/node/process.d.ts
    // can be used for nodeJS
    static fnParseArgs(args, config) {
        for (let i = 0; i < args.length; i += 1) {
            const nameValue = args[i], nameValueList = Utils.split2(nameValue, "="), name = nameValueList[0];
            if (Object.prototype.hasOwnProperty.call(config, name)) {
                let value = nameValueList[1];
                if (value !== undefined && Object.prototype.hasOwnProperty.call(config, name)) {
                    switch (typeof config[name]) {
                        case "string":
                            break;
                        case "boolean":
                            value = (value === "true");
                            break;
                        case "number":
                            value = Number(value);
                            break;
                        case "object":
                            break;
                        default:
                            break;
                    }
                }
                config[name] = value;
            }
        }
        return config;
    }
    static fnParseUri(urlQuery, config) {
        const rPlus = /\+/g, // Regex for replacing addition symbol with a space
        fnDecode = function (s) { return decodeURIComponent(s.replace(rPlus, " ")); }, rSearch = /([^&=]+)=?([^&]*)/g, args = [];
        let match;
        while ((match = rSearch.exec(urlQuery)) !== null) {
            const name = fnDecode(match[1]), value = fnDecode(match[2]);
            if (value !== null && Object.prototype.hasOwnProperty.call(config, name)) {
                args.push(name + "=" + value);
            }
        }
        TestHelper.fnParseArgs(args, config);
    }
    static generateTests(allTests, runTestsFor, results) {
        for (const category in allTests) {
            if (Object.prototype.hasOwnProperty.call(allTests, category)) {
                if (results) {
                    results[category] = [];
                }
                QUnit.test(category, function (assert) {
                    runTestsFor(category, allTests[category], assert, results);
                });
            }
        }
    }
    static fnBinaryLiteralReplacer(bin) {
        return "0x" + parseInt(bin.substring(2), 2).toString(16).toLowerCase();
    }
    static handleBinaryLiterals(str) {
        if (!Utils.supportsBinaryLiterals) {
            str = str.replace(/(0b[01]+)/g, TestHelper.fnBinaryLiteralReplacer); // for old IE
        }
        return str;
    }
    static hexInQuotes(s) {
        let out = "";
        for (let i = 0; i < s.length; i += 1) {
            out += "\\x" + ("00" + s.charCodeAt(i).toString(16)).slice(-2);
        }
        return '"' + out + '"';
    }
    static stringInQuotes(s) {
        s = s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/\r/g, "\\r");
        // keep \n, \r
        s = s.replace(/[\x00-\x09\x0b\x0c\x0e-\x1f\x7f-\xff]/g, function (char) {
            return "\\x" + ("00" + char.charCodeAt(0).toString(16)).slice(-2);
        });
        const count1 = s.split('"').length - 1, count2 = s.split("'").length - 1;
        if (count1 > count2) { // more " than ' in the string
            return "'" + s.replace(/'/g, "\\'") + "'";
        }
        return '"' + s.replace(/"/g, '\\"') + '"';
    }
    static createJsKeywordRegex() {
        return new RegExp("^(" + TestHelper.jsKeywords.join("|") + ")$");
    }
    static listKeys(category, tests, assert, results) {
        for (const key in tests) {
            if (Object.prototype.hasOwnProperty.call(tests, key)) {
                const result = "";
                if (results) {
                    results[category].push(TestHelper.stringInQuotes(key) + ": " + TestHelper.stringInQuotes(result));
                }
                if (assert) {
                    assert.strictEqual(result, result);
                }
            }
        }
    }
    static printAllResults(allResults) {
        const reJsKeywords = TestHelper.createJsKeywordRegex();
        let result = "";
        for (const category in allResults) {
            if (Object.prototype.hasOwnProperty.call(allResults, category)) {
                const results = allResults[category], containsSpace = category.indexOf(" ") >= 0, isJsKeyword = reJsKeywords.test(category);
                if (results.length) {
                    result += containsSpace || isJsKeyword ? TestHelper.stringInQuotes(category) : category;
                    result += ": {\n";
                    result += results.join(",\n");
                    result += "\n},\n";
                }
            }
        }
        result = result.replace(/,\n$/, "\n"); // remove last comma
        Utils.console.log(result);
        return result;
    }
    static generateAllTests(allTests, runTestsFor, hooks) {
        let allResults;
        if (TestHelper.config.generateAll || TestHelper.config.generateKeys) {
            allResults = {};
            hooks.after(function () {
                if (allResults) {
                    TestHelper.printAllResults(allResults);
                }
            });
        }
        TestHelper.generateTests(allTests, TestHelper.config.generateKeys ? TestHelper.listKeys : runTestsFor, allResults);
    }
    static compareKeys(keys1, keys2, type, referenceFile, comparedFile, category) {
        const keys1Set = new Set(keys1), keys2Set = new Set(keys2), additionalKeys = keys2.filter((key) => !keys1Set.has(key)), missingKeys = keys1.filter((key) => !keys2Set.has(key)), context = category === undefined ? type : type + " in category " + JSON.stringify(category);
        const isEqual = !additionalKeys.length && !missingKeys.length;
        if (additionalKeys.length) {
            Utils.console.warn("compareKeys: " + comparedFile + " has additional " + context + " not in " + referenceFile + ": " + JSON.stringify(additionalKeys));
        }
        if (missingKeys.length) {
            Utils.console.warn("compareKeys: " + comparedFile + " is missing " + context + " from " + referenceFile + ": " + JSON.stringify(missingKeys));
        }
        return isEqual;
    }
    static compareAllTests(allTests1, allTests2, referenceFile, comparedFile) {
        const categories1 = Object.keys(allTests1), categories2 = Object.keys(allTests2);
        let isEqual = TestHelper.compareKeys(categories1, categories2, "categories", referenceFile, comparedFile);
        for (const category of categories1) {
            if (Object.prototype.hasOwnProperty.call(allTests2, category)) {
                const keys1 = Object.keys(allTests1[category]), keys2 = Object.keys(allTests2[category]);
                isEqual = TestHelper.compareKeys(keys1, keys2, "input keys", referenceFile, comparedFile, category) && isEqual;
            }
        }
        return isEqual;
    }
}
TestHelper.config = {
    debug: 0,
    generateAll: false,
    generateKeys: false,
    test: "", // a specific test
    testAll: false // run all tests
};
// ECMA 3 JS Keywords which must be avoided in dot notation for properties when using IE8
TestHelper.jsKeywords = [
    "do",
    "if",
    "in",
    "for",
    "int",
    "new",
    "try",
    "var",
    "byte",
    "case",
    "char",
    "else",
    "enum",
    "goto",
    "long",
    "null",
    "this",
    "true",
    "void",
    "with",
    "break",
    "catch",
    "class",
    "const",
    "false",
    "final",
    "float",
    "short",
    "super",
    "throw",
    "while",
    "delete",
    "double",
    "export",
    "import",
    "native",
    "public",
    "return",
    "static",
    "switch",
    "throws",
    "typeof",
    "boolean",
    "default",
    "extends",
    "finally",
    "package",
    "private",
    "abstract",
    "continue",
    "debugger",
    "function",
    "volatile",
    "interface",
    "protected",
    "transient",
    "implements",
    "instanceof",
    "synchronized"
];
TestHelper.init();
// end
//# sourceMappingURL=TestHelper.js.map