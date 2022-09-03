// BasicLexer.ts - BASIC Lexer
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//
// BASIC lexer for Locomotive BASIC 1.1 for Amstrad CPC 6128
//
define(["require", "exports", "./Utils"], function (require, exports, Utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BasicLexer = void 0;
    var BasicLexer = /** @class */ (function () {
        function BasicLexer(options) {
            this.quiet = false;
            this.keepWhiteSpace = false;
            this.line = "0"; // for error messages
            this.takeNumberAsLinenumber = true; // first number in a line is assumed to be a line number
            this.input = ""; // input to analyze
            this.index = 0; // position in input
            this.tokens = [];
            this.whiteSpace = ""; // collected whitespace
            if (options) {
                this.setOptions(options);
            }
        }
        BasicLexer.prototype.setOptions = function (options) {
            this.quiet = options.quiet || false;
            this.keepWhiteSpace = options.keepWhiteSpace || false;
        };
        BasicLexer.prototype.composeError = function (error, message, value, pos) {
            return Utils_1.Utils.composeError("BasicLexer", error, message, value, pos, undefined, this.line);
        };
        BasicLexer.isOperatorOrStreamOrAddress = function (c) {
            return (/[+\-*/^=()[\],;:?\\@#]/).test(c);
        };
        BasicLexer.isComparison = function (c) {
            return (/[<>]/).test(c);
        };
        BasicLexer.isComparison2 = function (c) {
            return (/[<>=]/).test(c);
        };
        BasicLexer.isDigit = function (c) {
            return (/\d/).test(c);
        };
        BasicLexer.isSign = function (c) {
            return (/[+-]/).test(c);
        };
        BasicLexer.isBin = function (c) {
            return (/[01]/).test(c);
        };
        BasicLexer.isHex = function (c) {
            return (/[0-9A-Fa-f]/).test(c);
        };
        BasicLexer.isWhiteSpace = function (c) {
            return (/[ \r]/).test(c);
        };
        BasicLexer.isNotQuotes = function (c) {
            return c !== "" && c !== '"' && c !== "\n"; // quoted string must be in one line!
        };
        BasicLexer.isIdentifierStart = function (c) {
            return c !== "" && (/[A-Za-z]/).test(c); // cannot use complete [A-Za-z]+[\w]*[$%!]?
        };
        BasicLexer.isIdentifierMiddle = function (c) {
            return c !== "" && (/[A-Za-z0-9.]/).test(c);
        };
        BasicLexer.isIdentifierEnd = function (c) {
            return c !== "" && (/[$%!]/).test(c);
        };
        BasicLexer.isNotNewLine = function (c) {
            return c !== "" && c !== "\n";
        };
        BasicLexer.isUnquotedData = function (c) {
            return c !== "" && (/[^:,\r\n]/).test(c);
        };
        BasicLexer.prototype.testChar = function (add) {
            return this.input.charAt(this.index + add);
        };
        BasicLexer.prototype.getChar = function () {
            return this.input.charAt(this.index);
        };
        BasicLexer.prototype.advance = function () {
            this.index += 1;
            return this.getChar();
        };
        BasicLexer.prototype.advanceWhile = function (char, fn) {
            var token = "";
            do {
                token += char;
                char = this.advance();
            } while (fn(char));
            return token;
        };
        BasicLexer.prototype.debugCheckValue = function (type, value, pos, orig) {
            var origValue = orig || value, part = this.input.substr(pos, origValue.length);
            if (part !== origValue) {
                Utils_1.Utils.console.debug("BasicLexer:debugCheckValue:", type, part, "<>", origValue, "at pos", pos);
            }
        };
        BasicLexer.prototype.addToken = function (type, value, pos, orig) {
            var node = {
                type: type,
                value: value,
                pos: pos
            };
            if (orig !== undefined) {
                if (orig !== value) {
                    node.orig = orig;
                }
            }
            if (this.whiteSpace !== "") {
                node.ws = this.whiteSpace;
                this.whiteSpace = "";
            }
            if (Utils_1.Utils.debug > 1) {
                this.debugCheckValue(type, value, pos, node.orig); // check position of added value
            }
            this.tokens.push(node);
        };
        BasicLexer.prototype.fnParseExponentialNumber = function (char) {
            // we also try to check: [eE][+-]?\d+; because "E" could be ERR, ELSE,...
            var token = "";
            var char1 = this.testChar(1), char2 = this.testChar(2);
            if (BasicLexer.isDigit(char1) || (BasicLexer.isSign(char1) && BasicLexer.isDigit(char2))) { // so it is a number
                token += char; // take "E"
                char = this.advance();
                if (BasicLexer.isSign(char)) {
                    token += char; // take sign "+" or "-"
                    char = this.advance();
                }
                if (BasicLexer.isDigit(char)) {
                    token += this.advanceWhile(char, BasicLexer.isDigit);
                }
            }
            return token;
        };
        BasicLexer.prototype.fnParseNumber = function (char, startPos, startsWithDot) {
            var token = "";
            if (startsWithDot) {
                token = char;
                char = this.advance();
            }
            token += this.advanceWhile(char, BasicLexer.isDigit); // TODO: isDigitOrSpace: numbers may contain spaces!
            char = this.getChar();
            if (char === "." && !startsWithDot) {
                token += char;
                char = this.advance();
                if (BasicLexer.isDigit(char)) { // digits after dot?
                    token += this.advanceWhile(char, BasicLexer.isDigit);
                    char = this.getChar();
                }
            }
            if (char === "e" || char === "E") { // we also try to check: [eE][+-]?\d+; because "E" could be ERR, ELSE,...
                token += this.fnParseExponentialNumber(char);
            }
            token = token.trim(); // remove trailing spaces
            if (!isFinite(Number(token))) { // Infnity?
                throw this.composeError(Error(), "Number is too large or too small", token, startPos); // for a 64-bit double
            }
            var number = parseFloat(token);
            this.addToken("number", String(number), startPos, token); // store number as string
            if (this.takeNumberAsLinenumber) {
                this.takeNumberAsLinenumber = false;
                this.line = String(number); // save just for error message
            }
        };
        BasicLexer.prototype.fnParseCompleteLineForRemOrApostrophe = function (char, startPos) {
            if (BasicLexer.isNotNewLine(char)) {
                var token = this.advanceWhile(char, BasicLexer.isNotNewLine);
                char = this.getChar();
                this.addToken("unquoted", token, startPos);
            }
            return char;
        };
        BasicLexer.prototype.fnParseWhiteSpace = function (char) {
            var token = this.advanceWhile(char, BasicLexer.isWhiteSpace);
            if (this.keepWhiteSpace) {
                this.whiteSpace = token;
            }
        };
        BasicLexer.prototype.fnParseUnquoted = function (char, pos) {
            var reSpacesAtEnd = new RegExp(/\s+$/);
            var token = this.advanceWhile(char, BasicLexer.isUnquotedData);
            var match = reSpacesAtEnd.exec(token), endingSpaces = (match && match[0]) || "";
            token = token.trim(); // remove whitespace before and after; do we need this?
            this.addToken("unquoted", token, pos); // could be interpreted as string or number during runtime
            if (this.keepWhiteSpace) {
                this.whiteSpace = endingSpaces;
            }
        };
        BasicLexer.prototype.fnParseCompleteLineForData = function (char) {
            var pos;
            while (BasicLexer.isNotNewLine(char)) {
                if (BasicLexer.isWhiteSpace(char)) {
                    this.fnParseWhiteSpace(char);
                    char = this.getChar();
                }
                if (char === "\n") { // now newline?
                    break;
                }
                pos = this.index;
                if (char === '"') {
                    this.fnParseString(pos);
                    char = this.getChar();
                }
                else if (char === ",") { // empty argument?
                    // parser can insert dummy token
                }
                else {
                    this.fnParseUnquoted(char, pos);
                    char = this.getChar();
                }
                if (BasicLexer.isWhiteSpace(char)) {
                    this.fnParseWhiteSpace(char);
                    char = this.getChar();
                }
                if (char !== ",") {
                    break;
                }
                pos = this.index;
                this.addToken(char, char, pos); // ","
                char = this.advance();
                if (char === "\r") { // IE8 has "/r/n" newlines
                    char = this.advance();
                }
            }
        };
        BasicLexer.prototype.fnParseIdentifier = function (char, startPos) {
            var token = char;
            char = this.advance();
            if (BasicLexer.isIdentifierMiddle(char)) {
                token += this.advanceWhile(char, BasicLexer.isIdentifierMiddle);
                char = this.getChar();
            }
            if (BasicLexer.isIdentifierEnd(char)) {
                token += char;
                char = this.advance();
            }
            this.addToken("identifier", token, startPos);
            token = token.toLowerCase();
            if (token === "rem") { // special handling for line comment
                startPos += token.length;
                if (char === " ") { // ignore first space
                    if (this.keepWhiteSpace) {
                        this.whiteSpace = char;
                    }
                    char = this.advance();
                    startPos += 1;
                }
                this.fnParseCompleteLineForRemOrApostrophe(char, startPos);
            }
            else if (token === "data") { // special handling because strings in data lines need not to be quoted
                this.fnParseCompleteLineForData(char);
            }
        };
        BasicLexer.prototype.fnParseHexOrBin = function (char, startPos) {
            var token = char;
            char = this.advance();
            if (char.toLowerCase() === "x") { // binary?
                token += this.advanceWhile(char, BasicLexer.isBin);
                this.addToken("binnumber", token, startPos);
            }
            else { // hex
                if (char.toLowerCase() === "h") { // optional h
                    token += char;
                    char = this.advance();
                }
                if (BasicLexer.isHex(char)) {
                    token += this.advanceWhile(char, BasicLexer.isHex);
                    this.addToken("hexnumber", token, startPos);
                }
                else {
                    throw this.composeError(Error(), "Expected number", token, startPos);
                }
            }
        };
        BasicLexer.prototype.fnTryContinueString = function (char) {
            var out = "";
            while (char === "\n") {
                var char1 = this.testChar(1);
                if (char1 !== "" && (char1 < "0" || char1 > "9")) { // heuristic: next char not a digit => continue with the (multiline) string
                    out += this.advanceWhile(char, BasicLexer.isNotQuotes);
                    char = this.getChar();
                }
                else {
                    break;
                }
            }
            return out;
        };
        BasicLexer.prototype.fnParseString = function (startPos) {
            var char = "", token = this.advanceWhile(char, BasicLexer.isNotQuotes);
            char = this.getChar();
            if (char !== '"') {
                if (!this.quiet) {
                    Utils_1.Utils.console.log(this.composeError({}, "Unterminated string", token, startPos + 1).message);
                }
                token += this.fnTryContinueString(char); // heuristic to detect an LF in the string
                char = this.getChar();
            }
            this.addToken("string", token, startPos + 1);
            if (char === '"') { // not for newline
                this.advance();
            }
        };
        BasicLexer.prototype.fnParseRsx = function (char, startPos) {
            var token = char;
            char = this.advance();
            if (BasicLexer.isIdentifierMiddle(char)) {
                token += this.advanceWhile(char, BasicLexer.isIdentifierMiddle);
                this.addToken("|", token, startPos);
            }
        };
        BasicLexer.prototype.processNextCharacter = function (startPos) {
            var char = this.getChar(), token;
            if (BasicLexer.isWhiteSpace(char)) {
                this.fnParseWhiteSpace(char);
            }
            else if (char === "\n") {
                this.addToken("(eol)", "", startPos);
                this.advance();
                this.takeNumberAsLinenumber = true;
            }
            else if (char === "'") { // apostrophe (comment)
                this.addToken(char, char, startPos);
                char = this.advance();
                this.fnParseCompleteLineForRemOrApostrophe(char, startPos + 1);
            }
            else if (BasicLexer.isOperatorOrStreamOrAddress(char)) {
                this.addToken(char, char, startPos);
                this.advance();
            }
            else if (BasicLexer.isDigit(char)) { // number starting with a digit?
                this.fnParseNumber(char, startPos, false);
            }
            else if (char === ".") { // number starting with a dot?
                this.fnParseNumber(char, startPos, true);
            }
            else if (char === "&") { // isHexOrBin: bin: &X, hex: & or &H
                this.fnParseHexOrBin(char, startPos);
            }
            else if (char === '"') {
                this.fnParseString(startPos);
            }
            else if (BasicLexer.isIdentifierStart(char)) {
                this.fnParseIdentifier(char, startPos);
            }
            else if (char === "|") { // isRsx
                this.fnParseRsx(char, startPos);
            }
            else if (BasicLexer.isComparison(char)) {
                token = this.advanceWhile(char, BasicLexer.isComparison2);
                this.addToken(token, token, startPos); // like operator
            }
            else {
                throw this.composeError(Error(), "Unrecognized token", char, startPos);
            }
        };
        BasicLexer.prototype.lex = function (input) {
            var startPos;
            this.input = input;
            this.index = 0;
            this.line = "0"; // for error messages
            this.takeNumberAsLinenumber = true;
            this.whiteSpace = "";
            this.tokens.length = 0;
            while (this.index < input.length) {
                startPos = this.index;
                this.processNextCharacter(startPos);
            }
            this.addToken("(end)", "", this.index);
            return this.tokens;
        };
        return BasicLexer;
    }());
    exports.BasicLexer = BasicLexer;
});
//# sourceMappingURL=BasicLexer.js.map