"use strict";
// Utils.js - Utililities for CPCBasic
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasic/
//
Object.defineProperty(exports, "__esModule", { value: true });
exports.Utils = void 0;
var Utils = /** @class */ (function () {
    function Utils() {
    }
    Utils.fnLoadScriptOrStyle = function (script, sFullUrl, fnSuccess, fnError) {
        // inspired by https://github.com/requirejs/requirejs/blob/master/require.js
        var iIEtimeoutCount = 3;
        var onScriptLoad = function (event) {
            var node = (event.currentTarget || event.srcElement);
            if (Utils.debug > 1) {
                Utils.console.debug("onScriptLoad:", node.src || node.href);
            }
            node.removeEventListener("load", onScriptLoad, false);
            node.removeEventListener("error", onScriptError, false); // eslint-disable-line no-use-before-define
            if (fnSuccess) {
                fnSuccess(sFullUrl);
            }
        }, onScriptError = function (event) {
            var node = (event.currentTarget || event.srcElement);
            if (Utils.debug > 1) {
                Utils.console.debug("onScriptError:", node.src || node.href);
            }
            node.removeEventListener("load", onScriptLoad, false);
            node.removeEventListener("error", onScriptError, false);
            if (fnError) {
                fnError(sFullUrl);
            }
        }, onScriptReadyStateChange = function (event) {
            var node = event ? (event.currentTarget || event.srcElement) : script, node2 = node;
            if (node2.detachEvent) {
                node2.detachEvent("onreadystatechange", onScriptReadyStateChange);
            }
            if (Utils.debug > 1) {
                Utils.console.debug("onScriptReadyStateChange: " + node2.src || node2.href);
            }
            // check also: https://stackoverflow.com/questions/1929742/can-script-readystate-be-trusted-to-detect-the-end-of-dynamic-script-loading
            if (node2.readyState !== "loaded" && node2.readyState !== "complete") {
                if (node2.readyState === "loading" && iIEtimeoutCount) {
                    iIEtimeoutCount -= 1;
                    var iTimeout = 200; // some delay
                    Utils.console.error("onScriptReadyStateChange: Still loading: " + (node2.src || node2.href) + " Waiting " + iTimeout + "ms (count=" + iIEtimeoutCount + ")");
                    setTimeout(function () {
                        onScriptReadyStateChange(null); // check again
                    }, iTimeout);
                }
                else {
                    // iIEtimeoutCount = 3;
                    Utils.console.error("onScriptReadyStateChange: Cannot load file " + (node2.src || node2.href) + " readystate=" + node2.readyState);
                    if (fnError) {
                        fnError(sFullUrl);
                    }
                }
            }
            else if (fnSuccess) {
                fnSuccess(sFullUrl);
            }
        };
        if (script.readyState) { // old IE8
            iIEtimeoutCount = 3;
            script.attachEvent("onreadystatechange", onScriptReadyStateChange);
        }
        else { // Others
            script.addEventListener("load", onScriptLoad, false);
            script.addEventListener("error", onScriptError, false);
        }
        document.getElementsByTagName("head")[0].appendChild(script);
        return sFullUrl;
    };
    Utils.loadScript = function (sUrl, fnSuccess, fnError) {
        var script = document.createElement("script");
        script.type = "text/javascript";
        script.charset = "utf-8";
        script.async = true;
        script.src = sUrl;
        var sFullUrl = script.src;
        this.fnLoadScriptOrStyle(script, sFullUrl, fnSuccess, fnError);
    };
    Utils.loadStyle = function (sUrl, fnSuccess, fnError) {
        var link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = sUrl;
        var sFullUrl = link.href;
        this.fnLoadScriptOrStyle(link, sFullUrl, fnSuccess, fnError);
    };
    Utils.dateFormat = function (d) {
        return d.getFullYear() + "/" + ("0" + (d.getMonth() + 1)).slice(-2) + "/" + ("0" + d.getDate()).slice(-2) + " "
            + ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2) + ":" + ("0" + d.getSeconds()).slice(-2) + "." + ("0" + d.getMilliseconds()).slice(-3);
    };
    Utils.stringCapitalize = function (str) {
        return str.charAt(0).toUpperCase() + str.substring(1);
    };
    Utils.numberWithCommas = function (x) {
        // https://stackoverflow.com/questions/2901102/how-to-print-a-number-with-commas-as-thousands-separators-in-javascript
        var aParts = String(x).split(".");
        aParts[0] = aParts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return aParts.join(".");
    };
    Utils.toRadians = function (deg) {
        return deg * Math.PI / 180;
    };
    Utils.toDegrees = function (rad) {
        return rad * 180 / Math.PI;
    };
    Utils.getChangedParameters = function (current, initial) {
        var oChanged = {};
        for (var sName in current) {
            if (current.hasOwnProperty(sName)) {
                if (current[sName] !== initial[sName]) {
                    oChanged[sName] = current[sName];
                }
            }
        }
        return oChanged;
    };
    Utils.stringTrimEnd = function (sStr) {
        return sStr.replace(/[\s\uFEFF\xA0]+$/, "");
    };
    Utils.composeError = function (name, oErrorObject, message, value, pos, line, hidden) {
        var oCustomError = oErrorObject;
        if (name !== undefined) {
            oCustomError.name = name;
        }
        if (message !== undefined) {
            oCustomError.message = message;
        }
        if (value !== undefined) {
            oCustomError.value = value;
        }
        if (pos !== undefined) {
            oCustomError.pos = pos;
        }
        if (line !== undefined) {
            oCustomError.line = line;
        }
        if (hidden !== undefined) {
            oCustomError.hidden = hidden;
        }
        var iEndPos = (oCustomError.pos || 0) + ((oCustomError.value !== undefined) ? String(oCustomError.value).length : 0);
        oCustomError.shortMessage = oCustomError.message + (oCustomError.line !== undefined ? " in " + oCustomError.line : " at pos " + (oCustomError.pos || 0) + "-" + iEndPos) + ": " + oCustomError.value;
        oCustomError.message += " in " + oCustomError.line + " at pos " + (oCustomError.pos || 0) + "-" + iEndPos + ": " + oCustomError.value;
        return oCustomError;
    };
    Utils.debug = 0;
    Utils.console = (function () {
        return typeof window !== "undefined" ? window.console : globalThis.console; // browser or node.js
    }());
    Utils.bSupportsBinaryLiterals = (function () {
        try {
            Function("0b01"); // eslint-disable-line no-new-func
        }
        catch (e) {
            return false;
        }
        return true;
    }());
    Utils.bSupportReservedNames = (function () {
        try {
            Function("({}).return()"); // eslint-disable-line no-new-func
        }
        catch (e) {
            return false;
        }
        return true;
    }());
    Utils.localStorage = (function () {
        var rc;
        try {
            rc = typeof window !== "undefined" ? window.localStorage : null; // due to a bug in MS Edge this will throw an error when hosting locally (https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/8816771/)
        }
        catch (e) {
            rc = undefined;
        }
        return rc;
    }());
    Utils.atob = (function () {
        return typeof window !== "undefined" && window.atob && window.atob.bind ? window.atob.bind(window) : null; // we need bind: https://stackoverflow.com/questions/9677985/uncaught-typeerror-illegal-invocation-in-chrome
    }());
    Utils.btoa = (function () {
        return typeof window !== "undefined" && window.btoa && window.btoa.bind ? window.btoa.bind(window) : null; // we need bind!
    }());
    return Utils;
}());
exports.Utils = Utils;
//# sourceMappingURL=Utils.js.map