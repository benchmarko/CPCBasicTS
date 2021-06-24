// testParseExamples.qunit.ts - Test to load and parse all examples
//

// qunit testParseExamples.qunit.js
// node  testParseExamples.qunit.js
// npm test...

/*
var fs, path, __dirname;
*/


interface NodeHttps {
	get: (sUrl: string, fn: (res: any) => void) => any
}

interface NodeFs {
	readFile: (sName: string, sEncoding: string, fn: (res: any) => void) => any
}

interface NodePath {
	resolve: (sDir: string, sName: string) => string
}

let https: NodeHttps, // nodeJs
	fs: NodeFs,
	path: NodePath,
	__dirname: string; // eslint-disable-line no-underscore-dangle

import { Utils } from "../Utils";
import { ICpcVmRsx, IOutput } from "../Interfaces";
import { Polyfills } from "../Polyfills";
import { BasicLexer } from "../BasicLexer";
import { BasicParser } from "../BasicParser";
import { BasicTokenizer } from "../BasicTokenizer";
import { CodeGeneratorJs } from "../CodeGeneratorJs";
import { Model, ConfigType, DatabaseEntry, DatabasesType, ExampleEntry } from "../Model";
import { Variables } from "../Variables";
import { DiskImage } from "../DiskImage";
import { cpcconfig } from "../cpcconfig";

type QUnitAssertType3 = { ok: (r: any, e: any, sMsg: string) => void, expect: (arg: any) => void, async: () => (() => void) };

// eslint-disable-next-line no-new-func
const oGlobalThis = (typeof globalThis !== "undefined") ? globalThis : Function("return this")(), // for old IE
	bNodeJsAvail = (function () {
		let bNodeJs = false;

		// https://www.npmjs.com/package/detect-node
		// Only Node.JS has a process variable that is of [[Class]] process
		try {
			if (Object.prototype.toString.call(oGlobalThis.process) === "[object process]") {
				bNodeJs = true;
			}
		} catch (e) {
			// empty
		}
		return bNodeJs;
	}());


function isUrl(s: string) {
	return s.startsWith("http"); // http or https
}

function fnEval(sCode: string) {
	return eval(sCode); // eslint-disable-line no-eval
}

function nodeReadUrl(sUrl: string, fnDataLoaded: (oError: Error | undefined, sData?: string) => void) {
	if (!https) {
		fnEval('https = require("https");'); // to trick TypeScript
	}
	https.get(sUrl, (resp) => {
		let sData = "";

		// A chunk of data has been received.
		resp.on("data", (sChunk: string) => {
			sData += sChunk;
		});

		// The whole response has been received. Print out the result.
		resp.on("end", () => {
			fnDataLoaded(undefined, sData);
		});
	}).on("error", (err: Error) => {
		Utils.console.log("Error: " + err.message);
		fnDataLoaded(err);
	});
}

function nodeReadFile(sName: string, fnDataLoaded: (oError: Error | undefined, sData?: string) => void) {
	if (!fs) {
		fnEval('fs = require("fs");'); // to trick TypeScript
	}
	fs.readFile(sName, "utf8", fnDataLoaded);
}

function nodeGetAbsolutePath(sName: string) {
	if (!path) {
		fnEval('path = require("path");'); // to trick TypeScript
	}
	const sAbsolutePath = path.resolve(__dirname, sName);

	return sAbsolutePath;
}


function createModel() {
	const oStartConfig = {};

	Object.assign(oStartConfig, cpcconfig || {}); // merge external config from cpcconfig.js
	const oInitialConfig = Object.assign({}, oStartConfig), // save config
		oModel = new Model(oStartConfig, oInitialConfig);

	return oModel;
}


class cpcBasic {
	static assert: any;

	static iTotalExamples: number;

	static sBaseDir = "../"; // base test directory (relative to dist)
	static sDataBaseDirOrUrl = "";
	static model = createModel();

	static aDatabaseNames: string[];
	static iDatabaseIndex: number;
	static fnIndexDone1: () => void;

	static aTestExamples: string[];
	static iTestIndex: number; // example index for current database
	static fnExampleDone1: () => void;

	static oCodeGeneratorJs = new CodeGeneratorJs({
		lexer: new BasicLexer({
			bQuiet: true
		}),
		parser: new BasicParser({
			bQuiet: true
		}),
		tron: false,
		rsx: {
			rsxIsAvailable: function (sRsx: string) { // not needed to suppress warnings when using bQuiet
				return (/^a|b|basic|cpm|dir|disc|disc\.in|disc\.out|drive|era|ren|tape|tape\.in|tape\.out|user|mode|renum$/).test(sRsx);
			}
		} as ICpcVmRsx
	})

