"use strict";
// Diff.qunit.ts - QUnit tests for CPCBasic Diff
//
Object.defineProperty(exports, "__esModule", { value: true });
var bGenerateAllResults = false;
var Utils_1 = require("../Utils");
var Diff_1 = require("../Diff");
QUnit.dump.maxDepth = 10;
QUnit.module("Diff: Tests", function () {
    // example  taken from https://github.com/Slava/diff.js/blob/master/demo/byline.html
    var mAllTests = {
        test: {
            "This part of the\ndocument has stayed the\nsame from version to\nversion.  It shouldn't\nbe shown if it doesn't\nchange.  Otherwise, that\nwould not be helping to\ncompress the size of the\nchanges.\n\nThis paragraph contains\ntext that is outdated.\nIt will be deleted in the\nnear future.\n\nIt is important to spell\ncheck this dokument. On\nthe other hand, a\nmisspelled word isn't\nthe end of the world.\nNothing in the rest of\nthis paragraph needs to\nbe changed. Things can\nbe added after it.#This is an important\nnotice! It should\ntherefore be located at\nthe beginning of this\ndocument!\n\nThis part of the\ndocument has stayed the\nsame from version to\nversion.  It shouldn't\nbe shown if it doesn't\nchange.  Otherwise, that\nwould not be helping to\ncompress anything.\n\nIt is important to spell\ncheck this document. On\nthe other hand, a\nmisspelled word isn't\nthe end of the world.\nNothing in the rest of\nthis paragraph needs to\nbe changed. Things can\nbe added after it.\n\nThis paragraph contains\nimportant new additions\nto this document.": "+ This is an important\n+ notice! It should\n+ therefore be located at\n+ the beginning of this\n+ document!\n+ \n- compress the size of the\n- changes.\n+ compress anything.\n- This paragraph contains\n- text that is outdated.\n- It will be deleted in the\n- near future.\n- \n- check this dokument. On\n+ check this document. On\n+ \n+ This paragraph contains\n+ important new additions\n+ to this document."
        }
    };
    function runTestsFor(assert, oTests, aResults) {
        for (var sKey in oTests) {
            if (oTests.hasOwnProperty(sKey)) {
                var aParts = sKey.split("#", 2), sText1 = aParts[0], sText2 = aParts[1], sExpected = oTests[sKey];
                var sResult = void 0;
                try {
                    sResult = Diff_1.Diff.testDiff(sText1, sText2);
                }
                catch (e) {
                    Utils_1.Utils.console.error(e);
                    sResult = String(e);
                }
                if (aResults) {
                    aResults.push('"' + sKey + '": "' + sResult + '"');
                }
                if (assert) {
                    assert.strictEqual(sResult, sExpected, "test1");
                }
            }
        }
    }
    function generateTests(oAllTests) {
        for (var sCategory in oAllTests) {
            if (oAllTests.hasOwnProperty(sCategory)) {
                (function (sCat) {
                    QUnit.test(sCat, function (assert) {
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
                var aResults = [], bContainsSpace = sCategory.indexOf(" ") >= 0, sMarker = bContainsSpace ? '"' : "";
                sResult += sMarker + sCategory + sMarker + ": {\n";
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
//# sourceMappingURL=Diff.qunit.js.map