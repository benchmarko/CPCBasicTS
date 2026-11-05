import { ProgramRunner } from "../ProgramRunner";
function createRunner() {
    const displayed = [], composed = [], jsErrors = [], logged = [];
    const runner = new ProgramRunner({
        composeError: (error, code, value) => {
            composed.push({ error, code, value });
            return error;
        },
        outputError: (error, noSelection) => displayed.push({ error, noSelection }),
        onJsError: (error) => { jsErrors.push(error); },
        logger: {
            warn: (...args) => { logged.push(...args); },
            error: (...args) => { logged.push(...args); },
            log: (...args) => { logged.push(...args); }
        }
    });
    return { runner, displayed, composed, jsErrors, logged };
}
function createStartupVm() {
    const calls = [];
    return {
        calls,
        vm: {
            vmResetData: () => { calls.push(["data"]); },
            vmReset4Run: () => { calls.push(["run"]); },
            vmStop: (reason, priority, force) => { calls.push(["stop", reason, priority, force]); },
            vmGoto: (line) => { calls.push(["goto", line]); },
            vmSetStartLine: (line) => { calls.push(["start", line]); }
        }
    };
}
QUnit.module("ProgramRunner", function () {
    QUnit.test("renumber applies defaults, updates source, and resets VM position", function (assert) {
        const calls = [], vm = {
            vmGoto: (line) => { calls.push(["goto", line]); },
            vmStop: (reason, priority, force) => { calls.push(["stop", reason, priority, force]); }
        }, paras = { command: "renum", stream: 0, line: 12 }, source = "10 END";
        let outputSource = "";
        const outputErrors = [];
        const output = ProgramRunner.renumberProgram(vm, source, paras, (input, newLine, oldLine, step, keep) => {
            calls.push(["renumber", input, newLine, oldLine, step, keep]);
            return { text: "100 END" };
        }, (updated) => { outputSource = updated; }, (error) => { outputErrors.push(error); });
        assert.strictEqual(output.text, "100 END");
        assert.strictEqual(outputSource, "100 END");
        assert.deepEqual(outputErrors, []);
        assert.deepEqual(calls, [["renumber", source, 10, 1, 10, 65535], ["goto", 0], ["stop", "end", 0, true]]);
    });
    QUnit.test("renumber passes custom options and leaves source unchanged on error", function (assert) {
        const calls = [], vm = {
            vmGoto: (line) => { calls.push(["goto", line]); },
            vmStop: (reason, priority, force) => { calls.push(["stop", reason, priority, force]); }
        }, error = Object.assign(new Error("renumber failed"), { value: "99", pos: 8 });
        let outputSource = "unchanged", reported;
        const output = ProgramRunner.renumberProgram(vm, "10 GOTO 99", { command: "renum", stream: 0, line: 10, newLine: 100, oldLine: 20, step: 5, keep: 900 }, (_source, newLine, oldLine, step, keep) => {
            assert.deepEqual([newLine, oldLine, step, keep], [100, 20, 5, 900]);
            return { text: "", error };
        }, (source) => { outputSource = source; }, (value) => { reported = value; });
        assert.strictEqual(output.error, error);
        assert.strictEqual(outputSource, "unchanged");
        assert.strictEqual(reported, error);
        assert.deepEqual(calls, [["goto", 0], ["stop", "end", 0, true]]);
    });
    QUnit.test("EDIT merges source and resets execution before notifying the host", function (assert) {
        const calls = [], paras = { command: "edit", stream: 7, line: 42, input: "100 PRINT value", message: "", fnInputCallback: () => true }, vm = {
            vmSetStartLine: (line) => { calls.push(["start", line]); },
            vmGoto: (line) => { calls.push(["goto", line]); },
            cursor: (stream, enabled) => { calls.push(["cursor", stream, enabled]); },
            vmStop: (reason, priority) => { calls.push(["stop", reason, priority]); }
        };
        const result = ProgramRunner.commitEditedLine(vm, paras, "10 END", (source, edited) => { calls.push(["merge", source, edited]); return "10 END\\n100 PRINT value"; }, (source) => { calls.push(["source", source]); }, () => { calls.push(["uiChanged"]); });
        assert.strictEqual(result, true);
        assert.deepEqual(calls, [
            ["merge", "10 END", "100 PRINT value"],
            ["source", "10 END\\n100 PRINT value"],
            ["start", 0], ["goto", 0], ["uiChanged"], ["cursor", 7, 0], ["stop", "end", 90]
        ]);
    });
    QUnit.test("EDIT prints the selected line and prepares an input wait without invoking its callback", function (assert) {
        const calls = [], vm = {
            print: (stream, ...parts) => { calls.push(["print", stream, ...parts]); },
            cursor: (stream, system) => { calls.push(["cursor", stream, system]); },
            vmStop: (reason, priority, force, paras) => { calls.push(["stop", reason, priority, force, paras]); }
        };
        let callbackCalls = 0;
        const onInput = () => { callbackCalls += 1; return true; }, paras = { command: "edit", stream: 7, line: 42, first: 100, last: 100 };
        ProgramRunner.editLine(vm, paras, "100 PRINT value", onInput);
        assert.strictEqual(calls[0][0], "print");
        assert.deepEqual(calls[0].slice(1), [7, "100 PRINT value"]);
        assert.deepEqual(calls[1], ["cursor", 7, 1]);
        assert.strictEqual(calls[2][0], "stop");
        assert.deepEqual(calls[2].slice(1, 4), ["waitInput", 45, true]);
        const input = calls[2][4];
        assert.deepEqual(input, { command: "edit", line: 42, stream: 7, message: "", input: "100 PRINT value", fnInputCallback: onInput });
        assert.strictEqual(callbackCalls, 0);
    });
    QUnit.test("reset clears variables and devices before stopping and clearing output", function (assert) {
        const calls = [], vm = {
            vmReset: () => { calls.push(["vmReset"]); },
            vmStop: (reason, priority, force) => { calls.push(["stop", reason, priority, force]); }
        };
        ProgramRunner.resetProgram(vm, () => { calls.push(["variables"]); }, () => { calls.push(["devices"]); }, () => { calls.push(["output"]); }, () => { calls.push(["invalidate"]); });
        assert.deepEqual(calls, [
            ["variables"], ["vmReset"], ["devices"], ["stop", "end", 0, true], ["output"], ["invalidate"]
        ]);
    });
    QUnit.test("CHAIN MERGE deletes the requested range before resuming the file load", function (assert) {
        const events = [], vm = {
            line: 42,
            vmStop: (reason, priority) => { events.push(["stop", reason, priority]); }
        };
        ProgramRunner.prepareChainMergeLoad(vm, { command: "chainMerge", first: 10, last: 20 }, (paras) => { events.push(["delete", paras]); });
        assert.deepEqual(events.slice(), [
            ["delete", { first: 10, last: 20, command: "CHAIN MERGE", stream: 0, line: 42 }],
            ["stop", "fileLoad", 90]
        ]);
        events.length = 0;
        ProgramRunner.prepareChainMergeLoad(vm, { command: "chain", first: 10, last: 20 }, () => { events.push(["delete"]); });
        ProgramRunner.prepareChainMergeLoad(vm, { command: "chainMerge", first: 0, last: 20 }, () => { events.push(["delete"]); });
        assert.deepEqual(events, []);
    });
    QUnit.test("saved file callback runs before output-file state resets", function (assert) {
        const events = [], error = new Error("save callback failed");
        ProgramRunner.closeSavedFile({ vmResetOutFileHandling: () => { events.push("reset"); } }, { fnFileCallback: (data) => { events.push("callback:" + data); throw error; } }, "contents", (value) => { events.push(value); });
        assert.deepEqual(events, ["callback:contents", error, "reset"]);
    });
    QUnit.test("file save dispatch persists before cleanup and always resumes the VM", function (assert) {
        const events = [], vm = {
            vmResetOutFileHandling: () => { events.push(["reset"]); },
            vmStop: (reason, priority, force) => { events.push(["stop", reason, priority, force]); }
        }, file = { open: true, name: "demo", fnFileCallback: (data) => { events.push(["callback", data]); } };
        ProgramRunner.dispatchFileSave(vm, file, (value) => { events.push(["save", value.name]); return "contents"; }, (name) => { events.push(["saved", name]); }, () => { events.push(["notOpen"]); }, (error) => { events.push(["warning", error]); });
        assert.deepEqual(events.slice(), [["save", "demo"], ["saved", "demo"], ["callback", "contents"], ["reset"], ["stop", "", 0, true]]);
        events.length = 0;
        ProgramRunner.dispatchFileSave(vm, { open: false, name: "closed" }, () => { events.push(["save"]); return ""; }, () => { events.push(["saved"]); }, () => { events.push(["notOpen"]); }, () => { events.push(["warning"]); });
        assert.deepEqual(events.slice(), [["notOpen"], ["stop", "", 0, true]]);
    });
    QUnit.test("input completion resumes the right execution mode", function (assert) {
        const events = [], vm = { vmStop: (reason, priority, force) => { events.push(["stop", reason, priority, force]); } }, startMainLoop = () => { events.push(["mainLoop"]); }, continueExecution = () => { events.push(["continue"]); };
        ProgramRunner.finishInput(vm, "waitInput", startMainLoop, continueExecution);
        assert.deepEqual(events.slice(), [["stop", "", 0, true]]);
        events.length = 0;
        ProgramRunner.finishInput(vm, "direct", startMainLoop, continueExecution);
        assert.deepEqual(events.slice(), [["stop", "", 0, true], ["mainLoop"]]);
        events.length = 0;
        ProgramRunner.finishInput(vm, "fileLoad", startMainLoop, continueExecution);
        assert.deepEqual(events.slice(), [["continue"]]);
    });
    QUnit.test("file load dispatch handles chain merge, storage fallback, and scheduler delay", function (assert) {
        const events = [], vm = {
            line: 42,
            vmStop: (reason, priority) => { events.push(["stop", reason, priority]); },
            vmGetTimeUntilFrame: () => 5
        }, actions = {
            vm,
            deleteLines: (paras) => { events.push(["delete", paras]); },
            logFile: (file) => { events.push(["log", file.name]); },
            loadFromStorage: (name) => { events.push(["storage", name]); return "contents"; },
            onStorageLoad: (input) => { events.push(["stop", "", 0], ["loaded", input]); },
            loadExample: () => { events.push(["example"]); },
            onNotOpen: (name) => { events.push(["notOpen", name]); },
            setNextDelay: (delay) => { events.push(["delay", delay]); }
        };
        ProgramRunner.dispatchFileLoad({ open: true, name: "demo", command: "chainMerge", first: 10, last: 20 }, actions);
        assert.deepEqual(events.slice(), [
            ["delete", { first: 10, last: 20, command: "CHAIN MERGE", stream: 0, line: 42 }],
            ["stop", "fileLoad", 90], ["log", "demo"], ["storage", "demo"], ["stop", "", 0], ["loaded", "contents"], ["delay", 5]
        ]);
        events.length = 0;
        actions.loadFromStorage = (name) => { events.push(["storage", name]); return null; };
        ProgramRunner.dispatchFileLoad({ open: true, name: "missing", command: "load", first: 0, last: 0 }, actions);
        assert.deepEqual(events.slice(), [["log", "missing"], ["storage", "missing"], ["example"], ["delay", 5]]);
        events.length = 0;
        ProgramRunner.dispatchFileLoad({ open: false, name: "closed", command: "load", first: 0, last: 0 }, actions);
        assert.deepEqual(events.slice(), [["notOpen", "closed"], ["delay", 5]]);
    });
    QUnit.test("LIST prints formatted chunks before resetting the current VM line", function (assert) {
        const calls = [], vm = {
            print: (stream, ...parts) => { calls.push(["print", stream, ...parts]); },
            vmGoto: (line) => { calls.push(["goto", line]); },
            vmStop: (reason, priority, force) => { calls.push(["stop", reason, priority, force]); }
        };
        ProgramRunner.listProgram(vm, ["10 REM \x00", "20 END"], 0);
        assert.deepEqual(calls, [
            ["print", 0, "10 REM \x01\x00", "\r\n"],
            ["print", 0, "20 END", "\r\n"],
            ["goto", 0],
            ["stop", "end", 0, true]
        ]);
        calls.length = 0;
        ProgramRunner.listProgram(vm, ["10 REM \x00"], 9);
        assert.deepEqual(calls, [["print", 9, "10 REM \x00", "\r\n"], ["goto", 0], ["stop", "end", 0, true]]);
    });
    QUnit.test("NEW clears source and variables before resetting line and cache", function (assert) {
        const calls = [], vm = {
            vmGoto: (line) => { calls.push(["goto", line]); },
            vmStop: (reason, priority, force) => { calls.push(["stop", reason, priority, force]); }
        };
        ProgramRunner.newProgram(vm, () => { calls.push(["source", ""]); }, () => { calls.push(["variables"]); }, () => { calls.push(["invalidate"]); });
        assert.deepEqual(calls, [
            ["source", ""], ["variables"], ["goto", 0], ["stop", "end", 0, true], ["invalidate"]
        ]);
    });
    QUnit.test("loaded-program commands preserve source and execution action order", function (assert) {
        const cases = [
            { command: "openin", expected: [], line: 0 },
            { command: "load", expected: ["source:loaded", "result", "invalidate", "stop:end:90"], line: 0 },
            { command: "merge", expected: ["merge", "source:existing\nloaded", "result", "invalidate", "variables", "stop:end:90"], line: 0 },
            { command: "chain", expected: ["source:loaded", "result", "invalidate", "chain"], line: 100 },
            { command: "chainMerge", expected: ["merge", "source:existing\nloaded", "result", "invalidate", "chain"], line: 100 },
            { command: "run", expected: ["source:loaded", "result", "reset", "run"], line: 100 },
            { command: "unknown", expected: ["unknown:unknown"], line: 0 }
        ];
        for (const test of cases) {
            const host = createLoadActions();
            const line = ProgramRunner.applyLoad({ command: test.command, input: "loaded", line: 100, inMemory: false, isSnapshot: false }, host.actions);
            assert.strictEqual(line, test.line, test.command);
            assert.deepEqual(host.events, test.expected, test.command);
        }
    });
    QUnit.test("snapshot runs retain memory settings while binary loads leave source alone", function (assert) {
        const snapshot = createLoadActions();
        assert.strictEqual(ProgramRunner.applyLoad({ command: "run", input: "loaded", line: 100, inMemory: false, isSnapshot: true }, snapshot.actions), 100);
        assert.deepEqual(snapshot.events, ["source:loaded", "result", "run"]);
        const binaryLoad = createLoadActions();
        assert.strictEqual(ProgramRunner.applyLoad({ command: "load", input: "binary", line: 100, inMemory: true, isSnapshot: false }, binaryLoad.actions), 0);
        assert.deepEqual(binaryLoad.events, []);
        const binaryRun = createLoadActions();
        assert.strictEqual(ProgramRunner.applyLoad({ command: "run", input: "binary", line: 100, inMemory: true, isSnapshot: false }, binaryRun.actions), 0);
        assert.deepEqual(binaryRun.events, ["reset", "clear", "memory"]);
    });
    QUnit.test("load continuation decodes data, invokes its callback, and applies the command", function (assert) {
        const host = createLoadActions(), actions = Object.assign(Object.assign({}, host.actions), { decode: (input) => { host.events.push("decode:" + input); return { data: "loaded", meta: { typeString: "A" } }; }, decodeTokenizedBasic: (input) => { host.events.push("tokens:" + input); return input; }, loadFileInMemory: (input) => { host.events.push("memory:" + input); }, setStartLine: (line) => { host.events.push("start:" + line); }, startMainLoop: () => { host.events.push("loop"); }, onWarning: () => { host.events.push("warning"); }, onError: () => { host.events.push("error"); } });
        ProgramRunner.continueLoad("stored", {
            name: "demo.bas",
            command: "load",
            line: 12,
            fnFileCallback: (input, meta) => { host.events.push("callback:" + input + ":" + (meta === null || meta === void 0 ? void 0 : meta.typeString)); return false; }
        }, actions);
        assert.deepEqual(host.events, ["decode:stored", "callback:loaded:A", "source:loaded", "result", "invalidate", "stop:end:90", "start:0", "loop"]);
    });
    QUnit.test("binary RUN loads decoded bytes after reset", function (assert) {
        const host = createLoadActions(), actions = Object.assign(Object.assign({}, host.actions), { decode: () => { host.events.push("decode"); return { data: "binary", meta: { typeString: "B", start: 4096, length: 1 } }; }, decodeTokenizedBasic: (input) => input, loadFileInMemory: (input, meta) => { host.events.push("memory:" + input + ":" + (meta === null || meta === void 0 ? void 0 : meta.typeString)); }, setStartLine: (line) => { host.events.push("start:" + line); }, startMainLoop: () => { host.events.push("loop"); }, onWarning: () => undefined, onError: () => undefined });
        ProgramRunner.continueLoad("stored", {
            name: "machine.bin",
            command: "run",
            line: 0,
            fnFileCallback: () => { host.events.push("callback"); return true; }
        }, actions);
        assert.deepEqual(host.events, ["decode", "callback", "reset", "clear", "memory:binary:B", "start:0", "loop"]);
    });
    QUnit.test("load continuation handles missing and null input without applying a load", function (assert) {
        const missingEvents = [], host = createLoadActions(), missingActions = Object.assign(Object.assign({}, host.actions), { vm: Object.assign(Object.assign({}, host.actions.vm), { vmStop: (reason, priority, force) => { missingEvents.push("stop:" + reason + ":" + priority + ":" + force); } }), decode: (input) => { missingEvents.push("decode:" + input); return { data: input, meta: { typeString: "A" } }; }, decodeTokenizedBasic: (input) => input, loadFileInMemory: () => undefined, setStartLine: () => { missingEvents.push("start"); }, startMainLoop: () => { missingEvents.push("loop"); }, onWarning: () => { missingEvents.push("warning"); }, onError: (message) => { missingEvents.push("error:" + message); } }), file = { name: "missing.bas", command: "load", line: 0, fnFileCallback: () => { throw new Error("callback failed"); } };
        ProgramRunner.continueLoad(undefined, file, missingActions);
        assert.deepEqual(missingEvents, ["warning", "error:loadFileContinue: File missing.bas: input undefined!", "stop:stop:60:true", "loop"]);
        const nullEvents = [];
        ProgramRunner.continueLoad(null, { name: "", command: "openin", line: 0 }, Object.assign(Object.assign({}, missingActions), { onWarning: () => undefined, onError: () => undefined, startMainLoop: () => { nullEvents.push("loop"); } }));
        assert.deepEqual(nullEvents, ["loop"]);
    });
    QUnit.test("snapshot continuation decodes token bytes before running BASIC", function (assert) {
        const host = createLoadActions(), encoded = "x".repeat(0x170) + "tokens", actions = Object.assign(Object.assign({}, host.actions), { decode: () => { host.events.push("decode"); return { data: encoded, meta: { typeString: "S" } }; }, decodeTokenizedBasic: (input) => { host.events.push("tokens:" + input); return "10 END"; }, loadFileInMemory: () => { host.events.push("memory"); }, setStartLine: (line) => { host.events.push("start:" + line); }, startMainLoop: () => { host.events.push("loop"); }, onWarning: () => undefined, onError: () => undefined });
        ProgramRunner.continueLoad("snapshot", {
            name: "snapshot.sna",
            command: "run",
            line: 20,
            fnFileCallback: () => true
        }, actions);
        assert.deepEqual(host.events, ["decode", "tokens:tokens", "source:10 END", "result", "run", "start:20", "loop"]);
    });
    QUnit.test("direct-mode entry resets control state and installs the input callback", function (assert) {
        for (const position of [1, 3]) {
            const calls = [];
            let input, called = false;
            const callback = () => { called = true; return false; };
            const vm = {
                line: 42,
                tagoff: (stream) => { calls.push(["tagoff", stream]); },
                vmResetControlBuffer: () => { calls.push(["reset"]); },
                pos: () => position,
                print: (stream, ...args) => { calls.push(["print", stream, ...args]); },
                cursor: (stream, system, user) => { calls.push(["cursor", stream, system, user]); },
                vmStop: (reason, priority, force, paras) => {
                    calls.push(["stop", reason, priority, force]);
                    input = paras;
                }
            };
            ProgramRunner.enterDirectMode(vm, callback);
            const expected = [["tagoff", 0], ["reset"]];
            if (position > 1) {
                expected.push(["print", 0, "\r\n"]);
            }
            expected.push(["print", 0, "Ready\r\n"], ["cursor", 0, 1, 1], ["stop", "direct", 0, true]);
            assert.deepEqual(calls, expected);
            assert.strictEqual(input === null || input === void 0 ? void 0 : input.line, 42);
            assert.strictEqual(input === null || input === void 0 ? void 0 : input.input, "");
            assert.strictEqual(input === null || input === void 0 ? void 0 : input.message, "Ready\r\n");
            assert.strictEqual(input === null || input === void 0 ? void 0 : input.fnInputCallback, callback);
            assert.strictEqual(called, false, "The controller remains responsible for consuming input");
            input === null || input === void 0 ? void 0 : input.fnInputCallback();
            assert.strictEqual(called, true);
        }
    });
    QUnit.test("startup resets DATA, saves pending output, and initializes execution in order", function (assert) {
        const host = createRunner(), startup = createStartupVm();
        assert.strictEqual(host.runner.start("", startup.vm, 0, () => { startup.calls.push(["save"]); }), true);
        assert.deepEqual(startup.calls, [["data"], ["save"], ["run"], ["stop", "", 0, true], ["goto", 0], ["start", 0]]);
    });
    QUnit.test("nonzero start lines preserve the DATA position", function (assert) {
        const host = createRunner(), startup = createStartupVm();
        host.runner.start("", startup.vm, 100);
        assert.deepEqual(startup.calls, [["run"], ["stop", "", 0, true], ["goto", 0], ["start", 100]]);
    });
    QUnit.test("compiled scripts are reused until invalidated", function (assert) {
        const host = createRunner(), startup = createStartupVm();
        assert.strictEqual(host.runner.start("", startup.vm), true);
        assert.strictEqual(host.runner.start("if (", startup.vm), true);
        assert.deepEqual(host.displayed, []);
        host.runner.invalidate();
        startup.calls.length = 0;
        assert.strictEqual(host.runner.start("if (", startup.vm), false);
        assert.deepEqual(startup.calls, [["data"], ["run"]]);
        assert.strictEqual(host.displayed.length, 1);
        assert.ok(host.jsErrors[0] instanceof SyntaxError);
    });
    QUnit.test("pending-output callbacks can invalidate a previously installed script", function (assert) {
        const host = createRunner(), startup = createStartupVm();
        host.runner.setScript(() => undefined);
        assert.strictEqual(host.runner.start("if (", startup.vm, 0, () => host.runner.invalidate()), false);
        assert.strictEqual(host.displayed.length, 1);
    });
    QUnit.test("compiled scripts are callable and syntax errors remain catchable by the host", function (assert) {
        assert.strictEqual(typeof ProgramRunner.compile('o.print(0,"hello")'), "function");
        assert.throws(() => ProgramRunner.compile("if ("), SyntaxError);
        const host = createRunner();
        let executions = 0;
        host.runner.run(() => { executions += 1; });
        assert.strictEqual(executions, 1);
        assert.deepEqual(host.displayed, []);
    });
    QUnit.test("variable errors are composed with BASIC codes before reporting", function (assert) {
        const host = createRunner(), error = Object.assign(new Error("bounds"), { name: "Variables", errCode: 9, value: "array", pos: 12 });
        host.runner.run(() => { throw error; });
        assert.deepEqual(host.composed, [{ error, code: 9, value: "array" }]);
        assert.deepEqual(host.displayed, [{ error, noSelection: false }]);
        assert.deepEqual(host.jsErrors, []);
    });
    QUnit.test("already composed BASIC errors are not composed again", function (assert) {
        const host = createRunner(), error = Object.assign(new Error("BASIC error"), { name: "CpcVm" });
        host.runner.run(() => { throw error; });
        assert.deepEqual(host.composed, []);
        assert.deepEqual(host.displayed, [{ error, noSelection: true }]);
    });
    QUnit.test("handled BASIC errors remain hidden", function (assert) {
        const host = createRunner(), error = Object.assign(new Error("handled"), { name: "CpcVm", hidden: true });
        host.runner.run(() => { throw error; });
        assert.deepEqual(host.displayed, []);
        assert.deepEqual(host.logged, ["handled"]);
    });
    QUnit.test("JavaScript failures reach the host hook and become BASIC syntax errors", function (assert) {
        const host = createRunner(), error = new TypeError("host failure");
        host.runner.run(() => { throw error; });
        assert.deepEqual(host.jsErrors, [error]);
        assert.deepEqual(host.composed, [{ error, code: 2, value: "JS " + String(error) }]);
        assert.deepEqual(host.displayed, [{ error, noSelection: true }]);
    });
    QUnit.test("non-Error throws retain the existing logging-only behavior", function (assert) {
        const host = createRunner();
        host.runner.run(() => { throw "host value"; });
        assert.deepEqual(host.logged, ["host value"]);
        assert.deepEqual(host.displayed, []);
        assert.deepEqual(host.composed, []);
    });
});
function createLoadActions() {
    const events = [];
    return {
        events,
        actions: {
            vm: {
                vmStop: (reason, priority) => { events.push("stop:" + reason + ":" + priority); },
                clear: () => { events.push("clear"); }
            },
            getSource: () => "existing",
            setSource: (source) => { events.push("source:" + source); },
            clearResult: () => { events.push("result"); },
            merge: (source, loaded) => { events.push("merge"); return source + "\n" + loaded; },
            invalidate: () => { events.push("invalidate"); },
            removeVariables: () => { events.push("variables"); },
            reset: () => { events.push("reset"); },
            loadFileInMemory: () => { events.push("memory"); },
            parseRun: () => { events.push("run"); },
            parseChain: () => { events.push("chain"); },
            onUnknownCommand: (command) => { events.push("unknown:" + command); }
        }
    };
}
//# sourceMappingURL=ProgramRunner.qunit.js.map