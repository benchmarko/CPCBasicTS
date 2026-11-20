import { Keyboard } from "../ui/Keyboard";
import { VirtualKeyboard } from "../ui/VirtualKeyboard";
import type { View } from "../ui/View";

QUnit.module("Keyboard", function () {
	QUnit.test("maps supported program key characters to CPC keyboard numbers", function (assert) {
		assert.deepEqual(VirtualKeyboard.getUserKeyInfo(97), { cpcKey: 69, shift: false }, "lowercase a");
		assert.deepEqual(VirtualKeyboard.getUserKeyInfo(65), { cpcKey: 69, shift: true }, "uppercase A");
		assert.deepEqual(VirtualKeyboard.getUserKeyInfo(49), { cpcKey: 64, shift: false }, "digit 1");
		assert.deepEqual(VirtualKeyboard.getUserKeyInfo(32), { cpcKey: 47, shift: false }, "space");
		assert.deepEqual(VirtualKeyboard.getUserKeyInfo(13), { cpcKey: 18, shift: false }, "Enter");
		for (let code = 48; code <= 57; code += 1) {
			assert.ok(VirtualKeyboard.getUserKeyInfo(code), "digit " + String.fromCharCode(code));
		}
		for (let code = 97; code <= 122; code += 1) {
			assert.ok(VirtualKeyboard.getUserKeyInfo(code), "lowercase " + String.fromCharCode(code));
			assert.ok(VirtualKeyboard.getUserKeyInfo(code - 32)?.shift, "uppercase " + String.fromCharCode(code - 32));
		}
		const symbols = "!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}£";

		for (const symbol of symbols) {
			assert.ok(VirtualKeyboard.getUserKeyInfo(symbol.charCodeAt(0)), "symbol " + symbol);
		}
		assert.deepEqual(VirtualKeyboard.getUserKeyInfo("!".charCodeAt(0)), { cpcKey: 64, shift: true }, "shifted 1");
		assert.deepEqual(VirtualKeyboard.getUserKeyInfo("&".charCodeAt(0)), { cpcKey: 48, shift: true }, "shifted 6");
		assert.deepEqual(VirtualKeyboard.getUserKeyInfo("(".charCodeAt(0)), { cpcKey: 40, shift: true }, "shifted 8");
		assert.deepEqual(VirtualKeyboard.getUserKeyInfo("£".charCodeAt(0)), { cpcKey: 24, shift: true }, "shifted caret");
		assert.strictEqual(VirtualKeyboard.getUserKeyInfo(128), undefined, "unsupported character");
	});

	QUnit.test("maps special CPC program key codes to CPC keyboard numbers", function (assert) {
		const mappings: [number, number][] = [
			[224, 9], // Copy
			[240, 0], // cursor up
			[241, 2], // cursor down
			[242, 8], // cursor left
			[243, 1], // cursor right
			[16, 16], // Delete / Clear
			[27, 66], // Escape
			[127, 79], // Delete
			[11, 72], // joystick up
			[10, 73], // joystick down
			[8, 74], // joystick left
			[9, 75] // joystick right
		];

		for (const [code, cpcKey] of mappings) {
			assert.deepEqual(VirtualKeyboard.getUserKeyInfo(code), { cpcKey: cpcKey, shift: false }, "ASCII " + code);
		}
	});

	QUnit.test("maps codes 256 through 335 to explicit CPC keys and their input characters", function (assert) {
		assert.deepEqual(VirtualKeyboard.getUserKeyInfo(256 + 0), { cpcKey: 0, shift: false, input: String.fromCharCode(240) }, "cursor up");
		assert.deepEqual(VirtualKeyboard.getUserKeyInfo(256 + 18), { cpcKey: 18, shift: false, input: "\r" }, "Enter");
		assert.deepEqual(VirtualKeyboard.getUserKeyInfo(256 + 68), { cpcKey: 68, shift: false, input: "\t" }, "Tab");
		assert.deepEqual(VirtualKeyboard.getUserKeyInfo(256 + 75), { cpcKey: 75, shift: false, input: "\t" }, "joystick right alias");
		assert.deepEqual(VirtualKeyboard.getUserKeyInfo(256 + 76), { cpcKey: 76, shift: false, input: "X" }, "joystick fire alias");
		assert.deepEqual(VirtualKeyboard.getUserKeyInfo(256 + 21), { cpcKey: 21, shift: false, input: "" }, "modifier without input character");
		assert.strictEqual(VirtualKeyboard.getUserKeyInfo(336), undefined, "outside INKEY key range");
	});

	QUnit.test("tracks program key press state and modifiers until release", function (assert) {
		const view = {
				addEventListenerById: () => undefined
			} as unknown as View,
			keyboard = new Keyboard({ view });

		assert.strictEqual(keyboard.getKeyState(69), -1, "initially released");
		keyboard.setCpcKeyState(69, "program-key", true);
		assert.strictEqual(keyboard.getKeyState(69), 0, "lowercase key held");
		keyboard.setCpcKeyState(69, "shifted-program-key", true, true);
		assert.strictEqual(keyboard.getKeyState(69), 32, "shifted key held");
		keyboard.setCpcKeyState(69, "shifted-program-key", false, true);
		assert.strictEqual(keyboard.getKeyState(69), 0, "lowercase key remains held");
		keyboard.setCpcKeyState(69, "program-key", false);
		assert.strictEqual(keyboard.getKeyState(69), -1, "released");
	});
});
