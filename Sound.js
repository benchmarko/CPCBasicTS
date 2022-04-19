// Sound.ts - Sound output via WebAudio
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//
define(["require", "exports", "./Utils"], function (require, exports, Utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Sound = void 0;
    var Sound = /** @class */ (function () {
        function Sound() {
            this.isSoundOn = false;
            this.isActivatedByUserFlag = false;
            this.gainNodes = [];
            this.oscillators = []; // 3 oscillators left, middle, right
            this.queues = []; // node queues and info for the three channels
            this.fScheduleAheadTime = 0.1; // 100 ms
            this.volEnv = [];
            this.toneEnv = [];
            for (var i = 0; i < 3; i += 1) {
                this.queues[i] = {
                    soundData: [],
                    fNextNoteTime: 0,
                    onHold: false,
                    rendevousMask: 0
                };
            }
            if (Utils_1.Utils.debug > 1) {
                this.debugLogList = []; // access: cpcBasic.controller.sound.debugLog
            }
        }
        Sound.prototype.reset = function () {
            var oscillators = this.oscillators, volEnvData = {
                steps: 1,
                diff: 0,
                time: 200
            };
            this.resetQueue();
            for (var i = 0; i < 3; i += 1) {
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
        };
        Sound.prototype.stopOscillator = function (n) {
            var oscillators = this.oscillators;
            if (oscillators[n]) {
                var oscillatorNode = oscillators[n];
                oscillatorNode.frequency.value = 0;
                oscillatorNode.stop();
                oscillatorNode.disconnect();
                oscillators[n] = undefined;
            }
        };
        Sound.prototype.debugLog = function (msg) {
            if (this.debugLogList) {
                this.debugLogList.push([
                    this.context ? this.context.currentTime : 0,
                    msg
                ]);
            }
        };
        Sound.prototype.resetQueue = function () {
            var queues = this.queues;
            for (var i = 0; i < queues.length; i += 1) {
                var queue = queues[i];
                queue.soundData.length = 0;
                queue.fNextNoteTime = 0;
                queue.onHold = false;
                queue.rendevousMask = 0;
            }
        };
        Sound.prototype.createSoundContext = function () {
            var channelMap2Cpc = [
                0,
                2,
                1
            ], context = new window.AudioContext(), // may produce exception if not available
            mergerNode = context.createChannelMerger(6); // create mergerNode with 6 inputs; we are using the first 3 for left, right, center
            this.context = context;
            this.mergerNode = mergerNode;
            for (var i = 0; i < 3; i += 1) {
                var gainNode = context.createGain();
                gainNode.connect(mergerNode, 0, channelMap2Cpc[i]); // connect output #0 of gainNode i to input #j of the mergerNode
                this.gainNodes[i] = gainNode;
            }
        };
        Sound.prototype.playNoise = function (oscillator, fTime, fDuration, noise) {
            var ctx = this.context, bufferSize = ctx.sampleRate * fDuration, // set the time of the note
            buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate), // create an empty buffer
            data = buffer.getChannelData(0), // get data
            noiseNode = ctx.createBufferSource(); // create a buffer source for noise data
            // fill the buffer with noise
            for (var i = 0; i < bufferSize; i += 1) {
                data[i] = Math.random() * 2 - 1;
            }
            noiseNode.buffer = buffer;
            if (noise > 1) {
                var bandHz = 20000 / noise, bandpass = ctx.createBiquadFilter();
                bandpass.type = "bandpass";
                bandpass.frequency.value = bandHz;
                // bandpass.Q.value = q; // ?
                noiseNode.connect(bandpass).connect(this.gainNodes[oscillator]);
            }
            else {
                noiseNode.connect(this.gainNodes[oscillator]);
            }
            noiseNode.start(fTime);
            noiseNode.stop(fTime + fDuration);
        };
        Sound.prototype.applyVolEnv = function (volData, gain, fTime, volume, duration, volEnvRepeat) {
            var maxVolume = 15, i100ms2sec = 100; // time duration unit: 1/100 sec=10 ms, convert to sec
            var time = 0;
            for (var loop = 0; loop < volEnvRepeat; loop += 1) {
                for (var part = 0; part < volData.length; part += 1) {
                    var group = volData[part];
                    if (group.steps !== undefined) {
                        var group1 = group, volDiff = group1.diff, volTime = group1.time;
                        var volSteps = group1.steps;
                        if (!volSteps) { // steps=0
                            volSteps = 1;
                            volume = 0; // we will set volDiff as absolute volume
                        }
                        for (var i = 0; i < volSteps; i += 1) {
                            volume = (volume + volDiff) % (maxVolume + 1);
                            var fVolume = volume / maxVolume;
                            gain.setValueAtTime(fVolume * fVolume, fTime + time / i100ms2sec);
                            time += volTime;
                            if (duration && time >= duration) { // eslint-disable-line max-depth
                                loop = volEnvRepeat; // stop early if longer than specified duration
                                part = volData.length;
                                break;
                            }
                        }
                    }
                    else { // register
                        var group2 = group, register = group2.register, period = group2.period, volTime = period;
                        if (register === 0) {
                            volume = 15;
                            var fVolume = volume / maxVolume;
                            gain.setValueAtTime(fVolume * fVolume, fTime + time / i100ms2sec);
                            time += volTime;
                            fVolume = 0;
                            gain.linearRampToValueAtTime(fVolume, fTime + time / i100ms2sec); // or: exponentialRampToValueAtTime?
                        }
                        else {
                            // TODO: other registers
                        }
                    }
                }
            }
            if (duration === 0) {
                duration = time;
            }
            return duration;
        };
        Sound.prototype.applyToneEnv = function (toneData, frequency, fTime, period, duration) {
            var i100ms2sec = 100, // time duration unit: 1/100 sec=10 ms, convert to sec
            repeat = toneData[0], toneEnvRepeat = repeat ? 5 : 1; // we use at most 5
            var time = 0;
            for (var loop = 0; loop < toneEnvRepeat; loop += 1) {
                for (var part = 0; part < toneData.length; part += 1) {
                    var group = toneData[part];
                    if (group.steps !== undefined) {
                        var group1 = group, toneSteps = group1.steps || 1, // steps 0 => 1
                        toneDiff = group1.diff, toneTime = group1.time;
                        for (var i = 0; i < toneSteps; i += 1) {
                            var fFrequency = (period >= 3) ? 62500 / period : 0;
                            frequency.setValueAtTime(fFrequency, fTime + time / i100ms2sec);
                            period += toneDiff;
                            time += toneTime;
                            if (duration && time >= duration) { // eslint-disable-line max-depth
                                loop = toneEnvRepeat; // stop early if longer than specified duration
                                part = toneData.length;
                                break;
                            }
                        }
                    }
                    else { // absolute period
                        var group2 = group, toneTime = group2.time;
                        period = group2.period;
                        var fFrequency = (period >= 3) ? 62500 / period : 0;
                        frequency.setValueAtTime(fFrequency, fTime + time / i100ms2sec);
                        // TODO
                        time += toneTime;
                        // frequency.linearRampToValueAtTime(fXXX, fTime + time / i100ms2sec); // or: exponentialRampToValueAtTime?
                    }
                }
            }
        };
        Sound.prototype.scheduleNote = function (oscillator, fTime, soundData) {
            var maxVolume = 15, i100ms2sec = 100, // time duration unit: 1/100 sec=10 ms, convert to sec
            ctx = this.context, toneEnv = soundData.toneEnv;
            var volEnv = soundData.volEnv, volEnvRepeat = 1;
            if (Utils_1.Utils.debug > 1) {
                this.debugLog("scheduleNote: " + oscillator + " " + fTime);
            }
            var oscillatorNode = ctx.createOscillator();
            oscillatorNode.type = "square";
            oscillatorNode.frequency.value = (soundData.period >= 3) ? 62500 / soundData.period : 0;
            oscillatorNode.connect(this.gainNodes[oscillator]);
            if (fTime < ctx.currentTime) {
                Utils_1.Utils.console.log("TTT: scheduleNote:", fTime, "<", ctx.currentTime);
            }
            var volume = soundData.volume, gain = this.gainNodes[oscillator].gain, fVolume = volume / maxVolume;
            gain.setValueAtTime(fVolume * fVolume, fTime); // start volume
            var duration = soundData.duration;
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
            var fDuration = duration / i100ms2sec;
            oscillatorNode.start(fTime);
            oscillatorNode.stop(fTime + fDuration);
            this.oscillators[oscillator] = oscillatorNode;
            if (soundData.noise) {
                this.playNoise(oscillator, fTime, fDuration, soundData.noise);
            }
            return fDuration;
        };
        Sound.prototype.testCanQueue = function (state) {
            var canQueue = true;
            if (this.isSoundOn && !this.isActivatedByUserFlag) { // sound on but not yet activated? -> say cannot queue
                canQueue = false;
                /* eslint-disable no-bitwise */
            }
            else if (!(state & 0x80)) { // 0x80: flush
                var queues = this.queues;
                if ((state & 0x01 && queues[0].soundData.length >= 4)
                    || (state & 0x02 && queues[1].soundData.length >= 4)
                    || (state & 0x04 && queues[2].soundData.length >= 4)) {
                    canQueue = false;
                }
            }
            /* eslint-enable no-bitwise */
            return canQueue;
        };
        Sound.prototype.sound = function (soundData) {
            if (!this.isSoundOn) {
                return;
            }
            var queues = this.queues, state = soundData.state;
            for (var i = 0; i < 3; i += 1) {
                if ((state >> i) & 0x01) { // eslint-disable-line no-bitwise
                    var queue = queues[i];
                    if (state & 0x80) { // eslint-disable-line no-bitwise
                        queue.soundData.length = 0; // flush queue
                        queue.fNextNoteTime = 0;
                        this.stopOscillator(i);
                    }
                    queue.soundData.push(soundData); // just a reference
                    if (Utils_1.Utils.debug > 1) {
                        this.debugLog("sound: " + i + " " + state + ":" + queue.soundData.length);
                    }
                    this.updateQueueStatus(i, queue);
                }
            }
            this.scheduler(); // schedule early to allow SQ busy check immiediately (can channels go out of sync by this?)
        };
        Sound.prototype.setVolEnv = function (volEnv, volEnvData) {
            this.volEnv[volEnv] = volEnvData;
        };
        Sound.prototype.setToneEnv = function (toneEnv, toneEnvData) {
            this.toneEnv[toneEnv] = toneEnvData;
        };
        Sound.prototype.updateQueueStatus = function (i, queue) {
            var soundData = queue.soundData;
            if (soundData.length) {
                /* eslint-disable no-bitwise */
                queue.onHold = Boolean(soundData[0].state & 0x40); // check if next note on hold
                queue.rendevousMask = (soundData[0].state & 0x07); // get channel bits
                queue.rendevousMask &= ~(1 << i); // mask out our channel
                queue.rendevousMask |= (soundData[0].state >> 3) & 0x07; // and combine rendevous
                /* eslint-enable no-bitwise */
            }
            else {
                queue.onHold = false;
                queue.rendevousMask = 0;
            }
        };
        // idea from: https://www.html5rocks.com/en/tutorials/audio/scheduling/
        Sound.prototype.scheduler = function () {
            if (!this.isSoundOn) {
                return;
            }
            var context = this.context, fCurrentTime = context.currentTime, queues = this.queues;
            var canPlayMask = 0;
            for (var i = 0; i < 3; i += 1) {
                var queue = queues[i];
                while (queue.soundData.length && !queue.onHold && queue.fNextNoteTime < fCurrentTime + this.fScheduleAheadTime) { // something to schedule and not on hold and time reached
                    if (!queue.rendevousMask) { // no rendevous needed, schedule now
                        if (queue.fNextNoteTime < fCurrentTime) {
                            queue.fNextNoteTime = fCurrentTime;
                        }
                        var soundData = queue.soundData.shift();
                        queue.fNextNoteTime += this.scheduleNote(i, queue.fNextNoteTime, soundData);
                        this.updateQueueStatus(i, queue); // check if next note on hold
                    }
                    else { // need rendevous
                        canPlayMask |= (1 << i); // eslint-disable-line no-bitwise
                        break;
                    }
                }
            }
            if (!canPlayMask) { // no channel can play
                return;
            }
            for (var i = 0; i < 3; i += 1) {
                var queue = queues[i];
                // we can play, if in rendevous
                if ((canPlayMask >> i) & 0x01 && ((queue.rendevousMask & canPlayMask) === queue.rendevousMask)) { // eslint-disable-line no-bitwise
                    if (queue.fNextNoteTime < fCurrentTime) {
                        queue.fNextNoteTime = fCurrentTime;
                    }
                    var soundData = queue.soundData.shift();
                    queue.fNextNoteTime += this.scheduleNote(i, queue.fNextNoteTime, soundData);
                    this.updateQueueStatus(i, queue); // check if next note on hold
                }
            }
        };
        Sound.prototype.release = function (releaseMask) {
            var queues = this.queues;
            if (!queues.length) {
                return;
            }
            if (Utils_1.Utils.debug > 1) {
                this.debugLog("release: " + releaseMask);
            }
            for (var i = 0; i < 3; i += 1) {
                var queue = queues[i], soundData = queue.soundData;
                if (((releaseMask >> i) & 0x01) && soundData.length && queue.onHold) { // eslint-disable-line no-bitwise
                    queue.onHold = false; // release
                }
            }
            this.scheduler(); // extra schedule now so that following sound instructions are not releases early
        };
        Sound.prototype.sq = function (n) {
            var queues = this.queues, queue = queues[n], soundData = queue.soundData, context = this.context;
            var sq = 4 - soundData.length;
            if (sq < 0) {
                sq = 0;
            }
            /* eslint-disable no-bitwise */
            sq |= (queue.rendevousMask << 3);
            if (this.oscillators[n] && queues[n].fNextNoteTime > context.currentTime) { // note still playing?
                sq |= 0x80; // eslint-disable-line no-bitwise
            }
            else if (soundData.length && (soundData[0].state & 0x40)) {
                sq |= 0x40;
            }
            /* eslint-enable no-bitwise */
            return sq;
        };
        Sound.prototype.setActivatedByUser = function () {
            this.isActivatedByUserFlag = true;
        };
        Sound.prototype.isActivatedByUser = function () {
            return this.isActivatedByUserFlag;
        };
        Sound.prototype.soundOn = function () {
            if (!this.isSoundOn) {
                if (!this.context) {
                    this.createSoundContext();
                }
                var mergerNode = this.mergerNode, context = this.context;
                mergerNode.connect(context.destination);
                this.isSoundOn = true;
                Utils_1.Utils.console.log("soundOn: Sound switched on");
            }
        };
        Sound.prototype.soundOff = function () {
            if (this.isSoundOn) {
                var mergerNode = this.mergerNode, context = this.context;
                mergerNode.disconnect(context.destination);
                this.isSoundOn = false;
                Utils_1.Utils.console.log("soundOff: Sound switched off");
            }
        };
        return Sound;
    }());
    exports.Sound = Sound;
});
//# sourceMappingURL=Sound.js.map