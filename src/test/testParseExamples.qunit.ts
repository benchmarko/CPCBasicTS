// testParseExamples.qunit.ts - Test to load and parse all examples
//
// Examples:
// qunit dist/test/testParseExamples.qunit.js
// qunit dist/test/testParseExamples.qunit.js debug=1
//
// node dist/test/testParseExamples.qunit.js
// npm test...

interface NodeHttps {
	get: (url: string, fn: (res: any) => void) => any
}

interface NodeFs {
	readFile: (name: string, encoding: string, fn: (res: any) => void) => any
}

interface NodePath {
	resolve: (dir: string, name: string) => string
}

let https: NodeHttps, // nodeJs
	fs: NodeFs,
	path: NodePath,
	__dirname: string; // eslint-disable-line no-underscore-dangle

import { ModelPropID } from "../Constants";
import { Utils } from "../Utils";
import { ICpcVmRsx, IOutput } from "../Interfaces";
import { BasicLexer } from "../BasicLexer";
import { BasicParser } from "../BasicParser";
import { BasicTokenizer } from "../BasicTokenizer";
import { CodeGeneratorJs } from "../CodeGeneratorJs";
import { CodeGeneratorToken } from "../CodeGeneratorToken";
import { Model, DatabaseEntry, DatabasesType, ExampleEntry } from "../Model";
import { VarTypes, Variables } from "../Variables";
import { DiskImage } from "../DiskImage";
import { cpcconfig } from "../cpcconfig";
import { TestHelper } from "./TestHelper";

type QUnitAssertType3 = { ok: (r: any, e: any, msg: string) => void, expect: (arg: any) => void, async: () => (() => void) };

// eslint-disable-next-line no-new-func
const myGlobalThis = (typeof globalThis !== "undefined") ? globalThis : Function("return this")(), // for old IE
	nodeJsAvail = (function () {
		let nodeJs = false;

		// https://www.npmjs.com/package/detect-node
		// Only Node.JS has a process variable that is of [[Class]] process
		try {
			if (Object.prototype.toString.call(myGlobalThis.process) === "[object process]") {
				nodeJs = true;
			}
		} catch (e) {
			// empty
		}
		return nodeJs;
	}());


function isUrl(s: string) {
	return s.startsWith("http"); // http or https
}

function fnEval(code: string) {
	return eval(code); // eslint-disable-line no-eval
}

function nodeReadUrl(url: string, fnDataLoaded: (error: Error | undefined, data?: string) => void) {
	if (!https) {
		fnEval('https = require("https");'); // to trick TypeScript
	}
	https.get(url, (resp) => {
		let data = "";

		// A chunk of data has been received.
		resp.on("data", (chunk: string) => {
			data += chunk;
		});

		// The whole response has been received. Print out the result.
		resp.on("end", () => {
			fnDataLoaded(undefined, data);
		});
	}).on("error", (err: Error) => {
		Utils.console.log("Error: " + err.message);
		fnDataLoaded(err);
	});
}

function nodeReadFile(name: string, fnDataLoaded: (error: Error | undefined, data?: string) => void) {
	if (!fs) {
		fnEval('fs = require("fs");'); // to trick TypeScript
	}
	fs.readFile(name, "utf8", fnDataLoaded);
}


function nodeGetAbsolutePath(name: string) {
	if (!path) {
		// eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
		fnEval('path = require("path");'); // to trick TypeScript
	}

	// https://stackoverflow.com/questions/8817423/why-is-dirname-not-defined-in-node-repl
	const dirname = __dirname || (path as any).dirname(__filename),
		absolutePath = path.resolve(dirname, name);

	return absolutePath;
}


function createModel() {
	const startConfig = {};

	Object.assign(startConfig, cpcconfig || {}); // merge external config from cpcconfig.js
	const model = new Model(startConfig);

	return model;
}


class cpcBasic {
	static assert: any;

	static totalExamples: number;
	static ignoredExamples: number;

	static baseDir = "../"; // base test directory (relative to dist)
	static dataBaseDirOrUrl = "";
	static model = createModel();

	static databaseNames: string[];
	static databaseIndex: number;
	static fnIndexDone1: () => void;

