// test1.js - ...
//

// qunit testParseExamples.qunit.js
// node  testParseExamples.qunit.js
// npm test...


var cpcBasic, fs, path, __dirname;


/*
"use strict";

var Utils, Polyfills, BasicLexer, BasicParser, BasicTokenizer, CodeGeneratorJs, Model, Variables, fs, path, cpcBasic;

if (typeof require !== "undefined") {
	/ * eslint-disable global-require * /
	Utils = require("../Utils.js");
	Polyfills = require("../Polyfills.js"); // for atob()
	BasicLexer = require("../BasicLexer.js");
	BasicParser = require("../BasicParser.js");
	BasicTokenizer = require("../BasicTokenizer.js");
	CodeGeneratorJs = require("../CodeGeneratorJs.js");
	Model = require("../Model.js");
	Variables = require("../Variables.js");
	fs = require("fs");
	path = require("path");
	/ * eslint-enable global-require * /
}
*/

import { Utils } from "../Utils";
import { Polyfills } from "../Polyfills";
import { BasicLexer } from "../BasicLexer";
import { BasicParser } from "../BasicParser";
import { BasicTokenizer } from "../BasicTokenizer";
import { CodeGeneratorJs } from "../CodeGeneratorJs";
import { Model, DatabasesType } from "../Model";
//import { CpcVmRsx } from "../CpcVmRsx";
import { Variables } from "../Variables";
import { DiskImage } from "../DiskImage";
import { cpcconfig } from "../cpcconfig";
//fs = require("fs");
//path = require("path");


//import { QUnit } from "qunit";

function detectNodeJs() {
	let bNodeJs = false;

	// https://www.npmjs.com/package/detect-node
	// Only Node.JS has a process variable that is of [[Class]] process
	try {
		if (Object.prototype.toString.call(globalThis.process) === "[object process]") {
			bNodeJs = true;
		}
	} catch (e) {
		// empty
	}
	return bNodeJs;
}

/*
// TODO
if (detectNodeJs()) {
	import { fs } from "fs";
	import { path } from "path";
}
*/


function createModel() {
	const oStartConfig = {}; //cpcBasic.config;

	Object.assign(oStartConfig, cpcconfig || {}); // merge external config from cpcconfig.js
	const oInitialConfig = Object.assign({}, oStartConfig), // save config
		oModel = new Model(oStartConfig, oInitialConfig);

	return oModel;
}


cpcBasic = {
	sRelativeDir: "../",
	model: createModel(),
	//rsx1: {},
	oCodeGeneratorJs: new CodeGeneratorJs({
		lexer: new BasicLexer({
			bQuiet: true
		}),
		parser: new BasicParser({
			bQuiet: true
		}),
		tron: false,
		rsx: {
			rsxIsAvailable: function (sRsx) { // not needed to suppress warnings when using bQuiet
				return (/^dir|disc|era|tape$/).test(sRsx);
			}
		} as any
	}),
	oBasicTokenizer: new BasicTokenizer(), // for loading tokenized examples

	/*
	initDatabases: function () {
		var oModel = this.model,
			oDatabases = {},
			aDatabaseDirs, i, sDatabaseDir, aParts, sName;

		aDatabaseDirs = oModel.getProperty("databaseDirs").split(",");
		for (i = 0; i < aDatabaseDirs.length; i += 1) {
			sDatabaseDir = aDatabaseDirs[i];
			aParts = sDatabaseDir.split("/");
			sName = aParts[aParts.length - 1];
			oDatabases[sName] = {
				text: sName,
				title: sDatabaseDir,
				src: sDatabaseDir
			};
		}
		this.model.addDatabases(oDatabases);
	},
	*/

	initDatabases() {
		const oModel = this.model as Model, //TTT
			oDatabases: DatabasesType = {},
			aDatabaseDirs = oModel.getProperty<string>("databaseDirs").split(",");

		for (let i = 0; i < aDatabaseDirs.length; i += 1) {
			const sDatabaseDir = aDatabaseDirs[i],
				aParts = sDatabaseDir.split("/"),
				sName = aParts[aParts.length - 1];

			oDatabases[sName] = {
				text: sName,
				title: sDatabaseDir,
				src: sDatabaseDir
			};
		}
		this.model.addDatabases(oDatabases);
	},

	addIndex2: function (sDir, input) { // optional sDir
		var sInput, aIndex, i;

		sInput = input.trim();
		aIndex = JSON.parse(sInput);
		for (i = 0; i < aIndex.length; i += 1) {
			aIndex[i].dir = sDir;
			this.model.setExample(aIndex[i]);
		}
	},

	// Also called from example files xxxxx.js
	addItem2: function (sKey, input) { // optional sKey
		var sInput, oExample;

		sInput = input.replace(/^\n/, ""); // remove preceding newline
		sInput = sInput.replace(/\n$/, ""); // remove trailing newline
		if (!sKey) {
			sKey = this.model.getProperty("example");
		}
		oExample = this.model.getExample(sKey);
		oExample.key = sKey; // maybe changed
		oExample.script = sInput;
		oExample.loaded = true;
		return sKey;
	},

	fnHereDoc: function (fn) {
		return String(fn).
			replace(/^[^/]+\/\*\S*/, "").
			replace(/\*\/[^/]+$/, "");
	},

	addIndex: function (sDir, input) {
		if (typeof input !== "string") {
			input = this.fnHereDoc(input);
		}
		return this.addIndex2(sDir, input);
	},

	addItem: function (sKey, input) {
		if (typeof input !== "string") {
			input = this.fnHereDoc(input);
		}
		return this.addItem2(sKey, input);
	}
};


