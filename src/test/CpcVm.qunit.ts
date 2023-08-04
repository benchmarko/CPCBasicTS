// CpcVm.qunit.ts - QUnit tests for CPCBasic CpcVm
//

import { Utils } from "../Utils";
import { CpcVm, CpcVmOptions, VmInputParas, FileMeta } from "../CpcVm";
import { Canvas } from "../Canvas";
import { Keyboard } from "../Keyboard";
import { Sound } from "../Sound";
import { TextCanvas } from "../TextCanvas";
import { Variables } from "../Variables";
import { TestHelper, TestsType, AllTestsType, ResultType } from "./TestHelper";

type TestFunctionInputType = string | number | undefined;

// https://www.cpcwiki.eu/index.php/Locomotive_BASIC

const allTests: AllTestsType = {
	abs: {
		"-1 ": "1",
		"0 ": "0",
		"1 ": "1",
		"-123.45 ": "123.45",
		"123.45 ": "123.45",
		"": 'CpcVm: Type mismatch in 0: ABS undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'""': 'CpcVm: Type mismatch in 0: ABS  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
	},
	addressOf: {
		"": 'CpcVm: Type mismatch in 0: @ undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'""': 'CpcVm: Improper argument in 0: @ -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
	},
	afterGosub: {
		"0,0,123": "",
		"1,0,123": '{"_key":"timer0","line":123,"intervalMs":20,"active":true}',
		"1,0,1": '{"_key":"timer0","line":1,"intervalMs":20,"active":true}',
		"1,0,65535": '{"_key":"timer0","line":65535,"intervalMs":20,"active":true}',
		"32767.4,0,123": '{"_key":"timer0","line":123,"intervalMs":655340,"active":true}',
		"10,1,123": '{"_key":"timer1","line":123,"intervalMs":200,"active":true}',
		"10,3.4,123": '{"_key":"timer3","line":123,"intervalMs":200,"active":true}',
		"": 'CpcVm: Type mismatch in 0: AFTER undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'""': 'CpcVm: Type mismatch in 0: AFTER  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"-1,0,123": 'CpcVm: Improper argument in 0: AFTER -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"32768,0,123": 'CpcVm: Overflow in 0: AFTER 32768 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"10,-1,123": 'CpcVm: Improper argument in 0: AFTER -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"10,3.9,123": 'CpcVm: Improper argument in 0: AFTER 4 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"0,0,0": 'CpcVm: Improper argument in 0: AFTER GOSUB 0 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"1,0,0": 'CpcVm: Improper argument in 0: AFTER GOSUB 0 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"0,0,65536": 'CpcVm: Improper argument in 0: AFTER GOSUB 65536 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"0,0,10.4": 'CpcVm: Line too long in 0: AFTER GOSUB 10.4 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
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
	auto: {
		"": "",
		"20 ": "",
		"123,100": "",
		"1,1": "",
		",1": "",
		"65535,65535": "",
		'""': 'CpcVm: Type mismatch in 0: AUTO  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"-1": 'CpcVm: Improper argument in 0: AUTO -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"0 ": 'CpcVm: Improper argument in 0: AUTO 0 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"65536 ": 'CpcVm: Improper argument in 0: AUTO 65536 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"1,0": 'CpcVm: Improper argument in 0: AUTO 0 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"1,65536": 'CpcVm: Improper argument in 0: AUTO 65536 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"10.4 ": 'CpcVm: Line too long in 0: AUTO 10.4 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"1,10.4": 'CpcVm: Line too long in 0: AUTO 10.4 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
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
		"0xbb5d": 'printChar:0,0,0,1,0,false , txtPrintChar:0,0,0,1,0,false -- {"_key":"win0","pos":1}',
		"0xbb5d,1,2,3,4,5,6,7,8": 'printChar:8,0,0,1,0,false , txtPrintChar:8,0,0,1,0,false -- {"_key":"win0","pos":1}',
		"0xbb6c": "clearTextWindow:0,39,0,24,0 , txtClearTextWindow:0,39,0,24,0",
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
		"0xbbff": "setMode:1 , clearFullWindow: , txtClearFullWindow: , setDefaultInks: , setSpeedInk:10,10",
		"0xbc02": "setDefaultInks: , setSpeedInk:10,10",
		"0xbc06": 'CpcVm: Type mismatch in 0: screenBase undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"0xbc06,0x40": "getByte:49152 , getByte:49153 , setByte:16384,0 , setByte:16385,0",
		"0xbc06,0xc0": "getByte:16384 , getByte:16385 , setByte:49152,0 , setByte:49153,0",
		"0xbc07": 'CpcVm: Type mismatch in 0: screenBase undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"0xbc07,0x40": "getByte:49152 , getByte:49153 , setByte:16384,0 , setByte:16385,0",
		"0xbc07,0xc0": "getByte:16384 , getByte:16385 , setByte:49152,0 , setByte:49153,0",
		"0xbc0e": 'setMode:0 , clearFullWindow: , txtClearFullWindow: -- {"_key":"win0","right":19} -- {"_key":"win1","right":19} -- {"_key":"win2","right":19} -- {"_key":"win3","right":19} -- {"_key":"win4","right":19} -- {"_key":"win5","right":19} -- {"_key":"win6","right":19} -- {"_key":"win7","right":19}',
		"0xbc0e,1": "setMode:1 , clearFullWindow: , txtClearFullWindow:",
		"0xbc0e,1,2": 'setMode:2 , clearFullWindow: , txtClearFullWindow: -- {"_key":"win0","right":79} -- {"_key":"win1","right":79} -- {"_key":"win2","right":79} -- {"_key":"win3","right":79} -- {"_key":"win4","right":79} -- {"_key":"win5","right":79} -- {"_key":"win6","right":79} -- {"_key":"win7","right":79}',
		"0xbc0e,1,2,3": 'setMode:3 , clearFullWindow: , txtClearFullWindow: -- {"_key":"win0","right":79,"bottom":49} -- {"_key":"win1","right":79,"bottom":49} -- {"_key":"win2","right":79,"bottom":49} -- {"_key":"win3","right":79,"bottom":49} -- {"_key":"win4","right":79,"bottom":49} -- {"_key":"win5","right":79,"bottom":49} -- {"_key":"win6","right":79,"bottom":49} -- {"_key":"win7","right":79,"bottom":49} -- {"_key":"win8","bottom":49} -- {"_key":"win9","bottom":49}',
		"0xbc0e,1,2,3,4": 'setMode:0 , clearFullWindow: , txtClearFullWindow: -- {"_key":"win0","right":19} -- {"_key":"win1","right":19} -- {"_key":"win2","right":19} -- {"_key":"win3","right":19} -- {"_key":"win4","right":19} -- {"_key":"win5","right":19} -- {"_key":"win6","right":19} -- {"_key":"win7","right":19}',
		"0xbca7": "reset:",
		"0xbcbc": "",
		"0xbcb6": "",
		"0xbcb9": "",
		"0xbd19": '{"_key":"stop","reason":"waitFrame","priority":40,"paras":{}}',
		"0xbd1c": "getMode: , getByte:49152 , getByte:49153 , changeMode:0 , setByte:49152,0 , setByte:49153,1 , changeMode:1",
		"0xbd1c,1": "getMode:",
		"0xbd1c,1,2": "getMode: , getByte:49152 , getByte:49153 , changeMode:2 , setByte:49152,0 , setByte:49153,1 , changeMode:1",
		"0xbd1c,1,2,3": "getMode: , getByte:49152 , getByte:49153 , changeMode:3 , setByte:49152,0 , setByte:49153,1 , changeMode:1",
		"0xbd1c,1,2,3,4": "getMode: , getByte:49152 , getByte:49153 , changeMode:0 , setByte:49152,0 , setByte:49153,1 , changeMode:1",
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
		'"file1"': '{"_key":"stop","reason":"fileLoad","priority":90,"paras":{}} -- {"_key":"inFile","open":true,"command":"chain","name":"file1","line":0,"fileData":[],"first":0,"last":0,"memorizedExample":""}',
		'"file1",123': '{"_key":"stop","reason":"fileLoad","priority":90,"paras":{}} -- {"_key":"inFile","open":true,"command":"chain","name":"file1","line":123,"fileData":[],"first":0,"last":0,"memorizedExample":""}',
		'"file1",0': '{"_key":"stop","reason":"fileLoad","priority":90,"paras":{}} -- {"_key":"inFile","open":true,"command":"chain","name":"file1","line":0,"fileData":[],"first":0,"last":0,"memorizedExample":""}',
		'"file1",65535': '{"_key":"stop","reason":"fileLoad","priority":90,"paras":{}} -- {"_key":"inFile","open":true,"command":"chain","name":"file1","line":65535,"fileData":[],"first":0,"last":0,"memorizedExample":""}',
		'"file1",123,10': '{"_key":"stop","reason":"fileLoad","priority":90,"paras":{}} -- {"_key":"inFile","open":true,"command":"chain","name":"file1","line":123,"fileData":[],"first":10,"last":0,"memorizedExample":""}',
		'"file1",123,10,20': '{"_key":"stop","reason":"fileLoad","priority":90,"paras":{}} -- {"_key":"inFile","open":true,"command":"chain","name":"file1","line":123,"fileData":[],"first":10,"last":20,"memorizedExample":""}',
		'"file1",123,,20': '{"_key":"stop","reason":"fileLoad","priority":90,"paras":{}} -- {"_key":"inFile","open":true,"command":"chain","name":"file1","line":123,"fileData":[],"first":0,"last":20,"memorizedExample":""}',
		"": 'CpcVm: Type mismatch in 0: CHAIN undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'""': 'CpcVm: Broken in 0: Bad filename:  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"7 ": 'CpcVm: Type mismatch in 0: CHAIN 7 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'"file1",-1': 'CpcVm: Improper argument in 0: CHAIN -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'"file1",65536': 'CpcVm: Overflow in 0: CHAIN 65536 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'"file1",0,-1': 'CpcVm: Improper argument in 0: CHAIN -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'"file1",0,65536': 'CpcVm: Improper argument in 0: CHAIN 65536 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'"file1",0,1,-1': 'CpcVm: Improper argument in 0: CHAIN -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}} -- {"_key":"inFile","open":false,"command":"","name":"","line":0,"fileData":[],"first":1,"last":0,"memorizedExample":""}',
		'"file1",0,1,65536': 'CpcVm: Improper argument in 0: CHAIN 65536 -- {"_key":"stop","reason":"error","priority":50,"paras":{}} -- {"_key":"inFile","open":false,"command":"","name":"","line":0,"fileData":[],"first":1,"last":0,"memorizedExample":""}'
	},
	chainMerge: {
		'"file1"': '{"_key":"stop","reason":"fileLoad","priority":90,"paras":{}} -- {"_key":"inFile","open":true,"command":"chainMerge","name":"file1","line":0,"fileData":[],"first":0,"last":0,"memorizedExample":""}',
		'"file1",123': '{"_key":"stop","reason":"fileLoad","priority":90,"paras":{}} -- {"_key":"inFile","open":true,"command":"chainMerge","name":"file1","line":123,"fileData":[],"first":0,"last":0,"memorizedExample":""}',
		'"file1",0': '{"_key":"stop","reason":"fileLoad","priority":90,"paras":{}} -- {"_key":"inFile","open":true,"command":"chainMerge","name":"file1","line":0,"fileData":[],"first":0,"last":0,"memorizedExample":""}',
		'"file1",65535': '{"_key":"stop","reason":"fileLoad","priority":90,"paras":{}} -- {"_key":"inFile","open":true,"command":"chainMerge","name":"file1","line":65535,"fileData":[],"first":0,"last":0,"memorizedExample":""}',
		'"file1",123,10': '{"_key":"stop","reason":"fileLoad","priority":90,"paras":{}} -- {"_key":"inFile","open":true,"command":"chainMerge","name":"file1","line":123,"fileData":[],"first":10,"last":0,"memorizedExample":""}',
		'"file1",123,10,20': '{"_key":"stop","reason":"fileLoad","priority":90,"paras":{}} -- {"_key":"inFile","open":true,"command":"chainMerge","name":"file1","line":123,"fileData":[],"first":10,"last":20,"memorizedExample":""}',
		'"file1",123,,20': '{"_key":"stop","reason":"fileLoad","priority":90,"paras":{}} -- {"_key":"inFile","open":true,"command":"chainMerge","name":"file1","line":123,"fileData":[],"first":0,"last":20,"memorizedExample":""}',
		"": 'CpcVm: Type mismatch in 0: CHAIN MERGE undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'""': 'CpcVm: Broken in 0: Bad filename:  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"7 ": 'CpcVm: Type mismatch in 0: CHAIN MERGE 7 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'"file1",-1': 'CpcVm: Improper argument in 0: CHAIN MERGE -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'"file1",65536': 'CpcVm: Overflow in 0: CHAIN MERGE 65536 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'"file1",0,-1': 'CpcVm: Improper argument in 0: CHAIN MERGE -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'"file1",0,65536': 'CpcVm: Improper argument in 0: CHAIN MERGE 65536 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'"file1",0,1,-1': 'CpcVm: Improper argument in 0: CHAIN MERGE -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}} -- {"_key":"inFile","open":false,"command":"","name":"","line":0,"fileData":[],"first":1,"last":0,"memorizedExample":""}',
		'"file1",0,1,65536': 'CpcVm: Improper argument in 0: CHAIN MERGE 65536 -- {"_key":"stop","reason":"error","priority":50,"paras":{}} -- {"_key":"inFile","open":false,"command":"","name":"","line":0,"fileData":[],"first":1,"last":0,"memorizedExample":""}'
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
		"": ""
	},
	closeout: {
		'"_testCase1"': "",
		'"_testCase2"': "",
		'"_testCase3"': '{"_key":"stop","reason":"fileSave","priority":90,"paras":{}} -- {"_key":"outFile","open":true,"command":"closeout","name":"name1","line":0,"fileData":["A"],"stream":0,"typeString":"","length":0,"entry":0}'
	},
	cls: {
		"0 ": "clearTextWindow:0,39,0,24,0 , txtClearTextWindow:0,39,0,24,0",
		"6.7 ": "clearTextWindow:0,39,0,24,0 , txtClearTextWindow:0,39,0,24,0",
		"": 'CpcVm: Type mismatch in 0: CLS undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'""': 'CpcVm: Type mismatch in 0: CLS  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"-1 ": 'CpcVm: Improper argument in 0: CLS -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"8 ": 'CpcVm: Improper argument in 0: CLS 8 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
	},
	commaTab: {
		"0 ": "             ",
		"7.4 ": "             ",
		"8 ": "             ",
		"9 ": "             ",
		"": 'CpcVm: Type mismatch in 0: commaTab undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'""': 'CpcVm: Type mismatch in 0: commaTab  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"-1 ": 'CpcVm: Improper argument in 0: commaTab -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"10 ": 'CpcVm: Improper argument in 0: commaTab 10 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
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
		'1,"string in data with\nnewline"': "",
		"": 'CpcVm: Type mismatch in 0: DATA undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'"",': 'CpcVm: Type mismatch in 0: DATA  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"0 ": 'CpcVm: Improper argument in 0: DATA 0 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"65536 ": 'CpcVm: Improper argument in 0: DATA 65536 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"10.4 ": 'CpcVm: Line too long in 0: DATA 10.4 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
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
		'"b","d"': '{"b":"I","c":"I","d":"I"}',
		'"B","D"': '{"b":"I","c":"I","d":"I"}',
		'"x","z"': '{"x":"I","y":"I","z":"I"}',
		"": 'CpcVm: Type mismatch in 0: DEFINT undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'""': 'CpcVm: Syntax Error in 0: DEFINT  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'"aa"': 'CpcVm: Syntax Error in 0: DEFINT aa -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'"b-"': 'CpcVm: Syntax Error in 0: DEFINT b- -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"1 ": 'CpcVm: Type mismatch in 0: DEFINT 1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'"a", 2': 'CpcVm: Type mismatch in 0: DEFINT 2 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
	},
	defreal: {
		'"a"': '{"a":"R"}',
		'"b","d"': '{"b":"R","c":"R","d":"R"}',
		'"B","D"': '{"b":"R","c":"R","d":"R"}',
		'"x","z"': '{"x":"R","y":"R","z":"R"}',
		"": 'CpcVm: Type mismatch in 0: DEFREAL undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'""': 'CpcVm: Syntax Error in 0: DEFREAL  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'"aa"': 'CpcVm: Syntax Error in 0: DEFREAL aa -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'"b-"': 'CpcVm: Syntax Error in 0: DEFREAL b- -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"1 ": 'CpcVm: Type mismatch in 0: DEFREAL 1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'"a", 2': 'CpcVm: Type mismatch in 0: DEFREAL 2 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
	},
	defstr: {
		'"a"': '{"a":"$"}',
		'"b","d"': '{"b":"$","c":"$","d":"$"}',
		'"B","D"': '{"b":"$","c":"$","d":"$"}',
		'"x","z"': '{"x":"$","y":"$","z":"$"}',
		"": 'CpcVm: Type mismatch in 0: DEFSTR undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'""': 'CpcVm: Syntax Error in 0: DEFSTR  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'"aa"': 'CpcVm: Syntax Error in 0: DEFSTR aa -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'"b-"': 'CpcVm: Syntax Error in 0: DEFSTR b- -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"1 ": 'CpcVm: Type mismatch in 0: DEFSTR 1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'"a", 2': 'CpcVm: Type mismatch in 0: DEFSTR 2 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
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
		'"abcA$",5': "dimVariable:abcA$,6",
		'"abcAA$",5,2': "dimVariable:abcAA$,6,3",
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
		"1 ": "setToneEnv:1,[]",
		"-1 ": "setToneEnv:1,[]",
		"15 ": "setToneEnv:15,[]",
		"-15 ": "setToneEnv:15,[]",
		"1,2,3,10": 'setToneEnv:1,[{"steps":2,"diff":3,"time":10,"repeat":false}]',
		"1,0,-128,0,239,127,255": 'setToneEnv:1,[{"steps":0,"diff":-128,"time":0,"repeat":false},{"steps":239,"diff":127,"time":255,"repeat":false}]',
		"1,undefined,0,0": 'setToneEnv:1,[{"steps":0,"diff":0,"time":0,"repeat":false}]',
		"1,,0,0,,4095,255": 'setToneEnv:1,[{"period":0,"time":0},{"period":4095,"time":255}]',
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
		"1 ": "setVolEnv:1,[]",
		"15 ": "setVolEnv:15,[]",
		"1,2,3,10": 'setVolEnv:1,[{"steps":2,"diff":3,"time":10}]',
		"1,0,-128,0,127,127,255": 'setVolEnv:1,[{"steps":0,"diff":0,"time":256},{"steps":127,"diff":15,"time":255}]',
		"1,undefined,0,0": 'setVolEnv:1,[{"steps":0,"diff":0,"time":256}]',
		"1,,0,-32768,,15,65535": 'setVolEnv:1,[{"register":0,"period":-32768},{"register":15,"period":65535}]',
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
		'"_testCase2"': '-1 -- {"_key":"inFile","open":true,"command":"","name":"","line":0,"fileData":[],"first":0,"last":0,"memorizedExample":""}',
		'"_testCase3"': '0 -- {"_key":"inFile","open":true,"command":"","name":"","line":0,"fileData":["A"],"first":0,"last":0,"memorizedExample":""}'
	},
	erase: {
		'"abc4"': "",
		'"abc5$"': "",
		'"abc52$"': "",
		'"ab"': 'CpcVm: Improper argument in 0: ERASE ab -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"": 'CpcVm: Syntax Error in 0: ERASE -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'""': 'CpcVm: Improper argument in 0: ERASE  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
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
		"0,0,123": "",
		"1,0,123": '{"_key":"timer0","line":123,"repeat":true,"intervalMs":20,"active":true}',
		"1,0,1": '{"_key":"timer0","line":1,"repeat":true,"intervalMs":20,"active":true}',
		"1,0,65535": '{"_key":"timer0","line":65535,"repeat":true,"intervalMs":20,"active":true}',
		"32767.4,0,123": '{"_key":"timer0","line":123,"repeat":true,"intervalMs":655340,"active":true}',
		"10,1,123": '{"_key":"timer1","line":123,"repeat":true,"intervalMs":200,"active":true}',
		"10,3.4,123": '{"_key":"timer3","line":123,"repeat":true,"intervalMs":200,"active":true}',
		"": 'CpcVm: Type mismatch in 0: EVERY undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'""': 'CpcVm: Type mismatch in 0: EVERY  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"-1,0,123": 'CpcVm: Improper argument in 0: EVERY -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"32768,0,123": 'CpcVm: Overflow in 0: EVERY 32768 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"10,-1,123": 'CpcVm: Improper argument in 0: EVERY -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"10,3.9,123": 'CpcVm: Improper argument in 0: EVERY 4 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"0,0,0": 'CpcVm: Improper argument in 0: EVERY GOSUB 0 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"1,0,0": 'CpcVm: Improper argument in 0: EVERY GOSUB 0 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"0,0,65536": 'CpcVm: Improper argument in 0: EVERY GOSUB 65536 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"0,0,10.4 ": 'CpcVm: Line too long in 0: EVERY GOSUB 10.4 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
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
		"": 'CpcVm: Type mismatch in 0: GOSUB undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'""': 'CpcVm: Type mismatch in 0: GOSUB undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'"s1",0': 'CpcVm: Improper argument in 0: GOSUB 0 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'"s1",65536': 'CpcVm: Improper argument in 0: GOSUB 65536 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'"s1",10.4': 'CpcVm: Line too long in 0: GOSUB 10.4 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
	},
	"goto": {
		"123 ": "123",
		'"123"': 'CpcVm: Type mismatch in 0: GOTO 123 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'"10s1"': 'CpcVm: Type mismatch in 0: GOTO 10s1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"": 'CpcVm: Type mismatch in 0: GOTO undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'""': 'CpcVm: Type mismatch in 0: GOTO  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
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
		"0 ": 'printChar:117,0,0,1,0,false , txtPrintChar:117,0,0,1,0,false , printChar:110,1,0,1,0,false , txtPrintChar:110,1,0,1,0,false , printChar:100,2,0,1,0,false , txtPrintChar:100,2,0,1,0,false , printChar:101,3,0,1,0,false , txtPrintChar:101,3,0,1,0,false , printChar:102,4,0,1,0,false , txtPrintChar:102,4,0,1,0,false , printChar:105,5,0,1,0,false , txtPrintChar:105,5,0,1,0,false , printChar:110,6,0,1,0,false , txtPrintChar:110,6,0,1,0,false , printChar:101,7,0,1,0,false , txtPrintChar:101,7,0,1,0,false , printChar:100,8,0,1,0,false , txtPrintChar:100,8,0,1,0,false , drawCursor:9,0,1,0 , drawCursor:9,0,1,0 , drawCursor:9,0,1,0 --  -- {"_key":"stop","reason":"waitInput","priority":45,"paras":{"command":"input","stream":0,"types":[],"input":"","line":0}} -- {"_key":"win0","pos":9,"cursorOn":true}',
		"7 ": 'printChar:117,0,0,1,0,false , txtPrintChar:117,0,0,1,0,false , printChar:110,1,0,1,0,false , txtPrintChar:110,1,0,1,0,false , printChar:100,2,0,1,0,false , txtPrintChar:100,2,0,1,0,false , printChar:101,3,0,1,0,false , txtPrintChar:101,3,0,1,0,false , printChar:102,4,0,1,0,false , txtPrintChar:102,4,0,1,0,false , printChar:105,5,0,1,0,false , txtPrintChar:105,5,0,1,0,false , printChar:110,6,0,1,0,false , txtPrintChar:110,6,0,1,0,false , printChar:101,7,0,1,0,false , txtPrintChar:101,7,0,1,0,false , printChar:100,8,0,1,0,false , txtPrintChar:100,8,0,1,0,false , drawCursor:9,0,1,0 , drawCursor:9,0,1,0 , drawCursor:9,0,1,0 --  -- {"_key":"stop","reason":"waitInput","priority":45,"paras":{"command":"input","stream":7,"types":[],"input":"","line":0}} -- {"_key":"win7","pos":9,"cursorOn":true}',
		"8 ": "I am the printer!",
		'0,undefined,"msg","a$"': 'printChar:109,0,0,1,0,false , txtPrintChar:109,0,0,1,0,false , printChar:115,1,0,1,0,false , txtPrintChar:115,1,0,1,0,false , printChar:103,2,0,1,0,false , txtPrintChar:103,2,0,1,0,false , drawCursor:3,0,1,0 , drawCursor:3,0,1,0 , drawCursor:3,0,1,0 --  -- {"_key":"stop","reason":"waitInput","priority":45,"paras":{"command":"input","stream":0,"message":"msg","noCRLF":null,"types":["a$"],"input":"","line":0}} -- {"_key":"win0","pos":3,"cursorOn":true}',
		'0,";","msg","a$"': 'printChar:109,0,0,1,0,false , txtPrintChar:109,0,0,1,0,false , printChar:115,1,0,1,0,false , txtPrintChar:115,1,0,1,0,false , printChar:103,2,0,1,0,false , txtPrintChar:103,2,0,1,0,false , drawCursor:3,0,1,0 , drawCursor:3,0,1,0 , drawCursor:3,0,1,0 --  -- {"_key":"stop","reason":"waitInput","priority":45,"paras":{"command":"input","stream":0,"message":"msg","noCRLF":";","types":["a$"],"input":"","line":0}} -- {"_key":"win0","pos":3,"cursorOn":true}',
		'0,";","msg","a$","b"': 'printChar:109,0,0,1,0,false , txtPrintChar:109,0,0,1,0,false , printChar:115,1,0,1,0,false , txtPrintChar:115,1,0,1,0,false , printChar:103,2,0,1,0,false , txtPrintChar:103,2,0,1,0,false , drawCursor:3,0,1,0 , drawCursor:3,0,1,0 , drawCursor:3,0,1,0 --  -- {"_key":"stop","reason":"waitInput","priority":45,"paras":{"command":"input","stream":0,"message":"msg","noCRLF":";","types":["a$","b"],"input":"","line":0}} -- {"_key":"win0","pos":3,"cursorOn":true}',
		'9,"","msg","a$","b$","c"': 'abc def 7 -- {"_key":"stop","reason":"fileLoad","priority":90,"paras":{}} -- {"_key":"inFile","open":true,"command":"openin","name":"file1","line":0,"fileData":[],"first":0,"last":0,"memorizedExample":""}',
		"": 'CpcVm: Type mismatch in 0: INPUT undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'""': 'CpcVm: Type mismatch in 0: INPUT  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"-1": 'CpcVm: Improper argument in 0: INPUT -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"10 ": 'CpcVm: Improper argument in 0: INPUT 10 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"9 ": 'CpcVm: File not open in 0: INPUT #9 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
	},
	instr: {
		'"",""': "0",
		'1,"",""': "0",
		'1,"ab",""': "1",
		'2,"ab",""': "2",
		'3,"ab",""': "0",
		'"abba","a"': "1",
		'1,"abba","a"': "1",
		'2,"abba","a"': "4",
		'4,"abba","a"': "4",
		'5,"abba","a"': "0",
		"": 'CpcVm: Type mismatch in 0: INSTR undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'""': 'CpcVm: Type mismatch in 0: INSTR undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'"a"': 'CpcVm: Type mismatch in 0: INSTR undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'"a",2': 'CpcVm: Type mismatch in 0: INSTR 2 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"0 ": 'CpcVm: Improper argument in 0: INSTR 0 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'0,"abba","a"': 'CpcVm: Improper argument in 0: INSTR 0 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"256 ": 'CpcVm: Improper argument in 0: INSTR 256 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"1 ": 'CpcVm: Type mismatch in 0: INSTR undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"1,2": 'CpcVm: Type mismatch in 0: INSTR 2 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'1,"a"': 'CpcVm: Type mismatch in 0: INSTR undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'1,"a",3': 'CpcVm: Type mismatch in 0: INSTR 3 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
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
		"0,0": 'setCpcKeyExpansion:{"cpcKey":0,"repeat":0}',
		"79.2,0": 'setCpcKeyExpansion:{"cpcKey":79,"repeat":0}',
		"0,1": 'setCpcKeyExpansion:{"cpcKey":0,"repeat":1}',
		"0,1,0": 'setCpcKeyExpansion:{"cpcKey":0,"repeat":1,"normal":0}',
		"0,1,255": 'setCpcKeyExpansion:{"cpcKey":0,"repeat":1,"normal":255}',
		"0,1,0,0": 'setCpcKeyExpansion:{"cpcKey":0,"repeat":1,"normal":0,"shift":0}',
		"0,1,0,255": 'setCpcKeyExpansion:{"cpcKey":0,"repeat":1,"normal":0,"shift":255}',
		"0,1,0,0,0": 'setCpcKeyExpansion:{"cpcKey":0,"repeat":1,"normal":0,"shift":0,"ctrl":0}',
		"0,1,0,0,255": 'setCpcKeyExpansion:{"cpcKey":0,"repeat":1,"normal":0,"shift":0,"ctrl":255}',
		"0,1,,0": 'setCpcKeyExpansion:{"cpcKey":0,"repeat":1,"shift":0}',
		"0,1,,,0": 'setCpcKeyExpansion:{"cpcKey":0,"repeat":1,"ctrl":0}',
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
		'"abc",0': "",
		'"abc",1': "a",
		'"abc",2': "ab",
		'"abc",4': "abc",
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
		'0,undefined,"? ","a$"': 'printChar:63,0,0,1,0,false , txtPrintChar:63,0,0,1,0,false , printChar:32,1,0,1,0,false , txtPrintChar:32,1,0,1,0,false , drawCursor:2,0,1,0 , drawCursor:2,0,1,0 -- abc1,7,e -- {"_key":"stop","reason":"waitInput","priority":45,"paras":{"command":"lineinput","stream":0,"message":"? ","noCRLF":null,"input":"abc1,7,e","line":0}} -- {"_key":"win0","pos":2}',
		'7,undefined,"? ","a$"': 'printChar:63,0,0,1,0,false , txtPrintChar:63,0,0,1,0,false , printChar:32,1,0,1,0,false , txtPrintChar:32,1,0,1,0,false , drawCursor:2,0,1,0 , drawCursor:2,0,1,0 -- abc1,7,e -- {"_key":"stop","reason":"waitInput","priority":45,"paras":{"command":"lineinput","stream":7,"message":"? ","noCRLF":null,"input":"abc1,7,e","line":0}} -- {"_key":"win7","pos":2}',
		'6.4,";","? ","a$"': 'printChar:63,0,0,1,0,false , txtPrintChar:63,0,0,1,0,false , printChar:32,1,0,1,0,false , txtPrintChar:32,1,0,1,0,false , drawCursor:2,0,1,0 , drawCursor:2,0,1,0 -- abc1,7,e -- {"_key":"stop","reason":"waitInput","priority":45,"paras":{"command":"lineinput","stream":6,"message":"? ","noCRLF":";","input":"abc1,7,e","line":0}} -- {"_key":"win6","pos":2}',
		"8 ": "I am the printer!",
		'0,";","? ","a$"': 'printChar:63,0,0,1,0,false , txtPrintChar:63,0,0,1,0,false , printChar:32,1,0,1,0,false , txtPrintChar:32,1,0,1,0,false , drawCursor:2,0,1,0 , drawCursor:2,0,1,0 -- abc1,7,e -- {"_key":"stop","reason":"waitInput","priority":45,"paras":{"command":"lineinput","stream":0,"message":"? ","noCRLF":";","input":"abc1,7,e","line":0}} -- {"_key":"win0","pos":2}',
		'0,";","? ","a$","b"': 'printChar:63,0,0,1,0,false , txtPrintChar:63,0,0,1,0,false , printChar:32,1,0,1,0,false , txtPrintChar:32,1,0,1,0,false , drawCursor:2,0,1,0 , drawCursor:2,0,1,0 -- abc1,7,e -- {"_key":"stop","reason":"waitInput","priority":45,"paras":{"command":"lineinput","stream":0,"message":"? ","noCRLF":";","input":"abc1,7,e","line":0}} -- {"_key":"win0","pos":2}',
		"": 'CpcVm: Type mismatch in 0: LINE INPUT undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'""': 'CpcVm: Type mismatch in 0: LINE INPUT  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'-1,undefined,"? ","a$"': 'CpcVm: Improper argument in 0: LINE INPUT -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'10 ,undefined,"? ","a$"': 'CpcVm: Improper argument in 0: LINE INPUT 10 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'9,undefined,"? ","a$"': 'CpcVm: File not open in 0: LINE INPUT #9 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
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
		'"file1"': '{"open":true,"command":"load","name":"file1","line":0,"fileData":[],"first":0,"last":0,"memorizedExample":""} -- {"_key":"stop","reason":"fileLoad","priority":90,"paras":{}}',
		'"file1",123': '{"open":true,"command":"load","name":"file1","line":0,"start":123,"fileData":[],"first":0,"last":0,"memorizedExample":""} -- {"_key":"stop","reason":"fileLoad","priority":90,"paras":{}}',
		'"file1",-32768': '{"open":true,"command":"load","name":"file1","line":0,"start":32768,"fileData":[],"first":0,"last":0,"memorizedExample":""} -- {"_key":"stop","reason":"fileLoad","priority":90,"paras":{}}',
		'"file1",65535': '{"open":true,"command":"load","name":"file1","line":0,"start":65535,"fileData":[],"first":0,"last":0,"memorizedExample":""} -- {"_key":"stop","reason":"fileLoad","priority":90,"paras":{}}',
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
		'" !#$%&\'()*+ -./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~\x7f\x80\x81\x82\x83\x84\x85\x86\x87\x88\x89\x8a\x8b\x8c\x8d\x8e\x8f\x90\x91\x92\x93\x94\x95\x96\x97\x98\x99\x9a\x9b\x9c\x9d\x9e\x9f\xa0\xa1\xa2\xa3\xa4\xa5\xa6\xa7\xa8\xa9\xaa\xab\xac\xad\xae\xaf\xb0\xb1\xb2\xb3\xb4\xb5\xb6\xb7\xb8\xb9\xba\xbb\xbc\xbd\xbe\xbf\xc0\xc1\xc2\xc3\xc4\xc5\xc6\xc7\xc8\xc9\xca\xcb\xcc\xcd\xce\xcf\xd0\xd1\xd2\xd3\xd4\xd5\xd6\xd7\xd8\xd9\xda\xdb\xdc\xdd\xde\xdf\xe0\xe1\xe2\xe3\xe4\xe5\xe6\xe7\xe8\xe9\xea\xeb\xec\xed\xee\xef\xf0\xf1\xf2\xf3\xf4\xf5\xf6\xf7\xf8\xf9\xfa\xfb\xfc\xfd\xfe\xff"': " !#$%&'()*+ -./0123456789:;<=>?@abcdefghijklmnopqrstuvwxyz[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~\x7f\x80\x81\x82\x83\x84\x85\x86\x87\x88\x89\x8a\x8b\x8c\x8d\x8e\x8f\x90\x91\x92\x93\x94\x95\x96\x97\x98\x99\x9a\x9b\x9c\x9d\x9e\x9f\xa0\xa1\xa2\xa3\xa4\xa5\xa6\xa7\xa8\xa9\xaa\xab\xac\xad\xae\xaf\xb0\xb1\xb2\xb3\xb4\xb5\xb6\xb7\xb8\xb9\xba\xbb\xbc\xbd\xbe\xbf\xc0\xc1\xc2\xc3\xc4\xc5\xc6\xc7\xc8\xc9\xca\xcb\xcc\xcd\xce\xcf\xd0\xd1\xd2\xd3\xd4\xd5\xd6\xd7\xd8\xd9\xda\xdb\xdc\xdd\xde\xdf\xe0\xe1\xe2\xe3\xe4\xe5\xe6\xe7\xe8\xe9\xea\xeb\xec\xed\xee\xef\xf0\xf1\xf2\xf3\xf4\xf5\xf6\xf7\xf8\xf9\xfa\xfb\xfc\xfd\xfe\xff",
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
		'"file1"': '{"_key":"stop","reason":"fileLoad","priority":90,"paras":{}} -- {"_key":"inFile","open":true,"command":"merge","name":"file1","line":0,"fileData":[],"first":0,"last":0,"memorizedExample":""}',
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
		"0 ": 'setMode:0 , clearFullWindow: , txtClearFullWindow: -- {"_key":"win0","right":19} -- {"_key":"win1","right":19} -- {"_key":"win2","right":19} -- {"_key":"win3","right":19} -- {"_key":"win4","right":19} -- {"_key":"win5","right":19} -- {"_key":"win6","right":19} -- {"_key":"win7","right":19}',
		"1 ": "setMode:1 , clearFullWindow: , txtClearFullWindow:",
		"2 ": 'setMode:2 , clearFullWindow: , txtClearFullWindow: -- {"_key":"win0","right":79} -- {"_key":"win1","right":79} -- {"_key":"win2","right":79} -- {"_key":"win3","right":79} -- {"_key":"win4","right":79} -- {"_key":"win5","right":79} -- {"_key":"win6","right":79} -- {"_key":"win7","right":79}',
		"3.4 ": 'setMode:3 , clearFullWindow: , txtClearFullWindow: -- {"_key":"win0","right":79,"bottom":49} -- {"_key":"win1","right":79,"bottom":49} -- {"_key":"win2","right":79,"bottom":49} -- {"_key":"win3","right":79,"bottom":49} -- {"_key":"win4","right":79,"bottom":49} -- {"_key":"win5","right":79,"bottom":49} -- {"_key":"win6","right":79,"bottom":49} -- {"_key":"win7","right":79,"bottom":49} -- {"_key":"win8","bottom":49} -- {"_key":"win9","bottom":49}',
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
		"": 'resetQueue: -- {"_key":"stop","reason":"new","priority":90,"paras":{"command":"new","stream":0,"first":0,"last":0,"line":0}}'
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
		"-1 ": 'CpcVm: Improper argument in 123: ON BREAK GOSUB -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"65536 ": 'CpcVm: Improper argument in 123: ON BREAK GOSUB 65536 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"10.4 ": 'CpcVm: Line too long in 123: ON BREAK GOSUB 10.4 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
	},
	onBreakStop: {
		"": "true, onBreakContSet:false, onBreakHandlerActive:false"
	},
	onErrorGoto: {
		"0 ": "",
		"1 ": "",
		"65535 ": "",
		"": 'CpcVm: Type mismatch in 0: ON ERROR GOTO undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'""': 'CpcVm: Type mismatch in 0: ON ERROR GOTO  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"-1 ": 'CpcVm: Improper argument in 0: ON ERROR GOTO -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"65536 ": 'CpcVm: Improper argument in 0: ON ERROR GOTO 65536 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"10.4 ": 'CpcVm: Line too long in 0: ON ERROR GOTO 10.4 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
	},
	onGosub: {
		'"10s1",1,123': "123",
		'"10s1",2,123,234': "234",
		'"10s1",0,123,234': "10s1",
		'"10s1",3,123,234': "10s1",
		'"10s1",255,123,234': "10s1",
		"": 'CpcVm: Type mismatch in 0: ON GOSUB undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'""': 'CpcVm: Type mismatch in 0: ON GOSUB undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'"10s1",-1,123': 'CpcVm: Improper argument in 0: ON GOSUB -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'"10s1",256,123': 'CpcVm: Improper argument in 0: ON GOSUB 256 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'"10s1",1,10.4': 'CpcVm: Line too long in 0: ON GOSUB 10.4 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
	},
	onGoto: {
		'"10s1",1,123': "123",
		'"10s1",2,123,234': "234",
		'"10s1",0,123,234': "10s1",
		'"10s1",3,123,234': "10s1",
		'"10s1",255,123,234': "10s1",
		"": 'CpcVm: Type mismatch in 0: ON GOTO undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'""': 'CpcVm: Type mismatch in 0: ON GOTO undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'"10s1",-1,123': 'CpcVm: Improper argument in 0: ON GOTO -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'"10s1",256,123': 'CpcVm: Improper argument in 0: ON GOTO 256 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'"10s1",1,10.4': 'CpcVm: Line too long in 0: ON GOTO 10.4 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
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
		"1,65536": 'CpcVm: Improper argument in 0: ON SQ GOSUB 65536 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"1,10.4": 'CpcVm: Line too long in 0: ON SQ GOSUB 10.4 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
	},
	openin: {
		'"file1"': '{"_key":"stop","reason":"fileLoad","priority":90,"paras":{}} -- {"_key":"inFile","open":true,"command":"openin","name":"file1","line":0,"fileData":["10,a\\b20,b"],"first":0,"last":0,"memorizedExample":""}',
		"": 'CpcVm: Type mismatch in 0: OPENIN undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'""': 'CpcVm: Broken in 0: Bad filename:  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
	},
	openout: {
		'"file1"': '{"_key":"outFile","open":true,"command":"openout","name":"file1","line":0,"fileData":[],"stream":0,"typeString":"A","length":0,"entry":0}',
		"": 'CpcVm: Type mismatch in 0: OPENOUT undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'""': 'CpcVm: Broken in 0: Bad filename:  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
	},
	origin: {
		"1,2": "setOrigin:1,2",
		"1,2,7,13,6,15": "setOrigin:1,2 , setGWindow:7,13,6,15",
		"1,2,13,7,15,6": "setOrigin:1,2 , setGWindow:13,7,15,6",
		"-32768,-32768,-32768,-32768,-32768,-32768": "setOrigin:-32768,-32768 , setGWindow:-32768,-32768,-32768,-32768",
		"32767,-32767,32767,32767,32767,32767": "setOrigin:32767,-32767 , setGWindow:32767,32767,32767,32767",
		"": 'CpcVm: Type mismatch in 0: ORIGIN undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'""': 'CpcVm: Type mismatch in 0: ORIGIN  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"-32769,0": 'CpcVm: Overflow in 0: ORIGIN -32769 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"32768,0": 'CpcVm: Overflow in 0: ORIGIN 32768 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"0,-32769": 'CpcVm: Overflow in 0: ORIGIN -32769 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"0,32768": 'CpcVm: Overflow in 0: ORIGIN 32768 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"0,0,-32769": 'setOrigin:0,0 -- CpcVm: Overflow in 0: ORIGIN -32769 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"0,0,32768": 'setOrigin:0,0 -- CpcVm: Overflow in 0: ORIGIN 32768 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"0,0,0,0,0,-32769": 'setOrigin:0,0 -- CpcVm: Overflow in 0: ORIGIN -32769 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"0,0,0,0,0,32768": 'setOrigin:0,0 -- CpcVm: Overflow in 0: ORIGIN 32768 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
	},
	out: {
		"11,12": "",
		"-32768,0": "",
		"65535,255": "",
		"0x7f00,0xc0": "",
		"0x7f00,0xc4": "",
		"0x7f00,0xc5": "",
		"0x7f00,0xc6": "",
		"0x7f00,0xc7": "",
		"0xbc00,0x12": "",
		"0xbd00,0x01": "",
		"": 'CpcVm: Type mismatch in 0: OUT undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'""': 'CpcVm: Type mismatch in 0: OUT  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"-32769,0": 'CpcVm: Overflow in 0: OUT -32769 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"65536,0": 'CpcVm: Overflow in 0: OUT 65536 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"0,-1": 'CpcVm: Improper argument in 0: OUT -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"0,256": 'CpcVm: Improper argument in 0: OUT 256 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
	},
	paper: {
		"1,2": '{"_key":"win1","paper":2}',
		"0,0": "",
		"7,15": '{"_key":"win7","paper":15}',
		"": 'CpcVm: Type mismatch in 0: PAPER undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'""': 'CpcVm: Type mismatch in 0: PAPER  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"-1,0": 'CpcVm: Improper argument in 0: PAPER -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"8,0": 'CpcVm: Improper argument in 0: PAPER 8 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"0,-1": 'CpcVm: Improper argument in 0: PAPER -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"0,16.4": 'CpcVm: Improper argument in 0: PAPER 16 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
	},
	peek: {
		"0 ": "0",
		"0x4000": "0",
		"0xc001": "getByte:49153 -- 1",
		"42732 ": "getCharData:254 -- 24",
		"42733 ": "getCharData:254 -- 60",
		"-32768": "0",
		"65535 ": "255",
		"": 'CpcVm: Type mismatch in 0: PEEK undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'""': 'CpcVm: Type mismatch in 0: PEEK  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"-32769": 'CpcVm: Overflow in 0: PEEK -32769 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"65536 ": 'CpcVm: Overflow in 0: PEEK 65536 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
	},
	pen: {
		"1,2": '{"_key":"win1","pen":2}',
		"0,0": '{"_key":"win0","pen":0}',
		"7,15": '{"_key":"win7","pen":15}',
		"1,2,0": '{"_key":"win1","pen":2}',
		"1,2,1": '{"_key":"win1","transparent":true,"pen":2}',
		"2,,1": '{"_key":"win2","transparent":true}',
		"": 'CpcVm: Type mismatch in 0: PEN undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'""': 'CpcVm: Type mismatch in 0: PEN  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"-1,0": 'CpcVm: Improper argument in 0: PEN -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"8,0": 'CpcVm: Improper argument in 0: PEN 8 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"0,-1": 'CpcVm: Improper argument in 0: PEN -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"0,16.4": 'CpcVm: Improper argument in 0: PEN 16 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"0,0,-1": 'CpcVm: Improper argument in 0: PEN -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}} -- {"_key":"win0","pen":0}',
		"0,0,2": 'CpcVm: Improper argument in 0: PEN 2 -- {"_key":"stop","reason":"error","priority":50,"paras":{}} -- {"_key":"win0","pen":0}'
	},
	pi: {
		"": "3.141592653589793"
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
	poke: {
		"0,0": "",
		"0x4000,1": "",
		"0xc000,1": "setByte:49152,1",
		"42732,20.2": "getCharData:254 , setCustomChar:254,20,60,102,102,126,102,102,0",
		"42733,30.5": "getCharData:254 , setCustomChar:254,24,31,102,102,126,102,102,0",
		"-32768,0": "",
		"65535,255": "",
		"": 'CpcVm: Type mismatch in 0: POKE address undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'""': 'CpcVm: Type mismatch in 0: POKE address  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"-32769,0": 'CpcVm: Overflow in 0: POKE address -32769 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"65536,0": 'CpcVm: Overflow in 0: POKE address 65536 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"0,-1": 'CpcVm: Improper argument in 0: POKE byte -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"0,256": 'CpcVm: Improper argument in 0: POKE byte 256 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
	},
	pos: {
		"0 ": "1",
		"7 ": "1",
		"8 ": "1",
		"9 ": "1",
		"": 'CpcVm: Type mismatch in 0: POS undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'""': 'CpcVm: Type mismatch in 0: POS  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"-1": 'CpcVm: Improper argument in 0: POS -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"10.2 ": 'CpcVm: Improper argument in 0: POS 10 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
	},
	print: {
		"0 ": "",
		"7 ": "",
		"8 ": "",
		"9 ": 'CpcVm: File not open in 0: PRINT #9 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"0,1": 'printChar:32,0,0,1,0,false , txtPrintChar:32,0,0,1,0,false , printChar:49,1,0,1,0,false , txtPrintChar:49,1,0,1,0,false , printChar:32,2,0,1,0,false , txtPrintChar:32,2,0,1,0,false -- {"_key":"win0","pos":3}',
		"0,12.345": 'printChar:32,0,0,1,0,false , txtPrintChar:32,0,0,1,0,false , printChar:49,1,0,1,0,false , txtPrintChar:49,1,0,1,0,false , printChar:50,2,0,1,0,false , txtPrintChar:50,2,0,1,0,false , printChar:46,3,0,1,0,false , txtPrintChar:46,3,0,1,0,false , printChar:51,4,0,1,0,false , txtPrintChar:51,4,0,1,0,false , printChar:52,5,0,1,0,false , txtPrintChar:52,5,0,1,0,false , printChar:53,6,0,1,0,false , txtPrintChar:53,6,0,1,0,false , printChar:32,7,0,1,0,false , txtPrintChar:32,7,0,1,0,false -- {"_key":"win0","pos":8}',
		"0,-12.345": 'printChar:45,0,0,1,0,false , txtPrintChar:45,0,0,1,0,false , printChar:49,1,0,1,0,false , txtPrintChar:49,1,0,1,0,false , printChar:50,2,0,1,0,false , txtPrintChar:50,2,0,1,0,false , printChar:46,3,0,1,0,false , txtPrintChar:46,3,0,1,0,false , printChar:51,4,0,1,0,false , txtPrintChar:51,4,0,1,0,false , printChar:52,5,0,1,0,false , txtPrintChar:52,5,0,1,0,false , printChar:53,6,0,1,0,false , txtPrintChar:53,6,0,1,0,false , printChar:32,7,0,1,0,false , txtPrintChar:32,7,0,1,0,false -- {"_key":"win0","pos":8}',
		'0,"-12.345"': 'printChar:45,0,0,1,0,false , txtPrintChar:45,0,0,1,0,false , printChar:49,1,0,1,0,false , txtPrintChar:49,1,0,1,0,false , printChar:50,2,0,1,0,false , txtPrintChar:50,2,0,1,0,false , printChar:46,3,0,1,0,false , txtPrintChar:46,3,0,1,0,false , printChar:51,4,0,1,0,false , txtPrintChar:51,4,0,1,0,false , printChar:52,5,0,1,0,false , txtPrintChar:52,5,0,1,0,false , printChar:53,6,0,1,0,false , txtPrintChar:53,6,0,1,0,false -- {"_key":"win0","pos":7}',
		'0,"abc"': 'printChar:97,0,0,1,0,false , txtPrintChar:97,0,0,1,0,false , printChar:98,1,0,1,0,false , txtPrintChar:98,1,0,1,0,false , printChar:99,2,0,1,0,false , txtPrintChar:99,2,0,1,0,false -- {"_key":"win0","pos":3}',
		'0,"a","bc",7.2,"d"': 'printChar:97,0,0,1,0,false , txtPrintChar:97,0,0,1,0,false , printChar:98,1,0,1,0,false , txtPrintChar:98,1,0,1,0,false , printChar:99,2,0,1,0,false , txtPrintChar:99,2,0,1,0,false , printChar:32,3,0,1,0,false , txtPrintChar:32,3,0,1,0,false , printChar:55,4,0,1,0,false , txtPrintChar:55,4,0,1,0,false , printChar:46,5,0,1,0,false , txtPrintChar:46,5,0,1,0,false , printChar:50,6,0,1,0,false , txtPrintChar:50,6,0,1,0,false , printChar:32,7,0,1,0,false , txtPrintChar:32,7,0,1,0,false , printChar:100,8,0,1,0,false , txtPrintChar:100,8,0,1,0,false -- {"_key":"win0","pos":9}',
		"0,999999999": 'printChar:32,0,0,1,0,false , txtPrintChar:32,0,0,1,0,false , printChar:57,1,0,1,0,false , txtPrintChar:57,1,0,1,0,false , printChar:57,2,0,1,0,false , txtPrintChar:57,2,0,1,0,false , printChar:57,3,0,1,0,false , txtPrintChar:57,3,0,1,0,false , printChar:57,4,0,1,0,false , txtPrintChar:57,4,0,1,0,false , printChar:57,5,0,1,0,false , txtPrintChar:57,5,0,1,0,false , printChar:57,6,0,1,0,false , txtPrintChar:57,6,0,1,0,false , printChar:57,7,0,1,0,false , txtPrintChar:57,7,0,1,0,false , printChar:57,8,0,1,0,false , txtPrintChar:57,8,0,1,0,false , printChar:57,9,0,1,0,false , txtPrintChar:57,9,0,1,0,false , printChar:32,10,0,1,0,false , txtPrintChar:32,10,0,1,0,false -- {"_key":"win0","pos":11}',
		"0,1e9": 'printChar:32,0,0,1,0,false , txtPrintChar:32,0,0,1,0,false , printChar:49,1,0,1,0,false , txtPrintChar:49,1,0,1,0,false , printChar:69,2,0,1,0,false , txtPrintChar:69,2,0,1,0,false , printChar:43,3,0,1,0,false , txtPrintChar:43,3,0,1,0,false , printChar:48,4,0,1,0,false , txtPrintChar:48,4,0,1,0,false , printChar:57,5,0,1,0,false , txtPrintChar:57,5,0,1,0,false , printChar:32,6,0,1,0,false , txtPrintChar:32,6,0,1,0,false -- {"_key":"win0","pos":7}',
		"0,0x00": 'printChar:32,0,0,1,0,false , txtPrintChar:32,0,0,1,0,false , printChar:48,1,0,1,0,false , txtPrintChar:48,1,0,1,0,false , printChar:32,2,0,1,0,false , txtPrintChar:32,2,0,1,0,false -- {"_key":"win0","pos":3}',
		'0,"\x00"': "",
		'0,"\x01\x08"': 'printChar:8,0,0,1,0,false , txtPrintChar:8,0,0,1,0,false -- {"_key":"win0","pos":1}',
		'0,"\x02"': '{"_key":"win0","cursorEnabled":false}',
		'0,"\x03"': "",
		'0,"\x04\x02"': 'setMode:2 , clearFullWindow: , txtClearFullWindow: -- {"_key":"win0","right":79} -- {"_key":"win1","right":79} -- {"_key":"win2","right":79} -- {"_key":"win3","right":79} -- {"_key":"win4","right":79} -- {"_key":"win5","right":79} -- {"_key":"win6","right":79} -- {"_key":"win7","right":79}',
		'0,"\x05\x08"': "printGChar:8",
		'0,"\x06"': "",
		'0,"\x07"': 'testCanQueue:135 , sound:{"state":135,"period":90,"duration":20,"volume":12,"volEnv":0,"toneEnv":0,"noise":0}',
		'0,"\x08"': '{"_key":"win0","pos":-1}',
		'0,"\x09"': '{"_key":"win0","pos":1}',
		'0,"\n"': '{"_key":"win0","vpos":1}',
		'0,"\x0b"': '{"_key":"win0","vpos":-1}',
		'0,"\x0c"': "clearTextWindow:0,39,0,24,0 , txtClearTextWindow:0,39,0,24,0",
		'0,"\r"': "",
		'0,"\x0e\x04"': '{"_key":"win0","paper":4}',
		'0,"\x0f\x04"': '{"_key":"win0","pen":4}',
		'0,"\x10"': "fillTextBox:0,0,1,1,0 , txtFillTextBox:0,0,1,1",
		'0,"\x11"': "fillTextBox:0,0,1,1,0 , txtFillTextBox:0,0,1,1,0",
		'0,"\x12"': "fillTextBox:0,0,40,1,0 , txtFillTextBox:0,0,40,1,0",
		'0,"\x13"': "fillTextBox:0,0,40,0,0 , fillTextBox:0,0,1,1,0 , txtFillTextBox:0,0,40,0,0 , txtFillTextBox:0,0,1,1,0",
		'0,"\x14"': "fillTextBox:0,0,40,1,0 , fillTextBox:0,1,40,24,0 , txtFillTextBox:0,0,40,1,0 , txtFillTextBox:0,1,40,24,0",
		'0,"\x15"': '{"_key":"win0","textEnabled":false,"cursorEnabled":false}',
		'0,"\x16\x00"': "",
		'0,"\x16\x01"': '{"_key":"win0","transparent":true}',
		'0,"\x16\x02"': "",
		'0,"\x17\x00"': "setGColMode:0",
		'0,"\x17\x01"': "setGColMode:1",
		'0,"\x17\x02"': "setGColMode:2",
		'0,"\x17\x03"': "setGColMode:3",
		'0,"\x17\x04"': "setGColMode:0",
		'0,"\x18"': '{"_key":"win0","pen":0,"paper":1}',
		'0,"\x19\xfe\x01\x02\x03\x04\x05\x06\x07\x08"': "",
		'0,"\x1a\x01\x08\x02\x09"': '{"_key":"win0","left":1,"right":8,"top":2,"bottom":9}',
		'0,"\x1b"': "",
		'0,"\x1c\x01\x02\x03"': "setInk:1,2,3",
		'0,"\x1d\x01\x02"': "setBorder:1,2",
		'0,"\x1e"': "",
		'0,"\x1f\x02\x03"': '{"_key":"win0","pos":1,"vpos":2}',
		'7,"\x1f\x02\x03"': '{"_key":"win7","pos":1,"vpos":2}',
		'6,"\x1f","\x08","\x09"': '{"_key":"win6","pos":7,"vpos":8}',
		'0," "': 'printChar:32,0,0,1,0,false , txtPrintChar:32,0,0,1,0,false -- {"_key":"win0","pos":1}',
		"": 'CpcVm: Type mismatch in 0: PRINT undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'""': 'CpcVm: Type mismatch in 0: PRINT  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"-1 ": 'CpcVm: Improper argument in 0: PRINT -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"10 ": 'CpcVm: Improper argument in 0: PRINT 10 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
	},
	rad: {
		"": ""
	},
	randomize: {
		"10 ": "undefined",
		"-17.5": "undefined",
		"0x89656c07": "undefined",
		"0 ": "undefined",
		"": 'printChar:82,0,0,1,0,false , txtPrintChar:82,0,0,1,0,false , printChar:97,1,0,1,0,false , txtPrintChar:97,1,0,1,0,false , printChar:110,2,0,1,0,false , txtPrintChar:110,2,0,1,0,false , printChar:100,3,0,1,0,false , txtPrintChar:100,3,0,1,0,false , printChar:111,4,0,1,0,false , txtPrintChar:111,4,0,1,0,false , printChar:109,5,0,1,0,false , txtPrintChar:109,5,0,1,0,false , printChar:32,6,0,1,0,false , txtPrintChar:32,6,0,1,0,false , printChar:110,7,0,1,0,false , txtPrintChar:110,7,0,1,0,false , printChar:117,8,0,1,0,false , txtPrintChar:117,8,0,1,0,false , printChar:109,9,0,1,0,false , txtPrintChar:109,9,0,1,0,false , printChar:98,10,0,1,0,false , txtPrintChar:98,10,0,1,0,false , printChar:101,11,0,1,0,false , txtPrintChar:101,11,0,1,0,false , printChar:114,12,0,1,0,false , txtPrintChar:114,12,0,1,0,false , printChar:32,13,0,1,0,false , txtPrintChar:32,13,0,1,0,false , printChar:115,14,0,1,0,false , txtPrintChar:115,14,0,1,0,false , printChar:101,15,0,1,0,false , txtPrintChar:101,15,0,1,0,false , printChar:101,16,0,1,0,false , txtPrintChar:101,16,0,1,0,false , printChar:100,17,0,1,0,false , txtPrintChar:100,17,0,1,0,false , printChar:32,18,0,1,0,false , txtPrintChar:32,18,0,1,0,false , printChar:63,19,0,1,0,false , txtPrintChar:63,19,0,1,0,false , printChar:32,20,0,1,0,false , txtPrintChar:32,20,0,1,0,false -- 12.76 -- {"_key":"stop","reason":"waitInput","priority":45,"paras":{"command":"randomize","stream":0,"message":"Random number seed ? ","input":"12.76","line":0}} -- {"_key":"win0","pos":21}',
		'""': 'CpcVm: Type mismatch in 0: RANDOMIZE  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
	},
	read: {
		'"a"': 'CpcVm: DATA exhausted in 0: READ -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'"a$"': 'CpcVm: DATA exhausted in 0: READ -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"": 'CpcVm: Type mismatch in 0: READ undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'""': 'CpcVm: DATA exhausted in 0: READ -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"7 ": 'CpcVm: Type mismatch in 0: READ 7 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
	},
	release: {
		"0 ": "release:0",
		"1 ": "release:1",
		"7.4 ": "release:7",
		"": 'CpcVm: Type mismatch in 0: RELEASE undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'""': 'CpcVm: Type mismatch in 0: RELEASE  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"-1 ": 'CpcVm: Improper argument in 0: RELEASE -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"8 ": 'CpcVm: Improper argument in 0: RELEASE 8 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
	},
	remain: {
		"0 ": "0",
		"1 ": "0",
		"2 ": "0",
		"3.4 ": "0",
		"": 'CpcVm: Type mismatch in 0: REMAIN undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'""': 'CpcVm: Type mismatch in 0: REMAIN  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"-1 ": 'CpcVm: Improper argument in 0: REMAIN -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"4 ": 'CpcVm: Improper argument in 0: REMAIN 4 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
	},
	renum: {
		"": '{"_key":"stop","reason":"renumLines","priority":85,"paras":{"command":"renum","stream":0,"line":0,"newLine":10,"oldLine":1,"step":10,"keep":65535}}',
		"10 ": '{"_key":"stop","reason":"renumLines","priority":85,"paras":{"command":"renum","stream":0,"line":0,"newLine":10,"oldLine":1,"step":10,"keep":65535}}',
		"100,90,15,9000": '{"_key":"stop","reason":"renumLines","priority":85,"paras":{"command":"renum","stream":0,"line":0,"newLine":100,"oldLine":90,"step":15,"keep":9000}}',
		"1,1,1,1": '{"_key":"stop","reason":"renumLines","priority":85,"paras":{"command":"renum","stream":0,"line":0,"newLine":1,"oldLine":1,"step":1,"keep":1}}',
		"65535,65535,65535,65535": '{"_key":"stop","reason":"renumLines","priority":85,"paras":{"command":"renum","stream":0,"line":0,"newLine":65535,"oldLine":65535,"step":65535,"keep":65535}}',
		'""': 'CpcVm: Type mismatch in 0: RENUM  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"-1": 'CpcVm: Improper argument in 0: RENUM -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"0 ": 'CpcVm: Improper argument in 0: RENUM 0 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"65536 ": 'CpcVm: Overflow in 0: RENUM 65536 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"1,0": 'CpcVm: Improper argument in 0: RENUM 0 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"1,65536": 'CpcVm: Overflow in 0: RENUM 65536 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"1,1,0": 'CpcVm: Improper argument in 0: RENUM 0 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"1,1,65536": 'CpcVm: Overflow in 0: RENUM 65536 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"1,1,1,0": 'CpcVm: Improper argument in 0: RENUM 0 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"1,1,1,65536": 'CpcVm: Overflow in 0: RENUM 65536 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
	},
	restore: {
		"123 ": "",
		"1 ": "",
		"65535 ": "",
		"": "",
		'""': 'CpcVm: Type mismatch in 0: RESTORE  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"-1 ": 'CpcVm: Improper argument in 0: RESTORE -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"0 ": 'CpcVm: Improper argument in 0: RESTORE 0 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"65536 ": 'CpcVm: Improper argument in 0: RESTORE 65536 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"10.4 ": 'CpcVm: Line too long in 0: RESTORE 10.4 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'"a"': 'CpcVm: Type mismatch in 0: RESTORE a -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
	},
	resume: {
		"123 ": 'CpcVm: Unexpected RESUME in 0: 123 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"1 ": 'CpcVm: Unexpected RESUME in 0: 1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"65535 ": 'CpcVm: Unexpected RESUME in 0: 65535 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"": 'CpcVm: Unexpected RESUME in 0: undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'""': 'CpcVm: Unexpected RESUME in 0:  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"-1 ": 'CpcVm: Unexpected RESUME in 0: -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"65536 ": 'CpcVm: Unexpected RESUME in 0: 65536 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"10.4 ": 'CpcVm: Unexpected RESUME in 0: 10.4 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'"a"': 'CpcVm: Unexpected RESUME in 0: a -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
	},
	resumeNext: {
		"": 'CpcVm: Unexpected RESUME in 0: RESUME NEXT -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'""': 'CpcVm: Unexpected RESUME in 0: RESUME NEXT -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
	},
	"return": {
		"": 'CpcVm: Unexpected RETURN in 0:  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'""': 'CpcVm: Unexpected RETURN in 0:  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
	},
	right$: {
		'"abc",0': "abc",
		'"abc",1': "c",
		'"abc",2': "bc",
		'"abc",4': "abc",
		"": 'CpcVm: Type mismatch in 0: RIGHT$ undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'""': 'CpcVm: Type mismatch in 0: RIGHT$ undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'"abc",-1': 'CpcVm: Improper argument in 0: RIGHT$ -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'"abc",256': 'CpcVm: Improper argument in 0: RIGHT$ 256 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"0,1": 'CpcVm: Type mismatch in 0: RIGHT$ 0 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
	},
	rnd: {
		"-1 ": "0.000007826369259425611",
		"0 ": "0.00000782636925942561",
		"2 ": "0.000007826369259425611",
		"": "0.000007826369259425611",
		'""': 'CpcVm: Type mismatch in 0: RND  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
	},
	round: {
		"2.49 ": "2",
		"2.50": "3",
		"0 ": "0",
		"-2.49": "-2",
		"-2.50": "-3",
		"13 ": "13",
		"2.49,1": "2.5",
		"8.575,2": "8.58",
		"1.005,2": "1.01",
		"-1.005,2": "-1.01",
		"2.49,-39": "0",
		"2.49,39": "2.49",
		"1234.5678,-2": "1200",
		"": 'CpcVm: Type mismatch in 0: ROUND undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'""': 'CpcVm: Type mismatch in 0: ROUND  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"0,-40": 'CpcVm: Improper argument in 0: ROUND -40 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"0,40": 'CpcVm: Improper argument in 0: ROUND 40 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
	},
	run: {
		"123 ": '{"reason":"run","priority":95,"paras":{"command":"run","stream":0,"first":123,"last":0,"line":0}} -- {"_key":"stop","reason":"run","priority":95,"paras":{"command":"run","stream":0,"first":123,"last":0,"line":0}}',
		'"file1"': '{"reason":"fileLoad","priority":90,"paras":{}} -- {"_key":"stop","reason":"run","priority":95,"paras":{"command":"run","stream":0,"first":0,"last":0,"line":0}}',
		"": '{"reason":"run","priority":95,"paras":{"command":"run","stream":0,"first":0,"last":0,"line":0}} -- {"_key":"stop","reason":"run","priority":95,"paras":{"command":"run","stream":0,"first":0,"last":0,"line":0}}',
		'""': 'CpcVm: Broken in 0: Bad filename:  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"10.4 ": 'CpcVm: Line too long in 0: RUN 10.4 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
	},
	save: {
		'"file1"': '{"_key":"stop","reason":"fileSave","priority":90,"paras":{}} -- {"_key":"outFile","open":true,"command":"save","name":"file1","line":0,"start":368,"fileData":[],"stream":0,"typeString":"T","length":0,"entry":0}',
		'"file2","T"': '{"_key":"stop","reason":"fileSave","priority":90,"paras":{}} -- {"_key":"outFile","open":true,"command":"save","name":"file2","line":0,"start":368,"fileData":[],"stream":0,"typeString":"T","length":0,"entry":0}',
		'"file3","P"': '{"_key":"stop","reason":"fileSave","priority":90,"paras":{}} -- {"_key":"outFile","open":true,"command":"save","name":"file3","line":0,"start":368,"fileData":[],"stream":0,"typeString":"P","length":0,"entry":0}',
		'"file4","B"': 'CpcVm: Type mismatch in 0: SAVE undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'"file5","B",0xc000': 'CpcVm: Type mismatch in 0: SAVE undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'"file5","B",0xc000,0x0003': 'getByte:49152 , getByte:49153 -- {"_key":"stop","reason":"fileSave","priority":90,"paras":{}} -- {"_key":"outFile","open":true,"command":"save","name":"file5","line":0,"start":49152,"fileData":["\\u0000","\\u0001","\\u0002"],"stream":0,"typeString":"B","length":3,"entry":0}',
		'"file5","B",0xc000,0x0003,0xc002': 'getByte:49152 , getByte:49153 -- {"_key":"stop","reason":"fileSave","priority":90,"paras":{}} -- {"_key":"outFile","open":true,"command":"save","name":"file5","line":0,"start":49152,"fileData":["\\u0000","\\u0001","\\u0002"],"stream":0,"typeString":"B","length":3,"entry":49154}',
		"": 'CpcVm: Type mismatch in 0: SAVE undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'""': 'CpcVm: Broken in 0: Bad filename:  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
	},
	sgn: {
		"10.2 ": "1",
		"0 ": "0",
		"-10.2": "-1",
		"": 'CpcVm: Type mismatch in 0: SGN undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'""': 'CpcVm: Type mismatch in 0: SGN  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
	},
	sin: {
		"0 ": "0",
		"": 'CpcVm: Type mismatch in 0: SIN undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'""': 'CpcVm: Type mismatch in 0: SIN  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
	},
	sinDeg: {
		"0 ": "0",
		"30 ": "0.49999999999999994",
		"-30 ": "-0.49999999999999994",
		"": 'CpcVm: Type mismatch in 0: SIN undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'""': 'CpcVm: Type mismatch in 0: SIN  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
	},
	sound: {
		"1,10": 'testCanQueue:1 , sound:{"state":1,"period":10,"duration":20,"volume":12,"volEnv":0,"toneEnv":0,"noise":0}',
		"1,10,100,10,2,3,5": 'testCanQueue:1 , sound:{"state":1,"period":10,"duration":100,"volume":10,"volEnv":2,"toneEnv":3,"noise":5}',
		"1,0,-32768,0,0,0,0": 'testCanQueue:1 , sound:{"state":1,"period":0,"duration":-32768,"volume":0,"volEnv":0,"toneEnv":0,"noise":0}',
		"255,4095,32767,15,15,15,31": 'testCanQueue:255 , sound:{"state":255,"period":4095,"duration":32767,"volume":15,"volEnv":15,"toneEnv":15,"noise":31}',
		"2,4095,32767,15,15,15,31": 'testCanQueue:2 -- {"_key":"stop","reason":"waitSound","priority":43,"paras":{}}',
		"": 'CpcVm: Type mismatch in 0: SOUND undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'""': 'CpcVm: Type mismatch in 0: SOUND  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"0,10": 'CpcVm: Improper argument in 0: SOUND 0 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"256,10": 'CpcVm: Improper argument in 0: SOUND 256 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"1,-1": 'CpcVm: Improper argument in 0: SOUND , -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"1,4096": 'CpcVm: Improper argument in 0: SOUND , 4096 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"1,1,-1": 'testCanQueue:1 , sound:{"state":1,"period":1,"duration":-1,"volume":12,"volEnv":0,"toneEnv":0,"noise":0}',
		"1,1,16": 'testCanQueue:1 , sound:{"state":1,"period":1,"duration":16,"volume":12,"volEnv":0,"toneEnv":0,"noise":0}',
		"1,1,1,-1": 'CpcVm: Improper argument in 0: SOUND ,,, -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"1,1,1,16": 'CpcVm: Improper argument in 0: SOUND ,,, 16 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"1,1,1,1,-1": 'CpcVm: Improper argument in 0: SOUND ,,,, -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"1,1,1,1,16": 'CpcVm: Improper argument in 0: SOUND ,,,, 16 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"1,1,1,1,1,-1": 'CpcVm: Improper argument in 0: SOUND ,,,,, -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"1,1,1,1,1,32": 'CpcVm: Improper argument in 0: SOUND ,,,,, 32 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
	},
	space$: {
		"0 ": "",
		"1 ": " ",
		"3 ": "   ",
		"255 ": "                                                                                                                                                                                                                                                               ",
		"": 'CpcVm: Type mismatch in 0: SPACE$ undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'""': 'CpcVm: Type mismatch in 0: SPACE$  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"-1 ": 'CpcVm: Improper argument in 0: SPACE$ -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"256 ": 'CpcVm: Improper argument in 0: SPACE$ 256 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
	},
	spc: {
		"0,1": " ",
		"0,8": "        ",
		"0,0": "",
		"1,41": " ",
		"0,-2": "",
		"0,-32768": "",
		"9,32767": "                                                                                                                                                                                                                                                               ",
		"": 'CpcVm: Type mismatch in 0: SPC undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'""': 'CpcVm: Type mismatch in 0: SPC  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"-1,1": 'CpcVm: Improper argument in 0: SPC -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"10,1": 'CpcVm: Improper argument in 0: SPC 10 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"0,-32769": 'CpcVm: Overflow in 0: SPC -32769 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"0,32768": 'CpcVm: Overflow in 0: SPC 32768 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
	},
	speedInk: {
		"10,10": "setSpeedInk:10,10",
		"1,1": "setSpeedInk:1,1",
		"255,255": "setSpeedInk:255,255",
		"": 'CpcVm: Type mismatch in 0: SPEED INK undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'""': 'CpcVm: Type mismatch in 0: SPEED INK  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"0,1": 'CpcVm: Improper argument in 0: SPEED INK 0 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"256,1": 'CpcVm: Improper argument in 0: SPEED INK 256 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"1,0": 'CpcVm: Improper argument in 0: SPEED INK 0 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"1,256": 'CpcVm: Improper argument in 0: SPEED INK 256 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
	},
	speedKey: {
		"10,10": "",
		"1,1": "",
		"255,255": "",
		"": 'CpcVm: Type mismatch in 0: SPEED KEY undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'""': 'CpcVm: Type mismatch in 0: SPEED KEY  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"0,1": 'CpcVm: Improper argument in 0: SPEED KEY 0 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"256,1": 'CpcVm: Improper argument in 0: SPEED KEY 256 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"1,0": 'CpcVm: Improper argument in 0: SPEED KEY 0 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"1,256": 'CpcVm: Improper argument in 0: SPEED KEY 256 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
	},
	speedWrite: {
		"0 ": "",
		"1 ": "",
		"": 'CpcVm: Type mismatch in 0: SPEED WRITE undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'""': 'CpcVm: Type mismatch in 0: SPEED WRITE  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"-1 ": 'CpcVm: Improper argument in 0: SPEED WRITE -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"2 ": 'CpcVm: Improper argument in 0: SPEED WRITE 2 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
	},
	sq: {
		"1 ": "sq:0 -- 3",
		"2 ": "sq:1 -- 3",
		"4 ": "sq:2 -- 3",
		"": 'CpcVm: Type mismatch in 0: SQ undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'""': 'CpcVm: Type mismatch in 0: SQ  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"0 ": 'CpcVm: Improper argument in 0: SQ 0 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"3 ": 'CpcVm: Improper argument in 0: SQ 3 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"5 ": 'CpcVm: Improper argument in 0: SQ 5 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
	},
	sqr: {
		"0 ": "0",
		"4 ": "2",
		"18.49 ": "4.3",
		"64 ": "8",
		"": 'CpcVm: Type mismatch in 0: SQR undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'""': 'CpcVm: Type mismatch in 0: SQR  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"-1": 'CpcVm: Improper argument in 0: SQR -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
	},
	stop: {
		"": '{"_key":"stop","reason":"stop","priority":60,"paras":{}}',
		"123s1": '{"_key":"stop","reason":"stop","priority":60,"paras":{}}',
		'""': '{"_key":"stop","reason":"stop","priority":60,"paras":{}}'
	},
	str$: {
		"0 ": " 0",
		"1.2 ": " 1.2",
		"-1.3 ": "-1.3",
		"": 'CpcVm: Type mismatch in 0: STR$ undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'""': 'CpcVm: Type mismatch in 0: STR$  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
	},
	string$: {
		'3,"a"': "aaa",
		'3,"abc"': "aaa",
		'0,"abc"': "",
		"3,97": "aaa",
		"0,0": "",
		"2,255": "\xff\xff",
		"255,51": "333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333",
		'0,""': "",
		"": 'CpcVm: Type mismatch in 0: STRING$ undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'""': 'CpcVm: Type mismatch in 0: STRING$  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"0,": 'CpcVm: Type mismatch in 0: STRING$ undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"-1,0": 'CpcVm: Improper argument in 0: STRING$ -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"256,0": 'CpcVm: Improper argument in 0: STRING$ 256 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"0,-1": 'CpcVm: Improper argument in 0: STRING$ -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"0,256": 'CpcVm: Improper argument in 0: STRING$ 256 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
	},
	symbol: {
		"254,1,2,3,4,5,6,7,8": "resetCustomChars: , setCustomChar:254,1,2,3,4,5,6,7,8",
		"254,1": "resetCustomChars: , setCustomChar:254,1",
		"254,1,2": "resetCustomChars: , setCustomChar:254,1,2",
		"254,1,2,3": "resetCustomChars: , setCustomChar:254,1,2,3",
		"254,1,2,3,4": "resetCustomChars: , setCustomChar:254,1,2,3,4",
		"254,1,2,3,4,5": "resetCustomChars: , setCustomChar:254,1,2,3,4,5",
		"254,1,2,3,4,5,6": "resetCustomChars: , setCustomChar:254,1,2,3,4,5,6",
		"254,1,2,3,4,5,6,7": "resetCustomChars: , setCustomChar:254,1,2,3,4,5,6,7",
		"254 ": "resetCustomChars: , setCustomChar:254",
		"254,1.4,2.3,3.4,4.2,5.0,6.3,7.3,7.5": "resetCustomChars: , setCustomChar:254,1,2,3,4,5,6,7,8",
		"254,0,0,0,0,0,0,0,0": "resetCustomChars: , setCustomChar:254,0,0,0,0,0,0,0,0",
		"255,255,255,255,255,255,255,255,255": "resetCustomChars: , setCustomChar:255,255,255,255,255,255,255,255,255",
		"0 ": 'resetCustomChars: -- CpcVm: Improper argument in 0: SYMBOL 0 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"255 ": "resetCustomChars: , setCustomChar:255",
		"": 'resetCustomChars: -- CpcVm: Type mismatch in 0: SYMBOL undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'""': 'resetCustomChars: -- CpcVm: Type mismatch in 0: SYMBOL  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"-1 ": 'resetCustomChars: -- CpcVm: Improper argument in 0: SYMBOL -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"256 ": 'resetCustomChars: -- CpcVm: Improper argument in 0: SYMBOL 256 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"255,-1": 'resetCustomChars: -- CpcVm: Improper argument in 0: SYMBOL -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"255,256": 'resetCustomChars: -- CpcVm: Improper argument in 0: SYMBOL 256 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"255,0,-1": 'resetCustomChars: -- CpcVm: Improper argument in 0: SYMBOL -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"255,0,256": 'resetCustomChars: -- CpcVm: Improper argument in 0: SYMBOL 256 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"255,0,0,-1": 'resetCustomChars: -- CpcVm: Improper argument in 0: SYMBOL -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"255,0,0,256": 'resetCustomChars: -- CpcVm: Improper argument in 0: SYMBOL 256 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"255,0,0,0,-1": 'resetCustomChars: -- CpcVm: Improper argument in 0: SYMBOL -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"255,0,0,0,256": 'resetCustomChars: -- CpcVm: Improper argument in 0: SYMBOL 256 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"255,0,0,0,0,-1": 'resetCustomChars: -- CpcVm: Improper argument in 0: SYMBOL -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"255,0,0,0,0,256": 'resetCustomChars: -- CpcVm: Improper argument in 0: SYMBOL 256 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"255,0,0,0,0,0,-1": 'resetCustomChars: -- CpcVm: Improper argument in 0: SYMBOL -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"255,0,0,0,0,0,256": 'resetCustomChars: -- CpcVm: Improper argument in 0: SYMBOL 256 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"255,0,0,0,0,0,0,-1": 'resetCustomChars: -- CpcVm: Improper argument in 0: SYMBOL -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"255,0,0,0,0,0,0,256": 'resetCustomChars: -- CpcVm: Improper argument in 0: SYMBOL 256 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"255,0,0,0,0,0,0,0,-1": 'resetCustomChars: -- CpcVm: Improper argument in 0: SYMBOL -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"255,0,0,0,0,0,0,0,256": 'resetCustomChars: -- CpcVm: Improper argument in 0: SYMBOL 256 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
	},
	symbolAfter: {
		"254 ": "resetCustomChars:",
		"0 ": "resetCustomChars:",
		"256 ": "resetCustomChars:",
		"": 'CpcVm: Type mismatch in 0: SYMBOL AFTER undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'""': 'CpcVm: Type mismatch in 0: SYMBOL AFTER  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"-1": 'CpcVm: Improper argument in 0: SYMBOL AFTER -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"257 ": 'CpcVm: Improper argument in 0: SYMBOL AFTER 257 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
	},
	tab: {
		"0,2": " ",
		"7,5": "    ",
		"8,5": "    ",
		"9,5": "    ",
		"7,-32768": "",
		"7,32767": "      ",
		"": 'CpcVm: Type mismatch in 0: TAB undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'""': 'CpcVm: Type mismatch in 0: TAB  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"-1,0": 'CpcVm: Improper argument in 0: TAB -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"10,0": 'CpcVm: Improper argument in 0: TAB 10 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"0,-32769": 'CpcVm: Overflow in 0: TAB -32769 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"0,32768": 'CpcVm: Overflow in 0: TAB 32768 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
	},
	tag: {
		"0 ": '{"_key":"win0","tag":true}',
		"7 ": '{"_key":"win7","tag":true}',
		"": 'CpcVm: Type mismatch in 0: TAG undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'""': 'CpcVm: Type mismatch in 0: TAG  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"-1": 'CpcVm: Improper argument in 0: TAG -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"8 ": 'CpcVm: Improper argument in 0: TAG 8 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
	},
	tagoff: {
		"0 ": "",
		"7 ": "",
		"": 'CpcVm: Type mismatch in 0: TAGOFF undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'""': 'CpcVm: Type mismatch in 0: TAGOFF  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"-1": 'CpcVm: Improper argument in 0: TAGOFF -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"8 ": 'CpcVm: Improper argument in 0: TAGOFF 8 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
	},
	tan: {
		"0 ": "0",
		"0.7853981633974483 ": "0.9999999999999999",
		"": 'CpcVm: Type mismatch in 0: TAN undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'""': 'CpcVm: Type mismatch in 0: TAN  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
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
	time: {
		"": "3"
	},
	troff: {
		"": ""
	},
	tron: {
		"": ""
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
		'" !#$%&\'()*+ -./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~\x7f\x80\x81\x82\x83\x84\x85\x86\x87\x88\x89\x8a\x8b\x8c\x8d\x8e\x8f\x90\x91\x92\x93\x94\x95\x96\x97\x98\x99\x9a\x9b\x9c\x9d\x9e\x9f\xa0\xa1\xa2\xa3\xa4\xa5\xa6\xa7\xa8\xa9\xaa\xab\xac\xad\xae\xaf\xb0\xb1\xb2\xb3\xb4\xb5\xb6\xb7\xb8\xb9\xba\xbb\xbc\xbd\xbe\xbf\xc0\xc1\xc2\xc3\xc4\xc5\xc6\xc7\xc8\xc9\xca\xcb\xcc\xcd\xce\xcf\xd0\xd1\xd2\xd3\xd4\xd5\xd6\xd7\xd8\xd9\xda\xdb\xdc\xdd\xde\xdf\xe0\xe1\xe2\xe3\xe4\xe5\xe6\xe7\xe8\xe9\xea\xeb\xec\xed\xee\xef\xf0\xf1\xf2\xf3\xf4\xf5\xf6\xf7\xf8\xf9\xfa\xfb\xfc\xfd\xfe\xff"': " !#$%&'()*+ -./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`ABCDEFGHIJKLMNOPQRSTUVWXYZ{|}~\x7f\x80\x81\x82\x83\x84\x85\x86\x87\x88\x89\x8a\x8b\x8c\x8d\x8e\x8f\x90\x91\x92\x93\x94\x95\x96\x97\x98\x99\x9a\x9b\x9c\x9d\x9e\x9f\xa0\xa1\xa2\xa3\xa4\xa5\xa6\xa7\xa8\xa9\xaa\xab\xac\xad\xae\xaf\xb0\xb1\xb2\xb3\xb4\xb5\xb6\xb7\xb8\xb9\xba\xbb\xbc\xbd\xbe\xbf\xc0\xc1\xc2\xc3\xc4\xc5\xc6\xc7\xc8\xc9\xca\xcb\xcc\xcd\xce\xcf\xd0\xd1\xd2\xd3\xd4\xd5\xd6\xd7\xd8\xd9\xda\xdb\xdc\xdd\xde\xdf\xe0\xe1\xe2\xe3\xe4\xe5\xe6\xe7\xe8\xe9\xea\xeb\xec\xed\xee\xef\xf0\xf1\xf2\xf3\xf4\xf5\xf6\xf7\xf8\xf9\xfa\xfb\xfc\xfd\xfe\xff",
		"": 'CpcVm: Type mismatch in 0: UPPER$ undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"0 ": 'CpcVm: Type mismatch in 0: UPPER$ 0 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
	},
	using: {
		'"##.##",0': " 0.00",
		'"##.##",-1.2': "-1.20",
		'"##.##",1.005': " 1.01",
		'"##.##",8.575': " 8.58",
		'"#.##",15.355': "%15.36",
		'"[#,###,###]",1234567,123,12345678': "[1,234,567][      123][%12,345,678]",
		'"\\   \\","n1","n2"," xx3"': "n1   n2    xx3 ",
		'"!","a1","b2"': "ab",
		'"&","a1","b2"': "a1b2",
		"": 'CpcVm: Type mismatch in 0: USING undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'""': 'CpcVm: Improper argument in 0: USING format  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"3 ": 'CpcVm: Type mismatch in 0: USING 3 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
	},
	val: {
		'"4"': "4",
		'"4r"': "4",
		'"4.78"': "4.78",
		'" -4.78 "': "-4.78",
		'"a"': "0",
		'"&xa"': "0",
		'"&a0"': "160",
		'"&ha0"': "160",
		"": 'CpcVm: Type mismatch in 0: VAL undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'""': "0",
		"2 ": 'CpcVm: Type mismatch in 0: VAL 2 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
	},
	vpos: {
		"0 ": "1",
		"7 ": "1",
		"": 'CpcVm: Type mismatch in 0: VPOS undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'""': 'CpcVm: Type mismatch in 0: VPOS  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"-1": 'CpcVm: Improper argument in 0: VPOS -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"8.2 ": 'CpcVm: Improper argument in 0: VPOS 8 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
	},
	wait: {
		"0,0": "",
		"0xff00,1": "",
		"0,0,0": "",
		"-32768,0,0": "",
		"65535,255,255": "",
		"": 'CpcVm: Type mismatch in 0: WAIT undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'""': 'CpcVm: Type mismatch in 0: WAIT  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"-32769,0": 'CpcVm: Overflow in 0: WAIT -32769 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"65536,0": 'CpcVm: Overflow in 0: WAIT 65536 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"0,-1": 'CpcVm: Improper argument in 0: WAIT -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"0,256": 'CpcVm: Improper argument in 0: WAIT 256 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"0,0,-1": 'CpcVm: Improper argument in 0: WAIT -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"0,0,256": 'CpcVm: Improper argument in 0: WAIT 256 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
	},
	width: {
		"1 ": '{"_key":"win8","right":1}',
		"80.2 ": '{"_key":"win8","right":80}',
		"255 ": '{"_key":"win8","right":255}',
		"": 'CpcVm: Type mismatch in 0: WIDTH undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'""': 'CpcVm: Type mismatch in 0: WIDTH  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"0 ": 'CpcVm: Improper argument in 0: WIDTH 0 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"-1 ": 'CpcVm: Improper argument in 0: WIDTH -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"256 ": 'CpcVm: Improper argument in 0: WIDTH 256 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
	},
	window: {
		"0,2,4,3,5": '{"_key":"win0","left":1,"right":3,"top":2,"bottom":4}',
		"0,1.4,1.4,1.4,1.2": '{"_key":"win0","right":0,"bottom":0}',
		"7,255.2,255,255,255": '{"_key":"win7","left":39,"top":24}',
		"": 'CpcVm: Type mismatch in 0: WINDOW undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'""': 'CpcVm: Type mismatch in 0: WINDOW  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"-1,1,1,1,1": 'CpcVm: Improper argument in 0: WINDOW -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"8.2,1,1,1,1 ": 'CpcVm: Improper argument in 0: WINDOW 8 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"0,0,1,1,1": 'CpcVm: Improper argument in 0: WINDOW 0 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"0,256,1,1,1": 'CpcVm: Improper argument in 0: WINDOW 256 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"0,1,0,1,1": 'CpcVm: Improper argument in 0: WINDOW 0 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"0,1,256,1,1": 'CpcVm: Improper argument in 0: WINDOW 256 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"0,1,1,0,1": 'CpcVm: Improper argument in 0: WINDOW 0 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"0,1,1,256,1": 'CpcVm: Improper argument in 0: WINDOW 256 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"0,1,1,1,0": 'CpcVm: Improper argument in 0: WINDOW 0 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"0,1,1,1,256": 'CpcVm: Improper argument in 0: WINDOW 256 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
	},
	windowSwap: {
		"0,2": "",
		"3 ": "",
		"1.4,7": "",
		"0,0": "",
		"7,7": "",
		"": 'CpcVm: Type mismatch in 0: WINDOW SWAP undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'""': 'CpcVm: Type mismatch in 0: WINDOW SWAP  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"-1": 'CpcVm: Improper argument in 0: WINDOW SWAP -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"8 ": 'CpcVm: Improper argument in 0: WINDOW SWAP 8 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"0,-1": 'CpcVm: Improper argument in 0: WINDOW SWAP -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"0,8": 'CpcVm: Improper argument in 0: WINDOW SWAP 8 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
	},
	write: {
		"0 ": '{"_key":"win0","vpos":1}',
		"0,6": 'printChar:54,0,0,1,0,false , txtPrintChar:54,0,0,1,0,false -- {"_key":"win0","vpos":1}',
		"0,6.234": 'printChar:54,0,0,1,0,false , txtPrintChar:54,0,0,1,0,false , printChar:46,1,0,1,0,false , txtPrintChar:46,1,0,1,0,false , printChar:50,2,0,1,0,false , txtPrintChar:50,2,0,1,0,false , printChar:51,3,0,1,0,false , txtPrintChar:51,3,0,1,0,false , printChar:52,4,0,1,0,false , txtPrintChar:52,4,0,1,0,false -- {"_key":"win0","vpos":1}',
		'0,""': 'printChar:34,0,0,1,0,false , txtPrintChar:34,0,0,1,0,false , printChar:34,1,0,1,0,false , txtPrintChar:34,1,0,1,0,false -- {"_key":"win0","vpos":1}',
		'0,"ab"': 'printChar:34,0,0,1,0,false , txtPrintChar:34,0,0,1,0,false , printChar:97,1,0,1,0,false , txtPrintChar:97,1,0,1,0,false , printChar:98,2,0,1,0,false , txtPrintChar:98,2,0,1,0,false , printChar:34,3,0,1,0,false , txtPrintChar:34,3,0,1,0,false -- {"_key":"win0","vpos":1}',
		'0,"a","b"': 'printChar:34,0,0,1,0,false , txtPrintChar:34,0,0,1,0,false , printChar:97,1,0,1,0,false , txtPrintChar:97,1,0,1,0,false , printChar:34,2,0,1,0,false , txtPrintChar:34,2,0,1,0,false , printChar:44,3,0,1,0,false , txtPrintChar:44,3,0,1,0,false , printChar:34,4,0,1,0,false , txtPrintChar:34,4,0,1,0,false , printChar:98,5,0,1,0,false , txtPrintChar:98,5,0,1,0,false , printChar:34,6,0,1,0,false , txtPrintChar:34,6,0,1,0,false -- {"_key":"win0","vpos":1}',
		"0,999999999": 'printChar:57,0,0,1,0,false , txtPrintChar:57,0,0,1,0,false , printChar:57,1,0,1,0,false , txtPrintChar:57,1,0,1,0,false , printChar:57,2,0,1,0,false , txtPrintChar:57,2,0,1,0,false , printChar:57,3,0,1,0,false , txtPrintChar:57,3,0,1,0,false , printChar:57,4,0,1,0,false , txtPrintChar:57,4,0,1,0,false , printChar:57,5,0,1,0,false , txtPrintChar:57,5,0,1,0,false , printChar:57,6,0,1,0,false , txtPrintChar:57,6,0,1,0,false , printChar:57,7,0,1,0,false , txtPrintChar:57,7,0,1,0,false , printChar:57,8,0,1,0,false , txtPrintChar:57,8,0,1,0,false -- {"_key":"win0","vpos":1}',
		"0,1e9": 'printChar:49,0,0,1,0,false , txtPrintChar:49,0,0,1,0,false , printChar:69,1,0,1,0,false , txtPrintChar:69,1,0,1,0,false , printChar:43,2,0,1,0,false , txtPrintChar:43,2,0,1,0,false , printChar:48,3,0,1,0,false , txtPrintChar:48,3,0,1,0,false , printChar:57,4,0,1,0,false , txtPrintChar:57,4,0,1,0,false -- {"_key":"win0","vpos":1}',
		"7 ": '{"_key":"win7","vpos":1}',
		"8 ": "",
		"9 ": 'CpcVm: File not open in 0: WRITE #9 -- {"_key":"stop","reason":"error","priority":50,"paras":{}} -- {"_key":"outFile","open":false,"command":"","name":"","line":0,"fileData":[],"stream":9,"typeString":"","length":0,"entry":0}',
		"": 'CpcVm: Type mismatch in 0: WRITE undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'""': 'CpcVm: Type mismatch in 0: WRITE  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"-1": 'CpcVm: Improper argument in 0: WRITE -1 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"10 ": 'CpcVm: Improper argument in 0: WRITE 10 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
	},
	xpos: {
		"": "getXpos: -- 10"
	},
	ypos: {
		"": "getYpos: -- 20"
	},
	zone: {
		"1 ": "",
		"255.4 ": "",
		"": 'CpcVm: Type mismatch in 0: ZONE undefined -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'""': 'CpcVm: Type mismatch in 0: ZONE  -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"0 ": 'CpcVm: Improper argument in 0: ZONE 0 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		"256 ": 'CpcVm: Improper argument in 0: ZONE 256 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
	},
	vmAssertNumberType: {
		'"aI"': "",
		'"aR"': "",
		'"a$"': 'CpcVm: Type mismatch in 0: type $ -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'"a"': "",
		'"s"': 'CpcVm: Type mismatch in 0: type $ -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
	},
	vmAssign: {
		'"aR",2.5': "2.5",
		'"aI",2.5': "3",
		'"a",2.5': "2.5",
		'"i",2.5': "3",
		'"a$","2.5"': "2.5",
		'"s","2.5"': "2.5",
		'"a$",2.5': 'CpcVm: Type mismatch in 0: type $=2.5 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}',
		'"a","2.5"': 'CpcVm: Type mismatch in 0: = 2.5 -- {"_key":"stop","reason":"error","priority":50,"paras":{}}'
	},
	vmGoto: {
		"123 ": "123",
		'"123"': "123",
		'"10s1"': "10s1",
		"": "undefined",
		'""': ""
	},
	vmLoopCondition: {
		"": "updateSpeedInk: , scheduler: -- true"
	},
	vmReset: {
		"": "resetCustomChars: , setMode:1 , clearFullWindow: , txtClearFullWindow: , reset: , txtReset: , reset: , reset:"
	},
	vmTrace: {
		"": 'printChar:91,0,0,1,0,false , txtPrintChar:91,0,0,1,0,false , printChar:49,1,0,1,0,false , txtPrintChar:49,1,0,1,0,false , printChar:50,2,0,1,0,false , txtPrintChar:50,2,0,1,0,false , printChar:51,3,0,1,0,false , txtPrintChar:51,3,0,1,0,false , printChar:93,4,0,1,0,false , txtPrintChar:93,4,0,1,0,false -- {"_key":"win0","pos":5}'
	}
};


const lastTestFunctions: Record<string, TestFunctionInputType[]>[] = [], // eslint-disable-line one-var
	varTypesMap: Record<string, string> = {},
	variablesMap: Record<string, string | number | string[] | number[]> = {},
	mockCanvas = {
		changeMode: function (...args) {
			lastTestFunctions.push({
				changeMode: args
			});
		},
		clearFullWindow: function (...args) {
			lastTestFunctions.push({
				clearFullWindow: args
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
		draw: function (...args) {
			lastTestFunctions.push({
				draw: args
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
		fillTextBox: function (...args) {
			lastTestFunctions.push({
				fillTextBox: args
			});
		},
		getCharData: function (...args) {
			lastTestFunctions.push({
				getCharData: args
			});
			return [0x18, 0x3c, 0x66, 0x66, 0x7e, 0x66, 0x66, 0x00]; // eslint-disable-line array-element-newline
		},
		getByte: function (...args) {
			const addr = args[0];

			// test output only for 2 bytes starting with 0x0000, 0x4000, 0x8000, 0xc000
			if ((addr & 0xc001) === addr) { // eslint-disable-line no-bitwise
				lastTestFunctions.push({
					getByte: args
				});
			}
			return addr & 0xff; // eslint-disable-line no-bitwise
		},
		getMode: function (...args) {
			lastTestFunctions.push({
				getMode: args
			});
			return 1;
		},
		getXpos: function (...args) {
			lastTestFunctions.push({
				getXpos: args
			});
			return 10;
		},
		getYpos: function (...args) {
			lastTestFunctions.push({
				getYpos: args
			});
			return 20;
		},
		move: function (...args) {
			lastTestFunctions.push({
				move: args
			});
		},
		plot: function (...args) {
			lastTestFunctions.push({
				plot: args
			});
		},
		printChar: function (...args) {
			lastTestFunctions.push({
				printChar: args.map((arg) => String(arg))
			});
		},
		printGChar: function (...args) {
			lastTestFunctions.push({
				printGChar: args
			});
		},
		readChar: function (...args) {
			lastTestFunctions.push({
				readChar: args
			});
			return 65;
		},
		reset: function (...args) {
			lastTestFunctions.push({
				reset: args
			});
		},
		resetCustomChars: function (...args) {
			lastTestFunctions.push({
				resetCustomChars: args
			});
		},
		setBorder: function (...args) {
			lastTestFunctions.push({
				setBorder: args
			});
		},
		setByte: function (...args) {
			const addr = args[0];

			// test output only for 2 bytes starting with 0x0000, 0x4000, 0x8000, 0xc000
			if ((addr & 0xc001) === addr) { // eslint-disable-line no-bitwise
				lastTestFunctions.push({
					setByte: args
				});
			}
		},
		setCustomChar: function (char, charData) {
			const charDataStrings = charData.map((arg) => arg),
				stringArgs = [char].concat(charDataStrings);

			lastTestFunctions.push({
				setCustomChar: stringArgs
			});
		},
		setDefaultInks: function (...args) {
			lastTestFunctions.push({
				setDefaultInks: args
			});
		},
		setGColMode: function (...args) {
			lastTestFunctions.push({
				setGColMode: args
			});
		},
		setGPaper: function (...args) {
			lastTestFunctions.push({
				setGPaper: args
			});
		},
		setGPen: function (...args) {
			lastTestFunctions.push({
				setGPen: args
			});
		},
		setGTransparentMode: function (...args) {
			lastTestFunctions.push({
				setGTransparentMode: args.map((arg) => String(arg))
			});
		},
		setGWindow: function (...args) {
			lastTestFunctions.push({
				setGWindow: args
			});
		},
		setInk: function (...args) {
			lastTestFunctions.push({
				setInk: args
			});
			return Boolean(args[0]); // example
		},
		setMask: function (...args) {
			lastTestFunctions.push({
				setMask: args
			});
		},
		setMaskFirst: function (...args) {
			lastTestFunctions.push({
				setMaskFirst: args
			});
		},
		setMode: function (...args) {
			lastTestFunctions.push({
				setMode: args
			});
		},
		setOrigin: function (...args) {
			lastTestFunctions.push({
				setOrigin: args
			});
		},
		setSpeedInk: function (...args) {
			lastTestFunctions.push({
				setSpeedInk: args
			});
		},
		test: function (...args) {
			lastTestFunctions.push({
				test: args
			});
			return Number(args[0]) % 16; // example
		},
		updateSpeedInk: function (...args) {
			lastTestFunctions.push({
				updateSpeedInk: args
			});
		},
		windowScrollDown: function (...args) {
			lastTestFunctions.push({
				windowScrollDown: args
			});
		}
	} as Canvas,

	mockTextCanvas = {
		clearFullWindow: function (...args) {
			lastTestFunctions.push({
				txtClearFullWindow: args
			});
		},
		clearTextWindow: function (...args) {
			lastTestFunctions.push({
				txtClearTextWindow: args
			});
		},
		fillTextBox: function (...args) {
			lastTestFunctions.push({
				txtFillTextBox: args
			});
		},
		printChar: function (...args) {
			lastTestFunctions.push({
				txtPrintChar: args.map((arg) => String(arg))
			});
		},
		readChar: function (...args) {
			lastTestFunctions.push({
				txtReadChar: args
			});
			return 65;
		},
		reset: function (...args) {
			lastTestFunctions.push({
				txtReset: args
			});
		},
		windowScrollDown: function (...args) {
			lastTestFunctions.push({
				txtWindowScrollDown: args
			});
		}
	} as TextCanvas,
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
		getKeyState: function (...args) {
			lastTestFunctions.push({
				getKeyState: args
			});
			return args[0] === 79 ? 13 : -1; // example
		},
		putKeyInBuffer: function (...args) {
			lastTestFunctions.push({
				putKeyInBuffer: args
			});
		},
		reset: function (...args) {
			lastTestFunctions.push({
				reset: args
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
		},
		setCpcKeyExpansion: function (...args) {
			const stringArgs = args.map((arg) => JSON.stringify(arg));

			lastTestFunctions.push({
				setCpcKeyExpansion: stringArgs
			});
		},
		setExpansionToken: function (...args) {
			lastTestFunctions.push({
				setExpansionToken: args
			});
		}
	} as Keyboard,
	mockSound = {
		release: function (...args) {
			lastTestFunctions.push({
				release: args
			});
		},
		reset: function (...args) {
			lastTestFunctions.push({
				reset: args
			});
		},
		resetQueue: function (...args) {
			lastTestFunctions.push({
				resetQueue: args
			});
		},
		scheduler: function (...args) {
			lastTestFunctions.push({
				scheduler: args
			});
		},
		setToneEnv: function (toneEnv, toneEnvData) {
			const args2 = [
				toneEnv,
				JSON.stringify(toneEnvData)
			];

			lastTestFunctions.push({
				setToneEnv: args2
			});
		},
		setVolEnv: function (volEnv, volEnvData) {
			const args2 = [
				volEnv,
				JSON.stringify(volEnvData)
			];

			lastTestFunctions.push({
				setVolEnv: args2
			});
		},
		sound: function (...args) {
			const stringArgs = args.map((arg) => JSON.stringify(arg));

			lastTestFunctions.push({
				sound: stringArgs
			});
		},
		sq: function (...args) {
			lastTestFunctions.push({
				sq: args
			});
			return 3;
		},
		testCanQueue: function (...args) {
			lastTestFunctions.push({
				testCanQueue: args
			});
			return Boolean(args[0] & ~0x02); // eslint-disable-line no-bitwise
		}
	} as Sound,
	mockVariables = {
		dimVariable: function (...args) {
			const varName = args[0];

			variablesMap[varName] = this.getVarType(varName.charAt(0)) === "$" ? [""] : [0]; // we set one dimension, one element
			lastTestFunctions.push({
				dimVariable: args as string[] //TTT: it is string and numbers
			});
		},
		getVariableIndex: function (name: string) {
			return this.getAllVariableNames().indexOf(name);
		},
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
		},
		variableExist(name: string): boolean {
			return name in variablesMap;
		},
		removeAllVariables(): void {
			for (const name in variablesMap) { // eslint-disable-line guard-for-in
				delete variablesMap[name];
			}
		}
	} as Variables;


type hooksWithCpcVm = NestedHooks & {
	cpcVm: CpcVm
};

function createCpcVm() {
	const options: CpcVmOptions = {
		canvas: mockCanvas,
		textCanvas: mockTextCanvas,
		keyboard: mockKeyboard,
		sound: mockSound,
		variables: mockVariables,
		quiet: true
	};

	return new CpcVm(options);
}


QUnit.module("CpcVm: Tests", function (hooks) {
	hooks.before(function () {
		(hooks as hooksWithCpcVm).cpcVm = createCpcVm();
	});

	function deleteObjectContents(obj: Record<string, unknown>) {
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
		return lastTestFunctions.map((lastTestFunction) => Object.keys(lastTestFunction)[0] + ":" + Object.values(lastTestFunction)[0]).join(" , ") || undefined;
	}


	function getValidStream(cpcVm: CpcVm, input: number) {
		let stream = cpcVm.vmRound(input);

		if (stream < 0 || stream > 7) {
			stream = 0;
		}
		return stream;
	}

	type TestFunctionType = (cpcVm: CpcVm, input: TestFunctionInputType[]) => number | string | void;

	const allTestFunctions: Record<string, TestFunctionType> = {
		abs: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			return String(cpcVm.abs.apply(cpcVm, input));
		},
		addressOf: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			return String(cpcVm.addressOf.apply(cpcVm, input));
		},
		afterGosub: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.afterGosub.apply(cpcVm, input);
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
		auto: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			return cpcVm.auto.apply(cpcVm, input);
		},
		bin$: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			return cpcVm.bin$.apply(cpcVm, input);
		},
		border: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.border.apply(cpcVm, input);
		},
		call: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.call.apply(cpcVm, input);
		},
		cat: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.cat.apply(cpcVm, input);
		},
		chain: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.chain.apply(cpcVm, input);
		},
		chainMerge: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.chainMerge.apply(cpcVm, input);
		},
		chr$: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			return cpcVm.chr$.apply(cpcVm, input);
		},
		cint: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			return String(cpcVm.cint.apply(cpcVm, input));
		},
		clearInput: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.clearInput.apply(cpcVm, input);
		},
		clg: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.clg.apply(cpcVm, input);
		},
		closein: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			const inFile = cpcVm.vmGetInFileObject();

			inFile.open = true;
			inFile.command = "test1";
			inFile.name = "name1";
			cpcVm.closein.apply(cpcVm, input);
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
		},
		cls: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.cls.apply(cpcVm, input);
		},
		commaTab: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			return String(cpcVm.vmInternal.commaTab.apply(cpcVm, input));
		},
		cont: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			const testCase = input.shift();

			switch (testCase) {
			case "_testCase1":
				cpcVm.vmSetStartLine(123);
				break;
			case "_testCase2":
				cpcVm.vmGoto(0);
				cpcVm.vmSetStartLine(0);
				break;
			default:
				Utils.console.error("Unknown testCase:", testCase);
				break;
			}
			cpcVm.cont.apply(cpcVm, input);
		},
		copychr$: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			const stream = getValidStream(cpcVm, Number(input));

			cpcVm.locate(stream, 2 + 1, 3 + 1);
			clearLastTestFunctions(); // test only copychr$
			return cpcVm.copychr$.apply(cpcVm, input);
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
			const stream = getValidStream(cpcVm, Number(input));

			cpcVm.locate(stream, 2 + 1, 3 + 1);
			clearLastTestFunctions();
			cpcVm.cursor.apply(cpcVm, input);
		},
		data: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.data.apply(cpcVm, input);
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
		},
		derr: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			return String(cpcVm.derr.apply(cpcVm, input));
		},
		di: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.di.apply(cpcVm, input);
		},
		dim: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.dim.apply(cpcVm, input);
		},
		draw: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.draw.apply(cpcVm, input);
		},
		drawr: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.drawr.apply(cpcVm, input);
		},
		edit: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.edit.apply(cpcVm, input);
		},
		ei: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.ei.apply(cpcVm, input);
		},
		end: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.end.apply(cpcVm, input);
		},
		ent: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.ent.apply(cpcVm, input);
		},
		env: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.env.apply(cpcVm, input);
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
				break;
			}

			return String(cpcVm.eof.apply(cpcVm, input));
		},
		erase: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.dim("abc4A", 4);
			cpcVm.dim("abc5A$", 5);
			cpcVm.dim("abc52AA$", 5, 2);
			clearLastTestFunctions();
			cpcVm.erase.apply(cpcVm, input);
		},
		erl: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.vmGoto("123aa");
			cpcVm.vmComposeError(Error(), 1, ""); // set erl
			cpcVm.vmStop("", 0, true); // initialize stop object modified by vmComposeError

			return String(cpcVm.erl.apply(cpcVm, input));
		},
		err: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.vmComposeError(Error(), 31, "");
			cpcVm.vmStop("", 0, true); // initialize stop object modified by vmComposeError

			return String(cpcVm.err.apply(cpcVm, input));
		},
		error: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.error.apply(cpcVm, input);
		},
		everyGosub: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.everyGosub.apply(cpcVm, input);
		},
		exp: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			return String(cpcVm.exp.apply(cpcVm, input));
		},
		fill: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.fill.apply(cpcVm, input);
		},
		fix: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			return String(cpcVm.fix.apply(cpcVm, input));
		},
		frame: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.frame.apply(cpcVm, input);
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
		gosub: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.gosub.apply(cpcVm, input);
			return String(cpcVm.line);
		},
		"goto": function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.goto.apply(cpcVm, input);
			return String(cpcVm.line);
		},
		graphicsPaper: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.graphicsPaper.apply(cpcVm, input);
		},
		graphicsPen: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.graphicsPen.apply(cpcVm, input);
		},
		hex$: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			return cpcVm.hex$.apply(cpcVm, input);
		},
		himem: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
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
			return String(cpcVm.himem.apply(cpcVm, input));
		},
		ink: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.ink.apply(cpcVm, input);
		},
		inkey: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			return String(cpcVm.inkey.apply(cpcVm, input));
		},
		inkey$: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			return cpcVm.inkey$.apply(cpcVm, input);
		},
		inp: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			return String(cpcVm.inp.apply(cpcVm, input));
		},
		input: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			if (input.length && input[0] === 9) {
				if (input.length >= 2) { // test case with arguments?
					cpcVm.openin("file1");
					const inFile = cpcVm.vmGetInFileObject(),
						input2 = "abc\ndef\n7";

					if (inFile.fnFileCallback) {
						inFile.fnFileCallback(input2);
					}
					clearLastTestFunctions();
				}
			}

			cpcVm.input.apply(cpcVm, input);

			const stop = cpcVm.vmGetStopObject();

			if (stop.reason === "waitInput" && stop.paras.command === "input") {
				const inputParas = stop.paras as VmInputParas;

				inputParas.input = "abc1,7,e";

				const mockPrint = cpcVm.print;

				cpcVm.print = () => undefined;

				inputParas.fnInputCallback();
				cpcVm.print = mockPrint;
			}
			const collectInput = [];
			let nextInput;

			do {
				nextInput = cpcVm.vmGetNextInput();

				if (nextInput !== undefined) {
					collectInput.push(nextInput);
				}
			} while (nextInput !== undefined);
			return collectInput.join(" ");
		},
		instr: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			return String(cpcVm.instr.apply(cpcVm, input));
		},
		"int": function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			return String(cpcVm.int.apply(cpcVm, input));
		},
		joy: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			return String(cpcVm.joy.apply(cpcVm, input));
		},
		key: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.key.apply(cpcVm, input);
		},
		keyDef: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.keyDef.apply(cpcVm, input);
		},
		left$: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			return String(cpcVm.left$.apply(cpcVm, input));
		},
		len: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			return String(cpcVm.len.apply(cpcVm, input));
		},
		lineInput: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.lineInput.apply(cpcVm, input);

			const stop = cpcVm.vmGetStopObject();

			if (stop.reason === "waitInput" && stop.paras.command === "lineinput") {
				const inputParas = stop.paras as VmInputParas;

				inputParas.input = "abc1,7,e";
				inputParas.fnInputCallback();
			}
			return String(cpcVm.vmGetNextInput());
		},
		list: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.list.apply(cpcVm, input);
		},
		load: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.load.apply(cpcVm, input);

			const stop = cpcVm.vmGetStopObject(),
				inFile = cpcVm.vmGetInFileObject(),
				inFileString = JSON.stringify(inFile);

			if (stop.reason === "fileLoad" && inFile.command === "load") {
				const input2 = "\x31\x32",
					meta: FileMeta = {
						typeString: "B"
					};

				if (inFile.fnFileCallback) {
					inFile.fnFileCallback(input2, meta);
				}
			}
			return inFileString;
		},
		locate: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			const stream = getValidStream(cpcVm, Number(input));

			cpcVm.locate.apply(cpcVm, input);
			return cpcVm.pos(stream) + "," + cpcVm.vpos(stream);
		},
		log: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			return String(cpcVm.log.apply(cpcVm, input));
		},
		log10: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			return String(cpcVm.log10.apply(cpcVm, input));
		},
		lower$: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			return cpcVm.lower$.apply(cpcVm, input);
		},
		mask: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.mask.apply(cpcVm, input);
		},
		max: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			return String(cpcVm.max.apply(cpcVm, input));
		},
		memory: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.memory.apply(cpcVm, input);
			return String(cpcVm.himem());
		},
		merge: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.merge.apply(cpcVm, input);
		},
		mid$: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			return cpcVm.mid$.apply(cpcVm, input);
		},
		mid$Assign: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			return cpcVm.mid$Assign.apply(cpcVm, input);
		},
		min: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			return String(cpcVm.min.apply(cpcVm, input));
		},
		mode: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.mode.apply(cpcVm, input);
		},
		move: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.move.apply(cpcVm, input);
		},
		mover: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.mover.apply(cpcVm, input);
		},
		"new": function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.new.apply(cpcVm, input);
		},
		onBreakCont: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.onBreakCont.apply(cpcVm, input);
			return String(cpcVm.vmEscape()) + ", onBreakContSet:" + String(cpcVm.vmOnBreakContSet()) + ", onBreakHandlerActive:" + String(cpcVm.vmOnBreakHandlerActive());
		},
		onBreakGosub: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.vmGoto("123");
			cpcVm.onBreakGosub.apply(cpcVm, input);
			return String(cpcVm.vmEscape()) + ", onBreakContSet:" + String(cpcVm.vmOnBreakContSet()) + ", onBreakHandlerActive:" + String(cpcVm.vmOnBreakHandlerActive());
		},
		onBreakStop: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.onBreakStop.apply(cpcVm, input);
			return String(cpcVm.vmEscape()) + ", onBreakContSet:" + String(cpcVm.vmOnBreakContSet()) + ", onBreakHandlerActive:" + String(cpcVm.vmOnBreakHandlerActive());
		},
		onErrorGoto: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.onErrorGoto.apply(cpcVm, input);
		},
		onGosub: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.onGosub.apply(cpcVm, input);
			return String(cpcVm.line);
		},
		onGoto: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.onGoto.apply(cpcVm, input);
			return String(cpcVm.line);
		},
		onSqGosub: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.onSqGosub.apply(cpcVm, input);
		},
		openin: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.openin.apply(cpcVm, input);

			const stop = cpcVm.vmGetStopObject(),
				inFile = cpcVm.vmGetInFileObject();

			if (stop.reason === "fileLoad" && inFile.command === "openin") {
				const input2 = "10,a\b20,b\n";

				if (inFile.fnFileCallback) {
					inFile.fnFileCallback(input2);
				}
			}
		},
		openout: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.openout.apply(cpcVm, input);
		},
		origin: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.origin.apply(cpcVm, input);
		},
		out: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.out.apply(cpcVm, input);
		},
		paper: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.paper.apply(cpcVm, input);
		},
		peek: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.symbolAfter(254);
			clearLastTestFunctions();

			return String(cpcVm.peek.apply(cpcVm, input));
		},
		pen: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.pen.apply(cpcVm, input);
		},
		pi: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			return String(cpcVm.pi.apply(cpcVm, input));
		},
		plot: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.plot.apply(cpcVm, input);
		},
		plotr: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.plotr.apply(cpcVm, input);
		},
		poke: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.symbolAfter(254);
			clearLastTestFunctions();

			cpcVm.poke.apply(cpcVm, input);
		},
		pos: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			return String(cpcVm.pos.apply(cpcVm, input));
		},
		print: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.print.apply(cpcVm, input);
		},
		rad: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.rad.apply(cpcVm, input);
		},
		randomize: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.randomize.apply(cpcVm, input);

			const stop = cpcVm.vmGetStopObject();

			if (stop.reason === "waitInput" && stop.paras.command === "randomize") {
				const inputParas = stop.paras as VmInputParas;

				inputParas.input = "12.76";

				const mockPrint = cpcVm.print;

				cpcVm.print = () => undefined;

				inputParas.fnInputCallback();
				cpcVm.print = mockPrint;
			}
			return String(cpcVm.vmGetNextInput());
		},
		read: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			return String(cpcVm.read.apply(cpcVm, input));
		},
		release: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.release.apply(cpcVm, input);
		},
		remain: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			return String(cpcVm.remain.apply(cpcVm, input));
		},
		renum: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.renum.apply(cpcVm, input);
		},
		restore: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.restore.apply(cpcVm, input);
		},
		resume: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.resume.apply(cpcVm, input);
		},
		resumeNext: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.resumeNext.apply(cpcVm, input);
		},
		"return": function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.return.apply(cpcVm, input);
		},
		right$: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			return String(cpcVm.right$.apply(cpcVm, input));
		},
		rnd: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			let result = String(cpcVm.rnd.apply(cpcVm, input));

			if (input[0] === 0) {
				result = result.substring(0, result.length - 1); // IE: remove last digit, on IE11 it is 4, otherwise 5
			}

			return result;
		},
		round: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			return String(cpcVm.round.apply(cpcVm, input));
		},
		run: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.run.apply(cpcVm, input);

			const stop = cpcVm.vmGetStopObject(),
				inFile = cpcVm.vmGetInFileObject(),
				stopString = JSON.stringify(stop);

			if (stop.reason === "fileLoad" && inFile.command === "run") {
				const input2 = "10 print 12.76",
					meta: FileMeta = {
						typeString: "A"
					};

				if (!inFile.fnFileCallback) {
					Utils.console.error("run: fnFileCallback undefined");
				} else {
					inFile.fnFileCallback(input2, meta);
				}
			}
			return stopString;
		},
		save: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.save.apply(cpcVm, input);
		},
		sgn: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			return String(cpcVm.sgn.apply(cpcVm, input));
		},
		sin: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.rad();
			return String(cpcVm.sin.apply(cpcVm, input));
		},
		sinDeg: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.deg();
			return String(cpcVm.sin.apply(cpcVm, input));
		},
		sound: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.sound.apply(cpcVm, input);
		},
		space$: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			return String(cpcVm.space$.apply(cpcVm, input));
		},
		spc: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			return String(cpcVm.vmInternal.spc.apply(cpcVm, input));
		},
		speedInk: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.speedInk.apply(cpcVm, input);
		},
		speedKey: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.speedKey.apply(cpcVm, input);
		},
		speedWrite: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.speedWrite.apply(cpcVm, input);
		},
		sq: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			return String(cpcVm.sq.apply(cpcVm, input));
		},
		sqr: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			return String(cpcVm.sqr.apply(cpcVm, input));
		},
		stop: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.stop.apply(cpcVm, input);
		},
		str$: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			return String(cpcVm.str$.apply(cpcVm, input));
		},
		string$: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			return String(cpcVm.string$.apply(cpcVm, input));
		},
		symbol: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.symbolAfter(254); // prepare

			cpcVm.symbol.apply(cpcVm, input);
		},
		symbolAfter: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.symbolAfter.apply(cpcVm, input);
		},
		tab: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			return String(cpcVm.vmInternal.tab.apply(cpcVm, input));
		},
		tag: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.tag.apply(cpcVm, input);
		},
		tagoff: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.tagoff.apply(cpcVm, input);
		},
		tan: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.rad();
			return String(cpcVm.tan.apply(cpcVm, input));
		},
		tanDeg: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.deg();
			return String(cpcVm.tan.apply(cpcVm, input));
		},
		test: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			return String(cpcVm.test.apply(cpcVm, input));
		},
		testr: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			return String(cpcVm.testr.apply(cpcVm, input));
		},
		time: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			let time = cpcVm.time.apply(cpcVm, input);

			if (time) { // we need a fixed value
				time = 3;
			}
			return String(time);
		},
		troff: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.troff.apply(cpcVm, input);
		},
		tron: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.tron.apply(cpcVm, input);
		},
		unt: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			return String(cpcVm.unt.apply(cpcVm, input));
		},
		upper$: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			return String(cpcVm.upper$.apply(cpcVm, input));
		},
		using: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			return String(cpcVm.using.apply(cpcVm, input));
		},
		val: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			return String(cpcVm.val.apply(cpcVm, input));
		},
		vpos: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			return String(cpcVm.vpos.apply(cpcVm, input));
		},
		wait: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.wait.apply(cpcVm, input);
		},
		width: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.width.apply(cpcVm, input);
		},
		window: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.window.apply(cpcVm, input);
		},
		windowSwap: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.windowSwap.apply(cpcVm, input);
		},
		write: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.write.apply(cpcVm, input);
		},
		xpos: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			return String(cpcVm.xpos.apply(cpcVm, input));
		},
		ypos: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			return String(cpcVm.ypos.apply(cpcVm, input));
		},
		zone: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.zone.apply(cpcVm, input);
		},
		vmAssertNumberType: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.defstr("s");
			cpcVm.vmAssertNumberType.apply(cpcVm, input);
		},
		vmAssign: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.defint("i");
			cpcVm.defstr("s");
			return String(cpcVm.vmAssign.apply(cpcVm, input));
		},
		vmGoto: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.vmGoto.apply(cpcVm, input);
			return String(cpcVm.line);
		},
		vmLoopCondition: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			return String(cpcVm.vmLoopCondition.apply(cpcVm, input));
		},
		vmReset: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.vmReset.apply(cpcVm, input);
		},
		vmTrace: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
			cpcVm.vmGoto(123);
			cpcVm.tron();

			cpcVm.vmTrace.apply(cpcVm, input);

			cpcVm.troff();
		}
	};

	function adaptParameters(input: string) {
		const args = [],
			parts = input.split(/,?("[^"]*"),?/);

		for (let p = 0; p < parts.length; p += 1) {
			const part = parts[p];

			if (part.startsWith('"')) { // string in quotes?
				args.push(part.substring(1, 1 + part.length - 2)); // remove quotes
			} else if (part !== "") {
				const a = part.split(",");

				for (let i = 0; i < a.length; i += 1) {
					if (a[i] !== "") { // non empty string => to number
						args.push(Number(a[i]));
					} else {
						args.push(undefined);
					}
				}
			}
		}
		return args;
	}

	type vmStateType = Record<string, unknown>;

	function getVmState(cpcVm: CpcVm) {
		const vmState: vmStateType = {
			/* eslint-disable object-curly-newline */
			stopObject: JSON.stringify(Object.assign({ _key: "stop" }, cpcVm.vmGetStopObject())),
			inFileObject: JSON.stringify(Object.assign({ _key: "inFile" }, cpcVm.vmGetInFileObject())),
			outFileObject: JSON.stringify(Object.assign({ _key: "outFile" }, cpcVm.vmGetOutFileObject()))
			/* eslint-enable object-curly-newline */
		},
			winDataList = cpcVm.vmInternal.getWindowDataList.call(cpcVm),
			timerList = cpcVm.vmInternal.getTimerList.call(cpcVm);

		for (let i = 0; i < winDataList.length; i += 1) {
			const key = "win" + i,
				winData = Object.assign({
					_key: key
				}, winDataList[i]);

			vmState[key] = winData;
		}

		for (let i = 0; i < timerList.length; i += 1) {
			const key = "timer" + i,
				timerData = Object.assign({
					_key: key
				}, timerList[i]);

			timerData.nextTimeMs = undefined; // remove varying property

			vmState[key] = timerData;
		}

		return vmState;
	}

	function getStateDiff(vmState0: unknown, vmState1: unknown) {
		if (typeof vmState0 === "object" && typeof vmState1 === "object") {
			const stateObj0 = vmState0 as Record<string, unknown>,
				stateObj1 = vmState1 as Record<string, unknown>;

			for (const key in stateObj1) {
				if (stateObj1.hasOwnProperty(key)) {
					if (key !== "_key" && stateObj1[key] === stateObj0[key]) {
						// same values set to undefined (will be ignored by JSON.stringify)
						stateObj0[key] = undefined;
						stateObj1[key] = undefined;
					}
				}
			}
		}

		const vmState0AsString = typeof vmState0 !== "string" ? JSON.stringify(vmState0) : vmState0,
			vmState1AsString = typeof vmState1 !== "string" ? JSON.stringify(vmState1) : vmState1;

		return vmState0AsString !== vmState1AsString ? vmState1AsString : undefined;
	}

	function combineResult(vmState0: vmStateType, vmState1: vmStateType, result: string | number | void) {
		const combinedTestFunctions = combineLastTestFunctions(),
			combinedResult: (string | number)[] = [];

		if (combinedTestFunctions !== undefined) {
			combinedResult.push(combinedTestFunctions);
		}

		if (result !== undefined) {
			combinedResult.push(result);
		}

		for (const state in vmState0) {
			if (vmState0.hasOwnProperty(state)) {
				const stateDiff = getStateDiff(vmState0[state], vmState1[state]);

				if (stateDiff !== undefined) {
					combinedResult.push(stateDiff);
				}
			}
		}
		return combinedResult.join(" -- ");
	}

	function runSingleTest(testFunction: TestFunctionType, cpcVm: CpcVm, config: CpcVmOptions, key: string, expected: string, category: string) {
		cpcVm.vmResetRandom();
		cpcVm.vmResetMemory();
		cpcVm.vmChangeMode(1);
		cpcVm.vmResetWindowData(true); // prepare
		cpcVm.vmResetData();
		cpcVm.clear();
		cpcVm.vmGoto(0);
		config.variables.removeAllVariables();

		clearLastTestFunctions();
		cpcVm.vmStop("", 0, true);

		const vmState0 = getVmState(cpcVm),
			input = key === "" ? [] : adaptParameters(key);
		let result: string;

		try {
			if (!testFunction) {
				throw new Error("Undefined testFunction: " + category);
			}
			const result0 = testFunction(cpcVm, input);

			result = combineResult(vmState0, getVmState(cpcVm), result0);
		} catch (e) {
			result = combineResult(vmState0, getVmState(cpcVm), String(e));
			if (result !== expected) {
				Utils.console.error(e); // only if not expected
			}
		}
		return result;
	}

	function runTestsFor(category: string, tests: TestsType, assert?: Assert, results?: ResultType) {
		const cpcVm = (hooks as hooksWithCpcVm).cpcVm,
			testFunction = allTestFunctions[category];

		for (const key in tests) {
			if (tests.hasOwnProperty(key)) {
				const expected = tests[key],
					result = runSingleTest(testFunction, cpcVm, cpcVm.getOptions(), key, expected, category);

				if (results) {
					results[category].push(TestHelper.stringInQuotes(key) + ": " + TestHelper.stringInQuotes(result));
				}
				if (assert) {
					assert.strictEqual(result, expected, key);
				}
			}
		}
	}

	TestHelper.generateAllTests(allTests, runTestsFor, hooks);
});

