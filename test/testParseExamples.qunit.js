// testParseExamples.qunit.ts - Test to load and parse all examples
//
// Examples:
// qunit dist/test/testParseExamples.qunit.js
// qunit dist/test/testParseExamples.qunit.js debug=1
//
// node dist/test/testParseExamples.qunit.js
// npm test...
define(["require", "exports", "../Utils", "../BasicLexer", "../BasicParser", "../BasicTokenizer", "../CodeGeneratorJs", "../CodeGeneratorToken", "../Model", "../Variables", "../DiskImage", "../cpcconfig", "./TestHelper"], function (require, exports, Utils_1, BasicLexer_1, BasicParser_1, BasicTokenizer_1, CodeGeneratorJs_1, CodeGeneratorToken_1, Model_1, Variables_1, DiskImage_1, cpcconfig_1, TestHelper_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var https, // nodeJs
    fs, path, __dirname; // eslint-disable-line no-underscore-dangle
    // eslint-disable-next-line no-new-func
    var myGlobalThis = (typeof globalThis !== "undefined") ? globalThis : Function("return this")(), // for old IE
    nodeJsAvail = (function () {
        var nodeJs = false;
        // https://www.npmjs.com/package/detect-node
        // Only Node.JS has a process variable that is of [[Class]] process
        try {
            if (Object.prototype.toString.call(myGlobalThis.process) === "[object process]") {
                nodeJs = true;
            }
        }
        catch (e) {
            // empty
        }
        return nodeJs;
    }());
    function isUrl(s) {
        return s.startsWith("http"); // http or https
    }
    function fnEval(code) {
        return eval(code); // eslint-disable-line no-eval
    }
    function nodeReadUrl(url, fnDataLoaded) {
        if (!https) {
            fnEval('https = require("https");'); // to trick TypeScript
        }
        https.get(url, function (resp) {
            var data = "";
            // A chunk of data has been received.
            resp.on("data", function (chunk) {
                data += chunk;
            });
            // The whole response has been received. Print out the result.
            resp.on("end", function () {
                fnDataLoaded(undefined, data);
            });
        }).on("error", function (err) {
            Utils_1.Utils.console.log("Error: " + err.message);
            fnDataLoaded(err);
        });
    }
    function nodeReadFile(name, fnDataLoaded) {
        if (!fs) {
            fnEval('fs = require("fs");'); // to trick TypeScript
        }
        fs.readFile(name, "utf8", fnDataLoaded);
    }
    function nodeGetAbsolutePath(name) {
        if (!path) {
            // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
            fnEval('path = require("path");'); // to trick TypeScript
        }
        // https://stackoverflow.com/questions/8817423/why-is-dirname-not-defined-in-node-repl
        var dirname = __dirname || path.dirname(__filename), absolutePath = path.resolve(dirname, name);
        return absolutePath;
    }
    function createModel() {
        var startConfig = {};
        Object.assign(startConfig, cpcconfig_1.cpcconfig || {}); // merge external config from cpcconfig.js
        var model = new Model_1.Model(startConfig);
        return model;
    }
    var cpcBasic = /** @class */ (function () {
        function cpcBasic() {
        }
        cpcBasic.initVmMock1 = function () {
            var vmMock = cpcBasic.vmMock, keywords = BasicParser_1.BasicParser.keywords;
            var _loop_1 = function (key) {
                if (keywords.hasOwnProperty(key)) {
                    if (!vmMock[key]) {
                        vmMock[key] = function () {
                            return key;
                        };
                    }
                }
            };
            for (var key in keywords) {
                _loop_1(key);
            }
            var rsx = vmMock.rsx, rsxKeysString = "a|b|basic|cpm|dir|disc|disc.in|disc.out|drive|era|ren|tape|tape.in|tape.out|user|mode|renum", rsxKeysList = rsxKeysString.split("|");
            var _loop_2 = function (i) {
                var key = rsxKeysList[i];
                if (!rsx[key]) {
                    rsx[key] = function () {
                        return key;
                    };
                }
            };
            for (var i = 0; i < rsxKeysList.length; i += 1) {
                _loop_2(i);
            }
        };
        cpcBasic.initDatabases = function () {
            var model = cpcBasic.model, databases = {}, databaseDirs = model.getProperty("databaseDirs").split(","), databaseNames = [];
            for (var i = 0; i < databaseDirs.length; i += 1) {
                var databaseDir = databaseDirs[i], parts = databaseDir.split("/"), name_1 = parts[parts.length - 1];
                databases[name_1] = {
                    text: name_1,
                    title: databaseDir,
                    src: databaseDir
                };
                databaseNames.push(name_1);
            }
            cpcBasic.model.addDatabases(databases);
            return databaseNames;
        };
        cpcBasic.addIndex2 = function (dir, input) {
            input = input.trim();
            var index = JSON.parse(input);
            for (var i = 0; i < index.length; i += 1) {
                index[i].dir = dir;
                cpcBasic.model.setExample(index[i]);
            }
        };
        // Also called from example files xxxxx.js
        cpcBasic.addItem2 = function (key, input) {
            if (!key) { // maybe ""
                key = cpcBasic.model.getProperty("example");
            }
            input = input.replace(/^\n/, "").replace(/\n$/, ""); // remove preceding and trailing newlines
            // beware of data files ending with newlines! (do not use trimEnd)
            var example = cpcBasic.model.getExample(key);
            example.key = key; // maybe changed
            example.script = input;
            example.loaded = true;
            return key;
        };
        cpcBasic.fnHereDoc = function (fn) {
            return String(fn).
                replace(/^[^/]+\/\*\S*/, "").
                replace(/\*\/[^/]+$/, "");
        };
        cpcBasic.addIndex = function (dir, input) {
            if (typeof input !== "string") {
                input = this.fnHereDoc(input);
            }
            return this.addIndex2(dir, input);
        };
        cpcBasic.addItem = function (key, input) {
            if (typeof input !== "string") {
                input = this.fnHereDoc(input);
            }
            return this.addItem2(key, input);
        };
        cpcBasic.baseDir = "../"; // base test directory (relative to dist)
        cpcBasic.dataBaseDirOrUrl = "";
        cpcBasic.model = createModel();
        cpcBasic.rsx = {
            rsxIsAvailable: function (rsx) {
                return (/^a|b|basic|cpm|dir|disc|disc\.in|disc\.out|drive|era|ren|tape|tape\.in|tape\.out|user|mode|renum$/).test(rsx);
            }
            // will be programmatically extended by methods...
        };
        cpcBasic.lexer = new BasicLexer_1.BasicLexer({
            keywords: BasicParser_1.BasicParser.keywords,
            keepWhiteSpace: true,
            quiet: true
        });
        cpcBasic.parser = new BasicParser_1.BasicParser({
            quiet: true
        });
        cpcBasic.convertParser = new BasicParser_1.BasicParser({
            quiet: true,
            keepTokens: true,
            keepBrackets: true,
            keepColons: true,
            keepDataComma: true
        });
        cpcBasic.codeGeneratorJs = new CodeGeneratorJs_1.CodeGeneratorJs({
            lexer: cpcBasic.lexer,
            parser: cpcBasic.parser,
            trace: false,
            rsx: cpcBasic.rsx
        });
        cpcBasic.codeGeneratorToken = new CodeGeneratorToken_1.CodeGeneratorToken({
            lexer: cpcBasic.lexer,
            parser: cpcBasic.convertParser
        });
        cpcBasic.vmMock = {
            rsx: cpcBasic.rsx,
            line: "",
            testVariables1: new Variables_1.Variables(),
            testStepCounter1: 0,
            maxSteps: 10,
            initTest1: function () {
                cpcBasic.vmMock.testStepCounter1 = cpcBasic.vmMock.maxSteps;
                cpcBasic.vmMock.line = 0; // or "start";
                cpcBasic.vmMock.testVariables1.initAllVariables();
                for (var i = "a".charCodeAt(0); i <= "z".charCodeAt(0); i += 1) {
                    var varChar = String.fromCharCode(i);
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
            vmRound: function (n) {
                return (n >= 0) ? (n + 0.5) | 0 : (n - 0.5) | 0; // eslint-disable-line no-bitwise
            },
            vmAssign: function () {
                return 0;
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
            dim: function (varName) {
                var dimensions = [];
                for (var i = 1; i < arguments.length; i += 1) {
                    var size = this.vmRound(arguments[i]) + 1; // for basic we have sizes +1
                    dimensions.push(size);
                }
                cpcBasic.vmMock.testVariables1.dimVariable(varName, dimensions);
            },
            vmGetNextInput: function () {
                return 0;
            },
            vmStop: function (reason) {
                if (reason === "end") {
                    cpcBasic.vmMock.testStepCounter1 = 0;
                }
            },
            vmGoto: function (line) {
                cpcBasic.vmMock.line = line;
            },
            "goto": function (line) {
                cpcBasic.vmMock.line = line;
            },
            gosub: function (retLabel /* , line: string | number */) {
                cpcBasic.vmMock.line = retLabel; // we could use retLabel or line
            }
            // will be programmatically extended by methods...
        };
        cpcBasic.basicTokenizer = new BasicTokenizer_1.BasicTokenizer(); // for loading tokenized examples
        return cpcBasic;
    }());
    if (!myGlobalThis.cpcBasic) {
        myGlobalThis.cpcBasic = cpcBasic;
    }
    function splitMeta(input) {
        var metaIdent = "CPCBasic";
        var fileMeta;
        if (input.indexOf(metaIdent) === 0) { // starts with metaIdent?
            var index = input.indexOf(","); // metadata separator
            if (index >= 0) {
                var metaString = input.substring(0, index);
                input = input.substring(index + 1);
                var meta = metaString.split(";");
                fileMeta = {
                    type: meta[1],
                    start: Number(meta[2]),
                    length: Number(meta[3]),
                    entry: Number(meta[4]),
                    encoding: meta[5]
                };
            }
        }
        var metaAndData = {
            meta: fileMeta || {},
            data: input
        };
        return metaAndData;
    }
    function asmGena3Convert(input) {
        throw new Error("asmGena3Convert: not implemented for test: " + input);
        return input;
    }
    // taken from Controller.js
    function testCheckMeta(input) {
        var data = splitMeta(input || "");
        input = data.data; // maybe changed
        if (data.meta.encoding === "base64") {
            input = Utils_1.Utils.atob(input); // decode base64
        }
        var type = data.meta.type;
        if (type === "T") { // tokenized basic?
            input = cpcBasic.basicTokenizer.decode(input);
        }
        else if (type === "P") { // protected BASIC?
            input = DiskImage_1.DiskImage.unOrProtectData(input); // TODO
            input = cpcBasic.basicTokenizer.decode(input);
        }
        else if (type === "B") { // binary?
        }
        else if (type === "A") { // ASCII?
            // remove EOF character(s) (0x1a) from the end of file
            input = input.replace(/\x1a+$/, ""); // eslint-disable-line no-control-regex
        }
        else if (type === "G") { // Hisoft Devpac GENA3 Z80 Assember
            input = asmGena3Convert(input); // TODO
        }
        return input;
    }
    function testParseExample(example) {
        var codeGeneratorJs = cpcBasic.codeGeneratorJs, codeGeneratorToken = cpcBasic.codeGeneratorToken, basicTokenizer = cpcBasic.basicTokenizer, script = example.script || "", input = testCheckMeta(script);
        var checks = "", output, fnScript; // eslint-disable-line @typescript-eslint/ban-types
        if (example.meta !== "D") { // skip data files
            checks = "Js";
            var variables = cpcBasic.vmMock.testVariables1;
            // test lexer, parser and JS code generator
            variables.removeAllVariables();
            output = codeGeneratorJs.generate(input, variables);
            if (!output.error) {
                var jsScript = output.text;
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
                    var tokens = codeGeneratorToken.generate(input);
                    checks += "(" + tokens.text.length + ")";
                    // test de-tokenizer
                    checks += ",deToken";
                    var decoded = basicTokenizer.decode(tokens.text);
                    checks += "(" + decoded.length + ")";
                    checks += ",Js2";
                    variables.removeAllVariables();
                    var output2 = codeGeneratorJs.generate(decoded, variables);
                    checks += ",Fn2";
                    fnScript = new Function("o", output2.text); // eslint-disable-line no-new-func
                    // test execute function (running script for fixed number of steps)
                    checks += ",exec2";
                    cpcBasic.vmMock.initTest1();
                    fnScript(cpcBasic.vmMock);
                    checks += "(line " + cpcBasic.vmMock.line + ")";
                }
                catch (e) {
                    Utils_1.Utils.console.error("Error in file", example.key);
                    Utils_1.Utils.console.error(e);
                    output.error = e;
                }
            }
            else {
                Utils_1.Utils.console.error("There was an error when parsing file", example.key);
            }
        }
        else {
            checks = "ignored";
            output = {
                text: "UNPARSED DATA FILE: " + example.key,
                error: undefined
            };
            cpcBasic.ignoredExamples += 1;
        }
        if (Utils_1.Utils.debug > 0) {
            Utils_1.Utils.console.debug("testParseExample:", example.key, "inputLen:", input.length, "outputLen:", output.text.length);
        }
        if (cpcBasic.assert) {
            cpcBasic.assert.ok(!output.error, example.key + ": " + checks);
        }
        return output;
    }
    function fnExampleLoaded(error, code) {
        if (error) {
            throw error;
        }
        cpcBasic.fnExampleDone1();
        if (code) {
            fnEval(code); // load example (for nodeJs)
        }
        var key = cpcBasic.model.getProperty("example"), example = cpcBasic.model.getExample(key), output = testParseExample(example);
        if (!output.error) {
            testNextExample(); // eslint-disable-line no-use-before-define
        }
    }
    function fnExampleLoadedUtils( /* url */) {
        return fnExampleLoaded(undefined, "");
    }
    function fnExampleErrorUtils(url) {
        return fnExampleLoaded(new Error("fnExampleErrorUtils: " + url), "");
    }
    function testLoadExample(exampleEntry) {
        var example = exampleEntry.key, fileOrUrl = cpcBasic.dataBaseDirOrUrl + "/" + example + ".js";
        if (cpcBasic.assert) {
            cpcBasic.fnExampleDone1 = cpcBasic.assert.async();
        }
        try {
            if (nodeJsAvail) {
                if (isUrl(fileOrUrl)) {
                    nodeReadUrl(fileOrUrl, fnExampleLoaded);
                }
                else {
                    nodeReadFile(fileOrUrl, fnExampleLoaded);
                }
            }
            else {
                Utils_1.Utils.loadScript(fileOrUrl, fnExampleLoadedUtils, fnExampleErrorUtils, example);
            }
        }
        catch (e) {
            Utils_1.Utils.console.error("Error in file", example);
            Utils_1.Utils.console.error(e);
        }
    }
    function testNextExample() {
        var testExamples = cpcBasic.testExamples, testIndex = cpcBasic.testIndex;
        if (testIndex < testExamples.length) {
            var key = testExamples[testIndex];
            cpcBasic.testIndex += 1;
            cpcBasic.model.setProperty("example", key);
            var example = cpcBasic.model.getExample(key);
            testLoadExample(example);
        }
        else { // another database?
            testNextIndex(); // eslint-disable-line no-use-before-define
        }
    }
    function fnIndexLoaded(error, code) {
        if (error) {
            throw error;
        }
        cpcBasic.fnIndexDone1();
        if (code) {
            fnEval(code); // load index (for nodeJs)
        }
        var allExamples = cpcBasic.model.getAllExamples();
        cpcBasic.testExamples = Object.keys(allExamples);
        cpcBasic.testIndex = 0;
        cpcBasic.totalExamples += cpcBasic.testExamples.length;
        if (cpcBasic.assert) {
            cpcBasic.assert.expect(cpcBasic.totalExamples);
        }
        testNextExample();
    }
    function fnIndexLoadedUtils( /* url */) {
        return fnIndexLoaded(undefined, "");
    }
    function fnIndexErrorUtils(url) {
        return fnIndexLoaded(new Error("fnIndexErrorUtils: " + url));
    }
    function testLoadIndex(exampeDb) {
        var dir = exampeDb.src;
        if (!isUrl(dir)) {
            dir = cpcBasic.baseDir + dir;
        }
        if (cpcBasic.assert) {
            cpcBasic.fnIndexDone1 = cpcBasic.assert.async();
        }
        if (nodeJsAvail) {
            if (!isUrl(dir)) {
                if (Utils_1.Utils.debug > 0) {
                    Utils_1.Utils.console.debug("testParseExamples: __dirname=", __dirname, " dir=", dir);
                }
                dir = nodeGetAbsolutePath(dir); // convert to absolute path to get it working also for "npm test" and not only for node
            }
        }
        cpcBasic.dataBaseDirOrUrl = dir;
        var fileOrUrl = cpcBasic.dataBaseDirOrUrl + "/0index.js"; // "./examples/0index.js";
        Utils_1.Utils.console.log("testParseExamples: Using Database index:", fileOrUrl);
        if (nodeJsAvail) {
            if (isUrl(dir)) {
                nodeReadUrl(fileOrUrl, fnIndexLoaded);
            }
            else {
                nodeReadFile(fileOrUrl, fnIndexLoaded);
            }
        }
        else {
            Utils_1.Utils.loadScript(fileOrUrl, fnIndexLoadedUtils, fnIndexErrorUtils, exampeDb.text);
        }
    }
    function testNextIndex() {
        var databaseNames = cpcBasic.databaseNames, databaseIndex = cpcBasic.databaseIndex;
        var nextIndex = false;
        if (databaseIndex < databaseNames.length) {
            var key = databaseNames[databaseIndex]; // e.g. "examples";
            if (key !== "storage") { // ignore "storage"
                cpcBasic.databaseIndex += 1;
                cpcBasic.model.setProperty("database", key);
                var exampeDb = cpcBasic.model.getDatabase();
                nextIndex = true;
                testLoadIndex(exampeDb);
            }
        }
        if (!nextIndex) {
            Utils_1.Utils.console.log("testParseExamples: Total examples:", cpcBasic.totalExamples, "/ Ignored examples:", cpcBasic.ignoredExamples);
        }
    }
    function testStart() {
        var Polyfills = window.Polyfills;
        Utils_1.Utils.console.log("testParseExamples: nodeJs:", nodeJsAvail, " Polyfills.getList().length:", Polyfills.getList().length);
        cpcBasic.initVmMock1();
        cpcBasic.totalExamples = 0;
        cpcBasic.ignoredExamples = 0;
        cpcBasic.databaseNames = cpcBasic.initDatabases();
        cpcBasic.databaseIndex = 0;
        testNextIndex();
    }
    TestHelper_1.TestHelper.init();
    if (typeof myGlobalThis.QUnit !== "undefined") {
        Utils_1.Utils.console.log("Using QUnit");
        var QUnit_1 = myGlobalThis.QUnit;
        QUnit_1.config.testTimeout = 8 * 1000;
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
});
// end
//# sourceMappingURL=testParseExamples.qunit.js.map