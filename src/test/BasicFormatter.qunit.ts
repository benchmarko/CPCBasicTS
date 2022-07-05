// BasicFormatter.qunit.ts - QUnit tests for CPCBasic BasicFormatter
//
// qunit dist/test/BasicFormatter.qunit.js debug=1 generateAll=true

import { Utils } from "../Utils";
import { BasicLexer } from "../BasicLexer"; // we use BasicLexer here just for convenient input
import { BasicParser } from "../BasicParser";
import { BasicFormatter } from "../BasicFormatter";
import { TestHelper, TestsType, AllTestsType } from "./TestHelper";

QUnit.dump.maxDepth = 10;

QUnit.module("BasicFormatter:renumber: Tests", function () {
	const allTests: AllTestsType = { // eslint-disable-line vars-on-top
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
		"edit, every gosub": {
			"1 edit 1": "10 edit 10",
			"1 every 2 gosub 1": "10 every 2 gosub 10"
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
		"gosub, goto": {
			"1 gosub 1": "10 gosub 10",
			"1 goto 1": "10 goto 10"
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

	function runTestsFor(assert: Assert | undefined, _sCategory: string, tests: TestsType, results?: string[]) {
		const basicFormatter = new BasicFormatter({
				lexer: new BasicLexer(),
				parser: new BasicParser({
					quiet: true
				})
			}),
			fnReplacer = function (bin: string) {
				return "0x" + parseInt(bin.substr(2), 2).toString(16).toLowerCase();
			},
			newLine = 10,
			oldLine = 1,
			step = 10,
			keep = 65535;

		for (const key in tests) {
			if (tests.hasOwnProperty(key)) {
				const output = basicFormatter.renumber(key, newLine, oldLine, step, keep),
					result = output.error ? String(output.error) : output.text;
				let expected = tests[key];

				if (!Utils.supportsBinaryLiterals) {
					expected = expected.replace(/(0b[01]+)/g, fnReplacer); // for old IE
				}
				if (results) {
					//results.push('"' + key.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/"/g, '\\"') + '": "' + result.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/"/g, '\\"') + '"');
					results.push(TestHelper.stringInQuotes(key) + ": " + TestHelper.stringInQuotes(result));
				}

				if (assert) {
					assert.strictEqual(result, expected, key);
				}
			}
		}
	}

	TestHelper.generateAndRunAllTests(allTests, runTestsFor);
});

// end
