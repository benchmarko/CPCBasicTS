import { ExecutionControls } from "../ui/ExecutionControls";
function createControls() {
    const disabled = new Map(), controls = new ExecutionControls({
        setDisabled: (id, value) => { disabled.set(id, value); }
    });
    return {
        controls,
        buttons: () => [disabled.get("runButton" /* ViewID.runButton */), disabled.get("stopButton" /* ViewID.stopButton */), disabled.get("continueButton" /* ViewID.continueButton */)]
    };
}
QUnit.module("ExecutionControls", function () {
    QUnit.test("active execution and waits enable Stop and disable Run and Continue", function (assert) {
        const host = createControls();
        for (const reason of ["parseRun", "run", "", "waitInput", "waitKey", "waitSound"]) {
            host.controls.update({ reason, line: 10, isRunning: true });
            assert.deepEqual(host.buttons(), [true, false, true], reason);
        }
    });
    QUnit.test("terminal states preserve existing continuation and file-operation rules", function (assert) {
        const host = createControls();
        for (const reason of ["stop", "break", "escape", "error"]) {
            host.controls.update({ reason, line: 10, isRunning: false });
            assert.deepEqual(host.buttons(), [false, true, false], reason);
        }
        for (const reason of ["end", "parse", "renumLines"]) {
            host.controls.update({ reason, line: 10, isRunning: false });
            assert.deepEqual(host.buttons(), [false, true, true], reason);
        }
        for (const reason of ["fileLoad", "fileSave"]) {
            host.controls.update({ reason, line: 10, isRunning: false });
            assert.deepEqual(host.buttons(), [false, false, true], reason);
        }
        host.controls.update({ reason: "reset", line: 0, isRunning: false });
        assert.deepEqual(host.buttons(), [true, true, true]);
    });
    QUnit.test("direct mode retains the preceding terminal state's continuation decision", function (assert) {
        const host = createControls();
        host.controls.update({ reason: "stop", line: 10, isRunning: false });
        host.controls.update({ reason: "direct", line: 10, isRunning: false });
        assert.deepEqual(host.buttons(), [false, true, false]);
        host.controls.programEdited();
        host.controls.update({ reason: "direct", line: 0, isRunning: false });
        assert.deepEqual(host.buttons(), [false, true, true]);
        host.controls.update({ reason: "end", line: "end", isRunning: false });
        host.controls.update({ reason: "direct", line: "end", isRunning: false });
        assert.deepEqual(host.buttons(), [false, true, true]);
    });
});
//# sourceMappingURL=ExecutionControls.qunit.js.map