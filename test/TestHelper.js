// TestHelper.ts - Tests Helper
//
define(["require", "exports", "../Utils"], function (require, exports, Utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestHelper = void 0;
    var TestHelper = /** @class */ (function () {
        function TestHelper() {
        }
        TestHelper.init = function () {
            var config = TestHelper.config;
            if (typeof process !== "undefined") { // nodeJs
                TestHelper.fnParseArgs(process.argv.slice(2), config);
            }
            else { // browser
                TestHelper.fnParseUri(window.location.search.substring(1), config);
            }
            if (config.debug) {
                Utils_1.Utils.debug = config.debug;
                Utils_1.Utils.console.log("testParseExamples: Debug level:", config.debug);
            }
        };
        // https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/node/process.d.ts
        // can be used for nodeJS
        TestHelper.fnParseArgs = function (args, config) {
            for (var i = 0; i < args.length; i += 1) {
                var nameValue = args[i], nameValueList = Utils_1.Utils.split2(nameValue, "="), name_1 = nameValueList[0];
                if (config.hasOwnProperty(name_1)) {
                    var value = nameValueList[1];
                    if (value !== undefined && config.hasOwnProperty(name_1)) {
                        switch (typeof config[name_1]) {
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
                    config[name_1] = value;
                }
            }
            return config;
        };
        TestHelper.fnParseUri = function (urlQuery, config) {
            var rPlus = /\+/g, // Regex for replacing addition symbol with a space
            fnDecode = function (s) { return decodeURIComponent(s.replace(rPlus, " ")); }, rSearch = /([^&=]+)=?([^&]*)/g, args = [];
            var match;
            while ((match = rSearch.exec(urlQuery)) !== null) {
                var name_2 = fnDecode(match[1]), value = fnDecode(match[2]);
                if (value !== null && config.hasOwnProperty(name_2)) {
                    args.push(name_2 + "=" + value);
                }
            }
            TestHelper.fnParseArgs(args, config);
        };
        TestHelper.generateTests = function (allTests, runTestsFor, results) {
            var _loop_1 = function (category) {
                if (allTests.hasOwnProperty(category)) {
                    if (results) {
                        results[category] = [];
                    }
                    QUnit.test(category, function (assert) {
                        runTestsFor(category, allTests[category], assert, results);
                    });
                }
            };
            for (var category in allTests) {
                _loop_1(category);
            }
        };
        TestHelper.fnBinaryLiteralReplacer = function (bin) {
            return "0x" + parseInt(bin.substring(2), 2).toString(16).toLowerCase();
        };
        TestHelper.handleBinaryLiterals = function (str) {
            if (!Utils_1.Utils.supportsBinaryLiterals) {
                str = str.replace(/(0b[01]+)/g, TestHelper.fnBinaryLiteralReplacer); // for old IE
            }
            return str;
        };
        TestHelper.stringInQuotes = function (s) {
            s = s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/\r/g, "\\r");
            // keep \n, \r
            s = s.replace(/[\x00-\x09\x0b\x0c\x0e-\x1f\x7f-\xff]/g, function (char) {
                return "\\x" + ("00" + char.charCodeAt(0).toString(16)).slice(-2);
            });
            var count1 = s.split('"').length - 1, count2 = s.split("'").length - 1;
            if (count1 > count2) { // more " than ' in the string
                return "'" + s.replace(/'/g, "\\'") + "'";
            }
            return '"' + s.replace(/"/g, '\\"') + '"';
        };
        TestHelper.createJsKeywordRegex = function () {
            return new RegExp("^(" + TestHelper.jsKeywords.join("|") + ")$");
        };
        TestHelper.listKeys = function (category, tests, assert, results) {
            for (var key in tests) {
                if (tests.hasOwnProperty(key)) {
                    var result = "";
                    if (results) {
                        results[category].push(TestHelper.stringInQuotes(key) + ": " + TestHelper.stringInQuotes(result));
                    }
                    if (assert) {
                        assert.strictEqual(result, result);
                    }
                }
            }
        };
        TestHelper.printAllResults = function (allResults) {
            var reJsKeywords = TestHelper.createJsKeywordRegex();
            var result = "";
            for (var category in allResults) {
                if (allResults.hasOwnProperty(category)) {
                    var results = allResults[category], containsSpace = category.indexOf(" ") >= 0, isJsKeyword = reJsKeywords.test(category);
                    if (results.length) {
                        result += containsSpace || isJsKeyword ? TestHelper.stringInQuotes(category) : category;
                        result += ": {\n";
                        result += results.join(",\n");
                        result += "\n},\n";
                    }
                }
            }
            result = result.replace(/,\n$/, "\n"); // remove last comma
            Utils_1.Utils.console.log(result);
            return result;
        };
        TestHelper.generateAllTests = function (allTests, runTestsFor, hooks) {
            var allResults;
            if (TestHelper.config.generateAll || TestHelper.config.generateKeys) {
                allResults = {};
                hooks.after(function () {
                    if (allResults) {
                        TestHelper.printAllResults(allResults);
                    }
                });
            }
            TestHelper.generateTests(allTests, TestHelper.config.generateKeys ? TestHelper.listKeys : runTestsFor, allResults);
        };
        TestHelper.compareKeys = function (keys1, keys2, type) {
            var isEqual = true;
            for (var i = 0; i < keys1.length; i += 1) {
                if (keys1[i] !== keys2[i]) {
                    isEqual = false;
                    Utils_1.Utils.console.warn("compareKeys: " + type + ": " + keys1[i] + " <> " + keys2[i]);
                }
            }
            if (keys1.length !== keys2.length) {
                isEqual = false;
                Utils_1.Utils.console.warn("compareKeys: " + type + ": different sizes: " + keys1.length + " <> " + keys2.length);
            }
            return isEqual;
        };
        TestHelper.compareAllTests = function (allTests1, allTests2) {
            var categories1 = Object.keys(allTests1), categories2 = Object.keys(allTests2);
            var isEqual = TestHelper.compareKeys(categories1, categories2, "categories");
            if (isEqual) {
                for (var i = 0; i < categories1.length; i += 1) {
                    var category = categories1[i], key1 = allTests1[category], key2 = allTests2[category], keys1 = Object.keys(key1), keys2 = Object.keys(key2);
                    isEqual = TestHelper.compareKeys(keys1, keys2, "keys");
                }
            }
            return isEqual;
        };
        TestHelper.config = {
            debug: 0,
            generateAll: false,
            generateKeys: false
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
        return TestHelper;
    }());
    exports.TestHelper = TestHelper;
    TestHelper.init();
});
// end
//# sourceMappingURL=TestHelper.js.map