import { BasicLexer } from "../BasicLexer";
import { BasicParser } from "../BasicParser";
import { CodeGeneratorJs } from "../CodeGeneratorJs";
import { CpcVm } from "../CpcVm";
import { Random } from "../Random";
import { Variables } from "../Variables";
import { NoCanvas } from "../ui/NoCanvas";
import type { CanvasOptions } from "../ui/UiInterfaces";
import type { CustomError, IKeyboard, ISound, SoundData, ToneEnvData, VolEnvData } from "../Interfaces";

export interface HeadlessCell {
	char: number
	pen: number
	paper: number
}

export interface HeadlessRunOptions {
	maxSteps?: number
}

export interface HeadlessRunResult {
	reason: "input" | "budget" | "frame" | "stopped" | "blocked" | "error"
	steps: number
	line: number | string
	vmReason: string
	error?: Error
}

export interface HeadlessMachineOptions {
	seed?: number
	ticks?: number
}

function unsupported(feature: string): never {
	throw new Error("Headless testing does not support " + feature);
}

// Reuse the existing null graphics device, adding observable text cells.
export class HeadlessScreen extends NoCanvas {
	private readonly cells = new Map<string, HeadlessCell>();
	private modeValue = 1;

	constructor() {
		super({} as CanvasOptions);
	}

	reset(): void {
		this.cells?.clear();
	}

	getCell(x: number, y: number): HeadlessCell | undefined {
		const cell = this.cells.get(x + "," + y);
		return cell && { ...cell };
	}

	printChar(char: number, x: number, y: number, pen: number, paper: number, transparent: boolean): void {
		if (transparent) {unsupported("transparent text pixel composition");}
		this.cells.set(x + "," + y, { char, pen, paper });
	}

	readChar(x: number, y: number): number {
		return this.getCell(x, y)?.char ?? 32;
	}

	clearFullWindow(): void {
		this.cells.clear();
	}

	fillTextBox(left: number, top: number, width: number, height: number, paper: number): void {
		for (let y = top; y < top + height; y += 1) {
			for (let x = left; x < left + width; x += 1) {
				this.cells.set(x + "," + y, { char: 32, pen: paper, paper });
			}
		}
	}

	clearTextWindow(left: number, right: number, top: number, bottom: number, paper: number): void {
		this.fillTextBox(left, top, right - left + 1, bottom - top + 1, paper);
	}

	private scroll(left: number, right: number, top: number, bottom: number, paper: number, direction: number): void {
		const snapshot = new Map(this.cells);
		for (let y = top; y <= bottom; y += 1) {
			for (let x = left; x <= right; x += 1) {
				const sourceY = y + direction,
					cell = sourceY >= top && sourceY <= bottom ? snapshot.get(x + "," + sourceY) : undefined;
				this.cells.set(x + "," + y, cell ? { ...cell } : { char: 32, pen: paper, paper });
			}
		}
	}

	windowScrollUp(left: number, right: number, top: number, bottom: number, paper: number): void {
		this.scroll(left, right, top, bottom, paper, 1);
	}

	windowScrollDown(left: number, right: number, top: number, bottom: number, paper: number): void {
		this.scroll(left, right, top, bottom, paper, -1);
	}

	setMode(mode: number): void { this.modeValue = mode; }
	getMode(): number { return this.modeValue; }
	changeMode(_mode: number): void { unsupported("screen reinterpretation"); }
	getByte(_address: number): number { return unsupported("screen-memory reads"); }
	setByte(_address: number, _byte: number): void { unsupported("screen-memory writes"); }
	draw(_x: number, _y: number): void { unsupported("graphics DRAW"); }
	move(_x: number, _y: number): void { unsupported("graphics MOVE"); }
	plot(_x: number, _y: number): void { unsupported("graphics PLOT"); }
	test(_x: number, _y: number): number { return unsupported("graphics TEST"); }
	fill(_pen: number): void { unsupported("graphics FILL"); }
	printGChar(_char: number): void { unsupported("graphics text"); }
}

class HeadlessKeyboard implements IKeyboard {
	private readonly queue: string[] = [];
	reads = 0;

	reset(): void { this.clearInput(); this.reads = 0; }
	clearInput(): void { this.queue.length = 0; }
	getKeyFromBuffer(): string { this.reads += 1; return this.queue.shift() ?? ""; }
	putKeyInBuffer(key: string): void { this.queue.push(...key.split("")); }
	getKeyState(_key: number): number { return unsupported("INKEY key-state queries; use INKEY$"); }
	getJoyState(_joy: number): number { return unsupported("joysticks"); }
	resetExpansionTokens(): void { /* No expansion state is emulated. */ }
	resetCpcKeysExpansions(): void { /* No expansion state is emulated. */ }
	setExpansionToken(_token: number, _text: string): void { unsupported("KEY expansions"); }
	setCpcKeyExpansion(): void { unsupported("KEY DEF"); }
}

