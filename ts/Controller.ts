// Controller.ts - Controller
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//

import { Utils, CustomError } from "./Utils";
import { IController, IOutput } from "./Interfaces";
import { BasicFormatter } from "./BasicFormatter";
import { BasicLexer } from "./BasicLexer";
import { BasicParser } from "./BasicParser";
import { BasicTokenizer } from "./BasicTokenizer";
import { Canvas } from "./Canvas";
import { CodeGeneratorBasic } from "./CodeGeneratorBasic";
import { CodeGeneratorJs } from "./CodeGeneratorJs";
import { CodeGeneratorToken } from "./CodeGeneratorToken";
import { CommonEventHandler } from "./CommonEventHandler";
import { cpcCharset } from "./cpcCharset";
import { CpcVm, FileMeta, VmStopEntry, VmStopParas, VmFileParas, VmInputParas, VmLineParas, VmLineRenumParas } from "./CpcVm";
import { CpcVmRsx } from "./CpcVmRsx";
import { Diff } from "./Diff";
import { DiskImage, AmsdosHeader } from "./DiskImage";
import { InputStack } from "./InputStack";
import { Keyboard } from "./Keyboard";
import { VirtualKeyboard } from "./VirtualKeyboard";
import { Model, DatabasesType } from "./Model";
import { Sound } from "./Sound";
import { Variables, VariableValue } from "./Variables";
import { View, SelectOptionElement } from "./View";
import { ZipFile } from "./ZipFile";

interface FileMetaAndData {
	oMeta: FileMeta
	sData: string
}

export class Controller implements IController {
	private fnRunLoopHandler: () => void;
	private fnWaitKeyHandler: () => void;
	private fnWaitInputHandler: () => void;
	private fnOnEscapeHandler: () => void;
	private fnDirectInputHandler: () => boolean;
	private fnPutKeyInBufferHandler: (sKey: string) => void;

	private static sMetaIdent = "CPCBasic";

	private fnScript?: Function = undefined; // eslint-disable-line @typescript-eslint/ban-types

	private bTimeoutHandlerActive = false;
	private iNextLoopTimeOut = 0; // next timeout for the main loop

	private bInputSet = false;

	private oVariables = new Variables();

	private oBasicFormatter?: BasicFormatter; // for renum
	private oBasicTokenizer?: BasicTokenizer; // to decode tokenized BASIC
	private oCodeGeneratorToken?: CodeGeneratorToken; // to encode tokenized BASIC
	private oCodeGeneratorBasic?: CodeGeneratorBasic; // for pretty print
	private model: Model;
	private view: View;
	private commonEventHandler: CommonEventHandler;

	private oCodeGeneratorJs: CodeGeneratorJs;

	private oCanvas: Canvas;

	private inputStack = new InputStack();

	private oKeyboard: Keyboard;
	private oVirtualKeyboard?: VirtualKeyboard;
	private oSound = new Sound();

	private oVm: CpcVm;
	private oRsx: CpcVmRsx;

	private oNoStop: VmStopEntry;
	private oSavedStop: VmStopEntry; // backup of stop object

	constructor(oModel: Model, oView: View) {
		this.fnRunLoopHandler = this.fnRunLoop.bind(this);
		this.fnWaitKeyHandler = this.fnWaitKey.bind(this);
		this.fnWaitInputHandler = this.fnWaitInput.bind(this);
		this.fnOnEscapeHandler = this.fnOnEscape.bind(this);
		this.fnDirectInputHandler = this.fnDirectInput.bind(this);
		this.fnPutKeyInBufferHandler = this.fnPutKeyInBuffer.bind(this);

		this.model = oModel;
		this.view = oView;
		this.commonEventHandler = new CommonEventHandler(oModel, oView, this);
		this.view.attachEventHandler("click", this.commonEventHandler);
		this.view.attachEventHandler("change", this.commonEventHandler);

		oView.setHidden("consoleBox", !oModel.getProperty<boolean>("showConsole"));

		oView.setHidden("inputArea", !oModel.getProperty<boolean>("showInput"));
		oView.setHidden("inp2Area", !oModel.getProperty<boolean>("showInp2"));
		oView.setHidden("outputArea", !oModel.getProperty<boolean>("showOutput"));
		oView.setHidden("resultArea", !oModel.getProperty<boolean>("showResult"));
		oView.setHidden("textArea", !oModel.getProperty<boolean>("showText"));
		oView.setHidden("variableArea", !oModel.getProperty<boolean>("showVariable"));
		oView.setHidden("kbdArea", !oModel.getProperty<boolean>("showKbd"), "flex");
		oView.setHidden("kbdLayoutArea", !oModel.getProperty<boolean>("showKbdLayout"));

		oView.setHidden("cpcArea", false); // make sure canvas is not hidden (allows to get width, height)
		this.oCanvas = new Canvas({
			aCharset: cpcCharset,
			onClickKey: this.fnPutKeyInBufferHandler
		});
		oView.setHidden("cpcArea", !oModel.getProperty<boolean>("showCpc"));

		oView.setHidden("convertArea", !oModel.getProperty<boolean>("showConvert"), "flex");

		const sKbdLayout = oModel.getProperty<string>("kbdLayout");

		oView.setSelectValue("kbdLayoutSelect", sKbdLayout);
		this.commonEventHandler.onKbdLayoutSelectChange();

		this.oKeyboard = new Keyboard({
			fnOnEscapeHandler: this.fnOnEscapeHandler
		});

		if (this.model.getProperty<boolean>("showKbd")) { // maybe we need to draw virtual keyboard
			this.virtualKeyboardCreate();
		}

		this.commonEventHandler.fnSetUserAction(this.onUserAction.bind(this)); // check first user action, also if sound is not yet on

		const sExample = oModel.getProperty<string>("example");

		oView.setSelectValue("exampleSelect", sExample);

		this.oVm = new CpcVm({
			canvas: this.oCanvas,
			keyboard: this.oKeyboard,
			sound: this.oSound,
			variables: this.oVariables,
			tron: oModel.getProperty<boolean>("tron")
		});
		this.oVm.vmReset();

		this.oRsx = new CpcVmRsx(this.oVm);
		this.oVm.vmSetRsxClass(this.oRsx);

		this.oNoStop = Object.assign({}, this.oVm.vmGetStopObject());
		this.oSavedStop = {
			sReason: "",
			iPriority: 0,
			oParas: {
				sCommand: "",
				iStream: 0,
				iLine: 0,
				iFirst: 0, // unused
				iLast: 0 // unused
			}
		}; // backup of stop object
		this.setStopObject(this.oNoStop);

		this.oCodeGeneratorJs = new CodeGeneratorJs({
			lexer: new BasicLexer(),
			parser: new BasicParser(),
			tron: this.model.getProperty<boolean>("tron"),
			rsx: this.oRsx // just to check the names
		});

		this.initDatabases();
		if (oModel.getProperty<boolean>("sound")) { // activate sound needs user action
			this.setSoundActive(); // activate in waiting state
		}
		if (oModel.getProperty<boolean>("showCpc")) {
			this.oCanvas.startUpdateCanvas();
		}

		this.initDropZone();
	}

	private initDatabases() {
		const oModel = this.model,
			oDatabases: DatabasesType = {},
			aDatabaseDirs = oModel.getProperty<string>("databaseDirs").split(",");

		for (let i = 0; i < aDatabaseDirs.length; i += 1) {
			const sDatabaseDir = aDatabaseDirs[i],
				aParts = sDatabaseDir.split("/"),
				sName = aParts[aParts.length - 1];

			oDatabases[sName] = {
				text: sName,
				title: sDatabaseDir,
				src: sDatabaseDir
			};
		}
		this.model.addDatabases(oDatabases);

		this.setDatabaseSelectOptions();
		this.onDatabaseSelectChange();
	}

