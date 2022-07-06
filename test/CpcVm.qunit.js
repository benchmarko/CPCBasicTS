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
                "": 'CpcVm: Type mismatch in 0: ABS undefined -- {"reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Type mismatch in 0: ABS  -- {"reason":"error","priority":50,"paras":{}}'
            },
            afterGosub: {
                "0,0,123": '{"active":false}',
                "0.5,0,123": '{"active":true,"intervalMs":20,"line":123,"repeat":false}',
                "32767.4,0,123": '{"active":true,"intervalMs":655340,"line":123,"repeat":false}',
                "-1,0,123": 'CpcVm: Improper argument in 0: AFTER -1 -- {"reason":"error","priority":50,"paras":{}}',
                "32768,0,123": 'CpcVm: Overflow in 0: AFTER 32768 -- {"reason":"error","priority":50,"paras":{}}',
                "10,1,123": '{"intervalMs":200,"line":123,"repeat":false,"active":true}',
                "10,3.4,123": '{"intervalMs":200,"line":123,"repeat":false,"active":true}',
                "10,-1,123": 'CpcVm: Improper argument in 0: AFTER -1 -- {"reason":"error","priority":50,"paras":{}}',
                "10,3.9,123": 'CpcVm: Improper argument in 0: AFTER 4 -- {"reason":"error","priority":50,"paras":{}}'
            },
            asc: {
                '"A"': "65",
                '"Abc"': "65",
                "": 'CpcVm: Type mismatch in 0: ASC undefined -- {"reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Improper argument in 0: ASC -- {"reason":"error","priority":50,"paras":{}}',
                "0 ": 'CpcVm: Type mismatch in 0: ASC 0 -- {"reason":"error","priority":50,"paras":{}}'
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
                "": 'CpcVm: Type mismatch in 0: BIN$ undefined -- {"reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Type mismatch in 0: BIN$  -- {"reason":"error","priority":50,"paras":{}}',
                "65536 ": 'CpcVm: Overflow in 0: BIN$ 65536 -- {"reason":"error","priority":50,"paras":{}}',
                "65535,17": 'CpcVm: Improper argument in 0: BIN$ 17 -- {"reason":"error","priority":50,"paras":{}}',
                "-32769": 'CpcVm: Overflow in 0: BIN$ -32769 -- {"reason":"error","priority":50,"paras":{}}'
            },
            border: {
                "0 ": "setBorder:0,0",
                "1 ": "setBorder:1,1",
                "0,1": "setBorder:0,1",
                "1,0": "setBorder:1,0",
                "31 ": "setBorder:31,31",
                "": 'CpcVm: Type mismatch in 0: BORDER undefined -- {"reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Type mismatch in 0: BORDER  -- {"reason":"error","priority":50,"paras":{}}',
                "-1": 'CpcVm: Improper argument in 0: BORDER -1 -- {"reason":"error","priority":50,"paras":{}}',
                "32 ": 'CpcVm: Improper argument in 0: BORDER 32 -- {"reason":"error","priority":50,"paras":{}}'
            },
            call: {
                "0 ": "",
                "0xbb00": "resetCpcKeysExpansions: , clearInput: , resetExpansionTokens:",
                "0xbb03": "clearInput: , resetExpansionTokens:",
                "0xbb06": "getKeyFromBuffer:",
                "0xbb0c": "putKeyInBuffer:\x00 , getKeyDownHandler:",
                "0xbb0c,1,1,1,1,1,1,1,1,1": "putKeyInBuffer:\x09 , getKeyDownHandler:",
                "0xbb0c,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32": "putKeyInBuffer:  , getKeyDownHandler:",
                "0xbb0c,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33": 'CpcVm: Syntax Error in 0: CALL  -- {"reason":"error","priority":50,"paras":{}}',
                "0xffff": "",
                "-32767": "",
                "0,0": "",
                "0,-128": "",
                "0,-32768": "",
                "": 'CpcVm: Type mismatch in 0: CALL undefined -- {"reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Type mismatch in 0: CALL  -- {"reason":"error","priority":50,"paras":{}}',
                "65536 ": 'CpcVm: Overflow in 0: CALL 65536 -- {"reason":"error","priority":50,"paras":{}}',
                "-32769": 'CpcVm: Overflow in 0: CALL -32769 -- {"reason":"error","priority":50,"paras":{}}',
                "0,-32769": 'CpcVm: Overflow in 0: CALL -32769 -- {"reason":"error","priority":50,"paras":{}}',
                "0,65536": 'CpcVm: Overflow in 0: CALL 65536 -- {"reason":"error","priority":50,"paras":{}}'
            },
            cat: {
                "": '{"reason":"fileCat","priority":45,"paras":{"command":"cat","stream":0,"fileMask":"","line":0}}'
            },
            chain: {
                '"file1"': '{"reason":"fileLoad","priority":90,"paras":{}} -- {"open":true,"command":"chain","name":"file1","line":0,"start":0,"fileData":[],"first":0,"last":0,"memorizedExample":""}',
                '"file1",123': '{"reason":"fileLoad","priority":90,"paras":{}} -- {"open":true,"command":"chain","name":"file1","line":123,"start":0,"fileData":[],"first":0,"last":0,"memorizedExample":""}',
                "": 'CpcVm: Type mismatch in 0: CHAIN undefined -- {"reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Broken in 0: Bad filename:  -- {"reason":"error","priority":50,"paras":{}}',
                "7 ": 'CpcVm: Type mismatch in 0: CHAIN 7 -- {"reason":"error","priority":50,"paras":{}}'
            },
            chainMerge: {
                '"file1"': '{"reason":"fileLoad","priority":90,"paras":{}} -- {"open":true,"command":"chainMerge","name":"file1","line":0,"start":0,"fileData":[],"first":0,"last":0,"memorizedExample":""}',
                '"file1",123': '{"reason":"fileLoad","priority":90,"paras":{}} -- {"open":true,"command":"chainMerge","name":"file1","line":123,"start":0,"fileData":[],"first":0,"last":0,"memorizedExample":""}',
                '"file1",123,10': '{"reason":"fileLoad","priority":90,"paras":{}} -- {"open":true,"command":"chainMerge","name":"file1","line":123,"start":0,"fileData":[],"first":10,"last":0,"memorizedExample":""}',
                '"file1",123,20': '{"reason":"fileLoad","priority":90,"paras":{}} -- {"open":true,"command":"chainMerge","name":"file1","line":123,"start":0,"fileData":[],"first":20,"last":0,"memorizedExample":""}',
                "": 'CpcVm: Type mismatch in 0: CHAIN MERGE undefined -- {"reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Broken in 0: Bad filename:  -- {"reason":"error","priority":50,"paras":{}}',
                "7 ": 'CpcVm: Type mismatch in 0: CHAIN MERGE 7 -- {"reason":"error","priority":50,"paras":{}}'
            },
            chr$: {
                "0 ": "\x00",
                "65 ": "A",
                "65,66": "A",
                "255 ": "\xff",
                "": 'CpcVm: Type mismatch in 0: CHR$ undefined -- {"reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Type mismatch in 0: CHR$  -- {"reason":"error","priority":50,"paras":{}}',
                "-1": 'CpcVm: Improper argument in 0: CHR$ -1 -- {"reason":"error","priority":50,"paras":{}}',
                "256 ": 'CpcVm: Improper argument in 0: CHR$ 256 -- {"reason":"error","priority":50,"paras":{}}'
            },
            cint: {
                "0 ": "0",
                "1.49 ": "1",
                "1.5 ": "2",
                "-1.49 ": "-1",
                "-1.5 ": "-2",
                "": 'CpcVm: Type mismatch in 0: CINT undefined -- {"reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Type mismatch in 0: CINT  -- {"reason":"error","priority":50,"paras":{}}',
                "32767.49 ": "32767",
                "32767.5 ": 'CpcVm: Overflow in 0: CINT 32768 -- {"reason":"error","priority":50,"paras":{}}',
                "-32768.49": "-32768",
                "-32768.5": 'CpcVm: Overflow in 0: CINT -32769 -- {"reason":"error","priority":50,"paras":{}}'
            },
            clearInput: {
                "": "clearInput:"
            },
            clg: {
                "": "clearGraphicsWindow:",
                "0 ": "setGPaper:0 , clearGraphicsWindow:",
                "15.4 ": "setGPaper:15 , clearGraphicsWindow:",
                '""': 'CpcVm: Type mismatch in 0: CLG  -- {"reason":"error","priority":50,"paras":{}}',
                "-0.6": 'CpcVm: Improper argument in 0: CLG -1 -- {"reason":"error","priority":50,"paras":{}}',
                "16 ": 'CpcVm: Improper argument in 0: CLG 16 -- {"reason":"error","priority":50,"paras":{}}'
            },
            closein: {
                "": '{"open":false,"command":"","name":"name1","line":0,"start":0,"fileData":[],"first":0,"last":0,"memorizedExample":""}'
            },
            closeout: {
                '"_testCase1"': "",
                '"_testCase2"': '{"open":false,"command":"","name":"name1","line":0,"start":0,"fileData":[],"stream":0,"typeString":"","length":0,"entry":0}',
                '"_testCase3"': '{"reason":"fileSave","priority":90,"paras":{}} -- {"open":true,"command":"closeout","name":"name1","line":0,"start":0,"fileData":["A"],"stream":0,"typeString":"","length":0,"entry":0}'
            },
            cls: {
                "0 ": 'clearTextWindow:0,39,0,24,0 -- {"left":0,"right":39,"top":0,"bottom":24,"pos":0,"vpos":0,"textEnabled":true,"tag":false,"transparent":false,"cursorOn":false,"cursorEnabled":true,"pen":1,"paper":0}',
                "6.7 ": 'clearTextWindow:0,39,0,24,0 -- {"left":0,"right":39,"top":0,"bottom":24,"pos":0,"vpos":0,"textEnabled":true,"tag":false,"transparent":false,"cursorOn":false,"cursorEnabled":true,"pen":1,"paper":0}',
                "": 'CpcVm: Type mismatch in 0: CLS undefined -- {"reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Type mismatch in 0: CLS  -- {"reason":"error","priority":50,"paras":{}}',
                "8 ": 'CpcVm: Improper argument in 0: CLS 8 -- {"reason":"error","priority":50,"paras":{}}'
            },
            cont: {
                '"_testCase1"': "",
                '"_testCase2"': 'CpcVm: Cannot CONTinue in 0: CONT -- {"reason":"error","priority":50,"paras":{}}'
            },
            copychr$: {
                "0 ": "readChar:2,3,1,0 -- A",
                "7 ": "readChar:2,3,1,0 -- A",
                "": 'CpcVm: Type mismatch in 0: COPYCHR$ undefined -- {"reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Type mismatch in 0: COPYCHR$  -- {"reason":"error","priority":50,"paras":{}}',
                "-1": 'CpcVm: Improper argument in 0: COPYCHR$ -1 -- {"reason":"error","priority":50,"paras":{}}',
                "7.9 ": 'CpcVm: Improper argument in 0: COPYCHR$ 8 -- {"reason":"error","priority":50,"paras":{}}'
            },
            cos: {
                "0 ": "1",
                "3.14159265 ": "-1",
                "": 'CpcVm: Type mismatch in 0: COS undefined -- {"reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Type mismatch in 0: COS  -- {"reason":"error","priority":50,"paras":{}}'
            },
            cosDeg: {
                "0 ": "1",
                "180 ": "-1"
            },
            creal: {
                "0 ": "0",
                "1.49 ": "1.49",
                "-1.5 ": "-1.5",
                "": 'CpcVm: Type mismatch in 0: CREAL undefined -- {"reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Type mismatch in 0: CREAL  -- {"reason":"error","priority":50,"paras":{}}'
            },
            cursor: {
                "0 ": "",
                "7 ": "",
                "0,1": "drawCursor:2,3,1,0",
                "0,,1": "",
                "0,1,1": "drawCursor:2,3,1,0 , drawCursor:2,3,1,0 , drawCursor:2,3,1,0",
                "-1": 'CpcVm: Improper argument in 0: CURSOR -1 -- {"reason":"error","priority":50,"paras":{}}',
                "8 ": 'CpcVm: Improper argument in 0: CURSOR 8 -- {"reason":"error","priority":50,"paras":{}}',
                "0,-1": 'CpcVm: Improper argument in 0: CURSOR -1 -- {"reason":"error","priority":50,"paras":{}}',
                "0,2": 'CpcVm: Improper argument in 0: CURSOR 2 -- {"reason":"error","priority":50,"paras":{}}',
                "0,,-1": 'CpcVm: Improper argument in 0: CURSOR -1 -- {"reason":"error","priority":50,"paras":{}}',
                "0,,2": 'CpcVm: Improper argument in 0: CURSOR 2 -- {"reason":"error","priority":50,"paras":{}}',
                "": 'CpcVm: Type mismatch in 0: CURSOR undefined -- {"reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Type mismatch in 0: CURSOR  -- {"reason":"error","priority":50,"paras":{}}',
                '0,""': 'CpcVm: Type mismatch in 0: CURSOR  -- {"reason":"error","priority":50,"paras":{}}',
                '0,,""': 'CpcVm: Type mismatch in 0: CURSOR  -- {"reason":"error","priority":50,"paras":{}}'
            },
            dec$: {
                '3,"###.##"': "  3.00",
                '2.9949,"#.##"': "2.99",
                "": 'CpcVm: Type mismatch in 0: DEC$ undefined -- {"reason":"error","priority":50,"paras":{}}',
                '"",': 'CpcVm: Type mismatch in 0: DEC$  -- {"reason":"error","priority":50,"paras":{}}',
                "3,7 ": 'CpcVm: Type mismatch in 0: DEC$ 7 -- {"reason":"error","priority":50,"paras":{}}'
            },
            defint: {
                '"a"': '{"a":"I"}',
                '"b-d"': '{"b":"I","c":"I","d":"I"}',
                '"B-D"': '{"b":"I","c":"I","d":"I"}',
                '"x - z"': '{"x":"I","y":"I","z":"I"}',
                '"aa"': '{"a":"I"}',
                "": 'CpcVm: Type mismatch in 0: DEFINT undefined -- {"reason":"error","priority":50,"paras":{}}',
                '""': "{}",
                '"b-"': "{}",
                "1 ": 'CpcVm: Type mismatch in 0: DEFINT 1 -- {"reason":"error","priority":50,"paras":{}}'
            },
            defreal: {
                '"a"': '{"a":"R"}',
                '"b-d"': '{"b":"R","c":"R","d":"R"}',
                '"B-D"': '{"b":"R","c":"R","d":"R"}',
                '"x - z"': '{"x":"R","y":"R","z":"R"}',
                '"aa"': '{"a":"R"}',
                "": 'CpcVm: Type mismatch in 0: DEFREAL undefined -- {"reason":"error","priority":50,"paras":{}}',
                '""': "{}",
                '"b-"': "{}",
                "1 ": 'CpcVm: Type mismatch in 0: DEFREAL 1 -- {"reason":"error","priority":50,"paras":{}}'
            },
            defstr: {
                '"a"': '{"a":"$"}',
                '"b-d"': '{"b":"$","c":"$","d":"$"}',
                '"B-D"': '{"b":"$","c":"$","d":"$"}',
                '"x - z"': '{"x":"$","y":"$","z":"$"}',
                '"aa"': '{"a":"$"}',
                '"b-"': "{}",
                '""': "{}",
                "": 'CpcVm: Type mismatch in 0: DEFSTR undefined -- {"reason":"error","priority":50,"paras":{}}',
                "1 ": 'CpcVm: Type mismatch in 0: DEFSTR 1 -- {"reason":"error","priority":50,"paras":{}}'
            },
            "delete": {
                "": '{"reason":"deleteLines","priority":85,"paras":{"command":"DELETE","stream":0,"first":1,"last":65535,"line":0}}',
                "1 ": '{"reason":"deleteLines","priority":85,"paras":{"command":"DELETE","stream":0,"first":1,"last":1,"line":0}}',
                "65535.2 ": '{"reason":"deleteLines","priority":85,"paras":{"command":"DELETE","stream":0,"first":65535,"last":65535,"line":0}}',
                "65536 ": 'CpcVm: Overflow in 0: DELETE 65536 -- {"reason":"error","priority":50,"paras":{}}',
                "1,123": '{"reason":"deleteLines","priority":85,"paras":{"command":"DELETE","stream":0,"first":1,"last":123,"line":0}}',
                ",123": '{"reason":"deleteLines","priority":85,"paras":{"command":"DELETE","stream":0,"first":1,"last":123,"line":0}}',
                ",65536": 'CpcVm: Overflow in 0: DELETE 65536 -- {"reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Type mismatch in 0: DELETE  -- {"reason":"error","priority":50,"paras":{}}'
            },
            derr: {
                "": "0"
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
                "": 'CpcVm: Type mismatch in 0: DRAW undefined -- {"reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Type mismatch in 0: DRAW  -- {"reason":"error","priority":50,"paras":{}}',
                "32768,0": 'CpcVm: Overflow in 0: DRAW 32768 -- {"reason":"error","priority":50,"paras":{}}',
                "-32769,0": 'CpcVm: Overflow in 0: DRAW -32769 -- {"reason":"error","priority":50,"paras":{}}',
                "0,32768": 'CpcVm: Overflow in 0: DRAW 32768 -- {"reason":"error","priority":50,"paras":{}}',
                "0,-32769": 'CpcVm: Overflow in 0: DRAW -32769 -- {"reason":"error","priority":50,"paras":{}}',
                ",0": 'CpcVm: Type mismatch in 0: DRAW undefined -- {"reason":"error","priority":50,"paras":{}}',
                "10,20,-1": 'CpcVm: Improper argument in 0: DRAW -1 -- {"reason":"error","priority":50,"paras":{}}',
                "10,20,16": 'CpcVm: Improper argument in 0: DRAW 16 -- {"reason":"error","priority":50,"paras":{}}',
                "10,20,0,-1": 'setGPen:0 -- CpcVm: Improper argument in 0: DRAW -1 -- {"reason":"error","priority":50,"paras":{}}',
                "10,20,0,4": 'setGPen:0 -- CpcVm: Improper argument in 0: DRAW 4 -- {"reason":"error","priority":50,"paras":{}}'
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
                "": 'CpcVm: Type mismatch in 0: DRAWR undefined -- {"reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Type mismatch in 0: DRAWR  -- {"reason":"error","priority":50,"paras":{}}',
                "32768,0": 'CpcVm: Overflow in 0: DRAWR 32768 -- {"reason":"error","priority":50,"paras":{}}',
                "-32769,0": 'CpcVm: Overflow in 0: DRAWR -32769 -- {"reason":"error","priority":50,"paras":{}}',
                "0,32768": 'getXpos: -- CpcVm: Overflow in 0: DRAWR 32768 -- {"reason":"error","priority":50,"paras":{}}',
                "0,-32769": 'getXpos: -- CpcVm: Overflow in 0: DRAWR -32769 -- {"reason":"error","priority":50,"paras":{}}',
                ",0": 'CpcVm: Type mismatch in 0: DRAWR undefined -- {"reason":"error","priority":50,"paras":{}}',
                "10,20,-1": 'getXpos: , getYpos: -- CpcVm: Improper argument in 0: DRAWR -1 -- {"reason":"error","priority":50,"paras":{}}',
                "10,20,16": 'getXpos: , getYpos: -- CpcVm: Improper argument in 0: DRAWR 16 -- {"reason":"error","priority":50,"paras":{}}',
                "10,20,0,-1": 'getXpos: , getYpos: , setGPen:0 -- CpcVm: Improper argument in 0: DRAWR -1 -- {"reason":"error","priority":50,"paras":{}}',
                "10,20,0,4": 'getXpos: , getYpos: , setGPen:0 -- CpcVm: Improper argument in 0: DRAWR 4 -- {"reason":"error","priority":50,"paras":{}}'
            },
            edit: {
                "": '{"reason":"editLine","priority":85,"paras":{"command":"edit","stream":0,"last":0,"line":0}}',
                "123 ": '{"reason":"editLine","priority":85,"paras":{"command":"edit","stream":0,"first":123,"last":0,"line":0}}'
            },
            eof: {
                '"_testCase1"': "-1",
                '"_testCase2"': '-1 -- {"open":true,"command":"","name":"","line":0,"start":0,"fileData":[],"first":0,"last":0,"memorizedExample":""}',
                '"_testCase3"': '0 -- {"open":true,"command":"","name":"","line":0,"start":0,"fileData":["A"],"first":0,"last":0,"memorizedExample":""}'
            },
            erl: {
                "": "123"
            },
            err: {
                "": "31"
            },
            everyGosub: {
                "0,0,123": '{"active":false}',
                "0.5,0,123": '{"active":true,"intervalMs":20,"line":123,"repeat":true}',
                "32767.4,0,123": '{"active":true,"intervalMs":655340,"line":123,"repeat":true}',
                "10,1,123": '{"intervalMs":200,"line":123,"repeat":true,"active":true}',
                "10,3.4,123": '{"intervalMs":200,"line":123,"repeat":true,"active":true}',
                "": 'CpcVm: Type mismatch in 0: EVERY undefined -- {"reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Type mismatch in 0: EVERY  -- {"reason":"error","priority":50,"paras":{}}',
                "-1,0,123": 'CpcVm: Improper argument in 0: EVERY -1 -- {"reason":"error","priority":50,"paras":{}}',
                "32768,0,123": 'CpcVm: Overflow in 0: EVERY 32768 -- {"reason":"error","priority":50,"paras":{}}',
                "10,-1,123": 'CpcVm: Improper argument in 0: EVERY -1 -- {"reason":"error","priority":50,"paras":{}}',
                "10,3.9,123": 'CpcVm: Improper argument in 0: EVERY 4 -- {"reason":"error","priority":50,"paras":{}}'
            },
            fill: {
                "0 ": "fill:0",
                "15.4 ": "fill:15",
                "": 'CpcVm: Type mismatch in 0: FILL undefined -- {"reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Type mismatch in 0: FILL  -- {"reason":"error","priority":50,"paras":{}}',
                "-1": 'CpcVm: Improper argument in 0: FILL -1 -- {"reason":"error","priority":50,"paras":{}}',
                "16 ": 'CpcVm: Improper argument in 0: FILL 16 -- {"reason":"error","priority":50,"paras":{}}'
            },
            fix: {
                "0 ": "0",
                "2.77 ": "2",
                "-2.3": "-2",
                "123.466 ": "123",
                "": 'CpcVm: Type mismatch in 0: FIX undefined -- {"reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Type mismatch in 0: FIX  -- {"reason":"error","priority":50,"paras":{}}'
            },
            frame: {
                "": '{"reason":"waitFrame","priority":40,"paras":{}}'
            },
            fre: {
                '"_testCase1",0': "42747",
                '"_testCase2",""': "370",
                '"_testCase1"': 'CpcVm: Syntax Error in 0: FRE -- {"reason":"error","priority":50,"paras":{}}',
                '"_testCase2"': 'CpcVm: Syntax Error in 0: FRE -- {"reason":"error","priority":50,"paras":{}}'
            },
            graphicsPaper: {
                "0 ": "setGPaper:0",
                "15.4 ": "setGPaper:15",
                "": 'CpcVm: Type mismatch in 0: GRAPHICS PAPER undefined -- {"reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Type mismatch in 0: GRAPHICS PAPER  -- {"reason":"error","priority":50,"paras":{}}',
                "-0.6": 'CpcVm: Improper argument in 0: GRAPHICS PAPER -1 -- {"reason":"error","priority":50,"paras":{}}',
                "16 ": 'CpcVm: Improper argument in 0: GRAPHICS PAPER 16 -- {"reason":"error","priority":50,"paras":{}}'
            },
            graphicsPen: {
                "0 ": "setGPen:0",
                "15.4 ": "setGPen:15",
                "0,0": "setGPen:0 , setGTransparentMode:false",
                "0,1": "setGPen:0 , setGTransparentMode:true",
                ",1": "setGTransparentMode:true",
                "": 'CpcVm: Operand missing in 0: GRAPHICS PEN -- {"reason":"error","priority":50,"paras":{}}',
                ",": 'CpcVm: Operand missing in 0: GRAPHICS PEN -- {"reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Type mismatch in 0: GRAPHICS PEN  -- {"reason":"error","priority":50,"paras":{}}',
                "-0.6": 'CpcVm: Improper argument in 0: GRAPHICS PEN -1 -- {"reason":"error","priority":50,"paras":{}}',
                "16 ": 'CpcVm: Improper argument in 0: GRAPHICS PEN 16 -- {"reason":"error","priority":50,"paras":{}}'
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
                "": 'CpcVm: Type mismatch in 0: HEX$ undefined -- {"reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Type mismatch in 0: HEX$  -- {"reason":"error","priority":50,"paras":{}}',
                "65536 ": 'CpcVm: Overflow in 0: HEX$ 65536 -- {"reason":"error","priority":50,"paras":{}}',
                "65535,17": 'CpcVm: Improper argument in 0: HEX$ 17 -- {"reason":"error","priority":50,"paras":{}}',
                "-32769": 'CpcVm: Overflow in 0: HEX$ -32769 -- {"reason":"error","priority":50,"paras":{}}'
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
                "": 'CpcVm: Type mismatch in 0: INK undefined -- {"reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Type mismatch in 0: INK  -- {"reason":"error","priority":50,"paras":{}}',
                "-1,0": 'CpcVm: Improper argument in 0: INK -1 -- {"reason":"error","priority":50,"paras":{}}',
                "16,0": 'CpcVm: Improper argument in 0: INK 16 -- {"reason":"error","priority":50,"paras":{}}',
                "0,-1": 'CpcVm: Improper argument in 0: INK -1 -- {"reason":"error","priority":50,"paras":{}}',
                "0,32": 'CpcVm: Improper argument in 0: INK 32 -- {"reason":"error","priority":50,"paras":{}}',
                "0,0,-1": 'CpcVm: Improper argument in 0: INK -1 -- {"reason":"error","priority":50,"paras":{}}',
                "0,0,32": 'CpcVm: Improper argument in 0: INK 32 -- {"reason":"error","priority":50,"paras":{}}'
            },
            inkey: {
                "0 ": "getKeyState:0 -- -1",
                "79.2 ": "getKeyState:79 -- 13",
                "": 'CpcVm: Type mismatch in 0: INKEY undefined -- {"reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Type mismatch in 0: INKEY  -- {"reason":"error","priority":50,"paras":{}}',
                "-1": 'CpcVm: Improper argument in 0: INKEY -1 -- {"reason":"error","priority":50,"paras":{}}',
                "80 ": 'CpcVm: Improper argument in 0: INKEY 80 -- {"reason":"error","priority":50,"paras":{}}'
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
                "": 'CpcVm: Type mismatch in 0: INP undefined -- {"reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Type mismatch in 0: INP  -- {"reason":"error","priority":50,"paras":{}}',
                "65536 ": 'CpcVm: Overflow in 0: INP 65536 -- {"reason":"error","priority":50,"paras":{}}',
                "-32769": 'CpcVm: Overflow in 0: INP -32769 -- {"reason":"error","priority":50,"paras":{}}'
            },
            "int": {
                "0 ": "0",
                "1 ": "1",
                "2.7 ": "2",
                "-2.3": "-3",
                "": 'CpcVm: Type mismatch in 0: INT undefined -- {"reason":"error","priority":50,"paras":{}}',
                '"0"': 'CpcVm: Type mismatch in 0: INT 0 -- {"reason":"error","priority":50,"paras":{}}'
            },
            joy: {
                "0 ": "getJoyState:0 -- 4",
                "1 ": "getJoyState:1 -- 5",
                "": 'CpcVm: Type mismatch in 0: JOY undefined -- {"reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Type mismatch in 0: JOY  -- {"reason":"error","priority":50,"paras":{}}',
                "-1": 'CpcVm: Improper argument in 0: JOY -1 -- {"reason":"error","priority":50,"paras":{}}',
                "2 ": 'CpcVm: Improper argument in 0: JOY 2 -- {"reason":"error","priority":50,"paras":{}}'
            },
            memory: {
                "0 ": 'CpcVm: Memory full in 0: MEMORY 0 -- {"reason":"error","priority":50,"paras":{}}',
                "370 ": "370",
                "32767.2 ": "32767",
                "-32768": "32768",
                "65535 ": 'CpcVm: Memory full in 0: MEMORY 65535 -- {"reason":"error","priority":50,"paras":{}}',
                "-1": 'CpcVm: Memory full in 0: MEMORY 65535 -- {"reason":"error","priority":50,"paras":{}}',
                "": 'CpcVm: Type mismatch in 0: MEMORY undefined -- {"reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Type mismatch in 0: MEMORY  -- {"reason":"error","priority":50,"paras":{}}',
                "65536 ": 'CpcVm: Overflow in 0: MEMORY 65536 -- {"reason":"error","priority":50,"paras":{}}',
                "-32769": 'CpcVm: Overflow in 0: MEMORY -32769 -- {"reason":"error","priority":50,"paras":{}}'
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
                "": 'CpcVm: Type mismatch in 0: MOVE undefined -- {"reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Type mismatch in 0: MOVE  -- {"reason":"error","priority":50,"paras":{}}',
                "32768,0": 'CpcVm: Overflow in 0: MOVE 32768 -- {"reason":"error","priority":50,"paras":{}}',
                "-32769,0": 'CpcVm: Overflow in 0: MOVE -32769 -- {"reason":"error","priority":50,"paras":{}}',
                "0,32768": 'CpcVm: Overflow in 0: MOVE 32768 -- {"reason":"error","priority":50,"paras":{}}',
                "0,-32769": 'CpcVm: Overflow in 0: MOVE -32769 -- {"reason":"error","priority":50,"paras":{}}',
                ",0": 'CpcVm: Type mismatch in 0: MOVE undefined -- {"reason":"error","priority":50,"paras":{}}',
                "10,20,-1": 'CpcVm: Improper argument in 0: MOVE -1 -- {"reason":"error","priority":50,"paras":{}}',
                "10,20,16": 'CpcVm: Improper argument in 0: MOVE 16 -- {"reason":"error","priority":50,"paras":{}}',
                "10,20,0,-1": 'setGPen:0 -- CpcVm: Improper argument in 0: MOVE -1 -- {"reason":"error","priority":50,"paras":{}}',
                "10,20,0,4": 'setGPen:0 -- CpcVm: Improper argument in 0: MOVE 4 -- {"reason":"error","priority":50,"paras":{}}'
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
                "": 'CpcVm: Type mismatch in 0: MOVER undefined -- {"reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Type mismatch in 0: MOVER  -- {"reason":"error","priority":50,"paras":{}}',
                "32768,0": 'CpcVm: Overflow in 0: MOVER 32768 -- {"reason":"error","priority":50,"paras":{}}',
                "-32769,0": 'CpcVm: Overflow in 0: MOVER -32769 -- {"reason":"error","priority":50,"paras":{}}',
                "0,32768": 'getXpos: -- CpcVm: Overflow in 0: MOVER 32768 -- {"reason":"error","priority":50,"paras":{}}',
                "0,-32769": 'getXpos: -- CpcVm: Overflow in 0: MOVER -32769 -- {"reason":"error","priority":50,"paras":{}}',
                ",0": 'CpcVm: Type mismatch in 0: MOVER undefined -- {"reason":"error","priority":50,"paras":{}}',
                "10,20,-1": 'getXpos: , getYpos: -- CpcVm: Improper argument in 0: MOVER -1 -- {"reason":"error","priority":50,"paras":{}}',
                "10,20,16": 'getXpos: , getYpos: -- CpcVm: Improper argument in 0: MOVER 16 -- {"reason":"error","priority":50,"paras":{}}',
                "10,20,0,-1": 'getXpos: , getYpos: , setGPen:0 -- CpcVm: Improper argument in 0: MOVER -1 -- {"reason":"error","priority":50,"paras":{}}',
                "10,20,0,4": 'getXpos: , getYpos: , setGPen:0 -- CpcVm: Improper argument in 0: MOVER 4 -- {"reason":"error","priority":50,"paras":{}}'
            },
            "new": {
                "": 'resetQueue: -- {"reason":"new","priority":90,"paras":{"command":"new","stream":0,"first":0,"last":0,"line":0}}'
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
                "": 'CpcVm: Type mismatch in 0: PLOT undefined -- {"reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Type mismatch in 0: PLOT  -- {"reason":"error","priority":50,"paras":{}}',
                "32768,0": 'CpcVm: Overflow in 0: PLOT 32768 -- {"reason":"error","priority":50,"paras":{}}',
                "-32769,0": 'CpcVm: Overflow in 0: PLOT -32769 -- {"reason":"error","priority":50,"paras":{}}',
                "0,32768": 'CpcVm: Overflow in 0: PLOT 32768 -- {"reason":"error","priority":50,"paras":{}}',
                "0,-32769": 'CpcVm: Overflow in 0: PLOT -32769 -- {"reason":"error","priority":50,"paras":{}}',
                ",0": 'CpcVm: Type mismatch in 0: PLOT undefined -- {"reason":"error","priority":50,"paras":{}}',
                "10,20,-1": 'CpcVm: Improper argument in 0: PLOT -1 -- {"reason":"error","priority":50,"paras":{}}',
                "10,20,16": 'CpcVm: Improper argument in 0: PLOT 16 -- {"reason":"error","priority":50,"paras":{}}',
                "10,20,0,-1": 'setGPen:0 -- CpcVm: Improper argument in 0: PLOT -1 -- {"reason":"error","priority":50,"paras":{}}',
                "10,20,0,4": 'setGPen:0 -- CpcVm: Improper argument in 0: PLOT 4 -- {"reason":"error","priority":50,"paras":{}}'
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
                "": 'CpcVm: Type mismatch in 0: PLOTR undefined -- {"reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Type mismatch in 0: PLOTR  -- {"reason":"error","priority":50,"paras":{}}',
                "32768,0": 'CpcVm: Overflow in 0: PLOTR 32768 -- {"reason":"error","priority":50,"paras":{}}',
                "-32769,0": 'CpcVm: Overflow in 0: PLOTR -32769 -- {"reason":"error","priority":50,"paras":{}}',
                "0,32768": 'getXpos: -- CpcVm: Overflow in 0: PLOTR 32768 -- {"reason":"error","priority":50,"paras":{}}',
                "0,-32769": 'getXpos: -- CpcVm: Overflow in 0: PLOTR -32769 -- {"reason":"error","priority":50,"paras":{}}',
                ",0": 'CpcVm: Type mismatch in 0: PLOTR undefined -- {"reason":"error","priority":50,"paras":{}}',
                "10,20,-1": 'getXpos: , getYpos: -- CpcVm: Improper argument in 0: PLOTR -1 -- {"reason":"error","priority":50,"paras":{}}',
                "10,20,16": 'getXpos: , getYpos: -- CpcVm: Improper argument in 0: PLOTR 16 -- {"reason":"error","priority":50,"paras":{}}',
                "10,20,0,-1": 'getXpos: , getYpos: , setGPen:0 -- CpcVm: Improper argument in 0: PLOTR -1 -- {"reason":"error","priority":50,"paras":{}}',
                "10,20,0,4": 'getXpos: , getYpos: , setGPen:0 -- CpcVm: Improper argument in 0: PLOTR 4 -- {"reason":"error","priority":50,"paras":{}}'
            },
            renum: {
                "": '{"reason":"renumLines","priority":85,"paras":{"command":"renum","stream":0,"line":0,"newLine":10,"oldLine":1,"step":10,"keep":65535}}',
                "10 ": '{"reason":"renumLines","priority":85,"paras":{"command":"renum","stream":0,"line":0,"newLine":10,"oldLine":1,"step":10,"keep":65535}}',
                "100,90,15,9000": '{"reason":"renumLines","priority":85,"paras":{"command":"renum","stream":0,"line":0,"newLine":100,"oldLine":90,"step":15,"keep":9000}}',
                '""': 'CpcVm: Type mismatch in 0: RENUM  -- {"reason":"error","priority":50,"paras":{}}'
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
                "": 'CpcVm: Type mismatch in 0: TEST undefined -- {"reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Type mismatch in 0: TEST  -- {"reason":"error","priority":50,"paras":{}}',
                "32768,0": 'CpcVm: Overflow in 0: TEST 32768 -- {"reason":"error","priority":50,"paras":{}}',
                "-32769,0": 'CpcVm: Overflow in 0: TEST -32769 -- {"reason":"error","priority":50,"paras":{}}',
                "0,32768": 'CpcVm: Overflow in 0: TEST 32768 -- {"reason":"error","priority":50,"paras":{}}',
                "0,-32769": 'CpcVm: Overflow in 0: TEST -32769 -- {"reason":"error","priority":50,"paras":{}}',
                ",0": 'CpcVm: Type mismatch in 0: TEST undefined -- {"reason":"error","priority":50,"paras":{}}'
            },
            testr: {
                "0,0": "getXpos: , getYpos: , test:10,20 -- 10",
                "-32768,0": "getXpos: , getYpos: , test:-32758,20 -- -6",
                "32767,0": "getXpos: , getYpos: , test:32777,20 -- 9",
                "0,-32768": "getXpos: , getYpos: , test:10,-32748 -- 10",
                "0,32767": "getXpos: , getYpos: , test:10,32787 -- 10",
                "": 'CpcVm: Type mismatch in 0: TESTR undefined -- {"reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Type mismatch in 0: TESTR  -- {"reason":"error","priority":50,"paras":{}}',
                "32768,0": 'CpcVm: Overflow in 0: TESTR 32768 -- {"reason":"error","priority":50,"paras":{}}',
                "-32769,0": 'CpcVm: Overflow in 0: TESTR -32769 -- {"reason":"error","priority":50,"paras":{}}',
                "0,32768": 'getXpos: -- CpcVm: Overflow in 0: TESTR 32768 -- {"reason":"error","priority":50,"paras":{}}',
                "0,-32769": 'getXpos: -- CpcVm: Overflow in 0: TESTR -32769 -- {"reason":"error","priority":50,"paras":{}}',
                ",0": 'CpcVm: Type mismatch in 0: TESTR undefined -- {"reason":"error","priority":50,"paras":{}}'
            },
            unt: {
                "0 ": "0",
                "255 ": "255",
                "32767.2 ": "32767",
                "65535 ": "-1",
                "-1": "-1",
                "-32768": "-32768",
                "": 'CpcVm: Type mismatch in 0: UNT undefined -- {"reason":"error","priority":50,"paras":{}}',
                '""': 'CpcVm: Type mismatch in 0: UNT  -- {"reason":"error","priority":50,"paras":{}}',
                "65536 ": 'CpcVm: Overflow in 0: UNT 65536 -- {"reason":"error","priority":50,"paras":{}}',
                "-32769": 'CpcVm: Overflow in 0: UNT -32769 -- {"reason":"error","priority":50,"paras":{}}'
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
            /*
            drawr: function (...args) {
                lastTestFunctions.push({
                    drawr: args
                });
            },
            */
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
            /*
            mover: function (...args) {
                lastTestFunctions.push({
                    mover: args
                });
            },
            */
            plot: function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                lastTestFunctions.push({
                    plot: args
                });
            },
            /*
            plotr: function (...args) {
                lastTestFunctions.push({
                    plotr: args
                });
            },
            */
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
            setBorder: function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                lastTestFunctions.push({
                    setBorder: args
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
            test: function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                lastTestFunctions.push({
                    test: args
                });
                return Number(args[0]) % 16; // example
            }
            /*
            testr: function (...args) {
                lastTestFunctions.push({
                    testr: args
                });
                return Number(args[0]) % 16; // example
            }
            */
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
            }
        }, mockVariables = {
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
                var timer = Number(cpcVm.vmRound(Number(input[1]))), timerEntry = cpcVm.vmInternal.getTimerList.call(cpcVm)[timer];
                timerEntry.nextTimeMs = undefined;
                return JSON.stringify(timerEntry);
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
                //return combineLastTestFunctions();
            },
            call: function (cpcVm, input) {
                cpcVm.call.apply(cpcVm, input);
                //combineLastTestFunctions();
            },
            cat: function (cpcVm, input) {
                cpcVm.cat.apply(cpcVm, input);
                // stopObject changed
            },
            chain: function (cpcVm, input) {
                cpcVm.chain.apply(cpcVm, input);
                // stopObject and fileObject changed
            },
            chainMerge: function (cpcVm, input) {
                cpcVm.chainMerge.apply(cpcVm, input);
                // stopObject and fileObject changed
            },
            chr$: function (cpcVm, input) {
                return cpcVm.chr$.apply(cpcVm, input);
            },
            cint: function (cpcVm, input) {
                return String(cpcVm.cint.apply(cpcVm, input));
            },
            clearInput: function (cpcVm, input) {
                cpcVm.clearInput.apply(cpcVm, input);
                //return combineLastTestFunctions();
            },
            clg: function (cpcVm, input) {
                cpcVm.clg.apply(cpcVm, input);
                //return combineLastTestFunctions();
            },
            closein: function (cpcVm, input) {
                var inFile = cpcVm.vmGetInFileObject();
                inFile.open = true;
                inFile.command = "test1";
                inFile.name = "name1";
                cpcVm.closein.apply(cpcVm, input);
                // fileObject changed
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
                // stopObject and fileObject for some tests changed
            },
            cls: function (cpcVm, input) {
                var stream = getValidStream(cpcVm, Number(input));
                cpcVm.vmChangeMode(1);
                cpcVm.vmResetWindowData(true); // prepare
                cpcVm.locate(stream, 2 + 1, 3 + 1);
                /*
                const stream = cpcVm.vmRound(Number(input)),
                    win = cpcVm.vmInternal.getWindowDataList.call(cpcVm)[stream];
    
                if (win) {
                    win.pos = 2;
                    win.vpos = 3;
                }
                */
                clearLastTestFunctions(); // test only cls
                cpcVm.cls.apply(cpcVm, input);
                var win = cpcVm.vmInternal.getWindowDataList.call(cpcVm)[stream];
                return JSON.stringify(win);
                //combineLastTestFunctions()
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
                // stopObject changed
            },
            copychr$: function (cpcVm, input) {
                var stream = getValidStream(cpcVm, Number(input));
                cpcVm.vmChangeMode(1);
                cpcVm.vmResetWindowData(true); // prepare
                cpcVm.locate(stream, 2 + 1, 3 + 1);
                /*
                const stream = cpcVm.vmRound(Number(input)),
                    win = cpcVm.vmInternal.getWindowDataList.call(cpcVm)[stream];
    
                if (win) {
                    win.pos = 2;
                    win.vpos = 3;
                }
                */
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
                cpcVm.vmChangeMode(1);
                cpcVm.vmResetWindowData(true); // prepare
                cpcVm.locate(stream, 2 + 1, 3 + 1);
                /*
                const stream = cpcVm.vmRound(Number(input)),
                    win = cpcVm.vmInternal.getWindowDataList.call(cpcVm)[stream];
    
                if (win) {
                    win.pos = 2;
                    win.vpos = 3;
                }
                */
                clearLastTestFunctions();
                cpcVm.cursor.apply(cpcVm, input);
                //return combineLastTestFunctions();
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
                // stopObject changed
            },
            derr: function (cpcVm, input) {
                return String(cpcVm.derr.apply(cpcVm, input));
            },
            draw: function (cpcVm, input) {
                cpcVm.draw.apply(cpcVm, input);
            },
            drawr: function (cpcVm, input) {
                cpcVm.drawr.apply(cpcVm, input);
            },
            edit: function (cpcVm, input) {
                cpcVm.edit.apply(cpcVm, input);
                // stopObject changed
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
            everyGosub: function (cpcVm, input) {
                cpcVm.everyGosub.apply(cpcVm, input);
                var timer = Number(cpcVm.vmRound(Number(input[1]))), timerEntry = cpcVm.vmInternal.getTimerList.call(cpcVm)[timer];
                timerEntry.nextTimeMs = undefined; // remove random entry
                return JSON.stringify(timerEntry);
            },
            fill: function (cpcVm, input) {
                cpcVm.fill.apply(cpcVm, input);
                //return combineLastTestFunctions();
            },
            fix: function (cpcVm, input) {
                return String(cpcVm.fix.apply(cpcVm, input));
            },
            frame: function (cpcVm, input) {
                // cpcVm.vmStop("", 0, true); // not needed
                cpcVm.frame.apply(cpcVm, input);
                // stopObject changed
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
            graphicsPaper: function (cpcVm, input) {
                cpcVm.graphicsPaper.apply(cpcVm, input);
                //return combineLastTestFunctions();
            },
            graphicsPen: function (cpcVm, input) {
                cpcVm.graphicsPen.apply(cpcVm, input);
                //return combineLastTestFunctions();
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
                //return combineLastTestFunctions();
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
            "int": function (cpcVm, input) {
                return String(cpcVm.int.apply(cpcVm, input));
            },
            joy: function (cpcVm, input) {
                return String(cpcVm.joy.apply(cpcVm, input));
            },
            memory: function (cpcVm, input) {
                cpcVm.memory.apply(cpcVm, input);
                return String(cpcVm.himem());
            },
            move: function (cpcVm, input) {
                cpcVm.move.apply(cpcVm, input);
            },
            mover: function (cpcVm, input) {
                cpcVm.mover.apply(cpcVm, input);
            },
            "new": function (cpcVm, input) {
                cpcVm.new.apply(cpcVm, input);
                // stopObject changed
            },
            plot: function (cpcVm, input) {
                cpcVm.plot.apply(cpcVm, input);
            },
            plotr: function (cpcVm, input) {
                cpcVm.plotr.apply(cpcVm, input);
            },
            renum: function (cpcVm, input) {
                cpcVm.renum.apply(cpcVm, input);
                // stopObject changed
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
                stopObject: JSON.stringify(cpcVm.vmGetStopObject()),
                inFileObject: JSON.stringify(cpcVm.vmGetInFileObject()),
                outFileObject: JSON.stringify(cpcVm.vmGetOutFileObject())
            };
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