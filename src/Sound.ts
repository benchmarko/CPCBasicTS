// Sound.ts - Sound output via WebAudio
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//

import { Utils } from "./Utils";

export interface SoundData {
	state: number,
	period: number,
	duration: number,
	volume: number,
	volEnv: number,
	toneEnv: number,
	noise: number
}

export interface ToneEnvData1 {
	steps: number,
	diff: number,
	time: number,
	repeat: boolean
}

export interface ToneEnvData2 {
	period: number,
	time: number
}

export type ToneEnvData = ToneEnvData1 | ToneEnvData2;

export interface VolEnvData1 {
	steps: number,
	diff: number,
	time: number
}

export interface VolEnvData2 {
	register: number,
	period: number
}

export type VolEnvData = VolEnvData1 | VolEnvData2;

type AudioContextConstructorType = typeof window.AudioContext;

interface SoundOptions {
	AudioContextConstructor: AudioContextConstructorType
}

interface Queue {
	soundData: SoundData[],
	fNextNoteTime: number,
	onHold: boolean,
	rendevousMask: number
}

export class Sound {
	private AudioContextConstructor: AudioContextConstructorType;
	private isSoundOn = false;
	private isActivatedByUserFlag = false;
	private context?: AudioContext;
	private mergerNode?: ChannelMergerNode;
	private readonly gainNodes: GainNode[] = [];
	private readonly oscillators: (OscillatorNode | undefined)[] = []; // 3 oscillators left, middle, right
	private readonly queues: Queue[] = []; // node queues and info for the three channels
	private fScheduleAheadTime = 0.1; // 100 ms
	private readonly volEnv: VolEnvData[][] = [];
	private readonly toneEnv: ToneEnvData[][] = [];
	private readonly debugLogList?: [number, string][];

	constructor(options: SoundOptions) {
		this.AudioContextConstructor = options.AudioContextConstructor;

		for (let i = 0; i < 3; i += 1) {
			this.queues[i] = {
				soundData: [],
				fNextNoteTime: 0,
				onHold: false,
				rendevousMask: 0
			};
		}

		if (Utils.debug > 1) {
			this.debugLogList = []; // access: cpcBasic.controller.sound.debugLog
		}
	}

	reset(): void {
		const oscillators = this.oscillators,
			volEnvData: VolEnvData1 = {
				steps: 1,
				diff: 0,
				time: 200
			};

		this.resetQueue();

		for (let i = 0; i < 3; i += 1) {
			if (oscillators[i]) {
				this.stopOscillator(i);
			}
		}

		this.volEnv.length = 0;
		this.setVolEnv(0, [volEnvData]); // set default ENV (should not be changed)

		this.toneEnv.length = 0;

		if (this.debugLogList) {
			this.debugLogList.length = 0;
		}
	}

	private stopOscillator(n: number) {
		const oscillators = this.oscillators;

		if (oscillators[n]) {
			const oscillatorNode = oscillators[n] as OscillatorNode;

			oscillatorNode.frequency.value = 0;
			oscillatorNode.stop();
			oscillatorNode.disconnect();
			oscillators[n] = undefined;
		}
	}

	private debugLog(msg: string) {
		if (this.debugLogList) {
			this.debugLogList.push([
				this.context ? this.context.currentTime : 0,
				msg
			]);
		}
	}

	resetQueue(): void {
		const queues = this.queues;

		for (let i = 0; i < queues.length; i += 1) {
			const queue = queues[i];

			queue.soundData.length = 0;
			queue.fNextNoteTime = 0;
			queue.onHold = false;
			queue.rendevousMask = 0;
		}
	}

	private createSoundContext() {
		const channelMap2Cpc = [ // channel map for CPC: left, middle (center), right; so swap middle and right
				0,
				2,
				1
			],
			//context = new window.AudioContext(), // may produce exception if not available
			context = new this.AudioContextConstructor(), // may produce exception if not available
			mergerNode = context.createChannelMerger(6); // create mergerNode with 6 inputs; we are using the first 3 for left, right, center

		this.context = context;
		this.mergerNode = mergerNode;

		for (let i = 0; i < 3; i += 1) {
			const gainNode = context.createGain();

			gainNode.connect(mergerNode, 0, channelMap2Cpc[i]); // connect output #0 of gainNode i to input #j of the mergerNode
			this.gainNodes[i] = gainNode;
		}
	}

