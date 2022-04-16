// Utils.ts - Utililities for CPCBasic
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Utils = void 0;
    var Utils = /** @class */ (function () {
        function Utils() {
        }
        Utils.fnLoadScriptOrStyle = function (script, fnSuccess, fnError) {
            // inspired by https://github.com/requirejs/requirejs/blob/master/require.js
            var iIEtimeoutCount = 3;
            var onScriptLoad = function (event) {
                var sType = event.type, // "load" or "error"
                node = (event.currentTarget || event.srcElement), sFullUrl = node.src || node.href, // src for script, href for link
                sKey = node.getAttribute("data-key");
                if (Utils.debug > 1) {
                    Utils.console.debug("onScriptLoad:", sType, sFullUrl, sKey);
                }
                node.removeEventListener("load", onScriptLoad, false);
                node.removeEventListener("error", onScriptLoad, false);
                if (sType === "load") {
                    fnSuccess(sFullUrl, sKey);
                }
                else {
                    fnError(sFullUrl, sKey);
                }
            }, onScriptReadyStateChange = function (event) {
                var node = (event ? (event.currentTarget || event.srcElement) : script), sFullUrl = node.src || node.href, // src for script, href for link
                sKey = node.getAttribute("data-key"), node2 = node;
                if (node2.detachEvent) {
                    node2.detachEvent("onreadystatechange", onScriptReadyStateChange);
                }
                if (Utils.debug > 1) {
                    Utils.console.debug("onScriptReadyStateChange: " + sFullUrl);
                }
                // check also: https://stackoverflow.com/questions/1929742/can-script-readystate-be-trusted-to-detect-the-end-of-dynamic-script-loading
                if (node2.readyState !== "loaded" && node2.readyState !== "complete") {
                    if (node2.readyState === "loading" && iIEtimeoutCount) {
                        iIEtimeoutCount -= 1;
                        var iTimeout = 200; // some delay
                        Utils.console.error("onScriptReadyStateChange: Still loading: " + sFullUrl + " Waiting " + iTimeout + "ms (count=" + iIEtimeoutCount + ")");
                        setTimeout(function () {
                            onScriptReadyStateChange(undefined); // check again
                        }, iTimeout);
                    }
                    else {
                        // iIEtimeoutCount = 3;
                        Utils.console.error("onScriptReadyStateChange: Cannot load file " + sFullUrl + " readystate=" + node2.readyState);
                        fnError(sFullUrl, sKey);
                    }
                }
                else {
                    fnSuccess(sFullUrl, sKey);
                }
            };
            if (script.readyState) { // old IE8
                iIEtimeoutCount = 3;
                script.attachEvent("onreadystatechange", onScriptReadyStateChange);
            }
            else { // Others
                script.addEventListener("load", onScriptLoad, false);
                script.addEventListener("error", onScriptLoad, false);
            }
            document.getElementsByTagName("head")[0].appendChild(script);
        };
        Utils.loadScript = function (sUrl, fnSuccess, fnError, sKey) {
            var script = document.createElement("script");
            script.type = "text/javascript";
            script.charset = "utf-8";
            script.async = true;
            script.src = sUrl;
            script.setAttribute("data-key", sKey);
            this.fnLoadScriptOrStyle(script, fnSuccess, fnError);
        };
        Utils.hexEscape = function (str) {
            return str.replace(/[\x00-\x1f]/g, function (sChar) {
                return "\\x" + ("00" + sChar.charCodeAt(0).toString(16)).slice(-2);
            });
        };
        Utils.hexUnescape = function (str) {
            return str.replace(/\\x([0-9A-Fa-f]{2})/g, function () {
                return String.fromCharCode(parseInt(arguments[1], 16));
            });
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
        Utils.testIsSupported = function (sTestExpression) {
            try {
                Function(sTestExpression); // eslint-disable-line no-new-func
            }
            catch (e) {
                return false;
            }
            return true;
        };
        Utils.stringTrimEnd = function (sStr) {
            return sStr.replace(/[\s\uFEFF\xA0]+$/, "");
        };
        Utils.isCustomError = function (e) {
            return e.pos !== undefined;
        };
        Utils.composeError = function (name, oErrorObject, message, value, pos, len, line, hidden) {
            var oCustomError = oErrorObject;
            oCustomError.name = name;
            oCustomError.message = message;
            oCustomError.value = value;
            oCustomError.pos = pos;
            if (len !== undefined) {
                oCustomError.len = len;
            }
            if (line !== undefined) {
                oCustomError.line = line;
            }
            if (hidden !== undefined) {
                oCustomError.hidden = hidden;
            }
            var iLen = oCustomError.len;
            if (iLen === undefined && oCustomError.value !== undefined) {
                iLen = String(oCustomError.value).length;
            }
            var iEndPos = oCustomError.pos + (iLen || 0);
            oCustomError.shortMessage = oCustomError.message + (oCustomError.line !== undefined ? " in " + oCustomError.line : " at pos " + oCustomError.pos + "-" + iEndPos) + ": " + oCustomError.value;
            oCustomError.message += (oCustomError.line !== undefined ? " in " + oCustomError.line : "") + " at pos " + oCustomError.pos + "-" + iEndPos + ": " + oCustomError.value;
            return oCustomError;
        };
        Utils.debug = 0;
        Utils.console = (function () {
            return typeof window !== "undefined" ? window.console : globalThis.console; // browser or node.js
        }());
        Utils.bSupportsBinaryLiterals = Utils.testIsSupported("0b01"); // does the browser support binary literals?
        Utils.bSupportReservedNames = Utils.testIsSupported("({}).return()"); // does the browser support reserved names (delete, new, return) in dot notation? (not old IE8; "goto" is ok)
        Utils.localStorage = (function () {
            var rc;
            if (typeof window !== "undefined") {
                try {
                    rc = window.localStorage; // due to a bug in MS Edge this will throw an error when hosting locally (https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/8816771/)
                }
                catch (_e) {
                    // empty
                }
            }
            return rc; // if it is undefined, localStorage is set in Polyfills
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
});
//# sourceMappingURL=Utils.js.map