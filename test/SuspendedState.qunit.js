import { SuspendedState } from "../SuspendedState";
function initialStop() {
    return { reason: "", priority: 0, paras: { command: "", stream: 0, line: 0 } };
}
QUnit.module("SuspendedState", function () {
    QUnit.test("saved input state is independent of later VM and observer mutations", function (assert) {
        const state = new SuspendedState(initialStop()), callback = () => true, input = { command: "input", stream: 2, line: 10, input: "partial", message: "?", fnInputCallback: callback }, stop = { reason: "waitInput", priority: 45, paras: input };
        state.save(stop);
        input.input = "changed";
        const snapshot = state.get();
        assert.strictEqual(snapshot.paras.input, "partial");
        snapshot.paras.input = "observer change";
        assert.strictEqual(state.get().paras.input, "partial");
        assert.strictEqual(state.get().paras.fnInputCallback, callback);
    });
    QUnit.test("repeated suspension does not overwrite the original wait", function (assert) {
        const state = new SuspendedState(initialStop()), stop = { reason: "waitKey", priority: 30, paras: { command: "call", stream: 0, line: 20 } };
        state.save(stop);
        state.save(Object.assign(Object.assign({}, stop), { reason: "break", priority: 80 }));
        state.save(Object.assign(Object.assign({}, stop), { reason: "escape", priority: 85 }));
        assert.deepEqual(state.get(), stop);
    });
    QUnit.test("restoration preserves stop identity and clears the saved continuation", function (assert) {
        const baseline = initialStop(), state = new SuspendedState(baseline), waiting = { reason: "waitSound", priority: 40, paras: { command: "sound", stream: 0, line: 30 } }, active = Object.assign(Object.assign({}, baseline), { reason: "break", priority: 80 });
        state.save(waiting);
        state.restore(active);
        assert.deepEqual(active, waiting);
        assert.notStrictEqual(active.paras, waiting.paras);
        assert.deepEqual(state.get(), baseline);
        state.save(waiting);
        state.reset();
        assert.deepEqual(state.get(), baseline);
    });
    QUnit.test("continue restores only resumable reasons and preserves host cleanup order", function (assert) {
        const baseline = initialStop(), state = new SuspendedState(baseline), saved = { reason: "waitInput", priority: 45, paras: { command: "input", stream: 2, line: 12, input: "partial", message: "?", fnInputCallback: () => true } }, calls = [], vm = { cursor: (stream, enabled) => { calls.push(["cursor", stream, enabled]); } };
        state.save(saved);
        const active = { reason: "direct", priority: 0, paras: { command: "direct", stream: 0, line: 20 } };
        assert.strictEqual(state.restoreForContinue(vm, active, () => { calls.push(["cleanup"]); }), true);
        assert.deepEqual(calls, [["cursor", 0, 0], ["cleanup"]]);
        assert.deepEqual(active, saved);
        assert.deepEqual(state.get(), baseline);
        calls.length = 0;
        const waiting = { reason: "waitSound", priority: 40, paras: { command: "sound", stream: 0, line: 30 } };
        assert.strictEqual(state.restoreForContinue(vm, waiting, () => { calls.push(["cleanup"]); }), false);
        assert.deepEqual(calls, []);
        assert.strictEqual(waiting.reason, "waitSound");
    });
});
//# sourceMappingURL=SuspendedState.qunit.js.map