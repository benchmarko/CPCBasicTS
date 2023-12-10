// DiskImage.qunit.ts - QUnit tests for CPCBasic DiskImage
//
define(["require", "exports", "../Utils", "../BasicLexer", "../BasicParser", "../CodeGeneratorToken", "../BasicTokenizer", "../DiskImage", "../ZipFile", "./TestHelper"], function (require, exports, Utils_1, BasicLexer_1, BasicParser_1, CodeGeneratorToken_1, BasicTokenizer_1, DiskImage_1, ZipFile_1, TestHelper_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    QUnit.dump.maxDepth = 10;
    // key:  compressed part of disk image file; Controller.exportAsBase64("cpcdata.zip.xxx")
    // noDiskInfo: will just show a warning: "DiskImage: name: Disk ident not found at pos 0-9: XXsk-Info"
    // noTrackInfo: will just show a warning: "DiskImage: name: Track ident not found at pos 256-266: XXack-Info"
    var allTests = {
        dataEmpty: {
            "CPCBasic;B;0;245;;base64,UEsDBBQAAAAIAMiAj1IH4jtleQAAAAAUAAANAAAAZGF0YUVtcHR5LmRza/MNU9BVcA5wdvUNVXDJLM7WdcvMSeXlAjM989LyeblSgMxMIEsBDDQYGYQZhhEIKUpMhvkUJsbE6feUgeEgE4R3CEofhtJHoPRRKH0MSh+H0ieg9EkoPbjB01EwCkbBKBgFo2AUjIJRMApGwSgYBaNgFIyCUTCsAQBQSwECFAAUAAAACADIgI9SB+I7ZXkAAAAAFAAADQAAAAAAAAAAACAAAAAAAAAAZGF0YUVtcHR5LmRza1BLBQYAAAAAAQABADsAAACkAAAAAAA=": ""
        },
        data: {
            "CPCBasic;B;0;1455;0;base64,UEsDBBQACAAIAK68iFcAAAAAAAAAAAAnAAAMACAAdHN0ZnR5X2QuZHNrVVQNAAepmnNlqZpzZSCbc2V1eAsAAQT3AQAABBQAAADzDVPQVXAOcHb1DVVwySzO1nXLzEnl5QIzPfPS8nm5nAuSnRKLM5NDghWAgImRQZhhGIGQosRkmE9hYkycfk8ZGA4yQXiHoPRhKH0ESh+F0seg9HEofQJKn2SipbupBkKCQ9xCIuMdHYOdgTxmDEdD5Z2cPP2APCZmHPIBTo7BIP0sOORDoPKsaNJPR8EoGAWjYBSMglFAd2BooBDk6qtQUlySVlIJbAqGpBaXKIDagAohlQWpxVxGBgoBQZ5+IQpKwEYiuB2oxGVkquDs6OOjoObkZGjBZWKgEOwY5qqgBGtJ6AGbEko6jlymaBIhesA2gBKXGZpwAFhYJ4DL3EChRMUWYY+Vm3+QQqatoUKIv4KPq59GiYqmVYC/t6uCmrOBgYF2pq6hDtAmDV9PFxWgnE6mjqGmppWfa0QIlwWaFU56wNaLko6TDlinDtQwLksDBVc/Fy6pgY6DUTAKBgqgte9BTXwgPsDAQWT3AajOCqPNTwKA5fbRTDgKRgH9AVr/HQgYGRgKGBn+EJl/geruovfpSQFbdJ6/WinuPf/9Tr5S6Z++CxPNyw1nGjx2Cdbb+nmHc5bi5dlM/g6e17d82Zh0m/P1JedHfVELPJfoenvIX37ReqDQd2NMu13Ws7iKxu3rb715WL9M22SuPtu7GTpCV+a5PZgYZRNRX3HF9Pmztj+NH/miOQJCL6a+kr0x8dWke543Y0Q2Xp22+s/bBTmF9u9n3+97LDnddpubakHFnuq+/cHlZ5pN7qcK2K//+88jY8oT51tMYg5TPjTLNDsvUC60q+eRe+jSenhXbrrKzSydaG2NlxveW65/Evxb+38Nr/vef1m9ax8HzG0PVVPmUfxVnjJzx5/ou2dDXxeXtx6aHt114v2hDO4Z/IOhzEMf/wLGPnj8ixE6/sUIHf9ihI5/MULHvxih41+M0PEvRuj4FyN0/ItxiIx/DXT4j4KBBWjjkxBAWvn3gJLyT56Bi+Eozu4XgyCDCMN+pL4XULUkQ7OCjMRuBikGDYbT6L0uXgaGgwyiDEZIMpBuF1C5DZIgtNMFVH6BwYvBjYGZgeHLe4Q1jPMUgFIv3/MrvFH4z6cBktVk3Kcgw3DgC0j8K7/Of0aNNWBxkBkvdfg1NRk3MKgzBCDZAe11AeUP6QB16sAMYmBjiGKYAfT7YCj/RsEoGAWjYBSMglEwCkbBKBgFo2AUjAwAAFBLBwjPrZn8jAMAAAAnAABQSwMEFAAIAAgArryIVwAAAAAAAAAAFAEAABcAIABfX01BQ09TWC8uX3RzdGZ0eV9kLmRza1VUDQAHqZpzZamac2VDm3NldXgLAAEE9wEAAAQUAAAAY2AVY2dgYmDwTUxW8A9WiFCAApAYAycQGwHxIyAG8hlFGIgCjiEhQRAWWMcWIE5AU8IEFfdgYOBPzs/VSywoyEnVy01MzoHI/wFiCQYGUYRcYWliUWJeSWZeKgND45nvFxvupTrbTtoTUzFtesd7VgZ0EWLcWahvYGBhaG1mam5smZhoae2cUZSfm2rNAABQSwcI/gICQY8AAAAUAQAAUEsBAhQDFAAIAAgArryIV8+tmfyMAwAAACcAAAwAIAAAAAAAAAAAAKSBAAAAAHRzdGZ0eV9kLmRza1VUDQAHqZpzZamac2Ugm3NldXgLAAEE9wEAAAQUAAAAUEsBAhQDFAAIAAgArryIV/4CAkGPAAAAFAEAABcAIAAAAAAAAAAAAKSB5gMAAF9fTUFDT1NYLy5fdHN0ZnR5X2QuZHNrVVQNAAepmnNlqZpzZUObc2V1eAsAAQT3AQAABBQAAABQSwUGAAAAAAIAAgC/AAAA2gQAAAAA": 'TSTFTY_A.ASC -- {"typeString":"A","start":0,"length":259} -- 10 REM tstfty - Test File Types\n20 PRINT "CPCBasic"\n25 CALL &BB18\n40 SAVE "TSTFTY_A.ASC",A\n50 SAVE "TSTFTY_T.BAS"\n60 SAVE "TSTFTY_P.BAS",P\n70 t$="CPCBasic":FOR i=1 TO LEN(t$):POKE &C000+i-1,ASC(MID$(t$,i,1)):NEXT\n80 SAVE "TSTFTY_B.BIN",B,&C000,LEN(t$)\n90 END\n --- TSTFTY_B.BIN -- {"user":0,"name":"TSTFTY_B","ext":"BIN","typeNumber":2,"start":49152,"pseudoLen":8,"entry":0,"length":8,"typeString":"B"} -- CPCBasic --- TSTFTY_P.BAS -- {"user":0,"name":"TSTFTY_P","ext":"BAS","typeNumber":1,"start":368,"pseudoLen":252,"entry":0,"length":252,"typeString":"P"} -- 10 REM tstfty - Test File Types\n20 PRINT "CPCBasic"\n25 CALL &BB18\n40 SAVE "TSTFTY_A.ASC",A\n50 SAVE "TSTFTY_T.BAS"\n60 SAVE "TSTFTY_P.BAS",P\n70 t$="CPCBasic":FOR i=1 TO LEN(t$):POKE &C000+i-1,ASC(MID$(t$,i,1)):NEXT\n80 SAVE "TSTFTY_B.BIN",B,&C000,LEN(t$)\n90 END\n --- TSTFTY_T.BAS -- {"user":0,"name":"TSTFTY_T","ext":"BAS","typeNumber":0,"start":368,"pseudoLen":252,"entry":0,"length":252,"typeString":"T"} -- 10 REM tstfty - Test File Types\n20 PRINT "CPCBasic"\n25 CALL &BB18\n40 SAVE "TSTFTY_A.ASC",A\n50 SAVE "TSTFTY_T.BAS"\n60 SAVE "TSTFTY_P.BAS",P\n70 t$="CPCBasic":FOR i=1 TO LEN(t$):POKE &C000+i-1,ASC(MID$(t$,i,1)):NEXT\n80 SAVE "TSTFTY_B.BIN",B,&C000,LEN(t$)\n90 END\n'
        },
        system: {
            "CPCBasic;B;0;1455;0;base64,UEsDBBQACAAIAK68iFcAAAAAAAAAAAAnAAAMACAAdHN0ZnR5X2QuZHNrVVQNAAepmnNlqZpzZSCbc2V1eAsAAQT3AQAABBQAAADzDVPQVXAOcHb1DVVwySzO1nXLzEnl5QIzPfPS8nm5nAuSnRKLM5NDghWAgImRQZhhGIGQosRkmE9hYkycfk8ZGA4yQXiHoPRhKH0ESh+F0seg9HEofQJKn2SipbupBkKCQ9xCIuMdHYOdgTxmDEdD5Z2cPP2APCZmHPIBTo7BIP0sOORDoPKsaNJPR8EoGAWjYBSMglFAd2BooBDk6qtQUlySVlIJbAqGpBaXKIDagAohlQWpxVxGBgoBQZ5+IQpKwEYiuB2oxGVkquDs6OOjoObkZGjBZWKgEOwY5qqgBGtJ6AGbEko6jlymaBIhesA2gBKXGZpwAFhYJ4DL3EChRMUWYY+Vm3+QQqatoUKIv4KPq59GiYqmVYC/t6uCmrOBgYF2pq6hDtAmDV9PFxWgnE6mjqGmppWfa0QIlwWaFU56wNaLko6TDlinDtQwLksDBVc/Fy6pgY6DUTAKBgqgte9BTXwgPsDAQWT3AajOCqPNTwKA5fbRTDgKRgH9AVr/HQgYGRgKGBn+EJl/geruovfpSQFbdJ6/WinuPf/9Tr5S6Z++CxPNyw1nGjx2Cdbb+nmHc5bi5dlM/g6e17d82Zh0m/P1JedHfVELPJfoenvIX37ReqDQd2NMu13Ws7iKxu3rb715WL9M22SuPtu7GTpCV+a5PZgYZRNRX3HF9Pmztj+NH/miOQJCL6a+kr0x8dWke543Y0Q2Xp22+s/bBTmF9u9n3+97LDnddpubakHFnuq+/cHlZ5pN7qcK2K//+88jY8oT51tMYg5TPjTLNDsvUC60q+eRe+jSenhXbrrKzSydaG2NlxveW65/Evxb+38Nr/vef1m9ax8HzG0PVVPmUfxVnjJzx5/ou2dDXxeXtx6aHt114v2hDO4Z/IOhzEMf/wLGPnj8ixE6/sUIHf9ihI5/MULHvxih41+M0PEvRuj4FyN0/ItxiIx/DXT4j4KBBWjjkxBAWvn3gJLyT56Bi+Eozu4XgyCDCMN+pL4XULUkQ7OCjMRuBikGDYbT6L0uXgaGgwyiDEZIMpBuF1C5DZIgtNMFVH6BwYvBjYGZgeHLe4Q1jPMUgFIv3/MrvFH4z6cBktVk3Kcgw3DgC0j8K7/Of0aNNWBxkBkvdfg1NRk3MKgzBCDZAe11AeUP6QB16sAMYmBjiGKYAfT7YCj/RsEoGAWjYBSMglEwCkbBKBgFo2AUjAwAAFBLBwjPrZn8jAMAAAAnAABQSwMEFAAIAAgArryIVwAAAAAAAAAAFAEAABcAIABfX01BQ09TWC8uX3RzdGZ0eV9kLmRza1VUDQAHqZpzZamac2VDm3NldXgLAAEE9wEAAAQUAAAAY2AVY2dgYmDwTUxW8A9WiFCAApAYAycQGwHxIyAG8hlFGIgCjiEhQRAWWMcWIE5AU8IEFfdgYOBPzs/VSywoyEnVy01MzoHI/wFiCQYGUYRcYWliUWJeSWZeKgND45nvFxvupTrbTtoTUzFtesd7VgZ0EWLcWahvYGBhaG1mam5smZhoae2cUZSfm2rNAABQSwcI/gICQY8AAAAUAQAAUEsBAhQDFAAIAAgArryIV8+tmfyMAwAAACcAAAwAIAAAAAAAAAAAAKSBAAAAAHRzdGZ0eV9kLmRza1VUDQAHqZpzZamac2Ugm3NldXgLAAEE9wEAAAQUAAAAUEsBAhQDFAAIAAgArryIV/4CAkGPAAAAFAEAABcAIAAAAAAAAAAAAKSB5gMAAF9fTUFDT1NYLy5fdHN0ZnR5X2QuZHNrVVQNAAepmnNlqZpzZUObc2V1eAsAAQT3AQAABBQAAABQSwUGAAAAAAIAAgC/AAAA2gQAAAAA": 'TSTFTY_A.ASC -- {"typeString":"A","start":0,"length":259} -- 10 REM tstfty - Test File Types\n20 PRINT "CPCBasic"\n25 CALL &BB18\n40 SAVE "TSTFTY_A.ASC",A\n50 SAVE "TSTFTY_T.BAS"\n60 SAVE "TSTFTY_P.BAS",P\n70 t$="CPCBasic":FOR i=1 TO LEN(t$):POKE &C000+i-1,ASC(MID$(t$,i,1)):NEXT\n80 SAVE "TSTFTY_B.BIN",B,&C000,LEN(t$)\n90 END\n --- TSTFTY_B.BIN -- {"user":0,"name":"TSTFTY_B","ext":"BIN","typeNumber":2,"start":49152,"pseudoLen":8,"entry":0,"length":8,"typeString":"B"} -- CPCBasic --- TSTFTY_P.BAS -- {"user":0,"name":"TSTFTY_P","ext":"BAS","typeNumber":1,"start":368,"pseudoLen":252,"entry":0,"length":252,"typeString":"P"} -- 10 REM tstfty - Test File Types\n20 PRINT "CPCBasic"\n25 CALL &BB18\n40 SAVE "TSTFTY_A.ASC",A\n50 SAVE "TSTFTY_T.BAS"\n60 SAVE "TSTFTY_P.BAS",P\n70 t$="CPCBasic":FOR i=1 TO LEN(t$):POKE &C000+i-1,ASC(MID$(t$,i,1)):NEXT\n80 SAVE "TSTFTY_B.BIN",B,&C000,LEN(t$)\n90 END\n --- TSTFTY_T.BAS -- {"user":0,"name":"TSTFTY_T","ext":"BAS","typeNumber":0,"start":368,"pseudoLen":252,"entry":0,"length":252,"typeString":"T"} -- 10 REM tstfty - Test File Types\n20 PRINT "CPCBasic"\n25 CALL &BB18\n40 SAVE "TSTFTY_A.ASC",A\n50 SAVE "TSTFTY_T.BAS"\n60 SAVE "TSTFTY_P.BAS",P\n70 t$="CPCBasic":FOR i=1 TO LEN(t$):POKE &C000+i-1,ASC(MID$(t$,i,1)):NEXT\n80 SAVE "TSTFTY_B.BIN",B,&C000,LEN(t$)\n90 END\n'
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
    function createMinimalAmsdosHeader(type, start, length) {
        return {
            typeString: type,
            start: start,
            length: length
        };
    }
    function readFilesFromDiskImage(disk) {
        var result = [], dir = disk.readDirectory(), entries = Object.keys(dir);
        for (var i = 0; i < entries.length; i += 1) {
            var name_1 = entries[i];
            var data = disk.readFile(dir[name_1]);
            if (data) {
                var headerEntry = DiskImage_1.DiskImage.parseAmsdosHeader(data);
                if (headerEntry) {
                    data = data.substring(0x80); // remove header
                    if (headerEntry.typeString === "P") { // protected BASIC?
                        data = DiskImage_1.DiskImage.unOrProtectData(data);
                        data = new BasicTokenizer_1.BasicTokenizer().decode(data);
                    }
                    else if (headerEntry.typeString === "T") { // tokenized BASIC?
                        data = new BasicTokenizer_1.BasicTokenizer().decode(data);
                    }
                }
                else {
                    headerEntry = createMinimalAmsdosHeader("A", 0, data.length);
                }
                var headerString = JSON.stringify(headerEntry);
                result.push(name_1 + " -- " + headerString + " -- " + data);
            }
        }
        return result.join(" --- ");
    }
    function extractFirstFileFromZip(key) {
        var parts = Utils_1.Utils.split2(key, ","), 
        //meta = parts[0],
        compressed = Utils_1.Utils.atob(parts[1]), // decode base64
        zip = new ZipFile_1.ZipFile({
            data: Utils_1.Utils.string2Uint8Array(compressed),
            zipName: "name"
        }), firstFileInZip = Object.keys(zip.getZipDirectory())[0], uncompressed = zip.readData(firstFileInZip);
        return uncompressed;
    }
    QUnit.module("DiskImage: Read files tests", function (hooks) {
        function runTestsFor(category, tests, assert, results) {
            for (var key in tests) {
                if (tests.hasOwnProperty(key)) {
                    /*
                    const parts = Utils.split2(key, ","),
                        //meta = parts[0],
                        compressed = Utils.atob(parts[1]), // decode base64
                        zip = new ZipFile({
                            data: Utils.string2Uint8Array(compressed),
                            zipName: "name"
                        }),
                        firstFileInZip = Object.keys(zip.getZipDirectory())[0],
                        uncompressed = zip.readData(firstFileInZip),
                    */
                    var uncompressed = extractFirstFileFromZip(key), disk = new DiskImage_1.DiskImage({
                        data: uncompressed,
                        diskName: "name",
                        quiet: true
                    }), expected = tests[key];
                    var result = void 0;
                    try {
                        result = readFilesFromDiskImage(disk);
                    }
                    catch (e) {
                        result = String(e);
                        if (result !== expected) { // output in console only if error not expected
                            Utils_1.Utils.console.error(e);
                        }
                    }
                    if (results) {
                        results[category].push(TestHelper_1.TestHelper.stringInQuotes(key) + ": " + TestHelper_1.TestHelper.stringInQuotes(result));
                    }
                    if (assert) {
                        var message = "uncompressed DSK: " + uncompressed.length;
                        assert.strictEqual(result, expected, message);
                    }
                }
            }
        }
        TestHelper_1.TestHelper.generateAllTests(allTests, runTestsFor, hooks);
    });
    function createCodeGeneratorToken() {
        var basicParser = new BasicParser_1.BasicParser({
            quiet: true,
            keepTokens: true,
            keepBrackets: true,
            keepColons: true,
            keepDataComma: true
        }), basicLexer = new BasicLexer_1.BasicLexer({
            keywords: basicParser.getKeywords(),
            keepWhiteSpace: true,
            quiet: true
        });
        return new CodeGeneratorToken_1.CodeGeneratorToken({
            quiet: true,
            lexer: basicLexer,
            parser: basicParser
        });
    }
    /*
    function isTrackEmpty(data: string, index: number, tsize: number) {
        const filler = 0xe5,
            endIndex = (index + tsize) <= data.length ? index + tsize : data.length - index;
        let isEmpty = true;
    
        for (let i = index; i < endIndex; i += 1) {
            if (data.charCodeAt(i) !== filler) {
                isEmpty = false;
                break;
            }
        }
        return isEmpty;
    }
    
    function stripEmptyTracks(data: string) {
        const diskinfoSize = 0x100,
            trackInfoSize = 0x100,
            tsize = trackInfoSize + 9 * 0x200;
        let index = diskinfoSize + trackInfoSize;
    
        while (!isTrackEmpty(data, index, tsize - trackInfoSize) && index < data.length) {
            index += tsize;
        }
        data = data.substring(0, index - trackInfoSize);
    
        return data;
    }
    */
    // check also: https://stackoverflow.com/questions/40031688/javascript-arraybuffer-to-hex
    // https://gist.github.com/taniarascia/7ff2e83577d83b85a421ab36ab2ced84
    // https://gist.github.com/igorgatis/d294fe714a4f523ac3a3
    function fnBin2Hex(bin) {
        //return bin.split("").map(function (s) {
        //	return s.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0");
        //}).join(",");
        var hexList = [], asciiList = [], lineList = [];
        for (var i = 0; i < bin.length; i += 1) {
            var charCode = bin.charCodeAt(i);
            hexList.push(charCode.toString(16).toUpperCase().padStart(2, "0"));
            asciiList.push(charCode >= 0x20 ? bin.charAt(i) : ".");
            if (i % 16 === 15) {
                var addr = (i - 15).toString(16).toUpperCase().padStart(4, "0");
                lineList.push(addr + "  " + hexList.join(" ") + "  " + asciiList.join(""));
                hexList.length = 0;
                asciiList.length = 0;
            }
        }
        if (hexList.length) {
            lineList.push(hexList.join(" ") + "  " + asciiList.join(""));
        }
        return lineList.join("\n");
    }
    /*
    function replaceAndFillRemaining(str: string, search: string) {
        const recordSize = 0x80,
            index1 = str.indexOf(search);
    
        if (index1 < 0) {
            Utils.console.error("replaceAndFillRemaining: Not found: ", search);
            return str;
        }
        const recordPart = str.substring(index1, index1 + search.length),
            record = recordPart + "\xE5".repeat(recordSize - search.length);
    
        str = str.substring(0, index1) + record + str.substring(index1 + recordSize);
        return str;
    }
    
    function prepareExpected(str: string) {
        const search1 = "10 PRINT \"CPCBasic\"\r\n\x1a";
            //search2 = "\x11\x00\x0A\x00\xBF\x20\"CPCBasic\"\x00\x00\x1a";
    
        str = replaceAndFillRemaining(str, search1);
        //str = replaceAndFillRemaining(str, search2);
    
        return str;
    }
    */
    /*
    function prepareExpected(str: string) {
        const recordSize = 0x80,
            index1 = str.indexOf("10 PRINT \"CPCBasic\""),
            index2 = str.indexOf("\x1a", index1),
            partSize = index2 + 1 - index1,
            recordPart = str.substring(index1, index2 + 1),
            record = recordPart + "\xE5".repeat(recordSize - partSize);
    
        str = str.substring(0, index1) + record + str.substring(index1 + recordSize);
    
        return str;
    }
    */
    QUnit.module("DiskImage: Write files tests", function (hooks) {
        function runTestsFor(category, tests, assert, results) {
            for (var key in tests) {
                if (tests.hasOwnProperty(key)) {
                    if (category === "data") {
                        var input = tests[key], fileInfos = input.split(" --- "), diskImage = new DiskImage_1.DiskImage({
                            //diskName: "test",
                            quiet: true,
                            data: ""
                            //creator: "diskinfo" // we set another creator
                        });
                        diskImage.setOptions({
                            diskName: "test",
                            data: diskImage.formatImage("data")
                        });
                        var codeGeneratorToken = createCodeGeneratorToken();
                        for (var i = 0; i < fileInfos.length; i += 1) {
                            var fileInfo = fileInfos[i], 
                            // eslint-disable-next-line array-element-newline
                            _a = fileInfo.split(" -- "), name_2 = _a[0], metaJson = _a[1], data1 = _a[2], 
                            //closeBracketIndex = metaJsonAndData.indexOf("}"),
                            //metaJson = metaJsonAndData.substring(0, closeBracketIndex + 1),
                            headerEntry = JSON.parse(metaJson);
                            var data = data1; //metaJsonAndData.substring(closeBracketIndex + 1);
                            // eslint-disable-next-line max-depth
                            if (headerEntry.typeString === "P") { // protected BASIC?
                                var output = codeGeneratorToken.generate(data);
                                data = output.error ? String(output.error) : output.text;
                                data = DiskImage_1.DiskImage.unOrProtectData(data);
                            }
                            else if (headerEntry.typeString === "T") { // tokenized BASIC?
                                //data = new BasicTokenizer().decode(data);
                                var output2 = codeGeneratorToken.generate(data);
                                data = output2.error ? String(output2.error) : output2.text;
                            }
                            else if (headerEntry.typeString === "B") { // Binary
                                // take it as it is
                            }
                            else if (headerEntry.typeString === "A") { // ASCII
                                // take it as it is
                            }
                            else {
                                Utils_1.Utils.console.error("runTestsFor: Unknon file type:", headerEntry.typeString);
                            }
                            if (headerEntry.typeString !== "A") {
                                if (data.length !== headerEntry.length) {
                                    Utils_1.Utils.console.warn("runTestsFor: " + name_2 + ": Need to adapt length:", data.length);
                                    headerEntry.length = data.length;
                                    headerEntry.pseudoLen = data.length;
                                }
                                var header = DiskImage_1.DiskImage.createAmsdosHeader(headerEntry), headerString = DiskImage_1.DiskImage.combineAmsdosHeader(header);
                                // header.length should be data.length
                                data = headerString + data;
                            }
                            diskImage.writeFile(name_2, data); //TTT
                        }
                        var //diskOptions = diskImage.getOptions(),
                        //imageData = diskOptions.data, // we need the modified disk image with the file(s) inside
                        result = diskImage.stripEmptyTracks(), //stripEmptyTracks(imageData),
                        uncompressed = extractFirstFileFromZip(key), expected = uncompressed;
                        if (results) {
                            results[category].push(TestHelper_1.TestHelper.stringInQuotes(key) + ": " + TestHelper_1.TestHelper.stringInQuotes(result));
                        }
                        if (assert) {
                            var message = category + " DSK";
                            if (Utils_1.Utils.debug > 5) {
                                Utils_1.Utils.console.debug(message + ": result: ", fnBin2Hex(result));
                                Utils_1.Utils.console.debug(message + ": expected: ", fnBin2Hex(expected));
                            }
                            // compare disk images
                            assert.strictEqual(fnBin2Hex(result), fnBin2Hex(expected), message);
                            // read back files anf compare
                            var expected2 = input;
                            var result2 = "";
                            try {
                                result2 = readFilesFromDiskImage(diskImage);
                            }
                            catch (e) {
                                result2 = String(e);
                            }
                            assert.strictEqual(result2, expected2, message);
                        }
                    }
                    else if (assert) {
                        assert.expect(0); //TTT
                    }
                }
            }
        }
        TestHelper_1.TestHelper.generateAllTests(allTests, runTestsFor, hooks);
    });
});
// end
//# sourceMappingURL=DiskImage.qunit.js.map