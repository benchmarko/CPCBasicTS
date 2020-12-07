// Controller.js - Controller
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasic/
//
/* globals Uint8Array */

import { Utils } from "./Utils";
import { BasicFormatter } from "./BasicFormatter";
import { BasicLexer } from "./BasicLexer";
import { BasicParser } from "./BasicParser";
import { BasicTokenizer } from "./BasicTokenizer";
import { Canvas } from "./Canvas";
import { CodeGeneratorBasic } from "./CodeGeneratorBasic";
import { CodeGeneratorJs } from "./CodeGeneratorJs";
import { CommonEventHandler } from "./CommonEventHandler";
import { cpcCharset } from "./cpcCharset";
import { CpcVm, StopEntry, StopParas } from "./CpcVm";
import { CpcVmRsx } from "./CpcVmRsx";
import { Diff } from "./Diff";
import { DiskImage } from "./DiskImage";
import { InputStack } from "./InputStack";
import { Keyboard } from "./Keyboard";
import { Model } from "./Model";
import { Sound } from "./Sound";
import { Variables } from "./Variables";
import { View, SelectOptionElement } from "./View";

import { ZipFile } from "./ZipFile";

export class Controller {
	fnRunLoopHandler: undefined;
	fnWaitKeyHandler: undefined;
	fnWaitInputHandler: undefined;
	fnOnEscapeHandler: undefined;
	fnDirectInputHandler: undefined;
	fnPutKeyInBufferHandler: undefined;

	sMetaIdent = "CPCBasic";

	fnScript = undefined;

	bTimeoutHandlerActive = false;
	iNextLoopTimeOut = 0; // next timeout for the main loop

	bInputSet = false;

	oVariables: Variables;

	oBasicFormatter: BasicFormatter;

	oBasicTokenizer: BasicTokenizer;
	model: Model;
	view: View;
	commonEventHandler: CommonEventHandler;

	oCodeGeneratorJs: CodeGeneratorJs;

	oCanvas: Canvas;

	inputStack: InputStack;

	oKeyboard: Keyboard;
	oSound: Sound;

	oVm: CpcVm;
	oRsx: CpcVmRsx;

	oNoStop: StopEntry;
	oSavedStop: StopEntry; // backup of stop object


	constructor(oModel: Model, oView: View) {
		this.fnRunLoopHandler = this.fnRunLoop.bind(this);
		this.fnWaitKeyHandler = this.fnWaitKey.bind(this);
		this.fnWaitInputHandler = this.fnWaitInput.bind(this);
		this.fnOnEscapeHandler = this.fnOnEscape.bind(this);
		this.fnDirectInputHandler = this.fnDirectInput.bind(this);
		this.fnPutKeyInBufferHandler = this.fnPutKeyInBuffer.bind(this);
		this.init(oModel, oView);
	}

	init(oModel: Model, oView: View): void {
		//this.sMetaIdent = "CPCBasic";

		this.fnScript = undefined;

		this.bTimeoutHandlerActive = false;
		this.iNextLoopTimeOut = 0; // next timeout for the main loop

		this.bInputSet = false;

		this.oVariables = new Variables();

		this.model = oModel;
		this.view = oView;
		this.commonEventHandler = new CommonEventHandler(oModel, oView, this);

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
		this.oCanvas = new Canvas({
			aCharset: cpcCharset,
			//cpcDivId: "cpcArea",
			onClickKey: this.fnPutKeyInBufferHandler
		});
		oView.setHidden("cpcArea", !oModel.getProperty("showCpc"));

		const sKbdLayout = oModel.getStringProperty("kbdLayout");

		oView.setSelectValue("kbdLayoutSelect", sKbdLayout);
		this.commonEventHandler.onKbdLayoutSelectChange();

		this.inputStack = new InputStack();

		this.oKeyboard = new Keyboard({
			fnOnEscapeHandler: this.fnOnEscapeHandler
		});
		if (this.model.getProperty("showKbd")) { // maybe we need to draw virtual keyboard
			this.oKeyboard.virtualKeyboardCreate();
		}

		this.oSound = new Sound();
		this.commonEventHandler.fnActivateUserAction(this.onUserAction.bind(this)); // check first user action, also if sound is not yet on

		const sExample = oModel.getStringProperty("example");

		oView.setSelectValue("exampleSelect", sExample);

		this.oVm = new CpcVm({
			canvas: this.oCanvas,
			keyboard: this.oKeyboard,
			sound: this.oSound,
			variables: this.oVariables,
			tron: oModel.getBooleanProperty("tron")
		});
		this.oVm.vmReset();

		this.oRsx = new CpcVmRsx(this.oVm);
		this.oVm.vmSetRsxClass(this.oRsx); //TTT

		this.oNoStop = Object.assign({}, this.oVm.vmGetStopObject());
		this.oSavedStop = { //TTT
			sReason: "",
			iPriority: 0
		}; // backup of stop object
		this.setStopObject(this.oNoStop);

		this.oCodeGeneratorJs = new CodeGeneratorJs({
			lexer: new BasicLexer(),
			parser: new BasicParser(),
			tron: this.model.getBooleanProperty("tron"),
			rsx: this.oRsx // just to check the names
		});

		this.oBasicTokenizer = new BasicTokenizer(); // for tokenized BASIC

		this.initDatabases();
		if (oModel.getProperty("sound")) { // activate sound needs user action
			this.setSoundActive(); // activate in waiting state
		}
		if (oModel.getProperty("showCpc")) {
			this.oCanvas.startUpdateCanvas();
		}

		this.initDropZone();
	}

	private initDatabases() {
		var oModel = this.model,
			oDatabases = {},
			aDatabaseDirs, i, sDatabaseDir, aParts, sName;

		aDatabaseDirs = oModel.getStringProperty("databaseDirs").split(",");
		for (i = 0; i < aDatabaseDirs.length; i += 1) {
			sDatabaseDir = aDatabaseDirs[i];
			aParts = sDatabaseDir.split("/");
			sName = aParts[aParts.length - 1];
			oDatabases[sName] = {
				text: sName,
				title: sDatabaseDir,
				src: sDatabaseDir
			};
		}
		this.model.addDatabases(oDatabases);

		this.setDatabaseSelectOptions();
		this.commonEventHandler.onDatabaseSelectChange();
	}

	private onUserAction(/* event, sId */) {
		this.commonEventHandler.fnDeactivateUserAction();
		this.oSound.setActivatedByUser();
		this.setSoundActive();
	}

	// Also called from index file 0index.js
	addIndex(sDir: string, sInput: string) { // sDir maybe ""
		sInput = sInput.trim();

		const aIndex = JSON.parse(sInput);

		for (let i = 0; i < aIndex.length; i += 1) {
			aIndex[i].dir = sDir;
			this.model.setExample(aIndex[i]);
		}
	}

	// Also called from example files xxxxx.js
	addItem(sKey: string, sInput: string) { // sKey maybe ""
		if (!sKey) { // maybe ""
			sKey = this.model.getStringProperty("example");
		}

		const oExample = this.model.getExample(sKey);

		sInput = sInput.replace(/^\n/, "").replace(/\n$/, ""); // remove preceding and trailing newlines
		// beware of data files ending with newlines! (no trimEnd)

		oExample.key = sKey; // maybe changed
		oExample.script = sInput;
		oExample.loaded = true;
		Utils.console.log("addItem:", sKey);
		return sKey;
	}

	private setDatabaseSelectOptions() {
		const sSelect = "databaseSelect",
			aItems: SelectOptionElement[] = [],
			oDatabases = this.model.getAllDatabases(),
			sDatabase = this.model.getProperty("database");

		for (const sValue in oDatabases) {
			if (oDatabases.hasOwnProperty(sValue)) {
				const oDb = oDatabases[sValue],
					oItem: SelectOptionElement = {
						value: sValue,
						text: oDb.text,
						title: oDb.title,
						selected: sValue === sDatabase
					};

				/*
				if (sValue === sDatabase) {
					oItem.selected = true;
				}
				*/
				aItems.push(oItem);
			}
		}
		this.view.setSelectOptions(sSelect, aItems);
	}

