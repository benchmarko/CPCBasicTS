// Constants.ts - Constants Module
// (c) Marco Vieth, 2023
// https://benchmarko.github.io/CPCBasicTS/
//
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ViewID = exports.ModelPropID = void 0;
    var ModelPropID;
    (function (ModelPropID) {
        ModelPropID["arrayBounds"] = "arrayBounds";
        ModelPropID["autorun"] = "autorun";
        ModelPropID["basicVersion"] = "basicVersion";
        ModelPropID["bench"] = "bench";
        ModelPropID["canvasType"] = "canvasType";
        ModelPropID["databaseDirs"] = "databaseDirs";
        ModelPropID["database"] = "database";
        ModelPropID["debug"] = "debug";
        ModelPropID["example"] = "example";
        ModelPropID["exampleIndex"] = "exampleIndex";
        ModelPropID["implicitLines"] = "implicitLines";
        ModelPropID["input"] = "input";
        ModelPropID["integerOverflow"] = "integerOverflow";
        ModelPropID["kbdLayout"] = "kbdLayout";
        ModelPropID["linesOnLoad"] = "linesOnLoad";
        ModelPropID["dragElements"] = "dragElements";
        ModelPropID["palette"] = "palette";
        ModelPropID["processFileImports"] = "processFileImports";
        ModelPropID["selectDataFiles"] = "selectDataFiles";
        ModelPropID["showConsoleLog"] = "showConsoleLog";
        ModelPropID["showConvert"] = "showConvert";
        ModelPropID["showCpc"] = "showCpc";
        ModelPropID["showDisass"] = "showDisass";
        ModelPropID["showExport"] = "showExport";
        ModelPropID["showGallery"] = "showGallery";
        ModelPropID["showInput"] = "showInput";
        ModelPropID["showInp2"] = "showInp2";
        ModelPropID["showKbd"] = "showKbd";
        ModelPropID["showKbdSettings"] = "showKbdSettings";
        ModelPropID["showMore"] = "showMore";
        ModelPropID["showOutput"] = "showOutput";
        ModelPropID["showResult"] = "showResult";
        ModelPropID["showSettings"] = "showSettings";
        ModelPropID["showVariable"] = "showVariable";
        ModelPropID["showView"] = "showView";
        ModelPropID["sound"] = "sound";
        ModelPropID["speed"] = "speed";
        ModelPropID["trace"] = "trace";
    })(ModelPropID = exports.ModelPropID || (exports.ModelPropID = {}));
    var ViewID;
    (function (ViewID) {
        ViewID["arrayBoundsInput"] = "arrayBoundsInput";
        ViewID["autorunInput"] = "autorunInput";
        ViewID["basicVersionSelect"] = "basicVersionSelect";
        ViewID["canvasTypeSelect"] = "canvasTypeSelect";
        ViewID["clearInputButton"] = "clearInputButton";
        ViewID["consoleLogArea"] = "consoleLogArea";
        ViewID["consoleLogText"] = "consoleLogText";
        ViewID["continueButton"] = "continueButton";
        ViewID["convertArea"] = "convertArea";
        ViewID["convertButton"] = "convertButton";
        ViewID["copyTextButton"] = "copyTextButton";
        ViewID["cpcArea"] = "cpcArea";
        ViewID["cpcCanvas"] = "cpcCanvas";
        ViewID["databaseSelect"] = "databaseSelect";
        ViewID["debugInput"] = "debugInput";
        ViewID["directorySelect"] = "directorySelect";
        ViewID["disassArea"] = "disassArea";
        ViewID["disassInput"] = "disassInput";
        ViewID["disassText"] = "disassText";
        ViewID["downloadButton"] = "downloadButton";
        ViewID["dropZone"] = "dropZone";
        ViewID["enterButton"] = "enterButton";
        ViewID["exampleSelect"] = "exampleSelect";
        ViewID["exportArea"] = "exportArea";
        ViewID["exportButton"] = "exportButton";
        ViewID["exportBase64Input"] = "exportBase64Input";
        ViewID["exportDSKInput"] = "exportDSKInput";
        ViewID["exportDSKFormatSelect"] = "exportDSKFormatSelect";
        ViewID["exportDSKStripEmptyInput"] = "exportDSKStripEmptyInput";
        ViewID["exportFileSelect"] = "exportFileSelect";
        ViewID["exportTokenizedInput"] = "exportTokenizedInput";
        ViewID["fileInput"] = "fileInput";
        ViewID["fullscreenButton"] = "fullscreenButton";
        ViewID["galleryArea"] = "galleryArea";
        ViewID["galleryAreaItems"] = "galleryAreaItems";
        ViewID["galleryButton"] = "galleryButton";
        ViewID["galleryItem"] = "galleryItem";
        ViewID["helpButton"] = "helpButton";
        ViewID["implicitLinesInput"] = "implicitLinesInput";
        ViewID["inp2Area"] = "inp2Area";
        ViewID["inp2Text"] = "inp2Text";
        ViewID["inputArea"] = "inputArea";
        ViewID["inputText"] = "inputText";
        ViewID["integerOverflowInput"] = "integerOverflowInput";
        ViewID["kbdAlpha"] = "kbdAlpha";
        ViewID["kbdArea"] = "kbdArea";
        ViewID["kbdAreaInner"] = "kbdAreaInner";
        ViewID["kbdLayoutSelect"] = "kbdLayoutSelect";
        ViewID["kbdNum"] = "kbdNum";
        ViewID["lineNumberAddButton"] = "lineNumberAddButton";
        ViewID["lineNumberRemoveButton"] = "lineNumberRemoveButton";
        ViewID["linesOnLoadInput"] = "linesOnLoadInput";
        ViewID["mainArea"] = "mainArea";
        ViewID["moreArea"] = "moreArea";
        ViewID["moreButton"] = "moreButton";
        ViewID["dragElementsInput"] = "dragElementsInput";
        ViewID["noCanvas"] = "noCanvas";
        ViewID["outputArea"] = "outputArea";
        ViewID["outputText"] = "outputText";
        ViewID["pageBody"] = "pageBody";
        ViewID["paletteSelect"] = "paletteSelect";
        ViewID["parseButton"] = "parseButton";
        ViewID["parseRunButton"] = "parseRunButton";
        ViewID["prettyBracketsInput"] = "prettyBracketsInput";
        ViewID["prettyButton"] = "prettyButton";
        ViewID["prettyColonsInput"] = "prettyColonsInput";
        ViewID["prettySpaceInput"] = "prettySpaceInput";
        ViewID["redoButton"] = "redoButton";
        ViewID["reloadButton"] = "reloadButton";
        ViewID["reload2Button"] = "reload2Button";
        ViewID["renumButton"] = "renumButton";
        ViewID["renumKeepInput"] = "renumKeepInput";
        ViewID["renumNewInput"] = "renumNewInput";
        ViewID["renumStartInput"] = "renumStartInput";
        ViewID["renumStepInput"] = "renumStepInput";
        ViewID["resetButton"] = "resetButton";
        ViewID["resultArea"] = "resultArea";
        ViewID["resultText"] = "resultText";
        ViewID["runButton"] = "runButton";
        ViewID["screenshotButton"] = "screenshotButton";
        ViewID["screenshotLink"] = "screenshotLink";
        ViewID["selectDataFilesInput"] = "selectDataFilesInput";
        ViewID["settingsArea"] = "settingsArea";
        ViewID["settingsButton"] = "settingsButton";
        ViewID["showConsoleLogInput"] = "showConsoleLogInput";
        ViewID["showCpcInput"] = "showCpcInput";
        ViewID["showDisassInput"] = "showDisassInput";
        ViewID["showInp2Input"] = "showInp2Input";
        ViewID["showInputInput"] = "showInputInput";
        ViewID["showKbdInput"] = "showKbdInput";
        ViewID["showOutputInput"] = "showOutputInput";
        ViewID["showResultInput"] = "showResultInput";
        ViewID["showVariableInput"] = "showVariableInput";
        ViewID["soundInput"] = "soundInput";
        ViewID["speedInput"] = "speedInput";
        ViewID["stopButton"] = "stopButton";
        ViewID["traceInput"] = "traceInput";
        ViewID["textCanvasDiv"] = "textCanvasDiv";
        ViewID["textText"] = "textText";
        ViewID["undoButton"] = "undoButton";
        ViewID["variableArea"] = "variableArea";
        ViewID["varSelect"] = "varSelect";
        ViewID["varText"] = "varText";
        ViewID["viewArea"] = "viewArea";
        ViewID["viewButton"] = "viewButton";
        ViewID["window"] = "window"; // for window.document
    })(ViewID = exports.ViewID || (exports.ViewID = {}));
});
//# sourceMappingURL=Constants.js.map