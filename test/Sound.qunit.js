// Sound.qunit.ts - QUnit tests for CPCBasic Sound
//
define(["require", "exports", "../Utils", "../Sound", "./TestHelper"], function (require, exports, Utils_1, Sound_1, TestHelper_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var lastTestFunctions = [];
    function clearLastTestFunctions() {
        lastTestFunctions.length = 0;
    }
    function combineLastTestFunctions() {
        return lastTestFunctions.map(function (lastTestFunction) { return Object.keys(lastTestFunction)[0] + ":" + Object.values(lastTestFunction)[0]; }).join(" , ") || undefined;
    }
    function combineResult(result) {
        var combinedTestFunctions = combineLastTestFunctions(), combinedResult = [];
        if (combinedTestFunctions !== undefined) {
            combinedResult.push(combinedTestFunctions);
        }
        if (result !== undefined) {
            combinedResult.push(result);
        }
        return combinedResult.join(" -- ");
    }
    /* eslint-disable class-methods-use-this */ /* eslint-disable class-methods-use-this */
    var AudioContextMock = /** @class */ (function () {
        function AudioContextMock() {
            this.currentTime = 0;
        }
        AudioContextMock.prototype.createChannelMerger = function () {
            var args = []; /*_numberOfInputs?: number */
            for (var _i = 0 /*_numberOfInputs?: number */; _i < arguments.length /*_numberOfInputs?: number */; _i++ /*_numberOfInputs?: number */) {
                args[_i] = arguments[_i]; /*_numberOfInputs?: number */
            }
            lastTestFunctions.push({
                createChannelMerger: args
            });
            return {
                connect: function () {
                    var args2 = []; /* destinationNode: AudioNode, output?: number, input?: number */
                    for (var _i = 0 /* destinationNode: AudioNode, output?: number, input?: number */; _i < arguments.length /* destinationNode: AudioNode, output?: number, input?: number */; _i++ /* destinationNode: AudioNode, output?: number, input?: number */) {
                        args2[_i] = arguments[_i]; /* destinationNode: AudioNode, output?: number, input?: number */
                    }
                    lastTestFunctions.push({
                        "channelMerger:connect": args2
                    });
                    return this;
                },
                disconnect: function () {
                    var args2 = []; /* destinationNode: AudioNode */
                    for (var _i = 0 /* destinationNode: AudioNode */; _i < arguments.length /* destinationNode: AudioNode */; _i++ /* destinationNode: AudioNode */) {
                        args2[_i] = arguments[_i]; /* destinationNode: AudioNode */
                    }
                    lastTestFunctions.push({
                        "channelMerger:disconnect": args2
                    });
                },
                toString: function () {
                    return "[obj: channelMerger]";
                }
            };
        };
        AudioContextMock.prototype.createGain = function () {
            lastTestFunctions.push({
                createGain: []
            });
            return {
                connect: function () {
                    var args = []; /* destinationNode: AudioNode, output?: number, input?: number */
                    for (var _i = 0 /* destinationNode: AudioNode, output?: number, input?: number */; _i < arguments.length /* destinationNode: AudioNode, output?: number, input?: number */; _i++ /* destinationNode: AudioNode, output?: number, input?: number */) {
                        args[_i] = arguments[_i]; /* destinationNode: AudioNode, output?: number, input?: number */
                    }
                    lastTestFunctions.push({
                        "gain:connect": args
                    });
                    //return this;
                },
                gain: {
                    setValueAtTime: function () {
                        var args = []; /* value: number, _startTime: number */
                        for (var _i = 0 /* value: number, _startTime: number */; _i < arguments.length /* value: number, _startTime: number */; _i++ /* value: number, _startTime: number */) {
                            args[_i] = arguments[_i]; /* value: number, _startTime: number */
                        }
                        lastTestFunctions.push({
                            "gain:gain.setValueAtTime": args
                        });
                    },
                    linearRampToValueAtTime: function () {
                        var args = []; /* value: number, endTime: number */
                        for (var _i = 0 /* value: number, endTime: number */; _i < arguments.length /* value: number, endTime: number */; _i++ /* value: number, endTime: number */) {
                            args[_i] = arguments[_i]; /* value: number, endTime: number */
                        }
                        lastTestFunctions.push({
                            "gain:gain.linearRampToValueAtTime": args
                        });
                    }
                },
                toString: function () {
                    return "[obj: gain]";
                }
            };
        };
        AudioContextMock.prototype.createBuffer = function () {
            var args = []; /* numberOfChannels: number, length: number, sampleRate: number */
            for (var _i = 0 /* numberOfChannels: number, length: number, sampleRate: number */; _i < arguments.length /* numberOfChannels: number, length: number, sampleRate: number */; _i++ /* numberOfChannels: number, length: number, sampleRate: number */) {
                args[_i] = arguments[_i]; /* numberOfChannels: number, length: number, sampleRate: number */
            }
            lastTestFunctions.push({
                createBuffer: args
            });
            return {
                getChannelData: function () {
                    var args2 = []; /* channel: number */
                    for (var _i = 0 /* channel: number */; _i < arguments.length /* channel: number */; _i++ /* channel: number */) {
                        args2[_i] = arguments[_i]; /* channel: number */
                    }
                    lastTestFunctions.push({
                        "createBuffer:getChannelData": args2
                    });
                    return new Float32Array(); //TTT
                }
            };
        };
        AudioContextMock.prototype.createBufferSource = function () {
            lastTestFunctions.push({
                createBufferSource: []
            });
            return {
                start: function () {
                    var args = []; /* when?: number, offset?: number, duration?: number */
                    for (var _i = 0 /* when?: number, offset?: number, duration?: number */; _i < arguments.length /* when?: number, offset?: number, duration?: number */; _i++ /* when?: number, offset?: number, duration?: number */) {
                        args[_i] = arguments[_i]; /* when?: number, offset?: number, duration?: number */
                    }
                    lastTestFunctions.push({
                        "bufferSource:start": args
                    });
                },
                stop: function () {
                    var args = []; /* when?: number */
                    for (var _i = 0 /* when?: number */; _i < arguments.length /* when?: number */; _i++ /* when?: number */) {
                        args[_i] = arguments[_i]; /* when?: number */
                    }
                    lastTestFunctions.push({
                        "bufferSource:stop": args
                    });
                }
            };
        };
        AudioContextMock.prototype.createBiquadFilter = function () {
            lastTestFunctions.push({
                createBiquadFilter: []
            });
            return {};
        };
        AudioContextMock.prototype.createOscillator = function () {
            lastTestFunctions.push({
                createOscillator: []
            });
            return {
                frequency: {
                    value: 0,
                    setValueAtTime: function () {
                        var args = []; /* value: number, startTime: number */
                        for (var _i = 0 /* value: number, startTime: number */; _i < arguments.length /* value: number, startTime: number */; _i++ /* value: number, startTime: number */) {
                            args[_i] = arguments[_i]; /* value: number, startTime: number */
                        }
                        lastTestFunctions.push({
                            "oscillator.frequency.setValueAtTime": args
                        });
                    }
                },
                //type: "",
                connect: function () {
                    var args = []; /* destinationNode: AudioNode, _output?: number, _input?: number */
                    for (var _i = 0 /* destinationNode: AudioNode, _output?: number, _input?: number */; _i < arguments.length /* destinationNode: AudioNode, _output?: number, _input?: number */; _i++ /* destinationNode: AudioNode, _output?: number, _input?: number */) {
                        args[_i] = arguments[_i]; /* destinationNode: AudioNode, _output?: number, _input?: number */
                    }
                    lastTestFunctions.push({
                        "oscillator.connect": args
                    });
                },
                start: function () {
                    var args = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        args[_i] = arguments[_i];
                    }
                    lastTestFunctions.push({
                        "oscillator.start": args
                    });
                },
                stop: function () {
                    var args = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        args[_i] = arguments[_i];
                    }
                    lastTestFunctions.push({
                        "oscillator.stop": args
                    });
                }
            };
        };
        return AudioContextMock;
    }());
    /* eslint-enable class-methods-use-this */
    QUnit.module("Sound: Tests1", function (hooks) {
        var that = {}; // eslint-disable-line consistent-this
        hooks.beforeEach(function () {
            that.sound = new Sound_1.Sound({
                AudioContextConstructor: AudioContextMock
            });
            //that.model.setProperty("p2", "v2");
        });
        QUnit.test("create class", function (assert) {
            /*
            const sound = new Sound({
                AudioContextConstructor: AudioContextMock
            });
            */
            assert.ok(that.sound, "defined");
        });
        QUnit.test("reset", function (assert) {
            var sound = that.sound;
            sound.reset();
            assert.strictEqual(sound.testCanQueue(0), true, "testCanQueue(0): true");
        });
        QUnit.test("soundOn", function (assert) {
            var sound = that.sound;
            assert.strictEqual(sound.isActivatedByUser(), false, "isActivatedByUser: false");
            sound.soundOn();
            assert.strictEqual(sound.testCanQueue(0), false, "testCanQueue(0): false");
            assert.strictEqual(sound.isActivatedByUser(), false, "isActivatedByUser: false");
            sound.setActivatedByUser();
            assert.strictEqual(sound.isActivatedByUser(), true, "isActivatedByUser: true");
            assert.strictEqual(sound.testCanQueue(0), true, "testCanQueue(0): true");
            sound.soundOff();
        });
        /*
        QUnit.test("sound", function (assert) {
            const sound = that.sound;
    
            sound.soundOn();
            sound.setActivatedByUser();
            assert.strictEqual(sound.testCanQueue(0), true, "testCanQueue(0): true");
    
            //clearLastTestFunctions();
            sound.sound({
                state: 1,
                period: 100
            } as SoundData);
    
            const expected = "";
    
            assert.strictEqual(combineResult(""), expected, "sound 1, 100");
    
            sound.soundOff();
    
            clearLastTestFunctions();
        });
        */
    });
    QUnit.module("Sound: Tests", function () {
        var allTests = {
            sound: {
                "1,100,3": "createOscillator: , oscillator.connect:[obj: gain] , gain:gain.setValueAtTime:NaN,0 , oscillator.start:0 , oscillator.stop:0.03 -- undefined"
            }
        }, allTestFunctions = {
            sound: function (sound, input) {
                var soundData = {
                    state: input[0],
                    period: input[1],
                    duration: input[2],
                    volume: input[3],
                    volEnv: input[4],
                    toneEnv: input[5],
                    noise: input[6]
                };
                return String(sound.sound(soundData));
                //return String(sound.sound.apply(sound, input));
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
        function runTestsFor(category, tests, assert, results) {
            var sound = new Sound_1.Sound({
                AudioContextConstructor: AudioContextMock
            }), testFunction = allTestFunctions[category];
            sound.soundOn();
            sound.setActivatedByUser();
            for (var key in tests) {
                if (tests.hasOwnProperty(key)) {
                    clearLastTestFunctions();
                    sound.reset();
                    var //vmState0 = getVmState(cpcVm),
                    input = key === "" ? [] : adaptParameters(key.split(",")), expected = tests[key];
                    var result = void 0;
                    try {
                        if (!testFunction) {
                            throw new Error("Undefined testFunction: " + category);
                        }
                        result = testFunction(sound, input);
                        result = combineResult(result); //, vmState0, getVmState(cpcVm));
                    }
                    catch (e) {
                        result = String(e);
                        result = combineResult(result); //, vmState0, getVmState(cpcVm));
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
            sound.soundOff();
        }
        TestHelper_1.TestHelper.generateAndRunAllTests(allTests, runTestsFor);
    });
});
// end
//# sourceMappingURL=Sound.qunit.js.map