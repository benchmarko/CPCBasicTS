export class SoundQueue {
    constructor(vm, sound) {
        this.vm = vm;
        this.sound = sound;
    }
    poll(activated = true) {
        const stop = this.vm.vmGetStopObject();
        this.vm.vmLoopCondition();
        if (activated) {
            const queue = this.vm.vmGetSoundData();
            while (queue.length && this.sound.testCanQueue(queue[0].state)) {
                const data = queue[0];
                queue.shift();
                this.sound.sound(data);
            }
            if (!queue.length && stop.reason === "waitSound") {
                this.vm.vmStop("", 0, true);
            }
        }
        return this.vm.vmGetTimeUntilFrame();
    }
}
//# sourceMappingURL=SoundQueue.js.map