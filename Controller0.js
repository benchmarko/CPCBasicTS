// Controller0.ts - Controller
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//
import { Utils } from "./Utils";
import { BasicFormatter } from "./BasicFormatter";
import { BasicTokenizer } from "./BasicTokenizer";
import { CodeGeneratorBasic } from "./CodeGeneratorBasic";
import { CodeGeneratorToken } from "./CodeGeneratorToken";
import { DiskImage } from "./DiskImage";
import { FileHandler } from "./FileHandler";
import { Random } from "./Random";
import { Snapshot } from "./Snapshot";
import { Diff } from "./Diff";
import { Runtime } from "./Runtime";
export class Controller0 {
    constructor(core, options) {
        this.inScript = "";
        this.outScript = "";
        this.initialLoopTimeout = 0;
        /* eslint-disable no-invalid-this */
        this.handlers = {
            waitKey: this.fnWaitKey,
            waitSound: this.fnWaitSound,
            waitInput: this.fnWaitInput,
            fileCat: this.fnFileCat,
            fileDir: this.fnFileDir,
            fileEra: this.fnFileEra,
            fileRen: this.fnFileRen,
            renumLines: this.fnRenumLines,
            deleteLines: this.fnDeleteLines,
            editLine: this.fnEditLine,
            list: this.fnList,
            fileLoad: this.fnFileLoad,
            fileSave: this.fnFileSave,
            "new": this.fnNew,
            run: this.fnRun,
            parse: this.fnParse,
            parseRun: this.fnParseRun,
            reset: this.fnReset
        };
        this.fnDirectInputHandler = this.fnDirectInput.bind(this);
        this.fnPutKeyInBufferHandler = this.fnPutKeysInBuffer.bind(this);
        this.fnEditLineCallbackHandler = this.fnEditLineCallback.bind(this);
        this.core = core;
        const model = this.core.getModel();
        this.options = options;
        this.fnSpeed();
        const random = new Random(model.getProperty("random" /* ModelPropID.random */) === "cpc");
        this.runtime = new Runtime({
            canvas: this.options.canvas,
            keyboard: this.options.keyboard,
            sound: this.options.sound,
            random,
            arrayBounds: model.getProperty("arrayBounds" /* ModelPropID.arrayBounds */),
            basicVersion: model.getProperty("basicVersion" /* ModelPropID.basicVersion */),
            trace: model.getProperty("trace" /* ModelPropID.trace */),
            implicitLines: model.getProperty("implicitLines" /* ModelPropID.implicitLines */),
            integerOverflow: model.getProperty("integerOverflow" /* ModelPropID.integerOverflow */),
            onClickKey: this.fnPutKeyInBufferHandler,
            encodeTokens: (input) => this.encodeTokenizedBasic(input),
            outputError: this.outputError.bind(this),
            logger: Utils.console,
            getCodeGeneratorBasic: () => this.getCodeGeneratorBasic(),
            getCodeGeneratorToken: () => this.codeGeneratorToken,
            onTokenized: (sourceLength, tokenLength) => {
                if (Utils.debug) {
                    Utils.console.debug("parse: input length:", sourceLength, ", tokenized length:", tokenLength);
                }
            },
            onMemoryError: (error) => Utils.console.error("vmPutProgramInMem", error),
            programHost: {
                getSource: () => this.getInputText(),
                prepareCompileOutput: (output) => this.presentCompileOutput(output),
                beforeProgramStart: () => this.beforeProgramStart(),
                afterProgramStart: () => this.afterProgramStart()
            },
            handlers: Object.fromEntries(Object.entries(this.handlers).map(([reason, handler]) => [reason, handler.bind(this)])),
            getInitialDelay: () => this.initialLoopTimeout,
            setTimeout: (callback, delay) => this.options.setTimeout(callback, delay),
            onExit: () => this.exitLoop(),
            onExecutionState: options.onExecutionState,
            onUnknownReason: (reason) => Utils.console.warn("runLoop: Unknown run mode:", reason)
        });
        this.variables = this.runtime.variables;
        this.vm = this.runtime.vm;
        this.basicParser = this.runtime.basicParser;
        this.basicLexer = this.runtime.basicLexer;
        this.vm.setCanvas(this.options.canvas);
        this.runtime.reset();
        this.hasStorageDatabase = this.getHasStorageDatabase();
        this.storage = this.options.storage;
    }
    getStorage() {
        return this.storage;
    }
    getHasStorageDatabase() {
        const databases = this.core.getModel().getAllDatabases();
        let hasStorageDatabase = false;
        for (const value in databases) {
            if (Object.prototype.hasOwnProperty.call(databases, value)) {
                if (value === "storage") {
                    hasStorageDatabase = true;
                }
            }
        }
        return hasStorageDatabase;
    }
    updateStorageDatabase(action, key) {
        if (!this.hasStorageDatabase) {
            return;
        }
        const database = this.core.getModel().getProperty("database" /* ModelPropID.database */), storage = this.getStorage();
        let selectedExample = "", exampleChanged = false;
        if (database !== "storage") {
            this.core.getModel().setProperty("database" /* ModelPropID.database */, "storage"); // switch to storage database
        }
        else {
            selectedExample = this.core.getModel().getProperty("example" /* ModelPropID.example */);
        }
        let dir;
        if (!key) { // no key => get all
            dir = this.fnGetStorageDirectoryEntries();
            dir.sort();
        }
        else {
            dir = [key];
        }
        for (let i = 0; i < dir.length; i += 1) {
            key = dir[i];
            if (action === "remove") {
                this.core.getModel().removeExample(key);
            }
            else if (action === "set") {
                let example = this.core.getModel().getExample(key);
                if (selectedExample === "" || (selectedExample === key)) {
                    exampleChanged = true;
                }
                if (!example) {
                    const dataString = storage.getItem(key) || "", data = FileHandler.splitMeta(dataString);
                    example = {
                        key: key,
                        title: "", // or set key?
                        meta: data.meta.typeString // currently we take only the type
                    };
                    this.core.getModel().setExample(example);
                }
            }
            else {
                Utils.console.error("updateStorageDatabase: unknown action", action);
            }
        }
        if (database === "storage") {
            if (exampleChanged) {
                this.onDirectorySelectChange();
            }
        }
        else {
            this.core.getModel().setProperty("database" /* ModelPropID.database */, database); // restore database
        }
    }
    getInputText() {
        return this.inScript;
    }
    getVariableNames() {
        return this.variables.getAllVariableNames();
    }
    getVariable(name) {
        return this.variables.getVariable(name);
    }
    setInputText(input, keepStack) {
        var _a, _b;
        this.inScript = input;
        (_b = (_a = this.options).onInputText) === null || _b === void 0 ? void 0 : _b.call(_a, input, keepStack);
    }
    invalidateScript() {
        this.runtime.invalidateProgram();
    }
    fnWaitSound() {
        this.runtime.handleWaitSound();
    }
    fnWaitKey() {
        return this.runtime.handleWaitKey();
    }
    fnWaitInput() {
        const result = this.runtime.handleWaitInput({
            onInvalid: (error) => this.outputError(error, true),
            startMainLoop: () => this.startMainLoop(),
            continueExecution: () => this.startContinue()
        });
        if (result.status === "invalid") {
            return;
        }
        if (result.status === "pending" && result.reason === "waitInput") {
            this.fnWaitSound();
        }
        this.updateResultText();
    }
    static addLineNumbers(input) {
        return BasicFormatter.addLineNumbers(input);
    }
    // merge two scripts with sorted line numbers, lines from script2 overwrite lines from script1
    mergeScripts(script1, script2) {
        return BasicFormatter.mergeScripts(script1, script2, this.core.getModel().getProperty("implicitLines" /* ModelPropID.implicitLines */), () => this.reportSplitLinesError());
    }
    // get line range from a script with sorted line numbers
    fnGetLinesInRange(script, firstLine, lastLine) {
        return BasicFormatter.getLinesInRangeFromScript(script, firstLine, lastLine, this.core.getModel().getProperty("implicitLines" /* ModelPropID.implicitLines */), () => this.reportSplitLinesError());
    }
    reportSplitLinesError() {
        Utils.console.warn("splitLines: No line numbers?");
        this.outputError(this.vm.vmComposeError(Error(), 21, "split"), true);
    }
    fnGetStorageDirectoryEntries(mask) {
        return FileHandler.getStorageDirectoryEntries(this.getStorage(), mask);
    }
    fnFileCat(paras) {
        const stream = paras.stream, dirList = this.fnGetStorageDirectoryEntries();
        this.runtime.printDirectoryEntries(dirList, stream, true);
        // currently only from localstorage
    }
    fnFileDir(paras) {
        const stream = paras.stream, example = this.core.getModel().getProperty("example" /* ModelPropID.example */), dirList = FileHandler.getDirectoryEntries(this.getStorage(), this.core.getModel().getAllExamples(), example, paras.fileMask);
        this.runtime.printDirectoryEntries(dirList, stream, false);
    }
    fnFileEra(paras) {
        this.runtime.eraseFiles(this.getFileHandler(), paras, (name) => {
            if (Utils.debug > 0) {
                Utils.console.debug("fnEraseFile: name=" + name + ": removed from localStorage");
            }
        }, (name) => {
            Utils.console.warn("fnEraseFile: file not found in localStorage:", name);
        });
    }
    fnFileRen(paras) {
        this.runtime.renameFile(this.getFileHandler(), paras);
    }
    getBasicFormatter() {
        if (!this.basicFormatter) {
            this.basicFormatter = new BasicFormatter({
                lexer: this.basicLexer,
                parser: this.basicParser
            });
        }
        return this.basicFormatter;
    }
    getBasicTokenizer() {
        if (!this.basicTokenizer) {
            this.basicTokenizer = new BasicTokenizer();
        }
        return this.basicTokenizer;
    }
    getCodeGeneratorBasic() {
        if (!this.codeGeneratorBasic) {
            this.codeGeneratorBasic = new CodeGeneratorBasic({
                lexer: this.basicLexer,
                parser: this.basicParser,
                lowercaseVars: this.core.getModel().getProperty("prettyLowercaseVars" /* ModelPropID.prettyLowercaseVars */)
            });
        }
        return this.codeGeneratorBasic;
    }
    getCodeGeneratorToken() {
        if (!this.codeGeneratorToken) {
            this.codeGeneratorToken = new CodeGeneratorToken({
                lexer: this.basicLexer,
                parser: this.basicParser,
                implicitLines: this.core.getModel().getProperty("implicitLines" /* ModelPropID.implicitLines */)
            });
        }
        return this.codeGeneratorToken;
    }
    decodeTokenizedBasic(input) {
        const basicTokenizer = this.getBasicTokenizer();
        return basicTokenizer.decode(input);
    }
    encodeTokenizedBasic(input, name = "test") {
        const output = this.getCodeGeneratorToken().generateProgram(input);
        if (output.error) {
            this.outputError(output.error);
        }
        else if (Utils.debug > 1) {
            const outputText = output.text, hex = outputText.split("").map(function (s) { return s.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0"); }).join(","), decoded = this.decodeTokenizedBasic(outputText), diff = Diff.testDiff(input.toUpperCase(), decoded.toUpperCase()); // for testing
            Utils.console.debug("TokenizerInput (" + name + ") [len=" + input.length + "]:\n" + input);
            Utils.console.debug("TokenizerOutputHex (" + name + ") [len=" + outputText.length + "]:\n" + hex);
            Utils.console.debug("TokenizerOutputDecoded (" + name + ") [len=" + decoded.length + "]:\n" + decoded);
            Utils.console.debug("TokenizerDiff (" + name + ") [len=" + diff.length + "]:\n" + diff);
        }
        return output.text;
    }
    prettyPrintBasic(input, keepWhiteSpace, keepBrackets, keepColons) {
        const output = this.getCodeGeneratorBasic().generatePretty(input, keepWhiteSpace, keepBrackets, keepColons);
        if (output.error) {
            this.outputError(output.error);
        }
        return output.text;
    }
    applySnapshot(input) {
        const snapshot = new Snapshot({
            name: "",
            data: input
        });
        return snapshot.applyToVm(this.vm);
    }
    loadFileContinue(input) {
        const inFile = this.vm.vmGetInFileObject();
        this.runtime.continueLoad(input, inFile, {
            decode: (storedInput) => FileHandler.decodeStoredFile(storedInput, {
                atobFn: (value) => this.options.atobFn(value),
                decodeTokenizedBasic: (value) => this.decodeTokenizedBasic(value),
                applySnapshot: (value) => this.applySnapshot(value),
                importArchive: (value, type) => {
                    const imported = [];
                    this.getFileHandler().fnLoad2(value, inFile.name, type, imported);
                    return imported;
                }
            }),
            getSource: () => this.getInputText(),
            setSource: (source) => this.setInputText(source),
            clearResult: () => this.setResultText(""),
            merge: (source, loaded) => this.mergeScripts(source, loaded),
            invalidate: () => this.invalidateScript(),
            removeVariables: () => this.fnRemoveAllVariables(),
            reset: () => this.fnReset(),
            parseRun: () => this.fnParseRun(),
            parseChain: () => this.fnParseChain(),
            onUnknownCommand: (value) => Utils.console.error("loadExample: Unknown command:", value),
            startMainLoop: () => this.startMainLoop(),
            onWarning: (error) => Utils.console.warn(error),
            onError: (message) => Utils.console.error(message),
            decodeTokenizedBasic: (value) => this.decodeTokenizedBasic(value)
        });
    }
    createFnExampleLoaded(example, url, inFile) {
        return (_sFullUrl, key, suppressLog) => {
            if (key !== example) {
                Utils.console.warn("fnExampleLoaded: Unexpected", key, "<>", example);
            }
            const exampleEntry = this.core.getModel().getExample(example);
            if (!suppressLog) {
                Utils.console.log("Example loaded:", url, exampleEntry.meta);
            }
            this.core.getModel().setProperty("example" /* ModelPropID.example */, inFile.memorizedExample);
            const input = exampleEntry.script;
            this.runtime.completeExampleLoad(input, exampleEntry.rsx, (loadedInput) => this.loadFileContinue(loadedInput));
        };
    }
    createFnExampleError(example, url, inFile) {
        return () => {
            Utils.console.log("Example", url, "error");
            this.core.getModel().setProperty("example" /* ModelPropID.example */, inFile.memorizedExample);
            this.runtime.failExampleLoad(example, (error, noSelection) => this.outputError(error, noSelection), (input) => this.loadFileContinue(input));
        };
    }
    getLoadScript() {
        return this.options.loadScript; // || Utils.loadScript;
    }
    getOutputText() {
        return this.outScript;
    }
    setOutputText(text) {
        var _a, _b;
        this.outScript = text;
        this.invalidateScript();
        (_b = (_a = this.options).onOutputText) === null || _b === void 0 ? void 0 : _b.call(_a, text);
    }
    setResultText(text, _scroll = false) {
        var _a, _b;
        (_b = (_a = this.options).onResultText) === null || _b === void 0 ? void 0 : _b.call(_a, text);
    }
    loadExampleFile() {
        const inFile = this.vm.vmGetInFileObject(), key = this.core.getModel().getProperty("example" /* ModelPropID.example */), model = this.core.getModel(), plan = FileHandler.prepareExampleLoad(inFile.name, key, model.getAllExamples(), model.getDatabase().src), example = plan.name, exampleEntry = plan.entry, url = plan.url;
        inFile.memorizedExample = plan.memorizedExample;
        if (Utils.debug > 0) {
            Utils.console.debug("loadExample: name=" + example + " (current=" + key + ")");
        }
        if (plan.status === "loaded" && exampleEntry) {
            this.core.getModel().setProperty("example" /* ModelPropID.example */, example);
            const fnExampleLoaded = this.createFnExampleLoaded(example, url, inFile);
            fnExampleLoaded("", example, true);
        }
        else if (plan.status === "fetch" && exampleEntry) { // need to load
            this.core.getModel().setProperty("example" /* ModelPropID.example */, example);
            this.getLoadScript()(url, this.createFnExampleLoaded(example, url, inFile), this.createFnExampleError(example, url, inFile), example);
        }
        else { // keep original example in this error case
            if (example !== "") { // only if not empty
                Utils.console.warn("loadExample: Unknown file:", example);
                const fnExampleError = this.createFnExampleError(example, url, inFile);
                fnExampleError();
            }
            else {
                this.core.getModel().setProperty("example" /* ModelPropID.example */, example);
                this.runtime.completeExampleLoad("", undefined, (input) => this.loadFileContinue(input)); // empty input?
            }
        }
    }
    tryLoadingFromLocalStorage(name) {
        return FileHandler.loadFromStorage(this.getStorage(), name);
    }
    fnFileLoad() {
        const inFile = this.vm.vmGetInFileObject();
        this.runtime.dispatchFileLoad(inFile, {
            deleteLines: (paras) => this.fnDeleteLines(paras),
            logFile: (file) => {
                if (Utils.debug > 1) {
                    Utils.console.debug("fnFileLoad:", file.command, file.name, "details:", file);
                }
            },
            loadFromStorage: (name) => this.tryLoadingFromLocalStorage(name),
            onStorageLoad: (input) => {
                if (Utils.debug > 0) {
                    Utils.console.debug("fnFileLoad:", inFile.command, inFile.name, "from localStorage");
                }
                this.loadFileContinue(input);
            },
            loadExample: () => this.loadExampleFile(),
            onNotOpen: (name) => Utils.console.error("fnFileLoad:", name, "File not open!"),
            setNextDelay: (delay) => this.runtime.setNextDelay(delay)
        });
    }
    fnFileSave() {
        const outFile = this.vm.vmGetOutFileObject();
        this.runtime.dispatchFileSave(outFile, (file) => this.getFileHandler().saveFile(file, () => this.getInputText(), (input, storageName) => this.encodeTokenizedBasic(input, storageName)).data, (name) => {
            if (Utils.debug > 0) {
                Utils.console.debug("fnFileSave: name=" + name + ": put into localStorage");
            }
        }, () => Utils.console.error("fnFileSave: file not open!"), (error) => Utils.console.warn(error));
    }
    fnDeleteLines(paras) {
        const inputText = this.getInputText(), lines = this.fnGetLinesInRange(inputText, paras.first || 0, paras.last || 65535);
        this.runtime.deleteProgramLines(paras, lines, (deletion) => this.setInputText(this.mergeScripts(inputText, deletion)), (error) => this.outputError(error, true));
    }
    fnNew() {
        this.runtime.newProgram(() => this.setInputText(""), () => this.invalidateScript());
    }
    fnList(paras) {
        const input = this.getInputText(), stream = paras.stream, lines = this.fnGetLinesInRange(input, paras.first || 0, paras.last || 65535);
        this.runtime.listProgram(lines, stream);
    }
    fnReset() {
        this.runtime.resetProgram(() => undefined, () => this.setOutputText(""), () => this.invalidateScript());
    }
    outputError(error, noSelection) {
        var _a, _b;
        const stream = 0, diagnostic = Utils.createDiagnostic(error, noSelection, error.name === "CpcVm" ? this.vm.err() : undefined), shortError = diagnostic.shortMessage;
        (_b = (_a = this.options).onDiagnostic) === null || _b === void 0 ? void 0 : _b.call(_a, diagnostic);
        const escapedShortError = Utils.escapeControlCharacters(shortError);
        this.vm.print(stream, escapedShortError + "\r\n");
        return shortError;
    }
    fnRenumLines(paras) {
        this.runtime.renumProgram(this.getInputText(), paras, (source, newLine, oldLine, step, keep) => this.getBasicFormatter().renumber(source, newLine, oldLine, step, keep), (source) => this.setInputText(source, true), (error) => {
            Utils.console.warn(error);
            this.outputError(error);
        });
    }
    fnEditLineCallback() {
        const inputParas = this.vm.vmGetStopObject().paras, inputText = this.getInputText();
        return this.runtime.commitEditedLine(inputParas, inputText, (source, edited) => this.mergeScripts(source, edited), (source) => this.setInputText(source));
    }
    fnEditLine(paras) {
        const input = this.getInputText(), lineNumber = paras.first || 0, lines = this.fnGetLinesInRange(input, lineNumber, lineNumber);
        if (lines.length) {
            if (this.runtime.editLine(paras, lines[0], this.fnEditLineCallbackHandler, (error) => this.outputError(error))) {
                this.fnWaitInput();
            }
        }
    }
    fnParse() {
        return this.runtime.parseProgram();
    }
    presentCompileOutput(output) {
        let outputString;
        if (output.error) {
            outputString = this.outputError(output.error);
        }
        else {
            outputString = output.text;
        }
        if (outputString && outputString.length > 0) {
            outputString += "\n";
        }
        this.setOutputText(outputString);
        this.invalidateScript();
        return this.getOutputText();
    }
    fnParseAndStart(clearVariables, clearBeforeRun) {
        this.runtime.compileAndStartProgram({
            clearVariables,
            clearBeforeRun
        });
    }
    fnPretty() {
        const model = this.core.getModel();
        const input = this.getInputText(), keepWhiteSpace = model.getProperty("prettySpace" /* ModelPropID.prettySpace */), keepBrackets = model.getProperty("prettyBrackets" /* ModelPropID.prettyBrackets */), keepColons = model.getProperty("prettyColons" /* ModelPropID.prettyColons */), output = this.prettyPrintBasic(input, keepWhiteSpace, keepBrackets, keepColons);
        if (output) {
            this.setInputText(output, true);
            const diff = Diff.testDiff(input.toUpperCase(), output.toUpperCase());
            this.setOutputText(diff);
        }
    }
    fnAddLines() {
        const input = this.getInputText(), output = Controller0.addLineNumbers(input);
        if (output) {
            this.setInputText(output, true);
        }
    }
    fnRemoveLines() {
        const basicFormatter = this.getBasicFormatter();
        const input = this.getInputText(), output = basicFormatter.removeUnusedLines(input);
        if (output.error) {
            this.outputError(output.error);
        }
        else {
            this.setInputText(output.text, true);
        }
    }
    // eslint-disable-next-line complexity
    fnDownload() {
        const options = ["test1"], exportTokenized = false, exportDSK = false, format = "data", stripEmpty = false, exportBase64 = false, meta = {
            typeString: "A", // ASCII
            start: 0x170,
            length: 0,
            entry: 0
        };
        let diskImage, name = "", data = "";
        const btoaFn = this.options.btoaFn;
        const fnExportBase64 = function () {
            meta.encoding = "base64";
            const metaString = FileHandler.joinMeta(meta);
            data = metaString + "," + btoaFn(data);
            name += ".b64.txt";
        };
        if (exportDSK) {
            diskImage = this.getFileHandler().getDiskImage();
            diskImage.setOptions({
                diskName: "test",
                data: diskImage.formatImage(format) // data or system
            });
        }
        for (let i = 0; i < options.length; i += 1) {
            const item = options[i];
            name = item;
            data = this.tryLoadingFromLocalStorage(name) || "";
            const metaAndData = FileHandler.splitMeta(data);
            Object.assign(meta, metaAndData.meta); // copy meta info
            data = metaAndData.data;
            if (exportTokenized && meta.typeString === "A") { // do we need to tokenize it?
                const tokens = this.encodeTokenizedBasic(data);
                if (tokens) { // successful?
                    data = tokens;
                    meta.typeString = "T";
                    meta.start = 0x170;
                    meta.length = data.length;
                    meta.entry = 0;
                }
                else {
                    Utils.console.warn("Controller: Cannot tokenize, keeping ASCII: " + item);
                }
            }
            if (meta.typeString !== "A" && meta.typeString !== "X" && meta.typeString !== "Z") {
                const [name1, ext1] = DiskImage.getFilenameAndExtension(name), // eslint-disable-line array-element-newline
                header = DiskImage.createAmsdosHeader({
                    name: name1,
                    ext: ext1,
                    typeString: meta.typeString,
                    start: meta.start,
                    length: meta.length,
                    entry: meta.entry
                }), headerString = DiskImage.combineAmsdosHeader(header);
                data = headerString + data;
            }
            if (diskImage) {
                diskImage.writeFile(name, data);
                const diskOptions = diskImage.getOptions();
                data = diskOptions.data; // we need the modified disk image with the file(s) inside
                name = name.substring(0, name.indexOf(".") + 1) + "dsk";
                meta.length = data.length;
                meta.typeString = "X"; // (extended) disk image
            }
            else {
                if (exportBase64) {
                    fnExportBase64();
                }
            }
            if (diskImage) {
                if (stripEmpty) {
                    data = diskImage.stripEmptyTracks();
                }
                if (exportBase64) {
                    fnExportBase64();
                }
            }
        }
    }
    fnChain(paras, clearBeforeRun = false) {
        const line = paras && paras.first || 0;
        this.runtime.startProgram(this.getOutputText(), line, clearBeforeRun);
    }
    beforeProgramStart() {
        if (this.vm.vmGetOutFileObject().open) {
            this.fnFileSave();
        }
    }
    afterProgramStart() {
        if (Utils.debug > 1) {
            Utils.console.debug("End of fnRun");
        }
    }
    fnRun(paras) {
        this.fnChain(paras, true);
    }
    fnParseRun() {
        this.fnParseAndStart(true, true);
    }
    fnParseChain() {
        this.fnParseAndStart(false, false);
    }
    fnDirectInput() {
        const directInput = this.runtime.readDirectInput(), { input, stream } = directInput;
        if (input !== "") { // direct input
            const inputText = this.getInputText();
            if (directInput.isProgramLine) {
                if (Utils.debug > 0) {
                    Utils.console.debug("fnDirectInput: insert line=" + input);
                }
                this.runtime.insertDirectProgramLine(inputText, input, stream, (source, line) => this.mergeScripts(source, line), (source) => this.setInputText(source, true));
                this.updateResultText();
                return false; // continue direct input
            }
            if (Utils.debug > 0) {
                Utils.console.log("fnDirectInput: execute:", input);
            }
            const output = this.runtime.executeDirectCommand(input, inputText, this.vm.line, stream, directInput.message, {
                outputError: (error) => this.outputError(error, true),
                setOutputText: (text) => this.setOutputText(text),
                onPrepareError: (error) => {
                    Utils.console.error(error);
                    if (error instanceof Error) {
                        this.outputError(error, true);
                    }
                }
            });
            if (!output.error) {
                this.updateResultText();
                return true;
            }
        }
        this.updateResultText();
        return false;
    }
    startWithDirectInput() {
        if (this.options.isHeadlessDirectInput) {
            //this.stopUpdateCanvas();
            if (Utils.debug) {
                Utils.console.log("We are ready.");
            }
            if (this.options.onProgramEnd) {
                this.options.onProgramEnd();
            }
            return;
        }
        this.runtime.enterDirectMode(this.fnDirectInputHandler);
        this.fnWaitInput();
    }
    updateResultText() {
        const outText = this.vm.vmGetOutBuffer();
        this.setResultText(outText, true);
    }
    exitLoop() {
        const stop = this.vm.vmGetStopObject(), reason = stop.reason;
        this.updateResultText();
        if (reason === "stop" || reason === "end" || reason === "error" || reason === "parse" || reason === "parseRun") {
            this.startWithDirectInput();
        }
    }
    getExecutionState() {
        return this.runtime.getExecutionState();
    }
    startMainLoop() {
        this.runtime.startMainLoop();
    }
    startParse() {
        this.runtime.beginControl("parse");
        this.startMainLoop();
    }
    startRenum(options = {}) {
        const stream = 0;
        this.runtime.beginRenumber(options);
        if (this.vm.pos(stream) > 1) {
            this.vm.print(stream, "\r\n");
        }
        this.vm.print(stream, "renum\r\n");
        this.startMainLoop();
    }
    startRun() {
        this.runtime.beginControl("run");
        this.startMainLoop();
    }
    startParseRun() {
        this.runtime.beginControl("parseRun");
        this.startMainLoop();
    }
    startBreak() {
        this.runtime.beginControl("break");
        this.startMainLoop();
    }
    startEscape() {
        const action = this.runtime.handleEscape(this.options.keyboard);
        if (action === "ignored" || action === "input") {
            this.updateResultText();
            return;
        }
        this.startMainLoop();
    }
    startContinue() {
        this.runtime.continueProgram(() => this.startMainLoop());
    }
    startReset() {
        this.runtime.beginControl("reset");
        this.startMainLoop();
    }
    putKeys(keys) {
        this.fnPutKeysInBuffer(keys);
        const reason = this.vm.vmGetStopObject().reason;
        if (reason === "direct") {
            this.fnWaitInput();
        }
        else if (reason === "escape") {
            if (this.options.keyboard.getKeyFromBuffer() !== "") {
                this.vm.cursor(0, 0);
                this.startContinue();
            }
        }
        else if (reason === "waitInput" || reason === "waitKey") {
            this.startMainLoop();
        }
    }
    fnPutKeysInBuffer(keys) {
        for (let i = 0; i < keys.length; i += 1) {
            this.options.keyboard.putKeyInBuffer(keys.charAt(i), i === keys.length - 1);
        }
    }
    setBasicVersion(basicVersion) {
        this.runtime.setBasicVersion(basicVersion);
        this.invalidateScript();
    }
    adaptFilename(name, err) {
        return this.vm.vmAdaptFilename(name, err);
    }
    getFileHandler() {
        if (!this.fileHandler) {
            this.fileHandler = new FileHandler({
                adaptFilename: this.adaptFilename.bind(this),
                updateStorageDatabase: this.updateStorageDatabase.bind(this),
                outputError: this.outputError.bind(this),
                processFileImports: this.core.getModel().getProperty("processFileImports" /* ModelPropID.processFileImports */),
                storage: this.storage
            });
        }
        return this.fileHandler;
    }
    createFnDatabaseLoaded(url) {
        return (_sFullUrl, key) => {
            const selectedName = this.core.getModel().getProperty("database" /* ModelPropID.database */);
            if (selectedName === key) {
                this.core.getModel().getDatabase().loaded = true;
            }
            else { // should not occur
                Utils.console.warn("databaseLoaded: name changed: " + key + " => " + selectedName);
                this.core.getModel().setProperty("database" /* ModelPropID.database */, key);
                const database = this.core.getModel().getDatabase();
                if (database) {
                    database.loaded = true;
                }
                this.core.getModel().setProperty("database" /* ModelPropID.database */, selectedName);
            }
            Utils.console.log("fnDatabaseLoaded: database loaded: " + key + ": " + url);
            this.onDirectorySelectChange();
        };
    }
    createFnDatabaseError(url) {
        return (_sFullUrl, key) => {
            Utils.console.error("fnDatabaseError: database error: " + key + ": " + url);
            this.onDirectorySelectChange();
            this.setInputText("");
            this.setResultText("Cannot load database: " + key);
        };
    }
    onDatabaseSelectChange() {
        this.loadDatabase();
    }
    loadDatabase(name) {
        const model = this.core.getModel();
        if (name !== undefined) {
            model.setProperty("database" /* ModelPropID.database */, name);
        }
        const databaseName = model.getProperty("database" /* ModelPropID.database */);
        const database = model.getDatabase();
        if (!database) {
            Utils.console.error("onDatabaseSelectChange: database not available:", databaseName);
            return;
        }
        if (database.text === "storage") { // special handling: browser localStorage
            this.updateStorageDatabase("set", ""); // set all
            database.loaded = true;
        }
        if (database.loaded) {
            this.loadExample(model.getProperty("example" /* ModelPropID.example */));
        }
        else {
            this.setInputText("#loading database " + databaseName + "...");
            const exampleIndex = this.core.getModel().getProperty("exampleIndex" /* ModelPropID.exampleIndex */);
            const url = database.src + "/" + exampleIndex;
            const loadScriptFn = this.getLoadScript();
            loadScriptFn(url, this.createFnDatabaseLoaded(url), this.createFnDatabaseError(url), databaseName);
        }
    }
    onDirectorySelectChange() {
        this.onExampleSelectChange();
    }
    onExampleSelectChange() {
        this.loadExample(this.core.getModel().getProperty("example" /* ModelPropID.example */));
    }
    loadExample(key, options = {}) {
        var _a, _b;
        const model = this.core.getModel();
        const vm = this.vm, inFile = vm.vmGetInFileObject(), dataBaseName = model.getProperty("database" /* ModelPropID.database */);
        model.setProperty("example" /* ModelPropID.example */, key);
        vm.closein();
        inFile.open = true;
        const request = FileHandler.createExampleLoadRequest(key, dataBaseName, (_a = model.getExample(key)) === null || _a === void 0 ? void 0 : _a.meta, (_b = options.autorun) !== null && _b !== void 0 ? _b : model.getProperty("autorun" /* ModelPropID.autorun */));
        inFile.command = request.command;
        inFile.name = request.name;
        inFile.start = undefined;
        inFile.fnFileCallback = vm.vmGetLoadHandler();
        vm.vmStop("fileLoad", 90);
        this.startMainLoop();
    }
    fnArrayBounds() {
        const arrayBounds = this.core.getModel().getProperty("arrayBounds" /* ModelPropID.arrayBounds */);
        this.runtime.setArrayBounds(arrayBounds);
    }
    fnImplicitLines() {
        const implicitLines = this.core.getModel().getProperty("implicitLines" /* ModelPropID.implicitLines */);
        this.runtime.setImplicitLines(implicitLines);
    }
    fnRemoveAllVariables() {
        if (Object.keys(this.variables.getAllVariables()).length) {
            this.variables.removeAllVariables();
        }
    }
    fnPrettyLowercaseVars() {
        const lowercaseVars = this.core.getModel().getProperty("prettyLowercaseVars" /* ModelPropID.prettyLowercaseVars */);
        this.runtime.setPrettyLowercaseVars(lowercaseVars);
    }
    fnIntegerOverflow() {
        const integerOverflow = this.core.getModel().getProperty("integerOverflow" /* ModelPropID.integerOverflow */);
        this.runtime.setIntegerOverflow(integerOverflow);
    }
    fnTrace() {
        const trace = this.core.getModel().getProperty("trace" /* ModelPropID.trace */);
        this.runtime.setTrace(trace);
    }
    fnSpeed() {
        const speed = this.core.getModel().getProperty("speed" /* ModelPropID.speed */);
        this.initialLoopTimeout = Runtime.getLoopDelay(speed);
    }
}
//# sourceMappingURL=Controller0.js.map