	private onUserAction(/* event, sId */) {
		this.commonEventHandler.fnSetUserAction(undefined); // deactivate user action
		this.oSound.setActivatedByUser();
		this.setSoundActive();
	}

	// Also called from index file 0index.js
	addIndex(sDir: string, sInput: string): void { // sDir maybe ""
		sInput = sInput.trim();

		const aIndex = JSON.parse(sInput);

		for (let i = 0; i < aIndex.length; i += 1) {
			aIndex[i].dir = sDir;
			this.model.setExample(aIndex[i]);
		}
	}

	// Also called from example files xxxxx.js
	addItem(sKey: string, sInput: string): string { // sKey maybe ""
		if (!sKey) { // maybe ""
			sKey = (document.currentScript && document.currentScript.getAttribute("data-key")) || this.model.getProperty<string>("example");
			// on IE we can just get the current example
		}
		sInput = sInput.replace(/^\n/, "").replace(/\n$/, ""); // remove preceding and trailing newlines
		// beware of data files ending with newlines! (do not use trimEnd)

		const oExample = this.model.getExample(sKey);

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
			sDatabase = this.model.getProperty<string>("database");

		for (const sValue in oDatabases) {
			if (oDatabases.hasOwnProperty(sValue)) {
				const oDb = oDatabases[sValue],
					oItem: SelectOptionElement = {
						value: sValue,
						text: oDb.text,
						title: oDb.title,
						selected: sValue === sDatabase
					};

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
			sExample = this.model.getProperty<string>("example"),
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
				selected: false
			};

			oItem.text = oItem.title;
			aItems.push(oItem);
		}
		aItems.sort(fnSortByStringProperties);
		this.view.setSelectOptions(sSelect, aItems);
	}

