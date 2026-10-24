import { compile, HeadlessCompileError } from "../node/Headless";
QUnit.module("Headless", function () {
    QUnit.test("compilation diagnostics and independent machines", function (assert) {
        assert.throws(() => compile("10 LET ="), HeadlessCompileError);
        const program = compile("a=7\nEND", { implicitLines: true }), first = program.createHeadlessMachine(), second = program.createHeadlessMachine();
        assert.strictEqual(first.run().reason, "stopped");
        assert.strictEqual(first.getVariable("a"), 7);
        assert.strictEqual(second.getVariable("a"), 0);
        assert.strictEqual(first.run().steps, 0);
        assert.strictEqual(second.run().reason, "stopped");
    });
    QUnit.test("keyboard checkpoint pausing does not replay side effects", function (assert) {
        const machine = compile('10 count=count+1:k$=INKEY$:done=done+1:GOTO 10').createHeadlessMachine();
        for (const key of ["", "a", "b", ""]) {
            if (key) {
                machine.pressKey(key);
            }
            assert.strictEqual(machine.runUntilInput().reason, "input");
            assert.strictEqual(machine.getVariable("k$"), key);
        }
        assert.strictEqual(machine.getVariable("count"), 4);
        assert.strictEqual(machine.getVariable("done"), 4);
    });
    QUnit.test("budget exhaustion is resumable and bounded", function (assert) {
        const machine = compile("10 count=count+1:GOTO 10").createHeadlessMachine();
        const first = machine.run({ maxSteps: 20 }), before = machine.getVariable("count");
        assert.strictEqual(first.reason, "budget");
        assert.strictEqual(first.steps, 20);
        assert.strictEqual(machine.run({ maxSteps: 10 }).reason, "budget");
        assert.ok(machine.getVariable("count") > before);
        assert.throws(() => machine.run({ maxSteps: 0 }), RangeError);
    });
    QUnit.test("virtual time and FRAME never wait for wall time", function (assert) {
        const machine = compile('10 first=TIME:CALL &BD19\n20 second=TIME:k$=INKEY$\n30 END').createHeadlessMachine({ ticks: 300 });
        assert.strictEqual(machine.run().reason, "frame");
        assert.strictEqual(machine.getTime(), 306);
        machine.advanceTime(150);
        machine.runUntilInput();
        assert.strictEqual(machine.getVariable("first"), 300);
        assert.strictEqual(machine.getVariable("second"), 456);
        assert.throws(() => machine.advanceTime(-1), RangeError);
    });
    QUnit.test("seeded random streams are deterministic and isolated", function (assert) {
        const program = compile("10 initial=RND:FOR idx=1 TO 5:value=RND:NEXT idx\n20 END"), first = program.createHeadlessMachine({ seed: 123 }), second = program.createHeadlessMachine({ seed: 123 }), other = program.createHeadlessMachine({ seed: 456 });
        first.run();
        second.run();
        other.run();
        assert.strictEqual(first.getVariable("value"), second.getVariable("value"));
        assert.notStrictEqual(first.getVariable("initial"), other.getVariable("initial"));
    });
    QUnit.test("BASIC variable names, suffixes, dimensions and bounds", function (assert) {
        const machine = compile('10 DEFINT A-Z:DIM board(2,3):name$="CPC":value=7:timer!=2.5\n20 k$=INKEY$\n30 END').createHeadlessMachine();
        machine.runUntilInput();
        assert.strictEqual(machine.getVariable("VALUE"), 7);
        assert.strictEqual(machine.getVariable("name$"), "CPC");
        assert.strictEqual(machine.getVariable("timer!"), 2.5);
        machine.setVariable("value", 8.5);
        assert.strictEqual(machine.getVariable("value%"), 9);
        machine.setArrayElement("board", [2, 3], 4);
        assert.strictEqual(machine.getArrayElement("BOARD%", [2, 3]), 4);
        assert.throws(() => machine.setArrayElement("board", [3, 0], 1), RangeError);
        assert.throws(() => machine.getArrayElement("board", [-1, 0]), RangeError);
        assert.throws(() => machine.getVariable("unknown"), ReferenceError);
        assert.throws(() => machine.getVariable("board(0,0)"), TypeError);
        assert.throws(() => machine.setVariable("value", 32768), RangeError);
        assert.throws(() => machine.setVariable("name$", 5), TypeError);
        assert.strictEqual(machine.run().reason, "stopped", "Invalid API writes do not stop the VM");
    });
    QUnit.test("text cells and window scrolling are observable", function (assert) {
        var _a, _b;
        const machine = compile('10 MODE 0:WINDOW #1,2,3,2,3:PEN #1,3\n20 PRINT #1,"AB";:LOCATE #1,1,2:PRINT #1,"CD";\n30 LOCATE #1,1,1:PRINT #1,CHR$(11);CHR$(16);\n40 END').createHeadlessMachine();
        assert.strictEqual(machine.run().reason, "stopped");
        assert.strictEqual((_a = machine.screen.getCell(1, 1)) === null || _a === void 0 ? void 0 : _a.char, 32);
        assert.deepEqual(machine.screen.getCell(1, 2), { char: 65, pen: 3, paper: 0 });
        const cell = machine.screen.getCell(1, 2);
        if (cell) {
            cell.char = 0;
        }
        assert.strictEqual((_b = machine.screen.getCell(1, 2)) === null || _b === void 0 ? void 0 : _b.char, 65);
    });
    QUnit.test("runtime failures and unsupported facilities are explicit", function (assert) {
        const invalid = compile("10 ERROR 5").createHeadlessMachine(), result = invalid.run();
        assert.strictEqual(result.reason, "error");
        assert.ok(result.error);
        assert.strictEqual(invalid.run().reason, "error");
        assert.strictEqual(compile("10 PLOT 0,0").createHeadlessMachine().run().reason, "error");
        assert.strictEqual(compile("10 AFTER 1 GOSUB 30\n20 END\n30 RETURN").createHeadlessMachine().run().reason, "error");
        const blocked = compile("10 INPUT value").createHeadlessMachine().run();
        assert.strictEqual(blocked.reason, "blocked");
        assert.strictEqual(blocked.vmReason, "waitInput");
    });
});
//# sourceMappingURL=Headless.qunit.js.map