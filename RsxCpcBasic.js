// RsxCpcBasic.ts - RSX CpcBasic
// (c) Marco Vieth, 2023
// https://benchmarko.github.io/CPCBasicTS/
//
define(["require", "exports", "./Utils"], function (require, exports, Utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RsxCpcBasic = void 0;
    var RsxCpcBasic = /** @class */ (function () {
        function RsxCpcBasic() {
        }
        RsxCpcBasic.prototype.getRsxCommands = function () {
            return RsxCpcBasic.rsxCommands;
        };
        RsxCpcBasic.rsxCommands = {
            basic: function () {
                Utils_1.Utils.console.log("basic: |BASIC");
                this.vmStop("reset", 90);
            },
            mode: function (mode) {
                mode = this.vmInRangeRound(Number(mode), 0, 3, "|MODE");
                this.vmChangeMode(mode);
            },
            renum: function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                this.renum.apply(this, args);
            }
        };
        return RsxCpcBasic;
    }());
    exports.RsxCpcBasic = RsxCpcBasic;
});
//# sourceMappingURL=RsxCpcBasic.js.map