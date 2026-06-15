var UiUtils = /** @class */ (function () {
    function UiUtils() {
    }
    UiUtils.setDebug = function (debug) {
        UiUtils.debug = debug;
    };
    UiUtils.fnLoadScriptOrStyle = function (script, fnSuccess, fnError) {
        // inspired by https://github.com/requirejs/requirejs/blob/master/require.js
        var ieTimeoutCount = 3; // IE timeout count
        var onScriptLoad = function (event) {
            var type = event.type, // "load" or "error"
            node = (event.currentTarget || event.srcElement), fullUrl = node.src || node.href, // src for script, href for link
            key = node.getAttribute("data-key");
            if (UiUtils.debug > 1) {
                console.debug("onScriptLoad:", type, fullUrl, key);
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
            var node = (event ? (event.currentTarget || event.srcElement) : script), fullUrl = node.src || node.href, // src for script, href for link
            key = node.getAttribute("data-key"), node2 = node;
            if (node2.detachEvent) {
                node2.detachEvent("onreadystatechange", onScriptReadyStateChange);
            }
            if (UiUtils.debug > 1) {
                console.debug("onScriptReadyStateChange: " + fullUrl);
            }
            if (node2.readyState !== "loaded" && node2.readyState !== "complete") {
                if (node2.readyState === "loading" && ieTimeoutCount) {
                    ieTimeoutCount -= 1;
                    var timeout = 200;
                    console.error("onScriptReadyStateChange: Still loading: " + fullUrl + " Waiting " + timeout + "ms (count=" + ieTimeoutCount + ")");
                    setTimeout(function () {
                        onScriptReadyStateChange();
                    }, timeout);
                }
                else {
                    console.error("onScriptReadyStateChange: Cannot load file " + fullUrl + " readystate=" + node2.readyState);
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
    };
    UiUtils.stringCapitalize = function (str) {
        return str.charAt(0).toUpperCase() + str.substring(1);
    };
    UiUtils.stringTrimEnd = function (str) {
        return str.replace(/[\s\uFEFF\xA0]+$/, "");
    };
    UiUtils.string2Uint8Array = function (data) {
        var buf = new ArrayBuffer(data.length), view = new Uint8Array(buf);
        for (var i = 0; i < data.length; i += 1) {
            view[i] = data.charCodeAt(i);
        }
        return view;
    };
    UiUtils.isCustomError = function (e) {
        return e.pos !== undefined;
    };
    UiUtils.uint8Array2string = function (data) {
        var callSize = 25000; // use call window to avoid "maximum call stack error" for e.g. size 336461
        var len = data.length, offset = 0, out = "";
        while (len) {
            var chunkLen = Math.min(len, callSize), chunk = data.slice ? data.slice(offset, offset + chunkLen) : data.subarray(offset, offset + chunkLen); // array.slice on Uint8Array not for IE11
            out += String.fromCharCode.apply(null, chunk); // on Chrome this is faster than single character processing
            offset += chunkLen;
            len -= chunkLen;
        }
        return out;
    };
    UiUtils.composeError = function (name, errorObject, message, value, pos, len, line, hidden) {
        var customError = errorObject;
        customError.name = name;
        customError.message = message;
        customError.value = value;
        if (pos !== undefined) {
            customError.pos = pos;
        }
        if (len !== undefined) {
            customError.len = len;
        }
        // Safari: Some additional properties are already defined: line, column. Shall we use "cause" property now?
        if (line !== customError.line) {
            customError.line = line;
        }
        if (hidden !== undefined) {
            customError.hidden = hidden;
        }
        var errorLen = customError.len;
        if (errorLen === undefined && customError.value !== undefined) {
            errorLen = String(customError.value).length;
        }
        var endPos = (customError.pos || 0) + (errorLen || 0), lineMsg = (customError.line !== undefined ? " in " + customError.line : ""), posMsg = pos !== undefined ? (" at pos " + (pos !== endPos ? customError.pos + "-" + endPos : customError.pos)) : "";
        customError.shortMessage = customError.message + (lineMsg || posMsg) + ": " + customError.value;
        customError.message += lineMsg + posMsg + ": " + customError.value;
        return customError;
    };
    UiUtils.debug = 0;
    UiUtils.console = console;
    UiUtils.loadScript = function (url, fnSuccess, fnError, key) {
        var script = document.createElement("script");
        script.type = "text/javascript";
        script.charset = "utf-8";
        script.async = true;
        script.src = url;
        script.setAttribute("data-key", key);
        UiUtils.fnLoadScriptOrStyle(script, fnSuccess, fnError);
    };
    return UiUtils;
}());
export { UiUtils };
//# sourceMappingURL=UiUtils.js.map