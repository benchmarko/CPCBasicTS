// Runtime.ts - shared DOM-free runtime composition
//
import { BasicLexer } from "./BasicLexer";
import { BasicParser } from "./BasicParser";
import { CodeGeneratorJs } from "./CodeGeneratorJs";
import { CpcVm } from "./CpcVm";
import { InputLine } from "./InputLine";
import { ExecutionStateReporter } from "./ExecutionState";
import { ProgramCompiler } from "./ProgramCompiler";
import { ProgramRunner } from "./ProgramRunner";
import { RsxAmsdos } from "./RsxAmsdos";
import { RsxCpcBasic } from "./RsxCpcBasic";
import { RuntimeSettings } from "./RuntimeSettings";
import { RunLoop } from "./RunLoop";
import { SoundQueue } from "./SoundQueue";
import { SuspendedState } from "./SuspendedState";
import { Variables } from "./Variables";
import { BasicFormatter } from "./BasicFormatter";
import { FileHandler } from "./FileHandler";
export class Runtime {
    constructor(options) {
        this.onVariablesCleared = options.onVariablesCleared;
        this.executionStateReporter = new ExecutionStateReporter(options.onExecutionState);
        this.programHost = options.programHost;
        this.keyboard = options.keyboard;
        this.variables = new Variables({ arrayBounds: options.arrayBounds });
        this.vm = new CpcVm({
            canvas: options.canvas,
            keyboard: options.keyboard,
            random: options.random,
            sound: options.sound,
            variables: this.variables,
            onClickKey: options.onClickKey
        });
        this.vm.vmRegisterRsx(new RsxAmsdos(), true);
        this.vm.vmRegisterRsx(new RsxCpcBasic(), true);
        this.suspendedState = new SuspendedState(this.vm.vmGetStopObject());
        this.inputLine = new InputLine(options.keyboard, this.vm);
        this.soundQueue = new SoundQueue(this.vm, options.sound);
        this.programRunner = new ProgramRunner({
            composeError: this.vm.vmComposeError.bind(this.vm),
            outputError: options.outputError,
            onJsError: options.onJsError,
            logger: options.logger
        });
        this.basicParser = new BasicParser({ basicVersion: options.basicVersion });
        this.basicLexer = new BasicLexer({ keywords: this.basicParser.getKeywords() });
        this.codeGeneratorJs = new CodeGeneratorJs({
            lexer: this.basicLexer,
            parser: this.basicParser,
            trace: options.trace,
            implicitLines: options.implicitLines,
            integerOverflow: options.integerOverflow
        });
        this.programCompiler = new ProgramCompiler({
            generator: this.codeGeneratorJs,
            vm: this.vm,
            encodeTokens: options.encodeTokens,
            onTokenized: options.onTokenized,
            onMemoryError: options.onMemoryError
        });
        this.runtimeSettings = new RuntimeSettings({
            codeGeneratorJs: this.codeGeneratorJs,
            variables: this.variables,
            vm: this.vm,
            getCodeGeneratorBasic: options.getCodeGeneratorBasic,
            getCodeGeneratorToken: options.getCodeGeneratorToken,
            onVariablesCleared: options.onVariablesCleared
        });
        const handlers = Object.assign({ timer: () => this.vm.vmStop("", 0, true), waitFrame: () => this.handleWaitFrame(), onError: () => this.vm.vmStop("", 0, true), error: Runtime.noop, stop: Runtime.noop, break: Runtime.noop, escape: Runtime.noop, end: Runtime.noop }, options.handlers);
        this.runLoop = new RunLoop({
            vm: this.vm,
            execute: () => this.programRunner.execute(this.vm),
            handlers,
            getInitialDelay: options.getInitialDelay,
            setTimeout: options.setTimeout,
            onExit: options.onExit,
            onStateChange: () => this.executionStateReporter.report(this.getExecutionState()),
            onUnknownReason: options.onUnknownReason
        });
    }
    getExecutionState() {
        return {
            reason: this.vm.vmGetStopObject().reason,
            line: this.vm.line,
            isRunning: this.runLoop.isRunning
        };
    }
    startMainLoop() {
        this.runLoop.start();
    }
    setNextDelay(delay) {
        this.runLoop.nextDelay = delay;
    }
    static noop() {
        // No extra host action is needed for terminal VM stop reasons.
    }
    reset() {
        this.vm.vmReset();
    }
    continueLoad(input, file, actions) {
        ProgramRunner.continueLoad(input, file, Object.assign(Object.assign({}, actions), { vm: this.vm, setStartLine: (line) => this.vm.vmSetStartLine(line), loadFileInMemory: (fileInput, meta) => this.vm.vmPutFileInMemory(fileInput, meta, false) }));
    }
    dispatchFileLoad(file, actions) {
        ProgramRunner.dispatchFileLoad(file, Object.assign(Object.assign({}, actions), { vm: this.vm, onStorageLoad: (input) => this.completeStorageLoad(input, actions.onStorageLoad) }));
    }
    completeStorageLoad(input, continueLoad) {
        this.vm.vmStop("", 0, true);
        continueLoad(input);
    }
    completeExampleLoad(input, rsx, continueLoad) {
        this.vm.vmStop("", 0, true);
        if (rsx) {
            this.vm.vmRegisterRsx(rsx, false);
        }
        continueLoad(input);
    }
    failExampleLoad(example, outputError, continueLoad) {
        this.vm.vmStop("", 0, true);
        const error = this.vm.vmComposeError(Error(), 32, example + " not found");
        if (error.hidden) {
            this.vm.vmStop("", 0, true);
        }
        outputError(error, true);
        continueLoad(null);
    }
    dispatchFileSave(file, save, onSaved, onNotOpen, onWarning) {
        ProgramRunner.dispatchFileSave(this.vm, file, save, onSaved, onNotOpen, onWarning);
    }
    finishInput(reason, startMainLoop, continueExecution) {
        ProgramRunner.finishInput(this.vm, reason, startMainLoop, continueExecution);
    }
    handleWaitSound(activated = true) {
        this.runLoop.nextDelay = this.soundQueue.poll(activated);
    }
    handleWaitFrame() {
        this.vm.vmStop("", 0, true);
        this.runLoop.nextDelay = this.vm.vmGetTimeUntilFrame();
    }
    handleWaitKey(isSoundActivated = () => true, onKey) {
        const key = this.keyboard.getKeyFromBuffer();
        if (key !== "") {
            onKey === null || onKey === void 0 ? void 0 : onKey(key);
            this.vm.vmStop("", 0, true);
        }
        else {
            this.handleWaitSound(isSoundActivated());
        }
        return key;
    }
    handleWaitInput(actions) {
        var _a;
        const stop = this.vm.vmGetStopObject(), inputParas = stop.paras;
        if (!inputParas || inputParas.input === undefined || inputParas.stream === undefined) {
            actions.onInvalid(this.vm.vmComposeError(Error(), 32, "Programming Error: fnWaitInput"));
            return { status: "invalid" };
        }
        if (!this.inputLine.readAndSubmit(inputParas, actions.onInputReturn)) {
            return { status: "pending", reason: stop.reason };
        }
        (_a = actions.onInputSubmitted) === null || _a === void 0 ? void 0 : _a.call(actions);
        this.finishInput(stop.reason, actions.startMainLoop, actions.continueExecution);
        return { status: "submitted" };
    }
    enterDirectMode(onInput) {
        ProgramRunner.enterDirectMode(this.vm, onInput);
    }
    resetSuspendedState() {
        this.suspendedState.reset();
    }
    beginControl(reason, beforeStop) {
        const priority = reason === "break" ? 80 : reason === "reset" ? 99 : 95;
        if (reason === "break") {
            this.saveSuspendedState();
        }
        else if (reason !== "parse") {
            this.resetSuspendedState();
        }
        beforeStop === null || beforeStop === void 0 ? void 0 : beforeStop();
        this.vm.vmStop(reason, priority);
    }
    beginRenumber(options = {}) {
        this.vm.vmStop("renumLines", 85, false, {
            command: "renum",
            stream: 0,
            newLine: options.newLine,
            oldLine: options.oldLine,
            step: options.step,
            keep: options.keep,
            line: this.vm.line
        });
    }
    deleteProgramLines(paras, lines, applyDeletion, onInvalid) {
        if (lines.length) {
            const deletion = BasicFormatter.createDeleteScript(lines);
            if (deletion === undefined) {
                onInvalid(this.vm.vmComposeError(Error(), 21, paras.command));
            }
            else {
                applyDeletion(deletion);
            }
        }
        this.vm.vmGoto(0);
        this.vm.vmStop("end", 0, true);
    }
    eraseFiles(fileHandler, paras, onRemoved, onMissing) {
        const result = fileHandler.eraseFiles(paras.fileMask || "");
        if (!result.matched) {
            this.vm.print(paras.stream, result.name + " not found\r\n");
        }
        for (const name of result.removed) {
            onRemoved(name);
        }
        for (const name of result.missing) {
            this.vm.print(paras.stream, name + " not found\r\n");
            onMissing(name);
        }
        this.vm.vmStop("", 0, true);
        return result;
    }
    renameFile(fileHandler, paras) {
        const result = fileHandler.renameFile(paras.oldName, paras.newName);
        if (result.status === "newExists") {
            this.vm.print(paras.stream, result.oldName + " already exists\r\n");
        }
        else if (result.status === "oldNotFound") {
            this.vm.print(paras.stream, result.oldName + " not found\r\n");
        }
        this.vm.vmStop("", 0, true);
        return result;
    }
    saveSuspendedState() {
        this.suspendedState.save(this.vm.vmGetStopObject());
    }
    handleEscape(keyboard) {
        return this.suspendedState.escape(this.vm, keyboard);
    }
    restoreForContinue(beforeRestore) {
        return this.suspendedState.restoreForContinue(this.vm, this.vm.vmGetStopObject(), beforeRestore);
    }
    continueProgram(startMainLoop, beforeRestore, onContinueState) {
        const restored = this.restoreForContinue(beforeRestore);
        onContinueState === null || onContinueState === void 0 ? void 0 : onContinueState(restored);
        startMainLoop();
    }
    compileProgram(source) {
        return this.programCompiler.compile(source, this.variables);
    }
    parseProgram() {
        return this.compileHostProgram(false).output;
    }
    setArrayBounds(value) {
        this.runtimeSettings.setArrayBounds(value);
    }
    setImplicitLines(value) {
        this.runtimeSettings.setImplicitLines(value);
    }
    setPrettyLowercaseVars(value) {
        this.runtimeSettings.setPrettyLowercaseVars(value);
    }
    setIntegerOverflow(value) {
        this.runtimeSettings.setIntegerOverflow(value);
    }
    setTrace(value) {
        this.runtimeSettings.setTrace(value);
    }
    setBasicVersion(value) {
        this.codeGeneratorJs.setBasicVersion(value);
    }
    static getLoopDelay(speed) {
        return RuntimeSettings.getLoopDelay(speed);
    }
    listProgram(lines, stream) {
        ProgramRunner.listProgram(this.vm, lines, stream);
    }
    printDirectoryEntries(entries, stream, sort) {
        for (const text of FileHandler.formatDirectoryEntries(entries, sort)) {
            this.vm.print(stream, text);
        }
        this.vm.vmStop("", 0, true);
    }
    editLine(paras, line, onInput, onMissing) {
        if (line === undefined) {
            onMissing(this.vm.vmComposeError(Error(), 8, String(paras.first || 0)));
            this.vm.vmStop("stop", 60, true);
            return false;
        }
        ProgramRunner.editLine(this.vm, paras, line, onInput);
        return true;
    }
    renumProgram(source, paras, renumber, setSource, onError) {
        return ProgramRunner.renumberProgram(this.vm, source, paras, renumber, setSource, onError);
    }
    commitEditedLine(paras, source, merge, setSource, onProgramEdited) {
        return ProgramRunner.commitEditedLine(this.vm, paras, source, merge, setSource, onProgramEdited);
    }
    compileDirectProgram(input, source) {
        return this.codeGeneratorJs.generateDirect(input, source, this.variables);
    }
    readDirectInput() {
        const inputParas = this.vm.vmGetStopObject().paras, input = inputParas.input.trim();
        inputParas.input = "";
        if (input !== "") {
            this.vm.cursor(inputParas.stream, 0);
        }
        return {
            input,
            stream: inputParas.stream,
            message: inputParas.message,
            isProgramLine: input !== "" && !Number.isNaN(BasicFormatter.parseLineNumber(input))
        };
    }
    executeDirectCommand(input, source, line, stream, inputMessage, actions) {
        const output = this.compileDirectProgram(input, source);
        let outputText = output.error ? actions.outputError(output.error) : output.text;
        if (outputText && outputText.length > 0) {
            outputText += "\n";
        }
        actions.setOutputText(outputText);
        if (!output.error) {
            try {
                this.prepareDirectProgram(outputText, line);
            }
            catch (error) {
                actions.onPrepareError(error);
            }
        }
        else {
            this.vm.print(stream, inputMessage);
            this.vm.cursor(stream, 1);
        }
        return output;
    }
    insertDirectProgramLine(source, input, stream, merge, setSource, onProgramEdited) {
        setSource(merge(source, input));
        this.vm.vmSetStartLine(0);
        this.vm.vmGoto(0);
        onProgramEdited === null || onProgramEdited === void 0 ? void 0 : onProgramEdited();
        this.vm.cursor(stream, 1);
    }
    prepareDirectProgram(source, line) {
        this.vm.vmSetStartLine(line);
        this.vm.vmGoto("direct");
        this.programRunner.setScript(ProgramRunner.compile(source));
        this.vm.vmSetSourceMap(this.codeGeneratorJs.getSourceMap());
    }
    compileAndStartProgram(options) {
        const result = this.compileHostProgram(options.clearVariables);
        if (!result.output.error) {
            this.startProgram(result.source, 0, options.clearBeforeRun);
        }
        return result.output;
    }
    resetProgram(resetDevices, clearOutput, invalidate) {
        ProgramRunner.resetProgram(this.vm, () => this.removeAllVariables(), resetDevices, clearOutput, invalidate);
    }
    newProgram(clearSource, invalidate) {
        ProgramRunner.newProgram(this.vm, clearSource, () => this.removeAllVariables(), invalidate);
    }
    removeAllVariables() {
        var _a;
        if (Object.keys(this.variables.getAllVariables()).length) {
            this.variables.removeAllVariables();
            (_a = this.onVariablesCleared) === null || _a === void 0 ? void 0 : _a.call(this);
        }
    }
    startProgram(source, line, clearBeforeRun) {
        var _a, _b;
        if (clearBeforeRun) {
            this.vm.clear();
        }
        const started = this.programRunner.start(source, this.vm, line, this.programHost.beforeProgramStart);
        (_b = (_a = this.programHost).afterProgramStart) === null || _b === void 0 ? void 0 : _b.call(_a);
        return started;
    }
    compileHostProgram(clearVariables) {
        var _a, _b;
        if (clearVariables) {
            this.removeAllVariables();
        }
        const source = this.programHost.getSource();
        (_b = (_a = this.programHost).beforeCompileProgram) === null || _b === void 0 ? void 0 : _b.call(_a, source);
        const output = this.compileProgram(source), compiledSource = this.programHost.prepareCompileOutput(output);
        return { output, source: compiledSource };
    }
    invalidateProgram() {
        this.programRunner.invalidate();
    }
    setProgramScript(script) {
        this.programRunner.setScript(script);
    }
}
//# sourceMappingURL=Runtime.js.map