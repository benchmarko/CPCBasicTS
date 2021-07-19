"use strict";
// DiskImage.qunit.ts - QUnit tests for CPCBasic DiskImage
//
Object.defineProperty(exports, "__esModule", { value: true });
var Utils_1 = require("../Utils");
var BasicTokenizer_1 = require("../BasicTokenizer");
var DiskImage_1 = require("../DiskImage");
var ZipFile_1 = require("../ZipFile"); // we need this just to reduce stored disk image size
var TestHelper_1 = require("./TestHelper");
//import {} from "qunit";
QUnit.dump.maxDepth = 10;
QUnit.module("DiskImage: Tests", function () {
    var mAllTests = {
        dataEmpty: {
            "CPCBasic;B;0;245;;base64,UEsDBBQAAAAIAMiAj1IH4jtleQAAAAAUAAANAAAAZGF0YUVtcHR5LmRza/MNU9BVcA5wdvUNVXDJLM7WdcvMSeXlAjM989LyeblSgMxMIEsBDDQYGYQZhhEIKUpMhvkUJsbE6feUgeEgE4R3CEofhtJHoPRRKH0MSh+H0ieg9EkoPbjB01EwCkbBKBgFo2AUjIJRMApGwSgYBaNgFIyCUTCsAQBQSwECFAAUAAAACADIgI9SB+I7ZXkAAAAAFAAADQAAAAAAAAAAACAAAAAAAAAAZGF0YUVtcHR5LmRza1BLBQYAAAAAAQABADsAAACkAAAAAAA=": ""
        },
        data: {
            "CPCBasic;B;0;609;;base64,UEsDBBQAAAAIAOyBdVI5vxGB6QEAAAAnAAALAAAAY3BjZGF0YS5kc2vzDVPQVXAOcHb1DVVwySzO1nXLzEnl5QIzPfPS8nm5UoDMTCBLAQw0GBmEGYYRCClKTIb5FCbGxOn3lIHhIBOEdwhKH4bSR6D0USh9DEofh9InoPRJKD3IATDunRyD4x0dg52BPEYMR0PlQ4AEkMfEjEM+ACrPgkPeycnTDyTPiib9dBSMglEwCkbBKBgFdAeGBgoBQZ5+IQpKoIo6sTgzWYmXS+r/f1Dd/P8/7WlC7hsFo2AU0A6gte8hoID4Th5Q3RlmQQYuhv1IJQhQXIrIQoQCrVShCYXPKBgFwxmg9d+BgJHU/H+SeZfO81eXxWXXn55jkeuxl+86iwsz91XngnvFVWealc5PPX+5n+nD/CnZ0ts/M6+YX86/50Wf8wLT6nNrPsufpEDriyB710mTOa5kXfb9cePAzHedATZrQrRNYvTfCIZevvllj5CP1ePpjAo6vzoivaL/zP5otMSmv6PVbF90sbmX7QfuGfwnk9QzCYXPcAfo41/A2AePfzFCx78YoeNfjNDxL0bo+BcjdPyLETr+xQgd/2KEjn8xDpHxL0LhMwqGN0AbnwQCULI9wMCBN9UgAFDdD2ZY60XKSUVF5T/DfxIKMQq0jpZ/o2AUjIJRMApGwSgYBaNgFIyCUTAKRgGRAABQSwECFAAUAAAACADsgXVSOb8RgekBAAAAJwAACwAAAAAAAAAAACAAAAAAAAAAY3BjZGF0YS5kc2tQSwUGAAAAAAEAAQA5AAAAEgIAAAAA": 'CPCBAS_A.ASC={"sType":"A","iStart":0,"iLength":21} 10 PRINT "CPCBasic"\r\nCPCBAS_T.BAS={"iUser":0,"sName":"CPCBAS_T","sExt":"BAS","iType":0,"iStart":368,"iPseudoLen":19,"iEntry":0,"iLength":19,"sType":"T"} 10 PRINT "CPCBasic"\nCPCBAS_P.BAS={"iUser":0,"sName":"CPCBAS_P","sExt":"BAS","iType":1,"iStart":368,"iPseudoLen":19,"iEntry":0,"iLength":19,"sType":"P"} 10 PRINT "CPCBasic"\nCPCBAS_B.BIN={"iUser":0,"sName":"CPCBAS_B","sExt":"BIN","iType":2,"iStart":49152,"iPseudoLen":8,"iEntry":0,"iLength":8,"sType":"B"} CPCBasic'
        },
        system: {
            "CPCBasic;B;0;429;;base64,UEsDBBQAAAAIANWJdVLsLMeMNwEAAAA6AAAKAAAAY3Bjc3lzLmRza+3bQUvCYBzH8ed5PDXYIbp5Gp66CPUS5tTaQZGcXUOsYBQV+QJ7A70NX8d6pj8h1mFCCWt8Pwf/zzaFucMmX3ByG/WjZJaMJotomK+f+uP8+SEMtsv05fE1DO79MveraOvcmjPTItn7crX/pvt97mS6MSZ2u62BZqI51BxpjjWvNK81U81m2wAAAAAAAKDVqv3Lml3/supfVv3Lqn9Z9S+r/mXVv6z6l1X/svQvAAAAAAAANEC1f5XRquxfTv3LqX859S+n/uXUv5z6l1P/cupf7p/0L5PMkkE8v4vjeeK37I+T1vHMv/gt16kcrru+AACgeS4votlNOs2iXvmgX67zVS8MukVRPtuL4viz7vwAHE/l9/3O2+F/8vHv++ycmsB8fLuD+P3dA28iv/jon8y66wMAbfUFUEsBAhQAFAAAAAgA1Yl1Uuwsx4w3AQAAADoAAAoAAAAAAAAAAAAgAAAAAAAAAGNwY3N5cy5kc2tQSwUGAAAAAAEAAQA4AAAAXwEAAAAA": 'CPCBAS_A.ASC={"sType":"A","iStart":0,"iLength":21} 10 PRINT "CPCBasic"\r\nCPCBAS_T.BAS={"iUser":0,"sName":"CPCBAS_T","sExt":"BAS","iType":0,"iStart":368,"iPseudoLen":19,"iEntry":0,"iLength":19,"sType":"T"} 10 PRINT "CPCBasic"\n'
        },
        noDskIdent: {
            "CPCBasic;B;0;247;;base64,UEsDBBQAAAAIAEKCj1KUjyNHeQAAAAAUAAAOAAAAbm9Ec2tJZGVudC5kc2uLiFDQVXAOcHb1DVVwySzO1nXLzEnl5QIzPfPS8nm5UoDMTCBLAQw0GBmEGYYRCClKTIb5FCbGxOn3lIHhIBOEdwhKH4bSR6D0USh9DEofh9InoPRJKD24wdNRMApGwSgYBaNgFIyCUTAKRsEoGAWjYBSMglEwrAEAUEsBAhQAFAAAAAgAQoKPUpSPI0d5AAAAABQAAA4AAAAAAAAAAAAgAAAAAAAAAG5vRHNrSWRlbnQuZHNrUEsFBgAAAAABAAEAPAAAAKUAAAAAAA==": "DiskImage: name: Ident not found at pos 0-8: XX - CPC"
        },
        noDiskInfo: {
            "CPCBasic;B;0;249;;base64,UEsDBBQAAAAIAHKDj1JAJpc5ewAAAAAUAAAOAAAAbm9EaXNrSW5mby5kc2vzDVPQVXAOcHb1DVVwySzO1nXLzEnl5YqIADI989LyeblSgKKZQJYCGGgwMggzDCMQUpSYDPMpTIyJ0+8pA8NBJgjvEJQ+DKWPQOmjUPoYlD4OpU9A6ZNQenCDp6NgFIyCUTAKRsEoGAWjYBSMglEwCkbBKBgFo2BYAwBQSwECFAAUAAAACAByg49SQCaXOXsAAAAAFAAADgAAAAAAAAAAACAAAAAAAAAAbm9EaXNrSW5mby5kc2tQSwUGAAAAAAEAAQA8AAAApwAAAAAA": "" // will just show a warning: "DiskImage: name: Disk ident not found at pos 0-9: XXsk-Info"
        },
        noTrackInfo: {
            "CPCBasic;B;0;249;;base64,UEsDBBQAAAAIAJODj1JUALEMeQAAAAAUAAAPAAAAbm9UcmFja0luZm8uZHNr8w1T0FVwDnB29Q1VcMksztZ1y8xJ5eUCMz3z0vJ5uVKAzEwgSwEMNBgZhBmGEYiISEyG+RQmxsTp95SB4SAThHcISh+G0keg9FEofQxKH4fSJ6D0SSg9uMHTUTAKRsEoGAWjYBSMglEwCkbBKBgFo2AUjIJRMKwBAFBLAQIUABQAAAAIAJODj1JUALEMeQAAAAAUAAAPAAAAAAAAAAAAIAAAAAAAAABub1RyYWNrSW5mby5kc2tQSwUGAAAAAAEAAQA9AAAApgAAAAAA": "" // will just show a warning: "DiskImage: name: Track ident not found at pos 256-266: XXack-Info"
        }
    };
    function fnString2ArrayBuf(sData) {
        var aBuf = new ArrayBuffer(sData.length), aView = new Uint8Array(aBuf);
        for (var i = 0; i < sData.length; i += 1) {
            aView[i] = sData.charCodeAt(i);
        }
        return aBuf;
    }
    function createMinimalAmsdosHeader(sType, iStart, iLength) {
        var oHeader = {
            sType: sType,
            iStart: iStart,
            iLength: iLength
        };
        return oHeader;
    }
    function fnExtractDiskImage(oDisk) {
        var aResult = [], oDir = oDisk.readDirectory(), aEntries = Object.keys(oDir);
        for (var i = 0; i < aEntries.length; i += 1) {
            var sName = aEntries[i];
            var sData = oDisk.readFile(oDir[sName]);
            if (sData) {
                var oHeader = DiskImage_1.DiskImage.parseAmsdosHeader(sData);
                if (oHeader) {
                    sData = sData.substr(0x80); // remove header
                    if (oHeader.sType === "P") { // protected BASIC?
                        sData = DiskImage_1.DiskImage.unOrProtectData(sData);
                        sData = new BasicTokenizer_1.BasicTokenizer().decode(sData);
                    }
                    else if (oHeader.sType === "T") { // tokenized BASIC?
                        sData = new BasicTokenizer_1.BasicTokenizer().decode(sData);
                    }
                }
                else {
                    oHeader = createMinimalAmsdosHeader("A", 0, sData.length);
                }
                var sHeader = JSON.stringify(oHeader);
                aResult.push(sName + "=" + sHeader + " " + sData);
            }
        }
        return aResult.join("");
    }
    function runTestsFor(assert, _sCategory, oTests, aResults) {
        for (var sKey in oTests) {
            if (oTests.hasOwnProperty(sKey)) {
                var aParts = sKey.split(",", 2), sMeta = aParts[0], sCompressed = Utils_1.Utils.atob(aParts[1]), // decode base64
                oZip = new ZipFile_1.ZipFile(new Uint8Array(fnString2ArrayBuf(sCompressed)), "name"), sFirstFileInZip = Object.keys(oZip.getZipDirectory())[0], sUncompressed = oZip.readData(sFirstFileInZip), oDisk = new DiskImage_1.DiskImage({
                    sData: sUncompressed,
                    sDiskName: "name"
                }), sExpected = oTests[sKey];
                var sResult = void 0;
                try {
                    sResult = fnExtractDiskImage(oDisk);
                }
                catch (e) {
                    sResult = String(e);
                    if (sResult !== sExpected) { // output in console only if error not expected
                        Utils_1.Utils.console.error(e);
                    }
                }
                if (aResults) {
                    aResults.push('"' + sKey.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/"/g, '\\"') + "\": '" + sResult.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/'/g, "\\'") + "'");
                }
                if (assert) {
                    assert.strictEqual(sResult, sExpected, sMeta);
                }
            }
        }
    }
    TestHelper_1.TestHelper.generateAndRunAllTests(mAllTests, runTestsFor);
});
// end
//# sourceMappingURL=DiskImage.qunit.js.map