	static testExamples: string[];
	static testIndex: number; // example index for current database
	static fnExampleDone1: () => void;

	static basicParser = new BasicParser({
		quiet: true
	});

	static basicLexer = new BasicLexer({
		keywords: cpcBasic.basicParser.getKeywords(),
		keepWhiteSpace: true,
		quiet: true
	});

	static convertParser = new BasicParser({
		quiet: true,
		keepTokens: true,
		keepBrackets: true,
		keepColons: true,
		keepDataComma: true
	});

	static codeGeneratorJs = new CodeGeneratorJs({
		lexer: cpcBasic.basicLexer,
		parser: cpcBasic.basicParser,
		trace: false,
		quiet: true
	})

	static codeGeneratorToken = new CodeGeneratorToken({
		lexer: cpcBasic.basicLexer,
		parser: cpcBasic.convertParser
	})

	static vmMock = {
		line: "" as string | number,

		gosubStack: [] as (number | string)[],

		testVariables1: new Variables({}),
		testStepCounter1: 0,

		maxSteps: 10, // number of steps to simulate

		initTest1: function () {
			cpcBasic.vmMock.testStepCounter1 = cpcBasic.vmMock.maxSteps;
			cpcBasic.vmMock.line = 0; // or "start";
			cpcBasic.vmMock.gosubStack.length = 0;
			cpcBasic.vmMock.testVariables1.initAllVariables();

			for (let i = "a".charCodeAt(0); i <= "z".charCodeAt(0); i += 1) {
				const varChar = String.fromCharCode(i);

				cpcBasic.vmMock.testVariables1.setVarType(varChar, "R");
			}
		},

		vmGetAllVariables: function () {
			return cpcBasic.vmMock.testVariables1.getAllVariables();
		},
		vmGetAllVarTypes: function () {
			return cpcBasic.vmMock.testVariables1.getAllVarTypes();
		},
		vmLoopCondition: function () {
			cpcBasic.vmMock.testStepCounter1 -= 1;
			return cpcBasic.vmMock.testStepCounter1 > 0;
		},

		vmRound: function (n: number) {
			return (n >= 0) ? (n + 0.5) | 0 : (n - 0.5) | 0; // eslint-disable-line no-bitwise
		},

		vmAssign(_varType: string, value: string | number): (string | number) {
			return value;
		},

		vmAssertNumberType: function () {
			// empty
		},

		vmTrace: function () {
			// empty
		},

		vmSetLabels: function () {
			// empty
		},

		addressOf(variable: string): number { // addressOf operator
			return cpcBasic.vmMock.testVariables1.getVariableIndex(variable);
		},

		callRsx() {
			// empty
		},

		vmDefineVarTypes(type: VarTypes, _err: string, first: string, last?: string) {
			const firstNum = first.toLowerCase().charCodeAt(0),
				lastNum = last ? last.toLowerCase().charCodeAt(0) : firstNum;

			for (let i = firstNum; i <= lastNum; i += 1) {
				const varChar = String.fromCharCode(i);

				cpcBasic.vmMock.testVariables1.setVarType(varChar, type);
			}
		},

		// defxxx needed to access correct multidimensional arrays
		defint(first: string, last?: string): void {
			this.vmDefineVarTypes("I", "DEFINT", first, last);
		},

		defreal(first: string, last?: string): void {
			this.vmDefineVarTypes("R", "DEFREAL", first, last);
		},

		defstr(first: string, last?: string): void {
			this.vmDefineVarTypes("$", "DEFSTR", first, last);
		},

		dim(varName: string): void { // varargs
			const dimensions = [];

			for (let i = 1; i < arguments.length; i += 1) {
				const size = this.vmRound(arguments[i]) + 1; // for basic we have sizes +1

				dimensions.push(size);
			}
			cpcBasic.vmMock.testVariables1.dimVariable(varName, dimensions);
		},

		vmGetNextInput: function () {
			return 0;
		},

		vmStop: function (reason: string) {
			if (reason === "end") {
				cpcBasic.vmMock.testStepCounter1 = 0;
			}
		},

		vmGoto: function (line: string | number) {
			cpcBasic.vmMock.line = line;
		},

		"goto": function (line: number) {
			cpcBasic.vmMock.line = line;
		},

		gosub: function (retLabel: string | number, line: number) {
			this.gosubStack.push(retLabel);
			cpcBasic.vmMock.vmGoto(line);
		},

		"return"(): void {
			const line = this.gosubStack.pop() || 0;

			cpcBasic.vmMock.vmGoto(line);
		}

		// will be programmatically extended by methods...
	};

