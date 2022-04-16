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
            this.bIsSoundOn = false;
            this.bIsActivatedByUser = false;
            this.aGainNodes = [];
            this.aOscillators = []; // 3 oscillators left, middle, right
            this.aQueues = []; // node queues and info for the three channels
            this.fScheduleAheadTime = 0.1; // 100 ms
            this.aVolEnv = [];
            this.aToneEnv = [];
            for (var i = 0; i < 3; i += 1) {
                this.aQueues[i] = {
                    aSoundData: [],
                    fNextNoteTime: 0,
                    bOnHold: false,
                    iRendevousMask: 0
                };
            }
            if (Utils_1.Utils.debug > 1) {
                this.aDebugLog = []; // access: cpcBasic.controller.oSound.aDebugLog
            }
        }
        Sound.prototype.reset = function () {
            var aOscillators = this.aOscillators, oVolEnvData = {
                steps: 1,
                diff: 0,
                time: 200
            };
            this.resetQueue();
            for (var i = 0; i < 3; i += 1) {
                if (aOscillators[i]) {
                    this.stopOscillator(i);
                }
            }
            this.aVolEnv.length = 0;
            this.setVolEnv(0, [oVolEnvData]); // set default ENV (should not be changed)
            this.aToneEnv.length = 0;
            if (this.aDebugLog) {
                this.aDebugLog.length = 0;
            }
        };
        Sound.prototype.stopOscillator = function (n) {
            var aOscillators = this.aOscillators;
            if (aOscillators[n]) {
                var oOscillatorNode = aOscillators[n];
                oOscillatorNode.frequency.value = 0;
                oOscillatorNode.stop();
                oOscillatorNode.disconnect();
                aOscillators[n] = undefined;
            }
        };
        Sound.prototype.debugLog = function (sMsg) {
            if (this.aDebugLog) {
                this.aDebugLog.push([
                    this.context ? this.context.currentTime : 0,
                    sMsg
                ]);
            }
        };
        Sound.prototype.resetQueue = function () {
            var aQueues = this.aQueues;
            for (var i = 0; i < aQueues.length; i += 1) {
                var oQueue = aQueues[i];
                oQueue.aSoundData.length = 0;
                oQueue.fNextNoteTime = 0;
                oQueue.bOnHold = false;
                oQueue.iRendevousMask = 0;
            }
        };
        Sound.prototype.createSoundContext = function () {
            var aChannelMap2Cpc = [
                0,
                2,
                1
            ], context = new window.AudioContext(), // may produce exception if not available
            oMergerNode = context.createChannelMerger(6); // create mergerNode with 6 inputs; we are using the first 3 for left, right, center
            this.context = context;
            this.oMergerNode = oMergerNode;
            for (var i = 0; i < 3; i += 1) {
                var oGainNode = context.createGain();
                oGainNode.connect(oMergerNode, 0, aChannelMap2Cpc[i]); // connect output #0 of gainNode i to input #j of the mergerNode
                this.aGainNodes[i] = oGainNode;
            }
        };
        Sound.prototype.playNoise = function (iOscillator, fTime, fDuration, iNoise) {
            var ctx = this.context, bufferSize = ctx.sampleRate * fDuration, // set the time of the note
            buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate), // create an empty buffer
            data = buffer.getChannelData(0), // get data
            noise = ctx.createBufferSource(); // create a buffer source for noise data
            // fill the buffer with noise
            for (var i = 0; i < bufferSize; i += 1) {
                data[i] = Math.random() * 2 - 1;
            }
            noise.buffer = buffer;
            if (iNoise > 1) {
                var bandHz = 20000 / iNoise, bandpass = ctx.createBiquadFilter();
                bandpass.type = "bandpass";
                bandpass.frequency.value = bandHz;
                // bandpass.Q.value = q; // ?
                noise.connect(bandpass).connect(this.aGainNodes[iOscillator]);
            }
            else {
                noise.connect(this.aGainNodes[iOscillator]);
            }
            noise.start(fTime);
            noise.stop(fTime + fDuration);
        };
        Sound.prototype.applyVolEnv = function (aVolData, oGain, fTime, iVolume, iDuration, iVolEnvRepeat) {
            var iMaxVolume = 15, i100ms2sec = 100; // time duration unit: 1/100 sec=10 ms, convert to sec
            var iTime = 0;
            for (var iLoop = 0; iLoop < iVolEnvRepeat; iLoop += 1) {
                for (var iPart = 0; iPart < aVolData.length; iPart += 1) {
                    var oGroup = aVolData[iPart];
                    if (oGroup.steps !== undefined) {
                        var oGroup1 = oGroup, iVolDiff = oGroup1.diff, iVolTime = oGroup1.time;
                        var iVolSteps = oGroup1.steps;
                        if (!iVolSteps) { // steps=0
                            iVolSteps = 1;
                            iVolume = 0; // we will set iVolDiff as absolute volume
                        }
                        for (var i = 0; i < iVolSteps; i += 1) {
                            iVolume = (iVolume + iVolDiff) % (iMaxVolume + 1);
                            var fVolume = iVolume / iMaxVolume;
                            oGain.setValueAtTime(fVolume * fVolume, fTime + iTime / i100ms2sec);
                            iTime += iVolTime;
                            if (iDuration && iTime >= iDuration) { // eslint-disable-line max-depth
                                iLoop = iVolEnvRepeat; // stop early if longer than specified duration
                                iPart = aVolData.length;
                                break;
                            }
                        }
                    }
                    else { // register
                        var oGroup2 = oGroup, iRegister = oGroup2.register, iPeriod = oGroup2.period, iVolTime = iPeriod;
                        if (iRegister === 0) {
                            iVolume = 15;
                            var fVolume = iVolume / iMaxVolume;
                            oGain.setValueAtTime(fVolume * fVolume, fTime + iTime / i100ms2sec);
                            iTime += iVolTime;
                            fVolume = 0;
                            oGain.linearRampToValueAtTime(fVolume, fTime + iTime / i100ms2sec); // or: exponentialRampToValueAtTime?
                        }
                        else {
                            // TODO: other registers
                        }
                    }
                }
            }
            if (iDuration === 0) {
                iDuration = iTime;
            }
            return iDuration;
        };
        Sound.prototype.applyToneEnv = function (aToneData, oFrequency, fTime, iPeriod, iDuration) {
            var i100ms2sec = 100, // time duration unit: 1/100 sec=10 ms, convert to sec
            bRepeat = aToneData[0], iToneEnvRepeat = bRepeat ? 5 : 1; // we use at most 5
            var iTime = 0;
            for (var iLoop = 0; iLoop < iToneEnvRepeat; iLoop += 1) {
                for (var iPart = 0; iPart < aToneData.length; iPart += 1) {
                    var oGroup = aToneData[iPart];
                    if (oGroup.steps !== undefined) {
                        var oGroup1 = oGroup, iToneSteps = oGroup1.steps || 1, // steps 0 => 1
                        iToneDiff = oGroup1.diff, iToneTime = oGroup1.time;
                        for (var i = 0; i < iToneSteps; i += 1) {
                            var fFrequency = (iPeriod >= 3) ? 62500 / iPeriod : 0;
                            oFrequency.setValueAtTime(fFrequency, fTime + iTime / i100ms2sec);
                            iPeriod += iToneDiff;
                            iTime += iToneTime;
                            if (iDuration && iTime >= iDuration) { // eslint-disable-line max-depth
                                iLoop = iToneEnvRepeat; // stop early if longer than specified duration
                                iPart = aToneData.length;
                                break;
                            }
                        }
                    }
                    else { // absolute period
                        var oGroup2 = oGroup, iToneTime = oGroup2.time;
                        iPeriod = oGroup2.period;
                        var fFrequency = (iPeriod >= 3) ? 62500 / iPeriod : 0;
                        oFrequency.setValueAtTime(fFrequency, fTime + iTime / i100ms2sec);
                        // TODO
                        iTime += iToneTime;
                        // oFrequency.linearRampToValueAtTime(fXXX, fTime + iTime / i100ms2sec); // or: exponentialRampToValueAtTime?
                    }
                }
            }
        };
        Sound.prototype.scheduleNote = function (iOscillator, fTime, oSoundData) {
            var iMaxVolume = 15, i100ms2sec = 100, // time duration unit: 1/100 sec=10 ms, convert to sec
            ctx = this.context, iToneEnv = oSoundData.iToneEnv;
            var iVolEnv = oSoundData.iVolEnv, iVolEnvRepeat = 1;
            if (Utils_1.Utils.debug > 1) {
                this.debugLog("scheduleNote: " + iOscillator + " " + fTime);
            }
            var oOscillator = ctx.createOscillator();
            oOscillator.type = "square";
            oOscillator.frequency.value = (oSoundData.iPeriod >= 3) ? 62500 / oSoundData.iPeriod : 0;
            oOscillator.connect(this.aGainNodes[iOscillator]);
            if (fTime < ctx.currentTime) {
                Utils_1.Utils.console.log("TTT: scheduleNote:", fTime, "<", ctx.currentTime);
            }
            var iVolume = oSoundData.iVolume, oGain = this.aGainNodes[iOscillator].gain, fVolume = iVolume / iMaxVolume;
            oGain.setValueAtTime(fVolume * fVolume, fTime); // start volume
            var iDuration = oSoundData.iDuration;
            if (iDuration < 0) { // <0: repeat volume envelope?
                iVolEnvRepeat = Math.min(5, -iDuration); // we limit repeat to 5 times sice we precompute duration
                iDuration = 0;
            }
            if (iVolEnv || !iDuration) { // some volume envelope or duration 0?
                if (!this.aVolEnv[iVolEnv]) {
                    iVolEnv = 0; // envelope not defined => use default envelope 0
                }
                iDuration = this.applyVolEnv(this.aVolEnv[iVolEnv], oGain, fTime, iVolume, iDuration, iVolEnvRepeat);
            }
            if (iToneEnv && this.aToneEnv[iToneEnv]) { // some tone envelope?
                this.applyToneEnv(this.aToneEnv[iToneEnv], oOscillator.frequency, fTime, oSoundData.iPeriod, iDuration);
            }
            var fDuration = iDuration / i100ms2sec;
            oOscillator.start(fTime);
            oOscillator.stop(fTime + fDuration);
            this.aOscillators[iOscillator] = oOscillator;
            if (oSoundData.iNoise) {
                this.playNoise(iOscillator, fTime, fDuration, oSoundData.iNoise);
            }
            return fDuration;
        };
        Sound.prototype.testCanQueue = function (iState) {
            var bCanQueue = true;
            if (this.bIsSoundOn && !this.bIsActivatedByUser) { // sound on but not yet activated? -> say cannot queue
                bCanQueue = false;
                /* eslint-disable no-bitwise */
            }
            else if (!(iState & 0x80)) { // 0x80: flush
                var aQueues = this.aQueues;
                if ((iState & 0x01 && aQueues[0].aSoundData.length >= 4)
                    || (iState & 0x02 && aQueues[1].aSoundData.length >= 4)
                    || (iState & 0x04 && aQueues[2].aSoundData.length >= 4)) {
                    bCanQueue = false;
                }
            }
            /* eslint-enable no-bitwise */
            return bCanQueue;
        };
        Sound.prototype.sound = function (oSoundData) {
            if (!this.bIsSoundOn) {
                return;
            }
            var aQueues = this.aQueues, iState = oSoundData.iState;
            for (var i = 0; i < 3; i += 1) {
                if ((iState >> i) & 0x01) { // eslint-disable-line no-bitwise
                    var oQueue = aQueues[i];
                    if (iState & 0x80) { // eslint-disable-line no-bitwise
                        oQueue.aSoundData.length = 0; // flush queue
                        oQueue.fNextNoteTime = 0;
                        this.stopOscillator(i);
                    }
                    oQueue.aSoundData.push(oSoundData); // just a reference
                    if (Utils_1.Utils.debug > 1) {
                        this.debugLog("sound: " + i + " " + iState + ":" + oQueue.aSoundData.length);
                    }
                    this.updateQueueStatus(i, oQueue);
                }
            }
            this.scheduler(); // schedule early to allow SQ busy check immiediately (can channels go out of sync by this?)
        };
        Sound.prototype.setVolEnv = function (iVolEnv, aVolEnvData) {
            this.aVolEnv[iVolEnv] = aVolEnvData;
        };
        Sound.prototype.setToneEnv = function (iToneEnv, aToneEnvData) {
            this.aToneEnv[iToneEnv] = aToneEnvData;
        };
        Sound.prototype.updateQueueStatus = function (i, oQueue) {
            var aSoundData = oQueue.aSoundData;
            if (aSoundData.length) {
                /* eslint-disable no-bitwise */
                oQueue.bOnHold = Boolean(aSoundData[0].iState & 0x40); // check if next note on hold
                oQueue.iRendevousMask = (aSoundData[0].iState & 0x07); // get channel bits
                oQueue.iRendevousMask &= ~(1 << i); // mask out our channel
                oQueue.iRendevousMask |= (aSoundData[0].iState >> 3) & 0x07; // and combine rendevous
                /* eslint-enable no-bitwise */
            }
            else {
                oQueue.bOnHold = false;
                oQueue.iRendevousMask = 0;
            }
        };
        // idea from: https://www.html5rocks.com/en/tutorials/audio/scheduling/
        Sound.prototype.scheduler = function () {
            if (!this.bIsSoundOn) {
                return;
            }
            var oContext = this.context, fCurrentTime = oContext.currentTime, aQueues = this.aQueues;
            var iCanPlayMask = 0;
            for (var i = 0; i < 3; i += 1) {
                var oQueue = aQueues[i];
                while (oQueue.aSoundData.length && !oQueue.bOnHold && oQueue.fNextNoteTime < fCurrentTime + this.fScheduleAheadTime) { // something to schedule and not on hold and time reached
                    if (!oQueue.iRendevousMask) { // no rendevous needed, schedule now
                        if (oQueue.fNextNoteTime < fCurrentTime) {
                            oQueue.fNextNoteTime = fCurrentTime;
                        }
                        var oSoundData = oQueue.aSoundData.shift();
                        oQueue.fNextNoteTime += this.scheduleNote(i, oQueue.fNextNoteTime, oSoundData);
                        this.updateQueueStatus(i, oQueue); // check if next note on hold
                    }
                    else { // need rendevous
                        iCanPlayMask |= (1 << i); // eslint-disable-line no-bitwise
                        break;
                    }
                }
            }
            if (!iCanPlayMask) { // no channel can play
                return;
            }
            for (var i = 0; i < 3; i += 1) {
                var oQueue = aQueues[i];
                // we can play, if in rendevous
                if ((iCanPlayMask >> i) & 0x01 && ((oQueue.iRendevousMask & iCanPlayMask) === oQueue.iRendevousMask)) { // eslint-disable-line no-bitwise
                    if (oQueue.fNextNoteTime < fCurrentTime) {
                        oQueue.fNextNoteTime = fCurrentTime;
                    }
                    var oSoundData = oQueue.aSoundData.shift();
                    oQueue.fNextNoteTime += this.scheduleNote(i, oQueue.fNextNoteTime, oSoundData);
                    this.updateQueueStatus(i, oQueue); // check if next note on hold
                }
            }
        };
        Sound.prototype.release = function (iReleaseMask) {
            var aQueues = this.aQueues;
            if (!aQueues.length) {
                return;
            }
            if (Utils_1.Utils.debug > 1) {
                this.debugLog("release: " + iReleaseMask);
            }
            for (var i = 0; i < 3; i += 1) {
                var oQueue = aQueues[i], aSoundData = oQueue.aSoundData;
                if (((iReleaseMask >> i) & 0x01) && aSoundData.length && oQueue.bOnHold) { // eslint-disable-line no-bitwise
                    oQueue.bOnHold = false; // release
                }
            }
            this.scheduler(); // extra schedule now so that following sound instructions are not releases early
        };
        Sound.prototype.sq = function (n) {
            var aQueues = this.aQueues, oQueue = aQueues[n], aSoundData = oQueue.aSoundData, oContext = this.context;
            var iSq = 4 - aSoundData.length;
            if (iSq < 0) {
                iSq = 0;
            }
            /* eslint-disable no-bitwise */
            iSq |= (oQueue.iRendevousMask << 3);
            if (this.aOscillators[n] && aQueues[n].fNextNoteTime > oContext.currentTime) { // note still playing?
                iSq |= 0x80; // eslint-disable-line no-bitwise
            }
            else if (aSoundData.length && (aSoundData[0].iState & 0x40)) {
                iSq |= 0x40;
            }
            /* eslint-enable no-bitwise */
            return iSq;
        };
        Sound.prototype.setActivatedByUser = function () {
            this.bIsActivatedByUser = true;
        };
        Sound.prototype.isActivatedByUser = function () {
            return this.bIsActivatedByUser;
        };
        Sound.prototype.soundOn = function () {
            if (!this.bIsSoundOn) {
                if (!this.context) {
                    this.createSoundContext();
                }
                var oMergerNode = this.oMergerNode, oContext = this.context;
                oMergerNode.connect(oContext.destination);
                this.bIsSoundOn = true;
                Utils_1.Utils.console.log("soundOn: Sound switched on");
            }
        };
        Sound.prototype.soundOff = function () {
            if (this.bIsSoundOn) {
                var oMergerNode = this.oMergerNode, oContext = this.context;
                oMergerNode.disconnect(oContext.destination);
                this.bIsSoundOn = false;
                Utils_1.Utils.console.log("soundOff: Sound switched off");
            }
        };
        return Sound;
    }());
    exports.Sound = Sound;
});
//# sourceMappingURL=Sound.js.map