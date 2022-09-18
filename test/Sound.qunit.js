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
            this.sampleRate = 24000; // 48000;
            this.currentTime = 0;
        }
        AudioContextMock.prototype.createChannelMerger = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            lastTestFunctions.push({
                createChannelMerger: args
            });
            return {
                connect: function () {
                    var args2 = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        args2[_i] = arguments[_i];
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
                    return "[obj channelMerger]";
                }
            };
        };
        AudioContextMock.prototype.createGain = function () {
            lastTestFunctions.push({
                createGain: []
            });
            return {
                connect: function () {
                    var args = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        args[_i] = arguments[_i];
                    }
                    lastTestFunctions.push({
                        "gain:connect": args
                    });
                    //return this;
                },
                gain: {
                    setValueAtTime: function () {
                        var args = [];
                        for (var _i = 0; _i < arguments.length; _i++) {
                            args[_i] = arguments[_i];
                        }
                        lastTestFunctions.push({
                            "gain:gain.setValueAtTime": args
                        });
                    },
                    linearRampToValueAtTime: function () {
                        var args = [];
                        for (var _i = 0; _i < arguments.length; _i++) {
                            args[_i] = arguments[_i];
                        }
                        lastTestFunctions.push({
                            "gain:gain.linearRampToValueAtTime": args
                        });
                    }
                },
                toString: function () {
                    return "[obj gain]";
                }
            };
        };
        AudioContextMock.prototype.createBuffer = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            lastTestFunctions.push({
                createBuffer: args
            });
            var length = args[1], buffer = new Float32Array(length);
            return {
                getChannelData: function () {
                    var args2 = []; /* channel: number */
                    for (var _i = 0 /* channel: number */; _i < arguments.length /* channel: number */; _i++ /* channel: number */) {
                        args2[_i] = arguments[_i]; /* channel: number */
                    }
                    lastTestFunctions.push({
                        "createBuffer:getChannelData": args2
                    });
                    return buffer; //new Float32Array(); // TODO
                }
            };
        };
        AudioContextMock.prototype.createBufferSource = function () {
            lastTestFunctions.push({
                createBufferSource: []
            });
            return {
                start: function () {
                    var args = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        args[_i] = arguments[_i];
                    }
                    lastTestFunctions.push({
                        "bufferSource:start": args
                    });
                },
                stop: function () {
                    var args = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        args[_i] = arguments[_i];
                    }
                    lastTestFunctions.push({
                        "bufferSource:stop": args
                    });
                },
                connect: function () {
                    var args = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        args[_i] = arguments[_i];
                    }
                    lastTestFunctions.push({
                        "bufferSource.connect": args
                    });
                    return this;
                }
            };
        };
        AudioContextMock.prototype.createBiquadFilter = function () {
            lastTestFunctions.push({
                createBiquadFilter: []
            });
            return {
                frequency: {
                    value: 0
                },
                toString: function () {
                    return "[obj BiquadFilterNode]";
                }
            };
        };
        AudioContextMock.prototype.createOscillator = function () {
            lastTestFunctions.push({
                createOscillator: []
            });
            return {
                frequency: {
                    value: 0,
                    setValueAtTime: function () {
                        var args = [];
                        for (var _i = 0; _i < arguments.length; _i++) {
                            args[_i] = arguments[_i];
                        }
                        lastTestFunctions.push({
                            "oscillator.frequency.setValueAtTime": args
                        });
                    }
                },
                //type: "",
                connect: function () {
                    var args = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        args[_i] = arguments[_i];
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
                },
                disconnect: function () {
                    var args = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        args[_i] = arguments[_i];
                    }
                    lastTestFunctions.push({
                        "oscillator.disconnect": args
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
                "1,100,3,12": "createOscillator: , oscillator.connect:[obj gain] , gain:gain.setValueAtTime:0.6400000000000001,0 , oscillator.start:0 , oscillator.stop:0.03 -- undefined",
                "1,100,20,10,0,0,5": "oscillator.stop: , oscillator.disconnect: , createOscillator: , oscillator.connect:[obj gain] , gain:gain.setValueAtTime:0.4444444444444444,0 , oscillator.start:0 , oscillator.stop:0.2 , createBuffer:1,4800,24000 , createBuffer:getChannelData:0 , createBufferSource: , createBiquadFilter: , bufferSource.connect:[obj BiquadFilterNode] , bufferSource.connect:[obj gain] , bufferSource:start:0 , bufferSource:stop:0.2 -- undefined",
                "135,90,20,12,0,0,0": "oscillator.stop: , oscillator.disconnect: , createOscillator: , oscillator.connect:[obj gain] , gain:gain.setValueAtTime:0.6400000000000001,0 , oscillator.start:0 , oscillator.stop:0.2 , createOscillator: , oscillator.connect:[obj gain] , gain:gain.setValueAtTime:0.6400000000000001,0 , oscillator.start:0 , oscillator.stop:0.2 , createOscillator: , oscillator.connect:[obj gain] , gain:gain.setValueAtTime:0.6400000000000001,0 , oscillator.start:0 , oscillator.stop:0.2 -- undefined"
            },
            setToneEnv: {
                "1,3,2,2": "undefined"
            },
            setVolEnv: {
                "1,3,2,2": "undefined"
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
            },
            setToneEnv: function (sound, input) {
                var toneEnv = input[0], toneEnvList = [];
                for (var i = 1; i < input.length - 1; i += 3) {
                    var toneEnvData = void 0;
                    if (input[i] !== "=") {
                        toneEnvData = {
                            steps: input[i],
                            diff: input[i + 1],
                            time: input[i + 2],
                            repeat: input[i + 2] < 0
                        };
                    }
                    else {
                        toneEnvData = {
                            period: input[i + 1],
                            time: input[i + 2]
                        };
                    }
                    toneEnvList.push(toneEnvData);
                }
                return String(sound.setToneEnv(toneEnv, toneEnvList));
            },
            setVolEnv: function (sound, input) {
                var volEnv = input[0], volEnvList = [];
                for (var i = 1; i < input.length - 1; i += 3) {
                    var volEnvData = void 0;
                    if (input[i] !== "=") {
                        volEnvData = {
                            steps: input[i],
                            diff: input[i + 1],
                            time: input[i + 2]
                        };
                    }
                    else {
                        volEnvData = {
                            register: input[i + 1],
                            period: input[i + 2]
                        };
                    }
                    volEnvList.push(volEnvData);
                }
                return String(sound.setVolEnv(volEnv, volEnvList));
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