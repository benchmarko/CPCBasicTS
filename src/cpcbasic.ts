// cpcbasic.ts - CPCBasic for the Browser
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//

import { Utils } from "./Utils";
import { Controller } from "./Controller";
import { cpcconfig } from "./cpcconfig";
import { Model, ConfigType, ConfigEntryType } from "./Model";
import { View } from "./View";

class cpcBasic { // eslint-disable-line vars-on-top
	private static readonly config: ConfigType = {
		bench: 0, // debug: number of parse bench loops
		debug: 0,
		databaseDirs: "examples", // example base directories (comma separated)
		database: "examples", // examples, apps, saved
		example: "cpcbasic",
		exampleIndex: "0index.js", // example index for every exampleDir
		input: "", // keyboard input when starting the app
		kbdLayout: "alphanum", // alphanum, alpha, num
		showInput: true,
		showInp2: false,
		showCpc: true,
		showKbd: false,
		showKbdLayout: false,
		showOutput: false,
		showResult: false,
		showText: false,
		showVariable: false,
		showConsole: false,
		showConvert: false,
		sound: true,
		trace: false // trace code
	};

	private static model: Model;
	private static view: View;
	private static controller: Controller;

	private static fnHereDoc(fn: () => void) {
		return String(fn).
			replace(/^[^/]+\/\*\S*/, "").
			replace(/\*\/[^/]+$/, "");
	}

	static addIndex(dir: string, input: string | (() => void)) {
		if (typeof input !== "string") {
			input = this.fnHereDoc(input);
		}
		return cpcBasic.controller.addIndex(dir, input);
	}

	static addItem(key: string, input: string | (() => void)) {
		const inputString = (typeof input !== "string") ? this.fnHereDoc(input) : input;

		return cpcBasic.controller.addItem(key, inputString);
	}

	// can be used for nodeJS
	private static fnParseArgs(args: string[], config: ConfigType) {
		for (let i = 0; i < args.length; i += 1) {
			const nameValue = args[i],
				nameValueList = Utils.split2(nameValue, "="),
				name = nameValueList[0];

			if (config.hasOwnProperty(name)) {
				let value: ConfigEntryType = nameValueList[1]; // string|number|boolean

				if (value !== undefined && config.hasOwnProperty(name)) {
					switch (typeof config[name]) {
					case "string":
						break;
					case "boolean":
						value = (value === "true");
						break;
					case "number":
						value = Number(value);
						break;
					case "object":
						break;
					default:
						break;
					}
				}
				config[name] = value;
			}
		}
		return config;
	}

	// https://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript
	private static fnParseUri(urlQuery: string, config: ConfigType) {
		const rPlus = /\+/g, // Regex for replacing addition symbol with a space
			fnDecode = function (s: string) { return decodeURIComponent(s.replace(rPlus, " ")); },
			rSearch = /([^&=]+)=?([^&]*)/g,
			args: string[] = [];

		let match: RegExpExecArray | null;

		while ((match = rSearch.exec(urlQuery)) !== null) {
			const name = fnDecode(match[1]),
				value = fnDecode(match[2]);

			if (value !== null && config.hasOwnProperty(name)) {
				args.push(name + "=" + value);
			}
		}
		cpcBasic.fnParseArgs(args, config);
	}

	private static fnMapObjectProperties(arg: any) {
		if (typeof arg === "object") {
			const res = [];

			for (const key in arg) { // eslint-disable-line guard-for-in
				// if (arg.hasOwnProperty(key)) {
				const value = arg[key];

				if (typeof value !== "object" && typeof value !== "function") {
					res.push(key + ": " + value);
				}
			}
			arg = String(arg) + "{" + res.join(", ") + "}";
		}
		return arg;
	}

