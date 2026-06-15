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
