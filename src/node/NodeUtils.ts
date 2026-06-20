import type { ICore, INodeUtils, ICpcVmRsx, LoadScriptFn, ICanvasVm, IKeyboard, CpcKeyExpansionsOptions, VolEnvData, ToneEnvData, SoundData, ISound, IStorage, CanvasCharType } from "../Interfaces";
//import "./NodePolyfills";
import { Utils } from "../Utils";
import { Controller0, ControllerOptions0 } from "../Controller0";
//import { NoCanvas } from "../ui/NoCanvas";
//import { View } from "../ui/View";
//import { NodeDocumentAdapter } from "./NodeDocumentAdapter";

interface NodeHttps {
	get: (url: string, fn: (res: any) => void) => any
}

interface NodeFs {
	readFile: (name: string, encoding: string, fn: (res: any) => void) => any
}

const myGlobalThis = (typeof globalThis !== "undefined") ? globalThis : Function("return this")(); // eslint-disable-line no-new-func

function createLocalStorage(): IStorage {
	const data: Record<string, string> = {};
	const storage: Record<string, unknown> = {
		clear() {
			Object.keys(data).forEach((key) => {
				delete data[key];
				delete storage[key];
			});
		},
		getItem(key: string) {
			return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null;
		},
		key(index: number) {
			const keys = Object.keys(data);

			return (index >= 0 && index < keys.length) ? keys[index] : null;
		},
		removeItem(key: string) {
			delete data[key];
			delete storage[key];
		},
		setItem(key: string, value: string) {
			const value2 = String(value);

			data[key] = value2;
			storage[key] = value2;
		},
		get length() {
			return Object.keys(data).length;
		}
	};

	return storage as Storage;
}

export class NodeUtils implements INodeUtils {
	private static currentScriptKey = "";

	private static nodeReadUrl(url: string, fnDataLoaded: (error: Error | undefined, data?: string) => void) {
		const nodeHttps = eval("require")("https") as NodeHttps; // eslint-disable-line no-eval

		nodeHttps.get(url, (resp) => {
			let data = "";

			resp.on("data", (chunk: string) => {
				data += chunk;
			});

			resp.on("end", () => {
				fnDataLoaded(undefined, data);
			});
		}).on("error", (err: Error) => {
			console.log("Error: " + err.message);
			fnDataLoaded(err);
		});
	}

	private static nodeReadFile(name: string, fnDataLoaded: (error: Error | undefined, data?: string) => void) {
		const nodeFs = eval("require")("fs") as NodeFs, // eslint-disable-line no-eval
			cwd = (myGlobalThis.process && myGlobalThis.process.cwd) ? myGlobalThis.process.cwd() : "",
			name2 = (cwd && name.indexOf(":") < 0 && !name.startsWith("/")) ? cwd + "/" + name : name;

		nodeFs.readFile(name2, "utf8", fnDataLoaded);
	}

	private static isUrl(s: string) {
		return s.startsWith("http"); // http or https
	}

	static readonly loadScript: LoadScriptFn = (fileOrUrl, fnSuccess, fnError: (url2: string, key: string) => void, key) => {
		const fnLoaded = (error: Error | undefined, data?: string) => {
			if (error) {
				console.error("file error: ", error);
				fnError(fileOrUrl, key);
				return;
			}
			if (data) {
				NodeUtils.currentScriptKey = key;
				(0, eval)(data); // eslint-disable-line no-eval
				NodeUtils.currentScriptKey = "";
			}
			fnSuccess(fileOrUrl, key);
		};

		if (NodeUtils.isUrl(fileOrUrl)) {
			NodeUtils.nodeReadUrl(fileOrUrl, fnLoaded);
		} else {
			NodeUtils.nodeReadFile(fileOrUrl, fnLoaded);
		}
	};

	private static writeResultDelta(text: string, state: { text: string }) {
		const previous = state.text;
		const delta = text.startsWith(previous) ? text.substring(previous.length) : text;

		if (delta && myGlobalThis.process && myGlobalThis.process.stdout) {
			myGlobalThis.process.stdout.write(delta);
		}
		state.text = text;
	}

