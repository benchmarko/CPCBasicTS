"use strict";
// CodeGeneratorJs.ts - Code Generator for JavaScript
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasic/
//
//
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeGeneratorJs = void 0;
var Utils_1 = require("./Utils");
var CodeGeneratorJs = /** @class */ (function () {
    function CodeGeneratorJs(options) {
        this.tron = false;
        this.bQuiet = false;
        this.iLine = 0; // current line (label)
        this.oStack = {
            forLabel: [],
            forVarName: [],
            whileLabel: []
        };
        this.aData = []; // collected data from data lines
        this.oLabels = {}; // labels or line numbers
        this.bMergeFound = false; // if we find chain or chain merge, the program is not complete and we cannot check for existing line numbers during compile time (or do a renumber)
        this.iGosubCount = 0;
        this.iIfCount = 0;
        this.iStopCount = 0;
        this.iForCount = 0; // stack needed
        this.iWhileCount = 0; // stack needed
        this.init(options);
    }
    CodeGeneratorJs.prototype.init = function (options) {
        this.lexer = options.lexer;
        this.parser = options.parser;
        this.tron = options.tron;
        this.rsx = options.rsx;
        this.bQuiet = options.bQuiet || false;
        this.reJsKeywords = CodeGeneratorJs.createJsKeywordRegex();
        this.reset();
    };
    CodeGeneratorJs.prototype.reset = function () {
        var oStack = this.oStack;
        oStack.forLabel.length = 0;
        oStack.forVarName.length = 0;
        oStack.whileLabel.length = 0;
        this.iLine = 0; // current line (label)
        this.resetCountsPerLine();
        this.aData.length = 0;
        this.oLabels = {}; // labels or line numbers
        this.bMergeFound = false; // if we find chain or chain merge, the program is not complete and we cannot check for existing line numbers during compile time (or do a renumber)
        this.lexer.reset();
        this.parser.reset();
    };
    CodeGeneratorJs.prototype.resetCountsPerLine = function () {
        this.iGosubCount = 0;
        this.iIfCount = 0;
        this.iStopCount = 0;
        this.iForCount = 0; // stack needed
        this.iWhileCount = 0; // stack needed
    };
    CodeGeneratorJs.prototype.composeError = function () {
        var aArgs = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            aArgs[_i] = arguments[_i];
        }
        aArgs.unshift("CodeGeneratorJs");
        aArgs.push(this.iLine);
        return Utils_1.Utils.composeError.apply(null, aArgs);
    };
    CodeGeneratorJs.createJsKeywordRegex = function () {
        var reJsKeywords = new RegExp("^(" + CodeGeneratorJs.aJsKeywords.join("|") + ")$");
        return reJsKeywords;
    };
    //
    // evaluate
    //
    CodeGeneratorJs.prototype.evaluate = function (parseTree, oVariables) {
        var that = this, // eslint-disable-line @typescript-eslint/no-this-alias
        fnDeclareVariable = function (sName) {
            if (!oVariables.variableExist(sName)) { // variable not yet defined?
                oVariables.initVariable(sName);
            }
        };
        var oDevScopeArgs = null, bDevScopeArgsCollect = false;
        var fnAdaptVariableName = function (sName, iArrayIndices) {
            sName = sName.toLowerCase();
            sName = sName.replace(/\./g, "_");
            if (oDevScopeArgs || !Utils_1.Utils.bSupportReservedNames) { // avoid keywords as def fn parameters; and for IE8 avoid keywords in dot notation
                if (that.reJsKeywords.test(sName)) { // IE8: avoid keywords in dot notation
                    sName = "_" + sName; // prepend underscore
                }
            }
            if (sName.endsWith("!")) { // real number?
                sName = sName.slice(0, -1) + "R"; // "!" => "R"
            }
            else if (sName.endsWith("%")) { // integer number?
                sName = sName.slice(0, -1) + "I";
            }
            if (iArrayIndices) {
                sName += "A".repeat(iArrayIndices);
            }
            if (oDevScopeArgs) {
                if (sName === "o") { // we must not use format parameter "o" since this is our vm object
                    sName = "oNo"; // change variable name to something we cannot set in BASIC
                }
                if (bDevScopeArgsCollect) {
                    oDevScopeArgs[sName] = 1; // declare devscope variable
                }
                else if (!(sName in oDevScopeArgs)) {
                    // variable
                    fnDeclareVariable(sName);
                    sName = "v." + sName; // access with "v."
                }
            }
            else {
                fnDeclareVariable(sName);
                sName = "v." + sName; // access with "v."
            }
            return sName;
        }, fnParseOneArg = function (oArg) {
            var sValue = parseNode(oArg); // eslint-disable-line no-use-before-define
            return sValue;
        }, fnParseArgRange = function (aArgs, iStart, iStop) {
            var aNodeArgs = []; // do not modify node.args here (could be a parameter of defined function)
            for (var i = iStart; i <= iStop; i += 1) {
                aNodeArgs.push(fnParseOneArg(aArgs[i]));
            }
            return aNodeArgs;
        }, fnParseArgs = function (aArgs) {
            var aNodeArgs = []; // do not modify node.args here (could be a parameter of defined function)
            for (var i = 0; i < aArgs.length; i += 1) {
                aNodeArgs[i] = fnParseOneArg(aArgs[i]);
            }
            return aNodeArgs;
        }, fnDetermineStaticVarType = function (sName) {
            return oVariables.determineStaticVarType(sName);
        }, fnIsIntConst = function (a) {
            var reIntConst = /^[+-]?([0-9]+|0x[0-9a-f]+|0b[0-1]+)$/; // regex for integer, hex, binary constant
            return reIntConst.test(a);
        }, fnGetRoundString = function (node) {
            if (node.pt !== "I") { // no rounding needed for integer, hex, binary constants, integer variables, functions returning integer (optimization)
                node.pv = "o.vmRound(" + node.pv + ")";
            }
            return node.pv;
        }, fnIsInString = function (sString, sFind) {
            return sFind && sString.indexOf(sFind) >= 0;
        }, fnPropagateStaticTypes = function (node, oLeft, oRight, sTypes) {
            if (oLeft.pt && oRight.pt) {
                if (fnIsInString(sTypes, oLeft.pt + oRight.pt)) {
                    node.pt = oLeft.pt === oRight.pt ? oLeft.pt : "R";
                }
                else {
                    throw that.composeError(Error(), "Type error", node.value, node.pos);
                }
            }
            else if (oLeft.pt && !fnIsInString(sTypes, oLeft.pt) || oRight.pt && !fnIsInString(sTypes, oRight.pt)) {
                throw that.composeError(Error(), "Type error", node.value, node.pos);
            }
        }, mOperators = {
            "+": function (node, oLeft, oRight) {
                var a = oLeft.pv;
                if (oRight === undefined) { // unary plus? => skip it
                    node.pv = a;
                    if (fnIsInString("IR$", oLeft.pt)) { // I, R or $?
                        node.pt = oLeft.pt;
                    }
                    else if (oLeft.pt) {
                        throw that.composeError(Error(), "Type error", node.value, node.pos);
                    }
                }
                else {
                    node.pv = a + " + " + oRight.pv;
                    fnPropagateStaticTypes(node, oLeft, oRight, "II RR IR RI $$");
                }
                return node.pv;
            },
            "-": function (node, oLeft, oRight) {
                var a = oLeft.pv;
                if (oRight === undefined) { // unary minus?
                    // when optimizing, beware of "--" operator in JavaScript!
                    if (fnIsIntConst(a) || oLeft.type === "number") { // int const or number const (also fp)
                        //already string a = String(a); // also ok for hex or bin strings
                        if (a.charAt(0) === "-") { // starting already with "-"?
                            node.pv = a.substr(1); // remove "-"
                        }
                        else {
                            node.pv = "-" + a;
                        }
                    }
                    else {
                        node.pv = "-(" + a + ")"; // a can be an expression
                    }
                    if (fnIsInString("IR", oLeft.pt)) { // I or R?
                        node.pt = oLeft.pt;
                    }
                    else if (oLeft.pt) {
                        throw that.composeError(Error(), "Type error", node.value, node.pos);
                    }
                }
                else {
                    node.pv = a + " - " + oRight.pv;
                    fnPropagateStaticTypes(node, oLeft, oRight, "II RR IR RI");
                }
                return node.pv;
            },
            "*": function (node, oLeft, oRight) {
                node.pv = oLeft.pv + " * " + oRight.pv;
                fnPropagateStaticTypes(node, oLeft, oRight, "II RR IR RI");
                return node.pv;
            },
            "/": function (node, oLeft, oRight) {
                node.pv = oLeft.pv + " / " + oRight.pv;
                fnPropagateStaticTypes(node, oLeft, oRight, "II RR IR RI");
                return node.pv;
            },
            "\\": function (node, oLeft, oRight) {
                node.pv = "(" + oLeft.pv + " / " + oRight.pv + ") | 0"; // integer division
                fnPropagateStaticTypes(node, oLeft, oRight, "II RR IR RI");
                node.pt = "I";
                return node.pv;
            },
            "^": function (node, oLeft, oRight) {
                node.pv = "Math.pow(" + oLeft.pv + ", " + oRight.pv + ")";
                fnPropagateStaticTypes(node, oLeft, oRight, "II RR IR RI");
                return node.pv;
            },
            and: function (node, oLeft, oRight) {
                node.pv = fnGetRoundString(oLeft) + " & " + fnGetRoundString(oRight);
                fnPropagateStaticTypes(node, oLeft, oRight, "II RR IR RI");
                node.pt = "I";
                return node.pv;
            },
            or: function (node, oLeft, oRight) {
                node.pv = fnGetRoundString(oLeft) + " | " + fnGetRoundString(oRight);
                fnPropagateStaticTypes(node, oLeft, oRight, "II RR IR RI");
                node.pt = "I";
                return node.pv;
            },
            xor: function (node, oLeft, oRight) {
                node.pv = fnGetRoundString(oLeft) + " ^ " + fnGetRoundString(oRight);
                fnPropagateStaticTypes(node, oLeft, oRight, "II RR IR RI");
                node.pt = "I";
                return node.pv;
            },
            not: function (node, oRight) {
                node.pv = "~(" + fnGetRoundString(oRight) + ")"; // a can be an expression
                node.pt = "I";
                return node.pv;
            },
            mod: function (node, oLeft, oRight) {
                node.pv = fnGetRoundString(oLeft) + " % " + fnGetRoundString(oRight);
                fnPropagateStaticTypes(node, oLeft, oRight, "II RR IR RI");
                node.pt = "I";
                return node.pv;
            },
            ">": function (node, oLeft, oRight) {
                node.pv = oLeft.pv + " > " + oRight.pv + " ? -1 : 0";
                fnPropagateStaticTypes(node, oLeft, oRight, "II RR IR RI $$");
                node.pt = "I";
                return node.pv;
            },
            "<": function (node, oLeft, oRight) {
                node.pv = oLeft.pv + " < " + oRight.pv + " ? -1 : 0";
                fnPropagateStaticTypes(node, oLeft, oRight, "II RR IR RI $$");
                node.pt = "I";
                return node.pv;
            },
            ">=": function (node, oLeft, oRight) {
                node.pv = oLeft.pv + " >= " + oRight.pv + " ? -1 : 0";
                fnPropagateStaticTypes(node, oLeft, oRight, "II RR IR RI $$");
                node.pt = "I";
                return node.pv;
            },
            "<=": function (node, oLeft, oRight) {
                node.pv = oLeft.pv + " <= " + oRight.pv + " ? -1 : 0";
                fnPropagateStaticTypes(node, oLeft, oRight, "II RR IR RI $$");
                node.pt = "I";
                return node.pv;
            },
            "=": function (node, oLeft, oRight) {
                node.pv = oLeft.pv + " === " + oRight.pv + " ? -1 : 0";
                fnPropagateStaticTypes(node, oLeft, oRight, "II RR IR RI $$");
                node.pt = "I";
                return node.pv;
            },
            "<>": function (node, oLeft, oRight) {
                node.pv = oLeft.pv + " !== " + oRight.pv + " ? -1 : 0";
                fnPropagateStaticTypes(node, oLeft, oRight, "II RR IR RI $$");
                node.pt = "I";
                return node.pv;
            },
            "@": function (node, oRight) {
                node.pv = 'o.addressOf("' + oRight.pv + '")'; // address of
                if (oRight.type !== "identifier") {
                    throw that.composeError(Error(), "Expected identifier", node.value, node.pos);
                }
                node.pt = "I";
                return node.pv;
            },
            "#": function (node, oRight) {
                node.pv = oRight.pv;
                node.pt = "I";
                return node.pv;
            }
        }, mParseFunctions = {
            fnParseDefIntRealStr: function (node) {
                var aNodeArgs = fnParseArgs(node.args);
                for (var i = 0; i < aNodeArgs.length; i += 1) {
                    var sArg = aNodeArgs[i];
                    aNodeArgs[i] = "o." + node.type + '("' + sArg + '")';
                }
                node.pv = aNodeArgs.join("; ");
                return node.pv;
            },
            fnParseErase: function (node) {
                oDevScopeArgs = {};
                bDevScopeArgsCollect = true;
                var aNodeArgs = fnParseArgs(node.args);
                bDevScopeArgsCollect = false;
                oDevScopeArgs = null;
                for (var i = 0; i < aNodeArgs.length; i += 1) {
                    aNodeArgs[i] = '"' + aNodeArgs[i] + '"'; // put in quotes
                }
                node.pv = "o." + node.type + "(" + aNodeArgs.join(", ") + ")";
                return node.pv;
            },
            fnAddReferenceLabel: function (sLabel, node) {
                if (sLabel in that.oLabels) {
                    that.oLabels[sLabel] += 1;
                }
                else {
                    if (Utils_1.Utils.debug > 1) {
                        Utils_1.Utils.console.debug("fnAddReferenceLabel: line does not (yet) exist:", sLabel);
                    }
                    if (!that.bMergeFound) {
                        throw that.composeError(Error(), "Line does not exist", sLabel, node.pos);
                    }
                }
            },
            fnCommandWithGoto: function (node, aNodeArgs) {
                var sCommand = node.type;
                aNodeArgs = aNodeArgs || fnParseArgs(node.args);
                var sLabel = that.iLine + "s" + that.iStopCount; // we use stopCount
                that.iStopCount += 1;
                node.pv = "o." + sCommand + "(" + aNodeArgs.join(", ") + "); o.goto(\"" + sLabel + "\"); break;\ncase \"" + sLabel + "\":";
                return node.pv;
            },
            ";": function (node) {
                node.pv = ";";
                return node.pv;
            },
            ",": function (node) {
                node.pv = ",";
                return node.pv;
            },
            "|": function (node) {
                var sRsxName = node.value.substr(1).toLowerCase().replace(/\./g, "_");
                var bRsxAvailable = that.rsx && that.rsx.rsxIsAvailable(sRsxName), aNodeArgs = fnParseArgs(node.args), sLabel = that.iLine + "s" + that.iStopCount; // we use stopCount
                that.iStopCount += 1;
                if (!bRsxAvailable) { // if RSX not available, we delay the error until it is executed (or catched by on error goto)
                    if (!that.bQuiet) {
                        var oError = that.composeError(Error(), "Unknown RSX command", node.value, node.pos);
                        Utils_1.Utils.console.warn(oError);
                    }
                    aNodeArgs.unshift('"' + sRsxName + '"'); // put as first arg
                    sRsxName = "rsxExec"; // and call special handler which triggers error if not available
                }
                node.pv = "o.rsx." + sRsxName + "(" + aNodeArgs.join(", ") + "); o.goto(\"" + sLabel + "\"); break;\ncase \"" + sLabel + "\":"; // most RSX commands need goto (era, ren,...)
                return node.pv;
            },
            number: function (node) {
                node.pt = (/^[0-9]+$/).test(node.value) ? "I" : "R";
                node.pv = node.value; // keep string
                return node.pv;
            },
            binnumber: function (node) {
                var sValue = node.value.slice(2); // remove &x
                if (Utils_1.Utils.bSupportsBinaryLiterals) {
                    sValue = "0b" + ((sValue.length) ? sValue : "0"); // &x->0b; 0b is ES6
                }
                else {
                    sValue = "0x" + ((sValue.length) ? parseInt(sValue, 2).toString(16) : "0"); // we convert it to hex
                }
                node.pt = "I";
                node.pv = sValue;
                return node.pv;
            },
            hexnumber: function (node) {
                var sValue = node.value.slice(1); // remove &
                if (sValue.charAt(0).toLowerCase() === "h") { // optional h
                    sValue = sValue.slice(1); // remove
                }
                sValue = "0x" + ((sValue.length) ? sValue : "0"); // &->0x
                node.pt = "I";
                node.pv = sValue;
                return node.pv;
            },
            linenumber: function (node) {
                node.pv = node.value;
                return node.pv;
            },
            identifier: function (node) {
                var aNodeArgs = node.args ? fnParseArgRange(node.args, 1, node.args.length - 2) : [], // array: we skip open and close bracket
                sName = fnAdaptVariableName(node.value, aNodeArgs.length), // here we use node.value
                sValue = sName + aNodeArgs.map(function (val) {
                    return "[" + val + "]";
                }).join("");
                var sVarType = fnDetermineStaticVarType(sName);
                if (sVarType.length > 1) {
                    sVarType = sVarType.charAt(1);
                    node.pt = sVarType;
                }
                node.pv = sValue;
                return node.pv;
            },
            letter: function (node) {
                node.pv = node.value;
                return node.pv;
            },
            range: function (node) {
                var sLeft = fnParseOneArg(node.left), sRight = fnParseOneArg(node.right);
                if (sLeft > sRight) {
                    throw that.composeError(Error(), "Decreasing range", node.value, node.pos);
                }
                node.pv = sLeft + " - " + sRight;
                return node.pv;
            },
            linerange: function (node) {
                var sLeft = fnParseOneArg(node.left), sRight = fnParseOneArg(node.right);
                if (sLeft > sRight) {
                    throw that.composeError(Error(), "Decreasing line range", node.value, node.pos);
                }
                node.pv = !sRight ? sLeft : sLeft + ", " + sRight;
                return node.pv;
            },
            string: function (node) {
                node.pt = "$";
                node.pv = '"' + node.value + '"';
                return node.pv;
            },
            "null": function (node) {
                node.pv = "null";
                return node.pv;
            },
            assign: function (node) {
                // see also "let"
                var sName;
                if (node.left.type === "identifier") {
                    sName = fnParseOneArg(node.left);
                }
                else {
                    throw that.composeError(Error(), "Unexpected assing type", node.type, node.pos); // should not occur
                }
                var value = fnParseOneArg(node.right);
                fnPropagateStaticTypes(node, node.left, node.right, "II RR IR RI $$");
                var sVarType = fnDetermineStaticVarType(sName);
                var sValue;
                if (node.pt) {
                    if (node.left.pt === "I" && node.right.pt === "R") { // special handing for IR: rounding needed
                        sValue = "o.vmRound(" + value + ")";
                        node.pt = "I"; // "R" => "I"
                    }
                    else {
                        sValue = value;
                    }
                }
                else {
                    sValue = "o.vmAssign(\"" + sVarType + "\", " + value + ")";
                }
                sValue = sName + " = " + sValue;
                node.pv = sValue;
                return node.pv;
            },
            label: function (node) {
                var label = node.value;
                that.iLine = Number(label); //TTT set line before parsing args
                that.resetCountsPerLine(); // we want to have "stable" counts, even if other lines change, e.g. direct
                var value = "", bDirect = false;
                if (isNaN(Number(label))) {
                    if (label === "direct") { // special handling
                        bDirect = true;
                        value = "o.goto(\"directEnd\"); break;\n";
                    }
                    label = '"' + label + '"'; // for "direct"
                }
                value += "case " + label + ":";
                var aNodeArgs = fnParseArgs(node.args);
                if (that.tron) {
                    value += " o.vmTrace(\"" + that.iLine + "\");";
                }
                for (var i = 0; i < aNodeArgs.length; i += 1) {
                    var value2 = aNodeArgs[i];
                    if (value2 !== "") {
                        if (!(/[}:;\n]$/).test(value2)) { // does not end with } : ; \n
                            value2 += ";";
                        }
                        else if (value2.substr(-1) === "\n") {
                            value2 = value2.substr(0, value2.length - 1);
                        }
                        value += " " + value2;
                    }
                }
                if (bDirect) {
                    value += "\n o.goto(\"end\"); break;\ncase \"directEnd\":"; // put in next line because of possible "rem"
                }
                node.pv = value;
                return node.pv;
            },
            // special keyword functions
            afterGosub: function (node) {
                var aNodeArgs = fnParseArgs(node.args);
                this.fnAddReferenceLabel(aNodeArgs[2], node.args[2]); // argument 2 = line number
                node.pv = "o." + node.type + "(" + aNodeArgs.join(", ") + ")";
                return node.pv;
            },
            call: function (node) {
                node.pv = this.fnCommandWithGoto(node);
                return node.pv;
            },
            chain: function (node) {
                node.pv = this.fnCommandWithGoto(node);
                return node.pv;
            },
            chainMerge: function (node) {
                that.bMergeFound = true;
                node.pv = this.fnCommandWithGoto(node);
                return node.pv;
            },
            clear: function (node) {
                node.pv = this.fnCommandWithGoto(node);
                return node.pv;
            },
            closeout: function (node) {
                node.pv = this.fnCommandWithGoto(node);
                return node.pv;
            },
            cont: function (node) {
                node.pv = "o." + node.type + "(); break;"; // append break
                return node.pv;
            },
            data: function (node) {
                var aNodeArgs = fnParseArgs(node.args);
                aNodeArgs.unshift(String(that.iLine)); // prepend line number
                that.aData.push("o.data(" + aNodeArgs.join(", ") + ")"); // will be set at the beginning of the script
                node.pv = "/* data */";
                return node.pv;
            },
            def: function (node) {
                var sName = fnParseOneArg(node.left);
                oDevScopeArgs = {};
                bDevScopeArgsCollect = true;
                var aNodeArgs = fnParseArgs(node.args);
                bDevScopeArgsCollect = false;
                var sExpression = fnParseOneArg(node.right);
                oDevScopeArgs = null;
                fnPropagateStaticTypes(node, node.left, node.right, "II RR IR RI $$");
                var sValue;
                if (node.pt) {
                    if (node.left.pt === "I" && node.right.pt === "R") { // special handing for IR: rounding needed
                        sValue = "o.vmRound(" + sExpression + ")";
                        node.pt = "I"; // "R" => "I"
                    }
                    else {
                        sValue = sExpression;
                    }
                }
                else {
                    var sVarType = fnDetermineStaticVarType(sName);
                    sValue = "o.vmAssign(\"" + sVarType + "\", " + sExpression + ")";
                }
                sValue = sName + " = function (" + aNodeArgs.join(", ") + ") { return " + sValue + "; };";
                node.pv = sValue;
                return node.pv;
            },
            defint: function (node) {
                node.pv = this.fnParseDefIntRealStr(node);
                return node.pv;
            },
            defreal: function (node) {
                node.pv = this.fnParseDefIntRealStr(node);
                return node.pv;
            },
            defstr: function (node) {
                node.pv = this.fnParseDefIntRealStr(node);
                return node.pv;
            },
            dim: function (node) {
                var aArgs = [];
                for (var i = 0; i < node.args.length; i += 1) {
                    var oNodeArg = node.args[i];
                    if (oNodeArg.type !== "identifier") {
                        throw that.composeError(Error(), "Expected identifier in DIM", node.type, node.pos);
                    }
                    var aNodeArgs = fnParseArgRange(oNodeArg.args, 1, oNodeArg.args.length - 2), // we skip open and close bracket
                    sFullExpression = fnParseOneArg(oNodeArg);
                    var sName = sFullExpression;
                    sName = sName.substr(2); // remove preceding "v."
                    var iIndex = sName.indexOf("["); // we should always have it
                    sName = sName.substr(0, iIndex);
                    aArgs.push("/* " + sFullExpression + " = */ o.dim(\"" + sName + "\", " + aNodeArgs.join(", ") + ")");
                }
                node.pv = aArgs.join("; ");
                return node.pv;
            },
            "delete": function (node) {
                var aNodeArgs = fnParseArgs(node.args), sName = Utils_1.Utils.bSupportReservedNames ? "o.delete" : 'o["delete"]';
                node.pv = sName + "(" + aNodeArgs.join(", ") + "); break;";
                return node.pv;
            },
            "else": function (node) {
                var aArgs = node.args;
                var sValue = node.type;
                for (var i = 0; i < aArgs.length; i += 1) {
                    var oToken = aArgs[i];
                    if (oToken.value) {
                        sValue += " " + oToken.value;
                    }
                }
                node.pv = "// " + sValue + "\n";
                return node.pv;
            },
            end: function (node) {
                var sName = that.iLine + "s" + that.iStopCount; // same as stop, use also stopCount
                that.iStopCount += 1;
                node.pv = "o.end(\"" + sName + "\"); break;\ncase \"" + sName + "\":";
                return node.pv;
            },
            erase: function (node) {
                var value = this.fnParseErase(node);
                node.pv = value;
                return node.pv;
            },
            error: function (node) {
                var aNodeArgs = fnParseArgs(node.args);
                node.pv = "o.error(" + aNodeArgs[0] + "); break";
                return node.pv;
            },
            everyGosub: function (node) {
                var aNodeArgs = fnParseArgs(node.args);
                this.fnAddReferenceLabel(aNodeArgs[2], node.args[2]); // argument 2 = line number
                node.pv = "o." + node.type + "(" + aNodeArgs.join(", ") + ")";
                return node.pv;
            },
            fn: function (node) {
                var aNodeArgs = fnParseArgs(node.args), sName = fnParseOneArg(node.left);
                if (node.left.pt) {
                    node.pt = node.left.pt;
                }
                node.pv = sName + "(" + aNodeArgs.join(", ") + ")";
                return node.pv;
            },
            "for": function (node) {
                var aNodeArgs = fnParseArgs(node.args), sVarName = aNodeArgs[0], sLabel = that.iLine + "f" + that.iForCount;
                that.oStack.forLabel.push(sLabel);
                that.oStack.forVarName.push(sVarName);
                that.iForCount += 1;
                var startValue = aNodeArgs[1], endValue = aNodeArgs[2], stepValue = aNodeArgs[3];
                if (stepValue === "null") {
                    stepValue = "1";
                }
                var startNode = node.args[1], //TTT
                endNode = node.args[2], stepNode = node.args[3], 
                // optimization for integer constants (check value and not type, because we also want to accept e.g. -<number>):
                bStartIsIntConst = fnIsIntConst(startValue), bEndIsIntConst = fnIsIntConst(endValue), bStepIsIntConst = fnIsIntConst(stepValue), sVarType = fnDetermineStaticVarType(sVarName), sType = (sVarType.length > 1) ? sVarType.charAt(1) : "";
                if (sType === "$") {
                    throw that.composeError(Error(), "String type in FOR at", node.type, node.pos);
                }
                if (!bStartIsIntConst) {
                    if (startNode.pt !== "I") {
                        startValue = "o.vmAssign(\"" + sVarType + "\", " + startValue + ")"; // assign checks and rounds, if needed
                    }
                }
                var sEndName;
                if (!bEndIsIntConst) {
                    if (endNode.pt !== "I") {
                        endValue = "o.vmAssign(\"" + sVarType + "\", " + endValue + ")";
                    }
                    sEndName = sVarName + "End";
                    var value2 = sEndName.substr(2); // remove preceding "v."
                    fnDeclareVariable(value2); // declare also end variable
                }
                var sStepName;
                if (!bStepIsIntConst) {
                    if (stepNode.pt !== "I") {
                        stepValue = "o.vmAssign(\"" + sVarType + "\", " + stepValue + ")";
                    }
                    sStepName = sVarName + "Step";
                    var value2 = sStepName.substr(2); // remove preceding "v."
                    fnDeclareVariable(value2); // declare also step variable
                }
                var value = "/* for() */";
                if (sType !== "I") {
                    value += " o.vmAssertNumberType(\"" + sVarType + "\");"; // do a type check: assert number type
                }
                value += " " + sVarName + " = " + startValue + ";";
                if (!bEndIsIntConst) {
                    value += " " + sEndName + " = " + endValue + ";";
                }
                if (!bStepIsIntConst) {
                    value += " " + sStepName + " = " + stepValue + ";";
                }
                value += " o.goto(\"" + sLabel + "b\"); break;";
                value += "\ncase \"" + sLabel + "\": ";
                value += sVarName + " += " + (bStepIsIntConst ? stepValue : sStepName) + ";";
                value += "\ncase \"" + sLabel + "b\": ";
                var sEndNameOrValue = bEndIsIntConst ? endValue : sEndName;
                if (bStepIsIntConst) {
                    if (Number(stepValue) > 0) {
                        value += "if (" + sVarName + " > " + sEndNameOrValue + ") { o.goto(\"" + sLabel + "e\"); break; }";
                    }
                    else if (Number(stepValue) < 0) {
                        value += "if (" + sVarName + " < " + sEndNameOrValue + ") { o.goto(\"" + sLabel + "e\"); break; }";
                    }
                    else { // stepValue === 0 => endless loop, if starting with variable < end
                        value += "if (" + sVarName + " < " + sEndNameOrValue + ") { o.goto(\"" + sLabel + "e\"); break; }";
                    }
                }
                else {
                    value += "if (" + sStepName + " > 0 && " + sVarName + " > " + sEndNameOrValue + " || " + sStepName + " < 0 && " + sVarName + " < " + sEndNameOrValue + ") { o.goto(\"" + sLabel + "e\"); break; }";
                }
                node.pv = value;
                return node.pv;
            },
            frame: function (node) {
                node.pv = this.fnCommandWithGoto(node);
                return node.pv;
            },
            gosub: function (node) {
                var aNodeArgs = fnParseArgs(node.args), sLine = aNodeArgs[0], sName = that.iLine + "g" + that.iGosubCount;
                that.iGosubCount += 1;
                this.fnAddReferenceLabel(sLine, node.args[0]);
                node.pv = 'o.gosub("' + sName + '", ' + sLine + '); break; \ncase "' + sName + '":';
                return node.pv;
            },
            "goto": function (node) {
                var aNodeArgs = fnParseArgs(node.args), sLine = aNodeArgs[0];
                this.fnAddReferenceLabel(sLine, node.args[0]);
                node.pv = "o.goto(" + sLine + "); break";
                return node.pv;
            },
            "if": function (node) {
                var sLabel = that.iLine + "i" + that.iIfCount;
                that.iIfCount += 1;
                var value = "if (" + fnParseOneArg(node.left) + ') { o.goto("' + sLabel + '"); break; } ';
                if (node.args2) { // "else" statements?
                    var aNodeArgs2 = fnParseArgs(node.args2), sPart2 = aNodeArgs2.join("; ");
                    value += "/* else */ " + sPart2 + "; ";
                }
                value += 'o.goto("' + sLabel + 'e"); break;';
                var aNodeArgs = fnParseArgs(node.args), // "then" statements
                sPart = aNodeArgs.join("; ");
                value += '\ncase "' + sLabel + '": ' + sPart + ";";
                value += '\ncase "' + sLabel + 'e": ';
                node.pv = value;
                return node.pv;
            },
            input: function (node) {
                var aNodeArgs = fnParseArgs(node.args), aVarTypes = [];
                var sLabel = that.iLine + "s" + that.iStopCount;
                that.iStopCount += 1;
                var sStream = aNodeArgs.shift();
                var sNoCRLF = aNodeArgs.shift();
                if (sNoCRLF === ";") { // ; or null
                    sNoCRLF = '"' + sNoCRLF + '"';
                }
                var sMsg = aNodeArgs.shift();
                if (node.args[2].type === "null") { // message type
                    sMsg = '""';
                }
                var sPrompt = aNodeArgs.shift();
                if (sPrompt === ";" || sPrompt === "null") { // ";" => insert prompt "? " in quoted string
                    sMsg = sMsg.substr(0, sMsg.length - 1) + "? " + sMsg.substr(-1, 1);
                }
                for (var i = 0; i < aNodeArgs.length; i += 1) {
                    aVarTypes[i] = fnDetermineStaticVarType(aNodeArgs[i]);
                }
                var value = "o.goto(\"" + sLabel + "\"); break;\ncase \"" + sLabel + "\":"; // also before input
                sLabel = that.iLine + "s" + that.iStopCount;
                that.iStopCount += 1;
                value += "o." + node.type + "(" + sStream + ", " + sNoCRLF + ", " + sMsg + ", \"" + aVarTypes.join('", "') + "\"); o.goto(\"" + sLabel + "\"); break;\ncase \"" + sLabel + "\":";
                for (var i = 0; i < aNodeArgs.length; i += 1) {
                    value += "; " + aNodeArgs[i] + " = o.vmGetNextInput()";
                }
                node.pv = value;
                return node.pv;
            },
            let: function (node) {
                node.pv = this.assign(node.right);
                return node.pv;
            },
            lineInput: function (node) {
                return this.input(node); // similar to input but with one arg of type string only
            },
            list: function (node) {
                var aNodeArgs = fnParseArgs(node.args); // or: fnCommandWithGoto
                if (node.args.length && node.args[node.args.length - 1].type === "#") { // last parameter stream?
                    var stream = aNodeArgs.pop();
                    aNodeArgs.unshift(stream); // put it first
                }
                node.pv = "o.list(" + aNodeArgs.join(", ") + "); break;";
                return node.pv;
            },
            load: function (node) {
                node.pv = this.fnCommandWithGoto(node);
                return node.pv;
            },
            merge: function (node) {
                that.bMergeFound = true;
                node.pv = this.fnCommandWithGoto(node);
                return node.pv;
            },
            mid$Assign: function (node) {
                var aNodeArgs = fnParseArgs(node.args);
                if (aNodeArgs.length < 3) {
                    aNodeArgs.push("null"); // empty length
                }
                var sRight = fnParseOneArg(node.right);
                aNodeArgs.push(sRight);
                var sName = aNodeArgs[0], sVarType = fnDetermineStaticVarType(sName), sValue = sName + " = o.vmAssign(\"" + sVarType + "\", o.mid$Assign(" + aNodeArgs.join(", ") + "))";
                node.pv = sValue;
                return node.pv;
            },
            "new": function (node) {
                var sName = Utils_1.Utils.bSupportReservedNames ? "o.new" : 'o["new"]';
                node.pv = sName + "();";
                return node.pv;
            },
            next: function (node) {
                var aNodeArgs = fnParseArgs(node.args);
                if (!aNodeArgs.length) {
                    aNodeArgs.push(""); // we have no variable, so use empty argument
                }
                for (var i = 0; i < aNodeArgs.length; i += 1) {
                    var sLabel = that.oStack.forLabel.pop(), sVarName = that.oStack.forVarName.pop();
                    var oErrorNode = void 0;
                    if (sLabel === undefined) {
                        if (aNodeArgs[i] === "") { // inserted node?
                            oErrorNode = node;
                        }
                        else { // identifier arg
                            oErrorNode = node.args[i];
                        }
                        throw that.composeError(Error(), "Unexpected NEXT", oErrorNode.type, oErrorNode.pos);
                    }
                    if (aNodeArgs[i] !== "" && aNodeArgs[i] !== sVarName) {
                        oErrorNode = node.args[i];
                        throw that.composeError(Error(), "Unexpected NEXT variable", oErrorNode.value, oErrorNode.pos);
                    }
                    aNodeArgs[i] = "/* next(\"" + aNodeArgs[i] + "\") */ o.goto(\"" + sLabel + "\"); break;\ncase \"" + sLabel + "e\":";
                }
                node.pv = aNodeArgs.join("; ");
                return node.pv;
            },
            onBreakGosub: function (node) {
                var aNodeArgs = fnParseArgs(node.args), sLine = aNodeArgs[0];
                this.fnAddReferenceLabel(sLine, node.args[0]);
                node.pv = "o." + node.type + "(" + sLine + ")";
                return node.pv;
            },
            onErrorGoto: function (node) {
                var aNodeArgs = fnParseArgs(node.args), sLine = aNodeArgs[0];
                if (Number(sLine)) { // only for lines > 0
                    this.fnAddReferenceLabel(sLine, node.args[0]);
                }
                node.pv = "o." + node.type + "(" + sLine + ")";
                return node.pv;
            },
            onGosub: function (node) {
                var aNodeArgs = fnParseArgs(node.args), sName = node.type, sLabel = that.iLine + "g" + that.iGosubCount;
                that.iGosubCount += 1;
                for (var i = 1; i < aNodeArgs.length; i += 1) { // start with argument 1
                    this.fnAddReferenceLabel(aNodeArgs[i], node.args[i]);
                }
                aNodeArgs.unshift('"' + sLabel + '"');
                node.pv = "o." + sName + "(" + aNodeArgs.join(", ") + '); break; \ncase "' + sLabel + '":';
                return node.pv;
            },
            onGoto: function (node) {
                var aNodeArgs = fnParseArgs(node.args), sName = node.type, sLabel = that.iLine + "s" + that.iStopCount;
                that.iStopCount += 1;
                for (var i = 1; i < aNodeArgs.length; i += 1) { // start with argument 1
                    this.fnAddReferenceLabel(aNodeArgs[i], node.args[i]);
                }
                aNodeArgs.unshift('"' + sLabel + '"');
                node.pv = "o." + sName + "(" + aNodeArgs.join(", ") + "); break\ncase \"" + sLabel + "\":";
                return node.pv;
            },
            onSqGosub: function (node) {
                var aNodeArgs = fnParseArgs(node.args);
                this.fnAddReferenceLabel(aNodeArgs[1], node.args[1]); // argument 1: line number
                node.pv = "o." + node.type + "(" + aNodeArgs.join(", ") + ")";
                return node.pv;
            },
            openin: function (node) {
                return this.fnCommandWithGoto(node);
            },
            print: function (node) {
                var aArgs = node.args, aNodeArgs = [];
                var bNewLine = true;
                for (var i = 0; i < aArgs.length; i += 1) {
                    var oArg = aArgs[i];
                    var sArg = fnParseOneArg(oArg);
                    if (i === aArgs.length - 1) {
                        if (oArg.type === ";" || oArg.type === "," || oArg.type === "spc" || oArg.type === "tab") {
                            bNewLine = false;
                        }
                    }
                    if (oArg.type === ",") { // comma tab
                        sArg = "{type: \"commaTab\", args: []}"; // we must delay the commaTab() call until print() is called
                        aNodeArgs.push(sArg);
                    }
                    else if (oArg.type !== ";") { // ignore ";" separators
                        aNodeArgs.push(sArg);
                    }
                }
                if (bNewLine) {
                    var sArg2 = '"\\r\\n"';
                    aNodeArgs.push(sArg2);
                }
                node.pv = "o." + node.type + "(" + aNodeArgs.join(", ") + ")";
                return node.pv;
            },
            randomize: function (node) {
                var value;
                if (node.args.length) {
                    var aNodeArgs = fnParseArgs(node.args);
                    value = "o." + node.type + "(" + aNodeArgs.join(", ") + ")";
                }
                else {
                    var sLabel = that.iLine + "s" + that.iStopCount;
                    that.iStopCount += 1;
                    value = "o.goto(\"" + sLabel + "\"); break;\ncase \"" + sLabel + "\":"; // also before input
                    value += this.fnCommandWithGoto(node) + " o.randomize(o.vmGetNextInput())";
                }
                node.pv = value;
                return node.pv;
            },
            read: function (node) {
                var aNodeArgs = fnParseArgs(node.args);
                for (var i = 0; i < aNodeArgs.length; i += 1) {
                    var sName = aNodeArgs[i], sVarType = fnDetermineStaticVarType(sName);
                    aNodeArgs[i] = sName + " = o.read(\"" + sVarType + "\")";
                }
                node.pv = aNodeArgs.join("; ");
                return node.pv;
            },
            rem: function (node) {
                var aNodeArgs = fnParseArgs(node.args);
                var sValue = aNodeArgs[0];
                if (sValue !== undefined) {
                    sValue = " " + sValue.substr(1, sValue.length - 2); // remove surrounding quotes
                }
                else {
                    sValue = "";
                }
                node.pv = "//" + sValue + "\n";
                return node.pv;
            },
            renum: function (node) {
                node.pv = this.fnCommandWithGoto(node);
                return node.pv;
            },
            restore: function (node) {
                var aNodeArgs = fnParseArgs(node.args);
                if (aNodeArgs.length) {
                    this.fnAddReferenceLabel(aNodeArgs[0], node.args[0]); // optional line number
                }
                node.pv = "o." + node.type + "(" + aNodeArgs.join(", ") + ")";
                return node.pv;
            },
            resume: function (node) {
                var aNodeArgs = fnParseArgs(node.args);
                if (aNodeArgs.length) {
                    this.fnAddReferenceLabel(aNodeArgs[0], node.args[0]); // optional line number
                }
                node.pv = "o." + node.type + "(" + aNodeArgs.join(", ") + "); break"; // append break
                return node.pv;
            },
            "return": function (node) {
                var sName = Utils_1.Utils.bSupportReservedNames ? "o.return" : 'o["return"]';
                node.pv = sName + "(); break;";
                return node.pv;
            },
            run: function (node) {
                if (node.args.length) {
                    if (node.args[0].type === "linenumber" || node.args[0].type === "number") { // optional line number //TTT should be linenumber only
                        this.fnAddReferenceLabel(fnParseOneArg(node.args[0]), node.args[0]); // parse only one arg, args are parsed later
                    }
                }
                node.pv = this.fnCommandWithGoto(node);
                return node.pv;
            },
            save: function (node) {
                var aNodeArgs = [];
                if (node.args.length) {
                    var sFileName = fnParseOneArg(node.args[0]);
                    aNodeArgs.push(sFileName);
                    if (node.args.length > 1) {
                        oDevScopeArgs = {};
                        bDevScopeArgsCollect = true;
                        var sType = '"' + fnParseOneArg(node.args[1]) + '"';
                        aNodeArgs.push(sType);
                        bDevScopeArgsCollect = false;
                        oDevScopeArgs = null;
                        var aNodeArgs2 = node.args.slice(2), // get remaining args
                        aNodeArgs3 = fnParseArgs(aNodeArgs2);
                        aNodeArgs = aNodeArgs.concat(aNodeArgs3);
                    }
                }
                node.pv = this.fnCommandWithGoto(node, aNodeArgs);
                return node.pv;
            },
            sound: function (node) {
                node.pv = this.fnCommandWithGoto(node); // maybe queue is full, so insert break
                return node.pv;
            },
            spc: function (node) {
                var aNodeArgs = fnParseArgs(node.args);
                node.pv = "{type: \"spc\", args: [" + aNodeArgs.join(", ") + "]}"; // we must delay the spc() call until print() is called because we need stream
                return node.pv;
            },
            stop: function (node) {
                var sName = that.iLine + "s" + that.iStopCount;
                that.iStopCount += 1;
                node.pv = "o.stop(\"" + sName + "\"); break;\ncase \"" + sName + "\":";
                return node.pv;
            },
            tab: function (node) {
                var aNodeArgs = fnParseArgs(node.args);
                node.pv = "{type: \"tab\", args: [" + aNodeArgs.join(", ") + "]}"; // we must delay the tab() call until print() is called
                return node.pv;
            },
            wend: function (node) {
                var sLabel = that.oStack.whileLabel.pop();
                if (sLabel === undefined) {
                    throw that.composeError(Error(), "Unexpected WEND", node.type, node.pos);
                }
                node.pv = "/* o.wend() */ o.goto(\"" + sLabel + "\"); break;\ncase \"" + sLabel + "e\":";
                return node.pv;
            },
            "while": function (node) {
                var aNodeArgs = fnParseArgs(node.args), sLabel = that.iLine + "w" + that.iWhileCount;
                that.oStack.whileLabel.push(sLabel);
                that.iWhileCount += 1;
                node.pv = "\ncase \"" + sLabel + "\": if (!(" + aNodeArgs + ")) { o.goto(\"" + sLabel + "e\"); break; }";
                return node.pv;
            }
        }, fnParseOther = function (node) {
            var aNodeArgs = fnParseArgs(node.args), sTypeWithSpaces = " " + node.type + " ";
            node.pv = "o." + node.type + "(" + aNodeArgs.join(", ") + ")";
            if (fnIsInString(" asc cint derr eof erl err fix fre inkey inp instr int joy len memory peek pos remain sgn sq test testr unt vpos xpos ypos ", sTypeWithSpaces)) {
                node.pt = "I";
            }
            else if (fnIsInString(" abs atn cos creal exp log log10 max min pi rnd round sin sqr tan time val ", sTypeWithSpaces)) {
                node.pt = "R";
            }
            else if (fnIsInString(" bin$ chr$ copychr$ dec$ hex$ inkey$ left$ lower$ mid$ right$ space$ str$ string$ upper$ ", sTypeWithSpaces)) {
                node.pt = "$";
            }
            return node.pv;
        }, parseNode = function (node) {
            if (Utils_1.Utils.debug > 3) {
                Utils_1.Utils.console.debug("evaluate: parseNode node=%o type=" + node.type + " value=" + node.value + " left=%o right=%o args=%o", node, node.left, node.right, node.args);
            }
            var value;
            if (mOperators[node.type]) {
                if (node.left) {
                    value = parseNode(node.left);
                    if (mOperators[node.left.type] && node.left.left) { // binary operator?
                        value = "(" + value + ")";
                        node.left.pv = value;
                    }
                    var value2 = parseNode(node.right);
                    if (mOperators[node.right.type] && node.right.left) { // binary operator?
                        value2 = "(" + value2 + ")";
                        node.right.pv = value2;
                    }
                    value = mOperators[node.type](node, node.left, node.right);
                }
                else {
                    value = parseNode(node.right);
                    value = mOperators[node.type](node, node.right);
                }
            }
            else if (mParseFunctions[node.type]) { // function with special handling?
                value = mParseFunctions[node.type](node);
            }
            else { // for other functions, generate code directly
                value = fnParseOther(node);
            }
            return value;
        }, fnCommentUnusedCases = function (sOutput2, oLabels2) {
            sOutput2 = sOutput2.replace(/^case (\d+):/gm, function (sAll, sLine) {
                return (oLabels2[sLine]) ? sAll : "/* " + sAll + " */";
            });
            return sOutput2;
        }, fnCreateLabelsMap = function (oLabels2) {
            var iLastLine = -1;
            for (var i = 0; i < parseTree.length; i += 1) {
                var oNode = parseTree[i];
                if (oNode.type === "label") {
                    var sLine = oNode.value;
                    if (sLine in oLabels2) {
                        throw that.composeError(Error(), "Duplicate line number", sLine, oNode.pos);
                    }
                    var iLine = Number(sLine);
                    if (!isNaN(iLine)) { // not for "direct"
                        if (iLine <= iLastLine) {
                            throw that.composeError(Error(), "Line number not increasing", sLine, oNode.pos);
                        }
                        if (iLine < 1 || iLine > 65535) {
                            throw that.composeError(Error(), "Line number overflow", sLine, oNode.pos);
                        }
                        iLastLine = iLine;
                    }
                    oLabels2[sLine] = 0; // init call count
                }
            }
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
            // optimize: comment lines which are not referenced
            if (!that.bMergeFound) {
                sOutput = fnCommentUnusedCases(sOutput, that.oLabels);
            }
            return sOutput;
        };
        // create labels map
        fnCreateLabelsMap(this.oLabels);
        return fnEvaluate();
    };
    CodeGeneratorJs.prototype.generate = function (sInput, oVariables, bAllowDirect) {
        var fnCombineData = function (aData) {
            var sData = "";
            sData = aData.join(";\n");
            if (sData.length) {
                sData += ";\n";
            }
            return sData;
        }, oOut = {
            text: "",
            error: undefined
        };
        try {
            var aTokens = this.lexer.lex(sInput), aParseTree = this.parser.parse(aTokens, bAllowDirect), sOutput = this.evaluate(aParseTree, oVariables);
            oOut.text = '"use strict"\n'
                + "var v=o.vmGetAllVariables();\n"
                + "while (o.vmLoopCondition()) {\nswitch (o.iLine) {\ncase 0:\n"
                + fnCombineData(this.aData)
                + " o.goto(o.iStartLine ? o.iStartLine : \"start\"); break;\ncase \"start\":\n"
                + sOutput
                + "\ncase \"end\": o.vmStop(\"end\", 90); break;\ndefault: o.error(8); o.goto(\"end\"); break;\n}}\n";
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
    // ECMA 3 JS Keywords which must be avoided in dot notation for properties when using IE8
    CodeGeneratorJs.aJsKeywords = [
        "do",
        "if",
        "in",
        "for",
        "int",
        "new",
        "try",
        "var",
        "byte",
        "case",
        "char",
        "else",
        "enum",
        "goto",
        "long",
        "null",
        "this",
        "true",
        "void",
        "with",
        "break",
        "catch",
        "class",
        "const",
        "false",
        "final",
        "float",
        "short",
        "super",
        "throw",
        "while",
        "delete",
        "double",
        "export",
        "import",
        "native",
        "public",
        "return",
        "static",
        "switch",
        "throws",
        "typeof",
        "boolean",
        "default",
        "extends",
        "finally",
        "package",
        "private",
        "abstract",
        "continue",
        "debugger",
        "function",
        "volatile",
        "interface",
        "protected",
        "transient",
        "implements",
        "instanceof",
        "synchronized"
    ];
    return CodeGeneratorJs;
}());
exports.CodeGeneratorJs = CodeGeneratorJs;
//# sourceMappingURL=CodeGeneratorJs.js.map