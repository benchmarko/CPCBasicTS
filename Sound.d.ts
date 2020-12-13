export interface SoundData {
    iState: number;
    iPeriod: number;
    iDuration: number;
    iVolume: number;
    iVolEnv: number;
    iToneEnv: number;
    iNoise: number;
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
interface Queue {
    aSoundData: SoundData[];
    fNextNoteTime: number;
    bOnHold: boolean;
    iRendevousMask: number;
}
export declare class Sound {
    bIsSoundOn: boolean;
    bIsActivatedByUser: boolean;
    context?: AudioContext;
    oMergerNode?: ChannelMergerNode;
    aGainNodes: GainNode[];
    aOscillators: (OscillatorNode | undefined)[];
    aQueues: Queue[];
    fScheduleAheadTime: number;
    aVolEnv: VolEnvData[][];
    aToneEnv: ToneEnvData[][];
    iReleaseMask: number;
    aDebugLog?: [number, string][];
    constructor();
    init(): void;
    reset(): void;
    private stopOscillator;
    private debugLog;
    resetQueue(): void;
    private createSoundContext;
    private playNoise;
    private applyVolEnv;
    private applyToneEnv;
    private scheduleNote;
    testCanQueue(iState: number): boolean;
    sound(oSoundData: SoundData): void;
    setVolEnv(iVolEnv: number, aVolEnvData: VolEnvData[]): void;
    setToneEnv(iToneEnv: number, aToneEnvData: ToneEnvData[]): void;
    private updateQueueStatus;
    scheduler(): void;
    release(iReleaseMask: number): void;
    sq(n: number): number;
    setActivatedByUser(): void;
    isActivatedByUser(): boolean;
    soundOn(): void;
    soundOff(): void;
}
export {};
