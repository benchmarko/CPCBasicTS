import { Utils } from "../Utils";
export class TestUiUtils {
    static fnLoadScriptOrStyle(script, fnSuccess, fnError) {
        // inspired by https://github.com/requirejs/requirejs/blob/master/require.js
        let ieTimeoutCount = 3; // IE timeout count
        const onScriptLoad = function (event) {
            const type = event.type, // "load" or "error"
            node = (event.currentTarget || event.srcElement), fullUrl = node.src || node.href, // src for script, href for link
            key = node.getAttribute("data-key");
            if (Utils.debug > 1) {
                Utils.console.debug("onScriptLoad:", type, fullUrl, key);
            }
            node.removeEventListener("load", onScriptLoad, false);
            node.removeEventListener("error", onScriptLoad, false);
            if (type === "load") {
                fnSuccess(fullUrl, key);
            }
            else {
                fnError(fullUrl, key);
            }
        }, onScriptReadyStateChange = function (event) {
            const node = (event ? (event.currentTarget || event.srcElement) : script), fullUrl = node.src || node.href, // src for script, href for link
            key = node.getAttribute("data-key"), node2 = node;
            if (node2.detachEvent) {
                node2.detachEvent("onreadystatechange", onScriptReadyStateChange);
            }
            if (Utils.debug > 1) {
                Utils.console.debug("onScriptReadyStateChange: " + fullUrl);
            }
            if (node2.readyState !== "loaded" && node2.readyState !== "complete") {
                if (node2.readyState === "loading" && ieTimeoutCount) {
                    ieTimeoutCount -= 1;
                    const timeout = 200;
                    Utils.console.error("onScriptReadyStateChange: Still loading: " + fullUrl + " Waiting " + timeout + "ms (count=" + ieTimeoutCount + ")");
                    setTimeout(function () {
                        onScriptReadyStateChange();
                    }, timeout);
                }
                else {
                    Utils.console.error("onScriptReadyStateChange: Cannot load file " + fullUrl + " readystate=" + node2.readyState);
                    fnError(fullUrl, key);
                }
            }
            else {
                fnSuccess(fullUrl, key);
            }
        };
        if (script.readyState) { // old IE8
            ieTimeoutCount = 3;
            script.attachEvent("onreadystatechange", onScriptReadyStateChange);
        }
        else {
            script.addEventListener("load", onScriptLoad, false);
            script.addEventListener("error", onScriptLoad, false);
        }
        document.getElementsByTagName("head")[0].appendChild(script);
    }
    static atob(s) {
        const atobFn = typeof Polyfills !== "undefined" ? Polyfills.atob : window.atob;
        return atobFn(s);
    }
    static getPolyfills() {
        const polyfills = typeof Polyfills !== "undefined" ? Polyfills.getList() : [];
        return polyfills;
    }
}
TestUiUtils.loadScript = (url, fnSuccess, fnError, key) => {
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.charset = "utf-8";
    script.async = true;
    script.src = url;
    script.setAttribute("data-key", key);
    TestUiUtils.fnLoadScriptOrStyle(script, fnSuccess, fnError);
};
//# sourceMappingURL=TestUiUtils.js.map