	public nodeMain(core: ICore) {
		const model = core.getModel(),
			config = model.getAllProperties();

		core.parseArgs(myGlobalThis.process.argv.slice(2), config);

		if (config.canvasType === "graphics") {
			config.canvasType = "text";
		}

		if (!myGlobalThis.AudioContext && config.sound === true) {
			config.sound = false;
		}

		config.showCpc = false; // disable canvas updates in headless mode

		const debug = model.getProperty<number>("debug");

		if (debug) {
			core.setDebug(debug);
			Utils.setDebug(debug);
		}
		core.init(); // init databases

		//const nodeDocument = new NodeDocumentAdapter();

		//(myGlobalThis as any).document = nodeDocument;
		(myGlobalThis as any).cpcBasic = {
			addIndex: core.addIndex,
			addItem: (key: string, input: string | (() => void)) => {
				core.addItem(key || NodeUtils.currentScriptKey, input);
			},
			addRsx: (key: string, RsxConstructor: new () => ICpcVmRsx) => core.addRsx(key || NodeUtils.currentScriptKey, RsxConstructor)
		};
		//View.setDocument(nodeDocument);

		const outputState = {
			text: ""
		};


		const textBuffer: number[][] = []; // textbuffer characters at row,column

		const putCharInTextBuffer = (char: number, x: number, y: number) => {
			if (!textBuffer[y]) {
				textBuffer[y] = [];
			}
			textBuffer[y][x] = char;
		};

		const getCharFromTextBuffer = (x: number, y: number) => {
			let char: number | undefined;

			if (textBuffer[y]) {
				char = textBuffer[y][x]; // can be undefined, if not set
			}
			return char;
		};

		const clearTextBufferBox = (left: number, top: number, width: number, height: number) => {
			for (let y = top; y < top + height; y += 1) {
				const textBufferRow = textBuffer[y];

				if (textBufferRow) {
					for (let x = left; x < left + width; x += 1) {
						delete textBufferRow[x];
					}
				}
			}
		}

		const copyTextBufferBoxUp = (left: number, top: number, width: number, height: number, left2: number, top2: number) => {
			for (let y = 0; y < height; y += 1) {
				const sourceRow = textBuffer[top + y];
				let destinationRow = textBuffer[top2 + y];

				if (sourceRow) {
					// could be optimized, if complete rows
					if (!destinationRow) {
						destinationRow = [];
						textBuffer[top2 + y] = destinationRow;
					}
					for (let x = 0; x < width; x += 1) {
						destinationRow[left2 + x] = sourceRow[left + x];
					}
				} else if (destinationRow) {
					delete textBuffer[top2 + y]; // no sourceRow => clear destinationRow
				}
			}
		};

		const canvas: ICanvasVm = {
			reset: () => {
				textBuffer.length = 0;
			},
			resetCustomChars: () => undefined,
			setScreenOffset: (_offset: number) => undefined,
			updateColorsAndCanvasImmediately: (_inkList: number[]) => undefined,
			updateSpeedInk: () => undefined,
			setCustomChar: (_char: number, _charData: CanvasCharType) => undefined,
			getCharData: (_char: number) => [],
			setDefaultInks: () => undefined,
			//onCanvasClick: (_event: MouseEvent) => undefined,
			getXpos: () => 0,
			getYpos: () => 0,
			getByte: (_addr: number) => 0,
			setByte: (_addr: number, _byte: number) => undefined,
			draw: (_x: number, _y: number) => undefined,
			move: (_x: number, _y: number) => undefined,
			plot: (_x: number, _y: number) => undefined,
			test: (_x: number, _y: number) => 0,
			setInk: (_pen: number, _ink1: number, _ink2: number) => false,
			setBorder: (_ink1: number, _ink2: number) => undefined,
			setGPen: (_gPen: number) => undefined,
			setGPaper: (_gPaper: number) => undefined,
			setGTransparentMode: (_transparent: boolean) => undefined,
			printGChar: (_char: number) => undefined,
			drawCursor: (_x: number, _y: number, _pen: number, _paper: number) => undefined,
			fill: (_fillPen: number) => undefined,
			setOrigin: (_xOrig: number, _yOrig: number) => undefined,
			getXOrigin: () => 0,
			getYOrigin: () => 0,
			setGWindow: (_xLeft: number, _xRight: number, _yTop: number, _yBottom: number) => undefined,
			setGColMode: (_gColMode: number) => undefined,
			clearGraphicsWindow: () => undefined,
			setSpeedInk: (_time1: number, _time2: number) => undefined,
			setMask: (_mask: number) => undefined,
			setMaskFirst: (_maskFirst: number) => undefined,
			getMode: () => 0,
			changeMode: (_mode: number) => undefined,
			//takeScreenShot: () => "",
			//startUpdateCanvas: () => undefined,
			//stopUpdateCanvas: () => undefined,
			//onWindowClick: (_event: Event) => undefined,
			fillTextBox: (left: number, top: number, width: number, height: number, _paper: number) => {
				clearTextBufferBox(left, top, width, height);
			},
			printChar: (char: number, x: number, y: number, _pen: number, _paper: number, _transparent: boolean) => {
				putCharInTextBuffer(char, x, y);
			},
			readChar: (x: number, y: number, _pen: number, _paper: number) => {
				let char = getCharFromTextBuffer(x, y);
				if (char === undefined) {
					char = -1; // not detected
				}
				return char;
			},
			clearTextWindow: (_left: number, _right: number, _top: number, _bottom: number, _paper: number) => undefined,
			setMode: (_mode: number) => undefined,
			clearFullWindow: () => {
				textBuffer.length = 0;
			},
			windowScrollUp: (left: number, right: number, top: number, bottom: number, _paper: number) => {
				const width = right + 1 - left,
					height = bottom + 1 - top;

				if (height > 1) { // scroll part
					// adapt also text buffer
					copyTextBufferBoxUp(left, top + 1, width, height - 1, left, top);
				}
				canvas.fillTextBox(left, bottom, width, 1, 0);
			},
			windowScrollDown: (_left: number, _right: number, _top: number, _bottom: number, _paper: number) => undefined
		};

		// const canvas: ICanvasVm = new NoCanvas({
		// 		canvasID: "id" as any,
		// 		charset: [],
		// 		palette: "color"
		// });

		const keyboard: IKeyboard = {
			reset: () => undefined,
			resetExpansionTokens: () => undefined,
			resetCpcKeysExpansions: () => undefined,
			clearInput: () => undefined,
			getKeyFromBuffer: () => "",
			putKeyInBuffer: (_key: string, _triggerOnKeyDown?: boolean) => undefined,
			getKeyState: (_cpcKeyCode: number) => 0,
			getJoyState: (_joy: number) => 0,
			setExpansionToken: (_token: number, _string: string) => undefined,
			setCpcKeyExpansion: (_options: CpcKeyExpansionsOptions) => undefined
		};

		const sound: ISound = {
			reset: () => undefined,
			resetQueue: () => undefined,
			testCanQueue: (_state: number) => true,
			sound: (_soundData: SoundData) => undefined,
			setVolEnv: (_volEnv: number, _volEnvData: VolEnvData[]) => undefined,
			setToneEnv: (_toneEnv: number, _toneEnvData: ToneEnvData[]) => undefined,
			scheduler: () => undefined,
			release: (_releaseMask: number) => undefined,
			sq: (_n: number) => 0
		};

		// https://dirask.com/posts/Node-js-atob-btoa-functions-equivalents-1Aqb51
		const atobFn = (input: string) => { // decode
			return Buffer.from(input, "base64").toString("binary");
		};

		const btoaFn = (input: string) => { // encode
			return Buffer.from(input, "binary").toString("base64");
		}

		const controllerOptions: ControllerOptions0 = {
			canvas,
			keyboard,
			sound,
			isHeadlessDirectInput: true,
			loadScript: NodeUtils.loadScript,
			onOutputText: (_value: string) => {
				// TODO
			},
			onResultText: (value: string) => {
				NodeUtils.writeResultDelta(value, outputState);
			},
			onProgramEnd: () => {
				myGlobalThis.process.exit(0);
			},
			storage: createLocalStorage(),
			atobFn: atobFn,
			btoaFn: btoaFn,
			console: console,
			setTimeout: setTimeout
		};

		const controller = new Controller0(core, controllerOptions);

		controller.onDatabaseSelectChange(); // trigger loading configured example
	}
}
