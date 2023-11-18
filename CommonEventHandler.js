// CommonEventHandler.ts - Common event handler for browser events
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
define(["require", "exports", "./Utils", "./View"], function (require, exports, Utils_1, View_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CommonEventHandler = void 0;
    var CommonEventHandler = /** @class */ (function () {
        function CommonEventHandler(options) {
            this.eventDefInternalMap = {};
            this.fnUserAction = undefined;
            this.options = {};
            this.setOptions(options);
            // copy for easy access:
            this.model = this.options.model;
            this.view = this.options.view;
            this.controller = this.options.controller;
            this.createEventDefMap();
        }
        CommonEventHandler.prototype.getOptions = function () {
            return this.options;
        };
        CommonEventHandler.prototype.setOptions = function (options) {
            Object.assign(this.options, options);
        };
        CommonEventHandler.prototype.fnSetUserAction = function (fnAction) {
            this.fnUserAction = fnAction;
        };
        CommonEventHandler.prototype.onGalleryButtonClick = function () {
            if (this.controller.toggleAreaHidden("galleryArea" /* ViewID.galleryArea */)) {
                this.controller.setGalleryAreaInputs();
            }
        };
        CommonEventHandler.prototype.fnUpdateAreaText = function (input) {
            this.controller.setInputText(input, true);
            this.view.setAreaValue("outputText" /* ViewID.outputText */, "");
        };
        CommonEventHandler.prototype.onUndoButtonClick = function () {
            var input = this.controller.undoStackElement();
            this.fnUpdateAreaText(input);
        };
        CommonEventHandler.prototype.onRedoButtonClick = function () {
            var input = this.controller.redoStackElement();
            this.fnUpdateAreaText(input);
        };
        CommonEventHandler.prototype.onContinueButtonClick = function (event) {
            this.controller.startContinue();
            this.controller.onCpcCanvasClick(event);
        };
        CommonEventHandler.prototype.onParseRunButtonClick = function (event) {
            this.controller.startParseRun();
            this.controller.onCpcCanvasClick(event);
        };
        CommonEventHandler.onHelpButtonClick = function () {
            window.open("https://github.com/benchmarko/CPCBasicTS/#readme");
        };
        CommonEventHandler.prototype.onGalleryItemClick = function (event) {
            var target = View_1.View.getEventTarget(event), value = target.value;
            this.view.setSelectValue("exampleSelect" /* ViewID.exampleSelect */, value);
            this.controller.toggleAreaHidden("galleryArea" /* ViewID.galleryArea */); // close
            this.controller.onExampleSelectChange();
        };
        // eslint-disable-next-line class-methods-use-this
        CommonEventHandler.prototype.onCopyTextButtonClick = function () {
            var textText = View_1.View.getElementByIdAs("textText" /* ViewID.textText */);
            textText.select();
            this.view.setAreaSelection("textText" /* ViewID.textText */, 0, 99999); // for mobile devices
            if (window.navigator && window.navigator.clipboard) {
                window.navigator.clipboard.writeText(textText.value);
            }
            else {
                Utils_1.Utils.console.warn("Copy to clipboard not available");
            }
        };
        CommonEventHandler.encodeUriParam = function (params) {
            var parts = [];
            for (var key in params) {
                if (params.hasOwnProperty(key)) {
                    var value = params[key];
                    parts[parts.length] = encodeURIComponent(key) + "=" + encodeURIComponent(value === null ? "" : value);
                }
            }
            return parts.join("&");
        };
        CommonEventHandler.prototype.onReloadButtonClick = function () {
            this.controller.setPopoversHiddenExcept(); // hide all popovers,
            var changed = this.model.getChangedProperties();
            var paras = CommonEventHandler.encodeUriParam(changed);
            paras = paras.replace(/%2[Ff]/g, "/"); // unescape %2F -> /
            window.location.search = "?" + paras;
        };
        CommonEventHandler.prototype.onVarSelectChange = function () {
            var par = this.view.getSelectValue("varSelect" /* ViewID.varSelect */), value = this.controller.getVariable(par), valueString = (value !== undefined) ? String(value) : "";
            this.view.setAreaValue("varText" /* ViewID.varText */, valueString);
        };
        CommonEventHandler.prototype.onKbdLayoutSelectChange = function () {
            var value = this.view.getSelectValue("kbdLayoutSelect" /* ViewID.kbdLayoutSelect */);
            this.model.setProperty("kbdLayout" /* ModelPropID.kbdLayout */, value);
            this.view.setSelectTitleFromSelectedOption("kbdLayoutSelect" /* ViewID.kbdLayoutSelect */);
            this.view.setHidden("kbdAlpha" /* ViewID.kbdAlpha */, value === "num");
            this.view.setHidden("kbdNum" /* ViewID.kbdNum */, value === "alpha");
        };
        CommonEventHandler.prototype.onBasicVersionSelectChange = function () {
            var value = this.view.getSelectValue("basicVersionSelect" /* ViewID.basicVersionSelect */);
            this.model.setProperty("basicVersion" /* ModelPropID.basicVersion */, value);
            this.view.setSelectTitleFromSelectedOption("basicVersionSelect" /* ViewID.basicVersionSelect */);
            this.controller.setBasicVersion(value);
        };
        CommonEventHandler.prototype.onPaletteSelectChange = function () {
            var value = this.view.getSelectValue("paletteSelect" /* ViewID.paletteSelect */);
            this.model.setProperty("palette" /* ModelPropID.palette */, value);
            this.view.setSelectTitleFromSelectedOption("paletteSelect" /* ViewID.paletteSelect */);
            this.controller.setPalette(value);
        };
        CommonEventHandler.prototype.onCanvasTypeSelectChange = function () {
            var value = this.view.getSelectValue("canvasTypeSelect" /* ViewID.canvasTypeSelect */);
            this.model.setProperty("canvasType" /* ModelPropID.canvasType */, value);
            this.view.setSelectTitleFromSelectedOption("canvasTypeSelect" /* ViewID.canvasTypeSelect */);
            this.controller.setCanvasType(value);
        };
        CommonEventHandler.prototype.onDebugInputChange = function () {
            var debug = this.view.getInputValue("debugInput" /* ViewID.debugInput */);
            this.model.setProperty("debug" /* ModelPropID.debug */, Number(debug));
            Utils_1.Utils.debug = Number(debug);
        };
        CommonEventHandler.prototype.onImplicitLinesInputChange = function () {
            var checked = this.view.getInputChecked("implicitLinesInput" /* ViewID.implicitLinesInput */);
            this.model.setProperty("implicitLines" /* ModelPropID.implicitLines */, checked);
            this.controller.fnImplicitLines();
        };
        CommonEventHandler.prototype.onArrayBoundsInputChange = function () {
            var checked = this.view.getInputChecked("arrayBoundsInput" /* ViewID.arrayBoundsInput */);
            this.model.setProperty("arrayBounds" /* ModelPropID.arrayBounds */, checked);
            this.controller.fnArrayBounds();
        };
        CommonEventHandler.prototype.onShowCpcInputChange = function () {
            if (this.controller.toggleAreaHidden("cpcArea" /* ViewID.cpcArea */)) {
                this.controller.startUpdateCanvas();
            }
            else {
                this.controller.stopUpdateCanvas();
            }
        };
        CommonEventHandler.prototype.onShowKbdInputChange = function () {
            if (this.controller.toggleAreaHidden("kbdArea" /* ViewID.kbdArea */)) {
                this.controller.getVirtualKeyboard(); // maybe draw it
            }
        };
        CommonEventHandler.prototype.onDisassInputChange = function () {
            var addressStr = this.view.getInputValue("disassInput" /* ViewID.disassInput */), addr = parseInt(addressStr, 16); // parse as hex
            this.controller.setDisassAddr(addr);
        };
        CommonEventHandler.prototype.onTraceInputChange = function () {
            var checked = this.view.getInputChecked("traceInput" /* ViewID.traceInput */);
            this.model.setProperty("trace" /* ModelPropID.trace */, checked);
            this.controller.fnTrace();
        };
        CommonEventHandler.prototype.onAutorunInputChange = function () {
            var checked = this.view.getInputChecked("autorunInput" /* ViewID.autorunInput */);
            this.model.setProperty("autorun" /* ModelPropID.autorun */, checked);
        };
        CommonEventHandler.prototype.onSoundInputChange = function () {
            var checked = this.view.getInputChecked("soundInput" /* ViewID.soundInput */);
            this.model.setProperty("sound" /* ModelPropID.sound */, checked);
            this.controller.setSoundActive();
        };
        CommonEventHandler.prototype.onSpeedInputChange = function () {
            var speed = this.view.getInputValue("speedInput" /* ViewID.speedInput */);
            this.model.setProperty("speed" /* ModelPropID.speed */, Number(speed));
            this.controller.fnSpeed();
        };
        CommonEventHandler.prototype.onScreenshotButtonClick = function () {
            var example = this.view.getSelectValue("exampleSelect" /* ViewID.exampleSelect */), image = this.controller.startScreenshot(), link = View_1.View.getElementById1("screenshotLink" /* ViewID.screenshotLink */), name = example + ".png";
            if (image) {
                link.setAttribute("download", name);
                link.setAttribute("href", image);
                link.click();
            }
        };
        CommonEventHandler.prototype.onClearInputButtonClick = function () {
            this.view.setAreaValue("inp2Text" /* ViewID.inp2Text */, ""); // delete input
        };
        CommonEventHandler.onFullscreenButtonClick = function () {
            var switched = View_1.View.requestFullscreenForId("cpcCanvas" /* ViewID.cpcCanvas */); // make sure to use an element with tabindex set to get keyboard events
            if (!switched) {
                Utils_1.Utils.console.warn("Switch to fullscreen not available");
            }
        };
        CommonEventHandler.prototype.createEventDefMap = function () {
            var eventDefInternalMap = this.eventDefInternalMap, eventDefs = {
                click: [
                    {
                        id: "clearInputButton" /* ViewID.clearInputButton */,
                        func: this.onClearInputButtonClick
                    },
                    {
                        id: "continueButton" /* ViewID.continueButton */,
                        func: this.onContinueButtonClick
                    },
                    {
                        id: "convertButton" /* ViewID.convertButton */,
                        toggleId: "convertArea" /* ViewID.convertArea */
                    },
                    {
                        id: "cpcCanvas" /* ViewID.cpcCanvas */,
                        controllerFunc: this.controller.onCpcCanvasClick
                    },
                    {
                        id: "copyTextButton" /* ViewID.copyTextButton */,
                        func: this.onCopyTextButtonClick
                    },
                    {
                        id: "downloadButton" /* ViewID.downloadButton */,
                        controllerFunc: this.controller.fnDownload
                    },
                    {
                        id: "enterButton" /* ViewID.enterButton */,
                        controllerFunc: this.controller.startEnter
                    },
                    {
                        id: "exportButton" /* ViewID.exportButton */,
                        toggleId: "exportArea" /* ViewID.exportArea */
                    },
                    {
                        id: "fullscreenButton" /* ViewID.fullscreenButton */,
                        func: CommonEventHandler.onFullscreenButtonClick
                    },
                    {
                        id: "galleryButton" /* ViewID.galleryButton */,
                        func: this.onGalleryButtonClick
                    },
                    {
                        id: "galleryItem" /* ViewID.galleryItem */,
                        func: this.onGalleryItemClick
                    },
                    {
                        id: "helpButton" /* ViewID.helpButton */,
                        func: CommonEventHandler.onHelpButtonClick
                    },
                    {
                        id: "lineNumberAddButton" /* ViewID.lineNumberAddButton */,
                        controllerFunc: this.controller.fnAddLines
                    },
                    {
                        id: "lineNumberRemoveButton" /* ViewID.lineNumberRemoveButton */,
                        controllerFunc: this.controller.fnRemoveLines
                    },
                    {
                        id: "moreButton" /* ViewID.moreButton */,
                        toggleId: "moreArea" /* ViewID.moreArea */
                    },
                    {
                        id: "parseButton" /* ViewID.parseButton */,
                        controllerFunc: this.controller.startParse
                    },
                    {
                        id: "parseRunButton" /* ViewID.parseRunButton */,
                        func: this.onParseRunButtonClick
                    },
                    {
                        id: "prettyButton" /* ViewID.prettyButton */,
                        controllerFunc: this.controller.fnPretty
                    },
                    {
                        id: "redoButton" /* ViewID.redoButton */,
                        func: this.onRedoButtonClick
                    },
                    {
                        id: "reloadButton" /* ViewID.reloadButton */,
                        func: this.onReloadButtonClick
                    },
                    {
                        id: "reloadButton2" /* ViewID.reloadButton2 */,
                        func: this.onReloadButtonClick // same as relaodButton
                    },
                    {
                        id: "renumButton" /* ViewID.renumButton */,
                        controllerFunc: this.controller.startRenum
                    },
                    {
                        id: "resetButton" /* ViewID.resetButton */,
                        controllerFunc: this.controller.startReset
                    },
                    {
                        id: "runButton" /* ViewID.runButton */,
                        controllerFunc: this.controller.startRun
                    },
                    {
                        id: "screenshotButton" /* ViewID.screenshotButton */,
                        func: this.onScreenshotButtonClick
                    },
                    {
                        id: "screenshotLink" /* ViewID.screenshotLink */ // nothing
                    },
                    {
                        id: "settingsButton" /* ViewID.settingsButton */,
                        toggleId: "settingsArea" /* ViewID.settingsArea */
                    },
                    {
                        id: "stopButton" /* ViewID.stopButton */,
                        controllerFunc: this.controller.startBreak
                    },
                    {
                        id: "textText" /* ViewID.textText */,
                        controllerFunc: this.controller.onCpcCanvasClick // same as for cpcCanvas
                    },
                    {
                        id: "undoButton" /* ViewID.undoButton */,
                        func: this.onUndoButtonClick
                    },
                    {
                        id: "viewButton" /* ViewID.viewButton */,
                        toggleId: "viewArea" /* ViewID.viewArea */
                    },
                    {
                        id: "window" /* ViewID.window */,
                        controllerFunc: this.controller.onWindowClick
                    }
                ],
                change: [
                    {
                        id: "arrayBoundsInput" /* ViewID.arrayBoundsInput */,
                        func: this.onArrayBoundsInputChange
                    },
                    {
                        id: "autorunInput" /* ViewID.autorunInput */,
                        func: this.onAutorunInputChange
                    },
                    {
                        id: "basicVersionSelect" /* ViewID.basicVersionSelect */,
                        func: this.onBasicVersionSelectChange
                    },
                    {
                        id: "canvasTypeSelect" /* ViewID.canvasTypeSelect */,
                        func: this.onCanvasTypeSelectChange
                    },
                    {
                        id: "databaseSelect" /* ViewID.databaseSelect */,
                        controllerFunc: this.controller.onDatabaseSelectChange
                    },
                    {
                        id: "debugInput" /* ViewID.debugInput */,
                        func: this.onDebugInputChange
                    },
                    {
                        id: "directorySelect" /* ViewID.directorySelect */,
                        controllerFunc: this.controller.onDirectorySelectChange
                    },
                    {
                        id: "disassInput" /* ViewID.disassInput */,
                        func: this.onDisassInputChange
                    },
                    {
                        id: "exampleSelect" /* ViewID.exampleSelect */,
                        controllerFunc: this.controller.onExampleSelectChange
                    },
                    {
                        id: "implicitLinesInput" /* ViewID.implicitLinesInput */,
                        func: this.onImplicitLinesInputChange
                    },
                    {
                        id: "kbdLayoutSelect" /* ViewID.kbdLayoutSelect */,
                        func: this.onKbdLayoutSelectChange
                    },
                    {
                        id: "outputText" /* ViewID.outputText */,
                        controllerFunc: this.controller.invalidateScript
                    },
                    {
                        id: "paletteSelect" /* ViewID.paletteSelect */,
                        func: this.onPaletteSelectChange
                    },
                    {
                        id: "showConsoleLogInput" /* ViewID.showConsoleLogInput */,
                        toggleId: "consoleLogArea" /* ViewID.consoleLogArea */
                    },
                    {
                        id: "showCpcInput" /* ViewID.showCpcInput */,
                        func: this.onShowCpcInputChange
                    },
                    {
                        id: "showDisassInput" /* ViewID.showDisassInput */,
                        toggleId: "disassArea" /* ViewID.disassArea */
                    },
                    {
                        id: "showInp2Input" /* ViewID.showInp2Input */,
                        toggleId: "inp2Area" /* ViewID.inp2Area */
                    },
                    {
                        id: "showInputInput" /* ViewID.showInputInput */,
                        toggleId: "inputArea" /* ViewID.inputArea */
                    },
                    {
                        id: "showKbdInput" /* ViewID.showKbdInput */,
                        func: this.onShowKbdInputChange
                    },
                    {
                        id: "showOutputInput" /* ViewID.showOutputInput */,
                        toggleId: "outputArea" /* ViewID.outputArea */
                    },
                    {
                        id: "showResultInput" /* ViewID.showResultInput */,
                        toggleId: "resultArea" /* ViewID.resultArea */
                    },
                    {
                        id: "showVariableInput" /* ViewID.showVariableInput */,
                        toggleId: "variableArea" /* ViewID.variableArea */
                    },
                    {
                        id: "soundInput" /* ViewID.soundInput */,
                        func: this.onSoundInputChange
                    },
                    {
                        id: "speedInput" /* ViewID.speedInput */,
                        func: this.onSpeedInputChange
                    },
                    {
                        id: "traceInput" /* ViewID.traceInput */,
                        func: this.onTraceInputChange
                    },
                    {
                        id: "varSelect" /* ViewID.varSelect */,
                        func: this.onVarSelectChange
                    },
                    {
                        id: "varText" /* ViewID.varText */,
                        controllerFunc: this.controller.changeVariable
                    }
                ]
            };
            for (var type in eventDefs) {
                if (eventDefs.hasOwnProperty(type)) {
                    eventDefInternalMap[type] = {};
                    var eventDefList = eventDefs[type], itemForType = eventDefInternalMap[type];
                    for (var i = 0; i < eventDefList.length; i += 1) {
                        itemForType[eventDefList[i].id] = eventDefList[i];
                    }
                }
            }
        };
        CommonEventHandler.prototype.handleEvent = function (event) {
            var target = View_1.View.getEventTarget(event), type = event.type; // click or change
            var id = (target) ? target.getAttribute("id") : String(target);
            if (this.fnUserAction) {
                this.fnUserAction(event, id);
            }
            if (id) {
                if (target.disabled) { // check needed for IE which also fires for disabled buttons
                    return; // ignore
                }
                if (id.startsWith("galleryItem")) {
                    id = "galleryItem"; // replace galleryitem<num> by galleryitem
                }
                if (this.eventDefInternalMap[type] && this.eventDefInternalMap[type][id]) {
                    var eventDef = this.eventDefInternalMap[type][id];
                    if (Utils_1.Utils.debug) {
                        Utils_1.Utils.console.debug("handleEvent: " + type + ", " + id + ":", eventDef);
                    }
                    if (eventDef.func) {
                        eventDef.func.call(this, event, eventDef);
                    }
                    else if (eventDef.controllerFunc) {
                        eventDef.controllerFunc.call(this.controller, event, eventDef);
                    }
                    else if (eventDef.toggleId) {
                        this.controller.toggleAreaHidden(eventDef.toggleId);
                    }
                }
                else if (!id.endsWith("Select") && !id.endsWith("Input")) { // do not print all messages; these are usually handled by change
                    Utils_1.Utils.console.log("handleEvent: " + type + ", " + id + ": No handler");
                }
            }
            else if (Utils_1.Utils.debug) {
                Utils_1.Utils.console.log("handleEvent: " + type + ": unknown target:", target.tagName, target.id);
            }
            if (type === "click") { // special
                if (id !== "cpcCanvas" /* ViewID.cpcCanvas */ && id !== "textText" /* ViewID.textText */) {
                    this.controller.onWindowClick(event);
                }
            }
        };
        return CommonEventHandler;
    }());
    exports.CommonEventHandler = CommonEventHandler;
});
//# sourceMappingURL=CommonEventHandler.js.map