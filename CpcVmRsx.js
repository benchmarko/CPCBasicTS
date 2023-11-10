// CpcVmRsx.ts - CPC Virtual Machine: RSX (Resident System Extension)
// (c) Marco Vieth, 2020
// https://benchmarko.github.io/CPCBasicTS/
//
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CpcVmRsx = void 0;
    var CpcVmRsx = /** @class */ (function () {
        function CpcVmRsx() {
            this.rsxPermanent = {};
            this.rsxTemporary = {};
        }
        CpcVmRsx.prototype.callRsx = function (vm, name) {
            var args = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                args[_i - 2] = arguments[_i];
            }
            var fn = this.rsxTemporary[name] || this.rsxPermanent[name];
            if (fn) {
                fn.apply(vm, args);
            }
            return Boolean(fn);
        };
        CpcVmRsx.prototype.registerRsx = function (rsxModule, permanent) {
            var rsxRegister = permanent ? this.rsxPermanent : this.rsxTemporary, rsxCommands = rsxModule.getRsxCommands();
            for (var command in rsxCommands) {
                if (rsxCommands.hasOwnProperty(command)) {
                    rsxRegister[command] = rsxCommands[command];
                }
            }
        };
        CpcVmRsx.prototype.resetRsx = function () {
            this.rsxTemporary = {};
        };
        return CpcVmRsx;
    }());
    exports.CpcVmRsx = CpcVmRsx;
});
//# sourceMappingURL=CpcVmRsx.js.map