	private static createDebugUtilsConsole(cpcBasicLog: string) {
		const currentConsole = Utils.console;

		return {
			consoleLog: {
				value: cpcBasicLog || "" // already something collected?
			},
			console: currentConsole,
			rawLog: function (fnMethod: (args: any) => void, level: string, args: any) {
				if (level) {
					args.unshift(level);
				}
				if (fnMethod) {
					if (fnMethod.apply) {
						fnMethod.apply(console, args);
					}
				}
				if (this.consoleLog) {
					this.consoleLog.value += args.map(cpcBasic.fnMapObjectProperties).join(" ") + ((level !== null) ? "\n" : "");
				}
			},
			log: function () {
				this.rawLog(this.console && this.console.log, "", Array.prototype.slice.call(arguments));
			},
			debug: function () {
				this.rawLog(this.console && this.console.debug, "DEBUG:", Array.prototype.slice.call(arguments));
			},
			info: function () {
				this.rawLog(this.console && this.console.info, "INFO:", Array.prototype.slice.call(arguments));
			},
			warn: function () {
				this.rawLog(this.console && this.console.warn, "WARN:", Array.prototype.slice.call(arguments));
			},
			error: function () {
				this.rawLog(this.console && this.console.error, "ERROR:", Array.prototype.slice.call(arguments));
			},
			changeLog: function (log: any) {
				const oldLog = this.consoleLog;

				this.consoleLog = log;
				if (oldLog && oldLog.value && log) { // some log entires collected?
					log.value += oldLog.value; // take collected log entries
				}
			}
		};
	}

	private static fnDoStart() {
		const startConfig = cpcBasic.config,
			winCpcConfig = window.cpcConfig || {};

		Object.assign(startConfig, cpcconfig, winCpcConfig);

		cpcBasic.model = new Model(startConfig);

		// eslint-disable-next-line no-new-func
		const myGlobalThis = (typeof globalThis !== "undefined") ? globalThis : Function("return this")(); // for old IE

		if (!myGlobalThis.process) { // browser
			cpcBasic.fnParseUri(window.location.search.substring(1), startConfig);
		} else { // nodeJs
			cpcBasic.fnParseArgs(myGlobalThis.process.argv.slice(2), startConfig);
		}

		cpcBasic.view = new View();

		const debug = Number(cpcBasic.model.getProperty<number>("debug"));

		Utils.debug = debug;

		let UtilsConsole = Utils.console as any,
			cpcBasicLog = "";

		if (UtilsConsole.cpcBasicLog) {
			cpcBasicLog = UtilsConsole.cpcBasicLog;
			UtilsConsole.cpcBasicLog = undefined; // do not log any more to dummy console
		}

		if (Utils.debug > 1 && cpcBasic.model.getProperty<boolean>("showConsole")) { // console log window?
			UtilsConsole = cpcBasic.createDebugUtilsConsole(cpcBasicLog);
			Utils.console = UtilsConsole;
			Utils.console.log("CPCBasic log started at", Utils.dateFormat(new Date()));
			UtilsConsole.changeLog(View.getElementById1("consoleText"));
		}

		cpcBasic.controller = new Controller(cpcBasic.model, cpcBasic.view);
	}

	static fnOnLoad() {
		Utils.console.log("CPCBasic started at", Utils.dateFormat(new Date()));
		cpcBasic.fnDoStart();
	}
}

declare global {
    interface Window {
		cpcBasic: cpcBasic;
		cpcConfig: ConfigType;
	}
}

window.cpcBasic = cpcBasic;

window.onload = () => {
	cpcBasic.fnOnLoad();
};

// nodeJsAvail: when launching via node...
// eslint-disable-next-line no-new-func
const myGlobalThis = (typeof globalThis !== "undefined") ? globalThis : Function("return this")(), // for old IE
	nodeJsAvail = (function () {
		let nodeJs = false;

		// https://www.npmjs.com/package/detect-node
		// Only Node.JS has a process variable that is of [[Class]] process
		try {
			if (Object.prototype.toString.call(myGlobalThis.process) === "[object process]") {
				nodeJs = true;
			}
		} catch (e) {
			// empty
		}
		return nodeJs;
	}());

