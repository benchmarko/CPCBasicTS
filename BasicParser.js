// BasicParser.ts - BASIC Parser
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasic/
//
// BASIC parser for Locomotive BASIC 1.1 for Amstrad CPC 6128
//
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BasicParser = void 0;
// [ https://www.codeproject.com/Articles/345888/How-to-write-a-simple-interpreter-in-JavaScript ; test online: http://jsfiddle.net/h3xwj/embedded/result/ ]
//
// http://crockford.com/javascript/tdop/tdop.html
// Top Down Operator Precedence
// http://crockford.com/javascript/tdop/parse.js
// http://crockford.com/javascript/tdop/index.html
//
// http://stevehanov.ca/blog/?id=92
// http://stevehanov.ca/qb.js/qbasic.js
//
// http://www.csidata.com/custserv/onlinehelp/vbsdocs/vbs232.htm  (operator precedence) ?
// How to write a simple interpreter in JavaScript
// Peter_Olson, 30 Oct 2014
var Utils_1 = require("./Utils");
/* // TODO
interface BasicParserNode extends BasicLexerToken {
    left: BasicParserNode
    right: BasicParserNode
    bSpace?: boolean
}
*/
var BasicParser = /** @class */ (function () {
    function BasicParser(options) {
        this.iLine = 0;
        this.bQuiet = false;
        this.init(options);
    }
    BasicParser.prototype.init = function (options) {
        this.bQuiet = (options === null || options === void 0 ? void 0 : options.bQuiet) || false;
        this.reset();
    };
    BasicParser.prototype.reset = function () {
        this.iLine = 0; // for error messages
    };
    BasicParser.prototype.composeError = function () {
        //var aArgs = Array.prototype.slice.call(arguments);
        var aArgs = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            aArgs[_i] = arguments[_i];
        }
        aArgs.unshift("BasicParser");
        aArgs.push(this.iLine);
        return Utils_1.Utils.composeError.apply(null, aArgs);
    };
    // http://crockford.com/javascript/tdop/tdop.html (old: http://javascript.crockford.com/tdop/tdop.html)
    // http://crockford.com/javascript/tdop/parse.js
    // Operator precedence parsing
    //
    // Operator: With left binding power (lbp) and operational function.
    // Manipulates tokens to its left (e.g: +)? => left denotative function led(), otherwise null denotative function nud()), (e.g. unary -)
    // identifiers, numbers: also nud.
    BasicParser.prototype.parse = function (aTokens, bAllowDirect) {
        var that = this, oSymbols = {}, aParseTree = [];
        var iIndex = 0, oPreviousToken, oToken, //TODO: oToken: BasicParserNode, (changed by side effect!)
        symbol = function (id, nud, lbp, led) {
            var oSymbol = oSymbols[id];
            if (!oSymbol) {
                oSymbols[id] = {};
                oSymbol = oSymbols[id];
            }
            if (nud) {
                oSymbol.nud = nud;
            }
            if (lbp) {
                oSymbol.lbp = lbp;
            }
            if (led) {
                oSymbol.led = led;
            }
            return oSymbol;
        }, advance = function (id) {
            oPreviousToken = oToken;
            if (id && oToken.type !== id) {
                throw that.composeError(Error(), "Expected " + id, (oToken.value === "") ? oToken.type : oToken.value, oToken.pos);
            }
            if (iIndex >= aTokens.length) {
                oToken = oSymbols["(end)"];
                return oToken;
            }
            oToken = aTokens[iIndex]; // we get a lex token and reuse it as parseTree token
            iIndex += 1;
            if (oToken.type === "identifier" && BasicParser.mKeywords[oToken.value.toLowerCase()]) {
                oToken.type = oToken.value.toLowerCase(); // modify type identifier => keyword xy
            }
            var oSym = oSymbols[oToken.type];
            if (!oSym) {
                throw that.composeError(Error(), "Unknown token", oToken.type, oToken.pos);
            }
            return oToken;
        }, expression = function (rbp) {
            var t = oToken, s = oSymbols[t.type];
            if (Utils_1.Utils.debug > 3) {
                Utils_1.Utils.console.debug("parse: expression rbp=" + rbp + " type=" + t.type + " t=%o", t);
            }
            advance(t.type);
            if (!s.nud) {
                if (t.type === "(end)") {
                    throw that.composeError(Error(), "Unexpected end of file", "", t.pos);
                }
                else {
                    throw that.composeError(Error(), "Unexpected token", t.type, t.pos);
                }
            }
            var left = s.nud(t); // process literals, variables, and prefix operators
            while (rbp < oSymbols[oToken.type].lbp) { // as long as the right binding power is less than the left binding power of the next token...
                t = oToken;
                s = oSymbols[t.type];
                advance(t.type);
                if (!s.led) {
                    throw that.composeError(Error(), "Unexpected token", t.type, t.pos); //TTT how to get this error?
                }
                left = s.led(left); // ...the led method is invoked on the following token (infix and suffix operators), can be recursive
            }
            return left;
        }, assignment = function () {
            if (oToken.type !== "identifier") {
                throw that.composeError(Error(), "Expected identifier", oToken.type, oToken.pos);
            }
            var oLeft = expression(90), // take it (can also be an array) and stop
            oValue = oToken;
            advance("="); // equal as assignment
            oValue.left = oLeft;
            oValue.right = expression(0);
            oValue.type = "assign"; // replace "="
            return oValue;
        }, statement = function () {
            var t = oToken, s = oSymbols[t.type];
            if (s.std) { // statement?
                advance();
                return s.std();
            }
            var oValue;
            if (t.type === "identifier") {
                oValue = assignment();
            }
            else {
                oValue = expression(0);
            }
            if (oValue.type !== "assign" && oValue.type !== "fcall" && oValue.type !== "def" && oValue.type !== "(" && oValue.type !== "[") {
                throw that.composeError(Error(), "Bad expression statement", t.value, t.pos);
            }
            return oValue;
        }, statements = function (sStopType) {
            var aStatements = [];
            var bColonExpected = false;
            while (oToken.type !== "(end)" && oToken.type !== "(eol)") {
                if (sStopType && oToken.type === sStopType) {
                    break;
                }
                if (bColonExpected || oToken.type === ":") {
                    if (oToken.type !== "'" && oToken.type !== "else") { // no colon required for line comment or ELSE
                        advance(":");
                    }
                    bColonExpected = false;
                }
                else {
                    var oStatement = statement();
                    aStatements.push(oStatement);
                    bColonExpected = true;
                }
            }
            return aStatements;
        }, line = function () {
            var oValue;
            if (oToken.type !== "number" && bAllowDirect) {
                bAllowDirect = false; // allow only once
                oValue = {
                    type: "label",
                    value: "direct",
                    len: 0
                };
            }
            else {
                advance("number");
                oValue = oPreviousToken; // number token
                oValue.type = "label"; // number => label
            }
            that.iLine = oValue.value; // set line number for error messages
            oValue.args = statements(null);
            if (oToken.type === "(eol)") {
                advance("(eol)");
            }
            return oValue;
        }, infix = function (id, lbp, rbp, led) {
            rbp = rbp || lbp;
            symbol(id, null, lbp, led || function (left) {
                var oValue = oPreviousToken;
                oValue.left = left;
                oValue.right = expression(rbp);
                return oValue;
            });
        }, infixr = function (id, lbp, rbp, led) {
            rbp = rbp || lbp;
            symbol(id, null, lbp, led || function (left) {
                var oValue = oPreviousToken;
                oValue.left = left;
                oValue.right = expression(rbp - 1);
                return oValue;
            });
        }, prefix = function (id, rbp) {
            symbol(id, function () {
                var oValue = oPreviousToken;
                oValue.right = expression(rbp);
                return oValue;
            });
        }, stmt = function (s, f) {
            var x = symbol(s);
            x.std = f;
            return x;
        }, fnCreateDummyArg = function (value) {
            return {
                type: String(value),
                value: value,
                len: 0
            };
        }, fnGetOptionalStream = function () {
            var oValue;
            if (oToken.type === "#") { // stream?
                oValue = expression(0);
            }
            else { // create dummy
                oValue = fnCreateDummyArg("#"); // dummy stream
                oValue.right = fnCreateDummyArg(null); // ...with dummy parameter
            }
            return oValue;
        }, fnGetLineRange = function (sTypeFirstChar) {
            var oRange, oLeft;
            if (oToken.type === "number") {
                oLeft = oToken;
                advance("number");
            }
            if (oToken.type === "-") {
                oRange = oToken;
                advance("-");
            }
            if (oRange) {
                var oRight = void 0;
                if (oToken.type === "number") {
                    oRight = oToken;
                    advance("number");
                }
                if (!oLeft && !oRight) {
                    throw that.composeError(Error(), "Expected " + BasicParser.mParameterTypes[sTypeFirstChar], oPreviousToken.value, oPreviousToken.pos);
                }
                oRange.type = "linerange"; // change "-" => "linerange"
                oRange.left = oLeft || fnCreateDummyArg(null); // insert dummy for left
                oRange.right = oRight || fnCreateDummyArg(null); // insert dummy for right (do not skip it)
            }
            else if (oLeft) {
                oRange = oLeft; // single line number
            }
            return oRange;
        }, fnIsSingleLetterIdentifier = function (oValue) {
            return oValue.type === "identifier" && !oValue.args && oValue.value.length === 1;
        }, fnGetLetterRange = function (sTypeFirstChar) {
            if (oToken.type !== "identifier") {
                throw that.composeError(Error(), "Expected " + BasicParser.mParameterTypes[sTypeFirstChar], oToken.value, oToken.pos);
            }
            var oExpression = expression(0); // n or n-n
            if (fnIsSingleLetterIdentifier(oExpression)) { // ok
                oExpression.type = "letter"; // change type: identifier -> letter
            }
            else if (oExpression.type === "-" && fnIsSingleLetterIdentifier(oExpression.left) && fnIsSingleLetterIdentifier(oExpression.right)) { // also ok
                oExpression.type = "range"; // change type: "-" => range
                oExpression.left.type = "letter"; // change type: identifier -> letter
                oExpression.right.type = "letter"; // change type: identifier -> letter
            }
            else {
                throw that.composeError(Error(), "Expected " + BasicParser.mParameterTypes[sTypeFirstChar], oExpression.value, oExpression.pos);
            }
            return oExpression;
        }, fnCheckRemainingTypes = function (aTypes) {
            for (var i = 0; i < aTypes.length; i += 1) { // some more parameters expected?
                var sType = aTypes[i];
                if (!sType.endsWith("?") && !sType.endsWith("*")) { // mandatory?
                    var sText = BasicParser.mParameterTypes[sType] || ("parameter " + sType);
                    throw that.composeError(Error(), "Expected " + sText + " for " + oPreviousToken.type, oToken.value, oToken.pos);
                }
            }
        }, fnGetArgs = function (sKeyword) {
            var aArgs = [], sSeparator = ",", mCloseTokens = BasicParser.mCloseTokens;
            var bNeedMore = false, sType = "xxx", aTypes;
            if (sKeyword) {
                var sKeyOpts = BasicParser.mKeywords[sKeyword];
                if (sKeyOpts) {
                    aTypes = sKeyOpts.split(" ");
                    aTypes.shift(); // remove keyword type
                }
                else {
                    Utils_1.Utils.console.warn("fnGetArgs: No options for keyword", sKeyword);
                }
            }
            while (bNeedMore || (sType && !mCloseTokens[oToken.type])) {
                bNeedMore = false;
                if (aTypes && sType.slice(-1) !== "*") { // "*"= any number of parameters
                    sType = aTypes.shift();
                    if (!sType) {
                        throw that.composeError(Error(), "Expected end of arguments", oPreviousToken.type, oPreviousToken.pos);
                    }
                }
                var sTypeFirstChar = sType.charAt(0);
                var oExpression = void 0;
                if (sType === "#0?") { // optional stream?
                    if (oToken.type === "#") { // stream?
                        oExpression = fnGetOptionalStream();
                        if (oToken.type === ",") {
                            advance(",");
                            bNeedMore = true;
                        }
                    }
                    else {
                        oExpression = fnGetOptionalStream();
                    }
                }
                else {
                    if (sTypeFirstChar === "#") { // stream expected? (for functions)
                        oExpression = expression(0);
                        if (oExpression.type !== "#") { // maybe a number
                            throw that.composeError(Error(), "Expected " + BasicParser.mParameterTypes[sTypeFirstChar], oExpression.value, oExpression.pos);
                        }
                    }
                    else if (oToken.type === sSeparator && sType.substr(0, 2) === "n0") { // n0 or n0?: if parameter not specified, insert default value null?
                        oExpression = fnCreateDummyArg(null);
                    }
                    else if (sTypeFirstChar === "l") {
                        oExpression = expression(0);
                        if (oExpression.type !== "number") { // maybe an expression and no plain number
                            throw that.composeError(Error(), "Expected " + BasicParser.mParameterTypes[sTypeFirstChar], oExpression.value, oExpression.pos);
                        }
                        oExpression.type = "linenumber"; // change type: number => linenumber
                    }
                    else if (sTypeFirstChar === "v") { // variable (identifier)
                        oExpression = expression(0);
                        if (oExpression.type !== "identifier") {
                            throw that.composeError(Error(), "Expected " + BasicParser.mParameterTypes[sTypeFirstChar], oExpression.value, oExpression.pos);
                        }
                    }
                    else if (sTypeFirstChar === "r") { // letter or range of letters (defint, defreal, defstr)
                        oExpression = fnGetLetterRange(sTypeFirstChar);
                    }
                    else if (sTypeFirstChar === "q") { // line number range
                        if (sType === "q0?") { // optional line number range
                            if (oToken.type === "number" || oToken.type === "-") { // eslint-disable-line max-depth
                                oExpression = fnGetLineRange(sTypeFirstChar);
                            }
                            else {
                                oExpression = fnCreateDummyArg(null);
                                if (aTypes.length) { // eslint-disable-line max-depth
                                    bNeedMore = true; // maybe take it as next parameter
                                }
                            }
                        }
                        else {
                            oExpression = fnGetLineRange(sTypeFirstChar);
                        }
                    }
                    else {
                        oExpression = expression(0);
                        if (oExpression.type === "#") { // got stream?
                            throw that.composeError(Error(), "Unexpected stream", oExpression.value, oExpression.pos);
                        }
                    }
                    if (oToken.type === sSeparator) {
                        advance(sSeparator);
                        bNeedMore = true;
                    }
                    else if (!bNeedMore) {
                        sType = ""; // stop
                    }
                }
                aArgs.push(oExpression);
            }
            if (aTypes && aTypes.length) { // some more parameters expected?
                fnCheckRemainingTypes(aTypes); // error if remaining mandatory args
                sType = aTypes[0];
                if (sType === "#0?") { // null stream to add?
                    var oExpression = fnCreateDummyArg("#"); // dummy stream with dummy arg
                    oExpression.right = fnCreateDummyArg(null); //TTT any
                    aArgs.push(oExpression);
                }
            }
            return aArgs;
        }, fnGetArgsSepByCommaSemi = function () {
            var mCloseTokens = BasicParser.mCloseTokens, aArgs = [];
            while (!mCloseTokens[oToken.type]) {
                aArgs.push(expression(0));
                if (oToken.type === "," || oToken.type === ";") {
                    advance(oToken.type);
                }
                else {
                    break;
                }
            }
            return aArgs;
        }, fnGetArgsInParenthesis = function () {
            advance("(");
            var aArgs = fnGetArgs(null); //until ")"
            advance(")");
            return aArgs;
        }, fnGetArgsInParenthesesOrBrackets = function () {
            var oBrackets = {
                "(": ")",
                "[": "]"
            };
            var oBracketOpen;
            if (oToken.type === "(" || oToken.type === "[") { // oBrackets[oToken.type]
                oBracketOpen = oToken;
            }
            advance(oBracketOpen ? oBracketOpen.type : "(");
            var aArgs = fnGetArgs(null); // (until "]" or ")")
            aArgs.unshift(oBracketOpen);
            var oBracketClose;
            if (oToken.type === ")" || oToken.type === "]") {
                oBracketClose = oToken;
            }
            advance(oBracketClose ? oBracketClose.type : ")");
            aArgs.push(oBracketClose);
            if (oBrackets[oBracketOpen.type] !== oBracketClose.type) {
                if (!that.bQuiet) {
                    Utils_1.Utils.console.warn(that.composeError({}, "Inconsistent bracket style", oPreviousToken.value, oPreviousToken.pos).message);
                }
            }
            return aArgs;
        }, fnCreateCmdCall = function (sType) {
            var oValue = oPreviousToken;
            if (sType) {
                oValue.type = sType;
            }
            oValue.args = fnGetArgs(oValue.type);
            return oValue;
        }, fnCreateFuncCall = function (sType) {
            var oValue = oPreviousToken;
            if (sType) {
                oValue.type = sType;
            }
            if (oToken.type === "(") { // args in parenthesis?
                advance("(");
                oValue.args = fnGetArgs(oValue.type); //until ")"
                if (oToken.type !== ")") {
                    throw that.composeError(Error(), "Expected closing parenthesis for argument list after", oPreviousToken.value, oToken.pos); //TTT
                }
                advance(")");
            }
            else { // no parenthesis?
                oValue.args = [];
                // if we have a check, make sure there are no non-optional parameters left
                var sKeyOpts = BasicParser.mKeywords[oValue.type];
                if (sKeyOpts) {
                    var aTypes = sKeyOpts.split(" ");
                    aTypes.shift(); // remove key
                    fnCheckRemainingTypes(aTypes);
                }
            }
            return oValue;
        }, fnGenerateKeywordSymbols = function () {
            var fnFunc = function () {
                return fnCreateFuncCall(null);
            }, fnCmd = function () {
                return fnCreateCmdCall(null);
            };
            for (var sKey in BasicParser.mKeywords) {
                if (BasicParser.mKeywords.hasOwnProperty(sKey)) {
                    var sValue = BasicParser.mKeywords[sKey];
                    if (sValue.charAt(0) === "f") {
                        symbol(sKey, fnFunc);
                    }
                    else if (sValue.charAt(0) === "c") {
                        stmt(sKey, fnCmd);
                    }
                }
            }
        }, fnInputOrLineInput = function (oValue) {
            oValue.args = [];
            var oStream = fnGetOptionalStream();
            oValue.args.push(oStream);
            if (oStream.len !== 0) { // not an inserted stream?
                advance(",");
            }
            if (oToken.type === ";") { // no newline after input?
                oValue.args.push(oToken);
                advance(";");
            }
            else {
                oValue.args.push(fnCreateDummyArg(null));
            }
            if (oToken.type === "string") { // message
                oValue.args.push(oToken);
                advance("string");
                if (oToken.type === ";" || oToken.type === ",") { // ";" => need to append prompt "? " , "," = no prompt
                    oValue.args.push(oToken);
                    advance(oToken.type);
                }
                else {
                    throw that.composeError(Error(), "Expected ; or ,", oToken.type, oToken.pos);
                }
            }
            else {
                oValue.args.push(fnCreateDummyArg(null)); // dummy message
                oValue.args.push(fnCreateDummyArg(null)); // dummy prompt
            }
            do { // we need loop for input
                var oValue2 = expression(90); // we expect "identifier", no fnxx
                if (oValue2.type !== "identifier") {
                    throw that.composeError(Error(), "Expected identifier", oPreviousToken.type, oPreviousToken.pos);
                }
                oValue.args.push(oValue2);
                if (oValue.type === "lineInput") {
                    break; // no loop for lineInput (only one arg)
                }
            } while ((oToken.type === ",") && advance(","));
            return oValue;
        };
        fnGenerateKeywordSymbols();
        symbol(":");
        symbol(";");
        symbol(",");
        symbol(")");
        symbol("]");
        // define additional statement parts
        symbol("break");
        symbol("spc");
        symbol("step");
        symbol("swap");
        symbol("then");
        symbol("tab");
        symbol("to");
        symbol("using");
        symbol("(eol)");
        symbol("(end)");
        symbol("number", function (number) {
            return number;
        });
        symbol("binnumber", function (number) {
            return number;
        });
        symbol("hexnumber", function (number) {
            return number;
        });
        symbol("linenumber", function (number) {
            return number;
        });
        symbol("string", function (s) {
            return s;
        });
        symbol("identifier", function (oName) {
            var sName = oName.value, bStartsWithFn = sName.toLowerCase().startsWith("fn");
            if (bStartsWithFn) {
                if (oToken.type !== "(") { // Fnxxx name without ()?
                    var oValue_1 = {
                        type: "fn",
                        value: sName.substr(0, 2),
                        args: [],
                        left: oName,
                        pos: oName.pos // same pos as identifier?
                    };
                    return oValue_1;
                }
            }
            var oValue = oName;
            if (oToken.type === "(" || oToken.type === "[") {
                oValue = oPreviousToken;
                if (bStartsWithFn) {
                    oValue.args = fnGetArgsInParenthesis();
                    oValue.type = "fn"; // FNxxx in e.g. print
                    oValue.left = {
                        type: "identifier",
                        value: oValue.value,
                        pos: oValue.pos
                    };
                }
                else {
                    oValue.args = fnGetArgsInParenthesesOrBrackets();
                }
            }
            return oValue;
        });
        symbol("(", function () {
            var oValue = expression(0);
            advance(")");
            return oValue;
        });
        symbol("[", function () {
            var oValue = expression(0);
            advance("]");
            return oValue;
        });
        prefix("@", 95); // address of
        infix("^", 90, 80);
        prefix("+", 80);
        prefix("-", 80);
        infix("*", 70);
        infix("/", 70);
        infix("\\", 60); // integer division
        infix("mod", 50);
        infix("+", 40);
        infix("-", 40);
        infixr("=", 30); // equal for comparison
        infixr("<>", 30);
        infixr("<", 30);
        infixr("<=", 30);
        infixr(">", 30);
        infixr(">=", 30);
        prefix("not", 23);
        infixr("and", 22);
        infixr("or", 21);
        infixr("xor", 20);
        prefix("#", 10); // priority ok?
        symbol("fn", function () {
            var oValue = oPreviousToken;
            if (oToken.type === "identifier") { // maybe simplify by separating in lexer
                oToken.value = oPreviousToken.value + oToken.value; // "fn" + identifier
                oToken.bSpace = true; //fast hack: set space for CodeGeneratorBasic
                oValue.left = oToken;
                advance("identifier");
            }
            else {
                throw that.composeError(Error(), "Expected identifier", oToken.type, oToken.pos);
            }
            if (oToken.type !== "(") { // FN xxx name without ()?
                oValue.args = [];
            }
            else {
                oValue.args = fnGetArgsInParenthesis();
            }
            return oValue;
        });
        // statements ...
        stmt("'", function () {
            return fnCreateCmdCall("rem");
        });
        stmt("|", function () {
            var oValue = oPreviousToken;
            if (oToken.type === ",") { // arguments starting with comma
                advance(",");
            }
            oValue.args = fnGetArgs(null);
            return oValue;
        });
        stmt("after", function () {
            var oValue = fnCreateCmdCall("afterGosub"); // interval and optional timer
            if (oValue.args.length < 2) { // add default timer 0
                oValue.args.push(fnCreateDummyArg(null));
            }
            advance("gosub");
            var aLine = fnGetArgs("gosub"); // line number
            oValue.args.push(aLine[0]);
            return oValue;
        });
        stmt("chain", function () {
            var sName = "chain", oValue;
            if (oToken.type !== "merge") { // not chain merge?
                oValue = fnCreateCmdCall(sName);
            }
            else { // chain merge with optional DELETE
                advance("merge");
                oValue = oPreviousToken;
                sName = "chainMerge";
                oValue.type = sName;
                oValue.args = [];
                var oValue2 = expression(0); // filename
                oValue.args.push(oValue2);
                if (oToken.type === ",") {
                    advance(",");
                    var bNumberExpression = false; // line number (expression) found
                    if (oToken.type !== "," && oToken.type !== "(eol)" && oToken.type !== "(eof)") {
                        oValue2 = expression(0); // line number or expression
                        oValue.args.push(oValue2);
                        bNumberExpression = true;
                    }
                    if (oToken.type === ",") {
                        advance(",");
                        advance("delete");
                        if (!bNumberExpression) {
                            oValue2 = fnCreateDummyArg(null); // insert dummy arg for line
                            oValue.args.push(oValue2);
                        }
                        oValue2 = fnGetLineRange("q");
                        oValue.args.push(oValue2);
                    }
                }
            }
            return oValue;
        });
        stmt("clear", function () {
            var sName = "clear";
            if (oToken.type === "input") { // clear input?
                advance("input");
                sName = "clearInput";
            }
            return fnCreateCmdCall(sName);
        });
        stmt("data", function () {
            var oValue = oPreviousToken;
            var bParameterFound = false;
            oValue.args = [];
            // data is special: it can have empty parameters, also the last parameter, and also if no parameters
            if (oToken.type !== "," && oToken.type !== "(eol)" && oToken.type !== "(end)") {
                oValue.args.push(expression(0)); // take first argument
                bParameterFound = true;
            }
            while (oToken.type === ",") {
                if (!bParameterFound) {
                    oValue.args.push(fnCreateDummyArg(null)); // insert null parameter
                }
                advance(",");
                bParameterFound = false;
                if (oToken.type === "(eol)" || oToken.type === "(end)") {
                    break;
                }
                else if (oToken.type !== ",") {
                    oValue.args.push(expression(0));
                    bParameterFound = true;
                }
            }
            if (!bParameterFound) {
                oValue.args.push(fnCreateDummyArg(null)); // insert null parameter
            }
            return oValue;
        });
        stmt("def", function () {
            var oValue = oPreviousToken;
            if (oToken.type === "fn") { // fn <identifier> separate?
                advance("fn");
                if (oToken.type === "identifier") {
                    oToken.value = oPreviousToken.value + oToken.value;
                    oToken.bSpace = true; //fast hack: set space for CodeGeneratorBasic
                    oValue.left = oToken;
                }
                else {
                    throw that.composeError(Error(), "Invalid DEF", oToken.type, oToken.pos);
                }
            }
            else if (oToken.type === "identifier" && oToken.value.toLowerCase().startsWith("fn")) { // fn<identifier>
                oValue.left = oToken;
            }
            else {
                throw that.composeError(Error(), "Invalid DEF", oToken.type, oToken.pos);
            }
            advance();
            oValue.args = (oToken.type === "(") ? fnGetArgsInParenthesis() : [];
            advance("=");
            oValue.right = expression(0);
            return oValue;
        });
        stmt("else", function () {
            var oValue = oPreviousToken;
            oValue.args = [];
            if (!that.bQuiet) {
                Utils_1.Utils.console.warn(that.composeError({}, "ELSE: Weird use of ELSE", oPreviousToken.type, oPreviousToken.pos).message);
            }
            // TODO: data line as separate statement is taken
            while (oToken.type !== "(eol)" && oToken.type !== "(end)") {
                oValue.args.push(oToken); // collect tokens unchecked, may contain syntax error
                advance(oToken.type);
            }
            return oValue;
        });
        stmt("ent", function () {
            var oValue = oPreviousToken;
            oValue.args = [];
            oValue.args.push(expression(0)); // should be number or variable
            var iCount = 0;
            while (oToken.type === ",") {
                advance(",");
                if (oToken.type === "=" && iCount % 3 === 0) { // special handling for parameter "number of steps"
                    advance("=");
                    var oExpression_1 = fnCreateDummyArg(null); // insert null parameter
                    oValue.args.push(oExpression_1);
                    iCount += 1;
                }
                var oExpression = expression(0);
                oValue.args.push(oExpression);
                iCount += 1;
            }
            return oValue;
        });
        stmt("env", function () {
            var oValue = oPreviousToken;
            oValue.args = [];
            oValue.args.push(expression(0)); // should be number or variable
            var iCount = 0;
            while (oToken.type === ",") {
                advance(",");
                if (oToken.type === "=" && iCount % 3 === 0) { // special handling for parameter "number of steps"
                    advance("=");
                    var oExpression_2 = fnCreateDummyArg(null); // insert null parameter
                    oValue.args.push(oExpression_2);
                    iCount += 1;
                }
                var oExpression = expression(0);
                oValue.args.push(oExpression);
                iCount += 1;
            }
            return oValue;
        });
        stmt("every", function () {
            var oValue = fnCreateCmdCall("everyGosub"); // interval and optional timer
            if (oValue.args.length < 2) { // add default timer
                oValue.args.push(fnCreateDummyArg(null));
            }
            advance("gosub");
            var aLine = fnGetArgs("gosub"); // line number
            oValue.args.push(aLine[0]);
            return oValue;
        });
        stmt("for", function () {
            var oValue = oPreviousToken;
            if (oToken.type !== "identifier") {
                throw that.composeError(Error(), "Expected identifier", oToken.type, oToken.pos);
            }
            var oName = expression(90); // take simple identifier, nothing more
            if (oName.type !== "identifier") {
                throw that.composeError(Error(), "Expected simple identifier", oToken.type, oToken.pos);
            }
            oValue.args = [oName];
            advance("=");
            oValue.args.push(expression(0));
            advance("to");
            oValue.args.push(expression(0));
            if (oToken.type === "step") {
                advance("step");
                oValue.args.push(expression(0));
            }
            else {
                oValue.args.push(fnCreateDummyArg(null));
            }
            return oValue;
        });
        stmt("graphics", function () {
            var oValue;
            if (oToken.type === "pen" || oToken.type === "paper") { // graphics pen/paper
                var sName = "graphics" + Utils_1.Utils.stringCapitalize(oToken.type);
                advance(oToken.type);
                oValue = fnCreateCmdCall(sName);
            }
            else {
                throw that.composeError(Error(), "Expected PEN or PAPER", oToken.type, oToken.pos);
            }
            return oValue;
        });
        stmt("if", function () {
            var oValue = oPreviousToken;
            oValue.args = [];
            oValue.left = expression(0);
            if (oToken.type === "goto") {
                // skip "then"
                oValue.right = statements("else");
            }
            else {
                advance("then");
                if (oToken.type === "number") {
                    var oValue2 = fnCreateCmdCall("goto"); // take "then" as "goto", checks also for line number
                    oValue2.len = 0; // mark it as inserted
                    var oToken2 = oToken;
                    oValue.right = statements("else");
                    if (oValue.right.length && oValue.right[0].type !== "rem") {
                        if (!that.bQuiet) {
                            Utils_1.Utils.console.warn(that.composeError({}, "IF: Unreachable code after THEN", oToken2.type, oToken2.pos).message);
                        }
                    }
                    oValue.right.unshift(oValue2);
                }
                else {
                    oValue.right = statements("else");
                }
            }
            if (oToken.type === "else") {
                advance("else");
                if (oToken.type === "number") {
                    var oValue2 = fnCreateCmdCall("goto"); // take "then" as "goto", checks also for line number
                    oValue2.len = 0; // mark it as inserted
                    var oToken2 = oToken;
                    oValue.third = statements("else");
                    if (oValue.third.length) {
                        if (!that.bQuiet) {
                            Utils_1.Utils.console.warn(that.composeError({}, "IF: Unreachable code after ELSE", oToken2.type, oToken2.pos).message);
                        }
                    }
                    oValue.third.unshift(oValue2);
                }
                else if (oToken.type === "if") {
                    oValue.third = [statement()];
                }
                else {
                    oValue.third = statements("else");
                }
            }
            else {
                oValue.third = null;
            }
            return oValue;
        });
        stmt("input", function () {
            var oValue = oPreviousToken;
            fnInputOrLineInput(oValue);
            return oValue;
        });
        stmt("key", function () {
            var sName = "key";
            if (oToken.type === "def") { // key def?
                advance("def");
                sName = "keyDef";
            }
            return fnCreateCmdCall(sName);
        });
        stmt("let", function () {
            var oValue = oPreviousToken;
            oValue.right = assignment();
            return oValue;
        });
        stmt("line", function () {
            var oValue = oPreviousToken;
            advance("input");
            oValue.type = "lineInput";
            fnInputOrLineInput(oValue);
            return oValue;
        });
        stmt("mid$", function () {
            var oValue = fnCreateFuncCall("mid$Assign"); // change type mid$ => mid$Assign
            if (oValue.args[0].type !== "identifier") {
                throw that.composeError(Error(), "Expected identifier", oValue.args[0].value, oValue.args[0].pos);
            }
            advance("="); // equal as assignment
            var oRight = expression(0);
            oValue.right = oRight;
            return oValue;
        });
        stmt("on", function () {
            var oValue = oPreviousToken;
            oValue.args = [];
            if (oToken.type === "break") {
                advance("break");
                if (oToken.type === "gosub") {
                    advance("gosub");
                    oValue.type = "onBreakGosub";
                    oValue.args = fnGetArgs(oValue.type);
                }
                else if (oToken.type === "cont") {
                    advance("cont");
                    oValue.type = "onBreakCont";
                }
                else if (oToken.type === "stop") {
                    advance("stop");
                    oValue.type = "onBreakStop";
                }
                else {
                    throw that.composeError(Error(), "Expected GOSUB, CONT or STOP", oToken.type, oToken.pos);
                }
            }
            else if (oToken.type === "error") { // on error goto
                advance("error");
                if (oToken.type === "goto") {
                    advance("goto");
                    oValue.type = "onErrorGoto";
                    oValue.args = fnGetArgs(oValue.type);
                }
                else {
                    throw that.composeError(Error(), "Expected GOTO", oToken.type, oToken.pos);
                }
            }
            else if (oToken.type === "sq") { // on sq(n) gosub
                var oLeft = expression(0);
                oLeft = oLeft.args[0];
                if (oToken.type === "gosub") {
                    advance("gosub");
                    oValue.type = "onSqGosub";
                    oValue.args = fnGetArgs(oValue.type);
                    oValue.args.unshift(oLeft);
                }
                else {
                    throw that.composeError(Error(), "Expected GOSUB", oToken.type, oToken.pos);
                }
            }
            else {
                var oLeft = expression(0);
                if (oToken.type === "gosub") {
                    advance("gosub");
                    oValue.type = "onGosub";
                    oValue.args = fnGetArgs(oValue.type);
                    oValue.args.unshift(oLeft);
                }
                else if (oToken.type === "goto") {
                    advance("goto");
                    oValue.type = "onGoto";
                    oValue.args = fnGetArgs(oValue.type);
                    oValue.args.unshift(oLeft);
                }
                else {
                    throw that.composeError(Error(), "Expected GOTO or GOSUB", oToken.type, oToken.pos);
                }
            }
            return oValue;
        });
        stmt("print", function () {
            var oValue = oPreviousToken, mCloseTokens = BasicParser.mCloseTokens, oStream = fnGetOptionalStream();
            oValue.args = [];
            oValue.args.push(oStream);
            var bCommaAfterStream = false;
            if (oStream.len !== 0) { // not an inserted stream?
                bCommaAfterStream = true;
            }
            while (!mCloseTokens[oToken.type]) {
                if (bCommaAfterStream) {
                    advance(",");
                    bCommaAfterStream = false;
                }
                var oValue2 = void 0;
                if (oToken.type === "spc" || oToken.type === "tab") {
                    advance(oToken.type);
                    oValue2 = fnCreateFuncCall(null);
                }
                else if (oToken.type === "using") {
                    oValue2 = oToken;
                    advance("using");
                    var t = expression(0); // format
                    advance(";"); // after the format there must be a ";"
                    oValue2.args = fnGetArgsSepByCommaSemi();
                    oValue2.args.unshift(t);
                    if (oPreviousToken.type === ";") { // using closed by ";"?
                        oValue.args.push(oValue2);
                        oValue2 = oPreviousToken; // keep it for print
                    }
                }
                else if (BasicParser.mKeywords[oToken.type] && (BasicParser.mKeywords[oToken.type].charAt(0) === "c" || BasicParser.mKeywords[oToken.type].charAt(0) === "x")) { // stop also at keyword which is c=command or x=command addition
                    break;
                    //TTT: oValue2 not set?
                }
                else if (oToken.type === ";" || oToken.type === ",") { // separator ";" or comma tab separator ","
                    oValue2 = oToken;
                    advance(oToken.type);
                }
                else {
                    oValue2 = expression(0);
                }
                oValue.args.push(oValue2);
            }
            return oValue;
        });
        stmt("?", function () {
            //TTT
            var oValue = oSymbols.print.std(); // "?" is same as print
            oValue.type = "print";
            return oValue;
        });
        stmt("resume", function () {
            var sName = "resume";
            if (oToken.type === "next") { // resume next
                advance("next");
                sName = "resumeNext";
            }
            var oValue = fnCreateCmdCall(sName);
            return oValue;
        });
        stmt("speed", function () {
            var sName = "";
            switch (oToken.type) {
                case "ink":
                    sName = "speedInk";
                    advance("ink");
                    break;
                case "key":
                    sName = "speedKey";
                    advance("key");
                    break;
                case "write":
                    sName = "speedWrite";
                    advance("write");
                    break;
                default:
                    throw that.composeError(Error(), "Expected INK, KEY or WRITE", oToken.type, oToken.pos);
            }
            return fnCreateCmdCall(sName);
        });
        stmt("symbol", function () {
            var sName = "symbol";
            if (oToken.type === "after") { // symbol after?
                advance("after");
                sName = "symbolAfter";
            }
            return fnCreateCmdCall(sName);
        });
        stmt("window", function () {
            var sName = "window";
            if (oToken.type === "swap") {
                advance("swap");
                sName = "windowSwap";
            }
            return fnCreateCmdCall(sName);
        });
        // line
        iIndex = 0;
        advance();
        while (oToken.type !== "(end)") {
            aParseTree.push(line());
        }
        return aParseTree;
    };
    BasicParser.mParameterTypes = {
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
    BasicParser.mKeywords = {
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
        fn: "f",
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
        tag: "c #?",
        tagoff: "c #?",
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
        zone: "c n" // ZONE <integer expression>  / integer expression=1..255
    };
    BasicParser.mCloseTokens = {
        ":": 1,
        "(eol)": 1,
        "(end)": 1,
        "else": 1,
        rem: 1,
        "'": 1
    };
    return BasicParser;
}());
exports.BasicParser = BasicParser;
;
//# sourceMappingURL=BasicParser.js.map