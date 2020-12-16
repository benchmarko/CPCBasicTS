"use strict";
// BasicParser.qunit.ts - QUnit tests for CPCBasic BasicParser
//
/* xxxglobals QUnit */
Object.defineProperty(exports, "__esModule", { value: true });
var bGenerateAllResults = false;
var Utils_1 = require("../Utils");
var BasicLexer_1 = require("../BasicLexer"); // we use BasicLexer here just for convenient input
var BasicParser_1 = require("../BasicParser");
var qunit_1 = require("qunit"); //TTT
/*
declare global {
    interface Window { QUnit: QUnit; }
}
*/
qunit_1.QUnit.dump.maxDepth = 10;
qunit_1.QUnit.module("BasicParser: Tests", function (hooks) {
    hooks.before(function ( /* assert */) {
        /*
        const that = this; // eslint-disable-line no-invalid-this

        that.oTester = {
            oBasicLexer: new BasicLexer(),
            oBasicParser: new BasicParser()
        };
        */
    });
    hooks.beforeEach(function ( /* assert */) {
        /*
        const that = this; // eslint-disable-line no-invalid-this

        that.oBasicLexer.reset();
        that.oBasicParser.reset();
        */
    });
    var mAllTests = {
        LIST: {
            "1 LIST": '[{"type":"label","value":"1","pos":0,"args":[{"type":"list","value":"LIST","pos":2,"args":[]}]}]',
            "2 LIST 10": '[{"type":"label","value":"2","pos":0,"args":[{"type":"list","value":"LIST","pos":2,"args":[{"type":"number","value":"10","pos":7},{"type":"#","value":"#","len":0,"pos":null,"right":{"type":"null","value":null,"len":0,"pos":null}}]}]}]',
            "3 LIST 2-": '[{"type":"label","value":"3","pos":0,"args":[{"type":"list","value":"LIST","pos":2,"args":[{"type":"linerange","value":"-","pos":8,"left":{"type":"number","value":"2","pos":7},"right":{"type":"null","value":null,"len":0,"pos":null}},{"type":"#","value":"#","len":0,"pos":null,"right":{"type":"null","value":null,"len":0,"pos":null}}]}]}]',
            "4 LIST -2": '[{"type":"label","value":"4","pos":0,"args":[{"type":"list","value":"LIST","pos":2,"args":[{"type":"linerange","value":"-","pos":7,"left":{"type":"null","value":null,"len":0,"pos":null},"right":{"type":"number","value":"2","pos":8}},{"type":"#","value":"#","len":0,"pos":null,"right":{"type":"null","value":null,"len":0,"pos":null}}]}]}]',
            "5 LIST 2-3": '[{"type":"label","value":"5","pos":0,"args":[{"type":"list","value":"LIST","pos":2,"args":[{"type":"linerange","value":"-","pos":8,"left":{"type":"number","value":"2","pos":7},"right":{"type":"number","value":"3","pos":9}},{"type":"#","value":"#","len":0,"pos":null,"right":{"type":"null","value":null,"len":0,"pos":null}}]}]}]',
            "6 LIST #2": '[{"type":"label","value":"6","pos":0,"args":[{"type":"list","value":"LIST","pos":2,"args":[{"type":"null","value":null,"len":0,"pos":null},{"type":"#","value":"#","pos":7,"right":{"type":"number","value":"2","pos":8}}]}]}]',
            "7 LIST ,#2": '[{"type":"label","value":"7","pos":0,"args":[{"type":"list","value":"LIST","pos":2,"args":[{"type":"null","value":null,"len":0,"pos":null},{"type":"#","value":"#","pos":8,"right":{"type":"number","value":"2","pos":9}}]}]}]',
            "8 LIST 10,#2": '[{"type":"label","value":"8","pos":0,"args":[{"type":"list","value":"LIST","pos":2,"args":[{"type":"number","value":"10","pos":7},{"type":"#","value":"#","pos":10,"right":{"type":"number","value":"2","pos":11}}]}]}]',
            "9 LIST 1-,#2": '[{"type":"label","value":"9","pos":0,"args":[{"type":"list","value":"LIST","pos":2,"args":[{"type":"linerange","value":"-","pos":8,"left":{"type":"number","value":"1","pos":7},"right":{"type":"null","value":null,"len":0,"pos":null}},{"type":"#","value":"#","pos":10,"right":{"type":"number","value":"2","pos":11}}]}]}]',
            "1 LIST -1,#2": '[{"type":"label","value":"1","pos":0,"args":[{"type":"list","value":"LIST","pos":2,"args":[{"type":"linerange","value":"-","pos":7,"left":{"type":"null","value":null,"len":0,"pos":null},"right":{"type":"number","value":"1","pos":8}},{"type":"#","value":"#","pos":10,"right":{"type":"number","value":"2","pos":11}}]}]}]',
            "2 LIST 1-2,#3": '[{"type":"label","value":"2","pos":0,"args":[{"type":"list","value":"LIST","pos":2,"args":[{"type":"linerange","value":"-","pos":8,"left":{"type":"number","value":"1","pos":7},"right":{"type":"number","value":"2","pos":9}},{"type":"#","value":"#","pos":11,"right":{"type":"number","value":"3","pos":12}}]}]}]',
            "3 LIST 2-3,#4": '[{"type":"label","value":"3","pos":0,"args":[{"type":"list","value":"LIST","pos":2,"args":[{"type":"linerange","value":"-","pos":8,"left":{"type":"number","value":"2","pos":7},"right":{"type":"number","value":"3","pos":9}},{"type":"#","value":"#","pos":11,"right":{"type":"number","value":"4","pos":12}}]}]}]'
        }
    };
    function runTestsFor(assert, oTests) {
        var oBasicLexer = new BasicLexer_1.BasicLexer(), oBasicParser = new BasicParser_1.BasicParser();
        for (var sKey in oTests) {
            if (oTests.hasOwnProperty(sKey)) {
                var sExpected = oTests[sKey];
                var oExpected = void 0, aParseTree = void 0;
                try {
                    oExpected = JSON.parse(sExpected);
                    var aTokens = oBasicLexer.lex(sKey);
                    aParseTree = oBasicParser.parse(aTokens);
                }
                catch (e) {
                    Utils_1.Utils.console.error(e);
                    aParseTree = e;
                }
                // or: sJson = JSON.stringify(aParseTree); //assert.strictEqual(sJson, sExpected);
                assert.deepEqual(aParseTree, oExpected, sKey);
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
    function generateCategoryResults(oTests) {
        var oBasicLexer = new BasicLexer_1.BasicLexer(), oBasicParser = new BasicParser_1.BasicParser(), aResults = [];
        for (var sKey in oTests) {
            if (oTests.hasOwnProperty(sKey)) {
                var sActual = void 0;
                try {
                    var aTokens = oBasicLexer.lex(sKey), aParseTree = oBasicParser.parse(aTokens);
                    sActual = JSON.stringify(aParseTree);
                }
                catch (e) {
                    Utils_1.Utils.console.error(e);
                }
                aResults.push('"' + sKey + '": \'' + sActual + "'");
            }
        }
        return aResults.join(",\n");
    }
    function generateAllResults(oAllTests) {
        var sResult = "";
        for (var sCategory in oAllTests) {
            if (oAllTests.hasOwnProperty(sCategory)) {
                sResult += sCategory + ": {\n";
                sResult += generateCategoryResults(oAllTests[sCategory]);
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