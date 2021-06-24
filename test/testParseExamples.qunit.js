"use strict";
// testParseExamples.qunit.ts - Test to load and parse all examples
//
Object.defineProperty(exports, "__esModule", { value: true });
var https, // nodeJs
fs, path, __dirname; // eslint-disable-line no-underscore-dangle
var Utils_1 = require("../Utils");
var Polyfills_1 = require("../Polyfills");
var BasicLexer_1 = require("../BasicLexer");
var BasicParser_1 = require("../BasicParser");
var BasicTokenizer_1 = require("../BasicTokenizer");
var CodeGeneratorJs_1 = require("../CodeGeneratorJs");
var Model_1 = require("../Model");
var Variables_1 = require("../Variables");
var DiskImage_1 = require("../DiskImage");
var cpcconfig_1 = require("../cpcconfig");
// eslint-disable-next-line no-new-func
var oGlobalThis = (typeof globalThis !== "undefined") ? globalThis : Function("return this")(), // for old IE
bNodeJsAvail = (function () {
    var bNodeJs = false;
    // https://www.npmjs.com/package/detect-node
    // Only Node.JS has a process variable that is of [[Class]] process
    try {
        if (Object.prototype.toString.call(oGlobalThis.process) === "[object process]") {
            bNodeJs = true;
        }
    }
    catch (e) {
        // empty
    }
    return bNodeJs;
}());
function isUrl(s) {
    return s.startsWith("http"); // http or https
}
function fnEval(sCode) {
    return eval(sCode); // eslint-disable-line no-eval
}
function nodeReadUrl(sUrl, fnDataLoaded) {
    if (!https) {
        fnEval('https = require("https");'); // to trick TypeScript
    }
    https.get(sUrl, function (resp) {
        var sData = "";
        // A chunk of data has been received.
        resp.on("data", function (sChunk) {
            sData += sChunk;
        });
        // The whole response has been received. Print out the result.
        resp.on("end", function () {
            fnDataLoaded(undefined, sData);
        });
    }).on("error", function (err) {
        Utils_1.Utils.console.log("Error: " + err.message);
        fnDataLoaded(err);
    });
}
function nodeReadFile(sName, fnDataLoaded) {
    if (!fs) {
        fnEval('fs = require("fs");'); // to trick TypeScript
    }
    fs.readFile(sName, "utf8", fnDataLoaded);
}
function nodeGetAbsolutePath(sName) {
    if (!path) {
        fnEval('path = require("path");'); // to trick TypeScript
    }
    var sAbsolutePath = path.resolve(__dirname, sName);
    return sAbsolutePath;
}
function createModel() {
    var oStartConfig = {};
    Object.assign(oStartConfig, cpcconfig_1.cpcconfig || {}); // merge external config from cpcconfig.js
    var oInitialConfig = Object.assign({}, oStartConfig), // save config
    oModel = new Model_1.Model(oStartConfig, oInitialConfig);
    return oModel;
}
var cpcBasic = /** @class */ (function () {
    function cpcBasic() {
    }
    cpcBasic.initDatabases = function () {
        var oModel = cpcBasic.model, oDatabases = {}, aDatabaseDirs = oModel.getProperty("databaseDirs").split(","), aDatabaseNames = [];
        for (var i = 0; i < aDatabaseDirs.length; i += 1) {
            var sDatabaseDir = aDatabaseDirs[i], aParts = sDatabaseDir.split("/"), sName = aParts[aParts.length - 1];
            oDatabases[sName] = {
                text: sName,
                title: sDatabaseDir,
                src: sDatabaseDir
            };
            aDatabaseNames.push(sName);
        }
        cpcBasic.model.addDatabases(oDatabases);
        return aDatabaseNames;
    };
    cpcBasic.addIndex2 = function (sDir, sInput) {
        sInput = sInput.trim();
        var aIndex = JSON.parse(sInput);
        for (var i = 0; i < aIndex.length; i += 1) {
            aIndex[i].dir = sDir;
            cpcBasic.model.setExample(aIndex[i]);
        }
    };
    // Also called from example files xxxxx.js
    cpcBasic.addItem2 = function (sKey, sInput) {
        if (!sKey) { // maybe ""
            sKey = cpcBasic.model.getProperty("example");
        }
        sInput = sInput.replace(/^\n/, "").replace(/\n$/, ""); // remove preceding and trailing newlines
        // beware of data files ending with newlines! (do not use trimEnd)
        var oExample = cpcBasic.model.getExample(sKey);
        oExample.key = sKey; // maybe changed
        oExample.script = sInput;
        oExample.loaded = true;
        return sKey;
    };
    cpcBasic.fnHereDoc = function (fn) {
        return String(fn).
            replace(/^[^/]+\/\*\S*/, "").
            replace(/\*\/[^/]+$/, "");
    };
    cpcBasic.addIndex = function (sDir, input) {
        if (typeof input !== "string") {
            input = this.fnHereDoc(input);
        }
        return this.addIndex2(sDir, input);
    };
    cpcBasic.addItem = function (sKey, input) {
        if (typeof input !== "string") {
            input = this.fnHereDoc(input);
        }
        return this.addItem2(sKey, input);
    };
    cpcBasic.sBaseDir = "../"; // base test directory (relative to dist)
    cpcBasic.sDataBaseDirOrUrl = "";
    cpcBasic.model = createModel();
    cpcBasic.oCodeGeneratorJs = new CodeGeneratorJs_1.CodeGeneratorJs({
        lexer: new BasicLexer_1.BasicLexer({
            bQuiet: true
        }),
        parser: new BasicParser_1.BasicParser({
            bQuiet: true
        }),
        tron: false,
        rsx: {
            rsxIsAvailable: function (sRsx) {
                return (/^a|b|basic|cpm|dir|disc|disc\.in|disc\.out|drive|era|ren|tape|tape\.in|tape\.out|user|mode|renum$/).test(sRsx);
            }
        }
    });
    cpcBasic.oBasicTokenizer = new BasicTokenizer_1.BasicTokenizer(); // for loading tokenized examples
    return cpcBasic;
}());
function splitMeta(sInput) {
    var sMetaIdent = "CPCBasic";
    var oMeta;
    if (sInput.indexOf(sMetaIdent) === 0) { // starts with metaIdent?
        var iIndex = sInput.indexOf(","); // metadata separator
        if (iIndex >= 0) {
            var sMeta = sInput.substr(0, iIndex);
            sInput = sInput.substr(iIndex + 1);
            var aMeta = sMeta.split(";");
            oMeta = {
                sType: aMeta[1],
                iStart: Number(aMeta[2]),
                iLength: Number(aMeta[3]),
                iEntry: Number(aMeta[4]),
                sEncoding: aMeta[5]
            };
        }
    }
    var oMetaAndData = {
        oMeta: oMeta || {},
        sData: sInput
    };
    return oMetaAndData;
}
function asmGena3Convert(sInput) {
    throw new Error("asmGena3Convert: not implemented for test: " + sInput);
    return sInput;
}
// taken from Controller.js
function testCheckMeta(sInput) {
    var oData = splitMeta(sInput || "");
    sInput = oData.sData; // maybe changed
    if (oData.oMeta.sEncoding === "base64") {
        sInput = Utils_1.Utils.atob(sInput); // decode base64
    }
    var sType = oData.oMeta.sType;
    if (sType === "T") { // tokenized basic?
        sInput = cpcBasic.oBasicTokenizer.decode(sInput);
    }
    else if (sType === "P") { // protected BASIC?
        sInput = DiskImage_1.DiskImage.unOrProtectData(sInput); // TODO
        sInput = cpcBasic.oBasicTokenizer.decode(sInput);
    }
    else if (sType === "B") { // binary?
    }
    else if (sType === "A") { // ASCII?
        // remove EOF character(s) (0x1a) from the end of file
        sInput = sInput.replace(/\x1a+$/, ""); // eslint-disable-line no-control-regex
    }
    else if (sType === "G") { // Hisoft Devpac GENA3 Z80 Assember
        sInput = asmGena3Convert(sInput); // TODO
    }
    return sInput;
}
function testParseExample(oExample) {
    var oCodeGeneratorJs = cpcBasic.oCodeGeneratorJs, sScript = oExample.script || "", oVariables = new Variables_1.Variables(), sInput = testCheckMeta(sScript);
    var oOutput;
    if (oExample.meta !== "D") { // skip data files
        oOutput = oCodeGeneratorJs.generate(sInput, oVariables, true);
    }
    else {
        oOutput = {
            text: "UNPARSED DATA FILE: " + oExample.key,
            error: undefined
        };
    }
    if (Utils_1.Utils.debug > 0) {
        Utils_1.Utils.console.debug("testParseExample:", oExample.key, "inputLen:", sInput.length, "outputLen:", oOutput.text.length);
    }
    if (cpcBasic.assert) {
        cpcBasic.assert.ok(!oOutput.error, oExample.key);
    }
    return oOutput;
}
function fnExampleLoaded(oError, sCode) {
    if (oError) {
        throw oError;
    }
    cpcBasic.fnExampleDone1();
    if (sCode) {
        fnEval(sCode); // load example (for nodeJs)
    }
    var sKey = cpcBasic.model.getProperty("example"), oExample = cpcBasic.model.getExample(sKey), oOutput = testParseExample(oExample);
    if (!oOutput.error) {
        //if (cpcBasic.iTestIndex < cpcBasic.aTestExamples.length) {
        testNextExample(); // eslint-disable-line no-use-before-define
        //}
    }
}
function fnExampleLoadedUtils( /* sUrl */) {
    return fnExampleLoaded(undefined, "");
}
function fnExampleErrorUtils(sUrl) {
    return fnExampleLoaded(new Error("fnExampleErrorUtils: " + sUrl), "");
}
function testLoadExample(oExample) {
    var sExample = oExample.key, 
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
        }
        else {
            nodeReadFile(sFileOrUrl, fnExampleLoaded);
        }
    }
    else {
        Utils_1.Utils.loadScript(sFileOrUrl, fnExampleLoadedUtils, fnExampleErrorUtils, sExample);
    }
}
function testNextExample() {
    var aTestExamples = cpcBasic.aTestExamples, iTestIndex = cpcBasic.iTestIndex;
    if (iTestIndex < aTestExamples.length) {
        var sKey = aTestExamples[iTestIndex];
        cpcBasic.iTestIndex += 1;
        cpcBasic.model.setProperty("example", sKey);
        var oExample = cpcBasic.model.getExample(sKey);
        testLoadExample(oExample);
    }
    else { // another database?
        testNextIndex(); // eslint-disable-line no-use-before-define
    }
}
function fnIndexLoaded(oError, sCode) {
    if (oError) {
        throw oError;
    }
    cpcBasic.fnIndexDone1();
    if (sCode) {
        fnEval(sCode); // load index (for nodeJs)
    }
    var oAllExamples = cpcBasic.model.getAllExamples();
    cpcBasic.aTestExamples = Object.keys(oAllExamples);
    cpcBasic.iTestIndex = 0;
    cpcBasic.iTotalExamples += cpcBasic.aTestExamples.length;
    if (cpcBasic.assert) {
        cpcBasic.assert.expect(cpcBasic.iTotalExamples);
    }
    testNextExample();
}
function fnIndexLoadedUtils( /* sUrl */) {
    return fnIndexLoaded(undefined, "");
}
function fnIndexErrorUtils(sUrl) {
    return fnIndexLoaded(new Error("fnIndexErrorUtils: " + sUrl));
}
function testLoadIndex(oExampeDb) {
    var sDir = oExampeDb.src;
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
            if (Utils_1.Utils.debug > 0) {
                Utils_1.Utils.console.debug("testParseExamples: __dirname=", __dirname, " sDir=", sDir);
            }
            sDir = nodeGetAbsolutePath(sDir); // convert to absolute path to get it working also for "npm test" and not only for node
        }
    }
    cpcBasic.sDataBaseDirOrUrl = sDir;
    var sFileOrUrl = cpcBasic.sDataBaseDirOrUrl + "/0index.js"; // "./examples/0index.js";
    Utils_1.Utils.console.log("testParseExamples: Using Database index:", sFileOrUrl);
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
        }
        else {
            nodeReadFile(sFileOrUrl, fnIndexLoaded);
        }
    }
    else {
        Utils_1.Utils.loadScript(sFileOrUrl, fnIndexLoadedUtils, fnIndexErrorUtils, oExampeDb.text);
    }
}
function testNextIndex() {
    var aDatabaseNames = cpcBasic.aDatabaseNames, iDatabaseIndex = cpcBasic.iDatabaseIndex;
    var bNextIndex = false;
    if (iDatabaseIndex < aDatabaseNames.length) {
        var sKey = aDatabaseNames[iDatabaseIndex]; // e.g. "examples";
        if (sKey !== "storage") { // ignore "storage"
            cpcBasic.iDatabaseIndex += 1;
            cpcBasic.model.setProperty("database", sKey);
            var oExampeDb = cpcBasic.model.getDatabase();
            bNextIndex = true;
            testLoadIndex(oExampeDb);
        }
    }
    if (!bNextIndex) {
        Utils_1.Utils.console.log("testParseExamples: Total examples:", cpcBasic.iTotalExamples);
    }
}
function testStart() {
    Utils_1.Utils.console.log("testParseExamples: bNodeJs:", bNodeJsAvail, " Polyfills.iCount=", Polyfills_1.Polyfills.iCount);
    cpcBasic.iTotalExamples = 0;
    cpcBasic.aDatabaseNames = cpcBasic.initDatabases();
    cpcBasic.iDatabaseIndex = 0;
    testNextIndex();
}
function fnParseArgs(aArgs) {
    var oSettings = {
        debug: 0
    };
    var i = 0;
    while (i < aArgs.length) {
        var sName = aArgs[i];
        i += 1;
        if (sName in oSettings) {
            oSettings[sName] = parseInt(aArgs[i], 10);
            i += 1;
        }
    }
    return oSettings;
}
// https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/node/process.d.ts
if (typeof process !== "undefined") { // nodeJs
    var oSettings = fnParseArgs(process.argv.slice(2));
    if (oSettings.debug) {
        Utils_1.Utils.debug = oSettings.debug;
    }
}
if (typeof oGlobalThis.QUnit !== "undefined") {
    Utils_1.Utils.console.log("Using QUnit");
    var QUnit_1 = oGlobalThis.QUnit;
    QUnit_1.config.testTimeout = 5 * 1000;
    QUnit_1.module("testParseExamples: Tests", function ( /* hooks */) {
        QUnit_1.test("testParseExamples", function (assert) {
            cpcBasic.assert = assert;
            /*
            cpcBasic.fnIndexDone1 = assert.async();
            assert.expect(1);
            */
            testStart();
        });
    });
}
else {
    cpcBasic.fnIndexDone1 = function () {
        // empty
    };
    cpcBasic.fnExampleDone1 = function () {
        // empty
    };
    testStart();
}
// end
//# sourceMappingURL=testParseExamples.qunit.js.map