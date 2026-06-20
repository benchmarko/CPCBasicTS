// Snapshot.ts - Snapshot
// (c) Marco Vieth, 2023
// https://benchmarko.github.io/CPCBasicTS/
// Snapshot definition
// https://www.cpcwiki.eu/index.php/Format:SNA_snapshot_file_format
// https://cpctech.cpcwiki.de/docs/snapshot.html
import { Utils } from "./Utils";
export class Snapshot {
    constructor(options) {
        this.pos = 0;
        this.options = {
            quiet: false
        };
        this.setOptions(options);
    }
    getOptions() {
        return this.options;
    }
    setOptions(options) {
        Object.assign(this.options, options);
    }
    composeError(error, message, value, pos) {
        const len = 0;
        return Utils.composeError("DiskImage", error, this.options.name + ": " + message, value, pos || 0, len);
    }
    static testSnapIdent(ident) {
        return ident === "MV - SNA";
    }
    readUInt8() {
        const num = this.options.data.charCodeAt(this.pos);
        if (isNaN(num)) {
            throw this.composeError(new Error(), "End of File", String(num), this.pos);
        }
        this.pos += 1;
        return num;
    }
    readUInt16() {
        return this.readUInt8() + this.readUInt8() * 256;
    }
    readUInt8Array(len) {
        const arr = [];
        for (let i = 0; i < len; i += 1) {
            arr.push(this.readUInt8());
        }
        return arr;
    }
    readUtf(len) {
        const out = this.options.data.substring(this.pos, this.pos + len);
        if (out.length !== len) {
            throw this.composeError(new Error(), "End of File", "", this.pos);
        }
        this.pos += len;
        return out;
    }
    getSnapshotInfo() {
        this.pos = 0;
        const info = {
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
    }
    getMemory() {
        return this.options.data.substring(0x100); // memory dump without snapshot header
    }
}
//# sourceMappingURL=Snapshot.js.map