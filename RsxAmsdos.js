// RsxAmsdos.ts - RSX Amsdos Commands
// (c) Marco Vieth, 2023
// https://benchmarko.github.io/CPCBasicTS/
//
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RsxAmsdos = void 0;
    var RsxAmsdos = /** @class */ (function () {
        function RsxAmsdos() {
        }
        RsxAmsdos.fnGetParameterAsString = function (vm, stringOrAddress) {
            var string = ""; // for undefined
            if (typeof stringOrAddress === "number") { // assuming addressOf
                string = String(vm.vmGetVariableByIndex(stringOrAddress) || "");
            }
            else if (typeof stringOrAddress === "string") {
                string = stringOrAddress;
            }
            return string;
        };
        RsxAmsdos.dir = function (fileMask) {
            var stream = 0;
            var fileMaskString = RsxAmsdos.fnGetParameterAsString(this, fileMask);
            if (fileMaskString) {
                fileMaskString = this.vmAdaptFilename(fileMaskString, "|DIR");
            }
            var fileParas = {
                stream: stream,
                command: "|dir",
                fileMask: fileMaskString,
                line: this.line
            };
            this.vmStop("fileDir", 45, false, fileParas);
        };
        RsxAmsdos.era = function (fileMask) {
            var stream = 0;
            var fileMaskString = RsxAmsdos.fnGetParameterAsString(this, fileMask);
            fileMaskString = this.vmAdaptFilename(fileMaskString, "|ERA");
            var fileParas = {
                stream: stream,
                command: "|era",
                fileMask: fileMaskString,
                line: this.line
            };
            this.vmStop("fileEra", 45, false, fileParas);
        };
        RsxAmsdos.ren = function (newName, oldName) {
            var stream = 0;
            var newName2 = RsxAmsdos.fnGetParameterAsString(this, newName), oldName2 = RsxAmsdos.fnGetParameterAsString(this, oldName);
            newName2 = this.vmAdaptFilename(newName2, "|REN");
            oldName2 = this.vmAdaptFilename(oldName2, "|REN");
            var fileParas = {
                stream: stream,
                command: "|ren",
                fileMask: "",
                newName: newName2,
                oldName: oldName2,
                line: this.line
            };
            this.vmStop("fileRen", 45, false, fileParas);
        };
        RsxAmsdos.prototype.getRsxCommands = function () {
            return RsxAmsdos.rsxCommands;
        };
        RsxAmsdos.rsxCommands = {
            a: function () {
                this.vmNotImplemented("|A");
            },
            b: function () {
                this.vmNotImplemented("|B");
            },
            cpm: function () {
                this.vmNotImplemented("|CPM");
            },
            dir: RsxAmsdos.dir,
            disc: function () {
                this.vmNotImplemented("|DISC");
            },
            "disc.in": function () {
                this.vmNotImplemented("|DISC.IN");
            },
            "disc.out": function () {
                this.vmNotImplemented("|DISC.OUT");
            },
            drive: function () {
                this.vmNotImplemented("|DRIVE");
            },
            era: RsxAmsdos.era,
            ren: RsxAmsdos.ren,
            tape: function () {
                this.vmNotImplemented("|TAPE");
            },
            "tape.in": function () {
                this.vmNotImplemented("|TAPE.IN");
            },
            "tape.out": function () {
                this.vmNotImplemented("|TAPE.OUT");
            },
            user: function () {
                this.vmNotImplemented("|USER");
            }
        };
        return RsxAmsdos;
    }());
    exports.RsxAmsdos = RsxAmsdos;
});
//# sourceMappingURL=RsxAmsdos.js.map