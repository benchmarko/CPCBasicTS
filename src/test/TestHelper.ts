// TestHelper.ts - Tests Helper
//

import { Utils } from "../Utils";

export type TestsType = Record<string, string>;

export type AllTestsType = Record<string, TestsType>;

export type runTestsForType = (assert: Assert | undefined, category: string, tests: TestsType, results?: string[]) => void;
declare global {
    interface Window {
		QUnit: unknown
	}
}


type ConfigEntryType = string | number | boolean; // also in Model

type ConfigType = Record<string, ConfigEntryType>;

// QUnit.dump.maxDepth = 10;

export class TestHelper { // eslint-disable-line vars-on-top
	static config: ConfigType = {
		debug: 0,
		generateAll: false
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

	private static generateTests(allTests: AllTestsType, runTestsFor: runTestsForType) {
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

	private static generateAllResults(allTests: AllTestsType, runTestsFor: runTestsForType) {
		const reJsKeywords = TestHelper.createJsKeywordRegex();
		let result = "";

		for (const category in allTests) {
			if (allTests.hasOwnProperty(category)) {
				const results: string[] = [],
					containsSpace = category.indexOf(" ") >= 0,
					isJsKeyword = reJsKeywords.test(category);

				result += containsSpace || isJsKeyword ? TestHelper.stringInQuotes(category) : category;
				result += ": {\n";

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
