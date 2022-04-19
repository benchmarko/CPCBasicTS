// TestHelper.ts - Tests Helper
//

import { Utils } from "../Utils";

export type TestsType = {[k in string]: string};

export type AllTestsType = {[k in string]: TestsType};

export type runTestsForType = (assert: Assert | undefined, category: string, tests: TestsType, results?: string[]) => void;
declare global {
    interface Window {
		QUnit: unknown
	}
}


type ConfigEntryType = string | number | boolean; // also in Model

type ConfigType = { [k in string]: ConfigEntryType };

// QUnit.dump.maxDepth = 10;

export class TestHelper { // eslint-disable-line vars-on-top
	static config: ConfigType = {
		debug: 0,
		generateAll: false
	};

	static init(): void {
		const config = TestHelper.config;

		// https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/node/process.d.ts
		if (typeof process !== "undefined") { // nodeJs
			TestHelper.fnParseArgs(process.argv.slice(2), config);
		} else { // browser
			TestHelper.fnParseUri(window.location.search.substring(1), config);
		}

		if (config.debug) {
			Utils.debug = config.debug as number;
			Utils.console.log("testParseExamples: Debug level:", config.debug);
		}
	}

	// https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/node/process.d.ts
	// can be used for nodeJS
	private static fnParseArgs(args: string[], config: ConfigType) {
		for (let i = 0; i < args.length; i += 1) {
			const nameValue = args[i],
				nameValueList = nameValue.split("=", 2),
				name = nameValueList[0];

			if (config.hasOwnProperty(name)) {
				let value: string|number|boolean = nameValueList[1];

				if (value !== undefined && config.hasOwnProperty(name)) {
					switch (typeof config[name]) {
					case "string":
						break;
					case "boolean":
						value = (value === "true");
						break;
					case "number":
						value = Number(value);
						break;
					case "object":
						break;
					default:
						break;
					}
				}
				config[name] = value;
			}
		}
		return config;
	}

	private static fnParseUri(urlQuery: string, config: ConfigType) {
		const rPlus = /\+/g, // Regex for replacing addition symbol with a space
			fnDecode = function (s: string) { return decodeURIComponent(s.replace(rPlus, " ")); },
			rSearch = /([^&=]+)=?([^&]*)/g,
			args: string[] = [];

		let match: RegExpExecArray | null;

		while ((match = rSearch.exec(urlQuery)) !== null) {
			const name = fnDecode(match[1]),
				value = fnDecode(match[2]);

			if (value !== null && config.hasOwnProperty(name)) {
				args.push(name + "=" + value);
			}
		}
		TestHelper.fnParseArgs(args, config);
	}

	private static generateTests(allTests: AllTestsType, runTestsFor: runTestsForType): void {
		for (const category in allTests) {
			if (allTests.hasOwnProperty(category)) {
				(function (cat) { // eslint-disable-line no-loop-func
					QUnit.test(cat, function (assert: Assert) {
						runTestsFor(assert, cat, allTests[cat]);
					});
				}(category));
			}
		}
	}

	private static generateAllResults(allTests: AllTestsType, runTestsFor: runTestsForType): string {
		let result = "";

		for (const category in allTests) {
			if (allTests.hasOwnProperty(category)) {
				const results: string[] = [],
					containsSpace = category.indexOf(" ") >= 0,
					marker = containsSpace ? '"' : "";

				result += marker + category + marker + ": {\n";

				runTestsFor(undefined, category, allTests[category], results);
				result += results.join(",\n");
				result += "\n},\n";
			}
		}
		Utils.console.log(result);
		return result;
	}

	static generateAndRunAllTests(allTests: AllTestsType, runTestsFor: runTestsForType): void {
		TestHelper.generateTests(allTests, runTestsFor);

		if (TestHelper.config.generateAll) {
			TestHelper.generateAllResults(allTests, runTestsFor);
		}
	}
}

TestHelper.init();
// end
