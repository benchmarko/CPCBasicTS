// Utils.js - Utililities for CPCBasic
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasic/
//
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Utils = void 0;
exports.Utils = {
    debug: 0,
    console: typeof window !== "undefined" ? window.console : globalThis.console,
    fnLoadScriptOrStyle: function (script, sFullUrl, fnSuccess, fnError) {
        // inspired by https://github.com/requirejs/requirejs/blob/master/require.js
        var iIEtimeoutCount = 3, onScriptLoad = function (event) {
            var node = event.currentTarget || event.srcElement;
            if (exports.Utils.debug > 1) {
                exports.Utils.console.debug("onScriptLoad:", node.src || node.href);
            }
            node.removeEventListener("load", onScriptLoad, false);
            node.removeEventListener("error", onScriptError, false); // eslint-disable-line no-use-before-define
            if (fnSuccess) {
                fnSuccess(sFullUrl);
            }
        }, onScriptError = function (event) {
            var node = event.currentTarget || event.srcElement;
            if (exports.Utils.debug > 1) {
                exports.Utils.console.debug("onScriptError:", node.src || node.href);
            }
            node.removeEventListener("load", onScriptLoad, false);
            node.removeEventListener("error", onScriptError, false);
            if (fnError) {
                fnError(sFullUrl);
            }
        }, onScriptReadyStateChange = function (event) {
            var node, iTimeout;
            if (event) {
                node = event.currentTarget || event.srcElement;
            }
            else {
                node = script;
            }
            if (node.detachEvent) {
                node.detachEvent("onreadystatechange", onScriptReadyStateChange);
            }
            if (exports.Utils.debug > 1) {
                exports.Utils.console.debug("onScriptReadyStateChange: " + node.src || node.href);
            }
            // check also: https://stackoverflow.com/questions/1929742/can-script-readystate-be-trusted-to-detect-the-end-of-dynamic-script-loading
            if (node.readyState !== "loaded" && node.readyState !== "complete") {
                if (node.readyState === "loading" && iIEtimeoutCount) {
                    iIEtimeoutCount -= 1;
                    iTimeout = 200; // some delay
                    exports.Utils.console.error("onScriptReadyStateChange: Still loading: " + (node.src || node.href) + " Waiting " + iTimeout + "ms (count=" + iIEtimeoutCount + ")");
                    setTimeout(function () {
                        onScriptReadyStateChange(null); // check again
                    }, iTimeout);
                }
                else {
                    // iIEtimeoutCount = 3;
                    exports.Utils.console.error("onScriptReadyStateChange: Cannot load file " + (node.src || node.href) + " readystate=" + node.readyState);
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
    },
    loadScript: function (sUrl, fnSuccess, fnError) {
        var script, sFullUrl;
        script = document.createElement("script");
        script.type = "text/javascript";
        script.charset = "utf-8";
        script.async = true;
        script.src = sUrl;
        sFullUrl = script.src;
        this.fnLoadScriptOrStyle(script, sFullUrl, fnSuccess, fnError);
    },
    loadStyle: function (sUrl, fnSuccess, fnError) {
        var link, sFullUrl;
        link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = sUrl;
        sFullUrl = link.href;
        this.fnLoadScriptOrStyle(link, sFullUrl, fnSuccess, fnError);
    },
    dateFormat: function (d) {
        return d.getFullYear() + "/" + ("0" + (d.getMonth() + 1)).slice(-2) + "/" + ("0" + d.getDate()).slice(-2) + " "
            + ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2) + ":" + ("0" + d.getSeconds()).slice(-2) + "." + ("0" + d.getMilliseconds()).slice(-3);
    },
    stringCapitalize: function (str) {
        return str.charAt(0).toUpperCase() + str.substring(1);
    },
    numberWithCommas: function (x) {
        // https://stackoverflow.com/questions/2901102/how-to-print-a-number-with-commas-as-thousands-separators-in-javascript
        var aParts = String(x).split(".");
        aParts[0] = aParts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return aParts.join(".");
    },
    toRadians: function (deg) {
        return deg * Math.PI / 180;
    },
    toDegrees: function (rad) {
        return rad * 180 / Math.PI;
    },
    getChangedParameters: function (current, initial) {
        var oChanged = {}, sName;
        for (sName in current) {
            if (current.hasOwnProperty(sName)) {
                if (current[sName] !== initial[sName]) {
                    oChanged[sName] = current[sName];
                }
            }
        }
        return oChanged;
    },
    bSupportsBinaryLiterals: (function () {
        try {
            Function("0b01"); // eslint-disable-line no-new-func
        }
        catch (e) {
            return false;
        }
        return true;
    }()),
    bSupportReservedNames: (function () {
        try {
            Function("({}).return()"); // eslint-disable-line no-new-func
        }
        catch (e) {
            return false;
        }
        return true;
    }()),
    localStorage: (function () {
        var rc;
        try {
            rc = typeof window !== "undefined" ? window.localStorage : null; // due to a bug in MS Edge this will throw an error when hosting locally (https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/8816771/)
        }
        catch (e) {
            rc = null;
        }
        return rc;
    }()),
    atob: typeof window !== "undefined" && window.atob && window.atob.bind ? window.atob.bind(window) : null,
    btoa: typeof window !== "undefined" && window.btoa && window.btoa.bind ? window.btoa.bind(window) : null,
    composeError: function (name, oError, message, value, pos, line, hidden) {
        var iEndPos;
        if (name !== undefined) {
            oError.name = name;
        }
        if (message !== undefined) {
            oError.message = message;
        }
        if (value !== undefined) {
            oError.value = value;
        }
        if (pos !== undefined) {
            oError.pos = pos;
        }
        if (line !== undefined) {
            oError.line = line;
        }
        if (hidden !== undefined) {
            oError.hidden = hidden;
        }
        iEndPos = (oError.pos || 0) + ((oError.value !== undefined) ? String(oError.value).length : 0);
        oError.shortMessage = oError.message + (oError.line !== undefined ? " in " + oError.line : " at pos " + (oError.pos || 0) + "-" + iEndPos) + ": " + oError.value;
        oError.message += " in " + oError.line + " at pos " + (oError.pos || 0) + "-" + iEndPos + ": " + oError.value;
        return oError;
    }
};
//# sourceMappingURL=Utils.js.map