"use strict";
// BasicLexer.ts - BASIC Lexer
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasic/
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
        this.iLine = 0;
        this.bTakeNumberAsLine = true;
        this.bQuiet = (options === null || options === void 0 ? void 0 : options.bQuiet) || false;
        this.reset();
    }
    BasicLexer.prototype.reset = function () {
        this.iLine = 0; // for error messages
        this.bTakeNumberAsLine = true;
    };
    BasicLexer.prototype.composeError = function () {
        var aArgs = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            aArgs[_i] = arguments[_i];
        }
        aArgs.unshift("BasicLexer");
        aArgs.push(this.iLine);
        return Utils_1.Utils.composeError.apply(null, aArgs);
    };
    BasicLexer.prototype.lex = function (input) {
        var iIndex = 0, sToken, sChar, iStartPos;
        var that = this, aTokens = [], isComment = function (c) {
            return (/[']/).test(c);
        }, isOperator = function (c) {
            return (/[+\-*/^=()[\],;:?\\]/).test(c);
        }, isComparison = function (c) {
            return (/[<>]/).test(c);
        }, isComparison2 = function (c) {
            return (/[<>=]/).test(c);
        }, isDigit = function (c) {
            return (/[0-9]/).test(c);
        }, isDot = function (c) {
            return (/[.]/).test(c);
        }, isSign = function (c) {
            return (/[+-]/).test(c);
        }, isHexOrBin = function (c) {
            return (/[&]/).test(c);
        }, isBin2 = function (c) {
            return (/[01]/).test(c);
        }, isHex2 = function (c) {
            return (/[0-9A-Fa-f]/).test(c);
        }, isWhiteSpace = function (c) {
            return (/[ \r]/).test(c);
        }, isNewLine = function (c) {
            return (/[\n]/).test(c);
        }, isQuotes = function (c) {
            return (/["]/).test(c);
        }, isNotQuotes = function (c) {
            return c !== "" && !isQuotes(c) && !isNewLine(c); // quoted string must be in one line!
        }, isIdentifierStart = function (c) {
            return c !== "" && (/[A-Za-z]/).test(c); // cannot use complete [A-Za-z]+[\w]*[$%!]?
        }, isIdentifierMiddle = function (c) {
            return c !== "" && (/[A-Za-z0-9.]/).test(c);
        }, isIdentifierEnd = function (c) {
            return c !== "" && (/[$%!]/).test(c);
        }, isStream = function (c) {
            return (/[#]/).test(c);
        }, isAddress = function (c) {
            return (/[@]/).test(c);
        }, isRsx = function (c) {
            return (/[|]/).test(c);
        }, isNotNewLine = function (c) {
            return c !== "" && c !== "\n";
        }, isUnquotedData = function (c) {
            return c !== "" && (/[^:,\r\n]/).test(c);
        }, testChar = function (iAdd) {
            return input.charAt(iIndex + iAdd);
        }, advance = function () {
            iIndex += 1;
            return input.charAt(iIndex);
        }, advanceWhile = function (fn) {
            var sToken2 = "";
            do {
                sToken2 += sChar;
                sChar = advance();
            } while (fn(sChar));
            return sToken2;
        }, addToken = function (type, value, iPos, sOrig) {
            var oNode = {
                type: type,
                value: value,
                pos: iPos
                //orig: undefined
            };
            if (sOrig !== undefined) {
                if (sOrig !== String(value)) {
                    oNode.orig = sOrig;
                }
            }
            aTokens.push(oNode);
        }, hexEscape = function (str) {
            return str.replace(/[\x00-\x1f]/g, function (sChar2) {
                return "\\x" + ("00" + sChar2.charCodeAt(0).toString(16)).slice(-2);
            });
        }, fnParseNumber = function (bStartsWithDot) {
            sToken = "";
            if (bStartsWithDot) {
                sToken += sChar;
                sChar = advance();
            }
            sToken += advanceWhile(isDigit); // TODO: isDigitOrSpace: numbers may contain spaces!
            if (sChar === "." && !bStartsWithDot) {
                sToken += sChar;
                sChar = advance();
                if (isDigit(sChar)) { // digits after dot?
                    sToken += advanceWhile(isDigit);
                }
            }
            if (sChar === "e" || sChar === "E") { // we also try to check: [eE][+-]?\d+; because "E" could be ERR, ELSE,...
                var sChar1 = testChar(1), sChar2 = testChar(2);
                if (isDigit(sChar1) || (isSign(sChar1) && isDigit(sChar2))) { // so it is a number
                    sToken += sChar; // take "E"
                    sChar = advance();
                    if (isSign(sChar)) {
                        sToken += sChar; // take sign "+" or "-"
                        sChar = advance();
                    }
                    if (isDigit(sChar)) {
                        sToken += advanceWhile(isDigit);
                    }
                }
            }
            sToken = sToken.trim(); // remove trailing spaces
            var iNumber = parseFloat(sToken);
            if (!isFinite(Number(sToken))) { // Infnity?
                throw that.composeError(Error(), "Number is too large or too small", sToken, iStartPos); // for a 64-bit double
            }
            addToken("number", iNumber, iStartPos, sToken);
            if (that.bTakeNumberAsLine) {
                that.bTakeNumberAsLine = false;
                that.iLine = iNumber; // save just for error message
            }
        }, fnParseCompleteLineForRem = function () {
            if (sChar === " ") {
                sChar = advance();
            }
            if (isNotNewLine(sChar)) {
                sToken = advanceWhile(isNotNewLine);
                addToken("string", sToken, iStartPos + 1);
            }
        }, fnParseCompleteLineForData = function () {
            while (isNotNewLine(sChar)) {
                if (isWhiteSpace(sChar)) {
                    advanceWhile(isWhiteSpace);
                }
                if (isNewLine(sChar)) { // now newline?
                    break;
                }
                if (isQuotes(sChar)) {
                    sChar = "";
                    sToken = advanceWhile(isNotQuotes);
                    if (!isQuotes(sChar)) {
                        if (!that.bQuiet) {
                            Utils_1.Utils.console.log(that.composeError({}, "Unterminated string", sToken, iStartPos + 1).message);
                        }
                    }
                    sToken = sToken.replace(/\\/g, "\\\\"); // escape backslashes
                    sToken = hexEscape(sToken);
                    addToken("string", sToken, iStartPos + 1); // this is a quoted string (but we cannot detect it during runtime)
                    if (sChar === '"') { // not for newline
                        sChar = advance();
                    }
                }
                else if (sChar === ",") { // empty argument?
                    // parser can insert dummy token
                }
                else {
                    sToken = advanceWhile(isUnquotedData);
                    sToken = sToken.trim(); // remove whitespace before and after
                    sToken = sToken.replace(/\\/g, "\\\\"); // escape backslashes
                    sToken = sToken.replace(/"/g, "\\\""); // escape "
                    addToken("string", sToken, iStartPos); // could be interpreted as string or number during runtime
                }
                if (isWhiteSpace(sChar)) {
                    advanceWhile(isWhiteSpace);
                }
                if (sChar !== ",") {
                    break;
                }
                addToken(sChar, sChar, iStartPos); // ","
                sChar = advance();
                if (sChar === "\r") { // IE8 has "/r/n" newlines
                    sChar = advance();
                }
            }
        }, fnTryContinueString = function () {
            var sOut = "";
            while (isNewLine(sChar)) {
                var sChar1 = testChar(1);
                if (sChar1 !== "" && (sChar1 < "0" || sChar1 > "9")) { // heuristic: next char not a digit => continue with the string
                    sOut += advanceWhile(isNotQuotes);
                }
                else {
                    break;
                }
            }
            return sOut;
        };
        while (iIndex < input.length) {
            iStartPos = iIndex;
            sChar = input.charAt(iIndex);
            if (isWhiteSpace(sChar)) {
                sChar = advance();
            }
            else if (isNewLine(sChar)) {
                addToken("(eol)", "", iStartPos);
                sChar = advance();
                this.bTakeNumberAsLine = true;
            }
            else if (isComment(sChar)) {
                addToken(sChar, sChar, iStartPos);
                sChar = advance();
                if (isNotNewLine(sChar)) {
                    sToken = advanceWhile(isNotNewLine);
                    addToken("string", sToken, iStartPos);
                }
            }
            else if (isOperator(sChar)) {
                addToken(sChar, sChar, iStartPos);
                sChar = advance();
            }
            else if (isDigit(sChar)) {
                fnParseNumber(false);
            }
            else if (isDot(sChar)) { // number starting with dot
                fnParseNumber(true);
            }
            else if (isHexOrBin(sChar)) {
                sToken = sChar;
                sChar = advance();
                if (sChar.toLowerCase() === "x") { // binary?
                    sToken += advanceWhile(isBin2);
                    addToken("binnumber", sToken, iStartPos);
                }
                else { // hex
                    if (sChar.toLowerCase() === "h") { // optional h
                        sToken += sChar;
                        sChar = advance();
                    }
                    if (isHex2(sChar)) {
                        sToken += advanceWhile(isHex2);
                        addToken("hexnumber", sToken, iStartPos);
                    }
                    else {
                        throw this.composeError(Error(), "Expected number", sToken, iStartPos);
                    }
                }
            }
            else if (isQuotes(sChar)) {
                sChar = "";
                sToken = advanceWhile(isNotQuotes);
                if (!isQuotes(sChar)) {
                    if (!that.bQuiet) {
                        Utils_1.Utils.console.log(this.composeError({}, "Unterminated string", sToken, iStartPos + 1).message);
                    }
                    sToken += fnTryContinueString(); // heuristic to detect an LF in the string
                }
                sToken = sToken.replace(/\\/g, "\\\\"); // escape backslashes
                sToken = hexEscape(sToken);
                addToken("string", sToken, iStartPos + 1);
                if (sChar === '"') { // not for newline
                    sChar = advance();
                }
            }
            else if (isIdentifierStart(sChar)) {
                sToken = sChar;
                sChar = advance();
                if (isIdentifierMiddle(sChar)) {
                    sToken += advanceWhile(isIdentifierMiddle);
                }
                if (isIdentifierEnd(sChar)) {
                    sToken += sChar;
                    sChar = advance();
                }
                addToken("identifier", sToken, iStartPos);
                sToken = sToken.toLowerCase();
                if (sToken === "rem") { // special handling for line comment
                    fnParseCompleteLineForRem();
                }
                else if (sToken === "data") { // special handling because strings in data lines need not be quoted
                    fnParseCompleteLineForData();
                }
            }
            else if (isAddress(sChar)) {
                addToken(sChar, sChar, iStartPos);
                sChar = advance();
            }
            else if (isRsx(sChar)) {
                sToken = sChar;
                sChar = advance();
                if (isIdentifierMiddle(sChar)) {
                    sToken += advanceWhile(isIdentifierMiddle);
                    addToken("|", sToken, iStartPos);
                }
            }
            else if (isStream(sChar)) { // stream can be an expression
                addToken(sChar, sChar, iStartPos);
                sChar = advance();
            }
            else if (isComparison(sChar)) {
                sToken = advanceWhile(isComparison2);
                addToken(sToken, sToken, iStartPos); // like operator
            }
            else {
                throw this.composeError(Error(), "Unrecognized token", sChar, iStartPos);
            }
        }
        addToken("(end)", "", iIndex);
        return aTokens;
    };
    return BasicLexer;
}());
exports.BasicLexer = BasicLexer;
//# sourceMappingURL=BasicLexer.js.map