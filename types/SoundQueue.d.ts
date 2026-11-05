import type { CpcVm } from "./CpcVm";
import type { ISound } from "./Interfaces";
export declare class SoundQueue {
    private readonly vm;
    private readonly sound;
    constructor(vm: Pick<CpcVm, "vmGetStopObject" | "vmLoopCondition" | "vmGetSoundData" | "vmStop" | "vmGetTimeUntilFrame">, sound: Pick<ISound, "testCanQueue" | "sound">);
    poll(activated?: boolean): number;
}
//# sourceMappingURL=SoundQueue.d.ts.map