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
import { Sound, SoundData } from "./Sound";
import { Variables, VariableValue } from "./Variables";
import { View, SelectOptionElement } from "./View";
import { ZipFile } from "./ZipFile";

interface FileMetaAndData {
	meta: FileMeta
	data: string
}

export class Controller implements IController {
	private fnRunLoopHandler: () => void;
	private fnWaitKeyHandler: () => void;
	private fnWaitInputHandler: () => void;
	private fnOnEscapeHandler: () => void;
	private fnDirectInputHandler: () => boolean;
	private fnPutKeyInBufferHandler: (key: string) => void;

	private static metaIdent = "CPCBasic";

	private fnScript?: Function = undefined; // eslint-disable-line @typescript-eslint/ban-types

	private timeoutHandlerActive = false;
	private nextLoopTimeOut = 0; // next timeout for the main loop

	private inputSet = false;

	private variables = new Variables();

	private basicFormatter?: BasicFormatter; // for renum
	private basicTokenizer?: BasicTokenizer; // to decode tokenized BASIC
	private codeGeneratorToken?: CodeGeneratorToken; // to encode tokenized BASIC
	private codeGeneratorBasic?: CodeGeneratorBasic; // for pretty print
	private model: Model;
	private view: View;
	private commonEventHandler: CommonEventHandler;

	private codeGeneratorJs: CodeGeneratorJs;

	private canvas: Canvas;

	private inputStack = new InputStack();

	private keyboard: Keyboard;
	private virtualKeyboard?: VirtualKeyboard;
	private sound = new Sound();

	private vm: CpcVm;
	private rsx: CpcVmRsx;

	private noStop: VmStopEntry;
	private savedStop: VmStopEntry; // backup of stop object

	constructor(model: Model, view: View) {
		this.fnRunLoopHandler = this.fnRunLoop.bind(this);
		this.fnWaitKeyHandler = this.fnWaitKey.bind(this);
		this.fnWaitInputHandler = this.fnWaitInput.bind(this);
		this.fnOnEscapeHandler = this.fnOnEscape.bind(this);
		this.fnDirectInputHandler = this.fnDirectInput.bind(this);
		this.fnPutKeyInBufferHandler = this.fnPutKeyInBuffer.bind(this);

		this.model = model;
		this.view = view;
		this.commonEventHandler = new CommonEventHandler(model, view, this);
		this.view.attachEventHandler("click", this.commonEventHandler);
		this.view.attachEventHandler("change", this.commonEventHandler);

		view.setHidden("consoleBox", !model.getProperty<boolean>("showConsole"));

		view.setHidden("inputArea", !model.getProperty<boolean>("showInput"));
		view.setHidden("inp2Area", !model.getProperty<boolean>("showInp2"));
		view.setHidden("outputArea", !model.getProperty<boolean>("showOutput"));
		view.setHidden("resultArea", !model.getProperty<boolean>("showResult"));
		view.setHidden("textArea", !model.getProperty<boolean>("showText"));
		view.setHidden("variableArea", !model.getProperty<boolean>("showVariable"));
		view.setHidden("kbdArea", !model.getProperty<boolean>("showKbd"), "flex");
		view.setHidden("kbdLayoutArea", !model.getProperty<boolean>("showKbdLayout"));

		view.setHidden("cpcArea", false); // make sure canvas is not hidden (allows to get width, height)
		this.canvas = new Canvas({
			charset: cpcCharset,
			onClickKey: this.fnPutKeyInBufferHandler
		});
		view.setHidden("cpcArea", !model.getProperty<boolean>("showCpc"));

		view.setHidden("convertArea", !model.getProperty<boolean>("showConvert"), "flex");

		const kbdLayout = model.getProperty<string>("kbdLayout");

		view.setSelectValue("kbdLayoutSelect", kbdLayout);
		this.commonEventHandler.onKbdLayoutSelectChange();

		this.keyboard = new Keyboard({
			fnOnEscapeHandler: this.fnOnEscapeHandler
		});

		if (this.model.getProperty<boolean>("showKbd")) { // maybe we need to draw virtual keyboard
			this.virtualKeyboardCreate();
		}

		this.commonEventHandler.fnSetUserAction(this.onUserAction.bind(this)); // check first user action, also if sound is not yet on

		const example = model.getProperty<string>("example");

		view.setSelectValue("exampleSelect", example);

		this.vm = new CpcVm({
			canvas: this.canvas,
			keyboard: this.keyboard,
			sound: this.sound,
			variables: this.variables,
			tron: model.getProperty<boolean>("tron")
		});
		this.vm.vmReset();

		this.rsx = new CpcVmRsx(this.vm);
		this.vm.vmSetRsxClass(this.rsx);

		this.noStop = Object.assign({}, this.vm.vmGetStopObject());
		this.savedStop = {
			reason: "",
			priority: 0,
			paras: {
				command: "",
				stream: 0,
				line: 0,
				first: 0, // unused
				last: 0 // unused
			}
		}; // backup of stop object
		this.setStopObject(this.noStop);

		this.codeGeneratorJs = new CodeGeneratorJs({
			lexer: new BasicLexer(),
			parser: new BasicParser(),
			tron: this.model.getProperty<boolean>("tron"),
			rsx: this.rsx // just to check the names
		});

		this.initDatabases();
		if (model.getProperty<boolean>("sound")) { // activate sound needs user action
			this.setSoundActive(); // activate in waiting state
		}
		if (model.getProperty<boolean>("showCpc")) {
			this.canvas.startUpdateCanvas();
		}

		this.initDropZone();
	}

	private initDatabases() {
		const model = this.model,
			databases: DatabasesType = {},
			databaseDirs = model.getProperty<string>("databaseDirs").split(",");

		for (let i = 0; i < databaseDirs.length; i += 1) {
			const databaseDir = databaseDirs[i],
				parts = databaseDir.split("/"),
				name = parts[parts.length - 1];

			databases[name] = {
				text: name,
				title: databaseDir,
				src: databaseDir
			};
		}
		this.model.addDatabases(databases);

		this.setDatabaseSelectOptions();
		this.onDatabaseSelectChange();
	}

	private onUserAction(/* event, id */) {
		this.commonEventHandler.fnSetUserAction(undefined); // deactivate user action
		this.sound.setActivatedByUser();
		this.setSoundActive();
	}

	// Also called from index file 0index.js
	addIndex(dir: string, input: string): void { // dir maybe ""
		input = input.trim();

		const index = JSON.parse(input);

		for (let i = 0; i < index.length; i += 1) {
			index[i].dir = dir;
			this.model.setExample(index[i]);
		}
	}

	// Also called from example files xxxxx.js
	addItem(key: string, input: string): string { // key maybe ""
		if (!key) { // maybe ""
			key = (document.currentScript && document.currentScript.getAttribute("data-key")) || this.model.getProperty<string>("example");
			// on IE we can just get the current example
		}
		input = input.replace(/^\n/, "").replace(/\n$/, ""); // remove preceding and trailing newlines
		// beware of data files ending with newlines! (do not use trimEnd)

		const example = this.model.getExample(key);

		example.key = key; // maybe changed
		example.script = input;
		example.loaded = true;
		Utils.console.log("addItem:", key);
		return key;
	}

	private setDatabaseSelectOptions() {
		const select = "databaseSelect",
			items: SelectOptionElement[] = [],
			databases = this.model.getAllDatabases(),
			database = this.model.getProperty<string>("database");

		for (const value in databases) {
			if (databases.hasOwnProperty(value)) {
				const db = databases[value],
					item: SelectOptionElement = {
						value: value,
						text: db.text,
						title: db.title,
						selected: value === database
					};

				items.push(item);
			}
		}
		this.view.setSelectOptions(select, items);
	}

