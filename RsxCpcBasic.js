// RsxCpcBasic.ts - RSX CpcBasic
// (c) Marco Vieth, 2023
// https://benchmarko.github.io/CPCBasicTS/
//
import { Utils } from "./Utils";
export class RsxCpcBasic {
    getRsxCommands() {
        return RsxCpcBasic.rsxCommands;
    }
}
RsxCpcBasic.rsxCommands = {
    basic() {
        Utils.console.log("basic: |BASIC");
        this.vmStop("reset", 90);
    },
    mode: function (mode) {
        mode = this.vmInRangeRound(Number(mode), 0, 3, "|MODE");
        this.vmChangeMode(mode);
    },
    renum: function (...args) {
        this.renum.apply(this, args);
    }
};
//# sourceMappingURL=RsxCpcBasic.js.map