// Diff.qunit.ts - QUnit tests for CPCBasic Diff
//
define(["require", "exports", "../Utils", "../Diff", "./TestHelper"], function (require, exports, Utils_1, Diff_1, TestHelper_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    QUnit.dump.maxDepth = 10;
    // example  taken from https://github.com/Slava/diff.js/blob/master/demo/byline.html
    var allTests = {
        test: {
            "This part of the\ndocument has stayed the\nsame from version to\nversion.  It shouldn't\nbe shown if it doesn't\nchange.  Otherwise, that\nwould not be helping to\ncompress the size of the\nchanges.\n\nThis paragraph contains\ntext that is outdated.\nIt will be deleted in the\nnear future.\n\nIt is important to spell\ncheck this dokument. On\nthe other hand, a\nmisspelled word isn't\nthe end of the world.\nNothing in the rest of\nthis paragraph needs to\nbe changed. Things can\nbe added after it.#This is an important\nnotice! It should\ntherefore be located at\nthe beginning of this\ndocument!\n\nThis part of the\ndocument has stayed the\nsame from version to\nversion.  It shouldn't\nbe shown if it doesn't\nchange.  Otherwise, that\nwould not be helping to\ncompress anything.\n\nIt is important to spell\ncheck this document. On\nthe other hand, a\nmisspelled word isn't\nthe end of the world.\nNothing in the rest of\nthis paragraph needs to\nbe changed. Things can\nbe added after it.\n\nThis paragraph contains\nimportant new additions\nto this document.": "+ This is an important\n+ notice! It should\n+ therefore be located at\n+ the beginning of this\n+ document!\n+ \n- compress the size of the\n- changes.\n+ compress anything.\n- This paragraph contains\n- text that is outdated.\n- It will be deleted in the\n- near future.\n- \n- check this dokument. On\n+ check this document. On\n+ \n+ This paragraph contains\n+ important new additions\n+ to this document."
        }
    };
    QUnit.module("Diff: Tests", function (hooks) {
        function runTestsFor(category, tests, assert, results) {
            for (var key in tests) {
                if (tests.hasOwnProperty(key)) {
                    var parts = Utils_1.Utils.split2(key, "#"), text1 = parts[0], text2 = parts[1], expected = tests[key];
                    var result = void 0;
                    try {
                        result = Diff_1.Diff.testDiff(text1, text2);
                    }
                    catch (e) {
                        Utils_1.Utils.console.error(e);
                        result = String(e);
                    }
                    if (results) {
                        results[category].push(TestHelper_1.TestHelper.stringInQuotes(key) + ": " + TestHelper_1.TestHelper.stringInQuotes(result));
                    }
                    if (assert) {
                        assert.strictEqual(result, expected, "test1");
                    }
                }
            }
        }
        TestHelper_1.TestHelper.generateAllTests(allTests, runTestsFor, hooks);
    });
});
// end
//# sourceMappingURL=Diff.qunit.js.map