	static oBasicTokenizer = new BasicTokenizer(); // for loading tokenized examples

	static initDatabases(): string[] {
		const oModel = cpcBasic.model,
			oDatabases: DatabasesType = {},
			aDatabaseDirs = oModel.getProperty<string>("databaseDirs").split(","),
			aDatabaseNames: string[] = [];

		for (let i = 0; i < aDatabaseDirs.length; i += 1) {
			const sDatabaseDir = aDatabaseDirs[i],
				aParts = sDatabaseDir.split("/"),
				sName = aParts[aParts.length - 1];

			oDatabases[sName] = {
				text: sName,
				title: sDatabaseDir,
				src: sDatabaseDir
			};
			aDatabaseNames.push(sName);
		}
		cpcBasic.model.addDatabases(oDatabases);
		return aDatabaseNames;
	}

	private static addIndex2(sDir: string, sInput: string) { // sDir maybe ""
		sInput = sInput.trim();

		const aIndex = JSON.parse(sInput);

		for (let i = 0; i < aIndex.length; i += 1) {
			aIndex[i].dir = sDir;
			cpcBasic.model.setExample(aIndex[i]);
		}
	}

	// Also called from example files xxxxx.js
	private static addItem2(sKey: string, sInput: string) { // sKey maybe ""
		if (!sKey) { // maybe ""
			sKey = cpcBasic.model.getProperty<string>("example");
		}
		sInput = sInput.replace(/^\n/, "").replace(/\n$/, ""); // remove preceding and trailing newlines
		// beware of data files ending with newlines! (do not use trimEnd)

		const oExample = cpcBasic.model.getExample(sKey);

		oExample.key = sKey; // maybe changed
		oExample.script = sInput;
		oExample.loaded = true;
		return sKey;
	}

	static fnHereDoc(fn: () => void) {
		return String(fn).
			replace(/^[^/]+\/\*\S*/, "").
			replace(/\*\/[^/]+$/, "");
	}

	static addIndex(sDir: string, input: string | (() => void)) {
		if (typeof input !== "string") {
			input = this.fnHereDoc(input);
		}
		return this.addIndex2(sDir, input);
	}

	static addItem(sKey: string, input: string | (() => void)) {
		if (typeof input !== "string") {
			input = this.fnHereDoc(input);
		}
		return this.addItem2(sKey, input);
	}
}


// taken from Controller.js
interface FileMeta {
	sType?: string
	iStart?: number
	iLength?: number
	iEntry?: number
	sEncoding?: string
}

interface FileMetaAndData {
	oMeta: FileMeta
	sData: string
}

function splitMeta(sInput: string) {
	const sMetaIdent = "CPCBasic";

	let oMeta: FileMeta | undefined;

	if (sInput.indexOf(sMetaIdent) === 0) { // starts with metaIdent?
		const iIndex = sInput.indexOf(","); // metadata separator

		if (iIndex >= 0) {
			const sMeta = sInput.substr(0, iIndex);

			sInput = sInput.substr(iIndex + 1);

			const aMeta = sMeta.split(";");

			oMeta = {
				sType: aMeta[1],
				iStart: Number(aMeta[2]),
				iLength: Number(aMeta[3]),
				iEntry: Number(aMeta[4]),
				sEncoding: aMeta[5]
			};
		}
	}

	const oMetaAndData: FileMetaAndData = {
		oMeta: oMeta || {},
		sData: sInput
	};

	return oMetaAndData;
}

function asmGena3Convert(sInput: string) {
	throw new Error("asmGena3Convert: not implemented for test: " + sInput);
	return sInput;
}

// taken from Controller.js
function testCheckMeta(sInput: string) {
	const oData = splitMeta(sInput || "");

	sInput = oData.sData; // maybe changed

	if (oData.oMeta.sEncoding === "base64") {
		sInput = Utils.atob(sInput); // decode base64
	}

	const sType = oData.oMeta.sType;

	if (sType === "T") { // tokenized basic?
		sInput = cpcBasic.oBasicTokenizer.decode(sInput);
	} else if (sType === "P") { // protected BASIC?
		sInput = DiskImage.unOrProtectData(sInput); // TODO
		sInput = cpcBasic.oBasicTokenizer.decode(sInput);
	} else if (sType === "B") { // binary?
	} else if (sType === "A") { // ASCII?
		// remove EOF character(s) (0x1a) from the end of file
		sInput = sInput.replace(/\x1a+$/, ""); // eslint-disable-line no-control-regex
	} else if (sType === "G") { // Hisoft Devpac GENA3 Z80 Assember
		sInput = asmGena3Convert(sInput); // TODO
	}
	return sInput;
}