	static basicTokenizer = new BasicTokenizer(); // for loading tokenized examples

	static initVmMock1() {
		const vmMock = cpcBasic.vmMock,
			keywords = cpcBasic.basicParser.getKeywords();

		for (const key in keywords) {
			if (keywords.hasOwnProperty(key)) {
				if (!(vmMock as any)[key]) {
					(vmMock as any)[key] = function () {
						return key;
					};
				}
			}
		}
	}


	static getUniqueDbKey(name: string, databases: DatabasesType) {
		let key = name,
			index = 2;

		while (databases[key]) {
			key = name + index;
			index += 1;
		}
		return key;
	}

	static initDatabases(): string[] {
		const model = cpcBasic.model,
			databases: DatabasesType = {},
			databaseDirs = model.getProperty<string>(ModelPropID.databaseDirs).split(","),
			databaseNames: string[] = [];

		for (let i = 0; i < databaseDirs.length; i += 1) {
			const databaseDir = databaseDirs[i],
				parts1 = databaseDir.split("="),
				databaseSrc = parts1[0],
				assignedName = parts1.length > 1 ? parts1[1] : "",
				parts2 = databaseSrc.split("/"),
				name = assignedName || parts2[parts2.length - 1],
				key = this.getUniqueDbKey(name, databases);

			databases[key] = {
				text: key,
				title: databaseSrc,
				src: databaseSrc
			};
			databaseNames.push(key);
		}
		cpcBasic.model.addDatabases(databases);
		return databaseNames;
	}

	private static addIndex2(_dir: string, input: Record<string, unknown>) { // dir maybe ""
		for (const value in input) {
			if (input.hasOwnProperty(value)) {
				const item = input[value] as ExampleEntry[];

				for (let i = 0; i < item.length; i += 1) {
					//item[i].dir = dir; // TTT to check
					this.model.setExample(item[i]);
				}
			}
		}
	}

	private static addLineNumbers(input: string) {
		const lineParts = input.split("\n");
		let lastLine = 0;

		for (let i = 0; i < lineParts.length; i += 1) {
			let lineNum = parseInt(lineParts[i], 10);

			if (isNaN(lineNum)) {
				lineNum = lastLine + 1;
				lineParts[i] = String(lastLine + 1) + " " + lineParts[i];
			}
			lastLine = lineNum;
		}
		return lineParts.join("\n");
	}

	// Also called from example files xxxxx.js
	private static addItem2(key: string, input: string) { // key maybe ""
		if (!key) { // maybe ""
			key = cpcBasic.model.getProperty<string>(ModelPropID.example);
		}
		input = input.replace(/^\n/, "").replace(/\n$/, ""); // remove preceding and trailing newlines
		// beware of data files ending with newlines! (do not use trimEnd)

		const implicitLines = false,
			linesOnLoad = true;

		if (input.startsWith("REM ") && !implicitLines && linesOnLoad) {
			input = cpcBasic.addLineNumbers(input);
		}

		const example = cpcBasic.model.getExample(key);

		example.key = key; // maybe changed
		example.script = input;
		example.loaded = true;
		return key;
	}

	static fnHereDoc(fn: () => void) {
		return String(fn).
			replace(/^[^/]+\/\*\S*/, "").
			replace(/\*\/[^/]+$/, "");
	}

	static addIndex(dir: string, input: Record<string, unknown> | (() => void)) {
		if (typeof input === "function") {
			input = {
				[dir]: JSON.parse(this.fnHereDoc(input).trim())
			};
		}
		return this.addIndex2(dir, input);
	}

	static addItem(key: string, input: string | (() => void)) {
		if (typeof input !== "string") {
			input = this.fnHereDoc(input);
		}
		return this.addItem2(key, input);
	}

