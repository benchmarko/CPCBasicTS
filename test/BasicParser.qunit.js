"use strict";
// BasicParser.qunit.ts - QUnit tests for CPCBasic BasicParser
//
Object.defineProperty(exports, "__esModule", { value: true });
var bGenerateAllResults = false;
var Utils_1 = require("../Utils");
var BasicLexer_1 = require("../BasicLexer"); // we use BasicLexer here just for convenient input
var BasicParser_1 = require("../BasicParser");
var qunit_1 = require("qunit"); //TTT
qunit_1.QUnit.dump.maxDepth = 10;
qunit_1.QUnit.module("BasicParser: Tests", function () {
    var mAllTests = {
        LIST: {
            "1 LIST": '[{"type":"label","value":"1","pos":0,"args":[{"type":"list","value":"LIST","pos":2,"args":[]}]}]',
            "2 LIST 10": '[{"type":"label","value":"2","pos":0,"args":[{"type":"list","value":"LIST","pos":2,"args":[{"type":"linenumber","value":"10","pos":7},{"type":"#","value":"#","pos":0,"len":0,"right":{"type":"null","value":"null","pos":0,"len":0}}]}]}]',
            "3 LIST 2-": '[{"type":"label","value":"3","pos":0,"args":[{"type":"list","value":"LIST","pos":2,"args":[{"type":"linerange","value":"-","pos":8,"left":{"type":"linenumber","value":"2","pos":7},"right":{"type":"null","value":"null","pos":0,"len":0}},{"type":"#","value":"#","pos":0,"len":0,"right":{"type":"null","value":"null","pos":0,"len":0}}]}]}]',
            "4 LIST -2": '[{"type":"label","value":"4","pos":0,"args":[{"type":"list","value":"LIST","pos":2,"args":[{"type":"linerange","value":"-","pos":7,"left":{"type":"null","value":"null","pos":0,"len":0},"right":{"type":"linenumber","value":"2","pos":8}},{"type":"#","value":"#","pos":0,"len":0,"right":{"type":"null","value":"null","pos":0,"len":0}}]}]}]',
            "5 LIST 2-3": '[{"type":"label","value":"5","pos":0,"args":[{"type":"list","value":"LIST","pos":2,"args":[{"type":"linerange","value":"-","pos":8,"left":{"type":"linenumber","value":"2","pos":7},"right":{"type":"linenumber","value":"3","pos":9}},{"type":"#","value":"#","pos":0,"len":0,"right":{"type":"null","value":"null","pos":0,"len":0}}]}]}]',
            "6 LIST #2": '[{"type":"label","value":"6","pos":0,"args":[{"type":"list","value":"LIST","pos":2,"args":[{"type":"null","value":"null","pos":0,"len":0},{"type":"#","value":"#","pos":7,"right":{"type":"number","value":"2","pos":8}}]}]}]',
            "7 LIST ,#2": '[{"type":"label","value":"7","pos":0,"args":[{"type":"list","value":"LIST","pos":2,"args":[{"type":"null","value":"null","pos":0,"len":0},{"type":"#","value":"#","pos":8,"right":{"type":"number","value":"2","pos":9}}]}]}]',
            "8 LIST 10,#2": '[{"type":"label","value":"8","pos":0,"args":[{"type":"list","value":"LIST","pos":2,"args":[{"type":"linenumber","value":"10","pos":7},{"type":"#","value":"#","pos":10,"right":{"type":"number","value":"2","pos":11}}]}]}]',
            "9 LIST 1-,#2": '[{"type":"label","value":"9","pos":0,"args":[{"type":"list","value":"LIST","pos":2,"args":[{"type":"linerange","value":"-","pos":8,"left":{"type":"linenumber","value":"1","pos":7},"right":{"type":"null","value":"null","pos":0,"len":0}},{"type":"#","value":"#","pos":10,"right":{"type":"number","value":"2","pos":11}}]}]}]',
            "1 LIST -1,#2": '[{"type":"label","value":"1","pos":0,"args":[{"type":"list","value":"LIST","pos":2,"args":[{"type":"linerange","value":"-","pos":7,"left":{"type":"null","value":"null","pos":0,"len":0},"right":{"type":"linenumber","value":"1","pos":8}},{"type":"#","value":"#","pos":10,"right":{"type":"number","value":"2","pos":11}}]}]}]',
            "2 LIST 1-2,#3": '[{"type":"label","value":"2","pos":0,"args":[{"type":"list","value":"LIST","pos":2,"args":[{"type":"linerange","value":"-","pos":8,"left":{"type":"linenumber","value":"1","pos":7},"right":{"type":"linenumber","value":"2","pos":9}},{"type":"#","value":"#","pos":11,"right":{"type":"number","value":"3","pos":12}}]}]}]',
            "3 LIST 2-3,#4": '[{"type":"label","value":"3","pos":0,"args":[{"type":"list","value":"LIST","pos":2,"args":[{"type":"linerange","value":"-","pos":8,"left":{"type":"linenumber","value":"2","pos":7},"right":{"type":"linenumber","value":"3","pos":9}},{"type":"#","value":"#","pos":11,"right":{"type":"number","value":"4","pos":12}}]}]}]'
        }
    };
    function runTestsFor(assert, oTests, aResults) {
        var oBasicLexer = new BasicLexer_1.BasicLexer(), oBasicParser = new BasicParser_1.BasicParser();
        for (var sKey in oTests) {
            if (oTests.hasOwnProperty(sKey)) {
                var sExpected = oTests[sKey];
                var oExpected = void 0, aParseTree = void 0, sActual = void 0;
                try {
                    oExpected = JSON.parse(sExpected);
                    var aTokens = oBasicLexer.lex(sKey);
                    aParseTree = oBasicParser.parse(aTokens);
                    sActual = JSON.stringify(aParseTree);
                }
                catch (e) {
                    Utils_1.Utils.console.error(e);
                    aParseTree = e;
                    sActual = String(e);
                }
                if (aResults) {
                    aResults.push('"' + sKey + '": \'' + sActual + "'");
                }
                if (assert) {
                    assert.deepEqual(aParseTree, oExpected, sKey);
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
//# sourceMappingURL=BasicParser.qunit.js.map