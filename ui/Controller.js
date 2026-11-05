// Controller.ts - Controller
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//
import { UiUtils } from "./UiUtils";
import { BasicFormatter } from "../BasicFormatter";
import { BasicTokenizer } from "../BasicTokenizer";
import { Canvas } from "./Canvas";
import { CodeGeneratorBasic } from "../CodeGeneratorBasic";
import { CodeGeneratorToken } from "../CodeGeneratorToken";
import { cpcCharset } from "../cpcCharset";
import { Diff } from "../Diff";
import { DiskImage } from "../DiskImage";
import { FileHandler } from "../FileHandler";
import { FileSelect } from "./FileSelect";
import { InputStack } from "../InputStack";
import { Utils } from "../Utils";
import { Keyboard } from "./Keyboard";
import { NoCanvas } from "./NoCanvas";
import { TextCanvas } from "./TextCanvas";
import { VirtualKeyboard } from "./VirtualKeyboard";
import { Snapshot } from "../Snapshot";
import { Sound } from "./Sound";
import { View } from "./View";
import { DragElement } from "./DragElement";
import { Random } from "../Random";
import { UiController } from "./UiController";
import { Z80Disass } from "../Z80Disass"; // test
import { createBrowserHost } from "./BrowserHost";
import { Runtime } from "../Runtime";
export class Controller {
    constructor(core, view, options = {}) {
        this.outScript = "";
        this.initialLoopTimeout = 0;
        this.inputSet = false;
        this.canvases = {};
        this.inputStack = new InputStack();
        this.sound = new Sound({
            AudioContextConstructor: window.AudioContext
        });
        this.dragElementsData = {
            entries: {
                consoleLogArea: {
                    itemId: "consoleLogArea" /* ViewID.consoleLogArea */,
                    xOffset: 0,
                    yOffset: 0,
                    enabled: false
                },
                cpcArea: {
                    itemId: "cpcArea" /* ViewID.cpcArea */,
                    xOffset: 0,
                    yOffset: 0,
                    enabled: false
                },
                disassArea: {
                    itemId: "disassArea" /* ViewID.disassArea */,
                    xOffset: 0,
                    yOffset: 0,
                    enabled: false
                },
                inp2Area: {
                    itemId: "inp2Area" /* ViewID.inp2Area */,
                    xOffset: 0,
                    yOffset: 0,
                    enabled: false
                },
                inputArea: {
                    itemId: "inputArea" /* ViewID.inputArea */,
                    xOffset: 0,
                    yOffset: 0,
                    enabled: false
                },
                kbdArea: {
                    itemId: "kbdArea" /* ViewID.kbdArea */,
                    xOffset: 0,
                    yOffset: 0,
                    enabled: false
                },
                mainArea: {
                    itemId: "mainArea" /* ViewID.mainArea */,
                    xOffset: 0,
                    yOffset: 0,
                    enabled: false
                },
                outputArea: {
                    itemId: "outputArea" /* ViewID.outputArea */,
                    xOffset: 0,
                    yOffset: 0,
                    enabled: false
                },
                resultArea: {
                    itemId: "resultArea" /* ViewID.resultArea */,
                    xOffset: 0,
                    yOffset: 0,
                    enabled: false
                },
                variableArea: {
                    itemId: "variableArea" /* ViewID.variableArea */,
                    xOffset: 0,
                    yOffset: 0,
                    enabled: false
                }
            }
        };
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
        this.fnWaitKeyHandler = this.fnWaitKey.bind(this);
        this.fnWaitInputHandler = this.fnWaitInput.bind(this);
        this.fnOnEscapeHandler = this.fnOnEscape.bind(this);
        this.fnDirectInputHandler = this.fnDirectInput.bind(this);
        this.fnPutKeyInBufferHandler = this.fnPutKeysInBuffer.bind(this);
        this.fnOnDragoverHandler = Controller.fnOnDragover;
        this.fnOnUserActionHandler = this.onUserAction.bind(this);
        this.fnWaitForContinueHandler = this.fnWaitForContinue.bind(this);
        this.fnEditLineCallbackHandler = this.fnEditLineCallback.bind(this);
        this.fnOnUserKeyClickHandler = this.onUserKeyClick.bind(this);
        this.core = core;
        const model = this.core.getModel();
        this.model = model;
        this.view = view;
        this.outScript = view.getAreaValue("outputText" /* ViewID.outputText */);
        this.options = options;
        this.host = createBrowserHost(options);
        this.view.addEventListenerById("click", this.fnOnUserKeyClickHandler, "userKeys" /* ViewID.userKeys */);
        this.uiController = new UiController(core, view, this, this.fnOnUserActionHandler);
        this.canvas = this.setCanvasType(model.getProperty("canvasType" /* ModelPropID.canvasType */));
        this.fnSpeed();
        this.keyboard = new Keyboard({
            view: this.view,
            fnOnEscapeHandler: this.fnOnEscapeHandler
        });
        if (this.model.getProperty("showKbd" /* ModelPropID.showKbd */)) { // maybe we need to draw virtual keyboard
            this.getVirtualKeyboard();
        }
        // check first user action, also if sound is not yet on
        const random = new Random(model.getProperty("random" /* ModelPropID.random */) === "cpc");
        this.runtime = new Runtime({
            canvas: this.canvas,
            keyboard: this.keyboard,
            sound: this.sound,
            random,
            arrayBounds: model.getProperty("arrayBounds" /* ModelPropID.arrayBounds */),
            basicVersion: model.getProperty("basicVersion" /* ModelPropID.basicVersion */),
            trace: model.getProperty("trace" /* ModelPropID.trace */),
            implicitLines: model.getProperty("implicitLines" /* ModelPropID.implicitLines */),
            integerOverflow: model.getProperty("integerOverflow" /* ModelPropID.integerOverflow */),
            onClickKey: this.fnPutKeyInBufferHandler,
            encodeTokens: (input) => this.encodeTokenizedBasic(input),
            outputError: this.outputError.bind(this),
            onJsError: (error) => this.selectJsError(this.getOutputText(), error),
            logger: UiUtils.console,
            getCodeGeneratorBasic: () => this.getCodeGeneratorBasic(),
            getCodeGeneratorToken: () => this.codeGeneratorToken,
            onVariablesCleared: () => this.uiController.refreshVariables(),
            onTokenized: (sourceLength, tokenLength) => {
                if (UiUtils.debug) {
                    UiUtils.console.debug("parse: input length:", sourceLength, ", tokenized length:", tokenLength);
                }
            },
            onMemoryError: (error) => UiUtils.console.error("vmPutProgramInMem", error),
            programHost: {
                getSource: () => this.getInputText(),
                beforeCompileProgram: (source) => this.updateUserKeys(source),
                prepareCompileOutput: (output) => this.presentCompileOutput(output),
                beforeProgramStart: () => this.beforeProgramStart(),
                afterProgramStart: () => this.afterProgramStart()
            },
            handlers: Object.fromEntries(Object.entries(this.handlers).map(([reason, handler]) => [reason, handler.bind(this)])),
            getInitialDelay: () => this.initialLoopTimeout,
            setTimeout: (callback, delay) => this.host.setTimeout(callback, delay),
            onExit: () => this.exitLoop(),
            onExecutionState: (state) => {
                var _a;
                this.uiController.onExecutionState(state);
                (_a = options.onExecutionState) === null || _a === void 0 ? void 0 : _a.call(options, state);
            },
            onUnknownReason: (reason) => UiUtils.console.warn("runLoop: Unknown run mode:", reason)
        });
        this.variables = this.runtime.variables;
        this.vm = this.runtime.vm;
        this.basicParser = this.runtime.basicParser;
        this.basicLexer = this.runtime.basicLexer;
        const onCanvasClick = (event, x, y, xTxt, yTxt) => {
            const handler = this.vm.getOnCanvasClickHandler();
            handler(x, y, xTxt, yTxt, event.detail === 2);
        };
        this.vmOnCanvasClickHandler = onCanvasClick;
        this.vm.getOnCanvasClickHandler();
        this.canvas.setOptions({
            //onCanvasClick: this.vm.getOnCanvasClickHandler()
            onCanvasClick
        });
        this.vm.setCanvas(this.canvas);
        this.runtime.reset();
        if (model.getProperty("sound" /* ModelPropID.sound */)) { // activate sound needs user action
            this.setSoundActive(); // activate in waiting state
        }
        this.initDropZone();
        const example = model.getProperty("example" /* ModelPropID.example */);
        view.setSelectValue("exampleSelect" /* ViewID.exampleSelect */, example);
        //this.hasStorageDatabase = this.initDatabases();
        this.setDatabaseSelectOptions();
        this.hasStorageDatabase = this.getHasStorageDatabase();
        if (model.getProperty("showCpc" /* ModelPropID.showCpc */)) {
            this.canvas.startUpdateCanvas();
        }
        if (model.getProperty("dragElements" /* ModelPropID.dragElements */)) {
            this.fnDragElementsActive(true);
        }
    }
    getStorage() {
        return this.host.storage;
    }
    getCanvas() {
        return this.canvas;
    }
    //TODO
    /*
    private static getUniqueDbKey(name: string, databases: DatabasesType) {
        let key = name,
            index = 2;

        while (databases[key]) {
            key = name + index;
            index += 1;
        }
        return key;
    }

    private initDatabases() {
        /*
        const model = this.model,
            databases: DatabasesType = {},
            databaseDirs = model.getProperty<string>(ModelPropID.databaseDirs).split(",");
        let hasStorageDatabase = false;

        for (let i = 0; i < databaseDirs.length; i += 1) {
            const databaseDir = databaseDirs[i],
                parts1 = databaseDir.split("="),
                databaseSrc = parts1[0],
                assignedName = parts1.length > 1 ? parts1[1] : "",
                parts2 = databaseSrc.split("/"),
                name = assignedName || parts2[parts2.length - 1],
                key = Controller.getUniqueDbKey(name, databases);

            databases[key] = {
                text: key,
                title: databaseSrc,
                src: databaseSrc
            };
            if (databaseDir === "storage") {
                hasStorageDatabase = true;
            }
        }
        this.model.addDatabases(databases);

        this.setDatabaseSelectOptions();
        return hasStorageDatabase;
    }
    */
    getHasStorageDatabase() {
        const databases = this.model.getAllDatabases();
        let hasStorageDatabase = false;
        for (const value in databases) {
            if (databases.hasOwnProperty(value)) {
                if (value === "storage") {
                    hasStorageDatabase = true;
                }
            }
        }
        return hasStorageDatabase;
    }
    /*
    private initDatabases() {
        return getHasStorageDatabase
    }
    ∂*/
    onUserAction( /* event, id */) {
        this.uiController.deactivateUserAction(); // deactivate user action
        this.sound.setActivatedByUser();
        this.setSoundActive();
    }
    setDatabaseSelectOptions() {
        const items = [], databases = this.model.getAllDatabases(), database = this.model.getProperty("database" /* ModelPropID.database */);
        for (const value in databases) {
            if (databases.hasOwnProperty(value)) {
                const db = databases[value], item = {
                    value: value,
                    text: db.text,
                    title: db.title,
                    selected: value === database
                };
                items.push(item);
            }
        }
        this.view.setSelectOptions("databaseSelect" /* ViewID.databaseSelect */, items);
    }
    static getPathFromExample(example) {
        const index = example.lastIndexOf("/");
        let path = "";
        if (index >= 0) {
            path = example.substring(0, index);
        }
        return path;
    }
    static getNameFromExample(example) {
        const index = example.lastIndexOf("/");
        let name = example;
        if (index >= 0) {
            name = example.substring(index + 1);
        }
        return name;
    }
    setDirectorySelectOptions() {
        const items = [], allExamples = this.model.getAllExamples(), examplePath = Controller.getPathFromExample(this.model.getProperty("example" /* ModelPropID.example */)), directorySeen = {};
        for (const key in allExamples) {
            if (allExamples.hasOwnProperty(key)) {
                const exampleEntry = allExamples[key], value = Controller.getPathFromExample(exampleEntry.key);
                if (!directorySeen[value]) {
                    const item = {
                        value: value,
                        text: value,
                        title: value,
                        selected: value === examplePath
                    };
                    items.push(item);
                    directorySeen[value] = true;
                }
            }
        }
        this.view.setSelectOptions("directorySelect" /* ViewID.directorySelect */, items);
    }
    setExampleSelectOptions() {
        const maxTitleLength = 160, maxTextLength = 60, // (32 visible?)
        items = [], exampleName = Controller.getNameFromExample(this.model.getProperty("example" /* ModelPropID.example */)), allExamples = this.model.getAllExamples(), directoryName = this.view.getSelectValue("directorySelect" /* ViewID.directorySelect */), selectDataFiles = this.model.getProperty("selectDataFiles" /* ModelPropID.selectDataFiles */);
        let exampleSelected = false;
        for (const key in allExamples) {
            if (allExamples.hasOwnProperty(key) && (Controller.getPathFromExample(key) === directoryName)) {
                const exampleEntry = allExamples[key], exampleName2 = Controller.getNameFromExample(exampleEntry.key);
                if (selectDataFiles || (exampleEntry.meta !== "D")) { // skip data files
                    const title = (exampleName2 + ": " + exampleEntry.title).substring(0, maxTitleLength), item = {
                        value: exampleName2,
                        title: title,
                        text: title.substring(0, maxTextLength),
                        selected: exampleName2 === exampleName
                    };
                    if (item.selected) {
                        exampleSelected = true;
                    }
                    items.push(item);
                }
            }
        }
        if (!exampleSelected && items.length) {
            items[0].selected = true; // if example is not found, select first element
        }
        this.view.setSelectOptions("exampleSelect" /* ViewID.exampleSelect */, items);
    }
    setGalleryAreaInputs() {
        const database = this.model.getDatabase(), directory = this.view.getSelectValue("directorySelect" /* ViewID.directorySelect */), options = this.view.getSelectOptions("exampleSelect" /* ViewID.exampleSelect */), inputs = [];
        for (let i = 0; i < options.length; i += 1) {
            const item = options[i], input = {
                value: item.value,
                title: item.title,
                checked: item.selected,
                imgUrl: database.src + "/" + directory + "/img/" + item.value + ".png"
            };
            inputs.push(input);
        }
        this.view.setAreaInputList("galleryAreaItems" /* ViewID.galleryAreaItems */, inputs);
    }
    setExportSelectOptions(select) {
        const dirList = this.fnGetStorageDirectoryEntries(), items = [], editorText = Controller.exportEditorText;
        dirList.sort(); // we sort keys without editorText
        dirList.unshift(editorText);
        for (let i = 0; i < dirList.length; i += 1) {
            const key = dirList[i], title = key, item = {
                value: key,
                text: title,
                title: title,
                selected: title === editorText
            };
            items.push(item);
        }
        // sort already done
        this.view.setSelectOptions(select, items);
    }
    updateStorageDatabase(action, key) {
        if (!this.hasStorageDatabase) {
            return;
        }
        const database = this.model.getProperty("database" /* ModelPropID.database */), storage = this.getStorage();
        let selectedExample = "", exampleChanged = false;
        if (database !== "storage") {
            this.model.setProperty("database" /* ModelPropID.database */, "storage"); // switch to storage database
        }
        else {
            selectedExample = this.view.getSelectValue("exampleSelect" /* ViewID.exampleSelect */);
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
                this.model.removeExample(key);
            }
            else if (action === "set") {
                let example = this.model.getExample(key);
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
                    this.model.setExample(example);
                }
            }
            else {
                UiUtils.console.error("updateStorageDatabase: unknown action", action);
            }
        }
        if (database === "storage") {
            this.setDirectorySelectOptions();
            if (exampleChanged) {
                this.onDirectorySelectChange();
            }
            else {
                this.setExampleSelectOptions();
            }
        }
        else {
            this.model.setProperty("database" /* ModelPropID.database */, database); // restore database
        }
    }
    removeKeyBoardHandler() {
        this.keyboard.setOptions({
            fnOnKeyDown: undefined
        });
    }
    getInputText() {
        return this.view.getAreaValue("inputText" /* ViewID.inputText */);
    }
    setInputText(input, keepStack) {
        var _a, _b;
        this.view.setAreaValue("inputText" /* ViewID.inputText */, input);
        this.updateUserKeys(input);
        if (!keepStack) {
            this.fnInitUndoRedoButtons();
        }
        else {
            this.fnUpdateUndoRedoButtons();
        }
        (_b = (_a = this.options).onInputText) === null || _b === void 0 ? void 0 : _b.call(_a, input, keepStack);
    }
    invalidateScript() {
        this.runtime.invalidateProgram();
    }
    fnWaitForContinue() {
        const stream = 0, key = this.keyboard.getKeyFromBuffer();
        if (key !== "") {
            this.vm.cursor(stream, 0);
            this.removeKeyBoardHandler();
            this.startContinue();
        }
    }
    fnOnEscape() {
        this.startEscape();
    }
    startEscape() {
        const action = this.runtime.handleEscape(this.keyboard);
        if (action === "ignored" || action === "input") {
            this.updateResultText();
            return;
        }
        if (action === "suspended") {
            this.keyboard.setOptions({
                fnOnKeyDown: this.fnWaitForContinueHandler
            });
        }
        else {
            this.removeKeyBoardHandler();
        }
        this.startMainLoop();
    }
    fnWaitSound() {
        this.runtime.handleWaitSound(this.sound.isActivatedByUser());
    }
    fnWaitKey() {
        const key = this.runtime.handleWaitKey(() => this.sound.isActivatedByUser(), (key) => UiUtils.console.log("Wait for key:", key));
        if (key !== "") {
            this.removeKeyBoardHandler();
        }
        else {
            // wait until keypress handler (for call &bb18)
            this.keyboard.setOptions({
                fnOnKeyDown: this.fnWaitKeyHandler
            });
        }
        return key;
    }
    fnWaitInput() {
        const result = this.runtime.handleWaitInput({
            onInvalid: (error) => this.outputError(error, true),
            onInputReturn: (editedInput) => {
                UiUtils.console.log("fnWaitInput:", editedInput, "reason", this.vm.vmGetStopObject().reason);
            },
            onInputSubmitted: () => this.removeKeyBoardHandler(),
            startMainLoop: () => this.startMainLoop(),
            continueExecution: () => this.startContinue()
        });
        if (result.status === "invalid") {
            return;
        }
        if (result.status === "pending") {
            if (result.reason === "waitInput") {
                this.fnWaitSound();
            }
            // make sure the handler is set
            this.keyboard.setOptions({
                fnOnKeyDown: this.fnWaitInputHandler
            });
        }
    }
    // merge two scripts with sorted line numbers, lines from script2 overwrite lines from script1
    mergeScripts(script1, script2) {
        return BasicFormatter.mergeScripts(script1, script2, this.model.getProperty("implicitLines" /* ModelPropID.implicitLines */), () => this.reportSplitLinesError());
    }
    // get line range from a script with sorted line numbers
    fnGetLinesInRange(script, firstLine, lastLine) {
        return BasicFormatter.getLinesInRangeFromScript(script, firstLine, lastLine, this.model.getProperty("implicitLines" /* ModelPropID.implicitLines */), () => this.reportSplitLinesError());
    }
    reportSplitLinesError() {
        UiUtils.console.warn("splitLines: No line numbers?");
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
        const stream = paras.stream, example = this.model.getProperty("example" /* ModelPropID.example */), dirList = FileHandler.getDirectoryEntries(this.getStorage(), this.model.getAllExamples(), example, paras.fileMask);
        this.runtime.printDirectoryEntries(dirList, stream, false);
    }
    fnFileEra(paras) {
        this.runtime.eraseFiles(this.getFileHandler(), paras, (name) => {
            if (UiUtils.debug > 0) {
                UiUtils.console.debug("fnEraseFile: name=" + name + ": removed from localStorage");
            }
        }, (name) => {
            UiUtils.console.warn("fnEraseFile: file not found in localStorage:", name);
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
                lowercaseVars: this.model.getProperty("prettyLowercaseVars" /* ModelPropID.prettyLowercaseVars */)
            });
        }
        return this.codeGeneratorBasic;
    }
    getCodeGeneratorToken() {
        if (!this.codeGeneratorToken) {
            this.codeGeneratorToken = new CodeGeneratorToken({
                lexer: this.basicLexer,
                parser: this.basicParser,
                implicitLines: this.model.getProperty("implicitLines" /* ModelPropID.implicitLines */)
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
        else if (UiUtils.debug > 1) {
            const outputText = output.text, hex = outputText.split("").map(function (s) { return s.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0"); }).join(","), decoded = this.decodeTokenizedBasic(outputText), diff = Diff.testDiff(input.toUpperCase(), decoded.toUpperCase()); // for testing
            UiUtils.console.debug("TokenizerInput (" + name + ") [len=" + input.length + "]:\n" + input);
            UiUtils.console.debug("TokenizerOutputHex (" + name + ") [len=" + outputText.length + "]:\n" + hex);
            UiUtils.console.debug("TokenizerOutputDecoded (" + name + ") [len=" + decoded.length + "]:\n" + decoded);
            UiUtils.console.debug("TokenizerDiff (" + name + ") [len=" + diff.length + "]:\n" + diff);
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
                atobFn: (value) => this.host.atobFn(value),
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
            onUnknownCommand: (value) => UiUtils.console.error("loadExample: Unknown command:", value),
            startMainLoop: () => this.startMainLoop(),
            onWarning: (error) => UiUtils.console.warn(error),
            onError: (message) => UiUtils.console.error(message),
            decodeTokenizedBasic: (value) => this.decodeTokenizedBasic(value)
        });
    }
    createFnExampleLoaded(example, url, inFile) {
        return (_sFullUrl, key, suppressLog) => {
            if (key !== example) {
                UiUtils.console.warn("fnExampleLoaded: Unexpected", key, "<>", example);
            }
            const exampleEntry = this.model.getExample(example);
            if (!suppressLog) {
                UiUtils.console.log("Example", url, (exampleEntry.meta ? exampleEntry.meta + " " : "") + "loaded");
            }
            this.model.setProperty("example" /* ModelPropID.example */, inFile.memorizedExample);
            const input = exampleEntry.script;
            this.runtime.completeExampleLoad(input, exampleEntry.rsx, (loadedInput) => this.loadFileContinue(loadedInput));
        };
    }
    createFnExampleError(example, url, inFile) {
        return () => {
            UiUtils.console.log("Example", url, "error");
            this.model.setProperty("example" /* ModelPropID.example */, inFile.memorizedExample);
            this.runtime.failExampleLoad(example, (error, noSelection) => this.outputError(error, noSelection), (input) => this.loadFileContinue(input));
        };
    }
    getLoadScript() {
        return this.host.loadScript;
    }
    getOutputText() {
        return this.outScript;
    }
    setOutputText(text) {
        this.outScript = text;
        this.invalidateScript();
        this.view.setAreaValue("outputText" /* ViewID.outputText */, text);
        if (this.options.onOutputText) {
            this.options.onOutputText(text);
        }
    }
    setResultText(text, scroll = false) {
        this.view.setAreaValue("resultText" /* ViewID.resultText */, text);
        if (this.options.onResultText) {
            this.options.onResultText(text);
        }
        if (scroll) {
            this.view.setAreaScrollTop("resultText" /* ViewID.resultText */); // scroll to bottom
        }
    }
    loadExampleFile() {
        const inFile = this.vm.vmGetInFileObject(), key = this.model.getProperty("example" /* ModelPropID.example */), plan = FileHandler.prepareExampleLoad(inFile.name, key, this.model.getAllExamples(), this.model.getDatabase().src), example = plan.name, exampleEntry = plan.entry, url = plan.url;
        inFile.memorizedExample = plan.memorizedExample;
        if (UiUtils.debug > 0) {
            UiUtils.console.debug("loadExample: name=" + example + " (current=" + key + ")");
        }
        if (plan.status === "loaded" && exampleEntry) {
            this.model.setProperty("example" /* ModelPropID.example */, example);
            const fnExampleLoaded = this.createFnExampleLoaded(example, url, inFile);
            fnExampleLoaded("", example, true);
        }
        else if (plan.status === "fetch" && exampleEntry) { // need to load
            this.model.setProperty("example" /* ModelPropID.example */, example);
            this.getLoadScript()(url, this.createFnExampleLoaded(example, url, inFile), this.createFnExampleError(example, url, inFile), example);
        }
        else { // keep original example in this error case
            if (example !== "") { // only if not empty
                UiUtils.console.warn("loadExample: Unknown file:", example);
                const fnExampleError = this.createFnExampleError(example, url, inFile);
                fnExampleError();
            }
            else {
                this.model.setProperty("example" /* ModelPropID.example */, example);
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
                if (UiUtils.debug > 1) {
                    UiUtils.console.debug("fnFileLoad:", file.command, file.name, "details:", file);
                }
            },
            loadFromStorage: (name) => this.tryLoadingFromLocalStorage(name),
            onStorageLoad: (input) => {
                if (UiUtils.debug > 0) {
                    UiUtils.console.debug("fnFileLoad:", inFile.command, inFile.name, "from localStorage");
                }
                this.loadFileContinue(input);
            },
            loadExample: () => this.loadExampleFile(),
            onNotOpen: (name) => UiUtils.console.error("fnFileLoad:", name, "File not open!"),
            setNextDelay: (delay) => this.runtime.setNextDelay(delay)
        });
    }
    fnFileSave() {
        const outFile = this.vm.vmGetOutFileObject();
        this.runtime.dispatchFileSave(outFile, (file) => this.getFileHandler().saveFile(file, () => this.getInputText(), (input, storageName) => this.encodeTokenizedBasic(input, storageName)).data, (name) => {
            if (UiUtils.debug > 0) {
                UiUtils.console.debug("fnFileSave: name=" + name + ": put into localStorage");
            }
        }, () => UiUtils.console.error("fnFileSave: file not open!"), (error) => UiUtils.console.warn(error));
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
        this.runtime.resetProgram(() => { var _a; return (_a = this.virtualKeyboard) === null || _a === void 0 ? void 0 : _a.reset(); }, () => this.setOutputText(""), () => this.invalidateScript());
    }
    outputError(error, noSelection) {
        var _a, _b;
        const stream = 0, diagnostic = Utils.createDiagnostic(error, noSelection, error.name === "CpcVm" ? this.vm.err() : undefined), shortError = diagnostic.shortMessage;
        this.uiController.onDiagnostic(diagnostic);
        (_b = (_a = this.options).onDiagnostic) === null || _b === void 0 ? void 0 : _b.call(_a, diagnostic);
        const escapedShortError = Utils.escapeControlCharacters(shortError);
        this.vm.print(stream, escapedShortError + "\r\n");
        return shortError;
    }
    fnRenumLines(paras) {
        this.runtime.renumProgram(this.getInputText(), paras, (source, newLine, oldLine, step, keep) => this.getBasicFormatter().renumber(source, newLine, oldLine, step, keep), (source) => {
            this.fnPutChangedInputOnStack();
            this.setInputText(source, true);
            this.fnPutChangedInputOnStack();
        }, (error) => {
            UiUtils.console.warn(error);
            this.outputError(error);
        });
    }
    fnEditLineCallback() {
        const inputParas = this.vm.vmGetStopObject().paras, inputText = this.getInputText();
        return this.runtime.commitEditedLine(inputParas, inputText, (source, edited) => this.mergeScripts(source, edited), (source) => this.setInputText(source), () => this.uiController.onProgramEdited());
    }
    fnEditLine(paras) {
        const input = this.getInputText(), lineNumber = paras.first || 0, lines = this.fnGetLinesInRange(input, lineNumber, lineNumber);
        if (this.runtime.editLine(paras, lines[0], this.fnEditLineCallbackHandler, (error) => this.outputError(error))) {
            this.fnWaitInput();
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
        this.uiController.refreshVariables();
        this.uiController.onVarSelectChange();
        return this.getOutputText();
    }
    fnParseAndStart(clearVariables, clearBeforeRun) {
        this.runtime.compileAndStartProgram({
            clearVariables,
            clearBeforeRun
        });
    }
    fnPretty() {
        const input = this.getInputText(), keepWhiteSpace = this.view.getInputChecked("prettySpaceInput" /* ViewID.prettySpaceInput */), keepBrackets = this.view.getInputChecked("prettyBracketsInput" /* ViewID.prettyBracketsInput */), keepColons = this.view.getInputChecked("prettyColonsInput" /* ViewID.prettyColonsInput */), output = this.prettyPrintBasic(input, keepWhiteSpace, keepBrackets, keepColons);
        if (output) {
            this.fnPutChangedInputOnStack();
            this.setInputText(output, true);
            this.fnPutChangedInputOnStack();
            // for testing:
            const diff = Diff.testDiff(input.toUpperCase(), output.toUpperCase());
            this.setOutputText(diff);
        }
    }
    fnAddLines() {
        const input = this.getInputText(), output = BasicFormatter.addLineNumbers(input);
        if (output) {
            this.fnPutChangedInputOnStack();
            this.setInputText(output, true);
            this.fnPutChangedInputOnStack();
        }
    }
    fnRemoveLines() {
        const basicFormatter = this.getBasicFormatter();
        const input = this.getInputText(), output = basicFormatter.removeUnusedLines(input);
        if (output.error) {
            this.outputError(output.error);
        }
        else {
            this.fnPutChangedInputOnStack();
            this.setInputText(output.text, true);
            this.fnPutChangedInputOnStack();
        }
    }
    fnGetFilename(input) {
        let name = "file";
        const reRemMatcher = /^\d* ?(?:REM|rem) ([\w.]+)+/, matches = input.match(reRemMatcher);
        if (matches !== null) {
            name = matches[1];
        }
        else {
            const example = this.model.getProperty("example" /* ModelPropID.example */);
            if (example !== "") {
                if (example.indexOf("/") >= 0) {
                    name = example.substring(example.lastIndexOf("/") + 1);
                }
            }
        }
        if (name.indexOf(".") < 0) {
            name += ".bas";
        }
        return name;
    }
    // eslint-disable-next-line complexity
    fnDownload() {
        const options = this.view.getSelectOptions("exportFileSelect" /* ViewID.exportFileSelect */), exportTokenized = this.view.getInputChecked("exportTokenizedInput" /* ViewID.exportTokenizedInput */), exportDSK = this.view.getInputChecked("exportDSKInput" /* ViewID.exportDSKInput */), format = this.view.getSelectValue("exportDSKFormatSelect" /* ViewID.exportDSKFormatSelect */), stripEmpty = this.view.getInputChecked("exportDSKStripEmptyInput" /* ViewID.exportDSKStripEmptyInput */), exportBase64 = this.view.getInputChecked("exportBase64Input" /* ViewID.exportBase64Input */), editorText = Controller.exportEditorText, meta = {
            typeString: "A", // ASCII
            start: 0x170,
            length: 0,
            entry: 0
        };
        let diskImage, name = "", data = "";
        const fnExportBase64 = () => {
            meta.encoding = "base64";
            const metaString = FileHandler.joinMeta(meta);
            data = metaString + "," + this.host.btoaFn(data);
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
            if (item.selected) {
                if (item.value === editorText) {
                    data = this.getInputText();
                    name = this.fnGetFilename(data);
                    const eolStr = data.indexOf("\r\n") > 0 ? "\r\n" : "\n"; // heuristic: if CRLF found, use it as split
                    if (eolStr === "\n") {
                        data = data.replace(/\n/g, "\r\n"); // replace LF by CRLF (not really needed if tokenized is used)
                    }
                    meta.typeString = "A"; // ASCII
                    meta.start = 0x170;
                    meta.length = data.length;
                    meta.entry = 0;
                }
                else {
                    name = item.value;
                    data = this.tryLoadingFromLocalStorage(name) || "";
                    const metaAndData = FileHandler.splitMeta(data);
                    Object.assign(meta, metaAndData.meta); // copy meta info
                    data = metaAndData.data;
                }
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
                        UiUtils.console.warn("Controller: Cannot tokenize, keeping ASCII: " + item.value);
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
                    if (data) {
                        this.view.fnDownloadBlob(data, name);
                    }
                }
            }
        }
        if (diskImage) {
            if (stripEmpty) {
                data = diskImage.stripEmptyTracks();
            }
            if (exportBase64) {
                fnExportBase64();
            }
            if (data) {
                this.view.fnDownloadBlob(data, name);
            }
        }
    }
    selectJsError(script, e) {
        const lineNumber = e.lineNumber, // only on FireFox
        columnNumber = e.columnNumber;
        if (lineNumber || columnNumber) { // only available on Firefox
            const errLine = lineNumber - 3; // for some reason line 0 is 3
            let pos = 0, line = 0;
            while (pos < script.length && line < errLine) {
                pos = script.indexOf("\n", pos) + 1;
                line += 1;
            }
            pos += columnNumber;
            UiUtils.console.warn("Info: JS Error occurred at line", lineNumber, "column", columnNumber, "pos", pos);
            this.view.setAreaSelection("outputText" /* ViewID.outputText */, pos, pos + 1);
        }
    }
    fnChain(paras, clearBeforeRun = false) {
        const script = this.getOutputText(), line = paras && paras.first || 0;
        this.runtime.startProgram(script, line, clearBeforeRun);
    }
    beforeProgramStart() {
        if (this.vm.vmGetOutFileObject().open) {
            this.fnFileSave();
        }
    }
    afterProgramStart() {
        if (!this.inputSet) {
            this.inputSet = true;
            const input = this.model.getProperty("input" /* ModelPropID.input */);
            if (input !== "") {
                this.view.setAreaValue("inp2Text" /* ViewID.inp2Text */, input);
                const that = this, timeout = 1;
                this.host.setTimeout(function () {
                    that.startEnter();
                    that.view.setAreaValue("inp2Text" /* ViewID.inp2Text */, ""); // delete input
                }, timeout);
            }
        }
        if (UiUtils.debug > 1) {
            UiUtils.console.debug("End of fnRun");
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
                if (UiUtils.debug > 0) {
                    UiUtils.console.debug("fnDirectInput: insert line=" + input);
                }
                this.runtime.insertDirectProgramLine(inputText, input, stream, (source, line) => this.mergeScripts(source, line), (source) => this.setInputText(source, true), () => this.uiController.onProgramEdited());
                this.updateResultText();
                return false; // continue direct input
            }
            UiUtils.console.log("fnDirectInput: execute:", input);
            const output = this.runtime.executeDirectCommand(input, inputText, this.vm.line, stream, directInput.message, {
                outputError: (error) => this.outputError(error, true),
                setOutputText: (text) => this.setOutputText(text),
                onPrepareError: (error) => {
                    UiUtils.console.error(error);
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
            this.stopUpdateCanvas();
            UiUtils.console.log("We are ready.");
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
        this.uiController.refreshVariables();
        this.uiController.onVarSelectChange();
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
        this.runtime.beginControl("parse", () => this.removeKeyBoardHandler());
        this.startMainLoop();
    }
    startRenum(options = this.uiController.getRenumOptions()) {
        const stream = 0;
        this.runtime.beginRenumber(options);
        if (this.vm.pos(stream) > 1) {
            this.vm.print(stream, "\r\n");
        }
        this.vm.print(stream, "renum\r\n");
        this.startMainLoop();
    }
    startRun() {
        this.runtime.beginControl("run", () => this.removeKeyBoardHandler());
        this.startMainLoop();
    }
    startParseRun() {
        this.runtime.beginControl("parseRun", () => this.removeKeyBoardHandler());
        this.startMainLoop();
    }
    startBreak() {
        this.runtime.beginControl("break", () => this.removeKeyBoardHandler());
        this.startMainLoop();
    }
    restoreSuspendedInputHandlers(stop) {
        switch (stop.reason) {
            case "waitInput":
                this.vm.cursor(stop.paras.stream, 1);
                this.keyboard.setOptions({
                    fnOnKeyDown: this.fnWaitInputHandler
                });
                break;
            case "waitKey":
                this.keyboard.setOptions({
                    fnOnKeyDown: this.fnWaitKeyHandler
                });
                break;
        }
    }
    startContinue() {
        this.view.setDisabled("runButton" /* ViewID.runButton */, true);
        this.view.setDisabled("stopButton" /* ViewID.stopButton */, false);
        this.view.setDisabled("continueButton" /* ViewID.continueButton */, true);
        this.runtime.continueProgram(() => this.startMainLoop(), () => this.removeKeyBoardHandler(), (restored) => {
            const stop = this.vm.vmGetStopObject();
            if (restored || stop.reason === "waitInput") {
                this.restoreSuspendedInputHandlers(stop);
            }
        });
    }
    startReset() {
        this.runtime.beginControl("reset", () => this.removeKeyBoardHandler());
        this.startMainLoop();
    }
    startScreenshot() {
        return this.canvas.takeScreenShot();
    }
    putKeys(keys) {
        this.fnPutKeysInBuffer(keys);
    }
    fnPutKeysInBuffer(keys) {
        for (let i = 0; i < keys.length; i += 1) {
            this.keyboard.putKeyInBuffer(keys.charAt(i));
        }
        const options = this.keyboard.getOptions(), keyDownHandler = options.fnOnKeyDown;
        if (keyDownHandler) {
            keyDownHandler();
        }
    }
    static parseUserKeys(source) {
        const keys = [];
        for (const [index, line] of source.split(/\r?\n/).entries()) {
            const declaration = /^\s*(?:\d+\s*)?(?:REM\s+|'\s*)CPCBasic-keys:\s*(\[.*\])\s*$/i.exec(line);
            if (!declaration) {
                continue;
            }
            let items;
            try {
                items = JSON.parse(declaration[1]);
            }
            catch (error) {
                UiUtils.console.warn("CPCBasic-keys at line " + (index + 1) + ": Invalid JSON", error);
                continue;
            }
            if (!Array.isArray(items) || items.length % 2 !== 0) {
                UiUtils.console.warn("CPCBasic-keys at line " + (index + 1) + ": Expected key/label pairs");
                continue;
            }
            for (let i = 0; i < items.length; i += 2) {
                const key = items[i], label = items[i + 1];
                let code, text;
                if (typeof key === "string" && key.length) {
                    code = key.charCodeAt(0);
                }
                else if (typeof key === "number" && Number.isInteger(key) && key >= 0 && key <= 65535) {
                    code = key;
                }
                else {
                    UiUtils.console.warn("CPCBasic-keys at line " + (index + 1) + ": Invalid key", key);
                    continue;
                }
                if (typeof label === "string") {
                    text = label;
                }
                else if (typeof label === "number" && Number.isInteger(label) && label >= 0 && label <= 65535) {
                    text = String.fromCharCode(label);
                }
                else {
                    UiUtils.console.warn("CPCBasic-keys at line " + (index + 1) + ": Invalid label", label);
                    continue;
                }
                keys.push({
                    code: code,
                    text: text || String.fromCharCode(code)
                });
            }
        }
        return keys;
    }
    updateUserKeys(source) {
        const container = View.getElementById1("userKeys" /* ViewID.userKeys */), keys = Controller.parseUserKeys(source);
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
        for (const item of keys) {
            const button = document.createElement("button"), text = item.text || String.fromCharCode(item.code);
            button.type = "button";
            button.textContent = text;
            button.setAttribute("data-key", String(item.code));
            button.setAttribute("aria-label", text);
            button.title = text + " (" + item.code + ")";
            container.appendChild(button);
        }
        container.hidden = !keys.length;
    }
    onUserKeyClick(event) {
        const target = View.getEventTarget(event);
        if (target.tagName === "BUTTON") {
            const code = Number(target.getAttribute("data-key"));
            if (Number.isInteger(code) && code >= 0 && code <= 65535) {
                this.fnPutKeysInBuffer(String.fromCharCode(code));
            }
        }
    }
    startEnter() {
        let input = this.view.getAreaValue("inp2Text" /* ViewID.inp2Text */);
        input = input.replace(/\n/g, "\r"); // LF => CR
        this.fnPutKeysInBuffer(input);
    }
    static generateFunction(par, functionString) {
        if (functionString.startsWith("function anonymous(")) { // already a modified function (inside an anonymous function)?
            const firstIndex = functionString.indexOf("{"), lastIndex = functionString.lastIndexOf("}");
            if (firstIndex >= 0 && lastIndex >= 0) {
                functionString = functionString.substring(firstIndex + 1, lastIndex - 1); // remove anonymous function
            }
            functionString = functionString.trim();
        }
        else {
            functionString = "var o=cpcBasic.controller.vm, v=o.vmGetAllVariables(); v." + par + " = " + functionString;
        }
        const match = (/function \(([^)]*)/).exec(functionString), args = match ? match[1].split(",") : [], fnFunction = new Function(args[0], args[1], args[2], args[3], args[4], functionString); // eslint-disable-line no-new-func
        // we support at most 5 arguments
        return fnFunction;
    }
    changeVariable() {
        const par = this.view.getSelectValue("varSelect" /* ViewID.varSelect */), valueString = this.view.getSelectValue("varText" /* ViewID.varText */), variables = this.variables;
        let value = variables.getVariable(par);
        if (typeof value === "function") {
            value = Controller.generateFunction(par, valueString);
            variables.setVariable(par, value);
        }
        else {
            const varType = this.variables.determineStaticVarType(par), type = this.vm.vmDetermineVarType(varType); // do we know dynamic type?
            if (type !== "$") { // not string? => convert to number
                value = parseFloat(valueString);
            }
            else {
                value = valueString;
            }
            try {
                const value2 = this.vm.vmAssign(varType, value);
                variables.setVariable(par, value2);
                UiUtils.console.log("Variable", par, "changed:", variables.getVariable(par), "=>", value);
            }
            catch (e) {
                UiUtils.console.warn(e);
            }
        }
        this.uiController.refreshVariables();
        this.uiController.onVarSelectChange(); // title change?
    }
    setBasicVersion(basicVersion) {
        this.runtime.setBasicVersion(basicVersion);
        this.invalidateScript();
    }
    setPalette(palette) {
        const validPalette = palette === "green" || palette === "grey" ? palette : "color";
        this.canvas.setOptions({
            palette: validPalette
        });
    }
    setCanvasType(canvasType) {
        let canvas = this.canvas;
        if (canvas) {
            canvas.stopUpdateCanvas(); // stop updates on current canvas
            const canvasID = canvas.getOptions().canvasID;
            this.view.setHidden(canvasID, true);
        }
        else if (canvasType !== "graphics") {
            // initially graphics canvas is not hidden, but we must hide it, if other canvas should be shown
            this.view.setHidden("cpcCanvas" /* ViewID.cpcCanvas */, true);
        }
        const palette = this.model.getProperty("palette" /* ModelPropID.palette */);
        if (this.canvases[canvasType]) {
            canvas = this.canvases[canvasType];
            this.canvas = canvas;
            this.setPalette(palette);
        }
        else {
            const validPalette = palette === "green" || palette === "grey" ? palette : "color";
            if (canvasType === "text") {
                canvas = new TextCanvas({
                    canvasID: "textText" /* ViewID.textText */,
                    charset: cpcCharset,
                    palette: validPalette
                });
            }
            else if (canvasType === "none") {
                canvas = new NoCanvas({
                    canvasID: "noCanvas" /* ViewID.noCanvas */,
                    charset: cpcCharset,
                    palette: validPalette
                });
            }
            else { // "graphics"
                const isAreaHidden = this.view.getHidden("cpcArea" /* ViewID.cpcArea */);
                // make sure canvas area is not hidden when creating canvas object (allows to get width, height)
                if (isAreaHidden) {
                    this.uiController.toggleAreaHiddenById("change", "showCpcInput" /* ViewID.showCpcInput */); // show: ViewID.cpcArea
                }
                this.view.setHidden("cpcCanvas" /* ViewID.cpcCanvas */, false);
                canvas = new Canvas({
                    canvasID: "cpcCanvas" /* ViewID.cpcCanvas */,
                    charset: cpcCharset,
                    palette: validPalette
                });
                if (isAreaHidden) {
                    this.uiController.toggleAreaHiddenById("change", "showCpcInput" /* ViewID.showCpcInput */); // hide again: ViewID.cpcArea
                }
            }
            this.canvases[canvasType] = canvas;
            this.canvas = canvas;
        }
        if (this.vm) {
            //const handler = this.vm.getOnCanvasClickHandler();
            this.canvas.setOptions({
                onCanvasClick: this.vmOnCanvasClickHandler
            });
            this.vm.setCanvas(canvas);
        }
        const canvasId = canvas.getOptions().canvasID;
        this.view.setHidden(canvasId, false);
        if (this.model.getProperty("showCpc" /* ModelPropID.showCpc */)) {
            this.canvas.startUpdateCanvas();
        }
        return canvas;
    }
    setSoundActive() {
        const sound = this.sound, active = this.model.getProperty("sound" /* ModelPropID.sound */);
        if (active) {
            sound.soundOn();
        }
        else {
            sound.soundOff();
            const stop = this.vm && this.vm.vmGetStopObject();
            if (stop && stop.reason === "waitSound") {
                this.vm.vmStop("", 0, true); // do not wait
            }
        }
    }
    getZ80Disass() {
        if (!this.z80Disass) {
            const dataArr = this.vm.vmGetMem(), data = dataArr; // fast hack: we take number array as Uint8Array
            this.z80Disass = new Z80Disass({
                data: data,
                addr: 0
            });
        }
        return this.z80Disass;
    }
    setDisassAddr(addr, endAddr) {
        const z80Disass = this.getZ80Disass();
        if (endAddr === undefined) {
            endAddr = addr + 0x100;
        }
        z80Disass.setOptions({
            addr: addr
        });
        const opts = z80Disass.getOptions(), lines = [];
        while (addr < endAddr) { // currently not limited to < 0x10000
            lines.push(z80Disass.disassLine());
            if (opts.addr > addr) {
                addr = opts.addr;
            }
            else {
                UiUtils.console.error("setDisassAddr: Not increasing:", addr, opts.addr);
                break;
            }
        }
        const out = lines.join("\n") + "\n";
        this.view.setAreaValue("disassText" /* ViewID.disassText */, out);
    }
    fnEndOfImport(imported) {
        const stream = 0, vm = this.vm;
        for (let i = 0; i < imported.length; i += 1) {
            vm.print(stream, imported[i], " ");
        }
        vm.print(stream, "\r\n", imported.length + " file" + (imported.length !== 1 ? "s" : "") + " imported.\r\n");
        this.updateResultText();
    }
    static fnOnDragover(evt) {
        evt.stopPropagation();
        evt.preventDefault();
        if (evt.dataTransfer !== null) {
            evt.dataTransfer.dropEffect = "copy"; // explicitly show this is a copy
        }
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
                processFileImports: this.model.getProperty("processFileImports" /* ModelPropID.processFileImports */),
                storage: this.getStorage()
            });
        }
        return this.fileHandler;
    }
    getFileSelect(fileHandler) {
        if (!this.fileSelect) {
            this.fileSelect = new FileSelect({
                fnEndOfImport: this.fnEndOfImport.bind(this),
                fnLoad2: fileHandler.fnLoad2.bind(fileHandler)
            });
        }
        return this.fileSelect;
    }
    initDropZone() {
        const fileHandler = this.getFileHandler(), fileSelect = this.getFileSelect(fileHandler), dropZone = View.getElementById1("dropZone" /* ViewID.dropZone */);
        dropZone.addEventListener("dragover", this.fnOnDragoverHandler, false);
        fileSelect.addFileSelectHandler(dropZone, "drop");
        const canvasID = this.canvas.getOptions().canvasID, canvasElement = View.getElementById1(canvasID);
        canvasElement.addEventListener("dragover", this.fnOnDragoverHandler, false);
        fileSelect.addFileSelectHandler(canvasElement, "drop");
        const fileInput = View.getElementById1("fileInput" /* ViewID.fileInput */);
        fileSelect.addFileSelectHandler(fileInput, "change");
    }
    fnUpdateUndoRedoButtons() {
        this.view.setDisabled("undoButton" /* ViewID.undoButton */, !this.inputStack.canUndoKeepOne());
        this.view.setDisabled("undoButton2" /* ViewID.undoButton2 */, !this.inputStack.canUndoKeepOne());
        this.view.setDisabled("redoButton" /* ViewID.redoButton */, !this.inputStack.canRedo());
        this.view.setDisabled("redoButton2" /* ViewID.redoButton2 */, !this.inputStack.canRedo());
    }
    fnInitUndoRedoButtons() {
        this.inputStack.reset();
        this.fnUpdateUndoRedoButtons();
    }
    fnPutChangedInputOnStack() {
        const input = this.getInputText(), stackInput = this.inputStack.getInput();
        if (stackInput !== input) {
            this.inputStack.save(input);
            this.fnUpdateUndoRedoButtons();
        }
    }
    startUpdateCanvas() {
        this.canvas.startUpdateCanvas();
    }
    stopUpdateCanvas() {
        this.canvas.stopUpdateCanvas();
    }
    getDragElement() {
        if (!this.dragElement) {
            this.dragElement = new DragElement({
                view: this.view,
                entries: {}
            });
        }
        return this.dragElement;
    }
    getVirtualKeyboard() {
        if (!this.virtualKeyboard) {
            this.virtualKeyboard = new VirtualKeyboard({
                view: this.view,
                fnPressCpcKey: this.keyboard.fnPressCpcKey.bind(this.keyboard),
                fnReleaseCpcKey: this.keyboard.fnReleaseCpcKey.bind(this.keyboard)
            });
        }
        return this.virtualKeyboard;
    }
    fnDragElementsActive(enabled) {
        const dragElement = this.getDragElement(), dragElementsData = this.dragElementsData;
        for (const entry in dragElementsData.entries) {
            if (dragElementsData.entries.hasOwnProperty(entry)) {
                dragElementsData.entries[entry].enabled = enabled;
            }
        }
        dragElement.setOptions(this.dragElementsData);
    }
    getVariableNames() {
        return this.variables.getAllVariableNames();
    }
    getVariable(par) {
        return this.variables.getVariable(par);
    }
    undoStackElement() {
        return this.inputStack.undo();
    }
    redoStackElement() {
        return this.inputStack.redo();
    }
    createFnDatabaseLoaded(url) {
        return (_sFullUrl, key) => {
            const selectedName = this.model.getProperty("database" /* ModelPropID.database */);
            if (selectedName === key) {
                this.model.getDatabase().loaded = true;
            }
            else { // should not occur
                UiUtils.console.warn("databaseLoaded: name changed: " + key + " => " + selectedName);
                this.model.setProperty("database" /* ModelPropID.database */, key);
                const database = this.model.getDatabase();
                if (database) {
                    database.loaded = true;
                }
                this.model.setProperty("database" /* ModelPropID.database */, selectedName);
            }
            UiUtils.console.log("fnDatabaseLoaded: database loaded: " + key + ": " + url);
            this.setDirectorySelectOptions();
            this.onDirectorySelectChange();
        };
    }
    createFnDatabaseError(url) {
        return (_sFullUrl, key) => {
            UiUtils.console.error("fnDatabaseError: database error: " + key + ": " + url);
            this.setDirectorySelectOptions();
            this.onDirectorySelectChange();
            this.setInputText("");
            this.setResultText("Cannot load database: " + key);
        };
    }
    onDatabaseSelectChange() {
        const databaseName = this.view.getSelectValue("databaseSelect" /* ViewID.databaseSelect */);
        this.view.setSelectTitleFromSelectedOption("databaseSelect" /* ViewID.databaseSelect */);
        this.loadDatabase(databaseName);
    }
    loadDatabase(name) {
        if (name !== undefined) {
            this.model.setProperty("database" /* ModelPropID.database */, name);
        }
        const databaseName = this.model.getProperty("database" /* ModelPropID.database */);
        const database = this.model.getDatabase();
        if (!database) {
            UiUtils.console.error("onDatabaseSelectChange: database not available:", databaseName);
            return;
        }
        if (database.text === "storage") { // special handling: browser localStorage
            this.updateStorageDatabase("set", ""); // set all
            database.loaded = true;
        }
        if (database.loaded) {
            this.setDirectorySelectOptions();
            this.onDirectorySelectChange();
        }
        else {
            this.setInputText("#loading database " + databaseName + "...");
            const exampleIndex = this.model.getProperty("exampleIndex" /* ModelPropID.exampleIndex */), url = database.src + "/" + exampleIndex;
            this.getLoadScript()(url, this.createFnDatabaseLoaded(url), this.createFnDatabaseError(url), databaseName);
        }
    }
    onDirectorySelectChange() {
        this.setExampleSelectOptions();
        this.onExampleSelectChange();
    }
    onExampleSelectChange() {
        const directoryName = this.view.getSelectValue("directorySelect" /* ViewID.directorySelect */);
        let exampleName = this.view.getSelectValue("exampleSelect" /* ViewID.exampleSelect */);
        if (directoryName) {
            exampleName = directoryName + "/" + exampleName;
        }
        this.loadExample(exampleName);
    }
    loadExample(key, options = {}) {
        var _a, _b;
        const vm = this.vm, inFile = vm.vmGetInFileObject(), dataBaseName = this.model.getProperty("database" /* ModelPropID.database */);
        this.model.setProperty("example" /* ModelPropID.example */, key);
        vm.closein();
        this.uiController.setPopoversHiddenExcept();
        inFile.open = true;
        const request = FileHandler.createExampleLoadRequest(key, dataBaseName, (_a = this.model.getExample(key)) === null || _a === void 0 ? void 0 : _a.meta, (_b = options.autorun) !== null && _b !== void 0 ? _b : this.model.getProperty("autorun" /* ModelPropID.autorun */));
        inFile.command = request.command;
        inFile.name = request.name;
        inFile.start = undefined;
        inFile.fnFileCallback = vm.vmGetLoadHandler();
        vm.vmStop("fileLoad", 90);
        this.startMainLoop();
    }
    // currently not used. Can be called manually: cpcBasic.controller.exportAsBase64(file);
    exportAsBase64(storageName) {
        const storage = this.getStorage();
        let data = storage.getItem(storageName), out = "";
        if (data !== null) {
            const index = data.indexOf(","); // metadata separator
            if (index >= 0) {
                const meta = data.substring(0, index);
                data = data.substring(index + 1);
                data = this.host.btoaFn(data);
                out = meta + ";base64," + data;
            }
            else { // hmm, no meta info
                data = this.host.btoaFn(data);
                out = "base64," + data;
            }
        }
        UiUtils.console.log(out);
        return out;
    }
    onCpcCanvasClick(event) {
        this.uiController.setPopoversHiddenExcept(); // hide all popovers
        this.canvas.onCanvasClick(event);
        this.keyboard.setActive(true);
    }
    onWindowClick(event) {
        this.canvas.onWindowClick(event);
        this.keyboard.setActive(false);
    }
    fnArrayBounds() {
        const arrayBounds = this.model.getProperty("arrayBounds" /* ModelPropID.arrayBounds */);
        this.runtime.setArrayBounds(arrayBounds);
    }
    fnImplicitLines() {
        const implicitLines = this.model.getProperty("implicitLines" /* ModelPropID.implicitLines */);
        this.runtime.setImplicitLines(implicitLines);
    }
    fnRemoveAllVariables() {
        if (Object.keys(this.variables.getAllVariables()).length) {
            this.variables.removeAllVariables();
            this.uiController.refreshVariables();
        }
    }
    fnPrettyLowercaseVars() {
        const prettyLowercaseVars = this.model.getProperty("prettyLowercaseVars" /* ModelPropID.prettyLowercaseVars */);
        this.runtime.setPrettyLowercaseVars(prettyLowercaseVars);
    }
    fnIntegerOverflow() {
        const integerOverflow = this.model.getProperty("integerOverflow" /* ModelPropID.integerOverflow */);
        this.runtime.setIntegerOverflow(integerOverflow);
    }
    fnTrace() {
        const trace = this.model.getProperty("trace" /* ModelPropID.trace */);
        this.runtime.setTrace(trace);
    }
    fnSpeed() {
        const speed = this.model.getProperty("speed" /* ModelPropID.speed */);
        this.initialLoopTimeout = Runtime.getLoopDelay(speed);
    }
}
Controller.exportEditorText = "<editor>";
//# sourceMappingURL=Controller.js.map