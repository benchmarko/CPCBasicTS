import { RunLoop } from "../RunLoop";
function createRunLoop(reason = "") {
    const stop = {
        reason, priority: 0,
        paras: { command: "", stream: 0, line: 10 }
    };
    const pending = [], events = [], handlers = {
        end: () => undefined,
        waitInput: () => undefined,
        waitKey: () => undefined,
        waitSound: () => undefined
    };
    let initialDelay = 5, executions = 0;
    const options = {
        vm: {
            vmGetStopObject: () => stop,
            vmStop: (nextReason) => { stop.reason = nextReason; }
        },
        execute: () => { executions += 1; stop.reason = "end"; },
        handlers,
        getInitialDelay: () => initialDelay,
        setTimeout: (callback, delay) => { pending.push({ callback, delay }); },
        onExit: () => { events.push("exit"); },
        onStateChange: () => { events.push((loop.isRunning ? "active:" : "idle:") + stop.reason); },
        onUnknownReason: (unknownReason) => { events.push("unknown:" + unknownReason); }
    };
    const loop = new RunLoop(options);
    return {
        loop, stop, pending, events, handlers, options,
        get executions() { return executions; },
        setInitialDelay(delay) { initialDelay = delay; },
        step() { var _a; (_a = pending.shift()) === null || _a === void 0 ? void 0 : _a.callback(); }
    };
}
QUnit.module("RunLoop", function () {
    QUnit.test("repeated starts queue one callback and terminal stops report before exit", function (assert) {
        const host = createRunLoop();
        host.loop.start();
        host.loop.start();
        assert.strictEqual(host.pending.length, 1);
        assert.strictEqual(host.pending[0].delay, 0);
        host.step();
        assert.strictEqual(host.executions, 1);
        assert.strictEqual(host.loop.isRunning, false);
        assert.strictEqual(host.pending.length, 0);
        assert.deepEqual(host.events.slice(-3), ["idle:end", "exit", "idle:end"]);
    });
    QUnit.test("input, key, and sound waits keep polling without executing the program", function (assert) {
        for (const reason of ["waitInput", "waitKey", "waitSound"]) {
            const host = createRunLoop(reason);
            host.loop.start();
            host.step();
            assert.strictEqual(host.executions, 0, reason);
            assert.strictEqual(host.loop.isRunning, true, reason);
            assert.strictEqual(host.pending.length, 1, reason);
            assert.strictEqual(host.pending[0].delay, 5, reason);
        }
    });
    QUnit.test("handlers can resume execution and select the next delay", function (assert) {
        const host = createRunLoop("waitInput");
        host.handlers.waitInput = () => {
            host.stop.reason = "";
            host.loop.nextDelay = 17;
        };
        host.loop.start();
        host.step();
        assert.strictEqual(host.pending[0].delay, 17);
        assert.strictEqual(host.executions, 0);
        host.step();
        assert.strictEqual(host.executions, 1);
        assert.strictEqual(host.loop.isRunning, false);
    });
    QUnit.test("each iteration reads the latest default delay", function (assert) {
        const host = createRunLoop("waitKey");
        host.loop.start();
        host.step();
        assert.strictEqual(host.pending[0].delay, 5);
        host.setInitialDelay(23);
        host.step();
        assert.strictEqual(host.pending[0].delay, 23);
    });
    QUnit.test("unknown and inherited reasons stop safely", function (assert) {
        for (const reason of ["unknown", "toString"]) {
            const host = createRunLoop(reason);
            host.loop.start();
            host.step();
            assert.strictEqual(host.stop.reason, "error");
            assert.strictEqual(host.loop.isRunning, false);
            assert.ok(host.events.includes("unknown:" + reason));
        }
    });
    QUnit.test("an exit callback can start a new run without duplicating timers", function (assert) {
        const host = createRunLoop();
        host.options.onExit = () => {
            host.stop.reason = "waitKey";
            host.loop.start();
        };
        host.loop.start();
        host.step();
        assert.strictEqual(host.loop.isRunning, true);
        assert.strictEqual(host.pending.length, 1);
        host.step();
        assert.strictEqual(host.pending.length, 1);
    });
});
//# sourceMappingURL=RunLoop.qunit.js.map