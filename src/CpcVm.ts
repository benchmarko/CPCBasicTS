// CpcVm.ts - CPC Virtual Machine
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//

import { Utils, CustomError } from "./Utils";
import { Keyboard, CpcKeyExpansionsOptions } from "./Keyboard";
import { Random } from "./Random";
import { Sound, SoundData, ToneEnvData, VolEnvData } from "./Sound";
import { Canvas } from "./Canvas";
import { TextCanvas } from "./TextCanvas";
import { Variables, VariableMap } from "./Variables";
import { ICpcVmRsx } from "./Interfaces";

export interface CpcVmOptions {
	canvas: Canvas
	textCanvas: TextCanvas
	keyboard: Keyboard
	sound: Sound
	variables: Variables
	quiet?: boolean
}

export interface FileMeta {
	typeString: string
	start?: number
	length?: number
	entry?: number
	encoding?: string
}

interface FileBase {
	open: boolean
	command: string
	name: string
	line: number
	start: (number | undefined)
	fileData: string[]
	fnFileCallback: ((...args: any[]) => void | boolean) | undefined
}

interface InFile extends FileBase {
	first: number
	last: number
	memorizedExample: string
}
interface OutFile extends FileBase {
	stream: number
	typeString: string
	length: number
	entry: number
}

interface WindowDimensions {
	left: number,
	right: number,
	top: number,
	bottom: number
}

interface WindowData extends WindowDimensions {
	pos: number // current (hotizontal) text position on screen
	vpos: number // current vertical text position on screen
	textEnabled: boolean // text enabled
	tag: boolean // tag=text at graphics
	transparent: boolean // transparent mode
	cursorOn: boolean // system switch
	cursorEnabled: boolean // user switch

	pen: number
	paper: number
}

interface TimerEntry {
	active: boolean
	line: number
	repeat: boolean
	intervalMs: number
	nextTimeMs: number

	handlerRunning: boolean
	stackIndexReturn: number
	savedPriority: number
}

export interface VmBaseParas {
	command: string
	stream: number
	line: string | number
}

export interface VmLineParas extends VmBaseParas { // delete lines, list lines, edit line, run line
	first: number
	last: number
}

export interface VmLineRenumParas extends VmBaseParas { // renum lines
	newLine: number
	oldLine: number
	step: number
	keep: number
}

export interface VmFileParas extends VmBaseParas {
	fileMask: string // CAT, |DIR, |ERA
	newName?: string // |REN
	oldName?: string // |REN
}

export interface VmInputParas extends VmBaseParas {
	input: string
	message: string
	noCRLF?: string
	types?: string[]
	fnInputCallback: () => boolean
}

export type VmStopParas = VmFileParas | VmInputParas | VmLineParas | VmLineRenumParas

export interface VmStopEntry {
	reason: string // stop reason
	priority: number // stop priority (higher number means higher priority which can overwrite lower priority)
	paras: VmStopParas
}

type PrintObjectType = {type: string, args: (string | number)[]};

type DataEntryType = (string | undefined);
export class CpcVm {
	private quiet = false;
	private readonly fnOpeninHandler: FileBase["fnFileCallback"]; // = undefined;
	private readonly fnCloseinHandler: () => void;
	private readonly fnCloseoutHandler: () => void;
	fnLoadHandler: (input: string, meta: FileMeta) => boolean;
	private readonly fnRunHandler: (input: string, meta: FileMeta) => boolean;

	private readonly canvas: Canvas;
	private readonly textCanvas: TextCanvas;
	private readonly keyboard: Keyboard;
	private readonly soundClass: Sound;
	readonly variables: Variables;

	private readonly random: Random;

	private readonly stopEntry: VmStopEntry;

	private inputValues: (string | number)[]; // values to input into script
	private readonly inFile: InFile; // file handling
	private readonly outFile: OutFile; // file handling

	private inkeyTimeMs = 0; // next time of frame fly (if >0, next time when inkey$ can be checked without inserting "waitFrame")

	private readonly gosubStack: (number | string)[] = []; // stack of line numbers for gosub/return

	private readonly maxGosubStackLength = 83; // maximum nesting of GOSUB on a real CPC

	private readonly mem: number[]; // for peek, poke

	private readonly dataList: DataEntryType[]; // array for BASIC data lines (continuous)
	private dataIndex = 0; // current index
	private dataLineIndex: Record<number, number> = { // line number index for the data line buffer
		0: 0 // for line 0: index 0
	};

	private readonly labelList: (string|number)[]; // for resume next
	private sourceMap: Record<string, number[]> = {};

	private readonly windowDataList: WindowData[]; // window data for window 0..7,8,9

	private readonly timerList: TimerEntry[]; // BASIC timer 0..3 (3 has highest priority)
	private readonly sqTimer: TimerEntry[]; // Sound queue timer 0..2

	private readonly soundData: SoundData[];

	private readonly crtcData: number[];
	private crtcReg = 0;

	private printControlBuf = "";

	private startTime = 0;
	private lastRnd = 0; // last random number

	private nextFrameTime = 0;
	private stopCount = 0;

	line: string | number = 0;
	private startLine = 0;

	private errorGotoLine = 0;
	private errorResumeLine = 0;
	private breakGosubLine = 0;
	private breakResumeLine = 0;

	outBuffer = "";

	private errorCode = 0; // last error code (Err)
	private errorLine: string | number = 0; // line of last error (Erl)

	private degFlag = false; // degree or radians

	private tronFlag1 = false; // trace flag

	private traceLabel = "";

	private ramSelect = 0;

	private screenPage = 3; // 16K screen page, 3=0xc000..0xffff

	private minCharHimem = CpcVm.maxHimem;
	private maxCharHimem = CpcVm.maxHimem;
	private himemValue = CpcVm.maxHimem;
	private minCustomChar = 256;

	private timerPriority = -1; // priority of running task: -1=low (min priority to start new timers)

	private zoneValue = 13; // print tab zone value

	private modeValue = -1;

	rsx?: ICpcVmRsx; // called from scripts

	private static readonly frameTimeMs = 1000 / 50; // 50 Hz => 20 ms
	private static readonly timerCount = 4; // number of timers
	private static readonly sqTimerCount = 3; // sound queue timers
	private static readonly streamCount = 10; // 0..7 window, 8 printer, 9 cassette
	private static readonly minHimem = 370;
	private static readonly maxHimem = 42747; // high memory limit (42747 after symbol after 256)

	private static readonly emptyParas = {};

