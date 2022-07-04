// CpcVm.ts - CPC Virtual Machine
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//
define(["require", "exports", "./Utils", "./Random"], function (require, exports, Utils_1, Random_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CpcVm = void 0;
    var CpcVm = /** @class */ (function () {
        function CpcVm(options) {
            this.quiet = false;
            this.inkeyTimeMs = 0; // next time of frame fly (if >0, next time when inkey$ can be checked without inserting "waitFrame")
            this.gosubStack = []; // stack of line numbers for gosub/return
            this.maxGosubStackLength = 83; // maximum nesting of GOSUB on a real CPC
            this.dataIndex = 0; // current index
            this.dataLineIndex = {
                0: 0 // for line 0: index 0
            };
            this.crtcReg = 0;
            this.printControlBuf = "";
            this.startTime = 0;
            this.lastRnd = 0; // last random number
            this.nextFrameTime = 0;
            this.stopCount = 0;
            this.line = 0;
            this.startLine = 0;
            this.errorGotoLine = 0;
            this.errorResumeLine = 0;
            this.breakGosubLine = 0;
            this.breakResumeLine = 0;
            this.outBuffer = "";
            this.errorCode = 0; // last error code (Err)
            this.errorLine = 0; // line of last error (Erl)
            this.degFlag = false; // degree or radians
            this.tronFlag1 = false; // trace flag
            this.tronLine = 0; // last trace line
            this.ramSelect = 0;
            this.screenPage = 3; // 16K screen page, 3=0xc000..0xffff
            this.minCharHimem = CpcVm.maxHimem;
            this.maxCharHimem = CpcVm.maxHimem;
            this.himemValue = CpcVm.maxHimem;
            this.minCustomChar = 256;
            this.timerPriority = -1; // priority of running task: -1=low (min priority to start new timers)
            this.zoneValue = 13; // print tab zone value
            this.modeValue = -1;
            /* eslint-disable no-invalid-this */
            this.vmInternal = {
                getTimerList: this.vmTestGetTimerList,
                getWindowDataList: this.vmTestGetWindowDataList
            };
            this.fnOpeninHandler = this.vmOpeninCallback.bind(this);
            this.fnCloseinHandler = this.vmCloseinCallback.bind(this);
            this.fnCloseoutHandler = this.vmCloseoutCallback.bind(this);
            this.fnLoadHandler = this.vmLoadCallback.bind(this);
            this.fnRunHandler = this.vmRunCallback.bind(this);
            this.canvas = options.canvas;
            this.keyboard = options.keyboard;
            this.soundClass = options.sound;
            this.variables = options.variables;
            this.tronFlag = options.tron;
            this.quiet = options.quiet || false;
            this.random = new Random_1.Random();
            this.stopEntry = {
                reason: "",
                priority: 0,
                paras: {}
            };
            this.inputValues = []; // values to input into script
            this.inFile = {
                open: false,
                command: "",
                name: "",
                line: 0,
                start: 0,
                fileData: [],
                fnFileCallback: undefined,
                first: 0,
                last: 0,
                memorizedExample: ""
            };
            this.outFile = {
                open: false,
                command: "",
                name: "",
                line: 0,
                start: 0,
                fileData: [],
                fnFileCallback: undefined,
                stream: 0,
                typeString: "",
                length: 0,
                entry: 0
            }; // file handling
            // "open": File open flag
            // "command": Command that started the file open (in: chain, chainMerge, load, merge, openin, run; out: save, openput)
            // "name": File name
            // "type": File type: A, B, P, T
            // "start": start address of data
            // "length": length of data
            // "entry": entry address (save)
            // "line": ?
            // "fileData": File contents for (LINE) INPUT #9; PRINT #9, WRITE #9
            // "fnFileCallback": Callback for stop reason "fileLoad", "fileSave"
            // "line": run line (CHAIN, CHAIN MERGE)
            // "first": first line to delete (CHAIN MERGE)
            // "last": last line to delete (CHAIN MERGE)
            this.gosubStack = []; // stack of line numbers for gosub/return
            this.mem = []; // for peek, poke
            this.dataList = []; // array for BASIC data lines (continuous)
            this.windowDataList = []; // window data for window 0..7,8,9
            for (var i = 0; i < CpcVm.streamCount; i += 1) {
                this.windowDataList[i] = {};
            }
            this.timerList = []; // BASIC timer 0..3 (3 has highest priority)
            for (var i = 0; i < CpcVm.timerCount; i += 1) {
                this.timerList[i] = {};
            }
            this.soundData = [];
            this.sqTimer = []; // Sound queue timer 0..2
            for (var i = 0; i < CpcVm.sqTimerCount; i += 1) {
                this.sqTimer[i] = {};
            }
            this.crtcData = [];
        }
        CpcVm.prototype.vmSetRsxClass = function (rsx) {
            this.rsx = rsx; // this.rsx just used in the script
        };
        CpcVm.prototype.vmReset = function () {
            this.startTime = Date.now();
            this.random.init();
            this.lastRnd = 0;
            this.nextFrameTime = Date.now() + CpcVm.frameTimeMs; // next time of frame fly
            this.stopCount = 0;
            this.line = 0; // current line number (or label)
            this.startLine = 0; // line to start
            this.errorGotoLine = 0;
            this.errorResumeLine = 0;
            this.breakGosubLine = 0;
            this.breakResumeLine = 0;
            this.inputValues.length = 0;
            CpcVm.vmResetFileHandling(this.inFile);
            CpcVm.vmResetFileHandling(this.outFile);
            this.vmResetControlBuffer();
            this.outBuffer = ""; // console output
            this.vmStop("", 0, true);
            this.vmResetData();
            this.errorCode = 0; // last error code
            this.errorLine = 0; // line of last error
            this.gosubStack.length = 0;
            this.degFlag = false; // degree or radians
            this.tronFlag1 = this.tronFlag || false; // trace flag
            this.tronLine = 0; // last trace line
            this.mem.length = 0; // clear memory (for PEEK, POKE)
            this.ramSelect = 0; // for banking with 16K banks in the range 0x4000-0x7fff (0=default; 1...=additional)
            this.screenPage = 3; // 16K screen page, 3=0xc000..0xffff
            this.crtcReg = 0;
            this.crtcData.length = 0;
            this.minCharHimem = CpcVm.maxHimem;
            this.maxCharHimem = CpcVm.maxHimem;
            this.himemValue = CpcVm.maxHimem;
            this.minCustomChar = 256;
            this.symbolAfter(240); // set also minCustomChar
            this.vmResetTimers();
            this.timerPriority = -1; // priority of running task: -1=low (min priority to start new timers)
            this.zoneValue = 13; // print tab zone value
            this.defreal("a-z"); // init vartypes
            this.modeValue = -1;
            this.vmResetWindowData(true); // reset all, including pen and paper
            this.width(132); // set default printer width
            this.mode(1); // including vmResetWindowData() without pen and paper
            this.canvas.reset();
            this.keyboard.reset();
            this.soundClass.reset();
            this.soundData.length = 0;
            this.inkeyTimeMs = 0; // if >0, next time when inkey$ can be checked without inserting "waitFrame"
        };
        CpcVm.prototype.vmResetTimers = function () {
            var data = {
                line: 0,
                repeat: false,
                intervalMs: 0,
                active: false,
                nextTimeMs: 0,
                handlerRunning: false,
                stackIndexReturn: 0,
                savedPriority: 0 // priority befora calling the handler
            }, timer = this.timerList, sqTimer = this.sqTimer;
            for (var i = 0; i < CpcVm.timerCount; i += 1) {
                Object.assign(timer[i], data);
            }
            // sound queue timer
            for (var i = 0; i < CpcVm.sqTimerCount; i += 1) {
                Object.assign(sqTimer[i], data);
            }
        };
        CpcVm.prototype.vmResetWindowData = function (resetPenPaper) {
            var winData = CpcVm.winData[this.modeValue], data = {
                pos: 0,
                vpos: 0,
                textEnabled: true,
                tag: false,
                transparent: false,
                cursorOn: false,
                cursorEnabled: true // user switch
            }, penPaperData = {
                pen: 1,
                paper: 0
            }, printData = {
                pos: 0,
                vpos: 0,
                right: 132 // override
            }, cassetteData = {
                pos: 0,
                vpos: 0,
                right: 255 // override
            };
            if (resetPenPaper) {
                Object.assign(data, penPaperData);
            }
            for (var i = 0; i < this.windowDataList.length - 2; i += 1) { // for window streams
                Object.assign(this.windowDataList[i], winData, data);
            }
            Object.assign(this.windowDataList[8], winData, printData); // printer
            Object.assign(this.windowDataList[9], winData, cassetteData); // cassette
        };
        /*
        vmTestGetWindowData(stream: number): WindowData {
            return this.windowDataList[stream];
        }
    
        vmTestGetTimerEntry(timer: number): TimerEntry {
            return this.timerList[timer];
        }
        */
        /*
        private testPrivateProperties: Record<string, any> = {
            windowDataList0: this.windowDataList
        }
        */
        /*
        vmTestGetProperty(name: string): any {
            return (this as any)[name];
        }
    
        vmTestSetProperty(name: string, value: any): any {
            (this as any)[name] = value;
        }
        */
        CpcVm.prototype.vmResetControlBuffer = function () {
            this.printControlBuf = ""; // collected control characters for PRINT
        };
        CpcVm.vmResetFileHandling = function (file) {
            file.open = false;
            file.command = ""; // to be sure
        };
        CpcVm.prototype.vmResetData = function () {
            this.dataList.length = 0; // array for BASIC data lines (continuous)
            this.dataIndex = 0; // current index
            this.dataLineIndex = {
                0: 0 // for line 0: index 0
            };
        };
        CpcVm.prototype.vmResetInks = function () {
            this.canvas.setDefaultInks();
            this.canvas.setSpeedInk(10, 10);
        };
        CpcVm.prototype.vmReset4Run = function () {
            var stream = 0;
            this.vmResetInks();
            this.clearInput();
            this.closein();
            this.closeout();
            this.cursor(stream, 0);
        };
        CpcVm.prototype.vmGetAllVariables = function () {
            return this.variables.getAllVariables();
        };
        CpcVm.prototype.vmSetStartLine = function (line) {
            this.startLine = line;
        };
        CpcVm.prototype.vmOnBreakContSet = function () {
            return this.breakGosubLine < 0; // on break cont
        };
        CpcVm.prototype.vmOnBreakHandlerActive = function () {
            return this.breakResumeLine;
        };
        CpcVm.prototype.vmEscape = function () {
            var stop = true;
            if (this.breakGosubLine > 0) { // on break gosub n
                if (!this.breakResumeLine) { // do not nest break gosub
                    this.breakResumeLine = Number(this.line);
                    this.gosub(this.line, this.breakGosubLine);
                }
                stop = false;
            }
            else if (this.breakGosubLine < 0) { // on break cont
                stop = false;
            } // else: on break stop
            return stop;
        };
        CpcVm.prototype.vmAssertNumber = function (n, err) {
            if (typeof n !== "number") {
                throw this.vmComposeError(Error(), 13, err + " " + n); // Type mismatch
            }
        };
        CpcVm.prototype.vmAssertString = function (s, err) {
            if (typeof s !== "string") {
                throw this.vmComposeError(Error(), 13, err + " " + s); // Type mismatch
            }
        };
        // round number (-2^31..2^31) to integer; throw error if no number
        CpcVm.prototype.vmRound = function (n, err) {
            this.vmAssertNumber(n, err || "?");
            return (n >= 0) ? (n + 0.5) | 0 : (n - 0.5) | 0; // eslint-disable-line no-bitwise
        };
        /*
        // round for comparison TODO
        vmRound4Cmp(n) {
            const nAdd = (n >= 0) ? 0.5 : -0.5;
    
            return ((n * 1e12 + nAdd) | 0) / 1e12; // eslint-disable-line no-bitwise
        }
        */
        CpcVm.prototype.vmInRangeRound = function (n, min, max, err) {
            n = this.vmRound(n, err);
            if (n < min || n > max) {
                if (!this.quiet) {
                    Utils_1.Utils.console.warn("vmInRangeRound: number not in range:", min + "<=" + n + "<=" + max);
                }
                throw this.vmComposeError(Error(), n < -32768 || n > 32767 ? 6 : 5, err + " " + n); // 6=Overflow, 5=Improper argument
            }
            return n;
        };
        CpcVm.prototype.vmRound2Complement = function (n, err) {
            n = this.vmInRangeRound(n, -32768, 65535, err);
            if (n < 0) {
                n += 65536;
            }
            return n;
        };
        CpcVm.prototype.vmDetermineVarType = function (varType) {
            return (varType.length > 1) ? varType.charAt(1) : this.variables.getVarType(varType.charAt(0));
        };
        CpcVm.prototype.vmAssertNumberType = function (varType) {
            var type = this.vmDetermineVarType(varType);
            if (type !== "I" && type !== "R") { // not integer or real?
                throw this.vmComposeError(Error(), 13, "type " + type); // "Type mismatch"
            }
        };
        // format a value for assignment to a variable with type determined from varType
        CpcVm.prototype.vmAssign = function (varType, value) {
            var type = this.vmDetermineVarType(varType);
            if (type === "R") { // real
                this.vmAssertNumber(value, "=");
            }
            else if (type === "I") { // integer
                value = this.vmRound(value, "="); // round number to integer
            }
            else if (type === "$") { // string
                if (typeof value !== "string") {
                    Utils_1.Utils.console.warn("vmAssign: expected string but got:", value);
                    throw this.vmComposeError(Error(), 13, "type " + type + "=" + value); // "Type mismatch"
                }
            }
            return value;
        };
        CpcVm.prototype.vmGotoLine = function (line, msg) {
            if (Utils_1.Utils.debug > 5) {
                if (typeof line === "number" || Utils_1.Utils.debug > 7) { // non-number labels only in higher debug levels
                    Utils_1.Utils.console.debug("dvmGotoLine:", msg + ": " + line);
                }
            }
            this.line = line;
        };
        CpcVm.prototype.fnCheckSqTimer = function () {
            var timerExpired = false;
            if (this.timerPriority < 2) {
                for (var i = 0; i < CpcVm.sqTimerCount; i += 1) {
                    var timer = this.sqTimer[i];
                    // use sound.sq(i) and not this.sq(i) since that would reset onSq timer
                    if (timer.active && !timer.handlerRunning && (this.soundClass.sq(i) & 0x07)) { // eslint-disable-line no-bitwise
                        this.gosub(this.line, timer.line);
                        timer.handlerRunning = true;
                        timer.stackIndexReturn = this.gosubStack.length;
                        timer.repeat = false; // one shot
                        timerExpired = true;
                        break; // found expired timer
                    }
                }
            }
            return timerExpired;
        };
        CpcVm.prototype.vmCheckTimer = function (time) {
            var timerExpired = false;
            for (var i = CpcVm.timerCount - 1; i > this.timerPriority; i -= 1) { // check timers starting with highest priority first
                var timer = this.timerList[i];
                if (timer.active && !timer.handlerRunning && time > timer.nextTimeMs) { // timer expired?
                    this.gosub(this.line, timer.line);
                    timer.handlerRunning = true;
                    timer.stackIndexReturn = this.gosubStack.length;
                    timer.savedPriority = this.timerPriority;
                    this.timerPriority = i;
                    if (!timer.repeat) { // not repeating
                        timer.active = false;
                    }
                    else {
                        var delta = time - timer.nextTimeMs;
                        timer.nextTimeMs += timer.intervalMs * Math.ceil(delta / timer.intervalMs);
                    }
                    timerExpired = true;
                    break; // found expired timer
                }
                else if (i === 2) { // for priority 2 we check the sq timers which also have priority 2
                    if (this.fnCheckSqTimer()) {
                        break; // found expired timer
                    }
                }
            }
            return timerExpired;
        };
        CpcVm.prototype.vmCheckTimerHandlers = function () {
            for (var i = CpcVm.timerCount - 1; i >= 0; i -= 1) {
                var timer = this.timerList[i];
                if (timer.handlerRunning) {
                    if (timer.stackIndexReturn > this.gosubStack.length) {
                        timer.handlerRunning = false;
                        this.timerPriority = timer.savedPriority; // restore priority
                        timer.stackIndexReturn = 0;
                    }
                }
            }
        };
        CpcVm.prototype.vmCheckSqTimerHandlers = function () {
            var timerReloaded = false;
            for (var i = CpcVm.sqTimerCount - 1; i >= 0; i -= 1) {
                var timer = this.sqTimer[i];
                if (timer.handlerRunning) {
                    if (timer.stackIndexReturn > this.gosubStack.length) {
                        timer.handlerRunning = false;
                        this.timerPriority = timer.savedPriority; // restore priority
                        timer.stackIndexReturn = 0;
                        if (!timer.repeat) { // not reloaded
                            timer.active = false;
                        }
                        else {
                            timerReloaded = true;
                        }
                    }
                }
            }
            return timerReloaded;
        };
        CpcVm.prototype.vmCheckNextFrame = function (time) {
            if (time >= this.nextFrameTime) { // next time of frame fly
                var delta = time - this.nextFrameTime;
                if (delta > CpcVm.frameTimeMs) {
                    this.nextFrameTime += CpcVm.frameTimeMs * Math.ceil(delta / CpcVm.frameTimeMs);
                }
                else {
                    this.nextFrameTime += CpcVm.frameTimeMs;
                }
                this.canvas.updateSpeedInk();
                this.vmCheckTimer(time); // check BASIC timers and sound queue
                this.soundClass.scheduler(); // on a real CPC it is 100 Hz, we use 50 Hz
            }
        };
        CpcVm.prototype.vmGetTimeUntilFrame = function (time) {
            time = time || Date.now();
            return this.nextFrameTime - time;
        };
        CpcVm.prototype.vmLoopCondition = function () {
            var time = Date.now();
            if (time >= this.nextFrameTime) {
                this.vmCheckNextFrame(time);
                this.stopCount += 1;
                if (this.stopCount >= 5) { // do not stop too often because of just timer resason because setTimeout is expensive
                    this.stopCount = 0;
                    this.vmStop("timer", 20);
                }
            }
            return this.stopEntry.reason === "";
        };
        CpcVm.prototype.vmInitUntypedVariables = function (varChar) {
            var names = this.variables.getAllVariableNames();
            for (var i = 0; i < names.length; i += 1) {
                var name_1 = names[i];
                if (name_1.charAt(0) === varChar) {
                    if (name_1.indexOf("$") === -1 && name_1.indexOf("%") === -1 && name_1.indexOf("!") === -1) { // no explicit type?
                        this.variables.initVariable(name_1);
                    }
                }
            }
        };
        CpcVm.prototype.vmDefineVarTypes = function (type, nameOrRange, err) {
            this.vmAssertString(nameOrRange, err);
            var first, last;
            if (nameOrRange.indexOf("-") >= 0) {
                var range = nameOrRange.split("-", 2);
                first = range[0].trim().toLowerCase().charCodeAt(0);
                last = range[1].trim().toLowerCase().charCodeAt(0);
            }
            else {
                first = nameOrRange.trim().toLowerCase().charCodeAt(0);
                last = first;
            }
            for (var i = first; i <= last; i += 1) {
                var varChar = String.fromCharCode(i);
                if (this.variables.getVarType(varChar) !== type) { // type changed?
                    this.variables.setVarType(varChar, type);
                    // initialize all untyped variables starting with varChar!
                    this.vmInitUntypedVariables(varChar);
                }
            }
        };
        CpcVm.prototype.vmStop = function (reason, priority, force, paras) {
            var defaultPriority = CpcVm.stopPriority[reason];
            if (defaultPriority === undefined) {
                Utils_1.Utils.console.warn("Programming error: vmStop: Unknown reason:", reason);
            }
            priority = priority || 0;
            if (priority !== 0) {
                priority = defaultPriority;
            }
            if (force || priority >= this.stopEntry.priority) {
                this.stopEntry.priority = priority;
                this.stopEntry.reason = reason;
                this.stopEntry.paras = paras || CpcVm.emptyParas;
            }
        };
        CpcVm.prototype.vmNotImplemented = function (name) {
            Utils_1.Utils.console.warn("Not implemented:", name);
        };
        CpcVm.prototype.vmUsingStringFormat = function (format, arg) {
            var padChar = " ", re1 = /^\\ *\\$/;
            var str;
            if (format === "&") {
                str = arg;
            }
            else if (format === "!") {
                str = arg.charAt(0);
            }
            else if (re1.test(format)) { // "\...\"
                //str = arg.substr(0, format.length);
                var padLen = format.length - arg.length, pad = (padLen > 0) ? padChar.repeat(padLen) : "";
                str = arg + pad; // string left aligned
            }
            else { // no string format
                throw this.vmComposeError(Error(), 13, "USING format " + format); // "Type mismatch"
            }
            return str;
        };
        // not fully implemented
        CpcVm.prototype.vmUsingNumberFormat = function (format, arg) {
            var padChar = " ", re1 = /^\\ *\\$/;
            var str;
            if (format === "&" || format === "!" || re1.test(format)) { // string format for number?
                throw this.vmComposeError(Error(), 13, "USING format " + format); // "Type mismatch"
            }
            if (format.indexOf(".") < 0) { // no decimal point?
                str = arg.toFixed(0);
            }
            else { // assume ###.##
                var formatParts = format.split(".", 2), decimals = formatParts[1].length;
                // To avoid rounding errors: https://www.jacklmoore.com/notes/rounding-in-javascript
                arg = Number(Math.round(Number(arg + "e" + decimals)) + "e-" + decimals);
                str = arg.toFixed(decimals);
            }
            if (format.indexOf(",") >= 0) { // contains comma => insert thousands separator
                str = Utils_1.Utils.numberWithCommas(str);
            }
            var padLen = format.length - str.length, pad = (padLen > 0) ? padChar.repeat(padLen) : "";
            str = pad + str;
            if (str.length > format.length) {
                str = "%" + str; // mark too long
            }
            return str;
        };
        CpcVm.prototype.vmUsingFormat = function (format, arg) {
            return typeof arg === "string" ? this.vmUsingStringFormat(format, arg) : this.vmUsingNumberFormat(format, arg);
        };
        CpcVm.prototype.vmGetStopObject = function () {
            return this.stopEntry;
        };
        CpcVm.prototype.vmGetInFileObject = function () {
            return this.inFile;
        };
        CpcVm.prototype.vmGetOutFileObject = function () {
            return this.outFile;
        };
        CpcVm.prototype.vmAdaptFilename = function (name, err) {
            this.vmAssertString(name, err);
            name = name.replace(/ /g, ""); // remove spaces
            if (name.indexOf("!") === 0) {
                name = name.substr(1); // remove preceding "!"
            }
            var index = name.indexOf(":");
            if (index >= 0) {
                name = name.substr(index + 1); // remove user and drive letter including ":"
            }
            name = name.toLowerCase();
            if (!name) {
                throw this.vmComposeError(Error(), 32, "Bad filename: " + name);
            }
            return name;
        };
        CpcVm.prototype.vmGetSoundData = function () {
            return this.soundData;
        };
        CpcVm.prototype.vmTrace = function (line) {
            var stream = 0;
            this.tronLine = line;
            if (this.tronFlag1) {
                this.print(stream, "[" + line + "]");
            }
        };
        CpcVm.prototype.vmDrawMovePlot = function (type, gPen, gColMode) {
            if (gPen !== undefined) {
                gPen = this.vmInRangeRound(gPen, 0, 15, type);
                this.canvas.setGPen(gPen);
            }
            if (gColMode !== undefined) {
                gColMode = this.vmInRangeRound(gColMode, 0, 3, type);
                this.canvas.setGColMode(gColMode);
            }
        };
        CpcVm.prototype.vmAfterEveryGosub = function (type, interval, timer, line) {
            interval = this.vmInRangeRound(interval, 0, 32767, type); // more would be overflow
            timer = this.vmInRangeRound(timer || 0, 0, 3, type);
            var timerEntry = this.timerList[timer];
            if (interval) {
                var intervalMs = interval * CpcVm.frameTimeMs; // convert to ms
                timerEntry.intervalMs = intervalMs;
                timerEntry.line = line;
                timerEntry.repeat = (type === "EVERY");
                timerEntry.active = true;
                timerEntry.nextTimeMs = Date.now() + intervalMs;
            }
            else { // interval 0 => switch running timer off
                timerEntry.active = false;
            }
        };
        CpcVm.prototype.vmCopyFromScreen = function (source, dest) {
            for (var i = 0; i < 0x4000; i += 1) {
                var byte = this.canvas.getByte(source + i); // get byte from screen memory
                if (byte === null) { // byte not visible on screen?
                    byte = this.mem[source + i] || 0; // get it from our memory
                }
                this.mem[dest + i] = byte;
            }
        };
        CpcVm.prototype.vmCopyToScreen = function (source, dest) {
            for (var i = 0; i < 0x4000; i += 1) {
                var byte = this.mem[source + i] || 0; // get it from our memory
                this.canvas.setByte(dest + i, byte);
            }
        };
        CpcVm.prototype.vmSetScreenBase = function (byte) {
            byte = this.vmInRangeRound(byte, 0, 255, "screenBase");
            var page = byte >> 6, // eslint-disable-line no-bitwise
            oldPage = this.screenPage;
            if (page !== oldPage) {
                var addr = oldPage << 14; // eslint-disable-line no-bitwise
                this.vmCopyFromScreen(addr, addr);
                this.screenPage = page;
                addr = page << 14; // eslint-disable-line no-bitwise
                this.vmCopyToScreen(addr, addr);
            }
        };
        CpcVm.prototype.vmSetScreenOffset = function (offset) {
            this.canvas.setScreenOffset(offset);
        };
        // could be also set vmSetScreenViewBase? thisiScreenViewPage?  We always draw on visible canvas?
        CpcVm.prototype.vmSetTransparentMode = function (stream, transparent) {
            this.windowDataList[stream].transparent = Boolean(transparent);
        };
        // --
        CpcVm.prototype.abs = function (n) {
            this.vmAssertNumber(n, "ABS");
            return Math.abs(n);
        };
        CpcVm.prototype.addressOf = function (variable) {
            // not really implemented
            variable = variable.replace("v.", "");
            variable = variable.replace("[", "(");
            var pos = variable.indexOf("("); // array variable with indices?
            if (pos >= 0) {
                variable = variable.substr(0, pos); // remove indices
            }
            pos = this.variables.getVariableIndex(variable);
            if (pos < 0) {
                throw this.vmComposeError(Error(), 5, "@" + variable); // Improper argument
            }
            return pos;
        };
        CpcVm.prototype.afterGosub = function (interval, timer, line) {
            this.vmAfterEveryGosub("AFTER", interval, timer, line);
        };
        CpcVm.vmGetCpcCharCode = function (code) {
            if (code > 255) { // map some UTF-8 character codes
                if (CpcVm.utf8ToCpc[code]) {
                    code = CpcVm.utf8ToCpc[code];
                }
            }
            return code;
        };
        CpcVm.prototype.asc = function (s) {
            this.vmAssertString(s, "ASC");
            if (!s.length) {
                throw this.vmComposeError(Error(), 5, "ASC"); // Improper argument
            }
            return CpcVm.vmGetCpcCharCode(s.charCodeAt(0));
        };
        CpcVm.prototype.atn = function (n) {
            this.vmAssertNumber(n, "ATN");
            n = Math.atan(n);
            return this.degFlag ? Utils_1.Utils.toDegrees(n) : n;
        };
        CpcVm.prototype.auto = function () {
            this.vmNotImplemented("AUTO");
        };
        CpcVm.prototype.bin$ = function (n, pad) {
            n = this.vmInRangeRound(n, -32768, 65535, "BIN$");
            pad = this.vmInRangeRound(pad || 0, 0, 16, "BIN$");
            if (n < 0) {
                n += 65536;
            }
            return pad ? n.toString(2).padStart(pad, "0") : n.toString(2);
        };
        CpcVm.prototype.border = function (ink1, ink2) {
            ink1 = this.vmInRangeRound(ink1, 0, 31, "BORDER");
            if (ink2 === undefined) {
                ink2 = ink1;
            }
            else {
                ink2 = this.vmInRangeRound(ink2, 0, 31, "BORDER");
            }
            this.canvas.setBorder(ink1, ink2);
        };
        // break
        CpcVm.prototype.vmMcSetMode = function (mode) {
            mode = this.vmInRangeRound(mode, 0, 3, "MCSetMode");
            var canvasMode = this.canvas.getMode();
            if (mode !== canvasMode) {
                var addr = this.screenPage << 14; // eslint-disable-line no-bitwise
                // keep screen bytes, just interpret in other mode
                this.vmCopyFromScreen(addr, addr); // read bytes from screen memory into memory
                this.canvas.changeMode(mode); // change mode and interpretation of bytes
                this.vmCopyToScreen(addr, addr); // write bytes back to screen memory
                this.canvas.changeMode(canvasMode); // keep mode
                // TODO: new content should still be written in old mode but interpreted in new mode
            }
        };
        CpcVm.prototype.vmTxtInverse = function (stream) {
            var win = this.windowDataList[stream], tmpPen = win.pen;
            this.pen(stream, win.paper);
            this.paper(stream, tmpPen);
        };
        CpcVm.prototype.vmPutKeyInBuffer = function (key) {
            this.keyboard.putKeyInBuffer(key);
            var keyDownHandler = this.keyboard.getKeyDownHandler();
            if (keyDownHandler) {
                keyDownHandler();
            }
        };
        CpcVm.prototype.call = function (addr) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            // varargs (adr + parameters)
            addr = this.vmRound2Complement(addr, "CALL");
            if (args.length > 32) { // more that 32 arguments?
                throw this.vmComposeError(Error(), 2, "CALL "); // Syntax Error
            }
            for (var i = 0; i < args.length; i += 1) {
                if (typeof args[i] === "number") {
                    args[i] = this.vmRound2Complement(args[i], "CALL"); //TTT
                }
            }
            switch (addr) {
                case 0xbb00: // KM Initialize (ROM &19E0)
                    this.keyboard.resetCpcKeysExpansions();
                    this.call(0xbb03); // KM Reset
                    break;
                case 0xbb03: // KM Reset (ROM &1AE1)
                    this.clearInput();
                    this.keyboard.resetExpansionTokens();
                    // TODO: reset also speed key
                    break;
                case 0xbb06: // KM Wait Char (ROM &1A3C)
                    // since we do not return a character, we do the same as call &bb18
                    if (this.inkey$() === "") { // no key?
                        this.vmStop("waitKey", 30); // wait for key
                    }
                    break;
                case 0xbb0c: // KM Char Return (ROM &1A77), depending on number of args
                    this.vmPutKeyInBuffer(String.fromCharCode(arguments.length - 1));
                    break;
                case 0xbb18: // KM Wait Key (ROM &1B56)
                    if (this.inkey$() === "") { // no key?
                        this.vmStop("waitKey", 30); // wait for key
                    }
                    break;
                case 0xbb4e: // TXT Initialize (ROM &1078)
                    this.canvas.resetCustomChars();
                    this.vmResetWindowData(true); // reset windows, including pen and paper
                    // and TXT Reset...
                    this.vmResetControlBuffer();
                    break;
                case 0xbb51: // TXT Reset (ROM &11088)
                    this.vmResetControlBuffer();
                    break;
                case 0xbb5a: // TXT Output (ROM &1400), depending on number of args
                    this.print(0, String.fromCharCode(arguments.length - 1));
                    break;
                case 0xbb5d: // TXT WR Char (ROM &1334), depending on number of args
                    this.vmDrawUndrawCursor(0);
                    this.vmPrintChars(0, String.fromCharCode(arguments.length - 1));
                    this.vmDrawUndrawCursor(0);
                    break;
                case 0xbb6c: // TXT Clear Window (ROM &1540)
                    this.cls(0);
                    break;
                case 0xbb7b: // TXT Cursor Enable (ROM &1289); user switch (cursor enabled)
                    this.cursor(0, undefined, 1);
                    break;
                case 0xbb7e: // TXT Cursor Disable (ROM &129A); user switch
                    this.cursor(0, undefined, 0);
                    break;
                case 0xbb81: // TXT Cursor On (ROM &1279); system switch (cursor on)
                    this.cursor(0, 1);
                    break;
                case 0xbb84: // TXT Cursor Off (ROM &1281); system switch
                    this.cursor(0, 0);
                    break;
                case 0xbb8a: // TXT Place Cursor (ROM &1268)
                    this.vmPlaceRemoveCursor(0); // 0=stream
                    break;
                case 0xbb8d: // TXT Remove Cursor (ROM &1268); same as place cursor
                    this.vmPlaceRemoveCursor(0);
                    break;
                case 0xbb90: // TXT Set Pen (ROM &12A9), depending on number of args
                    this.pen(0, (arguments.length - 1) % 16);
                    break;
                case 0xbb96: // TXT Set Paper (ROM &12AE); depending on number of args
                    this.paper(0, (arguments.length - 1) % 16);
                    break;
                case 0xbb9c: // TXT Inverse (ROM &12C9), same as print chr$(24);
                    this.vmTxtInverse(0);
                    break;
                case 0xbb9f: // TXT Set Back (ROM &137A), depending on number of args
                    this.vmSetTransparentMode(0, arguments.length - 1);
                    break;
                case 0xbbdb: // GRA Clear Window (ROM &17C5)
                    this.canvas.clearGraphicsWindow();
                    break;
                case 0xbbde: // GRA Set Pen (ROM &17F6), depending on number of args
                    // we can only set graphics pen depending on number of args (pen 0=no arg, pen 1=one arg)
                    this.graphicsPen((arguments.length - 1) % 16);
                    break;
                case 0xbbe4: // GRA Set Paper (ROM &17FD), depending on number of args
                    this.graphicsPaper((arguments.length - 1) % 16);
                    break;
                case 0xbbfc: // GRA WR Char (ROM &1945), depending on number of args
                    this.canvas.printGChar(arguments.length - 1);
                    break;
                case 0xbbff: // SCR Initialize (ROM &0AA0)
                    this.vmSetScreenBase(0xc0);
                    this.modeValue = 1;
                    this.canvas.setMode(this.modeValue); // does not clear canvas
                    this.canvas.clearFullWindow(); // (SCR Mode Clear)
                    // and SCR Reset:
                    this.vmResetInks();
                    break;
                case 0xbc02: // SCR Reset (ROM &0AB1)
                    this.vmResetInks();
                    break;
                case 0xbc06: // SCR SET BASE (&BC08, ROM &0B45); We use &BC06 to load reg A from reg E (not for CPC 664!)
                case 0xbc07: // Works on all CPC 464/664/6128
                    this.vmSetScreenBase(arguments[1]);
                    break;
                case 0xbc0e: // SCR SET MODE (ROM &0ACE), depending on number of args
                    this.mode((arguments.length - 1) % 4); // 3 is valid also on CPC
                    break;
                case 0xbca7: // SOUND Reset (ROM &1E68)
                    this.soundClass.reset();
                    break;
                case 0xbcb6: // SOUND Hold (ROM &1ECB)
                    Utils_1.Utils.console.log("TODO: CALL", addr);
                    break;
                case 0xbcb9: // SOUND Continue (ROM &1EE6)
                    Utils_1.Utils.console.log("TODO: CALL", addr);
                    break;
                case 0xbd19: // MC Wait Flyback (ROM &07BA)
                    this.frame();
                    break;
                case 0xbd1c: // MC Set Mode (ROM &0776) just set mode, depending on number of args
                    this.vmMcSetMode((arguments.length - 1) % 4);
                    break;
                case 0xbd3d: // KM Flush (ROM ?; CPC 664/6128)
                    this.clearInput();
                    break;
                case 0xbd49: // GRA Set First (ROM ?; CPC 664/6128), depending on number of args
                    this.canvas.setMaskFirst((arguments.length - 1) % 2);
                    break;
                case 0xbd4c: // GRA Set Mask (ROM ?; CPC 664/6128), depending on number of args
                    this.canvas.setMask(arguments.length - 1);
                    break;
                case 0xbd52: // GRA Fill (ROM ?; CPC 664/6128), depending on number of args
                    this.fill((arguments.length - 1) % 16);
                    break;
                case 0xbd5b: // KL RAM SELECT (CPC 6128 only)
                    // we can only set RAM bank depending on number of args
                    this.vmSetRamSelect(arguments.length - 1);
                    break;
                default:
                    if (Utils_1.Utils.debug > 0) {
                        Utils_1.Utils.console.debug("Ignored: CALL", addr);
                    }
                    break;
            }
        };
        CpcVm.prototype.cat = function () {
            var stream = 0, fileParas = {
                command: "cat",
                stream: stream,
                fileMask: "",
                line: this.line // unused
            };
            this.vmStop("fileCat", 45, false, fileParas);
        };
        CpcVm.prototype.chain = function (name, line) {
            var inFile = this.inFile;
            name = this.vmAdaptFilename(name, "CHAIN");
            this.closein();
            inFile.open = true;
            inFile.command = "chain";
            inFile.name = name;
            inFile.line = line || 0;
            inFile.fnFileCallback = this.fnCloseinHandler;
            this.vmStop("fileLoad", 90);
        };
        CpcVm.prototype.chainMerge = function (name, line, first, last) {
            var inFile = this.inFile;
            name = this.vmAdaptFilename(name, "CHAIN MERGE");
            this.closein();
            inFile.open = true;
            inFile.command = "chainMerge";
            inFile.name = name;
            inFile.line = line || 0;
            inFile.first = first || 0;
            inFile.last = last || 0;
            inFile.fnFileCallback = this.fnCloseinHandler;
            this.vmStop("fileLoad", 90);
        };
        CpcVm.prototype.chr$ = function (n) {
            n = this.vmInRangeRound(n, 0, 255, "CHR$");
            return String.fromCharCode(n);
        };
        CpcVm.prototype.cint = function (n) {
            return this.vmInRangeRound(n, -32768, 32767, "CINT");
        };
        CpcVm.prototype.clear = function () {
            this.vmResetTimers();
            this.ei();
            this.vmSetStartLine(0);
            this.errorCode = 0;
            this.breakGosubLine = 0;
            this.breakResumeLine = 0;
            this.errorGotoLine = 0;
            this.errorResumeLine = 0;
            this.gosubStack.length = 0;
            this.variables.initAllVariables();
            this.defreal("a-z");
            this.restore(); // restore data line index
            this.rad();
            this.soundClass.resetQueue();
            this.soundData.length = 0;
            this.closein();
            this.closeout();
        };
        CpcVm.prototype.clearInput = function () {
            this.keyboard.clearInput();
        };
        CpcVm.prototype.clg = function (gPaper) {
            if (gPaper !== undefined) {
                gPaper = this.vmInRangeRound(gPaper, 0, 15, "CLG");
                this.canvas.setGPaper(gPaper);
            }
            this.canvas.clearGraphicsWindow();
        };
        CpcVm.prototype.vmCloseinCallback = function () {
            var inFile = this.inFile;
            CpcVm.vmResetFileHandling(inFile);
        };
        CpcVm.prototype.closein = function () {
            var inFile = this.inFile;
            if (inFile.open) {
                this.vmCloseinCallback(); // not really used as a callback here
            }
        };
        CpcVm.prototype.vmCloseoutCallback = function () {
            var outFile = this.outFile;
            CpcVm.vmResetFileHandling(outFile);
        };
        CpcVm.prototype.closeout = function () {
            var outFile = this.outFile;
            if (outFile.open) {
                if (outFile.command !== "openout") {
                    Utils_1.Utils.console.warn("closeout: command=", outFile.command); // should not occur
                }
                if (!outFile.fileData.length) { // openout without data?
                    this.vmCloseoutCallback(); // close directly
                }
                else { // data to save
                    outFile.command = "closeout";
                    outFile.fnFileCallback = this.fnCloseoutHandler;
                    this.vmStop("fileSave", 90); // must stop directly after closeout
                }
            }
        };
        // also called for chr$(12), call &bb6c
        CpcVm.prototype.cls = function (stream) {
            stream = this.vmInRangeRound(stream, 0, 7, "CLS");
            var win = this.windowDataList[stream];
            this.vmDrawUndrawCursor(stream); // why, if we clear anyway?
            this.canvas.clearTextWindow(win.left, win.right, win.top, win.bottom, win.paper); // cls window
            win.pos = 0;
            win.vpos = 0;
            if (!stream) {
                this.outBuffer = ""; // clear also console, if stream===0
            }
        };
        CpcVm.prototype.commaTab = function (stream) {
            stream = this.vmInRangeRound(stream, 0, 9, "commaTab");
            this.vmMoveCursor2AllowedPos(stream);
            var zone = this.zoneValue, win = this.windowDataList[stream];
            var count = zone - (win.pos % zone);
            if (win.pos) { // <>0: not begin of line
                if (win.pos + count + zone > (win.right + 1 - win.left)) {
                    win.pos += count + zone;
                    this.vmMoveCursor2AllowedPos(stream);
                    count = 0;
                }
            }
            return " ".repeat(count);
        };
        CpcVm.prototype.cont = function () {
            if (!this.startLine) {
                throw this.vmComposeError(Error(), 17, "CONT"); // cannot continue
            }
            this.vmGotoLine(this.startLine, "CONT");
            this.startLine = 0;
        };
        CpcVm.prototype.copychr$ = function (stream) {
            stream = this.vmInRangeRound(stream, 0, 7, "COPYCHR$");
            this.vmMoveCursor2AllowedPos(stream);
            this.vmDrawUndrawCursor(stream); // undraw
            var win = this.windowDataList[stream], charCode = this.canvas.readChar(win.pos + win.left, win.vpos + win.top, win.pen, win.paper), char = (charCode >= 0) ? String.fromCharCode(charCode) : "";
            this.vmDrawUndrawCursor(stream); // draw
            return char;
        };
        CpcVm.prototype.cos = function (n) {
            this.vmAssertNumber(n, "COS");
            return Math.cos((this.degFlag) ? Utils_1.Utils.toRadians(n) : n);
        };
        CpcVm.prototype.creal = function (n) {
            this.vmAssertNumber(n, "CREAL");
            return n;
        };
        CpcVm.prototype.vmPlaceRemoveCursor = function (stream) {
            var win = this.windowDataList[stream];
            this.vmMoveCursor2AllowedPos(stream);
            this.canvas.drawCursor(win.pos + win.left, win.vpos + win.top, win.pen, win.paper);
        };
        CpcVm.prototype.vmDrawUndrawCursor = function (stream) {
            var win = this.windowDataList[stream];
            if (win.cursorOn && win.cursorEnabled) {
                this.vmPlaceRemoveCursor(stream);
            }
        };
        CpcVm.prototype.cursor = function (stream, cursorOn, cursorEnabled) {
            stream = this.vmInRangeRound(stream, 0, 7, "CURSOR");
            var win = this.windowDataList[stream];
            if (cursorOn !== undefined) { // system
                cursorOn = this.vmInRangeRound(cursorOn, 0, 1, "CURSOR");
                this.vmDrawUndrawCursor(stream); // undraw
                win.cursorOn = Boolean(cursorOn);
                this.vmDrawUndrawCursor(stream); // draw
            }
            if (cursorEnabled !== undefined) { // user
                cursorEnabled = this.vmInRangeRound(cursorEnabled, 0, 1, "CURSOR");
                this.vmDrawUndrawCursor(stream); // undraw
                win.cursorEnabled = Boolean(cursorEnabled);
                this.vmDrawUndrawCursor(stream); // draw
            }
        };
        CpcVm.prototype.data = function (line) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            if (!this.dataLineIndex[line]) {
                this.dataLineIndex[line] = this.dataList.length; // set current index for the line
            }
            // append data
            for (var i = 0; i < args.length; i += 1) {
                this.dataList.push(args[i]);
            }
        };
        CpcVm.prototype.dec$ = function (n, frmt) {
            this.vmAssertNumber(n, "DEC$");
            this.vmAssertString(frmt, "DEC$");
            //return this.vmUsingFormat(frmt, n);
            return this.vmUsingNumberFormat(frmt, n);
        };
        // def fn
        CpcVm.prototype.defint = function (nameOrRange) {
            this.vmDefineVarTypes("I", nameOrRange, "DEFINT");
        };
        CpcVm.prototype.defreal = function (nameOrRange) {
            this.vmDefineVarTypes("R", nameOrRange, "DEFREAL");
        };
        CpcVm.prototype.defstr = function (nameOrRange) {
            this.vmDefineVarTypes("$", nameOrRange, "DEFSTR");
        };
        CpcVm.prototype.deg = function () {
            this.degFlag = true;
        };
        CpcVm.prototype["delete"] = function (first, last) {
            if (first === undefined) {
                first = 1;
                last = last === undefined ? 65535 : this.vmInRangeRound(last, 1, 65535, "DELETE");
            }
            else {
                first = this.vmInRangeRound(first, 1, 65535, "DELETE");
                if (last === undefined) { // just one parameter?
                    last = first;
                }
                else { // range
                    last = this.vmInRangeRound(last, 1, 65535, "DELETE");
                }
            }
            this.vmStop("deleteLines", 85, false, {
                command: "DELETE",
                stream: 0,
                first: first,
                last: last,
                line: this.line // unused
            });
        };
        CpcVm.prototype.derr = function () {
            return 0; // "[Not implemented yet: derr]"
        };
        CpcVm.prototype.di = function () {
            this.timerPriority = 3; // increase priority
        };
        CpcVm.prototype.dim = function (varName) {
            var dimensions = [];
            for (var i = 1; i < arguments.length; i += 1) {
                var size = this.vmInRangeRound(arguments[i], 0, 32767, "DIM") + 1; // for basic we have sizes +1
                dimensions.push(size);
            }
            this.variables.dimVariable(varName, dimensions);
        };
        CpcVm.prototype.draw = function (x, y, gPen, gColMode) {
            x = this.vmInRangeRound(x, -32768, 32767, "DRAW");
            y = this.vmInRangeRound(y, -32768, 32767, "DRAW");
            this.vmDrawMovePlot("DRAW", gPen, gColMode);
            this.canvas.draw(x, y);
        };
        CpcVm.prototype.drawr = function (x, y, gPen, gColMode) {
            x = this.vmInRangeRound(x, -32768, 32767, "DRAWR");
            y = this.vmInRangeRound(y, -32768, 32767, "DRAWR");
            this.vmDrawMovePlot("DRAWR", gPen, gColMode);
            this.canvas.drawr(x, y);
        };
        CpcVm.prototype.edit = function (line) {
            var lineParas = {
                command: "edit",
                stream: 0,
                first: line,
                last: 0,
                line: this.line // unused
            };
            this.vmStop("editLine", 85, false, lineParas);
        };
        CpcVm.prototype.ei = function () {
            this.timerPriority = -1; // decrease priority
        };
        CpcVm.prototype.end = function (label) {
            this.stop(label);
        };
        CpcVm.prototype.ent = function (toneEnv) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            toneEnv = this.vmInRangeRound(toneEnv, -15, 15, "ENT");
            var envData = [];
            var arg, repeat = false;
            if (toneEnv < 0) {
                toneEnv = -toneEnv;
                repeat = true;
            }
            if (toneEnv) { // not 0
                for (var i = 0; i < args.length; i += 3) { // starting with 1: 3 parameters per section
                    if (args[i] !== undefined) {
                        arg = {
                            steps: this.vmInRangeRound(args[i], 0, 239, "ENT"),
                            diff: this.vmInRangeRound(args[i + 1], -128, 127, "ENT"),
                            time: this.vmInRangeRound(args[i + 2], 0, 255, "ENT"),
                            repeat: repeat
                        }; // as ToneEnvData1
                    }
                    else { // special handling
                        arg = {
                            period: this.vmInRangeRound(args[i + 1], 0, 4095, "ENT"),
                            time: this.vmInRangeRound(args[i + 2], 0, 255, "ENT") // time: 0..255 (0=256)
                        }; // as ToneEnvData2
                    }
                    envData.push(arg);
                }
                this.soundClass.setToneEnv(toneEnv, envData);
            }
            else { // 0
                Utils_1.Utils.console.warn("ENT: toneEnv", toneEnv);
                throw this.vmComposeError(Error(), 5, "ENT " + toneEnv); // Improper argument
            }
        };
        CpcVm.prototype.env = function (volEnv) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            volEnv = this.vmInRangeRound(volEnv, 1, 15, "ENV");
            var envData = [];
            var arg;
            for (var i = 0; i < args.length; i += 3) { // starting with 1: 3 parameters per section
                if (args[i] !== undefined) {
                    arg = {
                        steps: this.vmInRangeRound(args[i], 0, 127, "ENV"),
                        /* eslint-disable no-bitwise */
                        diff: this.vmInRangeRound(args[i + 1], -128, 127, "ENV") & 0x0f,
                        /* eslint-enable no-bitwise */
                        time: this.vmInRangeRound(args[i + 2], 0, 255, "ENV") // time per step: 0..255 (0=256)
                    }; // as VolEnvData1
                    if (!arg.time) { // (0=256)
                        arg.time = 256;
                    }
                }
                else { // special handling for register parameters
                    arg = {
                        register: this.vmInRangeRound(args[i + 1], 0, 15, "ENV"),
                        period: this.vmInRangeRound(args[i + 2], -32768, 65535, "ENV")
                    }; // as VolEnvData2
                }
                envData.push(arg);
            }
            this.soundClass.setVolEnv(volEnv, envData);
        };
        CpcVm.prototype.eof = function () {
            var inFile = this.inFile;
            var eof = -1;
            if (inFile.open && inFile.fileData.length) {
                eof = 0;
            }
            return eof;
        };
        CpcVm.prototype.vmFindArrayVariable = function (name) {
            name += "A";
            if (this.variables.variableExist(name)) { // one dim array variable?
                return name;
            }
            // find multi-dim array variable
            var fnArrayVarFilter = function (variable) {
                return (variable.indexOf(name) === 0) ? variable : null; // find array varA
            };
            var names = this.variables.getAllVariableNames();
            names = names.filter(fnArrayVarFilter); // find array varA... with any number of indices
            return names[0]; // we should find exactly one
        };
        CpcVm.prototype.erase = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            for (var i = 0; i < args.length; i += 1) {
                var name_2 = this.vmFindArrayVariable(args[i]);
                if (name_2) {
                    this.variables.initVariable(name_2);
                }
                else {
                    Utils_1.Utils.console.warn("Array variable not found:", args[i]);
                    throw this.vmComposeError(Error(), 5, "ERASE " + args[i]); // Improper argument
                }
            }
        };
        CpcVm.prototype.erl = function () {
            var errorLine = parseInt(String(this.errorLine), 10); // in cpcBasic we have an error label here, so return number only
            return errorLine || 0;
        };
        CpcVm.prototype.err = function () {
            return this.errorCode;
        };
        CpcVm.prototype.vmComposeError = function (error, err, errInfo) {
            var errors = CpcVm.errors, errorString = errors[err] || errors[errors.length - 1]; // maybe Unknown error
            this.errorCode = err;
            this.errorLine = this.line;
            var line = this.errorLine;
            if (this.tronLine) {
                line += " (trace: " + this.tronLine + ")";
            }
            var errorWithInfo = errorString + " in " + line + (errInfo ? (": " + errInfo) : "");
            var hidden = false; // hide errors wich are catched
            if (this.errorGotoLine && !this.errorResumeLine) {
                this.errorResumeLine = Number(this.errorLine);
                this.vmGotoLine(this.errorGotoLine, "onError");
                this.vmStop("onError", 50);
                hidden = true;
            }
            else {
                this.vmStop("error", 50);
            }
            if (!this.quiet) {
                Utils_1.Utils.console.log("BASIC error(" + err + "):", errorWithInfo + (hidden ? " (hidden: " + hidden + ")" : ""));
            }
            return Utils_1.Utils.composeError("CpcVm", error, errorString, errInfo, undefined, undefined, line, hidden);
        };
        CpcVm.prototype.error = function (err, errInfo) {
            err = this.vmInRangeRound(err, 0, 255, "ERROR"); // could trigger another error
            throw this.vmComposeError(Error(), err, errInfo);
        };
        CpcVm.prototype.everyGosub = function (interval, timer, line) {
            this.vmAfterEveryGosub("EVERY", interval, timer, line);
        };
        CpcVm.prototype.exp = function (n) {
            this.vmAssertNumber(n, "EXP");
            return Math.exp(n);
        };
        CpcVm.prototype.fill = function (gPen) {
            gPen = this.vmInRangeRound(gPen, 0, 15, "FILL");
            this.canvas.fill(gPen);
        };
        CpcVm.prototype.fix = function (n) {
            this.vmAssertNumber(n, "FIX");
            return Math.trunc(n); // (ES6: Math.trunc)
        };
        CpcVm.prototype.frame = function () {
            this.vmStop("waitFrame", 40);
        };
        CpcVm.prototype.fre = function ( /* arg */) {
            return this.himemValue; // example, e.g. 42245;
        };
        CpcVm.prototype.gosub = function (retLabel, n) {
            if (this.gosubStack.length >= this.maxGosubStackLength) { // limit stack size (not necessary in JS, but...)
                throw this.vmComposeError(Error(), 7, "GOSUB " + n); // Memory full
            }
            this.vmGotoLine(n, "gosub (ret=" + retLabel + ")");
            this.gosubStack.push(retLabel);
        };
        CpcVm.prototype["goto"] = function (n) {
            this.vmGotoLine(n, "goto");
        };
        CpcVm.prototype.graphicsPaper = function (gPaper) {
            gPaper = this.vmInRangeRound(gPaper, 0, 15, "GRAPHICS PAPER");
            this.canvas.setGPaper(gPaper);
        };
        CpcVm.prototype.graphicsPen = function (gPen, transparentMode) {
            if (gPen !== undefined) {
                gPen = this.vmInRangeRound(gPen, 0, 15, "GRAPHICS PEN");
                this.canvas.setGPen(gPen);
            }
            if (transparentMode !== undefined) {
                transparentMode = this.vmInRangeRound(transparentMode, 0, 1, "GRAPHICS PEN");
                this.canvas.setGTransparentMode(Boolean(transparentMode));
            }
        };
        CpcVm.prototype.hex$ = function (n, pad) {
            n = this.vmInRangeRound(n, -32768, 65535, "HEX$");
            pad = this.vmInRangeRound(pad || 0, 0, 16, "HEX$");
            return n.toString(16).toUpperCase().padStart(pad, "0");
        };
        CpcVm.prototype.himem = function () {
            return this.himemValue;
        };
        CpcVm.prototype.ink = function (pen, ink1, ink2) {
            pen = this.vmInRangeRound(pen, 0, 15, "INK");
            ink1 = this.vmInRangeRound(ink1, 0, 31, "INK");
            if (ink2 === undefined) {
                ink2 = ink1;
            }
            else {
                ink2 = this.vmInRangeRound(ink2, 0, 31, "INK");
            }
            this.canvas.setInk(pen, ink1, ink2);
        };
        CpcVm.prototype.inkey = function (key) {
            key = this.vmInRangeRound(key, 0, 79, "INKEY");
            return this.keyboard.getKeyState(key);
        };
        CpcVm.prototype.inkey$ = function () {
            var key = this.keyboard.getKeyFromBuffer();
            // do some slowdown, if checked too early again without key press
            if (key !== "") { // some key pressed?
                this.inkeyTimeMs = 0;
            }
            else { // no key
                var now = Date.now();
                if (this.inkeyTimeMs && now < this.inkeyTimeMs) { // last inkey without key was in range of frame fly?
                    this.frame(); // then insert a frame fly
                }
                this.inkeyTimeMs = now + CpcVm.frameTimeMs; // next time of frame fly
            }
            return key;
        };
        CpcVm.prototype.inp = function (port) {
            port = this.vmRound2Complement(port, "INP"); // 2nd complement of 16 bit address
            // eslint-disable-next-line no-bitwise
            var byte = (port & 0xff);
            // eslint-disable-next-line no-bitwise
            byte |= 0xff; // we return always the same 0xff
            return byte;
        };
        CpcVm.prototype.vmSetInputValues = function (inputValues) {
            this.inputValues = inputValues;
        };
        CpcVm.prototype.vmGetNextInput = function () {
            var inputValues = this.inputValues, value = inputValues.shift();
            return value;
        };
        CpcVm.prototype.vmInputCallback = function () {
            var inputParas = this.vmGetStopObject().paras, stream = inputParas.stream, input = inputParas.input, inputValues = input.split(","), convertedInputValues = [], types = inputParas.types;
            var inputOk = true;
            Utils_1.Utils.console.log("vmInputCallback:", input);
            if (types && (inputValues.length === types.length)) {
                for (var i = 0; i < types.length; i += 1) {
                    var varType = types[i], type = this.vmDetermineVarType(varType), value = inputValues[i];
                    if (type !== "$") { // not a string?
                        var valueNumber = CpcVm.vmVal(value); // convert to number (also binary, hex), empty string gets 0
                        if (isNaN(valueNumber)) {
                            inputOk = false;
                        }
                        convertedInputValues.push(valueNumber);
                    }
                    else {
                        convertedInputValues.push(value);
                    }
                }
            }
            else {
                inputOk = false;
            }
            this.cursor(stream, 0);
            if (!inputOk) {
                this.print(stream, "?Redo from start\r\n");
                inputParas.input = "";
                this.print(stream, inputParas.message);
                this.cursor(stream, 1);
            }
            else {
                this.vmSetInputValues(convertedInputValues);
            }
            return inputOk;
        };
        CpcVm.prototype.fnFileInputGetString = function (fileData) {
            var line = fileData[0].replace(/^\s+/, ""), // remove preceding whitespace
            value;
            if (line.charAt(0) === '"') { // quoted string?
                var index = line.indexOf('"', 1); // closing quotes in this line?
                if (index >= 0) {
                    value = line.substr(1, index - 1); // take string without quotes
                    line = line.substr(index + 1);
                    line = line.replace(/^\s*,/, ""); // multiple args => remove next comma
                }
                else if (fileData.length > 1) { // no closing quotes in this line => try to combine with next line
                    fileData.shift(); // remove line
                    line += "\n" + fileData[0]; // combine lines
                }
                else {
                    throw this.vmComposeError(Error(), 13, "INPUT #9: no closing quotes: " + line);
                }
            }
            else { // unquoted string
                var index = line.indexOf(","); // multiple args?
                if (index >= 0) {
                    value = line.substr(0, index); // take arg
                    line = line.substr(index + 1);
                }
                else {
                    value = line; // take line
                    line = "";
                }
            }
            fileData[0] = line;
            return value;
        };
        CpcVm.prototype.fnFileInputGetNumber = function (fileData) {
            var line = fileData[0].replace(/^\s+/, ""), // remove preceding whitespace
            index = line.indexOf(","), // multiple args?
            value;
            if (index >= 0) {
                value = line.substr(0, index); // take arg
                line = line.substr(index + 1);
            }
            else {
                index = line.indexOf(" "); // space?
                if (index >= 0) {
                    value = line.substr(0, index); // take item until space
                    line = line.substr(index);
                    line = line.replace(/^\s*/, ""); // remove spaces after number
                }
                else {
                    value = line; // take line
                    line = "";
                }
            }
            var nValue = CpcVm.vmVal(value); // convert to number (also binary, hex)
            if (isNaN(nValue)) { // eslint-disable-line max-depth
                throw this.vmComposeError(Error(), 13, "INPUT #9 " + nValue + ": " + value); // Type mismatch
            }
            fileData[0] = line;
            return nValue;
        };
        CpcVm.prototype.vmInputNextFileItem = function (type) {
            var fileData = this.inFile.fileData;
            var value;
            while (fileData.length && value === undefined) {
                if (type === "$") {
                    value = this.fnFileInputGetString(fileData);
                }
                else { // number type
                    value = this.fnFileInputGetNumber(fileData);
                }
                if (!fileData[0].length) {
                    fileData.shift(); // remove empty line
                }
            }
            return value;
        };
        CpcVm.prototype.vmInputFromFile = function (types) {
            var inputValues = [];
            for (var i = 0; i < types.length; i += 1) {
                var varType = types[i], type = this.vmDetermineVarType(varType), value = this.vmInputNextFileItem(type);
                inputValues[i] = this.vmAssign(varType, value);
            }
            this.vmSetInputValues(inputValues);
        };
        CpcVm.prototype.input = function (stream, noCRLF, msg) {
            stream = this.vmInRangeRound(stream, 0, 9, "INPUT");
            if (stream < 8) {
                this.print(stream, msg);
                this.vmStop("waitInput", 45, false, {
                    command: "input",
                    stream: stream,
                    message: msg,
                    noCRLF: noCRLF,
                    fnInputCallback: this.vmInputCallback.bind(this),
                    types: Array.prototype.slice.call(arguments, 3),
                    input: "",
                    line: this.line // to repeat in case of break
                });
                this.cursor(stream, 1);
            }
            else if (stream === 8) {
                this.vmSetInputValues(["I am the printer!"]);
            }
            else if (stream === 9) {
                if (!this.inFile.open) {
                    throw this.vmComposeError(Error(), 31, "INPUT #" + stream); // File not open
                }
                else if (this.eof()) {
                    throw this.vmComposeError(Error(), 24, "INPUT #" + stream); // EOF met
                }
                this.vmInputFromFile(Array.prototype.slice.call(arguments, 3)); // remaining arguments
            }
        };
        CpcVm.prototype.instr = function (p1, p2, p3) {
            this.vmAssertString(p2, "INSTR");
            if (typeof p1 === "string") { // p1=string, p2=search string
                return p1.indexOf(p2) + 1;
            }
            p1 = this.vmInRangeRound(p1, 1, 255, "INSTR"); // p1=startpos
            this.vmAssertString(p3, "INSTR");
            return p2.indexOf(p3, p1) + 1; // p2=string, p3=search string
        };
        CpcVm.prototype["int"] = function (n) {
            this.vmAssertNumber(n, "INT");
            return Math.floor(n);
        };
        CpcVm.prototype.joy = function (joy) {
            joy = this.vmInRangeRound(joy, 0, 1, "JOY");
            return this.keyboard.getJoyState(joy);
        };
        CpcVm.prototype.key = function (token, s) {
            token = this.vmRound(token, "KEY");
            if (token >= 128 && token <= 159) {
                token -= 128;
            }
            token = this.vmInRangeRound(token, 0, 31, "KEY"); // round again, but we want the check
            this.vmAssertString(s, "KEY");
            this.keyboard.setExpansionToken(token, s);
        };
        CpcVm.prototype.keyDef = function (cpcKey, repeat, normal, shift, ctrl) {
            var options = {
                cpcKey: this.vmInRangeRound(cpcKey, 0, 79, "KEY DEF"),
                repeat: this.vmInRangeRound(repeat, 0, 1, "KEY DEF"),
                normal: (normal !== undefined) ? this.vmInRangeRound(normal, 0, 255, "KEY DEF") : undefined,
                shift: (shift !== undefined) ? this.vmInRangeRound(shift, 0, 255, "KEY DEF") : undefined,
                ctrl: (ctrl !== undefined) ? this.vmInRangeRound(ctrl, 0, 255, "KEY DEF") : undefined
            };
            this.keyboard.setCpcKeyExpansion(options);
        };
        CpcVm.prototype.left$ = function (s, len) {
            this.vmAssertString(s, "LEFT$");
            len = this.vmInRangeRound(len, 0, 255, "LEFT$");
            return s.substr(0, len);
        };
        CpcVm.prototype.len = function (s) {
            this.vmAssertString(s, "LEN");
            return s.length;
        };
        // let
        CpcVm.prototype.vmLineInputCallback = function () {
            var inputParas = this.vmGetStopObject().paras, input = inputParas.input;
            Utils_1.Utils.console.log("vmLineInputCallback:", input);
            this.vmSetInputValues([input]);
            this.cursor(inputParas.stream, 0);
            return true;
        };
        CpcVm.prototype.lineInput = function (stream, noCRLF, msg, varType) {
            stream = this.vmInRangeRound(stream, 0, 9, "LINE INPUT");
            if (stream < 8) {
                this.print(stream, msg);
                var type = this.vmDetermineVarType(varType);
                if (type !== "$") { // not string?
                    this.print(stream, "\r\n");
                    throw this.vmComposeError(Error(), 13, "LINE INPUT " + type); // Type mismatch
                }
                this.cursor(stream, 1);
                this.vmStop("waitInput", 45, false, {
                    command: "lineinput",
                    stream: stream,
                    message: msg,
                    noCRLF: noCRLF,
                    fnInputCallback: this.vmLineInputCallback.bind(this),
                    input: "",
                    line: this.line // to repeat in case of break
                });
            }
            else if (stream === 8) {
                this.vmSetInputValues(["I am the printer!"]);
            }
            else if (stream === 9) {
                if (!this.inFile.open) {
                    throw this.vmComposeError(Error(), 31, "LINE INPUT #" + stream); // File not open
                }
                else if (this.eof()) {
                    throw this.vmComposeError(Error(), 24, "LINE INPUT #" + stream); // EOF met
                }
                this.vmSetInputValues(this.inFile.fileData.splice(0, arguments.length - 3)); // always 1 element
            }
        };
        CpcVm.prototype.list = function (stream, first, last) {
            stream = this.vmInRangeRound(stream, 0, 9, "LIST");
            if (first === undefined) {
                first = 1;
                if (last === undefined) { // no first and last parameter?
                    last = 65535;
                }
            }
            else {
                first = this.vmInRangeRound(first, 1, 65535, "LIST");
                if (last === undefined) { // just one parameter?
                    last = first;
                }
                else { // range
                    last = this.vmInRangeRound(last, 1, 65535, "LIST");
                }
            }
            if (stream === 9) {
                if (!this.outFile.open) { // catch here
                    throw this.vmComposeError(Error(), 31, "LIST #" + stream); // File not open
                }
            }
            this.vmStop("list", 90, false, {
                command: "list",
                stream: stream,
                first: first,
                last: last,
                line: this.line // unused
            });
        };
        CpcVm.prototype.vmLoadCallback = function (input, meta) {
            var inFile = this.inFile;
            var putInMemory = false;
            if (input !== null && meta) {
                if (meta.typeString === "B" || inFile.start !== undefined) { // only for binary files or when a load address is specified (feature)
                    var start = inFile.start !== undefined ? inFile.start : Number(meta.start);
                    var length_1 = Number(meta.length); // we do not really need the length from metadata
                    if (isNaN(length_1)) {
                        length_1 = input.length; // only valid after atob()
                    }
                    if (Utils_1.Utils.debug > 1) {
                        Utils_1.Utils.console.debug("vmLoadCallback:", inFile.name + ": putting data in memory", start, "-", start + length_1);
                    }
                    for (var i = 0; i < length_1; i += 1) {
                        var byte = input.charCodeAt(i);
                        this.poke((start + i) & 0xffff, byte); // eslint-disable-line no-bitwise
                    }
                    putInMemory = true;
                }
            }
            this.closein();
            return putInMemory;
        };
        CpcVm.prototype.load = function (name, start) {
            var inFile = this.inFile;
            name = this.vmAdaptFilename(name, "LOAD");
            if (start !== undefined) {
                start = this.vmRound2Complement(start, "LOAD");
            }
            this.closein();
            inFile.open = true;
            inFile.command = "load";
            inFile.name = name;
            inFile.start = start;
            inFile.fnFileCallback = this.fnLoadHandler;
            this.vmStop("fileLoad", 90);
        };
        CpcVm.prototype.vmLocate = function (stream, pos, vpos) {
            var win = this.windowDataList[stream];
            win.pos = pos - 1;
            win.vpos = vpos - 1;
        };
        CpcVm.prototype.locate = function (stream, pos, vpos) {
            stream = this.vmInRangeRound(stream, 0, 7, "LOCATE");
            pos = this.vmInRangeRound(pos, 1, 255, "LOCATE");
            vpos = this.vmInRangeRound(vpos, 1, 255, "LOCATE");
            this.vmDrawUndrawCursor(stream); // undraw
            this.vmLocate(stream, pos, vpos);
            this.vmDrawUndrawCursor(stream); // draw
        };
        CpcVm.prototype.log = function (n) {
            this.vmAssertNumber(n, "LOG");
            return Math.log(n);
        };
        CpcVm.prototype.log10 = function (n) {
            this.vmAssertNumber(n, "LOG10");
            return Math.log10(n);
        };
        CpcVm.fnLowerCase = function (match) {
            return match.toLowerCase();
        };
        CpcVm.prototype.lower$ = function (s) {
            this.vmAssertString(s, "LOWER$");
            s = s.replace(/[A-Z]/g, CpcVm.fnLowerCase); // replace only characters A-Z
            return s;
        };
        CpcVm.prototype.mask = function (mask, first) {
            if (mask !== undefined) {
                mask = this.vmInRangeRound(mask, 0, 255, "MASK");
                this.canvas.setMask(mask);
            }
            if (first !== undefined) {
                first = this.vmInRangeRound(first, 0, 1, "MASK");
                this.canvas.setMaskFirst(first);
            }
        };
        CpcVm.prototype.max = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            for (var i = 0; i < args.length; i += 1) {
                this.vmAssertNumber(args[i], "MAX");
            }
            return Math.max.apply(null, args);
        };
        CpcVm.prototype.memory = function (n) {
            n = this.vmInRangeRound(n, -32768, 65535, "MEMORY");
            if (n < CpcVm.minHimem || n > this.minCharHimem) {
                throw this.vmComposeError(Error(), 7, "MEMORY " + n); // Memory full
            }
            this.himemValue = n;
        };
        CpcVm.prototype.merge = function (name) {
            var inFile = this.inFile;
            name = this.vmAdaptFilename(name, "MERGE");
            this.closein();
            inFile.open = true;
            inFile.command = "merge";
            inFile.name = name;
            inFile.fnFileCallback = this.fnCloseinHandler;
            this.vmStop("fileLoad", 90);
        };
        CpcVm.prototype.mid$ = function (s, start, len) {
            this.vmAssertString(s, "MID$");
            start = this.vmInRangeRound(start, 1, 255, "MID$");
            if (len !== undefined) {
                len = this.vmInRangeRound(len, 0, 255, "MID$");
            }
            return s.substr(start - 1, len);
        };
        CpcVm.prototype.mid$Assign = function (s, start, len, newString) {
            this.vmAssertString(s, "MID$");
            this.vmAssertString(newString, "MID$");
            start = this.vmInRangeRound(start, 1, 255, "MID$") - 1;
            len = (len !== undefined) ? this.vmInRangeRound(len, 0, 255, "MID$") : newString.length;
            if (len > newString.length) {
                len = newString.length;
            }
            if (len > s.length - start) {
                len = s.length - start;
            }
            s = s.substr(0, start) + newString.substr(0, len) + s.substr(start + len);
            return s;
        };
        CpcVm.prototype.min = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            for (var i = 0; i < args.length; i += 1) {
                this.vmAssertNumber(args[i], "MIN");
            }
            return Math.min.apply(null, args);
        };
        // mod
        // changing the mode without clearing the screen (called by rsx |MODE)
        CpcVm.prototype.vmChangeMode = function (mode) {
            this.modeValue = mode;
            var winData = CpcVm.winData[this.modeValue];
            /*
            Utils.console.log("rsxMode: (test)", mode);
            */
            for (var i = 0; i < CpcVm.streamCount - 2; i += 1) { // for window streams
                var win = this.windowDataList[i];
                Object.assign(win, winData);
            }
            this.canvas.changeMode(mode);
        };
        CpcVm.prototype.mode = function (mode) {
            mode = this.vmInRangeRound(mode, 0, 3, "MODE");
            this.modeValue = mode;
            this.vmResetWindowData(false); // do not reset pen and paper
            this.outBuffer = ""; // clear console
            this.canvas.setMode(mode); // does not clear canvas
            this.canvas.clearFullWindow(); // always with paper 0 (SCR MODE CLEAR)
        };
        CpcVm.prototype.move = function (x, y, gPen, gColMode) {
            x = this.vmInRangeRound(x, -32768, 32767, "MOVE");
            y = this.vmInRangeRound(y, -32768, 32767, "MOVE");
            this.vmDrawMovePlot("MOVE", gPen, gColMode);
            this.canvas.move(x, y);
        };
        CpcVm.prototype.mover = function (x, y, gPen, gColMode) {
            x = this.vmInRangeRound(x, -32768, 32767, "MOVER");
            y = this.vmInRangeRound(y, -32768, 32767, "MOVER");
            this.vmDrawMovePlot("MOVER", gPen, gColMode);
            this.canvas.mover(x, y);
        };
        CpcVm.prototype["new"] = function () {
            this.clear();
            var lineParas = {
                command: "new",
                stream: 0,
                first: 0,
                last: 0,
                line: this.line // unused
            };
            this.vmStop("new", 90, false, lineParas);
        };
        CpcVm.prototype.onBreakCont = function () {
            this.breakGosubLine = -1;
            this.breakResumeLine = 0;
        };
        CpcVm.prototype.onBreakGosub = function (line) {
            this.breakGosubLine = line;
            this.breakResumeLine = 0;
        };
        CpcVm.prototype.onBreakStop = function () {
            this.breakGosubLine = 0;
            this.breakResumeLine = 0;
        };
        CpcVm.prototype.onErrorGoto = function (line) {
            this.errorGotoLine = line;
            if (!line && this.errorResumeLine) { // line=0 but an error to resume?
                throw this.vmComposeError(Error(), this.errorCode, "ON ERROR GOTO without RESUME from " + this.errorLine);
            }
        };
        CpcVm.prototype.onGosub = function (retLabel, n) {
            var args = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                args[_i - 2] = arguments[_i];
            }
            n = this.vmInRangeRound(n, 0, 255, "ON GOSUB");
            var line;
            if (!n || n > args.length) { // out of range? => continue with line after onGosub
                if (Utils_1.Utils.debug > 0) {
                    Utils_1.Utils.console.debug("onGosub: out of range: n=" + n + " in " + this.line);
                }
                line = retLabel;
            }
            else {
                line = args[n - 1]; // n=1...
                if (this.gosubStack.length >= this.maxGosubStackLength) { // limit stack size (not necessary in JS, but...)
                    throw this.vmComposeError(Error(), 7, "ON GOSUB " + n); // Memory full
                }
                this.gosubStack.push(retLabel);
            }
            this.vmGotoLine(line, "onGosub (n=" + n + ", ret=" + retLabel + ", line=" + line + ")");
        };
        CpcVm.prototype.onGoto = function (retLabel, n) {
            var args = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                args[_i - 2] = arguments[_i];
            }
            n = this.vmInRangeRound(n, 0, 255, "ON GOTO");
            var line;
            if (!n || n > args.length) { // out of range? => continue with line after onGoto
                if (Utils_1.Utils.debug > 0) {
                    Utils_1.Utils.console.debug("onGoto: out of range: n=" + n + " in " + this.line);
                }
                line = retLabel;
            }
            else {
                line = args[n - 1];
            }
            this.vmGotoLine(line, "onGoto (n=" + n + ", ret=" + retLabel + ", line=" + line + ")");
        };
        CpcVm.fnChannel2ChannelIndex = function (channel) {
            if (channel === 4) {
                channel = 2;
            }
            else {
                channel -= 1;
            }
            return channel;
        };
        CpcVm.prototype.onSqGosub = function (channel, line) {
            channel = this.vmInRangeRound(channel, 1, 4, "ON SQ GOSUB");
            if (channel === 3) {
                throw this.vmComposeError(Error(), 5, "ON SQ GOSUB " + channel); // Improper argument
            }
            channel = CpcVm.fnChannel2ChannelIndex(channel);
            var sqTimer = this.sqTimer[channel];
            sqTimer.line = line;
            sqTimer.active = true;
            sqTimer.repeat = true; // means reloaded for sq
        };
        CpcVm.prototype.vmOpeninCallback = function (input) {
            if (input !== null) {
                input = input.replace(/\r\n/g, "\n"); // remove CR (maybe from ASCII file in "binary" form)
                if (input.endsWith("\n")) {
                    input = input.substr(0, input.length - 1); // remove last "\n" (TTT: also for data files?)
                }
                var inFile = this.inFile;
                inFile.fileData = input.split("\n");
            }
            else {
                this.closein();
            }
        };
        CpcVm.prototype.openin = function (name) {
            name = this.vmAdaptFilename(name, "OPENIN");
            var inFile = this.inFile;
            if (!inFile.open) {
                if (name) {
                    inFile.open = true;
                    inFile.command = "openin";
                    inFile.name = name;
                    inFile.fnFileCallback = this.fnOpeninHandler;
                    this.vmStop("fileLoad", 90);
                }
            }
            else {
                throw this.vmComposeError(Error(), 27, "OPENIN " + inFile.name); // file already open
            }
        };
        CpcVm.prototype.openout = function (name) {
            var outFile = this.outFile;
            if (outFile.open) {
                throw this.vmComposeError(Error(), 27, "OPENOUT " + outFile.name); // file already open
            }
            name = this.vmAdaptFilename(name, "OPENOUT");
            outFile.open = true;
            outFile.command = "openout";
            outFile.name = name;
            outFile.fileData = []; // no data yet
            outFile.typeString = "A"; // ASCII
        };
        // or
        CpcVm.prototype.origin = function (xOff, yOff, xLeft, xRight, yTop, yBottom) {
            xOff = this.vmInRangeRound(xOff, -32768, 32767, "ORIGIN");
            yOff = this.vmInRangeRound(yOff, -32768, 32767, "ORIGIN");
            this.canvas.setOrigin(xOff, yOff);
            if (xLeft !== undefined) {
                xLeft = this.vmInRangeRound(xLeft, -32768, 32767, "ORIGIN");
                xRight = this.vmInRangeRound(xRight, -32768, 32767, "ORIGIN");
                yTop = this.vmInRangeRound(yTop, -32768, 32767, "ORIGIN");
                yBottom = this.vmInRangeRound(yBottom, -32768, 32767, "ORIGIN");
                this.canvas.setGWindow(xLeft, xRight, yTop, yBottom);
            }
        };
        CpcVm.prototype.vmSetRamSelect = function (bank) {
            // we support RAM select for banks 0,4... (so not for 1 to 3)
            if (!bank) {
                this.ramSelect = 0;
            }
            else if (bank >= 4) {
                this.ramSelect = bank - 3; // bank 4 gets position 1
            }
        };
        CpcVm.prototype.vmSetCrtcData = function (byte) {
            var crtcReg = this.crtcReg, crtcData = this.crtcData;
            crtcData[crtcReg] = byte;
            if (crtcReg === 12 || crtcReg === 13) { // screen offset changed
                var offset = (((crtcData[12] || 0) & 0x03) << 9) | ((crtcData[13] || 0) << 1); // eslint-disable-line no-bitwise
                this.vmSetScreenOffset(offset);
            }
        };
        CpcVm.prototype.out = function (port, byte) {
            port = this.vmRound2Complement(port, "OUT");
            byte = this.vmInRangeRound(byte, 0, 255, "OUT");
            var portHigh = port >> 8; // eslint-disable-line no-bitwise
            if (portHigh === 0x7f) { // 7Fxx = RAM select
                this.vmSetRamSelect(byte - 0xc0);
            }
            else if (portHigh === 0xbc) { // limited support for CRTC 12, 13
                this.crtcReg = byte % 14;
            }
            else if (portHigh === 0xbd) {
                this.vmSetCrtcData(byte);
                this.crtcData[this.crtcReg] = byte;
            }
            else if (Utils_1.Utils.debug > 0) {
                Utils_1.Utils.console.debug("OUT", Number(port).toString(16), byte, ": unknown port");
            }
        };
        CpcVm.prototype.paper = function (stream, paper) {
            stream = this.vmInRangeRound(stream, 0, 7, "PAPER");
            paper = this.vmInRangeRound(paper, 0, 15, "PAPER");
            var win = this.windowDataList[stream];
            win.paper = paper;
        };
        CpcVm.prototype.vmGetCharDataByte = function (addr) {
            var dataPos = (addr - 1 - this.minCharHimem) % 8, char = this.minCustomChar + (addr - 1 - dataPos - this.minCharHimem) / 8, charData = this.canvas.getCharData(char);
            return charData[dataPos];
        };
        CpcVm.prototype.vmSetCharDataByte = function (addr, byte) {
            var dataPos = (addr - 1 - this.minCharHimem) % 8, char = this.minCustomChar + (addr - 1 - dataPos - this.minCharHimem) / 8, charData = Object.assign({}, this.canvas.getCharData(char)); // we need a copy to not modify original data
            charData[dataPos] = byte; // change one byte
            this.canvas.setCustomChar(char, charData);
        };
        CpcVm.prototype.peek = function (addr) {
            addr = this.vmRound2Complement(addr, "PEEK");
            // check two higher bits of 16 bit address to get 16K page
            var page = addr >> 14; // eslint-disable-line no-bitwise
            var byte;
            if (page === this.screenPage) { // screen memory page?
                byte = this.canvas.getByte(addr); // get byte from screen memory
                if (byte === null) { // byte not visible on screen?
                    byte = this.mem[addr] || 0; // get it from our memory
                }
            }
            else if (page === 1 && this.ramSelect) { // memory mapped RAM with page 1=0x4000..0x7fff?
                addr = (this.ramSelect - 1) * 0x4000 + 0x10000 + addr;
                byte = this.mem[addr] || 0;
            }
            else if (addr > this.minCharHimem && addr <= this.maxCharHimem) { // character map?
                byte = this.vmGetCharDataByte(addr);
            }
            else {
                byte = this.mem[addr] || 0;
            }
            return byte;
        };
        CpcVm.prototype.pen = function (stream, pen, transparent) {
            stream = this.vmInRangeRound(stream, 0, 7, "PEN");
            if (pen !== undefined) {
                var win = this.windowDataList[stream];
                pen = this.vmInRangeRound(pen, 0, 15, "PEN");
                win.pen = pen;
            }
            if (transparent !== undefined) {
                transparent = this.vmInRangeRound(transparent, 0, 1, "PEN");
                this.vmSetTransparentMode(stream, transparent);
            }
        };
        CpcVm.prototype.pi = function () {
            return Math.PI; // or less precise: 3.14159265
        };
        CpcVm.prototype.plot = function (x, y, gPen, gColMode) {
            x = this.vmInRangeRound(x, -32768, 32767, "PLOT");
            y = this.vmInRangeRound(y, -32768, 32767, "PLOT");
            this.vmDrawMovePlot("PLOT", gPen, gColMode);
            this.canvas.plot(x, y);
        };
        CpcVm.prototype.plotr = function (x, y, gPen, gColMode) {
            x = this.vmInRangeRound(x, -32768, 32767, "PLOTR");
            y = this.vmInRangeRound(y, -32768, 32767, "PLOTR");
            this.vmDrawMovePlot("PLOTR", gPen, gColMode);
            this.canvas.plotr(x, y);
        };
        CpcVm.prototype.poke = function (addr, byte) {
            addr = this.vmRound2Complement(addr, "POKE address");
            byte = this.vmInRangeRound(byte, 0, 255, "POKE byte");
            // check two higher bits of 16 bit address to get 16K page
            var page = addr >> 14; // eslint-disable-line no-bitwise
            if (page === 1 && this.ramSelect) { // memory mapped RAM with page 1=0x4000..0x7fff?
                addr = (this.ramSelect - 1) * 0x4000 + 0x10000 + addr;
            }
            else if (page === this.screenPage) { // screen memory page?
                this.canvas.setByte(addr, byte); // write byte also to screen memory
            }
            else if (addr > this.minCharHimem && addr <= this.maxCharHimem) { // character map?
                this.vmSetCharDataByte(addr, byte);
            }
            this.mem[addr] = byte;
        };
        /*
        private static vmGetPosFromFileData(fileData: string[]) {
            const allFileData =	fileData.join(""),
                lastLfPos = allFileData.lastIndexOf("\n"),
                lastCrPos = allFileData.lastIndexOf("\r"),
                lastLfOrCrPos = Math.max(lastLfPos, lastCrPos);
    
            return lastLfOrCrPos >= 0 ? allFileData.length - lastLfOrCrPos : allFileData.length;
        }
    
        private static vmGetPosFromFileData(fileData: string[]) {
            const allFileData =	fileData.join(""),
                lastCrPos = allFileData.lastIndexOf("\r");
    
            return lastCrPos >= 0 ? allFileData.length - lastCrPos : allFileData.length;
        }
        */
        CpcVm.prototype.pos = function (stream) {
            stream = this.vmInRangeRound(stream, 0, 9, "POS");
            var pos;
            if (stream < 8) {
                pos = this.vmGetAllowedPosOrVpos(stream, false) + 1; // get allowed pos
            }
            else if (stream === 8) { // printer position (starting with 1)
                pos = 1; // TODO
            }
            else { // stream 9: number of characters written since last CR (\r), \n in CpcEmu, starting with one)
                var win = this.windowDataList[stream];
                pos = win.pos + 1;
            }
            return pos;
        };
        CpcVm.prototype.vmGetAllowedPosOrVpos = function (stream, vpos) {
            var win = this.windowDataList[stream], left = win.left, right = win.right, top = win.top, bottom = win.bottom;
            var x = win.pos, y = win.vpos;
            if (x > (right - left)) {
                y += 1;
                x = 0;
            }
            if (x < 0) {
                y -= 1;
                x = right - left;
            }
            if (!vpos) {
                return x;
            }
            if (y < 0) {
                y = 0;
            }
            if (y > (bottom - top)) {
                y = bottom - top;
            }
            return y;
        };
        CpcVm.prototype.vmMoveCursor2AllowedPos = function (stream) {
            var win = this.windowDataList[stream], left = win.left, right = win.right, top = win.top, bottom = win.bottom;
            var x = win.pos, y = win.vpos;
            if (x > (right - left)) {
                y += 1;
                x = 0;
                this.outBuffer += "\n";
            }
            if (x < 0) {
                y -= 1;
                x = right - left;
            }
            if (y < 0) {
                y = 0;
                if (stream < 8) {
                    this.canvas.windowScrollDown(left, right, top, bottom, win.paper);
                }
            }
            if (y > (bottom - top)) {
                y = bottom - top;
                if (stream < 8) {
                    this.canvas.windowScrollUp(left, right, top, bottom, win.paper);
                }
            }
            win.pos = x;
            win.vpos = y;
        };
        CpcVm.prototype.vmPrintChars = function (stream, str) {
            var win = this.windowDataList[stream];
            if (!win.textEnabled) {
                if (Utils_1.Utils.debug > 0) {
                    Utils_1.Utils.console.debug("vmPrintChars: text output disabled:", str);
                }
                return;
            }
            // put cursor in next line if string does not fit in line any more
            this.vmMoveCursor2AllowedPos(stream);
            if (win.pos && (win.pos + str.length > (win.right + 1 - win.left))) {
                win.pos = 0;
                win.vpos += 1; // "\r\n", newline if string does not fit in line
            }
            for (var i = 0; i < str.length; i += 1) {
                var char = CpcVm.vmGetCpcCharCode(str.charCodeAt(i));
                this.vmMoveCursor2AllowedPos(stream);
                this.canvas.printChar(char, win.pos + win.left, win.vpos + win.top, win.pen, win.paper, win.transparent);
                win.pos += 1;
            }
        };
        CpcVm.prototype.vmControlSymbol = function (para) {
            var paraList = [];
            for (var i = 0; i < para.length; i += 1) {
                paraList.push(para.charCodeAt(i));
            }
            var char = paraList[0];
            if (char >= this.minCustomChar) {
                this.symbol.apply(this, paraList);
            }
            else {
                Utils_1.Utils.console.log("vmControlSymbol: define SYMBOL ignored:", char);
            }
        };
        CpcVm.prototype.vmControlWindow = function (para, stream) {
            var paraList = [];
            // args in para: left, right, top, bottom (all -1 !)
            for (var i = 0; i < para.length; i += 1) {
                var value = para.charCodeAt(i) + 1; // control ranges start with 0!
                value %= 256;
                if (!value) {
                    value = 1; // avoid error
                }
                paraList.push(value);
            }
            this.window(stream, paraList[0], paraList[1], paraList[2], paraList[3]);
        };
        CpcVm.prototype.vmHandleControlCode = function (code, para, stream) {
            var win = this.windowDataList[stream], out = ""; // no controls for text window
            switch (code) {
                case 0x00: // NUL, ignore
                    break;
                case 0x01: // SOH 0-255
                    this.vmPrintChars(stream, para);
                    break;
                case 0x02: // STX
                    win.cursorEnabled = false; // cursor disable (user)
                    break;
                case 0x03: // ETX
                    win.cursorEnabled = true; // cursor enable (user)
                    break;
                case 0x04: // EOT 0-3 (on CPC: 0-2, 3 is ignored; really mod 4)
                    this.mode(para.charCodeAt(0) & 0x03); // eslint-disable-line no-bitwise
                    break;
                case 0x05: // ENQ
                    this.vmPrintGraphChars(para);
                    break;
                case 0x06: // ACK
                    win.cursorEnabled = true;
                    win.textEnabled = true;
                    break;
                case 0x07: // BEL
                    this.sound(135, 90, 20, 12, 0, 0, 0);
                    break;
                case 0x08: // BS
                    this.vmMoveCursor2AllowedPos(stream);
                    win.pos -= 1;
                    break;
                case 0x09: // TAB
                    this.vmMoveCursor2AllowedPos(stream);
                    win.pos += 1;
                    break;
                case 0x0a: // LF
                    this.vmMoveCursor2AllowedPos(stream);
                    win.vpos += 1;
                    break;
                case 0x0b: // VT
                    this.vmMoveCursor2AllowedPos(stream);
                    win.vpos -= 1;
                    break;
                case 0x0c: // FF
                    this.cls(stream);
                    break;
                case 0x0d: // CR
                    this.vmMoveCursor2AllowedPos(stream);
                    win.pos = 0;
                    break;
                case 0x0e: // SO
                    this.paper(stream, para.charCodeAt(0) & 0x0f); // eslint-disable-line no-bitwise
                    break;
                case 0x0f: // SI
                    this.pen(stream, para.charCodeAt(0) & 0x0f); // eslint-disable-line no-bitwise
                    break;
                case 0x10: // DLE
                    this.vmMoveCursor2AllowedPos(stream);
                    this.canvas.fillTextBox(win.left + win.pos, win.top + win.vpos, 1, 1, win.paper); // clear character under cursor
                    break;
                case 0x11: // DC1
                    this.vmMoveCursor2AllowedPos(stream);
                    this.canvas.fillTextBox(win.left, win.top + win.vpos, win.pos + 1, 1, win.paper); // clear line up to cursor
                    break;
                case 0x12: // DC2
                    this.vmMoveCursor2AllowedPos(stream);
                    this.canvas.fillTextBox(win.left + win.pos, win.top + win.vpos, win.right - win.left + 1 - win.pos, 1, win.paper); // clear line from cursor
                    break;
                case 0x13: // DC3
                    this.vmMoveCursor2AllowedPos(stream);
                    this.canvas.fillTextBox(win.left, win.top, win.right - win.left + 1, win.top - win.vpos, win.paper); // clear window up to cursor line -1
                    this.canvas.fillTextBox(win.left, win.top + win.vpos, win.pos + 1, 1, win.paper); // clear line up to cursor (DC1)
                    break;
                case 0x14: // DC4
                    this.vmMoveCursor2AllowedPos(stream);
                    this.canvas.fillTextBox(win.left + win.pos, win.top + win.vpos, win.right - win.left + 1 - win.pos, 1, win.paper); // clear line from cursor (DC2)
                    this.canvas.fillTextBox(win.left, win.top + win.vpos + 1, win.right - win.left + 1, win.bottom - win.top - win.vpos, win.paper); // clear window from cursor line +1
                    break;
                case 0x15: // NAK
                    win.cursorEnabled = false;
                    win.textEnabled = false;
                    break;
                case 0x16: // SYN
                    // parameter: only bit 0 relevant (ROM: &14E3)
                    this.vmSetTransparentMode(stream, para.charCodeAt(0) & 0x01); // eslint-disable-line no-bitwise
                    break;
                case 0x17: // ETB
                    this.canvas.setGColMode(para.charCodeAt(0) % 4);
                    break;
                case 0x18: // CAN
                    this.vmTxtInverse(stream);
                    break;
                case 0x19: // EM
                    this.vmControlSymbol(para);
                    break;
                case 0x1a: // SUB
                    this.vmControlWindow(para, stream);
                    break;
                case 0x1b: // ESC, ignored
                    break;
                case 0x1c: // FS
                    this.ink(para.charCodeAt(0) & 0x0f, para.charCodeAt(1) & 0x1f, para.charCodeAt(2) & 0x1f); // eslint-disable-line no-bitwise
                    break;
                case 0x1d: // GS
                    this.border(para.charCodeAt(0) & 0x1f, para.charCodeAt(1) & 0x1f); // eslint-disable-line no-bitwise
                    break;
                case 0x1e: // RS
                    win.pos = 0;
                    win.vpos = 0;
                    break;
                case 0x1f: // US
                    this.vmLocate(stream, para.charCodeAt(0), para.charCodeAt(1));
                    break;
                default:
                    Utils_1.Utils.console.warn("vmHandleControlCode: Unknown control code:", code);
                    break;
            }
            return out;
        };
        CpcVm.prototype.vmPrintCharsOrControls = function (stream, str) {
            var buf = "", out = "", i = 0;
            while (i < str.length) {
                var code = str.charCodeAt(i);
                i += 1;
                if (code <= 0x1f) { // control code?
                    if (out !== "") {
                        this.vmPrintChars(stream, out); // print chars collected so far
                        out = "";
                    }
                    var paraCount = CpcVm.controlCodeParameterCount[code];
                    if (i + paraCount <= str.length) {
                        out += this.vmHandleControlCode(code, str.substr(i, paraCount), stream);
                        i += paraCount;
                    }
                    else {
                        buf = str.substr(i - 1); // not enough parameters, put code in buffer and wait for more
                        i = str.length;
                    }
                }
                else {
                    out += String.fromCharCode(code);
                }
            }
            if (out !== "") {
                this.vmPrintChars(stream, out); // print chars collected so far
            }
            return buf;
        };
        CpcVm.prototype.vmPrintGraphChars = function (str) {
            for (var i = 0; i < str.length; i += 1) {
                var char = CpcVm.vmGetCpcCharCode(str.charCodeAt(i));
                this.canvas.printGChar(char);
            }
        };
        CpcVm.prototype.print = function (stream) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            stream = this.vmInRangeRound(stream, 0, 9, "PRINT");
            var win = this.windowDataList[stream];
            if (stream < 8) {
                if (!win.tag) {
                    this.vmDrawUndrawCursor(stream); // undraw
                }
            }
            else if (stream === 8) {
                this.vmNotImplemented("PRINT # " + stream);
            }
            else if (stream === 9) {
                if (!this.outFile.open) {
                    throw this.vmComposeError(Error(), 31, "PRINT #" + stream); // File not open
                }
                this.outFile.stream = stream;
            }
            var buf = this.printControlBuf;
            for (var i = 0; i < args.length; i += 1) {
                var arg = args[i];
                var str = void 0;
                if (typeof arg === "object") { // delayed call for spc(), tab(), commaTab() with side effect (position)
                    var specialArgs = arg.args;
                    switch (arg.type) {
                        case "commaTab":
                            str = this.commaTab(stream);
                            break;
                        case "spc":
                            str = this.spc(stream, specialArgs[0]);
                            break;
                        case "tab":
                            str = this.tab(stream, specialArgs[0]);
                            break;
                        default:
                            throw this.vmComposeError(Error(), 5, "PRINT " + arg.type); // Improper argument
                    }
                }
                else if (typeof arg === "number") {
                    str = ((arg >= 0) ? " " : "") + String(arg) + " ";
                }
                else { // e.g. string
                    str = String(arg);
                }
                if (stream < 8) {
                    if (win.tag) {
                        this.vmPrintGraphChars(str);
                    }
                    else {
                        if (buf.length) {
                            str = buf + str;
                        }
                        buf = this.vmPrintCharsOrControls(stream, str);
                    }
                    this.outBuffer += str; // console
                }
                else { // stream === 9
                    var lastCrPos = buf.lastIndexOf("\r");
                    if (lastCrPos >= 0) {
                        win.pos = str.length - lastCrPos; // number of characters written since last CR (\r)
                    }
                    else {
                        win.pos += str.length;
                    }
                    //TTT really replace?
                    if (str === "\r\n") { // for now we replace CRLF by LF
                        str = "\n";
                        win.pos = 0;
                    }
                    if (win.pos >= win.right) {
                        str = "\n" + str; // e.g. after tab(256)
                        win.pos = 0;
                    }
                    buf += str;
                }
            }
            if (stream < 8) {
                if (!win.tag) {
                    this.vmDrawUndrawCursor(stream); // draw cursor
                    this.printControlBuf = buf; // maybe some parameters missing
                }
            }
            else if (stream === 9) {
                this.outFile.fileData.push(buf);
            }
        };
        CpcVm.prototype.rad = function () {
            this.degFlag = false;
        };
        // https://en.wikipedia.org/wiki/Jenkins_hash_function
        CpcVm.vmHashCode = function (s) {
            var hash = 0;
            /* eslint-disable no-bitwise */
            for (var i = 0; i < s.length; i += 1) {
                hash += s.charCodeAt(i);
                hash += hash << 10;
                hash ^= hash >> 6;
            }
            hash += hash << 3;
            hash ^= hash >> 11;
            hash += hash << 15;
            /* eslint-enable no-bitwise */
            return hash;
        };
        CpcVm.prototype.vmRandomizeCallback = function () {
            var inputParas = this.vmGetStopObject().paras, input = inputParas.input, value = CpcVm.vmVal(input); // convert to number (also binary, hex)
            var inputOk = true;
            Utils_1.Utils.console.log("vmRandomizeCallback:", input);
            if (isNaN(value)) {
                inputOk = false;
                inputParas.input = "";
                this.print(inputParas.stream, inputParas.message);
            }
            else {
                this.vmSetInputValues([value]);
            }
            return inputOk;
        };
        CpcVm.prototype.randomize = function (n) {
            var rndInit = 0x89656c07, // an arbitrary 32 bit number <> 0 (this one is used by the CPC)
            stream = 0;
            if (n === undefined) { // no arguments? input...
                var msg = "Random number seed ? ";
                this.print(stream, msg);
                var inputParas = {
                    command: "randomize",
                    stream: stream,
                    message: msg,
                    fnInputCallback: this.vmRandomizeCallback.bind(this),
                    input: "",
                    line: this.line // to repeat in case of break
                };
                this.vmStop("waitInput", 45, false, inputParas);
            }
            else { // n can also be floating point, so compute a hash value of n
                this.vmAssertNumber(n, "RANDOMIZE");
                n = CpcVm.vmHashCode(String(n));
                if (n === 0) {
                    n = rndInit;
                }
                if (Utils_1.Utils.debug > 0) {
                    Utils_1.Utils.console.debug("randomize:", n);
                }
                this.random.init(n);
            }
        };
        CpcVm.prototype.read = function (varType) {
            var type = this.vmDetermineVarType(varType);
            var item;
            if (this.dataIndex < this.dataList.length) {
                var dataItem = this.dataList[this.dataIndex];
                this.dataIndex += 1;
                if (dataItem === undefined) { // empty arg?
                    item = type === "$" ? "" : 0; // set arg depending on expected type
                }
                else if (type !== "$") { // not string expected? => convert to number (also binary, hex)
                    // Note : Using a number variable to read a string would cause a syntax error on a real CPC. We cannot detect it since we get always strings.
                    item = this.val(String(dataItem));
                }
                else {
                    item = dataItem;
                }
                item = this.vmAssign(varType, item); // maybe rounding for type I
            }
            else {
                throw this.vmComposeError(Error(), 4, "READ"); // DATA exhausted
            }
            return item;
        };
        CpcVm.prototype.release = function (channelMask) {
            channelMask = this.vmInRangeRound(channelMask, 0, 7, "RELEASE");
            this.soundClass.release(channelMask);
        };
        // rem
        CpcVm.prototype.remain = function (timerNumber) {
            timerNumber = this.vmInRangeRound(timerNumber, 0, 3, "REMAIN");
            var timerEntry = this.timerList[timerNumber];
            var remain = 0;
            if (timerEntry.active) {
                remain = timerEntry.nextTimeMs - Date.now();
                remain /= CpcVm.frameTimeMs;
                timerEntry.active = false; // switch off timer
            }
            return remain;
        };
        CpcVm.prototype.renum = function (newLine, oldLine, step, keep) {
            if (newLine === void 0) { newLine = 10; }
            if (oldLine === void 0) { oldLine = 1; }
            if (step === void 0) { step = 10; }
            if (keep === void 0) { keep = 65535; }
            newLine = this.vmInRangeRound(newLine, 1, 65535, "RENUM");
            oldLine = this.vmInRangeRound(oldLine, 1, 65535, "RENUM");
            step = this.vmInRangeRound(step, 1, 65535, "RENUM");
            keep = this.vmInRangeRound(keep, 1, 65535, "RENUM");
            var lineRenumParas = {
                command: "renum",
                stream: 0,
                line: this.line,
                newLine: newLine,
                oldLine: oldLine,
                step: step,
                keep: keep // keep lines
            };
            this.vmStop("renumLines", 85, false, lineRenumParas);
        };
        CpcVm.prototype.restore = function (line) {
            line = line || 0;
            var dataLineIndex = this.dataLineIndex;
            // line = String(line);
            if (line in dataLineIndex) {
                this.dataIndex = dataLineIndex[line];
            }
            else {
                Utils_1.Utils.console.log("restore: search for dataLine >", line);
                for (var dataLine in dataLineIndex) { // linear search a data line > line
                    if (dataLineIndex.hasOwnProperty(dataLine)) {
                        if (Number(dataLine) >= line) {
                            dataLineIndex[line] = dataLineIndex[dataLine]; // set data index also for line
                            break;
                        }
                    }
                }
                if (line in dataLineIndex) { // now found a data line?
                    this.dataIndex = dataLineIndex[line];
                }
                else {
                    Utils_1.Utils.console.warn("restore", line + ": No DATA found starting at line");
                    this.dataIndex = this.dataList.length;
                }
            }
        };
        CpcVm.prototype.resume = function (line) {
            if (this.errorGotoLine) {
                if (line === undefined) {
                    line = this.errorResumeLine;
                }
                this.vmGotoLine(line, "resume");
                this.errorResumeLine = 0;
            }
            else {
                throw this.vmComposeError(Error(), 20, String(line)); // Unexpected RESUME
            }
        };
        CpcVm.prototype.resumeNext = function () {
            if (!this.errorGotoLine) {
                throw this.vmComposeError(Error(), 20, "RESUME NEXT"); // Unexpected RESUME
            }
            this.vmNotImplemented("RESUME NEXT");
        };
        CpcVm.prototype["return"] = function () {
            var line = this.gosubStack.pop();
            if (line === undefined) {
                throw this.vmComposeError(Error(), 3, ""); // Unexpected Return [in <line>]
            }
            else {
                this.vmGotoLine(line, "return");
            }
            if (line === this.breakResumeLine) { // end of break handler?
                this.breakResumeLine = 0; // can start another one
            }
            this.vmCheckTimerHandlers(); // if we are at end of a BASIC timer handler, delete handler flag
            if (this.vmCheckSqTimerHandlers()) { // same for sq timers, timer reloaded?
                this.fnCheckSqTimer(); // next one early
            }
        };
        CpcVm.prototype.right$ = function (s, len) {
            this.vmAssertString(s, "RIGHT$");
            len = this.vmInRangeRound(len, 0, 255, "RIGHT$");
            return s.slice(-len);
        };
        CpcVm.prototype.rnd = function (n) {
            if (n !== undefined) {
                this.vmAssertNumber(n, "RND");
            }
            var x;
            if (n < 0) {
                x = this.lastRnd || this.random.random();
            }
            else if (n === 0) {
                x = this.lastRnd || this.random.random();
            }
            else { // >0 or undefined
                x = this.random.random();
                this.lastRnd = x;
            }
            return x;
        };
        CpcVm.prototype.round = function (n, decimals) {
            this.vmAssertNumber(n, "ROUND");
            decimals = this.vmInRangeRound(decimals || 0, -39, 39, "ROUND");
            // To avoid rounding errors: https://www.jacklmoore.com/notes/rounding-in-javascript
            return Number(Math.round(Number(n + "e" + decimals)) + "e" + ((decimals >= 0) ? "-" + decimals : "+" + -decimals));
        };
        CpcVm.prototype.vmRunCallback = function (input, meta) {
            var inFile = this.inFile, putInMemory = input !== null && meta && (meta.typeString === "B" || inFile.start !== undefined);
            // TODO: we could put it in memory as we do it for LOAD
            if (input !== null) {
                var lineParas = {
                    command: "run",
                    stream: 0,
                    first: inFile.line,
                    last: 0,
                    line: this.line
                };
                this.vmStop("run", 95, false, lineParas);
            }
            this.closein();
            return putInMemory;
        };
        CpcVm.prototype.run = function (numOrString) {
            var inFile = this.inFile;
            if (typeof numOrString === "string") { // filename?
                var name_3 = this.vmAdaptFilename(numOrString, "RUN");
                this.closein();
                inFile.open = true;
                inFile.command = "run";
                inFile.name = name_3;
                inFile.fnFileCallback = this.fnRunHandler;
                this.vmStop("fileLoad", 90);
            }
            else { // line number or no argument = undefined
                var lineParas = {
                    command: "run",
                    stream: 0,
                    first: numOrString || 0,
                    last: 0,
                    line: this.line
                };
                this.vmStop("run", 95, false, lineParas);
            }
        };
        CpcVm.prototype.save = function (name, type, start, length, entry) {
            var outFile = this.outFile;
            name = this.vmAdaptFilename(name, "SAVE");
            if (!type) {
                type = "T"; // default is tokenized BASIC
            }
            else {
                type = String(type).toUpperCase();
            }
            var fileData = [];
            if (type === "B") { // binary
                start = this.vmRound2Complement(start, "SAVE");
                length = this.vmRound2Complement(length, "SAVE");
                if (entry !== undefined) {
                    entry = this.vmRound2Complement(entry, "SAVE");
                }
                for (var i = 0; i < length; i += 1) {
                    var address = (start + i) & 0xffff; // eslint-disable-line no-bitwise
                    fileData[i] = String.fromCharCode(this.peek(address));
                }
            }
            else if ((type === "A" || type === "T" || type === "P") && start === undefined) {
                // ASCII or tokenized BASIC or protected BASIC, and no load address specified
                start = 368; // BASIC start
                // need file data from controller (text box)
            }
            else {
                throw this.vmComposeError(Error(), 2, "SAVE " + type); // Syntax Error
            }
            outFile.open = true;
            outFile.command = "save";
            outFile.name = name;
            outFile.typeString = type;
            outFile.start = start;
            outFile.length = length || 0;
            outFile.entry = entry || 0;
            outFile.fileData = fileData;
            outFile.fnFileCallback = this.fnCloseoutHandler; // we use closeout handler to reset out file handling
            this.vmStop("fileSave", 90); // must stop directly after save
        };
        CpcVm.prototype.sgn = function (n) {
            this.vmAssertNumber(n, "SGN");
            return Math.sign(n);
        };
        CpcVm.prototype.sin = function (n) {
            this.vmAssertNumber(n, "SIN");
            return Math.sin((this.degFlag) ? Utils_1.Utils.toRadians(n) : n);
        };
        CpcVm.prototype.sound = function (state, period, duration, volume, volEnv, toneEnv, noise) {
            state = this.vmInRangeRound(state, 1, 255, "SOUND");
            period = this.vmInRangeRound(period, 0, 4095, "SOUND ,");
            var soundData = {
                state: state,
                period: period,
                duration: (duration !== undefined) ? this.vmInRangeRound(duration, -32768, 32767, "SOUND ,,") : 20,
                volume: (volume !== undefined) ? this.vmInRangeRound(volume, 0, 15, "SOUND ,,,") : 12,
                volEnv: (volEnv !== undefined) ? this.vmInRangeRound(volEnv, 0, 15, "SOUND ,,,,") : 0,
                toneEnv: (toneEnv !== undefined) ? this.vmInRangeRound(toneEnv, 0, 15, "SOUND ,,,,,") : 0,
                noise: (noise !== undefined) ? this.vmInRangeRound(noise, 0, 31, "SOUND ,,,,,,") : 0
            };
            if (this.soundClass.testCanQueue(state)) {
                this.soundClass.sound(soundData);
            }
            else {
                this.soundData.push(soundData);
                this.vmStop("waitSound", 43);
                for (var i = 0; i < 3; i += 1) {
                    if (state & (1 << i)) { // eslint-disable-line no-bitwise
                        var sqTimer = this.sqTimer[i];
                        sqTimer.active = false; // set onSq timer to inactive
                    }
                }
            }
        };
        CpcVm.prototype.space$ = function (n) {
            n = this.vmInRangeRound(n, 0, 255, "SPACE$");
            return " ".repeat(n);
        };
        CpcVm.prototype.spc = function (stream, n) {
            stream = this.vmInRangeRound(stream, 0, 9, "SPC");
            n = this.vmInRangeRound(n, -32768, 32767, "SPC");
            var str = "";
            if (n >= 0) {
                var win = this.windowDataList[stream], width = win.right - win.left + 1;
                if (width) {
                    n %= width;
                }
                str = " ".repeat(n);
            }
            else {
                Utils_1.Utils.console.log("SPC: negative number ignored:", n);
            }
            return str;
        };
        CpcVm.prototype.speedInk = function (time1, time2) {
            time1 = this.vmInRangeRound(time1, 1, 255, "SPEED INK");
            time2 = this.vmInRangeRound(time2, 1, 255, "SPEED INK");
            this.canvas.setSpeedInk(time1, time2);
        };
        CpcVm.prototype.speedKey = function (delay, repeat) {
            delay = this.vmInRangeRound(delay, 1, 255, "SPEED KEY");
            repeat = this.vmInRangeRound(repeat, 1, 255, "SPEED KEY");
            this.vmNotImplemented("SPEED KEY " + delay + " " + repeat);
        };
        CpcVm.prototype.speedWrite = function (n) {
            n = this.vmInRangeRound(n, 0, 1, "SPEED WRITE");
            this.vmNotImplemented("SPEED WRITE " + n);
        };
        CpcVm.prototype.sq = function (channel) {
            channel = this.vmInRangeRound(channel, 1, 4, "SQ");
            if (channel === 3) {
                throw this.vmComposeError(Error(), 5, "ON SQ GOSUB " + channel); // Improper argument
            }
            channel = CpcVm.fnChannel2ChannelIndex(channel);
            var sq = this.soundClass.sq(channel), sqTimer = this.sqTimer[channel];
            // no space in queue and handler active?
            if (!(sq & 0x07) && sqTimer.active) { // eslint-disable-line no-bitwise
                sqTimer.active = false; // set onSq timer to inactive
            }
            return sq;
        };
        CpcVm.prototype.sqr = function (n) {
            this.vmAssertNumber(n, "SQR");
            return Math.sqrt(n);
        };
        // step
        CpcVm.prototype.stop = function (label) {
            this.vmGotoLine(label, "stop");
            this.vmStop("stop", 60);
        };
        CpcVm.prototype.str$ = function (n) {
            this.vmAssertNumber(n, "STR$");
            return ((n >= 0) ? " " : "") + String(n);
        };
        CpcVm.prototype.string$ = function (len, chr) {
            len = this.vmInRangeRound(len, 0, 255, "STRING$");
            if (typeof chr === "number") {
                chr = this.vmInRangeRound(chr, 0, 255, "STRING$");
                chr = String.fromCharCode(chr); // chr$
            }
            else { // string
                chr = chr.charAt(0); // only one char
            }
            return chr.repeat(len);
        };
        // swap (window swap)
        CpcVm.prototype.symbol = function (char) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            char = this.vmInRangeRound(char, this.minCustomChar, 255, "SYMBOL");
            var charData = [];
            for (var i = 0; i < args.length; i += 1) { // start with 1, get available args
                var bitMask = this.vmInRangeRound(args[i], 0, 255, "SYMBOL");
                charData.push(bitMask);
            }
            // Note: If there are less than 8 rows, the others are assumed as 0 (actually empty)
            this.canvas.setCustomChar(char, charData);
        };
        CpcVm.prototype.symbolAfter = function (char) {
            char = this.vmInRangeRound(char, 0, 256, "SYMBOL AFTER");
            if (this.minCustomChar < 256) { // symbol after <256 set?
                if (this.minCharHimem !== this.himemValue) { // himem changed?
                    throw this.vmComposeError(Error(), 5, "SYMBOL AFTER " + char); // Improper argument
                }
            }
            else {
                this.maxCharHimem = this.himemValue; // no characters defined => use current himem
            }
            var minCharHimem = this.maxCharHimem - (256 - char) * 8;
            if (minCharHimem < CpcVm.minHimem) {
                throw this.vmComposeError(Error(), 7, "SYMBOL AFTER " + minCharHimem); // Memory full
            }
            this.himemValue = minCharHimem;
            this.canvas.resetCustomChars();
            if (char === 256) { // maybe move up again
                minCharHimem = CpcVm.maxHimem;
                this.maxCharHimem = minCharHimem;
            }
            // TODO: Copy char data to screen memory, if screen starts at 0x4000 and chardata is in that range (and ram 0 is selected)
            this.minCustomChar = char;
            this.minCharHimem = minCharHimem;
        };
        CpcVm.prototype.tab = function (stream, n) {
            stream = this.vmInRangeRound(stream, 0, 9, "TAB");
            n = this.vmInRangeRound(n, -32768, 32767, "TAB");
            var str = "";
            if (n > 0) {
                n -= 1;
                var win = this.windowDataList[stream], width = win.right - win.left + 1;
                if (width) {
                    n %= width;
                }
                var count = n - win.pos;
                if (count < 0) { // does it fit until tab position?
                    win.pos = win.right + 1;
                    this.vmMoveCursor2AllowedPos(stream);
                    count = n; // set tab in next line
                }
                str = " ".repeat(count);
            }
            else {
                Utils_1.Utils.console.log("TAB: no tab for value", n);
            }
            return str;
        };
        CpcVm.prototype.tag = function (stream) {
            stream = this.vmInRangeRound(stream, 0, 7, "TAG");
            var win = this.windowDataList[stream];
            win.tag = true;
        };
        CpcVm.prototype.tagoff = function (stream) {
            stream = this.vmInRangeRound(stream, 0, 7, "TAGOFF");
            var win = this.windowDataList[stream];
            win.tag = false;
        };
        CpcVm.prototype.tan = function (n) {
            this.vmAssertNumber(n, "TAN");
            return Math.tan((this.degFlag) ? Utils_1.Utils.toRadians(n) : n);
        };
        CpcVm.prototype.test = function (x, y) {
            x = this.vmInRangeRound(x, -32768, 32767, "TEST");
            y = this.vmInRangeRound(y, -32768, 32767, "TEST");
            return this.canvas.test(x, y);
        };
        CpcVm.prototype.testr = function (x, y) {
            x = this.vmInRangeRound(x, -32768, 32767, "TESTR");
            y = this.vmInRangeRound(y, -32768, 32767, "TESTR");
            return this.canvas.testr(x, y);
        };
        CpcVm.prototype.time = function () {
            return ((Date.now() - this.startTime) * 300 / 1000) | 0; // eslint-disable-line no-bitwise
        };
        CpcVm.prototype.troff = function () {
            this.tronFlag1 = false;
        };
        CpcVm.prototype.tron = function () {
            this.tronFlag1 = true;
        };
        CpcVm.prototype.unt = function (n) {
            n = this.vmInRangeRound(n, -32768, 65535, "UNT");
            if (n > 32767) { // undo 2th complement
                n -= 65536;
            }
            return n;
        };
        CpcVm.fnUpperCase = function (match) {
            return match.toUpperCase();
        };
        CpcVm.prototype.upper$ = function (s) {
            this.vmAssertString(s, "UPPER$");
            return s.replace(/[a-z]/g, CpcVm.fnUpperCase); // replace only characters a-z
        };
        CpcVm.prototype.using = function (format) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            var reFormat = /(!|&|\\ *\\|(?:\*\*|\$\$|\*\*\$)?\+?(?:#|,)+\.?#*(?:\^\^\^\^)?[+-]?)/g, formatList = [];
            this.vmAssertString(format, "USING");
            // We simulate format.split(reFormat) here since it does not work with IE8
            var index = 0, match;
            while ((match = reFormat.exec(format)) !== null) {
                formatList.push(format.substring(index, match.index)); // non-format characters at the beginning
                formatList.push(match[0]);
                index = match.index + match[0].length;
            }
            if (index < format.length) { // non-format characters at the end
                formatList.push(format.substr(index));
            }
            if (formatList.length < 2) {
                Utils_1.Utils.console.warn("USING: empty or invalid format:", format);
                throw this.vmComposeError(Error(), 5, "USING format " + format); // Improper argument
            }
            var formatIndex = 0, s = "";
            for (var i = 0; i < args.length; i += 1) { // start with 1
                formatIndex %= formatList.length;
                if (formatIndex === 0) {
                    s += formatList[formatIndex]; // non-format characters at the beginning of the format string
                    formatIndex += 1;
                }
                if (formatIndex < formatList.length) {
                    var arg = args[i];
                    s += this.vmUsingFormat(formatList[formatIndex], arg); // format characters
                    formatIndex += 1;
                }
                if (formatIndex < formatList.length) {
                    s += formatList[formatIndex]; // following non-format characters
                    formatIndex += 1;
                }
            }
            return s;
        };
        CpcVm.vmVal = function (s) {
            var num = 0;
            s = s.trim().toLowerCase();
            if (s.startsWith("&x")) { // binary &x
                s = s.slice(2);
                num = parseInt(s, 2);
            }
            else if (s.startsWith("&h")) { // hex &h
                s = s.slice(2);
                num = parseInt(s, 16);
            }
            else if (s.startsWith("&")) { // hex &
                s = s.slice(1);
                num = parseInt(s, 16);
            }
            else if (s !== "") { // not empty string?
                num = parseFloat(s);
            }
            return num;
        };
        CpcVm.prototype.val = function (s) {
            this.vmAssertString(s, "VAL");
            var num = CpcVm.vmVal(s);
            if (isNaN(num)) {
                num = 0;
            }
            return num;
        };
        CpcVm.prototype.vpos = function (stream) {
            stream = this.vmInRangeRound(stream, 0, 7, "VPOS");
            return this.vmGetAllowedPosOrVpos(stream, true) + 1;
        };
        CpcVm.prototype.wait = function (port, mask, inv) {
            port = this.vmRound2Complement(port, "WAIT");
            mask = this.vmInRangeRound(mask, 0, 255, "WAIT");
            if (inv !== undefined) {
                /* inv = */ this.vmInRangeRound(inv, 0, 255, "WAIT");
            }
            if ((port & 0xff00) === 0xf500) { // eslint-disable-line no-bitwise
                if (mask === 1) {
                    this.frame();
                }
            }
        };
        // wend
        // while
        CpcVm.prototype.width = function (width) {
            width = this.vmInRangeRound(width, 1, 255, "WIDTH");
            var win = this.windowDataList[8];
            win.right = win.left + width;
        };
        CpcVm.prototype.window = function (stream, left, right, top, bottom) {
            stream = this.vmInRangeRound(stream, 0, 7, "WINDOW");
            left = this.vmInRangeRound(left, 1, 255, "WINDOW");
            right = this.vmInRangeRound(right, 1, 255, "WINDOW");
            top = this.vmInRangeRound(top, 1, 255, "WINDOW");
            bottom = this.vmInRangeRound(bottom, 1, 255, "WINDOW");
            var win = this.windowDataList[stream];
            win.left = Math.min(left, right) - 1;
            win.right = Math.max(left, right) - 1;
            win.top = Math.min(top, bottom) - 1;
            win.bottom = Math.max(top, bottom) - 1;
            win.pos = 0;
            win.vpos = 0;
        };
        CpcVm.prototype.windowSwap = function (stream1, stream2) {
            stream1 = this.vmInRangeRound(stream1, 0, 7, "WINDOW SWAP");
            stream2 = this.vmInRangeRound(stream2 || 0, 0, 7, "WINDOW SWAP");
            var temp = this.windowDataList[stream1];
            this.windowDataList[stream1] = this.windowDataList[stream2];
            this.windowDataList[stream2] = temp;
        };
        CpcVm.prototype.write = function (stream) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            stream = this.vmInRangeRound(stream, 0, 9, "WRITE");
            var writeArgs = [];
            var str;
            for (var i = 0; i < args.length; i += 1) {
                var arg = args[i];
                if (typeof arg === "number") {
                    str = String(arg);
                }
                else {
                    str = '"' + String(arg) + '"';
                }
                writeArgs.push(str);
            }
            str = writeArgs.join(",");
            if (stream < 8) {
                var win = this.windowDataList[stream];
                if (win.tag) {
                    this.vmPrintGraphChars(str + "\r\n");
                }
                else {
                    this.vmDrawUndrawCursor(stream); // undraw
                    this.vmPrintChars(stream, str);
                    this.vmPrintCharsOrControls(stream, "\r\n");
                    this.vmDrawUndrawCursor(stream); // draw
                }
                this.outBuffer += str + "\n"; // console
            }
            else if (stream === 8) {
                this.vmNotImplemented("WRITE #" + stream);
            }
            else if (stream === 9) {
                this.outFile.stream = stream;
                if (!this.outFile.open) {
                    throw this.vmComposeError(Error(), 31, "WRITE #" + stream); // File not open
                }
                this.outFile.fileData.push(str + "\n"); // real CPC would use CRLF, we use LF
                // currently we print data also to console...
            }
        };
        CpcVm.prototype.xpos = function () {
            return this.canvas.getXpos();
        };
        CpcVm.prototype.ypos = function () {
            return this.canvas.getYpos();
        };
        CpcVm.prototype.zone = function (n) {
            this.zoneValue = this.vmInRangeRound(n, 1, 255, "ZONE");
        };
        // access some private stuff for testing
        CpcVm.prototype.vmTestGetTimerList = function () {
            return this.timerList;
        };
        CpcVm.prototype.vmTestGetWindowDataList = function () {
            return this.windowDataList;
        };
        CpcVm.frameTimeMs = 1000 / 50; // 50 Hz => 20 ms
        CpcVm.timerCount = 4; // number of timers
        CpcVm.sqTimerCount = 3; // sound queue timers
        CpcVm.streamCount = 10; // 0..7 window, 8 printer, 9 cassette
        CpcVm.minHimem = 370;
        CpcVm.maxHimem = 42747; // high memory limit (42747 after symbol after 256)
        CpcVm.emptyParas = {};
        CpcVm.winData = [
            {
                left: 0,
                right: 19,
                top: 0,
                bottom: 24
            },
            {
                left: 0,
                right: 39,
                top: 0,
                bottom: 24
            },
            {
                left: 0,
                right: 79,
                top: 0,
                bottom: 24
            },
            {
                left: 0,
                right: 79,
                top: 0,
                bottom: 49
            }
        ];
        CpcVm.utf8ToCpc = {
            8364: 128,
            8218: 130,
            402: 131,
            8222: 132,
            8230: 133,
            8224: 134,
            8225: 135,
            710: 136,
            8240: 137,
            352: 138,
            8249: 139,
            338: 140,
            381: 142,
            8216: 145,
            8217: 146,
            8220: 147,
            8221: 148,
            8226: 149,
            8211: 150,
            8212: 151,
            732: 152,
            8482: 153,
            353: 154,
            8250: 155,
            339: 156,
            382: 158,
            376: 159
        };
        CpcVm.controlCodeParameterCount = [
            0,
            1,
            0,
            0,
            1,
            1,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            1,
            1,
            0,
            0,
            0,
            0,
            0,
            0,
            1,
            1,
            0,
            9,
            4,
            0,
            3,
            2,
            0,
            2 //  0x1f
        ];
        CpcVm.errors = [
            "Improper argument",
            "Unexpected NEXT",
            "Syntax Error",
            "Unexpected RETURN",
            "DATA exhausted",
            "Improper argument",
            "Overflow",
            "Memory full",
            "Line does not exist",
            "Subscript out of range",
            "Array already dimensioned",
            "Division by zero",
            "Invalid direct command",
            "Type mismatch",
            "String space full",
            "String too long",
            "String expression too complex",
            "Cannot CONTinue",
            "Unknown user function",
            "RESUME missing",
            "Unexpected RESUME",
            "Direct command found",
            "Operand missing",
            "Line too long",
            "EOF met",
            "File type error",
            "NEXT missing",
            "File already open",
            "Unknown command",
            "WEND missing",
            "Unexpected WEND",
            "File not open",
            "Broken",
            "Unknown error" // 33...
        ];
        CpcVm.stopPriority = {
            "": 0,
            direct: 0,
            timer: 20,
            waitFrame: 40,
            waitKey: 41,
            waitSound: 43,
            waitInput: 45,
            fileCat: 45,
            fileDir: 45,
            fileEra: 45,
            fileRen: 45,
            error: 50,
            onError: 50,
            stop: 60,
            "break": 80,
            escape: 85,
            renumLines: 85,
            deleteLines: 85,
            editLine: 85,
            end: 90,
            list: 90,
            fileLoad: 90,
            fileSave: 90,
            "new": 90,
            run: 95,
            parse: 95,
            parseRun: 95,
            reset: 99 // reset system
        };
        return CpcVm;
    }());
    exports.CpcVm = CpcVm;
});
//# sourceMappingURL=CpcVm.js.map