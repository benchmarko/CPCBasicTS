import { SoundQueue } from "../SoundQueue";
function createQueue(reason = "waitSound", states = [1, 2]) {
    const stop = { reason, priority: 40, paras: { command: "sound", stream: 0, line: 10 } }, queue = states.map((state) => ({ state, period: 100, duration: 1, volume: 5, volEnv: 0, toneEnv: 0, noise: 0 })), played = [], allowed = new Set(states), events = [];
    const vm = {
        vmGetStopObject: () => stop,
        vmLoopCondition: () => { events.push("frame"); return true; },
        vmGetSoundData: () => { events.push("queue"); return queue; },
        vmStop: (nextReason) => { events.push("stop:" + nextReason); stop.reason = nextReason; },
        vmGetTimeUntilFrame: () => { events.push("delay"); return 17; }
    };
    const soundQueue = new SoundQueue(vm, {
        testCanQueue: (state) => allowed.has(state),
        sound: (data) => { played.push(data); }
    });
    return { soundQueue, vm, stop, queue, played, allowed, events };
}
QUnit.module("SoundQueue", function () {
    QUnit.test("drains queued sounds in order and clears only a sound wait", function (assert) {
        const host = createQueue(), original = host.queue.slice();
        assert.strictEqual(host.soundQueue.poll(), 17);
        assert.deepEqual(host.played, original);
        assert.strictEqual(host.queue.length, 0);
        assert.strictEqual(host.stop.reason, "");
        assert.deepEqual(host.events, ["frame", "queue", "stop:", "delay"]);
    });
    QUnit.test("backpressure preserves the remaining queue and resumes when space is available", function (assert) {
        const host = createQueue();
        host.allowed.delete(2);
        host.soundQueue.poll();
        assert.deepEqual(host.played.map((data) => data.state), [1]);
        assert.deepEqual(host.queue.map((data) => data.state), [2]);
        assert.strictEqual(host.stop.reason, "waitSound");
        host.allowed.add(2);
        host.soundQueue.poll();
        assert.deepEqual(host.played.map((data) => data.state), [1, 2]);
        assert.strictEqual(host.stop.reason, "");
    });
    QUnit.test("unactivated audio still updates frame events without touching the queue", function (assert) {
        const host = createQueue();
        assert.strictEqual(host.soundQueue.poll(false), 17);
        assert.deepEqual(host.events, ["frame", "delay"]);
        assert.strictEqual(host.queue.length, 2);
        assert.deepEqual(host.played, []);
        assert.strictEqual(host.stop.reason, "waitSound");
    });
    QUnit.test("queue draining does not clear unrelated waits", function (assert) {
        for (const reason of ["waitInput", "waitKey", "onError"]) {
            const host = createQueue(reason);
            host.soundQueue.poll();
            assert.strictEqual(host.stop.reason, reason);
            assert.strictEqual(host.played.length, 2);
        }
    });
    QUnit.test("frame processing can replace a sound wait with a higher-priority stop", function (assert) {
        const host = createQueue();
        host.vm.vmLoopCondition = () => { host.stop.reason = "onError"; return false; };
        host.soundQueue.poll();
        assert.strictEqual(host.stop.reason, "onError");
        assert.strictEqual(host.played.length, 2);
    });
    QUnit.test("empty activated sound waits resume without queueing anything", function (assert) {
        const host = createQueue("waitSound", []);
        host.soundQueue.poll();
        assert.strictEqual(host.stop.reason, "");
        assert.deepEqual(host.played, []);
    });
});
//# sourceMappingURL=SoundQueue.qunit.js.map