// BasicFormatter.qunit.ts - QUnit tests for CPCBasic BasicFormatter
//
// qunit dist/test/BasicFormatter.qunit.js debug=1 generateAll=true
define(["require", "exports", "../Utils", "../BasicLexer", "../BasicParser", "../BasicFormatter", "./TestHelper"], function (require, exports, Utils_1, BasicLexer_1, BasicParser_1, BasicFormatter_1, TestHelper_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    QUnit.dump.maxDepth = 10;
    QUnit.module("BasicFormatter:renumber: Tests", function () {
        var allTests = {
            DELETE: {
                "1 DELETE": "10 DELETE",
                "1 DELETE 1": "10 DELETE 10",
                "1 DELETE 1-": "10 DELETE 10-",
                "1 DELETE 1-2\n2 REM": "10 DELETE 10-20\n20 REM"
            },
            EDIT: {
                "1 EDIT 1": "10 EDIT 10"
            },
            LIST: {
                "1 LIST": "10 LIST",
                "1 LIST 1": "10 LIST 10",
                "1 LIST 1-2\n2 REM": "10 LIST 10-20\n20 REM"
            },
            ON_ERROR_GOTO: {
                "1 on error goto 0": "10 on error goto 0",
                "1 on error goto 2\n2 rem": "10 on error goto 20\n20 rem"
            },
            PRG: {
                "1 goto 2\n2 gosub 21\n3 on i goto 4,21,23\n4 on i gosub 21,1,2,3\n6 on break gosub 21\n7 on error goto 23\n8 on sq(1) gosub 21\n12 data 5\n16 stop\n18 '\n19 '\n21 restore 6:return\n23 if err=5 then 24 else 25\n24 resume 8\n25 resume next\n29 '\n35 on error goto 0\n39 renum 100,5,3\n": "10 goto 20\n20 gosub 120\n30 on i goto 40,120,130\n40 on i gosub 120,10,20,30\n50 on break gosub 120\n60 on error goto 130\n70 on sq(1) gosub 120\n80 data 5\n90 stop\n100 '\n110 '\n120 restore 50:return\n130 if err=5 then 140 else 150\n140 resume 70\n150 resume next\n160 '\n170 on error goto 0\n180 renum 100,5,3\n"
            },
            errors: {
                "1 rem\n1 rem": "BasicFormatter: Duplicate line number in 1 at pos 6-7: 1",
                "2 rem\n1 rem": "BasicFormatter: Line number not increasing in 1 at pos 6-7: 1",
                "0 rem": "BasicFormatter: Line number overflow in 0 at pos 0-1: 0",
                "65536 rem": "BasicFormatter: Line number overflow in 65536 at pos 0-5: 65536",
                "1 goto 2": "BasicFormatter: Line does not exist in 1 at pos 7-8: 2"
            }
        };
        function runTestsFor(assert, _sCategory, tests, results) {
            var basicFormatter = new BasicFormatter_1.BasicFormatter({
                lexer: new BasicLexer_1.BasicLexer(),
                parser: new BasicParser_1.BasicParser({
                    quiet: true
                })
            }), fnReplacer = function (bin) {
                return "0x" + parseInt(bin.substr(2), 2).toString(16).toLowerCase();
            }, newLine = 10, oldLine = 1, step = 10, keep = 65535;
            for (var key in tests) {
                if (tests.hasOwnProperty(key)) {
                    var output = basicFormatter.renumber(key, newLine, oldLine, step, keep), result = output.error ? String(output.error) : output.text;
                    var expected = tests[key];
                    if (!Utils_1.Utils.supportsBinaryLiterals) {
                        expected = expected.replace(/(0b[01]+)/g, fnReplacer); // for old IE
                    }
                    if (results) {
                        results.push('"' + key.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/"/g, '\\"') + '": "' + result.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/"/g, '\\"') + '"');
                    }
                    if (assert) {
                        assert.strictEqual(result, expected, key);
                    }
                }
            }
        }
        TestHelper_1.TestHelper.generateAndRunAllTests(allTests, runTestsFor);
    });
});
// end
//# sourceMappingURL=BasicFormatter.qunit.js.map