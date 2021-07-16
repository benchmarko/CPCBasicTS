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

	static addIndex(sDir: string, input: string | (() => void)) {
		if (typeof input !== "string") {
			input = this.fnHereDoc(input);
		}
		return cpcBasic.controller.addIndex(sDir, input);
	}

	static addItem(sKey: string, input: string | (() => void)) {
		const sInput = (typeof input !== "string") ? this.fnHereDoc(input) : input;

		return cpcBasic.controller.addItem(sKey, sInput);
	}

	// https://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript
	private static fnParseUri(sUrlQuery: string, oConfig: ConfigType) {
		const rPlus = /\+/g, // Regex for replacing addition symbol with a space
			rSearch = /([^&=]+)=?([^&]*)/g,
			fnDecode = function (s: string) { return decodeURIComponent(s.replace(rPlus, " ")); };

		let aMatch: RegExpExecArray | null;

		while ((aMatch = rSearch.exec(sUrlQuery)) !== null) {
			const sName = fnDecode(aMatch[1]);
			let sValue: ConfigEntryType = fnDecode(aMatch[2]);

			if (sValue !== null && oConfig.hasOwnProperty(sName)) {
				switch (typeof oConfig[sName]) {
				case "string":
					break;
				case "boolean":
					sValue = (sValue === "true");
					break;
				case "number":
					sValue = Number(sValue);
					break;
				case "object":
					break;
				default:
					break;
				}
			}
			oConfig[sName] = sValue;
		}
	}

	private static createDebugUtilsConsole(sCpcBasicLog: string) {
		const oCurrentConsole = Utils.console,
			oConsole = {
				consoleLog: {
					value: sCpcBasicLog || "" // already something collected?
				},
				console: oCurrentConsole,
				fnMapObjectProperties: function (arg: any) {
					if (typeof arg === "object") {
						const aRes = [];

						for (const sKey in arg) { // eslint-disable-line guard-for-in
							// if (arg.hasOwnProperty(sKey)) {
							const value = arg[sKey];

							if (typeof value !== "object" && typeof value !== "function") {
								aRes.push(sKey + ": " + value);
							}
						}
						arg = String(arg) + "{" + aRes.join(", ") + "}";
					}
					return arg;
				},
				rawLog: function (fnMethod: (aArgs: any) => void, sLevel: string, aArgs: any) {
					if (sLevel) {
						aArgs.unshift(sLevel);
					}
					if (fnMethod) {
						if (fnMethod.apply) {
							fnMethod.apply(console, aArgs);
						}
					}
					if (this.consoleLog) {
						this.consoleLog.value += aArgs.map(this.fnMapObjectProperties).join(" ") + ((sLevel !== null) ? "\n" : "");
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
				changeLog: function (oLog: any) {
					const oldLog = this.consoleLog;

					this.consoleLog = oLog;
					if (oldLog && oldLog.value && oLog) { // some log entires collected?
						oLog.value += oldLog.value; // take collected log entries
					}
				}
			};

		return oConsole;
	}

	private static fnDoStart() {
		const oStartConfig = cpcBasic.config,
			oExternalConfig = cpcconfig || {}; // external config from cpcconfig.js

		Object.assign(oStartConfig, oExternalConfig);

		cpcBasic.model = new Model(oStartConfig);

		const sUrlQuery = window.location.search.substring(1);

		cpcBasic.fnParseUri(sUrlQuery, oStartConfig); // modify config with URL parameters

		cpcBasic.view = new View();

		const iDebug = Number(cpcBasic.model.getProperty<number>("debug"));

		Utils.debug = iDebug;

		let UtilsConsole = Utils.console as any,
			sCpcBasicLog = "";

		if (UtilsConsole.cpcBasicLog) {
			sCpcBasicLog = UtilsConsole.cpcBasicLog;
			UtilsConsole.cpcBasicLog = undefined; // do not log any more to dummy console
		}

		if (Utils.debug > 1 && cpcBasic.model.getProperty<boolean>("showConsole")) { // console log window?
			UtilsConsole = cpcBasic.createDebugUtilsConsole(sCpcBasicLog);
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
