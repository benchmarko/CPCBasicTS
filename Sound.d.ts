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
export declare class Sound {
    private bIsSoundOn;
    private bIsActivatedByUser;
    private context?;
    private oMergerNode?;
    private aGainNodes;
    private aOscillators;
    private aQueues;
    private fScheduleAheadTime;
    private aVolEnv;
    private aToneEnv;
    private aDebugLog?;
    constructor();
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
