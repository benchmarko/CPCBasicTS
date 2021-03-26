// CpcVm.ts - CPC Virtual Machine
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//

import { Utils, CustomError } from "./Utils";
import { Keyboard, CpcKeyExpansionsOptions } from "./Keyboard";
import { Random } from "./Random";
import { Sound, SoundData, ToneEnvData, ToneEnvData1, ToneEnvData2, VolEnvData, VolEnvData1, VolEnvData2 } from "./Sound";
import { Canvas } from "./Canvas";
import { Variables, VariableMap } from "./Variables";
import { ICpcVmRsx } from "./Interfaces";

interface CpcVmOptions {
	canvas: Canvas
	keyboard: Keyboard
	sound: Sound
	variables: Variables
	tron: boolean
}

export interface FileMeta {
	sType: string
	iStart?: number
	iLength?: number
	iEntry?: number
	sEncoding?: string
}

interface FileBase {
	bOpen: boolean
	sCommand: string
	sName: string
	iLine: number
	iStart: (number | undefined)
	aFileData: string[]
	fnFileCallback: ((...aArgs: any[]) => void | boolean) | undefined
}

interface InFile extends FileBase {
	iFirst: number
	iLast: number
	sMemorizedExample: string
}
interface OutFile extends FileBase {
	iStream: number
	sType: string
	iLength: number
	iEntry: number
}

interface WindowDimensions {
	iLeft: number,
	iRight: number,
	iTop: number,
	iBottom: number
}

interface WindowData extends WindowDimensions {
	iPos: number // current text position in line
	iVpos: number
	bTextEnabled: boolean // text enabled
	bTag: boolean // tag=text at graphics
	bTransparent: boolean // transparent mode
	bCursorOn: boolean // system switch
	bCursorEnabled: boolean // user switch

	iPen: number
	iPaper: number
}

interface TimerEntry {
	bActive: boolean
	iLine: number
	bRepeat: boolean
	iIntervalMs: number
	iNextTimeMs: number

	bHandlerRunning: boolean
	iStackIndexReturn: number
	iSavedPriority: number
}

export interface VmBaseParas {
	sCommand: string
	iStream: number
	iLine: string | number
}

export interface VmLineParas extends VmBaseParas { // delete lines, list lines, edit line, run line
	iFirst: number
	iLast: number
}

export interface VmLineRenumParas extends VmBaseParas { // renum lines
	iNew: number
	iOld: number
	iStep: number
	iKeep: number
}

export interface VmFileParas extends VmBaseParas {
	sFileMask: string // CAT, |DIR, |ERA
	sNew?: string // |REN
	sOld?: string // |REN
}

export interface VmInputParas extends VmBaseParas {
	sInput: string
	sMessage: string
	sNoCRLF?: string
	aTypes?: string[]
	fnInputCallback: () => boolean
}

export type VmStopParas = VmFileParas | VmInputParas | VmLineParas | VmLineRenumParas

export interface VmStopEntry {
	sReason: string // stop reason
	iPriority: number // stop priority (higher number means higher priority which can overwrite lower priority)
	oParas: VmStopParas
}

type PrintObjectType = {type: string, args: (string | number)[]};

type DataEntryType = (string | undefined);
export class CpcVm {
	private fnOpeninHandler: FileBase["fnFileCallback"]; // = undefined;
	private fnCloseinHandler: () => void;
	private fnCloseoutHandler: () => void;
	fnLoadHandler: (sInput: string, oMeta: FileMeta) => boolean;
	private fnRunHandler: (sInput: string, oMeta: FileMeta) => boolean;

	oCanvas: Canvas;
	private oKeyboard: Keyboard;
	private oSound: Sound;
	oVariables: Variables;
	private tronFlag: boolean;

	private oRandom: Random;

	private oStop: VmStopEntry;

	private aInputValues: (string | number)[]; // values to input into script
	private oInFile: InFile; // file handling
	private oOutFile: OutFile; // file handling

	//iInkeyTime: number; // if >0, next time when inkey$ can be checked without inserting "waitFrame"
	private iInkeyTimeMs = 0; // next time of frame fly (if >0, next time when inkey$ can be checked without inserting "waitFrame")

	private aGosubStack: (number | string)[] = []; // stack of line numbers for gosub/return

	private aMem: number[]; // for peek, poke

	private aData: DataEntryType[]; // array for BASIC data lines (continuous)
	private iData = 0; // current index
	private oDataLineIndex: {[k in number]: number} = { // line number index for the data line buffer
		0: 0 // for line 0: index 0
	};

	aWindow: WindowData[]; // window data for window 0..7,8,9

	private aTimer: TimerEntry[]; // BASIC timer 0..3 (3 has highest priority)
	private aSqTimer: TimerEntry[]; // Sound queue timer 0..2

	private aSoundData: SoundData[];

	private aCrtcData: number[];
	private iCrtcReg = 0;

	private sPrintControlBuf = "";

	private iStartTime = 0;
	private lastRnd = 0; // last random number

	private iNextFrameTime = 0;
	private iStopCount = 0;

	iLine: string | number = 0;
	private iStartLine = 0;

	private iErrorGotoLine = 0;
	private iErrorResumeLine = 0;
	private iBreakGosubLine = 0;
	private iBreakResumeLine = 0;

	sOut = "";

	private iErr = 0; // last error code
	private iErl: string | number = 0; // line of last error

	private bDeg = false; // degree or radians

	private bTron = false; // trace flag
	private iTronLine = 0; // last trace line

	private iRamSelect = 0;

	private iScreenPage = 3; // 16K screen page, 3=0xc000..0xffff

	private iMinCharHimem = CpcVm.iMaxHimem;
	private iMaxCharHimem = CpcVm.iMaxHimem;
	private iHimem = CpcVm.iMaxHimem;
	private iMinCustomChar = 256;

	private iTimerPriority = -1; // priority of running task: -1=low (min priority to start new timers)

	private iZone = 13; // print tab zone value

	iMode = -1;

	rsx?: ICpcVmRsx;

	private static iFrameTimeMs = 1000 / 50; // 50 Hz => 20 ms
	private static iTimerCount = 4; // number of timers
	private static iSqTimerCount = 3; // sound queue timers
	static iStreamCount = 10; // 0..7 window, 8 printer, 9 cassette
	private static iMinHimem = 370;
	private static iMaxHimem = 42747; // high memory limit (42747 after symbol after 256)

	private static oEmptyParas = {};

