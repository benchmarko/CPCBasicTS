import { Utils } from "../Utils";
export class TestNodeUtils {
    static nodeReadUrl(url, fnDataLoaded) {
        const nodeHttps = eval("require")("https"); // eslint-disable-line no-eval
        nodeHttps.get(url, (resp) => {
            let data = "";
            resp.on("data", (chunk) => {
                data += chunk;
            });
            resp.on("end", () => {
                fnDataLoaded(undefined, data);
            });
        }).on("error", (err) => {
            Utils.console.log("Error: " + err.message);
            fnDataLoaded(err);
        });
    }
    static nodeReadFile(name, fnDataLoaded) {
        const nodeFs = eval("require")("fs"), // eslint-disable-line no-eval
        myGlobalThis = (typeof globalThis !== "undefined") ? globalThis : Function("return this")(), // eslint-disable-line no-new-func
        cwd = (myGlobalThis.process && myGlobalThis.process.cwd) ? myGlobalThis.process.cwd() : "", name2 = (cwd && name.indexOf(":") < 0 && !name.startsWith("/")) ? cwd + "/" + name : name;
        nodeFs.readFile(name2, "utf8", fnDataLoaded);
    }
    static isUrl(s) {
        return s.startsWith("http"); // http or https
    }
    /*
    static setLoadScriptForNode() {
        Utils.setLoadScript(TestNodeUtils.loadScript);
    }
    */
    // https://dirask.com/posts/Node-js-atob-btoa-functions-equivalents-1Aqb51
    static atob(input) {
        return Buffer.from(input, "base64").toString("binary");
    }
    static btoa(input) {
        return Buffer.from(input, "binary").toString("base64");
    }
    static isNodeRuntime() {
        // eslint-disable-next-line no-new-func
        const myGlobalThis = (typeof globalThis !== "undefined") ? globalThis : Function("return this")(); // for old IE
        return Boolean(myGlobalThis.process);
    }
}
TestNodeUtils.loadScript = (fileOrUrl, fnSuccess, _fnError, key) => {
    const fnLoaded = (error, data) => {
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
//# sourceMappingURL=TestNodeUtils.js.map