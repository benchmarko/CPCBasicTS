// Controller.ts - Controller
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//
define(["require", "exports", "./Utils", "./BasicFormatter", "./BasicLexer", "./BasicParser", "./BasicTokenizer", "./Canvas", "./CodeGeneratorBasic", "./CodeGeneratorJs", "./CodeGeneratorToken", "./CommonEventHandler", "./cpcCharset", "./CpcVm", "./CpcVmRsx", "./Diff", "./DiskImage", "./InputStack", "./Keyboard", "./TextCanvas", "./VirtualKeyboard", "./Sound", "./Variables", "./View", "./ZipFile"], function (require, exports, Utils_1, BasicFormatter_1, BasicLexer_1, BasicParser_1, BasicTokenizer_1, Canvas_1, CodeGeneratorBasic_1, CodeGeneratorJs_1, CodeGeneratorToken_1, CommonEventHandler_1, cpcCharset_1, CpcVm_1, CpcVmRsx_1, Diff_1, DiskImage_1, InputStack_1, Keyboard_1, TextCanvas_1, VirtualKeyboard_1, Sound_1, Variables_1, View_1, ZipFile_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Controller = void 0;
    var FileSelect = /** @class */ (function () {
        function FileSelect(options) {
            this.fnEndOfImport = {};
            this.outputError = {};
            this.fnLoad2 = {};
            this.files = {}; // = dataTransfer ? dataTransfer.files : ((event.target as any).files as FileList), // dataTransfer for drag&drop, target.files for file input
            this.fileIndex = 0;
            this.imported = []; // imported file names
            this.file = {}; // current file
            this.fnEndOfImport = options.fnEndOfImport;
            this.outputError = options.outputError;
            this.fnLoad2 = options.fnLoad2;
        }
        FileSelect.prototype.fnReadNextFile = function (reader) {
            if (this.fileIndex < this.files.length) {
                var file = this.files[this.fileIndex];
                this.fileIndex += 1;
                var lastModified = file.lastModified, lastModifiedDate = lastModified ? new Date(lastModified) : file.lastModifiedDate, // lastModifiedDate deprecated, but for old IE
                text = file.name + " " + (file.type || "n/a") + " " + file.size + " " + (lastModifiedDate ? lastModifiedDate.toLocaleDateString() : "n/a");
                Utils_1.Utils.console.log(text);
                if (file.type === "text/plain") {
                    reader.readAsText(file);
                }
                else if (file.type === "application/x-zip-compressed") {
                    reader.readAsArrayBuffer(file);
                }
                else {
                    reader.readAsDataURL(file);
                }
                this.file = file;
            }
            else {
                this.fnEndOfImport(this.imported);
            }
        };
        FileSelect.prototype.fnOnLoad = function (event) {
            var reader = event.target, data = (reader && reader.result) || null, file = this.file, name = file.name, type = file.type;
            if (type === "application/x-zip-compressed" && data instanceof ArrayBuffer) {
                var zip = void 0;
                try {
                    zip = new ZipFile_1.ZipFile(new Uint8Array(data), name); // rather data
                }
                catch (e) {
                    Utils_1.Utils.console.error(e);
                    if (e instanceof Error) {
                        this.outputError(e, true);
                    }
                }
                if (zip) {
                    var zipDirectory = zip.getZipDirectory(), entries = Object.keys(zipDirectory);
                    for (var i = 0; i < entries.length; i += 1) {
                        var name2 = entries[i];
                        var data2 = void 0;
                        try {
                            data2 = zip.readData(name2);
                        }
                        catch (e) {
                            Utils_1.Utils.console.error(e);
                            if (e instanceof Error) { // eslint-disable-line max-depth
                                this.outputError(e, true);
                            }
                        }
                        if (data2) {
                            this.fnLoad2(data2, name2, type, this.imported);
                        }
                    }
                }
            }
            else if (typeof data === "string") {
                this.fnLoad2(data, name, type, this.imported);
            }
            else {
                Utils_1.Utils.console.warn("Error loading file", name, "with type", type, " unexpected data:", data);
            }
            if (reader) {
                this.fnReadNextFile(reader);
            }
        };
        FileSelect.prototype.fnErrorHandler = function (event, file) {
            var reader = event.target;
            var msg = "fnErrorHandler: Error reading file " + file.name;
            if (reader && reader.error !== null) {
                if (reader.error.NOT_FOUND_ERR) {
                    msg += ": File not found";
                }
                else if (reader.error.ABORT_ERR) {
                    msg = ""; // nothing
                }
            }
            if (msg) {
                Utils_1.Utils.console.warn(msg);
            }
            if (reader) {
                this.fnReadNextFile(reader);
            }
        };
        // https://stackoverflow.com/questions/10261989/html5-javascript-drag-and-drop-file-from-external-window-windows-explorer
        // https://www.w3.org/TR/file-upload/#dfn-filereader
        FileSelect.prototype.fnHandleFileSelect = function (event) {
            event.stopPropagation();
            event.preventDefault();
            var dataTransfer = event.dataTransfer, files = dataTransfer ? dataTransfer.files : View_1.View.getEventTarget(event).files; // dataTransfer for drag&drop, target.files for file input
            if (!files || !files.length) {
                Utils_1.Utils.console.error("fnHandleFileSelect: No files!");
                return;
            }
            this.files = files;
            this.fileIndex = 0;
            this.imported.length = 0;
            if (window.FileReader) {
                var reader = new FileReader();
                reader.onerror = this.fnErrorHandler.bind(this);
                reader.onload = this.fnOnLoad.bind(this);
                this.fnReadNextFile(reader);
            }
            else {
                Utils_1.Utils.console.warn("fnHandleFileSelect: FileReader API not supported.");
            }
        };
        FileSelect.prototype.addFileSelectHandler = function (element, type) {
            element.addEventListener(type, this.fnHandleFileSelect.bind(this), false);
        };
        return FileSelect;
    }());
    var FileHandler = /** @class */ (function () {
        function FileHandler(options) {
            this.adaptFilename = {};
            this.updateStorageDatabase = {};
            this.outputError = {};
            this.adaptFilename = options.adaptFilename;
            this.updateStorageDatabase = options.updateStorageDatabase;
            this.outputError = options.outputError;
        }
        FileHandler.fnLocalStorageName = function (name, defaultExtension) {
            // modify name so we do not clash with localstorage methods/properites
            if (name.indexOf(".") < 0) { // no dot inside name?
                name += "." + (defaultExtension || ""); // append dot or default extension
            }
            return name;
        };
        FileHandler.createMinimalAmsdosHeader = function (type, start, length) {
            return {
                typeString: type,
                start: start,
                length: length
            };
        };
        FileHandler.joinMeta = function (meta) {
            return [
                FileHandler.metaIdent,
                meta.typeString,
                meta.start,
                meta.length,
                meta.entry
            ].join(";");
        };
        // starting with (line) number, or 7 bit ASCII characters without control codes except \x1a=EOF
        FileHandler.prototype.fnLoad2 = function (data, name, type, imported) {
            var header, storageName = this.adaptFilename(name, "FILE");
            storageName = FileHandler.fnLocalStorageName(storageName);
            if (type === "text/plain") {
                header = FileHandler.createMinimalAmsdosHeader("A", 0, data.length);
            }
            else {
                if (type === "application/x-zip-compressed" || type === "cpcBasic/binary") { // are we a file inside zip?
                    // empty
                }
                else { // e.g. "data:application/octet-stream;base64,..."
                    var index = data.indexOf(",");
                    if (index >= 0) {
                        var info1 = data.substring(0, index);
                        data = data.substring(index + 1); // remove meta prefix
                        if (info1.indexOf("base64") >= 0) {
                            data = Utils_1.Utils.atob(data); // decode base64
                        }
                    }
                }
                header = DiskImage_1.DiskImage.parseAmsdosHeader(data);
                if (header) {
                    data = data.substring(0x80); // remove header
                }
                else if (FileHandler.reRegExpIsText.test(data)) {
                    header = FileHandler.createMinimalAmsdosHeader("A", 0, data.length);
                }
                else if (DiskImage_1.DiskImage.testDiskIdent(data.substring(0, 8))) { // disk image file?
                    try {
                        var dsk = new DiskImage_1.DiskImage({
                            data: data,
                            diskName: name
                        }), dir = dsk.readDirectory(), diskFiles = Object.keys(dir);
                        for (var i = 0; i < diskFiles.length; i += 1) {
                            var fileName = diskFiles[i];
                            try { // eslint-disable-line max-depth
                                data = dsk.readFile(dir[fileName]);
                                this.fnLoad2(data, fileName, "cpcBasic/binary", imported); // recursive
                            }
                            catch (e) {
                                Utils_1.Utils.console.error(e);
                                if (e instanceof Error) { // eslint-disable-line max-depth
                                    this.outputError(e, true);
                                }
                            }
                        }
                    }
                    catch (e) {
                        Utils_1.Utils.console.error(e);
                        if (e instanceof Error) {
                            this.outputError(e, true);
                        }
                    }
                    header = undefined; // ignore dsk file
                }
                else { // binary
                    header = FileHandler.createMinimalAmsdosHeader("B", 0, data.length);
                }
            }
            if (header) {
                var meta = FileHandler.joinMeta(header);
                try {
                    Utils_1.Utils.localStorage.setItem(storageName, meta + "," + data);
                    this.updateStorageDatabase("set", storageName);
                    Utils_1.Utils.console.log("fnOnLoad: file: " + storageName + " meta: " + meta + " imported");
                    imported.push(name);
                }
                catch (e) { // maybe quota exceeded
                    Utils_1.Utils.console.error(e);
                    if (e instanceof Error) {
                        if (e.name === "QuotaExceededError") {
                            e.shortMessage = storageName + ": Quota exceeded";
                        }
                        this.outputError(e, true);
                    }
                }
            }
        };
        FileHandler.metaIdent = "CPCBasic";
        FileHandler.reRegExpIsText = new RegExp(/^\d+ |^[\t\r\n\x1a\x20-\x7e]*$/); // eslint-disable-line no-control-regex
        return FileHandler;
    }());
    // */
    var Controller = /** @class */ (function () {
        function Controller(model, view) {
            this.fnScript = undefined; // eslint-disable-line @typescript-eslint/ban-types
            this.timeoutHandlerActive = false;
            this.nextLoopTimeOut = 0; // next timeout for the main loop
            this.inputSet = false;
            this.inputStack = new InputStack_1.InputStack();
            this.sound = new Sound_1.Sound({
                AudioContextConstructor: window.AudioContext
            });
            /* eslint-disable no-invalid-this */
            this.handlers = {
                timer: this.fnTimer,
                waitKey: this.fnWaitKey,
                waitFrame: this.fnWaitFrame,
                waitSound: this.fnWaitSound,
                waitInput: this.fnWaitInput,
                fileCat: this.fnFileCat,
                fileDir: this.fnFileDir,
                fileEra: this.fnFileEra,
                fileRen: this.fnFileRen,
                error: Controller.fnDummy,
                onError: this.fnOnError,
                stop: Controller.fnDummy,
                "break": Controller.fnDummy,
                escape: Controller.fnDummy,
                renumLines: this.fnRenumLines,
                deleteLines: this.fnDeleteLines,
                end: Controller.fnDummy,
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
            this.fnRunLoopHandler = this.fnRunLoop.bind(this);
            this.fnWaitKeyHandler = this.fnWaitKey.bind(this);
            this.fnWaitInputHandler = this.fnWaitInput.bind(this);
            this.fnOnEscapeHandler = this.fnOnEscape.bind(this);
            this.fnDirectInputHandler = this.fnDirectInput.bind(this);
            this.fnPutKeyInBufferHandler = this.fnPutKeyInBuffer.bind(this);
            this.model = model;
            this.view = view;
            this.commonEventHandler = new CommonEventHandler_1.CommonEventHandler(model, view, this);
            this.view.attachEventHandler("click", this.commonEventHandler);
            this.view.attachEventHandler("change", this.commonEventHandler);
            view.setHidden("consoleBox", !model.getProperty("showConsole"));
            view.setHidden("inputArea", !model.getProperty("showInput"));
            view.setHidden("inp2Area", !model.getProperty("showInp2"));
            view.setHidden("outputArea", !model.getProperty("showOutput"));
            view.setHidden("resultArea", !model.getProperty("showResult"));
            this.textCanvas = new TextCanvas_1.TextCanvas({
                onClickKey: this.fnPutKeyInBufferHandler
            });
            view.setHidden("textArea", !model.getProperty("showText"));
            view.setHidden("variableArea", !model.getProperty("showVariable"));
            view.setHidden("kbdArea", !model.getProperty("showKbd"), "flex");
            view.setHidden("kbdLayoutArea", model.getProperty("showKbd"), "inherit"); // kbd visible => kbdlayout invisible
            view.setHidden("cpcArea", false); // make sure canvas is not hidden (allows to get width, height)
            this.canvas = new Canvas_1.Canvas({
                charset: cpcCharset_1.cpcCharset,
                onClickKey: this.fnPutKeyInBufferHandler
            });
            view.setHidden("cpcArea", !model.getProperty("showCpc"));
            view.setHidden("settingsArea", !model.getProperty("showSettings"), "flex");
            view.setHidden("convertArea", !model.getProperty("showConvert"), "flex");
            view.setInputChecked("implicitLinesInput", model.getProperty("implicitLines"));
            view.setInputChecked("arrayBoundsInput", model.getProperty("arrayBounds"));
            this.variables = new Variables_1.Variables({
                arrayBounds: model.getProperty("arrayBounds")
            });
            view.setInputChecked("traceInput", model.getProperty("trace"));
            var kbdLayout = model.getProperty("kbdLayout");
            view.setSelectValue("kbdLayoutSelect", kbdLayout);
            this.commonEventHandler.onKbdLayoutSelectChange();
            this.keyboard = new Keyboard_1.Keyboard({
                fnOnEscapeHandler: this.fnOnEscapeHandler
            });
            if (this.model.getProperty("showKbd")) { // maybe we need to draw virtual keyboard
                this.virtualKeyboardCreate();
            }
            this.commonEventHandler.fnSetUserAction(this.onUserAction.bind(this)); // check first user action, also if sound is not yet on
            this.vm = new CpcVm_1.CpcVm({
                canvas: this.canvas,
                textCanvas: this.textCanvas,
                keyboard: this.keyboard,
                sound: this.sound,
                variables: this.variables
            });
            this.vm.vmReset();
            this.rsx = new CpcVmRsx_1.CpcVmRsx(this.vm);
            this.vm.vmSetRsxClass(this.rsx);
            this.noStop = Object.assign({}, this.vm.vmGetStopObject());
            this.savedStop = {
                reason: "",
                priority: 0,
                paras: {
                    command: "",
                    stream: 0,
                    line: 0,
                    first: 0,
                    last: 0 // unused
                }
            }; // backup of stop object
            this.setStopObject(this.noStop);
            this.codeGeneratorJs = new CodeGeneratorJs_1.CodeGeneratorJs({
                lexer: new BasicLexer_1.BasicLexer({
                    keywords: BasicParser_1.BasicParser.keywords
                }),
                parser: new BasicParser_1.BasicParser(),
                trace: model.getProperty("trace"),
                rsx: this.rsx,
                implicitLines: model.getProperty("implicitLines")
            });
            if (model.getProperty("sound")) { // activate sound needs user action
                this.setSoundActive(); // activate in waiting state
            }
            if (model.getProperty("showCpc")) {
                this.canvas.startUpdateCanvas();
            }
            if (model.getProperty("showText")) {
                this.textCanvas.startUpdateCanvas();
            }
            this.initDropZone();
            var example = model.getProperty("example");
            view.setSelectValue("exampleSelect", example);
            this.initDatabases();
        }
        Controller.prototype.initDatabases = function () {
            var model = this.model, databases = {}, databaseDirs = model.getProperty("databaseDirs").split(",");
            for (var i = 0; i < databaseDirs.length; i += 1) {
                var databaseDir = databaseDirs[i], parts = databaseDir.split("/"), name_1 = parts[parts.length - 1];
                databases[name_1] = {
                    text: name_1,
                    title: databaseDir,
                    src: databaseDir
                };
            }
            this.model.addDatabases(databases);
            this.setDatabaseSelectOptions();
            //this.onDatabaseSelectChange();
        };
        Controller.prototype.onUserAction = function ( /* event, id */) {
            this.commonEventHandler.fnSetUserAction(undefined); // deactivate user action
            this.sound.setActivatedByUser();
            this.setSoundActive();
        };
        // Also called from index file 0index.js
        Controller.prototype.addIndex = function (dir, input) {
            input = input.trim();
            var index = JSON.parse(input);
            for (var i = 0; i < index.length; i += 1) {
                index[i].dir = dir;
                this.model.setExample(index[i]);
            }
        };
        // Also called from example files xxxxx.js
        Controller.prototype.addItem = function (key, input) {
            if (!key) { // maybe ""
                key = (document.currentScript && document.currentScript.getAttribute("data-key")) || this.model.getProperty("example");
                // on IE we can just get the current example
            }
            input = input.replace(/^\n/, "").replace(/\n$/, ""); // remove preceding and trailing newlines
            // beware of data files ending with newlines! (do not use trimEnd)
            var example = this.model.getExample(key);
            example.key = key; // maybe changed
            example.script = input;
            example.loaded = true;
            Utils_1.Utils.console.log("addItem:", key);
            return key;
        };
        Controller.prototype.setDatabaseSelectOptions = function () {
            var select = "databaseSelect", items = [], databases = this.model.getAllDatabases(), database = this.model.getProperty("database");
            for (var value in databases) {
                if (databases.hasOwnProperty(value)) {
                    var db = databases[value], item = {
                        value: value,
                        text: db.text,
                        title: db.title,
                        selected: value === database
                    };
                    items.push(item);
                }
            }
            this.view.setSelectOptions(select, items);
        };
        Controller.prototype.setExampleSelectOptions = function () {
            var maxTitleLength = 160, maxTextLength = 60, // (32 visible?)
            select = "exampleSelect", items = [], example = this.model.getProperty("example"), allExamples = this.model.getAllExamples();
            var exampleSelected = false;
            for (var key in allExamples) {
                if (allExamples.hasOwnProperty(key)) {
                    var exampleEntry = allExamples[key];
                    if (exampleEntry.meta !== "D") { // skip data files
                        var title = (exampleEntry.key + ": " + exampleEntry.title).substring(0, maxTitleLength), item = {
                            value: exampleEntry.key,
                            title: title,
                            text: title.substring(0, maxTextLength),
                            selected: exampleEntry.key === example
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
            this.view.setSelectOptions(select, items);
        };
        Controller.prototype.setVarSelectOptions = function (select, variables) {
            var maxVarLength = 35, varNames = variables.getAllVariableNames(), items = [], fnSortByStringProperties = function (a, b) {
                var x = a.value, y = b.value;
                if (x < y) {
                    return -1;
                }
                else if (x > y) {
                    return 1;
                }
                return 0;
            };
            for (var i = 0; i < varNames.length; i += 1) {
                var key = varNames[i], value = variables.getVariable(key), title = key + "=" + value;
                var strippedTitle = title.substring(0, maxVarLength); // limit length
                if (title !== strippedTitle) {
                    strippedTitle += " ...";
                }
                var item = {
                    value: key,
                    text: strippedTitle,
                    title: strippedTitle,
                    selected: false
                };
                item.text = item.title;
                items.push(item);
            }
            items.sort(fnSortByStringProperties);
            this.view.setSelectOptions(select, items);
        };
        Controller.prototype.updateStorageDatabase = function (action, key) {
            var database = this.model.getProperty("database"), storage = Utils_1.Utils.localStorage;
            if (database !== "storage") {
                this.model.setProperty("database", "storage"); // switch to storage database
            }
            var dir;
            if (!key) { // no key => get all
                dir = Controller.fnGetStorageDirectoryEntries();
            }
            else {
                dir = [key];
            }
            for (var i = 0; i < dir.length; i += 1) {
                key = dir[i];
                if (action === "remove") {
                    this.model.removeExample(key);
                }
                else if (action === "set") {
                    var example = this.model.getExample(key);
                    if (!example) {
                        var dataString = storage.getItem(key) || "", data = Controller.splitMeta(dataString);
                        example = {
                            key: key,
                            title: "",
                            meta: data.meta.typeString // currently we take only the type
                        };
                        this.model.setExample(example);
                    }
                }
                else {
                    Utils_1.Utils.console.error("updateStorageDatabase: unknown action", action);
                }
            }
            if (database === "storage") {
                this.setExampleSelectOptions();
            }
            else {
                this.model.setProperty("database", database); // restore database
            }
        };
        Controller.prototype.removeKeyBoardHandler = function () {
            this.keyboard.setKeyDownHandler();
        };
        Controller.prototype.setInputText = function (input, keepStack) {
            this.view.setAreaValue("inputText", input);
            if (!keepStack) {
                this.fnInitUndoRedoButtons();
            }
            else {
                this.fnUpdateUndoRedoButtons();
            }
        };
        Controller.prototype.invalidateScript = function () {
            this.fnScript = undefined;
        };
        Controller.prototype.fnWaitForContinue = function () {
            var stream = 0, key = this.keyboard.getKeyFromBuffer();
            if (key !== "") {
                this.vm.cursor(stream, 0);
                this.removeKeyBoardHandler();
                this.startContinue();
            }
        };
        Controller.prototype.fnOnEscape = function () {
            var stop = this.vm.vmGetStopObject(), stream = 0;
            if (this.vm.vmOnBreakContSet()) {
                // ignore break
            }
            else if (stop.reason === "direct" || this.vm.vmOnBreakHandlerActive()) {
                stop.paras.input = "";
                var msg = "*Break*\r\n";
                this.vm.print(stream, msg);
            }
            else if (stop.reason !== "escape") { // first escape?
                this.vm.cursor(stream, 1);
                this.keyboard.clearInput();
                this.keyboard.setKeyDownHandler(this.fnWaitForContinue.bind(this));
                this.setStopObject(stop);
                this.vm.vmStop("escape", 85, false, {
                    command: "escape",
                    stream: stream,
                    first: 0,
                    last: 0,
                    line: this.vm.line
                });
            }
            else { // second escape
                this.removeKeyBoardHandler();
                this.vm.cursor(stream, 0);
                var savedStop = this.getStopObject();
                if (savedStop.reason === "waitInput") { // sepcial handling: set line to repeat input
                    this.vm.vmGoto(savedStop.paras.line);
                }
                if (!this.vm.vmEscape()) {
                    this.vm.vmStop("", 0, true); // continue program, in break handler?
                    this.setStopObject(this.noStop);
                }
                else {
                    this.vm.vmStop("stop", 0, true); // stop
                    var msg = "Break in " + this.vm.line + "\r\n";
                    this.vm.print(stream, msg);
                }
            }
            this.startMainLoop();
        };
        Controller.prototype.fnWaitSound = function () {
            var stop = this.vm.vmGetStopObject();
            this.vm.vmLoopCondition(); // update nextFrameTime, timers, inks; schedule sound: free queue
            if (this.sound.isActivatedByUser()) { // only if activated
                var soundDataList = this.vm.vmGetSoundData();
                while (soundDataList.length && this.sound.testCanQueue(soundDataList[0].state)) {
                    var soundData = soundDataList.shift();
                    this.sound.sound(soundData);
                }
                if (!soundDataList.length) {
                    if (stop.reason === "waitSound") { // only for this reason
                        this.vm.vmStop("", 0, true); // no more wait
                    }
                }
            }
            this.nextLoopTimeOut = this.vm.vmGetTimeUntilFrame(); // wait until next frame
        };
        Controller.prototype.fnWaitKey = function () {
            var key = this.keyboard.getKeyFromBuffer();
            if (key !== "") { // do we have a key from the buffer already?
                Utils_1.Utils.console.log("Wait for key:", key);
                this.vm.vmStop("", 0, true);
                this.removeKeyBoardHandler();
            }
            else {
                this.fnWaitSound(); // sound and blinking events
                this.keyboard.setKeyDownHandler(this.fnWaitKeyHandler); // wait until keypress handler (for call &bb18)
            }
            return key;
        };
        Controller.prototype.fnWaitInput = function () {
            var stop = this.vm.vmGetStopObject(), inputParas = stop.paras, stream = inputParas.stream;
            var input = inputParas.input, key;
            if (input === undefined || stream === undefined) {
                this.outputError(this.vm.vmComposeError(Error(), 32, "Programming Error: fnWaitInput"), true);
                return;
            }
            do {
                key = this.keyboard.getKeyFromBuffer(); // (inkey$ could insert frame if checked too often)
                // chr13 shows as empty string!
                switch (key) {
                    case "": // no key?
                        break;
                    case "\r": // cr (\x0d)
                        break;
                    case "\x10": // DLE (clear character under cursor)
                        key = "\x07"; // currently ignore (BEL)
                        break;
                    case "\x7f": // del
                        if (input.length) {
                            input = input.slice(0, -1);
                            key = "\x08\x10"; // use BS and DLE
                        }
                        else {
                            key = "\x07"; // ignore BS, use BEL
                        }
                        break;
                    case "\xe0": // copy
                        key = this.vm.copychr$(stream);
                        if (key.length) {
                            input += key;
                            key = "\x09"; // TAB
                        }
                        else {
                            key = "\x07"; // ignore (BEL)
                        }
                        break;
                    case "\xf0": // cursor up
                        if (!input.length) {
                            key = "\x0b"; // VT
                        }
                        else {
                            key = "\x07"; // ignore (BEL)
                        }
                        break;
                    case "\xf1": // cursor down
                        if (!input.length) {
                            key = "\x0a"; // LF
                        }
                        else {
                            key = "\x07"; // ignore (BEL)
                        }
                        break;
                    case "\xf2": // cursor left
                        if (!input.length) {
                            key = "\x08"; // BS
                        }
                        else {
                            key = "\x07"; // ignore (BEL) TODO
                        }
                        break;
                    case "\xf3": // cursor right
                        if (!input.length) {
                            key = "\x09"; // TAB
                        }
                        else {
                            key = "\x07"; // ignore (BEL) TODO
                        }
                        break;
                    case "\xf4": // shift+cursor up
                        key = ""; // currently ignore
                        break;
                    case "\xf5": // shift+cursor down
                        key = ""; // currently ignore
                        break;
                    case "\xf6": // shift+cursor left
                        key = ""; // currently ignore
                        break;
                    case "\xf7": // shift+cursor right
                        key = ""; // currently ignore
                        break;
                    case "\xf8": // ctrl+cursor up
                        key = ""; // currently ignore
                        break;
                    case "\xf9": // ctrl+cursor down
                        key = ""; // currently ignore
                        break;
                    case "\xfa": // ctrl+cursor left
                        key = ""; // currently ignore
                        break;
                    case "\xfb": // ctrl+cursor right
                        key = ""; // currently ignore
                        break;
                    default:
                        input += key;
                        if (key < "\x20") { // control code
                            key = "\x01" + key; // print control code (do not execute)
                        }
                        break;
                }
                if (key && key !== "\r") {
                    this.vm.print(stream, key);
                }
            } while (key !== "" && key !== "\r"); // get all keys until CR or no more key
            inputParas.input = input;
            var inputOk = false;
            if (key === "\r") {
                Utils_1.Utils.console.log("fnWaitInput:", input, "reason", stop.reason);
                if (!inputParas.noCRLF) {
                    this.vm.print(stream, "\r\n");
                }
                if (inputParas.fnInputCallback) {
                    inputOk = inputParas.fnInputCallback();
                }
                else {
                    inputOk = true;
                }
                if (inputOk) {
                    this.removeKeyBoardHandler();
                    if (stop.reason === "waitInput") { // only for this reason
                        this.vm.vmStop("", 0, true); // no more wait
                    }
                    else {
                        this.startContinue();
                    }
                }
            }
            if (!inputOk) {
                if (stop.reason === "waitInput") { // only for this reason
                    this.fnWaitSound(); // sound and blinking events
                }
                this.keyboard.setKeyDownHandler(this.fnWaitInputHandler); // make sure it is set
            }
        };
        Controller.parseLineNumber = function (line) {
            var lineNumber = parseInt(line, 10);
            if (lineNumber < 0 || lineNumber > 65535) {
                // we must not throw an error
            }
            return lineNumber;
        };
        Controller.addLineNumbers = function (input) {
            var lineParts = input.split("\n");
            var lastLine = 0;
            for (var i = 0; i < lineParts.length; i += 1) {
                var lineNum = parseInt(lineParts[i], 10);
                if (isNaN(lineNum)) {
                    lineNum = lastLine + 1;
                    lineParts[i] = String(lastLine + 1) + " " + lineParts[i];
                }
                lastLine = lineNum;
            }
            return lineParts.join("\n");
        };
        Controller.prototype.splitLines = function (input) {
            if (this.model.getProperty("implicitLines")) {
                input = Controller.addLineNumbers(input);
            }
            // get numbers starting at the beginning of a line (allows some simple multi line strings)
            var lineParts = input.split(/^(\s*\d+)/m), lines = [];
            if (lineParts[0] === "") {
                lineParts.shift(); // remove first empty item
            }
            for (var i = 0; i < lineParts.length; i += 2) {
                var number = lineParts[i];
                var content = lineParts[i + 1];
                if (content.endsWith("\n")) {
                    content = content.substring(0, content.length - 1);
                }
                lines.push(number + content);
            }
            return lines;
        };
        // merge two scripts with sorted line numbers, lines from script2 overwrite lines from script1
        Controller.prototype.mergeScripts = function (script1, script2) {
            var lines1 = this.splitLines(Utils_1.Utils.stringTrimEnd(script1)), lines2 = this.splitLines(Utils_1.Utils.stringTrimEnd(script2));
            var result = [], lineNumber1, lineNumber2;
            while (lines1.length && lines2.length) {
                lineNumber1 = lineNumber1 || Controller.parseLineNumber(lines1[0]);
                lineNumber2 = lineNumber2 || Controller.parseLineNumber(lines2[0]);
                if (lineNumber1 < lineNumber2) { // use line from script1
                    result.push(lines1.shift());
                    lineNumber1 = 0;
                }
                else { // use line from script2
                    var line2 = lines2.shift();
                    if (String(lineNumber2) !== line2) { // line not empty?
                        result.push(line2);
                    }
                    if (lineNumber1 === lineNumber2) { // same line number in script1 and script2
                        lines1.shift(); // ignore line from script1 (overwrite it)
                        lineNumber1 = 0;
                    }
                    lineNumber2 = 0;
                }
            }
            result = result.concat(lines1, lines2); // put in remaining lines from one source
            if (result.length >= 2) {
                if (result[result.length - 2] === "" && result[result.length - 1] === "") {
                    result.pop(); // remove additional newline
                }
            }
            return result.join("\n");
        };
        // get line range from a script with sorted line numbers
        Controller.prototype.fnGetLinesInRange = function (script, firstLine, lastLine) {
            var lines = script ? this.splitLines(script) : [];
            while (lines.length && parseInt(lines[0], 10) < firstLine) {
                lines.shift();
            }
            if (lines.length && lines[lines.length - 1] === "") { // trailing empty line?
                lines.pop(); // remove
            }
            while (lines.length && parseInt(lines[lines.length - 1], 10) > lastLine) {
                lines.pop();
            }
            return lines;
        };
        Controller.fnPrepareMaskRegExp = function (mask) {
            mask = mask.replace(/([.+^$[\]\\(){}|-])/g, "\\$1");
            mask = mask.replace(/\?/g, ".");
            mask = mask.replace(/\*/g, ".*");
            return new RegExp("^" + mask + "$");
        };
        Controller.prototype.fnGetExampleDirectoryEntries = function (mask) {
            var dir = [], allExamples = this.model.getAllExamples();
            var regExp;
            if (mask) {
                regExp = Controller.fnPrepareMaskRegExp(mask);
            }
            for (var key in allExamples) {
                if (allExamples.hasOwnProperty(key)) {
                    var example = allExamples[key], key2 = example.key, matchKey2 = key2 + ((key2.indexOf(".") < 0) ? "." : "");
                    if (!regExp || regExp.test(matchKey2)) {
                        dir.push(key2);
                    }
                }
            }
            return dir;
        };
        Controller.fnGetStorageDirectoryEntries = function (mask) {
            var storage = Utils_1.Utils.localStorage, dir = [];
            var regExp;
            if (mask) {
                regExp = Controller.fnPrepareMaskRegExp(mask);
            }
            for (var i = 0; i < storage.length; i += 1) {
                var key = storage.key(i);
                if (key !== null && storage[key].startsWith(this.metaIdent)) { // take only cpcBasic files
                    if (!regExp || regExp.test(key)) {
                        dir.push(key);
                    }
                }
            }
            return dir;
        };
        Controller.prototype.fnPrintDirectoryEntries = function (stream, dir, sort) {
            // first, format names
            for (var i = 0; i < dir.length; i += 1) {
                var key = dir[i], parts = key.split(".");
                if (parts.length === 2) {
                    dir[i] = parts[0].padEnd(8, " ") + "." + parts[1].padEnd(3, " ");
                }
            }
            if (sort) {
                dir.sort();
            }
            this.vm.print(stream, "\r\n");
            for (var i = 0; i < dir.length; i += 1) {
                var key = dir[i] + "  ";
                this.vm.print(stream, key);
            }
            this.vm.print(stream, "\r\n");
        };
        Controller.prototype.fnFileCat = function (paras) {
            var stream = paras.stream, dir = Controller.fnGetStorageDirectoryEntries();
            this.fnPrintDirectoryEntries(stream, dir, true);
            // currently only from localstorage
            this.vm.vmStop("", 0, true);
        };
        Controller.prototype.fnFileDir = function (paras) {
            var stream = paras.stream, example = this.model.getProperty("example"), // if we have a fileMask, include also example names from same directory
            lastSlash = example.lastIndexOf("/");
            var fileMask = paras.fileMask ? Controller.fnLocalStorageName(paras.fileMask) : "", dir = Controller.fnGetStorageDirectoryEntries(fileMask), path = "";
            if (lastSlash >= 0) {
                path = example.substring(0, lastSlash) + "/";
                fileMask = path + (fileMask ? fileMask : "*.*"); // only in same directory
            }
            var dir2 = this.fnGetExampleDirectoryEntries(fileMask); // also from examples
            for (var i = 0; i < dir2.length; i += 1) {
                dir2[i] = dir2[i].substring(path.length); // remove preceding path including "/"
            }
            dir = dir2.concat(dir); // combine
            this.fnPrintDirectoryEntries(stream, dir, false);
            this.vm.vmStop("", 0, true);
        };
        Controller.prototype.fnFileEra = function (paras) {
            var stream = paras.stream, storage = Utils_1.Utils.localStorage, fileMask = Controller.fnLocalStorageName(paras.fileMask || ""), dir = Controller.fnGetStorageDirectoryEntries(fileMask);
            if (!dir.length) {
                this.vm.print(stream, fileMask + " not found\r\n");
            }
            for (var i = 0; i < dir.length; i += 1) {
                var name_2 = dir[i];
                if (storage.getItem(name_2) !== null) {
                    storage.removeItem(name_2);
                    this.updateStorageDatabase("remove", name_2);
                    if (Utils_1.Utils.debug > 0) {
                        Utils_1.Utils.console.debug("fnEraseFile: name=" + name_2 + ": removed from localStorage");
                    }
                }
                else {
                    this.vm.print(stream, name_2 + " not found\r\n");
                    Utils_1.Utils.console.warn("fnEraseFile: file not found in localStorage:", name_2);
                }
            }
            this.vm.vmStop("", 0, true);
        };
        Controller.prototype.fnFileRen = function (paras) {
            var stream = paras.stream, storage = Utils_1.Utils.localStorage, newName = Controller.fnLocalStorageName(paras.newName), oldName = Controller.fnLocalStorageName(paras.oldName), item = storage.getItem(oldName);
            if (item !== null) {
                if (!storage.getItem(newName)) {
                    storage.setItem(newName, item);
                    this.updateStorageDatabase("set", newName);
                    storage.removeItem(oldName);
                    this.updateStorageDatabase("remove", oldName);
                }
                else {
                    this.vm.print(stream, oldName + " already exists\r\n");
                }
            }
            else {
                this.vm.print(stream, oldName + " not found\r\n");
            }
            this.vm.vmStop("", 0, true);
        };
        // Hisoft Devpac GENA3 Z80 Assember (http://www.cpcwiki.eu/index.php/Hisoft_Devpac)
        Controller.asmGena3Convert = function (data) {
            var fnUInt16 = function (pos2) {
                return data.charCodeAt(pos2) + data.charCodeAt(pos2 + 1) * 256;
            }, length = data.length;
            var pos = 0, out = "";
            pos += 4; // what is the meaning of these bytes?
            while (pos < length) {
                var lineNum = fnUInt16(pos);
                pos += 2;
                var index1 = data.indexOf("\r", pos); // EOL marker 0x0d
                if (index1 < 0) {
                    index1 = length;
                }
                var index2 = data.indexOf("\x1c", pos); // EOL marker 0x1c
                if (index2 < 0) {
                    index2 = length;
                }
                index1 = Math.min(index1, index2);
                out += lineNum + " " + data.substring(pos, index1) + "\n";
                pos = index1 + 1;
            }
            return out;
        };
        Controller.prototype.decodeTokenizedBasic = function (input) {
            if (!this.basicTokenizer) {
                this.basicTokenizer = new BasicTokenizer_1.BasicTokenizer();
            }
            return this.basicTokenizer.decode(input);
        };
        Controller.prototype.encodeTokenizedBasic = function (input, name) {
            if (name === void 0) { name = "test"; }
            if (!this.codeGeneratorToken) {
                this.codeGeneratorToken = new CodeGeneratorToken_1.CodeGeneratorToken({
                    lexer: new BasicLexer_1.BasicLexer({
                        keywords: BasicParser_1.BasicParser.keywords,
                        keepWhiteSpace: true
                    }),
                    parser: new BasicParser_1.BasicParser({
                        keepTokens: true,
                        keepBrackets: true,
                        keepColons: true,
                        keepDataComma: true
                    }),
                    implicitLines: this.model.getProperty("implicitLines")
                });
            }
            var output = this.codeGeneratorToken.generate(input);
            if (output.error) {
                this.outputError(output.error);
            }
            else if (Utils_1.Utils.debug > 1) {
                var outputText = output.text, hex = outputText.split("").map(function (s) { return s.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0"); }).join(","), decoded = this.decodeTokenizedBasic(outputText), diff = Diff_1.Diff.testDiff(input.toUpperCase(), decoded.toUpperCase()); // for testing
                Utils_1.Utils.console.debug("TokenizerInput (" + name + "):\n" + input);
                Utils_1.Utils.console.debug("TokenizerHex (" + name + "):\n" + hex);
                Utils_1.Utils.console.debug("TokenizerDecoded (" + name + "):\n" + decoded);
                Utils_1.Utils.console.debug("TokenizerDiff (" + name + "):\n" + diff);
            }
            return output.text;
        };
        Controller.prototype.prettyPrintBasic = function (input, keepWhiteSpace, keepBrackets) {
            if (!this.codeGeneratorBasic) {
                this.codeGeneratorBasic = new CodeGeneratorBasic_1.CodeGeneratorBasic({
                    lexer: new BasicLexer_1.BasicLexer({
                        keywords: BasicParser_1.BasicParser.keywords
                    }),
                    parser: new BasicParser_1.BasicParser()
                });
            }
            var keepColons = keepBrackets, // we switch all with one setting
            keepDataComma = true;
            this.codeGeneratorBasic.getLexer().setOptions({
                keepWhiteSpace: keepWhiteSpace
            });
            this.codeGeneratorBasic.getParser().setOptions({
                keepTokens: true,
                keepBrackets: keepBrackets,
                keepColons: keepColons,
                keepDataComma: keepDataComma
            });
            var output = this.codeGeneratorBasic.generate(input);
            if (output.error) {
                this.outputError(output.error);
            }
            return output.text;
        };
        Controller.prototype.loadFileContinue = function (input) {
            var inFile = this.vm.vmGetInFileObject(), command = inFile.command;
            var startLine = 0, putInMemory = false, data;
            if (input !== null && input !== undefined) {
                data = Controller.splitMeta(input);
                input = data.data; // maybe changed
                if (data.meta.encoding === "base64") {
                    input = Utils_1.Utils.atob(input); // decode base64
                }
                var type = data.meta.typeString;
                if (type === "T") { // tokenized basic?
                    input = this.decodeTokenizedBasic(input);
                }
                else if (type === "P") { // BASIC?
                    input = DiskImage_1.DiskImage.unOrProtectData(input);
                    input = this.decodeTokenizedBasic(input);
                }
                else if (type === "B") { // binary?
                }
                else if (type === "A") { // ASCII?
                    // remove EOF character(s) (0x1a) from the end of file
                    input = input.replace(/\x1a+$/, ""); // eslint-disable-line no-control-regex
                }
                else if (type === "G") { // Hisoft Devpac GENA3 Z80 Assember
                    input = Controller.asmGena3Convert(input);
                }
            }
            if (inFile.fnFileCallback) {
                try {
                    putInMemory = inFile.fnFileCallback(input, data && data.meta);
                }
                catch (e) {
                    Utils_1.Utils.console.warn(e);
                }
            }
            if (input === undefined) {
                Utils_1.Utils.console.error("loadFileContinue: File " + inFile.name + ": input undefined!");
                this.vm.vmStop("stop", 60, true);
                this.startMainLoop();
                return;
            }
            if (input === null) {
                this.startMainLoop();
                return;
            }
            switch (command) {
                case "openin":
                    break;
                case "chainMerge":
                    input = this.mergeScripts(this.view.getAreaValue("inputText"), input);
                    this.setInputText(input);
                    this.view.setAreaValue("resultText", "");
                    startLine = inFile.line || 0;
                    this.invalidateScript();
                    this.fnParseRun();
                    break;
                case "load":
                    if (!putInMemory) {
                        this.setInputText(input);
                        this.view.setAreaValue("resultText", "");
                        this.invalidateScript();
                        this.vm.vmStop("end", 90);
                    }
                    break;
                case "merge":
                    input = this.mergeScripts(this.view.getAreaValue("inputText"), input);
                    this.setInputText(input);
                    this.view.setAreaValue("resultText", "");
                    this.invalidateScript();
                    this.vm.vmStop("end", 90);
                    break;
                case "chain": // TODO: if we have a line number, make sure it is not optimized away when compiling
                    this.setInputText(input);
                    this.view.setAreaValue("resultText", "");
                    startLine = inFile.line || 0;
                    this.invalidateScript();
                    this.fnParseRun();
                    break;
                case "run":
                    if (!putInMemory) {
                        this.setInputText(input);
                        this.view.setAreaValue("resultText", "");
                        startLine = inFile.line || 0;
                        this.fnReset();
                        this.fnParseRun();
                    }
                    else {
                        this.fnReset();
                    }
                    break;
                default:
                    Utils_1.Utils.console.error("loadExample: Unknown command:", command);
                    break;
            }
            this.vm.vmSetStartLine(startLine);
            this.startMainLoop();
        };
        Controller.prototype.createFnExampleLoaded = function (example, url, inFile) {
            var _this = this;
            return function (_sFullUrl, key, suppressLog) {
                if (key !== example) {
                    Utils_1.Utils.console.warn("fnExampleLoaded: Unexpected", key, "<>", example);
                }
                var exampleEntry = _this.model.getExample(example);
                if (!suppressLog) {
                    Utils_1.Utils.console.log("Example", url, (exampleEntry.meta ? exampleEntry.meta + " " : "") + " loaded");
                }
                var input = exampleEntry.script;
                _this.model.setProperty("example", inFile.memorizedExample);
                _this.vm.vmStop("", 0, true);
                _this.loadFileContinue(input);
            };
        };
        Controller.prototype.createFnExampleError = function (example, url, inFile) {
            var _this = this;
            return function () {
                Utils_1.Utils.console.log("Example", url, "error");
                _this.model.setProperty("example", inFile.memorizedExample);
                _this.vm.vmStop("", 0, true);
                var error = _this.vm.vmComposeError(Error(), 32, example + " not found"); // TODO: set also derr=146 (xx not found)
                // error or onError set
                if (error.hidden) {
                    _this.vm.vmStop("", 0, true); // clear onError
                }
                _this.outputError(error, true);
                _this.loadFileContinue(null);
            };
        };
        Controller.prototype.loadExample = function () {
            var inFile = this.vm.vmGetInFileObject(), key = this.model.getProperty("example");
            var name = inFile.name;
            if (name.charAt(0) === "/") { // absolute path?
                name = name.substring(1); // remove "/"
                inFile.memorizedExample = name; // change!
            }
            else {
                inFile.memorizedExample = key;
                var lastSlash = key.lastIndexOf("/");
                if (lastSlash >= 0) {
                    var path = key.substring(0, lastSlash); // take path from selected example
                    name = path + "/" + name;
                    name = name.replace(/\w+\/\.\.\//, ""); // simplify 2 dots (go back) in path: "dir/.."" => ""
                }
            }
            var example = name;
            if (Utils_1.Utils.debug > 0) {
                Utils_1.Utils.console.debug("loadExample: name=" + name + " (current=" + key + ")");
            }
            var exampleEntry = this.model.getExample(example); // already loaded
            var url;
            if (exampleEntry && exampleEntry.loaded) {
                this.model.setProperty("example", example);
                url = example; //TTT
                var fnExampleLoaded = this.createFnExampleLoaded(example, url, inFile);
                fnExampleLoaded("", example, true);
            }
            else if (example && exampleEntry) { // need to load
                this.model.setProperty("example", example);
                var databaseDir = this.model.getDatabase().src;
                url = databaseDir + "/" + example + ".js";
                Utils_1.Utils.loadScript(url, this.createFnExampleLoaded(example, url, inFile), this.createFnExampleError(example, url, inFile), example);
            }
            else { // keep original example in this error case
                url = example;
                if (example !== "") { // only if not empty
                    Utils_1.Utils.console.warn("loadExample: Unknown file:", example);
                    var fnExampleError = this.createFnExampleError(example, url, inFile);
                    fnExampleError();
                }
                else {
                    this.model.setProperty("example", example);
                    this.vm.vmStop("", 0, true);
                    this.loadFileContinue(""); // empty input?
                }
            }
        };
        Controller.fnLocalStorageName = function (name, defaultExtension) {
            // modify name so we do not clash with localstorage methods/properites
            if (name.indexOf(".") < 0) { // no dot inside name?
                name += "." + (defaultExtension || ""); // append dot or default extension
            }
            return name;
        };
        Controller.tryLoadingFromLocalStorage = function (name) {
            var storage = Utils_1.Utils.localStorage;
            var input = null;
            if (name.indexOf(".") >= 0) { // extension specified?
                input = storage.getItem(name);
            }
            else {
                for (var i = 0; i < Controller.defaultExtensions.length; i += 1) {
                    var storageName = Controller.fnLocalStorageName(name, Controller.defaultExtensions[i]);
                    input = storage.getItem(storageName);
                    if (input !== null) {
                        break; // found
                    }
                }
            }
            return input; // null=not found
        };
        Controller.prototype.fnFileLoad = function () {
            var inFile = this.vm.vmGetInFileObject();
            if (inFile.open) {
                if (inFile.command === "chainMerge" && inFile.first && inFile.last) { // special handling to delete line numbers first
                    this.fnDeleteLines({
                        first: inFile.first,
                        last: inFile.last,
                        command: "CHAIN MERGE",
                        stream: 0,
                        line: this.vm.line
                    });
                    this.vm.vmStop("fileLoad", 90); // restore
                }
                var name_3 = inFile.name;
                if (Utils_1.Utils.debug > 1) {
                    Utils_1.Utils.console.debug("fnFileLoad:", inFile.command, name_3, "details:", inFile);
                }
                var input = Controller.tryLoadingFromLocalStorage(name_3);
                if (input !== null) {
                    if (Utils_1.Utils.debug > 0) {
                        Utils_1.Utils.console.debug("fnFileLoad:", inFile.command, name_3, "from localStorage");
                    }
                    this.vm.vmStop("", 0, true);
                    this.loadFileContinue(input);
                }
                else { // load from example
                    this.loadExample( /* name */);
                }
            }
            else {
                Utils_1.Utils.console.error("fnFileLoad:", inFile.name, "File not open!"); // hopefully isName is defined
            }
            this.nextLoopTimeOut = this.vm.vmGetTimeUntilFrame(); // wait until next frame
        };
        Controller.joinMeta = function (meta) {
            return [
                Controller.metaIdent,
                meta.typeString,
                meta.start,
                meta.length,
                meta.entry
            ].join(";");
        };
        Controller.splitMeta = function (input) {
            var fileMeta;
            if (input.indexOf(Controller.metaIdent) === 0) { // starts with metaIdent?
                var index = input.indexOf(","); // metadata separator
                if (index >= 0) {
                    var metaString = input.substring(0, index);
                    input = input.substring(index + 1);
                    var meta = metaString.split(";");
                    fileMeta = {
                        typeString: meta[1],
                        start: Number(meta[2]),
                        length: Number(meta[3]),
                        entry: Number(meta[4]),
                        encoding: meta[5]
                    };
                }
            }
            if (!fileMeta) {
                fileMeta = {
                    typeString: ""
                };
            }
            var metaAndData = {
                meta: fileMeta,
                data: input
            };
            return metaAndData;
        };
        Controller.prototype.fnFileSave = function () {
            var outFile = this.vm.vmGetOutFileObject(), storage = Utils_1.Utils.localStorage;
            var defaultExtension = "";
            if (outFile.open) {
                var type = outFile.typeString, name_4 = outFile.name;
                if (type === "P" || type === "T") {
                    defaultExtension = "bas";
                }
                else if (type === "B") {
                    defaultExtension = "bin";
                }
                var storageName = Controller.fnLocalStorageName(name_4, defaultExtension);
                var fileData = void 0;
                if (outFile.fileData.length || (type === "B") || (outFile.command === "openout")) { // type A(for openout) or B
                    fileData = outFile.fileData.join("");
                }
                else { // no file data (assuming type A, P or T) => get text
                    fileData = this.view.getAreaValue("inputText");
                    if (type === "T" || type === "P") {
                        fileData = this.encodeTokenizedBasic(fileData, storageName);
                        if (fileData === "") {
                            outFile.typeString = "A"; // override type
                        }
                        else if (type === "P") {
                            fileData = DiskImage_1.DiskImage.unOrProtectData(fileData);
                        }
                    }
                    outFile.length = fileData.length; // set length
                }
                if (Utils_1.Utils.debug > 0) {
                    Utils_1.Utils.console.debug("fnFileSave: name=" + name_4 + ": put into localStorage");
                }
                var meta = Controller.joinMeta(outFile);
                storage.setItem(storageName, meta + "," + fileData);
                this.updateStorageDatabase("set", storageName);
                if (outFile.fnFileCallback) {
                    try {
                        outFile.fnFileCallback(fileData); // close file
                    }
                    catch (e) {
                        Utils_1.Utils.console.warn(e);
                    }
                }
                CpcVm_1.CpcVm.vmResetFileHandling(outFile); // make sure it is closed
            }
            else {
                Utils_1.Utils.console.error("fnFileSave: file not open!");
            }
            this.vm.vmStop("", 0, true); // continue
        };
        Controller.prototype.fnDeleteLines = function (paras) {
            var inputText = this.view.getAreaValue("inputText"), lines = this.fnGetLinesInRange(inputText, paras.first || 0, paras.last || 65535);
            var error;
            if (lines.length) {
                for (var i = 0; i < lines.length; i += 1) {
                    var line = parseInt(lines[i], 10);
                    if (isNaN(line)) {
                        error = this.vm.vmComposeError(Error(), 21, paras.command); // "Direct command found"
                        this.outputError(error, true);
                        break;
                    }
                    lines[i] = String(line); // keep just the line numbers
                }
                if (!error) {
                    var input = lines.join("\n");
                    input = this.mergeScripts(inputText, input); // delete input lines
                    this.setInputText(input);
                }
            }
            this.vm.vmGoto(0); // reset current line
            this.vm.vmStop("end", 0, true);
        };
        Controller.prototype.fnNew = function () {
            var input = "";
            this.setInputText(input);
            this.variables.removeAllVariables();
            this.vm.vmGoto(0); // reset current line
            this.vm.vmStop("end", 0, true);
            this.invalidateScript();
        };
        Controller.prototype.fnList = function (paras) {
            var input = this.view.getAreaValue("inputText"), stream = paras.stream, lines = this.fnGetLinesInRange(input, paras.first || 0, paras.last || 65535), regExp = new RegExp(/([\x00-\x1f])/g); // eslint-disable-line no-control-regex
            for (var i = 0; i < lines.length; i += 1) {
                var line = lines[i];
                if (stream !== 9) {
                    line = line.replace(regExp, "\x01$1"); // escape control characters to print them directly
                }
                this.vm.print(stream, line, "\r\n");
            }
            this.vm.vmGoto(0); // reset current line
            this.vm.vmStop("end", 0, true);
        };
        Controller.prototype.fnReset = function () {
            var vm = this.vm;
            this.variables.removeAllVariables();
            vm.vmReset();
            if (this.virtualKeyboard) {
                this.virtualKeyboard.reset();
            }
            vm.vmStop("end", 0, true); // set "end" with priority 0, so that "compile only" still works
            vm.outBuffer = "";
            this.view.setAreaValue("outputText", "");
            this.invalidateScript();
        };
        Controller.prototype.outputError = function (error, noSelection) {
            var stream = 0;
            var shortError;
            if (Utils_1.Utils.isCustomError(error)) {
                shortError = error.shortMessage || error.message;
                if (!noSelection) {
                    var startPos = error.pos || 0, len = error.len || ((error.value !== undefined) ? String(error.value).length : 0), endPos = startPos + len;
                    this.view.setAreaSelection("inputText", error.pos, endPos);
                }
            }
            else {
                shortError = error.message;
            }
            var escapedShortError = shortError.replace(/([\x00-\x1f])/g, "\x01$1"); // eslint-disable-line no-control-regex
            this.vm.print(stream, escapedShortError + "\r\n");
            return shortError;
        };
        Controller.createBasicFormatter = function () {
            return new BasicFormatter_1.BasicFormatter({
                lexer: new BasicLexer_1.BasicLexer({
                    keywords: BasicParser_1.BasicParser.keywords
                }),
                parser: new BasicParser_1.BasicParser()
            });
        };
        Controller.prototype.fnRenumLines = function (paras) {
            var vm = this.vm, input = this.view.getAreaValue("inputText");
            if (!this.basicFormatter) {
                this.basicFormatter = Controller.createBasicFormatter();
            }
            var output = this.basicFormatter.renumber(input, paras.newLine || 10, paras.oldLine || 1, paras.step || 10, paras.keep || 65535);
            if (output.error) {
                Utils_1.Utils.console.warn(output.error);
                this.outputError(output.error);
            }
            else {
                this.fnPutChangedInputOnStack();
                this.setInputText(output.text, true);
                this.fnPutChangedInputOnStack();
            }
            this.vm.vmGoto(0); // reset current line
            vm.vmStop("end", 0, true);
        };
        Controller.prototype.fnEditLineCallback = function () {
            var inputParas = this.vm.vmGetStopObject().paras, inputText = this.view.getAreaValue("inputText");
            var input = inputParas.input;
            input = this.mergeScripts(inputText, input);
            this.setInputText(input);
            this.vm.vmSetStartLine(0);
            this.vm.vmGoto(0); // to be sure
            this.view.setDisabled("continueButton", true);
            this.vm.cursor(inputParas.stream, 0);
            this.vm.vmStop("end", 90);
            return true;
        };
        Controller.prototype.fnEditLine = function (paras) {
            var input = this.view.getAreaValue("inputText"), stream = paras.stream, lineNumber = paras.first || 0, lines = this.fnGetLinesInRange(input, lineNumber, lineNumber);
            if (lines.length) {
                var lineString = lines[0];
                this.vm.print(stream, lineString);
                this.vm.cursor(stream, 1);
                var inputParas = {
                    command: paras.command,
                    line: paras.line,
                    stream: stream,
                    message: "",
                    fnInputCallback: this.fnEditLineCallback.bind(this),
                    input: lineString
                };
                this.vm.vmStop("waitInput", 45, true, inputParas);
                this.fnWaitInput();
            }
            else {
                var error = this.vm.vmComposeError(Error(), 8, String(lineNumber)); // "Line does not exist"
                this.outputError(error);
                this.vm.vmStop("stop", 60, true);
            }
        };
        Controller.prototype.fnParseBench = function (input, bench) {
            var output;
            for (var i = 0; i < bench; i += 1) {
                var time = Date.now();
                output = this.codeGeneratorJs.generate(input, this.variables);
                time = Date.now() - time;
                Utils_1.Utils.console.debug("bench size", input.length, "labels", this.codeGeneratorJs.debugGetLabelsCount(), "loop", i, ":", time, "ms");
                if (output.error) {
                    break;
                }
            }
            return output;
        };
        Controller.prototype.fnParse = function () {
            var input = this.view.getAreaValue("inputText"), bench = this.model.getProperty("bench");
            this.variables.removeAllVariables();
            var output;
            if (!bench) {
                output = this.codeGeneratorJs.generate(input, this.variables);
            }
            else {
                output = this.fnParseBench(input, bench);
            }
            var outputString;
            if (output.error) {
                outputString = this.outputError(output.error);
            }
            else {
                outputString = output.text;
                this.vm.vmSetSourceMap(this.codeGeneratorJs.getSourceMap());
                // optional: tokenize to put tokens into memory...
                var tokens = this.encodeTokenizedBasic(input), addr = 0x170;
                for (var i = 0; i < tokens.length; i += 1) {
                    var code = tokens.charCodeAt(i);
                    if (code > 255) {
                        Utils_1.Utils.console.warn("Put token in memory: addr=" + (addr + i) + ", code=" + code + ", char=" + tokens.charAt(i));
                        code = 0x20; //TTT
                    }
                    this.vm.poke(addr + i, code);
                }
            }
            if (outputString && outputString.length > 0) {
                outputString += "\n";
            }
            this.view.setAreaValue("outputText", outputString);
            this.invalidateScript();
            this.setVarSelectOptions("varSelect", this.variables);
            this.commonEventHandler.onVarSelectChange();
            return output;
        };
        Controller.prototype.fnPretty = function () {
            var input = this.view.getAreaValue("inputText"), keepWhiteSpace = this.view.getInputChecked("prettySpaceInput"), keepBrackets = this.view.getInputChecked("prettyBracketsInput"), output = this.prettyPrintBasic(input, keepWhiteSpace, keepBrackets);
            if (output) {
                this.fnPutChangedInputOnStack();
                this.setInputText(output, true);
                this.fnPutChangedInputOnStack();
                // for testing:
                var diff = Diff_1.Diff.testDiff(input.toUpperCase(), output.toUpperCase());
                this.view.setAreaValue("outputText", diff);
            }
        };
        Controller.prototype.fnAddLines = function () {
            var input = this.view.getAreaValue("inputText"), output = Controller.addLineNumbers(input);
            if (output) {
                this.fnPutChangedInputOnStack();
                this.setInputText(output, true);
                this.fnPutChangedInputOnStack();
            }
        };
        Controller.prototype.fnRemoveLines = function () {
            if (!this.basicFormatter) {
                this.basicFormatter = Controller.createBasicFormatter();
            }
            var input = this.view.getAreaValue("inputText"), output = this.basicFormatter.removeUnusedLines(input);
            if (output.error) {
                this.outputError(output.error);
            }
            else {
                this.fnPutChangedInputOnStack();
                this.setInputText(output.text, true);
                this.fnPutChangedInputOnStack();
            }
        };
        // https://blog.logrocket.com/programmatic-file-downloads-in-the-browser-9a5186298d5c/
        Controller.fnDownloadBlob = function (blob, filename) {
            var url = URL.createObjectURL(blob), a = document.createElement("a"), clickHandler = function () {
                setTimeout(function () {
                    URL.revokeObjectURL(url);
                    a.removeEventListener("click", clickHandler);
                }, 150);
            };
            a.href = url;
            a.download = filename || "download";
            a.addEventListener("click", clickHandler, false);
            a.click();
            return a;
        };
        Controller.prototype.fnDownloadNewFile = function (data, fileName) {
            var type = "octet/stream", buffer = new ArrayBuffer(data.length), data8 = new Uint8Array(buffer);
            for (var i = 0; i < data.length; i += 1) {
                data8[i] = data.charCodeAt(i);
            }
            if (typeof Blob === "undefined") {
                Utils_1.Utils.console.warn("fnDownloadNewFile: Blob undefined");
                return;
            }
            var blob = new Blob([data8.buffer], {
                type: type
            });
            if (window.navigator && window.navigator.msSaveOrOpenBlob) { // IE11 support
                window.navigator.msSaveOrOpenBlob(blob, fileName);
            }
            else {
                Controller.fnDownloadBlob(blob, fileName);
            }
        };
        Controller.prototype.fnDownload = function () {
            var input = this.view.getAreaValue("inputText"), tokens = this.encodeTokenizedBasic(input);
            if (tokens !== "") {
                var header = FileHandler.createMinimalAmsdosHeader("T", 0x170, tokens.length), headerString = DiskImage_1.DiskImage.combineAmsdosHeader(header), data = headerString + tokens;
                this.fnDownloadNewFile(data, "file.bas");
            }
        };
        Controller.prototype.selectJsError = function (script, e) {
            var lineNumber = e.lineNumber, // only on FireFox
            columnNumber = e.columnNumber;
            if (lineNumber || columnNumber) { // only available on Firefox
                var errLine = lineNumber - 3; // for some reason line 0 is 3
                var pos = 0, line = 0;
                while (pos < script.length && line < errLine) {
                    pos = script.indexOf("\n", pos) + 1;
                    line += 1;
                }
                pos += columnNumber;
                Utils_1.Utils.console.warn("Info: JS Error occurred at line", lineNumber, "column", columnNumber, "pos", pos);
                this.view.setAreaSelection("outputText", pos, pos + 1);
            }
        };
        Controller.prototype.fnRun = function (paras) {
            var script = this.view.getAreaValue("outputText"), vm = this.vm;
            var line = paras && paras.first || 0;
            line = line || 0;
            if (line === 0) {
                vm.vmResetData(); // start from the beginning => also reset data! (or put it in line 0 in the script)
            }
            if (this.vm.vmGetOutFileObject().open) {
                this.fnFileSave();
            }
            if (!this.fnScript) {
                vm.clear(); // init variables
                try {
                    this.fnScript = new Function("o", script); // eslint-disable-line no-new-func
                }
                catch (e) {
                    Utils_1.Utils.console.error(e);
                    if (e instanceof Error) {
                        this.selectJsError(script, e);
                        e.shortMessage = "JS " + String(e);
                        this.outputError(e, true);
                    }
                    this.fnScript = undefined;
                }
            }
            else {
                vm.clear(); // we do a clear as well here
            }
            vm.vmReset4Run();
            if (this.fnScript) {
                vm.outBuffer = this.view.getAreaValue("resultText");
                vm.vmStop("", 0, true);
                vm.vmGoto(0); // to load DATA lines
                this.vm.vmSetStartLine(line); // clear resets also startline
                this.view.setDisabled("runButton", true);
                this.view.setDisabled("stopButton", false);
                this.view.setDisabled("continueButton", true);
            }
            if (!this.inputSet) {
                this.inputSet = true;
                var input = this.model.getProperty("input");
                if (input !== "") {
                    this.view.setAreaValue("inp2Text", input);
                    var that_1 = this, timeout = 1;
                    setTimeout(function () {
                        that_1.startEnter();
                    }, timeout);
                }
            }
            if (Utils_1.Utils.debug > 1) {
                Utils_1.Utils.console.debug("End of fnRun");
            }
        };
        Controller.prototype.fnParseRun = function () {
            var output = this.fnParse();
            if (!output.error) {
                this.fnRun();
            }
        };
        Controller.prototype.fnRunPart1 = function (fnScript) {
            try {
                fnScript(this.vm);
            }
            catch (e) {
                if (e instanceof Error) {
                    if (e.name === "CpcVm" || e.name === "Variables") { //TTT
                        var customError = e;
                        if (customError.errCode !== undefined) {
                            customError = this.vm.vmComposeError(customError, customError.errCode, customError.value);
                        }
                        if (!customError.hidden) {
                            Utils_1.Utils.console.warn(customError);
                            this.outputError(customError, !customError.pos);
                        }
                        else {
                            Utils_1.Utils.console.log(customError.message);
                        }
                    }
                    else {
                        Utils_1.Utils.console.error(e);
                        this.selectJsError(this.view.getAreaValue("outputText"), e);
                        this.vm.vmComposeError(e, 2, "JS " + String(e)); // generate Syntax Error, set also err and erl and set stop
                        this.outputError(e, true);
                    }
                }
                else {
                    Utils_1.Utils.console.error(e);
                }
            }
        };
        Controller.prototype.fnDirectInput = function () {
            var inputParas = this.vm.vmGetStopObject().paras, stream = inputParas.stream;
            var input = inputParas.input;
            input = input.trim();
            inputParas.input = "";
            if (input !== "") { // direct input
                this.vm.cursor(stream, 0);
                var inputText = this.view.getAreaValue("inputText");
                if ((/^\d+($| )/).test(input)) { // start with number?
                    if (Utils_1.Utils.debug > 0) {
                        Utils_1.Utils.console.debug("fnDirectInput: insert line=" + input);
                    }
                    input = this.mergeScripts(inputText, input);
                    this.setInputText(input, true);
                    this.vm.vmSetStartLine(0);
                    this.vm.vmGoto(0); // to be sure
                    this.view.setDisabled("continueButton", true);
                    this.vm.cursor(stream, 1);
                    this.updateResultText();
                    return false; // continue direct input
                }
                Utils_1.Utils.console.log("fnDirectInput: execute:", input);
                var codeGeneratorJs = this.codeGeneratorJs;
                var output = void 0, outputString = void 0;
                if (inputText && ((/^\d+($| )/).test(inputText) || this.model.getProperty("implicitLines"))) { // do we have a program starting with a line number?
                    var separator = inputText.endsWith("\n") ? "" : "\n";
                    output = codeGeneratorJs.generate(inputText + separator + input, this.variables, true); // compile both; allow direct command
                    if (output.error) {
                        var error = output.error;
                        if (error.pos < inputText.length + 1) { // error not in direct?
                            error.message = "[prg] " + error.message;
                            output = undefined;
                        }
                    }
                }
                if (!output) {
                    output = codeGeneratorJs.generate(input, this.variables, true); // compile direct input only
                }
                if (output.error) {
                    outputString = this.outputError(output.error, true);
                }
                else {
                    outputString = output.text;
                }
                if (outputString && outputString.length > 0) {
                    outputString += "\n";
                }
                this.view.setAreaValue("outputText", outputString);
                if (!output.error) {
                    this.vm.vmSetStartLine(this.vm.line); // fast hack
                    this.vm.vmGoto("direct");
                    try {
                        var fnScript = new Function("o", outputString); // eslint-disable-line no-new-func
                        this.fnScript = fnScript;
                        this.vm.vmSetSourceMap(codeGeneratorJs.getSourceMap());
                    }
                    catch (e) {
                        Utils_1.Utils.console.error(e);
                        if (e instanceof Error) {
                            this.outputError(e, true);
                        }
                    }
                }
                if (!output.error) {
                    this.updateResultText();
                    return true;
                }
                var msg = inputParas.message;
                this.vm.print(stream, msg);
                this.vm.cursor(stream, 1);
            }
            this.updateResultText();
            return false;
        };
        Controller.prototype.startWithDirectInput = function () {
            var vm = this.vm, stream = 0, msg = "Ready\r\n";
            this.vm.tagoff(stream);
            this.vm.vmResetControlBuffer();
            if (this.vm.pos(stream) > 1) {
                this.vm.print(stream, "\r\n");
            }
            this.vm.print(stream, msg);
            this.vm.cursor(stream, 1, 1);
            vm.vmStop("direct", 0, true, {
                command: "direct",
                stream: stream,
                message: msg,
                // noCRLF: true,
                fnInputCallback: this.fnDirectInputHandler,
                input: "",
                line: this.vm.line
            });
            this.fnWaitInput();
        };
        Controller.prototype.updateResultText = function () {
            this.view.setAreaValue("resultText", this.vm.outBuffer);
            this.view.setAreaScrollTop("resultText"); // scroll to bottom
        };
        Controller.prototype.exitLoop = function () {
            var stop = this.vm.vmGetStopObject(), reason = stop.reason;
            this.updateResultText();
            this.view.setDisabled("runButton", reason === "reset");
            this.view.setDisabled("stopButton", reason !== "fileLoad" && reason !== "fileSave");
            this.view.setDisabled("continueButton", reason === "end" || reason === "fileLoad" || reason === "fileSave" || reason === "parse" || reason === "renumLines" || reason === "reset");
            this.setVarSelectOptions("varSelect", this.variables);
            this.commonEventHandler.onVarSelectChange();
            if (reason === "stop" || reason === "end" || reason === "error" || reason === "parse" || reason === "parseRun") {
                this.startWithDirectInput();
            }
        };
        Controller.prototype.fnWaitFrame = function () {
            this.vm.vmStop("", 0, true);
            this.nextLoopTimeOut = this.vm.vmGetTimeUntilFrame(); // wait until next frame
        };
        Controller.prototype.fnOnError = function () {
            this.vm.vmStop("", 0, true); // continue
        };
        Controller.fnDummy = function () {
            // empty
        };
        Controller.prototype.fnTimer = function () {
            this.vm.vmStop("", 0, true); // continue
        };
        Controller.prototype.fnRunLoop = function () {
            var stop = this.vm.vmGetStopObject();
            this.nextLoopTimeOut = 0;
            if (!stop.reason && this.fnScript) {
                this.fnRunPart1(this.fnScript); // could change reason
            }
            if (stop.reason in this.handlers) {
                this.handlers[stop.reason].call(this, stop.paras);
            }
            else {
                Utils_1.Utils.console.warn("runLoop: Unknown run mode:", stop.reason);
                this.vm.vmStop("error", 50);
            }
            if (stop.reason && stop.reason !== "waitSound" && stop.reason !== "waitKey" && stop.reason !== "waitInput") {
                this.timeoutHandlerActive = false; // not running any more
                this.exitLoop();
            }
            else {
                setTimeout(this.fnRunLoopHandler, this.nextLoopTimeOut);
            }
        };
        Controller.prototype.startMainLoop = function () {
            if (!this.timeoutHandlerActive) {
                this.timeoutHandlerActive = true;
                this.fnRunLoop();
            }
        };
        Controller.prototype.setStopObject = function (stop) {
            Object.assign(this.savedStop, stop);
        };
        Controller.prototype.getStopObject = function () {
            return this.savedStop;
        };
        Controller.prototype.startParse = function () {
            this.removeKeyBoardHandler();
            this.vm.vmStop("parse", 95);
            this.startMainLoop();
        };
        Controller.prototype.startRenum = function () {
            var stream = 0;
            this.vm.vmStop("renumLines", 85, false, {
                command: "renum",
                stream: 0,
                newLine: Number(this.view.getInputValue("renumNewInput")),
                oldLine: Number(this.view.getInputValue("renumStartInput")),
                step: Number(this.view.getInputValue("renumStepInput")),
                keep: Number(this.view.getInputValue("renumKeepInput")),
                line: this.vm.line
            });
            if (this.vm.pos(stream) > 1) {
                this.vm.print(stream, "\r\n");
            }
            this.vm.print(stream, "renum\r\n");
            this.startMainLoop();
        };
        Controller.prototype.startRun = function () {
            this.setStopObject(this.noStop);
            this.removeKeyBoardHandler();
            this.vm.vmStop("run", 95);
            this.startMainLoop();
        };
        Controller.prototype.startParseRun = function () {
            this.setStopObject(this.noStop);
            this.removeKeyBoardHandler();
            this.vm.vmStop("parseRun", 95);
            this.startMainLoop();
        };
        Controller.prototype.startBreak = function () {
            var vm = this.vm, stop = vm.vmGetStopObject();
            this.setStopObject(stop);
            this.removeKeyBoardHandler();
            this.vm.vmStop("break", 80);
            this.startMainLoop();
        };
        Controller.prototype.startContinue = function () {
            var vm = this.vm, stop = vm.vmGetStopObject(), savedStop = this.getStopObject();
            this.view.setDisabled("runButton", true);
            this.view.setDisabled("stopButton", false);
            this.view.setDisabled("continueButton", true);
            if (stop.reason === "break" || stop.reason === "escape" || stop.reason === "stop" || stop.reason === "direct") {
                if (savedStop.paras && !savedStop.paras.fnInputCallback) { // no keyboard callback? make sure no handler is set (especially for direct->continue)
                    this.removeKeyBoardHandler();
                }
                if (stop.reason === "direct" || stop.reason === "escape") {
                    this.vm.cursor(stop.paras.stream, 0); // switch it off (for continue button)
                }
                Object.assign(stop, savedStop); // fast hack
                this.setStopObject(this.noStop);
            }
            this.startMainLoop();
        };
        Controller.prototype.startReset = function () {
            this.setStopObject(this.noStop);
            this.removeKeyBoardHandler();
            this.vm.vmStop("reset", 99);
            this.startMainLoop();
        };
        Controller.prototype.startScreenshot = function () {
            var canvas = this.canvas.getCanvasElement();
            if (canvas.toDataURL) {
                return canvas.toDataURL("image/png").replace("image/png", "image/octet-stream"); // here is the most important part because if you do not replace you will get a DOM 18 exception.
            }
            Utils_1.Utils.console.warn("Screenshot not available");
            return "";
        };
        Controller.prototype.fnPutKeyInBuffer = function (key) {
            this.keyboard.putKeyInBuffer(key);
            var keyDownHandler = this.keyboard.getKeyDownHandler();
            if (keyDownHandler) {
                keyDownHandler();
            }
        };
        Controller.prototype.startEnter = function () {
            var input = this.view.getAreaValue("inp2Text");
            input = input.replace(/\n/g, "\r"); // LF => CR
            if (!input.endsWith("\r")) {
                input += "\r";
            }
            for (var i = 0; i < input.length; i += 1) {
                this.fnPutKeyInBuffer(input.charAt(i));
            }
            this.view.setAreaValue("inp2Text", "");
        };
        Controller.generateFunction = function (par, functionString) {
            if (functionString.startsWith("function anonymous(")) { // already a modified function (inside an anonymous function)?
                var firstIndex = functionString.indexOf("{"), lastIndex = functionString.lastIndexOf("}");
                if (firstIndex >= 0 && lastIndex >= 0) {
                    functionString = functionString.substring(firstIndex + 1, lastIndex - 1); // remove anonymous function
                }
                functionString = functionString.trim();
            }
            else {
                functionString = "var o=cpcBasic.controller.vm, v=o.vmGetAllVariables(); v." + par + " = " + functionString;
            }
            var match = (/function \(([^)]*)/).exec(functionString), args = match ? match[1].split(",") : [], fnFunction = new Function(args[0], args[1], args[2], args[3], args[4], functionString); // eslint-disable-line no-new-func
            // we support at most 5 arguments
            return fnFunction;
        };
        Controller.prototype.changeVariable = function () {
            var par = this.view.getSelectValue("varSelect"), valueString = this.view.getSelectValue("varText"), variables = this.variables;
            var value = variables.getVariable(par);
            if (typeof value === "function") {
                value = Controller.generateFunction(par, valueString);
                variables.setVariable(par, value);
            }
            else {
                var varType = this.variables.determineStaticVarType(par), type = this.vm.vmDetermineVarType(varType); // do we know dynamic type?
                if (type !== "$") { // not string? => convert to number
                    value = parseFloat(valueString);
                }
                else {
                    value = valueString;
                }
                try {
                    var value2 = this.vm.vmAssign(varType, value);
                    variables.setVariable(par, value2);
                    Utils_1.Utils.console.log("Variable", par, "changed:", variables.getVariable(par), "=>", value);
                }
                catch (e) {
                    Utils_1.Utils.console.warn(e);
                }
            }
            this.setVarSelectOptions("varSelect", variables);
            this.commonEventHandler.onVarSelectChange(); // title change?
        };
        Controller.prototype.setSoundActive = function () {
            var sound = this.sound, soundButton = View_1.View.getElementById1("soundButton"), active = this.model.getProperty("sound");
            var text;
            if (active) {
                try {
                    sound.soundOn();
                    text = (sound.isActivatedByUser()) ? "Sound is on" : "Sound on (waiting)";
                }
                catch (e) {
                    Utils_1.Utils.console.warn("soundOn:", e);
                    text = "Sound unavailable";
                }
            }
            else {
                sound.soundOff();
                text = "Sound is off";
                var stop_1 = this.vm && this.vm.vmGetStopObject();
                if (stop_1 && stop_1.reason === "waitSound") {
                    this.vm.vmStop("", 0, true); // do not wait
                }
            }
            soundButton.innerText = text;
        };
        Controller.prototype.fnEndOfImport = function (imported) {
            var stream = 0, vm = this.vm;
            for (var i = 0; i < imported.length; i += 1) {
                vm.print(stream, imported[i], " ");
            }
            vm.print(stream, "\r\n", imported.length + " file" + (imported.length !== 1 ? "s" : "") + " imported.\r\n");
            this.updateResultText();
        };
        Controller.fnHandleDragOver = function (evt) {
            evt.stopPropagation();
            evt.preventDefault();
            if (evt.dataTransfer !== null) {
                evt.dataTransfer.dropEffect = "copy"; // explicitly show this is a copy
            }
        };
        Controller.prototype.adaptFilename = function (name, err) {
            return this.vm.vmAdaptFilename(name, err);
        };
        Controller.prototype.initDropZone = function () {
            if (!this.fileHandler) {
                this.fileHandler = new FileHandler({
                    adaptFilename: this.adaptFilename.bind(this),
                    updateStorageDatabase: this.updateStorageDatabase.bind(this),
                    outputError: this.outputError.bind(this)
                });
            }
            if (!this.fileSelect) {
                this.fileSelect = new FileSelect({
                    fnEndOfImport: this.fnEndOfImport.bind(this),
                    outputError: this.outputError.bind(this),
                    fnLoad2: this.fileHandler.fnLoad2.bind(this.fileHandler)
                });
            }
            var dropZone = View_1.View.getElementById1("dropZone");
            dropZone.addEventListener("dragover", Controller.fnHandleDragOver.bind(this), false);
            this.fileSelect.addFileSelectHandler(dropZone, "drop");
            var canvasElement = this.canvas.getCanvasElement();
            canvasElement.addEventListener("dragover", Controller.fnHandleDragOver.bind(this), false);
            this.fileSelect.addFileSelectHandler(canvasElement, "drop");
            var fileInput = View_1.View.getElementById1("fileInput");
            this.fileSelect.addFileSelectHandler(fileInput, "change");
        };
        Controller.prototype.fnUpdateUndoRedoButtons = function () {
            this.view.setDisabled("undoButton", !this.inputStack.canUndoKeepOne());
            this.view.setDisabled("redoButton", !this.inputStack.canRedo());
        };
        Controller.prototype.fnInitUndoRedoButtons = function () {
            this.inputStack.reset();
            this.fnUpdateUndoRedoButtons();
        };
        Controller.prototype.fnPutChangedInputOnStack = function () {
            var input = this.view.getAreaValue("inputText"), stackInput = this.inputStack.getInput();
            if (stackInput !== input) {
                this.inputStack.save(input);
                this.fnUpdateUndoRedoButtons();
            }
        };
        Controller.prototype.startUpdateCanvas = function () {
            this.canvas.startUpdateCanvas();
        };
        Controller.prototype.startUpdateTextCanvas = function () {
            this.textCanvas.startUpdateCanvas();
        };
        Controller.prototype.stopUpdateCanvas = function () {
            this.canvas.stopUpdateCanvas();
        };
        Controller.prototype.stopUpdateTextCanvas = function () {
            this.textCanvas.stopUpdateCanvas();
        };
        Controller.prototype.virtualKeyboardCreate = function () {
            if (!this.virtualKeyboard) {
                this.virtualKeyboard = new VirtualKeyboard_1.VirtualKeyboard({
                    fnPressCpcKey: this.keyboard.fnPressCpcKey.bind(this.keyboard),
                    fnReleaseCpcKey: this.keyboard.fnReleaseCpcKey.bind(this.keyboard)
                });
            }
        };
        Controller.prototype.getVariable = function (par) {
            return this.variables.getVariable(par);
        };
        Controller.prototype.undoStackElement = function () {
            return this.inputStack.undo();
        };
        Controller.prototype.redoStackElement = function () {
            return this.inputStack.redo();
        };
        Controller.prototype.createFnDatabaseLoaded = function (url) {
            var _this = this;
            return function (_sFullUrl, key) {
                var selectedName = _this.model.getProperty("database");
                if (selectedName === key) {
                    _this.model.getDatabase().loaded = true;
                }
                else { // should not occur
                    Utils_1.Utils.console.warn("databaseLoaded: name changed: " + key + " => " + selectedName);
                    _this.model.setProperty("database", key);
                    var database = _this.model.getDatabase();
                    if (database) {
                        database.loaded = true;
                    }
                    _this.model.setProperty("database", selectedName);
                }
                Utils_1.Utils.console.log("fnDatabaseLoaded: database loaded: " + key + ": " + url);
                _this.setExampleSelectOptions();
                _this.onExampleSelectChange();
            };
        };
        Controller.prototype.createFnDatabaseError = function (url) {
            var _this = this;
            return function (_sFullUrl, key) {
                Utils_1.Utils.console.error("fnDatabaseError: database error: " + key + ": " + url);
                _this.setExampleSelectOptions();
                _this.onExampleSelectChange();
                _this.setInputText("");
                _this.view.setAreaValue("resultText", "Cannot load database: " + key);
            };
        };
        Controller.prototype.onDatabaseSelectChange = function () {
            var url;
            var databaseName = this.view.getSelectValue("databaseSelect");
            this.model.setProperty("database", databaseName);
            this.view.setSelectTitleFromSelectedOption("databaseSelect");
            var database = this.model.getDatabase();
            if (!database) {
                Utils_1.Utils.console.error("onDatabaseSelectChange: database not available:", databaseName);
                return;
            }
            if (database.text === "storage") { // sepcial handling: browser localStorage
                this.updateStorageDatabase("set", ""); // set all
                database.loaded = true;
            }
            if (database.loaded) {
                this.setExampleSelectOptions();
                this.onExampleSelectChange();
            }
            else {
                this.setInputText("#loading database " + databaseName + "...");
                var exampleIndex = this.model.getProperty("exampleIndex");
                url = database.src + "/" + exampleIndex;
                Utils_1.Utils.loadScript(url, this.createFnDatabaseLoaded(url), this.createFnDatabaseError(url), databaseName);
            }
        };
        Controller.prototype.onExampleSelectChange = function () {
            var vm = this.vm, inFile = vm.vmGetInFileObject(), dataBaseName = this.model.getProperty("database");
            vm.closein();
            inFile.open = true;
            var exampleName = this.view.getSelectValue("exampleSelect");
            var exampleEntry = this.model.getExample(exampleName);
            inFile.command = "run";
            if (exampleEntry && exampleEntry.meta) { // TTT TODO: this is just a workaround, meta is in input now; should change command after loading!
                var type = exampleEntry.meta.charAt(0);
                if (type === "B" || type === "D" || type === "G") { // binary, data only, Gena Assembler?
                    inFile.command = "load";
                }
            }
            if (dataBaseName !== "storage") {
                exampleName = "/" + exampleName; // load absolute
            }
            else {
                this.model.setProperty("example", exampleName);
            }
            inFile.name = exampleName;
            inFile.start = undefined;
            inFile.fnFileCallback = vm.fnLoadHandler;
            vm.vmStop("fileLoad", 90);
            this.startMainLoop();
        };
        // currently not used. Can be called manually: cpcBasic.controller.exportAsBase64(file);
        Controller.exportAsBase64 = function (storageName) {
            var storage = Utils_1.Utils.localStorage;
            var data = storage.getItem(storageName), out = "";
            if (data !== null) {
                var index = data.indexOf(","); // metadata separator
                if (index >= 0) {
                    var meta = data.substring(0, index);
                    data = data.substring(index + 1);
                    data = Utils_1.Utils.btoa(data);
                    out = meta + ";base64," + data;
                }
                else { // hmm, no meta info
                    data = Utils_1.Utils.btoa(data);
                    out = "base64," + data;
                }
            }
            Utils_1.Utils.console.log(out);
            return out;
        };
        Controller.prototype.onCpcCanvasClick = function (event) {
            if (this.model.getProperty("showSettings")) {
                this.model.setProperty("showSettings", false);
                this.view.setHidden("settingsArea", !this.model.getProperty("showSettings"), "flex");
            }
            if (this.model.getProperty("showConvert")) {
                this.model.setProperty("showConvert", false);
                this.view.setHidden("convertArea", !this.model.getProperty("showConvert"), "flex");
            }
            //this.view.setHidden("settingsArea", true, "flex");
            //this.view.setHidden("convertArea", true, "flex");
            this.canvas.onCpcCanvasClick(event);
            this.textCanvas.onWindowClick(event);
            this.keyboard.setActive(true);
        };
        Controller.prototype.onWindowClick = function (event) {
            this.canvas.onWindowClick(event);
            this.textCanvas.onWindowClick(event);
            this.keyboard.setActive(false);
        };
        Controller.prototype.onTextTextClick = function (event) {
            this.textCanvas.onTextCanvasClick(event);
            this.canvas.onWindowClick(event);
            this.keyboard.setActive(true);
        };
        Controller.prototype.fnArrayBounds = function () {
            var arrayBounds = this.model.getProperty("arrayBounds");
            this.variables.setOptions({
                arrayBounds: arrayBounds
            });
            this.variables.removeAllVariables(); //TTT
        };
        Controller.prototype.fnImplicitLines = function () {
            var implicitLines = this.model.getProperty("implicitLines");
            this.codeGeneratorJs.setOptions({
                implicitLines: implicitLines
            });
            if (this.codeGeneratorToken) {
                this.codeGeneratorToken.setOptions({
                    implicitLines: implicitLines
                });
            }
        };
        Controller.prototype.fnTrace = function () {
            var trace = this.model.getProperty("trace");
            this.codeGeneratorJs.setOptions({
                trace: trace
            });
        };
        Controller.metaIdent = "CPCBasic";
        Controller.defaultExtensions = [
            "",
            "bas",
            "bin"
        ];
        return Controller;
    }());
    exports.Controller = Controller;
});
//# sourceMappingURL=Controller.js.map