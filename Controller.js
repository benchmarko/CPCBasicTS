"use strict";
// Controller.ts - Controller
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//
Object.defineProperty(exports, "__esModule", { value: true });
exports.Controller = void 0;
var Utils_1 = require("./Utils");
var BasicFormatter_1 = require("./BasicFormatter");
var BasicLexer_1 = require("./BasicLexer");
var BasicParser_1 = require("./BasicParser");
var BasicTokenizer_1 = require("./BasicTokenizer");
var Canvas_1 = require("./Canvas");
var CodeGeneratorBasic_1 = require("./CodeGeneratorBasic");
var CodeGeneratorJs_1 = require("./CodeGeneratorJs");
var CommonEventHandler_1 = require("./CommonEventHandler");
var cpcCharset_1 = require("./cpcCharset");
var CpcVm_1 = require("./CpcVm");
var CpcVmRsx_1 = require("./CpcVmRsx");
var Diff_1 = require("./Diff");
var DiskImage_1 = require("./DiskImage");
var InputStack_1 = require("./InputStack");
var Keyboard_1 = require("./Keyboard");
var VirtualKeyboard_1 = require("./VirtualKeyboard");
var Sound_1 = require("./Sound");
var Variables_1 = require("./Variables");
var View_1 = require("./View");
var ZipFile_1 = require("./ZipFile");
var Controller = /** @class */ (function () {
    function Controller(oModel, oView) {
        this.fnScript = undefined; // eslint-disable-line @typescript-eslint/ban-types
        this.bTimeoutHandlerActive = false;
        this.iNextLoopTimeOut = 0; // next timeout for the main loop
        this.bInputSet = false;
        this.oVariables = new Variables_1.Variables();
        this.inputStack = new InputStack_1.InputStack();
        this.oSound = new Sound_1.Sound();
        /* eslint-disable no-invalid-this */
        this.mHandlers = {
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
        this.model = oModel;
        this.view = oView;
        this.commonEventHandler = new CommonEventHandler_1.CommonEventHandler(oModel, oView, this);
        this.view.attachEventHandler("click", this.commonEventHandler);
        this.view.attachEventHandler("change", this.commonEventHandler);
        oView.setHidden("consoleBox", !oModel.getProperty("showConsole"));
        oView.setHidden("inputArea", !oModel.getProperty("showInput"));
        oView.setHidden("inp2Area", !oModel.getProperty("showInp2"));
        oView.setHidden("outputArea", !oModel.getProperty("showOutput"));
        oView.setHidden("resultArea", !oModel.getProperty("showResult"));
        oView.setHidden("textArea", !oModel.getProperty("showText"));
        oView.setHidden("variableArea", !oModel.getProperty("showVariable"));
        oView.setHidden("kbdArea", !oModel.getProperty("showKbd"), "flex");
        oView.setHidden("kbdLayoutArea", !oModel.getProperty("showKbdLayout"));
        oView.setHidden("cpcArea", false); // make sure canvas is not hidden (allows to get width, height)
        this.oCanvas = new Canvas_1.Canvas({
            aCharset: cpcCharset_1.cpcCharset,
            onClickKey: this.fnPutKeyInBufferHandler
        });
        oView.setHidden("cpcArea", !oModel.getProperty("showCpc"));
        var sKbdLayout = oModel.getProperty("kbdLayout");
        oView.setSelectValue("kbdLayoutSelect", sKbdLayout);
        this.commonEventHandler.onKbdLayoutSelectChange();
        this.oKeyboard = new Keyboard_1.Keyboard({
            fnOnEscapeHandler: this.fnOnEscapeHandler
        });
        if (this.model.getProperty("showKbd")) { // maybe we need to draw virtual keyboard
            this.virtualKeyboardCreate();
        }
        this.commonEventHandler.fnSetUserAction(this.onUserAction.bind(this)); // check first user action, also if sound is not yet on
        var sExample = oModel.getProperty("example");
        oView.setSelectValue("exampleSelect", sExample);
        this.oVm = new CpcVm_1.CpcVm({
            canvas: this.oCanvas,
            keyboard: this.oKeyboard,
            sound: this.oSound,
            variables: this.oVariables,
            tron: oModel.getProperty("tron")
        });
        this.oVm.vmReset();
        this.oRsx = new CpcVmRsx_1.CpcVmRsx(this.oVm);
        this.oVm.vmSetRsxClass(this.oRsx);
        this.oNoStop = Object.assign({}, this.oVm.vmGetStopObject());
        this.oSavedStop = {
            sReason: "",
            iPriority: 0,
            oParas: {
                sCommand: "",
                iStream: 0,
                iLine: 0,
                iFirst: 0,
                iLast: 0 // unused
            }
        }; // backup of stop object
        this.setStopObject(this.oNoStop);
        this.oCodeGeneratorJs = new CodeGeneratorJs_1.CodeGeneratorJs({
            lexer: new BasicLexer_1.BasicLexer(),
            parser: new BasicParser_1.BasicParser(),
            tron: this.model.getProperty("tron"),
            rsx: this.oRsx // just to check the names
        });
        this.initDatabases();
        if (oModel.getProperty("sound")) { // activate sound needs user action
            this.setSoundActive(); // activate in waiting state
        }
        if (oModel.getProperty("showCpc")) {
            this.oCanvas.startUpdateCanvas();
        }
        this.initDropZone();
    }
    Controller.prototype.initDatabases = function () {
        var oModel = this.model, oDatabases = {}, aDatabaseDirs = oModel.getProperty("databaseDirs").split(",");
        for (var i = 0; i < aDatabaseDirs.length; i += 1) {
            var sDatabaseDir = aDatabaseDirs[i], aParts = sDatabaseDir.split("/"), sName = aParts[aParts.length - 1];
            oDatabases[sName] = {
                text: sName,
                title: sDatabaseDir,
                src: sDatabaseDir
            };
        }
        this.model.addDatabases(oDatabases);
        this.setDatabaseSelectOptions();
        this.onDatabaseSelectChange();
    };
    Controller.prototype.onUserAction = function ( /* event, sId */) {
        this.commonEventHandler.fnSetUserAction(undefined); // deactivate user action
        this.oSound.setActivatedByUser();
        this.setSoundActive();
    };
    // Also called from index file 0index.js
    Controller.prototype.addIndex = function (sDir, sInput) {
        sInput = sInput.trim();
        var aIndex = JSON.parse(sInput);
        for (var i = 0; i < aIndex.length; i += 1) {
            aIndex[i].dir = sDir;
            this.model.setExample(aIndex[i]);
        }
    };
    // Also called from example files xxxxx.js
    Controller.prototype.addItem = function (sKey, sInput) {
        if (!sKey) { // maybe ""
            sKey = (document.currentScript && document.currentScript.getAttribute("data-key")) || this.model.getProperty("example");
            // on IE we can just get the current example
        }
        sInput = sInput.replace(/^\n/, "").replace(/\n$/, ""); // remove preceding and trailing newlines
        // beware of data files ending with newlines! (do not use trimEnd)
        var oExample = this.model.getExample(sKey);
        oExample.key = sKey; // maybe changed
        oExample.script = sInput;
        oExample.loaded = true;
        Utils_1.Utils.console.log("addItem:", sKey);
        return sKey;
    };
    Controller.prototype.setDatabaseSelectOptions = function () {
        var sSelect = "databaseSelect", aItems = [], oDatabases = this.model.getAllDatabases(), sDatabase = this.model.getProperty("database");
        for (var sValue in oDatabases) {
            if (oDatabases.hasOwnProperty(sValue)) {
                var oDb = oDatabases[sValue], oItem = {
                    value: sValue,
                    text: oDb.text,
                    title: oDb.title,
                    selected: sValue === sDatabase
                };
                aItems.push(oItem);
            }
        }
        this.view.setSelectOptions(sSelect, aItems);
    };
    Controller.prototype.setExampleSelectOptions = function () {
        var iMaxTitleLength = 160, iMaxTextLength = 60, // (32 visible?)
        sSelect = "exampleSelect", aItems = [], sExample = this.model.getProperty("example"), oAllExamples = this.model.getAllExamples();
        var bExampleSelected = false;
        for (var sKey in oAllExamples) {
            if (oAllExamples.hasOwnProperty(sKey)) {
                var oExample = oAllExamples[sKey];
                if (oExample.meta !== "D") { // skip data files
                    var sTitle = (oExample.key + ": " + oExample.title).substr(0, iMaxTitleLength), oItem = {
                        value: oExample.key,
                        title: sTitle,
                        text: sTitle.substr(0, iMaxTextLength),
                        selected: oExample.key === sExample
                    };
                    if (oItem.selected) {
                        bExampleSelected = true;
                    }
                    aItems.push(oItem);
                }
            }
        }
        if (!bExampleSelected && aItems.length) {
            aItems[0].selected = true; // if example is not found, select first element
        }
        this.view.setSelectOptions(sSelect, aItems);
    };
    Controller.prototype.setVarSelectOptions = function (sSelect, oVariables) {
        var iMaxVarLength = 35, aVarNames = oVariables.getAllVariableNames(), aItems = [], fnSortByStringProperties = function (a, b) {
            var x = a.value, y = b.value;
            if (x < y) {
                return -1;
            }
            else if (x > y) {
                return 1;
            }
            return 0;
        };
        for (var i = 0; i < aVarNames.length; i += 1) {
            var sKey = aVarNames[i], sValue = oVariables.getVariable(sKey), sTitle = sKey + "=" + sValue;
            var sStrippedTitle = sTitle.substr(0, iMaxVarLength); // limit length
            if (sTitle !== sStrippedTitle) {
                sStrippedTitle += " ...";
            }
            var oItem = {
                value: sKey,
                text: sStrippedTitle,
                title: sStrippedTitle,
                selected: false
            };
            oItem.text = oItem.title;
            aItems.push(oItem);
        }
        aItems.sort(fnSortByStringProperties);
        this.view.setSelectOptions(sSelect, aItems);
    };
    Controller.prototype.updateStorageDatabase = function (sAction, sKey) {
        var sDatabase = this.model.getProperty("database"), oStorage = Utils_1.Utils.localStorage;
        if (sDatabase !== "storage") {
            this.model.setProperty("database", "storage"); // switch to storage database
        }
        var aDir;
        if (!sKey) { // no sKey => get all
            aDir = Controller.fnGetStorageDirectoryEntries();
        }
        else {
            aDir = [sKey];
        }
        for (var i = 0; i < aDir.length; i += 1) {
            sKey = aDir[i];
            if (sAction === "remove") {
                this.model.removeExample(sKey);
            }
            else if (sAction === "set") {
                var oExample = this.model.getExample(sKey);
                if (!oExample) {
                    var sData = oStorage.getItem(sKey) || "", oData = Controller.splitMeta(sData);
                    oExample = {
                        key: sKey,
                        title: "",
                        meta: oData.oMeta.sType // currently we take only the type
                    };
                    this.model.setExample(oExample);
                }
            }
            else {
                Utils_1.Utils.console.error("updateStorageDatabase: unknown action", sAction);
            }
        }
        if (sDatabase === "storage") {
            this.setExampleSelectOptions();
        }
        else {
            this.model.setProperty("database", sDatabase); // restore database
        }
    };
    Controller.prototype.setInputText = function (sInput, bKeepStack) {
        this.view.setAreaValue("inputText", sInput);
        if (!bKeepStack) {
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
        var iStream = 0, sKey = this.oKeyboard.getKeyFromBuffer();
        if (sKey !== "") {
            this.oVm.cursor(iStream, 0);
            this.oKeyboard.setKeyDownHandler(undefined);
            this.startContinue();
        }
    };
    Controller.prototype.fnOnEscape = function () {
        var oStop = this.oVm.vmGetStopObject(), iStream = 0; //oParas.iStream;
        if (this.oVm.vmOnBreakContSet()) {
            // ignore break
        }
        else if (oStop.sReason === "direct" || this.oVm.vmOnBreakHandlerActive()) {
            /*
            if (!oStop.oParas) {
                oStop.oParas = {};
            }
            */
            oStop.oParas.sInput = "";
            var sMsg = "*Break*\r\n";
            this.oVm.print(iStream, sMsg);
        }
        else if (oStop.sReason !== "escape") { // first escape?
            this.oVm.cursor(iStream, 1);
            this.oKeyboard.clearInput();
            this.oKeyboard.setKeyDownHandler(this.fnWaitForContinue.bind(this));
            this.setStopObject(oStop);
            this.oVm.vmStop("escape", 85, false, {
                sCommand: "escape",
                iStream: iStream,
                iFirst: 0,
                iLast: 0,
                iLine: this.oVm.iLine
            });
        }
        else { // second escape
            this.oKeyboard.setKeyDownHandler(undefined);
            this.oVm.cursor(iStream, 0);
            var oSavedStop = this.getStopObject();
            if (oSavedStop.sReason === "waitInput") { // sepcial handling: set line to repeat input
                this.oVm.vmGotoLine(oSavedStop.oParas.iLine);
            }
            if (!this.oVm.vmEscape()) {
                this.oVm.vmStop("", 0, true); // continue program, in break handler?
                this.setStopObject(this.oNoStop);
            }
            else {
                this.oVm.vmStop("stop", 0, true); // stop
                var sMsg = "Break in " + this.oVm.iLine + "\r\n";
                this.oVm.print(iStream, sMsg);
            }
        }
        this.startMainLoop();
    };
    Controller.prototype.fnWaitSound = function () {
        var oStop = this.oVm.vmGetStopObject();
        this.oVm.vmLoopCondition(); // update iNextFrameTime, timers, inks; schedule sound: free queue
        if (this.oSound.isActivatedByUser()) { // only if activated
            var aSoundData = this.oVm.vmGetSoundData();
            while (aSoundData.length && this.oSound.testCanQueue(aSoundData[0].iState)) {
                this.oSound.sound(aSoundData.shift());
            }
            if (!aSoundData.length) {
                if (oStop.sReason === "waitSound") { // only for this reason
                    this.oVm.vmStop("", 0, true); // no more wait
                }
            }
        }
        this.iNextLoopTimeOut = this.oVm.vmGetTimeUntilFrame(); // wait until next frame
    };
    Controller.prototype.fnWaitKey = function () {
        var sKey = this.oKeyboard.getKeyFromBuffer();
        if (sKey !== "") { // do we have a key from the buffer already?
            Utils_1.Utils.console.log("Wait for key:", sKey);
            this.oVm.vmStop("", 0, true);
            this.oKeyboard.setKeyDownHandler(undefined);
        }
        else {
            this.fnWaitSound(); // sound and blinking events
            this.oKeyboard.setKeyDownHandler(this.fnWaitKeyHandler); // wait until keypress handler (for call &bb18)
        }
        return sKey;
    };
    Controller.prototype.fnWaitInput = function () {
        var oStop = this.oVm.vmGetStopObject(), oInput = oStop.oParas, iStream = oInput.iStream;
        var sInput = oInput.sInput, sKey;
        if (sInput === undefined || iStream === undefined) {
            this.outputError(this.oVm.vmComposeError(Error(), 32, "Programming Error: fnWaitInput"), true);
            return;
        }
        do {
            sKey = this.oKeyboard.getKeyFromBuffer(); // (inkey$ could insert frame if checked too often)
            // chr13 shows as empty string!
            switch (sKey) {
                case "": // no key?
                    break;
                case "\r": // cr (\x0c)
                    break;
                case "\x10": // DLE (clear character under cursor)
                    sKey = "\x07"; // currently ignore (BEL)
                    break;
                case "\x7f": // del
                    if (sInput.length) {
                        sInput = sInput.slice(0, -1);
                        sKey = "\x08\x10"; // use BS and DLE
                    }
                    else {
                        sKey = "\x07"; // ignore BS, use BEL
                    }
                    break;
                case "\xe0": // copy
                    sKey = this.oVm.copychr$(iStream);
                    if (sKey.length) {
                        sInput += sKey;
                        sKey = "\x09"; // TAB
                    }
                    else {
                        sKey = "\x07"; // ignore (BEL)
                    }
                    break;
                case "\xf0": // cursor up
                    if (!sInput.length) {
                        sKey = "\x0b"; // VT
                    }
                    else {
                        sKey = "\x07"; // ignore (BEL)
                    }
                    break;
                case "\xf1": // cursor down
                    if (!sInput.length) {
                        sKey = "\x0a"; // LF
                    }
                    else {
                        sKey = "\x07"; // ignore (BEL)
                    }
                    break;
                case "\xf2": // cursor left
                    if (!sInput.length) {
                        sKey = "\x08"; // BS
                    }
                    else {
                        sKey = "\x07"; // ignore (BEL) TODO
                    }
                    break;
                case "\xf3": // cursor right
                    if (!sInput.length) {
                        sKey = "\x09"; // TAB
                    }
                    else {
                        sKey = "\x07"; // ignore (BEL) TODO
                    }
                    break;
                case "\xf4": // shift+cursor up
                    sKey = ""; // currently ignore
                    break;
                case "\xf5": // shift+cursor down
                    sKey = ""; // currently ignore
                    break;
                case "\xf6": // shift+cursor left
                    sKey = ""; // currently ignore
                    break;
                case "\xf7": // shift+cursor right
                    sKey = ""; // currently ignore
                    break;
                case "\xf8": // ctrl+cursor up
                    sKey = ""; // currently ignore
                    break;
                case "\xf9": // ctrl+cursor down
                    sKey = ""; // currently ignore
                    break;
                case "\xfa": // ctrl+cursor left
                    sKey = ""; // currently ignore
                    break;
                case "\xfb": // ctrl+cursor right
                    sKey = ""; // currently ignore
                    break;
                default:
                    sInput += sKey;
                    if (sKey < "\x20") { // control code
                        sKey = "\x01" + sKey; // print control code (do not execute)
                    }
                    break;
            }
            if (sKey && sKey !== "\r") {
                this.oVm.print(iStream, sKey);
            }
        } while (sKey !== "" && sKey !== "\r"); // get all keys until CR or no more key
        oInput.sInput = sInput;
        var bInputOk = false;
        if (sKey === "\r") {
            Utils_1.Utils.console.log("fnWaitInput:", sInput, "reason", oStop.sReason);
            if (!oInput.sNoCRLF) {
                this.oVm.print(iStream, "\r\n");
            }
            if (oInput.fnInputCallback) {
                bInputOk = oInput.fnInputCallback();
            }
            else {
                bInputOk = true;
            }
            if (bInputOk) {
                this.oKeyboard.setKeyDownHandler(undefined);
                if (oStop.sReason === "waitInput") { // only for this reason
                    this.oVm.vmStop("", 0, true); // no more wait
                }
                else {
                    this.startContinue();
                }
            }
        }
        if (!bInputOk) {
            if (oStop.sReason === "waitInput") { // only for this reason
                this.fnWaitSound(); // sound and blinking events
            }
            this.oKeyboard.setKeyDownHandler(this.fnWaitInputHandler); // make sure it is set
        }
    };
    // merge two scripts with sorted line numbers, lines from script2 overwrite lines from script1
    Controller.mergeScripts = function (sScript1, sScript2) {
        var aLines1 = Utils_1.Utils.stringTrimEnd(sScript1).split("\n"), aLines2 = Utils_1.Utils.stringTrimEnd(sScript2).split("\n");
        var aResult = [], iLine1, iLine2;
        while (aLines1.length && aLines2.length) {
            iLine1 = iLine1 || parseInt(aLines1[0], 10);
            iLine2 = iLine2 || parseInt(aLines2[0], 10);
            if (iLine1 < iLine2) { // use line from script1
                aResult.push(aLines1.shift());
                iLine1 = 0;
            }
            else { // use line from script2
                var sLine2 = aLines2.shift();
                if (String(iLine2) !== sLine2) { // line not empty?
                    aResult.push(sLine2);
                }
                if (iLine1 === iLine2) { // same line numbber in script1 and script2
                    aLines1.shift(); // ignore line from script1 (overwrite it)
                    iLine1 = 0;
                }
                iLine2 = 0;
            }
        }
        aResult = aResult.concat(aLines1, aLines2); // put in remaining lines from one source
        if (aResult.length >= 2) {
            if (aResult[aResult.length - 2] === "" && aResult[aResult.length - 1] === "") {
                aResult.pop(); // remove additional newline
            }
        }
        var sResult = aResult.join("\n");
        return sResult;
    };
    // get line range from a script with sorted line numbers
    Controller.fnGetLinesInRange = function (sScript, iFirstLine, iLastLine) {
        var aLines = sScript ? sScript.split("\n") : [];
        while (aLines.length && parseInt(aLines[0], 10) < iFirstLine) {
            aLines.shift();
        }
        if (aLines.length && aLines[aLines.length - 1] === "") { // trailing empty line?
            aLines.pop(); // remove
        }
        while (aLines.length && parseInt(aLines[aLines.length - 1], 10) > iLastLine) {
            aLines.pop();
        }
        return aLines;
    };
    Controller.fnPrepareMaskRegExp = function (sMask) {
        sMask = sMask.replace(/([.+^$[\]\\(){}|-])/g, "\\$1");
        sMask = sMask.replace(/\?/g, ".");
        sMask = sMask.replace(/\*/g, ".*");
        var oRegExp = new RegExp("^" + sMask + "$");
        return oRegExp;
    };
    Controller.prototype.fnGetExampleDirectoryEntries = function (sMask) {
        var aDir = [], oAllExamples = this.model.getAllExamples();
        var oRegExp;
        if (sMask) {
            oRegExp = Controller.fnPrepareMaskRegExp(sMask);
        }
        for (var sKey in oAllExamples) {
            if (oAllExamples.hasOwnProperty(sKey)) {
                var oExample = oAllExamples[sKey], sKey2 = oExample.key, sMatchKey2 = sKey2 + ((sKey2.indexOf(".") < 0) ? "." : "");
                if (!oRegExp || oRegExp.test(sMatchKey2)) {
                    aDir.push(sKey2);
                }
            }
        }
        return aDir;
    };
    Controller.fnGetStorageDirectoryEntries = function (sMask) {
        var oStorage = Utils_1.Utils.localStorage, aDir = [];
        var oRegExp;
        if (sMask) {
            oRegExp = Controller.fnPrepareMaskRegExp(sMask);
        }
        for (var i = 0; i < oStorage.length; i += 1) {
            var sKey = oStorage.key(i);
            if (sKey !== null && oStorage[sKey].startsWith(this.sMetaIdent)) { // take only cpcBasic files
                if (!oRegExp || oRegExp.test(sKey)) {
                    aDir.push(sKey);
                }
            }
        }
        return aDir;
    };
    Controller.prototype.fnPrintDirectoryEntries = function (iStream, aDir, bSort) {
        // first, format names
        for (var i = 0; i < aDir.length; i += 1) {
            var sKey = aDir[i], aParts = sKey.split(".");
            if (aParts.length === 2) {
                aDir[i] = aParts[0].padEnd(8, " ") + "." + aParts[1].padEnd(3, " ");
            }
        }
        if (bSort) {
            aDir.sort();
        }
        this.oVm.print(iStream, "\r\n");
        for (var i = 0; i < aDir.length; i += 1) {
            var sKey = aDir[i] + "  ";
            this.oVm.print(iStream, sKey);
        }
        this.oVm.print(iStream, "\r\n");
    };
    Controller.prototype.fnFileCat = function (oParas) {
        var iStream = oParas.iStream, aDir = Controller.fnGetStorageDirectoryEntries();
        this.fnPrintDirectoryEntries(iStream, aDir, true);
        // currently only from localstorage
        this.oVm.vmStop("", 0, true);
    };
    Controller.prototype.fnFileDir = function (oParas) {
        var iStream = oParas.iStream, sExample = this.model.getProperty("example"), // if we have a fileMask, include also example names from same directory
        iLastSlash = sExample.lastIndexOf("/");
        var sFileMask = oParas.sFileMask ? Controller.fnLocalStorageName(oParas.sFileMask) : "", aDir = Controller.fnGetStorageDirectoryEntries(sFileMask), sPath = "";
        if (iLastSlash >= 0) {
            sPath = sExample.substr(0, iLastSlash) + "/";
            sFileMask = sPath + (sFileMask ? sFileMask : "*.*"); // only in same directory
        }
        var aDir2 = this.fnGetExampleDirectoryEntries(sFileMask); // also from examples
        for (var i = 0; i < aDir2.length; i += 1) {
            aDir2[i] = aDir2[i].substr(sPath.length); // remove preceding path including "/"
        }
        aDir = aDir2.concat(aDir); // combine
        this.fnPrintDirectoryEntries(iStream, aDir, false);
        this.oVm.vmStop("", 0, true);
    };
    Controller.prototype.fnFileEra = function (oParas) {
        var iStream = oParas.iStream, oStorage = Utils_1.Utils.localStorage, sFileMask = Controller.fnLocalStorageName(oParas.sFileMask), aDir = Controller.fnGetStorageDirectoryEntries(sFileMask);
        if (!aDir.length) {
            this.oVm.print(iStream, sFileMask + " not found\r\n");
        }
        for (var i = 0; i < aDir.length; i += 1) {
            var sName = aDir[i];
            if (oStorage.getItem(sName) !== null) {
                oStorage.removeItem(sName);
                this.updateStorageDatabase("remove", sName);
                if (Utils_1.Utils.debug > 0) {
                    Utils_1.Utils.console.debug("fnEraseFile: sName=" + sName + ": removed from localStorage");
                }
            }
            else {
                this.oVm.print(iStream, sName + " not found\r\n");
                Utils_1.Utils.console.warn("fnEraseFile: file not found in localStorage:", sName);
            }
        }
        this.oVm.vmStop("", 0, true);
    };
    Controller.prototype.fnFileRen = function (oParas) {
        var iStream = oParas.iStream, oStorage = Utils_1.Utils.localStorage, sNew = Controller.fnLocalStorageName(oParas.sNew), sOld = Controller.fnLocalStorageName(oParas.sOld), sItem = oStorage.getItem(sOld);
        if (sItem !== null) {
            if (!oStorage.getItem(sNew)) {
                oStorage.setItem(sNew, sItem);
                this.updateStorageDatabase("set", sNew);
                oStorage.removeItem(sOld);
                this.updateStorageDatabase("remove", sOld);
            }
            else {
                this.oVm.print(iStream, sOld + " already exists\r\n");
            }
        }
        else {
            this.oVm.print(iStream, sOld + " not found\r\n");
        }
        this.oVm.vmStop("", 0, true);
    };
    // Hisoft Devpac GENA3 Z80 Assember (http://www.cpcwiki.eu/index.php/Hisoft_Devpac)
    Controller.asmGena3Convert = function (sData) {
        var fnUInt16 = function (iPos2) {
            return sData.charCodeAt(iPos2) + sData.charCodeAt(iPos2 + 1) * 256;
        }, iLength = sData.length;
        var iPos = 0, sOut = "";
        iPos += 4; // what is the meaning of these bytes?
        while (iPos < iLength) {
            var iLineNum = fnUInt16(iPos);
            iPos += 2;
            var iIndex1 = sData.indexOf("\r", iPos); // EOL marker 0x0d
            if (iIndex1 < 0) {
                iIndex1 = iLength;
            }
            var iIndex2 = sData.indexOf("\x1c", iPos); // EOL marker 0x1c
            if (iIndex2 < 0) {
                iIndex2 = iLength;
            }
            iIndex1 = Math.min(iIndex1, iIndex2);
            sOut += iLineNum + " " + sData.substring(iPos, iIndex1) + "\n";
            iPos = iIndex1 + 1;
        }
        return sOut;
    };
    Controller.prototype.decodeTokenizedBasic = function (sInput) {
        if (!this.oBasicTokenizer) {
            this.oBasicTokenizer = new BasicTokenizer_1.BasicTokenizer();
        }
        return this.oBasicTokenizer.decode(sInput);
    };
    Controller.prototype.loadFileContinue = function (sInput) {
        var oInFile = this.oVm.vmGetInFileObject(), sCommand = oInFile.sCommand;
        var iStartLine = 0, bPutInMemory = false, oData;
        if (sInput !== null && sInput !== undefined) {
            oData = Controller.splitMeta(sInput);
            sInput = oData.sData; // maybe changed
            if (oData.oMeta.sEncoding === "base64") {
                sInput = Utils_1.Utils.atob(sInput); // decode base64
            }
            var sType = oData.oMeta.sType;
            if (sType === "T") { // tokenized basic?
                sInput = this.decodeTokenizedBasic(sInput);
            }
            else if (sType === "P") { // BASIC?
                sInput = DiskImage_1.DiskImage.unOrProtectData(sInput);
                sInput = this.decodeTokenizedBasic(sInput);
            }
            else if (sType === "B") { // binary?
            }
            else if (sType === "A") { // ASCII?
                // remove EOF character(s) (0x1a) from the end of file
                sInput = sInput.replace(/\x1a+$/, ""); // eslint-disable-line no-control-regex
            }
            else if (sType === "G") { // Hisoft Devpac GENA3 Z80 Assember
                sInput = Controller.asmGena3Convert(sInput);
            }
        }
        if (oInFile.fnFileCallback) {
            try {
                bPutInMemory = oInFile.fnFileCallback(sInput, oData && oData.oMeta);
            }
            catch (e) {
                Utils_1.Utils.console.warn(e);
            }
        }
        if (sInput === undefined) {
            Utils_1.Utils.console.error("loadFileContinue: File " + oInFile.sName + ": sInput undefined!");
            this.oVm.vmStop("stop", 60, true);
            this.startMainLoop();
            return;
        }
        if (sInput === null) {
            this.startMainLoop();
            return;
        }
        switch (sCommand) {
            case "openin":
                break;
            case "chainMerge":
                sInput = Controller.mergeScripts(this.view.getAreaValue("inputText"), sInput);
                this.setInputText(sInput);
                this.view.setAreaValue("resultText", "");
                iStartLine = oInFile.iLine || 0;
                this.invalidateScript();
                this.fnParseRun();
                break;
            case "load":
                if (!bPutInMemory) {
                    this.setInputText(sInput);
                    this.view.setAreaValue("resultText", "");
                    this.invalidateScript();
                    this.oVm.vmStop("end", 90);
                }
                break;
            case "merge":
                sInput = Controller.mergeScripts(this.view.getAreaValue("inputText"), sInput);
                this.setInputText(sInput);
                this.view.setAreaValue("resultText", "");
                this.invalidateScript();
                this.oVm.vmStop("end", 90);
                break;
            case "chain": // TODO: if we have a line number, make sure it is not optimized away when compiling
                this.setInputText(sInput);
                this.view.setAreaValue("resultText", "");
                iStartLine = oInFile.iLine || 0;
                this.invalidateScript();
                this.fnParseRun();
                break;
            case "run":
                if (!bPutInMemory) {
                    this.setInputText(sInput);
                    this.view.setAreaValue("resultText", "");
                    iStartLine = oInFile.iLine || 0;
                    this.fnReset();
                    this.fnParseRun();
                }
                else {
                    this.fnReset();
                }
                break;
            default:
                Utils_1.Utils.console.error("loadExample: Unknown command:", sCommand);
                break;
        }
        this.oVm.vmSetStartLine(iStartLine);
        this.startMainLoop();
    };
    Controller.prototype.loadExample = function () {
        var that = this, oInFile = this.oVm.vmGetInFileObject();
        var sExample, sUrl, fnExampleLoaded = function (_sFullUrl, sKey, bSuppressLog) {
            if (sKey !== sExample) {
                Utils_1.Utils.console.warn("fnExampleLoaded: Unexpected", sKey, "<>", sExample);
            }
            var oExample = that.model.getExample(sExample);
            if (!bSuppressLog) {
                Utils_1.Utils.console.log("Example", sUrl, oExample.meta || "", "loaded");
            }
            var sInput = oExample.script;
            that.model.setProperty("example", oInFile.sMemorizedExample);
            that.oVm.vmStop("", 0, true);
            that.loadFileContinue(sInput);
        }, fnExampleError = function () {
            Utils_1.Utils.console.log("Example", sUrl, "error");
            that.model.setProperty("example", oInFile.sMemorizedExample);
            that.oVm.vmStop("", 0, true);
            var oError = that.oVm.vmComposeError(Error(), 32, sExample + " not found"); // TODO: set also derr=146 (xx not found)
            // error or onError set
            if (oError.hidden) {
                that.oVm.vmStop("", 0, true); // clear onError
            }
            that.outputError(oError, true);
            that.loadFileContinue(null);
        };
        var sName = oInFile.sName;
        var sKey = this.model.getProperty("example");
        if (sName.charAt(0) === "/") { // absolute path?
            sName = sName.substr(1); // remove "/"
            oInFile.sMemorizedExample = sName; // change!
        }
        else {
            oInFile.sMemorizedExample = sKey;
            var iLastSlash = sKey.lastIndexOf("/");
            if (iLastSlash >= 0) {
                var sPath = sKey.substr(0, iLastSlash); // take path from selected example
                sName = sPath + "/" + sName;
                sName = sName.replace(/\w+\/\.\.\//, ""); // simplify 2 dots (go back) in path: "dir/.."" => ""
            }
        }
        sExample = sName;
        if (Utils_1.Utils.debug > 0) {
            Utils_1.Utils.console.debug("loadExample: sName=" + sName + " (current=" + sKey + ")");
        }
        var oExample = this.model.getExample(sExample); // already loaded
        if (oExample && oExample.loaded) {
            this.model.setProperty("example", sExample);
            fnExampleLoaded("", sExample, true);
        }
        else if (sExample && oExample) { // need to load
            this.model.setProperty("example", sExample);
            var sDatabaseDir = this.model.getDatabase().src;
            sUrl = sDatabaseDir + "/" + sExample + ".js";
            Utils_1.Utils.loadScript(sUrl, fnExampleLoaded, fnExampleError, sExample);
        }
        else { // keep original sExample in this error case
            sUrl = sExample;
            if (sExample !== "") { // only if not empty
                Utils_1.Utils.console.warn("loadExample: Unknown file:", sExample);
                fnExampleError();
            }
            else {
                this.model.setProperty("example", sExample);
                this.oVm.vmStop("", 0, true);
                this.loadFileContinue(""); // empty input?
            }
        }
    };
    Controller.fnLocalStorageName = function (sName, sDefaultExtension) {
        // modify name so we do not clash with localstorage methods/properites
        if (sName.indexOf(".") < 0) { // no dot inside name?
            sName += "." + (sDefaultExtension || ""); // append dot or default extension
        }
        return sName;
    };
    Controller.tryLoadingFromLocalStorage = function (sName) {
        var oStorage = Utils_1.Utils.localStorage;
        var sInput = null;
        if (sName.indexOf(".") >= 0) { // extension specified?
            sInput = oStorage.getItem(sName);
        }
        else {
            for (var i = 0; i < Controller.aDefaultExtensions.length; i += 1) {
                var sStorageName = Controller.fnLocalStorageName(sName, Controller.aDefaultExtensions[i]);
                sInput = oStorage.getItem(sStorageName);
                if (sInput !== null) {
                    break; // found
                }
            }
        }
        return sInput; // null=not found
    };
    Controller.prototype.fnFileLoad = function () {
        var oInFile = this.oVm.vmGetInFileObject();
        if (oInFile.bOpen) {
            if (oInFile.sCommand === "chainMerge" && oInFile.iFirst && oInFile.iLast) { // special handling to delete line numbers first
                this.fnDeleteLines({
                    iFirst: oInFile.iFirst,
                    iLast: oInFile.iLast,
                    sCommand: "CHAIN MERGE",
                    iStream: 0,
                    iLine: this.oVm.iLine
                });
                this.oVm.vmStop("fileLoad", 90); // restore
            }
            var sName = oInFile.sName;
            if (oInFile.sMemorizedExample) { //TTT check this
                var sKey = this.model.getProperty("example"), iLastSlash = sKey.lastIndexOf("/");
                if (iLastSlash >= 0) {
                    var sPath = sKey.substr(0, iLastSlash); // take path from selected example
                    sName = sPath + "/" + sName;
                    sName = sName.replace(/\w+\/\.\.\//, ""); // simplify 2 dots (go back) in path: "dir/.."" => ""
                }
            }
            if (Utils_1.Utils.debug > 1) {
                Utils_1.Utils.console.debug("fnFileLoad:", oInFile.sCommand, sName, "details:", oInFile);
            }
            var sInput = Controller.tryLoadingFromLocalStorage(sName);
            if (sInput !== null) {
                /*TTT
                if (this.model.getProperty<string>("database") === "storage") {
                    oInFile.sMemorizedExample = sName;
                }
                */
                if (Utils_1.Utils.debug > 0) {
                    Utils_1.Utils.console.debug("fnFileLoad:", oInFile.sCommand, sName, "from localStorage");
                }
                this.oVm.vmStop("", 0, true);
                this.loadFileContinue(sInput);
            }
            else { // load from example
                this.loadExample( /* sName */); //TTT
            }
        }
        else {
            Utils_1.Utils.console.error("fnFileLoad:", oInFile.sName, "File not open!"); // hopefully isName is defined
        }
        this.iNextLoopTimeOut = this.oVm.vmGetTimeUntilFrame(); // wait until next frame
    };
    Controller.joinMeta = function (oMeta) {
        var sMeta = [
            Controller.sMetaIdent,
            oMeta.sType,
            oMeta.iStart,
            oMeta.iLength,
            oMeta.iEntry
        ].join(";");
        return sMeta;
    };
    Controller.splitMeta = function (sInput) {
        var oMeta;
        if (sInput.indexOf(Controller.sMetaIdent) === 0) { // starts with metaIdent?
            var iIndex = sInput.indexOf(","); // metadata separator
            if (iIndex >= 0) {
                var sMeta = sInput.substr(0, iIndex);
                sInput = sInput.substr(iIndex + 1);
                var aMeta = sMeta.split(";");
                oMeta = {
                    sType: aMeta[1],
                    iStart: Number(aMeta[2]),
                    iLength: Number(aMeta[3]),
                    iEntry: Number(aMeta[4]),
                    sEncoding: aMeta[5]
                };
            }
        }
        if (!oMeta) {
            oMeta = {
                sType: ""
            };
        }
        var oMetaAndData = {
            oMeta: oMeta,
            sData: sInput
        };
        return oMetaAndData;
    };
    Controller.prototype.fnFileSave = function () {
        var oOutFile = this.oVm.vmGetOutFileObject(), oStorage = Utils_1.Utils.localStorage;
        var sDefaultExtension = "";
        if (oOutFile.bOpen) {
            var sType = oOutFile.sType, sName = oOutFile.sName;
            if (sType === "P" || sType === "T") {
                sDefaultExtension = "bas";
            }
            else if (sType === "B") {
                sDefaultExtension = "bin";
            }
            var sStorageName = Controller.fnLocalStorageName(sName, sDefaultExtension);
            var sFileData = void 0;
            /*
            if (oOutFile.aFileData) {
                sFileData = oOutFile.aFileData.join("");
            } else { // no file data (assuming sType A, P or T) => get text
                sFileData = this.view.getAreaValue("inputText");
                oOutFile.iLength = sFileData.length; // set length
                oOutFile.sType = "A"; // override sType: currently we support type "A" only
            }
            */
            //TTT TODO!! oOutFile.aFileData.length ?
            if (oOutFile.aFileData.length || (sType === "B") || (oOutFile.sCommand = "openout")) { // sType A(for openout) or B
                sFileData = oOutFile.aFileData.join("");
            }
            else { // no file data (assuming sType A, P or T) => get text
                sFileData = this.view.getAreaValue("inputText");
                oOutFile.iLength = sFileData.length; // set length
                oOutFile.sType = "A"; // override sType: currently we support type "A" only
            }
            if (Utils_1.Utils.debug > 0) {
                Utils_1.Utils.console.debug("fnFileSave: sName=" + sName + ": put into localStorage");
            }
            if (oOutFile.fnFileCallback) {
                try {
                    oOutFile.fnFileCallback(sFileData); // close file
                }
                catch (e) {
                    Utils_1.Utils.console.warn(e);
                }
            }
            var sMeta = Controller.joinMeta(oOutFile);
            oStorage.setItem(sStorageName, sMeta + "," + sFileData);
            this.updateStorageDatabase("set", sStorageName);
            CpcVm_1.CpcVm.vmResetFileHandling(oOutFile); // make sure it is closed
        }
        else {
            Utils_1.Utils.console.error("fnFileSave: file not open!");
        }
        this.oVm.vmStop("", 0, true); // continue
    };
    Controller.prototype.fnDeleteLines = function (oParas) {
        var sInputText = this.view.getAreaValue("inputText"), aLines = Controller.fnGetLinesInRange(sInputText, oParas.iFirst, oParas.iLast);
        var oError;
        if (aLines.length) {
            for (var i = 0; i < aLines.length; i += 1) {
                var iLine = parseInt(aLines[i], 10);
                if (isNaN(iLine)) {
                    oError = this.oVm.vmComposeError(Error(), 21, oParas.sCommand); // "Direct command found"
                    this.outputError(oError, true);
                    break;
                }
                aLines[i] = String(iLine); // keep just the line numbers
            }
            if (!oError) {
                var sInput = aLines.join("\n");
                sInput = Controller.mergeScripts(sInputText, sInput); // delete sInput lines
                this.setInputText(sInput);
            }
        }
        this.oVm.vmGotoLine(0); // reset current line
        this.oVm.vmStop("end", 0, true);
    };
    Controller.prototype.fnNew = function () {
        var sInput = "";
        this.setInputText(sInput);
        this.oVariables.removeAllVariables();
        this.oVm.vmGotoLine(0); // reset current line
        this.oVm.vmStop("end", 0, true);
        this.invalidateScript();
    };
    Controller.prototype.fnList = function (oParas) {
        var sInput = this.view.getAreaValue("inputText"), iStream = oParas.iStream, aLines = Controller.fnGetLinesInRange(sInput, oParas.iFirst, oParas.iLast), oRegExp = new RegExp(/([\x00-\x1f])/g); // eslint-disable-line no-control-regex
        for (var i = 0; i < aLines.length; i += 1) {
            var sLine = aLines[i];
            if (iStream !== 9) {
                sLine = sLine.replace(oRegExp, "\x01$1"); // escape control characters to print them directly
            }
            this.oVm.print(iStream, sLine, "\r\n");
        }
        this.oVm.vmGotoLine(0); // reset current line
        this.oVm.vmStop("end", 0, true);
    };
    Controller.prototype.fnReset = function () {
        var oVm = this.oVm;
        this.oVariables.removeAllVariables();
        oVm.vmReset();
        if (this.oVirtualKeyboard) {
            this.oVirtualKeyboard.reset();
        }
        oVm.vmStop("end", 0, true); // set "end" with priority 0, so that "compile only" still works
        oVm.sOut = "";
        this.view.setAreaValue("outputText", "");
        this.invalidateScript();
    };
    Controller.prototype.outputError = function (oError, bNoSelection) {
        var iStream = 0, sShortError = oError.shortMessage || oError.message;
        if (!bNoSelection) {
            var iEndPos = (oError.pos || 0) + ((oError.value !== undefined) ? String(oError.value).length : 0);
            this.view.setAreaSelection("inputText", oError.pos || 0, iEndPos);
        }
        var sEscapedShortError = sShortError.replace(/([\x00-\x1f])/g, "\x01$1"); // eslint-disable-line no-control-regex
        this.oVm.print(iStream, sEscapedShortError + "\r\n");
        return sShortError;
    };
    Controller.prototype.fnRenumLines = function (oParas) {
        var oVm = this.oVm, sInput = this.view.getAreaValue("inputText");
        if (!this.oBasicFormatter) {
            this.oBasicFormatter = new BasicFormatter_1.BasicFormatter({
                lexer: new BasicLexer_1.BasicLexer(),
                parser: new BasicParser_1.BasicParser()
            });
        }
        var oOutput = this.oBasicFormatter.renumber(sInput, oParas.iNew, oParas.iOld, oParas.iStep, oParas.iKeep);
        if (oOutput.error) {
            Utils_1.Utils.console.warn(oOutput.error);
            this.outputError(oOutput.error);
        }
        else {
            this.fnPutChangedInputOnStack();
            this.setInputText(oOutput.text, true);
            this.fnPutChangedInputOnStack();
        }
        this.oVm.vmGotoLine(0); // reset current line
        oVm.vmStop("end", 0, true);
    };
    Controller.prototype.fnEditLineCallback = function () {
        var oInput = this.oVm.vmGetStopObject().oParas, sInputText = this.view.getAreaValue("inputText");
        var sInput = oInput.sInput;
        sInput = Controller.mergeScripts(sInputText, sInput);
        this.setInputText(sInput);
        this.oVm.vmSetStartLine(0);
        this.oVm.vmGotoLine(0); // to be sure
        this.view.setDisabled("continueButton", true);
        this.oVm.cursor(oInput.iStream, 0);
        this.oVm.vmStop("end", 90);
        return true;
    };
    Controller.prototype.fnEditLine = function (oParas) {
        var sInput = this.view.getAreaValue("inputText"), iStream = oParas.iStream, iLine = oParas.iFirst, aLines = Controller.fnGetLinesInRange(sInput, iLine, iLine);
        if (aLines.length) {
            var sLine = aLines[0];
            this.oVm.print(iStream, sLine);
            this.oVm.cursor(iStream, 1);
            var oInputParas = {
                sCommand: oParas.sCommand,
                iLine: oParas.iLine,
                iStream: iStream,
                sMessage: "",
                fnInputCallback: this.fnEditLineCallback.bind(this),
                sInput: sLine
            };
            this.oVm.vmStop("waitInput", 45, true, oInputParas);
            this.fnWaitInput();
        }
        else {
            var oError = this.oVm.vmComposeError(Error(), 8, String(iLine)); // "Line does not exist"
            this.oVm.print(iStream, String(oError) + "\r\n");
            this.oVm.vmStop("stop", 60, true);
        }
    };
    Controller.prototype.fnParseBench = function (sInput, iBench) {
        var oOutput;
        for (var i = 0; i < iBench; i += 1) {
            var iTime = Date.now();
            oOutput = this.oCodeGeneratorJs.generate(sInput, this.oVariables);
            iTime = Date.now() - iTime;
            Utils_1.Utils.console.debug("bench size", sInput.length, "labels", this.oCodeGeneratorJs.debugGetLabelsCount(), "loop", i, ":", iTime, "ms");
            if (oOutput.error) {
                break;
            }
        }
        return oOutput;
    };
    Controller.prototype.fnParse = function () {
        var sInput = this.view.getAreaValue("inputText"), iBench = this.model.getProperty("bench");
        this.oVariables.removeAllVariables();
        var oOutput;
        if (!iBench) {
            oOutput = this.oCodeGeneratorJs.generate(sInput, this.oVariables);
        }
        else {
            oOutput = this.fnParseBench(sInput, iBench);
        }
        var sOutput;
        if (oOutput.error) {
            sOutput = this.outputError(oOutput.error);
        }
        else {
            sOutput = oOutput.text;
        }
        if (sOutput && sOutput.length > 0) {
            sOutput += "\n";
        }
        this.view.setAreaValue("outputText", sOutput);
        this.invalidateScript();
        this.setVarSelectOptions("varSelect", this.oVariables);
        this.commonEventHandler.onVarSelectChange();
        return oOutput;
    };
    Controller.prototype.fnPretty = function () {
        var sInput = this.view.getAreaValue("inputText"), oCodeGeneratorBasic = new CodeGeneratorBasic_1.CodeGeneratorBasic({
            lexer: new BasicLexer_1.BasicLexer(),
            parser: new BasicParser_1.BasicParser()
        }), oOutput = oCodeGeneratorBasic.generate(sInput);
        if (oOutput.error) {
            this.outputError(oOutput.error);
        }
        else {
            var sOutput = oOutput.text;
            this.fnPutChangedInputOnStack();
            this.setInputText(sOutput, true);
            this.fnPutChangedInputOnStack();
            var sDiff = Diff_1.Diff.testDiff(sInput.toUpperCase(), sOutput.toUpperCase()); // for testing
            this.view.setAreaValue("outputText", sDiff);
        }
    };
    Controller.prototype.selectJsError = function (sScript, e) {
        var iLineNumber = e.lineNumber, // only on FireFox
        iColumnNumber = e.columnNumber, iErrLine = iLineNumber - 3; // for some reason line 0 is 3
        var iPos = 0, iLine = 0;
        while (iPos < sScript.length && iLine < iErrLine) {
            iPos = sScript.indexOf("\n", iPos) + 1;
            iLine += 1;
        }
        iPos += iColumnNumber;
        Utils_1.Utils.console.warn("Info: JS Error occurred at line", iLineNumber, "column", iColumnNumber, "pos", iPos);
        this.view.setAreaSelection("outputText", iPos, iPos + 1);
    };
    Controller.prototype.fnRun = function (oParas) {
        var sScript = this.view.getAreaValue("outputText"), oVm = this.oVm;
        var iLine = oParas && oParas.iFirst || 0;
        iLine = iLine || 0;
        if (iLine === 0) {
            oVm.vmResetData(); // start from the beginning => also reset data! (or put it in line 0 in the script)
        }
        if (this.oVm.vmGetOutFileObject().bOpen) {
            this.fnFileSave();
        }
        if (!this.fnScript) {
            oVm.clear(); // init variables
            try {
                this.fnScript = new Function("o", sScript); // eslint-disable-line no-new-func
            }
            catch (e) {
                Utils_1.Utils.console.error(e);
                if (e.lineNumber || e.columnNumber) { // only available on Firefox
                    this.selectJsError(sScript, e);
                }
                e.shortMessage = "JS " + String(e);
                this.outputError(e, true);
                this.fnScript = undefined;
            }
        }
        else {
            oVm.clear(); // we do a clear as well here
        }
        oVm.vmReset4Run();
        if (!this.bInputSet) {
            this.bInputSet = true;
            this.oKeyboard.putKeysInBuffer(this.model.getProperty("input"));
        }
        if (this.fnScript) {
            oVm.sOut = this.view.getAreaValue("resultText");
            oVm.vmStop("", 0, true);
            oVm.vmGotoLine(0); // to load DATA lines
            this.oVm.vmSetStartLine(iLine); // clear resets also startline
            this.view.setDisabled("runButton", true);
            this.view.setDisabled("stopButton", false);
            this.view.setDisabled("continueButton", true);
        }
        if (Utils_1.Utils.debug > 1) {
            Utils_1.Utils.console.debug("End of fnRun");
        }
    };
    Controller.prototype.fnParseRun = function () {
        var oOutput = this.fnParse();
        if (!oOutput.error) {
            this.fnRun();
        }
    };
    Controller.prototype.fnRunPart1 = function (fnScript) {
        try {
            fnScript(this.oVm);
        }
        catch (e) {
            if (e.name === "CpcVm") {
                if (!e.hidden) {
                    Utils_1.Utils.console.warn(e);
                    this.outputError(e, true);
                }
                else {
                    Utils_1.Utils.console.log(e.message);
                }
            }
            else {
                Utils_1.Utils.console.error(e);
                if (e.lineNumber || e.columnNumber) { // only available on Firefox
                    this.selectJsError(this.view.getAreaValue("outputText"), e);
                }
                this.oVm.vmComposeError(e, 2, "JS " + String(e)); // generate Syntax Error, set also err and erl and set stop
                this.outputError(e, true);
            }
        }
    };
    Controller.prototype.fnDirectInput = function () {
        var oInput = this.oVm.vmGetStopObject().oParas, iStream = oInput.iStream;
        var sInput = oInput.sInput;
        sInput = sInput.trim();
        oInput.sInput = "";
        if (sInput !== "") { // direct input
            this.oVm.cursor(iStream, 0);
            var sInputText = this.view.getAreaValue("inputText");
            if ((/^\d+($| )/).test(sInput)) { // start with number?
                if (Utils_1.Utils.debug > 0) {
                    Utils_1.Utils.console.debug("fnDirectInput: insert line=" + sInput);
                }
                sInput = Controller.mergeScripts(sInputText, sInput);
                this.setInputText(sInput, true);
                this.oVm.vmSetStartLine(0);
                this.oVm.vmGotoLine(0); // to be sure
                this.view.setDisabled("continueButton", true);
                this.oVm.cursor(iStream, 1);
                this.updateResultText();
                return false; // continue direct input
            }
            Utils_1.Utils.console.log("fnDirectInput: execute:", sInput);
            var oCodeGeneratorJs = this.oCodeGeneratorJs;
            var oOutput = void 0, sOutput = void 0;
            if (sInputText && (/^\d+($| )/).test(sInputText)) { // do we have a program starting with a line number?
                oOutput = oCodeGeneratorJs.generate(sInput + "\n" + sInputText, this.oVariables, true); // compile both; allow direct command
                if (oOutput.error) {
                    var oError = oOutput.error;
                    if (oError.pos >= sInput.length + 1) { // error not in direct?
                        oError.pos -= (sInput.length + 1);
                        oError.message = "[prg] " + oError.message;
                        if (oError.shortMessage) { // eslint-disable-line max-depth
                            oError.shortMessage = "[prg] " + oError.shortMessage;
                        }
                        sOutput = this.outputError(oError, true);
                        oOutput = undefined;
                    }
                }
            }
            if (!oOutput) {
                oOutput = oCodeGeneratorJs.generate(sInput, this.oVariables, true); // compile direct input only
            }
            if (oOutput.error) {
                sOutput = this.outputError(oOutput.error, true);
            }
            else {
                sOutput = oOutput.text;
            }
            if (sOutput && sOutput.length > 0) {
                sOutput += "\n";
            }
            this.view.setAreaValue("outputText", sOutput);
            if (!oOutput.error) {
                this.oVm.vmSetStartLine(this.oVm.iLine); // fast hack
                this.oVm.vmGotoLine("direct");
                try {
                    var fnScript = new Function("o", sOutput); // eslint-disable-line no-new-func
                    this.fnScript = fnScript;
                }
                catch (e) {
                    Utils_1.Utils.console.error(e);
                    this.outputError(e, true);
                }
            }
            if (!oOutput.error) {
                this.updateResultText();
                return true;
            }
            var sMsg = oInput.sMessage;
            this.oVm.print(iStream, sMsg);
            this.oVm.cursor(iStream, 1);
        }
        this.updateResultText();
        return false;
    };
    Controller.prototype.startWithDirectInput = function () {
        var oVm = this.oVm, iStream = 0, sMsg = "Ready\r\n";
        this.oVm.tagoff(iStream);
        this.oVm.vmResetControlBuffer();
        if (this.oVm.pos(iStream) > 1) {
            this.oVm.print(iStream, "\r\n");
        }
        this.oVm.print(iStream, sMsg);
        this.oVm.cursor(iStream, 1, 1);
        oVm.vmStop("direct", 0, true, {
            sCommand: "direct",
            iStream: iStream,
            sMessage: sMsg,
            // sNoCRLF: true,
            fnInputCallback: this.fnDirectInputHandler,
            sInput: "",
            iLine: this.oVm.iLine
        });
        this.fnWaitInput();
    };
    Controller.prototype.updateResultText = function () {
        this.view.setAreaValue("resultText", this.oVm.sOut);
        this.view.setAreaScrollTop("resultText"); // scroll to bottom
    };
    Controller.prototype.exitLoop = function () {
        var oStop = this.oVm.vmGetStopObject(), sReason = oStop.sReason;
        this.updateResultText();
        this.view.setDisabled("runButton", sReason === "reset");
        this.view.setDisabled("stopButton", sReason !== "fileLoad" && sReason !== "fileSave");
        this.view.setDisabled("continueButton", sReason === "end" || sReason === "fileLoad" || sReason === "fileSave" || sReason === "parse" || sReason === "renumLines" || sReason === "reset");
        this.setVarSelectOptions("varSelect", this.oVariables);
        this.commonEventHandler.onVarSelectChange();
        if (sReason === "stop" || sReason === "end" || sReason === "error" || sReason === "parse" || sReason === "parseRun") {
            this.startWithDirectInput();
        }
    };
    Controller.prototype.fnWaitFrame = function () {
        this.oVm.vmStop("", 0, true);
        this.iNextLoopTimeOut = this.oVm.vmGetTimeUntilFrame(); // wait until next frame
    };
    Controller.prototype.fnOnError = function () {
        this.oVm.vmStop("", 0, true); // continue
    };
    Controller.fnDummy = function () {
        // empty
    };
    Controller.prototype.fnTimer = function () {
        this.oVm.vmStop("", 0, true); // continue
    };
    Controller.prototype.fnRunLoop = function () {
        var oStop = this.oVm.vmGetStopObject();
        this.iNextLoopTimeOut = 0;
        if (!oStop.sReason && this.fnScript) {
            this.fnRunPart1(this.fnScript); // could change sReason
        }
        if (oStop.sReason in this.mHandlers) {
            this.mHandlers[oStop.sReason].call(this, oStop.oParas);
        }
        else {
            Utils_1.Utils.console.warn("runLoop: Unknown run mode:", oStop.sReason);
            this.oVm.vmStop("error", 50);
        }
        if (oStop.sReason && oStop.sReason !== "waitSound" && oStop.sReason !== "waitKey" && oStop.sReason !== "waitInput") {
            this.bTimeoutHandlerActive = false; // not running any more
            this.exitLoop();
        }
        else {
            setTimeout(this.fnRunLoopHandler, this.iNextLoopTimeOut);
        }
    };
    Controller.prototype.startMainLoop = function () {
        if (!this.bTimeoutHandlerActive) {
            this.bTimeoutHandlerActive = true;
            this.fnRunLoop();
        }
    };
    Controller.prototype.setStopObject = function (oStop) {
        Object.assign(this.oSavedStop, oStop);
    };
    Controller.prototype.getStopObject = function () {
        return this.oSavedStop;
    };
    Controller.prototype.startParse = function () {
        this.oKeyboard.setKeyDownHandler(undefined);
        this.oVm.vmStop("parse", 95);
        this.startMainLoop();
    };
    Controller.prototype.startRenum = function () {
        var iStream = 0;
        this.oVm.vmStop("renumLines", 85, false, {
            sCommand: "renum",
            iStream: 0,
            iNew: 10,
            iOld: 1,
            iStep: 10,
            iKeep: 65535,
            iLine: this.oVm.iLine
        });
        if (this.oVm.pos(iStream) > 1) {
            this.oVm.print(iStream, "\r\n");
        }
        this.oVm.print(iStream, "renum\r\n");
        this.startMainLoop();
    };
    Controller.prototype.startRun = function () {
        this.setStopObject(this.oNoStop);
        this.oKeyboard.setKeyDownHandler(undefined);
        this.oVm.vmStop("run", 95);
        this.startMainLoop();
    };
    Controller.prototype.startParseRun = function () {
        this.setStopObject(this.oNoStop);
        this.oKeyboard.setKeyDownHandler(undefined);
        this.oVm.vmStop("parseRun", 95);
        this.startMainLoop();
    };
    Controller.prototype.startBreak = function () {
        var oVm = this.oVm, oStop = oVm.vmGetStopObject();
        this.setStopObject(oStop);
        this.oKeyboard.setKeyDownHandler(undefined);
        this.oVm.vmStop("break", 80);
        this.startMainLoop();
    };
    Controller.prototype.startContinue = function () {
        var oVm = this.oVm, oStop = oVm.vmGetStopObject(), oSavedStop = this.getStopObject();
        this.view.setDisabled("runButton", true);
        this.view.setDisabled("stopButton", false);
        this.view.setDisabled("continueButton", true);
        if (oStop.sReason === "break" || oStop.sReason === "escape" || oStop.sReason === "stop" || oStop.sReason === "direct") {
            if (oSavedStop.oParas && !oSavedStop.oParas.fnInputCallback) { // no keyboard callback? make sure no handler is set (especially for direct->continue)
                this.oKeyboard.setKeyDownHandler(undefined);
            }
            if (oStop.sReason === "direct" || oStop.sReason === "escape") {
                this.oVm.cursor(oStop.oParas.iStream, 0); // switch it off (for continue button)
            }
            Object.assign(oStop, oSavedStop); // fast hack
            this.setStopObject(this.oNoStop);
        }
        this.startMainLoop();
    };
    Controller.prototype.startReset = function () {
        this.setStopObject(this.oNoStop);
        this.oKeyboard.setKeyDownHandler(undefined);
        this.oVm.vmStop("reset", 99);
        this.startMainLoop();
    };
    Controller.prototype.startScreenshot = function () {
        return this.oCanvas.startScreenshot();
    };
    Controller.prototype.fnPutKeyInBuffer = function (sKey) {
        this.oKeyboard.putKeyInBuffer(sKey);
        var oKeyDownHandler = this.oKeyboard.getKeyDownHandler();
        if (oKeyDownHandler) {
            oKeyDownHandler();
        }
    };
    Controller.prototype.startEnter = function () {
        var sInput = this.view.getAreaValue("inp2Text");
        sInput = sInput.replace("\n", "\r"); // LF => CR
        if (!sInput.endsWith("\r")) {
            sInput += "\r";
        }
        for (var i = 0; i < sInput.length; i += 1) {
            this.fnPutKeyInBuffer(sInput.charAt(i));
        }
        this.view.setAreaValue("inp2Text", "");
    };
    Controller.generateFunction = function (sPar, sFunction) {
        if (sFunction.startsWith("function anonymous(")) { // already a modified function (inside an anonymous function)?
            var iFirstIndex = sFunction.indexOf("{"), iLastIndex = sFunction.lastIndexOf("}");
            if (iFirstIndex >= 0 && iLastIndex >= 0) {
                sFunction = sFunction.substring(iFirstIndex + 1, iLastIndex - 1); // remove anonymous function
            }
            sFunction = sFunction.trim();
        }
        else {
            sFunction = "var o=cpcBasic.controller.oVm, v=o.vmGetAllVariables(); v." + sPar + " = " + sFunction;
        }
        var aMatch = (/function \(([^)]*)/).exec(sFunction), aArgs = aMatch ? aMatch[1].split(",") : [], fnFunction = new Function(aArgs[0], aArgs[1], aArgs[2], aArgs[3], aArgs[4], sFunction); // eslint-disable-line no-new-func
        // we support at most 5 arguments
        return fnFunction;
    };
    Controller.prototype.changeVariable = function () {
        var sPar = this.view.getSelectValue("varSelect"), sValue = this.view.getSelectValue("varText"), oVariables = this.oVariables;
        var value = oVariables.getVariable(sPar);
        if (typeof value === "function") {
            value = Controller.generateFunction(sPar, sValue);
            oVariables.setVariable(sPar, value);
        }
        else {
            var sVarType = this.oVariables.determineStaticVarType(sPar), sType = this.oVm.vmDetermineVarType(sVarType); // do we know dynamic type?
            if (sType !== "$") { // not string? => convert to number
                value = parseFloat(sValue);
            }
            else {
                value = sValue;
            }
            try {
                var value2 = this.oVm.vmAssign(sVarType, value);
                oVariables.setVariable(sPar, value2);
                Utils_1.Utils.console.log("Variable", sPar, "changed:", oVariables.getVariable(sPar), "=>", value);
            }
            catch (e) {
                Utils_1.Utils.console.warn(e);
            }
        }
        this.setVarSelectOptions("varSelect", oVariables);
        this.commonEventHandler.onVarSelectChange(); // title change?
    };
    Controller.prototype.setSoundActive = function () {
        var oSound = this.oSound, soundButton = View_1.View.getElementById1("soundButton"), bActive = this.model.getProperty("sound");
        var sText;
        if (bActive) {
            try {
                oSound.soundOn();
                sText = (oSound.isActivatedByUser()) ? "Sound is on" : "Sound on (waiting)";
            }
            catch (e) {
                Utils_1.Utils.console.warn("soundOn:", e);
                sText = "Sound unavailable";
            }
        }
        else {
            oSound.soundOff();
            sText = "Sound is off";
            var oStop = this.oVm && this.oVm.vmGetStopObject();
            if (oStop && oStop.sReason === "waitSound") {
                this.oVm.vmStop("", 0, true); // do not wait
            }
        }
        soundButton.innerText = sText;
    };
    Controller.createMinimalAmsdosHeader = function (sType, iStart, iLength) {
        var oHeader = {
            sType: sType,
            iStart: iStart,
            iLength: iLength
        };
        return oHeader;
    };
    Controller.prototype.fnEndOfImport = function (aImported) {
        var iStream = 0, oVm = this.oVm;
        for (var i = 0; i < aImported.length; i += 1) {
            oVm.print(iStream, aImported[i], " ");
        }
        oVm.print(iStream, "\r\n", aImported.length + " file" + (aImported.length !== 1 ? "s" : "") + " imported.\r\n");
        this.updateResultText();
    };
    // starting with (line) number, or 7 bit ASCII characters without control codes except \x1a=EOF
    Controller.prototype.fnLoad2 = function (sData, sName, sType, aImported) {
        var oHeader, sStorageName = this.oVm.vmAdaptFilename(sName, "FILE");
        sStorageName = Controller.fnLocalStorageName(sStorageName);
        if (sType === "text/plain") {
            oHeader = Controller.createMinimalAmsdosHeader("A", 0, sData.length);
        }
        else {
            if (sType === "application/x-zip-compressed" || sType === "cpcBasic/binary") { // are we a file inside zip?
                // empty
            }
            else { // e.g. "data:application/octet-stream;base64,..."
                var iIndex = sData.indexOf(",");
                if (iIndex >= 0) {
                    var sInfo1 = sData.substr(0, iIndex);
                    sData = sData.substr(iIndex + 1); // remove meta prefix
                    if (sInfo1.indexOf("base64") >= 0) {
                        sData = Utils_1.Utils.atob(sData); // decode base64
                    }
                }
            }
            oHeader = DiskImage_1.DiskImage.parseAmsdosHeader(sData);
            if (oHeader) {
                sData = sData.substr(0x80); // remove header
            }
            else if (Controller.reRegExpIsText.test(sData)) {
                oHeader = Controller.createMinimalAmsdosHeader("A", 0, sData.length);
            }
            else if (DiskImage_1.DiskImage.testDiskIdent(sData.substr(0, 8))) { // disk image file?
                try {
                    var oDsk = new DiskImage_1.DiskImage({
                        sData: sData,
                        sDiskName: sName
                    }), oDir = oDsk.readDirectory(), aDiskFiles = Object.keys(oDir);
                    for (var i = 0; i < aDiskFiles.length; i += 1) {
                        var sFileName = aDiskFiles[i];
                        try { // eslint-disable-line max-depth
                            sData = oDsk.readFile(oDir[sFileName]);
                            this.fnLoad2(sData, sFileName, "cpcBasic/binary", aImported); // recursive
                        }
                        catch (e) {
                            Utils_1.Utils.console.error(e);
                            this.outputError(e, true);
                        }
                    }
                }
                catch (e) {
                    Utils_1.Utils.console.error(e);
                    this.outputError(e, true);
                }
                oHeader = undefined; // ignore dsk file
            }
            else { // binary
                oHeader = Controller.createMinimalAmsdosHeader("B", 0, sData.length);
            }
        }
        if (oHeader) {
            var sMeta = Controller.joinMeta(oHeader);
            try {
                Utils_1.Utils.localStorage.setItem(sStorageName, sMeta + "," + sData);
                this.updateStorageDatabase("set", sStorageName);
                Utils_1.Utils.console.log("fnOnLoad: file: " + sStorageName + " meta: " + sMeta + " imported");
                aImported.push(sName);
            }
            catch (e) { // maybe quota exceeded
                Utils_1.Utils.console.error(e);
                if (e.name === "QuotaExceededError") {
                    e.shortMessage = sStorageName + ": Quota exceeded";
                }
                this.outputError(e, true);
            }
        }
    };
    // https://stackoverflow.com/questions/10261989/html5-javascript-drag-and-drop-file-from-external-window-windows-explorer
    // https://www.w3.org/TR/file-upload/#dfn-filereader
    Controller.prototype.fnHandleFileSelect = function (event) {
        var oDataTransfer = event.dataTransfer, aFiles = oDataTransfer ? oDataTransfer.files : event.target.files, // dataTransfer for drag&drop, target.files for file input
        that = this, aImported = [];
        var iFile = 0, oFile, oReader;
        function fnReadNextFile() {
            if (iFile < aFiles.length) {
                oFile = aFiles[iFile];
                iFile += 1;
                var lastModified = oFile.lastModified, lastModifiedDate = lastModified ? new Date(lastModified) : oFile.lastModifiedDate, // lastModifiedDate deprecated, but for old IE
                sText = oFile.name + " " + (oFile.type || "n/a") + " " + oFile.size + " " + (lastModifiedDate ? lastModifiedDate.toLocaleDateString() : "n/a");
                Utils_1.Utils.console.log(sText);
                if (oFile.type === "text/plain") {
                    oReader.readAsText(oFile);
                }
                else if (oFile.type === "application/x-zip-compressed") {
                    oReader.readAsArrayBuffer(oFile);
                }
                else {
                    oReader.readAsDataURL(oFile);
                }
            }
            else {
                that.fnEndOfImport(aImported);
            }
        }
        function fnErrorHandler(event2) {
            var oTarget = event2.target;
            var sMsg = "fnErrorHandler: Error reading file " + oFile.name;
            if (oTarget !== null && oTarget.error !== null) {
                if (oTarget.error.NOT_FOUND_ERR) {
                    sMsg += ": File not found";
                }
                else if (oTarget.error.ABORT_ERR) {
                    sMsg = ""; // nothing
                }
            }
            if (sMsg) {
                Utils_1.Utils.console.warn(sMsg);
            }
            fnReadNextFile();
        }
        /*
        function fnLoad2(sData: string, sName: string, sType: string) {
            let oHeader: AmsdosHeader | undefined,
                sStorageName = that.oVm.vmAdaptFilename(sName, "FILE");

            sStorageName = Controller.fnLocalStorageName(sStorageName);

            if (sType === "text/plain") {
                oHeader = Controller.createMinimalAmsdosHeader("A", 0, sData.length);
            } else {
                if (sType === "application/x-zip-compressed" || sType === "cpcBasic/binary") { // are we a file inside zip?
                    // empty
                } else { // e.g. "data:application/octet-stream;base64,..."
                    const iIndex = sData.indexOf(",");

                    if (iIndex >= 0) {
                        const sInfo1 = sData.substr(0, iIndex);

                        sData = sData.substr(iIndex + 1); // remove meta prefix
                        if (sInfo1.indexOf("base64") >= 0) {
                            sData = Utils.atob(sData); // decode base64
                        }
                    }
                }

                oHeader = DiskImage.parseAmsdosHeader(sData);
                if (oHeader) {
                    sData = sData.substr(0x80); // remove header
                } else if (reRegExpIsText.test(sData)) {
                    oHeader = Controller.createMinimalAmsdosHeader("A", 0, sData.length);
                } else if (DiskImage.testDiskIdent(sData.substr(0, 8))) { // disk image file?
                    try {
                        const oDsk = new DiskImage({
                                sData: sData,
                                sDiskName: sName
                            }),
                            oDir = oDsk.readDirectory(),
                            aDiskFiles = Object.keys(oDir);

                        for (let i = 0; i < aDiskFiles.length; i += 1) {
                            const sFileName = aDiskFiles[i];

                            try { // eslint-disable-line max-depth
                                sData = oDsk.readFile(oDir[sFileName]);
                                fnLoad2(sData, sFileName, "cpcBasic/binary"); // recursive
                            } catch (e) {
                                Utils.console.error(e);
                                that.outputError(e, true);
                            }
                        }
                    } catch (e) {
                        Utils.console.error(e);
                        that.outputError(e, true);
                    }
                    oHeader = undefined; // ignore dsk file
                } else { // binary
                    oHeader = Controller.createMinimalAmsdosHeader("B", 0, sData.length);
                }
            }

            if (oHeader) {
                const sMeta = Controller.joinMeta(oHeader);

                try {
                    oStorage.setItem(sStorageName, sMeta + "," + sData);
                    that.updateStorageDatabase("set", sStorageName);
                    Utils.console.log("fnOnLoad: file: " + sStorageName + " meta: " + sMeta + " imported");
                    aImported.push(sName);
                } catch (e) { // maybe quota exceeded
                    Utils.console.error(e);
                    if (e.name === "QuotaExceededError") {
                        e.shortMessage = sStorageName + ": Quota exceeded";
                    }
                    that.outputError(e, true);
                }
            }
        }
        */
        function fnOnLoad(event2) {
            var oTarget = event2.target, data = (oTarget && oTarget.result) || null, sName = oFile.name, sType = oFile.type;
            if (sType === "application/x-zip-compressed" && data instanceof ArrayBuffer) {
                var oZip = void 0;
                try {
                    oZip = new ZipFile_1.ZipFile(new Uint8Array(data), sName); // rather aData
                }
                catch (e) {
                    Utils_1.Utils.console.error(e);
                    that.outputError(e, true);
                }
                if (oZip) {
                    var oZipDirectory = oZip.getZipDirectory(), aEntries = Object.keys(oZipDirectory);
                    for (var i = 0; i < aEntries.length; i += 1) {
                        var sName2 = aEntries[i];
                        var sData2 = void 0;
                        try {
                            sData2 = oZip.readData(sName2);
                        }
                        catch (e) {
                            Utils_1.Utils.console.error(e);
                            that.outputError(e, true);
                            //sData2 = undefined;
                        }
                        if (sData2) {
                            that.fnLoad2(sData2, sName2, sType, aImported);
                        }
                    }
                }
            }
            else if (typeof data === "string") {
                that.fnLoad2(data, sName, sType, aImported);
            }
            else {
                Utils_1.Utils.console.warn("Error loading file", sName, "with type", sType, " unexpected data:", data);
            }
            fnReadNextFile();
        }
        event.stopPropagation();
        event.preventDefault();
        if (window.FileReader) {
            oReader = new FileReader();
            oReader.onerror = fnErrorHandler;
            oReader.onload = fnOnLoad;
            fnReadNextFile();
        }
        else {
            Utils_1.Utils.console.warn("FileReader API not supported.");
        }
    };
    Controller.fnHandleDragOver = function (evt) {
        evt.stopPropagation();
        evt.preventDefault();
        if (evt.dataTransfer !== null) {
            evt.dataTransfer.dropEffect = "copy"; // explicitly show this is a copy
        }
    };
    Controller.prototype.initDropZone = function () {
        var dropZone = View_1.View.getElementById1("dropZone");
        dropZone.addEventListener("dragover", Controller.fnHandleDragOver.bind(this), false);
        dropZone.addEventListener("drop", this.fnHandleFileSelect.bind(this), false);
        var canvasElement = this.oCanvas.getCanvas();
        canvasElement.addEventListener("dragover", Controller.fnHandleDragOver.bind(this), false); //TTT fast hack
        canvasElement.addEventListener("drop", this.fnHandleFileSelect.bind(this), false);
        View_1.View.getElementById1("fileInput").addEventListener("change", this.fnHandleFileSelect.bind(this), false);
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
        var sInput = this.view.getAreaValue("inputText"), sStackInput = this.inputStack.getInput();
        if (sStackInput !== sInput) {
            this.inputStack.save(sInput);
            this.fnUpdateUndoRedoButtons();
        }
    };
    Controller.prototype.startUpdateCanvas = function () {
        this.oCanvas.startUpdateCanvas();
    };
    Controller.prototype.stopUpdateCanvas = function () {
        this.oCanvas.stopUpdateCanvas();
    };
    Controller.prototype.virtualKeyboardCreate = function () {
        if (!this.oVirtualKeyboard) {
            this.oVirtualKeyboard = new VirtualKeyboard_1.VirtualKeyboard({
                fnPressCpcKey: this.oKeyboard.fnPressCpcKey.bind(this.oKeyboard),
                fnReleaseCpcKey: this.oKeyboard.fnReleaseCpcKey.bind(this.oKeyboard)
            });
        }
    };
    Controller.prototype.getVariable = function (sPar) {
        return this.oVariables.getVariable(sPar);
    };
    Controller.prototype.undoStackElement = function () {
        return this.inputStack.undo();
    };
    Controller.prototype.redoStackElement = function () {
        return this.inputStack.redo();
    };
    Controller.prototype.onDatabaseSelectChange = function () {
        var sUrl;
        var sDatabase = this.view.getSelectValue("databaseSelect");
        this.model.setProperty("database", sDatabase);
        this.view.setSelectTitleFromSelectedOption("databaseSelect");
        var oDatabase = this.model.getDatabase(), that = this, fnDatabaseLoaded = function () {
            oDatabase.loaded = true;
            Utils_1.Utils.console.log("fnDatabaseLoaded: database loaded: " + sDatabase + ": " + sUrl);
            that.setExampleSelectOptions();
            // TTT
            /*
            if (oDatabase.error) {
                Utils.console.error("fnDatabaseLoaded: database contains errors: " + sDatabase + ": " + sUrl);
                that.setInputText(oDatabase.script || "");
                that.view.setAreaValue("resultText", oDatabase.error);
            } else {
            */
            that.onExampleSelectChange();
            //}
        }, fnDatabaseError = function () {
            oDatabase.loaded = false;
            Utils_1.Utils.console.error("fnDatabaseError: database error: " + sDatabase + ": " + sUrl);
            that.setExampleSelectOptions();
            that.onExampleSelectChange();
            that.setInputText("");
            that.view.setAreaValue("resultText", "Cannot load database: " + sDatabase);
        };
        /*
        this.model.setProperty("database", sDatabase);
        this.view.setSelectTitleFromSelectedOption("databaseSelect");
        oDatabase = this.model.getDatabase();
        */
        if (!oDatabase) {
            Utils_1.Utils.console.error("onDatabaseSelectChange: database not available:", sDatabase);
            return;
        }
        if (oDatabase.text === "storage") { // sepcial handling: browser localStorage
            this.updateStorageDatabase("set", ""); // set all
            oDatabase.loaded = true;
        }
        if (oDatabase.loaded) {
            this.setExampleSelectOptions();
            this.onExampleSelectChange();
        }
        else {
            this.setInputText("#loading database " + sDatabase + "...");
            var sExampleIndex = this.model.getProperty("exampleIndex");
            sUrl = oDatabase.src + "/" + sExampleIndex;
            Utils_1.Utils.loadScript(sUrl, fnDatabaseLoaded, fnDatabaseError, sDatabase);
        }
    };
    Controller.prototype.onExampleSelectChange = function () {
        var oVm = this.oVm, oInFile = oVm.vmGetInFileObject(), sDataBase = this.model.getProperty("database");
        oVm.closein();
        oInFile.bOpen = true;
        var sExample = this.view.getSelectValue("exampleSelect");
        var oExample = this.model.getExample(sExample);
        oInFile.sCommand = "run";
        if (oExample && oExample.meta) { // TTT TODO: this is just a workaround, meta is in input now; should change command after loading!
            var sType = oExample.meta.charAt(0);
            if (sType === "B" || sType === "D" || sType === "G") { // binary, data only, Gena Assembler?
                oInFile.sCommand = "load";
            }
        }
        if (sDataBase !== "storage") {
            sExample = "/" + sExample; // load absolute
        }
        else {
            this.model.setProperty("example", sExample);
        }
        oInFile.sName = sExample;
        oInFile.iStart = undefined;
        oInFile.fnFileCallback = oVm.fnLoadHandler;
        oVm.vmStop("fileLoad", 90);
        this.startMainLoop();
    };
    // currently not used. Can be called manually: cpcBasic.controller.exportAsBase64(file);
    Controller.exportAsBase64 = function (sStorageName) {
        var oStorage = Utils_1.Utils.localStorage;
        var sData = oStorage.getItem(sStorageName), sOut = "";
        if (sData !== null) {
            var iIndex = sData.indexOf(","); // metadata separator
            if (iIndex >= 0) {
                var sMeta = sData.substr(0, iIndex);
                sData = sData.substr(iIndex + 1);
                sData = Utils_1.Utils.btoa(sData);
                sOut = sMeta + ";base64," + sData;
            }
            else { // hmm, no meta info
                sData = Utils_1.Utils.btoa(sData);
                sOut = "base64," + sData;
            }
        }
        Utils_1.Utils.console.log(sOut);
        return sOut;
    };
    Controller.prototype.onCpcCanvasClick = function (event) {
        this.oCanvas.onCpcCanvasClick(event);
        this.oKeyboard.setActive(true);
    };
    Controller.prototype.onWindowClick = function (event) {
        this.oCanvas.onWindowClick(event);
        this.oKeyboard.setActive(false);
    };
    Controller.sMetaIdent = "CPCBasic";
    Controller.aDefaultExtensions = [
        "",
        "bas",
        "bin"
    ];
    Controller.reRegExpIsText = new RegExp(/^\d+ |^[\t\r\n\x1a\x20-\x7e]*$/); // eslint-disable-line no-control-regex
    return Controller;
}());
exports.Controller = Controller;
//# sourceMappingURL=Controller.js.map