	static mWinData = [ // window data for mode mode 0,1,2,3 (we are counting from 0 here)
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
			iLeft: 0, // mode 3 not available on CPC
			iRight: 79,
			iTop: 0,
			iBottom: 49
		}
	];

	private static mUtf8ToCpc: { [k in number]: number } = { // needed for UTF-8 character data in openin / input#9
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

	private static aControlCodeParameterCount = [
		0, // 0x00
		1, // 0x01
		0, // 0x02
		0, // 0x03
		1, // 0x04
		1, // 0x05
		0, // 0x06
		0, // 0x07
		0, // 0x08
		0, // 0x09
		0, // 0x0a
		0, // 0x0b
		0, // 0x0c
		0, // 0x0d
		1, // 0x0e
		1, // 0x0f
		0, // 0x10
		0, // 0x11
		0, // 0x12
		0, // 0x13
		0, // 0x14
		0, // 0x15
		1, // 0x16
		1, // 0x17
		0, // 0x18
		9, // 0x19
		4, // 0x1a
		0, // 0x1b
		3, // 0x1c
		2, // 0x1d
		0, // 0x1e
		2 //  0x1f
	];

	private static aErrors = [ // BASIC error numbers
		"Improper argument", // 0
		"Unexpected NEXT", // 1
		"Syntax Error", // 2
		"Unexpected RETURN", // 3
		"DATA exhausted", // 4
		"Improper argument", // 5
		"Overflow", // 6
		"Memory full", // 7
		"Line does not exist", // 8
		"Subscript out of range", // 9
		"Array already dimensioned", // 10
		"Division by zero", // 11
		"Invalid direct command", // 12
		"Type mismatch", // 13
		"String space full", // 14
		"String too long", // 15
		"String expression too complex", // 16
		"Cannot CONTinue", // 17
		"Unknown user function", // 18
		"RESUME missing", // 19
		"Unexpected RESUME", // 20
		"Direct command found", // 21
		"Operand missing", // 22
		"Line too long", // 23
		"EOF met", // 24
		"File type error", // 25
		"NEXT missing", // 26
		"File already open", // 27
		"Unknown command", // 28
		"WEND missing", // 29
		"Unexpected WEND", // 30
		"File not open", // 31,
		"Broken", // 32 "Broken in" (derr=146: xxx not found)
		"Unknown error" // 33...
	];

	private static mStopPriority: {[k in string]: number} = {
		"": 0, // nothing
		direct: 0, // direct input mode
		timer: 20, // timer expired
		waitKey: 30, // wait for key
		waitFrame: 40, // FRAME command: wait for frame fly
		waitSound: 43, // wait for sound queue
		waitInput: 45, // wait for input: INPUT, LINE INPUT, RANDOMIZE without parameter
		fileCat: 45, // CAT
		fileDir: 45, // |DIR
		fileEra: 45, // |ERA
		fileRen: 45, // |REN
		error: 50, // BASIC error, ERROR command
		onError: 50, // ON ERROR GOTO active, hide error
		stop: 60, // STOP or END command
		"break": 80, // break pressed
		escape: 85, // escape key, set in controller
		renumLines: 85, // RENUMber program
		deleteLines: 85, // delete lines
		editLine: 85, // edit line
		end: 90, // end of program
		list: 90, // LIST program
		fileLoad: 90, // CHAIN, CHAIN MERGE, LOAD, MERGE, OPENIN, RUN
		fileSave: 90, // OPENOUT, SAVE
		"new": 90, // NEW, remove program, variables
		run: 95,
		parse: 95, // set in controller
		parseRun: 95, // parse and run, used in controller
		reset: 99 // reset system
	};

	constructor(options: CpcVmOptions) {
		this.fnOpeninHandler = this.vmOpeninCallback.bind(this);
		this.fnCloseinHandler = this.vmCloseinCallback.bind(this);
		this.fnCloseoutHandler = this.vmCloseoutCallback.bind(this);
		this.fnLoadHandler = this.vmLoadCallback.bind(this);
		this.fnRunHandler = this.vmRunCallback.bind(this);

		this.oCanvas = options.canvas;
		this.oKeyboard = options.keyboard;
		this.oSound = options.sound;
		this.oVariables = options.variables;
		this.tronFlag = options.tron;

		this.oRandom = new Random();

		this.oStop = {
			sReason: "", // stop reason
			iPriority: 0, // stop priority (higher number means higher priority which can overwrite lower priority)
			oParas: {} as VmStopParas
		};

		this.aInputValues = []; // values to input into script

		this.oInFile = {
			bOpen: false,
			sCommand: "",
			sName: "",
			iLine: 0,
			iStart: 0,
			aFileData: [],
			fnFileCallback: undefined,
			iFirst: 0,
			iLast: 0,
			sMemorizedExample: ""
		};

		this.oOutFile = {
			bOpen: false,
			sCommand: "",
			sName: "",
			iLine: 0,
			iStart: 0,
			aFileData: [],
			fnFileCallback: undefined,
			iStream: 0,
			sType: "",
			iLength: 0,
			iEntry: 0
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


		//this.iInkeyTime = 0; // if >0, next time when inkey$ can be checked without inserting "waitFrame"

		this.aGosubStack = []; // stack of line numbers for gosub/return

		this.aMem = []; // for peek, poke

		this.aData = []; // array for BASIC data lines (continuous)

		this.aWindow = []; // window data for window 0..7,8,9
		for (let i = 0; i < CpcVm.iStreamCount; i += 1) {
			this.aWindow[i] = {} as WindowData;
		}

		this.aTimer = []; // BASIC timer 0..3 (3 has highest priority)
		for (let i = 0; i < CpcVm.iTimerCount; i += 1) {
			this.aTimer[i] = {} as TimerEntry;
		}

		this.aSoundData = [];

		this.aSqTimer = []; // Sound queue timer 0..2
		for (let i = 0; i < CpcVm.iSqTimerCount; i += 1) {
			this.aSqTimer[i] = {} as TimerEntry;
		}

		this.aCrtcData = [];
	}

	vmSetRsxClass(oRsx: ICpcVmRsx): void {
		this.rsx = oRsx; // this.rsx just used in the script
	}

	vmReset(): void {
		this.iStartTime = Date.now();
		this.oRandom.init();
		this.lastRnd = 0;

		this.iNextFrameTime = Date.now() + CpcVm.iFrameTimeMs; // next time of frame fly
		this.iStopCount = 0;

		this.iLine = 0; // current line number (or label)
		this.iStartLine = 0; // line to start

		this.iErrorGotoLine = 0;
		this.iErrorResumeLine = 0;
		this.iBreakGosubLine = 0;
		this.iBreakResumeLine = 0;

		this.aInputValues.length = 0;
		CpcVm.vmResetFileHandling(this.oInFile);
		CpcVm.vmResetFileHandling(this.oOutFile);

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

		this.iMode = -1;
		this.vmResetWindowData(true); // reset all, including pen and paper
		this.width(132); // set default printer width

		this.mode(1); // including vmResetWindowData() without pen and paper

		this.oCanvas.reset();

		this.oKeyboard.reset();

		this.oSound.reset();
		this.aSoundData.length = 0;

		this.iInkeyTimeMs = 0; // if >0, next time when inkey$ can be checked without inserting "waitFrame"
	}

	vmResetTimers(): void {
		const oData = {
				iLine: 0, // gosub line when timer expires
				bRepeat: false, // flag if timer is repeating (every) or one time (after)
				iIntervalMs: 0, // interval or timeout
				bActive: false, // flag if timer is active
				iNextTimeMs: 0, // next expiration time
				bHandlerRunning: false, // flag if handler (subroutine) is running
				iStackIndexReturn: 0, // index in gosub stack with return, if handler is running
				iSavedPriority: 0 // priority befora calling the handler
			},
			aTimer = this.aTimer,
			aSqTimer = this.aSqTimer;

		for (let i = 0; i < CpcVm.iTimerCount; i += 1) {
			Object.assign(aTimer[i], oData);
		}

		// sound queue timer
		for (let i = 0; i < CpcVm.iSqTimerCount; i += 1) {
			Object.assign(aSqTimer[i], oData);
		}
	}

	vmResetWindowData(bResetPenPaper: boolean): void {
		const oWinData = CpcVm.mWinData[this.iMode],
			oData = {
				iPos: 0, // current text position in line
				iVpos: 0,
				bTextEnabled: true, // text enabled
				bTag: false, // tag=text at graphics
				bTransparent: false, // transparent mode
				bCursorOn: false, // system switch
				bCursorEnabled: true // user switch
			},
			oPenPaperData = {
				iPen: 1,
				iPaper: 0
			},
			oPrintData = {
				iPos: 0,
				iVpos: 0,
				iRight: 132 // override
			},
			oCassetteData = {
				iPos: 0,
				iVpos: 0,
				iRight: 255 // override
			};
		let	oWin: WindowData;

		if (bResetPenPaper) {
			Object.assign(oData, oPenPaperData);
		}

		for (let i = 0; i < this.aWindow.length - 2; i += 1) { // for window streams
			oWin = this.aWindow[i];
			Object.assign(oWin, oWinData, oData);
		}

		oWin = this.aWindow[8]; // printer
		Object.assign(oWin, oWinData, oPrintData);

		oWin = this.aWindow[9]; // cassette
		Object.assign(oWin, oWinData, oCassetteData);
	}

	vmResetControlBuffer(): void {
		this.sPrintControlBuf = ""; // collected control characters for PRINT
	}

	static vmResetFileHandling(oFile: FileBase): void {
		oFile.bOpen = false;
		oFile.sCommand = ""; // to be sure
	}

	vmResetData(): void {
		this.aData.length = 0; // array for BASIC data lines (continuous)
		this.iData = 0; // current index
		this.oDataLineIndex = { // line number index for the data line buffer
			0: 0 // for line 0: index 0
		};
	}

	private vmResetInks() {
		this.oCanvas.setDefaultInks();
		this.oCanvas.setSpeedInk(10, 10);
	}

	vmReset4Run(): void {
		const iStream = 0;

		this.vmResetInks();
		this.clearInput();
		this.closein();
		this.closeout();
		this.cursor(iStream, 0);
	}

	vmGetAllVariables(): VariableMap { // also called from JS script
		return this.oVariables.getAllVariables();
	}

	vmSetStartLine(iLine: number): void {
		this.iStartLine = iLine;
	}

	vmOnBreakContSet(): boolean {
		return this.iBreakGosubLine < 0; // on break cont
	}

	vmOnBreakHandlerActive(): number {
		return this.iBreakResumeLine;
	}

	vmEscape(): boolean {
		let bStop = true;

		if (this.iBreakGosubLine > 0) { // on break gosub n
			if (!this.iBreakResumeLine) { // do not nest break gosub
				this.iBreakResumeLine = Number(this.iLine);
				this.gosub(this.iLine, this.iBreakGosubLine);
			}
			bStop = false;
		} else if (this.iBreakGosubLine < 0) { // on break cont
			bStop = false;
		} // else: on break stop

		return bStop;
	}

	vmAssertNumber(n: number | undefined, sErr: string): void {
		if (typeof n !== "number") {
			throw this.vmComposeError(Error(), 13, sErr + " " + n); // Type mismatch
		}
	}

	private vmAssertString(s: string, sErr: string): void {
		if (typeof s !== "string") {
			throw this.vmComposeError(Error(), 13, sErr + " " + s); // Type mismatch
		}
	}

	// round number (-2^31..2^31) to integer; throw error if no number
	vmRound(n: number | undefined, sErr?: string): number { // optional sErr
		this.vmAssertNumber(n, sErr || "?");
		return ((n as number) >= 0) ? ((n as number) + 0.5) | 0 : ((n as number) - 0.5) | 0; // eslint-disable-line no-bitwise
	}

	/*
	// round for comparison TODO
	vmRound4Cmp(n) {
		const nAdd = (n >= 0) ? 0.5 : -0.5;

		return ((n * 1e12 + nAdd) | 0) / 1e12; // eslint-disable-line no-bitwise
	}
	*/

	vmInRangeRound(n: number | undefined, iMin: number, iMax: number, sErr?: string): number {
		n = this.vmRound(n, sErr);
		if (n < iMin || n > iMax) {
			Utils.console.warn("vmInRangeRound: number not in range:", iMin + "<=" + n + "<=" + iMax);
			throw this.vmComposeError(Error(), n < -32768 || n > 32767 ? 6 : 5, sErr + " " + n); // 6=Overflow, 5=Improper argument
		}
		return n;
	}

	vmDetermineVarType(sVarType: string): string { // also used in controller
		const sType = (sVarType.length > 1) ? sVarType.charAt(1) : this.oVariables.getVarType(sVarType.charAt(0));

		return sType;
	}

	vmAssertNumberType(sVarType: string): void {
		const sType = this.vmDetermineVarType(sVarType);

		if (sType !== "I" && sType !== "R") { // not integer or real?
			throw this.vmComposeError(Error(), 13, "type " + sType); // "Type mismatch"
		}
	}

	// format a value for assignment to a variable with type determined from sVarType
	vmAssign(sVarType: string, value: string | number): (string | number) {
		const sType = this.vmDetermineVarType(sVarType);

		if (sType === "R") { // real
			this.vmAssertNumber(value as number, "=");
		} else if (sType === "I") { // integer
			value = this.vmRound(value as number, "="); // round number to integer
		} else if (sType === "$") { // string
			if (typeof value !== "string") {
				Utils.console.warn("vmAssign: expected string but got:", value);
				throw this.vmComposeError(Error(), 13, "type " + sType + "=" + value); // "Type mismatch"
			}
		}
		return value;
	}

	vmGotoLine(line: string | number, sMsg?: string): void {
		if (Utils.debug > 5) {
			if (typeof line === "number" || Utils.debug > 7) { // non-number labels only in higher debug levels
				Utils.console.debug("dvmGotoLine:", sMsg + ": " + line);
			}
		}
		this.iLine = line;
	}

	private fnCheckSqTimer() {
		let bTimerExpired = false;

		if (this.iTimerPriority < 2) {
			for (let i = 0; i < CpcVm.iSqTimerCount; i += 1) {
				const oTimer = this.aSqTimer[i];

				// use oSound.sq(i) and not this.sq(i) since that would reset onSq timer
				if (oTimer.bActive && !oTimer.bHandlerRunning && (this.oSound.sq(i) & 0x07)) { // eslint-disable-line no-bitwise
					this.gosub(this.iLine, oTimer.iLine);
					oTimer.bHandlerRunning = true;
					oTimer.iStackIndexReturn = this.aGosubStack.length;
					oTimer.bRepeat = false; // one shot
					bTimerExpired = true;
					break; // found expired timer
				}
			}
		}
		return bTimerExpired;
	}

	private vmCheckTimer(iTime: number) {
		let bTimerExpired = false;

		for (let i = CpcVm.iTimerCount - 1; i > this.iTimerPriority; i -= 1) { // check timers starting with highest priority first
			const oTimer = this.aTimer[i];

			if (oTimer.bActive && !oTimer.bHandlerRunning && iTime > oTimer.iNextTimeMs) { // timer expired?
				this.gosub(this.iLine, oTimer.iLine);
				oTimer.bHandlerRunning = true;
				oTimer.iStackIndexReturn = this.aGosubStack.length;
				oTimer.iSavedPriority = this.iTimerPriority;
				this.iTimerPriority = i;
				if (!oTimer.bRepeat) { // not repeating
					oTimer.bActive = false;
				} else {
					const iDelta = iTime - oTimer.iNextTimeMs;

					oTimer.iNextTimeMs += oTimer.iIntervalMs * Math.ceil(iDelta / oTimer.iIntervalMs);
				}
				bTimerExpired = true;
				break; // found expired timer
			} else if (i === 2) { // for priority 2 we check the sq timers which also have priority 2
				if (this.fnCheckSqTimer()) {
					break; // found expired timer
				}
			}
		}
		return bTimerExpired;
	}

	private vmCheckTimerHandlers() {
		for (let i = CpcVm.iTimerCount - 1; i >= 0; i -= 1) {
			const oTimer = this.aTimer[i];

			if (oTimer.bHandlerRunning) {
				if (oTimer.iStackIndexReturn > this.aGosubStack.length) {
					oTimer.bHandlerRunning = false;
					this.iTimerPriority = oTimer.iSavedPriority; // restore priority
					oTimer.iStackIndexReturn = 0;
				}
			}
		}
	}

	private vmCheckSqTimerHandlers() {
		let bTimerReloaded = false;

		for (let i = CpcVm.iSqTimerCount - 1; i >= 0; i -= 1) {
			const oTimer = this.aSqTimer[i];

			if (oTimer.bHandlerRunning) {
				if (oTimer.iStackIndexReturn > this.aGosubStack.length) {
					oTimer.bHandlerRunning = false;
					this.iTimerPriority = oTimer.iSavedPriority; // restore priority
					oTimer.iStackIndexReturn = 0;
					if (!oTimer.bRepeat) { // not reloaded
						oTimer.bActive = false;
					} else {
						bTimerReloaded = true;
					}
				}
			}
		}
		return bTimerReloaded;
	}

	private vmCheckNextFrame(iTime: number) {
		if (iTime >= this.iNextFrameTime) { // next time of frame fly
			const iDelta = iTime - this.iNextFrameTime;

			if (iDelta > CpcVm.iFrameTimeMs) {
				this.iNextFrameTime += CpcVm.iFrameTimeMs * Math.ceil(iDelta / CpcVm.iFrameTimeMs);
			} else {
				this.iNextFrameTime += CpcVm.iFrameTimeMs;
			}
			this.oCanvas.updateSpeedInk();
			this.vmCheckTimer(iTime); // check BASIC timers and sound queue
			this.oSound.scheduler(); // on a real CPC it is 100 Hz, we use 50 Hz
		}
	}

	vmGetTimeUntilFrame(iTime?: number): number {
		iTime = iTime || Date.now();
		const iTimeUntilFrame = this.iNextFrameTime - iTime;

		return iTimeUntilFrame;
	}

	vmLoopCondition(): boolean {
		const iTime = Date.now();

		if (iTime >= this.iNextFrameTime) {
			this.vmCheckNextFrame(iTime);
			this.iStopCount += 1;
			if (this.iStopCount >= 5) { // do not stop too often because of just timer resason because setTimeout is expensive
				this.iStopCount = 0;
				this.vmStop("timer", 20);
			}
		}
		return this.oStop.sReason === "";
	}

	private vmInitUntypedVariables(sVarChar: string) {
		const aNames = this.oVariables.getAllVariableNames();

		for (let i = 0; i < aNames.length; i += 1) {
			const sName = aNames[i];

			if (sName.charAt(0) === sVarChar) {
				if (sName.indexOf("$") === -1 && sName.indexOf("%") === -1 && sName.indexOf("!") === -1) { // no explicit type?
					this.oVariables.initVariable(sName);
				}
			}
		}
	}

	private vmDefineVarTypes(sType: string, sNameOrRange: string, sErr: string) {
		this.vmAssertString(sNameOrRange, sErr);

		let iFirst: number, iLast: number;

		if (sNameOrRange.indexOf("-") >= 0) {
			const aRange = sNameOrRange.split("-", 2);

			iFirst = aRange[0].trim().toLowerCase().charCodeAt(0);
			iLast = aRange[1].trim().toLowerCase().charCodeAt(0);
		} else {
			iFirst = sNameOrRange.trim().toLowerCase().charCodeAt(0);
			iLast = iFirst;
		}
		for (let i = iFirst; i <= iLast; i += 1) {
			const sVarChar = String.fromCharCode(i);

			if (this.oVariables.getVarType(sVarChar) !== sType) { // type changed?
				this.oVariables.setVarType(sVarChar, sType);
				// initialize all untyped variables starting with sVarChar!
				this.vmInitUntypedVariables(sVarChar);
			}
		}
	}

	vmStop(sReason: string, iPriority: number, bForce?: boolean, oParas?: VmStopParas): void { // optional bForce, oParas
		const iDefaultPriority = CpcVm.mStopPriority[sReason];

		if (iDefaultPriority === undefined) {
			Utils.console.warn("Programming error: vmStop: Unknown reason:", sReason);
		}

		iPriority = iPriority || 0;
		if (iPriority !== 0) {
			iPriority = iDefaultPriority;
		}
		if (bForce || iPriority >= this.oStop.iPriority) {
			this.oStop.iPriority = iPriority;
			this.oStop.sReason = sReason;
			this.oStop.oParas = oParas || CpcVm.oEmptyParas as VmStopParas;
		}
	}

	vmNotImplemented(sName: string): void { // eslint-disable-line class-methods-use-this
		Utils.console.warn("Not implemented:", sName);
	}

	// not complete
	private vmUsingFormat1(sFormat: string, arg: string | number) {
		const sPadChar = " ",
			re1 = /^\\ *\\$/;
		let sStr: string;

		if (typeof arg === "string") {
			if (sFormat === "&") {
				sStr = arg;
			} else if (sFormat === "!") {
				sStr = arg.charAt(0);
			} else if (re1.test(sFormat)) { // "\...\"
				sStr = arg.substr(0, sFormat.length);
				const iPadLen = sFormat.length - arg.length,
					sPad = (iPadLen > 0) ? sPadChar.repeat(iPadLen) : "";

				sStr = arg + sPad; // string left aligned
			} else { // no string format
				throw this.vmComposeError(Error(), 13, "USING format " + sFormat); // "Type mismatch"
			}
		} else { // number (not fully implemented)
			if (sFormat === "&" || sFormat === "!" || re1.test(sFormat)) { // string format for number?
				throw this.vmComposeError(Error(), 13, "USING format " + sFormat); // "Type mismatch"
			}
			if (sFormat.indexOf(".") < 0) { // no decimal point?
				sStr = arg.toFixed(0);
			} else { // assume ###.##
				const aFormat = sFormat.split(".", 2),
					iDecimals = aFormat[1].length;

				// To avoid rounding errors: https://www.jacklmoore.com/notes/rounding-in-javascript
				arg = Number(Math.round(Number(arg + "e" + iDecimals)) + "e-" + iDecimals);
				sStr = arg.toFixed(iDecimals);
			}
			if (sFormat.indexOf(",") >= 0) { // contains comma => insert thousands separator
				sStr = Utils.numberWithCommas(sStr);
			}

			const iPadLen = sFormat.length - sStr.length,
				sPad = (iPadLen > 0) ? sPadChar.repeat(iPadLen) : "";

			sStr = sPad + sStr;
			if (sStr.length > sFormat.length) {
				sStr = "%" + sStr; // mark too long
			}
		}
		return sStr;
	}

	vmGetStopObject(): VmStopEntry {
		return this.oStop;
	}

	vmGetInFileObject(): InFile {
		return this.oInFile;
	}

	vmGetOutFileObject(): OutFile {
		return this.oOutFile;
	}

	vmAdaptFilename(sName: string, sErr: string): string {
		this.vmAssertString(sName, sErr);
		sName = sName.replace(/ /g, ""); // remove spaces
		if (sName.indexOf("!") === 0) {
			sName = sName.substr(1); // remove preceding "!"
		}

		const iIndex = sName.indexOf(":");

		if (iIndex >= 0) {
			sName = sName.substr(iIndex + 1); // remove user and drive letter including ":"
		}
		sName = sName.toLowerCase();

		if (!sName) {
			throw this.vmComposeError(Error(), 32, "Bad filename: " + sName);
		}
		return sName;
	}

	vmGetSoundData(): SoundData[] {
		return this.aSoundData;
	}

	vmTrace(iLine: number): void {
		const iStream = 0;

		this.iTronLine = iLine;
		if (this.bTron) {
			this.print(iStream, "[" + iLine + "]");
		}
	}

	private vmDrawMovePlot(sType: string, iGPen?: number, iGColMode?: number) {
		if (iGPen !== undefined) {
			iGPen = this.vmInRangeRound(iGPen, 0, 15, sType);
			this.oCanvas.setGPen(iGPen);
		}
		if (iGColMode !== undefined) {
			iGColMode = this.vmInRangeRound(iGColMode, 0, 3, sType);
			this.oCanvas.setGColMode(iGColMode);
		}
	}

	private vmAfterEveryGosub(sType: string, iInterval: number, iTimer: number, iLine: number) { // iTimer may be null
		iInterval = this.vmInRangeRound(iInterval, 0, 32767, sType); // more would be overflow
		iTimer = this.vmInRangeRound(iTimer || 0, 0, 3, sType);
		const oTimer = this.aTimer[iTimer];

		if (iInterval) {
			const iIntervalMs = iInterval * CpcVm.iFrameTimeMs; // convert to ms

			oTimer.iIntervalMs = iIntervalMs;
			oTimer.iLine = iLine;
			oTimer.bRepeat = (sType === "EVERY");
			oTimer.bActive = true;
			oTimer.iNextTimeMs = Date.now() + iIntervalMs;
		} else { // interval 0 => switch running timer off
			oTimer.bActive = false;
		}
	}

	private vmCopyFromScreen(iSource: number, iDest: number) {
		for (let i = 0; i < 0x4000; i += 1) {
			let iByte = this.oCanvas.getByte(iSource + i); // get byte from screen memory

			if (iByte === null) { // byte not visible on screen?
				iByte = this.aMem[iSource + i] || 0; // get it from our memory
			}
			this.aMem[iDest + i] = iByte;
		}
	}

	private vmCopyToScreen(iSource: number, iDest: number) {
		for (let i = 0; i < 0x4000; i += 1) {
			const iByte = this.aMem[iSource + i] || 0; // get it from our memory

			this.oCanvas.setByte(iDest + i, iByte);
		}
	}

	private vmSetScreenBase(iByte: number) {
		iByte = this.vmInRangeRound(iByte, 0, 255, "screenBase");

		const iPage = iByte >> 6, // eslint-disable-line no-bitwise
			iOldPage = this.iScreenPage;

		if (iPage !== iOldPage) {
			let iAddr = iOldPage << 14; // eslint-disable-line no-bitwise

			this.vmCopyFromScreen(iAddr, iAddr);

			this.iScreenPage = iPage;
			iAddr = iPage << 14; // eslint-disable-line no-bitwise
			this.vmCopyToScreen(iAddr, iAddr);
		}
	}

	private vmSetScreenOffset(iOffset: number) {
		this.oCanvas.setScreenOffset(iOffset);
	}

	// could be also set vmSetScreenViewBase? thisiScreenViewPage?  We always draw on visible canvas?

	private vmSetTransparentMode(iStream: number, iTransparent: number) {
		const oWin = this.aWindow[iStream];

		oWin.bTransparent = Boolean(iTransparent);
	}

	// --

	abs(n: number): number {
		this.vmAssertNumber(n, "ABS");
		return Math.abs(n);
	}

	addressOf(sVar: string): number { // addressOf operator
		// not really implemented
		sVar = sVar.replace("v.", "");
		sVar = sVar.replace("[", "(");

		let iPos = sVar.indexOf("("); // array variable with indices?

		if (iPos >= 0) {
			sVar = sVar.substr(0, iPos); // remove indices
		}

		iPos = this.oVariables.getVariableIndex(sVar);
		if (iPos < 0) {
			throw this.vmComposeError(Error(), 5, "@" + sVar); // Improper argument
		}
		return iPos;
	}

	afterGosub(iInterval: number, iTimer: number, iLine: number): void {
		this.vmAfterEveryGosub("AFTER", iInterval, iTimer, iLine);
	}

	private static vmGetCpcCharCode(iCode: number): number {
		if (iCode > 255) { // map some UTF-8 character codes
			if (CpcVm.mUtf8ToCpc[iCode]) {
				iCode = CpcVm.mUtf8ToCpc[iCode];
			}
		}
		return iCode;
	}

	asc(s: string): number {
		this.vmAssertString(s, "ASC");
		if (!s.length) {
			throw this.vmComposeError(Error(), 5, "ASC"); // Improper argument
		}
		return CpcVm.vmGetCpcCharCode(s.charCodeAt(0));
	}

	atn(n: number): number {
		this.vmAssertNumber(n, "ATN");
		return Math.atan((this.bDeg) ? Utils.toRadians(n) : n);
	}

	auto(): void {
		this.vmNotImplemented("AUTO");
	}

	bin$(n: number, iPad?: number): string {
		n = this.vmInRangeRound(n, -32768, 65535, "BIN$");
		iPad = this.vmInRangeRound(iPad || 0, 0, 16, "BIN$");
		return n.toString(2).padStart(iPad || 16, "0");
	}

	border(iInk1: number, iInk2?: number): void { // ink2 optional
		iInk1 = this.vmInRangeRound(iInk1, 0, 31, "BORDER");
		if (iInk2 === undefined) {
			iInk2 = iInk1;
		} else {
			iInk2 = this.vmInRangeRound(iInk2, 0, 31, "BORDER");
		}
		this.oCanvas.setBorder(iInk1, iInk2);
	}

	// break

	private vmMcSetMode(iMode: number) {
		iMode = this.vmInRangeRound(iMode, 0, 3, "MCSetMode");

		const iAddr = this.iScreenPage << 14, // eslint-disable-line no-bitwise
			iCanvasMode = this.oCanvas.getMode();

		if (iMode !== iCanvasMode) {
			// keep screen bytes, just interpret in other mode
			this.vmCopyFromScreen(iAddr, iAddr); // read bytes from screen memory into memory
			this.oCanvas.changeMode(iMode); // change mode and interpretation of bytes
			this.vmCopyToScreen(iAddr, iAddr); // write bytes back to screen memory
			this.oCanvas.changeMode(iCanvasMode); // keep moe
			// TODO: new content should still be written in old mode but interpreted in new mode
		}
	}

	private vmTxtInverse(iStream: number) { // iStream must be checked
		const oWin = this.aWindow[iStream],
			iTmp = oWin.iPen;

		this.pen(iStream, oWin.iPaper);
		this.paper(iStream, iTmp);
	}

	private vmPutKeyInBuffer(sKey: string) {
		this.oKeyboard.putKeyInBuffer(sKey);

		const oKeyDownHandler = this.oKeyboard.getKeyDownHandler();

		if (oKeyDownHandler) {
			oKeyDownHandler();
		}
	}

	call(iAddr: number): void { // eslint-disable-line complexity
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
			Utils.console.log("TODO: CALL", iAddr);
			break;
		case 0xbcb9: // SOUND Continue (ROM &1EE6)
			Utils.console.log("TODO: CALL", iAddr);
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
			if (Utils.debug > 0) {
				Utils.console.debug("Ignored: CALL", iAddr);
			}
			break;
		}
	}

	cat(): void {
		const iStream = 0,
			oFileParas: VmFileParas = {
				sCommand: "cat",
				iStream: iStream,
				sFileMask: "",
				iLine: this.iLine // unused
			};

		this.vmStop("fileCat", 45, false, oFileParas);
	}

	chain(sName: string, iLine?: number): void { // optional iLine
		const oInFile = this.oInFile;

		sName = this.vmAdaptFilename(sName, "CHAIN");
		this.closein();
		oInFile.bOpen = true;
		oInFile.sCommand = "chain";
		oInFile.sName = sName;
		oInFile.iLine = iLine || 0;
		oInFile.fnFileCallback = this.fnCloseinHandler;
		this.vmStop("fileLoad", 90);
	}

	chainMerge(sName: string, iLine?: number, iFirst?: number, iLast?: number): void { // optional iLine, iFirst, iLast
		const oInFile = this.oInFile;

		sName = this.vmAdaptFilename(sName, "CHAIN MERGE");
		this.closein();
		oInFile.bOpen = true;
		oInFile.sCommand = "chainMerge";
		oInFile.sName = sName;
		oInFile.iLine = iLine || 0;
		oInFile.iFirst = iFirst || 0;
		oInFile.iLast = iLast || 0;
		oInFile.fnFileCallback = this.fnCloseinHandler;
		this.vmStop("fileLoad", 90);
	}

	chr$(n: number): string {
		n = this.vmInRangeRound(n, 0, 255, "CHR$");
		return String.fromCharCode(n);
	}

	cint(n: number): number {
		return this.vmInRangeRound(n, -32768, 32767);
	}

	clear(): void {
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
	}

	clearInput(): void {
		this.oKeyboard.clearInput();
	}

	clg(iGPaper?: number): void {
		if (iGPaper !== undefined) {
			iGPaper = this.vmInRangeRound(iGPaper, 0, 15, "CLG");
			this.oCanvas.setGPaper(iGPaper);
		}
		this.oCanvas.clearGraphicsWindow();
	}

	vmCloseinCallback(): void {
		const oInFile = this.oInFile;

		CpcVm.vmResetFileHandling(oInFile);
	}

	closein(): void {
		const oInFile = this.oInFile;

		if (oInFile.bOpen) {
			this.vmCloseinCallback(); // not really used as a callback here
		}
	}

	vmCloseoutCallback(): void {
		const oOutFile = this.oOutFile;

		CpcVm.vmResetFileHandling(oOutFile);
	}

	closeout(): void {
		const oOutFile = this.oOutFile;

		if (oOutFile.bOpen) {
			if (oOutFile.sCommand !== "openout") {
				Utils.console.warn("closeout: command=", oOutFile.sCommand); // should not occur
			}
			if (!oOutFile.aFileData.length) { // openout without data?
				this.vmCloseoutCallback(); // close directly
			} else { // data to save
				oOutFile.sCommand = "closeout";
				oOutFile.fnFileCallback = this.fnCloseoutHandler;
				this.vmStop("fileSave", 90); // must stop directly after closeout
			}
		}
	}

	// also called for chr$(12), call &bb6c
	cls(iStream: number): void {
		iStream = this.vmInRangeRound(iStream, 0, 7, "CLS");

		const oWin = this.aWindow[iStream];

		this.vmDrawUndrawCursor(iStream); // why, if we clear anyway?

		this.oCanvas.clearTextWindow(oWin.iLeft, oWin.iRight, oWin.iTop, oWin.iBottom, oWin.iPaper); // cls window
		oWin.iPos = 0;
		oWin.iVpos = 0;

		if (!iStream) {
			this.sOut = ""; // clear also console, if stream===0
		}
	}

	commaTab(iStream: number): string { // special function used for comma in print (ROM &F25C), called delayed by print
		iStream = this.vmInRangeRound(iStream, 0, 9, "commaTab");

		this.vmMoveCursor2AllowedPos(iStream);

		const iZone = this.iZone,
			oWin = this.aWindow[iStream];
		let iCount = iZone - (oWin.iPos % iZone);

		if (oWin.iPos) { // <>0: not begin of line
			if (oWin.iPos + iCount + iZone > (oWin.iRight + 1 - oWin.iLeft)) {
				oWin.iPos += iCount + iZone;
				this.vmMoveCursor2AllowedPos(iStream);
				iCount = 0;
			}
		}
		return " ".repeat(iCount);
	}

	cont(): void {
		if (!this.iStartLine) {
			throw this.vmComposeError(Error(), 17, "CONT"); // cannot continue
		}
		this.vmGotoLine(this.iStartLine, "CONT");
		this.iStartLine = 0;
	}

	copychr$(iStream: number): string {
		iStream = this.vmInRangeRound(iStream, 0, 7, "COPYCHR$");
		this.vmMoveCursor2AllowedPos(iStream);

		this.vmDrawUndrawCursor(iStream); // undraw
		const oWin = this.aWindow[iStream],
			iChar = this.oCanvas.readChar(oWin.iPos + oWin.iLeft, oWin.iVpos + oWin.iTop, oWin.iPen, oWin.iPaper),
			sChar = (iChar >= 0) ? String.fromCharCode(iChar) : "";

		this.vmDrawUndrawCursor(iStream); // draw
		return sChar;
	}

	cos(n: number): number {
		this.vmAssertNumber(n, "COS");
		return Math.cos((this.bDeg) ? Utils.toRadians(n) : n);
	}

	creal(n: number): number {
		this.vmAssertNumber(n, "CREAL");
		return n;
	}

	vmPlaceRemoveCursor(iStream: number): void {
		const oWin = this.aWindow[iStream];

		this.vmMoveCursor2AllowedPos(iStream);
		this.oCanvas.drawCursor(oWin.iPos + oWin.iLeft, oWin.iVpos + oWin.iTop, oWin.iPen, oWin.iPaper);
	}

	vmDrawUndrawCursor(iStream: number): void {
		const oWin = this.aWindow[iStream];

		if (oWin.bCursorOn && oWin.bCursorEnabled) {
			this.vmPlaceRemoveCursor(iStream);
		}
	}

	cursor(iStream: number, iCursorOn?: number, iCursorEnabled?: number): void { // one of iCursorOn, iCursorEnabled is optional
		iStream = this.vmInRangeRound(iStream, 0, 7, "CURSOR");
		const oWin = this.aWindow[iStream];

		if (iCursorOn !== undefined) { // system
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
	}

	data(iLine: number, ...aArgs: DataEntryType[]): void { // varargs
		if (!this.oDataLineIndex[iLine]) {
			this.oDataLineIndex[iLine] = this.aData.length; // set current index for the line
		}
		// append data
		for (let i = 0; i < aArgs.length; i += 1) {
			this.aData.push(aArgs[i]);
		}
	}

	dec$(n: number, sFrmt: string): string {
		this.vmAssertNumber(n, "DEC$");
		this.vmAssertString(sFrmt, "DEC$");
		return this.vmUsingFormat1(sFrmt, n);
	}

	// def fn

	defint(sNameOrRange: string): void {
		this.vmDefineVarTypes("I", sNameOrRange, "DEFINT");
	}

	defreal(sNameOrRange: string): void {
		this.vmDefineVarTypes("R", sNameOrRange, "DEFREAL");
	}

	defstr(sNameOrRange: string): void {
		this.vmDefineVarTypes("$", sNameOrRange, "DEFSTR");
	}

	deg(): void {
		this.bDeg = true;
	}

	"delete"(iFirst = 1, iLast?: number): void {
		iFirst = this.vmInRangeRound(iFirst, 1, 65535, "DELETE");

		if (iLast === undefined) { // just one parameter specified?
			iLast = iFirst;
		} else { // range
			iLast = this.vmInRangeRound(iLast, 1, 65535, "DELETE");
		}

		this.vmStop("deleteLines", 85, false, {
			sCommand: "DELETE",
			iStream: 0, // unused
			iFirst: iFirst,
			iLast: iLast,
			iLine: this.iLine // unused
		});
	}

	derr(): number { // eslint-disable-line class-methods-use-this
		return 0; // "[Not implemented yet: derr]"
	}

	di(): void {
		this.iTimerPriority = 3; // increase priority
	}

	dim(sVarName: string): void { // varargs
		const aDimensions = [];

		for (let i = 1; i < arguments.length; i += 1) {
			const iSize = this.vmInRangeRound(arguments[i], 0, 32767, "DIM") + 1; // for basic we have sizes +1

			aDimensions.push(iSize);
		}
		this.oVariables.dimVariable(sVarName, aDimensions);
	}

	draw(x: number, y: number, iGPen?: number, iGColMode?: number): void {
		x = this.vmInRangeRound(x, -32768, 32767, "DRAW");
		y = this.vmInRangeRound(y, -32768, 32767, "DRAW");
		this.vmDrawMovePlot("DRAW", iGPen, iGColMode);
		this.oCanvas.draw(x, y);
	}

	drawr(x: number, y: number, iGPen?: number, iGColMode?: number): void {
		x = this.vmInRangeRound(x, -32768, 32767, "DRAWR");
		y = this.vmInRangeRound(y, -32768, 32767, "DRAWR");
		this.vmDrawMovePlot("DRAWR", iGPen, iGColMode);
		this.oCanvas.drawr(x, y);
	}

	edit(iLine: number): void {
		const oLineParas: VmLineParas = {
			sCommand: "edit",
			iStream: 0, // unused
			iFirst: iLine,
			iLast: 0, // unused,
			iLine: this.iLine // unused
		};

		this.vmStop("editLine", 85, false, oLineParas);
	}

	ei(): void {
		this.iTimerPriority = -1; // decrease priority
	}

	end(sLabel: string): void {
		this.stop(sLabel);
	}

	ent(iToneEnv: number, ...aArgs: number[]): void { // varargs
		const aEnvData: ToneEnvData[] = [];

		let	oArg: ToneEnvData,
			bRepeat = false;

		iToneEnv = this.vmInRangeRound(iToneEnv, -15, 15, "ENT");

		if (iToneEnv < 0) {
			iToneEnv = -iToneEnv;
			bRepeat = true;
		}

		if (iToneEnv) { // not 0
			for (let i = 0; i < aArgs.length; i += 3) { // starting with 1: 3 parameters per section
				if (aArgs[i] !== undefined) {
					oArg = {
						steps: this.vmInRangeRound(aArgs[i], 0, 239, "ENT"), // number of steps: 0..239
						diff: this.vmInRangeRound(aArgs[i + 1], -128, 127, "ENT"), // size (period change) of steps: -128..+127
						time: this.vmInRangeRound(aArgs[i + 2], 0, 255, "ENT"), // time per step: 0..255 (0=256)
						repeat: bRepeat
					} as ToneEnvData1;
				} else { // special handling
					oArg = {
						period: this.vmInRangeRound(aArgs[i + 1], 0, 4095, "ENT"), // absolute period
						time: this.vmInRangeRound(aArgs[i + 2], 0, 255, "ENT") // time: 0..255 (0=256)
					} as ToneEnvData2;
				}
				aEnvData.push(oArg);
			}
			this.oSound.setToneEnv(iToneEnv, aEnvData);
		} else { // 0
			Utils.console.warn("ENT: iToneEnv", iToneEnv);
			throw this.vmComposeError(Error(), 5, "ENT " + iToneEnv); // Improper argument
		}
	}

	env(iVolEnv: number, ...aArgs: number[]): void { // varargs
		const aEnvData: VolEnvData[] = [];
		let oArg: VolEnvData;

		iVolEnv = this.vmInRangeRound(iVolEnv, 1, 15, "ENV");

		for (let i = 0; i < aArgs.length; i += 3) { // starting with 1: 3 parameters per section
			if (aArgs[i] !== undefined) {
				oArg = {
					steps: this.vmInRangeRound(aArgs[i], 0, 127, "ENV"), // number of steps: 0..127
					/* eslint-disable no-bitwise */
					diff: this.vmInRangeRound(aArgs[i + 1], -128, 127, "ENV") & 0x0f, // size (volume) of steps: moved to range 0..15
					/* eslint-enable no-bitwise */
					time: this.vmInRangeRound(aArgs[i + 2], 0, 255, "ENV") // time per step: 0..255 (0=256)
				} as VolEnvData1;
				if (!oArg.time) { // (0=256)
					oArg.time = 256;
				}
			} else { // special handling for register parameters
				oArg = {
					register: this.vmInRangeRound(aArgs[i + 1], 0, 15, "ENV"), // register: 0..15
					period: this.vmInRangeRound(aArgs[i + 2], -32768, 65535, "ENV")
				} as VolEnvData2;
			}
			aEnvData.push(oArg);
		}
		this.oSound.setVolEnv(iVolEnv, aEnvData);
	}

	eof(): number {
		const oInFile = this.oInFile;
		let iEof = -1;

		if (oInFile.bOpen && oInFile.aFileData.length) {
			iEof = 0;
		}
		return iEof;
	}

	private vmFindArrayVariable(sName: string): string {
		sName += "A";
		if (this.oVariables.variableExist(sName)) { // one dim array variable?
			return sName;
		}

		// find multi-dim array variable
		const fnArrayVarFilter = function (sVar: string) {
			return (sVar.indexOf(sName) === 0) ? sVar : null; // find array varA
		};
		let aNames = this.oVariables.getAllVariableNames();

		aNames = aNames.filter(fnArrayVarFilter); // find array varA... with any number of indices
		return aNames[0]; // we should find exactly one
	}

	erase(...aArgs: string[]): void { // varargs
		for (let i = 0; i < aArgs.length; i += 1) {
			const sName = this.vmFindArrayVariable(aArgs[i]);

			if (sName) {
				this.oVariables.initVariable(sName);
			} else {
				Utils.console.warn("Array variable not found:", aArgs[i]);
				throw this.vmComposeError(Error(), 5, "ERASE " + aArgs[i]); // Improper argument
			}
		}
	}

	erl(): number {
		const iErl = parseInt(String(this.iErl), 10); // in cpcBasic we have an error label here, so return number only

		return iErl || 0;
	}

	err(): number {
		return this.iErr;
	}

	vmComposeError(oError: Error, iErr: number, sErrInfo: string): CustomError {
		const aErrors = CpcVm.aErrors,
			sError = aErrors[iErr] || aErrors[aErrors.length - 1]; // maybe Unknown error

		this.iErr = iErr;
		this.iErl = this.iLine;

		let sLine = this.iErl;

		if (this.iTronLine) {
			sLine += " (trace: " + this.iTronLine + ")";
		}

		const sErrorWithInfo = sError + " in " + sLine + (sErrInfo ? (": " + sErrInfo) : "");
		let	bHidden = false; // hide errors wich are catched

		if (this.iErrorGotoLine && !this.iErrorResumeLine) {
			this.iErrorResumeLine = Number(this.iErl);
			this.vmGotoLine(this.iErrorGotoLine, "onError");
			this.vmStop("onError", 50);
			bHidden = true;
		} else {
			this.vmStop("error", 50);
		}
		Utils.console.log("BASIC error(" + iErr + "):", sErrorWithInfo + (bHidden ? " (hidden: " + bHidden + ")" : ""));
		return Utils.composeError("CpcVm", oError, sError, sErrInfo, -1, sLine, bHidden);
	}

	error(iErr: number, sErrInfo: string): void {
		iErr = this.vmInRangeRound(iErr, 0, 255, "ERROR"); // could trigger another error
		throw this.vmComposeError(Error(), iErr, sErrInfo);
	}

	everyGosub(iInterval: number, iTimer: number, iLine: number): void {
		this.vmAfterEveryGosub("EVERY", iInterval, iTimer, iLine);
	}

	exp(n: number): number {
		this.vmAssertNumber(n, "EXP");
		return Math.exp(n);
	}

	fill(iGPen: number): void {
		iGPen = this.vmInRangeRound(iGPen, 0, 15, "FILL");
		this.oCanvas.fill(iGPen);
	}

	fix(n: number): number {
		this.vmAssertNumber(n, "FIX");
		return Math.trunc(n); // (ES6: Math.trunc)
	}

	frame(): void {
		this.vmStop("waitFrame", 40);
	}

	fre(/* arg */): number { // arg is number or string
		return this.iHimem; // example, e.g. 42245;
	}

	gosub(retLabel: string | number, n: number): void {
		this.vmGotoLine(n, "gosub (ret=" + retLabel + ")");
		this.aGosubStack.push(retLabel);
	}

	"goto"(n: string): void {
		this.vmGotoLine(n, "goto");
	}

	graphicsPaper(iGPaper: number): void {
		iGPaper = this.vmInRangeRound(iGPaper, 0, 15, "GRAPHICS PAPER");
		this.oCanvas.setGPaper(iGPaper);
	}

	graphicsPen(iGPen?: number, iTransparentMode?: number): void {
		if (iGPen !== undefined) {
			iGPen = this.vmInRangeRound(iGPen, 0, 15, "GRAPHICS PEN");
			this.oCanvas.setGPen(iGPen);
		}

		if (iTransparentMode !== undefined) {
			iTransparentMode = this.vmInRangeRound(iTransparentMode, 0, 1, "GRAPHICS PEN");
			this.oCanvas.setGTransparentMode(Boolean(iTransparentMode));
		}
	}

	hex$(n: number, iPad?: number): string {
		n = this.vmInRangeRound(n, -32768, 65535, "HEX$");
		iPad = this.vmInRangeRound(iPad || 0, 0, 16, "HEX$");
		return n.toString(16).toUpperCase().padStart(iPad, "0");
	}

	himem(): number {
		return this.iHimem;
	}

	ink(iPen: number, iInk1: number, iInk2?: number): void { // optional iInk2
		iPen = this.vmInRangeRound(iPen, 0, 15, "INK");
		iInk1 = this.vmInRangeRound(iInk1, 0, 31, "INK");
		if (iInk2 === undefined) {
			iInk2 = iInk1;
		} else {
			iInk2 = this.vmInRangeRound(iInk2, 0, 31, "INK");
		}
		this.oCanvas.setInk(iPen, iInk1, iInk2);
	}

	inkey(iKey: number): number {
		iKey = this.vmInRangeRound(iKey, 0, 79, "INKEY");
		return this.oKeyboard.getKeyState(iKey);
	}

	inkey$(): string {
		const sKey = this.oKeyboard.getKeyFromBuffer();

		// do some slowdown, if checked too early again without key press
		if (sKey !== "") { // some key pressed?
			this.iInkeyTimeMs = 0;
		} else { // no key
			const iNow = Date.now();

			if (this.iInkeyTimeMs && iNow < this.iInkeyTimeMs) { // last inkey without key was in range of frame fly?
				this.frame(); // then insert a frame fly
			}
			this.iInkeyTimeMs = iNow + CpcVm.iFrameTimeMs; // next time of frame fly
		}
		return sKey;
	}

	inp(iPort: number): number {
		const iByte = 255; // we return always the same

		iPort = this.vmInRangeRound(iPort, -32768, 65535, "INP");
		if (iPort < 0) { // 2nd complement of 16 bit address?
			iPort += 65536;
		}
		return iByte;
	}

	vmSetInputValues(aInputValues: (string | number)[]): void {
		this.aInputValues = aInputValues;
	}

	vmGetNextInput(): string | number | undefined { // called from JS script
		const aInputValues = this.aInputValues,
			value = aInputValues.shift();

		return value;
	}

	vmInputCallback(): boolean {
		const oInput = this.vmGetStopObject().oParas as VmInputParas,
			iStream = oInput.iStream,
			sInput = oInput.sInput,
			aInputValues = sInput.split(","),
			aConvertedInputValues: (string | number)[] = [],
			aTypes = oInput.aTypes;
		let bInputOk = true;

		Utils.console.log("vmInputCallback:", sInput);

		if (aTypes && (aInputValues.length === aTypes.length)) {
			for (let i = 0; i < aTypes.length; i += 1) {
				const sVarType = aTypes[i],
					sType = this.vmDetermineVarType(sVarType),
					sValue = aInputValues[i];

				if (sType !== "$") { // not a string?
					const iValue = CpcVm.vmVal(sValue); // convert to number (also binary, hex), empty string gets 0

					if (isNaN(iValue)) {
						bInputOk = false;
					}
					aConvertedInputValues.push(iValue);
				} else {
					aConvertedInputValues.push(sValue);
				}
			}
		} else {
			bInputOk = false;
		}

		this.cursor(iStream, 0);
		if (!bInputOk) {
			this.print(iStream, "?Redo from start\r\n");
			oInput.sInput = "";
			this.print(iStream, oInput.sMessage);
			this.cursor(iStream, 1);
		} else {
			this.vmSetInputValues(aConvertedInputValues);
		}
		return bInputOk;
	}

	private fnFileInputGetString(aFileData: string[]) {
		let sLine = aFileData[0].replace(/^\s+/, ""), // remove preceding whitespace
			sValue: string | undefined;

		if (sLine.charAt(0) === '"') { // quoted string?
			const iIndex = sLine.indexOf('"', 1); // closing quotes in this line?

			if (iIndex >= 0) {
				sValue = sLine.substr(1, iIndex - 1); // take string without quotes
				sLine = sLine.substr(iIndex + 1);
				sLine = sLine.replace(/^\s*,/, ""); // multiple args => remove next comma
			} else if (aFileData.length > 1) { // no closing quotes in this line => try to combine with next line
				aFileData.shift(); // remove line
				sLine += "\n" + aFileData[0]; // combine lines
			} else {
				throw this.vmComposeError(Error(), 13, "INPUT #9: no closing quotes: " + sLine);
			}
		} else { // unquoted string
			const iIndex = sLine.indexOf(","); // multiple args?

			if (iIndex >= 0) {
				sValue = sLine.substr(0, iIndex); // take arg
				sLine = sLine.substr(iIndex + 1);
			} else {
				sValue = sLine; // take line
				sLine = "";
			}
		}

		aFileData[0] = sLine;
		return sValue;
	}

	private fnFileInputGetNumber(aFileData: string[]) {
		let sLine = aFileData[0].replace(/^\s+/, ""), // remove preceding whitespace
			iIndex = sLine.indexOf(","), // multiple args?
			sValue: string;

		if (iIndex >= 0) {
			sValue = sLine.substr(0, iIndex); // take arg
			sLine = sLine.substr(iIndex + 1);
		} else {
			iIndex = sLine.indexOf(" "); // space?
			if (iIndex >= 0) {
				sValue = sLine.substr(0, iIndex); // take item until space
				sLine = sLine.substr(iIndex);
				sLine = sLine.replace(/^\s*/, ""); // remove spaces after number
			} else {
				sValue = sLine; // take line
				sLine = "";
			}
		}

		const nValue = CpcVm.vmVal(sValue); // convert to number (also binary, hex)

		if (isNaN(nValue)) { // eslint-disable-line max-depth
			throw this.vmComposeError(Error(), 13, "INPUT #9 " + nValue + ": " + sValue); // Type mismatch
		}

		aFileData[0] = sLine;
		return nValue;
	}

	private vmInputNextFileItem(sType: string) {
		const aFileData = this.oInFile.aFileData;
		let value: string | number | undefined;

		while (aFileData.length && value === undefined) {
			if (sType === "$") {
				value = this.fnFileInputGetString(aFileData);
			} else { // number type
				value = this.fnFileInputGetNumber(aFileData);
			}

			if (!aFileData[0].length) {
				aFileData.shift(); // remove empty line
			}
		}
		return value;
	}

	vmInputFromFile(aTypes: string[]): void {
		const aInputValues = [];

		for (let i = 0; i < aTypes.length; i += 1) {
			const sVarType = aTypes[i],
				sType = this.vmDetermineVarType(sVarType),
				value = this.vmInputNextFileItem(sType);

			aInputValues[i] = this.vmAssign(sVarType, value as string | number); // TTT
		}
		this.vmSetInputValues(aInputValues);
	}

	input(iStream: number, sNoCRLF: string, sMsg: string): void { // varargs
		iStream = this.vmInRangeRound(iStream, 0, 9, "INPUT");
		if (iStream < 8) {
			this.print(iStream, sMsg);
			this.vmStop("waitInput", 45, false, {
				sCommand: "input",
				iStream: iStream,
				sMessage: sMsg,
				sNoCRLF: sNoCRLF,
				fnInputCallback: this.vmInputCallback.bind(this),
				aTypes: Array.prototype.slice.call(arguments, 3), // remaining arguments
				sInput: "",
				iLine: this.iLine // to repeat in case of break
			});
			this.cursor(iStream, 1);
		} else if (iStream === 8) {
			this.vmSetInputValues(["I am the printer!"]);
		} else if (iStream === 9) {
			if (!this.oInFile.bOpen) {
				throw this.vmComposeError(Error(), 31, "INPUT #" + iStream); // File not open
			} else if (this.eof()) {
				throw this.vmComposeError(Error(), 24, "INPUT #" + iStream); // EOF met
			}
			this.vmInputFromFile(Array.prototype.slice.call(arguments, 3)); // remaining arguments
		}
	}

	instr(p1: string | number, p2: string, p3?: string): number { // optional startpos as first parameter
		this.vmAssertString(p2, "INSTR");
		if (typeof p1 === "string") { // p1=string, p2=search string
			return p1.indexOf(p2) + 1;
		}
		p1 = this.vmInRangeRound(p1, 1, 255, "INSTR"); // p1=startpos
		this.vmAssertString(p3 as string, "INSTR");
		return p2.indexOf(p3 as string, p1) + 1; // p2=string, p3=search string
	}

	"int"(n: number): number {
		this.vmAssertNumber(n, "INT");
		return Math.floor(n);
	}

	joy(iJoy: number): number {
		iJoy = this.vmInRangeRound(iJoy, 0, 1, "JOY");
		return this.oKeyboard.getJoyState(iJoy);
	}

	key(iToken: number, s: string): void {
		iToken = this.vmRound(iToken, "KEY");
		if (iToken >= 128 && iToken <= 159) {
			iToken -= 128;
		}
		iToken = this.vmInRangeRound(iToken, 0, 31, "KEY"); // round again, but we want the check
		this.vmAssertString(s, "KEY");
		this.oKeyboard.setExpansionToken(iToken, s);
	}

	keyDef(iCpcKey: number, iRepeat: number, iNormal?: number | undefined, iShift?: number | undefined, iCtrl?: number): void { // optional args iNormal,...
		const oOptions: CpcKeyExpansionsOptions = {
			iCpcKey: this.vmInRangeRound(iCpcKey, 0, 79, "KEY DEF"),
			iRepeat: this.vmInRangeRound(iRepeat, 0, 1, "KEY DEF"),
			iNormal: (iNormal !== undefined) ? this.vmInRangeRound(iNormal, 0, 255, "KEY DEF") : undefined,
			iShift: (iShift !== undefined) ? this.vmInRangeRound(iShift, 0, 255, "KEY DEF") : undefined,
			iCtrl: (iCtrl !== undefined) ? this.vmInRangeRound(iCtrl, 0, 255, "KEY DEF") : undefined
		};

		this.oKeyboard.setCpcKeyExpansion(oOptions);
	}

	left$(s: string, iLen: number): string {
		this.vmAssertString(s, "LEFT$");
		iLen = this.vmInRangeRound(iLen, 0, 255, "LEFT$");
		return s.substr(0, iLen);
	}

	len(s: string): number {
		this.vmAssertString(s, "LEN");
		return s.length;
	}

	// let

	vmLineInputCallback(): boolean {
		const oInput = this.vmGetStopObject().oParas as VmInputParas,
			sInput = oInput.sInput;

		Utils.console.log("vmLineInputCallback:", sInput);
		this.vmSetInputValues([sInput]);
		this.cursor(oInput.iStream, 0);
		return true;
	}

	lineInput(iStream: number, sNoCRLF: string, sMsg: string, sVarType: string): void { // sVarType must be string variable
		iStream = this.vmInRangeRound(iStream, 0, 9, "LINE INPUT");
		if (iStream < 8) {
			this.print(iStream, sMsg);
			const sType = this.vmDetermineVarType(sVarType);

			if (sType !== "$") { // not string?
				this.print(iStream, "\r\n");
				throw this.vmComposeError(Error(), 13, "LINE INPUT " + sType); // Type mismatch
			}

			this.cursor(iStream, 1);
			this.vmStop("waitInput", 45, false, {
				sCommand: "lineinput",
				iStream: iStream,
				sMessage: sMsg,
				sNoCRLF: sNoCRLF,
				fnInputCallback: this.vmLineInputCallback.bind(this),
				sInput: "",
				iLine: this.iLine // to repeat in case of break
			});
		} else if (iStream === 8) {
			this.vmSetInputValues(["I am the printer!"]);
		} else if (iStream === 9) {
			if (!this.oInFile.bOpen) {
				throw this.vmComposeError(Error(), 31, "LINE INPUT #" + iStream); // File not open
			} else if (this.eof()) {
				throw this.vmComposeError(Error(), 24, "LINE INPUT #" + iStream); // EOF met
			}
			this.vmSetInputValues(this.oInFile.aFileData.splice(0, arguments.length - 3)); // always 1 element
		}
	}

	list(iStream: number, iFirst = 1, iLast?: number): void { // varargs
		iStream = this.vmInRangeRound(iStream, 0, 9, "LIST");

		iFirst = this.vmInRangeRound(iFirst, 1, 65535, "LIST");
		if (iLast === undefined) { // just one parameter specified?
			iLast = iFirst;
		} else { // range
			iLast = this.vmInRangeRound(iLast, 1, 65535, "LIST");
		}

		if (iStream === 9) {
			if (!this.oOutFile.bOpen) { // catch here
				throw this.vmComposeError(Error(), 31, "LIST #" + iStream); // File not open
			}
		}

		this.vmStop("list", 90, false, {
			sCommand: "list",
			iStream: iStream,
			iFirst: iFirst,
			iLast: iLast,
			iLine: this.iLine // unused
		});
	}

	vmLoadCallback(sInput: string, oMeta: FileMeta): boolean {
		const oInFile = this.oInFile;

		let	bPutInMemory = false;

		if (sInput !== null && oMeta) {
			if (oMeta.sType === "B" || oInFile.iStart !== undefined) { // only for binary files or when a load address is specified (feature)
				const iStart = oInFile.iStart !== undefined ? oInFile.iStart : Number(oMeta.iStart);
				let	iLength = Number(oMeta.iLength); // we do not really need the length from metadata

				if (isNaN(iLength)) {
					iLength = sInput.length; // only valid after atob()
				}
				if (Utils.debug > 1) {
					Utils.console.debug("vmLoadCallback:", oInFile.sName + ": putting data in memory", iStart, "-", iStart + iLength);
				}
				for (let i = 0; i < iLength; i += 1) {
					const iByte = sInput.charCodeAt(i);

					this.poke((iStart + i) & 0xffff, iByte); // eslint-disable-line no-bitwise
				}
				bPutInMemory = true;
			}
		}
		this.closein();
		return bPutInMemory;
	}

	load(sName: string, iStart?: number): void { // optional iStart
		const oInFile = this.oInFile;

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
	}

	vmLocate(iStream: number, iPos: number, iVpos: number): void {
		const oWin = this.aWindow[iStream];

		oWin.iPos = iPos - 1;
		oWin.iVpos = iVpos - 1;
	}

	locate(iStream: number, iPos: number, iVpos: number): void {
		iStream = this.vmInRangeRound(iStream, 0, 7, "LOCATE");
		iPos = this.vmInRangeRound(iPos, 1, 255, "LOCATE");
		iVpos = this.vmInRangeRound(iVpos, 1, 255, "LOCATE");

		this.vmDrawUndrawCursor(iStream); // undraw
		this.vmLocate(iStream, iPos, iVpos);
		this.vmDrawUndrawCursor(iStream); // draw
	}

	log(n: number): number {
		this.vmAssertNumber(n, "LOG");
		return Math.log(n);
	}

	log10(n: number): number {
		this.vmAssertNumber(n, "LOG10");
		return Math.log10(n);
	}

	private static fnLowerCase(sMatch: string) {
		return sMatch.toLowerCase();
	}

	lower$(s: string): string {
		this.vmAssertString(s, "LOWER$");

		s = s.replace(/[A-Z]/g, CpcVm.fnLowerCase); // replace only characters A-Z
		return s;
	}

	mask(iMask: number | undefined, iFirst?: number): void { // one of iMask, iFirst is optional
		if (iMask !== undefined) { //TTT
			iMask = this.vmInRangeRound(iMask, 0, 255, "MASK");
			this.oCanvas.setMask(iMask);
		}

		if (iFirst !== undefined) {
			iFirst = this.vmInRangeRound(iFirst, 0, 1, "MASK");
			this.oCanvas.setMaskFirst(iFirst);
		}
	}

	max(...aArgs: number[]): number {
		for (let i = 0; i < aArgs.length; i += 1) {
			this.vmAssertNumber(aArgs[i], "MAX");
		}
		return Math.max.apply(null, aArgs);
	}

	memory(n: number): void {
		n = this.vmInRangeRound(n, -32768, 65535, "MEMORY");

		if (n < CpcVm.iMinHimem || n > this.iMinCharHimem) {
			throw this.vmComposeError(Error(), 7, "MEMORY " + n); // Memory full
		}
		this.iHimem = n;
	}

	merge(sName: string): void {
		const oInFile = this.oInFile;

		sName = this.vmAdaptFilename(sName, "MERGE");
		this.closein();
		oInFile.bOpen = true;
		oInFile.sCommand = "merge";
		oInFile.sName = sName;
		oInFile.fnFileCallback = this.fnCloseinHandler;
		this.vmStop("fileLoad", 90);
	}

	mid$(s: string, iStart: number, iLen?: number): string { // as function; iLen is optional
		this.vmAssertString(s, "MID$");
		iStart = this.vmInRangeRound(iStart, 1, 255, "MID$");
		if (iLen !== undefined) {
			iLen = this.vmInRangeRound(iLen, 0, 255, "MID$");
		}
		return s.substr(iStart - 1, iLen);
	}

	mid$Assign(s: string, iStart: number, iLen: number | undefined, sNew: string): string {
		this.vmAssertString(s, "MID$");
		this.vmAssertString(sNew, "MID$");
		iStart = this.vmInRangeRound(iStart, 1, 255, "MID$") - 1;
		iLen = (iLen !== undefined) ? this.vmInRangeRound(iLen, 0, 255, "MID$") : sNew.length;
		if (iLen > sNew.length) {
			iLen = sNew.length;
		}
		if (iLen > s.length - iStart) {
			iLen = s.length - iStart;
		}
		s = s.substr(0, iStart) + sNew.substr(0, iLen) + s.substr(iStart + iLen);
		return s;
	}

	min(...aArgs: number[]): number {
		for (let i = 0; i < aArgs.length; i += 1) {
			this.vmAssertNumber(aArgs[i], "MIN");
		}
		return Math.min.apply(null, aArgs);
	}

	// mod

	mode(iMode: number): void {
		iMode = this.vmInRangeRound(iMode, 0, 3, "MODE");
		this.iMode = iMode;
		this.vmResetWindowData(false); // do not reset pen and paper
		this.sOut = ""; // clear console
		this.oCanvas.setMode(iMode); // does not clear canvas

		this.oCanvas.clearFullWindow(); // always with paper 0 (SCR MODE CLEAR)
	}

	move(x: number, y: number, iGPen?: number, iGColMode?: number): void {
		x = this.vmInRangeRound(x, -32768, 32767, "MOVE");
		y = this.vmInRangeRound(y, -32768, 32767, "MOVE");
		this.vmDrawMovePlot("MOVE", iGPen, iGColMode);
		this.oCanvas.move(x, y);
	}

	mover(x: number, y: number, iGPen?: number, iGColMode?: number): void {
		x = this.vmInRangeRound(x, -32768, 32767, "MOVER");
		y = this.vmInRangeRound(y, -32768, 32767, "MOVER");
		this.vmDrawMovePlot("MOVER", iGPen, iGColMode);
		this.oCanvas.mover(x, y);
	}

	"new"(): void {
		this.clear();

		const oLineParas: VmLineParas = {
			sCommand: "new",
			iStream: 0, // unused
			iFirst: 0, // unused
			iLast: 0, // unused
			iLine: this.iLine // unused
		};

		this.vmStop("new", 90, false, oLineParas);
	}

	onBreakCont(): void {
		this.iBreakGosubLine = -1;
		this.iBreakResumeLine = 0;
	}

	onBreakGosub(iLine: number): void {
		this.iBreakGosubLine = iLine;
		this.iBreakResumeLine = 0;
	}

	onBreakStop(): void {
		this.iBreakGosubLine = 0;
		this.iBreakResumeLine = 0;
	}

	onErrorGoto(iLine: number): void {
		this.iErrorGotoLine = iLine;
		if (!iLine && this.iErrorResumeLine) { // line=0 but an error to resume?
			throw this.vmComposeError(Error(), this.iErr, "ON ERROR GOTO without RESUME from " + this.iErl);
		}
	}

	onGosub(retLabel: string, n: number, ...aArgs: number[]): void {
		n = this.vmInRangeRound(n, 0, 255, "ON GOSUB");

		let iLine: string | number;

		if (!n || n > aArgs.length) { // out of range? => continue with line after onGosub
			if (Utils.debug > 0) {
				Utils.console.debug("onGosub: out of range: n=" + n + " in " + this.iLine);
			}
			iLine = retLabel;
		} else {
			iLine = aArgs[n - 1]; // n=1...
			this.aGosubStack.push(retLabel);
		}
		this.vmGotoLine(iLine, "onGosub (n=" + n + ", ret=" + retLabel + ", iLine=" + iLine + ")");
	}

	onGoto(retLabel: string, n: number, ...aArgs: number[]): void {
		n = this.vmInRangeRound(n, 0, 255, "ON GOTO");

		let iLine: string | number;

		if (!n || n > aArgs.length) { // out of range? => continue with line after onGoto
			if (Utils.debug > 0) {
				Utils.console.debug("onGoto: out of range: n=" + n + " in " + this.iLine);
			}
			iLine = retLabel;
		} else {
			iLine = aArgs[n - 1];
		}
		this.vmGotoLine(iLine, "onGoto (n=" + n + ", ret=" + retLabel + ", iLine=" + iLine + ")");
	}

	private static fnChannel2ChannelIndex(iChannel: number) {
		if (iChannel === 4) {
			iChannel = 2;
		} else {
			iChannel -= 1;
		}
		return iChannel;
	}

	onSqGosub(iChannel: number, iLine: number): void {
		iChannel = this.vmInRangeRound(iChannel, 1, 4, "ON SQ GOSUB");
		if (iChannel === 3) {
			throw this.vmComposeError(Error(), 5, "ON SQ GOSUB " + iChannel); // Improper argument
		}
		iChannel = CpcVm.fnChannel2ChannelIndex(iChannel);

		const oSqTimer = this.aSqTimer[iChannel];

		oSqTimer.iLine = iLine;
		oSqTimer.bActive = true;
		oSqTimer.bRepeat = true; // means reloaded for sq
	}

	vmOpeninCallback(sInput: string | null): void {
		if (sInput !== null) {
			sInput = sInput.replace(/\r\n/g, "\n"); // remove CR (maybe from ASCII file in "binary" form)
			if (sInput.endsWith("\n")) {
				sInput = sInput.substr(0, sInput.length - 1); // remove last "\n" (TTT: also for data files?)
			}

			const oInFile = this.oInFile;

			oInFile.aFileData = sInput.split("\n");
		} else {
			this.closein();
		}
	}

	openin(sName: string): void {
		sName = this.vmAdaptFilename(sName, "OPENIN");

		const oInFile = this.oInFile;

		if (!oInFile.bOpen) {
			if (sName) {
				oInFile.bOpen = true;
				oInFile.sCommand = "openin";
				oInFile.sName = sName;
				oInFile.fnFileCallback = this.fnOpeninHandler;
				this.vmStop("fileLoad", 90);
			}
		} else {
			throw this.vmComposeError(Error(), 27, "OPENIN " + oInFile.sName); // file already open
		}
	}

	openout(sName: string): void {
		const oOutFile = this.oOutFile;

		if (oOutFile.bOpen) {
			throw this.vmComposeError(Error(), 27, "OPENOUT " + oOutFile.sName); // file already open
		}
		sName = this.vmAdaptFilename(sName, "OPENOUT");

		oOutFile.bOpen = true;
		oOutFile.sCommand = "openout";
		oOutFile.sName = sName;
		oOutFile.aFileData = []; // no data yet
		oOutFile.sType = "A"; // ASCII
	}

	// or

	origin(xOff: number, yOff: number, xLeft?: number, xRight?: number, yTop?: number, yBottom?: number): void { // parameters starting from xLeft are optional
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
	}

	vmSetRamSelect(iBank: number): void {
		// we support RAM select for banks 0,4... (so not for 1 to 3)
		if (!iBank) {
			this.iRamSelect = 0;
		} else if (iBank >= 4) {
			this.iRamSelect = iBank - 3; // bank 4 gets position 1
		}
	}

	vmSetCrtcData(iByte: number): void {
		const iCrtcReg = this.iCrtcReg,
			aCrtcData = this.aCrtcData;

		aCrtcData[iCrtcReg] = iByte;
		if (iCrtcReg === 12 || iCrtcReg === 13) { // screen offset changed
			const iOffset = (((aCrtcData[12] || 0) & 0x03) << 9) | ((aCrtcData[13] || 0) << 1); // eslint-disable-line no-bitwise

			this.vmSetScreenOffset(iOffset);
		}
	}

	out(iPort: number, iByte: number): void {
		iPort = this.vmInRangeRound(iPort, -32768, 65535, "OUT");
		if (iPort < 0) { // 2nd complement of 16 bit address?
			iPort += 65536;
		}
		iByte = this.vmInRangeRound(iByte, 0, 255, "OUT");

		const iPortHigh = iPort >> 8; // eslint-disable-line no-bitwise

		if (iPortHigh === 0x7f) { // 7Fxx = RAM select
			this.vmSetRamSelect(iByte - 0xc0);
		} else if (iPortHigh === 0xbc) { // limited support for CRTC 12, 13
			this.iCrtcReg = iByte % 14;
		} else if (iPortHigh === 0xbd) {
			this.vmSetCrtcData(iByte);
			this.aCrtcData[this.iCrtcReg] = iByte;
		} else if (Utils.debug > 0) {
			Utils.console.debug("OUT", Number(iPort).toString(16), iByte, ": unknown port");
		}
	}

	paper(iStream: number, iPaper: number): void {
		iStream = this.vmInRangeRound(iStream, 0, 7, "PAPER");
		iPaper = this.vmInRangeRound(iPaper, 0, 15, "PAPER");

		const oWin = this.aWindow[iStream];

		oWin.iPaper = iPaper;
	}

	vmGetCharDataByte(iAddr: number): number {
		const iDataPos = (iAddr - 1 - this.iMinCharHimem) % 8,
			iChar = this.iMinCustomChar + (iAddr - 1 - iDataPos - this.iMinCharHimem) / 8,
			aCharData = this.oCanvas.getCharData(iChar);

		return aCharData[iDataPos];
	}

	vmSetCharDataByte(iAddr: number, iByte: number): void {
		const iDataPos = (iAddr - 1 - this.iMinCharHimem) % 8,
			iChar = this.iMinCustomChar + (iAddr - 1 - iDataPos - this.iMinCharHimem) / 8,
			aCharData = Object.assign({}, this.oCanvas.getCharData(iChar)); // we need a copy to not modify original data

		aCharData[iDataPos] = iByte; // change one byte
		this.oCanvas.setCustomChar(iChar, aCharData);
	}

	peek(iAddr: number): number {
		iAddr = this.vmInRangeRound(iAddr, -32768, 65535, "PEEK");
		if (iAddr < 0) { // 2nd complement of 16 bit address
			iAddr += 65536;
		}
		// check two higher bits of 16 bit address to get 16K page
		const iPage = iAddr >> 14; // eslint-disable-line no-bitwise
		let iByte: number | null;

		if (iPage === this.iScreenPage) { // screen memory page?
			iByte = this.oCanvas.getByte(iAddr); // get byte from screen memory
			if (iByte === null) { // byte not visible on screen?
				iByte = this.aMem[iAddr] || 0; // get it from our memory
			}
		} else if (iPage === 1 && this.iRamSelect) { // memory mapped RAM with page 1=0x4000..0x7fff?
			iAddr = (this.iRamSelect - 1) * 0x4000 + 0x10000 + iAddr;
			iByte = this.aMem[iAddr] || 0;
		} else if (iAddr > this.iMinCharHimem && iAddr <= this.iMaxCharHimem) { // character map?
			iByte = this.vmGetCharDataByte(iAddr);
		} else {
			iByte = this.aMem[iAddr] || 0;
		}
		return iByte;
	}

	pen(iStream: number, iPen: number | undefined, iTransparent?: number): void {
		iStream = this.vmInRangeRound(iStream, 0, 7, "PEN");
		if (iPen !== undefined) {
			const oWin = this.aWindow[iStream];

			iPen = this.vmInRangeRound(iPen, 0, 15, "PEN");
			oWin.iPen = iPen;
		}

		if (iTransparent !== undefined) {
			iTransparent = this.vmInRangeRound(iTransparent, 0, 1, "PEN");
			this.vmSetTransparentMode(iStream, iTransparent);
		}
	}

	pi(): number { // eslint-disable-line class-methods-use-this
		return Math.PI; // or less precise: 3.14159265
	}

	plot(x: number, y: number, iGPen?: number, iGColMode?: number): void { // 2, up to 4 parameters
		x = this.vmInRangeRound(x, -32768, 32767, "PLOT");
		y = this.vmInRangeRound(y, -32768, 32767, "PLOT");
		this.vmDrawMovePlot("PLOT", iGPen, iGColMode);
		this.oCanvas.plot(x, y);
	}

	plotr(x: number, y: number, iGPen?: number, iGColMode?: number): void {
		x = this.vmInRangeRound(x, -32768, 32767, "PLOTR");
		y = this.vmInRangeRound(y, -32768, 32767, "PLOTR");
		this.vmDrawMovePlot("PLOTR", iGPen, iGColMode);
		this.oCanvas.plotr(x, y);
	}

	poke(iAddr: number, iByte: number): void {
		iAddr = this.vmInRangeRound(iAddr, -32768, 65535, "POKE address");
		if (iAddr < 0) { // 2nd complement of 16 bit address?
			iAddr += 65536;
		}
		iByte = this.vmInRangeRound(iByte, 0, 255, "POKE byte");

		// check two higher bits of 16 bit address to get 16K page
		const iPage = iAddr >> 14; // eslint-disable-line no-bitwise

		if (iPage === 1 && this.iRamSelect) { // memory mapped RAM with page 1=0x4000..0x7fff?
			iAddr = (this.iRamSelect - 1) * 0x4000 + 0x10000 + iAddr;
		} else if (iPage === this.iScreenPage) { // screen memory page?
			this.oCanvas.setByte(iAddr, iByte); // write byte also to screen memory
		} else if (iAddr > this.iMinCharHimem && iAddr <= this.iMaxCharHimem) { // character map?
			this.vmSetCharDataByte(iAddr, iByte);
		}
		this.aMem[iAddr] = iByte;
	}

	pos(iStream: number): number {
		iStream = this.vmInRangeRound(iStream, 0, 9, "POS");

		let iPos: number;

		if (iStream < 8) {
			iPos = this.vmGetAllowedPosOrVpos(iStream, false) + 1; // get allowed pos
		} else if (iStream === 8) { // printer position
			iPos = 1; // TODO
		} else { // stream 9: number of characters written since last CR (\r)
			iPos = 1; // TODO
		}
		return iPos;
	}

	private vmGetAllowedPosOrVpos(iStream: number, bVpos: boolean) {
		const oWin = this.aWindow[iStream],
			iLeft = oWin.iLeft,
			iRight = oWin.iRight,
			iTop = oWin.iTop,
			iBottom = oWin.iBottom;
		let x = oWin.iPos,
			y = oWin.iVpos;

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
	}

	private vmMoveCursor2AllowedPos(iStream: number) {
		const oWin = this.aWindow[iStream],
			iLeft = oWin.iLeft,
			iRight = oWin.iRight,
			iTop = oWin.iTop,
			iBottom = oWin.iBottom;
		let	x = oWin.iPos,
			y = oWin.iVpos;

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
	}

	private vmPrintChars(iStream: number, sStr: string) {
		const oWin = this.aWindow[iStream];

		if (!oWin.bTextEnabled) {
			if (Utils.debug > 0) {
				Utils.console.debug("vmPrintChars: text output disabled:", sStr);
			}
			return;
		}

		// put cursor in next line if string does not fit in line any more
		this.vmMoveCursor2AllowedPos(iStream);
		if (oWin.iPos && (oWin.iPos + sStr.length > (oWin.iRight + 1 - oWin.iLeft))) {
			oWin.iPos = 0;
			oWin.iVpos += 1; // "\r\n", newline if string does not fit in line
		}
		for (let i = 0; i < sStr.length; i += 1) {
			const iChar = CpcVm.vmGetCpcCharCode(sStr.charCodeAt(i));

			this.vmMoveCursor2AllowedPos(iStream);
			this.oCanvas.printChar(iChar, oWin.iPos + oWin.iLeft, oWin.iVpos + oWin.iTop, oWin.iPen, oWin.iPaper, oWin.bTransparent);
			oWin.iPos += 1;
		}
	}

	private vmControlSymbol(sPara: string) {
		const aPara: number[] = [];

		for (let i = 0; i < sPara.length; i += 1) {
			aPara.push(sPara.charCodeAt(i));
		}

		const iChar = aPara[0];

		if (iChar >= this.iMinCustomChar) {
			this.symbol.apply(this, aPara as [iChar: number, ...aArgs: number[]]);
		} else {
			Utils.console.log("vmControlSymbol: define SYMBOL ignored:", iChar);
		}
	}

	private vmControlWindow(sPara: string, iStream: number) {
		const aPara = [];

		// args in sPara: iLeft, iRight, iTop, iBottom (all -1 !)
		for (let i = 0; i < sPara.length; i += 1) {
			let iValue = sPara.charCodeAt(i) + 1; // control ranges start with 0!

			iValue %= 256;
			if (!iValue) {
				iValue = 1; // avoid error
			}
			aPara.push(iValue);
		}
		this.window(iStream, aPara[0], aPara[1], aPara[2], aPara[3]);
	}

	private vmHandleControlCode(iCode: number, sPara: string, iStream: number) { // eslint-disable-line complexity
		const oWin = this.aWindow[iStream],
			sOut = ""; // no controls for text window

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
			Utils.console.warn("vmHandleControlCode: Unknown control code:", iCode);
			break;
		}
		return sOut;
	}

	private vmPrintCharsOrControls(iStream: number, sStr: string) {
		let sBuf = "",
			sOut = "",
			i = 0;

		while (i < sStr.length) {
			const iCode = sStr.charCodeAt(i);

			i += 1;
			if (iCode <= 0x1f) { // control code?
				if (sOut !== "") {
					this.vmPrintChars(iStream, sOut); // print chars collected so far
					sOut = "";
				}
				const iParaCount = CpcVm.aControlCodeParameterCount[iCode];

				if (i + iParaCount <= sStr.length) {
					sOut += this.vmHandleControlCode(iCode, sStr.substr(i, iParaCount), iStream);
					i += iParaCount;
				} else {
					sBuf = sStr.substr(i - 1); // not enough parameters, put code in buffer and wait for more
					i = sStr.length;
				}
			} else {
				sOut += String.fromCharCode(iCode);
			}
		}
		if (sOut !== "") {
			this.vmPrintChars(iStream, sOut); // print chars collected so far
			sOut = "";
		}
		return sBuf;
	}

	private vmPrintGraphChars(sStr: string) {
		for (let i = 0; i < sStr.length; i += 1) {
			const iChar = CpcVm.vmGetCpcCharCode(sStr.charCodeAt(i));

			this.oCanvas.printGChar(iChar);
		}
	}

	print(iStream: number, ...aArgs: (string | number | PrintObjectType)[]): void { // eslint-disable-line complexity
		iStream = this.vmInRangeRound(iStream, 0, 9, "PRINT");
		const oWin = this.aWindow[iStream];

		if (iStream < 8) {
			if (!oWin.bTag) {
				this.vmDrawUndrawCursor(iStream); // undraw
			}
		} else if (iStream === 8) {
			this.vmNotImplemented("PRINT # " + iStream);
		} else if (iStream === 9) {
			if (!this.oOutFile.bOpen) {
				throw this.vmComposeError(Error(), 31, "PRINT #" + iStream); // File not open
			}
			this.oOutFile.iStream = iStream;
		}

		let sBuf = this.sPrintControlBuf;

		for (let i = 0; i < aArgs.length; i += 1) {
			const arg = aArgs[i];
			let sStr: string;

			if (typeof arg === "object") { // delayed call for spc(), tab(), commaTab() with side effect (position)
				const aSpecialArgs = arg.args;

				switch (arg.type) {
				case "commaTab":
					sStr = this.commaTab(iStream);
					break;
				case "spc":
					sStr = this.spc(iStream, aSpecialArgs[0] as number);
					break;
				case "tab":
					sStr = this.tab(iStream, aSpecialArgs[0] as number);
					break;
				default:
					throw this.vmComposeError(Error(), 5, "PRINT " + arg.type); // Improper argument TTT
				}
			} else if (typeof arg === "number") {
				sStr = ((arg >= 0) ? " " : "") + String(arg) + " ";
			} else { // e.g. string
				sStr = String(arg);
			}

			if (iStream < 8) {
				if (oWin.bTag) {
					this.vmPrintGraphChars(sStr);
				} else {
					if (sBuf.length) {
						sStr = sBuf + sStr;
					}
					sBuf = this.vmPrintCharsOrControls(iStream, sStr);
				}
				this.sOut += sStr; // console
			} else { // iStream === 9
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
				this.vmDrawUndrawCursor(iStream); // draw cursor
				this.sPrintControlBuf = sBuf; // maybe some parameters missing
			}
		} else if (iStream === 9) {
			this.oOutFile.aFileData.push(sBuf);
		}
	}

	rad(): void {
		this.bDeg = false;
	}

	// https://en.wikipedia.org/wiki/Jenkins_hash_function
	private static vmHashCode(s: string) {
		let iHash = 0;

		/* eslint-disable no-bitwise */
		for (let i = 0; i < s.length; i += 1) {
			iHash += s.charCodeAt(i);
			iHash += iHash << 10;
			iHash ^= iHash >> 6;
		}
		iHash += iHash << 3;
		iHash ^= iHash >> 11;
		iHash += iHash << 15;
		/* eslint-enable no-bitwise */
		return iHash;
	}

	private vmRandomizeCallback() {
		const oInput = this.vmGetStopObject().oParas as VmInputParas,
			sInput = oInput.sInput,
			value = CpcVm.vmVal(sInput); // convert to number (also binary, hex)
		let	bInputOk = true;

		Utils.console.log("vmRandomizeCallback:", sInput);
		if (isNaN(value)) {
			bInputOk = false;
			oInput.sInput = "";
			this.print(oInput.iStream, oInput.sMessage);
		} else {
			this.vmSetInputValues([value]);
		}
		return bInputOk;
	}

	randomize(n?: number): void {
		const iRndInit = 0x89656c07, // an arbitrary 32 bit number <> 0 (this one is used by the CPC)
			iStream = 0;

		if (n === undefined) { // no arguments? input...
			const sMsg = "Random number seed ? ";

			this.print(iStream, sMsg);
			const oInputParas: VmInputParas = {
				sCommand: "randomize",
				iStream: iStream,
				sMessage: sMsg,
				fnInputCallback: this.vmRandomizeCallback.bind(this),
				sInput: "",
				iLine: this.iLine // to repeat in case of break
			};

			this.vmStop("waitInput", 45, false, oInputParas);
		} else { // n can also be floating point, so compute a hash value of n
			this.vmAssertNumber(n, "RANDOMIZE");
			n = CpcVm.vmHashCode(String(n));
			if (n === 0) {
				n = iRndInit;
			}
			if (Utils.debug > 0) {
				Utils.console.debug("randomize:", n);
			}
			this.oRandom.init(n);
		}
	}

	read(sVarType: string): string | number {
		const sType = this.vmDetermineVarType(sVarType);
		let item: string | number;

		if (this.iData < this.aData.length) {
			const dataItem = this.aData[this.iData];

			this.iData += 1;
			if (dataItem === undefined) { // empty arg?
				item = sType === "$" ? "" : 0; // set arg depending on expected type
			} else if (sType !== "$") { // not string expected? => convert to number (also binary, hex)
				// Note : Using a number variable to read a string would cause a syntax error on a real CPC. We cannot detect it since we get always strings.
				item = this.val(String(dataItem));
			} else {
				item = dataItem;
			}
			item = this.vmAssign(sVarType, item); // maybe rounding for type I
		} else {
			throw this.vmComposeError(Error(), 4, "READ"); // DATA exhausted
		}
		return item;
	}

	release(iChannelMask: number): void {
		iChannelMask = this.vmInRangeRound(iChannelMask, 0, 7, "RELEASE");
		this.oSound.release(iChannelMask);
	}

	// rem

	remain(iTimer: number): number {
		iTimer = this.vmInRangeRound(iTimer, 0, 3, "REMAIN");

		const oTimer = this.aTimer[iTimer];
		let iRemain = 0;

		if (oTimer.bActive) {
			iRemain = oTimer.iNextTimeMs - Date.now();
			iRemain /= CpcVm.iFrameTimeMs;
			oTimer.bActive = false; // switch off timer
		}
		return iRemain;
	}

	renum(iNew = 10, iOld = 1, iStep = 10, iKeep = 65535): void { // varargs: new number, old number, step, keep line (only for |renum)
		iNew = this.vmInRangeRound(iNew, 1, 65535, "RENUM");
		iOld = this.vmInRangeRound(iOld, 1, 65535, "RENUM");
		iStep = this.vmInRangeRound(iStep, 1, 65535, "RENUM");
		iKeep = this.vmInRangeRound(iKeep, 1, 65535, "RENUM");

		const oLineRenumParas: VmLineRenumParas = {
			sCommand: "renum",
			iStream: 0, // unused
			iLine: this.iLine, // unused
			iNew: iNew,
			iOld: iOld,
			iStep: iStep,
			iKeep: iKeep // keep lines
		};

		this.vmStop("renumLines", 85, false, oLineRenumParas);
	}

	restore(iLine?: number): void {
		iLine = iLine || 0;
		const oDataLineIndex = this.oDataLineIndex;
		// sLine = String(iLine);

		if (iLine in oDataLineIndex) {
			this.iData = oDataLineIndex[iLine];
		} else {
			Utils.console.log("restore: search for dataLine >", iLine);
			for (const sDataLine in oDataLineIndex) { // linear search a data line > line
				if (oDataLineIndex.hasOwnProperty(sDataLine)) {
					if (Number(sDataLine) >= iLine) {
						oDataLineIndex[iLine] = oDataLineIndex[sDataLine]; // set data index also for iLine
						break;
					}
				}
			}
			if (iLine in oDataLineIndex) { // now found a data line?
				this.iData = oDataLineIndex[iLine];
			} else {
				Utils.console.warn("restore", iLine + ": No DATA found starting at line");
				this.iData = this.aData.length;
			}
		}
	}

	resume(iLine: number): void { // resume, resume n
		if (this.iErrorGotoLine) {
			if (iLine === undefined) {
				iLine = this.iErrorResumeLine;
			}
			this.vmGotoLine(iLine, "resume");
			this.iErrorResumeLine = 0;
		} else {
			throw this.vmComposeError(Error(), 20, String(iLine)); // Unexpected RESUME
		}
	}

	resumeNext(): void {
		if (!this.iErrorGotoLine) {
			throw this.vmComposeError(Error(), 20, "RESUME NEXT"); // Unexpected RESUME
		}
		this.vmNotImplemented("RESUME NEXT");
	}

	"return"(): void {
		const iLine = this.aGosubStack.pop();

		if (iLine === undefined) {
			throw this.vmComposeError(Error(), 3, ""); // Unexpected Return [in <line>]
		} else {
			this.vmGotoLine(iLine, "return");
		}
		if (iLine === this.iBreakResumeLine) { // end of break handler?
			this.iBreakResumeLine = 0; // can start another one
		}
		this.vmCheckTimerHandlers(); // if we are at end of a BASIC timer handler, delete handler flag
		if (this.vmCheckSqTimerHandlers()) { // same for sq timers, timer reloaded?
			this.fnCheckSqTimer(); // next one early
		}
	}

	right$(s: string, iLen: number): string {
		this.vmAssertString(s, "RIGHT$");
		iLen = this.vmInRangeRound(iLen, 0, 255, "RIGHT$");
		return s.slice(-iLen);
	}

	rnd(n: number): number {
		if (n !== undefined) {
			this.vmAssertNumber(n, "RND");
		}

		let x: number;

		if (n < 0) {
			x = this.lastRnd || this.oRandom.random();
		} else if (n === 0) {
			x = this.lastRnd || this.oRandom.random();
		} else { // >0 or undefined
			x = this.oRandom.random();
			this.lastRnd = x;
		}
		return x;
	}

	round(n: number, iDecimals?: number): number {
		this.vmAssertNumber(n, "ROUND");
		iDecimals = this.vmInRangeRound(iDecimals || 0, -39, 39, "ROUND");

		// To avoid rounding errors: https://www.jacklmoore.com/notes/rounding-in-javascript
		return Number(Math.round(Number(n + "e" + iDecimals)) + "e" + ((iDecimals >= 0) ? "-" + iDecimals : "+" + -iDecimals));
	}

	private vmRunCallback(sInput: string, oMeta: FileMeta) {
		const oInFile = this.oInFile,
			bPutInMemory = sInput !== null && oMeta && (oMeta.sType === "B" || oInFile.iStart !== undefined);

		// TODO: we could put it in memory as we do it for LOAD

		if (sInput !== null) {
			const oLineParas: VmLineParas = {
				sCommand: "run",
				iStream: 0, // unused
				iFirst: oInFile.iLine,
				iLast: 0, // unused
				iLine: this.iLine
			};

			this.vmStop("run", 95, false, oLineParas);
		}
		this.closein();
		return bPutInMemory;
	}

	run(numOrString?: number | string): void {
		const oInFile = this.oInFile;

		if (typeof numOrString === "string") { // filename?
			const sName = this.vmAdaptFilename(numOrString, "RUN");

			this.closein();
			oInFile.bOpen = true;
			oInFile.sCommand = "run";
			oInFile.sName = sName;
			oInFile.fnFileCallback = this.fnRunHandler;
			this.vmStop("fileLoad", 90);
		} else { // line number or no argument = undefined
			const oLineParas: VmLineParas = {
				sCommand: "run",
				iStream: 0, // unused
				iFirst: numOrString || 0,
				iLast: 0, // unused
				iLine: this.iLine
			};

			this.vmStop("run", 95, false, oLineParas);
		}
	}

	save(sName: string, sType?: string, iStart?: number, iLength?: number, iEntry?: number): void { // varargs; parameter sType,... are optional
		const oOutFile = this.oOutFile;

		sName = this.vmAdaptFilename(sName, "SAVE");
		if (!sType) {
			sType = "T"; // default is tokenized BASIC
		} else {
			sType = String(sType).toUpperCase();
		}

		const aFileData: string[] = [];

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
			for (let i = 0; i < iLength; i += 1) {
				const iAddress = (iStart + i) & 0xffff; // eslint-disable-line no-bitwise

				aFileData[i] = String.fromCharCode(this.peek(iAddress));
			}
		} else if ((sType === "A" || sType === "T" || sType === "P") && iStart === undefined) {
			// ASCII or tokenized BASIC or protected BASIC, and no load address specified
			iStart = 368; // BASIC start
			// need file data from controller (text box)
		} else {
			throw this.vmComposeError(Error(), 2, "SAVE " + sType); // Syntax Error
		}

		oOutFile.bOpen = true;
		oOutFile.sCommand = "save";
		oOutFile.sName = sName;

		oOutFile.sType = sType;
		oOutFile.iStart = iStart;
		oOutFile.iLength = iLength || 0;
		oOutFile.iEntry = iEntry || 0;

		oOutFile.aFileData = aFileData;
		oOutFile.fnFileCallback = this.fnCloseoutHandler; // we use closeout handler to reset out file handling

		this.vmStop("fileSave", 90); // must stop directly after save
	}

	sgn(n: number): number {
		this.vmAssertNumber(n, "SGN");
		return Math.sign(n);
	}

	sin(n: number): number {
		this.vmAssertNumber(n, "SIN");
		return Math.sin((this.bDeg) ? Utils.toRadians(n) : n);
	}

	sound(iState: number, iPeriod: number, iDuration?: number, iVolume?: number, iVolEnv?: number, iToneEnv?: number, iNoise?: number): void {
		iState = this.vmInRangeRound(iState, 1, 255, "SOUND");
		iPeriod = this.vmInRangeRound(iPeriod, 0, 4095, "SOUND ,");

		const oSoundData: SoundData = {
			iState: iState,
			iPeriod: iPeriod,
			iDuration: (iDuration !== undefined) ? this.vmInRangeRound(iDuration, -32768, 32767, "SOUND ,,") : 20,
			iVolume: (iVolume !== undefined) ? this.vmInRangeRound(iVolume, 0, 15, "SOUND ,,,") : 12,
			iVolEnv: (iVolEnv !== undefined) ? this.vmInRangeRound(iVolEnv, 0, 15, "SOUND ,,,,") : 0,
			iToneEnv: (iToneEnv !== undefined) ? this.vmInRangeRound(iToneEnv, 0, 15, "SOUND ,,,,,") : 0,
			iNoise: (iNoise !== undefined) ? this.vmInRangeRound(iNoise, 0, 31, "SOUND ,,,,,,") : 0
		};

		if (this.oSound.testCanQueue(iState)) {
			this.oSound.sound(oSoundData);
		} else {
			this.aSoundData.push(oSoundData);
			this.vmStop("waitSound", 43);
			for (let i = 0; i < 3; i += 1) {
				if (iState & (1 << i)) { // eslint-disable-line no-bitwise
					const oSqTimer = this.aSqTimer[i];

					oSqTimer.bActive = false; // set onSq timer to inactive
				}
			}
		}
	}

	space$(n: number): string {
		n = this.vmInRangeRound(n, 0, 255, "SPACE$");
		return " ".repeat(n);
	}

	spc(iStream: number, n: number): string { // special spc function with additional parameter iStream, which is called delayed by print (ROM &F277)
		iStream = this.vmInRangeRound(iStream, 0, 9, "SPC");
		n = this.vmInRangeRound(n, -32768, 32767, "SPC");

		let sStr = "";

		if (n >= 0) {
			const oWin = this.aWindow[iStream],
				iWidth = oWin.iRight - oWin.iLeft + 1;

			if (iWidth) {
				n %= iWidth;
			}
			sStr = " ".repeat(n);
		} else {
			Utils.console.log("SPC: negative number ignored:", n);
		}
		return sStr;
	}

	speedInk(iTime1: number, iTime2: number): void { // default: 10,10
		iTime1 = this.vmInRangeRound(iTime1, 1, 255, "SPEED INK");
		iTime2 = this.vmInRangeRound(iTime2, 1, 255, "SPEED INK");
		this.oCanvas.setSpeedInk(iTime1, iTime2);
	}

	speedKey(iDelay: number, iRepeat: number): void {
		iDelay = this.vmInRangeRound(iDelay, 1, 255, "SPEED KEY");
		iRepeat = this.vmInRangeRound(iRepeat, 1, 255, "SPEED KEY");
		this.vmNotImplemented("SPEED KEY " + iDelay + " " + iRepeat);
	}

	speedWrite(n: number): void {
		n = this.vmInRangeRound(n, 0, 1, "SPEED WRITE");
		this.vmNotImplemented("SPEED WRITE " + n);
	}

	sq(iChannel: number): number {
		iChannel = this.vmInRangeRound(iChannel, 1, 4, "SQ");
		if (iChannel === 3) {
			throw this.vmComposeError(Error(), 5, "ON SQ GOSUB " + iChannel); // Improper argument
		}
		iChannel = CpcVm.fnChannel2ChannelIndex(iChannel);
		const iSq = this.oSound.sq(iChannel),
			oSqTimer = this.aSqTimer[iChannel];

		// no space in queue and handler active?
		if (!(iSq & 0x07) && oSqTimer.bActive) { // eslint-disable-line no-bitwise
			oSqTimer.bActive = false; // set onSq timer to inactive
		}
		return iSq;
	}

	sqr(n: number): number {
		this.vmAssertNumber(n, "SQR");
		return Math.sqrt(n);
	}

	// step

	stop(sLabel: string): void {
		this.vmGotoLine(sLabel, "stop");
		this.vmStop("stop", 60);
	}

	str$(n: number): string { // number (also hex or binary)
		this.vmAssertNumber(n, "STR$");
		const sStr = ((n >= 0) ? " " : "") + String(n);

		return sStr;
	}

	string$(iLen: number, chr: number | string): string {
		iLen = this.vmInRangeRound(iLen, 0, 255, "STRING$");
		if (typeof chr === "number") {
			chr = this.vmInRangeRound(chr, 0, 255, "STRING$");
			chr = String.fromCharCode(chr); // chr$
		} else { // string
			chr = chr.charAt(0); // only one char
		}
		return chr.repeat(iLen);
	}

	// swap (window swap)

	symbol(iChar: number, ...aArgs: number[]): void { // varargs  (iChar, rows 1..8)
		const aCharData: number[] = [];

		iChar = this.vmInRangeRound(iChar, this.iMinCustomChar, 255, "SYMBOL");
		for (let i = 0; i < aArgs.length; i += 1) { // start with 1, get available args
			const iBitMask = this.vmInRangeRound(aArgs[i], 0, 255, "SYMBOL");

			aCharData.push(iBitMask);
		}
		// Note: If there are less than 8 rows, the others are assumed as 0 (actually empty)
		this.oCanvas.setCustomChar(iChar, aCharData);
	}

	symbolAfter(iChar: number): void {
		iChar = this.vmInRangeRound(iChar, 0, 256, "SYMBOL AFTER");

		if (this.iMinCustomChar < 256) { // symbol after <256 set?
			if (this.iMinCharHimem !== this.iHimem) { // himem changed?
				throw this.vmComposeError(Error(), 5, "SYMBOL AFTER " + iChar); // Improper argument
			}
		} else {
			this.iMaxCharHimem = this.iHimem; // no characters defined => use current himem
		}

		let iMinCharHimem = this.iMaxCharHimem - (256 - iChar) * 8;

		if (iMinCharHimem < CpcVm.iMinHimem) {
			throw this.vmComposeError(Error(), 7, "SYMBOL AFTER " + iMinCharHimem); // Memory full
		}
		this.iHimem = iMinCharHimem;

		this.oCanvas.resetCustomChars();
		if (iChar === 256) { // maybe move up again
			iMinCharHimem = CpcVm.iMaxHimem;
			this.iMaxCharHimem = iMinCharHimem;
		}
		// TODO: Copy char data to screen memory, if screen starts at 0x4000 and chardata is in that range (and ram 0 is selected)
		this.iMinCustomChar = iChar;
		this.iMinCharHimem = iMinCharHimem;
	}

	tab(iStream: number, n: number): string { // special tab function with additional parameter iStream, which is called delayed by print (ROM &F280)
		iStream = this.vmInRangeRound(iStream, 0, 9, "TAB");
		n = this.vmInRangeRound(n, -32768, 32767, "TAB");

		const oWin = this.aWindow[iStream],
			iWidth = oWin.iRight - oWin.iLeft + 1;
		let	sStr = "";

		if (n > 0) {
			n -= 1;
			if (iWidth) {
				n %= iWidth;
			}

			let iCount = n - oWin.iPos;

			if (iCount < 0) { // does it fit until tab position?
				oWin.iPos = oWin.iRight + 1;
				this.vmMoveCursor2AllowedPos(iStream);
				iCount = n; // set tab in next line
			}
			sStr = " ".repeat(iCount);
		} else {
			Utils.console.log("TAB: no tab for value", n);
		}
		return sStr;
	}

	tag(iStream: number): void {
		iStream = this.vmInRangeRound(iStream, 0, 7, "TAG");
		const oWin = this.aWindow[iStream];

		oWin.bTag = true;
	}

	tagoff(iStream: number): void {
		iStream = this.vmInRangeRound(iStream, 0, 7, "TAGOFF");
		const oWin = this.aWindow[iStream];

		oWin.bTag = false;
	}

	tan(n: number): number {
		this.vmAssertNumber(n, "TAN");
		return Math.tan((this.bDeg) ? Utils.toRadians(n) : n);
	}

	test(x: number, y: number): number {
		x = this.vmInRangeRound(x, -32768, 32767, "TEST");
		y = this.vmInRangeRound(y, -32768, 32767, "TEST");
		return this.oCanvas.test(x, y);
	}

	testr(x: number, y: number): number {
		x = this.vmInRangeRound(x, -32768, 32767, "TESTR");
		y = this.vmInRangeRound(y, -32768, 32767, "TESTR");
		return this.oCanvas.testr(x, y);
	}

	time(): number {
		return ((Date.now() - this.iStartTime) * 300 / 1000) | 0; // eslint-disable-line no-bitwise
	}

	troff(): void {
		this.bTron = false;
	}

	tron(): void {
		this.bTron = true;
	}

	unt(n: number): number {
		n = this.vmInRangeRound(n, -32768, 65535, "UNT");
		if (n > 32767) {
			n -= 65536;
		}
		return n;
	}

	private static fnUpperCase(sMatch: string) {
		return sMatch.toUpperCase();
	}

	upper$(s: string): string {
		this.vmAssertString(s, "UPPER$");

		s = s.replace(/[a-z]/g, CpcVm.fnUpperCase); // replace only characters a-z
		return s;
	}

	using(sFormat: string, ...aArgs: (string | number)[]): string { // varargs
		const reFormat = /(!|&|\\ *\\|(?:\*\*|\$\$|\*\*\$)?\+?(?:#|,)+\.?#*(?:\^\^\^\^)?[+-]?)/g,
			aFormat: string[] = [];

		this.vmAssertString(sFormat, "USING");

		// We simulate sFormat.split(reFormat) here since it does not work with IE8
		let iIndex = 0,
			oMatch: RegExpExecArray | null;

		while ((oMatch = reFormat.exec(sFormat)) !== null) {
			aFormat.push(sFormat.substring(iIndex, oMatch.index)); // non-format characters at the beginning
			aFormat.push(oMatch[0]);
			iIndex = oMatch.index + oMatch[0].length;
		}
		if (iIndex < sFormat.length) { // non-format characters at the end
			aFormat.push(sFormat.substr(iIndex));
		}

		if (aFormat.length < 2) {
			Utils.console.warn("USING: empty or invalid format:", sFormat);
			throw this.vmComposeError(Error(), 5, "USING format " + sFormat); // Improper argument
		}

		let iFormat = 0,
			s = "";

		for (let i = 0; i < aArgs.length; i += 1) { // start with 1
			iFormat %= aFormat.length;
			if (iFormat === 0) {
				s += aFormat[iFormat]; // non-format characters at the beginning of the format string
				iFormat += 1;
			}
			if (iFormat < aFormat.length) {
				const arg = aArgs[i];

				s += this.vmUsingFormat1(aFormat[iFormat], arg); // format characters
				iFormat += 1;
			}
			if (iFormat < aFormat.length) {
				s += aFormat[iFormat]; // following non-format characters
				iFormat += 1;
			}
		}
		return s;
	}

	private static vmVal(s: string) {
		let iNum = 0;

		s = s.trim().toLowerCase();
		if (s.startsWith("&x")) { // binary &x
			s = s.slice(2);
			iNum = parseInt(s, 2);
		} else if (s.startsWith("&h")) { // hex &h
			s = s.slice(2);
			iNum = parseInt(s, 16);
		} else if (s.startsWith("&")) { // hex &
			s = s.slice(1);
			iNum = parseInt(s, 16);
		} else if (s !== "") { // not empty string?
			iNum = parseFloat(s);
		}
		return iNum;
	}

	val(s: string): number {
		this.vmAssertString(s, "VAL");
		let iNum = CpcVm.vmVal(s);

		if (isNaN(iNum)) {
			iNum = 0;
		}
		return iNum;
	}

	vpos(iStream: number): number {
		iStream = this.vmInRangeRound(iStream, 0, 7, "VPOS");

		const iVpos = this.vmGetAllowedPosOrVpos(iStream, true) + 1; // get allowed vpos

		return iVpos;
	}

	wait(iPort: number, iMask: number, iInv?: number): void { // optional iInv
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
		} else if (iPort === 0) {
			debugger; // Testing
		}
	}

	// wend

	// while

	width(iWidth: number): void {
		iWidth = this.vmInRangeRound(iWidth, 1, 255, "WIDTH");

		const oWin = this.aWindow[8];

		oWin.iRight = oWin.iLeft + iWidth;
	}

	window(iStream: number, iLeft: number, iRight: number, iTop: number, iBottom: number): void {
		iStream = this.vmInRangeRound(iStream, 0, 7, "WINDOW");

		iLeft = this.vmInRangeRound(iLeft, 1, 255, "WINDOW");
		iRight = this.vmInRangeRound(iRight, 1, 255, "WINDOW");
		iTop = this.vmInRangeRound(iTop, 1, 255, "WINDOW");
		iBottom = this.vmInRangeRound(iBottom, 1, 255, "WINDOW");

		const oWin = this.aWindow[iStream];

		oWin.iLeft = Math.min(iLeft, iRight) - 1;
		oWin.iRight = Math.max(iLeft, iRight) - 1;
		oWin.iTop = Math.min(iTop, iBottom) - 1;
		oWin.iBottom = Math.max(iTop, iBottom) - 1;

		oWin.iPos = 0;
		oWin.iVpos = 0;
	}

	windowSwap(iStream1: number, iStream2?: number): void { // stream numbers; iStream2 is optional
		iStream1 = this.vmInRangeRound(iStream1, 0, 7, "WINDOW SWAP");
		iStream2 = this.vmInRangeRound(iStream2 || 0, 0, 7, "WINDOW SWAP");

		const oTemp = this.aWindow[iStream1];

		this.aWindow[iStream1] = this.aWindow[iStream2];
		this.aWindow[iStream2] = oTemp;
	}

	write(iStream: number, ...aArgs: (string | number)[]): void { // varargs
		iStream = this.vmInRangeRound(iStream, 0, 9, "WRITE");

		const aWriteArgs = [];
		let sStr: string;

		for (let i = 0; i < aArgs.length; i += 1) {
			const arg = aArgs[i];

			if (typeof arg === "number") {
				sStr = String(arg);
			} else {
				sStr = '"' + String(arg) + '"';
			}
			aWriteArgs.push(sStr);
		}
		sStr = aWriteArgs.join(",");

		if (iStream < 8) {
			const oWin = this.aWindow[iStream];

			if (oWin.bTag) {
				this.vmPrintGraphChars(sStr + "\r\n");
			} else {
				this.vmDrawUndrawCursor(iStream); // undraw
				this.vmPrintChars(iStream, sStr);
				this.vmPrintCharsOrControls(iStream, "\r\n");
				this.vmDrawUndrawCursor(iStream); // draw
			}
			this.sOut += sStr + "\n"; // console
		} else if (iStream === 8) {
			this.vmNotImplemented("WRITE #" + iStream);
		} else if (iStream === 9) {
			this.oOutFile.iStream = iStream;
			if (!this.oOutFile.bOpen) {
				throw this.vmComposeError(Error(), 31, "WRITE #" + iStream); // File not open
			}
			this.oOutFile.aFileData.push(sStr + "\n"); // real CPC would use CRLF, we use LF
			// currently we print data also to console...
		}
	}

	xpos(): number {
		return this.oCanvas.getXpos();
	}

	ypos(): number {
		return this.oCanvas.getYpos();
	}

	zone(n: number): void {
		n = this.vmInRangeRound(n, 1, 255, "ZONE");
		this.iZone = n;
	}
}
