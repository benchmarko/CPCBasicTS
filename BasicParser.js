"use strict";
// BasicParser.ts - BASIC Parser
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//
// BASIC parser for Locomotive BASIC 1.1 for Amstrad CPC 6128
//
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
var BasicParser = /** @class */ (function () {
    function BasicParser(options) {
        this.sLine = "0"; // for error messages
        this.bQuiet = false;
        this.oSymbols = {};
        // set also during parse
        this.aTokens = [];
        this.bAllowDirect = false;
        this.iIndex = 0;
        this.aParseTree = [];
        this.bQuiet = (options === null || options === void 0 ? void 0 : options.bQuiet) || false;
        this.fnGenerateSymbols();
        this.oPreviousToken = {}; // to avoid warnings
        this.oToken = this.oPreviousToken;
    }
    BasicParser.prototype.composeError = function (oError, message, value, pos) {
        return Utils_1.Utils.composeError("BasicParser", oError, message, value, pos, this.sLine);
    };
    // http://crockford.com/javascript/tdop/tdop.html (old: http://javascript.crockford.com/tdop/tdop.html)
    // http://crockford.com/javascript/tdop/parse.js
    // Operator precedence parsing
    //
    // Operator: With left binding power (lbp) and operational function.
    // Manipulates tokens to its left (e.g: +)? => left denotative function led(), otherwise null denotative function nud()), (e.g. unary -)
    // identifiers, numbers: also nud.
    BasicParser.prototype.getToken = function () {
        return this.oToken;
    };
    BasicParser.prototype.symbol = function (id, nud, lbp, led) {
        var oSymbol = this.oSymbols[id];
        if (!oSymbol) {
            this.oSymbols[id] = {};
            oSymbol = this.oSymbols[id];
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
    };
    BasicParser.prototype.advance = function (id) {
        var oToken = this.oToken;
        this.oPreviousToken = this.oToken;
        if (id && oToken.type !== id) {
            throw this.composeError(Error(), "Expected " + id, (oToken.value === "") ? oToken.type : oToken.value, oToken.pos);
        }
        if (this.iIndex >= this.aTokens.length) {
            Utils_1.Utils.console.warn("advance: end of file");
            if (this.aTokens.length && this.aTokens[this.aTokens.length - 1].type === "(end)") {
                oToken = this.aTokens[this.aTokens.length - 1];
            }
            else {
                Utils_1.Utils.console.warn("advance: No (end) token!");
                oToken = BasicParser.fnCreateDummyArg("(end)");
                oToken.value = ""; // null
            }
            return oToken;
        }
        oToken = this.aTokens[this.iIndex]; // we get a lex token and reuse it as parseTree token
        this.iIndex += 1;
        if (oToken.type === "identifier" && BasicParser.mKeywords[oToken.value.toLowerCase()]) {
            oToken.type = oToken.value.toLowerCase(); // modify type identifier => keyword xy
        }
        var oSym = this.oSymbols[oToken.type];
        if (!oSym) {
            throw this.composeError(Error(), "Unknown token", oToken.type, oToken.pos);
        }
        this.oToken = oToken;
        return oToken;
    };
    BasicParser.prototype.expression = function (rbp) {
        var t = this.oToken, s = this.oSymbols[t.type];
        if (Utils_1.Utils.debug > 3) {
            Utils_1.Utils.console.debug("parse: expression rbp=" + rbp + " type=" + t.type + " t=%o", t);
        }
        this.advance(t.type);
        if (!s.nud) {
            if (t.type === "(end)") {
                throw this.composeError(Error(), "Unexpected end of file", "", t.pos);
            }
            else {
                throw this.composeError(Error(), "Unexpected token", t.type, t.pos);
            }
        }
        var left = s.nud.call(this, t); // process literals, variables, and prefix operators
        t = this.oToken;
        s = this.oSymbols[t.type];
        while (rbp < (s.lbp || 0)) { // as long as the right binding power is less than the left binding power of the next token...
            this.advance(t.type);
            if (!s.led) {
                throw this.composeError(Error(), "Unexpected token", t.type, t.pos); //TTT how to get this error?
            }
            left = s.led.call(this, left); // ...the led method is invoked on the following token (infix and suffix operators), can be recursive
            t = this.oToken;
            s = this.oSymbols[t.type];
        }
        return left;
    };
    BasicParser.prototype.assignment = function () {
        if (this.oToken.type !== "identifier") {
            throw this.composeError(Error(), "Expected identifier", this.oToken.type, this.oToken.pos);
        }
        var oLeft = this.expression(90), // take it (can also be an array) and stop
        oValue = this.oToken;
        this.advance("="); // equal as assignment
        oValue.left = oLeft;
        oValue.right = this.expression(0);
        oValue.type = "assign"; // replace "="
        return oValue;
    };
    BasicParser.prototype.statement = function () {
        var t = this.oToken, s = this.oSymbols[t.type];
        if (s.std) { // statement?
            this.advance();
            return s.std.call(this);
        }
        var oValue;
        if (t.type === "identifier") {
            oValue = this.assignment();
        }
        else {
            oValue = this.expression(0);
        }
        if (oValue.type !== "assign" && oValue.type !== "fcall" && oValue.type !== "def" && oValue.type !== "(" && oValue.type !== "[") {
            throw this.composeError(Error(), "Bad expression statement", t.value, t.pos);
        }
        return oValue;
    };
    BasicParser.prototype.statements = function (sStopType) {
        var aStatements = [];
        var bColonExpected = false;
        while (this.oToken.type !== "(end)" && this.oToken.type !== "(eol)") {
            if (sStopType && this.oToken.type === sStopType) {
                break;
            }
            if (bColonExpected || this.oToken.type === ":") {
                if (this.oToken.type !== "'" && this.oToken.type !== "else") { // no colon required for line comment or ELSE
                    this.advance(":");
                }
                bColonExpected = false;
            }
            else {
                var oStatement = this.statement();
                aStatements.push(oStatement);
                bColonExpected = true;
            }
        }
        return aStatements;
    };
    BasicParser.prototype.line = function () {
        var oValue;
        if (this.oToken.type !== "number" && this.bAllowDirect) {
            this.bAllowDirect = false; // allow only once
            oValue = BasicParser.fnCreateDummyArg("label");
            oValue.value = "direct"; // insert "direct" label
        }
        else {
            this.advance("number");
            oValue = this.oPreviousToken; // number token
            oValue.type = "label"; // number => label
        }
        this.sLine = oValue.value; // set line number for error messages
        oValue.args = this.statements("");
        if (this.oToken.type === "(eol)") {
            this.advance("(eol)");
        }
        return oValue;
    };
    BasicParser.prototype.infix = function (id, lbp, rbp, led) {
        var _this = this;
        rbp = rbp || lbp;
        var fnLed = led || (function (left) {
            var oValue = _this.oPreviousToken;
            oValue.left = left;
            oValue.right = _this.expression(rbp);
            return oValue;
        });
        this.symbol(id, undefined, lbp, fnLed);
    };
    /*
    private infix(id: string, lbp: number, rbp?: number, led?: ParseExpressionFunction) {
        const that = this;

        rbp = rbp || lbp;
        this.symbol(id, undefined, lbp, led || function (left: ParserNode) {
            const oValue = that.oPreviousToken;

            oValue.left = left;
            oValue.right = that.expression(rbp as number);
            return oValue;
        });
    }
    */
    BasicParser.prototype.infixr = function (id, lbp) {
        var _this = this;
        var fnLed = (function (left) {
            var oValue = _this.oPreviousToken;
            oValue.left = left;
            oValue.right = _this.expression(lbp - 1);
            return oValue;
        });
        this.symbol(id, undefined, lbp, fnLed);
    };
    /*
    private infixr(id: string, lbp: number, rbp?: number, led?: ParseExpressionFunction) {
        const that = this;

        rbp = rbp || lbp;
        this.symbol(id, undefined, lbp, led || function (left) {
            const oValue = that.oPreviousToken;

            oValue.left = left;
            oValue.right = that.expression(rbp as number - 1);
            return oValue;
        });
    }
*/
    BasicParser.prototype.prefix = function (id, rbp) {
        var _this = this;
        var fnNud = function () {
            var oValue = _this.oPreviousToken;
            oValue.right = _this.expression(rbp);
            return oValue;
        };
        this.symbol(id, fnNud);
    };
    /*
    private prefix(id: string, rbp: number) {
        const that = this;

        this.symbol(id, function () {
            const oValue = that.oPreviousToken;

            oValue.right = that.expression(rbp);
            return oValue;
        });
    }
    */
    BasicParser.prototype.stmt = function (s, f) {
        var x = this.symbol(s);
        x.std = f;
        return x;
    };
    BasicParser.fnCreateDummyArg = function (value) {
        var oValue = {
            type: value,
            value: value,
            pos: 0,
            len: 0
        };
        return oValue;
    };
    BasicParser.prototype.fnGetOptionalStream = function () {
        var oValue;
        if (this.oToken.type === "#") { // stream?
            oValue = this.expression(0);
        }
        else { // create dummy
            oValue = BasicParser.fnCreateDummyArg("#"); // dummy stream
            oValue.right = BasicParser.fnCreateDummyArg("null"); // ...with dummy parameter
        }
        return oValue;
    };
    BasicParser.prototype.fnChangeNumber2LineNumber = function (oNode) {
        if (oNode.type === "number") {
            oNode.type = "linenumber"; // change type: number => linenumber
        }
        else {
            throw this.composeError(Error(), "Expected number type", oNode.type, oNode.pos);
        }
    };
    BasicParser.prototype.fnGetLineRange = function (sTypeFirstChar) {
        var oLeft;
        if (this.oToken.type === "number") {
            oLeft = this.oToken;
            this.advance("number");
            this.fnChangeNumber2LineNumber(oLeft);
        }
        var oRange;
        if (this.oToken.type === "-") {
            oRange = this.oToken;
            this.advance("-");
        }
        if (oRange) {
            var oRight = void 0;
            if (this.oToken.type === "number") {
                oRight = this.oToken;
                this.advance("number");
                this.fnChangeNumber2LineNumber(oRight);
            }
            if (!oLeft && !oRight) {
                throw this.composeError(Error(), "Expected " + BasicParser.mParameterTypes[sTypeFirstChar], this.oPreviousToken.value, this.oPreviousToken.pos);
            }
            oRange.type = "linerange"; // change "-" => "linerange"
            oRange.left = oLeft || BasicParser.fnCreateDummyArg("null"); // insert dummy for left
            oRange.right = oRight || BasicParser.fnCreateDummyArg("null"); // insert dummy for right (do not skip it)
        }
        else if (oLeft) {
            oRange = oLeft; // single line number
            oRange.type = "linenumber"; // change type: number => linenumber
        }
        else {
            throw this.composeError(Error(), "Undefined range", this.oToken.type, this.oToken.pos);
        }
        return oRange;
    };
    BasicParser.fnIsSingleLetterIdentifier = function (oValue) {
        return oValue.type === "identifier" && !oValue.args && oValue.value.length === 1;
    };
    BasicParser.prototype.fnGetLetterRange = function (sTypeFirstChar) {
        if (this.oToken.type !== "identifier") {
            throw this.composeError(Error(), "Expected " + BasicParser.mParameterTypes[sTypeFirstChar], this.oToken.value, this.oToken.pos);
        }
        var oExpression = this.expression(0); // n or n-n
        if (BasicParser.fnIsSingleLetterIdentifier(oExpression)) { // ok
            oExpression.type = "letter"; // change type: identifier -> letter
        }
        else if (oExpression.type === "-" && oExpression.left && oExpression.right && BasicParser.fnIsSingleLetterIdentifier(oExpression.left) && BasicParser.fnIsSingleLetterIdentifier(oExpression.right)) { // also ok
            oExpression.type = "range"; // change type: "-" => range
            oExpression.left.type = "letter"; // change type: identifier -> letter
            oExpression.right.type = "letter"; // change type: identifier -> letter
        }
        else {
            throw this.composeError(Error(), "Expected " + BasicParser.mParameterTypes[sTypeFirstChar], oExpression.value, oExpression.pos);
        }
        return oExpression;
    };
    BasicParser.prototype.fnCheckRemainingTypes = function (aTypes) {
        for (var i = 0; i < aTypes.length; i += 1) { // some more parameters expected?
            var sType = aTypes[i];
            if (!sType.endsWith("?") && !sType.endsWith("*")) { // mandatory?
                var sText = BasicParser.mParameterTypes[sType] || ("parameter " + sType);
                throw this.composeError(Error(), "Expected " + sText + " for " + this.oPreviousToken.type, this.oToken.value, this.oToken.pos);
            }
        }
    };
    BasicParser.prototype.fnGetArgs = function (sKeyword) {
        var aTypes;
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
        var aArgs = [], sSeparator = ",", mCloseTokens = BasicParser.mCloseTokens;
        var bNeedMore = false, sType = "xxx";
        while (bNeedMore || (sType && !mCloseTokens[this.oToken.type])) {
            bNeedMore = false;
            if (aTypes && sType.slice(-1) !== "*") { // "*"= any number of parameters
                sType = aTypes.shift() || "";
                if (!sType) {
                    throw this.composeError(Error(), "Expected end of arguments", this.oPreviousToken.type, this.oPreviousToken.pos);
                }
            }
            var sTypeFirstChar = sType.charAt(0);
            var oExpression = void 0;
            if (sType === "#0?") { // optional stream?
                if (this.oToken.type === "#") { // stream?
                    oExpression = this.fnGetOptionalStream();
                    if (this.getToken().type === ",") { // oToken.type
                        this.advance(",");
                        bNeedMore = true;
                    }
                }
                else {
                    oExpression = this.fnGetOptionalStream();
                }
            }
            else {
                if (sTypeFirstChar === "#") { // stream expected? (for functions)
                    oExpression = this.expression(0);
                    if (oExpression.type !== "#") { // maybe a number
                        throw this.composeError(Error(), "Expected " + BasicParser.mParameterTypes[sTypeFirstChar], oExpression.value, oExpression.pos);
                    }
                }
                else if (this.oToken.type === sSeparator && sType.substr(0, 2) === "n0") { // n0 or n0?: if parameter not specified, insert default value null?
                    oExpression = BasicParser.fnCreateDummyArg("null");
                }
                else if (sTypeFirstChar === "l") {
                    oExpression = this.expression(0);
                    if (oExpression.type !== "number") { // maybe an expression and no plain number
                        throw this.composeError(Error(), "Expected " + BasicParser.mParameterTypes[sTypeFirstChar], oExpression.value, oExpression.pos);
                    }
                    this.fnChangeNumber2LineNumber(oExpression);
                }
                else if (sTypeFirstChar === "v") { // variable (identifier)
                    oExpression = this.expression(0);
                    if (oExpression.type !== "identifier") {
                        throw this.composeError(Error(), "Expected " + BasicParser.mParameterTypes[sTypeFirstChar], oExpression.value, oExpression.pos);
                    }
                }
                else if (sTypeFirstChar === "r") { // letter or range of letters (defint, defreal, defstr)
                    oExpression = this.fnGetLetterRange(sTypeFirstChar);
                }
                else if (sTypeFirstChar === "q") { // line number range
                    if (sType === "q0?") { // optional line number range
                        if (this.oToken.type === "number" || this.oToken.type === "-") { // eslint-disable-line max-depth
                            oExpression = this.fnGetLineRange(sTypeFirstChar);
                        }
                        else {
                            oExpression = BasicParser.fnCreateDummyArg("null");
                            if (aTypes && aTypes.length) { // eslint-disable-line max-depth
                                bNeedMore = true; // maybe take it as next parameter
                            }
                        }
                    }
                    else {
                        oExpression = this.fnGetLineRange(sTypeFirstChar);
                    }
                }
                else {
                    oExpression = this.expression(0);
                    if (oExpression.type === "#") { // got stream?
                        throw this.composeError(Error(), "Unexpected stream", oExpression.value, oExpression.pos);
                    }
                }
                if (this.oToken.type === sSeparator) {
                    this.advance(sSeparator);
                    bNeedMore = true;
                }
                else if (!bNeedMore) {
                    sType = ""; // stop
                }
            }
            aArgs.push(oExpression);
        }
        if (aTypes && aTypes.length) { // some more parameters expected?
            this.fnCheckRemainingTypes(aTypes); // error if remaining mandatory args
            sType = aTypes[0];
            if (sType === "#0?") { // null stream to add?
                var oExpression = BasicParser.fnCreateDummyArg("#"); // dummy stream with dummy arg
                oExpression.right = BasicParser.fnCreateDummyArg("null");
                aArgs.push(oExpression);
            }
        }
        return aArgs;
    };
    BasicParser.prototype.fnGetArgsSepByCommaSemi = function () {
        var mCloseTokens = BasicParser.mCloseTokens, aArgs = [];
        while (!mCloseTokens[this.oToken.type]) {
            aArgs.push(this.expression(0));
            if (this.oToken.type === "," || this.oToken.type === ";") {
                this.advance(this.oToken.type);
            }
            else {
                break;
            }
        }
        return aArgs;
    };
    BasicParser.prototype.fnGetArgsInParenthesis = function () {
        this.advance("(");
        var aArgs = this.fnGetArgs(undefined); // until ")"
        this.advance(")");
        return aArgs;
    };
    BasicParser.prototype.fnGetArgsInParenthesesOrBrackets = function () {
        var mBrackets = BasicParser.mBrackets;
        var oBracketOpen;
        if (this.oToken.type === "(" || this.oToken.type === "[") {
            oBracketOpen = this.oToken;
        }
        this.advance(oBracketOpen ? oBracketOpen.type : "(");
        if (!oBracketOpen) {
            throw this.composeError(Error(), "Programming error: Undefined oBracketOpen", this.oToken.type, this.oToken.pos); // should not occure
        }
        var aArgs = this.fnGetArgs(undefined); // (until "]" or ")")
        aArgs.unshift(oBracketOpen);
        var oBracketClose;
        if (this.oToken.type === ")" || this.oToken.type === "]") {
            oBracketClose = this.oToken;
        }
        this.advance(oBracketClose ? oBracketClose.type : ")");
        if (!oBracketClose) {
            throw this.composeError(Error(), "Programming error: Undefined oBracketClose", this.oToken.type, this.oToken.pos); // should not occure
        }
        aArgs.push(oBracketClose);
        if (mBrackets[oBracketOpen.type] !== oBracketClose.type) {
            if (!this.bQuiet) {
                Utils_1.Utils.console.warn(this.composeError({}, "Inconsistent bracket style", this.oPreviousToken.value, this.oPreviousToken.pos).message);
            }
        }
        return aArgs;
    };
    BasicParser.prototype.fnCreateCmdCall = function (sType) {
        var oValue = this.oPreviousToken;
        if (sType) {
            oValue.type = sType; // override
        }
        oValue.args = this.fnGetArgs(oValue.type);
        return oValue;
    };
    BasicParser.prototype.fnCreateFuncCall = function () {
        var oValue = this.oPreviousToken;
        if (this.oToken.type === "(") { // args in parenthesis?
            this.advance("(");
            oValue.args = this.fnGetArgs(oValue.type);
            this.advance(")");
        }
        else { // no parenthesis?
            oValue.args = [];
            // if we have a check, make sure there are no non-optional parameters left
            var sKeyOpts = BasicParser.mKeywords[oValue.type];
            if (sKeyOpts) {
                var aTypes = sKeyOpts.split(" ");
                aTypes.shift(); // remove key
                this.fnCheckRemainingTypes(aTypes);
            }
        }
        return oValue;
    };
    BasicParser.prototype.fnGenerateKeywordSymbols = function () {
        for (var sKey in BasicParser.mKeywords) {
            if (BasicParser.mKeywords.hasOwnProperty(sKey)) {
                var sValue = BasicParser.mKeywords[sKey];
                if (sValue.charAt(0) === "f") {
                    this.symbol(sKey, this.fnCreateFuncCall);
                }
                else if (sValue.charAt(0) === "c") {
                    this.stmt(sKey, this.fnCreateCmdCall);
                }
            }
        }
    };
    // ...
    BasicParser.prototype.fnIdentifier = function (oName) {
        var sName = oName.value, bStartsWithFn = sName.toLowerCase().startsWith("fn");
        if (bStartsWithFn) {
            if (this.oToken.type !== "(") { // Fnxxx name without ()
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
        if (this.oToken.type === "(" || this.oToken.type === "[") {
            oValue = this.oPreviousToken;
            if (bStartsWithFn) {
                oValue.args = this.fnGetArgsInParenthesis();
                oValue.type = "fn"; // FNxxx in e.g. print
                oValue.left = {
                    type: "identifier",
                    value: oValue.value,
                    pos: oValue.pos
                };
            }
            else {
                oValue.args = this.fnGetArgsInParenthesesOrBrackets();
            }
        }
        return oValue;
    };
    BasicParser.prototype.fnParenthesis = function () {
        var oValue = this.expression(0);
        this.advance(")");
        return oValue;
    };
    /*
    private fnBracket() { // "["
        const oValue = this.expression(0);

        this.advance("]");
        return oValue;
    }
    */
    BasicParser.prototype.fnFn = function () {
        var oValue = this.oPreviousToken, // "fn"
        oValue2 = this.oToken; // identifier
        this.advance("identifier");
        oValue2.value = oValue.value + oValue2.value; // combine "fn" + identifier (maybe simplify by separating in lexer)
        oValue2.bSpace = true; // fast hack: set space for CodeGeneratorBasic
        oValue.left = oValue2;
        if (this.oToken.type !== "(") { // FN xxx name without ()?
            oValue.args = [];
        }
        else {
            oValue.args = this.fnGetArgsInParenthesis();
        }
        return oValue;
    };
    BasicParser.prototype.fnApostrophe = function () {
        return this.fnCreateCmdCall("rem");
    };
    BasicParser.prototype.fnRsx = function () {
        var oValue = this.oPreviousToken;
        if (this.oToken.type === ",") { // arguments starting with comma
            this.advance(",");
        }
        oValue.args = this.fnGetArgs(undefined);
        return oValue;
    };
    BasicParser.prototype.fnAfterOrEvery = function () {
        var sType = this.oPreviousToken.type + "Gosub", // "afterGosub" or "everyGosub"
        oValue = this.fnCreateCmdCall(sType); // interval and optional timer
        if (!oValue.args) {
            throw this.composeError(Error(), "Programming error: Undefined args", this.oToken.type, this.oToken.pos); // should not occure
        }
        if (oValue.args.length < 2) { // add default timer 0
            oValue.args.push(BasicParser.fnCreateDummyArg("null"));
        }
        this.advance("gosub");
        var aLine = this.fnGetArgs("gosub"); // line number
        oValue.args.push(aLine[0]);
        return oValue;
    };
    BasicParser.prototype.fnChain = function () {
        var sName = "chain", oValue;
        if (this.oToken.type !== "merge") { // not chain merge?
            oValue = this.fnCreateCmdCall(sName);
        }
        else { // chain merge with optional DELETE
            this.oToken = this.advance("merge");
            oValue = this.oPreviousToken;
            sName = "chainMerge";
            oValue.type = sName;
            oValue.args = [];
            var oValue2 = this.expression(0); // filename
            oValue.args.push(oValue2);
            if (this.oToken.type === ",") {
                this.advance(",");
                var bNumberExpression = false; // line number (expression) found
                if (this.oToken.type !== "," && this.oToken.type !== "(eol)" && this.oToken.type !== "(eof)") {
                    oValue2 = this.expression(0); // line number or expression
                    oValue.args.push(oValue2);
                    bNumberExpression = true;
                }
                if (this.oToken.type === ",") {
                    this.advance(",");
                    this.advance("delete");
                    if (!bNumberExpression) {
                        oValue2 = BasicParser.fnCreateDummyArg("null"); // insert dummy arg for line
                        oValue.args.push(oValue2);
                    }
                    oValue2 = this.fnGetLineRange("q");
                    oValue.args.push(oValue2);
                }
            }
        }
        return oValue;
    };
    BasicParser.prototype.fnClear = function () {
        var sName = "clear";
        if (this.oToken.type === "input") { // clear input?
            this.advance("input");
            sName = "clearInput";
        }
        return this.fnCreateCmdCall(sName);
    };
    BasicParser.prototype.fnData = function () {
        var oValue = this.oPreviousToken;
        var bParameterFound = false;
        oValue.args = [];
        // data is special: it can have empty parameters, also the last parameter, and also if no parameters
        if (this.oToken.type !== "," && this.oToken.type !== "(eol)" && this.oToken.type !== "(end)") {
            oValue.args.push(this.expression(0)); // take first argument
            bParameterFound = true;
        }
        while (this.oToken.type === ",") {
            if (!bParameterFound) {
                oValue.args.push(BasicParser.fnCreateDummyArg("null")); // insert null parameter
            }
            this.oToken = this.advance(",");
            bParameterFound = false;
            if (this.oToken.type === "(eol)" || this.oToken.type === "(end)") {
                break;
            }
            else if (this.oToken.type !== ",") {
                oValue.args.push(this.expression(0));
                bParameterFound = true;
            }
        }
        if (!bParameterFound) {
            oValue.args.push(BasicParser.fnCreateDummyArg("null")); // insert null parameter
        }
        return oValue;
    };
    BasicParser.prototype.fnDef = function () {
        var oValue = this.oPreviousToken; // def
        var oValue2 = this.oToken, // fn or fn<identifier>
        oFn;
        if (oValue2.type === "fn") { // fn and <identifier> separate?
            oFn = oValue2;
            oValue2 = this.advance("fn");
        }
        this.oToken = this.advance("identifier");
        if (oFn) { // separate fn?
            oValue2.value = oFn.value + oValue2.value; // combine "fn" + identifier (maybe simplify by separating in lexer)
            oValue2.bSpace = true; // fast hack: set space for CodeGeneratorBasic
        }
        else if (!oValue2.value.toLowerCase().startsWith("fn")) { // not fn<identifier>
            throw this.composeError(Error(), "Invalid DEF", this.oToken.type, this.oToken.pos);
        }
        oValue.left = oValue2;
        oValue.args = (this.oToken.type === "(") ? this.fnGetArgsInParenthesis() : [];
        this.advance("=");
        oValue.right = this.expression(0);
        return oValue;
    };
    BasicParser.prototype.fnElse = function () {
        var oValue = this.oPreviousToken;
        oValue.args = [];
        if (!this.bQuiet) {
            Utils_1.Utils.console.warn(this.composeError({}, "ELSE: Weird use of ELSE", this.oPreviousToken.type, this.oPreviousToken.pos).message);
        }
        // TODO: data line as separate statement is taken
        while (this.oToken.type !== "(eol)" && this.oToken.type !== "(end)") {
            oValue.args.push(this.oToken); // collect tokens unchecked, may contain syntax error
            this.advance(this.oToken.type);
        }
        return oValue;
    };
    BasicParser.prototype.fnEntOrEnv = function () {
        var oValue = this.oPreviousToken;
        oValue.args = [];
        oValue.args.push(this.expression(0)); // should be number or variable
        var iCount = 0;
        while (this.oToken.type === ",") {
            this.oToken = this.advance(",");
            if (this.oToken.type === "=" && iCount % 3 === 0) { // special handling for parameter "number of steps"
                this.advance("=");
                var oExpression_1 = BasicParser.fnCreateDummyArg("null"); // insert null parameter
                oValue.args.push(oExpression_1);
                iCount += 1;
            }
            var oExpression = this.expression(0);
            oValue.args.push(oExpression);
            iCount += 1;
        }
        return oValue;
    };
    BasicParser.prototype.fnFor = function () {
        var oValue = this.oPreviousToken;
        if (this.oToken.type !== "identifier") {
            throw this.composeError(Error(), "Expected identifier", this.oToken.type, this.oToken.pos);
        }
        var oName = this.expression(90); // take simple identifier, nothing more
        if (oName.type !== "identifier") {
            throw this.composeError(Error(), "Expected simple identifier", this.oToken.type, this.oToken.pos);
        }
        oValue.args = [oName];
        this.advance("=");
        oValue.args.push(this.expression(0));
        this.oToken = this.advance("to");
        oValue.args.push(this.expression(0));
        if (this.oToken.type === "step") {
            this.advance("step");
            oValue.args.push(this.expression(0));
        }
        else {
            oValue.args.push(BasicParser.fnCreateDummyArg("null"));
        }
        return oValue;
    };
    BasicParser.prototype.fnGraphics = function () {
        var oValue;
        if (this.oToken.type === "pen" || this.oToken.type === "paper") { // graphics pen/paper
            var sName = "graphics" + Utils_1.Utils.stringCapitalize(this.oToken.type);
            this.advance(this.oToken.type);
            oValue = this.fnCreateCmdCall(sName);
        }
        else {
            throw this.composeError(Error(), "Expected PEN or PAPER", this.oToken.type, this.oToken.pos);
        }
        return oValue;
    };
    BasicParser.prototype.fnIf = function () {
        var oValue = this.oPreviousToken;
        oValue.left = this.expression(0);
        var aArgs;
        if (this.oToken.type === "goto") {
            // skip "then"
            aArgs = this.statements("else");
        }
        else {
            this.advance("then");
            if (this.oToken.type === "number") {
                var oValue2 = this.fnCreateCmdCall("goto"); // take "then" as "goto", checks also for line number
                oValue2.len = 0; // mark it as inserted
                var oToken2 = this.oToken;
                aArgs = this.statements("else");
                if (aArgs.length && aArgs[0].type !== "rem") {
                    if (!this.bQuiet) {
                        Utils_1.Utils.console.warn(this.composeError({}, "IF: Unreachable code after THEN", oToken2.type, oToken2.pos).message);
                    }
                }
                aArgs.unshift(oValue2);
            }
            else {
                aArgs = this.statements("else");
            }
        }
        oValue.args = aArgs; // then statements
        aArgs = undefined;
        if (this.oToken.type === "else") {
            this.oToken = this.advance("else");
            if (this.oToken.type === "number") {
                var oValue2 = this.fnCreateCmdCall("goto"); // take "then" as "goto", checks also for line number
                oValue2.len = 0; // mark it as inserted
                var oToken2 = this.oToken;
                aArgs = this.statements("else");
                if (aArgs.length) {
                    if (!this.bQuiet) {
                        Utils_1.Utils.console.warn(this.composeError({}, "IF: Unreachable code after ELSE", oToken2.type, oToken2.pos).message);
                    }
                }
                aArgs.unshift(oValue2);
            }
            else if (this.oToken.type === "if") {
                aArgs = [this.statement()];
            }
            else {
                aArgs = this.statements("else");
            }
        }
        if (aArgs !== undefined) {
            oValue.args2 = aArgs; // else statements
        }
        return oValue;
    };
    BasicParser.prototype.fnInput = function () {
        var oValue = this.oPreviousToken;
        oValue.args = [];
        var oStream = this.fnGetOptionalStream();
        oValue.args.push(oStream);
        if (oStream.len !== 0) { // not an inserted stream?
            this.advance(",");
        }
        if (this.oToken.type === ";") { // no newline after input?
            oValue.args.push(this.oToken);
            this.advance(";");
        }
        else {
            oValue.args.push(BasicParser.fnCreateDummyArg("null"));
        }
        if (this.oToken.type === "string") { // message
            oValue.args.push(this.oToken);
            this.oToken = this.advance("string");
            if (this.oToken.type === ";" || this.oToken.type === ",") { // ";" => need to append prompt "? " , "," = no prompt
                oValue.args.push(this.oToken);
                this.advance(this.oToken.type);
            }
            else {
                throw this.composeError(Error(), "Expected ; or ,", this.oToken.type, this.oToken.pos);
            }
        }
        else {
            oValue.args.push(BasicParser.fnCreateDummyArg("null")); // dummy message
            oValue.args.push(BasicParser.fnCreateDummyArg("null")); // dummy prompt
        }
        do { // we need loop for input
            var oValue2 = this.expression(90); // we expect "identifier", no fnxx
            if (oValue2.type !== "identifier") {
                throw this.composeError(Error(), "Expected identifier", this.oPreviousToken.type, this.oPreviousToken.pos);
            }
            oValue.args.push(oValue2);
            if (oValue.type === "lineInput") {
                break; // no loop for lineInput (only one arg)
            }
        } while ((this.oToken.type === ",") && this.advance(","));
        return oValue;
    };
    BasicParser.prototype.fnKey = function () {
        var sName = "key";
        if (this.oToken.type === "def") { // key def?
            this.advance("def");
            sName = "keyDef";
        }
        return this.fnCreateCmdCall(sName);
    };
    BasicParser.prototype.fnLet = function () {
        var oValue = this.oPreviousToken;
        oValue.right = this.assignment();
        return oValue;
    };
    BasicParser.prototype.fnLine = function () {
        var oValue = this.oPreviousToken;
        oValue.type = "lineInput"; // change type line => lineInput
        this.advance("input"); // ignore this token
        this.oPreviousToken = oValue; // set to token "lineInput"
        return this.fnInput(); // continue with input
    };
    BasicParser.prototype.fnMid$ = function () {
        this.oPreviousToken.type = "mid$Assign"; // change type mid$ => mid$Assign
        var oValue = this.fnCreateFuncCall();
        if (!oValue.args) {
            throw this.composeError(Error(), "Programming error: Undefined args", this.oToken.type, this.oToken.pos); // should not occure
        }
        if (oValue.args[0].type !== "identifier") {
            throw this.composeError(Error(), "Expected identifier", oValue.args[0].value, oValue.args[0].pos);
        }
        this.advance("="); // equal as assignment
        var oRight = this.expression(0);
        oValue.right = oRight;
        return oValue;
    };
    BasicParser.prototype.fnOn = function () {
        var oValue = this.oPreviousToken;
        oValue.args = [];
        if (this.oToken.type === "break") {
            this.oToken = this.advance("break");
            if (this.oToken.type === "gosub") {
                this.advance("gosub");
                oValue.type = "onBreakGosub";
                oValue.args = this.fnGetArgs(oValue.type);
            }
            else if (this.oToken.type === "cont") {
                this.advance("cont");
                oValue.type = "onBreakCont";
            }
            else if (this.oToken.type === "stop") {
                this.advance("stop");
                oValue.type = "onBreakStop";
            }
            else {
                throw this.composeError(Error(), "Expected GOSUB, CONT or STOP", this.oToken.type, this.oToken.pos);
            }
        }
        else if (this.oToken.type === "error") { // on error goto
            this.oToken = this.advance("error");
            this.advance("goto");
            oValue.type = "onErrorGoto";
            oValue.args = this.fnGetArgs(oValue.type);
        }
        else if (this.oToken.type === "sq") { // on sq(n) gosub
            var oLeft = this.expression(0);
            if (!oLeft.args) {
                throw this.composeError(Error(), "Programming error: Undefined args", this.oToken.type, this.oToken.pos); // should not occure
            }
            oLeft = oLeft.args[0];
            this.oToken = this.getToken();
            this.advance("gosub");
            oValue.type = "onSqGosub";
            oValue.args = this.fnGetArgs(oValue.type);
            oValue.args.unshift(oLeft);
        }
        else {
            var oLeft = this.expression(0);
            if (this.oToken.type === "gosub") {
                this.advance("gosub");
                oValue.type = "onGosub";
                oValue.args = this.fnGetArgs(oValue.type);
                oValue.args.unshift(oLeft);
            }
            else if (this.oToken.type === "goto") {
                this.advance("goto");
                oValue.type = "onGoto";
                oValue.args = this.fnGetArgs(oValue.type);
                oValue.args.unshift(oLeft);
            }
            else {
                throw this.composeError(Error(), "Expected GOTO or GOSUB", this.oToken.type, this.oToken.pos);
            }
        }
        return oValue;
    };
    BasicParser.prototype.fnPrint = function () {
        var oValue = this.oPreviousToken, mCloseTokens = BasicParser.mCloseTokens, oStream = this.fnGetOptionalStream();
        oValue.args = [];
        oValue.args.push(oStream);
        var bCommaAfterStream = false;
        if (oStream.len !== 0) { // not an inserted stream?
            bCommaAfterStream = true;
        }
        while (!mCloseTokens[this.oToken.type]) {
            if (bCommaAfterStream) {
                this.advance(",");
                bCommaAfterStream = false;
            }
            var oValue2 = void 0;
            if (this.oToken.type === "spc" || this.oToken.type === "tab") {
                this.advance(this.oToken.type);
                oValue2 = this.fnCreateFuncCall();
            }
            else if (this.oToken.type === "using") {
                oValue2 = this.oToken;
                this.advance("using");
                var t = this.expression(0); // format
                this.advance(";"); // after the format there must be a ";"
                oValue2.args = this.fnGetArgsSepByCommaSemi();
                oValue2.args.unshift(t);
                if (this.oPreviousToken.type === ";") { // using closed by ";"?
                    oValue.args.push(oValue2);
                    oValue2 = this.oPreviousToken; // keep it for print
                }
            }
            else if (BasicParser.mKeywords[this.oToken.type] && (BasicParser.mKeywords[this.oToken.type].charAt(0) === "c" || BasicParser.mKeywords[this.oToken.type].charAt(0) === "x")) { // stop also at keyword which is c=command or x=command addition
                break;
                //TTT: oValue2 not set?
            }
            else if (this.oToken.type === ";" || this.oToken.type === ",") { // separator ";" or comma tab separator ","
                oValue2 = this.oToken;
                this.advance(this.oToken.type);
            }
            else {
                oValue2 = this.expression(0);
            }
            oValue.args.push(oValue2);
        }
        return oValue;
    };
    BasicParser.prototype.fnQuestion = function () {
        var oValue = this.fnPrint();
        oValue.type = "print";
        return oValue;
    };
    BasicParser.prototype.fnResume = function () {
        var sName = "resume";
        if (this.oToken.type === "next") { // resume next
            this.advance("next");
            sName = "resumeNext";
        }
        var oValue = this.fnCreateCmdCall(sName);
        return oValue;
    };
    BasicParser.prototype.fnSpeed = function () {
        var sName = "";
        switch (this.oToken.type) {
            case "ink":
                sName = "speedInk";
                this.advance("ink");
                break;
            case "key":
                sName = "speedKey";
                this.advance("key");
                break;
            case "write":
                sName = "speedWrite";
                this.advance("write");
                break;
            default:
                throw this.composeError(Error(), "Expected INK, KEY or WRITE", this.oToken.type, this.oToken.pos);
        }
        return this.fnCreateCmdCall(sName);
    };
    BasicParser.prototype.fnSymbol = function () {
        var sName = "symbol";
        if (this.oToken.type === "after") { // symbol after?
            this.advance("after");
            sName = "symbolAfter";
        }
        return this.fnCreateCmdCall(sName);
    };
    BasicParser.prototype.fnWindow = function () {
        var sName = "window";
        if (this.oToken.type === "swap") {
            this.advance("swap");
            sName = "windowSwap";
        }
        return this.fnCreateCmdCall(sName);
    };
    BasicParser.prototype.fnGenerateSymbols = function () {
        this.fnGenerateKeywordSymbols();
        this.symbol(":");
        this.symbol(";");
        this.symbol(",");
        this.symbol(")");
        this.symbol("[");
        this.symbol("]");
        // define additional statement parts
        this.symbol("break");
        this.symbol("spc");
        this.symbol("step");
        this.symbol("swap");
        this.symbol("then");
        this.symbol("tab");
        this.symbol("to");
        this.symbol("using");
        this.symbol("(eol)");
        this.symbol("(end)");
        this.symbol("number", function (oNode) {
            return oNode;
        });
        this.symbol("binnumber", function (oNode) {
            return oNode;
        });
        this.symbol("hexnumber", function (oNode) {
            return oNode;
        });
        this.symbol("linenumber", function (oNode) {
            return oNode;
        });
        this.symbol("string", function (oNode) {
            return oNode;
        });
        this.symbol("identifier", this.fnIdentifier);
        this.symbol("(", this.fnParenthesis);
        //this.symbol("[", this.fnBracket);
        this.prefix("@", 95); // address of
        this.infix("^", 90, 80);
        this.prefix("+", 80);
        this.prefix("-", 80);
        this.infix("*", 70);
        this.infix("/", 70);
        this.infix("\\", 60); // integer division
        this.infix("mod", 50);
        this.infix("+", 40);
        this.infix("-", 40);
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
        // statements ...
        this.stmt("'", this.fnApostrophe);
        this.stmt("|", this.fnRsx); // rsx
        this.stmt("after", this.fnAfterOrEvery);
        this.stmt("chain", this.fnChain);
        this.stmt("clear", this.fnClear);
        this.stmt("data", this.fnData);
        this.stmt("def", this.fnDef);
        this.stmt("else", this.fnElse); // simular to a comment, normally not used
        this.stmt("ent", this.fnEntOrEnv);
        this.stmt("env", this.fnEntOrEnv);
        this.stmt("every", this.fnAfterOrEvery);
        this.stmt("for", this.fnFor);
        this.stmt("graphics", this.fnGraphics);
        this.stmt("if", this.fnIf);
        this.stmt("input", this.fnInput);
        this.stmt("key", this.fnKey);
        this.stmt("let", this.fnLet);
        this.stmt("line", this.fnLine);
        this.stmt("mid$", this.fnMid$); // mid$Assign
        this.stmt("on", this.fnOn);
        this.stmt("print", this.fnPrint);
        this.stmt("?", this.fnQuestion); // "?" is same as print
        this.stmt("resume", this.fnResume);
        this.stmt("speed", this.fnSpeed);
        this.stmt("symbol", this.fnSymbol);
        this.stmt("window", this.fnWindow);
    };
    // http://crockford.com/javascript/tdop/tdop.html (old: http://javascript.crockford.com/tdop/tdop.html)
    // http://crockford.com/javascript/tdop/parse.js
    // Operator precedence parsing
    //
    // Operator: With left binding power (lbp) and operational function.
    // Manipulates tokens to its left (e.g: +)? => left denotative function led(), otherwise null denotative function nud()), (e.g. unary -)
    // identifiers, numbers: also nud.
    BasicParser.prototype.parse = function (aTokens, bAllowDirect) {
        var aParseTree = this.aParseTree;
        this.aTokens = aTokens;
        this.bAllowDirect = bAllowDirect || false;
        // line
        this.sLine = "0"; // for error messages
        this.iIndex = 0;
        this.oToken = {};
        this.oPreviousToken = this.oToken; // just to avoid warning
        aParseTree.length = 0;
        this.advance();
        while (this.oToken.type !== "(end)") {
            aParseTree.push(this.line());
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
    BasicParser.mBrackets = {
        "(": ")",
        "[": "]"
    };
    return BasicParser;
}());
exports.BasicParser = BasicParser;
//# sourceMappingURL=BasicParser.js.map