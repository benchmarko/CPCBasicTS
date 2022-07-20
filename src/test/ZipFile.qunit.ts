// ZipFile.qunit.ts - QUnit tests for CPCBasic ZipFile
//

import { Utils } from "../Utils";
import { ZipFile } from "../ZipFile";
import { TestHelper, TestsType, AllTestsType } from "./TestHelper";

QUnit.dump.maxDepth = 10;

QUnit.module("ZipFile: Tests", function () {
	// examples store.zip and deflate.zip taken from https://github.com/bower/decompress-zip/tree/master/test/assets/file-mode-pack
	// deflate example created by: Controller.exportAsBase64("deflate.zip.xxx")
	const allTests: AllTestsType = { // eslint-disable-line vars-on-top
		store: {
			"CPCBasic;B;0;404;;base64,UEsDBAoAAAAAAGyFJkYAAAAAAAAAAAAAAAAFAAAAZGlyMS9QSwMECgAAAAAAbIUmRgAAAAAAAAAAAAAAAAUAAABkaXIyL1BLAwQUAAgAAABshSZGAAAAAAAAAAAAAAAABQAAAGZpbGUxYWJjUEsHCMJBJDUDAAAAAwAAAFBLAwQUAAgAAABshSZGAAAAAAAAAAAAAAAABQAAAGZpbGUyeHl6UEsHCGe6jusDAAAAAwAAAFBLAQItAwoAAAAAAGyFJkYAAAAAAAAAAAAAAAAFAAAAAAAAAAAAEADtAQAAAABkaXIxL1BLAQItAwoAAAAAAGyFJkYAAAAAAAAAAAAAAAAFAAAAAAAAAAAAEADJASMAAABkaXIyL1BLAQItAxQACAAAAGyFJkbCQSQ1AwAAAAMAAAAFAAAAAAAAAAAAIADtgUYAAABmaWxlMVBLAQItAxQACAAAAGyFJkZnuo7rAwAAAAMAAAAFAAAAAAAAAAAAIADJgXwAAABmaWxlMlBLBQYAAAAABAAEAMwAAACyAAAAAAA=": "file1=abc,file2=xyz"
		},
		deflate: {
			"CPCBasic;B;0;408;;base64,UEsDBAoAAAAAAGyFJkYAAAAAAAAAAAAAAAAFAAAAZGlyMS9QSwMECgAAAAAAbIUmRgAAAAAAAAAAAAAAAAUAAABkaXIyL1BLAwQUAAgACABshSZGAAAAAAAAAAAAAAAABQAAAGZpbGUxS0xKBgBQSwcIwkEkNQUAAAADAAAAUEsDBBQACAAIAGyFJkYAAAAAAAAAAAAAAAAFAAAAZmlsZTKrqKwCAFBLBwhnuo7rBQAAAAMAAABQSwECLQMKAAAAAABshSZGAAAAAAAAAAAAAAAABQAAAAAAAAAAABAA7QEAAAAAZGlyMS9QSwECLQMKAAAAAABshSZGAAAAAAAAAAAAAAAABQAAAAAAAAAAABAAyQEjAAAAZGlyMi9QSwECLQMUAAgACABshSZGwkEkNQUAAAADAAAABQAAAAAAAAAAACAA7YFGAAAAZmlsZTFQSwECLQMUAAgACABshSZGZ7qO6wUAAAADAAAABQAAAAAAAAAAACAAyYF+AAAAZmlsZTJQSwUGAAAAAAQABADMAAAAtgAAAAAA": "file1=abc,file2=xyz"
		}
	};

	function fnString2ArrayBuf(data: string) {
		const buf = new ArrayBuffer(data.length),
			view = new Uint8Array(buf);

		for (let i = 0; i < data.length; i += 1) {
			view[i] = data.charCodeAt(i);
		}
		return buf;
	}

	function fnExtractZipFiles(zip: ZipFile) {
		const result: string[] = [];

		if (zip) {
			const zipDirectory = zip.getZipDirectory(),
				entries = Object.keys(zipDirectory);

			for (let i = 0; i < entries.length; i += 1) {
				const name = entries[i],
					data = zip.readData(name);

				if (data) {
					result.push(name + "=" + data);
				}
			}
		}
		return result.join(",");
	}

	function runTestsFor(assert: Assert | undefined, _sCategory: string, tests: TestsType, results?: string[]) {
		for (const key in tests) {
			if (tests.hasOwnProperty(key)) {
				const parts = Utils.split2(key, ","),
					meta = parts[0],
					data = Utils.atob(parts[1]), // decode base64
					zip = new ZipFile(new Uint8Array(fnString2ArrayBuf(data)), "name"),
					expected = tests[key];
				let result: string;

				try {
					result = fnExtractZipFiles(zip);
				} catch (e) {
					Utils.console.error(e);
					result = String(e);
				}

				if (results) {
					results.push(TestHelper.stringInQuotes(key) + ": " + TestHelper.stringInQuotes(result));
				}

				if (assert) {
					assert.strictEqual(result, expected, meta);
				}
			}
		}
	}

	TestHelper.generateAndRunAllTests(allTests, runTestsFor);
});

// end
