"use strict";
// BasicLexer.ts - BASIC Lexer
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//
// BASIC lexer for Locomotive BASIC 1.1 for Amstrad CPC 6128
//
Object.defineProperty(exports, "__esModule", { value: true });
exports.BasicLexer = void 0;
// based on an idea of: https://www.codeproject.com/Articles/345888/How-to-write-a-simple-interpreter-in-JavaScript
var Utils_1 = require("./Utils");
var BasicLexer = /** @class */ (function () {
    function BasicLexer(options) {
        this.bQuiet = false;
        this.bKeepWhiteSpace = false;
        this.sLine = "0"; // for error messages
        this.bTakeNumberAsLine = true; // first number in a line is assumed to be a line number
        this.sInput = "";
        this.iIndex = 0;
        this.aTokens = [];
        this.sWhiteSpace = ""; // collected whitespace
        if (options) {
            this.setOptions(options);
        }
    }
    BasicLexer.prototype.setOptions = function (options) {
        this.bQuiet = options.bQuiet || false;
        this.bKeepWhiteSpace = options.bKeepWhiteSpace || false;
    };
    BasicLexer.prototype.composeError = function (oError, message, value, pos) {
        return Utils_1.Utils.composeError("BasicLexer", oError, message, value, pos, this.sLine);
    };
    BasicLexer.isComment = function (c) {
        return (/[']/).test(c);
    };
    BasicLexer.isOperator = function (c) {
        return (/[+\-*/^=()[\],;:?\\]/).test(c);
    };
    BasicLexer.isComparison = function (c) {
        return (/[<>]/).test(c);
    };
    BasicLexer.isComparison2 = function (c) {
        return (/[<>=]/).test(c);
    };
    BasicLexer.isDigit = function (c) {
        return (/[0-9]/).test(c);
    };
    BasicLexer.isDot = function (c) {
        return (/[.]/).test(c);
    };
    BasicLexer.isSign = function (c) {
        return (/[+-]/).test(c);
    };
    BasicLexer.isHexOrBin = function (c) {
        return (/[&]/).test(c);
    };
    BasicLexer.isBin2 = function (c) {
        return (/[01]/).test(c);
    };
    BasicLexer.isHex2 = function (c) {
        return (/[0-9A-Fa-f]/).test(c);
    };
    BasicLexer.isWhiteSpace = function (c) {
        return (/[ \r]/).test(c);
    };
    BasicLexer.isNewLine = function (c) {
        return (/[\n]/).test(c);
    };
    BasicLexer.isQuotes = function (c) {
        return (/["]/).test(c);
    };
    BasicLexer.isNotQuotes = function (c) {
        return c !== "" && !BasicLexer.isQuotes(c) && !BasicLexer.isNewLine(c); // quoted string must be in one line!
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
    BasicLexer.isStream = function (c) {
        return (/[#]/).test(c);
    };
    BasicLexer.isAddress = function (c) {
        return (/[@]/).test(c);
    };
    BasicLexer.isRsx = function (c) {
        return (/[|]/).test(c);
    };
    BasicLexer.isNotNewLine = function (c) {
        return c !== "" && c !== "\n";
    };
    BasicLexer.isUnquotedData = function (c) {
        return c !== "" && (/[^:,\r\n]/).test(c);
    };
    BasicLexer.prototype.testChar = function (iAdd) {
        return this.sInput.charAt(this.iIndex + iAdd);
    };
    BasicLexer.prototype.getChar = function () {
        return this.sInput.charAt(this.iIndex);
    };
    BasicLexer.prototype.advance = function () {
        this.iIndex += 1;
        return this.getChar();
    };
    BasicLexer.prototype.advanceWhile = function (sChar, fn) {
        var sToken2 = "";
        do {
            sToken2 += sChar;
            sChar = this.advance();
        } while (fn(sChar));
        return sToken2;
    };
    BasicLexer.prototype.debugCheckValue = function (type, value, iPos, sOrig) {
        var sOrigValue = sOrig || value, sPart = this.sInput.substr(iPos, sOrigValue.length);
        if (sPart !== sOrigValue) {
            Utils_1.Utils.console.debug("BasicLexer:debugCheckValue:", type, sPart, "<>", sOrigValue, "at pos", iPos);
        }
    };
    BasicLexer.prototype.addToken = function (type, value, iPos, sOrig) {
        var oNode = {
            type: type,
            value: value,
            pos: iPos
        };
        if (sOrig !== undefined) {
            if (sOrig !== value) {
                oNode.orig = sOrig;
            }
        }
        if (this.sWhiteSpace !== "") {
            oNode.ws = this.sWhiteSpace;
            this.sWhiteSpace = "";
        }
        if (Utils_1.Utils.debug > 1) {
            this.debugCheckValue(type, value, iPos, oNode.orig); // check position of added value
        }
        this.aTokens.push(oNode);
    };
    BasicLexer.prototype.fnParseNumber = function (sChar, iStartPos, bStartsWithDot) {
        var sToken = "";
        if (bStartsWithDot) {
            sToken += sChar;
            sChar = this.advance();
        }
        sToken += this.advanceWhile(sChar, BasicLexer.isDigit); // TODO: isDigitOrSpace: numbers may contain spaces!
        sChar = this.getChar();
        if (sChar === "." && !bStartsWithDot) {
            sToken += sChar;
            sChar = this.advance();
            if (BasicLexer.isDigit(sChar)) { // digits after dot?
                sToken += this.advanceWhile(sChar, BasicLexer.isDigit);
                sChar = this.getChar();
            }
        }
        if (sChar === "e" || sChar === "E") { // we also try to check: [eE][+-]?\d+; because "E" could be ERR, ELSE,...
            var sChar1 = this.testChar(1), sChar2 = this.testChar(2);
            if (BasicLexer.isDigit(sChar1) || (BasicLexer.isSign(sChar1) && BasicLexer.isDigit(sChar2))) { // so it is a number
                sToken += sChar; // take "E"
                sChar = this.advance();
                if (BasicLexer.isSign(sChar)) {
                    sToken += sChar; // take sign "+" or "-"
                    sChar = this.advance();
                }
                if (BasicLexer.isDigit(sChar)) {
                    sToken += this.advanceWhile(sChar, BasicLexer.isDigit);
                    sChar = this.getChar();
                }
            }
        }
        sToken = sToken.trim(); // remove trailing spaces
        if (!isFinite(Number(sToken))) { // Infnity?
            throw this.composeError(Error(), "Number is too large or too small", sToken, iStartPos); // for a 64-bit double
        }
        var iNumber = parseFloat(sToken);
        this.addToken("number", String(iNumber), iStartPos, sToken); // store number as string
        if (this.bTakeNumberAsLine) {
            this.bTakeNumberAsLine = false;
            this.sLine = String(iNumber); // save just for error message
        }
    };
    BasicLexer.prototype.fnParseCompleteLineForRemOrApostrophe = function (sChar, iStartPos) {
        if (BasicLexer.isNotNewLine(sChar)) {
            var sToken = this.advanceWhile(sChar, BasicLexer.isNotNewLine);
            sChar = this.getChar();
            this.addToken("unquoted", sToken, iStartPos);
        }
        return sChar;
    };
    BasicLexer.prototype.fnParseCompleteLineForData = function (sChar, iStartPos) {
        var reSpacesAtEnd = new RegExp(/\s+$/);
        var iPos, sToken;
        while (BasicLexer.isNotNewLine(sChar)) {
            if (BasicLexer.isWhiteSpace(sChar)) {
                sToken = this.advanceWhile(sChar, BasicLexer.isWhiteSpace);
                sChar = this.getChar();
                if (this.bKeepWhiteSpace) {
                    this.sWhiteSpace = sToken;
                }
            }
            if (BasicLexer.isNewLine(sChar)) { // now newline?
                break;
            }
            iPos = this.iIndex;
            if (BasicLexer.isQuotes(sChar)) {
                sChar = "";
                sToken = this.advanceWhile(sChar, BasicLexer.isNotQuotes);
                sChar = this.getChar();
                if (!BasicLexer.isQuotes(sChar)) {
                    if (!this.bQuiet) {
                        Utils_1.Utils.console.log(this.composeError({}, "Unterminated string", sToken, iStartPos + 1).message);
                    }
                }
                this.addToken("string", sToken, iPos + 1); // this is a quoted string (but we cannot detect it during runtime)
                if (sChar === '"') { // not for newline
                    sChar = this.advance();
                }
            }
            else if (sChar === ",") { // empty argument?
                // parser can insert dummy token
            }
            else {
                sToken = this.advanceWhile(sChar, BasicLexer.isUnquotedData);
                sChar = this.getChar();
                var aMatch = reSpacesAtEnd.exec(sToken), sEndingSpaces = (aMatch && aMatch[0]) || "";
                sToken = sToken.trim(); // remove whitespace before and after; do we need this?
                this.addToken("unquoted", sToken, iPos); // could be interpreted as string or number during runtime
                if (this.bKeepWhiteSpace) {
                    this.sWhiteSpace = sEndingSpaces;
                }
            }
            if (BasicLexer.isWhiteSpace(sChar)) {
                sToken = this.advanceWhile(sChar, BasicLexer.isWhiteSpace);
                sChar = this.getChar();
                if (this.bKeepWhiteSpace) {
                    this.sWhiteSpace = sToken;
                }
            }
            if (sChar !== ",") {
                break;
            }
            iPos = this.iIndex;
            this.addToken(sChar, sChar, iPos); // ","
            sChar = this.advance();
            if (sChar === "\r") { // IE8 has "/r/n" newlines
                sChar = this.advance();
            }
        }
    };
    BasicLexer.prototype.fnParseIdentifier = function (sChar, iStartPos) {
        var sToken = sChar;
        sChar = this.advance();
        if (BasicLexer.isIdentifierMiddle(sChar)) {
            sToken += this.advanceWhile(sChar, BasicLexer.isIdentifierMiddle);
            sChar = this.getChar();
        }
        if (BasicLexer.isIdentifierEnd(sChar)) {
            sToken += sChar;
            sChar = this.advance();
        }
        this.addToken("identifier", sToken, iStartPos);
        sToken = sToken.toLowerCase();
        if (sToken === "rem") { // special handling for line comment
            iStartPos += sToken.length;
            if (sChar === " ") { // ignore first space
                if (this.bKeepWhiteSpace) {
                    this.sWhiteSpace = sChar;
                }
                sChar = this.advance();
                iStartPos += 1;
            }
            this.fnParseCompleteLineForRemOrApostrophe(sChar, iStartPos);
            this.getChar();
        }
        else if (sToken === "data") { // special handling because strings in data lines need not to be quoted
            this.fnParseCompleteLineForData(sChar, iStartPos);
            sChar = this.getChar();
        }
    };
    BasicLexer.prototype.fnTryContinueString = function (sChar) {
        var sOut = "";
        while (BasicLexer.isNewLine(sChar)) {
            var sChar1 = this.testChar(1);
            if (sChar1 !== "" && (sChar1 < "0" || sChar1 > "9")) { // heuristic: next char not a digit => continue with the string
                sOut += this.advanceWhile(sChar, BasicLexer.isNotQuotes);
                sChar = this.getChar();
            }
            else {
                break;
            }
        }
        return sOut;
    };
    BasicLexer.prototype.lex = function (sInput) {
        var iStartPos, sChar, sToken;
        this.sInput = sInput;
        this.iIndex = 0;
        this.sLine = "0"; // for error messages
        this.bTakeNumberAsLine = true;
        this.sWhiteSpace = "";
        this.aTokens.length = 0;
        while (this.iIndex < sInput.length) {
            iStartPos = this.iIndex;
            sChar = this.getChar();
            if (BasicLexer.isWhiteSpace(sChar)) {
                sToken = this.advanceWhile(sChar, BasicLexer.isWhiteSpace);
                sChar = this.getChar();
                if (this.bKeepWhiteSpace) {
                    this.sWhiteSpace = sToken;
                }
            }
            else if (BasicLexer.isNewLine(sChar)) {
                this.addToken("(eol)", "", iStartPos);
                sChar = this.advance();
                this.bTakeNumberAsLine = true;
            }
            else if (BasicLexer.isComment(sChar)) {
                this.addToken(sChar, sChar, iStartPos);
                sChar = this.advance();
                this.fnParseCompleteLineForRemOrApostrophe(sChar, iStartPos + 1);
            }
            else if (BasicLexer.isOperator(sChar)) {
                this.addToken(sChar, sChar, iStartPos);
                sChar = this.advance();
            }
            else if (BasicLexer.isDigit(sChar)) {
                this.fnParseNumber(sChar, iStartPos, false);
            }
            else if (BasicLexer.isDot(sChar)) { // number starting with dot
                this.fnParseNumber(sChar, iStartPos, true);
            }
            else if (BasicLexer.isHexOrBin(sChar)) {
                sToken = sChar;
                sChar = this.advance();
                if (sChar.toLowerCase() === "x") { // binary?
                    sToken += this.advanceWhile(sChar, BasicLexer.isBin2);
                    sChar = this.getChar();
                    this.addToken("binnumber", sToken, iStartPos);
                }
                else { // hex
                    if (sChar.toLowerCase() === "h") { // optional h
                        sToken += sChar;
                        sChar = this.advance();
                    }
                    if (BasicLexer.isHex2(sChar)) {
                        sToken += this.advanceWhile(sChar, BasicLexer.isHex2);
                        sChar = this.getChar();
                        this.addToken("hexnumber", sToken, iStartPos);
                    }
                    else {
                        throw this.composeError(Error(), "Expected number", sToken, iStartPos);
                    }
                }
            }
            else if (BasicLexer.isQuotes(sChar)) {
                sChar = "";
                sToken = this.advanceWhile(sChar, BasicLexer.isNotQuotes);
                sChar = this.getChar();
                if (!BasicLexer.isQuotes(sChar)) {
                    if (!this.bQuiet) {
                        Utils_1.Utils.console.log(this.composeError({}, "Unterminated string", sToken, iStartPos + 1).message);
                    }
                    sToken += this.fnTryContinueString(sChar); // heuristic to detect an LF in the string
                    sChar = this.getChar();
                }
                this.addToken("string", sToken, iStartPos + 1);
                if (sChar === '"') { // not for newline
                    sChar = this.advance();
                }
            }
            else if (BasicLexer.isIdentifierStart(sChar)) {
                this.fnParseIdentifier(sChar, iStartPos);
            }
            else if (BasicLexer.isAddress(sChar)) {
                this.addToken(sChar, sChar, iStartPos);
                sChar = this.advance();
            }
            else if (BasicLexer.isRsx(sChar)) {
                sToken = sChar;
                sChar = this.advance();
                if (BasicLexer.isIdentifierMiddle(sChar)) {
                    sToken += this.advanceWhile(sChar, BasicLexer.isIdentifierMiddle);
                    sChar = this.getChar();
                    this.addToken("|", sToken, iStartPos);
                }
            }
            else if (BasicLexer.isStream(sChar)) { // stream can be an expression
                this.addToken(sChar, sChar, iStartPos);
                sChar = this.advance();
            }
            else if (BasicLexer.isComparison(sChar)) {
                sToken = this.advanceWhile(sChar, BasicLexer.isComparison2);
                this.addToken(sToken, sToken, iStartPos); // like operator
                sChar = this.getChar();
            }
            else {
                throw this.composeError(Error(), "Unrecognized token", sChar, iStartPos);
            }
        }
        this.addToken("(end)", "", this.iIndex);
        return this.aTokens;
    };
    return BasicLexer;
}());
exports.BasicLexer = BasicLexer;
//# sourceMappingURL=BasicLexer.js.map