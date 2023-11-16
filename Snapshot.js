// Snapshot.ts - Snapshot
// (c) Marco Vieth, 2023
// https://benchmarko.github.io/CPCBasicTS/
define(["require", "exports", "./Utils"], function (require, exports, Utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Snapshot = void 0;
    var Snapshot = /** @class */ (function () {
        function Snapshot(options) {
            this.pos = 0;
            this.options = {
                quiet: false
            };
            this.setOptions(options);
        }
        Snapshot.prototype.getOptions = function () {
            return this.options;
        };
        Snapshot.prototype.setOptions = function (options) {
            Object.assign(this.options, options);
        };
        Snapshot.prototype.composeError = function (error, message, value, pos) {
            var len = 0;
            return Utils_1.Utils.composeError("DiskImage", error, this.options.name + ": " + message, value, pos || 0, len);
        };
        Snapshot.testSnapIdent = function (ident) {
            return ident === "MV - SNA";
        };
        Snapshot.prototype.readUInt8 = function () {
            var num = this.options.data.charCodeAt(this.pos);
            if (isNaN(num)) {
                throw this.composeError(new Error(), "End of File", String(num), this.pos);
            }
            this.pos += 1;
            return num;
        };
        Snapshot.prototype.readUInt16 = function () {
            return this.readUInt8() + this.readUInt8() * 256;
        };
        Snapshot.prototype.readUInt8Array = function (len) {
            var arr = [];
            for (var i = 0; i < len; i += 1) {
                arr.push(this.readUInt8());
            }
            return arr;
        };
        Snapshot.prototype.readUtf = function (len) {
            var out = this.options.data.substring(this.pos, this.pos + len);
            if (out.length !== len) {
                throw this.composeError(new Error(), "End of File", "", this.pos);
            }
            this.pos += len;
            return out;
        };
        Snapshot.prototype.getSnapshotInfo = function () {
            this.pos = 0;
            var info = {
                ident: this.readUtf(8),
                unused1: this.readUtf(8),
                version: this.readUInt8(),
                z80: {
                    AF: this.readUInt16(),
                    BC: this.readUInt16(),
                    DE: this.readUInt16(),
                    HL: this.readUInt16(),
                    IR: this.readUInt16(),
                    IFF: this.readUInt16(),
                    IX: this.readUInt16(),
                    IY: this.readUInt16(),
                    SP: this.readUInt16(),
                    PC: this.readUInt16(),
                    M: this.readUInt8(),
                    AF2: this.readUInt16(),
                    BC2: this.readUInt16(),
                    DE2: this.readUInt16(),
                    HL2: this.readUInt16()
                },
                ga: {
                    inknum: this.readUInt8(),
                    inkval: this.readUInt8Array(17),
                    multi: this.readUInt8()
                },
                ramconf: this.readUInt8(),
                crtc: {
                    index: this.readUInt8(),
                    reg: this.readUInt8Array(18)
                },
                romnum: this.readUInt8(),
                ppi: {
                    portA: this.readUInt8(),
                    portB: this.readUInt8(),
                    portC: this.readUInt8(),
                    portCtl: this.readUInt8()
                },
                psg: {
                    index: this.readUInt8(),
                    reg: this.readUInt8Array(16)
                },
                memsize: this.readUInt8()
            };
            return info;
        };
        Snapshot.prototype.getMemory = function () {
            return this.options.data.substring(0x100); // memory dump without snapshot header
        };
        return Snapshot;
    }());
    exports.Snapshot = Snapshot;
});
//# sourceMappingURL=Snapshot.js.map