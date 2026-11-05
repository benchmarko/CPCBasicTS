import { Controller0, type ControllerOptions0 } from "../Controller0";
import { Core } from "../Core";
import { FileHandler } from "../FileHandler";
import { ExecutionStateReporter, type ExecutionState } from "../ExecutionState";
import type { CustomError, Diagnostic, IKeyboard, ISound, LoadScriptFn } from "../Interfaces";
import type { IRuntimeController, RuntimeCallbacks } from "../core/main";
import { Utils } from "../Utils";
import { NoCanvas } from "../ui/NoCanvas";
import { ViewID } from "../ui/UiConstants";

function createController(isHeadlessDirectInput = true, loadScript: LoadScriptFn = () => { throw new Error("Unexpected script load"); }, notifications: RuntimeCallbacks = {}) {
	const core = new Core({
		databaseDirs: "examples",
		database: "examples",
		example: "original",
		autorun: true,
		basicVersion: "1.1",
		arrayBounds: true,
		implicitLines: false,
		integerOverflow: false,
		random: "cpc",
		speed: 100,
		trace: false
	});
	core.init();
	core.getModel().getDatabase().loaded = true;
	core.getModel().setExample({
		key: "original", title: "Original", meta: "", loaded: true,
		script: '10 PRINT "EXAMPLE":END'
	});
	const callbacks: (() => void)[] = [],
		keys: string[] = [],
		sources: { text: string, keepStack?: boolean }[] = [],
		generated: string[] = [],
		states: ExecutionState[] = [],
		diagnostics: Diagnostic[] = [],
		files = new Map<string, string>();
	let result = "",
		ends = 0;
	const keyboard: IKeyboard = {
		reset: () => { keys.length = 0; },
		resetExpansionTokens: () => undefined,
		resetCpcKeysExpansions: () => undefined,
		clearInput: () => { keys.length = 0; },
		getKeyFromBuffer: () => keys.shift() ?? "",
		putKeyInBuffer: (key) => { keys.push(key); },
		getKeyState: () => -1,
		getJoyState: () => 0,
		setExpansionToken: () => undefined,
		setCpcKeyExpansion: () => undefined
	};
	const sound: ISound = {
		reset: () => undefined,
		resetQueue: () => undefined,
		testCanQueue: () => true,
		sound: () => undefined,
		setVolEnv: () => undefined,
		setToneEnv: () => undefined,
		scheduler: () => undefined,
		release: () => undefined,
		sq: () => 0
	};
	const options: ControllerOptions0 = {
		canvas: new NoCanvas({ canvasID: ViewID.noCanvas, charset: [], palette: "color" }),
		keyboard,
		sound,
		isHeadlessDirectInput,
		onInputText: (text, keepStack) => sources.push({ text, keepStack }),
		onExecutionState: (state) => states.push(state),
		onDiagnostic: (diagnostic) => diagnostics.push(diagnostic),
		onOutputText: (text) => generated.push(text),
		onResultText: (text) => { result = text; },
		onProgramEnd: () => { ends += 1; },
		loadScript,
		storage: {
			get length() { return files.size; },
			clear: () => files.clear(),
			getItem: (key) => files.get(key) ?? null,
			key: (index) => Array.from(files.keys())[index] ?? null,
			removeItem: (key) => { files.delete(key); },
			setItem: (key, value) => { files.set(key, value); }
		},
		atobFn: () => { throw new Error("Unexpected base64 decoding"); },
		btoaFn: () => { throw new Error("Unexpected base64 encoding"); },
		console,
		setTimeout: (callback) => callbacks.push(callback),
		...notifications
	};
	const controller = new Controller0(core, options);
	return {
		controller, core, sources, generated, files, states, diagnostics, storage: options.storage,
		get result() { return result; },
		get ends() { return ends; },
		get pending() { return callbacks.length; },
		step() { callbacks.shift()?.(); },
		drain() {
			let remaining = 100;
			while (callbacks.length) {
				if (remaining-- === 0) { throw new Error("Controller did not finish"); }
				callbacks.shift()?.();
			}
		}
	};
}

