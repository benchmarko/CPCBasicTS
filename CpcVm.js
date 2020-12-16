"use strict";
// CpcVm.ts - CPC Virtual Machine
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasic/
//
Object.defineProperty(exports, "__esModule", { value: true });
exports.CpcVm = void 0;
var Utils_1 = require("./Utils");
var Random_1 = require("./Random");
var CpcVm = /** @class */ (function () {
    function CpcVm(options) {
        this.fnCloseoutHandler = undefined;
        this.fnLoadHandler = undefined;
        this.fnRunHandler = undefined;
        this.aGosubStack = []; // stack of line numbers for gosub/return
        this.oDataLineIndex = {
            0: 0 // for line 0: index 0
        };
        this.fnOpeninHandler = this.vmOpeninCallback.bind(this);
        this.fnCloseinHandler = this.vmCloseinCallback.bind(this);
        this.fnCloseoutHandler = this.vmCloseoutCallback.bind(this);
        this.fnLoadHandler = this.vmLoadCallback.bind(this);
        this.fnRunHandler = this.vmRunCallback.bind(this);
        this.vmInit(options);
    }
    CpcVm.prototype.vmInit = function (options) {
        /*
        this.fnOpeninHandler = this.vmOpeninCallback.bind(this);
        this.fnCloseinHandler = this.vmCloseinCallback.bind(this);
        this.fnCloseoutHandler = this.vmCloseoutCallback.bind(this);
        this.fnLoadHandler = this.vmLoadCallback.bind(this);
        this.fnRunHandler = this.vmRunCallback.bind(this);
        */
        this.oCanvas = options.canvas;
        this.oKeyboard = options.keyboard;
        this.oSound = options.sound;
        this.oVariables = options.variables;
        this.tronFlag = options.tron;
        //this.rsx = new CpcVmRsx(this); //TTT
        this.oRandom = new Random_1.Random();
        this.oStop = {
            sReason: "",
            iPriority: 0,
            oParas: undefined // optional stop parameters
        };
        // special stop reasons and priorities:
        // "timer": 20 (timer expired)
        // "key": 30  (wait for key)
        // "waitFrame": 40 (FRAME command: wait for frame fly)
        // "waitSound": 43 (wait for sound queue)
        // "waitInput": 45 (wait for input: INPUT, LINE INPUT, RANDOMIZE without parameter)
        // "fileCat": 45 (CAT)
        // "fileDir": 45 (|DIR)
        // "fileEra": 45 (|ERA)
        // "fileRen": 45 (|REN)
        // "error": 50 (BASIC error, ERROR command)
        // "onError": 50 (ON ERROR GOTO active, hide error)
        // "stop": 60 (STOP or END command)
        // "break": 80 (break pressed)
        // "escape": 85 (escape key, set in controller)
        // "renumLines": 85 (RENUMber program)
        // "deleteLines": 90,
        // "end": 90 (end of program)
        // "list": 90,
        // "fileLoad": 90 (CHAIN, CHAIN MERGE, LOAD, MERGE, OPENIN, RUN)
        // "fileSave": 90 (OPENOUT, SAVE)
        // "reset": 90 (reset system)
        // "run": 90
        this.aInputValues = []; // values to input into script
        this.oInFile = {
            bOpen: false,
            sCommand: "",
            sName: "",
            iLine: undefined,
            iStart: undefined,
            aFileData: [],
            fnFileCallback: undefined,
            iFirst: undefined,
            iLast: undefined,
            sMemorizedExample: ""
        };
        this.oOutFile = {
            bOpen: false,
            sCommand: "",
            sName: "",
            iLine: undefined,
            iStart: undefined,
            aFileData: [],
            fnFileCallback: undefined,
            iStream: 0,
            sType: "",
            iLength: 0,
            iEntry: undefined
        }; // file handling
        // "bOpen": File open flag
        // "sCommand": Command that started the file open (in: chain, chainMerge, load, merge, openin, run; out: save, openput)
        // "sName": File name
        // "sType": File type: A, B, P, T
        // "iStart": start address of data
        // "iLength": length of data
        // "iEntry": entry address (save)
        // "iLine": ?
        // "aFileData": File contents for (LINE) INPUT #9; PRINT #9, WRITE #9
        // "fnFileCallback": Callback for stop reason "fileLoad", "fileSave"
        // "iLine": run line (CHAIN, CHAIN MERGE)
        // "iFirst": first line to delete (CHAIN MERGE)
        // "iLast": last line to delete (CHAIN MERGE)
        this.iInkeyTime = 0; // if >0, next time when inkey$ can be checked without inserting "waitFrame"
        this.aGosubStack = []; // stack of line numbers for gosub/return
        this.aMem = []; // for peek, poke
        this.aData = []; // array for BASIC data lines (continuous)
        this.aWindow = []; // window data for window 0..7,8,9
        for (var i = 0; i < CpcVm.iStreamCount; i += 1) {
            this.aWindow[i] = {};
        }
        this.aTimer = []; // BASIC timer 0..3 (3 has highest priority)
        for (var i = 0; i < CpcVm.iTimerCount; i += 1) {
            this.aTimer[i] = {}; //TTT
        }
        this.aSoundData = [];
        this.aSqTimer = []; // Sound queue timer 0..2
        for (var i = 0; i < CpcVm.iSqTimerCount; i += 1) {
            this.aSqTimer[i] = {}; //TTT
        }
        this.aCrtcData = [];
    };
    CpcVm.prototype.vmSetRsxClass = function (oRsx) {
        this.rsx = oRsx; //TTT just for the script
    };
    CpcVm.prototype.vmReset = function () {
        this.iStartTime = Date.now();
        this.oRandom.init();
        this.lastRnd = 0;
        this.iNextFrameTime = Date.now() + CpcVm.iFrameTimeMs; // next time of frame fly
        this.iTimeUntilFrame = 0;
        this.iStopCount = 0;
        this.iLine = 0; // current line number (or label)
        this.iStartLine = 0; // line to start
        this.iErrorGotoLine = 0;
        this.iErrorResumeLine = 0;
        this.iBreakGosubLine = 0;
        this.iBreakResumeLine = 0;
        this.aInputValues.length = 0;
        this.vmResetFileHandling(this.oInFile);
        this.vmResetFileHandling(this.oOutFile);
        this.vmResetControlBuffer();
        this.sOut = ""; // console output
        this.vmStop("", 0, true);
        this.vmResetData();
        this.iErr = 0; // last error code
        this.iErl = 0; // line of last error
        this.aGosubStack.length = 0;
        this.bDeg = false; // degree or radians
        this.bTron = this.tronFlag || false; // trace flag
        this.iTronLine = 0; // last trace line
        this.aMem.length = 0; // clear memory (for PEEK, POKE)
        this.iRamSelect = 0; // for banking with 16K banks in the range 0x4000-0x7fff (0=default; 1...=additional)
        this.iScreenPage = 3; // 16K screen page, 3=0xc000..0xffff
        this.iCrtcReg = 0;
        this.aCrtcData.length = 0;
        this.iMinCharHimem = CpcVm.iMaxHimem;
        this.iMaxCharHimem = CpcVm.iMaxHimem;
        this.iHimem = CpcVm.iMaxHimem;
        this.iMinCustomChar = 256;
        this.symbolAfter(240); // set also iMinCustomChar
        this.vmResetTimers();
        this.iTimerPriority = -1; // priority of running task: -1=low (min priority to start new timers)
        this.iZone = 13; // print tab zone value
        this.defreal("a-z"); // init vartypes
        this.iMode = null;
        this.vmResetWindowData(true); // reset all, including pen and paper
        this.width(132); // set default printer width
        this.mode(1); // including vmResetWindowData() without pen and paper
        this.oCanvas.reset();
        this.oKeyboard.reset();
        this.oSound.reset();
        this.aSoundData.length = 0;
        this.iInkeyTime = 0; // if >0, next time when inkey$ can be checked without inserting "waitFrame"
    };
    CpcVm.prototype.vmResetTimers = function () {
        var oData = {
            iLine: 0,
            bRepeat: false,
            iIntervalMs: 0,
            bActive: false,
            iNextTimeMs: 0,
            bHandlerRunning: false,
            iStackIndexReturn: 0,
            iSavedPriority: 0 // priority befora calling the handler
        }, aTimer = this.aTimer, aSqTimer = this.aSqTimer;
        for (var i = 0; i < CpcVm.iTimerCount; i += 1) {
            Object.assign(aTimer[i], oData);
        }
        // sound queue timer
        for (var i = 0; i < CpcVm.iSqTimerCount; i += 1) {
            Object.assign(aSqTimer[i], oData);
        }
    };
    CpcVm.prototype.vmResetWindowData = function (bResetPenPaper) {
        var oWinData = CpcVm.mWinData[this.iMode], oData = {
            iPos: 0,
            iVpos: 0,
            bTextEnabled: true,
            bTag: false,
            bTransparent: false,
            bCursorOn: false,
            bCursorEnabled: true // user switch
        }, oPenPaperData = {
            iPen: 1,
            iPaper: 0
        }, oPrintData = {
            iPos: 0,
            iVpos: 0,
            iRight: 132 // override
        }, oCassetteData = {
            iPos: 0,
            iVpos: 0,
            iRight: 255 // override
        };
        var oWin;
        if (bResetPenPaper) {
            /*
            oData.iPen = 1;
            oData.iPaper = 0;
            */
            Object.assign(oData, oPenPaperData);
        }
        for (var i = 0; i < this.aWindow.length - 2; i += 1) { // for window streams
            oWin = this.aWindow[i];
            Object.assign(oWin, oWinData, oData);
        }
        oWin = this.aWindow[8]; // printer
        Object.assign(oWin, oWinData, oPrintData);
        oWin = this.aWindow[9]; // cassette
        Object.assign(oWin, oWinData, oCassetteData);
    };
    CpcVm.prototype.vmResetControlBuffer = function () {
        this.sPrintControlBuf = ""; // collected control characters for PRINT
    };
    CpcVm.prototype.vmResetFileHandling = function (oFile) {
        oFile.bOpen = false;
        oFile.sCommand = ""; // to be sure
    };
    CpcVm.prototype.vmResetData = function () {
        this.aData.length = 0; // array for BASIC data lines (continuous)
        this.iData = 0; // current index
        this.oDataLineIndex = {
            0: 0 // for line 0: index 0
        };
    };
    CpcVm.prototype.vmResetInks = function () {
        this.oCanvas.setDefaultInks();
        this.oCanvas.setSpeedInk(10, 10);
    };
    CpcVm.prototype.vmReset4Run = function () {
        var iStream = 0;
        this.vmResetInks();
        this.clearInput();
        this.closein();
        this.closeout();
        this.cursor(iStream, 0);
    };
    CpcVm.prototype.vmGetAllVariables = function () {
        return this.oVariables.getAllVariables();
    };
    CpcVm.prototype.vmSetStartLine = function (iLine /*: number*/) {
        this.iStartLine = iLine;
    };
    CpcVm.prototype.vmOnBreakContSet = function () {
        return this.iBreakGosubLine < 0; // on break cont
    };
    CpcVm.prototype.vmOnBreakHandlerActive = function () {
        return this.iBreakResumeLine;
    };
    CpcVm.prototype.vmEscape = function () {
        var bStop = true;
        if (this.iBreakGosubLine > 0) { // on break gosub n
            if (!this.iBreakResumeLine) { // do not nest break gosub
                this.iBreakResumeLine = Number(this.iLine); //TTT
                this.gosub(this.iLine, this.iBreakGosubLine);
            }
            bStop = false;
        }
        else if (this.iBreakGosubLine < 0) { // on break cont
            bStop = false;
        } // else: on break stop
        return bStop;
    };
    CpcVm.prototype.vmAssertNumber = function (n, sErr) {
        if (typeof n !== "number") {
            throw this.vmComposeError(Error(), 13, sErr + " " + n); // Type mismatch
        }
    };
    CpcVm.prototype.vmAssertString = function (s, sErr) {
        if (typeof s !== "string") {
            throw this.vmComposeError(Error(), 13, sErr + " " + s); // Type mismatch
        }
    };
    // round number (-2^31..2^31) to integer; throw error if no number
    CpcVm.prototype.vmRound = function (n, sErr) {
        this.vmAssertNumber(n, sErr || "?");
        return (n >= 0) ? (n + 0.5) | 0 : (n - 0.5) | 0; // eslint-disable-line no-bitwise
    };
    /*
    // round for comparison TODO
    vmRound4Cmp(n) {
        const nAdd = (n >= 0) ? 0.5 : -0.5;

        return ((n * 1e12 + nAdd) | 0) / 1e12; // eslint-disable-line no-bitwise
    }
    */
    CpcVm.prototype.vmInRangeRound = function (n, iMin, iMax, sErr) {
        n = this.vmRound(n, sErr);
        if (n < iMin || n > iMax) {
            Utils_1.Utils.console.warn("vmInRangeRound: number not in range:", iMin + "<=" + n + "<=" + iMax);
            throw this.vmComposeError(Error(), n < -32768 || n > 32767 ? 6 : 5, sErr + " " + n); // 6=Overflow, 5=Improper argument
        }
        return n;
    };
    CpcVm.prototype.vmDetermineVarType = function (sVarType) {
        var sType = (sVarType.length > 1) ? sVarType.charAt(1) : this.oVariables.getVarType(sVarType.charAt(0));
        return sType;
    };
    CpcVm.prototype.vmAssertNumberType = function (sVarType) {
        var sType = this.vmDetermineVarType(sVarType);
        if (sType !== "I" && sType !== "R") { // not integer or real?
            throw this.vmComposeError(Error(), 13, "type " + sType); // "Type mismatch"
        }
    };
    // format a value for assignment to a variable with type determined from sVarType
    CpcVm.prototype.vmAssign = function (sVarType, value) {
        var sType = this.vmDetermineVarType(sVarType);
        if (sType === "R") { // real
            this.vmAssertNumber(value, "=");
        }
        else if (sType === "I") { // integer
            value = this.vmRound(value, "="); // round number to integer
        }
        else if (sType === "$") { // string
            if (typeof value !== "string") {
                Utils_1.Utils.console.warn("vmAssign: expected string but got:", value);
                throw this.vmComposeError(Error(), 13, "type " + sType + "=" + value); // "Type mismatch"
            }
        }
        return value;
    };
    CpcVm.prototype.vmGotoLine = function (line, sMsg) {
        if (Utils_1.Utils.debug > 5) {
            if (typeof line === "number" || Utils_1.Utils.debug > 7) { // non-number labels only in higher debug levels
                Utils_1.Utils.console.debug("dvmGotoLine:", sMsg + ": " + line);
            }
        }
        this.iLine = line;
    };
    CpcVm.prototype.fnCheckSqTimer = function () {
        var bTimerExpired = false;
        if (this.iTimerPriority < 2) {
            for (var i = 0; i < CpcVm.iSqTimerCount; i += 1) {
                var oTimer = this.aSqTimer[i];
                // use oSound.sq(i) and not this.sq(i) since that would reset onSq timer
                if (oTimer.bActive && !oTimer.bHandlerRunning && (this.oSound.sq(i) & 0x07)) { // eslint-disable-line no-bitwise
                    this.gosub(this.iLine, oTimer.iLine); //TTT
                    oTimer.bHandlerRunning = true;
                    oTimer.iStackIndexReturn = this.aGosubStack.length;
                    oTimer.bRepeat = false; // one shot
                    bTimerExpired = true;
                    break; // found expired timer
                }
            }
        }
        return bTimerExpired;
    };
    CpcVm.prototype.vmCheckTimer = function (iTime) {
        var bTimerExpired = false;
        for (var i = CpcVm.iTimerCount - 1; i > this.iTimerPriority; i -= 1) { // check timers starting with highest priority first
            var oTimer = this.aTimer[i];
            if (oTimer.bActive && !oTimer.bHandlerRunning && iTime > oTimer.iNextTimeMs) { // timer expired?
                this.gosub(this.iLine, oTimer.iLine); //TTT
                oTimer.bHandlerRunning = true;
                oTimer.iStackIndexReturn = this.aGosubStack.length;
                oTimer.iSavedPriority = this.iTimerPriority;
                this.iTimerPriority = i;
                if (!oTimer.bRepeat) { // not repeating
                    oTimer.bActive = false;
                }
                else {
                    var iDelta = iTime - oTimer.iNextTimeMs;
                    oTimer.iNextTimeMs += oTimer.iIntervalMs * Math.ceil(iDelta / oTimer.iIntervalMs);
                }
                bTimerExpired = true;
                break; // found expired timer
            }
            else if (i === 2) { // for priority 2 we check the sq timers which also have priority 2
                if (this.fnCheckSqTimer()) {
                    break; // found expired timer
                }
            }
        }
        return bTimerExpired;
    };
    CpcVm.prototype.vmCheckTimerHandlers = function () {
        for (var i = CpcVm.iTimerCount - 1; i >= 0; i -= 1) {
            var oTimer = this.aTimer[i];
            if (oTimer.bHandlerRunning) {
                if (oTimer.iStackIndexReturn > this.aGosubStack.length) {
                    oTimer.bHandlerRunning = false;
                    this.iTimerPriority = oTimer.iSavedPriority; // restore priority
                    oTimer.iStackIndexReturn = 0;
                }
            }
        }
    };
    CpcVm.prototype.vmCheckSqTimerHandlers = function () {
        var bTimerReloaded = false;
        for (var i = CpcVm.iSqTimerCount - 1; i >= 0; i -= 1) {
            var oTimer = this.aSqTimer[i];
            if (oTimer.bHandlerRunning) {
                if (oTimer.iStackIndexReturn > this.aGosubStack.length) {
                    oTimer.bHandlerRunning = false;
                    this.iTimerPriority = oTimer.iSavedPriority; // restore priority
                    oTimer.iStackIndexReturn = 0;
                    if (!oTimer.bRepeat) { // not reloaded
                        oTimer.bActive = false;
                    }
                    else {
                        bTimerReloaded = true;
                    }
                }
            }
        }
        return bTimerReloaded;
    };
    CpcVm.prototype.vmCheckNextFrame = function (iTime) {
        if (iTime >= this.iNextFrameTime) { // next time of frame fly
            var iDelta = iTime - this.iNextFrameTime;
            if (iDelta > CpcVm.iFrameTimeMs) {
                this.iNextFrameTime += CpcVm.iFrameTimeMs * Math.ceil(iDelta / CpcVm.iFrameTimeMs);
            }
            else {
                this.iNextFrameTime += CpcVm.iFrameTimeMs;
            }
            this.oCanvas.updateSpeedInk();
            this.vmCheckTimer(iTime); // check BASIC timers and sound queue
            this.oSound.scheduler(); // on a real CPC it is 100 Hz, we use 50 Hz
        }
    };
    CpcVm.prototype.vmGetTimeUntilFrame = function (iTime) {
        iTime = iTime || Date.now();
        var iTimeUntilFrame = this.iNextFrameTime - iTime;
        return iTimeUntilFrame;
    };
    CpcVm.prototype.vmLoopCondition = function () {
        var iTime = Date.now();
        if (iTime >= this.iNextFrameTime) {
            this.vmCheckNextFrame(iTime);
            this.iStopCount += 1;
            if (this.iStopCount >= 5) { // do not stop too often because of just timer resason because setTimeout is expensive
                this.iStopCount = 0;
                this.vmStop("timer", 20);
            }
        }
        return this.oStop.sReason === "";
    };
    CpcVm.prototype.vmInitUntypedVariables = function (sVarChar) {
        var aNames = this.oVariables.getAllVariableNames();
        for (var i = 0; i < aNames.length; i += 1) {
            var sName = aNames[i];
            if (sName.charAt(0) === sVarChar) {
                if (sName.indexOf("$") === -1 && sName.indexOf("%") === -1 && sName.indexOf("!") === -1) { // no explicit type?
                    this.oVariables.initVariable(sName);
                }
            }
        }
    };
    CpcVm.prototype.vmDefineVarTypes = function (sType, sNameOrRange, sErr) {
        this.vmAssertString(sNameOrRange, sErr);
        var iFirst, iLast;
        if (sNameOrRange.indexOf("-") >= 0) {
            var aRange = sNameOrRange.split("-", 2);
            iFirst = aRange[0].trim().toLowerCase().charCodeAt(0);
            iLast = aRange[1].trim().toLowerCase().charCodeAt(0);
        }
        else {
            iFirst = sNameOrRange.trim().toLowerCase().charCodeAt(0);
            iLast = iFirst;
        }
        for (var i = iFirst; i <= iLast; i += 1) {
            var sVarChar = String.fromCharCode(i);
            if (this.oVariables.getVarType(sVarChar) !== sType) { // type changed?
                this.oVariables.setVarType(sVarChar, sType);
                // initialize all untyped variables starting with sVarChar!
                this.vmInitUntypedVariables(sVarChar);
            }
        }
    };
    CpcVm.prototype.vmStop = function (sReason, iPriority, bForce, oParas) {
        iPriority = iPriority || 0;
        if (bForce || iPriority >= this.oStop.iPriority) {
            this.oStop.iPriority = iPriority;
            this.oStop.sReason = sReason;
            this.oStop.oParas = oParas;
        }
    };
    CpcVm.prototype.vmNotImplemented = function (sName) {
        Utils_1.Utils.console.warn("Not implemented:", sName);
    };
    // not complete
    CpcVm.prototype.vmUsingFormat1 = function (sFormat, arg) {
        var sPadChar = " ", re1 = /^\\ *\\$/;
        var sStr;
        if (typeof arg === "string") {
            if (sFormat === "&") {
                sStr = arg;
            }
            else if (sFormat === "!") {
                sStr = arg.charAt(0);
            }
            else if (re1.test(sFormat)) { // "\...\"
                sStr = arg.substr(0, sFormat.length);
                var iPadLen = sFormat.length - arg.length, sPad = (iPadLen > 0) ? sPadChar.repeat(iPadLen) : "";
                sStr = arg + sPad; // string left aligned
            }
            else { // no string format
                throw this.vmComposeError(Error(), 13, "USING format " + sFormat); // "Type mismatch"
            }
        }
        else { // number (not fully implemented)
            if (sFormat === "&" || sFormat === "!" || re1.test(sFormat)) { // string format for number?
                throw this.vmComposeError(Error(), 13, "USING format " + sFormat); // "Type mismatch"
            }
            if (sFormat.indexOf(".") < 0) { // no decimal point?
                arg = Number(arg).toFixed(0);
            }
            else { // assume ###.##
                var aFormat = sFormat.split(".", 2), iDecimals = aFormat[1].length;
                // To avoid rounding errors: https://www.jacklmoore.com/notes/rounding-in-javascript
                arg = Number(Math.round(Number(arg + "e" + iDecimals)) + "e-" + iDecimals);
                arg = arg.toFixed(iDecimals);
            }
            if (sFormat.indexOf(",") >= 0) { // contains comma => insert thousands separator
                arg = Utils_1.Utils.numberWithCommas(arg);
            }
            var iPadLen = sFormat.length - arg.length, sPad = (iPadLen > 0) ? sPadChar.repeat(iPadLen) : "";
            sStr = sPad + arg;
            if (sStr.length > sFormat.length) {
                sStr = "%" + sStr; // mark too long
            }
        }
        return sStr;
    };
    CpcVm.prototype.vmGetStopObject = function () {
        return this.oStop;
    };
    CpcVm.prototype.vmGetInFileObject = function () {
        return this.oInFile;
    };
    CpcVm.prototype.vmGetOutFileObject = function () {
        return this.oOutFile;
    };
    CpcVm.prototype.vmAdaptFilename = function (sName, sErr) {
        this.vmAssertString(sName, sErr);
        sName = sName.replace(/ /g, ""); // remove spaces
        if (sName.indexOf("!") === 0) {
            sName = sName.substr(1); // remove preceding "!"
        }
        var iIndex = sName.indexOf(":");
        if (iIndex >= 0) {
            sName = sName.substr(iIndex + 1); // remove user and drive letter including ":"
        }
        sName = sName.toLowerCase();
        if (!sName) {
            throw this.vmComposeError(Error(), 32, "Bad filename: " + sName);
        }
        return sName;
    };
    CpcVm.prototype.vmGetSoundData = function () {
        return this.aSoundData;
    };
    CpcVm.prototype.vmTrace = function (iLine) {
        var iStream = 0;
        this.iTronLine = iLine;
        if (this.bTron) {
            this.print(iStream, "[" + iLine + "]");
        }
    };
    CpcVm.prototype.vmDrawMovePlot = function (sType, x, y, iGPen, iGColMode) {
        x = this.vmInRangeRound(x, -32768, 32767, sType);
        y = this.vmInRangeRound(y, -32768, 32767, sType);
        if (iGPen !== undefined && iGPen !== null) {
            iGPen = this.vmInRangeRound(iGPen, 0, 15, sType);
            this.oCanvas.setGPen(iGPen);
        }
        if (iGColMode !== undefined) {
            iGColMode = this.vmInRangeRound(iGColMode, 0, 3, sType);
            this.oCanvas.setGColMode(iGColMode);
        }
        this.oCanvas[sType.toLowerCase()](x, y); // draw, drawr, move, mover, plot, plotr
    };
    CpcVm.prototype.vmAfterEveryGosub = function (sType, iInterval, iTimer, iLine) {
        iInterval = this.vmInRangeRound(iInterval, 0, 32767, sType); // more would be overflow
        iTimer = this.vmInRangeRound(iTimer || 0, 0, 3, sType);
        var oTimer = this.aTimer[iTimer];
        if (iInterval) {
            var iIntervalMs = iInterval * CpcVm.iFrameTimeMs; // convert to ms
            oTimer.iIntervalMs = iIntervalMs;
            oTimer.iLine = iLine;
            oTimer.bRepeat = (sType === "EVERY");
            oTimer.bActive = true;
            oTimer.iNextTimeMs = Date.now() + iIntervalMs;
        }
        else { // interval 0 => switch running timer off
            oTimer.bActive = false;
        }
    };
    CpcVm.prototype.vmCopyFromScreen = function (iSource, iDest) {
        for (var i = 0; i < 0x4000; i += 1) {
            var iByte = this.oCanvas.getByte(iSource + i); // get byte from screen memory
            if (iByte === null) { // byte not visible on screen?
                iByte = this.aMem[iSource + i] || 0; // get it from our memory
            }
            this.aMem[iDest + i] = iByte;
        }
    };
    CpcVm.prototype.vmCopyToScreen = function (iSource, iDest) {
        for (var i = 0; i < 0x4000; i += 1) {
            var iByte = this.aMem[iSource + i] || 0; // get it from our memory
            this.oCanvas.setByte(iDest + i, iByte);
        }
    };
    CpcVm.prototype.vmSetScreenBase = function (iByte) {
        iByte = this.vmInRangeRound(iByte, 0, 255, "screenBase");
        var iPage = iByte >> 6, // eslint-disable-line no-bitwise
        iOldPage = this.iScreenPage;
        if (iPage !== iOldPage) {
            var iAddr = iOldPage << 14; // eslint-disable-line no-bitwise
            this.vmCopyFromScreen(iAddr, iAddr);
            this.iScreenPage = iPage;
            iAddr = iPage << 14; // eslint-disable-line no-bitwise
            this.vmCopyToScreen(iAddr, iAddr);
        }
    };
    CpcVm.prototype.vmSetScreenOffset = function (iOffset) {
        this.oCanvas.setScreenOffset(iOffset);
    };
    // could be also set vmSetScreenViewBase? thisiScreenViewPage?  We always draw on visible canvas?
    CpcVm.prototype.vmSetTransparentMode = function (iStream, iTransparent) {
        var oWin = this.aWindow[iStream];
        oWin.bTransparent = Boolean(iTransparent);
    };
    // --
    CpcVm.prototype.abs = function (n) {
        this.vmAssertNumber(n, "ABS");
        return Math.abs(n);
    };
    CpcVm.prototype.addressOf = function (sVar) {
        // not really implemented
        sVar = sVar.replace("v.", "");
        sVar = sVar.replace("[", "(");
        var iPos = sVar.indexOf("("); // array variable with indices?
        if (iPos >= 0) {
            sVar = sVar.substr(0, iPos); // remove indices
        }
        iPos = this.oVariables.getVariableIndex(sVar);
        if (iPos < 0) {
            throw this.vmComposeError(Error(), 5, "@" + sVar); // Improper argument
        }
        return iPos;
    };
    CpcVm.prototype.afterGosub = function (iInterval, iTimer, iLine) {
        this.vmAfterEveryGosub("AFTER", iInterval, iTimer, iLine);
    };
    // and
    CpcVm.vmGetCpcCharCode = function (iCode) {
        if (iCode > 255) { // map some UTF-8 character codes
            if (CpcVm.mUtf8ToCpc[iCode]) {
                iCode = CpcVm.mUtf8ToCpc[iCode];
            }
        }
        return iCode;
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
        return Math.atan((this.bDeg) ? Utils_1.Utils.toRadians(n) : n);
    };
    CpcVm.prototype.auto = function () {
        this.vmNotImplemented("AUTO");
    };
    CpcVm.prototype.bin$ = function (n, iPad) {
        n = this.vmInRangeRound(n, -32768, 65535, "BIN$");
        iPad = this.vmInRangeRound(iPad || 0, 0, 16, "BIN$");
        return n.toString(2).padStart(iPad || 16, "0");
    };
    CpcVm.prototype.border = function (iInk1, iInk2) {
        iInk1 = this.vmInRangeRound(iInk1, 0, 31, "BORDER");
        if (iInk2 === undefined) {
            iInk2 = iInk1;
        }
        else {
            iInk2 = this.vmInRangeRound(iInk2, 0, 31, "BORDER");
        }
        this.oCanvas.setBorder(iInk1, iInk2);
    };
    // break
    CpcVm.prototype.vmMcSetMode = function (iMode) {
        iMode = this.vmInRangeRound(iMode, 0, 3, "MCSetMode");
        var iAddr = this.iScreenPage << 14, // eslint-disable-line no-bitwise
        iCanvasMode = this.oCanvas.getMode();
        if (iMode !== iCanvasMode) {
            // keep screen bytes, just interpret in other mode
            this.vmCopyFromScreen(iAddr, iAddr); // read bytes from screen memory into memory
            this.oCanvas.changeMode(iMode); // change mode and interpretation of bytes
            this.vmCopyToScreen(iAddr, iAddr); // write bytes back to screen memory
            this.oCanvas.changeMode(iCanvasMode); // keep moe
            // TODO: new content should still be written in old mode but interpreted in new mode
        }
    };
    CpcVm.prototype.vmTxtInverse = function (iStream) {
        var oWin = this.aWindow[iStream], iTmp = oWin.iPen;
        this.pen(iStream, oWin.iPaper);
        this.paper(iStream, iTmp);
    };
    CpcVm.prototype.vmPutKeyInBuffer = function (sKey) {
        this.oKeyboard.putKeyInBuffer(sKey);
        var oKeyDownHandler = this.oKeyboard.getKeyDownHandler();
        if (oKeyDownHandler) {
            oKeyDownHandler();
        }
    };
    CpcVm.prototype.call = function (iAddr) {
        // varargs (adr + parameters)
        iAddr = this.vmInRangeRound(iAddr, -32768, 65535, "CALL");
        if (iAddr < 0) { // 2nd complement of 16 bit address?
            iAddr += 65536;
        }
        switch (iAddr) {
            case 0xbb00: // KM Initialize (ROM &19E0)
                this.oKeyboard.resetCpcKeysExpansions();
                this.call(0xbb03); // KM Reset
                break;
            case 0xbb03: // KM Reset (ROM &1AE1)
                this.clearInput();
                this.oKeyboard.resetExpansionTokens();
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
                this.oCanvas.resetCustomChars();
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
                this.cursor(0, null, 1);
                break;
            case 0xbb7e: // TXT Cursor Disable (ROM &129A); user switch
                this.cursor(0, null, 0);
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
                this.oCanvas.clearGraphicsWindow();
                break;
            case 0xbbde: // GRA Set Pen (ROM &17F6), depending on number of args
                // we can only set graphics pen depending on number of args (pen 0=no arg, pen 1=one arg)
                this.graphicsPen((arguments.length - 1) % 16);
                break;
            case 0xbbe4: // GRA Set Paper (ROM &17FD), depending on number of args
                this.graphicsPaper((arguments.length - 1) % 16);
                break;
            case 0xbbfc: // GRA WR Char (ROM &1945), depending on number of args
                this.oCanvas.printGChar(arguments.length - 1);
                break;
            case 0xbbff: // SCR Initialize (ROM &0AA0)
                this.vmSetScreenBase(0xc0);
                this.iMode = 1;
                this.oCanvas.setMode(this.iMode); // does not clear canvas
                this.oCanvas.clearFullWindow(); // (SCR Mode Clear)
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
                this.oSound.reset();
                break;
            case 0xbcb6: // SOUND Hold (ROM &1ECB)
                Utils_1.Utils.console.log("TODO: CALL", iAddr);
                break;
            case 0xbcb9: // SOUND Continue (ROM &1EE6)
                Utils_1.Utils.console.log("TODO: CALL", iAddr);
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
                this.oCanvas.setMaskFirst((arguments.length - 1) % 2);
                break;
            case 0xbd4c: // GRA Set Mask (ROM ?; CPC 664/6128), depending on number of args
                this.oCanvas.setMask(arguments.length - 1);
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
                    Utils_1.Utils.console.debug("Ignored: CALL", iAddr);
                }
                break;
        }
    };
    CpcVm.prototype.cat = function () {
        var iStream = 0;
        this.vmStop("fileCat", 45, false, {
            iStream: iStream,
            sCommand: "cat"
        });
    };
    CpcVm.prototype.chain = function (sName, iLine) {
        var oInFile = this.oInFile;
        sName = this.vmAdaptFilename(sName, "CHAIN");
        this.closein();
        oInFile.bOpen = true;
        oInFile.sCommand = "chain";
        oInFile.sName = sName;
        oInFile.iLine = iLine;
        oInFile.fnFileCallback = this.fnCloseinHandler;
        this.vmStop("fileLoad", 90);
    };
    CpcVm.prototype.chainMerge = function (sName, iLine, iFirst, iLast) {
        var oInFile = this.oInFile;
        sName = this.vmAdaptFilename(sName, "CHAIN MERGE");
        this.closein();
        oInFile.bOpen = true;
        oInFile.sCommand = "chainMerge";
        oInFile.sName = sName;
        oInFile.iLine = iLine;
        oInFile.iFirst = iFirst;
        oInFile.iLast = iLast;
        oInFile.fnFileCallback = this.fnCloseinHandler;
        this.vmStop("fileLoad", 90);
    };
    CpcVm.prototype.chr$ = function (n) {
        n = this.vmInRangeRound(n, 0, 255, "CHR$");
        return String.fromCharCode(n);
    };
    CpcVm.prototype.cint = function (n) {
        return this.vmInRangeRound(n, -32768, 32767);
    };
    CpcVm.prototype.clear = function () {
        this.vmResetTimers();
        this.ei();
        this.vmSetStartLine(0);
        this.iErr = 0;
        this.iBreakGosubLine = 0;
        this.iBreakResumeLine = 0;
        this.iErrorGotoLine = 0;
        this.iErrorResumeLine = 0;
        this.aGosubStack.length = 0;
        this.oVariables.initAllVariables();
        this.defreal("a-z");
        this.restore(); // restore data line index
        this.rad();
        this.oSound.resetQueue();
        this.aSoundData.length = 0;
        this.closein();
        this.closeout();
    };
    CpcVm.prototype.clearInput = function () {
        this.oKeyboard.clearInput();
    };
    CpcVm.prototype.clg = function (iGPaper) {
        if (iGPaper !== undefined) {
            iGPaper = this.vmInRangeRound(iGPaper, 0, 15, "CLG");
            this.oCanvas.setGPaper(iGPaper);
        }
        this.oCanvas.clearGraphicsWindow();
    };
    CpcVm.prototype.vmCloseinCallback = function () {
        var oInFile = this.oInFile;
        this.vmResetFileHandling(oInFile);
    };
    CpcVm.prototype.closein = function () {
        var oInFile = this.oInFile;
        if (oInFile.bOpen) {
            this.vmCloseinCallback(); // not really used as a callback here
        }
    };
    CpcVm.prototype.vmCloseoutCallback = function () {
        var oOutFile = this.oOutFile;
        this.vmResetFileHandling(oOutFile);
    };
    CpcVm.prototype.closeout = function () {
        var oOutFile = this.oOutFile;
        if (oOutFile.bOpen) {
            if (oOutFile.sCommand !== "openout") {
                Utils_1.Utils.console.warn("closeout: command=", oOutFile.sCommand); // should not occur
            }
            if (!oOutFile.aFileData.length) { // openout without data?
                this.vmCloseoutCallback(); // close directly
            }
            else { // data to save
                oOutFile.sCommand = "closeout";
                oOutFile.fnFileCallback = this.fnCloseoutHandler;
                this.vmStop("fileSave", 90); // must stop directly after closeout
            }
        }
    };
    // also called for chr$(12), call &bb6c
    CpcVm.prototype.cls = function (iStream) {
        iStream = this.vmInRangeRound(iStream || 0, 0, 7, "CLS");
        var oWin = this.aWindow[iStream];
        this.vmDrawUndrawCursor(iStream); // why, if we clear anyway?
        this.oCanvas.clearTextWindow(oWin.iLeft, oWin.iRight, oWin.iTop, oWin.iBottom, oWin.iPaper); // cls window
        oWin.iPos = 0;
        oWin.iVpos = 0;
        if (!iStream) {
            this.sOut = ""; // clear also console, if stream===0
        }
    };
    CpcVm.prototype.commaTab = function (iStream) {
        iStream = this.vmInRangeRound(iStream || 0, 0, 9, "commaTab");
        this.vmMoveCursor2AllowedPos(iStream);
        var iZone = this.iZone, oWin = this.aWindow[iStream];
        var iCount = iZone - (oWin.iPos % iZone);
        if (oWin.iPos) { // <>0: not begin of line
            if (oWin.iPos + iCount + iZone > (oWin.iRight + 1 - oWin.iLeft)) {
                oWin.iPos += iCount + iZone;
                this.vmMoveCursor2AllowedPos(iStream);
                iCount = 0;
            }
        }
        return " ".repeat(iCount);
    };
    CpcVm.prototype.cont = function () {
        if (!this.iStartLine) {
            throw this.vmComposeError(Error(), 17, "CONT"); // cannot continue
        }
        this.vmGotoLine(this.iStartLine, "CONT");
        this.iStartLine = 0;
    };
    CpcVm.prototype.copychr$ = function (iStream) {
        iStream = this.vmInRangeRound(iStream, 0, 7, "COPYCHR$");
        this.vmMoveCursor2AllowedPos(iStream);
        this.vmDrawUndrawCursor(iStream); // undraw
        var oWin = this.aWindow[iStream], iChar = this.oCanvas.readChar(oWin.iPos + oWin.iLeft, oWin.iVpos + oWin.iTop, oWin.iPen, oWin.iPaper), sChar = (iChar >= 0) ? String.fromCharCode(iChar) : "";
        this.vmDrawUndrawCursor(iStream); // draw
        return sChar;
    };
    CpcVm.prototype.cos = function (n) {
        this.vmAssertNumber(n, "COS");
        return Math.cos((this.bDeg) ? Utils_1.Utils.toRadians(n) : n);
    };
    CpcVm.prototype.creal = function (n) {
        this.vmAssertNumber(n, "CREAL");
        return n;
    };
    CpcVm.prototype.vmPlaceRemoveCursor = function (iStream) {
        var oWin = this.aWindow[iStream];
        this.vmMoveCursor2AllowedPos(iStream);
        this.oCanvas.drawCursor(oWin.iPos + oWin.iLeft, oWin.iVpos + oWin.iTop, oWin.iPen, oWin.iPaper);
    };
    CpcVm.prototype.vmDrawUndrawCursor = function (iStream) {
        var oWin = this.aWindow[iStream];
        if (oWin.bCursorOn && oWin.bCursorEnabled) {
            this.vmPlaceRemoveCursor(iStream);
        }
    };
    CpcVm.prototype.cursor = function (iStream, iCursorOn, iCursorEnabled) {
        iStream = this.vmInRangeRound(iStream || 0, 0, 7, "CURSOR");
        var oWin = this.aWindow[iStream];
        if (iCursorOn !== null) { // system
            iCursorOn = this.vmInRangeRound(iCursorOn, 0, 1, "CURSOR");
            this.vmDrawUndrawCursor(iStream); // undraw
            oWin.bCursorOn = Boolean(iCursorOn);
            this.vmDrawUndrawCursor(iStream); // draw
        }
        if (iCursorEnabled !== undefined) { // user
            iCursorEnabled = this.vmInRangeRound(iCursorEnabled, 0, 1, "CURSOR");
            this.vmDrawUndrawCursor(iStream); // undraw
            oWin.bCursorEnabled = Boolean(iCursorEnabled);
            this.vmDrawUndrawCursor(iStream); // draw
        }
    };
    CpcVm.prototype.data = function (iLine) {
        var aArgs = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            aArgs[_i - 1] = arguments[_i];
        }
        if (!this.oDataLineIndex[iLine]) {
            this.oDataLineIndex[iLine] = this.aData.length; // set current index for the line
        }
        // append data
        for (var i = 0; i < aArgs.length; i += 1) {
            this.aData.push(aArgs[i]);
        }
    };
    CpcVm.prototype.dec$ = function (n, sFrmt) {
        this.vmAssertNumber(n, "DEC$");
        this.vmAssertString(sFrmt, "DEC$");
        return this.vmUsingFormat1(sFrmt, n);
    };
    // def fn
    CpcVm.prototype.defint = function (sNameOrRange) {
        this.vmDefineVarTypes("I", sNameOrRange, "DEFINT");
    };
    CpcVm.prototype.defreal = function (sNameOrRange) {
        this.vmDefineVarTypes("R", sNameOrRange, "DEFREAL");
    };
    CpcVm.prototype.defstr = function (sNameOrRange) {
        this.vmDefineVarTypes("$", sNameOrRange, "DEFSTR");
    };
    CpcVm.prototype.deg = function () {
        this.bDeg = true;
    };
    CpcVm.prototype["delete"] = function (iFirst, iLast) {
        if (iFirst !== undefined && iFirst !== null) {
            iFirst = this.vmInRangeRound(iFirst, 1, 65535, "DELETE");
        }
        if (iLast === null) { // range with missing last?
            iLast = 65535;
        }
        else if (iLast !== undefined) {
            iLast = this.vmInRangeRound(iLast, 1, 65535, "DELETE");
        }
        this.vmStop("deleteLines", 90, false, {
            iFirst: iFirst || 1,
            iLast: iLast || iFirst,
            sCommand: "DELETE"
        });
    };
    CpcVm.prototype.derr = function () {
        return 0; // "[Not implemented yet: derr]"
    };
    CpcVm.prototype.di = function () {
        this.iTimerPriority = 3; // increase priority
    };
    CpcVm.prototype.dim = function (sVarName) {
        var aDimensions = [];
        for (var i = 1; i < arguments.length; i += 1) {
            var iSize = this.vmInRangeRound(arguments[i], 0, 32767, "DIM") + 1; // for basic we have sizes +1
            aDimensions.push(iSize);
        }
        this.oVariables.dimVariable(sVarName, aDimensions);
    };
    CpcVm.prototype.draw = function (x, y, iGPen, iGColMode) {
        this.vmDrawMovePlot("DRAW", x, y, iGPen, iGColMode);
    };
    CpcVm.prototype.drawr = function (x, y, iGPen, iGColMode) {
        this.vmDrawMovePlot("DRAWR", x, y, iGPen, iGColMode);
    };
    CpcVm.prototype.edit = function (iLine) {
        this.vmStop("editLine", 90, false, {
            iLine: iLine
        });
    };
    CpcVm.prototype.ei = function () {
        this.iTimerPriority = -1; // decrease priority
    };
    // else
    CpcVm.prototype.end = function (sLabel) {
        this.stop(sLabel);
    };
    CpcVm.prototype.ent = function (iToneEnv) {
        var aArgs = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            aArgs[_i - 1] = arguments[_i];
        }
        var aEnvData = [];
        var oArg, bRepeat = false;
        iToneEnv = this.vmInRangeRound(iToneEnv, -15, 15, "ENT");
        if (iToneEnv < 0) {
            iToneEnv = -iToneEnv;
            bRepeat = true;
        }
        if (iToneEnv) { // not 0
            for (var i = 0; i < aArgs.length; i += 3) { // starting with 1: 3 parameters per section
                if (aArgs[i] !== null) {
                    oArg = {
                        steps: this.vmInRangeRound(aArgs[i], 0, 239, "ENT"),
                        diff: this.vmInRangeRound(aArgs[i + 1], -128, 127, "ENT"),
                        time: this.vmInRangeRound(aArgs[i + 2], 0, 255, "ENT"),
                        repeat: bRepeat
                    };
                }
                else { // special handling
                    oArg = {
                        period: this.vmInRangeRound(aArgs[i + 1], 0, 4095, "ENT"),
                        time: this.vmInRangeRound(aArgs[i + 2], 0, 255, "ENT") // time: 0..255 (0=256)
                    };
                }
                aEnvData.push(oArg);
            }
            this.oSound.setToneEnv(iToneEnv, aEnvData);
        }
        else { // 0
            Utils_1.Utils.console.warn("ENT: iToneEnv", iToneEnv);
            throw this.vmComposeError(Error(), 5, "ENT " + iToneEnv); // Improper argument
        }
    };
    CpcVm.prototype.env = function (iVolEnv) {
        var aArgs = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            aArgs[_i - 1] = arguments[_i];
        }
        var aEnvData = [];
        var oArg;
        iVolEnv = this.vmInRangeRound(iVolEnv, 1, 15, "ENV");
        for (var i = 0; i < aArgs.length; i += 3) { // starting with 1: 3 parameters per section
            if (aArgs[i] !== null) {
                oArg = {
                    steps: this.vmInRangeRound(aArgs[i], 0, 127, "ENV"),
                    /* eslint-disable no-bitwise */
                    diff: this.vmInRangeRound(aArgs[i + 1], -128, 127, "ENV") & 0x0f,
                    /* eslint-enable no-bitwise */
                    time: this.vmInRangeRound(aArgs[i + 2], 0, 255, "ENV") // time per step: 0..255 (0=256)
                };
                if (!oArg.time) { // (0=256)
                    oArg.time = 256;
                }
            }
            else { // special handling for register parameters
                oArg = {
                    register: this.vmInRangeRound(aArgs[i + 1], 0, 15, "ENV"),
                    period: this.vmInRangeRound(aArgs[i + 2], -32768, 65535, "ENV")
                };
            }
            aEnvData.push(oArg);
        }
        this.oSound.setVolEnv(iVolEnv, aEnvData);
    };
    CpcVm.prototype.eof = function () {
        var oInFile = this.oInFile;
        var iEof = -1;
        if (oInFile.bOpen && oInFile.aFileData.length) {
            iEof = 0;
        }
        return iEof;
    };
    CpcVm.prototype.vmFindArrayVariable = function (sName) {
        sName += "A";
        if (this.oVariables.variableExist(sName)) { // one dim array variable?
            return sName;
        }
        // find multi-dim array variable
        var aNames = this.oVariables.getAllVariableNames();
        aNames = aNames.filter(function (sVar) {
            return (sVar.indexOf(sName) === 0) ? sVar : null; // find array varA
        });
        return aNames[0]; // we should find exactly one
    };
    CpcVm.prototype.erase = function () {
        var aArgs = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            aArgs[_i] = arguments[_i];
        }
        for (var i = 0; i < aArgs.length; i += 1) {
            var sName = this.vmFindArrayVariable(aArgs[i]);
            if (sName) {
                this.oVariables.initVariable(sName);
            }
            else {
                Utils_1.Utils.console.warn("Array variable not found:", aArgs[i]);
                throw this.vmComposeError(Error(), 5, "ERASE " + aArgs[i]); // Improper argument
            }
        }
    };
    CpcVm.prototype.erl = function () {
        var iErl = parseInt(String(this.iErl), 10); //TTT in cpcBasic we have an error label here, so return number only
        return iErl || 0;
    };
    CpcVm.prototype.err = function () {
        return this.iErr;
    };
    CpcVm.prototype.vmComposeError = function (oError, iErr, sErrInfo) {
        var aErrors = CpcVm.aErrors, sError = aErrors[iErr] || aErrors[aErrors.length - 1]; // maybe Unknown error
        this.iErr = iErr;
        this.iErl = this.iLine;
        var sLine = this.iErl;
        if (this.iTronLine) {
            sLine += " (trace: " + this.iTronLine + ")";
        }
        var sErrorWithInfo = sError + " in " + sLine + (sErrInfo ? (": " + sErrInfo) : "");
        var bHidden = false; // hide errors wich are catched
        if (this.iErrorGotoLine && !this.iErrorResumeLine) {
            this.iErrorResumeLine = Number(this.iErl); //TTT
            this.vmGotoLine(this.iErrorGotoLine, "onError");
            this.vmStop("onError", 50);
            bHidden = true;
        }
        else {
            this.vmStop("error", 50);
        }
        Utils_1.Utils.console.log("BASIC error(" + iErr + "):", sErrorWithInfo + (bHidden ? " (hidden: " + bHidden + ")" : ""));
        return Utils_1.Utils.composeError("CpcVm", oError, sError, sErrInfo, undefined, sLine, bHidden);
    };
    CpcVm.prototype.error = function (iErr, sErrInfo) {
        iErr = this.vmInRangeRound(iErr, 0, 255, "ERROR"); // could trigger another error
        throw this.vmComposeError(Error(), iErr, sErrInfo);
    };
    CpcVm.prototype.everyGosub = function (iInterval, iTimer, iLine) {
        this.vmAfterEveryGosub("EVERY", iInterval, iTimer, iLine);
    };
    CpcVm.prototype.exp = function (n) {
        this.vmAssertNumber(n, "EXP");
        return Math.exp(n);
    };
    CpcVm.prototype.fill = function (iGPen) {
        iGPen = this.vmInRangeRound(iGPen, 0, 15, "FILL");
        this.oCanvas.fill(iGPen);
    };
    CpcVm.prototype.fix = function (n) {
        this.vmAssertNumber(n, "FIX");
        return Math.trunc(n); // (ES6: Math.trunc)
    };
    // fn
    // for
    CpcVm.prototype.frame = function () {
        this.vmStop("waitFrame", 40);
    };
    CpcVm.prototype.fre = function ( /* arg */) {
        return this.iHimem; // example, e.g. 42245;
    };
    CpcVm.prototype.gosub = function (retLabel, n) {
        this.vmGotoLine(n, "gosub (ret=" + retLabel + ")");
        this.aGosubStack.push(retLabel);
    };
    CpcVm.prototype["goto"] = function (n) {
        this.vmGotoLine(n, "goto");
    };
    CpcVm.prototype.graphicsPaper = function (iGPaper) {
        iGPaper = this.vmInRangeRound(iGPaper, 0, 15, "GRAPHICS PAPER");
        this.oCanvas.setGPaper(iGPaper);
    };
    CpcVm.prototype.graphicsPen = function (iGPen, iTransparentMode) {
        if (iGPen !== null) {
            iGPen = this.vmInRangeRound(iGPen, 0, 15, "GRAPHICS PEN");
            this.oCanvas.setGPen(iGPen);
        }
        if (iTransparentMode !== undefined) {
            iTransparentMode = this.vmInRangeRound(iTransparentMode, 0, 1, "GRAPHICS PEN");
            this.oCanvas.setGTransparentMode(Boolean(iTransparentMode));
        }
    };
    CpcVm.prototype.hex$ = function (n, iPad) {
        n = this.vmInRangeRound(n, -32768, 65535, "HEX$");
        iPad = this.vmInRangeRound(iPad || 0, 0, 16, "HEX$");
        return n.toString(16).toUpperCase().padStart(iPad, "0");
    };
    CpcVm.prototype.himem = function () {
        return this.iHimem;
    };
    // if
    CpcVm.prototype.ink = function (iPen, iInk1, iInk2) {
        iPen = this.vmInRangeRound(iPen, 0, 15, "INK");
        iInk1 = this.vmInRangeRound(iInk1, 0, 31, "INK");
        if (iInk2 === undefined) {
            iInk2 = iInk1;
        }
        else {
            iInk2 = this.vmInRangeRound(iInk2, 0, 31, "INK");
        }
        this.oCanvas.setInk(iPen, iInk1, iInk2);
    };
    CpcVm.prototype.inkey = function (iKey) {
        iKey = this.vmInRangeRound(iKey, 0, 79, "INKEY");
        return this.oKeyboard.getKeyState(iKey);
    };
    CpcVm.prototype.inkey$ = function () {
        var sKey = this.oKeyboard.getKeyFromBuffer();
        // do some slowdown, if checked too early again without key press
        if (sKey !== "") { // some key pressed?
            this.iInkeyTime = 0;
        }
        else { // no key
            var iNow = Date.now();
            if (this.iInkeyTimeMs && iNow < this.iInkeyTimeMs) { // last inkey without key was in range of frame fly?
                this.frame(); // then insert a frame fly
            }
            this.iInkeyTimeMs = iNow + CpcVm.iFrameTimeMs; // next time of frame fly
        }
        return sKey;
    };
    CpcVm.prototype.inp = function (iPort) {
        var iByte = 255; //TTT
        iPort = this.vmInRangeRound(iPort, -32768, 65535, "INP");
        if (iPort < 0) { // 2nd complement of 16 bit address?
            iPort += 65536;
        }
        return iByte;
    };
    CpcVm.prototype.vmSetInputValues = function (aInputValues) {
        this.aInputValues = aInputValues;
    };
    CpcVm.prototype.vmGetNextInput = function () {
        var aInputValues = this.aInputValues, value = aInputValues.shift();
        return value;
    };
    CpcVm.prototype.vmInputCallback = function () {
        var oInput = this.vmGetStopObject().oParas, iStream = oInput.iStream, sInput = oInput.sInput, aInputValues = sInput.split(","), aConvertedInputValues = [], aTypes = oInput.aTypes;
        var bInputOk = true;
        Utils_1.Utils.console.log("vmInputCallback:", sInput);
        if (aInputValues.length === aTypes.length) {
            for (var i = 0; i < aTypes.length; i += 1) {
                var sVarType = aTypes[i], sType = this.vmDetermineVarType(sVarType), sValue = aInputValues[i];
                if (sType !== "$") { // not a string?
                    var iValue = this.vmVal(sValue); // convert to number (also binary, hex), empty string gets 0
                    if (isNaN(iValue)) {
                        bInputOk = false;
                    }
                    //aInputValues[i] = this.vmAssign(sVarType, value);
                    aConvertedInputValues.push(iValue);
                }
                else {
                    aConvertedInputValues.push(sValue);
                }
            }
        }
        else {
            bInputOk = false;
        }
        this.cursor(iStream, 0);
        if (!bInputOk) {
            this.print(iStream, "?Redo from start\r\n");
            oInput.sInput = "";
            this.print(iStream, oInput.sMessage);
            this.cursor(iStream, 1);
        }
        else {
            this.vmSetInputValues(aConvertedInputValues);
        }
        return bInputOk;
    };
    CpcVm.prototype.vmInputNextFileItem = function (sType) {
        var that = this, aFileData = this.oInFile.aFileData;
        var sLine, iIndex, value;
        var fnGetString = function () {
            if (sLine.charAt(0) === '"') { // quoted string?
                iIndex = sLine.indexOf('"', 1); // closing quotes in this line?
                if (iIndex >= 0) {
                    value = sLine.substr(1, iIndex - 1); // take string without quotes
                    sLine = sLine.substr(iIndex + 1);
                    sLine = sLine.replace(/^\s*,/, ""); // multiple args => remove next comma
                }
                else if (aFileData.length > 1) { // no closing quotes in this line => try to combine with next line
                    aFileData.shift(); // remove line
                    sLine += "\n" + aFileData[0]; // combine lines
                }
                else {
                    throw that.vmComposeError(Error(), 13, "INPUT #9: no closing quotes" + value); // TTT
                }
            }
            else { // unquoted string
                iIndex = sLine.indexOf(","); // multiple args?
                if (iIndex >= 0) {
                    value = sLine.substr(0, iIndex); // take arg
                    sLine = sLine.substr(iIndex + 1);
                }
                else {
                    value = sLine; // take line
                    sLine = "";
                }
            }
            return value;
        }, fnGetNumber = function () {
            iIndex = sLine.indexOf(","); // multiple args?
            if (iIndex >= 0) {
                value = sLine.substr(0, iIndex); // take arg
                sLine = sLine.substr(iIndex + 1);
            }
            else {
                iIndex = sLine.indexOf(" "); // space?
                if (iIndex >= 0) {
                    value = sLine.substr(0, iIndex); // take item until space
                    sLine = sLine.substr(iIndex);
                    sLine = sLine.replace(/^\s*/, ""); // remove spaces after number
                }
                else {
                    value = sLine; // take line
                    sLine = "";
                }
            }
            var nValue = that.vmVal(value); // convert to number (also binary, hex)
            if (isNaN(nValue)) { // eslint-disable-line max-depth
                throw that.vmComposeError(Error(), 13, "INPUT #9 " + nValue + ": " + value); // Type mismatch
            }
            return nValue;
        };
        while (aFileData.length && value === undefined) {
            sLine = aFileData[0];
            sLine = sLine.replace(/^\s+/, ""); // remove preceding whitespace
            if (sType === "$") {
                value = fnGetString();
            }
            else { // number type sLine.length TTT
                value = fnGetNumber();
            }
            if (sLine.length) {
                aFileData[0] = sLine;
            }
            else {
                aFileData.shift(); // remove line
            }
        }
        return value;
    };
    CpcVm.prototype.vmInputFromFile = function (aTypes) {
        var aInputValues = [];
        for (var i = 0; i < aTypes.length; i += 1) {
            var sVarType = aTypes[i], sType = this.vmDetermineVarType(sVarType), value = this.vmInputNextFileItem(sType);
            aInputValues[i] = this.vmAssign(sVarType, value);
        }
        this.vmSetInputValues(aInputValues);
    };
    CpcVm.prototype.input = function (iStream, sNoCRLF, sMsg) {
        iStream = this.vmInRangeRound(iStream || 0, 0, 9, "waitInput");
        if (iStream < 8) {
            this.print(iStream, sMsg);
            this.vmStop("waitInput", 45, false, {
                iStream: iStream,
                sMessage: sMsg,
                sNoCRLF: sNoCRLF,
                fnInputCallback: this.vmInputCallback.bind(this),
                aTypes: Array.prototype.slice.call(arguments, 3),
                sInput: "",
                iLine: this.iLine // to repeat in case of break
            });
            this.cursor(iStream, 1);
        }
        else if (iStream === 8) {
            this.vmSetInputValues(["I am the printer!"]);
        }
        else if (iStream === 9) {
            if (!this.oInFile.bOpen) {
                throw this.vmComposeError(Error(), 31, "INPUT #" + iStream); // File not open
            }
            else if (this.eof()) {
                throw this.vmComposeError(Error(), 24, "INPUT #" + iStream); // EOF met
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
        this.vmAssertString(p2, "INSTR");
        return p2.indexOf(p3, p1) + 1; // p2=string, p3=search string
    };
    CpcVm.prototype["int"] = function (n) {
        this.vmAssertNumber(n, "INT");
        return Math.floor(n);
    };
    CpcVm.prototype.joy = function (iJoy) {
        iJoy = this.vmInRangeRound(iJoy, 0, 1, "JOY");
        return this.oKeyboard.getJoyState(iJoy);
    };
    CpcVm.prototype.key = function (iToken, s) {
        iToken = this.vmRound(iToken, "KEY");
        if (iToken >= 128 && iToken <= 159) {
            iToken -= 128;
        }
        iToken = this.vmInRangeRound(iToken, 0, 31, "KEY"); // round again, but we want the check
        this.vmAssertString(s, "KEY");
        this.oKeyboard.setExpansionToken(iToken, s);
    };
    CpcVm.prototype.keyDef = function (iCpcKey, iRepeat, iNormal, iShift, iCtrl) {
        var oOptions = {
            iCpcKey: this.vmInRangeRound(iCpcKey, 0, 79, "KEY DEF"),
            iRepeat: this.vmInRangeRound(iRepeat, 0, 1, "KEY DEF"),
            iNormal: (iNormal !== undefined && iNormal !== null) ? this.vmInRangeRound(iNormal, 0, 255, "KEY DEF") : undefined,
            iShift: (iShift !== undefined && iShift !== null) ? this.vmInRangeRound(iShift, 0, 255, "KEY DEF") : undefined,
            iCtrl: (iCtrl !== undefined && iCtrl !== null) ? this.vmInRangeRound(iCtrl, 0, 255, "KEY DEF") : undefined
        };
        this.oKeyboard.setCpcKeyExpansion(oOptions);
    };
    CpcVm.prototype.left$ = function (s, iLen) {
        this.vmAssertString(s, "LEFT$");
        iLen = this.vmInRangeRound(iLen, 0, 255, "LEFT$");
        return s.substr(0, iLen);
    };
    CpcVm.prototype.len = function (s) {
        this.vmAssertString(s, "LEN");
        return s.length;
    };
    // let
    CpcVm.prototype.vmLineInputCallback = function () {
        var oInput = this.vmGetStopObject().oParas, sInput = oInput.sInput;
        Utils_1.Utils.console.log("vmLineInputCallback:", sInput);
        this.vmSetInputValues([sInput]);
        this.cursor(oInput.iStream, 0);
        return true;
    };
    CpcVm.prototype.lineInput = function (iStream, sNoCRLF, sMsg, sVarType) {
        iStream = this.vmInRangeRound(iStream || 0, 0, 9, "LINE INPUT");
        if (iStream < 8) {
            this.print(iStream, sMsg);
            var sType = this.vmDetermineVarType(sVarType);
            if (sType !== "$") { // not string?
                this.print(iStream, "\r\n");
                throw this.vmComposeError(Error(), 13, "LINE INPUT " + sType); // Type mismatch
            }
            this.cursor(iStream, 1);
            this.vmStop("waitInput", 45, false, {
                iStream: iStream,
                sMessage: sMsg,
                sNoCRLF: sNoCRLF,
                fnInputCallback: this.vmLineInputCallback.bind(this),
                sInput: "",
                iLine: this.iLine // to repeat in case of break
            });
        }
        else if (iStream === 8) {
            this.vmSetInputValues(["I am the printer!"]);
        }
        else if (iStream === 9) {
            if (!this.oInFile.bOpen) {
                throw this.vmComposeError(Error(), 31, "LINE INPUT #" + iStream); // File not open
            }
            else if (this.eof()) {
                throw this.vmComposeError(Error(), 24, "LINE INPUT #" + iStream); // EOF met
            }
            this.vmSetInputValues(this.oInFile.aFileData.splice(0, arguments.length - 3)); // always 1 element
        }
    };
    CpcVm.prototype.list = function (iStream, iFirst, iLast) {
        iStream = this.vmInRangeRound(iStream || 0, 0, 9, "LIST");
        if (iFirst !== undefined && iFirst !== null) {
            iFirst = this.vmInRangeRound(iFirst, 1, 65535, "LIST");
        }
        if (iLast === null) { // range with missing last?
            iLast = 65535;
        }
        else if (iLast !== undefined) {
            iLast = this.vmInRangeRound(iLast, 1, 65535, "LIST");
        }
        if (iStream === 9) {
            if (!this.oOutFile.bOpen) { // catch here
                throw this.vmComposeError(Error(), 31, "LIST #" + iStream); // File not open
            }
        }
        this.vmStop("list", 90, false, {
            iStream: iStream,
            iFirst: iFirst || 1,
            iLast: iLast || iFirst
        });
    };
    CpcVm.prototype.vmLoadCallback = function (sInput, oMeta) {
        var oInFile = this.oInFile;
        var bPutInMemory = false;
        if (sInput !== null && oMeta) {
            if (oMeta.sType === "B" || oInFile.iStart !== undefined) { // only for binary files or when a load address is specified (feature)
                var iStart = oInFile.iStart !== undefined ? oInFile.iStart : Number(oMeta.iStart);
                var iLength = Number(oMeta.iLength); // we do not really need the length from metadata
                if (isNaN(iLength)) {
                    iLength = sInput.length; // only valid after atob()
                }
                if (Utils_1.Utils.debug > 1) {
                    Utils_1.Utils.console.debug("vmLoadCallback:", oInFile.sName + ": putting data in memory", iStart, "-", iStart + iLength);
                }
                for (var i = 0; i < iLength; i += 1) {
                    var iByte = sInput.charCodeAt(i);
                    this.poke((iStart + i) & 0xffff, iByte); // eslint-disable-line no-bitwise
                }
                bPutInMemory = true;
            }
        }
        this.closein();
        return bPutInMemory;
    };
    CpcVm.prototype.load = function (sName, iStart) {
        var oInFile = this.oInFile;
        sName = this.vmAdaptFilename(sName, "LOAD");
        if (iStart !== undefined) {
            iStart = this.vmInRangeRound(iStart, -32768, 65535, "LOAD");
            if (iStart < 0) { // 2nd complement of 16 bit address
                iStart += 65536;
            }
        }
        this.closein();
        oInFile.bOpen = true;
        oInFile.sCommand = "load";
        oInFile.sName = sName;
        oInFile.iStart = iStart;
        oInFile.fnFileCallback = this.fnLoadHandler;
        this.vmStop("fileLoad", 90);
    };
    CpcVm.prototype.vmLocate = function (iStream, iPos, iVpos) {
        var oWin = this.aWindow[iStream];
        oWin.iPos = iPos - 1;
        oWin.iVpos = iVpos - 1;
    };
    CpcVm.prototype.locate = function (iStream, iPos, iVpos) {
        iStream = this.vmInRangeRound(iStream || 0, 0, 7, "LOCATE");
        iPos = this.vmInRangeRound(iPos, 1, 255, "LOCATE");
        iVpos = this.vmInRangeRound(iVpos, 1, 255, "LOCATE");
        this.vmDrawUndrawCursor(iStream); // undraw
        this.vmLocate(iStream, iPos, iVpos);
        this.vmDrawUndrawCursor(iStream); // draw
    };
    CpcVm.prototype.log = function (n) {
        this.vmAssertNumber(n, "LOG");
        return Math.log(n);
    };
    CpcVm.prototype.log10 = function (n) {
        this.vmAssertNumber(n, "LOG10");
        return Math.log10(n);
    };
    CpcVm.prototype.lower$ = function (s) {
        this.vmAssertString(s, "LOWER$");
        var fnLowerCase = function (sMatch) {
            return sMatch.toLowerCase();
        };
        s = s.replace(/[A-Z]/g, fnLowerCase); // replace only characters A-Z
        return s;
    };
    CpcVm.prototype.mask = function (iMask, iFirst) {
        if (iMask !== null) {
            iMask = this.vmInRangeRound(iMask, 0, 255, "MASK");
            this.oCanvas.setMask(iMask);
        }
        if (iFirst !== undefined) {
            iFirst = this.vmInRangeRound(iFirst, 0, 1, "MASK");
            this.oCanvas.setMaskFirst(iFirst);
        }
    };
    CpcVm.prototype.max = function () {
        var aArgs = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            aArgs[_i] = arguments[_i];
        }
        for (var i = 0; i < aArgs.length; i += 1) {
            this.vmAssertNumber(aArgs[i], "MAX");
        }
        return Math.max.apply(null, aArgs);
    };
    CpcVm.prototype.memory = function (n) {
        n = this.vmInRangeRound(n, -32768, 65535, "MEMORY");
        if (n < CpcVm.iMinHimem || n > this.iMinCharHimem) {
            throw this.vmComposeError(Error(), 7, "MEMORY " + n); // Memory full
        }
        this.iHimem = n;
    };
    CpcVm.prototype.merge = function (sName) {
        var oInFile = this.oInFile;
        sName = this.vmAdaptFilename(sName, "MERGE");
        this.closein();
        oInFile.bOpen = true;
        oInFile.sCommand = "merge";
        oInFile.sName = sName;
        oInFile.fnFileCallback = this.fnCloseinHandler;
        this.vmStop("fileLoad", 90);
    };
    CpcVm.prototype.mid$ = function (s, iStart, iLen) {
        this.vmAssertString(s, "MID$");
        iStart = this.vmInRangeRound(iStart, 1, 255, "MID$");
        if (iLen !== undefined) {
            iLen = this.vmInRangeRound(iLen, 0, 255, "MID$");
        }
        return s.substr(iStart - 1, iLen);
    };
    CpcVm.prototype.mid$Assign = function (s, iStart, iLen, sNew) {
        this.vmAssertString(s, "MID$");
        this.vmAssertString(sNew, "MID$");
        iStart = this.vmInRangeRound(iStart, 1, 255, "MID$") - 1;
        iLen = (iLen !== null) ? this.vmInRangeRound(iLen, 0, 255, "MID$") : sNew.length;
        if (iLen > sNew.length) {
            iLen = sNew.length;
        }
        if (iLen > s.length - iStart) {
            iLen = s.length - iStart;
        }
        s = s.substr(0, iStart) + sNew.substr(0, iLen) + s.substr(iStart + iLen);
        return s;
    };
    CpcVm.prototype.min = function () {
        var aArgs = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            aArgs[_i] = arguments[_i];
        }
        for (var i = 0; i < aArgs.length; i += 1) {
            this.vmAssertNumber(aArgs[i], "MIN");
        }
        return Math.min.apply(null, aArgs);
    };
    // mod
    CpcVm.prototype.mode = function (iMode) {
        iMode = this.vmInRangeRound(iMode, 0, 3, "MODE");
        this.iMode = iMode;
        this.vmResetWindowData(false); // do not reset pen and paper
        this.sOut = ""; // clear console
        this.oCanvas.setMode(iMode); // does not clear canvas
        this.oCanvas.clearFullWindow(); // always with paper 0 (SCR MODE CLEAR)
    };
    CpcVm.prototype.move = function (x, y, iGPen, iGColMode) {
        this.vmDrawMovePlot("MOVE", x, y, iGPen, iGColMode);
    };
    CpcVm.prototype.mover = function (x, y, iGPen, iGColMode) {
        this.vmDrawMovePlot("MOVER", x, y, iGPen, iGColMode);
    };
    CpcVm.prototype["new"] = function () {
        this.clear();
        this.vmStop("new", 90, false, {
            sCommand: "NEW"
        });
    };
    // next
    // not
    CpcVm.prototype.onBreakCont = function () {
        this.iBreakGosubLine = -1;
        this.iBreakResumeLine = 0;
    };
    CpcVm.prototype.onBreakGosub = function (iLine) {
        this.iBreakGosubLine = iLine;
        this.iBreakResumeLine = 0;
    };
    CpcVm.prototype.onBreakStop = function () {
        this.iBreakGosubLine = 0;
        this.iBreakResumeLine = 0;
    };
    CpcVm.prototype.onErrorGoto = function (iLine) {
        this.iErrorGotoLine = iLine;
        if (!iLine && this.iErrorResumeLine) { // line=0 but an error to resume?
            throw this.vmComposeError(Error(), this.iErr, "ON ERROR GOTO without RESUME from " + this.iErl);
        }
    };
    CpcVm.prototype.onGosub = function (retLabel, n) {
        var aArgs = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            aArgs[_i - 2] = arguments[_i];
        }
        n = this.vmInRangeRound(n, 0, 255, "ON GOSUB");
        var iLine; //: string;
        if (!n || n > aArgs.length) { // out of range? => continue with line after onGosub
            if (Utils_1.Utils.debug > 0) {
                Utils_1.Utils.console.debug("onGosub: out of range: n=" + n + " in " + this.iLine);
            }
            iLine = retLabel;
        }
        else {
            iLine = aArgs[n - 1]; // n=1...
            this.aGosubStack.push(retLabel);
        }
        this.vmGotoLine(iLine, "onGosub (n=" + n + ", ret=" + retLabel + ", iLine=" + iLine + ")");
    };
    CpcVm.prototype.onGoto = function (retLabel, n) {
        var aArgs = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            aArgs[_i - 2] = arguments[_i];
        }
        n = this.vmInRangeRound(n, 0, 255, "ON GOTO");
        var iLine; //: string;
        if (!n || n > aArgs.length) { // out of range? => continue with line after onGoto
            if (Utils_1.Utils.debug > 0) {
                Utils_1.Utils.console.debug("onGoto: out of range: n=" + n + " in " + this.iLine);
            }
            iLine = retLabel;
        }
        else {
            iLine = aArgs[n - 1];
        }
        this.vmGotoLine(iLine, "onGoto (n=" + n + ", ret=" + retLabel + ", iLine=" + iLine + ")");
    };
    CpcVm.prototype.fnChannel2ChannelIndex = function (iChannel) {
        if (iChannel === 4) {
            iChannel = 2;
        }
        else {
            iChannel -= 1;
        }
        return iChannel;
    };
    CpcVm.prototype.onSqGosub = function (iChannel, iLine) {
        iChannel = this.vmInRangeRound(iChannel, 1, 4, "ON SQ GOSUB");
        if (iChannel === 3) {
            throw this.vmComposeError(Error(), 5, "ON SQ GOSUB " + iChannel); // Improper argument
        }
        iChannel = this.fnChannel2ChannelIndex(iChannel);
        var oSqTimer = this.aSqTimer[iChannel];
        oSqTimer.iLine = iLine;
        oSqTimer.bActive = true;
        oSqTimer.bRepeat = true; // means reloaded for sq
    };
    CpcVm.prototype.vmOpeninCallback = function (sInput) {
        if (sInput !== null) {
            sInput = sInput.replace(/\r\n/g, "\n"); // remove CR (maybe from ASCII file in "binary" form)
            if (sInput.endsWith("\n")) {
                sInput = sInput.substr(0, sInput.length - 1); // remove last "\n" (TTT: also for data files?)
            }
            var oInFile = this.oInFile;
            oInFile.aFileData = sInput.split("\n");
        }
        else {
            this.closein();
        }
    };
    CpcVm.prototype.openin = function (sName) {
        sName = this.vmAdaptFilename(sName, "OPENIN");
        var oInFile = this.oInFile;
        if (!oInFile.bOpen) {
            if (sName) {
                oInFile.bOpen = true;
                oInFile.sCommand = "openin";
                oInFile.sName = sName;
                oInFile.fnFileCallback = this.fnOpeninHandler;
                this.vmStop("fileLoad", 90);
            }
        }
        else {
            throw this.vmComposeError(Error(), 27, "OPENIN " + oInFile.sName); // file already open
        }
    };
    CpcVm.prototype.openout = function (sName) {
        var oOutFile = this.oOutFile;
        if (oOutFile.bOpen) {
            throw this.vmComposeError(Error(), 27, "OPENOUT " + oOutFile.sName); // file already open
        }
        sName = this.vmAdaptFilename(sName, "OPENOUT");
        oOutFile.bOpen = true;
        oOutFile.sCommand = "openout";
        oOutFile.sName = sName;
        oOutFile.aFileData = []; // no data yet
        oOutFile.sType = "A"; // ASCII
    };
    // or
    CpcVm.prototype.origin = function (xOff, yOff, xLeft, xRight, yTop, yBottom) {
        xOff = this.vmInRangeRound(xOff, -32768, 32767, "ORIGIN");
        yOff = this.vmInRangeRound(yOff, -32768, 32767, "ORIGIN");
        this.oCanvas.setOrigin(xOff, yOff);
        if (xLeft !== undefined) {
            xLeft = this.vmInRangeRound(xLeft, -32768, 32767, "ORIGIN");
            xRight = this.vmInRangeRound(xRight, -32768, 32767, "ORIGIN");
            yTop = this.vmInRangeRound(yTop, -32768, 32767, "ORIGIN");
            yBottom = this.vmInRangeRound(yBottom, -32768, 32767, "ORIGIN");
            this.oCanvas.setGWindow(xLeft, xRight, yTop, yBottom);
        }
    };
    CpcVm.prototype.vmSetRamSelect = function (iBank) {
        // we support RAM select for banks 0,4... (so not for 1 to 3)
        if (!iBank) {
            this.iRamSelect = 0;
        }
        else if (iBank >= 4) {
            this.iRamSelect = iBank - 3; // bank 4 gets position 1
        }
    };
    CpcVm.prototype.vmSetCrtcData = function (iByte) {
        var iCrtcReg = this.iCrtcReg, aCrtcData = this.aCrtcData;
        aCrtcData[iCrtcReg] = iByte;
        if (iCrtcReg === 12 || iCrtcReg === 13) { // screen offset changed
            var iOffset = (((aCrtcData[12] || 0) & 0x03) << 9) | ((aCrtcData[13] || 0) << 1); // eslint-disable-line no-bitwise
            this.vmSetScreenOffset(iOffset);
        }
    };
    CpcVm.prototype.out = function (iPort, iByte) {
        iPort = this.vmInRangeRound(iPort, -32768, 65535, "OUT");
        if (iPort < 0) { // 2nd complement of 16 bit address?
            iPort += 65536;
        }
        iByte = this.vmInRangeRound(iByte, 0, 255, "OUT");
        var iPortHigh = iPort >> 8; // eslint-disable-line no-bitwise
        if (iPortHigh === 0x7f) { // 7Fxx = RAM select
            this.vmSetRamSelect(iByte - 0xc0);
        }
        else if (iPortHigh === 0xbc) { // limited support for CRTC 12, 13
            this.iCrtcReg = iByte % 14;
        }
        else if (iPortHigh === 0xbd) {
            this.vmSetCrtcData(iByte);
            this.aCrtcData[this.iCrtcReg] = iByte;
        }
        else if (Utils_1.Utils.debug > 0) {
            Utils_1.Utils.console.debug("OUT", Number(iPort).toString(16), iByte, ": unknown port");
        }
    };
    CpcVm.prototype.paper = function (iStream, iPaper) {
        iStream = this.vmInRangeRound(iStream || 0, 0, 7, "PAPER");
        iPaper = this.vmInRangeRound(iPaper, 0, 15, "PAPER");
        var oWin = this.aWindow[iStream];
        oWin.iPaper = iPaper;
    };
    CpcVm.prototype.vmGetCharDataByte = function (iAddr) {
        var iDataPos = (iAddr - 1 - this.iMinCharHimem) % 8, iChar = this.iMinCustomChar + (iAddr - 1 - iDataPos - this.iMinCharHimem) / 8, aCharData = this.oCanvas.getCharData(iChar);
        return aCharData[iDataPos];
    };
    CpcVm.prototype.vmSetCharDataByte = function (iAddr, iByte) {
        var iDataPos = (iAddr - 1 - this.iMinCharHimem) % 8, iChar = this.iMinCustomChar + (iAddr - 1 - iDataPos - this.iMinCharHimem) / 8, aCharData = Object.assign({}, this.oCanvas.getCharData(iChar)); // we need a copy to not modify original data
        aCharData[iDataPos] = iByte; // change one byte
        this.oCanvas.setCustomChar(iChar, aCharData);
    };
    CpcVm.prototype.peek = function (iAddr) {
        iAddr = this.vmInRangeRound(iAddr, -32768, 65535, "PEEK");
        if (iAddr < 0) { // 2nd complement of 16 bit address
            iAddr += 65536;
        }
        // check two higher bits of 16 bit address to get 16K page
        var iPage = iAddr >> 14; // eslint-disable-line no-bitwise
        var iByte;
        if (iPage === this.iScreenPage) { // screen memory page?
            iByte = this.oCanvas.getByte(iAddr); // get byte from screen memory
            if (iByte === null) { // byte not visible on screen?
                iByte = this.aMem[iAddr] || 0; // get it from our memory
            }
        }
        else if (iPage === 1 && this.iRamSelect) { // memory mapped RAM with page 1=0x4000..0x7fff?
            iAddr = (this.iRamSelect - 1) * 0x4000 + 0x10000 + iAddr;
            iByte = this.aMem[iAddr] || 0;
        }
        else if (iAddr > this.iMinCharHimem && iAddr <= this.iMaxCharHimem) { // character map?
            iByte = this.vmGetCharDataByte(iAddr);
        }
        else {
            iByte = this.aMem[iAddr] || 0;
        }
        return iByte;
    };
    CpcVm.prototype.pen = function (iStream, iPen, iTransparent) {
        if (iPen !== null) {
            iStream = this.vmInRangeRound(iStream || 0, 0, 7, "PEN");
            var oWin = this.aWindow[iStream];
            iPen = this.vmInRangeRound(iPen, 0, 15, "PEN");
            oWin.iPen = iPen;
        }
        if (iTransparent !== null && iTransparent !== undefined) {
            iTransparent = this.vmInRangeRound(iTransparent, 0, 1, "PEN");
            this.vmSetTransparentMode(iStream, iTransparent);
        }
    };
    CpcVm.prototype.pi = function () {
        return Math.PI; // or less precise: 3.14159265
    };
    CpcVm.prototype.plot = function (x, y, iGPen, iGColMode) {
        this.vmDrawMovePlot("PLOT", x, y, iGPen, iGColMode);
    };
    CpcVm.prototype.plotr = function (x, y, iGPen, iGColMode) {
        this.vmDrawMovePlot("PLOTR", x, y, iGPen, iGColMode);
    };
    CpcVm.prototype.poke = function (iAddr, iByte) {
        iAddr = this.vmInRangeRound(iAddr, -32768, 65535, "POKE address");
        if (iAddr < 0) { // 2nd complement of 16 bit address?
            iAddr += 65536;
        }
        iByte = this.vmInRangeRound(iByte, 0, 255, "POKE byte");
        // check two higher bits of 16 bit address to get 16K page
        var iPage = iAddr >> 14; // eslint-disable-line no-bitwise
        if (iPage === 1 && this.iRamSelect) { // memory mapped RAM with page 1=0x4000..0x7fff?
            iAddr = (this.iRamSelect - 1) * 0x4000 + 0x10000 + iAddr;
        }
        else if (iPage === this.iScreenPage) { // screen memory page?
            this.oCanvas.setByte(iAddr, iByte); // write byte also to screen memory
        }
        else if (iAddr > this.iMinCharHimem && iAddr <= this.iMaxCharHimem) { // character map?
            this.vmSetCharDataByte(iAddr, iByte);
        }
        this.aMem[iAddr] = iByte;
    };
    CpcVm.prototype.pos = function (iStream) {
        iStream = this.vmInRangeRound(iStream, 0, 9, "POS");
        var iPos;
        if (iStream < 8) {
            iPos = this.vmGetAllowedPosOrVpos(iStream, false) + 1; // get allowed pos
        }
        else if (iStream === 8) { // printer position
            iPos = 1; // TODO
        }
        else { // stream 9: number of characters written since last CR (\r)
            iPos = 1; // TODO
        }
        return iPos;
    };
    CpcVm.prototype.vmGetAllowedPosOrVpos = function (iStream, bVpos) {
        var oWin = this.aWindow[iStream], iLeft = oWin.iLeft, iRight = oWin.iRight, iTop = oWin.iTop, iBottom = oWin.iBottom;
        var x = oWin.iPos, y = oWin.iVpos;
        if (x > (iRight - iLeft)) {
            y += 1;
            x = 0;
        }
        if (x < 0) {
            y -= 1;
            x = iRight - iLeft;
        }
        if (!bVpos) {
            return x;
        }
        if (y < 0) {
            y = 0;
        }
        if (y > (iBottom - iTop)) {
            y = iBottom - iTop;
        }
        return y;
    };
    CpcVm.prototype.vmMoveCursor2AllowedPos = function (iStream) {
        var oWin = this.aWindow[iStream], iLeft = oWin.iLeft, iRight = oWin.iRight, iTop = oWin.iTop, iBottom = oWin.iBottom;
        var x = oWin.iPos, y = oWin.iVpos;
        if (x > (iRight - iLeft)) {
            y += 1;
            x = 0;
            this.sOut += "\n";
        }
        if (x < 0) {
            y -= 1;
            x = iRight - iLeft;
        }
        if (y < 0) {
            y = 0;
            if (iStream < 8) {
                this.oCanvas.windowScrollDown(iLeft, iRight, iTop, iBottom, oWin.iPaper);
            }
        }
        if (y > (iBottom - iTop)) {
            y = iBottom - iTop;
            if (iStream < 8) {
                this.oCanvas.windowScrollUp(iLeft, iRight, iTop, iBottom, oWin.iPaper);
            }
        }
        oWin.iPos = x;
        oWin.iVpos = y;
    };
    CpcVm.prototype.vmPrintChars = function (iStream, sStr) {
        var oWin = this.aWindow[iStream];
        if (!oWin.bTextEnabled) {
            if (Utils_1.Utils.debug > 0) {
                Utils_1.Utils.console.debug("vmPrintChars: text output disabled:", sStr);
            }
            return;
        }
        // put cursor in next line if string does not fit in line any more
        this.vmMoveCursor2AllowedPos(iStream);
        if (oWin.iPos && (oWin.iPos + sStr.length > (oWin.iRight + 1 - oWin.iLeft))) {
            oWin.iPos = 0;
            oWin.iVpos += 1; // "\r\n", newline if string does not fit in line
        }
        for (var i = 0; i < sStr.length; i += 1) {
            var iChar = CpcVm.vmGetCpcCharCode(sStr.charCodeAt(i));
            this.vmMoveCursor2AllowedPos(iStream);
            this.oCanvas.printChar(iChar, oWin.iPos + oWin.iLeft, oWin.iVpos + oWin.iTop, oWin.iPen, oWin.iPaper, oWin.bTransparent);
            oWin.iPos += 1;
        }
    };
    CpcVm.prototype.vmControlSymbol = function (sPara) {
        var aPara = [];
        for (var i = 0; i < sPara.length; i += 1) {
            aPara.push(sPara.charCodeAt(i));
        }
        var iChar = aPara[0];
        if (iChar >= this.iMinCustomChar) {
            this.symbol.apply(this, aPara);
        }
        else {
            Utils_1.Utils.console.log("vmControlSymbol: define SYMBOL ignored:", iChar);
        }
    };
    CpcVm.prototype.vmControlWindow = function (sPara, iStream) {
        var aPara = [iStream];
        // args in sPara: iLeft, iRight, iTop, iBottom (all -1 !)
        for (var i = 0; i < sPara.length; i += 1) {
            var iValue = sPara.charCodeAt(i) + 1; // control ranges start with 0!
            iValue %= 256;
            if (!iValue) {
                iValue = 1; // avoid error
            }
            aPara.push(iValue);
        }
        this.window.apply(this, aPara);
    };
    CpcVm.prototype.vmHandleControlCode = function (iCode, sPara, iStream) {
        var oWin = this.aWindow[iStream], sOut = ""; // no controls for text window
        switch (iCode) {
            case 0x00: // NUL, ignore
                break;
            case 0x01: // SOH 0-255
                this.vmPrintChars(iStream, sPara);
                break;
            case 0x02: // STX
                oWin.bCursorEnabled = false; // cursor disable (user)
                break;
            case 0x03: // ETX
                oWin.bCursorEnabled = true; // cursor enable (user)
                break;
            case 0x04: // EOT 0-3 (on CPC: 0-2, 3 is ignored; really mod 4)
                this.mode(sPara.charCodeAt(0) & 0x03); // eslint-disable-line no-bitwise
                break;
            case 0x05: // ENQ
                this.vmPrintGraphChars(sPara);
                break;
            case 0x06: // ACK
                oWin.bCursorEnabled = true;
                oWin.bTextEnabled = true;
                break;
            case 0x07: // BEL
                this.sound(135, 90, 20, 12, 0, 0, 0);
                break;
            case 0x08: // BS
                this.vmMoveCursor2AllowedPos(iStream);
                oWin.iPos -= 1;
                break;
            case 0x09: // TAB
                this.vmMoveCursor2AllowedPos(iStream);
                oWin.iPos += 1;
                break;
            case 0x0a: // LF
                this.vmMoveCursor2AllowedPos(iStream);
                oWin.iVpos += 1;
                break;
            case 0x0b: // VT
                this.vmMoveCursor2AllowedPos(iStream);
                oWin.iVpos -= 1;
                break;
            case 0x0c: // FF
                this.cls(iStream);
                break;
            case 0x0d: // CR
                this.vmMoveCursor2AllowedPos(iStream);
                oWin.iPos = 0;
                break;
            case 0x0e: // SO
                this.paper(iStream, sPara.charCodeAt(0) & 0x0f); // eslint-disable-line no-bitwise
                break;
            case 0x0f: // SI
                this.pen(iStream, sPara.charCodeAt(0) & 0x0f); // eslint-disable-line no-bitwise
                break;
            case 0x10: // DLE
                this.vmMoveCursor2AllowedPos(iStream);
                this.oCanvas.fillTextBox(oWin.iLeft + oWin.iPos, oWin.iTop + oWin.iVpos, 1, 1, oWin.iPaper); // clear character under cursor
                break;
            case 0x11: // DC1
                this.vmMoveCursor2AllowedPos(iStream);
                this.oCanvas.fillTextBox(oWin.iLeft, oWin.iTop + oWin.iVpos, oWin.iPos + 1, 1, oWin.iPaper); // clear line up to cursor
                break;
            case 0x12: // DC2
                this.vmMoveCursor2AllowedPos(iStream);
                this.oCanvas.fillTextBox(oWin.iLeft + oWin.iPos, oWin.iTop + oWin.iVpos, oWin.iRight - oWin.iLeft + 1 - oWin.iPos, 1, oWin.iPaper); // clear line from cursor
                break;
            case 0x13: // DC3
                this.vmMoveCursor2AllowedPos(iStream);
                this.oCanvas.fillTextBox(oWin.iLeft, oWin.iTop, oWin.iRight - oWin.iLeft + 1, oWin.iTop - oWin.iVpos, oWin.iPaper); // clear window up to cursor line -1
                this.oCanvas.fillTextBox(oWin.iLeft, oWin.iTop + oWin.iVpos, oWin.iPos + 1, 1, oWin.iPaper); // clear line up to cursor (DC1)
                break;
            case 0x14: // DC4
                this.vmMoveCursor2AllowedPos(iStream);
                this.oCanvas.fillTextBox(oWin.iLeft + oWin.iPos, oWin.iTop + oWin.iVpos, oWin.iRight - oWin.iLeft + 1 - oWin.iPos, 1, oWin.iPaper); // clear line from cursor (DC2)
                this.oCanvas.fillTextBox(oWin.iLeft, oWin.iTop + oWin.iVpos + 1, oWin.iRight - oWin.iLeft + 1, oWin.iBottom - oWin.iTop - oWin.iVpos, oWin.iPaper); // clear window from cursor line +1
                break;
            case 0x15: // NAK
                oWin.bCursorEnabled = false;
                oWin.bTextEnabled = false;
                break;
            case 0x16: // SYN
                // parameter: only bit 0 relevant (ROM: &14E3)
                this.vmSetTransparentMode(iStream, sPara.charCodeAt(0) & 0x01); // eslint-disable-line no-bitwise
                break;
            case 0x17: // ETB
                this.oCanvas.setGColMode(sPara.charCodeAt(0) % 4);
                break;
            case 0x18: // CAN
                this.vmTxtInverse(iStream);
                break;
            case 0x19: // EM
                this.vmControlSymbol(sPara);
                break;
            case 0x1a: // SUB
                this.vmControlWindow(sPara, iStream);
                break;
            case 0x1b: // ESC, ignored
                break;
            case 0x1c: // FS
                this.ink(sPara.charCodeAt(0) & 0x0f, sPara.charCodeAt(1) & 0x1f, sPara.charCodeAt(2) & 0x1f); // eslint-disable-line no-bitwise
                break;
            case 0x1d: // GS
                this.border(sPara.charCodeAt(0) & 0x1f, sPara.charCodeAt(1) & 0x1f); // eslint-disable-line no-bitwise
                break;
            case 0x1e: // RS
                oWin.iPos = 0;
                oWin.iVpos = 0;
                break;
            case 0x1f: // US
                this.vmLocate(iStream, sPara.charCodeAt(0), sPara.charCodeAt(1));
                break;
            default:
                Utils_1.Utils.console.warn("vmHandleControlCode: Unknown control code:", iCode);
                break;
        }
        return sOut;
    };
    CpcVm.prototype.vmPrintCharsOrControls = function (iStream, sStr, sBuf) {
        if (sBuf && sBuf.length) {
            sStr = sBuf + sStr;
            sBuf = "";
        }
        var sOut = "", i = 0;
        while (i < sStr.length) {
            var iCode = sStr.charCodeAt(i);
            i += 1;
            if (iCode <= 0x1f) { // control code?
                if (sOut !== "") {
                    this.vmPrintChars(iStream, sOut); // print chars collected so far
                    sOut = "";
                }
                var iParaCount = CpcVm.mControlCodeParameterCount[iCode];
                if (i + iParaCount <= sStr.length) {
                    sOut += this.vmHandleControlCode(iCode, sStr.substr(i, iParaCount), iStream);
                    i += iParaCount;
                }
                else {
                    sBuf = sStr.substr(i - 1); // not enough parameters, put code in buffer and wait for more
                    i = sStr.length;
                }
            }
            else {
                sOut += String.fromCharCode(iCode);
            }
        }
        if (sOut !== "") {
            this.vmPrintChars(iStream, sOut); // print chars collected so far
            sOut = "";
        }
        return sBuf;
    };
    CpcVm.prototype.vmPrintGraphChars = function (sStr) {
        for (var i = 0; i < sStr.length; i += 1) {
            var iChar = CpcVm.vmGetCpcCharCode(sStr.charCodeAt(i));
            this.oCanvas.printGChar(iChar);
        }
    };
    CpcVm.prototype.print = function (iStream) {
        var aArgs = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            aArgs[_i - 1] = arguments[_i];
        }
        iStream = this.vmInRangeRound(iStream || 0, 0, 9, "PRINT");
        var oWin = this.aWindow[iStream];
        if (iStream < 8) {
            if (!oWin.bTag) {
                this.vmDrawUndrawCursor(iStream); // undraw
            }
        }
        else if (iStream === 8) {
            this.vmNotImplemented("PRINT # " + iStream);
        }
        else if (iStream === 9) {
            if (!this.oOutFile.bOpen) {
                throw this.vmComposeError(Error(), 31, "PRINT #" + iStream); // File not open
            }
            this.oOutFile.iStream = iStream;
        }
        var sBuf = this.sPrintControlBuf || "";
        for (var i = 0; i < aArgs.length; i += 1) {
            var arg = aArgs[i];
            var sStr = void 0;
            if (typeof arg === "object") { // delayed call for spc(), tab(), commaTab() with side effect (position)
                var aSpecialArgs = arg.args; // just a reference
                aSpecialArgs.unshift(iStream);
                sStr = this[arg.type].apply(this, aSpecialArgs);
            }
            else if (typeof arg === "number") {
                sStr = ((arg >= 0) ? " " : "") + String(arg) + " ";
            }
            else {
                sStr = String(arg);
            }
            if (iStream < 8) {
                if (oWin.bTag) {
                    this.vmPrintGraphChars(sStr);
                }
                else {
                    sBuf = this.vmPrintCharsOrControls(iStream, sStr, sBuf);
                }
                this.sOut += sStr; // console
            }
            else { // iStream === 9
                oWin.iPos += sStr.length;
                if (sStr === "\r\n") { // for now we replace CRLF by LF
                    sStr = "\n";
                    oWin.iPos = 0;
                }
                if (oWin.iPos >= oWin.iRight) {
                    sStr = "\n" + sStr; // e.g. after tab(256)
                    oWin.iPos = 0;
                }
                sBuf += sStr;
            }
        }
        if (iStream < 8) {
            if (!oWin.bTag) {
                this.vmDrawUndrawCursor(iStream); // draw
                this.sPrintControlBuf = sBuf || ""; // maybe some parameters missing
            }
        }
        else if (iStream === 9) {
            this.oOutFile.aFileData.push(sBuf);
        }
    };
    CpcVm.prototype.rad = function () {
        this.bDeg = false;
    };
    // https://en.wikipedia.org/wiki/Jenkins_hash_function
    CpcVm.prototype.vmHashCode = function (s) {
        var iHash = 0;
        /* eslint-disable no-bitwise */
        for (var i = 0; i < s.length; i += 1) {
            iHash += s.charCodeAt(i);
            iHash += iHash << 10;
            iHash ^= iHash >> 6;
        }
        iHash += iHash << 3;
        iHash ^= iHash >> 11;
        iHash += iHash << 15;
        /* eslint-enable no-bitwise */
        return iHash;
    };
    CpcVm.prototype.vmRandomizeCallback = function () {
        var oInput = this.vmGetStopObject().oParas, sInput = oInput.sInput, value = this.vmVal(sInput); // convert to number (also binary, hex)
        var bInputOk = true;
        Utils_1.Utils.console.log("vmRandomizeCallback:", sInput);
        if (isNaN(value)) {
            bInputOk = false;
            oInput.sInput = "";
            this.print(oInput.iStream, oInput.sMessage);
        }
        else {
            this.vmSetInputValues([value]);
        }
        return bInputOk;
    };
    CpcVm.prototype.randomize = function (n) {
        var iRndInit = 0x89656c07, // an arbitrary 32 bit number <> 0 (this one is used by the CPC)
        iStream = 0;
        if (n === undefined) { // no arguments? input...
            var sMsg = "Random number seed ? ";
            this.print(iStream, sMsg);
            this.vmStop("waitInput", 45, false, {
                iStream: iStream,
                sMessage: sMsg,
                fnInputCallback: this.vmRandomizeCallback.bind(this),
                sInput: "",
                iLine: this.iLine // to repeat in case of break
            });
        }
        else { // n can also be floating point, so compute a hash value of n
            this.vmAssertNumber(n, "RANDOMIZE");
            n = this.vmHashCode(String(n));
            if (n === 0) {
                n = iRndInit;
            }
            if (Utils_1.Utils.debug > 0) {
                Utils_1.Utils.console.debug("randomize:", n);
            }
            this.oRandom.init(n);
        }
    };
    CpcVm.prototype.read = function (sVarType) {
        var sType = this.vmDetermineVarType(sVarType);
        var item = 0;
        if (this.iData < this.aData.length) {
            item = this.aData[this.iData];
            this.iData += 1;
            if (item === null) { // empty arg?
                item = sType === "$" ? "" : 0; // set arg depending on expected type
            }
            else if (sType !== "$") { // not string expected? => convert to number (also binary, hex)
                // Note : Using a number variable to read a string would cause a syntax error on a real CPC. We cannot detect it since we get always strings.
                item = this.val(item); //TTT
            }
            item = this.vmAssign(sVarType, item); // maybe rounding for type I
        }
        else {
            throw this.vmComposeError(Error(), 4, "READ"); // DATA exhausted
        }
        return item;
    };
    CpcVm.prototype.release = function (iChannelMask) {
        iChannelMask = this.vmInRangeRound(iChannelMask, 0, 7, "RELEASE");
        this.oSound.release(iChannelMask);
    };
    // rem
    CpcVm.prototype.remain = function (iTimer) {
        iTimer = this.vmInRangeRound(iTimer, 0, 3, "REMAIN");
        var oTimer = this.aTimer[iTimer];
        var iRemain = 0;
        if (oTimer.bActive) {
            iRemain = oTimer.iNextTimeMs - Date.now();
            iRemain /= CpcVm.iFrameTimeMs;
            oTimer.bActive = false; // switch off timer
        }
        return iRemain;
    };
    CpcVm.prototype.renum = function (iNew, iOld, iStep, iKeep) {
        if (iNew !== null && iNew !== undefined) {
            iNew = this.vmInRangeRound(iNew, 1, 65535, "RENUM");
        }
        if (iOld !== null && iOld !== undefined) {
            iOld = this.vmInRangeRound(iOld, 1, 65535, "RENUM");
        }
        if (iStep !== undefined) {
            iStep = this.vmInRangeRound(iStep, 1, 65535, "RENUM");
        }
        if (iKeep !== undefined) {
            iKeep = this.vmInRangeRound(iKeep, 1, 65535, "RENUM");
        }
        this.vmStop("renumLines", 85, false, {
            iNew: iNew || 10,
            iOld: iOld || 1,
            iStep: iStep || 10,
            iKeep: iKeep || 65535 // keep lines
        });
    };
    CpcVm.prototype.restore = function (iLine) {
        iLine = iLine || 0;
        var oDataLineIndex = this.oDataLineIndex;
        // sLine = String(iLine);
        if (iLine in oDataLineIndex) {
            this.iData = oDataLineIndex[iLine];
        }
        else {
            Utils_1.Utils.console.log("restore: search for dataLine >", iLine);
            for (var sDataLine in oDataLineIndex) { // linear search a data line > line
                if (oDataLineIndex.hasOwnProperty(sDataLine)) {
                    if (Number(sDataLine) >= iLine) { //TTT
                        oDataLineIndex[iLine] = oDataLineIndex[sDataLine]; // set data index also for iLine
                        break;
                    }
                }
            }
            if (iLine in oDataLineIndex) { // now found a data line?
                this.iData = oDataLineIndex[iLine];
            }
            else {
                Utils_1.Utils.console.warn("restore", iLine + ": No DATA found starting at line");
                this.iData = this.aData.length;
            }
        }
    };
    CpcVm.prototype.resume = function (iLine) {
        if (this.iErrorGotoLine) {
            if (iLine === undefined) {
                iLine = this.iErrorResumeLine;
            }
            this.vmGotoLine(iLine, "resume");
            this.iErrorResumeLine = 0;
        }
        else {
            throw this.vmComposeError(Error(), 20, String(iLine)); // Unexpected RESUME
        }
    };
    CpcVm.prototype.resumeNext = function () {
        if (!this.iErrorGotoLine) {
            throw this.vmComposeError(Error(), 20, "RESUME NEXT"); // Unexpected RESUME
        }
        this.vmNotImplemented("RESUME NEXT");
    };
    CpcVm.prototype["return"] = function () {
        var iLine = this.aGosubStack.pop();
        if (iLine === undefined) {
            throw this.vmComposeError(Error(), 3, ""); // Unexpected Return [in <line>]
        }
        else {
            this.vmGotoLine(iLine, "return");
        }
        if (iLine === this.iBreakResumeLine) { // end of break handler?
            this.iBreakResumeLine = 0; // can start another one
        }
        this.vmCheckTimerHandlers(); // if we are at end of a BASIC timer handler, delete handler flag
        if (this.vmCheckSqTimerHandlers()) { // same for sq timers, timer reloaded?
            this.fnCheckSqTimer(); // next one early
        }
    };
    CpcVm.prototype.right$ = function (s, iLen) {
        this.vmAssertString(s, "RIGHT$");
        iLen = this.vmInRangeRound(iLen, 0, 255, "RIGHT$");
        return s.slice(-iLen);
    };
    CpcVm.prototype.rnd = function (n) {
        if (n !== undefined) {
            this.vmAssertNumber(n, "RND");
        }
        var x;
        if (n < 0) {
            x = this.lastRnd || this.oRandom.random();
        }
        else if (n === 0) {
            x = this.lastRnd || this.oRandom.random();
        }
        else { // >0 or undefined
            x = this.oRandom.random();
            this.lastRnd = x;
        }
        return x;
    };
    CpcVm.prototype.round = function (n, iDecimals) {
        this.vmAssertNumber(n, "ROUND");
        iDecimals = this.vmInRangeRound(iDecimals || 0, -39, 39, "ROUND");
        // To avoid rounding errors: https://www.jacklmoore.com/notes/rounding-in-javascript
        return Number(Math.round(Number(n + "e" + iDecimals)) + "e" + ((iDecimals >= 0) ? "-" + iDecimals : "+" + -iDecimals));
    };
    CpcVm.prototype.vmRunCallback = function (sInput, oMeta) {
        var oInFile = this.oInFile, bPutInMemory = sInput !== null && oMeta && (oMeta.sType === "B" || oInFile.iStart !== undefined);
        // TODO: we could put it in memory as we do it for LOAD
        if (sInput !== null) {
            this.vmStop("run", 90, false, {
                iLine: oInFile.iLine
            });
        }
        this.closein();
        return bPutInMemory;
    };
    CpcVm.prototype.run = function (numOrString) {
        var oInFile = this.oInFile;
        if (typeof numOrString === "string") { // filename?
            var sName = this.vmAdaptFilename(numOrString, "RUN");
            this.closein();
            oInFile.bOpen = true;
            oInFile.sCommand = "run";
            oInFile.sName = sName;
            oInFile.fnFileCallback = this.fnRunHandler;
            this.vmStop("fileLoad", 90);
        }
        else { // line number or no argument = undefined
            this.vmStop("run", 90, false, {
                iLine: numOrString || 0
            });
        }
    };
    CpcVm.prototype.save = function (sName, sType, iStart, iLength, iEntry) {
        var oOutFile = this.oOutFile;
        sName = this.vmAdaptFilename(sName, "SAVE");
        if (!sType) {
            sType = "T"; // default is tokenized BASIC
        }
        else {
            sType = String(sType).toUpperCase();
        }
        var aFileData = null; //TTT or undefined?
        if (sType === "B") { // binary
            iStart = this.vmInRangeRound(iStart, -32768, 65535, "SAVE");
            if (iStart < 0) { // 2nd complement of 16 bit address
                iStart += 65536;
            }
            iLength = this.vmInRangeRound(iLength, -32768, 65535, "SAVE");
            if (iLength < 0) {
                iLength += 65536;
            }
            if (iEntry !== undefined) {
                iEntry = this.vmInRangeRound(iEntry, -32768, 65535, "SAVE");
                if (iEntry < 0) {
                    iEntry += 65536;
                }
            }
            aFileData = [];
            for (var i = 0; i < iLength; i += 1) {
                var iAddress = (iStart + i) & 0xffff; // eslint-disable-line no-bitwise
                aFileData[i] = String.fromCharCode(this.peek(iAddress));
            }
        }
        else if ((sType === "A" || sType === "T" || sType === "P") && iStart === undefined) {
            // ASCII or tokenized BASIC or protected BASIC, and no load address specified
            iStart = 368; // BASIC start
            // need file data from controller (text box)
        }
        else {
            throw this.vmComposeError(Error(), 2, "SAVE " + sType); // Syntax Error
        }
        oOutFile.bOpen = true;
        oOutFile.sCommand = "save";
        oOutFile.sName = sName;
        oOutFile.sType = sType;
        oOutFile.iStart = iStart;
        oOutFile.iLength = iLength;
        oOutFile.iEntry = iEntry;
        oOutFile.aFileData = aFileData;
        oOutFile.fnFileCallback = this.fnCloseoutHandler; // we use closeout handler to reset out file handling
        this.vmStop("fileSave", 90); // must stop directly after save
    };
    CpcVm.prototype.sgn = function (n) {
        this.vmAssertNumber(n, "SGN");
        return Math.sign(n);
    };
    CpcVm.prototype.sin = function (n) {
        this.vmAssertNumber(n, "SIN");
        return Math.sin((this.bDeg) ? Utils_1.Utils.toRadians(n) : n);
    };
    CpcVm.prototype.sound = function (iState, iPeriod, iDuration, iVolume, iVolEnv, iToneEnv, iNoise) {
        iState = this.vmInRangeRound(iState, 1, 255, "SOUND");
        iPeriod = this.vmInRangeRound(iPeriod, 0, 4095, "SOUND ,");
        if (iDuration !== undefined) {
            iDuration = this.vmInRangeRound(iDuration, -32768, 32767, "SOUND ,,");
        }
        else {
            iDuration = 20;
        }
        if (iVolume !== undefined && iVolume !== null) {
            iVolume = this.vmInRangeRound(iVolume, 0, 15, "SOUND ,,,");
        }
        else {
            iVolume = 12;
        }
        if (iVolEnv !== undefined && iVolEnv !== null) {
            iVolEnv = this.vmInRangeRound(iVolEnv, 0, 15, "SOUND ,,,,");
        }
        if (iToneEnv !== undefined && iToneEnv !== null) {
            iToneEnv = this.vmInRangeRound(iToneEnv, 0, 15, "SOUND ,,,,,");
        }
        if (iNoise !== undefined && iNoise !== null) {
            iNoise = this.vmInRangeRound(iNoise, 0, 31, "SOUND ,,,,,,");
        }
        var oSoundData = {
            iState: iState,
            iPeriod: iPeriod,
            iDuration: iDuration,
            iVolume: iVolume,
            iVolEnv: iVolEnv,
            iToneEnv: iToneEnv,
            iNoise: iNoise
        };
        if (this.oSound.testCanQueue(iState)) {
            this.oSound.sound(oSoundData);
        }
        else {
            this.aSoundData.push(oSoundData);
            this.vmStop("waitSound", 43);
            for (var i = 0; i < 3; i += 1) {
                if (iState & (1 << i)) { // eslint-disable-line no-bitwise
                    var oSqTimer = this.aSqTimer[i];
                    oSqTimer.bActive = false; // set onSq timer to inactive
                }
            }
        }
    };
    CpcVm.prototype.space$ = function (n) {
        n = this.vmInRangeRound(n, 0, 255, "SPACE$");
        return " ".repeat(n);
    };
    CpcVm.prototype.spc = function (iStream, n) {
        iStream = this.vmInRangeRound(iStream || 0, 0, 9, "SPC");
        n = this.vmInRangeRound(n, -32768, 32767, "SPC");
        var sStr = "";
        if (n >= 0) {
            var oWin = this.aWindow[iStream], iWidth = oWin.iRight - oWin.iLeft + 1;
            if (iWidth) {
                n %= iWidth;
            }
            sStr = " ".repeat(n);
        }
        else {
            Utils_1.Utils.console.log("SPC: negative number ignored:", n);
        }
        return sStr;
    };
    CpcVm.prototype.speedInk = function (iTime1, iTime2) {
        iTime1 = this.vmInRangeRound(iTime1, 1, 255, "SPEED INK");
        iTime2 = this.vmInRangeRound(iTime2, 1, 255, "SPEED INK");
        this.oCanvas.setSpeedInk(iTime1, iTime2);
    };
    CpcVm.prototype.speedKey = function (iDelay, iRepeat) {
        iDelay = this.vmInRangeRound(iDelay, 1, 255, "SPEED KEY");
        iRepeat = this.vmInRangeRound(iRepeat, 1, 255, "SPEED KEY");
        this.vmNotImplemented("SPEED KEY " + iDelay + " " + iRepeat);
    };
    CpcVm.prototype.speedWrite = function (n) {
        n = this.vmInRangeRound(n, 0, 1, "SPEED WRITE");
        this.vmNotImplemented("SPEED WRITE " + n);
    };
    CpcVm.prototype.sq = function (iChannel) {
        iChannel = this.vmInRangeRound(iChannel, 1, 4, "SQ");
        if (iChannel === 3) {
            throw this.vmComposeError(Error(), 5, "ON SQ GOSUB " + iChannel); // Improper argument
        }
        iChannel = this.fnChannel2ChannelIndex(iChannel);
        var iSq = this.oSound.sq(iChannel), oSqTimer = this.aSqTimer[iChannel];
        // no space in queue and handler active?
        if (!(iSq & 0x07) && oSqTimer.bActive) { // eslint-disable-line no-bitwise
            oSqTimer.bActive = false; // set onSq timer to inactive
        }
        return iSq;
    };
    CpcVm.prototype.sqr = function (n) {
        this.vmAssertNumber(n, "SQR");
        return Math.sqrt(n);
    };
    // step
    CpcVm.prototype.stop = function (sLabel) {
        this.vmGotoLine(sLabel, "stop");
        this.vmStop("stop", 60);
    };
    CpcVm.prototype.str$ = function (n) {
        this.vmAssertNumber(n, "STR$");
        var sStr = ((n >= 0) ? " " : "") + String(n);
        return sStr;
    };
    CpcVm.prototype.string$ = function (iLen, chr) {
        iLen = this.vmInRangeRound(iLen, 0, 255, "STRING$");
        if (typeof chr === "number") {
            chr = this.vmInRangeRound(chr, 0, 255, "STRING$");
            chr = String.fromCharCode(chr); // chr$
        }
        else { // string
            chr = chr.charAt(0); // only one char
        }
        return chr.repeat(iLen);
    };
    // swap (window swap)
    CpcVm.prototype.symbol = function (iChar) {
        var aArgs = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            aArgs[_i - 1] = arguments[_i];
        }
        var aCharData = [];
        iChar = this.vmInRangeRound(iChar, this.iMinCustomChar, 255, "SYMBOL");
        for (var i = 0; i < aArgs.length; i += 1) { // start with 1, get available args
            var iBitMask = this.vmInRangeRound(aArgs[i], 0, 255, "SYMBOL");
            aCharData.push(iBitMask);
        }
        // Note: If there are less than 8 rows, the others are assumed as 0 (actually empty)
        this.oCanvas.setCustomChar(iChar, aCharData);
    };
    CpcVm.prototype.symbolAfter = function (iChar) {
        iChar = this.vmInRangeRound(iChar, 0, 256, "SYMBOL AFTER");
        if (this.iMinCustomChar < 256) { // symbol after <256 set?
            if (this.iMinCharHimem !== this.iHimem) { // himem changed?
                throw this.vmComposeError(Error(), 5, "SYMBOL AFTER " + iChar); // Improper argument
            }
        }
        else {
            this.iMaxCharHimem = this.iHimem; // no characters defined => use current himem
        }
        var iMinCharHimem = this.iMaxCharHimem - (256 - iChar) * 8;
        if (iMinCharHimem < CpcVm.iMinHimem) {
            throw this.vmComposeError(Error(), 7, "SYMBOL AFTER " + iMinCharHimem); // Memory full
        }
        this.iHimem = iMinCharHimem;
        this.oCanvas.resetCustomChars();
        if (iChar === 256) { // maybe move up again
            iMinCharHimem = CpcVm.iMaxHimem;
            this.iMaxCharHimem = iMinCharHimem; //TTT corrected
        }
        // TODO: Copy char data to screen memory, if screen starts at 0x4000 and chardata is in that range (and ram 0 is selected)
        this.iMinCustomChar = iChar;
        this.iMinCharHimem = iMinCharHimem;
    };
    CpcVm.prototype.tab = function (iStream, n) {
        iStream = this.vmInRangeRound(iStream || 0, 0, 9, "TAB");
        n = this.vmInRangeRound(n, -32768, 32767, "TAB");
        var oWin = this.aWindow[iStream], iWidth = oWin.iRight - oWin.iLeft + 1;
        var sStr = "";
        if (n > 0) {
            n -= 1;
            if (iWidth) {
                n %= iWidth;
            }
            var iCount = n - oWin.iPos;
            if (iCount < 0) { // does it fit until tab position?
                oWin.iPos = oWin.iRight + 1;
                this.vmMoveCursor2AllowedPos(iStream);
                iCount = n; // set tab in next line
            }
            sStr = " ".repeat(iCount);
        }
        else {
            Utils_1.Utils.console.log("TAB: no tab for value", n);
        }
        return sStr;
    };
    CpcVm.prototype.tag = function (iStream) {
        if (iStream) {
            iStream = this.vmInRangeRound(iStream, 0, 7, "TAG");
        }
        else {
            iStream = 0;
        }
        var oWin = this.aWindow[iStream];
        oWin.bTag = true;
    };
    CpcVm.prototype.tagoff = function (iStream) {
        if (iStream) {
            iStream = this.vmInRangeRound(iStream, 0, 7, "TAGOFF");
        }
        else {
            iStream = 0;
        }
        var oWin = this.aWindow[iStream];
        oWin.bTag = false;
    };
    CpcVm.prototype.tan = function (n) {
        this.vmAssertNumber(n, "TAN");
        return Math.tan((this.bDeg) ? Utils_1.Utils.toRadians(n) : n);
    };
    CpcVm.prototype.test = function (x, y) {
        x = this.vmInRangeRound(x, -32768, 32767, "TEST");
        y = this.vmInRangeRound(y, -32768, 32767, "TEST");
        return this.oCanvas.test(x, y);
    };
    CpcVm.prototype.testr = function (x, y) {
        x = this.vmInRangeRound(x, -32768, 32767, "TESTR");
        y = this.vmInRangeRound(y, -32768, 32767, "TESTR");
        return this.oCanvas.testr(x, y);
    };
    // then
    CpcVm.prototype.time = function () {
        return ((Date.now() - this.iStartTime) * 300 / 1000) | 0; // eslint-disable-line no-bitwise
    };
    // to
    CpcVm.prototype.troff = function () {
        this.bTron = false;
    };
    CpcVm.prototype.tron = function () {
        this.bTron = true;
    };
    CpcVm.prototype.unt = function (n) {
        n = this.vmInRangeRound(n, -32768, 65535, "UNT");
        if (n > 32767) {
            n -= 65536;
        }
        return n;
    };
    CpcVm.prototype.upper$ = function (s) {
        this.vmAssertString(s, "UPPER$");
        var fnUpperCase = function (sMatch) {
            return sMatch.toUpperCase();
        };
        s = s.replace(/[a-z]/g, fnUpperCase); // replace only characters a-z
        return s;
    };
    CpcVm.prototype.using = function (sFormat) {
        var aArgs = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            aArgs[_i - 1] = arguments[_i];
        }
        var reFormat = /(!|&|\\ *\\|(?:\*\*|\$\$|\*\*\$)?\+?(?:#|,)+\.?#*(?:\^\^\^\^)?[+-]?)/g, aFormat = [];
        this.vmAssertString(sFormat, "USING");
        // We simulate sFormat.split(reFormat) here since it does not work with IE8
        var iIndex = 0, oMatch;
        while ((oMatch = reFormat.exec(sFormat)) !== null) {
            aFormat.push(sFormat.substring(iIndex, oMatch.index)); // non-format characters at the beginning
            aFormat.push(oMatch[0]);
            iIndex = oMatch.index + oMatch[0].length;
        }
        if (iIndex < sFormat.length) { // non-format characters at the end
            aFormat.push(sFormat.substr(iIndex));
        }
        if (aFormat.length < 2) {
            Utils_1.Utils.console.warn("USING: empty or invalid format:", sFormat);
            throw this.vmComposeError(Error(), 5, "USING format " + sFormat); // Improper argument
        }
        var iFormat = 0, s = "", sFrmt;
        for (var i = 0; i < aArgs.length; i += 1) { // start with 1
            iFormat %= aFormat.length;
            if (iFormat === 0) {
                sFrmt = aFormat[iFormat]; // non-format characters at the beginning of the format string
                iFormat += 1;
                s += sFrmt;
            }
            if (iFormat < aFormat.length) {
                var arg = aArgs[i];
                sFrmt = aFormat[iFormat]; // format characters
                iFormat += 1;
                s += this.vmUsingFormat1(sFrmt, arg);
            }
            if (iFormat < aFormat.length) {
                sFrmt = aFormat[iFormat]; // following non-format characters
                iFormat += 1;
                s += sFrmt;
            }
        }
        return s;
    };
    CpcVm.prototype.vmVal = function (s) {
        var iNum = 0;
        s = s.trim().toLowerCase();
        if (s.startsWith("&x")) { // binary &x
            s = s.slice(2);
            iNum = parseInt(s, 2);
        }
        else if (s.startsWith("&h")) { // hex &h
            s = s.slice(2);
            iNum = parseInt(s, 16);
        }
        else if (s.startsWith("&")) { // hex &
            s = s.slice(1);
            iNum = parseInt(s, 16);
        }
        else if (s !== "") { // not empty string?
            iNum = parseFloat(s);
        }
        return iNum;
    };
    CpcVm.prototype.val = function (s) {
        this.vmAssertString(s, "VAL");
        var iNum = this.vmVal(s);
        if (isNaN(iNum)) {
            iNum = 0;
        }
        return iNum;
    };
    CpcVm.prototype.vpos = function (iStream) {
        iStream = this.vmInRangeRound(iStream, 0, 7, "VPOS");
        var iVpos = this.vmGetAllowedPosOrVpos(iStream, true) + 1; // get allowed vpos
        return iVpos;
    };
    CpcVm.prototype.wait = function (iPort, iMask, iInv) {
        iPort = this.vmInRangeRound(iPort, -32768, 65535, "WAIT");
        if (iPort < 0) { // 2nd complement of 16 bit address
            iPort += 65536;
        }
        iMask = this.vmInRangeRound(iMask, 0, 255, "WAIT");
        if (iInv !== undefined) {
            iInv = this.vmInRangeRound(iInv, 0, 255, "WAIT");
        }
        if ((iPort & 0xff00) === 0xf500) { // eslint-disable-line no-bitwise
            if (iMask === 1) {
                this.frame();
            }
        }
        else if (iPort === 0) {
            debugger; // Testing
        }
    };
    // wend
    // while
    CpcVm.prototype.width = function (iWidth) {
        iWidth = this.vmInRangeRound(iWidth, 1, 255, "WIDTH");
        var oWin = this.aWindow[8];
        oWin.iRight = oWin.iLeft + iWidth;
    };
    CpcVm.prototype.window = function (iStream, iLeft, iRight, iTop, iBottom) {
        iStream = this.vmInRangeRound(iStream || 0, 0, 7, "WINDOW");
        iLeft = this.vmInRangeRound(iLeft, 1, 255, "WINDOW");
        iRight = this.vmInRangeRound(iRight, 1, 255, "WINDOW");
        iTop = this.vmInRangeRound(iTop, 1, 255, "WINDOW");
        iBottom = this.vmInRangeRound(iBottom, 1, 255, "WINDOW");
        var oWin = this.aWindow[iStream];
        oWin.iLeft = Math.min(iLeft, iRight) - 1;
        oWin.iRight = Math.max(iLeft, iRight) - 1;
        oWin.iTop = Math.min(iTop, iBottom) - 1;
        oWin.iBottom = Math.max(iTop, iBottom) - 1;
        oWin.iPos = 0;
        oWin.iVpos = 0;
    };
    CpcVm.prototype.windowSwap = function (iStream1, iStream2) {
        iStream1 = this.vmInRangeRound(iStream1 || 0, 0, 7, "WINDOW SWAP");
        iStream2 = this.vmInRangeRound(iStream2 || 0, 0, 7, "WINDOW SWAP");
        var oTemp = this.aWindow[iStream1];
        this.aWindow[iStream1] = this.aWindow[iStream2];
        this.aWindow[iStream2] = oTemp;
    };
    CpcVm.prototype.write = function (iStream) {
        var aArgs = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            aArgs[_i - 1] = arguments[_i];
        }
        iStream = this.vmInRangeRound(iStream || 0, 0, 9, "WRITE");
        var aWriteArgs = [];
        var sStr;
        for (var i = 0; i < aArgs.length; i += 1) {
            var arg = aArgs[i];
            if (typeof arg === "number") {
                sStr = String(arg);
            }
            else {
                sStr = '"' + String(arg) + '"';
            }
            aWriteArgs.push(sStr);
        }
        sStr = aWriteArgs.join(",");
        if (iStream < 8) {
            var oWin = this.aWindow[iStream];
            if (oWin.bTag) {
                this.vmPrintGraphChars(sStr + "\r\n");
            }
            else {
                this.vmDrawUndrawCursor(iStream); // undraw
                this.vmPrintChars(iStream, sStr);
                this.vmPrintCharsOrControls(iStream, "\r\n");
                this.vmDrawUndrawCursor(iStream); // draw
            }
            this.sOut += sStr + "\n"; // console
        }
        else if (iStream === 8) {
            this.vmNotImplemented("WRITE #" + iStream);
        }
        else if (iStream === 9) {
            this.oOutFile.iStream = iStream;
            if (!this.oOutFile.bOpen) {
                throw this.vmComposeError(Error(), 31, "WRITE #" + iStream); // File not open
            }
            this.oOutFile.aFileData.push(sStr + "\n"); // real CPC would use CRLF, we use LF
            // currently we print data also to console...
        }
    };
    // xor
    CpcVm.prototype.xpos = function () {
        return this.oCanvas.getXpos();
    };
    CpcVm.prototype.ypos = function () {
        return this.oCanvas.getYpos();
    };
    CpcVm.prototype.zone = function (n) {
        n = this.vmInRangeRound(n, 1, 255, "ZONE");
        this.iZone = n;
    };
    CpcVm.iFrameTimeMs = 1000 / 50; // 50 Hz => 20 ms
    CpcVm.iTimerCount = 4; // number of timers
    CpcVm.iSqTimerCount = 3; // sound queue timers
    CpcVm.iStreamCount = 10; // 0..7 window, 8 printer, 9 cassette
    CpcVm.iMinHimem = 370;
    CpcVm.iMaxHimem = 42747; // high memory limit (42747 after symbol after 256)
    CpcVm.mWinData = [
        {
            iLeft: 0,
            iRight: 19,
            iTop: 0,
            iBottom: 24
        },
        {
            iLeft: 0,
            iRight: 39,
            iTop: 0,
            iBottom: 24
        },
        {
            iLeft: 0,
            iRight: 79,
            iTop: 0,
            iBottom: 24
        },
        {
            iLeft: 0,
            iRight: 79,
            iTop: 0,
            iBottom: 49
        }
    ];
    CpcVm.mUtf8ToCpc = {
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
    CpcVm.mControlCodeParameterCount = [
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
    CpcVm.aErrors = [
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
    return CpcVm;
}());
exports.CpcVm = CpcVm;
//# sourceMappingURL=CpcVm.js.map