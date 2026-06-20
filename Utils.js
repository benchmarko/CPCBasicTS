// Utils.ts - Utililities for CPCBasic
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//
export class Utils {
    static setDebug(debug) {
        Utils.debug = debug;
    }
    static hexEscape(str) {
        return str.replace(/[\x00-\x1f]/g, function (char) {
            return "\\x" + ("00" + char.charCodeAt(0).toString(16)).slice(-2);
        });
    }
    static dateFormat(d) {
        return d.getFullYear() + "/" + ("0" + (d.getMonth() + 1)).slice(-2) + "/" + ("0" + d.getDate()).slice(-2) + " "
            + ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2) + ":" + ("0" + d.getSeconds()).slice(-2) + "." + ("0" + d.getMilliseconds()).slice(-3);
    }
    static stringCapitalize(str) {
        return str.charAt(0).toUpperCase() + str.substring(1);
    }
    static numberWithCommas(x) {
        // https://stackoverflow.com/questions/2901102/how-to-print-a-number-with-commas-as-thousands-separators-in-javascript
        const parts = String(x).split(".");
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return parts.join(".");
    }
    static toRadians(deg) {
        return deg * Math.PI / 180;
    }
    static toDegrees(rad) {
        return rad * 180 / Math.PI;
    }
    static toPrecision9(num) {
        const numStr = num.toPrecision(9), // some rounding, formatting
        [decimal, exponent] = numStr.split("e"), // eslint-disable-line array-element-newline
        result = String(Number(decimal)) + (exponent !== undefined ? ("E" + exponent.replace(/(\D)(\d)$/, "$10$2")) : "");
        // Number(): strip trailing decimal point and/or zeros (replace(/\.?0*$/, ""))
        // exponent 1 digit to 2 digits
        return result;
    }
    static testIsSupported(testExpression) {
        try {
            Function(testExpression); // eslint-disable-line no-new-func
        }
        catch (_e) {
            return false;
        }
        return true;
    }
    static stringTrimEnd(str) {
        return str.replace(/[\s\uFEFF\xA0]+$/, "");
    }
    static isCustomError(e) {
        return e.pos !== undefined;
    }
    static split2(str, char) {
        const index = str.indexOf(char);
        return index >= 0 ? [str.slice(0, index), str.slice(index + 1)] : [str]; // eslint-disable-line array-element-newline
    }
    static string2Uint8Array(data) {
        const buf = new ArrayBuffer(data.length), view = new Uint8Array(buf);
        for (let i = 0; i < data.length; i += 1) {
            view[i] = data.charCodeAt(i);
        }
        return view;
    }
    static uint8Array2string(data) {
        const callSize = 25000; // use call window to avoid "maximum call stack error" for e.g. size 336461
        let len = data.length, offset = 0, out = "";
        while (len) {
            const chunkLen = Math.min(len, callSize), chunk = data.slice ? data.slice(offset, offset + chunkLen) : data.subarray(offset, offset + chunkLen); // array.slice on Uint8Array not for IE11
            out += String.fromCharCode.apply(null, chunk); // on Chrome this is faster than single character processing
            offset += chunkLen;
            len -= chunkLen;
        }
        return out;
    }
    static composeError(name, errorObject, message, value, pos, len, line, hidden) {
        const customError = errorObject;
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
        let errorLen = customError.len;
        if (errorLen === undefined && customError.value !== undefined) {
            errorLen = String(customError.value).length;
        }
        const endPos = (customError.pos || 0) + (errorLen || 0), lineMsg = (customError.line !== undefined ? " in " + customError.line : ""), posMsg = pos !== undefined ? (" at pos " + (pos !== endPos ? customError.pos + "-" + endPos : customError.pos)) : "";
        customError.shortMessage = customError.message + (lineMsg || posMsg) + ": " + customError.value;
        customError.message += lineMsg + posMsg + ": " + customError.value;
        return customError;
    }
    static composeVmError(name, errorObject, errCode, value) {
        const customError = Utils.composeError(name, errorObject, String(errCode), value);
        customError.errCode = errCode;
        return customError;
    }
}
Utils.debug = 0;
Utils.console = console; //typeof globalThis !== "undefined" ? globalThis.console : undefined;
Utils.supportsBinaryLiterals = Utils.testIsSupported("0b01"); // does the browser support binary literals?
Utils.supportReservedNames = Utils.testIsSupported("({}).return()"); // does the browser support reserved names (delete, new, return) in dot notation? (not old IE8; "goto" is ok)
//# sourceMappingURL=Utils.js.map