	static addRsx(key: string, RsxConstructor: new () => ICpcVmRsx) {
		const rsx = new RsxConstructor();

		if (!key) { // maybe ""
			key = cpcBasic.model.getProperty<string>(ModelPropID.example);
		}
		const example = cpcBasic.model.getExample(key);

		example.key = key; // maybe changed
		example.rsx = rsx;
		example.loaded = true;

		const commands = rsx.getRsxCommands();

		if (Utils.debug > 0) {
			Utils.console.debug("addRsx: commands.length:", commands.length);
		}
	}
}

if (!myGlobalThis.cpcBasic) {
	myGlobalThis.cpcBasic = cpcBasic;
}


// taken from Controller.js
interface FileMeta {
	type?: string
	start?: number
	length?: number
	entry?: number
	encoding?: string
}

interface FileMetaAndData {
	meta: FileMeta
	data: string
}

function splitMeta(input: string) {
	const metaIdent = "CPCBasic";

	let fileMeta: FileMeta | undefined;

	if (input.indexOf(metaIdent) === 0) { // starts with metaIdent?
		const index = input.indexOf(","); // metadata separator

		if (index >= 0) {
			const metaString = input.substring(0, index);

			input = input.substring(index + 1);

			const meta = metaString.split(";");

			fileMeta = {
				type: meta[1],
				start: Number(meta[2]),
				length: Number(meta[3]),
				entry: Number(meta[4]),
				encoding: meta[5]
			};
		}
	}

	const metaAndData: FileMetaAndData = {
		meta: fileMeta || {},
		data: input
	};

	return metaAndData;
}

function asmGena3Convert(input: string) {
	throw new Error("asmGena3Convert: not implemented for test: " + input);
	return input;
}

// taken from Controller.js
function testCheckMeta(input: string) {
	const data = splitMeta(input || "");

	input = data.data; // maybe changed

	if (data.meta.encoding === "base64") {
		input = Utils.atob(input); // decode base64
	}

	const type = data.meta.type;

	if (type === "T") { // tokenized basic?
		input = cpcBasic.basicTokenizer.decode(input);
	} else if (type === "P") { // protected BASIC?
		input = DiskImage.unOrProtectData(input); // TODO
		input = cpcBasic.basicTokenizer.decode(input);
	} else if (type === "B") { // binary?
	} else if (type === "A") { // ASCII?
		// remove EOF character(s) (0x1a) from the end of file
		input = input.replace(/\x1a+$/, ""); // eslint-disable-line no-control-regex
	} else if (type === "G") { // Hisoft Devpac GENA3 Z80 Assember
		input = asmGena3Convert(input); // TODO
	}
	return input;
}

// needed for example "rosetta/execute" which has a line without line number
function hasLineNumbers(input: string) {
	let hasNumbers = true;
	const lineParts = input.split("\n");

	for (let i = 0; i < lineParts.length; i += 1) {
		const lineNum = parseInt(lineParts[i], 10);

		if (isNaN(lineNum)) {
			hasNumbers = false;
			break;
		}
	}
	return hasNumbers;
}

