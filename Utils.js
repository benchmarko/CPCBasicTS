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
            var ieTimeoutCount = 3; // IE timeout count
            var onScriptLoad = function (event) {
                var type = event.type, // "load" or "error"
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
                var node = (event ? (event.currentTarget || event.srcElement) : script), fullUrl = node.src || node.href, // src for script, href for link
                key = node.getAttribute("data-key"), node2 = node;
                if (node2.detachEvent) {
                    node2.detachEvent("onreadystatechange", onScriptReadyStateChange);
                }
                if (Utils.debug > 1) {
                    Utils.console.debug("onScriptReadyStateChange: " + fullUrl);
                }
                // check also: https://stackoverflow.com/questions/1929742/can-script-readystate-be-trusted-to-detect-the-end-of-dynamic-script-loading
                if (node2.readyState !== "loaded" && node2.readyState !== "complete") {
                    if (node2.readyState === "loading" && ieTimeoutCount) {
                        ieTimeoutCount -= 1;
                        var timeout = 200; // some delay
                        Utils.console.error("onScriptReadyStateChange: Still loading: " + fullUrl + " Waiting " + timeout + "ms (count=" + ieTimeoutCount + ")");
                        setTimeout(function () {
                            onScriptReadyStateChange(); // check again
                        }, timeout);
                    }
                    else {
                        // ieTimeoutCount = 3;
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
            else { // Others
                script.addEventListener("load", onScriptLoad, false);
                script.addEventListener("error", onScriptLoad, false);
            }
            document.getElementsByTagName("head")[0].appendChild(script);
        };
        Utils.loadScript = function (url, fnSuccess, fnError, key) {
            var script = document.createElement("script");
            script.type = "text/javascript";
            script.charset = "utf-8";
            script.async = true;
            script.src = url;
            script.setAttribute("data-key", key);
            this.fnLoadScriptOrStyle(script, fnSuccess, fnError);
        };
        Utils.hexEscape = function (str) {
            return str.replace(/[\x00-\x1f]/g, function (char) {
                return "\\x" + ("00" + char.charCodeAt(0).toString(16)).slice(-2);
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
            var parts = String(x).split(".");
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            return parts.join(".");
        };
        Utils.toRadians = function (deg) {
            return deg * Math.PI / 180;
        };
        Utils.toDegrees = function (rad) {
            return rad * 180 / Math.PI;
        };
        Utils.testIsSupported = function (testExpression) {
            try {
                Function(testExpression); // eslint-disable-line no-new-func
            }
            catch (e) {
                return false;
            }
            return true;
        };
        Utils.stringTrimEnd = function (str) {
            return str.replace(/[\s\uFEFF\xA0]+$/, "");
        };
        Utils.isCustomError = function (e) {
            return e.pos !== undefined;
        };
        Utils.composeError = function (name, errorObject, message, value, pos, len, line, hidden) {
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
            if (line !== undefined) {
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
        Utils.debug = 0;
        Utils.console = (function () {
            return typeof window !== "undefined" ? window.console : globalThis.console; // browser or node.js
        }());
        Utils.supportsBinaryLiterals = Utils.testIsSupported("0b01"); // does the browser support binary literals?
        Utils.supportReservedNames = Utils.testIsSupported("({}).return()"); // does the browser support reserved names (delete, new, return) in dot notation? (not old IE8; "goto" is ok)
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