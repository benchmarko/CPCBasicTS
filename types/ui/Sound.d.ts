import type { SoundData, ToneEnvData, VolEnvData } from "../Interfaces";
type AudioContextConstructorType = typeof window.AudioContext;
interface SoundOptions {
    AudioContextConstructor: AudioContextConstructorType;
}
export declare class Sound {
    private readonly options;
    private isSoundOn;
    private isActivatedByUserFlag;
    private contextNotAvailable;
    private contextStartTime;
    private context?;
    private mergerNode?;
    private readonly gainNodes;
    private readonly oscillators;
    private readonly queues;
    private fScheduleAheadTime;
    private readonly volEnv;
    private readonly toneEnv;
    private readonly debugLogList?;
    constructor(options: SoundOptions);
    private setOptions;
    reset(): void;
    private stopOscillator;
    private debugLog;
    resetQueue(): void;
    private createSoundContext;
    private playNoise;
    private simulateApplyVolEnv;
    private applyVolEnv;
    private applyToneEnv;
    private simulateScheduleNote;
    private scheduleNote;
    testCanQueue(state: number): boolean;
    sound(soundData: SoundData): void;
    setVolEnv(volEnv: number, volEnvData: VolEnvData[]): void;
    setToneEnv(toneEnv: number, toneEnvData: ToneEnvData[]): void;
    private updateQueueStatus;
    scheduler(): void;
    release(releaseMask: number): void;
    sq(n: number): number;
    setActivatedByUser(): void;
    isActivatedByUser(): boolean;
    soundOn(): boolean;
    soundOff(): void;
}
export {};
//# sourceMappingURL=Sound.d.ts.map