function testParseExample(example: ExampleEntry) {
	const codeGeneratorJs = cpcBasic.codeGeneratorJs,
		codeGeneratorToken = cpcBasic.codeGeneratorToken,
		basicTokenizer = cpcBasic.basicTokenizer,
		script = example.script || "",
		input = testCheckMeta(script);

	let	checks = "",
		output: IOutput,
		fnScript: Function; // eslint-disable-line @typescript-eslint/ban-types

	if (example.meta !== "D" && hasLineNumbers(input)) { // skip data files  && example.meta !== "X" && example.meta !== "Z") { // skip data, dsk and zip files
		checks = "Js";
		const variables = cpcBasic.vmMock.testVariables1;

		// test lexer, parser and JS code generator
		variables.removeAllVariables();
		output = codeGeneratorJs.generate(input, variables);

		if (!output.error) {
			const jsScript = output.text;

			try {
				// test generate function
				checks += ",Fn";
				fnScript = new Function("o", jsScript); // eslint-disable-line no-new-func

				// test execute function (running script for fixed number of steps)
				checks += ",exec";
				cpcBasic.vmMock.initTest1();
				fnScript(cpcBasic.vmMock);
				checks += "(line " + cpcBasic.vmMock.line + ")";

				// test tokenizer
				checks += ",token";
				const tokens = codeGeneratorToken.generate(input);

				checks += "(" + tokens.text.length + ")";

				// test de-tokenizer
				checks += ",deToken";
				const decoded = basicTokenizer.decode(tokens.text);

				checks += "(" + decoded.length + ")";

				checks += ",Js2";
				variables.removeAllVariables();
				const output2 = codeGeneratorJs.generate(decoded, variables);

				checks += ",Fn2";
				fnScript = new Function("o", output2.text); // eslint-disable-line no-new-func

				// test execute function (running script for fixed number of steps)
				checks += ",exec2";
				cpcBasic.vmMock.initTest1();
				fnScript(cpcBasic.vmMock);
				checks += "(line " + cpcBasic.vmMock.line + ")";
			} catch (e) {
				Utils.console.error("Error in file", example.key);
				Utils.console.error(e);
				output.error = e;
			}
		} else {
			Utils.console.error("There was an error when parsing file", example.key);
		}
	} else {
		checks = "ignored";
		output = {
			text: "UNPARSED DATA FILE: " + example.key,
			error: undefined
		};
		cpcBasic.ignoredExamples += 1;
	}

	if (Utils.debug > 0) {
		Utils.console.debug("testParseExample:", example.key, "inputLen:", input.length, "outputLen:", output.text.length);
	}

	if (cpcBasic.assert) {
		cpcBasic.assert.ok(!output.error, example.key + ": " + checks);
	}

	return output;
}

function fnExampleLoaded(error?: Error, code?: string) {
	if (error) {
		throw error;
	}
	cpcBasic.fnExampleDone1();

	if (code) {
		fnEval(code); // load example (for nodeJs)
	}

	const key = cpcBasic.model.getProperty<string>(ModelPropID.example),
		example = cpcBasic.model.getExample(key),
		output = testParseExample(example);

	if (!output.error) {
		testNextExample(); // eslint-disable-line no-use-before-define
	}
}

function fnExampleLoadedUtils(/* url */) {
	return fnExampleLoaded(undefined, "");
}

function fnExampleErrorUtils(url: string) {
	return fnExampleLoaded(new Error("fnExampleErrorUtils: " + url), "");
}

function testLoadExample(exampleEntry: ExampleEntry) {
	const example = exampleEntry.key,
		fileOrUrl = cpcBasic.dataBaseDirOrUrl + "/" + example + ".js";

	if (cpcBasic.assert) {
		cpcBasic.fnExampleDone1 = cpcBasic.assert.async();
	}

	try {
		if (nodeJsAvail) {
			if (isUrl(fileOrUrl)) {
				nodeReadUrl(fileOrUrl, fnExampleLoaded);
			} else {
				nodeReadFile(fileOrUrl, fnExampleLoaded);
			}
		} else {
			Utils.loadScript(fileOrUrl, fnExampleLoadedUtils, fnExampleErrorUtils, example);
		}
	} catch (e) {
		Utils.console.error("Error in file", example);
		Utils.console.error(e);
	}
}

function testNextExample() {
	const testExamples = cpcBasic.testExamples,
		testIndex = cpcBasic.testIndex;

	if (testIndex < testExamples.length) {
		const key = testExamples[testIndex];

		cpcBasic.testIndex += 1;
		cpcBasic.model.setProperty(ModelPropID.example, key);
		const example = cpcBasic.model.getExample(key);

		testLoadExample(example);
	} else { // another database?
		testNextIndex(); // eslint-disable-line no-use-before-define
	}
}


function fnIndexLoaded(error: Error | undefined, code?: string) {
	if (error) {
		throw error;
	}
	cpcBasic.fnIndexDone1();

	if (code) {
		fnEval(code); // load index (for nodeJs)
	}

	const allExamples = cpcBasic.model.getAllExamples();

	cpcBasic.testExamples = Object.keys(allExamples);
	if (TestHelper.config.test) { // a single test specified?
		const testName = TestHelper.config.test;

		cpcBasic.testExamples = cpcBasic.testExamples.filter(function (item: string) {
			return item === testName;
		});
	}
	cpcBasic.testIndex = 0;

	cpcBasic.totalExamples += cpcBasic.testExamples.length;
	if (cpcBasic.assert) {
		cpcBasic.assert.expect(cpcBasic.totalExamples);
	}

	testNextExample();
}

