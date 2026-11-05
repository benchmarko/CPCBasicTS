import "../ui/Polyfills";
import { Controller } from "../ui/Controller";
function createBrowserController(restore = true) {
    const events = [];
    let stop = { reason: "break", paras: { stream: 2 } };
    const controller = Object.create(Controller.prototype), runtime = {
        beginControl: (reason, beforeStop) => {
            events.push(["control", reason]);
            beforeStop === null || beforeStop === void 0 ? void 0 : beforeStop();
        },
        continueProgram: (startMainLoop, beforeRestore, onContinueState) => {
            events.push(["continue"]);
            if (restore) {
                beforeRestore === null || beforeRestore === void 0 ? void 0 : beforeRestore();
            }
            stop = { reason: "waitInput", paras: { stream: 2 } };
            onContinueState === null || onContinueState === void 0 ? void 0 : onContinueState(restore);
            startMainLoop();
        },
        startMainLoop: () => { events.push(["loop"]); }
    }, keyboard = {
        setOptions: (options) => {
            events.push(["keyboard", options.fnOnKeyDown ? "handler" : "clear"]);
        }
    }, view = {
        setDisabled: (id, disabled) => { events.push(["disabled", id, disabled]); }
    }, vm = {
        vmGetStopObject: () => stop,
        cursor: (stream, cursorOn) => { events.push(["cursor", stream, cursorOn]); }
    };
    Object.assign(controller, {
        runtime,
        keyboard,
        view,
        vm,
        fnWaitInputHandler: () => { events.push(["input-handler"]); },
        fnWaitKeyHandler: () => { events.push(["key-handler"]); }
    });
    return { controller, events };
}
QUnit.module("Browser Controller adapter", function () {
    QUnit.test("control commands delegate while keyboard cleanup remains host-owned", function (assert) {
        const { controller, events } = createBrowserController();
        controller.startParseRun();
        assert.deepEqual(events, [["control", "parseRun"], ["keyboard", "clear"], ["loop"]]);
    });
    QUnit.test("continuing restores suspended input after cleanup and before loop start", function (assert) {
        const { controller, events } = createBrowserController();
        controller.startContinue();
        assert.deepEqual(events, [
            ["disabled", "runButton" /* ViewID.runButton */, true],
            ["disabled", "stopButton" /* ViewID.stopButton */, false],
            ["disabled", "continueButton" /* ViewID.continueButton */, true],
            ["continue"],
            ["keyboard", "clear"],
            ["cursor", 2, 1],
            ["keyboard", "handler"],
            ["loop"]
        ]);
    });
    QUnit.test("continuing an active INPUT wait reinstalls its handler without suspension cleanup", function (assert) {
        const { controller, events } = createBrowserController(false);
        controller.startContinue();
        assert.deepEqual(events, [
            ["disabled", "runButton" /* ViewID.runButton */, true],
            ["disabled", "stopButton" /* ViewID.stopButton */, false],
            ["disabled", "continueButton" /* ViewID.continueButton */, true],
            ["continue"],
            ["cursor", 2, 1],
            ["keyboard", "handler"],
            ["loop"]
        ]);
    });
});
//# sourceMappingURL=Controller.qunit.js.map