	private static readonly winData = [ // window data for mode mode 0,1,2,3 (we are counting from 0 here)
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
			left: 0, // mode 3 not available on CPC
			right: 79,
			top: 0,
			bottom: 49
		}
	];

	private static readonly utf8ToCpc: Record<number, number> = { // needed for UTF-8 character data in openin / input#9
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

	private static readonly controlCodeParameterCount = [
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

	private static readonly errors = [ // BASIC error numbers
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

	private static readonly stopPriority: Record<string, number> = {
		"": 0, // nothing
		direct: 0, // direct input mode
		timer: 20, // timer expired
		waitFrame: 40, // FRAME command: wait for frame fly
		waitKey: 41, // wait for key (higher priority that waitFrame)
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

		this.canvas = options.canvas;
		this.textCanvas = options.textCanvas;
		this.keyboard = options.keyboard;
		this.soundClass = options.sound;
		this.variables = options.variables;
		this.quiet = Boolean(options.quiet);

		this.random = new Random();

		this.stopEntry = {
			reason: "", // stop reason
			priority: 0, // stop priority (higher number means higher priority which can overwrite lower priority)
			paras: {} as VmStopParas
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

		this.labelList = [];

		this.windowDataList = []; // window data for window 0..7,8,9
		for (let i = 0; i < CpcVm.streamCount; i += 1) {
			this.windowDataList[i] = {} as WindowData;
		}

		this.timerList = []; // BASIC timer 0..3 (3 has highest priority)
		for (let i = 0; i < CpcVm.timerCount; i += 1) {
			this.timerList[i] = {} as TimerEntry;
		}

		this.soundData = [];

		this.sqTimer = []; // Sound queue timer 0..2
		for (let i = 0; i < CpcVm.sqTimerCount; i += 1) {
			this.sqTimer[i] = {} as TimerEntry;
		}

		this.crtcData = [];
	}

	vmSetRsxClass(rsx: ICpcVmRsx): void {
		this.rsx = rsx; // this.rsx just used in the script
	}

	vmReset(): void {
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

		this.tronFlag1 = false;
		this.traceLabel = "";

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

		this.defreal("a", "z"); // init vartypes

		this.modeValue = -1;
		this.vmResetWindowData(true); // reset all, including pen and paper
		this.width(132); // set default printer width

		this.mode(1); // including vmResetWindowData() without pen and paper

		this.canvas.reset();
		this.textCanvas.reset();

		this.keyboard.reset();

		this.soundClass.reset();
		this.soundData.length = 0;

		this.inkeyTimeMs = 0; // if >0, next time when inkey$ can be checked without inserting "waitFrame"
	}

	vmResetTimers(): void {
		const data = {
				line: 0, // gosub line when timer expires
				repeat: false, // flag if timer is repeating (every) or one time (after)
				intervalMs: 0, // interval or timeout
				active: false, // flag if timer is active
				nextTimeMs: 0, // next expiration time
				handlerRunning: false, // flag if handler (subroutine) is running
				stackIndexReturn: 0, // index in gosub stack with return, if handler is running
				savedPriority: 0 // priority befora calling the handler
			},
			timer = this.timerList,
			sqTimer = this.sqTimer;

		for (let i = 0; i < CpcVm.timerCount; i += 1) {
			Object.assign(timer[i], data);
		}

		// sound queue timer
		for (let i = 0; i < CpcVm.sqTimerCount; i += 1) {
			Object.assign(sqTimer[i], data);
		}
	}

	vmResetWindowData(resetPenPaper: boolean): void {
		const winData = CpcVm.winData[this.modeValue],
			data = {
				pos: 0, // current text position in line
				vpos: 0,
				textEnabled: true, // text enabled
				tag: false, // tag=text at graphics
				transparent: false, // transparent mode
				cursorOn: false, // system switch
				cursorEnabled: true // user switch
			},
			penPaperData = {
				pen: 1,
				paper: 0
			},
			printData = {
				pos: 0,
				vpos: 0,
				right: 132 // override
			},
			cassetteData = {
				pos: 0,
				vpos: 0,
				right: 255 // override
			};

		if (resetPenPaper) {
			Object.assign(data, penPaperData);
		}

		for (let i = 0; i < this.windowDataList.length - 2; i += 1) { // for window streams
			Object.assign(this.windowDataList[i], winData, data);
		}
		Object.assign(this.windowDataList[8], winData, printData); // printer
		Object.assign(this.windowDataList[9], winData, cassetteData); // cassette
	}

	vmResetControlBuffer(): void {
		this.printControlBuf = ""; // collected control characters for PRINT
	}

	static vmResetFileHandling(file: FileBase): void {
		file.open = false;
		file.command = ""; // to be sure
	}

	vmResetData(): void {
		this.dataList.length = 0; // array for BASIC data lines (continuous)
		this.dataIndex = 0; // current index
		this.dataLineIndex = { // line number index for the data line buffer
			0: 0 // for line 0: index 0
		};
	}

	private vmResetInks() {
		this.canvas.setDefaultInks();
		this.canvas.setSpeedInk(10, 10);
	}

	vmReset4Run(): void {
		const stream = 0;

		this.vmResetInks();
		this.clearInput();
		this.closein();
		this.closeout();
		this.cursor(stream, 0);
		this.traceLabel = ""; // last trace line
		this.labelList.length = 0;
	}

	vmGetAllVariables(): VariableMap { // also called from JS script
		return this.variables.getAllVariables();
	}

	vmSetStartLine(line: number): void {
		this.startLine = line;
	}

	vmSetLabels(labels: string[]): void {
		this.labelList.length = 0;
		Object.assign(this.labelList, labels);
	}

	vmOnBreakContSet(): boolean {
		return this.breakGosubLine < 0; // on break cont
	}

	vmOnBreakHandlerActive(): boolean {
		return Boolean(this.breakResumeLine);
	}

	vmEscape(): boolean {
		let stop = true;

		if (this.breakGosubLine > 0) { // on break gosub n
			if (!this.breakResumeLine) { // do not nest break gosub
				this.breakResumeLine = Number(this.line);
				this.vmGosub(this.line, this.breakGosubLine);
			}
			stop = false;
		} else if (this.breakGosubLine < 0) { // on break cont
			stop = false;
		} // else: on break stop

		return stop;
	}

	private vmAssertNumber(n: number | undefined, err: string) {
		if (typeof n !== "number") {
			throw this.vmComposeError(Error(), 13, err + " " + n); // Type mismatch
		}
	}

	private vmAssertString(s: string, err: string) {
		if (typeof s !== "string") {
			throw this.vmComposeError(Error(), 13, err + " " + s); // Type mismatch
		}
	}

	private vmAssertInRange(n: number | undefined, min: number, max: number, err: string) {
		this.vmAssertNumber(n, err);
		if (n as number < min || n as number > max) {
			if (!this.quiet) {
				Utils.console.warn("vmAssertInRange: number not in range:", min + "<=" + n + "<=" + max);
			}
			throw this.vmComposeError(Error(), 5, err + " " + n); // 5=Improper argument
		}
		return n as number;
	}


	// round number (-2^31..2^31) to integer; throw error if no number
	vmRound(n: number | undefined, err?: string): number { // optional err
		this.vmAssertNumber(n, err || "?");
		return ((n as number) >= 0) ? ((n as number) + 0.5) | 0 : ((n as number) - 0.5) | 0; // eslint-disable-line no-bitwise
	}

	/*
	// round for comparison TODO
	vmRound4Cmp(n) {
		const nAdd = (n >= 0) ? 0.5 : -0.5;

		return ((n * 1e12 + nAdd) | 0) / 1e12; // eslint-disable-line no-bitwise
	}
	*/

	vmInRangeRound(n: number | undefined, min: number, max: number, err: string): number {
		n = this.vmRound(n, err);
		if (n < min || n > max) {
			if (!this.quiet) {
				Utils.console.warn("vmInRangeRound: number not in range:", min + "<=" + n + "<=" + max);
			}
			throw this.vmComposeError(Error(), n < -32768 || n > 32767 ? 6 : 5, err + " " + n); // 6=Overflow, 5=Improper argument
		}
		return n;
	}

	private vmLineInRange(n: number | undefined, err: string) {
		const min = 1,
			max = 65535,
			num2 = this.vmRound(n, err);

		if (n !== num2) { // fractional number? => integer expected
			throw this.vmComposeError(Error(), 23, err + " " + n); // Line too long
		}

		if (n as number < min || n as number > max) {
			if (!this.quiet) {
				Utils.console.warn("vmLineInRange: number not in range:", min + "<=" + n + "<=" + max);
			}
			throw this.vmComposeError(Error(), 5, err + " " + n); // 5=Improper argument
		}
		return n;
	}

	private vmRound2Complement(n: number | undefined, err: string) {
		n = this.vmInRangeRound(n, -32768, 65535, err);
		if (n < 0) {
			n += 65536;
		}
		return n;
	}

	private vmGetLetterCode(s: string, err: string) {
		this.vmAssertString(s, err);

		// const reLetter = RegExp("^[A-Za-z]$");
		s = s.toLowerCase();
		if (s.length !== 1 || s < "a" || s > "z") { // single letter?
			throw this.vmComposeError(Error(), 2, err + " " + s); // Syntax Error
		}
		return s.charCodeAt(0);
	}

	vmDetermineVarType(varType: string): string { // also used in controller
		return (varType.length > 1) ? varType.charAt(1) : this.variables.getVarType(varType.charAt(0));
	}

	vmAssertNumberType(varType: string): void {
		const type = this.vmDetermineVarType(varType);

		if (type !== "I" && type !== "R") { // not integer or real?
			throw this.vmComposeError(Error(), 13, "type " + type); // "Type mismatch"
		}
	}

	// format a value for assignment to a variable with type determined from varType
	vmAssign(varType: string, value: string | number): (string | number) {
		const type = this.vmDetermineVarType(varType);

		if (type === "R") { // real
			this.vmAssertNumber(value as number, "=");
		} else if (type === "I") { // integer
			value = this.vmRound(value as number, "="); // round number to integer
		} else if (type === "$") { // string
			if (typeof value !== "string") {
				if (!this.quiet) {
					Utils.console.warn("vmAssign: expected string but got:", value);
				}
				throw this.vmComposeError(Error(), 13, "type " + type + "=" + value); // "Type mismatch"
			}
		}
		return value;
	}

	vmGotoLine(line: string | number, msg?: string): void {
		if (Utils.debug > 5) {
			if (typeof line === "number" || Utils.debug > 7) { // non-number labels only in higher debug levels
				Utils.console.debug("dvmGotoLine:", msg + ": " + line);
			}
		}
		this.line = line;
	}

	private fnCheckSqTimer() {
		let timerExpired = false;

		if (this.timerPriority < 2) {
			for (let i = 0; i < CpcVm.sqTimerCount; i += 1) {
				const timer = this.sqTimer[i];

				// use sound.sq(i) and not this.sq(i) since that would reset onSq timer
				if (timer.active && !timer.handlerRunning && (this.soundClass.sq(i) & 0x07)) { // eslint-disable-line no-bitwise
					this.vmGosub(this.line, timer.line);
					timer.handlerRunning = true;
					timer.stackIndexReturn = this.gosubStack.length;
					timer.repeat = false; // one shot
					timerExpired = true;
					break; // found expired timer
				}
			}
		}
		return timerExpired;
	}

	private vmCheckTimer(time: number) {
		let timerExpired = false;

		for (let i = CpcVm.timerCount - 1; i > this.timerPriority; i -= 1) { // check timers starting with highest priority first
			const timer = this.timerList[i];

			if (timer.active && !timer.handlerRunning && time > timer.nextTimeMs) { // timer expired?
				this.vmGosub(this.line, timer.line);
				timer.handlerRunning = true;
				timer.stackIndexReturn = this.gosubStack.length;
				timer.savedPriority = this.timerPriority;
				this.timerPriority = i;
				if (!timer.repeat) { // not repeating
					timer.active = false;
				} else {
					const delta = time - timer.nextTimeMs;

					timer.nextTimeMs += timer.intervalMs * Math.ceil(delta / timer.intervalMs);
				}
				timerExpired = true;
				break; // found expired timer
			} else if (i === 2) { // for priority 2 we check the sq timers which also have priority 2
				if (this.fnCheckSqTimer()) {
					break; // found expired timer
				}
			}
		}
		return timerExpired;
	}

	private vmCheckTimerHandlers() {
		for (let i = CpcVm.timerCount - 1; i >= 0; i -= 1) {
			const timer = this.timerList[i];

			if (timer.handlerRunning) {
				if (timer.stackIndexReturn > this.gosubStack.length) {
					timer.handlerRunning = false;
					this.timerPriority = timer.savedPriority; // restore priority
					timer.stackIndexReturn = 0;
				}
			}
		}
	}

	private vmCheckSqTimerHandlers() {
		let timerReloaded = false;

		for (let i = CpcVm.sqTimerCount - 1; i >= 0; i -= 1) {
			const timer = this.sqTimer[i];

			if (timer.handlerRunning) {
				if (timer.stackIndexReturn > this.gosubStack.length) {
					timer.handlerRunning = false;
					this.timerPriority = timer.savedPriority; // restore priority
					timer.stackIndexReturn = 0;
					if (!timer.repeat) { // not reloaded
						timer.active = false;
					} else {
						timerReloaded = true;
					}
				}
			}
		}
		return timerReloaded;
	}

	private vmCheckNextFrame(time: number) {
		if (time >= this.nextFrameTime) { // next time of frame fly
			const delta = time - this.nextFrameTime;

			if (delta > CpcVm.frameTimeMs) {
				this.nextFrameTime += CpcVm.frameTimeMs * Math.ceil(delta / CpcVm.frameTimeMs);
			} else {
				this.nextFrameTime += CpcVm.frameTimeMs;
			}
			this.canvas.updateSpeedInk();
			this.vmCheckTimer(time); // check BASIC timers and sound queue
			this.soundClass.scheduler(); // on a real CPC it is 100 Hz, we use 50 Hz
		}
	}

	vmGetTimeUntilFrame(time?: number): number {
		time = time || Date.now();
		return this.nextFrameTime - time;
	}

	vmLoopCondition(): boolean {
		const time = Date.now();

		if (time >= this.nextFrameTime) {
			this.vmCheckNextFrame(time);
			this.stopCount += 1;
			if (this.stopCount >= 5) { // do not stop too often because of just timer reason because setTimeout is expensive
				this.stopCount = 0;
				this.vmStop("timer", 20);
			}
		}
		return this.stopEntry.reason === "";
	}

	private vmInitUntypedVariables(varChar: string) {
		const names = this.variables.getAllVariableNames();

		for (let i = 0; i < names.length; i += 1) {
			const name = names[i];

			if (name.charAt(0) === varChar) {
				if (name.indexOf("$") === -1 && name.indexOf("%") === -1 && name.indexOf("!") === -1) { // no explicit type?
					this.variables.initVariable(name);
				}
			}
		}
	}

	private vmDefineVarTypes(type: string, err: string, first: string, last?: string) {
		const firstNum = this.vmGetLetterCode(first, err),
			lastNum = last ? this.vmGetLetterCode(last, err) : firstNum;

		for (let i = firstNum; i <= lastNum; i += 1) {
			const varChar = String.fromCharCode(i);

			if (this.variables.getVarType(varChar) !== type) { // type changed?
				this.variables.setVarType(varChar, type);
				// initialize all untyped variables starting with varChar!
				this.vmInitUntypedVariables(varChar);
			}
		}
	}

	vmStop(reason: string, priority: number, force?: boolean, paras?: VmStopParas): void { // optional force, paras
		const defaultPriority = CpcVm.stopPriority[reason];

		if (defaultPriority === undefined) {
			Utils.console.warn("Programming error: vmStop: Unknown reason:", reason);
		}

		priority = priority || 0;
		if (priority !== 0) {
			priority = defaultPriority;
		}
		if (force || priority >= this.stopEntry.priority) {
			this.stopEntry.priority = priority;
			this.stopEntry.reason = reason;
			this.stopEntry.paras = paras || CpcVm.emptyParas as VmStopParas;
		}
	}

	vmNotImplemented(name: string): void {
		if (!this.quiet) {
			Utils.console.warn("Not implemented:", name);
		}
	}

	private vmUsingStringFormat(format: string, arg: string) {
		const padChar = " ",
			re1 = /^\\ *\\$/;
		let str: string;

		if (format === "&") {
			str = arg;
		} else if (format === "!") {
			str = arg.charAt(0);
		} else if (re1.test(format)) { // "\...\"
			const padLen = format.length - arg.length,
				pad = (padLen > 0) ? padChar.repeat(padLen) : "";

			str = arg + pad; // string left aligned
		} else { // no string format
			throw this.vmComposeError(Error(), 13, "USING format " + format); // "Type mismatch"
		}
		return str;
	}

	// not fully implemented
	private vmUsingNumberFormat(format: string, arg: number) {
		const padChar = " ",
			re1 = /^\\ *\\$/;
		let str: string;

		if (format === "&" || format === "!" || re1.test(format)) { // string format for number?
			throw this.vmComposeError(Error(), 13, "USING format " + format); // "Type mismatch"
		}
		if (format.indexOf(".") < 0) { // no decimal point?
			str = arg.toFixed(0);
		} else { // assume ###.##
			const formatParts = format.split(".", 2),
				decimals = formatParts[1].length;

			// To avoid rounding errors: https://www.jacklmoore.com/notes/rounding-in-javascript
			arg = Number(Math.round(Number(arg + "e" + decimals)) + "e-" + decimals);
			str = arg.toFixed(decimals);
		}
		if (format.indexOf(",") >= 0) { // contains comma => insert thousands separator
			str = Utils.numberWithCommas(str);
		}

		const padLen = format.length - str.length,
			pad = (padLen > 0) ? padChar.repeat(padLen) : "";

		str = pad + str;
		if (str.length > format.length) {
			str = "%" + str; // mark too long
		}

		return str;
	}

	private vmUsingFormat(format: string, arg: string | number) {
		return typeof arg === "string" ? this.vmUsingStringFormat(format, arg) : this.vmUsingNumberFormat(format, arg);
	}

	vmGetStopObject(): VmStopEntry {
		return this.stopEntry;
	}

	vmGetInFileObject(): InFile {
		return this.inFile;
	}

	vmGetOutFileObject(): OutFile {
		return this.outFile;
	}

	vmAdaptFilename(name: string, err: string): string {
		this.vmAssertString(name, err);
		name = name.replace(/ /g, ""); // remove spaces
		if (name.indexOf("!") === 0) {
			name = name.substr(1); // remove preceding "!"
		}

		const index = name.indexOf(":");

		if (index >= 0) {
			name = name.substr(index + 1); // remove user and drive letter including ":"
		}
		name = name.toLowerCase();

		if (!name) {
			throw this.vmComposeError(Error(), 32, "Bad filename: " + name);
		}
		return name;
	}

	vmGetSoundData(): SoundData[] {
		return this.soundData;
	}

	vmSetSourceMap(sourceMap: Record<string, number[]>): void {
		this.sourceMap = sourceMap;
	}

	vmTrace(line: number | string): void {
		const stream = 0;

		this.traceLabel = String(line);
		if (this.tronFlag1 && !isNaN(Number(line))) {
			this.print(stream, "[" + line + "]");
		}
	}

	private vmDrawMovePlot(type: string, gPen?: number, gColMode?: number) {
		if (gPen !== undefined) {
			gPen = this.vmInRangeRound(gPen, 0, 15, type);
			this.canvas.setGPen(gPen);
		}
		if (gColMode !== undefined) {
			gColMode = this.vmInRangeRound(gColMode, 0, 3, type);
			this.canvas.setGColMode(gColMode);
		}
	}

	private vmAfterEveryGosub(type: string, interval: number, timer: number, line: number) { // timer may be null
		interval = this.vmInRangeRound(interval, 0, 32767, type); // more would be overflow
		timer = this.vmInRangeRound(timer || 0, 0, 3, type);
		line = this.vmLineInRange(line, type + " GOSUB");
		const timerEntry = this.timerList[timer];

		if (interval) {
			const intervalMs = interval * CpcVm.frameTimeMs; // convert to ms

			timerEntry.intervalMs = intervalMs;
			timerEntry.line = line;
			timerEntry.repeat = type === "EVERY";
			timerEntry.active = true;
			timerEntry.nextTimeMs = Date.now() + intervalMs;
		} else { // interval 0 => switch running timer off
			timerEntry.active = false;
		}
	}

	private vmCopyFromScreen(source: number, dest: number) {
		for (let i = 0; i < 0x4000; i += 1) {
			let byte = this.canvas.getByte(source + i); // get byte from screen memory

			if (byte === null) { // byte not visible on screen?
				byte = this.mem[source + i] || 0; // get it from our memory
			}
			this.mem[dest + i] = byte;
		}
	}

	private vmCopyToScreen(source: number, dest: number) {
		for (let i = 0; i < 0x4000; i += 1) {
			const byte = this.mem[source + i] || 0; // get it from our memory

			this.canvas.setByte(dest + i, byte);
		}
	}

	private vmSetScreenBase(byte: number) {
		byte = this.vmInRangeRound(byte, 0, 255, "screenBase");

		const page = byte >> 6, // eslint-disable-line no-bitwise
			oldPage = this.screenPage;

		if (page !== oldPage) {
			let addr = oldPage << 14; // eslint-disable-line no-bitwise

			this.vmCopyFromScreen(addr, addr);

			this.screenPage = page;
			addr = page << 14; // eslint-disable-line no-bitwise
			this.vmCopyToScreen(addr, addr);
		}
	}

	private vmSetScreenOffset(offset: number) {
		this.canvas.setScreenOffset(offset);
	}

	// could be also set vmSetScreenViewBase? thisiScreenViewPage?  We always draw on visible canvas?

	private vmSetTransparentMode(stream: number, transparent: number) {
		this.windowDataList[stream].transparent = Boolean(transparent);
	}

	// --

	abs(n: number): number {
		this.vmAssertNumber(n, "ABS");
		return Math.abs(n);
	}

	addressOf(variable: string): number { // addressOf operator
		// not really implemented
		this.vmAssertString(variable, "@");
		variable = variable.replace("v.", "");
		variable = variable.replace("[", "(");

		const pos = variable.indexOf("("); // array variable with indices?

		if (pos >= 0) {
			variable = variable.substr(0, pos); // remove indices
		}

		const varIndex = this.variables.getVariableIndex(variable);

		if (varIndex < 0) {
			throw this.vmComposeError(Error(), 5, "@" + variable); // Improper argument
		}
		return varIndex;
	}

	afterGosub(interval: number, timer: number, line: number): void {
		this.vmAfterEveryGosub("AFTER", interval, timer, line);
	}

	private static vmGetCpcCharCode(code: number): number {
		if (code > 255) { // map some UTF-8 character codes
			if (CpcVm.utf8ToCpc[code]) {
				code = CpcVm.utf8ToCpc[code];
			}
		}
		return code;
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
		n = Math.atan(n);
		return this.degFlag ? Utils.toDegrees(n) : n;
	}

	auto(line?: number, increment?: number): void {
		line = line === undefined ? 10 : this.vmLineInRange(line, "AUTO");
		increment = increment === undefined ? 10 : this.vmLineInRange(increment, "AUTO");

		this.vmNotImplemented("AUTO " + line + "," + increment);
	}

	bin$(n: number, pad?: number): string {
		n = this.vmRound2Complement(n, "BIN$");
		pad = this.vmInRangeRound(pad || 0, 0, 16, "BIN$");
		return n.toString(2).padStart(pad, "0");
	}

	border(ink1: number, ink2?: number): void { // ink2 optional
		ink1 = this.vmInRangeRound(ink1, 0, 31, "BORDER");
		if (ink2 === undefined) {
			ink2 = ink1;
		} else {
			ink2 = this.vmInRangeRound(ink2, 0, 31, "BORDER");
		}
		this.canvas.setBorder(ink1, ink2);
	}

	// break

	private vmMcSetMode(mode: number) {
		mode = this.vmInRangeRound(mode, 0, 3, "MCSetMode");

		const canvasMode = this.canvas.getMode();

		if (mode !== canvasMode) {
			const addr = this.screenPage << 14; // eslint-disable-line no-bitwise

			// keep screen bytes, just interpret in other mode
			this.vmCopyFromScreen(addr, addr); // read bytes from screen memory into memory
			this.canvas.changeMode(mode); // change mode and interpretation of bytes
			this.vmCopyToScreen(addr, addr); // write bytes back to screen memory
			this.canvas.changeMode(canvasMode); // keep mode
			// TODO: new content should still be written in old mode but interpreted in new mode
		}
	}

	private vmTxtInverse(stream: number) { // stream must be checked
		const win = this.windowDataList[stream],
			tmpPen = win.pen;

		this.pen(stream, win.paper);
		this.paper(stream, tmpPen);
	}

	private vmPutKeyInBuffer(key: string) {
		this.keyboard.putKeyInBuffer(key);

		const keyDownHandler = this.keyboard.getKeyDownHandler();

		if (keyDownHandler) {
			keyDownHandler();
		}
	}

	call(addr: number, ...args: (string|number)[]): void { // eslint-disable-line complexity
		// varargs (adr + parameters)
		addr = this.vmRound2Complement(addr, "CALL");
		if (args.length > 32) { // more that 32 arguments?
			throw this.vmComposeError(Error(), 2, "CALL "); // Syntax Error
		}
		for (let i = 0; i < args.length; i += 1) {
			if (typeof args[i] === "number") {
				args[i] = this.vmRound2Complement(args[i] as number, "CALL"); // even if the args itself are not used here
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
			this.vmPutKeyInBuffer(String.fromCharCode(args.length));
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
			this.print(0, String.fromCharCode(args.length));
			break;
		case 0xbb5d: // TXT WR Char (ROM &1334), depending on number of args
			this.vmDrawUndrawCursor(0);
			this.vmPrintChars(0, String.fromCharCode(args.length));
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
			this.pen(0, args.length % 16);
			break;
		case 0xbb96: // TXT Set Paper (ROM &12AE); depending on number of args
			this.paper(0, args.length % 16);
			break;
		case 0xbb9c: // TXT Inverse (ROM &12C9), same as print chr$(24);
			this.vmTxtInverse(0);
			break;
		case 0xbb9f: // TXT Set Back (ROM &137A), depending on number of args
			this.vmSetTransparentMode(0, args.length);
			break;
		case 0xbbdb: // GRA Clear Window (ROM &17C5)
			this.canvas.clearGraphicsWindow();
			break;
		case 0xbbde: // GRA Set Pen (ROM &17F6), depending on number of args
			// we can only set graphics pen depending on number of args (pen 0=no arg, pen 1=one arg)
			this.graphicsPen(args.length % 16);
			break;
		case 0xbbe4: // GRA Set Paper (ROM &17FD), depending on number of args
			this.graphicsPaper(args.length % 16);
			break;
		case 0xbbfc: // GRA WR Char (ROM &1945), depending on number of args
			this.canvas.printGChar(args.length);
			break;
		case 0xbbff: // SCR Initialize (ROM &0AA0)
			this.vmSetScreenBase(0xc0);
			this.modeValue = 1;
			this.canvas.setMode(this.modeValue); // does not clear canvas
			this.canvas.clearFullWindow(); // (SCR Mode Clear)
			this.textCanvas.clearFullWindow();
			// and SCR Reset:
			this.vmResetInks();
			break;
		case 0xbc02: // SCR Reset (ROM &0AB1)
			this.vmResetInks();
			break;
		case 0xbc06: // SCR SET BASE (&BC08, ROM &0B45); We use &BC06 to load reg A from reg E (not for CPC 664!)
		case 0xbc07: // Works on all CPC 464/664/6128
			this.vmSetScreenBase(args[0] as number);
			break;
		case 0xbc0e: // SCR SET MODE (ROM &0ACE), depending on number of args
			this.mode(args.length % 4); // 3 is valid also on CPC
			break;
		case 0xbca7: // SOUND Reset (ROM &1E68)
			this.soundClass.reset();
			break;
		case 0xbcb6: // SOUND Hold (ROM &1ECB)
			this.vmNotImplemented("CALL &BCBC");
			break;
		case 0xbcb9: // SOUND Continue (ROM &1EE6)
			this.vmNotImplemented("CALL &BCB9");
			break;
		case 0xbd19: // MC Wait Flyback (ROM &07BA)
			this.frame();
			break;
		case 0xbd1c: // MC Set Mode (ROM &0776) just set mode, depending on number of args
			this.vmMcSetMode(args.length % 4);
			break;
		case 0xbd3d: // KM Flush (ROM ?; CPC 664/6128)
			this.clearInput();
			break;
		case 0xbd49: // GRA Set First (ROM ?; CPC 664/6128), depending on number of args
			this.canvas.setMaskFirst(args.length % 2);
			break;
		case 0xbd4c: // GRA Set Mask (ROM ?; CPC 664/6128), depending on number of args
			this.canvas.setMask(args.length);
			break;
		case 0xbd52: // GRA Fill (ROM ?; CPC 664/6128), depending on number of args
			this.fill(args.length % 16);
			break;
		case 0xbd5b: // KL RAM SELECT (CPC 6128 only)
			// we can only set RAM bank depending on number of args
			this.vmSetRamSelect(args.length);
			break;
		default:
			if (Utils.debug > 0) {
				Utils.console.debug("Ignored: CALL", addr, args);
			}
			break;
		}
	}

	cat(): void {
		const stream = 0,
			fileParas: VmFileParas = {
				command: "cat",
				stream: stream,
				fileMask: "",
				line: this.line // unused
			};

		this.vmStop("fileCat", 45, false, fileParas);
	}

	chain(name: string, line?: number): void { // optional line
		const inFile = this.inFile;

		name = this.vmAdaptFilename(name, "CHAIN");
		this.closein();
		inFile.line = line === undefined ? 0 : this.vmInRangeRound(line, 0, 65535, "CHAIN"); // here we do rounding of line number
		inFile.open = true;
		inFile.command = "chain";
		inFile.name = name;
		inFile.fnFileCallback = this.fnCloseinHandler;
		this.vmStop("fileLoad", 90);
	}

	chainMerge(name: string, line?: number, first?: number, last?: number): void { // optional line, first, last
		const inFile = this.inFile;

		name = this.vmAdaptFilename(name, "CHAIN MERGE");
		this.closein();
		inFile.line = line === undefined ? 0 : this.vmInRangeRound(line, 0, 65535, "CHAIN MERGE"); // here we do rounding of line number;
		inFile.first = first === undefined ? 0 : this.vmAssertInRange(first, 1, 65535, "CHAIN MERGE");
		inFile.last = last === undefined ? 0 : this.vmAssertInRange(last, 1, 65535, "CHAIN MERGE");
		inFile.open = true;
		inFile.command = "chainMerge";
		inFile.name = name;
		inFile.fnFileCallback = this.fnCloseinHandler;
		this.vmStop("fileLoad", 90);
	}

	chr$(n: number): string {
		n = this.vmInRangeRound(n, 0, 255, "CHR$");
		return String.fromCharCode(n);
	}

	cint(n: number): number {
		return this.vmInRangeRound(n, -32768, 32767, "CINT");
	}

	clear(): void {
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
		this.defreal("a", "z");
		this.restore(); // restore data line index
		this.rad();
		this.soundClass.resetQueue();
		this.soundData.length = 0;
		this.closein();
		this.closeout();
	}

	clearInput(): void {
		this.keyboard.clearInput();
	}

	clg(gPaper?: number): void {
		if (gPaper !== undefined) {
			gPaper = this.vmInRangeRound(gPaper, 0, 15, "CLG");
			this.canvas.setGPaper(gPaper);
		}
		this.canvas.clearGraphicsWindow();
	}

	private vmCloseinCallback() {
		const inFile = this.inFile;

		CpcVm.vmResetFileHandling(inFile);
	}

	closein(): void {
		const inFile = this.inFile;

		if (inFile.open) {
			this.vmCloseinCallback(); // not really used as a callback here
		}
	}

	private vmCloseoutCallback() {
		const outFile = this.outFile;

		CpcVm.vmResetFileHandling(outFile);
	}

	closeout(): void {
		const outFile = this.outFile;

		if (outFile.open) {
			if (outFile.command !== "openout") {
				if (!this.quiet) {
					Utils.console.warn("closeout: command=", outFile.command); // should not occur
				}
			}
			if (!outFile.fileData.length) { // openout without data?
				this.vmCloseoutCallback(); // close directly
			} else { // data to save
				outFile.command = "closeout";
				outFile.fnFileCallback = this.fnCloseoutHandler;
				this.vmStop("fileSave", 90); // must stop directly after closeout
			}
		}
	}

	// also called for chr$(12), call &bb6c
	cls(stream: number): void {
		stream = this.vmInRangeRound(stream, 0, 7, "CLS");

		const win = this.windowDataList[stream];

		this.vmDrawUndrawCursor(stream); // why, if we clear anyway?

		this.canvas.clearTextWindow(win.left, win.right, win.top, win.bottom, win.paper); // cls window
		this.textCanvas.clearTextWindow(win.left, win.right, win.top, win.bottom, win.paper);
		win.pos = 0;
		win.vpos = 0;

		if (!stream) {
			this.outBuffer = ""; // clear also console, if stream===0
		}
	}

	private commaTab(stream: number): string { // special function used for comma in print (ROM &F25C), called delayed by print
		stream = this.vmInRangeRound(stream, 0, 9, "commaTab");

		this.vmMoveCursor2AllowedPos(stream);

		const zone = this.zoneValue,
			win = this.windowDataList[stream];
		let count = zone - (win.pos % zone);

		if (win.pos) { // <>0: not begin of line
			if (win.pos + count + zone > (win.right + 1 - win.left)) {
				win.pos += count + zone;
				this.vmMoveCursor2AllowedPos(stream);
				count = 0;
			}
		}
		return " ".repeat(count);
	}

	cont(): void {
		if (!this.startLine) {
			throw this.vmComposeError(Error(), 17, "CONT"); // cannot continue
		}
		this.vmGotoLine(this.startLine, "CONT");
		this.startLine = 0;
	}

	copychr$(stream: number): string {
		stream = this.vmInRangeRound(stream, 0, 7, "COPYCHR$");
		this.vmMoveCursor2AllowedPos(stream);

		this.vmDrawUndrawCursor(stream); // undraw
		const win = this.windowDataList[stream],
			charCode = this.canvas.readChar(win.pos + win.left, win.vpos + win.top, win.pen, win.paper),
			// TODO charCode2 = this.textCanvas.readChar(win.pos + win.left, win.vpos + win.top, win.pen, win.paper),
			char = (charCode >= 0) ? String.fromCharCode(charCode) : "";

		this.vmDrawUndrawCursor(stream); // draw
		return char;
	}

	cos(n: number): number {
		this.vmAssertNumber(n, "COS");
		return Math.cos((this.degFlag) ? Utils.toRadians(n) : n);
	}

	creal(n: number): number {
		this.vmAssertNumber(n, "CREAL");
		return n;
	}

	vmPlaceRemoveCursor(stream: number): void {
		const win = this.windowDataList[stream];

		this.vmMoveCursor2AllowedPos(stream);
		this.canvas.drawCursor(win.pos + win.left, win.vpos + win.top, win.pen, win.paper);
	}

	vmDrawUndrawCursor(stream: number): void {
		const win = this.windowDataList[stream];

		if (win.cursorOn && win.cursorEnabled) {
			this.vmPlaceRemoveCursor(stream);
		}
	}

	cursor(stream: number, cursorOn?: number, cursorEnabled?: number): void { // one of cursorOn, cursorEnabled is optional
		stream = this.vmInRangeRound(stream, 0, 7, "CURSOR");
		const win = this.windowDataList[stream];

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
	}

	data(line: number, ...args: DataEntryType[]): void { // varargs
		this.vmLineInRange(line, "DATA");
		if (!this.dataLineIndex[line]) {
			this.dataLineIndex[line] = this.dataList.length; // set current index for the line
		}
		// append data
		for (let i = 0; i < args.length; i += 1) {
			this.dataList.push(args[i]);
		}
	}

	dec$(n: number, frmt: string): string {
		this.vmAssertNumber(n, "DEC$");
		this.vmAssertString(frmt, "DEC$");
		return this.vmUsingNumberFormat(frmt, n);
	}

	// def fn

	defint(first: string, last?: string): void {
		this.vmDefineVarTypes("I", "DEFINT", first, last);
	}

	defreal(first: string, last?: string): void {
		this.vmDefineVarTypes("R", "DEFREAL", first, last);
	}

	defstr(first: string, last?: string): void {
		this.vmDefineVarTypes("$", "DEFSTR", first, last);
	}

	deg(): void {
		this.degFlag = true;
	}

	"delete"(first?: number, last?: number): void {
		if (first === undefined) {
			first = 1;
			last = last === undefined ? 65535 : this.vmInRangeRound(last, 1, 65535, "DELETE");
		} else {
			first = this.vmInRangeRound(first, 1, 65535, "DELETE");
			if (last === undefined) { // just one parameter?
				last = first;
			} else { // range
				last = this.vmInRangeRound(last, 1, 65535, "DELETE");
			}
		}

		this.vmStop("deleteLines", 85, false, {
			command: "DELETE",
			stream: 0, // unused
			first: first,
			last: last,
			line: this.line // unused
		});
	}

	derr(): number { // eslint-disable-line class-methods-use-this
		return 0; // "[Not implemented yet: derr]"
	}

	di(): void {
		this.timerPriority = 3; // increase priority
	}

	dim(varName: string, ...args: number[]): void { // varargs
		const dimensions = [];

		this.vmAssertString(varName, "DIM");
		for (let i = 0; i < args.length; i += 1) {
			const size = this.vmInRangeRound(args[i], 0, 32767, "DIM") + 1; // for basic we have sizes +1

			dimensions.push(size);
		}
		this.variables.dimVariable(varName, dimensions);
	}

	/*
	// TODO, if we want to check array access
	vmGetVariable(varName: string, ...args: number[]): VariableValue { // TODO
		let value = this.variables.getVariable(varName);

		for (let i = 0; i < args.length; i += 1) {
			if (Array.isArray(value)) {
				const index = this.vmInRangeRound(args[i], 0, value.length - 1, "vmGet"); // TODO: in case of error: Subscript out of range; or: vmAssertInRange?

				value = value[index];
			} else {
				throw this.vmComposeError(Error(), 9, String(value)); // Subscript out of range
			}
		}
		return value;
	}

	vmSetVariable(varName: string, valueToSet: number | string, ...args: number[]): VariableValue { // TODO
		let value = this.variables.getVariable(varName);

		for (let i = 0; i < args.length; i += 1) {
			if (Array.isArray(value)) {
				const index = this.vmInRangeRound(args[i], 0, value.length - 1, "vmGet"); // TODO: in case of error: Subscript out of range; or: vmAssertInRange?

				if (i < args.length - 1) {
					value = value[index];
				} else {
					value[index] = valueToSet;
				}
			} else {
				throw this.vmComposeError(Error(), 9, String(value)); // Subscript out of range
			}
		}

		return value;
	}
	*/

	draw(x: number, y: number, gPen?: number, gColMode?: number): void {
		x = this.vmInRangeRound(x, -32768, 32767, "DRAW");
		y = this.vmInRangeRound(y, -32768, 32767, "DRAW");
		this.vmDrawMovePlot("DRAW", gPen, gColMode);
		this.canvas.draw(x, y);
	}

	drawr(x: number, y: number, gPen?: number, gColMode?: number): void {
		x = this.vmInRangeRound(x, -32768, 32767, "DRAWR") + this.canvas.getXpos();
		y = this.vmInRangeRound(y, -32768, 32767, "DRAWR") + this.canvas.getYpos();
		this.vmDrawMovePlot("DRAWR", gPen, gColMode);
		this.canvas.draw(x, y);
	}

	edit(line: number): void {
		const lineParas: VmLineParas = {
			command: "edit",
			stream: 0, // unused
			first: line,
			last: 0, // unused,
			line: this.line // unused
		};

		this.vmStop("editLine", 85, false, lineParas);
	}

	ei(): void {
		this.timerPriority = -1; // decrease priority
	}

	end(label: string): void {
		this.stop(label);
	}

	ent(toneEnv: number, ...args: number[]): void { // varargs
		toneEnv = this.vmInRangeRound(toneEnv, -15, 15, "ENT");

		const envData: ToneEnvData[] = [];
		let	arg: ToneEnvData,
			repeat = false;

		if (toneEnv < 0) {
			toneEnv = -toneEnv;
			repeat = true;
		}

		if (toneEnv) { // not 0
			for (let i = 0; i < args.length; i += 3) { // starting with 1: 3 parameters per section
				if (args[i] !== undefined) {
					arg = {
						steps: this.vmInRangeRound(args[i], 0, 239, "ENT"), // number of steps: 0..239
						diff: this.vmInRangeRound(args[i + 1], -128, 127, "ENT"), // size (period change) of steps: -128..+127
						time: this.vmInRangeRound(args[i + 2], 0, 255, "ENT"), // time per step: 0..255 (0=256)
						repeat: repeat
					}; // as ToneEnvData1
				} else { // special handling
					arg = {
						period: this.vmInRangeRound(args[i + 1], 0, 4095, "ENT"), // absolute period
						time: this.vmInRangeRound(args[i + 2], 0, 255, "ENT") // time: 0..255 (0=256)
					}; // as ToneEnvData2
				}
				envData.push(arg);
			}
			this.soundClass.setToneEnv(toneEnv, envData);
		} else { // 0
			if (!this.quiet) {
				Utils.console.warn("ENT: toneEnv", toneEnv);
			}
			throw this.vmComposeError(Error(), 5, "ENT " + toneEnv); // Improper argument
		}
	}

	env(volEnv: number, ...args: number[]): void { // varargs
		volEnv = this.vmInRangeRound(volEnv, 1, 15, "ENV");

		const envData: VolEnvData[] = [];
		let arg: VolEnvData;

		for (let i = 0; i < args.length; i += 3) { // starting with 1: 3 parameters per section
			if (args[i] !== undefined) {
				arg = {
					steps: this.vmInRangeRound(args[i], 0, 127, "ENV"), // number of steps: 0..127
					/* eslint-disable no-bitwise */
					diff: this.vmInRangeRound(args[i + 1], -128, 127, "ENV") & 0x0f, // size (volume) of steps: moved to range 0..15
					/* eslint-enable no-bitwise */
					time: this.vmInRangeRound(args[i + 2], 0, 255, "ENV") // time per step: 0..255 (0=256)
				}; // as VolEnvData1
				if (!arg.time) { // (0=256)
					arg.time = 256;
				}
			} else { // special handling for register parameters
				arg = {
					register: this.vmInRangeRound(args[i + 1], 0, 15, "ENV"), // register: 0..15
					period: this.vmInRangeRound(args[i + 2], -32768, 65535, "ENV")
				}; // as VolEnvData2
			}
			envData.push(arg);
		}
		this.soundClass.setVolEnv(volEnv, envData);
	}

	eof(): number {
		const inFile = this.inFile;
		let eof = -1;

		if (inFile.open && inFile.fileData.length) {
			eof = 0;
		}
		return eof;
	}

	private vmFindArrayVariable(name: string): string {
		name += "A";
		if (this.variables.variableExist(name)) { // one dim array variable?
			return name;
		}

		// find multi-dim array variable
		const fnArrayVarFilter = function (variable: string) {
			return (variable.indexOf(name) === 0) ? variable : null; // find array varA
		};
		let names = this.variables.getAllVariableNames();

		names = names.filter(fnArrayVarFilter); // find array varA... with any number of indices
		return names[0]; // we should find exactly one
	}

	erase(...args: string[]): void { // varargs
		if (!args.length) {
			throw this.vmComposeError(Error(), 2, "ERASE"); // Syntax Error
		}
		for (let i = 0; i < args.length; i += 1) {
			this.vmAssertString(args[i], "ERASE");
			const name = this.vmFindArrayVariable(args[i]);

			if (name) {
				this.variables.initVariable(name);
			} else {
				if (!this.quiet) {
					Utils.console.warn("erase: Array variable not found:", args[i]);
				}
				throw this.vmComposeError(Error(), 5, "ERASE " + args[i]); // Improper argument
			}
		}
	}

	erl(): number {
		const errorLine = parseInt(String(this.errorLine), 10); // in cpcBasic we have an error label here, so return number only

		return errorLine || 0;
	}

	err(): number {
		return this.errorCode;
	}

	vmComposeError(error: Error, err: number, errInfo: string): CustomError {
		const errors = CpcVm.errors,
			errorString = errors[err] || errors[errors.length - 1]; // maybe Unknown error

		this.errorCode = err;
		this.errorLine = this.line;

		let line = this.errorLine;

		if (this.traceLabel) {
			line += " (trace: " + this.traceLabel + ")";
		}

		const errorWithInfo = errorString + " in " + line + (errInfo ? (": " + errInfo) : "");
		let	hidden = false; // hide errors wich are catched

		if (this.errorGotoLine && !this.errorResumeLine) {
			this.errorResumeLine = Number(this.errorLine);
			this.vmGotoLine(this.errorGotoLine, "onError");
			this.vmStop("onError", 50);
			hidden = true;
		} else {
			this.vmStop("error", 50);
		}
		if (!this.quiet) {
			Utils.console.log("BASIC error(" + err + "):", errorWithInfo + (hidden ? " (hidden: " + hidden + ")" : ""));
		}
		const traceLine = this.traceLabel || this.line,
			sourceMapEntry = this.sourceMap[traceLine],
			pos = sourceMapEntry && sourceMapEntry[0],
			len = sourceMapEntry && sourceMapEntry[1];

		return Utils.composeError("CpcVm", error, errorString, errInfo, pos, len, line, hidden);
	}

	error(err: number, errInfo: string): void {
		err = this.vmInRangeRound(err, 0, 255, "ERROR"); // could trigger another error
		throw this.vmComposeError(Error(), err, errInfo);
	}

	everyGosub(interval: number, timer: number, line: number): void {
		this.vmAfterEveryGosub("EVERY", interval, timer, line);
	}

	exp(n: number): number {
		this.vmAssertNumber(n, "EXP");
		return Math.exp(n);
	}

	fill(gPen: number): void {
		gPen = this.vmInRangeRound(gPen, 0, 15, "FILL");
		this.canvas.fill(gPen);
	}

	fix(n: number): number {
		this.vmAssertNumber(n, "FIX");
		return Math.trunc(n); // (ES6: Math.trunc)
	}

	frame(): void {
		this.vmStop("waitFrame", 40);
	}

	fre(arg: number | string): number { // arg is number or string
		if (typeof arg !== "number" && typeof arg !== "string") {
			throw this.vmComposeError(Error(), 2, "FRE"); // Syntax Error
		}
		return this.himemValue; // example, e.g. 42245;
	}

	private vmGosub(retLabel: string | number, n: number) {
		this.vmGotoLine(n, "gosub (ret=" + retLabel + ")");
		this.gosubStack.push(retLabel);
	}

	gosub(retLabel: string | number, n: number): void {
		this.vmLineInRange(n, "GOSUB");
		if (this.gosubStack.length >= this.maxGosubStackLength) { // limit stack size (not necessary in JS, but...)
			throw this.vmComposeError(Error(), 7, "GOSUB " + n); // Memory full
		}
		this.vmGosub(retLabel, n);
	}

	"goto"(n: string): void {
		// TODO: do we want: this.vmLineInRange(Number(n), "GOTO");
		this.vmGotoLine(n, "goto");
	}

	graphicsPaper(gPaper: number): void {
		gPaper = this.vmInRangeRound(gPaper, 0, 15, "GRAPHICS PAPER");
		this.canvas.setGPaper(gPaper);
	}

	graphicsPen(gPen?: number, transparentMode?: number): void {
		if (gPen === undefined && transparentMode === undefined) {
			throw this.vmComposeError(Error(), 22, "GRAPHICS PEN"); // Operand missing
		}

		if (gPen !== undefined) {
			gPen = this.vmInRangeRound(gPen, 0, 15, "GRAPHICS PEN");
			this.canvas.setGPen(gPen);
		}

		if (transparentMode !== undefined) {
			transparentMode = this.vmInRangeRound(transparentMode, 0, 1, "GRAPHICS PEN");
			this.canvas.setGTransparentMode(Boolean(transparentMode));
		}
	}

	hex$(n: number, pad?: number): string {
		n = this.vmRound2Complement(n, "HEX$");
		pad = this.vmInRangeRound(pad || 0, 0, 16, "HEX$");
		return n.toString(16).toUpperCase().padStart(pad, "0");
	}

	himem(): number {
		return this.himemValue;
	}

	ink(pen: number, ink1: number, ink2?: number): void { // optional ink2
		pen = this.vmInRangeRound(pen, 0, 15, "INK");
		ink1 = this.vmInRangeRound(ink1, 0, 31, "INK");
		if (ink2 === undefined) {
			ink2 = ink1;
		} else {
			ink2 = this.vmInRangeRound(ink2, 0, 31, "INK");
		}
		this.canvas.setInk(pen, ink1, ink2);
	}

	inkey(key: number): number {
		key = this.vmInRangeRound(key, 0, 79, "INKEY");
		return this.keyboard.getKeyState(key);
	}

	inkey$(): string {
		const key = this.keyboard.getKeyFromBuffer();

		// do some slowdown, if checked too early again without key press
		if (key !== "") { // some key pressed?
			this.inkeyTimeMs = 0;
		} else { // no key
			const now = Date.now();

			if (this.inkeyTimeMs && now < this.inkeyTimeMs) { // last inkey without key was in range of frame fly?
				this.frame(); // then insert a frame fly
			}
			this.inkeyTimeMs = now + CpcVm.frameTimeMs; // next time of frame fly
		}
		return key;
	}

	inp(port: number): number {
		port = this.vmRound2Complement(port, "INP"); // 2nd complement of 16 bit address

		// eslint-disable-next-line no-bitwise
		let byte = (port & 0xff);

		// eslint-disable-next-line no-bitwise
		byte |= 0xff; // we return always the same 0xff

		return byte;
	}

	private vmSetInputValues(inputValues: (string | number)[]): void {
		this.inputValues = inputValues;
	}

	vmGetNextInput(): string | number | undefined { // called from JS script
		const inputValues = this.inputValues,
			value = inputValues.shift();

		return value;
	}

	vmInputCallback(): boolean {
		const inputParas = this.vmGetStopObject().paras as VmInputParas,
			stream = inputParas.stream,
			input = inputParas.input,
			inputValues = input.split(","),
			convertedInputValues: (string | number)[] = [],
			types = inputParas.types;
		let inputOk = true;

		if (Utils.debug > 0) {
			Utils.console.debug("vmInputCallback:", input);
		}

		if (types && (inputValues.length === types.length)) {
			for (let i = 0; i < types.length; i += 1) {
				const varType = types[i],
					type = this.vmDetermineVarType(varType),
					value = inputValues[i];

				if (type !== "$") { // not a string?
					const valueNumber = CpcVm.vmVal(value); // convert to number (also binary, hex), empty string gets 0

					if (isNaN(valueNumber)) {
						inputOk = false;
					}
					convertedInputValues.push(valueNumber);
				} else {
					convertedInputValues.push(value);
				}
			}
		} else {
			inputOk = false;
		}

		this.cursor(stream, 0);
		if (!inputOk) {
			this.print(stream, "?Redo from start\r\n");
			inputParas.input = "";
			this.print(stream, inputParas.message);
			this.cursor(stream, 1);
		} else {
			this.vmSetInputValues(convertedInputValues);
		}
		return inputOk;
	}

	private fnFileInputGetString(fileData: string[]) {
		let line = fileData[0].replace(/^\s+/, ""), // remove preceding whitespace
			value: string | undefined;

		if (line.charAt(0) === '"') { // quoted string?
			const index = line.indexOf('"', 1); // closing quotes in this line?

			if (index >= 0) {
				value = line.substr(1, index - 1); // take string without quotes
				line = line.substr(index + 1);
				line = line.replace(/^\s*,/, ""); // multiple args => remove next comma
			} else if (fileData.length > 1) { // no closing quotes in this line => try to combine with next line
				fileData.shift(); // remove line
				line += "\n" + fileData[0]; // combine lines
			} else {
				throw this.vmComposeError(Error(), 13, "INPUT #9: no closing quotes: " + line);
			}
		} else { // unquoted string
			const index = line.indexOf(","); // multiple args?

			if (index >= 0) {
				value = line.substr(0, index); // take arg
				line = line.substr(index + 1);
			} else {
				value = line; // take line
				line = "";
			}
		}

		fileData[0] = line;
		return value;
	}

	private fnFileInputGetNumber(fileData: string[]) {
		let line = fileData[0].replace(/^\s+/, ""), // remove preceding whitespace
			index = line.indexOf(","), // multiple args?
			value: string;

		if (index >= 0) {
			value = line.substr(0, index); // take arg
			line = line.substr(index + 1);
		} else {
			index = line.indexOf(" "); // space?
			if (index >= 0) {
				value = line.substr(0, index); // take item until space
				line = line.substr(index);
				line = line.replace(/^\s*/, ""); // remove spaces after number
			} else {
				value = line; // take line
				line = "";
			}
		}

		const nValue = CpcVm.vmVal(value); // convert to number (also binary, hex)

		if (isNaN(nValue)) { // eslint-disable-line max-depth
			throw this.vmComposeError(Error(), 13, "INPUT #9 " + nValue + ": " + value); // Type mismatch
		}

		fileData[0] = line;
		return nValue;
	}

	private vmInputNextFileItem(type: string) {
		const fileData = this.inFile.fileData;
		let value: string | number | undefined;

		while (fileData.length && value === undefined) {
			if (type === "$") {
				value = this.fnFileInputGetString(fileData);
			} else { // number type
				value = this.fnFileInputGetNumber(fileData);
			}

			if (!fileData[0].length) {
				fileData.shift(); // remove empty line
			}
		}
		return value;
	}

	vmInputFromFile(types: string[]): void {
		const inputValues = [];

		for (let i = 0; i < types.length; i += 1) {
			const varType = types[i],
				type = this.vmDetermineVarType(varType),
				value = this.vmInputNextFileItem(type);

			inputValues[i] = this.vmAssign(varType, value as string | number);
		}
		this.vmSetInputValues(inputValues);
	}

	input(stream: number, noCRLF: string, msg: string, ...args: string[]): void { // varargs
		stream = this.vmInRangeRound(stream, 0, 9, "INPUT");
		if (stream < 8) {
			this.print(stream, msg);
			this.vmStop("waitInput", 45, false, {
				command: "input",
				stream: stream,
				message: msg,
				noCRLF: noCRLF,
				fnInputCallback: this.vmInputCallback.bind(this),
				types: args,
				input: "",
				line: this.line // to repeat in case of break
			});
			this.cursor(stream, 1);
		} else if (stream === 8) {
			this.vmSetInputValues(["I am the printer!"]);
		} else if (stream === 9) {
			if (!this.inFile.open) {
				throw this.vmComposeError(Error(), 31, "INPUT #" + stream); // File not open
			} else if (this.eof()) {
				throw this.vmComposeError(Error(), 24, "INPUT #" + stream); // EOF met
			}
			this.vmInputFromFile(args); // remaining arguments
		}
	}

	instr(p1: string | number, p2: string, p3?: string): number { // optional startpos as first parameter
		this.vmAssertString(p2, "INSTR");
		if (typeof p1 === "string") { // p1=string, p2=search string
			return p1.indexOf(p2) + 1;
		}
		p1 = this.vmInRangeRound(p1, 1, 255, "INSTR"); // p1=startpos
		this.vmAssertString(p3 as string, "INSTR");
		return p2.indexOf(p3 as string, p1 - 1) + 1; // p2=string, p3=search string
	}

	"int"(n: number): number {
		this.vmAssertNumber(n, "INT");
		return Math.floor(n);
	}

	joy(joy: number): number {
		joy = this.vmInRangeRound(joy, 0, 1, "JOY");
		return this.keyboard.getJoyState(joy);
	}

	key(token: number, s: string): void {
		token = this.vmRound(token, "KEY");
		if (token >= 128 && token <= 159) {
			token -= 128;
		}
		token = this.vmInRangeRound(token, 0, 31, "KEY"); // round again, but we want the check
		this.vmAssertString(s, "KEY");
		this.keyboard.setExpansionToken(token, s);
	}

	keyDef(cpcKey: number, repeat: number, normal?: number | undefined, shift?: number | undefined, ctrl?: number): void { // optional args normal,...
		const options: CpcKeyExpansionsOptions = {
			cpcKey: this.vmInRangeRound(cpcKey, 0, 79, "KEY DEF"),
			repeat: this.vmInRangeRound(repeat, 0, 1, "KEY DEF"),
			normal: (normal !== undefined) ? this.vmInRangeRound(normal, 0, 255, "KEY DEF") : undefined,
			shift: (shift !== undefined) ? this.vmInRangeRound(shift, 0, 255, "KEY DEF") : undefined,
			ctrl: (ctrl !== undefined) ? this.vmInRangeRound(ctrl, 0, 255, "KEY DEF") : undefined
		};

		this.keyboard.setCpcKeyExpansion(options);
	}

	left$(s: string, len: number): string {
		this.vmAssertString(s, "LEFT$");
		len = this.vmInRangeRound(len, 0, 255, "LEFT$");
		return s.substr(0, len);
	}

	len(s: string): number {
		this.vmAssertString(s, "LEN");
		return s.length;
	}

	// let

	vmLineInputCallback(): boolean {
		const inputParas = this.vmGetStopObject().paras as VmInputParas,
			input = inputParas.input;

		if (Utils.debug > 0) {
			Utils.console.debug("vmLineInputCallback:", input);
		}
		this.vmSetInputValues([input]);
		this.cursor(inputParas.stream, 0);
		return true;
	}

	lineInput(stream: number, noCRLF: string, msg: string, varType: string): void { // varType must be string variable
		stream = this.vmInRangeRound(stream, 0, 9, "LINE INPUT");
		if (stream < 8) {
			this.vmAssertString(varType, "LINE INPUT");
			this.print(stream, msg);
			const type = this.vmDetermineVarType(varType);

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
		} else if (stream === 8) {
			this.vmSetInputValues(["I am the printer!"]);
		} else if (stream === 9) {
			if (!this.inFile.open) {
				throw this.vmComposeError(Error(), 31, "LINE INPUT #" + stream); // File not open
			} else if (this.eof()) {
				throw this.vmComposeError(Error(), 24, "LINE INPUT #" + stream); // EOF met
			}
			this.vmSetInputValues(this.inFile.fileData.splice(0, arguments.length - 3)); // always 1 element
		}
	}

	list(stream: number, first?: number, last?: number): void { // varargs
		stream = this.vmInRangeRound(stream, 0, 9, "LIST");

		if (first === undefined) {
			first = 1;
			if (last === undefined) { // no first and last parameter?
				last = 65535;
			}
		} else {
			first = this.vmInRangeRound(first, 1, 65535, "LIST");
			if (last === undefined) { // just one parameter?
				last = first;
			} else { // range
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
	}

	private vmLoadCallback(input: string, meta: FileMeta) {
		const inFile = this.inFile;

		let	putInMemory = false;

		if (input !== null && meta) {
			if (meta.typeString === "B" || inFile.start !== undefined) { // only for binary files or when a load address is specified (feature)
				const start = inFile.start !== undefined ? inFile.start : Number(meta.start);
				let	length = Number(meta.length); // we do not really need the length from metadata

				if (isNaN(length)) {
					length = input.length; // only valid after atob()
				}
				if (Utils.debug > 1) {
					Utils.console.debug("vmLoadCallback:", inFile.name + ": putting data in memory", start, "-", start + length);
				}
				for (let i = 0; i < length; i += 1) {
					const byte = input.charCodeAt(i);

					this.poke((start + i) & 0xffff, byte); // eslint-disable-line no-bitwise
				}
				putInMemory = true;
			}
		}
		this.closein();
		return putInMemory;
	}

	load(name: string, start?: number): void { // optional start
		const inFile = this.inFile;

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
	}

	private vmLocate(stream: number, pos: number, vpos: number): void {
		const win = this.windowDataList[stream];

		win.pos = pos - 1;
		win.vpos = vpos - 1;
	}

	locate(stream: number, pos: number, vpos: number): void {
		stream = this.vmInRangeRound(stream, 0, 7, "LOCATE");
		pos = this.vmInRangeRound(pos, 1, 255, "LOCATE");
		vpos = this.vmInRangeRound(vpos, 1, 255, "LOCATE");

		this.vmDrawUndrawCursor(stream); // undraw
		this.vmLocate(stream, pos, vpos);
		this.vmDrawUndrawCursor(stream); // draw
	}

	log(n: number): number {
		this.vmAssertNumber(n, "LOG");
		if (n <= 0) {
			throw this.vmComposeError(Error(), 6, "LOG " + n);
		}
		return Math.log(n);
	}

	log10(n: number): number {
		this.vmAssertNumber(n, "LOG10");
		if (n <= 0) {
			throw this.vmComposeError(Error(), 6, "LOG10 " + n);
		}
		return Math.log10(n);
	}

	private static fnLowerCase(match: string) {
		return match.toLowerCase();
	}

	lower$(s: string): string {
		this.vmAssertString(s, "LOWER$");

		s = s.replace(/[A-Z]/g, CpcVm.fnLowerCase); // replace only characters A-Z
		return s;
	}

	mask(mask: number | undefined, first?: number): void { // one of mask, first is optional
		if (mask === undefined && first === undefined) {
			throw this.vmComposeError(Error(), 22, "MASK"); // Operand missing
		}

		if (mask !== undefined) {
			mask = this.vmInRangeRound(mask, 0, 255, "MASK");
			this.canvas.setMask(mask);
		}

		if (first !== undefined) {
			first = this.vmInRangeRound(first, 0, 1, "MASK");
			this.canvas.setMaskFirst(first);
		}
	}

	max(...args: number[]): number | string {
		if (!args.length) {
			throw this.vmComposeError(Error(), 22, "MAX"); // Operand missing
		} else if (args.length === 1) { // if just one argument, return it, even if it is a string
			if (typeof args[0] !== "number" && !this.quiet) {
				Utils.console.warn("MAX: Not a number:", args[0]);
			}
			return args[0];
		}

		for (let i = 0; i < args.length; i += 1) {
			this.vmAssertNumber(args[i], "MAX");
		}
		return Math.max.apply(null, args);
	}

	memory(n: number): void {
		n = this.vmRound2Complement(n, "MEMORY");

		if (n < CpcVm.minHimem || n > this.minCharHimem) {
			throw this.vmComposeError(Error(), 7, "MEMORY " + n); // Memory full
		}
		this.himemValue = n;
	}

	merge(name: string): void {
		const inFile = this.inFile;

		name = this.vmAdaptFilename(name, "MERGE");
		this.closein();
		inFile.open = true;
		inFile.command = "merge";
		inFile.name = name;
		inFile.fnFileCallback = this.fnCloseinHandler;
		this.vmStop("fileLoad", 90);
	}

	mid$(s: string, start: number, len?: number): string { // as function; len is optional
		this.vmAssertString(s, "MID$");
		start = this.vmInRangeRound(start, 1, 255, "MID$");
		if (len !== undefined) {
			len = this.vmInRangeRound(len, 0, 255, "MID$");
		}
		return s.substr(start - 1, len);
	}

	mid$Assign(s: string, start: number, len: number | undefined, newString: string): string {
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
	}

	min(...args: number[]): number | string {
		if (!args.length) {
			throw this.vmComposeError(Error(), 22, "MIN"); // Operand missing
		} else if (args.length === 1) { // if just one argument, return it, even if it is a string
			if (typeof args[0] !== "number" && !this.quiet) {
				Utils.console.warn("MIN: Not a number:", args[0]);
			}
			return args[0];
		}

		for (let i = 0; i < args.length; i += 1) {
			this.vmAssertNumber(args[i], "MIN");
		}
		return Math.min.apply(null, args);
	}

	// mod

	// changing the mode without clearing the screen (called by rsx |MODE)
	vmChangeMode(mode: number): void {
		this.modeValue = mode;

		const winData = CpcVm.winData[this.modeValue];

		for (let i = 0; i < CpcVm.streamCount - 2; i += 1) { // for window streams
			const win = this.windowDataList[i];

			Object.assign(win, winData);
		}
		this.canvas.changeMode(mode);
	}

	mode(mode: number): void {
		mode = this.vmInRangeRound(mode, 0, 3, "MODE");
		this.modeValue = mode;
		this.vmResetWindowData(false); // do not reset pen and paper
		this.outBuffer = ""; // clear console
		this.canvas.setMode(mode); // does not clear canvas

		this.canvas.clearFullWindow(); // always with paper 0 (SCR MODE CLEAR)
		this.textCanvas.clearFullWindow();
	}

	move(x: number, y: number, gPen?: number, gColMode?: number): void {
		x = this.vmInRangeRound(x, -32768, 32767, "MOVE");
		y = this.vmInRangeRound(y, -32768, 32767, "MOVE");
		this.vmDrawMovePlot("MOVE", gPen, gColMode);
		this.canvas.move(x, y);
	}

	mover(x: number, y: number, gPen?: number, gColMode?: number): void {
		x = this.vmInRangeRound(x, -32768, 32767, "MOVER") + this.canvas.getXpos();
		y = this.vmInRangeRound(y, -32768, 32767, "MOVER") + this.canvas.getYpos();
		this.vmDrawMovePlot("MOVER", gPen, gColMode);
		this.canvas.move(x, y);
	}

	"new"(): void {
		this.clear();

		const lineParas: VmLineParas = {
			command: "new",
			stream: 0, // unused
			first: 0, // unused
			last: 0, // unused
			line: this.line // unused
		};

		this.vmStop("new", 90, false, lineParas);
	}

	onBreakCont(): void {
		this.breakGosubLine = -1;
		this.breakResumeLine = 0;
	}

	onBreakGosub(line: number): void {
		this.breakGosubLine = this.vmLineInRange(line, "ON BREAK GOSUB");
		this.breakResumeLine = 0;
	}

	onBreakStop(): void {
		this.breakGosubLine = 0;
		this.breakResumeLine = 0;
	}

	onErrorGoto(line: number): void {
		this.errorGotoLine = (line !== 0) ? this.vmLineInRange(line, "ON ERROR GOTO") : 0;
		if (!line && this.errorResumeLine) { // line=0 but an error to resume?
			throw this.vmComposeError(Error(), this.errorCode, "ON ERROR GOTO without RESUME from " + this.errorLine);
		}
	}

	onGosub(retLabel: string, n: number, ...args: number[]): void {
		n = this.vmInRangeRound(n, 0, 255, "ON GOSUB");

		let line: string | number;

		if (!n || n > args.length) { // out of range? => continue with line after onGosub
			if (Utils.debug > 0) {
				Utils.console.debug("onGosub: out of range: n=" + n + " in " + this.line);
			}
			line = retLabel;
		} else {
			line = this.vmLineInRange(args[n - 1], "ON GOSUB"); // n=1...
			if (this.gosubStack.length >= this.maxGosubStackLength) { // limit stack size (not necessary in JS, but...)
				throw this.vmComposeError(Error(), 7, "ON GOSUB " + n); // Memory full
			}
			this.gosubStack.push(retLabel);
		}
		this.vmGotoLine(line, "onGosub (n=" + n + ", ret=" + retLabel + ", line=" + line + ")");
	}

	onGoto(retLabel: string, n: number, ...args: number[]): void {
		n = this.vmInRangeRound(n, 0, 255, "ON GOTO");

		let line: string | number;

		if (!n || n > args.length) { // out of range? => continue with line after onGoto
			if (Utils.debug > 0) {
				Utils.console.debug("onGoto: out of range: n=" + n + " in " + this.line);
			}
			line = retLabel;
		} else {
			line = this.vmLineInRange(args[n - 1], "ON GOTO");
		}
		this.vmGotoLine(line, "onGoto (n=" + n + ", ret=" + retLabel + ", line=" + line + ")");
	}

	private static fnChannel2ChannelIndex(channel: number) {
		if (channel === 4) {
			channel = 2;
		} else {
			channel -= 1;
		}
		return channel;
	}

	onSqGosub(channel: number, line: number): void {
		channel = this.vmInRangeRound(channel, 1, 4, "ON SQ GOSUB");
		if (channel === 3) {
			throw this.vmComposeError(Error(), 5, "ON SQ GOSUB " + channel); // Improper argument
		}
		channel = CpcVm.fnChannel2ChannelIndex(channel);

		const sqTimer = this.sqTimer[channel];

		sqTimer.line = this.vmLineInRange(line, "ON SQ GOSUB");
		sqTimer.active = true;
		sqTimer.repeat = true; // means reloaded for sq
	}

	private vmOpeninCallback(input: string | null) {
		if (input !== null) {
			input = input.replace(/\r\n/g, "\n"); // remove CR (maybe from ASCII file in "binary" form)
			if (input.endsWith("\n")) {
				input = input.substr(0, input.length - 1); // remove last "\n" (TTT: also for data files?)
			}

			const inFile = this.inFile;

			inFile.fileData = input.split("\n");
		} else {
			this.closein();
		}
	}

	openin(name: string): void {
		name = this.vmAdaptFilename(name, "OPENIN");

		const inFile = this.inFile;

		if (!inFile.open) {
			if (name) {
				inFile.open = true;
				inFile.command = "openin";
				inFile.name = name;
				inFile.fnFileCallback = this.fnOpeninHandler;
				this.vmStop("fileLoad", 90);
			}
		} else {
			throw this.vmComposeError(Error(), 27, "OPENIN " + inFile.name); // file already open
		}
	}

	openout(name: string): void {
		const outFile = this.outFile;

		if (outFile.open) {
			throw this.vmComposeError(Error(), 27, "OPENOUT " + outFile.name); // file already open
		}
		name = this.vmAdaptFilename(name, "OPENOUT");

		outFile.open = true;
		outFile.command = "openout";
		outFile.name = name;
		outFile.fileData = []; // no data yet
		outFile.typeString = "A"; // ASCII
	}

	// or

	origin(xOff: number, yOff: number, xLeft?: number, xRight?: number, yTop?: number, yBottom?: number): void { // parameters starting from xLeft are optional
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
	}

	vmSetRamSelect(bank: number): void {
		// we support RAM select for banks 0,4... (so not for 1 to 3)
		if (!bank) {
			this.ramSelect = 0;
		} else if (bank >= 4) {
			this.ramSelect = bank - 3; // bank 4 gets position 1
		}
	}

	vmSetCrtcData(byte: number): void {
		const crtcReg = this.crtcReg,
			crtcData = this.crtcData;

		crtcData[crtcReg] = byte;
		if (crtcReg === 12 || crtcReg === 13) { // screen offset changed
			const offset = (((crtcData[12] || 0) & 0x03) << 9) | ((crtcData[13] || 0) << 1); // eslint-disable-line no-bitwise

			this.vmSetScreenOffset(offset);
		}
	}

	out(port: number, byte: number): void {
		port = this.vmRound2Complement(port, "OUT");
		byte = this.vmInRangeRound(byte, 0, 255, "OUT");

		const portHigh = port >> 8; // eslint-disable-line no-bitwise

		if (portHigh === 0x7f) { // 7Fxx = RAM select
			this.vmSetRamSelect(byte - 0xc0);
		} else if (portHigh === 0xbc) { // limited support for CRTC 12, 13
			this.crtcReg = byte % 14;
		} else if (portHigh === 0xbd) {
			this.vmSetCrtcData(byte);
			this.crtcData[this.crtcReg] = byte;
		} else if (Utils.debug > 0) {
			Utils.console.debug("OUT", Number(port).toString(16), byte, ": unknown port");
		}
	}

	paper(stream: number, paper: number): void {
		stream = this.vmInRangeRound(stream, 0, 7, "PAPER");
		paper = this.vmInRangeRound(paper, 0, 15, "PAPER");

		const win = this.windowDataList[stream];

		win.paper = paper;
	}

	vmGetCharDataByte(addr: number): number {
		const dataPos = (addr - 1 - this.minCharHimem) % 8,
			char = this.minCustomChar + (addr - 1 - dataPos - this.minCharHimem) / 8,
			charData = this.canvas.getCharData(char);

		return charData[dataPos];
	}

	vmSetCharDataByte(addr: number, byte: number): void {
		const dataPos = (addr - 1 - this.minCharHimem) % 8,
			char = this.minCustomChar + (addr - 1 - dataPos - this.minCharHimem) / 8,
			charData = this.canvas.getCharData(char),
			charDataCopy = charData.slice(); // we need a copy to not modify original data

		charDataCopy[dataPos] = byte; // change one byte
		this.canvas.setCustomChar(char, charDataCopy);
	}

	peek(addr: number): number {
		addr = this.vmRound2Complement(addr, "PEEK");
		// check two higher bits of 16 bit address to get 16K page
		const page = addr >> 14; // eslint-disable-line no-bitwise
		let byte: number | null;

		if (page === this.screenPage) { // screen memory page?
			byte = this.canvas.getByte(addr); // get byte from screen memory
			if (byte === null) { // byte not visible on screen?
				byte = this.mem[addr] || 0; // get it from our memory
			}
		} else if (page === 1 && this.ramSelect) { // memory mapped RAM with page 1=0x4000..0x7fff?
			addr = (this.ramSelect - 1) * 0x4000 + 0x10000 + addr;
			byte = this.mem[addr] || 0;
		} else if (addr > this.minCharHimem && addr <= this.maxCharHimem) { // character map?
			byte = this.vmGetCharDataByte(addr);
		} else {
			byte = this.mem[addr] || 0;
		}
		return byte;
	}

	pen(stream: number, pen: number | undefined, transparent?: number): void {
		stream = this.vmInRangeRound(stream, 0, 7, "PEN");
		if (pen !== undefined) {
			const win = this.windowDataList[stream];

			pen = this.vmInRangeRound(pen, 0, 15, "PEN");
			win.pen = pen;
		}

		if (transparent !== undefined) {
			transparent = this.vmInRangeRound(transparent, 0, 1, "PEN");
			this.vmSetTransparentMode(stream, transparent);
		}
	}

	pi(): number { // eslint-disable-line class-methods-use-this
		return Math.PI; // or less precise: 3.14159265
	}

	plot(x: number, y: number, gPen?: number, gColMode?: number): void { // 2, up to 4 parameters
		x = this.vmInRangeRound(x, -32768, 32767, "PLOT");
		y = this.vmInRangeRound(y, -32768, 32767, "PLOT");
		this.vmDrawMovePlot("PLOT", gPen, gColMode);
		this.canvas.plot(x, y);
	}

	plotr(x: number, y: number, gPen?: number, gColMode?: number): void {
		x = this.vmInRangeRound(x, -32768, 32767, "PLOTR") + this.canvas.getXpos();
		y = this.vmInRangeRound(y, -32768, 32767, "PLOTR") + this.canvas.getYpos();
		this.vmDrawMovePlot("PLOTR", gPen, gColMode);
		this.canvas.plot(x, y);
	}

	poke(addr: number, byte: number): void {
		addr = this.vmRound2Complement(addr, "POKE address");
		byte = this.vmInRangeRound(byte, 0, 255, "POKE byte");

		// check two higher bits of 16 bit address to get 16K page
		const page = addr >> 14; // eslint-disable-line no-bitwise

		if (page === 1 && this.ramSelect) { // memory mapped RAM with page 1=0x4000..0x7fff?
			addr = (this.ramSelect - 1) * 0x4000 + 0x10000 + addr;
		} else if (page === this.screenPage) { // screen memory page?
			this.canvas.setByte(addr, byte); // write byte also to screen memory
		} else if (addr > this.minCharHimem && addr <= this.maxCharHimem) { // character map?
			this.vmSetCharDataByte(addr, byte);
		}
		this.mem[addr] = byte;
	}

	pos(stream: number): number {
		stream = this.vmInRangeRound(stream, 0, 9, "POS");

		let pos: number;

		if (stream < 8) {
			pos = this.vmGetAllowedPosOrVpos(stream, false) + 1; // get allowed pos
		} else if (stream === 8) { // printer position (starting with 1)
			pos = 1; // TODO
		} else { // stream 9: number of characters written since last CR (\r), \n in CpcEmu, starting with one)
			const win = this.windowDataList[stream];

			pos = win.pos + 1;
		}
		return pos;
	}

	private vmGetAllowedPosOrVpos(stream: number, vpos: boolean) {
		const win = this.windowDataList[stream],
			left = win.left,
			right = win.right,
			top = win.top,
			bottom = win.bottom;
		let x = win.pos,
			y = win.vpos;

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
	}

	private vmMoveCursor2AllowedPos(stream: number) {
		const win = this.windowDataList[stream],
			left = win.left,
			right = win.right,
			top = win.top,
			bottom = win.bottom;
		let	x = win.pos,
			y = win.vpos;

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
				this.textCanvas.windowScrollDown(left, right, top, bottom, win.paper);
			}
		}

		if (y > (bottom - top)) {
			y = bottom - top;
			if (stream < 8) {
				this.canvas.windowScrollUp(left, right, top, bottom, win.paper);
				this.textCanvas.windowScrollUp(left, right, top, bottom, win.paper);
			}
		}
		win.pos = x;
		win.vpos = y;
	}

	private vmPrintChars(stream: number, str: string) {
		const win = this.windowDataList[stream];

		if (!win.textEnabled) {
			if (Utils.debug > 0) {
				Utils.console.debug("vmPrintChars: text output disabled:", str);
			}
			return;
		}

		// put cursor in next line if string does not fit in line any more
		this.vmMoveCursor2AllowedPos(stream);
		if (win.pos && (win.pos + str.length > (win.right + 1 - win.left))) {
			win.pos = 0;
			win.vpos += 1; // "\r\n", newline if string does not fit in line
		}
		for (let i = 0; i < str.length; i += 1) {
			const char = CpcVm.vmGetCpcCharCode(str.charCodeAt(i));

			this.vmMoveCursor2AllowedPos(stream);
			this.canvas.printChar(char, win.pos + win.left, win.vpos + win.top, win.pen, win.paper, win.transparent);
			this.textCanvas.printChar(char, win.pos + win.left, win.vpos + win.top, win.pen, win.paper, win.transparent);
			win.pos += 1;
		}
	}

	private vmControlSymbol(para: string) {
		const paraList: number[] = [];

		for (let i = 0; i < para.length; i += 1) {
			paraList.push(para.charCodeAt(i));
		}

		const char = paraList[0];

		if (char >= this.minCustomChar) {
			this.symbol.apply(this, paraList as [char: number, ...args: number[]]);
		} else if (Utils.debug > 0) {
			Utils.console.debug("vmControlSymbol: define SYMBOL ignored:", char);
		}
	}

	private vmControlWindow(para: string, stream: number) {
		const paraList = [];

		// args in para: left, right, top, bottom (all -1 !)
		for (let i = 0; i < para.length; i += 1) {
			let value = para.charCodeAt(i) + 1; // control ranges start with 0!

			value %= 256;
			if (!value) {
				value = 1; // avoid error
			}
			paraList.push(value);
		}
		this.window(stream, paraList[0], paraList[1], paraList[2], paraList[3]);
	}

	private vmHandleControlCode(code: number, para: string, stream: number) { // eslint-disable-line complexity
		const win = this.windowDataList[stream],
			out = ""; // no controls for text window

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
			this.textCanvas.fillTextBox(win.left + win.pos, win.top + win.vpos, 1, 1); // clear character under cursor
			break;
		case 0x11: // DC1
			this.vmMoveCursor2AllowedPos(stream);
			this.canvas.fillTextBox(win.left, win.top + win.vpos, win.pos + 1, 1, win.paper); // clear line up to cursor
			this.textCanvas.fillTextBox(win.left, win.top + win.vpos, win.pos + 1, 1, win.paper); // clear line up to cursor
			break;
		case 0x12: // DC2
			this.vmMoveCursor2AllowedPos(stream);
			this.canvas.fillTextBox(win.left + win.pos, win.top + win.vpos, win.right - win.left + 1 - win.pos, 1, win.paper); // clear line from cursor
			this.textCanvas.fillTextBox(win.left + win.pos, win.top + win.vpos, win.right - win.left + 1 - win.pos, 1, win.paper); // clear line from cursor
			break;
		case 0x13: // DC3
			this.vmMoveCursor2AllowedPos(stream);
			this.canvas.fillTextBox(win.left, win.top, win.right - win.left + 1, win.top - win.vpos, win.paper); // clear window up to cursor line -1
			this.canvas.fillTextBox(win.left, win.top + win.vpos, win.pos + 1, 1, win.paper); // clear line up to cursor (DC1)
			this.textCanvas.fillTextBox(win.left, win.top, win.right - win.left + 1, win.top - win.vpos, win.paper); // clear window up to cursor line -1
			this.textCanvas.fillTextBox(win.left, win.top + win.vpos, win.pos + 1, 1, win.paper); // clear line up to cursor (DC1)
			break;
		case 0x14: // DC4
			this.vmMoveCursor2AllowedPos(stream);
			this.canvas.fillTextBox(win.left + win.pos, win.top + win.vpos, win.right - win.left + 1 - win.pos, 1, win.paper); // clear line from cursor (DC2)
			this.canvas.fillTextBox(win.left, win.top + win.vpos + 1, win.right - win.left + 1, win.bottom - win.top - win.vpos, win.paper); // clear window from cursor line +1
			this.textCanvas.fillTextBox(win.left + win.pos, win.top + win.vpos, win.right - win.left + 1 - win.pos, 1, win.paper); // clear line from cursor (DC2)
			this.textCanvas.fillTextBox(win.left, win.top + win.vpos + 1, win.right - win.left + 1, win.bottom - win.top - win.vpos, win.paper); // clear window from cursor line +1
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
			Utils.console.warn("vmHandleControlCode: Unknown control code:", code);
			break;
		}
		return out;
	}

	private vmPrintCharsOrControls(stream: number, str: string) {
		let buf = "",
			out = "",
			i = 0;

		while (i < str.length) {
			const code = str.charCodeAt(i);

			i += 1;
			if (code <= 0x1f) { // control code?
				if (out !== "") {
					this.vmPrintChars(stream, out); // print chars collected so far
					out = "";
				}
				const paraCount = CpcVm.controlCodeParameterCount[code];

				if (i + paraCount <= str.length) {
					out += this.vmHandleControlCode(code, str.substr(i, paraCount), stream);
					i += paraCount;
				} else {
					buf = str.substr(i - 1); // not enough parameters, put code in buffer and wait for more
					i = str.length;
				}
			} else {
				out += String.fromCharCode(code);
			}
		}

		if (out !== "") {
			this.vmPrintChars(stream, out); // print chars collected so far
		}
		return buf;
	}

	private vmPrintGraphChars(str: string) {
		for (let i = 0; i < str.length; i += 1) {
			const char = CpcVm.vmGetCpcCharCode(str.charCodeAt(i));

			this.canvas.printGChar(char);
		}
	}

	print(stream: number, ...args: (string | number | PrintObjectType)[]): void { // eslint-disable-line complexity
		stream = this.vmInRangeRound(stream, 0, 9, "PRINT");
		const win = this.windowDataList[stream];

		if (stream < 8) {
			if (!win.tag) {
				this.vmDrawUndrawCursor(stream); // undraw
			}
		} else if (stream === 9) {
			if (!this.outFile.open) {
				throw this.vmComposeError(Error(), 31, "PRINT #" + stream); // File not open
			}
			this.outFile.stream = stream;
		}

		let buf = this.printControlBuf;

		for (let i = 0; i < args.length; i += 1) {
			const arg = args[i];
			let str: string;

			if (typeof arg === "object") { // delayed call for spc(), tab(), commaTab() with side effect (position)
				const specialArgs = arg.args;

				switch (arg.type) {
				case "commaTab":
					str = this.commaTab(stream);
					break;
				case "spc":
					str = this.spc(stream, specialArgs[0] as number);
					break;
				case "tab":
					str = this.tab(stream, specialArgs[0] as number);
					break;
				default:
					throw this.vmComposeError(Error(), 5, "PRINT " + arg.type); // Improper argument
				}
			} else if (typeof arg === "number") {
				str = ((arg >= 0) ? " " : "") + String(arg) + " ";
			} else { // e.g. string
				str = String(arg);
			}

			if (stream < 8) {
				if (win.tag) {
					this.vmPrintGraphChars(str);
				} else {
					if (buf.length) {
						str = buf + str;
					}
					buf = this.vmPrintCharsOrControls(stream, str);
				}
				this.outBuffer += str; // console
			} else if (stream === 8) { // printer?
				this.outBuffer += str; // put also in console
			} else { // stream === 9
				const lastCrPos = buf.lastIndexOf("\r");

				if (lastCrPos >= 0) {
					win.pos = str.length - lastCrPos; // number of characters written since last CR (\r)
				} else {
					win.pos += str.length;
				}

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
		} else if (stream === 9) {
			this.outFile.fileData.push(buf);
		}
	}

	rad(): void {
		this.degFlag = false;
	}

	// https://en.wikipedia.org/wiki/Jenkins_hash_function
	private static vmHashCode(s: string) {
		let hash = 0;

		/* eslint-disable no-bitwise */
		for (let i = 0; i < s.length; i += 1) {
			hash += s.charCodeAt(i);
			hash += hash << 10;
			hash ^= hash >> 6;
		}
		hash += hash << 3;
		hash ^= hash >> 11;
		hash += hash << 15;
		/* eslint-enable no-bitwise */
		return hash;
	}

	private vmRandomizeCallback() {
		const inputParas = this.vmGetStopObject().paras as VmInputParas,
			input = inputParas.input,
			value = CpcVm.vmVal(input); // convert to number (also binary, hex)
		let	inputOk = true;

		if (Utils.debug > 0) {
			Utils.console.debug("vmRandomizeCallback:", input);
		}
		if (isNaN(value)) {
			inputOk = false;
			inputParas.input = "";
			this.print(inputParas.stream, inputParas.message);
		} else {
			this.vmSetInputValues([value]);
		}
		return inputOk;
	}

	randomize(n?: number): void {
		const rndInit = 0x89656c07, // an arbitrary 32 bit number <> 0 (this one is used by the CPC)
			stream = 0;

		if (n === undefined) { // no argument? input...
			const msg = "Random number seed ? ";

			this.print(stream, msg);
			const inputParas: VmInputParas = {
				command: "randomize",
				stream: stream,
				message: msg,
				fnInputCallback: this.vmRandomizeCallback.bind(this),
				input: "",
				line: this.line // to repeat in case of break
			};

			this.vmStop("waitInput", 45, false, inputParas);
		} else { // n can also be floating point, so compute a hash value of n
			this.vmAssertNumber(n, "RANDOMIZE");
			n = CpcVm.vmHashCode(String(n));
			if (n === 0) {
				n = rndInit;
			}
			if (Utils.debug > 0) {
				Utils.console.debug("randomize:", n);
			}
			this.random.init(n);
		}
	}

	read(varType: string): string | number {
		this.vmAssertString(varType, "READ");
		const type = this.vmDetermineVarType(varType);
		let item: string | number;

		if (this.dataIndex < this.dataList.length) {
			const dataItem = this.dataList[this.dataIndex];

			this.dataIndex += 1;
			if (dataItem === undefined) { // empty arg?
				item = type === "$" ? "" : 0; // set arg depending on expected type
			} else if (type !== "$") { // not string expected? => convert to number (also binary, hex)
				// Note : Using a number variable to read a string would cause a syntax error on a real CPC. We cannot detect it since we get always strings.
				item = this.val(String(dataItem));
			} else {
				item = dataItem;
			}
			item = this.vmAssign(varType, item); // maybe rounding for type I
		} else {
			throw this.vmComposeError(Error(), 4, "READ"); // DATA exhausted
		}
		return item;
	}

	release(channelMask: number): void {
		channelMask = this.vmInRangeRound(channelMask, 0, 7, "RELEASE");
		this.soundClass.release(channelMask);
	}

	// rem

	remain(timerNumber: number): number {
		timerNumber = this.vmInRangeRound(timerNumber, 0, 3, "REMAIN");

		const timerEntry = this.timerList[timerNumber];
		let remain = 0;

		if (timerEntry.active) {
			remain = timerEntry.nextTimeMs - Date.now();
			remain /= CpcVm.frameTimeMs;
			timerEntry.active = false; // switch off timer
		}
		return remain;
	}

	renum(newLine = 10, oldLine = 1, step = 10, keep = 65535): void { // varargs: new number, old number, step, keep line (only for |renum)
		newLine = this.vmInRangeRound(newLine, 1, 65535, "RENUM");
		oldLine = this.vmInRangeRound(oldLine, 1, 65535, "RENUM");
		step = this.vmInRangeRound(step, 1, 65535, "RENUM");
		keep = this.vmInRangeRound(keep, 1, 65535, "RENUM");

		const lineRenumParas: VmLineRenumParas = {
			command: "renum",
			stream: 0, // unused
			line: this.line, // unused
			newLine: newLine,
			oldLine: oldLine,
			step: step,
			keep: keep // keep lines
		};

		this.vmStop("renumLines", 85, false, lineRenumParas);
	}

	restore(line?: number): void {
		line = line === undefined ? 0 : this.vmLineInRange(line, "RESTORE");
		const dataLineIndex = this.dataLineIndex;
		// line = String(line);

		if (line in dataLineIndex) {
			this.dataIndex = dataLineIndex[line];
		} else {
			if (Utils.debug > 0) {
				Utils.console.debug("restore: search for dataLine >", line);
			}
			for (const dataLine in dataLineIndex) { // linear search a data line > line
				if (dataLineIndex.hasOwnProperty(dataLine)) {
					if (Number(dataLine) >= line) {
						dataLineIndex[line] = dataLineIndex[dataLine]; // set data index also for line
						break;
					}
				}
			}
			if (line in dataLineIndex) { // now found a data line?
				this.dataIndex = dataLineIndex[line];
			} else {
				if (Utils.debug > 0) {
					Utils.console.debug("restore", line + ": No DATA found starting at line");
				}
				this.dataIndex = this.dataList.length;
			}
		}
	}

	resume(line?: number): void { // resume, resume n
		if (this.errorGotoLine) {
			if (line === undefined) {
				line = this.errorResumeLine;
			} else {
				this.vmLineInRange(line, "RESUME");
			}
			this.vmGotoLine(line, "resume");
			this.errorResumeLine = 0;
		} else {
			throw this.vmComposeError(Error(), 20, String(line)); // Unexpected RESUME
		}
	}

	resumeNext(): void {
		if (!this.errorGotoLine || !this.errorResumeLine) {
			throw this.vmComposeError(Error(), 20, "RESUME NEXT"); // Unexpected RESUME
		}
		const resumeLineIndex = this.labelList.indexOf(this.errorResumeLine);

		if (resumeLineIndex < 0) {
			Utils.console.error("resumeNext: line not found: " + this.errorResumeLine);
			this.errorResumeLine = 0;
			return;
		}

		const line = this.labelList[resumeLineIndex + 1]; // get next line

		this.vmGotoLine(line, "resumeNext");
		this.errorResumeLine = 0;
	}

	"return"(): void {
		const line = this.gosubStack.pop();

		if (line === undefined) {
			throw this.vmComposeError(Error(), 3, ""); // Unexpected Return [in <line>]
		} else {
			this.vmGotoLine(line, "return");
		}
		if (line === this.breakResumeLine) { // end of break handler?
			this.breakResumeLine = 0; // can start another one
		}
		this.vmCheckTimerHandlers(); // if we are at end of a BASIC timer handler, delete handler flag
		if (this.vmCheckSqTimerHandlers()) { // same for sq timers, timer reloaded?
			this.fnCheckSqTimer(); // next one early
		}
	}

	right$(s: string, len: number): string {
		this.vmAssertString(s, "RIGHT$");
		len = this.vmInRangeRound(len, 0, 255, "RIGHT$");
		return s.slice(-len);
	}

	rnd(n?: number): number {
		if (n !== undefined) {
			this.vmAssertNumber(n, "RND");
		}

		let x: number;

		if (n === undefined || n > 0) {
			x = this.random.random();
			this.lastRnd = x;
		} else if (n < 0) {
			x = this.lastRnd || this.random.random();
		} else { // n === 0
			x = this.lastRnd || this.random.random();
		}
		return x;
	}

	round(n: number, decimals?: number): number {
		this.vmAssertNumber(n, "ROUND");
		decimals = this.vmInRangeRound(decimals || 0, -39, 39, "ROUND");

		const maxDecimals = 20 - Math.floor(Math.log10(n)); // limit for JS

		if (decimals >= 0 && decimals > maxDecimals) {
			decimals = maxDecimals;
		}
		// To avoid rounding errors: https://www.jacklmoore.com/notes/rounding-in-javascript
		return Number(Math.round(Number(n + "e" + decimals)) + "e" + ((decimals >= 0) ? "-" + decimals : "+" + -decimals));
	}

	private vmRunCallback(input: string, meta: FileMeta) {
		const inFile = this.inFile,
			putInMemory = input !== null && meta && (meta.typeString === "B" || inFile.start !== undefined);

		// TODO: we could put it in memory as we do it for LOAD

		if (input !== null) {
			const lineParas: VmLineParas = {
				command: "run",
				stream: 0, // unused
				first: inFile.line,
				last: 0, // unused
				line: this.line
			};

			this.vmStop("run", 95, false, lineParas);
		}
		this.closein();
		return putInMemory;
	}

	run(numOrString?: number | string): void {
		const inFile = this.inFile;

		if (typeof numOrString === "string") { // filename?
			const name = this.vmAdaptFilename(numOrString, "RUN");

			this.closein();
			inFile.open = true;
			inFile.command = "run";
			inFile.name = name;
			inFile.fnFileCallback = this.fnRunHandler;
			this.vmStop("fileLoad", 90);
		} else { // line number or no argument = undefined
			if (numOrString !== undefined) {
				this.vmLineInRange(numOrString, "RUN");
			}
			const lineParas: VmLineParas = {
				command: "run",
				stream: 0, // unused
				first: numOrString || 0,
				last: 0, // unused
				line: this.line
			};

			this.vmStop("run", 95, false, lineParas);
		}
	}

	save(name: string, type?: string, start?: number, length?: number, entry?: number): void { // varargs; parameter type,... are optional
		const outFile = this.outFile;

		name = this.vmAdaptFilename(name, "SAVE");
		if (!type) {
			type = "T"; // default is tokenized BASIC
		} else {
			type = String(type).toUpperCase();
		}

		const fileData: string[] = [];

		if (type === "B") { // binary
			start = this.vmRound2Complement(start, "SAVE");
			length = this.vmRound2Complement(length, "SAVE");

			if (entry !== undefined) {
				entry = this.vmRound2Complement(entry, "SAVE");
			}
			for (let i = 0; i < length; i += 1) {
				const address = (start + i) & 0xffff; // eslint-disable-line no-bitwise

				fileData[i] = String.fromCharCode(this.peek(address));
			}
		} else if ((type === "A" || type === "T" || type === "P") && start === undefined) {
			// ASCII or tokenized BASIC or protected BASIC, and no load address specified
			start = 368; // BASIC start
			// need file data from controller (text box)
		} else {
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
	}

	sgn(n: number): number {
		this.vmAssertNumber(n, "SGN");
		return Math.sign(n);
	}

	sin(n: number): number {
		this.vmAssertNumber(n, "SIN");
		return Math.sin((this.degFlag) ? Utils.toRadians(n) : n);
	}

	sound(state: number, period: number, duration?: number, volume?: number, volEnv?: number, toneEnv?: number, noise?: number): void {
		state = this.vmInRangeRound(state, 1, 255, "SOUND");
		period = this.vmInRangeRound(period, 0, 4095, "SOUND ,");

		const soundData: SoundData = {
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
		} else {
			this.soundData.push(soundData);
			this.vmStop("waitSound", 43);
			for (let i = 0; i < 3; i += 1) {
				if (state & (1 << i)) { // eslint-disable-line no-bitwise
					const sqTimer = this.sqTimer[i];

					sqTimer.active = false; // set onSq timer to inactive
				}
			}
		}
	}

	space$(n: number): string {
		n = this.vmInRangeRound(n, 0, 255, "SPACE$");
		return " ".repeat(n);
	}

	private spc(stream: number, n: number): string { // special spc function with additional parameter stream, which is called delayed by print (ROM &F277)
		stream = this.vmInRangeRound(stream, 0, 9, "SPC");
		n = this.vmInRangeRound(n, -32768, 32767, "SPC");

		let str = "";

		if (n >= 0) {
			const win = this.windowDataList[stream],
				width = win.right - win.left + 1;

			if (width) {
				n %= width;
			}
			str = " ".repeat(n);
		} else if (!this.quiet) {
			Utils.console.log("SPC: negative number ignored:", n);
		}
		return str;
	}

	speedInk(time1: number, time2: number): void { // default: 10,10
		time1 = this.vmInRangeRound(time1, 1, 255, "SPEED INK");
		time2 = this.vmInRangeRound(time2, 1, 255, "SPEED INK");
		this.canvas.setSpeedInk(time1, time2);
	}

	speedKey(delay: number, repeat: number): void {
		delay = this.vmInRangeRound(delay, 1, 255, "SPEED KEY");
		repeat = this.vmInRangeRound(repeat, 1, 255, "SPEED KEY");
		this.vmNotImplemented("SPEED KEY " + delay + " " + repeat);
	}

	speedWrite(n: number): void {
		n = this.vmInRangeRound(n, 0, 1, "SPEED WRITE");
		this.vmNotImplemented("SPEED WRITE " + n);
	}

	sq(channel: number): number {
		channel = this.vmInRangeRound(channel, 1, 4, "SQ");
		if (channel === 3) {
			throw this.vmComposeError(Error(), 5, "SQ " + channel); // Improper argument
		}
		channel = CpcVm.fnChannel2ChannelIndex(channel);
		const sq = this.soundClass.sq(channel),
			sqTimer = this.sqTimer[channel];

		// no space in queue and handler active?
		if (!(sq & 0x07) && sqTimer.active) { // eslint-disable-line no-bitwise
			sqTimer.active = false; // set onSq timer to inactive
		}
		return sq;
	}

	sqr(n: number): number {
		this.vmAssertNumber(n, "SQR");
		if (n < 0) {
			throw this.vmComposeError(Error(), 5, "SQR " + n); // Improper argument
		}
		return Math.sqrt(n);
	}

	// step

	stop(label: string): void {
		this.vmGotoLine(label, "stop");
		this.vmStop("stop", 60);
	}

	str$(n: number): string { // number (also hex or binary)
		this.vmAssertNumber(n, "STR$");
		return ((n >= 0) ? " " : "") + String(n);
	}

	string$(len: number, chr: number | string): string {
		len = this.vmInRangeRound(len, 0, 255, "STRING$");
		if (typeof chr === "number") {
			chr = this.vmInRangeRound(chr, 0, 255, "STRING$");
			chr = String.fromCharCode(chr); // chr$
		} else { // expect string
			this.vmAssertString(chr, "STRING$");
			chr = chr.charAt(0); // only one char
		}
		return chr.repeat(len);
	}

	// swap (window swap)

	symbol(char: number, ...args: number[]): void { // varargs (char, rows 1..8)
		char = this.vmInRangeRound(char, this.minCustomChar, 255, "SYMBOL");
		const charData: number[] = [];

		for (let i = 0; i < args.length; i += 1) { // start with 1, get available args
			const bitMask = this.vmInRangeRound(args[i], 0, 255, "SYMBOL");

			charData.push(bitMask);
		}
		// Note: If there are less than 8 rows, the others are assumed as 0 (actually empty)
		this.canvas.setCustomChar(char, charData);
	}

	symbolAfter(char: number): void {
		char = this.vmInRangeRound(char, 0, 256, "SYMBOL AFTER");

		if (this.minCustomChar < 256) { // symbol after <256 set?
			if (this.minCharHimem !== this.himemValue) { // himem changed?
				throw this.vmComposeError(Error(), 5, "SYMBOL AFTER " + char); // Improper argument
			}
		} else {
			this.maxCharHimem = this.himemValue; // no characters defined => use current himem
		}

		let minCharHimem = this.maxCharHimem - (256 - char) * 8;

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
	}

	private tab(stream: number, n: number): string { // special tab function with additional parameter stream, which is called delayed by print (ROM &F280)
		stream = this.vmInRangeRound(stream, 0, 9, "TAB");
		n = this.vmInRangeRound(n, -32768, 32767, "TAB");

		let	str = "";

		if (n > 0) {
			n -= 1;
			const win = this.windowDataList[stream],
				width = win.right - win.left + 1;

			if (width) {
				n %= width;
			}

			let count = n - win.pos;

			if (count < 0) { // does it fit until tab position?
				win.pos = win.right + 1;
				this.vmMoveCursor2AllowedPos(stream);
				count = n; // set tab in next line
			}
			str = " ".repeat(count);
		} else if (!this.quiet) {
			Utils.console.log("TAB: no tab for value", n);
		}
		return str;
	}

	tag(stream: number): void {
		stream = this.vmInRangeRound(stream, 0, 7, "TAG");
		const win = this.windowDataList[stream];

		win.tag = true;
	}

	tagoff(stream: number): void {
		stream = this.vmInRangeRound(stream, 0, 7, "TAGOFF");
		const win = this.windowDataList[stream];

		win.tag = false;
	}

	tan(n: number): number {
		this.vmAssertNumber(n, "TAN");
		return Math.tan((this.degFlag) ? Utils.toRadians(n) : n);
	}

	test(x: number, y: number): number {
		x = this.vmInRangeRound(x, -32768, 32767, "TEST");
		y = this.vmInRangeRound(y, -32768, 32767, "TEST");
		return this.canvas.test(x, y);
	}

	testr(x: number, y: number): number {
		x = this.vmInRangeRound(x, -32768, 32767, "TESTR") + this.canvas.getXpos();
		y = this.vmInRangeRound(y, -32768, 32767, "TESTR") + this.canvas.getYpos();
		return this.canvas.test(x, y);
	}

	time(): number {
		return ((Date.now() - this.startTime) * 300 / 1000) | 0; // eslint-disable-line no-bitwise
	}

	troff(): void {
		this.tronFlag1 = false;
	}

	tron(): void {
		this.tronFlag1 = true;
	}

	unt(n: number): number {
		n = this.vmInRangeRound(n, -32768, 65535, "UNT");
		if (n > 32767) { // undo 2th complement
			n -= 65536;
		}
		return n;
	}

	private static fnUpperCase(match: string) {
		return match.toUpperCase();
	}

	upper$(s: string): string {
		this.vmAssertString(s, "UPPER$");
		return s.replace(/[a-z]/g, CpcVm.fnUpperCase); // replace only characters a-z
	}

	using(format: string, ...args: (string | number)[]): string { // varargs
		const reFormat = /(!|&|\\ *\\|(?:\*\*|\$\$|\*\*\$)?\+?(?:#|,)+\.?#*(?:\^\^\^\^)?[+-]?)/g,
			formatList: string[] = [];

		this.vmAssertString(format, "USING");

		// We simulate format.split(reFormat) here since it does not work with IE8
		let index = 0,
			match: RegExpExecArray | null;

		while ((match = reFormat.exec(format)) !== null) {
			formatList.push(format.substring(index, match.index)); // non-format characters at the beginning
			formatList.push(match[0]);
			index = match.index + match[0].length;
		}
		if (index < format.length) { // non-format characters at the end
			formatList.push(format.substr(index));
		}

		if (formatList.length < 2) {
			if (!this.quiet) {
				Utils.console.warn("USING: empty or invalid format:", format);
			}
			throw this.vmComposeError(Error(), 5, "USING format " + format); // Improper argument
		}

		let formatIndex = 0,
			s = "";

		for (let i = 0; i < args.length; i += 1) { // start with 1
			formatIndex %= formatList.length;
			if (formatIndex === 0) {
				s += formatList[formatIndex]; // non-format characters at the beginning of the format string
				formatIndex += 1;
			}
			if (formatIndex < formatList.length) {
				const arg = args[i];

				s += this.vmUsingFormat(formatList[formatIndex], arg); // format characters
				formatIndex += 1;
			}
			if (formatIndex < formatList.length) {
				s += formatList[formatIndex]; // following non-format characters
				formatIndex += 1;
			}
		}
		return s;
	}

	private static vmVal(s: string) {
		let num = 0;

		s = s.trim().toLowerCase();
		if (s.startsWith("&x")) { // binary &x
			s = s.slice(2);
			num = parseInt(s, 2);
		} else if (s.startsWith("&h")) { // hex &h
			s = s.slice(2);
			num = parseInt(s, 16);
		} else if (s.startsWith("&")) { // hex &
			s = s.slice(1);
			num = parseInt(s, 16);
		} else if (s !== "") { // not empty string?
			num = parseFloat(s);
		}
		return num;
	}

	val(s: string): number {
		this.vmAssertString(s, "VAL");
		let num = CpcVm.vmVal(s);

		if (isNaN(num)) {
			num = 0;
		}
		return num;
	}

	vpos(stream: number): number {
		stream = this.vmInRangeRound(stream, 0, 7, "VPOS");
		return this.vmGetAllowedPosOrVpos(stream, true) + 1;
	}

	wait(port: number, mask: number, inv?: number): void { // optional inv
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
	}

	// wend

	// while

	width(width: number): void {
		width = this.vmInRangeRound(width, 1, 255, "WIDTH");

		const win = this.windowDataList[8];

		win.right = win.left + width;
	}

	window(stream: number, left: number, right: number, top: number, bottom: number): void {
		stream = this.vmInRangeRound(stream, 0, 7, "WINDOW");

		left = this.vmInRangeRound(left, 1, 255, "WINDOW");
		right = this.vmInRangeRound(right, 1, 255, "WINDOW");
		top = this.vmInRangeRound(top, 1, 255, "WINDOW");
		bottom = this.vmInRangeRound(bottom, 1, 255, "WINDOW");

		const win = this.windowDataList[stream];

		win.left = Math.min(left, right) - 1;
		win.right = Math.max(left, right) - 1;
		win.top = Math.min(top, bottom) - 1;
		win.bottom = Math.max(top, bottom) - 1;

		win.pos = 0;
		win.vpos = 0;
	}

	windowSwap(stream1: number, stream2?: number): void { // stream numbers; stream2 is optional
		stream1 = this.vmInRangeRound(stream1, 0, 7, "WINDOW SWAP");
		stream2 = this.vmInRangeRound(stream2 || 0, 0, 7, "WINDOW SWAP");

		const temp = this.windowDataList[stream1];

		this.windowDataList[stream1] = this.windowDataList[stream2];
		this.windowDataList[stream2] = temp;
	}

	write(stream: number, ...args: (string | number)[]): void { // varargs
		stream = this.vmInRangeRound(stream, 0, 9, "WRITE");

		const writeArgs = [];
		let str: string;

		for (let i = 0; i < args.length; i += 1) {
			const arg = args[i];

			if (typeof arg === "number") {
				str = String(arg);
			} else {
				str = '"' + String(arg) + '"';
			}
			writeArgs.push(str);
		}
		str = writeArgs.join(",");

		if (stream < 8) {
			const win = this.windowDataList[stream];

			if (win.tag) {
				this.vmPrintGraphChars(str + "\r\n");
			} else {
				this.vmDrawUndrawCursor(stream); // undraw
				this.vmPrintChars(stream, str);
				this.vmPrintCharsOrControls(stream, "\r\n");
				this.vmDrawUndrawCursor(stream); // draw
			}
			this.outBuffer += str + "\n"; // console
		} else if (stream === 8) { // printer?
			this.outBuffer += str + "\n"; // console
		} else if (stream === 9) {
			this.outFile.stream = stream;
			if (!this.outFile.open) {
				throw this.vmComposeError(Error(), 31, "WRITE #" + stream); // File not open
			}
			this.outFile.fileData.push(str + "\n"); // real CPC would use CRLF, we use LF
			// currently we print data also to console...
		}
	}

	xpos(): number {
		return this.canvas.getXpos();
	}

	ypos(): number {
		return this.canvas.getYpos();
	}

	zone(n: number): void {
		this.zoneValue = this.vmInRangeRound(n, 1, 255, "ZONE");
	}

	// access some private stuff for testing

	private vmTestGetTimerList(): TimerEntry[] {
		return this.timerList;
	}

	private vmTestGetWindowDataList(): WindowData[] {
		return this.windowDataList;
	}

	/* eslint-disable no-invalid-this */
	readonly vmInternal = {
		getTimerList: this.vmTestGetTimerList,
		getWindowDataList: this.vmTestGetWindowDataList,
		commaTab: this.commaTab,
		spc: this.spc,
		tab: this.tab
	}
	/* eslint-enable no-invalid-this */
}
