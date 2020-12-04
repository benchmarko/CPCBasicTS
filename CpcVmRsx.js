// CpcVmRsx.js - CPC Virtual Machine: RSX
// (c) Marco Vieth, 2020
// https://benchmarko.github.io/CPCBasic/
//
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CpcVmRsx = void 0;
var Utils_1 = require("./Utils");
var CpcVm_1 = require("./CpcVm");
var CpcVmRsx = /** @class */ (function () {
    function CpcVmRsx(oVm) {
        this.rsxInit(oVm);
    }
    CpcVmRsx.prototype.rsxInit = function (oVm) {
        this.oVm = oVm;
    };
    CpcVmRsx.prototype.rsxIsAvailable = function (sName) {
        return sName in this;
    };
    CpcVmRsx.prototype.rsxExec = function (sName) {
        if (this.rsxIsAvailable(sName)) {
            var aArgs = Array.prototype.slice.call(arguments, 1);
            this[sName].apply(this, aArgs);
        }
        else {
            throw this.oVm.vmComposeError(Error(), 28, "|" + sName); // Unknown command
        }
    };
    CpcVmRsx.prototype.a = function () {
        this.oVm.vmNotImplemented("|A");
    };
    CpcVmRsx.prototype.b = function () {
        this.oVm.vmNotImplemented("|B");
    };
    CpcVmRsx.prototype.basic = function () {
        Utils_1.Utils.console.log("basic: |BASIC");
        this.oVm.vmStop("reset", 90);
    };
    CpcVmRsx.prototype.cpm = function () {
        this.oVm.vmNotImplemented("|CPM");
    };
    CpcVmRsx.prototype.fnGetVariableByAddress = function (iIndex) {
        return this.oVm.oVariables.getVariableByIndex(iIndex) || "";
    };
    CpcVmRsx.prototype.fnGetParameterAsString = function (stringOrAddress) {
        var sString = ""; // for undefined
        if (typeof stringOrAddress === "number") { // assuming addressOf
            sString = String(this.fnGetVariableByAddress(stringOrAddress)); //TTT
        }
        else if (typeof stringOrAddress === "string") {
            sString = stringOrAddress;
        }
        return sString;
    };
    CpcVmRsx.prototype.dir = function (fileMask) {
        var iStream = 0;
        var sFileMask = this.fnGetParameterAsString(fileMask);
        /*
        let sFileMask = "";
        if (typeof fileMask === "number") { // assuming addressOf
            sFileMask = String(this.fnGetVariableByAddress(fileMask)); //TTT
        } else if (typeof fileMask === "string") {
            sFileMask = fileMask;
        }
        */
        if (sFileMask) {
            sFileMask = this.oVm.vmAdaptFilename(sFileMask, "|DIR");
        }
        this.oVm.vmStop("fileDir", 45, false, {
            iStream: iStream,
            sCommand: "|dir",
            sFileMask: sFileMask
        });
    };
    CpcVmRsx.prototype.disc = function () {
        this.oVm.vmNotImplemented("|DISC");
    };
    CpcVmRsx.prototype.disc_in = function () {
        this.oVm.vmNotImplemented("|DISC.IN");
    };
    CpcVmRsx.prototype.disc_out = function () {
        this.oVm.vmNotImplemented("|DISC.OUT");
    };
    CpcVmRsx.prototype.drive = function () {
        this.oVm.vmNotImplemented("|DRIVE");
    };
    CpcVmRsx.prototype.era = function (fileMask) {
        var iStream = 0;
        var sFileMask = this.fnGetParameterAsString(fileMask);
        /*
        let sFileMask = "";
        if (typeof fileMask === "number") { // assuming addressOf
            sFileMask = String(this.fnGetVariableByAddress(fileMask)); //TTT
        } else if (typeof fileMask === "string") {
            sFileMask = fileMask;
        }
        */
        sFileMask = this.oVm.vmAdaptFilename(sFileMask, "|ERA");
        this.oVm.vmStop("fileEra", 45, false, {
            iStream: iStream,
            sCommand: "|era",
            sFileMask: sFileMask
        });
    };
    CpcVmRsx.prototype.ren = function (newName, oldName) {
        var iStream = 0;
        var sNew = this.fnGetParameterAsString(newName), sOld = this.fnGetParameterAsString(oldName);
        /*
        let sNew = "",
            sOld = "";

        if (typeof newName === "number") { // assuming addressOf
            sNew = String(this.fnGetVariableByAddress(newName));
        } else if (typeof newName === "string") {
            sNew = newName;
        }

        if (typeof oldName === "number") { // assuming addressOf
            sOld = String(this.fnGetVariableByAddress(oldName));
        } else if (typeof oldName === "string") {
            sOld = oldName;
        }
        */
        sNew = this.oVm.vmAdaptFilename(sNew, "|REN");
        sOld = this.oVm.vmAdaptFilename(sOld, "|REN");
        this.oVm.vmStop("fileRen", 45, false, {
            iStream: iStream,
            sCommand: "|ren",
            sNew: sNew,
            sOld: sOld
        });
    };
    CpcVmRsx.prototype.tape = function () {
        this.oVm.vmNotImplemented("|TAPE");
    };
    CpcVmRsx.prototype.tape_in = function () {
        this.oVm.vmNotImplemented("|TAPE.IN");
    };
    CpcVmRsx.prototype.tape_out = function () {
        this.oVm.vmNotImplemented("|TAPE.OUT");
    };
    CpcVmRsx.prototype.user = function () {
        this.oVm.vmNotImplemented("|USER");
    };
    CpcVmRsx.prototype.mode = function (iMode, s) {
        iMode = this.oVm.vmInRangeRound(iMode, 0, 3, "|MODE");
        this.oVm.iMode = iMode;
        var oWinData = CpcVm_1.CpcVm.mWinData[this.oVm.iMode];
        Utils_1.Utils.console.log("rsxMode: (test)", iMode, s);
        for (var i = 0; i < CpcVm_1.CpcVm.iStreamCount - 2; i += 1) { // for window streams
            var oWin = this.oVm.aWindow[i];
            Object.assign(oWin, oWinData);
        }
        this.oVm.oCanvas.changeMode(iMode); // or setMode?
    };
    CpcVmRsx.prototype.renum = function () {
        this.oVm.renum.apply(this.oVm, arguments);
    };
    return CpcVmRsx;
}());
exports.CpcVmRsx = CpcVmRsx;
;
//# sourceMappingURL=CpcVmRsx.js.map