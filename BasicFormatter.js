"use strict";
// BasicFormatter.ts - Format BASIC source
// (c) Marco Vieth, 2020
// https://benchmarko.github.io/CPCBasicTS/
//
//
Object.defineProperty(exports, "__esModule", { value: true });
exports.BasicFormatter = void 0;
var Utils_1 = require("./Utils");
var BasicFormatter = /** @class */ (function () {
    function BasicFormatter(options) {
        this.iLine = 0;
        this.lexer = options.lexer;
        this.parser = options.parser;
        this.reset();
    }
    BasicFormatter.prototype.reset = function () {
        this.iLine = 0; // current line (label)
    };
    BasicFormatter.prototype.composeError = function (oError, message, value, pos) {
        return Utils_1.Utils.composeError("BasicFormatter", oError, message, value, pos, this.iLine);
    };
    // renumber
    BasicFormatter.prototype.fnCreateLineNumbersMap = function (aNodes) {
        var oLines = {}; // line numbers
        var iLastLine = 0;
        oLines[0] = {
            value: 0,
            pos: 0,
            len: 0
        };
        for (var i = 0; i < aNodes.length; i += 1) {
            var oNode = aNodes[i];
            if (oNode.type === "label") {
                var sLine = oNode.value, iLine = Number(oNode.value);
                this.iLine = iLine;
                if (sLine in oLines) {
                    throw this.composeError(Error(), "Duplicate line number", sLine, oNode.pos);
                }
                if (iLine <= iLastLine) {
                    throw this.composeError(Error(), "Line number not increasing", sLine, oNode.pos);
                }
                if (iLine < 1 || iLine > 65535) {
                    throw this.composeError(Error(), "Line number overflow", sLine, oNode.pos);
                }
                oLines[oNode.value] = {
                    value: iLine,
                    pos: oNode.pos,
                    len: String(oNode.orig || oNode.value).length
                };
                iLastLine = iLine;
            }
        }
        return oLines;
    };
    BasicFormatter.prototype.fnAddSingleReference = function (oNode, oLines, aRefs) {
        if (oNode.type === "linenumber") {
            if (oNode.value in oLines) {
                aRefs.push({
                    value: Number(oNode.value),
                    pos: oNode.pos,
                    len: String(oNode.orig || oNode.value).length
                });
            }
            else {
                throw this.composeError(Error(), "Line does not exist", oNode.value, oNode.pos);
            }
        }
    };
    BasicFormatter.prototype.fnAddReferences = function (aNodes, oLines, aRefs) {
        for (var i = 0; i < aNodes.length; i += 1) {
            var oNode = aNodes[i];
            if (oNode.type === "label") {
                this.iLine = Number(oNode.value); // for error messages
            }
            else {
                this.fnAddSingleReference(oNode, oLines, aRefs);
            }
            if (oNode.left) {
                this.fnAddSingleReference(oNode.left, oLines, aRefs);
            }
            if (oNode.right) {
                this.fnAddSingleReference(oNode.right, oLines, aRefs);
            }
            if (oNode.args) {
                this.fnAddReferences(oNode.args, oLines, aRefs); // revursive
            }
            if (oNode.args2) { // for "ELSE"
                this.fnAddReferences(oNode.args2, oLines, aRefs); // revursive
            }
        }
    };
    BasicFormatter.prototype.fnRenumberLines = function (oLines, aRefs, iNew, iOld, iStep, iKeep) {
        var oChanges = {}, aKeys = Object.keys(oLines);
        for (var i = 0; i < aKeys.length; i += 1) {
            var oLine = oLines[aKeys[i]];
            if (oLine.value >= iOld && oLine.value < iKeep) {
                if (iNew > 65535) {
                    throw this.composeError(Error(), "Line number overflow", String(oLine.value), oLine.pos);
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
        return oChanges;
    };
    BasicFormatter.fnSortNumbers = function (a, b) {
        return a - b;
    };
    BasicFormatter.fnApplyChanges = function (sInput, oChanges) {
        var aKeys = Object.keys(oChanges).map(Number);
        aKeys.sort(BasicFormatter.fnSortNumbers);
        // apply changes to input in reverse order
        for (var i = aKeys.length - 1; i >= 0; i -= 1) {
            var oLine = oChanges[aKeys[i]];
            sInput = sInput.substring(0, oLine.pos) + oLine.newLine + sInput.substr(oLine.pos + oLine.len);
        }
        return sInput;
    };
    BasicFormatter.prototype.fnRenumber = function (sInput, aParseTree, iNew, iOld, iStep, iKeep) {
        var aRefs = [], // references
        oLines = this.fnCreateLineNumbersMap(aParseTree);
        this.fnAddReferences(aParseTree, oLines, aRefs); // create reference list
        var oChanges = this.fnRenumberLines(oLines, aRefs, iNew, iOld, iStep, iKeep), sOutput = BasicFormatter.fnApplyChanges(sInput, oChanges);
        return sOutput;
    };
    BasicFormatter.prototype.renumber = function (sInput, iNew, iOld, iStep, iKeep) {
        var oOut = {
            text: ""
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
//# sourceMappingURL=BasicFormatter.js.map