class HeadlessSound implements ISound {
	reset(): void { /* Audio is intentionally disabled. */ }
	resetQueue(): void { /* Audio is intentionally disabled. */ }
	testCanQueue(_state: number): boolean { return true; }
	sound(_data: SoundData): void { /* SOUND never blocks in this harness. */ }
	setVolEnv(_env: number, _data: VolEnvData[]): void { /* No audio synthesis. */ }
	setToneEnv(_env: number, _data: ToneEnvData[]): void { /* No audio synthesis. */ }
	scheduler(): void { /* No real-time scheduler. */ }
	release(_mask: number): void { /* No audio queue. */ }
	sq(_channel: number): number { return unsupported("sound-queue queries"); }
}

class HeadlessVm extends CpcVm {
	ticks = 0;
	checkpoint: () => boolean = () => false;
	readKey: () => string = () => "";

	vmLoopCondition(): boolean { return this.checkpoint(); }
	time(): number { return this.ticks; }
	inkey$(): string { return this.readKey(); }
	frame(): void { this.ticks += 6; super.frame(); }
	afterGosub(): void { unsupported("AFTER timers"); }
	everyGosub(): void { unsupported("EVERY timers"); }
	onSqGosub(): void { unsupported("ON SQ timers"); }
}

export class HeadlessCompileError extends Error {
	constructor(readonly diagnostic: CustomError) {
		super(String(diagnostic));
		this.name = "HeadlessCompileError";
	}
}

export class HeadlessProgram {
	constructor(private readonly code: string, private readonly variableNames: string[]) {}

	createHeadlessMachine(options: HeadlessMachineOptions = {}): HeadlessMachine {
		return new HeadlessMachine(this.code, this.variableNames, options);
	}
}

export class HeadlessMachine {
	readonly screen = new HeadlessScreen();
	private readonly keyboard = new HeadlessKeyboard();
	private readonly variables = new Variables({ arrayBounds: true });
	private readonly vm: HeadlessVm;
	private readonly execute: (vm: CpcVm) => void;
	private fault?: Error;

	constructor(code: string, names: string[], options: HeadlessMachineOptions) {
		const random = new Random(true);
		this.vm = new HeadlessVm({ canvas: this.screen, keyboard: this.keyboard, sound: new HeadlessSound(), random, variables: this.variables, quiet: true });
		this.vm.vmReset();
		for (const name of names) {this.variables.initVariable(name);}
		if (options.seed !== undefined && !Number.isFinite(options.seed)) {throw new RangeError("Seed must be finite");}
		random.init(options.seed);
		this.advanceTime(options.ticks ?? 0);
		this.vm.readKey = () => this.keyboard.getKeyFromBuffer();
		this.execute = new Function("o", code) as (vm: CpcVm) => void; // eslint-disable-line no-new-func
	}

	advanceTime(ticks: number): void {
		if (!Number.isSafeInteger(ticks) || ticks < 0 || !Number.isSafeInteger(this.vm.ticks + ticks)) {throw new RangeError("Ticks must be nonnegative safe integers");}
		this.vm.ticks += ticks;
	}

	pressKey(key: string): void {
		if ([...key].some(char => char.charCodeAt(0) > 255)) {throw new RangeError("Keys must be CPC byte characters");}
		this.keyboard.putKeyInBuffer(key);
	}

	run(options: HeadlessRunOptions = {}): HeadlessRunResult {
		return this.executeUntil(false, options);
	}

	// INKEY$ returns before pausing at the next generated-code checkpoint. This
	// never unwinds/replays a partially executed BASIC expression or statement.
	runUntilInput(options: HeadlessRunOptions = {}): HeadlessRunResult {
		return this.executeUntil(true, options);
	}

