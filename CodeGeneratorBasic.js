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
            this.line = 0; // current line (label)
            /* eslint-disable no-invalid-this */
            this.parseFunctions = {
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
                ent: this.entOrEnv,
                env: this.entOrEnv,
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
            this.quiet = options.quiet || false;
            this.lexer = options.lexer;
            this.parser = options.parser;
        }
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
            var type = node.type;
            var typeUc = CodeGeneratorBasic.combinedKeywords[type] || type.toUpperCase();
            if (typeUc !== node.value.toUpperCase()) { // some (extra) whitespace between combined keyword?
                typeUc = node.value.toUpperCase(); // we could always take this
            }
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
                if (!(i === 0 && value === "#" && args[i].type === "#")) { // ignore empty stream as first argument (hmm, not for e.g. data!)
                    nodeArgs.push(value);
                }
            }
            return nodeArgs;
        };
        CodeGeneratorBasic.fnColonsAvailable = function (args) {
            var colonsAvailable = false;
            for (var i = 0; i < args.length; i += 1) {
                if (args[i].trim() === ":") {
                    colonsAvailable = true;
                    break;
                }
            }
            return colonsAvailable;
        };
        CodeGeneratorBasic.combineArgsWithColon = function (args) {
            var separator = CodeGeneratorBasic.fnColonsAvailable(args) ? "" : ":", value = args.join(separator);
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
                throw this.composeError(Error(), "Unexpected assing type", node.type, node.pos); // should not occur
            }
            return this.fnParseOneArg(node.left) + CodeGeneratorBasic.fnWs(node) + node.value + this.fnParseOneArg(node.right);
        };
        CodeGeneratorBasic.decBinHexNumber = function (node) {
            return CodeGeneratorBasic.fnWs(node) + node.value.toUpperCase(); // number: maybe "e" inside; binnumber: maybe "&x"
        };
        CodeGeneratorBasic.prototype.identifier = function (node) {
            var value = CodeGeneratorBasic.fnWs(node) + node.value; // keep case, maybe mixed
            if (node.args) { // args including brackets
                var nodeArgs = this.fnParseArgs(node.args), bracketOpen = nodeArgs.shift(), bracketClose = nodeArgs.pop();
                value += bracketOpen + nodeArgs.join(",") + bracketClose;
            }
            return value;
        };
        CodeGeneratorBasic.linenumber = function (node) {
            return CodeGeneratorBasic.fnWs(node) + node.value;
        };
        CodeGeneratorBasic.prototype.label = function (node) {
            this.line = Number(node.value); // set line before parsing args
            var nodeArgs = this.fnParseArgs(node.args);
            var value = CodeGeneratorBasic.combineArgsWithColon(nodeArgs);
            if (node.value !== "direct") {
                value = node.value + CodeGeneratorBasic.fnSpace1(value);
            }
            return CodeGeneratorBasic.fnWs(node) + value;
        };
        // special keyword functions
        CodeGeneratorBasic.prototype.vertical = function (node) {
            var nodeArgs = this.fnParseArgs(node.args);
            var value = node.value.toUpperCase(); // use value!
            if (nodeArgs.length) {
                value += "," + nodeArgs.join(",");
            }
            return CodeGeneratorBasic.fnWs(node) + value;
        };
        CodeGeneratorBasic.prototype.afterEveryGosub = function (node) {
            var nodeArgs = this.fnParseArgs(node.args);
            var value = node.value.toUpperCase() + CodeGeneratorBasic.fnSpace1(nodeArgs[0]);
            if (nodeArgs[1]) {
                value += "," + nodeArgs[1];
            }
            value += " GOSUB" + CodeGeneratorBasic.fnSpace1(nodeArgs[2]);
            return CodeGeneratorBasic.fnWs(node) + value;
        };
        CodeGeneratorBasic.prototype.chainMerge = function (node) {
            var nodeArgs = this.fnParseArgs(node.args), typeUc = CodeGeneratorBasic.getUcKeyword(node);
            if (nodeArgs.length === 3) {
                nodeArgs[2] = "DELETE" + CodeGeneratorBasic.fnSpace1(nodeArgs[2]);
            }
            return CodeGeneratorBasic.fnWs(node) + typeUc + CodeGeneratorBasic.fnSpace1(nodeArgs.join(","));
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
            if (!node.left || !node.right) {
                throw this.composeError(Error(), "Programming error: Undefined left or right", node.type, node.pos); // should not occur
            }
            var name = this.fnParseOneArg(node.left), space = node.left.space ? " " : "", // fast hack
            nodeArgs = this.fnParseArgs(node.args), expression = this.fnParseOneArg(node.right);
            var nodeArgsString = nodeArgs.join(",");
            if (nodeArgsString !== "") { // not empty?
                nodeArgsString = "(" + nodeArgsString + ")";
            }
            var name2 = name.replace(/FN/i, "FN" + space);
            return CodeGeneratorBasic.fnWs(node) + node.type.toUpperCase() + CodeGeneratorBasic.fnSpace1(name2) + nodeArgsString + "=" + expression; //TTT how to get space before "="?
        };
        CodeGeneratorBasic.prototype["else"] = function (node) {
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
            // TODO: whitespaces?
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
                        arg = "=" + arg;
                        equal = false;
                    }
                    nodeArgs.push(arg);
                }
                else {
                    equal = true;
                }
            }
            return CodeGeneratorBasic.fnWs(node) + node.type.toUpperCase() + CodeGeneratorBasic.fnSpace1(nodeArgs.join(","));
        };
        CodeGeneratorBasic.prototype.fn = function (node) {
            if (!node.left) {
                throw this.composeError(Error(), "Programming error: Undefined left", node.type, node.pos); // should not occur
            }
            var nodeArgs = this.fnParseArgs(node.args);
            var nodeArgsString = nodeArgs.join(",");
            if (nodeArgsString !== "") { // not empty?
                nodeArgsString = "(" + nodeArgsString + ")";
            }
            var name2 = node.value.replace(/FN/i, "FN"); // + space),
            return CodeGeneratorBasic.fnWs(node) + name2 + nodeArgsString;
        };
        CodeGeneratorBasic.prototype["for"] = function (node) {
            var nodeArgs = this.fnParseArgs(node.args);
            for (var i = 0; i < nodeArgs.length; i += 1) {
                if (i !== 1 && i !== 2) { // not for "=" and startValue
                    nodeArgs[i] = CodeGeneratorBasic.fnSpace1(nodeArgs[i]); // set minimal spaces in case we do not keep whitespace
                }
            }
            return CodeGeneratorBasic.fnWs(node) + node.type.toUpperCase() + nodeArgs.join("");
        };
        CodeGeneratorBasic.prototype.fnThenOrElsePart = function (nodeBranch) {
            var nodeArgs = this.fnParseArgs(nodeBranch); // args for "then" or "else"
            return CodeGeneratorBasic.fnSpace1(CodeGeneratorBasic.combineArgsWithColon(nodeArgs));
        };
        CodeGeneratorBasic.prototype["if"] = function (node) {
            if (!node.left) {
                throw this.composeError(Error(), "Programming error: Undefined left", node.type, node.pos); // should not occur
            }
            if (!node.args) {
                throw this.composeError(Error(), "Programming error: Undefined args", node.type, node.pos); // should not occur
            }
            var value = node.type.toUpperCase() + CodeGeneratorBasic.fnSpace1(this.fnParseOneArg(node.left));
            if (node.right) { // "THEN"
                value += CodeGeneratorBasic.fnSpace1(this.fnParseOneArg(node.right));
            }
            value += this.fnThenOrElsePart(node.args); // "then" part
            if (node.args2) {
                value += " ELSE" + this.fnThenOrElsePart(node.args2); // "else" part
            }
            return CodeGeneratorBasic.fnWs(node) + value;
        };
        CodeGeneratorBasic.fnHasStream = function (node) {
            return node.args && node.args.length && (node.args[0].type === "#") && node.args[0].right && (node.args[0].right.type !== "null");
        };
        CodeGeneratorBasic.prototype.inputLineInput = function (node) {
            var nodeArgs = this.fnParseArgs(node.args), typeUc = CodeGeneratorBasic.getUcKeyword(node), hasStream = CodeGeneratorBasic.fnHasStream(node);
            var i = 0;
            if (hasStream) { // stream?
                i += 1;
            }
            nodeArgs.splice(i, 4, nodeArgs[i] + nodeArgs[i + 1] + nodeArgs[i + 2] + nodeArgs[i + 3]); // combine 4 elements into one
            return CodeGeneratorBasic.fnWs(node) + typeUc + CodeGeneratorBasic.fnSpace1(nodeArgs.join(","));
        };
        CodeGeneratorBasic.prototype.list = function (node) {
            var nodeArgs = this.fnParseArgs(node.args);
            if (nodeArgs.length && nodeArgs[0] === "") { // empty range?
                nodeArgs.shift(); // remove
            }
            if (nodeArgs.length && nodeArgs[nodeArgs.length - 1] === "#") { // dummy stream?
                nodeArgs.pop(); // remove
            }
            return CodeGeneratorBasic.fnWs(node) + node.type.toUpperCase() + CodeGeneratorBasic.fnSpace1(nodeArgs.join(","));
        };
        CodeGeneratorBasic.prototype.mid$Assign = function (node) {
            if (!node.right) {
                throw this.composeError(Error(), "Programming error: Undefined right", "", -1); // should not occur
            }
            var nodeArgs = this.fnParseArgs(node.args), typeUc = CodeGeneratorBasic.getUcKeyword(node);
            return CodeGeneratorBasic.fnWs(node) + typeUc + "(" + nodeArgs.join(",") + ")=" + this.fnParseOneArg(node.right);
        };
        CodeGeneratorBasic.prototype.onGotoGosub = function (node) {
            var left = this.fnParseOneArg(node.left), nodeArgs = this.fnParseArgs(node.args), right = this.fnParseOneArg(node.right); // "goto" or "gosub"
            return CodeGeneratorBasic.fnWs(node) + "ON" + CodeGeneratorBasic.fnSpace1(left) + CodeGeneratorBasic.fnSpace1(right) + CodeGeneratorBasic.fnSpace1(nodeArgs.join(","));
        };
        CodeGeneratorBasic.prototype.onSqGosub = function (node) {
            var left = this.fnParseOneArg(node.left), nodeArgs = this.fnParseArgs(node.args);
            return CodeGeneratorBasic.fnWs(node) + "ON SQ(" + left + ") GOSUB" + CodeGeneratorBasic.fnSpace1(nodeArgs.join(","));
        };
        CodeGeneratorBasic.prototype.print = function (node) {
            var nodeArgs = this.fnParseArgs(node.args), hasStream = CodeGeneratorBasic.fnHasStream(node);
            var value = "";
            if (hasStream && nodeArgs.length > 1) { // more args after stream?
                nodeArgs[0] = String(nodeArgs[0]) + ",";
            }
            for (var i = 0; i < nodeArgs.length; i += 1) {
                value += nodeArgs[i];
            }
            if (node.value !== "?") { // for "print"
                value = CodeGeneratorBasic.fnSpace1(value);
            }
            return CodeGeneratorBasic.fnWs(node) + node.value.toUpperCase() + value; // we use value to get PRINT or ?
        };
        CodeGeneratorBasic.prototype.rem = function (node) {
            var nodeArgs = this.fnParseArgs(node.args);
            var value = nodeArgs.length ? nodeArgs[0] : "";
            if (node.value !== "'" && value !== "") { // for "rem"
                var arg0 = node.args && node.args[0];
                if (arg0 && !arg0.ws) {
                    value = " " + value; // add removed space
                }
            }
            return CodeGeneratorBasic.fnWs(node) + node.value.toUpperCase() + value; // we use value to get rem or '
        };
        CodeGeneratorBasic.prototype.using = function (node) {
            var nodeArgs = this.fnParseArgs(node.args), template = nodeArgs.length ? nodeArgs.shift() || "" : "";
            return CodeGeneratorBasic.fnWs(node) + node.type.toUpperCase() + CodeGeneratorBasic.fnSpace1(template) + ";" + nodeArgs.join(","); // separator between args could be "," or ";", we use ","
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
            if (node.right) {
                args += this.fnParseOneArg(node.right);
            }
            if (node.args) {
                args += this.fnParseArgs(node.args).join(",");
            }
            if (node.args2) { // ELSE part already handled
                throw this.composeError(Error(), "Programming error: args2", node.type, node.pos); // should not occur
            }
            var value;
            if (keyType) {
                value = typeUc;
                if (args.length) {
                    if (keyType.charAt(0) === "f") { // function with parameters?
                        value += "(" + args + ")";
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
        CodeGeneratorBasic.prototype.parseNode = function (node) {
            if (Utils_1.Utils.debug > 3) {
                Utils_1.Utils.console.debug("evaluate: parseNode node=%o type=" + node.type + " value=" + node.value + " left=%o right=%o args=%o", node, node.left, node.right, node.args);
            }
            var type = node.type, precedence = CodeGeneratorBasic.operatorPrecedence, operators = CodeGeneratorBasic.operators;
            var value;
            if (operators[type]) {
                if (node.left) {
                    value = this.parseNode(node.left);
                    if (operators[node.left.type] && (node.left.left || node.left.right)) { // binary operator (or unary operator, e.g. not)
                        var p = precedence[node.type];
                        var pl = void 0;
                        if (node.left.left) { // left is binary
                            pl = precedence[node.left.type] || 0;
                        }
                        else { // left is unary
                            pl = precedence["p" + node.left.type] || precedence[node.left.type] || 0;
                        }
                        if (pl < p) {
                            value = "(" + value + ")";
                        }
                    }
                    var right = node.right;
                    var value2 = this.parseNode(right);
                    if (operators[right.type] && (right.left || right.right)) { // binary operator (or unary operator, e.g. not)
                        var p = precedence[node.type];
                        var pr = void 0;
                        if (right.left) { // right is binary
                            pr = precedence[right.type] || 0;
                        }
                        else {
                            pr = precedence["p" + right.type] || precedence[right.type] || 0;
                        }
                        if ((pr < p) || ((pr === p) && node.type === "-")) { // "-" is special
                            value2 = "(" + value2 + ")";
                        }
                    }
                    var whiteBefore = CodeGeneratorBasic.fnWs(node);
                    var operator = whiteBefore + operators[type].toUpperCase();
                    if (whiteBefore === "" && (/^(and|or|xor|mod)$/).test(type)) {
                        operator = " " + operator + " ";
                    }
                    value += operator + value2;
                }
                else if (node.right) { // unary operator, e.g. not
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
                    var whiteBefore = CodeGeneratorBasic.fnWs(node), operator = whiteBefore + operators[type].toUpperCase(), whiteAfter = value.startsWith(" ");
                    if (!whiteAfter && type === "not") {
                        value = " " + value;
                    }
                    value = operator + value;
                }
                else { // no operator, e.g. "=" in "for"
                    value = this.fnParseOther(node);
                }
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
                            output += "\n" + line;
                        }
                    }
                    else {
                        output = ""; // cls (clear output when node is set to null)
                    }
                }
            }
            return output;
        };
        CodeGeneratorBasic.prototype.generate = function (input, allowDirect) {
            var out = {
                text: ""
            };
            this.line = 0;
            try {
                var tokens = this.lexer.lex(input), parseTree = this.parser.parse(tokens, allowDirect), output = this.evaluate(parseTree);
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