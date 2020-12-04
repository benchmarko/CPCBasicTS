// BasicFormatter.ts - Format BASIC source
// (c) Marco Vieth, 2020
// https://benchmarko.github.io/CPCBasic/
//
//
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BasicFormatter = void 0;
var Utils_1 = require("./Utils");
var BasicFormatter = /** @class */ (function () {
    function BasicFormatter(options) {
        this.iLine = 0;
        this.init(options);
    }
    BasicFormatter.prototype.init = function (options) {
        this.lexer = options.lexer;
        this.parser = options.parser;
        this.reset();
    };
    BasicFormatter.prototype.reset = function () {
        this.iLine = 0; // current line (label)
    };
    BasicFormatter.prototype.composeError = function () {
        //var aArgs = Array.prototype.slice.call(arguments);
        var aArgs = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            aArgs[_i] = arguments[_i];
        }
        aArgs.unshift("BasicFormatter");
        return Utils_1.Utils.composeError.apply(null, aArgs);
    };
    BasicFormatter.prototype.fnRenumber = function (sInput, aParseTree, iNew, iOld, iStep, iKeep) {
        var that = this, oLines = {}, // line numbers
        aRefs = [], // references
        oChanges = {}, fnCreateLineNumbersMap = function () {
            var iLastLine = 0;
            oLines[0] = {
                value: 0
            };
            for (var i = 0; i < aParseTree.length; i += 1) {
                var oNode = aParseTree[i];
                if (oNode.type === "label") {
                    var sLine = oNode.value, iLine = Number(oNode.value);
                    if (sLine in oLines) {
                        throw that.composeError(Error(), "Duplicate line number", sLine, oNode.pos);
                    }
                    if (iLine <= iLastLine) {
                        throw that.composeError(Error(), "Line number not increasing", sLine, oNode.pos);
                    }
                    if (iLine < 1 || iLine > 65535) {
                        throw that.composeError(Error(), "Line number overflow", sLine, oNode.pos);
                    }
                    oLines[oNode.value] = {
                        value: iLine,
                        pos: oNode.pos,
                        len: String(oNode.orig || oNode.value).length
                    };
                    iLastLine = iLine;
                }
            }
        }, fnAddReferences = function (aNodes) {
            for (var i = 0; i < aNodes.length; i += 1) {
                var oNode = aNodes[i];
                if (oNode.type === "linenumber") {
                    if (oNode.value in oLines) {
                        aRefs.push({
                            value: Number(oNode.value),
                            pos: oNode.pos,
                            len: String(oNode.orig || oNode.value).length
                        });
                    }
                    else {
                        throw that.composeError(Error(), "Line does not exist", oNode.value, oNode.pos);
                    }
                }
                if (oNode.left) {
                    fnAddReferences(oNode.left);
                }
                if (oNode.right) {
                    fnAddReferences(oNode.right);
                }
                if (oNode.third) {
                    fnAddReferences(oNode.third);
                }
                if (oNode.args) {
                    fnAddReferences(oNode.args);
                }
            }
        }, fnRenumberLines = function () {
            var aKeys = Object.keys(oLines);
            for (var i = 0; i < aKeys.length; i += 1) {
                var oLine = oLines[aKeys[i]];
                if (oLine.value >= iOld && oLine.value < iKeep) {
                    if (iNew > 65535) {
                        throw that.composeError(Error(), "Line number overflow", oLine.value, oLine.pos);
                    }
                    oLine.newLine = iNew;
                    oChanges[oLine.pos] = oLine;
                    iNew += iStep;
                }
            }
            for (var i = 0; i < aRefs.length; i += 1) {
                var oRef = aRefs[i];
                if (oRef.value >= iOld && oRef.value < iKeep) {
                    if (oRef.value !== oLines[oRef.value].newLine) {
                        oRef.newLine = oLines[oRef.value].newLine;
                        oChanges[oRef.pos] = oRef;
                    }
                }
            }
        }, fnSortNumbers = function (a, b) {
            return a - b;
        }, fnApplyChanges = function () {
            var aKeys = Object.keys(oChanges).map(Number);
            aKeys.sort(fnSortNumbers);
            // apply changes to input in reverse order
            for (var i = aKeys.length - 1; i >= 0; i -= 1) {
                var oLine = oChanges[aKeys[i]];
                sInput = sInput.substring(0, oLine.pos) + oLine.newLine + sInput.substr(oLine.pos + oLine.len);
            }
        };
        fnCreateLineNumbersMap();
        fnAddReferences(aParseTree); // create reference list
        fnRenumberLines();
        fnApplyChanges();
        return sInput;
    };
    BasicFormatter.prototype.renumber = function (sInput, iNew, iOld, iStep, iKeep) {
        var oOut = {
            text: "",
            error: undefined
        };
        try {
            var aTokens = this.lexer.lex(sInput), aParseTree = this.parser.parse(aTokens), sOutput = this.fnRenumber(sInput, aParseTree, iNew, iOld, iStep, iKeep || 65535);
            oOut.text = sOutput;
        }
        catch (e) {
            oOut.error = e;
        }
        return oOut;
    };
    return BasicFormatter;
}());
exports.BasicFormatter = BasicFormatter;
;
//# sourceMappingURL=BasicFormatter.js.map