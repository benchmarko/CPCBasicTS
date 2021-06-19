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
        this.sLine = ""; // current line (label) for error messages
        this.lexer = options.lexer;
        this.parser = options.parser;
    }
    BasicFormatter.prototype.composeError = function (oError, message, value, pos) {
        return Utils_1.Utils.composeError("BasicFormatter", oError, message, value, pos, this.sLine);
    };
    // renumber
    BasicFormatter.prototype.fnCreateLineNumbersMap = function (aNodes) {
        var oLines = {}; // line numbers
        var iLastLine = -1;
        for (var i = 0; i < aNodes.length; i += 1) {
            var oNode = aNodes[i];
            if (oNode.type === "label") {
                var sLine = oNode.value, iLine = Number(sLine);
                this.sLine = sLine;
                if (sLine in oLines) {
                    throw this.composeError(Error(), "Duplicate line number", sLine, oNode.pos);
                }
                if (iLine <= iLastLine) {
                    throw this.composeError(Error(), "Line number not increasing", sLine, oNode.pos);
                }
                if (iLine < 1 || iLine > 65535) {
                    throw this.composeError(Error(), "Line number overflow", sLine, oNode.pos);
                }
                oLines[sLine] = {
                    value: sLine,
                    pos: oNode.pos,
                    len: (oNode.orig || sLine).length
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
                    value: oNode.value,
                    pos: oNode.pos,
                    len: (oNode.orig || oNode.value).length
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
                this.sLine = oNode.value;
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
                if (oNode.type === "onErrorGoto" && oNode.args.length === 1 && oNode.args[0].value === "0") {
                    // ignore "on error goto 0"
                }
                else {
                    this.fnAddReferences(oNode.args, oLines, aRefs); // recursive
                }
            }
            if (oNode.args2) { // for "ELSE"
                this.fnAddReferences(oNode.args2, oLines, aRefs); // recursive
            }
        }
    };
    BasicFormatter.prototype.fnRenumberLines = function (oLines, aRefs, iNew, iOld, iStep, iKeep) {
        var oChanges = {}, aKeys = Object.keys(oLines);
        for (var i = 0; i < aKeys.length; i += 1) {
            var oLine = oLines[aKeys[i]], iLine = Number(oLine.value);
            if (iLine >= iOld && iLine < iKeep) {
                if (iNew > 65535) {
                    throw this.composeError(Error(), "Line number overflow", oLine.value, oLine.pos);
                }
                oLine.newLine = iNew;
                oChanges[oLine.pos] = oLine;
                iNew += iStep;
            }
        }
        for (var i = 0; i < aRefs.length; i += 1) {
            var oRef = aRefs[i], sLine = oRef.value, iLine = Number(sLine);
            if (iLine >= iOld && iLine < iKeep) {
                if (iLine !== oLines[sLine].newLine) {
                    oRef.newLine = oLines[sLine].newLine;
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
        this.sLine = ""; // current line (label)
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