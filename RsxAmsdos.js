// RsxAmsdos.ts - RSX Amsdos Commands
// (c) Marco Vieth, 2023
// https://benchmarko.github.io/CPCBasicTS/
//
export class RsxAmsdos {
    static fnGetParameterAsString(vm, stringOrAddress) {
        let string = ""; // for undefined
        if (typeof stringOrAddress === "number") { // assuming addressOf
            string = String(vm.vmGetVariableByIndex(stringOrAddress) || "");
        }
        else if (typeof stringOrAddress === "string") {
            string = stringOrAddress;
        }
        return string;
    }
    static dir(fileMask) {
        const stream = 0;
        let fileMaskString = RsxAmsdos.fnGetParameterAsString(this, fileMask);
        if (fileMaskString) {
            fileMaskString = this.vmAdaptFilename(fileMaskString, "|DIR");
        }
        const fileParas = {
            stream: stream,
            command: "|dir",
            fileMask: fileMaskString,
            line: this.line
        };
        this.vmStop("fileDir", 45, false, fileParas);
    }
    static era(fileMask) {
        const stream = 0;
        let fileMaskString = RsxAmsdos.fnGetParameterAsString(this, fileMask);
        fileMaskString = this.vmAdaptFilename(fileMaskString, "|ERA");
        const fileParas = {
            stream: stream,
            command: "|era",
            fileMask: fileMaskString,
            line: this.line
        };
        this.vmStop("fileEra", 45, false, fileParas);
    }
    static ren(newName, oldName) {
        const stream = 0;
        let newName2 = RsxAmsdos.fnGetParameterAsString(this, newName), oldName2 = RsxAmsdos.fnGetParameterAsString(this, oldName);
        newName2 = this.vmAdaptFilename(newName2, "|REN");
        oldName2 = this.vmAdaptFilename(oldName2, "|REN");
        const fileParas = {
            stream: stream,
            command: "|ren",
            fileMask: "", // unused
            newName: newName2,
            oldName: oldName2,
            line: this.line
        };
        this.vmStop("fileRen", 45, false, fileParas);
    }
    getRsxCommands() {
        return RsxAmsdos.rsxCommands;
    }
}
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
//# sourceMappingURL=RsxAmsdos.js.map