	private playNoise(oscillator: number, fTime: number, fDuration: number, noise: number) { // could be improved
		const ctx = this.context as AudioContext,
			bufferSize = ctx.sampleRate * fDuration, // set the time of the note
			buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate), // create an empty buffer
			data = buffer.getChannelData(0), // get data
			noiseNode = ctx.createBufferSource(); // create a buffer source for noise data

		// fill the buffer with noise
		for (let i = 0; i < bufferSize; i += 1) {
			data[i] = Math.random() * 2 - 1;
		}

		noiseNode.buffer = buffer;

		if (noise > 1) {
			const bandHz = 20000 / noise,
				bandpass = ctx.createBiquadFilter();

			bandpass.type = "bandpass";
			bandpass.frequency.value = bandHz;
			// bandpass.Q.value = q; // ?
			noiseNode.connect(bandpass).connect(this.gainNodes[oscillator]);
		} else {
			noiseNode.connect(this.gainNodes[oscillator]);
		}
		noiseNode.start(fTime);
		noiseNode.stop(fTime + fDuration);
	}

	private applyVolEnv(volData: VolEnvData[], gain: AudioParam, fTime: number, volume: number, duration: number, volEnvRepeat: number) { // eslint-disable-line class-methods-use-this
		const maxVolume = 15,
			i100ms2sec = 100; // time duration unit: 1/100 sec=10 ms, convert to sec

		let time = 0;

		for (let loop = 0; loop < volEnvRepeat; loop += 1) {
			for (let part = 0; part < volData.length; part += 1) {
				const group = volData[part];

				if ((group as VolEnvData1).steps !== undefined) {
					const group1 = group as VolEnvData1,
						volDiff = group1.diff,
						volTime = group1.time;
					let volSteps = group1.steps;

					if (!volSteps) { // steps=0
						volSteps = 1;
						volume = 0; // we will set volDiff as absolute volume
					}
					for (let i = 0; i < volSteps; i += 1) {
						volume = (volume + volDiff) % (maxVolume + 1);
						const fVolume = volume / maxVolume;

						gain.setValueAtTime(fVolume * fVolume, fTime + time / i100ms2sec);
						time += volTime;
						if (duration && time >= duration) { // eslint-disable-line max-depth
							loop = volEnvRepeat; // stop early if longer than specified duration
							part = volData.length;
							break;
						}
					}
				} else { // register
					const group2 = group as VolEnvData2,
						register = group2.register,
						period = group2.period,
						volTime = period;

					if (register === 0) {
						volume = 15;
						let fVolume = volume / maxVolume;

						gain.setValueAtTime(fVolume * fVolume, fTime + time / i100ms2sec);
						time += volTime;
						fVolume = 0;
						gain.linearRampToValueAtTime(fVolume, fTime + time / i100ms2sec); // or: exponentialRampToValueAtTime?
					} else {
						// TODO: other registers
					}
				}
			}
		}
		if (duration === 0) {
			duration = time;
		}
		return duration;
	}

	private applyToneEnv(toneData: ToneEnvData[], frequency: AudioParam, fTime: number, period: number, duration: number) { // eslint-disable-line class-methods-use-this
		const i100ms2sec = 100, // time duration unit: 1/100 sec=10 ms, convert to sec
			repeat = toneData[0],
			toneEnvRepeat = repeat ? 5 : 1; // we use at most 5

		let time = 0;

		for (let loop = 0; loop < toneEnvRepeat; loop += 1) {
			for (let part = 0; part < toneData.length; part += 1) {
				const group = toneData[part];

				if ((group as ToneEnvData1).steps !== undefined) {
					const group1 = group as ToneEnvData1,
						toneSteps = group1.steps || 1, // steps 0 => 1
						toneDiff = group1.diff,
						toneTime = group1.time;

					for (let i = 0; i < toneSteps; i += 1) {
						const fFrequency = (period >= 3) ? 62500 / period : 0;

						frequency.setValueAtTime(fFrequency, fTime + time / i100ms2sec);
						period += toneDiff;
						time += toneTime;
						if (duration && time >= duration) { // eslint-disable-line max-depth
							loop = toneEnvRepeat; // stop early if longer than specified duration
							part = toneData.length;
							break;
						}
					}
				} else { // absolute period
					const group2 = group as ToneEnvData2,
						toneTime = group2.time;

					period = group2.period;

					const fFrequency = (period >= 3) ? 62500 / period : 0;

					frequency.setValueAtTime(fFrequency, fTime + time / i100ms2sec);
					// TODO
					time += toneTime;
					// frequency.linearRampToValueAtTime(fXXX, fTime + time / i100ms2sec); // or: exponentialRampToValueAtTime?
				}
			}
		}
	}

	private scheduleNote(oscillator: number, fTime: number, soundData: SoundData) {
		const maxVolume = 15,
			i100ms2sec = 100, // time duration unit: 1/100 sec=10 ms, convert to sec
			ctx = this.context as AudioContext,
			toneEnv = soundData.toneEnv;

		let volEnv = soundData.volEnv,
			volEnvRepeat = 1;

		if (Utils.debug > 1) {
			this.debugLog("scheduleNote: " + oscillator + " " + fTime);
		}
		const oscillatorNode = ctx.createOscillator();

		oscillatorNode.type = "square";

		oscillatorNode.frequency.value = (soundData.period >= 3) ? 62500 / soundData.period : 0;

		oscillatorNode.connect(this.gainNodes[oscillator]);
		if (fTime < ctx.currentTime) {
			if (Utils.debug) {
				Utils.console.debug("Test: sound: scheduleNote:", fTime, "<", ctx.currentTime);
			}
		}

		const volume = soundData.volume,
			gain = this.gainNodes[oscillator].gain,
			fVolume = volume / maxVolume;

		gain.setValueAtTime(fVolume * fVolume, fTime); // start volume

		let duration = soundData.duration;

		if (duration < 0) { // <0: repeat volume envelope?
			volEnvRepeat = Math.min(5, -duration); // we limit repeat to 5 times sice we precompute duration
			duration = 0;
		}

		if (volEnv || !duration) { // some volume envelope or duration 0?
			if (!this.volEnv[volEnv]) {
				volEnv = 0; // envelope not defined => use default envelope 0
			}
			duration = this.applyVolEnv(this.volEnv[volEnv], gain, fTime, volume, duration, volEnvRepeat);
		}

		if (toneEnv && this.toneEnv[toneEnv]) { // some tone envelope?
			this.applyToneEnv(this.toneEnv[toneEnv], oscillatorNode.frequency, fTime, soundData.period, duration);
		}

		const fDuration = duration / i100ms2sec;

		oscillatorNode.start(fTime);
		oscillatorNode.stop(fTime + fDuration);
		this.oscillators[oscillator] = oscillatorNode;

		if (soundData.noise) {
			this.playNoise(oscillator, fTime, fDuration, soundData.noise);
		}
		return fDuration;
	}

	testCanQueue(state: number): boolean {
		let canQueue = true;

		if (this.isSoundOn && !this.isActivatedByUserFlag) { // sound on but not yet activated? -> say cannot queue
			canQueue = false;
		/* eslint-disable no-bitwise */
		} else if (!(state & 0x80)) { // 0x80: flush
			const queues = this.queues;

			if ((state & 0x01 && queues[0].soundData.length >= 4)
				|| (state & 0x02 && queues[1].soundData.length >= 4)
				|| (state & 0x04 && queues[2].soundData.length >= 4)) {
				canQueue = false;
			}
		}
		/* eslint-enable no-bitwise */

		return canQueue;
	}

	sound(soundData: SoundData): void {
		if (!this.isSoundOn) {
			return;
		}

		const queues = this.queues,
			state = soundData.state;

		for (let i = 0; i < 3; i += 1) {
			if ((state >> i) & 0x01) { // eslint-disable-line no-bitwise
				const queue = queues[i];

				if (state & 0x80) { // eslint-disable-line no-bitwise
					queue.soundData.length = 0; // flush queue
					queue.fNextNoteTime = 0;
					this.stopOscillator(i);
				}
				queue.soundData.push(soundData); // just a reference
				if (Utils.debug > 1) {
					this.debugLog("sound: " + i + " " + state + ":" + queue.soundData.length);
				}
				this.updateQueueStatus(i, queue);
			}
		}
		this.scheduler(); // schedule early to allow SQ busy check immediately (can channels go out of sync by this?)
	}

	setVolEnv(volEnv: number, volEnvData: VolEnvData[]): void {
		this.volEnv[volEnv] = volEnvData;
	}

	setToneEnv(toneEnv: number, toneEnvData: ToneEnvData[]): void {
		this.toneEnv[toneEnv] = toneEnvData;
	}

	private updateQueueStatus(i: number, queue: Queue) { // eslint-disable-line class-methods-use-this
		const soundData = queue.soundData;

		if (soundData.length) {
			/* eslint-disable no-bitwise */
			queue.onHold = Boolean(soundData[0].state & 0x40); // check if next note on hold
			queue.rendevousMask = (soundData[0].state & 0x07); // get channel bits
			queue.rendevousMask &= ~(1 << i); // mask out our channel
			queue.rendevousMask |= (soundData[0].state >> 3) & 0x07; // and combine rendevous
			/* eslint-enable no-bitwise */
		} else {
			queue.onHold = false;
			queue.rendevousMask = 0;
		}
	}

	// idea from: https://www.html5rocks.com/en/tutorials/audio/scheduling/
	scheduler(): void {
		if (!this.isSoundOn) {
			return;
		}

		const context = this.context as AudioContext,
			fCurrentTime = context.currentTime,
			queues = this.queues;
		let canPlayMask = 0;

		for (let i = 0; i < 3; i += 1) {
			const queue = queues[i];

			while (queue.soundData.length && !queue.onHold && queue.fNextNoteTime < fCurrentTime + this.fScheduleAheadTime) { // something to schedule and not on hold and time reached
				if (!queue.rendevousMask) { // no rendevous needed, schedule now
					if (queue.fNextNoteTime < fCurrentTime) {
						queue.fNextNoteTime = fCurrentTime;
					}
					const soundData = queue.soundData.shift() as SoundData;

					queue.fNextNoteTime += this.scheduleNote(i, queue.fNextNoteTime, soundData);
					this.updateQueueStatus(i, queue); // check if next note on hold
				} else { // need rendevous
					canPlayMask |= (1 << i); // eslint-disable-line no-bitwise
					break;
				}
			}
		}

		if (!canPlayMask) { // no channel can play
			return;
		}

		for (let i = 0; i < 3; i += 1) {
			const queue = queues[i];

			// we can play, if in rendevous
			if ((canPlayMask >> i) & 0x01 && ((queue.rendevousMask & canPlayMask) === queue.rendevousMask)) { // eslint-disable-line no-bitwise
				if (queue.fNextNoteTime < fCurrentTime) {
					queue.fNextNoteTime = fCurrentTime;
				}
				const soundData = queue.soundData.shift() as SoundData;

				queue.fNextNoteTime += this.scheduleNote(i, queue.fNextNoteTime, soundData);
				this.updateQueueStatus(i, queue); // check if next note on hold
			}
		}
	}

	release(releaseMask: number): void {
		const queues = this.queues;

		if (!queues.length) {
			return;
		}

		if (Utils.debug > 1) {
			this.debugLog("release: " + releaseMask);
		}

		for (let i = 0; i < 3; i += 1) {
			const queue = queues[i],
				soundData = queue.soundData;

			if (((releaseMask >> i) & 0x01) && soundData.length && queue.onHold) { // eslint-disable-line no-bitwise
				queue.onHold = false; // release
			}
		}
		this.scheduler(); // extra schedule now so that following sound instructions are not releases early
	}

	sq(n: number): number {
		const queues = this.queues,
			queue = queues[n],
			soundData = queue.soundData,
			context = this.context as AudioContext;

		let sq = 4 - soundData.length;

		if (sq < 0) {
			sq = 0;
		}
		/* eslint-disable no-bitwise */
		sq |= (queue.rendevousMask << 3);
		if (this.oscillators[n] && queues[n].fNextNoteTime > context.currentTime) { // note still playing?
			sq |= 0x80; // eslint-disable-line no-bitwise
		} else if (soundData.length && (soundData[0].state & 0x40)) {
			sq |= 0x40;
		}

		/* eslint-enable no-bitwise */
		return sq;
	}

	setActivatedByUser(): void {
		this.isActivatedByUserFlag = true;
	}

	isActivatedByUser(): boolean {
		return this.isActivatedByUserFlag;
	}

	soundOn(): void {
		if (!this.isSoundOn) {
			if (!this.context) {
				this.createSoundContext();
			}
			const mergerNode = this.mergerNode as ChannelMergerNode,
				context = this.context as AudioContext;

			mergerNode.connect(context.destination);
			this.isSoundOn = true;
			if (Utils.debug) {
				Utils.console.debug("soundOn: Sound switched on");
			}
		}
	}

	soundOff(): void {
		if (this.isSoundOn) {
			const mergerNode = this.mergerNode as ChannelMergerNode,
				context = this.context as AudioContext;

			mergerNode.disconnect(context.destination);
			this.isSoundOn = false;
			if (Utils.debug) {
				Utils.console.debug("soundOff: Sound switched off");
			}
		}
	}
}
