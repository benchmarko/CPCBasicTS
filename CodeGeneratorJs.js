"use strict";
// CodeGeneratorJs.ts - Code Generator for JavaScript
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//
//
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeGeneratorJs = void 0;
var Utils_1 = require("./Utils");
var CodeGeneratorJs = /** @class */ (function () {
    function CodeGeneratorJs(options) {
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
        // for evaluate:
        this.oVariables = {}; // will be set later
        /* eslint-disable no-invalid-this */
        this.mOperators = {
            "+": this.plus,
            "-": this.minus,
            "*": this.mult,
            "/": this.div,
            "\\": this.intDiv,
            "^": this.exponent,
            and: this.and,
            or: this.or,
            xor: this.xor,
            not: CodeGeneratorJs.not,
            mod: this.mod,
            ">": this.greater,
            "<": this.less,
            ">=": this.greaterEqual,
            "<=": this.lessEqual,
            "=": this.equal,
            "<>": this.notEqual,
            "@": this.addressOf,
            "#": CodeGeneratorJs.stream
        };
        /* eslint-disable no-invalid-this */
        this.mParseFunctions = {
            ";": CodeGeneratorJs.semicolon,
            ",": CodeGeneratorJs.comma,
            "|": this.vertical,
            number: CodeGeneratorJs.number,
            binnumber: CodeGeneratorJs.binnumber,
            hexnumber: CodeGeneratorJs.hexnumber,
            linenumber: CodeGeneratorJs.linenumber,
            identifier: this.identifier,
            letter: CodeGeneratorJs.letter,
            range: this.range,
            linerange: this.linerange,
            string: CodeGeneratorJs.string,
            "null": CodeGeneratorJs.fnNull,
            assign: this.assign,
            label: this.label,
            // special keyword functions
            afterGosub: this.afterGosub,
            call: this.call,
            chain: this.chain,
            chainMerge: this.chainMerge,
            clear: this.clear,
            closeout: this.closeout,
            cont: CodeGeneratorJs.cont,
            data: this.data,
            def: this.def,
            defint: this.defint,
            defreal: this.defreal,
            defstr: this.defstr,
            dim: this.dim,
            "delete": this.delete,
            edit: this.edit,
            "else": this.else,
            end: this.end,
            erase: this.erase,
            error: this.error,
            everyGosub: this.everyGosub,
            fn: this.fn,
            "for": this.for,
            frame: this.frame,
            gosub: this.gosub,
            "goto": this.goto,
            "if": this.if,
            input: this.input,
            let: this.let,
            lineInput: this.lineInput,
            list: this.list,
            load: this.load,
            merge: this.merge,
            mid$Assign: this.mid$Assign,
            "new": CodeGeneratorJs.new,
            next: this.next,
            onBreakGosub: this.onBreakGosub,
            onErrorGoto: this.onErrorGoto,
            onGosub: this.onGosub,
            onGoto: this.onGoto,
            onSqGosub: this.onSqGosub,
            openin: this.openin,
            print: this.print,
            randomize: this.randomize,
            read: this.read,
            rem: this.rem,
            renum: this.renum,
            restore: this.restore,
            resume: this.resume,
            "return": CodeGeneratorJs.return,
            run: this.run,
            save: this.save,
            sound: this.sound,
            spc: this.spc,
            stop: this.stop,
            tab: this.tab,
            wend: this.wend,
            "while": this.while
        };
        this.lexer = options.lexer;
        this.parser = options.parser;
        this.tron = options.tron;
        this.rsx = options.rsx;
        this.bQuiet = options.bQuiet || false;
        this.bNoCodeFrame = options.bNoCodeFrame || false;
        this.reJsKeywords = CodeGeneratorJs.createJsKeywordRegex();
    }
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
    };
    CodeGeneratorJs.prototype.resetCountsPerLine = function () {
        this.iGosubCount = 0;
        this.iIfCount = 0;
        this.iStopCount = 0;
        this.iForCount = 0; // stack needed
        this.iWhileCount = 0; // stack needed
    };
    CodeGeneratorJs.prototype.composeError = function (oError, message, value, pos) {
        return Utils_1.Utils.composeError("CodeGeneratorJs", oError, message, value, pos, this.iLine);
    };
    CodeGeneratorJs.createJsKeywordRegex = function () {
        return new RegExp("^(" + CodeGeneratorJs.aJsKeywords.join("|") + ")$");
    };
    CodeGeneratorJs.prototype.fnDeclareVariable = function (sName) {
        if (!this.oVariables.variableExist(sName)) { // variable not yet defined?
            this.oVariables.initVariable(sName);
        }
    };
    CodeGeneratorJs.prototype.fnAdaptVariableName = function (sName, iArrayIndices) {
        var oDefScopeArgs = this.oDefScopeArgs;
        sName = sName.toLowerCase();
        sName = sName.replace(/\./g, "_");
        if (oDefScopeArgs || !Utils_1.Utils.bSupportReservedNames) { // avoid keywords as def fn parameters; and for IE8 avoid keywords in dot notation
            if (this.reJsKeywords.test(sName)) { // IE8: avoid keywords in dot notation
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
        if (oDefScopeArgs) {
            if (sName === "o") { // we must not use format parameter "o" since this is our vm object
                sName = "oNo"; // change variable name to something we cannot set in BASIC
            }
            if (!oDefScopeArgs.bCollectDone) { // in collection mode?
                oDefScopeArgs[sName] = true; // declare DEF scope variable
            }
            else if (!(sName in oDefScopeArgs)) {
                // variable
                this.fnDeclareVariable(sName);
                sName = "v." + sName; // access with "v."
            }
        }
        else {
            this.fnDeclareVariable(sName);
            sName = "v." + sName; // access with "v."
        }
        return sName;
    };
    CodeGeneratorJs.prototype.fnParseOneArg = function (oArg) {
        return this.parseNode(oArg); // eslint-disable-line no-use-before-define
    };
    CodeGeneratorJs.prototype.fnParseArgRange = function (aArgs, iStart, iStop) {
        var aNodeArgs = []; // do not modify node.args here (could be a parameter of defined function)
        for (var i = iStart; i <= iStop; i += 1) {
            aNodeArgs.push(this.fnParseOneArg(aArgs[i]));
        }
        return aNodeArgs;
    };
    CodeGeneratorJs.prototype.fnParseArgs = function (aArgs) {
        var aNodeArgs = []; // do not modify node.args here (could be a parameter of defined function)
        if (!aArgs) {
            throw this.composeError(Error(), "Programming error: Undefined args", "", -1); // should not occure TTT
        }
        for (var i = 0; i < aArgs.length; i += 1) {
            aNodeArgs[i] = this.fnParseOneArg(aArgs[i]);
        }
        return aNodeArgs;
    };
    CodeGeneratorJs.prototype.fnDetermineStaticVarType = function (sName) {
        return this.oVariables.determineStaticVarType(sName);
    };
    CodeGeneratorJs.fnIsIntConst = function (a) {
        var reIntConst = /^[+-]?([0-9]+|0x[0-9a-f]+|0b[0-1]+)$/; // regex for integer, hex, binary constant
        return reIntConst.test(a);
    };
    CodeGeneratorJs.fnGetRoundString = function (node) {
        if (node.pt !== "I") { // no rounding needed for integer, hex, binary constants, integer variables, functions returning integer (optimization)
            node.pv = "o.vmRound(" + node.pv + ")";
        }
        return node.pv;
    };
    CodeGeneratorJs.fnIsInString = function (sString, sFind) {
        return sFind && sString.indexOf(sFind) >= 0;
    };
    CodeGeneratorJs.prototype.fnPropagateStaticTypes = function (node, oLeft, oRight, sTypes) {
        if (oLeft.pt && oRight.pt) {
            if (CodeGeneratorJs.fnIsInString(sTypes, oLeft.pt + oRight.pt)) {
                node.pt = oLeft.pt === oRight.pt ? oLeft.pt : "R";
            }
            else {
                throw this.composeError(Error(), "Type error", node.value, node.pos);
            }
        }
        else if (oLeft.pt && !CodeGeneratorJs.fnIsInString(sTypes, oLeft.pt) || oRight.pt && !CodeGeneratorJs.fnIsInString(sTypes, oRight.pt)) {
            throw this.composeError(Error(), "Type error", node.value, node.pos);
        }
    };
    // mOperators
    CodeGeneratorJs.prototype.plus = function (node, oLeft, oRight) {
        if (oLeft === undefined) { // unary plus? => skip it
            node.pv = oRight.pv;
            var sType = oRight.pt;
            if (CodeGeneratorJs.fnIsInString("IR$", sType)) { // I, R or $?
                node.pt = sType;
            }
            else if (sType) {
                throw this.composeError(Error(), "Type error", node.value, node.pos);
            }
        }
        else {
            node.pv = oLeft.pv + " + " + oRight.pv;
            this.fnPropagateStaticTypes(node, oLeft, oRight, "II RR IR RI $$");
        }
        return node.pv;
    };
    CodeGeneratorJs.prototype.minus = function (node, oLeft, oRight) {
        if (oLeft === undefined) { // unary minus?
            var sValue = oRight.pv, sType = oRight.pt;
            // when optimizing, beware of "--" operator in JavaScript!
            if (CodeGeneratorJs.fnIsIntConst(sValue) || oRight.type === "number") { // int const or number const (also fp)
                if (sValue.charAt(0) === "-") { // starting already with "-"?
                    node.pv = sValue.substr(1); // remove "-"
                }
                else {
                    node.pv = "-" + sValue;
                }
            }
            else {
                node.pv = "-(" + sValue + ")"; // can be an expression
            }
            if (CodeGeneratorJs.fnIsInString("IR", sType)) { // I or R?
                node.pt = sType;
            }
            else if (sType) {
                throw this.composeError(Error(), "Type error", node.value, node.pos);
            }
        }
        else {
            node.pv = oLeft.pv + " - " + oRight.pv;
            this.fnPropagateStaticTypes(node, oLeft, oRight, "II RR IR RI");
        }
        return node.pv;
    };
    CodeGeneratorJs.prototype.mult = function (node, oLeft, oRight) {
        node.pv = oLeft.pv + " * " + oRight.pv;
        this.fnPropagateStaticTypes(node, oLeft, oRight, "II RR IR RI");
        return node.pv;
    };
    CodeGeneratorJs.prototype.div = function (node, oLeft, oRight) {
        node.pv = oLeft.pv + " / " + oRight.pv;
        this.fnPropagateStaticTypes(node, oLeft, oRight, "II RR IR RI");
        node.pt = "R"; // event II can get a fraction
        return node.pv;
    };
    CodeGeneratorJs.prototype.intDiv = function (node, oLeft, oRight) {
        node.pv = "(" + oLeft.pv + " / " + oRight.pv + ") | 0"; // integer division
        this.fnPropagateStaticTypes(node, oLeft, oRight, "II RR IR RI");
        node.pt = "I";
        return node.pv;
    };
    CodeGeneratorJs.prototype.exponent = function (node, oLeft, oRight) {
        node.pv = "Math.pow(" + oLeft.pv + ", " + oRight.pv + ")";
        this.fnPropagateStaticTypes(node, oLeft, oRight, "II RR IR RI");
        return node.pv;
    };
    CodeGeneratorJs.prototype.and = function (node, oLeft, oRight) {
        node.pv = CodeGeneratorJs.fnGetRoundString(oLeft) + " & " + CodeGeneratorJs.fnGetRoundString(oRight);
        this.fnPropagateStaticTypes(node, oLeft, oRight, "II RR IR RI");
        node.pt = "I";
        return node.pv;
    };
    CodeGeneratorJs.prototype.or = function (node, oLeft, oRight) {
        node.pv = CodeGeneratorJs.fnGetRoundString(oLeft) + " | " + CodeGeneratorJs.fnGetRoundString(oRight);
        this.fnPropagateStaticTypes(node, oLeft, oRight, "II RR IR RI");
        node.pt = "I";
        return node.pv;
    };
    CodeGeneratorJs.prototype.xor = function (node, oLeft, oRight) {
        node.pv = CodeGeneratorJs.fnGetRoundString(oLeft) + " ^ " + CodeGeneratorJs.fnGetRoundString(oRight);
        this.fnPropagateStaticTypes(node, oLeft, oRight, "II RR IR RI");
        node.pt = "I";
        return node.pv;
    };
    CodeGeneratorJs.not = function (node, _oLeft, oRight) {
        node.pv = "~(" + CodeGeneratorJs.fnGetRoundString(oRight) + ")"; // a can be an expression
        node.pt = "I";
        return node.pv;
    };
    CodeGeneratorJs.prototype.mod = function (node, oLeft, oRight) {
        node.pv = CodeGeneratorJs.fnGetRoundString(oLeft) + " % " + CodeGeneratorJs.fnGetRoundString(oRight);
        this.fnPropagateStaticTypes(node, oLeft, oRight, "II RR IR RI");
        node.pt = "I";
        return node.pv;
    };
    CodeGeneratorJs.prototype.greater = function (node, oLeft, oRight) {
        node.pv = oLeft.pv + " > " + oRight.pv + " ? -1 : 0";
        this.fnPropagateStaticTypes(node, oLeft, oRight, "II RR IR RI $$");
        node.pt = "I";
        return node.pv;
    };
    CodeGeneratorJs.prototype.less = function (node, oLeft, oRight) {
        node.pv = oLeft.pv + " < " + oRight.pv + " ? -1 : 0";
        this.fnPropagateStaticTypes(node, oLeft, oRight, "II RR IR RI $$");
        node.pt = "I";
        return node.pv;
    };
    CodeGeneratorJs.prototype.greaterEqual = function (node, oLeft, oRight) {
        node.pv = oLeft.pv + " >= " + oRight.pv + " ? -1 : 0";
        this.fnPropagateStaticTypes(node, oLeft, oRight, "II RR IR RI $$");
        node.pt = "I";
        return node.pv;
    };
    CodeGeneratorJs.prototype.lessEqual = function (node, oLeft, oRight) {
        node.pv = oLeft.pv + " <= " + oRight.pv + " ? -1 : 0";
        this.fnPropagateStaticTypes(node, oLeft, oRight, "II RR IR RI $$");
        node.pt = "I";
        return node.pv;
    };
    CodeGeneratorJs.prototype.equal = function (node, oLeft, oRight) {
        node.pv = oLeft.pv + " === " + oRight.pv + " ? -1 : 0";
        this.fnPropagateStaticTypes(node, oLeft, oRight, "II RR IR RI $$");
        node.pt = "I";
        return node.pv;
    };
    CodeGeneratorJs.prototype.notEqual = function (node, oLeft, oRight) {
        node.pv = oLeft.pv + " !== " + oRight.pv + " ? -1 : 0";
        this.fnPropagateStaticTypes(node, oLeft, oRight, "II RR IR RI $$");
        node.pt = "I";
        return node.pv;
    };
    CodeGeneratorJs.prototype.addressOf = function (node, _oLeft, oRight) {
        node.pv = 'o.addressOf("' + oRight.pv + '")'; // address of
        if (oRight.type !== "identifier") {
            throw this.composeError(Error(), "Expected identifier", node.value, node.pos);
        }
        node.pt = "I";
        return node.pv;
    };
    CodeGeneratorJs.stream = function (node, _oLeft, oRight) {
        // "#" stream as prefix operator
        node.pv = oRight.pv;
        node.pt = "I";
        return node.pv;
    };
    /* eslint-enable no-invalid-this */
    CodeGeneratorJs.prototype.fnParseDefIntRealStr = function (node) {
        var aNodeArgs = this.fnParseArgs(node.args);
        for (var i = 0; i < aNodeArgs.length; i += 1) {
            var sArg = aNodeArgs[i];
            aNodeArgs[i] = "o." + node.type + '("' + sArg + '")';
        }
        node.pv = aNodeArgs.join("; ");
        return node.pv;
    };
    CodeGeneratorJs.prototype.fnParseErase = function (node) {
        this.oDefScopeArgs = {}; // collect DEF scope args
        var aNodeArgs = this.fnParseArgs(node.args);
        this.oDefScopeArgs = undefined;
        for (var i = 0; i < aNodeArgs.length; i += 1) {
            aNodeArgs[i] = '"' + aNodeArgs[i] + '"'; // put in quotes
        }
        node.pv = "o." + node.type + "(" + aNodeArgs.join(", ") + ")";
        return node.pv;
    };
    CodeGeneratorJs.prototype.fnAddReferenceLabel = function (sLabel, node) {
        if (sLabel in this.oLabels) {
            this.oLabels[sLabel] += 1;
        }
        else {
            if (Utils_1.Utils.debug > 1) {
                Utils_1.Utils.console.debug("fnAddReferenceLabel: line does not (yet) exist:", sLabel);
            }
            if (!this.bMergeFound) {
                throw this.composeError(Error(), "Line does not exist", sLabel, node.pos);
            }
        }
    };
    CodeGeneratorJs.prototype.fnCommandWithGoto = function (node, aNodeArgs) {
        aNodeArgs = aNodeArgs || this.fnParseArgs(node.args);
        var sCommand = node.type, sLabel = this.iLine + "s" + this.iStopCount; // we use stopCount
        this.iStopCount += 1;
        node.pv = "o." + sCommand + "(" + aNodeArgs.join(", ") + "); o.goto(\"" + sLabel + "\"); break;\ncase \"" + sLabel + "\":";
        return node.pv;
    };
    CodeGeneratorJs.semicolon = function (node) {
        // ";" input, line input
        node.pv = ";";
        return node.pv;
    };
    CodeGeneratorJs.comma = function (node) {
        // "," input, line input
        node.pv = ",";
        return node.pv;
    };
    CodeGeneratorJs.prototype.vertical = function (node) {
        var sRsxName = node.value.substr(1).toLowerCase().replace(/\./g, "_");
        var bRsxAvailable = this.rsx && this.rsx.rsxIsAvailable(sRsxName), aNodeArgs = this.fnParseArgs(node.args), sLabel = this.iLine + "s" + this.iStopCount; // we use stopCount
        this.iStopCount += 1;
        if (!bRsxAvailable) { // if RSX not available, we delay the error until it is executed (or catched by on error goto)
            if (!this.bQuiet) {
                var oError = this.composeError(Error(), "Unknown RSX command", node.value, node.pos);
                Utils_1.Utils.console.warn(oError);
            }
            aNodeArgs.unshift('"' + sRsxName + '"'); // put as first arg
            sRsxName = "rsxExec"; // and call special handler which triggers error if not available
        }
        node.pv = "o.rsx." + sRsxName + "(" + aNodeArgs.join(", ") + "); o.goto(\"" + sLabel + "\"); break;\ncase \"" + sLabel + "\":"; // most RSX commands need goto (era, ren,...)
        return node.pv;
    };
    CodeGeneratorJs.number = function (node) {
        node.pt = (/^[0-9]+$/).test(node.value) ? "I" : "R";
        node.pv = node.value; // keep string
        return node.pv;
    };
    CodeGeneratorJs.binnumber = function (node) {
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
    };
    CodeGeneratorJs.hexnumber = function (node) {
        var sValue = node.value.slice(1); // remove &
        if (sValue.charAt(0).toLowerCase() === "h") { // optional h
            sValue = sValue.slice(1); // remove
        }
        sValue = "0x" + ((sValue.length) ? sValue : "0"); // &->0x
        node.pt = "I";
        node.pv = sValue;
        return node.pv;
    };
    CodeGeneratorJs.linenumber = function (node) {
        node.pv = node.value;
        return node.pv;
    };
    CodeGeneratorJs.prototype.identifier = function (node) {
        var aNodeArgs = node.args ? this.fnParseArgRange(node.args, 1, node.args.length - 2) : [], // array: we skip open and close bracket
        sName = this.fnAdaptVariableName(node.value, aNodeArgs.length), // here we use node.value
        sValue = sName + aNodeArgs.map(function (val) {
            return "[" + val + "]";
        }).join("");
        var sVarType = this.fnDetermineStaticVarType(sName);
        if (sVarType.length > 1) {
            sVarType = sVarType.charAt(1);
            node.pt = sVarType;
        }
        node.pv = sValue;
        return node.pv;
    };
    CodeGeneratorJs.letter = function (node) {
        node.pv = node.value;
        return node.pv;
    };
    CodeGeneratorJs.prototype.range = function (node) {
        if (!node.left || !node.right) {
            throw this.composeError(Error(), "Programming error: Undefined left or right", node.type, node.pos); // should not occure
        }
        var sLeft = this.fnParseOneArg(node.left), sRight = this.fnParseOneArg(node.right);
        if (sLeft > sRight) {
            throw this.composeError(Error(), "Decreasing range", node.value, node.pos);
        }
        node.pv = sLeft + " - " + sRight;
        return node.pv;
    };
    CodeGeneratorJs.prototype.linerange = function (node) {
        if (!node.left || !node.right) {
            throw this.composeError(Error(), "Programming error: Undefined left or right", node.type, node.pos); // should not occure
        }
        var sLeft = this.fnParseOneArg(node.left), sRight = this.fnParseOneArg(node.right), iLeft = Number(sLeft), // "undefined" gets NaN (should we check node.left.type for null?)
        iRight = Number(sRight);
        if (iLeft > iRight) { // comparison with NaN and number is always false
            throw this.composeError(Error(), "Decreasing line range", node.value, node.pos);
        }
        var sRightSpecified = (sRight === "undefined") ? "65535" : sRight; // make sure we set a missing right range parameter
        node.pv = !sRight ? sLeft : sLeft + ", " + sRightSpecified;
        return node.pv;
    };
    CodeGeneratorJs.string = function (node) {
        node.pt = "$";
        node.pv = '"' + node.value + '"';
        return node.pv;
    };
    CodeGeneratorJs.fnNull = function (node) {
        node.pv = node.value !== "null" ? node.value : "undefined"; // use explicit value or convert "null" to "undefined"
        return node.pv;
    };
    CodeGeneratorJs.prototype.assign = function (node) {
        // see also "let"
        if (!node.left || !node.right) {
            throw this.composeError(Error(), "Programming error: Undefined left or right", node.type, node.pos); // should not occure
        }
        var sName;
        if (node.left.type === "identifier") {
            sName = this.fnParseOneArg(node.left);
        }
        else {
            throw this.composeError(Error(), "Unexpected assing type", node.type, node.pos); // should not occur
        }
        var value = this.fnParseOneArg(node.right);
        this.fnPropagateStaticTypes(node, node.left, node.right, "II RR IR RI $$");
        var sVarType = this.fnDetermineStaticVarType(sName);
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
    };
    CodeGeneratorJs.prototype.label = function (node) {
        var label = node.value;
        this.iLine = Number(label); // set line before parsing args
        this.resetCountsPerLine(); // we want to have "stable" counts, even if other lines change, e.g. direct
        var value = "", bDirect = false;
        if (isNaN(Number(label))) {
            if (label === "direct") { // special handling
                bDirect = true;
                value = "o.goto(\"directEnd\"); break;\n";
            }
            label = '"' + label + '"'; // for "direct"
        }
        if (!this.bNoCodeFrame) {
            value += "case " + label + ":";
        }
        else {
            value = "";
        }
        var aNodeArgs = this.fnParseArgs(node.args);
        if (this.tron) {
            value += " o.vmTrace(\"" + this.iLine + "\");";
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
        if (bDirect && !this.bNoCodeFrame) {
            value += "\n o.goto(\"end\"); break;\ncase \"directEnd\":"; // put in next line because of possible "rem"
        }
        node.pv = value;
        return node.pv;
    };
    // special keyword functions
    CodeGeneratorJs.prototype.afterGosub = function (node) {
        var aNodeArgs = this.fnParseArgs(node.args);
        if (!node.args) {
            throw this.composeError(Error(), "Programming error: Undefined args", node.type, node.pos); // should not occure
        }
        this.fnAddReferenceLabel(aNodeArgs[2], node.args[2]); // argument 2 = line number
        node.pv = "o." + node.type + "(" + aNodeArgs.join(", ") + ")";
        return node.pv;
    };
    CodeGeneratorJs.prototype.call = function (node) {
        node.pv = this.fnCommandWithGoto(node);
        return node.pv;
    };
    CodeGeneratorJs.prototype.chain = function (node) {
        node.pv = this.fnCommandWithGoto(node);
        return node.pv;
    };
    CodeGeneratorJs.prototype.chainMerge = function (node) {
        this.bMergeFound = true;
        node.pv = this.fnCommandWithGoto(node);
        return node.pv;
    };
    CodeGeneratorJs.prototype.clear = function (node) {
        node.pv = this.fnCommandWithGoto(node);
        return node.pv;
    };
    CodeGeneratorJs.prototype.closeout = function (node) {
        node.pv = this.fnCommandWithGoto(node);
        return node.pv;
    };
    CodeGeneratorJs.cont = function (node) {
        node.pv = "o." + node.type + "(); break;"; // append break
        return node.pv;
    };
    CodeGeneratorJs.prototype.data = function (node) {
        var aNodeArgs = this.fnParseArgs(node.args);
        aNodeArgs.unshift(String(this.iLine)); // prepend line number
        this.aData.push("o.data(" + aNodeArgs.join(", ") + ")"); // will be set at the beginning of the script
        node.pv = "/* data */";
        return node.pv;
    };
    CodeGeneratorJs.prototype.def = function (node) {
        if (!node.left || !node.right) {
            throw this.composeError(Error(), "Programming error: Undefined left or right", node.type, node.pos); // should not occure
        }
        var sName = this.fnParseOneArg(node.left);
        this.oDefScopeArgs = {}; // collect DEF scope args
        var aNodeArgs = this.fnParseArgs(node.args);
        this.oDefScopeArgs.bCollectDone = true; // collection done => now use them
        var sExpression = this.fnParseOneArg(node.right);
        this.oDefScopeArgs = undefined;
        this.fnPropagateStaticTypes(node, node.left, node.right, "II RR IR RI $$");
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
            var sVarType = this.fnDetermineStaticVarType(sName);
            sValue = "o.vmAssign(\"" + sVarType + "\", " + sExpression + ")";
        }
        sValue = sName + " = function (" + aNodeArgs.join(", ") + ") { return " + sValue + "; };";
        node.pv = sValue;
        return node.pv;
    };
    CodeGeneratorJs.prototype.defint = function (node) {
        node.pv = this.fnParseDefIntRealStr(node);
        return node.pv;
    };
    CodeGeneratorJs.prototype.defreal = function (node) {
        node.pv = this.fnParseDefIntRealStr(node);
        return node.pv;
    };
    CodeGeneratorJs.prototype.defstr = function (node) {
        node.pv = this.fnParseDefIntRealStr(node);
        return node.pv;
    };
    CodeGeneratorJs.prototype.dim = function (node) {
        var aArgs = [];
        if (!node.args) {
            throw this.composeError(Error(), "Programming error: Undefined args", node.type, node.pos); // should not occure
        }
        for (var i = 0; i < node.args.length; i += 1) {
            var oNodeArg = node.args[i];
            if (oNodeArg.type !== "identifier") {
                throw this.composeError(Error(), "Expected identifier in DIM", node.type, node.pos);
            }
            if (!oNodeArg.args) {
                throw this.composeError(Error(), "Programming error: Undefined args", oNodeArg.type, oNodeArg.pos); // should not occure
            }
            var aNodeArgs = this.fnParseArgRange(oNodeArg.args, 1, oNodeArg.args.length - 2), // we skip open and close bracket
            sFullExpression = this.fnParseOneArg(oNodeArg);
            var sName = sFullExpression;
            sName = sName.substr(2); // remove preceding "v."
            var iIndex = sName.indexOf("["); // we should always have it
            sName = sName.substr(0, iIndex);
            aArgs.push("/* " + sFullExpression + " = */ o.dim(\"" + sName + "\", " + aNodeArgs.join(", ") + ")");
        }
        node.pv = aArgs.join("; ");
        return node.pv;
    };
    CodeGeneratorJs.prototype["delete"] = function (node) {
        var aNodeArgs = this.fnParseArgs(node.args), sName = Utils_1.Utils.bSupportReservedNames ? "o.delete" : 'o["delete"]';
        if (!aNodeArgs.length) { // no arguments? => complete range
            aNodeArgs.push("1");
            aNodeArgs.push("65535");
        }
        node.pv = sName + "(" + aNodeArgs.join(", ") + "); break;";
        return node.pv;
    };
    CodeGeneratorJs.prototype.edit = function (node) {
        var aNodeArgs = this.fnParseArgs(node.args);
        node.pv = "o.edit(" + aNodeArgs.join(", ") + "); break;";
        return node.pv;
    };
    CodeGeneratorJs.prototype["else"] = function (node) {
        if (!node.args) {
            throw this.composeError(Error(), "Programming error: Undefined args", "", -1); // should not occure
        }
        var sValue = node.type;
        for (var i = 0; i < node.args.length; i += 1) {
            var oToken = node.args[i];
            if (oToken.value) {
                sValue += " " + oToken.value;
            }
        }
        node.pv = "// " + sValue + "\n";
        return node.pv;
    };
    CodeGeneratorJs.prototype.end = function (node) {
        var sName = this.iLine + "s" + this.iStopCount; // same as stop, use also stopCount
        this.iStopCount += 1;
        node.pv = "o.end(\"" + sName + "\"); break;\ncase \"" + sName + "\":";
        return node.pv;
    };
    CodeGeneratorJs.prototype.erase = function (node) {
        var value = this.fnParseErase(node);
        node.pv = value;
        return node.pv;
    };
    CodeGeneratorJs.prototype.error = function (node) {
        var aNodeArgs = this.fnParseArgs(node.args);
        node.pv = "o.error(" + aNodeArgs[0] + "); break";
        return node.pv;
    };
    CodeGeneratorJs.prototype.everyGosub = function (node) {
        var aNodeArgs = this.fnParseArgs(node.args);
        if (!node.args) {
            throw this.composeError(Error(), "Programming error: Undefined args", node.type, node.pos); // should not occure
        }
        this.fnAddReferenceLabel(aNodeArgs[2], node.args[2]); // argument 2 = line number
        node.pv = "o." + node.type + "(" + aNodeArgs.join(", ") + ")";
        return node.pv;
    };
    CodeGeneratorJs.prototype.fn = function (node) {
        if (!node.left) {
            throw this.composeError(Error(), "Programming error: Undefined left", node.type, node.pos); // should not occure
        }
        var aNodeArgs = this.fnParseArgs(node.args), sName = this.fnParseOneArg(node.left);
        if (node.left.pt) {
            node.pt = node.left.pt;
        }
        node.pv = sName + "(" + aNodeArgs.join(", ") + ")";
        return node.pv;
    };
    CodeGeneratorJs.prototype["for"] = function (node) {
        var aNodeArgs = this.fnParseArgs(node.args), sVarName = aNodeArgs[0], sLabel = this.iLine + "f" + this.iForCount;
        this.oStack.forLabel.push(sLabel);
        this.oStack.forVarName.push(sVarName);
        this.iForCount += 1;
        if (!node.args) {
            throw this.composeError(Error(), "Programming error: Undefined args", node.type, node.pos); // should not occure
        }
        var startNode = node.args[1], endNode = node.args[2], stepNode = node.args[3];
        var startValue = aNodeArgs[1], endValue = aNodeArgs[2], stepValue = aNodeArgs[3];
        if (stepNode.type === "null") { // value not available?
            stepValue = "1";
        }
        // optimization for integer constants (check value and not type, because we also want to accept e.g. -<number>):
        var bStartIsIntConst = CodeGeneratorJs.fnIsIntConst(startValue), bEndIsIntConst = CodeGeneratorJs.fnIsIntConst(endValue), bStepIsIntConst = CodeGeneratorJs.fnIsIntConst(stepValue), sVarType = this.fnDetermineStaticVarType(sVarName), sType = (sVarType.length > 1) ? sVarType.charAt(1) : "";
        if (sType === "$") {
            throw this.composeError(Error(), "String type in FOR at", node.type, node.pos);
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
            this.fnDeclareVariable(value2); // declare also end variable
        }
        var sStepName;
        if (!bStepIsIntConst) {
            if (stepNode.pt !== "I") {
                stepValue = "o.vmAssign(\"" + sVarType + "\", " + stepValue + ")";
            }
            sStepName = sVarName + "Step";
            var value2 = sStepName.substr(2); // remove preceding "v."
            this.fnDeclareVariable(value2); // declare also step variable
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
    };
    CodeGeneratorJs.prototype.frame = function (node) {
        node.pv = this.fnCommandWithGoto(node);
        return node.pv;
    };
    CodeGeneratorJs.prototype.gosub = function (node) {
        var aNodeArgs = this.fnParseArgs(node.args), sLine = aNodeArgs[0], sName = this.iLine + "g" + this.iGosubCount;
        this.iGosubCount += 1;
        if (!node.args) {
            throw this.composeError(Error(), "Programming error: Undefined args", node.type, node.pos); // should not occure
        }
        this.fnAddReferenceLabel(sLine, node.args[0]);
        node.pv = 'o.gosub("' + sName + '", ' + sLine + '); break; \ncase "' + sName + '":';
        return node.pv;
    };
    CodeGeneratorJs.prototype["goto"] = function (node) {
        var aNodeArgs = this.fnParseArgs(node.args), sLine = aNodeArgs[0];
        if (!node.args) {
            throw this.composeError(Error(), "Programming error: Undefined args", node.type, node.pos); // should not occure
        }
        this.fnAddReferenceLabel(sLine, node.args[0]);
        node.pv = "o.goto(" + sLine + "); break";
        return node.pv;
    };
    CodeGeneratorJs.prototype["if"] = function (node) {
        var sLabel = this.iLine + "i" + this.iIfCount;
        this.iIfCount += 1;
        if (!node.left) {
            throw this.composeError(Error(), "Programming error: Undefined left", node.type, node.pos); // should not occure
        }
        var value = "if (" + this.fnParseOneArg(node.left) + ') { o.goto("' + sLabel + '"); break; } ';
        if (node.args2) { // "else" statements?
            var aNodeArgs2 = this.fnParseArgs(node.args2), sPart2 = aNodeArgs2.join("; ");
            value += "/* else */ " + sPart2 + "; ";
        }
        value += 'o.goto("' + sLabel + 'e"); break;';
        var aNodeArgs = this.fnParseArgs(node.args), // "then" statements
        sPart = aNodeArgs.join("; ");
        value += '\ncase "' + sLabel + '": ' + sPart + ";";
        value += '\ncase "' + sLabel + 'e": ';
        node.pv = value;
        return node.pv;
    };
    CodeGeneratorJs.prototype.input = function (node) {
        var aNodeArgs = this.fnParseArgs(node.args), aVarTypes = [];
        var sLabel = this.iLine + "s" + this.iStopCount;
        this.iStopCount += 1;
        if (aNodeArgs.length < 4) {
            throw this.composeError(Error(), "Programming error: Not enough parameters", node.type, node.pos); // should not occure
        }
        var sStream = aNodeArgs[0];
        var sNoCRLF = aNodeArgs[1];
        if (sNoCRLF === ";") { // ; or null
            sNoCRLF = '"' + sNoCRLF + '"';
        }
        var sMsg = aNodeArgs[2];
        if (!node.args) {
            throw this.composeError(Error(), "Programming error: Undefined args", node.type, node.pos); // should not occure
        }
        if (node.args[2].type === "null") { // message type
            sMsg = '""';
        }
        var sPrompt = aNodeArgs[3];
        if (sPrompt === ";" || node.args[3].type === "null") { // ";" => insert prompt "? " in quoted string
            sMsg = sMsg.substr(0, sMsg.length - 1) + "? " + sMsg.substr(-1, 1);
        }
        for (var i = 4; i < aNodeArgs.length; i += 1) {
            aVarTypes[i - 4] = this.fnDetermineStaticVarType(aNodeArgs[i]);
        }
        var value = "o.goto(\"" + sLabel + "\"); break;\ncase \"" + sLabel + "\":"; // also before input
        sLabel = this.iLine + "s" + this.iStopCount;
        this.iStopCount += 1;
        value += "o." + node.type + "(" + sStream + ", " + sNoCRLF + ", " + sMsg + ", \"" + aVarTypes.join('", "') + "\"); o.goto(\"" + sLabel + "\"); break;\ncase \"" + sLabel + "\":";
        for (var i = 4; i < aNodeArgs.length; i += 1) {
            value += "; " + aNodeArgs[i] + " = o.vmGetNextInput()";
        }
        node.pv = value;
        return node.pv;
    };
    CodeGeneratorJs.prototype.let = function (node) {
        if (!node.right) {
            throw this.composeError(Error(), "Programming error: Undefined right", node.type, node.pos); // should not occure
        }
        node.pv = this.assign(node.right);
        return node.pv;
    };
    CodeGeneratorJs.prototype.lineInput = function (node) {
        return this.input(node); // similar to input but with one arg of type string only
    };
    CodeGeneratorJs.prototype.list = function (node) {
        var aNodeArgs = this.fnParseArgs(node.args); // or: fnCommandWithGoto
        if (!node.args) {
            throw this.composeError(Error(), "Programming error: Undefined args", node.type, node.pos); // should not occure
        }
        if (!node.args.length || node.args[node.args.length - 1].type === "#") { // last parameter stream? or no parameters?
            var sStream = aNodeArgs.pop() || "0";
            aNodeArgs.unshift(sStream); // put it first
        }
        node.pv = "o.list(" + aNodeArgs.join(", ") + "); break;";
        return node.pv;
    };
    CodeGeneratorJs.prototype.load = function (node) {
        node.pv = this.fnCommandWithGoto(node);
        return node.pv;
    };
    CodeGeneratorJs.prototype.merge = function (node) {
        this.bMergeFound = true;
        node.pv = this.fnCommandWithGoto(node);
        return node.pv;
    };
    CodeGeneratorJs.prototype.mid$Assign = function (node) {
        var aNodeArgs = this.fnParseArgs(node.args);
        if (aNodeArgs.length < 3) {
            aNodeArgs.push("undefined"); // empty length
        }
        if (!node.right) {
            throw this.composeError(Error(), "Programming error: Undefined right", "", -1); // should not occure TTT
        }
        var sRight = this.fnParseOneArg(node.right);
        aNodeArgs.push(sRight);
        var sName = aNodeArgs[0], sVarType = this.fnDetermineStaticVarType(sName), sValue = sName + " = o.vmAssign(\"" + sVarType + "\", o.mid$Assign(" + aNodeArgs.join(", ") + "))";
        node.pv = sValue;
        return node.pv;
    };
    CodeGeneratorJs["new"] = function (node) {
        var sName = Utils_1.Utils.bSupportReservedNames ? "o.new" : 'o["new"]';
        node.pv = sName + "();";
        return node.pv;
    };
    CodeGeneratorJs.prototype.next = function (node) {
        var aNodeArgs = this.fnParseArgs(node.args);
        if (!aNodeArgs.length) {
            aNodeArgs.push(""); // we have no variable, so use empty argument
        }
        for (var i = 0; i < aNodeArgs.length; i += 1) {
            var sLabel = this.oStack.forLabel.pop(), sVarName = this.oStack.forVarName.pop();
            var oErrorNode = void 0;
            if (sLabel === undefined) {
                if (aNodeArgs[i] === "") { // inserted node?
                    oErrorNode = node;
                }
                else { // identifier arg
                    oErrorNode = node.args[i];
                }
                throw this.composeError(Error(), "Unexpected NEXT", oErrorNode.type, oErrorNode.pos);
            }
            if (aNodeArgs[i] !== "" && aNodeArgs[i] !== sVarName) {
                oErrorNode = node.args[i];
                throw this.composeError(Error(), "Unexpected NEXT variable", oErrorNode.value, oErrorNode.pos);
            }
            aNodeArgs[i] = "/* next(\"" + aNodeArgs[i] + "\") */ o.goto(\"" + sLabel + "\"); break;\ncase \"" + sLabel + "e\":";
        }
        node.pv = aNodeArgs.join("; ");
        return node.pv;
    };
    CodeGeneratorJs.prototype.onBreakGosub = function (node) {
        var aNodeArgs = this.fnParseArgs(node.args), sLine = aNodeArgs[0];
        this.fnAddReferenceLabel(sLine, node.args[0]);
        node.pv = "o." + node.type + "(" + sLine + ")";
        return node.pv;
    };
    CodeGeneratorJs.prototype.onErrorGoto = function (node) {
        var aNodeArgs = this.fnParseArgs(node.args), sLine = aNodeArgs[0];
        if (Number(sLine)) { // only for lines > 0
            this.fnAddReferenceLabel(sLine, node.args[0]);
        }
        node.pv = "o." + node.type + "(" + sLine + ")";
        return node.pv;
    };
    CodeGeneratorJs.prototype.onGosub = function (node) {
        var aNodeArgs = this.fnParseArgs(node.args), sName = node.type, sLabel = this.iLine + "g" + this.iGosubCount;
        this.iGosubCount += 1;
        for (var i = 1; i < aNodeArgs.length; i += 1) { // start with argument 1
            this.fnAddReferenceLabel(aNodeArgs[i], node.args[i]);
        }
        aNodeArgs.unshift('"' + sLabel + '"');
        node.pv = "o." + sName + "(" + aNodeArgs.join(", ") + '); break; \ncase "' + sLabel + '":';
        return node.pv;
    };
    CodeGeneratorJs.prototype.onGoto = function (node) {
        var aNodeArgs = this.fnParseArgs(node.args), sName = node.type, sLabel = this.iLine + "s" + this.iStopCount;
        this.iStopCount += 1;
        for (var i = 1; i < aNodeArgs.length; i += 1) { // start with argument 1
            this.fnAddReferenceLabel(aNodeArgs[i], node.args[i]);
        }
        aNodeArgs.unshift('"' + sLabel + '"');
        node.pv = "o." + sName + "(" + aNodeArgs.join(", ") + "); break\ncase \"" + sLabel + "\":";
        return node.pv;
    };
    CodeGeneratorJs.prototype.onSqGosub = function (node) {
        var aNodeArgs = this.fnParseArgs(node.args);
        this.fnAddReferenceLabel(aNodeArgs[1], node.args[1]); // argument 1: line number
        node.pv = "o." + node.type + "(" + aNodeArgs.join(", ") + ")";
        return node.pv;
    };
    CodeGeneratorJs.prototype.openin = function (node) {
        return this.fnCommandWithGoto(node);
    };
    CodeGeneratorJs.prototype.print = function (node) {
        var aArgs = node.args, aNodeArgs = [];
        var bNewLine = true;
        for (var i = 0; i < aArgs.length; i += 1) {
            var oArg = aArgs[i];
            var sArg = this.fnParseOneArg(oArg);
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
    };
    CodeGeneratorJs.prototype.randomize = function (node) {
        var value;
        if (node.args.length) {
            var aNodeArgs = this.fnParseArgs(node.args);
            value = "o." + node.type + "(" + aNodeArgs.join(", ") + ")";
        }
        else {
            var sLabel = this.iLine + "s" + this.iStopCount;
            this.iStopCount += 1;
            value = "o.goto(\"" + sLabel + "\"); break;\ncase \"" + sLabel + "\":"; // also before input
            value += this.fnCommandWithGoto(node) + " o.randomize(o.vmGetNextInput())";
        }
        node.pv = value;
        return node.pv;
    };
    CodeGeneratorJs.prototype.read = function (node) {
        var aNodeArgs = this.fnParseArgs(node.args);
        for (var i = 0; i < aNodeArgs.length; i += 1) {
            var sName = aNodeArgs[i], sVarType = this.fnDetermineStaticVarType(sName);
            aNodeArgs[i] = sName + " = o.read(\"" + sVarType + "\")";
        }
        node.pv = aNodeArgs.join("; ");
        return node.pv;
    };
    CodeGeneratorJs.prototype.rem = function (node) {
        var aNodeArgs = this.fnParseArgs(node.args);
        var sValue = aNodeArgs[0];
        if (sValue !== undefined) {
            sValue = " " + sValue.substr(1, sValue.length - 2); // remove surrounding quotes
        }
        else {
            sValue = "";
        }
        node.pv = "//" + sValue + "\n";
        return node.pv;
    };
    CodeGeneratorJs.prototype.renum = function (node) {
        node.pv = this.fnCommandWithGoto(node);
        return node.pv;
    };
    CodeGeneratorJs.prototype.restore = function (node) {
        var aNodeArgs = this.fnParseArgs(node.args);
        if (aNodeArgs.length) {
            this.fnAddReferenceLabel(aNodeArgs[0], node.args[0]); // optional line number
        }
        node.pv = "o." + node.type + "(" + aNodeArgs.join(", ") + ")";
        return node.pv;
    };
    CodeGeneratorJs.prototype.resume = function (node) {
        var aNodeArgs = this.fnParseArgs(node.args);
        if (aNodeArgs.length) {
            this.fnAddReferenceLabel(aNodeArgs[0], node.args[0]); // optional line number
        }
        node.pv = "o." + node.type + "(" + aNodeArgs.join(", ") + "); break"; // append break
        return node.pv;
    };
    CodeGeneratorJs["return"] = function (node) {
        var sName = Utils_1.Utils.bSupportReservedNames ? "o.return" : 'o["return"]';
        node.pv = sName + "(); break;";
        return node.pv;
    };
    CodeGeneratorJs.prototype.run = function (node) {
        if (node.args.length) {
            if (node.args[0].type === "linenumber" || node.args[0].type === "number") { // optional line number, should be linenumber only
                this.fnAddReferenceLabel(this.fnParseOneArg(node.args[0]), node.args[0]); // parse only one arg, args are parsed later
            }
        }
        node.pv = this.fnCommandWithGoto(node);
        return node.pv;
    };
    CodeGeneratorJs.prototype.save = function (node) {
        var aNodeArgs = [];
        if (node.args.length) {
            var sFileName = this.fnParseOneArg(node.args[0]);
            aNodeArgs.push(sFileName);
            if (node.args.length > 1) {
                this.oDefScopeArgs = {}; // collect DEF scope args
                var sType = '"' + this.fnParseOneArg(node.args[1]) + '"';
                this.oDefScopeArgs = undefined;
                aNodeArgs.push(sType);
                var aNodeArgs2 = node.args.slice(2), // get remaining args
                aNodeArgs3 = this.fnParseArgs(aNodeArgs2);
                aNodeArgs = aNodeArgs.concat(aNodeArgs3);
            }
        }
        node.pv = this.fnCommandWithGoto(node, aNodeArgs);
        return node.pv;
    };
    CodeGeneratorJs.prototype.sound = function (node) {
        node.pv = this.fnCommandWithGoto(node); // maybe queue is full, so insert break
        return node.pv;
    };
    CodeGeneratorJs.prototype.spc = function (node) {
        var aNodeArgs = this.fnParseArgs(node.args);
        node.pv = "{type: \"spc\", args: [" + aNodeArgs.join(", ") + "]}"; // we must delay the spc() call until print() is called because we need stream
        return node.pv;
    };
    CodeGeneratorJs.prototype.stop = function (node) {
        var sName = this.iLine + "s" + this.iStopCount;
        this.iStopCount += 1;
        node.pv = "o.stop(\"" + sName + "\"); break;\ncase \"" + sName + "\":";
        return node.pv;
    };
    CodeGeneratorJs.prototype.tab = function (node) {
        var aNodeArgs = this.fnParseArgs(node.args);
        node.pv = "{type: \"tab\", args: [" + aNodeArgs.join(", ") + "]}"; // we must delay the tab() call until print() is called
        return node.pv;
    };
    CodeGeneratorJs.prototype.wend = function (node) {
        var sLabel = this.oStack.whileLabel.pop();
        if (sLabel === undefined) {
            throw this.composeError(Error(), "Unexpected WEND", node.type, node.pos);
        }
        node.pv = "/* o.wend() */ o.goto(\"" + sLabel + "\"); break;\ncase \"" + sLabel + "e\":";
        return node.pv;
    };
    CodeGeneratorJs.prototype["while"] = function (node) {
        var aNodeArgs = this.fnParseArgs(node.args), sLabel = this.iLine + "w" + this.iWhileCount;
        this.oStack.whileLabel.push(sLabel);
        this.iWhileCount += 1;
        node.pv = "\ncase \"" + sLabel + "\": if (!(" + aNodeArgs + ")) { o.goto(\"" + sLabel + "e\"); break; }";
        return node.pv;
    };
    /* eslint-enable no-invalid-this */
    CodeGeneratorJs.prototype.fnParseOther = function (node) {
        var aNodeArgs = this.fnParseArgs(node.args), sTypeWithSpaces = " " + node.type + " ";
        node.pv = "o." + node.type + "(" + aNodeArgs.join(", ") + ")";
        if (CodeGeneratorJs.fnIsInString(" asc cint derr eof erl err fix fre inkey inp instr int joy len memory peek pos remain sgn sq test testr unt vpos xpos ypos ", sTypeWithSpaces)) {
            node.pt = "I";
        }
        else if (CodeGeneratorJs.fnIsInString(" abs atn cos creal exp log log10 max min pi rnd round sin sqr tan time val ", sTypeWithSpaces)) {
            node.pt = "R";
        }
        else if (CodeGeneratorJs.fnIsInString(" bin$ chr$ copychr$ dec$ hex$ inkey$ left$ lower$ mid$ right$ space$ str$ string$ upper$ ", sTypeWithSpaces)) {
            node.pt = "$";
        }
        return node.pv;
    };
    CodeGeneratorJs.prototype.parseNode = function (node) {
        if (Utils_1.Utils.debug > 3) {
            Utils_1.Utils.console.debug("evaluate: parseNode node=%o type=" + node.type + " value=" + node.value + " left=%o right=%o args=%o", node, node.left, node.right, node.args);
        }
        var mOperators = this.mOperators;
        var value;
        if (mOperators[node.type]) {
            if (node.left) {
                value = this.parseNode(node.left);
                if (mOperators[node.left.type] && node.left.left) { // binary operator?
                    value = "(" + value + ")";
                    node.left.pv = value;
                }
                if (!node.right) {
                    throw this.composeError(Error(), "Programming error: Undefined right", "", -1); // should not occure TTT
                }
                var value2 = this.parseNode(node.right);
                if (mOperators[node.right.type] && node.right.left) { // binary operator?
                    value2 = "(" + value2 + ")";
                    node.right.pv = value2;
                }
                value = mOperators[node.type].call(this, node, node.left, node.right);
            }
            else {
                if (!node.right) {
                    throw this.composeError(Error(), "Programming error: Undefined right", "", -1); // should not occure TTT
                }
                value = this.parseNode(node.right);
                value = mOperators[node.type].call(this, node, node.left, node.right); // unary operator: we just use node.right
            }
        }
        else if (this.mParseFunctions[node.type]) { // function with special handling?
            value = this.mParseFunctions[node.type].call(this, node);
        }
        else { // for other functions, generate code directly
            value = this.fnParseOther(node);
        }
        return value;
    };
    CodeGeneratorJs.fnCommentUnusedCases = function (sOutput2, oLabels) {
        sOutput2 = sOutput2.replace(/^case (\d+):/gm, function (sAll, sLine) {
            return (oLabels[sLine]) ? sAll : "/* " + sAll + " */";
        });
        return sOutput2;
    };
    CodeGeneratorJs.prototype.fnCreateLabelsMap = function (parseTree, oLabels) {
        var iLastLine = -1;
        for (var i = 0; i < parseTree.length; i += 1) {
            var oNode = parseTree[i];
            if (oNode.type === "label") {
                var sLine = oNode.value;
                if (sLine in oLabels) {
                    throw this.composeError(Error(), "Duplicate line number", sLine, oNode.pos);
                }
                var iLine = Number(sLine);
                if (!isNaN(iLine)) { // not for "direct"
                    if (iLine <= iLastLine) {
                        throw this.composeError(Error(), "Line number not increasing", sLine, oNode.pos);
                    }
                    if (iLine < 1 || iLine > 65535) {
                        throw this.composeError(Error(), "Line number overflow", sLine, oNode.pos);
                    }
                    iLastLine = iLine;
                }
                oLabels[sLine] = 0; // init call count
            }
        }
    };
    //
    // evaluate
    //
    CodeGeneratorJs.prototype.evaluate = function (parseTree, oVariables) {
        this.oVariables = oVariables;
        this.oDefScopeArgs = undefined;
        // create labels map
        this.fnCreateLabelsMap(parseTree, this.oLabels);
        var sOutput = "";
        for (var i = 0; i < parseTree.length; i += 1) {
            if (Utils_1.Utils.debug > 2) {
                Utils_1.Utils.console.debug("evaluate: parseTree i=%d, node=%o", i, parseTree[i]);
            }
            //const sNode = this.parseNode(parseTree[i] as CodeNode);
            var sNode = this.fnParseOneArg(parseTree[i]);
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
        if (!this.bMergeFound) {
            sOutput = CodeGeneratorJs.fnCommentUnusedCases(sOutput, this.oLabels);
        }
        return sOutput;
    };
    CodeGeneratorJs.combineData = function (aData) {
        var sData = "";
        sData = aData.join(";\n");
        if (sData.length) {
            sData += ";\n";
        }
        return sData;
    };
    CodeGeneratorJs.prototype.debugGetLabelsCount = function () {
        return Object.keys(this.oLabels).length;
    };
    CodeGeneratorJs.prototype.generate = function (sInput, oVariables, bAllowDirect) {
        var oOut = {
            text: ""
        };
        this.reset();
        try {
            var aTokens = this.lexer.lex(sInput), aParseTree = this.parser.parse(aTokens, bAllowDirect);
            var sOutput = this.evaluate(aParseTree, oVariables);
            if (!this.bNoCodeFrame) {
                sOutput = '"use strict"\n'
                    + "var v=o.vmGetAllVariables();\n"
                    + "while (o.vmLoopCondition()) {\nswitch (o.iLine) {\ncase 0:\n"
                    + CodeGeneratorJs.combineData(this.aData)
                    + " o.goto(o.iStartLine ? o.iStartLine : \"start\"); break;\ncase \"start\":\n"
                    + sOutput
                    + "\ncase \"end\": o.vmStop(\"end\", 90); break;\ndefault: o.error(8); o.goto(\"end\"); break;\n}}\n";
            }
            else {
                sOutput = CodeGeneratorJs.combineData(this.aData) + sOutput;
            }
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