function testParseExample(oExample: ExampleEntry) {
	const oCodeGeneratorJs = cpcBasic.oCodeGeneratorJs,
		sScript = oExample.script || "",
		oVariables = new Variables(),
		sInput = testCheckMeta(sScript);

	let	oOutput: IOutput;

	if (oExample.meta !== "D") { // skip data files
		oOutput = oCodeGeneratorJs.generate(sInput, oVariables, true);
	} else {
		oOutput = {
			text: "UNPARSED DATA FILE: " + oExample.key,
			error: undefined
		};
	}

	if (Utils.debug > 0) {
		Utils.console.debug("testParseExample:", oExample.key, "inputLen:", sInput.length, "outputLen:", oOutput.text.length);
	}

	if (cpcBasic.assert) {
		cpcBasic.assert.ok(!oOutput.error, oExample.key);
	}

	return oOutput;
}

function fnExampleLoaded(oError?: Error, sCode?: string) {
	if (oError) {
		throw oError;
	}
	cpcBasic.fnExampleDone1();

	if (sCode) {
		fnEval(sCode); // load example (for nodeJs)
	}

	const sKey = cpcBasic.model.getProperty<string>("example"),
		oExample = cpcBasic.model.getExample(sKey),
		oOutput = testParseExample(oExample);

	if (!oOutput.error) {
		//if (cpcBasic.iTestIndex < cpcBasic.aTestExamples.length) {
		testNextExample(); // eslint-disable-line no-use-before-define
		//}
	}
}

function fnExampleLoadedUtils(/* sUrl */) {
	return fnExampleLoaded(undefined, "");
}

function fnExampleErrorUtils(sUrl: string) {
	return fnExampleLoaded(new Error("fnExampleErrorUtils: " + sUrl), "");
}

function testLoadExample(oExample: ExampleEntry) {
	const sExample = oExample.key,
		//sUrl = cpcBasic.sRelativeDir + oExample.dir + "/" + sExample + ".js";
		sFileOrUrl = cpcBasic.sDataBaseDirOrUrl + "/" + sExample + ".js";

	if (cpcBasic.assert) {
		cpcBasic.fnExampleDone1 = cpcBasic.assert.async();
	}

	/*
	if (fs) {
		fs.readFile(sUrl, "utf8", fnExampleLoaded);
	*/
	/*
	if (https) {
		nodeReadUrl(sUrl, fnExampleLoaded);
	*/

	if (bNodeJsAvail) {
		if (isUrl(sFileOrUrl)) {
			nodeReadUrl(sFileOrUrl, fnExampleLoaded);
		} else {
			nodeReadFile(sFileOrUrl, fnExampleLoaded);
		}
	} else {
		Utils.loadScript(sFileOrUrl, fnExampleLoadedUtils, fnExampleErrorUtils, sExample);
	}
}

function testNextExample() {
	const aTestExamples = cpcBasic.aTestExamples,
		iTestIndex = cpcBasic.iTestIndex;

	if (iTestIndex < aTestExamples.length) {
		const sKey = aTestExamples[iTestIndex];

		cpcBasic.iTestIndex += 1;
		cpcBasic.model.setProperty("example", sKey);
		const oExample = cpcBasic.model.getExample(sKey);

		testLoadExample(oExample);
	} else { // another database?
		testNextIndex(); // eslint-disable-line no-use-before-define
	}
}


function fnIndexLoaded(oError: Error | undefined, sCode?: string) {
	if (oError) {
		throw oError;
	}
	cpcBasic.fnIndexDone1();

	if (sCode) {
		fnEval(sCode); // load index (for nodeJs)
	}

	const oAllExamples = cpcBasic.model.getAllExamples();

	cpcBasic.aTestExamples = Object.keys(oAllExamples);
	cpcBasic.iTestIndex = 0;

	cpcBasic.iTotalExamples += cpcBasic.aTestExamples.length;
	if (cpcBasic.assert) {
		cpcBasic.assert.expect(cpcBasic.iTotalExamples);
	}

	testNextExample();
}

function fnIndexLoadedUtils(/* sUrl */) {
	return fnIndexLoaded(undefined, "");
}

function fnIndexErrorUtils(sUrl: string) {
	return fnIndexLoaded(new Error("fnIndexErrorUtils: " + sUrl));
}


