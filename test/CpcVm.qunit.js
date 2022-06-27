// CpcVm.qunit.ts - QUnit tests for CPCBasic CpcVm
//
define(["require", "exports", "../Utils", "../CpcVm", "./TestHelper"], function (require, exports, Utils_1, CpcVm_1, TestHelper_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var lastTestFunction = {
        name: "",
        args: []
    }, mockCanvas = {
        setBorder: function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            lastTestFunction.name = "setBorder";
            lastTestFunction.args = args;
        }
    }, mockKeyboard = {}, mockSound = {}, mockVariables = {};
    // https://www.cpcwiki.eu/index.php/Locomotive_BASIC
    QUnit.module("CpcVm: Tests", function () {
        var allTests = {
            // abs
            // addressOf
            // afterGosub
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
            // call
            cat: {
                "": '{"reason":"fileCat","priority":45,"paras":{"command":"cat","stream":0,"fileMask":"","line":0}}'
            },
            chain: {
                "": "CpcVm: Type mismatch in 0: CHAIN undefined",
                '"file1"': '{"reason":"fileLoad","priority":90,"paras":{}} -- {"open":true,"command":"chain","name":"file1","line":0,"start":0,"fileData":[],"first":0,"last":0,"memorizedExample":""}',
                '"file1",123': '{"reason":"fileLoad","priority":90,"paras":{}} -- {"open":true,"command":"chain","name":"file1","line":123,"start":0,"fileData":[],"first":0,"last":0,"memorizedExample":""}',
                "7 ": "CpcVm: Type mismatch in 0: CHAIN 7"
            },
            chainMerge: {
                "": "CpcVm: Type mismatch in 0: CHAIN MERGE undefined",
                '"file1"': '{"reason":"fileLoad","priority":90,"paras":{}} -- {"open":true,"command":"chainMerge","name":"file1","line":0,"start":0,"fileData":[],"first":0,"last":0,"memorizedExample":""}',
                '"file1",123': '{"reason":"fileLoad","priority":90,"paras":{}} -- {"open":true,"command":"chainMerge","name":"file1","line":123,"start":0,"fileData":[],"first":0,"last":0,"memorizedExample":""}',
                '"file1",123,10': '{"reason":"fileLoad","priority":90,"paras":{}} -- {"open":true,"command":"chainMerge","name":"file1","line":123,"start":0,"fileData":[],"first":10,"last":0,"memorizedExample":""}',
                '"file1",123,20': '{"reason":"fileLoad","priority":90,"paras":{}} -- {"open":true,"command":"chainMerge","name":"file1","line":123,"start":0,"fileData":[],"first":20,"last":0,"memorizedExample":""}',
                "7 ": "CpcVm: Type mismatch in 0: CHAIN MERGE 7"
            },
            chr$: {
                "0 ": String.fromCharCode(0),
                "65 ": "A",
                "65,66": "A",
                "255 ": String.fromCharCode(255),
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
                '""': "CpcVm: Type mismatch in 0: CINT "
            },
            // TODO continue...
            // clear
            // clearInput
            // clg
            // closein
            // closeout
            // cls
            // commaTab
            // cont
            // copychr$
            // cos
            // creal
            // cursor
            // data
            // dec$
            // defint
            // defreal
            // defstr
            // deg
            // delete
            // derr
            // di
            // dim
            // draw
            // drawr
            // edit
            edit: {
                "": '{"reason":"editLine","priority":85,"paras":{"command":"edit","stream":0,"last":0,"line":0}}',
                "123 ": '{"reason":"editLine","priority":85,"paras":{"command":"edit","stream":0,"first":123,"last":0,"line":0}}'
            },
            // ...
            "int": {
                "0 ": "0",
                "1 ": "1",
                "2.7 ": "2",
                "-2.3": "-3",
                '"0"': "CpcVm: Type mismatch in 0: INT 0"
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
                /*
                cpcVm.canvas.setBorder = function(i1: number, i2: number) {
                };
                */
                cpcVm.border.apply(cpcVm, input);
                var result = lastTestFunction.name + ":" + lastTestFunction.args.join(",");
                return result;
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
            edit: function (cpcVm, input) {
                cpcVm.edit.apply(cpcVm, input);
                return JSON.stringify(cpcVm.vmGetStopObject());
            },
            "int": function (cpcVm, input) {
                return String(cpcVm.int.apply(cpcVm, input));
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
                    b.push(parseFloat(a[i]));
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
                    var input = adaptParameters(key.split(",")), expected = tests[key];
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