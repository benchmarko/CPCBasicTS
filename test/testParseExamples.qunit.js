// testParseExamples.qunit.ts - Test to load and parse all examples
//
// Examples:
// qunit dist/test/testParseExamples.qunit.js
// qunit dist/test/testParseExamples.qunit.js debug=1
//
// node dist/test/testParseExamples.qunit.js
// npm test...
/* eslint-disable prefer-const */
let path = undefined;
import { Utils } from "../Utils";
import { BasicLexer } from "../BasicLexer";
import { BasicParser } from "../BasicParser";
import { BasicTokenizer } from "../BasicTokenizer";
import { CodeGeneratorJs } from "../CodeGeneratorJs";
import { CodeGeneratorToken } from "../CodeGeneratorToken";
import { Model } from "../Model";
import { Variables } from "../Variables";
import { DiskImage } from "../DiskImage";
import { cpcconfig } from "../cpcconfig";
import { TestHelper } from "./TestHelper";
import { TestNodeUtils } from "./TestNodeUtils";
import { TestUiUtils } from "./TestUiUtils";
// eslint-disable-next-line no-new-func
const myGlobalThis = (typeof globalThis !== "undefined") ? globalThis : Function("return this")(); // for old IE
function isUrl(s) {
    return s.startsWith("http"); // http or https
}
function fnEval(code) {
    return eval(code); // eslint-disable-line no-eval
}
function nodeGetAbsolutePath(name) {
    if (!path) {
        // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
        fnEval('path = require("path");'); // to trick TypeScript
    }
    const dirname = process.cwd() + "/dist/test/", // "...CPCBasicTS/" + ...
    absolutePath = path.resolve(dirname, name);
    if (Utils.debug > 0) {
        Utils.console.debug("nodeGetAbsolutePath: dirname=", dirname, "name=", name, "absolutePath=", absolutePath);
    }
    return absolutePath;
}
function createModel() {
    const startConfig = {};
    Object.assign(startConfig, cpcconfig || {}); // merge external config from cpcconfig.js
    const model = new Model(startConfig);
    return model;
}
class cpcBasic {
    static initVmMock1() {
        const vmMock = cpcBasic.vmMock, keywords = cpcBasic.basicParser.getKeywords();
        for (const key in keywords) {
            if (keywords.hasOwnProperty(key)) {
                if (!vmMock[key]) {
                    vmMock[key] = function () {
                        return key;
                    };
                }
            }
        }
    }
    static getUniqueDbKey(name, databases) {
        let key = name, index = 2;
        while (databases[key]) {
            key = name + index;
            index += 1;
        }
        return key;
    }
    static initDatabases() {
        const model = cpcBasic.model, databases = {}, databaseDirs = model.getProperty("databaseDirs" /* ModelPropID.databaseDirs */).split(","), databaseNames = [];
        for (let i = 0; i < databaseDirs.length; i += 1) {
            const databaseDir = databaseDirs[i], parts1 = databaseDir.split("="), databaseSrc = parts1[0], assignedName = parts1.length > 1 ? parts1[1] : "", parts2 = databaseSrc.split("/"), name = assignedName || parts2[parts2.length - 1], key = this.getUniqueDbKey(name, databases);
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
    static addIndex2(_dir, input) {
        for (const value in input) {
            if (input.hasOwnProperty(value)) {
                const item = input[value];
                for (let i = 0; i < item.length; i += 1) {
                    //item[i].dir = dir; // TTT to check
                    this.model.setExample(item[i]);
                }
            }
        }
    }
    static addLineNumbers(input) {
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
    static addItem2(key, input) {
        if (!key) { // maybe ""
            key = cpcBasic.model.getProperty("example" /* ModelPropID.example */);
        }
        input = input.replace(/^\n/, "").replace(/\n$/, ""); // remove preceding and trailing newlines
        // beware of data files ending with newlines! (do not use trimEnd)
        const implicitLines = false, linesOnLoad = true;
        if (input.startsWith("REM ") && !implicitLines && linesOnLoad) {
            input = cpcBasic.addLineNumbers(input);
        }
        const example = cpcBasic.model.getExample(key);
        example.key = key; // maybe changed
        example.script = input;
        example.loaded = true;
        return key;
    }
    static fnHereDoc(fn) {
        return String(fn).
            replace(/^[^/]+\/\*\S*/, "").
            replace(/\*\/[^/]+$/, "");
    }
    static addIndex(dir, input) {
        if (typeof input === "function") {
            input = {
                [dir]: JSON.parse(this.fnHereDoc(input).trim())
            };
        }
        return this.addIndex2(dir, input);
    }
    static addItem(key, input) {
        if (typeof input !== "string") {
            input = this.fnHereDoc(input);
        }
        return this.addItem2(key, input);
    }
    static addRsx(key, RsxConstructor) {
        const rsx = new RsxConstructor();
        if (!key) { // maybe ""
            key = cpcBasic.model.getProperty("example" /* ModelPropID.example */);
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
cpcBasic.baseDir = "../"; // base test directory (relative to dist)
cpcBasic.dataBaseDirOrUrl = "";
cpcBasic.model = createModel();
cpcBasic.basicParser = new BasicParser({
    quiet: true
});
cpcBasic.basicLexer = new BasicLexer({
    keywords: cpcBasic.basicParser.getKeywords(),
    keepWhiteSpace: true,
    quiet: true
});
cpcBasic.convertParser = new BasicParser({
    quiet: true,
    keepTokens: true,
    keepBrackets: true,
    keepColons: true,
    keepDataComma: true
});
cpcBasic.codeGeneratorJs = new CodeGeneratorJs({
    lexer: cpcBasic.basicLexer,
    parser: cpcBasic.basicParser,
    trace: false,
    quiet: true
});
cpcBasic.codeGeneratorToken = new CodeGeneratorToken({
    lexer: cpcBasic.basicLexer,
    parser: cpcBasic.convertParser
});
cpcBasic.vmMock = {
    line: "",
    gosubStack: [],
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
    vmRound: function (n) {
        return (n >= 0) ? (n + 0.5) | 0 : (n - 0.5) | 0; // eslint-disable-line no-bitwise
    },
    vmAssign(_varType, value) {
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
    addressOf(variable) {
        return cpcBasic.vmMock.testVariables1.getVariableIndex(variable);
    },
    callRsx() {
        // empty
    },
    vmDefineVarTypes(type, _err, first, last) {
        const firstNum = first.toLowerCase().charCodeAt(0), lastNum = last ? last.toLowerCase().charCodeAt(0) : firstNum;
        for (let i = firstNum; i <= lastNum; i += 1) {
            const varChar = String.fromCharCode(i);
            cpcBasic.vmMock.testVariables1.setVarType(varChar, type);
        }
    },
    // defxxx needed to access correct multidimensional arrays
    defint(first, last) {
        this.vmDefineVarTypes("I", "DEFINT", first, last);
    },
    defreal(first, last) {
        this.vmDefineVarTypes("R", "DEFREAL", first, last);
    },
    defstr(first, last) {
        this.vmDefineVarTypes("$", "DEFSTR", first, last);
    },
    dim(varName) {
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
    gosub: function (retLabel, line) {
        this.gosubStack.push(retLabel);
        cpcBasic.vmMock.vmGoto(line);
    },
    "return"() {
        const line = this.gosubStack.pop() || 0;
        cpcBasic.vmMock.vmGoto(line);
    }
    // will be programmatically extended by methods...
};
cpcBasic.basicTokenizer = new BasicTokenizer(); // for loading tokenized examples
if (!myGlobalThis.cpcBasic) {
    myGlobalThis.cpcBasic = cpcBasic;
}
function splitMeta(input) {
    const metaIdent = "CPCBasic";
    let fileMeta;
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
    const metaAndData = {
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
    const data = splitMeta(input || "");
    input = data.data; // maybe changed
    if (data.meta.encoding === "base64") {
        const atobFn = TestNodeUtils.isNodeRuntime() ? TestNodeUtils.atob : TestUiUtils.atob;
        input = atobFn(input); // decode base64
    }
    const type = data.meta.type;
    if (type === "T") { // tokenized basic?
        input = cpcBasic.basicTokenizer.decode(input);
    }
    else if (type === "P") { // protected BASIC?
        input = DiskImage.unOrProtectData(input); // TODO
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
// needed for example "rosetta/execute" which has a line without line number
function hasLineNumbers(input) {
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
function testParseExample(example) {
    const codeGeneratorJs = cpcBasic.codeGeneratorJs, codeGeneratorToken = cpcBasic.codeGeneratorToken, basicTokenizer = cpcBasic.basicTokenizer, script = example.script || "", input = testCheckMeta(script);
    let checks = "", output, fnScript; // eslint-disable-line @typescript-eslint/no-unsafe-function-type
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
            }
            catch (e) {
                Utils.console.error("Error in file", example.key);
                Utils.console.error(e);
                output.error = e;
            }
        }
        else {
            Utils.console.error("There was an error when parsing file", example.key);
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
    if (Utils.debug > 0) {
        Utils.console.debug("testParseExample:", example.key, "inputLen:", input.length, "outputLen:", output.text.length);
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
    const key = cpcBasic.model.getProperty("example" /* ModelPropID.example */), example = cpcBasic.model.getExample(key), output = testParseExample(example);
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
    const example = exampleEntry.key, fileOrUrl = cpcBasic.dataBaseDirOrUrl + "/" + example + ".js";
    if (cpcBasic.assert) {
        cpcBasic.fnExampleDone1 = cpcBasic.assert.async();
    }
    try {
        const fnLoadScript = TestNodeUtils.isNodeRuntime() ? TestNodeUtils.loadScript : TestUiUtils.loadScript;
        fnLoadScript(fileOrUrl, fnExampleLoadedUtils, fnExampleErrorUtils, example);
    }
    catch (e) {
        Utils.console.error("Error in file", example);
        Utils.console.error(e);
    }
}
function testNextExample() {
    const testExamples = cpcBasic.testExamples, testIndex = cpcBasic.testIndex;
    if (testIndex < testExamples.length) {
        const key = testExamples[testIndex];
        cpcBasic.testIndex += 1;
        cpcBasic.model.setProperty("example" /* ModelPropID.example */, key);
        const example = cpcBasic.model.getExample(key);
        testLoadExample(example);
    }
    else { // another database?
        testNextIndex(); // eslint-disable-line no-use-before-define
    }
}
function fnIndexLoaded(error, _code) {
    if (error) {
        throw error;
    }
    cpcBasic.fnIndexDone1();
    const allExamples = cpcBasic.model.getAllExamples();
    cpcBasic.testExamples = Object.keys(allExamples);
    if (TestHelper.config.test) { // a single test specified?
        const testName = TestHelper.config.test;
        cpcBasic.testExamples = cpcBasic.testExamples.filter(function (item) {
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
function fnIndexLoadedUtils( /* url */) {
    return fnIndexLoaded(undefined, "");
}
function fnIndexErrorUtils(url) {
    return fnIndexLoaded(new Error("fnIndexErrorUtils: " + url));
}
function testLoadIndex(exampeDb) {
    let dir = exampeDb.src;
    if (!isUrl(dir)) {
        dir = cpcBasic.baseDir + dir;
    }
    if (cpcBasic.assert) {
        cpcBasic.fnIndexDone1 = cpcBasic.assert.async();
    }
    if (TestNodeUtils.isNodeRuntime()) {
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
    if (TestNodeUtils.isNodeRuntime() && isUrl(dir) && !TestHelper.config.testAll) {
        Utils.console.log("testParseExamples: testAll=" + TestHelper.config.testAll + ": skipping index loading for", fileOrUrl);
        fnIndexLoadedUtils(); // skip loading index
    }
    else {
        const fnLoadScript = TestNodeUtils.isNodeRuntime() ? TestNodeUtils.loadScript : TestUiUtils.loadScript;
        fnLoadScript(fileOrUrl, fnIndexLoadedUtils, fnIndexErrorUtils, exampeDb.text);
    }
}
function testNextIndex() {
    const databaseNames = cpcBasic.databaseNames, databaseIndex = cpcBasic.databaseIndex;
    let nextIndex = false;
    if (databaseIndex < databaseNames.length) {
        const key = databaseNames[databaseIndex]; // e.g. "examples";
        if (key !== "storage") { // ignore "storage"
            cpcBasic.databaseIndex += 1;
            cpcBasic.model.setProperty("database" /* ModelPropID.database */, key);
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
    const isNodeRuntime = TestNodeUtils.isNodeRuntime();
    Utils.console.log("testParseExamples: isNodeRuntime:", isNodeRuntime);
    if (!isNodeRuntime) {
        Utils.console.log("testParseExamples: Polyfills.length:", TestUiUtils.getPolyfills().length);
    }
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
    QUnit.module("testParseExamples: Tests", function ( /* hooks */) {
        QUnit.test("testParseExamples", function (assert) {
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
//# sourceMappingURL=testParseExamples.qunit.js.map