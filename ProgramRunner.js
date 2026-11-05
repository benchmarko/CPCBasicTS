var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { BasicFormatter } from "./BasicFormatter";
import { Utils } from "./Utils";
export class ProgramRunner {
    constructor(options) {
        this.options = options;
    }
    static compile(script) {
        return new Function("o", script); // eslint-disable-line no-new-func
    }
    static listProgram(vm, lines, stream) {
        for (const line of BasicFormatter.formatListing(lines, stream)) {
            vm.print(stream, line, "\r\n");
        }
        vm.vmGoto(0);
        vm.vmStop("end", 0, true);
    }
    static editLine(vm, paras, line, onInput) {
        vm.print(paras.stream, line);
        vm.cursor(paras.stream, 1);
        const input = {
            command: paras.command,
            line: paras.line,
            stream: paras.stream,
            message: "",
            fnInputCallback: onInput,
            input: line
        };
        vm.vmStop("waitInput", 45, true, input);
    }
    static renumberProgram(vm, source, paras, renumber, setSource, onError) {
        const output = renumber(source, paras.newLine || 10, paras.oldLine || 1, paras.step || 10, paras.keep || 65535);
        if (output.error) {
            onError(output.error);
        }
        else {
            setSource(output.text);
        }
        vm.vmGoto(0);
        vm.vmStop("end", 0, true);
        return output;
    }
    static commitEditedLine(vm, paras, source, merge, setSource, onProgramEdited) {
        setSource(merge(source, paras.input));
        vm.vmSetStartLine(0);
        vm.vmGoto(0);
        onProgramEdited === null || onProgramEdited === void 0 ? void 0 : onProgramEdited();
        vm.cursor(paras.stream, 0);
        vm.vmStop("end", 90);
        return true;
    }
    static newProgram(vm, clearSource, clearVariables, invalidate) {
        clearSource();
        clearVariables();
        vm.vmGoto(0);
        vm.vmStop("end", 0, true);
        invalidate();
    }
    static resetProgram(vm, clearVariables, resetDevices, clearOutput, invalidate) {
        clearVariables();
        vm.vmReset();
        resetDevices();
        vm.vmStop("end", 0, true);
        clearOutput();
        invalidate();
    }
    static prepareChainMergeLoad(vm, file, deleteLines) {
        if (file.command === "chainMerge" && file.first && file.last) {
            deleteLines({
                first: file.first,
                last: file.last,
                command: "CHAIN MERGE",
                stream: 0,
                line: vm.line
            });
            vm.vmStop("fileLoad", 90);
        }
    }
    static closeSavedFile(vm, file, data, onWarning) {
        if (file.fnFileCallback) {
            try {
                file.fnFileCallback(data);
            }
            catch (error) {
                onWarning(error);
            }
        }
        vm.vmResetOutFileHandling();
    }
    static dispatchFileSave(vm, file, save, onSaved, onNotOpen, onWarning) {
        if (file.open) {
            const data = save(file);
            onSaved(file.name);
            ProgramRunner.closeSavedFile(vm, file, data, onWarning);
        }
        else {
            onNotOpen();
        }
        vm.vmStop("", 0, true);
    }
    static dispatchFileLoad(file, actions) {
        if (file.open) {
            ProgramRunner.prepareChainMergeLoad(actions.vm, file, actions.deleteLines);
            actions.logFile(file);
            const input = actions.loadFromStorage(file.name);
            if (input !== null) {
                actions.onStorageLoad(input);
            }
            else {
                actions.loadExample();
            }
        }
        else {
            actions.onNotOpen(file.name);
        }
        actions.setNextDelay(actions.vm.vmGetTimeUntilFrame());
    }
    static applyLoad(request, actions) {
        let startLine = 0;
        switch (request.command) {
            case "openin":
                break;
            case "chainMerge":
                actions.setSource(actions.merge(actions.getSource(), request.input));
                actions.clearResult();
                startLine = request.line;
                actions.invalidate();
                actions.parseChain();
                break;
            case "load":
                if (!request.inMemory) {
                    actions.setSource(request.input);
                    actions.clearResult();
                    actions.invalidate();
                    actions.vm.vmStop("end", 90);
                }
                break;
            case "merge":
                actions.setSource(actions.merge(actions.getSource(), request.input));
                actions.clearResult();
                actions.invalidate();
                actions.removeVariables();
                actions.vm.vmStop("end", 90);
                break;
            case "chain":
                actions.setSource(request.input);
                actions.clearResult();
                startLine = request.line;
                actions.invalidate();
                actions.parseChain();
                break;
            case "run":
                if (!request.inMemory) {
                    actions.setSource(request.input);
                    actions.clearResult();
                    startLine = request.line;
                    if (!request.isSnapshot) {
                        actions.reset();
                    }
                    actions.parseRun();
                }
                else {
                    actions.reset();
                    actions.vm.clear();
                    actions.loadFileInMemory();
                }
                break;
            default:
                actions.onUnknownCommand(request.command);
                break;
        }
        return startLine;
    }
    static continueLoad(input, file, actions) {
        const { decode, decodeTokenizedBasic, loadFileInMemory, setStartLine, startMainLoop, onWarning, onError } = actions, loadActions = __rest(actions, ["decode", "decodeTokenizedBasic", "loadFileInMemory", "setStartLine", "startMainLoop", "onWarning", "onError"]);
        let data, putInMemory = false;
        if (input !== null && input !== undefined) {
            data = decode(input);
            input = data.data;
        }
        const command = file.command, line = file.line || 0, name = file.name;
        if (file.fnFileCallback) {
            try {
                putInMemory = Boolean(file.fnFileCallback(input, data === null || data === void 0 ? void 0 : data.meta));
            }
            catch (error) {
                onWarning(error);
            }
        }
        if (input === undefined) {
            onError("loadFileContinue: File " + name + ": input undefined!");
            actions.vm.vmStop("stop", 60, true);
            startMainLoop();
            return;
        }
        if (input === null) {
            startMainLoop();
            return;
        }
        if ((data === null || data === void 0 ? void 0 : data.meta.typeString) === "S" && putInMemory) {
            input = decodeTokenizedBasic(input.substring(0x170));
            putInMemory = false;
        }
        const startLine = ProgramRunner.applyLoad({ command, input, line, inMemory: putInMemory, isSnapshot: (data === null || data === void 0 ? void 0 : data.meta.typeString) === "S" }, Object.assign(Object.assign({}, loadActions), { loadFileInMemory: () => loadFileInMemory(input, data === null || data === void 0 ? void 0 : data.meta) }));
        setStartLine(startLine);
        startMainLoop();
    }
    static enterDirectMode(vm, onInput) {
        const stream = 0, message = "Ready\r\n";
        vm.tagoff(stream);
        vm.vmResetControlBuffer();
        if (vm.pos(stream) > 1) {
            vm.print(stream, "\r\n");
        }
        vm.print(stream, message);
        vm.cursor(stream, 1, 1);
        vm.vmStop("direct", 0, true, {
            command: "direct",
            stream,
            message,
            fnInputCallback: onInput,
            input: "",
            line: vm.line
        });
    }
    static finishInput(vm, reason, startMainLoop, continueExecution) {
        if (reason === "waitInput") {
            vm.vmStop("", 0, true);
        }
        else if (reason === "direct") {
            vm.vmStop("", 0, true);
            startMainLoop();
        }
        else {
            continueExecution();
        }
    }
    invalidate() {
        this.script = undefined;
    }
    setScript(script) {
        this.script = script;
    }
    start(source, vm, line = 0, beforeCompile) {
        var _a, _b;
        if (line === 0) {
            vm.vmResetData();
        }
        beforeCompile === null || beforeCompile === void 0 ? void 0 : beforeCompile();
        if (!this.script) {
            try {
                this.script = ProgramRunner.compile(source);
            }
            catch (error) {
                (this.options.logger || Utils.console).error(error);
                if (error instanceof Error) {
                    (_b = (_a = this.options).onJsError) === null || _b === void 0 ? void 0 : _b.call(_a, error);
                    error.shortMessage = "JS " + String(error);
                    this.options.outputError(error, true);
                }
                this.script = undefined;
            }
        }
        vm.vmReset4Run();
        if (!this.script) {
            return false;
        }
        vm.vmStop("", 0, true);
        vm.vmGoto(0);
        vm.vmSetStartLine(line);
        return true;
    }
    execute(vm) {
        const script = this.script;
        if (script) {
            this.run(() => script(vm));
        }
    }
    run(execute) {
        var _a;
        const options = this.options, logger = options.logger || Utils.console;
        try {
            execute();
        }
        catch (error) {
            if (!(error instanceof Error)) {
                logger.error(error);
                return;
            }
            if (error.name === "CpcVm" || error.name === "Variables") {
                let customError = error;
                if (customError.errCode !== undefined) {
                    customError = options.composeError(customError, customError.errCode, customError.value);
                }
                if (!customError.hidden) {
                    logger.warn(customError);
                    options.outputError(customError, !customError.pos);
                }
                else {
                    logger.log(customError.message);
                }
            }
            else {
                logger.error(error);
                (_a = options.onJsError) === null || _a === void 0 ? void 0 : _a.call(options, error);
                options.composeError(error, 2, "JS " + String(error));
                options.outputError(error, true);
            }
        }
    }
}
//# sourceMappingURL=ProgramRunner.js.map