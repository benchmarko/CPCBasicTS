// CpcVm.qunit.ts - QUnit tests for CPCBasic CpcVm
//
define(["require", "exports", "../Utils", "../CpcVm", "./TestHelper"], function (require, exports, Utils_1, CpcVm_1, TestHelper_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // https://www.cpcwiki.eu/index.php/Locomotive_BASIC
    QUnit.module("CpcVm: Tests", function () {
        var allTests = {
            abs: {
                "-1 ": "1",
                "0 ": "0",
                "1 ": "1",
                "-123.45 ": "123.45",
                "123.45 ": "123.45",
                "": 'CpcVm: Type mismatch in 0: ABS undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Type mismatch in 0: ABS  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
            },
            afterGosub: {
                "0,0,123": '{"_key":"timer0","active":false}',
                "1,0,123": '{"_key":"timer0","active":true,"intervalMs":20,"line":123,"repeat":false}',
                "1,0,1": '{"_key":"timer0","line":1}',
                "1,0,65535": '{"_key":"timer0","line":65535}',
                "32767.4,0,123": '{"_key":"timer0","intervalMs":655340,"line":123}',
                "10,1,123": '{"_key":"timer1","intervalMs":200,"line":123,"repeat":false,"active":true}',
                "10,3.4,123": '{"_key":"timer3","intervalMs":200,"line":123,"repeat":false,"active":true}',
                "": 'CpcVm: Type mismatch in 0: AFTER undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Type mismatch in 0: AFTER  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "-1,0,123": 'CpcVm: Improper argument in 0: AFTER -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "32768,0,123": 'CpcVm: Overflow in 0: AFTER 32768 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "10,-1,123": 'CpcVm: Improper argument in 0: AFTER -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "10,3.9,123": 'CpcVm: Improper argument in 0: AFTER 4 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "0,0,0": 'CpcVm: Improper argument in 0: AFTER GOSUB 0 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "1,0,0": 'CpcVm: Improper argument in 0: AFTER GOSUB 0 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "0,0,65536": 'CpcVm: Improper argument in 0: AFTER GOSUB 65536 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
            },
            asc: {
                '"A"': "65",
                '"Abc"': "65",
                "": 'CpcVm: Type mismatch in 0: ASC undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Improper argument in 0: ASC -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "0 ": 'CpcVm: Type mismatch in 0: ASC 0 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
            },
            atn: {
                "0 ": "0",
                "1 ": "0.7853981633974483"
            },
            atnDeg: {
                "0 ": "0",
                "1 ": "45"
            },
            bin$: {
                "0 ": "0",
                "255 ": "11111111",
                "255,10": "0011111111",
                "170,6": "10101010",
                "32767,16": "0111111111111111",
                "65535 ": "1111111111111111",
                "-1": "1111111111111111",
                "-32768": "1000000000000000",
                "": 'CpcVm: Type mismatch in 0: BIN$ undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Type mismatch in 0: BIN$  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "65536 ": 'CpcVm: Overflow in 0: BIN$ 65536 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "65535,17": 'CpcVm: Improper argument in 0: BIN$ 17 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "-32769": 'CpcVm: Overflow in 0: BIN$ -32769 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
            },
            border: {
                "0 ": "setBorder:0,0",
                "1 ": "setBorder:1,1",
                "0,1": "setBorder:0,1",
                "1,0": "setBorder:1,0",
                "31 ": "setBorder:31,31",
                "": 'CpcVm: Type mismatch in 0: BORDER undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Type mismatch in 0: BORDER  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "-1": 'CpcVm: Improper argument in 0: BORDER -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "32 ": 'CpcVm: Improper argument in 0: BORDER 32 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
            },
            call: {
                "0 ": "",
                "0xbb00": "resetCpcKeysExpansions: , clearInput: , resetExpansionTokens:",
                "0xbb03": "clearInput: , resetExpansionTokens:",
                "0xbb06": "getKeyFromBuffer:",
                "0xbb0c": "putKeyInBuffer:\x00 , getKeyDownHandler:",
                "0xbb0c,1,1,1,1,1,1,1,1,1": "putKeyInBuffer:\x09 , getKeyDownHandler:",
                "0xbb0c,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32": "putKeyInBuffer:  , getKeyDownHandler:",
                "0xbb0c,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33": 'CpcVm: Syntax Error in 0: CALL  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "0xbb18": "getKeyFromBuffer:",
                "0xbb4e": "resetCustomChars:",
                "0xbb51": "",
                "0xbb5a": "",
                "0xbb5a,1,2,3,4,5,6,7,8": '{"_key":"win0","pos":-1}',
                "0xbb5d": 'printChar:0,0,0,1,0,false -- {"_key":"win0","pos":1}',
                "0xbb5d,1,2,3,4,5,6,7,8": 'printChar:8,0,0,1,0,false -- {"_key":"win0","pos":1}',
                "0xbb6c": "clearTextWindow:0,39,0,24,0",
                "0xbb7b": "",
                "0xbb7e": '{"_key":"win0","cursorEnabled":false}',
                "0xbb81": 'drawCursor:0,0,1,0 -- {"_key":"win0","cursorOn":true}',
                "0xbb84": "",
                "0xbb8a": "drawCursor:0,0,1,0",
                "0xbb8d": "drawCursor:0,0,1,0",
                "0xbb90": '{"_key":"win0","pen":0}',
                "0xbb90,1": "",
                "0xbb90,1,2": '{"_key":"win0","pen":2}',
                "0xbb90,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15": '{"_key":"win0","pen":15}',
                "0xbb90,1,2,3,4,5,6,7,8,9,10,11,12,13,14,16": '{"_key":"win0","pen":15}',
                "0xbb96": "",
                "0xbb96,1": '{"_key":"win0","paper":1}',
                "0xbb96,1,2": '{"_key":"win0","paper":2}',
                "0xbb96,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15": '{"_key":"win0","paper":15}',
                "0xbb96,1,2,3,4,5,6,7,8,9,10,11,12,13,14,16": '{"_key":"win0","paper":15}',
                "0xbb9c": '{"_key":"win0","pen":0,"paper":1}',
                "0xbb9f": "",
                "0xbb9f,1": '{"_key":"win0","transparent":true}',
                "0xbb9f,1,2": '{"_key":"win0","transparent":true}',
                "0xbbdb": "clearGraphicsWindow:",
                "0xbbde": "setGPen:0",
                "0xbbde,1": "setGPen:1",
                "0xbbde,1,2": "setGPen:2",
                "0xbbde,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15": "setGPen:15",
                "0xbbde,1,2,3,4,5,6,7,8,9,10,11,12,13,14,16": "setGPen:15",
                "0xbbe4": "setGPaper:0",
                "0xbbe4,1,2": "setGPaper:2",
                "0xbbe4,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15": "setGPaper:15",
                "0xbbe4,1,2,3,4,5,6,7,8,9,10,11,12,13,14,16": "setGPaper:15",
                "0xbbfc": "printGChar:0",
                "0xbbfc,1": "printGChar:1",
                "0xbbfc,1,2": "printGChar:2",
                "0xbbfc,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32": "printGChar:32",
                "0xbbff": "setMode:1 , clearFullWindow: , setDefaultInks: , setSpeedInk:10,10",
                "0xbc02": "setDefaultInks: , setSpeedInk:10,10",
                "0xbc06": 'CpcVm: Type mismatch in 0: screenBase undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "0xbc06,0x40": "getByte:49152 , setByte:16384,0",
                "0xbc06,0xc0": "getByte:16384 , setByte:49152,13",
                "0xbc07": 'CpcVm: Type mismatch in 0: screenBase undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "0xbc07,0x40": "getByte:49152 , setByte:16384,13",
                "0xbc07,0xc0": "getByte:16384 , setByte:49152,13",
                "0xbc0e": 'setMode:0 , clearFullWindow: -- {"_key":"win0","right":19} -- {"_key":"win1","right":19} -- {"_key":"win2","right":19} -- {"_key":"win3","right":19} -- {"_key":"win4","right":19} -- {"_key":"win5","right":19} -- {"_key":"win6","right":19} -- {"_key":"win7","right":19}',
                "0xbc0e,1": "setMode:1 , clearFullWindow:",
                "0xbc0e,1,2": 'setMode:2 , clearFullWindow: -- {"_key":"win0","right":79} -- {"_key":"win1","right":79} -- {"_key":"win2","right":79} -- {"_key":"win3","right":79} -- {"_key":"win4","right":79} -- {"_key":"win5","right":79} -- {"_key":"win6","right":79} -- {"_key":"win7","right":79}',
                "0xbc0e,1,2,3": 'setMode:3 , clearFullWindow: -- {"_key":"win0","right":79,"bottom":49} -- {"_key":"win1","right":79,"bottom":49} -- {"_key":"win2","right":79,"bottom":49} -- {"_key":"win3","right":79,"bottom":49} -- {"_key":"win4","right":79,"bottom":49} -- {"_key":"win5","right":79,"bottom":49} -- {"_key":"win6","right":79,"bottom":49} -- {"_key":"win7","right":79,"bottom":49} -- {"_key":"win8","bottom":49} -- {"_key":"win9","bottom":49}',
                "0xbc0e,1,2,3,4": 'setMode:0 , clearFullWindow: -- {"_key":"win0","right":19} -- {"_key":"win1","right":19} -- {"_key":"win2","right":19} -- {"_key":"win3","right":19} -- {"_key":"win4","right":19} -- {"_key":"win5","right":19} -- {"_key":"win6","right":19} -- {"_key":"win7","right":19}',
                "0xbcac": "",
                "0xbcbc": "",
                "0xbcb9": "",
                "0xbd19": '{"_key":"stop","reason":"waitFrame","priority":40,"paras":{}}',
                "0xbd1c": "getMode: , getByte:49152 , changeMode:0 , setByte:49152,13 , changeMode:1",
                "0xbd1c,1": "getMode:",
                "0xbd1c,1,2": "getMode: , getByte:49152 , changeMode:2 , setByte:49152,13 , changeMode:1",
                "0xbd1c,1,2,3": "getMode: , getByte:49152 , changeMode:3 , setByte:49152,13 , changeMode:1",
                "0xbd1c,1,2,3,4": "getMode: , getByte:49152 , changeMode:0 , setByte:49152,13 , changeMode:1",
                "0xbd3d": "clearInput:",
                "0xbd49": "setMaskFirst:0",
                "0xbd49,1": "setMaskFirst:1",
                "0xbd49,1,2": "setMaskFirst:0",
                "0xbd4c": "setMask:0",
                "0xbd4c,1": "setMask:1",
                "0xbd4c,1,2": "setMask:2",
                "0xbd4c,1,2,3,4,5,6,7,8,9,10,11,12,13": "setMask:13",
                "0xbd52": "fill:0",
                "0xbd52,1": "fill:1",
                "0xbd52,1,2": "fill:2",
                "0xbd52,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15": "fill:15",
                "0xbd52,1,2,3,4,5,6,7,8,9,10,11,12,13,14,16": "fill:15",
                "0xbd5b": "",
                "0xbd5b,1": "",
                "0xbd5b,1,2": "",
                "0xbd5b,1,2,3,4": "",
                "0xbd5b,1,2,3,4,5": "",
                "0xbd5b,1,2,3,4,5,6": "",
                "0xbd5b,1,2,3,4,5,6,7": "",
                "0xbd5b,1,2,3,4,5,6,7,8": "",
                "0xffff": "",
                "-32767": "",
                "0,0": "",
                "0,-128": "",
                "0,-32768": "",
                "": 'CpcVm: Type mismatch in 0: CALL undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Type mismatch in 0: CALL  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "65536 ": 'CpcVm: Overflow in 0: CALL 65536 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "-32769": 'CpcVm: Overflow in 0: CALL -32769 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "0,-32769": 'CpcVm: Overflow in 0: CALL -32769 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "0,65536": 'CpcVm: Overflow in 0: CALL 65536 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
            },
            cat: {
                "": '{"_key":"stop","reason":"fileCat","priority":45,"paras":{"command":"cat","stream":0,"fileMask":"","line":0}}'
            },
            chain: {
                '"file1"': '{"_key":"stop","reason":"fileLoad","priority":90,"paras":{}} -- {"_key":"inFile","open":true,"command":"chain","name":"file1","line":0,"start":0,"fileData":[],"first":0,"last":0,"memorizedExample":""}',
                '"file1",123': '{"_key":"stop","reason":"fileLoad","priority":90,"paras":{}} -- {"_key":"inFile","open":true,"command":"chain","name":"file1","line":123,"start":0,"fileData":[],"first":0,"last":0,"memorizedExample":""}',
                '"file1",0': '{"_key":"stop","reason":"fileLoad","priority":90,"paras":{}} -- {"_key":"inFile","open":true,"command":"chain","name":"file1","line":0,"start":0,"fileData":[],"first":0,"last":0,"memorizedExample":""}',
                '"file1",65535': '{"_key":"stop","reason":"fileLoad","priority":90,"paras":{}} -- {"_key":"inFile","open":true,"command":"chain","name":"file1","line":65535,"start":0,"fileData":[],"first":0,"last":0,"memorizedExample":""}',
                "": 'CpcVm: Type mismatch in 0: CHAIN undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Broken in 0: Bad filename:  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "7 ": 'CpcVm: Type mismatch in 0: CHAIN 7 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '"file1",-1': 'CpcVm: Improper argument in 0: CHAIN -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '"file1",65536': 'CpcVm: Overflow in 0: CHAIN 65536 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
            },
            chainMerge: {
                '"file1"': '{"_key":"stop","reason":"fileLoad","priority":90,"paras":{}} -- {"_key":"inFile","open":true,"command":"chainMerge","name":"file1","line":0,"start":0,"fileData":[],"first":0,"last":0,"memorizedExample":""}',
                '"file1",123': '{"_key":"stop","reason":"fileLoad","priority":90,"paras":{}} -- {"_key":"inFile","open":true,"command":"chainMerge","name":"file1","line":123,"start":0,"fileData":[],"first":0,"last":0,"memorizedExample":""}',
                '"file1",0': '{"_key":"stop","reason":"fileLoad","priority":90,"paras":{}} -- {"_key":"inFile","open":true,"command":"chainMerge","name":"file1","line":0,"start":0,"fileData":[],"first":0,"last":0,"memorizedExample":""}',
                '"file1",123,10': '{"_key":"stop","reason":"fileLoad","priority":90,"paras":{}} -- {"_key":"inFile","open":true,"command":"chainMerge","name":"file1","line":123,"start":0,"fileData":[],"first":10,"last":0,"memorizedExample":""}',
                '"file1",123,10,20': '{"_key":"stop","reason":"fileLoad","priority":90,"paras":{}} -- {"_key":"inFile","open":true,"command":"chainMerge","name":"file1","line":123,"start":0,"fileData":[],"first":10,"last":20,"memorizedExample":""}',
                '"file1",123,,20': '{"_key":"stop","reason":"fileLoad","priority":90,"paras":{}} -- {"_key":"inFile","open":true,"command":"chainMerge","name":"file1","line":123,"start":0,"fileData":[],"first":0,"last":20,"memorizedExample":""}',
                "": 'CpcVm: Type mismatch in 0: CHAIN MERGE undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Broken in 0: Bad filename:  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "7 ": 'CpcVm: Type mismatch in 0: CHAIN MERGE 7 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '"file1",-1': 'CpcVm: Improper argument in 0: CHAIN MERGE -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '"file1",65536': 'CpcVm: Overflow in 0: CHAIN MERGE 65536 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '"file1",0,-1': 'CpcVm: Improper argument in 0: CHAIN MERGE -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}} -- {"_key":"inFile","open":false,"command":"","name":"file1","line":0,"start":0,"fileData":[],"first":0,"last":20,"memorizedExample":""}',
                '"file1",0,65536': 'CpcVm: Improper argument in 0: CHAIN MERGE 65536 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '"file1",0,1,-1': 'CpcVm: Improper argument in 0: CHAIN MERGE -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}} -- {"_key":"inFile","open":false,"command":"","name":"file1","line":0,"start":0,"fileData":[],"first":1,"last":20,"memorizedExample":""}',
                '"file1",0,1,65536': 'CpcVm: Improper argument in 0: CHAIN MERGE 65536 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
            },
            chr$: {
                "0 ": "\x00",
                "65 ": "A",
                "65,66": "A",
                "255 ": "\xff",
                "": 'CpcVm: Type mismatch in 0: CHR$ undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Type mismatch in 0: CHR$  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "-1": 'CpcVm: Improper argument in 0: CHR$ -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "256 ": 'CpcVm: Improper argument in 0: CHR$ 256 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
            },
            cint: {
                "0 ": "0",
                "1.49 ": "1",
                "1.5 ": "2",
                "-1.49 ": "-1",
                "-1.5 ": "-2",
                "": 'CpcVm: Type mismatch in 0: CINT undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Type mismatch in 0: CINT  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "32767.49 ": "32767",
                "32767.5 ": 'CpcVm: Overflow in 0: CINT 32768 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "-32768.49": "-32768",
                "-32768.5": 'CpcVm: Overflow in 0: CINT -32769 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
            },
            clearInput: {
                "": "clearInput:"
            },
            clg: {
                "": "clearGraphicsWindow:",
                "0 ": "setGPaper:0 , clearGraphicsWindow:",
                "15.4 ": "setGPaper:15 , clearGraphicsWindow:",
                '""': 'CpcVm: Type mismatch in 0: CLG  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "-0.6": 'CpcVm: Improper argument in 0: CLG -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "16 ": 'CpcVm: Improper argument in 0: CLG 16 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
            },
            closein: {
                "": '{"_key":"inFile","open":false,"command":"","name":"name1","line":0,"start":0,"fileData":[],"first":0,"last":0,"memorizedExample":""}'
            },
            closeout: {
                '"_testCase1"': "",
                '"_testCase2"': '{"_key":"outFile","open":false,"command":"","name":"name1","line":0,"start":0,"fileData":[],"stream":0,"typeString":"","length":0,"entry":0}',
                '"_testCase3"': '{"_key":"stop","reason":"fileSave","priority":90,"paras":{}} -- {"_key":"outFile","open":true,"command":"closeout","name":"name1","line":0,"start":0,"fileData":["A"],"stream":0,"typeString":"","length":0,"entry":0}'
            },
            cls: {
                "0 ": "clearTextWindow:0,39,0,24,0",
                "6.7 ": "clearTextWindow:0,39,0,24,0",
                "": 'CpcVm: Type mismatch in 0: CLS undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Type mismatch in 0: CLS  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "8 ": 'CpcVm: Improper argument in 0: CLS 8 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
            },
            cont: {
                '"_testCase1"': "",
                '"_testCase2"': 'CpcVm: Cannot CONTinue in 0: CONT -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
            },
            copychr$: {
                "0 ": 'readChar:2,3,1,0 -- A -- {"_key":"win0","pos":2,"vpos":3}',
                "7 ": 'readChar:2,3,1,0 -- A -- {"_key":"win7","pos":2,"vpos":3}',
                "": 'CpcVm: Type mismatch in 0: COPYCHR$ undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}} -- {"_key":"win0","pos":2,"vpos":3}',
                '""': 'CpcVm: Type mismatch in 0: COPYCHR$  -- {"_key":"stop","reason":"error","priority":50,"paras":{}} -- {"_key":"win0","pos":2,"vpos":3}',
                "-1": 'CpcVm: Improper argument in 0: COPYCHR$ -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}} -- {"_key":"win0","pos":2,"vpos":3}',
                "7.9 ": 'CpcVm: Improper argument in 0: COPYCHR$ 8 -- {"_key":"stop","reason":"error","priority":50,"paras":{}} -- {"_key":"win0","pos":2,"vpos":3}'
            },
            cos: {
                "0 ": "1",
                "3.14159265 ": "-1",
                "": 'CpcVm: Type mismatch in 0: COS undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Type mismatch in 0: COS  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
            },
            cosDeg: {
                "0 ": "1",
                "180 ": "-1"
            },
            creal: {
                "0 ": "0",
                "1.49 ": "1.49",
                "-1.5 ": "-1.5",
                "": 'CpcVm: Type mismatch in 0: CREAL undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Type mismatch in 0: CREAL  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
            },
            cursor: {
                "0 ": '{"_key":"win0","pos":2,"vpos":3}',
                "7 ": '{"_key":"win7","pos":2,"vpos":3}',
                "0,1": 'drawCursor:2,3,1,0 -- {"_key":"win0","pos":2,"vpos":3,"cursorOn":true}',
                "0,,1": '{"_key":"win0","pos":2,"vpos":3}',
                "0,1,1": 'drawCursor:2,3,1,0 , drawCursor:2,3,1,0 , drawCursor:2,3,1,0 -- {"_key":"win0","pos":2,"vpos":3,"cursorOn":true}',
                "-1": 'CpcVm: Improper argument in 0: CURSOR -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}} -- {"_key":"win0","pos":2,"vpos":3}',
                "8 ": 'CpcVm: Improper argument in 0: CURSOR 8 -- {"_key":"stop","reason":"error","priority":50,"paras":{}} -- {"_key":"win0","pos":2,"vpos":3}',
                "0,-1": 'CpcVm: Improper argument in 0: CURSOR -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}} -- {"_key":"win0","pos":2,"vpos":3}',
                "0,2": 'CpcVm: Improper argument in 0: CURSOR 2 -- {"_key":"stop","reason":"error","priority":50,"paras":{}} -- {"_key":"win0","pos":2,"vpos":3}',
                "0,,-1": 'CpcVm: Improper argument in 0: CURSOR -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}} -- {"_key":"win0","pos":2,"vpos":3}',
                "0,,2": 'CpcVm: Improper argument in 0: CURSOR 2 -- {"_key":"stop","reason":"error","priority":50,"paras":{}} -- {"_key":"win0","pos":2,"vpos":3}',
                "": 'CpcVm: Type mismatch in 0: CURSOR undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}} -- {"_key":"win0","pos":2,"vpos":3}',
                '""': 'CpcVm: Type mismatch in 0: CURSOR  -- {"_key":"stop","reason":"error","priority":50,"paras":{}} -- {"_key":"win0","pos":2,"vpos":3}',
                '0,""': 'CpcVm: Type mismatch in 0: CURSOR  -- {"_key":"stop","reason":"error","priority":50,"paras":{}} -- {"_key":"win0","pos":2,"vpos":3}',
                '0,,""': 'CpcVm: Type mismatch in 0: CURSOR  -- {"_key":"stop","reason":"error","priority":50,"paras":{}} -- {"_key":"win0","pos":2,"vpos":3}'
            },
            data: {
                "10 ": "",
                '10,"d1",3,"d2"': "",
                "": 'CpcVm: Type mismatch in 0: DATA undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '"",': 'CpcVm: Type mismatch in 0: DATA  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "0 ": 'CpcVm: Improper argument in 0: DATA 0 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "65536 ": 'CpcVm: Improper argument in 0: DATA 65536 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
            },
            dec$: {
                '3,"###.##"': "  3.00",
                '2.9949,"#.##"': "2.99",
                "": 'CpcVm: Type mismatch in 0: DEC$ undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '"",': 'CpcVm: Type mismatch in 0: DEC$  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "3,7 ": 'CpcVm: Type mismatch in 0: DEC$ 7 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
            },
            defint: {
                '"a"': '{"a":"I"}',
                '"b-d"': '{"b":"I","c":"I","d":"I"}',
                '"B-D"': '{"b":"I","c":"I","d":"I"}',
                '"x - z"': '{"x":"I","y":"I","z":"I"}',
                '"aa"': '{"a":"I"}',
                "": 'CpcVm: Type mismatch in 0: DEFINT undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '""': "{}",
                '"b-"': "{}",
                "1 ": 'CpcVm: Type mismatch in 0: DEFINT 1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
            },
            defreal: {
                '"a"': '{"a":"R"}',
                '"b-d"': '{"b":"R","c":"R","d":"R"}',
                '"B-D"': '{"b":"R","c":"R","d":"R"}',
                '"x - z"': '{"x":"R","y":"R","z":"R"}',
                '"aa"': '{"a":"R"}',
                "": 'CpcVm: Type mismatch in 0: DEFREAL undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '""': "{}",
                '"b-"': "{}",
                "1 ": 'CpcVm: Type mismatch in 0: DEFREAL 1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
            },
            defstr: {
                '"a"': '{"a":"$"}',
                '"b-d"': '{"b":"$","c":"$","d":"$"}',
                '"B-D"': '{"b":"$","c":"$","d":"$"}',
                '"x - z"': '{"x":"$","y":"$","z":"$"}',
                '"aa"': '{"a":"$"}',
                '"b-"': "{}",
                '""': "{}",
                "": 'CpcVm: Type mismatch in 0: DEFSTR undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "1 ": 'CpcVm: Type mismatch in 0: DEFSTR 1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
            },
            "delete": {
                "": '{"_key":"stop","reason":"deleteLines","priority":85,"paras":{"command":"DELETE","stream":0,"first":1,"last":65535,"line":0}}',
                "1 ": '{"_key":"stop","reason":"deleteLines","priority":85,"paras":{"command":"DELETE","stream":0,"first":1,"last":1,"line":0}}',
                "65535.2 ": '{"_key":"stop","reason":"deleteLines","priority":85,"paras":{"command":"DELETE","stream":0,"first":65535,"last":65535,"line":0}}',
                "65536 ": 'CpcVm: Overflow in 0: DELETE 65536 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "1,123": '{"_key":"stop","reason":"deleteLines","priority":85,"paras":{"command":"DELETE","stream":0,"first":1,"last":123,"line":0}}',
                ",123": '{"_key":"stop","reason":"deleteLines","priority":85,"paras":{"command":"DELETE","stream":0,"first":1,"last":123,"line":0}}',
                ",65536": 'CpcVm: Overflow in 0: DELETE 65536 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Type mismatch in 0: DELETE  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
            },
            derr: {
                "": "0"
            },
            di: {
                "": ""
            },
            dim: {
                '"abc$A",5': "dimVariable:abc$A,6",
                '"abc$A",5,2': "dimVariable:abc$A,6,3",
                '"aA",0': "dimVariable:aA,1",
                "": 'CpcVm: Type mismatch in 0: DIM undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '""': "dimVariable:,",
                "7,5": 'CpcVm: Type mismatch in 0: DIM 7 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '"aA",-1': 'CpcVm: Improper argument in 0: DIM -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '"aA",32768.2': 'CpcVm: Overflow in 0: DIM 32768 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
            },
            draw: {
                "0,0": "draw:0,0",
                "-32768,0": "draw:-32768,0",
                "32767,0": "draw:32767,0",
                "0,-32768": "draw:0,-32768",
                "0,32767.2": "draw:0,32767",
                "10,20,0": "setGPen:0 , draw:10,20",
                "10,20,0,0": "setGPen:0 , setGColMode:0 , draw:10,20",
                "10,20,,0": "setGColMode:0 , draw:10,20",
                "10,20,15,3": "setGPen:15 , setGColMode:3 , draw:10,20",
                "": 'CpcVm: Type mismatch in 0: DRAW undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Type mismatch in 0: DRAW  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "32768,0": 'CpcVm: Overflow in 0: DRAW 32768 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "-32769,0": 'CpcVm: Overflow in 0: DRAW -32769 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "0,32768": 'CpcVm: Overflow in 0: DRAW 32768 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "0,-32769": 'CpcVm: Overflow in 0: DRAW -32769 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                ",0": 'CpcVm: Type mismatch in 0: DRAW undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "10,20,-1": 'CpcVm: Improper argument in 0: DRAW -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "10,20,16": 'CpcVm: Improper argument in 0: DRAW 16 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "10,20,0,-1": 'setGPen:0 -- CpcVm: Improper argument in 0: DRAW -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "10,20,0,4": 'setGPen:0 -- CpcVm: Improper argument in 0: DRAW 4 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
            },
            drawr: {
                "0,0": "getXpos: , getYpos: , draw:10,20",
                "-32768,0": "getXpos: , getYpos: , draw:-32758,20",
                "32767,0": "getXpos: , getYpos: , draw:32777,20",
                "0,-32768": "getXpos: , getYpos: , draw:10,-32748",
                "0,32767.2": "getXpos: , getYpos: , draw:10,32787",
                "10,20,0": "getXpos: , getYpos: , setGPen:0 , draw:20,40",
                "10,20,0,0": "getXpos: , getYpos: , setGPen:0 , setGColMode:0 , draw:20,40",
                "10,20,,0": "getXpos: , getYpos: , setGColMode:0 , draw:20,40",
                "10,20,15,3": "getXpos: , getYpos: , setGPen:15 , setGColMode:3 , draw:20,40",
                "": 'CpcVm: Type mismatch in 0: DRAWR undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Type mismatch in 0: DRAWR  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "32768,0": 'CpcVm: Overflow in 0: DRAWR 32768 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "-32769,0": 'CpcVm: Overflow in 0: DRAWR -32769 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "0,32768": 'getXpos: -- CpcVm: Overflow in 0: DRAWR 32768 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "0,-32769": 'getXpos: -- CpcVm: Overflow in 0: DRAWR -32769 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                ",0": 'CpcVm: Type mismatch in 0: DRAWR undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "10,20,-1": 'getXpos: , getYpos: -- CpcVm: Improper argument in 0: DRAWR -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "10,20,16": 'getXpos: , getYpos: -- CpcVm: Improper argument in 0: DRAWR 16 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "10,20,0,-1": 'getXpos: , getYpos: , setGPen:0 -- CpcVm: Improper argument in 0: DRAWR -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "10,20,0,4": 'getXpos: , getYpos: , setGPen:0 -- CpcVm: Improper argument in 0: DRAWR 4 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
            },
            edit: {
                "": '{"_key":"stop","reason":"editLine","priority":85,"paras":{"command":"edit","stream":0,"last":0,"line":0}}',
                "123 ": '{"_key":"stop","reason":"editLine","priority":85,"paras":{"command":"edit","stream":0,"first":123,"last":0,"line":0}}'
            },
            ei: {
                "": ""
            },
            end: {
                "": '{"_key":"stop","reason":"stop","priority":60,"paras":{}}',
                '""': '{"_key":"stop","reason":"stop","priority":60,"paras":{}}'
            },
            ent: {
                "1 ": "setToneEnv:1,",
                "-1 ": "setToneEnv:1,",
                "15 ": "setToneEnv:15,",
                "-15 ": "setToneEnv:15,",
                "1,2,3,10": "setToneEnv:1,[object Object]",
                "1,0,-128,0,239,127,255": "setToneEnv:1,[object Object],[object Object]",
                "1,undefined,0,0": "setToneEnv:1,[object Object]",
                "1,,0,0,,4095,255": "setToneEnv:1,[object Object],[object Object]",
                "": 'CpcVm: Type mismatch in 0: ENT undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Type mismatch in 0: ENT  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "0 ": 'CpcVm: Improper argument in 0: ENT 0 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "16 ": 'CpcVm: Improper argument in 0: ENT 16 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "-16 ": 'CpcVm: Improper argument in 0: ENT -16 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "1,-1": 'CpcVm: Improper argument in 0: ENT -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "1,240": 'CpcVm: Improper argument in 0: ENT 240 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "1,0,-129": 'CpcVm: Improper argument in 0: ENT -129 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "1,0,128": 'CpcVm: Improper argument in 0: ENT 128 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "1,0,0,-1": 'CpcVm: Improper argument in 0: ENT -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "1,0,0,256": 'CpcVm: Improper argument in 0: ENT 256 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "1,0,0,0,-1": 'CpcVm: Improper argument in 0: ENT -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "1,,-1,0": 'CpcVm: Improper argument in 0: ENT -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "1,,4096,0": 'CpcVm: Improper argument in 0: ENT 4096 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "1,,0,-1": 'CpcVm: Improper argument in 0: ENT -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "1,,0,256": 'CpcVm: Improper argument in 0: ENT 256 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
            },
            env: {
                "1 ": "setVolEnv:1,",
                "15 ": "setVolEnv:15,",
                "1,2,3,10": "setVolEnv:1,[object Object]",
                "1,0,-128,0,127,127,255": "setVolEnv:1,[object Object],[object Object]",
                "1,undefined,0,0": "setVolEnv:1,[object Object]",
                "1,,0,-32768,,15,65535": "setVolEnv:1,[object Object],[object Object]",
                "": 'CpcVm: Type mismatch in 0: ENV undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Type mismatch in 0: ENV  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "0 ": 'CpcVm: Improper argument in 0: ENV 0 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "-1 ": 'CpcVm: Improper argument in 0: ENV -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "16 ": 'CpcVm: Improper argument in 0: ENV 16 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "1,-1": 'CpcVm: Improper argument in 0: ENV -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "1,128": 'CpcVm: Improper argument in 0: ENV 128 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "1,0,-129": 'CpcVm: Improper argument in 0: ENV -129 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "1,0,128": 'CpcVm: Improper argument in 0: ENV 128 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "1,0,0,-1": 'CpcVm: Improper argument in 0: ENV -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "1,0,0,256": 'CpcVm: Improper argument in 0: ENV 256 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "1,0,0,0,-1": 'CpcVm: Improper argument in 0: ENV -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "1,,-1,0": 'CpcVm: Improper argument in 0: ENV -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "1,,16,0": 'CpcVm: Improper argument in 0: ENV 16 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "1,,0,-32769": 'CpcVm: Overflow in 0: ENV -32769 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "1,,0,65536": 'CpcVm: Overflow in 0: ENV 65536 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
            },
            eof: {
                '"_testCase1"': "-1",
                '"_testCase2"': '-1 -- {"_key":"inFile","open":true,"command":"","name":"","line":0,"start":0,"fileData":[],"first":0,"last":0,"memorizedExample":""}',
                '"_testCase3"': '0 -- {"_key":"inFile","open":true,"command":"","name":"","line":0,"start":0,"fileData":["A"],"first":0,"last":0,"memorizedExample":""}'
            },
            erase: {
                "": ""
            },
            erl: {
                "": "123"
            },
            err: {
                "": "31"
            },
            error: {
                "0 ": 'CpcVm: Improper argument in 0: undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "1 ": 'CpcVm: Unexpected NEXT in 0: undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "3 ": 'CpcVm: Unexpected RETURN in 0: undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "4 ": 'CpcVm: DATA exhausted in 0: undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "5 ": 'CpcVm: Improper argument in 0: undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "6 ": 'CpcVm: Overflow in 0: undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "7 ": 'CpcVm: Memory full in 0: undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "8 ": 'CpcVm: Line does not exist in 0: undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "9 ": 'CpcVm: Subscript out of range in 0: undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "10 ": 'CpcVm: Array already dimensioned in 0: undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "11 ": 'CpcVm: Division by zero in 0: undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "12 ": 'CpcVm: Invalid direct command in 0: undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "13 ": 'CpcVm: Type mismatch in 0: undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "14 ": 'CpcVm: String space full in 0: undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "15 ": 'CpcVm: String too long in 0: undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "16 ": 'CpcVm: String expression too complex in 0: undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "17 ": 'CpcVm: Cannot CONTinue in 0: undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "18 ": 'CpcVm: Unknown user function in 0: undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "19 ": 'CpcVm: RESUME missing in 0: undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "20 ": 'CpcVm: Unexpected RESUME in 0: undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "21 ": 'CpcVm: Direct command found in 0: undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "22 ": 'CpcVm: Operand missing in 0: undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "23 ": 'CpcVm: Line too long in 0: undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "24 ": 'CpcVm: EOF met in 0: undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "25 ": 'CpcVm: File type error in 0: undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "26 ": 'CpcVm: NEXT missing in 0: undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "27 ": 'CpcVm: File already open in 0: undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "28 ": 'CpcVm: Unknown command in 0: undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "29 ": 'CpcVm: WEND missing in 0: undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "30 ": 'CpcVm: Unexpected WEND in 0: undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "31 ": 'CpcVm: File not open in 0: undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "32 ": 'CpcVm: Broken in 0: undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "33 ": 'CpcVm: Unknown error in 0: undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '33,"test1"': 'CpcVm: Unknown error in 0: test1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "": 'CpcVm: Type mismatch in 0: ERROR undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Type mismatch in 0: ERROR  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "-1": 'CpcVm: Improper argument in 0: ERROR -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "256 ": 'CpcVm: Improper argument in 0: ERROR 256 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
            },
            everyGosub: {
                "0,0,123": '{"_key":"timer0","active":false}',
                "1,0,123": '{"_key":"timer0","active":true,"intervalMs":20,"line":123,"repeat":true}',
                "1,0,1": '{"_key":"timer0","line":1}',
                "1,0,65535": '{"_key":"timer0","line":65535}',
                "32767.4,0,123": '{"_key":"timer0","intervalMs":655340,"line":123}',
                "10,1,123": '{"_key":"timer1","intervalMs":200,"line":123,"repeat":true,"active":true}',
                "10,3.4,123": '{"_key":"timer3","intervalMs":200,"line":123,"repeat":true,"active":true}',
                "": 'CpcVm: Type mismatch in 0: EVERY undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Type mismatch in 0: EVERY  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "-1,0,123": 'CpcVm: Improper argument in 0: EVERY -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "32768,0,123": 'CpcVm: Overflow in 0: EVERY 32768 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "10,-1,123": 'CpcVm: Improper argument in 0: EVERY -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "10,3.9,123": 'CpcVm: Improper argument in 0: EVERY 4 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "0,0,0": 'CpcVm: Improper argument in 0: EVERY GOSUB 0 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "1,0,0": 'CpcVm: Improper argument in 0: EVERY GOSUB 0 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "0,0,65536": 'CpcVm: Improper argument in 0: EVERY GOSUB 65536 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
            },
            exp: {
                "0 ": "1",
                "": 'CpcVm: Type mismatch in 0: EXP undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Type mismatch in 0: EXP  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
            },
            fill: {
                "0 ": "fill:0",
                "15.4 ": "fill:15",
                "": 'CpcVm: Type mismatch in 0: FILL undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Type mismatch in 0: FILL  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "-1": 'CpcVm: Improper argument in 0: FILL -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "16 ": 'CpcVm: Improper argument in 0: FILL 16 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
            },
            fix: {
                "0 ": "0",
                "2.77 ": "2",
                "-2.3": "-2",
                "123.466 ": "123",
                "": 'CpcVm: Type mismatch in 0: FIX undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Type mismatch in 0: FIX  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
            },
            frame: {
                "": '{"_key":"stop","reason":"waitFrame","priority":40,"paras":{}}'
            },
            fre: {
                '"_testCase1",0': "42747",
                '"_testCase2",""': "370",
                '"_testCase1"': 'CpcVm: Syntax Error in 0: FRE -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '"_testCase2"': 'CpcVm: Syntax Error in 0: FRE -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
            },
            gosub: {
                "10,123 ": "123",
                '"10s1", 123': "123",
                "10,1": "1",
                "10,65535": "65535",
                "": 'CpcVm: Type mismatch in 65535: GOSUB undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Type mismatch in 65535: GOSUB undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '"s1",0': 'CpcVm: Improper argument in 65535: GOSUB 0 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '"s1",65536': 'CpcVm: Improper argument in 65535: GOSUB 65536 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
            },
            "goto": {
                "123 ": "123",
                '"123"': "123",
                '"10s1"': "10s1",
                "": "undefined",
                '""': ""
            },
            graphicsPaper: {
                "0 ": "setGPaper:0",
                "15.4 ": "setGPaper:15",
                "": 'CpcVm: Type mismatch in 0: GRAPHICS PAPER undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Type mismatch in 0: GRAPHICS PAPER  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "-0.6": 'CpcVm: Improper argument in 0: GRAPHICS PAPER -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "16 ": 'CpcVm: Improper argument in 0: GRAPHICS PAPER 16 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
            },
            graphicsPen: {
                "0 ": "setGPen:0",
                "15.4 ": "setGPen:15",
                "0,0": "setGPen:0 , setGTransparentMode:false",
                "0,1": "setGPen:0 , setGTransparentMode:true",
                ",1": "setGTransparentMode:true",
                "": 'CpcVm: Operand missing in 0: GRAPHICS PEN -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                ",": 'CpcVm: Operand missing in 0: GRAPHICS PEN -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Type mismatch in 0: GRAPHICS PEN  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "-0.6": 'CpcVm: Improper argument in 0: GRAPHICS PEN -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "16 ": 'CpcVm: Improper argument in 0: GRAPHICS PEN 16 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
            },
            hex$: {
                "0 ": "0",
                "255 ": "FF",
                "255,10": "00000000FF",
                "170,6": "0000AA",
                "32767,16": "0000000000007FFF",
                "65535 ": "FFFF",
                "-1": "FFFF",
                "-32768": "8000",
                "": 'CpcVm: Type mismatch in 0: HEX$ undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Type mismatch in 0: HEX$  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "65536 ": 'CpcVm: Overflow in 0: HEX$ 65536 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "65535,17": 'CpcVm: Improper argument in 0: HEX$ 17 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "-32769": 'CpcVm: Overflow in 0: HEX$ -32769 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
            },
            himem: {
                '"_testCase1"': "42747",
                '"_testCase2"': "370"
            },
            ink: {
                "0,1 ": "setInk:0,1,1",
                "15.4,1 ": "setInk:15,1,1",
                "1,0": "setInk:1,0,0",
                "1,31": "setInk:1,31,31",
                "0,1,2": "setInk:0,1,2",
                "0,1,0": "setInk:0,1,0",
                "0,31,31": "setInk:0,31,31",
                "": 'CpcVm: Type mismatch in 0: INK undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Type mismatch in 0: INK  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "-1,0": 'CpcVm: Improper argument in 0: INK -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "16,0": 'CpcVm: Improper argument in 0: INK 16 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "0,-1": 'CpcVm: Improper argument in 0: INK -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "0,32": 'CpcVm: Improper argument in 0: INK 32 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "0,0,-1": 'CpcVm: Improper argument in 0: INK -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "0,0,32": 'CpcVm: Improper argument in 0: INK 32 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
            },
            inkey: {
                "0 ": "getKeyState:0 -- -1",
                "79.2 ": "getKeyState:79 -- 13",
                "": 'CpcVm: Type mismatch in 0: INKEY undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Type mismatch in 0: INKEY  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "-1": 'CpcVm: Improper argument in 0: INKEY -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "80 ": 'CpcVm: Improper argument in 0: INKEY 80 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
            },
            inkey$: {
                "": "getKeyFromBuffer: -- A"
            },
            inp: {
                "0 ": "255",
                "255 ": "255",
                "32767.2 ": "255",
                "65535 ": "255",
                "-1": "255",
                "-32768": "255",
                "": 'CpcVm: Type mismatch in 0: INP undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Type mismatch in 0: INP  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "65536 ": 'CpcVm: Overflow in 0: INP 65536 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "-32769": 'CpcVm: Overflow in 0: INP -32769 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
            },
            input: {
                "0 ": 'printChar:117,0,0,1,0,false , printChar:110,1,0,1,0,false , printChar:100,2,0,1,0,false , printChar:101,3,0,1,0,false , printChar:102,4,0,1,0,false , printChar:105,5,0,1,0,false , printChar:110,6,0,1,0,false , printChar:101,7,0,1,0,false , printChar:100,8,0,1,0,false , drawCursor:9,0,1,0 -- {"_key":"stop","reason":"waitInput","priority":45,"paras":{"command":"input","stream":0,"types":[],"input":"","line":0}} -- {"_key":"win0","pos":9,"cursorOn":true}',
                "7 ": 'printChar:117,0,0,1,0,false , printChar:110,1,0,1,0,false , printChar:100,2,0,1,0,false , printChar:101,3,0,1,0,false , printChar:102,4,0,1,0,false , printChar:105,5,0,1,0,false , printChar:110,6,0,1,0,false , printChar:101,7,0,1,0,false , printChar:100,8,0,1,0,false , drawCursor:9,0,1,0 -- {"_key":"stop","reason":"waitInput","priority":45,"paras":{"command":"input","stream":7,"types":[],"input":"","line":0}} -- {"_key":"win7","pos":9,"cursorOn":true}',
                "8 ": "",
                '0,undefined,"msg","a$"': 'printChar:109,0,0,1,0,false , printChar:115,1,0,1,0,false , printChar:103,2,0,1,0,false , drawCursor:3,0,1,0 -- {"_key":"stop","reason":"waitInput","priority":45,"paras":{"command":"input","stream":0,"message":"msg","noCRLF":null,"types":["a$"],"input":"","line":0}} -- {"_key":"win0","pos":3,"cursorOn":true}',
                '0,";","msg","a$"': 'printChar:109,0,0,1,0,false , printChar:115,1,0,1,0,false , printChar:103,2,0,1,0,false , drawCursor:3,0,1,0 -- {"_key":"stop","reason":"waitInput","priority":45,"paras":{"command":"input","stream":0,"message":"msg","noCRLF":";","types":["a$"],"input":"","line":0}} -- {"_key":"win0","pos":3,"cursorOn":true}',
                '0,";","msg","a$","b"': 'printChar:109,0,0,1,0,false , printChar:115,1,0,1,0,false , printChar:103,2,0,1,0,false , drawCursor:3,0,1,0 -- {"_key":"stop","reason":"waitInput","priority":45,"paras":{"command":"input","stream":0,"message":"msg","noCRLF":";","types":["a$","b"],"input":"","line":0}} -- {"_key":"win0","pos":3,"cursorOn":true}',
                "": 'CpcVm: Type mismatch in 0: INPUT undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Type mismatch in 0: INPUT  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "-1": 'CpcVm: Improper argument in 0: INPUT -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "10 ": 'CpcVm: Improper argument in 0: INPUT 10 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "9 ": 'CpcVm: File not open in 0: INPUT #9 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
            },
            instr: {
                '"",""': "1",
                '1"",""': 'CpcVm: Improper argument in 0: INSTR 0 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '"abba","a"': "1",
                '1,"abba","a"': "1",
                '2,"abba","a"': "4",
                '4,"abba","a"': "4",
                '5,"abba","a"': "0",
                "": 'CpcVm: Type mismatch in 0: INSTR undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Type mismatch in 0: INSTR undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '0,"abba","a"': 'CpcVm: Improper argument in 0: INSTR 0 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "-1": 'CpcVm: Type mismatch in 0: INSTR undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "256 ": 'CpcVm: Type mismatch in 0: INSTR undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "0,0": 'CpcVm: Type mismatch in 0: INSTR 0 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
            },
            "int": {
                "0 ": "0",
                "1 ": "1",
                "2.7 ": "2",
                "-2.3": "-3",
                "": 'CpcVm: Type mismatch in 0: INT undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '"0"': 'CpcVm: Type mismatch in 0: INT 0 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
            },
            joy: {
                "0 ": "getJoyState:0 -- 4",
                "1 ": "getJoyState:1 -- 5",
                "": 'CpcVm: Type mismatch in 0: JOY undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Type mismatch in 0: JOY  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "-1": 'CpcVm: Improper argument in 0: JOY -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "2 ": 'CpcVm: Improper argument in 0: JOY 2 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
            },
            key: {
                '0,"test"': "setExpansionToken:0,test",
                '31.2,"test"': "setExpansionToken:31,test",
                '128,"test"': "setExpansionToken:0,test",
                '159,"test"': "setExpansionToken:31,test",
                '-1,"test"': 'CpcVm: Improper argument in 0: KEY -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '32.2,"test"': 'CpcVm: Improper argument in 0: KEY 32 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '127,"test"': 'CpcVm: Improper argument in 0: KEY 127 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '160,"test"': 'CpcVm: Improper argument in 0: KEY 160 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "0,0": 'CpcVm: Type mismatch in 0: KEY 0 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "": 'CpcVm: Type mismatch in 0: KEY undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Type mismatch in 0: KEY  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
            },
            keyDef: {
                "0,0": "setCpcKeyExpansion:[object Object]",
                "79.2,0": "setCpcKeyExpansion:[object Object]",
                "0,1": "setCpcKeyExpansion:[object Object]",
                "0,1,0": "setCpcKeyExpansion:[object Object]",
                "0,1,255": "setCpcKeyExpansion:[object Object]",
                "0,1,0,0": "setCpcKeyExpansion:[object Object]",
                "0,1,0,255": "setCpcKeyExpansion:[object Object]",
                "0,1,0,0,0": "setCpcKeyExpansion:[object Object]",
                "0,1,0,0,255": "setCpcKeyExpansion:[object Object]",
                "0,1,,0": "setCpcKeyExpansion:[object Object]",
                "0,1,,,0": "setCpcKeyExpansion:[object Object]",
                "": 'CpcVm: Type mismatch in 0: KEY DEF undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Type mismatch in 0: KEY DEF  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "0 ": 'CpcVm: Type mismatch in 0: KEY DEF undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "-1,0": 'CpcVm: Improper argument in 0: KEY DEF -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "80,0": 'CpcVm: Improper argument in 0: KEY DEF 80 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "0,-1": 'CpcVm: Improper argument in 0: KEY DEF -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "0,2": 'CpcVm: Improper argument in 0: KEY DEF 2 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "0,1,-1": 'CpcVm: Improper argument in 0: KEY DEF -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "0,1,256": 'CpcVm: Improper argument in 0: KEY DEF 256 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "0,1,0,-1": 'CpcVm: Improper argument in 0: KEY DEF -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "0,1,0,256": 'CpcVm: Improper argument in 0: KEY DEF 256 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "0,1,0,0,-1": 'CpcVm: Improper argument in 0: KEY DEF -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "0,1,0,0,256": 'CpcVm: Improper argument in 0: KEY DEF 256 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
            },
            left$: {
                '"abc",1': "a",
                "": 'CpcVm: Type mismatch in 0: LEFT$ undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Type mismatch in 0: LEFT$ undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '"abc",-1': 'CpcVm: Improper argument in 0: LEFT$ -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '"abc",256': 'CpcVm: Improper argument in 0: LEFT$ 256 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "0,1": 'CpcVm: Type mismatch in 0: LEFT$ 0 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
            },
            len: {
                '""': "0",
                '"a"': "1",
                '"abc"': "3",
                "": 'CpcVm: Type mismatch in 0: LEN undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "0 ": 'CpcVm: Type mismatch in 0: LEN 0 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
            },
            lineInput: {
                '0,undefined,"msg","a$"': 'printChar:109,0,0,1,0,false , printChar:115,1,0,1,0,false , printChar:103,2,0,1,0,false , drawCursor:3,0,1,0 -- {"_key":"stop","reason":"waitInput","priority":45,"paras":{"command":"lineinput","stream":0,"message":"msg","noCRLF":null,"input":"","line":0}} -- {"_key":"win0","pos":3,"cursorOn":true}',
                '7,undefined,"msg","a$"': 'printChar:109,0,0,1,0,false , printChar:115,1,0,1,0,false , printChar:103,2,0,1,0,false , drawCursor:3,0,1,0 -- {"_key":"stop","reason":"waitInput","priority":45,"paras":{"command":"lineinput","stream":7,"message":"msg","noCRLF":null,"input":"","line":0}} -- {"_key":"win7","pos":3,"cursorOn":true}',
                "8 ": "",
                '0,";","msg","a$"': 'printChar:109,0,0,1,0,false , printChar:115,1,0,1,0,false , printChar:103,2,0,1,0,false , drawCursor:3,0,1,0 -- {"_key":"stop","reason":"waitInput","priority":45,"paras":{"command":"lineinput","stream":0,"message":"msg","noCRLF":";","input":"","line":0}} -- {"_key":"win0","pos":3,"cursorOn":true}',
                '0,";","msg","a$","b"': 'printChar:109,0,0,1,0,false , printChar:115,1,0,1,0,false , printChar:103,2,0,1,0,false , drawCursor:3,0,1,0 -- {"_key":"stop","reason":"waitInput","priority":45,"paras":{"command":"lineinput","stream":0,"message":"msg","noCRLF":";","input":"","line":0}} -- {"_key":"win0","pos":3,"cursorOn":true}',
                "": 'CpcVm: Type mismatch in 0: LINE INPUT undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Type mismatch in 0: LINE INPUT  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '-1,undefined,"msg","a$"': 'CpcVm: Improper argument in 0: LINE INPUT -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '10 ,undefined,"msg","a$"': 'CpcVm: Improper argument in 0: LINE INPUT 10 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '9,undefined,"msg","a$"': 'CpcVm: File not open in 0: LINE INPUT #9 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
            },
            list: {
                "0 ": '{"_key":"stop","reason":"list","priority":90,"paras":{"command":"list","stream":0,"first":1,"last":65535,"line":0}}',
                "7 ": '{"_key":"stop","reason":"list","priority":90,"paras":{"command":"list","stream":7,"first":1,"last":65535,"line":0}}',
                "8 ": '{"_key":"stop","reason":"list","priority":90,"paras":{"command":"list","stream":8,"first":1,"last":65535,"line":0}}',
                "9 ": 'CpcVm: File not open in 0: LIST #9 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "0,1": '{"_key":"stop","reason":"list","priority":90,"paras":{"command":"list","stream":0,"first":1,"last":1,"line":0}}',
                "0,65535": '{"_key":"stop","reason":"list","priority":90,"paras":{"command":"list","stream":0,"first":65535,"last":65535,"line":0}}',
                "0,1,1": '{"_key":"stop","reason":"list","priority":90,"paras":{"command":"list","stream":0,"first":1,"last":1,"line":0}}',
                "0,1,65535": '{"_key":"stop","reason":"list","priority":90,"paras":{"command":"list","stream":0,"first":1,"last":65535,"line":0}}',
                "": 'CpcVm: Type mismatch in 0: LIST undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Type mismatch in 0: LIST  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "-1": 'CpcVm: Improper argument in 0: LIST -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "10 ": 'CpcVm: Improper argument in 0: LIST 10 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "0,-1": 'CpcVm: Improper argument in 0: LIST -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "0,65536": 'CpcVm: Overflow in 0: LIST 65536 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "0,1,-1": 'CpcVm: Improper argument in 0: LIST -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "0,1,65536": 'CpcVm: Overflow in 0: LIST 65536 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
            },
            load: {
                '"file1"': '{"_key":"stop","reason":"fileLoad","priority":90,"paras":{}} -- {"_key":"inFile","open":true,"command":"load","name":"file1","line":0,"fileData":[],"first":0,"last":0,"memorizedExample":""}',
                '"file1",123': '{"_key":"stop","reason":"fileLoad","priority":90,"paras":{}} -- {"_key":"inFile","open":true,"command":"load","name":"file1","line":0,"start":123,"fileData":[],"first":0,"last":0,"memorizedExample":""}',
                '"file1",-32768': '{"_key":"stop","reason":"fileLoad","priority":90,"paras":{}} -- {"_key":"inFile","open":true,"command":"load","name":"file1","line":0,"start":32768,"fileData":[],"first":0,"last":0,"memorizedExample":""}',
                '"file1",65535': '{"_key":"stop","reason":"fileLoad","priority":90,"paras":{}} -- {"_key":"inFile","open":true,"command":"load","name":"file1","line":0,"start":65535,"fileData":[],"first":0,"last":0,"memorizedExample":""}',
                "": 'CpcVm: Type mismatch in 0: LOAD undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Broken in 0: Bad filename:  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "7 ": 'CpcVm: Type mismatch in 0: LOAD 7 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '"file1",-32769': 'CpcVm: Overflow in 0: LOAD -32769 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '"file1",65536': 'CpcVm: Overflow in 0: LOAD 65536 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
            },
            locate: {
                "0,1,1": "1,1",
                "7,1,1": "1,1",
                "0,255,1": '1,2 -- {"_key":"win0","pos":254}',
                "0,1,255": '1,25 -- {"_key":"win0","vpos":254}',
                "": 'CpcVm: Type mismatch in 0: LOCATE undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Type mismatch in 0: LOCATE  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "-1,1,1": 'CpcVm: Improper argument in 0: LOCATE -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "8,1,1": 'CpcVm: Improper argument in 0: LOCATE 8 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "0,0,1": 'CpcVm: Improper argument in 0: LOCATE 0 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "0,256,1": 'CpcVm: Improper argument in 0: LOCATE 256 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "0,1,0": 'CpcVm: Improper argument in 0: LOCATE 0 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "0,1,256": 'CpcVm: Improper argument in 0: LOCATE 256 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
            },
            log: {
                "1 ": "0",
                "": 'CpcVm: Type mismatch in 0: LOG undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Type mismatch in 0: LOG  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "0 ": 'CpcVm: Overflow in 0: LOG 0 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "-1": 'CpcVm: Overflow in 0: LOG -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
            },
            log10: {
                "1 ": "0",
                "100000 ": "5",
                "": 'CpcVm: Type mismatch in 0: LOG10 undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Type mismatch in 0: LOG10  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "0 ": 'CpcVm: Overflow in 0: LOG10 0 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "-1": 'CpcVm: Overflow in 0: LOG10 -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
            },
            lower$: {
                '""': "",
                '"A"': "a",
                '"ABCDEFGHKKLMNOPQRSTUVWXYZ"': "abcdefghkklmnopqrstuvwxyz",
                '" !"#$%&\'()*+ -./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~\x7f\x80\x81\x82\x83\x84\x85\x86\x87\x88\x89\x8a\x8b\x8c\x8d\x8e\x8f\x90\x91\x92\x93\x94\x95\x96\x97\x98\x99\x9a\x9b\x9c\x9d\x9e\x9f\xa0\xa1\xa2\xa3\xa4\xa5\xa6\xa7\xa8\xa9\xaa\xab\xac\xad\xae\xaf\xb0\xb1\xb2\xb3\xb4\xb5\xb6\xb7\xb8\xb9\xba\xbb\xbc\xbd\xbe\xbf\xc0\xc1\xc2\xc3\xc4\xc5\xc6\xc7\xc8\xc9\xca\xcb\xcc\xcd\xce\xcf\xd0\xd1\xd2\xd3\xd4\xd5\xd6\xd7\xd8\xd9\xda\xdb\xdc\xdd\xde\xdf\xe0\xe1\xe2\xe3\xe4\xe5\xe6\xe7\xe8\xe9\xea\xeb\xec\xed\xee\xef\xf0\xf1\xf2\xf3\xf4\xf5\xf6\xf7\xf8\xf9\xfa\xfb\xfc\xfd\xfe\xff"': " !\"#$%&'()*+ -./0123456789:;<=>?@abcdefghijklmnopqrstuvwxyz[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~\x7f\x80\x81\x82\x83\x84\x85\x86\x87\x88\x89\x8a\x8b\x8c\x8d\x8e\x8f\x90\x91\x92\x93\x94\x95\x96\x97\x98\x99\x9a\x9b\x9c\x9d\x9e\x9f\xa0\xa1\xa2\xa3\xa4\xa5\xa6\xa7\xa8\xa9\xaa\xab\xac\xad\xae\xaf\xb0\xb1\xb2\xb3\xb4\xb5\xb6\xb7\xb8\xb9\xba\xbb\xbc\xbd\xbe\xbf\xc0\xc1\xc2\xc3\xc4\xc5\xc6\xc7\xc8\xc9\xca\xcb\xcc\xcd\xce\xcf\xd0\xd1\xd2\xd3\xd4\xd5\xd6\xd7\xd8\xd9\xda\xdb\xdc\xdd\xde\xdf\xe0\xe1\xe2\xe3\xe4\xe5\xe6\xe7\xe8\xe9\xea\xeb\xec\xed\xee\xef\xf0\xf1\xf2\xf3\xf4\xf5\xf6\xf7\xf8\xf9\xfa\xfb\xfc\xfd\xfe\xff",
                "": 'CpcVm: Type mismatch in 0: LOWER$ undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "0 ": 'CpcVm: Type mismatch in 0: LOWER$ 0 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
            },
            mask: {
                "0 ": "setMask:0",
                "255 ": "setMask:255",
                "0,0": "setMask:0 , setMaskFirst:0",
                "0,1": "setMask:0 , setMaskFirst:1",
                ",0": "setMaskFirst:0",
                ",1.4": "setMaskFirst:1",
                "": 'CpcVm: Operand missing in 0: MASK -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Type mismatch in 0: MASK  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                ",": 'CpcVm: Operand missing in 0: MASK -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "-1": 'CpcVm: Improper argument in 0: MASK -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "256 ": 'CpcVm: Improper argument in 0: MASK 256 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                ",-1": 'CpcVm: Improper argument in 0: MASK -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                ",2": 'CpcVm: Improper argument in 0: MASK 2 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
            },
            max: {
                "0 ": "0",
                "0,4": "4",
                "-3.2,3.1,2.3": "3.1",
                '""': "",
                '"4"': "4",
                '"test"': "test",
                "": 'CpcVm: Operand missing in 0: MAX -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '0,"7"': 'CpcVm: Type mismatch in 0: MAX 7 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
            },
            memory: {
                "0 ": 'CpcVm: Memory full in 0: MEMORY 0 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "370 ": "370",
                "32767.2 ": "32767",
                "-32768": "32768",
                "65535 ": 'CpcVm: Memory full in 0: MEMORY 65535 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "-1": 'CpcVm: Memory full in 0: MEMORY 65535 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "": 'CpcVm: Type mismatch in 0: MEMORY undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Type mismatch in 0: MEMORY  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "65536 ": 'CpcVm: Overflow in 0: MEMORY 65536 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "-32769": 'CpcVm: Overflow in 0: MEMORY -32769 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
            },
            merge: {
                '"file1"': '{"_key":"stop","reason":"fileLoad","priority":90,"paras":{}} -- {"_key":"inFile","open":true,"command":"merge","name":"file1","line":0,"start":0,"fileData":[],"first":0,"last":0,"memorizedExample":""}',
                "": 'CpcVm: Type mismatch in 0: MERGE undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Broken in 0: Bad filename:  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "7 ": 'CpcVm: Type mismatch in 0: MERGE 7 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
            },
            mid$: {
                '"abc",2': "bc",
                '"abc",1': "abc",
                '"abc",255': "",
                '"abc",2,0': "",
                '"abc",2,1': "b",
                '"abc",2,3': "bc",
                "": 'CpcVm: Type mismatch in 0: MID$ undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Type mismatch in 0: MID$ undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '"abc",0': 'CpcVm: Improper argument in 0: MID$ 0 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '"abc",-0.9': 'CpcVm: Improper argument in 0: MID$ -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '"abc",256': 'CpcVm: Improper argument in 0: MID$ 256 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '"abc",1,-1': 'CpcVm: Improper argument in 0: MID$ -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '"abc",1,256': 'CpcVm: Improper argument in 0: MID$ 256 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "0,1": 'CpcVm: Type mismatch in 0: MID$ 0 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
            },
            mid$Assign: {
                '"abc",2,2,"XY"': "aXY",
                '"abc",2,,"XY"': "aXY",
                '"abc",2,1,"X"': "aXc",
                '"abc",2,2,"X"': "aXc",
                '"abc",2,1,"XY"': "aXc",
                '"abc",1,,"XY"': "XYc",
                "": 'CpcVm: Type mismatch in 0: MID$ undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Type mismatch in 0: MID$ undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '"abc",0,,"x"': 'CpcVm: Improper argument in 0: MID$ 0 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '"abc",-0.9,,"x"': 'CpcVm: Improper argument in 0: MID$ -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '"abc",256,,"x"': 'CpcVm: Improper argument in 0: MID$ 256 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '"abc",1,-1,"x"': 'CpcVm: Improper argument in 0: MID$ -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '"abc",1,256,"x"': 'CpcVm: Improper argument in 0: MID$ 256 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '0,1,,"x"': 'CpcVm: Type mismatch in 0: MID$ 0 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '"a",1,,1': 'CpcVm: Type mismatch in 0: MID$ 1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
            },
            min: {
                "0 ": "0",
                "0,4": "0",
                "-3.2,3.1,2.3": "-3.2",
                '""': "",
                '"4"': "4",
                '"test"': "test",
                "": 'CpcVm: Operand missing in 0: MIN -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '0,"7"': 'CpcVm: Type mismatch in 0: MIN 7 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
            },
            mode: {
                "0 ": 'setMode:0 , clearFullWindow: -- {"_key":"win0","right":19} -- {"_key":"win1","right":19} -- {"_key":"win2","right":19} -- {"_key":"win3","right":19} -- {"_key":"win4","right":19} -- {"_key":"win5","right":19} -- {"_key":"win6","right":19} -- {"_key":"win7","right":19}',
                "1 ": "setMode:1 , clearFullWindow:",
                "2 ": 'setMode:2 , clearFullWindow: -- {"_key":"win0","right":79} -- {"_key":"win1","right":79} -- {"_key":"win2","right":79} -- {"_key":"win3","right":79} -- {"_key":"win4","right":79} -- {"_key":"win5","right":79} -- {"_key":"win6","right":79} -- {"_key":"win7","right":79}',
                "3.4 ": 'setMode:3 , clearFullWindow: -- {"_key":"win0","right":79,"bottom":49} -- {"_key":"win1","right":79,"bottom":49} -- {"_key":"win2","right":79,"bottom":49} -- {"_key":"win3","right":79,"bottom":49} -- {"_key":"win4","right":79,"bottom":49} -- {"_key":"win5","right":79,"bottom":49} -- {"_key":"win6","right":79,"bottom":49} -- {"_key":"win7","right":79,"bottom":49} -- {"_key":"win8","bottom":49} -- {"_key":"win9","bottom":49}',
                "": 'CpcVm: Type mismatch in 0: MODE undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Type mismatch in 0: MODE  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "4 ": 'CpcVm: Improper argument in 0: MODE 4 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "-1": 'CpcVm: Improper argument in 0: MODE -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
            },
            move: {
                "0,0": "move:0,0",
                "-32768,0": "move:-32768,0",
                "32767,0": "move:32767,0",
                "0,-32768": "move:0,-32768",
                "0,32767.2": "move:0,32767",
                "10,20,0": "setGPen:0 , move:10,20",
                "10,20,0,0": "setGPen:0 , setGColMode:0 , move:10,20",
                "10,20,,0": "setGColMode:0 , move:10,20",
                "10,20,15,3": "setGPen:15 , setGColMode:3 , move:10,20",
                "": 'CpcVm: Type mismatch in 0: MOVE undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Type mismatch in 0: MOVE  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "32768,0": 'CpcVm: Overflow in 0: MOVE 32768 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "-32769,0": 'CpcVm: Overflow in 0: MOVE -32769 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "0,32768": 'CpcVm: Overflow in 0: MOVE 32768 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "0,-32769": 'CpcVm: Overflow in 0: MOVE -32769 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                ",0": 'CpcVm: Type mismatch in 0: MOVE undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "10,20,-1": 'CpcVm: Improper argument in 0: MOVE -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "10,20,16": 'CpcVm: Improper argument in 0: MOVE 16 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "10,20,0,-1": 'setGPen:0 -- CpcVm: Improper argument in 0: MOVE -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "10,20,0,4": 'setGPen:0 -- CpcVm: Improper argument in 0: MOVE 4 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
            },
            mover: {
                "0,0": "getXpos: , getYpos: , move:10,20",
                "-32768,0": "getXpos: , getYpos: , move:-32758,20",
                "32767,0": "getXpos: , getYpos: , move:32777,20",
                "0,-32768": "getXpos: , getYpos: , move:10,-32748",
                "0,32767.2": "getXpos: , getYpos: , move:10,32787",
                "10,20,0": "getXpos: , getYpos: , setGPen:0 , move:20,40",
                "10,20,0,0": "getXpos: , getYpos: , setGPen:0 , setGColMode:0 , move:20,40",
                "10,20,,0": "getXpos: , getYpos: , setGColMode:0 , move:20,40",
                "10,20,15,3": "getXpos: , getYpos: , setGPen:15 , setGColMode:3 , move:20,40",
                "": 'CpcVm: Type mismatch in 0: MOVER undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Type mismatch in 0: MOVER  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "32768,0": 'CpcVm: Overflow in 0: MOVER 32768 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "-32769,0": 'CpcVm: Overflow in 0: MOVER -32769 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "0,32768": 'getXpos: -- CpcVm: Overflow in 0: MOVER 32768 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "0,-32769": 'getXpos: -- CpcVm: Overflow in 0: MOVER -32769 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                ",0": 'CpcVm: Type mismatch in 0: MOVER undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "10,20,-1": 'getXpos: , getYpos: -- CpcVm: Improper argument in 0: MOVER -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "10,20,16": 'getXpos: , getYpos: -- CpcVm: Improper argument in 0: MOVER 16 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "10,20,0,-1": 'getXpos: , getYpos: , setGPen:0 -- CpcVm: Improper argument in 0: MOVER -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "10,20,0,4": 'getXpos: , getYpos: , setGPen:0 -- CpcVm: Improper argument in 0: MOVER 4 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
            },
            "new": {
                "": 'resetQueue: -- {"_key":"stop","reason":"new","priority":90,"paras":{"command":"new","stream":0,"first":0,"last":0,"line":0}} -- {"_key":"timer0","line":0,"repeat":false,"intervalMs":0,"active":false,"handlerRunning":false,"stackIndexReturn":0,"savedPriority":0} -- {"_key":"timer1","line":0,"repeat":false,"intervalMs":0,"active":false,"handlerRunning":false,"stackIndexReturn":0,"savedPriority":0} -- {"_key":"timer2","line":0,"repeat":false,"intervalMs":0,"active":false,"handlerRunning":false,"stackIndexReturn":0,"savedPriority":0} -- {"_key":"timer3","line":0,"repeat":false,"intervalMs":0,"active":false,"handlerRunning":false,"stackIndexReturn":0,"savedPriority":0}'
            },
            onBreakCont: {
                "": "false, onBreakContSet:true, onBreakHandlerActive:false"
            },
            onBreakGosub: {
                "1 ": "false, onBreakContSet:false, onBreakHandlerActive:true",
                "65535 ": "false, onBreakContSet:false, onBreakHandlerActive:true",
                "": 'CpcVm: Type mismatch in 123: ON BREAK GOSUB undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Type mismatch in 123: ON BREAK GOSUB  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "0 ": 'CpcVm: Improper argument in 123: ON BREAK GOSUB 0 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "1.4 ": "false, onBreakContSet:false, onBreakHandlerActive:true",
                "-1 ": 'CpcVm: Improper argument in 123: ON BREAK GOSUB -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "65536 ": 'CpcVm: Improper argument in 123: ON BREAK GOSUB 65536 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
            },
            onBreakStop: {
                "": "true, onBreakContSet:false, onBreakHandlerActive:false"
            },
            onErrorGoto: {
                "0 ": "",
                "1 ": "",
                "65535 ": "",
                "": 'CpcVm: Type mismatch in 0: ON ERROR GOTO undefined -- {"_key":"stop","reason":"onError","priority":50,"paras":{}}',
                '""': 'CpcVm: Type mismatch in 65535: ON ERROR GOTO  -- {"_key":"stop","reason":"onError","priority":50,"paras":{}}',
                "-1 ": 'CpcVm: Improper argument in 65535: ON ERROR GOTO -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "65536 ": 'CpcVm: Improper argument in 65535: ON ERROR GOTO 65536 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
            },
            onGosub: {
                '"10s1",1,123': "123",
                '"10s1",2,123,234': "234",
                '"10s1",0,123,234': "10s1",
                '"10s1",3,123,234': "10s1",
                '"10s1",255,123,234': "10s1",
                "": 'CpcVm: Type mismatch in 10s1: ON GOSUB undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Type mismatch in 10s1: ON GOSUB undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '"10s1",-1,123': 'CpcVm: Improper argument in 10s1: ON GOSUB -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '"10s1",256,123': 'CpcVm: Improper argument in 10s1: ON GOSUB 256 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
            },
            onGoto: {
                '"10s1",1,123': "123",
                '"10s1",2,123,234': "234",
                '"10s1",0,123,234': "10s1",
                '"10s1",3,123,234': "10s1",
                '"10s1",255,123,234': "10s1",
                "": 'CpcVm: Type mismatch in 10s1: ON GOTO undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Type mismatch in 10s1: ON GOTO undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '"10s1",-1,123': 'CpcVm: Improper argument in 10s1: ON GOTO -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '"10s1",256,123': 'CpcVm: Improper argument in 10s1: ON GOTO 256 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
            },
            onSqGosub: {
                "1,123": "",
                "2,123": "",
                "4,123": "",
                "1,1": "",
                "1,65535": "",
                "": 'CpcVm: Type mismatch in 0: ON SQ GOSUB undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Type mismatch in 0: ON SQ GOSUB  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "0,123": 'CpcVm: Improper argument in 0: ON SQ GOSUB 0 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "3,123": 'CpcVm: Improper argument in 0: ON SQ GOSUB 3 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "5,123": 'CpcVm: Improper argument in 0: ON SQ GOSUB 5 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "1,0": 'CpcVm: Improper argument in 0: ON SQ GOSUB 0 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "1,65536": 'CpcVm: Improper argument in 0: ON SQ GOSUB 65536 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
            },
            openin: {
                '"file1"': '{"_key":"stop","reason":"fileLoad","priority":90,"paras":{}} -- {"_key":"inFile","open":true,"command":"openin","name":"file1","line":0,"start":0,"fileData":[],"first":0,"last":0,"memorizedExample":""}',
                "": 'CpcVm: Type mismatch in 0: OPENIN undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Broken in 0: Bad filename:  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
            },
            openout: {
                '"file1"': '{"_key":"outFile","open":true,"command":"openout","name":"file1","line":0,"start":0,"fileData":[],"stream":0,"typeString":"A","length":0,"entry":0}',
                "": 'CpcVm: Type mismatch in 0: OPENOUT undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Broken in 0: Bad filename:  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
            },
            plot: {
                "0,0": "plot:0,0",
                "-32768,0": "plot:-32768,0",
                "32767,0": "plot:32767,0",
                "0,-32768": "plot:0,-32768",
                "0,32767.2": "plot:0,32767",
                "10,20,0": "setGPen:0 , plot:10,20",
                "10,20,0,0": "setGPen:0 , setGColMode:0 , plot:10,20",
                "10,20,,0": "setGColMode:0 , plot:10,20",
                "10,20,15,3": "setGPen:15 , setGColMode:3 , plot:10,20",
                "": 'CpcVm: Type mismatch in 0: PLOT undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Type mismatch in 0: PLOT  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "32768,0": 'CpcVm: Overflow in 0: PLOT 32768 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "-32769,0": 'CpcVm: Overflow in 0: PLOT -32769 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "0,32768": 'CpcVm: Overflow in 0: PLOT 32768 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "0,-32769": 'CpcVm: Overflow in 0: PLOT -32769 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                ",0": 'CpcVm: Type mismatch in 0: PLOT undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "10,20,-1": 'CpcVm: Improper argument in 0: PLOT -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "10,20,16": 'CpcVm: Improper argument in 0: PLOT 16 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "10,20,0,-1": 'setGPen:0 -- CpcVm: Improper argument in 0: PLOT -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "10,20,0,4": 'setGPen:0 -- CpcVm: Improper argument in 0: PLOT 4 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
            },
            plotr: {
                "0,0": "getXpos: , getYpos: , plot:10,20",
                "-32768,0": "getXpos: , getYpos: , plot:-32758,20",
                "32767,0": "getXpos: , getYpos: , plot:32777,20",
                "0,-32768": "getXpos: , getYpos: , plot:10,-32748",
                "0,32767.2": "getXpos: , getYpos: , plot:10,32787",
                "10,20,0": "getXpos: , getYpos: , setGPen:0 , plot:20,40",
                "10,20,0,0": "getXpos: , getYpos: , setGPen:0 , setGColMode:0 , plot:20,40",
                "10,20,,0": "getXpos: , getYpos: , setGColMode:0 , plot:20,40",
                "10,20,15,3": "getXpos: , getYpos: , setGPen:15 , setGColMode:3 , plot:20,40",
                "": 'CpcVm: Type mismatch in 0: PLOTR undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Type mismatch in 0: PLOTR  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "32768,0": 'CpcVm: Overflow in 0: PLOTR 32768 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "-32769,0": 'CpcVm: Overflow in 0: PLOTR -32769 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "0,32768": 'getXpos: -- CpcVm: Overflow in 0: PLOTR 32768 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "0,-32769": 'getXpos: -- CpcVm: Overflow in 0: PLOTR -32769 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                ",0": 'CpcVm: Type mismatch in 0: PLOTR undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "10,20,-1": 'getXpos: , getYpos: -- CpcVm: Improper argument in 0: PLOTR -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "10,20,16": 'getXpos: , getYpos: -- CpcVm: Improper argument in 0: PLOTR 16 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "10,20,0,-1": 'getXpos: , getYpos: , setGPen:0 -- CpcVm: Improper argument in 0: PLOTR -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "10,20,0,4": 'getXpos: , getYpos: , setGPen:0 -- CpcVm: Improper argument in 0: PLOTR 4 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
            },
            renum: {
                "": '{"_key":"stop","reason":"renumLines","priority":85,"paras":{"command":"renum","stream":0,"line":0,"newLine":10,"oldLine":1,"step":10,"keep":65535}}',
                "10 ": '{"_key":"stop","reason":"renumLines","priority":85,"paras":{"command":"renum","stream":0,"line":0,"newLine":10,"oldLine":1,"step":10,"keep":65535}}',
                "100,90,15,9000": '{"_key":"stop","reason":"renumLines","priority":85,"paras":{"command":"renum","stream":0,"line":0,"newLine":100,"oldLine":90,"step":15,"keep":9000}}',
                '""': 'CpcVm: Type mismatch in 0: RENUM  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
            },
            tan: {
                "0 ": "0",
                "0.7853981633974483 ": "0.9999999999999999"
            },
            tanDeg: {
                "0 ": "0",
                "45 ": "0.9999999999999999"
            },
            test: {
                "0,0": "test:0,0 -- 0",
                "-32768,0": "test:-32768,0 -- 0",
                "32767,0": "test:32767,0 -- 15",
                "0,-32768": "test:0,-32768 -- 0",
                "0,32767": "test:0,32767 -- 0",
                "": 'CpcVm: Type mismatch in 0: TEST undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Type mismatch in 0: TEST  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "32768,0": 'CpcVm: Overflow in 0: TEST 32768 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "-32769,0": 'CpcVm: Overflow in 0: TEST -32769 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "0,32768": 'CpcVm: Overflow in 0: TEST 32768 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "0,-32769": 'CpcVm: Overflow in 0: TEST -32769 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                ",0": 'CpcVm: Type mismatch in 0: TEST undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
            },
            testr: {
                "0,0": "getXpos: , getYpos: , test:10,20 -- 10",
                "-32768,0": "getXpos: , getYpos: , test:-32758,20 -- -6",
                "32767,0": "getXpos: , getYpos: , test:32777,20 -- 9",
                "0,-32768": "getXpos: , getYpos: , test:10,-32748 -- 10",
                "0,32767": "getXpos: , getYpos: , test:10,32787 -- 10",
                "": 'CpcVm: Type mismatch in 0: TESTR undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Type mismatch in 0: TESTR  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "32768,0": 'CpcVm: Overflow in 0: TESTR 32768 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "-32769,0": 'CpcVm: Overflow in 0: TESTR -32769 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "0,32768": 'getXpos: -- CpcVm: Overflow in 0: TESTR 32768 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "0,-32769": 'getXpos: -- CpcVm: Overflow in 0: TESTR -32769 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                ",0": 'CpcVm: Type mismatch in 0: TESTR undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
            },
            unt: {
                "0 ": "0",
                "255 ": "255",
                "32767.2 ": "32767",
                "65535 ": "-1",
                "-1": "-1",
                "-32768": "-32768",
                "": 'CpcVm: Type mismatch in 0: UNT undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Type mismatch in 0: UNT  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "65536 ": 'CpcVm: Overflow in 0: UNT 65536 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "-32769": 'CpcVm: Overflow in 0: UNT -32769 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
            },
            upper$: {
                '""': "",
                '"a"': "A",
                '"abcdefghkklmnopqrstuvwxyz"': "ABCDEFGHKKLMNOPQRSTUVWXYZ",
                '" !"#$%&\'()*+ -./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~\x7f\x80\x81\x82\x83\x84\x85\x86\x87\x88\x89\x8a\x8b\x8c\x8d\x8e\x8f\x90\x91\x92\x93\x94\x95\x96\x97\x98\x99\x9a\x9b\x9c\x9d\x9e\x9f\xa0\xa1\xa2\xa3\xa4\xa5\xa6\xa7\xa8\xa9\xaa\xab\xac\xad\xae\xaf\xb0\xb1\xb2\xb3\xb4\xb5\xb6\xb7\xb8\xb9\xba\xbb\xbc\xbd\xbe\xbf\xc0\xc1\xc2\xc3\xc4\xc5\xc6\xc7\xc8\xc9\xca\xcb\xcc\xcd\xce\xcf\xd0\xd1\xd2\xd3\xd4\xd5\xd6\xd7\xd8\xd9\xda\xdb\xdc\xdd\xde\xdf\xe0\xe1\xe2\xe3\xe4\xe5\xe6\xe7\xe8\xe9\xea\xeb\xec\xed\xee\xef\xf0\xf1\xf2\xf3\xf4\xf5\xf6\xf7\xf8\xf9\xfa\xfb\xfc\xfd\xfe\xff"': " !\"#$%&'()*+ -./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`ABCDEFGHIJKLMNOPQRSTUVWXYZ{|}~\x7f\x80\x81\x82\x83\x84\x85\x86\x87\x88\x89\x8a\x8b\x8c\x8d\x8e\x8f\x90\x91\x92\x93\x94\x95\x96\x97\x98\x99\x9a\x9b\x9c\x9d\x9e\x9f\xa0\xa1\xa2\xa3\xa4\xa5\xa6\xa7\xa8\xa9\xaa\xab\xac\xad\xae\xaf\xb0\xb1\xb2\xb3\xb4\xb5\xb6\xb7\xb8\xb9\xba\xbb\xbc\xbd\xbe\xbf\xc0\xc1\xc2\xc3\xc4\xc5\xc6\xc7\xc8\xc9\xca\xcb\xcc\xcd\xce\xcf\xd0\xd1\xd2\xd3\xd4\xd5\xd6\xd7\xd8\xd9\xda\xdb\xdc\xdd\xde\xdf\xe0\xe1\xe2\xe3\xe4\xe5\xe6\xe7\xe8\xe9\xea\xeb\xec\xed\xee\xef\xf0\xf1\xf2\xf3\xf4\xf5\xf6\xf7\xf8\xf9\xfa\xfb\xfc\xfd\xfe\xff",
                "": 'CpcVm: Type mismatch in 0: UPPER$ undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
                "0 ": 'CpcVm: Type mismatch in 0: UPPER$ 0 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
            }
        }, lastTestFunctions = [], varTypesMap = {}, variablesMap = {}, mockCanvas = {
            changeMode: function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                lastTestFunctions.push({
                    changeMode: args
                });
            },
            clearFullWindow: function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                lastTestFunctions.push({
                    clearFullWindow: args
                });
            },
            clearGraphicsWindow: function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                lastTestFunctions.push({
                    clearGraphicsWindow: args
                });
            },
            clearTextWindow: function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                lastTestFunctions.push({
                    clearTextWindow: args
                });
            },
            draw: function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                lastTestFunctions.push({
                    draw: args
                });
            },
            drawCursor: function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                lastTestFunctions.push({
                    drawCursor: args
                });
            },
            fill: function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                lastTestFunctions.push({
                    fill: args
                });
            },
            getByte: function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                var addr = args[0];
                // test output only for 0x0000, 0x4000, 0x8000, 0xc000
                if ((addr & 0xc000) === addr) { // eslint-disable-line no-bitwise
                    lastTestFunctions.push({
                        getByte: args
                    });
                }
                return 13;
            },
            getMode: function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                lastTestFunctions.push({
                    getMode: args
                });
                return 1;
            },
            getXpos: function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                lastTestFunctions.push({
                    getXpos: args
                });
                return 10;
            },
            getYpos: function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                lastTestFunctions.push({
                    getYpos: args
                });
                return 20;
            },
            move: function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                lastTestFunctions.push({
                    move: args
                });
            },
            plot: function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                lastTestFunctions.push({
                    plot: args
                });
            },
            printChar: function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                lastTestFunctions.push({
                    printChar: args.map(function (arg) { return String(arg); })
                });
            },
            printGChar: function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                lastTestFunctions.push({
                    printGChar: args
                });
            },
            readChar: function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                lastTestFunctions.push({
                    readChar: args
                });
                return 65;
            },
            resetCustomChars: function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                lastTestFunctions.push({
                    resetCustomChars: args
                });
            },
            setBorder: function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                lastTestFunctions.push({
                    setBorder: args
                });
            },
            setByte: function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                var addr = args[0];
                // test output only for 0x0000, 0x4000, 0x8000, 0xc000
                if ((addr & 0xc000) === addr) { // eslint-disable-line no-bitwise
                    lastTestFunctions.push({
                        setByte: args
                    });
                }
            },
            setDefaultInks: function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                lastTestFunctions.push({
                    setDefaultInks: args
                });
            },
            setGColMode: function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                lastTestFunctions.push({
                    setGColMode: args
                });
            },
            setGPaper: function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                lastTestFunctions.push({
                    setGPaper: args
                });
            },
            setGPen: function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                lastTestFunctions.push({
                    setGPen: args
                });
            },
            setGTransparentMode: function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                lastTestFunctions.push({
                    setGTransparentMode: args.map(function (arg) { return String(arg); })
                });
            },
            setInk: function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                lastTestFunctions.push({
                    setInk: args
                });
                return Boolean(args[0]); // example
            },
            setMask: function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                lastTestFunctions.push({
                    setMask: args
                });
            },
            setMaskFirst: function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                lastTestFunctions.push({
                    setMaskFirst: args
                });
            },
            setMode: function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                lastTestFunctions.push({
                    setMode: args
                });
            },
            setSpeedInk: function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                lastTestFunctions.push({
                    setSpeedInk: args
                });
            },
            test: function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                lastTestFunctions.push({
                    test: args
                });
                return Number(args[0]) % 16; // example
            },
            windowScrollDown: function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                lastTestFunctions.push({
                    windowScrollDown: args
                });
            }
        }, mockKeyboard = {
            clearInput: function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                lastTestFunctions.push({
                    clearInput: args
                });
            },
            getJoyState: function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                lastTestFunctions.push({
                    getJoyState: args
                });
                return 4 + Number(args); // example
            },
            getKeyDownHandler: function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                lastTestFunctions.push({
                    getKeyDownHandler: args
                });
            },
            getKeyFromBuffer: function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                lastTestFunctions.push({
                    getKeyFromBuffer: args
                });
                return "A";
            },
            getKeyState: function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                lastTestFunctions.push({
                    getKeyState: args
                });
                return args[0] === 79 ? 13 : -1; // example
            },
            putKeyInBuffer: function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                lastTestFunctions.push({
                    putKeyInBuffer: args
                });
            },
            resetCpcKeysExpansions: function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                lastTestFunctions.push({
                    resetCpcKeysExpansions: args
                });
            },
            resetExpansionTokens: function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                lastTestFunctions.push({
                    resetExpansionTokens: args
                });
            },
            setCpcKeyExpansion: function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                lastTestFunctions.push({
                    setCpcKeyExpansion: args //TTT
                });
            },
            setExpansionToken: function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                lastTestFunctions.push({
                    setExpansionToken: args
                });
            }
        }, mockSound = {
            resetQueue: function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                lastTestFunctions.push({
                    resetQueue: args
                });
            },
            setToneEnv: function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                lastTestFunctions.push({
                    setToneEnv: args
                });
            },
            setVolEnv: function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                lastTestFunctions.push({
                    setVolEnv: args
                });
            }
        }, mockVariables = {
            dimVariable: function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                lastTestFunctions.push({
                    dimVariable: args
                });
            },
            getVarType: function (varChar) {
                return varTypesMap[varChar];
            },
            setVarType: function (varChar, type) {
                varTypesMap[varChar] = type;
            },
            initVariable: function (varName) {
                variablesMap[varName] = this.getVarType(varName.charAt(0)) === "$" ? "" : 0;
            },
            initAllVariables: function () {
                var variables = this.getAllVariableNames();
                for (var i = 0; i < variables.length; i += 1) {
                    this.initVariable(variables[i]);
                }
            },
            getAllVariableNames: function () {
                return Object.keys(variablesMap);
            }
        };
        function deleteObjectContents(obj) {
            for (var prop in obj) {
                if (obj.hasOwnProperty(prop)) {
                    delete obj[prop];
                }
            }
        }
        function clearLastTestFunctions() {
            lastTestFunctions.length = 0;
        }
        function combineLastTestFunctions() {
            return lastTestFunctions.map(function (lastTestFunction) { return Object.keys(lastTestFunction)[0] + ":" + Object.values(lastTestFunction)[0]; }).join(" , ") || undefined;
        }
        function getValidStream(cpcVm, input) {
            var stream = cpcVm.vmRound(input);
            if (stream < 0 || stream > 7) {
                stream = 0;
            }
            return stream;
        }
        var allTestFunctions = {
            abs: function (cpcVm, input) {
                return String(cpcVm.abs.apply(cpcVm, input));
            },
            afterGosub: function (cpcVm, input) {
                cpcVm.afterGosub.apply(cpcVm, input);
                /*
                const timer = Number(cpcVm.vmRound(Number(input[1]))),
                    timerEntry = cpcVm.vmInternal.getTimerList.call(cpcVm)[timer];
    
                (timerEntry as any).nextTimeMs = undefined;
                return JSON.stringify(timerEntry);
                */
            },
            asc: function (cpcVm, input) {
                return String(cpcVm.asc.apply(cpcVm, input));
            },
            atn: function (cpcVm, input) {
                cpcVm.rad();
                return String(cpcVm.atn.apply(cpcVm, input));
            },
            atnDeg: function (cpcVm, input) {
                cpcVm.deg();
                return String(cpcVm.atn.apply(cpcVm, input));
            },
            bin$: function (cpcVm, input) {
                return cpcVm.bin$.apply(cpcVm, input);
            },
            border: function (cpcVm, input) {
                cpcVm.border.apply(cpcVm, input);
            },
            call: function (cpcVm, input) {
                cpcVm.call.apply(cpcVm, input);
            },
            cat: function (cpcVm, input) {
                cpcVm.cat.apply(cpcVm, input);
            },
            chain: function (cpcVm, input) {
                cpcVm.chain.apply(cpcVm, input);
            },
            chainMerge: function (cpcVm, input) {
                cpcVm.chainMerge.apply(cpcVm, input);
            },
            chr$: function (cpcVm, input) {
                return cpcVm.chr$.apply(cpcVm, input);
            },
            cint: function (cpcVm, input) {
                return String(cpcVm.cint.apply(cpcVm, input));
            },
            clearInput: function (cpcVm, input) {
                cpcVm.clearInput.apply(cpcVm, input);
            },
            clg: function (cpcVm, input) {
                cpcVm.clg.apply(cpcVm, input);
            },
            closein: function (cpcVm, input) {
                var inFile = cpcVm.vmGetInFileObject();
                inFile.open = true;
                inFile.command = "test1";
                inFile.name = "name1";
                cpcVm.closein.apply(cpcVm, input);
            },
            closeout: function (cpcVm, input) {
                var outFile = cpcVm.vmGetOutFileObject(), testCase = input.shift();
                switch (testCase) {
                    case "_testCase1":
                        break;
                    case "_testCase2":
                        outFile.open = true;
                        outFile.command = "openout";
                        outFile.name = "name1";
                        break;
                    case "_testCase3":
                        outFile.open = true;
                        outFile.command = "openout";
                        outFile.name = "name1";
                        outFile.fileData[0] = "A";
                        break;
                    default:
                        Utils_1.Utils.console.error("Unknown testCase:", testCase);
                        break;
                }
                cpcVm.closeout.apply(cpcVm, input);
            },
            cls: function (cpcVm, input) {
                /*
                const stream = getValidStream(cpcVm, Number(input));
    
                cpcVm.vmChangeMode(1);
                cpcVm.vmResetWindowData(true); // prepare
                cpcVm.locate(stream, 2 + 1, 3 + 1);
                clearLastTestFunctions(); // test only cls
                */
                cpcVm.cls.apply(cpcVm, input);
                /*
                const win = cpcVm.vmInternal.getWindowDataList.call(cpcVm)[stream];
    
                return JSON.stringify(win);
                */
            },
            cont: function (cpcVm, input) {
                var testCase = input.shift();
                switch (testCase) {
                    case "_testCase1":
                        cpcVm.vmSetStartLine(123);
                        break;
                    case "_testCase2":
                        cpcVm.vmGotoLine(0);
                        cpcVm.vmSetStartLine(0);
                        break;
                    default:
                        Utils_1.Utils.console.error("Unknown testCase:", testCase);
                        break;
                }
                cpcVm.cont.apply(cpcVm, input);
            },
            copychr$: function (cpcVm, input) {
                var stream = getValidStream(cpcVm, Number(input));
                /*
                cpcVm.vmChangeMode(1);
                cpcVm.vmResetWindowData(true); // prepare
                */
                cpcVm.locate(stream, 2 + 1, 3 + 1);
                clearLastTestFunctions(); // test only copychr$
                return cpcVm.copychr$.apply(cpcVm, input);
            },
            cos: function (cpcVm, input) {
                cpcVm.rad();
                return String(cpcVm.cos.apply(cpcVm, input));
            },
            cosDeg: function (cpcVm, input) {
                cpcVm.deg();
                return String(cpcVm.cos.apply(cpcVm, input));
            },
            creal: function (cpcVm, input) {
                return String(cpcVm.creal.apply(cpcVm, input));
            },
            cursor: function (cpcVm, input) {
                var stream = getValidStream(cpcVm, Number(input));
                /*
                cpcVm.vmChangeMode(1);
                cpcVm.vmResetWindowData(true); // prepare
                */
                cpcVm.locate(stream, 2 + 1, 3 + 1);
                clearLastTestFunctions();
                cpcVm.cursor.apply(cpcVm, input);
            },
            data: function (cpcVm, input) {
                cpcVm.data.apply(cpcVm, input);
            },
            dec$: function (cpcVm, input) {
                return String(cpcVm.dec$.apply(cpcVm, input));
            },
            defint: function (cpcVm, input) {
                deleteObjectContents(varTypesMap);
                cpcVm.defint.apply(cpcVm, input);
                return JSON.stringify(varTypesMap);
            },
            defreal: function (cpcVm, input) {
                deleteObjectContents(varTypesMap);
                cpcVm.defreal.apply(cpcVm, input);
                return JSON.stringify(varTypesMap);
            },
            defstr: function (cpcVm, input) {
                deleteObjectContents(varTypesMap);
                cpcVm.defstr.apply(cpcVm, input);
                return JSON.stringify(varTypesMap);
            },
            "delete": function (cpcVm, input) {
                cpcVm.delete.apply(cpcVm, input);
            },
            derr: function (cpcVm, input) {
                return String(cpcVm.derr.apply(cpcVm, input));
            },
            di: function (cpcVm, input) {
                cpcVm.di.apply(cpcVm, input);
            },
            dim: function (cpcVm, input) {
                cpcVm.dim.apply(cpcVm, input);
            },
            draw: function (cpcVm, input) {
                cpcVm.draw.apply(cpcVm, input);
            },
            drawr: function (cpcVm, input) {
                cpcVm.drawr.apply(cpcVm, input);
            },
            edit: function (cpcVm, input) {
                cpcVm.edit.apply(cpcVm, input);
            },
            ei: function (cpcVm, input) {
                cpcVm.ei.apply(cpcVm, input);
            },
            end: function (cpcVm, input) {
                cpcVm.end.apply(cpcVm, input);
            },
            ent: function (cpcVm, input) {
                cpcVm.ent.apply(cpcVm, input);
            },
            env: function (cpcVm, input) {
                cpcVm.env.apply(cpcVm, input);
            },
            eof: function (cpcVm, input) {
                var inFile = cpcVm.vmGetInFileObject(), testCase = input.shift();
                switch (testCase) {
                    case "_testCase1":
                        break;
                    case "_testCase2":
                        inFile.open = true;
                        break;
                    case "_testCase3":
                        inFile.open = true;
                        inFile.fileData.push("A");
                        break;
                    default:
                        Utils_1.Utils.console.error("Unknown testCase:", testCase);
                }
                return String(cpcVm.eof.apply(cpcVm, input));
            },
            erase: function (cpcVm, input) {
                cpcVm.erase.apply(cpcVm, input);
            },
            erl: function (cpcVm, input) {
                cpcVm.vmGotoLine("123aa");
                cpcVm.vmComposeError(Error(), 1, ""); // set erl
                cpcVm.vmStop("", 0, true); // initialize stop object modified by vmComposeError
                return String(cpcVm.erl.apply(cpcVm, input));
            },
            err: function (cpcVm, input) {
                cpcVm.vmComposeError(Error(), 31, "");
                cpcVm.vmStop("", 0, true); // initialize stop object modified by vmComposeError
                return String(cpcVm.err.apply(cpcVm, input));
            },
            error: function (cpcVm, input) {
                cpcVm.error.apply(cpcVm, input);
            },
            everyGosub: function (cpcVm, input) {
                cpcVm.everyGosub.apply(cpcVm, input);
                /*
                const timer = Number(cpcVm.vmRound(Number(input[1]))),
                    timerEntry = cpcVm.vmInternal.getTimerList.call(cpcVm)[timer];
    
                (timerEntry as any).nextTimeMs = undefined; // remove random entry
                return JSON.stringify(timerEntry);
                */
            },
            exp: function (cpcVm, input) {
                return String(cpcVm.exp.apply(cpcVm, input));
            },
            fill: function (cpcVm, input) {
                cpcVm.fill.apply(cpcVm, input);
            },
            fix: function (cpcVm, input) {
                return String(cpcVm.fix.apply(cpcVm, input));
            },
            frame: function (cpcVm, input) {
                cpcVm.frame.apply(cpcVm, input);
            },
            fre: function (cpcVm, input) {
                var testCase = input.shift();
                switch (testCase) {
                    case "_testCase1":
                        break;
                    case "_testCase2":
                        cpcVm.memory(370);
                        break;
                    default:
                        Utils_1.Utils.console.error("Unknown testCase:", testCase);
                        break;
                }
                return String(cpcVm.fre.apply(cpcVm, input));
            },
            gosub: function (cpcVm, input) {
                cpcVm.gosub.apply(cpcVm, input);
                return String(cpcVm.line);
            },
            "goto": function (cpcVm, input) {
                cpcVm.goto.apply(cpcVm, input);
                return String(cpcVm.line);
            },
            graphicsPaper: function (cpcVm, input) {
                cpcVm.graphicsPaper.apply(cpcVm, input);
            },
            graphicsPen: function (cpcVm, input) {
                cpcVm.graphicsPen.apply(cpcVm, input);
            },
            hex$: function (cpcVm, input) {
                return cpcVm.hex$.apply(cpcVm, input);
            },
            himem: function (cpcVm, input) {
                var testCase = input.shift();
                switch (testCase) {
                    case "_testCase1":
                        break;
                    case "_testCase2":
                        cpcVm.memory(370);
                        break;
                    default:
                        Utils_1.Utils.console.error("Unknown testCase:", testCase);
                        break;
                }
                return String(cpcVm.himem.apply(cpcVm, input));
            },
            ink: function (cpcVm, input) {
                cpcVm.ink.apply(cpcVm, input);
            },
            inkey: function (cpcVm, input) {
                return String(cpcVm.inkey.apply(cpcVm, input));
            },
            inkey$: function (cpcVm, input) {
                return cpcVm.inkey$.apply(cpcVm, input);
            },
            inp: function (cpcVm, input) {
                return String(cpcVm.inp.apply(cpcVm, input));
            },
            input: function (cpcVm, input) {
                cpcVm.input.apply(cpcVm, input);
            },
            instr: function (cpcVm, input) {
                return String(cpcVm.instr.apply(cpcVm, input));
            },
            "int": function (cpcVm, input) {
                return String(cpcVm.int.apply(cpcVm, input));
            },
            joy: function (cpcVm, input) {
                return String(cpcVm.joy.apply(cpcVm, input));
            },
            key: function (cpcVm, input) {
                cpcVm.key.apply(cpcVm, input);
            },
            keyDef: function (cpcVm, input) {
                cpcVm.keyDef.apply(cpcVm, input);
            },
            left$: function (cpcVm, input) {
                return String(cpcVm.left$.apply(cpcVm, input));
            },
            len: function (cpcVm, input) {
                return String(cpcVm.len.apply(cpcVm, input));
            },
            lineInput: function (cpcVm, input) {
                cpcVm.lineInput.apply(cpcVm, input);
            },
            list: function (cpcVm, input) {
                cpcVm.list.apply(cpcVm, input);
            },
            load: function (cpcVm, input) {
                cpcVm.load.apply(cpcVm, input);
            },
            locate: function (cpcVm, input) {
                var stream = getValidStream(cpcVm, Number(input));
                cpcVm.locate.apply(cpcVm, input);
                return cpcVm.pos(stream) + "," + cpcVm.vpos(stream);
            },
            log: function (cpcVm, input) {
                return String(cpcVm.log.apply(cpcVm, input));
            },
            log10: function (cpcVm, input) {
                return String(cpcVm.log10.apply(cpcVm, input));
            },
            lower$: function (cpcVm, input) {
                return cpcVm.lower$.apply(cpcVm, input);
            },
            mask: function (cpcVm, input) {
                cpcVm.mask.apply(cpcVm, input);
            },
            max: function (cpcVm, input) {
                return String(cpcVm.max.apply(cpcVm, input));
            },
            memory: function (cpcVm, input) {
                cpcVm.memory.apply(cpcVm, input);
                return String(cpcVm.himem());
            },
            merge: function (cpcVm, input) {
                cpcVm.merge.apply(cpcVm, input);
            },
            mid$: function (cpcVm, input) {
                return cpcVm.mid$.apply(cpcVm, input);
            },
            mid$Assign: function (cpcVm, input) {
                return cpcVm.mid$Assign.apply(cpcVm, input);
            },
            min: function (cpcVm, input) {
                return String(cpcVm.min.apply(cpcVm, input));
            },
            mode: function (cpcVm, input) {
                cpcVm.mode.apply(cpcVm, input);
            },
            move: function (cpcVm, input) {
                cpcVm.move.apply(cpcVm, input);
            },
            mover: function (cpcVm, input) {
                cpcVm.mover.apply(cpcVm, input);
            },
            "new": function (cpcVm, input) {
                cpcVm.new.apply(cpcVm, input);
            },
            onBreakCont: function (cpcVm, input) {
                cpcVm.onBreakCont.apply(cpcVm, input);
                return String(cpcVm.vmEscape()) + ", onBreakContSet:" + String(cpcVm.vmOnBreakContSet()) + ", onBreakHandlerActive:" + String(cpcVm.vmOnBreakHandlerActive());
            },
            onBreakGosub: function (cpcVm, input) {
                cpcVm.vmGotoLine("123");
                cpcVm.onBreakGosub.apply(cpcVm, input);
                return String(cpcVm.vmEscape()) + ", onBreakContSet:" + String(cpcVm.vmOnBreakContSet()) + ", onBreakHandlerActive:" + String(cpcVm.vmOnBreakHandlerActive());
            },
            onBreakStop: function (cpcVm, input) {
                cpcVm.onBreakStop.apply(cpcVm, input);
                return String(cpcVm.vmEscape()) + ", onBreakContSet:" + String(cpcVm.vmOnBreakContSet()) + ", onBreakHandlerActive:" + String(cpcVm.vmOnBreakHandlerActive());
            },
            onErrorGoto: function (cpcVm, input) {
                cpcVm.onErrorGoto.apply(cpcVm, input);
            },
            onGosub: function (cpcVm, input) {
                cpcVm.onGosub.apply(cpcVm, input);
                return String(cpcVm.line);
            },
            onGoto: function (cpcVm, input) {
                cpcVm.onGoto.apply(cpcVm, input);
                return String(cpcVm.line);
            },
            onSqGosub: function (cpcVm, input) {
                cpcVm.onSqGosub.apply(cpcVm, input);
            },
            openin: function (cpcVm, input) {
                cpcVm.openin.apply(cpcVm, input);
            },
            openout: function (cpcVm, input) {
                cpcVm.openout.apply(cpcVm, input);
            },
            plot: function (cpcVm, input) {
                cpcVm.plot.apply(cpcVm, input);
            },
            plotr: function (cpcVm, input) {
                cpcVm.plotr.apply(cpcVm, input);
            },
            renum: function (cpcVm, input) {
                cpcVm.renum.apply(cpcVm, input);
            },
            tan: function (cpcVm, input) {
                cpcVm.rad();
                return String(cpcVm.tan.apply(cpcVm, input));
            },
            tanDeg: function (cpcVm, input) {
                cpcVm.deg();
                return String(cpcVm.tan.apply(cpcVm, input));
            },
            test: function (cpcVm, input) {
                return String(cpcVm.test.apply(cpcVm, input));
            },
            testr: function (cpcVm, input) {
                return String(cpcVm.testr.apply(cpcVm, input));
            },
            unt: function (cpcVm, input) {
                return String(cpcVm.unt.apply(cpcVm, input));
            },
            upper$: function (cpcVm, input) {
                return cpcVm.upper$.apply(cpcVm, input);
            }
        };
        function adaptParameters(a) {
            var b = [];
            for (var i = 0; i < a.length; i += 1) {
                if (a[i].startsWith('"') && a[i].endsWith('"')) { // string in quotes?
                    b.push(a[i].substr(1, a[i].length - 2)); // remove quotes
                }
                else if (a[i] !== "") { // non empty string => to number
                    b.push(Number(a[i]));
                }
                else {
                    b.push(undefined);
                }
            }
            return b;
        }
        function getVmState(cpcVm) {
            var vmState = {
                /* eslint-disable object-curly-newline */
                stopObject: JSON.stringify(Object.assign({ _key: "stop" }, cpcVm.vmGetStopObject())),
                inFileObject: JSON.stringify(Object.assign({ _key: "inFile" }, cpcVm.vmGetInFileObject())),
                outFileObject: JSON.stringify(Object.assign({ _key: "outFile" }, cpcVm.vmGetOutFileObject()))
                /* eslint-enable object-curly-newline */
            }, winDataList = cpcVm.vmInternal.getWindowDataList.call(cpcVm), timerList = cpcVm.vmInternal.getTimerList.call(cpcVm);
            for (var i = 0; i < winDataList.length; i += 1) {
                var key = "win" + i, winData = Object.assign({
                    _key: key
                }, winDataList[i]);
                vmState[key] = winData; //JSON.stringify(winData);
            }
            for (var i = 0; i < timerList.length; i += 1) {
                var key = "timer" + i, timerData = Object.assign({
                    _key: key
                }, timerList[i]);
                timerData.nextTimeMs = undefined; // remove varying property
                //vmState["timerData" + i] = JSON.stringify(timerList[i]);
                vmState[key] = timerData; //JSON.stringify(timerData);
            }
            return vmState;
        }
        function combineResult(result, vmState0, vmState1) {
            var combinedTestFunctions = combineLastTestFunctions(), combinedResult = [];
            if (combinedTestFunctions !== undefined) {
                combinedResult.push(combinedTestFunctions);
            }
            if (result !== undefined) {
                combinedResult.push(result);
            }
            for (var state in vmState0) {
                if (vmState0.hasOwnProperty(state)) {
                    if (typeof vmState0[state] === "object" && typeof vmState1[state] === "object") {
                        var stateObj0 = vmState0[state], stateObj1 = vmState1[state]; // as Record<string, string>;
                        for (var key in stateObj1) {
                            if (stateObj1.hasOwnProperty(key)) { // eslint-disable-line max-depth
                                if (key !== "_key" && stateObj1[key] === stateObj0[key]) {
                                    stateObj0[key] = undefined; // same value
                                    stateObj1[key] = undefined; // same value
                                }
                            }
                        }
                        vmState0[state] = JSON.stringify(stateObj0);
                        vmState1[state] = JSON.stringify(stateObj1);
                    }
                    if (vmState0[state] !== vmState1[state]) {
                        combinedResult.push(vmState1[state]);
                    }
                }
            }
            return combinedResult.join(" -- ");
        }
        function runTestsFor(assert, sCategory, tests, results) {
            var config = {
                canvas: mockCanvas,
                keyboard: mockKeyboard,
                sound: mockSound,
                variables: mockVariables,
                tron: false,
                quiet: true
            }, cpcVm = new CpcVm_1.CpcVm(config), testFunction = allTestFunctions[sCategory];
            for (var key in tests) {
                if (tests.hasOwnProperty(key)) {
                    //TTT
                    cpcVm.vmChangeMode(1);
                    cpcVm.vmResetWindowData(true); // prepare
                    cpcVm.closein();
                    cpcVm.closeout();
                    clearLastTestFunctions();
                    cpcVm.vmStop("", 0, true);
                    var vmState0 = getVmState(cpcVm), input = key === "" ? [] : adaptParameters(key.split(",")), expected = tests[key];
                    var result = void 0;
                    try {
                        if (!testFunction) {
                            throw new Error("Undefined testFunction: " + sCategory);
                        }
                        result = testFunction(cpcVm, input);
                        result = combineResult(result, vmState0, getVmState(cpcVm));
                    }
                    catch (e) {
                        result = String(e);
                        result = combineResult(result, vmState0, getVmState(cpcVm));
                        if (result !== expected) {
                            Utils_1.Utils.console.error(e); // only if not expected
                        }
                    }
                    if (results) {
                        results.push(TestHelper_1.TestHelper.stringInQuotes(key) + ": " + TestHelper_1.TestHelper.stringInQuotes(result));
                    }
                    if (assert) {
                        assert.strictEqual(result, expected, key);
                    }
                }
            }
        }
        TestHelper_1.TestHelper.generateAndRunAllTests(allTests, runTestsFor);
    });
});
// end
//# sourceMappingURL=CpcVm.qunit.js.map