// taken from Controller.js
function splitMeta(sInput) {
	var sMetaIdent = "CPCBasic",
		oMeta, iIndex, sMeta, aMeta;

	if (sInput.indexOf(sMetaIdent) === 0) { // starts with metaIdent?
		iIndex = sInput.indexOf(","); // metadata separator
		if (iIndex >= 0) {
			sMeta = sInput.substr(0, iIndex);
			sInput = sInput.substr(iIndex + 1);
			aMeta = sMeta.split(";");

			oMeta = {
				sType: aMeta[1],
				iStart: aMeta[2],
				iLength: aMeta[3],
				iEntry: aMeta[4],
				sEncoding: aMeta[5]
			};
		}
	}

	return {
		oMeta: oMeta || {},
		sData: sInput
	};
}

function asmGena3Convert(sInput) {
	throw new Error("asmGena3Convert: not implemented for test: " + sInput);
}

// taken from Controller.js
function testCheckMeta(sInput) {
	var oData = splitMeta(sInput),
		sType;

	sInput = oData.sData; // maybe changed

	if (oData.oMeta.sEncoding === "base64") {
		sInput = Utils.atob(sInput); // decode base64
	}

	sType = oData.oMeta.sType;
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

function testParseExample(oExample) {
	var oCodeGeneratorJs = cpcBasic.oCodeGeneratorJs,
		sScript = oExample.script,
		oVariables = new Variables(),
		sInput, oOutput;

	sInput = testCheckMeta(sScript);
	if (oExample.meta !== "D") { // skip data files
		oCodeGeneratorJs.reset();
		oOutput = oCodeGeneratorJs.generate(sInput, oVariables, true);
	} else {
		oOutput = {
			text: "UNPARSED DATA FILE: " + oExample.key
		};
	}

	if (cpcBasic.assert) {
		cpcBasic.assert.ok(!oOutput.error, oExample.key);
	}

	return oOutput;
}

function fnEval(sCode) {
	return eval(sCode);
}

function fnExampleLoaded(err, sCode) {
	var sKey, oExample, oOutput;

	if (err) {
		throw err;
	}
	cpcBasic.fnExampleDone1();

	fnEval(sCode); // load example

	sKey = cpcBasic.model.getProperty("example");
	oExample = cpcBasic.model.getExample(sKey);
	oOutput = testParseExample(oExample);

	if (!oOutput.error) { //TTT
		if (cpcBasic.iTestIndex < cpcBasic.aTestExamples.length) {
			testNextExample();
		}
	}
}

function fnExampleLoadedUtils(/* sUrl */) {
	return fnExampleLoaded(null, "");
}

function fnExampleErrorUtils(sUrl) {
	return fnExampleLoaded(new Error("fnExampleErrorUtils: " + sUrl), null);
}

function testLoadExample(oExample) {
	var sExample = oExample.key,
		//sUrl = cpcBasic.sRelativeDir + oExample.dir + "/" + sExample + ".js";
		sUrl = cpcBasic.sRelativeDir + "/" + sExample + ".js";

	if (cpcBasic.assert) {
		cpcBasic.fnExampleDone1 = cpcBasic.assert.async();
	}

	if (fs) {
		//sUrl = path.resolve(__dirname, sUrl); // to get it working also for "npm test" and not only for node ...
		fs.readFile(sUrl, "utf8", fnExampleLoaded);
	} else {
		Utils.loadScript(sUrl, fnExampleLoadedUtils, fnExampleErrorUtils);
	}
}

function testNextExample() {
	var aTestExamples = cpcBasic.aTestExamples,
		iTestIndex = cpcBasic.iTestIndex,
		sKey, oExample;

	if (iTestIndex < aTestExamples.length) {
		sKey = aTestExamples[iTestIndex];
		cpcBasic.iTestIndex += 1;
		cpcBasic.model.setProperty("example", sKey);
		oExample = cpcBasic.model.getExample(sKey);
		testLoadExample(oExample);
	}
}


function fnIndexLoaded(err, sCode) {
	var oAllExamples;

	cpcBasic.fnIndexDone1();
	if (err) {
		throw err;
	}

	fnEval(sCode); // load index

	oAllExamples = cpcBasic.model.getAllExamples();

	cpcBasic.aTestExamples = Object.keys(oAllExamples);
	cpcBasic.iTestIndex = 0;

	if (cpcBasic.assert) {
		cpcBasic.assert.expect(cpcBasic.aTestExamples.length);
	}

	testNextExample();
}

function fnIndexLoadedUtils(/* sUrl */) {
	return fnIndexLoaded(null, "");
}

function fnIndexErrorUtils(sUrl) {
	return fnIndexLoaded(new Error("fnIndexErrorUtils: " + sUrl), null);
}


function testLoadIndex() {
	const bNodeJs = detectNodeJs();

	Utils.console.log("bNodeJs:", bNodeJs, " Polyfills.iCount=", Polyfills.iCount);

	//cpcBasic.model.setProperty("databaseDirs", "examples");
	cpcBasic.initDatabases();

	cpcBasic.model.setProperty("database", "examples");
	const oExampeDb = cpcBasic.model.getDatabase();
	let	sDir = oExampeDb.src;

	if (bNodeJs) {
		sDir = "../../../CPCBasic/examples/"; //TTT
		sDir = path.resolve(__dirname, sDir); // to get it working also for "npm test" and not only for node ...
	}

	cpcBasic.sRelativeDir = sDir;

	const sUrl = cpcBasic.sRelativeDir + "/0index.js"; // "./examples/0index.js";

	if (fs) {
		//sUrl = path.resolve(__dirname, sUrl); // to get it working also for "npm test" and not only for node ...
		fs.readFile(sUrl, "utf8", fnIndexLoaded);
	} else {
		Utils.loadScript(sUrl, fnIndexLoadedUtils, fnIndexErrorUtils);
	}
}


if (detectNodeJs()) {
	const sNodeRequire = 'fs = require("fs"); path = require("path");';

	eval(sNodeRequire); // to trick typescript
}


declare global {
    interface Window {
		QUnit: any
	}
}

if (typeof globalThis.QUnit !== "undefined") {
	Utils.console.log("Using QUnit");
	const QUnit = globalThis.QUnit;

	QUnit.config.testTimeout = 5 * 1000;
	QUnit.module("testParseExamples: Tests", function (/* hooks */) {
		QUnit.test("testParseExamples", function (assert) {
			cpcBasic.assert = assert;

			cpcBasic.fnIndexDone1 = assert.async();
			assert.expect(1);
			testLoadIndex();
		});
	});
} else {
	cpcBasic.fnIndexDone1 = function () {
		// empty
	};
	cpcBasic.fnExampleDone1 = function () {
		// empty
	};

	testLoadIndex();
}

// end