function fnIndexLoadedUtils(/* url */) {
	return fnIndexLoaded(undefined, "");
}

function fnIndexErrorUtils(url: string) {
	return fnIndexLoaded(new Error("fnIndexErrorUtils: " + url));
}


function testLoadIndex(exampeDb: DatabaseEntry) {
	let dir = exampeDb.src;

	if (!isUrl(dir)) {
		dir = cpcBasic.baseDir + dir;
	}

	if (cpcBasic.assert) {
		cpcBasic.fnIndexDone1 = cpcBasic.assert.async();
	}

	if (nodeJsAvail) {
		if (!isUrl(dir)) {
			if (Utils.debug > 0) {
				Utils.console.debug("testParseExamples: __dirname=", __dirname, " dir=", dir);
			}
			dir = nodeGetAbsolutePath(dir); // convert to absolute path to get it working also for "npm test" and not only for node
		}
	}
	cpcBasic.dataBaseDirOrUrl = dir;

	const fileOrUrl = cpcBasic.dataBaseDirOrUrl + "/0index.js"; // "./examples/0index.js";

	Utils.console.log("testParseExamples: Using Database index:", fileOrUrl);

	if (nodeJsAvail) {
		if (isUrl(dir)) {
			if (TestHelper.config.testAll) {
				nodeReadUrl(fileOrUrl, fnIndexLoaded);
			} else {
				Utils.console.log("testParseExamples: testAll=" + TestHelper.config.testAll + ": skipping index loading for", fileOrUrl);
				fnIndexLoaded(undefined, ""); // skip loading index
			}
		} else {
			nodeReadFile(fileOrUrl, fnIndexLoaded);
		}
	} else {
		Utils.loadScript(fileOrUrl, fnIndexLoadedUtils, fnIndexErrorUtils, exampeDb.text);
	}
}

function testNextIndex() {
	const databaseNames = cpcBasic.databaseNames,
		databaseIndex = cpcBasic.databaseIndex;
	let nextIndex = false;

	if (databaseIndex < databaseNames.length) {
		const key = databaseNames[databaseIndex]; // e.g. "examples";

		if (key !== "storage") { // ignore "storage"
			cpcBasic.databaseIndex += 1;
			cpcBasic.model.setProperty(ModelPropID.database, key);
			const exampeDb = cpcBasic.model.getDatabase();

			nextIndex = true;
			testLoadIndex(exampeDb);
		}
	}

	if (!nextIndex) {
		Utils.console.log("testParseExamples: Total examples:", cpcBasic.totalExamples, "/ Ignored examples:", cpcBasic.ignoredExamples);
	}
}

function testStart() {
	const Polyfills = (window as any).Polyfills;

	Utils.console.log("testParseExamples: nodeJs:", nodeJsAvail, " Polyfills.getList().length:", Polyfills.getList().length);

	cpcBasic.initVmMock1();
	cpcBasic.totalExamples = 0;
	cpcBasic.ignoredExamples = 0;
	cpcBasic.databaseNames = cpcBasic.initDatabases();
	cpcBasic.databaseIndex = 0;
	testNextIndex();
}

TestHelper.init();

if (typeof myGlobalThis.QUnit !== "undefined") {
	Utils.console.log("Using QUnit");
	const QUnit = myGlobalThis.QUnit;

	QUnit.config.testTimeout = 8 * 1000;
	QUnit.module("testParseExamples: Tests", function (/* hooks */) {
		QUnit.test("testParseExamples", function (assert: QUnitAssertType3) {
			cpcBasic.assert = assert;
			testStart();
		});
	});
} else {
	cpcBasic.fnIndexDone1 = function () {
		// empty
	};
	cpcBasic.fnExampleDone1 = function () {
		// empty
	};

	testStart();
}
// end
