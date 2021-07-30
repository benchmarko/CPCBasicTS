"use strict";
// TestHelper.ts - Tests Helper
//
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestHelper = void 0;
var Utils_1 = require("../Utils");
//QUnit.dump.maxDepth = 10;
var TestHelper = /** @class */ (function () {
    function TestHelper() {
    }
    TestHelper.init = function () {
        var oConfig = TestHelper.oConfig;
        // https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/node/process.d.ts
        if (typeof process !== "undefined") { // nodeJs
            TestHelper.fnParseArgs(process.argv.slice(2), oConfig);
        }
        else { // browser
            TestHelper.fnParseUri(window.location.search.substring(1), oConfig);
        }
        if (oConfig.debug) {
            Utils_1.Utils.debug = oConfig.debug;
            Utils_1.Utils.console.log("testParseExamples: Debug level:", oConfig.debug);
        }
    };
    // https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/node/process.d.ts
    // can be used for nodeJS
    TestHelper.fnParseArgs = function (aArgs, oConfig) {
        for (var i = 0; i < aArgs.length; i += 1) {
            var sNameValue = aArgs[i], aNameValue = sNameValue.split("=", 2), sName = aNameValue[0];
            if (oConfig.hasOwnProperty(sName)) {
                var sValue = aNameValue[1];
                if (sValue !== undefined && oConfig.hasOwnProperty(sName)) {
                    switch (typeof oConfig[sName]) {
                        case "string":
                            break;
                        case "boolean":
                            sValue = (sValue === "true");
                            break;
                        case "number":
                            sValue = Number(sValue);
                            break;
                        case "object":
                            break;
                        default:
                            break;
                    }
                }
                oConfig[sName] = sValue;
            }
        }
        return oConfig;
    };
    TestHelper.fnParseUri = function (sUrlQuery, oConfig) {
        var rPlus = /\+/g, // Regex for replacing addition symbol with a space
        fnDecode = function (s) { return decodeURIComponent(s.replace(rPlus, " ")); }, rSearch = /([^&=]+)=?([^&]*)/g, aArgs = [];
        var aMatch;
        while ((aMatch = rSearch.exec(sUrlQuery)) !== null) {
            var sName = fnDecode(aMatch[1]), sValue = fnDecode(aMatch[2]);
            if (sValue !== null && oConfig.hasOwnProperty(sName)) {
                aArgs.push(sName + "=" + sValue);
            }
        }
        TestHelper.fnParseArgs(aArgs, oConfig);
    };
    TestHelper.generateTests = function (oAllTests, runTestsFor) {
        for (var sCategory in oAllTests) {
            if (oAllTests.hasOwnProperty(sCategory)) {
                (function (sCat) {
                    QUnit.test(sCat, function (assert) {
                        runTestsFor(assert, sCat, oAllTests[sCat]);
                    });
                }(sCategory));
            }
        }
    };
    TestHelper.generateAllResults = function (oAllTests, runTestsFor) {
        var sResult = "";
        for (var sCategory in oAllTests) {
            if (oAllTests.hasOwnProperty(sCategory)) {
                var aResults = [], bContainsSpace = sCategory.indexOf(" ") >= 0, sMarker = bContainsSpace ? '"' : "";
                sResult += sMarker + sCategory + sMarker + ": {\n";
                runTestsFor(undefined, sCategory, oAllTests[sCategory], aResults);
                sResult += aResults.join(",\n");
                sResult += "\n},\n";
            }
        }
        Utils_1.Utils.console.log(sResult);
        return sResult;
    };
    TestHelper.generateAndRunAllTests = function (oAllTests, runTestsFor) {
        TestHelper.generateTests(oAllTests, runTestsFor);
        if (TestHelper.oConfig.generateAll) {
            TestHelper.generateAllResults(oAllTests, runTestsFor);
        }
    };
    TestHelper.oConfig = {
        debug: 0,
        generateAll: false
    };
    return TestHelper;
}());
exports.TestHelper = TestHelper;
TestHelper.init();
// end
//# sourceMappingURL=TestHelper.js.map