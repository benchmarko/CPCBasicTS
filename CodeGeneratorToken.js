"use strict";
// CodeGeneratorToken.ts - Code Generator for BASIC (for testing, pretty print?)
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//
//
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeGeneratorToken = void 0;
var Utils_1 = require("./Utils");
var BasicParser_1 = require("./BasicParser"); // BasicParser just for keyword definitions
var CodeGeneratorToken = /** @class */ (function () {
    function CodeGeneratorToken(options) {
        this.iLine = 0; // current line (label)
        /* eslint-disable no-invalid-this */
        this.mParseFunctions = {
            ";": CodeGeneratorToken.semicolon,
            letter: CodeGeneratorToken.letter,
            range: this.range,
            linerange: this.linerange,
            string: CodeGeneratorToken.string,
            "null": CodeGeneratorToken.fnNull,
            assign: this.assign,
            number: CodeGeneratorToken.number,
            binnumber: CodeGeneratorToken.binnumber,
            hexnumber: CodeGeneratorToken.hexnumber,
            identifier: this.identifier,
            linenumber: CodeGeneratorToken.linenumber,
            label: this.label,
            "|": this.vertical,
            afterGosub: this.afterGosub,
            chainMerge: this.chainMerge,
            data: this.data,
            def: this.def,
            "else": this.else,
            ent: this.ent,
            env: this.env,
            everyGosub: this.everyGosub,
            fn: this.fn,
            "for": this.for,
            "if": this.if,
            input: this.input,
            lineInput: this.lineInput,
            list: this.list,
            mid$Assign: this.mid$Assign,
            onErrorGoto: this.onErrorGoto,
            onGosub: this.onGosub,
            onGoto: this.onGoto,
            onSqGosub: this.onSqGosub,
            print: this.print,
            rem: this.rem,
            using: this.using
        };
        this.lexer = options.lexer;
        this.parser = options.parser;
    }
    CodeGeneratorToken.prototype.composeError = function (oError, message, value, pos) {
        return Utils_1.Utils.composeError("CodeGeneratorToken", oError, message, value, pos, this.iLine);
    };
    CodeGeneratorToken.convUInt8ToString = function (n) {
        return String.fromCharCode(n);
    };
    CodeGeneratorToken.convUInt16ToString = function (n) {
        return String.fromCharCode(n & 0xff) + String.fromCharCode(n >> 8); // eslint-disable-line no-bitwise
    };
    CodeGeneratorToken.convInt32ToString = function (n) {
        return CodeGeneratorToken.convUInt16ToString(n & 0xffff) + CodeGeneratorToken.convUInt16ToString((n >> 16) & 0xffff); // eslint-disable-line no-bitwise
    };
    CodeGeneratorToken.token2String = function (sName) {
        var iToken = CodeGeneratorToken.mTokens[sName], sResult = "";
        if (iToken === undefined) {
            iToken = CodeGeneratorToken.mTokensFF[sName];
            if (iToken === undefined) {
                Utils_1.Utils.console.warn("token2String: Not a token: " + sName);
                return sName; //TTT
            }
            sResult = CodeGeneratorToken.convUInt8ToString(0xff); // prefix for special tokens
        }
        sResult += (iToken <= 255) ? CodeGeneratorToken.convUInt8ToString(iToken) : CodeGeneratorToken.convUInt16ToString(iToken);
        return sResult;
    };
    CodeGeneratorToken.getBit7TerminatedString = function (s) {
        return s.substr(0, s.length - 1) + String.fromCharCode(s.charCodeAt(s.length - 1) | 0x80); // eslint-disable-line no-bitwise
    };
    CodeGeneratorToken.prototype.fnParseOneArg = function (oArg) {
        var sValue = this.parseNode(oArg); // eslint-disable-line no-use-before-define
        return sValue;
    };
    CodeGeneratorToken.prototype.fnParseArgs = function (aArgs) {
        var aNodeArgs = []; // do not modify node.args here (could be a parameter of defined function)
        if (!aArgs) {
            throw this.composeError(Error(), "Programming error: Undefined args", "", -1); // should not occure TTT
        }
        for (var i = 0; i < aArgs.length; i += 1) {
            var sValue = this.fnParseOneArg(aArgs[i]);
            //if (sValue.length > 0) { //TTT
            if (!(i === 0 && sValue === "#" && aArgs[i].type === "#")) { // ignore empty stream as first argument (hmm, not for e.g. data!)
                aNodeArgs.push(sValue);
            }
            //}
        }
        return aNodeArgs;
    };
    CodeGeneratorToken.semicolon = function (node) {
        return node.value; // ";"
    };
    CodeGeneratorToken.letter = function (node) {
        return node.value;
    };
    CodeGeneratorToken.prototype.range = function (node) {
        if (!node.left || !node.right) {
            throw this.composeError(Error(), "Programming error: Undefined left or right", node.type, node.pos); // should not occure
        }
        var sLeft = this.fnParseOneArg(node.left), sRight = this.fnParseOneArg(node.right);
        return sLeft + "-" + sRight;
    };
    CodeGeneratorToken.prototype.linerange = function (node) {
        if (!node.left || !node.right) {
            throw this.composeError(Error(), "Programming error: Undefined left or right", node.type, node.pos); // should not occure
        }
        var sLeft = this.fnParseOneArg(node.left), sRight = this.fnParseOneArg(node.right);
        return sLeft + CodeGeneratorToken.token2String("-") + sRight;
    };
    CodeGeneratorToken.fnDecodeEscapeSequence = function (str) {
        return str.replace(/\\x([0-9A-Fa-f]{2})/g, function () {
            return String.fromCharCode(parseInt(arguments[1], 16));
        });
    };
    CodeGeneratorToken.string = function (node) {
        var sValue = CodeGeneratorToken.fnDecodeEscapeSequence(node.value);
        sValue = sValue.replace(/\\\\/g, "\\"); // unescape backslashes
        return '"' + sValue + '"'; //TTT how to set unterminated string?
    };
    CodeGeneratorToken.fnNull = function () {
        return "";
    };
    CodeGeneratorToken.prototype.assign = function (node) {
        // see also "let"
        if (!node.left || !node.right) {
            throw this.composeError(Error(), "Programming error: Undefined left or right", node.type, node.pos); // should not occure
        }
        if (node.left.type !== "identifier") {
            throw this.composeError(Error(), "Unexpected assing type", node.type, node.pos); // should not occur
        }
        var sValue = this.fnParseOneArg(node.left) + CodeGeneratorToken.token2String("=") + this.fnParseOneArg(node.right);
        return sValue;
    };
    CodeGeneratorToken.floatToByteString = function (iNumber) {
        var iMantissa = 0, iExponent = 0, iSign = 0;
        if (iNumber !== 0) {
            if (iNumber < 0) {
                iSign = 0x80000000;
                iNumber = -iNumber;
            }
            iExponent = Math.ceil(Math.log(iNumber) / Math.log(2));
            iMantissa = Math.round(iNumber / Math.pow(2, iExponent - 32)) & ~0x80000000; // eslint-disable-line no-bitwise
            iExponent += 0x80;
        }
        var sBytes = CodeGeneratorToken.convInt32ToString(iSign + iMantissa) + CodeGeneratorToken.convUInt8ToString(iExponent);
        // sBytes.split("").map(function(s) { return s.charCodeAt(0).toString(16)})
        return sBytes;
    };
    /*
    private static floatToByteString(value: number) {
        let bytes = 0,
            exponent = 0,
            significand;

        switch (value) {
        case Number.POSITIVE_INFINITY: bytes = 0x7F800000;
            break;
        case Number.NEGATIVE_INFINITY: bytes = 0xFF800000;
            break;
        case +0.0: bytes = 0x40000000;
            break;
        case -0.0: bytes = 0xC0000000;
            break;
        default:
            if (Number.isNaN(value)) {
                bytes = 0x7FC00000;
                break;
            }

            if (value <= 0.0) { // -0.0
                bytes = 0x80000000;
                value = -value;
            }

            exponent = Math.floor(Math.log(value) / Math.log(2));
            //significand = ((value / Math.pow(2, exponent)) * 0x00800000) | 0; // eslint-disable-line no-bitwise
            significand = ((value / Math.pow(2, exponent)) * 0x08000000) | 0; // eslint-disable-line no-bitwise

            //exponent += 127;
            exponent += 0x81;
            if (exponent >= 0xFF) {
                exponent = 0xFF;
                significand = 0;
            } else if (exponent < 0) {
                exponent = 0;
            }

            //bytes |= (exponent << 23); // eslint-disable-line no-bitwise
            bytes |= (significand & ~(-1 << 31)); // eslint-disable-line no-bitwise
            break;
        }
        / *
        const aBytes = [
            (bytes >> 24),
            (bytes >> 16) & 0xff,
            (bytes >> 8) & 0xff,
            bytes & 0xff
        ];
        * /

        const aBytes = CodeGeneratorToken.convInt32ToString(bytes) + CodeGeneratorToken.convUInt8ToString(exponent);

        return aBytes;
        //return bytes;
    }
    */
    /*
    private static fpToByteString(iNumber: number) {
        let sBinString = iNumber.toString(2), // binstring
            sResult;

        sResult = sBinString;
        return sResult;
    }
    */
    CodeGeneratorToken.number = function (node) {
        var sNumber = node.value.toUpperCase(), // maybe "e" inside
        iNumber = Number(sNumber);
        var sResult = "";
        if (iNumber === Math.floor(iNumber)) { // integer?
            if (iNumber >= 0 && iNumber <= 9) { // integer number constant 0-9? (not sure when 10 is used)
                sResult = CodeGeneratorToken.token2String(sNumber);
            }
            else if (iNumber >= 10) {
                if (iNumber <= 0xff) {
                    sResult = CodeGeneratorToken.token2String("_dec8") + CodeGeneratorToken.convUInt8ToString(iNumber);
                }
                else if (iNumber <= 0xffff) {
                    sResult = CodeGeneratorToken.token2String("_dec16") + CodeGeneratorToken.convUInt16ToString(iNumber);
                }
            }
        }
        if (sResult === "") { // no integer number yet, use float...
            sResult = CodeGeneratorToken.token2String("_float") + CodeGeneratorToken.floatToByteString(iNumber);
        }
        return sResult;
    };
    CodeGeneratorToken.binnumber = function (node) {
        var sValue = node.value.slice(2), // remove &x
        iValue = (sValue.length) ? parseInt(sValue, 2) : 0; // we convert it to dec
        return CodeGeneratorToken.token2String("_bin16") + CodeGeneratorToken.convUInt16ToString(iValue);
    };
    CodeGeneratorToken.hexnumber = function (node) {
        var sValue = node.value.slice(1); // remove &
        if (sValue.charAt(0).toLowerCase() === "h") { // optional h
            sValue = sValue.slice(1); // remove
        }
        var iValue = (sValue.length) ? parseInt(sValue, 16) : 0; // we convert it to dec
        return CodeGeneratorToken.token2String("_hex16") + CodeGeneratorToken.convUInt16ToString(iValue);
    };
    CodeGeneratorToken.prototype.identifier = function (node) {
        var sName = node.value, // keep case, maybe mixed
        sResult;
        if (sName.endsWith("!")) { // real number?
            sName = sName.slice(0, -1);
            sResult = CodeGeneratorToken.token2String("_floatVar");
        }
        else if (sName.endsWith("%")) { // integer number?
            sName = sName.slice(0, -1);
            sResult = CodeGeneratorToken.token2String("_intVar");
        }
        else if (sName.endsWith("$")) { // string?
            sName = sName.slice(0, -1);
            sResult = CodeGeneratorToken.token2String("_stringVar");
        }
        else {
            sResult = CodeGeneratorToken.token2String("_anyVar");
        }
        sName = CodeGeneratorToken.getBit7TerminatedString(sName);
        if (node.args) { // args including brackets
            var aNodeArgs = this.fnParseArgs(node.args), sBracketOpen = aNodeArgs.shift(), sBracketClose = aNodeArgs.pop();
            sName += sBracketOpen + aNodeArgs.join(",") + sBracketClose;
        }
        var iOffset = 0; // (offset to memory location of variable; not used here)
        return sResult + CodeGeneratorToken.convUInt16ToString(iOffset) + sName;
    };
    CodeGeneratorToken.linenumber = function (node) {
        var iNumber = Number(node.value);
        return CodeGeneratorToken.token2String("_line16") + CodeGeneratorToken.convUInt16ToString(iNumber);
    };
    CodeGeneratorToken.prototype.label = function (node) {
        this.iLine = Number(node.value); // set line before parsing args
        var iLine = this.iLine, aNodeArgs = this.fnParseArgs(node.args);
        var sValue = aNodeArgs.join(CodeGeneratorToken.token2String(":")); // statement seperator ":"
        if (node.value !== "direct") {
            sValue = CodeGeneratorToken.convUInt16ToString(iLine) + sValue + CodeGeneratorToken.token2String("_eol");
            var iLen = sValue.length + 2;
            //"[DEBUG:" + iLine + "] " +
            sValue = CodeGeneratorToken.convUInt16ToString(iLen) + sValue;
        }
        return sValue;
    };
    // special keyword functions
    CodeGeneratorToken.prototype.vertical = function (node) {
        var sRsxName = node.value.substr(1).toUpperCase(), aNodeArgs = this.fnParseArgs(node.args), iOffset = 0; // (offset to tokens following RSX name) TODO
        var sValue = CodeGeneratorToken.token2String(node.type) + CodeGeneratorToken.convUInt8ToString(iOffset) + CodeGeneratorToken.getBit7TerminatedString(sRsxName);
        if (aNodeArgs.length) {
            sValue += "," + aNodeArgs.join(",");
        }
        return sValue;
    };
    CodeGeneratorToken.prototype.afterGosub = function (node) {
        var aNodeArgs = this.fnParseArgs(node.args);
        var sValue = CodeGeneratorToken.token2String("after") + aNodeArgs[0];
        if (aNodeArgs[1]) {
            sValue += "," + aNodeArgs[1];
        }
        sValue += CodeGeneratorToken.token2String("gosub") + aNodeArgs[2];
        return sValue;
    };
    CodeGeneratorToken.prototype.chainMerge = function (node) {
        var aNodeArgs = this.fnParseArgs(node.args);
        //sTypeUc = CodeGeneratorToken.mCombinedKeywords[node.type] || node.type.toUpperCase(); //TTT
        var sValue = CodeGeneratorToken.token2String(node.type);
        if (aNodeArgs.length === 3) {
            aNodeArgs[2] = CodeGeneratorToken.token2String("delete") + aNodeArgs[2];
        }
        sValue += aNodeArgs.join(",");
        return sValue;
    };
    CodeGeneratorToken.prototype.data = function (node) {
        var aNodeArgs = this.fnParseArgs(node.args), regExp = new RegExp(":|,|^ +| +$|\\|"); // separator or comma or spaces at end or beginning, or "|" which is corrupted on CPC
        for (var i = 0; i < aNodeArgs.length; i += 1) {
            var sValue2 = aNodeArgs[i];
            if (sValue2) {
                sValue2 = sValue2.substr(1, sValue2.length - 2); // remove surrounding quotes
                sValue2 = sValue2.replace(/\\"/g, "\""); // unescape "
                if (sValue2) {
                    if (regExp.test(sValue2)) {
                        sValue2 = '"' + sValue2 + '"';
                    }
                }
            }
            aNodeArgs[i] = sValue2;
        }
        var sValue = aNodeArgs.join(",");
        if (sValue !== "" && sValue !== "," && sValue !== '"') { // argument?
            sValue = " " + sValue;
        }
        sValue = CodeGeneratorToken.token2String(node.type) + sValue;
        return sValue;
    };
    CodeGeneratorToken.prototype.def = function (node) {
        if (!node.left || !node.right) {
            throw this.composeError(Error(), "Programming error: Undefined left or right", node.type, node.pos); // should not occure
        }
        var sWithFn = node.left.value, sWithoutFn = sWithFn.substr(2); // remove first 2 characters "FN" or "fn"
        node.left.value = sWithoutFn; // fast hack: without fn
        var sName = this.fnParseOneArg(node.left);
        node.left.value = sWithFn; // fast hack: restore
        var sSpace = node.left.bSpace ? " " : "", // fast hack
        aNodeArgs = this.fnParseArgs(node.args), sExpression = this.fnParseOneArg(node.right);
        var sNodeArgs = aNodeArgs.join(",");
        if (sNodeArgs !== "") { // not empty?
            sNodeArgs = "(" + sNodeArgs + ")";
        }
        /*
        const sName2 = sSpace.length ? sName.replace("FN", "FN ") : sName,
            sValue = CodeGeneratorToken.token2String(node.type) + " " + sName2 + sNodeArgs + "=" + sExpression;
        */
        var sValue = CodeGeneratorToken.token2String(node.type) + " " + CodeGeneratorToken.token2String("fn") + sSpace + sName + sNodeArgs + CodeGeneratorToken.token2String("=") + sExpression;
        return sValue;
    };
    CodeGeneratorToken.prototype["else"] = function (node) {
        if (!node.args) {
            throw this.composeError(Error(), "Programming error: Undefined args", "", -1); // should not occure
        }
        var aArgs = node.args;
        var sValue = CodeGeneratorToken.token2String(node.type);
        for (var i = 0; i < aArgs.length; i += 1) {
            var oToken = aArgs[i];
            if (oToken.value) {
                sValue += " " + oToken.value;
            }
        }
        // TODO: whitespaces?
        return sValue;
    };
    CodeGeneratorToken.prototype.ent = function (node) {
        if (!node.args) {
            throw this.composeError(Error(), "Programming error: Undefined args", "", -1); // should not occure
        }
        var aArgs = node.args, aNodeArgs = [];
        var bEqual = false;
        for (var i = 0; i < aArgs.length; i += 1) {
            if (aArgs[i].type !== "null") {
                var sArg = this.fnParseOneArg(aArgs[i]);
                if (bEqual) {
                    sArg = "=" + sArg;
                    bEqual = false;
                }
                aNodeArgs.push(sArg);
            }
            else {
                bEqual = true;
            }
        }
        var sValue = CodeGeneratorToken.token2String(node.type) + " " + aNodeArgs.join(",");
        return sValue;
    };
    CodeGeneratorToken.prototype.env = function (node) {
        return this.ent(node);
    };
    CodeGeneratorToken.prototype.everyGosub = function (node) {
        var aNodeArgs = this.fnParseArgs(node.args);
        var sValue = CodeGeneratorToken.token2String("every") + aNodeArgs[0];
        if (aNodeArgs[1]) {
            sValue += "," + aNodeArgs[1];
        }
        sValue += CodeGeneratorToken.token2String("gosub") + aNodeArgs[2];
        return sValue;
    };
    CodeGeneratorToken.prototype.fn = function (node) {
        if (!node.left) {
            throw this.composeError(Error(), "Programming error: Undefined left", node.type, node.pos); // should not occure
        }
        var aNodeArgs = this.fnParseArgs(node.args), sName = this.fnParseOneArg(node.left).replace("FN", ""), // get identifier without FN
        sSpace = node.left.bSpace ? " " : ""; // fast hack
        var sNodeArgs = aNodeArgs.join(",");
        if (sNodeArgs !== "") { // not empty?
            sNodeArgs = "(" + sNodeArgs + ")";
        }
        var sName2 = CodeGeneratorToken.token2String(node.type) + sSpace + sName, sValue = sName2 + sNodeArgs;
        return sValue;
    };
    CodeGeneratorToken.prototype["for"] = function (node) {
        var aNodeArgs = this.fnParseArgs(node.args), sVarName = aNodeArgs[0], startValue = aNodeArgs[1], endValue = aNodeArgs[2], stepValue = aNodeArgs[3];
        var sValue = CodeGeneratorToken.token2String(node.type) + sVarName + CodeGeneratorToken.token2String("=") + startValue + CodeGeneratorToken.token2String("to") + endValue;
        if (stepValue !== "") { // "null" is "" //TTT or: node.args[3].type === "null"
            sValue += CodeGeneratorToken.token2String("step") + stepValue;
        }
        return sValue;
    };
    CodeGeneratorToken.prototype["if"] = function (node) {
        if (!node.left) {
            throw this.composeError(Error(), "Programming error: Undefined left", node.type, node.pos); // should not occure
        }
        if (!node.args) {
            throw this.composeError(Error(), "Programming error: Undefined args", node.type, node.pos); // should not occure
        }
        var sValue = CodeGeneratorToken.token2String(node.type) + this.fnParseOneArg(node.left) + CodeGeneratorToken.token2String("then");
        var oNodeBranch = node.args, aNodeArgs = this.fnParseArgs(oNodeBranch); // args for "then"
        if (oNodeBranch.length && oNodeBranch[0].type === "goto" && oNodeBranch[0].len === 0) { // inserted goto?
            aNodeArgs[0] = this.fnParseOneArg(oNodeBranch[0].args[0]); // take just line number
        }
        sValue += aNodeArgs.join(CodeGeneratorToken.token2String(":"));
        if (node.args2) {
            sValue += CodeGeneratorToken.token2String(":") + CodeGeneratorToken.token2String("else"); // ":" before "else"!
            var oNodeBranch2 = node.args2, aNodeArgs2 = this.fnParseArgs(oNodeBranch2); // args for "else"
            if (oNodeBranch2.length && oNodeBranch2[0].type === "goto" && oNodeBranch2[0].len === 0) { // inserted goto?
                aNodeArgs2[0] = this.fnParseOneArg(oNodeBranch2[0].args[0]); // take just line number
            }
            sValue += aNodeArgs2.join(CodeGeneratorToken.token2String(":"));
        }
        return sValue;
    };
    CodeGeneratorToken.prototype.input = function (node) {
        var aNodeArgs = this.fnParseArgs(node.args), 
        //sTypeUc = CodeGeneratorToken.mCombinedKeywords[node.type] || node.type.toUpperCase(), //TTT
        bHasStream = aNodeArgs.length && (String(aNodeArgs[0]).charAt(0) === "#");
        var sValue = CodeGeneratorToken.token2String(node.type), i = 0;
        if (bHasStream) { // stream?
            i += 1;
        }
        if (aNodeArgs.length && !bHasStream && String(aNodeArgs[0]).charAt(0) !== '"') {
            // TODO: empty CRLF marker
            sValue += " ";
        }
        aNodeArgs.splice(i, 4, aNodeArgs[i] + aNodeArgs[i + 1] + aNodeArgs[i + 2] + aNodeArgs[i + 3]); // combine 4 elements into one
        sValue += aNodeArgs.join(",");
        return sValue;
    };
    CodeGeneratorToken.prototype.lineInput = function (node) {
        return this.input(node);
    };
    CodeGeneratorToken.prototype.list = function (node) {
        var aNodeArgs = this.fnParseArgs(node.args);
        if (aNodeArgs.length && aNodeArgs[0] === "") { // empty range?
            aNodeArgs.shift(); // remove
        }
        if (aNodeArgs.length && aNodeArgs[aNodeArgs.length - 1] === "#") { // dummy stream?
            aNodeArgs.pop(); // remove
        }
        var sValue = aNodeArgs.join(",");
        var sName = CodeGeneratorToken.token2String(node.type);
        /*
        if (sValue !== "") { // argument?
            sName += " ";
        }
        */
        sValue = sName + sValue;
        return sValue;
    };
    CodeGeneratorToken.prototype.mid$Assign = function (node) {
        if (!node.right) {
            throw this.composeError(Error(), "Programming error: Undefined right", "", -1); // should not occure TTT
        }
        var aNodeArgs = this.fnParseArgs(node.args), 
        //sTypeUc = CodeGeneratorToken.mCombinedKeywords[node.type],
        sValue = CodeGeneratorToken.token2String(node.type) + "(" + aNodeArgs.join(",") + ")" + CodeGeneratorToken.token2String("=") + this.fnParseOneArg(node.right);
        return sValue;
    };
    CodeGeneratorToken.prototype.onErrorGoto = function (node) {
        var aNodeArgs = this.fnParseArgs(node.args);
        var sValue;
        if (node.args && node.args.length && node.args[0].value === "0") { // on error goto 0?
            sValue = CodeGeneratorToken.token2String("_onErrorGoto0");
        }
        else {
            sValue = CodeGeneratorToken.token2String("on") + CodeGeneratorToken.token2String("error") + CodeGeneratorToken.token2String("goto") + aNodeArgs.join(",");
        }
        return sValue;
    };
    CodeGeneratorToken.prototype.onGosub = function (node) {
        var aNodeArgs = this.fnParseArgs(node.args);
        var sValue = aNodeArgs.shift();
        sValue = CodeGeneratorToken.token2String("on") + sValue + CodeGeneratorToken.token2String("gosub") + aNodeArgs.join(",");
        return sValue;
    };
    CodeGeneratorToken.prototype.onGoto = function (node) {
        var aNodeArgs = this.fnParseArgs(node.args);
        var sValue = aNodeArgs.shift();
        sValue = CodeGeneratorToken.token2String("on") + sValue + CodeGeneratorToken.token2String("goto") + aNodeArgs.join(",");
        return sValue;
    };
    CodeGeneratorToken.prototype.onSqGosub = function (node) {
        var aNodeArgs = this.fnParseArgs(node.args), sValue = CodeGeneratorToken.token2String("_onSq") + "(" + aNodeArgs[0] + ")" + CodeGeneratorToken.token2String("gosub") + aNodeArgs[1];
        return sValue;
    };
    CodeGeneratorToken.prototype.print = function (node) {
        var regExp = new RegExp("[a-zA-Z0-9.]"), aNodeArgs = this.fnParseArgs(node.args), bHasStream = aNodeArgs.length && (String(aNodeArgs[0]).charAt(0) === "#"), sToken = node.value.toLowerCase(); // we use value to get PRINT or ?
        var sValue = CodeGeneratorToken.token2String(node.type); // print and ? are tokenized as print, or use sToken here to keep it different
        if (sToken === "print" && aNodeArgs.length && !bHasStream) { // PRINT with args and not stream?
            sValue += " ";
        }
        if (bHasStream && aNodeArgs.length > 1) { // more args after stream?
            aNodeArgs[0] = String(aNodeArgs[0]) + ",";
        }
        for (var i = 0; i < aNodeArgs.length; i += 1) {
            var sArg = String(aNodeArgs[i]);
            if (regExp.test(sValue.charAt(sValue.length - 1)) && regExp.test(sArg.charAt(0))) { // last character and first character of next arg: char, number, dot? (not for token "FN"??)
                sValue += " "; // additional space
            }
            sValue += aNodeArgs[i];
        }
        return sValue;
    };
    CodeGeneratorToken.prototype.rem = function (node) {
        var aNodeArgs = this.fnParseArgs(node.args);
        var sValue = aNodeArgs[0];
        if (sValue !== undefined) {
            sValue = sValue.substr(1, sValue.length - 2); // remove surrounding quotes
        }
        else {
            sValue = "";
        }
        var sToken = node.value.toLowerCase(); // use value; for "rem", "REM", "'"
        var sName = CodeGeneratorToken.token2String(sToken);
        if (sToken !== "'") { // not simple rem?
            if (sValue !== "") { // argument?
                sName += " ";
            }
        }
        sValue = sName + sValue;
        return sValue;
    };
    CodeGeneratorToken.prototype.using = function (node) {
        var aNodeArgs = this.fnParseArgs(node.args);
        var sTemplate = aNodeArgs.shift();
        if (sTemplate && sTemplate.charAt(0) !== '"') { // not a string => space required
            sTemplate = " " + sTemplate;
        }
        var sValue = CodeGeneratorToken.token2String(node.type) + sTemplate + ";" + aNodeArgs.join(","); // separator between args could be "," or ";", we use ","
        return sValue;
    };
    /* eslint-enable no-invalid-this */
    CodeGeneratorToken.prototype.fnParseOther = function (node) {
        var sType = node.type, sKeyType = BasicParser_1.BasicParser.mKeywords[sType];
        //sTypeUc = CodeGeneratorToken.mCombinedKeywords[sType] || sType.toUpperCase();
        var sValue = CodeGeneratorToken.token2String(sType), sArgs = "";
        if (node.left) {
            sArgs += this.fnParseOneArg(node.left);
        }
        if (!sKeyType) {
            if (node.value) { // e.g. string,...
                sArgs += node.value;
            }
        }
        if (node.right) {
            sArgs += this.fnParseOneArg(node.right);
        }
        if (node.args) {
            sArgs += this.fnParseArgs(node.args).join(",");
        }
        if (node.args2) { // ELSE part already handled
            throw this.composeError(Error(), "Programming error: args2", node.type, node.pos); // should not occur
        }
        //let sValue = CodeGeneratorToken.token2String(sTypeUc);
        //sValue += sArgs;
        // for e.g. tab, spc...
        if (sKeyType) {
            //sValue = sTypeUc;
            if (sArgs.length) {
                if (sKeyType.charAt(0) === "f") { // function with parameters?
                    sValue += "(" + sArgs + ")";
                }
                else {
                    if (sArgs.charAt(0) !== "#") { // only if not a stream
                        sValue += " ";
                    }
                    sValue += sArgs;
                }
            }
        }
        else {
            sValue = sArgs; // for e.g. string
            //sValue += sArgs; // for e.g. string //TTT
        }
        return sValue;
    };
    CodeGeneratorToken.prototype.parseNode = function (node) {
        if (Utils_1.Utils.debug > 3) {
            Utils_1.Utils.console.debug("evaluate: parseNode node=%o type=" + node.type + " value=" + node.value + " left=%o right=%o args=%o", node, node.left, node.right, node.args);
        }
        var sType = node.type, mPrecedence = CodeGeneratorToken.mOperatorPrecedence, mOperators = CodeGeneratorToken.mOperators;
        var value;
        if (mOperators[sType]) {
            if (node.left) {
                value = this.parseNode(node.left);
                if (mOperators[node.left.type] && (node.left.left || node.left.right)) { // binary operator (or unary operator, e.g. not)
                    var p = mPrecedence[node.type];
                    var pl = void 0;
                    if (node.left.left) { // left is binary
                        pl = mPrecedence[node.left.type] || 0;
                    }
                    else { // left is unary
                        pl = mPrecedence["p" + node.left.type] || mPrecedence[node.left.type] || 0;
                    }
                    if (pl < p) {
                        value = "(" + value + ")";
                    }
                }
                var oRight = node.right;
                var value2 = this.parseNode(oRight);
                if (mOperators[oRight.type] && (oRight.left || oRight.right)) { // binary operator (or unary operator, e.g. not)
                    var p = mPrecedence[node.type];
                    var pr = void 0;
                    if (oRight.left) { // right is binary
                        pr = mPrecedence[oRight.type] || 0;
                    }
                    else {
                        pr = mPrecedence["p" + oRight.type] || mPrecedence[oRight.type] || 0;
                    }
                    if ((pr < p) || ((pr === p) && node.type === "-")) { // "-" is special
                        value2 = "(" + value2 + ")";
                    }
                }
                value += CodeGeneratorToken.token2String(mOperators[sType]) + value2;
            }
            else { // unary operator
                var oRight = node.right;
                value = this.parseNode(oRight);
                var pr = void 0;
                if (oRight.left) { // was binary op?
                    pr = mPrecedence[oRight.type] || 0; // no special prio
                }
                else {
                    pr = mPrecedence["p" + oRight.type] || mPrecedence[oRight.type] || 0; // check unary operator first
                }
                var p = mPrecedence["p" + node.type] || mPrecedence[node.type] || 0; // check unary operator first
                if (p && pr && (pr < p)) {
                    value = "(" + value + ")";
                }
                /*
                if (sType === "#") { // stream?
                    if (value !== "") {
                        value = sType + value;
                    }
                } else {
                    value = CodeGeneratorToken.token2String(mOperators[sType]) + value;
                }
                */
                value = CodeGeneratorToken.token2String(mOperators[sType]) + value;
            }
        }
        else if (this.mParseFunctions[sType]) { // function with special handling?
            value = this.mParseFunctions[sType].call(this, node);
        }
        else { // for other functions, generate code directly
            value = this.fnParseOther(node);
        }
        return value;
    };
    CodeGeneratorToken.prototype.evaluate = function (parseTree) {
        var sOutput = "";
        for (var i = 0; i < parseTree.length; i += 1) {
            if (Utils_1.Utils.debug > 2) {
                Utils_1.Utils.console.debug("evaluate: parseTree i=%d, node=%o", i, parseTree[i]);
            }
            var sNode = this.parseNode(parseTree[i]);
            if ((sNode !== undefined) && (sNode !== "")) {
                if (sNode !== null) {
                    /*
                    if (sOutput.length === 0) {
                        sOutput = sNode;
                    } else {
                        sOutput += "\n" + sNode;
                    }
                    */
                    sOutput += sNode;
                }
                else {
                    sOutput = ""; // cls (clear output when sNode is set to null)
                }
            }
        }
        if (sOutput.length && this.iLine) {
            sOutput += CodeGeneratorToken.token2String("_eol") + CodeGeneratorToken.token2String("_eol"); // 2 times eol is eof
        }
        return sOutput;
    };
    CodeGeneratorToken.prototype.generate = function (sInput, bAllowDirect) {
        var oOut = {
            text: ""
        };
        this.iLine = 0;
        try {
            var aTokens = this.lexer.lex(sInput), aParseTree = this.parser.parse(aTokens, bAllowDirect), sOutput = this.evaluate(aParseTree);
            oOut.text = sOutput;
        }
        catch (e) {
            oOut.error = e;
            if ("pos" in e) {
                Utils_1.Utils.console.warn(e); // our errors have "pos" defined => show as warning
            }
            else { // other errors
                Utils_1.Utils.console.error(e);
            }
        }
        return oOut;
    };
    /*
    private static mCombinedKeywords: { [k: string]: string } = {
        chainMerge: "CHAIN MERGE",
        clearInput: "CLEAR INPUT",
        graphicsPaper: "GRAPHICS PAPER",
        graphicsPen: "GRAPHICS PEN",
        keyDef: "KEY DEF",
        lineInput: "LINE INPUT",
        mid$Assign: "MID$",
        onBreakCont: "ON BREAK CONT",
        onBreakGosub: "ON BREAK GOSUB",
        onBreakStop: "ON BREAK STOP",
        onErrorGoto: "ON ERROR GOTO",
        resumeNext: "RESUME NEXT",
        speedInk: "SPEED INK",
        speedKey: "SPEED KEY",
        speedWrite: "SPEED WRITE",
        symbolAfter: "SYMBOL AFTER",
        windowSwap: "WINDOW SWAP"
    }
    */
    CodeGeneratorToken.mOperators = {
        "+": "+",
        "-": "-",
        "*": "*",
        "/": "/",
        "\\": "\\",
        "^": "^",
        and: "and",
        or: "or",
        xor: "xor",
        not: "not",
        mod: "mod",
        ">": ">",
        "<": "<",
        ">=": ">=",
        "<=": "<=",
        "=": "=",
        "<>": "<>",
        "@": "@",
        "#": "#"
    };
    CodeGeneratorToken.mOperatorPrecedence = {
        "@": 95,
        "^": 90,
        "p-": 80,
        "p+": 80,
        "*": 70,
        "/": 70,
        "\\": 60,
        mod: 50,
        "+": 40,
        "-": 40,
        "=": 30,
        "<>": 30,
        "<": 30,
        "<=": 30,
        ">": 30,
        ">=": 30,
        not: 23,
        and: 22,
        or: 21,
        xor: 20,
        "#": 10 // priority?
    };
    CodeGeneratorToken.mTokens = {
        _eol: 0x00,
        ":": 0x01,
        _intVar: 0x02,
        _stringVar: 0x03,
        _floatVar: 0x04,
        // "": 0x05, // "var?"
        // "": 0x06, // "var?"
        // "": 0x07, // "var?"
        // "": 0x08, // "var?"
        // "": 0x09, // "var?"
        // "": 0x0a, // "var?"
        // "": 0x0b, // integer variable definition (no suffix)
        // "": 0x0c, // string variable definition (no suffix)
        _anyVar: 0x0d,
        0: 0x0e,
        1: 0x0f,
        2: 0x10,
        3: 0x11,
        4: 0x12,
        5: 0x13,
        6: 0x14,
        7: 0x15,
        8: 0x16,
        9: 0x17,
        10: 0x18,
        _dec8: 0x19,
        _dec16: 0x1a,
        _bin16: 0x1b,
        _hex16: 0x1c,
        // "": 0x1d, // 16-bit BASIC program line memory address pointer (should not occur)
        _line16: 0x1e,
        _float: 0x1f,
        // 0x20-0x21 ASCII printable symbols (space, "!")
        // "": 0x22, // '"' quoted string value
        // 0x23-0x7b ASCII printable symbols
        "#": 0x23,
        "(": 0x28,
        ")": 0x29,
        ",": 0x2c,
        "?": 0x3f,
        "@": 0x40,
        "[": 0x5b,
        "]": 0x5d,
        "|": 0x7c,
        after: 0x80,
        auto: 0x81,
        border: 0x82,
        call: 0x83,
        cat: 0x84,
        chain: 0x85,
        chainMerge: 0xab85,
        clear: 0x86,
        clearInput: 0xa386,
        clg: 0x87,
        closein: 0x88,
        closeout: 0x89,
        cls: 0x8a,
        cont: 0x8b,
        data: 0x8c,
        def: 0x8d,
        defint: 0x8e,
        defreal: 0x8f,
        defstr: 0x90,
        deg: 0x91,
        "delete": 0x92,
        dim: 0x93,
        draw: 0x94,
        drawr: 0x95,
        edit: 0x96,
        "else": 0x97,
        end: 0x98,
        ent: 0x99,
        env: 0x9a,
        erase: 0x9b,
        error: 0x9c,
        every: 0x9d,
        "for": 0x9e,
        gosub: 0x9f,
        "goto": 0xa0,
        "if": 0xa1,
        ink: 0xa2,
        input: 0xa3,
        key: 0xa4,
        keyDef: 0x8da4,
        let: 0xa5,
        line: 0xa6,
        lineInput: 0xa3a6,
        list: 0xa7,
        load: 0xa8,
        locate: 0xa9,
        memory: 0xaa,
        merge: 0xab,
        mid$: 0xac,
        mid$Assign: 0xac,
        mode: 0xad,
        move: 0xae,
        mover: 0xaf,
        next: 0xb0,
        "new": 0xb1,
        on: 0xb2,
        //"on break": 0xb3, // "on break"
        onBreakCont: 0x8bb3,
        onBreakGosub: 0x9fb3,
        onBreakStop: 0xceb3,
        _onErrorGoto0: 0xb4,
        //onErrorGoto: 0xa09cb2, // 3 tokens
        _onSq: 0xb5,
        openin: 0xb6,
        openout: 0xb7,
        origin: 0xb8,
        out: 0xb9,
        paper: 0xba,
        pen: 0xbb,
        plot: 0xbc,
        plotr: 0xbd,
        poke: 0xbe,
        print: 0xbf,
        "'": 0xc0,
        rad: 0xc1,
        randomize: 0xc2,
        read: 0xc3,
        release: 0xc4,
        rem: 0xc5,
        renum: 0xc6,
        restore: 0xc7,
        resume: 0xc8,
        resumeNext: 0xb0c8,
        "return": 0xc9,
        run: 0xca,
        save: 0xcb,
        sound: 0xcc,
        //speed: 0xcd,
        speedInk: 0xa2cd,
        speedKey: 0xa4cd,
        speedWrite: 0xd9cd,
        stop: 0xce,
        symbol: 0xcf,
        symbolAfter: 0x80cf,
        tag: 0xd0,
        tagoff: 0xd1,
        troff: 0xd2,
        tron: 0xd3,
        wait: 0xd4,
        wend: 0xd5,
        "while": 0xd6,
        width: 0xd7,
        window: 0xd8,
        windowSwap: 0xe7d8,
        write: 0xd9,
        zone: 0xda,
        di: 0xdb,
        ei: 0xdc,
        fill: 0xdd,
        graphics: 0xde,
        graphicsPaper: 0xbade,
        graphicsPen: 0xbbde,
        mask: 0xdf,
        frame: 0xe0,
        cursor: 0xe1,
        // "<unused>":         0xe2,
        erl: 0xe3,
        fn: 0xe4,
        spc: 0xe5,
        step: 0xe6,
        //swap: 0xe7,
        // "<unused>":         0xe8,
        // "<unused>":         0xe9,
        tab: 0xea,
        then: 0xeb,
        to: 0xec,
        using: 0xed,
        ">": 0xee,
        "=": 0xef,
        ">=": 0xf0,
        "<": 0xf1,
        "<>": 0xf2,
        "<=": 0xf3,
        "+": 0xf4,
        "-": 0xf5,
        "*": 0xf6,
        "/": 0xf7,
        "^": 0xf8,
        "\\": 0xf9,
        and: 0xfa,
        mod: 0xfb,
        or: 0xfc,
        xor: 0xfd,
        not: 0xfe
        // 0xff: (prefix for additional keywords)
    };
    CodeGeneratorToken.mTokensFF = {
        // Functions with one argument
        abs: 0x00,
        asc: 0x01,
        atn: 0x02,
        chr$: 0x03,
        cint: 0x04,
        cos: 0x05,
        creal: 0x06,
        exp: 0x07,
        fix: 0x08,
        fre: 0x09,
        inkey: 0x0a,
        inp: 0x0b,
        "int": 0x0c,
        joy: 0x0d,
        len: 0x0e,
        log: 0x0f,
        log10: 0x10,
        lower$: 0x11,
        peek: 0x12,
        remain: 0x13,
        sgn: 0x14,
        sin: 0x15,
        space$: 0x16,
        sq: 0x17,
        sqr: 0x18,
        str$: 0x19,
        tan: 0x1a,
        unt: 0x1b,
        upper$: 0x1c,
        val: 0x1d,
        // Functions without arguments
        eof: 0x40,
        err: 0x41,
        himem: 0x42,
        inkey$: 0x43,
        pi: 0x44,
        rnd: 0x45,
        time: 0x46,
        xpos: 0x47,
        ypos: 0x48,
        derr: 0x49,
        // Functions with more arguments
        bin$: 0x71,
        dec$: 0x72,
        hex$: 0x73,
        instr: 0x74,
        left$: 0x75,
        max: 0x76,
        min: 0x77,
        pos: 0x78,
        right$: 0x79,
        round: 0x7a,
        string$: 0x7b,
        test: 0x7c,
        testr: 0x7d,
        copychr$: 0x7e,
        vpos: 0x7f
    };
    return CodeGeneratorToken;
}());
exports.CodeGeneratorToken = CodeGeneratorToken;
//# sourceMappingURL=CodeGeneratorToken.js.map