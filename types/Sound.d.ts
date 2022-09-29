export interface SoundData {
    state: number;
    period: number;
    duration: number;
    volume: number;
    volEnv: number;
    toneEnv: number;
    noise: number;
}
export interface ToneEnvData1 {
    steps: number;
    diff: number;
    time: number;
    repeat: boolean;
}
export interface ToneEnvData2 {
    period: number;
    time: number;
}
export declare type ToneEnvData = ToneEnvData1 | ToneEnvData2;
export interface VolEnvData1 {
    steps: number;
    diff: number;
    time: number;
}
export interface VolEnvData2 {
    register: number;
    period: number;
}
export declare type VolEnvData = VolEnvData1 | VolEnvData2;
declare type AudioContextConstructorType = typeof window.AudioContext;
interface SoundOptions {
    AudioContextConstructor: AudioContextConstructorType;
}
export declare class Sound {
    private AudioContextConstructor;
    private isSoundOn;
    private isActivatedByUserFlag;
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
    reset(): void;
    private stopOscillator;
    private debugLog;
    resetQueue(): void;
    private createSoundContext;
    private playNoise;
    private applyVolEnv;
    private applyToneEnv;
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
    soundOn(): void;
    soundOff(): void;
}
export {};
//# sourceMappingURL=Sound.d.ts.map