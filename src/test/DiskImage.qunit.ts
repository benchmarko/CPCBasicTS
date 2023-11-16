// DiskImage.qunit.ts - QUnit tests for CPCBasic DiskImage
//

import { Utils } from "../Utils";
import { BasicTokenizer } from "../BasicTokenizer";
import { AmsdosHeader, DiskImage } from "../DiskImage";
import { ZipFile } from "../ZipFile"; // we need this just to reduce stored disk image size
import { TestHelper, TestsType, AllTestsType, ResultType } from "./TestHelper";

QUnit.dump.maxDepth = 10;

// key:  compressed part of disk image file; Controller.exportAsBase64("cpcdata.zip.xxx")
// noDiskInfo: will just show a warning: "DiskImage: name: Disk ident not found at pos 0-9: XXsk-Info"
// noTrackInfo: will just show a warning: "DiskImage: name: Track ident not found at pos 256-266: XXack-Info"

const allTests: AllTestsType = {
	dataEmpty: {
		"CPCBasic;B;0;245;;base64,UEsDBBQAAAAIAMiAj1IH4jtleQAAAAAUAAANAAAAZGF0YUVtcHR5LmRza/MNU9BVcA5wdvUNVXDJLM7WdcvMSeXlAjM989LyeblSgMxMIEsBDDQYGYQZhhEIKUpMhvkUJsbE6feUgeEgE4R3CEofhtJHoPRRKH0MSh+H0ieg9EkoPbjB01EwCkbBKBgFo2AUjIJRMApGwSgYBaNgFIyCUTCsAQBQSwECFAAUAAAACADIgI9SB+I7ZXkAAAAAFAAADQAAAAAAAAAAACAAAAAAAAAAZGF0YUVtcHR5LmRza1BLBQYAAAAAAQABADsAAACkAAAAAAA=": ""
	},
	data: {
		"CPCBasic;B;0;609;;base64,UEsDBBQAAAAIAOyBdVI5vxGB6QEAAAAnAAALAAAAY3BjZGF0YS5kc2vzDVPQVXAOcHb1DVVwySzO1nXLzEnl5QIzPfPS8nm5UoDMTCBLAQw0GBmEGYYRCClKTIb5FCbGxOn3lIHhIBOEdwhKH4bSR6D0USh9DEofh9InoPRJKD3IATDunRyD4x0dg52BPEYMR0PlQ4AEkMfEjEM+ACrPgkPeycnTDyTPiib9dBSMglEwCkbBKBgFdAeGBgoBQZ5+IQpKoIo6sTgzWYmXS+r/f1Dd/P8/7WlC7hsFo2AU0A6gte8hoID4Th5Q3RlmQQYuhv1IJQhQXIrIQoQCrVShCYXPKBgFwxmg9d+BgJHU/H+SeZfO81eXxWXXn55jkeuxl+86iwsz91XngnvFVWealc5PPX+5n+nD/CnZ0ts/M6+YX86/50Wf8wLT6nNrPsufpEDriyB710mTOa5kXfb9cePAzHedATZrQrRNYvTfCIZevvllj5CP1ePpjAo6vzoivaL/zP5otMSmv6PVbF90sbmX7QfuGfwnk9QzCYXPcAfo41/A2AePfzFCx78YoeNfjNDxL0bo+BcjdPyLETr+xQgd/2KEjn8xDpHxL0LhMwqGN0AbnwQCULI9wMCBN9UgAFDdD2ZY60XKSUVF5T/DfxIKMQq0jpZ/o2AUjIJRMApGwSgYBaNgFIyCUTAKRgGRAABQSwECFAAUAAAACADsgXVSOb8RgekBAAAAJwAACwAAAAAAAAAAACAAAAAAAAAAY3BjZGF0YS5kc2tQSwUGAAAAAAEAAQA5AAAAEgIAAAAA": 'CPCBAS_A.ASC={"typeString":"A","start":0,"length":21} 10 PRINT "CPCBasic"\r\nCPCBAS_T.BAS={"user":0,"name":"CPCBAS_T","ext":"BAS","typeNumber":0,"start":368,"pseudoLen":19,"entry":0,"length":19,"typeString":"T"} 10 PRINT "CPCBasic"\nCPCBAS_P.BAS={"user":0,"name":"CPCBAS_P","ext":"BAS","typeNumber":1,"start":368,"pseudoLen":19,"entry":0,"length":19,"typeString":"P"} 10 PRINT "CPCBasic"\nCPCBAS_B.BIN={"user":0,"name":"CPCBAS_B","ext":"BIN","typeNumber":2,"start":49152,"pseudoLen":8,"entry":0,"length":8,"typeString":"B"} CPCBasic'
	},
	system: {
		"CPCBasic;B;0;429;;base64,UEsDBBQAAAAIANWJdVLsLMeMNwEAAAA6AAAKAAAAY3Bjc3lzLmRza+3bQUvCYBzH8ed5PDXYIbp5Gp66CPUS5tTaQZGcXUOsYBQV+QJ7A70NX8d6pj8h1mFCCWt8Pwf/zzaFucMmX3ByG/WjZJaMJotomK+f+uP8+SEMtsv05fE1DO79MveraOvcmjPTItn7crX/pvt97mS6MSZ2u62BZqI51BxpjjWvNK81U81m2wAAAAAAAKDVqv3Lml3/supfVv3Lqn9Z9S+r/mXVv6z6l1X/svQvAAAAAAAANEC1f5XRquxfTv3LqX859S+n/uXUv5z6l1P/cupf7p/0L5PMkkE8v4vjeeK37I+T1vHMv/gt16kcrru+AACgeS4votlNOs2iXvmgX67zVS8MukVRPtuL4viz7vwAHE/l9/3O2+F/8vHv++ycmsB8fLuD+P3dA28iv/jon8y66wMAbfUFUEsBAhQAFAAAAAgA1Yl1Uuwsx4w3AQAAADoAAAoAAAAAAAAAAAAgAAAAAAAAAGNwY3N5cy5kc2tQSwUGAAAAAAEAAQA4AAAAXwEAAAAA": 'CPCBAS_A.ASC={"typeString":"A","start":0,"length":21} 10 PRINT "CPCBasic"\r\nCPCBAS_T.BAS={"user":0,"name":"CPCBAS_T","ext":"BAS","typeNumber":0,"start":368,"pseudoLen":19,"entry":0,"length":19,"typeString":"T"} 10 PRINT "CPCBasic"\n'
	},
	noDskIdent: {
		"CPCBasic;B;0;247;;base64,UEsDBBQAAAAIAEKCj1KUjyNHeQAAAAAUAAAOAAAAbm9Ec2tJZGVudC5kc2uLiFDQVXAOcHb1DVVwySzO1nXLzEnl5QIzPfPS8nm5UoDMTCBLAQw0GBmEGYYRCClKTIb5FCbGxOn3lIHhIBOEdwhKH4bSR6D0USh9DEofh9InoPRJKD24wdNRMApGwSgYBaNgFIyCUTAKRsEoGAWjYBSMglEwrAEAUEsBAhQAFAAAAAgAQoKPUpSPI0d5AAAAABQAAA4AAAAAAAAAAAAgAAAAAAAAAG5vRHNrSWRlbnQuZHNrUEsFBgAAAAABAAEAPAAAAKUAAAAAAA==": "DiskImage: name: Ident not found at pos 0: XX - CPC"
	},
	noDiskInfo: {
		"CPCBasic;B;0;249;;base64,UEsDBBQAAAAIAHKDj1JAJpc5ewAAAAAUAAAOAAAAbm9EaXNrSW5mby5kc2vzDVPQVXAOcHb1DVVwySzO1nXLzEnl5YqIADI989LyeblSgKKZQJYCGGgwMggzDCMQUpSYDPMpTIyJ0+8pA8NBJgjvEJQ+DKWPQOmjUPoYlD4OpU9A6ZNQenCDp6NgFIyCUTAKRsEoGAWjYBSMglEwCkbBKBgFo2BYAwBQSwECFAAUAAAACAByg49SQCaXOXsAAAAAFAAADgAAAAAAAAAAACAAAAAAAAAAbm9EaXNrSW5mby5kc2tQSwUGAAAAAAEAAQA8AAAApwAAAAAA": ""
	},
	noTrackInfo: {
		"CPCBasic;B;0;249;;base64,UEsDBBQAAAAIAJODj1JUALEMeQAAAAAUAAAPAAAAbm9UcmFja0luZm8uZHNr8w1T0FVwDnB29Q1VcMksztZ1y8xJ5eUCMz3z0vJ5uVKAzEwgSwEMNBgZhBmGEYiISEyG+RQmxsTp95SB4SAThHcISh+G0keg9FEofQxKH4fSJ6D0SSg9uMHTUTAKRsEoGAWjYBSMglEwCkbBKBgFo2AUjIJRMKwBAFBLAQIUABQAAAAIAJODj1JUALEMeQAAAAAUAAAPAAAAAAAAAAAAIAAAAAAAAABub1RyYWNrSW5mby5kc2tQSwUGAAAAAAEAAQA9AAAApgAAAAAA": ""
	}
};


