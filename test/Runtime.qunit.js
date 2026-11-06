import { InputLine } from "../InputLine";
import { FileHandler } from "../FileHandler";
import { Runtime } from "../Runtime";
import { ProgramCompiler } from "../ProgramCompiler";
import { ProgramRunner } from "../ProgramRunner";
import { Random } from "../Random";
import { RunLoop } from "../RunLoop";
import { SoundQueue } from "../SoundQueue";
import { Utils } from "../Utils";
function captureConsoleWarnings(run) {
    const originalWarn = Utils.console.warn, warnings = [];
    Utils.console.warn = (...args) => { warnings.push(args); };
    try {
        return { result: run(), warnings };
    }
    finally {
        Utils.console.warn = originalWarn;
    }
}
function captureConsoleLogs(run) {
    const originalLog = Utils.console.log, logs = [];
    Utils.console.log = (...args) => { logs.push(args); };
    try {
        return { result: run(), logs };
    }
    finally {
        Utils.console.log = originalLog;
    }
}
QUnit.module("Runtime", function () {
    QUnit.test("shared runtime services use the injected host devices", function (assert) {
        const canvas = {}, keys = [], keyboard = { getKeyFromBuffer: () => { var _a; return (_a = keys.shift()) !== null && _a !== void 0 ? _a : ""; } }, sound = {}, events = [];
        let source = "10 =";
        const runtime = new Runtime({
            canvas,
            keyboard,
            sound,
            random: new Random(),
            arrayBounds: false,
            basicVersion: "1.1",
            trace: false,
            implicitLines: false,
            integerOverflow: false,
            onClickKey: () => undefined,
            encodeTokens: (input) => input,
            outputError: () => undefined,
            getCodeGeneratorBasic: () => ({}),
            getCodeGeneratorToken: () => undefined,
            logger: Utils.console,
            programHost: {
                getSource: () => source,
                beforeCompileProgram: () => { events.push("beforeCompile"); },
                prepareCompileOutput: (output) => { events.push(["output", Boolean(output.error)]); return output.text; },
                beforeProgramStart: () => { events.push("beforeStart"); },
                afterProgramStart: () => { events.push("afterStart"); }
            },
            handlers: {},
            getInitialDelay: () => 0,
            setTimeout: () => undefined,
            onExit: () => undefined,
            onExecutionState: () => undefined,
            onUnknownReason: () => undefined,
            onMemoryError: () => undefined
        });
        const vmOptions = runtime.vm.getOptions();
        assert.strictEqual(runtime.vm.variables, runtime.variables);
        assert.strictEqual(vmOptions.canvas, canvas);
        assert.strictEqual(vmOptions.keyboard, keyboard);
        assert.strictEqual(vmOptions.sound, sound);
        assert.ok(runtime.programRunner instanceof ProgramRunner);
        assert.ok(runtime.programCompiler instanceof ProgramCompiler);
        assert.ok(runtime.inputLine instanceof InputLine);
        assert.ok(runtime.soundQueue instanceof SoundQueue);
        assert.ok(runtime.runLoop instanceof RunLoop);
        const compiled = runtime.compileProgram("10 END");
        assert.notOk(compiled.error);
        assert.ok(compiled.text.length > 0);
        const failed = captureConsoleWarnings(() => runtime.compileAndStartProgram({ clearVariables: false, clearBeforeRun: true }));
        assert.ok(failed.result.error);
        assert.ok(failed.warnings.some((args) => String(args[0]).includes("Unexpected token in 10")));
        assert.deepEqual(events, ["beforeCompile", ["output", true]]);
        events.length = 0;
        source = "10 END";
        runtime.programRunner.start = (_source, _vm, _line, beforeCompile) => {
            beforeCompile === null || beforeCompile === void 0 ? void 0 : beforeCompile();
            return true;
        };
        const started = runtime.compileAndStartProgram({ clearVariables: false, clearBeforeRun: false });
        assert.notOk(started.error);
        assert.deepEqual(events, ["beforeCompile", ["output", false], "beforeStart", "afterStart"]);
        events.length = 0;
        runtime.vm.vmStop("waitInput", 45, true);
        const invalid = captureConsoleLogs(() => runtime.handleWaitInput({
            onInvalid: () => { events.push("invalid"); },
            startMainLoop: () => { events.push("main"); },
            continueExecution: () => { events.push("continue"); }
        }));
        assert.deepEqual(invalid.result, { status: "invalid" });
        assert.ok(invalid.logs.some((args) => String(args[0]).includes("BASIC error(32):") && String(args[1]).includes("fnWaitInput")));
        assert.deepEqual(events, ["invalid"]);
        const inputParas = {
            command: "direct", stream: 0, line: 10, input: "", message: "",
            fnInputCallback: () => true
        };
        runtime.vm.vmStop("waitInput", 45, true, inputParas);
        runtime.inputLine.readAndSubmit = () => false;
        const pending = runtime.handleWaitInput({
            onInvalid: () => { assert.ok(false, "Valid input state must not be rejected"); },
            startMainLoop: () => { events.push("main"); },
            continueExecution: () => { events.push("continue"); }
        });
        assert.deepEqual(pending, { status: "pending", reason: "waitInput" });
        events.length = 0;
        runtime.vm.vmStop("direct", 90, true, inputParas);
        runtime.inputLine.readAndSubmit = (paras, onReturn) => {
            paras.input = "typed";
            onReturn === null || onReturn === void 0 ? void 0 : onReturn(paras.input);
            return true;
        };
        const submitted = runtime.handleWaitInput({
            onInvalid: () => { assert.ok(false, "Valid input state must not be rejected"); },
            onInputReturn: (input) => { events.push(["return", input]); },
            onInputSubmitted: () => { events.push("submitted"); },
            startMainLoop: () => { events.push("main"); },
            continueExecution: () => { events.push("continue"); }
        });
        assert.deepEqual(submitted, { status: "submitted" });
        assert.deepEqual(events, [["return", "typed"], "submitted", "main"]);
        events.length = 0;
        runtime.soundQueue.poll = (activated) => {
            events.push(["poll", activated]);
            return 17;
        };
        runtime.handleWaitSound(false);
        assert.strictEqual(runtime.runLoop.nextDelay, 17);
        assert.deepEqual(events, [["poll", false]]);
        events.length = 0;
        runtime.handleWaitSound();
        assert.deepEqual(events, [["poll", true]]);
        events.length = 0;
        keys.push("K");
        runtime.vm.vmStop("waitKey", 45, true);
        const key = runtime.handleWaitKey(() => { events.push("activation"); return false; }, (value) => {
            events.push(["key", value]);
            assert.strictEqual(runtime.vm.vmGetStopObject().reason, "waitKey", "Host key presentation precedes VM resume");
        });
        assert.strictEqual(key, "K");
        assert.deepEqual(events, [["key", "K"]]);
        assert.strictEqual(runtime.vm.vmGetStopObject().reason, "");
        events.length = 0;
        runtime.vm.vmStop("waitKey", 45, true);
        assert.strictEqual(runtime.handleWaitKey(() => { events.push("activation"); return false; }), "");
        assert.deepEqual(events, ["activation", ["poll", false]]);
        runtime.vm.vmGetTimeUntilFrame = () => 19;
        runtime.vm.vmStop("waitFrame", 40, true);
        runtime.handleWaitFrame();
        assert.strictEqual(runtime.runLoop.nextDelay, 19);
        assert.strictEqual(runtime.vm.vmGetStopObject().reason, "");
        events.length = 0;
        runtime.vm.vmStop("waitKey", 45, true);
        runtime.saveSuspendedState();
        runtime.vm.vmStop("break", 80, true);
        runtime.continueProgram(() => { events.push(["loop", runtime.vm.vmGetStopObject().reason]); }, () => { events.push("cleanup"); }, () => { events.push(["restored", runtime.vm.vmGetStopObject().reason]); });
        assert.deepEqual(events, ["cleanup", ["restored", "waitKey"], ["loop", "waitKey"]]);
        events.length = 0;
        runtime.beginControl("break", () => {
            events.push(["cleanup", runtime.vm.vmGetStopObject().reason]);
        });
        assert.deepEqual(events, [["cleanup", "waitKey"]]);
        assert.strictEqual(runtime.vm.vmGetStopObject().reason, "break");
        assert.strictEqual(runtime.suspendedState.get().reason, "waitKey");
        runtime.beginControl("parse");
        assert.strictEqual(runtime.vm.vmGetStopObject().reason, "parse");
        assert.strictEqual(runtime.suspendedState.get().reason, "waitKey");
        runtime.beginControl("run");
        assert.strictEqual(runtime.vm.vmGetStopObject().reason, "run");
        assert.strictEqual(runtime.suspendedState.get().reason, "");
        runtime.setNextDelay(23);
        assert.strictEqual(runtime.runLoop.nextDelay, 23);
        runtime.startMainLoop();
        assert.ok(runtime.runLoop.isRunning);
        runtime.vm.vmStop("", 0, true);
        const line = runtime.vm.line;
        runtime.beginRenumber({ newLine: 100, oldLine: 10, step: 5, keep: 65535 });
        const renumberStop = runtime.vm.vmGetStopObject();
        assert.strictEqual(renumberStop.reason, "renumLines");
        assert.strictEqual(renumberStop.priority, 85);
        assert.deepEqual(renumberStop.paras, {
            command: "renum", stream: 0, newLine: 100, oldLine: 10, step: 5, keep: 65535, line
        });
        runtime.vm.vmStop("", 0, true);
        runtime.vm.vmGoto(40);
        events.length = 0;
        runtime.deleteProgramLines({ command: "delete", stream: 0, line: 40, first: 10, last: 20 }, ["10 PRINT 1", "20 END"], (deletion) => { events.push(["delete", deletion]); }, (error) => { events.push(["invalid", error]); });
        assert.deepEqual(events, [["delete", "10\n20"]]);
        assert.strictEqual(runtime.vm.line, 0);
        assert.strictEqual(runtime.vm.vmGetStopObject().reason, "end");
        runtime.vm.vmStop("", 0, true);
        runtime.vm.vmGoto(50);
        events.length = 0;
        const invalidDeletion = captureConsoleLogs(() => runtime.deleteProgramLines({ command: "delete", stream: 0, line: 50, first: 10, last: 20 }, ["PRINT 7"], () => { assert.ok(false, "Malformed source must not be deleted"); }, (error) => {
            assert.ok(error instanceof Error);
            assert.strictEqual(runtime.vm.line, 50, "Error presentation precedes VM reset");
            events.push("invalid");
        }));
        assert.ok(invalidDeletion.logs.some((args) => String(args[0]).includes("BASIC error(21):") && String(args[1]).includes("Direct command found in 50: delete")));
        assert.deepEqual(events, ["invalid"]);
        assert.strictEqual(runtime.vm.line, 0);
        assert.strictEqual(runtime.vm.vmGetStopObject().reason, "end");
        events.length = 0;
        runtime.vm.vmGoto(40);
        runtime.vm.cursor = (stream, cursorOn) => { events.push(["cursor", stream, cursorOn]); };
        runtime.insertDirectProgramLine("10 PRINT 1", "20 END", 0, (source, input) => { events.push(["merge", source, input]); return source + "\n" + input; }, (source) => { events.push(["source", source]); }, () => {
            assert.strictEqual(runtime.vm.line, 0);
            events.push("edited");
        });
        assert.deepEqual(events, [
            ["merge", "10 PRINT 1", "20 END"],
            ["source", "10 PRINT 1\n20 END"],
            "edited",
            ["cursor", 0, 1]
        ]);
        assert.strictEqual(runtime.vm.line, 0);
        events.length = 0;
        runtime.prepareDirectProgram = (source, line) => { events.push(["prepare", source, line]); };
        const directOutput = runtime.executeDirectCommand("PRINT 1", "10 END", 30, 0, "", {
            outputError: (error) => { events.push(["error", error]); return "error"; },
            setOutputText: (text) => { events.push(["output", text]); },
            onPrepareError: (error) => { events.push(["prepareError", error]); }
        });
        assert.notOk(directOutput.error);
        assert.deepEqual(events, [
            ["output", directOutput.text + "\n"],
            ["prepare", directOutput.text + "\n", 30]
        ]);
        events.length = 0;
        runtime.vm.print = (stream, text) => { events.push(["prompt", stream, text]); };
        const failedDirectOutput = captureConsoleWarnings(() => runtime.executeDirectCommand("PRINT =", "", 30, 0, "?", {
            outputError: () => { events.push("compileError"); return "syntax error"; },
            setOutputText: (text) => { events.push(["output", text]); },
            onPrepareError: (error) => { events.push(["prepareError", error]); }
        }));
        assert.ok(failedDirectOutput.result.error);
        assert.ok(failedDirectOutput.warnings.some((args) => String(args[0]).includes("Unexpected token")));
        assert.deepEqual(events, ["compileError", ["output", "syntax error\n"], ["prompt", 0, "?"], ["cursor", 0, 1]]);
        events.length = 0;
        const directInputParas = {
            command: "direct", stream: 0, line: 10, input: "  10 PRINT 1  ", message: "?",
            fnInputCallback: () => true
        };
        runtime.vm.vmStop("direct", 90, true, directInputParas);
        const directInput = runtime.readDirectInput();
        assert.deepEqual(directInput, { input: "10 PRINT 1", stream: 0, message: "?", isProgramLine: true });
        assert.strictEqual(directInputParas.input, "");
        assert.deepEqual(events, [["cursor", 0, 0]]);
        events.length = 0;
        directInputParas.input = "   ";
        runtime.vm.vmStop("direct", 90, true, directInputParas);
        assert.deepEqual(runtime.readDirectInput(), { input: "", stream: 0, message: "?", isProgramLine: false });
        assert.strictEqual(directInputParas.input, "");
        assert.deepEqual(events, []);
        events.length = 0;
        runtime.vm.print = (stream, text) => { events.push(["print", stream, text]); };
        const erased = runtime.eraseFiles({ eraseFiles: () => ({ name: "*.bas", matched: false, removed: ["old.bas"], missing: ["stale.bas"] }) }, { command: "era", stream: 0, line: 10, fileMask: "*.bas" }, (name) => { events.push(["removed", name]); }, (name) => { events.push(["missing", name]); });
        assert.deepEqual(erased.removed, ["old.bas"]);
        assert.deepEqual(events, [
            ["print", 0, "*.bas not found\r\n"],
            ["removed", "old.bas"],
            ["print", 0, "stale.bas not found\r\n"],
            ["missing", "stale.bas"]
        ]);
        assert.strictEqual(runtime.vm.vmGetStopObject().reason, "");
        events.length = 0;
        runtime.renameFile({ renameFile: () => ({ status: "oldNotFound", oldName: "old.bas", newName: "new.bas" }) }, { command: "ren", stream: 1, line: 20, oldName: "old.bas", newName: "new.bas" });
        assert.deepEqual(events, [["print", 1, "old.bas not found\r\n"]]);
        assert.strictEqual(runtime.vm.vmGetStopObject().reason, "");
        events.length = 0;
        const edit = captureConsoleLogs(() => runtime.editLine({ command: "edit", stream: 0, line: 0, first: 42 }, undefined, () => true, (error) => { events.push(["missing", error.name]); }));
        const editStarted = edit.result;
        assert.ok(edit.logs.some((args) => String(args[0]).includes("BASIC error(8):") && String(args[1]).includes("Line does not exist in 0: 42")));
        assert.strictEqual(editStarted, false);
        assert.deepEqual(events, [["missing", "CpcVm"]]);
        assert.strictEqual(runtime.vm.vmGetStopObject().reason, "stop");
        events.length = 0;
        runtime.printDirectoryEntries(["z.bas", "a.bas"], 2, true);
        assert.deepEqual(events, FileHandler.formatDirectoryEntries(["z.bas", "a.bas"], true).map((text) => ["print", 2, text]));
        assert.strictEqual(runtime.vm.vmGetStopObject().reason, "");
        events.length = 0;
        runtime.vm.vmStop("waitKey", 45, true);
        runtime.completeExampleLoad("10 END", undefined, (input) => {
            events.push(["continue", input, runtime.vm.vmGetStopObject().reason]);
        });
        assert.deepEqual(events, [["continue", "10 END", ""]]);
        events.length = 0;
        runtime.vm.vmStop("waitKey", 45, true);
        const failedExampleLoad = captureConsoleLogs(() => runtime.failExampleLoad("missing", (error, noSelection) => {
            assert.ok(error instanceof Error);
            assert.strictEqual(noSelection, true);
            events.push(["error", runtime.vm.vmGetStopObject().reason]);
        }, (input) => { events.push(["continue", input, runtime.vm.vmGetStopObject().reason]); }));
        assert.ok(failedExampleLoad.logs.some((args) => String(args[0]).includes("BASIC error(32):") && String(args[1]).includes("missing not found")));
        events.length = 0;
        runtime.vm.vmStop("fileLoad", 90, true);
        runtime.dispatchFileLoad({ open: true, name: "stored.bas", command: "load", first: 0, last: 0 }, {
            deleteLines: () => { events.push(["delete"]); },
            logFile: () => { events.push(["log"]); },
            loadFromStorage: () => "stored contents",
            onStorageLoad: (input) => { events.push(["loaded", input, runtime.vm.vmGetStopObject().reason]); },
            loadExample: () => { events.push(["example"]); },
            onNotOpen: () => { events.push(["notOpen"]); },
            setNextDelay: () => undefined
        });
        assert.deepEqual(events, [["log"], ["loaded", "stored contents", ""]]);
        events.length = 0;
        runtime.vm.vmStop("fileLoad", 90, true);
        runtime.dispatchFileLoad({ open: true, name: "example.bas", command: "load", first: 0, last: 0 }, {
            deleteLines: () => { events.push(["delete"]); },
            logFile: () => { events.push(["log"]); },
            loadFromStorage: () => null,
            onStorageLoad: () => { events.push(["loaded"]); },
            loadExample: () => { events.push(["example", runtime.vm.vmGetStopObject().reason]); },
            onNotOpen: () => { events.push(["notOpen"]); },
            setNextDelay: () => undefined
        });
        assert.deepEqual(events, [["log"], ["example", "fileLoad"]]);
    });
});
//# sourceMappingURL=Runtime.qunit.js.map