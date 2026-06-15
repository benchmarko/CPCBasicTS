// Utils.ts - Utililities for CPCBasic
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//
var Utils = /** @class */ (function () {
    function Utils() {
    }
    Utils.setDebug = function (debug) {
        Utils.debug = debug;
    };
    Utils.hexEscape = function (str) {
        return str.replace(/[\x00-\x1f]/g, function (char) {
            return "\\x" + ("00" + char.charCodeAt(0).toString(16)).slice(-2);
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
    Utils.toPrecision9 = function (num) {
        var numStr = num.toPrecision(9), // some rounding, formatting
        _a = numStr.split("e"), decimal = _a[0], exponent = _a[1], // eslint-disable-line array-element-newline
        result = String(Number(decimal)) + (exponent !== undefined ? ("E" + exponent.replace(/(\D)(\d)$/, "$10$2")) : "");
        // Number(): strip trailing decimal point and/or zeros (replace(/\.?0*$/, ""))
        // exponent 1 digit to 2 digits
        return result;
    };
    Utils.testIsSupported = function (testExpression) {
        try {
            Function(testExpression); // eslint-disable-line no-new-func
        }
        catch (_e) {
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
    Utils.split2 = function (str, char) {
        var index = str.indexOf(char);
        return index >= 0 ? [str.slice(0, index), str.slice(index + 1)] : [str]; // eslint-disable-line array-element-newline
    };
    Utils.string2Uint8Array = function (data) {
        var buf = new ArrayBuffer(data.length), view = new Uint8Array(buf);
        for (var i = 0; i < data.length; i += 1) {
            view[i] = data.charCodeAt(i);
        }
        return view;
    };
    Utils.uint8Array2string = function (data) {
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
    Utils.composeVmError = function (name, errorObject, errCode, value) {
        var customError = Utils.composeError(name, errorObject, String(errCode), value);
        customError.errCode = errCode;
        return customError;
    };
    Utils.debug = 0;
    Utils.console = console;
    Utils.supportsBinaryLiterals = Utils.testIsSupported("0b01"); // does the browser support binary literals?
    Utils.supportReservedNames = Utils.testIsSupported("({}).return()"); // does the browser support reserved names (delete, new, return) in dot notation? (not old IE8; "goto" is ok)
    return Utils;
}());
export { Utils };
//# sourceMappingURL=Utils.js.map