import { Snapshot } from "../Snapshot";
function createSnapshot() {
    const header = new Uint8Array(0x100), memory = "\x00\x01\xffMEMORY";
    for (const [index, char] of Array.from("MV - SNA").entries()) {
        header[index] = char.charCodeAt(0);
    }
    header[0x10] = 1;
    for (let index = 0; index < 16; index += 1) {
        header[0x2f + index] = index;
    }
    header[0x3f] = 31;
    header[0x40] = 0x8e;
    header[0x41] = 0xc5;
    for (let index = 0; index < 18; index += 1) {
        header[0x43 + index] = index + 10;
    }
    return { snapshot: new Snapshot({ name: "test", data: String.fromCharCode(...header) + memory }), memory };
}
function createVm() {
    const calls = [];
    return {
        calls,
        vm: {
            vmChangeMode: (mode) => { calls.push(["mode", mode]); },
            ink: (pen, ink) => { calls.push(["ink", pen, ink]); },
            border: (ink) => { calls.push(["border", ink]); },
            vmSetRamSelect: (ram) => { calls.push(["ram", ram]); },
            vmSetCrtcData: (index, value) => { calls.push(["crtc", index, value]); }
        }
    };
}
QUnit.module("Snapshot", function () {
    QUnit.test("applies mode, converted inks, RAM bank, and CRTC registers in order", function (assert) {
        const host = createSnapshot(), target = createVm(), inks = [13, 27, 19, 25, 1, 7, 10, 16, 28, 29, 24, 26, 6, 8, 15, 17], expected = [["mode", 2]];
        for (const [index, ink] of inks.entries()) {
            expected.push(["ink", index, ink]);
        }
        expected.push(["border", 14], ["ram", 0xc5]);
        for (let index = 0; index < 18; index += 1) {
            expected.push(["crtc", index, index + 10]);
        }
        assert.strictEqual(host.snapshot.applyToVm(target.vm), host.memory);
        assert.deepEqual(target.calls, expected);
        target.calls.length = 0;
        assert.strictEqual(host.snapshot.applyToVm(target.vm), host.memory);
        assert.deepEqual(target.calls, expected);
    });
    QUnit.test("truncated snapshots fail before mutating the VM", function (assert) {
        const snapshot = new Snapshot({ name: "truncated", data: "MV - SNA" }), target = createVm();
        assert.throws(() => snapshot.applyToVm(target.vm), /End of File/);
        assert.deepEqual(target.calls, []);
    });
});
//# sourceMappingURL=Snapshot.qunit.js.map