QUnit.module("CpcVm: vm functions", function (hooks) {
	const that = {} as { cpcVm: CpcVm }; // eslint-disable-line consistent-this

	hooks.beforeEach(function () {
		const config: CpcVmOptions = {
			canvas: mockCanvas,
			textCanvas: mockTextCanvas,
			keyboard: mockKeyboard,
			sound: mockSound,
			variables: mockVariables,
			quiet: true
		};

		that.cpcVm = new CpcVm(config);
	});

	QUnit.test("init without options", function (assert) {
		const minimalCanvas = {
			reset: () => undefined
		} as Canvas,
			minimalTextCanvas = {
				reset: () => undefined
			} as TextCanvas,
			minimalKeyboard = {
				reset: () => undefined
			} as Keyboard,
			minimalSound = {
				reset: () => undefined
			} as Sound,
			minimalVariables = {} as Variables,
			cpcVm = new CpcVm({
				canvas: minimalCanvas,
				textCanvas: minimalTextCanvas,
				keyboard: minimalKeyboard,
				sound: minimalSound,
				variables: minimalVariables
			});

		assert.ok(cpcVm, "defined");
	});

	QUnit.test("vmReset", function (assert) {
		const cpcVm = that.cpcVm;

		cpcVm.vmReset();
		assert.ok(cpcVm, "defined");
	});
});
