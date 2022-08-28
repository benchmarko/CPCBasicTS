// CodeGeneratorJs.ts - Code Generator for JavaScript
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//
//
define(["require", "exports", "./Utils"], function (require, exports, Utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CodeGeneratorJs = void 0;
    var CodeGeneratorJs = /** @class */ (function () {
        function CodeGeneratorJs(options) {
            this.line = "0"; // current line (label)
            this.traceActive = false;
            this.stack = {
                forLabel: [],
                forVarName: [],
                whileLabel: []
            };
            this.gosubCount = 0;
            this.ifCount = 0;
            this.stopCount = 0;
            this.forCount = 0; // stack needed
            this.whileCount = 0; // stack needed
            this.referencedLabelsCount = {};
            this.dataList = []; // collected data from data lines
            this.labelList = []; // all labels
            this.sourceMap = {};
            this.countMap = {};
            // for evaluate:
            this.variables = {}; // will be set later
            /* eslint-disable no-invalid-this */
            this.allOperators = {
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
            this.unaryOperators = {
                "+": this.plus,
                "-": this.minus,
                not: CodeGeneratorJs.not,
                "@": this.addressOf,
                "#": CodeGeneratorJs.stream
            };
            /* eslint-disable no-invalid-this */
            this.parseFunctions = {
                ";": CodeGeneratorJs.commaOrSemicolon,
                ",": CodeGeneratorJs.commaOrSemicolon,
                "|": this.vertical,
                number: CodeGeneratorJs.number,
                binnumber: CodeGeneratorJs.binnumber,
                hexnumber: CodeGeneratorJs.hexnumber,
                linenumber: CodeGeneratorJs.letterOrLinenumber,
                identifier: this.identifier,
                letter: CodeGeneratorJs.letterOrLinenumber,
                range: this.range,
                linerange: this.linerange,
                string: CodeGeneratorJs.string,
                unquoted: CodeGeneratorJs.unquoted,
                "null": CodeGeneratorJs.fnNull,
                assign: this.assign,
                label: this.label,
                // special keyword functions
                afterGosub: this.afterEveryGosub,
                call: this.fnCommandWithGoto,
                chain: this.fnCommandWithGoto,
                chainMerge: this.fnCommandWithGoto,
                clear: this.fnCommandWithGoto,
                closeout: this.fnCommandWithGoto,
                cont: CodeGeneratorJs.cont,
                data: this.data,
                def: this.def,
                defint: this.fnParseDefIntRealStr,
                defreal: this.fnParseDefIntRealStr,
                defstr: this.fnParseDefIntRealStr,
                dim: this.dim,
                "delete": this.delete,
                edit: this.edit,
                "else": this.else,
                end: this.stopOrEnd,
                erase: this.erase,
                error: this.error,
                everyGosub: this.afterEveryGosub,
                fn: this.fn,
                "for": this.for,
                frame: this.fnCommandWithGoto,
                gosub: this.gosub,
                "goto": this.gotoOrResume,
                "if": this.if,
                input: this.inputOrlineInput,
                let: this.let,
                lineInput: this.inputOrlineInput,
                list: this.list,
                load: this.fnCommandWithGoto,
                merge: this.fnCommandWithGoto,
                mid$Assign: this.mid$Assign,
                "new": CodeGeneratorJs.new,
                next: this.next,
                onBreakGosub: this.onBreakGosubOrRestore,
                onErrorGoto: this.onErrorGoto,
                onGosub: this.onGosubOnGoto,
                onGoto: this.onGosubOnGoto,
                onSqGosub: this.onSqGosub,
                openin: this.fnCommandWithGoto,
                print: this.print,
                randomize: this.randomize,
                read: this.read,
                rem: this.rem,
                renum: this.fnCommandWithGoto,
                restore: this.onBreakGosubOrRestore,
                resume: this.gotoOrResume,
                resumeNext: this.gotoOrResume,
                "return": CodeGeneratorJs.return,
                run: this.run,
                save: this.save,
                sound: this.fnCommandWithGoto,
                spc: this.spc,
                stop: this.stopOrEnd,
                tab: this.tab,
                tron: this.fnCommandWithGoto,
                wend: this.wend,
                "while": this.while
            };
            this.lexer = options.lexer;
            this.parser = options.parser;
            this.trace = Boolean(options.trace);
            this.rsx = options.rsx;
            this.quiet = options.quiet || false;
            this.noCodeFrame = options.noCodeFrame || false;
            this.reJsKeywords = CodeGeneratorJs.createJsKeywordRegex();
        }
        CodeGeneratorJs.prototype.reset = function () {
            var stack = this.stack;
            stack.forLabel.length = 0;
            stack.forVarName.length = 0;
            stack.whileLabel.length = 0;
            this.line = "0"; // current line (label)
            this.resetCountsPerLine();
            this.labelList.length = 0;
            this.dataList.length = 0;
            this.sourceMap = {};
            this.referencedLabelsCount = {}; // labels or line numbers
            this.countMap = {};
        };
        CodeGeneratorJs.prototype.resetCountsPerLine = function () {
            this.gosubCount = 0;
            this.ifCount = 0;
            this.stopCount = 0;
            this.forCount = 0; // stack needed
            this.whileCount = 0; // stack needed
        };
        CodeGeneratorJs.prototype.composeError = function (error, message, value, pos) {
            return Utils_1.Utils.composeError("CodeGeneratorJs", error, message, value, pos, undefined, this.line);
        };
        CodeGeneratorJs.createJsKeywordRegex = function () {
            return new RegExp("^(" + CodeGeneratorJs.jsKeywords.join("|") + ")$");
        };
        CodeGeneratorJs.prototype.fnDeclareVariable = function (name) {
            if (!this.variables.variableExist(name)) { // variable not yet defined?
                this.variables.initVariable(name);
            }
        };
        CodeGeneratorJs.prototype.fnAdaptVariableName = function (name, arrayIndices) {
            var defScopeArgs = this.defScopeArgs;
            name = name.toLowerCase().replace(/\./g, "_");
            if (defScopeArgs || !Utils_1.Utils.supportReservedNames) { // avoid keywords as def fn parameters; and for IE8 avoid keywords in dot notation
                if (this.reJsKeywords.test(name)) { // IE8: avoid keywords in dot notation
                    name = "_" + name; // prepend underscore
                }
            }
            if (name.endsWith("!")) { // real number?
                name = name.slice(0, -1) + "R"; // "!" => "R"
            }
            else if (name.endsWith("%")) { // integer number?
                name = name.slice(0, -1) + "I";
            }
            if (arrayIndices) {
                name += "A".repeat(arrayIndices);
            }
            if (defScopeArgs) {
                if (name === "o") { // we must not use format parameter "o" since this is our vm object
                    name = "no"; // change variable name to something we cannot set in BASIC
                }
                if (!defScopeArgs.collectDone) { // in collection mode?
                    defScopeArgs[name] = true; // declare DEF scope variable
                }
                else if (!(name in defScopeArgs)) {
                    // variable
                    this.fnDeclareVariable(name);
                    name = "v." + name; // access with "v."
                }
            }
            else {
                this.fnDeclareVariable(name);
                name = "v." + name; // access with "v."
            }
            return name;
        };
        CodeGeneratorJs.prototype.fnParseOneArg = function (arg) {
            this.parseNode(arg); // eslint-disable-line no-use-before-define
            return arg.pv;
        };
        CodeGeneratorJs.prototype.fnParseArgRange = function (args, start, stop) {
            var nodeArgs = []; // do not modify node.args here (could be a parameter of defined function)
            for (var i = start; i <= stop; i += 1) {
                nodeArgs.push(this.fnParseOneArg(args[i]));
            }
            return nodeArgs;
        };
        CodeGeneratorJs.prototype.fnParseArgs = function (args) {
            if (!args) {
                throw this.composeError(Error(), "Programming error: Undefined args", "", -1); // should not occur
            }
            return this.fnParseArgRange(args, 0, args.length - 1);
        };
        CodeGeneratorJs.prototype.fnDetermineStaticVarType = function (name) {
            return this.variables.determineStaticVarType(name);
        };
        CodeGeneratorJs.fnIsIntConst = function (a) {
            var reIntConst = /^[+-]?(\d+|0x[0-9a-f]+|0b[0-1]+)$/; // regex for integer, hex, binary constant
            return reIntConst.test(a);
        };
        CodeGeneratorJs.fnGetRoundString = function (node) {
            if (node.pt !== "I") { // no rounding needed for integer, hex, binary constants, integer variables, functions returning integer (optimization)
                node.pv = "o.vmRound(" + node.pv + ")";
            }
            return node.pv;
        };
        CodeGeneratorJs.fnIsInString = function (string, find) {
            return find && string.indexOf(find) >= 0;
        };
        CodeGeneratorJs.prototype.fnPropagateStaticTypes = function (node, left, right, types) {
            if (left.pt && right.pt) {
                if (CodeGeneratorJs.fnIsInString(types, left.pt + right.pt)) {
                    node.pt = left.pt === right.pt ? left.pt : "R";
                }
                else {
                    throw this.composeError(Error(), "Type error", node.value, node.pos);
                }
            }
            else if (left.pt && !CodeGeneratorJs.fnIsInString(types, left.pt) || right.pt && !CodeGeneratorJs.fnIsInString(types, right.pt)) {
                throw this.composeError(Error(), "Type error", node.value, node.pos);
            }
        };
        // operators
        CodeGeneratorJs.prototype.plus = function (node, left, right) {
            if (left === undefined) { // unary plus? => skip it
                node.pv = right.pv;
                var type = right.pt;
                if (CodeGeneratorJs.fnIsInString("IR$", type)) { // I, R or $?
                    node.pt = type;
                }
                else if (type) {
                    throw this.composeError(Error(), "Type error", node.value, node.pos);
                }
            }
            else {
                node.pv = left.pv + " + " + right.pv;
                this.fnPropagateStaticTypes(node, left, right, "II RR IR RI $$");
            }
        };
        CodeGeneratorJs.prototype.minus = function (node, left, right) {
            if (left === undefined) { // unary minus?
                var value = right.pv, type = right.pt;
                // when optimizing, beware of "--" operator in JavaScript!
                if (CodeGeneratorJs.fnIsIntConst(value) || right.type === "number") { // int const or number const (also fp)
                    if (value.charAt(0) === "-") { // starting already with "-"?
                        node.pv = value.substr(1); // remove "-"
                    }
                    else {
                        node.pv = "-" + value;
                    }
                }
                else {
                    node.pv = "-(" + value + ")"; // can be an expression
                }
                if (CodeGeneratorJs.fnIsInString("IR", type)) { // I or R?
                    node.pt = type;
                }
                else if (type) {
                    throw this.composeError(Error(), "Type error", node.value, node.pos);
                }
            }
            else {
                node.pv = left.pv + " - " + right.pv;
                this.fnPropagateStaticTypes(node, left, right, "II RR IR RI");
            }
        };
        CodeGeneratorJs.prototype.mult = function (node, left, right) {
            node.pv = left.pv + " * " + right.pv;
            this.fnPropagateStaticTypes(node, left, right, "II RR IR RI");
        };
        CodeGeneratorJs.prototype.div = function (node, left, right) {
            node.pv = left.pv + " / " + right.pv;
            this.fnPropagateStaticTypes(node, left, right, "II RR IR RI");
            node.pt = "R"; // event II can get a fraction
        };
        CodeGeneratorJs.prototype.intDiv = function (node, left, right) {
            node.pv = "(" + left.pv + " / " + right.pv + ") | 0"; // integer division
            this.fnPropagateStaticTypes(node, left, right, "II RR IR RI");
            node.pt = "I";
        };
        CodeGeneratorJs.prototype.exponent = function (node, left, right) {
            node.pv = "Math.pow(" + left.pv + ", " + right.pv + ")";
            this.fnPropagateStaticTypes(node, left, right, "II RR IR RI");
        };
        CodeGeneratorJs.prototype.and = function (node, left, right) {
            node.pv = CodeGeneratorJs.fnGetRoundString(left) + " & " + CodeGeneratorJs.fnGetRoundString(right);
            this.fnPropagateStaticTypes(node, left, right, "II RR IR RI");
            node.pt = "I";
        };
        CodeGeneratorJs.prototype.or = function (node, left, right) {
            node.pv = CodeGeneratorJs.fnGetRoundString(left) + " | " + CodeGeneratorJs.fnGetRoundString(right);
            this.fnPropagateStaticTypes(node, left, right, "II RR IR RI");
            node.pt = "I";
        };
        CodeGeneratorJs.prototype.xor = function (node, left, right) {
            node.pv = CodeGeneratorJs.fnGetRoundString(left) + " ^ " + CodeGeneratorJs.fnGetRoundString(right);
            this.fnPropagateStaticTypes(node, left, right, "II RR IR RI");
            node.pt = "I";
        };
        CodeGeneratorJs.not = function (node, _oLeft, right) {
            node.pv = "~(" + CodeGeneratorJs.fnGetRoundString(right) + ")"; // a can be an expression
            node.pt = "I";
        };
        CodeGeneratorJs.prototype.mod = function (node, left, right) {
            node.pv = CodeGeneratorJs.fnGetRoundString(left) + " % " + CodeGeneratorJs.fnGetRoundString(right);
            this.fnPropagateStaticTypes(node, left, right, "II RR IR RI");
            node.pt = "I";
        };
        CodeGeneratorJs.prototype.greater = function (node, left, right) {
            node.pv = left.pv + " > " + right.pv + " ? -1 : 0";
            this.fnPropagateStaticTypes(node, left, right, "II RR IR RI $$");
            node.pt = "I";
        };
        CodeGeneratorJs.prototype.less = function (node, left, right) {
            node.pv = left.pv + " < " + right.pv + " ? -1 : 0";
            this.fnPropagateStaticTypes(node, left, right, "II RR IR RI $$");
            node.pt = "I";
        };
        CodeGeneratorJs.prototype.greaterEqual = function (node, left, right) {
            node.pv = left.pv + " >= " + right.pv + " ? -1 : 0";
            this.fnPropagateStaticTypes(node, left, right, "II RR IR RI $$");
            node.pt = "I";
        };
        CodeGeneratorJs.prototype.lessEqual = function (node, left, right) {
            node.pv = left.pv + " <= " + right.pv + " ? -1 : 0";
            this.fnPropagateStaticTypes(node, left, right, "II RR IR RI $$");
            node.pt = "I";
        };
        CodeGeneratorJs.prototype.equal = function (node, left, right) {
            node.pv = left.pv + " === " + right.pv + " ? -1 : 0";
            this.fnPropagateStaticTypes(node, left, right, "II RR IR RI $$");
            node.pt = "I";
        };
        CodeGeneratorJs.prototype.notEqual = function (node, left, right) {
            node.pv = left.pv + " !== " + right.pv + " ? -1 : 0";
            this.fnPropagateStaticTypes(node, left, right, "II RR IR RI $$");
            node.pt = "I";
        };
        CodeGeneratorJs.prototype.addressOf = function (node, _oLeft, right) {
            node.pv = 'o.addressOf("' + right.pv + '")'; // address of
            if (right.type !== "identifier") {
                throw this.composeError(Error(), "Expected variable", node.value, node.pos);
            }
            node.pt = "I";
        };
        CodeGeneratorJs.stream = function (node, _oLeft, right) {
            // "#" stream as prefix operator
            node.pv = right.pv;
            node.pt = "I";
        };
        /* eslint-enable no-invalid-this */
        CodeGeneratorJs.prototype.fnParseDefIntRealStr = function (node) {
            var nodeArgs = this.fnParseArgs(node.args);
            for (var i = 0; i < nodeArgs.length; i += 1) {
                var arg = nodeArgs[i];
                nodeArgs[i] = "o." + node.type + '("' + arg + '")';
            }
            node.pv = nodeArgs.join("; ");
        };
        CodeGeneratorJs.prototype.fnAddReferenceLabel = function (label, node) {
            if (label in this.referencedLabelsCount) {
                this.referencedLabelsCount[label] += 1;
            }
            else {
                if (Utils_1.Utils.debug > 1) {
                    Utils_1.Utils.console.debug("fnAddReferenceLabel: line does not (yet) exist:", label);
                }
                if (!this.countMap.merge && !this.countMap.chainMerge) {
                    throw this.composeError(Error(), "Line does not exist", label, node.pos);
                }
            }
        };
        CodeGeneratorJs.prototype.fnGetForLabel = function () {
            var label = this.line + "f" + this.forCount;
            this.forCount += 1;
            return label;
        };
        CodeGeneratorJs.prototype.fnGetGosubLabel = function () {
            var label = this.line + "g" + this.gosubCount;
            this.gosubCount += 1;
            return label;
        };
        CodeGeneratorJs.prototype.fnGetIfLabel = function () {
            var label = this.line + "i" + this.ifCount;
            this.ifCount += 1;
            return label;
        };
        CodeGeneratorJs.prototype.fnGetStopLabel = function () {
            var label = this.line + "s" + this.stopCount;
            this.stopCount += 1;
            return label;
        };
        CodeGeneratorJs.prototype.fnGetWhileLabel = function () {
            var label = this.line + "w" + this.whileCount;
            this.whileCount += 1;
            return label;
        };
        CodeGeneratorJs.prototype.fnCommandWithGoto = function (node, nodeArgs) {
            nodeArgs = nodeArgs || this.fnParseArgs(node.args);
            var label = this.fnGetStopLabel();
            node.pv = "o." + node.type + "(" + nodeArgs.join(", ") + "); o.goto(\"" + label + "\"); break;\ncase \"" + label + "\":";
            return node.pv;
        };
        CodeGeneratorJs.commaOrSemicolon = function (node) {
            node.pv = node.type;
        };
        CodeGeneratorJs.prototype.vertical = function (node) {
            var rsxName = node.value.substr(1).toLowerCase().replace(/\./g, "_");
            var rsxAvailable = this.rsx && this.rsx.rsxIsAvailable(rsxName), nodeArgs = this.fnParseArgs(node.args), label = this.fnGetStopLabel();
            if (!rsxAvailable) { // if RSX not available, we delay the error until it is executed (or catched by on error goto)
                if (!this.quiet) {
                    var error = this.composeError(Error(), "Unknown RSX command", node.value, node.pos);
                    Utils_1.Utils.console.warn(error);
                }
                nodeArgs.unshift('"' + rsxName + '"'); // put as first arg
                rsxName = "rsxExec"; // and call special handler which triggers error if not available
            }
            node.pv = "o.rsx." + rsxName + "(" + nodeArgs.join(", ") + "); o.goto(\"" + label + "\"); break;\ncase \"" + label + "\":"; // most RSX commands need goto (era, ren,...)
        };
        CodeGeneratorJs.number = function (node) {
            node.pt = (/^\d+$/).test(node.value) ? "I" : "R";
            node.pv = node.value;
        };
        CodeGeneratorJs.binnumber = function (node) {
            var value = node.value.slice(2); // remove &x
            if (Utils_1.Utils.supportsBinaryLiterals) {
                value = "0b" + ((value.length) ? value : "0"); // &x->0b; 0b is ES6
            }
            else {
                value = "0x" + ((value.length) ? parseInt(value, 2).toString(16) : "0"); // we convert it to hex
            }
            node.pt = "I";
            node.pv = value;
        };
        CodeGeneratorJs.hexnumber = function (node) {
            var value = node.value.slice(1); // remove &
            if (value.charAt(0).toLowerCase() === "h") { // optional h
                value = value.slice(1); // remove
            }
            node.pt = "I";
            node.pv = "0x" + ((value.length) ? value : "0"); // &->0x
        };
        CodeGeneratorJs.prototype.identifier = function (node) {
            var nodeArgs = node.args ? this.fnParseArgRange(node.args, 1, node.args.length - 2) : [], // array: we skip open and close bracket
            name = this.fnAdaptVariableName(node.value, nodeArgs.length); // here we use node.value;
            var indices = "";
            for (var i = 0; i < nodeArgs.length; i += 1) { // array indices
                var arg = node.args[i + 1], // +1 because of opening braket
                index = arg.pt !== "I" ? ("o.vmRound(" + nodeArgs[i] + ")") : nodeArgs[i];
                // can we use fnGetRoundString()?
                indices += "[" + index + "]";
            }
            var varType = this.fnDetermineStaticVarType(name);
            if (varType.length > 1) {
                node.pt = varType.charAt(1);
            }
            node.pv = name + indices;
        };
        CodeGeneratorJs.letterOrLinenumber = function (node) {
            node.pv = node.value;
        };
        CodeGeneratorJs.prototype.range = function (node) {
            if (!node.left || !node.right) {
                throw this.composeError(Error(), "Programming error: Undefined left or right", node.type, node.pos); // should not occur
            }
            var left = this.fnParseOneArg(node.left), right = this.fnParseOneArg(node.right);
            if (left > right) {
                throw this.composeError(Error(), "Decreasing range", node.value, node.pos);
            }
            node.pv = left + '", "' + right;
        };
        CodeGeneratorJs.prototype.linerange = function (node) {
            if (!node.left || !node.right) {
                throw this.composeError(Error(), "Programming error: Undefined left or right", node.type, node.pos); // should not occur
            }
            var left = this.fnParseOneArg(node.left), right = this.fnParseOneArg(node.right), leftNumber = Number(left), // "undefined" gets NaN (should we check node.left.type for null?)
            rightNumber = Number(right);
            if (leftNumber > rightNumber) { // comparison with NaN and number is always false
                throw this.composeError(Error(), "Decreasing line range", node.value, node.pos);
            }
            var rightSpecified = (right === "undefined") ? "65535" : right; // make sure we set a missing right range parameter
            node.pv = !right ? left : left + ", " + rightSpecified;
        };
        CodeGeneratorJs.string = function (node) {
            var value = node.value;
            value = value.replace(/\\/g, "\\\\"); // escape backslashes
            value = Utils_1.Utils.hexEscape(value);
            node.pt = "$";
            node.pv = '"' + value + '"';
        };
        CodeGeneratorJs.unquoted = function (node) {
            node.pt = "$";
            node.pv = node.value;
        };
        CodeGeneratorJs.fnNull = function (node) {
            node.pv = node.value !== "null" ? node.value : "undefined"; // use explicit value or convert "null" to "undefined"
        };
        CodeGeneratorJs.prototype.assign = function (node) {
            // see also "let"
            if (!node.left || !node.right) {
                throw this.composeError(Error(), "Programming error: Undefined left or right", node.type, node.pos); // should not occur
            }
            if (node.left.type !== "identifier") {
                throw this.composeError(Error(), "Unexpected assign type", node.type, node.pos); // should not occur
            }
            var name = this.fnParseOneArg(node.left), assignValue = this.fnParseOneArg(node.right);
            this.fnPropagateStaticTypes(node, node.left, node.right, "II RR IR RI $$");
            var varType = this.fnDetermineStaticVarType(name);
            var value;
            if (node.pt) {
                if (node.left.pt === "I" && node.right.pt === "R") { // special handing for IR: rounding needed
                    value = "o.vmRound(" + assignValue + ")";
                    node.pt = "I"; // "R" => "I"
                }
                else {
                    value = assignValue;
                }
            }
            else {
                value = "o.vmAssign(\"" + varType + "\", " + assignValue + ")";
            }
            node.pv = name + " = " + value;
        };
        CodeGeneratorJs.prototype.generateTraceLabel = function (node, tracePrefix, i) {
            var traceLabel = tracePrefix + ((i > 0) ? "t" + i : ""), pos = node.pos, len = node.len || node.value.length || 0;
            this.sourceMap[traceLabel] = [
                pos,
                len
            ];
            return traceLabel;
        };
        CodeGeneratorJs.prototype.label = function (node) {
            var label = node.value;
            this.line = label; // set line before parsing args
            if (this.countMap.resumeNext) {
                this.labelList.push(label); // only needed to support resume next
            }
            this.resetCountsPerLine(); // we want to have "stable" counts, even if other lines change, e.g. direct
            var isDirect = label === "";
            var value = "";
            if (isDirect) { // special handling for direct
                value = "o.goto(\"directEnd\"); break;\n";
                label = '"direct"';
            }
            if (!this.noCodeFrame) {
                value += "case " + label + ":";
                value += " o.line = " + label + ";";
            }
            else {
                value = "";
            }
            var nodeArgs = this.fnParseArgs(node.args);
            for (var i = 0; i < nodeArgs.length; i += 1) {
                var value2 = nodeArgs[i];
                if (this.traceActive) {
                    var traceLabel = this.generateTraceLabel(node.args[i], this.line, i);
                    value += " o.vmTrace(\"" + traceLabel + "\");";
                }
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
            if (isDirect && !this.noCodeFrame) {
                value += "\n o.goto(\"end\"); break;\ncase \"directEnd\":"; // put in next line because of possible "rem"
            }
            node.pv = value;
        };
        // special keyword functions
        CodeGeneratorJs.prototype.afterEveryGosub = function (node) {
            var nodeArgs = this.fnParseArgs(node.args);
            if (!node.args) {
                throw this.composeError(Error(), "Programming error: Undefined args", node.type, node.pos); // should not occur
            }
            this.fnAddReferenceLabel(nodeArgs[2], node.args[2]); // argument 2 = line number
            node.pv = "o." + node.type + "(" + nodeArgs.join(", ") + ")";
        };
        CodeGeneratorJs.cont = function (node) {
            node.pv = "o." + node.type + "(); break;"; // append break
        };
        CodeGeneratorJs.prototype.data = function (node) {
            var nodeArgs = this.fnParseArgs(node.args);
            for (var i = 0; i < node.args.length; i += 1) {
                if (node.args[i].type === "unquoted") {
                    nodeArgs[i] = '"' + nodeArgs[i].replace(/\\/g, "\\\\").replace(/"/g, "\\\"") + '"'; // escape backslashes and quotes, put in quotes
                }
            }
            nodeArgs.unshift(String(this.line)); // prepend line number
            this.dataList.push("o.data(" + nodeArgs.join(", ") + ")"); // will be set at the beginning of the script
            node.pv = "/* data */";
        };
        CodeGeneratorJs.prototype.def = function (node) {
            if (!node.left || !node.right) {
                throw this.composeError(Error(), "Programming error: Undefined left or right", node.type, node.pos); // should not occur
            }
            var name = this.fnParseOneArg(node.left);
            this.defScopeArgs = {}; // collect DEF scope args
            var nodeArgs = this.fnParseArgs(node.args);
            this.defScopeArgs.collectDone = true; // collection done => now use them
            var expression = this.fnParseOneArg(node.right);
            this.defScopeArgs = undefined;
            this.fnPropagateStaticTypes(node, node.left, node.right, "II RR IR RI $$");
            var value;
            if (node.pt) {
                if (node.left.pt === "I" && node.right.pt === "R") { // special handing for IR: rounding needed
                    value = "o.vmRound(" + expression + ")";
                    node.pt = "I"; // "R" => "I"
                }
                else {
                    value = expression;
                }
            }
            else {
                var varType = this.fnDetermineStaticVarType(name);
                value = "o.vmAssign(\"" + varType + "\", " + expression + ")";
            }
            value = name + " = function (" + nodeArgs.join(", ") + ") { return " + value + "; };";
            node.pv = value;
        };
        CodeGeneratorJs.prototype.dim = function (node) {
            var args = [];
            if (!node.args) {
                throw this.composeError(Error(), "Programming error: Undefined args", node.type, node.pos); // should not occur
            }
            for (var i = 0; i < node.args.length; i += 1) {
                var nodeArg = node.args[i];
                if (nodeArg.type !== "identifier") {
                    throw this.composeError(Error(), "Expected variable in DIM", node.type, node.pos);
                }
                if (!nodeArg.args) {
                    throw this.composeError(Error(), "Programming error: Undefined args", nodeArg.type, nodeArg.pos); // should not occur
                }
                var nodeArgs = this.fnParseArgRange(nodeArg.args, 1, nodeArg.args.length - 2), // we skip open and close bracket
                fullExpression = this.fnParseOneArg(nodeArg);
                var name_1 = fullExpression;
                name_1 = name_1.substr(2); // remove preceding "v."
                var index = name_1.indexOf("["); // we should always have it
                name_1 = name_1.substr(0, index);
                args.push("/* " + fullExpression + " = */ o.dim(\"" + name_1 + "\", " + nodeArgs.join(", ") + ")");
            }
            node.pv = args.join("; ");
        };
        CodeGeneratorJs.prototype["delete"] = function (node) {
            var nodeArgs = this.fnParseArgs(node.args), name = Utils_1.Utils.supportReservedNames ? ("o." + node.type) : 'o[" + node.type + "]';
            if (!nodeArgs.length) { // no arguments? => complete range
                nodeArgs.push("1");
                nodeArgs.push("65535");
            }
            node.pv = name + "(" + nodeArgs.join(", ") + "); break;";
        };
        CodeGeneratorJs.prototype.edit = function (node) {
            var nodeArgs = this.fnParseArgs(node.args);
            node.pv = "o." + node.type + "(" + nodeArgs.join(", ") + "); break;";
        };
        CodeGeneratorJs.prototype["else"] = function (node) {
            if (!node.args) {
                throw this.composeError(Error(), "Programming error: Undefined args", "", -1); // should not occur
            }
            var value = node.type;
            for (var i = 0; i < node.args.length; i += 1) {
                var token = node.args[i];
                if (token.value) {
                    value += " " + token.value;
                }
            }
            node.pv = "// " + value + "\n";
        };
        CodeGeneratorJs.prototype.erase = function (node) {
            this.defScopeArgs = {}; // collect DEF scope args
            var nodeArgs = this.fnParseArgs(node.args);
            this.defScopeArgs = undefined;
            for (var i = 0; i < nodeArgs.length; i += 1) {
                nodeArgs[i] = '"' + nodeArgs[i] + '"'; // put in quotes
            }
            node.pv = "o." + node.type + "(" + nodeArgs.join(", ") + ")";
        };
        CodeGeneratorJs.prototype.error = function (node) {
            var nodeArgs = this.fnParseArgs(node.args);
            node.pv = "o." + node.type + "(" + nodeArgs.join(", ") + "); break";
        };
        CodeGeneratorJs.prototype.fn = function (node) {
            if (!node.left) {
                throw this.composeError(Error(), "Programming error: Undefined left", node.type, node.pos); // should not occur
            }
            var nodeArgs = this.fnParseArgs(node.args), name = this.fnParseOneArg(node.left);
            if (node.left.pt) {
                node.pt = node.left.pt;
            }
            node.pv = name + "(" + nodeArgs.join(", ") + ")";
        };
        CodeGeneratorJs.prototype["for"] = function (node) {
            var nodeArgs = this.fnParseArgs(node.args), varName = nodeArgs[0], label = this.fnGetForLabel();
            this.stack.forLabel.push(label);
            this.stack.forVarName.push(varName);
            if (!node.args) {
                throw this.composeError(Error(), "Programming error: Undefined args", node.type, node.pos); // should not occur
            }
            var startNode = node.args[1], endNode = node.args[2], stepNode = node.args[3]; // optional
            var startValue = nodeArgs[1], endValue = nodeArgs[2], stepValue = stepNode ? nodeArgs[3] : "1"; // default step
            // optimization for integer constants (check value and not type, because we also want to accept e.g. -<number>):
            var startIsIntConst = CodeGeneratorJs.fnIsIntConst(startValue), endIsIntConst = CodeGeneratorJs.fnIsIntConst(endValue), stepIsIntConst = CodeGeneratorJs.fnIsIntConst(stepValue), varType = this.fnDetermineStaticVarType(varName), type = (varType.length > 1) ? varType.charAt(1) : "";
            if (type === "$") {
                throw this.composeError(Error(), "String type in FOR at", node.type, node.pos);
            }
            if (!startIsIntConst) {
                if (startNode.pt !== "I") {
                    startValue = "o.vmAssign(\"" + varType + "\", " + startValue + ")"; // assign checks and rounds, if needed
                }
            }
            var endName;
            if (!endIsIntConst) {
                if (endNode.pt !== "I") {
                    endValue = "o.vmAssign(\"" + varType + "\", " + endValue + ")";
                }
                endName = varName + "End";
                var value2 = endName.substr(2); // remove preceding "v."
                this.fnDeclareVariable(value2); // declare also end variable
            }
            var stepName;
            if (!stepIsIntConst) {
                if (stepNode && stepNode.pt !== "I") {
                    stepValue = "o.vmAssign(\"" + varType + "\", " + stepValue + ")";
                }
                stepName = varName + "Step";
                var value2 = stepName.substr(2); // remove preceding "v."
                this.fnDeclareVariable(value2); // declare also step variable
            }
            var value = "/* for() */";
            if (type !== "I") {
                value += " o.vmAssertNumberType(\"" + varType + "\");"; // do a type check: assert number type
            }
            value += " " + varName + " = " + startValue + ";";
            if (!endIsIntConst) {
                value += " " + endName + " = " + endValue + ";";
            }
            if (!stepIsIntConst) {
                value += " " + stepName + " = " + stepValue + ";";
            }
            value += " o.goto(\"" + label + "b\"); break;";
            value += "\ncase \"" + label + "\": ";
            value += varName + " += " + (stepIsIntConst ? stepValue : stepName) + ";";
            value += "\ncase \"" + label + "b\": ";
            var endNameOrValue = endIsIntConst ? endValue : endName;
            if (stepIsIntConst) {
                if (Number(stepValue) > 0) {
                    value += "if (" + varName + " > " + endNameOrValue + ") { o.goto(\"" + label + "e\"); break; }";
                }
                else if (Number(stepValue) < 0) {
                    value += "if (" + varName + " < " + endNameOrValue + ") { o.goto(\"" + label + "e\"); break; }";
                }
                else { // stepValue === 0 => endless loop, if starting with variable < end
                    value += "if (" + varName + " < " + endNameOrValue + ") { o.goto(\"" + label + "e\"); break; }";
                }
            }
            else {
                value += "if (" + stepName + " > 0 && " + varName + " > " + endNameOrValue + " || " + stepName + " < 0 && " + varName + " < " + endNameOrValue + ") { o.goto(\"" + label + "e\"); break; }";
            }
            node.pv = value;
        };
        CodeGeneratorJs.prototype.gosub = function (node) {
            var nodeArgs = this.fnParseArgs(node.args), label = this.fnGetGosubLabel();
            for (var i = 0; i < nodeArgs.length; i += 1) {
                this.fnAddReferenceLabel(nodeArgs[i], node.args[i]);
            }
            node.pv = "o." + node.type + '("' + label + '", ' + nodeArgs.join(", ") + '); break;\ncase "' + label + '":';
        };
        CodeGeneratorJs.prototype.gotoOrResume = function (node) {
            var nodeArgs = this.fnParseArgs(node.args);
            for (var i = 0; i < nodeArgs.length; i += 1) {
                this.fnAddReferenceLabel(nodeArgs[i], node.args[i]);
            }
            node.pv = "o." + node.type + "(" + nodeArgs.join(", ") + "); break"; // with break
        };
        CodeGeneratorJs.prototype.fnThenOrElsePart = function (args, tracePrefix) {
            var nodeArgs = this.fnParseArgs(args);
            if (args[0].type === "linenumber") {
                var line = nodeArgs[0];
                this.fnAddReferenceLabel(line, args[0]);
                nodeArgs[0] = "o.goto(" + line + "); break"; // convert to "goto"
            }
            if (this.traceActive) {
                for (var i = 0; i < nodeArgs.length; i += 1) {
                    var traceLabel = this.generateTraceLabel(args[i], tracePrefix, i);
                    nodeArgs[i] = "o.vmTrace(\"" + traceLabel + "\"); " + nodeArgs[i];
                }
            }
            return nodeArgs.join("; ");
        };
        CodeGeneratorJs.fnIsSimplePart = function (part) {
            var partNoTrailingBreak = part.replace(/; break$/, ""), simplePart = !(/case|break/).test(partNoTrailingBreak);
            return simplePart;
        };
        CodeGeneratorJs.prototype["if"] = function (node) {
            if (!node.left) {
                throw this.composeError(Error(), "Programming error: Undefined left", node.type, node.pos); // should not occur
            }
            var expression = this.fnParseOneArg(node.left);
            if (expression.endsWith(" ? -1 : 0")) { // optimize simple expression
                expression = expression.replace(/ \? -1 : 0$/, "");
            }
            var label = this.fnGetIfLabel(), // need it also for tracing nested if
            thenPart = this.fnThenOrElsePart(node.args, label + "T"), // "then" statements
            simpleThen = CodeGeneratorJs.fnIsSimplePart(thenPart), elsePart = node.args2 ? this.fnThenOrElsePart(node.args2, label + "E") : "", // "else" statements
            simpleElse = node.args2 ? CodeGeneratorJs.fnIsSimplePart(elsePart) : true;
            var value = "if (" + expression + ") { ";
            if (simpleThen && simpleElse) {
                value += thenPart + "; }";
                if (elsePart) {
                    value += " else { " + elsePart + "; }";
                }
            }
            else {
                value += 'o.goto("' + label + '"); break; } ';
                if (elsePart !== "") { // "else" statements?
                    value += "/* else */ " + elsePart + "; ";
                }
                value += 'o.goto("' + label + 'e"); break;\ncase "' + label + '": ' + thenPart + ';\ncase "' + label + 'e": ';
            }
            node.pv = value;
        };
        CodeGeneratorJs.prototype.inputOrlineInput = function (node) {
            var nodeArgs = this.fnParseArgs(node.args), varTypes = [], label = this.fnGetStopLabel();
            if (nodeArgs.length < 4) {
                throw this.composeError(Error(), "Programming error: Not enough parameters", node.type, node.pos); // should not occur
            }
            var stream = nodeArgs[0];
            var noCRLF = nodeArgs[1];
            if (noCRLF === ";") { // ; or null
                noCRLF = '"' + noCRLF + '"';
            }
            var msg = nodeArgs[2];
            if (!node.args) {
                throw this.composeError(Error(), "Programming error: Undefined args", node.type, node.pos); // should not occur
            }
            if (node.args[2].type === "null") { // message type
                msg = '""';
            }
            var prompt = nodeArgs[3];
            if (prompt === ";" || node.args[3].type === "null") { // ";" => insert prompt "? " in quoted string
                msg = msg.substr(0, msg.length - 1) + "? " + msg.substr(-1, 1);
            }
            for (var i = 4; i < nodeArgs.length; i += 1) {
                varTypes[i - 4] = this.fnDetermineStaticVarType(nodeArgs[i]);
            }
            var value = "o.goto(\"" + label + "\"); break;\ncase \"" + label + "\":"; // also before input
            var label2 = this.fnGetStopLabel();
            value += "o." + node.type + "(" + stream + ", " + noCRLF + ", " + msg + ", \"" + varTypes.join('", "') + "\"); o.goto(\"" + label2 + "\"); break;\ncase \"" + label2 + "\":";
            for (var i = 4; i < nodeArgs.length; i += 1) {
                value += "; " + nodeArgs[i] + " = o.vmGetNextInput()";
            }
            node.pv = value;
        };
        CodeGeneratorJs.prototype.let = function (node) {
            if (!node.right) {
                throw this.composeError(Error(), "Programming error: Undefined right", node.type, node.pos); // should not occur
            }
            this.assign(node.right);
            node.pv = node.right.pv;
            node.pt = node.right.pt; // TODO: Do we need this?
        };
        CodeGeneratorJs.prototype.list = function (node) {
            var nodeArgs = this.fnParseArgs(node.args); // or: fnCommandWithGoto
            if (!node.args) {
                throw this.composeError(Error(), "Programming error: Undefined args", node.type, node.pos); // should not occur
            }
            if (!node.args.length || node.args[node.args.length - 1].type === "#") { // last parameter stream? or no parameters?
                var stream = nodeArgs.pop() || "0";
                nodeArgs.unshift(stream); // put it first
            }
            node.pv = "o." + node.type + "(" + nodeArgs.join(", ") + "); break;";
        };
        CodeGeneratorJs.prototype.mid$Assign = function (node) {
            var nodeArgs = this.fnParseArgs(node.args);
            if (nodeArgs.length < 3) {
                nodeArgs.push("undefined"); // empty length
            }
            if (!node.right) {
                throw this.composeError(Error(), "Programming error: Undefined right", "", -1); // should not occur
            }
            var right = this.fnParseOneArg(node.right);
            nodeArgs.push(right);
            var name = nodeArgs[0], varType = this.fnDetermineStaticVarType(name);
            node.pv = name + " = o.vmAssign(\"" + varType + "\", o.mid$Assign(" + nodeArgs.join(", ") + "))";
        };
        CodeGeneratorJs["new"] = function (node) {
            var name = Utils_1.Utils.supportReservedNames ? ("o." + node.type) : 'o[" + node.type + "]';
            node.pv = name + "();";
        };
        CodeGeneratorJs.prototype.next = function (node) {
            var nodeArgs = this.fnParseArgs(node.args);
            if (!nodeArgs.length) {
                nodeArgs.push(""); // we have no variable, so use empty argument
            }
            for (var i = 0; i < nodeArgs.length; i += 1) {
                var label = this.stack.forLabel.pop(), varName = this.stack.forVarName.pop();
                var errorNode = void 0;
                if (label === undefined) {
                    if (nodeArgs[i] === "") { // inserted node?
                        errorNode = node;
                    }
                    else { // identifier arg
                        errorNode = node.args[i];
                    }
                    throw this.composeError(Error(), "Unexpected NEXT", errorNode.type, errorNode.pos);
                }
                if (nodeArgs[i] !== "" && nodeArgs[i] !== varName) {
                    errorNode = node.args[i];
                    throw this.composeError(Error(), "Unexpected NEXT variable", errorNode.value, errorNode.pos);
                }
                nodeArgs[i] = "/* " + node.type + "(\"" + nodeArgs[i] + "\") */ o.goto(\"" + label + "\"); break;\ncase \"" + label + "e\":";
            }
            node.pv = nodeArgs.join("; ");
        };
        CodeGeneratorJs.prototype.onBreakGosubOrRestore = function (node) {
            var nodeArgs = this.fnParseArgs(node.args);
            for (var i = 0; i < nodeArgs.length; i += 1) {
                this.fnAddReferenceLabel(nodeArgs[i], node.args[i]);
            }
            node.pv = "o." + node.type + "(" + nodeArgs.join(", ") + ")";
        };
        CodeGeneratorJs.prototype.onErrorGoto = function (node) {
            var nodeArgs = this.fnParseArgs(node.args);
            for (var i = 0; i < nodeArgs.length; i += 1) {
                if (Number(nodeArgs[i])) { // only for lines > 0
                    this.fnAddReferenceLabel(nodeArgs[i], node.args[i]);
                }
            }
            node.pv = "o." + node.type + "(" + nodeArgs.join(", ") + ")";
        };
        CodeGeneratorJs.prototype.onGosubOnGoto = function (node) {
            var left = this.fnParseOneArg(node.left), nodeArgs = this.fnParseArgs(node.args), label = node.type === "onGosub" ? this.fnGetGosubLabel() : this.fnGetStopLabel();
            for (var i = 0; i < nodeArgs.length; i += 1) {
                this.fnAddReferenceLabel(nodeArgs[i], node.args[i]);
            }
            nodeArgs.unshift('"' + label + '"', left);
            node.pv = "o." + node.type + "(" + nodeArgs.join(", ") + '); break;\ncase "' + label + '":';
        };
        CodeGeneratorJs.prototype.onSqGosub = function (node) {
            var left = this.fnParseOneArg(node.left), nodeArgs = this.fnParseArgs(node.args);
            for (var i = 0; i < nodeArgs.length; i += 1) {
                this.fnAddReferenceLabel(nodeArgs[i], node.args[i]);
            }
            nodeArgs.unshift(left);
            node.pv = "o." + node.type + "(" + nodeArgs.join(", ") + ")";
        };
        CodeGeneratorJs.prototype.print = function (node) {
            var args = node.args, nodeArgs = [];
            var newLine = true;
            for (var i = 0; i < args.length; i += 1) {
                var arg = args[i];
                var argString = this.fnParseOneArg(arg);
                if (i === args.length - 1) {
                    if (arg.type === ";" || arg.type === "," || arg.type === "spc" || arg.type === "tab") {
                        newLine = false;
                    }
                }
                if (arg.type === ",") { // comma tab
                    argString = "{type: \"commaTab\", args: []}"; // we must delay the commaTab() call until print() is called
                    nodeArgs.push(argString);
                }
                else if (arg.type !== ";") { // ignore ";" separators
                    nodeArgs.push(argString);
                }
            }
            if (newLine) {
                var arg2 = '"\\r\\n"';
                nodeArgs.push(arg2);
            }
            node.pv = "o." + node.type + "(" + nodeArgs.join(", ") + ")";
        };
        CodeGeneratorJs.prototype.randomize = function (node) {
            var value;
            if (node.args.length) {
                var nodeArgs = this.fnParseArgs(node.args);
                value = "o." + node.type + "(" + nodeArgs.join(", ") + ")";
            }
            else {
                var label = this.fnGetStopLabel();
                value = "o.goto(\"" + label + "\"); break;\ncase \"" + label + "\":"; // also before input
                value += this.fnCommandWithGoto(node) + " o.randomize(o.vmGetNextInput())";
            }
            node.pv = value;
        };
        CodeGeneratorJs.prototype.read = function (node) {
            var nodeArgs = this.fnParseArgs(node.args);
            for (var i = 0; i < nodeArgs.length; i += 1) {
                var name_2 = nodeArgs[i], varType = this.fnDetermineStaticVarType(name_2);
                nodeArgs[i] = name_2 + " = o." + node.type + "(\"" + varType + "\")";
            }
            node.pv = nodeArgs.join("; ");
        };
        CodeGeneratorJs.prototype.rem = function (node) {
            var nodeArgs = this.fnParseArgs(node.args), value = nodeArgs.length ? " " + nodeArgs[0] : "";
            node.pv = "//" + value + "\n";
        };
        CodeGeneratorJs["return"] = function (node) {
            var name = Utils_1.Utils.supportReservedNames ? ("o." + node.type) : 'o[" + node.type + "]';
            node.pv = name + "(); break;";
        };
        CodeGeneratorJs.prototype.run = function (node) {
            if (node.args.length) {
                if (node.args[0].type === "linenumber" || node.args[0].type === "number") { // optional line number, should be linenumber only
                    this.fnAddReferenceLabel(this.fnParseOneArg(node.args[0]), node.args[0]); // parse only one arg, args are parsed later
                }
            }
            node.pv = this.fnCommandWithGoto(node);
        };
        CodeGeneratorJs.prototype.save = function (node) {
            var nodeArgs = [];
            if (node.args.length) {
                var fileName = this.fnParseOneArg(node.args[0]);
                nodeArgs.push(fileName);
                if (node.args.length > 1) {
                    this.defScopeArgs = {}; // collect DEF scope args
                    var type = '"' + this.fnParseOneArg(node.args[1]) + '"';
                    this.defScopeArgs = undefined;
                    nodeArgs.push(type);
                    var nodeArgs2 = node.args.slice(2), // get remaining args
                    nodeArgs3 = this.fnParseArgs(nodeArgs2);
                    nodeArgs = nodeArgs.concat(nodeArgs3);
                }
            }
            node.pv = this.fnCommandWithGoto(node, nodeArgs);
        };
        CodeGeneratorJs.prototype.spc = function (node) {
            var nodeArgs = this.fnParseArgs(node.args);
            node.pv = "{type: \"spc\", args: [" + nodeArgs.join(", ") + "]}"; // we must delay the spc() call until print() is called because we need stream
        };
        CodeGeneratorJs.prototype.stopOrEnd = function (node) {
            var label = this.fnGetStopLabel();
            node.pv = "o." + node.type + "(\"" + label + "\"); break;\ncase \"" + label + "\":";
        };
        CodeGeneratorJs.prototype.tab = function (node) {
            var nodeArgs = this.fnParseArgs(node.args);
            node.pv = "{type: \"tab\", args: [" + nodeArgs.join(", ") + "]}"; // we must delay the tab() call until print() is called
        };
        CodeGeneratorJs.prototype.wend = function (node) {
            var label = this.stack.whileLabel.pop();
            if (label === undefined) {
                throw this.composeError(Error(), "Unexpected WEND", node.type, node.pos);
            }
            node.pv = "/* o." + node.type + "() */ o.goto(\"" + label + "\"); break;\ncase \"" + label + "e\":";
        };
        CodeGeneratorJs.prototype["while"] = function (node) {
            var nodeArgs = this.fnParseArgs(node.args), label = this.fnGetWhileLabel();
            this.stack.whileLabel.push(label);
            node.pv = "\ncase \"" + label + "\": if (!(" + nodeArgs + ")) { o.goto(\"" + label + "e\"); break; }";
        };
        /* eslint-enable no-invalid-this */
        CodeGeneratorJs.prototype.fnParseOther = function (node) {
            var nodeArgs = this.fnParseArgs(node.args), typeWithSpaces = " " + node.type + " ";
            node.pv = "o." + node.type + "(" + nodeArgs.join(", ") + ")";
            if (CodeGeneratorJs.fnIsInString(" asc cint derr eof erl err fix fre inkey inp instr int joy len memory peek pos remain sgn sq test testr unt vpos xpos ypos ", typeWithSpaces)) {
                node.pt = "I";
            }
            else if (CodeGeneratorJs.fnIsInString(" abs atn cos creal exp log log10 max min pi rnd round sin sqr tan time val ", typeWithSpaces)) {
                node.pt = "R";
            }
            else if (CodeGeneratorJs.fnIsInString(" bin$ chr$ copychr$ dec$ hex$ inkey$ left$ lower$ mid$ right$ space$ str$ string$ upper$ ", typeWithSpaces)) {
                node.pt = "$";
            }
        };
        CodeGeneratorJs.prototype.parseNode = function (node) {
            if (Utils_1.Utils.debug > 3) {
                Utils_1.Utils.console.debug("evaluate: parseNode node=%o type=" + node.type + " value=" + node.value + " left=%o right=%o args=%o", node, node.left, node.right, node.args);
            }
            var operators = this.allOperators;
            if (operators[node.type]) {
                if (node.left) {
                    this.parseNode(node.left);
                    if (operators[node.left.type] && node.left.left) { // binary operator?
                        node.left.pv = "(" + node.left.pv + ")";
                    }
                    if (!node.right) {
                        throw this.composeError(Error(), "Programming error: Undefined right", "", -1); // should not occur
                    }
                    this.parseNode(node.right);
                    if (operators[node.right.type] && node.right.left) { // binary operator?
                        node.right.pv = "(" + node.right.pv + ")";
                    }
                    operators[node.type].call(this, node, node.left, node.right);
                }
                else {
                    if (!node.right) {
                        throw this.composeError(Error(), "Programming error: Undefined right", "", -1); // should not occur
                    }
                    this.parseNode(node.right);
                    this.unaryOperators[node.type].call(this, node, undefined, node.right); // unary operator: we just use node.right
                }
            }
            else if (this.parseFunctions[node.type]) { // function with special handling?
                this.parseFunctions[node.type].call(this, node);
            }
            else { // for other functions, generate code directly
                this.fnParseOther(node);
            }
        };
        CodeGeneratorJs.fnCommentUnusedCases = function (output, labels) {
            return output.replace(/^case (\d+):/gm, function (all, line) {
                return (labels[line]) ? all : "/* " + all + " */";
            });
        };
        CodeGeneratorJs.prototype.fnCreateLabelsMap = function (parseTree, labels, allowDirect) {
            var lastLine = -1;
            for (var i = 0; i < parseTree.length; i += 1) {
                var node = parseTree[i];
                if (node.type === "label") {
                    var label = node.value, isDirect = label === "";
                    if (label in labels) {
                        throw this.composeError(Error(), "Duplicate line number", label, node.pos);
                    }
                    var lineNumber = Number(label);
                    if (!isDirect) {
                        if ((lineNumber | 0) !== lineNumber) { // eslint-disable-line no-bitwise
                            throw this.composeError(Error(), "Expected integer line number", label, node.pos);
                        }
                        if (lineNumber <= lastLine) {
                            throw this.composeError(Error(), "Expected increasing line number", label, node.pos);
                        }
                        if (lineNumber < 1 || lineNumber > 65535) {
                            throw this.composeError(Error(), "Line number overflow", label, node.pos);
                        }
                        lastLine = lineNumber;
                    }
                    else if (!allowDirect) {
                        throw this.composeError(Error(), "Direct command found", label, node.pos);
                    }
                    labels[label] = 0; // init call count
                }
            }
        };
        CodeGeneratorJs.prototype.fnPrecheckTree = function (nodes, countMap) {
            for (var i = 0; i < nodes.length; i += 1) {
                var node = nodes[i];
                countMap[node.type] = (countMap[node.type] || 0) + 1;
                if (node.type === "resume" && !(node.args && node.args.length)) {
                    var resumeNoArgs = "resumeNoArgsCount";
                    countMap[resumeNoArgs] = (countMap[resumeNoArgs] || 0) + 1;
                }
                if (node.args) {
                    this.fnPrecheckTree(node.args, countMap); // recursive
                }
                if (node.args2) { // for "ELSE"
                    this.fnPrecheckTree(node.args2, countMap); // recursive
                }
            }
        };
        //
        // evaluate
        //
        CodeGeneratorJs.prototype.evaluate = function (parseTree, variables, allowDirect) {
            this.variables = variables;
            this.defScopeArgs = undefined;
            // create labels map
            this.fnCreateLabelsMap(parseTree, this.referencedLabelsCount, allowDirect);
            this.fnPrecheckTree(parseTree, this.countMap); // also set "_resumeNoArgs" for resume without args
            this.traceActive = this.trace || Boolean(this.countMap.tron) || Boolean(this.countMap.resumeNext) || Boolean(this.countMap.resumeNoArgsCount); // we also switch on tracing for tron, resumeNext or resume without parameter
            var output = "";
            for (var i = 0; i < parseTree.length; i += 1) {
                if (Utils_1.Utils.debug > 2) {
                    Utils_1.Utils.console.debug("evaluate: parseTree i=%d, node=%o", i, parseTree[i]);
                }
                var line = this.fnParseOneArg(parseTree[i]);
                if ((line !== undefined) && (line !== "")) {
                    if (line !== null) {
                        if (output.length === 0) {
                            output = line;
                        }
                        else {
                            output += "\n" + line;
                        }
                    }
                    else {
                        output = ""; // cls (clear output when node is set to null)
                    }
                }
            }
            // optimize: comment lines which are not referenced
            if (!this.countMap.merge && !this.countMap.chainMerge && !this.countMap.resumeNext && !this.countMap.resumeNoArgsCount) {
                output = CodeGeneratorJs.fnCommentUnusedCases(output, this.referencedLabelsCount);
            }
            return output;
        };
        CodeGeneratorJs.combineData = function (data) {
            return data.length ? data.join(";\n") + ";\n" : "";
        };
        CodeGeneratorJs.combineLabels = function (data) {
            return data.length ? "o.vmSetLabels([" + data.join(",") + "]);\n" : "";
        };
        CodeGeneratorJs.prototype.getSourceMap = function () {
            return this.sourceMap;
        };
        CodeGeneratorJs.prototype.debugGetLabelsCount = function () {
            return Object.keys(this.referencedLabelsCount).length;
        };
        CodeGeneratorJs.prototype.generate = function (input, variables, allowDirect) {
            var out = {
                text: ""
            };
            this.reset();
            try {
                var tokens = this.lexer.lex(input), parseTree = this.parser.parse(tokens);
                var output = this.evaluate(parseTree, variables, Boolean(allowDirect));
                var combinedData = CodeGeneratorJs.combineData(this.dataList), combinedLabels = CodeGeneratorJs.combineLabels(this.labelList);
                if (!this.noCodeFrame) {
                    output = '"use strict"\n'
                        + "var v=o.vmGetAllVariables();\n"
                        + "while (o.vmLoopCondition()) {\nswitch (o.line) {\ncase 0:\n"
                        + combinedData
                        + combinedLabels
                        + " o.goto(o.startLine ? o.startLine : \"start\"); break;\ncase \"start\":\n"
                        + output
                        + "\ncase \"end\": o.vmStop(\"end\", 90); break;\ndefault: o.error(8); o.goto(\"end\"); break;\n}}\n";
                }
                else {
                    output = combinedData + output;
                }
                out.text = output;
            }
            catch (e) {
                if (Utils_1.Utils.isCustomError(e)) {
                    out.error = e;
                    if (!this.quiet) {
                        Utils_1.Utils.console.warn(e); // show our customError as warning
                    }
                }
                else { // other errors
                    out.error = e; // force set other error
                    Utils_1.Utils.console.error(e);
                }
            }
            return out;
        };
        // ECMA 3 JS Keywords which must be avoided in dot notation for properties when using IE8
        CodeGeneratorJs.jsKeywords = [
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
});
//# sourceMappingURL=CodeGeneratorJs.js.map