// ZipFile.qunit.ts - QUnit tests for CPCBasic ZipFile
//

const bGenerateAllResults = false;

import { Utils } from "../Utils";
import { ZipFile } from "../ZipFile";
import {} from "qunit";

type TestsType = { [k in string]: string };

type AllTestsType = { [k in string]: TestsType };

QUnit.dump.maxDepth = 10;

QUnit.module("ZipFile: Tests", function () {
	// examples store.zip and deflate.zip taken from https://github.com/bower/decompress-zip/tree/master/test/assets/file-mode-pack
	const mAllTests: AllTestsType = { // eslint-disable-line vars-on-top
		store: {
			"CPCBasic;B;0;404;;base64,UEsDBAoAAAAAAGyFJkYAAAAAAAAAAAAAAAAFAAAAZGlyMS9QSwMECgAAAAAAbIUmRgAAAAAAAAAAAAAAAAUAAABkaXIyL1BLAwQUAAgAAABshSZGAAAAAAAAAAAAAAAABQAAAGZpbGUxYWJjUEsHCMJBJDUDAAAAAwAAAFBLAwQUAAgAAABshSZGAAAAAAAAAAAAAAAABQAAAGZpbGUyeHl6UEsHCGe6jusDAAAAAwAAAFBLAQItAwoAAAAAAGyFJkYAAAAAAAAAAAAAAAAFAAAAAAAAAAAAEADtAQAAAABkaXIxL1BLAQItAwoAAAAAAGyFJkYAAAAAAAAAAAAAAAAFAAAAAAAAAAAAEADJASMAAABkaXIyL1BLAQItAxQACAAAAGyFJkbCQSQ1AwAAAAMAAAAFAAAAAAAAAAAAIADtgUYAAABmaWxlMVBLAQItAxQACAAAAGyFJkZnuo7rAwAAAAMAAAAFAAAAAAAAAAAAIADJgXwAAABmaWxlMlBLBQYAAAAABAAEAMwAAACyAAAAAAA=": "file1=abc,file2=xyz"
		},
		deflate: { // created by: Controller.exportAsBase64("deflate.zip.xxx")
			"CPCBasic;B;0;408;;base64,UEsDBAoAAAAAAGyFJkYAAAAAAAAAAAAAAAAFAAAAZGlyMS9QSwMECgAAAAAAbIUmRgAAAAAAAAAAAAAAAAUAAABkaXIyL1BLAwQUAAgACABshSZGAAAAAAAAAAAAAAAABQAAAGZpbGUxS0xKBgBQSwcIwkEkNQUAAAADAAAAUEsDBBQACAAIAGyFJkYAAAAAAAAAAAAAAAAFAAAAZmlsZTKrqKwCAFBLBwhnuo7rBQAAAAMAAABQSwECLQMKAAAAAABshSZGAAAAAAAAAAAAAAAABQAAAAAAAAAAABAA7QEAAAAAZGlyMS9QSwECLQMKAAAAAABshSZGAAAAAAAAAAAAAAAABQAAAAAAAAAAABAAyQEjAAAAZGlyMi9QSwECLQMUAAgACABshSZGwkEkNQUAAAADAAAABQAAAAAAAAAAACAA7YFGAAAAZmlsZTFQSwECLQMUAAgACABshSZGZ7qO6wUAAAADAAAABQAAAAAAAAAAACAAyYF+AAAAZmlsZTJQSwUGAAAAAAQABADMAAAAtgAAAAAA": "file1=abc,file2=xyz"
		}
	};

	function fnString2ArrayBuf(sData: string) {
		const aBuf = new ArrayBuffer(sData.length),
			aView = new Uint8Array(aBuf);

		for (let i = 0; i < sData.length; i += 1) {
			aView[i] = sData.charCodeAt(i);
		}
		return aBuf;
	}

	function fnExtractZipFiles(oZip: ZipFile) {
		const aResult: string[] = [];

		if (oZip) {
			const oZipDirectory = oZip.getZipDirectory(),
				aEntries = Object.keys(oZipDirectory);

			for (let i = 0; i < aEntries.length; i += 1) {
				const sName = aEntries[i],
					sData = oZip.readData(sName);

				if (sData) {
					aResult.push(sName + "=" + sData);
				}
			}
		}
		return aResult.join(",");
	}

	function runTestsFor(assert: Assert | undefined, oTests: TestsType, aResults?: string[]) {
		for (const sKey in oTests) {
			if (oTests.hasOwnProperty(sKey)) {
				const aParts = sKey.split(",", 2),
					sMeta = aParts[0],
					sData = Utils.atob(aParts[1]), // decode base64
					oZip = new ZipFile(new Uint8Array(fnString2ArrayBuf(sData)), "name"),
					sExpected = oTests[sKey];
				let sResult: string;

				try {
					sResult = fnExtractZipFiles(oZip);
				} catch (e) {
					Utils.console.error(e);
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

	function generateTests(oAllTests: AllTestsType) {
		for (const sCategory in oAllTests) {
			if (oAllTests.hasOwnProperty(sCategory)) {
				(function (sCat) { // eslint-disable-line no-loop-func
					QUnit.test(sCat, function (assert: Assert) {
						runTestsFor(assert, oAllTests[sCat]);
					});
				}(sCategory));
			}
		}
	}

	generateTests(mAllTests);


	// generate result list (not used during the test, just for debugging)

	function generateAllResults(oAllTests: AllTestsType) {
		let sResult = "";

		for (const sCategory in oAllTests) {
			if (oAllTests.hasOwnProperty(sCategory)) {
				const aResults: string[] = [],
					bContainsSpace = sCategory.indexOf(" ") >= 0,
					sMarker = bContainsSpace ? '"' : "";

				sResult += sMarker + sCategory + sMarker + ": {\n";

				runTestsFor(undefined, oAllTests[sCategory], aResults);
				sResult += aResults.join(",\n");
				sResult += "\n},\n";
			}
		}
		Utils.console.log(sResult);
		return sResult;
	}

	if (bGenerateAllResults) {
		generateAllResults(mAllTests);
	}
});

// end
