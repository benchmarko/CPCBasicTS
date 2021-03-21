"use strict";
// DiskImage.qunit.ts - QUnit tests for CPCBasic DiskImage
//
Object.defineProperty(exports, "__esModule", { value: true });
var bGenerateAllResults = false;
var Utils_1 = require("../Utils");
var BasicTokenizer_1 = require("../BasicTokenizer");
var DiskImage_1 = require("../DiskImage");
var ZipFile_1 = require("../ZipFile"); // we need this just to reduce stored disk image size
QUnit.dump.maxDepth = 10;
QUnit.module("DiskImage: Tests", function () {
    var mAllTests = {
        data: {
            "CPCBasic;B;0;609;;base64,UEsDBBQAAAAIAOyBdVI5vxGB6QEAAAAnAAALAAAAY3BjZGF0YS5kc2vzDVPQVXAOcHb1DVVwySzO1nXLzEnl5QIzPfPS8nm5UoDMTCBLAQw0GBmEGYYRCClKTIb5FCbGxOn3lIHhIBOEdwhKH4bSR6D0USh9DEofh9InoPRJKD3IATDunRyD4x0dg52BPEYMR0PlQ4AEkMfEjEM+ACrPgkPeycnTDyTPiib9dBSMglEwCkbBKBgFdAeGBgoBQZ5+IQpKoIo6sTgzWYmXS+r/f1Dd/P8/7WlC7hsFo2AU0A6gte8hoID4Th5Q3RlmQQYuhv1IJQhQXIrIQoQCrVShCYXPKBgFwxmg9d+BgJHU/H+SeZfO81eXxWXXn55jkeuxl+86iwsz91XngnvFVWealc5PPX+5n+nD/CnZ0ts/M6+YX86/50Wf8wLT6nNrPsufpEDriyB710mTOa5kXfb9cePAzHedATZrQrRNYvTfCIZevvllj5CP1ePpjAo6vzoivaL/zP5otMSmv6PVbF90sbmX7QfuGfwnk9QzCYXPcAfo41/A2AePfzFCx78YoeNfjNDxL0bo+BcjdPyLETr+xQgd/2KEjn8xDpHxL0LhMwqGN0AbnwQCULI9wMCBN9UgAFDdD2ZY60XKSUVF5T/DfxIKMQq0jpZ/o2AUjIJRMApGwSgYBaNgFIyCUTAKRgGRAABQSwECFAAUAAAACADsgXVSOb8RgekBAAAAJwAACwAAAAAAAAAAACAAAAAAAAAAY3BjZGF0YS5kc2tQSwUGAAAAAAEAAQA5AAAAEgIAAAAA": 'CPCBAS_A.ASC={"sType":"A","iStart":0,"iLength":21} 10 PRINT "CPCBasic"\r\nCPCBAS_T.BAS={"iUser":0,"sName":"CPCBAS_T","sExt":"BAS","iType":0,"iStart":368,"iPseudoLen":19,"iEntry":0,"iLength":19,"sType":"T"} 10 PRINT "CPCBasic"\nCPCBAS_P.BAS={"iUser":0,"sName":"CPCBAS_P","sExt":"BAS","iType":1,"iStart":368,"iPseudoLen":19,"iEntry":0,"iLength":19,"sType":"P"} 10 PRINT "CPCBasic"\nCPCBAS_B.BIN={"iUser":0,"sName":"CPCBAS_B","sExt":"BIN","iType":2,"iStart":49152,"iPseudoLen":8,"iEntry":0,"iLength":8,"sType":"B"} CPCBasic'
        },
        system: {
            "CPCBasic;B;0;429;;base64,UEsDBBQAAAAIANWJdVLsLMeMNwEAAAA6AAAKAAAAY3Bjc3lzLmRza+3bQUvCYBzH8ed5PDXYIbp5Gp66CPUS5tTaQZGcXUOsYBQV+QJ7A70NX8d6pj8h1mFCCWt8Pwf/zzaFucMmX3ByG/WjZJaMJotomK+f+uP8+SEMtsv05fE1DO79MveraOvcmjPTItn7crX/pvt97mS6MSZ2u62BZqI51BxpjjWvNK81U81m2wAAAAAAAKDVqv3Lml3/supfVv3Lqn9Z9S+r/mXVv6z6l1X/svQvAAAAAAAANEC1f5XRquxfTv3LqX859S+n/uXUv5z6l1P/cupf7p/0L5PMkkE8v4vjeeK37I+T1vHMv/gt16kcrru+AACgeS4votlNOs2iXvmgX67zVS8MukVRPtuL4viz7vwAHE/l9/3O2+F/8vHv++ycmsB8fLuD+P3dA28iv/jon8y66wMAbfUFUEsBAhQAFAAAAAgA1Yl1Uuwsx4w3AQAAADoAAAoAAAAAAAAAAAAgAAAAAAAAAGNwY3N5cy5kc2tQSwUGAAAAAAEAAQA4AAAAXwEAAAAA": 'CPCBAS_A.ASC={"sType":"A","iStart":0,"iLength":21} 10 PRINT "CPCBasic"\r\nCPCBAS_T.BAS={"iUser":0,"sName":"CPCBAS_T","sExt":"BAS","iType":0,"iStart":368,"iPseudoLen":19,"iEntry":0,"iLength":19,"sType":"T"} 10 PRINT "CPCBasic"\n'
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
    function runTestsFor(assert, oTests, aResults) {
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
                    Utils_1.Utils.console.error(e);
                    sResult = String(e);
                }
                if (aResults) {
                    //aResults.push('"' + sKey + '": "' + sResult + '"');
                    aResults.push('"' + sKey.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/"/g, '\\"') + "\": '" + sResult.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/'/g, "\\'") + "'");
                }
                if (assert) {
                    assert.strictEqual(sResult, sExpected, sMeta);
                }
            }
        }
    }
    function generateTests(oAllTests) {
        for (var sCategory in oAllTests) {
            if (oAllTests.hasOwnProperty(sCategory)) {
                (function (sCat) {
                    QUnit.test(sCat, function (assert) {
                        runTestsFor(assert, oAllTests[sCat]);
                    });
                }(sCategory));
            }
        }
    }
    generateTests(mAllTests);
    // generate result list (not used during the test, just for debugging)
    function generateAllResults(oAllTests) {
        var sResult = "";
        for (var sCategory in oAllTests) {
            if (oAllTests.hasOwnProperty(sCategory)) {
                var aResults = [], bContainsSpace = sCategory.indexOf(" ") >= 0, sMarker = bContainsSpace ? '"' : "";
                sResult += sMarker + sCategory + sMarker + ": {\n";
                runTestsFor(undefined, oAllTests[sCategory], aResults);
                sResult += aResults.join(",\n");
                sResult += "\n},\n";
            }
        }
        Utils_1.Utils.console.log(sResult);
        return sResult;
    }
    if (bGenerateAllResults) {
        generateAllResults(mAllTests);
    }
});
// end
//# sourceMappingURL=DiskImage.qunit.js.map