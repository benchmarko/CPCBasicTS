// CodeGeneratorToken.ts - Code Generator for BASIC (for testing, pretty print?)
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//
//
define(["require", "exports", "./Utils", "./BasicParser"], function (require, exports, Utils_1, BasicParser_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CodeGeneratorToken = void 0;
    var CodeGeneratorToken = /** @class */ (function () {
        function CodeGeneratorToken(options) {
            this.implicitLines = false;
            this.quiet = false;
            this.label = ""; // current line (label)
            /* eslint-disable no-invalid-this */
            this.parseFunctions = {
                args: this.fnArgs,
                "(": this.fnParenthesisOpen,
                ";": CodeGeneratorToken.semicolon,
                ":": this.colon,
                letter: CodeGeneratorToken.letter,
                range: this.range,
                linerange: this.linerange,
                string: CodeGeneratorToken.string,
                unquoted: CodeGeneratorToken.unquoted,
                "null": CodeGeneratorToken.fnNull,
                assign: this.assign,
                number: CodeGeneratorToken.number,
                expnumber: CodeGeneratorToken.number,
                binnumber: CodeGeneratorToken.binnumber,
                hexnumber: CodeGeneratorToken.hexnumber,
                identifier: this.identifier,
                linenumber: CodeGeneratorToken.linenumber,
                label: this.fnLabel,
                "|": this.vertical,
                data: this.data,
                def: this.def,
                "else": this.fnElse,
                fn: this.fn,
                "if": this.fnIf,
                mid$Assign: this.mid$Assign,
                onBreakCont: this.onBreakContOrGosubOrStop,
                onBreakGosub: this.onBreakContOrGosubOrStop,
                onBreakStop: this.onBreakContOrGosubOrStop,
                onErrorGoto: this.onErrorGoto,
                onSqGosub: this.onSqGosub,
                rem: this.rem
            };
            this.lexer = options.lexer;
            this.parser = options.parser;
            this.setOptions(options);
            this.statementSeparator = CodeGeneratorToken.token2String(":");
        }
        CodeGeneratorToken.prototype.setOptions = function (options) {
            if (options.implicitLines !== undefined) {
                this.implicitLines = options.implicitLines;
            }
            if (options.quiet !== undefined) {
                this.quiet = options.quiet;
            }
        };
        CodeGeneratorToken.prototype.composeError = function (error, message, value, pos) {
            return Utils_1.Utils.composeError("CodeGeneratorToken", error, message, value, pos, undefined, this.label);
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
        CodeGeneratorToken.token2String = function (name) {
            var token = CodeGeneratorToken.tokens[name], result = "";
            if (token === undefined) {
                token = CodeGeneratorToken.tokensFF[name];
                if (token === undefined) {
                    Utils_1.Utils.console.error("token2String: Not a token: " + name);
                    return name; // return something
                }
                result = CodeGeneratorToken.convUInt8ToString(0xff); // prefix for special tokens
            }
            result += (token <= 255) ? CodeGeneratorToken.convUInt8ToString(token) : CodeGeneratorToken.convUInt16ToString(token);
            return result;
        };
        CodeGeneratorToken.getBit7TerminatedString = function (s) {
            return s.substring(0, s.length - 1) + String.fromCharCode(s.charCodeAt(s.length - 1) | 0x80); // eslint-disable-line no-bitwise
        };
        CodeGeneratorToken.fnGetWs = function (node) {
            return node.ws || "";
        };
        CodeGeneratorToken.prototype.fnParseOneArg = function (arg) {
            var value = this.parseNode(arg);
            return value;
        };
        CodeGeneratorToken.prototype.fnParseArgs = function (args) {
            var nodeArgs = []; // do not modify node.args here (could be a parameter of defined function)
            if (!args) {
                throw this.composeError(Error(), "Programming error: Undefined args", "", -1); // should not occur
            }
            for (var i = 0; i < args.length; i += 1) {
                var value = this.fnParseOneArg(args[i]);
                nodeArgs.push(value);
            }
            return nodeArgs;
        };
        CodeGeneratorToken.prototype.fnArgs = function (node) {
            var nodeArgs = this.fnParseArgs(node.args);
            return nodeArgs.join(node.value);
        };
        CodeGeneratorToken.semicolon = function (node) {
            return CodeGeneratorToken.fnGetWs(node) + node.value; // ";"
        };
        CodeGeneratorToken.prototype.colon = function (node) {
            return CodeGeneratorToken.fnGetWs(node) + this.statementSeparator; // not ASCII ':'
        };
        CodeGeneratorToken.letter = function (node) {
            return CodeGeneratorToken.fnGetWs(node) + node.value;
        };
        CodeGeneratorToken.prototype.range = function (node) {
            if (!node.left || !node.right) {
                throw this.composeError(Error(), "Programming error: Undefined left or right", node.type, node.pos); // should not occur
            }
            var left = this.fnParseOneArg(node.left), right = this.fnParseOneArg(node.right);
            return left + CodeGeneratorToken.fnGetWs(node) + node.value + right;
        };
        CodeGeneratorToken.prototype.linerange = function (node) {
            if (!node.left || !node.right) {
                throw this.composeError(Error(), "Programming error: Undefined left or right", node.type, node.pos); // should not occur
            }
            var left = this.fnParseOneArg(node.left), right = this.fnParseOneArg(node.right);
            return left + CodeGeneratorToken.fnGetWs(node) + CodeGeneratorToken.token2String(node.value) + right;
        };
        CodeGeneratorToken.prototype.fnParenthesisOpen = function (node) {
            var value = CodeGeneratorToken.fnGetWs(node) + node.value;
            if (node.args) {
                var nodeArgs = this.fnParseArgs(node.args);
                value += nodeArgs.join("");
            }
            return value;
        };
        CodeGeneratorToken.string = function (node) {
            return CodeGeneratorToken.fnGetWs(node) + '"' + node.value + '"'; // TODO: how to set unterminated string?
        };
        CodeGeneratorToken.unquoted = function (node) {
            return CodeGeneratorToken.fnGetWs(node) + node.value;
        };
        CodeGeneratorToken.fnNull = function () {
            return "";
        };
        CodeGeneratorToken.prototype.assign = function (node) {
            // see also "let"
            if (!node.left || !node.right) {
                throw this.composeError(Error(), "Programming error: Undefined left or right", node.type, node.pos); // should not occur
            }
            if (node.left.type !== "identifier") {
                throw this.composeError(Error(), "Unexpected assign type", node.type, node.pos); // should not occur
            }
            return this.fnParseOneArg(node.left) + CodeGeneratorToken.fnGetWs(node) + CodeGeneratorToken.token2String(node.value) + this.fnParseOneArg(node.right);
        };
        CodeGeneratorToken.floatToByteString = function (number) {
            var mantissa = 0, exponent = 0, sign = 0;
            if (number !== 0) {
                if (number < 0) {
                    sign = 0x80000000;
                    number = -number;
                }
                exponent = Math.ceil(Math.log(number) / Math.log(2));
                mantissa = Math.round(number / Math.pow(2, exponent - 32)) & ~0x80000000; // eslint-disable-line no-bitwise
                if (mantissa === 0) {
                    exponent += 1;
                }
                exponent += 0x80;
            }
            return CodeGeneratorToken.convInt32ToString(sign + mantissa) + CodeGeneratorToken.convUInt8ToString(exponent);
        };
        CodeGeneratorToken.number = function (node) {
            var numberString = node.value.toUpperCase(), // maybe "e" inside
            number = Number(numberString);
            var result = "";
            if (number === Math.floor(number)) { // integer?
                if (number >= 0 && number <= 9) { // integer number constant 0-9? (not sure when 10 is used)
                    result = CodeGeneratorToken.token2String(numberString);
                }
                else if (number >= 10 && number <= 0xff) {
                    result = CodeGeneratorToken.token2String("_dec8") + CodeGeneratorToken.convUInt8ToString(number);
                }
                else if (number >= -0x7fff && number <= 0x7fff) {
                    result = (number < 0 ? CodeGeneratorToken.token2String("-") : "") + CodeGeneratorToken.token2String("_dec16") + CodeGeneratorToken.convUInt16ToString(number);
                }
            }
            if (result === "") { // no integer number yet, use float...
                result = CodeGeneratorToken.token2String("_float") + CodeGeneratorToken.floatToByteString(number);
            }
            return CodeGeneratorToken.fnGetWs(node) + result;
        };
        CodeGeneratorToken.binnumber = function (node) {
            var valueString = node.value.slice(2), // remove &x
            value = (valueString.length) ? parseInt(valueString, 2) : 0; // we convert it to dec
            return CodeGeneratorToken.fnGetWs(node) + CodeGeneratorToken.token2String("_bin16") + CodeGeneratorToken.convUInt16ToString(value);
        };
        CodeGeneratorToken.hexnumber = function (node) {
            var valueString = node.value.slice(1); // remove &
            if (valueString.charAt(0).toLowerCase() === "h") { // optional h
                valueString = valueString.slice(1); // remove
            }
            var value = (valueString.length) ? parseInt(valueString, 16) : 0; // we convert it to dec
            return CodeGeneratorToken.fnGetWs(node) + CodeGeneratorToken.token2String("_hex16") + CodeGeneratorToken.convUInt16ToString(value);
        };
        CodeGeneratorToken.prototype.identifier = function (node) {
            var name = node.value, // keep case, maybe mixed
            result;
            if (name.endsWith("!")) { // real number?
                name = name.slice(0, -1);
                result = CodeGeneratorToken.token2String("_floatVar");
            }
            else if (name.endsWith("%")) { // integer number?
                name = name.slice(0, -1);
                result = CodeGeneratorToken.token2String("_intVar");
            }
            else if (name.endsWith("$")) { // string?
                name = name.slice(0, -1);
                result = CodeGeneratorToken.token2String("_stringVar");
            }
            else {
                result = CodeGeneratorToken.token2String("_anyVar");
            }
            name = CodeGeneratorToken.getBit7TerminatedString(name);
            if (node.args) { // args including brackets
                var nodeArgs = this.fnParseArgs(node.args), bracketOpen = nodeArgs.shift(), bracketClose = nodeArgs.pop();
                name += bracketOpen + nodeArgs.join("") + bracketClose;
            }
            var offset = 0; // (offset to memory location of variable; not used here)
            return CodeGeneratorToken.fnGetWs(node) + result + CodeGeneratorToken.convUInt16ToString(offset) + name;
        };
        CodeGeneratorToken.linenumber = function (node) {
            var number = Number(node.value);
            return CodeGeneratorToken.fnGetWs(node) + CodeGeneratorToken.token2String("_line16") + CodeGeneratorToken.convUInt16ToString(number);
        };
        CodeGeneratorToken.prototype.fnLabel = function (node) {
            if (this.implicitLines) {
                if (node.value === "") { // direct
                    node.value = String(Number(this.label) + 1);
                }
            }
            this.label = node.value; // set line before parsing args
            var line = Number(this.label), nodeArgs = this.fnParseArgs(node.args);
            var value = nodeArgs.join("");
            if (node.value !== "") { // direct
                if (value.charAt(0) === " ") { // remove one space (implicit space after label)
                    value = value.substring(1);
                }
                value = CodeGeneratorToken.convUInt16ToString(line) + value + CodeGeneratorToken.token2String("_eol"); // no ws
                var len = value.length + 2;
                value = CodeGeneratorToken.convUInt16ToString(len) + value;
            }
            return value;
        };
        // special keyword functions
        CodeGeneratorToken.prototype.vertical = function (node) {
            var rsxName = node.value.substring(1).toUpperCase(), nodeArgs = this.fnParseArgs(node.args), offset = 0; // (offset to tokens following RSX name) TODO
            var value = CodeGeneratorToken.fnGetWs(node) + CodeGeneratorToken.token2String(node.type) + CodeGeneratorToken.convUInt8ToString(offset) + CodeGeneratorToken.getBit7TerminatedString(rsxName);
            if (nodeArgs.length) {
                value += "," + nodeArgs.join("");
            }
            return value;
        };
        CodeGeneratorToken.prototype.data = function (node) {
            var nodeArgs = this.fnParseArgs(node.args);
            for (var i = 0; i < nodeArgs.length; i += 1) {
                var value2 = nodeArgs[i];
                nodeArgs[i] = value2;
            }
            var value = nodeArgs.join("");
            value = CodeGeneratorToken.fnGetWs(node) + CodeGeneratorToken.token2String(node.type) + value;
            return value;
        };
        CodeGeneratorToken.prototype.def = function (node) {
            if (!node.left || !node.right) {
                return CodeGeneratorToken.fnGetWs(node) + CodeGeneratorToken.token2String(node.type); // only def (for key def)
            }
            var fnNode = this.fnParseOneArg(node.left), nodeArgs = this.fnParseArgs(node.args), expression = this.fnParseOneArg(node.right);
            return CodeGeneratorToken.fnGetWs(node) + CodeGeneratorToken.token2String(node.type) + fnNode + nodeArgs.join("") + expression;
        };
        CodeGeneratorToken.prototype.fnElse = function (node) {
            if (!node.args) {
                throw this.composeError(Error(), "Programming error: Undefined args", "", -1); // should not occur
            }
            var value = CodeGeneratorToken.fnGetWs(node) + CodeGeneratorToken.token2String(":") + CodeGeneratorToken.token2String(node.type); // always prefix with ":"
            var args = node.args;
            // we do not have a parse tree here but a simple list
            for (var i = 0; i < args.length; i += 1) {
                var token = args[i];
                var value2 = token.value;
                if (value2) {
                    if (token.type === "linenumber") {
                        value2 = CodeGeneratorToken.linenumber(token);
                    }
                    value += value2;
                }
            }
            return value;
        };
        CodeGeneratorToken.prototype.fn = function (node) {
            if (!node.left) {
                return CodeGeneratorToken.fnGetWs(node) + CodeGeneratorToken.token2String(node.type); // only fn
            }
            var left = this.fnParseOneArg(node.left), nodeArgs = node.args ? this.fnParseArgs(node.args) : []; //TTT
            // We always need to store "fn" as as token and not as a string
            return CodeGeneratorToken.fnGetWs(node) + CodeGeneratorToken.token2String(node.type) + left + nodeArgs.join("");
        };
        CodeGeneratorToken.prototype.fnThenOrElsePart = function (nodeBranch) {
            var nodeArgs = this.fnParseArgs(nodeBranch), // args for "then" or "else"
            thenOrElse = nodeArgs.shift();
            return thenOrElse + nodeArgs.join("");
        };
        CodeGeneratorToken.prototype.fnIf = function (node) {
            if (!node.left) {
                throw this.composeError(Error(), "Programming error: Undefined left", node.type, node.pos); // should not occur
            }
            if (!node.args) {
                throw this.composeError(Error(), "Programming error: Undefined args", node.type, node.pos); // should not occur
            }
            var value = CodeGeneratorToken.fnGetWs(node) + CodeGeneratorToken.token2String(node.type) + this.fnParseOneArg(node.left);
            value += this.fnThenOrElsePart(node.args); // "then" part
            if (node.args2) {
                value += this.fnThenOrElsePart(node.args2); // "else" part
            }
            return value;
        };
        CodeGeneratorToken.prototype.mid$Assign = function (node) {
            if (!node.right) {
                throw this.composeError(Error(), "Programming error: Undefined right", "", -1); // should not occur TTT
            }
            var nodeArgs = this.fnParseArgs(node.args);
            return CodeGeneratorToken.fnGetWs(node) + CodeGeneratorToken.token2String(node.type) + nodeArgs.join("") + this.fnParseOneArg(node.right);
        };
        CodeGeneratorToken.prototype.onBreakContOrGosubOrStop = function (node) {
            var nodeArgs = this.fnParseArgs(node.args);
            var name = "";
            if (node.right && node.right.right) { // get which comes after "on break"...
                name = this.fnParseOneArg(node.right.right);
            }
            return CodeGeneratorToken.fnGetWs(node) + CodeGeneratorToken.token2String("_onBreak") + name + nodeArgs.join("");
        };
        CodeGeneratorToken.prototype.onErrorGoto = function (node) {
            var nodeArgs = this.fnParseArgs(node.args);
            var value;
            if (node.args && node.args.length && node.args[0].value === "0") { // on error goto 0?
                value = CodeGeneratorToken.token2String("_onErrorGoto0");
            }
            else {
                value = CodeGeneratorToken.token2String("on") + CodeGeneratorToken.token2String("error") + CodeGeneratorToken.token2String("goto") + nodeArgs.join("");
            }
            return value;
        };
        CodeGeneratorToken.prototype.onSqGosub = function (node) {
            var nodeArgs = this.fnParseArgs(node.args);
            return CodeGeneratorToken.token2String("_onSq") + nodeArgs.join("");
        };
        CodeGeneratorToken.prototype.rem = function (node) {
            var nodeArgs = this.fnParseArgs(node.args), name = CodeGeneratorToken.fnGetWs(node) + (node.value === "'" ? this.statementSeparator : "") + CodeGeneratorToken.token2String(node.value.toLowerCase()), // we use value to get REM or '
            value = nodeArgs.length ? nodeArgs[0] : "";
            return name + value;
        };
        /* eslint-enable no-invalid-this */
        CodeGeneratorToken.prototype.fnParseOther = function (node) {
            var type = node.type, keyType = BasicParser_1.BasicParser.keywords[type];
            var value = CodeGeneratorToken.fnGetWs(node);
            if (keyType) {
                value += CodeGeneratorToken.token2String(type);
            }
            else if (node.value) { // e.g. string,...
                value += node.value;
            }
            if (node.left) {
                value += this.fnParseOneArg(node.left);
            }
            if (node.right) {
                value += this.fnParseOneArg(node.right);
            }
            if (node.args) {
                value += this.fnParseArgs(node.args).join("");
            }
            if (node.args2) { // ELSE part already handled
                throw this.composeError(Error(), "Programming error: args2", node.type, node.pos); // should not occur
            }
            return value;
        };
        CodeGeneratorToken.prototype.parseNode = function (node) {
            if (Utils_1.Utils.debug > 3) {
                Utils_1.Utils.console.debug("evaluate: parseNode node=%o type=" + node.type + " value=" + node.value + " left=%o right=%o args=%o", node, node.left, node.right, node.args);
            }
            var type = node.type, operators = CodeGeneratorToken.operators;
            var value;
            if (operators[type]) {
                if (node.left) {
                    value = this.parseNode(node.left);
                    var value2 = this.parseNode(node.right);
                    value += CodeGeneratorToken.fnGetWs(node) + CodeGeneratorToken.token2String(operators[type]) + value2;
                }
                else if (node.right) { // unary operator, e.g. 'not', '#'
                    if (node.len === 0) {
                        value = ""; // ignore dummy token, e.g. '#'
                    }
                    else {
                        value = this.parseNode(node.right);
                        value = CodeGeneratorToken.fnGetWs(node) + CodeGeneratorToken.token2String(operators[type]) + value;
                    }
                }
                else if (type === "=") { // no operator, "=" in 'for' or 'def fn'
                    value = CodeGeneratorToken.fnGetWs(node) + CodeGeneratorToken.token2String(type);
                }
                else { // should not occur
                    value = this.fnParseOther(node);
                }
            }
            else if (this.parseFunctions[type]) { // function with special handling?
                value = this.parseFunctions[type].call(this, node);
            }
            else { // for other functions, generate code directly
                value = this.fnParseOther(node);
            }
            if (Utils_1.Utils.debug > 2) {
                Utils_1.Utils.console.debug("parseNode: type='" + type + "', value='" + node.value + "', ws='" + node.ws + "', resultValue='" + value + "'");
            }
            return value;
        };
        CodeGeneratorToken.prototype.evaluate = function (parseTree) {
            var output = "";
            for (var i = 0; i < parseTree.length; i += 1) {
                if (Utils_1.Utils.debug > 2) {
                    Utils_1.Utils.console.debug("evaluate: parseTree i=%d, node=%o", i, parseTree[i]);
                }
                var node = this.parseNode(parseTree[i]);
                if ((node !== undefined) && (node !== "")) {
                    if (node !== null) {
                        output += node;
                    }
                    else {
                        output = ""; // cls (clear output when node is set to null)
                    }
                }
            }
            if (output.length && this.label) {
                output += CodeGeneratorToken.token2String("_eol") + CodeGeneratorToken.token2String("_eol"); // 2 times eol is eof
            }
            return output;
        };
        CodeGeneratorToken.prototype.generate = function (input) {
            var out = {
                text: ""
            };
            this.label = "";
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
        CodeGeneratorToken.operators = {
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
        CodeGeneratorToken.tokens = {
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
            afterGosub: 0x80,
            auto: 0x81,
            border: 0x82,
            call: 0x83,
            cat: 0x84,
            chain: 0x85,
            chainMerge: 0x85,
            clear: 0x86,
            clearInput: 0x86,
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
            everyGosub: 0x9d,
            "for": 0x9e,
            gosub: 0x9f,
            "goto": 0xa0,
            "if": 0xa1,
            ink: 0xa2,
            input: 0xa3,
            key: 0xa4,
            keyDef: 0xa4,
            let: 0xa5,
            line: 0xa6,
            lineInput: 0xa6,
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
            _onBreak: 0xb3,
            _onErrorGoto0: 0xb4,
            onGosub: 0xb2,
            onGoto: 0xb2,
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
            resumeNext: 0xc8,
            "return": 0xc9,
            run: 0xca,
            save: 0xcb,
            sound: 0xcc,
            speedInk: 0xcd,
            speedKey: 0xcd,
            speedWrite: 0xcd,
            stop: 0xce,
            swap: 0xe7,
            symbol: 0xcf,
            symbolAfter: 0xcf,
            tag: 0xd0,
            tagoff: 0xd1,
            troff: 0xd2,
            tron: 0xd3,
            wait: 0xd4,
            wend: 0xd5,
            "while": 0xd6,
            width: 0xd7,
            window: 0xd8,
            windowSwap: 0xd8,
            write: 0xd9,
            zone: 0xda,
            di: 0xdb,
            ei: 0xdc,
            fill: 0xdd,
            graphics: 0xde,
            graphicsPaper: 0xde,
            graphicsPen: 0xde,
            mask: 0xdf,
            frame: 0xe0,
            cursor: 0xe1,
            // "<unused>":         0xe2,
            erl: 0xe3,
            fn: 0xe4,
            spc: 0xe5,
            step: 0xe6,
            // swap: 0xe7, only: windowSwap...
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
        CodeGeneratorToken.tokensFF = {
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
});
//# sourceMappingURL=CodeGeneratorToken.js.map