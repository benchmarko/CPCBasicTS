// BasicFormatter.qunit.ts - QUnit tests for CPCBasic BasicFormatter
//
// qunit dist/test/BasicFormatter.qunit.js debug=1 generateAll=true
import { BasicLexer } from "../BasicLexer"; // we use BasicLexer here just for convenient input
import { BasicParser } from "../BasicParser";
import { BasicFormatter } from "../BasicFormatter";
import { Utils } from "../Utils";
import { TestHelper } from "./TestHelper";
QUnit.dump.maxDepth = 10;
const allTests = {
    "after gosub, auto": {
        "1 after 2 gosub 1": "10 after 2 gosub 10",
        "1 auto 100": "10 auto 100"
    },
    "chain, chain merge": {
        '1 chain"f2",1': '10 chain"f2",1',
        '1 chain"f3",1+3': '10 chain"f3",1+3',
        '1 chain merge "f2",1': '10 chain merge "f2",1',
        '1 chain merge "f3",1+3': '10 chain merge "f3",1+3',
        '1 chain merge "f4",1+3,delete 100-200\n100 rem\n200 rem': '10 chain merge "f4",1+3,delete 20-30\n20 rem\n30 rem'
    },
    "delete": {
        "1 delete": "10 delete",
        "1 delete -": "10 delete -",
        "1 delete 1": "10 delete 10",
        "1 delete 1-": "10 delete 10-",
        "1 delete -1": "10 delete -10",
        "1 delete 1-2\n2 rem": "10 delete 10-20\n20 rem"
    },
    "edit, else, every gosub": {
        "1 edit 1": "10 edit 10",
        "1 else 1": "10 else 10",
        "1 every 2 gosub 1": "10 every 2 gosub 10"
    },
    "gosub, goto": {
        "1 gosub 1": "10 gosub 10",
        "1 goto 1": "10 goto 10"
    },
    "if": {
        "1 if a=1 then goto 1": "10 if a=1 then goto 10",
        "1 if a=1 then 1": "10 if a=1 then 10",
        "1 if a=1 goto 1": "10 if a=1 goto 10",
        "1 if a=1 then gosub 1": "10 if a=1 then gosub 10",
        "1 if a=1 then 1:a=never1": "10 if a=1 then 10:a=never1",
        "1 if a=1 then 1 else 2\n2 rem": "10 if a=1 then 10 else 20\n20 rem",
        "1 if a=1 then 1 else goto 2\n2 rem": "10 if a=1 then 10 else goto 20\n20 rem"
    },
    list: {
        "1 list": "10 list",
        "1 list -": "10 list -",
        "1 list 1": "10 list 10",
        "1 list 1-": "10 list 10-",
        "1 list -1": "10 list -10",
        "1 list 1-2\n2 rem": "10 list 10-20\n20 rem"
    },
    "on break ..., on error goto, on gosub, on goto, on sq gosub": {
        "1 on break gosub 1": "10 on break gosub 10",
        "1 on error goto 0": "10 on error goto 0",
        "1 on error goto 2\n2 rem": "10 on error goto 20\n20 rem",
        "1 on 1 gosub 1": "10 on 1 gosub 10",
        "1 on x gosub 1,2\n2 rem": "10 on x gosub 10,20\n20 rem",
        "1 on 1 goto 1": "10 on 1 goto 10",
        "1 on x goto 1,2\n2 rem": "10 on x goto 10,20\n20 rem",
        "1 on sq(1) gosub 1": "10 on sq(1) gosub 10",
        "1 on sq(channel) gosub 1": "10 on sq(channel) gosub 10"
    },
    "renum, restore, resume, run": {
        "1 renum 100": "10 renum 100",
        "1 renum 100,50": "10 renum 100,50",
        "1 renum 100,50,2": "10 renum 100,50,2",
        "1 restore 1": "10 restore 10",
        "1 resume 1": "10 resume 10",
        "1 run 1": "10 run 10"
    },
    prg: {
        '100 \'Das Raetsel\n110 \'21.5.1988 Kopf um Kopf\n120 \'ab*c=de  de+fg=hi   [dabei sind a-i verschiedene Ziffern 1-9!!]\n130 MODE 1:PRINT"Please wait ...  ( ca. 1 min 34 sec )"\n140 CLEAR:DEFINT a-y\n150 \'\n155 z=TIME\n160 FOR a=1 TO 9:FOR b=1 TO 9:FOR c=1 TO 9:FOR f=1 TO 9:FOR g=1 TO 9\n170 de=(a*10+b)*c:IF de>99 THEN 320\n180 hi=de+(f*10+g):IF hi>99 THEN 320\n190 d=INT(de/10):e=de MOD 10:h=INT(hi/10):i=hi MOD 10\n200 IF a=b OR a=c OR a=d OR a=e OR a=f OR a=g OR a=h OR a=i THEN 320\n210 IF b=c OR b=d OR b=e OR b=f OR b=g OR b=h OR b=i THEN 320\n220 IF c=d OR c=e OR c=f OR c=g OR c=h OR c=i THEN 320\n230 IF d=e OR d=f OR d=g OR d=h OR d=i THEN 320\n240 IF e=f OR e=g OR e=h OR e=i THEN 320\n250 IF f=g OR f=h OR f=i THEN 320\n260 IF g=h OR g=i THEN 320\n270 IF h=i THEN 320\n280 IF i=0 THEN 320\n285 z=TIME-z\n290 CLS:PRINT"Die Loesung:":PRINT\n300 PRINT a*10+b"*"c"="de" / "de"+"f*10+g"="hi\n310 PRINT z,z/300:STOP\n320 NEXT g,f,c,b,a\n': '10 \'Das Raetsel\n20 \'21.5.1988 Kopf um Kopf\n30 \'ab*c=de  de+fg=hi   [dabei sind a-i verschiedene Ziffern 1-9!!]\n40 MODE 1:PRINT"Please wait ...  ( ca. 1 min 34 sec )"\n50 CLEAR:DEFINT a-y\n60 \'\n70 z=TIME\n80 FOR a=1 TO 9:FOR b=1 TO 9:FOR c=1 TO 9:FOR f=1 TO 9:FOR g=1 TO 9\n90 de=(a*10+b)*c:IF de>99 THEN 250\n100 hi=de+(f*10+g):IF hi>99 THEN 250\n110 d=INT(de/10):e=de MOD 10:h=INT(hi/10):i=hi MOD 10\n120 IF a=b OR a=c OR a=d OR a=e OR a=f OR a=g OR a=h OR a=i THEN 250\n130 IF b=c OR b=d OR b=e OR b=f OR b=g OR b=h OR b=i THEN 250\n140 IF c=d OR c=e OR c=f OR c=g OR c=h OR c=i THEN 250\n150 IF d=e OR d=f OR d=g OR d=h OR d=i THEN 250\n160 IF e=f OR e=g OR e=h OR e=i THEN 250\n170 IF f=g OR f=h OR f=i THEN 250\n180 IF g=h OR g=i THEN 250\n190 IF h=i THEN 250\n200 IF i=0 THEN 250\n210 z=TIME-z\n220 CLS:PRINT"Die Loesung:":PRINT\n230 PRINT a*10+b"*"c"="de" / "de"+"f*10+g"="hi\n240 PRINT z,z/300:STOP\n250 NEXT g,f,c,b,a\n',
        "1 goto 2\n2 gosub 21\n3 on i goto 4,21,23\n4 on i gosub 21,1,2,3\n6 on break gosub 21\n7 on error goto 23\n8 on sq(1) gosub 21\n12 data 5\n16 stop\n18 '\n19 '\n21 restore 6:return\n23 if err=5 then 24 else 25\n24 resume 8\n25 resume next\n29 '\n35 on error goto 0\n39 renum 100,5,3\n": "10 goto 20\n20 gosub 120\n30 on i goto 40,120,130\n40 on i gosub 120,10,20,30\n50 on break gosub 120\n60 on error goto 130\n70 on sq(1) gosub 120\n80 data 5\n90 stop\n100 '\n110 '\n120 restore 50:return\n130 if err=5 then 140 else 150\n140 resume 70\n150 resume next\n160 '\n170 on error goto 0\n180 renum 100,5,3\n"
    },
    errors: {
        "1 rem\n1 rem": "BasicFormatter: Expected increasing line number in 1 at pos 6-7: 1",
        "2 rem\n1 rem": "BasicFormatter: Expected increasing line number in 1 at pos 6-7: 1",
        "0 rem": "BasicFormatter: Line number overflow in 0 at pos 0-1: 0",
        "65536 rem": "BasicFormatter: Line number overflow in 65536 at pos 0-5: 65536",
        "1 goto 2": "BasicFormatter: Line does not exist in 1 at pos 7-8: 2"
    }
};
QUnit.module("BasicFormatter:deleteScript", function () {
    QUnit.test("deletion scripts retain only normalized line numbers without mutating input", function (assert) {
        const lines = ["  0010 REM first", "20 PRINT 7", "30 END"];
        assert.strictEqual(BasicFormatter.createDeleteScript(lines), "10\n20\n30");
        assert.deepEqual(lines, ["  0010 REM first", "20 PRINT 7", "30 END"]);
        assert.strictEqual(BasicFormatter.createDeleteScript([]), "");
    });
    QUnit.test("invalid lines prevent a partial deletion script", function (assert) {
        assert.strictEqual(BasicFormatter.createDeleteScript(["10 REM first", "PRINT 7", "30 END"]), undefined);
        assert.strictEqual(BasicFormatter.createDeleteScript([""]), undefined);
    });
    QUnit.test("range deletion composes with the shared merge operation", function (assert) {
        var _a;
        const lines = ["10 REM first", "20 REM second", "30 END"], selected = BasicFormatter.getLinesInRange(lines, 10, 20), deletion = BasicFormatter.createDeleteScript(selected);
        assert.strictEqual(deletion, "10\n20");
        assert.strictEqual(BasicFormatter.mergeLines(lines, (_a = BasicFormatter.splitLines(deletion !== null && deletion !== void 0 ? deletion : "")) !== null && _a !== void 0 ? _a : []), "30 END");
    });
});
QUnit.module("BasicFormatter:source scripts", function () {
    QUnit.test("line number parsing accepts numeric prefixes without range validation", function (assert) {
        assert.strictEqual(BasicFormatter.parseLineNumber("10 PRINT 1"), 10);
        assert.strictEqual(BasicFormatter.parseLineNumber("  20"), 20);
        assert.ok(isNaN(BasicFormatter.parseLineNumber("PRINT 1")));
    });
    QUnit.test("merge trims source endings and applies implicit line numbers", function (assert) {
        assert.strictEqual(BasicFormatter.mergeScripts("10 PRINT 1\n", "20 END\n"), "10 PRINT 1\n20 END");
        assert.strictEqual(BasicFormatter.mergeScripts("PRINT 1", "20 END", true), "1 PRINT 1\n20 END");
    });
    QUnit.test("range selection and merge report malformed source through the host callback", function (assert) {
        const errors = [];
        assert.deepEqual(BasicFormatter.getLinesInRangeFromScript("10 PRINT 1\n20 END\n30 END", 20, 30), ["20 END", "30 END"]);
        assert.deepEqual(BasicFormatter.getLinesInRangeFromScript("PRINT 1", 1, 10, false, () => { errors.push("range"); }), []);
        assert.strictEqual(BasicFormatter.mergeScripts("10 END", "PRINT 1", false, () => { errors.push("merge"); }), "10 END");
        assert.deepEqual(errors, ["range", "merge"]);
    });
});
QUnit.module("BasicFormatter:listing", function () {
    QUnit.test("screen listings escape control bytes without changing source lines", function (assert) {
        const lines = ["10 REM \x00\x01\x1f", '20 PRINT "A\nB"', "30 REM \x7f\x80"], expected = ["10 REM \x01\x00\x01\x01\x01\x1f", '20 PRINT "A\x01\nB"', "30 REM \x7f\x80"];
        for (const stream of [0, 1, 7, 8]) {
            assert.deepEqual(BasicFormatter.formatListing(lines, stream), expected);
        }
        assert.deepEqual(lines, ["10 REM \x00\x01\x1f", '20 PRINT "A\nB"', "30 REM \x7f\x80"]);
    });
    QUnit.test("stream 9 preserves raw bytes and returns an independent array", function (assert) {
        const lines = ["10 REM \x00\x01\x1f"], listing = BasicFormatter.formatListing(lines, 9);
        assert.deepEqual(listing, lines);
        listing[0] = "changed";
        assert.strictEqual(lines[0], "10 REM \x00\x01\x1f");
        assert.deepEqual(BasicFormatter.formatListing([], 0), []);
    });
    QUnit.test("diagnostic escaping covers the complete control range", function (assert) {
        const controls = Array.from({ length: 32 }, (_value, index) => String.fromCharCode(index)), expected = controls.map((char) => "\x01" + char).join("");
        assert.strictEqual(Utils.escapeControlCharacters(controls.join("")), expected);
        assert.strictEqual(Utils.escapeControlCharacters("ASCII \x7f\x80"), "ASCII \x7f\x80");
    });
});
QUnit.module("BasicFormatter:parserSetup", function () {
    QUnit.test("renumbering and line removal reset retained parser state", function (assert) {
        const formatter = createBasicFormatter(), source = "10 GOTO 30\n20 PRINT (2+3)\n30 END", expectedRenum = formatter.renumber(source, 100, 1, 5, 65535), expectedRemoval = formatter.removeUnusedLines(source);
        assert.notOk(expectedRenum.error);
        assert.notOk(expectedRemoval.error);
        const retainFormatting = () => {
            formatter.getOptions().lexer.setOptions({ keepWhiteSpace: true });
            formatter.getOptions().parser.setOptions({ keepBrackets: true, keepColons: true, keepDataComma: true, keepTokens: true });
        };
        retainFormatting();
        assert.deepEqual(formatter.renumber(source, 100, 1, 5, 65535), expectedRenum);
        retainFormatting();
        assert.deepEqual(formatter.removeUnusedLines(source), expectedRemoval);
    });
});
QUnit.module("BasicFormatter:addLineNumbers", function () {
    QUnit.test("numbers missing lines while preserving explicit numbers and spacing", function (assert) {
        assert.strictEqual(BasicFormatter.addLineNumbers('PRINT "A"\nEND'), '1 PRINT "A"\n2 END');
        assert.strictEqual(BasicFormatter.addLineNumbers('10 PRINT "A"\nPRINT "B"\n30 END'), '10 PRINT "A"\n11 PRINT "B"\n30 END');
        assert.strictEqual(BasicFormatter.addLineNumbers("  10 REM first\n  REM next"), "  10 REM first\n11   REM next");
        assert.strictEqual(BasicFormatter.addLineNumbers("0 REM zero\nEND"), "0 REM zero\n1 END");
    });
    QUnit.test("preserves existing blank-line and trailing-newline behavior", function (assert) {
        assert.strictEqual(BasicFormatter.addLineNumbers(""), "1 ");
        assert.strictEqual(BasicFormatter.addLineNumbers("REM first\n\nEND\n"), "1 REM first\n2 \n3 END\n4 ");
    });
});
QUnit.module("BasicFormatter:sourceLines", function () {
    QUnit.test("splits numbered source and preserves multiline content", function (assert) {
        assert.deepEqual(BasicFormatter.splitLines('10 PRINT "first\nsecond"\n20 END\n'), ['10 PRINT "first\nsecond"', "20 END"]);
        assert.deepEqual(BasicFormatter.splitLines("PRINT 1\nEND", true), ["1 PRINT 1", "2 END"]);
        assert.deepEqual(BasicFormatter.splitLines(""), []);
        assert.strictEqual(BasicFormatter.splitLines("PRINT 1\n20 END"), undefined);
    });
    QUnit.test("merges sorted lines, replaces matches, and deletes numbered-only lines", function (assert) {
        const original = ["10 REM first", "20 REM old", "30 END"], updates = ["20 REM replacement", "25 PRINT 7"];
        assert.strictEqual(BasicFormatter.mergeLines(original, updates), "10 REM first\n20 REM replacement\n25 PRINT 7\n30 END");
        assert.strictEqual(BasicFormatter.mergeLines(original, ["20"]), "10 REM first\n30 END");
        assert.strictEqual(BasicFormatter.mergeLines(original, []), original.join("\n"));
        assert.strictEqual(BasicFormatter.mergeLines([], updates), updates.join("\n"));
        assert.deepEqual(original, ["10 REM first", "20 REM old", "30 END"]);
        assert.deepEqual(updates, ["20 REM replacement", "25 PRINT 7"]);
    });
    QUnit.test("selects inclusive line ranges without mutating the source", function (assert) {
        const lines = ["10 REM first", "20 REM second", "30 END", ""];
        assert.deepEqual(BasicFormatter.getLinesInRange(lines, 10, 20), ["10 REM first", "20 REM second"]);
        assert.deepEqual(BasicFormatter.getLinesInRange(lines, 20, 20), ["20 REM second"]);
        assert.deepEqual(BasicFormatter.getLinesInRange(lines, 21, 29), []);
        assert.deepEqual(BasicFormatter.getLinesInRange([], 0, 65535), []);
        assert.deepEqual(lines, ["10 REM first", "20 REM second", "30 END", ""]);
    });
});
function createBasicFormatter() {
    const basicParser = new BasicParser({
        quiet: true
    });
    return new BasicFormatter({
        lexer: new BasicLexer({
            keywords: basicParser.getKeywords()
        }),
        parser: basicParser
    });
}
QUnit.module("BasicFormatter:renumber: Tests", function (hooks) {
    hooks.before(function () {
        const thisHooks = hooks;
        thisHooks.basicFormatter = createBasicFormatter();
    });
    function runSingleTest(basicFormatter, key) {
        const newLine = 10, oldLine = 1, step = 10, keep = 65535, output = basicFormatter.renumber(key, newLine, oldLine, step, keep), result = output.error ? String(output.error) : output.text;
        return result;
    }
    function runTestsFor(category, tests, assert, results) {
        const basicParser = new BasicParser({
            quiet: true
        }), basicFormatter = new BasicFormatter({
            lexer: new BasicLexer({
                keywords: basicParser.getKeywords()
            }),
            parser: basicParser
        });
        for (const key in tests) {
            if (Object.prototype.hasOwnProperty.call(tests, key)) {
                const expected = TestHelper.handleBinaryLiterals(tests[key]), result = runSingleTest(basicFormatter, key);
                if (results) {
                    results[category].push(TestHelper.stringInQuotes(key) + ": " + TestHelper.stringInQuotes(result));
                }
                if (assert) {
                    assert.strictEqual(result, expected, key);
                }
            }
        }
    }
    TestHelper.generateAllTests(allTests, runTestsFor, hooks);
});
//# sourceMappingURL=BasicFormatter.qunit.js.map