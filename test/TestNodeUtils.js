import { Utils } from "../Utils";
var TestNodeUtils = /** @class */ (function () {
    function TestNodeUtils() {
    }
    TestNodeUtils.nodeReadUrl = function (url, fnDataLoaded) {
        var nodeHttps = eval("require")("https"); // eslint-disable-line no-eval
        nodeHttps.get(url, function (resp) {
            var data = "";
            resp.on("data", function (chunk) {
                data += chunk;
            });
            resp.on("end", function () {
                fnDataLoaded(undefined, data);
            });
        }).on("error", function (err) {
            Utils.console.log("Error: " + err.message);
            fnDataLoaded(err);
        });
    };
    TestNodeUtils.nodeReadFile = function (name, fnDataLoaded) {
        var nodeFs = eval("require")("fs"), // eslint-disable-line no-eval
        myGlobalThis = (typeof globalThis !== "undefined") ? globalThis : Function("return this")(), // eslint-disable-line no-new-func
        cwd = (myGlobalThis.process && myGlobalThis.process.cwd) ? myGlobalThis.process.cwd() : "", name2 = (cwd && name.indexOf(":") < 0 && !name.startsWith("/")) ? cwd + "/" + name : name;
        nodeFs.readFile(name2, "utf8", fnDataLoaded);
    };
    TestNodeUtils.isUrl = function (s) {
        return s.startsWith("http"); // http or https
    };
    /*
    static setLoadScriptForNode() {
        Utils.setLoadScript(TestNodeUtils.loadScript);
    }
    */
    // https://dirask.com/posts/Node-js-atob-btoa-functions-equivalents-1Aqb51
    TestNodeUtils.atob = function (input) {
        return Buffer.from(input, "base64").toString("binary");
    };
    TestNodeUtils.btoa = function (input) {
        return Buffer.from(input, "binary").toString("base64");
    };
    TestNodeUtils.isNodeRuntime = function () {
        // eslint-disable-next-line no-new-func
        var myGlobalThis = (typeof globalThis !== "undefined") ? globalThis : Function("return this")(); // for old IE
        return Boolean(myGlobalThis.process);
    };
    TestNodeUtils.loadScript = function (fileOrUrl, fnSuccess, _fnError, key) {
        var fnLoaded = function (error, data) {
            if (error) {
                Utils.console.error("file error: ", error);
            }
            if (data) {
                eval(data); // eslint-disable-line no-eval
            }
            fnSuccess(fileOrUrl, key);
        };
        if (TestNodeUtils.isUrl(fileOrUrl)) {
            TestNodeUtils.nodeReadUrl(fileOrUrl, fnLoaded);
        }
        else {
            TestNodeUtils.nodeReadFile(fileOrUrl, fnLoaded);
        }
    };
    return TestNodeUtils;
}());
export { TestNodeUtils };
//# sourceMappingURL=TestNodeUtils.js.map