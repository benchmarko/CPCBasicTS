import { BasicLexer } from "../BasicLexer";
import { BasicParser } from "../BasicParser";
import { CodeGeneratorJs } from "../CodeGeneratorJs";
import { CpcVm } from "../CpcVm";
import { Random } from "../Random";
import { Variables } from "../Variables";
import { NoCanvas } from "../ui/NoCanvas";
function unsupported(feature) {
    throw new Error("Headless testing does not support " + feature);
}
// Reuse the existing null graphics device, adding observable text cells.
export class HeadlessScreen extends NoCanvas {
    constructor() {
        super({});
        this.cells = new Map();
        this.modeValue = 1;
    }
    reset() {
        var _a;
        (_a = this.cells) === null || _a === void 0 ? void 0 : _a.clear();
    }
    getCell(x, y) {
        const cell = this.cells.get(x + "," + y);
        return cell && Object.assign({}, cell);
    }
    printChar(char, x, y, pen, paper, transparent) {
        if (transparent) {
            unsupported("transparent text pixel composition");
        }
        this.cells.set(x + "," + y, { char, pen, paper });
    }
    readChar(x, y) {
        var _a, _b;
        return (_b = (_a = this.getCell(x, y)) === null || _a === void 0 ? void 0 : _a.char) !== null && _b !== void 0 ? _b : 32;
    }
    clearFullWindow() {
        this.cells.clear();
    }
    fillTextBox(left, top, width, height, paper) {
        for (let y = top; y < top + height; y += 1) {
            for (let x = left; x < left + width; x += 1) {
                this.cells.set(x + "," + y, { char: 32, pen: paper, paper });
            }
        }
    }
    clearTextWindow(left, right, top, bottom, paper) {
        this.fillTextBox(left, top, right - left + 1, bottom - top + 1, paper);
    }
    scroll(left, right, top, bottom, paper, direction) {
        const snapshot = new Map(this.cells);
        for (let y = top; y <= bottom; y += 1) {
            for (let x = left; x <= right; x += 1) {
                const sourceY = y + direction, cell = sourceY >= top && sourceY <= bottom ? snapshot.get(x + "," + sourceY) : undefined;
                this.cells.set(x + "," + y, cell ? Object.assign({}, cell) : { char: 32, pen: paper, paper });
            }
        }
    }
    windowScrollUp(left, right, top, bottom, paper) {
        this.scroll(left, right, top, bottom, paper, 1);
    }
    windowScrollDown(left, right, top, bottom, paper) {
        this.scroll(left, right, top, bottom, paper, -1);
    }
    setMode(mode) { this.modeValue = mode; }
    getMode() { return this.modeValue; }
    changeMode(_mode) { unsupported("screen reinterpretation"); }
    getByte(_address) { return unsupported("screen-memory reads"); }
    setByte(_address, _byte) { unsupported("screen-memory writes"); }
    draw(_x, _y) { unsupported("graphics DRAW"); }
    move(_x, _y) { unsupported("graphics MOVE"); }
    plot(_x, _y) { unsupported("graphics PLOT"); }
    test(_x, _y) { return unsupported("graphics TEST"); }
    fill(_pen) { unsupported("graphics FILL"); }
    printGChar(_char) { unsupported("graphics text"); }
}
class HeadlessKeyboard {
    constructor() {
        this.queue = [];
        this.reads = 0;
    }
    reset() { this.clearInput(); this.reads = 0; }
    clearInput() { this.queue.length = 0; }
    getKeyFromBuffer() { var _a; this.reads += 1; return (_a = this.queue.shift()) !== null && _a !== void 0 ? _a : ""; }
    putKeyInBuffer(key) { this.queue.push(...key.split("")); }
    getKeyState(_key) { return unsupported("INKEY key-state queries; use INKEY$"); }
    getJoyState(_joy) { return unsupported("joysticks"); }
    resetExpansionTokens() { }
    resetCpcKeysExpansions() { }
    setExpansionToken(_token, _text) { unsupported("KEY expansions"); }
    setCpcKeyExpansion() { unsupported("KEY DEF"); }
}
class HeadlessSound {
    reset() { }
    resetQueue() { }
    testCanQueue(_state) { return true; }
    sound(_data) { }
    setVolEnv(_env, _data) { }
    setToneEnv(_env, _data) { }
    scheduler() { }
    release(_mask) { }
    sq(_channel) { return unsupported("sound-queue queries"); }
}
class HeadlessVm extends CpcVm {
    constructor() {
        super(...arguments);
        this.ticks = 0;
        this.checkpoint = () => false;
        this.readKey = () => "";
    }
    vmLoopCondition() { return this.checkpoint(); }
    time() { return this.ticks; }
    inkey$() { return this.readKey(); }
    frame() { this.ticks += 6; super.frame(); }
    afterGosub() { unsupported("AFTER timers"); }
    everyGosub() { unsupported("EVERY timers"); }
    onSqGosub() { unsupported("ON SQ timers"); }
}
export class HeadlessCompileError extends Error {
    constructor(diagnostic) {
        super(String(diagnostic));
        this.diagnostic = diagnostic;
        this.name = "HeadlessCompileError";
    }
}
export class HeadlessProgram {
    constructor(code, variableNames) {
        this.code = code;
        this.variableNames = variableNames;
    }
    createHeadlessMachine(options = {}) {
        return new HeadlessMachine(this.code, this.variableNames, options);
    }
}
export class HeadlessMachine {
    constructor(code, names, options) {
        var _a;
        this.screen = new HeadlessScreen();
        this.keyboard = new HeadlessKeyboard();
        this.variables = new Variables({ arrayBounds: true });
        const random = new Random(true);
        this.vm = new HeadlessVm({ canvas: this.screen, keyboard: this.keyboard, sound: new HeadlessSound(), random, variables: this.variables, quiet: true });
        this.vm.vmReset();
        for (const name of names) {
            this.variables.initVariable(name);
        }
        if (options.seed !== undefined && !Number.isFinite(options.seed)) {
            throw new RangeError("Seed must be finite");
        }
        random.init(options.seed);
        this.advanceTime((_a = options.ticks) !== null && _a !== void 0 ? _a : 0);
        this.vm.readKey = () => this.keyboard.getKeyFromBuffer();
        this.execute = new Function("o", code); // eslint-disable-line no-new-func
    }
    advanceTime(ticks) {
        if (!Number.isSafeInteger(ticks) || ticks < 0 || !Number.isSafeInteger(this.vm.ticks + ticks)) {
            throw new RangeError("Ticks must be nonnegative safe integers");
        }
        this.vm.ticks += ticks;
    }
    pressKey(key) {
        if ([...key].some(char => char.charCodeAt(0) > 255)) {
            throw new RangeError("Keys must be CPC byte characters");
        }
        this.keyboard.putKeyInBuffer(key);
    }
    run(options = {}) {
        return this.executeUntil(false, options);
    }
    // INKEY$ returns before pausing at the next generated-code checkpoint. This
    // never unwinds/replays a partially executed BASIC expression or statement.
    runUntilInput(options = {}) {
        return this.executeUntil(true, options);
    }
    executeUntil(untilInput, options) {
        var _a;
        const limit = (_a = options.maxSteps) !== null && _a !== void 0 ? _a : 100000, initialReads = this.keyboard.reads;
        if (!Number.isSafeInteger(limit) || limit < 1) {
            throw new RangeError("maxSteps must be a positive safe integer");
        }
        if (this.vm.vmGetStopObject().reason === "waitFrame") {
            this.vm.vmStop("", 0, true);
        }
        let steps = 0;
        this.vm.checkpoint = () => {
            if (this.vm.vmGetStopObject().reason || this.fault || steps >= limit || (untilInput && this.keyboard.reads > initialReads)) {
                return false;
            }
            steps += 1;
            return true;
        };
        try {
            this.execute(this.vm);
        }
        catch (error) {
            this.fault = error instanceof Error ? error : new Error(String(error));
        }
        const vmReason = this.vm.vmGetStopObject().reason, reason = this.fault ? "error" : vmReason === "stop" || vmReason === "end" ? "stopped"
            : vmReason === "waitFrame" ? "frame" : vmReason ? "blocked"
                : untilInput && this.keyboard.reads > initialReads ? "input" : "budget";
        return Object.assign({ reason, steps, line: this.vm.line, vmReason }, (this.fault ? { error: this.fault } : {}));
    }
    getOutput() { return this.vm.vmGetOutBuffer(); }
    getTime() { return this.vm.ticks; }
    variableKey(name, dimensions) {
        if (!/^[a-z][a-z0-9.]*(?:[!%$])?$/i.test(name)) {
            throw new TypeError("Expected a BASIC variable name without subscripts");
        }
        const explicit = /[!%$]$/.test(name), base = (explicit ? name.slice(0, -1) : name).toLowerCase().replace(/\./g, "_"), type = explicit ? { "!": "R", "%": "I", $: "$" }[name.slice(-1)] : this.variables.getVarType(base[0]), key = base + "A".repeat(dimensions) + type;
        if (this.variables.variableExist(key)) {
            return key;
        }
        if (this.variables.variableExist("_" + key)) {
            return "_" + key;
        }
        throw new ReferenceError("Unknown BASIC variable: " + name);
    }
    scalar(value) {
        if (typeof value !== "number" && typeof value !== "string") {
            throw new TypeError("Expected a scalar BASIC value");
        }
        return value;
    }
    assigned(key, value) {
        if (typeof value === "number" && !Number.isFinite(value)) {
            throw new RangeError("Numeric values must be finite");
        }
        const type = key.slice(-1);
        if (type === "$") {
            if (typeof value !== "string") {
                throw new TypeError("Expected a string value");
            }
            if (value.length > 255) {
                throw new RangeError("BASIC strings cannot exceed 255 characters");
            }
            return value;
        }
        if (type !== "$" && typeof value !== "number") {
            throw new TypeError("Expected a numeric value");
        }
        if (type === "I") {
            const rounded = value < 0 ? -Math.round(-value) : Math.round(value);
            if (rounded < -32768 || rounded > 32767) {
                throw new RangeError("BASIC integer overflow");
            }
            return rounded;
        }
        return value;
    }
    getVariable(name) {
        return this.scalar(this.variables.getVariable(this.variableKey(name, 0)));
    }
    setVariable(name, value) {
        const key = this.variableKey(name, 0);
        this.variables.setVariable(key, this.assigned(key, value));
    }
    arraySlot(name, indices) {
        if (indices.length < 1 || indices.length > 3 || indices.some(index => !Number.isSafeInteger(index) || index < 0)) {
            throw new RangeError("Expected one to three nonnegative integer indices");
        }
        const key = this.variableKey(name, indices.length);
        let value = this.variables.getVariable(key);
        for (let dimension = 0; dimension < indices.length; dimension += 1) {
            const index = indices[dimension];
            if (!Array.isArray(value) || index >= value.length) {
                throw new RangeError("BASIC array index out of bounds");
            }
            if (dimension === indices.length - 1) {
                return { key, array: value, index };
            }
            value = value[index];
        }
        throw new RangeError("Invalid array indices");
    }
    getArrayElement(name, indices) {
        const slot = this.arraySlot(name, indices);
        return this.scalar(slot.array[slot.index]);
    }
    setArrayElement(name, indices, value) {
        const slot = this.arraySlot(name, indices);
        slot.array[slot.index] = this.assigned(slot.key, value);
    }
}
export function compile(source, options = {}) {
    var _a;
    const parser = new BasicParser({ quiet: true }), variables = new Variables({ arrayBounds: true }), generator = new CodeGeneratorJs({ parser, lexer: new BasicLexer({ keywords: parser.getKeywords(), quiet: true }), implicitLines: (_a = options.implicitLines) !== null && _a !== void 0 ? _a : false, integerOverflow: true, quiet: true }), output = generator.generate(source, variables);
    if (output.error) {
        throw new HeadlessCompileError(output.error);
    }
    return new HeadlessProgram(output.text, variables.getAllVariableNames());
}
//# sourceMappingURL=Headless.js.map