	setExampleSelectOptions(): void {
		const iMaxTitleLength = 160,
			iMaxTextLength = 60, // (32 visible?)
			sSelect = "exampleSelect",
			aItems: SelectOptionElement[] = [],
			sExample = this.model.getProperty("example"),
			oAllExamples = this.model.getAllExamples();

		let bExampleSelected = false;

		for (const sKey in oAllExamples) {
			if (oAllExamples.hasOwnProperty(sKey)) {
				const oExample = oAllExamples[sKey];

				if (oExample.meta !== "D") { // skip data files
					const sTitle = (oExample.key + ": " + oExample.title).substr(0, iMaxTitleLength),
						oItem: SelectOptionElement = {
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
	}

	private setVarSelectOptions(sSelect: string, oVariables: Variables) {
		const iMaxVarLength = 35,
			aVarNames = oVariables.getAllVariableNames(),
			aItems: SelectOptionElement[] = [],

			fnSortByStringProperties = function (a: SelectOptionElement, b: SelectOptionElement) { // can be used without "this" context
				const x = a.value,
					y = b.value;

				if (x < y) {
					return -1;
				} else if (x > y) {
					return 1;
				}
				return 0;
			};

		for (let i = 0; i < aVarNames.length; i += 1) {
			const sKey = aVarNames[i],
				sValue = oVariables.getVariable(sKey),
				sTitle = sKey + "=" + sValue;

			let sStrippedTitle = sTitle.substr(0, iMaxVarLength); // limit length

			if (sTitle !== sStrippedTitle) {
				sStrippedTitle += " ...";
			}

			const oItem: SelectOptionElement = {
				value: sKey,
				text: sStrippedTitle,
				title: sStrippedTitle,
				selected: false //TTT
			};

			oItem.text = oItem.title;
			aItems.push(oItem);
		}
		aItems.sort(fnSortByStringProperties);
		this.view.setSelectOptions(sSelect, aItems);
	}

	updateStorageDatabase(sAction: string, sKey: string) {
		var sDatabase = this.model.getProperty("database"),
			oStorage = Utils.localStorage,
			aDir, sData, oData; //

		if (!sKey) { // no sKey => get all
			aDir = this.fnGetDirectoryEntries();
		} else {
			aDir = [sKey];
		}

		for (let i = 0; i < aDir.length; i += 1) {
			sKey = aDir[i];
			if (sAction === "remove") {
				this.model.removeExample(sKey);
			} else if (sAction === "set") {
				let oExample = this.model.getExample(sKey);

				if (!oExample) {
					sData = oStorage.getItem(sKey);
					oData = this.splitMeta(sData);
					oExample = {
						key: sKey,
						title: "", // or set sKey?
						meta: oData.oMeta.sType, // currently we take only the type
						type: undefined //TTT for what?
					};
					this.model.setExample(oExample);
				}
			} else {
				Utils.console.error("updateStorageDatabase: unknown action", sAction);
			}
		}

		if (sDatabase === "storage") {
			this.setExampleSelectOptions();
		}
	}

	setInputText(sInput: string, bKeepStack?: boolean) {
		this.view.setAreaValue("inputText", sInput);
		if (!bKeepStack) {
			this.fnInitUndoRedoButtons();
		} else {
			this.fnUpdateUndoRedoButtons();
		}
	}

	invalidateScript() {
		this.fnScript = undefined;
	}

	private fnWaitForContinue() {
		const iStream = 0,
			sKey = this.oKeyboard.getKeyFromBuffer();

		if (sKey !== "") {
			this.oVm.cursor(iStream, 0);
			this.oKeyboard.setKeyDownHandler(null);
			this.startContinue();
		}
	}

	private fnOnEscape() {
		const oStop = this.oVm.vmGetStopObject(),
			iStream = 0;

		if (this.oVm.vmOnBreakContSet()) {
			// ignore break
		} else if (oStop.sReason === "direct" || this.oVm.vmOnBreakHandlerActive()) {
			if (!oStop.oParas) {
				oStop.oParas = {};
			}
			oStop.oParas.sInput = "";
			const sMsg = "*Break*\r\n";

			this.oVm.print(iStream, sMsg);
		} else if (oStop.sReason !== "escape") { // first escape?
			this.oVm.cursor(iStream, 1);
			this.oKeyboard.clearInput();
			this.oKeyboard.setKeyDownHandler(this.fnWaitForContinue.bind(this));
			this.setStopObject(oStop);
			this.oVm.vmStop("escape", 85, false, {
				iStream: iStream
			});
		} else { // second escape
			this.oKeyboard.setKeyDownHandler(null);
			this.oVm.cursor(iStream, 0);

			const oSavedStop = this.getStopObject();

			if (oSavedStop.sReason === "waitInput") { // sepcial handling: set line to repeat input
				this.oVm.vmGotoLine(oSavedStop.oParas.iLine);
			}

			if (!this.oVm.vmEscape()) {
				this.oVm.vmStop("", 0, true); // continue program, in break handler?
				this.setStopObject(this.oNoStop);
			} else {
				this.oVm.vmStop("stop", 0, true); // stop
				const sMsg = "Break in " + this.oVm.iLine + "\r\n";

				this.oVm.print(iStream, sMsg);
			}
		}

		this.startMainLoop();
	}

	private fnWaitSound() { // rather fnEvent
		var oStop = this.oVm.vmGetStopObject(),
			aSoundData;

		this.oVm.vmLoopCondition(); // update iNextFrameTime, timers, inks; schedule sound: free queue
		if (this.oSound.isActivatedByUser()) { // only if activated
			aSoundData = this.oVm.vmGetSoundData();
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
	}

	private fnWaitKey() {
		const sKey = this.oKeyboard.getKeyFromBuffer();

		if (sKey !== "") { // do we have a key from the buffer already?
			Utils.console.log("Wait for key:", sKey);
			this.oVm.vmStop("", 0, true);
			this.oKeyboard.setKeyDownHandler(null);
		} else {
			this.fnWaitSound(); // sound and blinking events
			this.oKeyboard.setKeyDownHandler(this.fnWaitKeyHandler); // wait until keypress handler (for call &bb18)
		}
		return sKey;
	}

	private fnWaitInput() { // eslint-disable-line complexity
		const oStop = this.oVm.vmGetStopObject(),
			oInput = oStop.oParas,
			iStream = oInput.iStream;
		let sInput = oInput.sInput,
			sKey: string;

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
				} else {
					sKey = "\x07"; // ignore BS, use BEL
				}
				break;
			case "\xe0": // copy
				sKey = this.oVm.copychr$(iStream);
				if (sKey.length) {
					sInput += sKey;
					sKey = "\x09"; // TAB
				} else {
					sKey = "\x07"; // ignore (BEL)
				}
				break;
			case "\xf0": // cursor up
				if (!sInput.length) {
					sKey = "\x0b"; // VT
				} else {
					sKey = "\x07"; // ignore (BEL)
				}
				break;
			case "\xf1": // cursor down
				if (!sInput.length) {
					sKey = "\x0a"; // LF
				} else {
					sKey = "\x07"; // ignore (BEL)
				}
				break;
			case "\xf2": // cursor left
				if (!sInput.length) {
					sKey = "\x08"; // BS
				} else {
					sKey = "\x07"; // ignore (BEL) TODO
				}
				break;
			case "\xf3": // cursor right
				if (!sInput.length) {
					sKey = "\x09"; // TAB
				} else {
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
		let bInputOk = false;

		if (sKey === "\r") {
			Utils.console.log("fnWaitInput:", sInput, "reason", oStop.sReason);
			if (!oInput.sNoCRLF) {
				this.oVm.print(iStream, "\r\n");
			}
			if (oInput.fnInputCallback) {
				bInputOk = oInput.fnInputCallback();
			} else {
				bInputOk = true;
			}
			if (bInputOk) {
				this.oKeyboard.setKeyDownHandler(null);
				if (oStop.sReason === "waitInput") { // only for this reason
					this.oVm.vmStop("", 0, true); // no more wait
				} else {
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
	}

	// merge two scripts with sorted line numbers, lines from script2 overwrite lines from script1
	private mergeScripts(sScript1: string, sScript2: string) { // eslint-disable-line class-methods-use-this
		const aLines1 = (sScript1 as any).trimEnd().split("\n"), //TTT
			aLines2 = (sScript2 as any).trimEnd().split("\n");
		let aResult = [],
			iLine1: number, iLine2: number;

		while (aLines1.length && aLines2.length) {
			iLine1 = iLine1 || parseInt(aLines1[0], 10);
			iLine2 = iLine2 || parseInt(aLines2[0], 10);

			if (iLine1 < iLine2) { // use line from script1
				aResult.push(aLines1.shift());
				iLine1 = 0;
			} else { // use line from script2
				const sLine2 = aLines2.shift();

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

		const sResult = aResult.join("\n");

		return sResult;
	}

	// get line range from a script with sorted line numbers
	private fnGetLinesInRange(sScript, iFirstLine, iLastLine) { // eslint-disable-line class-methods-use-this
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
	}

	private static fnPrepareMaskRegExp(sMask: string) {
		sMask = sMask.replace(/([.+^$[\]\\(){}|-])/g, "\\$1");
		sMask = sMask.replace(/\?/g, ".");
		sMask = sMask.replace(/\*/g, ".*");

		const oRegExp = new RegExp("^" + sMask + "$");

		return oRegExp;
	}

	private fnGetExampleDirectoryEntries(sMask?: string) { // optional sMask
		var aDir = [],
			oAllExamples = this.model.getAllExamples(),
			sKey, sKey2, sMatchKey2, oExample, oRegExp;

		if (sMask) {
			oRegExp = Controller.fnPrepareMaskRegExp(sMask);
		}

		for (sKey in oAllExamples) {
			if (oAllExamples.hasOwnProperty(sKey)) {
				oExample = oAllExamples[sKey];
				sKey2 = oExample.key;
				sMatchKey2 = sKey2;
				if (sKey2.indexOf(".") < 0) {
					sMatchKey2 = sKey2 + ".";
				}
				if (!oRegExp || oRegExp.test(sMatchKey2)) {
					aDir.push(sKey2);
				}
			}
		}
		return aDir;
	}

	private fnGetDirectoryEntries(sMask?: string) {
		var oStorage = Utils.localStorage,
			aDir = [],
			oRegExp, i, sKey;

		if (sMask) {
			oRegExp = Controller.fnPrepareMaskRegExp(sMask);
		}

		for (i = 0; i < oStorage.length; i += 1) {
			sKey = oStorage.key(i);
			if (!oRegExp || oRegExp.test(sKey)) {
				aDir.push(sKey);
			}
		}
		return aDir;
	}

	private fnPrintDirectoryEntries(iStream, aDir, bSort) {
		var i, sKey, aParts;

		// first format names
		for (i = 0; i < aDir.length; i += 1) {
			sKey = aDir[i];
			aParts = sKey.split(".");
			if (aParts.length === 2) {
				aDir[i] = aParts[0].padEnd(8, " ") + "." + aParts[1].padEnd(3, " ");
			} else {
				Utils.console.warn("fnPrintDirectoryEntries: Wrong entry:", aDir[i]); // maybe other data, is using local page
			}
		}

		if (bSort) {
			aDir.sort();
		}

		this.oVm.print(iStream, "\r\n");
		for (i = 0; i < aDir.length; i += 1) {
			sKey = aDir[i] + "  ";
			this.oVm.print(iStream, sKey);
		}
		this.oVm.print(iStream, "\r\n");
	}

	fnFileCat(oParas: StopParas) {
		var iStream = oParas.iStream,
			aDir = this.fnGetDirectoryEntries();

		this.fnPrintDirectoryEntries(iStream, aDir, true);
		this.oVm.vmStop("", 0, true);
	}

	fnFileDir(oParas: StopParas) {
		var iStream = oParas.iStream,
			sFileMask = oParas.sFileMask,
			sPath = "",
			aDir, aDir2, sExample, iLastSlash, i;

		if (sFileMask) {
			sFileMask =	this.fnLocalStorageName(sFileMask);
		}
		aDir = this.fnGetDirectoryEntries(sFileMask);

		// if we have a fileMask, include also example names from same directory:
		sExample = this.model.getProperty("example");
		iLastSlash = sExample.lastIndexOf("/");
		if (iLastSlash >= 0) {
			sPath = sExample.substr(0, iLastSlash) + "/";
			sFileMask = sPath + sFileMask; // only in same directory
		}
		aDir2 = this.fnGetExampleDirectoryEntries(sFileMask); // also from examples
		for (i = 0; i < aDir2.length; i += 1) {
			aDir2[i] = aDir2[i].substr(sPath.length); // remove preceding path including "/"
		}
		aDir = aDir2.concat(aDir); // combine

		this.fnPrintDirectoryEntries(iStream, aDir, false);
		this.oVm.vmStop("", 0, true);
	}

	fnFileEra(oParas: StopParas) {
		var iStream = oParas.iStream,
			oStorage = Utils.localStorage,
			sFileMask = oParas.sFileMask,
			aDir, i, sName;

		sFileMask =	this.fnLocalStorageName(sFileMask);
		aDir = this.fnGetDirectoryEntries(sFileMask);

		if (!aDir.length) {
			this.oVm.print(iStream, sFileMask + " not found\r\n");
		}

		for (i = 0; i < aDir.length; i += 1) {
			sName = aDir[i];
			if (oStorage.getItem(sName) !== null) {
				oStorage.removeItem(sName);
				this.updateStorageDatabase("remove", sName);
				if (Utils.debug > 0) {
					Utils.console.debug("fnEraseFile: sName=" + sName + ": removed from localStorage");
				}
			} else {
				this.oVm.print(iStream, sName + " not found\r\n");
				Utils.console.warn("fnEraseFile: file not found in localStorage:", sName);
			}
		}
		this.oVm.vmStop("", 0, true);
	}

	fnFileRen(oParas: StopParas) {
		var iStream = oParas.iStream,
			oStorage = Utils.localStorage,
			sNew = oParas.sNew,
			sOld = oParas.sOld,
			sItem;

		sNew = this.fnLocalStorageName(sNew);
		sOld = this.fnLocalStorageName(sOld);

		sItem = oStorage.getItem(sOld);
		if (sItem !== null) {
			if (!oStorage.getItem(sNew)) {
				oStorage.setItem(sNew, sItem);
				this.updateStorageDatabase("set", sNew);
				oStorage.removeItem(sOld);
				this.updateStorageDatabase("remove", sOld);
			} else {
				this.oVm.print(iStream, sOld + " already exists\r\n");
			}
		} else {
			this.oVm.print(iStream, sOld + " not found\r\n");
		}
		this.oVm.vmStop("", 0, true);
	}

	// Hisoft Devpac GENA3 Z80 Assember (http://www.cpcwiki.eu/index.php/Hisoft_Devpac)
	private static asmGena3Convert(sData) {
		var iPos = 0,
			sOut = "",
			iLength = sData.length,
			fnUInt16 = function (iPos2) {
				return sData.charCodeAt(iPos2) + sData.charCodeAt(iPos2 + 1) * 256;
			},
			iLineNum, iIndex1, iIndex2;

		iPos += 4; // what is the meaning of these bytes?

		while (iPos < iLength) {
			iLineNum = fnUInt16(iPos);
			iPos += 2;
			iIndex1 = sData.indexOf("\r", iPos); // EOL marker 0x0d
			if (iIndex1 < 0) {
				iIndex1 = iLength;
			}
			iIndex2 = sData.indexOf("\x1c", iPos); // EOL marker 0x1c
			if (iIndex2 < 0) {
				iIndex2 = iLength;
			}
			iIndex1 = Math.min(iIndex1, iIndex2);
			sOut += iLineNum + " " + sData.substring(iPos, iIndex1) + "\n";
			iPos = iIndex1 + 1;
		}

		return sOut;
	}

	private loadFileContinue(sInput: string) { // eslint-disable-line complexity
		const oInFile = this.oVm.vmGetInFileObject(),
			sCommand = oInFile.sCommand;
		var	iStartLine = 0,
			bPutInMemory = false,
			oData;

		if (sInput !== null && sInput !== undefined) {
			oData = this.splitMeta(sInput);

			sInput = oData.sData; // maybe changed

			if (oData.oMeta.sEncoding === "base64") {
				sInput = Utils.atob(sInput); // decode base64
			}

			const sType = oData.oMeta.sType;

			if (sType === "T") { // tokenized basic?
				sInput = this.oBasicTokenizer.decode(sInput);
			} else if (sType === "P") { // protected BASIC?
				sInput = DiskImage.unOrProtectData(sInput);
				sInput = this.oBasicTokenizer.decode(sInput);
			} else if (sType === "B") { // binary?
			} else if (sType === "A") { // ASCII?
				// remove EOF character(s) (0x1a) from the end of file
				sInput = sInput.replace(/\x1a+$/, ""); // eslint-disable-line no-control-regex
			} else if (sType === "G") { // Hisoft Devpac GENA3 Z80 Assember
				sInput = Controller.asmGena3Convert(sInput);
			}
		}

		if (oInFile.fnFileCallback) {
			try {
				bPutInMemory = oInFile.fnFileCallback(sInput, oData && oData.oMeta) as boolean; //TTT
			} catch (e) {
				Utils.console.warn(e);
			}
		}

		if (sInput === undefined) {
			Utils.console.error("loadFileContinue: File " + oInFile.sName + ": sInput undefined!");
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
			sInput = this.mergeScripts(this.view.getAreaValue("inputText"), sInput);
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
			sInput = this.mergeScripts(this.view.getAreaValue("inputText"), sInput);
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
			} else {
				this.fnReset();
			}
			break;
		default:
			Utils.console.error("loadExample: Unknown command:", sCommand);
			break;
		}
		this.oVm.vmSetStartLine(iStartLine);
		this.startMainLoop();
	}

	private loadExample() {
		var that = this,
			oInFile = this.oVm.vmGetInFileObject(),
			sExample: string, sUrl: string,

			fnExampleLoaded = function (_sFullUrl: string, bSuppressLog: boolean) {
				var sInput;

				const oExample = that.model.getExample(sExample);

				if (!bSuppressLog) {
					Utils.console.log("Example", sUrl, oExample.meta || "", "loaded");
				}
				sInput = oExample.script;
				that.model.setProperty("example", oInFile.sMemorizedExample);
				that.oVm.vmStop("", 0, true);
				that.loadFileContinue(sInput);
			},
			fnExampleError = function () {
				Utils.console.log("Example", sUrl, "error");
				that.model.setProperty("example", oInFile.sMemorizedExample);

				that.oVm.vmStop("", 0, true);

				const oError = that.oVm.vmComposeError(Error(), 32, sExample + " not found"); // TODO: set also derr=146 (xx not found)

				// error or onError set
				if (oError.hidden) {
					that.oVm.vmStop("", 0, true); // clear onError
				}
				that.outputError(oError, true);
				that.loadFileContinue(null);
			};

		let sName = oInFile.sName;
		const sKey = this.model.getStringProperty("example");

		if (sName.charAt(0) === "/") { // absolute path?
			sName = sName.substr(1); // remove "/"
			oInFile.sMemorizedExample = sName; // change!
		} else {
			oInFile.sMemorizedExample = sKey;
			const iLastSlash = sKey.lastIndexOf("/");

			if (iLastSlash >= 0) {
				const sPath = sKey.substr(0, iLastSlash); // take path from selected example

				sName = sPath + "/" + sName;
				sName = sName.replace(/\w+\/\.\.\//, ""); // simplify 2 dots (go back) in path: "dir/.."" => ""
			}
		}
		sExample = sName;

		if (Utils.debug > 0) {
			Utils.console.debug("loadExample: sName=" + sName + " (current=" + sKey + ")");
		}

		const oExample = this.model.getExample(sExample); // already loaded

		if (oExample && oExample.loaded) {
			this.model.setProperty("example", sExample);
			fnExampleLoaded("", true);
		} else if (sExample && oExample) { // need to load
			this.model.setProperty("example", sExample);
			const sDatabaseDir = this.model.getDatabase().src;

			sUrl = sDatabaseDir + "/" + sExample + ".js";
			Utils.loadScript(sUrl, fnExampleLoaded, fnExampleError);
		} else { // keep original sExample in this error case
			sUrl = sExample;
			if (sExample !== "") { // only if not empty
				Utils.console.warn("loadExample: Unknown file:", sExample);
				fnExampleError();
			} else {
				this.model.setProperty("example", sExample);
				this.oVm.vmStop("", 0, true);
				this.loadFileContinue(""); // empty input?
			}
		}
	}

	private fnLocalStorageName(sName: string, sDefaultExtension?: string): string { // eslint-disable-line class-methods-use-this
		// modify name so we do not clash with localstorage methods/properites
		if (sName.indexOf(".") < 0) { // no dot inside name?
			sName += "." + (sDefaultExtension || ""); // append dot or default extension
		}
		return sName;
	}

	private tryLoadingFromLocalStorage(sName) {
		var oStorage = Utils.localStorage,
			aExtensions = [
				null,
				"bas",
				"bin"
			],
			i, sStorageName, sInput;

		for (i = 0; i < aExtensions.length; i += 1)	{
			sStorageName = this.fnLocalStorageName(sName, aExtensions[i]);
			sInput = oStorage.getItem(sStorageName);
			if (sInput !== null) {
				break; // found
			}
		}
		return sInput; // null=not found
	}

	// run loop: fileLoad
	fnFileLoad() {
		var oInFile = this.oVm.vmGetInFileObject(),
			sName, sInput;

		if (oInFile.bOpen) {
			if (oInFile.sCommand === "chainMerge" && oInFile.iFirst && oInFile.iLast) { // special handling to delete line numbers first
				this.fnDeleteLines({
					iFirst: oInFile.iFirst,
					iLast: oInFile.iLast,
					sCommand: "CHAIN MERGE"
				});
				this.oVm.vmStop("fileLoad", 90); // restore
			}

			sName = oInFile.sName;
			if (Utils.debug > 1) {
				Utils.console.debug("fnFileLoad:", oInFile.sCommand, sName, "details:", oInFile);
			}

			sInput = this.tryLoadingFromLocalStorage(sName);
			if (sInput !== null) {
				if (Utils.debug > 0) {
					Utils.console.debug("fnFileLoad:", oInFile.sCommand, sName, "from localStorage");
				}
				this.oVm.vmStop("", 0, true);
				this.loadFileContinue(sInput);
			} else { // load from example
				this.loadExample(/* sName */); //TTT
			}
		} else {
			Utils.console.error("fnFileLoad:", sName, "File not open!");
		}
		this.iNextLoopTimeOut = this.oVm.vmGetTimeUntilFrame(); // wait until next frame
	}

	private joinMeta(oMeta) {
		var sMeta = [
			this.sMetaIdent,
			oMeta.sType,
			oMeta.iStart,
			oMeta.iLength,
			oMeta.iEntry
		].join(";");

		return sMeta;
	}

	private splitMeta(sInput: string) {
		var oMeta;

		if (sInput.indexOf(this.sMetaIdent) === 0) { // starts with metaIdent?
			const iIndex = sInput.indexOf(","); // metadata separator

			if (iIndex >= 0) {
				const sMeta = sInput.substr(0, iIndex);

				sInput = sInput.substr(iIndex + 1);

				const aMeta = sMeta.split(";");

				oMeta = {
					sType: aMeta[1],
					iStart: aMeta[2],
					iLength: aMeta[3],
					iEntry: aMeta[4],
					sEncoding: aMeta[5]
				};
			}
		}

		return {
			oMeta: oMeta || {},
			sData: sInput
		};
	}

	// run loop: fileSave
	fnFileSave() {
		var oOutFile = this.oVm.vmGetOutFileObject(),
			oStorage = Utils.localStorage,
			sDefaultExtension = "",
			sName, sType, sStorageName, sFileData, sMeta;

		if (oOutFile.bOpen) {
			sType = oOutFile.sType;
			sName = oOutFile.sName;

			if (sType === "P" || sType === "T") {
				sDefaultExtension = "bas";
			} else if (sType === "B") {
				sDefaultExtension = "bin";
			}
			sStorageName = this.fnLocalStorageName(sName, sDefaultExtension);

			if (oOutFile.aFileData) {
				sFileData = oOutFile.aFileData.join("");
			} else { // no file data (assuming sType A, P or T) => get text
				sFileData = this.view.getAreaValue("inputText");
				oOutFile.iLength = sFileData.length; // set length
				oOutFile.sType = "A"; // override sType: currently we support type "A" only
			}

			if (Utils.debug > 0) {
				Utils.console.debug("fnFileSave: sName=" + sName + ": put into localStorage");
			}

			if (oOutFile.fnFileCallback) {
				try {
					oOutFile.fnFileCallback(sFileData); // close file
				} catch (e) {
					Utils.console.warn(e);
				}
			}

			sMeta = this.joinMeta(oOutFile);
			oStorage.setItem(sStorageName, sMeta + "," + sFileData);
			this.updateStorageDatabase("set", sStorageName);
			this.oVm.vmResetFileHandling(oOutFile); // make sure it is closed
		} else {
			Utils.console.error("fnFileSave: file not open!");
		}
		this.oVm.vmStop("", 0, true); // continue
	}

	fnDeleteLines(oParas: StopParas) {
		var sInputText = this.view.getAreaValue("inputText"),
			aLines = this.fnGetLinesInRange(sInputText, oParas.iFirst, oParas.iLast),
			iLine, i, oError, sInput;

		if (aLines.length) {
			for (i = 0; i < aLines.length; i += 1) {
				iLine = parseInt(aLines[i], 10);
				if (isNaN(iLine)) {
					oError = this.oVm.vmComposeError(Error(), 21, oParas.sCommand); // "Direct command found"
					this.outputError(oError, true);
					break;
				}
				aLines[i] = iLine; // keep just the line numbers
			}
			if (!oError) {
				sInput = aLines.join("\n");
				sInput = this.mergeScripts(sInputText, sInput); // delete sInput lines
				this.setInputText(sInput);
			}
		}

		this.oVm.vmGotoLine(0); // reset current line
		this.oVm.vmStop("end", 0, true);
	}

	fnNew(/* oParas */) {
		var sInput = "";

		this.setInputText(sInput);
		this.oVariables.removeAllVariables();

		this.oVm.vmGotoLine(0); // reset current line
		this.oVm.vmStop("end", 0, true);
		this.invalidateScript();
	}

	fnList(oParas: StopParas) {
		var sInput = this.view.getAreaValue("inputText"),
			iStream = oParas.iStream,
			aLines = this.fnGetLinesInRange(sInput, oParas.iFirst, oParas.iLast),
			oRegExp = new RegExp(/([\x00-\x1f])/g), // eslint-disable-line no-control-regex
			i, sLine;

		for (i = 0; i < aLines.length; i += 1) {
			sLine = aLines[i];
			if (iStream !== 9) {
				sLine = sLine.replace(oRegExp, "\x01$1"); // escape control characters to print them directly
			}
			this.oVm.print(iStream, sLine, "\r\n");
		}

		this.oVm.vmGotoLine(0); // reset current line
		this.oVm.vmStop("end", 0, true);
	}

	fnReset() {
		var oVm = this.oVm;

		this.oVariables.removeAllVariables();
		oVm.vmReset();
		oVm.vmStop("end", 0, true); // set "end" with priority 0, so that "compile only" still works
		oVm.sOut = "";
		this.view.setAreaValue("outputText", "");
		this.invalidateScript();
	}

	private outputError(oError, bNoSelection?: boolean) {
		var iStream = 0,
			sShortError = oError.shortMessage || oError.message,
			sEscapedShortError, iEndPos;

		if (!bNoSelection) {
			iEndPos = oError.pos + ((oError.value !== undefined) ? String(oError.value).length : 0);
			this.view.setAreaSelection("inputText", oError.pos, iEndPos);
		}

		sEscapedShortError = sShortError.replace(/([\x00-\x1f])/g, "\x01$1"); // eslint-disable-line no-control-regex
		this.oVm.print(iStream, sEscapedShortError + "\r\n");
		return sShortError;
	}

	fnRenumLines(oParas: StopParas) {
		var oVm = this.oVm,
			sInput = this.view.getAreaValue("inputText"),
			oOutput;

		if (!this.oBasicFormatter) {
			this.oBasicFormatter = new BasicFormatter({
				lexer: new BasicLexer(),
				parser: new BasicParser()
			});
		}

		this.oBasicFormatter.reset();
		oOutput = this.oBasicFormatter.renumber(sInput, oParas.iNew, oParas.iOld, oParas.iStep, oParas.iKeep);

		if (oOutput.error) {
			Utils.console.warn(oOutput.error);
			this.outputError(oOutput.error);
		} else {
			this.fnPutChangedInputOnStack();
			this.setInputText(oOutput.text, true);
			this.fnPutChangedInputOnStack();
		}
		this.oVm.vmGotoLine(0); // reset current line
		oVm.vmStop("end", 0, true);
		return oOutput;
	}

	private fnEditLineCallback() {
		var oInput = this.oVm.vmGetStopObject().oParas,
			sInput = oInput.sInput,
			sInputText = this.view.getAreaValue("inputText");

		sInput = this.mergeScripts(sInputText, sInput);
		this.setInputText(sInput);
		this.oVm.vmSetStartLine(0);
		this.oVm.vmGotoLine(0); // to be sure
		this.view.setDisabled("continueButton", true);
		this.oVm.cursor(oInput.iStream, 0);
		this.oVm.vmStop("end", 90);
		return true;
	}

	fnEditLine(oParas: StopParas) {
		var sInput = this.view.getAreaValue("inputText"),
			iStream = oParas.iStream,
			iLine = oParas.iLine,
			aLines = this.fnGetLinesInRange(sInput, iLine, iLine),
			sLine, oError;

		if (aLines.length) {
			sLine = aLines[0];
			this.oVm.print(iStream, sLine);
			this.oVm.cursor(iStream, 1);
			this.oVm.vmStop("waitInput", 45, true, {
				iStream: iStream,
				sMessage: "",
				fnInputCallback: this.fnEditLineCallback.bind(this),
				sInput: sLine
			});
			this.fnWaitInput();
		} else {
			oError = this.oVm.vmComposeError(Error(), 8, String(iLine)); // "Line does not exist"
			this.oVm.print(iStream, String(oError) + "\r\n");
			this.oVm.vmStop("stop", 60, true);
		}
	}

	fnParse() {
		var sInput = this.view.getAreaValue("inputText"),
			iBench = this.model.getProperty("bench"),
			i, iTime, oOutput, sOutput;

		this.oVariables.removeAllVariables();
		if (!iBench) {
			this.oCodeGeneratorJs.reset();
			oOutput = this.oCodeGeneratorJs.generate(sInput, this.oVariables);
		} else {
			for (i = 0; i < iBench; i += 1) {
				this.oCodeGeneratorJs.reset();
				iTime = Date.now();
				oOutput = this.oCodeGeneratorJs.generate(sInput, this.oVariables);
				iTime = Date.now() - iTime;
				Utils.console.debug("bench size", sInput.length, "labels", Object.keys(this.oCodeGeneratorJs.oLabels).length, "loop", i, ":", iTime, "ms");
				if (oOutput.error) {
					break;
				}
			}
		}

		if (oOutput.error) {
			sOutput = this.outputError(oOutput.error);
		} else {
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
	}

	fnPretty() {
		const sInput = this.view.getAreaValue("inputText"),
			oCodeGeneratorBasic = new CodeGeneratorBasic({
				lexer: new BasicLexer(),
				parser: new BasicParser()
			});

		oCodeGeneratorBasic.reset();

		const oOutput = oCodeGeneratorBasic.generate(sInput); // not needed: this.oVariables
		let sOutput: string;

		if (oOutput.error) {
			sOutput = this.outputError(oOutput.error);
		} else {
			sOutput = oOutput.text;

			this.fnPutChangedInputOnStack();
			this.setInputText(sOutput, true);
			this.fnPutChangedInputOnStack();

			const sDiff = Diff.testDiff(sInput.toUpperCase(), sOutput.toUpperCase()); //TTT: for testing

			this.view.setAreaValue("outputText", sDiff);
		}
		if (sOutput && sOutput.length > 0) {
			sOutput += "\n";
		}
		//TTT need sOutput?
	}

	private selectJsError(sScript: string, e) {
		var iPos = 0,
			iLine = 0,
			iErrLine = e.lineNumber - 3; // for some reason line 0 is 3

		while (iPos < sScript.length && iLine < iErrLine) {
			iPos = sScript.indexOf("\n", iPos) + 1;
			iLine += 1;
		}
		iPos += e.columnNumber;

		Utils.console.warn("Info: JS Error occurred at line", e.lineNumber, "column", e.columnNumber, "pos", iPos);

		this.view.setAreaSelection("outputText", iPos, iPos + 1);
	}

	private fnRun(oParas?: StopParas) {
		var sScript = this.view.getAreaValue("outputText"),
			iLine = oParas && oParas.iLine || 0,
			oVm = this.oVm;

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
			} catch (e) {
				Utils.console.error(e);
				if (e.lineNumber || e.columnNumber) { // only available on Firefox
					this.selectJsError(sScript, e);
				}
				e.shortMessage = "JS " + String(e);
				this.outputError(e, true);
				this.fnScript = undefined;
			}
		} else {
			oVm.clear(); // we do a clear as well here
		}
		oVm.vmReset4Run();
		if (!this.bInputSet) {
			this.bInputSet = true;
			this.oKeyboard.putKeysInBuffer(this.model.getStringProperty("input"));
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
		if (Utils.debug > 1) {
			Utils.console.debug("End of fnRun");
		}
	}

	private fnParseRun() {
		var oOutput = this.fnParse();

		if (!oOutput.error) {
			this.fnRun();
		}
	}

	private fnRunPart1() {
		try {
			this.fnScript(this.oVm);
		} catch (e) {
			if (e.name === "CpcVm") {
				if (!e.hidden) {
					Utils.console.warn(e);
					this.outputError(e, true);
				} else {
					Utils.console.log(e.message);
				}
			} else {
				Utils.console.error(e);
				if (e.lineNumber || e.columnNumber) { // only available on Firefox
					this.selectJsError(this.view.getAreaValue("outputText"), e);
				}
				this.oVm.vmComposeError(e, 2, "JS " + String(e)); // generate Syntax Error, set also err and erl and set stop
				this.outputError(e, true);
			}
		}
	}

	private fnDirectInput() {
		const oInput = this.oVm.vmGetStopObject().oParas,
			iStream = oInput.iStream;
		let sInput = oInput.sInput,
			oOutput, sOutput;

		sInput = sInput.trim();
		oInput.sInput = "";
		if (sInput !== "") {
			this.oVm.cursor(iStream, 0);
			const sInputText = this.view.getAreaValue("inputText");

			if ((/^\d+($| )/).test(sInput)) { // start with number?
				if (Utils.debug > 0) {
					Utils.console.debug("fnDirectInput: insert line=" + sInput);
				}
				sInput = this.mergeScripts(sInputText, sInput);
				this.setInputText(sInput, true);

				this.oVm.vmSetStartLine(0);
				this.oVm.vmGotoLine(0); // to be sure
				this.view.setDisabled("continueButton", true);

				this.oVm.cursor(iStream, 1);
				this.updateResultText();
				return false; // continue direct input
			}

			Utils.console.log("fnDirectInput: execute:", sInput);

			if (sInputText) { // do we have a program?
				oOutput = this.oCodeGeneratorJs.reset().generate(sInput + "\n" + sInputText, this.oVariables, true); // compile both; allow direct command
				if (oOutput.error) {
					if (oOutput.error.pos >= sInput.length + 1) { // error not in direct?
						oOutput.error.pos -= (sInput.length + 1);
						oOutput.error.message = "[prg] " + oOutput.error.message;
						if (oOutput.error.shortMessage) { // eslint-disable-line max-depth
							oOutput.error.shortMessage = "[prg] " + oOutput.error.shortMessage;
						}
						sOutput = this.outputError(oOutput.error, true);
						oOutput = null;
					}
				}
			}

			if (!oOutput) {
				oOutput = this.oCodeGeneratorJs.reset().generate(sInput, this.oVariables, true); // compile direct input only
			}

			if (oOutput.error) {
				sOutput = this.outputError(oOutput.error, true);
			} else {
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
					const fnScript = new Function("o", sOutput); // eslint-disable-line no-new-func

					this.fnScript = fnScript;
				} catch (e) {
					Utils.console.error(e);
					this.outputError(e, true);
				}
			}

			if (!oOutput.error) {
				this.updateResultText();
				return true;
			}

			const sMsg = oInput.sMessage;

			this.oVm.print(iStream, sMsg);
			this.oVm.cursor(iStream, 1);
		}
		this.updateResultText();
		return false;
	}

	private startWithDirectInput() {
		const oVm = this.oVm,
			iStream = 0,
			sMsg = "Ready\r\n";

		this.oVm.tagoff(iStream);
		if (this.oVm.pos(iStream) > 1) {
			this.oVm.print(iStream, "\r\n");
		}
		this.oVm.print(iStream, sMsg);
		this.oVm.cursor(iStream, 1, 1);

		oVm.vmStop("direct", 0, true, {
			iStream: iStream,
			sMessage: sMsg,
			// sNoCRLF: true,
			fnInputCallback: this.fnDirectInputHandler,
			sInput: ""
		});
		this.fnWaitInput();
	}

	private updateResultText() {
		this.view.setAreaValue("resultText", this.oVm.sOut);
		this.view.setAreaScrollTop("resultText"); // scroll to bottom
	}

	private exitLoop() {
		const oStop = this.oVm.vmGetStopObject(),
			sReason = oStop.sReason;

		this.updateResultText();

		this.view.setDisabled("runButton", sReason === "reset");
		this.view.setDisabled("stopButton", sReason !== "fileLoad" && sReason !== "fileSave");
		this.view.setDisabled("continueButton", sReason === "end" || sReason === "fileLoad" || sReason === "fileSave" || sReason === "parse" || sReason === "renumLines" || sReason === "reset");

		this.setVarSelectOptions("varSelect", this.oVariables);
		this.commonEventHandler.onVarSelectChange();

		if (sReason === "stop" || sReason === "end" || sReason === "error" || sReason === "parse" || sReason === "parseRun") {
			this.startWithDirectInput();
		}
	}

	fnBreak() {
		// empty
	}

	fnDirect() {
		// TTT: break in direct mode?
	}

	fnEnd() {
		// empty
	}

	fnError() {
		// empty
	}

	fnEscape() {
		// empty
	}

	fnWaitFrame() {
		this.oVm.vmStop("", 0, true);
		this.iNextLoopTimeOut = this.oVm.vmGetTimeUntilFrame(); // wait until next frame
	}

	fnOnError() { //TTT
		this.oVm.vmStop("", 0, true); // continue
	}

	fnStop() {
		// empty
	}

	fnTimer() {
		this.oVm.vmStop("", 0, true); // continue
	}

	private fnRunLoop() {
		var oStop = this.oVm.vmGetStopObject(),
			sHandler;

		this.iNextLoopTimeOut = 0;
		if (!oStop.sReason && this.fnScript) {
			this.fnRunPart1(); // could change sReason
		}

		sHandler = "fn" + Utils.stringCapitalize(oStop.sReason);
		if (sHandler in this) {
			this[sHandler](oStop.oParas);
		} else {
			Utils.console.warn("runLoop: Unknown run mode:", oStop.sReason);
			this.oVm.vmStop("error", 55);
		}

		if (oStop.sReason && oStop.sReason !== "waitSound" && oStop.sReason !== "waitKey" && oStop.sReason !== "waitInput") {
			this.bTimeoutHandlerActive = false; // not running any more
			this.exitLoop();
		} else {
			setTimeout(this.fnRunLoopHandler, this.iNextLoopTimeOut);
		}
	}

	startMainLoop(): void {
		if (!this.bTimeoutHandlerActive) {
			this.bTimeoutHandlerActive = true;
			this.fnRunLoop();
		}
	}

	private setStopObject(oStop: StopEntry) {
		Object.assign(this.oSavedStop, oStop);
	}

	private getStopObject() {
		return this.oSavedStop;
	}


	startParse() {
		this.oKeyboard.setKeyDownHandler(null);
		this.oVm.vmStop("parse", 99);
		this.startMainLoop();
	}

	startRenum() {
		var iStream = 0;

		this.oVm.vmStop("renumLines", 99, false, {
			iNew: 10,
			iOld: 1,
			iStep: 10,
			iKeep: 65535 // keep lines
		});

		if (this.oVm.pos(iStream) > 1) {
			this.oVm.print(iStream, "\r\n");
		}
		this.oVm.print(iStream, "renum\r\n");
		this.startMainLoop();
	}

	startRun() {
		this.setStopObject(this.oNoStop);

		this.oKeyboard.setKeyDownHandler(null);
		this.oVm.vmStop("run", 99);
		this.startMainLoop();
	}

	startParseRun() {
		this.setStopObject(this.oNoStop);
		this.oKeyboard.setKeyDownHandler(null);
		this.oVm.vmStop("parseRun", 99);
		this.startMainLoop();
	}

	startBreak() {
		var oVm = this.oVm,
			oStop = oVm.vmGetStopObject();

		this.setStopObject(oStop);
		this.oKeyboard.setKeyDownHandler(null);
		this.oVm.vmStop("break", 80);
		this.startMainLoop();
	}

	startContinue() {
		var oVm = this.oVm,
			oStop = oVm.vmGetStopObject(),
			oSavedStop = this.getStopObject();

		this.view.setDisabled("runButton", true);
		this.view.setDisabled("stopButton", false);
		this.view.setDisabled("continueButton", true);
		if (oStop.sReason === "break" || oStop.sReason === "escape" || oStop.sReason === "stop" || oStop.sReason === "direct") {
			//TTT if (!oSavedStop.fnInputCallback) { // no keyboard callback? make sure no handler is set (especially for direct->continue)
			if (oSavedStop.oParas && !oSavedStop.oParas.fnInputCallback) { // no keyboard callback? make sure no handler is set (especially for direct->continue)
				this.oKeyboard.setKeyDownHandler(null);
			}
			if (oStop.sReason === "direct" || oStop.sReason === "escape") {
				this.oVm.cursor(oStop.oParas.iStream, 0); // switch it off (for continue button)
			}
			Object.assign(oStop, oSavedStop); // fast hack
			this.setStopObject(this.oNoStop);
		}
		this.startMainLoop();
	}

	startReset() {
		this.setStopObject(this.oNoStop);
		this.oKeyboard.setKeyDownHandler(null);
		this.oVm.vmStop("reset", 99);
		this.startMainLoop();
	}

	startScreenshot() {
		var image = this.oCanvas.canvas.toDataURL("image/png").replace("image/png", "image/octet-stream"); // here is the most important part because if you do not replace you will get a DOM 18 exception.

		return image;
	}

	private fnPutKeyInBuffer(sKey) {
		var oKeyDownHandler = this.oKeyboard.getKeyDownHandler();

		this.oKeyboard.putKeyInBuffer(sKey);

		if (oKeyDownHandler) {
			oKeyDownHandler();
		}
	}

	startEnter() {
		var sInput = this.view.getAreaValue("inp2Text"),
			i;

		sInput = sInput.replace("\n", "\r"); // LF => CR
		if (!sInput.endsWith("\r")) {
			sInput += "\r";
		}
		for (i = 0; i < sInput.length; i += 1) {
			this.fnPutKeyInBuffer(sInput.charAt(i));
		}

		this.view.setAreaValue("inp2Text", "");
	}

	private static generateFunction(sPar, sFunction) {
		var aArgs = [],
			iFirstIndex, iLastIndex, aMatch, fnFunction;

		if (sFunction.startsWith("function anonymous(")) { // already a modified function (inside an anonymous function)?
			iFirstIndex = sFunction.indexOf("{");
			iLastIndex = sFunction.lastIndexOf("}");
			if (iFirstIndex >= 0 && iLastIndex >= 0) {
				sFunction = sFunction.substring(iFirstIndex + 1, iLastIndex - 1); // remove anonymous function
			}
			sFunction = sFunction.trim();
		} else {
			sFunction = "var o=cpcBasic.controller.oVm, v=o.vmGetAllVariables(); v." + sPar + " = " + sFunction;
		}

		aMatch = (/function \(([^)]*)/).exec(sFunction);
		if (aMatch) {
			aArgs = aMatch[1].split(",");
		}

		fnFunction = new Function(aArgs[0], aArgs[1], aArgs[2], aArgs[3], aArgs[4], sFunction); // eslint-disable-line no-new-func
		// we support at most 5 arguments

		return fnFunction;
	}

	changeVariable() {
		var sPar = this.view.getSelectValue("varSelect"),
			sValue = this.view.getSelectValue("varText"),
			oVariables = this.oVariables,
			sVarType, sType, value, value2;

		value = oVariables.getVariable(sPar);
		if (typeof value === "function") { // TODO
			value = Controller.generateFunction(sPar, sValue);
			/*
			value = sValue;
			value = "var o=cpcBasic.controller.oVm, v=o.vmGetAllVariables(); v." + sPar + " = " + sValue;
			value = new Function("xR", value); // eslint-disable-line no-new-func
			// new function must be called later with this.oVm, ...
			*/
			oVariables.setVariable(sPar, value);
		} else {
			sVarType = this.oVariables.determineStaticVarType(sPar);
			sType = this.oVm.vmDetermineVarType(sVarType); // do we know dynamic type?

			if (sType !== "$") { // not string? => convert to number
				value = parseFloat(sValue);
			} else {
				value = sValue;
			}

			try {
				value2 = this.oVm.vmAssign(sVarType, value);
				oVariables.setVariable(sPar, value2);
				Utils.console.log("Variable", sPar, "changed:", oVariables.getVariable(sPar), "=>", value);
			} catch (e) {
				Utils.console.warn(e);
			}
		}
		this.setVarSelectOptions("varSelect", oVariables);
		this.commonEventHandler.onVarSelectChange(); // title change?
	}

	setSoundActive() {
		var oSound = this.oSound,
			soundButton = document.getElementById("soundButton"),
			bActive = this.model.getProperty("sound"),
			sText = "",
			oStop;

		if (bActive) {
			try {
				oSound.soundOn();
				sText = (oSound.isActivatedByUser()) ? "Sound is on" : "Sound on (waiting)";
			} catch (e) {
				Utils.console.warn("soundOn:", e);
				sText = "Sound unavailable";
			}
		} else {
			oSound.soundOff();
			sText = "Sound is off";
			oStop = this.oVm && this.oVm.vmGetStopObject();
			if (oStop && oStop.sReason === "waitSound") {
				this.oVm.vmStop("", 0, true); // do not wait
			}
		}
		soundButton.innerText = sText;
	}

	// https://stackoverflow.com/questions/10261989/html5-javascript-drag-and-drop-file-from-external-window-windows-explorer
	// https://www.w3.org/TR/file-upload/#dfn-filereader
	fnHandleFileSelect(event) {
		var aFiles = event.dataTransfer ? event.dataTransfer.files : event.target.files, // dataTransfer for drag&drop, target.files for file input
			iFile = 0,
			oStorage = Utils.localStorage,
			that = this,
			reRegExpIsText = new RegExp(/^\d+ |^[\t\r\n\x1a\x20-\x7e]*$/), // eslint-disable-line no-control-regex
			// starting with (line) number, or 7 bit ASCII characters without control codes except \x1a=EOF
			aImported = [],
			f, oReader;

		function fnEndOfImport() {
			var iStream = 0,
				oVm = that.oVm,
				i;

			for (i = 0; i < aImported.length; i += 1) {
				oVm.print(iStream, aImported[i], " ");
			}
			oVm.print(iStream, "\r\n", aImported.length + " file" + (aImported.length !== 1 ? "s" : "") + " imported.\r\n");
			that.updateResultText();
		}

		function fnReadNextFile() {
			var sText;

			if (iFile < aFiles.length) {
				f = aFiles[iFile];
				iFile += 1;
				sText = f.name + " " + (f.type || "n/a") + " " + f.size + " " + (f.lastModifiedDate ? f.lastModifiedDate.toLocaleDateString() : "n/a");
				Utils.console.log(sText);
				if (f.type === "text/plain") {
					oReader.readAsText(f);
				} else if (f.type === "application/x-zip-compressed") {
					oReader.readAsArrayBuffer(f);
				} else {
					oReader.readAsDataURL(f);
				}
			} else {
				fnEndOfImport();
			}
		}

		function fnErrorHandler(evt) {
			switch (evt.target.error.code) {
			case evt.target.error.NOT_FOUND_ERR:
				Utils.console.warn("File Not Found!");
				break;
			case evt.target.error.NOT_READABLE_ERR:
				Utils.console.warn("File is not readable");
				break;
			case evt.target.error.ABORT_ERR:
				break; // nothing
			default:
				Utils.console.warn("An error occurred reading this file.");
			}
			fnReadNextFile();
		}

		function fnLoad2(sData: string, sName: string, sType: string) {
			var sStorageName, sMeta, iIndex, oHeader,
				oDsk, oDir, aDiskFiles, i, sFileName, sInfo1;

			sStorageName = that.oVm.vmAdaptFilename(sName, "FILE");
			sStorageName = that.fnLocalStorageName(sStorageName);

			if (sType === "text/plain") {
				oHeader = {
					sType: "A",
					iStart: 0,
					iLength: sData.length
				};
			} else {
				if (sType === "application/x-zip-compressed" || sType === "cpcBasic/binary") { // are we a file inside zip?
				} else { // e.g. "data:application/octet-stream;base64,..."
					iIndex = sData.indexOf(",");
					if (iIndex >= 0) {
						sInfo1 = sData.substr(0, iIndex);
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
					oHeader = {
						sType: "A",
						iStart: 0,
						iLength: sData.length
					};
				} else if (DiskImage.testDiskIdent(sData.substr(0, 8)) !== null) { // disk image file?
					try {
						oDsk = new DiskImage({
							sData: sData,
							sDiskName: sName
						});
						oDir = oDsk.readDirectory();
						aDiskFiles = Object.keys(oDir);
						for (i = 0; i < aDiskFiles.length; i += 1) {
							sFileName = aDiskFiles[i];
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
					oHeader = null; // ignore dsk file
				} else { // binary
					oHeader = {
						sType: "B",
						iStart: 0,
						iLength: sData.length
					};
				}
			}

			if (oHeader) {
				sMeta = that.joinMeta(oHeader);
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

		function fnOnLoad(evt) {
			var sData = evt.target.result,
				sName = f.name,
				sType = f.type,
				oZip, aEntries, i;

			if (sType === "application/x-zip-compressed") {
				try {
					oZip = new ZipFile(new Uint8Array(sData), sName); // rather aData
				} catch (e) {
					Utils.console.error(e);
					that.outputError(e, true);
				}
				if (oZip) {
					aEntries = Object.keys(oZip.oEntryTable);
					for (i = 0; i < aEntries.length; i += 1) {
						sName = aEntries[i];
						try {
							sData = oZip.readData(sName);
						} catch (e) {
							Utils.console.error(e);
							that.outputError(e, true);
							sData = null;
						}
						if (sData) {
							fnLoad2(sData, sName, sType);
						}
					}
				}
			} else {
				fnLoad2(sData, sName, sType);
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
		} else {
			Utils.console.warn("FileReader API not supported.");
		}
	}

	private fnHandleDragOver(evt) { // eslint-disable-line class-methods-use-this
		evt.stopPropagation();
		evt.preventDefault();
		evt.dataTransfer.dropEffect = "copy"; // Explicitly show this is a copy.
	}

	private initDropZone() {
		var dropZone = document.getElementById("dropZone");

		dropZone.addEventListener("dragover", this.fnHandleDragOver.bind(this), false);
		dropZone.addEventListener("drop", this.fnHandleFileSelect.bind(this), false);

		this.oCanvas.canvas.addEventListener("dragover", this.fnHandleDragOver.bind(this), false); //TTT fast hack
		this.oCanvas.canvas.addEventListener("drop", this.fnHandleFileSelect.bind(this), false);

		document.getElementById("fileInput").addEventListener("change", this.fnHandleFileSelect.bind(this), false);
	}

	private fnUpdateUndoRedoButtons() {
		this.view.setDisabled("undoButton", !this.inputStack.canUndoKeepOne());
		this.view.setDisabled("redoButton", !this.inputStack.canRedo());
	}

	private fnInitUndoRedoButtons() {
		this.inputStack.init();
		this.fnUpdateUndoRedoButtons();
	}

	private fnPutChangedInputOnStack() {
		var sInput = this.view.getAreaValue("inputText"),
			sStackInput = this.inputStack.getInput();

		if (sStackInput !== sInput) {
			this.inputStack.save(sInput);
			this.fnUpdateUndoRedoButtons();
		}
	}

	// currently not used. Can be called manually: cpcBasic.controller.exportAsBase64(file);
	static exportAsBase64(sStorageName: string): string { //TTT
		const oStorage = Utils.localStorage;
		let sData = oStorage.getItem(sStorageName),
			sOut = "",
			sMeta = "";

		if (sData !== null) {
			const iIndex = sData.indexOf(","); // metadata separator

			if (iIndex >= 0) {
				sMeta = sData.substr(0, iIndex);
				sData = sData.substr(iIndex + 1);
				sData = Utils.btoa(sData);
				sOut = sMeta + ";base64," + sData;
			} else { // hmm, no meta info
				sData = Utils.btoa(sData);
				sOut = "base64," + sData;
			}
		}
		Utils.console.log(sOut);
		return sOut;
	}
}
