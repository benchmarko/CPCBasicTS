// CodeGeneratorBasic.ts - Code Generator for BASIC (for testing, pretty print?)
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//
//
define(["require", "exports", "./Utils", "./BasicParser"], function (require, exports, Utils_1, BasicParser_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CodeGeneratorBasic = void 0;
    var CodeGeneratorBasic = /** @class */ (function () {
        function CodeGeneratorBasic(options) {
            this.hasColons = false;
            this.keepWhiteSpace = false;
            this.line = 0; // current line (label)
            /* eslint-disable no-invalid-this */
            this.parseFunctions = {
                "(": this.fnParenthesisOpen,
                string: CodeGeneratorBasic.string,
                ustring: CodeGeneratorBasic.ustring,
                assign: this.assign,
                expnumber: CodeGeneratorBasic.expnumber,
                binnumber: CodeGeneratorBasic.binHexNumber,
                hexnumber: CodeGeneratorBasic.binHexNumber,
                label: this.label,
                "|": this.vertical,
                afterGosub: this.afterEveryGosub,
                chain: this.chainOrChainMerge,
                chainMerge: this.chainOrChainMerge,
                data: this.data,
                def: this.def,
                "else": this.fnElse,
                elseComment: this.elseComment,
                everyGosub: this.afterEveryGosub,
                fn: this.fn,
                "for": this.fnFor,
                "if": this.fnIf,
                input: this.inputLineInput,
                lineInput: this.inputLineInput,
                list: this.list,
                mid$Assign: this.mid$Assign,
                onBreakCont: this.onBreakOrError,
                onBreakGosub: this.onBreakOrError,
                onBreakStop: this.onBreakOrError,
                onErrorGoto: this.onBreakOrError,
                onGosub: this.onGotoGosub,
                onGoto: this.onGotoGosub,
                onSqGosub: this.onSqGosub,
                print: this.print,
                rem: this.rem,
                using: this.using,
                write: this.write
            };
            this.options = {
                lexer: options.lexer,
                parser: options.parser,
                quiet: false
            };
            this.setOptions(options);
        }
        CodeGeneratorBasic.prototype.setOptions = function (options) {
            if (options.quiet !== undefined) {
                this.options.quiet = options.quiet;
            }
        };
        CodeGeneratorBasic.prototype.getOptions = function () {
            return this.options;
        };
        CodeGeneratorBasic.prototype.composeError = function (error, message, value, pos) {
            return Utils_1.Utils.composeError("CodeGeneratorBasic", error, message, value, pos, undefined, this.line);
        };
        CodeGeneratorBasic.fnWs = function (node) {
            return node.ws || "";
        };
        CodeGeneratorBasic.fnSpace1 = function (value) {
            return (!value.length || value.startsWith(" ") ? "" : " ") + value;
        };
        CodeGeneratorBasic.getUcKeyword = function (node) {
            var type = node.type;
            return CodeGeneratorBasic.combinedKeywords[type] || type.toUpperCase();
        };
        CodeGeneratorBasic.prototype.fnParseArgs = function (args) {
            var nodeArgs = []; // do not modify node.args here (could be a parameter of defined function)
            if (!args) {
                throw this.composeError(Error(), "Programming error: Undefined args", "", -1); // should not occur
            }
            for (var i = 0; i < args.length; i += 1) {
                var value = this.parseNode(args[i]);
                if (args[i].type === "'" || args[i].type === "else" || args[i].type === "elseComment") { // fast hack to put a space before "'", "else" or "elseComment", if there is no space previously
                    if (i > 0 && !nodeArgs[i - 1].endsWith(" ") && !nodeArgs[i - 1].endsWith(":")) {
                        value = CodeGeneratorBasic.fnSpace1(value);
                    }
                }
                nodeArgs.push(value);
            }
            return nodeArgs;
        };
        CodeGeneratorBasic.prototype.combineArgsWithColon = function (args) {
            if (!this.hasColons) {
                for (var i = 1; i < args.length; i += 1) { // start with 1
                    var arg = args[i].trim();
                    if (!arg.startsWith("ELSE") && !arg.startsWith("'") && arg !== "") {
                        args[i] = ":" + args[i];
                    }
                }
            }
            return args.join("");
        };
        CodeGeneratorBasic.prototype.fnParenthesisOpen = function (node) {
            return CodeGeneratorBasic.fnWs(node) + node.value + (node.args ? this.fnParseArgs(node.args).join("") : "");
        };
        CodeGeneratorBasic.string = function (node) {
            return CodeGeneratorBasic.fnWs(node) + '"' + node.value + '"';
        };
        CodeGeneratorBasic.ustring = function (node) {
            return CodeGeneratorBasic.fnWs(node) + '"' + node.value;
        };
        CodeGeneratorBasic.prototype.assign = function (node) {
            // see also "let"
            if (node.left.type !== "identifier") {
                throw this.composeError(Error(), "Unexpected assign type", node.type, node.pos); // should not occur
            }
            // no spaces needed around "="
            return this.parseNode(node.left) + CodeGeneratorBasic.fnWs(node) + node.value + this.parseNode(node.right);
        };
        CodeGeneratorBasic.expnumber = function (node) {
            return CodeGeneratorBasic.fnWs(node) + Number(node.value).toExponential().toUpperCase().replace(/(\d+)$/, function (x) {
                return x.length >= 2 ? x : x.padStart(2, "0"); // format with 2 exponential digits
            });
        };
        CodeGeneratorBasic.binHexNumber = function (node) {
            return CodeGeneratorBasic.fnWs(node) + node.value.toUpperCase(); // binnumber: maybe "&x", hexnumber: mayby "&h"
        };
        CodeGeneratorBasic.prototype.label = function (node) {
            this.line = Number(node.value); // set line before parsing args
            var value = this.combineArgsWithColon(this.fnParseArgs(node.args));
            return CodeGeneratorBasic.fnWs(node) + node.value + (node.value !== "" ? CodeGeneratorBasic.fnSpace1(value) : value);
        };
        // special keyword functions
        CodeGeneratorBasic.prototype.vertical = function (node) {
            return CodeGeneratorBasic.fnWs(node) + node.value.toUpperCase() + this.fnParseArgs(node.args).join("");
        };
        CodeGeneratorBasic.prototype.afterEveryGosub = function (node) {
            var nodeArgs = this.fnParseArgs(node.args);
            nodeArgs[0] = CodeGeneratorBasic.fnSpace1(nodeArgs[0]); // first argument
            nodeArgs[nodeArgs.length - 2] = CodeGeneratorBasic.fnSpace1(nodeArgs[nodeArgs.length - 2]); // "gosub"
            nodeArgs[nodeArgs.length - 1] = CodeGeneratorBasic.fnSpace1(nodeArgs[nodeArgs.length - 1]); // line number
            return CodeGeneratorBasic.fnWs(node) + node.value.toUpperCase() + nodeArgs.join("");
        };
        CodeGeneratorBasic.prototype.chainOrChainMerge = function (node) {
            var nodeArgs = this.fnParseArgs(node.args);
            if (nodeArgs.length > 2) { // with delete?
                if (nodeArgs[nodeArgs.length - 2] === "DELETE") {
                    nodeArgs[nodeArgs.length - 1] = CodeGeneratorBasic.fnSpace1(nodeArgs[nodeArgs.length - 1]);
                }
            }
            return CodeGeneratorBasic.fnWs(node) + CodeGeneratorBasic.getUcKeyword(node) + (node.right ? CodeGeneratorBasic.fnSpace1(this.parseNode(node.right)) : "") + CodeGeneratorBasic.fnSpace1(nodeArgs.join(""));
        };
        CodeGeneratorBasic.prototype.data = function (node) {
            var nodeArgs = this.fnParseArgs(node.args);
            for (var i = 0; i < nodeArgs.length; i += 1) {
                var value2 = nodeArgs[i];
                nodeArgs[i] = value2;
            }
            var args = nodeArgs.join("");
            if (!this.keepWhiteSpace) {
                args = Utils_1.Utils.stringTrimEnd(args); // remove trailing spaces
            }
            return CodeGeneratorBasic.fnWs(node) + node.type.toUpperCase() + CodeGeneratorBasic.fnSpace1(args);
        };
        CodeGeneratorBasic.prototype.def = function (node) {
            return CodeGeneratorBasic.fnWs(node) + node.type.toUpperCase() + (node.right ? CodeGeneratorBasic.fnSpace1(this.parseNode(node.right)) + this.fnParseArgs(node.args).join("") : "");
        };
        CodeGeneratorBasic.prototype.elseComment = function (node) {
            if (!node.args) {
                throw this.composeError(Error(), "Programming error: Undefined args", "", -1); // should not occur
            }
            var args = node.args;
            var value = "";
            for (var i = 0; i < args.length; i += 1) {
                var token = args[i];
                if (token.value) {
                    if (this.keepWhiteSpace) {
                        value += CodeGeneratorBasic.fnWs(token) + token.value;
                    }
                    else {
                        value += CodeGeneratorBasic.fnSpace1(CodeGeneratorBasic.fnWs(token) + token.value);
                    }
                }
            }
            return CodeGeneratorBasic.fnWs(node) + "else".toUpperCase() + value;
        };
        CodeGeneratorBasic.prototype.fn = function (node) {
            if (!node.right) {
                return CodeGeneratorBasic.fnWs(node) + node.type.toUpperCase(); // only fn
            }
            var nodeArgs = node.args ? this.fnParseArgs(node.args) : [];
            var right = this.parseNode(node.right);
            if ((node.right.pos - node.pos) > 2) { // space between fn and identifier?
                right = CodeGeneratorBasic.fnSpace1(right); // keep it
            }
            return CodeGeneratorBasic.fnWs(node) + node.type.toUpperCase() + right + nodeArgs.join("");
        };
        CodeGeneratorBasic.prototype.fnFor = function (node) {
            var nodeArgs = this.fnParseArgs(node.args);
            for (var i = 0; i < nodeArgs.length; i += 1) {
                if (i !== 1 && i !== 2) { // not for "=" and startValue
                    nodeArgs[i] = CodeGeneratorBasic.fnSpace1(nodeArgs[i]); // set minimal spaces in case we do not keep whitespace
                }
            }
            return CodeGeneratorBasic.fnWs(node) + node.type.toUpperCase() + nodeArgs.join("");
        };
        CodeGeneratorBasic.prototype.fnElse = function (node) {
            return CodeGeneratorBasic.fnWs(node) + node.type.toUpperCase() + CodeGeneratorBasic.fnSpace1(this.combineArgsWithColon(this.fnParseArgs(node.args)));
        };
        CodeGeneratorBasic.prototype.fnIf = function (node) {
            var nodeArgs = this.fnParseArgs(node.args), partName = nodeArgs.shift(); // "then"/"goto"
            return CodeGeneratorBasic.fnWs(node) + node.type.toUpperCase() + CodeGeneratorBasic.fnSpace1(this.parseNode(node.right))
                + CodeGeneratorBasic.fnSpace1(partName) + CodeGeneratorBasic.fnSpace1(this.combineArgsWithColon(nodeArgs));
        };
        CodeGeneratorBasic.prototype.inputLineInput = function (node) {
            var nodeArgs = node.args ? this.fnParseArgs(node.args) : [], // also for clear input, which has no args
            name = node.right ? this.parseNode(node.right) : ""; // line input?
            return CodeGeneratorBasic.fnWs(node) + CodeGeneratorBasic.getUcKeyword(node) + CodeGeneratorBasic.fnSpace1(name) + CodeGeneratorBasic.fnSpace1(nodeArgs.join(""));
        };
        CodeGeneratorBasic.prototype.list = function (node) {
            var nodeArgs = this.fnParseArgs(node.args);
            if (nodeArgs.length && nodeArgs[0] === "") { // empty range?
                nodeArgs.shift(); // remove
            }
            if (nodeArgs.length && nodeArgs[nodeArgs.length - 1] === "#") { // dummy stream?
                nodeArgs.pop(); // remove
            }
            return CodeGeneratorBasic.fnWs(node) + node.type.toUpperCase() + CodeGeneratorBasic.fnSpace1(nodeArgs.join(""));
        };
        CodeGeneratorBasic.prototype.mid$Assign = function (node) {
            return CodeGeneratorBasic.fnWs(node) + CodeGeneratorBasic.getUcKeyword(node) + this.fnParseArgs(node.args).join("");
        };
        CodeGeneratorBasic.prototype.onBreakOrError = function (node) {
            return CodeGeneratorBasic.fnWs(node) + "ON" + CodeGeneratorBasic.fnSpace1(this.parseNode(node.right)) + CodeGeneratorBasic.fnSpace1(this.fnParseArgs(node.args).join(""));
        };
        CodeGeneratorBasic.prototype.onGotoGosub = function (node) {
            var nodeArgs = this.fnParseArgs(node.args), expression = nodeArgs.shift(), instruction = nodeArgs.shift(); // "goto" or "gosub"
            return CodeGeneratorBasic.fnWs(node) + "ON" + CodeGeneratorBasic.fnSpace1(expression) + CodeGeneratorBasic.fnSpace1(instruction) + CodeGeneratorBasic.fnSpace1(nodeArgs.join(""));
        };
        CodeGeneratorBasic.prototype.onSqGosub = function (node) {
            var nodeArgs = this.fnParseArgs(node.args);
            nodeArgs[nodeArgs.length - 2] = CodeGeneratorBasic.fnSpace1(nodeArgs[nodeArgs.length - 2]); // "gosub" with space (optional)
            nodeArgs[nodeArgs.length - 1] = CodeGeneratorBasic.fnSpace1(nodeArgs[nodeArgs.length - 1]); // line number with space
            return CodeGeneratorBasic.fnWs(node) + "ON" + CodeGeneratorBasic.fnSpace1(this.parseNode(node.right)) + nodeArgs.join("");
        };
        CodeGeneratorBasic.prototype.print = function (node) {
            var nodeArgs = this.fnParseArgs(node.args);
            var value = "";
            for (var i = 0; i < nodeArgs.length; i += 1) {
                value += nodeArgs[i];
            }
            if (node.value !== "?") { // for "print"
                value = CodeGeneratorBasic.fnSpace1(value);
            }
            return CodeGeneratorBasic.fnWs(node) + node.value.toUpperCase() + value; // we use value to get PRINT or ?
        };
        CodeGeneratorBasic.prototype.rem = function (node) {
            return CodeGeneratorBasic.fnWs(node) + node.type.toUpperCase() + this.fnParseArgs(node.args).join("");
        };
        CodeGeneratorBasic.prototype.using = function (node) {
            var nodeArgs = this.fnParseArgs(node.args), template = nodeArgs.length ? nodeArgs.shift() || "" : "";
            return CodeGeneratorBasic.fnWs(node) + node.type.toUpperCase() + CodeGeneratorBasic.fnSpace1(template) + nodeArgs.join("");
        };
        CodeGeneratorBasic.prototype.write = function (node) {
            return CodeGeneratorBasic.fnWs(node) + node.type.toUpperCase() + (node.args ? CodeGeneratorBasic.fnSpace1(this.fnParseArgs(node.args).join("")) : ""); // separators already there
        };
        /* eslint-enable no-invalid-this */
        CodeGeneratorBasic.prototype.fnParseOther = function (node) {
            var type = node.type;
            var value = ""; // CodeGeneratorBasic.fnGetWs(node);
            if (node.left) {
                value += this.parseNode(node.left);
            }
            value += CodeGeneratorBasic.fnWs(node);
            var keyType = BasicParser_1.BasicParser.keywords[type];
            if (keyType) {
                value += CodeGeneratorBasic.getUcKeyword(node);
            }
            else if (node.value) { // e.g. string,...
                value += node.value;
            }
            var right = "";
            if (node.right) {
                right = this.parseNode(node.right);
                var needSpace1 = BasicParser_1.BasicParser.keywords[right.toLowerCase()] || keyType;
                value += needSpace1 ? CodeGeneratorBasic.fnSpace1(right) : right;
            }
            if (node.args) {
                var nodeArgs = this.fnParseArgs(node.args).join(""), needSpace2 = keyType && keyType.charAt(0) !== "f" && node.type !== "'";
                // special handling for combined keywords with 2 tokens (for 3 tokens, we need a specific function)
                value += needSpace2 ? CodeGeneratorBasic.fnSpace1(nodeArgs) : nodeArgs;
            }
            return value;
        };
        CodeGeneratorBasic.getLeftOrRightOperatorPrecedence = function (node) {
            var precedence = CodeGeneratorBasic.operatorPrecedence, operators = CodeGeneratorBasic.operators;
            var pr;
            if (operators[node.type] && (node.left || node.right)) { // binary operator (or unary operator, e.g. not)
                if (node.left) { // right is binary
                    pr = precedence[node.type] || 0;
                }
                else {
                    pr = precedence["p" + node.type] || precedence[node.type] || 0;
                }
            }
            return pr;
        };
        CodeGeneratorBasic.prototype.parseOperator = function (node) {
            var precedence = CodeGeneratorBasic.operatorPrecedence, operators = CodeGeneratorBasic.operators;
            var value;
            if (node.left) {
                value = this.parseNode(node.left);
                var p = precedence[node.type], pl = CodeGeneratorBasic.getLeftOrRightOperatorPrecedence(node.left);
                if (pl !== undefined && pl < p) {
                    value = "(" + value + ")";
                }
                var right = node.right;
                var value2 = this.parseNode(right);
                var pr = CodeGeneratorBasic.getLeftOrRightOperatorPrecedence(right);
                if (pr !== undefined) {
                    if ((pr < p) || ((pr === p) && node.type === "-")) { // "-" is special
                        value2 = "(" + value2 + ")";
                    }
                }
                var operator = CodeGeneratorBasic.fnWs(node) + operators[node.type].toUpperCase();
                if ((/^(and|or|xor|mod)$/).test(node.type)) {
                    value += CodeGeneratorBasic.fnSpace1(operator) + CodeGeneratorBasic.fnSpace1(value2);
                }
                else {
                    value += operator + value2;
                }
            }
            else if (node.right) { // unary operator, e.g. not, '#'
                if (node.len === 0) {
                    value = ""; // ignore dummy token, e.g. '#'
                }
                else {
                    var right = node.right;
                    value = this.parseNode(right);
                    var pr = void 0;
                    if (right.left) { // was binary op?
                        pr = precedence[right.type] || 0; // no special prio
                    }
                    else {
                        pr = precedence["p" + right.type] || precedence[right.type] || 0; // check unary operator first
                    }
                    var p = precedence["p" + node.type] || precedence[node.type] || 0; // check unary operator first
                    if (p && pr && (pr < p)) {
                        value = "(" + value + ")";
                    }
                    value = CodeGeneratorBasic.fnWs(node) + operators[node.type].toUpperCase() + (node.type === "not" ? CodeGeneratorBasic.fnSpace1(value) : value);
                }
            }
            else { // no operator, e.g. "=" in "for"
                value = this.fnParseOther(node);
            }
            return value;
        };
        CodeGeneratorBasic.prototype.parseNode = function (node) {
            var type = node.type;
            if (Utils_1.Utils.debug > 3) {
                Utils_1.Utils.console.debug("evaluate: parseNode node=%o type=" + type + " value=" + node.value + " left=%o right=%o args=%o", node, node.left, node.right, node.args);
            }
            var value;
            if (CodeGeneratorBasic.operators[type]) {
                value = this.parseOperator(node);
            }
            else if (this.parseFunctions[type]) { // function with special handling?
                value = this.parseFunctions[type].call(this, node);
            }
            else { // for other functions, generate code directly
                value = this.fnParseOther(node);
            }
            return value;
        };
        CodeGeneratorBasic.prototype.evaluate = function (parseTree) {
            var output = "";
            for (var i = 0; i < parseTree.length; i += 1) {
                if (Utils_1.Utils.debug > 2) {
                    Utils_1.Utils.console.debug("evaluate: parseTree i=%d, node=%o", i, parseTree[i]);
                }
                var line = this.parseNode(parseTree[i]);
                if ((line !== undefined) && (line !== "")) {
                    if (line !== null) {
                        if (output.length === 0) {
                            output = line;
                        }
                        else {
                            output += line;
                        }
                    }
                    else {
                        output = ""; // cls (clear output when node is set to null)
                    }
                }
            }
            return output;
        };
        CodeGeneratorBasic.prototype.generate = function (input) {
            var out = {
                text: ""
            };
            this.hasColons = Boolean(this.options.parser.getOptions().keepColons);
            this.keepWhiteSpace = Boolean(this.options.lexer.getOptions().keepWhiteSpace);
            this.line = 0;
            try {
                var tokens = this.options.lexer.lex(input), parseTree = this.options.parser.parse(tokens), output = this.evaluate(parseTree);
                out.text = output;
            }
            catch (e) {
                if (Utils_1.Utils.isCustomError(e)) {
                    out.error = e;
                    if (!this.options.quiet) {
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
        CodeGeneratorBasic.combinedKeywords = {
            chainMerge: "CHAIN",
            clearInput: "CLEAR",
            graphicsPaper: "GRAPHICS",
            graphicsPen: "GRAPHICS",
            keyDef: "KEY",
            lineInput: "LINE",
            mid$Assign: "MID$",
            onBreakCont: "ON",
            onBreakGosub: "ON",
            onBreakStop: "ON",
            onErrorGoto: "ON",
            resumeNext: "RESUME",
            speedInk: "SPEED",
            speedKey: "SPEED",
            speedWrite: "SPEED",
            symbolAfter: "SYMBOL",
            windowSwap: "WINDOW" // "WINDOW SWAP"
        };
        CodeGeneratorBasic.operators = {
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
        CodeGeneratorBasic.operatorPrecedence = {
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
});
//# sourceMappingURL=CodeGeneratorBasic.js.map