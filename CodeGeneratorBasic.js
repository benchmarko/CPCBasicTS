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
        /* eslint-disable no-invalid-this */
        this.mParseFunctions = {
            string: CodeGeneratorBasic.string,
            "null": CodeGeneratorBasic.fnNull,
            assign: this.assign,
            number: CodeGeneratorBasic.number,
            binnumber: CodeGeneratorBasic.binnumber,
            hexnumber: CodeGeneratorBasic.hexnumber,
            identifier: this.identifier,
            linenumber: CodeGeneratorBasic.linenumber,
            label: this.label,
            "|": this.vertical,
            afterGosub: this.afterGosub,
            chainMerge: this.chainMerge,
            data: this.data,
            def: this.def,
            "else": CodeGeneratorBasic.else,
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
    CodeGeneratorBasic.prototype.composeError = function (oError, message, value, pos) {
        return Utils_1.Utils.composeError("CodeGeneratorBasic", oError, message, value, pos);
    };
    CodeGeneratorBasic.prototype.fnParseOneArg = function (oArg) {
        var sValue = this.parseNode(oArg); // eslint-disable-line no-use-before-define
        return sValue;
    };
    CodeGeneratorBasic.prototype.fnParseArgs = function (aArgs) {
        var aNodeArgs = []; // do not modify node.args here (could be a parameter of defined function)
        for (var i = 0; i < aArgs.length; i += 1) {
            var sValue = this.fnParseOneArg(aArgs[i]);
            if (!(i === 0 && sValue === "#" && aArgs[i].type === "#")) { // ignore empty stream as first argument (hmm, not for e.g. data!)
                aNodeArgs.push(sValue);
            }
        }
        return aNodeArgs;
    };
    CodeGeneratorBasic.fnDecodeEscapeSequence = function (str) {
        return str.replace(/\\x([0-9A-Fa-f]{2})/g, function () {
            return String.fromCharCode(parseInt(arguments[1], 16));
        });
    };
    CodeGeneratorBasic.string = function (node) {
        var sValue = CodeGeneratorBasic.fnDecodeEscapeSequence(node.value);
        sValue = sValue.replace(/\\\\/g, "\\"); // unescape backslashes
        return '"' + sValue + '"';
    };
    CodeGeneratorBasic.fnNull = function () {
        return "";
    };
    CodeGeneratorBasic.prototype.assign = function (node) {
        // see also "let"
        if (node.left.type !== "identifier") {
            throw this.composeError(Error(), "Unexpected assing type", node.type, node.pos); // should not occur
        }
        var sValue = this.fnParseOneArg(node.left) + node.value + this.fnParseOneArg(node.right);
        return sValue;
    };
    CodeGeneratorBasic.number = function (node) {
        return node.value.toUpperCase(); // maybe "e" inside
    };
    CodeGeneratorBasic.binnumber = function (node) {
        return node.value.toUpperCase(); // maybe "&x"
    };
    CodeGeneratorBasic.hexnumber = function (node) {
        return node.value.toUpperCase();
    };
    CodeGeneratorBasic.prototype.identifier = function (node) {
        var sValue = node.value; // keep case, maybe mixed
        if (node.args) { // args including brackets
            var aNodeArgs = this.fnParseArgs(node.args), sBracketOpen = aNodeArgs.shift(), sBracketClose = aNodeArgs.pop();
            sValue += sBracketOpen + aNodeArgs.join(",") + sBracketClose;
        }
        return sValue;
    };
    CodeGeneratorBasic.linenumber = function (node) {
        return node.value;
    };
    CodeGeneratorBasic.prototype.label = function (node) {
        var aNodeArgs = this.fnParseArgs(node.args);
        var sValue = aNodeArgs.join(":");
        if (node.value !== "direct") {
            sValue = node.value + " " + sValue;
        }
        return sValue;
    };
    // special keyword functions
    CodeGeneratorBasic.prototype.vertical = function (node) {
        var aNodeArgs = this.fnParseArgs(node.args);
        var sValue = node.value.toUpperCase(); // use value!
        if (aNodeArgs.length) {
            sValue += "," + aNodeArgs.join(",");
        }
        return sValue;
    };
    CodeGeneratorBasic.prototype.afterGosub = function (node) {
        var aNodeArgs = this.fnParseArgs(node.args);
        var sValue = "AFTER " + aNodeArgs[0];
        if (aNodeArgs[1]) {
            sValue += "," + aNodeArgs[1];
        }
        sValue += " GOSUB " + aNodeArgs[2];
        return sValue;
    };
    CodeGeneratorBasic.prototype.chainMerge = function (node) {
        var aNodeArgs = this.fnParseArgs(node.args), sTypeUc = CodeGeneratorBasic.mCombinedKeywords[node.type] || node.type.toUpperCase();
        if (aNodeArgs.length === 3) {
            aNodeArgs[2] = "DELETE " + aNodeArgs[2];
        }
        var sValue = sTypeUc + " " + aNodeArgs.join(",");
        return sValue;
    };
    CodeGeneratorBasic.prototype.data = function (node) {
        var aNodeArgs = [], regExp = new RegExp(",|^ +| +$");
        for (var i = 0; i < node.args.length; i += 1) {
            var sValue2 = this.fnParseOneArg(node.args[i]);
            if (sValue2) {
                sValue2 = sValue2.substr(1, sValue2.length - 2); // remove surrounding quotes
                sValue2 = sValue2.replace(/\\"/g, "\""); // unescape "
                if (sValue2) {
                    if (regExp.test(sValue2)) {
                        sValue2 = '"' + sValue2 + '"';
                    }
                }
            }
            aNodeArgs.push(sValue2);
        }
        var sName = node.type.toUpperCase(), sValue = aNodeArgs.join(",");
        if (sValue !== "") { // argument?
            sName += " ";
        }
        sValue = sName + sValue;
        return sValue;
    };
    CodeGeneratorBasic.prototype.def = function (node) {
        var sName = this.fnParseOneArg(node.left), sSpace = node.left.bSpace ? " " : "", // fast hack
        aNodeArgs = this.fnParseArgs(node.args), sExpression = this.fnParseOneArg(node.right);
        var sNodeArgs = aNodeArgs.join(",");
        if (sNodeArgs !== "") { // not empty?
            sNodeArgs = "(" + sNodeArgs + ")";
        }
        var sName2 = sName.substr(0, 2).toUpperCase() + sSpace + sName.substr(2), sValue = node.type.toUpperCase() + " " + sName2 + sNodeArgs + "=" + sExpression;
        return sValue;
    };
    CodeGeneratorBasic["else"] = function (node) {
        var aArgs = node.args;
        var sValue = "";
        for (var i = 0; i < aArgs.length; i += 1) {
            var oToken = aArgs[i];
            if (oToken.value) {
                sValue += " " + oToken.value;
            }
        }
        // TODO: whitespaces?
        sValue = node.type.toUpperCase() + sValue;
        return sValue;
    };
    CodeGeneratorBasic.prototype.ent = function (node) {
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
        var sValue = node.type.toUpperCase() + " " + aNodeArgs.join(",");
        return sValue;
    };
    CodeGeneratorBasic.prototype.env = function (node) {
        return this.ent(node);
    };
    CodeGeneratorBasic.prototype.everyGosub = function (node) {
        var aNodeArgs = this.fnParseArgs(node.args);
        var sValue = "EVERY " + aNodeArgs[0];
        if (aNodeArgs[1]) {
            sValue += "," + aNodeArgs[1];
        }
        sValue += " GOSUB " + aNodeArgs[2];
        return sValue;
    };
    CodeGeneratorBasic.prototype.fn = function (node) {
        var aNodeArgs = this.fnParseArgs(node.args), sName = this.fnParseOneArg(node.left), sSpace = node.left.bSpace ? " " : ""; // fast hack
        var sNodeArgs = aNodeArgs.join(",");
        if (sNodeArgs !== "") { // not empty?
            sNodeArgs = "(" + sNodeArgs + ")";
        }
        var sName2 = sName.substr(0, 2).toUpperCase() + sSpace + sName.substr(2), sValue = sName2 + sNodeArgs;
        return sValue;
    };
    CodeGeneratorBasic.prototype["for"] = function (node) {
        var aNodeArgs = this.fnParseArgs(node.args), sVarName = aNodeArgs[0], startValue = aNodeArgs[1], endValue = aNodeArgs[2], stepValue = aNodeArgs[3];
        var sValue = node.type.toUpperCase() + " " + sVarName + "=" + startValue + " TO " + endValue;
        if (stepValue !== "") { // "null" is ""
            sValue += " STEP " + stepValue;
        }
        return sValue;
    };
    CodeGeneratorBasic.prototype["if"] = function (node) {
        var sValue = node.type.toUpperCase() + " " + this.fnParseOneArg(node.left) + " THEN ";
        var oNodeBranch = node.args, aNodeArgs = this.fnParseArgs(oNodeBranch); // args for "then"
        if (oNodeBranch.length && oNodeBranch[0].type === "goto" && oNodeBranch[0].len === 0) { // inserted goto?
            aNodeArgs[0] = this.fnParseOneArg(oNodeBranch[0].args[0]); // take just line number
        }
        sValue += aNodeArgs.join(":");
        if (node.args2) {
            sValue += " ELSE ";
            var oNodeBranch2 = node.args2, aNodeArgs2 = this.fnParseArgs(oNodeBranch2); // args for "else"
            if (oNodeBranch2.length && oNodeBranch2[0].type === "goto" && oNodeBranch2[0].len === 0) { // inserted goto?
                aNodeArgs2[0] = this.fnParseOneArg(oNodeBranch2[0].args[0]); // take just line number
            }
            sValue += aNodeArgs2.join(":");
        }
        return sValue;
    };
    CodeGeneratorBasic.prototype.input = function (node) {
        var aNodeArgs = this.fnParseArgs(node.args), sTypeUc = CodeGeneratorBasic.mCombinedKeywords[node.type] || node.type.toUpperCase(), bHasStream = aNodeArgs.length && (String(aNodeArgs[0]).charAt(0) === "#");
        var i = 0;
        if (bHasStream) { // stream?
            i += 1;
        }
        var sValue = sTypeUc;
        if (aNodeArgs.length && !bHasStream && String(aNodeArgs[0]).charAt(0) !== '"') {
            // TODO: empty CRLF marker
            sValue += " ";
        }
        aNodeArgs.splice(i, 4, aNodeArgs[i] + aNodeArgs[i + 1] + aNodeArgs[i + 2] + aNodeArgs[i + 3]); // combine 4 elements into one
        sValue += aNodeArgs.join(",");
        return sValue;
    };
    CodeGeneratorBasic.prototype.lineInput = function (node) {
        return this.input(node);
    };
    CodeGeneratorBasic.prototype.list = function (node) {
        var aNodeArgs = this.fnParseArgs(node.args);
        if (aNodeArgs.length && aNodeArgs[0] === "") { // empty range?
            aNodeArgs.shift(); // remove
        }
        if (aNodeArgs.length && aNodeArgs[aNodeArgs.length - 1] === "#") { // dummy stream?
            aNodeArgs.pop(); // remove
        }
        var sValue = aNodeArgs.join(","), sName = node.type.toUpperCase();
        if (sValue !== "") { // argument?
            sName += " ";
        }
        sValue = sName + sValue;
        return sValue;
    };
    CodeGeneratorBasic.prototype.mid$Assign = function (node) {
        var aNodeArgs = this.fnParseArgs(node.args), sTypeUc = CodeGeneratorBasic.mCombinedKeywords[node.type], sValue = sTypeUc + "(" + aNodeArgs.join(",") + ")=" + this.fnParseOneArg(node.right);
        return sValue;
    };
    CodeGeneratorBasic.prototype.onGosub = function (node) {
        var aNodeArgs = this.fnParseArgs(node.args);
        var sValue = aNodeArgs.shift();
        sValue = "ON " + sValue + " GOSUB " + aNodeArgs.join(",");
        return sValue;
    };
    CodeGeneratorBasic.prototype.onGoto = function (node) {
        var aNodeArgs = this.fnParseArgs(node.args);
        var sValue = aNodeArgs.shift();
        sValue = "ON " + sValue + " GOTO " + aNodeArgs.join(",");
        return sValue;
    };
    CodeGeneratorBasic.prototype.onSqGosub = function (node) {
        var aNodeArgs = this.fnParseArgs(node.args), sValue = "ON SQ(" + aNodeArgs[0] + ") GOSUB " + aNodeArgs[1];
        return sValue;
    };
    CodeGeneratorBasic.prototype.print = function (node) {
        var regExp = new RegExp("[a-zA-Z0-9.]"), aNodeArgs = this.fnParseArgs(node.args), bHasStream = aNodeArgs.length && (String(aNodeArgs[0]).charAt(0) === "#");
        var sValue = node.value.toUpperCase(); // we use value to get PRINT or ?
        if (sValue === "PRINT" && aNodeArgs.length && !bHasStream) { // PRINT with args and not stream?
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
    CodeGeneratorBasic.prototype.rem = function (node) {
        var aNodeArgs = this.fnParseArgs(node.args);
        var sValue = aNodeArgs[0];
        if (sValue !== undefined) {
            sValue = sValue.substr(1, sValue.length - 2); // remove surrounding quotes
        }
        else {
            sValue = "";
        }
        var sName = node.value;
        if (sName !== "'") { // not simple rem?
            sName = sName.toUpperCase();
            if (sValue !== "") { // argument?
                sName += " ";
            }
        }
        sValue = sName + sValue;
        return sValue;
    };
    CodeGeneratorBasic.prototype.using = function (node) {
        var aNodeArgs = this.fnParseArgs(node.args);
        var sTemplate = aNodeArgs.shift();
        if (sTemplate && sTemplate.charAt(0) !== '"') { // not a string => space required
            sTemplate = " " + sTemplate;
        }
        var sValue = node.type.toUpperCase() + sTemplate + ";" + aNodeArgs.join(","); // separator between args could be "," or ";", we use ","
        return sValue;
    };
    /* eslint-enable no-invalid-this */
    CodeGeneratorBasic.prototype.fnParseOther = function (node) {
        var sType = node.type, sTypeUc = CodeGeneratorBasic.mCombinedKeywords[sType] || sType.toUpperCase(), sKeyType = BasicParser_1.BasicParser.mKeywords[sType];
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
                    if (sArgs.charAt(0) !== "#") { // only if not a stream
                        sValue += " ";
                    }
                    sValue += sArgs;
                }
            }
        }
        else {
            sValue = sArgs; // for e.g. string
        }
        return sValue;
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
                value += mOperators[sType].toUpperCase() + value2;
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
                value = mOperators[sType].toUpperCase() + value;
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
        and: " AND ",
        or: " OR ",
        xor: " XOR ",
        not: "NOT ",
        mod: " MOD ",
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