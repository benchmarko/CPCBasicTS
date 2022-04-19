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
	private static config: ConfigType = {
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
		tron: false // trace on
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

	// https://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript
	private static fnParseUri(urlQuery: string, config: ConfigType) {
		const rPlus = /\+/g, // Regex for replacing addition symbol with a space
			rSearch = /([^&=]+)=?([^&]*)/g,
			fnDecode = function (s: string) { return decodeURIComponent(s.replace(rPlus, " ")); };

		let match: RegExpExecArray | null;

		while ((match = rSearch.exec(urlQuery)) !== null) {
			const name = fnDecode(match[1]);
			let value: ConfigEntryType = fnDecode(match[2]);

			if (value !== null && config.hasOwnProperty(name)) {
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

	private static createDebugUtilsConsole(cpcBasicLog: string) {
		const currentConsole = Utils.console,
			console = {
				consoleLog: {
					value: cpcBasicLog || "" // already something collected?
				},
				console: currentConsole,
				fnMapObjectProperties: function (arg: any) {
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
				},
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
						this.consoleLog.value += args.map(this.fnMapObjectProperties).join(" ") + ((level !== null) ? "\n" : "");
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

		return console;
	}

	private static fnDoStart() {
		const startConfig = cpcBasic.config,
			externalConfig = cpcconfig || {}; // external config from cpcconfig.js

		Object.assign(startConfig, externalConfig);

		cpcBasic.model = new Model(startConfig);

		const urlQuery = window.location.search.substring(1);

		cpcBasic.fnParseUri(urlQuery, startConfig); // modify config with URL parameters

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
    interface Window { cpcBasic: cpcBasic; }
}

window.cpcBasic = cpcBasic;

window.onload = () => {
	cpcBasic.fnOnLoad();
};
