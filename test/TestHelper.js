// TestHelper.ts - Tests Helper
//
define(["require", "exports", "../Utils"], function (require, exports, Utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestHelper = void 0;
    // QUnit.dump.maxDepth = 10;
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
        TestHelper.generateTests = function (allTests, runTestsFor) {
            var _loop_1 = function (category) {
                if (allTests.hasOwnProperty(category)) {
                    /*
                    (function (cat) { // eslint-disable-line no-loop-func
                        QUnit.test(cat, function (assert: Assert) {
                            runTestsFor(cat, allTests[cat], assert);
                        });
                    }(category));
                    */
                    //const category = category;
                    QUnit.test(category, function (assert) {
                        runTestsFor(category, allTests[category], assert);
                    });
                }
            };
            for (var category in allTests) {
                _loop_1(category);
            }
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
        TestHelper.generateAllResults = function (allTests, runTestsFor) {
            var reJsKeywords = TestHelper.createJsKeywordRegex();
            var result = "";
            for (var category in allTests) {
                if (allTests.hasOwnProperty(category)) {
                    var results = [], containsSpace = category.indexOf(" ") >= 0, isJsKeyword = reJsKeywords.test(category);
                    result += containsSpace || isJsKeyword ? TestHelper.stringInQuotes(category) : category;
                    result += ": {\n";
                    runTestsFor(category, allTests[category], undefined, results);
                    result += results.join(",\n");
                    result += "\n},\n";
                }
            }
            Utils_1.Utils.console.log(result);
            return result;
        };
        TestHelper.generateAndRunAllTests = function (allTests, runTestsFor) {
            TestHelper.generateTests(allTests, runTestsFor);
            if (TestHelper.config.generateAll) {
                TestHelper.generateAllResults(allTests, runTestsFor);
            }
        };
        TestHelper.config = {
            debug: 0,
            generateAll: false
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