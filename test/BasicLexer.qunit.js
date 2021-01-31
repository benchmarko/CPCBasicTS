"use strict";
// BasicLexer.qunit.ts - QUnit tests for CPCBasic BasicLexer
//
Object.defineProperty(exports, "__esModule", { value: true });
var bGenerateAllResults = false;
var Utils_1 = require("../Utils");
var BasicLexer_1 = require("../BasicLexer");
var qunit_1 = require("qunit"); //TTT
qunit_1.QUnit.dump.maxDepth = 10;
qunit_1.QUnit.module("BasicLexer: Tests", function () {
    var mAllTests = {
        LIST: {
            "1 LIST": '[{"type":"number","value":"1","pos":0},{"type":"identifier","value":"LIST","pos":2},{"type":"(end)","value":"","pos":6}]',
            "2 LIST 10": '[{"type":"number","value":"2","pos":0},{"type":"identifier","value":"LIST","pos":2},{"type":"number","value":"10","pos":7},{"type":"(end)","value":"","pos":9}]',
            "3 LIST 2-": '[{"type":"number","value":"3","pos":0},{"type":"identifier","value":"LIST","pos":2},{"type":"number","value":"2","pos":7},{"type":"-","value":"-","pos":8},{"type":"(end)","value":"","pos":9}]',
            "4 LIST -2": '[{"type":"number","value":"4","pos":0},{"type":"identifier","value":"LIST","pos":2},{"type":"-","value":"-","pos":7},{"type":"number","value":"2","pos":8},{"type":"(end)","value":"","pos":9}]',
            "5 LIST 2-3": '[{"type":"number","value":"5","pos":0},{"type":"identifier","value":"LIST","pos":2},{"type":"number","value":"2","pos":7},{"type":"-","value":"-","pos":8},{"type":"number","value":"3","pos":9},{"type":"(end)","value":"","pos":10}]',
            "6 LIST #2": '[{"type":"number","value":"6","pos":0},{"type":"identifier","value":"LIST","pos":2},{"type":"#","value":"#","pos":7},{"type":"number","value":"2","pos":8},{"type":"(end)","value":"","pos":9}]',
            "7 LIST ,#2": '[{"type":"number","value":"7","pos":0},{"type":"identifier","value":"LIST","pos":2},{"type":",","value":",","pos":7},{"type":"#","value":"#","pos":8},{"type":"number","value":"2","pos":9},{"type":"(end)","value":"","pos":10}]',
            "8 LIST 10,#2": '[{"type":"number","value":"8","pos":0},{"type":"identifier","value":"LIST","pos":2},{"type":"number","value":"10","pos":7},{"type":",","value":",","pos":9},{"type":"#","value":"#","pos":10},{"type":"number","value":"2","pos":11},{"type":"(end)","value":"","pos":12}]',
            "9 LIST 1-,#2": '[{"type":"number","value":"9","pos":0},{"type":"identifier","value":"LIST","pos":2},{"type":"number","value":"1","pos":7},{"type":"-","value":"-","pos":8},{"type":",","value":",","pos":9},{"type":"#","value":"#","pos":10},{"type":"number","value":"2","pos":11},{"type":"(end)","value":"","pos":12}]',
            "1 LIST -1,#2": '[{"type":"number","value":"1","pos":0},{"type":"identifier","value":"LIST","pos":2},{"type":"-","value":"-","pos":7},{"type":"number","value":"1","pos":8},{"type":",","value":",","pos":9},{"type":"#","value":"#","pos":10},{"type":"number","value":"2","pos":11},{"type":"(end)","value":"","pos":12}]',
            "2 LIST 1-2,#3": '[{"type":"number","value":"2","pos":0},{"type":"identifier","value":"LIST","pos":2},{"type":"number","value":"1","pos":7},{"type":"-","value":"-","pos":8},{"type":"number","value":"2","pos":9},{"type":",","value":",","pos":10},{"type":"#","value":"#","pos":11},{"type":"number","value":"3","pos":12},{"type":"(end)","value":"","pos":13}]',
            "3 LIST 2-3,#4": '[{"type":"number","value":"3","pos":0},{"type":"identifier","value":"LIST","pos":2},{"type":"number","value":"2","pos":7},{"type":"-","value":"-","pos":8},{"type":"number","value":"3","pos":9},{"type":",","value":",","pos":10},{"type":"#","value":"#","pos":11},{"type":"number","value":"4","pos":12},{"type":"(end)","value":"","pos":13}]'
        }
    };
    function runTestsFor(assert, oTests, aResults) {
        var oBasicLexer = new BasicLexer_1.BasicLexer();
        for (var sKey in oTests) {
            if (oTests.hasOwnProperty(sKey)) {
                var sExpected = oTests[sKey], oExpected = JSON.parse(sExpected);
                var aTokens = void 0, sActual = void 0;
                try {
                    aTokens = oBasicLexer.lex(sKey);
                    sActual = JSON.stringify(aTokens);
                }
                catch (e) {
                    Utils_1.Utils.console.error(e);
                    aTokens = e;
                    sActual = String(e);
                }
                if (aResults) {
                    aResults.push('"' + sKey + '": \'' + sActual + "'");
                }
                if (assert) {
                    assert.deepEqual(aTokens, oExpected, sKey);
                    // or: sJson = JSON.stringify(aParseTree); //assert.strictEqual(sJson, sExpected);
                }
            }
        }
    }
    function generateTests(oAllTests) {
        for (var sCategory in oAllTests) {
            if (oAllTests.hasOwnProperty(sCategory)) {
                (function (sCat) {
                    qunit_1.QUnit.test(sCat, function (assert) {
                        runTestsFor(assert, oAllTests[sCat]);
                    });
                }(sCategory));
            }
        }
    }
    generateTests(mAllTests);
    // generate result list (not used during the test, just for debugging)
    function generateAllResults(oAllTests) {
        var sResult = "";
        for (var sCategory in oAllTests) {
            if (oAllTests.hasOwnProperty(sCategory)) {
                var aResults = [];
                sResult += sCategory + ": {\n";
                runTestsFor(undefined, oAllTests[sCategory], aResults);
                sResult += aResults.join(",\n");
                sResult += "\n},\n";
            }
        }
        Utils_1.Utils.console.log(sResult);
        return sResult;
    }
    if (bGenerateAllResults) {
        generateAllResults(mAllTests);
    }
});
// end
//# sourceMappingURL=BasicLexer.qunit.js.map