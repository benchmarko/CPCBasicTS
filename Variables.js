"use strict";
// Variables.ts - Variables
// (c) Marco Vieth, 2020
// https://benchmarko.github.io/CPCBasic/
Object.defineProperty(exports, "__esModule", { value: true });
exports.Variables = void 0;
var Variables = /** @class */ (function () {
    function Variables() {
        this.init();
    }
    Variables.prototype.init = function () {
        this.oVariables = {};
        this.oVarTypes = {}; // default variable types for variables starting with letters a-z
    };
    Variables.prototype.removeAllVariables = function () {
        var oVariables = this.oVariables;
        for (var sName in oVariables) { // eslint-disable-line guard-for-in
            delete oVariables[sName];
        }
    };
    Variables.prototype.getAllVariables = function () {
        return this.oVariables;
    };
    Variables.prototype.createNDimArray = function (aDims, initVal) {
        var fnCreateRec = function (iIndex) {
            var iLen = aDims[iIndex], aArr = new Array(iLen);
            iIndex += 1;
            if (iIndex < aDims.length) { // more dimensions?
                for (var i = 0; i < iLen; i += 1) {
                    aArr[i] = fnCreateRec(iIndex); // recursive call
                }
            }
            else { // one dimension
                for (var i = 0; i < iLen; i += 1) {
                    aArr[i] = initVal;
                }
            }
            return aArr;
        }, aRet = fnCreateRec(0);
        return aRet;
    };
    // determine static varType (first letter + optional fixed vartype) from a variable name
    // format: (v.)<sname>(I|R|$)([...]([...])) with optional parts in ()
    Variables.prototype.determineStaticVarType = function (sName) {
        if (sName.indexOf("v.") === 0) { // preceding variable object?
            sName = sName.substr(2); // remove preceding "v."
        }
        var sNameType = sName.charAt(0); // take first character to determine var type later
        if (sNameType === "_") { // ignore underscore (do not clash with keywords)
            sNameType = sName.charAt(1);
        }
        // explicit type specified?
        if (sName.indexOf("I") >= 0) {
            sNameType += "I";
        }
        else if (sName.indexOf("R") >= 0) {
            sNameType += "R";
        }
        else if (sName.indexOf("$") >= 0) {
            sNameType += "$";
        }
        return sNameType;
    };
    Variables.prototype.getVarDefault = function (sVarName, aDimensions) {
        var bIsString = sVarName.includes("$");
        if (!bIsString) { // check dynamic varType...
            var sFirst = sVarName.charAt(0);
            if (sFirst === "_") { // ignore underscore (do not clash with keywords)
                sFirst = sFirst.charAt(1);
            }
            bIsString = (this.getVarType(sFirst) === "$");
        }
        var value = bIsString ? "" : 0, iArrayIndices = sVarName.split("A").length - 1;
        if (iArrayIndices) {
            if (!aDimensions) {
                aDimensions = [];
                if (iArrayIndices > 3) { // on CPC up to 3 dimensions 0..10 without dim
                    iArrayIndices = 3;
                }
                for (var i = 0; i < iArrayIndices; i += 1) {
                    aDimensions.push(11);
                }
            }
            var aValue = this.createNDimArray(aDimensions, value);
            value = aValue;
        }
        return value;
    };
    Variables.prototype.initVariable = function (sName) {
        this.oVariables[sName] = this.getVarDefault(sName, undefined);
    };
    Variables.prototype.dimVariable = function (sName, aDimensions) {
        this.oVariables[sName] = this.getVarDefault(sName, aDimensions);
    };
    Variables.prototype.getAllVariableNames = function () {
        return Object.keys(this.oVariables);
    };
    Variables.prototype.getVariableIndex = function (sName) {
        var aVarNames = this.getAllVariableNames(), iPos = aVarNames.indexOf(sName);
        return iPos;
    };
    Variables.prototype.initAllVariables = function () {
        var aVariables = this.getAllVariableNames();
        for (var i = 0; i < aVariables.length; i += 1) {
            this.initVariable(aVariables[i]);
        }
    };
    Variables.prototype.getVariable = function (sName) {
        return this.oVariables[sName];
    };
    Variables.prototype.setVariable = function (sName, value) {
        this.oVariables[sName] = value;
    };
    Variables.prototype.getVariableByIndex = function (iIndex) {
        var aVariables = this.getAllVariableNames(), sName = aVariables[iIndex];
        return this.oVariables[sName];
    };
    Variables.prototype.variableExist = function (sName) {
        return sName in this.oVariables;
    };
    Variables.prototype.getVarType = function (sVarChar) {
        return this.oVarTypes[sVarChar];
    };
    Variables.prototype.setVarType = function (sVarChar, sType) {
        this.oVarTypes[sVarChar] = sType;
    };
    return Variables;
}());
exports.Variables = Variables;
//# sourceMappingURL=Variables.js.map