// CommonEventHandler.ts - Common event handler for browser events
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
define(["require", "exports", "./Utils", "./View"], function (require, exports, Utils_1, View_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CommonEventHandler = void 0;
    var CommonEventHandler = /** @class */ (function () {
        function CommonEventHandler(model, view, controller) {
            this.fnUserAction = undefined;
            /* eslint-disable no-invalid-this */
            this.handlers = {
                onInputButtonClick: this.onInputButtonClick,
                onInp2ButtonClick: this.onInp2ButtonClick,
                onOutputButtonClick: this.onOutputButtonClick,
                onResultButtonClick: this.onResultButtonClick,
                onTextButtonClick: this.onTextButtonClick,
                onVariableButtonClick: this.onVariableButtonClick,
                onCpcButtonClick: this.onCpcButtonClick,
                onConvertButtonClick: this.onConvertButtonClick,
                onSettingsButtonClick: this.onSettingsButtonClick,
                onGalleryButtonClick: this.onGalleryButtonClick,
                onMoreButtonClick: this.onMoreButtonClick,
                onKbdButtonClick: this.onKbdButtonClick,
                onConsoleButtonClick: this.onConsoleButtonClick,
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
                onDatabaseSelectChange: this.onDatabaseSelectChange,
                onDirectorySelectChange: this.onDirectorySelectChange,
                onExampleSelectChange: this.onExampleSelectChange,
                onVarSelectChange: this.onVarSelectChange,
                onKbdLayoutSelectChange: this.onKbdLayoutSelectChange,
                onVarTextChange: this.onVarTextChange,
                onDebugInputChange: this.onDebugInputChange,
                onImplicitLinesInputChange: this.onImplicitLinesInputChange,
                onArrayBoundsInputChange: this.onArrayBoundsInputChange,
                onConsoleLogInputChange: this.onConsoleLogInputChange,
                onTraceInputChange: this.onTraceInputChange,
                onAutorunInputChange: this.onAutorunInputChange,
                onSoundInputChange: this.onSoundInputChange,
                onSpeedInputChange: this.onSpeedInputChange,
                onPaletteSelectChange: this.onPaletteSelectChange,
                onScreenshotButtonClick: this.onScreenshotButtonClick,
                onEnterButtonClick: this.onEnterButtonClick,
                onFullscreenButtonClick: CommonEventHandler.onFullscreenButtonClick,
                onCpcCanvasClick: this.onCpcCanvasClick,
                onWindowClick: this.onWindowClick,
                onTextTextClick: this.onTextTextClick,
                onCopyTextButtonClick: this.onCopyTextButtonClick
            };
            this.model = model;
            this.view = view;
            this.controller = controller;
        }
        CommonEventHandler.prototype.fnSetUserAction = function (fnAction) {
            this.fnUserAction = fnAction;
        };
        CommonEventHandler.prototype.onInputButtonClick = function () {
            this.controller.toggleAreaHidden("inputArea");
        };
        CommonEventHandler.prototype.onInp2ButtonClick = function () {
            this.controller.toggleAreaHidden("inp2Area");
        };
        CommonEventHandler.prototype.onOutputButtonClick = function () {
            this.controller.toggleAreaHidden("outputArea");
        };
        CommonEventHandler.prototype.onResultButtonClick = function () {
            this.controller.toggleAreaHidden("resultArea");
        };
        CommonEventHandler.prototype.onTextButtonClick = function () {
            if (this.controller.toggleAreaHidden("textArea")) {
                this.controller.startUpdateTextCanvas();
            }
            else {
                this.controller.stopUpdateTextCanvas();
            }
        };
        CommonEventHandler.prototype.onVariableButtonClick = function () {
            this.controller.toggleAreaHidden("variableArea");
        };
        CommonEventHandler.prototype.onCpcButtonClick = function () {
            if (this.controller.toggleAreaHidden("cpcArea")) {
                this.controller.startUpdateCanvas();
            }
            else {
                this.controller.stopUpdateCanvas();
            }
        };
        CommonEventHandler.prototype.onConvertButtonClick = function () {
            this.controller.toggleAreaHidden("convertArea");
        };
        CommonEventHandler.prototype.onSettingsButtonClick = function () {
            this.controller.toggleAreaHidden("settingsArea");
        };
        CommonEventHandler.prototype.onGalleryButtonClick = function () {
            if (this.controller.toggleAreaHidden("galleryArea")) {
                this.controller.setGalleryAreaInputs();
            }
        };
        CommonEventHandler.prototype.onMoreButtonClick = function () {
            this.controller.toggleAreaHidden("moreArea");
        };
        CommonEventHandler.prototype.onKbdButtonClick = function () {
            if (this.controller.toggleAreaHidden("kbdArea")) {
                this.controller.virtualKeyboardCreate(); // maybe draw it
                this.view.setHidden("kbdLayoutArea", true, "inherit"); // kbd visible => kbdlayout invisible
            }
            else {
                this.view.setHidden("kbdLayoutArea", false, "inherit");
            }
        };
        CommonEventHandler.prototype.onConsoleButtonClick = function () {
            this.controller.toggleAreaHidden("consoleArea");
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
            this.view.setAreaValue("outputText", "");
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
            this.view.setSelectValue("exampleSelect", value);
            this.controller.toggleAreaHidden("galleryArea"); // close
            this.onExampleSelectChange();
        };
        CommonEventHandler.onNothing = function () {
            // nothing
        };
        // eslint-disable-next-line class-methods-use-this
        CommonEventHandler.prototype.onCopyTextButtonClick = function () {
            var textText = View_1.View.getElementByIdAs("textText");
            textText.select();
            this.view.setAreaSelection("textText", 0, 99999); // for mobile devices
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
            var par = this.view.getSelectValue("varSelect"), value = this.controller.getVariable(par), valueString = (value !== undefined) ? String(value) : "";
            this.view.setAreaValue("varText", valueString);
        };
        CommonEventHandler.prototype.onKbdLayoutSelectChange = function () {
            var value = this.view.getSelectValue("kbdLayoutSelect");
            this.model.setProperty("kbdLayout", value);
            this.view.setSelectTitleFromSelectedOption("kbdLayoutSelect");
            this.view.setHidden("kbdAlpha", value === "num");
            this.view.setHidden("kbdNum", value === "alpha");
        };
        CommonEventHandler.prototype.onPaletteSelectChange = function () {
            var value = this.view.getSelectValue("paletteSelect");
            this.model.setProperty("palette", value);
            this.view.setSelectTitleFromSelectedOption("paletteSelect");
            this.controller.setPalette(value);
        };
        CommonEventHandler.prototype.onVarTextChange = function () {
            this.controller.changeVariable();
        };
        CommonEventHandler.prototype.onDebugInputChange = function () {
            var debug = this.view.getInputValue("debugInput");
            this.model.setProperty("debug", Number(debug));
            Utils_1.Utils.debug = Number(debug);
        };
        CommonEventHandler.prototype.onImplicitLinesInputChange = function () {
            var checked = this.view.getInputChecked("implicitLinesInput");
            this.model.setProperty("implicitLines", checked);
            this.controller.fnImplicitLines();
        };
        CommonEventHandler.prototype.onArrayBoundsInputChange = function () {
            var checked = this.view.getInputChecked("arrayBoundsInput");
            this.model.setProperty("arrayBounds", checked);
            this.controller.fnArrayBounds();
        };
        CommonEventHandler.prototype.onConsoleLogInputChange = function () {
            var checked = this.view.getInputChecked("consoleLogInput");
            this.model.setProperty("showConsole", checked);
            if (checked && this.view.getHidden("consoleBox")) {
                this.view.setHidden("consoleBox", !checked); // make sure the box around is visible
            }
        };
        CommonEventHandler.prototype.onTraceInputChange = function () {
            var checked = this.view.getInputChecked("traceInput");
            this.model.setProperty("trace", checked);
            this.controller.fnTrace();
        };
        CommonEventHandler.prototype.onAutorunInputChange = function () {
            var checked = this.view.getInputChecked("autorunInput");
            this.model.setProperty("autorun", checked);
        };
        CommonEventHandler.prototype.onSoundInputChange = function () {
            var checked = this.view.getInputChecked("soundInput");
            this.model.setProperty("sound", checked);
            this.controller.setSoundActive();
        };
        CommonEventHandler.prototype.onSpeedInputChange = function () {
            var speed = this.view.getInputValue("speedInput");
            this.model.setProperty("speed", Number(speed));
            this.controller.fnSpeed();
        };
        CommonEventHandler.prototype.onScreenshotButtonClick = function () {
            var example = this.view.getSelectValue("exampleSelect"), image = this.controller.startScreenshot(), link = View_1.View.getElementById1("screenshotLink"), name = example + ".png";
            if (image) {
                link.setAttribute("download", name);
                link.setAttribute("href", image);
                link.click();
            }
        };
        CommonEventHandler.prototype.onEnterButtonClick = function () {
            this.controller.startEnter();
        };
        CommonEventHandler.onFullscreenButtonClick = function () {
            var switched = View_1.View.requestFullscreenForId("cpcCanvas"); // make sure to use an element with tabindex set to get keyboard events
            //const switched = View.requestFullscreenForId("cpcCanvasDiv");
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
            this.controller.onTextTextClick(event);
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
            else if (target.getAttribute("data-key") === null) { // not for keyboard buttons
                if (Utils_1.Utils.debug) {
                    Utils_1.Utils.console.debug("Event handler for", type, "unknown target:", target.tagName, target.id);
                }
            }
            if (type === "click") { // special
                if (id !== "cpcCanvas" && id !== "textText") {
                    this.onWindowClick(event);
                }
            }
        };
        return CommonEventHandler;
    }());
    exports.CommonEventHandler = CommonEventHandler;
});
//# sourceMappingURL=CommonEventHandler.js.map