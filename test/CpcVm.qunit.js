// CpcVm.qunit.ts - QUnit tests for CPCBasic CpcVm
//
define(["require", "exports", "../Utils", "../CpcVm", "./TestHelper"], function (require, exports, Utils_1, CpcVm_1, TestHelper_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var lastTestFunctions = [], 
    /* lastTestFunction = {
        name: "",
        args: [] as (number | string)[]
    },
    */
    varTypesMap = {}, variablesMap = {}, mockCanvas = {
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
        setGPaper: function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            lastTestFunctions.push({
                setBorder: args
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
        return lastTestFunctions.map(function (lastTestFunction) { return Object.keys(lastTestFunction)[0] + ":" + Object.values(lastTestFunction)[0]; }).join(" -- ");
        //return lastTestFunctions.map((lastTestFunction) => lastTestFunction.name + ":" + lastTestFunction.args.join(",")); //.join(" -- ");
        //return  lastTestFunctions.reduce
    }
    // https://www.cpcwiki.eu/index.php/Locomotive_BASIC
    QUnit.module("CpcVm: Tests", function () {
        var allTests = {
            abs: {
                "-1 ": "1",
                "0 ": "0",
                "1 ": "1",
                "-123.45 ": "123.45",
                "123.45 ": "123.45",
                "": "CpcVm: Type mismatch in 0: ABS undefined",
                '""': "CpcVm: Type mismatch in 0: ABS "
            },
            // addressOf
            afterGosub: {
                "0,0,123": '{"active":false}',
                "0.5,0,123": '{"active":true,"intervalMs":20,"line":123,"repeat":false}',
                "32767.4,0,123": '{"active":true,"intervalMs":655340,"line":123,"repeat":false}',
                "-1,0,123": "CpcVm: Improper argument in 0: AFTER -1",
                "32768,0,123": "CpcVm: Overflow in 0: AFTER 32768",
                "10,1,123": '{"intervalMs":200,"line":123,"repeat":false,"active":true}',
                "10,3.4,123": '{"intervalMs":200,"line":123,"repeat":false,"active":true}',
                "10,-1,123": "CpcVm: Improper argument in 0: AFTER -1",
                "10,3.9,123": "CpcVm: Improper argument in 0: AFTER 4"
            },
            asc: {
                '"A"': "65",
                '"Abc"': "65",
                '""': "CpcVm: Improper argument in 0: ASC",
                "0 ": "CpcVm: Type mismatch in 0: ASC 0",
                "": "CpcVm: Type mismatch in 0: ASC undefined"
            },
            atn: {
                "0 ": "0",
                "1 ": "0.7853981633974483"
            },
            atnDeg: {
                "0 ": "0",
                "1 ": "45"
            },
            // auto
            bin$: {
                "0 ": "0",
                "255 ": "11111111",
                "255,10": "0011111111",
                "170,6": "10101010",
                "32767,16": "0111111111111111",
                "65535 ": "1111111111111111",
                "65536 ": "CpcVm: Overflow in 0: BIN$ 65536",
                "65535,17": "CpcVm: Improper argument in 0: BIN$ 17",
                "-1": "1111111111111111",
                "-32768": "1000000000000000",
                "-32769": "CpcVm: Overflow in 0: BIN$ -32769"
            },
            border: {
                "0 ": "setBorder:0,0",
                "1 ": "setBorder:1,1",
                "0,1": "setBorder:0,1",
                "1,0": "setBorder:1,0",
                "31 ": "setBorder:31,31",
                "-1": "CpcVm: Improper argument in 0: BORDER -1",
                "32 ": "CpcVm: Improper argument in 0: BORDER 32"
            },
            call: {
                "0 ": "",
                "0xbb00": "resetCpcKeysExpansions: -- clearInput: -- resetExpansionTokens:",
                "0xbb03": "clearInput: -- resetExpansionTokens:",
                "0xbb06": "getKeyFromBuffer:",
                "0xbb0c": "putKeyInBuffer:" + String.fromCharCode(0) + " -- getKeyDownHandler:",
                "0xbb0c,1,1,1,1,1,1,1,1,1": "putKeyInBuffer:\t -- getKeyDownHandler:",
                "0xbb0c,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32": "putKeyInBuffer:  -- getKeyDownHandler:",
                "0xbb0c,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33": "CpcVm: Syntax Error in 0: CALL ",
                "0xffff": "",
                "-32767": "",
                "0,0": "",
                "0,-128": "",
                "0,-32768": "",
                "0,-32769": "CpcVm: Overflow in 0: CALL -32769",
                "0,65536": "CpcVm: Overflow in 0: CALL 65536",
                "": "CpcVm: Type mismatch in 0: CALL undefined",
                '""': "CpcVm: Type mismatch in 0: CALL ",
                "65536 ": "CpcVm: Overflow in 0: CALL 65536",
                "-32769": "CpcVm: Overflow in 0: CALL -32769"
            },
            cat: {
                "": '{"reason":"fileCat","priority":45,"paras":{"command":"cat","stream":0,"fileMask":"","line":0}}'
            },
            chain: {
                '"file1"': '{"reason":"fileLoad","priority":90,"paras":{}} -- {"open":true,"command":"chain","name":"file1","line":0,"start":0,"fileData":[],"first":0,"last":0,"memorizedExample":""}',
                '"file1",123': '{"reason":"fileLoad","priority":90,"paras":{}} -- {"open":true,"command":"chain","name":"file1","line":123,"start":0,"fileData":[],"first":0,"last":0,"memorizedExample":""}',
                "": "CpcVm: Type mismatch in 0: CHAIN undefined",
                '""': "CpcVm: Broken in 0: Bad filename: ",
                "7 ": "CpcVm: Type mismatch in 0: CHAIN 7"
            },
            chainMerge: {
                '"file1"': '{"reason":"fileLoad","priority":90,"paras":{}} -- {"open":true,"command":"chainMerge","name":"file1","line":0,"start":0,"fileData":[],"first":0,"last":0,"memorizedExample":""}',
                '"file1",123': '{"reason":"fileLoad","priority":90,"paras":{}} -- {"open":true,"command":"chainMerge","name":"file1","line":123,"start":0,"fileData":[],"first":0,"last":0,"memorizedExample":""}',
                '"file1",123,10': '{"reason":"fileLoad","priority":90,"paras":{}} -- {"open":true,"command":"chainMerge","name":"file1","line":123,"start":0,"fileData":[],"first":10,"last":0,"memorizedExample":""}',
                '"file1",123,20': '{"reason":"fileLoad","priority":90,"paras":{}} -- {"open":true,"command":"chainMerge","name":"file1","line":123,"start":0,"fileData":[],"first":20,"last":0,"memorizedExample":""}',
                "": "CpcVm: Type mismatch in 0: CHAIN MERGE undefined",
                '""': "CpcVm: Broken in 0: Bad filename: ",
                "7 ": "CpcVm: Type mismatch in 0: CHAIN MERGE 7"
            },
            chr$: {
                "0 ": String.fromCharCode(0),
                "65 ": "A",
                "65,66": "A",
                "255 ": String.fromCharCode(255),
                "": "CpcVm: Type mismatch in 0: CHR$ undefined",
                '""': "CpcVm: Type mismatch in 0: CHR$ ",
                "-1": "CpcVm: Improper argument in 0: CHR$ -1",
                "256 ": "CpcVm: Improper argument in 0: CHR$ 256"
            },
            cint: {
                "0 ": "0",
                "1.49 ": "1",
                "1.5 ": "2",
                "-1.49 ": "-1",
                "-1.5 ": "-2",
                "-32768.49": "-32768",
                "-32768.5": "CpcVm: Overflow in 0: CINT -32769",
                "32767.49 ": "32767",
                "32767.5 ": "CpcVm: Overflow in 0: CINT 32768",
                "": "CpcVm: Type mismatch in 0: CINT undefined",
                '""': "CpcVm: Type mismatch in 0: CINT "
            },
            // clear
            clearInput: {
                "": "clearInput:"
            },
            clg: {
                "": "clearGraphicsWindow:",
                "0 ": "setBorder:0 -- clearGraphicsWindow:",
                "15.4 ": "setBorder:15 -- clearGraphicsWindow:",
                '""': "CpcVm: Type mismatch in 0: CLG ",
                "-0.6": "CpcVm: Improper argument in 0: CLG -1",
                "16 ": "CpcVm: Improper argument in 0: CLG 16"
            },
            closein: {
                "": '{"open":false,"command":"","name":"name1","line":0,"start":0,"fileData":[],"first":0,"last":0,"memorizedExample":""}'
            },
            closeout: {
                '"_testCase1"': '{"open":false,"command":"","name":"","line":0,"start":0,"fileData":[],"stream":0,"typeString":"","length":0,"entry":0}',
                '"_testCase2"': '{"open":false,"command":"","name":"name1","line":0,"start":0,"fileData":[],"stream":0,"typeString":"","length":0,"entry":0}',
                '"_testCase3"': '{"open":true,"command":"closeout","name":"name1","line":0,"start":0,"fileData":["A"],"stream":0,"typeString":"","length":0,"entry":0} -- {"reason":"fileSave","priority":90,"paras":{}}'
            },
            cls: {
                "0 ": 'clearTextWindow:0,39,0,24,0 -- {"left":0,"right":39,"top":0,"bottom":24,"pos":0,"vpos":0,"textEnabled":true,"tag":false,"transparent":false,"cursorOn":false,"cursorEnabled":true,"pen":1,"paper":0}',
                "6.7 ": 'clearTextWindow:0,39,0,24,0 -- {"left":0,"right":39,"top":0,"bottom":24,"pos":0,"vpos":0,"textEnabled":true,"tag":false,"transparent":false,"cursorOn":false,"cursorEnabled":true,"pen":1,"paper":0}',
                "": "CpcVm: Type mismatch in 0: CLS undefined",
                '""': "CpcVm: Type mismatch in 0: CLS ",
                "8 ": "CpcVm: Improper argument in 0: CLS 8"
            },
            // commaTab
            // cont
            copychr$: {
                "0 ": "readChar:2,3,1,0 -- A",
                "7 ": "readChar:2,3,1,0 -- A",
                "": "CpcVm: Type mismatch in 0: COPYCHR$ undefined",
                '""': "CpcVm: Type mismatch in 0: COPYCHR$ ",
                "-1": "CpcVm: Improper argument in 0: COPYCHR$ -1",
                "7.9 ": "CpcVm: Improper argument in 0: COPYCHR$ 8"
            },
            cos: {
                "0 ": "1",
                "3.14159265 ": "-1",
                "": "CpcVm: Type mismatch in 0: COS undefined",
                '""': "CpcVm: Type mismatch in 0: COS "
            },
            cosDeg: {
                "0 ": "1",
                //"60 ": "0.5", //TTT
                "180 ": "-1"
            },
            creal: {
                "0 ": "0",
                "1.49 ": "1.49",
                "-1.5 ": "-1.5",
                "": "CpcVm: Type mismatch in 0: CREAL undefined",
                '""': "CpcVm: Type mismatch in 0: CREAL "
            },
            cursor: {
                "0 ": "",
                "7 ": "",
                "0,1": "drawCursor:2,3,1,0",
                "0,,1": "",
                "0,1,1": "drawCursor:2,3,1,0 -- drawCursor:2,3,1,0 -- drawCursor:2,3,1,0",
                "-1": "CpcVm: Improper argument in 0: CURSOR -1",
                "8 ": "CpcVm: Improper argument in 0: CURSOR 8",
                "0,-1": "CpcVm: Improper argument in 0: CURSOR -1",
                "0,2": "CpcVm: Improper argument in 0: CURSOR 2",
                "0,,-1": "CpcVm: Improper argument in 0: CURSOR -1",
                "0,,2": "CpcVm: Improper argument in 0: CURSOR 2",
                "": "CpcVm: Type mismatch in 0: CURSOR undefined",
                '""': "CpcVm: Type mismatch in 0: CURSOR ",
                '0,""': "CpcVm: Type mismatch in 0: CURSOR ",
                '0,,""': "CpcVm: Type mismatch in 0: CURSOR "
            },
            // data
            dec$: {
                '3,"###.##"': "  3.00",
                '2.9949,"#.##"': "2.99",
                "": "CpcVm: Type mismatch in 0: DEC$ undefined",
                '"",': "CpcVm: Type mismatch in 0: DEC$ ",
                "3,7 ": "CpcVm: Type mismatch in 0: DEC$ 7"
            },
            defint: {
                '"a"': '{"a":"I"}',
                '"b-d"': '{"b":"I","c":"I","d":"I"}',
                '"B-D"': '{"b":"I","c":"I","d":"I"}',
                '"x - z"': '{"x":"I","y":"I","z":"I"}',
                '"aa"': '{"a":"I"}',
                "": "CpcVm: Type mismatch in 0: DEFINT undefined",
                "1 ": "CpcVm: Type mismatch in 0: DEFINT 1",
                '"b-"': "{}",
                '""': "{}"
            },
            defreal: {
                '"a"': '{"a":"R"}',
                '"b-d"': '{"b":"R","c":"R","d":"R"}',
                '"B-D"': '{"b":"R","c":"R","d":"R"}',
                '"x - z"': '{"x":"R","y":"R","z":"R"}',
                '"aa"': '{"a":"R"}',
                "": "CpcVm: Type mismatch in 0: DEFREAL undefined",
                "1 ": "CpcVm: Type mismatch in 0: DEFREAL 1",
                '"b-"': "{}",
                '""': "{}"
            },
            defstr: {
                '"a"': '{"a":"$"}',
                '"b-d"': '{"b":"$","c":"$","d":"$"}',
                '"B-D"': '{"b":"$","c":"$","d":"$"}',
                '"x - z"': '{"x":"$","y":"$","z":"$"}',
                '"aa"': '{"a":"$"}',
                "": "CpcVm: Type mismatch in 0: DEFSTR undefined",
                "1 ": "CpcVm: Type mismatch in 0: DEFSTR 1",
                '"b-"': "{}",
                '""': "{}"
            },
            // deg
            "delete": {
                "": '{"reason":"deleteLines","priority":85,"paras":{"command":"DELETE","stream":0,"first":1,"last":65535,"line":0}}',
                '""': "CpcVm: Type mismatch in 0: DELETE ",
                "1 ": '{"reason":"deleteLines","priority":85,"paras":{"command":"DELETE","stream":0,"first":1,"last":1,"line":0}}',
                "65535.2 ": '{"reason":"deleteLines","priority":85,"paras":{"command":"DELETE","stream":0,"first":65535,"last":65535,"line":0}}',
                "65536 ": "CpcVm: Overflow in 0: DELETE 65536",
                "1,123": '{"reason":"deleteLines","priority":85,"paras":{"command":"DELETE","stream":0,"first":1,"last":123,"line":0}}',
                ",123": '{"reason":"deleteLines","priority":85,"paras":{"command":"DELETE","stream":0,"first":1,"last":123,"line":0}}',
                ",65536": "CpcVm: Overflow in 0: DELETE 65536"
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
                "": "-1,-1,0"
            },
            // erase
            erl: {
                "": "123"
            },
            err: {
                "": "31"
            },
            // error
            everyGosub: {
                "0,0,123": '{"active":false}',
                "0.5,0,123": '{"active":true,"intervalMs":20,"line":123,"repeat":true}',
                "32767.4,0,123": '{"active":true,"intervalMs":655340,"line":123,"repeat":true}',
                "-1,0,123": "CpcVm: Improper argument in 0: EVERY -1",
                "32768,0,123": "CpcVm: Overflow in 0: EVERY 32768",
                "10,1,123": '{"intervalMs":200,"line":123,"repeat":true,"active":true}',
                "10,3.4,123": '{"intervalMs":200,"line":123,"repeat":true,"active":true}',
                "10,-1,123": "CpcVm: Improper argument in 0: EVERY -1",
                "10,3.9,123": "CpcVm: Improper argument in 0: EVERY 4"
            },
            // exp
            // fill
            fill: {
                "": "CpcVm: Type mismatch in 0: FILL undefined",
                '""': "CpcVm: Type mismatch in 0: FILL ",
                "0 ": "fill:0",
                "15.4 ": "fill:15",
                "-1": "CpcVm: Improper argument in 0: FILL -1",
                "16 ": "CpcVm: Improper argument in 0: FILL 16"
            },
            fix: {
                "": "CpcVm: Type mismatch in 0: FIX undefined",
                "0 ": "0",
                "2.77 ": "2",
                "-2.3": "-2",
                "123.466 ": "123"
            },
            frame: {
                "": '{"reason":"waitFrame","priority":40,"paras":{}}'
            },
            fre: {
                "": "42747,370"
                //"0 ": "",
                //'""': ""
            },
            // ...
            "int": {
                "0 ": "0",
                "1 ": "1",
                "2.7 ": "2",
                "-2.3": "-3",
                '"0"': "CpcVm: Type mismatch in 0: INT 0"
            },
            "new": {
                "": '{"reason":"new","priority":90,"paras":{"command":"new","stream":0,"first":0,"last":0,"line":0}}'
            },
            renum: {
                "": '{"reason":"renumLines","priority":85,"paras":{"command":"renum","stream":0,"line":0,"newLine":10,"oldLine":1,"step":10,"keep":65535}}',
                "10 ": '{"reason":"renumLines","priority":85,"paras":{"command":"renum","stream":0,"line":0,"newLine":10,"oldLine":1,"step":10,"keep":65535}}',
                "100,90,15,9000": '{"reason":"renumLines","priority":85,"paras":{"command":"renum","stream":0,"line":0,"newLine":100,"oldLine":90,"step":15,"keep":9000}}'
            },
            tan: {
                "0 ": "0",
                "0.7853981633974483 ": "0.9999999999999999"
            },
            tanDeg: {
                "0 ": "0",
                "45 ": "0.9999999999999999"
            }
        }, allTestFunctions = {
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
                clearLastTestFunctions();
                cpcVm.border.apply(cpcVm, input);
                return combineLastTestFunctions();
            },
            call: function (cpcVm, input) {
                var stopObject0 = JSON.stringify(cpcVm.vmGetStopObject());
                clearLastTestFunctions();
                cpcVm.call.apply(cpcVm, input);
                var stopObject1 = JSON.stringify(cpcVm.vmGetStopObject()), results = [combineLastTestFunctions()];
                if (stopObject0 !== stopObject1) {
                    results.push(stopObject1);
                }
                return results.join(" -- ");
            },
            cat: function (cpcVm, input) {
                cpcVm.cat.apply(cpcVm, input);
                return JSON.stringify(cpcVm.vmGetStopObject());
            },
            chain: function (cpcVm, input) {
                cpcVm.chain.apply(cpcVm, input);
                return JSON.stringify(cpcVm.vmGetStopObject()) + " -- " + JSON.stringify(cpcVm.vmGetInFileObject());
            },
            chainMerge: function (cpcVm, input) {
                cpcVm.chainMerge.apply(cpcVm, input);
                return JSON.stringify(cpcVm.vmGetStopObject()) + " -- " + JSON.stringify(cpcVm.vmGetInFileObject());
            },
            chr$: function (cpcVm, input) {
                return cpcVm.chr$.apply(cpcVm, input);
            },
            cint: function (cpcVm, input) {
                return String(cpcVm.cint.apply(cpcVm, input));
            },
            clearInput: function (cpcVm, input) {
                clearLastTestFunctions();
                cpcVm.clearInput.apply(cpcVm, input);
                return combineLastTestFunctions();
            },
            clg: function (cpcVm, input) {
                clearLastTestFunctions();
                cpcVm.clg.apply(cpcVm, input);
                return combineLastTestFunctions();
            },
            closein: function (cpcVm, input) {
                var inFile = cpcVm.vmGetInFileObject();
                inFile.open = true;
                inFile.command = "test1";
                inFile.name = "name1";
                cpcVm.closein.apply(cpcVm, input);
                return JSON.stringify(inFile);
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
                var stopObject0 = JSON.stringify(cpcVm.vmGetStopObject());
                cpcVm.closeout.apply(cpcVm, input);
                var stopObject1 = JSON.stringify(cpcVm.vmGetStopObject()), results = [JSON.stringify(outFile)];
                if (stopObject0 !== stopObject1) {
                    results.push(stopObject1);
                }
                return results.join(" -- ");
            },
            /*
            closeout: function (cpcVm: CpcVm, input: TestFunctionInputType[]) {
                const outFile = cpcVm.vmGetOutFileObject(),
                    closeoutCases = [];

                cpcVm.closeout.apply(cpcVm, input);
                closeoutCases.push(JSON.stringify(outFile));

                outFile.open = true;
                outFile.command = "openout";
                outFile.name = "name1";
                cpcVm.closeout.apply(cpcVm, input);
                closeoutCases.push(JSON.stringify(outFile));

                outFile.open = true;
                outFile.command = "openout";
                outFile.name = "name1";
                outFile.fileData[0] = "A";
                cpcVm.closeout.apply(cpcVm, input);
                closeoutCases.push(JSON.stringify(outFile));

                return closeoutCases.join(" -- ");
            },
            */
            cls: function (cpcVm, input) {
                cpcVm.vmChangeMode(1);
                cpcVm.vmResetWindowData(true); // prepare
                var stream = cpcVm.vmRound(Number(input)), win = cpcVm.vmInternal.getWindowDataList.call(cpcVm)[stream];
                if (win) {
                    win.pos = 2;
                    win.vpos = 3;
                }
                clearLastTestFunctions();
                cpcVm.cls.apply(cpcVm, input);
                return combineLastTestFunctions() + " -- " + JSON.stringify(win);
            },
            copychr$: function (cpcVm, input) {
                cpcVm.vmChangeMode(1);
                cpcVm.vmResetWindowData(true); // prepare
                var stream = cpcVm.vmRound(Number(input)), win = cpcVm.vmInternal.getWindowDataList.call(cpcVm)[stream];
                if (win) {
                    win.pos = 2;
                    win.vpos = 3;
                }
                clearLastTestFunctions();
                var char = cpcVm.copychr$.apply(cpcVm, input);
                return combineLastTestFunctions() + " -- " + char;
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
                cpcVm.vmChangeMode(1);
                cpcVm.vmResetWindowData(true); // prepare
                var stream = cpcVm.vmRound(Number(input)), win = cpcVm.vmInternal.getWindowDataList.call(cpcVm)[stream];
                if (win) {
                    win.pos = 2;
                    win.vpos = 3;
                }
                clearLastTestFunctions();
                cpcVm.cursor.apply(cpcVm, input);
                return combineLastTestFunctions();
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
                return JSON.stringify(cpcVm.vmGetStopObject());
            },
            derr: function (cpcVm, input) {
                return String(cpcVm.derr.apply(cpcVm, input));
            },
            edit: function (cpcVm, input) {
                cpcVm.edit.apply(cpcVm, input);
                return JSON.stringify(cpcVm.vmGetStopObject());
            },
            eof: function (cpcVm, input) {
                var inFile = cpcVm.vmGetInFileObject(), eofCases = [];
                eofCases.push(String(cpcVm.eof.apply(cpcVm, input)));
                inFile.open = true;
                eofCases.push(String(cpcVm.eof.apply(cpcVm, input)));
                inFile.fileData.push("A");
                eofCases.push(String(cpcVm.eof.apply(cpcVm, input)));
                return eofCases.join(",");
            },
            erl: function (cpcVm, input) {
                cpcVm.line = "123aa";
                cpcVm.vmComposeError(Error(), 1, "");
                return String(cpcVm.erl.apply(cpcVm, input));
            },
            err: function (cpcVm, input) {
                cpcVm.vmComposeError(Error(), 31, "");
                return String(cpcVm.err.apply(cpcVm, input));
            },
            everyGosub: function (cpcVm, input) {
                cpcVm.everyGosub.apply(cpcVm, input);
                var timer = Number(cpcVm.vmRound(Number(input[1]))), timerEntry = cpcVm.vmInternal.getTimerList.call(cpcVm)[timer];
                timerEntry.nextTimeMs = undefined;
                return JSON.stringify(timerEntry);
            },
            fill: function (cpcVm, input) {
                clearLastTestFunctions();
                cpcVm.fill.apply(cpcVm, input);
                return combineLastTestFunctions();
            },
            fix: function (cpcVm, input) {
                return String(cpcVm.fix.apply(cpcVm, input));
            },
            frame: function (cpcVm, input) {
                // cpcVm.vmStop("", 0, true); // not needed
                cpcVm.frame.apply(cpcVm, input);
                return JSON.stringify(cpcVm.vmGetStopObject());
            },
            fre: function (cpcVm, input) {
                var freCases = [];
                freCases.push(String(cpcVm.fre.apply(cpcVm, input)));
                cpcVm.memory(370);
                freCases.push(String(cpcVm.fre.apply(cpcVm, input)));
                return freCases.join(",");
            },
            "int": function (cpcVm, input) {
                return String(cpcVm.int.apply(cpcVm, input));
            },
            "new": function (cpcVm, input) {
                cpcVm.new.apply(cpcVm, input);
                return JSON.stringify(cpcVm.vmGetStopObject());
            },
            renum: function (cpcVm, input) {
                cpcVm.renum.apply(cpcVm, input);
                return JSON.stringify(cpcVm.vmGetStopObject());
            },
            tan: function (cpcVm, input) {
                cpcVm.rad();
                return String(cpcVm.tan.apply(cpcVm, input));
            },
            tanDeg: function (cpcVm, input) {
                cpcVm.deg();
                return String(cpcVm.tan.apply(cpcVm, input));
            }
        };
        /*
        hooks.beforeEach(function (this: any) {
            const that = this, // eslint-disable-line no-invalid-this, @typescript-eslint/no-this-alias
                config = {
                    canvas: {},
                    keyboard: {},
                    sound: {},
                    variables: {},
                    tron: false
                } as CpcVmOptions;
    
            that.CpcVm = new CpcVm(config);
        });
        */
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
        /*
        QUnit.test("renum", function (this: any, assert: Assert) {
            const cpcVm = this.CpcVm, // eslint-disable-line no-invalid-this
                renumTests: TestsType = {
                    "": '{"reason":"renumLines","priority":85,"paras":{"command":"renum","stream":0,"line":0,"newLine":10,"oldLine":1,"step":10,"keep":65535}}',
                    "10 ": '{"reason":"renumLines","priority":85,"paras":{"command":"renum","stream":0,"line":0,"newLine":10,"oldLine":1,"step":10,"keep":65535}}',
                    "100,90,15,9000": '{"reason":"renumLines","priority":85,"paras":{"command":"renum","stream":0,"line":0,"newLine":100,"oldLine":90,"step":15,"keep":9000}}'
                };
    
            for (const key in renumTests) {
                if (renumTests.hasOwnProperty(key)) {
                    const input = adaptParameters(key.split(","));
                    let result: string;
    
                    try {
                        cpcVm.renum.apply(cpcVm, input);
                        const stopObject = cpcVm.vmGetStopObject();
    
                        result = JSON.stringify(stopObject);
                    } catch (e) {
                        Utils.console.error(e);
                        result = String(e);
                    }
    
                    const expected = renumTests[key],
                        msg = ["renum", key].join(" "); // eslint-disable-line array-element-newline
    
                    assert.strictEqual(result, expected, msg);
                }
            }
        });
        */
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
                    var input = key === "" ? [] : adaptParameters(key.split(",")), expected = tests[key];
                    var result = void 0;
                    try {
                        result = testFunction(cpcVm, input);
                    }
                    catch (e) {
                        result = String(e);
                        if (result !== expected) {
                            Utils_1.Utils.console.error(e); // only if not expected
                        }
                    }
                    if (results) {
                        results.push('"' + key.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/"/g, '\\"') + '": "' + result.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/"/g, '\\"') + '"');
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