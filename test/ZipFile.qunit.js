"use strict";
// ZipFile.qunit.ts - QUnit tests for CPCBasic ZipFile
//
Object.defineProperty(exports, "__esModule", { value: true });
var bGenerateAllResults = false;
var Utils_1 = require("../Utils");
var ZipFile_1 = require("../ZipFile");
QUnit.dump.maxDepth = 10;
QUnit.module("ZipFile: Tests", function () {
    // examples store.zip and deflate.zip taken from https://github.com/bower/decompress-zip/tree/master/test/assets/file-mode-pack
    var mAllTests = {
        store: {
            "CPCBasic;B;0;404;;base64,UEsDBAoAAAAAAGyFJkYAAAAAAAAAAAAAAAAFAAAAZGlyMS9QSwMECgAAAAAAbIUmRgAAAAAAAAAAAAAAAAUAAABkaXIyL1BLAwQUAAgAAABshSZGAAAAAAAAAAAAAAAABQAAAGZpbGUxYWJjUEsHCMJBJDUDAAAAAwAAAFBLAwQUAAgAAABshSZGAAAAAAAAAAAAAAAABQAAAGZpbGUyeHl6UEsHCGe6jusDAAAAAwAAAFBLAQItAwoAAAAAAGyFJkYAAAAAAAAAAAAAAAAFAAAAAAAAAAAAEADtAQAAAABkaXIxL1BLAQItAwoAAAAAAGyFJkYAAAAAAAAAAAAAAAAFAAAAAAAAAAAAEADJASMAAABkaXIyL1BLAQItAxQACAAAAGyFJkbCQSQ1AwAAAAMAAAAFAAAAAAAAAAAAIADtgUYAAABmaWxlMVBLAQItAxQACAAAAGyFJkZnuo7rAwAAAAMAAAAFAAAAAAAAAAAAIADJgXwAAABmaWxlMlBLBQYAAAAABAAEAMwAAACyAAAAAAA=": "file1=abc,file2=xyz"
        },
        deflate: {
            "CPCBasic;B;0;408;;base64,UEsDBAoAAAAAAGyFJkYAAAAAAAAAAAAAAAAFAAAAZGlyMS9QSwMECgAAAAAAbIUmRgAAAAAAAAAAAAAAAAUAAABkaXIyL1BLAwQUAAgACABshSZGAAAAAAAAAAAAAAAABQAAAGZpbGUxS0xKBgBQSwcIwkEkNQUAAAADAAAAUEsDBBQACAAIAGyFJkYAAAAAAAAAAAAAAAAFAAAAZmlsZTKrqKwCAFBLBwhnuo7rBQAAAAMAAABQSwECLQMKAAAAAABshSZGAAAAAAAAAAAAAAAABQAAAAAAAAAAABAA7QEAAAAAZGlyMS9QSwECLQMKAAAAAABshSZGAAAAAAAAAAAAAAAABQAAAAAAAAAAABAAyQEjAAAAZGlyMi9QSwECLQMUAAgACABshSZGwkEkNQUAAAADAAAABQAAAAAAAAAAACAA7YFGAAAAZmlsZTFQSwECLQMUAAgACABshSZGZ7qO6wUAAAADAAAABQAAAAAAAAAAACAAyYF+AAAAZmlsZTJQSwUGAAAAAAQABADMAAAAtgAAAAAA": "file1=abc,file2=xyz"
        }
    };
    function fnString2ArrayBuf(sData) {
        var aBuf = new ArrayBuffer(sData.length), aView = new Uint8Array(aBuf);
        for (var i = 0; i < sData.length; i += 1) {
            aView[i] = sData.charCodeAt(i);
        }
        return aBuf;
    }
    function fnExtractZipFiles(oZip) {
        var aResult = [];
        if (oZip) {
            var oZipDirectory = oZip.getZipDirectory(), aEntries = Object.keys(oZipDirectory);
            for (var i = 0; i < aEntries.length; i += 1) {
                var sName = aEntries[i], sData = oZip.readData(sName);
                if (sData) {
                    aResult.push(sName + "=" + sData);
                }
            }
        }
        return aResult.join(",");
    }
    function runTestsFor(assert, oTests, aResults) {
        for (var sKey in oTests) {
            if (oTests.hasOwnProperty(sKey)) {
                var aParts = sKey.split(",", 2), sMeta = aParts[0], sData = Utils_1.Utils.atob(aParts[1]), // decode base64
                oZip = new ZipFile_1.ZipFile(new Uint8Array(fnString2ArrayBuf(sData)), "name"), sExpected = oTests[sKey];
                var sResult = void 0;
                try {
                    sResult = fnExtractZipFiles(oZip);
                }
                catch (e) {
                    Utils_1.Utils.console.error(e);
                    sResult = String(e);
                }
                if (aResults) {
                    aResults.push('"' + sKey + '": "' + sResult + '"');
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
//# sourceMappingURL=ZipFile.qunit.js.map