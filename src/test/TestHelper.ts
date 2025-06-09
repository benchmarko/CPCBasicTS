// TestHelper.ts - Tests Helper
//

import { Utils } from "../Utils";

export type TestsType = Record<string, string>;

export type AllTestsType = Record<string, TestsType>;

export type ResultType = Record<string, string[]>;

export type runTestsForType = (category: string, tests: TestsType, assert?: Assert, results?: ResultType) => void;

declare global {
    interface Window {
		QUnit: unknown
	}
}

type ConfigEntryType = string | number | boolean; // also in Model

type ConfigType = Record<string, ConfigEntryType>;

export class TestHelper {
	static config: ConfigType = {
		debug: 0,
		generateAll: false,
		generateKeys: false,
		test: "", // a specific test
		testAll: false // run all tests
	};

	static init(): void {
		const config = TestHelper.config;

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
				nameValueList = Utils.split2(nameValue, "="),
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

	private static generateTests(allTests: AllTestsType, runTestsFor: runTestsForType, results?: ResultType) {
		for (const category in allTests) {
			if (allTests.hasOwnProperty(category)) {
				if (results) {
					results[category] = [];
				}

				QUnit.test(category, function (assert) { // category must be a local variable
					runTestsFor(category, allTests[category], assert, results);
				});
			}
		}
	}

	private static fnBinaryLiteralReplacer(bin: string) {
		return "0x" + parseInt(bin.substring(2), 2).toString(16).toLowerCase();
	}

	static handleBinaryLiterals(str: string): string {
		if (!Utils.supportsBinaryLiterals) {
			str = str.replace(/(0b[01]+)/g, TestHelper.fnBinaryLiteralReplacer); // for old IE
		}
		return str;
	}

	static hexInQuotes(s: string): string {
		let out = "";

		for (let i = 0; i < s.length; i += 1) {
			out += "\\x" + ("00" + s.charCodeAt(i).toString(16)).slice(-2);
		}
		return '"' + out + '"';
	}

	static stringInQuotes(s: string): string {
		s = s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/\r/g, "\\r");
		// keep \n, \r
		s = s.replace(/[\x00-\x09\x0b\x0c\x0e-\x1f\x7f-\xff]/g, function (char: string) { // eslint-disable-line no-control-regex
			return "\\x" + ("00" + char.charCodeAt(0).toString(16)).slice(-2);
		});

		const count1 = s.split('"').length - 1,
			count2 = s.split("'").length - 1;

		if (count1 > count2) { // more " than ' in the string
			return "'" + s.replace(/'/g, "\\'") + "'";
		}
		return '"' + s.replace(/"/g, '\\"') + '"';
	}

	// ECMA 3 JS Keywords which must be avoided in dot notation for properties when using IE8
	private static readonly jsKeywords = [
		"do",
		"if",
		"in",
		"for",
		"int",
		"new",
		"try",
		"var",
		"byte",
		"case",
		"char",
		"else",
		"enum",
		"goto",
		"long",
		"null",
		"this",
		"true",
		"void",
		"with",
		"break",
		"catch",
		"class",
		"const",
		"false",
		"final",
		"float",
		"short",
		"super",
		"throw",
		"while",
		"delete",
		"double",
		"export",
		"import",
		"native",
		"public",
		"return",
		"static",
		"switch",
		"throws",
		"typeof",
		"boolean",
		"default",
		"extends",
		"finally",
		"package",
		"private",
		"abstract",
		"continue",
		"debugger",
		"function",
		"volatile",
		"interface",
		"protected",
		"transient",
		"implements",
		"instanceof",
		"synchronized"
	];

	private static createJsKeywordRegex() {
		return new RegExp("^(" + TestHelper.jsKeywords.join("|") + ")$");
	}

	private static listKeys(category: string, tests: TestsType, assert?: Assert, results?: ResultType) {
		for (const key in tests) {
			if (tests.hasOwnProperty(key)) {
				const result = "";

				if (results) {
					results[category].push(TestHelper.stringInQuotes(key) + ": " + TestHelper.stringInQuotes(result));
				}

				if (assert) {
					assert.strictEqual(result, result);
				}
			}
		}
	}

	private static printAllResults(allResults: ResultType) {
		const reJsKeywords = TestHelper.createJsKeywordRegex();
		let result = "";

		for (const category in allResults) {
			if (allResults.hasOwnProperty(category)) {
				const results = allResults[category],
					containsSpace = category.indexOf(" ") >= 0,
					isJsKeyword = reJsKeywords.test(category);

				if (results.length) {
					result += containsSpace || isJsKeyword ? TestHelper.stringInQuotes(category) : category;
					result += ": {\n";
					result += results.join(",\n");
					result += "\n},\n";
				}
			}
		}
		result = result.replace(/,\n$/, "\n"); // remove last comma
		Utils.console.log(result);
		return result;
	}

	static generateAllTests(allTests: AllTestsType, runTestsFor: runTestsForType, hooks: NestedHooks): void {
		let allResults: ResultType | undefined;

		if (TestHelper.config.generateAll || TestHelper.config.generateKeys) {
			allResults = {};
			hooks.after(function () {
				if (allResults) {
					TestHelper.printAllResults(allResults);
				}
			});
		}
		TestHelper.generateTests(allTests, TestHelper.config.generateKeys ? TestHelper.listKeys : runTestsFor, allResults);
	}

	private static compareKeys(keys1: string[], keys2: string[], type: string) {
		let isEqual = true;

		for (let i = 0; i < keys1.length; i += 1) {
			if (keys1[i] !== keys2[i]) {
				isEqual = false;
				Utils.console.warn("compareKeys: " + type + ": " + keys1[i] + " <> " + keys2[i]);
			}
		}
		if (keys1.length !== keys2.length) {
			isEqual = false;
			Utils.console.warn("compareKeys: " + type + ": different sizes: " + keys1.length + " <> " + keys2.length);
		}
		return isEqual;
	}

	static compareAllTests(allTests1: AllTestsType, allTests2: AllTestsType): boolean {
		const categories1 = Object.keys(allTests1),
			categories2 = Object.keys(allTests2);
		let isEqual = TestHelper.compareKeys(categories1, categories2, "categories");

		if (isEqual) {
			for (let i = 0; i < categories1.length; i += 1) {
				const category = categories1[i],
					key1 = allTests1[category],
					key2 = allTests2[category],
					keys1 = Object.keys(key1),
					keys2 = Object.keys(key2);

				isEqual = TestHelper.compareKeys(keys1, keys2, "keys");
			}
		}

		return isEqual;
	}
}

TestHelper.init();
// end