function testLoadIndex(oExampeDb: DatabaseEntry) {
	let sDir = oExampeDb.src;

	/*
	if (bNodeJsAvail) {
		sDir = "../../../CPCBasic/examples/"; //TTT works only locally, not on server
		sDir = path.resolve(__dirname, sDir); // to get it working also for "npm test" and not only for node ...
	}
	*/

	/*
	if (bNodeJsAvail) {
		if (!isUrl(sDir)) {
			sDir = path.resolve(__dirname, sDir); // convert to absolute path to get it working also for "npm test" and not only for node
		}
	}
	*/

	if (!isUrl(sDir)) {
		sDir = cpcBasic.sBaseDir + sDir;
	}

	if (cpcBasic.assert) {
		cpcBasic.fnIndexDone1 = cpcBasic.assert.async();
	}

	if (bNodeJsAvail) {
		if (!isUrl(sDir)) {
			if (Utils.debug > 0) {
				Utils.console.debug("testParseExamples: __dirname=", __dirname, " sDir=", sDir);
			}
			sDir = nodeGetAbsolutePath(sDir); // convert to absolute path to get it working also for "npm test" and not only for node
		}
	}
	cpcBasic.sDataBaseDirOrUrl = sDir;

	const sFileOrUrl = cpcBasic.sDataBaseDirOrUrl + "/0index.js"; // "./examples/0index.js";

	Utils.console.log("testParseExamples: Using Database index:", sFileOrUrl);
	/*
	if (fs) {
		fs.readFile(sUrl, "utf8", fnIndexLoaded);
	*/
	/*
	if (https) {
		nodeReadUrl(sUrl, fnIndexLoaded);
	*/

	if (bNodeJsAvail) {
		if (isUrl(sDir)) {
			nodeReadUrl(sFileOrUrl, fnIndexLoaded);
		} else {
			nodeReadFile(sFileOrUrl, fnIndexLoaded);
		}
	} else {
		Utils.loadScript(sFileOrUrl, fnIndexLoadedUtils, fnIndexErrorUtils, oExampeDb.text);
	}
}

function testNextIndex() {
	const aDatabaseNames = cpcBasic.aDatabaseNames,
		iDatabaseIndex = cpcBasic.iDatabaseIndex;
	let bNextIndex = false;

	if (iDatabaseIndex < aDatabaseNames.length) {
		const sKey = aDatabaseNames[iDatabaseIndex]; // e.g. "examples";

		if (sKey !== "storage") { // ignore "storage"
			cpcBasic.iDatabaseIndex += 1;
			cpcBasic.model.setProperty("database", sKey);
			const oExampeDb = cpcBasic.model.getDatabase();

			bNextIndex = true;
			testLoadIndex(oExampeDb);
		}
	}

	if (!bNextIndex) {
		Utils.console.log("testParseExamples: Total examples:", cpcBasic.iTotalExamples);
	}
}

function testStart() {
	Utils.console.log("testParseExamples: bNodeJs:", bNodeJsAvail, " Polyfills.iCount=", Polyfills.iCount);

	cpcBasic.iTotalExamples = 0;
	cpcBasic.aDatabaseNames = cpcBasic.initDatabases();
	cpcBasic.iDatabaseIndex = 0;
	testNextIndex();
}

function fnParseArgs(aArgs: string[]) {
	const oSettings: ConfigType = {
		debug: 0
	};
	let i = 0;

	while (i < aArgs.length) {
		const sName = aArgs[i];

		i += 1;
		if (sName in oSettings) {
			oSettings[sName] = parseInt(aArgs[i], 10);
			i += 1;
		}
	}
	return oSettings;
}

/*
if (bNodeJsAvail) {
	//const sNodeRequire = 'fs = require("fs"); path = require("path");';
	const sNodeRequire = 'https = require("https");';

	fnEval(sNodeRequire); // to trick TypeScript
}
*/


declare global {
    interface Window {
		QUnit: unknown
	}

	interface NodeJsProcess {
		argv: string[]
	}
	let process: NodeJsProcess;
}


// https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/node/process.d.ts

if (typeof process !== "undefined") { // nodeJs
	const oSettings = fnParseArgs(process.argv.slice(2));

	if (oSettings.debug) {
		Utils.debug = oSettings.debug as number;
	}
}

if (typeof oGlobalThis.QUnit !== "undefined") {
	Utils.console.log("Using QUnit");
	const QUnit = oGlobalThis.QUnit;

	QUnit.config.testTimeout = 5 * 1000;
	QUnit.module("testParseExamples: Tests", function (/* hooks */) {
		QUnit.test("testParseExamples", function (assert: QUnitAssertType3) {
			cpcBasic.assert = assert;

			/*
			cpcBasic.fnIndexDone1 = assert.async();
			assert.expect(1);
			*/
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
