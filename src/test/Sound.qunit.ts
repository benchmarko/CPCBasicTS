// Sound.qunit.ts - QUnit tests for CPCBasic Sound
//

import { Utils } from "../Utils";
import { Sound, SoundData } from "../Sound";
import { TestHelper, TestsType, AllTestsType } from "./TestHelper";

type TestFunctionInputType = string | number | undefined; // | object | Function;

const lastTestFunctions: Record<string, TestFunctionInputType[]>[] = [];

function clearLastTestFunctions() {
	lastTestFunctions.length = 0;
}

function combineLastTestFunctions() {
	return lastTestFunctions.map((lastTestFunction) => Object.keys(lastTestFunction)[0] + ":" + Object.values(lastTestFunction)[0]).join(" , ") || undefined;
}

function combineResult(result: string) {
	const combinedTestFunctions = combineLastTestFunctions(),
		combinedResult = [];

	if (combinedTestFunctions !== undefined) {
		combinedResult.push(combinedTestFunctions);
	}

	if (result !== undefined) {
		combinedResult.push(result);
	}

	return combinedResult.join(" -- ");
}

/* eslint-disable class-methods-use-this *//* eslint-disable class-methods-use-this */
class AudioContextMock {
	currentTime: number;

	constructor() {
		this.currentTime = 0;
	}

	createChannelMerger(...args: any[] /*_numberOfInputs?: number */) {
		lastTestFunctions.push({
			createChannelMerger: args
		});
		return {
			connect: function (...args2 /* destinationNode: AudioNode, output?: number, input?: number */) {
				lastTestFunctions.push({
					"channelMerger:connect": args2 as any
				});
				return this;
			},
			disconnect: function (...args2 /* destinationNode: AudioNode */) {
				lastTestFunctions.push({
					"channelMerger:disconnect": args2 as any
				});
			},
			toString: function () {
				return "[obj: channelMerger]";
			}
		} as ChannelMergerNode;
	}

	createGain() {
		lastTestFunctions.push({
			createGain: []
		});
		return {
			connect: function (...args /* destinationNode: AudioNode, output?: number, input?: number */) {
				lastTestFunctions.push({
					"gain:connect": args as any
				});
				//return this;
			},
			gain: {
				setValueAtTime: function (...args /* value: number, _startTime: number */) {
					lastTestFunctions.push({
						"gain:gain.setValueAtTime": args as any
					});
				},
				linearRampToValueAtTime: function (...args /* value: number, endTime: number */) {
					lastTestFunctions.push({
						"gain:gain.linearRampToValueAtTime": args
					});
				}
			} as AudioParam,
			toString: function () {
				return "[obj: gain]";
			}
		} as GainNode;
	}

	createBuffer(...args: any[] /* numberOfChannels: number, length: number, sampleRate: number */) {
		lastTestFunctions.push({
			createBuffer: args
		});
		return {
			getChannelData: function (...args2 /* channel: number */) {
				lastTestFunctions.push({
					"createBuffer:getChannelData": args2
				});
				return new Float32Array(); //TTT
			}
		} as AudioBuffer;
	}

	createBufferSource() {
		lastTestFunctions.push({
			createBufferSource: []
		});
		return {
			start: function (...args /* when?: number, offset?: number, duration?: number */) {
				lastTestFunctions.push({
					"bufferSource:start": args
				});
			},
			stop: function (...args /* when?: number */) {
				lastTestFunctions.push({
					"bufferSource:stop": args
				});
			}
		} as AudioBufferSourceNode;
	}

	createBiquadFilter() {
		lastTestFunctions.push({
			createBiquadFilter: []
		});
		return {} as BiquadFilterNode;
	}

	createOscillator() {
		lastTestFunctions.push({
			createOscillator: []
		});
		return {
			frequency: {
				value: 0,
				setValueAtTime: function (...args /* value: number, startTime: number */) {
					lastTestFunctions.push({
						"oscillator.frequency.setValueAtTime": args
					});
				}
			},
			//type: "",
			connect: function (...args /* destinationNode: AudioNode, _output?: number, _input?: number */) {
				lastTestFunctions.push({
					"oscillator.connect": args as any
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
			}
		} as OscillatorNode;
	}
}
/* eslint-enable class-methods-use-this */


QUnit.module("Sound: Tests1", function (hooks) {
	const that = {} as { sound: Sound }; // eslint-disable-line consistent-this

	hooks.beforeEach(function () {
		that.sound = new Sound({
			AudioContextConstructor: AudioContextMock as typeof window.AudioContext
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
	const allTests: AllTestsType = { // eslint-disable-line vars-on-top
		sound: {
			"1,100,3": "createOscillator: , oscillator.connect:[obj: gain] , gain:gain.setValueAtTime:NaN,0 , oscillator.start:0 , oscillator.stop:0.03 -- undefined"
		}
	},
		allTestFunctions: Record<string, (sound: Sound, input: TestFunctionInputType[]) => any> = {
			sound: function (sound: Sound, input: TestFunctionInputType[]) {
				const soundData = {
					state: input[0],
					period: input[1],
					duration: input[2],
					volume: input[3],
					volEnv: input[4],
					toneEnv: input[5],
					noise: input[6]
				} as SoundData;

				return String(sound.sound(soundData));
				//return String(sound.sound.apply(sound, input));
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

	function runTestsFor(category: string, tests: TestsType, assert?: Assert, results?: string[]) {
		const sound = new Sound({
				AudioContextConstructor: AudioContextMock as typeof window.AudioContext
			}),
			testFunction = allTestFunctions[category];

		sound.soundOn();
		sound.setActivatedByUser();

		for (const key in tests) {
			if (tests.hasOwnProperty(key)) {
				clearLastTestFunctions();
				sound.reset();
				const //vmState0 = getVmState(cpcVm),
					input = key === "" ? [] : adaptParameters(key.split(",")),
					expected = tests[key];

				let result: string;

				try {
					if (!testFunction) {
						throw new Error("Undefined testFunction: " + category);
					}
					result = testFunction(sound, input);
					result = combineResult(result); //, vmState0, getVmState(cpcVm));
				} catch (e) {
					result = String(e);
					result = combineResult(result); //, vmState0, getVmState(cpcVm));
					if (result !== expected) {
						Utils.console.error(e); // only if not expected
					}
				}

				if (results) {
					results.push(TestHelper.stringInQuotes(key) + ": " + TestHelper.stringInQuotes(result));
				}

				if (assert) {
					assert.strictEqual(result, expected, key);
				}
			}
		}
		sound.soundOff();
	}

	TestHelper.generateAndRunAllTests(allTests, runTestsFor);
});
// end
