// CommonEventHandler.ts - Common event handler for browser events
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
define(["require", "exports", "./Utils", "./View"], function (require, exports, Utils_1, View_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CommonEventHandler = void 0;
    var CommonEventHandler = /** @class */ (function () {
        function CommonEventHandler(options) {
            this.fnUserAction = undefined;
            /* eslint-disable no-invalid-this */
            this.handlers = {
                onConvertButtonClick: this.onConvertButtonClick,
                onSettingsButtonClick: this.onSettingsButtonClick,
                onViewButtonClick: this.onViewButtonClick,
                onExportButtonClick: this.onExportButtonClick,
                onGalleryButtonClick: this.onGalleryButtonClick,
                onMoreButtonClick: this.onMoreButtonClick,
                onParseButtonClick: this.onParseButtonClick,
                onRenumButtonClick: this.onRenumButtonClick,
                onPrettyButtonClick: this.onPrettyButtonClick,
                onLineNumberAddButtonClick: this.onLineNumberAddButtonClick,
                onLineNumberRemoveButtonClick: this.onLineNumberRemoveButtonClick,
                onUndoButtonClick: this.onUndoButtonClick,
                onRedoButtonClick: this.onRedoButtonClick,
                onDownloadButtonClick: this.onDownloadButtonClick,
                onRunButtonClick: this.onRunButtonClick,
                onStopButtonClick: this.onStopButtonClick,
                onContinueButtonClick: this.onContinueButtonClick,
                onResetButtonClick: this.onResetButtonClick,
                onParseRunButtonClick: this.onParseRunButtonClick,
                onHelpButtonClick: CommonEventHandler.onHelpButtonClick,
                onGalleryItemClick: this.onGalleryItemClick,
                onInputTextClick: CommonEventHandler.onNothing,
                onOutputTextClick: CommonEventHandler.onNothing,
                onResultTextClick: CommonEventHandler.onNothing,
                onVarTextClick: CommonEventHandler.onNothing,
                onOutputTextChange: this.onOutputTextChange,
                onReloadButtonClick: this.onReloadButtonClick,
                onReload2ButtonClick: this.onReloadButtonClick,
                onDatabaseSelectChange: this.onDatabaseSelectChange,
                onDirectorySelectChange: this.onDirectorySelectChange,
                onExampleSelectChange: this.onExampleSelectChange,
                onVarSelectChange: this.onVarSelectChange,
                onKbdLayoutSelectChange: this.onKbdLayoutSelectChange,
                onVarTextChange: this.onVarTextChange,
                onDebugInputChange: this.onDebugInputChange,
                onImplicitLinesInputChange: this.onImplicitLinesInputChange,
                onArrayBoundsInputChange: this.onArrayBoundsInputChange,
                onShowCpcInputChange: this.onShowCpcInputChange,
                onShowKbdInputChange: this.onShowKbdInputChange,
                onShowInp2InputChange: this.onShowInp2InputChange,
                onShowResultInputChange: this.onShowResultInputChange,
                onShowInputInputChange: this.onShowInputInputChange,
                onShowVariableInputChange: this.onShowVariableInputChange,
                onShowOutputInputChange: this.onShowOutputInputChange,
                onShowDisassInputChange: this.onShowDisassInputChange,
                onShowConsoleLogInputChange: this.onShowConsoleLogInputChange,
                onDisassInputChange: this.onDisassInputChange,
                onTraceInputChange: this.onTraceInputChange,
                onAutorunInputChange: this.onAutorunInputChange,
                onSoundInputChange: this.onSoundInputChange,
                onSpeedInputChange: this.onSpeedInputChange,
                onBasicVersionSelectChange: this.onBasicVersionSelectChange,
                onCanvasTypeSelectChange: this.onCanvasTypeSelectChange,
                onPaletteSelectChange: this.onPaletteSelectChange,
                onScreenshotButtonClick: this.onScreenshotButtonClick,
                onClearInputButtonClick: this.onClearInputButtonClick,
                onEnterButtonClick: this.onEnterButtonClick,
                onFullscreenButtonClick: CommonEventHandler.onFullscreenButtonClick,
                onCpcCanvasClick: this.onCpcCanvasClick,
                onWindowClick: this.onWindowClick,
                onTextTextClick: this.onTextTextClick,
                onCopyTextButtonClick: this.onCopyTextButtonClick
            };
            this.options = {};
            this.setOptions(options);
            // copy for easy access:
            this.model = this.options.model;
            this.view = this.options.view;
            this.controller = this.options.controller;
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
        CommonEventHandler.prototype.onConvertButtonClick = function () {
            this.controller.toggleAreaHidden("convertArea" /* ViewID.convertArea */);
        };
        CommonEventHandler.prototype.onSettingsButtonClick = function () {
            this.controller.toggleAreaHidden("settingsArea" /* ViewID.settingsArea */);
        };
        CommonEventHandler.prototype.onViewButtonClick = function () {
            this.controller.toggleAreaHidden("viewArea" /* ViewID.viewArea */);
        };
        CommonEventHandler.prototype.onExportButtonClick = function () {
            this.controller.toggleAreaHidden("exportArea" /* ViewID.exportArea */);
        };
        CommonEventHandler.prototype.onGalleryButtonClick = function () {
            if (this.controller.toggleAreaHidden("galleryArea" /* ViewID.galleryArea */)) {
                this.controller.setGalleryAreaInputs();
            }
        };
        CommonEventHandler.prototype.onMoreButtonClick = function () {
            this.controller.toggleAreaHidden("moreArea" /* ViewID.moreArea */);
        };
        CommonEventHandler.prototype.onParseButtonClick = function () {
            this.controller.startParse();
        };
        CommonEventHandler.prototype.onRenumButtonClick = function () {
            this.controller.startRenum();
        };
        CommonEventHandler.prototype.onPrettyButtonClick = function () {
            this.controller.fnPretty();
        };
        CommonEventHandler.prototype.onLineNumberAddButtonClick = function () {
            this.controller.fnAddLines();
        };
        CommonEventHandler.prototype.onLineNumberRemoveButtonClick = function () {
            this.controller.fnRemoveLines();
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
        CommonEventHandler.prototype.onDownloadButtonClick = function () {
            this.controller.fnDownload();
        };
        CommonEventHandler.prototype.onRunButtonClick = function () {
            this.controller.startRun();
        };
        CommonEventHandler.prototype.onStopButtonClick = function () {
            this.controller.startBreak();
        };
        CommonEventHandler.prototype.onContinueButtonClick = function (event) {
            this.controller.startContinue();
            this.onCpcCanvasClick(event);
        };
        CommonEventHandler.prototype.onResetButtonClick = function () {
            this.controller.startReset();
        };
        CommonEventHandler.prototype.onParseRunButtonClick = function (event) {
            this.controller.startParseRun();
            this.onCpcCanvasClick(event);
        };
        CommonEventHandler.onHelpButtonClick = function () {
            window.open("https://github.com/benchmarko/CPCBasicTS/#readme");
        };
        CommonEventHandler.prototype.onGalleryItemClick = function (event) {
            var target = View_1.View.getEventTarget(event), value = target.value;
            this.view.setSelectValue("exampleSelect" /* ViewID.exampleSelect */, value);
            this.controller.toggleAreaHidden("galleryArea" /* ViewID.galleryArea */); // close
            this.onExampleSelectChange();
        };
        CommonEventHandler.onNothing = function () {
            // nothing
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
        CommonEventHandler.prototype.onOutputTextChange = function () {
            this.controller.invalidateScript();
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
            //this.onSettingsButtonClick(); // close settings dialog
            this.controller.setPopoversHiddenExcept(); // hide all popovers,
            var changed = this.model.getChangedProperties();
            var paras = CommonEventHandler.encodeUriParam(changed);
            paras = paras.replace(/%2[Ff]/g, "/"); // unescape %2F -> /
            window.location.search = "?" + paras;
        };
        CommonEventHandler.prototype.onDatabaseSelectChange = function () {
            this.controller.onDatabaseSelectChange();
        };
        CommonEventHandler.prototype.onDirectorySelectChange = function () {
            this.controller.onDirectorySelectChange();
        };
        CommonEventHandler.prototype.onExampleSelectChange = function () {
            this.controller.onExampleSelectChange();
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
        CommonEventHandler.prototype.onVarTextChange = function () {
            this.controller.changeVariable();
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
        CommonEventHandler.prototype.onShowInp2InputChange = function () {
            this.controller.toggleAreaHidden("inp2Area" /* ViewID.inp2Area */);
        };
        CommonEventHandler.prototype.onShowResultInputChange = function () {
            this.controller.toggleAreaHidden("resultArea" /* ViewID.resultArea */);
        };
        CommonEventHandler.prototype.onShowInputInputChange = function () {
            this.controller.toggleAreaHidden("inputArea" /* ViewID.inputArea */);
        };
        CommonEventHandler.prototype.onShowVariableInputChange = function () {
            this.controller.toggleAreaHidden("variableArea" /* ViewID.variableArea */);
        };
        CommonEventHandler.prototype.onShowOutputInputChange = function () {
            this.controller.toggleAreaHidden("outputArea" /* ViewID.outputArea */);
        };
        CommonEventHandler.prototype.onShowDisassInputChange = function () {
            this.controller.toggleAreaHidden("disassArea" /* ViewID.disassArea */);
        };
        CommonEventHandler.prototype.onShowConsoleLogInputChange = function () {
            this.controller.toggleAreaHidden("consoleLogArea" /* ViewID.consoleLogArea */);
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
        CommonEventHandler.prototype.onEnterButtonClick = function () {
            this.controller.startEnter();
        };
        CommonEventHandler.onFullscreenButtonClick = function () {
            var switched = View_1.View.requestFullscreenForId("cpcCanvas" /* ViewID.cpcCanvas */); // make sure to use an element with tabindex set to get keyboard events
            if (!switched) {
                Utils_1.Utils.console.warn("Switch to fullscreen not available");
            }
        };
        CommonEventHandler.prototype.onCpcCanvasClick = function (event) {
            this.controller.onCpcCanvasClick(event);
        };
        CommonEventHandler.prototype.onWindowClick = function (event) {
            this.controller.onWindowClick(event);
        };
        CommonEventHandler.prototype.onTextTextClick = function (event) {
            this.controller.onCpcCanvasClick(event);
        };
        /* eslint-enable no-invalid-this */
        CommonEventHandler.prototype.handleEvent = function (event) {
            var target = View_1.View.getEventTarget(event), id = (target) ? target.getAttribute("id") : String(target), type = event.type; // click or change
            if (this.fnUserAction) {
                this.fnUserAction(event, id);
            }
            if (id) {
                if (!target.disabled) { // check needed for IE which also fires for disabled buttons
                    var idNoNum = id.replace(/\d+$/, ""), // remove a trailing number
                    handler = "on" + Utils_1.Utils.stringCapitalize(idNoNum) + Utils_1.Utils.stringCapitalize(type);
                    if (Utils_1.Utils.debug) {
                        Utils_1.Utils.console.debug("fnCommonEventHandler: handler=" + handler);
                    }
                    if (handler in this.handlers) {
                        this.handlers[handler].call(this, event);
                    }
                    else if (!handler.endsWith("SelectClick") && !handler.endsWith("InputClick")) { // do not print all messages
                        Utils_1.Utils.console.log("Event handler not found:", handler);
                    }
                }
            }
            else if ((target.getAttribute("data-key") !== null) && (event && event.currentTarget && event.currentTarget.id !== "kbdAreaInner" /* ViewID.kbdAreaInner */)) { // only for virtual buttons activated by keyboard (enter, space)
                this.controller.onVirtualKeyBoardClick(event); // e.g with enter
            }
            else if (Utils_1.Utils.debug) {
                Utils_1.Utils.console.debug("Event handler for", type, "unknown target:", target.tagName, target.id);
            }
            if (type === "click") { // special
                if (id !== "cpcCanvas" /* ViewID.cpcCanvas */ && id !== "textText" /* ViewID.textText */) {
                    this.onWindowClick(event);
                }
            }
        };
        return CommonEventHandler;
    }());
    exports.CommonEventHandler = CommonEventHandler;
});
//# sourceMappingURL=CommonEventHandler.js.map