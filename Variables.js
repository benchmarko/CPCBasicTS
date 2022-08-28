// Variables.ts - Variables
// (c) Marco Vieth, 2020
// https://benchmarko.github.io/CPCBasicTS/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Variables = void 0;
    var Variables = /** @class */ (function () {
        function Variables() {
            this.variables = {};
            this.varTypes = {}; // default variable types for variables starting with letters a-z
        }
        Variables.prototype.removeAllVariables = function () {
            var variables = this.variables;
            for (var name_1 in variables) { // eslint-disable-line guard-for-in
                delete variables[name_1];
            }
        };
        Variables.prototype.getAllVariables = function () {
            return this.variables;
        };
        Variables.prototype.createNDimArray = function (dims, initVal) {
            var fnCreateRec = function (index) {
                var len = dims[index], arr = new Array(len);
                index += 1;
                if (index < dims.length) { // more dimensions?
                    for (var i = 0; i < len; i += 1) {
                        arr[i] = fnCreateRec(index); // recursive call
                    }
                }
                else { // one dimension
                    for (var i = 0; i < len; i += 1) {
                        arr[i] = initVal;
                    }
                }
                return arr;
            }, ret = fnCreateRec(0);
            return ret;
        };
        // determine static varType (first letter + optional fixed vartype) from a variable name
        // format: (v.)(_)<sname>(I|R|$)(A*[...]([...])) with optional parts in ()
        Variables.prototype.determineStaticVarType = function (name) {
            if (name.indexOf("v.") === 0) { // preceding variable object?
                name = name.substr(2); // remove preceding "v."
            }
            var nameType = name.charAt(0); // take first character to determine variable type later
            if (nameType === "_") { // ignore underscore (do not clash with keywords)
                nameType = name.charAt(1);
            }
            var arrayPos = name.indexOf("A"), typePos = arrayPos >= 0 ? arrayPos - 1 : name.length - 1, typeChar = name.charAt(typePos); // check last character before array
            if (typeChar === "I" || typeChar === "R" || typeChar === "$") { // explicit type specified?
                nameType += typeChar;
            }
            return nameType;
        };
        Variables.prototype.getVarDefault = function (varName, dimensions) {
            var isString = varName.includes("$");
            if (!isString) { // check dynamic varType...
                var first = varName.charAt(0);
                if (first === "_") { // ignore underscore (do not clash with keywords)
                    first = first.charAt(1);
                }
                isString = (this.getVarType(first) === "$");
            }
            var value = isString ? "" : 0, arrayIndices = varName.split("A").length - 1;
            if (arrayIndices) {
                if (!dimensions) {
                    dimensions = [];
                    if (arrayIndices > 3) { // on CPC up to 3 dimensions 0..10 without dim
                        arrayIndices = 3;
                    }
                    for (var i = 0; i < arrayIndices; i += 1) {
                        dimensions.push(11);
                    }
                }
                var valueArray = this.createNDimArray(dimensions, value);
                value = valueArray;
            }
            return value;
        };
        Variables.prototype.initVariable = function (name) {
            this.variables[name] = this.getVarDefault(name);
        };
        Variables.prototype.dimVariable = function (name, dimensions) {
            this.variables[name] = this.getVarDefault(name, dimensions);
        };
        Variables.prototype.getAllVariableNames = function () {
            return Object.keys(this.variables);
        };
        Variables.prototype.getVariableIndex = function (name) {
            var varNames = this.getAllVariableNames(), pos = varNames.indexOf(name);
            return pos;
        };
        Variables.prototype.initAllVariables = function () {
            var variables = this.getAllVariableNames();
            for (var i = 0; i < variables.length; i += 1) {
                this.initVariable(variables[i]);
            }
        };
        Variables.prototype.getVariable = function (name) {
            return this.variables[name];
        };
        Variables.prototype.setVariable = function (name, value) {
            this.variables[name] = value;
        };
        Variables.prototype.getVariableByIndex = function (index) {
            var variables = this.getAllVariableNames(), name = variables[index];
            return this.variables[name];
        };
        Variables.prototype.variableExist = function (name) {
            return name in this.variables;
        };
        Variables.prototype.getVarType = function (varChar) {
            return this.varTypes[varChar];
        };
        Variables.prototype.setVarType = function (varChar, type) {
            this.varTypes[varChar] = type;
        };
        return Variables;
    }());
    exports.Variables = Variables;
});
//# sourceMappingURL=Variables.js.map