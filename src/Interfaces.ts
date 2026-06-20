// Interfaces.ts - Interfaces
// (c) Marco Vieth, 2020
// https://benchmarko.github.io/CPCBasicTS/
//
//

//import { CustomError } from "./Utils";
export interface CustomError extends Error {
	value: string
	pos: number
	len?: number,
	line?: number | string
	hidden?: boolean
	shortMessage?: string
	errCode?: number
}

export type LoadScriptFn = (url: string, fnSuccess: (url2: string, key: string) => void, fnError: (url2: string, key: string) => void, key: string) => void;

export interface IOutput {
    text: string
    error?: CustomError
}

export type ConfigEntryType = string | number | boolean;

export type ConfigType = Record<string, ConfigEntryType>;

/*
// TODO
export type ConfigTypeNew = {
		arrayBounds: boolean,
		autorun: boolean,
		basicVersion: "1.1" | "1.0", // "1.1" or "1.0"
		bench: number, // debug: number of parse bench loops
		canvasType: "graphics" | "text" | "none", // "graphics", "text", "none"
		databaseDirs: string, // example base directories (comma separated)
		database: string, // examples, apps, saved
		debug: number,
		example: string,
		exampleIndex: string, // example index for every databaseDir
		implicitLines: boolean, // allow implicit line numbers
		input: string, // keyboard input when starting the app
		integerOverflow: boolean, // check for integer overflow
		kbdLayout: "alphanum" | "alpha" | "num", // "alphanum", "alpha", "num"
		linesOnLoad: boolean, // add missing line numbers on load
		dragElements: boolean,
		palette: "color" | "green" | "grey", // "color", "green", "grey"
		prettyBrackets: boolean, // pretty print: brackets
		prettyColons: boolean, // pretty print: colons
		prettyLowercaseVars: boolean, // pretty print: lowercase variables
		prettySpace: boolean, // pretty print: spaces
		processFileImports: boolean, // open ZIP, DSK files on import
		random: "cpc" | "minstd", // "cpc" or "minstd"
		selectDataFiles: boolean, // select data files in example selection
		showConsoleLog: boolean,
		showCpc: boolean,
		showDisass: boolean,
		showExport: boolean,
		showGallery: boolean,
		showInput: boolean,
		showInp2: boolean,
		showKbd: boolean,
		showKbdSettings: boolean,
		showMore: boolean,
		showOutput: boolean,
		showPretty: boolean,
		showRenum: boolean,
		showResult: boolean,
		showSettings: boolean,
		showVariable: boolean,
		showView: boolean,
		sound: boolean,
		speed: number, // e.g 100
		trace: boolean // trace code
};
*/
export interface IStorage {
	readonly length: number;
	clear(): void;
	getItem(key: string): string | null;
	key(index: number): string | null;
	removeItem(key: string): void;
	setItem(key: string, value: string): void;
	[key: string]: any;
}

/*
export interface ILocalStorageXX {
	clear: () => undefined,
	getItem: (key: string) => string | null,
	key: (index: number) => string | null,
	removeItem: (key: string) => undefined,
	setItem: (key: string, value: string) => undefined,
	length: number;
}
*/

export interface DatabaseEntry {
	text: string
	title: string
	src: string
	script?: string
	loaded?: boolean
}

export type DatabasesType = Record<string, DatabaseEntry>;
export interface VmBaseParas {
	command: string
	stream: number
	line: string | number
}
export interface VmLineParas extends VmBaseParas { // delete lines, list lines, edit line, run line
	first?: number // (req)
	last?: number // (req)
}
export interface VmLineRenumParas extends VmBaseParas { // renum lines
	newLine?: number // (req)
	oldLine?: number // (req)
	step?: number // (req)
	keep?: number // (req)
}
export interface VmFileParas extends VmBaseParas {
	fileMask?: string // (req) CAT, |DIR, |ERA
	newName?: string // |REN
	oldName?: string // |REN
}
export interface VmInputParas extends VmBaseParas {
	input: string // (req)
	message: string // (req)
	noCRLF?: string
	types?: string[]
	fnInputCallback: () => boolean
}

export type VmStopParas = VmFileParas | VmInputParas | VmLineParas | VmLineRenumParas

// Same as VariableValue in Variables.ts
export type VariableValue = string | number | Function | [] | VariableValue[]; // eslint-disable-line @typescript-eslint/no-unsafe-function-type

export interface ICpcVm {
    line: string | number
    vmComposeError(error: Error, err: number, errInfo: string): CustomError
    vmStop(reason: string, priority: number, force?: boolean, paras?: VmStopParas): void
    vmInRangeRound(n: number | undefined, min: number, max: number, err: string): number
    vmAdaptFilename(name: string, err: string): string
    vmGetVariableByIndex(index: number): VariableValue
    vmChangeMode(mode: number): void
    renum(newLine: number, oldLine: number, step: number, keep: number): void
    vmNotImplemented(name: string): void
}

export type RsxCommandType = (this: ICpcVm, ...args: (string|number)[]) => void
export interface ICpcVmRsx {
    getRsxCommands: () => Record<string, RsxCommandType>
}
export interface ExampleEntry {
	key: string
	title: string
	meta: string // D=data
	script?: string
	rsx?: ICpcVmRsx
	loaded?: boolean
}