QUnit.module("Controller0", function () {
	QUnit.test("the runtime contract exposes variable identifiers and values without UI controls", function (assert) {
		const host = createController(),
			runtime: IRuntimeController = host.controller;
		assert.deepEqual(runtime.getVariableNames(), []);
		runtime.setInputText('10 count=7:name$="CPC":DIM board(1):board(1)=3:END');
		runtime.startParseRun();
		host.drain();
		const names = runtime.getVariableNames();
		assert.ok(names.includes("countR"));
		assert.ok(names.includes("name$"));
		assert.ok(names.includes("boardAR"));
		assert.strictEqual(runtime.getVariable("countR"), 7);
		assert.strictEqual(runtime.getVariable("name$"), "CPC");
		assert.deepEqual(runtime.getVariable("boardAR"), [0, 3]);
		names.length = 0;
		assert.ok(runtime.getVariableNames().includes("countR"));
		runtime.fnRemoveAllVariables();
		assert.deepEqual(runtime.getVariableNames(), []);
		assert.deepEqual(host.diagnostics, []);
	});

	QUnit.test("CHAIN resolves relative and absolute examples with the existing base-selection rules", function (assert) {
		for (const target of ["next", "/root"]) {
			const host = createController(),
				model = host.core.getModel(),
				resolvedKey = target === "next" ? "folder/next" : "root";
			model.setExample({ key: "folder/main", title: "Main", meta: "", loaded: true, script: '10 CHAIN "' + target + '"' });
			model.setExample({ key: resolvedKey, title: "Target", meta: "", loaded: true, script: '10 PRINT "RESOLVED":END' });
			host.controller.loadExample("folder/main");
			host.drain();
			assert.ok(host.result.includes("RESOLVED\r\n"), target);
			assert.strictEqual(model.getProperty("example"), target === "next" ? "folder/main" : "root", target);
			assert.deepEqual(host.diagnostics, [], target);
		}
	});

	QUnit.test("Escape suspends partial input and a key resumes the original wait", function (assert) {
		const host = createController(),
			runtime: IRuntimeController = host.controller;
		runtime.setInputText('10 LINE INPUT text$\n20 PRINT "RESULT:";text$:END');
		runtime.startParseRun();
		host.step();
		host.step();
		runtime.putKeys("ab");
		host.step();
		runtime.startEscape();
		host.drain();
		assert.strictEqual(runtime.getExecutionState().reason, "escape");
		assert.strictEqual(runtime.getExecutionState().isRunning, false);
		runtime.putKeys("");
		assert.strictEqual(runtime.getExecutionState().reason, "escape");
		runtime.putKeys("x");
		assert.strictEqual(runtime.getExecutionState().reason, "waitInput");
		runtime.putKeys("c\r");
		host.drain();
		assert.ok(host.result.endsWith("RESULT:abc\r\n"));
		assert.deepEqual(host.diagnostics, []);
	});

	QUnit.test("a second Escape stops the program and prints the break location", function (assert) {
		const host = createController();
		host.controller.setInputText("10 LINE INPUT text$\n20 END");
		host.controller.startParseRun();
		host.step();
		host.step();
		host.controller.startEscape();
		host.drain();
		host.controller.startEscape();
		host.drain();
		assert.strictEqual(host.controller.getExecutionState().reason, "stop");
		assert.ok(host.result.includes("Break in "));
		assert.strictEqual(host.pending, 0);
		assert.deepEqual(host.diagnostics, []);
	});

	QUnit.test("Escape in direct mode clears pending input without starting execution", function (assert) {
		const host = createController(false);
		host.controller.setInputText("10 END");
		host.controller.startParseRun();
		host.drain();
		host.controller.putKeys("discarded");
		host.controller.startEscape();
		assert.strictEqual(host.controller.getExecutionState().reason, "direct");
		assert.strictEqual(host.pending, 0);
		assert.ok(host.result.includes("*Break*\r\n"));
		host.controller.putKeys('PRINT "RECOVERED"\r');
		host.drain();
		assert.ok(host.result.includes("RECOVERED\r\n"));
		assert.deepEqual(host.diagnostics, []);
	});

	QUnit.test("a second Escape enters the ON BREAK GOSUB handler", function (assert) {
		const host = createController();
		host.controller.setInputText('10 ON BREAK GOSUB 100\n20 CALL &BB18\n30 END\n100 PRINT "HANDLER":END');
		host.controller.startParseRun();
		host.step();
		host.step();
		assert.strictEqual(host.controller.getExecutionState().reason, "waitKey");
		host.controller.startEscape();
		host.drain();
		host.controller.startEscape();
		host.drain();
		assert.ok(host.result.includes("HANDLER\r\n"));
		assert.notOk(host.result.includes("Break in "));
		assert.deepEqual(host.diagnostics, []);
	});

	QUnit.test("ON BREAK CONT ignores Escape during input", function (assert) {
		const host = createController();
		host.controller.setInputText('10 ON BREAK CONT\n20 LINE INPUT text$\n30 PRINT "IGNORED":END');
		host.controller.startParseRun();
		host.step();
		host.step();
		host.controller.startEscape();
		assert.strictEqual(host.controller.getExecutionState().reason, "waitInput");
		assert.strictEqual(host.controller.getExecutionState().isRunning, true);
		host.controller.putKeys("ok\r");
		host.drain();
		assert.ok(host.result.includes("IGNORED\r\n"));
		assert.deepEqual(host.diagnostics, []);
	});

	QUnit.test("shared runtime callbacks receive source, output, state, and diagnostics", function (assert) {
		const sourceChanges: { text: string, keepStack?: boolean }[] = [],
			outputs: string[] = [],
			results: string[] = [],
			states: ExecutionState[] = [],
			diagnostics: Diagnostic[] = [];
		let completions = 0;
		const notifications: RuntimeCallbacks = {
			onInputText: (text, keepStack) => { sourceChanges.push({ text, keepStack }); },
			onOutputText: (text) => { outputs.push(text); },
			onResultText: (text) => { results.push(text); },
			onExecutionState: (state) => { states.push(state); },
			onDiagnostic: (diagnostic) => { diagnostics.push(diagnostic); },
			onProgramEnd: () => { completions += 1; }
		};
		const host = createController(true, undefined, notifications),
			source = '10 PRINT "CALLBACK":END';
		host.controller.setInputText(source, true);
		host.controller.startParseRun();
		host.drain();
		assert.deepEqual(sourceChanges, [{ text: source, keepStack: true }]);
		assert.ok(outputs.some((text) => text.includes('"CALLBACK"')));
		assert.ok(results.some((text) => text.includes("CALLBACK\r\n")));
		assert.ok(states.some((state) => state.reason === "stop" && !state.isRunning));
		assert.strictEqual(completions, 1);
		assert.deepEqual(diagnostics, []);
		host.controller.setInputText("10 LET =");
		host.controller.startParseRun();
		host.drain();
		assert.strictEqual(diagnostics.length, 1);
		assert.strictEqual(completions, 2);
	});

	QUnit.test("headless execution does not require notification listeners", function (assert) {
		const host = createController(true, undefined, {
			onInputText: undefined,
			onOutputText: undefined,
			onResultText: undefined,
			onExecutionState: undefined,
			onDiagnostic: undefined,
			onProgramEnd: undefined
		});
		host.controller.setInputText("10 PRINT 7:END");
		host.controller.startParseRun();
		host.drain();
		assert.strictEqual(host.controller.getExecutionState().reason, "stop");
		assert.strictEqual(host.controller.getExecutionState().isRunning, false);
		assert.strictEqual(host.pending, 0);
		assert.ok(host.controller.getOutputText().length > 0);
	});

	QUnit.test("compiled-text replacement invalidates cached code through the runtime contract", function (assert) {
		const host = createController(),
			runtime: IRuntimeController = host.controller;
		runtime.setInputText('10 PRINT "BASIC":END');
		runtime.startParseRun();
		host.drain();
		assert.ok(runtime.getOutputText().includes('"BASIC"'));
		const first = 'o.print(0,"FIRST","\\r\\n");o.vmStop("end",90);';
		runtime.setOutputText(first);
		assert.strictEqual(runtime.getOutputText(), first);
		runtime.startRun();
		host.drain();
		assert.ok(host.result.endsWith("FIRST\r\n"));
		runtime.setOutputText('o.print(0,"SECOND","\\r\\n");o.vmStop("end",90);');
		runtime.startRun();
		host.drain();
		assert.ok(host.result.endsWith("SECOND\r\n"));
		assert.strictEqual(host.generated[host.generated.length - 1], runtime.getOutputText());
		assert.deepEqual(host.diagnostics, []);
	});

	QUnit.test("repeated Break preserves the original partial input continuation", function (assert) {
		const host = createController();
		host.controller.setInputText('10 LINE INPUT text$\n20 PRINT "RESULT:";text$:END');
		host.controller.startParseRun();
		host.step();
		host.step();
		host.controller.putKeys("ab");
		host.step();
		host.controller.startBreak();
		host.drain();
		host.controller.startBreak();
		host.drain();
		host.controller.startContinue();
		assert.strictEqual(host.controller.getExecutionState().reason, "waitInput");
		host.controller.putKeys("c\r");
		host.drain();
		assert.ok(host.result.endsWith("RESULT:abc\r\n"));
		assert.deepEqual(host.diagnostics, []);
	});

	QUnit.test("Run reuses compiled code while restarting DATA reads", function (assert) {
		const host = createController();
		host.controller.setInputText("10 READ value:PRINT value:END\n20 DATA 7");
		host.controller.startParseRun();
		host.drain();
		const compilations = host.generated.length;
		host.controller.startRun();
		host.drain();
		assert.strictEqual(host.generated.length, compilations);
		assert.strictEqual(host.ends, 2);
		assert.ok(host.result.endsWith(" 7 \r\n"));
		assert.deepEqual(host.diagnostics, []);
	});

	QUnit.test("CHAIN replaces compiled code while preserving variables", function (assert) {
		const host = createController();
		host.files.set("next.bas", '10 PRINT "SHARED:";shared:END');
		host.controller.setInputText('10 shared=7:CHAIN "next"');
		host.controller.startParseRun();
		host.drain();
		assert.ok(host.result.endsWith("SHARED: 7 \r\n"));
		assert.strictEqual(host.controller.getInputText(), '10 PRINT "SHARED:";shared:END');
		assert.deepEqual(host.diagnostics, []);
	});

	QUnit.test("explicit example loading accepts full keys and a per-load autorun override", function (assert) {
		const host = createController(),
			runtime: IRuntimeController = host.controller,
			source = '10 PRINT "NAMED":END';
		host.core.getModel().setExample({ key: "folder/named", title: "Named", meta: "", loaded: true, script: source });
		runtime.loadExample("folder/named", { autorun: false });
		host.drain();
		assert.strictEqual(runtime.getInputText(), source);
		assert.strictEqual(host.core.getModel().getProperty("example"), "folder/named");
		assert.strictEqual(host.core.getModel().getProperty("autorun"), true);
		assert.deepEqual(host.generated, []);
		host.core.getModel().setProperty("autorun", false);
		runtime.loadExample("folder/named", { autorun: true });
		host.drain();
		assert.ok(host.result.includes("NAMED"));
		assert.strictEqual(host.core.getModel().getProperty("autorun"), false);
		assert.deepEqual(host.diagnostics, []);
	});

	QUnit.test("data examples remain load-only even with an autorun override", function (assert) {
		const host = createController(),
			source = '10 PRINT "DATA":END';
		host.core.getModel().setExample({ key: "data", title: "Data", meta: "D", loaded: true, script: source });
		host.controller.loadExample("data", { autorun: true });
		host.drain();
		assert.strictEqual(host.controller.getInputText(), source);
		assert.deepEqual(host.generated, []);
	});

	QUnit.test("explicit database loading selects a named loaded database", function (assert) {
		const host = createController(),
			model = host.core.getModel();
		model.addDatabases({ other: { text: "other", title: "Other", src: "other", loaded: true } });
		model.setProperty("database", "other");
		model.setExample({ key: "original", title: "Other", meta: "", loaded: true, script: '10 PRINT "OTHER":END' });
		model.setProperty("database", "examples");
		host.controller.loadDatabase("other");
		host.drain();
		assert.strictEqual(model.getProperty("database"), "other");
		assert.ok(host.result.includes("OTHER"));
		assert.deepEqual(host.diagnostics, []);
	});

	QUnit.test("database commands use the injected index loader", function (assert) {
		const requests: string[] = [],
			host = createController(true, (url, success, _error, key) => {
				requests.push(url);
				success(url, key);
			});
		host.core.getModel().getDatabase().loaded = false;
		host.core.getModel().setProperty("exampleIndex", "0index.js");
		host.controller.loadDatabase("examples");
		host.drain();
		assert.deepEqual(requests, ["examples/0index.js"]);
		assert.strictEqual(host.core.getModel().getDatabase().loaded, true);
		assert.ok(host.result.includes("EXAMPLE"));
		assert.deepEqual(host.diagnostics, []);
	});

	QUnit.test("the UI-free controller contract supports source, execution, and input", function (assert) {
		const host = createController(),
			runtime: IRuntimeController = host.controller,
			source = '10 LINE INPUT text$\n20 PRINT "RESULT:";text$:END';
		runtime.setInputText(source);
		assert.strictEqual(runtime.getInputText(), source);
		runtime.startParseRun();
		host.step();
		host.step();
		assert.strictEqual(runtime.getExecutionState().reason, "waitInput");
		runtime.putKeys("contract\r");
		host.drain();
		assert.ok(host.result.includes("RESULT:contract\r\n"));
		assert.strictEqual(runtime.getExecutionState().isRunning, false);
		assert.deepEqual(host.diagnostics, []);
	});

	QUnit.test("renumber commands use defaults without UI fields", function (assert) {
		const host = createController();
		host.controller.setInputText("100 GOTO 300\n200 PRINT 7\n300 END");
		host.controller.startRenum();
		host.drain();
		assert.strictEqual(host.controller.getInputText(), "10 GOTO 30\n20 PRINT 7\n30 END");
		assert.strictEqual(host.sources[host.sources.length - 1].keepStack, true);
		assert.deepEqual(host.diagnostics, []);
	});

	QUnit.test("explicit renumber parameters update line references", function (assert) {
		const host = createController();
		host.controller.setInputText("10 GOTO 30\n20 PRINT 7\n30 END");
		host.controller.startRenum({ newLine: 100, oldLine: 1, step: 5, keep: 65535 });
		host.drain();
		assert.strictEqual(host.controller.getInputText(), "100 GOTO 110\n105 PRINT 7\n110 END");
		assert.deepEqual(host.diagnostics, []);
	});

	QUnit.test("partial renumbering preserves preceding lines and updates their references", function (assert) {
		const host = createController();
		host.controller.setInputText("100 GOTO 300\n200 PRINT 7\n300 END");
		host.controller.startRenum({ newLine: 1000, oldLine: 200, step: 50 });
		host.drain();
		assert.strictEqual(host.controller.getInputText(), "100 GOTO 1050\n1000 PRINT 7\n1050 END");
		assert.deepEqual(host.diagnostics, []);
	});

	QUnit.test("renumber failures report diagnostics without changing the source", function (assert) {
		const host = createController(),
			source = "10 GOTO 99\n20 END";
		host.controller.setInputText(source);
		host.controller.startRenum({ newLine: 100 });
		host.drain();
		assert.strictEqual(host.controller.getInputText(), source);
		assert.strictEqual(host.diagnostics.length, 1);
		assert.ok(host.diagnostics[0].shortMessage.includes("Line does not exist"));
	});

	QUnit.test("direct GOSUB executes stored program labels", function (assert) {
		const host = createController(false);
		host.controller.setInputText('10 END\n100 PRINT "SUBROUTINE":RETURN');
		host.controller.startParseRun();
		host.drain();
		host.controller.putKeys("GOSUB 100\r");
		host.drain();
		assert.ok(host.result.includes("SUBROUTINE\r\n"));
		assert.deepEqual(host.diagnostics, []);
	});

	QUnit.test("direct commands still run while the stored source has a syntax error", function (assert) {
		const host = createController(false);
		host.controller.setInputText("10 END");
		host.controller.startParseRun();
		host.drain();
		host.controller.setInputText("10 LET =");
		host.controller.putKeys('PRINT "RECOVERED"\r');
		host.drain();
		assert.ok(host.result.includes("RECOVERED\r\n"));
		assert.deepEqual(host.diagnostics, []);
		assert.strictEqual(host.controller.getInputText(), "10 LET =");
	});

	QUnit.test("file metadata round trips without changing binary payloads", function (assert) {
		const meta = { typeString: "B", start: 16384, length: 5, entry: 16384, encoding: "base64" },
			data = "\x00,\xff;\r\n",
			stored = FileHandler.joinMeta(meta) + "," + data;
		assert.deepEqual(FileHandler.splitMeta(stored), { meta, data });
		assert.deepEqual(FileHandler.splitMeta("10 END"), { meta: { typeString: "" }, data: "10 END" });
		assert.deepEqual(FileHandler.splitMeta("CPCBasic;A"), { meta: { typeString: "" }, data: "CPCBasic;A" });
		const short = FileHandler.splitMeta("CPCBasic;A,data");
		assert.strictEqual(short.meta.typeString, "A");
		assert.ok(Number.isNaN(short.meta.start));
		assert.strictEqual(short.data, "data");
	});

	QUnit.test("storage lookup preserves extension precedence and empty files", function (assert) {
		const host = createController();
		host.files.set("test.", "");
		host.files.set("test.bas", "BASIC");
		host.files.set("test.bin", "BINARY");
		assert.strictEqual(FileHandler.loadFromStorage(host.storage, "test"), "");
		host.files.delete("test.");
		assert.strictEqual(FileHandler.loadFromStorage(host.storage, "test"), "BASIC");
		host.files.delete("test.bas");
		assert.strictEqual(FileHandler.loadFromStorage(host.storage, "test"), "BINARY");
		assert.strictEqual(FileHandler.loadFromStorage(host.storage, "test.bas"), null);
		assert.strictEqual(FileHandler.loadFromStorage(host.storage, "missing"), null);
		assert.strictEqual(FileHandler.getStorageName("test"), "test.");
		assert.strictEqual(FileHandler.getStorageName("test", "bas"), "test.bas");
		assert.strictEqual(FileHandler.getStorageName("test.bin", "bas"), "test.bin");
	});

	QUnit.test("stored ASCII programs load and save through the shared file helpers", function (assert) {
		const host = createController(false),
			source = '10 PRINT "STORED":END';
		host.files.set("stored.bas", FileHandler.joinMeta({ typeString: "A" }) + "," + source + "\x1a");
		host.controller.setInputText('10 RUN "stored"');
		host.controller.startParseRun();
		host.drain();
		assert.strictEqual(host.controller.getInputText(), source);
		assert.ok(host.result.includes("STORED"));
		host.controller.putKeys('SAVE "copy",A\r');
		host.drain();
		assert.ok(host.files.has("copy."));
		const saved = FileHandler.splitMeta(host.files.get("copy.") ?? "");
		assert.strictEqual(saved.meta.typeString, "A");
		assert.strictEqual(saved.data, source);
		assert.deepEqual(host.diagnostics, []);
	});

	QUnit.test("directory enumeration uses storage methods and filters metadata", function (assert) {
		const host = createController(),
			data = FileHandler.joinMeta({ typeString: "A" }) + ",10 END";
		host.files.set("demo.bas", data);
		host.files.set("getItem", data);
		host.files.set("foreign.bas", "not a CPCBasic file");
		assert.deepEqual(FileHandler.getStorageDirectoryEntries(host.storage), ["demo.bas", "getItem"]);
		host.storage.getItem = (key) => key === "demo.bas" ? null : host.files.get(key) ?? null;
		assert.deepEqual(FileHandler.getStorageDirectoryEntries(host.storage), ["getItem"], "Missing entries are ignored");
		host.storage.key = () => null;
		assert.deepEqual(FileHandler.getStorageDirectoryEntries(host.storage), []);
	});

	QUnit.test("directory masks escape punctuation and preserve unusual filenames", function (assert) {
		const host = createController(),
			data = FileHandler.joinMeta({ typeString: "A" }) + ",10 END";
		for (const name of ["a+b.bas", "aaab.bas", "file.bas", "fire.bin", "de\nmo.bas"]) {
			host.files.set(name, data);
		}
		assert.deepEqual(FileHandler.getStorageDirectoryEntries(host.storage, "a+b.bas"), ["a+b.bas"]);
		assert.deepEqual(FileHandler.getStorageDirectoryEntries(host.storage, "fi?e.*"), ["file.bas", "fire.bin"]);
		assert.deepEqual(FileHandler.getStorageDirectoryEntries(host.storage, "demo.bas"), ["de\nmo.bas"]);
	});

	QUnit.test("CAT and wildcard ERA work with method-only storage", function (assert) {
		const host = createController(false),
			data = FileHandler.joinMeta({ typeString: "A" }) + ",10 END";
		host.files.set("demo.bas", data);
		host.files.set("keep.bin", data);
		host.files.set("foreign.bas", "not a CPCBasic file");
		host.controller.setInputText("10 END");
		host.controller.startParseRun();
		host.drain();
		host.controller.putKeys("CAT\r");
		host.drain();
		assert.ok(host.result.includes("demo    .bas"));
		assert.notOk(host.result.includes("foreign .bas"));
		host.controller.putKeys('|ERA,"*.bas"\r');
		host.drain();
		assert.notOk(host.files.has("demo.bas"));
		assert.ok(host.files.has("keep.bin"));
		assert.ok(host.files.has("foreign.bas"));
		assert.deepEqual(host.diagnostics, []);
	});

	QUnit.test("implicit-line changes update an already-created tokenizer", function (assert) {
		const host = createController();
		host.controller.setInputText("10 PRINT 1:END");
		host.controller.startParseRun();
		host.drain();
		host.core.getModel().setProperty("implicitLines", true);
		host.controller.fnImplicitLines();
		host.controller.setInputText('PRINT "IMPLICIT"\nEND');
		host.controller.startParseRun();
		host.drain();
		assert.deepEqual(host.diagnostics, []);
		assert.ok(host.result.includes("IMPLICIT"));
	});

	QUnit.test("trace can be enabled after the first compilation", function (assert) {
		const host = createController();
		host.controller.setInputText("10 PRINT 7:END");
		host.controller.startParse();
		host.drain();
		const original = host.generated[host.generated.length - 1];
		host.core.getModel().setProperty("trace", true);
		host.controller.fnTrace();
		host.controller.startParse();
		host.drain();
		assert.notStrictEqual(host.generated[host.generated.length - 1], original);
		assert.deepEqual(host.diagnostics, []);
	});

	QUnit.test("pretty-print variable casing updates the cached generator", function (assert) {
		const host = createController();
		host.core.getModel().setProperty("prettyLowercaseVars", false);
		host.controller.setInputText("10 ABC=1:PRINT ABC");
		host.controller.fnPretty();
		assert.ok(host.controller.getInputText().includes("ABC"));
		host.core.getModel().setProperty("prettyLowercaseVars", true);
		host.controller.fnPrettyLowercaseVars();
		host.controller.fnPretty();
		assert.ok(host.controller.getInputText().includes("abc"));
		assert.deepEqual(host.diagnostics, []);
	});

	QUnit.test("integer overflow checks can be enabled after construction", function (assert) {
		const host = createController();
		host.core.getModel().setProperty("integerOverflow", true);
		host.controller.fnIntegerOverflow();
		host.controller.setInputText("10 value=40000 OR 0:END");
		host.controller.startParseRun();
		host.drain();
		assert.strictEqual(host.diagnostics.length, 1);
		assert.strictEqual(host.diagnostics[0]?.errCode, 6);
	});

	QUnit.test("array-bound changes reset execution without changing program text", function (assert) {
		const host = createController(),
			source = "10 value=7:END";
		host.controller.setInputText(source);
		host.controller.startParseRun();
		host.drain();
		host.core.getModel().setProperty("arrayBounds", false);
		host.controller.fnArrayBounds();
		assert.strictEqual(host.controller.getExecutionState().reason, "end");
		assert.strictEqual(host.controller.getExecutionState().line, 0);
		assert.strictEqual(host.controller.getInputText(), source);
		host.controller.setInputText("10 DIM values(1):values(2)=7:END");
		host.controller.startParseRun();
		host.drain();
		assert.deepEqual(host.diagnostics, []);
	});

	QUnit.test("direct DELETE and LIST use shared merge and range operations", function (assert) {
		const host = createController(false);
		host.controller.setInputText("10 REM first\n20 REM second\n30 END");
		host.controller.startParseRun();
		host.drain();
		host.controller.putKeys("DELETE 20\r");
		host.drain();
		assert.strictEqual(host.controller.getInputText(), "10 REM first\n30 END");
		host.controller.putKeys("LIST 10-10\r");
		host.drain();
		assert.ok(host.result.includes("10 REM first\r\n"));
		assert.notOk(host.result.includes("30 END\r\n"));
		assert.deepEqual(host.diagnostics, []);
	});

	QUnit.test("compiler diagnostics preserve source positions and displayed text", function (assert) {
		const host = createController(),
			source = "10 LET =";
		host.controller.setInputText(source);
		host.controller.startParseRun();
		host.drain();
		assert.strictEqual(host.diagnostics.length, 1);
		const diagnostic = host.diagnostics[0];
		assert.strictEqual(diagnostic.pos, source.indexOf("="));
		assert.strictEqual(diagnostic.line, "10");
		assert.strictEqual(diagnostic.selectSource, true);
		assert.ok(host.result.includes(diagnostic.shortMessage));
	});

	QUnit.test("runtime diagnostics retain BASIC error metadata", function (assert) {
		const host = createController();
		host.controller.setInputText("10 ERROR 5");
		host.controller.startParseRun();
		host.drain();
		assert.strictEqual(host.diagnostics.length, 1);
		assert.strictEqual(host.diagnostics[0].errCode, 5);
		assert.strictEqual(host.diagnostics[0].line, 10);
		assert.ok(host.result.includes(host.diagnostics[0].shortMessage));
	});

	QUnit.test("ON ERROR handles runtime failures without emitting visible diagnostics", function (assert) {
		const host = createController();
		host.controller.setInputText('10 ON ERROR GOTO 30\n20 ERROR 5\n30 PRINT "HANDLED":END');
		host.controller.startParseRun();
		host.drain();
		assert.deepEqual(host.diagnostics, []);
		assert.ok(host.result.includes("HANDLED"));
	});

	QUnit.test("diagnostic snapshots preserve metadata when source selection is suppressed", function (assert) {
		const error = Object.assign(new Error("Full message"), {
			name: "BasicParser", shortMessage: "Short message", value: "token", pos: 0, len: 5, line: 10, errCode: 2
		}) as CustomError;
		const diagnostic = Utils.createDiagnostic(error, true);
		assert.strictEqual(diagnostic.pos, 0);
		assert.strictEqual(diagnostic.selectSource, false);
		assert.strictEqual(diagnostic.shortMessage, "Short message");
		Object.assign(diagnostic, { message: "Observer mutation", pos: 99 });
		assert.strictEqual(error.message, "Full message");
		assert.strictEqual(error.pos, 0);
		assert.strictEqual(Utils.createDiagnostic(error).selectSource, true);
		const plain = Utils.createDiagnostic(new Error("Host failure"));
		assert.strictEqual(plain.shortMessage, "Host failure");
		assert.strictEqual(plain.selectSource, false);
	});

	QUnit.test("execution state reports waits and suspension without polling duplicates", function (assert) {
		const host = createController();
		assert.strictEqual(host.controller.getExecutionState().isRunning, false);
		host.controller.setInputText('10 INPUT value\n20 PRINT value:END');
		host.controller.startParseRun();
		assert.strictEqual(host.states[0].reason, "parseRun");
		assert.strictEqual(host.states[0].isRunning, true);
		host.step();
		host.step();
		const waiting = host.controller.getExecutionState(),
			count = host.states.length;
		assert.strictEqual(waiting.reason, "waitInput");
		assert.strictEqual(waiting.isRunning, true);
		host.step();
		assert.strictEqual(host.states.length, count);
		host.controller.startBreak();
		host.drain();
		assert.strictEqual(host.controller.getExecutionState().reason, "break");
		assert.strictEqual(host.controller.getExecutionState().isRunning, false);
		assert.strictEqual(waiting.reason, "waitInput", "Previously returned snapshots do not change");
		host.controller.startContinue();
		assert.strictEqual(host.controller.getExecutionState().reason, "waitInput");
		host.controller.putKeys("7\r");
		host.drain();
		assert.strictEqual(host.controller.getExecutionState().reason, "stop");
		assert.strictEqual(host.controller.getExecutionState().isRunning, false);
		assert.strictEqual(host.states[host.states.length - 1].reason, "stop");
	});

	QUnit.test("interactive completion reports the terminal reason before direct mode", function (assert) {
		const host = createController(false);
		host.controller.setInputText("10 END");
		host.controller.startParseRun();
		host.drain();
		assert.ok(host.states.some((state) => state.reason === "stop" && !state.isRunning));
		assert.strictEqual(host.states[host.states.length - 1].reason, "direct");
		assert.strictEqual(host.controller.getExecutionState().isRunning, false);
	});

	QUnit.test("state observers cannot mutate the reporter's previous snapshot", function (assert) {
		let notifications = 0;
		const reporter = new ExecutionStateReporter((state) => {
			notifications += 1;
			Object.assign(state, { reason: "changed by observer" });
		});
		reporter.report({ reason: "waitKey", line: 10, isRunning: true });
		reporter.report({ reason: "waitKey", line: 10, isRunning: true });
		assert.strictEqual(notifications, 1);
		reporter.report({ reason: "waitKey", line: 20, isRunning: true });
		assert.strictEqual(notifications, 2);
	});

	QUnit.test("core loading and the compatibility wrapper use shared line numbering", function (assert) {
		const host = createController(),
			model = host.core.getModel(),
			source = "REM loaded\nPRINT 7\nEND",
			numbered = "1 REM loaded\n2 PRINT 7\n3 END";
		model.setProperty("linesOnLoad", true);
		host.core.addItem("original", source);
		assert.strictEqual(model.getExample("original").script, numbered);
		assert.strictEqual(Controller0.addLineNumbers(source), numbered);
		model.setProperty("implicitLines", true);
		host.core.addItem("original", source);
		assert.strictEqual(model.getExample("original").script, source);
		model.setProperty("implicitLines", false);
		model.setProperty("linesOnLoad", false);
		host.core.addItem("original", source);
		assert.strictEqual(model.getExample("original").script, source);
	});

	QUnit.test("execution uses owned source without changing the selected example", function (assert) {
		const host = createController(),
			source = '10 PRINT "EDITED":END';
		assert.strictEqual(host.controller.getInputText(), "");
		host.controller.setInputText(source, true);
		host.controller.startParseRun();
		host.drain();
		assert.strictEqual(host.controller.getInputText(), source);
		assert.ok(host.result.includes("EDITED"));
		assert.notOk(host.result.includes("EXAMPLE"));
		assert.ok(host.generated.some((text) => text.includes("EDITED")));
		assert.deepEqual(host.sources, [{ text: source, keepStack: true }]);
		assert.strictEqual(host.core.getModel().getExample("original").script, '10 PRINT "EXAMPLE":END');
		assert.strictEqual(host.ends, 1);
	});

	QUnit.test("selected examples enter the owned source through loading", function (assert) {
		const host = createController();
		host.controller.onExampleSelectChange();
		host.drain();
		assert.strictEqual(host.controller.getInputText(), '10 PRINT "EXAMPLE":END');
		assert.ok(host.result.includes("EXAMPLE"));
	});

	QUnit.test("NEW clears the owned source", function (assert) {
		const host = createController();
		host.controller.setInputText("10 NEW\n20 GOTO 20");
		host.controller.startParseRun();
		host.drain();
		assert.strictEqual(host.controller.getInputText(), "");
		assert.strictEqual(host.sources[host.sources.length - 1].text, "");
	});

	QUnit.test("MERGE combines a loaded file with the owned source", function (assert) {
		const host = createController();
		host.files.set("extra.", '20 PRINT "MERGED":END');
		host.controller.setInputText('10 MERGE "extra"\n30 END');
		host.controller.startParseRun();
		host.drain();
		assert.strictEqual(host.controller.getInputText(), '10 MERGE "extra"\n20 PRINT "MERGED":END\n30 END');
		assert.notOk(host.controller.getInputText().includes("EXAMPLE"));
	});

	QUnit.test("INPUT waits for Return and validates numeric input", function (assert) {
		const host = createController();
		host.controller.setInputText('10 INPUT "NUMBER";value\n20 PRINT value:END');
		host.controller.startParseRun();
		host.step();
		host.step();
		assert.strictEqual(host.ends, 0);
		assert.ok(host.result.includes("NUMBER"));
		host.controller.putKeys("bad\r");
		host.step();
		assert.ok(host.result.includes("?Redo from start"));
		assert.strictEqual(host.ends, 0);
		host.controller.putKeys("42");
		host.step();
		assert.strictEqual(host.ends, 0, "Partial input does not resume execution");
		host.controller.putKeys("\r");
		host.drain();
		assert.ok(host.result.endsWith(" 42 \r\n"));
		assert.strictEqual(host.ends, 1);
	});

	QUnit.test("LINE INPUT edits queued characters with Delete", function (assert) {
		const host = createController();
		host.controller.setInputText('10 LINE INPUT text$\n20 PRINT "RESULT:";text$:END');
		host.controller.startParseRun();
		host.step();
		host.step();
		host.controller.putKeys("abx\x7fc\r");
		host.drain();
		assert.ok(host.result.endsWith("RESULT:abc\r\n"));
		assert.strictEqual(host.ends, 1);
	});

	QUnit.test("firmware key waits resume only after a queued key", function (assert) {
		const host = createController();
		host.controller.setInputText('10 CALL &BB18\n20 PRINT "RESUMED":END');
		host.controller.startParseRun();
		host.step();
		host.step();
		host.step();
		assert.strictEqual(host.ends, 0);
		assert.strictEqual(host.pending, 1);
		host.controller.putKeys("x");
		host.drain();
		assert.ok(host.result.includes("RESUMED"));
		assert.strictEqual(host.ends, 1);
	});

	QUnit.test("break and continue preserve a partially entered line", function (assert) {
		const host = createController();
		host.controller.setInputText('10 LINE INPUT text$\n20 PRINT "RESULT:";text$:END');
		host.controller.startParseRun();
		host.step();
		host.step();
		host.controller.putKeys("ab");
		host.step();
		host.controller.startBreak();
		host.drain();
		assert.strictEqual(host.ends, 0);
		assert.strictEqual(host.pending, 0);
		host.controller.startContinue();
		host.controller.putKeys("c\r");
		host.drain();
		assert.ok(host.result.endsWith("RESULT:abc\r\n"));
		assert.strictEqual(host.ends, 1);
	});

	QUnit.test("direct input accepts program lines and executes commands", function (assert) {
		const host = createController(false);
		host.controller.setInputText("10 END");
		host.controller.startParseRun();
		host.drain();
		host.controller.putKeys('20 PRINT "PROGRAM"\r');
		assert.strictEqual(host.controller.getInputText(), '10 END\n20 PRINT "PROGRAM"');
		host.controller.putKeys('PRINT "DIRECT"\r');
		host.drain();
		assert.ok(host.result.includes("DIRECT\r\n"));
		assert.strictEqual(host.pending, 0);
		assert.strictEqual(host.ends, 0);
	});

	QUnit.test("continue resumes after BASIC STOP without restarting the program", function (assert) {
		const host = createController();
		host.controller.setInputText('10 count=count+1:STOP\n20 PRINT "COUNT:";count:END');
		host.controller.startParseRun();
		host.drain();
		assert.notOk(host.result.includes("COUNT:"));
		assert.strictEqual(host.pending, 0);
		host.controller.startContinue();
		host.drain();
		assert.ok(host.result.endsWith("COUNT: 1 \r\n"));
		assert.strictEqual(host.ends, 2);
	});

	QUnit.test("break and continue preserve a firmware key wait", function (assert) {
		const host = createController();
		host.controller.setInputText('10 CALL &BB18\n20 PRINT "RESUMED":END');
		host.controller.startParseRun();
		host.step();
		host.step();
		host.controller.startBreak();
		host.drain();
		assert.strictEqual(host.pending, 0);
		host.controller.startContinue();
		host.step();
		assert.strictEqual(host.ends, 0);
		assert.strictEqual(host.pending, 1);
		host.controller.putKeys("x");
		host.drain();
		assert.ok(host.result.includes("RESUMED"));
	});
});