// cpcbasic.ts - CPCBasic for the Browser
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//

import { ModelPropID, ViewID } from "./Constants";
import { Utils } from "./Utils";
import { Controller } from "./Controller";
import { cpcconfig } from "./cpcconfig";
import { Model, ConfigType, ConfigEntryType } from "./Model";
import { View } from "./View";
import { NodeAdapt } from "./NodeAdapt";
import { ICpcVmRsx } from "./Interfaces";

type RedirectExamplesType = Record<string, Record<"database" | "example", string>>;

class cpcBasic {
	private static readonly config: ConfigType = {
		arrayBounds: false,
		autorun: true,
		basicVersion: "1.1", // "1.1" or "1.0"
		bench: 0, // debug: number of parse bench loops
		canvasType: "graphics", // "graphics", "text", "none"
		databaseDirs: "examples", // example base directories (comma separated)
		database: "examples", // examples, apps, saved
		debug: 0,
		example: "cpcbasic",
		exampleIndex: "0index.js", // example index for every databaseDir
		implicitLines: false, // allow implicit line numbers
		input: "", // keyboard input when starting the app
		integerOverflow: false, // check for integer overflow
		kbdLayout: "alphanum", // alphanum, alpha, num
		linesOnLoad: true, // add missing line numbers on load
		dragElements: false,
		palette: "color", // "color", "green", "grey"
		prettyBrackets: true, // pretty print: brackets
		prettyColons: true, // pretty print: colons
		prettyLowercaseVars: false, // pretty print: lowercase variables
		prettySpace: false, // pretty print: spaces
		processFileImports: true, // open ZIP, DSK files on import
		selectDataFiles: false, // select data files in example selection
		showConsoleLog: false,
		showConvert: false,
		showCpc: true,
		showDisass: false,
		showExport: false,
		showGallery: false,
		showInput: true,
		showInp2: false,
		showKbd: false,
		showKbdSettings: false,
		showMore: false,
		showOutput: false,
		showResult: false,
		showSettings: false,
		showVariable: false,
		showView: false,
		sound: true,
		speed: 100,
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

	static addIndex(dir: string, input: Record<string, unknown> | (() => void)) {
		if (typeof input === "function") {
			input = {
				[dir]: JSON.parse(this.fnHereDoc(input).trim())
			};
		}
		return cpcBasic.controller.addIndex(dir, input);
	}

	static addItem(key: string, input: string | (() => void)) {
		const inputString = (typeof input !== "string") ? this.fnHereDoc(input) : input;

		return cpcBasic.controller.addItem(key, inputString);
	}

	static addRsx(key: string, RsxConstructor: new () => ICpcVmRsx) {
		return cpcBasic.controller.addRsx(key, RsxConstructor);
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

	private static fnDecodeUri(s: string) {
		const rPlus = /\+/g; // Regex for replacing addition symbol with a space
		let decoded = "";

		try {
			decoded = decodeURIComponent(s.replace(rPlus, " "));
		} catch	(err) {
			err.message += ": " + s;
			Utils.console.error(err);
		}
		return decoded;
	}

	// https://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript
	private static fnParseUri(urlQuery: string, config: ConfigType) {
		const rSearch = /([^&=]+)=?([^&]*)/g,
			args: string[] = [];

		let match: RegExpExecArray | null;

		while ((match = rSearch.exec(urlQuery)) !== null) {
			const name = cpcBasic.fnDecodeUri(match[1]),
				value = cpcBasic.fnDecodeUri(match[2]);

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

	private static fnRedirectExamples(redirectExamples: RedirectExamplesType) {
		const name = this.model.getProperty(ModelPropID.database) + "/" + this.model.getProperty(ModelPropID.example);

		if (redirectExamples[name]) {
			this.model.setProperty(ModelPropID.database, redirectExamples[name].database);
			this.model.setProperty(ModelPropID.example, redirectExamples[name].example);
		}
	}

	private static fnDoStart() {
		const startConfig = cpcBasic.config,
			winCpcConfig = window.cpcConfig || {};

		Object.assign(startConfig, cpcconfig, winCpcConfig);

		const redirectExamples = startConfig.redirectExamples;

		delete startConfig.redirectExamples;

		cpcBasic.model = new Model(startConfig);

		// eslint-disable-next-line no-new-func
		const myGlobalThis = (typeof globalThis !== "undefined") ? globalThis : Function("return this")(); // for old IE

		if (!myGlobalThis.process) { // browser
			cpcBasic.fnParseUri(window.location.search.substring(1), startConfig);
		} else { // nodeJs
			cpcBasic.fnParseArgs(myGlobalThis.process.argv.slice(2), startConfig);
		}

		cpcBasic.view = new View();

		const debug = Number(cpcBasic.model.getProperty<number>(ModelPropID.debug));

		Utils.debug = debug;

		let UtilsConsole = Utils.console as any,
			cpcBasicLog = "";

		if (UtilsConsole.cpcBasicLog) {
			cpcBasicLog = UtilsConsole.cpcBasicLog;
			UtilsConsole.cpcBasicLog = undefined; // do not log any more to dummy console
		}

		if (Utils.debug > 0 && cpcBasic.model.getProperty<boolean>(ModelPropID.showConsoleLog)) { // console log window?
			UtilsConsole = cpcBasic.createDebugUtilsConsole(cpcBasicLog);
			Utils.console = UtilsConsole;
			Utils.console.log("CPCBasic log started at", Utils.dateFormat(new Date()));
			UtilsConsole.changeLog(View.getElementById1(ViewID.consoleLogText));
		}

		if (redirectExamples) {
			this.fnRedirectExamples(redirectExamples as unknown as Record<string, Record<"database" | "example", string>>);
		}

		cpcBasic.controller = new Controller(cpcBasic.model, cpcBasic.view);
		cpcBasic.controller.onDatabaseSelectChange(); // trigger loading example
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

if (window.Polyfills.isNodeAvailable) {
	NodeAdapt.doAdapt();
	cpcBasic.fnOnLoad();
	Utils.console.debug("End of main.");
}
