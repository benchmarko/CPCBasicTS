// BasicParser.qunit.ts - QUnit tests for CPCBasic BasicParser
//
/* xxxglobals QUnit */

const bGenerateAllResults = false;

import { Utils } from "../Utils";
import { BasicLexer } from "../BasicLexer"; // we use BasicLexer here just for convenient input
import { BasicParser, ParserNode } from "../BasicParser";

import { QUnit } from "qunit"; //TTT

/*
declare global {
    interface Window { QUnit: QUnit; }
}
*/

QUnit.dump.maxDepth = 10;

QUnit.module("BasicParser: Tests", function (hooks) {
	hooks.before(function (/* assert */) {
		/*
		const that = this; // eslint-disable-line no-invalid-this

		that.oTester = {
			oBasicLexer: new BasicLexer(),
			oBasicParser: new BasicParser()
		};
		*/
	});
	hooks.beforeEach(function (/* assert */) {
		/*
		const that = this; // eslint-disable-line no-invalid-this

		that.oBasicLexer.reset();
		that.oBasicParser.reset();
		*/
	});

	const mAllTests = { // eslint-disable-line vars-on-top
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
		const oBasicLexer = new BasicLexer(),
			oBasicParser = new BasicParser();

		for (const sKey in oTests) {
			if (oTests.hasOwnProperty(sKey)) {
				const sExpected = oTests[sKey];
				let	oExpected,
					aParseTree: ParserNode[];

				try {
					oExpected = JSON.parse(sExpected);
					const aTokens = oBasicLexer.lex(sKey);

					aParseTree = oBasicParser.parse(aTokens);
				} catch (e) {
					Utils.console.error(e);
					aParseTree = e;
				}
				// or: sJson = JSON.stringify(aParseTree); //assert.strictEqual(sJson, sExpected);
				assert.deepEqual(aParseTree, oExpected, sKey);
			}
		}
	}

	function generateTests(oAllTests) {
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

	function generateCategoryResults(oTests) {
		const oBasicLexer = new BasicLexer(),
			oBasicParser = new BasicParser(),
			aResults = [];

		for (const sKey in oTests) {
			if (oTests.hasOwnProperty(sKey)) {
				let sActual: string;

				try {
					const aTokens = oBasicLexer.lex(sKey),
						aParseTree = oBasicParser.parse(aTokens);

					sActual = JSON.stringify(aParseTree);
				} catch (e) {
					Utils.console.error(e);
				}
				aResults.push('"' + sKey + '": \'' + sActual + "'");
			}
		}
		return aResults.join(",\n");
	}

	function generateAllResults(oAllTests) {
		let	sResult = "";

		for (const sCategory in oAllTests) {
			if (oAllTests.hasOwnProperty(sCategory)) {
				sResult += sCategory + ": {\n";
				sResult += generateCategoryResults(oAllTests[sCategory]);
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
