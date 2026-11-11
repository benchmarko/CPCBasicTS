import { InputLine } from "../InputLine";
import type { VmInputParas } from "../Interfaces";

function createInputLine(text: string, copied = "") {
	const keys = text.split(""),
		echoes: { stream: number, text: string }[] = [],
		copyStreams: number[] = [];
	const inputLine = new InputLine({ getKeyFromBuffer: () => keys.shift() ?? "" }, {
		// eslint-disable-next-line @typescript-eslint/no-base-to-string
		print: (stream, ...args) => { echoes.push({ stream, text: args.join("") }); },
		copychr$: (stream) => { copyStreams.push(stream); return copied; }
	});
	return { inputLine, keys, echoes, copyStreams };
}

QUnit.module("InputLine", function () {
	QUnit.test("direct submission prints a newline before invoking validation once", function (assert) {
		const host = createInputLine("");
		let validations = 0;
		const paras: VmInputParas = {
			command: "direct", stream: 2, line: 10, input: "PRINT 7", message: "Ready\r\n",
			fnInputCallback: () => {
				validations += 1;
				assert.deepEqual(host.echoes, [{ stream: 2, text: "\r\n" }]);
				assert.strictEqual(paras.input, "PRINT 7");
				return true;
			}
		};
		assert.strictEqual(host.inputLine.submit(paras), true);
		assert.strictEqual(validations, 1);
	});

	QUnit.test("BASIC input commands leave newline handling to their validators", function (assert) {
		for (const command of ["input", "lineinput"]) {
			const host = createInputLine("");
			const paras: VmInputParas = {
				command, stream: 0, line: 10, input: "bad", message: "?",
				fnInputCallback: () => {
					assert.deepEqual(host.echoes, []);
					paras.input = "";
					return false;
				}
			};
			assert.strictEqual(host.inputLine.submit(paras), false);
			assert.strictEqual(paras.input, "", "Validator changes remain visible to the controller");
		}
	});

	QUnit.test("readAndSubmit updates the buffer before logging and validation", function (assert) {
		const host = createInputLine("x\r"),
			events: unknown[][] = [],
			paras: VmInputParas = {
				command: "direct", stream: 2, line: 10, input: "start", message: "",
				fnInputCallback: () => { events.push(["validate", paras.input]); return false; }
			};
		const accepted = host.inputLine.readAndSubmit(paras, (input) => { events.push(["return", input, paras.input]); });
		assert.strictEqual(accepted, false);
		assert.strictEqual(paras.input, "startx");
		assert.deepEqual(events, [["return", "startx", "startx"], ["validate", "startx"]]);

		const partial = createInputLine("y");
		assert.strictEqual(partial.inputLine.readAndSubmit(paras, () => { assert.ok(false, "No Return must not submit"); }), false);
	});

	QUnit.test("noCRLF suppresses the direct-input newline", function (assert) {
		const host = createInputLine("");
		const paras: VmInputParas = {
			command: "direct", stream: 0, line: 10, input: "", message: "", noCRLF: "true",
			fnInputCallback: () => true
		};
		assert.strictEqual(host.inputLine.submit(paras), true);
		assert.deepEqual(host.echoes, []);
	});

	QUnit.test("partial input and Return preserve the following queued line", function (assert) {
		const partial = createInputLine("bc");
		assert.deepEqual(partial.inputLine.read("a", 2), { input: "abc", submitted: false });
		assert.deepEqual(partial.echoes, [{ stream: 2, text: "b" }, { stream: 2, text: "c" }]);
		const complete = createInputLine("first\rsecond\r");
		assert.deepEqual(complete.inputLine.read("", 0), { input: "first", submitted: true });
		assert.strictEqual(complete.keys.join(""), "second\r");
		assert.deepEqual(complete.inputLine.read("", 0), { input: "second", submitted: true });
	});

	QUnit.test("Delete edits text and rings the bell at the start", function (assert) {
		const host = createInputLine("\x7fabx\x7fc\r");
		assert.deepEqual(host.inputLine.read("", 0), { input: "abc", submitted: true });
		assert.strictEqual(host.echoes[0].text, "\x07");
		assert.ok(host.echoes.some((echo) => echo.text === "\x08\x10"));
	});

	QUnit.test("COPY reads the selected stream and advances only when a character exists", function (assert) {
		const copied = createInputLine("\xe0\r", "Q");
		assert.deepEqual(copied.inputLine.read("A", 3), { input: "AQ", submitted: true });
		assert.deepEqual(copied.copyStreams, [3]);
		assert.deepEqual(copied.echoes, [{ stream: 3, text: "\x09" }]);
		const empty = createInputLine("\xe0\r");
		assert.deepEqual(empty.inputLine.read("A", 0), { input: "A", submitted: true });
		assert.strictEqual(empty.echoes[0].text, "\x07");
	});

	QUnit.test("cursor keys move only when the input is empty", function (assert) {
		const empty = createInputLine("\xf0\xf1\xf2\xf3\r");
		assert.deepEqual(empty.inputLine.read("", 0), { input: "", submitted: true });
		assert.deepEqual(empty.echoes.map((echo) => echo.text), ["\x0b", "\x0a", "\x08", "\x09"]);
		const text = createInputLine("\xf0\xf1\xf2\xf3\r");
		assert.deepEqual(text.inputLine.read("A", 0), { input: "A", submitted: true });
		assert.deepEqual(text.echoes.map((echo) => echo.text), ["\x07", "\x07", "\x07", "\x07"]);
	});

	QUnit.test("control characters are escaped and DLE is ignored", function (assert) {
		const host = createInputLine("\x02\x10\r");
		assert.deepEqual(host.inputLine.read("", 0), { input: "\x02", submitted: true });
		assert.deepEqual(host.echoes.map((echo) => echo.text), ["\x01\x02", "\x07"]);
	});

	QUnit.test("modified cursor keys retain the existing polling boundary", function (assert) {
		for (let key = 0xf4; key <= 0xfb; key += 1) {
			const host = createInputLine(String.fromCharCode(key) + "A\r");
			assert.deepEqual(host.inputLine.read("", 0), { input: "", submitted: false });
			assert.deepEqual(host.echoes, []);
			assert.deepEqual(host.inputLine.read("", 0), { input: "A", submitted: true });
		}
	});
});