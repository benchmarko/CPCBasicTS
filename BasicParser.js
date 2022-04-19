// BasicParser.ts - BASIC Parser
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//
// BASIC parser for Locomotive BASIC 1.1 for Amstrad CPC 6128
//
define(["require", "exports", "./Utils"], function (require, exports, Utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BasicParser = void 0;
    var BasicParser = /** @class */ (function () {
        function BasicParser(options) {
            this.line = "0"; // for error messages
            this.quiet = false;
            this.keepTokens = false;
            this.keepBrackets = false;
            this.keepColons = false;
            this.keepDataComma = false;
            this.symbols = {};
            // set also during parse
            this.tokens = [];
            this.allowDirect = false;
            this.index = 0;
            this.parseTree = [];
            this.statementList = []; // just to check last statement when generating error message
            /* eslint-disable no-invalid-this */
            this.specialStatements = {
                "'": this.fnApostrophe,
                "|": this.fnRsx,
                after: this.fnAfterOrEvery,
                chain: this.fnChain,
                clear: this.fnClear,
                data: this.fnData,
                def: this.fnDef,
                "else": this.fnElse,
                ent: this.fnEntOrEnv,
                env: this.fnEntOrEnv,
                every: this.fnAfterOrEvery,
                "for": this.fnFor,
                graphics: this.fnGraphics,
                "if": this.fnIf,
                input: this.fnInput,
                key: this.fnKey,
                let: this.fnLet,
                line: this.fnLine,
                mid$: this.fnMid$,
                on: this.fnOn,
                print: this.fnPrint,
                "?": this.fnQuestion,
                resume: this.fnResume,
                speed: this.fnSpeed,
                symbol: this.fnSymbol,
                window: this.fnWindow
            };
            if (options) {
                this.setOptions(options);
            }
            this.fnGenerateSymbols();
            this.previousToken = {}; // to avoid warnings
            this.token = this.previousToken;
        }
        BasicParser.prototype.setOptions = function (options) {
            this.quiet = options.quiet || false;
            this.keepTokens = options.keepTokens || false;
            this.keepBrackets = options.keepBrackets || false;
            this.keepColons = options.keepColons || false;
            this.keepDataComma = options.keepDataComma || false;
        };
        BasicParser.prototype.composeError = function (error, message, value, pos, len) {
            len = value === "(end)" ? 0 : len;
            return Utils_1.Utils.composeError("BasicParser", error, message, value, pos, len, this.line);
        };
        // http://crockford.com/javascript/tdop/tdop.html (old: http://javascript.crockford.com/tdop/tdop.html)
        // http://crockford.com/javascript/tdop/parse.js
        // Operator precedence parsing
        //
        // Operator: With left binding power (lbp) and operational function.
        // Manipulates tokens to its left (e.g: +)? => left denotative function led(), otherwise null denotative function nud()), (e.g. unary -)
        // identifiers, numbers: also nud.
        BasicParser.prototype.getToken = function () {
            return this.token;
        };
        BasicParser.prototype.symbol = function (id, nud) {
            if (!this.symbols[id]) {
                this.symbols[id] = {};
            }
            var symbol = this.symbols[id];
            if (nud) {
                symbol.nud = nud;
            }
            return symbol;
        };
        BasicParser.prototype.advance = function (id) {
            var token = this.token;
            this.previousToken = this.token;
            if (id && token.type !== id) {
                throw this.composeError(Error(), "Expected " + id, (token.value === "") ? token.type : token.value, token.pos);
            }
            // additional check...
            if (this.index >= this.tokens.length) {
                if (!this.quiet) {
                    Utils_1.Utils.console.warn(this.composeError({}, "advance: End of file", token.value, token.pos).message);
                }
                if (this.tokens.length && this.tokens[this.tokens.length - 1].type === "(end)") {
                    token = this.tokens[this.tokens.length - 1];
                }
                else {
                    if (!this.quiet) {
                        Utils_1.Utils.console.warn(this.composeError({}, "advance: Expected (end) token", token.value, token.pos).message);
                    }
                    token = BasicParser.fnCreateDummyArg("(end)");
                    token.value = ""; // null
                }
                return token;
            }
            token = this.tokens[this.index]; // we get a lex token and reuse it as parseTree token
            this.index += 1;
            if (token.type === "identifier" && BasicParser.keywords[token.value.toLowerCase()]) {
                token.type = token.value.toLowerCase(); // modify type identifier => keyword xy
            }
            var sym = this.symbols[token.type];
            if (!sym) {
                throw this.composeError(Error(), "Unknown token", token.type, token.pos);
            }
            this.token = token;
            return token;
        };
        BasicParser.prototype.expression = function (rbp) {
            var t = this.token, s = this.symbols[t.type];
            if (Utils_1.Utils.debug > 3) {
                Utils_1.Utils.console.debug("parse: expression rbp=" + rbp + " type=" + t.type + " t=%o", t);
            }
            this.advance(t.type);
            if (!s.nud) {
                if (t.type === "(end)") {
                    throw this.composeError(Error(), "Unexpected end of file", "", t.pos);
                }
                else {
                    throw this.composeError(Error(), "Unexpected token", t.value, t.pos);
                }
            }
            var left = s.nud.call(this, t); // process literals, variables, and prefix operators
            t = this.token;
            s = this.symbols[t.type];
            while (rbp < (s.lbp || 0)) { // as long as the right binding power is less than the left binding power of the next token...
                this.advance(t.type);
                if (!s.led) {
                    throw this.composeError(Error(), "Unexpected token", t.type, t.pos); //TTT how to get this error?
                }
                left = s.led.call(this, left); // ...the led method is invoked on the following token (infix and suffix operators), can be recursive
                t = this.token;
                s = this.symbols[t.type];
            }
            return left;
        };
        BasicParser.prototype.assignment = function () {
            if (this.token.type !== "identifier") {
                var typeFirstChar = "v";
                throw this.composeError(Error(), "Expected " + BasicParser.parameterTypes[typeFirstChar], this.token.value, this.token.pos); // variable
            }
            var left = this.expression(90), // take it (can also be an array) and stop
            value = this.token;
            this.advance("="); // equal as assignment
            value.left = left;
            value.right = this.expression(0);
            value.type = "assign"; // replace "="
            return value;
        };
        BasicParser.prototype.statement = function () {
            var t = this.token, s = this.symbols[t.type];
            if (s.std) { // statement?
                this.advance();
                return s.std.call(this);
            }
            var value;
            if (t.type === "identifier") {
                value = this.assignment();
            }
            else {
                value = this.expression(0);
            }
            if (value.type !== "assign" && value.type !== "fcall" && value.type !== "def" && value.type !== "(" && value.type !== "[") {
                throw this.composeError(Error(), "Bad expression statement", t.value, t.pos);
            }
            return value;
        };
        BasicParser.prototype.statements = function (stopType) {
            var statements = [];
            this.statementList = statements; // fast hack to access last statement for error messages
            var colonExpected = false;
            while (this.token.type !== "(end)" && this.token.type !== "(eol)") {
                if (stopType && this.token.type === stopType) {
                    break;
                }
                if (colonExpected || this.token.type === ":") {
                    if (this.token.type !== "'" && this.token.type !== "else") { // no colon required for line comment or ELSE
                        this.advance(":");
                        if (this.keepColons) {
                            statements.push(this.previousToken);
                        }
                    }
                    colonExpected = false;
                }
                else {
                    var statement = this.statement();
                    statements.push(statement);
                    colonExpected = true;
                }
            }
            return statements;
        };
        BasicParser.prototype.basicLine = function () {
            var value;
            if (this.token.type !== "number" && this.allowDirect) {
                this.allowDirect = false; // allow only once
                value = BasicParser.fnCreateDummyArg("label");
                value.value = "direct"; // insert "direct" label
            }
            else {
                this.advance("number");
                value = this.previousToken; // number token
                value.type = "label"; // number => label
            }
            this.line = value.value; // set line number for error messages
            value.args = this.statements("");
            if (this.token.type === "(eol)") {
                this.advance("(eol)");
            }
            return value;
        };
        BasicParser.prototype.generateLed = function (rbp) {
            var _this = this;
            return function (left) {
                var value = _this.previousToken;
                value.left = left;
                value.right = _this.expression(rbp);
                return value;
            };
        };
        BasicParser.prototype.generateNud = function (rbp) {
            var _this = this;
            return function () {
                var value = _this.previousToken;
                value.right = _this.expression(rbp);
                return value;
            };
        };
        BasicParser.prototype.infix = function (id, lbp, rbp, led) {
            rbp = rbp || lbp;
            var symbol = this.symbol(id);
            symbol.lbp = lbp;
            symbol.led = led || this.generateLed(rbp);
        };
        BasicParser.prototype.infixr = function (id, lbp) {
            var symbol = this.symbol(id);
            symbol.lbp = lbp;
            symbol.led = this.generateLed(lbp - 1);
        };
        BasicParser.prototype.prefix = function (id, rbp) {
            this.symbol(id, this.generateNud(rbp));
        };
        BasicParser.prototype.stmt = function (id, fn) {
            var symbol = this.symbol(id);
            symbol.std = fn;
            return symbol;
        };
        BasicParser.fnCreateDummyArg = function (type, value) {
            var node = {
                type: type,
                value: value !== undefined ? value : type,
                pos: 0,
                len: 0
            };
            return node;
        };
        BasicParser.prototype.fnCombineTwoTokensNoArgs = function (token2) {
            var previousToken = this.previousToken, name = previousToken.type + Utils_1.Utils.stringCapitalize(this.token.type); // e.g ."speedInk"
            previousToken.value += (this.token.ws || " ") + this.token.value; // combine values of both
            this.token = this.advance(token2); // for "speed" e.g. "ink", "key", "write" (this.token.type)
            this.previousToken = previousToken; // fast hack to get e.g. "speed" token
            return name;
        };
        BasicParser.prototype.fnCombineTwoTokens = function (token2) {
            var name = this.fnCombineTwoTokensNoArgs(token2), value = this.fnCreateCmdCallForType(name);
            return value;
        };
        BasicParser.prototype.fnGetOptionalStream = function () {
            var value;
            if (this.token.type === "#") { // stream?
                value = this.expression(0);
            }
            else { // create dummy
                value = BasicParser.fnCreateDummyArg("#"); // dummy stream
                value.right = BasicParser.fnCreateDummyArg("null", "0"); // ...with dummy parameter
            }
            return value;
        };
        BasicParser.prototype.fnChangeNumber2LineNumber = function (node) {
            if (node.type === "number") {
                node.type = "linenumber"; // change type: number => linenumber
            }
            else { // should not occure...
                var typeFirstChar = "l";
                throw this.composeError(Error(), "Expected " + BasicParser.parameterTypes[typeFirstChar], node.type, node.pos);
            }
        };
        BasicParser.prototype.fnGetLineRange = function () {
            var left;
            if (this.token.type === "number") {
                left = this.token;
                this.advance("number");
                this.fnChangeNumber2LineNumber(left);
            }
            var range;
            if (this.token.type === "-") {
                range = this.token;
                this.advance("-");
            }
            if (range) {
                var right = void 0;
                if (this.token.type === "number") {
                    right = this.token;
                    this.advance("number");
                    this.fnChangeNumber2LineNumber(right);
                }
                // accept also "-" as full range
                range.type = "linerange"; // change "-" => "linerange"
                range.left = left || BasicParser.fnCreateDummyArg("null"); // insert dummy for left
                range.right = right || BasicParser.fnCreateDummyArg("null"); // insert dummy for right (do not skip it)
            }
            else if (left) {
                range = left; // single line number
            }
            else {
                throw this.composeError(Error(), "Undefined range", this.token.value, this.token.pos);
            }
            return range;
        };
        BasicParser.fnIsSingleLetterIdentifier = function (value) {
            return value.type === "identifier" && !value.args && value.value.length === 1;
        };
        BasicParser.prototype.fnGetLetterRange = function (typeFirstChar) {
            if (this.token.type !== "identifier") {
                throw this.composeError(Error(), "Expected " + BasicParser.parameterTypes[typeFirstChar], this.token.value, this.token.pos);
            }
            var expression = this.expression(0); // n or n-n
            if (BasicParser.fnIsSingleLetterIdentifier(expression)) { // ok
                expression.type = "letter"; // change type: identifier -> letter
            }
            else if (expression.type === "-" && expression.left && expression.right && BasicParser.fnIsSingleLetterIdentifier(expression.left) && BasicParser.fnIsSingleLetterIdentifier(expression.right)) { // also ok
                expression.type = "range"; // change type: "-" => range
                expression.left.type = "letter"; // change type: identifier -> letter
                expression.right.type = "letter"; // change type: identifier -> letter
            }
            else {
                throw this.composeError(Error(), "Expected " + BasicParser.parameterTypes[typeFirstChar], expression.value, expression.pos);
            }
            return expression;
        };
        BasicParser.prototype.fnCheckRemainingTypes = function (types) {
            for (var i = 0; i < types.length; i += 1) { // some more parameters expected?
                var type = types[i];
                if (!type.endsWith("?") && !type.endsWith("*")) { // mandatory?
                    var text = BasicParser.parameterTypes[type] || ("parameter " + type);
                    throw this.composeError(Error(), "Expected " + text + " for " + this.previousToken.type, this.token.value, this.token.pos);
                }
            }
        };
        BasicParser.prototype.fnLastStatemetIsOnErrorGotoX = function () {
            var statements = this.statementList;
            var isOnErrorGoto = false;
            for (var i = statements.length - 1; i >= 0; i -= 1) {
                var lastStatement = statements[i];
                if (lastStatement.type !== ":") { // ignore colons (separator when keepTokens=true)
                    if (lastStatement.type === "onErrorGoto" && lastStatement.args && Number(lastStatement.args[0].value) > 0) {
                        isOnErrorGoto = true;
                    }
                    break;
                }
            }
            return isOnErrorGoto;
        };
        BasicParser.prototype.fnGetArgs = function (keyword) {
            var types;
            if (keyword) {
                var keyOpts = BasicParser.keywords[keyword];
                if (keyOpts) {
                    types = keyOpts.split(" ");
                    types.shift(); // remove keyword type
                }
                else { // programming error, should not occure
                    Utils_1.Utils.console.warn(this.composeError({}, "fnGetArgs: No options for keyword", keyword, this.token.pos).message);
                }
            }
            var args = [], separator = ",", closeTokens = BasicParser.closeTokens;
            var needMore = false, type = "xxx";
            while (needMore || (type && !closeTokens[this.token.type])) {
                needMore = false;
                if (types && type.slice(-1) !== "*") { // "*"= any number of parameters
                    type = types.shift() || "";
                    if (!type) {
                        throw this.composeError(Error(), "Expected end of arguments", this.previousToken.type, this.previousToken.pos);
                    }
                }
                var typeFirstChar = type.charAt(0);
                var expression = void 0;
                if (type === "#0?") { // optional stream?
                    if (this.token.type === "#") { // stream?
                        expression = this.fnGetOptionalStream();
                        if (this.getToken().type === ",") { // token.type
                            this.advance(",");
                            needMore = true;
                        }
                    }
                    else {
                        expression = this.fnGetOptionalStream();
                    }
                }
                else {
                    if (typeFirstChar === "#") { // stream expected? (for functions)
                        expression = this.expression(0);
                        if (expression.type !== "#") { // maybe a number
                            throw this.composeError(Error(), "Expected " + BasicParser.parameterTypes[typeFirstChar], expression.value, expression.pos);
                        }
                    }
                    else if (this.token.type === separator && type.substr(0, 2) === "n0") { // n0 or n0?: if parameter not specified, insert default value null?
                        expression = BasicParser.fnCreateDummyArg("null");
                    }
                    else if (typeFirstChar === "l") {
                        expression = this.expression(0);
                        if (expression.type !== "number") { // maybe an expression and no plain number
                            throw this.composeError(Error(), "Expected " + BasicParser.parameterTypes[typeFirstChar], expression.value, expression.pos);
                        }
                        this.fnChangeNumber2LineNumber(expression);
                    }
                    else if (typeFirstChar === "v") { // variable (identifier)
                        expression = this.expression(0);
                        if (expression.type !== "identifier") {
                            throw this.composeError(Error(), "Expected " + BasicParser.parameterTypes[typeFirstChar], expression.value, expression.pos);
                        }
                    }
                    else if (typeFirstChar === "r") { // letter or range of letters (defint, defreal, defstr)
                        expression = this.fnGetLetterRange(typeFirstChar);
                    }
                    else if (typeFirstChar === "q") { // line number range
                        if (type === "q0?") { // optional line number range
                            if (this.token.type === "number" || this.token.type === "-") { // eslint-disable-line max-depth
                                expression = this.fnGetLineRange();
                            }
                            else {
                                expression = BasicParser.fnCreateDummyArg("null");
                                if (types && types.length) { // eslint-disable-line max-depth
                                    needMore = true; // maybe take it as next parameter
                                }
                            }
                        }
                        else {
                            expression = this.fnGetLineRange();
                        }
                    }
                    else if (typeFirstChar === "n") { // number
                        expression = this.expression(0);
                        if (expression.type === "string" || expression.type === "#") { // got a string or stream? (statical check)
                            if (!this.fnLastStatemetIsOnErrorGotoX()) { // eslint-disable-line max-depth
                                throw this.composeError(Error(), "Expected " + BasicParser.parameterTypes[typeFirstChar], expression.value, expression.pos);
                            }
                            else if (!this.quiet) {
                                Utils_1.Utils.console.warn(this.composeError({}, "Expected " + BasicParser.parameterTypes[typeFirstChar], expression.value, expression.pos).message);
                            }
                        }
                    }
                    else if (typeFirstChar === "s") { // string
                        expression = this.expression(0);
                        if (expression.type === "number") { // got e.g. number? (statical check)
                            if (!this.fnLastStatemetIsOnErrorGotoX()) { // eslint-disable-line max-depth
                                throw this.composeError(Error(), "Expected " + BasicParser.parameterTypes[typeFirstChar], expression.value, expression.pos);
                            }
                            else if (!this.quiet) {
                                Utils_1.Utils.console.warn(this.composeError({}, "Expected " + BasicParser.parameterTypes[typeFirstChar], expression.value, expression.pos).message);
                            }
                        }
                    }
                    else {
                        expression = this.expression(0);
                        if (expression.type === "#") { // got stream?
                            throw this.composeError(Error(), "Unexpected stream", expression.value, expression.pos); // do we still need this?
                        }
                    }
                    if (this.token.type === separator) {
                        this.advance(separator);
                        needMore = true;
                    }
                    else if (!needMore) {
                        type = ""; // stop
                    }
                }
                args.push(expression);
            }
            if (types && types.length) { // some more parameters expected?
                this.fnCheckRemainingTypes(types); // error if remaining mandatory args
                type = types[0];
                if (type === "#0?") { // null stream to add?
                    var expression = BasicParser.fnCreateDummyArg("#"); // dummy stream with dummy arg
                    expression.right = BasicParser.fnCreateDummyArg("null", "0");
                    args.push(expression);
                }
            }
            return args;
        };
        BasicParser.prototype.fnGetArgsSepByCommaSemi = function () {
            var closeTokens = BasicParser.closeTokens, args = [];
            while (!closeTokens[this.token.type]) {
                args.push(this.expression(0));
                if (this.token.type === "," || this.token.type === ";") {
                    this.advance(this.token.type);
                }
                else {
                    break;
                }
            }
            return args;
        };
        BasicParser.prototype.fnGetArgsInParenthesis = function () {
            this.advance("(");
            var args = this.fnGetArgs(undefined); // until ")"
            this.advance(")");
            return args;
        };
        BasicParser.prototype.fnGetArgsInParenthesesOrBrackets = function () {
            var brackets = BasicParser.brackets;
            var bracketOpen;
            if (this.token.type === "(" || this.token.type === "[") {
                bracketOpen = this.token;
            }
            this.advance(bracketOpen ? bracketOpen.type : "(");
            if (!bracketOpen) {
                throw this.composeError(Error(), "Programming error: Undefined bracketOpen", this.token.type, this.token.pos); // should not occure
            }
            var args = this.fnGetArgs(undefined); // (until "]" or ")")
            args.unshift(bracketOpen);
            var bracketClose;
            if (this.token.type === ")" || this.token.type === "]") {
                bracketClose = this.token;
            }
            this.advance(bracketClose ? bracketClose.type : ")");
            if (!bracketClose) {
                throw this.composeError(Error(), "Programming error: Undefined bracketClose", this.token.type, this.token.pos); // should not occure
            }
            args.push(bracketClose);
            if (brackets[bracketOpen.type] !== bracketClose.type) {
                if (!this.quiet) {
                    Utils_1.Utils.console.warn(this.composeError({}, "Inconsistent bracket style", this.previousToken.value, this.previousToken.pos).message);
                }
            }
            return args;
        };
        BasicParser.prototype.fnCreateCmdCall = function () {
            var value = this.previousToken;
            value.args = this.fnGetArgs(value.type);
            return value;
        };
        BasicParser.prototype.fnCreateCmdCallForType = function (type) {
            if (type) {
                this.previousToken.type = type; // override
            }
            return this.fnCreateCmdCall();
        };
        BasicParser.prototype.fnCreateFuncCall = function () {
            var value = this.previousToken;
            if (this.token.type === "(") { // args in parenthesis?
                this.advance("(");
                value.args = this.fnGetArgs(value.type);
                this.advance(")");
            }
            else { // no parenthesis?
                value.args = [];
                // if we have a check, make sure there are no non-optional parameters left
                var keyOpts = BasicParser.keywords[value.type];
                if (keyOpts) {
                    var types = keyOpts.split(" ");
                    types.shift(); // remove key
                    this.fnCheckRemainingTypes(types);
                }
            }
            return value;
        };
        BasicParser.prototype.fnGenerateKeywordSymbols = function () {
            for (var key in BasicParser.keywords) {
                if (BasicParser.keywords.hasOwnProperty(key)) {
                    var keywordType = BasicParser.keywords[key].charAt(0);
                    if (keywordType === "f") {
                        this.symbol(key, this.fnCreateFuncCall);
                    }
                    else if (keywordType === "c") {
                        this.stmt(key, this.specialStatements[key] || this.fnCreateCmdCall);
                    }
                }
            }
        };
        // ...
        BasicParser.prototype.fnIdentifier = function (nameNode) {
            var nameValue = nameNode.value, startsWithFn = nameValue.toLowerCase().startsWith("fn");
            if (startsWithFn) {
                if (this.token.type !== "(") { // Fnxxx name without ()
                    var value_1 = {
                        type: "fn",
                        value: nameValue,
                        args: [],
                        left: nameNode,
                        pos: nameNode.pos // same pos as identifier?
                    };
                    if (nameNode.ws) {
                        value_1.ws = nameNode.ws;
                        nameNode.ws = "";
                    }
                    return value_1;
                }
            }
            var value = nameNode;
            if (this.token.type === "(" || this.token.type === "[") {
                value = this.previousToken;
                if (startsWithFn) {
                    value.args = this.fnGetArgsInParenthesis();
                    value.type = "fn"; // FNxxx in e.g. print
                    value.left = {
                        type: "identifier",
                        value: value.value,
                        pos: value.pos
                    };
                }
                else {
                    value.args = this.fnGetArgsInParenthesesOrBrackets();
                }
            }
            return value;
        };
        BasicParser.prototype.fnParenthesis = function () {
            var value;
            if (this.keepBrackets) {
                value = this.previousToken; // "("
                value.args = [
                    this.expression(0),
                    this.token // ")" (hopefully)
                ];
            }
            else {
                value = this.expression(0);
            }
            this.advance(")");
            return value;
        };
        BasicParser.prototype.fnFn = function () {
            var value = this.previousToken, // "fn"
            value2 = this.token; // identifier
            this.fnCombineTwoTokensNoArgs("identifier");
            value2.value = "fn" + value2.value; // combine "fn" + identifier (maybe simplify by separating in lexer)
            if (value2.ws) {
                value2.ws = "";
            }
            value.left = value2;
            if (this.token.type !== "(") { // FN xxx name without ()?
                value.args = [];
            }
            else {
                value.args = this.fnGetArgsInParenthesis();
            }
            return value;
        };
        BasicParser.prototype.fnApostrophe = function () {
            return this.fnCreateCmdCallForType("rem");
        };
        BasicParser.prototype.fnRsx = function () {
            var value = this.previousToken;
            var type;
            if (this.token.type === ",") { // arguments starting with comma
                this.advance(",");
                type = "_rsx1"; // dummy token: expect at least 1 argument
            }
            value.args = this.fnGetArgs(type); // get arguments
            return value;
        };
        BasicParser.prototype.fnAfterOrEvery = function () {
            var type = this.previousToken.type + "Gosub", // "afterGosub" or "everyGosub"
            value = this.fnCreateCmdCallForType(type); // interval and optional timer
            if (!value.args) {
                throw this.composeError(Error(), "Programming error: Undefined args", this.token.type, this.token.pos); // should not occure
            }
            if (value.args.length < 2) { // add default timer 0
                value.args.push(BasicParser.fnCreateDummyArg("null"));
            }
            this.advance("gosub");
            var line = this.fnGetArgs("gosub"); // line number
            value.args.push(line[0]);
            return value;
        };
        BasicParser.prototype.fnChain = function () {
            var value;
            if (this.token.type !== "merge") { // not chain merge?
                value = this.fnCreateCmdCall(); // chain
            }
            else { // chain merge with optional DELETE
                var name_1 = this.fnCombineTwoTokensNoArgs(this.token.type); // chainMerge
                value = this.previousToken;
                value.type = name_1;
                value.args = [];
                var value2 = this.expression(0); // filename
                value.args.push(value2);
                this.token = this.getToken();
                if (this.token.type === ",") {
                    this.token = this.advance(",");
                    var numberExpression = false; // line number (expression) found
                    if (this.token.type !== "," && this.token.type !== "(eol)" && this.token.type !== "(eof)") {
                        value2 = this.expression(0); // line number or expression
                        value.args.push(value2);
                        numberExpression = true;
                    }
                    if (this.token.type === ",") {
                        this.advance(",");
                        if (!numberExpression) {
                            value2 = BasicParser.fnCreateDummyArg("null"); // insert dummy arg for line
                            value.args.push(value2);
                        }
                        this.advance("delete");
                        var args = this.fnGetArgs(this.previousToken.type); // args for "delete"
                        for (var i = 0; i < args.length; i += 1) {
                            value.args.push(args[i]); // copy arg
                        }
                    }
                }
            }
            return value;
        };
        BasicParser.prototype.fnClear = function () {
            var tokenType = this.token.type;
            var value;
            if (tokenType === "input") {
                value = this.fnCombineTwoTokens(tokenType);
            }
            else {
                value = this.fnCreateCmdCall(); // "clear"
            }
            return value;
        };
        BasicParser.prototype.fnData = function () {
            var value = this.previousToken;
            var parameterFound = false;
            value.args = [];
            // data is special: it can have empty parameters, also the last parameter, and also if no parameters
            if (this.token.type !== "," && this.token.type !== "(eol)" && this.token.type !== "(end)") {
                value.args.push(this.expression(0)); // take first argument
                parameterFound = true;
            }
            while (this.token.type === ",") {
                if (!parameterFound) {
                    value.args.push(BasicParser.fnCreateDummyArg("null")); // insert null parameter
                }
                this.token = this.advance(",");
                if (this.keepDataComma) {
                    value.args.push(this.previousToken); // ","
                }
                parameterFound = false;
                if (this.token.type === "(eol)" || this.token.type === "(end)") {
                    break;
                }
                else if (this.token.type !== ",") {
                    value.args.push(this.expression(0));
                    parameterFound = true;
                }
            }
            if (!parameterFound) {
                value.args.push(BasicParser.fnCreateDummyArg("null")); // insert null parameter
            }
            return value;
        };
        BasicParser.prototype.fnDef = function () {
            var value = this.previousToken; // def
            var value2 = this.token, // fn or fn<identifier>
            fn;
            if (value2.type === "fn") { // fn and <identifier> separate?
                fn = value2;
                value2 = this.advance("fn");
            }
            this.token = this.advance("identifier");
            if (fn) { // separate fn?
                value2.value = fn.value + value2.value; // combine "fn" + identifier (maybe simplify by separating in lexer)
                value2.space = true; // fast hack: set space for CodeGeneratorBasic
            }
            else if (!value2.value.toLowerCase().startsWith("fn")) { // not fn<identifier>
                throw this.composeError(Error(), "Invalid DEF", this.token.type, this.token.pos);
            }
            value.left = value2;
            value.args = (this.token.type === "(") ? this.fnGetArgsInParenthesis() : [];
            this.advance("=");
            value.right = this.expression(0);
            return value;
        };
        BasicParser.prototype.fnElse = function () {
            var value = this.previousToken;
            value.args = [];
            if (!this.quiet) {
                Utils_1.Utils.console.warn(this.composeError({}, "ELSE: Weird use of ELSE", this.previousToken.type, this.previousToken.pos).message);
            }
            if (this.token.type === "number") { // first token number?
                this.fnChangeNumber2LineNumber(this.token);
            }
            // TODO: data line as separate statement is taken
            while (this.token.type !== "(eol)" && this.token.type !== "(end)") {
                value.args.push(this.token); // collect tokens unchecked, may contain syntax error
                this.advance(this.token.type);
            }
            return value;
        };
        BasicParser.prototype.fnEntOrEnv = function () {
            var value = this.previousToken;
            value.args = [];
            value.args.push(this.expression(0)); // should be number or variable
            while (this.token.type === ",") {
                this.token = this.advance(",");
                if (this.token.type === "=" && (value.args.length - 1) % 3 === 0) { // special handling for parameter "number of steps"
                    this.advance("=");
                    var expression_1 = BasicParser.fnCreateDummyArg("null"); // insert null parameter
                    value.args.push(expression_1);
                }
                var expression = this.expression(0);
                value.args.push(expression);
            }
            return value;
        };
        BasicParser.prototype.fnFor = function () {
            var value = this.previousToken;
            if (this.token.type !== "identifier") {
                var typeFirstChar = "v";
                throw this.composeError(Error(), "Expected " + BasicParser.parameterTypes[typeFirstChar], this.token.type, this.token.pos);
            }
            var name = this.expression(90); // take simple identifier, nothing more
            if (name.type !== "identifier") {
                var typeFirstChar = "v";
                throw this.composeError(Error(), "Expected simple " + BasicParser.parameterTypes[typeFirstChar], this.token.type, this.token.pos);
            }
            value.args = [name];
            this.advance("=");
            if (this.keepTokens) {
                value.args.push(this.previousToken);
            }
            value.args.push(this.expression(0));
            this.token = this.advance("to");
            if (this.keepTokens) {
                value.args.push(this.previousToken);
            }
            value.args.push(this.expression(0));
            if (this.token.type === "step") {
                this.advance("step");
                if (this.keepTokens) {
                    value.args.push(this.previousToken);
                }
                value.args.push(this.expression(0));
            }
            return value;
        };
        BasicParser.prototype.fnGraphics = function () {
            var tokenType = this.token.type;
            if (tokenType !== "pen" && tokenType !== "paper") {
                throw this.composeError(Error(), "Expected PEN or PAPER", tokenType, this.token.pos);
            }
            var value = this.fnCombineTwoTokens(tokenType);
            return value;
        };
        BasicParser.prototype.fnCheckForUnreachableCode = function (args) {
            for (var i = 0; i < args.length; i += 1) {
                var token = args[i];
                if ((i === 0 && token.type === "linenumber") || token.type === "goto" || token.type === "stop") {
                    var index = i + 1;
                    if (index < args.length && args[index].type !== "rem") {
                        if (!this.quiet) {
                            Utils_1.Utils.console.warn(this.composeError({}, "IF: Unreachable code after THEN or ELSE", token.type, token.pos).message);
                        }
                        break;
                    }
                }
            }
        };
        BasicParser.prototype.fnIf = function () {
            var value = this.previousToken;
            var numberToken;
            value.left = this.expression(0);
            if (this.token.type !== "goto") { // no "goto", expect "then" token...
                this.advance("then");
                if (this.keepTokens) {
                    value.right = this.previousToken;
                }
                if (this.token.type === "number") {
                    numberToken = this.fnGetArgs("goto"); // take number parameter as line number
                }
            }
            value.args = this.statements("else"); // get "then" statements until "else" or eol
            if (numberToken) {
                value.args.unshift(numberToken[0]);
                numberToken = undefined;
            }
            this.fnCheckForUnreachableCode(value.args);
            if (this.token.type === "else") {
                this.token = this.advance("else");
                if (this.keepTokens) {
                    //TODO HOWTO?
                }
                if (this.token.type === "number") {
                    numberToken = this.fnGetArgs("goto"); // take number parameter as line number
                }
                value.args2 = this.token.type === "if" ? [this.statement()] : this.statements("else");
                if (numberToken) {
                    value.args2.unshift(numberToken[0]);
                }
                this.fnCheckForUnreachableCode(value.args2);
            }
            return value;
        };
        BasicParser.prototype.fnInput = function () {
            var value = this.previousToken;
            value.args = [];
            var stream = this.fnGetOptionalStream();
            value.args.push(stream);
            if (stream.len !== 0) { // not an inserted stream?
                this.advance(",");
            }
            if (this.token.type === ";") { // no newline after input?
                value.args.push(this.token);
                this.advance(";");
            }
            else {
                value.args.push(BasicParser.fnCreateDummyArg("null"));
            }
            if (this.token.type === "string") { // message
                value.args.push(this.token);
                this.token = this.advance("string");
                if (this.token.type === ";" || this.token.type === ",") { // ";" => need to append prompt "? " , "," = no prompt
                    value.args.push(this.token);
                    this.advance(this.token.type);
                }
                else {
                    throw this.composeError(Error(), "Expected ; or ,", this.token.type, this.token.pos);
                }
            }
            else {
                value.args.push(BasicParser.fnCreateDummyArg("null")); // dummy message
                value.args.push(BasicParser.fnCreateDummyArg("null")); // dummy prompt
            }
            do { // we need loop for input
                var value2 = this.expression(90); // we expect "identifier", no fnxx
                if (value2.type !== "identifier") {
                    var typeFirstChar = "v";
                    throw this.composeError(Error(), "Expected " + BasicParser.parameterTypes[typeFirstChar], this.previousToken.type, this.previousToken.pos);
                }
                value.args.push(value2);
                if (value.type === "lineInput") {
                    break; // no loop for lineInput (only one arg)
                }
            } while ((this.token.type === ",") && this.advance(","));
            return value;
        };
        BasicParser.prototype.fnKey = function () {
            var tokenType = this.token.type;
            var value;
            if (tokenType === "def") {
                value = this.fnCombineTwoTokens(tokenType);
            }
            else {
                value = this.fnCreateCmdCall(); // "key"
            }
            return value;
        };
        BasicParser.prototype.fnLet = function () {
            var value = this.previousToken;
            value.right = this.assignment();
            return value;
        };
        BasicParser.prototype.fnLine = function () {
            var name = this.fnCombineTwoTokensNoArgs("input"); // line => lineInput
            this.previousToken.type = name; // combined type
            return this.fnInput(); // continue with input
        };
        BasicParser.prototype.fnMid$ = function () {
            this.previousToken.type = "mid$Assign"; // change type mid$ => mid$Assign
            var value = this.fnCreateFuncCall();
            if (!value.args) {
                throw this.composeError(Error(), "Programming error: Undefined args", this.token.type, this.token.pos); // should not occure
            }
            if (value.args[0].type !== "identifier") {
                var typeFirstChar = "v";
                throw this.composeError(Error(), "Expected " + BasicParser.parameterTypes[typeFirstChar], value.args[0].value, value.args[0].pos);
            }
            this.advance("="); // equal as assignment
            var right = this.expression(0);
            value.right = right;
            return value;
        };
        BasicParser.prototype.fnOn = function () {
            var value = this.previousToken;
            var name;
            value.args = [];
            if (this.token.type === "break") {
                name = this.fnCombineTwoTokensNoArgs("break"); // onBreak
                this.previousToken.type = name;
                this.token = this.getToken();
                if (this.token.type === "gosub" || this.token.type === "cont" || this.token.type === "stop") {
                    this.fnCombineTwoTokens(this.token.type); // onBreakGosub, onBreakCont, onBreakStop
                }
                else {
                    throw this.composeError(Error(), "Expected GOSUB, CONT or STOP", this.token.type, this.token.pos);
                }
            }
            else if (this.token.type === "error") { // on error goto
                name = this.fnCombineTwoTokensNoArgs("error"); // onError...
                this.previousToken.type = name;
                this.fnCombineTwoTokens("goto"); // onErrorGoto
            }
            else if (this.token.type === "sq") { // on sq(n) gosub
                var left = this.expression(0);
                if (!left.args) {
                    throw this.composeError(Error(), "Programming error: Undefined args", this.token.type, this.token.pos); // should not occure
                }
                left = left.args[0];
                this.token = this.getToken();
                this.advance("gosub");
                value.type = "onSqGosub";
                value.args = this.fnGetArgs(value.type);
                value.left = left;
            }
            else { // on <expr>
                var left = this.expression(0);
                if (this.token.type === "gosub" || this.token.type === "goto") {
                    this.advance(this.token.type);
                    if (this.keepTokens) {
                        value.right = this.previousToken;
                    }
                    value.type = "on" + Utils_1.Utils.stringCapitalize(this.previousToken.type); // onGoto, onGosub
                    value.args = this.fnGetArgs(value.type);
                    value.left = left;
                }
                else {
                    throw this.composeError(Error(), "Expected GOTO or GOSUB", this.token.type, this.token.pos);
                }
            }
            return value;
        };
        BasicParser.prototype.fnPrint = function () {
            var value = this.previousToken, closeTokens = BasicParser.closeTokens, stream = this.fnGetOptionalStream();
            value.args = [];
            value.args.push(stream);
            var commaAfterStream = false;
            if (stream.len !== 0) { // not an inserted stream?
                commaAfterStream = true;
            }
            while (!closeTokens[this.token.type]) {
                if (commaAfterStream) {
                    this.advance(",");
                    commaAfterStream = false;
                }
                var value2 = void 0;
                if (this.token.type === "spc" || this.token.type === "tab") {
                    this.advance(this.token.type);
                    value2 = this.fnCreateFuncCall();
                }
                else if (this.token.type === "using") {
                    value2 = this.token;
                    this.advance("using");
                    var t = this.expression(0); // format
                    this.advance(";"); // after the format there must be a ";"
                    value2.args = this.fnGetArgsSepByCommaSemi();
                    value2.args.unshift(t);
                    if (this.previousToken.type === ";") { // using closed by ";"?
                        value.args.push(value2);
                        value2 = this.previousToken; // keep it for print
                    }
                }
                else if (BasicParser.keywords[this.token.type] && (BasicParser.keywords[this.token.type].charAt(0) === "c" || BasicParser.keywords[this.token.type].charAt(0) === "x")) { // stop also at keyword which is c=command or x=command addition
                    break;
                    //TTT: value2 not set?
                }
                else if (this.token.type === ";" || this.token.type === ",") { // separator ";" or comma tab separator ","
                    value2 = this.token;
                    this.advance(this.token.type);
                }
                else {
                    value2 = this.expression(0);
                }
                value.args.push(value2);
            }
            return value;
        };
        BasicParser.prototype.fnQuestion = function () {
            var value = this.fnPrint();
            value.type = "print";
            return value;
        };
        BasicParser.prototype.fnResume = function () {
            var tokenType = this.token.type;
            var value;
            if (tokenType === "next") {
                value = this.fnCombineTwoTokens(tokenType);
            }
            else {
                value = this.fnCreateCmdCall();
            }
            return value;
        };
        BasicParser.prototype.fnSpeed = function () {
            var tokenType = this.token.type;
            if (tokenType !== "ink" && tokenType !== "key" && tokenType !== "write") {
                throw this.composeError(Error(), "Expected INK, KEY or WRITE", tokenType, this.token.pos);
            }
            var value = this.fnCombineTwoTokens(tokenType);
            return value;
        };
        BasicParser.prototype.fnSymbol = function () {
            var tokenType = this.token.type;
            var value;
            if (tokenType === "after") { // symbol after?
                value = this.fnCombineTwoTokens(tokenType);
            }
            else {
                value = this.fnCreateCmdCall(); // "symbol"
            }
            return value;
        };
        BasicParser.prototype.fnWindow = function () {
            var tokenType = this.token.type;
            var value;
            if (tokenType === "swap") {
                value = this.fnCombineTwoTokens(tokenType);
            }
            else {
                value = this.fnCreateCmdCall();
            }
            return value;
        };
        BasicParser.prototype.fnGenerateSymbols = function () {
            this.fnGenerateKeywordSymbols();
            // special statements ...
            this.stmt("'", this.specialStatements["'"]);
            this.stmt("|", this.specialStatements["|"]); // rsx
            this.stmt("mid$", this.specialStatements.mid$); // mid$Assign (statement), combine with function
            this.stmt("?", this.specialStatements["?"]); // "?" is same as print
            this.symbol(":");
            this.symbol(";");
            this.symbol(",");
            this.symbol(")");
            this.symbol("[");
            this.symbol("]");
            // define additional statement parts
            this.symbol("break");
            this.symbol("step");
            this.symbol("swap");
            this.symbol("then");
            this.symbol("to");
            this.symbol("using");
            this.symbol("(eol)");
            this.symbol("(end)");
            this.symbol("number", function (node) {
                return node;
            });
            this.symbol("binnumber", function (node) {
                return node;
            });
            this.symbol("hexnumber", function (node) {
                return node;
            });
            this.symbol("linenumber", function (node) {
                return node;
            });
            this.symbol("string", function (node) {
                return node;
            });
            this.symbol("unquoted", function (node) {
                return node;
            });
            this.symbol("ws", function (node) {
                return node;
            });
            this.symbol("identifier", this.fnIdentifier);
            this.symbol("(", this.fnParenthesis);
            this.prefix("@", 95); // address of
            this.infix("^", 90, 80);
            this.prefix("+", 80); // + can be uses as prefix or infix
            this.prefix("-", 80); // - can be uses as prefix or infix
            this.infix("*", 70);
            this.infix("/", 70);
            this.infix("\\", 60); // integer division
            this.infix("mod", 50);
            this.infix("+", 40); // + can be uses as prefix or infix, so combine with prefix function
            this.infix("-", 40); // - can be uses as prefix or infix, so combine with prefix function
            this.infixr("=", 30); // equal for comparison
            this.infixr("<>", 30);
            this.infixr("<", 30);
            this.infixr("<=", 30);
            this.infixr(">", 30);
            this.infixr(">=", 30);
            this.prefix("not", 23);
            this.infixr("and", 22);
            this.infixr("or", 21);
            this.infixr("xor", 20);
            this.prefix("#", 10); // priority ok?
            this.symbol("fn", this.fnFn); // separate fn
        };
        // http://crockford.com/javascript/tdop/tdop.html (old: http://javascript.crockford.com/tdop/tdop.html)
        // http://crockford.com/javascript/tdop/parse.js
        // Operator precedence parsing
        //
        // Operator: With left binding power (lbp) and operational function.
        // Manipulates tokens to its left (e.g: +)? => left denotative function led(), otherwise null denotative function nud()), (e.g. unary -)
        // identifiers, numbers: also nud.
        BasicParser.prototype.parse = function (tokens, allowDirect) {
            this.tokens = tokens;
            this.allowDirect = allowDirect || false;
            // line
            this.line = "0"; // for error messages
            this.index = 0;
            this.token = {};
            this.previousToken = this.token; // just to avoid warning
            var parseTree = this.parseTree;
            parseTree.length = 0;
            this.advance();
            while (this.token.type !== "(end)") {
                parseTree.push(this.basicLine());
            }
            return parseTree;
        };
        BasicParser.parameterTypes = {
            c: "command",
            f: "function",
            o: "operator",
            n: "number",
            s: "string",
            l: "line number",
            q: "line number range",
            v: "variable",
            r: "letter or range",
            a: "any parameter",
            "n0?": "optional parameter with default null",
            "#": "stream"
        };
        // first letter: c=command, f=function, o=operator, x=additional keyword for command
        // following are arguments: n=number, s=string, l=line number (checked), v=variable (checked), r=letter or range, a=any, n0?=optional parameter with default null, #=stream, #0?=optional stream with default 0; suffix ?=optional (optionals must be last); last *=any number of arguments may follow
        BasicParser.keywords = {
            abs: "f n",
            after: "c",
            afterGosub: "c n n?",
            and: "o",
            asc: "f s",
            atn: "f n",
            auto: "c n0? n0?",
            bin$: "f n n?",
            border: "c n n?",
            "break": "x",
            call: "c n *",
            cat: "c",
            chain: "c s n?",
            chainMerge: "c s n? *",
            chr$: "f n",
            cint: "f n",
            clear: "c",
            clearInput: "c",
            clg: "c n?",
            closein: "c",
            closeout: "c",
            cls: "c #0?",
            cont: "c",
            copychr$: "f #",
            cos: "f n",
            creal: "f n",
            cursor: "c #0? n0? n?",
            data: "c n0*",
            dec$: "f n s",
            def: "c s *",
            defint: "c r r*",
            defreal: "c r r*",
            defstr: "c r r*",
            deg: "c",
            "delete": "c q?",
            derr: "f",
            di: "c",
            dim: "c v *",
            draw: "c n n n0? n?",
            drawr: "c n n n0? n?",
            edit: "c l",
            ei: "c",
            "else": "c",
            end: "c",
            ent: "c n *",
            env: "c n *",
            eof: "f",
            erase: "c v *",
            erl: "f",
            err: "f",
            error: "c n",
            every: "c",
            everyGosub: "c n n?",
            exp: "f n",
            fill: "c n",
            fix: "f n",
            fn: "x",
            "for": "c",
            frame: "c",
            fre: "f a",
            gosub: "c l",
            "goto": "c l",
            graphics: "c",
            graphicsPaper: "x n",
            graphicsPen: "x n0? n?",
            hex$: "f n n?",
            himem: "f",
            "if": "c",
            ink: "c n n n?",
            inkey: "f n",
            inkey$: "f",
            inp: "f n",
            input: "c #0? *",
            instr: "f a a a?",
            "int": "f n",
            joy: "f n",
            key: "c n s",
            keyDef: "c n n n? n? n?",
            left$: "f s n",
            len: "f s",
            let: "c",
            line: "c",
            lineInput: "c #0? *",
            list: "c q0? #0?",
            load: "c s n?",
            locate: "c #0? n n",
            log: "f n",
            log10: "f n",
            lower$: "f s",
            mask: "c n0? n?",
            max: "f n *",
            memory: "c n",
            merge: "c s",
            mid$: "f s n n?",
            mid$Assign: "f s n n?",
            min: "f n *",
            mod: "o",
            mode: "c n",
            move: "c n n n0? n?",
            mover: "c n n n0? n?",
            "new": "c",
            next: "c v*",
            not: "o",
            on: "c",
            onBreakCont: "c",
            onBreakGosub: "c l",
            onBreakStop: "c",
            onErrorGoto: "c l",
            onGosub: "c l l*",
            onGoto: "c l l*",
            onSqGosub: "c l",
            openin: "c s",
            openout: "c s",
            or: "o",
            origin: "c n n n? n? n? n?",
            out: "c n n",
            paper: "c #0? n",
            peek: "f n",
            pen: "c #0? n0 n?",
            pi: "f",
            plot: "c n n n0? n?",
            plotr: "c n n n0? n?",
            poke: "c n n",
            pos: "f #",
            print: "c #0? *",
            rad: "c",
            randomize: "c n?",
            read: "c v v*",
            release: "c n",
            rem: "c s?",
            remain: "f n",
            renum: "c n0? n0? n?",
            restore: "c l?",
            resume: "c l?",
            resumeNext: "c",
            "return": "c",
            right$: "f s n",
            rnd: "f n?",
            round: "f n n?",
            run: "c a?",
            save: "c s a? n? n? n?",
            sgn: "f n",
            sin: "f n",
            sound: "c n n n? n0? n0? n0? n?",
            space$: "f n",
            spc: "f n",
            speed: "c",
            speedInk: "c n n",
            speedKey: "c n n",
            speedWrite: "c n",
            sq: "f n",
            sqr: "f n",
            step: "x",
            stop: "c",
            str$: "f n",
            string$: "f n a",
            swap: "x n n?",
            symbol: "c n n *",
            symbolAfter: "c n",
            tab: "f n",
            tag: "c #0?",
            tagoff: "c #0?",
            tan: "f n",
            test: "f n n",
            testr: "f n n",
            then: "x",
            time: "f",
            to: "x",
            troff: "c",
            tron: "c",
            unt: "f n",
            upper$: "f s",
            using: "x",
            val: "f s",
            vpos: "f #",
            wait: "c n n n?",
            wend: "c",
            "while": "c n",
            width: "c n",
            window: "c #0? n n n n",
            windowSwap: "c n n?",
            write: "c #0? *",
            xor: "o",
            xpos: "f",
            ypos: "f",
            zone: "c n",
            _rsx1: "c a a*" // |<rsxName>[, <argument list>] dummy with at least one parameter
        };
        /* eslint-enable no-invalid-this */
        BasicParser.closeTokens = {
            ":": 1,
            "(eol)": 1,
            "(end)": 1,
            "else": 1,
            rem: 1,
            "'": 1
        };
        BasicParser.brackets = {
            "(": ")",
            "[": "]"
        };
        return BasicParser;
    }());
    exports.BasicParser = BasicParser;
});
//# sourceMappingURL=BasicParser.js.map