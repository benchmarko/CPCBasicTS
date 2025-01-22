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
        CommonEventHandler.prototype.initOneToggle = function (_type, id, eventDef) {
            if (eventDef.property) {
                if (eventDef.toggleId) {
                    var isEnabled = this.model.getProperty(eventDef.property);
                    this.view.setHidden(eventDef.toggleId, !isEnabled, eventDef.display);
                    if (Utils_1.Utils.debug > 3) {
                        Utils_1.Utils.console.debug("initToggles: setHidden: togglId:", eventDef.toggleId, ", property:", eventDef.property, ", hidden:", !isEnabled, ", display:", eventDef.display);
                    }
                }
                if (eventDef.viewType === "checked") {
                    var isEnabled2 = this.model.getProperty(eventDef.property);
                    this.view.setInputChecked(id, isEnabled2);
                    if (Utils_1.Utils.debug > 3) {
                        Utils_1.Utils.console.debug("initToggles: checked: id:", id, ", property:", eventDef.property, ", checked:", isEnabled2);
                    }
                }
                else if (eventDef.viewType === "select") {
                    var value = this.model.getProperty(eventDef.property);
                    this.view.setSelectValue(id, value);
                    if (Utils_1.Utils.debug > 3) {
                        Utils_1.Utils.console.debug("initToggles: select: id:", id, ", property:", eventDef.property, ", value:", value);
                    }
                }
                else if (eventDef.viewType === "numberInput") {
                    var value = this.model.getProperty(eventDef.property);
                    this.view.setInputValue(id, String(value));
                    if (Utils_1.Utils.debug > 3) {
                        Utils_1.Utils.console.debug("initToggles: numberInput: id:", id, ", property:", eventDef.property, ", value:", value);
                    }
                }
            }
        };
        CommonEventHandler.prototype.initToggles = function () {
            var eventDefInternalMap = this.eventDefInternalMap;
            for (var type in eventDefInternalMap) {
                if (eventDefInternalMap.hasOwnProperty(type)) {
                    var eventDefMap4Type = eventDefInternalMap[type];
                    for (var id in eventDefMap4Type) {
                        if (eventDefMap4Type.hasOwnProperty(id)) {
                            var eventDef = eventDefMap4Type[id];
                            this.initOneToggle(type, id, eventDef);
                        }
                    }
                }
            }
        };
        CommonEventHandler.getToggleId = function (eventDef) {
            if (!eventDef.toggleId) {
                Utils_1.Utils.console.error("getToggleId: id=" + eventDef.id + ": toggleId missing!");
                return ""; //TTT
            }
            return eventDef.toggleId;
        };
        CommonEventHandler.getproperty = function (eventDef) {
            if (!eventDef.property) {
                Utils_1.Utils.console.error("setPopoversHiddenExcept: id=" + eventDef.id + ": property missing!");
                return ""; //TTT
            }
            return eventDef.property;
        };
        CommonEventHandler.prototype.setPopoversHiddenExcept = function (exceptId) {
            var eventDefInternalMap = this.eventDefInternalMap, eventDefMapClick = eventDefInternalMap.click;
            for (var id in eventDefMapClick) {
                if (eventDefMapClick.hasOwnProperty(id)) {
                    var eventDef = eventDefMapClick[id];
                    if (eventDef.isPopover && (eventDef.toggleId !== exceptId)) {
                        var toggleId = CommonEventHandler.getToggleId(eventDef), property = CommonEventHandler.getproperty(eventDef);
                        if (!this.view.getHidden(toggleId)) {
                            // we cannot use toggleAreaHidden because it would be recursive
                            this.model.setProperty(property, false);
                            this.view.setHidden(toggleId, true, eventDef.display);
                        }
                    }
                }
            }
        };
        CommonEventHandler.prototype.toggleAreaHidden = function (eventDef) {
            var toggleId = CommonEventHandler.getToggleId(eventDef), property = CommonEventHandler.getproperty(eventDef), visible = !this.model.getProperty(property);
            this.model.setProperty(property, visible);
            this.view.setHidden(toggleId, !visible, eventDef.display);
            // on old browsers display "flex" is not available, so set default "" (="block"), if still hidden
            if (visible && eventDef.display === "flex" && this.view.getHidden(toggleId)) {
                this.view.setHidden(toggleId, !visible);
            }
            if (visible && eventDef.isPopover) {
                this.setPopoversHiddenExcept(toggleId);
            }
            return visible;
        };
        // maybe we can avoid this...
        CommonEventHandler.prototype.getEventDefById = function (type, id) {
            var eventDefForType = this.eventDefInternalMap[type], eventDef = eventDefForType[id];
            if (!eventDef) {
                Utils_1.Utils.console.error("getEventDefById: type=" + type + ", id=" + id + ": No eventDef!");
            }
            return eventDef;
        };
        CommonEventHandler.prototype.toggleAreaHiddenById = function (type, id) {
            var eventDef = this.getEventDefById(type, id);
            return this.toggleAreaHidden(eventDef);
        };
        CommonEventHandler.prototype.onCheckedChange = function (eventDef) {
            var id = eventDef.id, property = CommonEventHandler.getproperty(eventDef), checked = this.view.getInputChecked(id);
            this.model.setProperty(property, checked);
            return checked;
        };
        CommonEventHandler.prototype.onNumberInputChange = function (eventDef) {
            var id = eventDef.id, property = CommonEventHandler.getproperty(eventDef), valueAsString = this.view.getInputValue(id), value = Number(valueAsString);
            this.model.setProperty(property, value);
            return value;
        };
        CommonEventHandler.prototype.onSelectChange = function (eventDef) {
            var id = eventDef.id, property = CommonEventHandler.getproperty(eventDef), value = this.view.getSelectValue(id);
            this.model.setProperty(property, value);
            this.view.setSelectTitleFromSelectedOption(id);
            return value;
        };
        CommonEventHandler.prototype.onExportButtonClick = function (eventDef) {
            if (this.toggleAreaHidden(eventDef)) {
                this.controller.setExportSelectOptions("exportFileSelect" /* ViewID.exportFileSelect */);
            }
        };
        CommonEventHandler.prototype.onGalleryButtonClick = function (eventDef) {
            if (this.toggleAreaHidden(eventDef)) {
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
        CommonEventHandler.prototype.onContinueButtonClick = function (eventDef, event) {
            this.controller.startContinue();
            this.onCpcCanvasClick(eventDef, event);
        };
        CommonEventHandler.prototype.onParseRunButtonClick = function (eventDef, event) {
            this.controller.startParseRun();
            this.onCpcCanvasClick(eventDef, event);
        };
        CommonEventHandler.onHelpButtonClick = function () {
            window.open("https://github.com/benchmarko/CPCBasicTS/#readme");
        };
        CommonEventHandler.prototype.onGalleryItemClick = function (_eventDef, event) {
            var target = View_1.View.getEventTarget(event), value = target.value;
            this.view.setSelectValue("exampleSelect" /* ViewID.exampleSelect */, value);
            this.setPopoversHiddenExcept(); // close
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
            this.setPopoversHiddenExcept(); // hide all popovers,
            var changed = this.model.getChangedProperties();
            var paras = CommonEventHandler.encodeUriParam(changed);
            paras = paras.replace(/%2[Ff]/g, "/"); // unescape %2F -> /
            window.location.search = "?" + paras;
        };
        CommonEventHandler.prototype.onVarSelectChange = function () {
            var par = this.view.getSelectValue("varSelect" /* ViewID.varSelect */), value = this.controller.getVariable(par), valueString = (value !== undefined) ? String(value) : "";
            this.view.setAreaValue("varText" /* ViewID.varText */, valueString);
        };
        CommonEventHandler.prototype.onKbdLayoutSelectChange = function (eventDef) {
            var value = this.onSelectChange(eventDef);
            this.view.setHidden("kbdAlpha" /* ViewID.kbdAlpha */, value === "num");
            this.view.setHidden("kbdNum" /* ViewID.kbdNum */, value === "alpha");
        };
        CommonEventHandler.prototype.onBasicVersionSelectChange = function (eventDef) {
            var value = this.onSelectChange(eventDef);
            this.controller.setBasicVersion(value);
        };
        CommonEventHandler.prototype.onPaletteSelectChange = function (eventDef) {
            var value = this.onSelectChange(eventDef);
            this.controller.setPalette(value);
        };
        CommonEventHandler.prototype.onCanvasTypeSelectChange = function (eventDef) {
            var value = this.onSelectChange(eventDef);
            this.controller.setCanvasType(value);
        };
        CommonEventHandler.prototype.onDebugInputChange = function (eventDef) {
            var value = this.onNumberInputChange(eventDef);
            Utils_1.Utils.debug = value;
        };
        CommonEventHandler.prototype.onDragElementsInputChange = function (eventDef) {
            var checked = this.onCheckedChange(eventDef);
            this.controller.fnDragElementsActive(checked);
        };
        CommonEventHandler.prototype.onShowCpcInputChange = function (eventDef) {
            if (this.toggleAreaHidden(eventDef)) {
                this.controller.startUpdateCanvas();
            }
            else {
                this.controller.stopUpdateCanvas();
            }
        };
        CommonEventHandler.prototype.onShowKbdInputChange = function (eventDef) {
            if (this.toggleAreaHidden(eventDef)) {
                this.controller.getVirtualKeyboard(); // maybe draw it
            }
        };
        CommonEventHandler.prototype.onDisassInputChange = function () {
            var addressStr = this.view.getInputValue("disassInput" /* ViewID.disassInput */), addrList = addressStr.split("-"), // maybe range
            addr = parseInt(addrList[0], 16), // parse as hex
            endAddr = addrList[1] ? parseInt(addrList[1], 16) : undefined; // parse as hex
            this.controller.setDisassAddr(addr, endAddr);
        };
        CommonEventHandler.prototype.onSoundInputChange = function (eventDef) {
            this.onCheckedChange(eventDef);
            this.controller.setSoundActive();
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
        CommonEventHandler.prototype.onFullscreenButtonClick = function () {
            var id;
            if (!this.view.getHidden("cpcCanvas" /* ViewID.cpcCanvas */)) {
                id = "cpcCanvas" /* ViewID.cpcCanvas */;
            }
            else if (!this.view.getHidden("textText" /* ViewID.textText */)) {
                // for ViewID.textText (textArea), we use the surrounding div...
                id = "textCanvasDiv" /* ViewID.textCanvasDiv */;
            }
            else {
                Utils_1.Utils.console.warn("Fullscreen only possible for graphics or text canvas");
                return;
            }
            var switched = this.view.requestFullscreenForId(id); // make sure to use an element with tabindex set to get keyboard events
            if (!switched) {
                Utils_1.Utils.console.warn("Switch to fullscreen not available");
            }
        };
        CommonEventHandler.prototype.onCpcCanvasClick = function (_eventDef, event) {
            this.setPopoversHiddenExcept(); // hide all popovers
            this.controller.onCpcCanvasClick(event);
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
                        toggleId: "convertArea" /* ViewID.convertArea */,
                        property: "showConvert" /* ModelPropID.showConvert */,
                        display: "flex",
                        isPopover: true,
                        func: this.toggleAreaHidden
                    },
                    {
                        id: "cpcCanvas" /* ViewID.cpcCanvas */,
                        func: this.onCpcCanvasClick
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
                        toggleId: "exportArea" /* ViewID.exportArea */,
                        property: "showExport" /* ModelPropID.showExport */,
                        display: "flex",
                        isPopover: true,
                        func: this.onExportButtonClick
                    },
                    {
                        id: "fullscreenButton" /* ViewID.fullscreenButton */,
                        func: this.onFullscreenButtonClick
                    },
                    {
                        id: "galleryButton" /* ViewID.galleryButton */,
                        toggleId: "galleryArea" /* ViewID.galleryArea */,
                        property: "showGallery" /* ModelPropID.showGallery */,
                        display: "flex",
                        isPopover: true,
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
                        toggleId: "moreArea" /* ViewID.moreArea */,
                        property: "showMore" /* ModelPropID.showMore */,
                        display: "flex",
                        isPopover: true,
                        func: this.toggleAreaHidden
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
                        id: "reload2Button" /* ViewID.reload2Button */,
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
                        toggleId: "settingsArea" /* ViewID.settingsArea */,
                        property: "showSettings" /* ModelPropID.showSettings */,
                        display: "flex",
                        isPopover: true,
                        func: this.toggleAreaHidden
                    },
                    {
                        id: "stopButton" /* ViewID.stopButton */,
                        controllerFunc: this.controller.startBreak
                    },
                    {
                        id: "textText" /* ViewID.textText */,
                        func: this.onCpcCanvasClick // same as for cpcCanvas
                    },
                    {
                        id: "undoButton" /* ViewID.undoButton */,
                        func: this.onUndoButtonClick
                    },
                    {
                        id: "viewButton" /* ViewID.viewButton */,
                        toggleId: "viewArea" /* ViewID.viewArea */,
                        property: "showView" /* ModelPropID.showView */,
                        display: "flex",
                        isPopover: true,
                        func: this.toggleAreaHidden
                    },
                    {
                        id: "window" /* ViewID.window */,
                        controllerFunc: this.controller.onWindowClick
                    }
                ],
                change: [
                    {
                        id: "arrayBoundsInput" /* ViewID.arrayBoundsInput */,
                        viewType: "checked",
                        property: "arrayBounds" /* ModelPropID.arrayBounds */,
                        func: this.onCheckedChange,
                        controllerFunc: this.controller.fnArrayBounds
                    },
                    {
                        id: "autorunInput" /* ViewID.autorunInput */,
                        viewType: "checked",
                        property: "autorun" /* ModelPropID.autorun */,
                        func: this.onCheckedChange
                    },
                    {
                        id: "basicVersionSelect" /* ViewID.basicVersionSelect */,
                        viewType: "select",
                        property: "basicVersion" /* ModelPropID.basicVersion */,
                        func: this.onBasicVersionSelectChange
                    },
                    {
                        id: "canvasTypeSelect" /* ViewID.canvasTypeSelect */,
                        viewType: "select",
                        property: "canvasType" /* ModelPropID.canvasType */,
                        func: this.onCanvasTypeSelectChange
                    },
                    {
                        id: "databaseSelect" /* ViewID.databaseSelect */,
                        controllerFunc: this.controller.onDatabaseSelectChange
                    },
                    {
                        id: "debugInput" /* ViewID.debugInput */,
                        viewType: "numberInput",
                        property: "debug" /* ModelPropID.debug */,
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
                        viewType: "checked",
                        property: "implicitLines" /* ModelPropID.implicitLines */,
                        func: this.onCheckedChange,
                        controllerFunc: this.controller.fnImplicitLines
                    },
                    {
                        id: "integerOverflowInput" /* ViewID.integerOverflowInput */,
                        viewType: "checked",
                        property: "integerOverflow" /* ModelPropID.integerOverflow */,
                        func: this.onCheckedChange,
                        controllerFunc: this.controller.fnIntegerOverflow
                    },
                    {
                        id: "kbdLayoutSelect" /* ViewID.kbdLayoutSelect */,
                        viewType: "select",
                        property: "kbdLayout" /* ModelPropID.kbdLayout */,
                        func: this.onKbdLayoutSelectChange
                    },
                    {
                        id: "dragElementsInput" /* ViewID.dragElementsInput */,
                        viewType: "checked",
                        property: "dragElements" /* ModelPropID.dragElements */,
                        func: this.onDragElementsInputChange
                    },
                    {
                        id: "outputText" /* ViewID.outputText */,
                        controllerFunc: this.controller.invalidateScript
                    },
                    {
                        id: "paletteSelect" /* ViewID.paletteSelect */,
                        viewType: "select",
                        property: "palette" /* ModelPropID.palette */,
                        func: this.onPaletteSelectChange
                    },
                    {
                        id: "showConsoleLogInput" /* ViewID.showConsoleLogInput */,
                        viewType: "checked",
                        toggleId: "consoleLogArea" /* ViewID.consoleLogArea */,
                        property: "showConsoleLog" /* ModelPropID.showConsoleLog */,
                        func: this.toggleAreaHidden
                    },
                    {
                        id: "showCpcInput" /* ViewID.showCpcInput */,
                        viewType: "checked",
                        toggleId: "cpcArea" /* ViewID.cpcArea */,
                        property: "showCpc" /* ModelPropID.showCpc */,
                        func: this.onShowCpcInputChange
                    },
                    {
                        id: "showDisassInput" /* ViewID.showDisassInput */,
                        viewType: "checked",
                        toggleId: "disassArea" /* ViewID.disassArea */,
                        property: "showDisass" /* ModelPropID.showDisass */,
                        func: this.toggleAreaHidden
                    },
                    {
                        id: "showInp2Input" /* ViewID.showInp2Input */,
                        viewType: "checked",
                        toggleId: "inp2Area" /* ViewID.inp2Area */,
                        property: "showInp2" /* ModelPropID.showInp2 */,
                        func: this.toggleAreaHidden
                    },
                    {
                        id: "showInputInput" /* ViewID.showInputInput */,
                        viewType: "checked",
                        toggleId: "inputArea" /* ViewID.inputArea */,
                        property: "showInput" /* ModelPropID.showInput */,
                        func: this.toggleAreaHidden
                    },
                    {
                        id: "showKbdInput" /* ViewID.showKbdInput */,
                        viewType: "checked",
                        toggleId: "kbdArea" /* ViewID.kbdArea */,
                        property: "showKbd" /* ModelPropID.showKbd */,
                        func: this.onShowKbdInputChange
                    },
                    {
                        id: "showOutputInput" /* ViewID.showOutputInput */,
                        viewType: "checked",
                        toggleId: "outputArea" /* ViewID.outputArea */,
                        property: "showOutput" /* ModelPropID.showOutput */,
                        func: this.toggleAreaHidden
                    },
                    {
                        id: "showResultInput" /* ViewID.showResultInput */,
                        viewType: "checked",
                        toggleId: "resultArea" /* ViewID.resultArea */,
                        property: "showResult" /* ModelPropID.showResult */,
                        func: this.toggleAreaHidden
                    },
                    {
                        id: "showVariableInput" /* ViewID.showVariableInput */,
                        viewType: "checked",
                        toggleId: "variableArea" /* ViewID.variableArea */,
                        property: "showVariable" /* ModelPropID.showVariable */,
                        func: this.toggleAreaHidden
                    },
                    {
                        id: "soundInput" /* ViewID.soundInput */,
                        viewType: "checked",
                        property: "sound" /* ModelPropID.sound */,
                        func: this.onSoundInputChange
                    },
                    {
                        id: "speedInput" /* ViewID.speedInput */,
                        viewType: "numberInput",
                        property: "speed" /* ModelPropID.speed */,
                        func: this.onNumberInputChange,
                        controllerFunc: this.controller.fnSpeed
                    },
                    {
                        id: "traceInput" /* ViewID.traceInput */,
                        viewType: "checked",
                        property: "trace" /* ModelPropID.trace */,
                        func: this.onCheckedChange,
                        controllerFunc: this.controller.fnTrace
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
                        eventDef.func.call(this, eventDef, event);
                    }
                    if (eventDef.controllerFunc) {
                        eventDef.controllerFunc.call(this.controller, eventDef, event);
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