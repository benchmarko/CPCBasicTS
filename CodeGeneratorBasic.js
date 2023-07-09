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
            this.quiet = false;
            this.hasColons = false;
            this.line = 0; // current line (label)
            /* eslint-disable no-invalid-this */
            this.parseFunctions = {
                "(": this.fnParenthesisOpen,
                string: CodeGeneratorBasic.string,
                ustring: CodeGeneratorBasic.ustring,
                unquoted: CodeGeneratorBasic.unquoted,
                "null": CodeGeneratorBasic.fnNull,
                assign: this.assign,
                number: CodeGeneratorBasic.number,
                expnumber: CodeGeneratorBasic.expnumber,
                binnumber: CodeGeneratorBasic.binHexNumber,
                hexnumber: CodeGeneratorBasic.binHexNumber,
                identifier: this.identifier,
                linenumber: CodeGeneratorBasic.linenumber,
                label: this.label,
                "|": this.vertical,
                afterGosub: this.afterEveryGosub,
                chain: this.chainOrChainMerge,
                chainMerge: this.chainOrChainMerge,
                data: this.data,
                def: this.def,
                "else": this.fnElse,
                ent: this.entOrEnv,
                env: this.entOrEnv,
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
            this.lexer = options.lexer;
            this.parser = options.parser;
            this.setOptions(options);
        }
        CodeGeneratorBasic.prototype.setOptions = function (options) {
            if (options.quiet !== undefined) {
                this.quiet = options.quiet;
            }
        };
        CodeGeneratorBasic.prototype.getLexer = function () {
            return this.lexer;
        };
        CodeGeneratorBasic.prototype.getParser = function () {
            return this.parser;
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
            var type = node.type, typeUc = CodeGeneratorBasic.combinedKeywords[type] || type.toUpperCase();
            return typeUc;
        };
        CodeGeneratorBasic.prototype.fnParseOneArg = function (arg) {
            return this.parseNode(arg);
        };
        CodeGeneratorBasic.prototype.fnParseArgs = function (args) {
            var nodeArgs = []; // do not modify node.args here (could be a parameter of defined function)
            if (!args) {
                throw this.composeError(Error(), "Programming error: Undefined args", "", -1); // should not occur
            }
            for (var i = 0; i < args.length; i += 1) {
                var value = this.fnParseOneArg(args[i]);
                if (args[i].type === "'") { // fast hack to put a space before "'", if there is no space previously
                    if (i > 0 && !nodeArgs[i - 1].endsWith(" ") && !nodeArgs[i - 1].endsWith(":")) {
                        value = CodeGeneratorBasic.fnSpace1(value);
                    }
                }
                nodeArgs.push(value);
            }
            return nodeArgs;
        };
        CodeGeneratorBasic.prototype.combineArgsWithColon = function (args) {
            var separator = this.hasColons ? "" : ":", value = args.join(separator);
            return value;
        };
        CodeGeneratorBasic.prototype.fnParenthesisOpen = function (node) {
            var value = node.value;
            if (node.args) {
                var nodeArgs = this.fnParseArgs(node.args);
                value += nodeArgs.join("");
            }
            return CodeGeneratorBasic.fnWs(node) + value;
        };
        CodeGeneratorBasic.string = function (node) {
            return CodeGeneratorBasic.fnWs(node) + '"' + node.value + '"';
        };
        CodeGeneratorBasic.ustring = function (node) {
            return CodeGeneratorBasic.fnWs(node) + '"' + node.value;
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
                throw this.composeError(Error(), "Programming error: Undefined left or right", node.type, node.pos); // should not occur
            }
            if (node.left.type !== "identifier") {
                throw this.composeError(Error(), "Unexpected assign type", node.type, node.pos); // should not occur
            }
            return this.fnParseOneArg(node.left) + CodeGeneratorBasic.fnWs(node) + node.value + this.fnParseOneArg(node.right);
        };
        CodeGeneratorBasic.number = function (node) {
            return CodeGeneratorBasic.fnWs(node) + node.value;
        };
        CodeGeneratorBasic.expnumber = function (node) {
            return CodeGeneratorBasic.fnWs(node) + Number(node.value).toExponential().toUpperCase().replace(/(\d+)$/, function (x) {
                return x.length >= 2 ? x : x.padStart(2, "0"); // format with 2 exponential digits
            });
        };
        CodeGeneratorBasic.binHexNumber = function (node) {
            return CodeGeneratorBasic.fnWs(node) + node.value.toUpperCase(); // binnumber: maybe "&x", hexnumber: mayby "&h"
        };
        CodeGeneratorBasic.prototype.identifier = function (node) {
            var value = CodeGeneratorBasic.fnWs(node) + node.value; // keep case, maybe mixed
            if (node.args) { // args including brackets or parenthesis
                var nodeArgs = this.fnParseArgs(node.args), bracketOpen = nodeArgs.shift(), bracketClose = nodeArgs.pop();
                value += bracketOpen + nodeArgs.join("") + bracketClose;
            }
            return value;
        };
        CodeGeneratorBasic.linenumber = function (node) {
            return CodeGeneratorBasic.fnWs(node) + node.value;
        };
        CodeGeneratorBasic.prototype.label = function (node) {
            this.line = Number(node.value); // set line before parsing args
            var nodeArgs = this.fnParseArgs(node.args);
            var value = this.combineArgsWithColon(nodeArgs);
            if (node.value !== "") { // direct
                value = node.value + CodeGeneratorBasic.fnSpace1(value);
            }
            return CodeGeneratorBasic.fnWs(node) + value;
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
            var value = node.value.toUpperCase() + nodeArgs.join("");
            return CodeGeneratorBasic.fnWs(node) + value;
        };
        CodeGeneratorBasic.prototype.chainOrChainMerge = function (node) {
            var nodeArgs = this.fnParseArgs(node.args), typeUc = CodeGeneratorBasic.getUcKeyword(node);
            var name = "";
            if (node.right) { // merge?
                name = this.fnParseOneArg(node.right);
            }
            if (nodeArgs.length > 2) { // with delete?
                if (nodeArgs[nodeArgs.length - 2] === "DELETE") {
                    nodeArgs[nodeArgs.length - 1] = CodeGeneratorBasic.fnSpace1(nodeArgs[nodeArgs.length - 1]);
                }
            }
            return CodeGeneratorBasic.fnWs(node) + typeUc + CodeGeneratorBasic.fnSpace1(name) + CodeGeneratorBasic.fnSpace1(nodeArgs.join(""));
        };
        CodeGeneratorBasic.prototype.data = function (node) {
            var nodeArgs = this.fnParseArgs(node.args);
            for (var i = 0; i < nodeArgs.length; i += 1) {
                var value2 = nodeArgs[i];
                nodeArgs[i] = value2;
            }
            var args = nodeArgs.join("");
            args = Utils_1.Utils.stringTrimEnd(args); // remove trailing spaces
            return CodeGeneratorBasic.fnWs(node) + node.type.toUpperCase() + CodeGeneratorBasic.fnSpace1(args);
        };
        CodeGeneratorBasic.prototype.def = function (node) {
            if (!node.right) {
                return CodeGeneratorBasic.fnWs(node) + node.type.toUpperCase(); // maybe key def
            }
            var right = this.fnParseOneArg(node.right), nodeArgs = this.fnParseArgs(node.args); // including expression
            return CodeGeneratorBasic.fnWs(node) + node.type.toUpperCase() + CodeGeneratorBasic.fnSpace1(right) + nodeArgs.join("");
        };
        CodeGeneratorBasic.prototype.fnElse = function (node) {
            if (!node.args) {
                throw this.composeError(Error(), "Programming error: Undefined args", "", -1); // should not occur
            }
            var args = node.args;
            var value = "";
            for (var i = 0; i < args.length; i += 1) {
                var token = args[i];
                if (token.value) {
                    value += " " + token.value;
                }
            }
            return CodeGeneratorBasic.fnWs(node) + node.type.toUpperCase() + value;
        };
        CodeGeneratorBasic.prototype.entOrEnv = function (node) {
            if (!node.args) {
                throw this.composeError(Error(), "Programming error: Undefined args", "", -1); // should not occur
            }
            var args = node.args, nodeArgs = [];
            var equal = false;
            for (var i = 0; i < args.length; i += 1) {
                if (args[i].type !== "null") {
                    var arg = this.fnParseOneArg(args[i]);
                    if (equal) {
                        equal = false;
                    }
                    nodeArgs.push(arg);
                }
                else {
                    equal = true;
                }
            }
            return CodeGeneratorBasic.fnWs(node) + node.type.toUpperCase() + CodeGeneratorBasic.fnSpace1(nodeArgs.join(""));
        };
        CodeGeneratorBasic.prototype.fn = function (node) {
            if (!node.right) {
                return CodeGeneratorBasic.fnWs(node) + node.type.toUpperCase(); // only fn
            }
            var right = this.fnParseOneArg(node.right);
            var nodeArgs = node.args ? this.fnParseArgs(node.args) : [];
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
        CodeGeneratorBasic.prototype.fnThenOrElsePart = function (nodeBranch) {
            var nodeArgs = this.fnParseArgs(nodeBranch), partName = nodeArgs.shift(); // "then" or "else"
            return CodeGeneratorBasic.fnSpace1(partName) + CodeGeneratorBasic.fnSpace1(this.combineArgsWithColon(nodeArgs));
        };
        CodeGeneratorBasic.prototype.fnIf = function (node) {
            if (!node.left) {
                throw this.composeError(Error(), "Programming error: Undefined left", node.type, node.pos); // should not occur
            }
            if (!node.args) {
                throw this.composeError(Error(), "Programming error: Undefined args", node.type, node.pos); // should not occur
            }
            var value = CodeGeneratorBasic.fnSpace1(this.fnParseOneArg(node.left));
            if (node.args.length) {
                value += this.fnThenOrElsePart(node.args); // "then" part
            }
            if (node.args2) {
                value += this.fnThenOrElsePart(node.args2); // "else" part
            }
            return CodeGeneratorBasic.fnWs(node) + node.type.toUpperCase() + value;
        };
        CodeGeneratorBasic.prototype.inputLineInput = function (node) {
            var nodeArgs = node.args ? this.fnParseArgs(node.args) : [], // also for clear input, which has no args
            typeUc = CodeGeneratorBasic.getUcKeyword(node);
            var name = "";
            if (node.right) { // input?
                name = this.fnParseOneArg(node.right);
            }
            return CodeGeneratorBasic.fnWs(node) + typeUc + CodeGeneratorBasic.fnSpace1(name) + CodeGeneratorBasic.fnSpace1(nodeArgs.join(""));
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
            var nodeArgs = this.fnParseArgs(node.args), typeUc = CodeGeneratorBasic.getUcKeyword(node);
            return CodeGeneratorBasic.fnWs(node) + typeUc + nodeArgs.join("");
        };
        CodeGeneratorBasic.prototype.onBreakOrError = function (node) {
            var nodeArgs = this.fnParseArgs(node.args), right = this.fnParseOneArg(node.right);
            return CodeGeneratorBasic.fnWs(node) + "ON" + CodeGeneratorBasic.fnSpace1(right) + CodeGeneratorBasic.fnSpace1(nodeArgs.join(""));
        };
        CodeGeneratorBasic.prototype.onGotoGosub = function (node) {
            var nodeArgs = this.fnParseArgs(node.args), expression = nodeArgs.shift(), instruction = nodeArgs.shift(); // "goto" or "gosub"
            return CodeGeneratorBasic.fnWs(node) + "ON" + CodeGeneratorBasic.fnSpace1(expression) + CodeGeneratorBasic.fnSpace1(instruction) + CodeGeneratorBasic.fnSpace1(nodeArgs.join(""));
        };
        CodeGeneratorBasic.prototype.onSqGosub = function (node) {
            var nodeArgs = this.fnParseArgs(node.args), right = this.fnParseOneArg(node.right);
            nodeArgs[nodeArgs.length - 2] = CodeGeneratorBasic.fnSpace1(nodeArgs[nodeArgs.length - 2]); // "gosub" with space (optional)
            nodeArgs[nodeArgs.length - 1] = CodeGeneratorBasic.fnSpace1(nodeArgs[nodeArgs.length - 1]); // line number with space
            return CodeGeneratorBasic.fnWs(node) + "ON" + CodeGeneratorBasic.fnSpace1(right) + nodeArgs.join("");
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
            /*
            const nodeArgs = this.fnParseArgs(node.args);
            let value = nodeArgs.length ? nodeArgs[0] : "";
    
            if (node.value !== "'" && value.length) { // for "rem": add removed space
                value = " " + value; // add removed space
            }
            */
            return CodeGeneratorBasic.fnWs(node) + node.type.toUpperCase() + CodeGeneratorBasic.fnSpace1(this.fnParseArgs(node.args).join(""));
        };
        CodeGeneratorBasic.prototype.using = function (node) {
            var nodeArgs = this.fnParseArgs(node.args), template = nodeArgs.length ? nodeArgs.shift() || "" : "";
            return CodeGeneratorBasic.fnWs(node) + node.type.toUpperCase() + CodeGeneratorBasic.fnSpace1(template) + nodeArgs.join("");
        };
        CodeGeneratorBasic.prototype.write = function (node) {
            if (!node.args) { // e.g. speed write
                return CodeGeneratorBasic.fnWs(node) + node.type.toUpperCase();
            }
            var nodeArgs = this.fnParseArgs(node.args);
            return CodeGeneratorBasic.fnWs(node) + node.type.toUpperCase() + CodeGeneratorBasic.fnSpace1(nodeArgs.join("")); // separators already there
        };
        /* eslint-enable no-invalid-this */
        CodeGeneratorBasic.prototype.fnParseOther = function (node) {
            var type = node.type, typeUc = CodeGeneratorBasic.getUcKeyword(node), keyType = BasicParser_1.BasicParser.keywords[type];
            var args = "";
            if (node.left) {
                args += this.fnParseOneArg(node.left);
            }
            if (!keyType) {
                if (node.value) { // e.g. string,...
                    args += node.value;
                }
            }
            var right = "";
            if (node.right) {
                right = this.fnParseOneArg(node.right);
                args += right;
            }
            if (node.args) {
                var nodeArgs = this.fnParseArgs(node.args);
                if (BasicParser_1.BasicParser.keywords[right.toLowerCase()]) { // for combined keywords
                    // special handling for 2 tokens (for 3 tokens, we need a specific function)
                    args += CodeGeneratorBasic.fnSpace1(nodeArgs.join(""));
                }
                else {
                    args += nodeArgs.join("");
                }
            }
            if (node.args2) { // ELSE part already handled
                throw this.composeError(Error(), "Programming error: args2", node.type, node.pos); // should not occur
            }
            var value;
            if (keyType) {
                value = typeUc;
                if (args.length) {
                    if (keyType.charAt(0) === "f" || node.type === "'") { // function with parameters or apostrophe comment?
                        value += args;
                    }
                    else {
                        value += CodeGeneratorBasic.fnSpace1(args);
                    }
                }
            }
            else {
                value = args; // for e.g. string
            }
            return CodeGeneratorBasic.fnWs(node) + value;
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
                    var operator = CodeGeneratorBasic.fnWs(node) + operators[node.type].toUpperCase();
                    if (node.type === "not") {
                        value = operator + CodeGeneratorBasic.fnSpace1(value);
                    }
                    else {
                        value = operator + value;
                    }
                }
            }
            else { // no operator, e.g. "=" in "for"
                value = this.fnParseOther(node);
            }
            return value;
        };
        CodeGeneratorBasic.prototype.parseNode = function (node) {
            if (Utils_1.Utils.debug > 3) {
                Utils_1.Utils.console.debug("evaluate: parseNode node=%o type=" + node.type + " value=" + node.value + " left=%o right=%o args=%o", node, node.left, node.right, node.args);
            }
            var type = node.type;
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
            this.hasColons = Boolean(this.parser.getOptions().keepColons);
            this.line = 0;
            try {
                var tokens = this.lexer.lex(input), parseTree = this.parser.parse(tokens), output = this.evaluate(parseTree);
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