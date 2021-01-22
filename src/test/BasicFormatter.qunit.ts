// BasicFormatter.qunit.ts - QUnit tests for CPCBasic BasicFormatter
//

const bGenerateAllResults = false;

import { Utils } from "../Utils";
import { BasicLexer } from "../BasicLexer"; // we use BasicLexer here just for convenient input
import { BasicParser } from "../BasicParser";
import { BasicFormatter } from "../BasicFormatter";
import { QUnit } from "qunit"; //TTT

type TestsType = {[k in string]: string};

type AllTestsType = {[k in string]: TestsType};

QUnit.dump.maxDepth = 10;

QUnit.module("BasicFormatter:renumber: Tests", function () {
	const mAllTests: AllTestsType = { // eslint-disable-line vars-on-top
		DELETE: {
			"1 DELETE": "10 DELETE",
			"1 DELETE 1": "10 DELETE 10",
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
		PRG: {
			"1 goto 2\n2 gosub 21\n3 on i goto 4,21,23\n4 on i gosub 21,1,2,3\n6 on break gosub 21\n7 on error goto 23\n8 on sq(1) gosub 21\n12 data 5\n16 stop\n18 '\n19 '\n21 restore 6:return\n23 if err=5 then 24 else 25\n24 resume 8\n25 resume next\n29 '\n39 renum 100,5,3\n": "10 goto 20\n20 gosub 120\n30 on i goto 40,120,130\n40 on i gosub 120,10,20,30\n50 on break gosub 120\n60 on error goto 130\n70 on sq(1) gosub 120\n80 data 5\n90 stop\n100 '\n110 '\n120 restore 50:return\n130 if err=5 then 140 else 150\n140 resume 70\n150 resume next\n160 '\n170 renum 100,5,3\n"
		}
	};

	function runTestsFor(assert, oTests: TestsType, aResults?: string[]) {
		const oBasicFormatter = new BasicFormatter({
				lexer: new BasicLexer(),
				parser: new BasicParser({
					bQuiet: true
				})
			}),
			fnReplacer = function (sBin: string) {
				return "0x" + parseInt(sBin.substr(2), 2).toString(16).toLowerCase();
			},
			iNew = 10,
			iOld = 1,
			iStep = 10,
			iKeep = undefined;

		for (const sKey in oTests) {
			if (oTests.hasOwnProperty(sKey)) {
				oBasicFormatter.reset();
				const oOutput = oBasicFormatter.renumber(sKey, iNew, iOld, iStep, iKeep),
					sResult = oOutput.error ? String(oOutput.error) : oOutput.text;
				let sExpected = oTests[sKey];

				if (!Utils.bSupportsBinaryLiterals) {
					sExpected = sExpected.replace(/(0b[01]+)/g, fnReplacer); // for old IE
				}
				if (aResults) {
					aResults.push('"' + sKey.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/"/g, '\\"') + '": "' + sResult.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/"/g, '\\"') + '"');
				}

				if (assert) {
					assert.strictEqual(sResult, sExpected, sKey);
				}
			}
		}
	}

	function generateTests(oAllTests: AllTestsType) {
		for (const sCategory in oAllTests) {
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

	function generateAllResults(oAllTests: AllTestsType) {
		let sResult = "";

		for (const sCategory in oAllTests) {
			if (oAllTests.hasOwnProperty(sCategory)) {
				const aResults: string[] = [],
					bContainsSpace = sCategory.indexOf(" ") >= 0,
					sMarker = bContainsSpace ? '"' : "";

				sResult += sMarker + sCategory + sMarker + ": {\n";

				runTestsFor(undefined, oAllTests[sCategory], aResults);
				sResult += aResults.join(",\n");
				sResult += "\n},\n";
			}
		}
		Utils.console.log(sResult);
		return sResult;
	}

	if (bGenerateAllResults) {
		generateAllResults(mAllTests);
	}
});

// end
