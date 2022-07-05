// CpcVm.qunit.ts - QUnit tests for CPCBasic CpcVm
//

import { Utils } from "../Utils";
import { CpcVm, CpcVmOptions } from "../CpcVm";
import { Canvas } from "../Canvas";
import { Keyboard } from "../Keyboard";
import { Sound } from "../Sound";
import { Variables } from "../Variables";
import { TestHelper, TestsType, AllTestsType } from "./TestHelper";

type TestFunctionInputType = string | number | undefined;

// https://www.cpcwiki.eu/index.php/Locomotive_BASIC

QUnit.module("CpcVm: Tests", function () {
	const allTests: AllTestsType = { // eslint-disable-line vars-on-top
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
			"0xbb00": "resetCpcKeysExpansions: -- clearInput: -- resetExpansionTokens:",
			"0xbb03": "clearInput: -- resetExpansionTokens:",
			"0xbb06": "getKeyFromBuffer:",
			"0xbb0c": "putKeyInBuffer:\x00 -- getKeyDownHandler:",
			"0xbb0c,1,1,1,1,1,1,1,1,1": "putKeyInBuffer:\x09 -- getKeyDownHandler:",
			"0xbb0c,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32": "putKeyInBuffer:  -- getKeyDownHandler:",
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
			"0 ": "setBorder:0 -- clearGraphicsWindow:",
			"15.4 ": "setBorder:15 -- clearGraphicsWindow:",
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
			"0,1,1": "drawCursor:2,3,1,0 -- drawCursor:2,3,1,0 -- drawCursor:2,3,1,0",
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
		// di
		// dim
		// draw
		// drawr
		edit: {
			"": '{"reason":"editLine","priority":85,"paras":{"command":"edit","stream":0,"last":0,"line":0}}',
			"123 ": '{"reason":"editLine","priority":85,"paras":{"command":"edit","stream":0,"first":123,"last":0,"line":0}}'
		},
		// ei
		// end
		// ent
		// env
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
		"int": {
			"0 ": "0",
			"1 ": "1",
			"2.7 ": "2",
			"-2.3": "-3",
			"": 'CpcVm: Type mismatch in 0: INT undefined -- {"reason":"error","priority":50,"paras":{}}',
			'"0"': 'CpcVm: Type mismatch in 0: INT 0 -- {"reason":"error","priority":50,"paras":{}}'
		},
		joy: {
			"0 ": "4",
			"1 ": "5",
			"": 'CpcVm: Type mismatch in 0: JOY undefined -- {"reason":"error","priority":50,"paras":{}}',
			'""': 'CpcVm: Type mismatch in 0: JOY  -- {"reason":"error","priority":50,"paras":{}}',
			"-1": 'CpcVm: Improper argument in 0: JOY -1 -- {"reason":"error","priority":50,"paras":{}}',
			"2 ": 'CpcVm: Improper argument in 0: JOY 2 -- {"reason":"error","priority":50,"paras":{}}'
		},
		"new": {
			"": '{"reason":"new","priority":90,"paras":{"command":"new","stream":0,"first":0,"last":0,"line":0}}'
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
		}
	},

		lastTestFunctions: Record<string, TestFunctionInputType[]>[] = [],
		varTypesMap: Record<string, string> = {},
		variablesMap: Record<string, string | number> = {},
		mockCanvas = {
			changeMode: function (...args) {
				lastTestFunctions.push({
					changeMode: args
				});
			},
			clearGraphicsWindow: function (...args) {
				lastTestFunctions.push({
					clearGraphicsWindow: args
				});
			},
			clearTextWindow: function (...args) {
				lastTestFunctions.push({
					clearTextWindow: args
				});
			},
			drawCursor: function (...args) {
				lastTestFunctions.push({
					drawCursor: args
				});
			},
			fill: function (...args) {
				lastTestFunctions.push({
					fill: args
				});
			},
			readChar: function (...args) {
				lastTestFunctions.push({
					readChar: args
				});
				return 65;
			},
			setBorder: function (...args) {
				lastTestFunctions.push({
					setBorder: args
				});
			},
			setGPaper: function (...args) {
				lastTestFunctions.push({
					setBorder: args
				});
			}
		} as Canvas,
		mockKeyboard = {
			clearInput: function (...args) {
				lastTestFunctions.push({
					clearInput: args
				});
			},
			getJoyState: function (...args) {
				lastTestFunctions.push({
					getJoyState: args
				});
				return 4 + Number(args); // example
			},
			getKeyDownHandler: function (...args) {
				lastTestFunctions.push({
					getKeyDownHandler: args
				});
			},
			getKeyFromBuffer: function (...args) {
				lastTestFunctions.push({
					getKeyFromBuffer: args
				});
				return "A";
			},
			putKeyInBuffer: function (...args) {
				lastTestFunctions.push({
					putKeyInBuffer: args
				});
			},
			resetCpcKeysExpansions: function (...args) {
				lastTestFunctions.push({
					resetCpcKeysExpansions: args
				});
			},
			resetExpansionTokens: function (...args) {
				lastTestFunctions.push({
					resetExpansionTokens: args
				});
			}
		} as Keyboard,
		mockSound = {
			resetQueue: function (...args) {
				lastTestFunctions.push({
					resetQueue: args
				});
			}
		} as Sound,
		mockVariables = {
			getVarType: function (varChar: string) {
				return varTypesMap[varChar];
			},
			setVarType: function (varChar: string, type: string) {
				varTypesMap[varChar] = type;
			},
			initVariable: function (varName: string) {
				variablesMap[varName] = this.getVarType(varName.charAt(0)) === "$" ? "" : 0;
			},
			initAllVariables: function () {
				const variables = this.getAllVariableNames();

				for (let i = 0; i < variables.length; i += 1) {
					this.initVariable(variables[i]);
				}
			},
			getAllVariableNames(): string[] {
				return Object.keys(variablesMap);
			}
		} as Variables;

	function deleteObjectContents(obj: Record<string, any>) {
		for (const prop in obj) {
			if (obj.hasOwnProperty(prop)) {
				delete obj[prop];
			}
		}
	}

	function clearLastTestFunctions() {
		lastTestFunctions.length = 0;
	}

	function combineLastTestFunctions() {
		return lastTestFunctions.map((lastTestFunction) => Object.keys(lastTestFunction)[0] + ":" + Object.values(lastTestFunction)[0]).join(" -- ");
	}

	const allTestFunctions: Record<string, (cpcVm: CpcVm, input: TestFunctionInputType[]) => any> = {
		abs: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			return String(cpcVm.abs.apply(cpcVm, input));
		},
		afterGosub: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.afterGosub.apply(cpcVm, input);

			const timer = Number(cpcVm.vmRound(Number(input[1]))),
				timerEntry = cpcVm.vmInternal.getTimerList.call(cpcVm)[timer];

			(timerEntry as any).nextTimeMs = undefined;
			return JSON.stringify(timerEntry);
		},
		asc: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			return String(cpcVm.asc.apply(cpcVm, input));
		},
		atn: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.rad();
			return String(cpcVm.atn.apply(cpcVm, input));
		},
		atnDeg: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.deg();
			return String(cpcVm.atn.apply(cpcVm, input));
		},
		bin$: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			return cpcVm.bin$.apply(cpcVm, input);
		},
		border: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			clearLastTestFunctions();
			cpcVm.border.apply(cpcVm, input);
			return combineLastTestFunctions();
		},
		call: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			const stopObject0 = JSON.stringify(cpcVm.vmGetStopObject());

			clearLastTestFunctions();
			cpcVm.call.apply(cpcVm, input);

			const stopObject1 = JSON.stringify(cpcVm.vmGetStopObject()),
				results = [combineLastTestFunctions()];

			if (stopObject0 !== stopObject1) {
				results.push(stopObject1);
			}

			return results.join(" -- ");
		},
		cat: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.cat.apply(cpcVm, input);
			// stopObject changed
			//return JSON.stringify(cpcVm.vmGetStopObject());
		},
		chain: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.chain.apply(cpcVm, input);
			// stopObject and fileObject changed
			//return JSON.stringify(cpcVm.vmGetStopObject()) + " -- " + JSON.stringify(cpcVm.vmGetInFileObject());
		},
		chainMerge: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.chainMerge.apply(cpcVm, input);
			// stopObject and fileObject changed
			//return JSON.stringify(cpcVm.vmGetStopObject()) + " -- " + JSON.stringify(cpcVm.vmGetInFileObject());
		},
		chr$: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			return cpcVm.chr$.apply(cpcVm, input);
		},
		cint: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			return String(cpcVm.cint.apply(cpcVm, input));
		},
		clearInput: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			clearLastTestFunctions();
			cpcVm.clearInput.apply(cpcVm, input);
			return combineLastTestFunctions();
		},
		clg: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			clearLastTestFunctions();
			cpcVm.clg.apply(cpcVm, input);
			return combineLastTestFunctions();
		},
		closein: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			const inFile = cpcVm.vmGetInFileObject();

			inFile.open = true;
			inFile.command = "test1";
			inFile.name = "name1";
			cpcVm.closein.apply(cpcVm, input);
			// fileObject changed
			//return JSON.stringify(inFile);
		},
		closeout: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			const outFile = cpcVm.vmGetOutFileObject(),
				testCase = input.shift();

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
				Utils.console.error("Unknown testCase:", testCase);
				break;
			}
			cpcVm.closeout.apply(cpcVm, input);

			/*
			const stopObject0 = JSON.stringify(cpcVm.vmGetStopObject());

			cpcVm.closeout.apply(cpcVm, input);

			const stopObject1 = JSON.stringify(cpcVm.vmGetStopObject()),
				results = [JSON.stringify(outFile)];

			if (stopObject0 !== stopObject1) {
				results.push(stopObject1);
			}
			return results.join(" -- ");
			*/

			// stopObject and fileObject for some tests changed
		},
		cls: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.vmChangeMode(1);
			cpcVm.vmResetWindowData(true); // prepare

			const stream = cpcVm.vmRound(Number(input)),
				win = cpcVm.vmInternal.getWindowDataList.call(cpcVm)[stream];

			if (win) {
				win.pos = 2;
				win.vpos = 3;
			}

			clearLastTestFunctions();
			cpcVm.cls.apply(cpcVm, input);
			return combineLastTestFunctions() + " -- " + JSON.stringify(win);
		},
		cont: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			const testCase = input.shift();

			switch (testCase) {
			case "_testCase1":
				cpcVm.vmSetStartLine(123);
				break;
			case "_testCase2":
				cpcVm.vmGotoLine(0);
				cpcVm.vmSetStartLine(0);
				break;
			default:
				Utils.console.error("Unknown testCase:", testCase);
				break;
			}
			cpcVm.cont.apply(cpcVm, input);
			// stopObject changed
		},
		copychr$: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.vmChangeMode(1);
			cpcVm.vmResetWindowData(true); // prepare

			const stream = cpcVm.vmRound(Number(input)),
				win = cpcVm.vmInternal.getWindowDataList.call(cpcVm)[stream];

			if (win) {
				win.pos = 2;
				win.vpos = 3;
			}

			clearLastTestFunctions();
			const char = cpcVm.copychr$.apply(cpcVm, input);

			return combineLastTestFunctions() + " -- " + char;
		},
		cos: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.rad();
			return String(cpcVm.cos.apply(cpcVm, input));
		},
		cosDeg: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.deg();
			return String(cpcVm.cos.apply(cpcVm, input));
		},
		creal: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			return String(cpcVm.creal.apply(cpcVm, input));
		},
		cursor: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.vmChangeMode(1);
			cpcVm.vmResetWindowData(true); // prepare

			const stream = cpcVm.vmRound(Number(input)),
				win = cpcVm.vmInternal.getWindowDataList.call(cpcVm)[stream];

			if (win) {
				win.pos = 2;
				win.vpos = 3;
			}

			clearLastTestFunctions();
			cpcVm.cursor.apply(cpcVm, input);
			return combineLastTestFunctions();
		},
		dec$: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			return String(cpcVm.dec$.apply(cpcVm, input));
		},
		defint: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			deleteObjectContents(varTypesMap);
			cpcVm.defint.apply(cpcVm, input);
			return JSON.stringify(varTypesMap);
		},
		defreal: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			deleteObjectContents(varTypesMap);
			cpcVm.defreal.apply(cpcVm, input);
			return JSON.stringify(varTypesMap);
		},
		defstr: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			deleteObjectContents(varTypesMap);
			cpcVm.defstr.apply(cpcVm, input);
			return JSON.stringify(varTypesMap);
		},
		"delete": function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.delete.apply(cpcVm, input);
			//return JSON.stringify(cpcVm.vmGetStopObject());
			// stopObject changed
		},
		derr: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			return String(cpcVm.derr.apply(cpcVm, input));
		},
		edit: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.edit.apply(cpcVm, input);
			// stopObject changed
			//return JSON.stringify(cpcVm.vmGetStopObject());
		},
		eof: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			const inFile = cpcVm.vmGetInFileObject(),
				testCase = input.shift();

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
				Utils.console.error("Unknown testCase:", testCase);
			}

			return String(cpcVm.eof.apply(cpcVm, input));
		},
		erl: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.vmGotoLine("123aa");
			cpcVm.vmComposeError(Error(), 1, ""); // set erl
			cpcVm.vmStop("", 0, true); // initialize stop object modified by vmComposeError

			return String(cpcVm.erl.apply(cpcVm, input));
		},
		err: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.vmComposeError(Error(), 31, "");
			cpcVm.vmStop("", 0, true); // initialize stop object modified by vmComposeError

			return String(cpcVm.err.apply(cpcVm, input));
		},
		everyGosub: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.everyGosub.apply(cpcVm, input);

			const timer = Number(cpcVm.vmRound(Number(input[1]))),
				timerEntry = cpcVm.vmInternal.getTimerList.call(cpcVm)[timer];

			(timerEntry as any).nextTimeMs = undefined; // remove random entry
			return JSON.stringify(timerEntry);
		},
		fill: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			clearLastTestFunctions();
			cpcVm.fill.apply(cpcVm, input);
			return combineLastTestFunctions();
		},
		fix: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			return String(cpcVm.fix.apply(cpcVm, input));
		},
		frame: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			// cpcVm.vmStop("", 0, true); // not needed
			cpcVm.frame.apply(cpcVm, input);
			// stopObject changed
			//return JSON.stringify(cpcVm.vmGetStopObject());
		},
		fre: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			const testCase = input.shift();

			switch (testCase) {
			case "_testCase1":
				break;
			case "_testCase2":
				cpcVm.memory(370);
				break;
			default:
				Utils.console.error("Unknown testCase:", testCase);
				break;
			}

			return String(cpcVm.fre.apply(cpcVm, input));
		},
		"int": function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			return String(cpcVm.int.apply(cpcVm, input));
		},
		joy: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			return String(cpcVm.joy.apply(cpcVm, input));
		},
		"new": function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.new.apply(cpcVm, input);
			//return JSON.stringify(cpcVm.vmGetStopObject());
			// stopObject changed
		},
		renum: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.renum.apply(cpcVm, input);
			//return JSON.stringify(cpcVm.vmGetStopObject());
			// stopObject changed
		},
		tan: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.rad();
			return String(cpcVm.tan.apply(cpcVm, input));
		},
		tanDeg: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.deg();
			return String(cpcVm.tan.apply(cpcVm, input));
		}
	};

	function adaptParameters(a: string[]) {
		const b = [];

		for (let i = 0; i < a.length; i += 1) {
			if (a[i].startsWith('"') && a[i].endsWith('"')) { // string in quotes?
				b.push(a[i].substr(1, a[i].length - 2)); // remove quotes
			} else if (a[i] !== "") { // non empty string => to number
				b.push(Number(a[i]));
			} else {
				b.push(undefined);
			}
		}
		return b;
	}

	/*
	function escapeRegExp(s: string) {
		return s.replace(/[.^$*+?()[{|\\]/g, "\\$&");
	}

	function replaceBackslashNewlineQuotes(s: string) {
		return s.replace(/[\\\n"]/g, "$&");
	}
	*/

	function getVmState(cpcVm: CpcVm) {
		const vmState: Record<string, string> = {
			stopObject: JSON.stringify(cpcVm.vmGetStopObject()),
			inFileObject: JSON.stringify(cpcVm.vmGetInFileObject()),
			outFileObject: JSON.stringify(cpcVm.vmGetOutFileObject())
		};

		return vmState;
	}

	function combineResult(result: string, vmState0: ReturnType<typeof getVmState>, vmState1: ReturnType<typeof getVmState>) {
		const combinedResult = [];

		if (result !== undefined) {
			combinedResult.push(result);
		}

		for (const state in vmState0) {
			if (vmState0.hasOwnProperty(state)) {
				if (vmState0[state] !== vmState1[state]) {
					combinedResult.push(vmState1[state]);
				}
			}
		}
		return combinedResult.join(" -- ");
	}

	function runTestsFor(assert: Assert | undefined, sCategory: string, tests: TestsType, results?: string[]) {
		const config: CpcVmOptions = {
			canvas: mockCanvas,
			keyboard: mockKeyboard,
			sound: mockSound,
			variables: mockVariables,
			tron: false,
			quiet: true
		},
			cpcVm = new CpcVm(config),
			testFunction = allTestFunctions[sCategory];

		for (const key in tests) {
			if (tests.hasOwnProperty(key)) {
				clearLastTestFunctions();
				cpcVm.vmStop("", 0, true);

				const vmState0 = getVmState(cpcVm),
					input = key === "" ? [] : adaptParameters(key.split(",")),
					expected = tests[key];
				let result: string;

				try {
					result = testFunction(cpcVm, input);
					result = combineResult(result, vmState0, getVmState(cpcVm));
				} catch (e) {
					result = String(e);
					result = combineResult(result, vmState0, getVmState(cpcVm));
					if (result !== expected) {
						Utils.console.error(e); // only if not expected
					}
				}

				if (results) {
					//results.push('"' + key.replace(/[\\\n"]/g, "$&") + '": "' + result.replace(/[\\\n']/g, "$&") + '"'); // escape " in key, ' in value
					results.push(TestHelper.stringInQuotes(key) + ": " + TestHelper.stringInQuotes(result));
				}

				if (assert) {
					assert.strictEqual(result, expected, key);
				}
			}
		}
	}

	TestHelper.generateAndRunAllTests(allTests, runTestsFor);
});

// end
