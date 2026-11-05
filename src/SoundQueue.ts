import type { CpcVm } from "./CpcVm";
import type { ISound } from "./Interfaces";

export class SoundQueue {
	constructor(
		private readonly vm: Pick<CpcVm, "vmGetStopObject" | "vmLoopCondition" | "vmGetSoundData" | "vmStop" | "vmGetTimeUntilFrame">,
		private readonly sound: Pick<ISound, "testCanQueue" | "sound">
	) {}

	poll(activated = true): number {
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