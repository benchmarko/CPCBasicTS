"use strict";
// CodeGeneratorBasic.ts - Code Generator for BASIC (for testing, pretty print?)
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//
//
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeGeneratorBasic = void 0;
var Utils_1 = require("./Utils");
var BasicParser_1 = require("./BasicParser"); // BasicParser just for keyword definitions
var CodeGeneratorBasic = /** @class */ (function () {
    function CodeGeneratorBasic(options) {
        this.iLine = 0; // current line (label)
        /* eslint-disable no-invalid-this */
        this.mParseFunctions = {
            "(": this.fnParenthesisOpen,
            string: CodeGeneratorBasic.string,
            unquoted: CodeGeneratorBasic.unquoted,
            "null": CodeGeneratorBasic.fnNull,
            assign: this.assign,
            number: CodeGeneratorBasic.decBinHexNumber,
            binnumber: CodeGeneratorBasic.decBinHexNumber,
            hexnumber: CodeGeneratorBasic.decBinHexNumber,
            identifier: this.identifier,
            linenumber: CodeGeneratorBasic.linenumber,
            label: this.label,
            "|": this.vertical,
            afterGosub: this.afterEveryGosub,
            chainMerge: this.chainMerge,
            data: this.data,
            def: this.def,
            "else": this.else,
            ent: this.entEnv,
            env: this.entEnv,
            everyGosub: this.afterEveryGosub,
            fn: this.fn,
            "for": this.for,
            "if": this.if,
            input: this.inputLineInput,
            lineInput: this.inputLineInput,
            list: this.list,
            mid$Assign: this.mid$Assign,
            onGosub: this.onGotoGosub,
            onGoto: this.onGotoGosub,
            onSqGosub: this.onSqGosub,
            print: this.print,
            rem: this.rem,
            using: this.using
        };
        this.lexer = options.lexer;
        this.parser = options.parser;
    }
    CodeGeneratorBasic.prototype.getLexer = function () {
        return this.lexer;
    };
    CodeGeneratorBasic.prototype.getParser = function () {
        return this.parser;
    };
    CodeGeneratorBasic.prototype.composeError = function (oError, message, value, pos) {
        return Utils_1.Utils.composeError("CodeGeneratorBasic", oError, message, value, pos, this.iLine);
    };
    CodeGeneratorBasic.fnWs = function (node) {
        return node.ws || "";
    };
    CodeGeneratorBasic.fnSpace1 = function (sValue) {
        return (!sValue.length || sValue.startsWith(" ") ? "" : " ") + sValue;
    };
    CodeGeneratorBasic.getUcKeyword = function (node) {
        var sType = node.type;
        var sTypeUc = CodeGeneratorBasic.mCombinedKeywords[sType] || sType.toUpperCase();
        if (sTypeUc !== node.value.toUpperCase()) { // some (extra) whitespace between combined keyword?
            sTypeUc = node.value.toUpperCase(); // we could always take this
        }
        return sTypeUc;
    };
    CodeGeneratorBasic.prototype.fnParseOneArg = function (oArg) {
        var sValue = this.parseNode(oArg);
        return sValue;
    };
    CodeGeneratorBasic.prototype.fnParseArgs = function (aArgs) {
        var aNodeArgs = []; // do not modify node.args here (could be a parameter of defined function)
        if (!aArgs) {
            throw this.composeError(Error(), "Programming error: Undefined args", "", -1); // should not occure
        }
        for (var i = 0; i < aArgs.length; i += 1) {
            var sValue = this.fnParseOneArg(aArgs[i]);
            if (!(i === 0 && sValue === "#" && aArgs[i].type === "#")) { // ignore empty stream as first argument (hmm, not for e.g. data!)
                aNodeArgs.push(sValue);
            }
        }
        return aNodeArgs;
    };
    CodeGeneratorBasic.fnColonsAvailable = function (aArgs) {
        var bColonsAvailable = false;
        for (var i = 0; i < aArgs.length; i += 1) {
            if (aArgs[i].trim() === ":") {
                bColonsAvailable = true;
                break;
            }
        }
        return bColonsAvailable;
    };
    CodeGeneratorBasic.combineArgsWithColon = function (aArgs) {
        var sSeparator = CodeGeneratorBasic.fnColonsAvailable(aArgs) ? "" : ":", sValue = aArgs.join(sSeparator);
        return sValue;
    };
    CodeGeneratorBasic.prototype.fnParenthesisOpen = function (node) {
        var oValue = node.value;
        if (node.args) {
            var aNodeArgs = this.fnParseArgs(node.args);
            oValue += aNodeArgs.join("");
        }
        return CodeGeneratorBasic.fnWs(node) + oValue;
    };
    CodeGeneratorBasic.string = function (node) {
        return CodeGeneratorBasic.fnWs(node) + '"' + node.value + '"';
    };
    CodeGeneratorBasic.unquoted = function (node) {
        return CodeGeneratorBasic.fnWs(node) + node.value;
    };
    CodeGeneratorBasic.fnNull = function () {
        return "";
    };
    CodeGeneratorBasic.prototype.assign = function (node) {
        // see also "let"
        if (!node.left || !node.right) {
            throw this.composeError(Error(), "Programming error: Undefined left or right", node.type, node.pos); // should not occure
        }
        if (node.left.type !== "identifier") {
            throw this.composeError(Error(), "Unexpected assing type", node.type, node.pos); // should not occur
        }
        var sValue = this.fnParseOneArg(node.left) + CodeGeneratorBasic.fnWs(node) + node.value + this.fnParseOneArg(node.right);
        return sValue;
    };
    CodeGeneratorBasic.decBinHexNumber = function (node) {
        return CodeGeneratorBasic.fnWs(node) + node.value.toUpperCase(); // number: maybe "e" inside; binnumber: maybe "&x"
    };
    CodeGeneratorBasic.prototype.identifier = function (node) {
        var sValue = CodeGeneratorBasic.fnWs(node) + node.value; // keep case, maybe mixed
        if (node.args) { // args including brackets
            var aNodeArgs = this.fnParseArgs(node.args), sBracketOpen = aNodeArgs.shift(), sBracketClose = aNodeArgs.pop();
            sValue += sBracketOpen + aNodeArgs.join(",") + sBracketClose;
        }
        return sValue;
    };
    CodeGeneratorBasic.linenumber = function (node) {
        return CodeGeneratorBasic.fnWs(node) + node.value;
    };
    CodeGeneratorBasic.prototype.label = function (node) {
        this.iLine = Number(node.value); // set line before parsing args
        var aNodeArgs = this.fnParseArgs(node.args);
        var sValue = CodeGeneratorBasic.combineArgsWithColon(aNodeArgs);
        if (node.value !== "direct") {
            sValue = node.value + CodeGeneratorBasic.fnSpace1(sValue);
        }
        return CodeGeneratorBasic.fnWs(node) + sValue;
    };
    // special keyword functions
    CodeGeneratorBasic.prototype.vertical = function (node) {
        var aNodeArgs = this.fnParseArgs(node.args);
        var sValue = node.value.toUpperCase(); // use value!
        if (aNodeArgs.length) {
            sValue += "," + aNodeArgs.join(",");
        }
        return CodeGeneratorBasic.fnWs(node) + sValue;
    };
    CodeGeneratorBasic.prototype.afterEveryGosub = function (node) {
        var aNodeArgs = this.fnParseArgs(node.args);
        var sValue = node.value.toUpperCase() + CodeGeneratorBasic.fnSpace1(aNodeArgs[0]);
        if (aNodeArgs[1]) {
            sValue += "," + aNodeArgs[1];
        }
        sValue += " GOSUB" + CodeGeneratorBasic.fnSpace1(aNodeArgs[2]);
        return CodeGeneratorBasic.fnWs(node) + sValue;
    };
    CodeGeneratorBasic.prototype.chainMerge = function (node) {
        var aNodeArgs = this.fnParseArgs(node.args), sTypeUc = CodeGeneratorBasic.getUcKeyword(node);
        if (aNodeArgs.length === 3) {
            aNodeArgs[2] = "DELETE" + CodeGeneratorBasic.fnSpace1(aNodeArgs[2]);
        }
        return CodeGeneratorBasic.fnWs(node) + sTypeUc + CodeGeneratorBasic.fnSpace1(aNodeArgs.join(","));
    };
    CodeGeneratorBasic.prototype.data = function (node) {
        var aNodeArgs = this.fnParseArgs(node.args);
        for (var i = 0; i < aNodeArgs.length; i += 1) {
            var sValue2 = aNodeArgs[i];
            aNodeArgs[i] = sValue2;
        }
        var sArgs = aNodeArgs.join("");
        sArgs = Utils_1.Utils.stringTrimEnd(sArgs); // remove trailing spaces
        return CodeGeneratorBasic.fnWs(node) + node.type.toUpperCase() + CodeGeneratorBasic.fnSpace1(sArgs);
    };
    CodeGeneratorBasic.prototype.def = function (node) {
        if (!node.left || !node.right) {
            throw this.composeError(Error(), "Programming error: Undefined left or right", node.type, node.pos); // should not occure
        }
        var sName = this.fnParseOneArg(node.left), sSpace = node.left.bSpace ? " " : "", // fast hack
        aNodeArgs = this.fnParseArgs(node.args), sExpression = this.fnParseOneArg(node.right);
        var sNodeArgs = aNodeArgs.join(",");
        if (sNodeArgs !== "") { // not empty?
            sNodeArgs = "(" + sNodeArgs + ")";
        }
        var sName2 = sName.replace(/FN/i, "FN" + sSpace);
        return CodeGeneratorBasic.fnWs(node) + node.type.toUpperCase() + CodeGeneratorBasic.fnSpace1(sName2) + sNodeArgs + "=" + sExpression; //TTT how to get space before "="?
    };
    CodeGeneratorBasic.prototype["else"] = function (node) {
        if (!node.args) {
            throw this.composeError(Error(), "Programming error: Undefined args", "", -1); // should not occure
        }
        var aArgs = node.args;
        var sValue = "";
        for (var i = 0; i < aArgs.length; i += 1) {
            var oToken = aArgs[i];
            if (oToken.value) {
                sValue += " " + oToken.value;
            }
        }
        // TODO: whitespaces?
        return CodeGeneratorBasic.fnWs(node) + node.type.toUpperCase() + sValue;
    };
    CodeGeneratorBasic.prototype.entEnv = function (node) {
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
        return CodeGeneratorBasic.fnWs(node) + node.type.toUpperCase() + CodeGeneratorBasic.fnSpace1(aNodeArgs.join(","));
    };
    CodeGeneratorBasic.prototype.fn = function (node) {
        if (!node.left) {
            throw this.composeError(Error(), "Programming error: Undefined left", node.type, node.pos); // should not occure
        }
        var aNodeArgs = this.fnParseArgs(node.args);
        var sNodeArgs = aNodeArgs.join(",");
        if (sNodeArgs !== "") { // not empty?
            sNodeArgs = "(" + sNodeArgs + ")";
        }
        var sName2 = node.value.replace(/FN/i, "FN"); // + sSpace),
        return CodeGeneratorBasic.fnWs(node) + sName2 + sNodeArgs;
    };
    CodeGeneratorBasic.prototype["for"] = function (node) {
        var aNodeArgs = this.fnParseArgs(node.args), sVarName = aNodeArgs[0], startValue = aNodeArgs[1], endValue = aNodeArgs[2], stepValue = aNodeArgs[3];
        var sValue = node.type.toUpperCase() + CodeGeneratorBasic.fnSpace1(sVarName) + "=" + startValue + " TO" + CodeGeneratorBasic.fnSpace1(endValue);
        if (stepValue !== "") { // "null" is ""
            sValue += " STEP" + CodeGeneratorBasic.fnSpace1(stepValue);
        }
        return CodeGeneratorBasic.fnWs(node) + sValue;
    };
    CodeGeneratorBasic.prototype.fnThenOrElsePart = function (oNodeBranch) {
        var aNodeArgs = this.fnParseArgs(oNodeBranch); // args for "then" or "else"
        if (oNodeBranch.length && oNodeBranch[0].type === "goto" && oNodeBranch[0].len === 0) { // inserted goto?
            aNodeArgs[0] = this.fnParseOneArg(oNodeBranch[0].args[0]); // take just line number
        }
        return CodeGeneratorBasic.fnSpace1(CodeGeneratorBasic.combineArgsWithColon(aNodeArgs));
    };
    CodeGeneratorBasic.prototype["if"] = function (node) {
        if (!node.left) {
            throw this.composeError(Error(), "Programming error: Undefined left", node.type, node.pos); // should not occure
        }
        if (!node.args) {
            throw this.composeError(Error(), "Programming error: Undefined args", node.type, node.pos); // should not occure
        }
        var sValue = node.type.toUpperCase() + CodeGeneratorBasic.fnSpace1(this.fnParseOneArg(node.left)) + " THEN";
        sValue += this.fnThenOrElsePart(node.args); // "then" part
        if (node.args2) {
            sValue += " ELSE" + this.fnThenOrElsePart(node.args2); // "else" part
        }
        return CodeGeneratorBasic.fnWs(node) + sValue;
    };
    CodeGeneratorBasic.fnHasStream = function (node) {
        return node.args && node.args.length && (node.args[0].type === "#") && node.args[0].right && (node.args[0].right.type !== "null");
    };
    CodeGeneratorBasic.prototype.inputLineInput = function (node) {
        var aNodeArgs = this.fnParseArgs(node.args), sTypeUc = CodeGeneratorBasic.getUcKeyword(node), bHasStream = CodeGeneratorBasic.fnHasStream(node);
        var i = 0;
        if (bHasStream) { // stream?
            i += 1;
        }
        aNodeArgs.splice(i, 4, aNodeArgs[i] + aNodeArgs[i + 1] + aNodeArgs[i + 2] + aNodeArgs[i + 3]); // combine 4 elements into one
        return CodeGeneratorBasic.fnWs(node) + sTypeUc + CodeGeneratorBasic.fnSpace1(aNodeArgs.join(","));
    };
    CodeGeneratorBasic.prototype.list = function (node) {
        var aNodeArgs = this.fnParseArgs(node.args);
        if (aNodeArgs.length && aNodeArgs[0] === "") { // empty range?
            aNodeArgs.shift(); // remove
        }
        if (aNodeArgs.length && aNodeArgs[aNodeArgs.length - 1] === "#") { // dummy stream?
            aNodeArgs.pop(); // remove
        }
        return CodeGeneratorBasic.fnWs(node) + node.type.toUpperCase() + CodeGeneratorBasic.fnSpace1(aNodeArgs.join(","));
    };
    CodeGeneratorBasic.prototype.mid$Assign = function (node) {
        if (!node.right) {
            throw this.composeError(Error(), "Programming error: Undefined right", "", -1); // should not occure
        }
        var aNodeArgs = this.fnParseArgs(node.args), sTypeUc = CodeGeneratorBasic.getUcKeyword(node);
        return CodeGeneratorBasic.fnWs(node) + sTypeUc + "(" + aNodeArgs.join(",") + ")=" + this.fnParseOneArg(node.right);
    };
    CodeGeneratorBasic.prototype.onGotoGosub = function (node) {
        var sLeft = this.fnParseOneArg(node.left), aNodeArgs = this.fnParseArgs(node.args), sType2 = node.type === "onGoto" ? "GOTO" : "GOSUB";
        return CodeGeneratorBasic.fnWs(node) + "ON" + CodeGeneratorBasic.fnSpace1(sLeft) + " " + sType2 + CodeGeneratorBasic.fnSpace1(aNodeArgs.join(","));
    };
    CodeGeneratorBasic.prototype.onSqGosub = function (node) {
        var sLeft = this.fnParseOneArg(node.left), aNodeArgs = this.fnParseArgs(node.args);
        return CodeGeneratorBasic.fnWs(node) + "ON SQ(" + sLeft + ") GOSUB" + CodeGeneratorBasic.fnSpace1(aNodeArgs.join(","));
    };
    CodeGeneratorBasic.prototype.print = function (node) {
        var aNodeArgs = this.fnParseArgs(node.args), bHasStream = CodeGeneratorBasic.fnHasStream(node);
        var sValue = "";
        if (bHasStream && aNodeArgs.length > 1) { // more args after stream?
            aNodeArgs[0] = String(aNodeArgs[0]) + ",";
        }
        for (var i = 0; i < aNodeArgs.length; i += 1) {
            sValue += aNodeArgs[i];
        }
        if (node.value !== "?") { // for "print"
            sValue = CodeGeneratorBasic.fnSpace1(sValue);
        }
        return CodeGeneratorBasic.fnWs(node) + node.value.toUpperCase() + sValue; // we use value to get PRINT or ?
    };
    CodeGeneratorBasic.prototype.rem = function (node) {
        var aNodeArgs = this.fnParseArgs(node.args);
        var sValue = aNodeArgs.length ? aNodeArgs[0] : "";
        if (node.value !== "'" && sValue !== "") { // for "rem"
            var oArg0 = node.args && node.args[0];
            if (oArg0 && !oArg0.ws) {
                sValue = " " + sValue; // add removed space
            }
        }
        return CodeGeneratorBasic.fnWs(node) + node.value.toUpperCase() + sValue; // we use value to get rem or '
    };
    CodeGeneratorBasic.prototype.using = function (node) {
        var aNodeArgs = this.fnParseArgs(node.args), sTemplate = aNodeArgs.length ? aNodeArgs.shift() || "" : "";
        return CodeGeneratorBasic.fnWs(node) + node.type.toUpperCase() + CodeGeneratorBasic.fnSpace1(sTemplate) + ";" + aNodeArgs.join(","); // separator between args could be "," or ";", we use ","
    };
    /* eslint-enable no-invalid-this */
    CodeGeneratorBasic.prototype.fnParseOther = function (node) {
        var sType = node.type, sTypeUc = CodeGeneratorBasic.getUcKeyword(node), sKeyType = BasicParser_1.BasicParser.mKeywords[sType];
        var sArgs = "";
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
        var sValue;
        if (sKeyType) {
            sValue = sTypeUc;
            if (sArgs.length) {
                if (sKeyType.charAt(0) === "f") { // function with parameters?
                    sValue += "(" + sArgs + ")";
                }
                else {
                    sValue += CodeGeneratorBasic.fnSpace1(sArgs);
                }
            }
        }
        else {
            sValue = sArgs; // for e.g. string
        }
        return CodeGeneratorBasic.fnWs(node) + sValue;
    };
    CodeGeneratorBasic.prototype.parseNode = function (node) {
        if (Utils_1.Utils.debug > 3) {
            Utils_1.Utils.console.debug("evaluate: parseNode node=%o type=" + node.type + " value=" + node.value + " left=%o right=%o args=%o", node, node.left, node.right, node.args);
        }
        var sType = node.type, mPrecedence = CodeGeneratorBasic.mOperatorPrecedence, mOperators = CodeGeneratorBasic.mOperators;
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
                var sWhiteBefore = CodeGeneratorBasic.fnWs(node);
                var sOperator = sWhiteBefore + mOperators[sType].toUpperCase();
                if (sWhiteBefore === "" && (/^(and|or|xor|mod)$/).test(sType)) {
                    sOperator = " " + sOperator + " ";
                }
                value += sOperator + value2;
            }
            else { // unary operator, e.g. not
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
                var sWhiteBefore = CodeGeneratorBasic.fnWs(node), sOperator = sWhiteBefore + mOperators[sType].toUpperCase(), bWhiteAfter = value.startsWith(" ");
                if (!bWhiteAfter && sType === "not") {
                    value = " " + value;
                }
                value = sOperator + value;
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
    CodeGeneratorBasic.prototype.evaluate = function (parseTree) {
        var sOutput = "";
        for (var i = 0; i < parseTree.length; i += 1) {
            if (Utils_1.Utils.debug > 2) {
                Utils_1.Utils.console.debug("evaluate: parseTree i=%d, node=%o", i, parseTree[i]);
            }
            var sNode = this.parseNode(parseTree[i]);
            if ((sNode !== undefined) && (sNode !== "")) {
                if (sNode !== null) {
                    if (sOutput.length === 0) {
                        sOutput = sNode;
                    }
                    else {
                        sOutput += "\n" + sNode;
                    }
                }
                else {
                    sOutput = ""; // cls (clear output when sNode is set to null)
                }
            }
        }
        return sOutput;
    };
    CodeGeneratorBasic.prototype.generate = function (sInput, bAllowDirect) {
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
    CodeGeneratorBasic.mCombinedKeywords = {
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
    };
    CodeGeneratorBasic.mOperators = {
        "+": "+",
        "-": "-",
        "*": "*",
        "/": "/",
        "\\": "\\",
        "^": "^",
        and: "AND",
        or: "OR",
        xor: "XOR",
        not: "NOT",
        mod: "MOD",
        ">": ">",
        "<": "<",
        ">=": ">=",
        "<=": "<=",
        "=": "=",
        "<>": "<>",
        "@": "@",
        "#": "#"
    };
    CodeGeneratorBasic.mOperatorPrecedence = {
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
    return CodeGeneratorBasic;
}());
exports.CodeGeneratorBasic = CodeGeneratorBasic;
//# sourceMappingURL=CodeGeneratorBasic.js.map