// TestHelper.ts - Tests Helper
//

import { Utils } from "../Utils";
//import {} from "qunit";

export type TestsType = {[k in string]: string};

export type AllTestsType = {[k in string]: TestsType};

export type runTestsForType = (assert: Assert | undefined, sCategory: string, oTests: TestsType, aResults?: string[]) => void;


declare global {
    interface Window {
		QUnit: unknown
	}

	interface NodeJsProcess {
		argv: string[]
	}
	let process: NodeJsProcess;
}


type ConfigEntryType = string | number | boolean; // also in Model

type ConfigType = { [k in string]: ConfigEntryType };

//QUnit.dump.maxDepth = 10;

export class TestHelper { // eslint-disable-line vars-on-top
	static oConfig: ConfigType = {
		debug: 0,
		generateAll: false
	};

	static init(): void {
		const oConfig = TestHelper.oConfig;

		// https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/node/process.d.ts
		if (typeof process !== "undefined") { // nodeJs
			TestHelper.fnParseArgs(process.argv.slice(2), oConfig);
		} else { // browser
			TestHelper.fnParseUri(window.location.search.substring(1), oConfig);
		}

		if (oConfig.debug) {
			Utils.debug = oConfig.debug as number;
			Utils.console.log("testParseExamples: Debug level:", oConfig.debug);
		}
	}

	// https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/node/process.d.ts
	// can be used for nodeJS
	private static fnParseArgs(aArgs: string[], oConfig: ConfigType) {
		for (let i = 0; i < aArgs.length; i += 1) {
			const sNameValue = aArgs[i],
				aNameValue = sNameValue.split("=", 2),
				sName = aNameValue[0];

			if (oConfig.hasOwnProperty(sName)) {
				let sValue: string|number|boolean = aNameValue[1];

				if (sValue !== undefined && oConfig.hasOwnProperty(sName)) {
					switch (typeof oConfig[sName]) {
					case "string":
						break;
					case "boolean":
						sValue = (sValue === "true");
						break;
					case "number":
						sValue = Number(sValue);
						break;
					case "object":
						break;
					default:
						break;
					}
				}
				oConfig[sName] = sValue;
			}
		}
		return oConfig;
	}

	private static fnParseUri(sUrlQuery: string, oConfig: ConfigType) {
		const rPlus = /\+/g, // Regex for replacing addition symbol with a space
			fnDecode = function (s: string) { return decodeURIComponent(s.replace(rPlus, " ")); },
			rSearch = /([^&=]+)=?([^&]*)/g,
			aArgs: string[] = [];

		let aMatch: RegExpExecArray | null;

		while ((aMatch = rSearch.exec(sUrlQuery)) !== null) {
			const sName = fnDecode(aMatch[1]),
				sValue = fnDecode(aMatch[2]);

			if (sValue !== null && oConfig.hasOwnProperty(sName)) {
				aArgs.push(sName + "=" + sValue);
			}
		}
		TestHelper.fnParseArgs(aArgs, oConfig);
	}

	private static generateTests(oAllTests: AllTestsType, runTestsFor: runTestsForType): void {
		for (const sCategory in oAllTests) {
			if (oAllTests.hasOwnProperty(sCategory)) {
				(function (sCat) { // eslint-disable-line no-loop-func
					QUnit.test(sCat, function (assert: Assert) {
						runTestsFor(assert, sCat, oAllTests[sCat]);
					});
				}(sCategory));
			}
		}
	}

	private static generateAllResults(oAllTests: AllTestsType, runTestsFor: runTestsForType): string {
		let sResult = "";

		for (const sCategory in oAllTests) {
			if (oAllTests.hasOwnProperty(sCategory)) {
				const aResults: string[] = [],
					bContainsSpace = sCategory.indexOf(" ") >= 0,
					sMarker = bContainsSpace ? '"' : "";

				sResult += sMarker + sCategory + sMarker + ": {\n";

				runTestsFor(undefined, sCategory, oAllTests[sCategory], aResults);
				sResult += aResults.join(",\n");
				sResult += "\n},\n";
			}
		}
		Utils.console.log(sResult);
		return sResult;
	}

	static generateAndRunAllTests(oAllTests: AllTestsType, runTestsFor: runTestsForType): void {
		TestHelper.generateTests(oAllTests, runTestsFor);

		if (TestHelper.oConfig.generateAll) {
			TestHelper.generateAllResults(oAllTests, runTestsFor);
		}
	}
}

TestHelper.init();
// end

