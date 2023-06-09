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
            this.quiet = false;
            this.keepBrackets = false;
            this.keepColons = false;
            this.keepDataComma = false;
            this.keepTokens = false;
            this.label = "0"; // for error messages
            this.symbols = {};
            // set also during parse
            this.tokens = [];
            this.index = 0;
            this.parseTree = [];
            this.statementList = []; // just to check last statement when generating error message
            /* eslint-disable no-invalid-this */
            this.specialStatements = {
                "'": this.apostrophe,
                "|": this.rsx,
                after: this.afterEveryGosub,
                chain: this.chain,
                clear: this.clear,
                data: this.data,
                def: this.def,
                "else": this.fnElse,
                ent: this.entOrEnv,
                env: this.entOrEnv,
                every: this.afterEveryGosub,
                "for": this.fnFor,
                graphics: this.graphics,
                "if": this.fnIf,
                input: this.input,
                key: this.key,
                let: this.let,
                line: this.line,
                mid$: this.mid$Assign,
                on: this.on,
                print: this.print,
                "?": this.question,
                resume: this.resume,
                run: this.run,
                speed: this.speed,
                symbol: this.symbol,
                window: this.window,
                write: this.write
            };
            if (options) {
                this.setOptions(options);
            }
            this.fnGenerateSymbols();
            this.previousToken = {}; // to avoid warnings
            this.token = this.previousToken;
        }
        BasicParser.prototype.setOptions = function (options) {
            if (options.keepBrackets !== undefined) {
                this.keepBrackets = options.keepBrackets;
            }
            if (options.keepColons !== undefined) {
                this.keepColons = options.keepColons;
            }
            if (options.keepDataComma !== undefined) {
                this.keepDataComma = options.keepDataComma;
            }
            if (options.keepTokens !== undefined) {
                this.keepTokens = options.keepTokens;
            }
            if (options.quiet !== undefined) {
                this.quiet = options.quiet;
            }
        };
        BasicParser.prototype.composeError = function (error, message, value, pos, len) {
            len = value === "(end)" ? 0 : len;
            return Utils_1.Utils.composeError("BasicParser", error, message, value, pos, len, this.label || undefined);
        };
        BasicParser.prototype.fnLastStatementIsOnErrorGotoX = function () {
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
        BasicParser.prototype.fnMaskedError = function (node, message) {
            if (!this.fnLastStatementIsOnErrorGotoX()) {
                throw this.composeError(Error(), message, node.value, node.pos);
            }
            else if (!this.quiet) {
                Utils_1.Utils.console.warn(this.composeError({}, message, node.value, node.pos).message);
            }
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
        BasicParser.prototype.advance = function (id) {
            var token = this.token;
            this.previousToken = this.token;
            if (id && id !== token.type) {
                if (!this.fnLastStatementIsOnErrorGotoX()) {
                    throw this.composeError(Error(), "Expected " + id, token.value === "" ? token.type : token.value, token.pos); //TTT we cannot mask this error because advance is very generic
                }
                else if (!this.quiet) {
                    Utils_1.Utils.console.warn(this.composeError({}, "Expected " + id, token.value === "" ? token.type : token.value, token.pos).message);
                }
            }
            token = this.tokens[this.index]; // we get a lex token and reuse it as parseTree token
            if (!token) { // should not occur
                Utils_1.Utils.console.error(this.composeError({}, "advance: End of file", "", this.token && this.token.pos).message);
                return this.token; // old token
            }
            this.index += 1;
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
            if (t.type === "(end)") {
                throw this.composeError(Error(), "Unexpected end of file", "", t.pos);
            }
            this.advance();
            if (!s.nud) {
                throw this.composeError(Error(), "Unexpected token", t.value, t.pos);
            }
            var left = s.nud(t); // process literals, variables, and prefix operators
            t = this.token;
            s = this.symbols[t.type];
            while (rbp < (s.lbp || 0)) { // as long as the right binding power is less than the left binding power of the next token...
                this.advance();
                if (!s.led) {
                    throw this.composeError(Error(), "Unexpected token", t.type, t.pos);
                    // TODO: How to get this error?
                }
                left = s.led(left); // ...the led method is invoked on the following token (infix and suffix operators), can be recursive
                t = this.token;
                s = this.symbols[t.type];
            }
            return left;
        };
        BasicParser.prototype.fnCheckExpressionType = function (expression, expectedType, typeFirstChar) {
            if (expression.type !== expectedType) {
                this.fnMaskedError(expression, "Expected " + BasicParser.parameterTypes[typeFirstChar]);
            }
        };
        BasicParser.prototype.assignment = function () {
            this.fnCheckExpressionType(this.token, "identifier", "v");
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
                return s.std();
            }
            var value;
            if (t.type === "identifier") {
                value = this.assignment();
            }
            else {
                value = this.expression(0);
            }
            if (value.type !== "assign" && value.type !== "fcall" && value.type !== "def" && value.type !== "(" && value.type !== "[") {
                this.fnMaskedError(t, "Bad expression statement");
            }
            return value;
        };
        BasicParser.prototype.statements = function (closeTokens) {
            var statementList = [];
            this.statementList = statementList; // fast hack to access last statement for error messages
            var colonExpected = false;
            while (!closeTokens[this.token.type]) {
                if (colonExpected || this.token.type === ":") {
                    if (this.token.type !== "'" && this.token.type !== "else") { // no colon required for line comment or ELSE
                        this.advance(":");
                        if (this.keepColons) {
                            statementList.push(this.previousToken);
                        }
                    }
                    colonExpected = false;
                }
                else {
                    statementList.push(this.statement());
                    colonExpected = true;
                }
            }
            return statementList;
        };
        BasicParser.prototype.basicLine = function () {
            var node;
            if (this.token.type !== "number") {
                node = BasicParser.fnCreateDummyArg("label", "");
                node.pos = this.token.pos;
            }
            else {
                this.advance();
                node = this.previousToken; // number token
                node.type = "label"; // number => label
            }
            this.label = node.value; // set line number for error messages
            node.args = this.statements(BasicParser.closeTokensForLine);
            if (this.token.type === "(eol)") {
                if (this.keepTokens) { // not really a token
                    if (this.token.ws) {
                        node.args.push(this.token); // eol token with whitespace
                    }
                }
                this.advance();
            }
            return node;
        };
        BasicParser.fnCreateDummyArg = function (type, value) {
            return {
                type: type,
                value: value !== undefined ? value : type,
                pos: 0,
                len: 0
            };
        };
        BasicParser.prototype.fnCombineTwoTokensNoArgs = function (token2) {
            var node = this.previousToken, name = node.type + Utils_1.Utils.stringCapitalize(this.token.type); // e.g ."speedInk"
            node.value += (this.token.ws || " ") + this.token.value; // combine values of both
            this.token = this.advance(token2); // for "speed" e.g. "ink", "key", "write" (this.token.type)
            if (this.keepTokens) {
                if (!node.right) {
                    node.right = this.previousToken; // set second token in first token
                }
                else { // e.g. on break...
                    node.right.right = this.previousToken;
                }
            }
            this.previousToken = node; // fast hack to get e.g. "speed" token
            return name;
        };
        BasicParser.prototype.fnCombineTwoTokens = function (token2) {
            return this.fnCreateCmdCallForType(this.fnCombineTwoTokensNoArgs(token2));
        };
        BasicParser.prototype.fnGetOptionalStream = function () {
            var node;
            if (this.token.type === "#") { // stream?
                node = this.expression(0);
            }
            else { // create dummy
                node = BasicParser.fnCreateDummyArg("#"); // dummy stream
                node.right = BasicParser.fnCreateDummyArg("null", "0"); // ...with dummy parameter
            }
            return node;
        };
        BasicParser.prototype.fnChangeNumber2LineNumber = function (node) {
            this.fnCheckExpressionType(node, "number", "l");
            node.type = "linenumber"; // change type: number => linenumber
        };
        BasicParser.prototype.fnGetLineRange = function () {
            var left;
            if (this.token.type === "number") {
                left = this.token;
                this.advance();
                this.fnChangeNumber2LineNumber(left);
            }
            var range;
            if (this.token.type === "-") {
                range = this.token;
                this.advance();
            }
            if (range) {
                var right = void 0;
                if (this.token.type === "number") {
                    right = this.token;
                    this.advance();
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
                throw this.composeError(Error(), "Programming error: Undefined range", this.token.value, this.token.pos);
            }
            return range;
        };
        BasicParser.fnIsSingleLetterIdentifier = function (node) {
            return node.type === "identifier" && !node.args && node.value.length === 1;
        };
        BasicParser.prototype.fnGetLetterRange = function (typeFirstChar) {
            this.fnCheckExpressionType(this.token, "identifier", typeFirstChar);
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
                this.fnMaskedError(expression, "Expected " + BasicParser.parameterTypes[typeFirstChar]);
            }
            return expression;
        };
        BasicParser.prototype.fnCheckRemainingTypes = function (types) {
            for (var i = 0; i < types.length; i += 1) { // some more parameters expected?
                var type = types[i];
                if (!type.endsWith("?") && !type.endsWith("*")) { // mandatory?
                    var text = BasicParser.parameterTypes[type] || ("parameter " + type);
                    this.fnMaskedError(this.token, "Expected " + text + " for " + this.previousToken.type);
                }
            }
        };
        BasicParser.prototype.fnCheckStaticTypeNotNumber = function (expression, typeFirstChar) {
            var type = expression.type, isStringFunction = (BasicParser.keywords[type] || "").startsWith("f") && type.endsWith("$"), isStringIdentifier = type === "identifier" && expression.value.endsWith("$");
            if (type === "string" || type === "#" || isStringFunction || isStringIdentifier) { // got a string or a stream? (statical check)
                this.fnMaskedError(expression, "Expected " + BasicParser.parameterTypes[typeFirstChar]);
            }
        };
        BasicParser.prototype.fnCheckStaticTypeNotString = function (expression, typeFirstChar) {
            var type = expression.type, isNumericFunction = (BasicParser.keywords[type] || "").startsWith("f") && !type.endsWith("$"), isNumericIdentifier = type === "identifier" && (expression.value.endsWith("%") || expression.value.endsWith("!")), isComparison = type === "=" || type.startsWith("<") || type.startsWith(">"); // =, <, >, <=, >=
            if (type === "number" || type === "binnumber" || type === "hexnumber" || type === "expnumber" || type === "#" || isNumericFunction || isNumericIdentifier || isComparison) { // got e.g. number or a stream? (statical check)
                this.fnMaskedError(expression, "Expected " + BasicParser.parameterTypes[typeFirstChar]);
            }
        };
        BasicParser.prototype.fnGetExpressionForType = function (args, type, types) {
            var typeFirstChar = type.charAt(0), separator = ",";
            var expression, suppressAdvance = false;
            switch (typeFirstChar) {
                case "#": // stream expected? (for functions)
                    if (type === "#0?") { // optional stream?
                        if (this.token.type !== "#") { // no stream?
                            suppressAdvance = true;
                            type = ",";
                        }
                        expression = this.fnGetOptionalStream();
                    }
                    else {
                        expression = this.expression(0);
                        this.fnCheckExpressionType(expression, "#", typeFirstChar); // check that it is a stream and not a number
                    }
                    break;
                case "l":
                    expression = this.expression(0);
                    this.fnCheckExpressionType(expression, "number", typeFirstChar);
                    this.fnChangeNumber2LineNumber(expression);
                    break;
                case "v": // variable (identifier)
                    expression = this.expression(0);
                    this.fnCheckExpressionType(expression, "identifier", typeFirstChar);
                    break;
                case "r": // letter or range of letters (defint, defreal, defstr)
                    expression = this.fnGetLetterRange(typeFirstChar);
                    break;
                case "q": // line number range
                    if (type !== "q0?") { // optional line number range
                        throw this.composeError(Error(), "Programming error: Unexpected line range type", this.token.type, this.token.pos); // should not occur
                    }
                    if (this.token.type === "number" || this.token.type === "-") {
                        expression = this.fnGetLineRange();
                    }
                    else {
                        expression = BasicParser.fnCreateDummyArg("null");
                        if (types.length) {
                            type = ","; // needMore=true, maybe take it as next parameter
                        }
                    }
                    break;
                case "n": // number"
                    if (type.substring(0, 2) === "n0" && this.token.type === separator) { // n0 or n0?: if parameter not specified, insert default value null?
                        expression = BasicParser.fnCreateDummyArg("null");
                    }
                    else {
                        expression = this.expression(0);
                        this.fnCheckStaticTypeNotNumber(expression, typeFirstChar);
                    }
                    break;
                case "s": // string
                    expression = this.expression(0);
                    this.fnCheckStaticTypeNotString(expression, typeFirstChar);
                    break;
                default:
                    expression = this.expression(0);
                    if (expression.type === "#") { // got stream?
                        this.fnMaskedError(expression, "Unexpected stream");
                    }
                    break;
            }
            args.push(expression);
            if (this.token.type === separator) {
                if (!suppressAdvance) {
                    this.advance(separator);
                    if (this.keepTokens) {
                        args.push(this.previousToken);
                    }
                }
                if (type.slice(-1) !== "*") {
                    type = "xxx"; // initial needMore
                }
            }
            else if (type !== ",") { // !needMore
                type = ""; // stop
            }
            return type;
        };
        BasicParser.prototype.fnGetArgs = function (args, keyword) {
            var keyOpts = BasicParser.keywords[keyword], types = keyOpts.split(" "), closeTokens = BasicParser.closeTokensForArgs;
            var type = "xxx"; // initial needMore
            types.shift(); // remove keyword type
            while (type && !closeTokens[this.token.type]) {
                if (types && type.slice(-1) !== "*") { // "*"= any number of parameters
                    type = types.shift() || "";
                    if (!type) {
                        this.fnMaskedError(this.previousToken, "Expected end of arguments"); // If masked, it will accept more args than expected
                    }
                }
                type = this.fnGetExpressionForType(args, type, types);
            }
            if (types.length) { // some more parameters expected?
                this.fnCheckRemainingTypes(types); // error if remaining mandatory args
                type = types[0];
                if (type === "#0?") { // null stream to add?
                    var expression = BasicParser.fnCreateDummyArg("#"); // dummy stream with dummy arg
                    expression.right = BasicParser.fnCreateDummyArg("null", "0");
                    args.push(expression);
                }
            }
            if (this.previousToken.type === "," && keyword !== "delete" && keyword !== "list") { // for line number range in delete, list it is ok
                this.fnMaskedError(this.previousToken, "Operand missing");
            }
            return args;
        };
        BasicParser.prototype.fnGetArgsSepByCommaSemi = function (args) {
            var closeTokens = BasicParser.closeTokensForArgs;
            while (!closeTokens[this.token.type]) {
                args.push(this.expression(0));
                if (this.token.type === "," || this.token.type === ";") {
                    args.push(this.token); // keep comma or semicolon
                    this.advance();
                }
                else {
                    break;
                }
            }
            return args;
        };
        BasicParser.prototype.fnGetArgsInParenthesis = function (args, keyword) {
            this.advance("(");
            if (this.keepTokens) {
                args.push(this.previousToken);
            }
            this.fnGetArgs(args, keyword || "_any1"); // until ")"
            this.advance(")");
            if (this.keepTokens) {
                args.push(this.previousToken);
            }
            return args;
        };
        BasicParser.prototype.fnGetArgsInParenthesesOrBrackets = function (args) {
            var brackets = BasicParser.brackets;
            this.advance(this.token.type === "[" ? "[" : "(");
            var bracketOpen = this.previousToken;
            args.push(bracketOpen);
            this.fnGetArgs(args, "_any1"); // until "]" or ")"
            this.advance(this.token.type === "]" ? "]" : ")");
            var bracketClose = this.previousToken;
            args.push(bracketClose);
            if (!this.quiet && (brackets[bracketOpen.type] !== bracketClose.type)) {
                Utils_1.Utils.console.warn(this.composeError({}, "Inconsistent bracket style", this.previousToken.value, this.previousToken.pos).message);
            }
            return args;
        };
        BasicParser.prototype.fnCreateCmdCall = function () {
            var node = this.previousToken;
            node.args = this.fnGetArgs([], node.type);
            return node;
        };
        BasicParser.prototype.fnCreateCmdCallForType = function (type) {
            if (type) {
                this.previousToken.type = type; // override
            }
            return this.fnCreateCmdCall();
        };
        BasicParser.prototype.fnCreateFuncCall = function () {
            var node = this.previousToken;
            node.args = [];
            if (this.token.type === "(") { // args in parenthesis?
                this.advance("(");
                if (this.keepTokens) {
                    node.args.push(this.previousToken);
                }
                this.fnGetArgs(node.args, node.type);
                this.advance(")");
                if (this.keepTokens) {
                    node.args.push(this.previousToken);
                }
            }
            else { // no parenthesis?
                // if we have a check, make sure there are no non-optional parameters left
                var keyOpts = BasicParser.keywords[node.type];
                if (keyOpts) {
                    var types = keyOpts.split(" ");
                    types.shift(); // remove key
                    this.fnCheckRemainingTypes(types);
                }
            }
            return node;
        };
        // ...
        BasicParser.prototype.fnIdentifier = function () {
            var node = this.previousToken;
            if (this.token.type === "(" || this.token.type === "[") {
                node.args = [];
                this.fnGetArgsInParenthesesOrBrackets(node.args);
            }
            return node;
        };
        BasicParser.prototype.fnParenthesis = function () {
            var node;
            if (this.keepBrackets) {
                node = this.previousToken;
                node.args = [
                    this.expression(0),
                    this.token // ")" (hopefully)
                ];
            }
            else {
                node = this.expression(0);
            }
            this.advance(")");
            return node;
        };
        BasicParser.prototype.fnFn = function () {
            var node = this.previousToken;
            node.args = [];
            this.token = this.advance("identifier");
            node.left = this.previousToken;
            if (this.token.type === "(") { // optional args?
                this.fnGetArgsInParenthesis(node.args);
            }
            return node;
        };
        BasicParser.prototype.apostrophe = function () {
            return this.fnCreateCmdCallForType("rem");
        };
        BasicParser.prototype.rsx = function () {
            var node = this.previousToken;
            node.args = [];
            var type = "_any1"; // expect any number of arguments
            if (this.token.type === ",") { // arguments starting with comma
                this.advance();
                type = "_rsx1"; // dummy token: expect at least 1 argument
            }
            this.fnGetArgs(node.args, type); // get arguments
            return node;
        };
        BasicParser.prototype.afterEveryGosub = function () {
            var node = this.fnCreateCmdCallForType(this.previousToken.type + "Gosub"); // "afterGosub" or "everyGosub", interval and optional timer
            if (!node.args) {
                throw this.composeError(Error(), "Programming error: Undefined args", this.token.type, this.token.pos); // should not occur
            }
            if (node.args.length < 2) { // add default timer 0
                node.args.push(BasicParser.fnCreateDummyArg("null"));
            }
            this.advance("gosub");
            if (this.keepTokens) {
                node.args.push(this.previousToken);
            }
            this.fnGetArgs(node.args, "gosub"); // line number
            return node;
        };
        BasicParser.prototype.chain = function () {
            var node = this.previousToken;
            if (this.token.type === "merge") { // chain merge?
                var name_1 = this.fnCombineTwoTokensNoArgs(this.token.type); // chainMerge
                node.type = name_1;
            }
            if (!node.args) {
                node.args = [];
            }
            // chain, chain merge with optional DELETE
            var value2 = this.expression(0); // filename
            node.args.push(value2);
            this.token = this.getToken();
            if (this.token.type === ",") {
                this.token = this.advance();
                if (this.keepTokens) {
                    node.args.push(this.previousToken);
                }
                var numberExpression = false; // line number (expression) found
                if (this.token.type !== "," && this.token.type !== "(eol)" && this.token.type !== "(eof)") {
                    value2 = this.expression(0); // line number or expression
                    node.args.push(value2);
                    numberExpression = true;
                }
                if (this.token.type === ",") {
                    this.advance();
                    if (this.keepTokens) {
                        node.args.push(this.previousToken);
                    }
                    if (!numberExpression) {
                        value2 = BasicParser.fnCreateDummyArg("null"); // insert dummy arg for line
                        node.args.push(value2);
                    }
                    this.advance("delete");
                    if (this.keepTokens) {
                        node.args.push(this.previousToken);
                    }
                    this.fnGetArgs(node.args, this.previousToken.type); // args for "delete"
                }
            }
            return node;
        };
        BasicParser.prototype.clear = function () {
            var tokenType = this.token.type;
            return tokenType === "input" ? this.fnCombineTwoTokens(tokenType) : this.fnCreateCmdCall(); // "clear input" or "clear"
        };
        BasicParser.prototype.data = function () {
            var node = this.previousToken;
            var parameterFound = false;
            node.args = [];
            // data is special: it can have empty parameters, also the last parameter, and also if no parameters
            if (this.token.type !== "," && this.token.type !== "(eol)" && this.token.type !== "(end)") {
                node.args.push(this.expression(0)); // take first argument
                parameterFound = true;
            }
            while (this.token.type === ",") {
                if (!parameterFound) {
                    node.args.push(BasicParser.fnCreateDummyArg("null")); // insert null parameter
                }
                this.token = this.advance();
                if (this.keepDataComma) {
                    node.args.push(this.previousToken); // ","
                }
                parameterFound = false;
                if (this.token.type === "(eol)" || this.token.type === "(end)") {
                    break;
                }
                else if (this.token.type !== ",") {
                    node.args.push(this.expression(0));
                    parameterFound = true;
                }
            }
            if (!parameterFound) {
                node.args.push(BasicParser.fnCreateDummyArg("null")); // insert null parameter
            }
            return node;
        };
        BasicParser.prototype.def = function () {
            var node = this.previousToken;
            node.args = [];
            this.advance("fn");
            if (this.keepTokens) {
                node.left = this.previousToken;
            }
            this.token = this.advance("identifier");
            if (node.left) { // keepTokens
                node.left.left = this.previousToken;
            }
            else {
                node.left = this.previousToken;
            }
            if (this.token.type === "(") {
                this.fnGetArgsInParenthesis(node.args, "_vars1"); // accept only variable names
            }
            this.advance("=");
            if (this.keepTokens) {
                node.args.push(this.previousToken);
            }
            node.right = this.expression(0);
            return node;
        };
        BasicParser.prototype.fnElse = function () {
            var node = this.previousToken;
            node.args = [];
            if (!this.quiet) {
                Utils_1.Utils.console.warn(this.composeError({}, "ELSE: Weird use of ELSE", this.previousToken.type, this.previousToken.pos).message);
            }
            if (this.token.type === "number") { // first token number?
                this.fnChangeNumber2LineNumber(this.token);
            }
            // TODO: data line as separate statement is taken
            while (this.token.type !== "(eol)" && this.token.type !== "(end)") {
                node.args.push(this.token); // collect tokens unchecked, may contain syntax error
                this.advance();
            }
            return node;
        };
        BasicParser.prototype.entOrEnv = function () {
            var node = this.previousToken;
            node.args = [];
            node.args.push(this.expression(0)); // should be number or variable
            var count = 0;
            while (this.token.type === ",") {
                this.token = this.advance();
                if (this.keepTokens) {
                    node.args.push(this.previousToken);
                }
                if (this.token.type === "=" && count % 3 === 0) { // special handling for parameter "number of steps"
                    this.advance();
                    if (this.keepTokens) {
                        node.args.push(this.previousToken);
                    }
                    node.args.push(BasicParser.fnCreateDummyArg("null")); // insert null parameter
                    count += 1;
                }
                var expression = this.expression(0);
                node.args.push(expression);
                count += 1;
            }
            return node;
        };
        BasicParser.prototype.fnFor = function () {
            var node = this.previousToken;
            this.fnCheckExpressionType(this.token, "identifier", "v");
            var name = this.expression(90); // take simple identifier, nothing more
            this.fnCheckExpressionType(name, "identifier", "v"); // expected simple
            node.args = [name];
            this.advance("=");
            if (this.keepTokens) {
                node.args.push(this.previousToken);
            }
            node.args.push(this.expression(0));
            this.token = this.advance("to");
            if (this.keepTokens) {
                node.args.push(this.previousToken);
            }
            node.args.push(this.expression(0));
            if (this.token.type === "step") {
                this.advance();
                if (this.keepTokens) {
                    node.args.push(this.previousToken);
                }
                node.args.push(this.expression(0));
            }
            return node;
        };
        BasicParser.prototype.graphics = function () {
            var tokenType = this.token.type;
            if (tokenType !== "pen" && tokenType !== "paper") {
                throw this.composeError(Error(), "Expected PEN or PAPER", tokenType, this.token.pos);
            }
            return this.fnCombineTwoTokens(tokenType);
        };
        BasicParser.prototype.fnCheckForUnreachableCode = function (args) {
            for (var i = 0; i < args.length; i += 1) {
                var node = args[i], tokenType = node.type;
                if ((i === 0 && tokenType === "linenumber") || tokenType === "goto" || tokenType === "stop") {
                    var index = i + 1;
                    if (index < args.length && (args[index].type !== "rem")) {
                        if (args[index].type === ":" && this.keepColons) {
                            // ignore
                        }
                        else if (!this.quiet) {
                            Utils_1.Utils.console.warn(this.composeError({}, "IF: Unreachable code after THEN or ELSE", tokenType, node.pos).message);
                        }
                        break;
                    }
                }
            }
        };
        BasicParser.prototype.fnIf = function () {
            var node = this.previousToken;
            var thenToken, elseToken, numberToken;
            node.left = this.expression(0);
            if (this.token.type !== "goto") { // no "goto", expect "then" token...
                this.advance("then");
                thenToken = this.previousToken;
                if (this.token.type === "number") {
                    numberToken = this.fnGetArgs([], "goto"); // take number parameter as line number
                }
            }
            node.args = this.statements(BasicParser.closeTokensForLineAndElse); // get "then" statements until "else" or eol
            if (numberToken) {
                node.args.unshift(numberToken[0]);
                numberToken = undefined;
            }
            if (this.keepTokens && thenToken) {
                node.args.unshift(thenToken);
            }
            this.fnCheckForUnreachableCode(node.args);
            if (this.token.type === "else") {
                this.token = this.advance("else");
                elseToken = this.previousToken;
                if (this.token.type === "number") {
                    numberToken = this.fnGetArgs([], "goto"); // take number parameter as line number
                }
                node.args2 = this.token.type === "if" ? [this.statement()] : this.statements(BasicParser.closeTokensForLineAndElse);
                if (numberToken) {
                    node.args2.unshift(numberToken[0]);
                }
                if (this.keepTokens && elseToken) {
                    elseToken.args = [];
                    node.args2.unshift(elseToken);
                }
                this.fnCheckForUnreachableCode(node.args2);
            }
            return node;
        };
        BasicParser.prototype.input = function () {
            var node = this.previousToken, stream = this.fnGetOptionalStream();
            node.args = [];
            node.args.push(stream);
            if (stream.len !== 0) { // not an inserted stream?
                this.advance(",");
                if (this.keepTokens) {
                    node.args.push(this.previousToken);
                }
            }
            if (this.token.type === ";") { // no newline after input?
                node.args.push(this.token);
                this.advance();
            }
            else {
                node.args.push(BasicParser.fnCreateDummyArg("null"));
            }
            if (this.token.type === "string") { // message
                node.args.push(this.token);
                this.token = this.advance();
                if (this.token.type === ";" || this.token.type === ",") { // ";" => need to append prompt "? " , "," = no prompt
                    node.args.push(this.token);
                    this.advance();
                }
                else {
                    throw this.composeError(Error(), "Expected ; or ,", this.token.type, this.token.pos);
                }
            }
            else {
                node.args.push(BasicParser.fnCreateDummyArg("null")); // dummy message
                node.args.push(BasicParser.fnCreateDummyArg("null")); // dummy prompt
            }
            do { // we need loop for input
                var value2 = this.expression(90); // we expect "identifier", no fnxx
                this.fnCheckExpressionType(value2, "identifier", "v");
                node.args.push(value2);
                if (node.type === "lineInput" || this.token.type !== ",") {
                    break; // no loop for lineInput (only one arg) or no more args
                }
                this.advance(",");
                if (this.keepTokens) {
                    node.args.push(this.previousToken);
                }
            } while (true); // eslint-disable-line no-constant-condition
            return node;
        };
        BasicParser.prototype.key = function () {
            var tokenType = this.token.type;
            return tokenType === "def" ? this.fnCombineTwoTokens(tokenType) : this.fnCreateCmdCall(); // "key def" or "key"
        };
        BasicParser.prototype.let = function () {
            var node = this.previousToken;
            node.right = this.assignment();
            return node;
        };
        BasicParser.prototype.line = function () {
            this.previousToken.type = this.fnCombineTwoTokensNoArgs("input"); // combine "line" => "lineInput"
            return this.input(); // continue with input
        };
        BasicParser.prototype.mid$Assign = function () {
            this.previousToken.type = "mid$Assign"; // change type mid$ => mid$Assign
            var node = this.fnCreateFuncCall();
            if (!node.args) {
                throw this.composeError(Error(), "Programming error: Undefined args", this.token.type, this.token.pos); // should not occur
            }
            // check that first argument is a variable...
            var i = 0;
            if (this.keepTokens) {
                while (node.args[i].type === "(" && i < (node.args.length - 1)) {
                    i += 1;
                }
            }
            this.fnCheckExpressionType(node.args[i], "identifier", "v");
            this.advance("="); // equal as assignment
            if (this.keepTokens) {
                node.args.push(this.previousToken);
            }
            var right = this.expression(0);
            node.right = right;
            return node;
        };
        BasicParser.prototype.on = function () {
            var node = this.previousToken;
            var left;
            node.args = [];
            switch (this.token.type) {
                case "break":
                    this.previousToken.type = this.fnCombineTwoTokensNoArgs("break"); // onBreak
                    this.token = this.getToken();
                    if (this.token.type === "gosub" || this.token.type === "cont" || this.token.type === "stop") {
                        this.fnCombineTwoTokens(this.token.type); // onBreakGosub, onBreakCont, onBreakStop
                    }
                    else {
                        throw this.composeError(Error(), "Expected GOSUB, CONT or STOP", this.token.type, this.token.pos);
                    }
                    break;
                case "error": // on error goto
                    this.previousToken.type = this.fnCombineTwoTokensNoArgs("error"); // onError..
                    this.fnCombineTwoTokens("goto"); // onErrorGoto
                    break;
                case "sq": // on sq(n) gosub
                    left = this.expression(0);
                    if (!left.args) {
                        throw this.composeError(Error(), "Programming error: Undefined args", this.token.type, this.token.pos); // should not occur
                    }
                    this.token = this.getToken();
                    this.advance("gosub");
                    if (this.keepTokens) {
                        node.args.push(this.previousToken);
                    }
                    node.type = "onSqGosub";
                    this.fnGetArgs(node.args, node.type);
                    node.args = left.args.concat(node.args); // we do not need "sq" token
                    break;
                default: // on <expr> goto|gosub
                    left = this.expression(0);
                    if (this.token.type === "gosub" || this.token.type === "goto") {
                        this.advance();
                        if (this.keepTokens) {
                            node.right = this.previousToken;
                        }
                        node.type = "on" + Utils_1.Utils.stringCapitalize(this.previousToken.type); // onGoto, onGosub
                        this.fnGetArgs(node.args, node.type);
                        node.left = left;
                    }
                    else {
                        throw this.composeError(Error(), "Expected GOTO or GOSUB", this.token.type, this.token.pos);
                    }
                    break;
            }
            return node;
        };
        BasicParser.prototype.print = function () {
            var node = this.previousToken, closeTokens = BasicParser.closeTokensForArgs, stream = this.fnGetOptionalStream();
            node.args = [];
            node.args.push(stream);
            if (stream.len !== 0) { // not an inserted stream?
                if (!closeTokens[this.token.type]) {
                    this.advance(",");
                    if (this.keepTokens) {
                        node.args.push(this.previousToken);
                    }
                }
            }
            while (!closeTokens[this.token.type]) {
                var node2 = void 0;
                if (this.token.type === "spc" || this.token.type === "tab") {
                    this.advance();
                    node2 = this.fnCreateFuncCall();
                }
                else if (this.token.type === "using") {
                    node2 = this.token;
                    node2.args = [];
                    this.advance();
                    node2.args.push(this.expression(0)); // format
                    this.advance(";"); // after the format there must be a ";"
                    node2.args.push(this.previousToken); // semicolon
                    node2.args = this.fnGetArgsSepByCommaSemi(node2.args);
                    if (this.previousToken.type === ";") { // using closed by ";"?
                        node2.args.pop(); // remove it from using
                        node.args.push(node2);
                        node2 = this.previousToken; // keep it for print
                    }
                }
                else if (this.token.type === ";" || this.token.type === ",") { // separator ";" or comma tab separator ","
                    node2 = this.token;
                    this.advance();
                }
                else {
                    node2 = this.expression(0);
                }
                node.args.push(node2);
            }
            return node;
        };
        BasicParser.prototype.question = function () {
            var node = this.print();
            node.type = "print";
            return node;
        };
        BasicParser.prototype.resume = function () {
            var tokenType = this.token.type;
            return tokenType === "next" ? this.fnCombineTwoTokens(tokenType) : this.fnCreateCmdCall(); // "resume next" or "resume"
        };
        BasicParser.prototype.run = function () {
            var node;
            if (this.token.type === "number") {
                node = this.previousToken;
                node.args = this.fnGetArgs([], "goto"); // we get linenumber arg as for goto
            }
            else {
                node = this.fnCreateCmdCall();
            }
            return node;
        };
        BasicParser.prototype.speed = function () {
            var tokenType = this.token.type;
            if (tokenType !== "ink" && tokenType !== "key" && tokenType !== "write") {
                throw this.composeError(Error(), "Expected INK, KEY or WRITE", tokenType, this.token.pos);
            }
            return this.fnCombineTwoTokens(tokenType);
        };
        BasicParser.prototype.symbol = function () {
            var tokenType = this.token.type;
            return tokenType === "after" ? this.fnCombineTwoTokens(tokenType) : this.fnCreateCmdCall(); // "symbol after" or "symbol"
        };
        BasicParser.prototype.window = function () {
            var tokenType = this.token.type;
            return tokenType === "swap" ? this.fnCombineTwoTokens(tokenType) : this.fnCreateCmdCall(); // "window swap" or "window"
        };
        BasicParser.prototype.write = function () {
            var node = this.previousToken, closeTokens = BasicParser.closeTokensForArgs, stream = this.fnGetOptionalStream();
            node.args = [];
            node.args.push(stream);
            if (stream.len !== 0) { // not an inserted stream?
                if (!closeTokens[this.token.type]) {
                    this.advance(",");
                    if (this.keepTokens) {
                        node.args.push(this.previousToken);
                    }
                }
            }
            var lengthBefore = node.args.length;
            this.fnGetArgsSepByCommaSemi(node.args);
            if ((this.previousToken.type === "," && node.args.length > lengthBefore) || this.previousToken.type === ";") {
                this.fnMaskedError(this.previousToken, "Operand missing");
            }
            return node;
        };
        // ---
        BasicParser.fnNode = function (node) {
            return node;
        };
        BasicParser.prototype.createSymbol = function (id) {
            if (!this.symbols[id]) { // some symbols are extended, e.g. symbols for both infix and prefix
                this.symbols[id] = {}; // create symbol
            }
            return this.symbols[id];
        };
        BasicParser.prototype.createNudSymbol = function (id, nud) {
            var symbol = this.createSymbol(id);
            symbol.nud = nud;
            return symbol;
        };
        BasicParser.prototype.fnInfixLed = function (left, rbp) {
            var node = this.previousToken;
            node.left = left;
            node.right = this.expression(rbp);
            return node;
        };
        BasicParser.prototype.createInfix = function (id, lbp, rbp) {
            var _this = this;
            var symbol = this.createSymbol(id);
            symbol.lbp = lbp;
            symbol.led = function (left) { return _this.fnInfixLed(left, rbp || lbp); };
        };
        BasicParser.prototype.createInfixr = function (id, lbp) {
            var _this = this;
            var symbol = this.createSymbol(id);
            symbol.lbp = lbp;
            symbol.led = function (left) { return _this.fnInfixLed(left, lbp - 1); };
        };
        BasicParser.prototype.fnPrefixNud = function (rbp) {
            var node = this.previousToken;
            node.right = this.expression(rbp);
            return node;
        };
        BasicParser.prototype.createPrefix = function (id, rbp) {
            var _this = this;
            this.createNudSymbol(id, function () { return _this.fnPrefixNud(rbp); });
        };
        BasicParser.prototype.createStatement = function (id, fn) {
            var _this = this;
            var symbol = this.createSymbol(id);
            symbol.std = function () { return fn.call(_this); };
            return symbol;
        };
        BasicParser.prototype.fnGenerateKeywordSymbols = function () {
            var _this = this;
            for (var key in BasicParser.keywords) {
                if (BasicParser.keywords.hasOwnProperty(key)) {
                    var keywordType = BasicParser.keywords[key].charAt(0);
                    if (keywordType === "f") {
                        this.createNudSymbol(key, function () { return _this.fnCreateFuncCall(); });
                    }
                    else if (keywordType === "c") {
                        this.createStatement(key, this.specialStatements[key] || this.fnCreateCmdCall);
                    }
                    else if (keywordType === "p") { // additional parts of command
                        this.createSymbol(key);
                    }
                }
            }
        };
        BasicParser.prototype.fnGenerateSymbols = function () {
            var _this = this;
            this.fnGenerateKeywordSymbols();
            // special statements ...
            this.createStatement("'", this.specialStatements["'"]);
            this.createStatement("|", this.specialStatements["|"]); // rsx
            this.createStatement("mid$", this.specialStatements.mid$); // mid$Assign (statement), combine with function
            this.createStatement("?", this.specialStatements["?"]); // "?" is same as print
            this.createSymbol(":");
            this.createSymbol(";");
            this.createSymbol(",");
            this.createSymbol(")");
            this.createSymbol("[");
            this.createSymbol("]");
            this.createSymbol("(eol)");
            this.createSymbol("(end)");
            this.createNudSymbol("number", BasicParser.fnNode);
            this.createNudSymbol("binnumber", BasicParser.fnNode);
            this.createNudSymbol("expnumber", BasicParser.fnNode);
            this.createNudSymbol("hexnumber", BasicParser.fnNode);
            this.createNudSymbol("linenumber", BasicParser.fnNode);
            this.createNudSymbol("string", BasicParser.fnNode);
            this.createNudSymbol("unquoted", BasicParser.fnNode);
            this.createNudSymbol("ws", BasicParser.fnNode); // optional whitespace
            this.createNudSymbol("identifier", function () { return _this.fnIdentifier(); });
            this.createNudSymbol("(", function () { return _this.fnParenthesis(); });
            this.createNudSymbol("fn", function () { return _this.fnFn(); }); // separate fn
            this.createPrefix("@", 95); // address of
            this.createInfix("^", 90, 80);
            this.createPrefix("+", 80); // + can be uses as prefix or infix
            this.createPrefix("-", 80); // - can be uses as prefix or infix
            this.createInfix("*", 70);
            this.createInfix("/", 70);
            this.createInfix("\\", 60); // integer division
            this.createInfix("mod", 50);
            this.createInfix("+", 40); // + can be uses as prefix or infix, so combine with prefix function
            this.createInfix("-", 40); // - can be uses as prefix or infix, so combine with prefix function
            this.createInfix("=", 30); // equal for comparison, left associative
            this.createInfix("<>", 30);
            this.createInfix("<", 30);
            this.createInfix("<=", 30);
            this.createInfix(">", 30);
            this.createInfix(">=", 30);
            this.createPrefix("not", 23);
            this.createInfixr("and", 22);
            this.createInfixr("or", 21);
            this.createInfixr("xor", 20);
            this.createPrefix("#", 10); // priority ok?
        };
        // http://crockford.com/javascript/tdop/tdop.html (old: http://javascript.crockford.com/tdop/tdop.html)
        // http://crockford.com/javascript/tdop/parse.js
        // Operator precedence parsing
        //
        // Operator: With left binding power (lbp) and operational function.
        // Manipulates tokens to its left (e.g: +)? => left denotative function led(), otherwise null denotative function nud()), (e.g. unary -)
        // identifiers, numbers: also nud.
        BasicParser.prototype.parse = function (tokens) {
            this.tokens = tokens;
            // line
            this.label = "0"; // for error messages
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
        // first letter: c=command, f=function, p=part of command, o=operator, x=misc
        // following are arguments: n=number, s=string, l=line number (checked), v=variable (checked), q=line number range, r=letter or range, a=any, n0?=optional parameter with default null, #=stream, #0?=optional stream with default 0; suffix ?=optional (optionals must be last); last *=any number of arguments may follow
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
            "break": "p",
            call: "c n *",
            cat: "c",
            chain: "c s n? *",
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
            "delete": "c q0?",
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
            max: "f a *",
            memory: "c n",
            merge: "c s",
            mid$: "f s n n?",
            mid$Assign: "f s n n?",
            min: "f a *",
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
            step: "p",
            stop: "c",
            str$: "f n",
            string$: "f n a",
            swap: "p n n?",
            symbol: "c n n *",
            symbolAfter: "c n",
            tab: "f n",
            tag: "c #0?",
            tagoff: "c #0?",
            tan: "f n",
            test: "f n n",
            testr: "f n n",
            then: "p",
            time: "f",
            to: "p",
            troff: "c",
            tron: "c",
            unt: "f n",
            upper$: "f s",
            using: "p",
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
            _rsx1: "c a a*",
            _any1: "x *",
            _vars1: "x v*" // dummy: any number of variables
        };
        /* eslint-enable no-invalid-this */
        BasicParser.closeTokensForLine = {
            "(eol)": 1,
            "(end)": 1
        };
        BasicParser.closeTokensForLineAndElse = {
            "(eol)": 1,
            "(end)": 1,
            "else": 1
        };
        BasicParser.closeTokensForArgs = {
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