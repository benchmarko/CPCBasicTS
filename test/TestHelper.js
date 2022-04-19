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
            // https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/node/process.d.ts
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
                var nameValue = args[i], nameValueList = nameValue.split("=", 2), name_1 = nameValueList[0];
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
            for (var category in allTests) {
                if (allTests.hasOwnProperty(category)) {
                    (function (cat) {
                        QUnit.test(cat, function (assert) {
                            runTestsFor(assert, cat, allTests[cat]);
                        });
                    }(category));
                }
            }
        };
        TestHelper.generateAllResults = function (allTests, runTestsFor) {
            var result = "";
            for (var category in allTests) {
                if (allTests.hasOwnProperty(category)) {
                    var results = [], containsSpace = category.indexOf(" ") >= 0, marker = containsSpace ? '"' : "";
                    result += marker + category + marker + ": {\n";
                    runTestsFor(undefined, category, allTests[category], results);
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
        return TestHelper;
    }());
    exports.TestHelper = TestHelper;
    TestHelper.init();
});
// end
//# sourceMappingURL=TestHelper.js.map