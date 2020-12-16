"use strict";
// CodeGeneratorBasic.ts - Code Generator for BASIC (for testing, pretty print?)
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasic/
//
//
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeGeneratorBasic = void 0;
var Utils_1 = require("./Utils");
var BasicParser_1 = require("./BasicParser"); // BasicParser just for keyword definitions
var CodeGeneratorBasic = /** @class */ (function () {
    function CodeGeneratorBasic(options) {
        this.init(options);
    }
    CodeGeneratorBasic.prototype.init = function (options) {
        this.lexer = options.lexer;
        this.parser = options.parser;
        this.reset();
    };
    CodeGeneratorBasic.prototype.reset = function () {
        this.lexer.reset();
        this.parser.reset();
    };
    CodeGeneratorBasic.prototype.composeError = function () {
        var aArgs = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            aArgs[_i] = arguments[_i];
        }
        aArgs.unshift("CodeGeneratorBasic");
        // check, correct:
        //TTT aArgs.push(this.iLine);
        return Utils_1.Utils.composeError.apply(null, aArgs);
    };
    //
    // evaluate
    //
    CodeGeneratorBasic.prototype.evaluate = function (parseTree) {
        var that = this, fnParseOneArg = function (oArg) {
            var sValue = parseNode(oArg); // eslint-disable-line no-use-before-define
            return sValue;
        }, fnParseArgs = function (aArgs) {
            var aNodeArgs = []; // do not modify node.args here (could be a parameter of defined function)
            for (var i = 0; i < aArgs.length; i += 1) {
                var sValue = fnParseOneArg(aArgs[i]);
                if (!(i === 0 && sValue === "#" && aArgs[i].type === "#")) { // ignore empty stream as first argument (hmm, not for e.g. data!)
                    aNodeArgs.push(sValue);
                }
            }
            return aNodeArgs;
        }, mOperators = {
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
        }, mOperatorPrecedence = {
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
        }, fnDecodeEscapeSequence = function (str) {
            return str.replace(/\\x([0-9A-Fa-f]{2})/g, function () {
                return String.fromCharCode(parseInt(arguments[1], 16));
            });
        }, mParseFunctions = {
            string: function (node) {
                var sValue = fnDecodeEscapeSequence(node.value);
                sValue = sValue.replace(/\\\\/g, "\\"); // unescape backslashes
                return '"' + sValue + '"';
            },
            "null": function () {
                return "";
            },
            assign: function (node) {
                // see also "let"
                if (node.left.type !== "identifier") {
                    throw that.composeError(Error(), "Unexpected assing type", node.type, node.pos); // should not occur
                }
                var sValue = fnParseOneArg(node.left) + node.value + fnParseOneArg(node.right);
                return sValue;
            },
            number: function (node) {
                return node.value.toUpperCase(); // maybe "e" inside
            },
            binnumber: function (node) {
                return node.value.toUpperCase(); // maybe "&x"
            },
            hexnumber: function (node) {
                return node.value.toUpperCase();
            },
            identifier: function (node) {
                var sValue = node.value; // keep case, maybe mixed
                if (node.args) { // args including brackets
                    var aNodeArgs = fnParseArgs(node.args), sBracketOpen = aNodeArgs.shift(), sBracketClose = aNodeArgs.pop();
                    sValue += sBracketOpen + aNodeArgs.join(",") + sBracketClose;
                }
                return sValue;
            },
            linenumber: function (node) {
                return node.value;
            },
            label: function (node) {
                var aNodeArgs = fnParseArgs(node.args);
                var sValue = aNodeArgs.join(":");
                if (node.value !== "direct") {
                    sValue = node.value + " " + sValue;
                }
                return sValue;
            },
            // special keyword functions
            "|": function (node) {
                var aNodeArgs = fnParseArgs(node.args);
                var sValue = node.value.toUpperCase(); // use value!
                if (aNodeArgs.length) {
                    sValue += "," + aNodeArgs.join(",");
                }
                return sValue;
            },
            afterGosub: function (node) {
                var aNodeArgs = fnParseArgs(node.args);
                var sValue = "AFTER " + aNodeArgs[0];
                if (aNodeArgs[1]) {
                    sValue += "," + aNodeArgs[1];
                }
                sValue += " GOSUB " + aNodeArgs[2];
                return sValue;
            },
            chainMerge: function (node) {
                var aNodeArgs = fnParseArgs(node.args), sTypeUc = CodeGeneratorBasic.mCombinedKeywords[node.type] || node.type.toUpperCase();
                if (aNodeArgs.length === 3) {
                    aNodeArgs[2] = "DELETE " + aNodeArgs[2];
                }
                var sValue = sTypeUc + " " + aNodeArgs.join(",");
                return sValue;
            },
            data: function (node) {
                var aNodeArgs = [], regExp = new RegExp(",|^ +| +$");
                for (var i = 0; i < node.args.length; i += 1) {
                    var sValue2 = fnParseOneArg(node.args[i]);
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
            },
            def: function (node) {
                var sName = fnParseOneArg(node.left), sSpace = node.left.bSpace ? " " : "", // fast hack
                aNodeArgs = fnParseArgs(node.args), sExpression = fnParseOneArg(node.right);
                var sNodeArgs = aNodeArgs.join(",");
                if (sNodeArgs !== "") { // not empty?
                    sNodeArgs = "(" + sNodeArgs + ")";
                }
                var sName2 = sName.substr(0, 2).toUpperCase() + sSpace + sName.substr(2), sValue = node.type.toUpperCase() + " " + sName2 + sNodeArgs + "=" + sExpression;
                return sValue;
            },
            "else": function (node) {
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
            },
            ent: function (node) {
                var aArgs = node.args, aNodeArgs = [];
                var bEqual = false;
                for (var i = 0; i < aArgs.length; i += 1) {
                    if (aArgs[i].type !== "null") {
                        var sArg = fnParseOneArg(aArgs[i]);
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
            },
            env: function (node) {
                return this.ent(node);
            },
            everyGosub: function (node) {
                var aNodeArgs = fnParseArgs(node.args);
                var sValue = "EVERY " + aNodeArgs[0];
                if (aNodeArgs[1]) {
                    sValue += "," + aNodeArgs[1];
                }
                sValue += " GOSUB " + aNodeArgs[2];
                return sValue;
            },
            fn: function (node) {
                var aNodeArgs = fnParseArgs(node.args), sName = fnParseOneArg(node.left), sSpace = node.left.bSpace ? " " : ""; // fast hack
                var sNodeArgs = aNodeArgs.join(",");
                if (sNodeArgs !== "") { // not empty?
                    sNodeArgs = "(" + sNodeArgs + ")";
                }
                var sName2 = sName.substr(0, 2).toUpperCase() + sSpace + sName.substr(2), sValue = sName2 + sNodeArgs;
                return sValue;
            },
            "for": function (node) {
                var aNodeArgs = fnParseArgs(node.args), sVarName = aNodeArgs[0], startValue = aNodeArgs[1], endValue = aNodeArgs[2], stepValue = aNodeArgs[3];
                var sValue = node.type.toUpperCase() + " " + sVarName + "=" + startValue + " TO " + endValue;
                if (stepValue !== "") { // "null" is ""
                    sValue += " STEP " + stepValue;
                }
                return sValue;
            },
            "if": function (node) {
                var sValue = node.type.toUpperCase() + " " + fnParseOneArg(node.left) + " THEN ";
                var oNodeBranch = node.args, aNodeArgs = fnParseArgs(oNodeBranch); // args for "then"
                if (oNodeBranch.length && oNodeBranch[0].type === "goto" && oNodeBranch[0].len === 0) { // inserted goto?
                    aNodeArgs[0] = fnParseOneArg(oNodeBranch[0].args[0]); // take just line number
                }
                sValue += aNodeArgs.join(":");
                if (node.args2) {
                    sValue += " ELSE ";
                    var oNodeBranch2 = node.args2, aNodeArgs2 = fnParseArgs(oNodeBranch2); // args for "else"
                    if (oNodeBranch2.length && oNodeBranch2[0].type === "goto" && oNodeBranch2[0].len === 0) { // inserted goto?
                        aNodeArgs2[0] = fnParseOneArg(oNodeBranch2[0].args[0]); // take just line number
                    }
                    sValue += aNodeArgs2.join(":");
                }
                return sValue;
            },
            input: function (node) {
                var aNodeArgs = fnParseArgs(node.args), sTypeUc = CodeGeneratorBasic.mCombinedKeywords[node.type] || node.type.toUpperCase(), bHasStream = aNodeArgs.length && (String(aNodeArgs[0]).charAt(0) === "#");
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
            },
            lineInput: function (node) {
                return this.input(node);
            },
            list: function (node) {
                var aNodeArgs = fnParseArgs(node.args);
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
            },
            mid$Assign: function (node) {
                var aNodeArgs = fnParseArgs(node.args), sTypeUc = CodeGeneratorBasic.mCombinedKeywords[node.type], sValue = sTypeUc + "(" + aNodeArgs.join(",") + ")=" + fnParseOneArg(node.right);
                return sValue;
            },
            onGosub: function (node) {
                var aNodeArgs = fnParseArgs(node.args);
                var sValue = aNodeArgs.shift();
                sValue = "ON " + sValue + " GOSUB " + aNodeArgs.join(",");
                return sValue;
            },
            onGoto: function (node) {
                var aNodeArgs = fnParseArgs(node.args);
                var sValue = aNodeArgs.shift();
                sValue = "ON " + sValue + " GOTO " + aNodeArgs.join(",");
                return sValue;
            },
            onSqGosub: function (node) {
                var aNodeArgs = fnParseArgs(node.args), sValue = "ON SQ(" + aNodeArgs[0] + ") GOSUB " + aNodeArgs[1];
                return sValue;
            },
            print: function (node) {
                var regExp = new RegExp("[a-zA-Z0-9.]"), aNodeArgs = fnParseArgs(node.args), bHasStream = aNodeArgs.length && (String(aNodeArgs[0]).charAt(0) === "#");
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
            },
            rem: function (node) {
                var aNodeArgs = fnParseArgs(node.args);
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
            },
            using: function (node) {
                var aNodeArgs = fnParseArgs(node.args);
                var sTemplate = aNodeArgs.shift();
                if (sTemplate.charAt(0) !== '"') { // not a string => space required
                    sTemplate = " " + sTemplate;
                }
                var sValue = node.type.toUpperCase() + sTemplate + ";" + aNodeArgs.join(","); // separator between args could be "," or ";", we use ","
                return sValue;
            }
        }, fnParseOther = function (node) {
            var sType = node.type, sTypeUc = CodeGeneratorBasic.mCombinedKeywords[sType] || sType.toUpperCase(), sKeyType = BasicParser_1.BasicParser.mKeywords[sType];
            var sArgs = "";
            if (node.left) {
                sArgs += fnParseOneArg(node.left);
            }
            if (!sKeyType) {
                if (node.value) { // e.g. string,...
                    sArgs += node.value;
                }
            }
            if (node.right) {
                sArgs += fnParseOneArg(node.right);
            }
            /*
            if (node.third) {
                sArgs += fnParseOneArg(node.third);
            }
            */
            if (node.args) {
                sArgs += fnParseArgs(node.args).join(",");
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
        }, parseNode = function (node) {
            if (Utils_1.Utils.debug > 3) {
                Utils_1.Utils.console.debug("evaluate: parseNode node=%o type=" + node.type + " value=" + node.value + " left=%o right=%o args=%o", node, node.left, node.right, node.args);
            }
            var sType = node.type, mPrecedence = mOperatorPrecedence;
            var value;
            if (mOperators[sType]) {
                if (node.left) {
                    value = parseNode(node.left);
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
                    var value2 = parseNode(node.right);
                    if (mOperators[node.right.type] && (node.right.left || node.right.right)) { // binary operator (or unary operator, e.g. not)
                        var p = mPrecedence[node.type];
                        var pr = void 0;
                        if (node.right.left) { // right is binary
                            pr = mPrecedence[node.right.type] || 0;
                        }
                        else {
                            pr = mPrecedence["p" + node.right.type] || mPrecedence[node.right.type] || 0;
                        }
                        if ((pr < p) || ((pr === p) && node.type === "-")) { // "-" is special
                            value2 = "(" + value2 + ")";
                        }
                    }
                    value += mOperators[sType].toUpperCase() + value2;
                }
                else { // unary operator
                    value = parseNode(node.right);
                    var p = mPrecedence["p" + node.type] || mPrecedence[node.type] || 0; // check unary operator first
                    var pr = void 0;
                    if (node.right.left) { // was binary op?
                        pr = mPrecedence[node.right.type] || 0; // no special prio
                    }
                    else {
                        pr = mPrecedence["p" + node.right.type] || mPrecedence[node.right.type] || 0; // check unary operator first
                    }
                    if (p && pr && (pr < p)) {
                        value = "(" + value + ")";
                    }
                    value = mOperators[sType].toUpperCase() + value;
                }
            }
            else if (mParseFunctions[sType]) { // function with special handling?
                value = mParseFunctions[sType](node);
            }
            else { // for other functions, generate code directly
                value = fnParseOther(node);
            }
            return value;
        }, fnEvaluate = function () {
            var sOutput = "";
            for (var i = 0; i < parseTree.length; i += 1) {
                if (Utils_1.Utils.debug > 2) {
                    Utils_1.Utils.console.debug("evaluate: parseTree i=%d, node=%o", i, parseTree[i]);
                }
                var sNode = parseNode(parseTree[i]);
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
        return fnEvaluate();
    };
    CodeGeneratorBasic.prototype.generate = function (sInput, bAllowDirect) {
        var oOut = {
            text: "",
            error: undefined
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
    return CodeGeneratorBasic;
}());
exports.CodeGeneratorBasic = CodeGeneratorBasic;
//# sourceMappingURL=CodeGeneratorBasic.js.map