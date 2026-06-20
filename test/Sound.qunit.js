// Sound.qunit.ts - QUnit tests for CPCBasic Sound
//
import { Utils } from "../Utils";
import { Sound } from "../ui/Sound";
import { TestHelper } from "./TestHelper";
const lastTestFunctions = [];
function clearLastTestFunctions() {
    lastTestFunctions.length = 0;
}
function combineLastTestFunctions() {
    return lastTestFunctions.map((lastTestFunction) => Object.keys(lastTestFunction)[0] + ":" + Object.values(lastTestFunction)[0]).join(" , ") || undefined;
}
function combineResult(result) {
    const combinedTestFunctions = combineLastTestFunctions(), combinedResult = [];
    if (combinedTestFunctions !== undefined) {
        combinedResult.push(combinedTestFunctions);
    }
    if (result !== undefined) {
        combinedResult.push(result);
    }
    return combinedResult.join(" -- ");
}
/* eslint-disable class-methods-use-this */ /* eslint-disable class-methods-use-this */
class AudioContextMock {
    constructor() {
        this.sampleRate = 24000; // 48000;
        this.currentTime = 0;
    }
    createChannelMerger(...args) {
        lastTestFunctions.push({
            createChannelMerger: args
        });
        return {
            connect: function (...args2) {
                lastTestFunctions.push({
                    "channelMerger:connect": args2
                });
                return this;
            },
            disconnect: function (...args2 /* destinationNode: AudioNode */) {
                lastTestFunctions.push({
                    "channelMerger:disconnect": args2
                });
            },
            toString: function () {
                return "[obj channelMerger]";
            }
        };
    }
    createGain() {
        lastTestFunctions.push({
            createGain: []
        });
        return {
            connect: function (...args) {
                lastTestFunctions.push({
                    "gain:connect": args
                });
            },
            gain: {
                setValueAtTime: function (...args) {
                    lastTestFunctions.push({
                        "gain:gain.setValueAtTime": args
                    });
                },
                linearRampToValueAtTime: function (...args) {
                    lastTestFunctions.push({
                        "gain:gain.linearRampToValueAtTime": args
                    });
                }
            },
            toString: function () {
                return "[obj gain]";
            }
        };
    }
    createBuffer(...args) {
        lastTestFunctions.push({
            createBuffer: args
        });
        const length = args[1], buffer = new Float32Array(length);
        return {
            getChannelData: function (...args2 /* channel: number */) {
                lastTestFunctions.push({
                    "createBuffer:getChannelData": args2
                });
                return buffer; // TODO: new Float32Array()
            }
        };
    }
    createBufferSource() {
        lastTestFunctions.push({
            createBufferSource: []
        });
        return {
            start: function (...args) {
                lastTestFunctions.push({
                    "bufferSource:start": args
                });
            },
            stop: function (...args) {
                lastTestFunctions.push({
                    "bufferSource:stop": args
                });
            },
            connect: function (...args) {
                lastTestFunctions.push({
                    "bufferSource.connect": args
                });
                return this;
            }
        };
    }
    createBiquadFilter() {
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
    }
    createOscillator() {
        lastTestFunctions.push({
            createOscillator: []
        });
        return {
            frequency: {
                value: 0,
                setValueAtTime: function (...args) {
                    lastTestFunctions.push({
                        "oscillator.frequency.setValueAtTime": args
                    });
                }
            },
            connect: function (...args) {
                lastTestFunctions.push({
                    "oscillator.connect": args
                });
            },
            start: function (...args) {
                lastTestFunctions.push({
                    "oscillator.start": args
                });
            },
            stop: function (...args) {
                lastTestFunctions.push({
                    "oscillator.stop": args
                });
            },
            disconnect: function (...args) {
                lastTestFunctions.push({
                    "oscillator.disconnect": args
                });
            }
        };
    }
}
/* eslint-enable class-methods-use-this */
QUnit.module("Sound: Tests1", function (hooks) {
    const that = {}; // eslint-disable-line consistent-this
    hooks.beforeEach(function () {
        that.sound = new Sound({
            AudioContextConstructor: AudioContextMock
        });
    });
    QUnit.test("create class", function (assert) {
        assert.ok(that.sound, "defined");
    });
    QUnit.test("reset", function (assert) {
        const sound = that.sound;
        sound.reset();
        assert.strictEqual(sound.testCanQueue(0), true, "testCanQueue(0): true");
    });
    QUnit.test("soundOn", function (assert) {
        const sound = that.sound;
        assert.strictEqual(sound.isActivatedByUser(), false, "isActivatedByUser: false");
        sound.soundOn();
        assert.strictEqual(sound.testCanQueue(0), false, "testCanQueue(0): false");
        assert.strictEqual(sound.isActivatedByUser(), false, "isActivatedByUser: false");
        sound.setActivatedByUser();
        assert.strictEqual(sound.isActivatedByUser(), true, "isActivatedByUser: true");
        assert.strictEqual(sound.testCanQueue(0), true, "testCanQueue(0): true");
        sound.soundOff();
    });
});
QUnit.module("Sound: Tests", function (hooks) {
    const allTests = {
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
            const soundData = {
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
            const toneEnv = input[0], toneEnvList = [];
            for (let i = 1; i < input.length - 1; i += 3) {
                let toneEnvData;
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
            const volEnv = input[0], volEnvList = [];
            for (let i = 1; i < input.length - 1; i += 3) {
                let volEnvData;
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
        const b = [];
        for (let i = 0; i < a.length; i += 1) {
            if (a[i].startsWith('"') && a[i].endsWith('"')) { // string in quotes?
                b.push(a[i].substring(1, 1 + a[i].length - 2)); // remove quotes
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
    function runSingleTest(testFunction, sound, key, expected, category) {
        clearLastTestFunctions();
        sound.reset();
        const input = key === "" ? [] : adaptParameters(key.split(","));
        let result;
        try {
            if (!testFunction) {
                throw new Error("Undefined testFunction: " + category);
            }
            const result0 = testFunction(sound, input);
            result = combineResult(result0);
        }
        catch (e) {
            result = String(e);
            result = combineResult(result);
            if (result !== expected) {
                Utils.console.error(e); // only if not expected
            }
        }
        return result;
    }
    function runTestsFor(category, tests, assert, results) {
        const sound = new Sound({
            AudioContextConstructor: AudioContextMock
        }), testFunction = allTestFunctions[category];
        sound.soundOn();
        sound.setActivatedByUser();
        for (const key in tests) {
            if (tests.hasOwnProperty(key)) {
                const expected = tests[key], result = runSingleTest(testFunction, sound, key, expected, category);
                if (results) {
                    results[category].push(TestHelper.stringInQuotes(key) + ": " + TestHelper.stringInQuotes(result));
                }
                if (assert) {
                    assert.strictEqual(result, expected, key);
                }
            }
        }
        sound.soundOff();
    }
    TestHelper.generateAllTests(allTests, runTestsFor, hooks);
});
// end
//# sourceMappingURL=Sound.qunit.js.map