	private updateStorageDatabase(sAction: string, sKey: string) {
		const sDatabase = this.model.getProperty<string>("database"),
			oStorage = Utils.localStorage;

		if (sDatabase !== "storage") {
			this.model.setProperty<string>("database", "storage"); // switch to storage database
		}

		let	aDir: string[];

		if (!sKey) { // no sKey => get all
			aDir = Controller.fnGetStorageDirectoryEntries();
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
					const sData = oStorage.getItem(sKey) || "",
						oData = Controller.splitMeta(sData);

					oExample = {
						key: sKey,
						title: "", // or set sKey?
						meta: oData.oMeta.sType // currently we take only the type
					};
					this.model.setExample(oExample);
				}
			} else {
				Utils.console.error("updateStorageDatabase: unknown action", sAction);
			}
		}

		if (sDatabase === "storage") {
			this.setExampleSelectOptions();
		} else {
			this.model.setProperty<string>("database", sDatabase); // restore database
		}
	}

	setInputText(sInput: string, bKeepStack?: boolean): void {
		this.view.setAreaValue("inputText", sInput);
		if (!bKeepStack) {
			this.fnInitUndoRedoButtons();
		} else {
			this.fnUpdateUndoRedoButtons();
		}
	}

	invalidateScript(): void {
		this.fnScript = undefined;
	}

	private fnWaitForContinue() {
		const iStream = 0,
			sKey = this.oKeyboard.getKeyFromBuffer();

		if (sKey !== "") {
			this.oVm.cursor(iStream, 0);
			this.oKeyboard.setKeyDownHandler(undefined);
			this.startContinue();
		}
	}

	private fnOnEscape() {
		const oStop = this.oVm.vmGetStopObject(),
			iStream = 0;

		if (this.oVm.vmOnBreakContSet()) {
			// ignore break
		} else if (oStop.sReason === "direct" || this.oVm.vmOnBreakHandlerActive()) {
			(oStop.oParas as VmInputParas).sInput = "";
			const sMsg = "*Break*\r\n";

			this.oVm.print(iStream, sMsg);
		} else if (oStop.sReason !== "escape") { // first escape?
			this.oVm.cursor(iStream, 1);
			this.oKeyboard.clearInput();
			this.oKeyboard.setKeyDownHandler(this.fnWaitForContinue.bind(this));
			this.setStopObject(oStop);
			this.oVm.vmStop("escape", 85, false, {
				sCommand: "escape",
				iStream: iStream,
				iFirst: 0, // unused
				iLast: 0, // unused
				iLine: this.oVm.iLine
			});
		} else { // second escape
			this.oKeyboard.setKeyDownHandler(undefined);
			this.oVm.cursor(iStream, 0);

			const oSavedStop = this.getStopObject();

			if (oSavedStop.sReason === "waitInput") { // sepcial handling: set line to repeat input
				this.oVm.vmGotoLine((oSavedStop.oParas as VmInputParas).iLine);
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
		const oStop = this.oVm.vmGetStopObject();

		this.oVm.vmLoopCondition(); // update iNextFrameTime, timers, inks; schedule sound: free queue
		if (this.oSound.isActivatedByUser()) { // only if activated
			const aSoundData = this.oVm.vmGetSoundData();

			while (aSoundData.length && this.oSound.testCanQueue(aSoundData[0].iState)) {
				this.oSound.sound(aSoundData.shift()!);
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
			this.oKeyboard.setKeyDownHandler(undefined);
		} else {
			this.fnWaitSound(); // sound and blinking events
			this.oKeyboard.setKeyDownHandler(this.fnWaitKeyHandler); // wait until keypress handler (for call &bb18)
		}
		return sKey;
	}

	private fnWaitInput() { // eslint-disable-line complexity
		const oStop = this.oVm.vmGetStopObject(),
			oInput = oStop.oParas as VmInputParas,
			iStream = oInput.iStream;
		let sInput = oInput.sInput,
			sKey: string;

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
				this.oKeyboard.setKeyDownHandler(undefined);
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

	//TODO
	private parseLineNumber(sLine: string) { // eslint-disable-line class-methods-use-this
		const iLine = parseInt(sLine, 10);

		if (iLine < 0 || iLine > 65535) {
			/*
			throw this.composeError(Error(), "Line number overflow", iLine, -1);
			this.outputError(this.oVm.vmComposeError(Error(), 6, String(iLine)), true);
			iLine = -1; //TTT
			const oError = this.oVm.vmComposeError(Error(), 6, String(iLine));

			this.oVm.vmStop("", 0, true); // clear error, onError
			this.outputError(oError, true);
			*/
		}
		return iLine;
	}

	// merge two scripts with sorted line numbers, lines from script2 overwrite lines from script1
	private mergeScripts(sScript1: string, sScript2: string) {
		const aLines1 = Utils.stringTrimEnd(sScript1).split("\n"),
			aLines2 = Utils.stringTrimEnd(sScript2).split("\n");
		let aResult = [],
			iLine1: number | undefined, iLine2: number | undefined;

		while (aLines1.length && aLines2.length) {
			iLine1 = iLine1 || this.parseLineNumber(aLines1[0]);
			iLine2 = iLine2 || this.parseLineNumber(aLines2[0]);

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
	private static fnGetLinesInRange(sScript: string, iFirstLine: number, iLastLine: number) {
		const aLines = sScript ? sScript.split("\n") : [];

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
		const aDir: string[] = [],
			oAllExamples = this.model.getAllExamples();
		let oRegExp: RegExp | undefined;

		if (sMask) {
			oRegExp = Controller.fnPrepareMaskRegExp(sMask);
		}

		for (const sKey in oAllExamples) {
			if (oAllExamples.hasOwnProperty(sKey)) {
				const oExample = oAllExamples[sKey],
					sKey2 = oExample.key,
					sMatchKey2 = sKey2 + ((sKey2.indexOf(".") < 0) ? "." : "");

				if (!oRegExp || oRegExp.test(sMatchKey2)) {
					aDir.push(sKey2);
				}
			}
		}
		return aDir;
	}

	private static fnGetStorageDirectoryEntries(sMask?: string) {
		const oStorage = Utils.localStorage,
			aDir: string[] = [];
		let	oRegExp: RegExp | undefined;

		if (sMask) {
			oRegExp = Controller.fnPrepareMaskRegExp(sMask);
		}

		for (let i = 0; i < oStorage.length; i += 1) {
			const sKey = oStorage.key(i);

			if (sKey !== null && oStorage[sKey].startsWith(this.sMetaIdent)) { // take only cpcBasic files
				if (!oRegExp || oRegExp.test(sKey)) {
					aDir.push(sKey);
				}
			}
		}
		return aDir;
	}

	private fnPrintDirectoryEntries(iStream: number, aDir: string[], bSort: boolean) {
		// first, format names
		for (let i = 0; i < aDir.length; i += 1) {
			const sKey = aDir[i],
				aParts = sKey.split(".");

			if (aParts.length === 2) {
				aDir[i] = aParts[0].padEnd(8, " ") + "." + aParts[1].padEnd(3, " ");
			}
		}

		if (bSort) {
			aDir.sort();
		}

		this.oVm.print(iStream, "\r\n");
		for (let i = 0; i < aDir.length; i += 1) {
			const sKey = aDir[i] + "  ";

			this.oVm.print(iStream, sKey);
		}
		this.oVm.print(iStream, "\r\n");
	}

	private fnFileCat(oParas: VmFileParas): void {
		const iStream = oParas.iStream,
			aDir = Controller.fnGetStorageDirectoryEntries();

		this.fnPrintDirectoryEntries(iStream, aDir, true);

		// currently only from localstorage

		this.oVm.vmStop("", 0, true);
	}

	private fnFileDir(oParas: VmFileParas): void {
		const iStream = oParas.iStream,
			sExample = this.model.getProperty<string>("example"), // if we have a fileMask, include also example names from same directory
			iLastSlash = sExample.lastIndexOf("/");

		let sFileMask = oParas.sFileMask ? Controller.fnLocalStorageName(oParas.sFileMask) : "",
			aDir = Controller.fnGetStorageDirectoryEntries(sFileMask),
			sPath = "";

		if (iLastSlash >= 0) {
			sPath = sExample.substr(0, iLastSlash) + "/";
			sFileMask = sPath + (sFileMask ? sFileMask : "*.*"); // only in same directory
		}

		const aDir2 = this.fnGetExampleDirectoryEntries(sFileMask); // also from examples

		for (let i = 0; i < aDir2.length; i += 1) {
			aDir2[i] = aDir2[i].substr(sPath.length); // remove preceding path including "/"
		}
		aDir = aDir2.concat(aDir); // combine

		this.fnPrintDirectoryEntries(iStream, aDir, false);
		this.oVm.vmStop("", 0, true);
	}

	private fnFileEra(oParas: VmFileParas): void {
		const iStream = oParas.iStream,
			oStorage = Utils.localStorage,
			sFileMask = Controller.fnLocalStorageName(oParas.sFileMask),
			aDir = Controller.fnGetStorageDirectoryEntries(sFileMask);

		if (!aDir.length) {
			this.oVm.print(iStream, sFileMask + " not found\r\n");
		}

		for (let i = 0; i < aDir.length; i += 1) {
			const sName = aDir[i];

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

	private fnFileRen(oParas: VmFileParas): void {
		const iStream = oParas.iStream,
			oStorage = Utils.localStorage,
			sNew = Controller.fnLocalStorageName(oParas.sNew as string),
			sOld = Controller.fnLocalStorageName(oParas.sOld as string),
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
	private static asmGena3Convert(sData: string) {
		const fnUInt16 = function (iPos2: number) {
				return sData.charCodeAt(iPos2) + sData.charCodeAt(iPos2 + 1) * 256;
			},
			iLength = sData.length;
		let iPos = 0,
			sOut = "";

		iPos += 4; // what is the meaning of these bytes?

		while (iPos < iLength) {
			const iLineNum = fnUInt16(iPos);

			iPos += 2;
			let iIndex1 = sData.indexOf("\r", iPos); // EOL marker 0x0d

			if (iIndex1 < 0) {
				iIndex1 = iLength;
			}
			let iIndex2 = sData.indexOf("\x1c", iPos); // EOL marker 0x1c

			if (iIndex2 < 0) {
				iIndex2 = iLength;
			}
			iIndex1 = Math.min(iIndex1, iIndex2);
			sOut += iLineNum + " " + sData.substring(iPos, iIndex1) + "\n";
			iPos = iIndex1 + 1;
		}

		return sOut;
	}

	private decodeTokenizedBasic(sInput: string) {
		if (!this.oBasicTokenizer) {
			this.oBasicTokenizer = new BasicTokenizer();
		}
		return this.oBasicTokenizer.decode(sInput);
	}

	private encodeTokenizedBasic(sInput: string, sName = "test") {
		if (!this.oCodeGeneratorToken) {
			this.oCodeGeneratorToken = new CodeGeneratorToken({
				lexer: new BasicLexer({
					bKeepWhiteSpace: true
				}),
				parser: new BasicParser({
					bKeepTokens: true,
					bKeepBrackets: true,
					bKeepColons: true,
					bKeepDataComma: true
				})
			});
		}
		const oOutput = this.oCodeGeneratorToken.generate(sInput);

		if (oOutput.error) {
			this.outputError(oOutput.error);
		} else if (Utils.debug > 1) {
			const sOutput = oOutput.text,
				sHex = sOutput.split("").map(function (s) { return s.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0"); }).join(","),
				sDecoded = this.decodeTokenizedBasic(sOutput),
				sDiff = Diff.testDiff(sInput.toUpperCase(), sDecoded.toUpperCase()); // for testing

			Utils.console.debug("TokenizerInput (" + sName + "):\n", sInput);
			Utils.console.debug("TokenizerHex (" + sName + "):\n", sHex);
			Utils.console.debug("TokenizerDecoded (" + sName + "):\n", sDecoded);
			Utils.console.debug("TokenizerDiff (" + sName + "):\n", sDiff);
		}

		return oOutput.text;
	}

	private prettyPrintBasic(sInput: string, bKeepWhiteSpace: boolean, bKeepBrackets: boolean) {
		if (!this.oCodeGeneratorBasic) {
			this.oCodeGeneratorBasic = new CodeGeneratorBasic({
				lexer: new BasicLexer(),
				parser: new BasicParser()
			});
		}

		const bKeepColons = bKeepBrackets, // we switch all with one setting
			bKeepDataComma = true;

		this.oCodeGeneratorBasic.getLexer().setOptions({
			bKeepWhiteSpace: bKeepWhiteSpace
		});
		this.oCodeGeneratorBasic.getParser().setOptions({
			bKeepTokens: true,
			bKeepBrackets: bKeepBrackets,
			bKeepColons: bKeepColons,
			bKeepDataComma: bKeepDataComma
		});

		const oOutput = this.oCodeGeneratorBasic.generate(sInput);

		if (oOutput.error) {
			this.outputError(oOutput.error);
		}
		return oOutput.text;
	}

	private loadFileContinue(sInput: string | null | undefined) { // eslint-disable-line complexity
		const oInFile = this.oVm.vmGetInFileObject(),
			sCommand = oInFile.sCommand;
		let	iStartLine = 0,
			bPutInMemory = false,
			oData: FileMetaAndData | undefined;

		if (sInput !== null && sInput !== undefined) {
			oData = Controller.splitMeta(sInput);

			sInput = oData.sData; // maybe changed

			if (oData.oMeta.sEncoding === "base64") {
				sInput = Utils.atob(sInput); // decode base64
			}

			const sType = oData.oMeta.sType;

			if (sType === "T") { // tokenized basic?
				sInput = this.decodeTokenizedBasic(sInput);
			} else if (sType === "P") { // BASIC?
				sInput = DiskImage.unOrProtectData(sInput);
				sInput = this.decodeTokenizedBasic(sInput);
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
				bPutInMemory = oInFile.fnFileCallback(sInput, oData && oData.oMeta) as boolean;
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
		const that = this,
			oInFile = this.oVm.vmGetInFileObject();
		var	sExample: string, sUrl: string,

			fnExampleLoaded = function (_sFullUrl: string, sKey: string, bSuppressLog?: boolean) {
				if (sKey !== sExample) {
					Utils.console.warn("fnExampleLoaded: Unexpected", sKey, "<>", sExample);
				}
				const oExample = that.model.getExample(sExample);

				if (!bSuppressLog) {
					Utils.console.log("Example", sUrl, oExample.meta || "", "loaded");
				}
				const sInput = oExample.script;

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
		const sKey = this.model.getProperty<string>("example");

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
			fnExampleLoaded("", sExample, true);
		} else if (sExample && oExample) { // need to load
			this.model.setProperty("example", sExample);
			const sDatabaseDir = this.model.getDatabase().src;

			sUrl = sDatabaseDir + "/" + sExample + ".js";
			Utils.loadScript(sUrl, fnExampleLoaded, fnExampleError, sExample);
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

	private static fnLocalStorageName(sName: string, sDefaultExtension?: string) {
		// modify name so we do not clash with localstorage methods/properites
		if (sName.indexOf(".") < 0) { // no dot inside name?
			sName += "." + (sDefaultExtension || ""); // append dot or default extension
		}
		return sName;
	}

	private static aDefaultExtensions = [
		"",
		"bas",
		"bin"
	];

	private static tryLoadingFromLocalStorage(sName: string) {
		const oStorage = Utils.localStorage;

		let sInput: string | null = null;

		if (sName.indexOf(".") >= 0) { // extension specified?
			sInput = oStorage.getItem(sName);
		} else {
			for (let i = 0; i < Controller.aDefaultExtensions.length; i += 1)	{
				const sStorageName = Controller.fnLocalStorageName(sName, Controller.aDefaultExtensions[i]);

				sInput = oStorage.getItem(sStorageName);
				if (sInput !== null) {
					break; // found
				}
			}
		}
		return sInput; // null=not found
	}

	private fnFileLoad() {
		const oInFile = this.oVm.vmGetInFileObject();

		if (oInFile.bOpen) {
			if (oInFile.sCommand === "chainMerge" && oInFile.iFirst && oInFile.iLast) { // special handling to delete line numbers first
				this.fnDeleteLines({
					iFirst: oInFile.iFirst,
					iLast: oInFile.iLast,
					sCommand: "CHAIN MERGE",
					iStream: 0, // unused
					iLine: this.oVm.iLine
				});
				this.oVm.vmStop("fileLoad", 90); // restore
			}

			const sName = oInFile.sName;

			if (Utils.debug > 1) {
				Utils.console.debug("fnFileLoad:", oInFile.sCommand, sName, "details:", oInFile);
			}

			const sInput = Controller.tryLoadingFromLocalStorage(sName);

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
			Utils.console.error("fnFileLoad:", oInFile.sName, "File not open!"); // hopefully isName is defined
		}
		this.iNextLoopTimeOut = this.oVm.vmGetTimeUntilFrame(); // wait until next frame
	}

	private static joinMeta(oMeta: FileMeta) {
		const sMeta = [
			Controller.sMetaIdent,
			oMeta.sType,
			oMeta.iStart,
			oMeta.iLength,
			oMeta.iEntry
		].join(";");

		return sMeta;
	}

	private static splitMeta(sInput: string) {
		let oMeta: FileMeta | undefined;

		if (sInput.indexOf(Controller.sMetaIdent) === 0) { // starts with metaIdent?
			const iIndex = sInput.indexOf(","); // metadata separator

			if (iIndex >= 0) {
				const sMeta = sInput.substr(0, iIndex);

				sInput = sInput.substr(iIndex + 1);

				const aMeta = sMeta.split(";");

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

		const oMetaAndData: FileMetaAndData = {
			oMeta: oMeta,
			sData: sInput
		};

		return oMetaAndData;
	}

	private fnFileSave() {
		const oOutFile = this.oVm.vmGetOutFileObject(),
			oStorage = Utils.localStorage;
		let	sDefaultExtension = "";

		if (oOutFile.bOpen) {
			const sType = oOutFile.sType,
				sName = oOutFile.sName;

			if (sType === "P" || sType === "T") {
				sDefaultExtension = "bas";
			} else if (sType === "B") {
				sDefaultExtension = "bin";
			}
			const sStorageName = Controller.fnLocalStorageName(sName, sDefaultExtension);
			let sFileData: string;

			if (oOutFile.aFileData.length || (sType === "B") || (oOutFile.sCommand === "openout")) { // sType A(for openout) or B
				sFileData = oOutFile.aFileData.join("");
			} else { // no file data (assuming sType A, P or T) => get text
				sFileData = this.view.getAreaValue("inputText");

				if (sType === "T" || sType === "P") {
					sFileData = this.encodeTokenizedBasic(sFileData, sStorageName);
					if (sFileData === "") {
						oOutFile.sType = "A"; // override sType
					} else if (sType === "P") {
						sFileData = DiskImage.unOrProtectData(sFileData);
					}
				}
				oOutFile.iLength = sFileData.length; // set length
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

			const sMeta = Controller.joinMeta(oOutFile);

			oStorage.setItem(sStorageName, sMeta + "," + sFileData);
			this.updateStorageDatabase("set", sStorageName);
			CpcVm.vmResetFileHandling(oOutFile); // make sure it is closed
		} else {
			Utils.console.error("fnFileSave: file not open!");
		}
		this.oVm.vmStop("", 0, true); // continue
	}

	private fnDeleteLines(oParas: VmLineParas) {
		const sInputText = this.view.getAreaValue("inputText"),
			aLines = Controller.fnGetLinesInRange(sInputText, oParas.iFirst, oParas.iLast);
		let	oError: CustomError | undefined;

		if (aLines.length) {
			for (let i = 0; i < aLines.length; i += 1) {
				const iLine = parseInt(aLines[i], 10);

				if (isNaN(iLine)) {
					oError = this.oVm.vmComposeError(Error(), 21, oParas.sCommand); // "Direct command found"
					this.outputError(oError, true);
					break;
				}
				aLines[i] = String(iLine); // keep just the line numbers
			}

			if (!oError) {
				let sInput = aLines.join("\n");

				sInput = this.mergeScripts(sInputText, sInput); // delete sInput lines
				this.setInputText(sInput);
			}
		}

		this.oVm.vmGotoLine(0); // reset current line
		this.oVm.vmStop("end", 0, true);
	}

	private fnNew() {
		const sInput = "";

		this.setInputText(sInput);
		this.oVariables.removeAllVariables();

		this.oVm.vmGotoLine(0); // reset current line
		this.oVm.vmStop("end", 0, true);
		this.invalidateScript();
	}

	private fnList(oParas: VmLineParas) {
		const sInput = this.view.getAreaValue("inputText"),
			iStream = oParas.iStream,
			aLines = Controller.fnGetLinesInRange(sInput, oParas.iFirst, oParas.iLast),
			oRegExp = new RegExp(/([\x00-\x1f])/g); // eslint-disable-line no-control-regex

		for (let i = 0; i < aLines.length; i += 1) {
			let sLine = aLines[i];

			if (iStream !== 9) {
				sLine = sLine.replace(oRegExp, "\x01$1"); // escape control characters to print them directly
			}
			this.oVm.print(iStream, sLine, "\r\n");
		}

		this.oVm.vmGotoLine(0); // reset current line
		this.oVm.vmStop("end", 0, true);
	}

	private fnReset() {
		const oVm = this.oVm;

		this.oVariables.removeAllVariables();

		oVm.vmReset();
		if (this.oVirtualKeyboard) {
			this.oVirtualKeyboard.reset();
		}

		oVm.vmStop("end", 0, true); // set "end" with priority 0, so that "compile only" still works
		oVm.sOut = "";
		this.view.setAreaValue("outputText", "");
		this.invalidateScript();
	}

	private outputError(oError: CustomError, bNoSelection?: boolean) {
		const iStream = 0,
			sShortError = oError.shortMessage || oError.message;

		if (!bNoSelection) {
			const iEndPos = (oError.pos || 0) + ((oError.value !== undefined) ? String(oError.value).length : 0);

			this.view.setAreaSelection("inputText", oError.pos || 0, iEndPos);
		}

		const sEscapedShortError = sShortError.replace(/([\x00-\x1f])/g, "\x01$1"); // eslint-disable-line no-control-regex

		this.oVm.print(iStream, sEscapedShortError + "\r\n");
		return sShortError;
	}

	private fnRenumLines(oParas: VmLineRenumParas) {
		const oVm = this.oVm,
			sInput = this.view.getAreaValue("inputText");

		if (!this.oBasicFormatter) {
			this.oBasicFormatter = new BasicFormatter({
				lexer: new BasicLexer(),
				parser: new BasicParser()
			});
		}

		const oOutput = this.oBasicFormatter.renumber(sInput, oParas.iNew, oParas.iOld, oParas.iStep, oParas.iKeep);

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
	}

	private fnEditLineCallback() {
		const oInput = this.oVm.vmGetStopObject().oParas as VmInputParas,
			sInputText = this.view.getAreaValue("inputText");
		let sInput = oInput.sInput;

		sInput = this.mergeScripts(sInputText, sInput);
		this.setInputText(sInput);
		this.oVm.vmSetStartLine(0);
		this.oVm.vmGotoLine(0); // to be sure
		this.view.setDisabled("continueButton", true);
		this.oVm.cursor(oInput.iStream, 0);
		this.oVm.vmStop("end", 90);
		return true;
	}

	private fnEditLine(oParas: VmLineParas) {
		const sInput = this.view.getAreaValue("inputText"),
			iStream = oParas.iStream,
			iLine = oParas.iFirst,
			aLines = Controller.fnGetLinesInRange(sInput, iLine, iLine);

		if (aLines.length) {
			const sLine = aLines[0];

			this.oVm.print(iStream, sLine);
			this.oVm.cursor(iStream, 1);
			const oInputParas: VmInputParas = {
				sCommand: oParas.sCommand,
				iLine: oParas.iLine,
				iStream: iStream,
				sMessage: "",
				fnInputCallback: this.fnEditLineCallback.bind(this),
				sInput: sLine
			};

			this.oVm.vmStop("waitInput", 45, true, oInputParas);
			this.fnWaitInput();
		} else {
			const oError = this.oVm.vmComposeError(Error(), 8, String(iLine)); // "Line does not exist"

			this.oVm.print(iStream, String(oError) + "\r\n");
			this.oVm.vmStop("stop", 60, true);
		}
	}

	private fnParseBench(sInput: string, iBench: number) {
		let oOutput: IOutput | undefined;

		for (let i = 0; i < iBench; i += 1) {
			let iTime = Date.now();

			oOutput = this.oCodeGeneratorJs.generate(sInput, this.oVariables);
			iTime = Date.now() - iTime;
			Utils.console.debug("bench size", sInput.length, "labels", this.oCodeGeneratorJs.debugGetLabelsCount(), "loop", i, ":", iTime, "ms");
			if (oOutput.error) {
				break;
			}
		}

		return oOutput;
	}

	private fnParse(): IOutput {
		const sInput = this.view.getAreaValue("inputText"),
			iBench = this.model.getProperty<number>("bench");

		this.oVariables.removeAllVariables();
		let	oOutput: IOutput;

		if (!iBench) {
			oOutput = this.oCodeGeneratorJs.generate(sInput, this.oVariables);
		} else {
			oOutput = this.fnParseBench(sInput, iBench) as IOutput;
		}

		let sOutput: string;

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

	/*
	fnPretty(): void {
		const sInput = this.view.getAreaValue("inputText"),
			oCodeGeneratorBasic = new CodeGeneratorBasic({
				lexer: new BasicLexer({
					bKeepWhiteSpace: true
				}),
				parser: new BasicParser({
					bKeepBrackets: true
				})
			}),
			oOutput = oCodeGeneratorBasic.generate(sInput);

		if (oOutput.error) {
			this.outputError(oOutput.error);
		} else {
			const sOutput = oOutput.text;

			this.fnPutChangedInputOnStack();
			this.setInputText(sOutput, true);
			this.fnPutChangedInputOnStack();

			const sDiff = Diff.testDiff(sInput.toUpperCase(), sOutput.toUpperCase()); // for testing

			this.view.setAreaValue("outputText", sDiff);
		}
	}
	*/

	fnPretty(): void {
		const sInput = this.view.getAreaValue("inputText"),
			bKeepWhiteSpace = this.view.getInputChecked("prettySpaceInput"),
			bKeepBrackets = this.view.getInputChecked("prettyBracketsInput"),
			sOutput = this.prettyPrintBasic(sInput, bKeepWhiteSpace, bKeepBrackets);

		if (sOutput) {
			this.fnPutChangedInputOnStack();
			this.setInputText(sOutput, true);
			this.fnPutChangedInputOnStack();

			// for testing:
			const sDiff = Diff.testDiff(sInput.toUpperCase(), sOutput.toUpperCase());

			this.view.setAreaValue("outputText", sDiff);
		}
	}


	// https://blog.logrocket.com/programmatic-file-downloads-in-the-browser-9a5186298d5c/
	private static fnDownloadBlob(blob: Blob, sFilename: string) {
		const url = URL.createObjectURL(blob),
			a = document.createElement("a"),
			clickHandler = function () {
				setTimeout(function () {
					URL.revokeObjectURL(url);
					a.removeEventListener("click", clickHandler);
				}, 150);
			};

		a.href = url;
		a.download = sFilename || "download";

		a.addEventListener("click", clickHandler, false);

		a.click();

		return a;
	}

	private fnDownloadNewFile(sData: string, sFileName: string) { // eslint-disable-line class-methods-use-this
		const sType = "octet/stream",
			oBuffer = new ArrayBuffer(sData.length),
			oData8 = new Uint8Array(oBuffer);

		for (let i = 0; i < sData.length; i += 1) {
			oData8[i] = sData.charCodeAt(i);
		}

		const blob = new Blob([oData8.buffer], {
			type: sType
		});

		if (window.navigator && window.navigator.msSaveOrOpenBlob) { // IE11 support
			window.navigator.msSaveOrOpenBlob(blob, sFileName);
		} else {
			Controller.fnDownloadBlob(blob, sFileName);
		}
	}


	fnDownload(): void {
		const sInput = this.view.getAreaValue("inputText"),
			sTokens = this.encodeTokenizedBasic(sInput);

		if (sTokens !== "") {
			const oHeader = Controller.createMinimalAmsdosHeader("T", 0x170, sTokens.length),
				sHeader = DiskImage.combineAmsdosHeader(oHeader),
				sData = sHeader + sTokens;

			this.fnDownloadNewFile(sData, "file.bas");
		}
	}

	private selectJsError(sScript: string, e: Error) {
		const iLineNumber = (e as any).lineNumber, // only on FireFox
			iColumnNumber = (e as any).columnNumber,
			iErrLine = iLineNumber - 3; // for some reason line 0 is 3
		let iPos = 0,
			iLine = 0;

		while (iPos < sScript.length && iLine < iErrLine) {
			iPos = sScript.indexOf("\n", iPos) + 1;
			iLine += 1;
		}
		iPos += iColumnNumber;

		Utils.console.warn("Info: JS Error occurred at line", iLineNumber, "column", iColumnNumber, "pos", iPos);

		this.view.setAreaSelection("outputText", iPos, iPos + 1);
	}

	private fnRun(oParas?: VmStopParas) {
		const sScript = this.view.getAreaValue("outputText"),
			oVm = this.oVm;
		let iLine = oParas && (oParas as VmLineParas).iFirst || 0;

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
			this.oKeyboard.putKeysInBuffer(this.model.getProperty<string>("input"));
		}

		if (this.fnScript) {
			oVm.sOut = this.view.getAreaValue("resultText");
			oVm.vmStop("", 0, true);
			oVm.vmGotoLine(0); // to load DATA lines
			this.oVm.vmSetStartLine(iLine as number); // clear resets also startline

			this.view.setDisabled("runButton", true);
			this.view.setDisabled("stopButton", false);
			this.view.setDisabled("continueButton", true);
		}
		if (Utils.debug > 1) {
			Utils.console.debug("End of fnRun");
		}
	}

	private fnParseRun() {
		const oOutput = this.fnParse();

		if (!oOutput.error) {
			this.fnRun();
		}
	}

	private fnRunPart1(fnScript: Function) { // eslint-disable-line @typescript-eslint/ban-types
		try {
			fnScript(this.oVm);
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
		const oInput = this.oVm.vmGetStopObject().oParas as VmInputParas,
			iStream = oInput.iStream;
		let sInput = oInput.sInput;

		sInput = sInput.trim();
		oInput.sInput = "";
		if (sInput !== "") { // direct input
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

			const oCodeGeneratorJs = this.oCodeGeneratorJs;
			let	oOutput: IOutput | undefined,
				sOutput: string;

			if (sInputText && (/^\d+($| )/).test(sInputText)) { // do we have a program starting with a line number?
				oOutput = oCodeGeneratorJs.generate(sInput + "\n" + sInputText, this.oVariables, true); // compile both; allow direct command
				if (oOutput.error) {
					const oError = oOutput.error;

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
			} else {
				sOutput = oOutput.text;
			}

			if (sOutput && sOutput.length > 0) {
				sOutput += "\n";
			}
			this.view.setAreaValue("outputText", sOutput);

			if (!oOutput.error) {
				this.oVm.vmSetStartLine(this.oVm.iLine as number); // fast hack
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

	private fnWaitFrame() {
		this.oVm.vmStop("", 0, true);
		this.iNextLoopTimeOut = this.oVm.vmGetTimeUntilFrame(); // wait until next frame
	}

	private fnOnError() {
		this.oVm.vmStop("", 0, true); // continue
	}

	private static fnDummy() {
		// empty
	}

	private fnTimer() {
		this.oVm.vmStop("", 0, true); // continue
	}

	private fnRunLoop() {
		const oStop = this.oVm.vmGetStopObject();

		this.iNextLoopTimeOut = 0;
		if (!oStop.sReason && this.fnScript) {
			this.fnRunPart1(this.fnScript); // could change sReason
		}

		if (oStop.sReason in this.mHandlers) {
			this.mHandlers[oStop.sReason].call(this, oStop.oParas);
		} else {
			Utils.console.warn("runLoop: Unknown run mode:", oStop.sReason);
			this.oVm.vmStop("error", 50);
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

	private setStopObject(oStop: VmStopEntry) {
		Object.assign(this.oSavedStop, oStop);
	}

	private getStopObject() {
		return this.oSavedStop;
	}


	startParse(): void {
		this.oKeyboard.setKeyDownHandler(undefined);
		this.oVm.vmStop("parse", 95);
		this.startMainLoop();
	}

	startRenum(): void {
		const iStream = 0;

		this.oVm.vmStop("renumLines", 85, false, {
			sCommand: "renum",
			iStream: 0, // unused
			iNew: Number(this.view.getInputValue("renumNewInput")), // 10
			iOld: Number(this.view.getInputValue("renumStartInput")), // 1
			iStep: Number(this.view.getInputValue("renumStepInput")), // 10
			iKeep: Number(this.view.getInputValue("renumKeepInput")), // 65535, keep lines
			iLine: this.oVm.iLine
		});

		if (this.oVm.pos(iStream) > 1) {
			this.oVm.print(iStream, "\r\n");
		}
		this.oVm.print(iStream, "renum\r\n");
		this.startMainLoop();
	}

	startRun(): void {
		this.setStopObject(this.oNoStop);

		this.oKeyboard.setKeyDownHandler(undefined);
		this.oVm.vmStop("run", 95);
		this.startMainLoop();
	}

	startParseRun(): void {
		this.setStopObject(this.oNoStop);
		this.oKeyboard.setKeyDownHandler(undefined);
		this.oVm.vmStop("parseRun", 95);
		this.startMainLoop();
	}

	startBreak(): void {
		const oVm = this.oVm,
			oStop = oVm.vmGetStopObject();

		this.setStopObject(oStop);
		this.oKeyboard.setKeyDownHandler(undefined);
		this.oVm.vmStop("break", 80);
		this.startMainLoop();
	}

	startContinue(): void {
		const oVm = this.oVm,
			oStop = oVm.vmGetStopObject(),
			oSavedStop = this.getStopObject();

		this.view.setDisabled("runButton", true);
		this.view.setDisabled("stopButton", false);
		this.view.setDisabled("continueButton", true);
		if (oStop.sReason === "break" || oStop.sReason === "escape" || oStop.sReason === "stop" || oStop.sReason === "direct") {
			if (oSavedStop.oParas && !(oSavedStop.oParas as VmInputParas).fnInputCallback) { // no keyboard callback? make sure no handler is set (especially for direct->continue)
				this.oKeyboard.setKeyDownHandler(undefined);
			}
			if (oStop.sReason === "direct" || oStop.sReason === "escape") {
				this.oVm.cursor(oStop.oParas.iStream, 0); // switch it off (for continue button)
			}
			Object.assign(oStop, oSavedStop); // fast hack
			this.setStopObject(this.oNoStop);
		}
		this.startMainLoop();
	}

	startReset(): void {
		this.setStopObject(this.oNoStop);
		this.oKeyboard.setKeyDownHandler(undefined);
		this.oVm.vmStop("reset", 99);
		this.startMainLoop();
	}

	startScreenshot(): string {
		return this.oCanvas.startScreenshot();
	}

	private fnPutKeyInBuffer(sKey: string) {
		this.oKeyboard.putKeyInBuffer(sKey);

		const oKeyDownHandler = this.oKeyboard.getKeyDownHandler();

		if (oKeyDownHandler) {
			oKeyDownHandler();
		}
	}

	startEnter(): void {
		let sInput = this.view.getAreaValue("inp2Text");

		sInput = sInput.replace("\n", "\r"); // LF => CR
		if (!sInput.endsWith("\r")) {
			sInput += "\r";
		}
		for (let i = 0; i < sInput.length; i += 1) {
			this.fnPutKeyInBuffer(sInput.charAt(i));
		}

		this.view.setAreaValue("inp2Text", "");
	}

	private static generateFunction(sPar: string, sFunction: string) {
		if (sFunction.startsWith("function anonymous(")) { // already a modified function (inside an anonymous function)?
			const iFirstIndex = sFunction.indexOf("{"),
				iLastIndex = sFunction.lastIndexOf("}");

			if (iFirstIndex >= 0 && iLastIndex >= 0) {
				sFunction = sFunction.substring(iFirstIndex + 1, iLastIndex - 1); // remove anonymous function
			}
			sFunction = sFunction.trim();
		} else {
			sFunction = "var o=cpcBasic.controller.oVm, v=o.vmGetAllVariables(); v." + sPar + " = " + sFunction;
		}

		const aMatch = (/function \(([^)]*)/).exec(sFunction),
			aArgs = aMatch ? aMatch[1].split(",") : [],
			fnFunction = new Function(aArgs[0], aArgs[1], aArgs[2], aArgs[3], aArgs[4], sFunction); // eslint-disable-line no-new-func
			// we support at most 5 arguments

		return fnFunction;
	}

	changeVariable(): void {
		const sPar = this.view.getSelectValue("varSelect"),
			sValue = this.view.getSelectValue("varText"),
			oVariables = this.oVariables;
		let value = oVariables.getVariable(sPar);

		if (typeof value === "function") {
			value = Controller.generateFunction(sPar, sValue);
			oVariables.setVariable(sPar, value);
		} else {
			const sVarType = this.oVariables.determineStaticVarType(sPar),
				sType = this.oVm.vmDetermineVarType(sVarType); // do we know dynamic type?

			if (sType !== "$") { // not string? => convert to number
				value = parseFloat(sValue);
			} else {
				value = sValue;
			}

			try {
				const value2 = this.oVm.vmAssign(sVarType, value);

				oVariables.setVariable(sPar, value2);
				Utils.console.log("Variable", sPar, "changed:", oVariables.getVariable(sPar), "=>", value);
			} catch (e) {
				Utils.console.warn(e);
			}
		}
		this.setVarSelectOptions("varSelect", oVariables);
		this.commonEventHandler.onVarSelectChange(); // title change?
	}

	setSoundActive(): void {
		const oSound = this.oSound,
			soundButton = View.getElementById1("soundButton"),
			bActive = this.model.getProperty<boolean>("sound");
		let	sText: string;

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
			const oStop = this.oVm && this.oVm.vmGetStopObject();

			if (oStop && oStop.sReason === "waitSound") {
				this.oVm.vmStop("", 0, true); // do not wait
			}
		}
		soundButton.innerText = sText;
	}

	private static createMinimalAmsdosHeader(sType: string,	iStart: number,	iLength: number) {
		const oHeader = {
			sType: sType,
			iStart: iStart,
			iLength: iLength
		} as AmsdosHeader;

		return oHeader;
	}


	private fnEndOfImport(aImported: string[]) {
		const iStream = 0,
			oVm = this.oVm;

		for (let i = 0; i < aImported.length; i += 1) {
			oVm.print(iStream, aImported[i], " ");
		}
		oVm.print(iStream, "\r\n", aImported.length + " file" + (aImported.length !== 1 ? "s" : "") + " imported.\r\n");
		this.updateResultText();
	}

	private static reRegExpIsText = new RegExp(/^\d+ |^[\t\r\n\x1a\x20-\x7e]*$/); // eslint-disable-line no-control-regex
	// starting with (line) number, or 7 bit ASCII characters without control codes except \x1a=EOF

	private fnLoad2(sData: string, sName: string, sType: string, aImported: string[]) {
		let oHeader: AmsdosHeader | undefined,
			sStorageName = this.oVm.vmAdaptFilename(sName, "FILE");

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
			} else if (Controller.reRegExpIsText.test(sData)) {
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
							this.fnLoad2(sData, sFileName, "cpcBasic/binary", aImported); // recursive
						} catch (e) {
							Utils.console.error(e);
							this.outputError(e, true);
						}
					}
				} catch (e) {
					Utils.console.error(e);
					this.outputError(e, true);
				}
				oHeader = undefined; // ignore dsk file
			} else { // binary
				oHeader = Controller.createMinimalAmsdosHeader("B", 0, sData.length);
			}
		}

		if (oHeader) {
			const sMeta = Controller.joinMeta(oHeader);

			try {
				Utils.localStorage.setItem(sStorageName, sMeta + "," + sData);
				this.updateStorageDatabase("set", sStorageName);
				Utils.console.log("fnOnLoad: file: " + sStorageName + " meta: " + sMeta + " imported");
				aImported.push(sName);
			} catch (e) { // maybe quota exceeded
				Utils.console.error(e);
				if (e.name === "QuotaExceededError") {
					e.shortMessage = sStorageName + ": Quota exceeded";
				}
				this.outputError(e, true);
			}
		}
	}

	// https://stackoverflow.com/questions/10261989/html5-javascript-drag-and-drop-file-from-external-window-windows-explorer
	// https://www.w3.org/TR/file-upload/#dfn-filereader
	private fnHandleFileSelect(event: Event) {
		const oDataTransfer = (event as DragEvent).dataTransfer,
			aFiles = oDataTransfer ? oDataTransfer.files : ((event.target as any).files as FileList), // dataTransfer for drag&drop, target.files for file input
			that = this,
			aImported: string[] = [];
		let iFile = 0,
			oFile: File,
			oReader: FileReader;

		function fnReadNextFile() {
			if (iFile < aFiles.length) {
				oFile = aFiles[iFile];
				iFile += 1;
				const lastModified = oFile.lastModified,
					lastModifiedDate = lastModified ? new Date(lastModified) : (oFile as any).lastModifiedDate as Date, // lastModifiedDate deprecated, but for old IE
					sText = oFile.name + " " + (oFile.type || "n/a") + " " + oFile.size + " " + (lastModifiedDate ? lastModifiedDate.toLocaleDateString() : "n/a");

				Utils.console.log(sText);
				if (oFile.type === "text/plain") {
					oReader.readAsText(oFile);
				} else if (oFile.type === "application/x-zip-compressed") {
					oReader.readAsArrayBuffer(oFile);
				} else {
					oReader.readAsDataURL(oFile);
				}
			} else {
				that.fnEndOfImport(aImported);
			}
		}

		function fnErrorHandler(event2: ProgressEvent<FileReader>) {
			const oTarget = event2.target;
			let sMsg = "fnErrorHandler: Error reading file " + oFile.name;

			if (oTarget !== null && oTarget.error !== null) {
				if (oTarget.error.NOT_FOUND_ERR) {
					sMsg += ": File not found";
				} else if (oTarget.error.ABORT_ERR) {
					sMsg = ""; // nothing
				}
			}
			if (sMsg) {
				Utils.console.warn(sMsg);
			}
			fnReadNextFile();
		}

		function fnOnLoad(event2: ProgressEvent<FileReader>) {
			const oTarget = event2.target,
				data = (oTarget && oTarget.result) || null,
				sName = oFile.name,
				sType = oFile.type;

			if (sType === "application/x-zip-compressed" && data instanceof ArrayBuffer) {
				let oZip: ZipFile | undefined;

				try {
					oZip = new ZipFile(new Uint8Array(data), sName); // rather aData
				} catch (e) {
					Utils.console.error(e);
					that.outputError(e, true);
				}
				if (oZip) {
					const oZipDirectory = oZip.getZipDirectory(),
						aEntries = Object.keys(oZipDirectory);

					for (let i = 0; i < aEntries.length; i += 1) {
						const sName2 = aEntries[i];
						let sData2: string | undefined;

						try {
							sData2 = oZip.readData(sName2);
						} catch (e) {
							Utils.console.error(e);
							that.outputError(e, true);
						}

						if (sData2) {
							that.fnLoad2(sData2, sName2, sType, aImported);
						}
					}
				}
			} else if (typeof data === "string") {
				that.fnLoad2(data, sName, sType, aImported);
			} else {
				Utils.console.warn("Error loading file", sName, "with type", sType, " unexpected data:", data);
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

	private static fnHandleDragOver(evt: DragEvent) {
		evt.stopPropagation();
		evt.preventDefault();
		if (evt.dataTransfer !== null) {
			evt.dataTransfer.dropEffect = "copy"; // explicitly show this is a copy
		}
	}

	private initDropZone() {
		const dropZone = View.getElementById1("dropZone");

		dropZone.addEventListener("dragover", Controller.fnHandleDragOver.bind(this), false);
		dropZone.addEventListener("drop", this.fnHandleFileSelect.bind(this), false);

		const canvasElement = this.oCanvas.getCanvas();

		canvasElement.addEventListener("dragover", Controller.fnHandleDragOver.bind(this), false); //TTT fast hack
		canvasElement.addEventListener("drop", this.fnHandleFileSelect.bind(this), false);

		View.getElementById1("fileInput").addEventListener("change", this.fnHandleFileSelect.bind(this), false);
	}

	private fnUpdateUndoRedoButtons() {
		this.view.setDisabled("undoButton", !this.inputStack.canUndoKeepOne());
		this.view.setDisabled("redoButton", !this.inputStack.canRedo());
	}

	private fnInitUndoRedoButtons() {
		this.inputStack.reset();
		this.fnUpdateUndoRedoButtons();
	}

	private fnPutChangedInputOnStack() {
		const sInput = this.view.getAreaValue("inputText"),
			sStackInput = this.inputStack.getInput();

		if (sStackInput !== sInput) {
			this.inputStack.save(sInput);
			this.fnUpdateUndoRedoButtons();
		}
	}

	startUpdateCanvas(): void {
		this.oCanvas.startUpdateCanvas();
	}

	stopUpdateCanvas(): void {
		this.oCanvas.stopUpdateCanvas();
	}

	virtualKeyboardCreate(): void {
		if (!this.oVirtualKeyboard) {
			this.oVirtualKeyboard = new VirtualKeyboard({
				fnPressCpcKey: this.oKeyboard.fnPressCpcKey.bind(this.oKeyboard),
				fnReleaseCpcKey: this.oKeyboard.fnReleaseCpcKey.bind(this.oKeyboard)
			});
		}
	}

	getVariable(sPar: string): VariableValue {
		return this.oVariables.getVariable(sPar);
	}

	undoStackElement(): string {
		return this.inputStack.undo();
	}

	redoStackElement(): string {
		return this.inputStack.redo();
	}

	onDatabaseSelectChange(): void {
		let sUrl: string;
		const sDatabase = this.view.getSelectValue("databaseSelect");

		this.model.setProperty("database", sDatabase);
		this.view.setSelectTitleFromSelectedOption("databaseSelect");

		const oDatabase = this.model.getDatabase(),
			that = this,
			fnDatabaseLoaded = function () {
				oDatabase.loaded = true;
				Utils.console.log("fnDatabaseLoaded: database loaded: " + sDatabase + ": " + sUrl);
				that.setExampleSelectOptions();
				that.onExampleSelectChange();
			},
			fnDatabaseError = function () {
				oDatabase.loaded = false;
				Utils.console.error("fnDatabaseError: database error: " + sDatabase + ": " + sUrl);
				that.setExampleSelectOptions();
				that.onExampleSelectChange();
				that.setInputText("");
				that.view.setAreaValue("resultText", "Cannot load database: " + sDatabase);
			};

		if (!oDatabase) {
			Utils.console.error("onDatabaseSelectChange: database not available:", sDatabase);
			return;
		}

		if (oDatabase.text === "storage") { // sepcial handling: browser localStorage
			this.updateStorageDatabase("set", ""); // set all
			oDatabase.loaded = true;
		}

		if (oDatabase.loaded) {
			this.setExampleSelectOptions();
			this.onExampleSelectChange();
		} else {
			this.setInputText("#loading database " + sDatabase + "...");
			const sExampleIndex = this.model.getProperty<string>("exampleIndex");

			sUrl = oDatabase.src + "/" + sExampleIndex;
			Utils.loadScript(sUrl, fnDatabaseLoaded, fnDatabaseError, sDatabase);
		}
	}

	onExampleSelectChange(): void {
		const oVm = this.oVm,
			oInFile = oVm.vmGetInFileObject(),
			sDataBase = this.model.getProperty<string>("database");

		oVm.closein();

		oInFile.bOpen = true;

		let sExample = this.view.getSelectValue("exampleSelect");
		const oExample = this.model.getExample(sExample);

		oInFile.sCommand = "run";
		if (oExample && oExample.meta) { // TTT TODO: this is just a workaround, meta is in input now; should change command after loading!
			const sType = oExample.meta.charAt(0);

			if (sType === "B" || sType === "D" || sType === "G") { // binary, data only, Gena Assembler?
				oInFile.sCommand = "load";
			}
		}

		if (sDataBase !== "storage") {
			sExample = "/" + sExample; // load absolute
		} else {
			this.model.setProperty("example", sExample);
		}

		oInFile.sName = sExample;
		oInFile.iStart = undefined;
		oInFile.fnFileCallback = oVm.fnLoadHandler;
		oVm.vmStop("fileLoad", 90);
		this.startMainLoop();
	}

	// currently not used. Can be called manually: cpcBasic.controller.exportAsBase64(file);
	static exportAsBase64(sStorageName: string): string {
		const oStorage = Utils.localStorage;
		let sData = oStorage.getItem(sStorageName),
			sOut = "";

		if (sData !== null) {
			const iIndex = sData.indexOf(","); // metadata separator

			if (iIndex >= 0) {
				const sMeta = sData.substr(0, iIndex);

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

	onCpcCanvasClick(event: MouseEvent): void {
		this.oCanvas.onCpcCanvasClick(event);
		this.oKeyboard.setActive(true);
	}

	onWindowClick(event: Event): void {
		this.oCanvas.onWindowClick(event);
		this.oKeyboard.setActive(false);
	}


	/* eslint-disable no-invalid-this */
	private mHandlers: { [k: string]: (oParas: any) => void } = { // { [k: string]: (e: Event) => void }
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
	}
	/* eslint-enable no-invalid-this */
}