export type ExamplesType = Record<string, Record<string, ExampleEntry>>;

export interface IModel {
    getProperty<T extends ConfigEntryType>(property: string): T; //TODO: property: ModelPropID
	setProperty<T extends ConfigEntryType>(property: string, value: T): void; // property: ModelPropID
	getAllProperties(): ConfigType;
	getAllInitialProperties(): ConfigType;
	getChangedProperties(): ConfigType;
	addDatabases(db: DatabasesType): void;
	getAllDatabases(): DatabasesType;
	getDatabase(): DatabaseEntry;
	getAllExamples(): {	[x: string]: ExampleEntry; };
	getExample(key: string): ExampleEntry;
	setExample(example: ExampleEntry): void;
	removeExample(key: string): void;
};

// # Canvas

export type CanvasCharType = number[]; // 8 bytes char bitmap

export interface ICanvasVm {
    //getOptions(): CanvasOptions
    //setOptions(options: Partial<CanvasOptions>): void
    reset(): void
    resetCustomChars(): void
    //startUpdateCanvas(): void
    //stopUpdateCanvas(): void
    setScreenOffset(offset: number): void
    updateColorsAndCanvasImmediately(inkList: number[]): void
    updateSpeedInk(): void
    setCustomChar(char: number, charData: CanvasCharType): void
    getCharData(char: number): CanvasCharType
    setDefaultInks(): void
    //onCanvasClick(event: MouseEvent): void
    //onWindowClick(_event: Event): void
    getXpos(): number
    getYpos(): number
    fillTextBox(left: number, top: number, width: number, height: number, paper: number): void
    getByte(addr: number): number | null
    setByte(addr: number, byte: number): void
    draw(x: number, y: number): void
    move(x: number, y: number): void
    plot(x: number, y: number): void
    test(x: number, y: number): number
    setInk(pen: number, ink1: number, ink2: number): boolean
    setBorder(ink1: number, ink2: number): void
    setGPen(gPen: number): void
    setGPaper(gPaper: number): void
    setGTransparentMode(transparent: boolean): void
    printGChar(char: number): void
    printChar(char: number, x: number, y: number, pen: number, paper: number, transparent: boolean): void
    drawCursor(x: number, y: number, pen: number, paper: number): void
    readChar(x: number, y: number, pen: number, paper: number): number
    fill(fillPen: number): void
    setOrigin(xOrig: number, yOrig: number): void
    getXOrigin(): number
    getYOrigin(): number
    setGWindow(xLeft: number, xRight: number, yTop: number, yBottom: number): void
    setGColMode(gColMode: number): void
    clearTextWindow(left: number, right: number, top: number, bottom: number, paper: number): void
    clearGraphicsWindow(): void
    clearFullWindow(): void
    windowScrollUp(left: number, right: number, top: number, bottom: number, paper: number): void
    windowScrollDown(left: number, right: number, top: number, bottom: number, paper: number): void
    setSpeedInk(time1: number, time2: number): void
    setMask(mask: number): void
    setMaskFirst(maskFirst: number): void
    getMode(): number
    changeMode(mode: number): void
    setMode(mode: number): void
    //takeScreenShot(): string
}

// # Keyboad

export interface CpcKeyExpansionsOptions {
	cpcKey: number
	repeat: number
	normal?: number
	shift?: number
	ctrl?: number
}

export interface IKeyboard {
	reset(): void,
	resetExpansionTokens(): void,
	resetCpcKeysExpansions(): void,
	clearInput(): void,
	getKeyFromBuffer(): string,
	putKeyInBuffer(key: string, triggerOnKeyDown?: boolean): void,
	getKeyState(cpcKeyCode: number): number,
	getJoyState(joy: number): number,
	setExpansionToken(token: number, string: string): void,
	setCpcKeyExpansion(options: CpcKeyExpansionsOptions): void
}


// # Sound

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

export interface ISound {
	reset(): void,
	resetQueue(): void,
	testCanQueue(state: number): boolean,
	sound(soundData: SoundData): void,
	setVolEnv(volEnv: number, volEnvData: VolEnvData[]): void,
	setToneEnv(toneEnv: number, toneEnvData: ToneEnvData[]): void,
	scheduler(): void,
	release(releaseMask: number): void,
	sq(n: number): number
}

// # Core

export interface ICore {
    setDebug(debug: number): void;
    getModel(): IModel;
	init(): void;
    addIndex(_dir: string, input: Record<string, unknown> | (() => void)): void;
    addItem(key: string, input: string | (() => void)): void;
    addRsx(key: string, RsxConstructor: new () => ICpcVmRsx): string;
    parseArgs(args: string[], config: Record<string, ConfigEntryType>): void;
}

export interface INodeUtils {
    nodeMain(core: ICore): void;
}

export interface IUI {
    //addOutputText(str: string, needCls?: boolean, hasGraphics?: boolean): void;
    getCurrentDataKey(): string;
    onWindowLoadContinue(core: ICore): void;
}
