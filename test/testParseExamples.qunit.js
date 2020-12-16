"use strict";
// testParseExamples.qunit.ts - Test to load and parse all examples
//
Object.defineProperty(exports, "__esModule", { value: true });
// qunit testParseExamples.qunit.js
// node  testParseExamples.qunit.js
// npm test...
var fs, path, __dirname;
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
function detectNodeJs() {
    var bNodeJs = false;
    // https://www.npmjs.com/package/detect-node
    // Only Node.JS has a process variable that is of [[Class]] process
    try {
        if (Object.prototype.toString.call(globalThis.process) === "[object process]") {
            bNodeJs = true;
        }
    }
    catch (e) {
        // empty
    }
    return bNodeJs;
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
        var oModel = cpcBasic.model, oDatabases = {}, aDatabaseDirs = oModel.getProperty("databaseDirs").split(",");
        for (var i = 0; i < aDatabaseDirs.length; i += 1) {
            var sDatabaseDir = aDatabaseDirs[i], aParts = sDatabaseDir.split("/"), sName = aParts[aParts.length - 1];
            oDatabases[sName] = {
                text: sName,
                title: sDatabaseDir,
                src: sDatabaseDir
            };
        }
        cpcBasic.model.addDatabases(oDatabases);
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
    cpcBasic.sRelativeDir = "../";
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
                return (/^dir|disc|era|tape$/).test(sRsx);
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
    else {
        oMeta = {};
    }
    var oMetaAndData = {
        oMeta: oMeta,
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
    var oData = splitMeta(sInput);
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
    var oCodeGeneratorJs = cpcBasic.oCodeGeneratorJs, sScript = oExample.script, oVariables = new Variables_1.Variables(), sInput = testCheckMeta(sScript);
    var oOutput;
    if (oExample.meta !== "D") { // skip data files
        oCodeGeneratorJs.reset();
        oOutput = oCodeGeneratorJs.generate(sInput, oVariables, true);
    }
    else {
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
    if (err) {
        throw err;
    }
    cpcBasic.fnExampleDone1();
    fnEval(sCode); // load example
    var sKey = cpcBasic.model.getProperty("example"), oExample = cpcBasic.model.getExample(sKey), oOutput = testParseExample(oExample);
    if (!oOutput.error) {
        if (cpcBasic.iTestIndex < cpcBasic.aTestExamples.length) {
            testNextExample();
        }
    }
}
function fnExampleLoadedUtils( /* sUrl */) {
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
        fs.readFile(sUrl, "utf8", fnExampleLoaded);
    }
    else {
        Utils_1.Utils.loadScript(sUrl, fnExampleLoadedUtils, fnExampleErrorUtils);
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
}
function fnIndexLoaded(err, sCode) {
    cpcBasic.fnIndexDone1();
    if (err) {
        throw err;
    }
    fnEval(sCode); // load index
    var oAllExamples = cpcBasic.model.getAllExamples();
    cpcBasic.aTestExamples = Object.keys(oAllExamples);
    cpcBasic.iTestIndex = 0;
    if (cpcBasic.assert) {
        cpcBasic.assert.expect(cpcBasic.aTestExamples.length);
    }
    testNextExample();
}
function fnIndexLoadedUtils( /* sUrl */) {
    return fnIndexLoaded(null, "");
}
function fnIndexErrorUtils(sUrl) {
    return fnIndexLoaded(new Error("fnIndexErrorUtils: " + sUrl), null);
}
function testLoadIndex() {
    var bNodeJs = detectNodeJs();
    Utils_1.Utils.console.log("bNodeJs:", bNodeJs, " Polyfills.iCount=", Polyfills_1.Polyfills.iCount);
    cpcBasic.initDatabases();
    cpcBasic.model.setProperty("database", "examples");
    var oExampeDb = cpcBasic.model.getDatabase();
    var sDir = oExampeDb.src;
    if (bNodeJs) {
        sDir = "../../../CPCBasic/examples/"; //TTT
        sDir = path.resolve(__dirname, sDir); // to get it working also for "npm test" and not only for node ...
    }
    cpcBasic.sRelativeDir = sDir;
    var sUrl = cpcBasic.sRelativeDir + "/0index.js"; // "./examples/0index.js";
    if (fs) {
        //sUrl = path.resolve(__dirname, sUrl); // to get it working also for "npm test" and not only for node ...
        fs.readFile(sUrl, "utf8", fnIndexLoaded);
    }
    else {
        Utils_1.Utils.loadScript(sUrl, fnIndexLoadedUtils, fnIndexErrorUtils);
    }
}
if (detectNodeJs()) {
    var sNodeRequire = 'fs = require("fs"); path = require("path");';
    eval(sNodeRequire); // to trick typescript
}
if (typeof globalThis.QUnit !== "undefined") {
    Utils_1.Utils.console.log("Using QUnit");
    var QUnit_1 = globalThis.QUnit;
    QUnit_1.config.testTimeout = 5 * 1000;
    QUnit_1.module("testParseExamples: Tests", function ( /* hooks */) {
        QUnit_1.test("testParseExamples", function (assert) {
            cpcBasic.assert = assert;
            cpcBasic.fnIndexDone1 = assert.async();
            assert.expect(1);
            testLoadIndex();
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
    testLoadIndex();
}
// end
//# sourceMappingURL=testParseExamples.qunit.js.map