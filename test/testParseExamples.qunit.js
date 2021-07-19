"use strict";
// testParseExamples.qunit.ts - Test to load and parse all examples
//
// Examples:
// qunit dist/test/testParseExamples.qunit.js
// qunit dist/test/testParseExamples.qunit.js debug=1
//
// node dist/test/testParseExamples.qunit.js
// npm test...
Object.defineProperty(exports, "__esModule", { value: true });
var https, // nodeJs
fs, path, __dirname; // eslint-disable-line no-underscore-dangle
var Utils_1 = require("../Utils");
var Polyfills_1 = require("../Polyfills");
var BasicLexer_1 = require("../BasicLexer");
var BasicParser_1 = require("../BasicParser");
var BasicTokenizer_1 = require("../BasicTokenizer");
var CodeGeneratorJs_1 = require("../CodeGeneratorJs");
var CodeGeneratorToken_1 = require("../CodeGeneratorToken");
var Model_1 = require("../Model");
var Variables_1 = require("../Variables");
var DiskImage_1 = require("../DiskImage");
var cpcconfig_1 = require("../cpcconfig");
var TestHelper_1 = require("./TestHelper");
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
    var oModel = new Model_1.Model(oStartConfig);
    return oModel;
}
var cpcBasic = /** @class */ (function () {
    function cpcBasic() {
    }
    cpcBasic.initVmMock1 = function () {
        var oVmMock = cpcBasic.oVmMock, mKeywords = BasicParser_1.BasicParser.mKeywords;
        var _loop_1 = function (sKey) {
            if (mKeywords.hasOwnProperty(sKey)) {
                if (!oVmMock[sKey]) {
                    oVmMock[sKey] = function () {
                        return sKey;
                    };
                }
            }
        };
        for (var sKey in mKeywords) {
            _loop_1(sKey);
        }
        var oRsx = oVmMock.rsx, sRsxKeys = "a|b|basic|cpm|dir|disc|disc.in|disc.out|drive|era|ren|tape|tape.in|tape.out|user|mode|renum", aRsxKeys = sRsxKeys.split("|");
        var _loop_2 = function (i) {
            var sKey = aRsxKeys[i];
            if (!oRsx[sKey]) {
                oRsx[sKey] = function () {
                    return sKey;
                };
            }
        };
        for (var i = 0; i < aRsxKeys.length; i += 1) {
            _loop_2(i);
        }
    };
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
    cpcBasic.oRsx = {
        rsxIsAvailable: function (sRsx) {
            return (/^a|b|basic|cpm|dir|disc|disc\.in|disc\.out|drive|era|ren|tape|tape\.in|tape\.out|user|mode|renum$/).test(sRsx);
        }
        // will be programmatically extended by methods...
    };
    cpcBasic.oLexer = new BasicLexer_1.BasicLexer({
        bQuiet: true,
        bKeepWhiteSpace: true
    });
    cpcBasic.oParser = new BasicParser_1.BasicParser({
        bQuiet: true
    });
    cpcBasic.oConvertParser = new BasicParser_1.BasicParser({
        bQuiet: true,
        bKeepBrackets: true,
        bKeepColons: true,
        bKeepDataComma: true
    });
    cpcBasic.oCodeGeneratorJs = new CodeGeneratorJs_1.CodeGeneratorJs({
        lexer: cpcBasic.oLexer,
        parser: cpcBasic.oParser,
        tron: false,
        rsx: cpcBasic.oRsx
    });
    cpcBasic.oCodeGeneratorToken = new CodeGeneratorToken_1.CodeGeneratorToken({
        lexer: cpcBasic.oLexer,
        parser: cpcBasic.oConvertParser
    });
    cpcBasic.oVmMock = {
        rsx: cpcBasic.oRsx,
        iLine: "",
        oTestVariables1: new Variables_1.Variables(),
        iTestStepCounter1: 0,
        iMaxSteps: 10,
        initTest1: function () {
            cpcBasic.oVmMock.iTestStepCounter1 = cpcBasic.oVmMock.iMaxSteps;
            cpcBasic.oVmMock.iLine = 0; // or "start";
            cpcBasic.oVmMock.oTestVariables1.initAllVariables();
        },
        vmGetAllVariables: function () {
            return cpcBasic.oVmMock.oTestVariables1.getAllVariables();
        },
        vmLoopCondition: function () {
            cpcBasic.oVmMock.iTestStepCounter1 -= 1;
            return cpcBasic.oVmMock.iTestStepCounter1 > 0;
        },
        vmRound: function (n) {
            return (n >= 0) ? (n + 0.5) | 0 : (n - 0.5) | 0; // eslint-disable-line no-bitwise
        },
        vmAssign: function () {
            return 0;
        },
        vmAssertNumberType: function () {
            // empty
        },
        dim: function (sVarName) {
            var aDimensions = [];
            for (var i = 1; i < arguments.length; i += 1) {
                var iSize = this.vmRound(arguments[i]) + 1; // for basic we have sizes +1
                aDimensions.push(iSize);
            }
            cpcBasic.oVmMock.oTestVariables1.dimVariable(sVarName, aDimensions);
        },
        vmGetNextInput: function () {
            return 0;
        },
        vmStop: function (sReason) {
            if (sReason === "end") {
                cpcBasic.oVmMock.iTestStepCounter1 = 0;
            }
        },
        "goto": function (line) {
            cpcBasic.oVmMock.iLine = line;
        },
        gosub: function (retLabel /* , line: string | number */) {
            cpcBasic.oVmMock.iLine = retLabel; // we could use retLabel or line
        }
        // will be programmatically extended by methods...
    };
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
    var oCodeGeneratorJs = cpcBasic.oCodeGeneratorJs, oCodeGeneratorToken = cpcBasic.oCodeGeneratorToken, oBasicTokenizer = cpcBasic.oBasicTokenizer, sScript = oExample.script || "", sInput = testCheckMeta(sScript);
    var sChecks = "", oOutput, fnScript; // eslint-disable-line @typescript-eslint/ban-types
    if (oExample.meta !== "D") { // skip data files
        sChecks = "Js";
        var oVariables = cpcBasic.oVmMock.oTestVariables1;
        // test lexer, parser and JS code generator
        oVariables.removeAllVariables();
        oOutput = oCodeGeneratorJs.generate(sInput, oVariables);
        if (!oOutput.error) {
            var sJsScript = oOutput.text;
            try {
                // test generate function
                sChecks += ",Fn";
                fnScript = new Function("o", sJsScript); // eslint-disable-line no-new-func
                // test execute function (running script for fixed number of steps)
                sChecks += ",exec";
                cpcBasic.oVmMock.initTest1();
                fnScript(cpcBasic.oVmMock);
                sChecks += "(line " + cpcBasic.oVmMock.iLine + ")";
                // test tokenizer
                sChecks += ",token";
                var oTokens = oCodeGeneratorToken.generate(sInput);
                sChecks += "(" + oTokens.text.length + ")";
                // test de-tokenizer
                sChecks += ",deToken";
                var sDecoded = oBasicTokenizer.decode(oTokens.text);
                sChecks += "(" + sDecoded.length + ")";
                sChecks += ",Js2";
                oVariables.removeAllVariables();
                var oOutput2 = oCodeGeneratorJs.generate(sDecoded, oVariables);
                sChecks += ",Fn2";
                fnScript = new Function("o", oOutput2.text); // eslint-disable-line no-new-func
                // test execute function (running script for fixed number of steps)
                sChecks += ",exec2";
                cpcBasic.oVmMock.initTest1();
                fnScript(cpcBasic.oVmMock);
                sChecks += "(line " + cpcBasic.oVmMock.iLine + ")";
            }
            catch (e) {
                oOutput.error = e;
                Utils_1.Utils.console.error(e);
            }
        }
    }
    else {
        sChecks = "ignored";
        oOutput = {
            text: "UNPARSED DATA FILE: " + oExample.key,
            error: undefined
        };
    }
    if (Utils_1.Utils.debug > 0) {
        Utils_1.Utils.console.debug("testParseExample:", oExample.key, "inputLen:", sInput.length, "outputLen:", oOutput.text.length);
    }
    if (cpcBasic.assert) {
        cpcBasic.assert.ok(!oOutput.error, oExample.key + ": " + sChecks);
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
        testNextExample(); // eslint-disable-line no-use-before-define
    }
}
function fnExampleLoadedUtils( /* sUrl */) {
    return fnExampleLoaded(undefined, "");
}
function fnExampleErrorUtils(sUrl) {
    return fnExampleLoaded(new Error("fnExampleErrorUtils: " + sUrl), "");
}
function testLoadExample(oExample) {
    var sExample = oExample.key, sFileOrUrl = cpcBasic.sDataBaseDirOrUrl + "/" + sExample + ".js";
    if (cpcBasic.assert) {
        cpcBasic.fnExampleDone1 = cpcBasic.assert.async();
    }
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
    cpcBasic.initVmMock1();
    cpcBasic.iTotalExamples = 0;
    cpcBasic.aDatabaseNames = cpcBasic.initDatabases();
    cpcBasic.iDatabaseIndex = 0;
    testNextIndex();
}
/*
// https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/node/process.d.ts
// can be used for nodeJS
function fnParseArgs(aArgs: string[], oConfig: ConfigType) {
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

function fnParseUri(sUrlQuery: string, oConfig: ConfigType) {
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
    fnParseArgs(aArgs, oConfig);
}

declare global {
    interface Window {
        QUnit: unknown
    }

    interface NodeJsProcess {
        argv: string[]
    }
    let process: NodeJsProcess;
}


const oConfig: ConfigType = {
    debug: 0
};

// https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/node/process.d.ts
if (typeof process !== "undefined") { // nodeJs
    fnParseArgs(process.argv.slice(2), oConfig);
} else { // browser
    fnParseUri(window.location.search.substring(1), oConfig);
}

if (oConfig.debug) {
    Utils.debug = oConfig.debug as number;
    Utils.console.log("testParseExamples: Debug level:", oConfig.debug);
}
*/
TestHelper_1.TestHelper.init();
if (typeof oGlobalThis.QUnit !== "undefined") {
    Utils_1.Utils.console.log("Using QUnit");
    var QUnit_1 = oGlobalThis.QUnit;
    QUnit_1.config.testTimeout = 5 * 1000;
    QUnit_1.module("testParseExamples: Tests", function ( /* hooks */) {
        QUnit_1.test("testParseExamples", function (assert) {
            cpcBasic.assert = assert;
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