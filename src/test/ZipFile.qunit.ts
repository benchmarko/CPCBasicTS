// ZipFile.qunit.ts - QUnit tests for CPCBasic ZipFile
//

import { Utils } from "../Utils";
import { ZipFile } from "../ZipFile";
import { TestHelper, TestsType, AllTestsType, ResultType } from "./TestHelper";

QUnit.dump.maxDepth = 10;

QUnit.module("ZipFile: Tests", function (hooks) {
	// examples store.zip and deflate.zip taken from https://github.com/bower/decompress-zip/tree/master/test/assets/file-mode-pack
	// deflate example created by: Controller.exportAsBase64("deflate.zip.xxx")
	const allTests: AllTestsType = {
		store: {
			"CPCBasic;B;0;404;;base64,UEsDBAoAAAAAAGyFJkYAAAAAAAAAAAAAAAAFAAAAZGlyMS9QSwMECgAAAAAAbIUmRgAAAAAAAAAAAAAAAAUAAABkaXIyL1BLAwQUAAgAAABshSZGAAAAAAAAAAAAAAAABQAAAGZpbGUxYWJjUEsHCMJBJDUDAAAAAwAAAFBLAwQUAAgAAABshSZGAAAAAAAAAAAAAAAABQAAAGZpbGUyeHl6UEsHCGe6jusDAAAAAwAAAFBLAQItAwoAAAAAAGyFJkYAAAAAAAAAAAAAAAAFAAAAAAAAAAAAEADtAQAAAABkaXIxL1BLAQItAwoAAAAAAGyFJkYAAAAAAAAAAAAAAAAFAAAAAAAAAAAAEADJASMAAABkaXIyL1BLAQItAxQACAAAAGyFJkbCQSQ1AwAAAAMAAAAFAAAAAAAAAAAAIADtgUYAAABmaWxlMVBLAQItAxQACAAAAGyFJkZnuo7rAwAAAAMAAAAFAAAAAAAAAAAAIADJgXwAAABmaWxlMlBLBQYAAAAABAAEAMwAAACyAAAAAAA=": "file1=abc,file2=xyz"
		},
		deflate: {
			"CPCBasic;B;0;408;;base64,UEsDBAoAAAAAAGyFJkYAAAAAAAAAAAAAAAAFAAAAZGlyMS9QSwMECgAAAAAAbIUmRgAAAAAAAAAAAAAAAAUAAABkaXIyL1BLAwQUAAgACABshSZGAAAAAAAAAAAAAAAABQAAAGZpbGUxS0xKBgBQSwcIwkEkNQUAAAADAAAAUEsDBBQACAAIAGyFJkYAAAAAAAAAAAAAAAAFAAAAZmlsZTKrqKwCAFBLBwhnuo7rBQAAAAMAAABQSwECLQMKAAAAAABshSZGAAAAAAAAAAAAAAAABQAAAAAAAAAAABAA7QEAAAAAZGlyMS9QSwECLQMKAAAAAABshSZGAAAAAAAAAAAAAAAABQAAAAAAAAAAABAAyQEjAAAAZGlyMi9QSwECLQMUAAgACABshSZGwkEkNQUAAAADAAAABQAAAAAAAAAAACAA7YFGAAAAZmlsZTFQSwECLQMUAAgACABshSZGZ7qO6wUAAAADAAAABQAAAAAAAAAAACAAyYF+AAAAZmlsZTJQSwUGAAAAAAQABADMAAAAtgAAAAAA": "file1=abc,file2=xyz"
		}
	};


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

	function runTestsFor(category: string, tests: TestsType, assert?: Assert, results?: ResultType) {
		for (const key in tests) {
			if (tests.hasOwnProperty(key)) {
				const parts = Utils.split2(key, ","),
					meta = parts[0],
					data = Utils.atob(parts[1]), // decode base64
					zip = new ZipFile({
						data: Utils.string2Uint8Array(data),
						zipName: "name"
					}),
					expected = tests[key];
				let result: string;

				try {
					result = fnExtractZipFiles(zip);
				} catch (e) {
					Utils.console.error(e);
					result = String(e);
				}

				if (results) {
					results[category].push(TestHelper.stringInQuotes(key) + ": " + TestHelper.stringInQuotes(result));
				}

				if (assert) {
					assert.strictEqual(result, expected, meta);
				}
			}
		}
	}

	TestHelper.generateAllTests(allTests, runTestsFor, hooks);
});

// end
