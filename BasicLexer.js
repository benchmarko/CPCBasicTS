// BasicLexer.ts - BASIC Lexer
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//
// BASIC lexer for Locomotive BASIC 1.1 for Amstrad CPC 6128
//
// based on an idea of: https://www.codeproject.com/Articles/345888/How-to-write-a-simple-interpreter-in-JavaScript
import { Utils } from "./Utils";
export class BasicLexer {
    constructor(options) {
        this.label = ""; // for error messages
        this.takeNumberAsLabel = true; // first number in a line is assumed to be a label (line number)
        this.input = ""; // input to analyze
        this.index = 0; // position in input
        this.tokens = [];
        this.whiteSpace = ""; // collected whitespace
        this.options = {
            keepWhiteSpace: false,
            quiet: false
        };
        this.setOptions(options);
    }
    getOptions() {
        return this.options;
    }
    setOptions(options) {
        Object.assign(this.options, options);
    }
    composeError(error, message, value, pos, len) {
        return Utils.composeError("BasicLexer", error, message, value, pos, len, this.label || undefined);
    }
    static isOperatorOrStreamOrAddress(c) {
        return (/[+\-*/^=()[\],;:?\\@#]/).test(c);
    }
    static isComparison(c) {
        return (/[<>]/).test(c);
    }
    static isComparison2(c) {
        return (/[<>=]/).test(c);
    }
    static isDigit(c) {
        return (/\d/).test(c);
    }
    static isSign(c) {
        return (/[+-]/).test(c);
    }
    static isBin(c) {
        return (/[01]/).test(c);
    }
    static isHex(c) {
        return (/[0-9A-Fa-f]/).test(c);
    }
    static isWhiteSpace(c) {
        return (/[ \r]/).test(c);
    }
    static isNotQuotes(c) {
        return c !== "" && c !== '"' && c !== "\n"; // quoted string must be in one line!
    }
    static isIdentifierStart(c) {
        return c !== "" && (/[A-Za-z]/).test(c); // cannot use complete [A-Za-z]+[\w]*[$%!]?
    }
    static isIdentifierMiddle(c) {
        return c !== "" && (/[A-Za-z0-9.]/).test(c);
    }
    static isIdentifierEnd(c) {
        return c !== "" && (/[$%!]/).test(c);
    }
    static isNotNewLine(c) {
        return c !== "" && c !== "\n";
    }
    static isUnquotedData(c) {
        return c !== "" && (/[^:,\r\n]/).test(c);
    }
    testChar(add) {
        return this.input.charAt(this.index + add);
    }
    getChar() {
        return this.input.charAt(this.index);
    }
    advance() {
        this.index += 1;
        return this.getChar();
    }
    advanceWhile(char, fn) {
        let token = "";
        do {
            token += char;
            char = this.advance();
        } while (fn(char));
        return token;
    }
    debugCheckValue(type, value, pos, orig) {
        const origValue = orig || value, part = this.input.substring(pos, pos + origValue.length);
        if (part !== origValue) {
            Utils.console.debug("BasicLexer:debugCheckValue:", type, part, "<>", origValue, "at pos", pos);
        }
    }
    addToken(type, value, pos, orig) {
        const node = {
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
        if (Utils.debug > 1) {
            this.debugCheckValue(type, value, pos, node.orig); // check position of added value
        }
        this.tokens.push(node);
    }
    fnParseExponentialNumber(char) {
        // we also try to check: [eE][+-]?\d+; because "E" could be ERR, ELSE,...
        let token = "", index = 1;
        while (BasicLexer.isWhiteSpace(this.testChar(index))) { // whitespace between e and rest?
            index += 1;
        }
        const char1 = this.testChar(index), char2 = this.testChar(index + 1);
        if (BasicLexer.isDigit(char1) || (BasicLexer.isSign(char1) && BasicLexer.isDigit(char2))) { // so it is a number
            token += char; // take "E"
            char = this.advance();
            while (BasicLexer.isWhiteSpace(char)) {
                token += char;
                char = this.advance();
            }
            if (BasicLexer.isSign(char)) {
                token += char; // take sign "+" or "-"
                char = this.advance();
            }
            if (BasicLexer.isDigit(char)) {
                token += this.advanceWhile(char, BasicLexer.isDigit);
            }
        }
        return token;
    }
    fnParseNumber(char, startPos, startsWithDot) {
        let token = "";
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
        let expNumberPart = "";
        if (char === "e" || char === "E") { // we also try to check: [eE][+-]?\d+; because "E" could be ERR, ELSE,...
            expNumberPart = this.fnParseExponentialNumber(char);
            token += expNumberPart;
            if (expNumberPart[1] === " " && !this.options.quiet) {
                Utils.console.warn(this.composeError({}, "Whitespace in exponential number", token, startPos).message);
                // do we really want to allow this?
            }
        }
        const orig = token;
        token = token.replace(/ /g, ""); // remove spaces
        if (!isFinite(Number(token))) { // Infnity?
            throw this.composeError(Error(), "Number is too large or too small", token, startPos); // for a 64-bit double
        }
        const number = expNumberPart ? token : parseFloat(token);
        this.addToken(expNumberPart ? "expnumber" : "number", String(number), startPos, orig); // store number as string
        if (this.takeNumberAsLabel) {
            this.takeNumberAsLabel = false;
            this.label = String(number); // save just for error message
        }
    }
    fnParseCompleteLineForRemOrApostrophe(char, startPos) {
        if (BasicLexer.isNotNewLine(char)) {
            let token = this.advanceWhile(char, BasicLexer.isNotNewLine), whiteSpace = "";
            char = this.getChar();
            if (token.endsWith("\r")) {
                token = token.substring(0, token.length - 1);
                whiteSpace = "\r";
                // now token can be empty?
            }
            this.addToken("unquoted", token, startPos);
            if (whiteSpace && this.options.keepWhiteSpace) {
                this.whiteSpace = whiteSpace;
            }
        }
        return char;
    }
    fnParseWhiteSpace(char) {
        const token = this.advanceWhile(char, BasicLexer.isWhiteSpace);
        if (this.options.keepWhiteSpace) {
            this.whiteSpace = token;
        }
    }
    fnParseUnquoted(char, pos) {
        const reSpacesAtEnd = new RegExp(/\s+$/);
        let token = this.advanceWhile(char, BasicLexer.isUnquotedData);
        const match = reSpacesAtEnd.exec(token), endingSpaces = (match && match[0]) || "";
        token = token.trim(); // remove whitespace before and after; do we need this?
        this.addToken("unquoted", token, pos); // could be interpreted as string or number during runtime
        if (this.options.keepWhiteSpace) {
            this.whiteSpace = endingSpaces;
        }
    }
    fnParseCompleteLineForData(char) {
        let pos;
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
    }
    fnParseIdentifier(char, startPos) {
        let token = char;
        char = this.advance();
        let lcToken = (token + char).toLowerCase(); // combine first 2 letters
        if (lcToken === "fn" && this.options.keywords[lcToken]) {
            this.addToken(lcToken, token + char, startPos); // create "fn" token
            this.advance();
            return;
        }
        if (BasicLexer.isIdentifierMiddle(char)) {
            token += this.advanceWhile(char, BasicLexer.isIdentifierMiddle);
            char = this.getChar();
        }
        let idEnd = "";
        if (BasicLexer.isIdentifierEnd(char)) {
            token += char;
            idEnd = char;
            char = this.advance();
        }
        lcToken = token.toLowerCase();
        if (this.options.keywords[lcToken]) {
            this.addToken(lcToken, token, startPos);
            if (lcToken === "rem") { // special handling for line comment
                startPos += lcToken.length;
                this.fnParseCompleteLineForRemOrApostrophe(char, startPos);
            }
            else if (lcToken === "data") { // special handling because strings in data lines need not to be quoted
                this.fnParseCompleteLineForData(char);
            }
        }
        else {
            if (idEnd && this.options.keywords[lcToken.substring(0, lcToken.length - 1)]) {
                throw this.composeError(Error(), "Invalid identifier", token, startPos);
            }
            this.addToken("identifier", token, startPos);
        }
    }
    fnParseHexOrBin(char, startPos) {
        let token = char;
        char = this.advance();
        if (char.toLowerCase() === "x") { // binary?
            token += char;
            char = this.advance();
            if (BasicLexer.isBin(char)) {
                token += this.advanceWhile(char, BasicLexer.isBin);
                this.addToken("binnumber", token, startPos);
            }
            else {
                throw this.composeError(Error(), "Expected binary number", token, startPos);
            }
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
                throw this.composeError(Error(), "Expected hex number", token, startPos);
            }
        }
    }
    fnTryContinueString(char) {
        let out = "";
        while (char === "\n") {
            const char1 = this.testChar(1);
            if (char1 !== "" && (char1 < "0" || char1 > "9")) { // heuristic: next char not a digit => continue with the (multiline) string
                out += this.advanceWhile(char, BasicLexer.isNotQuotes);
                char = this.getChar();
            }
            else {
                break;
            }
        }
        return out;
    }
    fnParseString(startPos) {
        let char = "", token = this.advanceWhile(char, BasicLexer.isNotQuotes), type = "string", whiteSpace = "";
        char = this.getChar();
        if (char !== '"') {
            const contString = this.fnTryContinueString(char); // heuristic to detect an LF in the string
            if (contString) {
                if (Utils.debug) {
                    Utils.console.debug(this.composeError({}, "Continued string", token, startPos + 1).message);
                }
                token += contString;
                char = this.getChar();
            }
        }
        if (char === '"') { // not for newline
            this.advance();
        }
        else {
            if (Utils.debug) {
                Utils.console.debug(this.composeError({}, "Unterminated string", token, startPos + 1).message);
            }
            type = "ustring"; // unterminated string
            if (token.endsWith("\r")) {
                token = token.substring(0, token.length - 1);
                whiteSpace = "\r";
                // now token can be empty?
            }
        }
        this.addToken(type, token, startPos + 1);
        if (whiteSpace && this.options.keepWhiteSpace) {
            this.whiteSpace = whiteSpace;
        }
    }
    fnParseRsx(char, startPos) {
        let token = char;
        char = this.advance();
        if (BasicLexer.isIdentifierMiddle(char)) {
            token += this.advanceWhile(char, BasicLexer.isIdentifierMiddle);
        }
        this.addToken("|", token, startPos);
    }
    processNextCharacter(startPos) {
        let char = this.getChar(), token;
        if (BasicLexer.isWhiteSpace(char)) {
            this.fnParseWhiteSpace(char);
        }
        else if (char === "\n") {
            this.addToken("(eol)", char, startPos);
            this.advance();
            this.takeNumberAsLabel = true;
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
    }
    lex(input) {
        let startPos;
        this.input = input;
        this.index = 0;
        this.label = ""; // for error messages
        this.takeNumberAsLabel = true;
        this.whiteSpace = "";
        this.tokens.length = 0;
        while (this.index < input.length) {
            startPos = this.index;
            this.processNextCharacter(startPos);
        }
        this.addToken("(end)", "", this.index);
        return this.tokens;
    }
}
//# sourceMappingURL=BasicLexer.js.map