	setExampleSelectOptions(): void {
		const maxTitleLength = 160,
			maxTextLength = 60, // (32 visible?)
			select = "exampleSelect",
			items: SelectOptionElement[] = [],
			example = this.model.getProperty<string>("example"),
			allExamples = this.model.getAllExamples();

		let exampleSelected = false;

		for (const key in allExamples) {
			if (allExamples.hasOwnProperty(key)) {
				const exampleEntry = allExamples[key];

				if (exampleEntry.meta !== "D") { // skip data files
					const title = (exampleEntry.key + ": " + exampleEntry.title).substr(0, maxTitleLength),
						item: SelectOptionElement = {
							value: exampleEntry.key,
							title: title,
							text: title.substr(0, maxTextLength),
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
	}

	private setVarSelectOptions(select: string, variables: Variables) {
		const maxVarLength = 35,
			varNames = variables.getAllVariableNames(),
			items: SelectOptionElement[] = [],

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

		for (let i = 0; i < varNames.length; i += 1) {
			const key = varNames[i],
				value = variables.getVariable(key),
				title = key + "=" + value;

			let strippedTitle = title.substr(0, maxVarLength); // limit length

			if (title !== strippedTitle) {
				strippedTitle += " ...";
			}

			const item: SelectOptionElement = {
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
	}

	private updateStorageDatabase(action: string, key: string) {
		const database = this.model.getProperty<string>("database"),
			storage = Utils.localStorage;

		if (database !== "storage") {
			this.model.setProperty<string>("database", "storage"); // switch to storage database
		}

		let	dir: string[];

		if (!key) { // no key => get all
			dir = Controller.fnGetStorageDirectoryEntries();
		} else {
			dir = [key];
		}

		for (let i = 0; i < dir.length; i += 1) {
			key = dir[i];
			if (action === "remove") {
				this.model.removeExample(key);
			} else if (action === "set") {
				let example = this.model.getExample(key);

				if (!example) {
					const dataString = storage.getItem(key) || "",
						data = Controller.splitMeta(dataString);

					example = {
						key: key,
						title: "", // or set key?
						meta: data.meta.typeString // currently we take only the type
					};
					this.model.setExample(example);
				}
			} else {
				Utils.console.error("updateStorageDatabase: unknown action", action);
			}
		}

		if (database === "storage") {
			this.setExampleSelectOptions();
		} else {
			this.model.setProperty<string>("database", database); // restore database
		}
	}

	setInputText(input: string, keepStack?: boolean): void {
		this.view.setAreaValue("inputText", input);
		if (!keepStack) {
			this.fnInitUndoRedoButtons();
		} else {
			this.fnUpdateUndoRedoButtons();
		}
	}

	invalidateScript(): void {
		this.fnScript = undefined;
	}

	private fnWaitForContinue() {
		const stream = 0,
			key = this.keyboard.getKeyFromBuffer();

		if (key !== "") {
			this.vm.cursor(stream, 0);
			this.keyboard.setKeyDownHandler(undefined);
			this.startContinue();
		}
	}

	private fnOnEscape() {
		const stop = this.vm.vmGetStopObject(),
			stream = 0;

		if (this.vm.vmOnBreakContSet()) {
			// ignore break
		} else if (stop.reason === "direct" || this.vm.vmOnBreakHandlerActive()) {
			(stop.paras as VmInputParas).input = "";
			const msg = "*Break*\r\n";

			this.vm.print(stream, msg);
		} else if (stop.reason !== "escape") { // first escape?
			this.vm.cursor(stream, 1);
			this.keyboard.clearInput();
			this.keyboard.setKeyDownHandler(this.fnWaitForContinue.bind(this));
			this.setStopObject(stop);
			this.vm.vmStop("escape", 85, false, {
				command: "escape",
				stream: stream,
				first: 0, // unused
				last: 0, // unused
				line: this.vm.line
			});
		} else { // second escape
			this.keyboard.setKeyDownHandler(undefined);
			this.vm.cursor(stream, 0);

			const savedStop = this.getStopObject();

			if (savedStop.reason === "waitInput") { // sepcial handling: set line to repeat input
				this.vm.vmGotoLine((savedStop.paras as VmInputParas).line);
			}

			if (!this.vm.vmEscape()) {
				this.vm.vmStop("", 0, true); // continue program, in break handler?
				this.setStopObject(this.noStop);
			} else {
				this.vm.vmStop("stop", 0, true); // stop
				const msg = "Break in " + this.vm.line + "\r\n";

				this.vm.print(stream, msg);
			}
		}

		this.startMainLoop();
	}

	private fnWaitSound() { // rather fnEvent
		const stop = this.vm.vmGetStopObject();

		this.vm.vmLoopCondition(); // update nextFrameTime, timers, inks; schedule sound: free queue
		if (this.sound.isActivatedByUser()) { // only if activated
			const soundDataList = this.vm.vmGetSoundData();

			while (soundDataList.length && this.sound.testCanQueue(soundDataList[0].state)) {
				const soundData = soundDataList.shift() as SoundData;

				this.sound.sound(soundData);
			}
			if (!soundDataList.length) {
				if (stop.reason === "waitSound") { // only for this reason
					this.vm.vmStop("", 0, true); // no more wait
				}
			}
		}
		this.nextLoopTimeOut = this.vm.vmGetTimeUntilFrame(); // wait until next frame
	}

	private fnWaitKey() {
		const key = this.keyboard.getKeyFromBuffer();

		if (key !== "") { // do we have a key from the buffer already?
			Utils.console.log("Wait for key:", key);
			this.vm.vmStop("", 0, true);
			this.keyboard.setKeyDownHandler(undefined);
		} else {
			this.fnWaitSound(); // sound and blinking events
			this.keyboard.setKeyDownHandler(this.fnWaitKeyHandler); // wait until keypress handler (for call &bb18)
		}
		return key;
	}

	private fnWaitInput() { // eslint-disable-line complexity
		const stop = this.vm.vmGetStopObject(),
			inputParas = stop.paras as VmInputParas,
			stream = inputParas.stream;
		let input = inputParas.input,
			key: string;

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
			case "\r": // cr (\x0c)
				break;
			case "\x10": // DLE (clear character under cursor)
				key = "\x07"; // currently ignore (BEL)
				break;
			case "\x7f": // del
				if (input.length) {
					input = input.slice(0, -1);
					key = "\x08\x10"; // use BS and DLE
				} else {
					key = "\x07"; // ignore BS, use BEL
				}
				break;
			case "\xe0": // copy
				key = this.vm.copychr$(stream);
				if (key.length) {
					input += key;
					key = "\x09"; // TAB
				} else {
					key = "\x07"; // ignore (BEL)
				}
				break;
			case "\xf0": // cursor up
				if (!input.length) {
					key = "\x0b"; // VT
				} else {
					key = "\x07"; // ignore (BEL)
				}
				break;
			case "\xf1": // cursor down
				if (!input.length) {
					key = "\x0a"; // LF
				} else {
					key = "\x07"; // ignore (BEL)
				}
				break;
			case "\xf2": // cursor left
				if (!input.length) {
					key = "\x08"; // BS
				} else {
					key = "\x07"; // ignore (BEL) TODO
				}
				break;
			case "\xf3": // cursor right
				if (!input.length) {
					key = "\x09"; // TAB
				} else {
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
		let inputOk = false;

		if (key === "\r") {
			Utils.console.log("fnWaitInput:", input, "reason", stop.reason);
			if (!inputParas.noCRLF) {
				this.vm.print(stream, "\r\n");
			}
			if (inputParas.fnInputCallback) {
				inputOk = inputParas.fnInputCallback();
			} else {
				inputOk = true;
			}
			if (inputOk) {
				this.keyboard.setKeyDownHandler(undefined);
				if (stop.reason === "waitInput") { // only for this reason
					this.vm.vmStop("", 0, true); // no more wait
				} else {
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
	}

	//TODO
	private parseLineNumber(line: string) { // eslint-disable-line class-methods-use-this
		const lineNumber = parseInt(line, 10);

		if (lineNumber < 0 || lineNumber > 65535) {
			/*
			throw this.composeError(Error(), "Line number overflow", line, -1);
			this.outputError(this.vm.vmComposeError(Error(), 6, String(line)), true);
			line = -1; //TTT
			const error = this.vm.vmComposeError(Error(), 6, String(line));

			this.vm.vmStop("", 0, true); // clear error, onError
			this.outputError(error, true);
			*/
		}
		return lineNumber;
	}

	// merge two scripts with sorted line numbers, lines from script2 overwrite lines from script1
	private mergeScripts(script1: string, script2: string) {
		const lines1 = Utils.stringTrimEnd(script1).split("\n"),
			lines2 = Utils.stringTrimEnd(script2).split("\n");
		let result = [],
			lineNumber1: number | undefined,
			lineNumber2: number | undefined;

		while (lines1.length && lines2.length) {
			lineNumber1 = lineNumber1 || this.parseLineNumber(lines1[0]);
			lineNumber2 = lineNumber2 || this.parseLineNumber(lines2[0]);

			if (lineNumber1 < lineNumber2) { // use line from script1
				result.push(lines1.shift());
				lineNumber1 = 0;
			} else { // use line from script2
				const line2 = lines2.shift();

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

		const resultString = result.join("\n");

		return resultString;
	}

	// get line range from a script with sorted line numbers
	private static fnGetLinesInRange(script: string, firstLine: number, lastLine: number) {
		const lines = script ? script.split("\n") : [];

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
	}

	private static fnPrepareMaskRegExp(mask: string) {
		mask = mask.replace(/([.+^$[\]\\(){}|-])/g, "\\$1");
		mask = mask.replace(/\?/g, ".");
		mask = mask.replace(/\*/g, ".*");

		const regExp = new RegExp("^" + mask + "$");

		return regExp;
	}

	private fnGetExampleDirectoryEntries(mask?: string) { // optional mask
		const dir: string[] = [],
			allExamples = this.model.getAllExamples();
		let regExp: RegExp | undefined;

		if (mask) {
			regExp = Controller.fnPrepareMaskRegExp(mask);
		}

		for (const key in allExamples) {
			if (allExamples.hasOwnProperty(key)) {
				const example = allExamples[key],
					key2 = example.key,
					matchKey2 = key2 + ((key2.indexOf(".") < 0) ? "." : "");

				if (!regExp || regExp.test(matchKey2)) {
					dir.push(key2);
				}
			}
		}
		return dir;
	}

	private static fnGetStorageDirectoryEntries(mask?: string) {
		const storage = Utils.localStorage,
			dir: string[] = [];
		let	regExp: RegExp | undefined;

		if (mask) {
			regExp = Controller.fnPrepareMaskRegExp(mask);
		}

		for (let i = 0; i < storage.length; i += 1) {
			const key = storage.key(i);

			if (key !== null && storage[key].startsWith(this.metaIdent)) { // take only cpcBasic files
				if (!regExp || regExp.test(key)) {
					dir.push(key);
				}
			}
		}
		return dir;
	}

	private fnPrintDirectoryEntries(stream: number, dir: string[], sort: boolean) {
		// first, format names
		for (let i = 0; i < dir.length; i += 1) {
			const key = dir[i],
				parts = key.split(".");

			if (parts.length === 2) {
				dir[i] = parts[0].padEnd(8, " ") + "." + parts[1].padEnd(3, " ");
			}
		}

		if (sort) {
			dir.sort();
		}

		this.vm.print(stream, "\r\n");
		for (let i = 0; i < dir.length; i += 1) {
			const key = dir[i] + "  ";

			this.vm.print(stream, key);
		}
		this.vm.print(stream, "\r\n");
	}

	private fnFileCat(paras: VmFileParas): void {
		const stream = paras.stream,
			dir = Controller.fnGetStorageDirectoryEntries();

		this.fnPrintDirectoryEntries(stream, dir, true);

		// currently only from localstorage

		this.vm.vmStop("", 0, true);
	}

	private fnFileDir(paras: VmFileParas): void {
		const stream = paras.stream,
			example = this.model.getProperty<string>("example"), // if we have a fileMask, include also example names from same directory
			lastSlash = example.lastIndexOf("/");

		let fileMask = paras.fileMask ? Controller.fnLocalStorageName(paras.fileMask) : "",
			dir = Controller.fnGetStorageDirectoryEntries(fileMask),
			path = "";

		if (lastSlash >= 0) {
			path = example.substr(0, lastSlash) + "/";
			fileMask = path + (fileMask ? fileMask : "*.*"); // only in same directory
		}

		const dir2 = this.fnGetExampleDirectoryEntries(fileMask); // also from examples

		for (let i = 0; i < dir2.length; i += 1) {
			dir2[i] = dir2[i].substr(path.length); // remove preceding path including "/"
		}
		dir = dir2.concat(dir); // combine

		this.fnPrintDirectoryEntries(stream, dir, false);
		this.vm.vmStop("", 0, true);
	}

	private fnFileEra(paras: VmFileParas): void {
		const stream = paras.stream,
			storage = Utils.localStorage,
			fileMask = Controller.fnLocalStorageName(paras.fileMask),
			dir = Controller.fnGetStorageDirectoryEntries(fileMask);

		if (!dir.length) {
			this.vm.print(stream, fileMask + " not found\r\n");
		}

		for (let i = 0; i < dir.length; i += 1) {
			const name = dir[i];

			if (storage.getItem(name) !== null) {
				storage.removeItem(name);
				this.updateStorageDatabase("remove", name);
				if (Utils.debug > 0) {
					Utils.console.debug("fnEraseFile: name=" + name + ": removed from localStorage");
				}
			} else {
				this.vm.print(stream, name + " not found\r\n");
				Utils.console.warn("fnEraseFile: file not found in localStorage:", name);
			}
		}
		this.vm.vmStop("", 0, true);
	}

	private fnFileRen(paras: VmFileParas): void {
		const stream = paras.stream,
			storage = Utils.localStorage,
			newName = Controller.fnLocalStorageName(paras.newName as string),
			oldName = Controller.fnLocalStorageName(paras.oldName as string),
			item = storage.getItem(oldName);

		if (item !== null) {
			if (!storage.getItem(newName)) {
				storage.setItem(newName, item);
				this.updateStorageDatabase("set", newName);
				storage.removeItem(oldName);
				this.updateStorageDatabase("remove", oldName);
			} else {
				this.vm.print(stream, oldName + " already exists\r\n");
			}
		} else {
			this.vm.print(stream, oldName + " not found\r\n");
		}
		this.vm.vmStop("", 0, true);
	}

	// Hisoft Devpac GENA3 Z80 Assember (http://www.cpcwiki.eu/index.php/Hisoft_Devpac)
	private static asmGena3Convert(data: string) {
		const fnUInt16 = function (pos2: number) {
				return data.charCodeAt(pos2) + data.charCodeAt(pos2 + 1) * 256;
			},
			length = data.length;
		let pos = 0,
			out = "";

		pos += 4; // what is the meaning of these bytes?

		while (pos < length) {
			const lineNum = fnUInt16(pos);

			pos += 2;
			let index1 = data.indexOf("\r", pos); // EOL marker 0x0d

			if (index1 < 0) {
				index1 = length;
			}
			let index2 = data.indexOf("\x1c", pos); // EOL marker 0x1c

			if (index2 < 0) {
				index2 = length;
			}
			index1 = Math.min(index1, index2);
			out += lineNum + " " + data.substring(pos, index1) + "\n";
			pos = index1 + 1;
		}

		return out;
	}

	private decodeTokenizedBasic(input: string) {
		if (!this.basicTokenizer) {
			this.basicTokenizer = new BasicTokenizer();
		}
		return this.basicTokenizer.decode(input);
	}

	private encodeTokenizedBasic(input: string, name = "test") {
		if (!this.codeGeneratorToken) {
			this.codeGeneratorToken = new CodeGeneratorToken({
				lexer: new BasicLexer({
					keepWhiteSpace: true
				}),
				parser: new BasicParser({
					keepTokens: true,
					keepBrackets: true,
					keepColons: true,
					keepDataComma: true
				})
			});
		}
		const output = this.codeGeneratorToken.generate(input);

		if (output.error) {
			this.outputError(output.error);
		} else if (Utils.debug > 1) {
			const outputText = output.text,
				hex = outputText.split("").map(function (s) { return s.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0"); }).join(","),
				decoded = this.decodeTokenizedBasic(outputText),
				diff = Diff.testDiff(input.toUpperCase(), decoded.toUpperCase()); // for testing

			Utils.console.debug("TokenizerInput (" + name + "):\n", input);
			Utils.console.debug("TokenizerHex (" + name + "):\n", hex);
			Utils.console.debug("TokenizerDecoded (" + name + "):\n", decoded);
			Utils.console.debug("TokenizerDiff (" + name + "):\n", diff);
		}

		return output.text;
	}

	private prettyPrintBasic(input: string, keepWhiteSpace: boolean, keepBrackets: boolean) {
		if (!this.codeGeneratorBasic) {
			this.codeGeneratorBasic = new CodeGeneratorBasic({
				lexer: new BasicLexer(),
				parser: new BasicParser()
			});
		}

		const keepColons = keepBrackets, // we switch all with one setting
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

		const output = this.codeGeneratorBasic.generate(input);

		if (output.error) {
			this.outputError(output.error);
		}
		return output.text;
	}

	private loadFileContinue(input: string | null | undefined) { // eslint-disable-line complexity
		const inFile = this.vm.vmGetInFileObject(),
			command = inFile.command;
		let	startLine = 0,
			putInMemory = false,
			data: FileMetaAndData | undefined;

		if (input !== null && input !== undefined) {
			data = Controller.splitMeta(input);

			input = data.data; // maybe changed

			if (data.meta.encoding === "base64") {
				input = Utils.atob(input); // decode base64
			}

			const type = data.meta.typeString;

			if (type === "T") { // tokenized basic?
				input = this.decodeTokenizedBasic(input);
			} else if (type === "P") { // BASIC?
				input = DiskImage.unOrProtectData(input);
				input = this.decodeTokenizedBasic(input);
			} else if (type === "B") { // binary?
			} else if (type === "A") { // ASCII?
				// remove EOF character(s) (0x1a) from the end of file
				input = input.replace(/\x1a+$/, ""); // eslint-disable-line no-control-regex
			} else if (type === "G") { // Hisoft Devpac GENA3 Z80 Assember
				input = Controller.asmGena3Convert(input);
			}
		}

		if (inFile.fnFileCallback) {
			try {
				putInMemory = inFile.fnFileCallback(input, data && data.meta) as boolean;
			} catch (e) {
				Utils.console.warn(e);
			}
		}

		if (input === undefined) {
			Utils.console.error("loadFileContinue: File " + inFile.name + ": input undefined!");
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
			} else {
				this.fnReset();
			}
			break;
		default:
			Utils.console.error("loadExample: Unknown command:", command);
			break;
		}
		this.vm.vmSetStartLine(startLine);
		this.startMainLoop();
	}

	private loadExample() {
		const that = this,
			inFile = this.vm.vmGetInFileObject();
		var	example: string, url: string,

			fnExampleLoaded = function (_sFullUrl: string, key: string, suppressLog?: boolean) {
				if (key !== example) {
					Utils.console.warn("fnExampleLoaded: Unexpected", key, "<>", example);
				}
				const exampleEntry = that.model.getExample(example);

				if (!suppressLog) {
					Utils.console.log("Example", url, exampleEntry.meta || "", "loaded");
				}
				const input = exampleEntry.script;

				that.model.setProperty("example", inFile.memorizedExample);
				that.vm.vmStop("", 0, true);
				that.loadFileContinue(input);
			},
			fnExampleError = function () {
				Utils.console.log("Example", url, "error");
				that.model.setProperty("example", inFile.memorizedExample);

				that.vm.vmStop("", 0, true);

				const error = that.vm.vmComposeError(Error(), 32, example + " not found"); // TODO: set also derr=146 (xx not found)

				// error or onError set
				if (error.hidden) {
					that.vm.vmStop("", 0, true); // clear onError
				}
				that.outputError(error, true);
				that.loadFileContinue(null);
			};

		let name = inFile.name;
		const key = this.model.getProperty<string>("example");

		if (name.charAt(0) === "/") { // absolute path?
			name = name.substr(1); // remove "/"
			inFile.memorizedExample = name; // change!
		} else {
			inFile.memorizedExample = key;
			const lastSlash = key.lastIndexOf("/");

			if (lastSlash >= 0) {
				const path = key.substr(0, lastSlash); // take path from selected example

				name = path + "/" + name;
				name = name.replace(/\w+\/\.\.\//, ""); // simplify 2 dots (go back) in path: "dir/.."" => ""
			}
		}
		example = name;

		if (Utils.debug > 0) {
			Utils.console.debug("loadExample: name=" + name + " (current=" + key + ")");
		}

		const exampleEntry = this.model.getExample(example); // already loaded

		if (exampleEntry && exampleEntry.loaded) {
			this.model.setProperty("example", example);
			fnExampleLoaded("", example, true);
		} else if (example && exampleEntry) { // need to load
			this.model.setProperty("example", example);
			const databaseDir = this.model.getDatabase().src;

			url = databaseDir + "/" + example + ".js";
			Utils.loadScript(url, fnExampleLoaded, fnExampleError, example);
		} else { // keep original example in this error case
			url = example;
			if (example !== "") { // only if not empty
				Utils.console.warn("loadExample: Unknown file:", example);
				fnExampleError();
			} else {
				this.model.setProperty("example", example);
				this.vm.vmStop("", 0, true);
				this.loadFileContinue(""); // empty input?
			}
		}
	}

	private static fnLocalStorageName(name: string, defaultExtension?: string) {
		// modify name so we do not clash with localstorage methods/properites
		if (name.indexOf(".") < 0) { // no dot inside name?
			name += "." + (defaultExtension || ""); // append dot or default extension
		}
		return name;
	}

	private static defaultExtensions = [
		"",
		"bas",
		"bin"
	];

	private static tryLoadingFromLocalStorage(name: string) {
		const storage = Utils.localStorage;

		let input: string | null = null;

		if (name.indexOf(".") >= 0) { // extension specified?
			input = storage.getItem(name);
		} else {
			for (let i = 0; i < Controller.defaultExtensions.length; i += 1)	{
				const storageName = Controller.fnLocalStorageName(name, Controller.defaultExtensions[i]);

				input = storage.getItem(storageName);
				if (input !== null) {
					break; // found
				}
			}
		}
		return input; // null=not found
	}

	private fnFileLoad() {
		const inFile = this.vm.vmGetInFileObject();

		if (inFile.open) {
			if (inFile.command === "chainMerge" && inFile.first && inFile.last) { // special handling to delete line numbers first
				this.fnDeleteLines({
					first: inFile.first,
					last: inFile.last,
					command: "CHAIN MERGE",
					stream: 0, // unused
					line: this.vm.line
				});
				this.vm.vmStop("fileLoad", 90); // restore
			}

			const name = inFile.name;

			if (Utils.debug > 1) {
				Utils.console.debug("fnFileLoad:", inFile.command, name, "details:", inFile);
			}

			const input = Controller.tryLoadingFromLocalStorage(name);

			if (input !== null) {
				if (Utils.debug > 0) {
					Utils.console.debug("fnFileLoad:", inFile.command, name, "from localStorage");
				}
				this.vm.vmStop("", 0, true);
				this.loadFileContinue(input);
			} else { // load from example
				this.loadExample(/* name */); //TTT
			}
		} else {
			Utils.console.error("fnFileLoad:", inFile.name, "File not open!"); // hopefully isName is defined
		}
		this.nextLoopTimeOut = this.vm.vmGetTimeUntilFrame(); // wait until next frame
	}

	private static joinMeta(meta: FileMeta) {
		const metaString = [
			Controller.metaIdent,
			meta.typeString,
			meta.start,
			meta.length,
			meta.entry
		].join(";");

		return metaString;
	}

	private static splitMeta(input: string) {
		let fileMeta: FileMeta | undefined;

		if (input.indexOf(Controller.metaIdent) === 0) { // starts with metaIdent?
			const index = input.indexOf(","); // metadata separator

			if (index >= 0) {
				const metaString = input.substr(0, index);

				input = input.substr(index + 1);

				const meta = metaString.split(";");

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

		const metaAndData: FileMetaAndData = {
			meta: fileMeta,
			data: input
		};

		return metaAndData;
	}

	private fnFileSave() {
		const outFile = this.vm.vmGetOutFileObject(),
			storage = Utils.localStorage;
		let	defaultExtension = "";

		if (outFile.open) {
			const type = outFile.typeString,
				name = outFile.name;

			if (type === "P" || type === "T") {
				defaultExtension = "bas";
			} else if (type === "B") {
				defaultExtension = "bin";
			}
			const storageName = Controller.fnLocalStorageName(name, defaultExtension);
			let fileData: string;

			if (outFile.fileData.length || (type === "B") || (outFile.command === "openout")) { // type A(for openout) or B
				fileData = outFile.fileData.join("");
			} else { // no file data (assuming type A, P or T) => get text
				fileData = this.view.getAreaValue("inputText");

				if (type === "T" || type === "P") {
					fileData = this.encodeTokenizedBasic(fileData, storageName);
					if (fileData === "") {
						outFile.typeString = "A"; // override type
					} else if (type === "P") {
						fileData = DiskImage.unOrProtectData(fileData);
					}
				}
				outFile.length = fileData.length; // set length
			}

			if (Utils.debug > 0) {
				Utils.console.debug("fnFileSave: name=" + name + ": put into localStorage");
			}

			if (outFile.fnFileCallback) {
				try {
					outFile.fnFileCallback(fileData); // close file
				} catch (e) {
					Utils.console.warn(e);
				}
			}

			const meta = Controller.joinMeta(outFile);

			storage.setItem(storageName, meta + "," + fileData);
			this.updateStorageDatabase("set", storageName);
			CpcVm.vmResetFileHandling(outFile); // make sure it is closed
		} else {
			Utils.console.error("fnFileSave: file not open!");
		}
		this.vm.vmStop("", 0, true); // continue
	}

	private fnDeleteLines(paras: VmLineParas) {
		const inputText = this.view.getAreaValue("inputText"),
			lines = Controller.fnGetLinesInRange(inputText, paras.first, paras.last);
		let	error: CustomError | undefined;

		if (lines.length) {
			for (let i = 0; i < lines.length; i += 1) {
				const line = parseInt(lines[i], 10);

				if (isNaN(line)) {
					error = this.vm.vmComposeError(Error(), 21, paras.command); // "Direct command found"
					this.outputError(error, true);
					break;
				}
				lines[i] = String(line); // keep just the line numbers
			}

			if (!error) {
				let input = lines.join("\n");

				input = this.mergeScripts(inputText, input); // delete input lines
				this.setInputText(input);
			}
		}

		this.vm.vmGotoLine(0); // reset current line
		this.vm.vmStop("end", 0, true);
	}

	private fnNew() {
		const input = "";

		this.setInputText(input);
		this.variables.removeAllVariables();

		this.vm.vmGotoLine(0); // reset current line
		this.vm.vmStop("end", 0, true);
		this.invalidateScript();
	}

	private fnList(paras: VmLineParas) {
		const input = this.view.getAreaValue("inputText"),
			stream = paras.stream,
			lines = Controller.fnGetLinesInRange(input, paras.first, paras.last),
			regExp = new RegExp(/([\x00-\x1f])/g); // eslint-disable-line no-control-regex

		for (let i = 0; i < lines.length; i += 1) {
			let line = lines[i];

			if (stream !== 9) {
				line = line.replace(regExp, "\x01$1"); // escape control characters to print them directly
			}
			this.vm.print(stream, line, "\r\n");
		}

		this.vm.vmGotoLine(0); // reset current line
		this.vm.vmStop("end", 0, true);
	}

	private fnReset() {
		const vm = this.vm;

		this.variables.removeAllVariables();

		vm.vmReset();
		if (this.virtualKeyboard) {
			this.virtualKeyboard.reset();
		}

		vm.vmStop("end", 0, true); // set "end" with priority 0, so that "compile only" still works
		vm.outBuffer = "";
		this.view.setAreaValue("outputText", "");
		this.invalidateScript();
	}

	private outputError(error: Error, noSelection?: boolean) {
		const stream = 0;
		let shortError: string;

		if (Utils.isCustomError(error)) {
			shortError = error.shortMessage || error.message;
			if (!noSelection) {
				const endPos = (error.pos || 0) + ((error.value !== undefined) ? String(error.value).length : 0);

				this.view.setAreaSelection("inputText", error.pos || 0, endPos);
			}
		} else {
			shortError = error.message;
		}

		const escapedShortError = shortError.replace(/([\x00-\x1f])/g, "\x01$1"); // eslint-disable-line no-control-regex

		this.vm.print(stream, escapedShortError + "\r\n");
		return shortError;
	}

	private fnRenumLines(paras: VmLineRenumParas) {
		const vm = this.vm,
			input = this.view.getAreaValue("inputText");

		if (!this.basicFormatter) {
			this.basicFormatter = new BasicFormatter({
				lexer: new BasicLexer(),
				parser: new BasicParser()
			});
		}

		const output = this.basicFormatter.renumber(input, paras.newLine, paras.oldLine, paras.step, paras.keep);

		if (output.error) {
			Utils.console.warn(output.error);
			this.outputError(output.error);
		} else {
			this.fnPutChangedInputOnStack();
			this.setInputText(output.text, true);
			this.fnPutChangedInputOnStack();
		}
		this.vm.vmGotoLine(0); // reset current line
		vm.vmStop("end", 0, true);
	}

	private fnEditLineCallback() {
		const inputParas = this.vm.vmGetStopObject().paras as VmInputParas,
			inputText = this.view.getAreaValue("inputText");
		let input = inputParas.input;

		input = this.mergeScripts(inputText, input);
		this.setInputText(input);
		this.vm.vmSetStartLine(0);
		this.vm.vmGotoLine(0); // to be sure
		this.view.setDisabled("continueButton", true);
		this.vm.cursor(inputParas.stream, 0);
		this.vm.vmStop("end", 90);
		return true;
	}

	private fnEditLine(paras: VmLineParas) {
		const input = this.view.getAreaValue("inputText"),
			stream = paras.stream,
			lineNumber = paras.first,
			lines = Controller.fnGetLinesInRange(input, lineNumber, lineNumber);

		if (lines.length) {
			const lineString = lines[0];

			this.vm.print(stream, lineString);
			this.vm.cursor(stream, 1);
			const inputParas: VmInputParas = {
				command: paras.command,
				line: paras.line,
				stream: stream,
				message: "",
				fnInputCallback: this.fnEditLineCallback.bind(this),
				input: lineString
			};

			this.vm.vmStop("waitInput", 45, true, inputParas);
			this.fnWaitInput();
		} else {
			const error = this.vm.vmComposeError(Error(), 8, String(lineNumber)); // "Line does not exist"

			this.vm.print(stream, String(error) + "\r\n");
			this.vm.vmStop("stop", 60, true);
		}
	}

	private fnParseBench(input: string, bench: number) {
		let output: IOutput | undefined;

		for (let i = 0; i < bench; i += 1) {
			let time = Date.now();

			output = this.codeGeneratorJs.generate(input, this.variables);
			time = Date.now() - time;
			Utils.console.debug("bench size", input.length, "labels", this.codeGeneratorJs.debugGetLabelsCount(), "loop", i, ":", time, "ms");
			if (output.error) {
				break;
			}
		}

		return output;
	}

	private fnParse(): IOutput {
		const input = this.view.getAreaValue("inputText"),
			bench = this.model.getProperty<number>("bench");

		this.variables.removeAllVariables();
		let	output: IOutput;

		if (!bench) {
			output = this.codeGeneratorJs.generate(input, this.variables);
		} else {
			output = this.fnParseBench(input, bench) as IOutput;
		}

		let outputString: string;

		if (output.error) {
			outputString = this.outputError(output.error);
		} else {
			outputString = output.text;
		}

		if (outputString && outputString.length > 0) {
			outputString += "\n";
		}
		this.view.setAreaValue("outputText", outputString);

		this.invalidateScript();
		this.setVarSelectOptions("varSelect", this.variables);
		this.commonEventHandler.onVarSelectChange();
		return output;
	}

	fnPretty(): void {
		const input = this.view.getAreaValue("inputText"),
			keepWhiteSpace = this.view.getInputChecked("prettySpaceInput"),
			keepBrackets = this.view.getInputChecked("prettyBracketsInput"),
			output = this.prettyPrintBasic(input, keepWhiteSpace, keepBrackets);

		if (output) {
			this.fnPutChangedInputOnStack();
			this.setInputText(output, true);
			this.fnPutChangedInputOnStack();

			// for testing:
			const diff = Diff.testDiff(input.toUpperCase(), output.toUpperCase());

			this.view.setAreaValue("outputText", diff);
		}
	}


	// https://blog.logrocket.com/programmatic-file-downloads-in-the-browser-9a5186298d5c/
	private static fnDownloadBlob(blob: Blob, filename: string) {
		const url = URL.createObjectURL(blob),
			a = document.createElement("a"),
			clickHandler = function () {
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
	}

	private fnDownloadNewFile(data: string, fileName: string) { // eslint-disable-line class-methods-use-this
		const type = "octet/stream",
			buffer = new ArrayBuffer(data.length),
			data8 = new Uint8Array(buffer);

		for (let i = 0; i < data.length; i += 1) {
			data8[i] = data.charCodeAt(i);
		}

		const blob = new Blob([data8.buffer], {
			type: type
		});

		if (window.navigator && (window.navigator as any).msSaveOrOpenBlob) { // IE11 support
			(window.navigator as any).msSaveOrOpenBlob(blob, fileName);
		} else {
			Controller.fnDownloadBlob(blob, fileName);
		}
	}


	fnDownload(): void {
		const input = this.view.getAreaValue("inputText"),
			tokens = this.encodeTokenizedBasic(input);

		if (tokens !== "") {
			const header = Controller.createMinimalAmsdosHeader("T", 0x170, tokens.length),
				headerString = DiskImage.combineAmsdosHeader(header),
				data = headerString + tokens;

			this.fnDownloadNewFile(data, "file.bas");
		}
	}

	private selectJsError(script: string, e: Error) {
		const lineNumber = (e as any).lineNumber, // only on FireFox
			columnNumber = (e as any).columnNumber;

		if (lineNumber || columnNumber) { // only available on Firefox
			const errLine = lineNumber - 3; // for some reason line 0 is 3
			let pos = 0,
				line = 0;

			while (pos < script.length && line < errLine) {
				pos = script.indexOf("\n", pos) + 1;
				line += 1;
			}
			pos += columnNumber;

			Utils.console.warn("Info: JS Error occurred at line", lineNumber, "column", columnNumber, "pos", pos);

			this.view.setAreaSelection("outputText", pos, pos + 1);
		}
	}

	private fnRun(paras?: VmStopParas) {
		const script = this.view.getAreaValue("outputText"),
			vm = this.vm;
		let line = paras && (paras as VmLineParas).first || 0;

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
			} catch (e) {
				Utils.console.error(e);
				if (e instanceof Error) {
					this.selectJsError(script, e);
					(e as CustomError).shortMessage = "JS " + String(e);
					this.outputError(e, true);
				}
				this.fnScript = undefined;
			}
		} else {
			vm.clear(); // we do a clear as well here
		}
		vm.vmReset4Run();
		if (!this.inputSet) {
			this.inputSet = true;
			this.keyboard.putKeysInBuffer(this.model.getProperty<string>("input"));
		}

		if (this.fnScript) {
			vm.outBuffer = this.view.getAreaValue("resultText");
			vm.vmStop("", 0, true);
			vm.vmGotoLine(0); // to load DATA lines
			this.vm.vmSetStartLine(line as number); // clear resets also startline

			this.view.setDisabled("runButton", true);
			this.view.setDisabled("stopButton", false);
			this.view.setDisabled("continueButton", true);
		}
		if (Utils.debug > 1) {
			Utils.console.debug("End of fnRun");
		}
	}

	private fnParseRun() {
		const output = this.fnParse();

		if (!output.error) {
			this.fnRun();
		}
	}

	private fnRunPart1(fnScript: Function) { // eslint-disable-line @typescript-eslint/ban-types
		try {
			fnScript(this.vm);
		} catch (e) {
			if (e instanceof Error) {
				if (e.name === "CpcVm") {
					if (!(e as CustomError).hidden) {
						Utils.console.warn(e);
						this.outputError(e, true);
					} else {
						Utils.console.log(e.message);
					}
				} else {
					Utils.console.error(e);
					this.selectJsError(this.view.getAreaValue("outputText"), e as Error);
					this.vm.vmComposeError(e, 2, "JS " + String(e)); // generate Syntax Error, set also err and erl and set stop
					this.outputError(e, true);
				}
			} else {
				Utils.console.error(e);
			}
		}
	}

	private fnDirectInput() {
		const inputParas = this.vm.vmGetStopObject().paras as VmInputParas,
			stream = inputParas.stream;
		let input = inputParas.input;

		input = input.trim();
		inputParas.input = "";
		if (input !== "") { // direct input
			this.vm.cursor(stream, 0);
			const inputText = this.view.getAreaValue("inputText");

			if ((/^\d+($| )/).test(input)) { // start with number?
				if (Utils.debug > 0) {
					Utils.console.debug("fnDirectInput: insert line=" + input);
				}
				input = this.mergeScripts(inputText, input);
				this.setInputText(input, true);

				this.vm.vmSetStartLine(0);
				this.vm.vmGotoLine(0); // to be sure
				this.view.setDisabled("continueButton", true);

				this.vm.cursor(stream, 1);
				this.updateResultText();
				return false; // continue direct input
			}

			Utils.console.log("fnDirectInput: execute:", input);

			const codeGeneratorJs = this.codeGeneratorJs;
			let	output: IOutput | undefined,
				outputString: string;

			if (inputText && (/^\d+($| )/).test(inputText)) { // do we have a program starting with a line number?
				output = codeGeneratorJs.generate(input + "\n" + inputText, this.variables, true); // compile both; allow direct command
				if (output.error) {
					const error = output.error;

					if (error.pos >= input.length + 1) { // error not in direct?
						error.pos -= (input.length + 1);
						error.message = "[prg] " + error.message;
						if (error.shortMessage) { // eslint-disable-line max-depth
							error.shortMessage = "[prg] " + error.shortMessage;
						}
						outputString = this.outputError(error, true);
						output = undefined;
					}
				}
			}

			if (!output) {
				output = codeGeneratorJs.generate(input, this.variables, true); // compile direct input only
			}

			if (output.error) {
				outputString = this.outputError(output.error, true);
			} else {
				outputString = output.text;
			}

			if (outputString && outputString.length > 0) {
				outputString += "\n";
			}
			this.view.setAreaValue("outputText", outputString);

			if (!output.error) {
				this.vm.vmSetStartLine(this.vm.line as number); // fast hack
				this.vm.vmGotoLine("direct");

				try {
					const fnScript = new Function("o", outputString); // eslint-disable-line no-new-func

					this.fnScript = fnScript;
				} catch (e) {
					Utils.console.error(e);
					if (e instanceof Error) {
						this.outputError(e, true);
					}
				}
			}

			if (!output.error) {
				this.updateResultText();
				return true;
			}

			const msg = inputParas.message;

			this.vm.print(stream, msg);
			this.vm.cursor(stream, 1);
		}
		this.updateResultText();
		return false;
	}

	private startWithDirectInput() {
		const vm = this.vm,
			stream = 0,
			msg = "Ready\r\n";

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
	}

	private updateResultText() {
		this.view.setAreaValue("resultText", this.vm.outBuffer);
		this.view.setAreaScrollTop("resultText"); // scroll to bottom
	}

	private exitLoop() {
		const stop = this.vm.vmGetStopObject(),
			reason = stop.reason;

		this.updateResultText();

		this.view.setDisabled("runButton", reason === "reset");
		this.view.setDisabled("stopButton", reason !== "fileLoad" && reason !== "fileSave");
		this.view.setDisabled("continueButton", reason === "end" || reason === "fileLoad" || reason === "fileSave" || reason === "parse" || reason === "renumLines" || reason === "reset");

		this.setVarSelectOptions("varSelect", this.variables);
		this.commonEventHandler.onVarSelectChange();

		if (reason === "stop" || reason === "end" || reason === "error" || reason === "parse" || reason === "parseRun") {
			this.startWithDirectInput();
		}
	}

	private fnWaitFrame() {
		this.vm.vmStop("", 0, true);
		this.nextLoopTimeOut = this.vm.vmGetTimeUntilFrame(); // wait until next frame
	}

	private fnOnError() {
		this.vm.vmStop("", 0, true); // continue
	}

	private static fnDummy() {
		// empty
	}

	private fnTimer() {
		this.vm.vmStop("", 0, true); // continue
	}

	private fnRunLoop() {
		const stop = this.vm.vmGetStopObject();

		this.nextLoopTimeOut = 0;
		if (!stop.reason && this.fnScript) {
			this.fnRunPart1(this.fnScript); // could change reason
		}

		if (stop.reason in this.handlers) {
			this.handlers[stop.reason].call(this, stop.paras);
		} else {
			Utils.console.warn("runLoop: Unknown run mode:", stop.reason);
			this.vm.vmStop("error", 50);
		}

		if (stop.reason && stop.reason !== "waitSound" && stop.reason !== "waitKey" && stop.reason !== "waitInput") {
			this.timeoutHandlerActive = false; // not running any more
			this.exitLoop();
		} else {
			setTimeout(this.fnRunLoopHandler, this.nextLoopTimeOut);
		}
	}

	startMainLoop(): void {
		if (!this.timeoutHandlerActive) {
			this.timeoutHandlerActive = true;
			this.fnRunLoop();
		}
	}

	private setStopObject(stop: VmStopEntry) {
		Object.assign(this.savedStop, stop);
	}

	private getStopObject() {
		return this.savedStop;
	}


	startParse(): void {
		this.keyboard.setKeyDownHandler(undefined);
		this.vm.vmStop("parse", 95);
		this.startMainLoop();
	}

	startRenum(): void {
		const stream = 0;

		this.vm.vmStop("renumLines", 85, false, {
			command: "renum",
			stream: 0, // unused
			newLine: Number(this.view.getInputValue("renumNewInput")), // 10
			oldLine: Number(this.view.getInputValue("renumStartInput")), // 1
			step: Number(this.view.getInputValue("renumStepInput")), // 10
			keep: Number(this.view.getInputValue("renumKeepInput")), // 65535, keep lines
			line: this.vm.line
		});

		if (this.vm.pos(stream) > 1) {
			this.vm.print(stream, "\r\n");
		}
		this.vm.print(stream, "renum\r\n");
		this.startMainLoop();
	}

	startRun(): void {
		this.setStopObject(this.noStop);

		this.keyboard.setKeyDownHandler(undefined);
		this.vm.vmStop("run", 95);
		this.startMainLoop();
	}

	startParseRun(): void {
		this.setStopObject(this.noStop);
		this.keyboard.setKeyDownHandler(undefined);
		this.vm.vmStop("parseRun", 95);
		this.startMainLoop();
	}

	startBreak(): void {
		const vm = this.vm,
			stop = vm.vmGetStopObject();

		this.setStopObject(stop);
		this.keyboard.setKeyDownHandler(undefined);
		this.vm.vmStop("break", 80);
		this.startMainLoop();
	}

	startContinue(): void {
		const vm = this.vm,
			stop = vm.vmGetStopObject(),
			savedStop = this.getStopObject();

		this.view.setDisabled("runButton", true);
		this.view.setDisabled("stopButton", false);
		this.view.setDisabled("continueButton", true);
		if (stop.reason === "break" || stop.reason === "escape" || stop.reason === "stop" || stop.reason === "direct") {
			if (savedStop.paras && !(savedStop.paras as VmInputParas).fnInputCallback) { // no keyboard callback? make sure no handler is set (especially for direct->continue)
				this.keyboard.setKeyDownHandler(undefined);
			}
			if (stop.reason === "direct" || stop.reason === "escape") {
				this.vm.cursor(stop.paras.stream, 0); // switch it off (for continue button)
			}
			Object.assign(stop, savedStop); // fast hack
			this.setStopObject(this.noStop);
		}
		this.startMainLoop();
	}

	startReset(): void {
		this.setStopObject(this.noStop);
		this.keyboard.setKeyDownHandler(undefined);
		this.vm.vmStop("reset", 99);
		this.startMainLoop();
	}

	startScreenshot(): string {
		return this.canvas.startScreenshot();
	}

	private fnPutKeyInBuffer(key: string) {
		this.keyboard.putKeyInBuffer(key);

		const keyDownHandler = this.keyboard.getKeyDownHandler();

		if (keyDownHandler) {
			keyDownHandler();
		}
	}

	startEnter(): void {
		let input = this.view.getAreaValue("inp2Text");

		input = input.replace("\n", "\r"); // LF => CR
		if (!input.endsWith("\r")) {
			input += "\r";
		}
		for (let i = 0; i < input.length; i += 1) {
			this.fnPutKeyInBuffer(input.charAt(i));
		}

		this.view.setAreaValue("inp2Text", "");
	}

	private static generateFunction(par: string, functionString: string) {
		if (functionString.startsWith("function anonymous(")) { // already a modified function (inside an anonymous function)?
			const firstIndex = functionString.indexOf("{"),
				lastIndex = functionString.lastIndexOf("}");

			if (firstIndex >= 0 && lastIndex >= 0) {
				functionString = functionString.substring(firstIndex + 1, lastIndex - 1); // remove anonymous function
			}
			functionString = functionString.trim();
		} else {
			functionString = "var o=cpcBasic.controller.vm, v=o.vmGetAllVariables(); v." + par + " = " + functionString;
		}

		const match = (/function \(([^)]*)/).exec(functionString),
			args = match ? match[1].split(",") : [],
			fnFunction = new Function(args[0], args[1], args[2], args[3], args[4], functionString); // eslint-disable-line no-new-func
			// we support at most 5 arguments

		return fnFunction;
	}

	changeVariable(): void {
		const par = this.view.getSelectValue("varSelect"),
			valueString = this.view.getSelectValue("varText"),
			variables = this.variables;
		let value = variables.getVariable(par);

		if (typeof value === "function") {
			value = Controller.generateFunction(par, valueString);
			variables.setVariable(par, value);
		} else {
			const varType = this.variables.determineStaticVarType(par),
				type = this.vm.vmDetermineVarType(varType); // do we know dynamic type?

			if (type !== "$") { // not string? => convert to number
				value = parseFloat(valueString);
			} else {
				value = valueString;
			}

			try {
				const value2 = this.vm.vmAssign(varType, value);

				variables.setVariable(par, value2);
				Utils.console.log("Variable", par, "changed:", variables.getVariable(par), "=>", value);
			} catch (e) {
				Utils.console.warn(e);
			}
		}
		this.setVarSelectOptions("varSelect", variables);
		this.commonEventHandler.onVarSelectChange(); // title change?
	}

	setSoundActive(): void {
		const sound = this.sound,
			soundButton = View.getElementById1("soundButton"),
			active = this.model.getProperty<boolean>("sound");
		let	text: string;

		if (active) {
			try {
				sound.soundOn();
				text = (sound.isActivatedByUser()) ? "Sound is on" : "Sound on (waiting)";
			} catch (e) {
				Utils.console.warn("soundOn:", e);
				text = "Sound unavailable";
			}
		} else {
			sound.soundOff();
			text = "Sound is off";
			const stop = this.vm && this.vm.vmGetStopObject();

			if (stop && stop.reason === "waitSound") {
				this.vm.vmStop("", 0, true); // do not wait
			}
		}
		soundButton.innerText = text;
	}

	private static createMinimalAmsdosHeader(type: string,	start: number,	length: number) {
		const header = {
			typeString: type,
			start: start,
			length: length
		} as AmsdosHeader;

		return header;
	}


	private fnEndOfImport(imported: string[]) {
		const stream = 0,
			vm = this.vm;

		for (let i = 0; i < imported.length; i += 1) {
			vm.print(stream, imported[i], " ");
		}
		vm.print(stream, "\r\n", imported.length + " file" + (imported.length !== 1 ? "s" : "") + " imported.\r\n");
		this.updateResultText();
	}

	private static reRegExpIsText = new RegExp(/^\d+ |^[\t\r\n\x1a\x20-\x7e]*$/); // eslint-disable-line no-control-regex
	// starting with (line) number, or 7 bit ASCII characters without control codes except \x1a=EOF

	private fnLoad2(data: string, name: string, type: string, imported: string[]) {
		let header: AmsdosHeader | undefined,
			storageName = this.vm.vmAdaptFilename(name, "FILE");

		storageName = Controller.fnLocalStorageName(storageName);

		if (type === "text/plain") {
			header = Controller.createMinimalAmsdosHeader("A", 0, data.length);
		} else {
			if (type === "application/x-zip-compressed" || type === "cpcBasic/binary") { // are we a file inside zip?
				// empty
			} else { // e.g. "data:application/octet-stream;base64,..."
				const index = data.indexOf(",");

				if (index >= 0) {
					const info1 = data.substr(0, index);

					data = data.substr(index + 1); // remove meta prefix
					if (info1.indexOf("base64") >= 0) {
						data = Utils.atob(data); // decode base64
					}
				}
			}

			header = DiskImage.parseAmsdosHeader(data);
			if (header) {
				data = data.substr(0x80); // remove header
			} else if (Controller.reRegExpIsText.test(data)) {
				header = Controller.createMinimalAmsdosHeader("A", 0, data.length);
			} else if (DiskImage.testDiskIdent(data.substr(0, 8))) { // disk image file?
				try {
					const dsk = new DiskImage({
							data: data,
							diskName: name
						}),
						dir = dsk.readDirectory(),
						diskFiles = Object.keys(dir);

					for (let i = 0; i < diskFiles.length; i += 1) {
						const fileName = diskFiles[i];

						try { // eslint-disable-line max-depth
							data = dsk.readFile(dir[fileName]);
							this.fnLoad2(data, fileName, "cpcBasic/binary", imported); // recursive
						} catch (e) {
							Utils.console.error(e);
							if (e instanceof Error) { // eslint-disable-line max-depth
								this.outputError(e, true);
							}
						}
					}
				} catch (e) {
					Utils.console.error(e);
					if (e instanceof Error) {
						this.outputError(e, true);
					}
				}
				header = undefined; // ignore dsk file
			} else { // binary
				header = Controller.createMinimalAmsdosHeader("B", 0, data.length);
			}
		}

		if (header) {
			const meta = Controller.joinMeta(header);

			try {
				Utils.localStorage.setItem(storageName, meta + "," + data);
				this.updateStorageDatabase("set", storageName);
				Utils.console.log("fnOnLoad: file: " + storageName + " meta: " + meta + " imported");
				imported.push(name);
			} catch (e) { // maybe quota exceeded
				Utils.console.error(e);
				if (e instanceof Error) {
					if (e.name === "QuotaExceededError") {
						(e as CustomError).shortMessage = storageName + ": Quota exceeded";
					}
					this.outputError(e, true);
				}
			}
		}
	}

	// https://stackoverflow.com/questions/10261989/html5-javascript-drag-and-drop-file-from-external-window-windows-explorer
	// https://www.w3.org/TR/file-upload/#dfn-filereader
	private fnHandleFileSelect(event: Event) {
		const dataTransfer = (event as DragEvent).dataTransfer,
			files = dataTransfer ? dataTransfer.files : ((event.target as any).files as FileList), // dataTransfer for drag&drop, target.files for file input
			that = this,
			imported: string[] = [];
		let fileIndex = 0,
			file: File,
			reader: FileReader;

		function fnReadNextFile() {
			if (fileIndex < files.length) {
				file = files[fileIndex];
				fileIndex += 1;
				const lastModified = file.lastModified,
					lastModifiedDate = lastModified ? new Date(lastModified) : (file as any).lastModifiedDate as Date, // lastModifiedDate deprecated, but for old IE
					text = file.name + " " + (file.type || "n/a") + " " + file.size + " " + (lastModifiedDate ? lastModifiedDate.toLocaleDateString() : "n/a");

				Utils.console.log(text);
				if (file.type === "text/plain") {
					reader.readAsText(file);
				} else if (file.type === "application/x-zip-compressed") {
					reader.readAsArrayBuffer(file);
				} else {
					reader.readAsDataURL(file);
				}
			} else {
				that.fnEndOfImport(imported);
			}
		}

		function fnErrorHandler(event2: ProgressEvent<FileReader>) {
			const target = event2.target;
			let msg = "fnErrorHandler: Error reading file " + file.name;

			if (target !== null && target.error !== null) {
				if (target.error.NOT_FOUND_ERR) {
					msg += ": File not found";
				} else if (target.error.ABORT_ERR) {
					msg = ""; // nothing
				}
			}
			if (msg) {
				Utils.console.warn(msg);
			}
			fnReadNextFile();
		}

		function fnOnLoad(event2: ProgressEvent<FileReader>) {
			const target = event2.target,
				data = (target && target.result) || null,
				name = file.name,
				type = file.type;

			if (type === "application/x-zip-compressed" && data instanceof ArrayBuffer) {
				let zip: ZipFile | undefined;

				try {
					zip = new ZipFile(new Uint8Array(data), name); // rather data
				} catch (e) {
					Utils.console.error(e);
					if (e instanceof Error) {
						that.outputError(e, true);
					}
				}
				if (zip) {
					const zipDirectory = zip.getZipDirectory(),
						entries = Object.keys(zipDirectory);

					for (let i = 0; i < entries.length; i += 1) {
						const name2 = entries[i];
						let data2: string | undefined;

						try {
							data2 = zip.readData(name2);
						} catch (e) {
							Utils.console.error(e);
							if (e instanceof Error) { // eslint-disable-line max-depth
								that.outputError(e, true);
							}
						}

						if (data2) {
							that.fnLoad2(data2, name2, type, imported);
						}
					}
				}
			} else if (typeof data === "string") {
				that.fnLoad2(data, name, type, imported);
			} else {
				Utils.console.warn("Error loading file", name, "with type", type, " unexpected data:", data);
			}

			fnReadNextFile();
		}

		event.stopPropagation();
		event.preventDefault();

		if (window.FileReader) {
			reader = new FileReader();
			reader.onerror = fnErrorHandler;
			reader.onload = fnOnLoad;
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

		const canvasElement = this.canvas.getCanvas();

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
		const input = this.view.getAreaValue("inputText"),
			stackInput = this.inputStack.getInput();

		if (stackInput !== input) {
			this.inputStack.save(input);
			this.fnUpdateUndoRedoButtons();
		}
	}

	startUpdateCanvas(): void {
		this.canvas.startUpdateCanvas();
	}

	stopUpdateCanvas(): void {
		this.canvas.stopUpdateCanvas();
	}

	virtualKeyboardCreate(): void {
		if (!this.virtualKeyboard) {
			this.virtualKeyboard = new VirtualKeyboard({
				fnPressCpcKey: this.keyboard.fnPressCpcKey.bind(this.keyboard),
				fnReleaseCpcKey: this.keyboard.fnReleaseCpcKey.bind(this.keyboard)
			});
		}
	}

	getVariable(par: string): VariableValue {
		return this.variables.getVariable(par);
	}

	undoStackElement(): string {
		return this.inputStack.undo();
	}

	redoStackElement(): string {
		return this.inputStack.redo();
	}

	onDatabaseSelectChange(): void {
		let url: string;
		const databaseName = this.view.getSelectValue("databaseSelect");

		this.model.setProperty("database", databaseName);
		this.view.setSelectTitleFromSelectedOption("databaseSelect");

		const database = this.model.getDatabase(),
			that = this,
			fnDatabaseLoaded = function () {
				database.loaded = true;
				Utils.console.log("fnDatabaseLoaded: database loaded: " + databaseName + ": " + url);
				that.setExampleSelectOptions();
				that.onExampleSelectChange();
			},
			fnDatabaseError = function () {
				database.loaded = false;
				Utils.console.error("fnDatabaseError: database error: " + databaseName + ": " + url);
				that.setExampleSelectOptions();
				that.onExampleSelectChange();
				that.setInputText("");
				that.view.setAreaValue("resultText", "Cannot load database: " + databaseName);
			};

		if (!database) {
			Utils.console.error("onDatabaseSelectChange: database not available:", databaseName);
			return;
		}

		if (database.text === "storage") { // sepcial handling: browser localStorage
			this.updateStorageDatabase("set", ""); // set all
			database.loaded = true;
		}

		if (database.loaded) {
			this.setExampleSelectOptions();
			this.onExampleSelectChange();
		} else {
			this.setInputText("#loading database " + databaseName + "...");
			const exampleIndex = this.model.getProperty<string>("exampleIndex");

			url = database.src + "/" + exampleIndex;
			Utils.loadScript(url, fnDatabaseLoaded, fnDatabaseError, databaseName);
		}
	}

	onExampleSelectChange(): void {
		const vm = this.vm,
			inFile = vm.vmGetInFileObject(),
			dataBaseName = this.model.getProperty<string>("database");

		vm.closein();

		inFile.open = true;

		let exampleName = this.view.getSelectValue("exampleSelect");
		const exampleEntry = this.model.getExample(exampleName);

		inFile.command = "run";
		if (exampleEntry && exampleEntry.meta) { // TTT TODO: this is just a workaround, meta is in input now; should change command after loading!
			const type = exampleEntry.meta.charAt(0);

			if (type === "B" || type === "D" || type === "G") { // binary, data only, Gena Assembler?
				inFile.command = "load";
			}
		}

		if (dataBaseName !== "storage") {
			exampleName = "/" + exampleName; // load absolute
		} else {
			this.model.setProperty("example", exampleName);
		}

		inFile.name = exampleName;
		inFile.start = undefined;
		inFile.fnFileCallback = vm.fnLoadHandler;
		vm.vmStop("fileLoad", 90);
		this.startMainLoop();
	}

	// currently not used. Can be called manually: cpcBasic.controller.exportAsBase64(file);
	static exportAsBase64(storageName: string): string {
		const storage = Utils.localStorage;
		let data = storage.getItem(storageName),
			out = "";

		if (data !== null) {
			const index = data.indexOf(","); // metadata separator

			if (index >= 0) {
				const meta = data.substr(0, index);

				data = data.substr(index + 1);
				data = Utils.btoa(data);
				out = meta + ";base64," + data;
			} else { // hmm, no meta info
				data = Utils.btoa(data);
				out = "base64," + data;
			}
		}
		Utils.console.log(out);
		return out;
	}

	onCpcCanvasClick(event: MouseEvent): void {
		this.canvas.onCpcCanvasClick(event);
		this.keyboard.setActive(true);
	}

	onWindowClick(event: Event): void {
		this.canvas.onWindowClick(event);
		this.keyboard.setActive(false);
	}


	/* eslint-disable no-invalid-this */
	private handlers: { [k: string]: (paras: any) => void } = { // { [k: string]: (e: Event) => void }
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