if (nodeJsAvail) {
	// examples:
	// npm run build:one
	// [ node --require ./dist/amdLoader.js dist/cpcbasicts.js sound=false ]
	// node dist/cpcbasicts.js sound=false debug=0 example=math/euler showCpc=false
	interface NodeHttps {
		get: (url: string, fn: (res: any) => void) => any
	}

	interface NodeFs {
		readFile: (name: string, encoding: string, fn: (res: any) => void) => any
	}

	(function () { // mock4nodeJS
		let https: NodeHttps, // nodeJs
			fs: NodeFs,
			module: any;

		const domElements: Record<string, any> = {},
			myCreateElement = function (id: string) {
				domElements[id] = {
					className: "",
					style: {
						borderwidth: "",
						borderStyle: ""
					},
					addEventListener: () => {}, // eslint-disable-line no-empty-function, @typescript-eslint/no-empty-function
					options: [],
					get length() {
						return domElements[id].options.length;
					}
				};
				return domElements[id];
			};

		Object.assign(window, {
			console: console,
			document: {
				addEventListener: () => {}, // eslint-disable-line no-empty-function, @typescript-eslint/no-empty-function
				getElementById: (id: string) => domElements[id] || myCreateElement(id),
				createElement: (type: string) => {
					if (type === "option") {
						return {};
					}
					Utils.console.error("createElement: unknown type", type);
					return {};
				}
			},
			AudioContext: () => { throw new Error("AudioContext not supported"); }
		});

		// eslint-disable-next-line no-eval
		const nodeExports = eval("exports"),
			view = nodeExports.View,
			setSelectOptionsOrig = view.prototype.setSelectOptions;

		view.prototype.setSelectOptions = (id: string, options: any[]) => {
			const element = domElements[id] || myCreateElement(id);

			if (!element.options.add) {
				// element.options = [];
				element.add = (option: any) => {
					// eslint-disable-next-line no-invalid-this
					element.options.push(option);
					if (element.options.length === 1 || option.selected) {
						element.value = element.options[element.options.length - 1].value;
					}
				};
			}
			return setSelectOptionsOrig(id, options);
		};

		const setAreaValueOrig = view.prototype.setAreaValue;

		view.prototype.setAreaValue = (id: string, value: string) => {
			if (id === "resultText") {
				if (value) {
					Utils.console.log(value);
				}
			}
			return setAreaValueOrig(id, value);
		};

		// https://nodejs.dev/learn/accept-input-from-the-command-line-in-nodejs
		// readline?
		const controller = nodeExports.Controller;
		// startWithDirectInputOrig = controller.prototype.startWithDirectInput;

		controller.prototype.startWithDirectInput = () => {
			Utils.console.log("We are ready.");
		};

		//

		function isUrl(s: string) {
			return s.startsWith("http"); // http or https
		}

		function fnEval(code: string) {
			return eval(code); // eslint-disable-line no-eval
		}

		function nodeReadUrl(url: string, fnDataLoaded: (error: Error | undefined, data?: string) => void) {
			if (!https) {
				fnEval('https = require("https");'); // to trick TypeScript
			}
			https.get(url, (resp) => {
				let data = "";

				// A chunk of data has been received.
				resp.on("data", (chunk: string) => {
					data += chunk;
				});

				// The whole response has been received. Print out the result.
				resp.on("end", () => {
					fnDataLoaded(undefined, data);
				});
			}).on("error", (err: Error) => {
				Utils.console.log("Error: " + err.message);
				fnDataLoaded(err);
			});
		}

		function nodeReadFile(name: string, fnDataLoaded: (error: Error | undefined, data?: string) => void) {
			if (!fs) {
				fnEval('fs = require("fs");'); // to trick TypeScript
			}

			if (!module) {
				fnEval('module = require("module");'); // to trick TypeScript
			}

			const name2 = module.path + "/" + name;

			fs.readFile(name2, "utf8", fnDataLoaded);
		}

		const utils = nodeExports.Utils;

		utils.loadScript = (fileOrUrl: string, fnSuccess: ((url2: string, key: string) => void), _fnError: ((url2: string, key: string) => void), key: string) => {
			const fnLoaded = (_error: Error | undefined, data?: string) => {
				if (data) {
					fnEval(data); // load js (for nodeJs)
				}
				fnSuccess(fileOrUrl, key);
			};

			if (isUrl(fileOrUrl)) {
				nodeReadUrl(fileOrUrl, fnLoaded);
			} else {
				nodeReadFile(fileOrUrl, fnLoaded);
			}
		};
	}());
	cpcBasic.fnOnLoad();
	Utils.console.log("End of program.");
}