QUnit.module("DiskImage: Tests", function (hooks) {
	function createMinimalAmsdosHeader(type: string, start: number, length: number) {
		return {
			typeString: type,
			start: start,
			length: length
		} as AmsdosHeader;
	}

	function fnExtractDiskImage(disk: DiskImage) {
		const result: string[] = [],
			dir = disk.readDirectory(),
			entries = Object.keys(dir);

		for (let i = 0; i < entries.length; i += 1) {
			const name = entries[i];
			let data = disk.readFile(dir[name]);

			if (data) {
				let headerEntry = DiskImage.parseAmsdosHeader(data);

				if (headerEntry) {
					data = data.substr(0x80); // remove header
					if (headerEntry.typeString === "P") { // protected BASIC?
						data = DiskImage.unOrProtectData(data);
						data = new BasicTokenizer().decode(data);
					} else if (headerEntry.typeString === "T") { // tokenized BASIC?
						data = new BasicTokenizer().decode(data);
					}
				} else {
					headerEntry = createMinimalAmsdosHeader("A", 0, data.length);
				}

				const headerString = JSON.stringify(headerEntry);

				result.push(name + "=" + headerString + " " + data);
			}
		}
		return result.join("");
	}

	function runTestsFor(category: string, tests: TestsType, assert?: Assert, results?: ResultType) {
		for (const key in tests) {
			if (tests.hasOwnProperty(key)) {
				const parts = Utils.split2(key, ","),
					meta = parts[0],
					compressed = Utils.atob(parts[1]), // decode base64
					zip = new ZipFile({
						data: Utils.string2Uint8Array(compressed),
						zipName: "name"
					}),
					firstFileInZip = Object.keys(zip.getZipDirectory())[0],
					uncompressed = zip.readData(firstFileInZip),
					disk = new DiskImage({
						data: uncompressed,
						diskName: "name",
						quiet: true
					}),
					expected = tests[key];
				let result: string;

				try {
					result = fnExtractDiskImage(disk);
				} catch (e) {
					result = String(e);
					if (result !== expected) { // output in console only if error not expected
						Utils.console.error(e);
					}
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
