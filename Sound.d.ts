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
    stopOscillator(n: number): void;
    debugLog(sMsg: string): void;
    resetQueue(): void;
    createSoundContext(): void;
    playNoise(iOscillator: number, fTime: number, fDuration: number, iNoise: number): void;
    applyVolEnv(aVolData: VolEnvData[], oGain: AudioParam, fTime: number, iVolume: number, iDuration: number, iVolEnvRepeat: number): number;
    applyToneEnv(aToneData: ToneEnvData[], oFrequency: AudioParam, fTime: number, iPeriod: number, iDuration: number): void;
    scheduleNote(iOscillator: number, fTime: number, oSoundData: SoundData): number;
    testCanQueue(iState: number): boolean;
    sound(oSoundData: SoundData): void;
    setVolEnv(iVolEnv: number, aVolEnvData: VolEnvData[]): void;
    setToneEnv(iToneEnv: number, aToneEnvData: ToneEnvData[]): void;
    updateQueueStatus(i: number, oQueue: Queue): void;
    scheduler(): void;
    release(iReleaseMask: number): void;
    sq(n: number): number;
    isSoundOn(): boolean;
    setActivatedByUser(): void;
    isActivatedByUser(): boolean;
    soundOn(): void;
    soundOff(): void;
}
export {};
