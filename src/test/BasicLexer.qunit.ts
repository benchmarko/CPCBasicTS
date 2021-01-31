// BasicLexer.qunit.ts - QUnit tests for CPCBasic BasicLexer
//

const bGenerateAllResults = false;

import { Utils } from "../Utils";
import { BasicLexer, LexerToken } from "../BasicLexer";
import { QUnit } from "qunit"; //TTT

type TestsType = { [k in string]: string };

type AllTestsType = { [k in string]: TestsType };

QUnit.dump.maxDepth = 10;

QUnit.module("BasicLexer: Tests", function () {
	const mAllTests: AllTestsType = { // eslint-disable-line vars-on-top
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

	function runTestsFor(assert, oTests: TestsType, aResults?: string[]) {
		const oBasicLexer = new BasicLexer();

		for (const sKey in oTests) {
			if (oTests.hasOwnProperty(sKey)) {
				const sExpected = oTests[sKey],
					oExpected = JSON.parse(sExpected);
				let aTokens: LexerToken[],
					sActual: string;

				try {
					aTokens = oBasicLexer.lex(sKey);

					sActual = JSON.stringify(aTokens);
				} catch (e) {
					Utils.console.error(e);
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
				const aResults: string[] = [];

				sResult += sCategory + ": {\n";

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
