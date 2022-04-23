// CpcVmRst.ts - CPC Virtual Machine: RSX
// (c) Marco Vieth, 2020
// https://benchmarko.github.io/CPCBasicTS/
//
define(["require", "exports", "./Utils"], function (require, exports, Utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CpcVmRsx = void 0;
    var CpcVmRsx = /** @class */ (function () {
        function CpcVmRsx(vm) {
            this.vm = vm;
        }
        CpcVmRsx.prototype.rsxIsAvailable = function (name) {
            return name in this;
        };
        CpcVmRsx.prototype.rsxExec = function (name) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            if (this.rsxIsAvailable(name)) {
                this[name].apply(this, args);
            }
            else {
                throw this.vm.vmComposeError(Error(), 28, "|" + name); // Unknown command
            }
        };
        CpcVmRsx.prototype.a = function () {
            this.vm.vmNotImplemented("|A");
        };
        CpcVmRsx.prototype.b = function () {
            this.vm.vmNotImplemented("|B");
        };
        CpcVmRsx.prototype.basic = function () {
            Utils_1.Utils.console.log("basic: |BASIC");
            this.vm.vmStop("reset", 90);
        };
        CpcVmRsx.prototype.cpm = function () {
            this.vm.vmNotImplemented("|CPM");
        };
        CpcVmRsx.prototype.fnGetVariableByAddress = function (index) {
            return this.vm.variables.getVariableByIndex(index) || "";
        };
        CpcVmRsx.prototype.fnGetParameterAsString = function (stringOrAddress) {
            var string = ""; // for undefined
            if (typeof stringOrAddress === "number") { // assuming addressOf
                string = String(this.fnGetVariableByAddress(stringOrAddress));
            }
            else if (typeof stringOrAddress === "string") {
                string = stringOrAddress;
            }
            return string;
        };
        CpcVmRsx.prototype.dir = function (fileMask) {
            var stream = 0;
            var fileMaskString = this.fnGetParameterAsString(fileMask);
            if (fileMaskString) {
                fileMaskString = this.vm.vmAdaptFilename(fileMaskString, "|DIR");
            }
            var fileParas = {
                stream: stream,
                command: "|dir",
                fileMask: fileMaskString,
                line: this.vm.line
            };
            this.vm.vmStop("fileDir", 45, false, fileParas);
        };
        CpcVmRsx.prototype.disc = function () {
            this.vm.vmNotImplemented("|DISC");
        };
        CpcVmRsx.prototype.disc_in = function () {
            this.vm.vmNotImplemented("|DISC.IN");
        };
        CpcVmRsx.prototype.disc_out = function () {
            this.vm.vmNotImplemented("|DISC.OUT");
        };
        CpcVmRsx.prototype.drive = function () {
            this.vm.vmNotImplemented("|DRIVE");
        };
        CpcVmRsx.prototype.era = function (fileMask) {
            var stream = 0;
            var fileMaskString = this.fnGetParameterAsString(fileMask);
            fileMaskString = this.vm.vmAdaptFilename(fileMaskString, "|ERA");
            var fileParas = {
                stream: stream,
                command: "|era",
                fileMask: fileMaskString,
                line: this.vm.line
            };
            this.vm.vmStop("fileEra", 45, false, fileParas);
        };
        CpcVmRsx.prototype.ren = function (newName, oldName) {
            var stream = 0;
            var newName2 = this.fnGetParameterAsString(newName), oldName2 = this.fnGetParameterAsString(oldName);
            newName2 = this.vm.vmAdaptFilename(newName2, "|REN");
            oldName2 = this.vm.vmAdaptFilename(oldName2, "|REN");
            var fileParas = {
                stream: stream,
                command: "|ren",
                fileMask: "",
                newName: newName2,
                oldName: oldName2,
                line: this.vm.line
            };
            this.vm.vmStop("fileRen", 45, false, fileParas);
        };
        CpcVmRsx.prototype.tape = function () {
            this.vm.vmNotImplemented("|TAPE");
        };
        CpcVmRsx.prototype.tape_in = function () {
            this.vm.vmNotImplemented("|TAPE.IN");
        };
        CpcVmRsx.prototype.tape_out = function () {
            this.vm.vmNotImplemented("|TAPE.OUT");
        };
        CpcVmRsx.prototype.user = function () {
            this.vm.vmNotImplemented("|USER");
        };
        CpcVmRsx.prototype.mode = function (mode) {
            mode = this.vm.vmInRangeRound(mode, 0, 3, "|MODE");
            this.vm.vmChangeMode(mode);
        };
        CpcVmRsx.prototype.renum = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            this.vm.renum.apply(args);
        };
        return CpcVmRsx;
    }());
    exports.CpcVmRsx = CpcVmRsx;
});
//# sourceMappingURL=CpcVmRsx.js.map