	private executeUntil(untilInput: boolean, options: HeadlessRunOptions): HeadlessRunResult {
		const limit = options.maxSteps ?? 100000,
			initialReads = this.keyboard.reads;
		if (!Number.isSafeInteger(limit) || limit < 1) {throw new RangeError("maxSteps must be a positive safe integer");}
		if (this.vm.vmGetStopObject().reason === "waitFrame") {this.vm.vmStop("", 0, true);}
		let steps = 0;
		this.vm.checkpoint = () => {
			if (this.vm.vmGetStopObject().reason || this.fault || steps >= limit || (untilInput && this.keyboard.reads > initialReads)) {return false;}
			steps += 1;
			return true;
		};
		try {
			this.execute(this.vm);
		} catch (error) {
			this.fault = error instanceof Error ? error : new Error(String(error));
		}
		const vmReason = this.vm.vmGetStopObject().reason,
			reason = this.fault ? "error" : vmReason === "stop" || vmReason === "end" ? "stopped"
				: vmReason === "waitFrame" ? "frame" : vmReason ? "blocked"
					: untilInput && this.keyboard.reads > initialReads ? "input" : "budget";
		return { reason, steps, line: this.vm.line, vmReason, ...(this.fault ? { error: this.fault } : {}) };
	}

	getOutput(): string { return this.vm.vmGetOutBuffer(); }
	getTime(): number { return this.vm.ticks; }

	private variableKey(name: string, dimensions: number): string {
		if (!/^[a-z][a-z0-9.]*(?:[!%$])?$/i.test(name)) {throw new TypeError("Expected a BASIC variable name without subscripts");}
		const explicit = /[!%$]$/.test(name),
			base = (explicit ? name.slice(0, -1) : name).toLowerCase().replace(/\./g, "_"),
			type = explicit ? ({ "!": "R", "%": "I", $: "$" } as Record<string, string>)[name.slice(-1)] : this.variables.getVarType(base[0]),
			key = base + "A".repeat(dimensions) + type;
		if (this.variables.variableExist(key)) {return key;}
		if (this.variables.variableExist("_" + key)) {return "_" + key;}
		throw new ReferenceError("Unknown BASIC variable: " + name);
	}

	private scalar(value: unknown): string | number {
		if (typeof value !== "number" && typeof value !== "string") {throw new TypeError("Expected a scalar BASIC value");}
		return value;
	}

	private assigned(key: string, value: string | number): string | number {
		if (typeof value === "number" && !Number.isFinite(value)) {throw new RangeError("Numeric values must be finite");}
		const type = key.slice(-1);
		if (type === "$") {
			if (typeof value !== "string") {throw new TypeError("Expected a string value");}
			if (value.length > 255) {throw new RangeError("BASIC strings cannot exceed 255 characters");}
			return value;
		}
		if (type !== "$" && typeof value !== "number") {throw new TypeError("Expected a numeric value");}
		if (type === "I") {
			const rounded = (value as number) < 0 ? -Math.round(-(value as number)) : Math.round(value as number);
			if (rounded < -32768 || rounded > 32767) {throw new RangeError("BASIC integer overflow");}
			return rounded;
		}
		return value;
	}

	getVariable(name: string): string | number {
		return this.scalar(this.variables.getVariable(this.variableKey(name, 0)));
	}

	setVariable(name: string, value: string | number): void {
		const key = this.variableKey(name, 0);
		this.variables.setVariable(key, this.assigned(key, value));
	}

	private arraySlot(name: string, indices: number[]): { key: string, array: unknown[], index: number } {
		if (indices.length < 1 || indices.length > 3 || indices.some(index => !Number.isSafeInteger(index) || index < 0)) {throw new RangeError("Expected one to three nonnegative integer indices");}
		const key = this.variableKey(name, indices.length);
		let value: unknown = this.variables.getVariable(key);
		for (let dimension = 0; dimension < indices.length; dimension += 1) {
			const index = indices[dimension];
			if (!Array.isArray(value) || index >= value.length) {throw new RangeError("BASIC array index out of bounds");}
			if (dimension === indices.length - 1) {return { key, array: value, index };}
			value = value[index];
		}
		throw new RangeError("Invalid array indices");
	}

	getArrayElement(name: string, indices: number[]): string | number {
		const slot = this.arraySlot(name, indices);
		return this.scalar(slot.array[slot.index]);
	}

	setArrayElement(name: string, indices: number[], value: string | number): void {
		const slot = this.arraySlot(name, indices);
		slot.array[slot.index] = this.assigned(slot.key, value);
	}
}

export function compile(source: string, options: { implicitLines?: boolean } = {}): HeadlessProgram {
	const parser = new BasicParser({ quiet: true }),
		variables = new Variables({ arrayBounds: true }),
		generator = new CodeGeneratorJs({ parser, lexer: new BasicLexer({ keywords: parser.getKeywords(), quiet: true }), implicitLines: options.implicitLines ?? false, integerOverflow: true, quiet: true }),
		output = generator.generate(source, variables);
	if (output.error) {throw new HeadlessCompileError(output.error);}
	return new HeadlessProgram(output.text, variables.getAllVariableNames());
}