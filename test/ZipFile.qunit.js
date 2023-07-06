// ZipFile.qunit.ts - QUnit tests for CPCBasic ZipFile
//
define(["require", "exports", "../Utils", "../ZipFile", "./TestHelper"], function (require, exports, Utils_1, ZipFile_1, TestHelper_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    QUnit.dump.maxDepth = 10;
    QUnit.module("ZipFile: Tests", function (hooks) {
        // examples store.zip and deflate.zip taken from https://github.com/bower/decompress-zip/tree/master/test/assets/file-mode-pack
        // deflate example created by: Controller.exportAsBase64("deflate.zip.xxx")
        var allTests = {
            store: {
                "CPCBasic;B;0;404;;base64,UEsDBAoAAAAAAGyFJkYAAAAAAAAAAAAAAAAFAAAAZGlyMS9QSwMECgAAAAAAbIUmRgAAAAAAAAAAAAAAAAUAAABkaXIyL1BLAwQUAAgAAABshSZGAAAAAAAAAAAAAAAABQAAAGZpbGUxYWJjUEsHCMJBJDUDAAAAAwAAAFBLAwQUAAgAAABshSZGAAAAAAAAAAAAAAAABQAAAGZpbGUyeHl6UEsHCGe6jusDAAAAAwAAAFBLAQItAwoAAAAAAGyFJkYAAAAAAAAAAAAAAAAFAAAAAAAAAAAAEADtAQAAAABkaXIxL1BLAQItAwoAAAAAAGyFJkYAAAAAAAAAAAAAAAAFAAAAAAAAAAAAEADJASMAAABkaXIyL1BLAQItAxQACAAAAGyFJkbCQSQ1AwAAAAMAAAAFAAAAAAAAAAAAIADtgUYAAABmaWxlMVBLAQItAxQACAAAAGyFJkZnuo7rAwAAAAMAAAAFAAAAAAAAAAAAIADJgXwAAABmaWxlMlBLBQYAAAAABAAEAMwAAACyAAAAAAA=": "file1=abc,file2=xyz"
            },
            deflate: {
                "CPCBasic;B;0;408;;base64,UEsDBAoAAAAAAGyFJkYAAAAAAAAAAAAAAAAFAAAAZGlyMS9QSwMECgAAAAAAbIUmRgAAAAAAAAAAAAAAAAUAAABkaXIyL1BLAwQUAAgACABshSZGAAAAAAAAAAAAAAAABQAAAGZpbGUxS0xKBgBQSwcIwkEkNQUAAAADAAAAUEsDBBQACAAIAGyFJkYAAAAAAAAAAAAAAAAFAAAAZmlsZTKrqKwCAFBLBwhnuo7rBQAAAAMAAABQSwECLQMKAAAAAABshSZGAAAAAAAAAAAAAAAABQAAAAAAAAAAABAA7QEAAAAAZGlyMS9QSwECLQMKAAAAAABshSZGAAAAAAAAAAAAAAAABQAAAAAAAAAAABAAyQEjAAAAZGlyMi9QSwECLQMUAAgACABshSZGwkEkNQUAAAADAAAABQAAAAAAAAAAACAA7YFGAAAAZmlsZTFQSwECLQMUAAgACABshSZGZ7qO6wUAAAADAAAABQAAAAAAAAAAACAAyYF+AAAAZmlsZTJQSwUGAAAAAAQABADMAAAAtgAAAAAA": "file1=abc,file2=xyz"
            }
        };
        function fnString2ArrayBuf(data) {
            var buf = new ArrayBuffer(data.length), view = new Uint8Array(buf);
            for (var i = 0; i < data.length; i += 1) {
                view[i] = data.charCodeAt(i);
            }
            return buf;
        }
        function fnExtractZipFiles(zip) {
            var result = [];
            if (zip) {
                var zipDirectory = zip.getZipDirectory(), entries = Object.keys(zipDirectory);
                for (var i = 0; i < entries.length; i += 1) {
                    var name_1 = entries[i], data = zip.readData(name_1);
                    if (data) {
                        result.push(name_1 + "=" + data);
                    }
                }
            }
            return result.join(",");
        }
        function runTestsFor(category, tests, assert, results) {
            for (var key in tests) {
                if (tests.hasOwnProperty(key)) {
                    var parts = Utils_1.Utils.split2(key, ","), meta = parts[0], data = Utils_1.Utils.atob(parts[1]), // decode base64
                    zip = new ZipFile_1.ZipFile(new Uint8Array(fnString2ArrayBuf(data)), "name"), expected = tests[key];
                    var result = void 0;
                    try {
                        result = fnExtractZipFiles(zip);
                    }
                    catch (e) {
                        Utils_1.Utils.console.error(e);
                        result = String(e);
                    }
                    if (results) {
                        results[category].push(TestHelper_1.TestHelper.stringInQuotes(key) + ": " + TestHelper_1.TestHelper.stringInQuotes(result));
                    }
                    if (assert) {
                        assert.strictEqual(result, expected, meta);
                    }
                }
            }
        }
        TestHelper_1.TestHelper.generateAllTests(allTests, runTestsFor, hooks);
    });
});
// end
//# sourceMappingURL=ZipFile.qunit.js.map